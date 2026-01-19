import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName } from '../types.js';
import { type Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { sendSesEmail } from '../controllers/ses.js';
import { isSesConfigured } from '../utils/config.js';
import FromSelector from '../components/FromSelector.js';

interface Props {
    theme: Theme;
    isFocused: boolean;
    onDone: () => void;
}

const SendSES: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [step, setStep] = useState<'form' | 'sending' | 'result'>('form');
    const [field, setField] = useState<'from' | 'to' | 'subject' | 'body' | 'send'>('from');

    const configured = isSesConfigured();

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape) {
            onDone();
        }
    }, { isActive: isFocused });

    if (!configured) {
        return (
            <Box flexDirection="column">
                <Box borderStyle="round" borderColor="red" padding={1} flexDirection="column">
                    <Text color="red" bold>Amazon SES is not configured!</Text>
                    <Box marginTop={1}>
                        <Text>Please go to Settings and enter your AWS Access Key, Secret Key, and Region.</Text>
                    </Box>
                </Box>
                <Box marginTop={1}>
                    <SelectInput
                        items={[{ label: 'Back', value: 'back' }]}
                        isFocused={isFocused}
                        onSelect={() => onDone()}
                    />
                </Box>
            </Box>
        );
    }

    const [from, setFrom] = useState('');
    const [to, setTo] = useState(''); // Comma separated
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState('');

    const sendEmail = async () => {
        setStep('sending');
        const recipients = to.split(',').map(e => e.trim());

        try {
            await sendSesEmail(from, recipients, subject, body);
            setStatus('Email sent successfully!');
        } catch (error: any) {
            setStatus(`Error: ${error.message}`);
        }
        setStep('result');
    };

    const handleInputSubmit = () => {
        if (field === 'from') setField('to');
        else if (field === 'to') setField('subject');
        else if (field === 'subject') setField('body');
        else if (field === 'body') setField('send');
    };

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.primary} bold>Send via Amazon SES</Text>
            </Box>

            {step === 'form' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color="gray" italic>Press [ESC] to return to menu</Text>
                    </Box>

                    {field === 'from' ? (
                        <Box marginBottom={1}>
                            <FromSelector theme={theme} isFocused={isFocused && field === 'from'} onSelect={(email) => {
                                setFrom(email);
                                handleInputSubmit();
                            }} />
                        </Box>
                    ) : (
                        <Box flexDirection="column" marginBottom={1}>
                            <Text color={theme.text}>From: <Text color="gray">{from}</Text></Text>
                        </Box>
                    )}

                    <Box flexDirection="column" marginBottom={1}>
                        <Text color={field === 'to' ? theme.accent : theme.text}>To (comma sep): </Text>
                        {field === 'to' ? (
                            <TextInput value={to} onChange={setTo} onSubmit={handleInputSubmit} focus={isFocused} />
                        ) : <Text color="gray">{to}</Text>}
                    </Box>

                    <Box flexDirection="column" marginBottom={1}>
                        <Text color={field === 'subject' ? theme.accent : theme.text}>Subject: </Text>
                        {field === 'subject' ? (
                            <TextInput value={subject} onChange={setSubject} onSubmit={handleInputSubmit} focus={isFocused} />
                        ) : <Text color="gray">{subject}</Text>}
                    </Box>

                    <Box flexDirection="column" marginBottom={1}>
                        <Text color={field === 'body' ? theme.accent : theme.text}>Body: </Text>
                        {field === 'body' ? (
                            <TextInput value={body} onChange={setBody} onSubmit={handleInputSubmit} focus={isFocused} />
                        ) : <Text color="gray">{body}</Text>}
                    </Box>

                    {field === 'send' && (
                        <SelectInput
                            items={[
                                { label: 'Send Email', value: 'send' },
                                { label: 'Cancel', value: 'cancel' }
                            ]}
                            isFocused={isFocused}
                            onSelect={(item) => {
                                if (item.value === 'send') sendEmail();
                                else onDone();
                            }}
                        />
                    )}
                </Box>
            )}

            {step === 'sending' && (
                <Box>
                    <Text color={theme.primary}><Spinner type="dots" /> Sending...</Text>
                </Box>
            )}

            {step === 'result' && (
                <Box flexDirection="column">
                    <Text color={status.startsWith('Error') ? 'red' : 'green'}>{status}</Text>
                    <Box marginTop={1}>
                        <SelectInput
                            items={[{ label: 'Back to Menu', value: 'home' }]}
                            isFocused={isFocused}
                            onSelect={() => onDone()}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default SendSES;