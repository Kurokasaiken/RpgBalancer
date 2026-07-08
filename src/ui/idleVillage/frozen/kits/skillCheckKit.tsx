/**
 * skillCheckKit — frozen re-export of {@link SkillCheckComponent}.
 *
 * Contract subtree: `[data-testid="skill-check-component"]` (added 2026-05-21).
 */

import type { ComponentProps } from 'react';
import { SkillCheckComponent } from '@/ui/idleVillage/components/SkillCheckComponent';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

export { SkillCheckComponent } from '@/ui/idleVillage/components/SkillCheckComponent';
export type { SkillCheckComponentProps } from '@/ui/idleVillage/components/SkillCheckComponent';

/** Chain mirrors src/pages/minimal-skillcheck.tsx: SkinSystemProvider → SandboxTimingProvider. */
export const SKILL_CHECK_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider', 'SandboxTimingProvider'];

/** Smart shell: mounts only the providers missing above in the tree. */
export const SkillCheckKitShell = createKitShell(SKILL_CHECK_PROVIDER_CHAIN, 'SkillCheckKitShell');

/** Drop-in variant: the canonical SkillCheckComponent pre-wrapped in its smart shell. */
export const SkillCheckComponentStandalone = withKitShell<ComponentProps<typeof SkillCheckComponent>>(
  SkillCheckComponent,
  SKILL_CHECK_PROVIDER_CHAIN,
  'SkillCheckComponentStandalone'
);

export function useSkillCheckKitData() {
  return {
    state: 'rolling' as const,
    targetNumber: 12,
    difficulty: 'medium' as const,
  };
}

export * from './skillCheckKit.contract';
