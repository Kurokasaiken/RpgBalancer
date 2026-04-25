/**
 * Idle Village Fatigue Predictor Configuration
 * 
 * Configuration management system for fatigue predictor parameters.
 * Supports preset management, validation, and persistence.
 * 
 * @since NP-019
 */

import type { FatiguePredictorConfig } from './fatiguePredictor';

/**
 * Configuration preset definition
 */
export interface FatiguePredictorPreset {
  /** Preset identifier */
  id: string;
  /** Preset name */
  name: string;
  /** Preset description */
  description: string;
  /** Configuration values */
  config: FatiguePredictorConfig;
  /** Preset tags */
  tags: string[];
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Validated configuration */
  config?: FatiguePredictorConfig;
}

/**
 * Configuration manager for fatigue predictor
 */
export class FatiguePredictorConfigManager {
  private static readonly STORAGE_KEY = 'fatigue-predictor-configs';
  private static readonly DEFAULT_PRESETS: FatiguePredictorPreset[] = [
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Low risk tolerance with frequent rest recommendations',
      config: {
        algorithm: 'weighted',
        predictionHorizon: 50,
        historicalWindow: 300,
        confidenceThreshold: 0.8,
        riskThresholds: {
          low: 0.2,
          medium: 0.4,
          high: 0.6,
        },
        algorithmParameters: {
          linear: {
            recentWeight: 0.8,
            minDataPoints: 8,
          },
          exponential: {
            alpha: 0.2,
            beta: 0.05,
          },
          weighted: {
            decayFactor: 0.9,
            activityWeights: {
              'forest-work': 1.3,
              'mining': 1.6,
              'farming': 0.9,
              'crafting': 0.7,
              'guard-duty': 1.1,
              'research': 0.5,
              'teaching': 0.4,
              'healing': 0.6,
              'construction': 1.4,
              'hunting': 1.5,
            },
          },
          ml: {
            complexity: 'simple',
            iterations: 50,
            learningRate: 0.005,
          },
        },
        visualization: {
          sparklinePoints: 15,
          colorThresholds: {
            green: 0.2,
            yellow: 0.4,
            red: 0.6,
          },
        },
      },
      tags: ['conservative', 'safety'],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Moderate risk tolerance with standard recommendations',
      config: {
        algorithm: 'weighted',
        predictionHorizon: 100,
        historicalWindow: 500,
        confidenceThreshold: 0.7,
        riskThresholds: {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
        },
        algorithmParameters: {
          linear: {
            recentWeight: 0.7,
            minDataPoints: 5,
          },
          exponential: {
            alpha: 0.3,
            beta: 0.1,
          },
          weighted: {
            decayFactor: 0.95,
            activityWeights: {
              'forest-work': 1.2,
              'mining': 1.5,
              'farming': 0.8,
              'crafting': 0.6,
              'guard-duty': 1.0,
              'research': 0.4,
              'teaching': 0.3,
              'healing': 0.5,
              'construction': 1.3,
              'hunting': 1.4,
            },
          },
          ml: {
            complexity: 'simple',
            iterations: 100,
            learningRate: 0.01,
          },
        },
        visualization: {
          sparklinePoints: 20,
          colorThresholds: {
            green: 0.3,
            yellow: 0.6,
            red: 0.8,
          },
        },
      },
      tags: ['balanced', 'default'],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      description: 'High risk tolerance with minimal intervention',
      config: {
        algorithm: 'ml',
        predictionHorizon: 200,
        historicalWindow: 800,
        confidenceThreshold: 0.5,
        riskThresholds: {
          low: 0.5,
          medium: 0.7,
          high: 0.9,
        },
        algorithmParameters: {
          linear: {
            recentWeight: 0.6,
            minDataPoints: 3,
          },
          exponential: {
            alpha: 0.4,
            beta: 0.15,
          },
          weighted: {
            decayFactor: 0.98,
            activityWeights: {
              'forest-work': 1.1,
              'mining': 1.3,
              'farming': 0.7,
              'crafting': 0.5,
              'guard-duty': 0.9,
              'research': 0.3,
              'teaching': 0.2,
              'healing': 0.4,
              'construction': 1.2,
              'hunting': 1.3,
            },
          },
          ml: {
            complexity: 'medium',
            iterations: 200,
            learningRate: 0.02,
          },
        },
        visualization: {
          sparklinePoints: 25,
          colorThresholds: {
            green: 0.5,
            yellow: 0.7,
            red: 0.9,
          },
        },
      },
      tags: ['aggressive', 'performance'],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
  ];

