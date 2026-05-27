import type { ContractConfig } from '../_infra/contract';

export interface JobCardKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'jobCardKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-jobcard';
  subtreeSelector: '[data-testid="job-card"]';
}

export const JOB_CARD_KIT_VERSION: JobCardKitContract['version'] = '1.0.0';
export const JOB_CARD_KIT_SUBTREE_SELECTOR: JobCardKitContract['subtreeSelector'] =
  '[data-testid="job-card"]';

export const jobCardKitContract: ContractConfig = {
  kitId: 'jobCardKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-jobcard',
  subtreeSelector: JOB_CARD_KIT_SUBTREE_SELECTOR,
};
