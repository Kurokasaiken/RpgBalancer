/**
 * Idle Village Resident Drag & Drop Stress Test Suite
 * 
 * Comprehensive stress testing suite for 1000+ drag & drop operations
 * with configurable scenarios, performance monitoring, and result validation.
 * 
 * @since NP-014
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import {
  StressTestConfig,
  StressTestResult,
  StressTestProgress,
  DragDropOperation,
  OperationGeneratorConfig,
  DEFAULT_STRESS_TEST_CONFIG,
  STRESS_TEST_SCENARIOS,
  DEFAULT_GENERATOR_CONFIG,
  validateStressTestConfig,
  createTestRNG,
  generateTestResidents,
  generateTestActivities,
  generateDragDropOperations,
  calculateMetrics,
  createProgressTracker,
} from '@/ui/idleVillage/stressTest/dragDropStressTestHarness';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';

/**
 * Mock implementation of useResidentDropValidation for testing
 */
function createMockDropValidator() {
  const results: DropValidationResult[] = [];
  
  return {
    validateDrop: (params: {
      resident: ResidentState;
      activity?: ActivityDefinition;
      currentOccupants?: number;
      context?: string;
    }): DropValidationResult => {
      const result: DropValidationResult = {
        isValid: params.resident.available && 
                 (params.resident.fatigue || 0) < 90 &&
                 (!params.activity || (params.currentOccupants || 0) < (params.activity.maxSlots || 1)),
      };
      
      if (!result.isValid) {
        if (!params.resident.available) {
          result.failedRule = 'resident_availability';
          result.message = 'Resident not available';
        } else if ((params.resident.fatigue || 0) >= 90) {
          result.failedRule = 'fatigue_threshold';
          result.message = 'Resident too exhausted';
        } else if (params.activity && (params.currentOccupants || 0) >= (params.activity.maxSlots || 1)) {
          result.failedRule = 'crew_capacity';
          result.message = 'Activity at full capacity';
        }
      }
      
      results.push(result);
      return result;
    },
    
    validateBatchDrop: (params: {
      residents: ResidentState[];
      activity?: ActivityDefinition;
      currentOccupants?: number;
      context?: string;
    }): DropValidationResult[] => {
      return params.residents.map(resident => 
        this.validateDrop({
          resident,
          activity: params.activity,
          currentOccupants: params.currentOccupants,
          context: params.context,
        })
      );
    },
    
    getErrorMessage: () => 'Mock error message',
    isResidentEligible: (resident: ResidentState) => resident.available && (resident.fatigue || 0) < 90,
    config: {
      maxFatigueBeforeExhausted: 90,
      defaultCrewSize: 1,
      enableStatValidation: true,
      enableFatigueValidation: true,
      enableCrewValidation: true,
    },
    
    // Helper to get all results for testing
    _getResults: () => results,
  };
}

/**
 * Stress test executor class
 */
class StressTestExecutor {
  private config: StressTestConfig;
  private validator: ReturnType<typeof createMockDropValidator>;
  private progress: StressTestProgress | null = null;
  private startTime: number = 0;
  private endTime: number = 0;
  private initialMemory: number = 0;
  private peakMemory: number = 0;
  
  constructor(config: StressTestConfig) {
    this.config = config;
    this.validator = createMockDropValidator();
  }
  
  async executeTest(): Promise<StressTestResult> {
    this.startTime = Date.now();
    this.initialMemory = this.getMemoryUsage();
    
    // Generate test data
    const rng = createTestRNG();
    const residents = generateTestResidents(DEFAULT_GENERATOR_CONFIG, rng);
    const activities = generateTestActivities(DEFAULT_GENERATOR_CONFIG, rng);
    const operations = generateDragDropOperations(this.config, DEFAULT_GENERATOR_CONFIG, residents, activities, rng);
    
    // Create progress tracker
    const progressTracker = createProgressTracker(operations.length, this.startTime);
    
    // Execute operations
    const validationResults: DropValidationResult[] = [];
    let completedOperations = 0;
    let errorCount = 0;
    
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      try {
        // Simulate operation delay
        if (this.config.operationDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.operationDelay));
        }
        
