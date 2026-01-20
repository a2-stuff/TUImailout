import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { getConfig } from '../utils/config.js';
import type { MailgunProvider } from '../views/settings/Mailgun.js';

export const sendMailgunEmail = async (providerName: string, from: string, to: string[], subject: string, body: string) => {
    const providers = getConfig<MailgunProvider[]>('mailgunProviders') || [];
    const provider = providers.find(p => p.name === providerName);

    if (!provider) {
        throw new Error(`Mailgun Provider "${providerName}" not found.`);
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: provider.username, key: provider.apiKey });

    // Send as HTML email
    return await mg.messages.create(provider.domain, {
        from,
        to: to,
        subject,
        html: body
    });
};

export const testMailgunConnection = async (provider?: MailgunProvider) => {
    if (!provider) {
        throw new Error('Provider configuration is required for testing.');
    }

    const { default: Mailgun } = await import('mailgun.js');
    const { default: FormData } = await import('form-data');
    const mailgun = new Mailgun(FormData as any);
    const mg = mailgun.client({ username: provider.username, key: provider.apiKey });

    await mg.domains.get(provider.domain);
    return true;
};