import type { ContractConfig } from '../_infra/contract';

export interface IntegrationQuestFlowKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'integrationQuestFlowKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-integration-quest-flow';
  subtreeSelector: '[data-testid="integration-quest-flow-root"]';
}

export const INTEGRATION_QUEST_FLOW_KIT_VERSION: IntegrationQuestFlowKitContract['version'] = '1.0.0';
export const INTEGRATION_QUEST_FLOW_KIT_SUBTREE_SELECTOR: IntegrationQuestFlowKitContract['subtreeSelector'] =
  '[data-testid="integration-quest-flow-root"]';

export const integrationQuestFlowKitContract: ContractConfig = {
  kitId: 'integrationQuestFlowKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-integration-quest-flow',
  subtreeSelector: INTEGRATION_QUEST_FLOW_KIT_SUBTREE_SELECTOR,
};
