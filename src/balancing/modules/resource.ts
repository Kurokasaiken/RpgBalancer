/**
 * Resource Module - Resource & Tempo Management
 * 
 * Calculates resource costs, mana efficiency, cooldown management, and tempo bonuses.
 * This module helps balance resource consumption vs effectiveness over time.
 * 
 * @module ResourceModule
 * @since 2026-01-11
 * @author Cascade
 */

/**
 * Resource configuration for different resource types
 */
export interface ResourceConfig {
  /** Maximum resource pool (e.g., mana) */
  maxPool: number;
  /** Resource regeneration per turn */
  regenPerTurn: number;
  /** Resource cost efficiency threshold */
  efficiencyThreshold: number;
}

/**
 * Tempo analysis results
 */
export interface TempoResults {
  /** Usable turns before resource exhaustion */
  usableTurns: number;
  /** Resource penalty for over-extension */
  resourcePenalty: number;
  /** Tempo bonus for efficient resource use */
  tempoBonus: number;
  /** Overall tempo score */
  tempoScore: number;
  /** Resource sustainability rating */
  sustainability: 'excellent' | 'good' | 'moderate' | 'poor' | 'exhausted';
}

/**
 * Default resource configurations
 */
export const DEFAULT_RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  mana: {
    maxPool: 100,
    regenPerTurn: 10,
    efficiencyThreshold: 0.8,
  },
  stamina: {
    maxPool: 50,
    regenPerTurn: 5,
    efficiencyThreshold: 0.7,
  },
  energy: {
    maxPool: 25,
    regenPerTurn: 3,
    efficiencyThreshold: 0.9,
  },
};

/**
 * Resource Module - Resource & Tempo Management
 * 
 * Provides calculations for resource efficiency, cooldown management,
 * and tempo analysis for balancing resource-dependent abilities.
 */
