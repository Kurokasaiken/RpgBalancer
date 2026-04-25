/**
 * Shared formatting helpers for Idle Village mini action cards.
 *
 * These utilities are framework-agnostic so they can be consumed by React components
 * and tests alike without pulling in UI-specific dependencies.
 */

/**
 * Formats a number of seconds into a compact MM:SS string tailored for the
 * halo countdown medallions. Minutes are zero-padded to two digits and expand
 * to three digits when the duration exceeds 99 minutes to avoid truncation.
 */
export function formatMiniCardCountdown(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, '0');
  const minuteDigits = minutes >= 100 ? 3 : 2;
  const minuteString = minutes.toString().padStart(minuteDigits, '0');
  return `${minuteString}:${seconds}`;
}

/**
 * Clamps a numeric percentage into the 0-100 range while gracefully handling
 * NaN/Infinity inputs.
 */
export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
