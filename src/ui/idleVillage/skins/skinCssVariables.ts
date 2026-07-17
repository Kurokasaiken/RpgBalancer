/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SKIN CSS VARIABLES — canonical sub-element token layer
 *
 *  One skin = one complete map of CSS custom properties covering EVERY
 *  sub-element: surface, title, subtitle, body, section labels, dividers,
 *  fields, requirements (met/unmet), inset panels, footer, buttons,
 *  icons, close button, badges.
 *
 *  The `base` set (Layout Primitives · V9 Obsidian) is the single source of
 *  truth: obsidian base #060f16 · azure light leak · gold/bronze borders.
 *  It is exactly what /v9-skin-sandbox shows in the "Layout Primitives" tab.
 *
 *  Inheritance rules:
 *  1. Every skin inherits from BASE_SKIN_CSS_VARS and overrides selectively.
 *  2. The map also feeds the legacy `--wl-*` variables consumed by the
 *     WanderlustLayout primitives, so those follow the active skin too.
 *  3. Components must style sub-elements with `var(--skin-…)` only —
 *     no hardcoded colors — to be skin-aware.
 *
 *  Apply globally with `applySkinCssVariables(presetId)` (done in App.tsx).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { DEFAULT_SKIN_PRESET_ID, type SkinPresetId } from './skinConfigRegistry';

export type SkinCssVarMap = Record<`--${string}`, string>;

/* ── BASE · Layout Primitives (V9 Obsidian Aesthetic) ──────────────────── */

