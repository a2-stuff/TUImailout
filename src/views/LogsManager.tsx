import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { ViewName } from '../types.js';
import type { Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import { readLogs, clearLogs, LogLevel, LogCategory } from '../utils/logger.js';
import type { LogEntry } from '../utils/logger.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const LogsManager: React.FC<Props> = ({ setView, theme }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [focusedPane, setFocusedPane] = useState<'menu' | 'content'>('menu');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [scrollOffset, setScrollOffset] = useState(0);
    const PAGE_SIZE = 15;

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(loadLogs, 2000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const loadLogs = () => {
        const allLogs = readLogs();
        setLogs(allLogs.reverse()); // Most recent first
    };

    useInput((input, key) => {
        if (key.escape || input === 'q' || input === 'Q') {
            if (focusedPane === 'content') {
                setFocusedPane('menu');
                setScrollOffset(0);
            } else {
                setView(ViewName.HOME);
            }
        }

        if (focusedPane === 'menu') {
            if (key.rightArrow || key.return) {
                setFocusedPane('content');
            }
        } else {
            if (key.leftArrow) {
                setFocusedPane('menu');
                setScrollOffset(0);
            }
            if (key.upArrow) {
                setScrollOffset(prev => Math.max(0, prev - 1));
            }
            if (key.downArrow) {
                setScrollOffset(prev => {
                    const maxScroll = Math.max(0, filterLogs().length - PAGE_SIZE);
                    return Math.min(maxScroll, prev + 1);
                });
            }
        }
    });

    const filterLogs = (): LogEntry[] => {
        if (selectedCategory === 'ALL') {
            return logs;
        }
        return logs.filter(log => log.category === selectedCategory);
    };

    const getLevelColor = (level: LogLevel): string => {
        switch (level) {
            case LogLevel.SUCCESS:
                return 'green';
            case LogLevel.WARNING:
                return 'yellow';
            case LogLevel.ERROR:
                return 'red';
            default:
                return theme.text;
        }
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getCategoryStats = () => {
        const stats = {
            [LogCategory.SYSTEM]: 0,
            [LogCategory.SETTINGS]: 0,
            [LogCategory.CAMPAIGN]: 0,
            [LogCategory.EMAIL]: 0,
            [LogCategory.ERROR]: 0,
        };

        logs.forEach(log => {
            stats[log.category]++;
        });

        return stats;
    };

    const menuItems = [
        { label: 'All Logs', value: 'ALL' },
        { label: 'System', value: LogCategory.SYSTEM },
        { label: 'Settings', value: LogCategory.SETTINGS },
        { label: 'Campaigns', value: LogCategory.CAMPAIGN },
        { label: 'Emails', value: LogCategory.EMAIL },
        { label: 'Errors Only', value: LogCategory.ERROR },
        { label: '---', value: 'DIVIDER' },
        { label: `Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`, value: 'TOGGLE_REFRESH' },
        { label: 'Clear All Logs', value: 'CLEAR' },
        { label: '(Q) Back to Home', value: 'HOME' }
    ];

    const stats = getCategoryStats();
    const filteredLogs = filterLogs();

    const truncateText = (text: string, maxLength: number = 80): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const formatDetails = (details: any): string[] => {
        if (!details) return [];

        const lines: string[] = [];
        Object.entries(details).forEach(([key, value]) => {
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            lines.push(`  ${key}: ${truncateText(valueStr, 70)}`);
        });
        return lines;
    };

    const renderContent = () => {
        if (filteredLogs.length === 0) {
            return (
                <Box flexDirection="column">
                    <Text color="gray">No logs found.</Text>
                    <Text color="gray">Logs will appear here as you use the application.</Text>
                </Box>
            );
        }

        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text color={theme.primary} bold>
                        {selectedCategory === 'ALL' ? 'All Logs' : `${selectedCategory} Logs`}
                    </Text>
                    <Text color="gray"> ({filteredLogs.length} entries)</Text>
                </Box>

                <Box flexDirection="column" borderStyle="single" borderColor={focusedPane === 'content' ? theme.accent : theme.secondary} padding={1} minHeight={20}>
                    {filteredLogs.slice(scrollOffset, scrollOffset + PAGE_SIZE).map((log, index) => {
                        const detailLines = formatDetails(log.details);

                        return (
                            <Box key={index} flexDirection="column" marginBottom={index < Math.min(filteredLogs.length - 1, 49) ? 1 : 0}>
                                <Box>
                                    <Text color="gray">[{formatTimestamp(log.timestamp).slice(0, 19)}]</Text>
                                    <Text color={getLevelColor(log.level)} bold> {log.level}</Text>
                                    <Text color={theme.accent}> {log.category}</Text>
                                </Box>
                                <Box marginLeft={2}>
                                    <Text>{truncateText(log.message, 90)}</Text>
                                </Box>
                                {detailLines.length > 0 && (
                                    <Box flexDirection="column" marginLeft={2}>
                                        {detailLines.slice(0, 3).map((line, i) => (
                                            <Text key={i} color="gray" dimColor>{line}</Text>
                                        ))}
                                        {detailLines.length > 3 && (
                                            <Text color="gray" dimColor>  ... {detailLines.length - 3} more fields</Text>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                <Box marginTop={1} justifyContent="space-between">
                    <Text color="gray">
                        Showing {scrollOffset + 1}-{Math.min(scrollOffset + PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} entries
                    </Text>
                    {filteredLogs.length > PAGE_SIZE && (
                        <Text color={theme.accent}>
                            ↑/↓ to Scroll {scrollOffset > 0 ? '(More above)' : ''} {scrollOffset + PAGE_SIZE < filteredLogs.length ? '(More below)' : ''}
                        </Text>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Logs Manager" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane: Categories */}
                <Box width="30%" flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Text color={theme.accent} bold>Log Categories</Text>

                    <Box marginTop={1} marginBottom={1} flexDirection="column">
                        <Text color="gray">Statistics:</Text>
                        <Text>System: <Text color={theme.primary}>{stats[LogCategory.SYSTEM]}</Text></Text>
                        <Text>Settings: <Text color={theme.primary}>{stats[LogCategory.SETTINGS]}</Text></Text>
                        <Text>Campaigns: <Text color={theme.primary}>{stats[LogCategory.CAMPAIGN]}</Text></Text>
                        <Text>Emails: <Text color={theme.primary}>{stats[LogCategory.EMAIL]}</Text></Text>
                        <Text>Errors: <Text color="red">{stats[LogCategory.ERROR]}</Text></Text>
                        <Text color="gray">Total: {logs.length}</Text>
                    </Box>

                    <SelectInput
                        items={menuItems}
                        isFocused={focusedPane === 'menu'}
                        onSelect={(item) => {
                            if (item.value === 'HOME') {
                                setView(ViewName.HOME);
                            } else if (item.value === 'CLEAR') {
                                clearLogs();
                                loadLogs();
                            } else if (item.value === 'TOGGLE_REFRESH') {
                                setAutoRefresh(!autoRefresh);
                            } else if (item.value !== 'DIVIDER') {
                                setSelectedCategory(item.value);
                                setFocusedPane('content');
                            }
                        }}
                        onHighlight={(item) => {
                            if (item.value !== 'HOME' && item.value !== 'CLEAR' && item.value !== 'TOGGLE_REFRESH' && item.value !== 'DIVIDER') {
                                setSelectedCategory(item.value);
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

                    <Box marginTop={2}>
                        <Text color="gray" dimColor>
                            {focusedPane === 'menu' ? '↑/↓ Select  Enter/→ View' : 'ESC/Q/← Back to Menu'}
                        </Text>
                    </Box>
                </Box>

                {/* Right Pane: Log Details */}
                <Box width="70%" padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
};

export default LogsManager;
