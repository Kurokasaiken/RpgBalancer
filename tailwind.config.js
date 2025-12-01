/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === GILDED OBSERVATORY THEME ===
        // Deep dark backgrounds
        obsidian: {
          darkest: '#050509',
          dark: '#0f1a1d',
          DEFAULT: '#132427',
          light: '#0c1517',
          muted: '#0b1315',
        },
        // Teal-grey borders and surfaces
        slate: {
          darkest: '#2c3737',
          dark: '#384444',
          DEFAULT: '#3b4b4d',
          light: '#3e4d4d',
          muted: '#404f51',
          border: '#475758',
        },
        // Ivory/cream text colors
        ivory: {
          DEFAULT: '#f0efe4',
          bright: '#f6f3e4',
          warm: '#f5f0dc',
          muted: '#f3eddb',
          dark: '#cfdfd8',
        },
        // Teal accent colors
        teal: {
          DEFAULT: '#8db3a5',
          light: '#9fb3af',
          muted: '#96aaa6',
          soft: '#aeb8b4',
          pale: '#b3c8c4',
          dim: '#6da8a0',
        },
        // Gold/bronze accents
        gold: {
          DEFAULT: '#c9a227',
          bright: '#f1d69c',
          warm: '#d9bf7d',
          dark: '#a7894f',
          muted: '#c7b996',
          glow: '#ffd700',
        },
        // Legacy compatibility
        parchment: {
          light: '#f0efe4',
          DEFAULT: '#f5f0dc',
        },
        wood: {
          darkest: '#050509',
          dark: '#0f1a1d',
          DEFAULT: '#132427',
        },
        nature: {
          leaf: '#6da8a0',
          forest: '#8db3a5',
        },
        // Semantic colors
        success: '#6da8a0',
        warning: '#c9a227',
        error: '#a85c5c',
        info: '#8db3a5',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'serif'],
        ui: ['Lato', 'sans-serif'],
      },
      // Compact typography scale (base 14px, not 18px)
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs': ['11px', { lineHeight: '16px' }],
        'sm': ['12px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'lg': ['16px', { lineHeight: '24px' }],
        'xl': ['18px', { lineHeight: '26px' }],
        '2xl': ['22px', { lineHeight: '30px' }],
        '3xl': ['26px', { lineHeight: '34px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
        '5xl': ['40px', { lineHeight: '48px' }],
      },
      // Compact spacing scale (base 4px)
      spacing: {
        'px': '1px',
        '0': '0px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '9999px',
      },
      // Mobile-first breakpoints
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
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
