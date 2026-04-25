/**
 * Idle Village Quest Decision Feed Telemetry Configuration
 * 
 * Comprehensive telemetry system for quest decisions with pipeline processing,
 * schema validation, and fallback mechanisms.
 * 
 * @module questDecisionTelemetryConfig
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Quest decision types
 */
export enum QuestDecisionType {
  QUEST_ACCEPT = 'quest_accept',
  QUEST_REJECT = 'quest_reject',
  QUEST_ABANDON = 'quest_abandon',
  QUEST_COMPLETE = 'quest_complete',
  QUEST_FAIL = 'quest_fail',
  QUEST_PAUSE = 'quest_pause',
  QUEST_RESUME = 'quest_resume',
  QUEST_SKIP = 'quest_skip',
  QUEST_RETRY = 'quest_retry',
  QUEST_MODIFY = 'quest_modify',
}

/**
 * Decision source types
 */
export enum DecisionSource {
  PLAYER_CHOICE = 'player_choice',
  AUTO_DECISION = 'auto_decision',
  SYSTEM_OVERRIDE = 'system_override',
  TIME_EXPIRED = 'time_expired',
  CONDITION_MET = 'condition_met',
  CONDITION_FAILED = 'condition_failed',
  EXTERNAL_TRIGGER = 'external_trigger',
  AI_SUGGESTION = 'ai_suggestion',
}

/**
 * Decision confidence levels
 */
export enum DecisionConfidence {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
  CERTAIN = 'certain',
}

/**
 * Quest difficulty levels
 */
export enum QuestDifficulty {
  TRIVIAL = 'trivial',
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
  EXTREME = 'extreme',
  IMPOSSIBLE = 'impossible',
}

/**
 * Quest categories
 */
export enum QuestCategory {
  MAIN_STORY = 'main_story',
  SIDE_STORY = 'side_story',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SPECIAL = 'special',
  EVENT = 'event',
  TUTORIAL = 'tutorial',
  CHALLENGE = 'challenge',
  SOCIAL = 'social',
}

/**
 * Quest decision context
 */
export interface QuestDecisionContext {
  /** Current player level */
  playerLevel: number;
  /** Player experience points */
  playerExperience: number;
  /** Available resources */
  availableResources: Record<string, number>;
  /** Active quests count */
  activeQuestsCount: number;
  /** Completed quests count */
  completedQuestsCount: number;
  /** Failed quests count */
  failedQuestsCount: number;
  /** Current game time */
  gameTime: number;
  /** Session duration */
  sessionDuration: number;
  /** Player location */
  playerLocation: string;
  /** Weather conditions */
  weatherConditions?: string;
  /** Time of day */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Device type */
  deviceType: 'mobile' | 'desktop' | 'tablet';
  /** Network quality */
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  /** Battery level (mobile) */
  batteryLevel?: number;
}

/**
 * Quest decision factors
 */
export interface QuestDecisionFactors {
  /** Time pressure (0-1) */
  timePressure: number;
  /** Resource pressure (0-1) */
  resourcePressure: number;
  /** Risk tolerance (0-1) */
  riskTolerance: number;
  /** Reward attractiveness (0-1) */
  rewardAttractiveness: number;
  /** Social influence (0-1) */
  socialInfluence: number;
  /** Previous success rate (0-1) */
  previousSuccessRate: number;
  /** Difficulty preference (0-1) */
  difficultyPreference: number;
  /** Time availability (0-1) */
  timeAvailability: number;
  /** Motivation level (0-1) */
  motivationLevel: number;
  /** Fatigue level (0-1) */
  fatigueLevel: number;
}

/**
 * Quest decision outcome
 */
export interface QuestDecisionOutcome {
  /** Decision timestamp */
  timestamp: number;
  /** Decision type */
  decisionType: QuestDecisionType;
  /** Decision source */
  source: DecisionSource;
  /** Decision confidence */
  confidence: DecisionConfidence;
  /** Processing time (ms) */
  processingTime: number;
  /** Was the decision reverted */
  reverted: boolean;
  /** Revert reason (if applicable) */
  revertReason?: string;
  /** Time until revert (ms) */
  timeUntilRevert?: number;
  /** Final decision */
  finalDecision: QuestDecisionType;
  /** Decision justification */
  justification?: string;
}

/**
 * Quest decision metrics
 */
