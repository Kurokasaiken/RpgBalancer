/**
 * STS Buff Calculator Engine
 * 
 * Core engine for STS buff calculations using weight-based creator pattern.
 * Integrates with shared buff library configuration and removes hardcoded values.
 */

import type {
  BuffDefinition,
  BuffCategory,
  BuffTargetType,
  BuffStacking,
  BuffTick,
  BuffLibraryConfig,
} from '../../../balancing/config/sts/buffLibrary';
import { BuffLibraryManager } from '../../../balancing/config/sts/buffLibrary';

/**
 * Active buff instance on a target
 */
export interface ActiveBuff {
  id: string;
  definition: BuffDefinition;
  targetId: string;
  sourceId: string;
  currentStacks: number;
  remainingDuration: number;
  appliedAt: number;
  lastTick: number;
  isActive: boolean;
}

/**
 * Buff calculation result
 */
export interface BuffCalculationResult {
  buffId: string;
  targetId: string;
  totalEffect: number;
  tickEffects: number[];
  durationRemaining: number;
  stacks: number;
  effectiveness: number;
  category: BuffCategory;
}

/**
 * Character stats for buff calculations
 */
export interface CharacterStats {
  hp: number;
  maxHp: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  defense: number;
  speed: number;
}

/**
 * Buff application context
 */
export interface BuffContext {
  source: CharacterStats;
  target: CharacterStats;
  environment: {
    turnNumber: number;
    inCombat: boolean;
    areaEffects: string[];
  };
  config: BuffLibraryConfig;
}

/**
 * STS Buff Calculator Engine
 * 
 * Core engine for calculating buff effects using weight-based creator pattern.
 * Replaces hardcoded values with configuration-driven calculations.
 */
export class BuffCalculator {
  private libraryManager: BuffLibraryManager;

  constructor(config?: BuffLibraryConfig) {
    this.libraryManager = new BuffLibraryManager(config);
  }

  /**
   * Update configuration
   */
  updateConfig(config: BuffLibraryConfig): void {
    this.libraryManager = new BuffLibraryManager(config);
  }

  /**
   * Apply a buff to a target
   */
  applyBuff(
    buffDefinition: BuffDefinition,
    targetId: string,
    sourceId: string,
    context: BuffContext
  ): ActiveBuff {
    const now = Date.now();
    
    const activeBuff: ActiveBuff = {
      id: `${buffDefinition.id}-${targetId}-${now}`,
      definition: buffDefinition,
      targetId,
      sourceId,
      currentStacks: 1,
      remainingDuration: buffDefinition.duration,
      appliedAt: now,
      lastTick: now,
      isActive: true,
    };

    return activeBuff;
  }

  /**
   * Calculate buff effects for a single tick
   */
  calculateBuffTick(
    activeBuff: ActiveBuff,
    context: BuffContext
  ): number {
    const { definition, currentStacks } = activeBuff;
    const { target } = context;
    
    let totalEffect = 0;

    for (const tick of definition.ticks) {
      const baseEffect = this.calculateBaseTickEffect(tick, definition.category, target);
      const stackMultiplier = this.calculateStackMultiplier(currentStacks, definition.stacking);
      const categoryMultiplier = this.getCategoryMultiplier(definition.category, context.config);
      
      const tickEffect = baseEffect * tick.weight * stackMultiplier * categoryMultiplier;
      totalEffect += tickEffect;
    }

    return Math.round(totalEffect * 100) / 100;
  }

