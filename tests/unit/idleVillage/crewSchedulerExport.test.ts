/**
 * Test Suite for Crew Scheduler CLI Export
 * 
 * Comprehensive test coverage for the crew scheduler export CLI including
 * JSON/CSV export, timeline generation, rejection analysis, and CLI interface.
 * 
 * @since NP-018
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync } from 'fs';
import { CrewSchedulerExportEngine, CrewSchedulerCLI, main } from '../../../src/ui/idleVillage/cli/crewSchedulerExport';

// Mock fs module
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock process.argv
const originalArgv = process.argv;

describe('CrewSchedulerExportEngine', () => {
  let exportEngine: CrewSchedulerExportEngine;

  beforeEach(() => {
    exportEngine = new CrewSchedulerExportEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Export Functionality', () => {
    it('should export data in JSON format', async () => {
      const jsonExport = await exportEngine.exportToJson();
      
      expect(jsonExport).toBeDefined();
      expect(typeof jsonExport).toBe('string');
      
      const data = JSON.parse(jsonExport);
      expect(data).toHaveProperty('metadata');
      expect(data).toHaveProperty('configuration');
      expect(data).toHaveProperty('timeline');
      expect(data).toHaveProperty('summary');
      expect(data.timeline).toBeInstanceOf(Array);
    });

    it('should export data in CSV format', async () => {
      const csvExport = await exportEngine.exportToCsv();
      
      expect(csvExport).toBeDefined();
      expect(typeof csvExport).toBe('string');
      
      const lines = csvExport.split('\n');
      expect(lines[0]).toContain('timestamp,type,residentId,activityId');
      expect(lines.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = exportEngine.getSessionId();
      const exportEngine2 = new CrewSchedulerExportEngine();
      const sessionId2 = exportEngine2.getSessionId();
      
      expect(sessionId1).toBeDefined();
      expect(sessionId2).toBeDefined();
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^export-\d+-[a-z0-9]+$/);
    });
  });

  describe('Timeline Generation', () => {
    it('should generate timeline with correct structure', async () => {
      const data = await exportEngine.exportData();
      
      expect(data.timeline).toBeInstanceOf(Array);
      expect(data.timeline.length).toBeGreaterThan(0);
      
      const firstEvent = data.timeline[0];
      expect(firstEvent).toHaveProperty('id');
      expect(firstEvent).toHaveProperty('timestamp');
      expect(firstEvent).toHaveProperty('type');
      expect(firstEvent).toHaveProperty('residentId');
      expect(firstEvent).toHaveProperty('activityId');
      expect(firstEvent).toHaveProperty('priorityScore');
      expect(firstEvent).toHaveProperty('factors');
      expect(firstEvent).toHaveProperty('data');
      expect(firstEvent).toHaveProperty('sessionId');
    });

    it('should include all required event types', async () => {
      const data = await exportEngine.exportData();
      const eventTypes = new Set(data.timeline.map(e => e.type));
      
      expect(eventTypes.has('queued')).toBe(true);
      expect(eventTypes.has('assigned')).toBe(true);
      expect(eventTypes.has('rejected')).toBe(true);
      expect(eventTypes.has('skipped')).toBe(true);
      expect(eventTypes.has('completed')).toBe(true);
    });

    it('should have events in chronological order', async () => {
      const data = await exportEngine.exportData();
      
      for (let i = 1; i < data.timeline.length; i++) {
        expect(data.timeline[i].timestamp).toBeGreaterThanOrEqual(data.timeline[i - 1].timestamp);
      }
    });

    it('should include rejection reasons for rejected events', async () => {
      const data = await exportEngine.exportData();
      const rejectedEvents = data.timeline.filter(e => e.type === 'rejected');
      
      expect(rejectedEvents.length).toBeGreaterThan(0);
      
      rejectedEvents.forEach(event => {
        expect(event.data.reason).toBeDefined();
        expect(typeof event.data.reason).toBe('string');
        expect(event.data.reason!.length).toBeGreaterThan(0);
      });
    });

    it('should include success metrics for completed events', async () => {
      const data = await exportEngine.exportData();
      const completedEvents = data.timeline.filter(e => e.type === 'completed');
      
      expect(completedEvents.length).toBeGreaterThan(0);
      
      completedEvents.forEach(event => {
        expect(event.data.successMetrics).toBeDefined();
        expect(event.data.successMetrics).toHaveProperty('efficiency');
        expect(event.data.successMetrics).toHaveProperty('satisfaction');
        expect(event.data.successMetrics).toHaveProperty('productivity');
      });
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate correct summary statistics', async () => {
      const data = await exportEngine.exportData();
      
      expect(data.summary.totalEvents).toBe(data.timeline.length);
      expect(data.summary.eventsByType).toBeDefined();
      expect(data.summary.eventsByResident).toBeDefined();
      expect(data.summary.eventsByActivity).toBeDefined();
      expect(data.summary.rejectionAnalysis).toBeDefined();
      expect(data.summary.performanceMetrics).toBeDefined();
      expect(data.summary.timelineStats).toBeDefined();
    });

    it('should calculate rejection analysis correctly', async () => {
      const data = await exportEngine.exportData();
      const { rejectionAnalysis } = data.summary;
      
      const rejectedEvents = data.timeline.filter(e => e.type === 'rejected' || e.type === 'skipped');
      expect(rejectionAnalysis.totalRejections).toBe(rejectedEvents.length);
      expect(rejectionAnalysis.rejectionRate).toBe(rejectedEvents.length / data.timeline.length);
      
      expect(rejectionAnalysis.topRejectionReasons).toBeInstanceOf(Array);
      expect(rejectionAnalysis.rejectionByResident).toBeDefined();
      expect(rejectionAnalysis.rejectionByActivity).toBeDefined();
    });

    it('should calculate performance metrics correctly', async () => {
      const data = await exportEngine.exportData();
      const { performanceMetrics } = data.summary;
      
      expect(typeof performanceMetrics.averageProcessingTime).toBe('number');
      expect(typeof performanceMetrics.averagePriorityScore).toBe('number');
      expect(typeof performanceMetrics.averageAssignmentDuration).toBe('number');
      expect(typeof performanceMetrics.queueEfficiency).toBe('number');
      expect(performanceMetrics.residentUtilization).toBeDefined();
      expect(performanceMetrics.activityUtilization).toBeDefined();
    });

    it('should calculate timeline statistics correctly', async () => {
      const data = await exportEngine.exportData();
      const { timelineStats } = data.summary;
      
      expect(timelineStats.earliestEvent).toBeDefined();
      expect(timelineStats.latestEvent).toBeDefined();
      expect(timelineStats.peakActivityTime).toBeDefined();
      expect(typeof timelineStats.averageEventsPerHour).toBe('number');
      expect(typeof timelineStats.busiestHour).toBe('number');
      
      // Validate date format
      expect(new Date(timelineStats.earliestEvent)).toBeInstanceOf(Date);
      expect(new Date(timelineStats.latestEvent)).toBeInstanceOf(Date);
    });
  });

  describe('Configuration and Filtering', () => {
    it('should respect format configuration', async () => {
      exportEngine.updateConfig({ format: 'csv' });
      const config = exportEngine.getConfig();
      
      expect(config.format).toBe('csv');
    });

    it('should filter by resident IDs', async () => {
      const data = await exportEngine.exportData(['resident-1', 'resident-2'], []);
      
      data.timeline.forEach(event => {
        expect(['resident-1', 'resident-2']).toContain(event.residentId);
      });
    });

    it('should filter by activity IDs', async () => {
      const data = await exportEngine.exportData([], ['forest-work', 'mining']);
      
      data.timeline.forEach(event => {
        expect(['forest-work', 'mining']).toContain(event.activityId);
      });
    });

    it('should filter by event types', async () => {
      exportEngine.updateConfig({ eventTypes: ['assigned', 'rejected'] });
      const data = await exportEngine.exportData();
      
      data.timeline.forEach(event => {
        expect(['assigned', 'rejected']).toContain(event.type);
      });
    });

    it('should filter by time range', async () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const thirtyMinutesAgo = now - (30 * 60 * 1000);
      
      exportEngine.updateConfig({
        timeRange: {
          startTime: new Date(oneHourAgo).toISOString(),
          endTime: new Date(thirtyMinutesAgo).toISOString(),
        },
      });
      
      const data = await exportEngine.exportData();
      
      data.timeline.forEach(event => {
        expect(event.timestamp).toBeGreaterThanOrEqual(oneHourAgo);
        expect(event.timestamp).toBeLessThanOrEqual(thirtyMinutesAgo);
      });
    });
  });

  describe('File Operations', () => {
    it('should save to file with correct path', async () => {
      const mockWriteFileSync = vi.mocked(writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});
      
      await exportEngine.saveToFile('test-output');
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        'test-output.json',
        expect.any(String),
        'utf8'
      );
    });

    it('should use correct file extension for CSV', async () => {
      const mockWriteFileSync = vi.mocked(writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});
      
      exportEngine.updateConfig({ format: 'csv' });
      await exportEngine.saveToFile('test-output');
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        'test-output.csv',
        expect.any(String),
        'utf8'
      );
    });

    it('should use default output path when none provided', async () => {
      const mockWriteFileSync = vi.mocked(writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});
      
      await exportEngine.saveToFile();
      
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        'crew-scheduler-export.json',
        expect.any(String),
        'utf8'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle empty timeline gracefully', async () => {
      // Create an export engine with no data
      const emptyEngine = new CrewSchedulerExportEngine();
      
      // Mock the timeline generation to return empty array
      vi.spyOn(emptyEngine as any, 'generateSampleTimeline').mockReturnValue([]);
      
      const data = await emptyEngine.exportData();
      
      expect(data.timeline).toEqual([]);
      expect(data.summary.totalEvents).toBe(0);
      expect(data.summary.rejectionAnalysis.rejectionRate).toBe(0);
    });

    it('should handle invalid configuration gracefully', async () => {
      exportEngine.updateConfig({
        format: 'invalid' as any,
        csvDelimiter: null as any,
      });
      
      // Should not throw error
      const data = await exportEngine.exportData();
      expect(data).toBeDefined();
    });
  });
});

describe('CrewSchedulerCLI', () => {
  let cli: CrewSchedulerCLI;

  beforeEach(() => {
    cli = new CrewSchedulerCLI();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.argv = originalArgv;
  });

  describe('Argument Parsing', () => {
    it('should parse format argument', () => {
      const args = ['--format', 'csv'];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.format).toBe('csv');
    });

    it('should parse output path argument', () => {
      const args = ['--output', 'test-file'];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.outputPath).toBe('test-file');
    });

    it('should parse resident IDs argument', () => {
      const args = ['--residents', 'resident-1,resident-2,resident-3'];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.residentIds).toEqual(['resident-1', 'resident-2', 'resident-3']);
    });

    it('should parse activity IDs argument', () => {
      const args = ['--activities', 'forest-work,mining'];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.activityIds).toEqual(['forest-work', 'mining']);
    });

    it('should parse event types argument', () => {
      const args = ['--events', 'assigned,rejected'];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.eventTypes).toEqual(['assigned', 'rejected']);
    });

    it('should parse time range arguments', () => {
      const args = ['--start', '2026-01-01T00:00:00Z', '--end', '2026-01-02T00:00:00Z'];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.startTime).toBe('2026-01-01T00:00:00Z');
      expect(parsed.endTime).toBe('2026-01-02T00:00:00Z');
    });

    it('should parse help argument', () => {
      const args = ['--help'];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.help).toBe(true);
    });

    it('should use default values for missing arguments', () => {
      const args = [];
      const parsed = (cli as any).parseArgs(args);
      
      expect(parsed.format).toBe('json');
      expect(parsed.outputPath).toBeUndefined();
      expect(parsed.residentIds).toBeUndefined();
      expect(parsed.activityIds).toBeUndefined();
      expect(parsed.eventTypes).toBeUndefined();
      expect(parsed.startTime).toBeUndefined();
      expect(parsed.endTime).toBeUndefined();
      expect(parsed.help).toBe(false);
    });
  });

  describe('CLI Execution', () => {
    it('should run export with default configuration', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockWriteFileSync = vi.mocked(writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});
      
      process.argv = ['node', 'crew-scheduler-export'];
      
      await cli.run(process.argv.slice(2));
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Starting crew scheduler export...');
      expect(mockConsoleLog).toHaveBeenCalledWith('Format: JSON');
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should run export with custom configuration', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockWriteFileSync = vi.mocked(writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});
      
      process.argv = [
        'node', 'crew-scheduler-export',
        '--format', 'csv',
        '--output', 'test-export.csv',
        '--residents', 'resident-1,resident-2',
        '--events', 'assigned,rejected'
      ];
      
      await cli.run(process.argv.slice(2));
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Format: CSV');
      expect(mockConsoleLog).toHaveBeenCalledWith('Filtering residents: resident-1,resident-2');
      expect(mockConsoleLog).toHaveBeenCalledWith('Filtering events: assigned,rejected');
      expect(mockWriteFileSync).toHaveBeenCalledWith('test-export.csv', expect.any(String), 'utf8');
    });

    it('should show help when requested', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      process.argv = ['node', 'crew-scheduler-export', '--help'];
      
      await cli.run(process.argv.slice(2));
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Idle Village Crew Scheduler CLI Export'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Options:'));
    });

    it('should handle export errors gracefully', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {} as any);
      
      // Mock export to throw an error
      vi.spyOn(cli['exportEngine'], 'exportData').mockRejectedValue(new Error('Export failed'));
      
      process.argv = ['node', 'crew-scheduler-export'];
      
      await cli.run(process.argv.slice(2));
      
      expect(mockConsoleError).toHaveBeenCalledWith('Export failed:', expect.any(Error));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Help Output', () => {
    it('should contain all required sections', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      process.argv = ['node', 'crew-scheduler-export', '--help'];
      
      await cli.run(process.argv.slice(2));
      
      const helpOutput = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      
      expect(helpOutput).toContain('Idle Village Crew Scheduler CLI Export');
      expect(helpOutput).toContain('Usage:');
      expect(helpOutput).toContain('Options:');
      expect(helpOutput).toContain('Examples:');
      expect(helpOutput).toContain('Event Types:');
      expect(helpOutput).toContain('Output Formats:');
      expect(helpOutput).toContain('--format');
      expect(helpOutput).toContain('--output');
      expect(helpOutput).toContain('--residents');
      expect(helpOutput).toContain('--activities');
      expect(helpOutput).toContain('--events');
      expect(helpOutput).toContain('--help');
    });
  });
});

describe('Main Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.argv = originalArgv;
  });

  it('should create CLI instance and run it', async () => {
    const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockWriteFileSync = vi.mocked(writeFileSync);
    mockWriteFileSync.mockImplementation(() => {});
    
    // Mock the CLI run method
    const mockRun = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(CrewSchedulerCLI.prototype, 'run').mockImplementation(mockRun);
    
    process.argv = ['node', 'crew-scheduler-export'];
    
    await main();
    
    expect(mockRun).toHaveBeenCalledWith(process.argv.slice(2));
  });
});

describe('Integration Tests', () => {
  let exportEngine: CrewSchedulerExportEngine;

  beforeEach(() => {
    exportEngine = new CrewSchedulerExportEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full export workflow', async () => {
    const mockWriteFileSync = vi.mocked(writeFileSync);
    mockWriteFileSync.mockImplementation(() => {});
    
    // Configure export
    exportEngine.updateConfig({
      format: 'json',
      includeFactors: true,
      includePerformanceMetrics: true,
      includeRejectionAnalysis: true,
      prettyPrint: true,
    });
    
    // Export data
    const data = await exportEngine.exportData(['resident-1'], ['forest-work']);
    
    // Verify structure
    expect(data.metadata).toBeDefined();
    expect(data.timeline.length).toBeGreaterThan(0);
    expect(data.summary.totalEvents).toBe(data.timeline.length);
    
    // Verify filtering
    data.timeline.forEach(event => {
      expect(event.residentId).toBe('resident-1');
      expect(event.activityId).toBe('forest-work');
    });
    
    // Save to file
    await exportEngine.saveToFile('integration-test');
    
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      'integration-test.json',
      expect.any(String),
      'utf8'
    );
  });

  it('should handle large dataset efficiently', async () => {
    const startTime = performance.now();
    
    // Generate large dataset
    const largeData = await exportEngine.exportData(
      Array.from({ length: 100 }, (_, i) => `resident-${i}`),
      Array.from({ length: 50 }, (_, i) => `activity-${i}`)
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time
    expect(duration).toBeLessThan(1000); // 1 second
    expect(largeData.timeline.length).toBeGreaterThan(0);
    expect(largeData.summary.totalEvents).toBe(largeData.timeline.length);
  });

  it('should maintain data consistency across formats', async () => {
    const data = await exportEngine.exportData();
    const jsonExport = await exportEngine.exportToJson();
    const csvExport = await exportEngine.exportToCsv();
    
    // Parse JSON to verify data integrity
    const jsonData = JSON.parse(jsonExport);
    
    expect(jsonData.timeline).toEqual(data.timeline);
    expect(jsonData.summary).toEqual(data.summary);
    
    // Verify CSV has correct number of rows
    const csvLines = csvExport.split('\n');
    expect(csvLines.length).toBe(data.timeline.length + 1); // +1 for header
    
    // Verify CSV header contains all required fields
    const header = csvLines[0];
    expect(header).toContain('timestamp');
    expect(header).toContain('type');
    expect(header).toContain('residentId');
    expect(header).toContain('activityId');
    expect(header).toContain('priorityScore');
  });
});
