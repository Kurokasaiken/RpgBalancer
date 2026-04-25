/**
 * Idle Village Quest Reward Balancer
 * 
 * Weight-based calibration system for quest rewards with KPI tracking
 * and JSON export functionality. Implements configurable reward balancing
 * algorithms and comprehensive analytics.
 * 
 * @since NP-021
 */

import type { QuestDefinition, QuestResult, QuestEffect, QuestTelemetry } from '@/engine/quest/types';

/**
 * Reward type definitions for quest balancing
 */
export type RewardType = 
  | 'resources' 
  | 'experience' 
  | 'items' 
  | 'reputation' 
  | 'skills' 
  | 'special';

/**
 * Weight-based reward configuration
 */
export interface RewardWeight {
  type: RewardType;
  weight: number;
  baseValue: number;
  variance: number; // Random variance factor (0-1)
  scaling: {
    difficulty: number; // Difficulty scaling factor
    duration: number; // Duration scaling factor
    complexity: number; // Complexity scaling factor
  };
  constraints: {
    minValue: number;
    maxValue: number;
    cap?: number; // Global cap for this reward type
  };
}

/**
 * Quest difficulty assessment
 */
export interface QuestDifficulty {
  overall: number; // 0-1 overall difficulty
  combat: number; // Combat difficulty component
  stealth: number; // Stealth difficulty component
  social: number; // Social/dialogue difficulty component
  exploration: number; // Exploration difficulty component
  timePressure: number; // Time pressure component
  complexity: number; // Branching/choice complexity
}

/**
 * KPI metrics for reward balancing
 */
export interface QuestRewardKPI {
  questId: string;
  questType: string;
  difficulty: QuestDifficulty;
  estimatedDuration: number; // seconds
  participantCount: number;
  
  // Reward metrics
  totalRewardValue: number;
  rewardDistribution: Record<RewardType, number>;
  rewardEfficiency: number; // reward per minute
  riskRewardRatio: number; // risk vs reward balance
  
  // Performance metrics
  successRate: number;
  averageCompletionTime: number;
  playerSatisfactionScore: number;
  
  // Economic metrics
  resourceInflation: number; // Impact on game economy
  rarityScore: number; // How rare/rewarding this quest is
  repeatValue: number; // Value for repeated playthroughs
  
  // Balancing metrics
  balanceScore: number; // Overall balance quality (0-1)
  overpoweredIndex: number; // How overpowered rewards are (0-1)
  underpoweredIndex: number; // How underpowered rewards are (0-1)
}

/**
 * Reward balancing configuration
 */
export interface QuestRewardBalancerConfig {
  // Weight configuration
  rewardWeights: Record<RewardType, RewardWeight>;
  
  // Balancing parameters
  targetRewardEfficiency: number; // Target reward per minute
  maxRewardVariance: number; // Maximum variance from target
  difficultyScaling: boolean; // Enable difficulty-based scaling
  
  // KPI thresholds
  kpiThresholds: {
    minBalanceScore: number;
    maxOverpoweredIndex: number;
    maxUnderpoweredIndex: number;
    minSuccessRate: number;
    maxResourceInflation: number;
  };
  
  // Economic constraints
  economicConstraints: {
    maxTotalRewardsPerHour: number;
    maxRareRewardsPerHour: number;
    resourceSinkRatio: number; // Resources removed vs added
  };
  
  // Algorithm settings
  algorithmSettings: {
    iterations: number;
    convergenceThreshold: number;
    learningRate: number;
    useHistoricalData: boolean;
  };
}

/**
 * Reward calculation result
 */
export interface RewardCalculationResult {
  questId: string;
  originalRewards: QuestEffect[];
  balancedRewards: QuestEffect[];
  kpi: QuestRewardKPI;
  adjustments: Record<RewardType, number>; // Adjustment factors applied
  confidence: number; // Confidence in balancing (0-1)
  metadata: {
    algorithm: string;
    iterations: number;
    convergenceTime: number;
    warnings: string[];
  };
}

