/**
 * Sync Conflict Resolver Configuration for Punch Club
 * 
 * Config-first system for handling offline sync conflicts with merge strategies,
 * priority rules, and validation to prevent data loss during synchronization.
 */

import { z } from 'zod';

/**
 * Sync conflict severity levels
 */
export const SyncConflictSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export type SyncConflictSeverity = z.infer<typeof SyncConflictSeveritySchema>;

/**
 * Merge strategy types for conflict resolution
 */
export const MergeStrategySchema = z.enum([
  'local_wins',      // Local data takes precedence
  'remote_wins',     // Remote data takes precedence  
  'most_recent',     // Most recently modified data wins
  'merge_fields',    // Field-level merge with priority rules
  'manual_resolve',  // Requires user intervention
  'auto_merge',      // Automatic intelligent merge
]);

export type MergeStrategy = z.infer<typeof MergeStrategySchema>;

/**
 * Data type categories for different merge rules
 */
export const DataTypeSchema = z.enum([
  'game_state',      // Punch Club game state
  'user_preferences', // User settings and preferences
  'telemetry',       // Analytics and telemetry data
  'progress_data',   // Training progress and achievements
  'combat_history',  // Combat results and history
]);

export type DataType = z.infer<typeof DataTypeSchema>;

/**
 * Conflict detection rules
 */
export const ConflictDetectionRuleSchema = z.object({
  /** Data type this rule applies to */
  dataType: DataTypeSchema,
  /** Field paths to check for conflicts (dot notation) */
  conflictFields: z.array(z.string()),
  /** Severity level for conflicts of this type */
  severity: SyncConflictSeveritySchema,
  /** Default merge strategy for this data type */
  defaultStrategy: MergeStrategySchema,
  /** Whether to auto-resolve or require user input */
  requireManualResolution: z.boolean(),
  /** Priority for this data type when merging */
  priority: z.number().min(1).max(10),
});

export type ConflictDetectionRule = z.infer<typeof ConflictDetectionRuleSchema>;

/**
 * Field-level merge configuration
 */
export const FieldMergeConfigSchema = z.object({
  /** Field path (dot notation) */
  fieldPath: z.string(),
  /** Merge strategy for this specific field */
  strategy: MergeStrategySchema,
  /** Priority when merging this field */
  priority: z.number().min(1).max(10).default(5),
  /** Validation function name for this field */
  validator: z.string().optional(),
  /** Whether this field can be safely merged automatically */
  autoMergeSafe: z.boolean(),
});

export type FieldMergeConfig = z.infer<typeof FieldMergeConfigSchema>;

/**
 * Sync conflict event data
 */
export const SyncConflictEventSchema = z.object({
  /** Unique conflict identifier */
  conflictId: z.string(),
  /** Data type where conflict occurred */
  dataType: DataTypeSchema,
  /** Severity level of the conflict */
  severity: SyncConflictSeveritySchema,
  /** Local version of the data */
  localData: z.record(z.string(), z.unknown()),
  /** Remote version of the data */
  remoteData: z.record(z.string(), z.unknown()),
  /** Timestamp when local data was last modified */
  localTimestamp: z.number(),
  /** Timestamp when remote data was last modified */
  remoteTimestamp: z.number(),
  /** Specific fields that are in conflict */
  conflictFields: z.array(z.string()),
  /** Recommended merge strategy */
  recommendedStrategy: MergeStrategySchema,
  /** Whether this conflict requires manual resolution */
  requiresManualResolution: z.boolean(),
  /** Context information about the conflict */
  context: z.record(z.string(), z.unknown()).optional(),
});

export type SyncConflictEvent = z.infer<typeof SyncConflictEventSchema>;

/**
 * Conflict resolution result
 */
export const ConflictResolutionResultSchema = z.object({
  /** Conflict identifier */
  conflictId: z.string(),
  /** Strategy used for resolution */
  strategy: MergeStrategySchema,
  /** Whether resolution was successful */
  success: z.boolean(),
  /** Merged/selected data */
  resolvedData: z.record(z.string(), z.unknown()),
  /** Time taken to resolve (milliseconds) */
  resolutionTime: z.number(),
  /** Whether user intervention was required */
  requiredManualResolution: z.boolean(),
  /** Fields that were merged */
  mergedFields: z.array(z.string()).optional(),
  /** Fields that were overwritten */
  overwrittenFields: z.array(z.string()).optional(),
  /** Any errors during resolution */
  errors: z.array(z.string()).optional(),
  /** Resolution timestamp */
  resolvedAt: z.number(),
});

