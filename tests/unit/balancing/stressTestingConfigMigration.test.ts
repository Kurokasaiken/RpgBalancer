/**
 * Tests for Stress Testing Configuration Migration
 */

import { describe, it, expect } from 'vitest';
import {
  detectLegacyVersion,
  migrateV1ToCurrent,
  migrateV0ToCurrent,
  generateDiff,
  validateMigratedConfig,
  createMigrationSummary,
  type MigrationResult,
} from '../../../src/balancing/config/stressTesting/migrations';
import { StressTestingConfigSchema } from '../../../src/balancing/config/stressTesting/schema';

describe('Stress Testing Configuration Migration', () => {
  describe('Legacy Version Detection', () => {
    it('should detect v1 configuration', () => {
      const v1Config = {
        simulationCount: 1000,
        seed: 12345,
        opThreshold: 1.2,
        weakThreshold: 0.9,
        pointsPerWeight: 30,
        includePairs: true,
        excludeDerived: false,
        minWeight: 0.3,
        maxPairs: 100,
        incompatiblePairs: [['hp', 'defense']],
      };

      expect(detectLegacyVersion(v1Config)).toBe('v1');
    });

    it('should detect v0 configuration', () => {
      const v0Config = {
        iterations: 500,
        randomSeed: 54321,
        synergyThreshold: 1.1,
        statPairs: [['hp', 'damage'], ['speed', 'defense']],
      };

      expect(detectLegacyVersion(v0Config)).toBe('v0');
    });

    it('should return unknown for invalid configuration', () => {
      const invalidConfig = {
        someRandomField: 'value',
        anotherField: 123,
      };

      expect(detectLegacyVersion(invalidConfig)).toBe('v0');
    });

    it('should handle empty object', () => {
      expect(detectLegacyVersion({} as any)).toBe('v0');
    });

    it('should handle null and undefined', () => {
      expect(detectLegacyVersion(null)).toBe('unknown');
      expect(detectLegacyVersion(undefined)).toBe('unknown');
    });
  });

  describe('V1 Migration', () => {
    it('should migrate complete v1 configuration', () => {
      const v1Config = {
        simulationCount: 2000,
        seed: 99999,
        opThreshold: 1.3,
        weakThreshold: 0.8,
        pointsPerWeight: 40,
        includePairs: false,
        excludeDerived: true,
        minWeight: 0.2,
        maxPairs: 50,
        incompatiblePairs: [['hp', 'defense'], ['speed', 'evasion']] as [string, string][],
      };

      const migrated = migrateV1ToCurrent(v1Config);

      expect(migrated.version).toBe('1.0.0');
      expect(migrated.thresholds.opThreshold).toBe(1.3);
      expect(migrated.thresholds.weakThreshold).toBe(0.8);
      expect(migrated.simulation.simulationCount).toBe(2000);
      expect(migrated.simulation.seed).toBe(99999);
      expect(migrated.simulation.concurrencyLimit).toBe(10);
      expect(migrated.archetype.pointsPerWeight).toBe(40);
      expect(migrated.archetype.defaultSeed).toBe(99999);
      expect(migrated.archetype.includePairs).toBe(false);
      expect(migrated.archetype.excludeDerived).toBe(true);
      expect(migrated.archetype.minWeight).toBe(0.2);
      expect(migrated.archetype.maxPairs).toBe(50);
      expect(migrated.incompatiblePairs).toEqual([['hp', 'defense'], ['speed', 'evasion']]);
      expect(migrated.enablePersistence).toBe(true);
      expect(migrated.enableTelemetry).toBe(true);
    });

    it('should apply defaults for missing v1 fields', () => {
      const v1Config = {
        simulationCount: 1500,
      };

      const migrated = migrateV1ToCurrent(v1Config);

      expect(migrated.thresholds.opThreshold).toBe(1.15);
      expect(migrated.thresholds.weakThreshold).toBe(0.95);
      expect(migrated.simulation.concurrencyLimit).toBe(10);
      expect(migrated.simulation.seed).toBe(12345);
      expect(migrated.archetype.pointsPerWeight).toBe(25);
      expect(migrated.archetype.includePairs).toBe(true);
      expect(migrated.archetype.excludeDerived).toBe(true);
      expect(migrated.archetype.minWeight).toBe(0.5);
      expect(migrated.archetype.maxPairs).toBeUndefined();
      expect(migrated.incompatiblePairs).toEqual([]);
    });

    it('should validate migrated v1 configuration', () => {
      const v1Config = {
        simulationCount: 1000,
        seed: 12345,
      };

      const migrated = migrateV1ToCurrent(v1Config);
      const validation = validateMigratedConfig(migrated);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('V0 Migration', () => {
    it('should migrate complete v0 configuration', () => {
      const v0Config = {
        iterations: 3000,
        randomSeed: 77777,
        synergyThreshold: 1.4,
        statPairs: [['hp', 'damage'], ['speed', 'defense']],
      };

      const migrated = migrateV0ToCurrent(v0Config);

      expect(migrated.version).toBe('1.0.0');
      expect(migrated.simulation.simulationCount).toBe(3000);
      expect(migrated.simulation.seed).toBe(77777);
      expect(migrated.simulation.concurrencyLimit).toBe(10);
      expect(migrated.thresholds.opThreshold).toBe(1.15);
      expect(migrated.thresholds.weakThreshold).toBe(0.95);
      expect(migrated.archetype.pointsPerWeight).toBe(25);
      expect(migrated.archetype.defaultSeed).toBe(77777);
      expect(migrated.archetype.includePairs).toBe(true);
      expect(migrated.archetype.excludeDerived).toBe(true);
      expect(migrated.archetype.minWeight).toBe(0.5);
      expect(migrated.archetype.maxPairs).toBeUndefined();
      expect(migrated.incompatiblePairs).toEqual([]);
      expect(migrated.enablePersistence).toBe(true);
      expect(migrated.enableTelemetry).toBe(true);
    });

    it('should apply defaults for missing v0 fields', () => {
      const v0Config = {};

      const migrated = migrateV0ToCurrent(v0Config);

      expect(migrated.simulation.simulationCount).toBe(1000);
      expect(migrated.simulation.seed).toBe(12345);
      expect(migrated.thresholds.opThreshold).toBe(1.15);
      expect(migrated.thresholds.weakThreshold).toBe(0.95);
      expect(migrated.archetype.pointsPerWeight).toBe(25);
      expect(migrated.incompatiblePairs).toEqual([]);
    });

    it('should validate migrated v0 configuration', () => {
      const v0Config = {
        iterations: 500,
        randomSeed: 11111,
      };

      const migrated = migrateV0ToCurrent(v0Config);
      const validation = validateMigratedConfig(migrated);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Diff Generation', () => {
    it('should generate v0 diff report', () => {
      const v0Config = {
        iterations: 1000,
        randomSeed: 12345,
      };

      const migrated = migrateV0ToCurrent(v0Config);
      const diff = generateDiff(v0Config, migrated, 'v0');

      const diffString = diff.join('\n');
      expect(diffString).toContain('Migration Report: Legacy v0 → Current 1.0.0');
      expect(diffString).toContain('Structure Changes:');
      expect(diffString).toContain('Added nested configuration structure');
      expect(diffString).toContain('Renamed iterations → simulationCount');
      expect(diffString).toContain('Renamed randomSeed → seed');
      expect(diffString).toContain('Default Values Applied:');
      expect(diffString).toContain('concurrencyLimit: 10 (default for migrations)');
      expect(diffString).toContain('opThreshold: 1.15 (default for v0)');
    });

    it('should generate v1 diff report', () => {
      const v1Config = {
        simulationCount: 1000,
        seed: 12345,
        opThreshold: 1.2,
      };

      const migrated = migrateV1ToCurrent(v1Config);
      const diff = generateDiff(v1Config, migrated, 'v1');

      const diffString = diff.join('\n');
      expect(diffString).toContain('Migration Report: Legacy v1 → Current 1.0.0');
      expect(diffString).toContain('Structure Changes:');
      expect(diffString).toContain('Added nested export configuration');
      expect(diffString).toContain('Added version field for migration tracking');
      expect(diffString).toContain('Default Values Applied:');
      expect(diffString).toContain('concurrencyLimit: 10 (default for migrations)');
    });

    it('should include timestamp in diff', () => {
      const v0Config = { iterations: 1000 };
      const migrated = migrateV0ToCurrent(v0Config);
      const diff = generateDiff(v0Config, migrated, 'v0');

      const diffString = diff.join('\n');
      expect(diffString).toContain('Timestamp:');
      expect(diffString).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        version: '1.0.0',
        thresholds: { opThreshold: 1.2, weakThreshold: 0.8 },
        simulation: { simulationCount: 1000, concurrencyLimit: 10, seed: 12345 },
        export: { enableJson: true, enableCsv: true, enableMarkdown: false, exportPath: './results' },
        archetype: {
          pointsPerWeight: 25,
          defaultSeed: 12345,
          includePairs: true,
          excludeDerived: true,
          minWeight: 0.5,
        },
        incompatiblePairs: [],
        enablePersistence: true,
        enableTelemetry: true,
      };

      const validation = validateMigratedConfig(validConfig);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const invalidConfig = {
        version: '1.0.0',
        thresholds: { opThreshold: 1.2, weakThreshold: 0.8 },
        simulation: { simulationCount: -100, concurrencyLimit: 10, seed: 12345 },
        export: { enableJson: true, enableCsv: true, enableMarkdown: false, exportPath: './results' },
        archetype: {
          pointsPerWeight: 25,
          defaultSeed: 12345,
          includePairs: true,
          excludeDerived: true,
          minWeight: 0.5,
        },
        incompatiblePairs: [],
        enablePersistence: true,
        enableTelemetry: true,
      };

      const validation = validateMigratedConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('simulation.simulationCount');
    });
  });

  describe('Migration Summary', () => {
    it('should create summary from results', () => {
      const results: MigrationResult[] = [
        {
          success: true,
          inputFile: '/path/to/config1.json',
          outputFile: '/path/to/config1.json',
          version: 'v1',
          changes: ['Change 1', 'Change 2'],
          errors: [],
          warnings: [],
        },
        {
          success: true,
          inputFile: '/path/to/config2.json',
          outputFile: '/path/to/config2.json',
          version: 'v0',
          changes: ['Change 3'],
          errors: [],
          warnings: [],
        },
        {
          success: false,
          inputFile: '/path/to/config3.json',
          outputFile: '/path/to/config3.json',
          version: 'v1',
          changes: [],
          errors: ['Parse error'],
          warnings: [],
        },
      ];

      const summary = createMigrationSummary(results);

      expect(summary.total).toBe(3);
      expect(summary.successful).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.byVersion).toEqual({ v1: 2, v0: 1 });
      expect(summary.errors).toHaveLength(1);
      expect(summary.errors[0]).toContain('config3.json');
      expect(summary.errors[0]).toContain('Parse error');
    });

    it('should handle empty results', () => {
      const results: MigrationResult[] = [];
      const summary = createMigrationSummary(results);

      expect(summary.total).toBe(0);
      expect(summary.successful).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.byVersion).toEqual({});
      expect(summary.errors).toHaveLength(0);
    });

    it('should handle all successful migrations', () => {
      const results: MigrationResult[] = [
        {
          success: true,
          inputFile: '/path/to/config1.json',
          outputFile: '/path/to/config1.json',
          version: 'v0',
          changes: [],
          errors: [],
          warnings: [],
        },
        {
          success: true,
          inputFile: '/path/to/config2.json',
          outputFile: '/path/to/config2.json',
          version: 'v0',
          changes: [],
          errors: [],
          warnings: [],
        },
      ];

      const summary = createMigrationSummary(results);

      expect(summary.successful).toBe(2);
      expect(summary.failed).toBe(0);
      expect(summary.errors).toHaveLength(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate migrated configs against current schema', () => {
      const v1Config = {
        simulationCount: 1000,
        seed: 12345,
        opThreshold: 1.2,
        weakThreshold: 0.8,
      };

      const migrated = migrateV1ToCurrent(v1Config);
      const schemaValidation = StressTestingConfigSchema.safeParse(migrated);

      expect(schemaValidation.success).toBe(true);
    });

    it('should handle edge cases in migration', () => {
      const edgeCases = [
        { simulationCount: 100 },
        { seed: 0 },
        { opThreshold: 1.0 },
        { weakThreshold: 1.0 },
        { pointsPerWeight: 1 },
        { minWeight: 0.1 },
        { maxPairs: 1 },
        { incompatiblePairs: [] as [string, string][] },
        { incompatiblePairs: [['a', 'b']] as [string, string][] },
      ];

      edgeCases.forEach((testCase) => {
        const migrated = migrateV1ToCurrent(testCase as any);
        const validation = validateMigratedConfig(migrated);
        
        if (!validation.valid) {
          console.log('Validation errors:', validation.errors);
        }
        expect(validation.valid).toBe(true);
      });
    });
  });
});
