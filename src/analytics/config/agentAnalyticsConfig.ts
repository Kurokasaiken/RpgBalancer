/**
 * Agent Performance Analytics Configuration - NP-125
 * 
 * Config-first design for agent performance tracking including:
 * - Completion time metrics
 * - Error rate thresholds
 * - Quality score calculations
 * - Performance benchmarks
 * 
 * @since 2026-01-23
 * @author Sentinel-Coordinator
 */

/**
 * Agent performance metric types
 */
export type AgentMetricType =
  | 'completion_time'
  | 'error_rate'
  | 'quality_score'
  | 'velocity'
  | 'accuracy'
  | 'reliability';

/**
 * Performance rating levels
 */
export type PerformanceRating = 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'critical';

/**
 * Agent performance thresholds configuration
 */
export interface AgentPerformanceThresholds {
  /** Completion time thresholds (in minutes) */
  completionTime: {
    excellent: number;
    good: number;
    acceptable: number;
    needsImprovement: number;
  };
  /** Error rate thresholds (percentage 0-100) */
  errorRate: {
    excellent: number;
    good: number;
    acceptable: number;
    needsImprovement: number;
  };
  /** Quality score thresholds (0-100) */
  qualityScore: {
    excellent: number;
    good: number;
    acceptable: number;
    needsImprovement: number;
  };
  /** Velocity thresholds (tasks per day) */
  velocity: {
    excellent: number;
    good: number;
    acceptable: number;
    needsImprovement: number;
  };
}

/**
 * Quality metric weights for score calculation
 */
export interface QualityMetricWeights {
  /** Weight for test coverage (0-1) */
  testCoverage: number;
  /** Weight for build success (0-1) */
  buildSuccess: number;
  /** Weight for lint compliance (0-1) */
  lintCompliance: number;
  /** Weight for documentation completeness (0-1) */
  documentation: number;
  /** Weight for code review feedback (0-1) */
  codeReview: number;
}

/**
 * Agent analytics configuration
 */
export interface AgentAnalyticsConfig {
  /** Performance thresholds */
  thresholds: AgentPerformanceThresholds;
  /** Quality metric weights */
  qualityWeights: QualityMetricWeights;
  /** Minimum sample size for reliable metrics */
  minSampleSize: number;
  /** Time window for trend analysis (days) */
  trendWindowDays: number;
  /** Enable real-time monitoring */
  enableRealTimeMonitoring: boolean;
  /** Alert thresholds for notifications */
  alertThresholds: {
    errorRateSpike: number;
    velocityDrop: number;
    qualityDrop: number;
  };
}

/**
 * Default agent performance thresholds
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: AgentPerformanceThresholds = {
  completionTime: {
    excellent: 0.8, // 80% of estimated time or less
    good: 1.0, // On time
    acceptable: 1.2, // 20% over estimate
    needsImprovement: 1.5, // 50% over estimate
  },
  errorRate: {
    excellent: 5, // Less than 5% error rate
    good: 10, // Less than 10% error rate
    acceptable: 20, // Less than 20% error rate
    needsImprovement: 30, // Less than 30% error rate
  },
  qualityScore: {
    excellent: 90, // 90+ quality score
    good: 75, // 75+ quality score
    acceptable: 60, // 60+ quality score
    needsImprovement: 50, // 50+ quality score
  },
  velocity: {
    excellent: 8, // 8+ tasks per day
    good: 5, // 5+ tasks per day
    acceptable: 3, // 3+ tasks per day
    needsImprovement: 1, // 1+ tasks per day
  },
};

/**
 * Default quality metric weights
 */
export const DEFAULT_QUALITY_WEIGHTS: QualityMetricWeights = {
  testCoverage: 0.3,
  buildSuccess: 0.25,
  lintCompliance: 0.15,
  documentation: 0.15,
  codeReview: 0.15,
};

/**
 * Default agent analytics configuration
 */
export const DEFAULT_AGENT_ANALYTICS_CONFIG: AgentAnalyticsConfig = {
  thresholds: DEFAULT_PERFORMANCE_THRESHOLDS,
  qualityWeights: DEFAULT_QUALITY_WEIGHTS,
  minSampleSize: 5,
  trendWindowDays: 30,
  enableRealTimeMonitoring: true,
  alertThresholds: {
    errorRateSpike: 50, // 50% increase in error rate
    velocityDrop: 30, // 30% drop in velocity
    qualityDrop: 20, // 20 point drop in quality score
  },
};

/**
 * Get performance rating based on metric value and thresholds
 */
export function getPerformanceRating(
  value: number,
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    needsImprovement: number;
  },
  higherIsBetter: boolean = true
): PerformanceRating {
  if (higherIsBetter) {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.acceptable) return 'acceptable';
    if (value >= thresholds.needsImprovement) return 'needs_improvement';
    return 'critical';
  } else {
    if (value <= thresholds.excellent) return 'excellent';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.acceptable) return 'acceptable';
    if (value <= thresholds.needsImprovement) return 'needs_improvement';
    return 'critical';
  }
}

/**
 * Get color for performance rating
 */
export function getPerformanceRatingColor(rating: PerformanceRating): string {
  switch (rating) {
    case 'excellent':
      return 'rgb(34, 197, 94)'; // green-500
    case 'good':
      return 'rgb(132, 204, 22)'; // lime-500
    case 'acceptable':
      return 'rgb(251, 191, 36)'; // amber-400
    case 'needs_improvement':
      return 'rgb(249, 115, 22)'; // orange-500
    case 'critical':
      return 'rgb(239, 68, 68)'; // red-500
    default:
      return 'rgb(148, 163, 184)'; // slate-400
  }
}

/**
 * Calculate quality score from individual metrics
 */
export function calculateQualityScore(
  metrics: {
    testCoverage: number; // 0-100
    buildSuccess: boolean;
    lintErrors: number;
    documentationComplete: boolean;
    codeReviewScore: number; // 0-100
  },
  weights: QualityMetricWeights = DEFAULT_QUALITY_WEIGHTS
): number {
  const testScore = metrics.testCoverage * weights.testCoverage;
  const buildScore = (metrics.buildSuccess ? 100 : 0) * weights.buildSuccess;
  const lintScore = Math.max(0, 100 - metrics.lintErrors * 5) * weights.lintCompliance;
  const docScore = (metrics.documentationComplete ? 100 : 0) * weights.documentation;
  const reviewScore = metrics.codeReviewScore * weights.codeReview;

  return Math.round(testScore + buildScore + lintScore + docScore + reviewScore);
}

/**
 * Calculate completion time ratio (actual / estimated)
 */
export function calculateCompletionTimeRatio(
  actualMinutes: number,
  estimatedMinutes: number
): number {
  if (estimatedMinutes === 0) return 1.0;
  return actualMinutes / estimatedMinutes;
}

/**
 * Calculate error rate percentage
 */
export function calculateErrorRate(
  errorCount: number,
  totalTasks: number
): number {
  if (totalTasks === 0) return 0;
  return (errorCount / totalTasks) * 100;
}

/**
 * Calculate velocity (tasks per day)
 */
export function calculateVelocity(
  completedTasks: number,
  daysElapsed: number
): number {
  if (daysElapsed === 0) return 0;
  return completedTasks / daysElapsed;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
