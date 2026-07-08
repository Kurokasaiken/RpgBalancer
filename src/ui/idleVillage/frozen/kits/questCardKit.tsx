/**
 * questCardKit — frozen re-export of {@link QuestCard}.
 *
 * Contract subtree: `[data-testid="quest-card"]` (added 2026-05-21).
 */

import type { ComponentProps } from 'react';
import { QuestCard } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

export { QuestCard } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';
export type { QuestCardProps } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';

/** Chain mirrors src/pages/minimal-questcard.tsx: SkinSystemProvider → SandboxTimingProvider. */
export const QUEST_CARD_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider', 'SandboxTimingProvider'];

/** Smart shell: mounts only the providers missing above in the tree. */
export const QuestCardKitShell = createKitShell(QUEST_CARD_PROVIDER_CHAIN, 'QuestCardKitShell');

/** Drop-in variant: the canonical QuestCard pre-wrapped in its smart shell. */
export const QuestCardStandalone = withKitShell<ComponentProps<typeof QuestCard>>(
  QuestCard,
  QUEST_CARD_PROVIDER_CHAIN,
  'QuestCardStandalone'
);

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
