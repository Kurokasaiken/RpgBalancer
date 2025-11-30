/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          light: '#f5f1e8',
          DEFAULT: '#e8dcc4',
          dark: '#d4c5a8',
        },
        wood: {
          dark: '#4a3f35',
          DEFAULT: '#5c4a3a',
          light: '#8b7355',
          honey: '#a0826d',
        },
        leather: {
          dark: '#6b4e3d',
          DEFAULT: '#7a5c4f',
          light: '#8b7355',
        },
        bronze: {
          dark: '#8b6914',
          DEFAULT: '#cd7f32',
          light: '#d4a574',
          gold: '#c48945',
        },
        marble: {
          white: '#ebe7df',
          cream: '#ece8e0',
          grey: '#c9c5bc',
        },
        sage: {
          DEFAULT: '#b8c5b0',
          light: '#c8dfc7',
        },
        forest: {
          DEFAULT: '#7fa67e',
          moss: '#a3b899',
        },
        sky: {
          DEFAULT: '#a8c7d7',
          light: '#b5d4e1',
          ocean: '#8cb4c9',
        },
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
        'fantasy-soft': '0 4px 8px rgba(26, 20, 16, 0.15)',
        'fantasy': '0 4px 12px rgba(26, 20, 16, 0.25)',
        'fantasy-strong': '0 8px 16px rgba(26,  20, 16, 0.4)',
        'glow-green': '0 0 8px rgba(127, 166, 126, 0.3)',
        'glow-blue': '0 0 8px rgba(168, 199, 215, 0.3)',
        'glow-gold': '0 0 8px rgba(205, 127, 50, 0.3)',
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