/**
 * Calibration session for batch processing
 */
export interface CalibrationSession {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  config: QuestRewardBalancerConfig;
  quests: string[]; // Quest IDs included
  results: RewardCalculationResult[];
  summary: {
    totalQuests: number;
    averageBalanceScore: number;
    totalAdjustments: number;
    convergenceRate: number;
  };
}

/**
 * Default reward balancer configuration
 */
export const DEFAULT_QUEST_REWARD_BALANCER_CONFIG: QuestRewardBalancerConfig = {
  rewardWeights: {
    resources: {
      type: 'resources',
      weight: 1.0,
      baseValue: 100,
      variance: 0.2,
      scaling: {
        difficulty: 1.5,
        duration: 0.8,
        complexity: 1.2,
      },
      constraints: {
        minValue: 10,
        maxValue: 1000,
        cap: 5000,
      },
    },
    experience: {
      type: 'experience',
      weight: 0.8,
      baseValue: 50,
      variance: 0.15,
      scaling: {
        difficulty: 1.3,
        duration: 1.0,
        complexity: 1.1,
      },
      constraints: {
        minValue: 5,
        maxValue: 500,
        cap: 2000,
      },
    },
    items: {
      type: 'items',
      weight: 1.2,
      baseValue: 80,
      variance: 0.3,
      scaling: {
        difficulty: 1.4,
        duration: 0.9,
        complexity: 1.0,
      },
      constraints: {
        minValue: 20,
        maxValue: 800,
        cap: 3000,
      },
    },
    reputation: {
      type: 'reputation',
      weight: 0.6,
      baseValue: 30,
      variance: 0.25,
      scaling: {
        difficulty: 1.2,
        duration: 1.1,
        complexity: 1.3,
      },
      constraints: {
        minValue: 1,
        maxValue: 100,
        cap: 500,
      },
    },
    skills: {
      type: 'skills',
      weight: 0.9,
      baseValue: 40,
      variance: 0.2,
      scaling: {
        difficulty: 1.6,
        duration: 0.7,
        complexity: 1.4,
      },
      constraints: {
        minValue: 10,
        maxValue: 200,
        cap: 1000,
      },
    },
    special: {
      type: 'special',
      weight: 2.0,
      baseValue: 150,
      variance: 0.4,
      scaling: {
        difficulty: 2.0,
        duration: 0.6,
        complexity: 1.8,
      },
      constraints: {
        minValue: 50,
        maxValue: 2000,
        cap: 10000,
      },
    },
  },
  targetRewardEfficiency: 10, // 10 reward value per minute
  maxRewardVariance: 0.3, // 30% variance allowed
  difficultyScaling: true,
  kpiThresholds: {
    minBalanceScore: 0.7,
    maxOverpoweredIndex: 0.3,
    maxUnderpoweredIndex: 0.3,
    minSuccessRate: 0.4,
    maxResourceInflation: 0.2,
  },
  economicConstraints: {
    maxTotalRewardsPerHour: 10000,
    maxRareRewardsPerHour: 1000,
    resourceSinkRatio: 0.8,
  },
  algorithmSettings: {
    iterations: 100,
    convergenceThreshold: 0.001,
    learningRate: 0.01,
    useHistoricalData: true,
  },
};

/**
 * Quest Reward Balancer Engine
 * 
 * Core engine for weight-based reward calibration with KPI tracking
 */
export class QuestRewardBalancer {
  private config: QuestRewardBalancerConfig;
  private historicalData: Map<string, QuestResult[]> = new Map();
  private kpiHistory: Map<string, QuestRewardKPI[]> = new Map();

  constructor(config: Partial<QuestRewardBalancerConfig> = {}) {
    this.config = { ...DEFAULT_QUEST_REWARD_BALANCER_CONFIG, ...config };
  }

