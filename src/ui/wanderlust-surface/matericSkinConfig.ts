import { z } from 'zod';

/**
 * @fileoverview Config tokens for the "Materic" (Pulsazione Materica) skin variant.
 *
 * These values are consumed by {@link WanderlustStatBar} and {@link DragTestContainer}
 * when they are rendered inside a {@link MatericSkinProvider}. They are intentionally
 * kept in a single config module so the visual recipe can be tuned without touching
 * component code.
 */

const statBarFillConfigSchema = z.object({
  /** CSS background-image value (may include layered gradients). */
  backgroundImage: z.string(),
  /** Background-size for each image layer. */
  backgroundSize: z.string(),
  /** Blend mode for each image layer. */
  backgroundBlendMode: z.string(),
  /** Box shadow applied to the fill. */
  boxShadow: z.string(),
  /** Border radius for the fill (Materic uses sharp corners). */
  borderRadius: z.string(),
});

const statBarTrackConfigSchema = z.object({
  /** Base background color behind the texture. */
  backgroundColor: z.string(),
  /** CSS background-image for the track texture. */
  backgroundImage: z.string(),
  /** Blend mode for the track texture. */
  backgroundBlendMode: z.string(),
  /** Repeat value for the track texture. */
  backgroundRepeat: z.string(),
  /** Background size for the track texture. */
  backgroundSize: z.string(),
  /** Border shorthand for the track. */
  border: z.string(),
  /** Border radius for the track (Materic uses sharp corners). */
  borderRadius: z.string(),
  /** Box shadow applied to the track. */
  boxShadow: z.string(),
});

const statBarHighlightConfigSchema = z.object({
  /** CSS background-image for the top sheen. */
  backgroundImage: z.string(),
  /** Border radius for the highlight (Materic uses sharp corners). */
  borderRadius: z.string(),
});

const grainConfigSchema = z.object({
  /** Texture URL used for the grain overlay. */
  textureUrl: z.string(),
  /** Opacity of the grain overlay. */
  opacity: z.number(),
  /** CSS mix-blend-mode for the grain overlay. */
  mixBlendMode: z.string(),
  /** Background size for the grain texture. */
  size: z.string(),
  /** Background repeat for the grain texture. */
  repeat: z.string(),
});

/**
 * Zod schema for the full Materic skin config.
 */
export const matericSkinConfigSchema = z.object({
  track: statBarTrackConfigSchema,
  hpFill: statBarFillConfigSchema,
  staminaFill: statBarFillConfigSchema,
  fatigueFill: statBarFillConfigSchema,
  fillHighlight: statBarHighlightConfigSchema,
  grain: grainConfigSchema,
});

/**
 * TypeScript type inferred from {@link matericSkinConfigSchema}.
 */
export type MatericSkinConfig = z.infer<typeof matericSkinConfigSchema>;

/**
 * Default Materic skin tokens.
 */
export const MATERIC_SKIN_CONFIG: MatericSkinConfig = matericSkinConfigSchema.parse({
  track: {
    backgroundColor: '#0a0908',
    backgroundImage: 'url("/assets/ui/bg.png")',
    backgroundBlendMode: 'soft-light',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    border: '1px solid rgba(216,177,62,0.12)',
    borderRadius: '0px',
    boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.95), inset 0 1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03)',
  },
  hpFill: {
    // token-driven (lab migration, Stage 1): `--mat-hp-fill` overrides; fallback
    // = current sap-green recipe, so pages without the token layer (e.g.
    // /minimal-roster today) render UNCHANGED. `--mat-hp-meniscus` adds a bright
    // fill-front edge (glance-read cue) — transparent by default = invisible.
    backgroundImage: 'var(--mat-hp-fill, radial-gradient(ellipse 80% 80% at 20% 50%, rgba(255,255,255,0.12), transparent 50%), linear-gradient(90deg, #0d4a2a, #2d6a4f, #4a9c6a, #7bc96f))',
    backgroundSize: '100% 100%, 100% 100%',
    backgroundBlendMode: 'overlay, normal',
    boxShadow: 'inset 0 0 0 0.5px rgba(123,201,111,0.4), 0 0 8px rgba(0,0,0,0.35), 0 0 6px rgba(123,201,111,0.25), inset -2px 0 0 var(--mat-hp-meniscus, transparent)',
    borderRadius: '0px',
  },
  staminaFill: {
    // token-driven (lab migration, Stage 1): `--mat-stamina-fill` overrides;
    // fallback = the current golden-sand recipe (pages without the token layer
    // UNCHANGED). `--mat-stamina-meniscus` = the fill-front edge highlight.
    backgroundImage: 'var(--mat-stamina-fill, radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, #7a5c00, #d4af37, #f0cf6a))',
    backgroundSize: '3px 3px, 100% 100%',
    backgroundBlendMode: 'overlay, normal',
    boxShadow: 'inset 0 0 0 0.5px rgba(245,158,11,0.4), 0 0 8px rgba(0,0,0,0.35), 0 0 6px rgba(245,158,11,0.2), inset -2px 0 0 var(--mat-stamina-meniscus, transparent)',
    borderRadius: '0px',
  },
  fatigueFill: {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, #7a3c2a, #9e5a4a, #d98a4a)',
    backgroundSize: '3px 3px, 100% 100%',
    backgroundBlendMode: 'overlay, normal',
    boxShadow: 'inset 0 0 0 0.5px rgba(217,138,74,0.4), 0 0 8px rgba(0,0,0,0.35), 0 0 6px rgba(217,138,74,0.2)',
    borderRadius: '0px',
  },
  fillHighlight: {
    backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.22), transparent)',
    borderRadius: '0px',
  },
  grain: {
    textureUrl: '/assets/ui/bg.png',
    opacity: 0.1,
    mixBlendMode: 'normal',
    size: 'auto',
    repeat: 'repeat',
  },
});
