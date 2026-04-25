/**
 * Guardian Evidence Indexer Tests
 * 
 * Unit tests for the Guardian Evidence Indexer system including
 * parsing, filtering, statistics calculation, and CLI functionality.
 * 
 * @since NP-058 – Guardian Evidence Indexer
 */

import { describe, it, expect, beforeEach, jest, afterEach } from 'vitest';
import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join } from 'path';
import type {
  EvidenceEntry,
  EvidenceIndexerConfig,
  IndexStatistics,
  EvidenceFilter,
  SafeguardResult,
} from '../../../src/analytics/guardian/EvidenceIndexer';
import {
  DEFAULT_EVIDENCE_INDEXER_CONFIG,
  createSafeEvidenceIndexerConfig,
  parseEvidenceLog,
  filterEvidenceEntries,
  calculateIndexStatistics,
  validateEvidenceEntry,
  extractPromptId,
  extractDateFromFilename,
} from '../../../src/analytics/guardian/EvidenceIndexer';
import { EvidenceIndexer } from '../../../scripts/guardian/evidenceIndexer';

// Mock fs operations
jest.mock('fs/promises');
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockStat = stat as jest.MockedFunction<typeof stat>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('EvidenceIndexer Core', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('Configuration', () => {
    it('creates safe configuration with defaults', () => {
      const config = createSafeEvidenceIndexerConfig();
      
      expect(config.baseDirectory).toBe('test-results');
      expect(config.outputDirectory).toBe('test-results/indexes');
      expect(config.includePatterns).toEqual(['*.log', '*.md']);
      expect(config.maxFileSize).toBe(10 * 1024 * 1024);
    });

    it('merges custom configuration with defaults', () => {
      const customConfig = {
        baseDirectory: 'custom-test-results',
        maxFileSize: 5 * 1024 * 1024,
      };
      
      const config = createSafeEvidenceIndexerConfig(customConfig);
      
      expect(config.baseDirectory).toBe('custom-test-results');
      expect(config.maxFileSize).toBe(5 * 1024 * 1024);
      expect(config.includePatterns).toEqual(['*.log', '*.md']); // Default preserved
    });

    it('returns default config for invalid input', () => {
      const invalidConfig = {
        baseDirectory: 123, // Invalid type
        maxFileSize: -1000, // Invalid value
      };
      
      const config = createSafeEvidenceIndexerConfig(invalidConfig);
      
      expect(config).toEqual(DEFAULT_EVIDENCE_INDEXER_CONFIG);
    });
  });

  describe('Filename Parsing', () => {
    it('extracts prompt ID from filename', () => {
      expect(extractPromptId('np-058-guardian-evidence-index-2026-01-20.log')).toBe('np-058');
      expect(extractPromptId('NP-045-pc-surge-tutorial-2026-01-19.log')).toBe('np-045');
      expect(extractPromptId('invalid-filename.log')).toBeNull();
      expect(extractPromptId('no-number-here.log')).toBeNull();
    });

    it('extracts date from filename', () => {
      expect(extractDateFromFilename('np-058-guardian-evidence-index-2026-01-20.log')).toBe(
        new Date('2026-01-20').getTime()
      );
      expect(extractDateFromFilename('test-2025-12-31.md')).toBe(
        new Date('2025-12-31').getTime()
      );
      expect(extractDateFromFilename('no-date.log')).toBeNull();
      expect(extractDateFromFilename('invalid-2026-13-01.log')).toBeNull(); // Invalid month
    });
  });

  describe('Evidence Log Parsing', () => {
    const mockLogContent = `
# NP-058 – Guardian Evidence Indexer
## Evidence Log – 2026-01-20

### Status: COMPLETATO

AGENT
Guardian-Bot – Evidence Index

### Safeguard Results:
- **Lint**: ✅ PASS (32 warnings, 6 errors - non-blocking)
- **Test**: ❌ FAIL (16 failed due to import issues)
- **Build**: ✅ PASS
- **Kanban**: ✅ PASS (54 prompts validated)

### Summary
Successfully implemented evidence indexing system with config-first design.

### Tags
evidence, indexing, guardian, completed
`;

    it('parses evidence log successfully', async () => {
      mockReadFile.mockResolvedValue(mockLogContent);
      mockStat.mockResolvedValue({
        size: 1024,
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      const result = await parseEvidenceLog('/path/to/np-058-guardian-evidence-index-2026-01-20.log');

      expect(result).toBeTruthy();
      expect(result!.promptId).toBe('np-058');
      expect(result!.agent).toBe('Guardian-Bot – Evidence Index');
      expect(result!.status).toBe('completato');
      expect(result!.fileSize).toBe(1024);
      expect(result!.safeguards).toHaveLength(4);
      expect(result!.tags).toEqual(['evidence', 'indexing', 'guardian', 'completed']);
    });

    it('returns null for invalid filename', async () => {
      mockReadFile.mockResolvedValue(mockLogContent);

      const result = await parseEvidenceLog('/path/to/invalid-filename.log');

      expect(result).toBeNull();
    });

    it('handles parsing errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await parseEvidenceLog('/path/to/missing.log');

      expect(result).toBeNull();
    });

    it('extracts safeguard results correctly', async () => {
      const logWithSafeguards = `
# Evidence Log

### Safeguard Results:
- **Lint**: ✅ PASS (No issues)
- **Test**: ❌ FAIL (5 tests failed)
- **Build**: ⚠️ WARNING (2 warnings)
- **Kanban**: ✅ PASS (All good)
`;

      mockReadFile.mockResolvedValue(logWithSafeguards);
      mockStat.mockResolvedValue({ size: 500, isFile: () => true, isDirectory: () => false } as any);

      const result = await parseEvidenceLog('/path/to/np-058-test-2026-01-20.log');

      expect(result!.safeguards).toHaveLength(4);
      expect(result!.safeguards[0].type).toBe('lint');
      expect(result!.safeguards[0].status).toBe('pass');
      expect(result!.safeguards[1].type).toBe('test');
      expect(result!.safeguards[1].status).toBe('fail');
      expect(result!.safeguards[2].type).toBe('build');
      expect(result!.safeguards[2].status).toBe('warning');
    });
  });

  describe('Evidence Validation', () => {
    it('validates correct evidence entry', () => {
      const validEntry: EvidenceEntry = {
        id: 'np-058-1642675200000',
        promptId: 'np-058',
        promptTitle: 'Guardian Evidence Indexer',
        agent: 'Guardian-Bot',
        status: 'completato',
        createdAt: Date.now(),
        completedAt: Date.now(),
        logPath: '/path/to/log',
        fileSize: 1024,
        safeguards: [],
        tags: ['test'],
        dependencies: [],
        format: 'log',
      };

      expect(validateEvidenceEntry(validEntry)).toBe(true);
    });

    it('rejects invalid evidence entry', () => {
      const invalidEntry = {
        id: 'test',
        promptId: 123, // Invalid type
        // Missing required fields
      };

      expect(validateEvidenceEntry(invalidEntry)).toBe(false);
    });
  });

  describe('Evidence Filtering', () => {
    const mockEntries: EvidenceEntry[] = [
      {
        id: 'np-058-1',
        promptId: 'np-058',
        promptTitle: 'Evidence Indexer',
        agent: 'Guardian-Bot',
        status: 'completato',
        createdAt: new Date('2026-01-20').getTime(),
        fileSize: 1024,
        safeguards: [
          { type: 'lint', status: 'pass', timestamp: Date.now() },
          { type: 'test', status: 'pass', timestamp: Date.now() },
        ],
        tags: ['evidence', 'indexing'],
        dependencies: [],
        format: 'log',
        logPath: '/path/1',
      },
      {
        id: 'np-059-1',
        promptId: 'np-059',
        promptTitle: 'Another Task',
        agent: 'Cascade',
        status: 'in_corso',
        createdAt: new Date('2026-01-19').getTime(),
        fileSize: 2048,
        safeguards: [
          { type: 'lint', status: 'fail', timestamp: Date.now() },
        ],
        tags: ['test', 'different'],
        dependencies: [],
        format: 'md',
        logPath: '/path/2',
      },
    ];

    it('filters by prompt ID', () => {
      const filter: EvidenceFilter = { promptId: 'np-058' };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result).toHaveLength(1);
      expect(result[0].promptId).toBe('np-058');
    });

    it('filters by agent', () => {
      const filter: EvidenceFilter = { agent: 'cascade' };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result).toHaveLength(1);
      expect(result[0].agent).toBe('Cascade');
    });

    it('filters by status', () => {
      const filter: EvidenceFilter = { status: 'completato' };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completato');
    });

    it('filters by date range', () => {
      const filter: EvidenceFilter = {
        dateRange: {
          start: new Date('2026-01-20').setHours(0, 0, 0, 0),
          end: new Date('2026-01-20').setHours(23, 59, 59, 999),
        },
      };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result).toHaveLength(1);
      expect(result[0].promptId).toBe('np-058');
    });

    it('filters by tags', () => {
      const filter: EvidenceFilter = { tags: ['evidence'] };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('evidence');
    });

    it('filters by safeguard status', () => {
      const filter: EvidenceFilter = { safeguardStatus: 'pass' };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result).toHaveLength(1);
      expect(result[0].promptId).toBe('np-058');
    });

    it('sorts results', () => {
      const filter: EvidenceFilter = { sortBy: 'fileSize', sortOrder: 'desc' };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result[0].fileSize).toBe(2048);
      expect(result[1].fileSize).toBe(1024);
    });

    it('limits results', () => {
      const filter: EvidenceFilter = { limit: 1 };
      const result = filterEvidenceEntries(mockEntries, filter);

      expect(result).toHaveLength(1);
    });
  });

  describe('Statistics Calculation', () => {
    const mockEntries: EvidenceEntry[] = [
      {
        id: '1',
        promptId: 'np-058',
        promptTitle: 'Task 1',
        agent: 'Agent-A',
        status: 'completato',
        createdAt: Date.now(),
        fileSize: 1024,
        safeguards: [
          { type: 'lint', status: 'pass', timestamp: Date.now() },
          { type: 'test', status: 'pass', timestamp: Date.now() },
        ],
        tags: [],
        dependencies: [],
        format: 'log',
        logPath: '/path/1',
      },
      {
        id: '2',
        promptId: 'np-059',
        promptTitle: 'Task 2',
        agent: 'Agent-B',
        status: 'in_corso',
        createdAt: Date.now(),
        fileSize: 2048,
        safeguards: [
          { type: 'lint', status: 'fail', timestamp: Date.now() },
          { type: 'test', status: 'pass', timestamp: Date.now() },
        ],
        tags: [],
        dependencies: [],
        format: 'log',
        logPath: '/path/2',
      },
      {
        id: '3',
        promptId: 'np-058',
        promptTitle: 'Task 3',
        agent: 'Agent-A',
        status: 'failed',
        createdAt: Date.now(),
        fileSize: 512,
        safeguards: [
          { type: 'lint', status: 'warning', timestamp: Date.now() },
        ],
        tags: [],
        dependencies: [],
        format: 'log',
        logPath: '/path/3',
      },
    ];

    it('calculates statistics correctly', () => {
      const stats = calculateIndexStatistics(mockEntries);

      expect(stats.totalEntries).toBe(3);
      expect(stats.entriesByStatus.completato).toBe(1);
      expect(stats.entriesByStatus.in_corso).toBe(1);
      expect(stats.entriesByStatus.failed).toBe(1);
      expect(stats.entriesByStatus.non_assegnato).toBe(0);
      
      expect(stats.entriesByAgent['Agent-A']).toBe(2);
      expect(stats.entriesByAgent['Agent-B']).toBe(1);
      
      expect(stats.entriesByPrompt['np-058']).toBe(2);
      expect(stats.entriesByPrompt['np-059']).toBe(1);
      
      expect(stats.safeguardPassRate).toBe(60); // 3 pass out of 5 total
      expect(stats.averageFileSize).toBe((1024 + 2048 + 512) / 3);
    });

    it('handles empty entries array', () => {
      const stats = calculateIndexStatistics([]);

      expect(stats.totalEntries).toBe(0);
      expect(stats.safeguardPassRate).toBe(0);
      expect(stats.averageFileSize).toBe(0);
      expect(Object.keys(stats.entriesByAgent)).toHaveLength(0);
    });
  });
});