  /**
   * Adds historical quest results for calibration
   */
  public addHistoricalData(questId: string, results: QuestResult[]): void {
    if (!this.historicalData.has(questId)) {
      this.historicalData.set(questId, []);
    }
    this.historicalData.get(questId)!.push(...results);
  }

  /**
   * Calculates quest difficulty based on definition and telemetry
   */
  public calculateQuestDifficulty(
    quest: QuestDefinition,
    _telemetry?: QuestTelemetry
  ): QuestDifficulty {
    const phases = quest.phases;
    const phaseTypes = phases.map(p => p.type);
    
    // Base difficulty by phase type
    const typeDifficulties: Record<string, number> = {
      fight: 0.8,
      stealth: 0.7,
      trap: 0.6,
      explore: 0.4,
      check: 0.3,
      dialogue: 0.2,
      branch: 0.5,
      timedChoice: 0.6,
    };

    // Calculate component difficulties
    const combat = phaseTypes.filter(t => ['fight'].includes(t)).length / phases.length;
    const stealth = phaseTypes.filter(t => ['stealth', 'trap'].includes(t)).length / phases.length;
    const social = phaseTypes.filter(t => ['dialogue', 'branch'].includes(t)).length / phases.length;
    const exploration = phaseTypes.filter(t => ['explore', 'check'].includes(t)).length / phases.length;
    
    // Time pressure from timed choices
    const timedPhases = phases.filter(p => p.type === 'timedChoice');
    const timePressure = timedPhases.length / phases.length;
    
    // Complexity from branching
    const branchPhases = phases.filter(p => ['dialogue', 'branch', 'timedChoice'].includes(p));
    const complexity = branchPhases.length / phases.length;
    
    // Calculate overall difficulty
    const overall = (
      combat * typeDifficulties.fight +
      stealth * typeDifficulties.stealth +
      social * typeDifficulties.dialogue +
      exploration * typeDifficulties.explore +
      timePressure * 0.3 +
      complexity * 0.2
    );

    return {
      overall: Math.min(1, Math.max(0, overall)),
      combat,
      stealth,
      social,
      exploration,
      timePressure,
      complexity,
    };
  }

  /**
   * Estimates quest duration based on phases and historical data
   */
  public estimateQuestDuration(quest: QuestDefinition): number {
    const historical = this.historicalData.get(quest.id);
    if (historical && historical.length > 0) {
      // Use historical average if available
      const avgDuration = historical.reduce((sum, r) => sum + r.durationSeconds, 0) / historical.length;
      return avgDuration;
    }

    // Estimate based on phase types
    const phaseDurations: Record<string, number> = {
      fight: 300, // 5 minutes
      stealth: 240, // 4 minutes
      trap: 180, // 3 minutes
      explore: 360, // 6 minutes
      check: 120, // 2 minutes
      dialogue: 180, // 3 minutes
      branch: 60, // 1 minute
      timedChoice: 150, // 2.5 minutes
    };

    return quest.phases.reduce((total, phase) => {
      return total + (phaseDurations[phase.type] || 180);
    }, 0);
  }

