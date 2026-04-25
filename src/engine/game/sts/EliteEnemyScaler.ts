/**
 * STS Elite Enemy Scaler - NP-138
 * 
 * Config-first scaler for elite enemy stats and abilities based on floor number,
 * ascension level, and player power. Uses polynomial/exponential scaling formulas
 * with balance checking to prevent unbeatable enemies.
 * 
 * @since 2026-01-23
 * @author Archmage-STS
 */

import type {
  EliteScalingConfig,
  ScalingCurve,
  ScalableStatType,
  PlayerPowerAssessment,
  ScaledEnemyStats,
  BalanceCheckResult,
} from '../../balancing/config/sts/eliteScalingConfig';
import {
  DEFAULT_ELITE_SCALING_CONFIG,
  getFloorMultiplier,
  getAscensionModifier,
  calculatePlayerPowerScore,
} from '../../balancing/config/sts/eliteScalingConfig';

/**
 * Base enemy stats interface
 */
export interface BaseEnemyStats {
  /** Enemy ID */
  id: string;
  /** Enemy name */
  name: string;
  /** Base HP */
  hp: number;
  /** Base max HP */
  maxHp: number;
  /** Base damage */
  damage: number;
  /** Base armor */
  armor: number;
  /** Base block */
  block: number;
  /** Base gold reward */
  gold: number;
  /** Base experience reward */
  experience: number;
  /** Base abilities */
  abilities: string[];
}

/**
 * Scaling context
 */
export interface ScalingContext {
  /** Current floor number */
  floor: number;
  /** Ascension level (0-20) */
  ascensionLevel: number;
  /** Player power assessment */
  playerPower?: PlayerPowerAssessment;
}

/**
 * Elite Enemy Scaler
 * 
 * Scales elite enemy stats using configurable polynomial/exponential formulas.
 */
export class EliteEnemyScaler {
  private config: EliteScalingConfig;
  private telemetryEvents: Array<{ type: string; data: any }>;

  constructor(config: Partial<EliteScalingConfig> = {}) {
    this.config = {
      ...DEFAULT_ELITE_SCALING_CONFIG,
      ...config,
    };
    this.telemetryEvents = [];
  }

  /**
   * Scale elite enemy stats based on context
   * 
   * @param baseStats - Base enemy stats
   * @param context - Scaling context (floor, ascension, player power)
   * @returns Scaled enemy stats with metadata
   */
  scaleEnemy(baseStats: BaseEnemyStats, context: ScalingContext): ScaledEnemyStats {
    // Get floor and ascension multipliers
    const floorMultiplier = getFloorMultiplier(context.floor, this.config.floorMultipliers);
    const ascensionModifier = getAscensionModifier(context.ascensionLevel, this.config.ascensionModifiers);

    // Calculate player power adjustment
    let playerPowerAdjustment = 1.0;
    if (this.config.playerPowerScaling.enabled && context.playerPower) {
      const powerScore = calculatePlayerPowerScore(context.playerPower);
      playerPowerAdjustment = this.calculatePlayerPowerAdjustment(powerScore);
    }

    // Scale each stat
    const scaledHp = this.scaleStat(
      'hp',
      baseStats.hp,
      context.floor,
      floorMultiplier.hpMultiplier,
      ascensionModifier.hpModifier,
      playerPowerAdjustment
    );

    const scaledDamage = this.scaleStat(
      'damage',
      baseStats.damage,
      context.floor,
      floorMultiplier.damageMultiplier,
      ascensionModifier.damageModifier,
      playerPowerAdjustment
    );

    const scaledArmor = this.scaleStat(
      'armor',
      baseStats.armor,
      context.floor,
      floorMultiplier.armorMultiplier,
      ascensionModifier.armorModifier,
      playerPowerAdjustment
    );

    const scaledBlock = this.scaleStat(
      'block',
      baseStats.block,
      context.floor,
      1.0, // Block uses default multiplier
      1.0,
      playerPowerAdjustment
    );

    const scaledGold = this.scaleStat(
      'gold',
      baseStats.gold,
      context.floor,
      floorMultiplier.goldMultiplier,
      1.0,
      1.0 // Gold not affected by player power
    );

    const scaledExperience = this.scaleStat(
      'experience',
      baseStats.experience,
      context.floor,
      1.0,
      1.0,
      1.0
    );

    // Determine active abilities
    const abilities = [
      ...baseStats.abilities,
      ...ascensionModifier.unlockedAbilities,
    ];

    // Calculate final difficulty
    const finalDifficulty = this.calculateDifficulty(
      scaledHp,
      scaledDamage,
      scaledArmor,
      baseStats.hp,
      baseStats.damage
    );

    // Build scaled stats
    const scaledStats: ScaledEnemyStats = {
      hp: Math.round(scaledHp),
      maxHp: Math.round(scaledHp),
      damage: Math.round(scaledDamage),
      armor: Math.round(scaledArmor),
      block: Math.round(scaledBlock),
      gold: Math.round(scaledGold),
      experience: Math.round(scaledExperience),
      abilities,
      metadata: {
        baseHp: baseStats.hp,
        baseDamage: baseStats.damage,
        floorMultiplier: floorMultiplier.hpMultiplier,
        ascensionMultiplier: ascensionModifier.hpModifier,
        playerPowerAdjustment,
        finalDifficulty,
      },
    };

    // Perform balance check
    if (this.config.balanceCheck.enabled) {
      const balanceResult = this.checkBalance(scaledStats, baseStats);
      if (!balanceResult.isBalanced) {
        console.warn('Elite enemy may be unbalanced:', balanceResult);
        
        if (this.config.telemetry.enabled && this.config.telemetry.trackWarnings) {
          this.trackEvent('elite_enemy_balance_warning', {
            enemyId: baseStats.id,
            warnings: balanceResult.warnings,
            errors: balanceResult.errors,
          });
        }
      }
    }

    // Track telemetry
    if (this.config.telemetry.enabled && this.config.telemetry.trackEvents) {
      this.trackEvent('elite_enemy_scaled', {
        enemyId: baseStats.id,
        floor: context.floor,
        ascensionLevel: context.ascensionLevel,
        scaledHp: scaledStats.hp,
        scaledDamage: scaledStats.damage,
        difficulty: finalDifficulty,
      });
    }

    return scaledStats;
  }

