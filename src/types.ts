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
    provider: 'ses' | 'mailgun' | 'mailchimp' | 'smtp';
    smtpProviderName?: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped' | 'cancelled';
    progress: number;
    total: number;
    rateLimit: number; // emails per minute
    startTime: number;
    from: string;
    error?: string;
}