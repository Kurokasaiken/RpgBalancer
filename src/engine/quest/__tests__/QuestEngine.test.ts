/**
 * QuestEngine Unit Tests
 *
 * Tests for the Quest Engine with branching logic, deterministic outcomes,
 * and telemetry generation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuestEngine } from '../QuestEngine';
import type { QuestDefinition, QuestState } from '../types';

describe('QuestEngine', () => {
  let engine: QuestEngine;
  let sampleQuest: QuestDefinition;
  let initialState: QuestState;

  beforeEach(() => {
    // Use fixed seed for deterministic tests
    engine = new QuestEngine(12345);

    sampleQuest = {
      id: 'test-quest',
      title: 'Test Quest',
      description: 'A test quest for branching',
      phases: [
        {
          type: 'dialogue',
          id: 'phase-1',
          title: 'First Choice',
          description: 'Make your first choice',
          choices: [
            {
              id: 'choice-a',
              text: 'Choose path A',
              outcome: {
                nextPhaseIds: ['phase-2a'],
                effects: [],
                metadata: { choiceMade: 'A' },
              },
            },
            {
              id: 'choice-b',
              text: 'Choose path B',
              outcome: {
                nextPhaseIds: ['phase-2b'],
                effects: [],
                metadata: { choiceMade: 'B' },
              },
            },
          ],
        },
        {
          type: 'branch',
          id: 'phase-2a',
          title: 'Branch A',
          description: 'Automatic branch',
          conditions: [
            {
              type: 'random_chance',
              chance: 0.7,
              outcome: {
                nextPhaseIds: ['phase-3-success'],
                effects: [],
                metadata: { branchResult: 'success' },
              },
            },
          ],
          defaultOutcome: {
            nextPhaseIds: ['phase-3-failure'],
            effects: [],
            metadata: { branchResult: 'failure' },
          },
        },
        {
          type: 'fight',
          id: 'phase-3-success',
          title: 'Victory Fight',
          description: 'Fight after success path',
        },
        {
          type: 'fight',
          id: 'phase-3-failure',
          title: 'Defeat Fight',
          description: 'Fight after failure path',
        },
        {
          type: 'timedChoice',
          id: 'phase-2b',
          title: 'Timed Choice',
          description: 'Choose quickly!',
          choices: [
            {
              id: 'quick-choice',
              text: 'Quick decision',
              outcome: {
                nextPhaseIds: ['phase-3-alternate'],
                effects: [],
                metadata: { timedChoice: true },
              },
              timeCostSeconds: 5,
            },
          ],
          timeLimitSeconds: 30,
          timeoutOutcome: {
            nextPhaseIds: ['phase-3-timeout'],
            effects: [],
            metadata: { timedOut: true },
          },
        },
      ],
      startPhaseId: 'phase-1',
      successPhaseIds: ['phase-3-success'],
      failurePhaseIds: ['phase-3-failure', 'phase-3-timeout'],
    };

    initialState = engine.initializeQuest(sampleQuest);
  });

  describe('initializeQuest', () => {
    it('should create initial quest state', () => {
      expect(initialState.questId).toBe('test-quest');
      expect(initialState.currentPhaseId).toBe('phase-1');
      expect(initialState.completedPhaseIds).toEqual([]);
      expect(initialState.branchHistory).toEqual([]);
      expect(initialState.effectsApplied).toEqual([]);
      expect(initialState.metadata).toEqual({});
    });
  });

  describe('executePhase - Dialogue', () => {
    it('should handle dialogue choice selection', () => {
      const { newState } = engine.executePhase(sampleQuest, initialState, 'choice-a');

      expect(newState.completedPhaseIds).toContain('phase-1');
      expect(newState.currentPhaseId).toBe('phase-2a');
      expect(newState.branchHistory).toHaveLength(1);
      expect(newState.branchHistory[0].choiceId).toBe('choice-a');
      expect(newState.branchHistory[0].outcome.metadata?.choiceMade).toBe('A');
    });

    it('should default to first choice when no choice specified', () => {
      const { newState } = engine.executePhase(sampleQuest, initialState);

      expect(newState.currentPhaseId).toBe('phase-2a');
      expect(newState.branchHistory[0].choiceId).toBeUndefined();
    });
  });

  describe('executePhase - Branch', () => {
    it('should execute branch conditions deterministically', () => {
      // Start from phase-2a (branch phase)
      const branchState: QuestState = {
        ...initialState,
        currentPhaseId: 'phase-2a',
      };

      const { newState } = engine.executePhase(sampleQuest, branchState);

      // With seed 12345, the random chance should succeed (0.7 threshold)
      expect(newState.currentPhaseId).toBe('phase-3-success');
      expect(newState.branchHistory[0].outcome.metadata?.branchResult).toBe('success');
    });
  });

  describe('executePhase - TimedChoice', () => {
    it('should handle timed choice selection', () => {
      const timedState: QuestState = {
        ...initialState,
        currentPhaseId: 'phase-2b',
      };

      const { newState } = engine.executePhase(sampleQuest, timedState, 'quick-choice');

      expect(newState.currentPhaseId).toBe('phase-3-alternate');
      expect(newState.branchHistory[0].outcome.metadata?.timedChoice).toBe(true);
    });

    it('should handle timeout when no choice made', () => {
      const timedState: QuestState = {
        ...initialState,
        currentPhaseId: 'phase-2b',
      };

      const { newState } = engine.executePhase(sampleQuest, timedState);

      expect(newState.currentPhaseId).toBe('phase-3-timeout');
      expect(newState.branchHistory[0].outcome.metadata?.timedOut).toBe(true);
    });
  });

  describe('executePhase - Quest Completion', () => {
    it('should complete quest on success path', () => {
      // Set up state at success phase
      const successState: QuestState = {
        ...initialState,
        currentPhaseId: 'phase-3-success',
      };

      const { result } = engine.executePhase(sampleQuest, successState);

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.completedPhases).toBe(1);
      expect(result?.totalPhases).toBe(4);
      expect(result?.telemetryData.totalBranchesTaken).toBe(1);
    });

    it('should complete quest on failure path', () => {
      // Set up state at failure phase
      const failureState: QuestState = {
        ...initialState,
        currentPhaseId: 'phase-3-failure',
      };

      const { result } = engine.executePhase(sampleQuest, failureState);

      expect(result?.success).toBe(false);
    });
  });

  describe('getAvailableChoices', () => {
    it('should return choices for dialogue phase', () => {
      const choices = engine.getAvailableChoices(sampleQuest, initialState);
      expect(choices).toEqual(['choice-a', 'choice-b']);
    });

    it('should return choices for timed choice phase', () => {
      const timedState: QuestState = { ...initialState, currentPhaseId: 'phase-2b' };
      const choices = engine.getAvailableChoices(sampleQuest, timedState);
      expect(choices).toEqual(['quick-choice']);
    });

    it('should return empty array for non-interactive phases', () => {
      const fightState: QuestState = { ...initialState, currentPhaseId: 'phase-3-success' };
      const choices = engine.getAvailableChoices(sampleQuest, fightState);
      expect(choices).toEqual([]);
    });
  });

  describe('requiresInput', () => {
    it('should return true for dialogue phases', () => {
      expect(engine.requiresInput(sampleQuest, initialState)).toBe(true);
    });

    it('should return true for timed choice phases', () => {
      const timedState: QuestState = { ...initialState, currentPhaseId: 'phase-2b' };
      expect(engine.requiresInput(sampleQuest, timedState)).toBe(true);
    });

    it('should return false for automatic phases', () => {
      const fightState: QuestState = { ...initialState, currentPhaseId: 'phase-3-success' };
      expect(engine.requiresInput(sampleQuest, fightState)).toBe(false);
    });
  });

  describe('deterministic execution', () => {
    it('should produce same results with same seed', () => {
      const engine1 = new QuestEngine(999);
      const engine2 = new QuestEngine(999);

      const state1 = engine1.initializeQuest(sampleQuest);
      const state2 = engine2.initializeQuest(sampleQuest);

      const result1 = engine1.executePhase(sampleQuest, state1, 'choice-a');
      const result2 = engine2.executePhase(sampleQuest, state2, 'choice-a');

      expect(result1.newState.currentPhaseId).toBe(result2.newState.currentPhaseId);
      expect(result1.newState.branchHistory[0].randomSeed).toBe(result2.newState.branchHistory[0].randomSeed);
    });

    it('should produce different results with different seeds', () => {
      const engine1 = new QuestEngine(111);
      const engine2 = new QuestEngine(222);

      // Test random branch with different seeds
      const branchState1: QuestState = {
        ...engine1.initializeQuest(sampleQuest),
        currentPhaseId: 'phase-2a',
      };
      const branchState2: QuestState = {
        ...engine2.initializeQuest(sampleQuest),
        currentPhaseId: 'phase-2a',
      };

      const result1 = engine1.executePhase(sampleQuest, branchState1);
      const result2 = engine2.executePhase(sampleQuest, branchState2);

      // Results might differ due to random chance
      expect(result1.newState.branchHistory[0].randomSeed).not.toBe(result2.newState.branchHistory[0].randomSeed);
    });
  });
});
