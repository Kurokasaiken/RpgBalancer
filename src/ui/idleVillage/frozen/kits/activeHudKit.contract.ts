import type { ContractConfig } from '../_infra/contract';

export interface ActiveHudKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'activeHudKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-hud';
  subtreeSelector: '[data-testid="active-hud"]';
}

export const ACTIVE_HUD_KIT_VERSION: ActiveHudKitContract['version'] = '1.0.0';
export const ACTIVE_HUD_KIT_SUBTREE_SELECTOR: ActiveHudKitContract['subtreeSelector'] =
  '[data-testid="active-hud"]';

export const activeHudKitContract: ContractConfig = {
  kitId: 'activeHudKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-hud',
  subtreeSelector: ACTIVE_HUD_KIT_SUBTREE_SELECTOR,
};
