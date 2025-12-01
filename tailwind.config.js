/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === PARCHMENT (Aged paper, scrolls) ===
        parchment: {
          light: '#faf7f0',
          DEFAULT: '#f0e9db',
          medium: '#e8dcc4',
          dark: '#d4c5a8',
          aged: '#c9b896',
        },
        // === WOOD (Frames, panels, furniture) ===
        wood: {
          darkest: '#2d2418',
          dark: '#3d3026',
          DEFAULT: '#5c4a3a',
          medium: '#6b5a48',
          light: '#8b7355',
          honey: '#a08465',
        },
        // === LEATHER (Straps, book covers, accents) ===
        leather: {
          dark: '#4a3228',
          DEFAULT: '#6b4e3d',
          worn: '#7a5c4f',
          light: '#8b6b55',
          tan: '#a07d65',
        },
        // === BRONZE (Metal accents, clasps) ===
        bronze: {
          dark: '#7a5c20',
          DEFAULT: '#a67c3d',
          polished: '#cd7f32',
          light: '#d4a574',
          antique: '#8b6914',
        },
        // === GOLD (Premium accents, highlights) ===
        gold: {
          dark: '#8b7500',
          DEFAULT: '#c9a227',
          bright: '#d4af37',
          light: '#e6c65c',
          pale: '#f0dfa0',
          glow: '#ffd700',
        },
        // === MARBLE (Statues, elegant panels) ===
        marble: {
          white: '#f5f3ef',
          cream: '#ebe7df',
          veined: '#e0dcd4',
          grey: '#c9c5bc',
          warm: '#d4cfc5',
        },
        // === NATURE GREENS (Primary theme - bright, not dark!) ===
        nature: {
          mint: '#d4e8d1',
          sage: '#b8c9ad',
          leaf: '#8fb573',
          spring: '#9ec48c',
          forest: '#6b9b5a',
          moss: '#a3b889',
          fern: '#7da668',
        },
        // === SKY BLUES (Secondary accents) ===
        sky: {
          pale: '#d4e5ed',
          light: '#b5d4e1',
          DEFAULT: '#a8c7d7',
          ocean: '#8cb4c9',
          deep: '#6a9ab8',
        },
        // === SEMANTIC COLORS ===
        success: '#7da668',
        warning: '#d4a535',
        error: '#b85c5c',
        info: '#6a9ab8',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'serif'],
        ui: ['Lato', 'sans-serif'],
      },
      fontSize: {
        'xs': '14px',
        'sm': '16px',
        'base': '18px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '30px',
        '3xl': '36px',
        '4xl': '48px',
      },
      spacing: {
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '8': '64px',
        '10': '80px',
        '12': '96px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        // Base shadows
        'fantasy-soft': '0 2px 8px rgba(26, 20, 16, 0.12)',
        'fantasy': '0 4px 16px rgba(26, 20, 16, 0.2)',
        'fantasy-strong': '0 8px 24px rgba(26, 20, 16, 0.35)',
        'fantasy-float': '0 12px 32px rgba(26, 20, 16, 0.4)',
        // Inset shadows
        'fantasy-inset': 'inset 0 2px 6px rgba(26, 20, 16, 0.15)',
        'fantasy-inset-deep': 'inset 0 4px 12px rgba(26, 20, 16, 0.25)',
        // Glows
        'glow-green': '0 0 12px rgba(139, 181, 115, 0.4)',
        'glow-green-strong': '0 0 20px rgba(139, 181, 115, 0.6)',
        'glow-blue': '0 0 12px rgba(168, 199, 215, 0.4)',
        'glow-gold': '0 0 12px rgba(201, 162, 39, 0.5)',
        'glow-gold-strong': '0 0 24px rgba(201, 162, 39, 0.7), 0 0 48px rgba(255, 215, 0, 0.3)',
        // Special effects
        'gold-rim': '0 0 0 1px rgba(201, 162, 39, 0.3), 0 0 0 3px rgba(201, 162, 39, 0.1)',
        'bronze-rim': '0 0 0 1px rgba(166, 124, 61, 0.4), 0 0 0 2px rgba(166, 124, 61, 0.15)',
        'carved': 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)',
      },
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '300ms',
        'slow': '500ms',
      },
    },
  },
  plugins: [],
}
