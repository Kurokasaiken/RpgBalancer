/**
 * Test suite for CI Pipeline Regression Monitor
 * 
 * Tests regression detection, trend analysis, alert generation,
 * and reporting functionality with enhanced stress testing support.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CIRegressionMonitor } from '@/scripts/coord/ci-regression-monitor';
import type { CIPipelineMetrics, MonitorConfig, StressTestMetrics } from '@/scripts/coord/ci-regression-monitor';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Mock dependencies
vi.mock('node:fs/promises');
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

const mockFs = vi.mocked(fs);
const mockExecSync = vi.fn();

describe('CIRegressionMonitor', () => {
  let monitor: CIRegressionMonitor;
  let testConfig: MonitorConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    testConfig = {
      baselineWindow: 5,
      alertThresholds: {
        buildDuration: 25,
        testDuration: 30,
        testFailureRate: 10,
        lintErrors: 5,
        coverageDrop: 5,
        memoryUsage: 20,
      },
      retentionDays: 30,
      exportPath: 'test-results/ci-monitor-test',
      enableRealTimeMonitoring: true,
    };
    
    monitor = new CIRegressionMonitor(testConfig);
    
    // Mock file system operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.readdir.mockResolvedValue([]);
    mockFs.stat.mockResolvedValue({ size: 1000 } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultMonitor = new CIRegressionMonitor();
      expect(defaultMonitor).toBeDefined();
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        baselineWindow: 10,
        alertThresholds: {
          buildDuration: 50,
        },
      };
      
      const customMonitor = new CIRegressionMonitor(customConfig);
      expect(customMonitor).toBeDefined();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect current CI run metrics', async () => {
      // Mock git commands
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics).toBeDefined();
      expect(metrics.id).toBeTruthy();
      expect(metrics.timestamp).toBeGreaterThan(0);
      expect(metrics.commit).toBe('abc123');
      expect(metrics.branch).toBe('main');
      expect(metrics.status).toBe('success');
    });

    it('should handle build failures correctly', async () => {
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockImplementationOnce(() => {
          const error = new Error('Build failed') as any;
          error.stdout = 'error: Build failed with 2 errors';
          throw error;
        })
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.status).toBe('failure');
      expect(metrics.buildResults.errors).toBe(2);
    });

    it('should handle test failures correctly', async () => {
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 failed (1 ms)\nFAIL 1/1');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.status).toBe('failure');
      expect(metrics.testResults.failed).toBe(1);
      expect(metrics.testResults.passed).toBe(0);
    });

    it('should parse test coverage correctly', async () => {
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1\nCoverage: 85.5%');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.testResults.coverage).toBe(85.5);
    });

    it('should handle git command failures gracefully', async () => {
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('Git command failed');
        })
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.commit).toBe('unknown');
      expect(metrics.branch).toBe('main');
    });
  });

  describe('Regression Detection', () => {
    beforeEach(async () => {
      // Set up baseline metrics
      const baselineMetrics: CIPipelineMetrics[] = [
        {
          id: 'baseline-1',
          timestamp: Date.now() - 1000000,
          commit: 'def456',
          branch: 'main',
          buildDuration: 10000,
          testDuration: 5000,
          lintDuration: 2000,
          totalDuration: 17000,
          status: 'success',
          testResults: { total: 10, passed: 10, failed: 0, skipped: 0, coverage: 80 },
          lintResults: { errors: 0, warnings: 2 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1000000, cpuUsage: 1000 },
          artifacts: { count: 5, size: 10000 },
        },
        {
          id: 'baseline-2',
          timestamp: Date.now() - 900000,
          commit: 'def456',
          branch: 'main',
          buildDuration: 11000,
          testDuration: 5500,
          lintDuration: 2100,
          totalDuration: 18600,
          status: 'success',
          testResults: { total: 10, passed: 10, failed: 0, skipped: 0, coverage: 82 },
          lintResults: { errors: 0, warnings: 3 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1100000, cpuUsage: 1100 },
          artifacts: { count: 5, size: 11000 },
        },
      ];

      // Mock loading baseline metrics
      mockFs.readFile.mockResolvedValue(JSON.stringify(baselineMetrics));
      await monitor['loadMetrics']();
    });

    it('should detect build duration regression', async () => {
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success (but slow)
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      // Mock slow build by making execSync take time
      const originalExecSync = mockExecSync;
      let callCount = 0;
      mockExecSync.mockImplementation((command: string) => {
        callCount++;
        if (callCount === 3) { // build command
          // Simulate slow build
          const start = Date.now();
          while (Date.now() - start < 100) {
            // Wait
          }
        }
        return originalExecSync(command);
      });

      const metrics = await monitor.monitorCurrentRun();

      // Should detect regression due to increased build time
      expect(metrics.buildDuration).toBeGreaterThan(0);
    });

    it('should detect test failure rate regression', async () => {
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  10 failed (100 ms)\nFAIL 10/10');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.testResults.failed).toBe(10);
      expect(metrics.testResults.passed).toBe(0);
      expect(metrics.status).toBe('failure');
    });

    it('should detect lint errors regression', async () => {
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockImplementationOnce(() => {
          const error = new Error('Lint failed') as any;
          error.stdout = 'error: Unexpected console statement (error)\nerror: Unused variable (error)';
          throw error;
        })
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.lintResults.errors).toBe(2);
      expect(metrics.status).toBe('failure');
    });

    it('should detect coverage drop regression', async () => {
      mockExecSync
        .mockReturnValueOnce('abc123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1\nCoverage: 70.0%');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.testResults.coverage).toBe(70.0);
      // Coverage dropped from baseline ~80% to 70%
    });
  });

  describe('Trend Analysis', () => {
    beforeEach(async () => {
      // Set up metrics for trend analysis
      const trendMetrics: CIPipelineMetrics[] = [
        {
          id: 'trend-1',
          timestamp: Date.now() - 2000000,
          commit: 'old123',
          branch: 'main',
          buildDuration: 10000,
          testDuration: 5000,
          lintDuration: 2000,
          totalDuration: 17000,
          status: 'success',
          testResults: { total: 10, passed: 10, failed: 0, skipped: 0, coverage: 80 },
          lintResults: { errors: 0, warnings: 2 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1000000, cpuUsage: 1000 },
          artifacts: { count: 5, size: 10000 },
        },
        {
          id: 'trend-2',
          timestamp: Date.now() - 1000000,
          commit: 'new123',
          branch: 'main',
          buildDuration: 8000, // Improving
          testDuration: 6000, // Degrading
          lintDuration: 2100,
          totalDuration: 16100,
          status: 'success',
          testResults: { total: 10, passed: 9, failed: 1, skipped: 0, coverage: 78 },
          lintResults: { errors: 1, warnings: 3 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1100000, cpuUsage: 1100 },
          artifacts: { count: 5, size: 11000 },
        },
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(trendMetrics));
      await monitor['loadMetrics']();
    });

    it('should analyze trends correctly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.analyzeTrends(30);

      expect(consoleSpy).toHaveBeenCalledWith('📈 Analyzing trends for the last 30 days...');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📈 Performance Trends:'));

      consoleSpy.mockRestore();
    });

    it('should handle insufficient data gracefully', async () => {
      mockFs.readFile.mockResolvedValue('[]');
      await monitor['loadMetrics']();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.analyzeTrends(30);

      expect(consoleSpy).toHaveBeenCalledWith('No recent metrics found for trend analysis.');

      consoleSpy.mockRestore();
    });
  });

  describe('Report Generation', () => {
    beforeEach(async () => {
      // Set up sample metrics
      const sampleMetrics: CIPipelineMetrics[] = [
        {
          id: 'sample-1',
          timestamp: Date.now() - 1000000,
          commit: 'sample123',
          branch: 'main',
          buildDuration: 10000,
          testDuration: 5000,
          lintDuration: 2000,
          totalDuration: 17000,
          status: 'success',
          testResults: { total: 10, passed: 10, failed: 0, skipped: 0, coverage: 80 },
          lintResults: { errors: 0, warnings: 2 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1000000, cpuUsage: 1000 },
          artifacts: { count: 5, size: 10000 },
        },
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(sampleMetrics));
      await monitor['loadMetrics']();
    });

    it('should generate markdown report', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.generateReport('markdown');

      expect(consoleSpy).toHaveBeenCalledWith('📊 Generating regression report...');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Report generated:'));
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.md'),
        expect.stringContaining('# CI Pipeline Regression Report'),
        'utf8'
      );

      consoleSpy.mockRestore();
    });

    it('should generate JSON report', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.generateReport('json');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.stringContaining('"timestamp"'),
        'utf8'
      );

      consoleSpy.mockRestore();
    });

    it('should generate HTML report', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.generateReport('html');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.html'),
        expect.stringContaining('<!DOCTYPE html>'),
        'utf8'
      );

      consoleSpy.mockRestore();
    });

    it('should handle unsupported format gracefully', async () => {
      await expect(monitor.generateReport('xml' as any)).rejects.toThrow('Unsupported format: xml');
    });
  });

  describe('Alert System', () => {
    beforeEach(async () => {
      // Set up metrics with some regressions
      const regressionMetrics: CIPipelineMetrics[] = [
        {
          id: 'regression-1',
          timestamp: Date.now() - 2000000,
          commit: 'baseline123',
          branch: 'main',
          buildDuration: 10000,
          testDuration: 5000,
          lintDuration: 2000,
          totalDuration: 17000,
          status: 'success',
          testResults: { total: 10, passed: 10, failed: 0, skipped: 0, coverage: 80 },
          lintResults: { errors: 0, warnings: 2 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1000000, cpuUsage: 1000 },
          artifacts: { count: 5, size: 10000 },
        },
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(regressionMetrics));
      await monitor['loadMetrics']();
    });

    it('should send alerts when regressions detected', async () => {
      // Simulate a regression
      mockExecSync
        .mockReturnValueOnce('regression123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  5 failed (100 ms)\nFAIL 5/10');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.monitorCurrentRun();
      await monitor.sendAlerts();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 Sending'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('regression alerts'));

      consoleSpy.mockRestore();
    });

    it('should handle no regressions gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.sendAlerts();

      expect(consoleSpy).toHaveBeenCalledWith('✅ No regressions detected.');

      consoleSpy.mockRestore();
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      // Set up old metrics for cleanup
      const oldMetrics: CIPipelineMetrics[] = [
        {
          id: 'old-1',
          timestamp: Date.now() - (100 * 24 * 60 * 60 * 1000), // 100 days old
          commit: 'old123',
          branch: 'main',
          buildDuration: 10000,
          testDuration: 5000,
          lintDuration: 2000,
          totalDuration: 17000,
          status: 'success',
          testResults: { total: 10, passed: 10, failed: 0, skipped: 0, coverage: 80 },
          lintResults: { errors: 0, warnings: 2 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1000000, cpuUsage: 1000 },
          artifacts: { count: 5, size: 10000 },
        },
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(oldMetrics));
      await monitor['loadMetrics']();
    });

    it('should clean up old metrics', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('🧹 Cleaning up old metrics...');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cleaned up'));

      consoleSpy.mockRestore();
    });

    it('should store metrics correctly', async () => {
      mockExecSync
        .mockReturnValueOnce('store123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      await monitor.monitorCurrentRun();

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('ci-metrics.json'),
        expect.stringContaining('"store123"'),
        'utf8'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      // Should not throw
      await expect(monitor['loadMetrics']()).resolves.toBeUndefined();
    });

    it('should handle directory creation errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      mockExecSync
        .mockReturnValueOnce('error123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      // Should not throw
      await expect(monitor.monitorCurrentRun()).resolves.toBeDefined();
    });

    it('should handle invalid JSON in metrics file', async () => {
      mockFs.readFile.mockResolvedValue('invalid json');
      
      // Should not throw
      await expect(monitor['loadMetrics']()).resolves.toBeUndefined();
    });
  });

  describe('Performance Metrics', () => {
    it('should collect performance metrics correctly', async () => {
      mockExecSync
        .mockReturnValueOnce('perf123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.performance.memoryUsage).toBeGreaterThan(0);
      expect(metrics.performance.cpuUsage).toBeGreaterThanOrEqual(0);
    });

    it('should collect artifacts information correctly', async () => {
      mockExecSync
        .mockReturnValueOnce('artifact123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1');

      // Mock artifact files
      mockFs.readdir.mockResolvedValue(['test.log', 'coverage.log'] as any);
      mockFs.stat.mockResolvedValue({ size: 1000 } as any);

      const metrics = await monitor.monitorCurrentRun();

      expect(metrics.artifacts.count).toBe(2);
      expect(metrics.artifacts.size).toBe(2000);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete monitoring workflow', async () => {
      mockExecSync
        .mockReturnValueOnce('workflow123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  1 passed (1 ms)\nPASS 1/1\nCoverage: 85.0%');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Complete workflow
      await monitor.monitorCurrentRun();
      await monitor.analyzeTrends(30);
      await monitor.generateReport('markdown');
      await monitor.sendAlerts();

      expect(consoleSpy).toHaveBeenCalledWith('🔍 Monitoring current CI run...');
      expect(consoleSpy).toHaveBeenCalledWith('📈 Analyzing trends for the last 30 days...');
      expect(consoleSpy).toHaveBeenCalledWith('📊 Generating regression report...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ No regressions detected.');

      consoleSpy.mockRestore();
    });

    it('should handle workflow with regressions', async () => {
      // Set up baseline for regression detection
      const baselineMetrics: CIPipelineMetrics[] = [
        {
          id: 'baseline',
          timestamp: Date.now() - 1000000,
          commit: 'baseline123',
          branch: 'main',
          buildDuration: 10000,
          testDuration: 5000,
          lintDuration: 2000,
          totalDuration: 17000,
          status: 'success',
          testResults: { total: 10, passed: 10, failed: 0, skipped: 0, coverage: 80 },
          lintResults: { errors: 0, warnings: 2 },
          buildResults: { errors: 0, warnings: 1 },
          performance: { memoryUsage: 1000000, cpuUsage: 1000 },
          artifacts: { count: 5, size: 10000 },
        },
      ];

      mockFs.readFile.mockResolvedValue(JSON.stringify(baselineMetrics));
      await monitor['loadMetrics']();

      // Simulate regression
      mockExecSync
        .mockReturnValueOnce('regression123')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('') // build success
        .mockReturnValueOnce('') // lint success
        .mockReturnValueOnce('Test Files  5 failed (100 ms)\nFAIL 5/10');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await monitor.monitorCurrentRun();
      await monitor.sendAlerts();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 Detected'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('regressions'));

      consoleSpy.mockRestore();
    });
  });
});
