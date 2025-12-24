import type { ReactNode } from 'react';

/**
 * Declarative style descriptor for the Moodboard screen so designs can be iterated rapidly
 * without editing the component logic.
 */
export interface MoodboardStyle {
  /** Unique identifier used for selection */
  id: string;
  /** Display label shown in the UI */
  label: string;
  /** Helper copy explaining the vibe of the preset */
  description: string;
  /** Classes applied to the full page wrapper */
  backgroundClasses: string;
  /** Classes applied to the adaptive frame shell */
  frameClasses: string;
  /** Extra glow/aura classes layered behind the frame */
  frameAuraClasses: string;
  /** Classes applied to the informational side card */
  infoPanelClasses: string;
  /** Classes for accent text/badges */
  accentTextClasses: string;
  /** Classes for the control buttons */
  controlClasses: string;
  /** Optional React node rendered inside the info panel header */
  badge?: ReactNode;
  /** Autoplay speed override per style (ms) */
  autoAdvanceMs: number;
}

/**
 * Preset collection used by the Moodboard page.
 * Extend this list or tweak class names to try new looks quickly.
 */
export const MOODBOARD_STYLES: MoodboardStyle[] = [
  {
    id: 'gilded-observatory',
    label: 'Gilded Observatory',
    description: 'Obsidian glass, gilded trims, ideal for parity with the Balancer UI.',
    backgroundClasses:
      'bg-gradient-to-br from-obsidian-darkest via-obsidian-dark to-obsidian px-4 py-6 sm:p-8',
    frameClasses:
      'bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-900/40 border border-gold/35 rounded-[32px] p-3 shadow-[0_25px_60px_rgba(5,5,9,0.55)]',
    frameAuraClasses:
      'absolute -inset-2 rounded-[40px] pointer-events-none bg-gradient-to-r from-gold/25 via-transparent to-teal/20 blur-xl opacity-70',
    infoPanelClasses:
      'default-card bg-slate-950/70 border border-slate-darkest/60 backdrop-blur-md shadow-[0_25px_50px_rgba(0,0,0,0.45)]',
    accentTextClasses: 'text-gold tracking-[0.4em]',
    controlClasses:
      'bg-slate-900/70 border border-slate-700/60 hover:border-gold/60 hover:text-gold',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold/90">
        ✦ Observatory Deck
      </span>
    ),
    autoAdvanceMs: 7000,
  },
  {
    id: 'nocturne-haze',
    label: 'Nocturne Haze',
    description: 'Cool cyan glass with vapor trails—good for sci-fantasy drafts.',
    backgroundClasses:
      'bg-gradient-to-br from-[#020617] via-[#0b1224] to-[#04111e] px-4 py-6 sm:p-8',
    frameClasses:
      'bg-gradient-to-br from-[#0f172a]/90 via-[#0f1f3a]/70 to-[#051125]/60 border border-cyan-400/30 rounded-[36px] p-3 shadow-[0_35px_70px_rgba(2,6,23,0.75)]',
    frameAuraClasses:
      'absolute -inset-3 rounded-[44px] pointer-events-none bg-gradient-to-r from-cyan-500/25 via-transparent to-indigo-500/20 blur-2xl opacity-80',
    infoPanelClasses:
      'default-card bg-[#061230]/80 border border-cyan-500/20 text-cyan-100 shadow-[0_35px_60px_rgba(3,15,39,0.65)]',
    accentTextClasses: 'text-cyan-300 tracking-[0.35em]',
    controlClasses:
      'bg-[#081a38]/80 border border-cyan-500/20 text-cyan-100 hover:border-cyan-300/70 hover:text-cyan-50',
    badge: (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-200">
        ⦿ Nebula Study
      </span>
    ),
    autoAdvanceMs: 5500,
  },
  {
    id: 'vellum-light',
    label: 'Vellum Light',
    description: 'Warm parchment with brass fixtures—useful for accessibility passes.',
    backgroundClasses:
      'bg-gradient-to-br from-[#f7f2e0] via-[#f0e4c7] to-[#e9d7b0] px-4 py-6 sm:p-8 text-slate-800',
    frameClasses:
      'bg-gradient-to-br from-[#fff9ed] via-[#f3e5c4] to-[#ead7b6] border border-[#c2a46b] rounded-[28px] p-2 shadow-[0_35px_60px_rgba(120,96,55,0.3)]',
    frameAuraClasses:
      'absolute -inset-2 rounded-[34px] pointer-events-none bg-gradient-to-r from-[#f1d9aa]/60 via-transparent to-[#c9a653]/50 blur-2xl opacity-90',
    infoPanelClasses:
      'bg-white/80 border border-[#d9c394] shadow-[0_25px_50px_rgba(120,96,55,0.2)] text-slate-800',
    accentTextClasses: 'text-[#a0782a] tracking-[0.4em]',
    controlClasses:
      'bg-white/70 border border-[#d9c394]/70 text-[#6b4b16] hover:border-[#a0782a] hover:text-[#a0782a]',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#d9c394] px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[#a0782a]">
        ☼ Atelier Sheet
      </span>
    ),
    autoAdvanceMs: 8000,
  },
];
