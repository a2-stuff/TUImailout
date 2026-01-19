import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName } from '../../types.js';
import { type Theme } from '../../utils/themes.js';
import Header from '../../components/Header.js';
import TextInput from 'ink-text-input';
import { saveConfig, getConfig } from '../../utils/config.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const Mailchimp: React.FC<Props> = ({ setView, theme }) => {
    const [activeField, setActiveField] = useState<string>('key');

    useInput((input, key) => {
        if (key.escape) {
            setView(ViewName.SETTINGS);
        }
    });

    // Form States
    const [mcKey, setMcKey] = useState(getConfig<string>('mailchimpApiKey') || '');

    const renderInput = (label: string, value: string, setValue: (v: string) => void, configKey: string) => (
        <Box flexDirection="column">
            <Text color={theme.accent}>Enter {label}:</Text>
            <TextInput
                value={value}
                onChange={setValue}
                onSubmit={(val) => {
                    saveConfig(configKey as any, val);
                    setView(ViewName.SETTINGS);
                }}
            />
            <Text color="gray">(Press Enter to save)</Text>
        </Box>
    );

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="Mailchimp Transactional" />

            <Box marginBottom={1}>
                <Text color={theme.text}>Configure your Mailchimp Transactional (Mandrill) API key.</Text>
            </Box>

            {activeField === 'key' && renderInput('API Key', mcKey, setMcKey, 'mailchimpApiKey')}

            <Box marginTop={1}>
                <Text color={theme.warning}>
                    [ESC] Back to Settings (Changes to current field won't be saved)
                </Text>
            </Box>
        </Box>
    );
};

export default Mailchimp;
