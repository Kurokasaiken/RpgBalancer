import { describe, it, expect, vi } from 'vitest';

import { resolveModifiers } from '../../../src/balancing/modifiers/gameplayModifierEngine';
import type { GameplayModifier, ModifierScope, ScopeResolutionSnapshot } from '../../../src/balancing/types/gameplayModifierTypes';

const BASE_STAT: GameplayModifier['statId'] = 'stat_core_focus';

let idCounter = 0;
function createModifier(overrides: Partial<GameplayModifier>): GameplayModifier {
  idCounter += 1;
  return {
    id: overrides.id ?? `mod_test_${idCounter}`,
    statId: BASE_STAT,
    operation: overrides.operation ?? 'ADD',
    scope: overrides.scope ?? 'GLOBAL',
    value: overrides.value ?? 0,
    mode: overrides.mode,
    maxStacks: overrides.maxStacks ?? 1,
    stackCount: overrides.stackCount ?? 1,
    refreshPolicy: overrides.refreshPolicy ?? 'RESET_DURATION',
    conditions: overrides.conditions,
    lifetime: overrides.lifetime,
    owner:
      overrides.owner ?? ({ type: 'system', id: 'test_owner', label: 'Test Owner' } as const),
    metadata: overrides.metadata,
    sourceConfigId: overrides.sourceConfigId ?? 'tests.unit.gameplayModifierEngine',
    phaseId: overrides.phaseId,
  } satisfies GameplayModifier;
}

describe('gameplayModifierEngine.resolveModifiers', () => {
  it('applies additive/multiplicative stacking per scope order', () => {
    const modifiers: GameplayModifier[] = [
      createModifier({ id: 'global_add', scope: 'GLOBAL', operation: 'ADD', value: 10 }),
      createModifier({ id: 'global_mult', scope: 'GLOBAL', operation: 'MULT', value: 0.1 }),
      createModifier({ id: 'session_add', scope: 'SESSION', operation: 'ADD', value: 5 }),
      createModifier({ id: 'session_mult', scope: 'SESSION', operation: 'MULT', value: 0.5 }),
      createModifier({ id: 'location_set', scope: 'LOCATION', operation: 'SET', value: 50 }),
      createModifier({ id: 'quest_add', scope: 'QUEST', operation: 'ADD', value: 20 }),
    ];

    const result = resolveModifiers({ statId: BASE_STAT, baseValue: 100, modifiers });

    expect(result.finalValue).toBeCloseTo(70);
    expect(
      result.breakdown.find((entry: ScopeResolutionSnapshot) => entry.scope === 'GLOBAL')?.
        appliedModifierIds,
    ).toEqual([
      'global_add',
      'global_mult',
    ]);
    expect(
      result.breakdown.find((entry: ScopeResolutionSnapshot) => entry.scope === 'QUEST')?.
        appliedModifierIds,
    ).toEqual([
      'quest_add',
    ]);
  });

  it('enforces max stack count when stackCount exceeds limit', () => {
    const modifiers: GameplayModifier[] = [
      createModifier({
        id: 'resident_stack',
        scope: 'RESIDENT',
        operation: 'ADD',
        value: 5,
        stackCount: 5,
        maxStacks: 2,
      }),
    ];

    const result = resolveModifiers({ statId: BASE_STAT, baseValue: 10, modifiers });

    expect(result.finalValue).toBe(20); // 10 + (5 * 2)
  });

  it('filters modifiers via tags, resident, location, quest phase, and lifetime', () => {
    const modifiers: GameplayModifier[] = [
      createModifier({
        id: 'tag_match',
        scope: 'GLOBAL',
        operation: 'ADD',
        value: 10,
        conditions: { tags: ['barracks'] },
      }),
      createModifier({
        id: 'resident_match',
        scope: 'GLOBAL',
        operation: 'ADD',
        value: 20,
        conditions: { residentIds: ['resident_a'] },
      }),
      createModifier({
        id: 'location_match',
        scope: 'GLOBAL',
        operation: 'ADD',
        value: 30,
        conditions: { locationIds: ['slot_01'] },
      }),
      createModifier({
        id: 'phase_match',
        scope: 'GLOBAL',
        operation: 'ADD',
        value: 40,
        phaseId: 'quest_phase_a',
      }),
      createModifier({
        id: 'expired',
        scope: 'GLOBAL',
        operation: 'ADD',
        value: 999,
        lifetime: { type: 'TIMED', expiresAt: 5 },
      }),
    ];

    const result = resolveModifiers({
      statId: BASE_STAT,
      baseValue: 0,
      modifiers,
      context: {
        statId: BASE_STAT,
        tags: ['barracks'],
        residentId: 'resident_a',
        locationId: 'slot_01',
        questPhaseId: 'quest_phase_a',
        currentTick: 10,
      },
    });

    expect(result.finalValue).toBe(100);
    expect(result.breakdown[0]?.appliedModifierIds).not.toContain('expired');
  });

  it('supports scopeFilter and deterministic modifier sorting', () => {
    const modifiers: GameplayModifier[] = [
      createModifier({ id: 'later', scope: 'RESIDENT', operation: 'ADD', value: 5 }),
      createModifier({ id: 'earlier', scope: 'RESIDENT', operation: 'ADD', value: 7 }),
      createModifier({ id: 'global_one', scope: 'GLOBAL', operation: 'ADD', value: 2 }),
    ];

    const scopes: ModifierScope[] = ['RESIDENT', 'GLOBAL', 'GLOBAL'];

    const result = resolveModifiers({
      statId: BASE_STAT,
      baseValue: 0,
      modifiers,
      scopeFilter: scopes,
    });

    expect(result.breakdown).toHaveLength(2);
    const residentEntry = result.breakdown[0];
    expect(residentEntry.scope).toBe('RESIDENT');
    expect(residentEntry.appliedModifierIds).toEqual(['earlier', 'later']);
  });

  it('invokes onModifierApplied callback for telemetry hooks', () => {
    const onModifierApplied = vi.fn();
    const modifiers: GameplayModifier[] = [
      createModifier({ id: 'global_add', scope: 'GLOBAL', operation: 'ADD', value: 3 }),
      createModifier({ id: 'session_mult', scope: 'SESSION', operation: 'MULT', value: 0.5 }),
    ];

    resolveModifiers({
      statId: BASE_STAT,
      baseValue: 10,
      modifiers,
      context: { statId: BASE_STAT, tags: ['test'] },
      onModifierApplied,
    });

    expect(onModifierApplied).toHaveBeenCalledTimes(2);
    expect(onModifierApplied).toHaveBeenCalledWith(
      expect.objectContaining({
        modifier: expect.objectContaining({ id: 'global_add' }),
        scope: 'GLOBAL',
        valueBefore: 10,
        valueAfter: 13,
      }),
    );
  });
});