export interface QuestDecisionMetrics {
  /** Total decisions made */
  totalDecisions: number;
  /** Decisions by type */
  decisionsByType: Record<QuestDecisionType, number>;
  /** Average processing time */
  avgProcessingTime: number;
  /** Average confidence */
  avgConfidence: number;
  /** Revert rate */
  revertRate: number;
  /** Success rate */
  successRate: number;
  /** Completion rate */
  completionRate: number;
  /** Abandonment rate */
  abandonmentRate: number;
  /** Time to decision (ms) */
  timeToDecision: number;
  /** Decision frequency (per hour) */
  decisionFrequency: number;
}

/**
 * Quest decision telemetry event
 */
export interface QuestDecisionTelemetryEvent {
  /** Unique event ID */
  eventId: string;
  /** Quest ID */
  questId: string;
  /** Quest name */
  questName: string;
  /** Quest category */
  questCategory: QuestCategory;
  /** Quest difficulty */
  questDifficulty: QuestDifficulty;
  /** Quest duration (ms) */
  questDuration?: number;
  /** Decision context */
  context: QuestDecisionContext;
  /** Decision factors */
  factors: QuestDecisionFactors;
  /** Decision outcome */
  outcome: QuestDecisionOutcome;
  /** Quest requirements */
  questRequirements: {
    level: number;
    resources: Record<string, number>;
    prerequisites: string[];
    timeLimit?: number;
  };
  /** Quest rewards */
  questRewards: {
    experience: number;
    resources: Record<string, number>;
    items: string[];
    reputation: number;
  };
  /** Player state before decision */
  playerStateBefore: {
    health: number;
    mana: number;
    stamina: number;
    inventory: Record<string, number>;
    skills: Record<string, number>;
  };
  /** Player state after decision */
  playerStateAfter: {
    health: number;
    mana: number;
    stamina: number;
    inventory: Record<string, number>;
    skills: Record<string, number>;
  };
  /** Event metadata */
  metadata: {
    sessionId: string;
    userId: string;
    version: string;
    buildNumber: string;
    platform: string;
    timezone: string;
    language: string;
    region: string;
  };
}

/**
 * Telemetry pipeline configuration
 */
export interface QuestDecisionTelemetryPipelineConfig {
  /** Pipeline enabled */
  enabled: boolean;
  /** Batch processing */
  batchProcessing: {
    enabled: boolean;
    batchSize: number;
    batchTimeout: number; // ms
    maxRetries: number;
  };
  /** Data validation */
  validation: {
    enabled: boolean;
    strictMode: boolean;
    sanitizeData: boolean;
    validateSchema: boolean;
  };
  /** Storage configuration */
  storage: {
    type: 'local' | 'remote' | 'hybrid';
    local: {
      maxSize: number; // bytes
      maxEvents: number;
      ttl: number; // ms
    };
    remote: {
      endpoint: string;
      apiKey: string;
      timeout: number; // ms
      retryDelay: number; // ms
    };
  };
  /** Fallback configuration */
  fallback: {
    enabled: boolean;
    localBackup: boolean;
    retryOnFailure: boolean;
    maxRetries: number;
    retryDelay: number; // ms
    exponentialBackoff: boolean;
  };
  /** Sampling configuration */
  sampling: {
    enabled: boolean;
    rate: number; // 0-1
    stratified: boolean;
    byQuestType: boolean;
    byDecisionType: boolean;
  };
  /** Privacy configuration */
  privacy: {
    anonymizeData: boolean;
    hashUserIds: boolean;
    stripPersonalInfo: boolean;
    dataRetention: number; // days
    gdprCompliant: boolean;
  };
}

/**
 * Telemetry feed configuration
 */
export interface QuestDecisionTelemetryFeedConfig {
  /** Feed enabled */
  enabled: boolean;
  /** Real-time updates */
  realTime: {
    enabled: boolean;
    updateInterval: number; // ms
    bufferSize: number;
    maxLatency: number; // ms
  };
  /** Event filtering */
  filtering: {
    enabled: boolean;
    includeTypes: QuestDecisionType[];
    excludeTypes: QuestDecisionType[];
    includeCategories: QuestCategory[];
    excludeCategories: QuestCategory[];
    minConfidence: DecisionConfidence;
    dateRange?: {
      start: number;
      end: number;
    };
  };
  /** Aggregation */
  aggregation: {
    enabled: boolean;
    windowSize: number; // ms
    metrics: string[];
    groupBy: string[];
  };
  /** Alerting */
  alerting: {
    enabled: boolean;
    thresholds: {
      revertRate: number;
      processingTime: number;
      errorRate: number;
      abandonmentRate: number;
    };
    notifications: {
      email: boolean;
      webhook: boolean;
      inApp: boolean;
    };
  };
}

