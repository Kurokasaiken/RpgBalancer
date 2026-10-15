/**
 * R-183 — la XP dei PG sopravvive al giro salva→carica dello snapshot
 * (stessa via del reload di /game). Regressione trovata dalla suite E2E.
 */
import { describe, expect, it } from 'vitest';
import { serializeSnapshot, deserializeSnapshot } from '@/engine/game/idleVillage/minimalSnapshotSerializer';
import { applyPlanToState, deriveSettlementPlan } from '@/ui/idleVillage/quests/questSettlement';

describe('R-183 snapshot resident xp', () => {
  it('xp e isOnExpedition fanno round-trip', () => {
    const data = {
      gold: 10, food: 5, maxFood: 10, currentDay: 1, currentTime: 7, isPaused: false, speedMultiplier: 1,
      residents: [
        { id: 'a', name: 'A', level: 1, stats: {}, fatigue: 0, isWorking: false, isInjured: false, isHero: true, xp: 40, isOnExpedition: true },
      ],
      activeActivities: [], eventLog: [], appliedQuestEffectIds: [],
    };
    const back = deserializeSnapshot(serializeSnapshot(data as never)) as unknown as { residents: { xp?: number; isOnExpedition?: boolean }[] };
    expect(back.residents[0].xp).toBe(40);
    expect(back.residents[0].isOnExpedition).toBe(true);
  });

  it('uno snapshot con le righe del settlement (messageParams) si salva e si ricarica', () => {
    const run = {
      questId: 'goblin', party: [{ id: 'a', name: 'A', dead: false, wounded: true, hp: 1, maxHp: 2 }], gold: 5, loot: [], info: [],
      flags: [], objectiveDone: true, ended: true, outcome: 'reward', xp: 30, frontier: { status: 'waiting', startedAt: 0, readyAt: 0 },
      scenarioInstanceId: 'qsi-persist', resolvedOffer: { rewardResolved: 10 },
    } as never;
    const state = {
      gold: 1, food: 5, maxFood: 10, wood: 0, xp: 0, currentDay: 1, currentTick: 7, isPaused: false, speedMultiplier: 1,
      residents: [{ id: 'a', name: 'A', level: 1, stats: {}, fatigue: 0, isWorking: false, isInjured: false, isHero: true }],
      activeActivities: [], eventLog: [], appliedQuestEffectIds: [],
    } as never;
    const next = applyPlanToState(state, deriveSettlementPlan(run), 7).next;
    const data = {
      gold: next.gold, food: next.food, maxFood: next.maxFood, currentDay: 1, currentTime: 7, isPaused: false, speedMultiplier: 1,
      residents: next.residents.map((r) => ({ ...r, level: 1, stats: {}, isOnExpedition: false })),
      activeActivities: [], eventLog: next.eventLog, appliedQuestEffectIds: next.appliedQuestEffectIds,
    };
    const back = deserializeSnapshot(JSON.parse(JSON.stringify(serializeSnapshot(data as never)))) as unknown as {
      gold: number; residents: { xp?: number }[]; eventLog: { type?: string; messageParams?: Record<string, unknown> }[];
    };
    expect(back.gold).toBe(16);
    expect(back.residents[0].xp).toBe(30);
    expect(back.eventLog.some((e) => e.type === 'quest_outcome')).toBe(true);
    expect(back.eventLog.find((e) => e.messageParams?.amount === 30)).toBeTruthy();
  });
});
