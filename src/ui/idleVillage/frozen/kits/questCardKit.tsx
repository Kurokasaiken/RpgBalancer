/**
 * questCardKit — frozen re-export of {@link QuestCard}.
 *
 * Contract subtree: `[data-testid="quest-card"]` (added 2026-05-21).
 */

export { QuestCard } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';
export type { QuestCardProps } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';

export function useQuestCardKitData() {
  return {
    label: 'Goblin Raid',
    icon: '🗡️',
    subtitle: 'Combat quest',
    helperText: 'Defeat the goblin raiders threatening the village',
    progressFraction: 0.45,
    elapsedSeconds: 90,
    totalDurationSeconds: 200,
    isPlaying: true,
    injuryPercentage: 25,
    deathPercentage: 8,
    assignees: [],
    dataTestId: 'quest-card',
  };
}

export * from './questCardKit.contract';
