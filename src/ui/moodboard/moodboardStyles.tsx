import type { ReactNode } from 'react';

/**
 * Declarative style descriptor for the Moodboard screen so designs can be iterated rapidly
 * without editing the component logic. Each style only exposes tokens so presentation stays
 * fully config-driven.
 */
export interface MoodboardStyle {
  /** Unique identifier used for selection */
  id: string;
  /** Display label shown in the UI */
  label: string;
  /** Helper copy explaining the vibe of the preset */
  description: string;
  /** Optional React node rendered inside the info panel header */
  badge?: ReactNode;
  /** Autoplay speed override per style (ms) */
  autoAdvanceMs: number;
  /** CSS variable tokens applied to the Moodboard root */
  tokens: Record<string, string>;
}

const gildedTokens: Record<string, string> = {
  'mood-background': '#050509',
  'mood-background-overlay': 'linear-gradient(135deg, rgba(5,5,9,0.95), rgba(4,7,14,0.85))',
  'mood-text-primary': '#f7f4ea',
  'mood-text-secondary': '#f8d97c',
  'mood-text-muted': 'rgba(226,232,240,0.72)',
  'mood-accent': '#c9a227',
  'mood-accent-glow': 'rgba(201,162,39,0.4)',
  'mood-control-border': 'rgba(201,162,39,0.4)',
  'mood-control-bg': 'rgba(5,9,14,0.75)',
  'mood-control-hover-bg': 'rgba(255,255,255,0.08)',
  'mood-control-text': '#f7f4ea',
  'mood-control-active-border': '#c9a227',
  'mood-control-active-bg': 'rgba(201,162,39,0.18)',
  'mood-control-active-text': '#ffffff',
  'mood-panel-border': 'rgba(201,162,39,0.35)',
  'mood-panel-surface': 'rgba(5,7,13,0.82)',
  'mood-panel-shadow': '0 30px 60px rgba(5,5,9,0.55)',
  'mood-panel-radius': '32px',
  'mood-chip-border': 'rgba(255,255,255,0.3)',
  'mood-chip-bg': 'rgba(3,6,9,0.45)',
  'mood-chip-text': '#f0efe4',
  'mood-frame-radius': '36px',
  'mood-frame-border': 'rgba(255,255,255,0.08)',
  'mood-frame-shadow': '0 35px 70px rgba(5,5,9,0.65)',
  'mood-frame-surface': 'linear-gradient(145deg, rgba(5,7,12,0.9), rgba(10,16,25,0.65))',
  'mood-frame-aura': 'radial-gradient(circle at 25% 25%, rgba(201,162,39,0.35), transparent 65%)',
  'mood-component-border': 'rgba(255,255,255,0.12)',
  'mood-component-surface': 'rgba(5,8,14,0.78)',
  'mood-component-shadow': '0 25px 45px rgba(0,0,0,0.55)',
  'mood-component-radius': '28px',
  'mood-component-muted': 'rgba(226,232,240,0.65)',
  'mood-info-border': 'rgba(255,255,255,0.16)',
  'mood-info-surface': 'rgba(4,7,12,0.92)',
  'mood-info-shadow': '0 30px 55px rgba(0,0,0,0.45)',
};

const nocturneTokens: Record<string, string> = {
  'mood-background': '#01050f',
  'mood-background-overlay': 'linear-gradient(160deg, rgba(2,6,23,0.95), rgba(4,17,30,0.85))',
  'mood-text-primary': '#d0ecff',
  'mood-text-secondary': '#7dd3fc',
  'mood-text-muted': 'rgba(190,228,255,0.75)',
  'mood-accent': '#22d3ee',
  'mood-accent-glow': 'rgba(34,211,238,0.5)',
  'mood-control-border': 'rgba(34,211,238,0.35)',
  'mood-control-bg': 'rgba(4,10,32,0.9)',
  'mood-control-hover-bg': 'rgba(125,211,252,0.12)',
  'mood-control-text': '#e0f2ff',
  'mood-control-active-border': '#22d3ee',
  'mood-control-active-bg': 'rgba(34,211,238,0.18)',
  'mood-control-active-text': '#0f172a',
  'mood-panel-border': 'rgba(34,211,238,0.35)',
  'mood-panel-surface': 'rgba(5,12,36,0.85)',
  'mood-panel-shadow': '0 35px 65px rgba(2,6,23,0.75)',
  'mood-panel-radius': '36px',
  'mood-chip-border': 'rgba(125,211,252,0.45)',
  'mood-chip-bg': 'rgba(8,23,56,0.8)',
  'mood-chip-text': '#a5f3fc',
  'mood-frame-radius': '40px',
  'mood-frame-border': 'rgba(34,211,238,0.25)',
  'mood-frame-shadow': '0 40px 80px rgba(2,6,23,0.85)',
  'mood-frame-surface': 'linear-gradient(135deg, rgba(4,17,42,0.92), rgba(2,10,26,0.75))',
  'mood-frame-aura': 'radial-gradient(circle at 70% 30%, rgba(79,209,197,0.4), transparent 65%)',
  'mood-component-border': 'rgba(125,211,252,0.25)',
  'mood-component-surface': 'rgba(3,12,30,0.85)',
  'mood-component-shadow': '0 30px 55px rgba(2,6,23,0.8)',
  'mood-component-radius': '30px',
  'mood-component-muted': 'rgba(190,228,255,0.7)',
  'mood-info-border': 'rgba(14,165,233,0.35)',
  'mood-info-surface': 'rgba(3,12,30,0.9)',
  'mood-info-shadow': '0 35px 65px rgba(2,6,23,0.8)',
};

