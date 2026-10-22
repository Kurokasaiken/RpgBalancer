/**
 * Interface size (PLAN-058, 2026-10-14). The HUD is laid out in CSS px, so on a 2K/4K window at 100% it looks
 * small while the map grows with the window. In the desktop app the whole webview is zoomed natively.
 * In a browser the same factor is applied as CSS `zoom` on the HUD chrome layer (PLAN-043 WS-5): the Pixi
 * canvas keeps its own scale, and pointer/rect code inside the chrome layer must convert device px into
 * chrome-layer units via {@link getHudZoomFactor}.
 */

/** CSS-zoom factor currently applied to the HUD chrome layer.
 *  `1` in the desktop app (the native webview zoom already scales everything); the interface-size factor
 *  in browsers. Code that converts pointer coordinates (`clientX/Y`) or `getBoundingClientRect` (both
 *  device px) into positions inside the zoomed layer must divide by this factor. */
let hudZoomFactor = 1;
export function getHudZoomFactor(): number {
  return hudZoomFactor;
}
export function setHudZoomFactor(factor: number): void {
  hudZoomFactor = factor > 0 && Number.isFinite(factor) ? factor : 1;
}
/** Device px → chrome-layer units (identity when the factor is 1). */
export const deviceToHudUnits = (devicePx: number): number => devicePx / hudZoomFactor;

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

/** Control surfaced in the game menu. */
export interface HudScaleControl {
  mode: HudScaleMode;
  /** Factor actually applied right now. */
  effective: number;
  onChange: (mode: HudScaleMode) => void;
  /**
   * Factor the page applies as CSS `zoom` to the chrome layer — `effective`
   * in a browser, `1` in the desktop app where the native webview zoom
   * already covers it (applying CSS zoom on top would double it).
   */
  cssZoom: number;
}
