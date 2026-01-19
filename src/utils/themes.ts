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
};

export const getTheme = (name: string): Theme => {
    return themes[name] || themes.default;
};
