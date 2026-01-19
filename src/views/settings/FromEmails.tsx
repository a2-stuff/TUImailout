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

interface FromAddress {
    email: string;
    name: string;
}

const FromEmails: React.FC<Props> = ({ theme, isFocused, onDone }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');

    // Migration logic: convert old string[] format to new FromAddress[] format
    const migrateOldData = (data: any): FromAddress[] => {
        if (!data || data.length === 0) return [];

        // Check if first item is a string (old format)
        if (typeof data[0] === 'string') {
            const migrated = data.map((email: string) => ({
                email: email,
                name: email.split('@')[0] // Use email username as default name
            }));
            // Save migrated data
            saveConfig('fromEmails', migrated);
            return migrated;
        }

        // Already in new format
        return data;
    };

    const [addresses, setAddresses] = useState<FromAddress[]>(() => {
        const saved = getConfig<any>('fromEmails') || [];
        return migrateOldData(saved);
    });
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [editIndex, setEditIndex] = useState<number>(-1);
    const [inputField, setInputField] = useState<'name' | 'email' | 'actions'>('name');

    useInput((input, key) => {
        if (!isFocused) return;
        if (key.escape) {
            if (mode === 'add' || mode === 'edit') {
                setMode('list');
                setNewEmail('');
                setNewName('');
                setInputField('name');
            } else {
                onDone();
            }
        }
    }, { isActive: isFocused });

    const handleAdd = () => {
        if (newEmail && newEmail.includes('@') && newName) {
            const updated = [...addresses, { email: newEmail, name: newName }];
            setAddresses(updated);
            saveConfig('fromEmails', updated);
            setNewEmail('');
            setNewName('');
            setInputField('name');
            setMode('list');
        }
    };

    const handleEdit = () => {
        if (newEmail && newEmail.includes('@') && newName && editIndex >= 0) {
            const updated = [...addresses];
            updated[editIndex] = { email: newEmail, name: newName };
            setAddresses(updated);
            saveConfig('fromEmails', updated);
            setNewEmail('');
            setNewName('');
            setEditIndex(-1);
            setInputField('name');
            setMode('list');
        }
    };

    const handleDelete = (index: number) => {
        const updated = addresses.filter((_, i) => i !== index);
        setAddresses(updated);
        saveConfig('fromEmails', updated);
    };

    const handleNameSubmit = () => {
        setInputField('email');
    };

    const handleEmailSubmit = () => {
        if (mode === 'add') {
            handleAdd();
        } else if (mode === 'edit') {
            // In edit mode, move to actions menu instead of saving immediately
            setInputField('actions');
        }
    };

    const listItems = [
        { label: '+ Add New Address', value: 'ADD_NEW' },
        ...addresses.map((addr, index) => ({
            label: `${addr.name} <${addr.email}>`,
            value: `ADDR_${index}`
        })),
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
                                setNewEmail('');
                                setNewName('');
                                setInputField('name');
                            } else if (item.value === 'BACK') {
                                onDone();
                            } else if (item.value.startsWith('ADDR_')) {
                                const index = parseInt(item.value.replace('ADDR_', ''));
                                setEditIndex(index);
                                setNewEmail(addresses[index].email);
                                setNewName(addresses[index].name);
                                setInputField('name');
                                setMode('edit');
                            }
                        }}
                        indicatorComponent={({ isSelected }) => <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>}
                        itemComponent={({ isSelected, label }) => <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>}
                    />
                </Box>
            )}

            {(mode === 'add' || mode === 'edit') && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.accent}>{mode === 'add' ? 'Add New Address' : 'Edit Address'}</Text>
                    </Box>

                    <Box marginBottom={1}>
                        <Text color={inputField === 'name' ? theme.primary : theme.text}>From Name: </Text>
                        {inputField === 'name' ? (
                            <TextInput
                                value={newName}
                                onChange={setNewName}
                                onSubmit={handleNameSubmit}
                                focus={isFocused}
                                placeholder="John Doe"
                            />
                        ) : (
                            <Text>{newName}</Text>
                        )}
                    </Box>

                    <Box marginBottom={1}>
                        <Text color={inputField === 'email' ? theme.primary : theme.text}>Email: </Text>
                        {inputField === 'email' ? (
                            <TextInput
                                value={newEmail}
                                onChange={setNewEmail}
                                onSubmit={handleEmailSubmit}
                                focus={isFocused}
                                placeholder="john@example.com"
                            />
                        ) : (
                            <Text>{newEmail}</Text>
                        )}
                    </Box>

                    <Box marginTop={1} flexDirection="column">
                        <Text color="gray" dimColor>Press Enter to move to next field</Text>
                        <Text color="gray" dimColor>ESC to cancel</Text>
                        {mode === 'edit' && inputField === 'actions' && (
                            <Box marginTop={1}>
                                <SelectInput
                                    items={[
                                        { label: 'Save Changes', value: 'save' },
                                        { label: 'Delete This Address', value: 'delete' },
                                        { label: 'Cancel', value: 'cancel' }
                                    ]}
                                    isFocused={isFocused}
                                    onSelect={(item) => {
                                        if (item.value === 'save') {
                                            handleEdit();
                                        } else if (item.value === 'delete') {
                                            handleDelete(editIndex);
                                            setMode('list');
                                        } else {
                                            setMode('list');
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
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default FromEmails;