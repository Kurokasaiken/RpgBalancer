/**
 * activityCapsuleKit — frozen re-export of {@link ActivityCapsule}.
 *
 * Contract subtree: `[data-testid="activity-capsule-root"]` (passed via prop).
 */

import { useMemo, type ComponentProps } from 'react';
import { useCanonicalRosterBundle } from '../_infra/CanonicalDataBridge';
import { createKitShell, withKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';
import { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';

export { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
export type { ActivityCapsuleProps, ActivitySlotData } from '@/ui/idleVillage/components/ActivityCapsule';

/** Smart shell: mounts only the providers missing above in the tree. */
export const ActivityCapsuleKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'ActivityCapsuleKitShell');

/** Drop-in variant: the canonical ActivityCapsule pre-wrapped in its smart shell. */
export const ActivityCapsuleStandalone = withKitShell<ComponentProps<typeof ActivityCapsule>>(
  ActivityCapsule,
  FULL_PROVIDER_CHAIN,
  'ActivityCapsuleStandalone'
);

export function useActivityCapsuleKitData() {
  const { residents } = useCanonicalRosterBundle(0);
  return useMemo(
    () => ({
      slot: {
        id: 'activity-capsule-isolation-slot',
        activityId: 'gather-wood',
        slotId: 'activity-capsule-isolation-slot',
        residentId: residents[0]?.id ?? null,
        status: 'idle' as const,
        startTime: 0,
        duration: 100,
        progress: 0,
      },
      dataTestId: 'activity-capsule-root',
    }),
    [residents]
  );
}

export * from './activityCapsuleKit.contract';
