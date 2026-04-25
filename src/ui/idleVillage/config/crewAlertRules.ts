/**
 * Crew Alert Rules Configuration - NP-031
 * 
 * Configurable alert rules system for Idle Village crew scheduler.
 * Defines rules for fatigue, crew imbalance, and other conditions that trigger alerts.
 * Follows config-first design with Zod schema validation.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { z } from 'zod';
import type { CrewAlertLevel } from './hudCrewConfig';
import { CREW_ALERT_LEVELS } from './hudCrewConfig';

/**
 * Alert rule types for different monitoring scenarios
 */
export const CREW_ALERT_RULE_TYPES = {
  FATIGUE_THRESHOLD: 'fatigue_threshold',
  CREW_IMBALANCE: 'crew_imbalance',
  QUEUE_OVERLOAD: 'queue_overload',
  RESPONSE_TIME: 'response_time',
  INJURY_RATE: 'injury_rate',
  EXHAUSTION_RATE: 'exhaustion_rate',
  ACTIVITY_BOTTLENECK: 'activity_bottleneck',
  PRIORITY_BACKLOG: 'priority_backlog',
} as const;

export type CrewAlertRuleType = typeof CREW_ALERT_RULE_TYPES[keyof typeof CREW_ALERT_RULE_TYPES];

/**
 * Alert rule severity levels
 */
export const CREW_ALERT_RULE_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type CrewAlertRuleSeverity = typeof CREW_ALERT_RULE_SEVERITY[keyof typeof CREW_ALERT_RULE_SEVERITY];

/**
 * Alert rule condition operators
 */
export const CREW_ALERT_CONDITION_OPERATORS = {
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '<=',
  EQUAL: '==',
  NOT_EQUAL: '!=',
  PERCENTAGE_ABOVE: '%>',
  PERCENTAGE_BELOW: '%<',
} as const;

export const CrewAlertConditionOperators = Object.values(CREW_ALERT_CONDITION_OPERATORS);
export type CrewAlertConditionOperator = typeof CREW_ALERT_CONDITION_OPERATORS[keyof typeof CREW_ALERT_CONDITION_OPERATORS];

/**
 * Alert rule condition schema
 */
export const CrewAlertConditionSchema = z.object({
  /** Field to monitor */
  field: z.string(),
  /** Comparison operator */
  operator: z.enum(CrewAlertConditionOperators),
  /** Threshold value */
  threshold: z.number(),
  /** Optional secondary threshold for range conditions */
  secondaryThreshold: z.number().optional(),
  /** Time window in milliseconds for temporal conditions */
  timeWindow: z.number().optional(),
});

export type CrewAlertCondition = z.infer<typeof CrewAlertConditionSchema>;

/**
 * Alert rule schema
 */
export const CrewAlertRuleSchema = z.object({
  /** Unique rule identifier */
  id: z.string(),
  /** Rule type */
  type: z.enum(Object.values(CREW_ALERT_RULE_TYPES)),
  /** Rule display name */
  name: z.string(),
  /** Rule description */
  description: z.string(),
  /** Whether the rule is enabled */
  enabled: z.boolean(),
  /** Alert severity level */
  severity: z.enum(Object.values(CREW_ALERT_RULE_SEVERITY)),
  /** Alert level to trigger */
  alertLevel: z.enum(Object.values(CREW_ALERT_LEVELS)),
  /** Rule conditions */
  conditions: z.array(CrewAlertConditionSchema),
  /** Cooldown period between alerts in milliseconds */
  cooldownMs: z.number().min(1000),
  /** Whether to show notifications */
  showNotification: z.boolean(),
  /** Whether to add to HUD queue */
  addToHUD: z.boolean(),
  /** Custom message template */
  messageTemplate: z.string().optional(),
  /** Tags for rule categorization */
  tags: z.array(z.string()).default([]),
  /** Rule priority (higher = more important) */
  priority: z.number().min(0).max(100),
  /** Rule creation timestamp */
  createdAt: z.number().optional(),
  /** Rule last updated timestamp */
  updatedAt: z.number().optional(),
});

