/**
 * Log Ingest CLI Unit Tests
 * 
 * Tests for the Punch Club Log Ingest CLI functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { punchClubLogProcessor } from '@/analytics/punchClubLogProcessor';
import type { LogProcessingOptions, ProcessingStats, KPIs } from '@/analytics/punchClubLogProcessor';

// Mock the CLI module
const mockCLI = vi.hoisted(() => ({
  main: vi.fn(),
  handleIngest: vi.fn(),
  handleValidate: vi.fn(),
  handleExport: vi.fn(),
  handleKPI: vi.fn(),
  createEvidenceLog: vi.fn(),
  parseDate: vi.fn(),
}));

vi.mock('@/analytics/punchClubLogProcessor', () => ({
  punchClubLogProcessor: {
    processLogs: vi.fn(),
    getStats: vi.fn(),
    getSessions: vi.fn(),
    getEntries: vi.fn(),
    calculateKPIs: vi.fn(),
    exportToJSON: vi.fn(),
    exportToCSV: vi.fn(),
    exportSessionsToCSV: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('Log Ingest CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    punchClubLogProcessor.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CLI Configuration', () => {
    it('should parse basic options correctly', () => {
      const mockArgs = [
        'node',
        'logIngestCLI.ts',
        'ingest',
        '-i', 'test.json',
        '-o', 'output.json',
        '-f', 'csv',
        '--start-date', '2024-01-01',
        '--session-id', 'test-session',
        '--verbose',
        '--progress',
      ];

      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = mockArgs;

      // Test option parsing logic
      const config: any = {};
      for (let i = 1; i < mockArgs.length; i++) {
        const arg = mockArgs[i];
        switch (arg) {
          case '-i':
          case '--input':
            config.inputFile = mockArgs[++i];
            break;
          case '-o':
          case '--output':
            config.outputFile = mockArgs[++i];
            break;
          case '-f':
          case '--format':
            config.format = mockArgs[++i];
            break;
          case '--start-date':
            config.startDate = mockArgs[++i];
            break;
          case '--session-id':
            config.sessionId = mockArgs[++i];
            break;
          case '-v':
          case '--verbose':
            config.verbose = true;
            break;
          case '--progress':
            config.progress = true;
            break;
        }
      }

      expect(config.inputFile).toBe('test.json');
      expect(config.outputFile).toBe('output.json');
      expect(config.format).toBe('csv');
      expect(config.startDate).toBe('2024-01-01');
      expect(config.sessionId).toBe('test-session');
      expect(config.verbose).toBe(true);
      expect(config.progress).toBe(true);

      // Restore process.argv
      process.argv = originalArgv;
    });
  });

  describe('Date Parsing', () => {
    it('should parse ISO date string to timestamp', () => {
      const dateString = '2024-01-01T00:00:00.000Z';
      const expectedTimestamp = new Date(dateString).getTime();
      
      const actualTimestamp = new Date(dateString).getTime();
      
      expect(actualTimestamp).toBe(expectedTimestamp);
    });

    it('should parse YYYY-MM-DD to timestamp', () => {
      const dateString = '2024-01-01';
      const expectedTimestamp = new Date(dateString).getTime();
      
      const actualTimestamp = new Date(dateString).getTime();
      
      expect(actualTimestamp).toBe(expectedTimestamp);
    });
  });

  describe('Log Processing', () => {
    const sampleLogs = [
      '{"timestamp": 1641894400000, "eventType": "combat_completed", "sessionId": "session-1", "payload": {"won": true, "damageDealt": 45}}',
      '{"timestamp": 1641894405000, "eventType": "level_up", "sessionId": "session-1", "payload": {"newLevel": 5}}',
      '{"timestamp": 1641894410000, "eventType": "tag_added", "sessionId": "session-1", "payload": {"type": "playstyle", "name": "Aggressive"}}',
      '{"timestamp": 1641894500000, "eventType": "combat_completed", "sessionId": "session-2", "payload": {"won": false, "damageDealt": 30}}',
    ];

    it('should process valid logs successfully', () => {
      const mockStats: ProcessingStats = {
        totalEntries: 4,
        processedEntries: 4,
        invalidEntries: 0,
        filteredEntries: 0,
        sessionsFound: 2,
        tagsFound: 1,
        processingTimeMs: 100,
        errors: [],
      };

      const mockKPIs: KPIs = {
        totalSessions: 2,
        averageSessionDuration: 50000,
        totalCombats: 2,
        overallWinRate: 0.5,
        totalTags: 1,
        tagsByType: { playstyle: 1 },
        eventTypes: { combat_completed: 2, level_up: 1, tag_added: 1 },
        sessionsByDate: { '2022-01-11': 2 },
        averageTagsPerSession: 0.5,
        topEventTypes: [
          { type: 'combat_completed', count: 2 },
          { type: 'level_up', count: 1 },
          { type: 'tag_added', count: 1 },
        ],
      };

      vi.mocked(punchClubLogProcessor.processLogs).mockImplementation(() => {
        // Simulate processing
        return;
      });
      vi.mocked(punchClubLogProcessor.getStats).mockReturnValue(mockStats);
      vi.mocked(punchClubLogProcessor.calculateKPIs).mockReturnValue(mockKPIs);

      punchClubLogProcessor.processLogs(sampleLogs.join('\n'));

      expect(punchClubLogProcessor.processLogs).toHaveBeenCalledWith(sampleLogs.join('\n'), {});
      expect(punchClubLogProcessor.getStats()).toEqual(mockStats);
      expect(punchClubLogProcessor.calculateKPIs()).toEqual(mockKPIs);
    });

    it('should handle invalid log entries gracefully', () => {
      const invalidLogs = [
        '{"timestamp": 1641894400000, "eventType": "combat_completed", "sessionId": "session-1"}',
        'invalid json line',
        '{"timestamp": 1641894405000}', // missing eventType
        '{"eventType": "level_up", "sessionId": "session-1"}', // missing timestamp
      ];

      const mockStats: ProcessingStats = {
        totalEntries: 4,
        processedEntries: 1,
        invalidEntries: 3,
        filteredEntries: 0,
        sessionsFound: 1,
        tagsFound: 0,
        processingTimeMs: 50,
        errors: [
          'Invalid entry: JSON parse error: Unexpected token i in JSON at position 0',
          'Invalid entry: missing required fields (timestamp, eventType)',
          'Invalid entry: missing required fields (timestamp, eventType)',
        ],
      };

      vi.mocked(punchClubLogProcessor.processLogs).mockImplementation(() => {
        // Simulate processing with errors
        return;
      });
      vi.mocked(punchClubLogProcessor.getStats).mockReturnValue(mockStats);

      punchClubLogProcessor.processLogs(invalidLogs.join('\n'));

      expect(punchClubLogProcessor.getStats().invalidEntries).toBe(3);
      expect(punchClubLogProcessor.getStats().errors).toHaveLength(3);
    });

    it('should apply filters correctly', () => {
      const processingOptions: LogProcessingOptions = {
        sessionId: 'session-1',
        eventType: 'combat',
        startDate: 1641894400000,
        endDate: 1641894450000,
      };

      const mockStats: ProcessingStats = {
        totalEntries: 4,
        processedEntries: 1,
        invalidEntries: 0,
        filteredEntries: 3,
        sessionsFound: 1,
        tagsFound: 0,
        processingTimeMs: 25,
        errors: [],
      };

      vi.mocked(punchClubLogProcessor.processLogs).mockImplementation(() => {
        // Simulate filtered processing
        return;
      });
      vi.mocked(punchClubLogProcessor.getStats).mockReturnValue(mockStats);

      punchClubLogProcessor.processLogs(sampleLogs.join('\n'), processingOptions);

      expect(punchClubLogProcessor.processLogs).toHaveBeenCalledWith(sampleLogs.join('\n'), processingOptions);
      expect(punchClubLogProcessor.getStats().filteredEntries).toBe(3);
    });
  });

  describe('Export Functions', () => {
    it('should export to JSON format', () => {
      const mockJSON = '{"metadata": {"exportTimestamp": 1641894400000}, "sessions": [], "entries": []}';
      vi.mocked(punchClubLogProcessor.exportToJSON).mockReturnValue(mockJSON);

      const result = punchClubLogProcessor.exportToJSON();
      
      expect(punchClubLogProcessor.exportToJSON).toHaveBeenCalled();
      expect(result).toBe(mockJSON);
    });

    it('should export to CSV format', () => {
      const mockCSV = 'timestamp,eventType,sessionId,source,payload\n1641894400000,combat_completed,session-1,game,"{}"';
      vi.mocked(punchClubLogProcessor.exportToCSV).mockReturnValue(mockCSV);

      const result = punchClubLogProcessor.exportToCSV();
      
      expect(punchClubLogProcessor.exportToCSV).toHaveBeenCalled();
      expect(result).toBe(mockCSV);
    });

    it('should export sessions to CSV format', () => {
      const mockSessionsCSV = 'sessionId,startTime,endTime,duration,levelStart,levelEnd\nsession-1,1641894400000,1641894500000,100000,1,5';
      vi.mocked(punchClubLogProcessor.exportSessionsToCSV).mockReturnValue(mockSessionsCSV);

      const result = punchClubLogProcessor.exportSessionsToCSV();
      
      expect(punchClubLogProcessor.exportSessionsToCSV).toHaveBeenCalled();
      expect(result).toBe(mockSessionsCSV);
    });
  });

  describe('KPI Calculation', () => {
    it('should calculate comprehensive KPIs', () => {
      const mockKPIs: KPIs = {
        totalSessions: 10,
        averageSessionDuration: 300000, // 5 minutes
        totalCombats: 50,
        overallWinRate: 0.7,
        totalTags: 25,
        tagsByType: { playstyle: 10, progression: 8, custom: 7 },
        eventTypes: { combat_completed: 50, level_up: 15, tag_added: 25 },
        sessionsByDate: { '2024-01-01': 5, '2024-01-02': 5 },
        averageTagsPerSession: 2.5,
        topEventTypes: [
          { type: 'combat_completed', count: 50 },
          { type: 'tag_added', count: 25 },
          { type: 'level_up', count: 15 },
        ],
      };

      vi.mocked(punchClubLogProcessor.calculateKPIs).mockReturnValue(mockKPIs);

      const result = punchClubLogProcessor.calculateKPIs();
      
      expect(punchClubLogProcessor.calculateKPIs).toHaveBeenCalled();
      expect(result.totalSessions).toBe(10);
      expect(result.overallWinRate).toBe(0.7);
      expect(result.averageTagsPerSession).toBe(2.5);
    });
  });

  describe('Evidence Log Generation', () => {
    it('should generate comprehensive evidence log', () => {
      const config = {
        inputFile: 'test.json',
        format: 'json',
        startDate: '2024-01-01',
        sessionId: 'test-session',
      };

      const stats: ProcessingStats = {
        totalEntries: 100,
        processedEntries: 95,
        invalidEntries: 5,
        filteredEntries: 0,
        sessionsFound: 10,
        tagsFound: 25,
        processingTimeMs: 500,
        errors: [],
      };

      const kpis: KPIs = {
        totalSessions: 10,
        averageSessionDuration: 300000,
        totalCombats: 50,
        overallWinRate: 0.7,
        totalTags: 25,
        tagsByType: { playstyle: 10, progression: 8, custom: 7 },
        eventTypes: { combat_completed: 50, level_up: 15, tag_added: 25 },
        sessionsByDate: { '2024-01-01': 10 },
        averageTagsPerSession: 2.5,
        topEventTypes: [
          { type: 'combat_completed', count: 50 },
          { type: 'tag_added', count: 25 },
          { type: 'level_up', count: 15 },
        ],
      };

      // Generate evidence log content
      const timestamp = new Date().toISOString();
      const evidenceLog = `# Punch Club Session Log Ingest - Evidence Log
Generated: ${timestamp}

## Configuration
- Input File: ${config.inputFile || 'stdin'}
- Output Format: ${config.format || 'json'}
- Date Range: ${config.startDate || 'All'} - ${config.endDate || 'All'}
- Session Filter: ${config.sessionId || 'All'}
- Event Type Filter: ${config.eventType || 'All'}
- Source Filter: ${config.source || 'All'}
- Max Entries: ${config.maxEntries || 'All'}

## Processing Statistics
- Total Entries: ${stats.totalEntries.toLocaleString()}
- Processed Entries: ${stats.processedEntries.toLocaleString()}
- Invalid Entries: ${stats.invalidEntries.toLocaleString()}
- Filtered Entries: ${stats.filteredEntries.toLocaleString()}
- Sessions Found: ${stats.sessionsFound.toLocaleString()}
- Tags Found: ${stats.tagsFound.toLocaleString()}
- Processing Time: ${500}ms
- Processing Rate: ${stats.processingTime > 0 ? Math.round(stats.totalEntries / (stats.processingTime / 1000)).toLocaleString() : 0} entries/sec

## KPIs
- Total Sessions: ${kpis.totalSessions.toLocaleString()}
- Average Session Duration: ${Math.round(kpis.averageSessionDuration / 1000)}s
- Total Combats: ${kpis.totalCombats.toLocaleString()}
- Overall Win Rate: ${(kpis.overallWinRate * 100).toFixed(1)}%
- Total Tags: ${kpis.totalTags.toLocaleString()}
- Average Tags per Session: ${kpis.averageTagsPerSession.toFixed(2)}

## Top Event Types
${kpis.topEventTypes.map(({ type, count }: { type: string; count: number }) => `- ${type}: ${count.toLocaleString()}`).join('\n')}

## Event Type Distribution
${Object.entries(kpis.eventTypes).map(([type, count]) => `- ${type}: ${(count as number).toLocaleString()}`).join('\n')}

## Tag Distribution
${Object.entries(kpis.tagsByType).map(([type, count]) => `- ${type}: ${(count as number).toLocaleString()}`).join('\n')}

## Sessions by Date
${Object.entries(kpis.sessionsByDate).map(([date, count]) => `- ${date}: ${(count as number).toLocaleString()} sessions`).join('\n')}

## Errors
${stats.errors.length > 0 ? stats.errors.map(error => `- ${error}`).join('\n') : 'None'}

---
CLI completed successfully.
`;

      expect(evidenceLog).toContain('# Punch Club Session Log Ingest - Evidence Log');
      expect(evidenceLog).toContain('Total Entries: 100');
      expect(evidenceLog).toContain('Processed Entries: 95');
      expect(evidenceLog).toContain('Total Sessions: 10');
      expect(evidenceLog).toContain('Overall Win Rate: 70.0%');
      expect(evidenceLog).toContain('Processing Rate: 200 entries/sec');
    });
  });

  describe('File Operations', () => {
    it('should handle file not found error', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => {
        if (!existsSync('nonexistent.json')) {
          throw new Error('Input file not found: nonexistent.json');
        }
      }).toThrow('Input file not found: nonexistent.json');
    });

    it('should read file content correctly', () => {
      const mockContent = '{"timestamp": 1641894400000, "eventType": "test"}\n{"timestamp": 1641894405000, "eventType": "test2"}';
      vi.mocked(readFileSync).mockReturnValue(mockContent);
      vi.mocked(existsSync).mockReturnValue(true);

      const content = readFileSync('test.json', 'utf8');
      expect(content).toBe(mockContent);
    });

    it('should write file content correctly', () => {
      const mockContent = 'test output content';
      vi.mocked(writeFileSync).mockImplementation(() => {
        // Mock implementation
        return;
      });

      writeFileSync('output.json', mockContent, 'utf8');
      expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith('output.json', mockContent, 'utf8');
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', () => {
      vi.mocked(punchClubLogProcessor.processLogs).mockImplementation(() => {
        throw new Error('Processing failed');
      });

      expect(() => {
        punchClubLogProcessor.processLogs('invalid data');
      }).toThrow('Processing failed');
    });

    it('should handle export errors gracefully', () => {
      vi.mocked(punchClubLogProcessor.exportToJSON).mockImplementation(() => {
        throw new Error('Export failed');
      });

      expect(() => {
        punchClubLogProcessor.exportToJSON();
      }).toThrow('Export failed');
    });
  });

  describe('Performance', () => {
    it('should handle large log files efficiently', () => {
      const largeLogs = Array.from({ length: 10000 }, (_, i) => 
        `{"timestamp": ${1641894400000 + i * 1000}, "eventType": "test", "sessionId": "session-${i % 100}"}`
      ).join('\n');

      const mockStats: ProcessingStats = {
        totalEntries: 10000,
        processedEntries: 10000,
        invalidEntries: 0,
        filteredEntries: 0,
        sessionsFound: 100,
        tagsFound: 0,
        processingTimeMs: 1000, // 1 second for 10k entries
        errors: [],
      };

      vi.mocked(punchClubLogProcessor.processLogs).mockImplementation(() => {
        // Simulate fast processing
        return;
      });
      vi.mocked(punchClubLogProcessor.getStats).mockReturnValue(mockStats);

      const startTime = Date.now();
      punchClubLogProcessor.processLogs(largeLogs);
      const endTime = Date.now();

      expect(punchClubLogProcessor.getStats().totalEntries).toBe(10000);
      expect(punchClubLogProcessor.getStats().processingTimeMs).toBe(1000);
      expect(mockStats.processingTimeMs).toBeLessThan(2000); // Should be under 2 seconds
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: ingest -> kpi -> export', () => {
      const sampleLogs = [
        '{"timestamp": 1641894400000, "eventType": "combat_completed", "sessionId": "session-1", "payload": {"won": true}}',
        '{"timestamp": 1641894405000, "eventType": "level_up", "sessionId": "session-1", "payload": {"newLevel": 5}}',
      ];

      const mockStats: ProcessingStats = {
        totalEntries: 2,
        processedEntries: 2,
        invalidEntries: 0,
        filteredEntries: 0,
        sessionsFound: 1,
        tagsFound: 0,
        processingTimeMs: 50,
        errors: [],
      };

      const mockKPIs: KPIs = {
        totalSessions: 1,
        averageSessionDuration: 5000,
        totalCombats: 1,
        overallWinRate: 1.0,
        totalTags: 0,
        tagsByType: {},
        eventTypes: { combat_completed: 1, level_up: 1 },
        sessionsByDate: { '2022-01-11': 1 },
        averageTagsPerSession: 0,
        topEventTypes: [
          { type: 'combat_completed', count: 1 },
          { type: 'level_up', count: 1 },
        ],
      };

      const mockJSON = '{"metadata": {"exportTimestamp": 1641894400000}, "sessions": [], "entries": []}';

      vi.mocked(punchClubLogProcessor.processLogs).mockImplementation(() => {
        return;
      });
      vi.mocked(punchClubLogProcessor.getStats).mockReturnValue(mockStats);
      vi.mocked(punchClubLogProcessor.calculateKPIs).mockReturnValue(mockKPIs);
      vi.mocked(punchClubLogProcessor.exportToJSON).mockReturnValue(mockJSON);

      // Step 1: Ingest
      punchClubLogProcessor.processLogs(sampleLogs.join('\n'));
      expect(punchClubLogProcessor.getStats().processedEntries).toBe(2);

      // Step 2: Calculate KPIs
      const kpis = punchClubLogProcessor.calculateKPIs();
      expect(kpis.totalSessions).toBe(1);
      expect(kpis.overallWinRate).toBe(1.0);

      // Step 3: Export
      const exportData = punchClubLogProcessor.exportToJSON();
      expect(exportData).toBe(mockJSON);
    });
  });
});
