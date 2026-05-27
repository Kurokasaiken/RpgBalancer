import type { ContractConfig } from '../_infra/contract';

export interface ResourceHudKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'resourceHudKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-resourcehud';
  subtreeSelector: '[data-testid="resource-panel"]';
}

export const RESOURCE_HUD_KIT_VERSION: ResourceHudKitContract['version'] = '1.0.0';
export const RESOURCE_HUD_KIT_SUBTREE_SELECTOR: ResourceHudKitContract['subtreeSelector'] =
  '[data-testid="resource-panel"]';

export const resourceHudKitContract: ContractConfig = {
  kitId: 'resourceHudKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-resourcehud',
  subtreeSelector: RESOURCE_HUD_KIT_SUBTREE_SELECTOR,
};
