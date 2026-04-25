/**
 * NP-092 – Terrain Modifier Config Tool Unit Tests
 *
 * Comprehensive test suite for the TerrainModifierConfigTool class.
 * Tests preset management, validation, import/export, and batch operations.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { TerrainModifierConfigTool } from '../TerrainModifierConfigTool';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe('TerrainModifierConfigTool', () => {
  let configTool: TerrainModifierConfigTool;
  let mockPreset: {
    id: string;
    name: string;
    description: string;
    modifiers: Array<{
      id: string;
      label: string;
      description?: string;
      slotIds: string[];
      effectType: 'production' | 'risk' | 'safety' | 'mobility';
      magnitude: number;
      color: string;
      intensity: number;
      layerId: string;
      pattern?: string;
      isEnabled: boolean;
      icon?: string;
    }>;
    layers: Array<{
      id: string;
      name: string;
      description?: string;
      order: number;
      defaultVisible: boolean;
      colorHint: string;
    }>;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock fs functions
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('[]');
    vi.mocked(writeFileSync).mockImplementation(() => {});

    configTool = new TerrainModifierConfigTool('./test-data');

    mockPreset = {
      id: 'test-preset',
      name: 'Test Preset',
      description: 'A test preset',
      modifiers: [
        {
          id: 'test-modifier',
          label: 'Test Modifier',
          description: 'A test modifier',
          slotIds: ['test-slot'],
          effectType: 'production' as const,
          magnitude: 0.1,
          color: 'rgba(0, 255, 0, 0.5)',
          intensity: 0.8,
          layerId: 'environment',
          isEnabled: true,
        },
      ],
      layers: [
        {
          id: 'test-layer',
          name: 'Test Layer',
          description: 'A test layer',
          order: 1,
          defaultVisible: true,
          colorHint: '#00ff00',
        },
      ],
      tags: ['test', 'example'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  describe('Initialization', () => {
    it('should initialize with default config directory', () => {
      const tool = new TerrainModifierConfigTool();
      expect(tool).toBeInstanceOf(TerrainModifierConfigTool);
    });

    it('should create config directory if it does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      new TerrainModifierConfigTool('./new-dir');
      expect(vi.mocked(existsSync)).toHaveBeenCalledWith('./new-dir');
    });

    it('should load existing presets on initialization', () => {
      const presetData = JSON.stringify([mockPreset]);
      vi.mocked(readFileSync).mockReturnValue(presetData);

      const tool = new TerrainModifierConfigTool('./test-data');
      expect(tool.getAllPresets()).toHaveLength(1);
    });
  });

  describe('Preset Management', () => {
    it('should create a new preset', () => {
      const preset = configTool.createPreset(
        'new-preset',
        'New Preset',
        'A new test preset',
        mockPreset.modifiers,
        mockPreset.layers,
        ['test']
      );

      expect(preset).toMatchObject({
        id: 'new-preset',
        name: 'New Preset',
        description: 'A new test preset',
        tags: ['test'],
      });
      expect(preset.modifiers).toHaveLength(1);
      expect(preset.layers).toHaveLength(1);
    });

    it('should retrieve preset by ID', () => {
      configTool.createPreset(
        'test-preset',
        'Test Preset',
        'Description',
        mockPreset.modifiers,
        mockPreset.layers
      );

      const retrieved = configTool.getPreset('test-preset');
      expect(retrieved?.id).toBe('test-preset');
    });

    it('should return undefined for non-existent preset', () => {
      const preset = configTool.getPreset('non-existent');
      expect(preset).toBeUndefined();
    });

    it('should return all presets', () => {
      configTool.createPreset('preset1', 'Preset 1', '', [], []);
      configTool.createPreset('preset2', 'Preset 2', '', [], []);

      const presets = configTool.getAllPresets();
      expect(presets).toHaveLength(2);
      expect(presets.map(p => p.id)).toEqual(['preset1', 'preset2']);
    });

    it('should get presets by tags', () => {
      configTool.createPreset('preset1', 'Preset 1', '', [], [], ['tag1']);
      configTool.createPreset('preset2', 'Preset 2', '', [], [], ['tag2']);
      configTool.createPreset('preset3', 'Preset 3', '', [], [], ['tag1', 'tag2']);

      const tag1Presets = configTool.getPresetsByTags(['tag1']);
      expect(tag1Presets).toHaveLength(2);
      expect(tag1Presets.map(p => p.id)).toContain('preset1');
      expect(tag1Presets.map(p => p.id)).toContain('preset3');
    });

    it('should update existing preset', () => {
      configTool.createPreset('test-preset', 'Original Name', 'Original desc', [], []);

      const updated = configTool.updatePreset('test-preset', {
        name: 'Updated Name',
        description: 'Updated description',
        tags: ['updated'],
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.tags).toEqual(['updated']);
    });

    it('should return null when updating non-existent preset', () => {
      const result = configTool.updatePreset('non-existent', { name: 'New Name' });
      expect(result).toBeNull();
    });

    it('should delete preset', () => {
      configTool.createPreset('test-preset', 'Test', '', [], []);
      expect(configTool.deletePreset('test-preset')).toBe(true);
      expect(configTool.getPreset('test-preset')).toBeUndefined();
    });

    it('should return false when deleting non-existent preset', () => {
      expect(configTool.deletePreset('non-existent')).toBe(false);
    });

    it('should clone preset', () => {
      configTool.createPreset('original', 'Original', 'Desc', mockPreset.modifiers, mockPreset.layers);

      const cloned = configTool.clonePreset('original', 'cloned', 'Cloned Version');
      expect(cloned?.id).toBe('cloned');
      expect(cloned?.name).toBe('Cloned Version');
      expect(cloned?.modifiers).toEqual(mockPreset.modifiers);
    });

    it('should return null when cloning non-existent preset', () => {
      const result = configTool.clonePreset('non-existent', 'new-id');
      expect(result).toBeNull();
    });
  });

  describe('Preset Merging', () => {
    beforeEach(() => {
      // Create test presets
      configTool.createPreset('preset1', 'Preset 1', '', [
        {
          id: 'mod1',
          label: 'Modifier 1',
          slotIds: ['slot1'],
          effectType: 'production' as const,
          magnitude: 0.1,
          color: 'red',
          intensity: 0.5,
          layerId: 'layer1',
          isEnabled: true,
        },
      ], [
        {
          id: 'layer1',
          name: 'Layer 1',
          order: 1,
          defaultVisible: true,
          colorHint: '#ff0000',
        },
      ]);

      configTool.createPreset('preset2', 'Preset 2', '', [
        {
          id: 'mod2',
          label: 'Modifier 2',
          slotIds: ['slot2'],
          effectType: 'risk' as const,
          magnitude: -0.1,
          color: 'blue',
          intensity: 0.7,
          layerId: 'layer2',
          isEnabled: true,
        },
      ], [
        {
          id: 'layer2',
          name: 'Layer 2',
          order: 2,
          defaultVisible: false,
          colorHint: '#0000ff',
        },
      ]);
    });

    it('should merge multiple presets', () => {
      const merged = configTool.mergePresets(
        ['preset1', 'preset2'],
        'merged-preset',
        'Merged Preset',
        'A merged preset description'
      );

      expect(merged?.id).toBe('merged-preset');
      expect(merged?.name).toBe('Merged Preset');
      expect(merged?.modifiers).toHaveLength(2);
      expect(merged?.layers).toHaveLength(2);
    });

    it('should return null when merging with non-existent presets', () => {
      const result = configTool.mergePresets(['non-existent'], 'new-id', 'New', '');
      expect(result).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    beforeEach(() => {
      configTool.createPreset('batch-test', 'Batch Test', '', [
        {
          id: 'batch-mod',
          label: 'Batch Modifier',
          slotIds: ['slot1'],
          effectType: 'production' as const,
          magnitude: 0.1,
          color: 'green',
          intensity: 0.6,
          layerId: 'batch-layer',
          isEnabled: true,
        },
      ], []);
    });

    it('should perform batch modifier updates', () => {
      const result = configTool.batchUpdateModifiers('batch-test', [
        {
          id: 'batch-mod',
          updates: {
            magnitude: 0.2,
            label: 'Updated Modifier',
          },
        },
      ]);

      expect(result.success).toBe(true);
      expect(result.affectedItems).toBe(1);

      const updated = configTool.getPreset('batch-test');
      expect(updated?.modifiers[0].magnitude).toBe(0.2);
      expect(updated?.modifiers[0].label).toBe('Updated Modifier');
    });

    it('should handle batch updates with warnings', () => {
      const result = configTool.batchUpdateModifiers('batch-test', [
        {
          id: 'batch-mod',
          updates: { magnitude: 0.2 },
        },
        {
          id: 'non-existent-mod',
          updates: { magnitude: 0.3 },
        },
      ]);

      expect(result.success).toBe(true);
      expect(result.affectedItems).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('non-existent-mod');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        version: 1,
        modifiers: mockPreset.modifiers,
        layers: [
          {
            id: 'test-layer',
            visible: true,
            order: 1,
          },
        ],
      };

      const result = configTool.validateConfiguration(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.validModifiers).toBe(1);
      expect(result.stats.validLayers).toBe(1);
    });

    it('should detect invalid version', () => {
      const invalidConfig = {
        version: 999,
        modifiers: [],
        layers: [],
      };

      const result = configTool.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid version: 999, expected 1');
    });

    it('should detect invalid modifiers', () => {
      const invalidConfig = {
        version: 1,
        modifiers: [
          {
            id: '', // Invalid: empty ID
            label: 'Test',
            slotIds: [],
            effectType: 'production', // Invalid type for testing
            magnitude: 2, // Invalid: > 1
            color: 'invalid',
            intensity: 1.5, // Invalid: > 1
            layerId: '',
            isEnabled: true,
          },
        ],
        layers: [],
      };

      const result = configTool.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.stats.validModifiers).toBe(0);
    });

    it('should detect orphaned layers', () => {
      const configWithOrphanedLayer = {
        version: 1,
        modifiers: [
          {
            id: 'mod1',
            label: 'Modifier 1',
            slotIds: ['slot1'],
            effectType: 'production' as const,
            magnitude: 0.1,
            color: 'red',
            intensity: 0.5,
            layerId: 'used-layer',
            isEnabled: true,
          },
        ],
        layers: [
          { id: 'used-layer', visible: true, order: 1 },
          { id: 'orphaned-layer', visible: false, order: 2 },
        ],
      };

      const result = configTool.validateConfiguration(configWithOrphanedLayer);
      expect(result.isValid).toBe(true); // Orphaned layers are warnings, not errors
      expect(result.warnings).toContain('Layer orphaned-layer is not used by any modifier');
    });

    it('should detect invalid layer references', () => {
      const configWithInvalidLayerRef = {
        version: 1,
        modifiers: [
          {
            id: 'mod1',
            label: 'Modifier 1',
            slotIds: ['slot1'],
            effectType: 'production' as const,
            magnitude: 0.1,
            color: 'red',
            intensity: 0.5,
            layerId: 'non-existent-layer',
            isEnabled: true,
          },
        ],
        layers: [{ id: 'existing-layer', visible: true, order: 1 }],
      };

      const result = configTool.validateConfiguration(configWithInvalidLayerRef);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Modifier mod1 references non-existent layer: non-existent-layer');
    });

    it('should detect duplicate modifier IDs', () => {
      const configWithDuplicates = {
        version: 1,
        modifiers: [
          {
            id: 'duplicate',
            label: 'Modifier 1',
            slotIds: ['slot1'],
            effectType: 'production' as const,
            magnitude: 0.1,
            color: 'red',
            intensity: 0.5,
            layerId: 'layer1',
            isEnabled: true,
          },
          {
            id: 'duplicate', // Duplicate ID
            label: 'Modifier 2',
            slotIds: ['slot2'],
            effectType: 'risk' as const,
            magnitude: -0.1,
            color: 'blue',
            intensity: 0.6,
            layerId: 'layer1',
            isEnabled: true,
          },
        ],
        layers: [{ id: 'layer1', visible: true, order: 1 }],
      };

      const result = configTool.validateConfiguration(configWithDuplicates);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate modifier ID: duplicate');
    });
  });

  describe('Import/Export', () => {
    it('should export configuration to JSON', () => {
      configTool.createPreset('export-test', 'Export Test', 'Test export', mockPreset.modifiers, mockPreset.layers);

      const success = configTool.exportConfiguration('export-test', './export-test.json');
      expect(success).toBe(true);
      expect(writeFileSync).toHaveBeenCalledWith('./export-test.json', expect.any(String));
    });

    it('should return false when exporting non-existent preset', () => {
      const success = configTool.exportConfiguration('non-existent', './test.json');
      expect(success).toBe(false);
    });

    it('should import configuration from JSON', () => {
      const importData = JSON.stringify(mockPreset);
      vi.mocked(readFileSync).mockReturnValue(importData);

      const imported = configTool.importConfiguration('./import-test.json', 'imported-preset');
      expect(imported?.id).toBe('imported-preset');
      expect(imported?.name).toBe(mockPreset.name);
    });

    it('should return null when importing invalid JSON', () => {
      vi.mocked(readFileSync).mockReturnValue('invalid json');

      const result = configTool.importConfiguration('./invalid.json');
      expect(result).toBeNull();
    });

    it('should handle persistence format import', () => {
      const persistenceData = {
        version: 1,
        modifiers: mockPreset.modifiers,
        layers: [
          {
            id: 'test-layer' as string,
            visible: true as boolean,
            order: 1 as number,
          },
        ],
      };

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(persistenceData));

      const imported = configTool.importConfiguration('./persistence.json', 'imported-from-persistence');
      expect(imported?.id).toBe('imported-from-persistence');
      expect(imported?.modifiers).toEqual(mockPreset.modifiers);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Create test data
      configTool.createPreset('stat-preset1', 'Stat Preset 1', '', [], [], ['tag1', 'common']);
      configTool.createPreset('stat-preset2', 'Stat Preset 2', '', [], [], ['tag2', 'common']);
      configTool.createPreset('stat-preset3', 'Stat Preset 3', '', [], [], ['tag1']);
    });

    it('should generate accurate statistics', () => {
      const stats = configTool.getStatistics();

      expect(stats.totalPresets).toBe(3);
      expect(stats.presetsByTag['tag1']).toBe(2);
      expect(stats.presetsByTag['tag2']).toBe(1);
      expect(stats.presetsByTag['common']).toBe(2);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup invalid presets', () => {
      // Create a valid preset
      configTool.createPreset('valid-preset', 'Valid', '', mockPreset.modifiers, mockPreset.layers);

      // Manually add an invalid preset to the internal map (simulating corrupted data)
      (configTool as any).presets.set('invalid-preset', { invalid: 'data' });

      const result = (configTool as any).cleanupInvalidPresets();

      expect(result.success).toBe(true);
      expect(result.affectedItems).toBe(1);
      expect(configTool.getAllPresets()).toHaveLength(1);
      expect(configTool.getPreset('valid-preset')).toBeDefined();
      expect(configTool.getPreset('invalid-preset')).toBeUndefined();
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      configTool.createPreset('report-preset1', 'Report Preset 1', 'First preset', mockPreset.modifiers, mockPreset.layers, ['report']);
      configTool.createPreset('report-preset2', 'Report Preset 2', 'Second preset', [], [], ['report']);
    });

    it('should generate comprehensive report', () => {
      const report = configTool.generateReport();

      expect(report).toContain('# Terrain Modifier Configuration Report');
      expect(report).toContain('Report Preset 1');
      expect(report).toContain('Report Preset 2');
      expect(report).toContain('Total Presets: 2');
      expect(report).toContain('report');
    });

    it('should generate report for specific presets', () => {
      const report = configTool.generateReport(['report-preset1']);

      expect(report).toContain('Report Preset 1');
      expect(report).toContain('First preset');
      expect(report).not.toContain('Report Preset 2');
    });
  });

  describe('Error Handling', () => {
    it('should handle preset creation with invalid data', () => {
      expect(() => {
        configTool.createPreset('', 'Invalid', '', [], []); // Empty ID
      }).toThrow();
    });

    it('should handle export errors gracefully', () => {
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('Write failed');
      });

      configTool.createPreset('test', 'Test', '', [], []);
      const success = configTool.exportConfiguration('test', './test.json');
      expect(success).toBe(false);
    });

    it('should handle import file not found', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = configTool.importConfiguration('./non-existent.json');
      expect(result).toBeNull();
    });
  });
});
