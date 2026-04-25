/**
 * Quest Telemetry Selectors
 *
 * Utility functions for selecting and transforming quest telemetry data
 * into buckets, analytics, and visualization-ready formats.
 */

import type { AggregatedTelemetry, QuestTelemetryEntry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { BranchDecision } from '@/engine/quest/types';
import type { 
  TimeBucketConfig, 
  ColorScaleConfig, 
  DecisionFeedConfig,
  AnalyticsConfig 
} from '@/balancing/config/idleVillage/questTelemetryConfig';

/**
 * Time bucket data structure
 */
export interface TimeBucket {
  id: string;
  timestamp: number;
  startTime: number;
  endTime: number;
  questCount: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  totalDuration: number;
  heroicMoments: number;
  questTypes: Record<string, number>;
  decisions: BranchDecision[];
}

/**
 * Decision feed item with computed metrics
 */
export interface DecisionFeedItem {
  id: string;
  decision: BranchDecision;
  questType: string;
  timestamp: number;
  choiceTime: number;
  isHeroic: boolean;
  success: boolean;
  outcome: string;
  context: Record<string, unknown>;
  riskScore: number;
  rewardScore: number;
}

/**
 * Analytics data structure
 */
export interface QuestAnalytics {
  overall: {
    totalQuests: number;
    successRate: number;
    averageDuration: number;
    averageChoiceTime: number;
    heroicMomentRate: number;
  };
  byQuestType: Record<string, {
    count: number;
    successRate: number;
    averageDuration: number;
    riskScore: number;
    rewardScore: number;
  }>;
  timeSeries: TimeBucket[];
  trends: {
    successRate: 'improving' | 'declining' | 'stable';
    averageDuration: 'improving' | 'declining' | 'stable';
    heroicMoments: 'improving' | 'declining' | 'stable';
  };
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: {
    failureRate: number;
    averageDuration: number;
    choiceComplexity: number;
    heroicMoments: number;
  };
  recommendation: string;
}

/**
 * Reward assessment result
 */
export interface RewardAssessment {
  score: number;
  potential: 'low' | 'medium' | 'high';
  factors: {
    successRate: number;
    averageDuration: number;
    heroicMoments: number;
    choiceEfficiency: number;
  };
  recommendation: string;
}

/**
 * Creates time buckets from telemetry data
 */
export function createTimeBuckets(
  telemetry: AggregatedTelemetry,
  config: TimeBucketConfig,
  questTypeResolver?: (questId: string) => string
): TimeBucket[] {
  if (telemetry.recentQuests.length === 0) {
    return [];
  }

  const now = Date.now();
  const bucketSizeMs = config.sizeMinutes * 60 * 1000;
  const buckets: Map<string, TimeBucket> = new Map();

  // Create bucket slots
  for (let i = 0; i < config.maxBuckets; i++) {
    const endTime = now - (i * bucketSizeMs);
    const startTime = endTime - bucketSizeMs;
    const bucketId = `bucket_${i}`;
    
    buckets.set(bucketId, {
      id: bucketId,
      timestamp: endTime,
      startTime,
      endTime,
      questCount: 0,
      successCount: 0,
      failureCount: 0,
      averageDuration: 0,
      totalDuration: 0,
      heroicMoments: 0,
      questTypes: {},
      decisions: [],
    });
  }

  // Populate buckets with quest data
  telemetry.recentQuests.forEach((entry) => {
    const bucketIndex = Math.floor((now - entry.timestamp) / bucketSizeMs);
    if (bucketIndex >= 0 && bucketIndex < config.maxBuckets) {
      const bucketId = `bucket_${bucketIndex}`;
      const bucket = buckets.get(bucketId);
      
      if (bucket) {
        bucket.questCount++;
        
        if (entry.result.success) {
          bucket.successCount++;
        } else {
          bucket.failureCount++;
        }
        
        bucket.totalDuration += entry.result.durationSeconds;
        bucket.heroicMoments += entry.result.telemetryData?.heroicMoments ?? 0;
        
        // Track quest types
        const questType = questTypeResolver ? questTypeResolver(entry.questId) : 'unknown';
        bucket.questTypes[questType] = (bucket.questTypes[questType] || 0) + 1;
        
        // Add decisions
        bucket.decisions.push(...entry.result.branchDecisions);
      }
    }
  });

  // Calculate averages for each bucket
  buckets.forEach(bucket => {
    if (bucket.questCount > 0) {
      bucket.averageDuration = bucket.totalDuration / bucket.questCount;
    }
  });

  return Array.from(buckets.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Creates decision feed items from telemetry data
 */
export function createDecisionFeedItems(
  telemetry: AggregatedTelemetry,
  config: DecisionFeedConfig,
  questTypeResolver?: (questId: string) => string
): DecisionFeedItem[] {
  const items: DecisionFeedItem[] = [];
  
  // Process all branch decisions
  telemetry.branchDecisions.forEach((decision, index) => {
    const questType = questTypeResolver ? 
      questTypeResolver(decision.outcome.metadata?.questId as string || 'unknown') : 
      'unknown';
    
    const choiceTime = (decision.outcome.metadata?.lastChoiceTime as number) || 0;
    const isHeroic = decision.outcome.metadata?.isHeroicMoment === true;
    
    // Calculate risk and reward scores
    const riskScore = calculateRiskScore(decision, telemetry);
    const rewardScore = calculateRewardScore(decision, telemetry);
    
    items.push({
      id: `decision_${index}_${decision.timestamp}`,
      decision,
      questType,
      timestamp: decision.timestamp,
      choiceTime,
      isHeroic,
      success: decision.outcome.success,
      outcome: decision.outcome.description || 'No description',
      context: decision.outcome.metadata || {},
      riskScore,
      rewardScore,
    });
  });

  // Apply filters
  const filteredItems = items.filter(item => {
    if (!config.filters.showSuccessful && item.success) return false;
    if (!config.filters.showFailed && !item.success) return false;
    if (!config.filters.showHeroic && item.isHeroic) return false;
    
    if (config.filters.timeRange) {
      const ageMinutes = (Date.now() - item.timestamp) / (1000 * 60);
      if (ageMinutes > config.filters.timeRange) return false;
    }
    
    if (config.filters.questTypes.length > 0) {
      if (!config.filters.questTypes.includes(item.questType)) return false;
    }
    
    return true;
  });

  // Apply sorting
  filteredItems.sort((a, b) => {
    let comparison = 0;
    
    switch (config.sortBy) {
      case 'timestamp':
        comparison = a.timestamp - b.timestamp;
        break;
      case 'success':
        comparison = (a.success ? 1 : 0) - (b.success ? 1 : 0);
        break;
      case 'duration':
        const aDuration = a.decision.outcome.metadata?.duration as number || 0;
        const bDuration = b.decision.outcome.metadata?.duration as number || 0;
        comparison = aDuration - bDuration;
        break;
      case 'choice-time':
        comparison = a.choiceTime - b.choiceTime;
        break;
    }
    
    return config.sortOrder === 'desc' ? -comparison : comparison;
  });

  // Limit results
  return filteredItems.slice(0, config.maxDecisions);
}

/**
 * Creates comprehensive analytics from telemetry data
 */
export function createQuestAnalytics(
  telemetry: AggregatedTelemetry,
  config: AnalyticsConfig,
  questTypeResolver?: (questId: string) => string
): QuestAnalytics {
  // Overall analytics
  const overall = {
    totalQuests: telemetry.totalQuests,
    successRate: telemetry.successRate,
    averageDuration: telemetry.averageDuration,
    averageChoiceTime: telemetry.averageChoiceTime,
    heroicMomentRate: telemetry.totalQuests > 0 ? telemetry.heroicMoments / telemetry.totalQuests : 0,
  };

  // By quest type analytics
  const byQuestType: Record<string, any> = {};
  Object.entries(telemetry.questTypeBreakdown).forEach(([questType, count]) => {
    const typeEntries = telemetry.recentQuests.filter(entry => {
      const entryType = questTypeResolver ? questTypeResolver(entry.questId) : 'unknown';
      return entryType === questType;
    });
    
    const successful = typeEntries.filter(entry => entry.result.success).length;
    const successRate = count > 0 ? successful / count : 0;
    const avgDuration = typeEntries.length > 0 
      ? typeEntries.reduce((sum, entry) => sum + entry.result.durationSeconds, 0) / typeEntries.length 
      : 0;
    
    byQuestType[questType] = {
      count,
      successRate,
      averageDuration: avgDuration,
      riskScore: calculateQuestTypeRiskScore(typeEntries, config.risk),
      rewardScore: calculateQuestTypeRewardScore(typeEntries, config.rewards),
    };
  });

  // Time series (simplified version)
  const timeSeries = createTimeBuckets(telemetry, {
    sizeMinutes: 60, // 1-hour buckets
    maxBuckets: 24,
    showEmpty: false,
    labelFormat: 'short',
  }, questTypeResolver);

  // Trends (simplified - would need historical data for real trends)
  const trends = {
    successRate: 'stable' as const,
    averageDuration: 'stable' as const,
    heroicMoments: 'stable' as const,
  };

  return {
    overall,
    byQuestType,
    timeSeries,
    trends,
  };
}

/**
 * Calculates risk score for a decision
 */
export function calculateRiskScore(
  decision: BranchDecision,
  telemetry: AggregatedTelemetry
): number {
  let score = 0;
  
  // Failure risk
  if (!decision.outcome.success) {
    score += 0.4;
  }
  
  // Choice time risk (slow decisions might indicate uncertainty)
  const choiceTime = (decision.outcome.metadata?.lastChoiceTime as number) || 0;
  if (choiceTime > 10) {
    score += 0.2;
  } else if (choiceTime < 1) {
    score += 0.1; // Very fast decisions might be risky
  }
  
  // Complexity risk
  const complexity = (decision.outcome.metadata?.complexity as number) || 1;
  score += (complexity - 1) * 0.1;
  
  return Math.min(score, 1);
}

/**
 * Calculates reward score for a decision
 */
export function calculateRewardScore(
  decision: BranchDecision,
  telemetry: AggregatedTelemetry
): number {
  let score = 0;
  
  // Success reward
  if (decision.outcome.success) {
    score += 0.4;
  }
  
  // Heroic moment reward
  if (decision.outcome.metadata?.isHeroicMoment === true) {
    score += 0.3;
  }
  
  // Efficiency reward (fast but not too fast decisions)
  const choiceTime = (decision.outcome.metadata?.lastChoiceTime as number) || 0;
  if (choiceTime >= 2 && choiceTime <= 5) {
    score += 0.2;
  }
  
  return Math.min(score, 1);
}

/**
 * Calculates risk score for a quest type
 */
export function calculateQuestTypeRiskScore(
  entries: QuestTelemetryEntry[],
  config: AnalyticsConfig['risk']
): number {
  if (entries.length === 0) return 0;
  
  const failureRate = 1 - (entries.filter(e => e.result.success).length / entries.length);
  const avgDuration = entries.reduce((sum, e) => sum + e.result.durationSeconds, 0) / entries.length;
  const avgComplexity = entries.reduce((sum, e) => 
    sum + (e.result.telemetryData?.complexity || 1), 0) / entries.length;
  const heroicRate = entries.reduce((sum, e) => 
    sum + (e.result.telemetryData?.heroicMoments || 0), 0) / entries.length;
  
  const score = 
    failureRate * config.factors.failureRate +
    (avgDuration / 300) * config.factors.averageDuration + // Normalize to 5 minutes
    (avgComplexity - 1) * config.factors.choiceComplexity +
    heroicRate * config.factors.heroicMoments;
  
  return Math.min(score, 1);
}

/**
 * Calculates reward score for a quest type
 */
export function calculateQuestTypeRewardScore(
  entries: QuestTelemetryEntry[],
  config: AnalyticsConfig['rewards']
): number {
  if (entries.length === 0) return 0;
  
  const successRate = entries.filter(e => e.result.success).length / entries.length;
  const avgDuration = entries.reduce((sum, e) => sum + e.result.durationSeconds, 0) / entries.length;
  const heroicRate = entries.reduce((sum, e) => 
    sum + (e.result.telemetryData?.heroicMoments || 0), 0) / entries.length;
  
  // Calculate choice efficiency (avg choice time for successful quests)
  const successfulEntries = entries.filter(e => e.result.success);
  const avgChoiceTime = successfulEntries.length > 0
    ? successfulEntries.reduce((sum, e) => {
        const times = e.result.branchDecisions
          .map(d => (d.outcome.metadata?.lastChoiceTime as number) || 0)
          .filter(t => t > 0);
        return sum + (times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0);
      }, 0) / successfulEntries.length
    : 0;
  
  const choiceEfficiency = avgChoiceTime > 0 ? Math.max(0, 1 - avgChoiceTime / 10) : 0;
  
  const score = 
    successRate * config.metrics.successRate +
    (1 - avgDuration / 300) * config.metrics.averageDuration + // Faster is better
    heroicRate * config.metrics.heroicMoments +
    choiceEfficiency * config.metrics.choiceEfficiency;
  
  return Math.min(score, 1);
}

/**
 * Creates risk assessment for a quest or decision
 */
export function createRiskAssessment(
  score: number,
  config: AnalyticsConfig['risk']
): RiskAssessment {
  let level: 'low' | 'medium' | 'high';
  
  if (score < config.thresholds.low) {
    level = 'low';
  } else if (score < config.thresholds.medium) {
    level = 'medium';
  } else {
    level = 'high';
  }
  
  const recommendation = level === 'low' 
    ? 'Low risk quest. Proceed with confidence.'
    : level === 'medium'
    ? 'Moderate risk. Consider preparation and strategy.'
    : 'High risk quest. Ensure adequate preparation and resources.';
  
  return {
    level,
    score,
    factors: {
      failureRate: score * 0.4,
      averageDuration: score * 0.3,
      choiceComplexity: score * 0.2,
      heroicMoments: score * 0.1,
    },
    recommendation,
  };
}

/**
 * Creates reward assessment for a quest or decision
 */
export function createRewardAssessment(
  score: number,
  config: AnalyticsConfig['rewards']
): RewardAssessment {
  let potential: 'low' | 'medium' | 'high';
  
  if (score < 0.33) {
    potential = 'low';
  } else if (score < 0.67) {
    potential = 'medium';
  } else {
    potential = 'high';
  }
  
  const recommendation = potential === 'low'
    ? 'Low potential rewards. Consider alternative options.'
    : potential === 'medium'
    ? 'Moderate potential rewards. Good opportunity for growth.'
    : 'High potential rewards. Excellent opportunity for advancement.';
  
  return {
    score,
    potential,
    factors: {
      successRate: score * 0.4,
      averageDuration: score * 0.3,
      heroicMoments: score * 0.2,
      choiceEfficiency: score * 0.1,
    },
    recommendation,
  };
}

/**
 * Filters telemetry data based on time range
 */
export function filterByTimeRange(
  telemetry: AggregatedTelemetry,
  timeRangeMinutes: number
): AggregatedTelemetry {
  const cutoffTime = Date.now() - (timeRangeMinutes * 60 * 1000);
  
  const recentQuests = telemetry.recentQuests.filter(
    entry => entry.timestamp >= cutoffTime
  );
  
  const branchDecisions = telemetry.branchDecisions.filter(
    decision => decision.timestamp >= cutoffTime
  );
  
  // Recalculate aggregated metrics
  const totalQuests = recentQuests.length;
  const successfulQuests = recentQuests.filter(entry => entry.result.success).length;
  const successRate = totalQuests > 0 ? successfulQuests / totalQuests : 0;
  
  const totalDuration = recentQuests.reduce((sum, entry) => sum + entry.result.durationSeconds, 0);
  const averageDuration = totalQuests > 0 ? totalDuration / totalQuests : 0;
  
  const choiceTimes = branchDecisions
    .map(decision => (decision.outcome.metadata?.lastChoiceTime as number) || 0)
    .filter(time => time > 0);
  const averageChoiceTime = choiceTimes.length > 0 
    ? choiceTimes.reduce((a, b) => a + b, 0) / choiceTimes.length 
    : 0;
  
  const heroicMoments = recentQuests.reduce(
    (sum, entry) => sum + (entry.result.telemetryData?.heroicMoments ?? 0),
    0
  );
  
  // Recalculate quest type breakdown
  const questTypeBreakdown: Record<string, number> = {};
  recentQuests.forEach(entry => {
    // This would need quest type resolver in real implementation
    const questType = 'unknown';
    questTypeBreakdown[questType] = (questTypeBreakdown[questType] || 0) + 1;
  });
  
  return {
    ...telemetry,
    totalQuests,
    successRate,
    averageDuration,
    totalBranches: branchDecisions.length,
    averageChoiceTime,
    heroicMoments,
    branchDecisions,
    recentQuests,
    questTypeBreakdown,
  };
}

/**
 * Gets top performing quest types
 */
export function getTopQuestTypes(
  analytics: QuestAnalytics,
  metric: 'successRate' | 'count' | 'rewardScore',
  limit: number = 5
): Array<{ questType: string; value: number; label: string }> {
  return Object.entries(analytics.byQuestType)
    .map(([questType, data]) => ({
      questType,
      value: data[metric] as number,
      label: questType, // Would be resolved to proper label in real implementation
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
