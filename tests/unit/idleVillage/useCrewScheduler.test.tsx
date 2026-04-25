/**
 * Crew Scheduler Unit Tests – WS3 Deterministic Queue
 * 
 * Tests deterministic priority queue behavior, LCG seeding, and
 * config-first priority calculations for the crew scheduler system.
 * 
 * @since WS3
 */

import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useCrewScheduler } from '@/ui/idleVillage/hooks/useCrewScheduler';
import {
  DEFAULT_CREW_SCHEDULER_CONFIG,
  TEST_CREW_SCHEDULER_CONFIG,
  createDeterministicRng,
  calculateAssignmentPriority,
} from '@/balancing/config/idleVillage/crewScheduler';

// Mock analytics and diagnostics
vi.mock('@/ui/idleVillage/utils/crewSchedulerAnalyticsChannel', () => ({
  recordCrewDecision: vi.fn(),
  recordCrewQueueSnapshot: vi.fn(),
}));

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock Date.now for deterministic testing
const mockDateNow = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  mockDateNow.mockReturnValue(1000000);
  vi.spyOn(Date, 'now').mockImplementation(mockDateNow);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCrewScheduler - Deterministic Queue', () => {
  const mockVillageState = {
    residents: {
      'resident-1': {
        id: 'resident-1',
        displayName: 'Alice',
        status: 'available',
        fatigue: 0.2,
        stats: { strength: 10, agility: 8 },
      } as ResidentState,
      'resident-2': {
        id: 'resident-2',
        displayName: 'Bob',
        status: 'available',
        fatigue: 0.6,
        stats: { strength: 6, agility: 12 },
      } as ResidentState,
    },
    activities: {},
    currentTime: 1000,
  };

  const mockActivities = {
    'activity-1': {
      id: 'activity-1',
      label: 'Forest Work',
      statRequirement: {
        allOf: [{ stat: 'strength', min: 5 }],
      },
      tags: ['job'],
      dangerRating: 3,
    } as ActivityDefinition,
    'activity-2': {
      id: 'activity-2',
      label: 'Scout Mission',
      statRequirement: {
        allOf: [{ stat: 'agility', min: 7 }],
      },
      tags: ['quest'],
      dangerRating: 5,
    } as ActivityDefinition,
  };

  it('should maintain deterministic queue ordering with same priority', () => {
    const { result } = renderHook(() =>
      useCrewScheduler({
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Enqueue two assignments with same priority
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1');
    });

    // Advance time to ensure different timestamps
    mockDateNow.mockReturnValue(1000010);
    act(() => {
      result.current.enqueueTask('resident-2', 'activity-2');
    });

    const queue = result.current.queue;
    
    // Should have 2 items
    expect(queue).toHaveLength(2);
    
    // Debug: check actual priority scores
    console.log('Queue priorities:', queue.map(q => ({ id: q.residentId, priority: q.priorityScore, timestamp: q.timestamp })));
    
    // First enqueued should come first (earlier timestamp wins tie)
    expect(queue[0].residentId).toBe('resident-1');
    expect(queue[1].residentId).toBe('resident-2');
  });

  it('should sort by priority first, then timestamp for tie-breaking', () => {
    const { result } = renderHook(() =>
      useCrewScheduler({
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Enqueue lower priority assignment first
    act(() => {
      result.current.enqueueTask('resident-2', 'activity-2'); // Lower priority due to higher fatigue
    });

    // Advance time
    mockDateNow.mockReturnValue(1000010);
    
    // Enqueue higher priority assignment second
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1'); // Higher priority due to lower fatigue
    });

    const queue = result.current.queue;
    
    // Should have 2 items
    expect(queue).toHaveLength(2);
    
    // Higher priority should come first despite being enqueued later
    expect(queue[0].residentId).toBe('resident-1');
    expect(queue[0].priorityScore).toBeGreaterThan(queue[1].priorityScore);
    expect(queue[1].residentId).toBe('resident-2');
  });

  it('should maintain deterministic ordering after rebalance', () => {
    const { result } = renderHook(() =>
      useCrewScheduler({
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Enqueue multiple assignments
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1');
    });

    mockDateNow.mockReturnValue(1000010);
    act(() => {
      result.current.enqueueTask('resident-2', 'activity-2');
    });

    mockDateNow.mockReturnValue(1000020);
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-2');
    });

    // Rebalance queue
    act(() => {
      result.current.rebalanceQueue();
    });

    const queue = result.current.queue;
    
    // Should maintain priority ordering with deterministic tie-breaking
    expect(queue).toHaveLength(3);
    
    // Verify ordering is deterministic
    for (let i = 0; i < queue.length - 1; i++) {
      const current = queue[i];
      const next = queue[i + 1];
      
      if (current.priorityScore !== next.priorityScore) {
        expect(current.priorityScore).toBeGreaterThan(next.priorityScore);
      } else {
        expect(current.timestamp).toBeLessThanOrEqual(next.timestamp);
      }
    }
  });

  it('should use deterministic RNG when in test mode', () => {
    const { result } = renderHook(() =>
      useCrewScheduler({
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Process queue multiple times
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1');
      result.current.enqueueTask('resident-2', 'activity-2');
    });

    // Process queue first time
    let decisions1;
    act(() => {
      decisions1 = result.current.processQueue();
    });

    // Reset queue and process again
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1');
      result.current.enqueueTask('resident-2', 'activity-2');
    });

    let decisions2;
    act(() => {
      decisions2 = result.current.processQueue();
    });

    // Decisions should be identical in deterministic mode
    expect(decisions1).toEqual(decisions2);
  });

  it('should respect max queue size with deterministic trimming', () => {
    const customConfig = {
      ...TEST_CREW_SCHEDULER_CONFIG,
      maxQueueSize: 2,
    };

    const { result } = renderHook(() =>
      useCrewScheduler({
        config: customConfig,
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Enqueue more items than max size
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1');
    });

    mockDateNow.mockReturnValue(1000010);
    act(() => {
      result.current.enqueueTask('resident-2', 'activity-2');
    });

    mockDateNow.mockReturnValue(1000020);
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-2');
    });

    const queue = result.current.queue;
    
    // Should be trimmed to max size
    expect(queue).toHaveLength(2);
    
    // Should keep highest priority items
    expect(queue[0].priorityScore).toBeGreaterThanOrEqual(queue[1].priorityScore);
  });

  it('should calculate consistent priority scores', () => {
    const { result } = renderHook(() =>
      useCrewScheduler({
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Calculate factors for same assignment multiple times
    const factors1 = result.current.calculateFactors('resident-1', 'activity-1');
    const factors2 = result.current.calculateFactors('resident-1', 'activity-1');

    // Should be identical
    expect(factors1).toEqual(factors2);

    // Priority scores should be consistent
    const priority1 = calculateAssignmentPriority(
      TEST_CREW_SCHEDULER_CONFIG.priorityWeights,
      TEST_CREW_SCHEDULER_CONFIG.thresholds,
      factors1
    );
    const priority2 = calculateAssignmentPriority(
      TEST_CREW_SCHEDULER_CONFIG.priorityWeights,
      TEST_CREW_SCHEDULER_CONFIG.thresholds,
      factors2
    );

    expect(priority1).toBe(priority2);
  });

  it('should handle queue consumption deterministically', () => {
    const { result } = renderHook(() =>
      useCrewScheduler({
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Enqueue assignments
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1');
    });

    mockDateNow.mockReturnValue(1000010);
    act(() => {
      result.current.enqueueTask('resident-2', 'activity-2');
    });

    const initialQueue = result.current.queue;
    expect(initialQueue).toHaveLength(2);

    // Consume first assignment
    const consumed = result.current.consumeAssignment(initialQueue[0].id);
    
    expect(consumed).toBeTruthy();
    expect(consumed!.id).toBe(initialQueue[0].id);
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].id).toBe(initialQueue[1].id);
  });

  it('should provide accurate queue statistics', () => {
    const { result } = renderHook(() =>
      useCrewScheduler({
        testMode: true,
        villageState: mockVillageState,
        activities: mockActivities,
      })
    );

    // Enqueue assignments
    act(() => {
      result.current.enqueueTask('resident-1', 'activity-1');
    });

    mockDateNow.mockReturnValue(1000010);
    act(() => {
      result.current.enqueueTask('resident-2', 'activity-2');
    });

    const stats = result.current.getQueueStats();
    
    expect(stats.total).toBe(2);
    expect(stats.maxSize).toBe(TEST_CREW_SCHEDULER_CONFIG.maxQueueSize);
    expect(stats.byActivity).toEqual({
      'activity-1': 1,
      'activity-2': 1,
    });
    expect(stats.avgPriority).toBeGreaterThan(0);
  });
});