export type CrewAlertRule = z.infer<typeof CrewAlertRuleSchema>;

/**
 * Alert rules configuration schema
 */
export const CrewAlertRulesConfigSchema = z.object({
  /** Global enable/disable for alert rules */
  enabled: z.boolean(),
  /** Maximum number of alerts to keep in history */
  maxAlertHistory: z.number().min(10).max(1000),
  /** Default cooldown between alerts in milliseconds */
  defaultCooldownMs: z.number().min(1000),
  /** Enable alert persistence */
  enablePersistence: z.boolean(),
  /** Alert history retention period in milliseconds */
  alertRetentionMs: z.number().min(60000), // 1 minute minimum
  /** Maximum concurrent alerts per rule */
  maxConcurrentAlerts: z.number().min(1).max(10),
  /** Refresh rate in milliseconds */
  refreshRate: z.number().min(1000).max(30000),
  /** Alert aggregation settings */
  aggregation: z.object({
    /** Enable alert aggregation */
    enabled: z.boolean(),
    /** Aggregation window in milliseconds */
    windowMs: z.number().min(5000),
    /** Maximum alerts to aggregate */
    maxAlerts: z.number().min(2).max(20),
  }),
  /** Notification settings */
  notifications: z.object({
    /** Enable desktop notifications */
    enableDesktop: z.boolean(),
    /** Enable sound alerts */
    enableSound: z.boolean(),
    /** Sound volume (0-1) */
    soundVolume: z.number().min(0).max(1),
    /** Notification duration in milliseconds */
    duration: z.number().min(1000).max(10000),
  }),
  /** Alert rules array */
  rules: z.array(CrewAlertRuleSchema),
});

export type CrewAlertRulesConfig = z.infer<typeof CrewAlertRulesConfigSchema>;

/**
 * Default alert rules configuration
 */
