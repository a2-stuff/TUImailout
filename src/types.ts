export enum ViewName {
    HOME = 'HOME',
    MANUAL_MENU = 'MANUAL_MENU',
    LISTS = 'LISTS',
    CAMPAIGN_SETUP = 'CAMPAIGN_SETUP',
    CAMPAIGN_MONITOR = 'CAMPAIGN_MONITOR',
    SETTINGS = 'SETTINGS',
    INFO = 'INFO',
    LOGS = 'LOGS',
    TEMPLATES = 'TEMPLATES',
    EXIT = 'EXIT',
}

export interface Campaign {
    id: string;
    name: string;
    templatePath: string;
    listPath: string;
    provider: 'ses' | 'mailgun' | 'mailchimp' | 'smtp' | 'sendgrid';
    smtpProviderName?: string;
    sendGridProviderName?: string;
    sesProviderName?: string;
    mailgunProviderName?: string;
    mailchimpProviderName?: string;
    status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'stopped' | 'cancelled';
    progress: number;
    total: number;
    startTime: number;
    rateLimitPerMinute: number;
    from: string;
    subject: string;
    rejected: number;
    opened: number;
    error?: string;
}