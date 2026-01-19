import fs from 'fs';
import path from 'path';
import type { Campaign } from '../types.js';

const DATA_DIR = path.join(process.cwd(), '.data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(CAMPAIGNS_FILE)) {
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify([]));
}

export const getCampaigns = (): Campaign[] => {
    try {
        const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

export const saveCampaign = (campaign: Campaign) => {
    const campaigns = getCampaigns();
    const existingIndex = campaigns.findIndex(c => c.id === campaign.id);

    if (existingIndex >= 0) {
        campaigns[existingIndex] = campaign;
    } else {
        campaigns.push(campaign);
    }

    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
};

export const getCampaign = (id: string): Campaign | undefined => {
    return getCampaigns().find(c => c.id === id);
};

export const deleteCampaign = (id: string): void => {
    const campaigns = getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(filtered, null, 2));
};