export const BASE_SKIN_CSS_VARS: SkinCssVarMap = {
  /* Surface */
  '--skin-surface-base': '#060f16',
  '--skin-surface-bg':
    'radial-gradient(circle at 0% 0%, rgba(0,229,255,0.15) 0%, transparent 50%), #060f16',
  '--skin-surface-border': 'rgba(223,184,87,0.50)',
  '--skin-surface-radius': '14px',
  '--skin-glow-accent': 'rgba(0,229,255,0.25)',
  '--skin-glow-primary': 'rgba(223,184,87,0.20)',

  /* Typography families */
  '--skin-font-display': '"Cinzel", "Trajan Pro", serif',
  '--skin-font-serif': '"EB Garamond", Georgia, serif',
  '--skin-font-sans': 'system-ui, sans-serif',

  /* Title (h1/h2 — gold engraved gradient) */
  '--skin-title-size': '30px',
  '--skin-title-color': '#f0cf6a',
  '--skin-title-gradient':
    'linear-gradient(180deg, #fff4d6 0%, #f0cf6a 38%, #d8b13e 70%, #a87f24 100%)',
  '--skin-title-shadow':
    'drop-shadow(0 2px 4px rgba(0,0,0,0.7)) drop-shadow(0 0 16px rgba(240,207,106,0.3))',

  /* Subtitle (tracked-out display caption under the title) */
  '--skin-subtitle-size': '12px',
  '--skin-subtitle-color': '#f0cf6a',
  '--skin-subtitle-tracking': '0.4em',

  /* Body / description */
  '--skin-body-size': '15.5px',
  '--skin-body-color': 'rgba(237,224,196,0.92)',
  '--skin-text-primary': '#F5F2E8',
  '--skin-text-secondary': 'rgba(245,242,232,0.70)',
  '--skin-text-muted': 'rgba(245,242,232,0.50)',

  /* Section labels (primary/tertiary tiers) */
  '--skin-label-primary': '#c9a84e',
  '--skin-label-tertiary': '#9a8246',
  '--skin-label-tracking': '0.22em',

  /* Dividers / separators */
  '--skin-separator': 'rgba(216,177,62,0.2)',

  /* Status */
  '--skin-status-met': '#7bc96f',
  '--skin-status-unmet': '#d98a4a',
  /* Canali semantici esclusivi del rischio (Destiny Astrolabe V3 §4):
     cremisi = carne (solo corona ferita) · viola = morte (solo voragini) */
  '--skin-status-wound': '#a11d33',
  '--skin-status-death': '#6d3fb0',
  /* Destiny Astrolabe V4 — superficie nemico (distinta dallo sfondo),
     nucleo successo critico, strisce rischio (ferita/morte, α30% nel canvas) */
  '--skin-astro-enemy': '#26314a',
  '--skin-astro-nucleus': '#ffe9b0',
  '--skin-astro-stripe-wound': '#c22a3d',
  '--skin-astro-stripe-death': '#05060a',

  /* Inset panels */
  '--skin-inset-bg': '#060f16',
  '--skin-inset-border': 'rgba(223,184,87,0.50)',
  '--skin-inset-radius': '10px',

  /* Footer */
  '--skin-footer-bg': 'rgba(0,0,0,0.25)',
  '--skin-footer-border': '1px solid rgba(216,177,62,0.2)',
  '--skin-footer-padding': '14px 18px',

  /* Buttons — primary CTA (struck-bronze plate, not flat glass) */
  '--skin-btn-bg':
    'linear-gradient(135deg, #f7dd80 0%, #dfb857 40%, #c9a040 70%, #8b6f47 100%)',
  '--skin-btn-border': '1px solid rgba(247,221,128,0.85)',
  '--skin-btn-color': '#1a1208',
  '--skin-btn-font': '"Cinzel", "Trajan Pro", serif',
  '--skin-btn-size': '12px',
  '--skin-btn-tracking': '0.14em',
  '--skin-btn-radius': '7px',
  '--skin-btn-padding': '11px 22px',
  /* multi-stop shadow = bevel (inset light/dark) + cast depth + gold bloom */
  '--skin-btn-shadow':
    'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 2px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4), 0 0 18px rgba(223,184,87,0.18)',
  '--skin-btn-text-shadow': '0 1px 0 rgba(255,255,255,0.35)',
  '--skin-btn-hover-bg':
    'linear-gradient(135deg, #fff0b8 0%, #f0cf6a 40%, #d8b13e 70%, #a07f4a 100%)',
  '--skin-btn-hover-shadow':
    'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.35), 0 8px 22px rgba(0,0,0,0.5), 0 0 30px rgba(223,184,87,0.4)',
  '--skin-btn-hover-lift': 'translateY(-2px)',
  '--skin-btn-active-shadow':
    'inset 0 2px 5px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.2), 0 2px 6px rgba(0,0,0,0.3)',
  '--skin-btn-active-filter': 'brightness(1.15) saturate(1.2)',
  '--skin-btn-disabled-opacity': '0.4',

  /* Buttons — secondary / ghost (engraved slate) */
  '--skin-btn2-bg':
    'linear-gradient(180deg, rgba(30,45,58,0.6) 0%, rgba(10,18,26,0.7) 100%)',
  '--skin-btn2-border': '1px solid rgba(223,184,87,0.35)',
  '--skin-btn2-color': '#dfb857',
  '--skin-btn2-shadow':
    'inset 0 1px 0 rgba(223,184,87,0.15), inset 0 -1px 3px rgba(0,0,0,0.6)',

  /* Icons */
  '--skin-icon-size': '18px',
  '--skin-icon-color': '#dfb857',
  '--skin-icon-accent': '#00e5ff',
  '--skin-icon-opacity': '0.9',

  /* Close button — gold radial coin, sits in the top-right corner */
  '--skin-close-size': '34px',
  '--skin-close-bg':
    'radial-gradient(circle at 42% 38%, rgba(201,162,39,0.28) 0%, rgba(12,18,40,0.92) 65%)',
  '--skin-close-border': '1.5px solid rgba(201,162,39,0.80)',
  '--skin-close-color': '#f7dd80',
  '--skin-close-hover-color': '#fff4d6',
  '--skin-close-radius': '50%',
  '--skin-close-shadow':
    '0 3px 10px rgba(0,0,0,0.70), 0 1px 3px rgba(0,0,0,0.90), inset 0 1px 0 rgba(201,162,39,0.35), inset 0 -1px 0 rgba(0,0,0,0.50)',
  '--skin-close-offset': '12px',

  /* Badges / pills (inline azure status) */
  '--skin-badge-bg': 'rgba(0,229,255,0.10)',
  '--skin-badge-border': '1px solid rgba(0,229,255,0.35)',
  '--skin-badge-color': '#00e5ff',

  /* Title plaque — the gold "QUEST" label that sits left of a heading;
     also the natural home for an icon or short tag */
  '--skin-plaque-bg': 'rgba(6,29,37,0.5)',
  '--skin-plaque-border': '1.5px solid rgba(223,184,87,0.7)',
  '--skin-plaque-radius': '4px',
  '--skin-plaque-padding': '4px 13px 5px',
  '--skin-plaque-color': '#f7dd80',
  '--skin-plaque-tracking': '0.28em',
  '--skin-plaque-shadow':
    '0 1px 4px rgba(0,0,0,0.50), 0 0 6px rgba(223,184,87,0.10), inset 0 1px 0 rgba(223,184,87,0.15), inset 0 -1px 0 rgba(0,0,0,0.35)',

  /* Decorative divider under a title (line · ✦ · line) */
  '--skin-titlesep-line': 'linear-gradient(90deg, transparent, rgba(223,184,87,0.45), transparent)',
  '--skin-titlesep-diamond-color': 'rgba(223,184,87,0.85)',
  '--skin-titlesep-diamond-glow': '0 0 8px rgba(223,184,87,0.5)',

  /* Primary CTA plaque — burnished-slate notched plate w/ double gold border
     (the "AVVIA" button) + flanking ◈ ornaments */
  '--skin-cta-bg':
    'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 40%), linear-gradient(135deg, rgba(13,55,72,0.85) 0%, rgba(6,29,37,0.95) 100%)',
  '--skin-cta-border': '2px solid #dfb857',
  '--skin-cta-clip':
    'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
  '--skin-cta-shadow':
    '0 0 14px rgba(223,184,87,0.2), 0 3px 8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(4,20,26,0.9), inset 0 0 0 2px rgba(223,184,87,0.35), inset 0 1px 0 rgba(245,242,232,0.15), inset 0 -2px 4px rgba(0,0,0,0.4)',
  '--skin-cta-color': '#f7dd80',
  '--skin-cta-text-shadow': '0 2px 4px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,245,200,0.25)',
  '--skin-cta-hover-filter': 'brightness(1.18) saturate(1.08)',
  '--skin-cta-hover-glow':
    '0 0 22px rgba(223,184,87,0.45), 0 3px 8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(4,20,26,0.9), inset 0 0 0 2px rgba(223,184,87,0.55), inset 0 1px 0 rgba(245,242,232,0.2), inset 0 -2px 4px rgba(0,0,0,0.4)',
  '--skin-cta-ornament-color': 'rgba(223,184,87,0.75)',

  /* Text incision (Champlevé): dark cut on top, bright bevel below */
  '--skin-incision-label': '0 1px 0 rgba(0,0,0,0.85), 0 -1px 0 rgba(212,175,119,0.35)',
  '--skin-incision-title':
    '0 2px 1px rgba(0,0,0,0.7), 0 1px 0 rgba(0,0,0,0.9), 0 -1px 0 rgba(224,194,132,0.45)',
  '--skin-incision-value':
    '0 1px 0 rgba(0,0,0,0.9), 0 -1px 0 rgba(212,175,119,0.4), 0 0 8px rgba(212,175,119,0.25)',

  /* Irregular clip-path geometry (hand-beaten plates / cut slate) */
  '--skin-clip-card':
    'polygon(2% 3.5%, 8% 2%, 24% 1.8%, 42% 2.2%, 62% 1.5%, 78% 2.3%, 95% 3%, 97.5% 4.5%, 99% 12%, 99.2% 28%, 98.8% 44%, 99.1% 60%, 98.9% 76%, 99% 88%, 97.2% 95.5%, 90% 98%, 72% 98.2%, 54% 98.5%, 36% 97.8%, 18% 98.1%, 5% 97.5%, 2.5% 96.2%, 1% 84%, 0.8% 68%, 1.2% 52%, 0.9% 36%, 1.1% 20%, 1% 8%)',
  '--skin-clip-panel':
    'polygon(3% 4%, 12% 1.2%, 35% 2.5%, 58% 1%, 82% 2.2%, 96% 3.5%, 98% 5%, 99.5% 15%, 99% 35%, 99.8% 55%, 98.5% 75%, 99.2% 90%, 96.5% 96%, 88% 98.8%, 65% 98%, 42% 98.7%, 20% 97.5%, 4% 98.2%, 1.5% 94.5%, 0.5% 80%, 1.5% 60%, 0.2% 40%, 1.8% 20%, 0.5% 5%)',

  /* Parallax sheen (mouse-tracked; falls back to a static hotspot) */
  '--skin-parallax-sheen':
    'radial-gradient(ellipse 60% 50% at var(--skin-mouse-x, 30%) var(--skin-mouse-y, 20%), rgba(255,255,255,0.10) 0%, transparent 55%)',

  /* Stat bars — HP, Stamina, Fatigue */
  '--skin-statbar-hp-start': '#0a8a4a',
  '--skin-statbar-hp-end': '#6ee7b7',
  '--skin-statbar-hp-glow': 'rgba(110,231,183,0.45)',
  '--skin-statbar-stamina-start': '#d4af37',
  '--skin-statbar-stamina-end': '#f59e0b',
  '--skin-statbar-stamina-glow': 'rgba(245,158,11,0.45)',
  '--skin-statbar-fatigue-start': '#9e5a4a',
  '--skin-statbar-fatigue-end': '#d98a4a',
  '--skin-statbar-fatigue-glow': 'rgba(217,138,74,0.6)',
  '--skin-statbar-track': 'linear-gradient(180deg, #0c0b0a, #050505)',
  '--skin-statbar-track-border': 'rgba(216,177,62,0.08)',
  /* engraved graduation overlaid on the fill — reads as a bronze ruler */
  '--skin-statbar-engrave':
    'repeating-linear-gradient(115deg, transparent 0, transparent 5px, rgba(0,0,0,0.16) 5px, rgba(0,0,0,0.16) 7px)',
  '--skin-statbar-bevel':
    'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.45)',
  '--skin-statbar-sheen':
    'linear-gradient(180deg, rgba(255,255,255,0.28), transparent 50%)',

  /* Drag handle & draggable states */
  '--skin-drag-handle-color': 'rgba(223,184,87,0.50)',
  '--skin-drag-handle-hover': '#dfb857',
  '--skin-drag-active-opacity': '0.7',
  '--skin-drag-valid-glow': 'rgba(0,229,255,0.4)',
  '--skin-drag-invalid-glow': 'rgba(217,138,74,0.5)',
  '--skin-drag-lift-scale': '1.1',
  '--skin-drag-lift-shadow': '0 12px 28px rgba(0,0,0,0.55)',
  /* snap: hard metallic overshoot, short rigid settle (juice) */
  '--skin-snap-ease': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  '--skin-snap-duration': '0.42s',
  '--skin-snap-flash': 'brightness(1.28) saturate(1.12)',
  '--skin-snap-flash-duration': '70ms',

  /* Medallion (worker portrait token slotted into the rack) */
  '--skin-medallion-size': '80px',
  '--skin-medallion-ring':
    'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, rgba(223,184,87,0.25) 30%, rgba(139,111,71,0.85) 100%)',
  '--skin-medallion-ring-border': 'rgba(212,175,119,0.9)',
  '--skin-medallion-ring-shadow':
    'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 12px rgba(223,184,87,0.3)',
  '--skin-medallion-inner-inset': '4px',
  '--skin-medallion-highlight':
    'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.22) 0%, transparent 48%)',

  /* Modal overlay & container */
  '--skin-modal-overlay-bg': 'rgba(6,15,22,0.85)',
  '--skin-modal-container-bg': '#060f16',
  '--skin-modal-container-border': 'rgba(223,184,87,0.35)',
  '--skin-modal-z-index': '1000',

  /* ── Bridge → legacy WanderlustLayout `--wl-*` variables ─────────────── */
  '--wl-font-display': '"Cinzel", "Trajan Pro", serif',
  '--wl-font-serif': '"EB Garamond", Georgia, serif',
  '--wl-font-sans': 'system-ui, sans-serif',
  '--wl-title-size': '30px',
  '--wl-body-size': '15.5px',
  '--wl-text-title': '#e4d5b7',
  '--wl-text-body': 'rgba(237,224,196,0.92)',
  '--wl-label-primary': '#c9a84e',
  '--wl-label-tertiary': '#9a8246',
  '--wl-text-accent': '#f0cf6a',
  '--wl-separator': 'rgba(216,177,62,0.2)',
  '--wl-status-met': '#7bc96f',
  '--wl-status-unmet': '#d98a4a',
};