export const ResourceModule = {
  /**
   * Calculates usable turns before resource exhaustion
   * 
   * Formula: usableTurns = floor((maxPool + (regenPerTurn * targetTurns)) / costPerTurn)
   * 
   * @param costPerTurn Resource cost per turn
   * @param maxPool Maximum resource pool
   * @param regenPerTurn Resource regeneration per turn
   * @param targetTurns Target combat duration
   * @returns Number of turns before resource exhaustion
   */
  calculateUsableTurns: (
    costPerTurn: number,
    maxPool: number,
    regenPerTurn: number,
    targetTurns: number = 8
  ): number => {
    if (costPerTurn <= 0) return targetTurns;
    
    // Calculate total resource available over target turns
    const totalResource = maxPool + (regenPerTurn * (targetTurns - 1));
    
    // Calculate how many turns can be sustained
    const usableTurns = Math.floor(totalResource / costPerTurn);
    
    return Math.min(targetTurns, Math.max(0, usableTurns));
  },

  /**
   * Calculates resource penalty for over-extension
   * 
   * Formula: penalty = max(0, (costPerTurn - sustainableCost) / costPerTurn)
   * 
   * @param costPerTurn Resource cost per turn
   * @param maxPool Maximum resource pool
   * @param regenPerTurn Resource regeneration per turn
   * @param targetTurns Target combat duration
   * @returns Resource penalty (0-1, where 0 = no penalty)
   */
  calculateResourcePenalty: (
    costPerTurn: number,
    maxPool: number,
    regenPerTurn: number,
    targetTurns: number = 8
  ): number => {
    const usableTurns = ResourceModule.calculateUsableTurns(
      costPerTurn, maxPool, regenPerTurn, targetTurns
    );
    
    if (usableTurns >= targetTurns) return 0; // No penalty if fully sustainable
    
    // Penalty based on how many turns are lost
    const lostTurns = targetTurns - usableTurns;
    return lostTurns / targetTurns;
  },

  /**
   * Calculates tempo bonus for efficient resource use
   * 
   * Formula: tempoBonus = efficiency * sustainabilityMultiplier
   * 
   * @param costPerTurn Resource cost per turn
   * @param efficiency Resource efficiency (damage per resource point)
   * @param maxPool Maximum resource pool
   * @param regenPerTurn Resource regeneration per turn
   * @param targetTurns Target combat duration
   * @returns Tempo bonus (0-2, where 1 = neutral)
   */
  calculateTempoBonus: (
    costPerTurn: number,
    efficiency: number,
    maxPool: number,
    regenPerTurn: number,
    targetTurns: number = 8
  ): number => {
    const usableTurns = ResourceModule.calculateUsableTurns(
      costPerTurn, maxPool, regenPerTurn, targetTurns
    );
    
    const sustainabilityRatio = usableTurns / targetTurns;
    
    // Tempo bonus combines efficiency and sustainability
    return efficiency * sustainabilityRatio;
  },

  /**
   * Calculates overall tempo score
   * 
   * Formula: tempoScore = (tempoBonus * 0.7) - (resourcePenalty * 0.3)
   * 
   * @param tempoBonus Tempo bonus from efficient use
   * @param resourcePenalty Penalty from over-extension
   * @returns Overall tempo score (0-100)
   */
  calculateTempoScore: (
    tempoBonus: number,
    resourcePenalty: number
  ): number => {
    // Weight towards positive tempo (70%) but penalize over-extension (30%)
    const rawScore = (tempoBonus * 0.7) - (resourcePenalty * 0.3);
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, rawScore * 50));
  },

  /**
   * Determines resource sustainability rating
   * 
   * @param usableTurns Turns that can be sustained
   * @param targetTurns Target combat duration
   * @returns Sustainability rating
   */
  getSustainabilityRating: (
    usableTurns: number,
    targetTurns: number
  ): TempoResults['sustainability'] => {
    const ratio = usableTurns / targetTurns;
    
    if (ratio >= 0.95) return 'excellent';
    if (ratio >= 0.8) return 'good';
    if (ratio >= 0.6) return 'moderate';
    if (ratio >= 0.3) return 'poor';
    return 'exhausted';
  },

  /**
   * Complete tempo analysis
   * 
   * @param costPerTurn Resource cost per turn
   * @param efficiency Resource efficiency (damage per resource point)
   * @param resourceType Type of resource (mana, stamina, energy)
   * @param targetTurns Target combat duration
   * @returns Complete tempo analysis results
   */
  analyzeTempo: (
    costPerTurn: number,
    efficiency: number,
    resourceType: keyof typeof DEFAULT_RESOURCE_CONFIGS = 'mana',
    targetTurns: number = 8
  ): TempoResults => {
    const config = DEFAULT_RESOURCE_CONFIGS[resourceType];
    
    const usableTurns = ResourceModule.calculateUsableTurns(
      costPerTurn, config.maxPool, config.regenPerTurn, targetTurns
    );
    
    const resourcePenalty = ResourceModule.calculateResourcePenalty(
      costPerTurn, config.maxPool, config.regenPerTurn, targetTurns
    );
    
    const tempoBonus = ResourceModule.calculateTempoBonus(
      costPerTurn, efficiency, config.maxPool, config.regenPerTurn, targetTurns
    );
    
    const tempoScore = ResourceModule.calculateTempoScore(tempoBonus, resourcePenalty);
    const sustainability = ResourceModule.getSustainabilityRating(usableTurns, targetTurns);

    return {
      usableTurns,
      resourcePenalty,
      tempoBonus,
      tempoScore,
      sustainability,
    };
  },

  /**
   * Calculates resource efficiency threshold
   * 
   * @param resourceType Type of resource
   * @returns Efficiency threshold for the resource type
   */
  getEfficiencyThreshold: (resourceType: keyof typeof DEFAULT_RESOURCE_CONFIGS): number => {
    return DEFAULT_RESOURCE_CONFIGS[resourceType].efficiencyThreshold;
  },

  /**
   * Checks if resource usage is efficient
   * 
   * @param efficiency Current efficiency
   * @param resourceType Type of resource
   * @returns Whether usage is efficient
   */
  isEfficient: (
    efficiency: number,
    resourceType: keyof typeof DEFAULT_RESOURCE_CONFIGS = 'mana'
  ): boolean => {
    const threshold = ResourceModule.getEfficiencyThreshold(resourceType);
    return efficiency >= threshold;
  },
};
