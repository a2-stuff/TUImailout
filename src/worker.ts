import fs from 'fs';
import { sendSesEmail, testSesConnection } from './controllers/ses.js';
import { sendMailgunEmail, testMailgunConnection } from './controllers/mailgun.js';
import { sendMailchimpEmail, testMailchimpConnection } from './controllers/mailchimp.js';
import { sendSmtpEmail, testSmtpConnection } from './controllers/smtp.js';
import { getCampaign, saveCampaign } from './utils/campaigns.js';
import { getConfig } from './utils/config.js';
import { parse } from 'csv-parse/sync';
import { logInfo, logSuccess, logError, LogCategory } from './utils/logger.js';
import type { SmtpProvider } from './views/settings/SmtpProviders.js';

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

        // Validate Provider Connection
        logInfo(LogCategory.CAMPAIGN, `Validating provider connection: ${campaign.provider}`, { campaignId });
        try {
            if (campaign.provider === 'ses') {
                await testSesConnection();
            } else if (campaign.provider === 'mailgun') {
                await testMailgunConnection();
            } else if (campaign.provider === 'mailchimp') {
                await testMailchimpConnection();
            } else if (campaign.provider === 'smtp') {
                const providers = getConfig<SmtpProvider[]>('smtpProviders') || [];
                const provider = providers.find(p => p.name === campaign.smtpProviderName);
                if (!provider) {
                    throw new Error(`SMTP Provider "${campaign.smtpProviderName}" not found in configuration`);
                }
                await testSmtpConnection(provider);
            }
            logInfo(LogCategory.CAMPAIGN, `Provider connection validated`, { campaignId });
        } catch (connError: any) {
            const errorMsg = `Connection Validation Failed: ${connError.message}`;
            logError(LogCategory.CAMPAIGN, errorMsg, {
                campaignId,
                provider: campaign.provider,
                error: connError.message
            });
            throw new Error(errorMsg);
        }

        campaign.total = records.length;
        saveCampaign(campaign);
        logInfo(LogCategory.CAMPAIGN, `Loaded ${records.length} recipients`);

        let sentCount = 0;
        let failedCount = 0;

        const burstSize = campaign.rateLimit;
        const windowDurationMs = 5 * 60 * 1000;

        while (sentCount < records.length) {
            const windowStartTime = Date.now();
            logInfo(LogCategory.CAMPAIGN, `Starting new 5-minute window for bursty sending`, { campaignId, windowStartTime });

            // Pick 2 random timestamps within the window (leaving 1 min margin at the end for final burst processing)
            const marginMs = 60 * 1000;
            const t1 = Math.floor(Math.random() * (windowDurationMs - marginMs));
            const t2 = Math.floor(Math.random() * (windowDurationMs - marginMs));
            const burstDelays = [t1, t2].sort((a, b) => a - b);

            for (const delay of burstDelays) {
                if (sentCount >= records.length) break;

                const targetTime = windowStartTime + delay;
                const currentWait = targetTime - Date.now();

                if (currentWait > 0) {
                    logInfo(LogCategory.CAMPAIGN, `Waiting ${Math.round(currentWait / 1000)}s for next random burst...`, { campaignId });
                    await new Promise(resolve => setTimeout(resolve, currentWait));
                }

                logInfo(LogCategory.CAMPAIGN, `Executing burst of ${burstSize} emails...`, { campaignId, burstSize });

                for (let b = 0; b < burstSize && sentCount < records.length; b++) {
                    const record = records[sentCount];
                    const email = record.email;

                    if (!email) {
                        logError(LogCategory.EMAIL, `Missing email in record ${sentCount + 1}`, { record });
                        failedCount++;
                        sentCount++;
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
                        } else if (campaign.provider === 'mailchimp') {
                            await sendMailchimpEmail(campaign.from, [email], campaign.name, body);
                        } else if (campaign.provider === 'smtp') {
                            await sendSmtpEmail(campaign.smtpProviderName!, campaign.from, [email], campaign.name, body);
                        }
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

                    sentCount++;
                    campaign.progress = sentCount;
                    saveCampaign(campaign);

                    // Small 200ms pause between emails in a burst to be safe
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // After bursts, wait for the remainder of the 5-minute window before starting next cycle
            if (sentCount < records.length) {
                const timeLeftInWindow = (windowStartTime + windowDurationMs) - Date.now();
                if (timeLeftInWindow > 0) {
                    logInfo(LogCategory.CAMPAIGN, `Window complete. Waiting ${Math.round(timeLeftInWindow / 1000)}s for next window...`, { campaignId });
                    await new Promise(resolve => setTimeout(resolve, timeLeftInWindow));
                }
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