  /**
   * Calculate all active buff effects for a target
   */
  calculateTargetEffects(
    activeBuffs: ActiveBuff[],
    targetId: string,
    context: BuffContext
  ): BuffCalculationResult[] {
    const targetBuffs = activeBuffs.filter(buff => buff.targetId === targetId && buff.isActive);
    const results: BuffCalculationResult[] = [];

    for (const activeBuff of targetBuffs) {
      const result = this.calculateBuffResult(activeBuff, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Calculate complete buff result
   */
  calculateBuffResult(activeBuff: ActiveBuff, context: BuffContext): BuffCalculationResult {
    const tickEffects: number[] = [];
    let totalEffect = 0;

    // Calculate effects for each remaining tick
    for (let i = 0; i < activeBuff.remainingDuration; i++) {
      const tickEffect = this.calculateBuffTick(activeBuff, context);
      tickEffects.push(tickEffect);
      totalEffect += tickEffect;
    }

    const effectiveness = this.libraryManager.calculateBuffEffectiveness(activeBuff.definition);

    return {
      buffId: activeBuff.definition.id,
      targetId: activeBuff.targetId,
      totalEffect,
      tickEffects,
      durationRemaining: activeBuff.remainingDuration,
      stacks: activeBuff.currentStacks,
      effectiveness,
      category: activeBuff.definition.category,
    };
  }

  /**
   * Process buff stacking
   */
  processBuffStacking(
    existingBuff: ActiveBuff | undefined,
    newBuff: BuffDefinition,
    targetId: string,
    sourceId: string,
    context: BuffContext
  ): ActiveBuff {
    if (!existingBuff) {
      return this.applyBuff(newBuff, targetId, sourceId, context);
    }

    const now = Date.now();
    const { stacking } = newBuff;

    switch (stacking) {
      case BuffStacking.NONE:
        // No stacking - replace existing
        return this.applyBuff(newBuff, targetId, sourceId, context);

      case BuffStacking.REPLACE:
        // Replace with new values
        return {
          ...existingBuff,
          definition: newBuff,
          appliedAt: now,
          lastTick: now,
          remainingDuration: newBuff.duration,
        };

      case BuffStacking.STACK:
        // Add stacks (up to max)
        const maxStacks = context.config.maxStacks;
        const newStacks = Math.min(existingBuff.currentStacks + 1, maxStacks);
        return {
          ...existingBuff,
          currentStacks: newStacks,
          lastTick: now,
        };

      case BuffStacking.DURATION:
        // Extend duration
        const newDuration = existingBuff.remainingDuration + newBuff.duration;
        return {
          ...existingBuff,
          remainingDuration: newDuration,
          lastTick: now,
        };

      default:
        return existingBuff;
    }
  }

  /**
   * Update active buffs (process duration, ticks, etc.)
   */
  updateActiveBuffs(
    activeBuffs: ActiveBuff[],
    context: BuffContext
  ): ActiveBuff[] {
    return activeBuffs.map(buff => {
      if (!buff.isActive) {
        return buff;
      }

      // Decrease duration
      const newDuration = Math.max(0, buff.remainingDuration - 1);
      
      // Deactivate if duration expired
      if (newDuration === 0) {
        return { ...buff, remainingDuration: 0, isActive: false };
      }

      return {
        ...buff,
        remainingDuration: newDuration,
        lastTick: Date.now(),
      };
    });
  }

  /**
   * Calculate base tick effect based on category and target stats
   */
  private calculateBaseTickEffect(
    tick: BuffTick,
    category: BuffCategory,
    target: CharacterStats
  ): number {
    const baseValue = tick.value;

    switch (category) {
      case BuffCategory.STRENGTH:
        return baseValue * (target.strength / 10);
      
      case BuffCategory.DEXTERITY:
        return baseValue * (target.dexterity / 10);
      
      case BuffCategory.INTELLIGENCE:
        return baseValue * (target.intelligence / 10);
      
      case BuffCategory.DEFENSE:
        return baseValue * (target.defense / 10);
      
      case BuffCategory.OFFENSE:
        return baseValue * ((target.strength + target.dexterity) / 20);
      
      case BuffCategory.UTILITY:
        return baseValue * 1.0; // Flat utility bonus
      
      case BuffCategory.DEBUFF:
        return baseValue * -1.0; // Negative effect
      
      case BuffCategory.SPECIAL:
        return baseValue * ((target.strength + target.dexterity + target.intelligence) / 30);
      
      default:
        return baseValue;
    }
  }

  /**
   * Calculate stacking multiplier
   */
  private calculateStackMultiplier(stacks: number, stacking: BuffStacking): number {
    switch (stacking) {
      case BuffStacking.STACK:
        return stacks;
      case BuffStacking.NONE:
      case BuffStacking.REPLACE:
      case BuffStacking.DURATION:
      default:
        return 1.0;
    }
  }

  /**
   * Get category multiplier from configuration
   */
  private getCategoryMultiplier(category: BuffCategory, config: BuffLibraryConfig): number {
    const categoryConfig = config.categories[category];
    return categoryConfig?.defaultWeight || 1.0;
  }

  /**
   * Validate buff application
   */
  validateBuffApplication(
    buff: BuffDefinition,
    target: CharacterStats,
    context: BuffContext
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if buff is valid
    const validation = this.libraryManager.validateBuff(buff);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    // Check target compatibility
    if (buff.targetType === BuffTargetType.SELF && context.source !== context.target) {
      errors.push('Buff can only be applied to self');
    }

    if (buff.targetType === BuffTargetType.ENEMY && context.source === context.target) {
      errors.push('Buff can only be applied to enemies');
    }

    // Check combat status
    const isCombatBuff = buff.tags.includes('combat-only');
    if (isCombatBuff && !context.environment.inCombat) {
      errors.push('Buff can only be applied in combat');
    }

    const isOutOfCombatBuff = buff.tags.includes('out-of-combat');
    if (isOutOfCombatBuff && context.environment.inCombat) {
      errors.push('Buff can only be applied out of combat');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get buff effectiveness summary
   */
  getBuffEffectivenessSummary(activeBuffs: ActiveBuff[], context: BuffContext): {
    totalEffectiveness: number;
    byCategory: Record<BuffCategory, number>;
    topBuffs: Array<{ buffId: string; effectiveness: number; category: BuffCategory }>;
  } {
    const results = activeBuffs
      .filter(buff => buff.isActive)
      .map(buff => this.calculateBuffResult(buff, context));

    const totalEffectiveness = results.reduce((sum, result) => sum + result.effectiveness, 0);

    const byCategory: Record<BuffCategory, number> = {} as any;
    for (const category of Object.values(BuffCategory)) {
      byCategory[category] = 0;
    }

    for (const result of results) {
      byCategory[result.category] += result.effectiveness;
    }

    const topBuffs = results
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5)
      .map(result => ({
        buffId: result.buffId,
        effectiveness: result.effectiveness,
        category: result.category,
      }));

    return {
      totalEffectiveness,
      byCategory,
      topBuffs,
    };
  }

  /**
   * Export buff calculation state
   */
  exportCalculationState(activeBuffs: ActiveBuff[], context: BuffContext): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      activeBuffs,
      context: {
        source: context.source,
        target: context.target,
        environment: context.environment,
      },
      configVersion: context.config.version,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import buff calculation state
   */
  importCalculationState(stateJson: string): {
    success: boolean;
    activeBuffs?: ActiveBuff[];
    context?: BuffContext;
    errors: string[];
  } {
    try {
      const data = JSON.parse(stateJson);
      
      // Validate structure
      if (!data.activeBuffs || !Array.isArray(data.activeBuffs)) {
        return { success: false, errors: ['Invalid activeBuffs data'] };
      }

      if (!data.context) {
        return { success: false, errors: ['Invalid context data'] };
      }

      return {
        success: true,
        activeBuffs: data.activeBuffs,
        context: data.context,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Invalid JSON format'],
      };
    }
  }
}