export type ConflictResolutionResult = z.infer<typeof ConflictResolutionResultSchema>;

/**
 * Main sync conflict resolver configuration
 */
export const SyncConflictResolverConfigSchema = z.object({
  /** Global settings */
  global: z.object({
    /** Enable automatic conflict detection */
    enableAutoDetection: z.boolean().default(true),
    /** Enable automatic resolution for safe conflicts */
    enableAutoResolution: z.boolean().default(true),
    /** Maximum time to wait for manual resolution (milliseconds) */
    manualResolutionTimeout: z.number().default(30000), // 30 seconds
    /** Enable conflict logging and telemetry */
    enableTelemetry: z.boolean().default(true),
    /** Maximum number of conflicts to track */
    maxConflictHistory: z.number().default(100),
  }).default({
    enableAutoDetection: true,
    enableAutoResolution: true,
    manualResolutionTimeout: 30000,
    enableTelemetry: true,
    maxConflictHistory: 100,
  }),

  /** Conflict detection rules by data type */
  detectionRules: z.array(ConflictDetectionRuleSchema).default([]),

  /** Field-level merge configurations */
  fieldMergeConfigs: z.array(FieldMergeConfigSchema).default([]),

  /** Priority rules for data types */
  priorityRules: z.record(DataTypeSchema, z.number().min(1).max(10)).default({
    game_state: 9,
    user_preferences: 3,
    telemetry: 2,
    progress_data: 7,
    combat_history: 6,
  }),

  /** Merge strategy preferences by severity */
  strategyBySeverity: z.record(SyncConflictSeveritySchema, MergeStrategySchema).default({
    low: 'auto_merge',
    medium: 'most_recent',
    high: 'merge_fields',
    critical: 'manual_resolve',
  }),

  /** Validation settings */
  validation: z.object({
    /** Enable data integrity validation after merge */
    enableIntegrityCheck: z.boolean().default(true),
    /** Enable schema validation for resolved data */
    enableSchemaValidation: z.boolean().default(true),
    /** Maximum data size for auto-merge (bytes) */
    maxAutoMergeSize: z.number().default(1024 * 1024), // 1MB
  }).default({
    enableIntegrityCheck: true,
    enableSchemaValidation: true,
    maxAutoMergeSize: 1024 * 1024,
  }),
});

export type SyncConflictResolverConfig = z.infer<typeof SyncConflictResolverConfigSchema>;

/**
 * Default conflict detection rules for Punch Club
 */
export const DEFAULT_DETECTION_RULES: ConflictDetectionRule[] = [
  {
    dataType: 'game_state',
    conflictFields: [
      'player.stats',
      'player.level',
      'player.experience',
      'training.currentExercise',
      'inCombat',
    ],
    severity: 'high',
    defaultStrategy: 'most_recent',
    requireManualResolution: false,
    priority: 9,
  },
  {
    dataType: 'user_preferences',
    conflictFields: ['theme', 'language', 'notifications'],
    severity: 'low',
    defaultStrategy: 'merge_fields',
    requireManualResolution: false,
    priority: 3,
  },
  {
    dataType: 'telemetry',
    conflictFields: ['events', 'sessions'],
    severity: 'low',
    defaultStrategy: 'merge_fields',
    requireManualResolution: false,
    priority: 2,
  },
  {
    dataType: 'progress_data',
    conflictFields: ['completedTraining', 'achievements', 'unlockedMoves'],
    severity: 'medium',
    defaultStrategy: 'merge_fields',
    requireManualResolution: false,
    priority: 7,
  },
  {
    dataType: 'combat_history',
    conflictFields: ['combatHistory'],
    severity: 'medium',
    defaultStrategy: 'merge_fields',
    requireManualResolution: false,
    priority: 6,
  },
];

/**
 * Default field merge configurations
 */
