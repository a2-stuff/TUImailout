import fs from 'fs';
import path from 'path';

export enum LogLevel {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

export enum LogCategory {
    SYSTEM = 'SYSTEM',
    SETTINGS = 'SETTINGS',
    CAMPAIGN = 'CAMPAIGN',
    EMAIL = 'EMAIL',
    ERROR = 'ERROR',
}

export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    category: LogCategory;
    message: string;
    details?: any;
}

const LOG_FILE = path.join(process.cwd(), '.logs', 'app.log');
const MAX_LOGS = 1000; // Keep last 1000 log entries

// Ensure logs directory exists
const ensureLogDirectory = () => {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
};

// Read all logs from file
export const readLogs = (): LogEntry[] => {
    ensureLogDirectory();

    if (!fs.existsSync(LOG_FILE)) {
        return [];
    }

    try {
        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line);
        return lines.map(line => JSON.parse(line));
    } catch (error) {
        return [];
    }
};

// Write a log entry
export const writeLog = (level: LogLevel, category: LogCategory, message: string, details?: any) => {
    ensureLogDirectory();

    const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        category,
        message,
        details
    };

    // Append to log file
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');

    // Trim logs if too many
    trimLogs();
};

// Trim old logs to keep file size manageable
const trimLogs = () => {
    const logs = readLogs();
    if (logs.length > MAX_LOGS) {
        const trimmed = logs.slice(-MAX_LOGS);
        fs.writeFileSync(LOG_FILE, trimmed.map(log => JSON.stringify(log)).join('\n') + '\n');
    }
};

// Clear all logs
export const clearLogs = () => {
    if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
    }
};

// Convenience logging functions
export const logInfo = (category: LogCategory, message: string, details?: any) => {
    writeLog(LogLevel.INFO, category, message, details);
};

export const logSuccess = (category: LogCategory, message: string, details?: any) => {
    writeLog(LogLevel.SUCCESS, category, message, details);
};

export const logWarning = (category: LogCategory, message: string, details?: any) => {
    writeLog(LogLevel.WARNING, category, message, details);
};

export const logError = (category: LogCategory, message: string, details?: any) => {
    writeLog(LogLevel.ERROR, category, message, details);
};
