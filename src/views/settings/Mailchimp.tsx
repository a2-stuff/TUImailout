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

const Mailchimp: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [activeField, setActiveField] = useState<string>('key');

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape || input === 'q' || input === 'Q') {
            onDone();
        }
    }, { isActive: isFocused });

    // Form States
    const [mcKey, setMcKey] = useState(getConfig<string>('mailchimpApiKey') || '');
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<{ success?: boolean, error?: string } | null>(null);

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            const { testMailchimpConnection } = await import('../../controllers/mailchimp.js');
            await testMailchimpConnection();
            setTestStatus({ success: true });
        } catch (error: any) {
            setTestStatus({ success: false, error: error.message });
        } finally {
            setIsTesting(false);
        }
    };

    const renderInput = (label: string, value: string, setValue: (v: string) => void, configKey: string) => (
        <Box flexDirection="column">
            <Text color={theme.accent}>Enter {label}:</Text>
            <TextInput
                value={value}
                onChange={setValue}
                focus={isFocused}
                onSubmit={(val) => {
                    saveConfig(configKey as any, val);
                    setActiveField('testMenu');
                }}
            />
            <Text color="gray">(Press Enter to save)</Text>
        </Box>
    );

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.primary} bold>Mailchimp/Mandrill Configuration</Text>
            </Box>

            <Box marginBottom={1}>
                <Text color={theme.text}>Configure your Mailchimp Transactional (Mandrill) API key.</Text>
            </Box>

            {activeField === 'key' && renderInput('API Key', mcKey, setMcKey, 'mailchimpApiKey')}

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
                                    { label: 'Edit Key', value: 'key' },
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

export default Mailchimp;