export const DEFAULT_FIELD_MERGE_CONFIGS: FieldMergeConfig[] = [
  {
    fieldPath: 'player.stats.health',
    strategy: 'most_recent',
    priority: 8,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'player.stats.stamina',
    strategy: 'most_recent',
    priority: 8,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'player.level',
    strategy: 'remote_wins', // Server likely has more authoritative level data
    priority: 9,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'player.experience',
    strategy: 'most_recent',
    priority: 9,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'completedTraining',
    strategy: 'merge_fields',
    priority: 7,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'combatHistory',
    strategy: 'merge_fields',
    priority: 6,
    autoMergeSafe: true,
  },
  {
    fieldPath: 'theme',
    strategy: 'local_wins', // User preference should win
    priority: 3,
    autoMergeSafe: true,
  },
];

/**
 * Default priority rules for data types
 */
export const DEFAULT_PRIORITY_RULES: Record<DataType, number> = {
  game_state: 9,
  user_preferences: 3,
  telemetry: 2,
  progress_data: 7,
  combat_history: 6,
};

/**
 * Default strategy preferences by conflict severity
 */
export const DEFAULT_STRATEGY_BY_SEVERITY: Record<SyncConflictSeverity, MergeStrategy> = {
  low: 'auto_merge',
  medium: 'most_recent',
  high: 'merge_fields',
  critical: 'manual_resolve',
};

/**
 * Default sync conflict resolver configuration
 */
export const DEFAULT_SYNC_CONFLICT_RESOLVER_CONFIG: SyncConflictResolverConfig = {
  global: {
    enableAutoDetection: true,
    enableAutoResolution: true,
    manualResolutionTimeout: 30000,
    enableTelemetry: true,
    maxConflictHistory: 100,
  },
  detectionRules: DEFAULT_DETECTION_RULES,
  fieldMergeConfigs: DEFAULT_FIELD_MERGE_CONFIGS,
  priorityRules: DEFAULT_PRIORITY_RULES,
  strategyBySeverity: DEFAULT_STRATEGY_BY_SEVERITY,
  validation: {
    enableIntegrityCheck: true,
    enableSchemaValidation: true,
    maxAutoMergeSize: 1024 * 1024,
  },
};

/**
 * Utility functions for conflict resolution
 */
export const SyncConflictResolverUtils = {
  /**
   * Get detection rule for data type
   */
  getDetectionRule(config: SyncConflictResolverConfig, dataType: DataType): ConflictDetectionRule | undefined {
    return config.detectionRules.find(rule => rule.dataType === dataType);
  },

  /**
   * Get field merge config for specific field
   */
  getFieldMergeConfig(config: SyncConflictResolverConfig, fieldPath: string): FieldMergeConfig | undefined {
    return config.fieldMergeConfigs.find(config => config.fieldPath === fieldPath);
  },

  /**
   * Get priority for data type
   */
  getDataTypePriority(config: SyncConflictResolverConfig, dataType: DataType): number {
    return config.priorityRules[dataType] || 5;
  },

  /**
   * Get strategy for conflict severity
   */
  getStrategyForSeverity(config: SyncConflictResolverConfig, severity: SyncConflictSeverity): MergeStrategy {
    return config.strategyBySeverity[severity] || 'manual_resolve';
  },

  /**
   * Check if conflict requires manual resolution
   */
  requiresManualResolution(config: SyncConflictResolverConfig, conflict: SyncConflictEvent): boolean {
    const rule = this.getDetectionRule(config, conflict.dataType);
    if (rule?.requireManualResolution) return true;
    if (conflict.severity === 'critical') return true;
    return conflict.requiresManualResolution;
  },

  /**
   * Generate unique conflict ID
   */
  generateConflictId(dataType: DataType, localTimestamp: number, remoteTimestamp: number): string {
    const base = `${dataType}-${localTimestamp}-${remoteTimestamp}`;
    return btoa(base).replace(/[+/=]/g, '').substring(0, 12);
  },

  /**
   * Validate conflict resolution result
   */
  validateResolutionResult(result: ConflictResolutionResult): boolean {
    return result.success && 
           !!result.resolvedData && 
           result.resolutionTime >= 0 &&
           result.resolvedAt > 0;
  },
};
