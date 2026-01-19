import Conf from 'conf';

interface AppSchema {
	theme: string;
	awsAccessKeyId?: string;
	awsSecretAccessKey?: string;
	awsRegion?: string;
	mailgunApiKey?: string;
	mailgunDomain?: string;
	mailgunUsername?: string;
	mailchimpApiKey?: string;
	fromEmails?: string[];
	smtpProviders?: any[];
}

const config = new Conf<AppSchema>({
	projectName: 'tuimailout',
	defaults: {
		theme: 'default',
		fromEmails: [],
		smtpProviders: []
	}
});

export const saveConfig = (key: keyof AppSchema, value: any) => {
	config.set(key, value);
};

export const getConfig = <T>(key: keyof AppSchema): T | undefined => {
	return config.get(key) as T;
};

export const getAllConfig = (): AppSchema => {
	return config.store;
}

export const isSesConfigured = (): boolean => {
	return !!(config.get('awsAccessKeyId') && config.get('awsSecretAccessKey') && config.get('awsRegion'));
};

export const isMailgunConfigured = (): boolean => {
	return !!(config.get('mailgunApiKey') && config.get('mailgunDomain'));
};

export const isMailchimpConfigured = (): boolean => {
	return !!(config.get('mailchimpApiKey'));
};

export const isSmtpConfigured = (): boolean => {
	const providers = config.get('smtpProviders');
	return !!(providers && providers.length > 0);
};

export default config;
