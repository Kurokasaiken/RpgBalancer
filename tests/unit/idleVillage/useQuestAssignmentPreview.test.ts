import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuestAssignmentPreview } from '@/ui/idleVillage/hooks/useQuestAssignmentPreview';
import { DEFAULT_QUEST_POWER_RULES } from '@/engine/game/idleVillage/QuestPowerEngine';
import { MOCK_QUEST_ITEMS } from '@/balancing/config/idleVillage/quests/questItemsMock';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

const baseActivity: ActivityDefinition = {
  id: 'q_test',
  label: 'Test Quest',
  tags: ['quest'],
  slotTags: ['world_quest'],
  resolutionEngineId: 'quest_dispatch',
  level: 1,
  dangerRating: 0,
};

const makeResident = (overrides?: Partial<ResidentState>): ResidentState => ({
  id: 'r1',
  displayName: 'Test Hero',
  status: 'available',
  fatigue: 0,
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  statSnapshot: { hp: 100, damage: 10 },
  ...overrides,
});

const makeSlot = (overrides?: Partial<ResidentSlotViewModel>): ResidentSlotViewModel => ({
  id: 'slot-1',
  index: 0,
  label: 'Slot 1',
  assignedResidentId: null,
  isPlaceholder: false,
  dropState: 'idle',
  bloomState: 'idle',
  status: 'empty',
  telemetryTags: [],
  ...overrides,
});

describe('useQuestAssignmentPreview', () => {
  it('blocks embark when a required slot is empty', () => {
    const slots = [makeSlot({ required: true, label: 'Guerriero' })];
    const { result } = renderHook(() => useQuestAssignmentPreview(baseActivity, slots, DEFAULT_QUEST_POWER_RULES));

    expect(result.current.canEmbark).toBe(false);
    expect(result.current.blockingReasons).toContain('Guerriero è obbligatorio ed è vuoto.');
    expect(result.current.partyPower).toBe(0);
  });

  it('allows embark when all required slots are filled', () => {
    const resident = makeResident({ id: 'r1' });
    const slots = [
      makeSlot({
        required: true,
        label: 'Guerriero',
        assignedResidentId: resident.id,
        assignedResident: resident,
      }),
    ];
    const { result } = renderHook(() => useQuestAssignmentPreview(baseActivity, slots, DEFAULT_QUEST_POWER_RULES));

    expect(result.current.canEmbark).toBe(true);
    expect(result.current.blockingReasons).toHaveLength(0);
    expect(result.current.partyPower).toBeGreaterThan(0);
    expect(result.current.powerRatio).toBeGreaterThan(0);
  });

  it('applies empty required slot penalties', () => {
    const slots = [
      makeSlot({
        required: true,
        label: 'Guerriero',
        emptyPenalty: { partyPowerMult: 0.5, extraDeathChance: 5, extraInjuryChance: 10 },
      }),
    ];
    const { result } = renderHook(() => useQuestAssignmentPreview(baseActivity, slots, DEFAULT_QUEST_POWER_RULES));

    expect(result.current.canEmbark).toBe(false);
    expect(result.current.projectedDeathChance).toBeGreaterThan(0);
    expect(result.current.projectedInjuryChance).toBeGreaterThan(0);
  });

  it('applies mock item deltas', () => {
    const resident = makeResident({ statSnapshot: { hp: 1000, damage: 100 } });
    const slots = [
      makeSlot({
        required: true,
        label: 'Guerriero',
        assignedResidentId: resident.id,
        assignedResident: resident,
      }),
    ];

    const { result: withoutItems } = renderHook(() => useQuestAssignmentPreview(baseActivity, slots, DEFAULT_QUEST_POWER_RULES));
    const { result: withBandages } = renderHook(() =>
      useQuestAssignmentPreview(baseActivity, slots, DEFAULT_QUEST_POWER_RULES, [MOCK_QUEST_ITEMS[1]])
    );

    expect(withBandages.current.projectedInjuryChance).toBeLessThan(withoutItems.current.projectedInjuryChance);
    expect(withBandages.current.projectedDeathChance).toBe(withoutItems.current.projectedDeathChance);
  });

  it('clamps projected chances to 0-100', () => {
    const resident = makeResident({ isInjured: true, fatigue: 1000, isHero: true });
    const slots = [
      makeSlot({
        required: true,
        label: 'Guerriero',
        assignedResidentId: resident.id,
        assignedResident: resident,
      }),
    ];
    const { result } = renderHook(() => useQuestAssignmentPreview(baseActivity, slots, DEFAULT_QUEST_POWER_RULES));

    expect(result.current.projectedDeathChance).toBeGreaterThanOrEqual(0);
    expect(result.current.projectedDeathChance).toBeLessThanOrEqual(100);
    expect(result.current.projectedInjuryChance).toBeGreaterThanOrEqual(0);
    expect(result.current.projectedInjuryChance).toBeLessThanOrEqual(100);
  });
});
