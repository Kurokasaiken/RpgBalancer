/**
 * pgcardKit
 *
 * Frozen re-export of the canonical {@link PgCard} component plus a thin data
 * binder that picks the first canonical resident from `useRosterKitData()` to
 * render a single PgCard in isolation.
 *
 * Per Plan v2 §S2: no new component code. Re-export only, plus binder + Shell.
 */

import type { ComponentProps } from 'react';
import { useCanonicalRosterBundle, getResidentPortraitUrl } from '../_infra/CanonicalDataBridge';
import type { ResidentState } from '../_infra/CanonicalDataBridge';
import { createKitShell, withKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';
import PgCard from '@/ui/idleVillage/components/PgCard';

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
 * Smart: mounts only the providers missing above in the tree.
 */
export const PgCardKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'PgCardKitShell');

/** Drop-in variant: the canonical PgCard pre-wrapped in its smart shell. */
export const PgCardStandalone = withKitShell<ComponentProps<typeof PgCard>>(
  PgCard,
  FULL_PROVIDER_CHAIN,
  'PgCardStandalone'
);

export { PGCARD_KIT_VERSION, type PgCardKitContract } from './pgcardKit.contract';
