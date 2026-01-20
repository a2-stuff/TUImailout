import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { ViewName } from '../types.js';
import type { Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import fs from 'fs';
import path from 'path';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

interface ListFile {
    name: string;
    path: string;
    size: number;
    modified: Date;
}

const ListsMenu: React.FC<Props> = ({ setView, theme }) => {
    const [lists, setLists] = useState<ListFile[]>([]);
    const [selectedList, setSelectedList] = useState<ListFile | null>(null);
    const [focusedPane, setFocusedPane] = useState<'menu' | 'content'>('menu');
    const [editMode, setEditMode] = useState(false);
    const [lines, setLines] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [editingLine, setEditingLine] = useState('');
    const VISIBLE_ROWS = 13;
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);

    // Create new list states
    const [createMode, setCreateMode] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListContent, setNewListContent] = useState('');
    const [createStep, setCreateStep] = useState<'name' | 'content'>('name');

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = () => {
        const listDir = path.join(process.cwd(), 'lists');

        if (!fs.existsSync(listDir)) {
            fs.mkdirSync(listDir, { recursive: true });
        }

        const files = fs.readdirSync(listDir)
            .filter(f => f.endsWith('.csv'))
            .map(f => {
                const filePath = path.join(listDir, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    path: filePath,
                    size: stats.size,
                    modified: stats.mtime
                };
            });

        setLists(files);
        if (files.length > 0 && !selectedList) {
            setSelectedList(files[0]);
        }
    };

    const loadFileContent = (filePath: string) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileLines = content.split('\n');
        setLines(fileLines);
        setCurrentLineIndex(0);
        setEditingLine(fileLines[0] || '');
    };

    const saveFile = () => {
        if (selectedList) {
            // Filter out blank/empty lines before saving
            const nonEmptyLines = lines.filter(line => line.trim() !== '');
            const content = nonEmptyLines.join('\n');
            fs.writeFileSync(selectedList.path, content, 'utf-8');
            loadLists();
            setEditMode(false);
            setFocusedPane('content');
        }
    };

    const createNewList = () => {
        if (!newListName) return;

        const listDir = path.join(process.cwd(), 'lists');
        const fileName = newListName.endsWith('.csv') ? newListName : `${newListName}.csv`;
        const filePath = path.join(listDir, fileName);

        // Prepare content: add header if not present
        let content = newListContent.trim();
        if (!content.toLowerCase().startsWith('email')) {
            content = 'email,name\n' + content;
        }

        // Filter out blank lines
        const lines = content.split('\n').filter(line => line.trim() !== '');
        content = lines.join('\n');

        fs.writeFileSync(filePath, content, 'utf-8');

        // Reset and reload
        setCreateMode(false);
        setNewListName('');
        setNewListContent('');
        setCreateStep('name');
        loadLists();
    };

    useInput((input, key) => {
        // Handle create mode
        if (createMode) {
            if (key.escape || input === 'q' || input === 'Q') {
                setCreateMode(false);
                setNewListName('');
                setNewListContent('');
                setCreateStep('name');
            }
            return;
        }

        if (editMode && !isEditingContent) {
            if (showActionMenu) {
                // When action menu is shown, ESC returns to line navigation
                if (key.escape) {
                    setShowActionMenu(false);
                }
                // Let SelectInput handle other keys
            } else {
                // Line navigation mode
                if (key.escape || input === 'q' || input === 'Q') {
                    setEditMode(false);
                    setFocusedPane('content');
                } else if (key.upArrow && currentLineIndex > 0) {
                    const newIndex = currentLineIndex - 1;
                    setCurrentLineIndex(newIndex);
                    setEditingLine(lines[newIndex]);
                    if (newIndex < scrollOffset) {
                        setScrollOffset(newIndex);
                    }
                } else if (key.downArrow && currentLineIndex < lines.length - 1) {
                    const newIndex = currentLineIndex + 1;
                    setCurrentLineIndex(newIndex);
                    setEditingLine(lines[newIndex]);
                    if (newIndex >= scrollOffset + VISIBLE_ROWS) {
                        setScrollOffset(newIndex - VISIBLE_ROWS + 1);
                    }
                } else if (key.delete || key.backspace) {
                    // Quick delete line
                    const newLines = [...lines];
                    newLines.splice(currentLineIndex, 1);
                    setLines(newLines);
                    // Adjust index if needed
                    if (currentLineIndex >= newLines.length && newLines.length > 0) {
                        setCurrentLineIndex(newLines.length - 1);
                        setEditingLine(newLines[newLines.length - 1]);
                    } else if (newLines.length > 0) {
                        setEditingLine(newLines[currentLineIndex]);
                    } else {
                        setEditingLine('');
                    }
                } else if (key.return) {
                    setIsEditingContent(true);
                } else if (key.tab) {
                    setShowActionMenu(true);
                }
            }
        } else if (editMode && isEditingContent) {
            // Handle actions while typing in input
            if (key.escape) {
                // Cancel line edit
                setIsEditingContent(false);
                setEditingLine(lines[currentLineIndex]);
            }
        } else if (!editMode) {
            if (key.escape || input === 'q' || input === 'Q') {
                if (focusedPane === 'content') {
                    setFocusedPane('menu');
                } else {
                    setView(ViewName.HOME);
                }
            }

            if (focusedPane === 'menu') {
                if (key.rightArrow || key.return) {
                    if (selectedList) {
                        setFocusedPane('content');
                    }
                }
            } else {
                if (key.leftArrow) {
                    setFocusedPane('menu');
                }
            }
        }
    });

    const handleLineEdit = (value: string) => {
        setEditingLine(value);
    };

    const handleLineSubmit = () => {
        const newLines = [...lines];
        newLines[currentLineIndex] = editingLine;
        setLines(newLines);
        setIsEditingContent(false);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFilePreview = (filePath: string): string[] => {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const previewLines = content.split('\n').filter(line => line.trim());
            return previewLines.slice(0, 10);
        } catch (error) {
            return ['Error reading file'];
        }
    };

    const menuItems = lists.map(list => ({
        label: list.name,
        value: list.name
    }));

    if (menuItems.length === 0) {
        menuItems.push({ label: 'No CSV files found', value: 'NONE' });
    }

    menuItems.push({ label: '---', value: 'DIVIDER' });
    menuItems.push({ label: '+ Create New List', value: 'CREATE' });
    menuItems.push({ label: '(Q) Back to Home', value: 'HOME' });

    const renderEditMode = () => {
        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text color={theme.primary} bold>Editing: {selectedList?.name}</Text>
                </Box>
                <Box marginBottom={1}>
                    <Text color={theme.accent}>Line {currentLineIndex + 1} of {lines.length}</Text>
                </Box>

                <Box flexDirection="column" borderStyle="single" borderColor={theme.secondary} padding={1} height={15}>
                    {lines.slice(scrollOffset, scrollOffset + VISIBLE_ROWS).map((line, i) => {
                        const actualIndex = scrollOffset + i;
                        const isActive = actualIndex === currentLineIndex;
                        return (
                            <Box key={actualIndex}>
                                <Text color={isActive ? theme.accent : 'gray'}>
                                    {isActive ? '> ' : '  '}
                                </Text>
                                {isActive && isEditingContent ? (
                                    <TextInput
                                        value={editingLine}
                                        onChange={handleLineEdit}
                                        onSubmit={handleLineSubmit}
                                        focus={true}
                                    />
                                ) : (
                                    <Text color={isActive ? theme.primary : theme.text} wrap="truncate-end">
                                        {line || '(empty line)'}
                                    </Text>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                <Box marginTop={2} flexDirection="column">
                    <Text color={theme.accent} bold>Controls:</Text>
                    <Text>↑/↓ - Navigate | Enter - Edit | Backspace - Delete Line</Text>
                    <Text>TAB - Save File | ESC - Cancel / Exit Edit Mode</Text>
                </Box>

                <Box marginTop={1} padding={1} borderStyle="single" borderColor={theme.accent}>
                    <SelectInput
                        items={[
                            { label: '💾 SAVE LIST CHANGES', value: 'save' },
                            { label: '❌ CANCEL', value: 'cancel' }
                        ]}
                        isFocused={showActionMenu}
                        onSelect={(item) => {
                            if (item.value === 'save') {
                                saveFile();
                            } else {
                                setEditMode(false);
                                setFocusedPane('content');
                                setShowActionMenu(false);
                            }
                        }}
                        indicatorComponent={({ isSelected }) =>
                            <Text color={isSelected ? theme.accent : theme.text}>
                                {isSelected ? '> ' : '  '}
                            </Text>
                        }
                        itemComponent={({ isSelected, label }) =>
                            <Text color={isSelected ? theme.success || 'green' : theme.text} bold={isSelected}>
                                {label}
                            </Text>
                        }
                    />
                </Box>
            </Box>
        );
    };

    const renderCreateMode = () => {
        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text color={theme.primary} bold>Create New List</Text>
                </Box>

                <Box flexDirection="column" borderStyle="single" borderColor={theme.secondary} padding={1}>
                    {createStep === 'name' ? (
                        <Box flexDirection="column">
                            <Box marginBottom={1}>
                                <Text color={theme.accent}>Step 1: Enter filename</Text>
                            </Box>
                            <Box marginBottom={1}>
                                <Text>Filename: </Text>
                                <TextInput
                                    value={newListName}
                                    onChange={setNewListName}
                                    onSubmit={() => {
                                        if (newListName.trim()) {
                                            setCreateStep('content');
                                        }
                                    }}
                                    placeholder="my-list"
                                    focus={true}
                                />
                                <Text color="gray">.csv</Text>
                            </Box>
                            <Text color="gray" dimColor>Press Enter to continue</Text>
                        </Box>
                    ) : (
                        <Box flexDirection="column">
                            <Box marginBottom={1}>
                                <Text color={theme.accent}>Step 2: Paste email list (one per line or comma-separated)</Text>
                            </Box>
                            <Box marginBottom={1} flexDirection="column">
                                <Text color="gray">Format: email,name OR just email</Text>
                                <Text color="gray">Example:</Text>
                                <Text color="gray" dimColor>  john@example.com,John Doe</Text>
                                <Text color="gray" dimColor>  jane@example.com</Text>
                            </Box>
                            <Box marginBottom={1}>
                                <TextInput
                                    value={newListContent}
                                    onChange={setNewListContent}
                                    onSubmit={() => {
                                        if (newListContent.trim()) {
                                            createNewList();
                                        }
                                    }}
                                    placeholder="Paste email list here..."
                                    focus={true}
                                />
                            </Box>
                            <Text color="gray" dimColor>Paste multi-line text and press Enter to save</Text>
                            <Text color="gray" dimColor>ESC or Q to cancel</Text>
                        </Box>
                    )}
                </Box>

                <Box marginTop={2}>
                    <Text color="gray">💡 Tip: The header (email,name) will be added automatically if not present</Text>
                </Box>
            </Box>
        );
    };

    const deleteList = () => {
        if (selectedList) {
            try {
                fs.unlinkSync(selectedList.path);
                setSelectedList(null);
                setFocusedPane('menu');
                loadLists();
            } catch (error: any) {
                console.error(`Failed to delete list: ${error.message}`);
            }
        }
    };

    const renderContent = () => {
        if (createMode) {
            return renderCreateMode();
        }

        if (editMode) {
            return renderEditMode();
        }

        if (!selectedList) {
            return <Box flexDirection="column">
                <Text color="gray">Select a list from the left menu.</Text>
                {lists.length === 0 && (
                    <Box marginTop={1}>
                        <Text color="gray">You can create a new list using the menu on the left.</Text>
                    </Box>
                )}
            </Box>;
        }

        const preview = getFilePreview(selectedList.path);
        const lineCount = fs.readFileSync(selectedList.path, 'utf-8').split('\n').filter(l => l.trim()).length;

        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text color={theme.primary} bold>{selectedList.name}</Text>
                </Box>
                <Box marginBottom={1}>
                    <Text>Size: <Text color={theme.accent}>{formatFileSize(selectedList.size)}</Text></Text>
                    <Text> | Lines: <Text color={theme.accent}>{lineCount}</Text></Text>
                </Box>
                <Box marginBottom={1}>
                    <Text color="gray">Modified: {selectedList.modified.toLocaleString()}</Text>
                </Box>

                <Box marginTop={1} marginBottom={1}>
                    <Text color={theme.accent} bold>Preview (first 10 lines):</Text>
                </Box>
                <Box flexDirection="column" borderStyle="single" borderColor={theme.secondary} padding={1}>
                    {preview.map((line, i) => (
                        <Text key={i} color="gray">{line.substring(0, 80)}{line.length > 80 ? '...' : ''}</Text>
                    ))}
                </Box>

                <Box marginTop={2}>
                    <SelectInput
                        items={[
                            { label: 'Edit File', value: 'edit' },
                            { label: 'Delete List', value: 'delete' },
                            { label: '(Q) Back to Menu', value: 'back' }
                        ]}
                        isFocused={focusedPane === 'content'}
                        onSelect={(item) => {
                            if (item.value === 'edit') {
                                loadFileContent(selectedList.path);
                                setEditMode(true);
                                setShowActionMenu(false);
                            } else if (item.value === 'delete') {
                                setEditMode(false);
                                setCreateMode(false);
                                // Simple confirmation could be another step, but I'll add an "Are you sure?" menu
                                setStep('confirmDelete');
                            } else {
                                setFocusedPane('menu');
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
        );
    };

    const [step, setStep] = useState<'view' | 'confirmDelete'>('view');

    const renderConfirmDelete = () => {
        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text color="red" bold>Are you sure you want to delete "{selectedList?.name}"?</Text>
                </Box>
                <Box marginBottom={1}>
                    <Text color="gray">This action cannot be undone.</Text>
                </Box>
                <SelectInput
                    items={[
                        { label: 'No, Keep it', value: 'cancel' },
                        { label: 'Yes, Delete permanentely', value: 'confirm' }
                    ]}
                    isFocused={focusedPane === 'content'}
                    onSelect={(item) => {
                        if (item.value === 'confirm') {
                            deleteList();
                            setStep('view');
                        } else {
                            setStep('view');
                        }
                    }}
                    indicatorComponent={({ isSelected }) =>
                        <Text color={isSelected ? theme.accent : theme.text}>
                            {isSelected ? '> ' : '  '}
                        </Text>
                    }
                    itemComponent={({ isSelected, label }) =>
                        <Text color={isSelected ? (label.includes('Delete') ? 'red' : theme.primary) : theme.text}>
                            {label}
                        </Text>
                    }
                />
            </Box>
        );
    };

    const mainRenderContent = () => {
        if (step === 'confirmDelete') return renderConfirmDelete();
        return renderContent();
    };

    const [focusedSection, setFocusedSection] = useState<'files' | 'actions'>('files');

    const fileItems = lists.map(list => ({
        label: list.name,
        value: list.name
    }));

    const actionItems = [
        { label: '+ Create New List', value: 'CREATE' },
        { label: '(Q) Back to Home', value: 'HOME' }
    ];

    useInput((input, key) => {
        if (createMode || editMode || step !== 'view') return;

        if (focusedPane === 'menu') {
            if (key.tab) {
                setFocusedSection(prev => prev === 'files' ? 'actions' : 'files');
            }
        }
    });

    // Actually, it's easier to just handle it in onSelect and onHighlight of a single list if I skip the divider.
    // To truly NOT NAVIGATE to separators, they must be removed from the items array.

    const combinedItems = [
        ...fileItems,
        ...actionItems
    ];

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Lists Manager" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane: List of CSV files */}
                <Box width="30%" height="100%" flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Header theme={theme} title="CSV Lists" compact={true} />
                    <Box marginTop={1} flexDirection="column">
                        <SelectInput
                            items={fileItems.length > 0 ? fileItems : [{ label: 'No CSV files found', value: 'NONE' }]}
                            isFocused={focusedPane === 'menu' && !editMode && step === 'view' && focusedSection === 'files'}
                            onSelect={(item) => {
                                if (item.value !== 'NONE') {
                                    const list = lists.find(l => l.name === item.value);
                                    if (list) {
                                        setSelectedList(list);
                                        setFocusedPane('content');
                                        setStep('view');
                                    }
                                }
                            }}
                            onHighlight={(item) => {
                                if (item.value !== 'NONE') {
                                    const list = lists.find(l => l.name === item.value);
                                    if (list) {
                                        setSelectedList(list);
                                    }
                                }
                            }}
                            indicatorComponent={({ isSelected }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' && focusedSection === 'files' ? theme.accent : 'gray') : theme.text}>
                                    {isSelected ? '> ' : '  '}
                                </Text>
                            }
                            itemComponent={({ isSelected, label }) =>
                                <Text color={isSelected ? (focusedPane === 'menu' && focusedSection === 'files' ? theme.primary : theme.secondary) : theme.text}>
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
                            isFocused={focusedPane === 'menu' && !editMode && step === 'view' && focusedSection === 'actions'}
                            onSelect={(item) => {
                                if (item.value === 'HOME') {
                                    setView(ViewName.HOME);
                                } else if (item.value === 'CREATE') {
                                    setCreateMode(true);
                                    setCreateStep('name');
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
                            {editMode ? 'Editing...' : focusedPane === 'menu' ? '↑/↓ Select  Enter/→ View' : 'ESC/Q/← Back to Menu'}
                        </Text>
                        {focusedPane === 'menu' && (
                            <Text color="gray" dimColor>TAB to switch categories</Text>
                        )}
                    </Box>
                </Box>

                {/* Right Pane: File details and actions */}
                <Box width="70%" height="100%" padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {mainRenderContent()}
                </Box>
            </Box>
        </Box>
    );
};

export default ListsMenu;
