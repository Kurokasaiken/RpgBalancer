/**
 * Idle Village Session Variance Configuration
 * 
 * Configuration for session duration variance monitoring across
 * desktop and mobile platforms with bucket definitions and KPI targets.
 * 
 * @since NP-053 – Idle Village Session Variance Monitor
 */

import { z } from 'zod';

/**
 * Session bucket types for categorizing session durations
 */
export type SessionBucket = 'short' | 'medium' | 'long';

/**
 * Platform types for session analysis
 */
export type Platform = 'desktop' | 'mobile';

/**
 * Session data structure
 */
export interface SessionData {
  /** Unique session identifier */
  id: string;
  /** Platform type */
  platform: Platform;
  /** Session start timestamp */
  startTime: number;
  /** Session end timestamp */
  endTime: number;
  /** Session duration in seconds */
  duration: number;
  /** Session bucket category */
  bucket: SessionBucket;
  /** User ID if available */
  userId?: string;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session statistics for variance analysis
 */
export interface SessionStatistics {
  /** Total number of sessions */
  totalSessions: number;
  /** Average session duration */
  averageDuration: number;
  /** Median session duration */
  medianDuration: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Variance */
  variance: number;
  /** Minimum session duration */
  minDuration: number;
  /** Maximum session duration */
  maxDuration: number;
  /** Sessions by bucket */
  bucketDistribution: Record<SessionBucket, number>;
  /** Sessions by platform */
  platformDistribution: Record<Platform, number>;
  /** Platform-specific statistics */
  platformStats: Record<Platform, SessionStatistics>;
}

/**
 * Variance alert configuration
 */
export interface VarianceAlert {
  /** Alert identifier */
  id: string;
  /** Alert type */
  type: 'high_variance' | 'outlier' | 'bucket_imbalance' | 'platform_divergence';
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Alert message */
  message: string;
  /** Alert timestamp */
  timestamp: number;
  /** Alert data */
  data: {
    platform?: Platform;
    bucket?: SessionBucket;
    variance?: number;
    threshold?: number;
    actualValue?: number;
    expectedValue?: number;
  };
}

/**
 * KPI targets for session variance
 */
export interface KpiTargets {
  /** Target standard deviation (seconds) */
  targetStdDev: number;
  /** Maximum acceptable variance */
  maxVariance: number;
  /** Target bucket distribution percentages */
  targetBucketDistribution: Record<SessionBucket, number>;
  /** Target platform distribution percentages */
  targetPlatformDistribution: Record<Platform, number>;
  /** Maximum platform divergence percentage */
  maxPlatformDivergence: number;
  /** Minimum session duration (seconds) */
  minSessionDuration: number;
  /** Maximum session duration (seconds) */
  maxSessionDuration: number;
}

/**
 * Session variance configuration
 */
export interface SessionVarianceConfig {
  /** Configuration identifier */
  id: string;
  /** Bucket definitions */
  buckets: {
    [K in SessionBucket]: {
      name: string;
      minDuration: number;
      maxDuration: number;
      description: string;
    };
  };
  /** KPI targets */
  kpiTargets: KpiTargets;
  /** Alert configuration */
  alerts: {
    enabled: boolean;
    thresholds: {
      varianceThreshold: number;
      outlierThreshold: number;
      bucketImbalanceThreshold: number;
      platformDivergenceThreshold: number;
    };
    cooldown: number; // milliseconds
  };
  /** Data processing configuration */
  processing: {
    batchSize: number;
    refreshInterval: number; // milliseconds
    maxDataPoints: number;
    enableRealTime: boolean;
  };
  /** Export configuration */
  export: {
    enabled: boolean;
    formats: ('json' | 'csv' | 'markdown')[];
    includeCharts: boolean;
    compression: boolean;
  };
  /** UI configuration */
  ui: {
    chartType: 'line' | 'bar' | 'area' | 'scatter';
    showBuckets: boolean;
    showPlatforms: boolean;
    showAlerts: boolean;
    refreshRate: number; // milliseconds
    maxDataPoints: number;
  };
}

/**
 * Zod schema for SessionBucket
 */
const SessionBucketSchema = z.enum(['short', 'medium', 'long']);

/**
 * Zod schema for Platform
 */
const PlatformSchema = z.enum(['desktop', 'mobile']);

/**
 * Zod schema for SessionData
 */
const SessionDataSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number(),
  bucket: SessionBucketSchema,
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Zod schema for SessionStatistics
 */
const SessionStatisticsSchema = z.object({
  totalSessions: z.number(),
  averageDuration: z.number(),
  medianDuration: z.number(),
  standardDeviation: z.number(),
  variance: z.number(),
  minDuration: z.number(),
  maxDuration: z.number(),
  bucketDistribution: z.record(z.number()),
  platformDistribution: z.record(z.number()),
  platformStats: z.lazy(() => SessionStatisticsSchema),
});

/**
 * Zod schema for VarianceAlert
 */
const VarianceAlertSchema = z.object({
  id: z.string(),
  type: z.enum(['high_variance', 'outlier', 'bucket_imbalance', 'platform_divergence']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  timestamp: z.number(),
  data: z.object({
    platform: PlatformSchema.optional(),
    bucket: SessionBucketSchema.optional(),
    variance: z.number().optional(),
    threshold: z.number().optional(),
    actualValue: z.number().optional(),
    expectedValue: z.number().optional(),
  }),
});

/**
 * Zod schema for KpiTargets
 */
const KpiTargetsSchema = z.object({
  targetStdDev: z.number(),
  maxVariance: z.number(),
  targetBucketDistribution: z.record(z.number()),
  targetPlatformDistribution: z.record(z.number()),
  maxPlatformDivergence: z.number(),
  minSessionDuration: z.number(),
  maxSessionDuration: z.number(),
});

/**
 * Zod schema for SessionVarianceConfig
 */
const SessionVarianceConfigSchema = z.object({
  id: z.string(),
  buckets: z.object({
    short: z.object({
      name: z.string(),
      minDuration: z.number(),
      maxDuration: z.number(),
      description: z.string(),
    }),
    medium: z.object({
      name: z.string(),
      minDuration: z.number(),
      maxDuration: z.number(),
      description: z.string(),
    }),
    long: z.object({
      name: z.string(),
      minDuration: z.number(),
      maxDuration: z.number(),
      description: z.string(),
    }),
  }),
  kpiTargets: KpiTargetsSchema,
  alerts: z.object({
    enabled: z.boolean(),
    thresholds: z.object({
      varianceThreshold: z.number(),
      outlierThreshold: z.number(),
      bucketImbalanceThreshold: z.number(),
      platformDivergenceThreshold: z.number(),
    }),
    cooldown: z.number(),
  }),
  processing: z.object({
    batchSize: z.number(),
    refreshInterval: z.number(),
    maxDataPoints: z.number(),
    enableRealTime: z.boolean(),
  }),
  export: z.object({
    enabled: z.boolean(),
    formats: z.array(z.enum(['json', 'csv', 'markdown'])),
    includeCharts: z.boolean(),
    compression: z.boolean(),
  }),
  ui: z.object({
    chartType: z.enum(['line', 'bar', 'area', 'scatter']),
    showBuckets: z.boolean(),
    showPlatforms: z.boolean(),
    showAlerts: z.boolean(),
    refreshRate: z.number(),
    maxDataPoints: z.number(),
  }),
});

/**
 * Empty statistics for initialization
 */
const EMPTY_STATS: SessionStatistics = {
  totalSessions: 0,
  averageDuration: 0,
  medianDuration: 0,
  standardDeviation: 0,
  variance: 0,
  minDuration: 0,
  maxDuration: 0,
  bucketDistribution: { short: 0, medium: 0, long: 0 },
  platformDistribution: { desktop: 0, mobile: 0 },
  platformStats: { desktop: { ...EMPTY_STATS }, mobile: { ...EMPTY_STATS } },
};

/**
 * Default session variance configuration
 */
export const DEFAULT_SESSION_VARIANCE_CONFIG: SessionVarianceConfig = {
  id: 'idle-village-session-variance',
  buckets: {
    short: {
      name: 'Short Sessions',
      minDuration: 0,
      maxDuration: 300, // 5 minutes
      description: 'Quick play sessions under 5 minutes',
    },
    medium: {
      name: 'Medium Sessions',
      minDuration: 300,
      maxDuration: 1800, // 30 minutes
      description: 'Standard play sessions between 5-30 minutes',
    },
    long: {
      name: 'Long Sessions',
      minDuration: 1800,
      maxDuration: Infinity,
      description: 'Extended play sessions over 30 minutes',
    },
  },
  kpiTargets: {
    targetStdDev: 420, // 7 minutes
    maxVariance: 176400, // 420^2
    targetBucketDistribution: {
      short: 0.3, // 30%
      medium: 0.5, // 50%
      long: 0.2, // 20%
    },
    targetPlatformDistribution: {
      desktop: 0.6, // 60%
      mobile: 0.4, // 40%
    },
    maxPlatformDivergence: 0.15, // 15%
    minSessionDuration: 30, // 30 seconds minimum
    maxSessionDuration: 7200, // 2 hours maximum
  },
  alerts: {
    enabled: true,
    thresholds: {
      varianceThreshold: 0.2, // 20% above target
      outlierThreshold: 2.0, // 2 standard deviations
      bucketImbalanceThreshold: 0.1, // 10% deviation from target
      platformDivergenceThreshold: 0.15, // 15% divergence
    },
    cooldown: 300000, // 5 minutes
  },
  processing: {
    batchSize: 100,
    refreshInterval: 10000, // 10 seconds
    maxDataPoints: 10000,
    enableRealTime: true,
  },
  export: {
    enabled: true,
    formats: ['json', 'csv', 'markdown'],
    includeCharts: true,
    compression: false,
  },
  ui: {
    chartType: 'area',
    showBuckets: true,
    showPlatforms: true,
    showAlerts: true,
    refreshRate: 5000, // 5 seconds
    maxDataPoints: 100,
  },
};

/**
 * Create safe session variance configuration
 */
export function createSafeSessionVarianceConfig(
  config?: Partial<SessionVarianceConfig>
): SessionVarianceConfig {
  const merged = { ...DEFAULT_SESSION_VARIANCE_CONFIG, ...config };
  
  // Validate with Zod
  const result = SessionVarianceConfigSchema.safeParse(merged);
  if (!result.success) {
    console.warn('Invalid session variance config:', result.error);
    return DEFAULT_SESSION_VARIANCE_CONFIG;
  }
  
  return result.data;
}

/**
 * Validate session variance configuration
 */
export function isValidSessionVarianceConfig(
  config: unknown
): config is SessionVarianceConfig {
  return SessionVarianceConfigSchema.safeParse(config).success;
}

/**
 * Get session bucket by duration
 */
export function getSessionBucket(
  duration: number,
  config: SessionVarianceConfig = DEFAULT_SESSION_VARIANCE_CONFIG
): SessionBucket {
  if (duration < config.buckets.short.maxDuration) {
    return 'short';
  } else if (duration < config.buckets.medium.maxDuration) {
    return 'medium';
  } else {
    return 'long';
  }
}

/**
 * Validate session data
 */
export function validateSessionData(
  session: unknown
): session is SessionData {
  return SessionDataSchema.safeParse(session).success;
}

/**
 * Create safe session data
 */
export function createSafeSessionData(
  session: Partial<SessionData> = {}
): SessionData {
  const now = Date.now();
  const duration = session.duration || 0;
  
  const safe: SessionData = {
    id: session.id || `session_${now}_${Math.random().toString(36).substr(2, 9)}`,
    platform: session.platform || 'desktop',
    startTime: session.startTime || now - duration * 1000,
    endTime: session.endTime || now,
    duration,
    bucket: getSessionBucket(duration),
    userId: session.userId,
    metadata: session.metadata || {},
  };
  
  return SessionDataSchema.parse(safe);
}

/**
 * Calculate session statistics
 */
export function calculateSessionStatistics(
  sessions: SessionData[]
): SessionStatistics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageDuration: 0,
      medianDuration: 0,
      standardDeviation: 0,
      variance: 0,
      minDuration: 0,
      maxDuration: 0,
      bucketDistribution: { short: 0, medium: 0, long: 0 },
      platformDistribution: { desktop: 0, mobile: 0 },
      platformStats: { desktop: { ...EMPTY_STATS }, mobile: { ...EMPTY_STATS } },
    };
  }
  
  const durations = sessions.map(s => s.duration).sort((a, b) => a - b);
  const totalSessions = sessions.length;
  const averageDuration = durations.reduce((sum, d) => sum + d, 0) / totalSessions;
  const medianDuration = durations[Math.floor(totalSessions / 2)];
  const minDuration = durations[0];
  const maxDuration = durations[durations.length - 1];
  
  // Calculate variance and standard deviation
  const variance = durations.reduce((sum, d) => sum + Math.pow(d - averageDuration, 2), 0) / totalSessions;
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate bucket distribution
  const bucketDistribution = sessions.reduce((acc, session) => {
    acc[session.bucket]++;
    return acc;
  }, { short: 0, medium: 0, long: 0 });
  
  // Calculate platform distribution
  const platformDistribution = sessions.reduce((acc, session) => {
    acc[session.platform]++;
    return acc;
  }, { desktop: 0, mobile: 0 });
  
  // Calculate platform-specific statistics
  const platformStats = {
    desktop: calculateSessionStatistics(sessions.filter(s => s.platform === 'desktop')),
    mobile: calculateSessionStatistics(sessions.filter(s => s.platform === 'mobile')),
  };
  
  return {
    totalSessions,
    averageDuration,
    medianDuration,
    standardDeviation,
    variance,
    minDuration,
    maxDuration,
    bucketDistribution,
    platformDistribution,
    platformStats,
  };
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Calculate percentage difference
 */
