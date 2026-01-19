import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName, type Campaign } from '../types.js';
import { type Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import { getCampaigns, saveCampaign, deleteCampaign } from '../utils/campaigns.js';
import { logInfo, logWarning, LogCategory } from '../utils/logger.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const CampaignMonitor: React.FC<Props> = ({ setView, theme }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [focusedPane, setFocusedPane] = useState<'menu' | 'content'>('menu');
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        const load = () => {
            const list = getCampaigns();
            list.sort((a, b) => b.startTime - a.startTime); // Newest first
            setCampaigns(list);

            // Only auto-select on first load, not on subsequent updates
            if (!hasInitialized && list.length > 0) {
                setSelectedId(list[0].id);
                setHasInitialized(true);
            }
        };
        load();
        const interval = setInterval(load, 1000);
        return () => clearInterval(interval);
    }, [hasInitialized]);

    useInput((input, key) => {
        if (key.escape || input === 'q' || input === 'Q') {
            if (showActions) {
                setShowActions(false);
            } else {
                setView(ViewName.HOME);
            }
        }

        // A key to toggle actions menu
        if ((input === 'a' || input === 'A') && selectedCampaign && !showActions) {
            setShowActions(true);
        }
    });

    const handleCancelCampaign = () => {
        if (selectedCampaign && selectedCampaign.status === 'running') {
            const updated = { ...selectedCampaign, status: 'cancelled' as const };
            saveCampaign(updated);
            logWarning(LogCategory.CAMPAIGN, `Campaign cancelled: ${selectedCampaign.name}`, {
                campaignId: selectedCampaign.id
            });
            setShowActions(false);
        }
    };

    const handleDeleteCampaign = () => {
        if (selectedCampaign) {
            deleteCampaign(selectedCampaign.id);
            logInfo(LogCategory.CAMPAIGN, `Campaign deleted: ${selectedCampaign.name}`, {
                campaignId: selectedCampaign.id
            });
            setSelectedId(null);
            setShowActions(false);
            setHasInitialized(false); // Will reselect first campaign
        }
    };

    const renderProgressBar = (current: number, total: number) => {
        if (total === 0) {
            return <Text>No recipients</Text>;
        }
        const width = 30;
        const percentage = Math.min(Math.max(current / total, 0), 1);
        const filled = Math.round(width * percentage);
        const empty = width - filled;
        return (
            <Box flexDirection="column">
                <Text>
                    [{'█'.repeat(filled)}{'-'.repeat(empty)}]
                </Text>
                <Text color={theme.accent}>{Math.round(percentage * 100)}% Complete</Text>
            </Box>
        );
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'failed': return 'red';
            case 'running': return 'yellow';
            case 'cancelled': return 'magenta';
            default: return 'gray';
        }
    };

    const selectedCampaign = campaigns.find(c => c.id === selectedId);

    const menuItems = campaigns.map(c => ({
        label: `${c.name} (${c.status})`,
        value: c.id
    }));

    if (menuItems.length === 0) {
        menuItems.push({ label: 'No active campaigns', value: 'NONE' });
    }

    menuItems.push({ label: 'Back to Home', value: 'HOME' });

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Campaign Monitor" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane: Campaign List */}
                <Box width="30%" flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Text color={theme.accent} bold>Campaigns</Text>
                    <Box marginTop={1}>
                        <SelectInput
                            items={menuItems}
                            onSelect={(item) => {
                                if (item.value === 'HOME') {
                                    setView(ViewName.HOME);
                                } else if (item.value !== 'NONE') {
                                    setSelectedId(item.value);
                                }
                            }}
                            onHighlight={(item) => {
                                if (item.value !== 'HOME' && item.value !== 'NONE') {
                                    setSelectedId(item.value);
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

                {/* Right Pane: Details */}
                <Box width="70%" padding={2} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {selectedCampaign ? (
                        <Box flexDirection="column">
                            <Box marginBottom={1}>
                                <Text color={theme.primary} bold underline>{selectedCampaign.name}</Text>
                            </Box>

                            <Box borderStyle="round" borderColor={theme.secondary} padding={1} flexDirection="column">
                                <Box marginBottom={1}>
                                    <Text bold color={theme.accent}>Status:</Text>
                                    <Text> </Text>
                                    <Text color={getStatusColor(selectedCampaign.status)} bold>
                                        {selectedCampaign.status.toUpperCase()}
                                    </Text>
                                </Box>

                                <Box marginBottom={1} flexDirection="column">
                                    <Text bold color={theme.accent}>Campaign Details:</Text>
                                    <Box marginLeft={2} flexDirection="column">
                                        <Text>Provider: <Text color={theme.primary}>{selectedCampaign.provider.toUpperCase()}</Text></Text>
                                        <Text>From: <Text color={theme.primary}>{selectedCampaign.from}</Text></Text>
                                        <Text>Rate Limit: <Text color={theme.primary}>{selectedCampaign.rateLimit} emails/min</Text></Text>
                                        <Text>Started: <Text color="gray">{formatDate(selectedCampaign.startTime)}</Text></Text>
                                    </Box>
                                </Box>

                                <Box marginBottom={1} flexDirection="column">
                                    <Text bold color={theme.accent}>Progress:</Text>
                                    <Box marginLeft={2} flexDirection="column">
                                        <Text>
                                            Sent: <Text color={theme.primary}>{selectedCampaign.progress}</Text> /
                                            <Text color={theme.primary}> {selectedCampaign.total}</Text> recipients
                                        </Text>
                                        <Box marginTop={1}>
                                            {renderProgressBar(selectedCampaign.progress, selectedCampaign.total)}
                                        </Box>
                                    </Box>
                                </Box>

                                <Box flexDirection="column">
                                    <Text bold color={theme.accent}>Technical Info:</Text>
                                    <Box marginLeft={2}>
                                        <Text color="gray" dimColor>ID: {selectedCampaign.id}</Text>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Action Menu */}
                            {showActions ? (
                                <Box marginTop={2} borderStyle="single" borderColor={theme.accent} padding={1}>
                                    <Box flexDirection="column">
                                        <Text color={theme.accent} bold>Campaign Actions:</Text>
                                        <Box marginTop={1}>
                                            <SelectInput
                                                items={[
                                                    ...(selectedCampaign.status === 'running' ? [
                                                        { label: '⏸️  Cancel Campaign', value: 'cancel' }
                                                    ] : []),
                                                    { label: '🗑️  Delete Campaign', value: 'delete' },
                                                    { label: '← Back', value: 'back' }
                                                ]}
                                                isFocused={true}
                                                onSelect={(item) => {
                                                    if (item.value === 'cancel') {
                                                        handleCancelCampaign();
                                                    } else if (item.value === 'delete') {
                                                        handleDeleteCampaign();
                                                    } else {
                                                        setShowActions(false);
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
                                </Box>
                            ) : (
                                <Box marginTop={2}>
                                    <Text color="gray">Press </Text>
                                    <Text color={theme.accent} bold>A</Text>
                                    <Text color="gray"> to manage this campaign | </Text>
                                    <Text color={theme.accent} bold>Q</Text>
                                    <Text color="gray"> to go back</Text>
                                </Box>
                            )}

                            {selectedCampaign.error && (
                                <Box marginTop={2} borderStyle="single" borderColor="red" padding={1}>
                                    <Box flexDirection="column">
                                        <Text color="red" bold>❌ Error:</Text>
                                        <Text color="red">{selectedCampaign.error}</Text>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Text color="gray">Select a campaign to view details.</Text>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CampaignMonitor;
