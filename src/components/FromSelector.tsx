import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { type Theme } from '../utils/themes.js';
import { getConfig } from '../utils/config.js';

interface Props {
    theme: Theme;
    onSelect: (email: string) => void;
}

const FromSelector: React.FC<Props> = ({ theme, onSelect }) => {
    const [mode, setMode] = useState<'select' | 'input'>('select');
    const [manualEmail, setManualEmail] = useState('');
    const savedEmails = getConfig<string[]>('fromEmails') || [];

    useEffect(() => {
        // If no saved emails, default to manual input
        if (savedEmails.length === 0) {
            setMode('input');
        }
    }, []);

    if (mode === 'select' && savedEmails.length > 0) {
        const items = savedEmails.map(e => ({ label: e, value: e }));
        items.push({ label: 'Type manually...', value: 'MANUAL' });

        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select From Address:</Text>
                <SelectInput
                    items={items}
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
            />
        </Box>
    );
};

export default FromSelector;
