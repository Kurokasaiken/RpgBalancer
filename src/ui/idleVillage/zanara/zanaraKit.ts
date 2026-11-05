/**
 * Shared Zanara kit pieces (LINGUAGGIO-v1 §6), built by
 * `scripts/build-zanara-kit.py` into public/assets/ui/zanara/kit/.
 * Units: design px (1600x900); assets are 2x.
 */

/** K7 lastra (F1) as a CSS border-image: slice measured where the corner ornament ends. */
export const ZANARA_LASTRA = {
  url: '/assets/ui/zanara/kit/lastra-9slice.png',
  slice: 44,
  corner: 22,
} as const;

/** `border-image` declarations for a lastra frame layer (content padding is the caller's). */
export const zanaraLastraFrame = (corner: number = ZANARA_LASTRA.corner) => ({
  borderStyle: 'solid',
  borderWidth: corner,
  borderImageSource: `url(${ZANARA_LASTRA.url})`,
  borderImageSlice: `${ZANARA_LASTRA.slice} fill`,
  borderImageWidth: `${corner}px`,
  borderImageRepeat: 'stretch',
}) as const;

/** Colour contract shared by Zanara components (preset seed, → --skin-hud-* at PLAN-107 T-101). */
export const ZANARA_COLORS = {
  value: '#f3ead0',
  label: '#b9d2c4',
  title: '#e8c766',
  body: '#e6dfc8',
  divider: 'linear-gradient(180deg, transparent, rgba(232, 199, 102, 0.55) 25%, rgba(232, 199, 102, 0.55) 75%, transparent)',
  textShadow: '0 1px 2px rgba(3, 26, 30, 0.85)',
  plateShadow: 'drop-shadow(0 8px 18px rgba(3, 26, 30, 0.7))',
} as const;
