/**
 * questCardKit — frozen re-export of {@link QuestCard}.
 *
 * Contract subtree: `[data-testid="quest-card"]` (added 2026-05-21).
 */

export { QuestCard } from '@/ui/idleVillage/components/QuestCard';
export type { QuestCardProps } from '@/ui/idleVillage/components/QuestCard';

export function useQuestCardKitData() {
  return {
    questId: 'quest-isolation-001',
    onCooldown: false,
  };
}

export * from './questCardKit.contract';
