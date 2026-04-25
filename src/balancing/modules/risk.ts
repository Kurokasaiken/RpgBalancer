/**
 * Risk Module - Risk & Drawback Analysis
 * 
 * Calculates risk-adjusted effectiveness for abilities with drawbacks,
 * self-damage, miscast chances, or other negative effects.
 * 
 * @module RiskModule
 * @since 2026-01-11
 * @author Cascade
 */

/**
 * Risk configuration parameters
 */
export interface RiskConfig {
  /** Self-damage percentage (0-100) */
  selfDamagePercent: number;
  /** Miscast/chance to fail percentage (0-100) */
  miscastChance: number;
  /** Extra damage taken percentage (0-100) */
  extraDamageTakenPercent: number;
  /** Risk tolerance threshold (0-1) */
  riskTolerance: number;
}

/**
 * Risk analysis results
 */
export interface RiskResults {
  /** Risk-adjusted EDPT (Expected Damage Per Turn) */
  riskAdjustedEDPT: number;
  /** Net effectiveness after risk penalties */
  netEffectiveness: number;
  /** Risk level classification */
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  /** Risk-to-reward ratio */
  riskRewardRatio: number;
  /** Recommended usage scenarios */
  recommendedUsage: 'always' | 'situational' | 'desperate' | 'avoid';
}

/**
 * Default risk configurations for different ability types
 */
export const DEFAULT_RISK_CONFIGS: Record<string, RiskConfig> = {
  conservative: {
    selfDamagePercent: 0,
    miscastChance: 5,
    extraDamageTakenPercent: 0,
    riskTolerance: 0.2,
  },
  balanced: {
    selfDamagePercent: 10,
    miscastChance: 10,
    extraDamageTakenPercent: 5,
    riskTolerance: 0.5,
  },
  aggressive: {
    selfDamagePercent: 20,
    miscastChance: 15,
    extraDamageTakenPercent: 10,
    riskTolerance: 0.8,
  },
  reckless: {
    selfDamagePercent: 30,
    miscastChance: 25,
    extraDamageTakenPercent: 15,
    riskTolerance: 1.0,
  },
};

/**
 * Risk Module - Risk & Drawback Analysis
 * 
 * Provides calculations for risk-adjusted effectiveness, risk assessment,
 * and recommendations for abilities with drawbacks.
 */
