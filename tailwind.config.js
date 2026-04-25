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

        // === FANTASY CARD SYSTEM ===
        // Card surface colors (glassmorphic)
        card: {
          base: 'rgba(4,6,13,0.85)',
          elevated: 'rgba(10,15,28,0.9)',
          border: 'rgba(255,255,255,0.08)',
          'border-active': 'rgba(201,162,39,0.6)',
          'border-valid': 'rgba(16,185,129,0.6)',
          'border-invalid': 'rgba(239,68,68,0.6)',
        },

        // VerbCard variant color tokens
        verb: {
          // Azure variant (cyan/blue - default)
          azure: {
            glow: 'rgba(14,165,233,0.4)',
            accent: 'rgba(129,140,248,0.35)',
            ring: 'rgba(34,211,238,0.4)',
            orb: '#091222',
            'orb-via': '#050a12',
            'orb-to': '#03060a',
            icon: '#e0f2fe',
            timer: '#a5f3fc',
            halo: 'rgba(14,165,233,0.55)',
            'halo-accent': 'rgba(129,140,248,0.55)',
          },
          // Ember variant (orange/red - danger/combat)
          ember: {
            glow: 'rgba(251,146,60,0.4)',
            accent: 'rgba(244,63,94,0.35)',
            ring: 'rgba(251,146,60,0.4)',
            orb: '#1b0b05',
            'orb-via': '#2b0b08',
            'orb-to': '#140403',
            icon: '#fde68a',
            timer: '#fed7aa',
            halo: 'rgba(251,146,60,0.55)',
            'halo-accent': 'rgba(244,63,94,0.5)',
          },
          // Jade variant (green/teal - nature/healing)
          jade: {
            glow: 'rgba(16,185,129,0.4)',
            accent: 'rgba(45,212,191,0.35)',
            ring: 'rgba(52,211,153,0.4)',
            orb: '#04140f',
            'orb-via': '#03201a',
            'orb-to': '#020a07',
            icon: '#a7f3d0',
            timer: '#99f6e4',
            halo: 'rgba(16,185,129,0.55)',
            'halo-accent': 'rgba(45,212,191,0.45)',
          },
          // Amethyst variant (purple/violet - arcane/magic)
          amethyst: {
            glow: 'rgba(167,139,250,0.35)',
            accent: 'rgba(129,140,248,0.35)',
            ring: 'rgba(192,132,252,0.4)',
            orb: '#120320',
            'orb-via': '#1d0c26',
            'orb-to': '#08010f',
            icon: '#e9d5ff',
            timer: '#f5d0fe',
            halo: 'rgba(167,139,250,0.55)',
            'halo-accent': 'rgba(129,140,248,0.5)',
          },
          // Solar variant (gold/amber - special/quest)
          solar: {
            glow: 'rgba(250,204,21,0.35)',
            accent: 'rgba(251,191,36,0.3)',
            ring: 'rgba(253,224,71,0.4)',
            orb: '#251803',
            'orb-via': '#2d1a04',
            'orb-to': '#120901',
            icon: '#fef3c7',
            timer: '#fde68a',
            halo: 'rgba(251,191,36,0.55)',
            'halo-accent': 'rgba(251,146,60,0.45)',
          },
        },

        // SkillCheck zone colors
        zone: {
          safe: 'rgba(16,185,129,0.5)',
          'safe-glow': 'rgba(52,211,153,0.3)',
          injury: 'rgba(251,191,36,0.5)',
          'injury-glow': 'rgba(253,224,71,0.3)',
          death: 'rgba(239,68,68,0.5)',
          'death-glow': 'rgba(248,113,113,0.3)',
        },
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
      // Fantasy animations
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-breathe': 'glowBreathe 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'card-enter': 'cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'column-drop': 'columnDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shake': 'shake 0.3s ease-in-out',
        'ring-pulse': 'ringPulse 2s ease-in-out infinite',
      },
      keyframes: {
        glowBreathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        cardEnter: {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        columnDrop: {
          '0%': { opacity: '0', transform: 'translateY(-100px) scale(0.8)' },
          '60%': { opacity: '1', transform: 'translateY(10px) scale(1.02)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        ringPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 162, 39, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201, 162, 39, 0)' },
        },
      },
      // Enhanced background images for fantasy cards
      backgroundImage: {
        'card-texture': "url('/ui/fantasy/card-background.png')",
        'card-border': "url('/ui/fantasy/card-border-gold.png')",
        'card-glow': "url('/ui/fantasy/card-glow.png')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'shimmer-gold': 'linear-gradient(90deg, transparent 0%, rgba(201,162,39,0.3) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
