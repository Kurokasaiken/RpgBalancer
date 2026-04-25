/**
 * Unit tests for Persistence Chaos Harness
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PersistenceChaosHarness } from '../../../src/shared/testing/PersistenceChaosHarness';
import {
  DEFAULT_CHAOS_HARNESS_CONFIG,
  CHAOS_HARNESS_PRESETS,
  ChaosScenario,
  FaultType,
  FaultSeverity,
  ChaosOperationResult,
  ChaosScenarioResult,
} from '../../../src/shared/testing/PersistenceChaosConfig';

// Mock PersistenceService
vi.mock('../../../src/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  clearData: vi.fn(),
}));

// Mock sandboxDiagnostics
vi.mock('../../../src/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

const mockPersistenceService = vi.mocked('../../../src/shared/persistence/PersistenceService');
const mockDiagnostics = vi.mocked('../../../src/ui/idleVillage/utils/sandboxDiagnostics');

describe('PersistenceChaosHarness', () => {
  let harness: PersistenceChaosHarness;
  const testNamespace = 'test-chaos-namespace';

  beforeEach(() => {
    harness = new PersistenceChaosHarness({}, testNamespace);
    vi.clearAllMocks();
  });

  afterEach(() => {
    harness.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const state = harness.getState();
      
      expect(state.config).toEqual(DEFAULT_CHAOS_HARNESS_CONFIG);
      expect(state.status).toBe('idle');
      expect(state.activeScenarios.size).toBe(0);
      expect(state.operationHistory).toEqual([]);
      expect(state.scenarioResults).toEqual([]);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        settings: {
          enabled: false,
          verbose: false,
          maxConcurrentScenarios: 5,
        },
      };
      
      const customHarness = new PersistenceChaosHarness(customConfig, testNamespace);
      const state = customHarness.getState();
      
      expect(state.config.settings.enabled).toBe(false);
      expect(state.config.settings.maxConcurrentScenarios).toBe(5);
    });

    it('should use custom namespace', () => {
      const customHarness = new PersistenceCharnessHarness({}, 'custom-namespace');
      
      // Test that namespace is used in operations
      expect(customHarness['namespace']).toBe('custom-namespace');
    });
  });

  describe('Scenario Management', () => {
    it('should start a valid scenario', async () => {
      const scenario = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0];
      
      await harness.startScenario(scenario.id);
      
      const state = harness.getState();
      expect(state.activeScenarios.has(scenario.id)).toBe(true);
      expect(state.status).toBe('running');
    });

    it('should throw error for invalid scenario', async () => {
      await expect(harness.startScenario('invalid-scenario')).rejects.toThrow(
        'Scenario invalid-scenario not found'
      );
    });

    it('should throw error for disabled scenario', async () => {
      const disabledScenario = {
        ...DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0],
        enabled: false,
      };
      
      // Mock the config to return disabled scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [disabledScenario],
        },
      });
      
      await expect(harness.startScenario(disabledScenario.id)).rejects.toThrow(
        'Scenario basic-latency is disabled'
      );
    });

    it('should throw error for already active scenario', async () => {
      const scenario = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0];
      
      await harness.startScenario(scenario.id);
      await expect(harness.startScenario(scenario.id)).rejects.toThrow(
        `Scenario ${scenario.id} is already active`
      );
    });

    it('should throw error when max concurrent scenarios reached', async () => {
      const scenarios = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios.slice(0, 3);
      
      // Mock maxConcurrentScenarios to 2
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          settings: {
            ...harness.getState().config.settings,
            maxConcurrentScenarios: 2,
          },
        },
      });
      
      await harness.startScenario(scenarios[0].id);
      await harness.startScenario(scenarios[1].id);
      
      await expect(harness.startScenario(scenarios[2].id)).rejects.toThrow(
        'Maximum concurrent scenarios reached'
      );
    });

    it('should stop an active scenario', async () => {
      const scenario = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0];
      
      await harness.startScenario(scenario.id);
      await harness.stopScenario(scenario.id);
      
      const state = harness.getState();
      expect(state.activeScenarios.has(scenario.id)).toBe(false);
    });

    it('should throw error for inactive scenario', async () => {
      await expect(harness.stopScenario('inactive-scenario')).rejects.toThrow(
        'Scenario inactive-scenario is not active'
      );
    });

    it('should stop all active scenarios', async () => {
      const scenarios = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios.slice(0, 2);
      
      await harness.startScenario(scenarios[0].id);
      await harness.startScenario(scenarios[1].id);
      
      await harness.stopAllScenarios();
      
      const state = harness.getState();
      expect(state.activeScenarios.size).toBe(0);
      expect(state.status).toBe('idle');
    });
  });

  describe('Operations', () => {
    beforeEach(() => {
      // Mock successful operations
      mockPersistenceService.saveData.mockResolvedValue(undefined);
      mockPersistenceService.loadData.mockResolvedValue(null);
      mockPersistenceService.clearData.mockResolvedValue(undefined);
    });

    it('should execute save operation successfully', async () => {
      const result = await harness.saveData('test-key', { data: 'test' });
      
      expect(result).toBeUndefined();
      expect(mockPersistenceService.saveData).toHaveBeenCalledWith(
        `${testNamespace}:test-key`,
        { data: 'test' }
      );
    });

    it('should execute load operation successfully', async () => {
      const testData = { data: 'test' };
      mockPersistenceService.loadData.mockResolvedValue(testData);
      
      const result = await harness.loadData('test-key');
      
      expect(result).toEqual(testData);
      expect(mockPersistenceService.loadData).toHaveBeenCalledWith(
        `${testNamespace}:test-key`
      );
    });

    it('should execute clear operation successfully', async () => {
      const result = await harness.clearData('test-key');
      
      expect(result).toBeUndefined();
      expect(mockPersistenceService.clearData).toHaveBeenCalledWith(
        `${testNamespace}:test-key`
      );
    });

    it('should track operation metrics', async () => {
      await harness.saveData('test-key-1', { data: 'test1' });
      await harness.saveData('test-key-2', { data: 'test2' });
      
      const state = harness.getState();
      expect(state.metrics.totalOperations).toBe(2);
      expect(state.metrics.successfulOperations).toBe(2);
      expect(state.metrics.failedOperations).toBe(0);
      expect(state.operationHistory).toHaveLength(2);
    });
  });

  describe('Fault Injection', () => {
    beforeEach(() => {
      // Mock successful operations
      mockPersistenceService.saveData.mockResolvedValue(undefined);
      mockPersistenceService.loadData.mockResolvedValue(null);
    });

    it('should inject latency fault', async () => {
      const scenario = {
        id: 'latency-test',
        name: 'Latency Test',
        description: 'Test latency injection',
        faults: [
          {
            type: 'latency' as FaultType,
            severity: 'medium' as FaultSeverity,
            probability: 1.0, // Always inject
            duration: 1000,
            targetOperations: ['save'],
            parameters: {
              minDelay: 100,
              maxDelay: 200,
              distribution: 'fixed' as const,
              jitter: 0,
            },
            enabled: true,
          },
        ],
        duration: 2000,
        warmupPeriod: 0,
        cooldownPeriod: 0,
        namespace: testNamespace,
        enabled: true,
      };
      
      // Mock config to return our test scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [scenario],
        },
      });
      
      const startTime = Date.now();
      await harness.startScenario(scenario.id);
      await harness.saveData('test-key', { data: 'test' });
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(300); // Should be around 100-200ms
      
      await harness.stopScenario(scenario.id);
    });

    it('should inject failure fault', async () => {
      const scenario = {
        id: 'failure-test',
        name: 'Failure Test',
        description: 'Test failure injection',
        faults: [
          {
            type: 'failure' as FaultType,
            severity: 'high' as FaultSeverity,
            probability: 1.0, // Always inject
            duration: 1000,
            targetOperations: ['save'],
            parameters: {
              errorType: 'network' as const,
              message: 'Simulated network failure',
              code: 'NETWORK_ERROR',
              autoRetry: false,
              retryAttempts: 0,
            },
            enabled: true,
          },
        ],
        duration: 2000,
        warmupPeriod: 0,
        cooldownPeriod: 0,
        namespace: testNamespace,
        enabled: true,
      };
      
      // Mock config to return our test scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [scenario],
        },
      });
      
      await harness.startScenario(scenario.id);
      
      await expect(harness.saveData('test-key', { data: 'test' })).rejects.toThrow(
        'Simulated network failure'
      );
      
      const state = harness.getState();
      expect(state.metrics.failedOperations).toBe(1);
      expect(state.metrics.errorRate).toBe(1); // 100% error rate
      
      await harness.stopScenario(scenario.id);
    });

    it('should inject corruption fault', async () => {
      const scenario = {
        id: 'corruption-test',
        name: 'Corruption Test',
        description: 'Test corruption injection',
        faults: [
          {
            type: 'corruption' as FaultType,
            severity: 'critical' as FaultSeverity,
            probability: 1.0, // Always inject
            duration: 1000,
            targetOperations: ['load'],
            parameters: {
              corruptionType: 'modify' as const,
              corruptionPercentage: 0.5,
              preserveStructure: true,
            },
            enabled: true,
          },
        ],
        duration: 2000,
        warmupPeriod: 0,
        cooldownPeriod: 0,
        namespace: testNamespace,
        enabled: true,
      };
      
      // Mock config to return our test scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [scenario],
        },
      });
      
      const originalData = { data: 'test', value: 123 };
      const corruptedData = { data: 'tset', value: 321 }; // Reversed string and modified number
      
      mockPersistenceService.loadData.mockResolvedValue(corruptedData);
      
      await harness.startScenario(scenario.id);
      const result = await harness.loadData('test-key');
      
      expect(result).toEqual(corruptedData);
      expect(result).not.toEqual(originalData);
      
      await harness.stopScenario(scenario.id);
    });

    it('should inject timeout fault', async () => {
      const scenario = {
        id: 'timeout-test',
        name: 'Timeout Test',
        description: 'Test timeout injection',
        faults: [
          {
            type: 'timeout' as FaultType,
            severity: 'high' as FaultSeverity,
            probability: 1.0, // Always inject
            duration: 1000,
            targetOperations: ['save'],
            parameters: {
              timeout: 100,
              partialTimeout: false,
              timeoutBehavior: 'timeout' as const,
            },
            enabled: true,
          },
        ],
        duration: 2000,
        warmupPeriod: 0,
        cooldownPeriod: 0,
        namespace: testNamespace,
        enabled: true,
      };
      
      // Mock config to return our test scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [scenario],
        },
      });
      
      await harness.startScenario(scenario.id);
      
      await expect(harness.saveData('test-key', { data: 'test' })).rejects.toThrow(
        'Operation timeout after 100ms'
      );
      
      await harness.stopScenario(scenario.id);
    });
  });

  describe('Presets', () => {
    it('should apply light preset', () => {
      harness.applyPreset('light');
      
      const state = harness.getState();
      expect(state.config.scenarios).toHaveLength(1);
      expect(state.config.scenarios[0].faults[0].probability).toBe(0.1);
      expect(state.config.settings.verbose).toBe(false);
    });

    it('should apply medium preset', () => {
      harness.applyPreset('medium');
      
      const state = harness.getState();
      expect(state.config.scenarios).toHaveLength(3);
      expect(state.config.scenarios.some(s => s.id === 'basic-latency')).toBe(true);
      expect(state.config.scenarios.some(s => s.id === 'failure-injection')).toBe(true);
      expect(state.config.scenarios.some(s => s.id === 'data-corruption')).toBe(true);
    });

    it('should apply heavy preset', () => {
      harness.applyPreset('heavy');
      
      const state = harness.getState();
      expect(state.config.scenarios).toHaveLength(5);
      expect(state.config.settings.maxConcurrentScenarios).toBe(5);
    });

    it('should apply performance preset', () => {
      harness.applyPreset('performance');
      
      const state = harness.getState();
      expect(state.config.scenarios).toHaveLength(2);
      expect(state.config.kpiConfig.trackLatency).toBe(true);
      expect(state.config.kpiConfig.trackResourceUsage).toBe(true);
      expect(state.config.kpiConfig.trackErrors).toBe(false);
    });

    it('should apply reliability preset', () => {
      harness.applyPreset('reliability');
      
      const state = harness.getState();
      expect(state.config.scenarios).toHaveLength(3);
      expect(state.config.kpiConfig.trackSuccessRate).toBe(true);
      expect(state.config.kpiConfig.trackErrors).toBe(true);
      expect(state.config.kpiConfig.trackDataIntegrity).toBe(true);
    });
  });

  describe('Export Results', () => {
    beforeEach(() => {
      // Mock some operation history
      const mockOperations: ChaosOperationResult[] = [
        {
          operation: 'save',
          success: true,
          duration: 100,
          timestamp: Date.now() - 1000,
          injectedFaults: ['latency'],
        },
        {
          operation: 'load',
          success: false,
          duration: 200,
          timestamp: Date.now() - 500,
          error: {
            type: 'Error',
            message: 'Test error',
          },
          injectedFaults: ['failure'],
        },
      ];
      
      vi.spyOn(harness, 'getOperationHistory').mockReturnValue(mockOperations);
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        operationHistory: mockOperations,
        metrics: {
          totalOperations: 2,
          successfulOperations: 1,
          failedOperations: 1,
          totalFaultsInjected: 2,
          averageLatency: 150,
          maxLatency: 200,
          minLatency: 100,
          errorRate: 0.5,
          dataIntegrityIssues: 0,
          resourceExhaustionEvents: 0,
          cascadeEvents: 0,
        },
      });
    });

    it('should export results as JSON', () => {
      const config = {
        includeRawResults: true,
        includeSummary: true,
        includeKPI: true,
        includeFaults: true,
        format: 'json' as const,
      };
      
      const result = harness.exportResults(config);
      
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('operations');
      expect(parsed).toHaveProperty('metrics');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed.operations).toHaveLength(2);
    });

    it('should export results as CSV', () => {
      const config = {
        includeRawResults: true,
        includeSummary: false,
        includeKPI: false,
        includeFaults: false,
        format: 'csv' as const,
      };
      
      const result = harness.exportResults(config);
      
      const lines = result.split('\n');
      expect(lines[0]).toBe('Timestamp,Operation,Success,Duration,Error,InjectedFaults');
      expect(lines[1]).toContain('save');
      expect(lines[2]).toContain('load');
    });

    it('should export results as markdown', () => {
      const config = {
        includeRawResults: false,
        includeSummary: true,
        includeKPI: true,
        includeFaults: false,
        format: 'markdown' as const,
      };
      
      const result = harness.exportResults(config);
      
      expect(result).toContain('# Persistence Chaos Monkey Results');
      expect(result).toContain('**Total Operations:** 2');
      expect(result).toContain('**Success Rate:** 50.00%');
      expect(result).toContain('**Average Latency:** 150.00ms');
    });

    it('should filter by time range', () => {
      const config = {
        includeRawResults: true,
        includeSummary: false,
        includeKPI: false,
        includeFaults: false,
        format: 'json' as const,
        timeRange: {
          start: new Date(Date.now() - 500),
          end: new Date(),
        },
      };
      
      const result = harness.exportResults(config);
      const parsed = JSON.parse(result);
      
      // Should only include the load operation (timestamp -500ms)
      expect(parsed.operations).toHaveLength(1);
      expect(parsed.operations[0].operation).toBe('load');
    });

    it('should filter by scenario', () => {
      const mockScenarios: ChaosScenarioResult[] = [
        {
          scenarioId: 'scenario-1',
          scenarioName: 'Scenario 1',
          startTime: Date.now() - 2000,
          endTime: Date.now() - 1000,
          duration: 1000,
          operations: [],
          summary: {
            totalOperations: 10,
            successfulOperations: 8,
            failedOperations: 2,
            averageLatency: 150,
            maxLatency: 200,
            minLatency: 100,
            errorRate: 0.2,
            dataIntegrityIssues: 0,
            resourceExhaustionEvents: 0,
            cascadeEvents: 0,
          },
          faultSummary: {
            totalFaultsInjected: 5,
            faultsByType: {},
            faultsBySeverity: {},
          },
          kpiMetrics: {},
        },
        {
          scenarioId: 'scenario-2',
          scenarioName: 'Scenario 2',
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          duration: 1000,
          operations: [],
          summary: {
            totalOperations: 5,
            successfulOperations: 3,
            failedOperations: 2,
            averageLatency: 120,
            maxLatency: 180,
            minLatency: 60,
            errorRate: 0.4,
            dataIntegrityIssues: 1,
            resourceExhaustionEvents: 0,
            cascadeEvents: 0,
          },
          faultSummary: {
            totalFaultsInjected: 3,
            faultsByType: {},
            faultsBySeverity: {},
          },
          kpiMetrics: {},
        },
      ];
      
      vi.spyOn(harness, 'getScenarioResults').mockReturnValue(mockScenarios);
      
      const config = {
        includeRawResults: true,
        includeSummary: false,
        includeKPI: false,
        includeFaults: false,
        format: 'json' as const,
        scenarios: ['scenario-1'],
      };
      
      const result = harness.exportResults(config);
      const parsed = JSON.parse(result);
      
      expect(parsed.scenarios).toHaveLength(1);
      expect(parsed.scenarios[0].scenarioId).toBe('scenario-1');
    });

    it('should filter by operation type', () => {
      const config = {
        includeRawResults: true,
        includeSummary: false,
        includeKPI: false,
        includeFaults: false,
        format: 'json' as const,
        operations: ['save'],
      };
      
      const result = harness.exportResults(config);
      const parsed = JSON.parse(result);
      
      expect(parsed.operations).toHaveLength(1);
      expect(parsed.operations[0].operation).toBe('save');
    });
  });

  describe('Metrics Tracking', () => {
    it('should update metrics on successful operation', async () => {
      mockPersistenceService.saveData.mockResolvedValue(undefined);
      
      await harness.saveData('test-key', { data: 'test' });
      
      const state = harness.getState();
      expect(state.metrics.totalOperations).toBe(1);
      expect(state.metrics.successfulOperations).toBe(1);
      expect(state.metrics.failedOperations).toBe(0);
      expect(state.metrics.errorRate).toBe(0);
    });

    it('should update metrics on failed operation', async () => {
      mockPersistenceService.saveData.mockRejectedValue(new Error('Test error'));
      
      try {
        await harness.saveData('test-key', { data: 'test' });
      } catch {
        // Expected to fail
      }
      
      const state = harness.getState();
      expect(state.metrics.totalOperations).toBe(1);
      expect(state.metrics.successfulOperations).toBe(0);
      expect(state.metrics.failedOperations).toBe(1);
      expect(state.metrics.errorRate).toBe(1);
    });

    it('should track latency metrics', async () => {
      mockPersistenceService.saveData.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      await harness.saveData('test-key', { data: 'test' });
      
      const state = harness.getState();
      expect(state.metrics.maxLatency).toBeGreaterThanOrEqual(50);
      expect(state.metrics.minLatency).toBeLessThanOrEqual(50);
      expect(state.metrics.averageLatency).toBeGreaterThanOrEqual(50);
    });

    it('should track fault injection metrics', async () => {
      const scenario = {
        id: 'fault-tracking-test',
        name: 'Fault Tracking Test',
        description: 'Test fault injection tracking',
        faults: [
          {
            type: 'latency' as FaultType,
            severity: 'medium' as FaultSeverity,
            probability: 1.0,
            duration: 1000,
            targetOperations: ['save'],
            parameters: {
              minDelay: 50,
              maxDelay: 100,
              distribution: 'fixed' as const,
              jitter: 0,
            },
            enabled: true,
          },
          {
            type: 'failure' as FaultType,
            severity: 'high' as FaultSeverity,
            probability: 1.0,
            duration: 1000,
            targetOperations: ['save'],
            parameters: {
              errorType: 'network' as const,
              message: 'Test error',
              code: 'TEST_ERROR',
              autoRetry: false,
              retryAttempts: 0,
            },
            enabled: true,
          },
        ],
        duration: 2000,
        warmupPeriod: 0,
        cooldownPeriod: 0,
        namespace: testNamespace,
        enabled: true,
      };
      
      // Mock config to return our test scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [scenario],
        },
      });
      
      mockPersistenceService.saveData.mockRejectedValue(new Error('Test error'));
      
      try {
        await harness.startScenario(scenario.id);
        await harness.saveData('test-key', { data: 'test' });
      } catch {
        // Expected to fail
      }
      
      const state = harness.getState();
      expect(state.metrics.totalFaultsInjected).toBe(2);
      expect(state.metrics.failedOperations).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should detect data corruption', async () => {
      const scenario = {
        id: 'data-integrity-test',
        name: 'Data Integrity Test',
        description: 'Test data integrity checking',
        faults: [
          {
            type: 'corruption' as FaultType,
            severity: 'critical' as FaultSeverity,
            probability: 1.0,
            duration: 1000,
            targetOperations: ['load'],
            parameters: {
              corruptionType: 'modify' as const,
              corruptionPercentage: 1.0,
              preserveStructure: true,
            },
            enabled: true,
          },
        ],
        duration: 2000,
        warmupPeriod: 0,
        cooldownPeriod: 0,
        namespace: testNamespace,
        enabled: true,
      };
      
      // Mock config to return our test scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [scenario],
        },
      });
      
      const originalData = { data: 'test', value: 123 };
      const corruptedData = { data: 'tset', value: 321 };
      
      mockPersistenceService.loadData.mockResolvedValue(corruptedData);
      
      await harness.startScenario(scenario.id);
      await harness.loadData('test-key');
      
      const state = harness.getState();
      expect(state.metrics.dataIntegrityIssues).toBe(1);
    });
  });

  describe('Event Emission', () => {
    it('should emit scenario started event', async () => {
      const scenario = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0];
      const startedListener = vi.fn();
      
      harness.on('scenarioStarted', startedListener);
      
      await harness.startScenario(scenario.id);
      
      expect(startedListener).toHaveBeenCalledWith({
        scenarioId: scenario.id,
        scenario,
      });
    });

    it('should emit scenario stopped event', async () => {
      const scenario = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0];
      const stoppedListener = vi.fn();
      
      harness.on('scenarioStopped', stoppedListener);
      
      await harness(startScenario(scenario.id));
      await harness.stopScenario(scenario.id);
      
      expect(stoppedListener).toHaveBeenCalledWith({
        scenarioId: scenario.id,
        result: expect.any(Object), // We don't need to validate the exact result structure
      });
    });

    it('should emit operation completed event', async () => {
      mockPersistenceService.saveData.mockResolvedValue(undefined);
      const completedListener = vi.fn();
      
      harness.on('operationCompleted', completedListener);
      
      await harness.saveData('test-key', { data: 'test' });
      
      expect(completedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'save',
          success: true,
          duration: expect.any(Number),
          timestamp: expect.any(Number),
          injectedFaults: expect.any(Array),
        })
      );
    });

    it('should emit telemetry events', async () => {
      const telemetryListener = vi.fn();
      
      harness.on('telemetry', telemetryListener);
      
      const scenario = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0];
      
      // Mock config to return our test scenario
      vi.spyOn(harness, 'getState').mockReturnValue({
        ...harness.getState(),
        config: {
          ...harness.getState().config,
          scenarios: [scenario],
        },
      });
      
      await harness.startScenario(scenario.id);
      await harness.saveData('test-key', { data: 'test' });
      
      expect(telemetryListener).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: expect.any(String),
          data: expect.any(Object),
          timestamp: expect.any(Number),
          harness: 'persistence-chaos',
          namespace: testNamespace,
        })
      );
    });
  });

  describe('Reset', () => {
    it('should reset harness state', () => {
      // Add some data first
      mockPersistenceService.saveData.mockResolvedValue(undefined);
      await harness.saveData('test-key', { data: 'test' });
      
      harness.reset();
      
      const state = harness.getState();
      expect(state.operationHistory).toEqual([]);
      expect(state.scenarioResults).toEqual([]);
      expect(state.metrics.totalOperations).toBe(0);
      expect(state.metrics.successfulOperations).toBe(0);
      expect(state.metrics.failedOperations).toBe(0);
      expect(state.metrics.errorRate).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const removeAllListeners = vi.spyOn(harness, 'removeAllListeners');
      
      harness.destroy();
      
      expect(removeAllListeners).toHaveBeenCalled();
    });
  });
});
