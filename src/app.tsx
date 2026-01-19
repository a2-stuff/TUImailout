import React, { useState, useEffect } from 'react';
import { Box } from 'ink';
import { ViewName } from './types.js';
import Home from './views/Home.js';
import ManualMenu from './views/ManualMenu.js';
import ListsMenu from './views/ListsMenu.js';
import LogsManager from './views/LogsManager.js';
import SettingsMenu from './views/SettingsMenu.js';
import Info from './views/Info.js';
import TemplatesMenu from './views/TemplatesMenu.js';
import CampaignSetup from './views/CampaignSetup.js';
import CampaignMonitor from './views/CampaignMonitor.js';
import BootAnimation from './components/BootAnimation.js';
import ExitAnimation from './components/ExitAnimation.js';
import { getTheme, type Theme } from './utils/themes.js';
import { getConfig } from './utils/config.js';
import { logInfo, LogCategory } from './utils/logger.js';

const App = () => {
    const [isBooting, setIsBooting] = useState(true);
    const [currentView, setCurrentView] = useState<ViewName>(ViewName.HOME);
    const [themeName, setThemeName] = useState<string>(getConfig<string>('theme') || 'default');
    const [theme, setTheme] = useState<Theme>(getTheme('default'));

    useEffect(() => {
        setTheme(getTheme(themeName));
    }, [themeName]);

    useEffect(() => {
        // Log app startup
        logInfo(LogCategory.SYSTEM, 'TUImailout application started');
    }, []);

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
            case ViewName.LISTS:
                return <ListsMenu setView={setCurrentView} theme={theme} />;
            case ViewName.CAMPAIGN_SETUP:
                return <CampaignSetup setView={setCurrentView} theme={theme} />;
            case ViewName.CAMPAIGN_MONITOR:
                return <CampaignMonitor setView={setCurrentView} theme={theme} />;
            case ViewName.SETTINGS:
                return <SettingsMenu setView={setCurrentView} theme={theme} onThemeChange={handleThemeChange} />;
            case ViewName.INFO:
                return <Info setView={setCurrentView} theme={theme} />;
            case ViewName.LOGS:
                return <LogsManager setView={setCurrentView} theme={theme} />;
            case ViewName.TEMPLATES:
                return <TemplatesMenu setView={setCurrentView} theme={theme} />;
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