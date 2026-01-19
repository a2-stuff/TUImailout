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

const Mailgun: React.FC<Props> = ({ setView, theme }) => {
    const [activeField, setActiveField] = useState<string>('key');

    useInput((input, key) => {
        if (key.escape) {
            setView(ViewName.SETTINGS);
        }
    });
    
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
                onSubmit={(val) => {
                    if (nextField === 'exit') {
                        saveConfig(configKey as any, val);
                        setView(ViewName.SETTINGS);
                    } else {
                        saveAndNext(configKey, val, nextField);
                    }
                }}
            />
            <Text color="gray">(Press Enter to save)</Text>
        </Box>
    );

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="Mailgun" />
            
            <Box marginBottom={1}>
                <Text color={theme.text}>Configure your Mailgun API keys below.</Text>
            </Box>

            {activeField === 'key' && renderInput('Mailgun API Key', mgKey, setMgKey, 'mailgunApiKey', 'domain')}
            {activeField === 'domain' && renderInput('Mailgun Domain', mgDomain, setMgDomain, 'mailgunDomain', 'user')}
            {activeField === 'user' && renderInput('Mailgun Username (default: api)', mgUser, setMgUser, 'mailgunUsername', 'exit')}

             <Box marginTop={1}>
                 <Text color={theme.warning}>
                     [ESC] Back to Settings (Changes to current field won't be saved)
                 </Text>
             </Box>
        </Box>
    );
};

export default Mailgun;