  /**
   * Calculates KPI metrics for a quest
   */
  public calculateKPI(
    quest: QuestDefinition,
    rewards: QuestEffect[],
    difficulty: QuestDifficulty,
    estimatedDuration: number,
    historicalResults?: QuestResult[]
  ): QuestRewardKPI {
    // Extract quest type from ID
    const questType = this.extractQuestType(quest.id);
    
    // Calculate reward distribution
    const rewardDistribution = this.calculateRewardDistribution(rewards);
    const totalRewardValue = this.calculateTotalRewardValue(rewards);
    
    // Calculate efficiency metrics
    const rewardEfficiency = totalRewardValue / (estimatedDuration / 60); // per minute
    const participantCount = this.estimateParticipantCount(quest);
    
    // Calculate performance metrics from historical data
    const successRate = this.calculateSuccessRate(historicalResults || []);
    const averageCompletionTime = this.calculateAverageCompletionTime(historicalResults || []);
    const playerSatisfactionScore = this.calculateSatisfactionScore(historicalResults || []);
    
    // Calculate economic metrics
    const resourceInflation = this.calculateResourceInflation(rewards);
    const rarityScore = this.calculateRarityScore(quest, rewards);
    const repeatValue = this.calculateRepeatValue(quest, rewards);
    
    // Calculate balancing metrics
    const balanceScore = this.calculateBalanceScore(
      rewardEfficiency,
      difficulty,
      successRate,
      resourceInflation
    );
    const overpoweredIndex = this.calculateOverpoweredIndex(rewards, difficulty);
    const underpoweredIndex = this.calculateUnderpoweredIndex(rewards, difficulty);

    return {
      questId: quest.id,
      questType,
      difficulty,
      estimatedDuration,
      participantCount,
      totalRewardValue,
      rewardDistribution,
      rewardEfficiency,
      riskRewardRatio: difficulty.overall / (totalRewardValue / 1000),
      successRate,
      averageCompletionTime,
      playerSatisfactionScore,
      resourceInflation,
      rarityScore,
      repeatValue,
      balanceScore,
      overpoweredIndex,
      underpoweredIndex,
    };
  }

  /**
   * Balances quest rewards using weight-based calibration
   */
  public balanceRewards(
    quest: QuestDefinition,
    originalRewards: QuestEffect[],
    historicalResults?: QuestResult[]
  ): RewardCalculationResult {
    const startTime = Date.now();
    
    // Calculate quest metrics
    const difficulty = this.calculateQuestDifficulty(quest);
    const estimatedDuration = this.estimateQuestDuration(quest);
    
    // Calculate current KPI
    const _currentKPI = this.calculateKPI(
      quest,
      originalRewards,
      difficulty,
      estimatedDuration,
      historicalResults
    );

    // Apply weight-based balancing algorithm
    const balancedRewards = this.applyWeightBalancing(
      originalRewards,
      difficulty,
      estimatedDuration
    );

    // Calculate new KPI
    const newKPI = this.calculateKPI(
      quest,
      balancedRewards,
      difficulty,
      estimatedDuration,
      historicalResults
    );

    // Calculate adjustments applied
    const adjustments = this.calculateAdjustments(originalRewards, balancedRewards);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(newKPI);

    // Store KPI in history
    if (!this.kpiHistory.has(quest.id)) {
      this.kpiHistory.set(quest.id, []);
    }
    this.kpiHistory.get(quest.id)!.push(newKPI);

    return {
      questId: quest.id,
      originalRewards,
      balancedRewards,
      kpi: newKPI,
      adjustments,
      confidence,
      metadata: {
        algorithm: 'weight-based-calibration',
        iterations: this.config.algorithmSettings.iterations,
        convergenceTime: Date.now() - startTime,
        warnings: this.generateWarnings(newKPI),
      },
    };
  }

