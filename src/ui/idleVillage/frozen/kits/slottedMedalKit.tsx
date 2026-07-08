/**
 * slottedMedalKit — frozen re-export of {@link SlottedMedal}.
 *
 * Contract subtree: the canonical `SlottedMedal` accepts `data-testid` as a
 * prop. The minimal page passes `data-testid="slotted-medal-root"` so the
 * contract test has a stable selector on both pages.
 */

export { default as SlottedMedal } from '@/ui/idleVillage/components/SlottedMedal';
export type { SlottedMedalProps } from '@/ui/idleVillage/components/SlottedMedal';

import type { ComponentProps } from 'react';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import { useCanonicalRosterBundle } from '../_infra/CanonicalDataBridge';
import { createKitShell, withKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';

/** Smart shell: mounts only the providers missing above in the tree. */
export const SlottedMedalKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'SlottedMedalKitShell');

/** Drop-in variant: the canonical SlottedMedal pre-wrapped in its smart shell. */
export const SlottedMedalStandalone = withKitShell<ComponentProps<typeof SlottedMedal>>(
  SlottedMedal,
  FULL_PROVIDER_CHAIN,
  'SlottedMedalStandalone'
);

export function useSlottedMedalKitData() {
  const { residents } = useCanonicalRosterBundle(0);
  return {
    id: 'slot-lab-open-slot-1',
    type: 'gold' as const,
    residentId: residents[0]?.id,
    isActive: true,
    'data-testid': 'slotted-medal-root',
  };
}

export * from './slottedMedalKit.contract';
