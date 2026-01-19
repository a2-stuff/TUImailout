import fs from 'fs';
import { sendSesEmail } from './controllers/ses.js';
import { sendMailgunEmail } from './controllers/mailgun.js';
import { sendMailchimpEmail } from './controllers/mailchimp.js';
import { getCampaign, saveCampaign } from './utils/campaigns.js';
import { parse } from 'csv-parse/sync';

const campaignId = process.argv[2];

if (!campaignId) {
    console.error('No campaign ID provided');
    process.exit(1);
}

const run = async () => {
    const campaign = getCampaign(campaignId);
    if (!campaign) {
        console.error('Campaign not found');
        process.exit(1);
    }

    try {
        campaign.status = 'running';
        saveCampaign(campaign);

        // Read Template
        const templateContent = fs.readFileSync(campaign.templatePath, 'utf-8');

        // Read List
        const listContent = fs.readFileSync(campaign.listPath, 'utf-8');
        const records: any[] = parse(listContent, {
            columns: true,
            skip_empty_lines: true
        });

        campaign.total = records.length;
        saveCampaign(campaign);

        const delayMs = (60 * 1000) / campaign.rateLimit;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const email = record.email;

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
            } catch (err: any) {
                console.error(`Failed to send to ${email}: ${err.message}`);
                // Continue despite error, maybe log it?
            }

            campaign.progress = i + 1;
            // Save progress every 1 item for better UI updates, or throttle if needed.
            saveCampaign(campaign);

            // Rate limit wait
            if (i < records.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        campaign.status = 'completed';
        saveCampaign(campaign);
        process.exit(0);

    } catch (error: any) {
        campaign.status = 'failed';
        campaign.error = error.message;
        saveCampaign(campaign);
        process.exit(1);
    }
};

run();
