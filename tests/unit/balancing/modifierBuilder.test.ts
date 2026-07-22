import { describe, it, expect } from 'vitest';

import {
  ModifierBuilder,
  ModifierBuilderError,
  createModifierBuilder,
  defaultBuilderConfig,
} from '../../../src/balancing/modifiers/modifierBuilder';
import type { GameplayModifier } from '../../../src/balancing/types/gameplayModifierTypes';

describe('ModifierBuilder', () => {
  it('builds a valid modifier with the fluent API', () => {
    const modifier = new ModifierBuilder(defaultBuilderConfig)
      .forStat('stat_core_focus')
      .add(5)
      .inScope('LOCATION')
      .ownedBy('building', 'barracks', 'Barracks')
      .fromConfig('idleVillage.modifiers.barracksLvl1')
      .withLifetime('SESSION')
      .withTags('barracks')
      .build();

    expect(modifier.id).toBe('mod_building_barracks_stat_core_focus_ADD');
    expect(modifier.statId).toBe('stat_core_focus');
    expect(modifier.operation).toBe('ADD');
    expect(modifier.scope).toBe('LOCATION');
    expect(modifier.value).toBe(5);
    expect(modifier.mode).toBe('ADDITIVE');
    expect(modifier.maxStacks).toBe(1);
    expect(modifier.refreshPolicy).toBe('RESET_DURATION');
    expect(modifier.lifetime).toEqual({ type: 'SESSION' });
    expect(modifier.conditions?.tags).toContain('barracks');
    expect(modifier.owner).toEqual({ type: 'building', id: 'barracks', label: 'Barracks' });
    expect(modifier.sourceConfigId).toBe('idleVillage.modifiers.barracksLvl1');
  });

  it('creates builder through factory', () => {
    const modifier = createModifierBuilder()
      .forStat('stat_risk_injury')
      .multiply(0.25)
      .inScope('QUEST')
      .ownedBy('quest', 'trial_fire', 'Trial of Fire')
      .fromConfig('quests.trial_fire.phase_fog')
      .withLifetime('TIMED', 3)
      .withPhaseId('trial_fire_phase_fog')
      .build();

    expect(modifier.operation).toBe('MULT');
    expect(modifier.value).toBe(0.25);
    expect(modifier.mode).toBe('MULTIPLICATIVE');
    expect(modifier.lifetime).toEqual({ type: 'TIMED', durationTicks: 3 });
    expect(modifier.phaseId).toBe('trial_fire_phase_fog');
  });

  it('supports set operation', () => {
    const modifier = new ModifierBuilder()
      .forStat('stat_core_focus')
      .set(10)
      .inScope('GLOBAL')
      .ownedBy('system', 'override', 'Override')
      .fromConfig('test.override')
      .build();

    expect(modifier.operation).toBe('SET');
    expect(modifier.value).toBe(10);
    expect(modifier.mode).toBe('OVERRIDE');
  });

  it('supports fromModifier cloning', () => {
    const base: GameplayModifier = {
      id: 'mod_base',
      statId: 'stat_core_focus',
      operation: 'ADD',
      scope: 'LOCATION',
      value: 2,
      maxStacks: 1,
      refreshPolicy: 'RESET_DURATION',
      owner: { type: 'building', id: 'base', label: 'Base' },
      sourceConfigId: 'test.base',
    };

    const modifier = ModifierBuilder.fromModifier(base)
      .withId('mod_cloned')
      .add(7)
      .build();

    expect(modifier.id).toBe('mod_cloned');
    expect(modifier.value).toBe(7);
    expect(modifier.sourceConfigId).toBe('test.base');
  });

  it('throws when required fields are missing', () => {
    expect(() => new ModifierBuilder().build()).toThrow(ModifierBuilderError);
  });

  it('throws on invalid statId pattern', () => {
    expect(() =>
      new ModifierBuilder()
        .forStat('invalidStatId' as any)
        .add(1)
        .inScope('GLOBAL')
        .ownedBy('system', 'test', 'Test')
        .fromConfig('test.config')
        .build(),
    ).toThrow(ModifierBuilderError);
  });

  it('throws on TIMED lifetime without durationTicks', () => {
    expect(() =>
      new ModifierBuilder()
        .forStat('stat_core_focus')
        .add(1)
        .inScope('GLOBAL')
        .ownedBy('system', 'test', 'Test')
        .fromConfig('test.config')
        .withLifetime('TIMED')
        .build(),
    ).toThrow(ModifierBuilderError);
  });
});
