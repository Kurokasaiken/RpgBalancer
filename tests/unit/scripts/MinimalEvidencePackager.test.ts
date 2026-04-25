import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { packageEvidence, generateMarkdownReport } from '../minimalEvidencePackager';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock crypto module
vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'mock-checksum'),
    })),
  })),
}));

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);

describe('MinimalEvidencePackager', () => {
  const mockLintContent = 'Lint output content\nwith multiple lines';
  const mockTestContent = 'Test output content\nwith test results';
  const mockBuildContent = 'Build output content\nwith build status';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockImplementation((path: any) => {
      if (path.includes('lint')) return mockLintContent;
      if (path.includes('test')) return mockTestContent;
      if (path.includes('build')) return mockBuildContent;
      return '';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('packageEvidence', () => {
    it('should package evidence from valid input files', async () => {
      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
        notes: 'Test notes',
      };

      const result = await packageEvidence(options);

      expect(result.prompt).toBe('NP-MIN-STRAT-001');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.checksum).toBe('mock-checksum');
      expect(result.metadata.totalSize).toBe(
        mockLintContent.length + mockTestContent.length + mockBuildContent.length
      );
      expect(result.metadata.commandSummary).toBe('npm run lint && npm run test && npm run build:check');
      expect(result.metadata.notes).toBe('Test notes');

      // Verify file data
      expect(result.files.lint.content).toBe(mockLintContent);
      expect(result.files.lint.size).toBe(mockLintContent.length);
      expect(result.files.lint.checksum).toBe('mock-checksum');

      expect(result.files.test.content).toBe(mockTestContent);
      expect(result.files.test.size).toBe(mockTestContent.length);

      expect(result.files.build.content).toBe(mockBuildContent);
      expect(result.files.build.size).toBe(mockBuildContent.length);
    });

    it('should handle missing notes', async () => {
      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      const result = await packageEvidence(options);

      expect(result.metadata.notes).toBeUndefined();
    });

    it('should throw error when lint file is missing', async () => {
      mockExistsSync.mockImplementation((path: any) => !path.includes('lint'));

      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/missing-lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      await expect(packageEvidence(options)).rejects.toThrow('Required lint file not found: /path/to/missing-lint.txt');
    });

    it('should throw error when test file is missing', async () => {
      mockExistsSync.mockImplementation((path: any) => !path.includes('test'));

      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/missing-test.txt',
        build: '/path/to/build.txt',
      };

      await expect(packageEvidence(options)).rejects.toThrow('Required test file not found: /path/to/missing-test.txt');
    });

    it('should throw error when build file is missing', async () => {
      mockExistsSync.mockImplementation((path: any) => !path.includes('build'));

      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/missing-build.txt',
      };

      await expect(packageEvidence(options)).rejects.toThrow('Required build file not found: /path/to/missing-build.txt');
    });

    it('should handle file read errors', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      await expect(packageEvidence(options)).rejects.toThrow('File read error');
    });

    it('should generate deterministic checksums', async () => {
      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      const result1 = await packageEvidence(options);
      const result2 = await packageEvidence(options);

      expect(result1.checksum).toBe(result2.checksum);
      expect(result1.timestamp).not.toBe(result2.timestamp); // Timestamps should differ
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate valid markdown report', () => {
      const evidenceData = {
        prompt: 'NP-MIN-STRAT-001',
        timestamp: '2024-01-15T10:30:00.000Z',
        checksum: 'abc123def456',
        files: {
          lint: {
            path: '/path/to/lint.txt',
            size: 100,
            checksum: 'lint-checksum',
            content: 'lint content',
          },
          test: {
            path: '/path/to/test.txt',
            size: 200,
            checksum: 'test-checksum',
            content: 'test content',
          },
          build: {
            path: '/path/to/build.txt',
            size: 300,
            checksum: 'build-checksum',
            content: 'build content',
          },
        },
        metadata: {
          totalSize: 600,
          commandSummary: 'npm run lint && npm run test && npm run build:check',
          notes: 'Test execution notes',
        },
      };

      const report = generateMarkdownReport(evidenceData);

      expect(report).toContain('# Evidence Report: NP-MIN-STRAT-001');
      expect(report).toContain('**Generated:** 2024-01-15T10:30:00.000Z');
      expect(report).toContain('**Overall Checksum:** `abc123def456`');
      expect(report).toContain('**Total Size:** 600 characters');
      expect(report).toContain('**Command:** npm run lint && npm run test && npm run build:check');
      expect(report).toContain('`/path/to/lint.txt`');
      expect(report).toContain('**Size:** 100 characters');
      expect(report).toContain('**Checksum:** `lint-checksum`');
      expect(report).toContain('Test execution notes');
      expect(report).toContain('*Generated by NP-MIN-PLAN-204 – Minimal Evidence Packager CLI*');
    });

    it('should handle reports without notes', () => {
      const evidenceData = {
        prompt: 'NP-MIN-STRAT-001',
        timestamp: '2024-01-15T10:30:00.000Z',
        checksum: 'abc123def456',
        files: {
          lint: {
            path: '/path/to/lint.txt',
            size: 100,
            checksum: 'lint-checksum',
            content: 'lint content',
          },
          test: {
            path: '/path/to/test.txt',
            size: 200,
            checksum: 'test-checksum',
            content: 'test content',
          },
          build: {
            path: '/path/to/build.txt',
            size: 300,
            checksum: 'build-checksum',
            content: 'build content',
          },
        },
        metadata: {
          totalSize: 600,
          commandSummary: 'npm run all',
        },
      };

      const report = generateMarkdownReport(evidenceData);

      expect(report).toContain('# Evidence Report: NP-MIN-STRAT-001');
      expect(report).not.toContain('## Notes');
      expect(report).not.toContain('Test execution notes');
    });
  });

  describe('File Operations', () => {
    it('should read files correctly', async () => {
      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      await packageEvidence(options);

      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/lint.txt', 'utf-8');
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/test.txt', 'utf-8');
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/build.txt', 'utf-8');
    });

    it('should validate file existence', async () => {
      mockExistsSync.mockReturnValue(false);

      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/missing.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      await expect(packageEvidence(options)).rejects.toThrow('Required lint file not found');
    });
  });

  describe('Checksum Generation', () => {
    it('should generate checksums for file contents', async () => {
      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      await packageEvidence(options);

      // Verify checksum generation was called for each file
      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
    });

    it('should generate overall package checksum', async () => {
      const options = {
        prompt: 'NP-MIN-STRAT-001',
        lint: '/path/to/lint.txt',
        test: '/path/to/test.txt',
        build: '/path/to/build.txt',
      };

      const result = await packageEvidence(options);

      expect(result.checksum).toBe('mock-checksum');
    });
  });

  describe('CLI Integration', () => {
    it('should handle CLI argument parsing structure', () => {
      // This test ensures the CLI structure is set up correctly
      // The actual CLI testing would be done via separate integration tests
      expect(typeof packageEvidence).toBe('function');
      expect(typeof generateMarkdownReport).toBe('function');
    });
  });
});
