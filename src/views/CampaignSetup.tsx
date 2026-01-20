import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import BigText from 'ink-big-text';
import { ViewName, type Campaign } from '../types.js';
import { type Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { saveCampaign } from '../utils/campaigns.js';
import { isSesConfigured, isMailgunConfigured, isMailchimpConfigured, isSmtpConfigured, isSendGridConfigured, getConfig } from '../utils/config.js';
import FromSelector from '../components/FromSelector.js';
import ScheduledTimeInput from '../components/ScheduledTimeInput.js';
import type { SmtpProvider } from './settings/SmtpProviders.js';
import type { SendGridProvider } from './settings/SendGridProviders.js';
import type { SesProvider } from './settings/AmazonSES.js';
import type { MailgunProvider } from './settings/Mailgun.js';
import type { MailchimpProvider } from './settings/Mailchimp.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const CampaignSetup: React.FC<Props> = ({ setView, theme }) => {
    const [step, setStep] = useState(0);
    const [templates, setTemplates] = useState<any[]>([]);
    const [lists, setLists] = useState<any[]>([]);

    // Form Data
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedList, setSelectedList] = useState('');
    const [provider, setProvider] = useState<'ses' | 'mailgun' | 'mailchimp' | 'smtp' | 'sendgrid'>('ses');

    // Provider Specific Selections
    const [smtpProviderName, setSmtpProviderName] = useState('');
    const [sendGridProviderName, setSendGridProviderName] = useState('');
    const [sesProviderName, setSesProviderName] = useState('');
    const [mailgunProviderName, setMailgunProviderName] = useState('');
    const [mailchimpProviderName, setMailchimpProviderName] = useState('');

    const [campaignRateLimit, setCampaignRateLimit] = useState('5'); // Emails per minute
    const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
    const [scheduledTime, setScheduledTime] = useState('');

    const [campaignName, setCampaignName] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [fromEmail, setFromEmail] = useState('');

    useInput((input, key) => {
        if (key.escape || input === 'q' || input === 'Q') {
            // If in a later step, go back one step
            if (step > 0) {
                setStep(step - 1);
            } else {
                // If at the start, exit
                setView(ViewName.HOME);
            }
        }
    });

    useEffect(() => {
        // Load templates
        const tplDir = path.join(process.cwd(), 'templates');
        if (fs.existsSync(tplDir)) {
            const dirs = fs.readdirSync(tplDir).filter(f => fs.statSync(path.join(tplDir, f)).isDirectory());
            const valid = dirs.filter(d => fs.existsSync(path.join(tplDir, d, 'index.html')));
            setTemplates(valid.map(v => ({ label: v, value: path.join(tplDir, v, 'index.html') })));
        }

        // Load lists
        const listDir = path.join(process.cwd(), 'lists');
        if (fs.existsSync(listDir)) {
            const files = fs.readdirSync(listDir).filter(f => f.endsWith('.csv'));
            setLists(files.map(f => ({ label: f, value: path.join(listDir, f) })));
        }
    }, []);

    const startCampaign = () => {
        const id = uuidv4();
        let startTime = Date.now();

        if (scheduleType === 'scheduled' && scheduledTime) {
            // Simple parsing for "Minutes from now" or ISO string could be complex.
            // Let's assume input is "Minutes from now" for simplicity in TUI, 
            // or we try to parse it as a date string if it contains ':' or '-'.
            if (scheduledTime.includes(':') || scheduledTime.includes('-')) {
                const parsed = Date.parse(scheduledTime);
                if (!isNaN(parsed)) startTime = parsed;
            } else {
                // Treat as minutes
                const mins = parseInt(scheduledTime);
                if (!isNaN(mins)) startTime += mins * 60 * 1000;
            }
        }

        const newCampaign: Campaign = {
            id,
            name: campaignName || 'Untitled Campaign',
            templatePath: selectedTemplate,
            listPath: selectedList,
            provider,
            smtpProviderName: provider === 'smtp' ? smtpProviderName : undefined,
            sendGridProviderName: provider === 'sendgrid' ? sendGridProviderName : undefined,
            sesProviderName: provider === 'ses' ? sesProviderName : undefined,
            mailgunProviderName: provider === 'mailgun' ? mailgunProviderName : undefined,
            mailchimpProviderName: provider === 'mailchimp' ? mailchimpProviderName : undefined,
            status: startTime > Date.now() ? 'scheduled' : 'pending',
            progress: 0,
            total: 0,
            startTime: startTime,
            rateLimitPerMinute: parseInt(campaignRateLimit) || 5,
            from: fromEmail,
            subject: emailSubject,
            rejected: 0,
            opened: 0
        };

        saveCampaign(newCampaign);

        const workerPath = path.join(__dirname, '..', 'worker.js');
        const child = spawn('node', [workerPath, id], {
            detached: true,
            stdio: 'ignore'
        });

        child.unref();

        setView(ViewName.CAMPAIGN_MONITOR);
    };

    const getProviderRateInfo = () => {
        let count = 0;
        let period = 0;
        if (provider === 'smtp') {
            const p = (getConfig<SmtpProvider[]>('smtpProviders') || []).find(p => p.name === smtpProviderName);
            if (p) { count = p.rateLimitCount; period = p.rateLimitPeriod; }
        } else if (provider === 'ses') {
            const p = (getConfig<SesProvider[]>('sesProviders') || []).find(p => p.name === sesProviderName);
            if (p) { count = p.rateLimitCount; period = p.rateLimitPeriod; }
        } else if (provider === 'mailgun') {
            const p = (getConfig<MailgunProvider[]>('mailgunProviders') || []).find(p => p.name === mailgunProviderName);
            if (p) { count = p.rateLimitCount; period = p.rateLimitPeriod; }
        } else if (provider === 'mailchimp') {
            const p = (getConfig<MailchimpProvider[]>('mailchimpProviders') || []).find(p => p.name === mailchimpProviderName);
            if (p) { count = p.rateLimitCount; period = p.rateLimitPeriod; }
        } else if (provider === 'sendgrid') {
            const p = (getConfig<SendGridProvider[]>('sendGridProviders') || []).find(p => p.name === sendGridProviderName);
            if (p) { count = p.rateLimitCount; period = p.rateLimitPeriod; }
        }
        return `${count} emails / ${period} hrs`;
    }

    const stepLabels = [
        "Select Template",
        "Select List",
        "Select Provider",
        "Provider Details",
        "From Address",
        "Campaign Name",
        "Email Subject",
        "Rate Limit",
        "Scheduling",
        "Confirmation"
    ];

    const renderLeftPane = () => (
        <Box flexDirection="column" padding={1} width="30%" height={20} borderRightColor={theme.secondary} borderStyle="single">
            <Header theme={theme} title="Setup" compact={true} />
            <Box marginTop={1} flexDirection="column">
                {stepLabels.map((label, index) => {
                    let color = theme.text;
                    let prefix = '  ';

                    if (index < step) {
                        color = 'green';
                        prefix = '✔ ';
                    } else if (index === step) {
                        color = theme.accent;
                        prefix = '> ';
                    } else {
                        color = 'gray';
                        prefix = '  ';
                    }

                    return (
                        <Text key={index} color={color} bold={index === step}>
                            {prefix}{label}
                        </Text>
                    );
                })}
            </Box>
            <Box marginTop={2}>
                <Text color="gray" italic>ESC to Cancel</Text>
            </Box>
        </Box>
    );

    const renderRightPane = () => {
        // Handle Error Step separately (index 10 effectively)
        if (step === 10) {
            return (
                <Box flexDirection="column">
                    <Text color="red" bold>Error: {provider.toUpperCase()} is not configured!</Text>
                    <Box marginTop={1}>
                        <Text>Please configure your API keys in the Settings menu before starting a campaign.</Text>
                    </Box>
                    <Box marginTop={1}>
                        <SelectInput items={[
                            { label: 'Go to Settings', value: 'settings' },
                            { label: 'Select Different Provider', value: 'back' }
                        ]} onSelect={(item: any) => {
                            if (item.value === 'settings') setView(ViewName.SETTINGS);
                            else setStep(2);
                        }} />
                    </Box>
                </Box>
            );
        }

        const content = [
            // 0: Template
            (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent}>Select HTML Template:</Text>
                    </Box>
                    {templates.length === 0 ? (
                        <Text color="red">No templates found in /templates.</Text>
                    ) : (
                        <SelectInput items={templates} onSelect={(item: any) => {
                            setSelectedTemplate(item.value);
                            setStep(1);
                        }} />
                    )}
                </Box>
            ),
            // 1: List
            (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent}>Select Recipient List (.csv):</Text>
                    </Box>
                    {lists.length === 0 ? (
                        <Text color="red">No .csv files found in /lists.</Text>
                    ) : (
                        <SelectInput items={lists} onSelect={(item: any) => {
                            setSelectedList(item.value);
                            setStep(2);
                        }} />
                    )}
                </Box>
            ),
            // 2: Provider Type
            (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent}>Select Email Provider:</Text>
                    </Box>
                    <SelectInput items={[
                        { label: 'Amazon SES', value: 'ses' },
                        { label: 'Mailgun', value: 'mailgun' },
                        { label: 'Mailchimp', value: 'mailchimp' },
                        { label: 'SendGrid', value: 'sendgrid' },
                        { label: 'Custom SMTP', value: 'smtp' },
                        { label: '(Q) Back', value: 'back' }
                    ]} onSelect={(item: any) => {
                        if (item.value === 'back') {
                            setStep(1); // Go back to List selection
                            return;
                        }
                        const prov = item.value as 'ses' | 'mailgun' | 'mailchimp' | 'smtp' | 'sendgrid';
                        let isConfigured = false;
                        if (prov === 'ses') isConfigured = isSesConfigured();
                        else if (prov === 'mailgun') isConfigured = isMailgunConfigured();
                        else if (prov === 'mailchimp') isConfigured = isMailchimpConfigured();
                        else if (prov === 'smtp') isConfigured = isSmtpConfigured();
                        else if (prov === 'sendgrid') isConfigured = isSendGridConfigured();

                        if (!isConfigured) {
                            setStep(10); // Error step
                            setProvider(prov);
                        } else {
                            setProvider(prov);
                            setStep(3); // Always go to provider details selection
                        }
                    }} />
                </Box>
            ),
            // 3: Specific Provider Selection
            (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent}>Select {provider.toUpperCase()} Account:</Text>
                    </Box>
                    {(() => {
                        let items: any[] = [];
                        let onSelect = (item: any) => { };

                        if (provider === 'smtp') {
                            items = (getConfig<SmtpProvider[]>('smtpProviders') || []).map(p => ({ label: p.name, value: p.name }));
                            onSelect = (item) => setSmtpProviderName(item.value);
                        } else if (provider === 'sendgrid') {
                            items = (getConfig<SendGridProvider[]>('sendGridProviders') || []).map(p => ({ label: p.name, value: p.name }));
                            onSelect = (item) => setSendGridProviderName(item.value);
                        } else if (provider === 'ses') {
                            items = (getConfig<SesProvider[]>('sesProviders') || []).map(p => ({ label: `${p.name} (${p.region})`, value: p.name }));
                            onSelect = (item) => setSesProviderName(item.value);
                        } else if (provider === 'mailgun') {
                            items = (getConfig<MailgunProvider[]>('mailgunProviders') || []).map(p => ({ label: `${p.name} (${p.domain})`, value: p.name }));
                            onSelect = (item) => setMailgunProviderName(item.value);
                        } else if (provider === 'mailchimp') {
                            items = (getConfig<MailchimpProvider[]>('mailchimpProviders') || []).map(p => ({ label: p.name, value: p.name }));
                            onSelect = (item) => setMailchimpProviderName(item.value);
                        }

                        if (items.length === 0) {
                            return <Text color="red">No providers found. Please check configuration.</Text>;
                        }

                        // Add Back option
                        items.push({ label: '(Q) Back', value: 'back' });

                        return (
                            <SelectInput items={items} onSelect={(item) => {
                                if (item.value === 'back') {
                                    setStep(2); // Back to Provider Type
                                    return;
                                }
                                onSelect(item);
                                setStep(4);
                            }} />
                        );
                    })()}
                </Box>
            ),
            // 4: From Email
            (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent}>Select Sender Address:</Text>
                    </Box>
                    <FromSelector
                        theme={theme}
                        isFocused={true}
                        onSelect={(email) => {
                            setFromEmail(email);
                            setStep(5);
                        }}
                        onBack={() => setStep(3)}
                    />
                </Box>
            ),
            // 5: Campaign Name
            (
                <Box flexDirection="column">
                    <Text color={theme.accent}>Enter Campaign Name (Internal Use Only):</Text>
                    <TextInput value={campaignName} onChange={setCampaignName} onSubmit={() => setStep(6)} />
                    <Text color="gray">(ESC) Back</Text>
                </Box>
            ),
            // 6: Email Subject
            (
                <Box flexDirection="column">
                    <Text color={theme.accent}>Enter Email Subject:</Text>
                    <TextInput value={emailSubject} onChange={setEmailSubject} onSubmit={() => setStep(7)} />
                    <Text color="gray">This will be the subject line seen by recipients.</Text>
                    <Text color="gray">(ESC) Back</Text>
                </Box>
            ),
            // 7: Rate Limit
            (
                <Box flexDirection="column">
                    <Text color={theme.accent}>Campaign Speed Limit (Emails per Minute):</Text>
                    <TextInput value={campaignRateLimit} onChange={setCampaignRateLimit} onSubmit={() => setStep(8)} placeholder="5" />
                    <Text color="gray">This will be throttled if it exceeds your Provider's limit.</Text>
                    <Text color="gray">(ESC) Back</Text>
                </Box>
            ),
            // 8: Scheduling
            (
                <Box flexDirection="column">
                    <Text color={theme.accent}>Start Time:</Text>
                    {scheduleType === 'now' ? (
                        <SelectInput items={[
                            { label: 'Start Immediately', value: 'now' },
                            { label: 'Schedule for Later', value: 'scheduled' },
                            { label: '(Q) Back', value: 'back' }
                        ]} onSelect={(item) => {
                            if (item.value === 'back') {
                                setStep(7); // Back to Rate Limit
                            } else if (item.value === 'scheduled') {
                                setScheduleType('scheduled');
                            } else {
                                setStep(9);
                            }
                        }} />
                    ) : (
                        <ScheduledTimeInput
                            theme={theme}
                            onSelect={(val) => {
                                setScheduledTime(val);
                                setStep(9);
                            }}
                            onCancel={() => setScheduleType('now')}
                        />
                    )}
                </Box>
            ),
            // 9: Confirm
            (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent} bold underline>Confirm Campaign Details</Text>
                    </Box>
                    <Text>Name: <Text color={theme.primary}>{campaignName}</Text></Text>
                    <Text>Subject: <Text color={theme.primary}>{emailSubject}</Text></Text>
                    <Text>Template: <Text color="gray">{path.basename(path.dirname(selectedTemplate))}</Text></Text>
                    <Text>List: <Text color="gray">{path.basename(selectedList)}</Text></Text>
                    <Text>Provider: <Text color={theme.primary}>{provider.toUpperCase()}</Text></Text>
                    <Text>Account: <Text color={theme.primary}>{
                        provider === 'smtp' ? smtpProviderName :
                            provider === 'sendgrid' ? sendGridProviderName :
                                provider === 'ses' ? sesProviderName :
                                    provider === 'mailgun' ? mailgunProviderName :
                                        mailchimpProviderName
                    }</Text></Text>
                    <Text>From: <Text color={theme.primary}>{fromEmail}</Text></Text>
                    <Text>Campaign Speed: <Text color={theme.primary}>{campaignRateLimit} / min</Text></Text>
                    <Text>Start: <Text color={theme.primary}>{scheduleType === 'now' ? 'Immediately' : `Scheduled (${scheduledTime}) - ${getProviderRateInfo()}`}</Text></Text>
                    <Box marginTop={2}>
                        <SelectInput items={[
                            { label: scheduleType === 'now' ? 'Start Campaign' : 'Schedule Campaign', value: 'start' },
                            { label: 'Edit Details (Back)', value: 'back' },
                            { label: 'Cancel', value: 'cancel' }
                        ]} onSelect={(item) => {
                            if (item.value === 'start') startCampaign();
                            else if (item.value === 'back') setStep(8);
                            else setView(ViewName.HOME);
                        }} />
                    </Box>
                </Box>
            )
        ];

        return (
            <Box width="70%" height={20} padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                {content[step]}
            </Box>
        );
    };

    return (
        <Box flexDirection="column" height="100%">
            <Box flexDirection="column" alignItems="center" marginBottom={1}>
                <BigText text="CAMPAIGN SETUP" font="tiny" colors={[theme.primary, theme.secondary, theme.accent]} />
                <Box marginBottom={1} />
                <Box borderStyle="single" borderColor={theme.primary} width="100%" />
            </Box>
            <Box flexDirection="row" flexGrow={1}>
                {renderLeftPane()}
                {renderRightPane()}
            </Box>
        </Box>
    );
};

export default CampaignSetup;
