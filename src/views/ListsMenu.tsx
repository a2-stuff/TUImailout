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
    const [editingLine, setEditingLine] = useState('');
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);

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

    useInput((input, key) => {
        if (editMode && !isEditingContent) {
            if (showActionMenu) {
                // When action menu is shown, ESC returns to line navigation
                if (key.escape) {
                    setShowActionMenu(false);
                }
                // Let SelectInput handle other keys
            } else {
                // Line navigation mode
                if (key.escape) {
                    setEditMode(false);
                    setFocusedPane('content');
                } else if (key.upArrow && currentLineIndex > 0) {
                    setCurrentLineIndex(currentLineIndex - 1);
                    setEditingLine(lines[currentLineIndex - 1]);
                } else if (key.downArrow && currentLineIndex < lines.length - 1) {
                    setCurrentLineIndex(currentLineIndex + 1);
                    setEditingLine(lines[currentLineIndex + 1]);
                } else if (key.return) {
                    setIsEditingContent(true);
                } else if (key.tab) {
                    setShowActionMenu(true);
                }
            }
        } else if (!editMode) {
            if (key.escape) {
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

    menuItems.push({ label: 'Back to Home', value: 'HOME' });

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
                    {lines.map((line, i) => {
                        const isActive = i === currentLineIndex;
                        return (
                            <Box key={i}>
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
                                    <Text color={isActive ? theme.primary : theme.text}>
                                        {line || '(empty line)'}
                                    </Text>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                <Box marginTop={2} flexDirection="column">
                    <Text color={theme.accent} bold>Controls:</Text>
                    <Text>↑/↓ - Navigate lines | Enter - Edit current line</Text>
                    <Text>Tab - Toggle save menu | ESC - {showActionMenu ? 'Back to navigation' : 'Cancel and return'}</Text>
                </Box>

                {showActionMenu && (
                    <Box marginTop={1}>
                        <SelectInput
                            items={[
                                { label: 'Save Changes', value: 'save' },
                                { label: 'Cancel', value: 'cancel' }
                            ]}
                            isFocused={true}
                            onSelect={(item) => {
                                if (item.value === 'save') {
                                    saveFile();
                                    setShowActionMenu(false);
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
                                <Text color={isSelected ? theme.primary : theme.text}>
                                    {label}
                                </Text>
                            }
                        />
                    </Box>
                )}
            </Box>
        );
    };

    const renderContent = () => {
        if (editMode) {
            return renderEditMode();
        }

        if (!selectedList) {
            return <Text color="gray">Select a list from the left menu.</Text>;
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
                            { label: 'Back to Menu', value: 'back' }
                        ]}
                        isFocused={focusedPane === 'content'}
                        onSelect={(item) => {
                            if (item.value === 'edit') {
                                loadFileContent(selectedList.path);
                                setEditMode(true);
                                setShowActionMenu(false);
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

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Lists Manager" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane: List of CSV files */}
                <Box width="30%" flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Text color={theme.accent} bold>CSV Lists</Text>
                    <Box marginTop={1}>
                        <SelectInput
                            items={menuItems}
                            isFocused={focusedPane === 'menu' && !editMode}
                            onSelect={(item) => {
                                if (item.value === 'HOME') {
                                    setView(ViewName.HOME);
                                } else if (item.value !== 'NONE') {
                                    const list = lists.find(l => l.name === item.value);
                                    if (list) {
                                        setSelectedList(list);
                                        setFocusedPane('content');
                                    }
                                }
                            }}
                            onHighlight={(item) => {
                                if (item.value !== 'HOME' && item.value !== 'NONE') {
                                    const list = lists.find(l => l.name === item.value);
                                    if (list) {
                                        setSelectedList(list);
                                    }
                                }
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
                            {editMode ? 'Editing...' : focusedPane === 'menu' ? '↑/↓ Select  Enter/→ View' : 'ESC/← Back to Menu'}
                        </Text>
                    </Box>
                </Box>

                {/* Right Pane: File details and actions */}
                <Box width="70%" padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
};

export default ListsMenu;
