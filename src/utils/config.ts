import Conf from 'conf';

interface AppSchema {
	theme: string;
	awsAccessKeyId?: string;
	awsSecretAccessKey?: string;
	awsRegion?: string;
	sesProviders?: any[];
	mailgunApiKey?: string;
	mailgunDomain?: string;
	mailgunUsername?: string;
	mailgunProviders?: any[];
	mailchimpApiKey?: string;
	mailchimpProviders?: any[];
	fromEmails?: string[];
	smtpProviders?: any[];
	sendGridProviders?: any[];
}

const config = new Conf<AppSchema>({
	projectName: 'tuimailout',
	defaults: {
		theme: 'default',
		fromEmails: [],
		smtpProviders: [],
		sendGridProviders: [],
		sesProviders: [],
		mailgunProviders: [],
		mailchimpProviders: []
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
	const providers = config.get('sesProviders');
	return !!(providers && providers.length > 0) || !!(config.get('awsAccessKeyId') && config.get('awsSecretAccessKey') && config.get('awsRegion'));
};

export const isMailgunConfigured = (): boolean => {
	const providers = config.get('mailgunProviders');
	return !!(providers && providers.length > 0) || !!(config.get('mailgunApiKey') && config.get('mailgunDomain'));
};

export const isMailchimpConfigured = (): boolean => {
	const providers = config.get('mailchimpProviders');
	return !!(providers && providers.length > 0) || !!(config.get('mailchimpApiKey'));
};

export const isSmtpConfigured = (): boolean => {
	const providers = config.get('smtpProviders');
	return !!(providers && providers.length > 0);
};

export const isSendGridConfigured = (): boolean => {
	const providers = config.get('sendGridProviders');
	return !!(providers && providers.length > 0);
};

export default config;
