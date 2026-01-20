import fs from 'fs';
import { sendSesEmail, testSesConnection } from './controllers/ses.js';
import { sendMailgunEmail, testMailgunConnection } from './controllers/mailgun.js';
import { sendMailchimpEmail, testMailchimpConnection } from './controllers/mailchimp.js';
import { sendSmtpEmail, testSmtpConnection } from './controllers/smtp.js';
import { sendSendGridEmail, testSendGridConnection } from './controllers/sendgrid.js';
import { getCampaign, saveCampaign } from './utils/campaigns.js';
import { getConfig } from './utils/config.js';
import { parse } from 'csv-parse/sync';
import { logInfo, logSuccess, logError, LogCategory } from './utils/logger.js';
import type { SmtpProvider } from './views/settings/SmtpProviders.js';
import type { SendGridProvider } from './views/settings/SendGridProviders.js';
import type { SesProvider } from './views/settings/AmazonSES.js';
import type { MailgunProvider } from './views/settings/Mailgun.js';
import type { MailchimpProvider } from './views/settings/Mailchimp.js';

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

    if (['completed', 'failed', 'cancelled'].includes(campaign.status)) {
        logInfo(LogCategory.CAMPAIGN, `Campaign is already in terminal state: ${campaign.status}. Aborting worker start.`, { campaignId });
        console.log(`Campaign is already ${campaign.status}.`);
        process.exit(0);
    }

    try {
        // Status update moved to after start time check

        // Read Template
        const templateContent = fs.readFileSync(campaign.templatePath, 'utf-8');
        logInfo(LogCategory.CAMPAIGN, `Template loaded: ${campaign.templatePath}`);

        // Read List with flexible column handling
        const listContent = fs.readFileSync(campaign.listPath, 'utf-8');

        let records: any[] = [];
        try {
            records = parse(listContent, {
                columns: (header: string[]) => {
                    return header.map(column => column.trim().replace(/^['"]|['"]$/g, ''));
                },
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true
            });

            // Post-processing to clean values
            records = records.map(record => {
                const newRecord: any = {};
                Object.keys(record).forEach(key => {
                    let val = record[key];
                    if (typeof val === 'string') {
                        val = val.replace(/^'|'$/g, '');
                        val = val.replace(/^"|"$/g, '');
                    }
                    newRecord[key] = val;
                });
                return newRecord;
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

        // Wait for scheduled start time
        if (campaign.startTime > Date.now()) {
            const delay = campaign.startTime - Date.now();
            logInfo(LogCategory.CAMPAIGN, `Campaign scheduled for future execution. Waiting ${(delay / 1000 / 60).toFixed(1)} minutes...`, { campaignId });
            
            // Set status to 'scheduled' if it was pending
            if (campaign.status === 'pending') {
                campaign.status = 'scheduled';
                saveCampaign(campaign, false);
            }

            // We use a loop with short sleeps to allow for cancellation during wait
            while (Date.now() < campaign.startTime) {
                const currentCampaign = getCampaign(campaignId);
                if (!currentCampaign || ['cancelled', 'completed', 'failed', 'stopped'].includes(currentCampaign.status)) {
                    logInfo(LogCategory.CAMPAIGN, `Campaign stopped externally while waiting (status: ${currentCampaign?.status}).`, { campaignId });
                    process.exit(0);
                }
                // Sleep 10s
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            
            logInfo(LogCategory.CAMPAIGN, `Scheduled time reached. Starting campaign...`, { campaignId });
            campaign.status = 'running';
            saveCampaign(campaign, false);
        } else {
            campaign.status = 'running';
            saveCampaign(campaign, false);
        }

        // Validate Provider Connection & Get Rate Limits
        logInfo(LogCategory.CAMPAIGN, `Validating provider connection: ${campaign.provider}`, { campaignId });
        
        let rateLimitCount = 200;
        let rateLimitPeriod = 24;

        try {
            if (campaign.provider === 'ses') {
                const providers = getConfig<SesProvider[]>('sesProviders') || [];
                const provider = providers.find(p => p.name === campaign.sesProviderName);
                if (!provider) throw new Error(`SES Provider "${campaign.sesProviderName}" not found`);
                await testSesConnection(provider);
                rateLimitCount = provider.rateLimitCount || 200;
                rateLimitPeriod = provider.rateLimitPeriod || 24;
            } else if (campaign.provider === 'mailgun') {
                const providers = getConfig<MailgunProvider[]>('mailgunProviders') || [];
                const provider = providers.find(p => p.name === campaign.mailgunProviderName);
                if (!provider) throw new Error(`Mailgun Provider "${campaign.mailgunProviderName}" not found`);
                await testMailgunConnection(provider);
                rateLimitCount = provider.rateLimitCount || 200;
                rateLimitPeriod = provider.rateLimitPeriod || 24;
            } else if (campaign.provider === 'mailchimp') {
                const providers = getConfig<MailchimpProvider[]>('mailchimpProviders') || [];
                const provider = providers.find(p => p.name === campaign.mailchimpProviderName);
                if (!provider) throw new Error(`Mailchimp Provider "${campaign.mailchimpProviderName}" not found`);
                await testMailchimpConnection(provider);
                rateLimitCount = provider.rateLimitCount || 200;
                rateLimitPeriod = provider.rateLimitPeriod || 24;
            } else if (campaign.provider === 'smtp') {
                const providers = getConfig<SmtpProvider[]>('smtpProviders') || [];
                const provider = providers.find(p => p.name === campaign.smtpProviderName);
                if (!provider) throw new Error(`SMTP Provider "${campaign.smtpProviderName}" not found`);
                await testSmtpConnection(provider);
                rateLimitCount = provider.rateLimitCount || 200;
                rateLimitPeriod = provider.rateLimitPeriod || 24;
            } else if (campaign.provider === 'sendgrid') {
                const providers = getConfig<SendGridProvider[]>('sendGridProviders') || [];
                const provider = providers.find(p => p.name === campaign.sendGridProviderName);
                if (!provider) throw new Error(`SendGrid Provider "${campaign.sendGridProviderName}" not found`);
                await testSendGridConnection(provider);
                rateLimitCount = provider.rateLimitCount || 200;
                rateLimitPeriod = provider.rateLimitPeriod || 24;
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
        saveCampaign(campaign, false);
        logInfo(LogCategory.CAMPAIGN, `Loaded ${records.length} recipients`);

        let sentCount = 0;
        let failedCount = 0;

        // Calculate burst parameters based on rate limit
        // Current logic: 5 minute windows with 2 bursts
        // Rate Limit: X emails every Y hours
        // Emails per 5 mins = (X / (Y * 60)) * 5
        const providerEmailsPer5Mins = (rateLimitCount / (rateLimitPeriod * 60)) * 5;
        const campaignEmailsPer5Mins = (campaign.rateLimitPerMinute || 60) * 5;

        // Take the stricter limit
        const targetEmailsPer5Mins = Math.min(providerEmailsPer5Mins, campaignEmailsPer5Mins);
        
        let burstSize = Math.max(1, Math.floor(targetEmailsPer5Mins));
        
        let windowDurationMs = 5 * 60 * 1000;
        
        // If target speed is very low (less than 1 email per 5 mins), adjust window
        if (targetEmailsPer5Mins < 1) {
            // Recalculate effective emails per minute based on the stricter limit
            const effectivePerMinute = Math.min(
                rateLimitCount / (rateLimitPeriod * 60),
                campaign.rateLimitPerMinute || 60
            );
            windowDurationMs = Math.ceil((1 / effectivePerMinute) * 60 * 1000);
            burstSize = 1;
        }

        logInfo(LogCategory.CAMPAIGN, `Rate Config -> Provider: ${rateLimitCount}/${rateLimitPeriod}h, Campaign: ${campaign.rateLimitPerMinute}/min. Effective Window: ${Math.round(windowDurationMs/1000)}s, Burst: ${burstSize}`);

        while (sentCount < records.length) {
            const windowStartTime = Date.now();
            logInfo(LogCategory.CAMPAIGN, `Starting new window for bursty sending`, { campaignId, windowStartTime });

            // Pick 2 random timestamps within the window (leaving margin)
            // If burstSize is small (1), just pick 1 timestamp
            const marginMs = Math.min(60 * 1000, windowDurationMs * 0.1); // 10% or 1 min margin
            
            const burstDelays: number[] = [];
            if (burstSize === 1) {
                 const t1 = Math.floor(Math.random() * (windowDurationMs - marginMs));
                 burstDelays.push(t1);
            } else {
                 const t1 = Math.floor(Math.random() * (windowDurationMs - marginMs));
                 const t2 = Math.floor(Math.random() * (windowDurationMs - marginMs));
                 burstDelays.push(...[t1, t2].sort((a, b) => a - b));
            }

            // Split burstSize across the delays
            // If burstSize = 1, send 1.
            // If burstSize > 1, split roughly evenly.
            const emailsPerBurst = Math.ceil(burstSize / burstDelays.length);

            let emailsInWindowSent = 0;

            for (const delay of burstDelays) {
                const currentCampaign = getCampaign(campaignId);
                if (!currentCampaign || ['cancelled', 'completed', 'failed'].includes(currentCampaign.status)) {
                    logInfo(LogCategory.CAMPAIGN, `Campaign stopped externally (status: ${currentCampaign?.status}). Stopping worker.`, { campaignId });
                    process.exit(0);
                }

                if (sentCount >= records.length || emailsInWindowSent >= burstSize) break;

                const targetTime = windowStartTime + delay;
                const currentWait = targetTime - Date.now();

                if (currentWait > 0) {
                    logInfo(LogCategory.CAMPAIGN, `Waiting ${Math.round(currentWait / 1000)}s for burst...`, { campaignId });
                    await new Promise(resolve => setTimeout(resolve, currentWait));
                }

                const afterWaitCampaign = getCampaign(campaignId);
                if (!afterWaitCampaign || ['cancelled', 'completed', 'failed'].includes(afterWaitCampaign.status)) {
                    logInfo(LogCategory.CAMPAIGN, `Campaign stopped externally during wait (status: ${afterWaitCampaign?.status}). Stopping worker.`, { campaignId });
                    process.exit(0);
                }

                const currentBatchSize = Math.min(emailsPerBurst, burstSize - emailsInWindowSent, records.length - sentCount);
                if (currentBatchSize <= 0) break;

                logInfo(LogCategory.CAMPAIGN, `Executing burst of ${currentBatchSize} emails...`, { campaignId });

                for (let b = 0; b < currentBatchSize; b++) {
                    const record = records[sentCount];
                    const emailKey = Object.keys(record).find(k => k.toLowerCase() === 'email');
                    const email = emailKey ? record[emailKey] : null;

                    if (!email) {
                        logError(LogCategory.EMAIL, `Missing email in record ${sentCount + 1}`, { record });
                        failedCount++;
                        sentCount++;
                        continue;
                    }

                    let body = templateContent;
                    Object.keys(record).forEach((key: string) => {
                        body = body.replace(new RegExp(`{{${key}}}`, 'g'), record[key]);
                    });

                    try {
                        if (campaign.provider === 'ses') {
                            await sendSesEmail(campaign.sesProviderName!, campaign.from, [email], campaign.subject, body);
                        } else if (campaign.provider === 'mailgun') {
                            await sendMailgunEmail(campaign.mailgunProviderName!, campaign.from, [email], campaign.subject, body);
                        } else if (campaign.provider === 'mailchimp') {
                            await sendMailchimpEmail(campaign.mailchimpProviderName!, campaign.from, [email], campaign.subject, body);
                        } else if (campaign.provider === 'smtp') {
                            await sendSmtpEmail(campaign.smtpProviderName!, campaign.from, [email], campaign.subject, body);
                        } else if (campaign.provider === 'sendgrid') {
                            await sendSendGridEmail(campaign.sendGridProviderName!, campaign.from, [email], campaign.subject, body);
                        }
                        logInfo(LogCategory.EMAIL, `Sent to ${email}`, {
                            campaign: campaign.name,
                            recipient: email
                        });
                    } catch (err: any) {
                        failedCount++;
                        // Increment rejected count in campaign object (though we only save 'failedCount' logic usually, let's update the persistent object)
                        // Note: We need to reload campaign object before saving if we want to be safe, but here we are in a loop.
                        // Actually, we re-read campaign status at start of burst loop.
                        // Let's just update the local campaign object properties which will be saved.
                        if (!campaign.rejected) campaign.rejected = 0;
                        campaign.rejected++;
                        
                        const errorMsg = `Failed to send to ${email}: ${err.message}`;
                        logError(LogCategory.EMAIL, errorMsg, {
                            campaign: campaign.name,
                            recipient: email,
                            error: err.message
                        });
                        console.error(errorMsg);
                    }

                    sentCount++;
                    emailsInWindowSent++;
                    campaign.progress = sentCount;
                    saveCampaign(campaign, false);

                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

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