  private presets: Map<string, FatiguePredictorPreset> = new Map();

  constructor() {
    this.loadPresets();
  }

  /**
   * Loads presets from storage
   */
  private async loadPresets(): Promise<void> {
    try {
      const stored = localStorage.getItem(FatiguePredictorConfigManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FatiguePredictorPreset[];
        parsed.forEach(preset => this.presets.set(preset.id, preset));
      }
    } catch (error) {
      console.warn('Failed to load fatigue predictor presets:', error);
    }

    // Load default presets if none exist
    if (this.presets.size === 0) {
      FatiguePredictorConfigManager.DEFAULT_PRESETS.forEach(preset => {
        this.presets.set(preset.id, preset);
      });
      await this.savePresets();
    }
  }

  /**
   * Saves presets to storage
   */
  private async savePresets(): Promise<void> {
    try {
      const presets = Array.from(this.presets.values());
      localStorage.setItem(
        FatiguePredictorConfigManager.STORAGE_KEY,
        JSON.stringify(presets)
      );
    } catch (error) {
      console.error('Failed to save fatigue predictor presets:', error);
    }
  }

  /**
   * Validates a configuration
   */
  public validateConfig(config: Partial<FatiguePredictorConfig>): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate algorithm
    if (config.algorithm && !['linear', 'exponential', 'weighted', 'ml'].includes(config.algorithm)) {
      errors.push('Invalid algorithm. Must be one of: linear, exponential, weighted, ml');
    }

    // Validate prediction horizon
    if (config.predictionHorizon !== undefined) {
      if (config.predictionHorizon <= 0) {
        errors.push('Prediction horizon must be positive');
      } else if (config.predictionHorizon > 1000) {
        warnings.push('Very large prediction horizon may reduce accuracy');
      }
    }

    // Validate historical window
    if (config.historicalWindow !== undefined) {
      if (config.historicalWindow <= 0) {
        errors.push('Historical window must be positive');
      } else if (config.historicalWindow < 10) {
        warnings.push('Small historical window may reduce prediction accuracy');
      }
    }

