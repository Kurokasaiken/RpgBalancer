/**
 * Crew Scheduler Determinism Tests
 * 
 * Comprehensive test suite for crew scheduler determinism, seed strategies,
 * snapshot validation, and reproducible scheduling behavior.
 * 
 * @since NP-013
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';
import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import {
  generateDeterministicSeed,
  createDeterministicQueueState,
  validateDeterminism,
  createSchedulerSnapshot,
  DEFAULT_DETERMINISM_GUARD_CONFIG,
  TEST_DETERMINISM_GUARD_CONFIG,
  validateDeterminismGuardConfig,
  createDeterministicRng,
  calculateAssignmentPriority,
} from '@/balancing/config/idleVillage/crewSchedulerDeterminismGuard';

/**
 * Test data factory
 */
class TestDataFactory {
  static createTestConfig(): CrewSchedulerConfig {
    return {
      priorityWeights: {
        statTagMatch: 10.0,
        fatiguePenalty: -8.0,
        questUrgency: 12.0,
        specializationBonus: 5.0,
        difficultyBonus: 2.0,
        baseWeight: 1.0,
      },
      seeding: {
        lcgSeed: 1337,
        deterministic: true,
      },
      thresholds: {
        fatiguePenaltyThreshold: 0.7,
        questUrgencyThreshold: 3.0,
        statTagMatchThreshold: 0.5,
      },
      maxQueueSize: 50,
      enableDiagnostics: true,
      analytics: {
        enableChannel: true,
      },
    };
  }

  static createTestResidents(): Record<string, ResidentState> {
    return {
      'resident-1': {
        id: 'resident-1',
        name: 'Alice',
        stats: { strength: 10, agility: 8, intelligence: 6 },
        fatigue: 0.3,
        location: 'forest',
        currentActivity: null,
        available: true,
      },
      'resident-2': {
        id: 'resident-2',
        name: 'Bob',
        stats: { strength: 8, agility: 10, intelligence: 7 },
        fatigue: 0.5,
        location: 'mine',
        currentActivity: null,
        available: true,
      },
      'resident-3': {
        id: 'resident-3',
        name: 'Charlie',
        stats: { strength: 6, agility: 7, intelligence: 10 },
        fatigue: 0.2,
        location: 'craft',
        currentActivity: null,
        available: true,
      },
    };
  }

  static createTestActivities(): Record<string, ActivityDefinition> {
    return {
      'forest-work': {
        id: 'forest-work',
        name: 'Forest Work',
        difficulty: 3,
        duration: 100,
        requiredStats: { strength: 5 },
        tags: ['outdoor', 'physical'],
      },
      'mine-work': {
        id: 'mine-work',
        name: 'Mine Work',
        difficulty: 4,
        duration: 120,
        requiredStats: { strength: 7 },
        tags: ['outdoor', 'physical'],
      },
      'craft-work': {
        id: 'craft-work',
        name: 'Craft Work',
        difficulty: 2,
        duration: 80,
        requiredStats: { intelligence: 5 },
        tags: ['indoor', 'mental'],
      },
    };
  }

  static createTestAssignments(): Array<{ residentId: string; activityId: string; timestamp?: number }> {
    return [
      { residentId: 'resident-1', activityId: 'forest-work' },
      { residentId: 'resident-2', activityId: 'mine-work' },
      { residentId: 'resident-3', activityId: 'craft-work' },
    ];
  }
}

