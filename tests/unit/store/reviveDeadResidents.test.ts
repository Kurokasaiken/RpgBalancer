/**
 * R-264 — Director «revive fallen» regression test.
 *
 * Two villagers disappeared from the /game roster after quest settlement
 * marked them `isDead` (terminal consequence → `mergeStoreConsequences`
 * zeroes `currentHp` → the roster's `minHpThreshold` filters them out).
 * The Director revive action must clear `isDead` so the canonical roster
 * shows them again — WITHOUT touching the applied-effects ledger, or a
 * settlement replay would re-kill them.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
  traceMinimalGameplay: vi.fn(),
}));

import { useMinimalGameplayStore, selectResidentStatus } from '@/store/useMinimalGameplay';
import { mergeStoreConsequences } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import type { ResidentState } from '@/ui/idleVillage/types/gameplayTypes';

const VILLAGERS = [
  { id: 'villager-lisetta', name: 'Lisetta' },
  { id: 'villager-baldassarre', name: 'Manno' },
];

function seedDeadResidents() {
  const base = useMinimalGameplayStore.getState();
  useMinimalGameplayStore.setState({
    ...base,
    state: {
      ...base.state,
      residents: [
        { id: 'hero-1', name: 'Hero', stats: { strength: 5 }, fatigue: 0, level: 1, isHero: true },
        ...VILLAGERS.map((v) => ({
          id: v.id,
          name: v.name,
          stats: { strength: 5 },
          fatigue: 0,
          level: 1,
          isDead: true,
        })),
      ],
      /* The settlement ledger's dead: keys must survive the revive — a replay
       * dedups by these and can never re-kill a revived resident. */
      appliedQuestEffectIds: VILLAGERS.map((v) => `qsi-test:dead:1:${v.id}`),
    },
  });
}

describe('reviveDeadResidents — R-264 roster reintegration', () => {
  beforeEach(() => {
    seedDeadResidents();
  });

  it('clears isDead on every dead resident and returns their ids', () => {
    const revived = useMinimalGameplayStore.getState().reviveDeadResidents();

    expect(revived.sort()).toEqual(VILLAGERS.map((v) => v.id).sort());
    const { state } = useMinimalGameplayStore.getState();
    expect(state.residents.every((r) => !r.isDead)).toBe(true);
  });

  it('restores the roster-visible status contract — dead → available', () => {
    useMinimalGameplayStore.getState().reviveDeadResidents();

    const statuses = selectResidentStatus(useMinimalGameplayStore.getState().state);
    for (const v of VILLAGERS) {
      expect(statuses[v.id]).toBe('available');
    }
  });

  it('mergeStoreConsequences no longer zeroes HP or marks them dead', () => {
    const canonical: ResidentState[] = VILLAGERS.map((v) => ({
      id: v.id,
      name: v.name,
      maxHp: 50,
      currentHp: 50,
      fatigue: 0,
      isInjured: false,
      isHero: false,
      status: 'available',
      level: 1,
      skills: {},
    } as unknown as ResidentState));

    // BEFORE revive — the observed bug: cards collapse to dead/0hp.
    const withDeath = mergeStoreConsequences(
      canonical,
      VILLAGERS.map((v) => ({ id: v.id, isDead: true })),
    );
    expect(withDeath.every((r) => r.currentHp === 0 && r.status === 'dead')).toBe(true);

    useMinimalGameplayStore.getState().reviveDeadResidents();
    const storeResidents = useMinimalGameplayStore.getState().state.residents;

    const afterRevive = mergeStoreConsequences(canonical, storeResidents);
    for (const r of afterRevive) {
      expect(r.status).toBe('available');
      expect(r.currentHp).toBe(50);
      expect(r.isInjured).toBe(false);
    }
  });

  it('is idempotent — a second revive returns no ids and changes nothing', () => {
    useMinimalGameplayStore.getState().reviveDeadResidents();
    const after = useMinimalGameplayStore.getState().state.residents;

    expect(useMinimalGameplayStore.getState().reviveDeadResidents()).toEqual([]);
    expect(useMinimalGameplayStore.getState().state.residents).toBe(after);
  });

  it('keeps the applied-effects ledger — a settlement replay cannot re-kill', () => {
    useMinimalGameplayStore.getState().reviveDeadResidents();

    const { state } = useMinimalGameplayStore.getState();
    for (const v of VILLAGERS) {
      expect(state.appliedQuestEffectIds).toContain(`qsi-test:dead:1:${v.id}`);
    }
  });
});
