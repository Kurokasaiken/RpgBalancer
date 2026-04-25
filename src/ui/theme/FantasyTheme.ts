/**
 * Fantasy Theme - Enchanted Grove Edition
 * 
 * Type-safe access to fantasy theme values
 * Palette: Nature greens + Parchment + Wood/Leather + Marble + Bronze/Gold
 */

export const FantasyTheme = {
    colors: {
        // === NATURE GREENS (Primary - Bright, Natural!) ===
        nature: {
            mint: '#d4e8d1',
            sage: '#b8c9ad',
            spring: '#9ec48c',
            leaf: '#8fb573',
            fern: '#7da668',
            forest: '#6b9b5a',
            moss: '#a3b889',
        },
        // === PARCHMENT (Paper, Scrolls) ===
        parchment: {
            light: '#faf7f0',
            DEFAULT: '#f0e9db',
            medium: '#e8dcc4',
            dark: '#d4c5a8',
            aged: '#c9b896',
        },
        // === WOOD (Panels, Frames) ===
        wood: {
            darkest: '#2d2418',
            dark: '#3d3026',
            DEFAULT: '#5c4a3a',
            medium: '#6b5a48',
            light: '#8b7355',
            honey: '#a08465',
        },
        // === LEATHER (Straps, Covers) ===
        leather: {
            dark: '#4a3228',
            DEFAULT: '#6b4e3d',
            worn: '#7a5c4f',
            light: '#8b6b55',
            tan: '#a07d65',
        },
        // === BRONZE (Metal Accents) ===
        bronze: {
            dark: '#7a5c20',
            DEFAULT: '#a67c3d',
            polished: '#cd7f32',
            light: '#d4a574',
            antique: '#8b6914',
        },
        // === GOLD (Premium Highlights!) ===
        gold: {
            dark: '#8b7500',
            DEFAULT: '#c9a227',
            bright: '#d4af37',
            light: '#e6c65c',
            pale: '#f0dfa0',
            glow: '#ffd700',
        },
        // === MARBLE (Elegant Panels, Statues) ===
        marble: {
            white: '#f5f3ef',
            cream: '#ebe7df',
            veined: '#e0dcd4',
            grey: '#c9c5bc',
            warm: '#d4cfc5',
        },
        // === SKY (Secondary Accents) ===
        sky: {
            pale: '#d4e5ed',
            light: '#b5d4e1',
            DEFAULT: '#a8c7d7',
            ocean: '#8cb4c9',
            deep: '#6a9ab8',
        },
        // === SEMANTIC ===
        success: '#7da668',
        warning: '#d4a535',
        error: '#b85c5c',
        info: '#6a9ab8',
        // === TEXT ===
        text: {
            dark: '#2c241b',
            medium: '#4a3f35',
            light: '#f5f3ef',
            gold: '#d4af37',
            bronze: '#cd7f32',
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
