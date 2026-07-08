/**
 * activeHudKit — frozen re-export of {@link ActiveHUD}.
 *
 * Contract subtree: `[data-testid="active-hud"]` (already on canonical root).
 */

import type { ComponentProps } from 'react';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import { createKitShell, withKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';

export { default as ActiveHUD } from '@/ui/idleVillage/components/ActiveHUD';
export type { ActiveHUDProps } from '@/ui/idleVillage/components/ActiveHUD';

/** Smart shell: mounts only the providers missing above in the tree. */
export const ActiveHudKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'ActiveHudKitShell');

/** Drop-in variant: the canonical ActiveHUD pre-wrapped in its smart shell. */
export const ActiveHUDStandalone = withKitShell<ComponentProps<typeof ActiveHUD>>(
  ActiveHUD,
  FULL_PROVIDER_CHAIN,
  'ActiveHUDStandalone'
);

export function useActiveHudKitData() {
  return {
    activeSlots: [],
    secondsPerTimeUnit: 60,
    variant: 'compact' as const,
  };
}

export * from './activeHudKit.contract';
