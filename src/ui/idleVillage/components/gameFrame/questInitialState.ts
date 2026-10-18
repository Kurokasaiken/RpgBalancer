/**
 * questInitialState — Director «Stato iniziale»: the page boots as a new game.
 *
 * Everything that holds progress is cleared, then the page reloads, so nothing
 * survives in memory either: the game clock and village (the day counter is
 * what expires the offers), the quest surface's saves (consumed POIs, the
 * goblin invasion, the expedition loadout, one save per quest run) and the
 * per-day expedition drafts.
 *
 * Kept on purpose: HUD layout, skin, UI scale and tuning — preferences, not
 * game progress.
 */
import { clearData } from '@/shared/persistence/PersistenceService';
import { QUEST_POIS } from '@/balancing/config/idleVillage/quests/questPois';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';

/* Village state keys (`idle_village_state/PersistenceService.ts`, not exported there). */
export const VILLAGE_STATE_KEY = 'idle_village_state';
export const VILLAGE_HISTORY_KEY = 'idle_village_state_history';
export const CONSUMED_POIS_KEY = 'idleVillage.questPois.consumed';
export const INVASION_KEY = 'invasion_v1';
export const EXPEDITION_LOADOUT_KEY = 'idleVillage.expeditionLoadout';
/** Prefix of the per-day expedition drafts (`useQuestExpeditionSession`). */
export const EXPEDITION_DRAFT_PREFIX = 'idleVillage.questExpeditionDraft.';

/** Save key of one quest run — mirrors `useQuestRun` (`idleVillage.questRun.<questId>`). */
export const questRunSaveKey = (questId: string) => `idleVillage.questRun.${questId}`;

/** Every fixed key that holds game progress, the quest runs derived from the authored offers. */
export function gameProgressKeys(): string[] {
  const questIds = [...new Set(QUEST_POIS.map((poi) => poi.questId))];
  return [
    GAMEPLAY_STORE_KEY,
    VILLAGE_STATE_KEY,
    VILLAGE_HISTORY_KEY,
    CONSUMED_POIS_KEY,
    INVASION_KEY,
    EXPEDITION_LOADOUT_KEY,
    ...questIds.map(questRunSaveKey),
  ];
}

/** Drafts live under one prefix per day; in the browser they are found by scanning the storage. */
function expeditionDraftKeys(): string[] {
  try {
    return Object.keys(localStorage).filter((key) => key.startsWith(EXPEDITION_DRAFT_PREFIX));
  } catch {
    return [];
  }
}

/** Clears the game's progress. Resolves once every key is gone. */
export async function clearGameProgress(): Promise<void> {
  await Promise.all([...gameProgressKeys(), ...expeditionDraftKeys()].map((key) => clearData(key)));
}
