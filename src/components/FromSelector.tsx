import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { type Theme } from '../utils/themes.js';
import { getConfig } from '../utils/config.js';

interface Props {
    theme: Theme;
    onSelect: (email: string) => void;
    isFocused?: boolean;
}

interface FromAddress {
    email: string;
    name: string;
}

const FromSelector: React.FC<Props> = ({ theme, onSelect, isFocused = true }) => {
    const [mode, setMode] = useState<'select' | 'input'>('select');
    const [manualEmail, setManualEmail] = useState('');

    // Migration logic: convert old string[] format to new FromAddress[] format
    const getSavedAddresses = (): FromAddress[] => {
        const saved = getConfig<any>('fromEmails') || [];
        if (saved.length === 0) return [];

        // Check if first item is a string (old format)
        if (typeof saved[0] === 'string') {
            return saved.map((email: string) => ({
                email: email,
                name: email.split('@')[0] // Use email username as default name
            }));
        }

        // Already in new format
        return saved;
    };

    const savedAddresses = getSavedAddresses();

    useEffect(() => {
        // If no saved addresses, default to manual input
        if (savedAddresses.length === 0) {
            setMode('input');
        }
    }, []);

    if (mode === 'select' && savedAddresses.length > 0) {
        const items = savedAddresses.map(addr => ({
            label: `${addr.name} <${addr.email}>`,
            value: `${addr.name} <${addr.email}>`
        }));
        items.push({ label: 'Type manually...', value: 'MANUAL' });

        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select From Address:</Text>
                <SelectInput
                    items={items}
                    isFocused={isFocused}
                    onSelect={(item) => {
                        if (item.value === 'MANUAL') {
                            setMode('input');
                        } else {
                            onSelect(item.value);
                        }
                    }}
                    indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                    itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                />
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            <Text color={theme.accent}>Enter From Address:</Text>
            <TextInput
                value={manualEmail}
                onChange={setManualEmail}
                onSubmit={(val) => onSelect(val)}
                focus={isFocused}
                placeholder="Name <email@example.com>"
            />
        </Box>
    );
};

export default FromSelector;
