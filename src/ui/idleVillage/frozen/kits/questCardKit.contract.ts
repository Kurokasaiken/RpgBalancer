import type { ContractConfig } from '../_infra/contract';

export interface QuestCardKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'questCardKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-questcard';
  subtreeSelector: '[data-testid="quest-card"]';
}

export const QUEST_CARD_KIT_VERSION: QuestCardKitContract['version'] = '1.0.0';
export const QUEST_CARD_KIT_SUBTREE_SELECTOR: QuestCardKitContract['subtreeSelector'] =
  '[data-testid="quest-card"]';

export const questCardKitContract: ContractConfig = {
  kitId: 'questCardKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-questcard',
  subtreeSelector: QUEST_CARD_KIT_SUBTREE_SELECTOR,
};