describe('EvidenceIndexer Class', () => {
  let indexer: EvidenceIndexer;
  let config: EvidenceIndexerConfig;

  beforeEach(() => {
    config = createSafeEvidenceIndexerConfig();
    indexer = new EvidenceIndexer(config);
    jest.clearAllMocks();
  });

  describe('Directory Scanning', () => {
    it('scans directory for evidence files', async () => {
      const mockFiles = [
        { name: 'np-058-evidence.log', isFile: () => true, isDirectory: () => false },
        { name: 'np-059-report.md', isFile: () => true, isDirectory: () => false },
        { name: 'subdir', isFile: () => false, isDirectory: () => true },
        { name: '.gitignore', isFile: () => true, isDirectory: () => false },
      ];

      mockReaddir.mockResolvedValue(mockFiles as any);

      // Mock recursive call for subdirectory
      mockReaddir
        .mockResolvedValueOnce(mockFiles as any)
        .mockResolvedValueOnce([
          { name: 'np-060-test.log', isFile: () => true, isDirectory: () => false },
        ] as any);

      const files = await indexer['scanDirectory']('/test/path');

      expect(files).toHaveLength(3); // 2 matching files + 1 in subdir
      expect(files[0]).toContain('np-058-evidence.log');
      expect(files[1]).toContain('np-059-report.md');
      expect(files[2]).toContain('np-060-test.log');
    });

    it('handles directory scanning errors', async () => {
      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      const files = await indexer['scanDirectory']('/restricted/path');

      expect(files).toHaveLength(0);
    });
  });

  describe('File Parsing', () => {
    it('parses multiple files successfully', async () => {
      const mockLogContent = `
# NP-058 – Test Evidence
## Evidence Log – 2026-01-20
### Status: COMPLETATO
AGENT: Test-Agent
`;

      mockReadFile.mockResolvedValue(mockLogContent);
      mockStat.mockResolvedValue({ size: 100, isFile: () => true, isDirectory: () => false } as any);

      const filePaths = ['/path/np-058-test-2026-01-20.log'];
      const entries = await indexer['parseFiles'](filePaths);

      expect(entries).toHaveLength(1);
      expect(entries[0].promptId).toBe('np-058');
      expect(entries[0].agent).toBe('Test-Agent');
    });

    it('skips files that are too large', async () => {
      mockStat.mockResolvedValue({ 
        size: 20 * 1024 * 1024, // 20MB - larger than maxFileSize
        isFile: () => true, 
        isDirectory: () => false 
      } as any);

      const filePaths = ['/path/large-file.log'];
      const entries = await indexer['parseFiles'](filePaths);

      expect(entries).toHaveLength(0);
    });
  });

  describe('Index Generation', () => {
    it('generates complete index', async () => {
      const mockFiles = [
        { name: 'np-058-test.log', isFile: () => true, isDirectory: () => false },
      ];

      mockReaddir.mockResolvedValue(mockFiles as any);
      mockReadFile.mockResolvedValue('# Test log content');
      mockStat.mockResolvedValue({ size: 100, isFile: () => true, isDirectory: () => false } as any);

      await indexer.generateIndex('/test/path');

      expect(indexer['entries']).toBeDefined();
      expect(indexer['statistics']).toBeDefined();
      expect(indexer['statistics']!.totalEntries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Export Functions', () => {
    beforeEach(() => {
      // Set up some mock entries
      indexer['entries'] = [
        {
          id: 'test-1',
          promptId: 'np-058',
          promptTitle: 'Test Task',
          agent: 'Test-Agent',
          status: 'completato',
          createdAt: Date.now(),
          fileSize: 1024,
          safeguards: [{ type: 'lint', status: 'pass', timestamp: Date.now() }],
          tags: ['test'],
          dependencies: [],
          format: 'log',
          logPath: '/path/test.log',
        },
      ];
      indexer['statistics'] = calculateIndexStatistics(indexer['entries']);
    });

    it('exports to JSON', () => {
      const json = indexer.exportToJson();

      expect(json).toContain('np-058');
      expect(json).toContain('Test-Agent');
      expect(json).toContain('completato');
      
      const parsed = JSON.parse(json);
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.statistics).toBeDefined();
    });

    it('exports to Markdown', () => {
      const markdown = indexer.exportToMarkdown();

      expect(markdown).toContain('# Guardian Evidence Index');
      expect(markdown).toContain('np-058');
      expect(markdown).toContain('Test-Agent');
      expect(markdown).toContain('**Statistics**');
    });

    it('exports to CSV', () => {
      const csv = indexer.exportToCsv();

      expect(csv).toContain('ID,Prompt ID,Prompt Title');
      expect(csv).toContain('np-058');
      expect(csv).toContain('Test-Agent');
      expect(csv).toContain('completato');
    });
  });

  describe('File Saving', () => {
    it('saves content to file', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await indexer.saveToFile('test content', '/output/test.json');

      expect(mockMkdir).toHaveBeenCalledWith('/output', { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith('/output/test.json', 'test content', 'utf-8');
    });

    it('handles save errors', async () => {
      mockMkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(indexer.saveToFile('content', '/restricted/test.json')).rejects.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  it('handles complete workflow', async () => {
    // Mock complete file system
    const mockFiles = [
      { name: 'np-058-evidence-2026-01-20.log', isFile: () => true, isDirectory: () => false },
      { name: 'np-059-report-2026-01-19.md', isFile: () => true, isDirectory: () => false },
    ];

    const mockLogContent = `
# NP-058 – Test Evidence
## Evidence Log – 2026-01-20
### Status: COMPLETATO
AGENT: Test-Agent
### Safeguard Results:
- **Lint**: ✅ PASS
- **Test**: ✅ PASS
`;

    mockReaddir.mockResolvedValue(mockFiles as any);
    mockReadFile.mockResolvedValue(mockLogContent);
    mockStat.mockResolvedValue({ size: 500, isFile: () => true, isDirectory: () => false } as any);

    const indexer = new EvidenceIndexer(DEFAULT_EVIDENCE_INDEXER_CONFIG);
    await indexer.generateIndex('/test/path');

    expect(indexer['entries']).toHaveLength(2);
    expect(indexer['statistics']!.totalEntries).toBe(2);
    expect(indexer['statistics']!.safeguardPassRate).toBe(100);

    // Test filtering
    const filtered = indexer['filterEntries']({ promptId: 'np-058' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].promptId).toBe('np-058');

    // Test exports
    const json = indexer.exportToJson();
    expect(JSON.parse(json).entries).toHaveLength(2);

    const markdown = indexer.exportToMarkdown();
    expect(markdown).toContain('np-058');
    expect(markdown).toContain('Test-Agent');

    const csv = indexer.exportToCsv();
    expect(csv.split('\n')).toHaveLength(3); // Header + 2 data rows
  });
});
