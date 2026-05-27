/**
 * pgcardKit
 *
 * Frozen re-export of the canonical {@link PgCard} component plus a thin data
 * binder that picks the first canonical resident from `useRosterKitData()` to
 * render a single PgCard in isolation.
 *
 * Per Plan v2 §S2: no new component code. Re-export only, plus binder + Shell.
 */

import type { ReactNode } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useCanonicalRosterBundle, getResidentPortraitUrl } from '../_infra/CanonicalDataBridge';
import type { ResidentState } from '../_infra/CanonicalDataBridge';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';

// Canonical component — re-exported, not re-implemented.
export { default as PgCard } from '@/ui/idleVillage/components/PgCard';
export type { PgCardProps } from '@/ui/idleVillage/components/PgCard';

/**
 * Returns the canonical "first resident" used by the minimal-pgcard isolation
 * page. The choice is deterministic so the contract test produces stable diffs.
 */
export function usePgCardKitData(): {
  firstResident: ResidentState | undefined;
  allResidents: ResidentState[];
} {
  const { residents } = useCanonicalRosterBundle(0);
  return {
    firstResident: residents[0],
    allResidents: residents,
  };
}

/**
 * Helper that derives PgCard props from a canonical {@link ResidentState}.
 * Kept here so the page consumer never has to know how the canonical fields map
 * to PgCard's input shape — that mapping is the kit's responsibility.
 */
export function residentToPgCardProps(resident: ResidentState) {
  return {
    workerId: resident.id,
    label: (resident as ResidentState & { displayName?: string }).displayName ?? resident.id,
    hp: resident.currentHp ?? 0,
    maxHp: resident.maxHp ?? 100,
    fatigue: resident.fatigue ?? 0,
    portraitUrl: getResidentPortraitUrl(resident),
    statusLabel: String(resident.status ?? 'available'),
  } as const;
}

/**
 * Canonical provider chain required by `PgCard` and its dnd-kit usage.
 * Identical to `RosterKitShell` — see rosterKit.tsx — kept duplicated here for
 * explicitness so consumers don't depend transitively on `rosterKit`.
 */
export function PgCardKitShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <DragProvider>
          <DndContext>{children}</DndContext>
        </DragProvider>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

export { PGCARD_KIT_VERSION, type PgCardKitContract } from './pgcardKit.contract';
