import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { getConfig } from '../utils/config.js';

export const sendMailgunEmail = async (from: string, to: string[], subject: string, body: string) => {
    const apiKey = getConfig<string>('mailgunApiKey');
    const domain = getConfig<string>('mailgunDomain');
    const username = getConfig<string>('mailgunUsername') || 'api';

    if (!apiKey || !domain) {
        throw new Error('Missing Mailgun Credentials in Settings.');
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username, key: apiKey });

    // Mailgun batch sending usually works by passing comma separated string or array.
    return await mg.messages.create(domain, {
        from,
        to: to,
        subject,
        text: body
    });
};
