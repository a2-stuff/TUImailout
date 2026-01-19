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

    const saveAndNext = (key: string, value: string, nextField: string) => {
        saveConfig(key as any, value);
        setActiveField(nextField);
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
            {activeField === 'user' && renderInput('Mailgun Username (default: api)', mgUser, setMgUser, 'mailgunUsername', 'exit')}

            <Box marginTop={1}>
                <Text color={theme.warning}>
                    [ESC] Back to Menu (Changes to current field won't be saved)
                </Text>
            </Box>
        </Box>
    );
};

export default Mailgun;
