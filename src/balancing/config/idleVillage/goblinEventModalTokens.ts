/**
 * @trailer-only
 *
 * Visual tokens for the Goblin Invasion event modal.
 *
 * All colors, spacings and layout values are derived from the Prismatic
 * Wanderlust art Bible and the goblin-invasion mockup. No component should
 * hardcode these values.
 */

import { z } from 'zod';

/**
 * Zod schema for the goblin event modal token contract.
 */
const tokensSchema = z.object({
  palette: z.object({
    skyTop: z.string(),
    skyMid: z.string(),
    skyBottom: z.string(),
    shadow: z.string(),
    panel: z.string(),
    panelGlass: z.string(),
    woodDark: z.string(),
    woodMid: z.string(),
    woodLight: z.string(),
    gold: z.string(),
    amber: z.string(),
    crimson: z.string(),
    crimsonLight: z.string(),
    parchment: z.string(),
    parchmentDim: z.string(),
    solar: z.string(),
  }),
  typography: z.object({
    titleSize: z.string(),
    titleWeight: z.string(),
    titleTracking: z.string(),
    badgeSize: z.string(),
    badgeWeight: z.string(),
    badgeTracking: z.string(),
    labelSize: z.string(),
    labelWeight: z.string(),
    valueSize: z.string(),
    valueWeight: z.string(),
    bodySize: z.string(),
    warningSize: z.string(),
    buttonSize: z.string(),
    buttonWeight: z.string(),
    arrivalCountSize: z.string(),
    arrivalUnitSize: z.string(),
  }),
  spacing: z.object({
    frameInset: z.string(),
    crestHeight: z.string(),
    titleTop: z.string(),
    totemTop: z.string(),
    totemWidth: z.string(),
    panelTop: z.string(),
    buttonTop: z.string(),
  }),
  layout: z.object({
    heroTop: z.string(),
    heroLeft: z.string(),
    heroWidth: z.string(),
    bannerTop: z.string(),
    bannerLeft: z.string(),
    bannerWidth: z.string(),
    bannerHeight: z.string(),
    badgeTop: z.string(),
    titleTop: z.string(),
    bodyTop: z.string(),
    warningTop: z.string(),
    panelTop: z.string(),
    panelWidth: z.string(),
    panelHeight: z.string(),
    statsTop: z.string(),
    arrivalLabelTop: z.string(),
    arrivalCountTop: z.string(),
    arrivalUnitTop: z.string(),
    primaryButtonTop: z.string(),
    primaryButtonWidth: z.string(),
    primaryButtonHeight: z.string(),
    secondaryButtonTop: z.string(),
    secondaryButtonWidth: z.string(),
    secondaryButtonHeight: z.string(),
    iconSize: z.string(),
  }),
  effects: z.object({
    solarGradient: z.string(),
    frameShadow: z.string(),
    panelShadow: z.string(),
    buttonPrimaryGradient: z.string(),
    buttonSecondaryGradient: z.string(),
    buttonNotchedClip: z.string(),
  }),
  layers: z.record(z.string()),
  svg: z.object({
    woodTexture: z.string(),
    stoneTexture: z.string(),
    goldHighlight: z.string(),
    vignette: z.string(),
  }),
  icons: z.object({
    enemy: z.string(),
    arrival: z.string(),
    target: z.string(),
  }),
});

/** Inferred token type. */
export type GoblinEventModalTokens = z.infer<typeof tokensSchema>;

/**
 * Canonical tokens for the Goblin Invasion card.
 */
