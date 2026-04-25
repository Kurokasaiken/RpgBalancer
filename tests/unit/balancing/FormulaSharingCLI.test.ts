/**
 * Balancer Formula Sharing CLI Tests - NP-037
 * 
 * Unit tests for the formula sharing CLI functionality.
 * Tests export, import, validation, and CLI commands.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormulaSharingService, type ExportFormat, type ExportScope } from '../../../src/balancing/config/FormulaSharingService';
import { BalancerConfigStore } from '../../../src/balancing/config/BalancerConfigStore';
import type { BalancerConfig } from '../../../src/balancing/config/types';

// Mock dependencies
vi.mock('../../../src/balancing/config/BalancerConfigStore');
vi.mock('../../../src/shared/persistence/PersistenceService');
vi.mock('fs/promises');
vi.mock('path');

// Mock data
const mockConfig: BalancerConfig = {
  version: '1.1.0',
  stats: {
    'hp': {
      id: 'hp',
      label: 'Health Points',
      type: 'number',
      min: 1,
      max: 999,
      step: 1,
      defaultValue: 100,
      weight: 1.0,
      isCore: true,
      isDerived: false,
      isLocked: false,
    },
    'damage': {
      id: 'damage',
      label: 'Damage',
      type: 'number',
      min: 1,
      max: 999,
      step: 1,
      defaultValue: 25,
      weight: 1.0,
      isCore: true,
      isDerived: false,
      isLocked: false,
    },
    'derived_stat': {
      id: 'derived_stat',
      label: 'Derived Stat',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      weight: 0.5,
      isCore: false,
      isDerived: true,
      formula: 'hp * 0.5 + damage * 0.3',
      isLocked: false,
    },
  },
  cards: {
    'core_card': {
      id: 'core_card',
      title: 'Core Card',
      color: '#ff0000',
      statIds: ['hp', 'damage'],
      isCore: true,
      order: 1,
      isLocked: false,
    },
    'custom_card': {
      id: 'custom_card',
      title: 'Custom Card',
      color: '#00ff00',
      statIds: ['derived_stat'],
      isCore: false,
      order: 2,
      isLocked: false,
    },
  },
  presets: {
    'balanced': {
      id: 'balanced',
      name: 'Balanced',
      description: 'Balanced preset',
      weights: {
        'hp': 1.0,
        'damage': 1.0,
        'derived_stat': 0.5,
      },
      isBuiltIn: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      modifiedAt: '2023-01-01T00:00:00.000Z',
    },
    'custom': {
      id: 'custom',
      name: 'Custom',
      description: 'Custom preset',
      weights: {
        'hp': 1.5,
        'damage': 0.8,
        'derived_stat': 0.3,
      },
      isBuiltIn: false,
      createdAt: '2023-01-02T00:00:00.000Z',
      modifiedAt: '2023-01-02T00:00:00.000Z',
    },
  },
  activePresetId: 'balanced',
  targetTurns: {
    'short': 3,
    'medium': 5,
    'long': 10,
  },
  scenarioBudget: {
    'short': { hpEq: 300, damageEq: 75 },
    'medium': { hpEq: 500, damageEq: 125 },
    'long': { hpEq: 1000, damageEq: 250 },
  },
};

describe('FormulaSharingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BalancerConfigStore.getConfig).mockReturnValue(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportConfig', () => {
    it('should export full configuration in JSON format', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'full',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.version).toBe('1.1.0');
      expect(result.scope).toBe('full');
      expect(result.format).toBe('json');
      expect(result.exportedBy).toBe('Test User');
      expect(result.metadata.totalFormulas).toBe(1);
      expect(result.metadata.totalCards).toBe(2);
      expect(result.metadata.totalPresets).toBe(2);
      expect(result.formulas).toHaveLength(1);
      expect(result.cards).toHaveLength(2);
      expect(result.presets).toHaveLength(2);
      expect(result.checksum).toBeDefined();
    });

    it('should export only formulas', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.scope).toBe('formulas');
      expect(result.metadata.totalFormulas).toBe(1);
      expect(result.metadata.totalCards).toBe(0);
      expect(result.metadata.totalPresets).toBe(0);
      expect(result.formulas).toHaveLength(1);
      expect(result.cards).toBeUndefined();
      expect(result.presets).toBeUndefined();
    });

    it('should export only cards', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'cards',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.scope).toBe('cards');
      expect(result.metadata.totalFormulas).toBe(0);
      expect(result.metadata.totalCards).toBe(2);
      expect(result.metadata.totalPresets).toBe(0);
      expect(result.formulas).toBeUndefined();
      expect(result.cards).toHaveLength(2);
      expect(result.presets).toBeUndefined();
    });

    it('should export only presets', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'presets',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.scope).toBe('presets');
      expect(result.metadata.totalFormulas).toBe(0);
      expect(result.metadata.totalCards).toBe(0);
      expect(result.metadata.totalPresets).toBe(2);
      expect(result.formulas).toBeUndefined();
      expect(result.cards).toBeUndefined();
      expect(result.presets).toHaveLength(2);
    });

    it('should export without metadata', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'full',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: false,
      });

      expect(result.formulas).toBeUndefined();
      expect(result.cards).toBeUndefined();
      expect(result.presets).toBeUndefined();
      expect(result.metadata.totalFormulas).toBe(1);
      expect(result.metadata.totalCards).toBe(2);
      expect(result.metadata.totalPresets).toBe(2);
    });
  });

  describe('serializePackage', () => {
    it('should serialize to JSON', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const serialized = FormulaSharingService.serializePackage(exportPackage, 'json');
      const parsed = JSON.parse(serialized);

      expect(parsed.version).toBe('1.1.0');
      expect(parsed.scope).toBe('formulas');
      expect(parsed.exportedBy).toBe('Test User');
    });

    it('should serialize to markdown', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'markdown',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const serialized = FormulaSharingService.serializePackage(exportPackage, 'markdown');

      expect(serialized).toContain('# Balancer Formula Export');
      expect(serialized).toContain('**Version:** 1.1.0');
      expect(serialized).toContain('## Formulas');
      expect(serialized).toContain('### Derived Stat');
    });

    it('should throw error for unsupported format', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(() => {
        FormulaSharingService.serializePackage(exportPackage, 'yaml' as ExportFormat);
      }).toThrow('YAML export not yet implemented');
    });
  });

  describe('parsePackage', () => {
    it('should parse JSON package', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const serialized = JSON.stringify(exportPackage);
      const parsed = FormulaSharingService.parsePackage(serialized, 'json');

      expect(parsed.version).toBe('1.1.0');
      expect(parsed.scope).toBe('formulas');
      expect(parsed.exportedBy).toBe('Test User');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        FormulaSharingService.parsePackage('', 'yaml' as ExportFormat);
      }).toThrow('YAML format not yet implemented');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        FormulaSharingService.parsePackage('invalid json', 'json');
      }).toThrow();
    });
  });

  describe('importConfig', () => {
    it('should validate import without applying changes in dry run', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const result = await FormulaSharingService.importConfig(
        exportPackage,
        mockConfig,
        {
          overwriteExisting: false,
          skipBuiltIn: false,
          validateFormulas: true,
          createBackup: false,
          dryRun: true,
        }
      );

      expect(result.validation.valid).toBe(false); // Should have conflicts
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.validation.summary.conflicts).toBeGreaterThan(0);
      expect(result.updatedConfig).toBeUndefined();
      expect(result.backup).toBeUndefined();
    });

    it('should create backup when requested', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      // Create a different config to avoid conflicts
      const differentConfig: BalancerConfig = {
        ...mockConfig,
        stats: {
          'different_stat': {
            id: 'different_stat',
            label: 'Different Stat',
            type: 'number',
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 50,
            weight: 1.0,
            isCore: false,
            isDerived: false,
          },
        },
      };

      const result = await FormulaSharingService.importConfig(
        exportPackage,
        differentConfig,
        {
          overwriteExisting: false,
          skipBuiltIn: false,
          validateFormulas: true,
          createBackup: true,
          dryRun: true,
        }
      );

      expect(result.backup).toBeDefined();
      expect(result.backup?.stats).toEqual(differentConfig.stats);
    });

    it('should skip built-in presets when requested', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'presets',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const result = await FormulaSharingService.importConfig(
        exportPackage,
        mockConfig,
        {
          overwriteExisting: false,
          skipBuiltIn: true,
          validateFormulas: true,
          createBackup: false,
          dryRun: true,
        }
      );

      expect(result.validation.warnings).toContain('Skipping built-in preset balanced');
    });

    it('should validate formulas when requested', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const result = await FormulaSharingService.importConfig(
        exportPackage,
        mockConfig,
        {
          overwriteExisting: false,
          skipBuiltIn: false,
          validateFormulas: true,
          createBackup: false,
          dryRun: true,
        }
      );

      // Should have formula validation results
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('formula extraction', () => {
    it('should extract only derived stats with formulas', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.formulas).toHaveLength(1);
      expect(result.formulas![0].statId).toBe('derived_stat');
      expect(result.formulas![0].formula).toBe('hp * 0.5 + damage * 0.3');
      expect(result.formulas![0].metadata.isDerived).toBe(true);
    });

    it('should include formula validation results', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.formulas![0].validation).toBeDefined();
      expect(result.formulas![0].validation.usedStats).toContain('hp');
      expect(result.formulas![0].validation.usedStats).toContain('damage');
    });
  });

  describe('card extraction', () => {
    it('should extract all cards with metadata', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'cards',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.cards).toHaveLength(2);
      
      const coreCard = result.cards!.find(c => c.cardId === 'core_card');
      expect(coreCard).toBeDefined();
      expect(coreCard!.title).toBe('Core Card');
      expect(coreCard!.isCore).toBe(true);
      expect(coreCard!.statIds).toEqual(['hp', 'damage']);

      const customCard = result.cards!.find(c => c.cardId === 'custom_card');
      expect(customCard).toBeDefined();
      expect(customCard!.title).toBe('Custom Card');
      expect(customCard!.isCore).toBe(false);
      expect(customCard!.statIds).toEqual(['derived_stat']);
    });
  });

  describe('preset extraction', () => {
    it('should extract all presets with metadata', async () => {
      const result = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'presets',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result.presets).toHaveLength(2);
      
      const balancedPreset = result.presets!.find(p => p.presetId === 'balanced');
      expect(balancedPreset).toBeDefined();
      expect(balancedPreset!.name).toBe('Balanced');
      expect(balancedPreset!.isBuiltIn).toBe(true);
      expect(balancedPreset!.weights).toEqual({
        'hp': 1.0,
        'damage': 1.0,
        'derived_stat': 0.5,
      });

      const customPreset = result.presets!.find(p => p.presetId === 'custom');
      expect(customPreset).toBeDefined();
      expect(customPreset!.name).toBe('Custom');
      expect(customPreset!.isBuiltIn).toBe(false);
      expect(customPreset!.weights).toEqual({
        'hp': 1.5,
        'damage': 0.8,
        'derived_stat': 0.3,
      });
    });
  });

  describe('checksum generation', () => {
    it('should generate consistent checksums', async () => {
      const result1 = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'full',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const result2 = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'full',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result1.checksum).toBe(result2.checksum);
      expect(result1.checksum).toMatch(/^[a-f0-9]{32}$/); // MD5 hash
    });

    it('should generate different checksums for different data', async () => {
      const result1 = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const result2 = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'cards',
        format: 'json',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      expect(result1.checksum).not.toBe(result2.checksum);
    });
  });

  describe('markdown generation', () => {
    it('should generate proper markdown structure', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'full',
        format: 'markdown',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const markdown = FormulaSharingService.serializePackage(exportPackage, 'markdown');

      expect(markdown).toContain('# Balancer Formula Export');
      expect(markdown).toContain('## Metadata');
      expect(markdown).toContain('## Formulas');
      expect(markdown).toContain('## Cards');
      expect(markdown).toContain('## Presets');
      expect(markdown).toContain('---');
      expect(markdown).toContain('**Checksum:**');
    });

    it('should include formula details in markdown', async () => {
      const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
        scope: 'formulas',
        format: 'markdown',
        exportedBy: 'Test User',
        includeMetadata: true,
      });

      const markdown = FormulaSharingService.serializePackage(exportPackage, 'markdown');

      expect(markdown).toContain('### Derived Stat');
      expect(markdown).toContain('**ID:** `derived_stat`');
      expect(markdown).toContain('**Formula:** `hp * 0.5 + damage * 0.3`');
      expect(markdown).toContain('**Derived:** Yes');
      expect(markdown).toContain('**Weight:** 0.5');
    });
  });

  describe('error handling', () => {
    it('should handle missing configuration gracefully', () => {
      vi.mocked(BalancerConfigStore.getConfig).mockReturnValue(null as any);

      expect(async () => {
        await FormulaSharingService.exportConfig(mockConfig, {
          scope: 'full',
          format: 'json',
          exportedBy: 'Test User',
          includeMetadata: true,
        });
      }).rejects.toThrow('Failed to load balancer configuration');
    });

    it('should handle invalid scope', async () => {
      expect(async () => {
        await FormulaSharingService.exportConfig(mockConfig, {
          scope: 'invalid' as ExportScope,
          format: 'json',
          exportedBy: 'Test User',
          includeMetadata: true,
        });
      }).rejects.toThrow('Invalid scope: invalid');
    });

    it('should handle invalid format', async () => {
      expect(async () => {
        await FormulaSharingService.exportConfig(mockConfig, {
          scope: 'full',
          format: 'invalid' as ExportFormat,
          exportedBy: 'Test User',
          includeMetadata: true,
        });
      }).rejects.toThrow('Invalid format: invalid');
    });
  });
});

describe('CLI Integration', () => {
  // These would be integration tests for the CLI script
  // For now, we'll test the core functionality that the CLI uses

  it('should validate export package structure', async () => {
    const exportPackage = await FormulaSharingService.exportConfig(mockConfig, {
      scope: 'full',
      format: 'json',
      exportedBy: 'Test User',
      includeMetadata: true,
    });

    // Basic structure validation
    expect(exportPackage).toHaveProperty('version');
    expect(exportPackage).toHaveProperty('exportedAt');
    expect(exportPackage).toHaveProperty('exportedBy');
    expect(exportPackage).toHaveProperty('scope');
    expect(exportPackage).toHaveProperty('format');
    expect(exportPackage).toHaveProperty('checksum');
    expect(exportPackage).toHaveProperty('metadata');
    expect(exportPackage).toHaveProperty('formulas');
    expect(exportPackage).toHaveProperty('cards');
    expect(exportPackage).toHaveProperty('presets');
  });

  it('should handle empty configuration', async () => {
    const emptyConfig: BalancerConfig = {
      version: '1.1.0',
      stats: {},
      cards: {},
      presets: {},
      activePresetId: '',
      targetTurns: {},
      scenarioBudget: {},
    };

    const result = await FormulaSharingService.exportConfig(emptyConfig, {
      scope: 'full',
      format: 'json',
      exportedBy: 'Test User',
      includeMetadata: true,
    });

    expect(result.metadata.totalFormulas).toBe(0);
    expect(result.metadata.totalCards).toBe(0);
    expect(result.metadata.totalPresets).toBe(0);
    expect(result.formulas).toHaveLength(0);
    expect(result.cards).toHaveLength(0);
    expect(result.presets).toHaveLength(0);
  });
});
