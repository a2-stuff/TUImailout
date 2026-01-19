import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Spinner from 'ink-spinner';
import { type Theme } from '../utils/themes.js';

interface Props {
    theme: Theme;
    onComplete: () => void;
}

const ExitAnimation: React.FC<Props> = ({ theme, onComplete }) => {
    const [step, setStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const messages = [
        "Stopping active processes...",
        "Saving configuration state...",
        "Disconnecting from providers...",
        "Clearing temporal caches...",
        "Shutting down core services...",
        "GOODBYE"
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
            <Text color={theme.primary}>
                {`██████ ██  ██ ██ ▄▄   ▄▄  ▄▄▄  ▄▄ ▄▄     ▄▄▄  ▄▄ ▄▄ ▄▄▄▄▄▄ 
  ██   ██  ██ ██ ██▀▄▀██ ██▀██ ██ ██    ██▀██ ██ ██   ██   
  ██   ▀████▀ ██ ██   ██ ██▀██ ██ ██▄▄▄ ▀███▀ ▀███▀   ██   `}
            </Text>
            <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor={theme.primary} paddingX={2} width={50}>
                {logs.map((log, i) => (
                    <Text key={i} color={i === messages.length - 1 ? theme.accent : theme.primary}>
                        {log}
                    </Text>
                ))}
                {step < messages.length && (
                    <Text color={theme.secondary}>
                        <Spinner type="dots" /> Shutting Down...
                    </Text>
                )}
            </Box>
        </Box>
    );
};

export default ExitAnimation;
