/**
 * PLAN-019-S2.2 — real-party pipeline tests.
 *
 * (T-2) golden adapter: `residentToQuestMember` on real-resident fixtures —
 *       derived stats, edge cases (missing/invalid snapshot fields), the
 *       wounded rule, equip-invariance (FACT r2: statSnapshot carries no
 *       equip bonus, so the adapter must ignore it).
 * (T-3a) engine regression: a hand-built party equal to a preset produces
 *        the SAME trajectory as the presetId path over N seeds.
 * (T-3b) real-party runs terminate end-to-end on both scenarios.
 * (T-5) item contract: every engine flag has a catalog entry (engineFlag
 *       alias), item-id/flag loadouts resolve identically, reservations are
 *       keyed on runId.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { DEFAULT_STATS } from '@/balancing/types';
import { QUEST_MEMBER_STATS, deriveQuestStats, deriveRunHp } from '@/balancing/config/idleVillage/quests/questMemberStats';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import {
  expeditionBagItems,
  flagsToItemIds,
  releaseLoadout,
  reserveLoadout,
  reservedItemIds,
  resolveExpeditionLoadout,
} from '@/ui/idleVillage/questS1Lab/expeditionLoadout';
import { availableOptions, applyChoice, createRun, type QuestId, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS, ROVINE_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import { mulberry32, signatureOf } from './questScenarioExplorer';

/* In-memory persistence for the reservation contract. */
const store = new Map<string, unknown>();
vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(async (key: string, fallback: unknown) => (store.has(key) ? store.get(key) : fallback)),
  saveData: vi.fn(async (key: string, value: unknown) => {
    store.set(key, value);
  }),
  clearData: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

const makeResident = (overrides: Partial<ResidentState>): ResidentState =>
  ({
    id: 'res-x',
    displayName: 'Res X',
    status: 'available',
    fatigue: 0,
    statSnapshot: { ...DEFAULT_STATS },
    currentHp: 200,
    maxHp: 200,
    isHero: true,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    ...overrides,
  }) as ResidentState;

/* ------------------------------------------------------------------ */
/* T-2 — residentToQuestMember golden                                    */
/* ------------------------------------------------------------------ */

