import type { ContractConfig } from '../_infra/contract';

export interface OutcomeKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'outcomeKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-outcome';
  subtreeSelector: '[data-testid="outcome-modal"]';
}

export const OUTCOME_KIT_VERSION: OutcomeKitContract['version'] = '0.0.0';
export const OUTCOME_KIT_SUBTREE_SELECTOR: OutcomeKitContract['subtreeSelector'] =
  '[data-testid="outcome-modal"]';

export const outcomeKitContract: ContractConfig = {
  kitId: 'outcomeKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-outcome',
  subtreeSelector: OUTCOME_KIT_SUBTREE_SELECTOR,
};
