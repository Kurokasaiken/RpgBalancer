/**
 * Guardian Evidence Archive Rotator Tests
 * 
 * Unit tests for the Guardian Evidence Archive Rotator system including
 * archive creation, rotation, cleanup, and CLI functionality.
 * 
 * @since NP-060 – Guardian Evidence Archive Rotator
 */

import { describe, it, expect, beforeEach, jest, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, unlink, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import type {
  ArchiveConfig,
  ArchiveMetadata,
  RotationResult,
  ArchiveEntry,
} from '../../../src/analytics/guardian/EvidenceArchiveService';
import {
  DEFAULT_ARCHIVE_CONFIG,
  createSafeArchiveConfig,
  calculateChecksum,
  determineFileType,
  matchesPatterns,
  scanDirectory,
  createArchiveMetadata,
  saveArchiveMetadata,
  loadArchiveMetadata,
  getExistingArchives,
  shouldCleanupArchive,
  deleteArchive,
  createArchiveIndex,
  saveArchiveIndex,
  generateTelemetryEvent,
} from '../../../src/analytics/guardian/EvidenceArchiveService';
import { EvidenceArchiveRotator } from '../../../scripts/guardian/evidenceArchiveRotator';

// Mock fs operations
jest.mock('fs/promises');
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockUnlink = unlink as jest.MockedFunction<typeof unlink>;
const mockReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockStat = stat as jest.MockedFunction<typeof stat>;

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('EvidenceArchiveService Core', () => {
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
      const config = createSafeArchiveConfig();
      
      expect(config.baseDirectory).toBe('test-results');
      expect(config.archiveDirectory).toBe('test-results/archives');
      expect(config.retention.maxAgeDays).toBe(90);
      expect(config.compression.level).toBe(6);
    });

    it('merges custom configuration with defaults', () => {
      const customConfig = {
        baseDirectory: 'custom-test-results',
        retention: {
          maxAgeDays: 30,
          maxArchiveSizeMB: 50,
          maxArchives: 5,
        },
      };
      
      const config = createSafeArchiveConfig(customConfig);
      
      expect(config.baseDirectory).toBe('custom-test-results');
      expect(config.retention.maxAgeDays).toBe(30);
      expect(config.compression.level).toBe(6); // Default preserved
    });

    it('returns default config for invalid input', () => {
      const invalidConfig = {
        baseDirectory: 123, // Invalid type
        retention: {
          maxAgeDays: -10, // Invalid value
          maxArchiveSizeMB: 0,
          maxArchives: 0,
        },
      };
      
      const config = createSafeArchiveConfig(invalidConfig);
      
      expect(config).toEqual(DEFAULT_ARCHIVE_CONFIG);
    });
  });

  describe('File Operations', () => {
    it('calculates file checksum', async () => {
      const testData = Buffer.from('test data');
      mockReadFile.mockResolvedValue(testData);
      
      const checksum = await calculateChecksum('test-file.txt');
      
      const expectedHash = createHash('sha256').update(testData).digest('hex');
      expect(checksum).toBe(expectedHash);
      expect(mockReadFile).toHaveBeenCalledWith('test-file.txt');
    });

    it('handles checksum calculation errors', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      
      await expect(calculateChecksum('missing-file.txt')).rejects.toThrow(
        'Failed to calculate checksum for missing-file.txt'
      );
    });

    it('determines file type correctly', () => {
      const config = DEFAULT_ARCHIVE_CONFIG;
      
      expect(determineFileType('np-058-evidence.log', config)).toBe('evidence');
      expect(determineFileType('archive-index.json', config)).toBe('index');
      expect(determineFileType('config.json', config)).toBe('config');
      expect(determineFileType('random-file.txt', config)).toBe('other');
    });

    it('matches file patterns correctly', () => {
      expect(matchesPatterns('test.log', ['*.log'], [])).toBe(true);
      expect(matchesPatterns('test.txt', ['*.log'], [])).toBe(false);
      expect(matchesPatterns('test.log', ['*.log'], ['*.tmp'])).toBe(true);
      expect(matchesPatterns('test.tmp', ['*.log'], ['*.tmp'])).toBe(false);
    });
  });

  describe('Archive Metadata', () => {
    it('creates archive metadata correctly', () => {
      const entries: ArchiveEntry[] = [
        {
          path: 'test.log',
          name: 'test.log',
          size: 1024,
          modifiedTime: Date.now(),
          checksum: 'abc123',
          type: 'evidence',
        },
      ];
      
      const metadata = createArchiveMetadata('test-archive', '/path/to/archive.zip', entries, DEFAULT_ARCHIVE_CONFIG);
      
      expect(metadata.id).toBe('test-archive');
      expect(metadata.archivePath).toBe('/path/to/archive.zip');
      expect(metadata.fileCount).toBe(1);
      expect(metadata.totalUncompressedSize).toBe(1024);
      expect(metadata.status).toBe('creating');
      expect(metadata.retention.expiresAt).toBeGreaterThan(Date.now());
    });

    it('saves and loads archive metadata', async () => {
      const metadata: ArchiveMetadata = {
        id: 'test-archive',
        createdAt: Date.now(),
        archivePath: '/path/to/archive.zip',
        archiveSize: 2048,
        fileCount: 1,
        totalUncompressedSize: 1024,
        compressionRatio: 0.5,
        checksum: 'abc123',
        entries: [],
        config: DEFAULT_ARCHIVE_CONFIG,
        status: 'completed',
        retention: {
          expiresAt: Date.now() + 86400000,
          autoDelete: true,
        },
      };
      
      mockWriteFile.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(metadata));
      
      await saveArchiveMetadata(metadata);
      const loaded = await loadArchiveMetadata('/path/to/archive.zip');
      
      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockReadFile).toHaveBeenCalled();
      expect(loaded).toEqual(metadata);
    });

    it('handles missing metadata file', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      
      const loaded = await loadArchiveMetadata('/path/to/missing.zip');
      
      expect(loaded).toBeNull();
    });
  });

  describe('Archive Management', () => {
    it('gets existing archives', async () => {
      const mockFiles = ['archive1.zip', 'archive2.zip', 'other.txt'];
      const mockMetadata = {
        id: 'archive1',
        createdAt: Date.now(),
        archivePath: '/path/to/archive1.zip',
        archiveSize: 1024,
        fileCount: 1,
        totalUncompressedSize: 2048,
        compressionRatio: 0.5,
        checksum: 'abc123',
        entries: [],
        config: DEFAULT_ARCHIVE_CONFIG,
        status: 'completed',
        retention: {
          expiresAt: Date.now() + 86400000,
          autoDelete: true,
        },
      };
      
      mockReaddir.mockResolvedValue(mockFiles as any);
      mockReadFile.mockResolvedValue(JSON.stringify(mockMetadata));
      mockMkdir.mockResolvedValue(undefined);
      
      const archives = await getExistingArchives(DEFAULT_ARCHIVE_CONFIG);
      
      expect(archives).toHaveLength(1);
      expect(archives[0].id).toBe('archive1');
    });

    it('determines when archive should be cleaned up', () => {
      const oldArchive: ArchiveMetadata = {
        id: 'old-archive',
        createdAt: Date.now() - (100 * 24 * 60 * 60 * 1000), // 100 days ago
        archivePath: '/path/to/old.zip',
        archiveSize: 1024,
        fileCount: 1,
        totalUncompressedSize: 2048,
        compressionRatio: 0.5,
        checksum: 'abc123',
        entries: [],
        config: DEFAULT_ARCHIVE_CONFIG,
        status: 'completed',
        retention: {
          expiresAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
          autoDelete: true,
        },
      };
      
      const newArchive: ArchiveMetadata = {
        ...oldArchive,
        id: 'new-archive',
        createdAt: Date.now(),
        retention: {
          expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000),
          autoDelete: true,
        },
      };
      
      expect(shouldCleanupArchive(oldArchive, DEFAULT_ARCHIVE_CONFIG, [oldArchive])).toBe(true);
      expect(shouldCleanupArchive(newArchive, DEFAULT_ARCHIVE_CONFIG, [newArchive])).toBe(false);
    });

    it('deletes archive successfully', async () => {
      const archive: ArchiveMetadata = {
        id: 'test-archive',
        createdAt: Date.now(),
        archivePath: '/path/to/archive.zip',
        archiveSize: 1024,
        fileCount: 1,
        totalUncompressedSize: 2048,
        compressionRatio: 0.5,
        checksum: 'abc123',
        entries: [],
        config: DEFAULT_ARCHIVE_CONFIG,
        status: 'completed',
        retention: {
          expiresAt: Date.now() + 86400000,
          autoDelete: true,
        },
      };
      
      mockUnlink.mockResolvedValue(undefined);
      
      await deleteArchive(archive);
      
      expect(mockUnlink).toHaveBeenCalledWith('/path/to/archive.zip');
    });
  });

  describe('Directory Scanning', () => {
    it('scans directory for matching files', async () => {
      const mockEntries = [
        { name: 'test.log', isFile: () => true, isDirectory: () => false },
        { name: 'subdir', isFile: () => false, isDirectory: () => true },
        { name: '.gitignore', isFile: () => true, isDirectory: () => false },
      ];
      
      mockReaddir.mockResolvedValue(mockEntries as any);
      mockReaddir.mockResolvedValueOnce([] as any); // Empty subdirectory
      
      const files = await scanDirectory('/test/path', DEFAULT_ARCHIVE_CONFIG);
      
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('test.log');
    });

    it('handles directory scanning errors gracefully', async () => {
      mockReaddir.mockRejectedValue(new Error('Permission denied'));
      
      const files = await scanDirectory('/restricted/path', DEFAULT_ARCHIVE_CONFIG);
      
      expect(files).toHaveLength(0);
    });
  });

  describe('Archive Index', () => {
    it('creates archive index', () => {
      const archives: ArchiveMetadata[] = [
        {
          id: 'archive1',
          createdAt: Date.now(),
          archivePath: '/path/to/archive1.zip',
          archiveSize: 1024,
          fileCount: 1,
          totalUncompressedSize: 2048,
          compressionRatio: 0.5,
          checksum: 'abc123',
          entries: [
            {
              path: 'test.log',
              name: 'test.log',
              size: 1024,
              modifiedTime: Date.now(),
              checksum: 'def456',
              type: 'evidence',
            },
          ],
          config: DEFAULT_ARCHIVE_CONFIG,
          status: 'completed',
          retention: {
            expiresAt: Date.now() + 86400000,
            autoDelete: true,
          },
        },
      ];
      
      const index = createArchiveIndex(archives);
      const parsed = JSON.parse(index);
      
      expect(parsed.totalArchives).toBe(1);
      expect(parsed.totalSize).toBe(1024);
      expect(parsed.archives).toHaveLength(1);
      expect(parsed.archives[0].id).toBe('archive1');
    });

    it('saves archive index', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      
      await saveArchiveIndex([], DEFAULT_ARCHIVE_CONFIG);
      
      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe('Telemetry', () => {
    it('generates telemetry events', () => {
      const event = generateTelemetryEvent('test_event', { key: 'value' });
      
      expect(event.event).toBe('test_event');
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.service).toBe('guardian-evidence-archive');
      expect(event.version).toBe('1.0.0');
      expect(event.key).toBe('value');
    });
  });
});

