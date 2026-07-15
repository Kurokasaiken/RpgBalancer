/**
 * Frozen kit registry — single source of truth for all kits.
 *
 * Entries are appended by `scripts/freeze-kit.ts` and consumed by:
 * - the contract sweep (`tests/contract/minimal-vs-test.spec.ts`) — certified kits only;
 * - the CI gate;
 * - the TestHub page (`src/ui/idleVillage/TestHub.tsx`), generated from `hub` metadata.
 *
 * `status` semantics:
 * - `certified` — frozen, contract-enforced, safe to transplant anywhere;
 * - `draft`     — kit exists and is the only sanctioned import surface for the
 *                 component, but the component itself still needs refactor work
 *                 before certification. Draft kits keep the same one-line
 *                 drop-in ergonomics so promotion to certified requires no
 *                 changes at call sites.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

import type { ContractConfig } from './_infra/contract';
import { ROSTER_KIT_SUBTREE_SELECTOR } from './kits/rosterKit.contract';

export type KitStatus = 'certified' | 'draft';

export interface KitHubMeta {
  title: string;
  description: string;
  icon: string;
  /** Route of the isolated test page shown in the TestHub. */
  path: string;
}

export interface KitRegistryEntry {
  kitId: string;
  /** Module specifier resolvable by Vite / Vitest. */
  kitModule: string;
  status: KitStatus;
  /** TestHub card metadata; omit to hide the kit from the hub. */
  hub?: KitHubMeta;
  /** Path to the cert manifest. */
  certManifestPath?: string;
  /** Doc path (kit.md). */
  docPath?: string;
  /** Required for certified kits; drafts may not have a contract yet. */
  contract?: ContractConfig;
}

