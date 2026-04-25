/**
 * AoE & DOT Module - Area of Effect & Damage Over Time
 * 
 * Calculates distribution multipliers for AoE attacks, DOT effectiveness,
 * and multi-hit damage distribution.
 * 
 * @module AoEDotModule
 * @since 2026-01-11
 * @author Cascade
 */

/**
 * AoE configuration parameters
 */
export interface AoEConfig {
  /** Number of targets affected */
  aoeTargets: number;
  /** Efficiency coefficient (0-1, where 1 = no penalty) */
  eco: number;
  /** Damage distribution pattern */
  distributionPattern: 'equal' | 'primary-secondary' | 'falloff';
  /** Primary target damage bonus (for primary-secondary pattern) */
  primaryBonus: number;
}

/**
 * DOT configuration parameters
 */
export interface DOTConfig {
  /** Duration in turns */
  duration: number;
  /** Damage per tick */
  tickDamage: number;
  /** Tick interval (turns) */
  tickInterval: number;
  /** Stacking behavior */
  stacking: 'none' | 'refresh' | 'stack';
  /** Maximum stacks */
  maxStacks: number;
}

/**
 * Multi-hit configuration
 */
export interface MultiHitConfig {
  /** Number of hits */
  hitCount: number;
  /** Damage per hit */
  damagePerHit: number;
  /** Hit chance per hit */
  hitChancePerHit: number;
  /** Critical chance per hit */
  critChancePerHit: number;
}

/**
 * AoE & DOT analysis results
 */
export interface AoEDotResults {
  /** Distribution multiplier for damage calculation */
  distributionMultiplier: number;
  /** Effective DOT EDPT */
  dotEdpt: number;
  /** Total damage over DOT duration */
  totalDotDamage: number;
  /** Multi-hit expected damage */
  multiHitExpectedDamage: number;
  /** Overall effectiveness rating */
  effectivenessRating: 'poor' | 'fair' | 'good' | 'excellent';
}

/**
 * Default AoE configurations
 */
export const DEFAULT_AOE_CONFIGS: Record<string, AoEConfig> = {
  single: {
    aoeTargets: 1,
    eco: 1.0,
    distributionPattern: 'equal',
    primaryBonus: 0,
  },
  small: {
    aoeTargets: 3,
    eco: 0.8,
    distributionPattern: 'primary-secondary',
    primaryBonus: 1.2,
  },
  medium: {
    aoeTargets: 5,
    eco: 0.6,
    distributionPattern: 'falloff',
    primaryBonus: 1.0,
  },
  large: {
    aoeTargets: 8,
    eco: 0.4,
    distributionPattern: 'falloff',
    primaryBonus: 1.0,
  },
};

/**
 * Default DOT configurations
 */
export const DEFAULT_DOT_CONFIGS: Record<string, DOTConfig> = {
  poison: {
    duration: 5,
    tickDamage: 10,
    tickInterval: 1,
    stacking: 'stack',
    maxStacks: 3,
  },
  burn: {
    duration: 3,
    tickDamage: 15,
    tickInterval: 1,
    stacking: 'refresh',
    maxStacks: 1,
  },
  bleed: {
    duration: 4,
    tickDamage: 8,
    tickInterval: 1,
    stacking: 'stack',
    maxStacks: 5,
  },
};

/**
 * AoE & DOT Module - Area of Effect & Damage Over Time
 * 
 * Provides calculations for AoE damage distribution, DOT effectiveness,
 * and multi-hit damage patterns.
 */