export const DEFAULT_CREW_ALERT_RULES_CONFIG: CrewAlertRulesConfig = {
  enabled: true,
  maxAlertHistory: 100,
  defaultCooldownMs: 30000, // 30 seconds
  enablePersistence: true,
  alertRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
  maxConcurrentAlerts: 3,
  refreshRate: 5000, // 5 seconds
  
  aggregation: {
    enabled: true,
    windowMs: 60000, // 1 minute
    maxAlerts: 5,
  },
  
  notifications: {
    enableDesktop: false,
    enableSound: false,
    soundVolume: 0.5,
    duration: 5000,
  },
  
  rules: [
    // High fatigue alert
    {
      id: 'fatigue-high',
      type: CREW_ALERT_RULE_TYPES.FATIGUE_THRESHOLD,
      name: 'High Fatigue Alert',
      description: 'Alert when crew members have high fatigue levels',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.WARNING,
      alertLevel: CREW_ALERT_LEVELS.HIGH,
      conditions: [
        {
          field: 'averageFatigue',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 0.7,
        },
        {
          field: 'exhaustedCount',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN,
          threshold: 0,
        },
      ],
      cooldownMs: 60000, // 1 minute
      showNotification: true,
      addToHUD: true,
      messageTemplate: 'Crew fatigue is high: {{exhaustedCount}} exhausted, {{averageFatigue}}% average',
      tags: ['fatigue', 'health'],
      priority: 80,
    },
    
    // Critical fatigue alert
    {
      id: 'fatigue-critical',
      type: CREW_ALERT_RULE_TYPES.FATIGUE_THRESHOLD,
      name: 'Critical Fatigue Alert',
      description: 'Alert when crew members are critically exhausted',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.CRITICAL,
      alertLevel: CREW_ALERT_LEVELS.CRITICAL,
      conditions: [
        {
          field: 'exhaustedCount',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 2,
        },
        {
          field: 'averageFatigue',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 0.85,
        },
      ],
      cooldownMs: 30000, // 30 seconds
      showNotification: true,
      addToHUD: true,
      messageTemplate: 'CRITICAL: {{exhaustedCount}} crew members exhausted!',
      tags: ['fatigue', 'critical', 'health'],
      priority: 95,
    },
    
    // Crew imbalance alert
    {
      id: 'crew-imbalance',
      type: CREW_ALERT_RULE_TYPES.CREW_IMBALANCE,
      name: 'Crew Imbalance Alert',
      description: 'Alert when crew distribution is imbalanced',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.WARNING,
      alertLevel: CREW_ALERT_LEVELS.MEDIUM,
      conditions: [
        {
          field: 'workingCount',
          operator: CREW_ALERT_CONDITION_OPERATORS.PERCENTAGE_BELOW,
          threshold: 0.3, // Less than 30% working
        },
        {
          field: 'totalCrew',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN,
          threshold: 3, // Only if we have more than 3 crew members
        },
      ],
      cooldownMs: 120000, // 2 minutes
      showNotification: true,
      addToHUD: true,
      messageTemplate: 'Crew imbalance: only {{workingCount}}/{{totalCrew}} working',
      tags: ['balance', 'efficiency'],
      priority: 60,
    },
    
    // Queue overload alert
    {
      id: 'queue-overload',
      type: CREW_ALERT_RULE_TYPES.QUEUE_OVERLOAD,
      name: 'Queue Overload Alert',
      description: 'Alert when activity queue is overloaded',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.ERROR,
      alertLevel: CREW_ALERT_LEVELS.HIGH,
      conditions: [
        {
          field: 'queueSize',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 5,
        },
        {
          field: 'averageWaitTime',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN,
          threshold: 30000, // 30 seconds
        },
      ],
      cooldownMs: 90000, // 1.5 minutes
      showNotification: true,
      addToHUD: true,
      messageTemplate: 'Queue overloaded: {{queueSize}} activities waiting',
      tags: ['queue', 'performance'],
      priority: 70,
    },
    
    // Response time alert
    {
      id: 'response-time',
      type: CREW_ALERT_RULE_TYPES.RESPONSE_TIME,
      name: 'Slow Response Alert',
      description: 'Alert when crew response time is slow',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.WARNING,
      alertLevel: CREW_ALERT_LEVELS.MEDIUM,
      conditions: [
        {
          field: 'averageResponseTime',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN,
          threshold: 20000, // 20 seconds
        },
        {
          field: 'pendingCount',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN,
          threshold: 0,
        },
      ],
      cooldownMs: 180000, // 3 minutes
      showNotification: false,
      addToHUD: true,
      messageTemplate: 'Slow response time: {{averageResponseTime}}ms average',
      tags: ['performance', 'response'],
      priority: 50,
    },
    
    // Injury rate alert
    {
      id: 'injury-rate',
      type: CREW_ALERT_RULE_TYPES.INJURY_RATE,
      name: 'High Injury Rate Alert',
      description: 'Alert when injury rate is unusually high',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.ERROR,
      alertLevel: CREW_ALERT_LEVELS.HIGH,
      conditions: [
        {
          field: 'injuryRate',
          operator: CREW_ALERT_CONDITION_OPERATORS.PERCENTAGE_ABOVE,
          threshold: 0.2, // More than 20% injured
        },
        {
          field: 'injuredCount',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 1,
        },
      ],
      cooldownMs: 300000, // 5 minutes
      showNotification: true,
      addToHUD: true,
      messageTemplate: 'High injury rate: {{injuredCount}}/{{totalCrew}} crew injured',
      tags: ['health', 'injury'],
      priority: 85,
    },
    
    // Activity bottleneck alert
    {
      id: 'activity-bottleneck',
      type: CREW_ALERT_RULE_TYPES.ACTIVITY_BOTTLENECK,
      name: 'Activity Bottleneck Alert',
      description: 'Alert when specific activities are bottlenecked',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.WARNING,
      alertLevel: CREW_ALERT_LEVELS.MEDIUM,
      conditions: [
        {
          field: 'bottleneckActivities',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 1,
        },
        {
          field: 'queueUtilization',
          operator: CREW_ALERT_CONDITION_OPERATORS.PERCENTAGE_ABOVE,
          threshold: 0.8, // 80% queue utilization
        },
      ],
      cooldownMs: 240000, // 4 minutes
      showNotification: false,
      addToHUD: true,
      messageTemplate: 'Activity bottleneck detected: {{bottleneckActivities}} activities affected',
      tags: ['bottleneck', 'activities'],
      priority: 65,
    },
    
    // Priority backlog alert
    {
      id: 'priority-backlog',
      type: CREW_ALERT_RULE_TYPES.PRIORITY_BACKLOG,
      name: 'Priority Backlog Alert',
      description: 'Alert when high-priority tasks are backlogged',
      enabled: true,
      severity: CREW_ALERT_RULE_SEVERITY.WARNING,
      alertLevel: CREW_ALERT_LEVELS.LOW,
      conditions: [
        {
          field: 'highPriorityBacklog',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 3,
        },
        {
          field: 'averagePriority',
          operator: CREW_ALERT_CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
          threshold: 0.7,
        },
      ],
      cooldownMs: 300000, // 5 minutes
      showNotification: false,
      addToHUD: true,
      messageTemplate: 'Priority backlog: {{highPriorityBacklog}} high-priority tasks waiting',
      tags: ['priority', 'backlog'],
      priority: 55,
    },
  ],
};

