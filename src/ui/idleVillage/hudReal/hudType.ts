/**
 * HUD type scale (PLAN-112 F2, amend G1 #2). CSS px at the game's HUD zoom 1 (`hudScale.ts`): the blueprint uses the game's own scale
 * model, so real px = token x zoom with zoom in 1..2 (never below 1). Floors are therefore met at zoom 1 with margin:
 *   running text  16 real (floor 14)   secondary 15 (floor 13)   caption 14 (floor 12; labels only, never running text)
 * A text that does not fit its field is shortened with an ellipsis, never shrunk below its token.
 * Supersedes the proportional-canvas scales (PLAN-110: 1600x900; F2 first version: 1440x720).
 */
export const HUD_TYPE = {
  caption: 14,   // kickers, section labels, nav labels, resource labels, hints
  secondary: 15, // level line, small buttons, tooltips' second line
  body: 16,      // running text (panel, narrator), requirements, rewards
  name: 19,      // hero names in the hover plaque
  nameLong: 16,  // long names (still body size)
  value: 22,     // resource and clock values
  title: 24,     // panel title, seal figure uses its own size
} as const;

/** Real-pixel floors the scale must reach at READABLE_SCALE (checked by tests/unit/idleVillage/hudTypeScale.test.ts). */
export const HUD_TYPE_FLOOR_REAL = { caption: 12, secondary: 13, body: 14, name: 16, nameLong: 14, value: 18, title: 20 } as const;

export type HudTypeToken = keyof typeof HUD_TYPE;
