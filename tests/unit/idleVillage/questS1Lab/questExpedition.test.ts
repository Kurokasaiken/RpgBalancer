/**
 * questExpedition.test.ts — PLAN-019-S2.4 T-3 launch-boundary unit coverage:
 * `buildExpeditionParty` re-validation plus `simulateQuestAsync` /
 * `estimateForPartyAsync` parity with the sync variants.
 */
import { describe, expect, it } from 'vitest';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { buildExpeditionParty, type ExpeditionSlotSpec } from '@/ui/idleVillage/quests/questExpedition';
import { estimateForParty, estimateForPartyAsync, resolveQuestOffer, collectWorldProgressSignals } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';
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
