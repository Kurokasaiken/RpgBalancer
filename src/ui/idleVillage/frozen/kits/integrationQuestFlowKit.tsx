/**
 * integrationQuestFlowKit — composition kit for QuestCard → SkillCheck → Outcome.
 *
 * Note: Outcome canonical is missing (see outcomeKit). The integration is
 * exercised only through QuestCard + SkillCheck until OutcomeModal lands.
 *
 * Contract subtree: `[data-testid="integration-quest-flow-root"]`.
 */

import { createKitShell } from '../_infra/KitShell';

export { QuestCard } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';
export { SkillCheckComponent } from '@/ui/idleVillage/components/SkillCheckComponent';
export { useQuestCardKitData } from './questCardKit';
export { useSkillCheckKitData } from './skillCheckKit';

/** Smart shell: mounts only the providers missing above in the tree. */
export const IntegrationQuestFlowKitShell = createKitShell(
  ['SkinSystemProvider', 'SandboxTimingProvider'],
  'IntegrationQuestFlowKitShell'
);

export * from './integrationQuestFlowKit.contract';
