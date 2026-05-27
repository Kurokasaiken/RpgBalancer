import type { ContractConfig } from '../_infra/contract';

export interface ActivityCapsuleKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'activityCapsuleKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-activity';
  subtreeSelector: '[data-testid="activity-capsule-root"]';
}

export const ACTIVITY_CAPSULE_KIT_VERSION: ActivityCapsuleKitContract['version'] = '1.0.0';
export const ACTIVITY_CAPSULE_KIT_SUBTREE_SELECTOR: ActivityCapsuleKitContract['subtreeSelector'] =
  '[data-testid="activity-capsule-root"]';

export const activityCapsuleKitContract: ContractConfig = {
  kitId: 'activityCapsuleKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-activity',
  subtreeSelector: ACTIVITY_CAPSULE_KIT_SUBTREE_SELECTOR,
};
