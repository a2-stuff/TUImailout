import nodemailer from 'nodemailer';
import { getConfig } from '../utils/config.js';
import type { SmtpProvider } from '../views/settings/SmtpProviders.js';

export const sendSmtpEmail = async (
    providerName: string,
    from: string,
    to: string[],
    subject: string,
    body: string
) => {
    const providers = getConfig<SmtpProvider[]>('smtpProviders') || [];
    const provider = providers.find(p => p.name === providerName);

    if (!provider) {
        throw new Error(`SMTP Provider "${providerName}" not found`);
    }

    const transporter = nodemailer.createTransport({
        host: provider.host,
        port: provider.port,
        secure: provider.secure,
        auth: {
            user: provider.username,
            pass: provider.password
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,
        socketTimeout: 15000
    });

    // Verify connection configuration
    try {
        await transporter.verify();
    } catch (verifyError: any) {
        throw new Error(`SMTP Connection failed: ${verifyError.message}`);
    }

    const info = await transporter.sendMail({
        from,
        to: to.join(', '),
        subject,
        html: body
    });

    return info;
};

export const testSmtpConnection = async (provider: SmtpProvider) => {
    const nodemailer = (await import('nodemailer')).default;

    const transporter = nodemailer.createTransport({
        host: provider.host,
        port: provider.port,
        secure: provider.secure,
        auth: {
            user: provider.username,
            pass: provider.password
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000
    });

    await transporter.verify();
    return true;
};
