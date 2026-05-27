/**
 * slottedMedalKit — frozen re-export of {@link SlottedMedal}.
 *
 * Contract subtree: the canonical `SlottedMedal` accepts `data-testid` as a
 * prop. The minimal page passes `data-testid="slotted-medal-root"` so the
 * contract test has a stable selector on both pages.
 */

export { default as SlottedMedal } from '@/ui/idleVillage/components/SlottedMedal';
export type { SlottedMedalProps } from '@/ui/idleVillage/components/SlottedMedal';

import { useCanonicalRosterBundle } from '../_infra/CanonicalDataBridge';

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
