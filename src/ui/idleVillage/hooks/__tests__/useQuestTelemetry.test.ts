/**
 * useQuestTelemetry Hook Tests
 *
 * Tests for the quest telemetry accumulation and management hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuestTelemetry } from '../useQuestTelemetry';
import type { QuestResult } from '@/engine/quest/types';

describe('useQuestTelemetry', () => {
  const mockQuestResult: QuestResult = {
    questId: 'test-quest-1',
    success: true,
    completedPhases: 3,
    totalPhases: 3,
    durationSeconds: 120,
    branchDecisions: [
      {
        phaseId: 'phase-1',
        choiceId: 'choice-a',
        outcome: { nextPhaseIds: ['phase-2'] },
        timestamp: Date.now(),
        randomSeed: 12345,
      },
    ],
    finalEffects: [],
    telemetryData: {
      totalBranchesTaken: 1,
      averageChoiceTime: 5,
      heroicMoments: 1,
      failurePoints: [],
      successPath: ['phase-1', 'phase-2', 'phase-3'],
      playerChoices: ['choice-a'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return initial telemetry state', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.telemetry.totalQuests).toBe(0);
      expect(result.current.telemetry.successRate).toBe(0);
      expect(result.current.telemetry.averageDuration).toBe(0);
      expect(result.current.telemetry.totalBranches).toBe(0);
      expect(result.current.telemetry.branchDecisions).toEqual([]);
      expect(result.current.telemetry.recentQuests).toEqual([]);
    });
  });

  describe('recordQuestResult', () => {
    it('should record a quest result and update telemetry', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.recordQuestResult(mockQuestResult);
      });

      expect(result.current.telemetry.totalQuests).toBe(1);
      expect(result.current.telemetry.successRate).toBe(1);
      expect(result.current.telemetry.averageDuration).toBe(120);
      expect(result.current.telemetry.heroicMoments).toBe(1);
      expect(result.current.telemetry.recentQuests).toHaveLength(1);
      expect(result.current.telemetry.recentQuests[0].questId).toBe('test-quest-1');
    });

    it('should maintain only the last 10 quest results', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Record 12 quests
      for (let i = 0; i < 12; i++) {
        act(() => {
          result.current.recordQuestResult({
            ...mockQuestResult,
            questId: `test-quest-${i}`,
          });
        });
      }

      expect(result.current.telemetry.totalQuests).toBe(12);
      expect(result.current.telemetry.recentQuests).toHaveLength(10);
    });

    it('should calculate success rate correctly', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Record 3 successful quests
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.recordQuestResult({
            ...mockQuestResult,
            questId: `success-${i}`,
            success: true,
          });
        });
      }

      // Record 2 failed quests
      for (let i = 0; i < 2; i++) {
        act(() => {
          result.current.recordQuestResult({
            ...mockQuestResult,
            questId: `failure-${i}`,
            success: false,
          });
        });
      }

      expect(result.current.telemetry.totalQuests).toBe(5);
      expect(result.current.telemetry.successRate).toBe(0.6);
    });
  });

  describe('clearTelemetry', () => {
    it('should clear all telemetry data', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.recordQuestResult(mockQuestResult);
      });

      expect(result.current.telemetry.totalQuests).toBe(1);

      await act(async () => {
        await result.current.clearTelemetry();
      });

      expect(result.current.telemetry.totalQuests).toBe(0);
      expect(result.current.telemetry.recentQuests).toEqual([]);
    });
  });

  describe('getQuestTypeStats', () => {
    it('should return stats for a specific quest type', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.recordQuestResult({
          ...mockQuestResult,
          questId: 'combat-trial-1',
        });
      });

      const combatStats = result.current.getQuestTypeStats('combat');
      expect(combatStats.count).toBe(1);
      expect(combatStats.successRate).toBe(1);
      expect(combatStats.averageDuration).toBe(120);
    });

    it('should return zero stats for quest type with no data', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const missingStats = result.current.getQuestTypeStats('nonexistent');
      expect(missingStats.count).toBe(0);
      expect(missingStats.successRate).toBe(0);
      expect(missingStats.averageDuration).toBe(0);
    });
  });

  describe('quest type breakdown', () => {
    it('should aggregate quest types correctly', async () => {
      const { result } = renderHook(() => useQuestTelemetry());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.recordQuestResult({ ...mockQuestResult, questId: 'combat-1' });
        result.current.recordQuestResult({ ...mockQuestResult, questId: 'stealth-1' });
        result.current.recordQuestResult({ ...mockQuestResult, questId: 'exploration-1' });
        result.current.recordQuestResult({ ...mockQuestResult, questId: 'combat-2' });
      });

      expect(result.current.telemetry.questTypeBreakdown).toEqual({
        combat: 2,
        stealth: 1,
        exploration: 1,
      });
    });
  });
});
