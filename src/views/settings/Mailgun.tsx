import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { type Theme } from '../../utils/themes.js';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { saveConfig, getConfig } from '../../utils/config.js';

interface Props {
    theme: Theme;
    isFocused: boolean;
    onDone: () => void;
}

const Mailgun: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [activeField, setActiveField] = useState<string>('key');

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape || input === 'q' || input === 'Q') {
            onDone();
        }
    }, { isActive: isFocused });

    // Form States
    const [mgKey, setMgKey] = useState(getConfig<string>('mailgunApiKey') || '');
    const [mgDomain, setMgDomain] = useState(getConfig<string>('mailgunDomain') || '');
    const [mgUser, setMgUser] = useState(getConfig<string>('mailgunUsername') || 'api');
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<{ success?: boolean, error?: string } | null>(null);

    const saveAndNext = (key: string, value: string, nextField: string) => {
        saveConfig(key as any, value);
        setActiveField(nextField);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            const { testMailgunConnection } = await import('../../controllers/mailgun.js');
            await testMailgunConnection();
            setTestStatus({ success: true });
        } catch (error: any) {
            setTestStatus({ success: false, error: error.message });
        } finally {
            setIsTesting(false);
        }
    };

    const renderInput = (label: string, value: string, setValue: (v: string) => void, configKey: string, nextField: string) => (
        <Box flexDirection="column">
            <Text color={theme.accent}>Enter {label}:</Text>
            <TextInput
                value={value}
                onChange={setValue}
                focus={isFocused}
                onSubmit={(val) => {
                    if (nextField === 'exit') {
                        saveConfig(configKey as any, val);
                        onDone();
                    } else {
                        saveAndNext(configKey, val, nextField);
                    }
                }}
            />
            <Text color="gray">(Press Enter to save)</Text>
        </Box>
    );

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.primary} bold>Mailgun Configuration</Text>
            </Box>

            <Box marginBottom={1}>
                <Text color={theme.text}>Configure your Mailgun API keys below.</Text>
            </Box>

            {activeField === 'key' && renderInput('Mailgun API Key', mgKey, setMgKey, 'mailgunApiKey', 'domain')}
            {activeField === 'domain' && renderInput('Mailgun Domain', mgDomain, setMgDomain, 'mailgunDomain', 'user')}
            {activeField === 'user' && renderInput('Mailgun Username (default: api)', mgUser, setMgUser, 'mailgunUsername', 'testMenu')}

            {activeField === 'testMenu' && (
                <Box flexDirection="column">
                    {testStatus && (
                        <Box marginBottom={1}>
                            {testStatus.success ? (
                                <Text color="green">✔ Connection successful!</Text>
                            ) : (
                                <Text color="red">✘ Connection failed: {testStatus.error}</Text>
                            )}
                        </Box>
                    )}
                    {isTesting ? (
                        <Text color={theme.accent}>Testing connection...</Text>
                    ) : (
                        <Box flexDirection="column">
                            <Text color={theme.accent}>Next Steps:</Text>
                            <SelectInput
                                items={[
                                    { label: 'Test Connection', value: 'test' },
                                    { label: 'Back to Start', value: 'key' },
                                    { label: 'Done', value: 'exit' }
                                ]}
                                onSelect={(item: any) => {
                                    if (item.value === 'test') handleTest();
                                    else if (item.value === 'exit') onDone();
                                    else setActiveField(item.value);
                                }}
                            />
                        </Box>
                    )}
                </Box>
            )}

            <Box marginTop={1}>
                <Text color={theme.warning}>
                    [ESC/Q] Back to Menu
                </Text>
            </Box>
        </Box>
    );
};

export default Mailgun;
