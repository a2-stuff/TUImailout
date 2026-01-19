import React, { useState, useEffect } from 'react';
import { Box } from 'ink';
import { ViewName } from './types.js';
import Home from './views/Home.js';
import ManualMenu from './views/ManualMenu.js';
import SendSES from './views/SendSES.js';
import SendMailgun from './views/SendMailgun.js';
import SettingsMenu from './views/SettingsMenu.js';
import AmazonSES from './views/settings/AmazonSES.js';
import Mailgun from './views/settings/Mailgun.js';
import FromEmails from './views/settings/FromEmails.js';
import Info from './views/Info.js';
import CampaignSetup from './views/CampaignSetup.js';
import CampaignMonitor from './views/CampaignMonitor.js';
import SendMailchimp from './views/SendMailchimp.js';
import Mailchimp from './views/settings/Mailchimp.js';
import BootAnimation from './components/BootAnimation.js';
import ExitAnimation from './components/ExitAnimation.js';
import { getTheme, type Theme } from './utils/themes.js';
import { getConfig } from './utils/config.js';

const App = () => {
    const [isBooting, setIsBooting] = useState(true);
    const [currentView, setCurrentView] = useState<ViewName>(ViewName.HOME);
    const [themeName, setThemeName] = useState<string>(getConfig<string>('theme') || 'default');
    const [theme, setTheme] = useState<Theme>(getTheme('default'));

    useEffect(() => {
        setTheme(getTheme(themeName));
    }, [themeName]);

    const handleThemeChange = (newTheme: string) => {
        setThemeName(newTheme);
    };

    if (isBooting) {
        return <BootAnimation theme={theme} onComplete={() => setIsBooting(false)} />;
    }

    const renderView = () => {
        switch (currentView) {
            case ViewName.HOME:
                return <Home setView={setCurrentView} theme={theme} />;
            case ViewName.MANUAL_MENU:
                return <ManualMenu setView={setCurrentView} theme={theme} />;
            case ViewName.SEND_SES:
                return <SendSES setView={setCurrentView} theme={theme} />;
            case ViewName.SEND_MAILGUN:
                return <SendMailgun setView={setCurrentView} theme={theme} />;
            case ViewName.SEND_MAILCHIMP:
                return <SendMailchimp setView={setCurrentView} theme={theme} />;
            case ViewName.CAMPAIGN_SETUP:
                return <CampaignSetup setView={setCurrentView} theme={theme} />;
            case ViewName.CAMPAIGN_MONITOR:
                return <CampaignMonitor setView={setCurrentView} theme={theme} />;
            case ViewName.SETTINGS:
                return <SettingsMenu setView={setCurrentView} theme={theme} onThemeChange={handleThemeChange} />;
            case ViewName.SETTINGS_SES:
                return <AmazonSES setView={setCurrentView} theme={theme} />;
            case ViewName.SETTINGS_MAILGUN:
                return <Mailgun setView={setCurrentView} theme={theme} />;
            case ViewName.SETTINGS_MAILCHIMP:
                return <Mailchimp setView={setCurrentView} theme={theme} />;
            case ViewName.SETTINGS_FROM_EMAILS:
                return <FromEmails setView={setCurrentView} theme={theme} />;
            case ViewName.INFO:
                return <Info setView={setCurrentView} theme={theme} />;
            case ViewName.EXIT:
                return <ExitAnimation theme={theme} onComplete={() => process.exit(0)} />;
            default:
                return <Home setView={setCurrentView} theme={theme} />;
        }
    };

    return (
        <Box flexDirection="column" height="100%">
            {renderView()}
        </Box>
    );
};

export default App;