  /**
   * Scale a specific stat using configured curve
   */
  private scaleStat(
    statType: ScalableStatType,
    baseValue: number,
    floor: number,
    floorMultiplier: number,
    ascensionMultiplier: number,
    playerPowerAdjustment: number
  ): number {
    const curve = this.config.scalingCurves[statType];
    if (!curve) {
      return baseValue * floorMultiplier * ascensionMultiplier * playerPowerAdjustment;
    }

    // Apply scaling curve
    const curveValue = this.applyCurve(curve, floor);
    
    // Combine with multipliers
    const scaledValue = curveValue * floorMultiplier * ascensionMultiplier * playerPowerAdjustment;

    // Apply caps
    return Math.max(curve.minCap, Math.min(curve.maxCap, scaledValue));
  }

  /**
   * Apply scaling curve formula
   */
  private applyCurve(curve: ScalingCurve, floor: number): number {
    const { type, baseValue, coefficient, exponent } = curve;

    switch (type) {
      case 'linear':
        return baseValue + (coefficient * floor);

      case 'polynomial':
        return baseValue * Math.pow(coefficient * floor, exponent);

      case 'exponential':
        return baseValue * Math.pow(coefficient, floor * exponent);

      case 'logarithmic':
        return baseValue + (coefficient * Math.log(floor + 1) * exponent);

      case 'custom':
        // Custom formula would be evaluated here
        // For now, fallback to linear
        return baseValue + (coefficient * floor);

      default:
        return baseValue;
    }
  }

  /**
   * Calculate player power adjustment multiplier
   */
  private calculatePlayerPowerAdjustment(powerScore: number): number {
    const { weight, minPowerThreshold, maxPowerThreshold } = this.config.playerPowerScaling;

    // Normalize power score to adjustment range
    if (powerScore < minPowerThreshold) {
      // Player is weak, reduce difficulty
      return 1.0 - (weight * 0.3);
    } else if (powerScore > maxPowerThreshold) {
      // Player is strong, increase difficulty
      return 1.0 + (weight * 0.5);
    } else {
      // Player is average, no adjustment
      return 1.0;
    }
  }

  /**
   * Calculate difficulty rating
   */
  private calculateDifficulty(
    scaledHp: number,
    scaledDamage: number,
    scaledArmor: number,
    baseHp: number,
    baseDamage: number
  ): number {
    const hpRatio = scaledHp / baseHp;
    const damageRatio = scaledDamage / baseDamage;
    const armorBonus = scaledArmor / 10;

    const difficulty = (hpRatio * 0.4 + damageRatio * 0.4 + armorBonus * 0.2) * 50;

    return Math.max(0, Math.min(100, difficulty));
  }

  /**
   * Check if scaled enemy is balanced
   */
  checkBalance(scaledStats: ScaledEnemyStats, baseStats: BaseEnemyStats): BalanceCheckResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    const hpMultiplier = scaledStats.hp / baseStats.hp;
    const damageMultiplier = scaledStats.damage / baseStats.damage;