export const KIT_REGISTRY: KitRegistryEntry[] = [
  {
    kitId: 'rosterKit',
    kitModule: './kits/rosterKit',
    status: 'certified',
    hub: {
      title: 'Roster',
      description: 'Lista eroi con sorting, filtering, drag & drop',
      icon: '📋',
      path: '/minimal-roster',
    },
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
    status: 'certified',
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
    status: 'certified',
    hub: {
      title: 'SlotRack',
      description: 'Slot assegnazione residenti alle attivita',
      icon: '🎰',
      path: '/minimal-slotRack',
    },
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
  {
    kitId: 'destinyAstrolabeKit',
    kitModule: './kits/destinyAstrolabeKit',
    status: 'certified',
    hub: {
      title: 'Destiny Astrolabe',
      description: 'D100 skill check con fisica della palla, verdetti cinematici, reusable component',
      icon: '✨',
      path: '/minimal-destiny-astrolabe',
    },
  },
  {
    kitId: 'poiKit',
    kitModule: './kits/poiKit',
    status: 'certified',
    hub: {
      title: 'POI Ecosystem',
      description: 'Day/Night cycle + Activity Capsules (Job, Quest, Exploration)',
      icon: '🗺️',
      path: '/minimal-poi',
    },
  },
  {
    kitId: 'clockKit',
    kitModule: './kits/clockKit',
    status: 'certified',
    hub: {
      title: 'Clock',
      description: 'Orologio giorno/notte con ciclo temporale',
      icon: '🕐',
      path: '/minimal-clock',
    },
    certManifestPath: 'src/ui/idleVillage/frozen/kits/clockKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/clockKit.md',
  },
  {
    kitId: 'questDetailKit',
    kitModule: './kits/questDetailKit',
    status: 'certified',
    hub: {
      title: 'Quest Chronicle',
      description: 'Dettaglio quest con fasi, progress bar, esito finale',
      icon: '📜',
      path: '/minimal-quest-detail',
    },
  },
  {
    kitId: 'resourceHudKit',
    kitModule: './kits/resourceHudKit',
    status: 'draft',
    hub: {
      title: 'Resource HUD',
      description: 'Pannello risorse villaggio (gold, wood, food, iron)',
      icon: '📊',
      path: '/minimal-resourcehud',
    },
    certManifestPath: 'src/ui/idleVillage/frozen/kits/resourceHudKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/resourceHudKit.md',
  },
  {
    kitId: 'questCardKit',
    kitModule: './kits/questCardKit',
    status: 'draft',
    hub: {
      title: 'QuestCard',
      description: 'Card quest con risk stripes, offer countdown, halo',
      icon: '🗡️',
      path: '/minimal-questcard',
    },
    certManifestPath: 'src/ui/idleVillage/frozen/kits/questCardKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/questCardKit.md',
  },
  {
    kitId: 'outcomeKit',
    kitModule: './kits/outcomeKit',
    status: 'draft',
    hub: {
      title: 'Outcome Modal',
      description: 'Modale risultato dopo skill check',
      icon: '🏆',
      path: '/minimal-outcome',
    },
    certManifestPath: 'src/ui/idleVillage/frozen/kits/outcomeKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/outcomeKit.md',
  },
  {
    kitId: 'marketKit',
    kitModule: './kits/marketKit',
    status: 'draft',
    hub: {
      title: 'Market',
      description: 'Card mercato per trading/acquisti',
      icon: '🏪',
      path: '/minimal-market',
    },
    certManifestPath: 'src/ui/idleVillage/frozen/kits/marketKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/marketKit.md',
  },
  {
    kitId: 'integrationQuestFlowKit',
    kitModule: './kits/integrationQuestFlowKit',
    status: 'draft',
    hub: {
      title: 'Quest Flow Integration',
      description: 'Flusso completo: QuestCard -> SkillCheck -> Outcome',
      icon: '🔗',
      path: '/minimal-integration-quest-flow',
    },
    certManifestPath: 'src/ui/idleVillage/frozen/kits/integrationQuestFlowKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/integrationQuestFlowKit.md',
  },
  {
    kitId: 'skillCheckKit',
    kitModule: './kits/skillCheckKit',
    status: 'draft',
    certManifestPath: 'src/ui/idleVillage/frozen/kits/skillCheckKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/skillCheckKit.md',
  },
  {
    kitId: 'activeHudKit',
    kitModule: './kits/activeHudKit',
    status: 'draft',
    certManifestPath: 'src/ui/idleVillage/frozen/kits/activeHudKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/activeHudKit.md',
  },
  {
    kitId: 'activityCapsuleKit',
    kitModule: './kits/activityCapsuleKit',
    status: 'draft',
    certManifestPath: 'src/ui/idleVillage/frozen/kits/activityCapsuleKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/activityCapsuleKit.md',
  },
  {
    kitId: 'slottedMedalKit',
    kitModule: './kits/slottedMedalKit',
    status: 'draft',
    certManifestPath: 'src/ui/idleVillage/frozen/kits/slottedMedalKit.cert.json',
    docPath: 'src/ui/idleVillage/frozen/kits/slottedMedalKit.md',
  },
  {
    kitId: 'jobDetailKit',
    kitModule: './kits/jobDetailKit',
    status: 'draft',
  },
  {
    kitId: 'locationDetailKit',
    kitModule: './kits/locationDetailKit',
    status: 'draft',
  },
  // entries appended here
  {
    kitId: 'rosterSlotKit',
    kitModule: './kits/rosterSlotKit', // TODO: placeholder until the module is created
    status: 'draft',
    hub: {
      title: 'Roster + Slot Rack',
      description: 'Integrazione Roster con SlotRack, drag & drop e assegnazione',
      icon: '🎯',
      path: '/minimal-roster-slot-integration',
    },
  },
  {
    kitId: 'jobPoiRosterKit',
    kitModule: './kits/jobPoiRosterKit', // TODO: placeholder until the module is created
    status: 'draft',
    hub: {
      title: 'POI + Roster Integration',
      description: 'Integrazione POI job detail con roster drag & drop',
      icon: '🗺️',
      path: '/minimal-job-poi-roster-integration',
    },
  },
  {
    kitId: 'jobPoiRosterTimeKit',
    kitModule: './kits/jobPoiRosterTimeKit', // TODO: placeholder until the module is created
    status: 'draft',
    hub: {
      title: 'POI + Roster + Time Integration',
      description: 'Integrazione completa con time engine e reward',
      icon: '⏱️',
      path: '/minimal-job-poi-roster-time-integration',
    },
  },
];

/**
 * Lookup helper used by tests.
 */
export function getKitEntry(kitId: string): KitRegistryEntry | undefined {
  return KIT_REGISTRY.find((entry) => entry.kitId === kitId);
}

/** Certified kits with an enforceable contract (consumed by the contract sweep). */
export function getContractEnforcedKits(): Array<KitRegistryEntry & { contract: ContractConfig }> {
  return KIT_REGISTRY.filter(
    (entry): entry is KitRegistryEntry & { contract: ContractConfig } =>
      entry.status === 'certified' && entry.contract !== undefined
  );
}
