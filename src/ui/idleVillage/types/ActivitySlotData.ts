import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';

/**
 * Config-first shape shared between sandbox/map components when describing an activity slot.
 * Mirrors the legacy VillageSandbox data model but extracted into a reusable type to avoid
 * importing UI components just for typings.
 */
export interface ActivitySlotData {
  slotId: string;
  label: string;
  iconName: string;
  assignedWorkerId: string | null;
  activity: ActivityDefinition;
  mapSlotLabel?: string;
  visualVariant: VerbVisualVariant;
}
