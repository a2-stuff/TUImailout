import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { type Theme } from '../../utils/themes.js';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { saveConfig, getConfig } from '../../utils/config.js';

interface Props {
    theme: Theme;
    isFocused: boolean;
    onDone: () => void;
}

const FromEmails: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [mode, setMode] = useState<'list' | 'add'>('list');
    const [emails, setEmails] = useState<string[]>(getConfig<string[]>('fromEmails') || []);
    const [newEmail, setNewEmail] = useState('');

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape) {
            if (mode === 'add') {
                setMode('list');
            } else {
                onDone();
            }
        }
    }, { isActive: isFocused });

    const handleAdd = () => {
        if (newEmail && newEmail.includes('@')) {
            const updated = [...emails, newEmail];
            setEmails(updated);
            saveConfig('fromEmails', updated);
            setNewEmail('');
            setMode('list');
        }
    };

    const handleDelete = (emailToDelete: string) => {
        const updated = emails.filter(e => e !== emailToDelete);
        setEmails(updated);
        saveConfig('fromEmails', updated);
    };

    const listItems = [
        { label: '+ Add New Email', value: 'ADD_NEW' },
        ...emails.map(email => ({ label: `Delete: ${email}`, value: email })),
        { label: 'Back to Menu', value: 'BACK' }
    ];

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.primary} bold>From Address Management</Text>
            </Box>

            {mode === 'list' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.text}>Manage your sender identities:</Text>
                    </Box>
                    <SelectInput
                        items={listItems}
                        isFocused={isFocused && mode === 'list'}
                        onSelect={(item) => {
                            if (item.value === 'ADD_NEW') {
                                setMode('add');
                            } else if (item.value === 'BACK') {
                                onDone();
                            } else {
                                // Delete
                                handleDelete(item.value as string);
                            }
                        }}
                        indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                        itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                    />
                </Box>
            )}

            {mode === 'add' && (
                <Box flexDirection="column">
                    <Text color={theme.accent}>Enter new sender email:</Text>
                    <TextInput
                        value={newEmail}
                        onChange={setNewEmail}
                        onSubmit={handleAdd}
                        focus={isFocused && mode === 'add'}
                    />
                    <Text color="gray">(Press Enter to save, ESC to cancel)</Text>
                </Box>
            )}
        </Box>
    );
};

export default FromEmails;