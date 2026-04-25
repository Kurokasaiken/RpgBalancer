/**
 * Tutorial Skip Configuration - NP-219
 * 
 * Config-first tutorial skip system for returning users.
 * 
 * @since 2026-01-24
 */

import { z } from 'zod';

/**
 * Skip decision types
 */
export const SkipDecisionSchema = z.enum(['skip', 'play', 'defer']);
export type SkipDecision = z.infer<typeof SkipDecisionSchema>;

/**
 * Skip reason types
 */
export const SkipReasonSchema = z.enum([
  'returning_user',
  'experienced_player',
  'already_completed',
  'time_pressure',
  'not_interested',
  'technical_issue',
  'other',
]);
export type SkipReason = z.infer<typeof SkipReasonSchema>;

/**
 * User experience level
 */
export const ExperienceLevelSchema = z.enum(['new', 'returning', 'experienced', 'expert']);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

/**
 * Skip prompt configuration
 */
export const SkipPromptConfigSchema = z.object({
  showForReturningUsers: z.boolean().default(true),
  showForExperiencedUsers: z.boolean().default(true),
  showAfterCompletions: z.number().default(0),
  showAfterSessions: z.number().default(0),
  showAfterTimeInSession: z.number().default(30000), // 30 seconds
  maxShowFrequency: z.number().default(1), // Max times per session
  cooldownPeriod: z.number().default(300000), // 5 minutes
  allowDefer: z.boolean().default(true),
  allowReplay: z.boolean().default(true),
  allowForcePlay: z.boolean().default(true),
  customMessage: z.string().optional(),
  customTitle: z.string().optional(),
});

export type SkipPromptConfig = z.infer<typeof SkipPromptConfigSchema>;

/**
 * Skip tracking data
 */
export const SkipTrackingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  tutorialId: z.string(),
  skipDecision: SkipDecisionSchema,
  skipReason: SkipReasonSchema.optional(),
  experienceLevel: ExperienceLevelSchema,
  sessionCount: z.number(),
  completionCount: z.number(),
  timeInSession: z.number(),
  timestamp: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SkipTracking = z.infer<typeof SkipTrackingSchema>;

/**
 * Skip analytics data
 */
export const SkipAnalyticsSchema = z.object({
  totalSkipRequests: z.number(),
  skipDecisions: z.record(SkipDecisionSchema, z.number()),
  skipReasons: z.record(SkipReasonSchema, z.number()),
  experienceLevels: z.record(ExperienceLevelSchema, z.number()),
  skipRates: z.object({
    overall: z.number(),
    byExperienceLevel: z.record(ExperienceLevelSchema, z.number()),
    bySessionCount: z.record(z.string(), z.number()),
  }),
  averageTimeToDecision: z.number(),
  completionRates: z.object({
    skipped: z.number(),
    played: z.number(),
    deferred: z.number(),
  }),
  replayRates: z.object({
    skippedThenPlayed: z.number(),
    skippedThenDeferred: z.number(),
  }),
});

export type SkipAnalytics = z.infer<typeof SkipAnalyticsSchema>;

/**
 * Tutorial skip configuration
 */
export const TutorialSkipConfigSchema = z.object({
  detection: z.object({
    enableLocalStorage: z.boolean().default(true),
    enableSessionTracking: z.boolean().default(true),
    returningUserThreshold: z.number().default(2), // sessions
    experiencedUserThreshold: z.number().default(5), // sessions
    completionThreshold: z.number().default(1), // completions
    timeThreshold: z.number().default(60000), // 1 minute
    maxSessionsForTracking: z.number().default(100),
  }),
  
  prompt: SkipPromptConfigSchema,
  
  analytics: z.object({
    enableTracking: z.boolean().default(true),
    retentionDays: z.number().default(30),
    aggregateData: z.boolean().default(true),
    exportFormat: z.enum(['json', 'csv']).default('json'),
  }),
  
  ui: z.object({
    showProgressBar: z.boolean().default(true),
    showExperienceLevel: z.boolean().default(true),
    showSessionCount: z.boolean().default(true),
    allowCustomization: z.boolean().default(false),
    animationDuration: z.number().default(300),
    modalStyle: z.enum(['modal', 'overlay', 'sidebar']).default('modal'),
  }),
  
  replay: z.object({
    enabled: z.boolean().default(true),
    maxReplayAttempts: z.number().default(3),
    replayCooldown: z.number().default(60000), // 1 minute
    preserveProgress: z.boolean().default(true),
    showReplayOption: z.boolean().default(true),
  }),
  
  telemetry: z.object({
    enableEvents: z.boolean().default(true),
    eventName: z.string().default('tutorial_skip_decision'),
    includeMetadata: z.boolean().default(true),
    batchEvents: z.boolean().default(false),
    batchSize: z.number().default(10),
  }),
});

