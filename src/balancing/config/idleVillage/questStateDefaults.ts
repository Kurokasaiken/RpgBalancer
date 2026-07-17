import type { QuestState } from './types/questTypes';

/**
 * C2 default initial quest state.
 *
 * Mirrors the shape used by the gameplay store and replaces the C1
 * `DEFAULT_QUEST_STATE` exported from `questConfig.ts`.
 */
export const DEFAULT_QUEST_STATE: QuestState = {
  activeQuests: [],
  history: [],
  cooldowns: {},
  lastUpdate: 0,
};
