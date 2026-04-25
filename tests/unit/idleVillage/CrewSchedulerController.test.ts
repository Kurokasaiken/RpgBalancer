/**
 * Crew Scheduler Controller Unit Tests – WS3 Deterministic Queue
 * 
 * Tests the deterministic priority queue behavior, priority calculations,
 * and integration with MapDiagnostics. Uses fake timers for deterministic
 * time-based testing.
 * 
 * @since WS3
 */

import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import type { ActivityDefinition } from '../../../src/balancing/config/idleVillage/types';
import type { ResidentState } from '../../../src/engine/game/idleVillage/TimeEngine';
import { useCrewScheduler } from '../../../src/ui/idleVillage/hooks/useCrewScheduler';
import { createCrewSchedulerController, validateSchedulingPrerequisites, shouldRebalanceQueue } from '../../../src/ui/idleVillage/controllers/CrewSchedulerController';
import type { CrewSchedulerConfig } from '../../../src/balancing/config/idleVillage/crewScheduler';
import { DEFAULT_CREW_SCHEDULER_CONFIG } from '../../../src/balancing/config/idleVillage/crewScheduler';

// Mock diagnostics
vi.mock('../../../src/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    log: vi.fn(),
    getLogs: vi.fn(() => []),
    clear: vi.fn(),
  })),
}));

