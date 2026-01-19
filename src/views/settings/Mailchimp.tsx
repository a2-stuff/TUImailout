import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { type Theme } from '../../utils/themes.js';
import TextInput from 'ink-text-input';
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

    const renderInput = (label: string, value: string, setValue: (v: string) => void, configKey: string) => (
        <Box flexDirection="column">
            <Text color={theme.accent}>Enter {label}:</Text>
            <TextInput
                value={value}
                onChange={setValue}
                focus={isFocused}
                onSubmit={(val) => {
                    saveConfig(configKey as any, val);
                    onDone();
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

            <Box marginTop={1}>
                <Text color={theme.warning}>
                    [ESC] Back to Menu (Changes to current field won't be saved)
                </Text>
            </Box>
        </Box>
    );
};

export default Mailchimp;