const vellumTokens: Record<string, string> = {
  'mood-background': '#f7f2e0',
  'mood-background-overlay': 'linear-gradient(145deg, rgba(247,242,224,0.95), rgba(233,215,176,0.8))',
  'mood-text-primary': '#3f2e1c',
  'mood-text-secondary': '#a0782a',
  'mood-text-muted': 'rgba(68,41,15,0.7)',
  'mood-accent': '#c29b53',
  'mood-accent-glow': 'rgba(194,155,83,0.45)',
  'mood-control-border': 'rgba(194,155,83,0.75)',
  'mood-control-bg': 'rgba(255,255,255,0.75)',
  'mood-control-hover-bg': 'rgba(194,155,83,0.12)',
  'mood-control-text': '#4b3418',
  'mood-control-active-border': '#a0782a',
  'mood-control-active-bg': 'rgba(160,120,42,0.2)',
  'mood-control-active-text': '#2b1b0a',
  'mood-panel-border': 'rgba(194,155,83,0.75)',
  'mood-panel-surface': 'rgba(255,255,255,0.85)',
  'mood-panel-shadow': '0 35px 65px rgba(120,96,55,0.35)',
  'mood-panel-radius': '28px',
  'mood-chip-border': 'rgba(194,155,83,0.9)',
  'mood-chip-bg': 'rgba(255,255,255,0.65)',
  'mood-chip-text': '#6b4b16',
  'mood-frame-radius': '30px',
  'mood-frame-border': 'rgba(194,155,83,0.65)',
  'mood-frame-shadow': '0 30px 55px rgba(120,96,55,0.3)',
  'mood-frame-surface': 'linear-gradient(135deg, rgba(255,249,237,0.95), rgba(234,215,182,0.85))',
  'mood-frame-aura': 'radial-gradient(circle at 15% 30%, rgba(249,225,174,0.7), transparent 65%)',
  'mood-component-border': 'rgba(194,155,83,0.6)',
  'mood-component-surface': 'rgba(255,255,255,0.85)',
  'mood-component-shadow': '0 25px 45px rgba(120,96,55,0.35)',
  'mood-component-radius': '26px',
  'mood-component-muted': 'rgba(68,41,15,0.7)',
  'mood-info-border': 'rgba(194,155,83,0.65)',
  'mood-info-surface': 'rgba(255,255,255,0.9)',
  'mood-info-shadow': '0 30px 55px rgba(120,96,55,0.35)',
};

/**
 * Preset collection used by the Moodboard page.
 * Extend this list or tweak tokens to test new looks quickly.
 */
export const MOODBOARD_STYLES: MoodboardStyle[] = [
  {
    id: 'gilded-observatory',
    label: 'Gilded Observatory',
    description: 'Obsidian glass, gilded trims, ideal for parity con il Balancer UI.',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold/90">
        ✦ Observatory Deck
      </span>
    ),
    autoAdvanceMs: 7000,
    tokens: gildedTokens,
  },
  {
    id: 'nocturne-haze',
    label: 'Nocturne Haze',
    description: 'Cool cyan glass with vapor trails—perfetta per concept sci-fantasy.',
    badge: (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-200">
        ⦿ Nebula Study
      </span>
    ),
    autoAdvanceMs: 5500,
    tokens: nocturneTokens,
  },
  {
    id: 'vellum-light',
    label: 'Vellum Light',
    description: 'Warm parchment con inserti in ottone, utile per accessibilità.',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#d9c394] px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[#a0782a]">
        ☼ Atelier Sheet
      </span>
    ),
    autoAdvanceMs: 8000,
    tokens: vellumTokens,
  },
];
