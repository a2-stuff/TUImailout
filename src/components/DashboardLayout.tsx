import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { type Theme } from '../utils/themes.js';
import { APP_VERSION } from '../utils/version.js';
import { getCampaigns } from '../utils/campaigns.js';
import { getConfig, isSesConfigured, isMailgunConfigured, isMailchimpConfigured } from '../utils/config.js';
import { type SmtpProvider } from '../views/settings/SmtpProviders.js';

interface Props {
    children: React.ReactNode;
    theme: Theme;
    viewName: string;
}

const DashboardLayout: React.FC<Props> = ({ children, theme, viewName }) => {
    const [username, setUsername] = useState('User');
    const [memUsage, setMemUsage] = useState(0);
    const [cpuUsage, setCpuUsage] = useState('0.0');
    const [campaignStats, setCampaignStats] = useState({ running: 0, total: 0 });
    const [resourceStats, setResourceStats] = useState({ lists: 0, templates: 0, providers: 0 });

    const prevCpu = useRef(process.cpuUsage());
    const prevTime = useRef(Date.now());

    useEffect(() => {
        try {
            const user = os.userInfo().username;
            setUsername(user);
        } catch (e) {
            setUsername('Admin');
        }

        const updateStats = () => {
            // Memory
            const mem = process.memoryUsage();
            const hue = Math.round(mem.rss / 1024 / 1024);
            setMemUsage(hue);

            // CPU
            const now = Date.now();
            const timeDiff = now - prevTime.current;
            if (timeDiff > 0) {
                const usageDiff = process.cpuUsage(prevCpu.current);
                // Convert microseconds to milliseconds -> divide by 1000
                // Divide by timeDiff (ms)
                // Multiply by 100 to get percentage
                const cpuPercent = ((usageDiff.user + usageDiff.system) / 1000) / timeDiff * 100;
                setCpuUsage(cpuPercent.toFixed(1));
            }
            prevCpu.current = process.cpuUsage();
            prevTime.current = now;

            // Campaigns
            try {
                const campaigns = getCampaigns();
                const running = campaigns.filter(c => c.status === 'running').length;
                setCampaignStats({ running, total: campaigns.length });
            } catch (e) {
                // Ignore errors reading campaigns
            }

            // Resources
            try {
                // Lists
                const listDir = path.join(process.cwd(), 'lists');
                const listsCount = fs.existsSync(listDir)
                    ? fs.readdirSync(listDir).filter(f => f.endsWith('.csv')).length
                    : 0;

                // Templates
                const tplDir = path.join(process.cwd(), 'templates');
                const tplCount = fs.existsSync(tplDir)
                    ? fs.readdirSync(tplDir).filter(f => fs.statSync(path.join(tplDir, f)).isDirectory() && fs.existsSync(path.join(tplDir, f, 'index.html'))).length
                    : 0;

                // Providers
                const sesCount = isSesConfigured() ? 1 : 0;
                const mailgunCount = isMailgunConfigured() ? 1 : 0;
                const mailchimpCount = isMailchimpConfigured() ? 1 : 0;
                const smtpProviders = getConfig<SmtpProvider[]>('smtpProviders') || [];
                const providerCount = sesCount + mailgunCount + mailchimpCount + smtpProviders.length;

                setResourceStats({ lists: listsCount, templates: tplCount, providers: providerCount });

            } catch (e) {
                // Ignore
            }
        };

        updateStats();
        const interval = setInterval(updateStats, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box flexDirection="column" height="100%" width="100%" borderStyle="single" borderColor={theme.secondary}>
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
                    <Text color={theme.secondary}>App CPU: </Text>
                    <Text color={parseFloat(cpuUsage) > 50 ? theme.error : theme.text}>{cpuUsage}% </Text>
                    <Text color={theme.secondary}>| </Text>
                    <Text color={theme.secondary}>App Mem: </Text>
                    <Text color={memUsage > 500 ? theme.error : theme.text}>{memUsage} MB </Text>
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
                justifyContent="space-between"
            >
                <Box>
                    <Text color={theme.secondary} dimColor>
                        q:Quit  1-9:Navigate  ↑/↓:Select  Enter:Action
                    </Text>
                    <Text color={theme.secondary} dimColor> | </Text>
                    <Text color={theme.secondary}>Campaigns: </Text>
                    <Text color={campaignStats.running > 0 ? theme.success : theme.secondary}>{campaignStats.running}</Text>
                    <Text color={theme.secondary}>/</Text>
                    <Text color={campaignStats.running === 0 && campaignStats.total > 0 ? theme.error : theme.secondary}>{campaignStats.total}</Text>
                    <Text color={theme.secondary} dimColor> | </Text>
                    <Text color={theme.secondary}>
                        Lists: {resourceStats.lists}
                    </Text>
                    <Text color={theme.secondary} dimColor> | </Text>
                    <Text color={theme.secondary}>
                        Templates: {resourceStats.templates}
                    </Text>
                    <Text color={theme.secondary} dimColor> | </Text>
                    <Text color={theme.secondary}>
                        Providers: {resourceStats.providers}
                    </Text>
                    <Text color={theme.secondary} dimColor> | </Text>
                    <Text color={theme.secondary}>Worker: </Text>
                    <Text color={campaignStats.running > 0 ? theme.success : theme.error}>
                        {campaignStats.running > 0 ? 'Running' : 'Paused'}
                    </Text>
                </Box>

            </Box>
        </Box>
    );
};

export default DashboardLayout;
