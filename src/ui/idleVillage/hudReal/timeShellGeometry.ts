/**
 * Shared geometric contract of the Time shell (slim or full bar).
 *
 * The Events surface consumes the same shell object in mirrored form and no
 * forked geometry. Its empty interior is a baked derivative of the same master
 * art, not a separately drawn Events shell. Mirroring is mathematical, not a
 * CSS flip of the whole component, so live text remains readable.
 */
export const TIME_SLIM_SHELL_ASSET = '/assets/ui/hud-real/time/bar-slim.webp';
/** Interior derivative of the same slim shell, baked by
 *  scripts/hud-real/build-time-shell-empty.py. Events uses this instead of a
 *  runtime mask: the Time enamel and painted sockets are absent pixels,
 *  replaced by the donated inner enamel of the previous Events bar. */
export const TIME_SLIM_SHELL_EMPTY_ASSET = '/assets/ui/hud-real/time/bar-slim-empty.webp';

export interface ShellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ShellBarGeometry {
  w: number;
  h: number;
  slots: readonly ShellRect[];
  field: ShellRect;
}

export interface ShellDialGeometry {
  cx: number;
  cy: number;
  frame?: {
    url: string;
    size: number;
    offset?: { x: number; y: number };
  };
}

export interface TimeShellLayout {
  field: ShellRect;
  slots: ShellRect[];
  dialCenter: { cx: number; cy: number };
  frameCenter: { x: number; y: number } | null;
  contentWell: ShellRect;
}

/** Mirror one x coordinate inside a shell of width `width`. */
export function mirrorShellX(x: number, width: number): number {
  return width - x;
}

/** Mirror a rect inside a shell of width `width`. */
export function mirrorShellRect(rect: ShellRect, width: number): ShellRect {
  return { ...rect, x: width - rect.x - rect.w };
}

/**
 * Resolve field, sockets, medallion centre and the live-content well for
 * either orientation. The well is the union of the Time text field and speed
 * sockets, slightly inset so the painted rails stay visible.
 */
export function resolveTimeShellLayout(
  bar: ShellBarGeometry,
  dial: ShellDialGeometry,
  mirrored = false,
): TimeShellLayout {
  const field = mirrored ? mirrorShellRect(bar.field, bar.w) : { ...bar.field };
  const slots = bar.slots.map((slot) => (mirrored ? mirrorShellRect(slot, bar.w) : { ...slot }));
  const dialCenter = { cx: mirrored ? mirrorShellX(dial.cx, bar.w) : dial.cx, cy: dial.cy };
  const offset = dial.frame?.offset ?? { x: 0, y: 0 };
  const frameCenter = dial.frame
    ? {
        x: mirrored ? mirrorShellX(dial.cx + offset.x, bar.w) : dial.cx + offset.x,
        y: dial.cy + offset.y,
      }
    : null;

  const pieces = [field, ...slots];
  const minX = Math.min(...pieces.map((r) => r.x));
  const maxX = Math.max(...pieces.map((r) => r.x + r.w));
  const minY = Math.min(...pieces.map((r) => r.y));
  const maxY = Math.max(...pieces.map((r) => r.y + r.h));
  const contentWell = {
    x: minX - 3,
    y: minY + 2,
    w: maxX - minX + 6,
    h: maxY - minY - 4,
  };

  return { field, slots, dialCenter, frameCenter, contentWell };
}