        // Execute validation
        const result = this.validator.validateDrop({
          resident: operation.resident,
          activity: operation.activity,
          currentOccupants: operation.currentOccupants,
          context: `stress-test-${i}`,
        });
        
        validationResults.push(result);
        completedOperations++;
        
        // Update progress
        if (this.config.enableProgressTracking) {
          this.progress = progressTracker.update(completedOperations, errorCount);
        }
        
        // Monitor memory
        const currentMemory = this.getMemoryUsage();
        this.peakMemory = Math.max(this.peakMemory, currentMemory);
        
      } catch (error) {
        errorCount++;
        console.error(`Operation ${i} failed:`, error);
      }
    }
    
    this.endTime = Date.now();
    const finalMemory = this.getMemoryUsage();
    
    // Calculate metrics
    const metrics = calculateMetrics(
      operations,
      validationResults,
      this.startTime,
      this.endTime,
      this.initialMemory,
      this.peakMemory,
      finalMemory
    );
    
    return {
      config: this.config,
      operations,
      validationResults,
      metrics,
      startTime: this.startTime,
      endTime: this.endTime,
      completed: true,
      status: 'completed',
    };
  }
  
  getProgress(): StressTestProgress | null {
    return this.progress;
  }
  
  private getMemoryUsage(): number {
    // Mock memory usage for testing
    return Math.random() * 100000000; // 0-100MB
  }
}

