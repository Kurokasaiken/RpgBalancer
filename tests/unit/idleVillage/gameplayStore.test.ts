/**
 * gameplayStore — the canonical gameplay state (PLAN-076 save/load family):
 * one Zustand store, one persistence key, and `getGameplaySnapshot` that
 * mirrors live state into the persisted shape.
 */
import { describe, expect, it } from 'vitest';
import {
  GAMEPLAY_STORE_KEY,
  getGameplaySnapshot,
  useGameplayStore,
} from '@/ui/idleVillage/store/gameplayStore';

describe('gameplayStore — canonical gameplay state', () => {
  // INV:gameplay-store.INV-1 — the persisted snapshot mirrors live state
  // (day, gold) and resetAll restores the initial world under the one
  // persistence key `minimal-gameplay-state`.
  it('snapshot mirrors live state and resetAll restores the initial world', () => {
    const state = () => useGameplayStore.getState();
    state().resetAll();
    expect(state().currentDay).toBe(0);
    state().incrementDay();
    state().setEconomyState((prev) => ({ ...prev, playerGold: 7 }));
    const snap = getGameplaySnapshot(state());
    expect(snap.currentDay).toBe(1);
    expect(snap.gold).toBe(7);
    expect(GAMEPLAY_STORE_KEY).toBe('minimal-gameplay-state');
    state().resetAll();
    expect(state().currentDay).toBe(0);
  });
});
