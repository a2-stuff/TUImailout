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

    // Intelligent SSL handling:
    // If port is 587 (STARTTLS) or 25, we MUST connect in plain text first, then upgrade.
    // Nodemailer's 'secure: true' means "Connect using SSL immediately", which fails on 587.
    const isStartTlsPort = provider.port === 587 || provider.port === 25;
    const secure = isStartTlsPort ? false : provider.secure;

    const transporter = nodemailer.createTransport({
        host: provider.host,
        port: provider.port,
        secure: secure,
        requireTLS: isStartTlsPort, // Force TLS upgrade on 587/25
        auth: {
            user: provider.username,
            pass: provider.password
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,
        socketTimeout: 15000,
        tls: {
            // Do not fail on invalid certs for self-signed or internal servers if needed, 
            // but for now keeping it strict.
            evaluateResult: () => undefined
        }
    } as any);

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

    const isStartTlsPort = provider.port === 587 || provider.port === 25;
    const secure = isStartTlsPort ? false : provider.secure;

    const transporter = nodemailer.createTransport({
        host: provider.host,
        port: provider.port,
        secure: secure,
        requireTLS: isStartTlsPort,
        auth: {
            user: provider.username,
            pass: provider.password
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000,
        tls: { evaluateResult: () => undefined }
    } as any);

    await transporter.verify();
    return true;
};
