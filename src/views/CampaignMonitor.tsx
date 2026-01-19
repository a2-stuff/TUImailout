import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
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

    useEffect(() => {
        const load = () => {
            const list = getCampaigns();
            // Sort by start time desc
            list.sort((a, b) => b.startTime - a.startTime);
            setCampaigns(list);
        };
        load();
        const interval = setInterval(load, 1000);
        return () => clearInterval(interval);
    }, []);

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

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="Campaign Monitor" />
            
            <Box flexDirection="column" marginBottom={1}>
                {campaigns.length === 0 ? (
                    <Text color="gray">No campaigns found.</Text>
                ) : (
                    campaigns.map(c => (
                        <Box key={c.id} flexDirection="column" marginBottom={1} borderStyle="single" borderColor={theme.secondary} paddingX={1}>
                            <Box justifyContent="space-between">
                                <Text color={theme.accent} bold>{c.name}</Text>
                                <Text color={c.status === 'completed' ? 'green' : c.status === 'failed' ? 'red' : 'yellow'}>
                                    {c.status.toUpperCase()}
                                </Text>
                            </Box>
                            <Text color="gray">Provider: {c.provider} | From: {c.from}</Text>
                            <Box justifyContent="space-between">
                                <Text>Progress: {c.progress} / {c.total}</Text>
                                {renderProgressBar(c.progress, c.total)}
                            </Box>
                            {c.error && <Text color="red">Error: {c.error}</Text>}
                        </Box>
                    ))
                )}
            </Box>

            <SelectInput
                items={[{ label: 'Back to Home', value: ViewName.HOME }]}
                onSelect={() => setView(ViewName.HOME)}
            />
        </Box>
    );
};

export default CampaignMonitor;
