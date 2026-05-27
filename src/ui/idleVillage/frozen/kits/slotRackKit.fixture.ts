/**
 * slotRackKit.fixture
 *
 * Re-exports of canonical data sources used by SlotRack. Per Plan v2 §S1, no
 * inline mock arrays.
 *
 * Note: the slot rack view model (`ResidentSlotViewModel[]`) is computed at
 * runtime by `useResidentSlotController` from canonical config (`SLOT_LAB_CONFIG`).
 * The minimal-slotRack page binds to that controller to produce its slot list
 * — there is no static fixture array here, the slot list is derived.
 */

export {
  MINIMAL_GAMEPLAY_RESIDENTS as slotRackFixtureResidents,
  TEST_ROSTER_HEROES as slotRackFixtureHeroes,
  SLOT_LAB_CONFIG as slotRackFixtureLabConfig,
  type ResidentState,
} from '../_infra/CanonicalDataBridge';

export type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
