import type { ContractConfig } from '../_infra/contract';

export interface IntegrationDragJobKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'integrationDragJobKit';
  referenceRoute: '/test';
  minimalRoute: '/minimal-integration-drag-job';
  subtreeSelector: '[data-testid="integration-drag-job-root"]';
}

export const INTEGRATION_DRAG_JOB_KIT_VERSION: IntegrationDragJobKitContract['version'] = '1.0.0';
export const INTEGRATION_DRAG_JOB_KIT_SUBTREE_SELECTOR: IntegrationDragJobKitContract['subtreeSelector'] =
  '[data-testid="integration-drag-job-root"]';

export const integrationDragJobKitContract: ContractConfig = {
  kitId: 'integrationDragJobKit',
  referenceRoute: '/test',
  minimalRoute: '/minimal-integration-drag-job',
  subtreeSelector: INTEGRATION_DRAG_JOB_KIT_SUBTREE_SELECTOR,
};
