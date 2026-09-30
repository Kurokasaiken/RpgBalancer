/**
 * MP-04 acceptance tests — draft state machine + Planner draft context.
 *
 * Covers the three acceptance criteria:
 *  1. Palindrome: edits undone/reset produce a byte-identical outcome via
 *     `serializeOutcome`.
 *  2. Invalidation: changing live roster state invalidates the draft.
 *  3. Launch contract: invalid drafts are rejected atomically with reasons.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  assignResident,
  buildLaunchPayload,
  diffOutcomes,
  emptyMissionPlannerDraft,
  removeMember,
  setConsumableQty,
  setLoadoutItem,
  toMissionDraft,
  validateDraft,
  type PlannerLiveState,
} from '@/engine/game/idleVillage/missionPlannerDraft';
import {
  questOutcomeDistribution,
  serializeOutcome,
} from '@/engine/game/idleVillage/missionPlannerEngine';
import {
  MissionPlannerProvider,
  useMissionPlannerDraft,
} from '@/ui/idleVillage/hooks/useMissionPlannerDraft';
import type { MissionPhaseSpec } from '@/engine/game/idleVillage/missionPlannerMath';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { QuestItem } from '@/balancing/config/idleVillage/quests/questItems.schema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeResident = (id: string, overrides?: Partial<ResidentState>): ResidentState => ({
  id,
  displayName: id,
  status: 'available',
  fatigue: 0,
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  statSnapshot: { hp: 100, strength: 12, agility: 8 },
  ...overrides,
});

const sword: QuestItem = {
  id: 'sword',
  kind: 'equipment',
  slot: 'weapon',
  labelKey: 'questItems.sword',
  statDeltas: { strength: 4 },
};
const draught: QuestItem = {
  id: 'draught',
  kind: 'consumable',
  labelKey: 'questItems.draught',
  qty: 2,
  injuryChanceDelta: -5,
};

const phases: MissionPhaseSpec[] = [
  { phaseId: 'p1', difficulty: 50, checkStatTags: ['strength'], baseInjuryChance: 10, baseDeathChance: 2, durationUnits: 30 },
  { phaseId: 'p2', difficulty: 45, checkStatTags: ['agility'], baseInjuryChance: 10, baseDeathChance: 2, durationUnits: 30 },
];

const makeLive = (residents: ResidentState[], overrides?: Partial<PlannerLiveState>): PlannerLiveState => ({
  residentsById: Object.fromEntries(residents.map((r) => [r.id, r])),
  slots: [
    { id: 's1', required: true },
    { id: 's2', required: false },
  ],
  itemCatalog: { sword, draught },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Pure ops
// ---------------------------------------------------------------------------

describe('missionPlannerDraft ops', () => {
  it('assign/remove/loadout are pure and reversible', () => {
    const d0 = emptyMissionPlannerDraft();
    const d1 = assignResident(d0, 's1', 'r1');
    expect(d0.assignments).toEqual({}); // untouched (immutability)
    const d2 = setLoadoutItem(d1, 'r1', 'weapon', 'sword');
    expect(d2.loadouts.r1).toEqual({ weapon: 'sword' });
    // A resident cannot occupy two slots — re-assign moves it.
    const d3 = assignResident(d2, 's2', 'r1');
    expect(d3.assignments).toEqual({ s2: 'r1' });
    expect(d3.loadouts.r1).toEqual({ weapon: 'sword' });
    const d4 = removeMember(d3, 's2');
    expect(d4).toEqual(d0);
  });

  it('drops loadout when the member is removed, and clears qty<=0 consumables', () => {
    let d = assignResident(emptyMissionPlannerDraft(), 's1', 'r1');
    d = setLoadoutItem(d, 'r1', 'weapon', 'sword');
    d = setConsumableQty(d, 'draught', 2);
    d = setConsumableQty(d, 'draught', 0);
    expect(d.consumables).toEqual({});
    // loadout edit on a non-drafted resident is a no-op
    expect(setLoadoutItem(d, 'ghost', 'weapon', 'sword')).toBe(d);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validateDraft', () => {
  const live = makeLive([makeResident('r1')]);

  it('rejects empty required slots', () => {
    const v = validateDraft(emptyMissionPlannerDraft(), live);
    expect(v.canEmbark).toBe(false);
    expect(v.issues).toContainEqual({ reason: 'EMPTY_REQUIRED_SLOT', slotId: 's1' });
  });

  it('rejects a drafted resident missing from the live roster', () => {
    const d = assignResident(emptyMissionPlannerDraft(), 's1', 'ghost');
    const v = validateDraft(d, live);
    expect(v.canEmbark).toBe(false);
    expect(v.invalidatedResidentIds).toEqual(['ghost']);
    expect(v.issues).toContainEqual({ reason: 'RESIDENT_MISSING', residentId: 'ghost' });
  });

  it('rejects unknown items, slot mismatches and over-stock consumables', () => {
    let d = assignResident(emptyMissionPlannerDraft(), 's1', 'r1');
    d = setLoadoutItem(d, 'r1', 'weapon', 'nope');
    expect(validateDraft(d, live).issues).toContainEqual(
      expect.objectContaining({ reason: 'ITEM_UNKNOWN', itemId: 'nope' }),
    );
    d = setLoadoutItem(d, 'r1', 'armor', 'sword'); // weapon item in armor slot
    expect(validateDraft(d, live).issues).toContainEqual(
      expect.objectContaining({ reason: 'ITEM_SLOT_MISMATCH', itemId: 'sword' }),
    );
    d = setConsumableQty(d, 'draught', 5); // stock is 2
    expect(validateDraft(d, live).issues).toContainEqual(
      expect.objectContaining({ reason: 'CONSUMABLE_OVER_STOCK', itemId: 'draught' }),
    );
    d = setConsumableQty(d, 'sword', 1); // equipment as consumable
    expect(validateDraft(d, live).issues).toContainEqual(
      expect.objectContaining({ reason: 'ITEM_UNKNOWN', itemId: 'sword' }),
    );
  });
});

// ---------------------------------------------------------------------------
// Launch contract
// ---------------------------------------------------------------------------

describe('buildLaunchPayload', () => {
  const live = makeLive([makeResident('r1')]);

  it('rejects invalid drafts atomically, with reasons', () => {
    const res = buildLaunchPayload(emptyMissionPlannerDraft(), live, 'q1');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues).toContainEqual(
        expect.objectContaining({ reason: 'EMPTY_REQUIRED_SLOT' }),
      );
    }
  });

  it('emits the typed payload when the draft is valid', () => {
    let d = assignResident(emptyMissionPlannerDraft(), 's1', 'r1');
    d = setLoadoutItem(d, 'r1', 'weapon', 'sword');
    d = setConsumableQty(d, 'draught', 1);
    const res = buildLaunchPayload(d, live, 'q1');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.questId).toBe('q1');
      expect(res.payload.party).toEqual([
        { residentId: 'r1', slotId: 's1', loadout: { weapon: 'sword' } },
      ]);
      expect(res.payload.consumables).toEqual([{ itemId: 'draught', qty: 1 }]);
    }
  });
});

// ---------------------------------------------------------------------------
// Draft → engine + delta
// ---------------------------------------------------------------------------

describe('toMissionDraft / diffOutcomes', () => {
  const live = makeLive([makeResident('r1')]);

  it('maps assignments to members with canonical slotIndex and slot penalties', () => {
    const d = assignResident(emptyMissionPlannerDraft(), 's1', 'r1');
    const md = toMissionDraft(d, live, phases);
    expect(md.members).toHaveLength(1);
    expect(md.members[0].slotIndex).toBe(0);
    expect(md.members[0].resident.id).toBe('r1');
  });

  it('aggregates empty required-slot penalties into the engine input', () => {
    const liveWithPenalty = makeLive([makeResident('r1')], {
      slots: [
        { id: 's1', required: true, emptyPenalty: { extraDeathChance: 5 } },
        { id: 's2', required: false },
      ],
    });
    const md = toMissionDraft(emptyMissionPlannerDraft(), liveWithPenalty, phases);
    expect(md.emptySlotPenalty).toEqual({ deathChanceDelta: 5, injuryChanceDelta: 0 });
  });

  it('diffOutcomes returns null without a previous snapshot', () => {
    const d = assignResident(emptyMissionPlannerDraft(), 's1', 'r1');
    const preview = questOutcomeDistribution(toMissionDraft(d, live, phases));
    expect(diffOutcomes(null, preview)).toBeNull();
    const deltas = diffOutcomes(preview, preview);
    expect(deltas?.success).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// React context — acceptance criteria
// ---------------------------------------------------------------------------

/** Harness with a mutable live-state holder: mutation + rerender simulates a live change. */
function makeHarness(live: PlannerLiveState) {
  const holder = { live };
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MissionPlannerProvider live={holder.live} phases={phases} questId="q_test">
      {children}
    </MissionPlannerProvider>
  );
  return { holder, Wrapper };
}

