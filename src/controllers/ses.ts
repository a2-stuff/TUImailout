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
            Body: { Text: { Data: body } }
        }
    });

    return await client.send(command);
};