export type TutorialSkipConfig = z.infer<typeof TutorialSkipConfigSchema>;

/**
 * Default configuration
 */
export const DEFAULT_TUTORIAL_SKIP_CONFIG: TutorialSkipConfig = {
  detection: {
    enableLocalStorage: true,
    enableSessionTracking: true,
    returningUserThreshold: 2,
    experiencedUserThreshold: 5,
    completionThreshold: 1,
    timeThreshold: 60000,
    maxSessionsForTracking: 100,
  },
  
  prompt: {
    showForReturningUsers: true,
    showForExperiencedUsers: true,
    showAfterCompletions: 0,
    showAfterSessions: 0,
    showAfterTimeInSession: 30000,
    maxShowFrequency: 1,
    cooldownPeriod: 300000,
    allowDefer: true,
    allowReplay: true,
    allowForcePlay: true,
  },
  
  analytics: {
    enableTracking: true,
    retentionDays: 30,
    aggregateData: true,
    exportFormat: 'json',
  },
  
  ui: {
    showProgressBar: true,
    showExperienceLevel: true,
    showSessionCount: true,
    allowCustomization: false,
    animationDuration: 300,
    modalStyle: 'modal',
  },
  
  replay: {
    enabled: true,
    maxReplayAttempts: 3,
    replayCooldown: 60000,
    preserveProgress: true,
    showReplayOption: true,
  },
  
  telemetry: {
    enableEvents: true,
    eventName: 'tutorial_skip_decision',
    includeMetadata: true,
    batchEvents: false,
    batchSize: 10,
  },
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  USER_DATA: 'tutorial_skip_user_data',
  SESSION_DATA: 'tutorial_skip_session_data',
  ANALYTICS: 'tutorial_skip_analytics',
  CONFIG: 'tutorial_skip_config',
} as const;

/**
 * Generate unique tracking ID
 */
