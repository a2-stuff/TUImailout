import React, { useState } from 'react';
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

export interface SmtpProvider {
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
}

const SmtpProviders: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');

    // Migration & load SMTP providers
    const [providers, setProviders] = useState<SmtpProvider[]>(getConfig<SmtpProvider[]>('smtpProviders') || []);

    // Add/Edit states
    const [newName, setNewName] = useState('');
    const [newHost, setNewHost] = useState('');
    const [newPort, setNewPort] = useState('587');
    const [newSecure, setNewSecure] = useState(true);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [editIndex, setEditIndex] = useState<number>(-1);
    const [inputField, setInputField] = useState<'name' | 'host' | 'port' | 'secure' | 'username' | 'password' | 'actions'>('name');
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
            const { testSmtpConnection } = await import('../../controllers/smtp.js');
            await testSmtpConnection({
                name: newName,
                host: newHost,
                port: parseInt(newPort),
                secure: newSecure,
                username: newUsername,
                password: newPassword
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
        setNewHost('');
        setNewPort('587');
        setNewSecure(true);
        setNewUsername('');
        setNewPassword('');
        setInputField('name');
        setEditIndex(-1);
        setTestStatus(null);
    };

    const handleAdd = () => {
        if (newName && newHost && newPort && newUsername && newPassword) {
            const updated = [...providers, {
                name: newName,
                host: newHost,
                port: parseInt(newPort),
                secure: newSecure,
                username: newUsername,
                password: newPassword
            }];
            setProviders(updated);
            saveConfig('smtpProviders', updated);
            logInfo(LogCategory.SETTINGS, `SMTP provider added: ${newName}`);
            setMode('list');
            resetForm();
        }
    };

    const handleEdit = () => {
        if (newName && newHost && newPort && newUsername && newPassword && editIndex >= 0) {
            const updated = [...providers];
            updated[editIndex] = {
                name: newName,
                host: newHost,
                port: parseInt(newPort),
                secure: newSecure,
                username: newUsername,
                password: newPassword
            };
            setProviders(updated);
            saveConfig('smtpProviders', updated);
            logInfo(LogCategory.SETTINGS, `SMTP provider updated: ${newName}`);
            setMode('list');
            resetForm();
        }
    };

    const handleDelete = (index: number) => {
        const updated = providers.filter((_, i) => i !== index);
        setProviders(updated);
        saveConfig('smtpProviders', updated);
        logInfo(LogCategory.SETTINGS, `SMTP provider deleted`);
    };

    const handleFieldSubmit = () => {
        const fields: Array<typeof inputField> = ['name', 'host', 'port', 'secure', 'username', 'password', 'actions'];
        const currentIndex = fields.indexOf(inputField);
        if (currentIndex < fields.length - 1) {
            setInputField(fields[currentIndex + 1]);
        }
    };

    const menuItems = [
        { label: '+ Add New SMTP Provider', value: 'ADD' },
        ...providers.map((provider, index) => ({
            label: `${provider.name} (${provider.host})`,
            value: `PROVIDER_${index}`
        })),
        { label: '(Q) Back to Menu', value: 'BACK' }
    ];

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.accent} bold>SMTP Providers</Text>
            </Box>

            {mode === 'list' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color="gray">Configure custom SMTP servers for email sending</Text>
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
                                setNewHost(provider.host);
                                setNewPort(provider.port.toString());
                                setNewSecure(provider.secure);
                                setNewUsername(provider.username);
                                setNewPassword(provider.password);
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
                        <Text color={theme.accent}>{mode === 'add' ? 'Add New SMTP Provider' : 'Edit SMTP Provider'}</Text>
                    </Box>

                    <Box marginBottom={1} flexDirection="column">
                        <Box>
                            <Text color={inputField === 'name' ? theme.primary : theme.text}>Provider Name: </Text>
                            {inputField === 'name' ? (
                                <TextInput value={newName} onChange={setNewName} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="My SMTP Server" />
                            ) : (
                                <Text>{newName}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'host' ? theme.primary : theme.text}>Host: </Text>
                            {inputField === 'host' ? (
                                <TextInput value={newHost} onChange={setNewHost} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="smtp.example.com" />
                            ) : (
                                <Text>{newHost}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'port' ? theme.primary : theme.text}>Port: </Text>
                            {inputField === 'port' ? (
                                <TextInput value={newPort} onChange={setNewPort} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="587" />
                            ) : (
                                <Text>{newPort}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'secure' ? theme.primary : theme.text}>Use TLS/SSL: </Text>
                            {inputField === 'secure' ? (
                                <SelectInput
                                    items={[
                                        { label: 'Yes (TLS)', value: 'true' },
                                        { label: 'No', value: 'false' }
                                    ]}
                                    isFocused={isFocused}
                                    onSelect={(item) => {
                                        setNewSecure(item.value === 'true');
                                        handleFieldSubmit();
                                    }}
                                    indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                                    itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                                />
                            ) : (
                                <Text>{newSecure ? 'Yes' : 'No'}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'username' ? theme.primary : theme.text}>Username: </Text>
                            {inputField === 'username' ? (
                                <TextInput value={newUsername} onChange={setNewUsername} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="user@example.com" />
                            ) : (
                                <Text>{newUsername}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color={inputField === 'password' ? theme.primary : theme.text}>Password: </Text>
                            {inputField === 'password' ? (
                                <TextInput value={newPassword} onChange={setNewPassword} onSubmit={handleFieldSubmit} focus={isFocused} placeholder="••••••••" mask="•" />
                            ) : (
                                <Text>{'•'.repeat(newPassword.length)}</Text>
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

export default SmtpProviders;
