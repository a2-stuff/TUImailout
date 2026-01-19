import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName } from '../../types.js';
import { type Theme } from '../../utils/themes.js';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { saveConfig, getConfig } from '../../utils/config.js';

interface Props {
    theme: Theme;
    isFocused: boolean;
    onDone: () => void;
}

const AmazonSES: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [activeField, setActiveField] = useState<string>('key');

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape || input === 'q' || input === 'Q') {
            onDone();
        }
    }, { isActive: isFocused });

    // Form States
    const [awsAccessKey, setAwsAccessKey] = useState(getConfig<string>('awsAccessKeyId') || '');
    const [awsSecret, setAwsSecret] = useState(getConfig<string>('awsSecretAccessKey') || '');
    const [awsRegion, setAwsRegion] = useState(getConfig<string>('awsRegion') || '');
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
            const { testSesConnection } = await import('../../controllers/ses.js');
            await testSesConnection();
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
                    saveAndNext(configKey, val, nextField);
                }}
            />
            <Text color="gray">(Press Enter to save)</Text>
        </Box>
    );

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                {/* Header removed for split view, or strictly minimal title */}
                <Text color={theme.primary} bold>Amazon SES Configuration</Text>
            </Box>

            <Box marginBottom={1}>
                <Text color={theme.text}>Configure your AWS credentials below.</Text>
            </Box>

            {activeField === 'key' && renderInput('AWS Access Key ID', awsAccessKey, setAwsAccessKey, 'awsAccessKeyId', 'secret')}
            {activeField === 'secret' && renderInput('AWS Secret Access Key', awsSecret, setAwsSecret, 'awsSecretAccessKey', 'region')}
            {activeField === 'region' && renderInput('AWS Region', awsRegion, setAwsRegion, 'awsRegion', 'testMenu')}

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
                                onSelect={(item) => {
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

export default AmazonSES;
