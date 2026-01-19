import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { ViewName } from '../types.js';
import type { Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

interface TemplateFolder {
    name: string;
    path: string;
    modified: Date;
    hasIndex: boolean;
}

const TemplatesMenu: React.FC<Props> = ({ setView, theme }) => {
    const [templates, setTemplates] = useState<TemplateFolder[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateFolder | null>(null);
    const [focusedPane, setFocusedPane] = useState<'menu' | 'content'>('menu');
    const [step, setStep] = useState<'view' | 'confirmDelete' | 'rename'>('view');
    const [newName, setNewName] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const tplDir = path.join(process.cwd(), 'templates');

        if (!fs.existsSync(tplDir)) {
            fs.mkdirSync(tplDir, { recursive: true });
        }

        const items = fs.readdirSync(tplDir)
            .map(f => {
                const fullPath = path.join(tplDir, f);
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    return {
                        name: f,
                        path: fullPath,
                        modified: stats.mtime,
                        hasIndex: fs.existsSync(path.join(fullPath, 'index.html'))
                    };
                }
                return null;
            })
            .filter(item => item !== null) as TemplateFolder[];

        setTemplates(items);
        if (items.length > 0 && !selectedTemplate) {
            setSelectedTemplate(items[0]);
        }
    };

    const openInBrowser = (template: TemplateFolder) => {
        const indexPath = path.join(template.path, 'index.html');
        if (fs.existsSync(indexPath)) {
            spawn('open', [indexPath]);
        }
    };

    const renameTemplate = () => {
        if (selectedTemplate && newName.trim()) {
            const newPath = path.join(path.dirname(selectedTemplate.path), newName.trim());
            try {
                fs.renameSync(selectedTemplate.path, newPath);
                loadTemplates();
                setStep('view');
                setFocusedPane('menu');
            } catch (error: any) {
                console.error(`Rename failed: ${error.message}`);
            }
        }
    };

    const deleteTemplate = () => {
        if (selectedTemplate) {
            try {
                fs.rmSync(selectedTemplate.path, { recursive: true, force: true });
                setSelectedTemplate(null);
                setFocusedPane('menu');
                loadTemplates();
            } catch (error: any) {
                console.error(`Delete failed: ${error.message}`);
            }
        }
    };

    useInput((input, key) => {
        if (step === 'rename') {
            if (key.escape) {
                setStep('view');
                setNewName('');
            }
            return;
        }

        if (step === 'confirmDelete') {
            return;
        }

        if (key.escape || input === 'q' || input === 'Q') {
            if (focusedPane === 'content') {
                setFocusedPane('menu');
            } else {
                setView(ViewName.HOME);
            }
        }

        if (focusedPane === 'menu') {
            if (key.rightArrow || key.return) {
                if (selectedTemplate) {
                    setFocusedPane('content');
                }
            }
        } else {
            if (key.leftArrow) {
                setFocusedPane('menu');
            }
        }
    });

    const [focusedSection, setFocusedSection] = useState<'items' | 'actions'>('items');

    const templateItems = templates.map(tpl => ({
        label: tpl.name + (tpl.hasIndex ? '' : ' (No index.html)'),
        value: tpl.name
    }));

    const actionItems = [
        { label: '(Q) Back to Home', value: 'HOME' }
    ];

    useInput((input, key) => {
        if (step !== 'view' || focusedPane !== 'menu') return;
        if (key.tab) {
            setFocusedSection(prev => prev === 'items' ? 'actions' : 'items');
        }
    });

    const renderConfirmDelete = () => (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color="red" bold>Delete folder "{selectedTemplate?.name}"?</Text>
            </Box>
            <Box marginBottom={1}>
                <Text color="gray">This will delete all files in the folder permanently.</Text>
            </Box>
            <SelectInput
                items={[
                    { label: 'No, Keep it', value: 'cancel' },
                    { label: 'Yes, Delete permanentely', value: 'confirm' }
                ]}
                isFocused={focusedPane === 'content'}
                onSelect={(item) => {
                    if (item.value === 'confirm') {
                        deleteTemplate();
                        setStep('view');
                    } else {
                        setStep('view');
                    }
                }}
                indicatorComponent={({ isSelected }) =>
                    <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>
                }
                itemComponent={({ isSelected, label }) =>
                    <Text color={isSelected ? (label.includes('Delete') ? 'red' : theme.primary) : theme.text}>{label}</Text>
                }
            />
        </Box>
    );

    const renderRename = () => (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={theme.primary} bold>Rename Template: {selectedTemplate?.name}</Text>
            </Box>
            <Box marginBottom={1}>
                <Text>New Name: </Text>
                <TextInput
                    value={newName}
                    onChange={setNewName}
                    onSubmit={renameTemplate}
                    focus={true}
                />
            </Box>
            <Box padding={1} borderStyle="single" borderColor={theme.accent}>
                <SelectInput
                    items={[
                        { label: '💾 SAVE NEW NAME', value: 'save' },
                        { label: '❌ CANCEL', value: 'cancel' }
                    ]}
                    isFocused={true}
                    onSelect={(item) => {
                        if (item.value === 'save') renameTemplate();
                        else setStep('view');
                    }}
                />
            </Box>
        </Box>
    );

    const renderContent = () => {
        if (step === 'confirmDelete') return renderConfirmDelete();
        if (step === 'rename') return renderRename();

        if (!selectedTemplate) {
            return <Text color="gray">Select a template folder from the left menu.</Text>;
        }

        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text color={theme.primary} bold>{selectedTemplate.name}</Text>
                </Box>
                <Box marginBottom={1}>
                    <Text>Status: {selectedTemplate.hasIndex ? <Text color="green">Ready (index.html found)</Text> : <Text color="red">Missing index.html</Text>}</Text>
                </Box>
                <Box marginBottom={1}>
                    <Text color="gray">Folder: {selectedTemplate.path}</Text>
                </Box>
                <Box marginBottom={1}>
                    <Text color="gray">Modified: {selectedTemplate.modified.toLocaleString()}</Text>
                </Box>

                <Box marginTop={1}>
                    <SelectInput
                        items={[
                            { label: 'View in Browser', value: 'view_browser' },
                            { label: 'Rename Template', value: 'rename' },
                            { label: 'Delete Template', value: 'delete' },
                            { label: '(Q) Back to Menu', value: 'back' }
                        ]}
                        isFocused={focusedPane === 'content'}
                        onSelect={(item) => {
                            if (item.value === 'view_browser') {
                                openInBrowser(selectedTemplate);
                            } else if (item.value === 'rename') {
                                setNewName(selectedTemplate.name);
                                setStep('rename');
                            } else if (item.value === 'delete') {
                                setStep('confirmDelete');
                            } else {
                                setFocusedPane('menu');
                            }
                        }}
                        indicatorComponent={({ isSelected }) =>
                            <Text color={isSelected ? theme.accent : theme.text}>{isSelected ? '> ' : '  '}</Text>
                        }
                        itemComponent={({ isSelected, label }) =>
                            <Text color={isSelected ? theme.primary : theme.text}>{label}</Text>
                        }
                    />
                </Box>
            </Box>
        );
    };

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Templates Manager" />

            <Box flexDirection="row" flexGrow={1}>
                <Box width="30%" flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Header theme={theme} title="Templates" compact={true} />
                    <Box marginTop={1} flexDirection="column">
                        <SelectInput
                            items={templateItems.length > 0 ? templateItems : [{ label: 'No templates found', value: 'NONE' }]}
                            isFocused={focusedPane === 'menu' && step === 'view' && focusedSection === 'items'}
                            onSelect={(item) => {
                                if (item.value !== 'NONE') {
                                    const tpl = templates.find(t => t.name === item.value);
                                    if (tpl) {
                                        setSelectedTemplate(tpl);
                                        setFocusedPane('content');
                                    }
                                }
                            }}
                            onHighlight={(item) => {
                                if (item.value !== 'NONE') {
                                    const tpl = templates.find(t => t.name === item.value);
                                    if (tpl) {
                                        setSelectedTemplate(tpl);
                                    }
                                }
                            }}
                            indicatorComponent={({ isSelected }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' && focusedSection === 'items' ? theme.accent : 'gray') : theme.text}>
                                    {isSelected ? '> ' : '  '}
                                </Text>
                            }
                            itemComponent={({ isSelected, label }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' && focusedSection === 'items' ? theme.primary : theme.secondary) : theme.text}>
                                    {label}
                                </Text>
                            }
                        />

                        {/* Separator as static text */}
                        <Box paddingLeft={2} marginTop={1} marginBottom={1}>
                            <Text color="gray">────────────────</Text>
                        </Box>

                        <SelectInput
                            items={actionItems}
                            isFocused={focusedPane === 'menu' && step === 'view' && focusedSection === 'actions'}
                            onSelect={(item) => {
                                if (item.value === 'HOME') {
                                    setView(ViewName.HOME);
                                }
                            }}
                            indicatorComponent={({ isSelected }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' && focusedSection === 'actions' ? theme.accent : 'gray') : theme.text}>
                                    {isSelected ? '> ' : '  '}
                                </Text>
                            }
                            itemComponent={({ isSelected, label }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' && focusedSection === 'actions' ? theme.primary : theme.secondary) : theme.text}>
                                    {label}
                                </Text>
                            }
                        />
                    </Box>
                    <Box marginTop={2}>
                        <Text color="gray" dimColor>
                            {focusedPane === 'menu' ? '↑/↓ Select  Enter/→ View' : 'ESC/Q/← Back to Menu'}
                        </Text>
                        {focusedPane === 'menu' && (
                            <Text color="gray" dimColor>TAB to switch categories</Text>
                        )}
                    </Box>
                </Box>

                <Box width="70%" padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
};

export default TemplatesMenu;
