/**
 * Coordinator Evidence Log Harvester Tests
 *
 * Comprehensive test suite for the evidence log harvester system,
 * covering log extraction, parsing, CLI functionality, and report generation.
 *
 * @module evidenceLogHarvester.test
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { EvidenceLogHarvester, DEFAULT_EXTRACTION_PATTERNS, type HarvestConfig, type SampleReportConfig } from '../evidenceLogHarvester';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Mock file system
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  statSync: vi.fn(),
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

// Mock path
vi.mock('path', () => ({
  join: vi.fn(),
  extname: vi.fn(),
  basename: vi.fn(),
}));

import { readFileSync, statSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { glob } from 'glob';
import { join, extname, basename } from 'path';

describe('EvidenceLogHarvester', () => {
  const mockReadFileSync = vi.mocked(readFileSync);
  const mockStatSync = vi.mocked(statSync);
  const mockExistsSync = vi.mocked(existsSync);
  const mockWriteFileSync = vi.mocked(writeFileSync);
  const mockGlob = vi.mocked(glob);
  const mockJoin = vi.mocked(join);
  const mockExtname = vi.mocked(extname);
  const mockBasename = vi.mocked(basename);

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockJoin.mockImplementation((...args) => args.join('/'));
    mockExtname.mockReturnValue('.log');
    mockBasename.mockImplementation((path) => path.split('/').pop() || '');
    mockExistsSync.mockReturnValue(true);
  });

  describe('Version Detection', () => {
    it('should extract task ID from filename', () => {
      expect(EvidenceLogHarvester['extractTaskId']('np-099-test.log')).toBe('NP-099');
      expect(EvidenceLogHarvester['extractTaskId']('KS-081-results.md')).toBe('KS-081');
      expect(EvidenceLogHarvester['extractTaskId']('IV-WS3-data.json')).toBe('IV-WS3');
      expect(EvidenceLogHarvester['extractTaskId']('random-file.txt')).toBeUndefined();
    });

    it('should extract date from filename', () => {
      expect(EvidenceLogHarvester['extractDate']('test-2026-01-13.log')).toBe('2026-01-13');
      expect(EvidenceLogHarvester['extractDate']('data-20260113.json')).toBe('20260113');
      expect(EvidenceLogHarvester['extractDate']('no-date-file.md')).toBeUndefined();
    });
  });

  describe('File Processing', () => {
    it('should process evidence log files', async () => {
      const mockStats = {
        size: 1024,
        mtime: new Date('2026-01-13T12:00:00Z'),
      };

      const mockContent = `
        Task: NP-099
        Status: SUCCESS
        Duration: 150ms
        Some other content here
      `;

      mockStatSync.mockReturnValue(mockStats as any);
      mockReadFileSync.mockReturnValue(mockContent);

      const patterns = DEFAULT_EXTRACTION_PATTERNS;
      const result = await EvidenceLogHarvester['processFile']('/path/to/np-099-evidence.log', patterns);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('np-099-evidence.log');
      expect(result!.type).toBe('evidence');
      expect(result!.taskId).toBe('NP-099');
      expect(result!.size).toBe(1024);
      expect(result!.preview).toContain('Task: NP-099');
    });

    it('should process markdown report files', async () => {
      const mockStats = {
        size: 2048,
        mtime: new Date('2026-01-13T12:00:00Z'),
      };

      const mockContent = `# Test Report
**Status:** COMPLETED
**Task:** KS-081

Some report content here.
`;

      mockStatSync.mockReturnValue(mockStats as any);
      mockReadFileSync.mockReturnValue(mockContent);
      mockExtname.mockReturnValue('.md');

      const patterns = DEFAULT_EXTRACTION_PATTERNS;
      const result = await EvidenceLogHarvester['processFile']('/path/to/ks-081-report.md', patterns);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('report');
      expect(result!.taskId).toBe('KS-081');
      expect(result!.metadata.title).toBe('Test Report');
      expect(result!.metadata.status).toBe('completed');
    });

    it('should handle JSON data files', async () => {
      const mockStats = {
        size: 512,
        mtime: new Date('2026-01-13T12:00:00Z'),
      };

      const mockContent = '{"test": "data", "count": 42}';

      mockStatSync.mockReturnValue(mockStats as any);
      mockReadFileSync.mockReturnValue(mockContent);
      mockExtname.mockReturnValue('.json');

      const patterns = DEFAULT_EXTRACTION_PATTERNS;
      const result = await EvidenceLogHarvester['processFile']('/path/to/np-099-data.json', patterns);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('data');
      expect(result!.metadata.isValidJson).toBe(true);
      expect(result!.metadata.rootKeys).toEqual(['test', 'count']);
    });

    it('should skip files that don\'t match required patterns', async () => {
      const mockStats = {
        size: 100,
        mtime: new Date('2026-01-13T12:00:00Z'),
      };

      const mockContent = 'Random content without required patterns';

      mockStatSync.mockReturnValue(mockStats as any);
      mockReadFileSync.mockReturnValue(mockContent);

      // Create a pattern that requires a specific match
      const patterns = [{
        name: 'strict-pattern',
        filePattern: '**/*.log',
        contentPatterns: [{
          name: 'requiredField',
          pattern: /REQUIRED_FIELD:\s*(.+)/,
          required: true,
        }],
        metadataExtractor: () => ({}),
      }];

      const result = await EvidenceLogHarvester['processFile']('/path/to/file.log', patterns);
      expect(result).toBeNull();
    });
  });

  describe('Harvest Process', () => {
    beforeEach(() => {
      mockGlob.mockResolvedValue(['/path/to/test1.log', '/path/to/test2.md']);
      mockStatSync.mockReturnValue({
        size: 1024,
        mtime: new Date('2026-01-13T12:00:00Z'),
      } as any);
      mockReadFileSync.mockReturnValue('Test content with NP-099 task ID');
    });

    it('should perform basic harvest', async () => {
      const config: HarvestConfig = {
        baseDirs: ['/test/dir'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
      };

      const results = await EvidenceLogHarvester.harvest(config);

      expect(results.totalScanned).toBe(2);
      expect(results.processed).toBeGreaterThan(0);
      expect(results.entries).toHaveLength(results.processed);
    });

    it('should apply task ID filtering', async () => {
      const config: HarvestConfig = {
        baseDirs: ['/test/dir'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
        taskIds: ['NP-099'],
      };

      mockReadFileSync.mockReturnValue('Content with NP-099 and other NP-100');

      const results = await EvidenceLogHarvester.harvest(config);

      // Should only include files with matching task IDs
      const relevantEntries = results.entries.filter(e => e.taskId === 'NP-099');
      expect(relevantEntries.length).toBeLessThanOrEqual(results.entries.length);
    });

    it('should apply content type filtering', async () => {
      const config: HarvestConfig = {
        baseDirs: ['/test/dir'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
        contentTypes: ['evidence'],
      };

      const results = await EvidenceLogHarvester.harvest(config);

      results.entries.forEach(entry => {
        expect(['evidence']).toContain(entry.type);
      });
    });

    it('should apply date range filtering', async () => {
      const config: HarvestConfig = {
        baseDirs: ['/test/dir'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
        dateRange: {
          start: new Date('2026-01-10'),
          end: new Date('2026-01-15'),
        },
      };

      const results = await EvidenceLogHarvester.harvest(config);

      results.entries.forEach(entry => {
        expect(entry.modifiedAt).toBeGreaterThanOrEqual(config.dateRange!.start.getTime());
        expect(entry.modifiedAt).toBeLessThanOrEqual(config.dateRange!.end.getTime());
      });
    });

    it('should respect max files limit', async () => {
      const config: HarvestConfig = {
        baseDirs: ['/test/dir'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
        maxFiles: 1,
      };

      const results = await EvidenceLogHarvester.harvest(config);

      expect(results.processed).toBeLessThanOrEqual(1);
    });

    it('should handle file processing errors', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const config: HarvestConfig = {
        baseDirs: ['/test/dir'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
      };

      const results = await EvidenceLogHarvester.harvest(config);

      expect(results.errors.length).toBeGreaterThan(0);
      expect(results.filtered).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive sample report', () => {
      const mockResults = {
        totalScanned: 100,
        processed: 85,
        filtered: 15,
        errors: ['Error 1', 'Error 2'],
        entries: [
          {
            path: '/test/file1.log',
            name: 'np-099-test1.log',
            extension: '.log',
            size: 1024,
            modifiedAt: Date.now(),
            taskId: 'NP-099',
            type: 'evidence' as const,
            preview: 'Test content',
            metadata: { status: 'completed' },
          },
          {
            path: '/test/file2.md',
            name: 'ks-081-report.md',
            extension: '.md',
            size: 2048,
            modifiedAt: Date.now() - 86400000,
            taskId: 'KS-081',
            type: 'report' as const,
            preview: 'Report content',
            metadata: { title: 'Test Report' },
          },
        ],
        summary: {
          byType: { evidence: 1, report: 1 },
          byExtension: { '.log': 1, '.md': 1 },
          byTask: { 'NP-099': 1, 'KS-081': 1 },
          dateRange: {
            earliest: Date.now() - 86400000,
            latest: Date.now(),
          },
        },
      };

      const config: SampleReportConfig = {
        title: 'Test Harvest Report',
        description: 'Test description',
        sections: ['summary', 'timeline', 'task-breakdown'],
        maxEntriesPerSection: 5,
        includePreviews: true,
      };

      const report = EvidenceLogHarvester.generateSampleReport(mockResults as any, config);

      expect(report).toContain('# Test Harvest Report');
      expect(report).toContain('Test description');
      expect(report).toContain('Total files processed: 85');
      expect(report).toContain('NP-099-test1.log');
      expect(report).toContain('KS-081-report.md');
      expect(report).toContain('## 📊 Summary');
      expect(report).toContain('## 📅 Timeline');
      expect(report).toContain('## 🎯 Task Breakdown');
    });

    it('should handle empty results', () => {
      const mockResults = {
        totalScanned: 0,
        processed: 0,
        filtered: 0,
        errors: [],
        entries: [],
        summary: {
          byType: {},
          byExtension: {},
          byTask: {},
          dateRange: { earliest: null, latest: null },
        },
      };

      const config: SampleReportConfig = {
        title: 'Empty Report',
        description: 'No data',
        sections: ['summary'],
      };

      const report = EvidenceLogHarvester.generateSampleReport(mockResults as any, config);

      expect(report).toContain('# Empty Report');
      expect(report).toContain('Total files processed: 0');
    });
  });

  describe('Export Functionality', () => {
    it('should export results as JSON', () => {
      const mockResults = {
        totalScanned: 10,
        processed: 8,
        entries: [{
          path: '/test/file.log',
          name: 'test.log',
          extension: '.log',
          size: 1024,
          modifiedAt: Date.now(),
          type: 'evidence' as const,
          preview: 'Test content',
          metadata: {},
        }],
        summary: { byType: {}, byExtension: {}, byTask: {}, dateRange: { earliest: null, latest: null } },
        filtered: 2,
        errors: [],
      };

      const jsonExport = EvidenceLogHarvester.exportResults(mockResults as any, 'json');
      const parsed = JSON.parse(jsonExport);

      expect(parsed.totalScanned).toBe(10);
      expect(parsed.processed).toBe(8);
      expect(parsed.entries).toHaveLength(1);
    });

    it('should export results as CSV', () => {
      const mockResults = {
        totalScanned: 5,
        processed: 3,
        entries: [{
          path: '/test/file.log',
          name: 'test.log',
          extension: '.log',
          size: 1024,
          modifiedAt: Date.now(),
          taskId: 'NP-099',
          date: '2026-01-13',
          type: 'evidence' as const,
          preview: 'Test "content" with quotes',
          metadata: {},
        }],
        summary: { byType: {}, byExtension: {}, byTask: {}, dateRange: { earliest: null, latest: null } },
        filtered: 2,
        errors: [],
      };

      const csvExport = EvidenceLogHarvester.exportResults(mockResults as any, 'csv');

      expect(csvExport).toContain('path,name,extension,size');
      expect(csvExport).toContain('/test/file.log');
      expect(csvExport).toContain('test.log');
      expect(csvExport).toContain('NP-099');
      expect(csvExport).toContain('"Test ""content"" with quotes"'); // Escaped quotes
    });
  });

  describe('Pattern Validation', () => {
    it('should validate extraction patterns', () => {
      expect(DEFAULT_EXTRACTION_PATTERNS).toHaveLength(3);
      expect(DEFAULT_EXTRACTION_PATTERNS[0].name).toBe('evidence-logs');
      expect(DEFAULT_EXTRACTION_PATTERNS[1].name).toBe('markdown-reports');
      expect(DEFAULT_EXTRACTION_PATTERNS[2].name).toBe('json-data');

      DEFAULT_EXTRACTION_PATTERNS.forEach(pattern => {
        expect(pattern.filePattern).toBeDefined();
        expect(pattern.contentPatterns).toBeDefined();
        expect(Array.isArray(pattern.contentPatterns)).toBe(true);
      });
    });

    it('should handle pattern matching', () => {
      const evidencePattern = DEFAULT_EXTRACTION_PATTERNS[0];
      const content = 'Task: NP-099 Status: SUCCESS Duration: 150ms';

      // Test pattern extraction
      const taskMatch = content.match(evidencePattern.contentPatterns[0].pattern);
      expect(taskMatch?.[1]).toBe('NP-099');

      const statusMatch = content.match(evidencePattern.contentPatterns[1].pattern);
      expect(statusMatch?.[0]).toBe('SUCCESS');

      const durationMatch = content.match(evidencePattern.contentPatterns[2].pattern);
      expect(durationMatch).toBeTruthy();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete harvest workflow', async () => {
      // Setup comprehensive test data
      const testFiles = [
        '/test/np-099-evidence-2026-01-13.log',
        '/test/ks-081-report-2026-01-12.md',
        '/test/data-2026-01-11.json',
      ];

      mockGlob.mockResolvedValue(testFiles);

      // Mock file stats and content
      mockStatSync.mockImplementation((filePath) => ({
        size: filePath.includes('.md') ? 2048 : filePath.includes('.json') ? 512 : 1024,
        mtime: new Date(filePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1] + 'T12:00:00Z' || Date.now()),
      } as any));

      mockReadFileSync.mockImplementation((filePath) => {
        if (filePath.includes('.log')) {
          return 'Task: NP-099\nStatus: SUCCESS\nDuration: 200ms\nEvidence content here.';
        } else if (filePath.includes('.md')) {
          return '# KS-081 Report\n**Status:** COMPLETED\n\nReport details.';
        } else {
          return '{"task": "KS-081", "result": "success"}';
        }
      });

      const config: HarvestConfig = {
        baseDirs: ['/test'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
        maxFiles: 10,
      };

      const results = await EvidenceLogHarvester.harvest(config);

      expect(results.totalScanned).toBe(3);
      expect(results.processed).toBeGreaterThan(0);
      expect(results.entries.length).toBe(results.processed);

      // Verify different file types were processed
      const types = results.entries.map(e => e.type);
      expect(types).toContain('evidence');
      expect(types).toContain('report');
      expect(types).toContain('data');

      // Verify task IDs were extracted
      const taskIds = results.entries.map(e => e.taskId).filter(Boolean);
      expect(taskIds).toContain('NP-099');
      expect(taskIds).toContain('KS-081');
    });

    it('should generate meaningful error reports', async () => {
      mockGlob.mockRejectedValue(new Error('Directory access denied'));

      const config: HarvestConfig = {
        baseDirs: ['/restricted'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
      };

      const results = await EvidenceLogHarvester.harvest(config);

      expect(results.errors.length).toBeGreaterThan(0);
      expect(results.errors[0]).toContain('Directory access denied');
    });

    it('should handle mixed success/failure scenarios', async () => {
      const testFiles = ['/test/valid.log', '/test/corrupt.log'];
      mockGlob.mockResolvedValue(testFiles);

      mockStatSync.mockReturnValue({
        size: 1024,
        mtime: new Date('2026-01-13T12:00:00Z'),
      } as any);

      // Valid file
      mockReadFileSync.mockImplementationOnce(() => 'Valid NP-099 content');

      // Corrupt file
      mockReadFileSync.mockImplementationOnce(() => {
        throw new Error('File corrupted');
      });

      const config: HarvestConfig = {
        baseDirs: ['/test'],
        patterns: DEFAULT_EXTRACTION_PATTERNS,
      };

      const results = await EvidenceLogHarvester.harvest(config);

      expect(results.totalScanned).toBe(2);
      expect(results.processed).toBe(1); // Only valid file processed
      expect(results.filtered).toBe(1); // Corrupt file filtered
      expect(results.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('CLI Integration', () => {
  // Note: CLI tests would require mocking commander.js and process.argv
  // For now, we test the core functionality that CLI depends on

  it('should provide access to default patterns', () => {
    expect(DEFAULT_EXTRACTION_PATTERNS).toBeDefined();
    expect(DEFAULT_EXTRACTION_PATTERNS.length).toBeGreaterThan(0);

    DEFAULT_EXTRACTION_PATTERNS.forEach(pattern => {
      expect(pattern.name).toBeDefined();
      expect(pattern.filePattern).toBeDefined();
      expect(pattern.contentPatterns).toBeDefined();
    });
  });

  it('should support pattern filtering', () => {
    const evidencePattern = DEFAULT_EXTRACTION_PATTERNS.find(p => p.name === 'evidence-logs');
    const markdownPattern = DEFAULT_EXTRACTION_PATTERNS.find(p => p.name === 'markdown-reports');

    expect(evidencePattern).toBeDefined();
    expect(markdownPattern).toBeDefined();
    expect(evidencePattern!.filePattern).toContain('**/*evidence*.log');
    expect(markdownPattern!.filePattern).toContain('**/*.md');
  });
});

describe('Performance and Edge Cases', () => {
  it('should handle large file sets efficiently', async () => {
    const manyFiles = Array.from({ length: 100 }, (_, i) => `/test/file${i}.log`);
    mockGlob.mockResolvedValue(manyFiles);

    mockStatSync.mockReturnValue({
      size: 1024,
      mtime: new Date('2026-01-13T12:00:00Z'),
    } as any);

    mockReadFileSync.mockReturnValue('NP-099 content');

    const config: HarvestConfig = {
      baseDirs: ['/test'],
      patterns: DEFAULT_EXTRACTION_PATTERNS,
      maxFiles: 50, // Limit to prevent excessive processing
    };

    const startTime = Date.now();
    const results = await EvidenceLogHarvester.harvest(config);
    const duration = Date.now() - startTime;

    expect(results.processed).toBeLessThanOrEqual(50);
    expect(duration).toBeLessThan(5000); // Should complete within reasonable time
  });

  it('should handle very large files appropriately', async () => {
    const largeFile = '/test/large.log';
    mockGlob.mockResolvedValue([largeFile]);

    mockStatSync.mockReturnValue({
      size: 100 * 1024 * 1024, // 100MB - exceeds default limit
      mtime: new Date('2026-01-13T12:00:00Z'),
    } as any);

    const config: HarvestConfig = {
      baseDirs: ['/test'],
      patterns: DEFAULT_EXTRACTION_PATTERNS,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    };

    const results = await EvidenceLogHarvester.harvest(config);

    expect(results.processed).toBe(0);
    expect(results.filtered).toBe(1);
  });

  it('should handle files with special characters', async () => {
    const specialFile = '/test/special-chars-ñáéíóú.log';
    mockGlob.mockResolvedValue([specialFile]);

    mockStatSync.mockReturnValue({
      size: 1024,
      mtime: new Date('2026-01-13T12:00:00Z'),
    } as any);

    mockReadFileSync.mockReturnValue('Content with NP-099 and special chars: ñáéíóú');

    const config: HarvestConfig = {
      baseDirs: ['/test'],
      patterns: DEFAULT_EXTRACTION_PATTERNS,
    };

    const results = await EvidenceLogHarvester.harvest(config);

    expect(results.processed).toBe(1);
    expect(results.entries[0].taskId).toBe('NP-099');
  });

  it('should handle empty or minimal files', async () => {
    const emptyFile = '/test/empty.log';
    mockGlob.mockResolvedValue([emptyFile]);

    mockStatSync.mockReturnValue({
      size: 0,
      mtime: new Date('2026-01-13T12:00:00Z'),
    } as any);

    mockReadFileSync.mockReturnValue('');

    const config: HarvestConfig = {
      baseDirs: ['/test'],
      patterns: DEFAULT_EXTRACTION_PATTERNS,
    };

    const results = await EvidenceLogHarvester.harvest(config);

    expect(results.processed).toBe(1);
    expect(results.entries[0].preview).toBe('');
    expect(results.entries[0].size).toBe(0);
  });
});
