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

export interface SesProvider {
    name: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

const AmazonSES: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');

    // Migration & load SES providers
    const [providers, setProviders] = useState<SesProvider[]>([]);

    useEffect(() => {
        const loadedProviders = getConfig<SesProvider[]>('sesProviders') || [];
        const oldKey = getConfig<string>('awsAccessKeyId');
        const oldSecret = getConfig<string>('awsSecretAccessKey');
        const oldRegion = getConfig<string>('awsRegion');

        if (oldKey && oldSecret && oldRegion) {
            // Migrate old config to new provider list
            const migratedProvider: SesProvider = {
                name: 'Default SES',
                accessKeyId: oldKey,
                secretAccessKey: oldSecret,
                region: oldRegion
            };
            const updated = [...loadedProviders, migratedProvider];
            setProviders(updated);
            saveConfig('sesProviders', updated);
            
            // Clear old config
            saveConfig('awsAccessKeyId', '');
            saveConfig('awsSecretAccessKey', '');
            saveConfig('awsRegion', '');
            logInfo(LogCategory.SETTINGS, `Migrated legacy SES config to provider: Default SES`);
        } else {
            setProviders(loadedProviders);
        }
    }, []);

    // Add/Edit states
    const [newName, setNewName] = useState('');
    const [newAccessKey, setNewAccessKey] = useState('');
    const [newSecretKey, setNewSecretKey] = useState('');
    const [newRegion, setNewRegion] = useState('');
    const [editIndex, setEditIndex] = useState<number>(-1);
    const [inputField, setInputField] = useState<'name' | 'accessKey' | 'secretKey' | 'region' | 'actions'>('name');
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
            const { testSesConnection } = await import('../../controllers/ses.js');
            await testSesConnection({
                name: newName,
                accessKeyId: newAccessKey,
                secretAccessKey: newSecretKey,
                region: newRegion
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
        setNewAccessKey('');
        setNewSecretKey('');
        setNewRegion('');
        setInputField('name');
        setEditIndex(-1);
        setTestStatus(null);
    };

    const handleAdd = () => {
        if (newName && newAccessKey && newSecretKey && newRegion) {
            const updated = [...providers, {
                name: newName,
                accessKeyId: newAccessKey,
                secretAccessKey: newSecretKey,
                region: newRegion
            }];
            setProviders(updated);
            saveConfig('sesProviders', updated);
            logInfo(LogCategory.SETTINGS, `SES provider added: ${newName}`);
            setMode('list');
            resetForm();
        }
    };

    const handleEdit = () => {
        if (newName && newAccessKey && newSecretKey && newRegion && editIndex >= 0) {
            const updated = [...providers];
            updated[editIndex] = {
                name: newName,
                accessKeyId: newAccessKey,
                secretAccessKey: newSecretKey,
                region: newRegion
            };
            setProviders(updated);
            saveConfig('sesProviders', updated);
            logInfo(LogCategory.SETTINGS, `SES provider updated: ${newName}`);
            setMode('list');
            resetForm();
        }
    };

    const handleDelete = (index: number) => {
        const updated = providers.filter((_, i) => i !== index);
        setProviders(updated);
        saveConfig('sesProviders', updated);
        logInfo(LogCategory.SETTINGS, `SES provider deleted`);
    };

    const handleFieldSubmit = () => {
        const fields: Array<typeof inputField> = ['name', 'accessKey', 'secretKey', 'region', 'actions'];
        const currentIndex = fields.indexOf(inputField);
        if (currentIndex < fields.length - 1) {
            setInputField(fields[currentIndex + 1]);
        }
    };

    const menuItems = [
        { label: '+ Add New SES Provider', value: 'ADD' },
        ...providers.map((provider, index) => ({
            label: `${provider.name} (${provider.region})`,
            value: `PROVIDER_${index}`
        })),
        { label: '(Q) Back to Menu', value: 'BACK' }
    ];

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.accent} bold>Amazon SES Providers</Text>
            </Box>

            {mode === 'list' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color="gray">Configure Amazon SES accounts</Text>
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
                                setNewAccessKey(provider.accessKeyId);
                                setNewSecretKey(provider.secretAccessKey);
                                setNewRegion(provider.region);
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
                        <Text color={theme.accent}>{mode === 'add' ? 'Add New SES Provider' : 'Edit SES Provider'}</Text>
                    </Box>

                    <Box marginBottom={1} flexDirection="column">
                        <Box>
                            <Text color={inputField === 'name' ? theme.primary : theme.text}>Provider Name: </Text>
                            {inputField === 'name' ? (
                                <TextInput value={newName} onChange={setNewName} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="My SES Account" />
                            ) : (
                                <Text>{newName}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'accessKey' ? theme.primary : theme.text}>Access Key ID: </Text>
                            {inputField === 'accessKey' ? (
                                <TextInput value={newAccessKey} onChange={setNewAccessKey} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="AKIA..." mask="*" />
                            ) : (
                                <Text>{'*'.repeat(Math.min(newAccessKey.length, 20))}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'secretKey' ? theme.primary : theme.text}>Secret Access Key: </Text>
                            {inputField === 'secretKey' ? (
                                <TextInput value={newSecretKey} onChange={setNewSecretKey} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="Secret..." mask="*" />
                            ) : (
                                <Text>{'*'.repeat(Math.min(newSecretKey.length, 20))}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'region' ? theme.primary : theme.text}>Region: </Text>
                            {inputField === 'region' ? (
                                <TextInput value={newRegion} onChange={setNewRegion} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="us-east-1" />
                            ) : (
                                <Text>{newRegion}</Text>
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

export default AmazonSES;