describe('MissionPlannerProvider', () => {
  it('starts empty: required-slot issue, no delta on first render', () => {
    const h = makeHarness(makeLive([makeResident('r1')]));
    const { result } = renderHook(() => useMissionPlannerDraft(), { wrapper: h.Wrapper });
    expect(result.current.canEmbark).toBe(false);
    expect(result.current.deltas).toBeNull();
    expect(result.current.canUndo).toBe(false);
  });

  it('acceptance: palindrome — assign → undo restores identical outcome', () => {
    const h = makeHarness(makeLive([makeResident('r1'), makeResident('r2')]));
    const { result } = renderHook(() => useMissionPlannerDraft(), { wrapper: h.Wrapper });
    const baselineSerialized = serializeOutcome(result.current.preview!);

    act(() => result.current.assignResident('s1', 'r1'));
    const filled = serializeOutcome(result.current.preview!);
    expect(filled).not.toBe(baselineSerialized);
    expect(result.current.canEmbark).toBe(true);

    act(() => result.current.undo());
    expect(serializeOutcome(result.current.preview!)).toBe(baselineSerialized);
    expect(result.current.canEmbark).toBe(false);

    // Redo path: assign → edit → reset restores the baseline too.
    act(() => result.current.assignResident('s1', 'r1'));
    act(() => result.current.setLoadoutItem('r1', 'weapon', 'sword'));
    act(() => result.current.setConsumableQty('draught', 1));
    act(() => result.current.reset());
    expect(serializeOutcome(result.current.preview!)).toBe(baselineSerialized);
    expect(result.current.canReset).toBe(false);
  });

  it('exposes deltas vs the previous preview after a change', () => {
    const h = makeHarness(makeLive([makeResident('r1')]));
    const { result } = renderHook(() => useMissionPlannerDraft(), { wrapper: h.Wrapper });
    expect(result.current.deltas).toBeNull();
    act(() => result.current.assignResident('s1', 'r1'));
    expect(result.current.deltas).not.toBeNull();
    expect(result.current.deltas!.success).toBeGreaterThan(0);
    act(() => result.current.setLoadoutItem('r1', 'weapon', 'sword'));
    expect(result.current.deltas!.success).toBeGreaterThan(0);
  });

  it('acceptance: live invalidation — resident leaving blocks embark', () => {
    const h = makeHarness(makeLive([makeResident('r1')]));
    const { result, rerender } = renderHook(() => useMissionPlannerDraft(), { wrapper: h.Wrapper });
    act(() => result.current.assignResident('s1', 'r1'));
    expect(result.current.canEmbark).toBe(true);

    // The resident departs while the panel is open.
    h.holder.live = makeLive([]);
    rerender();

    expect(result.current.canEmbark).toBe(false);
    expect(result.current.invalidatedResidentIds).toEqual(['r1']);
    expect(result.current.issues).toContainEqual(
      expect.objectContaining({ reason: 'RESIDENT_MISSING', residentId: 'r1' }),
    );
    expect(result.current.buildLaunchPayload().ok).toBe(false);
  });

  it('acceptance: invalid launch payload carries reasons', () => {
    const h = makeHarness(makeLive([makeResident('r1')]));
    const { result } = renderHook(() => useMissionPlannerDraft(), { wrapper: h.Wrapper });
    const res = result.current.buildLaunchPayload();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.issues.length).toBeGreaterThan(0);
  });

  it('undo history unwinds mutations in order', () => {
    const h = makeHarness(makeLive([makeResident('r1'), makeResident('r2')]));
    const { result } = renderHook(() => useMissionPlannerDraft(), { wrapper: h.Wrapper });
    act(() => result.current.assignResident('s1', 'r1'));
    const one = serializeOutcome(result.current.preview!);
    act(() => result.current.assignResident('s2', 'r2'));
    act(() => result.current.undo());
    expect(serializeOutcome(result.current.preview!)).toBe(one);
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
  });
});
