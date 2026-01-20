import mailchimpTx from '@mailchimp/mailchimp_transactional';
import { getConfig } from '../utils/config.js';
import type { MailchimpProvider } from '../views/settings/Mailchimp.js';

export const sendMailchimpEmail = async (providerName: string, from: string, to: string[], subject: string, body: string) => {
    const providers = getConfig<MailchimpProvider[]>('mailchimpProviders') || [];
    const provider = providers.find(p => p.name === providerName);

    if (!provider) {
        throw new Error(`Mailchimp Provider "${providerName}" not found.`);
    }

    const client = mailchimpTx(provider.apiKey);

    const message = {
        html: body,
        subject: subject,
        from_email: from,
        to: to.map(email => ({ email, type: 'to' }))
    };

    const response = await client.messages.send({
        message
    });

    const status = response[0]?.status;
    if (status === 'rejected' || status === 'invalid') {
        throw new Error(`Mailchimp rejected email: ${response[0]?.reject_reason}`);
    }

    return response;
};

export const testMailchimpConnection = async (provider?: MailchimpProvider) => {
    if (!provider) {
        throw new Error('Provider configuration is required for testing.');
    }

    const { default: mailchimpTx } = await import('@mailchimp/mailchimp_transactional');
    const client = (mailchimpTx as any)(provider.apiKey);

    const response = await client.users.ping();
    if (response === 'PONG!') {
        return true;
    }
    throw new Error('Mailchimp ping failed.');
};