/**
 * Default pipeline configuration
 */
export const DEFAULT_QUEST_DECISION_TELEMETRY_PIPELINE_CONFIG: QuestDecisionTelemetryPipelineConfig = {
  enabled: true,
  batchProcessing: {
    enabled: true,
    batchSize: 50,
    batchTimeout: 5000,
    maxRetries: 3,
  },
  validation: {
    enabled: true,
    strictMode: false,
    sanitizeData: true,
    validateSchema: true,
  },
  storage: {
    type: 'hybrid',
    local: {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEvents: 10000,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    },
    remote: {
      endpoint: '/api/telemetry/quest-decisions',
      apiKey: '',
      timeout: 10000,
      retryDelay: 1000,
    },
  },
  fallback: {
    enabled: true,
    localBackup: true,
    retryOnFailure: true,
    maxRetries: 5,
    retryDelay: 2000,
    exponentialBackoff: true,
  },
  sampling: {
    enabled: false,
    rate: 1.0,
    stratified: false,
    byQuestType: false,
    byDecisionType: false,
  },
  privacy: {
    anonymizeData: true,
    hashUserIds: true,
    stripPersonalInfo: true,
    dataRetention: 90,
    gdprCompliant: true,
  },
};

/**
 * Default feed configuration
 */
export const DEFAULT_QUEST_DECISION_TELEMETRY_FEED_CONFIG: QuestDecisionTelemetryFeedConfig = {
  enabled: true,
  realTime: {
    enabled: true,
    updateInterval: 1000,
    bufferSize: 1000,
    maxLatency: 5000,
  },
  filtering: {
    enabled: true,
    includeTypes: Object.values(QuestDecisionType),
    excludeTypes: [],
    includeCategories: Object.values(QuestCategory),
    excludeCategories: [],
    minConfidence: DecisionConfidence.LOW,
  },
  aggregation: {
    enabled: true,
    windowSize: 60000, // 1 minute
    metrics: ['count', 'avg_confidence', 'revert_rate', 'success_rate'],
    groupBy: ['quest_category', 'decision_type'],
  },
  alerting: {
    enabled: true,
    thresholds: {
      revertRate: 0.1,
      processingTime: 5000,
      errorRate: 0.05,
      abandonmentRate: 0.2,
    },
    notifications: {
      email: false,
      webhook: false,
      inApp: true,
    },
  },
};

/**
 * Zod schemas for validation
 */
export const QuestDecisionContextSchema = z.object({
  playerLevel: z.number().min(1).max(100),
  playerExperience: z.number().min(0),
  availableResources: z.record(z.string(), z.number().min(0)),
  activeQuestsCount: z.number().min(0),
  completedQuestsCount: z.number().min(0),
  failedQuestsCount: z.number().min(0),
  gameTime: z.number().min(0),
  sessionDuration: z.number().min(0),
  playerLocation: z.string().min(1),
  weatherConditions: z.string().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']),
  networkQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
  batteryLevel: z.number().min(0).max(100).optional(),
});

export const QuestDecisionFactorsSchema = z.object({
  timePressure: z.number().min(0).max(1),
  resourcePressure: z.number().min(0).max(1),
  riskTolerance: z.number().min(0).max(1),
  rewardAttractiveness: z.number().min(0).max(1),
  socialInfluence: z.number().min(0).max(1),
  previousSuccessRate: z.number().min(0).max(1),
  difficultyPreference: z.number().min(0).max(1),
  timeAvailability: z.number().min(0).max(1),
  motivationLevel: z.number().min(0).max(1),
  fatigueLevel: z.number().min(0).max(1),
});

export const QuestDecisionOutcomeSchema = z.object({
  timestamp: z.number().min(0),
  decisionType: z.nativeEnum(QuestDecisionType),
  source: z.nativeEnum(DecisionSource),
  confidence: z.nativeEnum(DecisionConfidence),
  processingTime: z.number().min(0),
  reverted: z.boolean(),
  revertReason: z.string().optional(),
  timeUntilRevert: z.number().min(0).optional(),
  finalDecision: z.nativeEnum(QuestDecisionType),
  justification: z.string().optional(),
});

