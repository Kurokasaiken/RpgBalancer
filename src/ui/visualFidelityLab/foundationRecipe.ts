import type { MaterialLayerConfig } from '@/ui/wanderlust-surface/WanderlustSurface';
import type { MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';

/**
 * Visual Fidelity Lab — shared foundation (the GRAMMAR, not the content).
 *
 * Identical material language to the frozen reference (v9-skin-sandbox,
 * "Layout Primitives"). The rebuild MAY change hierarchy/spacing/rhythm but
 * MUST NOT introduce a new palette, frame, or material language. These three
 * constants encode exactly that boundary.
 */
export const OBSIDIAN_BG = 'var(--skin-surface-bg)';

/**
 * The panel FIELD background — CANDIDATE A, APPROVED & PROMOTED (2026-07-18):
 * azure light leak (barely touched) raining from above onto a BLU-NOTTE base
 * (#08121f) — a minimal step up from the near-black #060f16 that read too dark
 * at medium screen brightness. The green-teal cast the user liked is the cyan
 * leak over the dark base, NOT a base hue (lifting the base kills it). Now the
 * shared field for BOTH observatories + the plate quad. "Più luminoso, non più
 * chiaro."
 */
export const FIELD_BACKGROUND = [
  'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.13) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
  '#08121f',
].join(', ');

/** Gentle blu-notte edge vignette (no crushing to black). */
export const FIELD_VIGNETTE = 'inset 0 0 60px rgba(6,12,22,0.7)';

/**
 * GOLD_FILET — the thin gold hairline frame, ISOLATED as a recipe (NOT a
 * primitive yet: governance = extract a component only after a 2nd–3rd real
 * consumer confirms the pattern). Today it has ONE consumer: the Ancient Compass
 * reward plaque. Kept here so the next small component (badge / chip / token)
 * inherits the exact same filet — same hue, same weight — instead of being
 * hand-reinvented and drifting off-palette.
 *
 * Polarity follows the "raised element" law (mirror of a carved well): warm-lit
 * lip on the TOP edge, dark shade on the BOTTOM. Compose into `boxShadow` via
 * GOLD_FILET_SHADOW, or cherry-pick the three parts.
 */
export const GOLD_FILET = {
  /** 1px gold perimeter — the exact line preserved from the reward plaque. */
  hairline: 'inset 0 0 0 1px rgba(196,146,42,0.55)',
  /** warm-lit inner lip along the top edge. */
  topSheen: 'inset 0 1px 0 rgba(224,178,66,0.22)',
  /** dark inner shade along the bottom edge. */
  bottomShade: 'inset 0 -1px 0 rgba(0,0,0,0.4)',
} as const;

/** Ready-to-spread boxShadow value for the gold filet frame. */
export const GOLD_FILET_SHADOW = [
  GOLD_FILET.hairline,
  GOLD_FILET.topSheen,
  GOLD_FILET.bottomShade,
].join(', ');

/**
 * GOLD_FILET_SOFT — a MORE DELICATE, thinner sibling of GOLD_FILET (2026-07-18).
 * GOLD_FILET above is UNTOUCHED — this is a NEW version, not an edit. Reason:
 * frame weight = hierarchy. The reward plaque SHOUTS (GOLD_FILET, gold at 0.55);
 * the recessed content WELLS must WHISPER — same warm gold hue, roughly half the
 * intensity, so a well reads as luminous-edged (it was invisible on the blu-notte
 * field) without competing with the reward. Used as a real CSS `border` (crisp on
 * the wells' rounded corners) plus warm-lit top / dark base / recess-depth insets.
 */
export const GOLD_FILET_SOFT = {
  /** thin luminous gold edge — the delicate border the wells were missing. */
  border: '1px solid rgba(198,150,54,0.32)',
  /** warm-lit inner lip along the top edge (softer than the reward's). */
  topSheen: 'inset 0 1px 0 rgba(224,178,66,0.14)',
  /** dark inner shade along the bottom edge. */
  bottomShade: 'inset 0 -1px 0 rgba(0,0,0,0.4)',
  /** the recess itself — keeps the carved depth under the gold edge. */
  depth: 'inset 0 2px 8px rgba(0,0,0,0.7)',
} as const;

/** Ready-to-spread boxShadow value for the soft gold filet (pair with .border). */
export const GOLD_FILET_SOFT_SHADOW = [
  GOLD_FILET_SOFT.topSheen,
  GOLD_FILET_SOFT.bottomShade,
  GOLD_FILET_SOFT.depth,
].join(', ');

/** Same frame material as the reference. Not negotiable for the spike. */
export const SURFACE_MATERIAL: MaterialPreset = 'bronze';

/** Same depth/rim treatment as the reference panel. */
export const SURFACE_MATERIAL_LAYER: MaterialLayerConfig = {
  physicalDepth: true,
  rimLight: true,
  backgroundMode: 'bg',
  microInteraction: false,
  heavyFeel: false,
};
