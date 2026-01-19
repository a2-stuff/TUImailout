import React from 'react';
import { Box, Text, Newline } from 'ink';
import { ViewName } from '../types.js';
import type { Theme } from '../utils/themes.js';
import Header from '../components/Header.js';
import SelectInput from 'ink-select-input';

interface Props {
    setView: (view: ViewName) => void;
    theme: Theme;
}

const Info: React.FC<Props> = ({ setView, theme }) => {
    return (
        <Box flexDirection="column" padding={2}>
            <Header theme={theme} title="Info" />
            <Box flexDirection="column" borderStyle="round" borderColor={theme.secondary} padding={1} marginBottom={1}>
                <Text color={theme.text}>Application: TUImailout</Text>
                <Text color={theme.text}>Version: 1.3.0</Text>
                <Text color={theme.text}>Creator: @not_jarod</Text>
                <Text color={theme.primary} underline>https://github.com/not_jarod</Text>
                <Newline />
                <Text color={theme.text}>
                    A powerful TUI application to send mass emails using Amazon SES and Mailgun.
                    Configure your API keys in Settings before sending.
                </Text>
            </Box>
             <SelectInput
                items={[{ label: 'Back to Home', value: ViewName.HOME }]}
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
    );
};

export default Info;