export function generateTrackingId(): string {
  return `skip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user is returning based on session count
 */
export function isReturningUser(sessionCount: number, config: TutorialSkipConfig): boolean {
  return sessionCount >= config.detection.returningUserThreshold;
}

/**
 * Check if user is experienced based on session count
 */
export function isExperiencedUser(sessionCount: number, config: TutorialSkipConfig): boolean {
  return sessionCount >= config.detection.experiencedUserThreshold;
}

/**
 * Check if user has completed tutorial before
 */
export function hasCompletedTutorial(completionCount: number, config: TutorialSkipConfig): boolean {
  return completionCount >= config.detection.completionThreshold;
}

/**
 * Check if user has spent enough time in current session
 */
export function hasSpentEnoughTime(timeInSession: number, config: TutorialSkipConfig): boolean {
  return timeInSession >= config.detection.timeThreshold;
}

/**
 * Determine if skip prompt should be shown
 */
export function shouldShowSkipPrompt(
  userData: {
    sessionCount: number;
    completionCount: number;
    timeInSession: number;
    lastSkipTime?: number;
    skipCount: number;
  },
  config: TutorialSkipConfig
): boolean {
  const { sessionCount, completionCount, timeInSession, lastSkipTime, skipCount } = userData;
  
  // Check if user qualifies for skip prompt
  const qualifiesForSkip = 
    isReturningUser(sessionCount, config) ||
    isExperiencedUser(sessionCount, config) ||
    hasCompletedTutorial(completionCount, config) ||
    hasSpentEnoughTime(timeInSession, config);
  
  if (!qualifiesForSkip) {
    return false;
  }
  
  // Check frequency limits
  if (skipCount >= config.prompt.maxShowFrequency) {
    return false;
  }
  
  // Check cooldown period
  if (lastSkipTime && Date.now() - lastSkipTime < config.prompt.cooldownPeriod) {
    return false;
  }
  
  // Check if returning users should see prompt
  if (isReturningUser(sessionCount, config) && !config.prompt.showForReturningUsers) {
    return false;
  }
  
  // Check if experienced users should see prompt
  if (isExperiencedUser(sessionCount, config) && !config.prompt.showForExperiencedUsers) {
    return false;
  }
  
  // Check completion threshold
  if (completionCount < config.prompt.showAfterCompletions) {
    return false;
  }
  
  // Check session threshold
  if (sessionCount < config.prompt.showAfterSessions) {
    return false;
  }
  
  // Check time threshold
  if (timeInSession < config.prompt.showAfterTimeInSession) {
    return false;
  }
  
  return true;
}

/**
 * Get experience level based on session count
 */
export function getExperienceLevel(sessionCount: number, config: TutorialSkipConfig): ExperienceLevel {
  if (sessionCount >= config.detection.experiencedUserThreshold) {
    return 'expert';
  } else if (sessionCount >= config.detection.returningUserThreshold) {
    return 'experienced';
  } else {
    return 'returning';
  }
}

/**
 * Format session count for display
 */
export function formatSessionCount(count: number): string {
  if (count === 1) return '1st session';
  if (count === 2) return '2nd session';
  if (count === 3) return '3rd session';
  return `${count}th session`;
}

/**
 * Format time for display
 */
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate skip rate
 */
export function calculateSkipRate(skipCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return (skipCount / totalCount) * 100;
}

/**
 * Generate skip analytics summary
 */
export function generateSkipSummary(trackingData: SkipTracking[]): SkipAnalytics {
  const totalSkipRequests = trackingData.length;
  
  const skipDecisions = trackingData.reduce((acc, item) => {
    acc[item.skipDecision] = (acc[item.skipDecision] || 0) + 1;
    return acc;
  }, {} as Record<SkipDecision, number>);
  
  const skipReasons = trackingData.reduce((acc, item) => {
    if (item.skipReason) {
      acc[item.skipReason] = (acc[item.skipReason] || 0) + 1;
    }
    return acc;
  }, {} as Record<SkipReason, number>);
  
  const experienceLevels = trackingData.reduce((acc, item) => {
    acc[item.experienceLevel] = (acc[item.experienceLevel] || 0) + 1;
    return acc;
  }, {} as Record<ExperienceLevel, number>);
  
  const skipRates = {
    overall: calculateSkipRate(skipDecisions.skip || 0, totalSkipRequests),
    byExperienceLevel: Object.keys(experienceLevels).reduce((acc, level) => {
      const levelKey = level as ExperienceLevel;
      const levelData = trackingData.filter(item => item.experienceLevel === levelKey);
      const levelSkips = levelData.filter(item => item.skipDecision === 'skip').length;
      acc[levelKey] = calculateSkipRate(levelSkips, levelData.length);
      return acc;
    }, {} as Record<ExperienceLevel, number>),
    bySessionCount: Object.keys(trackingData.reduce((acc, item) => {
      const sessionKey = `${item.sessionCount}_sessions`;
      acc[sessionKey] = (acc[sessionKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).reduce((acc, sessionKey) => {
      const sessionCount = parseInt(sessionKey.split('_')[0]);
      const sessionData = trackingData.filter(item => item.sessionCount === sessionCount);
      const sessionSkips = sessionData.filter(item => item.skipDecision === 'skip').length;
      acc[sessionKey] = calculateSkipRate(sessionSkips, sessionData.length);
      return acc;
    }, {} as Record<string, number>),
  };
  
  const averageTimeToDecision = trackingData.length > 0 
    ? trackingData.reduce((sum, item) => sum + item.timeInSession, 0) / trackingData.length
    : 0;
  
  const completionRates = {
    skipped: skipDecisions.skip || 0,
    played: skipDecisions.play || 0,
    deferred: skipDecisions.defer || 0,
  };
  
  const replayRates = {
    skippedThenPlayed: 0, // Would need follow-up tracking
    skippedThenDeferred: 0, // Would need follow-up tracking
  };
  
  return {
    totalSkipRequests,
    skipDecisions,
    skipReasons,
    experienceLevels,
    skipRates,
    averageTimeToDecision,
    completionRates,
    replayRates,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<TutorialSkipConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.detection) {
    if (config.detection.returningUserThreshold < 1) {
      errors.push('Returning user threshold must be at least 1');
    }
    if (config.detection.experiencedUserThreshold <= config.detection.returningUserThreshold) {
      errors.push('Experienced user threshold must be greater than returning user threshold');
    }
    if (config.detection.completionThreshold < 0) {
      errors.push('Completion threshold cannot be negative');
    }
    if (config.detection.timeThreshold < 0) {
      errors.push('Time threshold cannot be negative');
    }
  }
  
  if (config.prompt) {
    if (config.prompt.maxShowFrequency < 1) {
      errors.push('Max show frequency must be at least 1');
    }
    if (config.prompt.cooldownPeriod < 0) {
      errors.push('Cooldown period cannot be negative');
    }
  }
  
  if (config.replay) {
    if (config.replay.maxReplayAttempts < 0) {
      errors.push('Max replay attempts cannot be negative');
    }
    if (config.replay.replayCooldown < 0) {
      errors.push('Replay cooldown cannot be negative');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