export const QuestDecisionMetricsSchema = z.object({
  totalDecisions: z.number().min(0),
  decisionsByType: z.record(z.nativeEnum(QuestDecisionType), z.number().min(0)),
  avgProcessingTime: z.number().min(0),
  avgConfidence: z.number().min(0).max(1),
  revertRate: z.number().min(0).max(1),
  successRate: z.number().min(0).max(1),
  completionRate: z.number().min(0).max(1),
  abandonmentRate: z.number().min(0).max(1),
  timeToDecision: z.number().min(0),
  decisionFrequency: z.number().min(0),
});

export const QuestDecisionTelemetryEventSchema = z.object({
  eventId: z.string().min(1),
  questId: z.string().min(1),
  questName: z.string().min(1),
  questCategory: z.nativeEnum(QuestCategory),
  questDifficulty: z.nativeEnum(QuestDifficulty),
  questDuration: z.number().min(0).optional(),
  context: QuestDecisionContextSchema,
  factors: QuestDecisionFactorsSchema,
  outcome: QuestDecisionOutcomeSchema,
  questRequirements: z.object({
    level: z.number().min(1),
    resources: z.record(z.string(), z.number().min(0)),
    prerequisites: z.array(z.string()),
    timeLimit: z.number().min(0).optional(),
  }),
  questRewards: z.object({
    experience: z.number().min(0),
    resources: z.record(z.string(), z.number().min(0)),
    items: z.array(z.string()),
    reputation: z.number(),
  }),
  playerStateBefore: z.object({
    health: z.number().min(0).max(100),
    mana: z.number().min(0).max(100),
    stamina: z.number().min(0).max(100),
    inventory: z.record(z.string(), z.number().min(0)),
    skills: z.record(z.string(), z.number().min(0).max(100)),
  }),
  playerStateAfter: z.object({
    health: z.number().min(0).max(100),
    mana: z.number().min(0).max(100),
    stamina: z.number().min(0).max(100),
    inventory: z.record(z.string(), z.number().min(0)),
    skills: z.record(z.string(), z.number().min(0).max(100)),
  }),
  metadata: z.object({
    sessionId: z.string().min(1),
    userId: z.string().min(1),
    version: z.string().min(1),
    buildNumber: z.string().min(1),
    platform: z.string().min(1),
    timezone: z.string().min(1),
    language: z.string().min(1),
    region: z.string().min(1),
  }),
});

export const QuestDecisionTelemetryPipelineConfigSchema = z.object({
  enabled: z.boolean(),
  batchProcessing: z.object({
    enabled: z.boolean(),
    batchSize: z.number().min(1).max(1000),
    batchTimeout: z.number().min(100).max(60000),
    maxRetries: z.number().min(0).max(10),
  }),
  validation: z.object({
    enabled: z.boolean(),
    strictMode: z.boolean(),
    sanitizeData: z.boolean(),
    validateSchema: z.boolean(),
  }),
  storage: z.object({
    type: z.enum(['local', 'remote', 'hybrid']),
    local: z.object({
      maxSize: z.number().min(1024).max(100 * 1024 * 1024),
      maxEvents: z.number().min(100).max(100000),
      ttl: z.number().min(60000).max(365 * 24 * 60 * 60 * 1000),
    }),
    remote: z.object({
      endpoint: z.string().url(),
      apiKey: z.string().min(1),
      timeout: z.number().min(1000).max(60000),
      retryDelay: z.number().min(100).max(10000),
    }),
  }),
  fallback: z.object({
    enabled: z.boolean(),
    localBackup: z.boolean(),
    retryOnFailure: z.boolean(),
    maxRetries: z.number().min(0).max(10),
    retryDelay: z.number().min(100).max(30000),
    exponentialBackoff: z.boolean(),
  }),
  sampling: z.object({
    enabled: z.boolean(),
    rate: z.number().min(0).max(1),
    stratified: z.boolean(),
    byQuestType: z.boolean(),
    byDecisionType: z.boolean(),
  }),
  privacy: z.object({
    anonymizeData: z.boolean(),
    hashUserIds: z.boolean(),
    stripPersonalInfo: z.boolean(),
    dataRetention: z.number().min(1).max(3650),
    gdprCompliant: z.boolean(),
  }),
});