    // Check HP multiplier
    if (hpMultiplier > this.config.balanceCheck.maxHpMultiplier) {
      errors.push(`HP multiplier (${hpMultiplier.toFixed(2)}x) exceeds maximum (${this.config.balanceCheck.maxHpMultiplier}x)`);
    } else if (hpMultiplier > this.config.balanceCheck.maxHpMultiplier * 0.8) {
      warnings.push(`HP multiplier (${hpMultiplier.toFixed(2)}x) is very high`);
    }

    // Check damage multiplier
    if (damageMultiplier > this.config.balanceCheck.maxDamageMultiplier) {
      errors.push(`Damage multiplier (${damageMultiplier.toFixed(2)}x) exceeds maximum (${this.config.balanceCheck.maxDamageMultiplier}x)`);
    } else if (damageMultiplier > this.config.balanceCheck.maxDamageMultiplier * 0.8) {
      warnings.push(`Damage multiplier (${damageMultiplier.toFixed(2)}x) is very high`);
    }

    // Check difficulty rating
    const difficultyRating = scaledStats.metadata.finalDifficulty;
    if (difficultyRating > this.config.balanceCheck.maxDifficultyRating) {
      errors.push(`Difficulty rating (${difficultyRating.toFixed(1)}) exceeds maximum (${this.config.balanceCheck.maxDifficultyRating})`);
    } else if (difficultyRating > this.config.balanceCheck.maxDifficultyRating * 0.9) {
      warnings.push(`Difficulty rating (${difficultyRating.toFixed(1)}) is very high`);
    }

    // Estimate win rate
    const estimatedWinRate = this.estimateWinRate(scaledStats, baseStats);
    if (estimatedWinRate < this.config.balanceCheck.minWinRate) {
      errors.push(`Estimated win rate (${(estimatedWinRate * 100).toFixed(1)}%) is below minimum (${(this.config.balanceCheck.minWinRate * 100).toFixed(1)}%)`);
    } else if (estimatedWinRate < this.config.balanceCheck.minWinRate * 1.2) {
      warnings.push(`Estimated win rate (${(estimatedWinRate * 100).toFixed(1)}%) is low`);
    }

    const isBalanced = errors.length === 0;

    return {
      isBalanced,
      warnings,
      errors,
      difficultyRating,
      estimatedWinRate,
    };
  }

  /**
   * Estimate player win rate against scaled enemy
   */
  private estimateWinRate(scaledStats: ScaledEnemyStats, baseStats: BaseEnemyStats): number {
    // Simplified win rate estimation
    const hpFactor = Math.min(1, baseStats.hp / scaledStats.hp);
    const damageFactor = Math.min(1, baseStats.damage / scaledStats.damage);
    const armorPenalty = Math.max(0, 1 - (scaledStats.armor / 50));

    const winRate = (hpFactor * 0.4 + damageFactor * 0.4 + armorPenalty * 0.2);

    return Math.max(0, Math.min(1, winRate));
  }

  /**
   * Batch scale multiple enemies
   */
  batchScaleEnemies(
    enemies: BaseEnemyStats[],
    context: ScalingContext
  ): ScaledEnemyStats[] {
    return enemies.map(enemy => this.scaleEnemy(enemy, context));
  }

  /**
   * Get scaling preview for different floors
   */
  getScalingPreview(
    baseStats: BaseEnemyStats,
    ascensionLevel: number,
    floors: number[]
  ): Array<{ floor: number; stats: ScaledEnemyStats }> {
    return floors.map(floor => ({
      floor,
      stats: this.scaleEnemy(baseStats, { floor, ascensionLevel }),
    }));
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EliteScalingConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Get telemetry events
   */
  getTelemetryEvents(): Array<{ type: string; data: any }> {
    return [...this.telemetryEvents];
  }

  /**
   * Clear telemetry events
   */
  clearTelemetryEvents(): void {
    this.telemetryEvents = [];
  }

  /**
   * Track telemetry event
   */
  private trackEvent(type: string, data: any): void {
    this.telemetryEvents.push({ type, data });
  }
}

/**
 * Create elite enemy scaler instance
 */
export function createEliteEnemyScaler(
  config: Partial<EliteScalingConfig> = {}
): EliteEnemyScaler {
  return new EliteEnemyScaler(config);
}

/**
 * Scale elite enemy (convenience function)
 */
export function scaleEliteEnemy(
  baseStats: BaseEnemyStats,
  context: ScalingContext,
  config: Partial<EliteScalingConfig> = {}
): ScaledEnemyStats {
  const scaler = createEliteEnemyScaler(config);
  return scaler.scaleEnemy(baseStats, context);
}
