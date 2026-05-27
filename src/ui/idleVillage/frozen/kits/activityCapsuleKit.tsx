/**
 * activityCapsuleKit — frozen re-export of {@link ActivityCapsule}.
 *
 * Contract subtree: `[data-testid="activity-capsule-root"]` (passed via prop).
 */

import { useMemo } from 'react';
import { useCanonicalRosterBundle } from '../_infra/CanonicalDataBridge';

export { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
export type { ActivityCapsuleProps, ActivitySlotData } from '@/ui/idleVillage/components/ActivityCapsule';

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
