/**
 * useCountUp — eased 0→target sweep for the settlement delta chips (R-260).
 *
 * The pure part (`countUpValue`) is a plain function so the curve is
 * unit-testable; the hook drives it on `requestAnimationFrame` and honours
 * `prefers-reduced-motion` by landing on the final amount instantly.
 */
import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';

/**
 * The eased chip value at `progress` (0..1) of the sweep — ease-out cubic,
 * rounded to whole units so the chip never shows a fraction.
 */
export function countUpValue(target: number, progress: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  if (progress >= 1) return Math.round(target);
  const eased = 1 - Math.pow(1 - Math.max(0, progress), 3);
  return Math.round(target * eased);
}

/**
 * Counts from 0 to `target` over `durationMs`, re-armed whenever `key`
 * changes (the commit stamp). Under reduced-motion or a zero duration the
 * target is returned immediately, without scheduling frames.
 */
export function useCountUp(target: number, durationMs: number, key: number | string): number {
  const reduced = prefersReducedMotion();
  const [display, setDisplay] = useState(() => (reduced || durationMs <= 0 ? Math.round(target) : 0));
  useEffect(() => {
    if (reduced || durationMs <= 0) {
      setDisplay(Math.round(target));
      return;
    }
    setDisplay(0);
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const progress = (now - start) / durationMs;
      setDisplay(countUpValue(target, progress));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, key, reduced]);
  return display;
}