describe('residentToQuestMember (T-2)', () => {
  const tank = makeResident({
    id: 'hero-tank',
    displayName: 'Sir Tank',
    statSnapshot: { ...DEFAULT_STATS, hp: 280, damage: 24, txc: 22, evasion: 6 },
    currentHp: 280,
    maxHp: 280,
  });

  it('derives real channels through the config table', () => {
    const m = residentToQuestMember(tank, 'leader');
    expect(m.id).toBe('hero-tank');
    expect(m.name).toBe('Sir Tank');
    expect(m.role).toBe('leader');
    /* damage 24: linear [10,40]→[25,75] = 25 + (14/30)*50 ≈ 48.33 → 48
     * hp 280:    [150,300]→[30,75]  = 30 + (130/150)*45 = 69
     * txc 22:    [15,35]→[25,75]   = 25 + (7/20)*50 ≈ 42.5 → 43 (round)
     * evasion 6: [0,20]→[25,70]    = 25 + (6/20)*45 = 38.5 → 39 */
    expect(m.stats).toEqual({ str: 48, con: 69, perc: 43, agi: 39, int: 40, cha: 40 });
    /* hp 280 → runHp [150,300]→[45,100] = 45 + (130/150)*55 ≈ 92.67 → 93 */
    expect(m.hp).toBe(93);
    expect(typeof m.portrait).toBe('string');
  });

  it('applies the channel `missing` value for absent/invalid snapshot fields', () => {
    const m = residentToQuestMember(
      makeResident({ statSnapshot: { hp: 200 } }),
      'member',
    );
    /* only hp present → con + runHp real; str/perc/agi take `missing` (30). */
    expect(m.stats.str).toBe(QUEST_MEMBER_STATS.channels.str.missing);
    expect(m.stats.perc).toBe(QUEST_MEMBER_STATS.channels.perc.missing);
    expect(m.stats.agi).toBe(QUEST_MEMBER_STATS.channels.agi.missing);
    expect(m.stats.con).toBe(45); // 200 → [150,300]→[30,75] = 30+(50/150)*45=45
  });

  it('keeps `cha` mirrored on the `int` mock channel (D-C)', () => {
    const stats = deriveQuestStats({ hp: 200, damage: 20, txc: 25, evasion: 10 });
    expect(stats.cha).toBe(stats.int);
  });

  it('wounded residents start with proportionally reduced run HP', () => {
    const hurt = makeResident({
      statSnapshot: { ...DEFAULT_STATS, hp: 300 },
      currentHp: 90,
      maxHp: 300,
      isInjured: true,
    });
    const full = residentToQuestMember(makeResident({ statSnapshot: { ...DEFAULT_STATS, hp: 300 }, currentHp: 300, maxHp: 300 }), 'member');
    const wounded = residentToQuestMember(hurt, 'member');
    expect(full.hp).toBe(100); // 300 → top of range
    expect(wounded.hp).toBe(Math.max(1, Math.floor(100 * (90 / 300))));
    expect(wounded.hp).toBeLessThan(full.hp!);
  });

  it('is equip-invariant: same snapshot, different equipment → same member stats (FACT r2)', () => {
    const base = { statSnapshot: { ...DEFAULT_STATS, hp: 210, damage: 18, txc: 28, evasion: 8 } };
    const a = residentToQuestMember(makeResident({ ...base, id: 'r1', displayName: 'A' }), 'member');
    const b = residentToQuestMember(
      makeResident({ ...base, id: 'r1', displayName: 'A', equipment: { weapon: 'legendary-sword' } } as Partial<ResidentState>),
      'member',
    );
    expect(b.stats).toEqual(a.stats);
    expect(b.hp).toBe(a.hp);
  });
});

/* ------------------------------------------------------------------ */
/* T-3 — createRun generalized                                           */
/* ------------------------------------------------------------------ */

const playOut = (run: QuestRunState, seed: number): string => {
  const policy = mulberry32(seed ^ 0x9e3779b9);
  for (let step = 0; step < 200 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (options.length === 0) break;
    applyChoice(run, options[Math.floor(policy() * options.length)].id);
  }
  return signatureOf(run);
};

