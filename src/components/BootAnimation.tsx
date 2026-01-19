import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Spinner from 'ink-spinner';
import { type Theme } from '../utils/themes.js';
import { APP_VERSION } from '../utils/version.js';

interface Props {
    theme: Theme;
    onComplete: () => void;
}

const BootAnimation: React.FC<Props> = ({ theme, onComplete }) => {
    const [step, setStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const messages = [
        "Initializing system kernel...",
        "Loading UI components...",
        "Connecting to secure enclave...",
        "Fetching provider configurations...",
        "Establishing terminal protocol...",
        `WELCOME TO TUImailout v${APP_VERSION}`
    ];

    useEffect(() => {
        if (step < messages.length) {
            const timer = setTimeout(() => {
                setLogs(prev => [...prev, `[ OK ] ${messages[step]}`]);
                setStep(step + 1);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(onComplete, 800);
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <Box flexDirection="column" padding={2} justifyContent="center" alignItems="center" height="100%">
            <BigText text="TUImailout" font="tiny" colors={[theme.primary, theme.accent]} />
            <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor={theme.primary} paddingX={2} width={50}>
                {logs.map((log, i) => (
                    <Text key={i} color={i === messages.length - 1 ? theme.accent : theme.primary}>
                        {log}
                    </Text>
                ))}
                {step < messages.length && (
                    <Text color={theme.secondary}>
                        <Spinner type="dots" /> Processing...
                    </Text>
                )}
            </Box>
        </Box>
    );
};

export default BootAnimation;