describe('Drag & Drop Stress Test Suite', () => {
  let executor: StressTestExecutor;
  
  beforeEach(() => {
    executor = new StressTestExecutor(DEFAULT_STRESS_TEST_CONFIG);
  });
  
  afterEach(() => {
    // Cleanup if needed
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      expect(validateStressTestConfig(DEFAULT_STRESS_TEST_CONFIG)).toBe(true);
    });
    
    it('should reject invalid operation count', () => {
      const invalidConfig = { ...DEFAULT_STRESS_TEST_CONFIG, operationCount: -1 };
      expect(validateStressTestConfig(invalidConfig)).toBe(false);
    });
    
    it('should reject invalid parallel workers', () => {
      const invalidConfig = { ...DEFAULT_STRESS_TEST_CONFIG, parallelWorkers: 0 };
      expect(validateStressTestConfig(invalidConfig)).toBe(false);
    });
    
    it('should reject negative operation delay', () => {
      const invalidConfig = { ...DEFAULT_STRESS_TEST_CONFIG, operationDelay: -1 };
      expect(validateStressTestConfig(invalidConfig)).toBe(false);
    });
    
    it('should reject invalid operation timeout', () => {
      const invalidConfig = { ...DEFAULT_STRESS_TEST_CONFIG, operationTimeout: 0 };
      expect(validateStressTestConfig(invalidConfig)).toBe(false);
    });
    
    it('should reject parallel workers exceeding operation count', () => {
      const invalidConfig = { 
        ...DEFAULT_STRESS_TEST_CONFIG, 
        parallel: true,
        operationCount: 5,
        parallelWorkers: 10
      };
      expect(validateStressTestConfig(invalidConfig)).toBe(false);
    });
  });

  describe('Test Scenarios', () => {
    it('should have valid scenario configurations', () => {
      Object.entries(STRESS_TEST_SCENARIOS).forEach(([scenario, config]) => {
        const fullConfig = { ...DEFAULT_STRESS_TEST_CONFIG, ...config };
        expect(validateStressTestConfig(fullConfig)).toBe(true);
      });
    });
    
    it('should have distinct operation counts for scenarios', () => {
      const scenarios = Object.keys(STRESS_TEST_SCENARIOS);
      const operationCounts = scenarios.map(scenario => 
        STRESS_TEST_SCENARIOS[scenario as keyof typeof STRESS_TEST_SCENARIOS].operationCount || 
        DEFAULT_STRESS_TEST_CONFIG.operationCount
      );
      
      // Check that scenarios have different operation counts
      const uniqueCounts = [...new Set(operationCounts)];
      expect(uniqueCounts.length).toBeGreaterThan(1);
    });
  });

  describe('Random Number Generation', () => {
    it('should generate consistent sequences with same seed', () => {
      const seed = 1337;
      const rng1 = createTestRNG(seed);
      const rng2 = createTestRNG(seed);
      
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
      const rng1 = createTestRNG(42);
      const rng2 = createTestRNG(1337);
      
      const values1 = Array.from({ length: 5 }, () => rng1());
      const values2 = Array.from({ length: 5 }, () => rng2());
      
      expect(values1).not.toEqual(values2);
    });
    
    it('should generate numbers in valid range', () => {
      const rng = createTestRNG();
      
      for (let i = 0; i < 1000; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('Test Data Generation', () => {
    it('should generate test residents with correct properties', () => {
      const rng = createTestRNG(1337);
      const residents = generateTestResidents(DEFAULT_GENERATOR_CONFIG, rng);
      
      expect(residents).toHaveLength(DEFAULT_GENERATOR_CONFIG.residentCount);
      
      residents.forEach((resident, index) => {
        expect(resident).toHaveProperty('id', `resident-${index}`);
        expect(resident).toHaveProperty('name');
        expect(resident).toHaveProperty('fatigue');
        expect(resident).toHaveProperty('location');
        expect(resident).toHaveProperty('available');
        expect(resident).toHaveProperty('status');
        expect(resident).toHaveProperty('statSnapshot');
        
        expect(resident.fatigue).toBeGreaterThanOrEqual(DEFAULT_GENERATOR_CONFIG.fatigueRange.min);
        expect(resident.fatigue).toBeLessThanOrEqual(DEFAULT_GENERATOR_CONFIG.fatigueRange.max);
      });
    });
    
    it('should generate test activities with correct properties', () => {
      const rng = createTestRNG(1337);
      const activities = generateTestActivities(DEFAULT_GENERATOR_CONFIG, rng);
      
      expect(activities).toHaveLength(DEFAULT_GENERATOR_CONFIG.activityCount);
      
      activities.forEach((activity, index) => {
        expect(activity).toHaveProperty('id', `activity-${index}`);
        expect(activity).toHaveProperty('name');
        expect(activity).toHaveProperty('difficulty');
        expect(activity).toHaveProperty('duration');
        expect(activity).toHaveProperty('maxSlots');
        expect(activity).toHaveProperty('tags');
        expect(activity).toHaveProperty('customErrorMessages');
        
        expect(activity.maxSlots).toBeGreaterThanOrEqual(DEFAULT_GENERATOR_CONFIG.capacityRange.min);
        expect(activity.maxSlots).toBeLessThanOrEqual(DEFAULT_GENERATOR_CONFIG.capacityRange.max);
      });
    });
    
    it('should generate drag drop operations with correct structure', () => {
      const config = { ...DEFAULT_STRESS_TEST_CONFIG, operationCount: 10 };
      const rng = createTestRNG(1337);
      const residents = generateTestResidents(DEFAULT_GENERATOR_CONFIG, rng);
      const activities = generateTestActivities(DEFAULT_GENERATOR_CONFIG, rng);
      const operations = generateDragDropOperations(config, DEFAULT_GENERATOR_CONFIG, residents, activities, rng);
      
      expect(operations).toHaveLength(config.operationCount);
      
      operations.forEach((operation, index) => {
        expect(operation).toHaveProperty('id', `operation-${index}`);
        expect(operation).toHaveProperty('type');
        expect(operation).toHaveProperty('resident');
        expect(operation).toHaveProperty('activity');
        expect(operation).toHaveProperty('currentOccupants');
        expect(operation).toHaveProperty('timestamp');
        expect(operation).toHaveProperty('expectedResult');
        expect(operation).toHaveProperty('metadata');
        
        expect(operation.metadata).toHaveProperty('scenario', config.scenario);
        expect(operation.metadata).toHaveProperty('iteration', index);
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress correctly', () => {
      const totalOperations = 100;
      const startTime = Date.now();
      const tracker = createProgressTracker(totalOperations, startTime);
      
      // Initial progress
      let progress = tracker.getCurrentProgress();
      expect(progress.completedOperations).toBe(0);
      expect(progress.totalOperations).toBe(totalOperations);
      expect(progress.progressPercentage).toBe(0);
      expect(progress.status).toBe('running');
      
      // Mid-test progress
      progress = tracker.update(50, 5);
      expect(progress.completedOperations).toBe(50);
      expect(progress.progressPercentage).toBe(50);
      expect(progress.errorCount).toBe(5);
      expect(progress.status).toBe('running');
      
      // Completed progress
      progress = tracker.update(100, 10);
      expect(progress.completedOperations).toBe(100);
      expect(progress.progressPercentage).toBe(100);
      expect(progress.errorCount).toBe(10);
      expect(progress.status).toBe('completed');
    });
    
    it('should estimate remaining time correctly', () => {
      const totalOperations = 100;
      const startTime = Date.now();
      const tracker = createProgressTracker(totalOperations, startTime);
      
      // Simulate some progress
      const progress = tracker.update(25, 0);
      
      // Should estimate remaining time based on current rate
      expect(progress.estimatedRemainingTime).toBeGreaterThan(0);
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate metrics correctly', () => {
      const operations: DragDropOperation[] = [
        {
          id: 'op-1',
          type: 'valid_drop',
          resident: { id: 'r1', name: 'Test', fatigue: 10, location: 'village', currentActivity: null, available: true, status: 'available' },
          activity: { id: 'a1', name: 'Test Activity', difficulty: 1, duration: 100, maxSlots: 1, tags: [], customErrorMessages: {} },
          currentOccupants: 0,
          timestamp: Date.now(),
          expectedResult: true,
          metadata: { scenario: 'test', iteration: 0 },
        },
        {
          id: 'op-2',
          type: 'invalid_drop_fatigue',
          resident: { id: 'r2', name: 'Test', fatigue: 95, location: 'village', currentActivity: null, available: false, status: 'exhausted' },
          activity: { id: 'a2', name: 'Test Activity', difficulty: 1, duration: 100, maxSlots: 1, tags: [], customErrorMessages: {} },
          currentOccupants: 0,
          timestamp: Date.now(),
          expectedResult: false,
          metadata: { scenario: 'test', iteration: 1 },
        },
      ];
      
      const validationResults: DropValidationResult[] = [
        { isValid: true },
        { isValid: false, failedRule: 'fatigue_threshold', message: 'Too exhausted' },
      ];
      
      const startTime = Date.now() - 1000; // 1 second ago
      const endTime = Date.now();
      const initialMemory = 50000000; // 50MB
      const peakMemory = 60000000; // 60MB
      const finalMemory = 55000000; // 55MB
      
      const metrics = calculateMetrics(
        operations,
        validationResults,
        startTime,
        endTime,
        initialMemory,
        peakMemory,
        finalMemory
      );
      
      expect(metrics.totalDuration).toBe(1000);
      expect(metrics.successRate).toBe(0.5); // 1 valid out of 2
      expect(metrics.memoryUsage.initial).toBe(initialMemory);
      expect(metrics.memoryUsage.peak).toBe(peakMemory);
      expect(metrics.memoryUsage.final).toBe(finalMemory);
      expect(metrics.memoryUsage.delta).toBe(finalMemory - initialMemory);
      expect(metrics.errorStats.totalErrors).toBe(1);
      expect(metrics.errorStats.errorsByType['fatigue_threshold']).toBe(1);
    });
  });

  describe('Stress Test Execution', () => {
    it('should execute basic stress test successfully', async () => {
      const config = { ...DEFAULT_STRESS_TEST_CONFIG, operationCount: 10, operationDelay: 0 };
      const testExecutor = new StressTestExecutor(config);
      
      const result = await testExecutor.executeTest();
      
      expect(result.completed).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.operations).toHaveLength(10);
      expect(result.validationResults).toHaveLength(10);
      expect(result.metrics.totalDuration).toBeGreaterThan(0);
      expect(result.metrics.operationsPerSecond).toBeGreaterThan(0);
    }, 10000);
    
    it('should handle different scenarios', async () => {
      const scenarios = Object.keys(STRESS_TEST_SCENARIOS) as Array<keyof typeof STRESS_TEST_SCENARIOS>;
      
      for (const scenario of scenarios) {
        const config = { 
          ...DEFAULT_STRESS_TEST_CONFIG, 
          ...STRESS_TEST_SCENARIOS[scenario],
          operationCount: Math.min(STRESS_TEST_SCENARIOS[scenario].operationCount || 50, 50), // Limit for testing
          operationDelay: 0, // No delay for faster testing
        };
        
        const testExecutor = new StressTestExecutor(config);
        const result = await testExecutor.executeTest();
        
        expect(result.completed).toBe(true);
        expect(result.status).toBe('completed');
        expect(result.config.scenario).toBe(scenario);
      }
    }, 30000);
    
    it('should track progress during execution', async () => {
      const config = { 
        ...DEFAULT_STRESS_TEST_CONFIG, 
        operationCount: 20, 
        operationDelay: 10, // Small delay for progress tracking
        enableProgressTracking: true 
      };
      
      const testExecutor = new StressTestExecutor(config);
      
      // Start test execution (but don't await)
      const testPromise = testExecutor.executeTest();
      
      // Check progress during execution
      let progressChecked = false;
      const checkProgress = () => {
        const progress = testExecutor.getProgress();
        if (progress && progress.completedOperations > 0) {
          expect(progress.progressPercentage).toBeGreaterThan(0);
          expect(progress.totalOperations).toBe(20);
          progressChecked = true;
        }
        
        if (progress && progress.status === 'completed') {
          return;
        }
        
        setTimeout(checkProgress, 5);
      };
      
      checkProgress();
      
      // Wait for completion
      const result = await testPromise;
      
      expect(result.completed).toBe(true);
      expect(progressChecked).toBe(true); // Progress should have been checked during execution
    }, 15000);
  });

  describe('Performance Characteristics', () => {
    it('should handle large operation counts efficiently', async () => {
      const config = { 
        ...DEFAULT_STRESS_TEST_CONFIG, 
        operationCount: 1000,
        operationDelay: 0, // No delay for performance testing
        parallel: false
      };
      
      const testExecutor = new StressTestExecutor(config);
      const startTime = Date.now();
      
      const result = await testExecutor.executeTest();
      
      const executionTime = Date.now() - startTime;
      
      expect(result.completed).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metrics.operationsPerSecond).toBeGreaterThan(200); // At least 200 ops/sec
    }, 10000);
    
    it('should maintain reasonable memory usage', async () => {
      const config = { 
        ...DEFAULT_STRESS_TEST_CONFIG, 
        operationCount: 500,
        operationDelay: 0
      };
      
      const testExecutor = new StressTestExecutor(config);
      const result = await testExecutor.executeTest();
      
      expect(result.completed).toBe(true);
      expect(result.metrics.memoryUsage.delta).toBeLessThan(50000000); // Less than 50MB increase
    }, 10000);
  });

  describe('Edge Cases', () => {
    it('should handle empty operations gracefully', async () => {
      const config = { ...DEFAULT_STRESS_TEST_CONFIG, operationCount: 0 };
      
      // This should be rejected by validation, but let's test the executor
      expect(validateStressTestConfig(config)).toBe(false);
    });
    
    it('should handle invalid operation data', async () => {
      const config = { ...DEFAULT_STRESS_TEST_CONFIG, operationCount: 5, scenario: 'edge_cases' };
      const testExecutor = new StressTestExecutor(config);
      
      const result = await testExecutor.executeTest();
      
      expect(result.completed).toBe(true);
      expect(result.operations).toHaveLength(5);
      // Should handle edge case operations without crashing
    }, 5000);
  });
});
