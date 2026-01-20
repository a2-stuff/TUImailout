import { getConfig } from '../utils/config.js';
import type { SendGridProvider } from '../views/settings/SendGridProviders.js';

export const sendSendGridEmail = async (
    providerName: string,
    from: string,
    to: string[],
    subject: string,
    body: string
) => {
    const providers = getConfig<SendGridProvider[]>('sendGridProviders') || [];
    const provider = providers.find(p => p.name === providerName);

    if (!provider) {
        throw new Error(`SendGrid Provider "${providerName}" not found`);
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [
                {
                    to: to.map(email => ({ email }))
                }
            ],
            from: { email: from },
            subject: subject,
            content: [
                {
                    type: 'text/html',
                    value: body
                }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`SendGrid API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return true;
};

export const testSendGridConnection = async (provider: SendGridProvider) => {
    // Check scopes or simple validity
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${provider.apiKey}`
        }
    });

    if (!response.ok) {
         throw new Error(`Failed to validate SendGrid API Key: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.scopes || !Array.isArray(data.scopes)) {
         throw new Error('Invalid response from SendGrid API');
    }
    
    // Check if 'mail.send' scope exists
    if (!data.scopes.includes('mail.send')) {
        throw new Error('API Key is missing "mail.send" scope');
    }

    return true;
};
