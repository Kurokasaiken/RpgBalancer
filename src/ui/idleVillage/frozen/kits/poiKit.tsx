/**
 * poiKit
 *
 * Frozen re-export of the minimal POI ecosystem (JobPOI, ActivityPOI,
 * QuestPOI and their skins) plus a smart shell with the chain the POIs need:
 * SkinSystemProvider → SandboxTimingProvider → DndContext (droppable targets).
 *
 * One-line transplant anywhere in the app:
 *
 *   import { JobPOIStandalone } from '@/ui/idleVillage/frozen/kits/poiKit';
 *
 * Reference: src/pages/minimal-poi.tsx (route /minimal-poi)
 */

import type { ComponentProps } from 'react';
import { JobPOI } from '@/ui/idleVillage/components/minimal/JobPOI';
import { ActivityPOI } from '@/ui/idleVillage/components/minimal/ActivityPOI';
import { QuestPOI } from '@/ui/idleVillage/components/minimal/QuestPOI';
import { default as DayNightPOI } from '@/ui/idleVillage/components/minimal/DayNightPOI';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical components — re-exported, not re-implemented.
export { JobPOI } from '@/ui/idleVillage/components/minimal/JobPOI';
export { ActivityPOI } from '@/ui/idleVillage/components/minimal/ActivityPOI';
export { QuestPOI } from '@/ui/idleVillage/components/minimal/QuestPOI';
export { default as DayNightPOI } from '@/ui/idleVillage/components/minimal/DayNightPOI';
export { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
export { default as DayNightPoiSkin } from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';
export type { JobStatus } from '@/ui/idleVillage/components/minimal/JobPOI';
export type { ActivityStatus } from '@/ui/idleVillage/components/minimal/ActivityPOI';
export type { QuestStatus, QuestPOIPhase } from '@/ui/idleVillage/components/minimal/QuestPOI';

export const POI_PROVIDER_CHAIN: KitProviderName[] = [
  'SkinSystemProvider',
  'SandboxTimingProvider',
  'DndContext',
];

/** Smart shell: mounts only the providers missing above in the tree. */
export const PoiKitShell = createKitShell(POI_PROVIDER_CHAIN, 'PoiKitShell');

/** Drop-in variants: canonical POIs pre-wrapped in the smart shell. */
export const JobPOIStandalone = withKitShell<ComponentProps<typeof JobPOI>>(
  JobPOI,
  POI_PROVIDER_CHAIN,
  'JobPOIStandalone'
);
export const ActivityPOIStandalone = withKitShell<ComponentProps<typeof ActivityPOI>>(
  ActivityPOI,
  POI_PROVIDER_CHAIN,
  'ActivityPOIStandalone'
);
export const QuestPOIStandalone = withKitShell<ComponentProps<typeof QuestPOI>>(
  QuestPOI,
  POI_PROVIDER_CHAIN,
  'QuestPOIStandalone'
);
