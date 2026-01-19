import React, { useState } from 'react';
import { Box, Text, Newline, useInput } from 'ink';
import { ViewName } from '../types.js';
import type { Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import { APP_VERSION } from '../utils/version.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const Info: React.FC<Props> = ({ setView, theme }) => {
    const [activeSection, setActiveSection] = useState('ABOUT');

    useInput((input, key) => {
        if (key.escape) {
            setView(ViewName.HOME);
        }
    });

    const items = [
        { label: 'About', value: 'ABOUT' },
        { label: 'Credits', value: 'CREDITS' },
        { label: 'License', value: 'LICENSE' },
        { label: 'Back to Home', value: 'HOME' }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'ABOUT':
                return (
                    <Box flexDirection="column">
                        <Text color={theme.primary} bold>About TUImailout</Text>
                        <Box marginTop={1}>
                            <Text>
                                TUImailout is a powerful, interactive Terminal User Interface (TUI) application for sending mass email campaigns.
                                It supports multiple providers like Amazon SES, Mailgun, and Mailchimp Transactional.
                            </Text>
                        </Box>
                        <Box marginTop={1}>
                            <Text>Version: {APP_VERSION}</Text>
                        </Box>
                    </Box>
                );
            case 'CREDITS':
                return (
                    <Box flexDirection="column">
                        <Text color={theme.primary} bold>Credits</Text>
                        <Box marginTop={1}>
                            <Text>Created by: @not_jarod</Text>
                            <Text underline>https://github.com/not_jarod</Text>
                        </Box>
                        <Box marginTop={1}>
                            <Text>Built with:</Text>
                            <Text>- Ink (React for CLI)</Text>
                            <Text>- TypeScript</Text>
                            <Text>- AWS SDK, Mailgun.js</Text>
                        </Box>
                    </Box>
                );
            case 'LICENSE':
                return (
                    <Box flexDirection="column">
                        <Text color={theme.primary} bold>License</Text>
                        <Box marginTop={1}>
                            <Text>MIT License</Text>
                            <Newline />
                            <Text>Permission is hereby granted, free of charge, to any person obtaining a copy...</Text>
                        </Box>
                    </Box>
                );
            case 'HOME':
                return <Text>Exiting...</Text>;
            default:
                return null;
        }
    };

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Info" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane */}
                <Box width="30%" flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Text color={theme.accent} bold>Information</Text>
                    <Box marginTop={1}>
                        <SelectInput
                            items={items}
                            onSelect={(item) => {
                                if (item.value === 'HOME') {
                                    setView(ViewName.HOME);
                                } else {
                                    setActiveSection(item.value);
                                }
                            }}
                            onHighlight={(item) => {
                                if (item.value !== 'HOME') {
                                    setActiveSection(item.value);
                                }
                            }}
                            indicatorComponent={({ isSelected }) =>
                                <Text color={isSelected ? theme.accent : theme.text}>
                                    {isSelected ? '> ' : '  '}
                                </Text>
                            }
                            itemComponent={({ isSelected, label }) =>
                                <Text color={isSelected ? theme.primary : theme.text}>
                                    {label}
                                </Text>
                            }
                        />
                    </Box>
                </Box>

                {/* Right Pane */}
                <Box width="70%" padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
};

export default Info;