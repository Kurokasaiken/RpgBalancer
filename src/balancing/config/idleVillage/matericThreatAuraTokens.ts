/**
 * Visual tokens for the MatericThreatAura wrapper used around event stickers.
 *
 * All colors, spacings and timing are derived from the Prismatic Wanderlust
 * art Bible: deep teal shadows, gold glow, no grey/brown. No component should
 * hardcode these values.
 */

import { z } from 'zod';

const particleSchema = z.object({
  cx: z.number(),
  cy: z.number(),
  r: z.number(),
  color: z.string(),
  opacity: z.number(),
  opacityValues: z.string(),
  cyValues: z.string(),
  dur: z.number(),
});

/**
 * Zod schema for the threat aura token contract.
 */
const tokensSchema = z.object({
  palette: z.object({
    coreTeal: z.string(),
    coreTealDark: z.string(),
    gold: z.string(),
    goldGlow: z.string(),
    greenMote: z.string(),
    parchment: z.string(),
  }),
  layout: z.object({
    blur: z.number(),
    glowRadius: z.number(),
    blobPath: z.string(),
    pulseScaleMax: z.number(),
  }),
  animation: z.object({
    pulseName: z.string(),
    pulseDuration: z.number(),
  }),
  particles: z.array(particleSchema),
});

/** Inferred token type. */
export type MatericThreatAuraTokens = z.infer<typeof tokensSchema>;

/**
 * Canonical tokens for the goblin-sticker threat aura.
 */
export const matericThreatAuraTokens: MatericThreatAuraTokens = {
  palette: {
    // Bible: deep cool teal, no grey/brown, Solar Triumph gold.
    coreTeal: 'rgba(20, 90, 95, 0.75)',
    coreTealDark: 'rgba(8, 35, 40, 0.95)',
    gold: '#d4a84b',
    goldGlow: 'rgba(212, 168, 75, 0.55)',
    greenMote: 'rgba(120, 210, 140, 0.7)',
    parchment: 'rgba(245, 230, 211, 0.65)',
  },
  layout: {
    blur: 10,
    glowRadius: 14,
    // Organic, asymmetric blob frame.
    blobPath:
      'M15,45 C20,15 45,5 65,12 C90,18 95,40 88,62 C80,88 55,95 32,86 C8,75 5,55 15,45 Z',
    pulseScaleMax: 1.04,
  },
  animation: {
    pulseName: 'materic-threat-aura-pulse',
    pulseDuration: 4.2,
  },
  particles: [
    { cx: 20, cy: 25, r: 0.6, color: 'rgba(120, 210, 140, 0.7)', opacity: 0.6, opacityValues: '0.4;0.9;0.4', cyValues: '25;23;25', dur: 3.1 },
    { cx: 78, cy: 30, r: 0.5, color: 'rgba(212, 168, 75, 0.55)', opacity: 0.5, opacityValues: '0.3;0.8;0.3', cyValues: '30;28;30', dur: 3.8 },
    { cx: 70, cy: 72, r: 0.7, color: 'rgba(120, 210, 140, 0.7)', opacity: 0.6, opacityValues: '0.5;1;0.5', cyValues: '72;74;72', dur: 2.9 },
    { cx: 22, cy: 70, r: 0.5, color: 'rgba(212, 168, 75, 0.55)', opacity: 0.5, opacityValues: '0.2;0.7;0.2', cyValues: '70;68;70', dur: 4.5 },
    { cx: 50, cy: 15, r: 0.4, color: 'rgba(245, 230, 211, 0.65)', opacity: 0.5, opacityValues: '0.1;0.6;0.1', cyValues: '15;13;15', dur: 3.4 },
    { cx: 50, cy: 85, r: 0.5, color: 'rgba(245, 230, 211, 0.65)', opacity: 0.5, opacityValues: '0.2;0.7;0.2', cyValues: '85;87;85', dur: 4.1 },
    { cx: 35, cy: 55, r: 0.4, color: 'rgba(120, 210, 140, 0.7)', opacity: 0.5, opacityValues: '0.3;0.8;0.3', cyValues: '55;53;55', dur: 2.7 },
    { cx: 65, cy: 48, r: 0.4, color: 'rgba(212, 168, 75, 0.55)', opacity: 0.5, opacityValues: '0.2;0.7;0.2', cyValues: '48;50;48', dur: 3.6 },
  ],
} as const;

/**
 * Runtime validation for the token contract.
 */
export function validateMatericThreatAuraTokens(
  candidate: unknown,
): MatericThreatAuraTokens {
  return tokensSchema.parse(candidate);
}
