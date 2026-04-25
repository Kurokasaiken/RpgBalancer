/**
 * Tests for useSessionTagging Hook
 * 
 * Unit tests for the React hook integration with session tagging.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSessionTagging } from '@/ui/punchClub/hooks/useSessionTagging';
import type { GameState, CombatResult, TrainingResult } from '@/ui/punchClub/hooks/usePunchClubGame';

// Mock the session tagging pipeline
const mockPipeline = {
  isSessionActive: () => mockIsSessionActive,
  getSessionId: () => mockSessionId,
  getMetrics: () => mockMetrics,
  getTags: () => mockTags,
  startSession: vi.fn(),
  endSession: vi.fn(),
  addTag: vi.fn(),
  removeTag: vi.fn(),
  saveSession: vi.fn(),
  loadSession: vi.fn(),
  getSessionSummary: vi.fn(),
  exportSession: vi.fn(),
  recordCombat: vi.fn(),
  recordTraining: vi.fn(),
  recordLevelUp: vi.fn(),
  recordStatAllocation: vi.fn(),
};

let mockIsSessionActive = false;
let mockSessionId: string | null = null;
let mockMetrics: any = null;
let mockTags: any[] = [];

vi.mock('@/analytics/sessionTaggingPipeline', () => ({
  getSessionTaggingPipeline: () => mockPipeline,
}));

describe('useSessionTagging', () => {
  beforeEach(() => {
    // Reset mocks
    mockIsSessionActive = false;
    mockSessionId = null;
    mockMetrics = null;
    mockTags = [];
    
    vi.clearAllMocks();
  });

  it('should initialize with inactive session', () => {
    const { result } = renderHook(() => useSessionTagging());

    expect(result.current.isSessionActive).toBe(false);
    expect(result.current.currentSessionId).toBe(null);
    expect(result.current.sessionMetrics).toBe(null);
    expect(result.current.tags).toEqual([]);
    expect(result.current.tagsByType).toEqual({});
  });

  it('should start a new session', () => {
    const { result } = renderHook(() => useSessionTagging());

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

    act(() => {
      result.current.startSession(gameState);
    });

    expect(mockPipeline.startSession).toHaveBeenCalledWith(
      expect.stringMatching(/^session_\d+_[a-z0-9]+$/),
      gameState
    );
  });

  it('should end current session', () => {
    const { result } = renderHook(() => useSessionTagging());

    mockIsSessionActive = true;
    mockPipeline.endSession.mockReturnValue({
      combatsTotal: 5,
      combatsWon: 3,
      winRate: 0.6,
      duration: 300000,
      levelsGained: 2,
    });

    act(() => {
      result.current.endSession();
    });

    expect(mockPipeline.endSession).toHaveBeenCalled();
  });

  it('should add a tag', () => {
    const { result } = renderHook(() => useSessionTagging());

    const tag = {
      type: 'custom' as const,
      name: 'Test Tag',
      value: 'Test Value',
      confidence: 0.8,
      source: 'manual' as const,
    };

    act(() => {
      result.current.addTag(tag);
    });

    expect(mockPipeline.addTag).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'custom',
        name: 'Test Tag',
        value: 'Test Value',
        confidence: 0.8,
        source: 'manual',
        id: expect.stringMatching(/^custom_\d+_[a-z0-9]+$/),
        timestamp: expect.any(Number),
      })
    );
  });

  it('should remove a tag', () => {
    const { result } = renderHook(() => useSessionTagging());

    act(() => {
      result.current.removeTag('tag-1');
    });

    expect(mockPipeline.removeTag).toHaveBeenCalledWith('tag-1');
  });

  it('should save session', async () => {
    const { result } = renderHook(() => useSessionTagging());

    mockSessionId = 'test-session';

    act(() => {
      result.current.saveSession();
    });

    expect(mockPipeline.saveSession).toHaveBeenCalled();
  });

  it('should load session', async () => {
    const { result } = renderHook(() => useSessionTagging());

    mockPipeline.loadSession.mockResolvedValue(true);

    act(async () => {
      await result.current.loadSession('test-session');
    });

    expect(mockPipeline.loadSession).toHaveBeenCalledWith('test-session');
  });

  it('should record combat', () => {
    const { result } = renderHook(() => useSessionTagging());

    const combatResult: CombatResult = {
      opponentId: 'opponent1',
      opponentLevel: 3,
      won: true,
      experience: 50,
      money: 20,
      timestamp: Date.now(),
      turns: 5,
    };

    act(() => {
      result.current.recordCombat(combatResult);
    });

    expect(mockPipeline.recordCombat).toHaveBeenCalledWith(combatResult);
  });

  it('should record training', () => {
    const { result } = renderHook(() => useSessionTagging());

    const trainingResult: TrainingResult = {
      exerciseId: 'strength',
      statGains: { strength: 5 },
      completedAt: Date.now(),
    };

    act(() => {
      result.current.recordTraining(trainingResult);
    });

    expect(mockPipeline.recordTraining).toHaveBeenCalledWith(trainingResult);
  });

  it('should record level up', () => {
    const { result } = renderHook(() => useSessionTagging());

    act(() => {
      result.current.recordLevelUp(2);
    });

    expect(mockPipeline.recordLevelUp).toHaveBeenCalledWith(2);
  });

  it('should record stat allocation', () => {
    const { result } = renderHook(() => useSessionTagging());

    const stats = { strength: 5, agility: 3 };

    act(() => {
      result.current.recordStatAllocation(stats);
    });

    expect(mockPipeline.recordStatAllocation).toHaveBeenCalledWith(stats);
  });

  it('should get session summary', () => {
    const { result } = renderHook(() => useSessionTagging());

    const mockSummary = {
      metrics: {
        combatsTotal: 10,
        combatsWon: 7,
        winRate: 0.7,
      },
      tags: [],
      tagCounts: {},
      confidence: { high: 5, medium: 3, low: 2 },
    };

    mockPipeline.getSessionSummary.mockReturnValue(mockSummary);

    act(() => {
      result.current.getSessionSummary();
    });

    expect(mockPipeline.getSessionSummary).toHaveBeenCalled();
  });

  it('should export session', () => {
    const { result } = renderHook(() => useSessionTagging());

    mockPipeline.exportSession.mockReturnValue('{"session": "data"}');

    act(() => {
      result.current.exportSession();
    });

    expect(mockPipeline.exportSession).toHaveBeenCalled();
  });

  it('should group tags by type', () => {
    const { result } = renderHook(() => useSessionTagging());

    mockTags = [
      { id: '1', type: 'custom', name: 'Tag 1' },
      { id: '2', type: 'custom', name: 'Tag 2' },
      { id: '3', type: 'playstyle', name: 'Tag 3' },
    ];

    act(() => {
      // Trigger re-render to update tagsByType
    });

    expect(result.current.tagsByType.custom).toHaveLength(2);
    expect(result.current.tagsByType.playstyle).toHaveLength(1);
  });
});