    // Validate confidence threshold
    if (config.confidenceThreshold !== undefined) {
      if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
        errors.push('Confidence threshold must be between 0 and 1');
      }
    }

    // Validate risk thresholds
    if (config.riskThresholds) {
      const { low, medium, high } = config.riskThresholds;
      if (low !== undefined && (low < 0 || low > 1)) {
        errors.push('Low risk threshold must be between 0 and 1');
      }
      if (medium !== undefined && (medium < 0 || medium > 1)) {
        errors.push('Medium risk threshold must be between 0 and 1');
      }
      if (high !== undefined && (high < 0 || high > 1)) {
        errors.push('High risk threshold must be between 0 and 1');
      }
      if (low !== undefined && medium !== undefined && low >= medium) {
        errors.push('Low risk threshold must be less than medium risk threshold');
      }
      if (medium !== undefined && high !== undefined && medium >= high) {
        errors.push('Medium risk threshold must be less than high risk threshold');
      }
    }

    // Validate algorithm parameters
    if (config.algorithmParameters) {
      // Linear parameters
      if (config.algorithmParameters.linear) {
        const { recentWeight, minDataPoints } = config.algorithmParameters.linear;
        if (recentWeight !== undefined && (recentWeight < 0 || recentWeight > 1)) {
          errors.push('Linear recent weight must be between 0 and 1');
        }
        if (minDataPoints !== undefined && minDataPoints < 1) {
          errors.push('Linear minimum data points must be at least 1');
        }
      }

      // Exponential parameters
      if (config.algorithmParameters.exponential) {
        const { alpha, beta } = config.algorithmParameters.exponential;
        if (alpha !== undefined && (alpha < 0 || alpha > 1)) {
          errors.push('Exponential alpha must be between 0 and 1');
        }
        if (beta !== undefined && (beta < 0 || beta > 1)) {
          errors.push('Exponential beta must be between 0 and 1');
        }
      }

      // Weighted parameters
      if (config.algorithmParameters.weighted) {
        const { decayFactor } = config.algorithmParameters.weighted;
        if (decayFactor !== undefined && (decayFactor < 0 || decayFactor > 1)) {
          errors.push('Weighted decay factor must be between 0 and 1');
        }
      }

      // ML parameters
      if (config.algorithmParameters.ml) {
        const { iterations, learningRate } = config.algorithmParameters.ml;
        if (iterations !== undefined && iterations < 1) {
          errors.push('ML iterations must be at least 1');
        }
        if (learningRate !== undefined && learningRate <= 0) {
          errors.push('ML learning rate must be positive');
        }
      }
    }

    // Validate visualization parameters
    if (config.visualization) {
      const { sparklinePoints, colorThresholds } = config.visualization;
      if (sparklinePoints !== undefined && sparklinePoints < 1) {
        errors.push('Sparkline points must be at least 1');
      }
      if (colorThresholds) {
        const { green, yellow, red } = colorThresholds;
        if (green !== undefined && (green < 0 || green > 1)) {
          errors.push('Green color threshold must be between 0 and 1');
        }
        if (yellow !== undefined && (yellow < 0 || yellow > 1)) {
          errors.push('Yellow color threshold must be between 0 and 1');
        }
        if (red !== undefined && (red < 0 || red > 1)) {
          errors.push('Red color threshold must be between 0 and 1');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Gets all presets
   */
  public getPresets(): FatiguePredictorPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Gets a preset by ID
   */
  public getPreset(id: string): FatiguePredictorPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * Creates a new preset
   */
  public async createPreset(
    id: string,
    name: string,
    description: string,
    config: FatiguePredictorConfig,
    tags: string[] = []
  ): Promise<FatiguePredictorPreset> {
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    const preset: FatiguePredictorPreset = {
      id,
      name,
      description,
      config,
      tags,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };

    this.presets.set(id, preset);
    await this.savePresets();
    return preset;
  }

  /**
   * Updates an existing preset
   */
  public async updatePreset(
    id: string,
    updates: Partial<Omit<FatiguePredictorPreset, 'id' | 'createdAt'>>
  ): Promise<FatiguePredictorPreset> {
    const existing = this.presets.get(id);
    if (!existing) {
      throw new Error(`Preset with ID '${id}' not found`);
    }

    if (updates.config) {
      const validation = this.validateConfig(updates.config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
    }

    const updated: FatiguePredictorPreset = {
      ...existing,
      ...updates,
      modifiedAt: Date.now(),
    };

    this.presets.set(id, updated);
    await this.savePresets();
    return updated;
  }

  /**
   * Deletes a preset
   */
  public async deletePreset(id: string): Promise<void> {
    if (!this.presets.has(id)) {
      throw new Error(`Preset with ID '${id}' not found`);
    }

    this.presets.delete(id);
    await this.savePresets();
  }

  /**
   * Duplicates a preset
   */
  public async duplicatePreset(id: string, newId: string, newName?: string): Promise<FatiguePredictorPreset> {
    const existing = this.presets.get(id);
    if (!existing) {
      throw new Error(`Preset with ID '${id}' not found`);
    }

    return this.createPreset(
      newId,
      newName || `${existing.name} (Copy)`,
      existing.description,
      existing.config,
      [...existing.tags]
    );
  }

  /**
   * Exports presets to JSON
   */
  public exportPresets(): string {
    const presets = this.getPresets();
    return JSON.stringify(presets, null, 2);
  }

  /**
   * Imports presets from JSON
   */
  public async importPresets(json: string): Promise<number> {
    try {
      const presets = JSON.parse(json) as FatiguePredictorPreset[];
      let imported = 0;

      for (const preset of presets) {
        const validation = this.validateConfig(preset.config);
        if (validation.isValid) {
          this.presets.set(preset.id, preset);
          imported++;
        } else {
          console.warn(`Skipping invalid preset '${preset.id}': ${validation.errors.join(', ')}`);
        }
      }

      if (imported > 0) {
        await this.savePresets();
      }

      return imported;
    } catch (error) {
      throw new Error(`Failed to import presets: ${error}`);
    }
  }

  /**
   * Resets to default presets
   */
  public async resetToDefaults(): Promise<void> {
    this.presets.clear();
    FatiguePredictorConfigManager.DEFAULT_PRESETS.forEach(preset => {
      this.presets.set(preset.id, preset);
    });
    await this.savePresets();
  }
}

export default FatiguePredictorConfigManager;
