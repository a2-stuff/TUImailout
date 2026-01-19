import fs from 'fs';
import path from 'path';

const getAppVersion = (): string => {
    try {
        const packagePath = path.resolve(process.cwd(), 'package.json');
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            return pkg.version || '0.0.0';
        }
    } catch (e) {
        // Fallback
    }
    return '1.0.0';
};

export const APP_VERSION = getAppVersion();
