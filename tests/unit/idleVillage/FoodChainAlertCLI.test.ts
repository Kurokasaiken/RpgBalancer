/**
 * Idle Village Food Chain Alert CLI Tests
 *
 * Comprehensive test suite for the food chain alert CLI tool,
 * covering command-line interface, argument parsing, and execution scenarios.
 *
 * @module FoodChainAlertCLI.test
 * @since 2026-01-13
 * @author Vector-Food
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runFoodChainAlertCli } from '../../../scripts/idleVillage/foodChainAlert';

// Mock external dependencies
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock('path', () => ({
  resolve: vi.fn((path) => path),
}));

vi.mock('../../../src/analytics/idleVillageFoodChain', () => ({
  FoodChainAlertAnalyzer: vi.fn(),
  formatFoodChainReport: vi.fn(),
  snapshotsFromSchedulerKpis: vi.fn(),
}));

vi.mock('../../../src/balancing/config/idleVillage/defaultConfig', () => ({
  DEFAULT_IDLE_VILLAGE_CONFIG: {},
}));

vi.mock('../../../src/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { FoodChainAlertAnalyzer, formatFoodChainReport, snapshotsFromSchedulerKpis } from '../../../src/analytics/idleVillageFoodChain';

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);
const mockResolve = vi.mocked(resolve);
const mockAnalyzer = vi.mocked(FoodChainAlertAnalyzer);
const mockFormatReport = vi.mocked(formatFoodChainReport);
const mockSnapshotsFromKpis = vi.mocked(snapshotsFromSchedulerKpis);

describe('Food Chain Alert CLI', () => {
  const mockAnalyzerInstance = {
    analyzeSnapshots: vi.fn(),
    analyzeVillageState: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockExistsSync.mockReturnValue(true);
    mockResolve.mockImplementation((path) => path);
    mockAnalyzer.mockReturnValue(mockAnalyzerInstance as any);
    mockFormatReport.mockReturnValue('Mock formatted report');
    mockSnapshotsFromKpis.mockReturnValue([]);

    mockAnalyzerInstance.analyzeSnapshots.mockResolvedValue({
      status: 'stable',
      alerts: [],
      metrics: {
        currentFoodStock: 100,
        daysOfFoodAvailable: 5,
        targetDaysOfFood: 5,
        averageProductionPerDay: 20,
        averageConsumptionPerDay: 20,
        netProductionPerDay: 0,
        maxDeficitStreak: 0,
        schedulerUnderAllocation: false,
      },
    });

    mockAnalyzerInstance.analyzeVillageState.mockResolvedValue({
      status: 'stable',
      alerts: [],
      metrics: {
        currentFoodStock: 100,
        daysOfFoodAvailable: 5,
        targetDaysOfFood: 5,
        averageProductionPerDay: 20,
        averageConsumptionPerDay: 20,
        netProductionPerDay: 0,
        maxDeficitStreak: 0,
        schedulerUnderAllocation: false,
      },
    });
  });

  describe('Sample Data Analysis', () => {
    it('should run analysis with sample data', async () => {
      const result = await runFoodChainAlertCli();

      expect(mockAnalyzer).toHaveBeenCalled();
      expect(mockAnalyzerInstance.analyzeSnapshots).toHaveBeenCalled();
      expect(mockFormatReport).toHaveBeenCalledWith(result, 'text');
    });

    it('should generate alerts for critical food situations', async () => {
      mockAnalyzerInstance.analyzeSnapshots.mockResolvedValue({
        status: 'critical',
        alerts: [
          {
            id: 'critical-stock',
            severity: 'critical',
            type: 'stock',
            message: 'Food reserves critical',
            recommendations: ['Buy emergency food'],
            timestamp: Date.now(),
            context: {},
            metrics: {} as any,
          },
        ],
        metrics: {
          currentFoodStock: 10,
          daysOfFoodAvailable: 0.5,
          targetDaysOfFood: 5,
          averageProductionPerDay: 5,
          averageConsumptionPerDay: 20,
          netProductionPerDay: -15,
          maxDeficitStreak: 2,
          schedulerUnderAllocation: true,
        },
      });

      const result = await runFoodChainAlertCli();

      expect(result.status).toBe('critical');
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].severity).toBe('critical');
      expect(result.metrics.daysOfFoodAvailable).toBe(0.5);
    });
  });

  describe('File-based Analysis', () => {
    const mockVillageState = {
      currentTime: 1000,
      resources: { food: 200 },
      residents: {},
      activities: {},
      eventLog: [],
      questOffers: {},
    };

    const mockSchedulerKpis = [
      {
        villageId: 'test',
        productionActivitiesPerDay: 25,
        farmingUtilization: 0.6,
      },
    ];

    beforeEach(() => {
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('state.json')) {
          return JSON.stringify(mockVillageState);
        }
        if (path.includes('kpis.json')) {
          return JSON.stringify(mockSchedulerKpis);
        }
        return '{}';
      });
    });

    it('should analyze village state from file', async () => {
      mockExistsSync.mockReturnValue(true);

      // Mock command line arguments for state file
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--state', 'state.json'];

      const result = await runFoodChainAlertCli();

      expect(mockReadFileSync).toHaveBeenCalledWith('state.json', 'utf-8');
      expect(result.status).toBe('stable');

      process.argv = originalArgv;
    });

    it('should analyze scheduler KPIs from file', async () => {
      mockSnapshotsFromKpis.mockReturnValue([
        {
          timestamp: Date.now(),
          foodStock: 200,
          foodProductionPerDay: 25,
          foodConsumptionPerDay: 20,
        },
      ]);

      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--kpis', 'kpis.json', '--state', 'state.json'];

      const result = await runFoodChainAlertCli();

      expect(mockReadFileSync).toHaveBeenCalledWith('kpis.json', 'utf-8');
      expect(mockSnapshotsFromKpis).toHaveBeenCalledWith({
        kpis: mockSchedulerKpis,
        state: mockVillageState,
        config: expect.any(Object),
      });

      process.argv = originalArgv;
    });

    it('should handle file read errors', async () => {
      mockExistsSync.mockReturnValue(false);

      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--state', 'nonexistent.json'];

      await expect(runFoodChainAlertCli()).rejects.toThrow();

      process.argv = originalArgv;
    });
  });

  describe('Output Formats', () => {
    it('should output in text format by default', async () => {
      mockFormatReport.mockReturnValue('Text report content');

      const result = await runFoodChainAlertCli();

      expect(mockFormatReport).toHaveBeenCalledWith(result, 'text');
    });

    it('should output in markdown format', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--format', 'markdown'];

      mockFormatReport.mockReturnValue('# Markdown Report');

      const result = await runFoodChainAlertCli();

      expect(mockFormatReport).toHaveBeenCalledWith(result, 'markdown');

      process.argv = originalArgv;
    });

    it('should output in JSON format', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--format', 'json'];

      const result = await runFoodChainAlertCli();

      expect(mockFormatReport).not.toHaveBeenCalled();
      // JSON format would output the raw result object

      process.argv = originalArgv;
    });

    it('should write output to file when specified', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--output', 'report.md'];

      mockFormatReport.mockReturnValue('Report content');

      await runFoodChainAlertCli();

      expect(mockWriteFileSync).toHaveBeenCalledWith('report.md', 'Report content', 'utf-8');

      process.argv = originalArgv;
    });
  });

  describe('Configuration Options', () => {
    it('should accept custom production rate', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--production', '50'];

      await runFoodChainAlertCli();

      expect(mockAnalyzerInstance.analyzeVillageState).toHaveBeenCalledWith({
        config: expect.any(Object),
        state: expect.any(Object),
        productionPerDay: 50,
      });

      process.argv = originalArgv;
    });

    it('should load custom config file', async () => {
      const customConfig = {
        thresholds: {
          minimumDaysOfFoodCritical: 0.5,
          minimumDaysOfFoodWarning: 2,
        },
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(customConfig));

      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--config', 'custom.json'];

      await runFoodChainAlertCli();

      expect(mockReadFileSync).toHaveBeenCalledWith('custom.json', 'utf-8');
      expect(mockAnalyzer).toHaveBeenCalledWith(customConfig);

      process.argv = originalArgv;
    });

    it('should handle config file errors', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Config file error');
      });

      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--config', 'invalid.json'];

      await expect(runFoodChainAlertCli()).rejects.toThrow('Config file error');

      process.argv = originalArgv;
    });
  });

  describe('Watch Mode', () => {
    let mockSetInterval: vi.MockedFunction<typeof setInterval>;
    let mockClearInterval: vi.MockedFunction<typeof clearInterval>;

    beforeEach(() => {
      mockSetInterval = vi.fn();
      mockClearInterval = vi.fn();

      global.setInterval = mockSetInterval;
      global.clearInterval = mockClearInterval;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should enable watch mode with default interval', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--watch'];

      // Mock setInterval to avoid actual timing
      mockSetInterval.mockImplementation((callback: Function) => {
        // Call immediately for testing
        callback();
        return 123 as any;
      });

      await runFoodChainAlertCli();

      expect(mockSetInterval).toHaveBeenCalled();
      expect(mockAnalyzerInstance.analyzeSnapshots).toHaveBeenCalled();

      process.argv = originalArgv;
    });

    it('should enable watch mode with custom interval', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--watch', '45'];

      mockSetInterval.mockReturnValue(456 as any);

      await runFoodChainAlertCli();

      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 45 * 1000);

      process.argv = originalArgv;
    });

    it('should handle watch mode errors gracefully', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--watch'];

      mockSetInterval.mockImplementation(() => {
        throw new Error('Watch setup failed');
      });

      await expect(runFoodChainAlertCli()).rejects.toThrow('Watch setup failed');

      process.argv = originalArgv;
    });
  });

  describe('Telemetry Integration', () => {
    it('should emit telemetry events during analysis', async () => {
      const mockDiagnostics = {
        info: vi.fn(),
      };

      // Mock the diagnostics import
      vi.mocked(require('../../../src/ui/idleVillage/utils/sandboxDiagnostics').createSandboxDiagnostics)
        .mockReturnValue(mockDiagnostics);

      await runFoodChainAlertCli();

      expect(mockDiagnostics.info).toHaveBeenCalledWith('food_chain_alert', expect.objectContaining({
        status: 'stable',
        alertCount: 0,
        alerts: [],
        metrics: expect.any(Object),
      }));
    });

    it('should include alert details in telemetry', async () => {
      const mockDiagnostics = {
        info: vi.fn(),
      };

      vi.mocked(require('../../../src/ui/idleVillage/utils/sandboxDiagnostics').createSandboxDiagnostics)
        .mockReturnValue(mockDiagnostics);

      mockAnalyzerInstance.analyzeSnapshots.mockResolvedValue({
        status: 'warning',
        alerts: [
          {
            id: 'warning-alert',
            severity: 'warning',
            type: 'stock',
            message: 'Low food warning',
            recommendations: ['Buy more food'],
            timestamp: Date.now(),
            context: { daysOfFood: 2.5 },
            metrics: {} as any,
          },
        ],
        metrics: {
          currentFoodStock: 50,
          daysOfFoodAvailable: 2.5,
          targetDaysOfFood: 5,
          averageProductionPerDay: 15,
          averageConsumptionPerDay: 20,
          netProductionPerDay: -5,
          maxDeficitStreak: 1,
          schedulerUnderAllocation: false,
        },
      });

      await runFoodChainAlertCli();

      expect(mockDiagnostics.info).toHaveBeenCalledWith('food_chain_alert', expect.objectContaining({
        status: 'warning',
        alertCount: 1,
        alerts: expect.arrayContaining([
          expect.objectContaining({
            id: 'warning-alert',
            severity: 'warning',
            type: 'stock',
          }),
        ]),
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis errors gracefully', async () => {
      mockAnalyzerInstance.analyzeSnapshots.mockRejectedValue(new Error('Analysis failed'));

      await expect(runFoodChainAlertCli()).rejects.toThrow('Analysis failed');
    });

    it('should handle invalid JSON in config files', async () => {
      mockReadFileSync.mockReturnValue('invalid json content');

      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--config', 'invalid.json'];

      await expect(runFoodChainAlertCli()).rejects.toThrow();

      process.argv = originalArgv;
    });

    it('should handle missing required files', async () => {
      mockExistsSync.mockReturnValue(false);

      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--state', 'missing.json'];

      await expect(runFoodChainAlertCli()).rejects.toThrow();

      process.argv = originalArgv;
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete analysis workflow', async () => {
      const completeState = {
        currentTime: 2000,
        resources: { food: 150, gold: 100 },
        residents: {
          'r1': { id: 'r1', status: 'active' },
          'r2': { id: 'r2', status: 'active' },
        },
        activities: {},
        eventLog: [],
        questOffers: {},
      };

      const kpis = [
        {
          villageId: 'workflow-test',
          productionActivitiesPerDay: 30,
          farmingUtilization: 0.8,
        },
      ];

      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify(completeState))
        .mockReturnValueOnce(JSON.stringify(kpis));

      mockSnapshotsFromKpis.mockReturnValue([
        {
          timestamp: Date.now(),
          foodStock: 150,
          foodProductionPerDay: 30,
          foodConsumptionPerDay: 10,
        },
      ]);

      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--state', 'state.json', '--kpis', 'kpis.json', '--format', 'json'];

      const result = await runFoodChainAlertCli();

      expect(result.status).toBe('stable');
      expect(result.metrics.currentFoodStock).toBe(150);
      expect(mockSnapshotsFromKpis).toHaveBeenCalled();

      process.argv = originalArgv;
    });

    it('should support different production estimation methods', async () => {
      // Test with direct production override
      const originalArgv1 = process.argv;
      process.argv = ['node', 'script.js', '--production', '40'];

      await runFoodChainAlertCli();

      expect(mockAnalyzerInstance.analyzeVillageState).toHaveBeenCalledWith({
        config: expect.any(Object),
        state: expect.any(Object),
        productionPerDay: 40,
      });

      process.argv = originalArgv1;

      // Test with KPI-based production
      const originalArgv2 = process.argv;
      process.argv = ['node', 'script.js', '--kpis', 'kpis.json', '--state', 'state.json'];

      await runFoodChainAlertCli();

      expect(mockSnapshotsFromKpis).toHaveBeenCalled();

      process.argv = originalArgv2;
    });
  });
});
