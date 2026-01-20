import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import type { Theme } from '../utils/themes.js';

interface Props {
    theme: Theme;
    onSelect: (value: string) => void; // Returns minutes (string) or ISO date string
    onCancel: () => void;
}

const ScheduledTimeInput: React.FC<Props> = ({ theme, onSelect, onCancel }) => {
    const [mode, setMode] = useState<'type' | 'delay' | 'year' | 'month' | 'day' | 'hour' | 'minute'>('type');
    const [delay, setDelay] = useState('');
    
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear().toString());
    const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
    const [day, setDay] = useState(now.getDate().toString().padStart(2, '0'));
    const [hour, setHour] = useState(now.getHours().toString().padStart(2, '0'));
    
    // Type Selection
    if (mode === 'type') {
        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Schedule Method:</Text>
                <SelectInput items={[
                    { label: 'Enter Delay (Minutes)', value: 'delay' },
                    { label: 'Select Date & Time', value: 'picker' },
                    { label: 'Cancel', value: 'cancel' }
                ]} onSelect={(item) => {
                    if (item.value === 'delay') setMode('delay');
                    else if (item.value === 'picker') setMode('year');
                    else onCancel();
                }} />
            </Box>
        );
    }

    // Delay Input
    if (mode === 'delay') {
        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Enter delay in minutes:</Text>
                <TextInput 
                    value={delay} 
                    onChange={setDelay} 
                    onSubmit={() => onSelect(delay)} 
                    placeholder="e.g. 60"
                />
                <Text color="gray">(Press Enter to confirm)</Text>
            </Box>
        );
    }

    // Year Selection
    if (mode === 'year') {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString())
            .map(y => ({ label: y, value: y }));
        
        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select Year:</Text>
                <SelectInput items={years} onSelect={(item) => {
                    setYear(item.value);
                    setMode('month');
                }} />
            </Box>
        );
    }

    // Month Selection
    if (mode === 'month') {
        const months = [
            { label: 'January', value: '01' }, { label: 'February', value: '02' },
            { label: 'March', value: '03' }, { label: 'April', value: '04' },
            { label: 'May', value: '05' }, { label: 'June', value: '06' },
            { label: 'July', value: '07' }, { label: 'August', value: '08' },
            { label: 'September', value: '09' }, { label: 'October', value: '10' },
            { label: 'November', value: '11' }, { label: 'December', value: '12' }
        ];
        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select Month:</Text>
                <SelectInput 
                    items={months} 
                    limit={8}
                    initialIndex={parseInt(month) - 1}
                    onSelect={(item) => {
                        setMonth(item.value);
                        setMode('day');
                    }} 
                />
            </Box>
        );
    }

    // Day Selection
    if (mode === 'day') {
        // Calculate days in month
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'))
            .map(d => ({ label: d, value: d }));
        
        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select Day:</Text>
                <SelectInput 
                    items={days} 
                    limit={8}
                    initialIndex={parseInt(day) - 1}
                    onSelect={(item) => {
                        setDay(item.value);
                        setMode('hour');
                    }} 
                />
            </Box>
        );
    }

    // Hour Selection
    if (mode === 'hour') {
        const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
            .map(h => ({ label: `${h}:00`, value: h }));
        
        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select Hour (24h):</Text>
                <SelectInput 
                    items={hours} 
                    limit={8}
                    initialIndex={parseInt(hour)}
                    onSelect={(item) => {
                        setHour(item.value);
                        setMode('minute');
                    }} 
                />
            </Box>
        );
    }

    // Minute Selection
    if (mode === 'minute') {
        // 5 minute intervals for easier selection
        const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))
            .map(m => ({ label: m, value: m }));
        
        return (
            <Box flexDirection="column">
                <Text color={theme.accent}>Select Minute:</Text>
                <SelectInput 
                    items={minutes} 
                    onSelect={(item) => {
                        // Construct ISO string roughly
                        const dateStr = `${year}-${month}-${day}T${hour}:${item.value}:00`;
                        onSelect(dateStr);
                    }} 
                />
            </Box>
        );
    }

    return null;
};

export default ScheduledTimeInput;