describe('CrewSchedulerController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-11T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const mockResident: ResidentState = {
    id: 'resident-1',
    displayName: 'Test Resident',
    status: 'available',
    currentHp: 100,
    maxHp: 100,
    fatigue: 0.3,
    isInjured: false,
    injuryRecoveryTime: 0,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  };

  const mockActivity: ActivityDefinition = {
    id: 'job-training',
    label: 'Training',
    description: 'Physical training',
    tags: ['job'],
    slotTags: ['village_job'],
    resolutionEngineId: 'job',
    statRequirement: {
      allOf: ['strength'],
      label: 'Requires strength',
    },
    dangerRating: 3,
  };

  const mockVillageState = {
    residents: {
      'resident-1': mockResident,
      'resident-2': { ...mockResident, id: 'resident-2', fatigue: 0.95 }, // High fatigue for validation test
    },
    activities: {},
    currentTime: 100,
  };

  const mockActivities = {
    'job-training': mockActivity,
    'job-rest': {
      ...mockActivity,
      id: 'job-rest',
      label: 'Rest',
      tags: ['job'],
      statRequirement: undefined,
      dangerRating: 0,
    },
  };

  const defaultOptions = {
    villageState: mockVillageState,
    activities: mockActivities,
  };

  describe('Deterministic Priority Queue', () => {
    it('should maintain priority order when enqueuing tasks', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      // Enqueue tasks with different priorities
      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
        controller.enqueueTask('resident-2', 'job-rest');
        controller.enqueueTask('resident-1', 'job-rest');
      });

      const queue = controller.getQueue();
      expect(queue).toHaveLength(3);
      
      // Higher priority tasks should be first
      expect(queue[0].activityId).toBe('job-training');
      expect(queue[0].priorityScore).toBeGreaterThan(queue[1].priorityScore);
    });

    it('should process queue and make scheduling decisions', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
        controller.enqueueTask('resident-2', 'job-rest');
      });

      const decisions = controller.processQueue();
      expect(decisions).toHaveLength(2);
      expect(decisions[0].assigned).toBe(true);
      expect(decisions[1].assigned).toBe(true);
    });

    it('should respect fatigue thresholds in priority calculation', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const factors1 = controller.calculateFactors('resident-1', 'job-training');
      const factors2 = controller.calculateFactors('resident-2', 'job-training');

      // Resident with higher fatigue should have lower priority
      expect(factors2.fatigue).toBeGreaterThan(factors1.fatigue);
    });

    it('should use deterministic seeding in test mode', () => {
      const { result } = renderHook(() => 
        useCrewScheduler({ ...defaultOptions, testMode: true })
      );
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const config = controller.getConfig();
      expect(config.seeding.deterministic).toBe(true);
      expect(config.seeding.lcgSeed).toBe(42);
    });

    it('should trim queue when exceeding max size', () => {
      const customConfig: Partial<CrewSchedulerConfig> = {
        maxQueueSize: 2,
      };
      const { result } = renderHook(() => 
        useCrewScheduler({ ...defaultOptions, config: customConfig })
      );
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
        controller.enqueueTask('resident-2', 'job-rest');
        controller.enqueueTask('resident-1', 'job-rest'); // This should be dropped
      });

      const queue = controller.getQueue();
      expect(queue).toHaveLength(2);
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate higher priority for stat-matched activities', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const matchedFactors = controller.calculateFactors('resident-1', 'job-training');
      const unmatchedFactors = controller.calculateFactors('resident-1', 'job-rest');

      expect(matchedFactors.statTagMatch).toBeGreaterThan(unmatchedFactors.statTagMatch);
    });

    it('should apply fatigue penalty correctly', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const lowFatigueFactors = controller.calculateFactors('resident-1', 'job-training');
      const highFatigueFactors = controller.calculateFactors('resident-2', 'job-training');

      expect(lowFatigueFactors.fatigue).toBeLessThan(highFatigueFactors.fatigue);
    });

    it('should consider activity difficulty in priority', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const factors = controller.calculateFactors('resident-1', 'job-training');
      expect(factors.difficulty).toBe(0.3); // dangerRating 3 / 10
    });
  });

  describe('Queue Management', () => {
    it('should rebalance queue with updated priorities', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
        controller.enqueueTask('resident-2', 'job-rest');
      });

      const originalQueue = controller.getQueue();
      const originalTimestamps = originalQueue.map(a => a.timestamp);

      // Advance time and rebalance
      vi.advanceTimersByTime(1000);
      
      act(() => {
        controller.rebalanceQueue();
      });

      const rebalancedQueue = controller.getQueue();
      expect(rebalancedQueue).toHaveLength(2);
      
      // Timestamps should be updated
      const newTimestamps = rebalancedQueue.map(a => a.timestamp);
      newTimestamps.forEach((timestamp, index) => {
        expect(timestamp).toBeGreaterThan(originalTimestamps[index]);
      });
    });

    it('should consume assignments manually', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
        controller.enqueueTask('resident-2', 'job-rest');
      });

      const queue = controller.getQueue();
      expect(queue).toHaveLength(2);
      
      const assignmentId = queue[0].id;
      const consumed = controller.consumeAssignment(assignmentId);

      expect(consumed).toBeTruthy();
      expect(consumed?.id).toBe(assignmentId);
      expect(controller.getQueue()).toHaveLength(1);
    });

    it('should provide accurate queue statistics', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
        controller.enqueueTask('resident-2', 'job-rest');
        controller.enqueueTask('resident-1', 'job-training');
      });

      const stats = controller.getQueueStats();
      expect(stats.total).toBe(3);
      expect(stats.avgPriority).toBeGreaterThan(0);
      expect(stats.byActivity['job-training']).toBe(2);
      expect(stats.byActivity['job-rest']).toBe(1);
      expect(stats.maxSize).toBe(DEFAULT_CREW_SCHEDULER_CONFIG.maxQueueSize);
    });
  });

  describe('Validation Functions', () => {
    it('should validate scheduling prerequisites correctly', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      // Valid assignment
      const validResult = validateSchedulingPrerequisites(controller, 'resident-1', 'job-training');
      expect(validResult.valid).toBe(true);

      // Invalid due to high fatigue
      const invalidResult = validateSchedulingPrerequisites(controller, 'resident-2', 'job-training');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.reason).toBe('Resident too exhausted');
    });

    it('should recommend rebalance when queue is full', () => {
      const customConfig: Partial<CrewSchedulerConfig> = {
        maxQueueSize: 2,
      };
      const { result } = renderHook(() => 
        useCrewScheduler({ ...defaultOptions, config: customConfig })
      );
      const controller = createCrewSchedulerController({ ...defaultOptions, config: customConfig }, result.current);

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
        controller.enqueueTask('resident-2', 'job-rest');
      });

      expect(shouldRebalanceQueue(controller)).toBe(false);

      act(() => {
        controller.enqueueTask('resident-1', 'job-rest');
      });

      expect(shouldRebalanceQueue(controller)).toBe(true);
    });

    it('should recommend rebalance for old assignments', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
      });

      // Wait for assignment to be created, then advance time
      vi.advanceTimersByTime(6 * 60 * 1000);

      expect(shouldRebalanceQueue(controller)).toBe(true);
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce identical results with same seed', () => {
      const options1 = { ...defaultOptions, testMode: true };
      const options2 = { ...defaultOptions, testMode: true };

      const { result: result1 } = renderHook(() => useCrewScheduler(options1));
      const { result: result2 } = renderHook(() => useCrewScheduler(options2));

      const controller1 = createCrewSchedulerController(options1, result1.current);
      const controller2 = createCrewSchedulerController(options2, result2.current);

      act(() => {
        controller1.enqueueTask('resident-1', 'job-training');
        controller2.enqueueTask('resident-1', 'job-training');
      });

      const factors1 = controller1.calculateFactors('resident-1', 'job-training');
      const factors2 = controller2.calculateFactors('resident-1', 'job-training');

      expect(factors1).toEqual(factors2);
      
      const queue1 = controller1.getQueue();
      const queue2 = controller2.getQueue();
      expect(queue1).toHaveLength(1);
      expect(queue2).toHaveLength(1);
      expect(queue1[0].priorityScore).toBe(queue2[0].priorityScore);
    });

    it('should handle time-based determinism with fake timers', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const initialTime = Date.now();

      act(() => {
        controller.enqueueTask('resident-1', 'job-training');
      });

      const queue = controller.getQueue();
      expect(queue).toHaveLength(1);
      const assignment = queue[0];
      expect(assignment.timestamp).toBe(initialTime);

      // Advance time and create new assignment
      vi.advanceTimersByTime(5000);

      act(() => {
        controller.enqueueTask('resident-2', 'job-rest');
      });

      const newQueue = controller.getQueue();
      expect(newQueue).toHaveLength(2);
      const newAssignment = newQueue.find(a => a.residentId === 'resident-2');
      expect(newAssignment?.timestamp).toBe(initialTime + 5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing resident gracefully', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const factors = controller.calculateFactors('nonexistent', 'job-training');
      expect(factors.statTagMatch).toBe(0);
      expect(factors.fatigue).toBe(1);
    });

    it('should handle missing activity gracefully', () => {
      const { result } = renderHook(() => useCrewScheduler(defaultOptions));
      const controller = createCrewSchedulerController(defaultOptions, result.current);

      const factors = controller.calculateFactors('resident-1', 'nonexistent');
      expect(factors.statTagMatch).toBe(0);
      expect(factors.fatigue).toBe(1);
    });

    it('should fall back to default config on invalid config', () => {
      const invalidConfig: Partial<CrewSchedulerConfig> = {
        maxQueueSize: -1, // Invalid
      };

      const { result } = renderHook(() => 
        useCrewScheduler({ ...defaultOptions, config: invalidConfig })
      );

      const config = result.current.config;
      expect(config.maxQueueSize).toBe(DEFAULT_CREW_SCHEDULER_CONFIG.maxQueueSize);
    });
  });
});
