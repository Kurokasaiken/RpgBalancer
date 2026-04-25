import { describe, it, expect } from 'vitest';
import { 
  createBaseSimulatorState,
  formatGameOverLog,
  buildRecorderPlayerState,
  getCardManaCostTotals,
  deductResonanceCost,
  applyManaGrowth,
  createEmptyResonance,
} from '../stsSimulatorState';
import { DEFAULT_COMBATANTS_CONFIG } from '../../config/sts/combatantsConfig';
import type { STSSimulatorState } from '../stsSimulatorState';

describe('stsSimulatorState', () => {
  describe('createBaseSimulatorState', () => {
    it('should create base state with combatants config', () => {
      const state = createBaseSimulatorState(
        'starter_deck',
        'tutorial',
        12345,
        DEFAULT_COMBATANTS_CONFIG
      );

      expect(state.deckId).toBe('starter_deck');
      expect(state.enemyId).toBe('tutorial');
      expect(state.seed).toBe(12345);
      expect(state.runId).toBeNull();
      expect(state.isRunning).toBe(false);
      expect(state.result).toBeNull();

      // Check combatant states
      expect(state.playerState).toEqual({
        hp: 0,
        armor: 0,
        buffs: [],
      });
      expect(state.enemyState).toEqual({
        hp: 0,
        armor: 0,
        buffs: [],
      });

      // Check resonance
      expect(state.resonance).toEqual({
        alteration: 0,
        bio: 0,
        wave: 0,
        entropy: 0,
      });

      // Check combatants config
      expect(state.combatantsConfig).toEqual(DEFAULT_COMBATANTS_CONFIG);
      expect(state.predictedIntents).toEqual([]);
      expect(state.lastEnemyIntent).toBeNull();
    });

    it('should initialize with empty arrays and objects', () => {
      const state = createBaseSimulatorState(
        'test_deck',
        'test_enemy',
        999,
        DEFAULT_COMBATANTS_CONFIG
      );

      expect(state.hand).toEqual([]);
      expect(state.log).toEqual([]);
      expect(state.turnLogs).toEqual([]);
      expect(state.playerState.buffs).toEqual([]);
      expect(state.enemyState.buffs).toEqual([]);
    });
  });

  describe('formatGameOverLog', () => {
    it('should format game over log with player and enemy HP', () => {
      const mockState: STSSimulatorState = {
        ...createBaseSimulatorState('deck', 'enemy', 1, DEFAULT_COMBATANTS_CONFIG),
        playerState: { hp: 25, armor: 5, buffs: [] },
        enemyState: { hp: 0, armor: 0, buffs: [] },
        turnNumber: 15,
      };

      const log = formatGameOverLog(mockState, 'victory');

      expect(log).toContain('=== Game Over ===');
      expect(log).toContain('Result: victory');
      expect(log).toContain('Final HP: Player 25, Enemy 0');
      expect(log).toContain('Total Turns: 15');
    });

    it('should handle defeat state', () => {
      const mockState: STSSimulatorState = {
        ...createBaseSimulatorState('deck', 'enemy', 1, DEFAULT_COMBATANTS_CONFIG),
        playerState: { hp: 0, armor: 0, buffs: [] },
        enemyState: { hp: 50, armor: 10, buffs: [] },
        turnNumber: 8,
      };

      const log = formatGameOverLog(mockState, 'defeat');

      expect(log).toContain('Result: defeat');
      expect(log).toContain('Final HP: Player 0, Enemy 50');
    });

    it('should handle timeout state', () => {
      const mockState: STSSimulatorState = {
        ...createBaseSimulatorState('deck', 'enemy', 1, DEFAULT_COMBATANTS_CONFIG),
        playerState: { hp: 75, armor: 15, buffs: [] },
        enemyState: { hp: 80, armor: 20, buffs: [] },
        turnNumber: 50,
      };

      const log = formatGameOverLog(mockState, 'timeout');

      expect(log).toContain('Result: timeout');
      expect(log).toContain('Final HP: Player 75, Enemy 80');
    });
  });

  describe('buildRecorderPlayerState', () => {
    it('should build player state snapshot for recorder', () => {
      const mockState: STSSimulatorState = {
        ...createBaseSimulatorState('deck', 'enemy', 1, DEFAULT_COMBATANTS_CONFIG),
        playerState: { hp: 60, armor: 10, buffs: [] },
        resonance: {
          alteration: 5,
          bio: 3,
          wave: 2,
          entropy: 1,
        },
        inspiration: 7,
        hand: [
          { card: { name: 'Test Card' } as any, index: 1 },
          { card: { name: 'Test Card 2' } as any, index: 2 },
        ],
      };

      const playerState = buildRecorderPlayerState(mockState);

      expect(playerState).toEqual({
        hp: 60,
        resonance: {
          alteration: 5,
          bio: 3,
          wave: 2,
          entropy: 1,
        },
        inspiration: 7,
        handSize: 2,
      });
    });

    it('should handle empty hand', () => {
      const mockState: STSSimulatorState = {
        ...createBaseSimulatorState('deck', 'enemy', 1, DEFAULT_COMBATANTS_CONFIG),
        playerState: { hp: 100, armor: 0, buffs: [] },
        resonance: createEmptyResonance(),
        inspiration: 0,
        hand: [],
      };

      const playerState = buildRecorderPlayerState(mockState);

      expect(playerState.handSize).toBe(0);
    });
  });

  describe('getCardManaCostTotals', () => {
    it('should calculate mana cost totals correctly', () => {
      const manaCost = {
        alteration: 2,
        bio: 1,
        wave: 0,
        entropy: 1,
      };

      const resonance = {
        alteration: 3,
        bio: 2,
        wave: 1,
        entropy: 0,
      };

      const totals = getCardManaCostTotals(manaCost, resonance);

      expect(totals.totalCost).toBe(4);
      expect(totals.resonanceContribution).toBe(3); // alteration(2) + bio(1) + wave(0) + entropy(0)
      expect(totals.inspirationCost).toBe(1); // 4 - 3 = 1
    });

    it('should handle zero cost cards', () => {
      const manaCost = {};
      const resonance = createEmptyResonance();

      const totals = getCardManaCostTotals(manaCost, resonance);

      expect(totals.totalCost).toBe(0);
      expect(totals.resonanceContribution).toBe(0);
      expect(totals.inspirationCost).toBe(0);
    });

    it('should handle insufficient resonance', () => {
      const manaCost = {
        alteration: 5,
        bio: 3,
        wave: 2,
        entropy: 2,
      };

      const resonance = {
        alteration: 2,
        bio: 1,
        wave: 0,
        entropy: 0,
      };

      const totals = getCardManaCostTotals(manaCost, resonance);

      expect(totals.totalCost).toBe(12);
      expect(totals.resonanceContribution).toBe(3); // Only what's available
      expect(totals.inspirationCost).toBe(9); // 12 - 3 = 9
    });
  });

  describe('deductResonanceCost', () => {
    it('should deduct mana cost from resonance', () => {
      const resonance = {
        alteration: 5,
        bio: 3,
        wave: 2,
        entropy: 1,
      };

      const manaCost = {
        alteration: 2,
        bio: 1,
        wave: 1,
        entropy: 0,
      };

      const result = deductResonanceCost(resonance, manaCost);

      expect(result).toEqual({
        alteration: 3,
        bio: 2,
        wave: 1,
        entropy: 1,
      });
    });

    it('should not go below zero', () => {
      const resonance = {
        alteration: 1,
        bio: 0,
        wave: 0,
        entropy: 0,
      };

      const manaCost = {
        alteration: 2,
        bio: 1,
        wave: 1,
        entropy: 1,
      };

      const result = deductResonanceCost(resonance, manaCost);

      expect(result).toEqual({
        alteration: 0,
        bio: 0,
        wave: 0,
        entropy: 0,
      });
    });

    it('should handle empty mana cost', () => {
      const resonance = {
        alteration: 5,
        bio: 3,
        wave: 2,
        entropy: 1,
      };

      const manaCost = {};

      const result = deductResonanceCost(resonance, manaCost);

      expect(result).toEqual(resonance);
    });
  });

  describe('applyManaGrowth', () => {
    it('should apply mana growth values', () => {
      const resonance = {
        alteration: 2,
        bio: 1,
        wave: 0,
        entropy: 1,
      };

      const growth = {
        alteration: 1,
        bio: 2,
        wave: 1,
      };

      const result = applyManaGrowth(resonance, growth);

      expect(result).toEqual({
        alteration: 3,
        bio: 3,
        wave: 1,
        entropy: 1,
      });
    });

    it('should handle zero growth values', () => {
      const resonance = {
        alteration: 5,
        bio: 3,
        wave: 2,
        entropy: 1,
      };

      const growth = {};

      const result = applyManaGrowth(resonance, growth);

      expect(result).toEqual(resonance);
    });

    it('should handle empty resonance', () => {
      const resonance = createEmptyResonance();

      const growth = {
        alteration: 1,
        bio: 1,
        wave: 1,
        entropy: 1,
      };

      const result = applyManaGrowth(resonance, growth);

      expect(result).toEqual({
        alteration: 1,
        bio: 1,
        wave: 1,
        entropy: 1,
      });
    });
  });

  describe('createEmptyResonance', () => {
    it('should create empty resonance bucket', () => {
      const resonance = createEmptyResonance();

      expect(resonance).toEqual({
        alteration: 0,
        bio: 0,
        wave: 0,
        entropy: 0,
      });
    });

    it('should have all mana types', () => {
      const resonance = createEmptyResonance();

      expect(Object.keys(resonance)).toHaveLength(4);
      expect(resonance).toHaveProperty('alteration');
      expect(resonance).toHaveProperty('bio');
      expect(resonance).toHaveProperty('wave');
      expect(resonance).toHaveProperty('entropy');
    });
  });
});