  /**
   * Applies weight-based balancing algorithm
   */
  private applyWeightBalancing(
    rewards: QuestEffect[],
    difficulty: QuestDifficulty,
    duration: number
  ): QuestEffect[] {
    const targetEfficiency = this.config.targetRewardEfficiency;
    
    // Calculate scaling factors
    const difficultyScaling = this.config.difficultyScaling 
      ? (1 + difficulty.overall) 
      : 1;
    
    // Apply weight-based adjustments
    return rewards.map(reward => {
      const rewardType = this.mapEffectToRewardType(reward);
      const weightConfig = this.config.rewardWeights[rewardType];
      
      if (!weightConfig) return reward;

      // Calculate base adjustment
      const baseAdjustment = weightConfig.weight * weightConfig.baseValue;
      
      // Apply scaling factors
      const difficultyFactor = 1 + (difficulty.overall * weightConfig.scaling.difficulty);
      const durationFactor = 1 + ((duration / 300 - 1) * weightConfig.scaling.duration);
      const complexityFactor = 1 + (difficulty.complexity * weightConfig.scaling.complexity);
      
      // Calculate new value
      let newValue = baseAdjustment * difficultyFactor * durationFactor * complexityFactor;
      
      // Add variance
      const variance = (Math.random() - 0.5) * 2 * weightConfig.variance;
      newValue = newValue * (1 + variance);
      
      // Apply constraints
      newValue = Math.max(weightConfig.constraints.minValue, newValue);
      newValue = Math.min(weightConfig.constraints.maxValue, newValue);
      
      if (weightConfig.constraints.cap) {
        newValue = Math.min(weightConfig.constraints.cap, newValue);
      }

      // Create new reward effect
      return {
        ...reward,
        resourceAmount: reward.resourceAmount ? newValue : undefined,
        modifier: reward.modifier ? newValue : undefined,
      };
    });
  }

  /**
   * Maps quest effects to reward types
   */
  private mapEffectToRewardType(effect: QuestEffect): RewardType {
    switch (effect.type) {
      case 'resource_grant':
        return 'resources';
      case 'stat_modifier':
        if (effect.statName?.includes('exp') || effect.statName?.includes('skill')) {
          return 'skills';
        }
        return 'experience';
      case 'resident_modifier':
        return 'reputation';
      default:
        return 'special';
    }
  }

  /**
   * Calculates reward distribution by type
   */
  private calculateRewardDistribution(rewards: QuestEffect[]): Record<RewardType, number> {
    const distribution: Record<RewardType, number> = {
      resources: 0,
      experience: 0,
      items: 0,
      reputation: 0,
      skills: 0,
      special: 0,
    };

    rewards.forEach(reward => {
      const type = this.mapEffectToRewardType(reward);
      const value = reward.resourceAmount || reward.modifier || 0;
      distribution[type] += value;
    });

    return distribution;
  }

  /**
   * Calculates total reward value
   */
  private calculateTotalRewardValue(rewards: QuestEffect[]): number {
    return rewards.reduce((total, reward) => {
      const weightConfig = this.config.rewardWeights[this.mapEffectToRewardType(reward)];
      const value = reward.resourceAmount || reward.modifier || 0;
      const weight = weightConfig?.weight || 1;
      return total + (value * weight);
    }, 0);
  }

  /**
   * Estimates participant count for quest
   */
  private estimateParticipantCount(quest: QuestDefinition): number {
    // Base on quest tags and complexity
    if (quest.tags?.includes('solo')) return 1;
    if (quest.tags?.includes('party')) return 4;
    if (quest.tags?.includes('raid')) return 8;
    
    // Estimate based on phases
    const combatPhases = quest.phases.filter(p => p.type === 'fight').length;
    return Math.max(1, Math.min(8, 2 + combatPhases));
  }

  /**
   * Calculates success rate from historical data
   */
  private calculateSuccessRate(results: QuestResult[]): number {
    if (results.length === 0) return 0.5; // Default assumption
    
    const successCount = results.filter(r => r.success).length;
    return successCount / results.length;
  }

  /**
   * Calculates average completion time from historical data
   */
  private calculateAverageCompletionTime(results: QuestResult[]): number {
    if (results.length === 0) return 300; // 5 minutes default
    
    const totalTime = results.reduce((sum, r) => sum + r.durationSeconds, 0);
    return totalTime / results.length;
  }

  /**
   * Calculates player satisfaction score (mock implementation)
   */
  private calculateSatisfactionScore(results: QuestResult[]): number {
    if (results.length === 0) return 0.7; // Default assumption
    
    // Based on success rate and completion time efficiency
    const successRate = this.calculateSuccessRate(results);
    const avgTime = this.calculateAverageCompletionTime(results);
    const timeEfficiency = Math.min(1, 300 / avgTime); // Ideal is 5 minutes
    
    return (successRate * 0.7 + timeEfficiency * 0.3);
  }

