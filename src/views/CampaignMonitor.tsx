import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ViewName, type Campaign } from '../types.js';
import { type Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';
import { getCampaigns } from '../utils/campaigns.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const CampaignMonitor: React.FC<Props> = ({ setView, theme }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [focusedPane, setFocusedPane] = useState<'menu' | 'content'>('menu');

    useEffect(() => {
        const load = () => {
            const list = getCampaigns();
            list.sort((a, b) => b.startTime - a.startTime); // Newest first
            setCampaigns(list);

            // Auto-select first if none selected
            if (!selectedId && list.length > 0) {
                setSelectedId(list[0].id);
            }
        };
        load();
        const interval = setInterval(load, 1000);
        return () => clearInterval(interval);
    }, []); // Removed selectedId from dependency to avoid resetting selection logic loop, but need to handle updates. 
    // Actually, if we update campaigns, we just want to ensure selectedId is still valid? 
    // For simplicity, just load list.

    useInput((input, key) => {
        if (key.escape) {
            setView(ViewName.HOME);
        }
    });

    const renderProgressBar = (current: number, total: number) => {
        if (total === 0) {
            return <Text>[--------------------] 0%</Text>;
        }
        const width = 20;
        const percentage = Math.min(Math.max(current / total, 0), 1);
        const filled = Math.round(width * percentage);
        const empty = width - filled;
        return (
            <Text>
                [{'█'.repeat(filled)}{'-'.repeat(empty)}] {Math.round(percentage * 100)}%
            </Text>
        );
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
                                    // Maybe optional: focus content? currently content is read-only so menu focus is fine.
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
                            <Text color={theme.primary} bold underline>{selectedCampaign.name}</Text>
                            <Box marginTop={1}>
                                <Text>ID: {selectedCampaign.id}</Text>
                                <Text>Status: <Text color={selectedCampaign.status === 'completed' ? 'green' : selectedCampaign.status === 'failed' ? 'red' : 'yellow'}>{selectedCampaign.status.toUpperCase()}</Text></Text>
                                <Text>Provider: {selectedCampaign.provider}</Text>
                                <Text>From: {selectedCampaign.from}</Text>
                                <Text>Rate Limit: {selectedCampaign.rateLimit}/min</Text>
                            </Box>
                            <Box marginTop={1} flexDirection="column">
                                <Text>Progress: {selectedCampaign.progress} / {selectedCampaign.total}</Text>
                                {renderProgressBar(selectedCampaign.progress, selectedCampaign.total)}
                            </Box>
                            {selectedCampaign.error && (
                                <Box marginTop={1}>
                                    <Text color="red" bold>Error: {selectedCampaign.error}</Text>
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
