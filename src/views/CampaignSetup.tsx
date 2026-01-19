import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName, type Campaign } from '../types.js';
import { type Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { saveCampaign } from '../utils/campaigns.js';
import { isSesConfigured, isMailgunConfigured, isMailchimpConfigured } from '../utils/config.js';
import FromSelector from '../components/FromSelector.js';

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
    const [provider, setProvider] = useState<'ses' | 'mailgun' | 'mailchimp'>('ses');
    const [rateLimit, setRateLimit] = useState('60');
    const [campaignName, setCampaignName] = useState('');
    const [fromEmail, setFromEmail] = useState('');

    useInput((input, key) => {
        if (key.escape) {
            setView(ViewName.HOME);
        }
    });

    useEffect(() => {
        // Load templates
        const tplDir = path.join(process.cwd(), 'templates');
        if (fs.existsSync(tplDir)) {
            const dirs = fs.readdirSync(tplDir).filter(f => fs.statSync(path.join(tplDir, f)).isDirectory());
            // Look for index.html inside
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
        const newCampaign: Campaign = {
            id,
            name: campaignName || 'Untitled Campaign',
            templatePath: selectedTemplate,
            listPath: selectedList,
            provider,
            status: 'pending',
            progress: 0,
            total: 0, // Will be set by worker
            rateLimit: parseInt(rateLimit) || 60,
            startTime: Date.now(),
            from: fromEmail
        };

        saveCampaign(newCampaign);

        // Spawn Worker
        // Determine path to worker.js. In dist, it's ../worker.js relative to this view?
        // Actually, we are in src/views/CampaignSetup.tsx.
        // Compiled: dist/views/CampaignSetup.js.
        // Worker: dist/worker.js.
        // So path is path.join(__dirname, '..', 'worker.js');
        const workerPath = path.join(__dirname, '..', 'worker.js');

        const child = spawn('node', [workerPath, id], {
            detached: true,
            stdio: 'ignore'
        });

        child.unref();

        setView(ViewName.CAMPAIGN_MONITOR);
    };

    const steps = [
        // 0: Template
        (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select Template:</Text>
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
                <Text color={theme.accent}>Select Recipient List (.csv):</Text>
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
        // 2: Provider
        (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select Provider:</Text>
                <SelectInput items={[
                    { label: 'Amazon SES', value: 'ses' },
                    { label: 'Mailgun', value: 'mailgun' },
                    { label: 'Mailchimp', value: 'mailchimp' }
                ]} onSelect={(item: any) => {
                    const prov = item.value as 'ses' | 'mailgun' | 'mailchimp';
                    let isConfigured = false;
                    if (prov === 'ses') isConfigured = isSesConfigured();
                    else if (prov === 'mailgun') isConfigured = isMailgunConfigured();
                    else if (prov === 'mailchimp') isConfigured = isMailchimpConfigured();

                    if (!isConfigured) {
                        setStep(7); // Error step
                        setProvider(prov);
                    } else {
                        setProvider(prov);
                        setStep(3);
                    }
                }} />
            </Box>
        ),
        // 3: From Email
        (
            <Box flexDirection="column">
                <FromSelector theme={theme} onSelect={(email) => {
                    setFromEmail(email);
                    setStep(4);
                }} />
            </Box>
        ),
        // 4: Campaign Name
        (
            <Box flexDirection="column">
                <Text color={theme.accent}>Campaign Name:</Text>
                <TextInput value={campaignName} onChange={setCampaignName} onSubmit={() => setStep(5)} />
            </Box>
        ),
        // 5: Rate Limit
        (
            <Box flexDirection="column">
                <Text color={theme.accent}>Rate Limit (Emails per minute):</Text>
                <TextInput value={rateLimit} onChange={setRateLimit} onSubmit={() => setStep(6)} />
            </Box>
        ),
        // 6: Confirm
        (
            <Box flexDirection="column">
                <Text color={theme.accent} bold>Confirm Campaign:</Text>
                <Text>Name: {campaignName}</Text>
                <Text>Template: {selectedTemplate}</Text>
                <Text>List: {selectedList}</Text>
                <Text>Provider: {provider}</Text>
                <Text>From: {fromEmail}</Text>
                <Text>Rate: {rateLimit}/min</Text>
                <Box marginTop={1}>
                    <SelectInput items={[
                        { label: 'Start Campaign', value: 'start' },
                        { label: 'Cancel', value: 'cancel' }
                    ]} onSelect={(item) => {
                        if (item.value === 'start') startCampaign();
                        else setView(ViewName.HOME);
                    }} />
                </Box>
            </Box>
        ),
        // 7: Provider Configuration Error
        (
            <Box flexDirection="column">
                <Text color="red" bold>Error: {provider === 'ses' ? 'Amazon SES' : provider === 'mailgun' ? 'Mailgun' : 'Mailchimp'} is not configured!</Text>
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
        )
    ];

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="Campaign Setup" />
            <Text color="gray" italic>Press [ESC] to cancel</Text>
            <Box marginTop={1} borderStyle="round" borderColor={theme.primary} padding={1}>
                {steps[step]}
            </Box>
        </Box>
    );
};

export default CampaignSetup;
