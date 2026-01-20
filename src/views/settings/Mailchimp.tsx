import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { Theme } from '../../utils/themes.js';
import { getConfig, saveConfig } from '../../utils/config.js';
import { logInfo, LogCategory } from '../../utils/logger.js';

interface Props {
    theme: Theme;
    isFocused: boolean;
    onDone: () => void;
}

export interface MailchimpProvider {
    name: string;
    apiKey: string;
    rateLimitCount: number;
    rateLimitPeriod: number;
}

const Mailchimp: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');

    // Migration & load Mailchimp providers
    const [providers, setProviders] = useState<MailchimpProvider[]>(getConfig<MailchimpProvider[]>('mailchimpProviders') || []);

    useEffect(() => {
        const loadedProviders = getConfig<MailchimpProvider[]>('mailchimpProviders') || [];
        const oldKey = getConfig<string>('mailchimpApiKey');

        if (oldKey) {
            // Migrate old config to new provider list
            const migratedProvider: MailchimpProvider = {
                name: 'Default Mailchimp',
                apiKey: oldKey,
                rateLimitCount: 200,
                rateLimitPeriod: 24
            };
            const updated = [...loadedProviders, migratedProvider];
            setProviders(updated);
            saveConfig('mailchimpProviders', updated);
            
            // Clear old config
            saveConfig('mailchimpApiKey', '');
            logInfo(LogCategory.SETTINGS, `Migrated legacy Mailchimp config to provider: Default Mailchimp`);
        } else {
            setProviders(loadedProviders);
        }
    }, []);

    // Add/Edit states
    const [newName, setNewName] = useState('');
    const [newApiKey, setNewApiKey] = useState('');
    const [newRateLimitCount, setNewRateLimitCount] = useState('200');
    const [newRateLimitPeriod, setNewRateLimitPeriod] = useState('24');
    const [editIndex, setEditIndex] = useState<number>(-1);
    const [inputField, setInputField] = useState<'name' | 'apiKey' | 'rateLimitCount' | 'rateLimitPeriod' | 'actions'>('name');
    const [testStatus, setTestStatus] = useState<{ success?: boolean, error?: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape || input === 'q' || input === 'Q') {
            if (mode === 'add' || mode === 'edit') {
                setMode('list');
                resetForm();
            } else {
                onDone();
            }
        }
    }, { isActive: isFocused });

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            const { testMailchimpConnection } = await import('../../controllers/mailchimp.js');
            await testMailchimpConnection({
                name: newName,
                apiKey: newApiKey,
                rateLimitCount: parseInt(newRateLimitCount),
                rateLimitPeriod: parseInt(newRateLimitPeriod)
            });
            setTestStatus({ success: true });
        } catch (error: any) {
            setTestStatus({ success: false, error: error.message });
        } finally {
            setIsTesting(false);
        }
    };

    const resetForm = () => {
        setNewName('');
        setNewApiKey('');
        setNewRateLimitCount('200');
        setNewRateLimitPeriod('24');
        setInputField('name');
        setEditIndex(-1);
        setTestStatus(null);
    };

    const handleAdd = () => {
        if (newName && newApiKey) {
            const updated = [...providers, {
                name: newName,
                apiKey: newApiKey,
                rateLimitCount: parseInt(newRateLimitCount) || 200,
                rateLimitPeriod: parseInt(newRateLimitPeriod) || 24
            }];
            setProviders(updated);
            saveConfig('mailchimpProviders', updated);
            logInfo(LogCategory.SETTINGS, `Mailchimp provider added: ${newName}`);
            setMode('list');
            resetForm();
        }
    };

    const handleEdit = () => {
        if (newName && newApiKey && editIndex >= 0) {
            const updated = [...providers];
            updated[editIndex] = {
                name: newName,
                apiKey: newApiKey,
                rateLimitCount: parseInt(newRateLimitCount) || 200,
                rateLimitPeriod: parseInt(newRateLimitPeriod) || 24
            };
            setProviders(updated);
            saveConfig('mailchimpProviders', updated);
            logInfo(LogCategory.SETTINGS, `Mailchimp provider updated: ${newName}`);
            setMode('list');
            resetForm();
        }
    };

    const handleDelete = (index: number) => {
        const updated = providers.filter((_, i) => i !== index);
        setProviders(updated);
        saveConfig('mailchimpProviders', updated);
        logInfo(LogCategory.SETTINGS, `Mailchimp provider deleted`);
    };

    const handleFieldSubmit = () => {
        const fields: Array<typeof inputField> = ['name', 'apiKey', 'rateLimitCount', 'rateLimitPeriod', 'actions'];
        const currentIndex = fields.indexOf(inputField);
        if (currentIndex < fields.length - 1) {
            setInputField(fields[currentIndex + 1]);
        }
    };

    const menuItems = [
        { label: '+ Add New Mailchimp Provider', value: 'ADD' },
        ...providers.map((provider, index) => ({
            label: `${provider.name}`,
            value: `PROVIDER_${index}`
        })),
        { label: '(Q) Back to Menu', value: 'BACK' }
    ];

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.accent} bold>Mailchimp Providers</Text>
            </Box>

            {mode === 'list' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color="gray">Configure Mailchimp Transactional API keys</Text>
                    </Box>

                    <SelectInput
                        items={menuItems}
                        isFocused={isFocused}
                        onSelect={(item) => {
                            if (item.value === 'BACK') {
                                onDone();
                            } else if (item.value === 'ADD') {
                                setMode('add');
                                setInputField('name');
                            } else if (item.value.startsWith('PROVIDER_')) {
                                const index = parseInt(item.value.replace('PROVIDER_', ''));
                                const provider = providers[index];
                                setNewName(provider.name);
                                setNewApiKey(provider.apiKey);
                                setNewRateLimitCount((provider.rateLimitCount || 200).toString());
                                setNewRateLimitPeriod((provider.rateLimitPeriod || 24).toString());
                                setEditIndex(index);
                                setInputField('name');
                                setMode('edit');
                            }
                        }}
                        indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                        itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                    />
                </Box>
            )}

            {(mode === 'add' || mode === 'edit') && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent}>{mode === 'add' ? 'Add New Mailchimp Provider' : 'Edit Mailchimp Provider'}</Text>
                    </Box>

                    <Box marginBottom={1} flexDirection="column">
                        <Box>
                            <Text color={inputField === 'name' ? theme.primary : theme.text}>Provider Name: </Text>
                            {inputField === 'name' ? (
                                <TextInput value={newName} onChange={setNewName} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="My Mailchimp Account" />
                            ) : (
                                <Text>{newName}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'apiKey' ? theme.primary : theme.text}>API Key: </Text>
                            {inputField === 'apiKey' ? (
                                <TextInput value={newApiKey} onChange={setNewApiKey} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="md-..." mask="*" />
                            ) : (
                                <Text>{'*'.repeat(Math.min(newApiKey.length, 20))}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'rateLimitCount' ? theme.primary : theme.text}>Max Emails: </Text>
                            {inputField === 'rateLimitCount' ? (
                                <TextInput value={newRateLimitCount} onChange={setNewRateLimitCount} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="200" />
                            ) : (
                                <Text>{newRateLimitCount}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'rateLimitPeriod' ? theme.primary : theme.text}>Period (Hours): </Text>
                            {inputField === 'rateLimitPeriod' ? (
                                <TextInput value={newRateLimitPeriod} onChange={setNewRateLimitPeriod} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="24" />
                            ) : (
                                <Text>{newRateLimitPeriod}</Text>
                            )}
                        </Box>
                    </Box>

                    {testStatus && (
                        <Box marginBottom={1}>
                            {testStatus.success ? (
                                <Text color="green">✔ Connection successful!</Text>
                            ) : (
                                <Text color="red">✘ Connection failed: {testStatus.error}</Text>
                            )}
                        </Box>
                    )}

                    <Box marginTop={1} flexDirection="column">
                        <Text color="gray" dimColor>Press Enter to move to next field</Text>
                        <Text color="gray" dimColor>ESC or Q to cancel</Text>
                        {isTesting && <Text color={theme.accent}>Testing connection...</Text>}

                        {(mode === 'edit' || mode === 'add') && inputField === 'actions' && !isTesting && (
                            <Box marginTop={1}>
                                <SelectInput
                                    items={[
                                        { label: 'Test Connection', value: 'test' },
                                        { label: mode === 'edit' ? 'Save Changes' : 'Save Provider', value: 'save' },
                                        ...(mode === 'edit' ? [{ label: 'Delete This Provider', value: 'delete' }] : []),
                                        { label: 'Cancel', value: 'cancel' }
                                    ]}
                                    isFocused={isFocused}
                                    onSelect={(item) => {
                                        if (item.value === 'test') {
                                            handleTest();
                                        } else if (item.value === 'save') {
                                            if (mode === 'edit') handleEdit();
                                            else handleAdd();
                                        } else if (item.value === 'delete') {
                                            handleDelete(editIndex);
                                            setMode('list');
                                            resetForm();
                                        } else {
                                            setMode('list');
                                            resetForm();
                                        }
                                    }}
                                    indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                                    itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default Mailchimp;