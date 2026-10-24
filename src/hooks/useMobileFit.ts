import { useMediaQuery } from './useMediaQuery';
import { getMobileFitConfig } from '@/balancing/config/idleVillage/mobileFitConfig';

/**
 * True when the viewport is in mobile-fit mode (`width < breakpointPx`,
 * PLAN-083). Below the breakpoint the `/game` surface engages compact
 * chrome, sheet panels and effective zoom bounds; at or above it the
 * desktop layout is emit-identical.
 */
export function useMobileFit(): boolean {
  const bp = getMobileFitConfig().breakpointPx;
  return useMediaQuery(`(max-width: ${bp - 1}px)`);
}

/** True on coarse-pointer devices (touch-first), independent of width. */
export function useCoarsePointer(): boolean {
  return useMediaQuery('(pointer: coarse)');
}