  /**
   * Calculates resource inflation impact
   */
  private calculateResourceInflation(rewards: QuestEffect[]): number {
    const resourceRewards = rewards.filter(r => r.type === 'resource_grant');
    const totalResources = resourceRewards.reduce((sum, r) => sum + (r.resourceAmount || 0), 0);
    
    // Normalize to hourly impact
    return Math.min(1, totalResources / this.config.economicConstraints.maxTotalRewardsPerHour);
  }

  /**
   * Calculates rarity score based on reward uniqueness
   */
  private calculateRarityScore(quest: QuestDefinition, rewards: QuestEffect[]): number {
    const hasSpecialRewards = rewards.some(r => this.mapEffectToRewardType(r) === 'special');
    const hasHighValueRewards = rewards.some(r => (r.resourceAmount || 0) > 500);
    
    let score = 0;
    if (hasSpecialRewards) score += 0.5;
    if (hasHighValueRewards) score += 0.3;
    if (quest.tags?.includes('rare')) score += 0.2;
    
    return Math.min(1, score);
  }

  /**
   * Calculates repeat value for quest
   */
  private calculateRepeatValue(quest: QuestDefinition, rewards: QuestEffect[]): number {
    // Based on reward stability and quest replayability
    const variance = this.calculateRewardVariance(rewards);
    const replayability = quest.tags?.includes('repeatable') ? 1 : 0.5;
    
    return Math.max(0, 1 - variance) * replayability;
  }