/**
 * Creates and validates a crew alert rules configuration
 */
export function createCrewAlertRulesConfig(config: Partial<CrewAlertRulesConfig> = {}): CrewAlertRulesConfig {
  const merged = { 
    ...DEFAULT_CREW_ALERT_RULES_CONFIG, 
    ...config,
    rules: config.rules || DEFAULT_CREW_ALERT_RULES_CONFIG.rules,
  };
  return CrewAlertRulesConfigSchema.parse(merged);
}

/**
 * Creates and validates a single alert rule
 */
export function createCrewAlertRule(rule: Partial<CrewAlertRule> = {}): CrewAlertRule {
  const now = Date.now();
  const merged = {
    ...rule,
    id: rule.id || `rule_${now}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: rule.createdAt || now,
    updatedAt: rule.updatedAt || now,
  };
  return CrewAlertRuleSchema.parse(merged);
}

/**
 * Maps rule severity to alert level
 */
export function mapSeverityToAlertLevel(severity: CrewAlertRuleSeverity): CrewAlertLevel {
  switch (severity) {
    case CREW_ALERT_RULE_SEVERITY.INFO:
      return CREW_ALERT_LEVELS.LOW;
    case CREW_ALERT_RULE_SEVERITY.WARNING:
      return CREW_ALERT_LEVELS.MEDIUM;
    case CREW_ALERT_RULE_SEVERITY.ERROR:
      return CREW_ALERT_LEVELS.HIGH;
    case CREW_ALERT_RULE_SEVERITY.CRITICAL:
      return CREW_ALERT_LEVELS.CRITICAL;
    default:
      return CREW_ALERT_LEVELS.NONE;
  }
}

/**
 * Gets alert rules by type
 */
export function getAlertRulesByType(rules: CrewAlertRule[], type: CrewAlertRuleType): CrewAlertRule[] {
  return rules.filter(rule => rule.type === type && rule.enabled);
}

/**
 * Gets alert rules by severity
 */
export function getAlertRulesBySeverity(rules: CrewAlertRule[], severity: CrewAlertRuleSeverity): CrewAlertRule[] {
  return rules.filter(rule => rule.severity === severity && rule.enabled);
}

/**
 * Gets alert rules by tags
 */
export function getAlertRulesByTags(rules: CrewAlertRule[], tags: string[]): CrewAlertRule[] {
  return rules.filter(rule => 
    rule.enabled && 
    tags.some(tag => rule.tags.includes(tag))
  );
}
