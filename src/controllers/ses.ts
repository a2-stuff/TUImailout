import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getConfig } from '../utils/config.js';
import type { SesProvider } from '../views/settings/AmazonSES.js';

export const sendSesEmail = async (providerName: string, from: string, to: string[], subject: string, body: string) => {
    const providers = getConfig<SesProvider[]>('sesProviders') || [];
    const provider = providers.find(p => p.name === providerName);

    // Fallback for migration edge cases if needed, but we should rely on providerName
    if (!provider) {
        throw new Error(`SES Provider "${providerName}" not found.`);
    }

    const client = new SESClient({
        region: provider.region,
        credentials: { accessKeyId: provider.accessKeyId, secretAccessKey: provider.secretAccessKey }
    });

    const command = new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: to },
        Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: body } }
        }
    });

    return await client.send(command);
};

export const testSesConnection = async (provider?: SesProvider) => {
    // If provider passed directly (during test), use it. 
    // If not, we might be testing default config or similar, but for now we expect provider object or look up from config?
    // Actually, in Settings UI we pass the provider object.
    
    // Support testing legacy global config if provider not passed? No, we migrated.
    
    if (!provider) {
         // Fallback to try global config if it still exists (pre-migration check?) 
         // But we are using this in Settings UI where we pass values.
         // Let's assume provider is passed for validation.
         throw new Error('Provider configuration is required for testing.');
    }

    const { SESClient, GetSendQuotaCommand } = await import("@aws-sdk/client-ses");
    const client = new SESClient({
        region: provider.region,
        credentials: { accessKeyId: provider.accessKeyId, secretAccessKey: provider.secretAccessKey }
    });

    await client.send(new GetSendQuotaCommand({}));
    return true;
};