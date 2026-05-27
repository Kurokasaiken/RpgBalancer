import type { ContractConfig } from '../_infra/contract';

export interface SlottedMedalKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'slottedMedalKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-slottedmedal';
  subtreeSelector: '[data-testid="slotted-medal-root"]';
}

export const SLOTTED_MEDAL_KIT_VERSION: SlottedMedalKitContract['version'] = '1.0.0';
export const SLOTTED_MEDAL_KIT_SUBTREE_SELECTOR: SlottedMedalKitContract['subtreeSelector'] =
  '[data-testid="slotted-medal-root"]';

export const slottedMedalKitContract: ContractConfig = {
  kitId: 'slottedMedalKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-slottedmedal',
  subtreeSelector: SLOTTED_MEDAL_KIT_SUBTREE_SELECTOR,
};