export const AoEDotModule = {
  /**
   * Calculates distribution multiplier for AoE attacks
   * 
   * Formula: distributionMultiplier = aoeTargets * eco * patternMultiplier
   * 
   * @param baseDamage Base damage before AoE scaling
   * @param config AoE configuration
   * @returns Distribution multiplier
   */
  calculateDistributionMultiplier: (
    baseDamage: number,
    config: AoEConfig
  ): number => {
    if (baseDamage <= 0 || config.aoeTargets <= 0) return 0;

    const targetMultiplier = config.aoeTargets;
    const efficiencyMultiplier = config.eco;
    
    // Pattern-specific multipliers
    let patternMultiplier = 1.0;
    switch (config.distributionPattern) {
      case 'primary-secondary':
        // Primary gets bonus, secondary gets reduced
        patternMultiplier = (config.primaryBonus + (config.aoeTargets - 1) * 0.8) / config.aoeTargets;
        break;
      case 'falloff':
        // Damage decreases with distance from center
        patternMultiplier = 0.7; // Average falloff
        break;
      case 'equal':
      default:
        // All targets get equal damage
        patternMultiplier = 1.0;
        break;
    }

    return targetMultiplier * efficiencyMultiplier * patternMultiplier;
  },

  /**
   * Calculates effective DOT EDPT (Expected Damage Per Turn)
   * 
   * Formula: dotEdpt = (tickDamage * duration / tickInterval) * stackingMultiplier
   * 
   * @param config DOT configuration
   * @returns Effective DOT EDPT
   */
  calculateDotEdpt: (config: DOTConfig): number => {
    if (config.tickDamage <= 0 || config.duration <= 0) return 0;

    const totalTicks = Math.floor(config.duration / config.tickInterval);
    const baseDotDamage = config.tickDamage * totalTicks;

    // Stacking multipliers
    let stackingMultiplier = 1.0;
    switch (config.stacking) {
      case 'stack':
        // Damage stacks up to maxStacks
        stackingMultiplier = Math.min(config.maxStacks, totalTicks);
        break;
      case 'refresh':
        // Duration refreshes, but damage doesn't stack
        stackingMultiplier = 1.0;
        break;
      case 'none':
      default:
        // No stacking effect
        stackingMultiplier = 1.0;
        break;
    }

    return baseDotDamage * stackingMultiplier;
  },

  /**
   * Calculates total damage over DOT duration
   * 
   * Formula: totalDamage = dotEdpt * duration
   * 
   * @param config DOT configuration
   * @returns Total DOT damage
   */
  calculateTotalDotDamage: (config: DOTConfig): number => {
    const dotEdpt = AoEDotModule.calculateDotEdpt(config);
    return dotEdpt * config.duration;
  },

  /**
   * Calculates expected damage for multi-hit attacks
   * 
   * Formula: expectedDamage = hitCount * damagePerHit * hitChance * (1 + critChance * critMultiplier)
   * 
   * @param config Multi-hit configuration
   * @param critMultiplier Critical damage multiplier (default 2.0)
   * @returns Expected damage
   */
  calculateMultiHitExpectedDamage: (
    config: MultiHitConfig,
    critMultiplier: number = 2.0
  ): number => {
    if (config.damagePerHit <= 0 || config.hitCount <= 0) return 0;

    const hitProbability = config.hitChancePerHit / 100;
    const critProbability = config.critChancePerHit / 100;
    
    // Expected damage per hit
    const expectedDamagePerHit = config.damagePerHit * hitProbability * 
      (1 + critProbability * (critMultiplier - 1));

    return config.hitCount * expectedDamagePerHit;
  },

  /**
   * Determines effectiveness rating based on damage output
   * 
   * @param damageOutput Total damage output
   * @param baseDamage Base damage for comparison
   * @returns Effectiveness rating
   */
  getEffectivenessRating: (
    damageOutput: number,
    baseDamage: number
  ): AoEDotResults['effectivenessRating'] => {
    if (baseDamage <= 0) return 'poor';
    
    const ratio = damageOutput / baseDamage;
    
    if (ratio >= 2.0) return 'excellent';
    if (ratio >= 1.5) return 'good';
    if (ratio >= 1.0) return 'fair';
    return 'poor';
  },

  /**
   * Complete AoE & DOT analysis
   * 
   * @param baseDamage Base damage before scaling
   * @param aoeConfig AoE configuration
   * @param dotConfig DOT configuration
   * @param multiHitConfig Multi-hit configuration
   * @returns Complete analysis results
   */
  analyzeAoEDot: (
    baseDamage: number,
    aoeConfig: AoEConfig,
    dotConfig: DOTConfig,
    multiHitConfig: MultiHitConfig
  ): AoEDotResults => {
    const distributionMultiplier = AoEDotModule.calculateDistributionMultiplier(baseDamage, aoeConfig);
    const dotEdpt = AoEDotModule.calculateDotEdpt(dotConfig);
    const totalDotDamage = AoEDotModule.calculateTotalDotDamage(dotConfig);
    const multiHitExpectedDamage = AoEDotModule.calculateMultiHitExpectedDamage(multiHitConfig);
    
    // Calculate total damage output
    const totalDamage = (baseDamage * distributionMultiplier) + totalDotDamage + multiHitExpectedDamage;
    const effectivenessRating = AoEDotModule.getEffectivenessRating(totalDamage, baseDamage);

    return {
      distributionMultiplier,
      dotEdpt,
      totalDotDamage,
      multiHitExpectedDamage,
      effectivenessRating,
    };
  },

  /**
   * Gets predefined AoE configuration
   * 
   * @param configType Type of AoE configuration
   * @returns AoE configuration
   */
  getAoEConfig: (configType: keyof typeof DEFAULT_AOE_CONFIGS): AoEConfig => {
    return DEFAULT_AOE_CONFIGS[configType];
  },

  /**
   * Gets predefined DOT configuration
   * 
   * @param configType Type of DOT configuration
   * @returns DOT configuration
   */
  getDOTConfig: (configType: keyof typeof DEFAULT_DOT_CONFIGS): DOTConfig => {
    return DEFAULT_DOT_CONFIGS[configType];
  },

  /**
   * Calculates optimal target count for maximum efficiency
   * 
   * @param baseDamage Base damage
   * @param eco Efficiency coefficient
   * @returns Optimal target count
   */
  calculateOptimalTargetCount: (
    baseDamage: number,
    eco: number
  ): number => {
    // Find the point where adding more targets becomes inefficient
    let optimalTargets = 1;
    let maxEfficiency = baseDamage;

    for (let targets = 2; targets <= 10; targets++) {
      const efficiency = baseDamage * targets * Math.pow(eco, targets - 1);
      if (efficiency > maxEfficiency) {
        maxEfficiency = efficiency;
        optimalTargets = targets;
      }
    }

    return optimalTargets;
  },

  /**
   * Checks if DOT is worth using based on duration and damage
   * 
   * @param config DOT configuration
   * @param targetTTK Target time to kill in turns
   * @returns Whether DOT is worth using
   */
  isDotWorthUsing: (config: DOTConfig, targetTTK: number): boolean => {
    const totalDotDamage = AoEDotModule.calculateTotalDotDamage(config);
    const dotEdpt = AoEDotModule.calculateDotEdpt(config);
    
    // DOT is worth it if it deals significant damage before target dies
    const effectiveTurns = Math.min(config.duration, targetTTK);
    const effectiveDamage = dotEdpt * effectiveTurns;
    
    return effectiveDamage >= totalDotDamage * 0.5; // At least 50% effectiveness
  },
};
