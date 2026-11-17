/**
 * questInitialState — «Stato iniziale» (PLAN-043 S3): a new game clears every
 * key that holds progress — the fixed world keys plus one save per authored
 * quest — and nothing else (preferences live outside this set).
 */
import { describe, expect, it } from 'vitest';
import { QUEST_POIS } from '@/balancing/config/idleVillage/quests/questPois';
import {
  CONSUMED_POIS_KEY,
  EXPEDITION_DRAFT_PREFIX,
  EXPEDITION_LOADOUT_KEY,
  INVASION_KEY,
  VILLAGE_HISTORY_KEY,
  VILLAGE_STATE_KEY,
  gameProgressKeys,
  questRunSaveKey,
} from '@/ui/idleVillage/components/gameFrame/questInitialState';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';

describe('questInitialState — the reset enumerates every progress key', () => {
  // INV:quest-initial-state.INV-1 — the progress key set covers the fixed world
  // keys plus one `idleVillage.questRun.<questId>` save per authored quest, with
  // no duplicates; expedition drafts live under a single per-day prefix.
  it('lists the fixed keys and one save key per authored quest, without duplicates', () => {
    const keys = gameProgressKeys();
    for (const fixed of [
      GAMEPLAY_STORE_KEY,
      VILLAGE_STATE_KEY,
      VILLAGE_HISTORY_KEY,
      CONSUMED_POIS_KEY,
      INVASION_KEY,
      EXPEDITION_LOADOUT_KEY,
    ]) {
      expect(keys).toContain(fixed);
    }
    const questIds = [...new Set(QUEST_POIS.map((poi) => poi.questId))];
    expect(questIds.length).toBeGreaterThan(0);
    for (const questId of questIds) {
      expect(keys).toContain(questRunSaveKey(questId));
    }
    expect(new Set(keys).size).toBe(keys.length);
    expect(questRunSaveKey('goblin')).toBe('idleVillage.questRun.goblin');
    expect(EXPEDITION_DRAFT_PREFIX).toBe('idleVillage.questExpeditionDraft.');
  });
});