export const RiskModule = {
  /**
   * Calculates risk-adjusted EDPT considering all risk factors
   * 
   * Formula: riskAdjustedEDPT = baseEDPT * (1 - selfDamagePenalty) * (1 - miscastPenalty) * (1 - extraDamagePenalty)
   * 
   * @param baseEDPT Base expected damage per turn
   * @param riskConfig Risk configuration
   * @returns Risk-adjusted EDPT
   */
  calculateRiskAdjustedEDPT: (
    baseEDPT: number,
    riskConfig: RiskConfig
  ): number => {
    if (baseEDPT <= 0) return 0;

    // Self-damage penalty: reduces net damage output
    const selfDamagePenalty = riskConfig.selfDamagePercent / 100;

    // Miscast penalty: chance of complete failure
    const miscastPenalty = riskConfig.miscastChance / 100;

    // Extra damage taken penalty: indirect effectiveness reduction
    const extraDamagePenalty = riskConfig.extraDamageTakenPercent / 100;

    // Apply all penalties multiplicatively
    const riskAdjustedEDPT = baseEDPT * 
      (1 - selfDamagePenalty) * 
      (1 - miscastPenalty) * 
      (1 - extraDamagePenalty);

    return Math.max(0, riskAdjustedEDPT);
  },

  /**
   * Calculates net effectiveness after risk penalties
   * 
   * Formula: netEffectiveness = riskAdjustedEDPT / baseEDPT
   * 
   * @param baseEDPT Base expected damage per turn
   * @param riskConfig Risk configuration
   * @returns Net effectiveness (0-1, where 1 = no penalty)
   */
  calculateNetEffectiveness: (
    baseEDPT: number,
    riskConfig: RiskConfig
  ): number => {
    if (baseEDPT <= 0) return 0;

    const riskAdjustedEDPT = RiskModule.calculateRiskAdjustedEDPT(baseEDPT, riskConfig);
    return riskAdjustedEDPT / baseEDPT;
  },

  /**
   * Determines risk level classification
   * 
   * @param netEffectiveness Net effectiveness after penalties
   * @param riskConfig Risk configuration
   * @returns Risk level classification
   */
  getRiskLevel: (
    netEffectiveness: number,
    riskConfig: RiskConfig
  ): RiskResults['riskLevel'] => {
    const totalRiskPenalty = 1 - netEffectiveness;
    
    if (totalRiskPenalty >= 0.5) return 'extreme';
    if (totalRiskPenalty >= 0.3) return 'high';
    if (totalRiskPenalty >= 0.15) return 'moderate';
    return 'low';
  },

  /**
   * Calculates risk-to-reward ratio
   * 
   * Formula: riskRewardRatio = (baseEDPT - riskAdjustedEDPT) / riskAdjustedEDPT
   * 
   * @param baseEDPT Base expected damage per turn
   * @param riskConfig Risk configuration
   * @returns Risk-to-reward ratio (lower is better)
   */
  calculateRiskRewardRatio: (
    baseEDPT: number,
    riskConfig: RiskConfig
  ): number => {
    if (baseEDPT <= 0) return 0;

    const riskAdjustedEDPT = RiskModule.calculateRiskAdjustedEDPT(baseEDPT, riskConfig);
    if (riskAdjustedEDPT <= 0) return Infinity; // Complete failure

    const riskCost = baseEDPT - riskAdjustedEDPT;
    return riskCost / riskAdjustedEDPT;
  },

  /**
   * Determines recommended usage based on risk analysis
   * 
   * @param riskLevel Risk level classification
   * @param riskRewardRatio Risk-to-reward ratio
   * @param riskConfig Risk configuration
   * @returns Recommended usage scenario
   */
  getRecommendedUsage: (
    riskLevel: RiskResults['riskLevel'],
    riskRewardRatio: number,
    riskConfig: RiskConfig
  ): RiskResults['recommendedUsage'] => {
    // Check if risk exceeds tolerance
    const totalRiskPenalty = (riskConfig.selfDamagePercent + riskConfig.miscastChance + riskConfig.extraDamageTakenPercent) / 300;
    const exceedsTolerance = totalRiskPenalty > riskConfig.riskTolerance;

    if (exceedsTolerance) {
      return riskLevel === 'extreme' ? 'avoid' : 'desperate';
    }

    if (riskRewardRatio > 1.0) {
      return 'avoid'; // Risk outweighs reward
    }

    if (riskRewardRatio > 0.5) {
      return 'situational';
    }

    return 'always';
  },

  /**
   * Complete risk analysis
   * 
   * @param baseEDPT Base expected damage per turn
   * @param riskConfig Risk configuration
   * @returns Complete risk analysis results
   */
  analyzeRisk: (
    baseEDPT: number,
    riskConfig: RiskConfig
  ): RiskResults => {
    const riskAdjustedEDPT = RiskModule.calculateRiskAdjustedEDPT(baseEDPT, riskConfig);
    const netEffectiveness = RiskModule.calculateNetEffectiveness(baseEDPT, riskConfig);
    const riskLevel = RiskModule.getRiskLevel(netEffectiveness, riskConfig);
    const riskRewardRatio = RiskModule.calculateRiskRewardRatio(baseEDPT, riskConfig);
    const recommendedUsage = RiskModule.getRecommendedUsage(riskLevel, riskRewardRatio, riskConfig);

    return {
      riskAdjustedEDPT,
      netEffectiveness,
      riskLevel,
      riskRewardRatio,
      recommendedUsage,
    };
  },

  /**
   * Gets predefined risk configuration
   * 
   * @param configType Type of risk configuration
   * @returns Risk configuration
   */
  getRiskConfig: (configType: keyof typeof DEFAULT_RISK_CONFIGS): RiskConfig => {
    return DEFAULT_RISK_CONFIGS[configType];
  },

  /**
   * Checks if risk is acceptable for given tolerance
   * 
   * @param netEffectiveness Net effectiveness after penalties
   * @param riskTolerance Risk tolerance threshold
   * @returns Whether risk is acceptable
   */
  isRiskAcceptable: (
    netEffectiveness: number,
    riskTolerance: number
  ): boolean => {
    const riskPenalty = 1 - netEffectiveness;
    return riskPenalty <= riskTolerance;
  },

  /**
   * Calculates optimal risk level for maximum effectiveness
   * 
   * @param baseEDPT Base expected damage per turn
   * @param riskTolerance Maximum acceptable risk
   * @returns Recommended risk configuration type
   */
  calculateOptimalRisk: (
    baseEDPT: number,
    riskTolerance: number
  ): keyof typeof DEFAULT_RISK_CONFIGS => {
    // Test each configuration in order of increasing risk
    const configs = ['conservative', 'balanced', 'aggressive', 'reckless'] as const;
    
    for (const configType of configs) {
      const config = DEFAULT_RISK_CONFIGS[configType];
      const analysis = RiskModule.analyzeRisk(baseEDPT, config);
      
      if (RiskModule.isRiskAcceptable(analysis.netEffectiveness, riskTolerance)) {
        return configType;
      }
    }
    
    return 'conservative'; // Fallback to safest option
  },
};