export const goblinEventModalTokens: GoblinEventModalTokens = {
  palette: {
    // Bible: Azure sky, deep teal shadows, no grey/brown.
    skyTop: '#7ec6e4',
    skyMid: '#4a7ba8',
    skyBottom: '#2a5b6e',
    shadow: '#0b3a4a',
    panel: 'rgba(10, 24, 22, 0.92)',
    panelGlass: 'rgba(10, 24, 22, 0.88)',
    woodDark: '#3b2d23',
    woodMid: '#5d4824',
    woodLight: '#a38a70',
    gold: '#d4a84b',
    amber: '#e68a00',
    crimson: '#8c2318',
    crimsonLight: '#d65d50',
    parchment: '#f5e6d3',
    parchmentDim: '#a38a70',
    solar: 'rgba(255, 230, 180, 0.30)',
  },
  typography: {
    titleSize: '1.75rem',
    titleWeight: '900',
    titleTracking: '0.12em',
    badgeSize: '0.6rem',
    badgeWeight: '800',
    badgeTracking: '0.15em',
    labelSize: '0.5rem',
    labelWeight: '800',
    valueSize: '0.6rem',
    valueWeight: '900',
    bodySize: '0.48rem',
    warningSize: '0.58rem',
    buttonSize: '0.5rem',
    buttonWeight: '900',
    arrivalCountSize: '1.4rem',
    arrivalUnitSize: '0.5rem',
  },
  spacing: {
    frameInset: '1.4%',
    crestHeight: '8.3%',
    titleTop: '12.4%',
    totemTop: '18.0%',
    totemWidth: '80%',
    panelTop: '53.9%',
    buttonTop: '2.5%',
  },
  layout: {
    heroTop: '18.0%',
    heroLeft: '11.0%',
    heroWidth: '77.9%',
    bannerTop: '8.3%',
    bannerLeft: '11.0%',
    bannerWidth: '77.9%',
    bannerHeight: '9.7%',
    badgeTop: '9.7%',
    titleTop: '14.5%',
    bodyTop: '57.3%',
    warningTop: '60.1%',
    panelTop: '53.9%',
    panelWidth: '72.3%',
    panelHeight: '24.5%',
    panelHeaderTop: '55.5%',
    statsTop: '67.7%',
    arrivalLabelTop: '66.0%',
    arrivalCountTop: '68.7%',
    arrivalUnitTop: '70.5%',
    primaryButtonTop: '81.5%',
    primaryButtonWidth: '48.4%',
    primaryButtonHeight: '7.6%',
    secondaryButtonTop: '89.0%',
    secondaryButtonWidth: '44.8%',
    secondaryButtonHeight: '4.1%',
    iconSize: '3.5rem',
  },
  effects: {
    solarGradient: 'radial-gradient(circle at 25% 10%, rgba(255,230,180,0.30), transparent 45%)',
    frameShadow: 'inset 0 0 60px rgba(2,6,10,0.85), 0 0 24px rgba(0,0,0,0.8)',
    panelShadow: 'inset 0 0 30px rgba(0,0,0,0.7), 0 -8px 24px rgba(0,0,0,0.4)',
    buttonPrimaryGradient: 'linear-gradient(to bottom, #9e2b20, #6e1810 50%, #470a05)',
    buttonSecondaryGradient: 'linear-gradient(to bottom, #5d5244, #3b2d23 50%, #221815)',
    buttonNotchedClip: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
  },
  layers: {
    L0_base: 'sky solid gradient',
    L1_texture: 'feTurbulence sky grain',
    L2_gradient: 'sky multi-stop gradient overlay',
    L3_highlight: 'solar triumph radial light',
    L4_detail: 'dust / motes particles',
    L5_hero: 'goblin totem crop asset',
    L6_overlay: 'lower glass/parchment panel',
    L7_accent: 'carved frame, crest, ornaments',
    L8_shadow: 'inset/outset frame shadows',
    L9_glow: 'gold rim light / bloom',
  },
  svg: {
    woodTexture: 'feTurbulence baseFrequency="0.45" numOctaves="4" seed="3"',
    stoneTexture: 'feTurbulence baseFrequency="0.6" numOctaves="3" seed="7"',
    goldHighlight: 'linearGradient id="gold-highlight"',
    vignette: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%)',
  },
  icons: {
    enemy: 'M2,8 L5,3 L8,8 L8,11 L2,11 Z M3,6 L4,4 L5,6 M5,6 L6,4 L7,6',
    arrival: 'M4,2 L4,9 M4,9 L2,7 M4,9 L6,7 M4,11 L4,13',
    target: 'M2,4 L5,2 L8,4 L8,11 L5,13 L2,11 Z M5,5 L5,9',
  },
} as const;

/**
 * Runtime validation for the token contract.
 */
export function validateGoblinEventModalTokens(
  candidate: unknown,
): GoblinEventModalTokens {
  return tokensSchema.parse(candidate);
}
