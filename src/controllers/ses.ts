import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getConfig } from '../utils/config.js';

export const sendSesEmail = async (from: string, to: string[], subject: string, body: string) => {
    const accessKeyId = getConfig<string>('awsAccessKeyId');
    const secretAccessKey = getConfig<string>('awsSecretAccessKey');
    const region = getConfig<string>('awsRegion');

    if (!accessKeyId || !secretAccessKey || !region) {
        throw new Error('Missing AWS Credentials in Settings.');
    }

    const client = new SESClient({
        region,
        credentials: { accessKeyId, secretAccessKey }
    });

    const command = new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: to },
        Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: body } } // Changed from Text to Html
        }
    });

    return await client.send(command);
};

export const testSesConnection = async () => {
    const accessKeyId = getConfig<string>('awsAccessKeyId');
    const secretAccessKey = getConfig<string>('awsSecretAccessKey');
    const region = getConfig<string>('awsRegion');

    if (!accessKeyId || !secretAccessKey || !region) {
        throw new Error('Missing AWS Credentials.');
    }

    const { SESClient, GetSendQuotaCommand } = await import("@aws-sdk/client-ses");
    const client = new SESClient({
        region,
        credentials: { accessKeyId, secretAccessKey }
    });

    await client.send(new GetSendQuotaCommand({}));
    return true;
};
