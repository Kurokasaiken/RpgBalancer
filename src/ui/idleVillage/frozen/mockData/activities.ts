/**
 * Frozen Mock Activities
 *
 * Centralized mock activity data for frozen component kits.
 * Extracted from TestRosterPage.tsx and activity definitions.
 *
 * Version: 1.0.0
 * Frozen At: 2026-05-21
 * Source: TestRosterPage.tsx, ActivityCapsule
 */

import type { ActivitySlotData } from '@/ui/idleVillage/components/ActivityCapsule';

/**
 * Mock activities for testing frozen components.
 * These activities cover different states (idle, active, complete).
 */
export const FROZEN_MOCK_ACTIVITIES: ActivitySlotData[] = [
  {
    id: 'activity_001',
    activityId: 'gathering',
    slotId: 'slot_001',
    residentId: 'res_001',
    status: 'idle',
    startTime: 0,
    duration: 100,
    progress: 0,
  },
  {
    id: 'activity_002',
    activityId: 'crafting',
    slotId: 'slot_002',
    residentId: 'res_002',
    status: 'active',
    startTime: 50,
    duration: 200,
    progress: 0.25,
  },
  {
    id: 'activity_003',
    activityId: 'hunting',
    slotId: 'slot_003',
    residentId: 'res_003',
    status: 'complete',
    startTime: 0,
    duration: 150,
    progress: 1,
  },
  {
    id: 'activity_004',
    activityId: 'research',
    slotId: 'slot_004',
    residentId: null,
    status: 'idle',
    startTime: 0,
    duration: 300,
    progress: 0,
  },
];

/**
 * Single activity for isolated testing.
 */
export const FROZEN_SINGLE_ACTIVITY: ActivitySlotData = FROZEN_MOCK_ACTIVITIES[0];
