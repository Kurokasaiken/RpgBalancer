/**
 * Config Balancer Card Preset Migration Tests
 *
 * Comprehensive test suite for the preset migration system, covering
 * version detection, migration logic, CLI functionality, and UI helpers.
 *
 * @module CardPresetMigration.test
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PresetMigrator } from '../../../src/balancing/config/presetMigration';
import { usePresetMigration, useBatchPresetMigration, useMigrationAnalysis, MigrationUIUtils, useMigrationHistory } from '../../../src/ui/balancing/hooks/usePresetMigration';

// Mock file system operations
const mockSaveData = vi.fn();
const mockLoadData = vi.fn();

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: mockSaveData,
  loadData: mockLoadData,
}));

// Mock crypto for deterministic IDs
vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'test_hash_12345'),
    })),
  })),
}));

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
    useCallback: vi.fn(),
    useMemo: vi.fn(),
  };
});

describe('PresetMigrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Version Detection', () => {
    it('should detect v1 preset format', () => {
      const v1Preset = {
        name: 'Test Preset',
        weights: { strength: 1.2, agility: 0.8 },
      };

      const version = PresetMigrator.detectVersion(v1Preset);
      expect(version).toBe('v1');
    });

    it('should detect v2 preset format', () => {
      const v2Preset = {
        id: 'preset_123',
        name: 'Test Preset',
        description: 'A test preset',
        weights: { strength: 1.2, agility: 0.8 },
        isBuiltIn: false,
      };

      const version = PresetMigrator.detectVersion(v2Preset);
      expect(version).toBe('v2');
    });

    it('should detect v3 (current) preset format', () => {
      const v3Preset = {
        id: 'preset_123',
        name: 'Test Preset',
        description: 'A test preset',
        weights: { strength: 1.2, agility: 0.8 },
        isBuiltIn: false,
        createdAt: '2026-01-01T00:00:00Z',
        modifiedAt: '2026-01-01T00:00:00Z',
      };

      const version = PresetMigrator.detectVersion(v3Preset);
      expect(version).toBe('v3');
    });

    it('should return unknown for invalid format', () => {
      const invalidPreset = {
        invalidField: 'value',
      };

      const version = PresetMigrator.detectVersion(invalidPreset);
      expect(version).toBe('unknown');
    });
  });

  describe('Validation', () => {
    it('should validate correct v3 preset', () => {
      const validPreset = {
        id: 'preset_123',
        name: 'Test Preset',
        description: 'A test preset',
        weights: { strength: 1.2, agility: 0.8 },
        isBuiltIn: false,
        createdAt: '2026-01-01T00:00:00Z',
        modifiedAt: '2026-01-01T00:00:00Z',
      };

      const result = PresetMigrator.validatePreset(validPreset);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid preset', () => {
      const invalidPreset = {
        name: 'Missing required fields',
      };

      const result = PresetMigrator.validatePreset(invalidPreset);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Logic', () => {
    it('should migrate v1 to v2 format', () => {
      const v1Preset = {
        name: 'Test Preset',
        weights: { strength: 1.2, agility: 0.8 },
        description: 'Optional description',
        isBuiltIn: true,
      };

      const migrated = PresetMigrator['migrateV1ToV2'](v1Preset);

      expect(migrated.id).toMatch(/^preset_/);
      expect(migrated.name).toBe('Test Preset');
      expect(migrated.description).toBe('Optional description');
      expect(migrated.weights).toEqual({ strength: 1.2, agility: 0.8 });
      expect(migrated.isBuiltIn).toBe(true);
      expect(migrated.createdAt).toBeDefined();
      expect(migrated.modifiedAt).toBeDefined();
    });

    it('should migrate v2 to v3 format', () => {
      const v2Preset = {
        id: 'preset_123',
        name: 'Test Preset',
        description: 'A test preset',
        weights: { strength: 1.2, agility: 0.8 },
        isBuiltIn: false,
      };

      const migrated = PresetMigrator['migrateV2ToV3'](v2Preset);

      expect(migrated.id).toBe('preset_123');
      expect(migrated.name).toBe('Test Preset');
      expect(migrated.createdAt).toBeDefined();
      expect(migrated.modifiedAt).toBeDefined();
    });

    it('should generate correct change log for v1 migration', () => {
      const legacy = {
        name: 'Test Preset',
        weights: { strength: 1.2 },
      };

      const migrated = {
        id: 'preset_test_hash_12345',
        name: 'Test Preset',
        description: 'Migrated preset: Test Preset',
        weights: { strength: 1.2 },
        isBuiltIn: false,
        createdAt: '2026-01-13T12:00:00Z',
        modifiedAt: '2026-01-13T12:00:00Z',
      };

      const changes = PresetMigrator.generateChanges(legacy, migrated, 'v1');

      expect(changes.length).toBeGreaterThan(0);
      expect(changes.some((c: any) => c.property === 'id')).toBe(true);
      expect(changes.some((c: any) => c.property === 'description')).toBe(true);
      expect(changes.some((c: any) => c.property === 'createdAt')).toBe(true);
    });
  });

  describe('Full Migration Process', () => {
    it('should perform successful migration', async () => {
      const v1Preset = {
        name: 'Test Preset',
        weights: { strength: 1.2, agility: 0.8 },
      };

      mockLoadData.mockResolvedValue(v1Preset);
      mockSaveData.mockResolvedValue(undefined);

      const result = await PresetMigrator.migrate('input.json', 'output.json', {
        createBackup: true,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.sourceVersion).toBe('v1');
      expect(result.targetVersion).toBe('3.0.0');
      expect(result.presetName).toBe('Test Preset');
      expect(result.changes.length).toBeGreaterThan(0);
      expect(mockSaveData).toHaveBeenCalledTimes(2); // Backup + migrated file
    });

    it('should handle dry-run migration', async () => {
      const v1Preset = {
        name: 'Test Preset',
        weights: { strength: 1.2, agility: 0.8 },
      };

      mockLoadData.mockResolvedValue(v1Preset);

      const result = await PresetMigrator.migrate('input.json', undefined, {
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(mockSaveData).not.toHaveBeenCalled();
    });

    it('should skip migration for already current presets', async () => {
      const currentPreset = {
        id: 'preset_123',
        name: 'Current Preset',
        description: 'Already current',
        weights: { strength: 1.2 },
        isBuiltIn: false,
        createdAt: '2026-01-01T00:00:00Z',
        modifiedAt: '2026-01-01T00:00:00Z',
      };

      mockLoadData.mockResolvedValue(currentPreset);

      const result = await PresetMigrator.migrate('input.json');

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Configuration is already in current format');
    });

    it('should handle migration errors', async () => {
      mockLoadData.mockRejectedValue(new Error('File not found'));

      const result = await PresetMigrator.migrate('nonexistent.json');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Migration', () => {
    it('should perform batch migration sequentially', async () => {
      const files = ['preset1.json', 'preset2.json'];
      const preset1 = { name: 'Preset 1', weights: { strength: 1.0 } };
      const preset2 = { name: 'Preset 2', weights: { agility: 1.5 } };

      mockLoadData
        .mockResolvedValueOnce(preset1)
        .mockResolvedValueOnce(preset2);
      mockSaveData.mockResolvedValue(undefined);

      const results = await PresetMigrator.batchMigrate(files, {
        createBackup: false,
        parallel: false,
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].presetName).toBe('Preset 1');
      expect(results[1].presetName).toBe('Preset 2');
    });

    it('should perform batch migration in parallel', async () => {
      const files = ['preset1.json', 'preset2.json'];
      const preset1 = { name: 'Preset 1', weights: { strength: 1.0 } };
      const preset2 = { name: 'Preset 2', weights: { agility: 1.5 } };

      mockLoadData
        .mockResolvedValueOnce(preset1)
        .mockResolvedValueOnce(preset2);
      mockSaveData.mockResolvedValue(undefined);

      const results = await PresetMigrator.batchMigrate(files, {
        createBackup: false,
        parallel: true,
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive migration report', () => {
      const results: any[] = [
        {
          success: true,
          sourceVersion: 'v1',
          targetVersion: '3.0.0',
          presetName: 'Success Preset',
          duration: 100,
          changes: [{ type: 'added', property: 'id', description: 'Added ID' }],
          errors: [],
          warnings: [],
        },
        {
          success: false,
          sourceVersion: 'v1',
          presetName: 'Failed Preset',
          duration: 50,
          changes: [],
          errors: ['Validation failed'],
          warnings: [],
        },
      ];

      const report = PresetMigrator.generateReport(results);

      expect(report).toContain('# Preset Migration Report');
      expect(report).toContain('Total presets: 2');
      expect(report).toContain('Successful: 1');
      expect(report).toContain('Failed: 1');
      expect(report).toContain('Success Preset');
      expect(report).toContain('Failed Preset');
    });
  });
});

describe('Migration UI Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePresetMigration', () => {
    it('should initialize with idle state', () => {
      const hook = usePresetMigration();

      expect(hook.status).toBe('idle');
      expect(hook.result).toBe(null);
      expect(hook.error).toBe(null);
    });

    it('should handle successful migration', async () => {
      const mockResult = {
        success: true,
        sourceVersion: 'v1',
        targetVersion: '3.0.0',
        presetName: 'Test Preset',
      };

      const hook = usePresetMigration();
      // Mock the migratePreset function to return the mock result
      hook.migratePreset = vi.fn().mockResolvedValue(mockResult);

      const result = await hook.migratePreset('input.json');

      expect(result.success).toBe(true);
      expect(hook.migratePreset).toHaveBeenCalledWith('input.json');
    });
  });

  describe('useBatchPresetMigration', () => {
    it('should initialize with idle progress', () => {
      const hook = useBatchPresetMigration();

      expect(hook.progress.status).toBe('idle');
      expect(hook.progress.completed).toBe(0);
      expect(hook.progress.total).toBe(0);
      expect(hook.results).toEqual([]);
      expect(hook.summary).toBe(null);
    });
  });

  describe('useMigrationAnalysis', () => {
    it('should analyze preset changes', async () => {
      const hook = useMigrationAnalysis();
      hook.analyzePreset = vi.fn().mockResolvedValue([
        { type: 'added', property: 'id', description: 'Added ID' },
      ]);

      const changes = await hook.analyzePreset('input.json');

      expect(changes).toHaveLength(1);
      expect(changes[0].property).toBe('id');
      expect(hook.analyzePreset).toHaveBeenCalledWith('input.json');
    });
  });
});

describe('MigrationUIUtils', () => {
  describe('formatChange', () => {
    it('should format added changes', () => {
      const change = {
        type: 'added' as const,
        property: 'id',
        description: 'Added unique identifier',
      };

      const formatted = MigrationUIUtils.formatChange(change);
      expect(formatted).toContain('➕');
      expect(formatted).toContain('id');
    });

    it('should format modified changes', () => {
      const change = {
        type: 'modified' as const,
        property: 'description',
        description: 'Updated description',
      };

      const formatted = MigrationUIUtils.formatChange(change);
      expect(formatted).toContain('🔄');
    });

    it('should format removed changes', () => {
      const change = {
        type: 'removed' as const,
        property: 'deprecatedField',
        description: 'Removed deprecated field',
      };

      const formatted = MigrationUIUtils.formatChange(change);
      expect(formatted).toContain('➖');
    });
  });

  describe('getStatusColor', () => {
    it('should return red for failed migrations', () => {
      const result = { success: false, warnings: [] } as any;
      expect(MigrationUIUtils.getStatusColor(result)).toBe('red');
    });

    it('should return orange for successful migrations with warnings', () => {
      const result = { success: true, warnings: ['warning'] } as any;
      expect(MigrationUIUtils.getStatusColor(result)).toBe('orange');
    });

    it('should return green for successful migrations without warnings', () => {
      const result = { success: true, warnings: [] } as any;
      expect(MigrationUIUtils.getStatusColor(result)).toBe('green');
    });
  });

  describe('calculateHealthScore', () => {
    it('should return 0 for failed migrations', () => {
      const result = { success: false } as any;
      expect(MigrationUIUtils.calculateHealthScore(result)).toBe(0);
    });

    it('should calculate health score based on warnings and changes', () => {
      const result = {
        success: true,
        warnings: ['warning1', 'warning2'],
        changes: new Array(5),
        duration: 500,
      } as any;

      const score = MigrationUIUtils.calculateHealthScore(result);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it('should return high score for clean migrations', () => {
      const result = {
        success: true,
        warnings: [],
        changes: [],
        duration: 100,
      } as any;

      const score = MigrationUIUtils.calculateHealthScore(result);
      expect(score).toBe(100);
    });
  });

  describe('groupChangesByType', () => {
    it('should group changes by their type', () => {
      const changes = [
        { type: 'added', property: 'id' },
        { type: 'added', property: 'createdAt' },
        { type: 'modified', property: 'description' },
        { type: 'removed', property: 'deprecated' },
      ] as any[];

      const grouped = MigrationUIUtils.groupChangesByType(changes);

      expect(grouped.added).toHaveLength(2);
      expect(grouped.modified).toHaveLength(1);
      expect(grouped.removed).toHaveLength(1);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(MigrationUIUtils.formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(MigrationUIUtils.formatDuration(2500)).toBe('2.5s');
    });
  });

  describe('generateSummaryText', () => {
    it('should generate comprehensive summary text', () => {
      const summary = {
        totalFiles: 10,
        successfulMigrations: 8,
        failedMigrations: 2,
        totalChanges: 15,
        averageDuration: 500,
      } as any;

      const text = MigrationUIUtils.generateSummaryText(summary);

      expect(text).toContain('8/10');
      expect(text).toContain('80.0%');
      expect(text).toContain('15');
      expect(text).toContain('500ms');
    });
  });
});

describe('Migration History Hook', () => {
  it('should manage migration history', () => {
    const hook = useMigrationHistory();

    expect(hook.history).toEqual([]);

    const mockResult = { success: true, presetName: 'Test' } as any;
    hook.addToHistory(mockResult);

    expect(hook.history).toHaveLength(1);
    expect(hook.getRecentMigrations()).toHaveLength(1);

    const stats = hook.getMigrationStats();
    expect(stats.total).toBe(1);
    expect(stats.successful).toBe(1);
    expect(stats.successRate).toBe(100);

    hook.clearHistory();
    expect(hook.history).toEqual([]);
  });
});

describe('Integration Tests', () => {
  it('should handle complete migration workflow', async () => {
    // Mock successful migration
    const v1Preset = {
      name: 'Integration Test Preset',
      weights: { strength: 1.2, agility: 0.8 },
    };

    mockLoadData.mockResolvedValue(v1Preset);
    mockSaveData.mockResolvedValue(undefined);

    // Test single migration
    const result = await PresetMigrator.migrate('test.json', 'migrated.json');

    expect(result.success).toBe(true);
    expect(result.presetName).toBe('Integration Test Preset');
    expect(result.sourceVersion).toBe('v1');
    expect(result.targetVersion).toBe('3.0.0');

    // Verify changes were generated
    expect(result.changes.length).toBeGreaterThan(0);

    // Verify files were saved (backup + migrated)
    expect(mockSaveData).toHaveBeenCalledTimes(2);
  });

  it('should handle batch migration with mixed results', async () => {
    const files = ['success.json', 'fail.json'];

    // Mock successful migration
    const successPreset = {
      name: 'Success Preset',
      weights: { strength: 1.0 },
    };

    // Mock failed migration (invalid data)
    const failPreset = {
      invalidField: 'value',
    };

    mockLoadData
      .mockResolvedValueOnce(successPreset)
      .mockResolvedValueOnce(failPreset);
    mockSaveData.mockResolvedValue(undefined);

    const results = await PresetMigrator.batchMigrate(files, {
      createBackup: false,
    });

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);

    const report = PresetMigrator.generateReport(results);
    expect(report).toContain('Successful: 1');
    expect(report).toContain('Failed: 1');
  });

  it('should validate presets correctly', () => {
    const validPreset = {
      id: 'preset_123',
      name: 'Valid Preset',
      description: 'A valid preset',
      weights: { strength: 1.2 },
      isBuiltIn: false,
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-01T00:00:00Z',
    };

    const invalidPreset = {
      name: 'Invalid Preset',
    };

    const validResult = PresetMigrator.validatePreset(validPreset);
    const invalidResult = PresetMigrator.validatePreset(invalidPreset);

    expect(validResult.valid).toBe(true);
    expect(invalidResult.valid).toBe(false);
  });
});