  /**
   * Calculates reward variance
   */
  private calculateRewardVariance(rewards: QuestEffect[]): number {
    if (rewards.length === 0) return 0;
    
    const values = rewards.map(r => r.resourceAmount || r.modifier || 0);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  /**
   * Calculates overall balance score
   */
  private calculateBalanceScore(
    efficiency: number,
    difficulty: QuestDifficulty,
    successRate: number,
    inflation: number
  ): number {
    const targetEfficiency = this.config.targetRewardEfficiency;
    const efficiencyScore = 1 - Math.abs(efficiency - targetEfficiency) / targetEfficiency;
    const difficultyScore = 1 - Math.abs(difficulty.overall - 0.5) * 2; // Ideal is 0.5
    const successScore = Math.min(1, successRate / 0.7); // Ideal is 70% success rate
    const inflationScore = 1 - inflation;
    
    return (efficiencyScore * 0.4 + difficultyScore * 0.3 + successScore * 0.2 + inflationScore * 0.1);
  }

  /**
   * Calculates overpowered index
   */
  private calculateOverpoweredIndex(rewards: QuestEffect[], difficulty: QuestDifficulty): number {
    const totalValue = this.calculateTotalRewardValue(rewards);
    const expectedValue = this.config.targetRewardEfficiency * 5; // 5 minute baseline
    const ratio = totalValue / expectedValue;
    
    return Math.min(1, Math.max(0, (ratio - 1) / difficulty.overall));
  }

  /**
   * Calculates underpowered index
   */
  private calculateUnderpoweredIndex(rewards: QuestEffect[], difficulty: QuestDifficulty): number {
    const totalValue = this.calculateTotalRewardValue(rewards);
    const expectedValue = this.config.targetRewardEfficiency * 5; // 5 minute baseline
    const ratio = totalValue / expectedValue;
    
    return Math.min(1, Math.max(0, (1 - ratio) / (1 - difficulty.overall)));
  }

  /**
   * Calculates adjustments between original and balanced rewards
   */
  private calculateAdjustments(
    original: QuestEffect[],
    balanced: QuestEffect[]
  ): Record<RewardType, number> {
    const adjustments: Record<RewardType, number> = {
      resources: 0,
      experience: 0,
      items: 0,
      reputation: 0,
      skills: 0,
      special: 0,
    };

    // Group by type and calculate average adjustment
    const originalByType = this.groupRewardsByType(original);
    const balancedByType = this.groupRewardsByType(balanced);

    Object.keys(adjustments).forEach(type => {
      const origValue = originalByType[type as RewardType] || 0;
      const balValue = balancedByType[type as RewardType] || 0;
      adjustments[type as RewardType] = balValue / Math.max(1, origValue);
    });

    return adjustments;
  }

  /**
   * Groups rewards by type for comparison
   */
  private groupRewardsByType(rewards: QuestEffect[]): Record<RewardType, number> {
    const grouped: Record<RewardType, number> = {
      resources: 0,
      experience: 0,
      items: 0,
      reputation: 0,
      skills: 0,
      special: 0,
    };

    rewards.forEach(reward => {
      const type = this.mapEffectToRewardType(reward);
      const value = reward.resourceAmount || reward.modifier || 0;
      grouped[type] += value;
    });

    return grouped;
  }

  /**
   * Calculates confidence score for balancing results
   */
  private calculateConfidence(kpi: QuestRewardKPI): number {
    const thresholds = this.config.kpiThresholds;
    
    let confidence = 1;
    
    // Reduce confidence based on threshold violations
    if (kpi.balanceScore < thresholds.minBalanceScore) {
      confidence -= 0.3;
    }
    if (kpi.overpoweredIndex > thresholds.maxOverpoweredIndex) {
      confidence -= 0.2;
    }
    if (kpi.underpoweredIndex > thresholds.maxUnderpoweredIndex) {
      confidence -= 0.2;
    }
    if (kpi.successRate < thresholds.minSuccessRate) {
      confidence -= 0.1;
    }
    if (kpi.resourceInflation > thresholds.maxResourceInflation) {
      confidence -= 0.2;
    }
    
    return Math.max(0, confidence);
  }

  /**
   * Generates warnings for KPI issues
   */
  private generateWarnings(kpi: QuestRewardKPI): string[] {
    const warnings: string[] = [];
    const thresholds = this.config.kpiThresholds;
    
    if (kpi.balanceScore < thresholds.minBalanceScore) {
      warnings.push(`Low balance score: ${kpi.balanceScore.toFixed(2)}`);
    }
    if (kpi.overpoweredIndex > thresholds.maxOverpoweredIndex) {
      warnings.push(`Rewards may be overpowered: ${kpi.overpoweredIndex.toFixed(2)}`);
    }
    if (kpi.underpoweredIndex > thresholds.maxUnderpoweredIndex) {
      warnings.push(`Rewards may be underpowered: ${kpi.underpoweredIndex.toFixed(2)}`);
    }
    if (kpi.successRate < thresholds.minSuccessRate) {
      warnings.push(`Low success rate: ${(kpi.successRate * 100).toFixed(1)}%`);
    }
    if (kpi.resourceInflation > thresholds.maxResourceInflation) {
      warnings.push(`High resource inflation: ${(kpi.resourceInflation * 100).toFixed(1)}%`);
    }
    
    return warnings;
  }

  /**
   * Extracts quest type from quest ID
   */
  private extractQuestType(questId: string): string {
    const parts = questId.split('-');
    return parts.length > 1 ? parts[1] : 'unknown';
  }

  /**
   * Gets current configuration
   */
  public getConfig(): QuestRewardBalancerConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  public updateConfig(newConfig: Partial<QuestRewardBalancerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets historical KPI data for a quest
   */
  public getKPIHistory(questId: string): QuestRewardKPI[] {
    return this.kpiHistory.get(questId) || [];
  }

  /**
   * Clears historical data
   */
  public clearHistoricalData(questId?: string): void {
    if (questId) {
      this.historicalData.delete(questId);
      this.kpiHistory.delete(questId);
    } else {
      this.historicalData.clear();
      this.kpiHistory.clear();
    }
  }
}

export default QuestRewardBalancer;
