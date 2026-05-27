/**
 * resourceHudKit — frozen re-export of {@link ResourcePanel}.
 *
 * Contract subtree: `[data-testid="resource-panel"]` (already on canonical root).
 */

export { default as ResourcePanel } from '@/ui/idleVillage/components/ResourcePanel';
export type { ResourcePanelProps } from '@/ui/idleVillage/components/ResourcePanel';

export function useResourceHudKitData() {
  return {
    title: 'Resources',
    goldRate: 12,
    foodRate: 8,
    populationRate: 3,
  };
}

export * from './resourceHudKit.contract';
