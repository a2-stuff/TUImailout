import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ViewName } from '../types.js';
import type { Theme } from '../utils/themes.js';
import Header from '../components/Header.js';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const Home: React.FC<Props> = ({ setView, theme }) => {
    const items = [
        { label: 'Start Mass Campaign', value: ViewName.CAMPAIGN_SETUP },
        { label: 'Monitor Campaigns', value: ViewName.CAMPAIGN_MONITOR },
        { label: 'Manual Sending', value: ViewName.MANUAL_MENU },
        { label: 'Settings', value: ViewName.SETTINGS },
        { label: 'Info / About', value: ViewName.INFO },
        { label: 'Exit', value: 'EXIT' },
    ];

    const handleSelect = (item: any) => {
        if (item.value === 'EXIT') {
            setView(ViewName.EXIT);
            return;
        }
        setView(item.value);
    };

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} />
            <Box flexDirection="column" alignItems="center" marginTop={1}>
                <Text color={theme.accent} bold>Main Menu:</Text>
                <Box marginTop={1} borderStyle="round" borderColor={theme.primary} padding={1}>
                    <SelectInput
                        items={items}
                        onSelect={handleSelect}
                        indicatorComponent={({ isSelected }) => (
                            <Text color={isSelected ? theme.accent : theme.text}>
                                {isSelected ? '> ' : '  '}
                            </Text>
                        )}
                        itemComponent={({ isSelected, label }) => (
                            <Text color={isSelected ? theme.primary : theme.text}>
                                {label}
                            </Text>
                        )}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default Home;
