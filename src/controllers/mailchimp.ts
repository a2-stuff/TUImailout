import mailchimpTx from '@mailchimp/mailchimp_transactional';
import { getConfig } from '../utils/config.js';

export const sendMailchimpEmail = async (from: string, to: string[], subject: string, body: string) => {
    const apiKey = getConfig<string>('mailchimpApiKey');

    if (!apiKey) {
        throw new Error('Missing Mailchimp API Key in Settings.');
    }

    const client = mailchimpTx(apiKey);

    const message = {
        html: body, // Changed from 'text' to 'html'
        subject: subject,
        from_email: from,
        to: to.map(email => ({ email, type: 'to' }))
    };

    const response = await client.messages.send({
        message
    });

    // Check for rejection in response if needed, but usually it returns status
    // Response is an array of objects for each recipient
    const status = response[0]?.status;
    if (status === 'rejected' || status === 'invalid') {
        throw new Error(`Mailchimp rejected email: ${response[0]?.reject_reason}`);
    }

    return response;
};
