/**
 * NP-088 – Multi-Village Scheduler Monitor CLI Unit Tests
 *
 * Test suite for the MultiVillageSchedulerMonitorCLI command-line interface.
 * Tests CLI argument parsing, command execution, and output formatting.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MultiVillageSchedulerMonitorCLI } from '../../cli/multiVillageSchedulerMonitor';

// Mock the monitor service
const mockMonitor = {
  registerVillage: vi.fn(),
  unregisterVillage: vi.fn(),
  getVillages: vi.fn(),
  getLatestKPIs: vi.fn(),
  getKPIHistory: vi.fn(),
  getActiveAlerts: vi.fn(),
  performComparativeAnalysis: vi.fn(),
  getStats: vi.fn(),
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  updateConfig: vi.fn(),
  getConfig: vi.fn(),
  exportKPIs: vi.fn(),
  exportComparativeAnalysis: vi.fn(),
  exportAlerts: vi.fn(),
  exportFullReport: vi.fn(),
  dispose: vi.fn(),
};

describe('MultiVillageSchedulerMonitorCLI', () => {
  let cli: MultiVillageSchedulerMonitorCLI;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    cli = new MultiVillageSchedulerMonitorCLI({} as any);

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

    // Reset all mocks
    Object.values(mockMonitor).forEach(mock => {
      if (typeof mock === 'function') {
        (mock as any).mockReset();
      }
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.clearAllTimers();
  });

  describe('Argument Parsing', () => {
    it('should parse monitor command with defaults', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const parsed = (cli as any).parseArgs(['monitor']);

      expect(parsed.command).toBe('monitor');
      expect(parsed.format).toBe('table');
      expect(parsed.duration).toBe(5);
      expect(parsed.interval).toBe(30);
    });

    it('should parse export command with options', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const parsed = (cli as any).parseArgs(['export', '--format', 'json', '--output', 'test.json']);

      expect(parsed.command).toBe('export');
      expect(parsed.format).toBe('json');
      expect(parsed.outputPath).toBe('test.json');
    });

    it('should parse compare command with time window', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const parsed = (cli as any).parseArgs(['compare', '--window', '120']);

      expect(parsed.command).toBe('compare');
      expect(parsed.timeWindow).toBe(120);
    });

    it('should parse village filters', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const parsed = (cli as any).parseArgs(['monitor', '--villages', 'village-1,village-2']);

      expect(parsed.villageIds).toEqual(['village-1', 'village-2']);
    });

    it('should handle help flag', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const showHelpSpy = vi.spyOn(cli as any, 'showHelp').mockImplementation(() => {});

      (cli as any).parseArgs(['--help']);

      expect(showHelpSpy).toHaveBeenCalled();
    });
  });

  describe('Monitor Command', () => {
    it('should execute monitor command successfully', async () => {
      // Mock monitor methods
      mockMonitor.getVillages.mockReturnValue([
        { id: 'village-1', name: 'Village 1' },
        { id: 'village-2', name: 'Village 2' },
      ]);
      mockMonitor.getLatestKPIs.mockReturnValue({
        villageId: 'village-1',
        timestamp: Date.now(),
        queue: { size: 5, utilization: 0.1 },
        assignments: { successRate: 0.9 },
        residents: { utilization: 0.8 },
        activities: { utilization: 0.7 },
        performance: { throughput: 2.5 },
      });
      mockMonitor.getStats.mockReturnValue({
        villagesMonitored: 2,
        totalKpisCollected: 10,
        activeAlerts: 0,
      });

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'monitor', duration: 1 });

      // Mock the monitor property
      (cli as any).monitor = mockMonitor;

      // Mock setTimeout for the monitoring duration
      vi.useFakeTimers();
      const promise = cli.run(['monitor', '--duration', '1']);

      // Fast-forward through the monitoring
      vi.advanceTimersByTime(2000);

      await promise;

      expect(mockMonitor.startMonitoring).toHaveBeenCalled();
      expect(mockMonitor.stopMonitoring).toHaveBeenCalled();
    });

    it('should handle real-time display', async () => {
      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'monitor', realTime: true });

      // Mock minimal monitor setup
      mockMonitor.getVillages.mockReturnValue([]);
      mockMonitor.getActiveAlerts.mockReturnValue([]);

      (cli as any).monitor = mockMonitor;

      vi.useFakeTimers();
      const promise = cli.run(['monitor', '--duration', '1', '--no-realtime']);

      vi.advanceTimersByTime(2000);
      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting Multi-Village Scheduler Monitor')
      );
    });
  });

  describe('Export Command', () => {
    it('should execute export command', async () => {
      mockMonitor.exportKPIs.mockReturnValue('{"test": "data"}');

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'export' });
      (cli as any).monitor = mockMonitor;

      // Mock writeFileSync
      const { writeFileSync } = await import('fs');
      const writeSpy = vi.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {});

      await cli.run(['export', '--format', 'json', '--output', 'test.json']);

      expect(mockMonitor.exportKPIs).toHaveBeenCalledWith('json', undefined);
      expect(writeSpy).toHaveBeenCalledWith('test.json', '{"test": "data"}', 'utf8');

      writeSpy.mockRestore();
    });

    it('should handle CSV export', async () => {
      mockMonitor.exportKPIs.mockReturnValue('villageId,timestamp\nvillage-1,2026-01-01T00:00:00.000Z');

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'export' });
      (cli as any).monitor = mockMonitor;

      const { writeFileSync } = await import('fs');
      const writeSpy = vi.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {});

      await cli.run(['export', '--format', 'csv', '--output', 'test.csv']);

      expect(mockMonitor.exportKPIs).toHaveBeenCalledWith('csv', undefined);
      expect(writeSpy).toHaveBeenCalledWith('test.csv', expect.stringContaining('villageId'), 'utf8');

      writeSpy.mockRestore();
    });
  });

  describe('Compare Command', () => {
    it('should execute compare command', async () => {
      const mockAnalysis = {
        timestamp: Date.now(),
        timeWindow: 3600000,
        rankings: {
          queueEfficiency: [],
          assignmentSuccess: [],
          residentUtilization: [],
          throughput: [],
        },
        summary: {
          bestPerforming: 'village-1',
          worstPerforming: 'village-2',
          averageEfficiency: 0.8,
          standardDeviation: 0.1,
        },
        recommendations: ['Consider optimizing village-2'],
      };

      mockMonitor.performComparativeAnalysis.mockReturnValue(mockAnalysis);

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'compare' });
      (cli as any).monitor = mockMonitor;

      await cli.run(['compare', '--format', 'json', '--output', 'analysis.json']);

      expect(mockMonitor.performComparativeAnalysis).toHaveBeenCalled();
    });
  });

  describe('Alerts Command', () => {
    it('should display alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          severity: 'warning' as const,
          villageId: 'village-1',
          message: 'Queue utilization high',
          timestamp: Date.now(),
          type: 'queue_overload' as const,
          resolved: false,
        },
      ];

      mockMonitor.getActiveAlerts.mockReturnValue(mockAlerts);

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'alerts' });
      (cli as any).monitor = mockMonitor;

      await cli.run(['alerts']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 active alert(s)')
      );
    });

    it('should handle no alerts', async () => {
      mockMonitor.getActiveAlerts.mockReturnValue([]);

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'alerts' });
      (cli as any).monitor = mockMonitor;

      await cli.run(['alerts']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No active alerts')
      );
    });
  });

  describe('Status Command', () => {
    it('should display status information', async () => {
      mockMonitor.getStats.mockReturnValue({
        villagesMonitored: 3,
        totalKpisCollected: 150,
        activeAlerts: 2,
        uptime: 300000,
        lastCollectionTime: Date.now(),
      });

      mockMonitor.getVillages.mockReturnValue([
        { id: 'village-1', name: 'Village 1' },
        { id: 'village-2', name: 'Village 2' },
      ]);

      mockMonitor.getActiveAlerts.mockReturnValue([
        { id: 'alert-1', severity: 'warning', villageId: 'village-1', message: 'Test alert', timestamp: Date.now(), type: 'test', resolved: false },
      ]);

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'status' });
      (cli as any).monitor = mockMonitor;

      await cli.run(['status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Monitor Status')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Villages monitored: 3')
      );
    });
  });

  describe('Sample Data Generation', () => {
    it('should generate sample residents', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const residents = (cli as any).generateSampleResidents(5);

      expect(Object.keys(residents)).toHaveLength(5);
      expect(residents['resident-1']).toBeDefined();
      expect(residents['resident-1'].stats).toBeDefined();
      expect(residents['resident-1'].fatigue).toBeDefined();
    });

    it('should generate sample activities', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const activities = (cli as any).generateSampleActivities(3);

      expect(Object.keys(activities)).toHaveLength(3);
      expect(activities['forest-work']).toBeDefined();
      expect(activities['forest-work'].category).toBe('gathering');
    });
  });

  describe('CSV Conversion', () => {
    it('should convert KPI data to CSV', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      const mockKpis = [
        {
          villageId: 'village-1',
          timestamp: Date.now(),
          queue: { size: 5, averageSize: 4.5, maxSize: 50, utilization: 0.1 },
          assignments: { total: 10, successful: 9, failed: 1, successRate: 0.9, averageDuration: 1800000 },
          residents: {
            total: 20,
            active: 16,
            idle: 4,
            utilization: 0.8,
            fatigueDistribution: { low: 5, medium: 10, high: 3, critical: 2 },
          },
          activities: { total: 8, active: 6, utilization: 0.75, byType: { gathering: 4, production: 4 } },
          performance: { averageProcessingTime: 150, throughput: 2.0, efficiency: 0.72, loadFactor: 0.3 },
        },
      ];

      const data = { 'village-1': mockKpis };
      const csv = (cli as any).convertToCSV(data);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('villageId');
      expect(csv).toContain('village-1');
      expect(csv.split('\n')).toHaveLength(2); // Header + 1 data row
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);

      await expect(cli.run(['invalid-command'])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown command')
      );
    });

    it('should handle export errors', async () => {
      mockMonitor.exportKPIs.mockImplementation(() => {
        throw new Error('Export failed');
      });

      const cli = new MultiVillageSchedulerMonitorCLI({ command: 'export' });
      (cli as any).monitor = mockMonitor;

      await expect(cli.run(['export'])).rejects.toThrow('Export failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('CLI execution failed:', expect.any(Error));
    });
  });

  describe('Help Display', () => {
    it('should display help information', () => {
      const cli = new MultiVillageSchedulerMonitorCLI({} as any);
      (cli as any).showHelp();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Idle Village Multi-Village Scheduler Monitor CLI')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: multi-village-scheduler-monitor <command> [options]')
      );
    });
  });
});