describe('EvidenceArchiveRotator Class', () => {
  let rotator: EvidenceArchiveRotator;
  let config: ArchiveConfig;

  beforeEach(() => {
    config = createSafeArchiveConfig();
    rotator = new EvidenceArchiveRotator(config);
    jest.clearAllMocks();
  });

  describe('Archive Creation', () => {
    it('creates archive from files', async () => {
      const mockFiles = ['/test/file1.log', '/test/file2.log'];
      const mockFileData = Buffer.from('test file content');
      
      mockStat.mockResolvedValue({
        size: 1024,
        isFile: () => true,
        isDirectory: () => false,
      } as any);
      mockReadFile.mockResolvedValue(mockFileData);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue('abc123'); // For checksum
      
      const archive = await rotator['createArchive'](mockFiles, 'test-archive');
      
      expect(archive.id).toBe('test-archive');
      expect(archive.fileCount).toBe(2);
      expect(archive.status).toBe('completed');
      expect(archive.checksum).toBe('abc123');
    });

    it('handles file processing errors', async () => {
      const mockFiles = ['/test/invalid.log'];
      
      mockStat.mockRejectedValue(new Error('File not found'));
      
      // Should not throw when skipCorruptedFiles is true
      config.validation.skipCorruptedFiles = true;
      const archive = await rotator['createArchive'](mockFiles, 'test-archive');
      
      expect(archive.fileCount).toBe(0);
    });
  });

  describe('Rotation Process', () => {
    it('performs complete rotation', async () => {
      const mockFiles = ['/test/file1.log'];
      const mockFileData = Buffer.from('test content');
      
      // Mock directory scanning
      jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'scanDirectory')
        .mockResolvedValue(mockFiles);
      
      // Mock file operations
      mockStat.mockResolvedValue({
        size: 1024,
        isFile: () => true,
        isDirectory: () => false,
      } as any);
      mockReadFile.mockResolvedValue(mockFileData);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue('abc123'); // For checksum
      
      // Mock existing archives
      jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'getExistingArchives')
        .mockResolvedValue([]);
      
      const result = await rotator.rotate();
      
      expect(result.archivesCreated).toHaveLength(1);
      expect(result.filesProcessed).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('handles rotation errors gracefully', async () => {
      // Mock directory scanning to throw error
      jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'scanDirectory')
        .mockRejectedValue(new Error('Scanning failed'));
      
      const result = await rotator.rotate();
      
      expect(result.archivesCreated).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Scanning failed');
    });
  });

  describe('Archive Listing', () => {
    it('lists existing archives', async () => {
      const mockArchives: ArchiveMetadata[] = [
        {
          id: 'archive1',
          createdAt: Date.now(),
          archivePath: '/path/to/archive1.zip',
          archiveSize: 1024,
          fileCount: 1,
          totalUncompressedSize: 2048,
          compressionRatio: 0.5,
          checksum: 'abc123',
          entries: [],
          config: DEFAULT_ARCHIVE_CONFIG,
          status: 'completed',
          retention: {
            expiresAt: Date.now() + 86400000,
            autoDelete: true,
          },
        },
      ];
      
      jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'getExistingArchives')
        .mockResolvedValue(mockArchives);
      
      // Mock console.table to capture output
      const mockTable = { toString: () => 'table output' };
      jest.doMock('cli-table3', () => jest.fn(() => mockTable));
      
      await rotator.listArchives();
      
      expect(console.log).toHaveBeenCalledWith('📋 Existing Archives:');
    });

    it('handles empty archive list', async () => {
      jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'getExistingArchives')
        .mockResolvedValue([]);
      
      await rotator.listArchives();
      
      expect(console.log).toHaveBeenCalledWith('No archives found');
    });
  });

  describe('Archive Validation', () => {
    it('validates archives successfully', async () => {
      const mockArchives: ArchiveMetadata[] = [
        {
          id: 'archive1',
          createdAt: Date.now(),
          archivePath: '/path/to/archive1.zip',
          archiveSize: 1024,
          fileCount: 1,
          totalUncompressedSize: 2048,
          compressionRatio: 0.5,
          checksum: 'abc123',
          entries: [],
          config: DEFAULT_ARCHIVE_CONFIG,
          status: 'completed',
          retention: {
            expiresAt: Date.now() + 86400000,
            autoDelete: true,
          },
        },
      ];
      
      jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'getExistingArchives')
        .mockResolvedValue(mockArchives);
      
      mockReadFile.mockResolvedValue(Buffer.from('test data'));
      
      await rotator.validateArchives();
      
      expect(console.log).toHaveBeenCalledWith('✅ archive1: Valid');
    });

    it('detects checksum mismatches', async () => {
      const mockArchives: ArchiveMetadata[] = [
        {
          id: 'archive1',
          createdAt: Date.now(),
          archivePath: '/path/to/archive1.zip',
          archiveSize: 1024,
          fileCount: 1,
          totalUncompressedSize: 2048,
          compressionRatio: 0.5,
          checksum: 'wrong-checksum',
          entries: [],
          config: DEFAULT_ARCHIVE_CONFIG,
          status: 'completed',
          retention: {
            expiresAt: Date.now() + 86400000,
            autoDelete: true,
          },
        },
      ];
      
      jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'getExistingArchives')
        .mockResolvedValue(mockArchives);
      
      mockReadFile.mockResolvedValue(Buffer.from('test data'));
      
      await rotator.validateArchives();
      
      expect(console.error).toHaveBeenCalledWith('❌ archive1: Checksum mismatch');
    });
  });

  describe('Results Display', () => {
    it('displays rotation results', () => {
      const result: RotationResult = {
        id: 'test-rotation',
        timestamp: Date.now(),
        archivesCreated: [],
        archivesCleaned: [],
        filesProcessed: 10,
        totalSizeProcessed: 10240,
        compressionRatio: 0.5,
        errors: [],
        duration: 1000,
      };
      
      // Mock table
      const mockTable = { toString: () => 'table output' };
      jest.doMock('cli-table3', () => jest.fn(() => mockTable));
      
      rotator.displayResults(result);
      
      expect(console.log).toHaveBeenCalledWith('📊 Rotation Results:');
    });
  });

  describe('Telemetry', () => {
    it('saves telemetry events', async () => {
      rotator['telemetry'] = [
        generateTelemetryEvent('test_event', { key: 'value' }),
      ];
      
      mockReadFile.mockResolvedValue('[]');
      mockWriteFile.mockResolvedValue(undefined);
      
      await rotator.saveTelemetry();
      
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });
});

describe('Integration Tests', () => {
  it('handles complete workflow', async () => {
    const config = createSafeArchiveConfig({
      baseDirectory: '/test/evidence',
      archiveDirectory: '/test/archives',
    });
    
    const rotator = new EvidenceArchiveRotator(config);
    
    // Mock all file system operations
    jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'scanDirectory')
      .mockResolvedValue(['/test/evidence/file1.log']);
    
    mockStat.mockResolvedValue({
      size: 1024,
      isFile: () => true,
      isDirectory: () => false,
    } as any);
    mockReadFile.mockResolvedValue(Buffer.from('test content'));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    
    jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'getExistingArchives')
      .mockResolvedValue([]);
    
    jest.spyOn(require('../../../src/analytics/guardian/EvidenceArchiveService'), 'saveArchiveIndex')
      .mockResolvedValue();
    
    const result = await rotator.rotate();
    
    expect(result.archivesCreated).toHaveLength(1);
    expect(result.filesProcessed).toBe(1);
    expect(result.errors).toHaveLength(0);
    
    // Verify telemetry was generated
    expect(rotator['telemetry']).toHaveLength(2); // archive_created + rotation_completed
  });
});
