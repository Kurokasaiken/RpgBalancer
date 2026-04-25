/**
 * Impact Module - Early/Late Game Impact Analysis
 * 
 * Calculates burst value and attrition value based on EDPT and window configuration.
 * This module helps balance early-game vs late-game effectiveness of stats and abilities.
 * 
 * @module ImpactModule
 * @since 2026-01-11
 * @author Cascade
 */

/**
 * Configuration for impact analysis windows
 */
export interface ImpactWindowConfig {
  /** Early game window (turns 1-3) */
  earlyWindow: number;
  /** Late game window (turns 7+) */
  lateWindow: number;
  /** Mid game window (turns 4-6) */
  midWindow: number;
}

/**
 * Impact analysis results
 */
export interface ImpactResults {
  /** Burst value (early game effectiveness) */
  burstValue: number;
  /** Attrition value (late game effectiveness) */
  attritionValue: number;
  /** Overall impact score */
  impactScore: number;
  /** Early/late ratio for balancing */
  earlyLateRatio: number;
}

/**
 * Default window configuration for 8-turn combat
 */
export const DEFAULT_IMPACT_WINDOW: ImpactWindowConfig = {
  earlyWindow: 3,  // Turns 1-3
  midWindow: 3,    // Turns 4-6
  lateWindow: 2,   // Turns 7-8
};

/**
 * Impact Module - Early/Late Game Impact Analysis
 * 
 * Provides calculations for burst damage, attrition value, and
 * early/late game balance analysis.
 */
export const ImpactModule = {
  /**
   * Calculates burst value based on EDPT and early game window
   * 
   * Formula: burstValue = edpt * earlyWindowMultiplier
   * 
   * @param edpt Expected damage per turn
   * @param windowConfig Window configuration for combat length
   * @returns Burst value (higher = better early game)
   */
  calculateBurstValue: (
    edpt: number,
    windowConfig: ImpactWindowConfig = DEFAULT_IMPACT_WINDOW
  ): number => {
    if (edpt <= 0) return 0;
    
    // Early game multiplier: more weight to first few turns
    const totalTurns = windowConfig.earlyWindow + windowConfig.midWindow + windowConfig.lateWindow;
    const earlyMultiplier = windowConfig.earlyWindow / totalTurns;
    
    return edpt * earlyMultiplier * 1.5; // 1.5x bonus for early impact
  },

  /**
   * Calculates attrition value based on EDPT and late game sustainability
   * 
   * Formula: attritionValue = edpt * lateWindowMultiplier * sustainFactor
   * 
   * @param edpt Expected damage per turn
   * @param sustainFactor Sustainability multiplier (0-2, where 1 = neutral)
   * @param windowConfig Window configuration for combat length
   * @returns Attrition value (higher = better late game)
   */
  calculateAttritionValue: (
    edpt: number,
    sustainFactor: number = 1.0,
    windowConfig: ImpactWindowConfig = DEFAULT_IMPACT_WINDOW
  ): number => {
    if (edpt <= 0) return 0;
    
    // Late game multiplier: weight to sustained performance
    const totalTurns = windowConfig.earlyWindow + windowConfig.midWindow + windowConfig.lateWindow;
    const lateMultiplier = windowConfig.lateWindow / totalTurns;
    
    return edpt * lateMultiplier * sustainFactor;
  },

  /**
   * Calculates overall impact score combining burst and attrition
   * 
   * Formula: impactScore = (burstValue * 0.6) + (attritionValue * 0.4)
   * 
   * @param burstValue Early game effectiveness
   * @param attritionValue Late game effectiveness
   * @returns Overall impact score (0-100 scale)
   */
  calculateImpactScore: (
    burstValue: number,
    attritionValue: number
  ): number => {
    // Weight towards early game (60%) but still value late game (40%)
    const weightedScore = (burstValue * 0.6) + (attritionValue * 0.4);
    
    // Normalize to 0-100 scale (assuming typical EDPT ranges)
    return Math.min(100, Math.max(0, weightedScore));
  },

  /**
   * Calculates early/late ratio for balance analysis
   * 
   * Formula: ratio = burstValue / attritionValue
   * 
   * @param burstValue Early game effectiveness
   * @param attritionValue Late game effectiveness
   * @returns Early/late ratio (>1 = early-focused, <1 = late-focused)
   */
  calculateEarlyLateRatio: (
    burstValue: number,
    attritionValue: number
  ): number => {
    if (attritionValue <= 0) return burstValue > 0 ? 999 : 1;
    return burstValue / attritionValue;
  },

  /**
   * Complete impact analysis
   * 
   * @param edpt Expected damage per turn
   * @param sustainFactor Sustainability multiplier
   * @param windowConfig Window configuration
   * @returns Complete impact analysis results
   */
  analyzeImpact: (
    edpt: number,
    sustainFactor: number = 1.0,
    windowConfig: ImpactWindowConfig = DEFAULT_IMPACT_WINDOW
  ): ImpactResults => {
    const burstValue = ImpactModule.calculateBurstValue(edpt, windowConfig);
    const attritionValue = ImpactModule.calculateAttritionValue(edpt, sustainFactor, windowConfig);
    const impactScore = ImpactModule.calculateImpactScore(burstValue, attritionValue);
    const earlyLateRatio = ImpactModule.calculateEarlyLateRatio(burstValue, attritionValue);

    return {
      burstValue,
      attritionValue,
      impactScore,
      earlyLateRatio,
    };
  },

  /**
   * Gets impact classification based on early/late ratio
   * 
   * @param earlyLateRatio Early/late ratio
   * @returns Impact classification string
   */
  getImpactClassification: (earlyLateRatio: number): string => {
    if (earlyLateRatio > 1.5) return 'burst-focused';
    if (earlyLateRatio > 1.1) return 'early-leaning';
    if (earlyLateRatio > 0.9) return 'balanced';
    if (earlyLateRatio > 0.6) return 'late-leaning';
    return 'attrition-focused';
  },
};
