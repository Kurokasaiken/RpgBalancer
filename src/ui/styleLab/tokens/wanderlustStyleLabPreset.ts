import type { StyleLabPreset } from './defaultStyleLabPreset';

/**
 * Style Lab tokens for the Wanderlust preset.
 */
export const WANDERLUST_STYLE_LAB_PRESET: StyleLabPreset = {
  name: 'Wanderlust',
  description: 'Gilded Observatory variant with warm-black surfaces and narrative scope colors.',
  surfaces: {
    panel: {
      background: 'rgba(9,8,6,0.94)',
      borderRadius: '3px',
      border: '1px solid rgba(255,255,255,0.055)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.98), 0 6px 18px rgba(0,0,0,1)',
      position: 'relative',
    },
    card: {
      background: 'rgba(13,11,8,0.96)',
      borderRadius: '2px',
      border: '1px solid rgba(255,255,255,0.04)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.95)',
    },
  },
  typography: {
    headingFont: 'var(--font-display, "Cinzel", serif)',
    bodyFont: 'var(--font-body, "EB Garamond", Georgia, serif)',
  },
  modifierScopes: {
    GLOBAL: {
      background: 'linear-gradient(120deg, rgba(192,112,40,0.22), rgba(192,112,40,0.08))',
      border: 'rgba(216,144,64,0.65)',
      foreground: '#f8d888',
      glow: 'rgba(192,112,40,0.40)',
    },
    SESSION: {
      background: 'linear-gradient(120deg, rgba(44,116,66,0.22), rgba(44,116,66,0.08))',
      border: 'rgba(58,140,80,0.60)',
      foreground: '#a0cc9a',
      glow: 'rgba(44,116,66,0.36)',
    },
    LOCATION: {
      background: 'linear-gradient(120deg, rgba(138,88,30,0.24), rgba(138,88,30,0.08))',
      border: 'rgba(176,120,48,0.62)',
      foreground: '#d4a870',
      glow: 'rgba(138,88,30,0.35)',
    },
    QUEST: {
      background: 'linear-gradient(120deg, rgba(96,60,130,0.22), rgba(96,60,130,0.08))',
      border: 'rgba(130,90,170,0.58)',
      foreground: '#c8a8e8',
      glow: 'rgba(96,60,130,0.32)',
    },
    RESIDENT: {
      background: 'linear-gradient(120deg, rgba(138,56,56,0.22), rgba(138,56,56,0.08))',
      border: 'rgba(176,72,72,0.58)',
      foreground: '#e8a898',
      glow: 'rgba(138,56,56,0.32)',
    },
  },
  modifierStatus: {
    active: {
      background: 'rgba(44,116,66,0.14)',
      border: 'rgba(58,140,80,0.55)',
      foreground: '#a0cc9a',
    },
    expired: {
      background: 'rgba(48,36,24,0.28)',
      border: 'rgba(96,72,48,0.40)',
      foreground: '#6e5838',
    },
    upcoming: {
      background: 'rgba(192,112,40,0.10)',
      border: 'rgba(192,112,40,0.35)',
      foreground: '#c0a060',
    },
  },
};
