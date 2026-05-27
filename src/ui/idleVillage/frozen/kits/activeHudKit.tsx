/**
 * activeHudKit — frozen re-export of {@link ActiveHUD}.
 *
 * Contract subtree: `[data-testid="active-hud"]` (already on canonical root).
 */

export { default as ActiveHUD } from '@/ui/idleVillage/components/ActiveHUD';
export type { ActiveHUDProps } from '@/ui/idleVillage/components/ActiveHUD';

export function useActiveHudKitData() {
  return {
    activeSlots: [],
    secondsPerTimeUnit: 60,
    variant: 'compact' as const,
  };
}

export * from './activeHudKit.contract';
