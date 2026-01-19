import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import os from 'os';
import { type Theme } from '../utils/themes.js';
import { APP_VERSION } from '../utils/version.js';

interface Props {
    children: React.ReactNode;
    theme: Theme;
    viewName: string;
}

const DashboardLayout: React.FC<Props> = ({ children, theme, viewName }) => {
    const [username, setUsername] = useState('User');
    const [memUsage, setMemUsage] = useState(0);

    useEffect(() => {
        try {
            const user = os.userInfo().username;
            setUsername(user);
        } catch (e) {
            setUsername('Admin');
        }

        const updateMem = () => {
            const total = os.totalmem();
            const free = os.freemem();
            const used = total - free;
            setMemUsage(Math.round((used / total) * 100));
        };

        updateMem();
        const interval = setInterval(updateMem, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box flexDirection="column" height="100%" borderStyle="single" borderColor={theme.secondary}>
            {/* Top Status Bar */}
            <Box
                width="100%"
                height={1}
                paddingX={1}
                borderStyle="single"
                borderBottom={false}
                borderTop={false}
                borderLeft={false}
                borderRight={false}
                borderColor={theme.secondary}
                justifyContent="space-between"
            >
                <Box>
                    <Text color={theme.primary} bold> TUImailout </Text>
                    <Text color={theme.secondary}> | </Text>
                    <Text color={theme.accent}> {viewName} </Text>
                </Box>
                <Box>
                    <Text color={theme.secondary}>Mem: </Text>
                    <Text color={memUsage > 80 ? theme.error : theme.text}>{memUsage}% </Text>
                    <Text color={theme.secondary}>| User: </Text>
                    <Text color={theme.text}>{username} </Text>
                    <Text color={theme.secondary}>| Ver: </Text>
                    <Text color={theme.success}>v{APP_VERSION}</Text>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box flexGrow={1} flexDirection="column" padding={1}>
                {children}
            </Box>

            {/* Bottom Status Bar */}
            <Box
                width="100%"
                paddingX={1}
                borderTopColor={theme.secondary}
                borderStyle="single"
                borderBottom={false}
                borderLeft={false}
                borderRight={false}
            >
                <Text color={theme.secondary} dimColor>
                    q:Quit  1-9:Navigate  ↑/↓:Select  Enter:Action
                </Text>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
