import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName } from '../../types.js';
import { type Theme } from '../../utils/themes.js';
import Header from '../../components/Header.js';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { saveConfig, getConfig } from '../../utils/config.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const FromEmails: React.FC<Props> = ({ setView, theme }) => {
    const [mode, setMode] = useState<'list' | 'add'>('list');
    const [emails, setEmails] = useState<string[]>(getConfig<string[]>('fromEmails') || []);
    const [newEmail, setNewEmail] = useState('');

    useInput((input, key) => {
        if (key.escape) {
            if (mode === 'add') {
                setMode('list');
            } else {
                setView(ViewName.SETTINGS);
            }
        }
    });

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
        { label: 'Back to Settings', value: 'BACK' }
    ];

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="From Addresses" />
            
            {mode === 'list' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.text}>Manage your sender identities:</Text>
                    </Box>
                    <SelectInput
                        items={listItems}
                        onSelect={(item) => {
                            if (item.value === 'ADD_NEW') {
                                setMode('add');
                            } else if (item.value === 'BACK') {
                                setView(ViewName.SETTINGS);
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
                    />
                    <Text color="gray">(Press Enter to save, ESC to cancel)</Text>
                </Box>
            )}
        </Box>
    );
};

export default FromEmails;