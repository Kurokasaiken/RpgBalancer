/**
 * Frozen kit registry — single source of truth for all certified kits.
 *
 * Entries are appended by `scripts/freeze-kit.ts` and consumed by the contract
 * sweep (`tests/contract/minimal-vs-test.spec.ts`) and the CI gate.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

import type { ContractConfig } from './_infra/contract';
import { ROSTER_KIT_SUBTREE_SELECTOR } from './kits/rosterKit.contract';

export interface KitRegistryEntry {
  kitId: string;
  /** Module specifier resolvable by Vite / Vitest. */
  kitModule: string;
  /** Path to the cert manifest. */
  certManifestPath: string;
  /** Doc path (kit.md). */
  docPath: string;
  contract: ContractConfig;
}

export const KIT_REGISTRY: KitRegistryEntry[] = [
  {
    kitId: 'rosterKit',
    kitModule: './kits/rosterKit',
    certManifestPath: 'src/ui/idleVillage/frozen/kits/rosterKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/rosterKit.md',
    contract: {
      kitId: 'rosterKit',
      referenceRoute: '/test',
      minimalRoute: '/minimal-roster',
      subtreeSelector: ROSTER_KIT_SUBTREE_SELECTOR,
      providerChain: ['SkinSystemProvider', 'SandboxTimingProvider', 'DragProvider', 'DndContext'],
    },
  },
  {
    kitId: 'pgcardKit',
    kitModule: './kits/pgcardKit',
    certManifestPath: 'src/ui/idleVillage/frozen/kits/pgcardKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/pgcardKit.md',
    contract: {
      kitId: 'pgcardKit',
      referenceRoute: '/test',
      minimalRoute: '/minimal-pgcard',
      subtreeSelector: '[data-testid="village-roster-section"] [data-testid="pg-card"]',
      providerChain: ['SkinSystemProvider', 'SandboxTimingProvider', 'DragProvider', 'DndContext'],
    },
  },
  {
    kitId: 'slotRackKit',
    kitModule: './kits/slotRackKit',
    certManifestPath: 'src/ui/idleVillage/frozen/kits/slotRackKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/slotRackKit.md',
    contract: {
      kitId: 'slotRackKit',
      referenceRoute: '/test',
      minimalRoute: '/minimal-slotRack',
      subtreeSelector: '[data-testid="resident-slot-rack-root"]',
      providerChain: ['SkinSystemProvider', 'SandboxTimingProvider', 'DragProvider', 'DndContext'],
    },
  },
  // entries appended here
];

/**
 * Lookup helper used by tests.
 */
export function getKitEntry(kitId: string): KitRegistryEntry | undefined {
  return KIT_REGISTRY.find((entry) => entry.kitId === kitId);
}
