import { describe, it, expect, beforeEach } from 'vitest';

import {
  registerModifiers,
  getAllRegisteredModifiers,
  getModifiersByScope,
  getModifiersByStat,
  resolveStatGraph,
  DEFAULT_IDLE_VILLAGE_MODIFIERS,
} from '../../../src/balancing/config/idleVillage/gameplayModifierRegistry';
import type { GameplayModifier, ModifierScope, GameplayStatId } from '../../../src/balancing/types/gameplayModifierTypes';

describe('gameplayModifierRegistry', () => {
  beforeEach(() => {
    // Reset registry to default state before each test
    registerModifiers(DEFAULT_IDLE_VILLAGE_MODIFIERS, { merge: false });
  });

  describe('registerModifiers', () => {
    it('registers modifiers and returns all registered modifiers', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_test_1',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      const result = registerModifiers(testModifiers);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mod_test_1');
    });

    it('replaces existing modifiers when merge is false', () => {
      const initialModifiers: GameplayModifier[] = [
        {
          id: 'mod_initial',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 5,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(initialModifiers);

      const newModifiers: GameplayModifier[] = [
        {
          id: 'mod_new',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 20,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      const result = registerModifiers(newModifiers, { merge: false });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mod_new');
    });

    it('merges modifiers when merge is true', () => {
      const initialModifiers: GameplayModifier[] = [
        {
          id: 'mod_initial',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 5,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(initialModifiers);

      const newModifiers: GameplayModifier[] = [
        {
          id: 'mod_new',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 20,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      const result = registerModifiers(newModifiers, { merge: true });

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.id)).toContain('mod_initial');
      expect(result.map((m) => m.id)).toContain('mod_new');
    });

    it('updates existing modifier by ID when merging', () => {
      const initialModifiers: GameplayModifier[] = [
        {
          id: 'mod_shared',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 5,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(initialModifiers);

      const updatedModifiers: GameplayModifier[] = [
        {
          id: 'mod_shared',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 15,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      const result = registerModifiers(updatedModifiers, { merge: true });

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(15);
    });
  });

  describe('getAllRegisteredModifiers', () => {
    it('returns a clone of all registered modifiers', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_test_1',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const result1 = getAllRegisteredModifiers();
      const result2 = getAllRegisteredModifiers();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('returns empty array when no modifiers registered', () => {
      registerModifiers([], { merge: false });
      const result = getAllRegisteredModifiers();
      expect(result).toEqual([]);
    });
  });

  describe('getModifiersByScope', () => {
    it('returns modifiers scoped by the provided bucket', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_global',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
        {
          id: 'mod_location',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'LOCATION',
          value: 5,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const globalModifiers = getModifiersByScope('GLOBAL');
      const locationModifiers = getModifiersByScope('LOCATION');

      expect(globalModifiers).toHaveLength(1);
      expect(globalModifiers[0].id).toBe('mod_global');
      expect(locationModifiers).toHaveLength(1);
      expect(locationModifiers[0].id).toBe('mod_location');
    });

    it('filters by stat when statId is provided', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_focus',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
        {
          id: 'mod_hp',
          statId: 'stat_core_hp' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 20,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const focusModifiers = getModifiersByScope('GLOBAL', 'stat_core_focus' as GameplayStatId);

      expect(focusModifiers).toHaveLength(1);
      expect(focusModifiers[0].id).toBe('mod_focus');
    });

    it('returns empty array for scope with no modifiers', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_global',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const questModifiers = getModifiersByScope('QUEST');

      expect(questModifiers).toEqual([]);
    });

    it('returns clones of modifiers', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_test',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const result1 = getModifiersByScope('GLOBAL');
      const result2 = getModifiersByScope('GLOBAL');

      expect(result1).not.toBe(result2);
      expect(result1[0]).not.toBe(result2[0]);
      expect(result1).toEqual(result2);
    });
  });

  describe('getModifiersByStat', () => {
    it('returns modifiers targeting a specific stat across all scopes', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_global_focus',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
        {
          id: 'mod_location_focus',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'LOCATION',
          value: 5,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
        {
          id: 'mod_global_hp',
          statId: 'stat_core_hp' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 20,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const focusModifiers = getModifiersByStat('stat_core_focus' as GameplayStatId);

      expect(focusModifiers).toHaveLength(2);
      expect(focusModifiers.map((m) => m.id)).toContain('mod_global_focus');
      expect(focusModifiers.map((m) => m.id)).toContain('mod_location_focus');
    });

    it('filters by scopes when scopes array is provided', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_global_focus',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
        {
          id: 'mod_location_focus',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'LOCATION',
          value: 5,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const globalOnly = getModifiersByStat('stat_core_focus' as GameplayStatId, ['GLOBAL']);

      expect(globalOnly).toHaveLength(1);
      expect(globalOnly[0].id).toBe('mod_global_focus');
    });

    it('returns empty array for stat with no modifiers', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_focus',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const hpModifiers = getModifiersByStat('stat_core_hp' as GameplayStatId);

      expect(hpModifiers).toEqual([]);
    });

    it('returns clones of modifiers', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_test',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const result1 = getModifiersByStat('stat_core_focus' as GameplayStatId);
      const result2 = getModifiersByStat('stat_core_focus' as GameplayStatId);

      expect(result1).not.toBe(result2);
      expect(result1[0]).not.toBe(result2[0]);
      expect(result1).toEqual(result2);
    });
  });

  describe('resolveStatGraph', () => {
    it('resolves a stat graph using registered modifiers', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_global',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const result = resolveStatGraph({
        statId: 'stat_core_focus' as GameplayStatId,
        baseValue: 50,
      });

      expect(result.statId).toBe('stat_core_focus');
      expect(result.baseValue).toBe(50);
      expect(result.finalValue).toBe(60);
      expect(result.breakdown).toHaveLength(5); // All scopes evaluated
    });

    it('filters by scopes when scopes option is provided', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_global',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
        {
          id: 'mod_location',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'LOCATION',
          value: 5,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const result = resolveStatGraph({
        statId: 'stat_core_focus' as GameplayStatId,
        baseValue: 50,
        scopes: ['GLOBAL'],
      });

      expect(result.finalValue).toBe(60); // Only GLOBAL modifier applied
    });

    it('passes context to modifier evaluation', () => {
      const testModifiers: GameplayModifier[] = [
        {
          id: 'mod_conditional',
          statId: 'stat_core_focus' as GameplayStatId,
          operation: 'ADD',
          scope: 'GLOBAL',
          value: 10,
          mode: 'ADDITIVE',
          maxStacks: 1,
          refreshPolicy: 'RESET_DURATION',
          conditions: { tags: ['barracks'] },
          owner: { type: 'system', id: 'test', label: 'Test' },
          sourceConfigId: 'test.config',
        },
      ];

      registerModifiers(testModifiers);

      const resultWithTags = resolveStatGraph({
        statId: 'stat_core_focus' as GameplayStatId,
        baseValue: 50,
        context: { statId: 'stat_core_focus' as GameplayStatId, tags: ['barracks'] },
      });

      const resultWithoutTags = resolveStatGraph({
        statId: 'stat_core_focus' as GameplayStatId,
        baseValue: 50,
        context: { statId: 'stat_core_focus' as GameplayStatId, tags: [] },
      });

      expect(resultWithTags.finalValue).toBe(60);
      expect(resultWithoutTags.finalValue).toBe(50);
    });

    it('uses default modifiers from DEFAULT_IDLE_VILLAGE_MODIFIERS', () => {
      registerModifiers(DEFAULT_IDLE_VILLAGE_MODIFIERS, { merge: false });

      const result = resolveStatGraph({
        statId: 'stat_core_focus' as GameplayStatId,
        baseValue: 10,
        context: { statId: 'stat_core_focus' as GameplayStatId, tags: ['barracks'] },
      });

      // mod_barracks_discipline_aura adds 5 to focus when barracks tag is present
      expect(result.finalValue).toBe(15);
    });
  });

  describe('DEFAULT_IDLE_VILLAGE_MODIFIERS', () => {
    it('contains valid modifier definitions', () => {
      expect(DEFAULT_IDLE_VILLAGE_MODIFIERS).toBeDefined();
      expect(DEFAULT_IDLE_VILLAGE_MODIFIERS.length).toBeGreaterThan(0);

      for (const modifier of DEFAULT_IDLE_VILLAGE_MODIFIERS) {
        expect(modifier.id).toBeDefined();
        expect(modifier.statId).toBeDefined();
        expect(modifier.operation).toBeDefined();
        expect(modifier.scope).toBeDefined();
        expect(modifier.value).toBeDefined();
        expect(modifier.owner).toBeDefined();
        expect(modifier.sourceConfigId).toBeDefined();
      }
    });

    it('includes barracks discipline aura modifier', () => {
      const barracksModifier = DEFAULT_IDLE_VILLAGE_MODIFIERS.find(
        (m) => m.id === 'mod_barracks_discipline_aura',
      );

      expect(barracksModifier).toBeDefined();
      expect(barracksModifier?.statId).toBe('stat_core_focus');
      expect(barracksModifier?.operation).toBe('ADD');
      expect(barracksModifier?.scope).toBe('LOCATION');
      expect(barracksModifier?.value).toBe(5);
    });

    it('includes quest fog of dread modifier', () => {
      const questModifier = DEFAULT_IDLE_VILLAGE_MODIFIERS.find(
        (m) => m.id === 'mod_quest_fog_of_dread',
      );

      expect(questModifier).toBeDefined();
      expect(questModifier?.statId).toBe('stat_risk_injury');
      expect(questModifier?.operation).toBe('MULT');
      expect(questModifier?.scope).toBe('QUEST');
      expect(questModifier?.value).toBe(0.25);
    });
  });
});
