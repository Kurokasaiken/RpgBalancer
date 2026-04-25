/**
 * Comprehensive test suite for Legacy Config Migration Tooling
 * 
 * Tests the config migration engine, CLI tool, validation system,
 * and rollback capabilities across all supported legacy formats.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ConfigMigrator, type MigrationResult } from '@/balancing/config/migrations/configMigrator';
import { MigrationValidator, type ValidationRule } from '@/balancing/config/migrations/migrationValidator';
import type { BalancerConfig } from '@/balancing/config/types';
import { BalancerConfigSchema } from '@/balancing/config/schemas';

// Mock persistence service
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

describe('ConfigMigrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Version Detection', () => {
    it('should detect pre-phase10 format', () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1 },
          damage: { id: 'damage', label: 'Damage', weight: 5 },
        },
        cards: {
          combat: { id: 'combat', title: 'Combat', color: 'red' },
        },
      };

      const version = ConfigMigrator.detectVersion(legacy);
      expect(version).toBe('pre-phase10');
    });

    it('should detect phase10-v0 format', () => {
      const legacy = {
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
          },
        },
        cards: {
          combat: {
            id: 'combat',
            title: 'Combat',
            color: 'red',
            statIds: ['hp'],
            isCore: false,
            order: 1,
          },
        },
      };

      const version = ConfigMigrator.detectVersion(legacy);
      expect(version).toBe('phase10-v0');
    });

    it('should detect phase10-v1 format', () => {
      const legacy = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            description: 'Hit points',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            bgColor: 'bg-blue-500/10',
            isLocked: false,
            isHidden: false,
            baseStat: true,
          },
        },
        cards: {
          combat: {
            id: 'combat',
            title: 'Combat',
            color: 'red',
            icon: '⚔️',
            statIds: ['hp'],
            isCore: false,
            order: 1,
            isLocked: false,
            isHidden: false,
          },
        },
        presets: {
          balanced: {
            id: 'balanced',
            name: 'Balanced',
            description: 'Balanced preset',
            weights: { hp: 1, damage: 1 },
            metadata: { version: '1.0' },
          },
        },
      };

      const version = ConfigMigrator.detectVersion(legacy);
      expect(version).toBe('phase10-v1');
    });

    it('should return unknown for unrecognizable format', () => {
      const unknown = { random: 'data', format: 'unknown' };
      const version = ConfigMigrator.detectVersion(unknown);
      expect(version).toBe('unknown');
    });
  });

  describe('Config Validation', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            description: 'Hit points',
            type: 'number' as const,
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            baseStat: true,
          },
        },
        cards: {},
        presets: {},
        metadata: {},
      };

      const result = ConfigMigrator.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const invalidConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            // Missing required fields
          },
        },
        cards: {},
        presets: {},
      };

      const result = ConfigMigrator.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Functions', () => {
    it('should migrate pre-phase10 to current format', () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1, defaultValue: 100 },
          damage: { id: 'damage', label: 'Damage', weight: 5, defaultValue: 10 },
        },
        cards: {
          combat: { id: 'combat', title: 'Combat', color: 'red' },
        },
        presets: {
          balanced: { name: 'Balanced', weights: { hp: 1, damage: 1 } },
        },
      };

      const migrated = ConfigMigrator.migratePrePhase10ToCurrent(legacy);

      // Check structure
      expect(migrated).toHaveProperty('version', '1.0.0');
      expect(migrated).toHaveProperty('stats');
      expect(migrated).toHaveProperty('cards');
      expect(migrated).toHaveProperty('presets');
      expect(migrated).toHaveProperty('metadata');

      // Check core stats are added
      expect(migrated.stats).toHaveProperty('hp');
      expect(migrated.stats).toHaveProperty('damage');
      expect(migrated.stats).toHaveProperty('htk');

      // Check stat properties
      const hp = migrated.stats.hp;
      expect(hp).toHaveProperty('type', 'number');
      expect(hp).toHaveProperty('min');
      expect(hp).toHaveProperty('max');
      expect(hp).toHaveProperty('step');
      expect(hp).toHaveProperty('isCore', true);
      expect(hp).toHaveProperty('description');

      // Check htk is derived
      expect(migrated.stats.htk.isDerived).toBe(true);
      expect(migrated.stats.htk.formula).toBe('hp / damage');

      // Check migration metadata
      expect(migrated.metadata.migrated).toBe(true);
      expect(migrated.metadata.sourceVersion).toBe('pre-phase10');
      expect(migrated.metadata.migrationDate).toBeDefined();
    });

    it('should migrate phase10-v0 to current format', () => {
      const legacy = {
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number' as const,
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
          },
        },
        cards: {
          combat: {
            id: 'combat',
            title: 'Combat',
            color: 'red',
            statIds: ['hp'],
            isCore: false,
            order: 1,
          },
        },
      };

      const migrated = ConfigMigrator.migratePhase10V0ToCurrent(legacy);

      // Check structure
      expect(migrated).toHaveProperty('version', '1.0.0');
      expect(migrated).toHaveProperty('metadata');

      // Check properties are added
      const hp = migrated.stats.hp;
      expect(hp).toHaveProperty('description');
      expect(hp).toHaveProperty('bgColor');
      expect(hp).toHaveProperty('isLocked', false);
      expect(hp).toHaveProperty('isHidden', false);
      expect(hp).toHaveProperty('baseStat');

      const combat = migrated.cards.combat;
      expect(combat).toHaveProperty('icon');
      expect(combat).toHaveProperty('isLocked', false);
      expect(combat).toHaveProperty('isHidden', false);
    });

    it('should migrate phase10-v1 to current format', () => {
      const legacy = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            description: 'Hit points',
            type: 'number' as const,
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            bgColor: 'bg-blue-500/10',
            isLocked: false,
            isHidden: false,
            baseStat: true,
          },
        },
        cards: {
          combat: {
            id: 'combat',
            title: 'Combat',
            color: 'red',
            icon: '⚔️',
            statIds: ['hp'],
            isCore: false,
            order: 1,
            isLocked: false,
            isHidden: false,
          },
        },
        presets: {
          balanced: {
            id: 'balanced',
            name: 'Balanced',
            description: 'Balanced preset',
            weights: { hp: 1 },
            metadata: { version: '1.0' },
          },
        },
      };

      const migrated = ConfigMigrator.migratePhase10V1ToCurrent(legacy);

      // Should be nearly identical with updated metadata
      expect(migrated.version).toBe('1.0.0');
      expect(migrated.stats).toEqual(legacy.stats);
      expect(migrated.cards).toEqual(legacy.cards);
      expect(migrated.presets).toEqual(legacy.presets);
      
      expect(migrated.metadata.migrated).toBe(true);
      expect(migrated.metadata.sourceVersion).toBe('phase10-v1');
    });
  });

  describe('Changes Generation', () => {
    it('should generate changes for pre-phase10 migration', () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1 },
        },
      };

      const current = ConfigMigrator.migratePrePhase10ToCurrent(legacy);
      const changes = ConfigMigrator.generateChanges(legacy, current, 'pre-phase10');

      expect(changes.length).toBeGreaterThan(0);
      
      // Should have added core stats
      const addedHtk = changes.find(c => c.id === 'htk' && c.type === 'added');
      expect(addedHtk).toBeDefined();
      expect(addedHtk?.category).toBe('stat');
      expect(addedHtk?.description).toContain('Added core stat');

      // Should have added metadata
      const metadata = changes.find(c => c.id === 'migration');
      expect(metadata).toBeDefined();
      expect(metadata?.category).toBe('metadata');
    });
  });

  describe('Migration Process', () => {
    it('should perform successful migration', async () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1 },
        },
      };

      const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;

      mockLoadData.mockResolvedValue(legacy);
      mockSaveData.mockResolvedValue();

      const result = await ConfigMigrator.migrate('input.json', 'output.json', {
        createBackup: false,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.sourceVersion).toBe('pre-phase10');
      expect(result.targetVersion).toBe('1.0.0');
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockSaveData).toHaveBeenCalledWith('output.json', expect.any(Object));
    });

    it('should handle dry run migration', async () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1 },
        },
      };

      const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;

      mockLoadData.mockResolvedValue(legacy);
      mockSaveData.mockResolvedValue();

      const result = await ConfigMigrator.migrate('input.json', 'output.json', {
        createBackup: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(mockSaveData).not.toHaveBeenCalled();
    });

    it('should handle unknown version', async () => {
      const unknown = { random: 'data' };

      const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
      mockLoadData.mockResolvedValue(unknown);

      const result = await ConfigMigrator.migrate('input.json', 'output.json');

      expect(result.success).toBe(false);
      expect(result.sourceVersion).toBe('unknown');
      expect(result.errors).toContain('Unable to detect configuration version');
    });

    it('should create backup when requested', async () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1 },
        },
      };

      const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;

      mockLoadData.mockResolvedValue(legacy);
      mockSaveData.mockResolvedValue();

      const result = await ConfigMigrator.migrate('input.json', 'output.json', {
        createBackup: true,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.backupFile).toBeDefined();
      expect(result.backupFile?.toContain('.backup.')).toBe(true);
      expect(mockSaveData).toHaveBeenCalledTimes(2); // Backup + migrated
    });
  });

  describe('Batch Migration', () => {
    it('should migrate multiple files sequentially', async () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1 },
        },
      };

      const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;

      mockLoadData.mockResolvedValue(legacy);
      mockSaveData.mockResolvedValue();

      const results = await ConfigMigrator.batchMigrate(['file1.json', 'file2.json'], {
        parallel: false,
        createBackup: false,
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockSaveData).toHaveBeenCalledTimes(2);
    });

    it('should migrate multiple files in parallel', async () => {
      const legacy = {
        stats: {
          hp: { id: 'hp', label: 'HP', weight: 1 },
        },
      };

      const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;

      mockLoadData.mockResolvedValue(legacy);
      mockSaveData.mockResolvedValue();

      const results = await ConfigMigrator.batchMigrate(['file1.json', 'file2.json'], {
        parallel: true,
        createBackup: false,
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockSaveData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Report Generation', () => {
    it('should generate migration report', () => {
      const results: MigrationResult[] = [
        {
          success: true,
          sourceVersion: 'pre-phase10',
          targetVersion: '1.0.0',
          inputFile: 'file1.json',
          outputFile: 'file1.migrated.json',
          changes: [
            { type: 'added', category: 'stat', id: 'htk', description: 'Added htk stat' },
          ],
          errors: [],
          warnings: [],
          duration: 100,
        },
        {
          success: false,
          sourceVersion: 'unknown',
          targetVersion: '1.0.0',
          inputFile: 'file2.json',
          outputFile: 'file2.migrated.json',
          changes: [],
          errors: ['Unknown format'],
          warnings: [],
          duration: 50,
        },
      ];

      const report = ConfigMigrator.generateReport(results);

      expect(report).toContain('# Config Migration Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('Total Files: 2');
      expect(report).toContain('Successful: 1');
      expect(report).toContain('Failed: 1');
      expect(report).toContain('## Individual Results');
      expect(report).toContain('## Changes Summary');
    });
  });
});

describe('MigrationValidator', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await MigrationValidator.initialize();
  });

  describe('Built-in Validation Rules', () => {
    it('should validate core stats presence', async () => {
      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            baseStat: true,
          },
          // Missing damage and htk
        },
        cards: {},
        presets: {},
        metadata: {},
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context);
      
      const coreStatsRule = results.find(r => r.rule === 'core-stats-presence');
      expect(coreStatsRule).toBeDefined();
      expect(coreStatsRule?.valid).toBe(false);
      expect(coreStatsRule?.message).toContain('Missing core stats');
      expect(coreStatsRule?.details?.missing).toContain('damage');
      expect(coreStatsRule?.details?.missing).toContain('htk');
    });

    it('should validate core stats immutability', async () => {
      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: false, // Should be true
            isDerived: false,
            baseStat: true,
          },
          damage: {
            id: 'damage',
            label: 'Damage',
            type: 'number',
            min: 1,
            max: 100,
            step: 0.1,
            defaultValue: 10,
            weight: 1,
            isCore: true,
            isDerived: false,
            isLocked: true, // Should not be locked
            baseStat: true,
          },
          htk: {
            id: 'htk',
            label: 'HTK',
            type: 'number',
            min: 1,
            max: 50,
            step: 0.1,
            defaultValue: 10,
            weight: 0,
            isCore: true,
            isDerived: true,
            formula: 'hp / damage',
            isHidden: true, // Should not be hidden
          },
        },
        cards: {},
        presets: {},
        metadata: {},
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context);
      
      const immutabilityRule = results.find(r => r.rule === 'core-stats-immutable');
      expect(immutabilityRule).toBeDefined();
      expect(immutabilityRule?.valid).toBe(false);
      expect(immutabilityRule?.message).toContain('isCore flag must be true');
      expect(immutabilityRule?.message).toContain('should not be locked');
      expect(immutabilityRule?.message).toContain('should not be hidden');
    });

    it('should validate stat formula validity', async () => {
      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            baseStat: true,
          },
          htk: {
            id: 'htk',
            label: 'HTK',
            type: 'number',
            min: 1,
            max: 50,
            step: 0.1,
            defaultValue: 10,
            weight: 0,
            isCore: true,
            isDerived: true,
            formula: 'hp / nonexistent_stat', // References non-existent stat
          },
        },
        cards: {},
        presets: {},
        metadata: {},
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context);
      
      const formulaRule = results.find(r => r.rule === 'stat-formula-validity');
      expect(formulaRule).toBeDefined();
      expect(formulaRule?.valid).toBe(false);
      expect(formulaRule?.message).toContain('nonexistent_stat');
    });

    it('should validate card stat references', async () => {
      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            baseStat: true,
          },
        },
        cards: {
          combat: {
            id: 'combat',
            title: 'Combat',
            color: 'red',
            statIds: ['hp', 'nonexistent_stat'], // References non-existent stat
            isCore: false,
            order: 1,
          },
        },
        presets: {},
        metadata: {},
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context);
      
      const cardRule = results.find(r => r.rule === 'card-stat-references');
      expect(cardRule).toBeDefined();
      expect(cardRule?.valid).toBe(false);
      expect(cardRule?.message).toContain('nonexistent_stat');
    });

    it('should validate preset weight references', async () => {
      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            baseStat: true,
          },
        },
        cards: {},
        presets: {
          balanced: {
            id: 'balanced',
            name: 'Balanced',
            description: 'Balanced preset',
            weights: {
              hp: 1,
              nonexistent_stat: 2, // References non-existent stat
            },
            metadata: {},
          },
        },
        metadata: {},
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context);
      
      const presetRule = results.find(r => r.rule === 'preset-weight-references');
      expect(presetRule).toBeDefined();
      expect(presetRule?.valid).toBe(false);
      expect(presetRule?.message).toContain('nonexistent_stat');
    });

    it('should validate weight consistency', async () => {
      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: -5, // Negative weight
            isCore: true,
            isDerived: false,
            baseStat: true,
          },
          defense: {
            id: 'defense',
            label: 'Defense',
            type: 'number',
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 10,
            weight: 150, // Very high weight
            isCore: false,
            isDerived: false,
            baseStat: true,
          },
          speed: {
            id: 'speed',
            label: 'Speed',
            type: 'number',
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 10,
            weight: 0, // Zero weight for non-derived
            isCore: false,
            isDerived: false,
            baseStat: true,
          },
        },
        cards: {},
        presets: {},
        metadata: {},
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context);
      
      const weightRule = results.find(r => r.rule === 'weight-consistency');
      expect(weightRule).toBeDefined();
      expect(weightRule?.valid).toBe(false);
      expect(weightRule?.severity).toBe('warning');
      expect(weightRule?.message).toContain('Negative weight');
      expect(weightRule?.message).toContain('Very high weight');
      expect(weightRule?.message).toContain('zero weight');
    });

    it('should validate migration completeness', async () => {
      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {
          hp: {
            id: 'hp',
            label: 'HP',
            type: 'number',
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 100,
            weight: 1,
            isCore: true,
            isDerived: false,
            baseStat: true,
          },
        },
        cards: {},
        presets: {},
        metadata: {}, // Missing migration metadata
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context);
      
      const completenessRule = results.find(r => r.rule === 'migration-completeness');
      expect(completenessRule).toBeDefined();
      expect(completenessRule?.valid).toBe(false);
      expect(completenessRule?.severity).toBe('info');
      expect(completenessRule?.message).toContain('Missing migration metadata');
    });
  });

  describe('Custom Validation Rules', () => {
    it('should execute custom validation rules', async () => {
      const customRule: ValidationRule = {
        id: 'custom-test',
        name: 'Custom Test Rule',
        description: 'Test custom validation rule',
        severity: 'warning',
        validate: (config, context) => ({
          valid: false,
          rule: 'custom-test',
          severity: 'warning',
          message: 'Custom validation failed',
          suggestions: ['Fix the custom issue'],
        }),
      };

      const config: BalancerConfig = {
        version: '1.0.0',
        stats: {},
        cards: {},
        presets: {},
        metadata: {},
      };

      const context = {
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        migrationChanges: [],
        timestamp: new Date().toISOString(),
      };

      const results = await MigrationValidator.validate(config, context, [customRule]);
      
      const customResult = results.find(r => r.rule === 'custom-test');
      expect(customResult).toBeDefined();
      expect(customResult?.valid).toBe(false);
      expect(customResult?.message).toBe('Custom validation failed');
      expect(customResult?.suggestions).toContain('Fix the custom issue');
    });
  });

  describe('Rollback Points', () => {
    it('should create rollback point', async () => {
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;
      mockSaveData.mockResolvedValue();

      const rollbackPoint = await MigrationValidator.createRollbackPoint(
        'original.json',
        'backup.json',
        'pre-phase10',
        { test: 'metadata' }
      );

      expect(rollbackPoint.id).toBeDefined();
      expect(rollbackPoint.originalFile).toBe('original.json');
      expect(rollbackPoint.backupFile).toBe('backup.json');
      expect(rollbackPoint.version).toBe('pre-phase10');
      expect(rollbackPoint.checksum).toBeDefined();
      expect(rollbackPoint.metadata.test).toBe('metadata');
    });

    it('should get rollback points', async () => {
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;
      mockSaveData.mockResolvedValue();

      // Create multiple rollback points
      await MigrationValidator.createRollbackPoint('file1.json', 'backup1.json', 'v1');
      await MigrationValidator.createRollbackPoint('file2.json', 'backup2.json', 'v2');

      const rollbackPoints = MigrationValidator.getRollbackPoints();
      expect(rollbackPoints).toHaveLength(2);
      // Should be sorted by timestamp (newest first)
      expect(rollbackPoints[0].timestamp >= rollbackPoints[1].timestamp).toBe(true);
    });
  });

  describe('Audit Log', () => {
    it('should log migration to audit trail', async () => {
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;
      mockSaveData.mockResolvedValue();

      const migrationResult: MigrationResult = {
        success: true,
        sourceVersion: 'pre-phase10',
        targetVersion: '1.0.0',
        inputFile: 'input.json',
        outputFile: 'output.json',
        changes: [],
        errors: [],
        warnings: [],
        duration: 100,
      };

      const migratedConfig: BalancerConfig = {
        version: '1.0.0',
        stats: {},
        cards: {},
        presets: {},
        metadata: { migrated: true, sourceVersion: 'pre-phase10' },
      };

      await MigrationValidator.logMigration(migrationResult, migratedConfig);

      const auditHistory = MigrationValidator.getAuditHistory();
      expect(auditHistory).toHaveLength(1);
      
      const entry = auditHistory[0];
      expect(entry.operation).toBe('migrate');
      expect(entry.sourceFile).toBe('input.json');
      expect(entry.targetFile).toBe('output.json');
      expect(entry.success).toBe(true);
      expect(entry.validationResults.length).toBeGreaterThan(0);
    });

    it('should get audit history with limit', async () => {
      const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;
      mockSaveData.mockResolvedValue();

      // Create multiple audit entries
      for (let i = 0; i < 5; i++) {
        await MigrationValidator.logMigration(
          {
            success: true,
            sourceVersion: 'pre-phase10',
            targetVersion: '1.0.0',
            inputFile: `file${i}.json`,
            outputFile: `output${i}.json`,
            changes: [],
            errors: [],
            warnings: [],
            duration: 100,
          },
          {
            version: '1.0.0',
            stats: {},
            cards: {},
            presets: {},
            metadata: {},
          }
        );
      }

      const limitedHistory = MigrationValidator.getAuditHistory(3);
      expect(limitedHistory).toHaveLength(3);
      
      // Should be newest first
      expect(limitedHistory[0].sourceFile).toBe('file4.json');
      expect(limitedHistory[1].sourceFile).toBe('file3.json');
      expect(limitedHistory[2].sourceFile).toBe('file2.json');
    });
  });

  describe('Validation Report Generation', () => {
    it('should generate validation report', () => {
      const results = [
        {
          valid: false,
          rule: 'test-error',
          severity: 'error' as const,
          message: 'Test error',
          details: { test: 'data' },
          suggestions: ['Fix it'],
        },
        {
          valid: false,
          rule: 'test-warning',
          severity: 'warning' as const,
          message: 'Test warning',
        },
        {
          valid: true,
          rule: 'test-info',
          severity: 'info' as const,
          message: 'Test info',
        },
      ];

      const report = MigrationValidator.generateValidationReport(results);

      expect(report).toContain('# Migration Validation Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('Total Rules: 3');
      expect(report).toContain('Errors: 1');
      expect(report).toContain('Warnings: 1');
      expect(report).toContain('Info: 1');
      expect(report).toContain('Overall Status: ❌ Failed');
      expect(report).toContain('## Errors');
      expect(report).toContain('❌ test-error');
      expect(report).toContain('## Warnings');
      expect(report).toContain('⚠️ test-warning');
      expect(report).toContain('## Infos');
      expect(report).toContain('ℹ️ test-info');
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await MigrationValidator.initialize();
  });

  it('should perform complete migration workflow', async () => {
    const legacy = {
      stats: {
        hp: { id: 'hp', label: 'HP', weight: 1, defaultValue: 100 },
        damage: { id: 'damage', label: 'Damage', weight: 5, defaultValue: 10 },
      },
      cards: {
        combat: { id: 'combat', title: 'Combat', color: 'red' },
      },
    };

    const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
    const mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;

    mockLoadData.mockResolvedValue(legacy);
    mockSaveData.mockResolvedValue();

    // Perform migration
    const migrationResult = await ConfigMigrator.migrate('input.json', 'output.json', {
      createBackup: true,
      dryRun: false,
    });

    expect(migrationResult.success).toBe(true);

    // Get migrated config for validation
    const migratedConfig = mockSaveData.mock.calls[mockSaveData.mock.calls.length - 1][0] as BalancerConfig;

    // Validate migration
    const validationResults = await MigrationValidator.validateMigration(migrationResult, migratedConfig);
    
    // Should have validation results
    expect(validationResults.length).toBeGreaterThan(0);
    
    // Check for core stats validation
    const coreStatsValidation = validationResults.find(r => r.rule === 'core-stats-presence');
    expect(coreStatsValidation?.valid).toBe(true);

    // Log to audit trail
    await MigrationValidator.logMigration(migrationResult, migratedConfig);

    // Check audit log
    const auditHistory = MigrationValidator.getAuditHistory();
    expect(auditHistory).toHaveLength(1);
    expect(auditHistory[0].success).toBe(true);
    expect(auditHistory[0].validationResults).toEqual(validationResults);

    // Generate report
    const report = MigrationValidator.generateValidationReport(validationResults);
    expect(report).toContain('# Migration Validation Report');
    expect(report).toContain('Overall Status: ✅ Passed');
  });

  it('should handle migration failure workflow', async () => {
    const invalidLegacy = {
      // Invalid structure that will cause migration to fail
      invalid: 'structure',
    };

    const mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;
    mockLoadData.mockResolvedValue(invalidLegacy);

    // Perform migration
    const migrationResult = await ConfigMigrator.migrate('input.json', 'output.json');

    expect(migrationResult.success).toBe(false);
    expect(migrationResult.errors.length).toBeGreaterThan(0);

    // Should not create audit entry for failed migration
    const auditHistory = MigrationValidator.getAuditHistory();
    expect(auditHistory).toHaveLength(0);
  });
});
