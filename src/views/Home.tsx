import React from 'react';
import { Box, Text, useInput } from 'ink';
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
        { label: '1. Start Mass Campaign', value: ViewName.CAMPAIGN_SETUP },
        { label: '2. Monitor Campaigns', value: ViewName.CAMPAIGN_MONITOR },
        { label: '3. Manual Sending', value: ViewName.MANUAL_MENU },
        { label: '4. Lists Manager', value: ViewName.LISTS },
        { label: '5. Templates Manager', value: ViewName.TEMPLATES },
        { label: '6. Logs Manager', value: ViewName.LOGS },
        { label: '7. Settings', value: ViewName.SETTINGS },
        { label: '8. Info / About', value: ViewName.INFO },
        { label: '9. Exit', value: 'EXIT' },
    ];

    const handleSelect = (item: any) => {
        if (item.value === 'EXIT') {
            setView(ViewName.EXIT);
            return;
        }
        setView(item.value);
    };

    useInput((input, key) => {
        if (key.escape || input === 'q' || input === 'Q') {
            handleSelect({ value: ViewName.EXIT });
        }

        // Number key shortcuts
        const numMap: { [key: string]: string } = {
            '1': ViewName.CAMPAIGN_SETUP,
            '2': ViewName.CAMPAIGN_MONITOR,
            '3': ViewName.MANUAL_MENU,
            '4': ViewName.LISTS,
            '5': ViewName.TEMPLATES,
            '6': ViewName.LOGS,
            '7': ViewName.SETTINGS,
            '8': ViewName.INFO,
            '9': 'EXIT'
        };

        if (numMap[input]) {
            handleSelect({ value: numMap[input] });
        }
    });

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
                <Box marginTop={1}>
                    <Text color="gray" italic>Press number keys 1-9 or use ↑/↓ arrows to navigate</Text>
                </Box>
            </Box>
        </Box>
    );
};

export default Home;
