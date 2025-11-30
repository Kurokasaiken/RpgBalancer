/**
 * Fantasy Theme - TypeScript Definitions
 * 
 * Type-safe access to fantasy theme values
 */

export const FantasyTheme = {
    colors: {
        parchment: {
            light: '#f5f1e8',
            medium: '#e8dcc4',
            dark: '#d4c5a8',
        },
        wood: {
            dark: '#4a3f35',
            medium: '#5c4a3a',
            light: '#8b7355',
            honey: '#a0826d',
        },
        leather: {
            dark: '#6b4e3d',
            medium: '#7a5c4f',
            light: '#8b7355',
        },
        bronze: {
            dark: '#8b6914',
            medium: '#cd7f32',
            light: '#d4a574',
            gold: '#c48945',
        },
        marble: {
            white: '#ebe7df',
            cream: '#ece8e0',
            grey: '#c9c5bc',
        },
        nature: {
            sageGreen: '#b8c5b0',
            forestGreen: '#7fa67e',
            mint: '#c8dfc7',
            moss: '#a3b899',
            skyBlue: '#a8c7d7',
            skyLight: '#b5d4e1',
            ocean: '#8cb4c9',
        },
        accents: {
            warmGold: '#d4c5a0',
            earth: '#c9b8a3',
            olive: '#a8a574',
        },
        text: {
            dark: {
                primary: '#3a3027',
                secondary: '#5a4d3d',
                muted: '#8b7355',
            },
            light: {
                primary: '#f5f1e8',
                secondary: '#e8dcc4',
                muted: '#d4c5a8',
            },
            accent: {
                green: '#5a7a59',
                blue: '#6a8fa8',
            },
        },
    },

    typography: {
        fonts: {
            display: "'Cinzel', serif",
            body: "'Crimson Text', serif",
            ui: "'Lato', sans-serif",
        },
        sizes: {
            xs: '14px',
            sm: '16px',
            base: '18px',
            lg: '20px',
            xl: '24px',
            '2xl': '30px',
            '3xl': '36px',
            '4xl': '48px',
        },
        lineHeights: {
            tight: 1.2,
            normal: 1.6,
            relaxed: 1.8,
            loose: 2.0,
        },
        weights: {
            light: 300,
            normal: 400,
            semibold: 600,
            bold: 700,
        },
    },

    spacing: {
        1: '8px',
        2: '16px',
        3: '24px',
        4: '32px',
        5: '40px',
        6: '48px',
        8: '64px',
        10: '80px',
        12: '96px',
    },

    radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
    },

    shadows: {
        soft: 'rgba(26, 20, 16, 0.15)',
        medium: 'rgba(26, 20, 16, 0.25)',
        strong: 'rgba(26, 20, 16, 0.4)',
    },

    glows: {
        green: 'rgba(127, 166, 126, 0.3)',
        blue: 'rgba(168, 199, 215, 0.3)',
        gold: 'rgba(205, 127, 50, 0.3)',
    },

    transitions: {
        fast: '150ms ease-in-out',
        base: '300ms ease-in-out',
        slow: '500ms ease-in-out',
    },
} as const;

export type FantasyThemeType = typeof FantasyTheme;

// Helper function to get CSS variable
export const getCSSVar = (path: string): string => {
    return `var(--${path})`;
};

// Helper to create shadow
export const createShadow = (
    type: 'soft' | 'medium' | 'strong',
    offsetX: number = 0,
    offsetY: number = 4,
    blur: number = 8
): string => {
    const color = FantasyTheme.shadows[type];
    return `${offsetX}px ${offsetY}px ${blur}px ${color}`;
};

// Helper to create glow effect
export const createGlow = (
    type: 'green' | 'blue' | 'gold',
    size: number = 8
): string => {
    const color = FantasyTheme.glows[type];
    return `0 0 ${size}px ${color}`;
};