describe('CrewScheduler - LCG Deterministic RNG', () => {
  it('should produce consistent sequences with same seed', () => {
    const rng1 = createDeterministicRng(42);
    const rng2 = createDeterministicRng(42);

    // Generate sequences
    const sequence1 = Array.from({ length: 10 }, () => rng1());
    const sequence2 = Array.from({ length: 10 }, () => rng2());

    expect(sequence1).toEqual(sequence2);
  });

  it('should produce different sequences with different seeds', () => {
    const rng1 = createDeterministicRng(42);
    const rng2 = createDeterministicRng(1337);

    // Generate sequences
    const sequence1 = Array.from({ length: 10 }, () => rng1());
    const sequence2 = Array.from({ length: 10 }, () => rng2());

    expect(sequence1).not.toEqual(sequence2);
  });

  it('should produce values in valid range [0, 1)', () => {
    const rng = createDeterministicRng(42);
    
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('CrewScheduler - Priority Calculation', () => {
  it('should calculate priority based on config weights', () => {
    const factors = {
      statTagMatch: 0.8,
      fatigue: 0.3,
      questUrgency: 2.0,
      specialization: 0.6,
      difficulty: 0.5,
    };

    const priority = calculateAssignmentPriority(
      TEST_CREW_SCHEDULER_CONFIG.priorityWeights,
      TEST_CREW_SCHEDULER_CONFIG.thresholds,
      factors
    );

    // Should be greater than base weight due to positive factors
    expect(priority).toBeGreaterThan(TEST_CREW_SCHEDULER_CONFIG.priorityWeights.baseWeight);
  });

  it('should apply fatigue penalty when threshold exceeded', () => {
    const factors = {
      statTagMatch: 0.8,
      fatigue: 0.8, // Above threshold of 0.7
      questUrgency: 2.0,
      specialization: 0.6,
      difficulty: 0.5,
    };

    const priority = calculateAssignmentPriority(
      TEST_CREW_SCHEDULER_CONFIG.priorityWeights,
      TEST_CREW_SCHEDULER_CONFIG.thresholds,
      factors
    );

    const basePriority = TEST_CREW_SCHEDULER_CONFIG.priorityWeights.baseWeight +
      factors.statTagMatch * TEST_CREW_SCHEDULER_CONFIG.priorityWeights.statTagMatch +
      (TEST_CREW_SCHEDULER_CONFIG.thresholds.questUrgencyThreshold - factors.questUrgency) * TEST_CREW_SCHEDULER_CONFIG.priorityWeights.questUrgency +
      factors.specialization * TEST_CREW_SCHEDULER_CONFIG.priorityWeights.specializationBonus +
      factors.difficulty * TEST_CREW_SCHEDULER_CONFIG.priorityWeights.difficultyBonus;

    // Should be reduced by fatigue penalty
    expect(priority).toBeLessThan(basePriority);
  });

  it('should apply quest urgency bonus when threshold met', () => {
    const factors = {
      statTagMatch: 0.8,
      fatigue: 0.3,
      questUrgency: 1.0, // Below threshold of 3.0
      specialization: 0.6,
      difficulty: 0.5,
    };

    const priority = calculateAssignmentPriority(
      TEST_CREW_SCHEDULER_CONFIG.priorityWeights,
      TEST_CREW_SCHEDULER_CONFIG.thresholds,
      factors
    );

    // Should include quest urgency bonus
    const expectedUrgencyBonus = (TEST_CREW_SCHEDULER_CONFIG.thresholds.questUrgencyThreshold - factors.questUrgency) * TEST_CREW_SCHEDULER_CONFIG.priorityWeights.questUrgency;
    expect(priority).toBeGreaterThan(TEST_CREW_SCHEDULER_CONFIG.priorityWeights.baseWeight + expectedUrgencyBonus);
  });
});
