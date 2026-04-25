import { describe, it, expect, beforeEach } from 'vitest';
import { generateIntentTimeline, compareTimelines, createMockTimeline } from '../../../../src/balancing/hooks/archmage/intentTimelineGenerator';
import type { STSSimulatorState, STSTurnLog } from '../../../../src/balancing/hooks/archmage/stsSimulatorState';
import type { IntentTimeline } from '../../../../src/ui/tools/sts/types/intentTimeline';

describe('IntentTimelineGenerator', () => {
  const mockState: STSSimulatorState = {
    runId: 'test-run',
    deckId: 'test-deck',
    enemyId: 'test-enemy',
    seed: 12345,
    playerState: {
      hp: 70,
      armor: 0,
      buffs: [],
    },
    enemyState: {
      hp: 50,
      armor: 0,
      buffs: [],
    },
    resonance: {},
    inspiration: 3,
    hand: [],
    turnNumber: 1,
    phase: 'player',
    isRunning: true,
    result: null,
    turnLogs: [],
    log: [],
    lastEnemyIntent: {
      type: 'attack',
      label: 'Strike',
      value: 6,
      description: 'Deal 6 damage',
      severity: 'low',
    },
  };

  const mockTurnLogs: STSTurnLog[] = [
    {
      turnNumber: 1,
      phase: 'player',
      actions: [
        {
          type: 'card_play',
          details: 'Strike',
          manaSpent: { red: 1 },
          outcome: 'Dealt 6 damage',
        },
      ],
      playerState: {
        hp: 70,
        resonance: {},
        inspiration: 2,
        handSize: 4,
      },
      enemyState: {
        hp: 44,
        intent: 'Strike',
        block: 0,
      },
      timestamp: Date.now(),
    },
    {
      turnNumber: 2,
      phase: 'enemy',
      actions: [
        {
          type: 'enemy_attack',
          details: 'Strike',
          outcome: 'Dealt 6 damage',
        },
      ],
      playerState: {
        hp: 64,
        resonance: {},
        inspiration: 2,
        handSize: 5,
      },
      enemyState: {
        hp: 44,
        intent: 'Defend',
        block: 5,
      },
      timestamp: Date.now(),
    },
  ];

  beforeEach(() => {
    // Reset any test state if needed
  });

  describe('generateIntentTimeline', () => {
    it('creates timeline from state and turn logs', () => {
      const timeline = generateIntentTimeline(mockState, mockTurnLogs);

      expect(timeline).toBeDefined();
      expect(timeline.runId).toBe('test-run');
      expect(timeline.deckId).toBe('test-deck');
      expect(timeline.enemyId).toBe('test-enemy');
      expect(timeline.seed).toBe(12345);
      expect(timeline.rounds).toHaveLength(2);
      expect(timeline.totalRounds).toBe(2);
    });

    it('extracts player actions from turn logs', () => {
      const timeline = generateIntentTimeline(mockState, mockTurnLogs);

      expect(timeline.rounds[0].playerIntent).toBeDefined();
      expect(timeline.rounds[0].playerIntent?.label).toBe('Strike');
      expect(timeline.rounds[0].playerIntent?.value).toBe(1);
    });

    it('extracts enemy intents from turn logs', () => {
      const timeline = generateIntentTimeline(mockState, mockTurnLogs);

      expect(timeline.rounds[0].enemyIntent).toBeDefined();
      expect(timeline.rounds[0].enemyIntent?.label).toBe('Strike');
      expect(timeline.rounds[1].enemyIntent?.label).toBe('Defend');
    });

    it('calculates HP changes correctly', () => {
      const timeline = generateIntentTimeline(mockState, mockTurnLogs);

      expect(timeline.rounds[0].playerHpStart).toBe(70);
      expect(timeline.rounds[0].playerHpEnd).toBe(70);
      expect(timeline.rounds[0].enemyHpStart).toBe(50);
      expect(timeline.rounds[0].enemyHpEnd).toBe(44);

      expect(timeline.rounds[1].playerHpStart).toBe(70);
      expect(timeline.rounds[1].playerHpEnd).toBe(64);
      expect(timeline.rounds[1].enemyHpStart).toBe(44);
      expect(timeline.rounds[1].enemyHpEnd).toBe(44);
    });

    it('handles empty turn logs', () => {
      const timeline = generateIntentTimeline(mockState, []);

      expect(timeline.rounds).toHaveLength(0);
      expect(timeline.totalRounds).toBe(0);
    });

    it('uses last enemy intent when turn log intent is missing', () => {
      const turnLogsWithoutIntent = mockTurnLogs.map(log => ({
        ...log,
        enemyState: { ...log.enemyState, intent: undefined },
      }));

      const timeline = generateIntentTimeline(mockState, turnLogsWithoutIntent);

      expect(timeline.rounds[0].enemyIntent).toBeDefined();
      expect(timeline.rounds[0].enemyIntent?.label).toBe('Strike');
    });

    it('includes metadata', () => {
      const timeline = generateIntentTimeline(mockState, mockTurnLogs);

      expect(timeline.result).toBe('ongoing');
      expect(timeline.generatedAt).toBeTypeOf('number');
      expect(timeline.generatedAt).toBeGreaterThan(0);
    });
  });

  describe('compareTimelines', () => {
    const timeline1 = createMockTimeline();
    const timeline2: IntentTimeline = {
      ...timeline1,
      runId: 'different-run',
      rounds: timeline1.rounds.map((round, index) => ({
        ...round,
        enemyIntent: index === 1 ? {
          type: 'defend',
          label: 'Block',
          value: 5,
          description: 'Gain 5 block',
          isPredicted: false,
        } : round.enemyIntent,
        playerHpEnd: index === 1 ? 60 : round.playerHpEnd,
      }))
    };

    it('detects intent changes', () => {
      const comparison = compareTimelines(timeline2, timeline1);

      expect(comparison.diffs).toHaveLength(2); // Intent change + HP change
      expect(comparison.diffs[0].type).toBe('intent');
      expect(comparison.diffs[0].description).toBe('Enemy intent changed');
      expect(comparison.diffs[0].previousValue).toBe('Defend');
      expect(comparison.diffs[0].currentValue).toBe('Block');
    });

    it('detects HP changes', () => {
      const comparison = compareTimelines(timeline2, timeline1);

      const hpDiff = comparison.diffs.find(diff => diff.type === 'hp');
      expect(hpDiff).toBeDefined();
      expect(hpDiff?.description).toContain('Player HP changed');
      expect(hpDiff?.previousValue).toBe(64);
      expect(hpDiff?.currentValue).toBe(60);
    });

    it('calculates diff summary', () => {
      const comparison = compareTimelines(timeline2, timeline1);

      expect(comparison.summary.totalDifferences).toBe(2);
      expect(comparison.summary.majorChanges).toBe(0);
      expect(comparison.summary.moderateChanges).toBe(2);
      expect(comparison.summary.minorChanges).toBe(0);
    });

    it('handles identical timelines', () => {
      const comparison = compareTimelines(timeline1, timeline1);

      expect(comparison.diffs).toHaveLength(0);
      expect(comparison.summary.totalDifferences).toBe(0);
    });

    it('handles different round counts', () => {
      const shorterTimeline = {
        ...timeline1,
        rounds: timeline1.rounds.slice(0, 2),
        totalRounds: 2,
      };

      const comparison = compareTimelines(timeline1, shorterTimeline);

      expect(comparison.diffs.length).toBeGreaterThan(0);
      expect(comparison.diffs.some(diff => diff.description.includes('Round added'))).toBe(true);
    });

    it('classifies severity correctly', () => {
      const timelineWithBigHPChange: IntentTimeline = {
        ...timeline1,
        rounds: timeline1.rounds.map((round, index) => ({
          ...round,
          playerHpEnd: index === 0 ? 40 : round.playerHpEnd, // 24 HP difference
        }))
      };

      const comparison = compareTimelines(timelineWithBigHPChange, timeline1);

      const hpDiff = comparison.diffs.find(diff => diff.type === 'hp');
      expect(hpDiff?.severity).toBe('major');
    });
  });

  describe('createMockTimeline', () => {
    it('creates a valid mock timeline', () => {
      const timeline = createMockTimeline();

      expect(timeline.runId).toBe('mock-run-1');
      expect(timeline.deckId).toBe('starter_deck');
      expect(timeline.enemyId).toBe('tutorial');
      expect(timeline.seed).toBe(12345);
      expect(timeline.rounds).toHaveLength(3);
      expect(timeline.result).toBe('victory');
    });

    it('has proper round structure', () => {
      const timeline = createMockTimeline();

      timeline.rounds.forEach((round, index) => {
        expect(round.roundNumber).toBe(index + 1);
        expect(round.playerIntent).toBeDefined();
        expect(round.enemyIntent).toBeDefined();
        expect(typeof round.projectedPlayerDamage).toBe('number');
        expect(typeof round.projectedEnemyDamage).toBe('number');
        expect(typeof round.playerHpStart).toBe('number');
        expect(typeof round.enemyHpStart).toBe('number');
        expect(typeof round.playerHpEnd).toBe('number');
        expect(typeof round.enemyHpEnd).toBe('number');
      });
    });

    it('includes buff data', () => {
      const timeline = createMockTimeline();

      expect(timeline.rounds[1].playerBuffs).toHaveLength(1);
      expect(timeline.rounds[1].playerBuffs[0].name).toBe('Block');
      expect(timeline.rounds[3].playerDebuffs).toHaveLength(1);
      expect(timeline.rounds[3].playerDebuffs[0].name).toBe('Vulnerable');
    });

    it('calculates damage correctly', () => {
      const timeline = createMockTimeline();

      expect(timeline.rounds[0].actualPlayerDamage).toBe(6);
      expect(timeline.rounds[0].actualEnemyDamage).toBe(6);
      expect(timeline.rounds[2].actualPlayerDamage).toBe(12); // Vulnerable damage
    });
  });

  describe('edge cases', () => {
    it('handles missing player actions', () => {
      const turnLogsWithoutPlayerActions = mockTurnLogs.map(log => ({
        ...log,
        actions: log.actions.filter(action => action.type !== 'card_play'),
      }));

      const timeline = generateIntentTimeline(mockState, turnLogsWithoutPlayerActions);

      expect(timeline.rounds[0].playerIntent).toBeNull();
    });

    it('handles missing enemy intents', () => {
      const stateWithoutEnemyIntent = {
        ...mockState,
        lastEnemyIntent: undefined,
      };

      const timeline = generateIntentTimeline(stateWithoutEnemyIntent, mockTurnLogs);

      // Should still extract from turn logs
      expect(timeline.rounds[0].enemyIntent).toBeDefined();
    });

    it('handles malformed turn logs gracefully', () => {
      const malformedTurnLogs = [
        {
          ...mockTurnLogs[0],
          playerState: undefined as any,
          enemyState: undefined as any,
        },
      ];

      // Should not throw
      expect(() => {
        generateIntentTimeline(mockState, malformedTurnLogs);
      }).not.toThrow();
    });
  });
});
