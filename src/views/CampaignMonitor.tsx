import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName, type Campaign } from '../types.js';
import { type Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { getCampaigns, saveCampaign, deleteCampaign } from '../utils/campaigns.js';
import { logInfo, logWarning, LogCategory } from '../utils/logger.js';
import ScheduledTimeInput from '../components/ScheduledTimeInput.js';

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
    const [editMode, setEditMode] = useState<'none' | 'reschedule' | 'rate'>('none');
    const [tempRateLimit, setTempRateLimit] = useState('');

    useEffect(() => {
        const load = () => {
            const list = getCampaigns();
            list.sort((a, b) => b.startTime - a.startTime); // Newest first

            setCampaigns(prev => {
                // Prevent re-render if data is identical
                if (JSON.stringify(prev) === JSON.stringify(list)) {
                    return prev;
                }
                return list;
            });

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
            saveCampaign(updated, false);
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

    const handleReschedule = (timeString: string) => {
        if (!selectedCampaign) return;
        
        let newStartTime = Date.now();
        if (timeString.includes(':') || timeString.includes('-')) {
            const parsed = Date.parse(timeString);
            if (!isNaN(parsed)) newStartTime = parsed;
        } else {
            const mins = parseInt(timeString);
            if (!isNaN(mins)) newStartTime += mins * 60 * 1000;
        }

        const updated = { ...selectedCampaign, startTime: newStartTime, status: 'scheduled' as const };
        // If it was cancelled or failed, we might want to reset progress? 
        // For now, assume rescheduling implies waiting to start/resume.
        if (updated.status === 'scheduled' && newStartTime <= Date.now()) {
             // TS fix: cast to correct union type
             (updated as any).status = 'pending'; 
        }
        
        saveCampaign(updated, false);
        logInfo(LogCategory.CAMPAIGN, `Campaign rescheduled: ${selectedCampaign.name} to ${new Date(newStartTime).toLocaleString()}`, {
            campaignId: selectedCampaign.id
        });
        setEditMode('none');
        setShowActions(false);
    };

    const handleRateLimitUpdate = (val: string) => {
        if (!selectedCampaign) return;
        const limit = parseInt(val);
        if (!isNaN(limit) && limit > 0) {
            const updated = { ...selectedCampaign, rateLimitPerMinute: limit };
            saveCampaign(updated, false);
            logInfo(LogCategory.CAMPAIGN, `Campaign rate limit updated: ${limit}/min`, {
                campaignId: selectedCampaign.id
            });
        }
        setEditMode('none');
        setShowActions(false);
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

    menuItems.push({ label: '(Q) Back to Home', value: 'HOME' });

    return (
        <Box flexDirection="column" height="100%">
            <Header theme={theme} title="Campaign Monitor" />

            <Box flexDirection="row" flexGrow={1}>
                {/* Left Pane: Campaign List */}
                <Box width="30%" height={20} flexDirection="column" padding={1} borderRightColor={theme.secondary} borderStyle="single">
                    <Text color={theme.accent} bold>Campaigns</Text>
                    <Box marginTop={1}>
                        <SelectInput
                            items={menuItems}
                            isFocused={!showActions} // Disable focus when actions are open
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
                <Box width="70%" height={20} padding={1} flexDirection="column" borderStyle="single" borderColor={theme.secondary}>
                    {selectedCampaign ? (
                        <Box flexDirection="column" height="100%">
                            <Box marginBottom={1} justifyContent="space-between" flexShrink={0}>
                                <Text color={theme.primary} bold underline>{selectedCampaign.name}</Text>
                                <Text color="gray" dimColor>ID: {selectedCampaign.id}</Text>
                            </Box>

                            {/* Render either Details OR Actions to prevent overflow */}
                            {showActions || editMode !== 'none' ? (
                                <Box flexDirection="column" flexGrow={1}>
                                    {/* Action Menu */}
                                    {editMode === 'none' && (
                                        <Box borderStyle="single" borderColor={theme.accent} padding={1} flexDirection="column">
                                            <Text color={theme.accent} bold>Campaign Actions:</Text>
                                            <Box marginTop={1}>
                                                <SelectInput
                                                    items={[
                                                        ...(selectedCampaign.status === 'running' ? [
                                                            { label: '⏸️  Cancel Campaign', value: 'cancel' }
                                                        ] : []),
                                                        ...(selectedCampaign.status === 'scheduled' ? [
                                                            { label: '🕒 Reschedule', value: 'reschedule' },
                                                            { label: '⚡ Change Speed Limit', value: 'rate' }
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
                                                        } else if (item.value === 'reschedule') {
                                                            setEditMode('reschedule');
                                                        } else if (item.value === 'rate') {
                                                            setTempRateLimit(selectedCampaign.rateLimitPerMinute?.toString() || '60');
                                                            setEditMode('rate');
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
                                    )}

                                    {editMode === 'reschedule' && (
                                        <Box borderStyle="single" borderColor={theme.accent} padding={1} flexDirection="column">
                                            <Text color={theme.accent} bold>Reschedule Campaign:</Text>
                                            <Box marginTop={1}>
                                                <ScheduledTimeInput 
                                                    theme={theme}
                                                    onSelect={handleReschedule}
                                                    onCancel={() => setEditMode('none')}
                                                />
                                            </Box>
                                        </Box>
                                    )}

                                    {editMode === 'rate' && (
                                        <Box borderStyle="single" borderColor={theme.accent} padding={1} flexDirection="column">
                                            <Text color={theme.accent} bold>New Speed Limit (emails/min):</Text>
                                            <TextInput 
                                                value={tempRateLimit}
                                                onChange={setTempRateLimit}
                                                onSubmit={handleRateLimitUpdate}
                                                focus={true}
                                            />
                                            <Text color="gray">(Press Enter to save, ESC to cancel)</Text>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box flexDirection="column" flexGrow={1}>
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
                                                <Text>Speed: <Text color={theme.primary}>{selectedCampaign.rateLimitPerMinute} / min</Text></Text>
                                                <Text>Started: <Text color="gray">{formatDate(selectedCampaign.startTime)}</Text></Text>
                                            </Box>
                                        </Box>

                                        <Box flexDirection="column">
                                            <Text bold color={theme.accent}>Progress:</Text>
                                            <Box marginLeft={2} flexDirection="column">
                                                <Text>
                                                    Sent: <Text color={theme.primary}>{selectedCampaign.progress}</Text> /
                                                    <Text color={theme.primary}> {selectedCampaign.total}</Text> recipients
                                                </Text>
                                                <Text>
                                                    Rejected: <Text color={theme.error}>{selectedCampaign.rejected || 0}</Text> / 
                                                    <Text color={theme.secondary}> {selectedCampaign.progress}</Text> <Text color="gray" dimColor>(API Only)</Text>
                                                </Text>
                                                <Text>
                                                    Opened: <Text color={theme.success}>{selectedCampaign.opened || 0}</Text> / 
                                                    <Text color={theme.secondary}> {selectedCampaign.progress}</Text> <Text color="gray" dimColor>(API Only)</Text>
                                                </Text>
                                                <Box marginTop={1}>
                                                    {renderProgressBar(selectedCampaign.progress, selectedCampaign.total)}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box marginTop={1}>
                                        <Text color="gray">Press </Text>
                                        <Text color={theme.accent} bold>A</Text>
                                        <Text color="gray"> to manage this campaign | </Text>
                                        <Text color={theme.accent} bold>Q</Text>
                                        <Text color="gray"> to go back</Text>
                                    </Box>

                                    {selectedCampaign.error && (
                                        <Box marginTop={1} borderStyle="single" borderColor="red" paddingX={1}>
                                            <Text color="red" bold>❌ Error: {selectedCampaign.error.substring(0, 50)}...</Text>
                                        </Box>
                                    )}
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
