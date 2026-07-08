/**
 * resourceHudKit — frozen re-export of {@link ResourcePanel}.
 *
 * Contract subtree: `[data-testid="resource-panel"]` (already on canonical root).
 */

import type { ComponentProps } from 'react';
import ResourcePanel from '@/ui/idleVillage/components/ResourcePanel';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

export { default as ResourcePanel } from '@/ui/idleVillage/components/ResourcePanel';
export type { ResourcePanelProps } from '@/ui/idleVillage/components/ResourcePanel';

/** Chain mirrors src/pages/minimal-resourcehud.tsx: SkinSystemProvider → SandboxTimingProvider. */
export const RESOURCE_HUD_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider', 'SandboxTimingProvider'];

/** Smart shell: mounts only the providers missing above in the tree. */
export const ResourceHudKitShell = createKitShell(RESOURCE_HUD_PROVIDER_CHAIN, 'ResourceHudKitShell');

/** Drop-in variant: the canonical ResourcePanel pre-wrapped in its smart shell. */
export const ResourcePanelStandalone = withKitShell<ComponentProps<typeof ResourcePanel>>(
  ResourcePanel,
  RESOURCE_HUD_PROVIDER_CHAIN,
  'ResourcePanelStandalone'
);

export function useResourceHudKitData() {
  return {
    title: 'Resources',
    goldRate: 12,
    foodRate: 8,
    populationRate: 3,
  };
}

export * from './resourceHudKit.contract';
