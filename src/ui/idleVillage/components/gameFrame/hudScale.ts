/**
 * Interface size (PLAN-058, 2026-10-14). The HUD is laid out in CSS px, so on a 2K/4K window at 100% it looks
 * small while the map grows with the window. In the desktop app the whole webview is zoomed natively (a CSS
 * `zoom`/`transform` would break the drag overlay of the medallions). Browsers keep their own zoom.
 */

/** Window size the HUD was designed for, in logical px. */
export const HUD_DESIGN_SIZE = { width: 1920, height: 1080 } as const;

/** Hard bounds of the zoom, whatever the player or the automatic mode asks. */
export const HUD_SCALE_MIN = 1;
export const HUD_SCALE_MAX = 2;

/** What the menu offers. `auto` follows the window size. */
export const HUD_SCALE_MODES = ['auto', 1, 1.25, 1.5, 2] as const;
export type HudScaleMode = (typeof HUD_SCALE_MODES)[number];

export const HUD_SCALE_KEY = 'hud_scale_v1';

/** Automatic factor for a window of `logicalWidth` × `logicalHeight` px: 1 up to full HD, then proportional (steps of 0.05). */
export function autoHudScale(logicalWidth: number, logicalHeight: number): number {
  if (!(logicalWidth > 0) || !(logicalHeight > 0)) return HUD_SCALE_MIN;
  const raw = Math.min(logicalWidth / HUD_DESIGN_SIZE.width, logicalHeight / HUD_DESIGN_SIZE.height);
  const stepped = Math.floor(raw * 20) / 20;
  return Math.min(HUD_SCALE_MAX, Math.max(HUD_SCALE_MIN, stepped));
}

/** Factor to apply for a mode in a window of the given logical size. */
export function resolveHudScale(mode: HudScaleMode, logicalWidth: number, logicalHeight: number): number {
  return mode === 'auto' ? autoHudScale(logicalWidth, logicalHeight) : Math.min(HUD_SCALE_MAX, Math.max(HUD_SCALE_MIN, mode));
}

/** Parses a stored value; anything unknown falls back to `auto`. */
export function parseHudScaleMode(value: unknown): HudScaleMode {
  return (HUD_SCALE_MODES as readonly unknown[]).includes(value) ? (value as HudScaleMode) : 'auto';
}

/** Control surfaced in the game menu (omitted outside the desktop app). */
export interface HudScaleControl {
  mode: HudScaleMode;
  /** Factor actually applied right now. */
  effective: number;
  onChange: (mode: HudScaleMode) => void;
}
