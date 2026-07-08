/**
 * slotRackKit
 *
 * Frozen re-export of the canonical {@link ResidentSlotRack} (and its skinned
 * variant {@link ResidentSlotRackSkin}) plus a Shell with the provider chain
 * required by the slot system.
 *
 * Reference: TestRosterPage.tsx → RackScenarioPanel → ResidentSlotRackSkin
 * Contract subtree: `[data-testid="resident-slot-rack-root"]`
 */

import { useMemo } from 'react';
import { createKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';
import { useCanonicalRosterBundle, SLOT_LAB_CONFIG } from '../_infra/CanonicalDataBridge';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

// Canonical components — re-exported, not re-implemented.
export { default as ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
export { default as ResidentSlotRackSkin } from '@/ui/idleVillage/components/ResidentSlotRackSkin';
export type { ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
export type { ResidentSlotRackSkinProps } from '@/ui/idleVillage/components/ResidentSlotRackSkin';

/**
 * Returns a minimal canonical `ResidentSlotViewModel[]` derived from
 * `SLOT_LAB_CONFIG` (the same config TestRosterPage uses to seed scenarios).
 *
 * The first slot is assigned to the first canonical resident; the rest are
 * empty placeholders. This produces a deterministic, mock-free view model for
 * the `/minimal-slotRack` isolation page.
 */
export function useSlotRackKitData(): { slots: ResidentSlotViewModel[] } {
  const { residents } = useCanonicalRosterBundle(0);
  return useMemo(() => {
    const labOpen = SLOT_LAB_CONFIG?.scenarios?.find?.((s: { id?: string }) => s?.id === 'open');
    const labSlots: Array<{ id?: string; label?: string; required?: boolean }> = Array.isArray(labOpen?.slots)
      ? (labOpen.slots as Array<{ id?: string; label?: string; required?: boolean }>)
      : [];
    const slotDefs = labSlots.length > 0
      ? labSlots
      : [
          { id: 'slot-lab-open-slot-1', label: 'Slot 1', required: true },
          { id: 'slot-lab-open-slot-2', label: 'Slot 2', required: false },
          { id: 'slot-lab-open-slot-3', label: 'Slot 3', required: false },
        ];
    const slots: ResidentSlotViewModel[] = slotDefs.map((slot, index) => ({
      id: slot.id ?? `slot-${index + 1}`,
      index,
      label: slot.label ?? `Slot ${index + 1}`,
      required: slot.required ?? false,
      assignedResidentId: index === 0 ? residents[0]?.id ?? null : null,
      assignedResident: index === 0 ? residents[0] : undefined,
      isPlaceholder: false,
    }));
    return { slots };
  }, [residents]);
}

/**
 * Canonical provider chain required by the slot rack and its dnd-kit usage.
 * Mirrors `TestRosterPage` (Audit §2.5). Smart: mounts only the providers
 * missing above in the tree, so the kit is drop-in anywhere.
 */
export const SlotRackKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'SlotRackKitShell');

export * from './slotRackKit.contract';
export * from './slotRackKit.fixture';
