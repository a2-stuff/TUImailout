import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { ViewName } from '../types.js';
import type { Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SendSES from './SendSES.js';
import SendMailgun from './SendMailgun.js';
import SendMailchimp from './SendMailchimp.js';
import SendSmtp from './SendSmtp.js';
import SendSendGrid from './SendSendGrid.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const ManualMenu: React.FC<Props> = ({ setView, theme }) => {
    const [activeProvider, setActiveProvider] = useState<string>('SES');
    const [focusedPane, setFocusedPane] = useState<'menu' | 'content'>('menu');

    useInput((input, key) => {
        // Q or ESC to go back home
        if (key.escape || input === 'q' || input === 'Q') {
            if (focusedPane === 'content') {
                setFocusedPane('menu');
            } else {
                setView(ViewName.HOME);
            }
            return;
        }

        if (focusedPane === 'menu') {
            if (key.rightArrow || key.return) {
                if (activeProvider === 'HOME') {
                    setView(ViewName.HOME);
                } else {
                    setFocusedPane('content');
                }
            }
        } else {
            if (key.leftArrow) {
                setFocusedPane('menu');
            }
        }
    });

    const items = [
        { label: 'Send via Amazon SES', value: 'SES' },
        { label: 'Send via Mailgun', value: 'MAILGUN' },
        { label: 'Send via Mailchimp', value: 'MAILCHIMP' },
        { label: 'Send via SendGrid', value: 'SENDGRID' },
        { label: 'Send via Custom SMTP', value: 'SMTP' },
        { label: '(Q) Back to Home', value: 'HOME' },
    ];

    const renderContent = () => {
        const commonProps = {
            theme,
            isFocused: focusedPane === 'content',
            onDone: () => setFocusedPane('menu')
        };

        switch (activeProvider) {
            case 'SES':
                return <SendSES {...commonProps} />;
            case 'MAILGUN':
                return <SendMailgun {...commonProps} />;
            case 'MAILCHIMP':
                return <SendMailchimp {...commonProps} />;
            case 'SENDGRID':
                return <SendSendGrid {...commonProps} />;
            case 'SMTP':
                return <SendSmtp {...commonProps} />;
            case 'HOME':
                return <Text>Exiting...</Text>;
            default:
                return <Text color="gray">Select a provider from the left menu.</Text>;
        }
    };

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Manual Sending" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane: Menu */}
                <Box width="30%" height={20} flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Text color={theme.accent} bold>Providers</Text>
                    <Box marginTop={1}>
                        <SelectInput
                            items={items}
                            isFocused={focusedPane === 'menu'}
                            onSelect={(item) => {
                                if (item.value === 'HOME') {
                                    setView(ViewName.HOME);
                                } else {
                                    setActiveProvider(item.value);
                                    setFocusedPane('content');
                                }
                            }}
                            onHighlight={(item) => {
                                setActiveProvider(item.value);
                            }}
                            indicatorComponent={({ isSelected }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' ? theme.accent : 'gray') : theme.text}>
                                    {isSelected ? '> ' : '  '}
                                </Text>
                            }
                            itemComponent={({ isSelected, label }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' ? theme.primary : theme.secondary) : theme.text}>
                                    {label}
                                </Text>
                            }
                        />
                    </Box>
                    <Box marginTop={2}>
                        <Text color="gray" dimColor>
                            {focusedPane === 'menu' ? '↑/↓ Select  Enter/→ Edit' : 'ESC/Q/← Back to Menu'}
                        </Text>
                    </Box>
                </Box>

                {/* Right Pane: Content */}
                <Box width="70%" height={20} padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
};

export default ManualMenu;
