export type Theme = {
    name: string;
    primary: string; // Hex color
    secondary: string; // Hex color
    accent: string; // Hex color
    text: string; // Hex color
    background: string; // Hex color
    success: string;
    warning: string;
    error: string;
};

export const themes: Record<string, Theme> = {
    default: {
        name: 'Dashboard Protocol',
        primary: '#7aa2f7', // Pastel Blue
        secondary: '#565f89', // Slate Blue/Gray
        accent: '#bb9af7', // Soft Purple
        text: '#c0caf5', // Pale Blue/White
        background: '#1a1b26', // Deep Dark Blue
        success: '#9ece6a', // Soft Green
        warning: '#e0af68', // Soft Orange
        error: '#f7768e', // Soft Red
    },
    midnight: {
        name: 'Midnight Run',
        primary: '#C792EA', // Light Purple
        secondary: '#292D3E', // Dark Blue
        accent: '#82AAFF', // Soft Blue
        text: '#EEFFFF', // White
        background: '#0F111A', // Very Dark Blue
        success: '#C3E88D', // Soft Green
        warning: '#FFCB6B', // Soft Yellow
        error: '#FF5370', // Soft Red
    },
    neon: {
        name: 'Neon Nights',
        primary: '#39FF14',
        secondary: '#FF00FF',
        accent: '#00FFFF',
        text: '#FFFFFF',
        background: '#0D0D0D',
        success: '#32CD32',
        warning: '#FFD700',
        error: '#FF4500',
    },
    toxic: {
        name: 'Toxic Waste',
        primary: '#ADFF2F',
        secondary: '#00FF00',
        accent: '#FFFF00',
        text: '#F5F5F5',
        background: '#001a00',
        success: '#7FFF00',
        warning: '#FFD700',
        error: '#FF6347',
    },
    cobalt: {
        name: 'Cobalt Strike',
        primary: '#0047AB',
        secondary: '#FF4500',
        accent: '#FFD700',
        text: '#E0E0E0',
        background: '#000814',
        success: '#00FA9A',
        warning: '#FFA500',
        error: '#DC143C',
    },
    amber: {
        name: 'Retro Amber',
        primary: '#FFB000',
        secondary: '#FFCC00',
        accent: '#805500',
        text: '#FFB000',
        background: '#1B1000',
        success: '#9ACD32',
        warning: '#DAA520',
        error: '#8B0000',
    },
    matrix: {
        name: 'Matrix Ghost',
        primary: '#00FF41',
        secondary: '#008F11',
        accent: '#003B00',
        text: '#0DFF2D',
        background: '#000000',
        success: '#00FF00',
        warning: '#FFFF00',
        error: '#FF0000',
    },
    solar: {
        name: 'Solar Flare',
        primary: '#FF4500', // Orange Red
        secondary: '#8B0000', // Dark Red
        accent: '#FFD700', // Gold
        text: '#FFF5EE', // Seashell
        background: '#1a0500', // Dark Red/Black
        success: '#32CD32',
        warning: '#FFA500',
        error: '#FF0000',
    },
    ocean: {
        name: 'Deep Ocean',
        primary: '#00FFFF', // Cyan
        secondary: '#008B8B', // Dark Cyan
        accent: '#7FFFD4', // Aquamarine
        text: '#E0FFFF', // Light Cyan
        background: '#001f1f', // Very Dark Teal
        success: '#00FA9A',
        warning: '#FFFFE0',
        error: '#FF6347',
    },
    volcano: {
        name: 'Obsidian Magma',
        primary: '#FF5733', // Red/Orange
        secondary: '#4D4D4D', // Grey
        accent: '#C70039', // Dark Red
        text: '#D3D3D3', // Light Grey
        background: '#1C1C1C', // Almost Black
        success: '#28B463',
        warning: '#FFC300',
        error: '#900C3F',
    }
};

export const getTheme = (name: string): Theme => {
    return themes[name] || themes.default;
};