/* ── Per-preset overrides (inherit from base, override selectively) ────── */

const SKIN_CSS_VAR_OVERRIDES: Partial<Record<SkinPresetId, Partial<SkinCssVarMap>>> = {
  base: {},
  // Example of inheritance: another preset only overrides what differs.
  wanderlust: {
    '--skin-surface-base': '#0a0402',
    '--skin-surface-bg':
      'radial-gradient(circle at 0% 0%, rgba(216,144,64,0.18) 0%, transparent 50%), #0a0402',
    '--skin-icon-accent': '#3ad750',
    '--skin-status-wound': '#b03422',
    '--skin-status-death': '#5a3a8f',
    '--skin-badge-bg': 'rgba(58,215,80,0.10)',
    '--skin-badge-border': '1px solid rgba(58,215,80,0.35)',
    '--skin-badge-color': '#3ad750',
    '--skin-glow-accent': 'rgba(216,144,64,0.35)',
  },
  minimal_frontier: {
    '--skin-surface-base': '#101418',
    '--skin-surface-bg': '#101418',
    '--skin-surface-border': 'rgba(198,193,183,0.35)',
    '--skin-title-gradient': 'linear-gradient(180deg, #ffffff 0%, #f7f2e9 60%, #c6c1b7 100%)',
    '--skin-subtitle-color': '#4a6d82',
    '--skin-icon-accent': '#4a6d82',
    '--skin-status-wound': '#8f2f3c',
    '--skin-status-death': '#585a9e',
    '--skin-badge-bg': 'rgba(74,109,130,0.12)',
    '--skin-badge-border': '1px solid rgba(74,109,130,0.40)',
    '--skin-badge-color': '#8fb4c9',
  },
};

export function getSkinCssVariables(presetId: SkinPresetId = DEFAULT_SKIN_PRESET_ID): SkinCssVarMap {
  return { ...BASE_SKIN_CSS_VARS, ...(SKIN_CSS_VAR_OVERRIDES[presetId] ?? {}) };
}

/**
 * Writes the skin's CSS variables onto an element (default: <html>), making
 * every `var(--skin-*)` and `var(--wl-*)` consumer follow the active skin.
 * Can also be scoped to a subtree by passing that subtree's root element.
 */
export function applySkinCssVariables(
  presetId: SkinPresetId = DEFAULT_SKIN_PRESET_ID,
  target: HTMLElement = document.documentElement,
): void {
  const vars = getSkinCssVariables(presetId);
  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value);
  }
}