describe('createRun — party path (T-3)', () => {
  it('(a) a hand-built party equal to a preset reproduces the preset trajectory', () => {
    for (const [questId, preset] of [
      ['goblin', GOBLIN_PRESETS[0]],
      ['rovine', ROVINE_PRESETS[0]],
    ] as const) {
      for (const seed of [1, 42, 777]) {
        const viaPreset = signatureOf((() => {
          const r = createRun(preset.id, seed, questId);
          playOut(r, seed);
          return r;
        })());
        const party: LabMember[] = preset.members.map((m) => ({ ...m }));
        const viaParty = signatureOf((() => {
          const r = createRun({ party: { members: party, gold: preset.gold, presetId: preset.id }, seed, questId });
          playOut(r, seed);
          return r;
        })());
        expect(viaParty).toBe(viaPreset);
      }
    }
  });

  it('object form accepts {party, seed, questId, loadout, clock}', () => {
    const run = createRun({
      party: GOBLIN_PRESETS[0].members.map((m) => ({ ...m })),
      seed: 7,
      questId: 'goblin',
      loadout: ['quest_consumable_cura', 'hasBonusForza'],
      clock: { nodeTicks: 60, startTick: 10 },
    });
    expect(run.questId).toBe('goblin');
    expect(run.presetId).toBe('party');
    expect(run.frontier.startedAt).toBe(10);
    expect(run.flags).toContain('hasHealing');
    expect(run.flags).toContain('hasBonusForza');
  });

  it('(b) real-resident parties run both scenarios end-to-end and terminate', () => {
    const roster: ResidentState[] = [
      makeResident({ id: 'hero-sir-spaccaculi', displayName: 'Sir Spaccaculi', statSnapshot: { ...DEFAULT_STATS, hp: 280, damage: 24, txc: 22, evasion: 6 }, currentHp: 280, maxHp: 280 }),
      makeResident({ id: 'hero-salvatrice', displayName: 'Salvatrice', statSnapshot: { ...DEFAULT_STATS, hp: 210, damage: 18, txc: 28, evasion: 8 }, currentHp: 210, maxHp: 210 }),
      makeResident({ id: 'hero-giggiolillo', displayName: 'Giggiolillo', statSnapshot: { ...DEFAULT_STATS, hp: 195, damage: 34, txc: 30, evasion: 12 }, currentHp: 195, maxHp: 195 }),
    ];
    for (const questId of ['goblin', 'rovine'] as QuestId[]) {
      const members = roster.map((r, i) => residentToQuestMember(r, i === 0 ? 'leader' : 'member'));
      for (const seed of [3, 17, 99, 555]) {
        const run = createRun({ party: { members }, seed, questId });
        playOut(run, seed);
        expect(run.ended).toBe(true);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* T-5 — real items + reservation contract                               */
/* ------------------------------------------------------------------ */

describe('expedition bag — real items (T-5)', () => {
  it('every engine stash flag has a catalog item with matching engineFlag (alias complete)', () => {
    const byFlag = new Map(
      Object.values(defaultQuestItems)
        .filter((i) => i.engineFlag)
        .map((i) => [i.engineFlag!, i.id]),
    );
    for (const item of QUEST_STASH.items) {
      expect(byFlag.get(item.flag), `flag ${item.flag} senza item`).toBeDefined();
    }
    /* and no orphan engineFlags pointing at unknown stash flags */
    const stashFlags = new Set(QUEST_STASH.items.map((i) => i.flag));
    for (const [flag] of byFlag) expect(stashFlags.has(flag)).toBe(true);
  });

  it('item-id loadouts resolve to the same flags as historic-flag loadouts', () => {
    const byFlags = resolveExpeditionLoadout(['hasBonusForza', 'hasHealing']);
    const byItems = resolveExpeditionLoadout(['quest_consumable_forza', 'quest_consumable_cura']);
    expect(byItems).toEqual(byFlags);
    expect(byItems).toEqual(['hasBonusForza', 'hasHealing']);
  });

  it('round-trips flags ↔ item ids and clamps to bagSlots', () => {
    const all = expeditionBagItems();
    expect(all).toHaveLength(QUEST_STASH.items.length);
    const flags = resolveExpeditionLoadout(all); // 6 items > bagSlots(3)
    expect(flags).toHaveLength(QUEST_STASH.bagSlots);
    expect(flagsToItemIds(flags)).toHaveLength(QUEST_STASH.bagSlots);
  });

  it('reservations are keyed on runId — another run cannot pick reserved items', async () => {
    await reserveLoadout('run-A', ['quest_consumable_cura', 'quest_consumable_pozione']);
    expect(await reservedItemIds()).toEqual(new Set(['quest_consumable_cura', 'quest_consumable_pozione']));
    /* the run itself sees its own items as not reserved when rebuilding */
    expect(await reservedItemIds('run-A')).toEqual(new Set());
    /* a second run's reservation is independent */
    await reserveLoadout('run-B', ['quest_consumable_corda']);
    expect(await reservedItemIds('run-A')).toEqual(new Set(['quest_consumable_corda']));
    /* idempotent on the same runId: re-reserve replaces */
    await reserveLoadout('run-A', ['quest_consumable_forza']);
    expect(await reservedItemIds()).toEqual(new Set(['quest_consumable_forza', 'quest_consumable_corda']));
    /* release is per-run */
    await releaseLoadout('run-A');
    expect(await reservedItemIds()).toEqual(new Set(['quest_consumable_corda']));
    await releaseLoadout('run-B');
    expect(await reservedItemIds()).toEqual(new Set());
  });
});
