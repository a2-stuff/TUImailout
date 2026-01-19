import fs from 'fs';
import { sendSesEmail } from './controllers/ses.js';
import { sendMailgunEmail } from './controllers/mailgun.js';
import { sendMailchimpEmail } from './controllers/mailchimp.js';
import { getCampaign, saveCampaign } from './utils/campaigns.js';
import { parse } from 'csv-parse/sync';
import { logInfo, logSuccess, logError, LogCategory } from './utils/logger.js';

const campaignId = process.argv[2];

if (!campaignId) {
    logError(LogCategory.CAMPAIGN, 'Worker started without campaign ID');
    console.error('No campaign ID provided');
    process.exit(1);
}

const run = async () => {
    const campaign = getCampaign(campaignId);
    if (!campaign) {
        logError(LogCategory.CAMPAIGN, 'Campaign not found', { campaignId });
        console.error('Campaign not found');
        process.exit(1);
    }

    logInfo(LogCategory.CAMPAIGN, `Starting campaign: ${campaign.name}`, { campaignId });

    try {
        campaign.status = 'running';
        saveCampaign(campaign);

        // Read Template
        const templateContent = fs.readFileSync(campaign.templatePath, 'utf-8');
        logInfo(LogCategory.CAMPAIGN, `Template loaded: ${campaign.templatePath}`);

        // Read List with flexible column handling
        const listContent = fs.readFileSync(campaign.listPath, 'utf-8');

        let records: any[] = [];
        try {
            records = parse(listContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true // Allow rows with fewer columns than header
            });
        } catch (csvError: any) {
            const errorMsg = `CSV Parse Error: ${csvError.message}. Please check your CSV file format.`;
            logError(LogCategory.CAMPAIGN, errorMsg, {
                file: campaign.listPath,
                error: csvError.message
            });
            throw new Error(errorMsg);
        }

        if (records.length === 0) {
            const errorMsg = 'No records found in CSV file';
            logError(LogCategory.CAMPAIGN, errorMsg, { file: campaign.listPath });
            throw new Error(errorMsg);
        }

        campaign.total = records.length;
        saveCampaign(campaign);
        logInfo(LogCategory.CAMPAIGN, `Loaded ${records.length} recipients`);

        const delayMs = (60 * 1000) / campaign.rateLimit;
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const email = record.email;

            if (!email) {
                logError(LogCategory.EMAIL, `Missing email in record ${i + 1}`, { record });
                failedCount++;
                continue;
            }

            // Simple personalization (replace {{name}})
            let body = templateContent;
            Object.keys(record).forEach((key: string) => {
                body = body.replace(new RegExp(`{{${key}}}`, 'g'), record[key]);
            });

            try {
                if (campaign.provider === 'ses') {
                    await sendSesEmail(campaign.from, [email], campaign.name, body);
                } else if (campaign.provider === 'mailgun') {
                    await sendMailgunEmail(campaign.from, [email], campaign.name, body);
                } else {
                    await sendMailchimpEmail(campaign.from, [email], campaign.name, body);
                }
                sentCount++;
                logInfo(LogCategory.EMAIL, `Sent to ${email}`, {
                    campaign: campaign.name,
                    recipient: email
                });
            } catch (err: any) {
                failedCount++;
                const errorMsg = `Failed to send to ${email}: ${err.message}`;
                logError(LogCategory.EMAIL, errorMsg, {
                    campaign: campaign.name,
                    recipient: email,
                    error: err.message
                });
                console.error(errorMsg);
            }

            campaign.progress = i + 1;
            saveCampaign(campaign);

            // Rate limit wait
            if (i < records.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        campaign.status = 'completed';
        saveCampaign(campaign);

        logSuccess(LogCategory.CAMPAIGN, `Campaign completed: ${campaign.name}`, {
            campaignId,
            sent: sentCount,
            failed: failedCount,
            total: records.length
        });

        process.exit(0);

    } catch (error: any) {
        campaign.status = 'failed';
        campaign.error = error.message;
        saveCampaign(campaign);

        logError(LogCategory.CAMPAIGN, `Campaign failed: ${campaign.name}`, {
            campaignId,
            error: error.message,
            stack: error.stack
        });

        console.error('Campaign failed:', error.message);
        process.exit(1);
    }
};

run();
