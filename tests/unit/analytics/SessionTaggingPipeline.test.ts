/**
 * Tests for Session Tagging Pipeline
 * 
 * Unit tests for the session tagging system functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionTaggingPipeline, getSessionTaggingPipeline, type SessionTag, type SessionMetrics } from '@/analytics/sessionTaggingPipeline';
import type { GameState, CombatResult, TrainingResult } from '@/ui/punchClub/hooks/usePunchClubGame';

describe('SessionTaggingPipeline', () => {
  let pipeline: SessionTaggingPipeline;
  
  beforeEach(() => {
    pipeline = new SessionTaggingPipeline();
  });

  afterEach(() => {
    pipeline.endSession();
  });

  describe('Session Management', () => {
    it('should start a new session', () => {
      const gameState: GameState = {
        player: {
          stats: { hp: 100, damage: 10 },
          level: 1,
          experience: 0,
          money: 100,
          statPoints: 0,
        },
        currentOpponent: null,
        inCombat: false,
        training: {
          isTraining: false,
          currentExercise: null,
          remainingTime: 0,
        },
        unlockedMoves: [],
        completedTraining: [],
        combatHistory: [],
      };

      const sessionId = 'test-session-1';
      pipeline.startSession(sessionId, gameState);

      expect(pipeline.isSessionActive()).toBe(true);
      expect(pipeline.getSessionId()).toBe(sessionId);
      
      const metrics = pipeline.getMetrics();
      expect(metrics.levelStart).toBe(1);
      expect(metrics.levelEnd).toBe(1);
      expect(metrics.experienceStart).toBe(0);
      expect(metrics.moneyStart).toBe(100);
    });

    it('should end a session and calculate metrics', () => {
      const gameState: GameState = {
        player: {
          stats: { hp: 100, damage: 10 },
          level: 1,
          experience: 0,
          money: 100,
          statPoints: 0,
        },
        currentOpponent: null,
        inCombat: false,
        training: {
          isTraining: false,
          currentExercise: null,
          remainingTime: 0,
        },
        unlockedMoves: [],
        completedTraining: [],
        combatHistory: [],
      };

      pipeline.startSession('test-session', gameState);
      
      // Simulate some activity
      pipeline.recordCombat({
        opponentId: 'opponent1',
        opponentLevel: 2,
        won: true,
        experience: 50,
        money: 20,
        timestamp: Date.now(),
        turns: 5,
      });

      const metrics = pipeline.endSession();
      
      expect(metrics).toBeDefined();
      expect(metrics!.combatsTotal).toBe(1);
      expect(metrics!.combatsWon).toBe(1);
      expect(metrics!.winRate).toBe(1.0);
      expect(metrics!.experienceGained).toBe(50);
      expect(metrics!.moneyGained).toBe(20);
      expect(metrics!.averageTurnsPerCombat).toBe(5);
      
      expect(pipeline.isSessionActive()).toBe(false);
    });

    it('should handle ending a non-active session', () => {
      const metrics = pipeline.endSession();
      expect(metrics).toBeNull();
    });
  });

  describe('Tag Management', () => {
    beforeEach(() => {
      const gameState: GameState = {
        player: {
          stats: { hp: 100, damage: 10 },
          level: 1,
          experience: 0,
          money: 100,
          statPoints: 0,
        },
        currentOpponent: null,
        inCombat: false,
        training: {
          isTraining: false,
          currentExercise: null,
          remainingTime: 0,
        },
        unlockedMoves: [],
        completedTraining: [],
        combatHistory: [],
      };
      pipeline.startSession('test-session', gameState);
    });

    it('should add a tag', () => {
      const tag: SessionTag = {
        id: 'tag-1',
        type: 'custom',
        name: 'Test Tag',
        value: 'Test Value',
        confidence: 0.8,
        source: 'manual',
        timestamp: Date.now(),
        metadata: {},
      };

      pipeline.addTag(tag);
      const tags = pipeline.getTags();
      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual(tag);
    });

    it('should remove a tag', () => {
      const tag: SessionTag = {
        id: 'tag-1',
        type: 'custom',
        name: 'Test Tag',
        value: 'Test Value',
        confidence: 0.8,
        source: 'manual',
        timestamp: Date.now(),
        metadata: {},
      };

      pipeline.addTag(tag);
      expect(pipeline.getTags()).toHaveLength(1);

      const removed = pipeline.removeTag('tag-1');
      expect(removed).toBe(true);
      expect(pipeline.getTags()).toHaveLength(0);
    });

    it('should handle removing non-existent tag', () => {
      const removed = pipeline.removeTag('non-existent');
      expect(removed).toBe(false);
    });

    it('should filter tags by type', () => {
      const tags: SessionTag[] = [
        {
          id: 'tag-1',
          type: 'custom',
          name: 'Custom Tag',
          value: 'Value 1',
          confidence: 0.8,
          source: 'manual',
          timestamp: Date.now(),
          metadata: {},
        },
        {
          id: 'tag-2',
          type: 'playstyle',
          name: 'Playstyle Tag',
          value: 'Value 2',
          confidence: 0.9,
          source: 'auto',
          timestamp: Date.now(),
          metadata: {},
        },
      ];

      tags.forEach(tag => pipeline.addTag(tag));

      const customTags = pipeline.getTagsByType('custom');
      expect(customTags).toHaveLength(1);
      expect(customTags[0].type).toBe('custom');

      const playstyleTags = pipeline.getTagsByType('playstyle');
      expect(playstyleTags).toHaveLength(1);
      expect(playstyleTags[0].type).toBe('playstyle');
    });
  });

  describe('Event Recording', () => {
    beforeEach(() => {
      const gameState: GameState = {
        player: {
          stats: { hp: 100, damage: 10 },
          level: 1,
          experience: 0,
          money: 100,
          statPoints: 0,
        },
        currentOpponent: null,
        inCombat: false,
        training: {
          isTraining: false,
          currentExercise: null,
          remainingTime: 0,
        },
        unlockedMoves: [],
        completedTraining: [],
        combatHistory: [],
      };
      pipeline.startSession('test-session', gameState);
    });

    it('should record combat results', () => {
      const combatResult: CombatResult = {
        opponentId: 'opponent1',
        opponentLevel: 3,
        won: true,
        experience: 75,
        money: 30,
        timestamp: Date.now(),
        turns: 7,
      };

      pipeline.recordCombat(combatResult);

      const metrics = pipeline.getMetrics();
      expect(metrics.combatsTotal).toBe(1);
      expect(metrics.combatsWon).toBe(1);
      expect(metrics.winRate).toBe(1.0);
      expect(metrics.experienceGained).toBe(75);
      expect(metrics.moneyGained).toBe(30);
      expect(metrics.averageTurnsPerCombat).toBe(7);
    });

    it('should record training results', () => {
      const trainingResult: TrainingResult = {
        exerciseId: 'strength',
        statGains: { strength: 5 },
        completedAt: Date.now(),
      };

      pipeline.recordTraining(trainingResult);

      const metrics = pipeline.getMetrics();
      expect(metrics.trainingCompleted).toBe(1);
    });

    it('should record level ups', () => {
      pipeline.recordLevelUp(2);
      pipeline.recordLevelUp(3);

      const metrics = pipeline.getMetrics();
      expect(metrics.levelEnd).toBe(3);
      expect(metrics.levelsGained).toBe(2);
    });

    it('should record stat allocations', () => {
      pipeline.recordStatAllocation({ strength: 5, agility: 3 });

      const metrics = pipeline.getMetrics();
      expect(metrics.statPointsAllocated).toBe(8);
    });
  });

  describe('Session Summary', () => {
    beforeEach(() => {
      const gameState: GameState = {
        player: {
          stats: { hp: 100, damage: 10 },
          level: 1,
          experience: 0,
          money: 100,
          statPoints: 0,
        },
        currentOpponent: null,
        inCombat: false,
        training: {
          isTraining: false,
          currentExercise: null,
          remainingTime: 0,
        },
        unlockedMoves: [],
        completedTraining: [],
        combatHistory: [],
      };
      pipeline.startSession('test-session', gameState);
    });

    it('should generate session summary', () => {
      // Add some activity
      pipeline.recordCombat({
        opponentId: 'opponent1',
        opponentLevel: 2,
        won: true,
        experience: 50,
        money: 20,
        timestamp: Date.now(),
        turns: 5,
      });

      pipeline.addTag({
        id: 'tag-1',
        type: 'custom',
        name: 'Test Tag',
        value: 'Test Value',
        confidence: 0.8,
        source: 'manual',
        timestamp: Date.now(),
        metadata: {},
      });

      const summary = pipeline.getSessionSummary();

      expect(summary.metrics).toBeDefined();
      expect(summary.metrics!.combatsTotal).toBe(1);
      expect(summary.tags).toHaveLength(1);
      expect(summary.tagCounts.custom).toBe(1);
      expect(summary.confidence.high).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should save and load session data', async () => {
      const gameState: GameState = {
        player: {
          stats: { hp: 100, damage: 10 },
          level: 1,
          experience: 0,
          money: 100,
          statPoints: 0,
        },
        currentOpponent: null,
        inCombat: false,
        training: {
          isTraining: false,
          currentExercise: null,
          remainingTime: 0,
        },
        unlockedMoves: [],
        completedTraining: [],
        combatHistory: [],
      };

      const sessionId = 'test-session';
      pipeline.startSession(sessionId, gameState);

      // Add some data
      pipeline.recordCombat({
        opponentId: 'opponent1',
        opponentLevel: 2,
        won: true,
        experience: 50,
        money: 20,
        timestamp: Date.now(),
        turns: 5,
      });

      pipeline.addTag({
        id: 'tag-1',
        type: 'custom',
        name: 'Test Tag',
        value: 'Test Value',
        confidence: 0.8,
        source: 'manual',
        timestamp: Date.now(),
        metadata: {},
      });

      // Save session
      await pipeline.saveSession();

      // Create new pipeline and load session
      const newPipeline = new SessionTaggingPipeline();
      const loaded = await newPipeline.loadSession(sessionId);

      expect(loaded).toBe(true);
      expect(newPipeline.getSessionId()).toBe(sessionId);
      
      const loadedMetrics = newPipeline.getMetrics();
      expect(loadedMetrics.combatsTotal).toBe(1);
      expect(loadedMetrics.experienceGained).toBe(50);

      const loadedTags = newPipeline.getTags();
      expect(loadedTags).toHaveLength(1);
      expect(loadedTags[0].name).toBe('Test Tag');
    });
  });
});

describe('getSessionTaggingPipeline', () => {
  it('should return singleton instance', () => {
    const pipeline1 = getSessionTaggingPipeline();
    const pipeline2 = getSessionTaggingPipeline();
    
    expect(pipeline1).toBe(pipeline2);
  });
});