describe('Crew Scheduler Determinism Tests', () => {
  describe('Seed Strategy Tests', () => {
    it('should generate fixed seed correctly', () => {
      const seed = generateDeterministicSeed('fixed', 1337);
      expect(seed).toBe(1337);
    });

    it('should generate timestamp-based seed consistently', () => {
      const timestamp = 1640995200000; // Fixed timestamp
      const seed1 = generateDeterministicSeed('timestamp', 1337, { timestamp });
      const seed2 = generateDeterministicSeed('timestamp', 1337, { timestamp });
      
      expect(seed1).toBe(seed2);
      expect(seed1).toBe(((timestamp / 1000) | 0) ^ 1337);
    });

    it('should generate hash-based seed for string input', () => {
      const input = 'test-string';
      const seed1 = generateDeterministicSeed('hash', 1337, { input });
      const seed2 = generateDeterministicSeed('hash', 1337, { input });
      
      expect(seed1).toBe(seed2);
      expect(typeof seed1).toBe('number');
      expect(seed1).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for hash strategy without input', () => {
      expect(() => {
        generateDeterministicSeed('hash', 1337);
      }).toThrow('Hash strategy requires input string');
    });

    it('should generate entropy-based seed', () => {
      const entropy = 0.5;
      const timestamp = 1640995200000;
      const seed = generateDeterministicSeed('entropy', 1337, { entropy, timestamp });
      
      expect(typeof seed).toBe('number');
      expect(seed).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for unknown strategy', () => {
      expect(() => {
        generateDeterministicSeed('unknown' as any, 1337);
      }).toThrow('Unknown seed strategy: unknown');
    });
  });

  describe('Deterministic RNG Tests', () => {
    it('should generate consistent random numbers with same seed', () => {
      const seed = 42;
      const rng1 = createDeterministicRng(seed);
      const rng2 = createDeterministicRng(seed);
      
      // Generate 10 random numbers
      for (let i = 0; i < 10; i++) {
        const value1 = rng1();
        const value2 = rng2();
        expect(value1).toBe(value2);
        expect(value1).toBeGreaterThanOrEqual(0);
        expect(value1).toBeLessThan(1);
      }
    });

    it('should generate different sequences with different seeds', () => {
      const rng1 = createDeterministicRng(42);
      const rng2 = createDeterministicRng(1337);
      
      const values1 = Array.from({ length: 5 }, () => rng1());
      const values2 = Array.from({ length: 5 }, () => rng2());
      
      expect(values1).not.toEqual(values2);
    });

    it('should generate numbers in valid range', () => {
      const rng = createDeterministicRng(42);
      
      for (let i = 0; i < 1000; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('Priority Calculation Tests', () => {
    it('should calculate priority score correctly', () => {
      const weights = TestDataFactory.createTestConfig().priorityWeights;
      const thresholds = TestDataFactory.createTestConfig().thresholds;
      
      const factors = {
        statTagMatch: 0.8,
        fatigue: 0.5,
        questUrgency: 2.0,
        specialization: 0.6,
        difficulty: 0.4,
      };
      
      const score = calculateAssignmentPriority(weights, thresholds, factors);
      
      // Expected calculation:
      // baseWeight: 1.0
      // statTagMatch: 0.8 * 10.0 = 8.0 (above threshold 0.5)
      // fatigue: 0.5 * -8.0 = -4.0 (below threshold 0.7, so no penalty)
      // questUrgency: (3.0 - 2.0) * 12.0 = 12.0 (below threshold 3.0)
      // specialization: 0.6 * 5.0 = 3.0
      // difficulty: 0.4 * 2.0 = 0.8
      // Total: 1.0 + 8.0 + 12.0 + 3.0 + 0.8 = 24.8
      
      expect(score).toBeCloseTo(24.8, 2);
    });

    it('should apply fatigue penalty when threshold exceeded', () => {
      const weights = TestDataFactory.createTestConfig().priorityWeights;
      const thresholds = TestDataFactory.createTestConfig().thresholds;
      
      const factors = {
        statTagMatch: 0.8,
        fatigue: 0.8, // Above threshold
        questUrgency: 2.0,
        specialization: 0.6,
        difficulty: 0.4,
      };
      
      const score = calculateAssignmentPriority(weights, thresholds, factors);
      
      // Should include fatigue penalty: 0.8 * -8.0 = -6.4
      expect(score).toBeLessThan(20); // Less than without penalty
    });

    it('should not apply bonuses when thresholds not met', () => {
      const weights = TestDataFactory.createTestConfig().priorityWeights;
      const thresholds = TestDataFactory.createTestConfig().thresholds;
      
      const factors = {
        statTagMatch: 0.3, // Below threshold
        fatigue: 0.5,
        questUrgency: 4.0, // Above threshold
        specialization: 0.6,
        difficulty: 0.4,
      };
      
      const score = calculateAssignmentPriority(weights, thresholds, factors);
      
      // Should only include baseWeight, specialization, and difficulty
      const expected = 1.0 + 0.6 * 5.0 + 0.4 * 2.0; // 1.0 + 3.0 + 0.8 = 4.8
      expect(score).toBeCloseTo(4.8, 2);
    });
  });

  describe('Deterministic Queue State Tests', () => {
    it('should create consistent queue state with same seed', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue1 = createDeterministicQueueState(seed, config, assignments);
      const queue2 = createDeterministicQueueState(seed, config, assignments);
      
      expect(queue1).toEqual(queue2);
      expect(queue1).toHaveLength(3);
    });

    it('should create different queue states with different seeds', () => {
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue1 = createDeterministicQueueState(42, config, assignments);
      const queue2 = createDeterministicQueueState(1337, config, assignments);
      
      expect(queue1).not.toEqual(queue2);
      expect(queue1).toHaveLength(3);
      expect(queue2).toHaveLength(3);
    });

    it('should sort queue by priority score descending', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue = createDeterministicQueueState(seed, config, assignments);
      
      // Check that queue is sorted by priority score (highest first)
      for (let i = 1; i < queue.length; i++) {
        expect(queue[i - 1].priorityScore).toBeGreaterThanOrEqual(queue[i].priorityScore);
      }
    });

    it('should include all required assignment properties', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue = createDeterministicQueueState(seed, config, assignments);
      
      queue.forEach((assignment, index) => {
        expect(assignment).toHaveProperty('id');
        expect(assignment).toHaveProperty('residentId');
        expect(assignment).toHaveProperty('activityId');
        expect(assignment).toHaveProperty('priorityScore');
        expect(assignment).toHaveProperty('timestamp');
        expect(assignment).toHaveProperty('factors');
        
        expect(assignment.residentId).toBe(assignments[index].residentId);
        expect(assignment.activityId).toBe(assignments[index].activityId);
        expect(typeof assignment.priorityScore).toBe('number');
        expect(typeof assignment.timestamp).toBe('number');
      });
    });
  });

  describe('Determinism Validation Tests', () => {
    it('should validate identical queues as deterministic', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue = createDeterministicQueueState(seed, config, assignments);
      const validation = validateDeterminism(queue, queue, 0.001, seed);
      
      expect(validation.deterministic).toBe(true);
      expect(validation.deviation).toBe(0);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect queue length differences', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue1 = createDeterministicQueueState(seed, config, assignments);
      const queue2 = queue1.slice(0, 2); // Remove one item
      
      const validation = validateDeterminism(queue1, queue2, 0.001, seed);
      
      expect(validation.deterministic).toBe(false);
      expect(validation.errors).toContain('Queue length mismatch: expected 3, got 2');
    });

    it('should detect priority score deviations', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue1 = createDeterministicQueueState(seed, config, assignments);
      const queue2 = JSON.parse(JSON.stringify(queue1));
      queue2[0].priorityScore += 0.01; // Small deviation
      
      const validation = validateDeterminism(queue1, queue2, 0.001, seed);
      
      expect(validation.deterministic).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('priority score deviation');
    });

    it('should detect resident ID differences', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue1 = createDeterministicQueueState(seed, config, assignments);
      const queue2 = JSON.parse(JSON.stringify(queue1));
      queue2[0].residentId = 'different-resident';
      
      const validation = validateDeterminism(queue1, queue2, 0.001, seed);
      
      expect(validation.deterministic).toBe(false);
      expect(validation.errors).toContain('residentId mismatch');
    });

    it('should calculate average deviation correctly', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      const queue1 = createDeterministicQueueState(seed, config, assignments);
      const queue2 = JSON.parse(JSON.stringify(queue1));
      
      // Add small deviations to multiple items
      queue2[0].priorityScore += 0.01;
      queue2[1].priorityScore += 0.02;
      queue2[2].priorityScore += 0.03;
      
      const validation = validateDeterminism(queue1, queue2, 0.1, seed);
      
      expect(validation.deterministic).toBe(true); // Within tolerance
      expect(validation.deviation).toBeCloseTo(0.02, 3); // Average of 0.01, 0.02, 0.03
    });
  });

  describe('Scheduler Snapshot Tests', () => {
    it('should create snapshot with all required properties', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      const queue = createDeterministicQueueState(seed, config, assignments);
      const residents = TestDataFactory.createTestResidents();
      const activities = TestDataFactory.createTestActivities();
      const villageState = { residents, activities, currentTime: Date.now() };
      
      const snapshot = createSchedulerSnapshot(seed, config, queue, villageState);
      
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('seed', seed);
      expect(snapshot).toHaveProperty('config');
      expect(snapshot).toHaveProperty('queue');
      expect(snapshot).toHaveProperty('villageState');
      expect(snapshot).toHaveProperty('validation');
      expect(snapshot).toHaveProperty('entropy');
      
      expect(snapshot.queue).toEqual(queue);
      expect(snapshot.validation.deterministic).toBe(true);
      expect(snapshot.validation.deviation).toBe(0);
    });

    it('should validate determinism in snapshot', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      const queue = createDeterministicQueueState(seed, config, assignments);
      const residents = TestDataFactory.createTestResidents();
      const activities = TestDataFactory.createTestActivities();
      const villageState = { residents, activities, currentTime: Date.now() };
      
      const snapshot = createSchedulerSnapshot(seed, config, queue, villageState);
      
      expect(snapshot.validation.deterministic).toBe(true);
      expect(snapshot.validation.expectedQueue).toEqual(queue);
      expect(snapshot.validation.actualQueue).toEqual(queue);
      expect(snapshot.validation.deviation).toBe(0);
    });

    it('should include entropy information', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      const queue = createDeterministicQueueState(seed, config, assignments);
      const residents = TestDataFactory.createTestResidents();
      const activities = TestDataFactory.createTestActivities();
      const villageState = { residents, activities, currentTime: Date.now() };
      
      const snapshot = createSchedulerSnapshot(seed, config, queue, villageState);
      
      expect(snapshot.entropy).toHaveProperty('randomSeed');
      expect(snapshot.entropy).toHaveProperty('timestamp');
      expect(typeof snapshot.entropy.randomSeed).toBe('number');
      expect(typeof snapshot.entropy.timestamp).toBe('number');
    });
  });

  describe('Configuration Validation Tests', () => {
    it('should validate correct configuration', () => {
      expect(validateDeterminismGuardConfig(DEFAULT_DETERMINISM_GUARD_CONFIG)).toBe(true);
      expect(validateDeterminismGuardConfig(TEST_DETERMINISM_GUARD_CONFIG)).toBe(true);
    });

    it('should reject invalid seed strategy', () => {
      const invalidConfig = {
        ...DEFAULT_DETERMINISM_GUARD_CONFIG,
        seedStrategy: 'invalid' as any,
      };
      
      expect(validateDeterminismGuardConfig(invalidConfig)).toBe(false);
    });

    it('should reject invalid fixed seed', () => {
      const invalidConfig = {
        ...DEFAULT_DETERMINISM_GUARD_CONFIG,
        fixedSeed: -1,
      };
      
      expect(validateDeterminismGuardConfig(invalidConfig)).toBe(false);
    });

    it('should reject invalid max deviation', () => {
      const invalidConfig = {
        ...DEFAULT_DETERMINISM_GUARD_CONFIG,
        maxDeviation: -0.1,
      };
      
      expect(validateDeterminismGuardConfig(invalidConfig)).toBe(false);
    });

    it('should reject invalid snapshot configuration', () => {
      const invalidConfig = {
        ...DEFAULT_DETERMINISM_GUARD_CONFIG,
        snapshot: {
          ...DEFAULT_DETERMINISM_GUARD_CONFIG.snapshot,
          intervalMs: -1,
        },
      };
      
      expect(validateDeterminismGuardConfig(invalidConfig)).toBe(false);
    });
  });

  describe('Reproducibility Tests', () => {
    it('should produce identical results across multiple runs', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = TestDataFactory.createTestAssignments();
      
      // Run the same operation multiple times
      const results = [];
      for (let i = 0; i < 10; i++) {
        const queue = createDeterministicQueueState(seed, config, assignments);
        results.push(JSON.stringify(queue));
      }
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result).toBe(firstResult);
      });
    });

    it('should maintain determinism with different input orders', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      
      const assignments1 = TestDataFactory.createTestAssignments();
      const assignments2 = [...assignments1].reverse(); // Different order
      
      const queue1 = createDeterministicQueueState(seed, config, assignments1);
      const queue2 = createDeterministicQueueState(seed, config, assignments2);
      
      // Queues should be different due to different input order
      expect(queue1).not.toEqual(queue2);
      
      // But both should be sorted by priority
      [queue1, queue2].forEach(queue => {
        for (let i = 1; i < queue.length; i++) {
          expect(queue[i - 1].priorityScore).toBeGreaterThanOrEqual(queue[i].priorityScore);
        }
      });
    });

    it('should handle edge cases gracefully', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      
      // Empty assignments
      const emptyQueue = createDeterministicQueueState(seed, config, []);
      expect(emptyQueue).toHaveLength(0);
      
      // Single assignment
      const singleQueue = createDeterministicQueueState(seed, config, [
        { residentId: 'resident-1', activityId: 'forest-work' }
      ]);
      expect(singleQueue).toHaveLength(1);
      expect(singleQueue[0].residentId).toBe('resident-1');
      expect(singleQueue[0].activityId).toBe('forest-work');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large queues efficiently', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      
      // Create large number of assignments
      const largeAssignments = Array.from({ length: 1000 }, (_, i) => ({
        residentId: `resident-${i % 10}`,
        activityId: `activity-${i % 5}`,
      }));
      
      const startTime = performance.now();
      const queue = createDeterministicQueueState(seed, config, largeAssignments);
      const endTime = performance.now();
      
      expect(queue).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should validate large queues efficiently', () => {
      const seed = 42;
      const config = TestDataFactory.createTestConfig();
      const assignments = Array.from({ length: 1000 }, (_, i) => ({
        residentId: `resident-${i % 10}`,
        activityId: `activity-${i % 5}`,
      }));
      
      const queue = createDeterministicQueueState(seed, config, assignments);
      
      const startTime = performance.now();
      const validation = validateDeterminism(queue, queue, 0.001, seed);
      const endTime = performance.now();
      
      expect(validation.deterministic).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 0.5 seconds
    });
  });
});
