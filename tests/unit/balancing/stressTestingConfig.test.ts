/**
 * Unit tests for Stress Testing Configuration Loader
 * 
 * Tests configuration loading, validation, persistence, and fallback behavior
 * for the centralized stress testing configuration system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StressTestingConfigLoader } from '@/balancing/config/stressTesting';
import { DEFAULT_STRESS_TESTING_CONFIG } from '@/balancing/config/stressTesting/schema';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(),
  saveData: vi.fn(),
  clearData: vi.fn(),
}));

import { loadData, saveData, clearData } from '@/shared/persistence/PersistenceService';

const mockLoadData = vi.mocked(loadData);
const mockSaveData = vi.mocked(saveData);
const mockClearData = vi.mocked(clearData);

describe('StressTestingConfigLoader', () => {
  let loader: StressTestingConfigLoader;

  beforeEach(() => {
    loader = StressTestingConfigLoader.getInstance();
    vi.clearAllMocks();
    
    // Reset loader state for each test
    (loader as any).config = null;
    (loader as any).overrides = null;
    (loader as any).isLoaded = false;
    
    // Mock successful operations
    mockSaveData.mockResolvedValue(undefined);
    mockClearData.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const loader1 = StressTestingConfigLoader.getInstance();
      const loader2 = StressTestingConfigLoader.getInstance();
      expect(loader1).toBe(loader2);
    });

    it('should start with unloaded state', () => {
      expect(loader.isLoaded).toBe(false);
      expect(loader.config).toBe(null);
      expect(loader.overrides).toBe(null);
    });
  });

  describe('configuration loading', () => {
    it('should load default configuration when no saved data exists', async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});

      const config = await loader.loadConfig();

      expect(config).toEqual(DEFAULT_STRESS_TESTING_CONFIG);
      expect(loader.isLoaded).toBe(true);
      expect(loader.config).toEqual(DEFAULT_STRESS_TESTING_CONFIG);
      expect(mockLoadData).toHaveBeenCalledWith(
        'stress_testing_config',
        DEFAULT_STRESS_TESTING_CONFIG
      );
    });

    it('should load and validate saved configuration', async () => {
      const savedConfig = {
        ...DEFAULT_STRESS_TESTING_CONFIG,
        thresholds: {
          opThreshold: 1.2,
          weakThreshold: 0.9,
        },
        simulation: {
          simulationCount: 2000,
        },
      };

      mockLoadData
        .mockImplementation((key: string, defaultValue: any) => {
          if (key === 'stress_testing_config') return Promise.resolve(savedConfig);
          if (key === 'stress_testing_overrides') return Promise.resolve({});
          return Promise.resolve(defaultValue);
        });

      const config = await loader.loadConfig();

      expect(config.thresholds.opThreshold).toBe(1.2);
      expect(config.thresholds.weakThreshold).toBe(0.9);
      expect(config.simulation.simulationCount).toBe(2000);
      expect(loader.isLoaded).toBe(true);
    });

    it('should merge saved configuration with overrides', async () => {
      const savedConfig = {
        ...DEFAULT_STRESS_TESTING_CONFIG,
        thresholds: {
          opThreshold: 1.1,
          weakThreshold: 0.8,
        },
      };

      const savedOverrides = {
        simulation: {
          simulationCount: 5000,
        },
        export: {
          enableMarkdown: true,
        },
      };

      mockLoadData
        .mockImplementation((key: string, defaultValue: any) => {
          if (key === 'stress_testing_config') return Promise.resolve(savedConfig);
          if (key === 'stress_testing_overrides') return Promise.resolve(savedOverrides);
          return Promise.resolve(defaultValue);
        });

      const config = await loader.loadConfig();

      expect(config.thresholds.opThreshold).toBe(1.1);
      expect(config.thresholds.weakThreshold).toBe(0.8);
      expect(config.simulation.simulationCount).toBe(5000);
      expect(config.export.enableMarkdown).toBe(true);
    });

    it('should fallback to defaults on load error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockLoadData.mockRejectedValue(new Error('Storage error'));

      const config = await loader.loadConfig();

      expect(config).toEqual(DEFAULT_STRESS_TESTING_CONFIG);
      expect(loader.isLoaded).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load stress testing configuration:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('configuration sections', () => {
    beforeEach(async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});
      await loader.loadConfig();
    });

    it('should get thresholds configuration', async () => {
      const thresholds = await loader.getThresholds();
      expect(thresholds).toEqual(DEFAULT_STRESS_TESTING_CONFIG.thresholds);
    });

    it('should get simulation configuration', async () => {
      const simulation = await loader.getSimulationConfig();
      expect(simulation).toEqual(DEFAULT_STRESS_TESTING_CONFIG.simulation);
    });

    it('should get export configuration', async () => {
      const exportConfig = await loader.getExportConfig();
      expect(exportConfig).toEqual(DEFAULT_STRESS_TESTING_CONFIG.export);
    });

    it('should get archetype configuration', async () => {
      const archetype = await loader.getArchetypeConfig();
      expect(archetype).toEqual(DEFAULT_STRESS_TESTING_CONFIG.archetype);
    });
  });

  describe('configuration saving', () => {
    beforeEach(async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});
      await loader.loadConfig();
    });

    it('should save configuration to persistence', async () => {
      const updateConfig = {
        thresholds: {
          opThreshold: 1.3,
        },
        simulation: {
          simulationCount: 3000,
        },
      };

      await loader.saveConfig(updateConfig);

      expect(mockSaveData).toHaveBeenCalledWith(
        'stress_testing_config',
        expect.objectContaining({
          thresholds: expect.objectContaining({
            opThreshold: 1.3,
          }),
          simulation: expect.objectContaining({
            simulationCount: 3000,
          }),
        })
      );
    });

    it('should update internal state after saving', async () => {
      const updateConfig = {
        thresholds: {
          opThreshold: 1.4,
        },
      };

      await loader.saveConfig(updateConfig);
      const config = await loader.getConfig();

      expect(config.thresholds.opThreshold).toBe(1.4);
    });

    it('should handle save errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSaveData.mockRejectedValue(new Error('Save error'));

      await expect(loader.saveConfig({})).rejects.toThrow('Failed to save configuration');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save stress testing configuration:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('overrides management', () => {
    beforeEach(async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});
      await loader.loadConfig();
    });

    it('should save overrides separately', async () => {
      const overrides = {
        simulation: {
          simulationCount: 5000,
        },
      };

      await loader.saveOverrides(overrides);

      expect(mockSaveData).toHaveBeenCalledWith(
        'stress_testing_overrides',
        overrides
      );
    });

    it('should update overrides state', async () => {
      const overrides = {
        export: {
          enableMarkdown: true,
        },
      };

      await loader.saveOverrides(overrides);
      expect(loader.overrides).toEqual(overrides);
    });
  });

  describe('configuration reset', () => {
    beforeEach(async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});
      await loader.loadConfig();
    });

    it('should reset to defaults', async () => {
      await loader.resetToDefaults();

      expect(mockSaveData).toHaveBeenCalledWith(
        'stress_testing_config',
        DEFAULT_STRESS_TESTING_CONFIG
      );
      expect(mockSaveData).toHaveBeenCalledWith(
        'stress_testing_overrides',
        {}
      );
      expect(loader.config).toEqual(DEFAULT_STRESS_TESTING_CONFIG);
      expect(loader.overrides).toEqual({});
    });
  });

  describe('configuration clearing', () => {
    beforeEach(async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});
      await loader.loadConfig();
    });

    it('should clear all configuration data', async () => {
      await loader.clearConfig();

      expect(mockClearData).toHaveBeenCalledWith('stress_testing_config');
      expect(mockClearData).toHaveBeenCalledWith('stress_testing_overrides');
      expect(loader.config).toBe(null);
      expect(loader.overrides).toBe(null);
      expect(loader.isLoaded).toBe(false);
    });
  });

  describe('import/export', () => {
    beforeEach(async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});
      await loader.loadConfig();
    });

    it('should export configuration as JSON', async () => {
      const exported = await loader.exportConfig();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual(DEFAULT_STRESS_TESTING_CONFIG);
      expect(typeof exported).toBe('string');
    });

    it('should import configuration from JSON', async () => {
      const importConfig = {
        ...DEFAULT_STRESS_TESTING_CONFIG,
        thresholds: {
          opThreshold: 1.5,
          weakThreshold: 0.85,
        },
      };

      const jsonConfig = JSON.stringify(importConfig);
      await loader.importConfig(jsonConfig);

      const config = await loader.getConfig();
      expect(config.thresholds.opThreshold).toBe(1.5);
      expect(config.thresholds.weakThreshold).toBe(0.85);
    });

    it('should handle invalid JSON on import', async () => {
      await expect(loader.importConfig('invalid json')).rejects.toThrow('Failed to import configuration');
    });

    it('should handle invalid configuration on import', async () => {
      const invalidConfig = {
        thresholds: {
          opThreshold: 'invalid',
        },
      };

      await expect(loader.importConfig(JSON.stringify(invalidConfig))).rejects.toThrow();
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});
      await loader.loadConfig();
    });

    it('should validate configuration', () => {
      const validConfig = { ...DEFAULT_STRESS_TESTING_CONFIG };
      const result = loader.validateConfig(validConfig);
      expect(result).toEqual(validConfig);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        thresholds: {
          opThreshold: 'invalid',
        },
      };
      
      expect(() => loader.validateConfig(invalidConfig)).toThrow();
    });

    it('should get configuration version', async () => {
      const version = await loader.getVersion();
      expect(version).toBe(DEFAULT_STRESS_TESTING_CONFIG.version);
    });

    it('should check persistence enabled', async () => {
      const enabled = await loader.isPersistenceEnabled();
      expect(enabled).toBe(DEFAULT_STRESS_TESTING_CONFIG.enablePersistence);
    });

    it('should check telemetry enabled', async () => {
      const enabled = await loader.isTelemetryEnabled();
      expect(enabled).toBe(DEFAULT_STRESS_TESTING_CONFIG.enableTelemetry);
    });

    it('should force reload configuration', async () => {
      const newConfig = {
        ...DEFAULT_STRESS_TESTING_CONFIG,
        thresholds: {
          opThreshold: 2.0,
        },
      };

      mockLoadData
        .mockImplementation((key: string, defaultValue: any) => {
          if (key === 'stress_testing_config') return Promise.resolve(newConfig);
          if (key === 'stress_testing_overrides') return Promise.resolve({});
          return Promise.resolve(defaultValue);
        });

      const reloadedConfig = await loader.reloadConfig();
      expect(reloadedConfig.thresholds.opThreshold).toBe(2.0);
    });
  });

  describe('convenience functions', () => {
    it('should load configuration through convenience function', async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});

      const { getStressTestingConfig } = await import('@/balancing/config/stressTesting');
      const config = await getStressTestingConfig();

      expect(config).toEqual(DEFAULT_STRESS_TESTING_CONFIG);
    });

    it('should get thresholds through convenience function', async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});

      const { getSynergyThresholds } = await import('@/balancing/config/stressTesting');
      const thresholds = await getSynergyThresholds();

      expect(thresholds).toEqual(DEFAULT_STRESS_TESTING_CONFIG.thresholds);
    });

    it('should save configuration through convenience function', async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});

      const { saveStressTestingConfig } = await import('@/balancing/config/stressTesting');
      await saveStressTestingConfig({ thresholds: { opThreshold: 1.8 } });

      expect(mockSaveData).toHaveBeenCalled();
    });

    it('should reset configuration through convenience function', async () => {
      mockLoadData
        .mockResolvedValueOnce(DEFAULT_STRESS_TESTING_CONFIG)
        .mockResolvedValueOnce({});

      const { resetStressTestingConfig } = await import('@/balancing/config/stressTesting');
      await resetStressTestingConfig();

      expect(mockSaveData).toHaveBeenCalledWith(
        'stress_testing_config',
        DEFAULT_STRESS_TESTING_CONFIG
      );
    });
  });
});
