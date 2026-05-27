/**
 * skillCheckKit — frozen re-export of {@link SkillCheckComponent}.
 *
 * Contract subtree: `[data-testid="skill-check-component"]` (added 2026-05-21).
 */

export { SkillCheckComponent } from '@/ui/idleVillage/components/SkillCheckComponent';
export type { SkillCheckComponentProps } from '@/ui/idleVillage/components/SkillCheckComponent';

export function useSkillCheckKitData() {
  return {
    state: 'rolling' as const,
    targetNumber: 12,
    difficulty: 'medium' as const,
  };
}

export * from './skillCheckKit.contract';
