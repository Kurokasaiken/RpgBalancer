/**
 * NP-032 – Idle Village Weather Impact Simulation
 * 
 * Weather impact calculation engine for success rate, fatigue,
 * and other game mechanics affected by weather conditions.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import {
  WeatherCondition,
  WeatherImpactConfig,
  WeatherImpactResult,
  WeatherSpecialEffect,
  WeatherSimulationState,
  WeatherSeverity,
  WeatherType,
  SeasonType,
  TimeOfDay,
  calculateWeatherImpactScore,
  getWeatherSeverityFromConditions,
} from '../types/weatherSimulation';

// Impact calculation types
export type ImpactCalculationType = 'linear' | 'exponential' | 'logarithmic' | 'custom';
export type ImpactTarget = 'resident' | 'building' | 'activity' | 'resource' | 'village';

// Impact calculation context
export interface ImpactCalculationContext {
  weatherCondition: WeatherCondition;
  targetId: string;
  targetType: ImpactTarget;
  baseValues: {
    successRate: number;
    fatigue: number;
    morale: number;
    productivity: number;
    movement: {
      speed: number;
      accuracy: number;
      energy: number;
    };
    resources: {
      consumption: number;
      generation: number;
      storage: number;
    };
  };
  modifiers: {
    equipment: number;
    skills: number;
    environment: number;
    buffs: number;
    debuffs: number;
  };
  metadata: {
    timestamp: number;
    calculationId: string;
    factors: string[];
  };
}

// Impact calculation result
export interface ImpactCalculationResult {
  id: string;
  timestamp: number;
  context: ImpactCalculationContext;
  impacts: {
    successRate: {
      original: number;
      modified: number;
      modifier: number;
      calculation: string;
      confidence: number;
    };
    fatigue: {
      original: number;
      modified: number;
      modifier: number;
      calculation: string;
      confidence: number;
    };
    morale: {
      original: number;
      modified: number;
      modifier: number;
      calculation: string;
      confidence: number;
    };
    productivity: {
      original: number;
      modified: number;
      modifier: number;
      calculation: string;
      confidence: number;
    };
    movement: {
      speed: {
        original: number;
        modified: number;
        modifier: number;
        calculation: string;
        confidence: number;
      };
      accuracy: {
        original: number;
        modified: number;
        modifier: number;
        calculation: string;
        confidence: number;
      };
      energy: {
        original: number;
        modified: number;
        modifier: number;
        calculation: string;
        confidence: number;
      };
    };
    resources: {
      consumption: {
        original: number;
        modified: number;
        modifier: number;
        calculation: string;
        confidence: number;
      };
      generation: {
        original: number;
        modified: number;
        modifier: number;
        calculation: string;
        confidence: number;
      };
      storage: {
        original: number;
        modified: number;
        modifier: number;
        calculation: string;
        confidence: number;
      };
    };
  };
  appliedEffects: string[];
  confidence: number;
  metadata: {
    calculationTime: number; // milliseconds
    factors: string[];
    accuracy: number;
    warnings: string[];
  };
}

// Weather Impact Engine
export class WeatherImpactEngine {
  private configs: Map<string, WeatherImpactConfig> = new Map();
  private cache: Map<string, ImpactCalculationResult> = new Map();
  private statistics: {
    calculations: number;
    cacheHits: number;
    errors: number;
    averageCalculationTime: number;
  } = {
    calculations: 0,
    cacheHits: 0,
    errors: 0,
    averageCalculationTime: 0,
  };

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default weather impact configurations
   */
  private initializeDefaultConfigs(): void {
    // Clear weather impact
    this.addConfig({
      id: 'clear-weather',
      name: 'Clear Weather Impact',
      description: 'Impact of clear weather conditions',
      enabled: true,
      priority: 1,
      conditions: {
        weatherTypes: ['clear'],
        severities: ['mild', 'moderate'],
        seasons: ['spring', 'summer', 'autumn'],
        timesOfDay: ['morning', 'noon', 'afternoon'],
        temperatureRanges: [
          { min: 15, max: 30 },
        ],
      },
      impacts: {
        successRate: {
          modifier: 0.1,
          calculation: 'linear',
          thresholds: {
            excellent: 95,
            good: 80,
            fair: 60,
            poor: 40,
            terrible: 20,
          },
        },
        fatigue: {
          modifier: -0.05,
          accumulation: 0.9,
          recovery: 1.1,
          calculation: 'linear',
        },
        movement: {
          speed: 1.05,
          accuracy: 1.02,
          energy: 0.95,
        },
        morale: {
          modifier: 0.05,
          decay: 0.9,
          recovery: 1.1,
        },
        productivity: {
          modifier: 0.1,
          quality: 0.05,
          efficiency: 0.08,
        },
        resources: {
          consumption: 0.95,
          generation: 1.05,
          storage: 1.0,
        },
      },
      specialEffects: [
        {
          id: 'clear-visibility',
          name: 'Clear Visibility',
          type: 'visual',
          trigger: {
            conditions: { type: 'clear' },
            probability: 1.0,
            cooldown: 0,
          },
          effect: {
            type: 'persistent',
            magnitude: 0.8,
            target: 'all',
            action: 'improve_visibility',
          },
          visual: {
            color: '#87CEEB',
            animation: 'clear',
          },
        },
      ],
      dependencies: [],
      metadata: {
        version: '1.0.0',
        tags: ['clear', 'positive', 'visibility'],
        category: 'positive',
      },
    });

    // Rainy weather impact
    this.addConfig({
      id: 'rainy-weather',
      name: 'Rainy Weather Impact',
      description: 'Impact of rainy weather conditions',
      enabled: true,
      priority: 2,
      conditions: {
        weatherTypes: ['rainy'],
        severities: ['mild', 'moderate', 'severe'],
        seasons: ['spring', 'summer', 'autumn'],
        timesOfDay: ['dawn', 'morning', 'afternoon', 'evening'],
        temperatureRanges: [
          { min: 5, max: 25 },
        ],
      },
      impacts: {
        successRate: {
          modifier: -0.15,
          calculation: 'linear',
          thresholds: {
            excellent: 85,
            good: 70,
            fair: 50,
            poor: 30,
            terrible: 10,
          },
        },
        fatigue: {
          modifier: 0.1,
          accumulation: 1.2,
          recovery: 0.8,
          calculation: 'linear',
        },
        movement: {
          speed: 0.85,
          accuracy: 0.9,
          energy: 1.15,
        },
        morale: {
          modifier: -0.05,
          decay: 1.1,
          recovery: 0.9,
        },
        productivity: {
          modifier: -0.1,
          quality: -0.05,
          efficiency: -0.15,
        },
        resources: {
          consumption: 1.1,
          generation: 0.9,
          storage: 0.95,
        },
      },
      specialEffects: [
        {
          id: 'wet-conditions',
          name: 'Wet Conditions',
          type: 'mechanical',
          trigger: {
            conditions: { type: 'rainy' },
            probability: 0.8,
            cooldown: 30,
          },
          effect: {
            type: 'duration',
            duration: 60,
            magnitude: 0.6,
            target: 'residents',
            action: 'reduce_movement_speed',
          },
          visual: {
            color: '#4682B4',
            animation: 'rain',
          },
        },
      ],
      dependencies: [],
      metadata: {
        version: '1.0.0',
        tags: ['rainy', 'negative', 'wet'],
        category: 'negative',
      },
    });

    // Stormy weather impact
    this.addConfig({
      id: 'stormy-weather',
      name: 'Stormy Weather Impact',
      description: 'Impact of stormy weather conditions',
      enabled: true,
      priority: 3,
      conditions: {
        weatherTypes: ['stormy'],
        severities: ['severe', 'extreme'],
        seasons: ['spring', 'summer', 'autumn'],
        timesOfDay: ['afternoon', 'evening', 'night'],
        temperatureRanges: [
          { min: 0, max: 35 },
        ],
      },
      impacts: {
        successRate: {
          modifier: -0.35,
          calculation: 'exponential',
          thresholds: {
            excellent: 70,
            good: 50,
            fair: 30,
            poor: 15,
            terrible: 5,
          },
        },
        fatigue: {
          modifier: 0.25,
          accumulation: 1.5,
          recovery: 0.5,
          calculation: 'exponential',
        },
        movement: {
          speed: 0.6,
          accuracy: 0.7,
          energy: 1.4,
        },
        morale: {
          modifier: -0.15,
          decay: 1.3,
          recovery: 0.7,
        },
        productivity: {
          modifier: -0.25,
          quality: -0.2,
          efficiency: -0.3,
        },
        resources: {
          consumption: 1.3,
          generation: 0.7,
          storage: 0.8,
        },
      },
      specialEffects: [
        {
          id: 'lightning-risk',
          name: 'Lightning Risk',
          type: 'mechanical',
          trigger: {
            conditions: { type: 'stormy', severity: 'severe' },
            probability: 0.3,
            cooldown: 60,
          },
          effect: {
            type: 'instant',
            magnitude: 0.9,
            target: 'buildings',
            action: 'damage_structures',
          },
          visual: {
            color: '#FFD700',
            animation: 'lightning',
          },
          audio: {
            sound: 'thunder',
            volume: 0.8,
            loop: false,
          },
        },
        {
          id: 'high-winds',
          name: 'High Winds',
          type: 'mechanical',
          trigger: {
            conditions: { type: 'stormy' },
            probability: 0.9,
            cooldown: 15,
          },
          effect: {
            type: 'duration',
            duration: 30,
            magnitude: 0.7,
            target: 'all',
            action: 'reduce_movement_accuracy',
          },
          visual: {
            color: '#2F4F4F',
            animation: 'wind',
          },
        },
      ],
      dependencies: [],
      metadata: {
        version: '1.0.0',
        tags: ['stormy', 'dangerous', 'extreme'],
        category: 'dangerous',
      },
    });

    // Snowy weather impact
    this.addConfig({
      id: 'snowy-weather',
      name: 'Snowy Weather Impact',
      description: 'Impact of snowy weather conditions',
      enabled: true,
      priority: 2,
      conditions: {
        weatherTypes: ['snowy'],
        severities: ['mild', 'moderate', 'severe'],
        seasons: ['winter'],
        timesOfDay: ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'],
        temperatureRanges: [
          { min: -20, max: 5 },
        ],
      },
      impacts: {
        successRate: {
          modifier: -0.2,
          calculation: 'linear',
          thresholds: {
            excellent: 80,
            good: 65,
            fair: 45,
            poor: 25,
            terrible: 10,
          },
        },
        fatigue: {
          modifier: 0.15,
          accumulation: 1.3,
          recovery: 0.7,
          calculation: 'linear',
        },
        movement: {
          speed: 0.7,
          accuracy: 0.85,
          energy: 1.25,
        },
        morale: {
          modifier: -0.1,
          decay: 1.2,
          recovery: 0.8,
        },
        productivity: {
          modifier: -0.15,
          quality: -0.1,
          efficiency: -0.2,
        },
        resources: {
          consumption: 1.2,
          generation: 0.8,
          storage: 0.9,
        },
      },
      specialEffects: [
        {
          id: 'cold-stress',
          name: 'Cold Stress',
          type: 'behavioral',
          trigger: {
            conditions: { type: 'snowy' },
            probability: 0.7,
            cooldown: 45,
          },
          effect: {
            type: 'duration',
            duration: 90,
            magnitude: 0.5,
            target: 'residents',
            action: 'increase_fatigue',
          },
          visual: {
            color: '#F0F8FF',
            animation: 'snow',
          },
        },
      ],
      dependencies: [],
      metadata: {
        version: '1.0.0',
        tags: ['snowy', 'cold', 'winter'],
        category: 'negative',
      },
    });

    // Extreme weather impact
    this.addConfig({
      id: 'extreme-weather',
      name: 'Extreme Weather Impact',
      description: 'Impact of extreme weather conditions',
      enabled: true,
      priority: 4,
      conditions: {
        weatherTypes: ['extreme'],
        severities: ['extreme'],
        seasons: ['winter', 'summer'],
        timesOfDay: ['dawn', 'night'],
        temperatureRanges: [
          { min: -40, max: -20 },
          { min: 40, max: 50 },
        ],
      },
      impacts: {
        successRate: {
          modifier: -0.5,
          calculation: 'exponential',
          thresholds: {
            excellent: 50,
            good: 30,
            fair: 15,
            poor: 5,
            terrible: 0,
          },
        },
        fatigue: {
          modifier: 0.4,
          accumulation: 2.0,
          recovery: 0.3,
          calculation: 'exponential',
        },
        movement: {
          speed: 0.4,
          accuracy: 0.5,
          energy: 1.8,
        },
        morale: {
          modifier: -0.3,
          decay: 1.5,
          recovery: 0.5,
        },
        productivity: {
          modifier: -0.4,
          quality: -0.35,
          efficiency: -0.45,
        },
        resources: {
          consumption: 1.5,
          generation: 0.5,
          storage: 0.6,
        },
      },
      specialEffects: [
        {
          id: 'survival-mode',
          name: 'Survival Mode',
          type: 'behavioral',
          trigger: {
            conditions: { type: 'extreme' },
            probability: 1.0,
            cooldown: 0,
          },
          effect: {
            type: 'persistent',
            magnitude: 1.0,
            target: 'all',
            action: 'activate_survival_protocols',
          },
          visual: {
            color: '#8B0000',
            animation: 'warning',
          },
          audio: {
            sound: 'alert',
            volume: 1.0,
            loop: true,
          },
        },
      ],
      dependencies: [],
      metadata: {
        version: '1.0.0',
        tags: ['extreme', 'dangerous', 'survival'],
        category: 'critical',
      },
    });
  }

  /**
   * Add weather impact configuration
   */
  addConfig(config: WeatherImpactConfig): void {
    this.configs.set(config.id, config);
  }

  /**
   * Remove weather impact configuration
   */
  removeConfig(id: string): boolean {
    return this.configs.delete(id);
  }

  /**
   * Get weather impact configuration
   */
  getConfig(id: string): WeatherImpactConfig | undefined {
    return this.configs.get(id);
  }

  /**
   * Get all weather impact configurations
   */
  getAllConfigs(): WeatherImpactConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get applicable configurations for weather condition
   */
  getApplicableConfigs(condition: WeatherCondition): WeatherImpactConfig[] {
    return Array.from(this.configs.values())
      .filter(config => config.enabled)
      .filter(config => this.isConfigApplicable(config, condition))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if configuration is applicable to weather condition
   */
  private isConfigApplicable(config: WeatherImpactConfig, condition: WeatherCondition): boolean {
    const matchesType = config.conditions.weatherTypes.includes(condition.type);
    const matchesSeverity = config.conditions.severities.includes(condition.severity);
    const matchesSeason = config.conditions.seasons.includes(condition.season);
    const matchesTimeOfDay = config.conditions.timesOfDay.includes(condition.timeOfDay);
    
    const matchesTempRange = config.conditions.temperatureRanges.some(range => 
      condition.temperature.current >= range.min && condition.temperature.current <= range.max
    );
    
    return matchesType && matchesSeverity && matchesSeason && matchesTimeOfDay && matchesTempRange;
  }

  /**
   * Calculate weather impact for target
   */
  calculateImpact(context: ImpactCalculationContext): ImpactCalculationResult {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(context);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      this.statistics.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          calculationTime: performance.now() - startTime,
        },
      };
    }

    try {
      const applicableConfigs = this.getApplicableConfigs(context.weatherCondition);
      
      if (applicableConfigs.length === 0) {
        // No applicable configs, return no impact
        const result = this.createNoImpactResult(context);
        this.cache.set(cacheKey, result);
        this.updateStatistics(startTime);
        return result;
      }

      // Calculate impacts using applicable configurations
      const impacts = this.calculateImpacts(context, applicableConfigs);
      const appliedEffects = this.getAppliedEffects(applicableConfigs);
      
      const result: ImpactCalculationResult = {
        id: context.metadata.calculationId,
        timestamp: context.metadata.timestamp,
        context,
        impacts,
        appliedEffects,
        confidence: this.calculateConfidence(context, applicableConfigs),
        metadata: {
          calculationTime: performance.now() - startTime,
          factors: this.getCalculationFactors(context, applicableConfigs),
          accuracy: this.calculateAccuracy(context, applicableConfigs),
          warnings: this.generateWarnings(context, applicableConfigs),
        },
      };

      this.cache.set(cacheKey, result);
      this.updateStatistics(startTime);
      
      return result;
    } catch (error) {
      this.statistics.errors++;
      throw error;
    }
  }

  /**
   * Calculate impacts for multiple targets
   */
  calculateMultipleImpacts(contexts: ImpactCalculationContext[]): ImpactCalculationResult[] {
    return contexts.map(context => this.calculateImpact(context));
  }

  /**
   * Create no impact result
   */
  private createNoImpactResult(context: ImpactCalculationContext): ImpactCalculationResult {
    const createNoImpact = (original: number) => ({
      original,
      modified: original,
      modifier: 0,
      calculation: 'no_applicable_config',
      confidence: 1.0,
    });

    return {
      id: context.metadata.calculationId,
      timestamp: context.metadata.timestamp,
      context,
      impacts: {
        successRate: createNoImpact(context.baseValues.successRate),
        fatigue: createNoImpact(context.baseValues.fatigue),
        morale: createNoImpact(context.baseValues.morale),
        productivity: createNoImpact(context.baseValues.productivity),
        movement: {
          speed: createNoImpact(context.baseValues.movement.speed),
          accuracy: createNoImpact(context.baseValues.movement.accuracy),
          energy: createNoImpact(context.baseValues.movement.energy),
        },
        resources: {
          consumption: createNoImpact(context.baseValues.resources.consumption),
          generation: createNoImpact(context.baseValues.resources.generation),
          storage: createNoImpact(context.baseValues.resources.storage),
        },
      },
      appliedEffects: [],
      confidence: 1.0,
      metadata: {
        calculationTime: 0,
        factors: ['no_applicable_config'],
        accuracy: 1.0,
        warnings: [],
      },
    };
  }

  /**
   * Calculate impacts using applicable configurations
   */
  private calculateImpacts(context: ImpactCalculationContext, configs: WeatherImpactConfig[]) {
    const baseValues = context.baseValues;
    const modifiers = context.modifiers;
    
    // Calculate combined impact score
    const impactScores = configs.map(config => 
      calculateWeatherImpactScore(context.weatherCondition, config)
    );
    const totalImpactScore = Math.min(impactScores.reduce((sum, score) => sum + score, 0), 1);
    
    // Calculate success rate impact
    const successRateImpact = this.calculateSuccessRateImpact(baseValues.successRate, configs, totalImpactScore);
    
    // Calculate fatigue impact
    const fatigueImpact = this.calculateFatigueImpact(baseValues.fatigue, configs, totalImpactScore);
    
    // Calculate morale impact
    const moraleImpact = this.calculateMoraleImpact(baseValues.morale, configs, totalImpactScore);
    
    // Calculate productivity impact
    const productivityImpact = this.calculateProductivityImpact(baseValues.productivity, configs, totalImpactScore);
    
    // Calculate movement impacts
    const movementImpacts = {
      speed: this.calculateMovementImpact(baseValues.movement.speed, configs, totalImpactScore, 'speed'),
      accuracy: this.calculateMovementImpact(baseValues.movement.accuracy, configs, totalImpactScore, 'accuracy'),
      energy: this.calculateMovementImpact(baseValues.movement.energy, configs, totalImpactScore, 'energy'),
    };
    
    // Calculate resource impacts
    const resourceImpacts = {
      consumption: this.calculateResourceImpact(baseValues.resources.consumption, configs, totalImpactScore, 'consumption'),
      generation: this.calculateResourceImpact(baseValues.resources.generation, configs, totalImpactScore, 'generation'),
      storage: this.calculateResourceImpact(baseValues.resources.storage, configs, totalImpactScore, 'storage'),
    };
    
    return {
      successRate: successRateImpact,
      fatigue: fatigueImpact,
      morale: moraleImpact,
      productivity: productivityImpact,
      movement: movementImpacts,
      resources: resourceImpacts,
    };
  }

  /**
   * Calculate success rate impact
   */
  private calculateSuccessRateImpact(baseValue: number, configs: WeatherImpactConfig[], impactScore: number) {
    const primaryConfig = configs[0];
    const config = primaryConfig.impacts.successRate;
    
    let modifier = config.modifier * impactScore;
    
    // Apply calculation method
    switch (config.calculation) {
      case 'linear':
        modifier = modifier;
        break;
      case 'exponential':
        modifier = Math.sign(modifier) * Math.pow(Math.abs(modifier), 1.5);
        break;
      case 'logarithmic':
        modifier = Math.sign(modifier) * Math.log1p(Math.abs(modifier));
        break;
      case 'custom':
        // Custom calculation could be implemented here
        modifier = modifier;
        break;
    }
    
    const modifiedValue = Math.max(0, Math.min(1, baseValue + modifier));
    
    return {
      original: baseValue,
      modified: modifiedValue,
      modifier,
      calculation: config.calculation,
      confidence: impactScore,
    };
  }

  /**
   * Calculate fatigue impact
   */
  private calculateFatigueImpact(baseValue: number, configs: WeatherImpactConfig[], impactScore: number) {
    const primaryConfig = configs[0];
    const config = primaryConfig.impacts.fatigue;
    
    let modifier = config.modifier * impactScore;
    
    // Apply calculation method
    switch (config.calculation) {
      case 'linear':
        modifier = modifier;
        break;
      case 'exponential':
        modifier = Math.sign(modifier) * Math.pow(Math.abs(modifier), 1.5);
        break;
      case 'logarithmic':
        modifier = Math.sign(modifier) * Math.log1p(Math.abs(modifier));
        break;
      case 'custom':
        modifier = modifier;
        break;
    }
    
    const modifiedValue = Math.max(0, Math.min(1, baseValue + modifier));
    
    return {
      original: baseValue,
      modified: modifiedValue,
      modifier,
      calculation: config.calculation,
      confidence: impactScore,
    };
  }

  /**
   * Calculate morale impact
   */
  private calculateMoraleImpact(baseValue: number, configs: WeatherImpactConfig[], impactScore: number) {
    const primaryConfig = configs[0];
    const config = primaryConfig.impacts.morale;
    
    const modifier = config.modifier * impactScore;
    const modifiedValue = Math.max(0, Math.min(1, baseValue + modifier));
    
    return {
      original: baseValue,
      modified: modifiedValue,
      modifier,
      calculation: 'linear',
      confidence: impactScore,
    };
  }

  /**
   * Calculate productivity impact
   */
  private calculateProductivityImpact(baseValue: number, configs: WeatherImpactConfig[], impactScore: number) {
    const primaryConfig = configs[0];
    const config = primaryConfig.impacts.productivity;
    
    const modifier = config.modifier * impactScore;
    const modifiedValue = Math.max(0, Math.min(1, baseValue + modifier));
    
    return {
      original: baseValue,
      modified: modifiedValue,
      modifier,
      calculation: 'linear',
      confidence: impactScore,
    };
  }

  /**
   * Calculate movement impact
   */
  private calculateMovementImpact(baseValue: number, configs: WeatherImpactConfig[], impactScore: number, type: 'speed' | 'accuracy' | 'energy') {
    const primaryConfig = configs[0];
    const movementConfig = primaryConfig.impacts.movement;
    
    let modifier = 0;
    switch (type) {
      case 'speed':
        modifier = (movementConfig.speed - 1) * impactScore;
        break;
      case 'accuracy':
        modifier = (movementConfig.accuracy - 1) * impactScore;
        break;
      case 'energy':
        modifier = (movementConfig.energy - 1) * impactScore;
        break;
    }
    
    const modifiedValue = Math.max(0, baseValue + modifier);
    
    return {
      original: baseValue,
      modified: modifiedValue,
      modifier,
      calculation: 'linear',
      confidence: impactScore,
    };
  }

  /**
   * Calculate resource impact
   */
  private calculateResourceImpact(baseValue: number, configs: WeatherImpactConfig[], impactScore: number, type: 'consumption' | 'generation' | 'storage') {
    const primaryConfig = configs[0];
    const resourceConfig = primaryConfig.impacts.resources;
    
    let modifier = 0;
    switch (type) {
      case 'consumption':
        modifier = (resourceConfig.consumption - 1) * impactScore;
        break;
      case 'generation':
        modifier = (resourceConfig.generation - 1) * impactScore;
        break;
      case 'storage':
        modifier = (resourceConfig.storage - 1) * impactScore;
        break;
    }
    
    const modifiedValue = Math.max(0, baseValue + modifier);
    
    return {
      original: baseValue,
      modified: modifiedValue,
      modifier,
      calculation: 'linear',
      confidence: impactScore,
    };
  }

  /**
   * Get applied effects from configurations
   */
  private getAppliedEffects(configs: WeatherImpactConfig[]): string[] {
    const effects: string[] = [];
    
    configs.forEach(config => {
      config.specialEffects.forEach(effect => {
        effects.push(effect.id);
      });
    });
    
    return effects;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(context: ImpactCalculationContext, configs: WeatherImpactConfig[]): number {
    if (configs.length === 0) return 1.0;
    
    let confidence = 0;
    configs.forEach(config => {
      const score = calculateWeatherImpactScore(context.weatherCondition, config);
      confidence += score;
    });
    
    return Math.min(confidence / configs.length, 1);
  }

  /**
   * Calculate accuracy score
   */
  private calculateAccuracy(context: ImpactCalculationContext, configs: WeatherImpactConfig[]): number {
    // Base accuracy on number of applicable configs and their specificity
    const configCount = configs.length;
    const specificity = configs.reduce((sum, config) => {
      let spec = 0;
      spec += config.conditions.weatherTypes.length;
      spec += config.conditions.severities.length;
      spec += config.conditions.seasons.length;
      spec += config.conditions.timesOfDay.length;
      spec += config.conditions.temperatureRanges.length;
      return sum + spec;
    }, 0);
    
    return Math.min((configCount * 0.3 + specificity * 0.7) / 20, 1);
  }

  /**
   * Get calculation factors
   */
  private getCalculationFactors(context: ImpactCalculationContext, configs: WeatherImpactConfig[]): string[] {
    const factors: string[] = [];
    
    factors.push(`weather_type:${context.weatherCondition.type}`);
    factors.push(`severity:${context.weatherCondition.severity}`);
    factors.push(`season:${context.weatherCondition.season}`);
    factors.push(`time_of_day:${context.weatherCondition.timeOfDay}`);
    factors.push(`temperature:${context.weatherCondition.temperature.current}`);
    factors.push(`wind_speed:${context.weatherCondition.wind.speed}`);
    factors.push(`humidity:${context.weatherCondition.humidity.current}`);
    
    configs.forEach(config => {
      factors.push(`config:${config.id}`);
    });
    
    return factors;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(context: ImpactCalculationContext, configs: WeatherImpactConfig[]): string[] {
    const warnings: string[] = [];
    
    // Check for extreme conditions
    if (context.weatherCondition.severity === 'extreme') {
      warnings.push('extreme_weather_conditions');
    }
    
    // Check for multiple applicable configs
    if (configs.length > 1) {
      warnings.push('multiple_applicable_configs');
    }
    
    // Check for low confidence
    const confidence = this.calculateConfidence(context, configs);
    if (confidence < 0.5) {
      warnings.push('low_confidence_calculation');
    }
    
    return warnings;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(context: ImpactCalculationContext): string {
    const key = [
      context.weatherCondition.id,
      context.targetId,
      context.targetType,
      JSON.stringify(context.baseValues),
      JSON.stringify(context.modifiers),
      context.metadata.timestamp,
    ].join('|');
    
    return btoa(key);
  }

  /**
   * Update statistics
   */
  private updateStatistics(startTime: number): void {
    const calculationTime = performance.now() - startTime;
    
    this.statistics.calculations++;
    this.statistics.averageCalculationTime = 
      (this.statistics.averageCalculationTime * (this.statistics.calculations - 1) + calculationTime) / 
      this.statistics.calculations;
  }

  /**
   * Get engine statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.cache.size,
      configCount: this.configs.size,
      cacheHitRate: this.statistics.calculations > 0 ? this.statistics.cacheHits / this.statistics.calculations : 0,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      calculations: 0,
      cacheHits: 0,
      errors: 0,
      averageCalculationTime: 0,
    };
  }

  /**
   * Export configurations
   */
  exportConfigs(): Record<string, WeatherImpactConfig> {
    const exported: Record<string, WeatherImpactConfig> = {};
    this.configs.forEach((config, id) => {
      exported[id] = config;
    });
    return exported;
  }

  /**
   * Import configurations
   */
  importConfigs(configs: Record<string, WeatherImpactConfig>): void {
    Object.entries(configs).forEach(([id, config]) => {
      this.configs.set(id, config);
    });
  }
}
