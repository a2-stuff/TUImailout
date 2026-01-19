import React from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import type { Theme } from '../utils/themes.js';

import { APP_VERSION } from '../utils/version.js';

interface Props {
    theme: Theme;
    title?: string;
    compact?: boolean;
}

const Header: React.FC<Props> = ({ theme, title = 'TUImailout', compact = false }) => {
    if (compact) {
        return (
            <Box flexDirection="column" marginBottom={1}>
                <Text color={theme.accent} bold underline>{title}</Text>
                <Box borderStyle="single" borderColor={theme.secondary} width="100%" />
            </Box>
        );
    }

    return (
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
            {title === 'TUImailout' ? (
                <Text color={theme.primary}>
                    {`██████ ██  ██ ██ ▄▄   ▄▄  ▄▄▄  ▄▄ ▄▄     ▄▄▄  ▄▄ ▄▄ ▄▄▄▄▄▄ 
  ██   ██  ██ ██ ██▀▄▀██ ██▀██ ██ ██    ██▀██ ██ ██   ██   
  ██   ▀████▀ ██ ██   ██ ██▀██ ██ ██▄▄▄ ▀███▀ ▀███▀   ██   `}
                </Text>
            ) : (
                <BigText text={title} font="tiny" colors={[theme.primary, theme.secondary, theme.accent]} />
            )}
            <Box marginBottom={1} />
            <Text color={theme.secondary}>v{APP_VERSION} | Created by @not_jarod</Text>
            <Box borderStyle="single" borderColor={theme.primary} width="100%" />
        </Box>
    );
};

export default Header;