export const QuestDecisionTelemetryFeedConfigSchema = z.object({
  enabled: z.boolean(),
  realTime: z.object({
    enabled: z.boolean(),
    updateInterval: z.number().min(100).max(60000),
    bufferSize: z.number().min(10).max(10000),
    maxLatency: z.number().min(1000).max(30000),
  }),
  filtering: z.object({
    enabled: z.boolean(),
    includeTypes: z.array(z.nativeEnum(QuestDecisionType)),
    excludeTypes: z.array(z.nativeEnum(QuestDecisionType)),
    includeCategories: z.array(z.nativeEnum(QuestCategory)),
    excludeCategories: z.array(z.nativeEnum(QuestCategory)),
    minConfidence: z.nativeEnum(DecisionConfidence),
    dateRange: z.object({
      start: z.number().min(0),
      end: z.number().min(0),
    }).optional(),
  }),
  aggregation: z.object({
    enabled: z.boolean(),
    windowSize: z.number().min(1000).max(3600000),
    metrics: z.array(z.string()),
    groupBy: z.array(z.string()),
  }),
  alerting: z.object({
    enabled: z.boolean(),
    thresholds: z.object({
      revertRate: z.number().min(0).max(1),
      processingTime: z.number().min(0),
      errorRate: z.number().min(0).max(1),
      abandonmentRate: z.number().min(0).max(1),
    }),
    notifications: z.object({
      email: z.boolean(),
      webhook: z.boolean(),
      inApp: z.boolean(),
    }),
  }),
});

/**
 * Type guards
 */
export function isValidQuestDecisionType(value: unknown): value is QuestDecisionType {
  return Object.values(QuestDecisionType).includes(value as QuestDecisionType);
}

export function isValidDecisionSource(value: unknown): value is DecisionSource {
  return Object.values(DecisionSource).includes(value as DecisionSource);
}

export function isValidDecisionConfidence(value: unknown): value is DecisionConfidence {
  return Object.values(DecisionConfidence).includes(value as DecisionConfidence);
}

export function isValidQuestDifficulty(value: unknown): value is QuestDifficulty {
  return Object.values(QuestDifficulty).includes(value as QuestDifficulty);
}

export function isValidQuestCategory(value: unknown): value is QuestCategory {
  return Object.values(QuestCategory).includes(value as QuestCategory);
}

/**
 * Utility functions
 */
export function createQuestDecisionEventId(): string {
  return `quest-decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateDecisionConfidence(factors: QuestDecisionFactors): DecisionConfidence {
  const avgFactor = Object.values(factors).reduce((sum, value) => sum + value, 0) / Object.keys(factors).length;
  
  if (avgFactor >= 0.9) return DecisionConfidence.CERTAIN;
  if (avgFactor >= 0.8) return DecisionConfidence.VERY_HIGH;
  if (avgFactor >= 0.6) return DecisionConfidence.HIGH;
  if (avgFactor >= 0.4) return DecisionConfidence.MEDIUM;
  if (avgFactor >= 0.2) return DecisionConfidence.LOW;
  return DecisionConfidence.VERY_LOW;
}

export function shouldSampleEvent(
  config: QuestDecisionTelemetryPipelineConfig['sampling'],
  event: QuestDecisionTelemetryEvent
): boolean {
  if (!config.enabled) return true;
  
  if (config.stratified) {
    // Stratified sampling based on quest type and decision type
    const typeWeight = config.byQuestType ? 0.5 : 1.0;
    const decisionWeight = config.byDecisionType ? 0.5 : 1.0;
    const adjustedRate = config.rate * typeWeight * decisionWeight;
    return Math.random() < adjustedRate;
  }
  
  return Math.random() < config.rate;
}

export function sanitizeTelemetryEvent(
  event: QuestDecisionTelemetryEvent,
  privacy: QuestDecisionTelemetryPipelineConfig['privacy']
): QuestDecisionTelemetryEvent {
  if (!privacy.anonymizeData) return event;
  
  const sanitized = { ...event };
  
  if (privacy.hashUserIds) {
    sanitized.metadata.userId = hashUserId(sanitized.metadata.userId);
  }
  
  if (privacy.stripPersonalInfo) {
    sanitized.context.playerLocation = sanitizeLocation(sanitized.context.playerLocation);
    sanitized.metadata.timezone = sanitizeTimezone(sanitized.metadata.timezone);
    sanitized.metadata.region = sanitizeRegion(sanitized.metadata.region);
  }
  
  return sanitized;
}

function hashUserId(userId: string): string {
  // Simple hash function for demonstration
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `user-${Math.abs(hash).toString(36)}`;
}

function sanitizeLocation(location: string): string {
  // Remove specific location details, keep general area
  return location.split(',')[0] || 'unknown';
}

function sanitizeTimezone(timezone: string): string {
  // Remove specific timezone, keep general region
  return timezone.split('/')[0] || 'unknown';
}

function sanitizeRegion(region: string): string {
  // Remove specific region, keep country
  return region.split('-')[0] || 'unknown';
}
