/**
 * Stress Testing Configuration Loader
 * 
 * Centralized configuration management for Phase 10.5 stress testing
 * with PersistenceService integration, validation, and fallback handling.
 */

import { loadData, saveData, clearData } from '@/shared/persistence/PersistenceService';
import type { 
  StressTestingConfig, 
  SynergyThresholds, 
  SimulationConfig, 
  ExportConfig, 
  ArchetypeConfig 
} from './schema';
import { 
  DEFAULT_STRESS_TESTING_CONFIG,
  validateStressTestingConfig,
  mergeStressTestingConfig 
} from './schema';

/**
 * Configuration storage keys
 */
export const STRESS_TESTING_CONFIG_KEY = 'stress_testing_config';
export const STRESS_TESTING_OVERRIDES_KEY = 'stress_testing_overrides';

/**
 * Configuration loader with persistence and validation
 */
export class StressTestingConfigLoader {
  private static instance: StressTestingConfigLoader;
  private config: StressTestingConfig | null = null;
  private overrides: Partial<StressTestingConfig> | null = null;
  private isLoaded = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): StressTestingConfigLoader {
    if (!StressTestingConfigLoader.instance) {
      StressTestingConfigLoader.instance = new StressTestingConfigLoader();
    }
    return StressTestingConfigLoader.instance;
  }

  /**
   * Load configuration from persistence with fallback to defaults
   */
  async loadConfig(): Promise<StressTestingConfig> {
    if (this.isLoaded && this.config) {
      return this.config;
    }

    try {
      // Load main configuration
      const savedConfig = await loadData(
        STRESS_TESTING_CONFIG_KEY,
        DEFAULT_STRESS_TESTING_CONFIG
      );

      // Load user overrides
      const savedOverrides = await loadData(
        STRESS_TESTING_OVERRIDES_KEY,
        {}
      );

      // Validate and merge configuration
      const validatedConfig = validateStressTestingConfig(savedConfig);
      
      // Don't validate overrides as full config - they are partial updates
      // Instead, merge them with the base config first
      const mergedConfig = mergeStressTestingConfig(validatedConfig, savedOverrides);

      this.config = mergedConfig;
      this.overrides = savedOverrides;
      this.isLoaded = true;

      return mergedConfig;
    } catch (error) {
      console.error('Failed to load stress testing configuration:', error);
      
      // Fallback to defaults
      this.config = DEFAULT_STRESS_TESTING_CONFIG;
      this.overrides = {};
      this.isLoaded = true;

      return DEFAULT_STRESS_TESTING_CONFIG;
    }
  }

  /**
   * Get current configuration (loads if not already loaded)
   */
  async getConfig(): Promise<StressTestingConfig> {
    return this.loadConfig();
  }

  /**
   * Get specific configuration section
   */
  async getThresholds(): Promise<SynergyThresholds> {
    const config = await this.getConfig();
    return config.thresholds;
  }

  /**
   * Get simulation configuration
   */
  async getSimulationConfig(): Promise<SimulationConfig> {
    const config = await this.getConfig();
    return config.simulation;
  }

  /**
   * Get export configuration
   */
  async getExportConfig(): Promise<ExportConfig> {
    const config = await this.getConfig();
    return config.export;
  }

  /**
   * Get archetype configuration
   */
  async getArchetypeConfig(): Promise<ArchetypeConfig> {
    const config = await this.getConfig();
    return config.archetype;
  }

  /**
   * Save main configuration to persistence
   */
  async saveConfig(config: Partial<StressTestingConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const updatedConfig = mergeStressTestingConfig(currentConfig, config);
      
      await saveData(STRESS_TESTING_CONFIG_KEY, updatedConfig);
      
      this.config = updatedConfig;
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to save stress testing configuration:', error);
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save user overrides to persistence
   */
  async saveOverrides(overrides: Partial<StressTestingConfig>): Promise<void> {
    try {
      // Only save the override parts, not the full config
      const overrideData: Partial<StressTestingConfig> = {};
      
      // Extract only the fields that are being overridden
      Object.keys(overrides).forEach(key => {
        const fieldKey = key as keyof StressTestingConfig;
        if (overrides[fieldKey] !== undefined) {
          overrideData[fieldKey] = overrides[fieldKey];
        }
      });
      
      await saveData(STRESS_TESTING_OVERRIDES_KEY, overrideData);
      
      this.overrides = overrideData;
    } catch (error) {
      console.error('Failed to save stress testing overrides:', error);
      throw new Error(`Failed to save overrides: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      await saveData(STRESS_TESTING_CONFIG_KEY, DEFAULT_STRESS_TESTING_CONFIG);
      await saveData(STRESS_TESTING_OVERRIDES_KEY, {});
      
      this.config = DEFAULT_STRESS_TESTING_CONFIG;
      this.overrides = {};
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to reset stress testing configuration:', error);
      throw new Error(`Failed to reset configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all configuration data
   */
  async clearConfig(): Promise<void> {
    try {
      await clearData(STRESS_TESTING_CONFIG_KEY);
      await clearData(STRESS_TESTING_OVERRIDES_KEY);
      
      this.config = null;
      this.overrides = null;
      this.isLoaded = false;
    } catch (error) {
      console.error('Failed to clear stress testing configuration:', error);
      throw new Error(`Failed to clear configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export configuration to JSON
   */
  async exportConfig(): Promise<string> {
    const config = await this.getConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  async importConfig(jsonConfig: string): Promise<void> {
    try {
      const parsedConfig = JSON.parse(jsonConfig);
      const validatedConfig = validateStressTestingConfig(parsedConfig);
      
      await this.saveConfig(validatedConfig);
    } catch (error) {
      console.error('Failed to import stress testing configuration:', error);
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Validate configuration without saving
   */
  validateConfig(config: unknown): StressTestingConfig {
    return validateStressTestingConfig(config);
  }

  /**
   * Get configuration version
   */
  async getVersion(): Promise<string> {
    const config = await this.getConfig();
    return config.version;
  }

  /**
   * Check if persistence is enabled
   */
  async isPersistenceEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.enablePersistence;
  }

  /**
   * Check if telemetry is enabled
   */
  async isTelemetryEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.enableTelemetry;
  }

  /**
   * Force reload configuration from persistence
   */
  async reloadConfig(): Promise<StressTestingConfig> {
    this.config = null;
    this.overrides = null;
    this.isLoaded = false;
    
    return this.loadConfig();
  }
}

/**
 * Convenience exports for common operations
 */
export const stressTestingConfigLoader = StressTestingConfigLoader.getInstance();

/**
 * Async helper functions for common operations
 */
export async function getStressTestingConfig(): Promise<StressTestingConfig> {
  return stressTestingConfigLoader.getConfig();
}

export async function getSynergyThresholds(): Promise<SynergyThresholds> {
  return stressTestingConfigLoader.getThresholds();
}

export async function getSimulationConfig(): Promise<SimulationConfig> {
  return stressTestingConfigLoader.getSimulationConfig();
}

export async function getExportConfig(): Promise<ExportConfig> {
  return stressTestingConfigLoader.getExportConfig();
}

export async function getArchetypeConfig(): Promise<ArchetypeConfig> {
  return stressTestingConfigLoader.getArchetypeConfig();
}

export async function saveStressTestingConfig(config: Partial<StressTestingConfig>): Promise<void> {
  return stressTestingConfigLoader.saveConfig(config);
}

export async function saveStressTestingOverrides(overrides: Partial<StressTestingConfig>): Promise<void> {
  return stressTestingConfigLoader.saveOverrides(overrides);
}

export async function resetStressTestingConfig(): Promise<void> {
  return stressTestingConfigLoader.resetToDefaults();
}
