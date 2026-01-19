export enum ViewName {
    HOME = 'HOME',
    MANUAL_MENU = 'MANUAL_MENU',
    SEND_SES = 'SEND_SES',
    SEND_MAILGUN = 'SEND_MAILGUN',
    CAMPAIGN_SETUP = 'CAMPAIGN_SETUP',
    CAMPAIGN_MONITOR = 'CAMPAIGN_MONITOR',
    SETTINGS = 'SETTINGS',
    SETTINGS_SES = 'SETTINGS_SES',
    SETTINGS_MAILGUN = 'SETTINGS_MAILGUN',
    SETTINGS_MAILCHIMP = 'SETTINGS_MAILCHIMP',
    SEND_MAILCHIMP = 'SEND_MAILCHIMP',
    SETTINGS_FROM_EMAILS = 'SETTINGS_FROM_EMAILS',
    INFO = 'INFO',
    EXIT = 'EXIT',
}

export interface Campaign {
    id: string;
    name: string;
    templatePath: string;
    listPath: string;
    provider: 'ses' | 'mailgun' | 'mailchimp';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
    progress: number;
    total: number;
    rateLimit: number; // emails per minute
    startTime: number;
    from: string;
    error?: string;
}