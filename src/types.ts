export enum ViewName {
    HOME = 'HOME',
    MANUAL_MENU = 'MANUAL_MENU',
    LISTS = 'LISTS',
    CAMPAIGN_SETUP = 'CAMPAIGN_SETUP',
    CAMPAIGN_MONITOR = 'CAMPAIGN_MONITOR',
    SETTINGS = 'SETTINGS',
    INFO = 'INFO',
    LOGS = 'LOGS',
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