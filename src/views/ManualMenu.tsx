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

const ManualMenu: React.FC<Props> = ({ setView, theme }) => {
    const items = [
        { label: 'Send via Amazon SES', value: ViewName.SEND_SES },
        { label: 'Send via Mailgun', value: ViewName.SEND_MAILGUN },
        { label: 'Back to Home', value: ViewName.HOME },
    ];

    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="Manual Sending" />
            <Box flexDirection="column" alignItems="center" marginTop={1}>
                <Text color={theme.accent} bold>Select Provider:</Text>
                <Box marginTop={1} borderStyle="round" borderColor={theme.primary} padding={1}>
                    <SelectInput
                        items={items}
                        onSelect={(item) => setView(item.value)}
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

export default ManualMenu;
