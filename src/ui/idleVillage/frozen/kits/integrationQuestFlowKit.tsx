/**
 * integrationQuestFlowKit — composition kit for QuestCard → SkillCheck → Outcome.
 *
 * Note: Outcome canonical is missing (see outcomeKit). The integration is
 * exercised only through QuestCard + SkillCheck until OutcomeModal lands.
 *
 * Contract subtree: `[data-testid="integration-quest-flow-root"]`.
 */

import type { ReactNode } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

export { QuestCard } from '@/ui/idleVillage/components/QuestCard';
export { SkillCheckComponent } from '@/ui/idleVillage/components/SkillCheckComponent';
export { useQuestCardKitData } from './questCardKit';
export { useSkillCheckKitData } from './skillCheckKit';

export function IntegrationQuestFlowKitShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>{children}</SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

export * from './integrationQuestFlowKit.contract';
