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

const AmazonSES: React.FC<Props> = ({ setView, theme }) => {
    const [activeField, setActiveField] = useState<string>('key');
    
    useInput((input, key) => {
        if (key.escape) {
            setView(ViewName.SETTINGS);
        }
    });

    // Form States
    const [awsAccessKey, setAwsAccessKey] = useState(getConfig<string>('awsAccessKeyId') || '');
    const [awsSecret, setAwsSecret] = useState(getConfig<string>('awsSecretAccessKey') || '');
    const [awsRegion, setAwsRegion] = useState(getConfig<string>('awsRegion') || '');

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
            <Header theme={theme} title="Amazon SES" />
            
            <Box marginBottom={1}>
                <Text color={theme.text}>Configure your AWS credentials below.</Text>
            </Box>

            {activeField === 'key' && renderInput('AWS Access Key ID', awsAccessKey, setAwsAccessKey, 'awsAccessKeyId', 'secret')}
            {activeField === 'secret' && renderInput('AWS Secret Access Key', awsSecret, setAwsSecret, 'awsSecretAccessKey', 'region')}
            {activeField === 'region' && renderInput('AWS Region', awsRegion, setAwsRegion, 'awsRegion', 'exit')}

             <Box marginTop={1}>
                 <Text color={theme.warning}>
                     [ESC] Back to Settings (Changes to current field won't be saved)
                 </Text>
             </Box>
        </Box>
    );
};

export default AmazonSES;
