/**
 * questExpedition.test.ts — PLAN-019-S2.4 T-3 launch-boundary unit coverage:
 * `buildExpeditionParty` re-validation plus `simulateQuestAsync` /
 * `estimateForPartyAsync` parity with the sync variants.
 */
import { describe, expect, it } from 'vitest';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { buildExpeditionParty, deriveKeyStats, expeditionDays, formatExpeditionSpan, isExpeditionItem, loadoutDuration, type ExpeditionSlotSpec } from '@/ui/idleVillage/quests/questExpedition';
import { estimateForParty, estimateForPartyAsync, resolveQuestOffer, collectWorldProgressSignals } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const baseResident = (over: Partial<ResidentState>): ResidentState =>
  ({
    id: 'res-1',
    displayName: 'Test',
    status: 'available',
    fatigue: 0,
    isInjured: false,
    currentHp: 200,
    maxHp: 200,
    statSnapshot: { hp: 200, damage: 20, txc: 50, evasion: 10 },
    statTags: ['edge'],
    ...over,
  }) as ResidentState;

const SLOTS: ExpeditionSlotSpec[] = [
  { blueprintId: 'poi-goblin:goblin-slot-leader', required: true, role: 'leader', requirement: { label: 'Capo', anyOf: ['edge', 'fortitude'] } },
  { blueprintId: 'poi-goblin:goblin-slot-member-1', required: false, role: 'member', requirement: { label: 'Comb', anyOf: ['edge'] } },
];

const fakeRun = (partyIds: string[]): QuestRunState =>
  ({ party: partyIds.map((id) => ({ id })), ended: false } as unknown as QuestRunState);

describe('buildExpeditionParty — T-3 write-boundary re-validation', () => {
  it('returns null when a required slot is empty', () => {
    expect(buildExpeditionParty(SLOTS, {}, { 'res-1': baseResident({}) }, [])).toBeNull();
  });

  it('builds a party with role mapping for valid assignments', () => {
    const members = buildExpeditionParty(
      SLOTS,
      { 'poi-goblin:goblin-slot-leader': 'res-1' },
      { 'res-1': baseResident({ id: 'res-1' }) },
      [],
    );
    expect(members).not.toBeNull();
    expect(members).toHaveLength(1);
    expect(members![0].id).toBe('res-1');
    expect(members![0].role).toBe('leader');
  });

  it('rejects a dead resident even if assigned earlier', () => {
    expect(
      buildExpeditionParty(
        SLOTS,
        { 'poi-goblin:goblin-slot-leader': 'res-1' },
        { 'res-1': baseResident({ status: 'dead' }) },
        [],
      ),
    ).toBeNull();
  });

  it('rejects a resident already out on another expedition (derived lock)', () => {
    expect(
      buildExpeditionParty(
        SLOTS,
        { 'poi-goblin:goblin-slot-leader': 'res-1' },
        { 'res-1': baseResident({}) },
        [fakeRun(['res-1'])],
      ),
    ).toBeNull();
  });

  it('admits an injured resident (Director decision — penalty lives in the data)', () => {
    const members = buildExpeditionParty(
      SLOTS,
      { 'poi-goblin:goblin-slot-leader': 'res-1' },
      { 'res-1': baseResident({ status: 'injured', isInjured: true, currentHp: 100 }) },
      [],
    );
    expect(members).not.toBeNull();
    // Reduced start HP is the data-carried penalty (S2.2 wounded rule).
    expect(members![0].hp).toBeLessThan(members![0].stats.con > 0 ? 100 : 0);
  });

  it('rejects a resident failing the slot stat requirement', () => {
    expect(
      buildExpeditionParty(
        SLOTS,
        { 'poi-goblin:goblin-slot-leader': 'res-1' },
        { 'res-1': baseResident({ statTags: ['clarity'] }) },
        [],
      ),
    ).toBeNull();
  });

  it('rejects a party with no leader (the engine needs one)', () => {
    const memberOnly: ExpeditionSlotSpec[] = [
      { blueprintId: 'm1', required: true, role: 'member', requirement: { anyOf: ['edge'] } },
    ];
    expect(
      buildExpeditionParty(memberOnly, { m1: 'res-1' }, { 'res-1': baseResident({}) }, []),
    ).toBeNull();
  });
});

describe('estimateForPartyAsync — parity with the sync estimate', () => {
  it('produces the same estimate as estimateForParty for the same party', async () => {
    const poi = questPoiById('poi-goblin')!;
    const signals = { daysPlayed: 0 };
    const { resolvedOffer } = resolveQuestOffer(poi, { signals, bandSim: { runs: 50, seed: 1 } });
    const members = GOBLIN_PRESETS[0].members.map((m) => ({ ...m }));
    const sync = estimateForParty(resolvedOffer, members, { runs: 60, seed: 9 });
    const async_ = await estimateForPartyAsync(resolvedOffer, members, { runs: 60, seed: 9, chunkRuns: 20 });
    expect(sync).not.toBe('incomplete');
    expect(async_).not.toBe('incomplete');
    if (sync !== 'incomplete' && async_ !== 'incomplete') {
      expect(async_.sim).toEqual(sync.sim);
      expect(async_.bands).toEqual(sync.bands);
      expect(async_.nSim).toBe(sync.nSim);
    }
  });

  it('returns incomplete for an underfilled party', async () => {
    const poi = questPoiById('poi-goblin')!;
    const { resolvedOffer } = resolveQuestOffer(poi, { signals: collectWorldProgressSignals(), bandSim: { runs: 30, seed: 2 } });
    expect(await estimateForPartyAsync(resolvedOffer, [], { runs: 10 })).toBe('incomplete');
  });
});

