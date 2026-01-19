import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { ViewName } from '../types.js';
import { type Theme, themes } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import { saveConfig } from '../utils/config.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
    onThemeChange: (themeName: string) => void;
}

const SettingsMenu: React.FC<Props> = ({ setView, theme, onThemeChange }) => {
    const [activeField, setActiveField] = useState<string>('menu');
    const [themeList, setThemeList] = useState<any[]>([]);

    useEffect(() => {
        const list = Object.keys(themes).map(key => ({
            label: themes[key].name,
            value: key
        }));
        list.push({ label: 'Back to Settings Menu', value: 'back' });
        setThemeList(list);
    }, []);

    const menuItems = [
        { label: 'Provider: Amazon SES', value: ViewName.SETTINGS_SES },
        { label: 'Provider: Mailgun', value: ViewName.SETTINGS_MAILGUN },
        { label: 'Provider: Mailchimp', value: ViewName.SETTINGS_MAILCHIMP },
        { label: 'From Addresses', value: ViewName.SETTINGS_FROM_EMAILS },
        { label: 'Change Theme', value: 'theme' },
        { label: 'Back to Home', value: ViewName.HOME },
    ];

    const handleMenuSelect = (item: any) => {
        if (item.value === 'theme') {
            setActiveField('theme');
        } else {
            setView(item.value);
        }
    };

    const handleThemeSelect = (item: any) => {
        if (item.value === 'back') {
            setActiveField('menu');
        } else {
            saveConfig('theme', item.value);
            onThemeChange(item.value);
        }
    };

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="Settings" />

            {activeField === 'menu' && (
                <SelectInput
                    items={menuItems}
                    onSelect={handleMenuSelect}
                    indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                    itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                />
            )}

            {activeField === 'theme' && (
                <Box flexDirection="column">
                    <Text color={theme.primary} bold>Select Theme:</Text>
                    <SelectInput
                        items={themeList}
                        onSelect={handleThemeSelect}
                        indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                        itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                    />
                    <Box marginTop={1}>
                        <Text color="gray">(Select 'Back to Settings Menu' to return)</Text>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default SettingsMenu;