export function calculatePercentageDifference(
  actual: number,
  expected: number
): number {
  if (expected === 0) return 0;
  return ((actual - expected) / expected) * 100;
}

/**
 * Check if variance exceeds threshold
 */
export function isVarianceExcessive(
  variance: number,
  targetVariance: number,
  threshold: number
): boolean {
  return variance > targetVariance * (1 + threshold);
}

/**
 * Check if session is an outlier
 */
export function isSessionOutlier(
  duration: number,
  mean: number,
  stdDev: number,
  threshold: number
): boolean {
  return Math.abs(duration - mean) > stdDev * threshold;
}

/**
 * Check bucket distribution balance
 */
export function isBucketDistributionBalanced(
  actual: Record<SessionBucket, number>,
  target: Record<SessionBucket, number>,
  threshold: number
): boolean {
  const total = Object.values(actual).reduce((sum, count) => sum + count, 0);
  if (total === 0) return true;
  
  return Object.entries(target).every(([bucket, targetPercentage]) => {
    const actualCount = actual[bucket as SessionBucket] || 0;
    const actualPercentage = actualCount / total;
    const difference = Math.abs(actualPercentage - targetPercentage);
    return difference <= threshold;
  });
}

/**
 * Check platform distribution balance
 */
export function isPlatformDistributionBalanced(
  actual: Record<Platform, number>,
  target: Record<Platform, number>,
  threshold: number
): boolean {
  const total = Object.values(actual).reduce((sum, count) => sum + count, 0);
  if (total === 0) return true;
  
  return Object.entries(target).every(([platform, targetPercentage]) => {
    const actualCount = actual[platform as Platform] || 0;
    const actualPercentage = actualCount / total;
    const difference = Math.abs(actualPercentage - targetPercentage);
    return difference <= threshold;
  });
}
