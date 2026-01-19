import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName } from '../types.js';
import { type Theme, themes } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import { saveConfig } from '../utils/config.js';
import AmazonSES from './settings/AmazonSES.js';
import Mailgun from './settings/Mailgun.js';
import Mailchimp from './settings/Mailchimp.js';
import FromEmails from './settings/FromEmails.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
    onThemeChange: (themeName: string) => void;
}

const SettingsMenu: React.FC<Props> = ({ setView, theme, onThemeChange }) => {
    const [activeCategory, setActiveCategory] = useState<string>('SES');
    const [focusedPane, setFocusedPane] = useState<'menu' | 'content'>('menu');

    // Handle global escape if menu is focused to go back home? 
    // Or add "Back to Home" as a menu item (which it is).
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
                // For "Back to Home", we want to execute immediately, not focus content
                if (activeCategory === 'HOME') {
                    setView(ViewName.HOME);
                } else {
                    setFocusedPane('content');
                }
            }
        } else {
            // focusedPane === 'content'
            // This is mostly handled by children, but as a fallback:
            if (key.leftArrow) {
                setFocusedPane('menu');
            }
        }
    });

    const menuItems = [
        { label: 'Provider: Amazon SES', value: 'SES' },
        { label: 'Provider: Mailgun', value: 'MAILGUN' },
        { label: 'Provider: Mailchimp', value: 'MAILCHIMP' },
        { label: 'From Addresses', value: 'FROM_EMAILS' },
        { label: 'Change Theme', value: 'THEME' },
        { label: 'Back to Home', value: 'HOME' },
    ];

    const renderContent = () => {
        const commonProps = {
            theme,
            isFocused: focusedPane === 'content',
            onDone: () => setFocusedPane('menu')
        };

        switch (activeCategory) {
            case 'SES':
                return <AmazonSES {...commonProps} />;
            case 'MAILGUN':
                return <Mailgun {...commonProps} />;
            case 'MAILCHIMP':
                return <Mailchimp {...commonProps} />;
            case 'FROM_EMAILS':
                return <FromEmails {...commonProps} />;
            case 'THEME':
                return (
                    <ThemeSelector
                        theme={theme}
                        isFocused={focusedPane === 'content'}
                        onThemeChange={onThemeChange}
                        onDone={() => setFocusedPane('menu')}
                    />
                );
            case 'HOME':
                return <Text>Exiting settings...</Text>;
            default:
                return <Text color="gray">Select a setting from the left menu.</Text>;
        }
    };

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Settings" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane: Menu */}
                <Box width="30%" flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Text color={theme.accent} bold>Options</Text>
                    <Box marginTop={1}>
                        <SelectInput
                            items={menuItems}
                            isFocused={focusedPane === 'menu'}
                            onSelect={(item) => {
                                if (item.value === 'HOME') {
                                    setView(ViewName.HOME);
                                } else {
                                    setActiveCategory(item.value);
                                    setFocusedPane('content');
                                }
                            }}
                            onHighlight={(item) => {
                                setActiveCategory(item.value);
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
                            {focusedPane === 'menu' ? '↑/↓ Select  Enter/→ Edit' : 'ESC/← Back to Menu'}
                        </Text>
                    </Box>
                </Box>

                {/* Right Pane: Content */}
                <Box width="70%" padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
};

// Inline Theme Selector Component
interface ThemeSelectorProps {
    theme: Theme;
    isFocused: boolean;
    onThemeChange: (themeName: string) => void;
    onDone: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, isFocused, onThemeChange, onDone }) => {
    const [items] = useState(() =>
        Object.keys(themes).map(key => ({
            label: themes[key].name,
            value: key
        }))
    );

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape || input === 'q' || input === 'Q') {
            onDone();
        }
    }, { isActive: isFocused });

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.primary} bold>Select Interface Theme</Text>
            </Box>
            <SelectInput
                items={items}
                isFocused={isFocused}
                onSelect={(item) => {
                    saveConfig('theme', item.value);
                    onThemeChange(item.value);
                    // Don't auto-exit, let user see change or exit manually? 
                    // Or auto-exit feels snappier.
                    // onDone(); 
                }}
                indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
            />
            <Box marginTop={1}>
                <Text color={theme.warning}>
                    [ESC] Back to Menu
                </Text>
            </Box>
        </Box>
    );
};

export default SettingsMenu;