describe('loadoutDuration — S3 T-3 duration channel', () => {
  it('is identity with an empty bag', () => {
    const d = loadoutDuration([], 50, 250);
    expect(d.nodeTicks).toBe(50);
    expect(d.estimatedTicks).toBe(250);
    expect(d.factor).toBe(1);
  });

  it('the draft horse halves the per-node pace and the whole estimate', () => {
    const d = loadoutDuration(['quest_mount_draft_horse'], 50, 250);
    expect(d.nodeTicks).toBe(25);
    expect(d.estimatedTicks).toBe(125);
    expect(d.factor).toBeCloseTo(0.5, 10);
  });

  it('consumables without a duration channel do not touch the pace', () => {
    const d = loadoutDuration(['quest_consumable_fumogeno', 'quest_consumable_pozione'], 50, 250);
    expect(d.nodeTicks).toBe(50);
    expect(d.factor).toBe(1);
  });

  it('isExpeditionItem pools engine-flagged, duration and wired-cover items only', () => {
    expect(isExpeditionItem(defaultQuestItems.quest_mount_draft_horse)).toBe(true);
    expect(isExpeditionItem(defaultQuestItems.quest_consumable_pozione)).toBe(true);
    // PLAN-019-S4 T-5: coverRiskDelta is wired — the banner re-enters the bag.
    expect(isExpeditionItem(defaultQuestItems.quest_trinket_guardian_banner)).toBe(true);
    // Legacy equipment with no engine channel stays catalog-only; the armor's
    // carrier `deathChanceDelta` is still unwired — honest exclusion.
    expect(isExpeditionItem(defaultQuestItems.quest_weapon_iron_blade)).toBe(false);
    expect(isExpeditionItem(defaultQuestItems.quest_armor_heavy_plate)).toBe(false);
  });

  it('never returns a sub-1 pace even under extreme authored deltas', () => {
    const d = loadoutDuration(['quest_mount_draft_horse'], 1, 4);
    expect(d.nodeTicks).toBeGreaterThanOrEqual(1);
    expect(d.estimatedTicks).toBeGreaterThanOrEqual(1);
  });
});

describe('deriveKeyStats — PLAN-036 planner tier display', () => {
  it('returns authored keyStats verbatim (no derivation, no mutation)', () => {
    const tiers = deriveKeyStats({
      primaryStats: ['str', 'con'],
      keyStats: { primary: ['str'], secondary: ['perc', 'con', 'agi'] },
    });
    // Rovine shape: 'con' legitimately appears in both primaryStats and the
    // secondary tier — verbatim rendering must NOT set-subtract it away.
    expect(tiers.primary).toEqual(['str']);
    expect(tiers.secondary).toEqual(['perc', 'con', 'agi']);
  });

  it('falls back deterministically from primaryStats when keyStats is absent', () => {
    expect(deriveKeyStats({ primaryStats: ['str', 'perc'], keyStats: undefined })).toEqual({
      primary: ['str'],
      secondary: ['perc'],
    });
  });

  it('keeps tiers disjoint even when a legacy primaryStats duplicates a stat', () => {
    const tiers = deriveKeyStats({ primaryStats: ['str', 'str', 'con'], keyStats: undefined });
    expect(tiers.primary).toEqual(['str']);
    expect(tiers.secondary).toEqual(['con']);
    expect(tiers.secondary.some((s) => tiers.primary.includes(s))).toBe(false);
  });

  it('never invents a primary when no scenario exists', () => {
    expect(deriveKeyStats(undefined)).toEqual({ primary: [], secondary: [] });
    expect(deriveKeyStats({ primaryStats: [], keyStats: undefined })).toEqual({ primary: [], secondary: [] });
  });
});

describe('expeditionDays / formatExpeditionSpan — WS-3 whole-day vocabulary (AC-11)', () => {
  it.each([
    [0, 1], [0.3, 1], [0.49, 1], [0.5, 1], [1, 1],
    [1.4, 1], [1.5, 2], [1.6, 2], [2.25, 2], [2.5, 3], [4.6, 5],
  ])('rounds %d fractional days → %d whole days (round-half-up, min 1)', (input, expected) => {
    expect(expeditionDays(input)).toBe(expected);
  });

  it('clamps NaN/negative to the 1-day floor', () => {
    expect(expeditionDays(Number.NaN)).toBe(1);
    expect(expeditionDays(-3)).toBe(1);
  });

  it('renders the ICU-plural key with the rounded count, never ticks', () => {
    const calls: { key: string; opts?: Record<string, unknown> }[] = [];
    const t = (key: string, opts?: Record<string, unknown>) => {
      calls.push({ key, opts });
      return `${key}:${opts?.count}`;
    };
    expect(formatExpeditionSpan(0.3, t)).toBe('questExpedition.durationDays:1');
    expect(formatExpeditionSpan(1.6, t)).toBe('questExpedition.durationDays:2');
    expect(formatExpeditionSpan(2.25, t)).toBe('questExpedition.durationDays:2');
    expect(calls.every((c) => c.key === 'questExpedition.durationDays')).toBe(true);
  });
});
