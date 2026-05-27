import type { ContractConfig } from '../_infra/contract';

export interface SkillCheckKitContract {
  version: `${number}.${number}.${number}`;
  kitId: 'skillCheckKit';
  referenceRoute: '/minimal-gameplay';
  minimalRoute: '/minimal-skillcheck';
  subtreeSelector: '[data-testid="skill-check-component"]';
}

export const SKILL_CHECK_KIT_VERSION: SkillCheckKitContract['version'] = '1.0.0';
export const SKILL_CHECK_KIT_SUBTREE_SELECTOR: SkillCheckKitContract['subtreeSelector'] =
  '[data-testid="skill-check-component"]';

export const skillCheckKitContract: ContractConfig = {
  kitId: 'skillCheckKit',
  referenceRoute: '/minimal-gameplay',
  minimalRoute: '/minimal-skillcheck',
  subtreeSelector: SKILL_CHECK_KIT_SUBTREE_SELECTOR,
};
