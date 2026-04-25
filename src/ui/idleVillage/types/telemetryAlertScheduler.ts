/**
 * NP-039 – Idle Village Scheduler Telemetry Alerting
 *
 * Telemetry alert scheduler types and configuration interfaces.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert status
 */
export type AlertStatus = 'active' | 'resolved' | 'acknowledged' | 'suppressed';

/**
 * KPI metric types
 */
export type KPIMetricType =
  | 'number'
  | 'percentage'
  | 'duration'
  | 'count'
  | 'boolean'
  | 'rate';

/**
 * Alert condition operators
 */
export type AlertConditionOperator =
  | 'gt'  // greater than
  | 'gte' // greater than or equal
  | 'lt'  // less than
  | 'lte' // less than or equal
  | 'eq'  // equal
  | 'neq' // not equal
  | 'contains'
  | 'not_contains'
  | 'matches'
  | 'not_matches';

/**
 * Alert condition
 */
export interface AlertCondition {
  metric: string;           // KPI metric path (e.g., 'playback.averagePlayTime')
  operator: AlertConditionOperator;
  value: any;               // Threshold value
  unit?: string;            // Unit for display (e.g., 'ms', '%')
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  conditionLogic: 'AND' | 'OR'; // How to combine multiple conditions
  cooldownPeriod: number; // Minutes before same alert can trigger again
  autoResolve: boolean;   // Auto-resolve when condition is no longer met
  resolveThreshold?: any; // Optional separate threshold for resolution
  tags: string[];         // Tags for filtering/grouping
  metadata: {
    createdAt: number;
    updatedAt: number;
    author: string;
    version: string;
  };
}

/**
 * Alert instance
 */
export interface AlertInstance {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  triggeredAt: number;
  resolvedAt?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  lastTriggeredAt: number;
  triggerCount: number;
  metrics: Record<string, any>; // KPI values that triggered the alert
  context: Record<string, any>; // Additional context data
  tags: string[];
}

/**
 * Notification channel types
 */
export type NotificationChannelType =
  | 'console'
  | 'webhook'
  | 'email'
  | 'slack'
  | 'discord'
  | 'in_app';

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  id: string;
  type: NotificationChannelType;
  name: string;
  enabled: boolean;
  config: Record<string, any>; // Channel-specific config (webhook URL, email addresses, etc.)
  filters: {
    severities?: AlertSeverity[];
    tags?: string[];
    ruleIds?: string[];
  };
}

/**
 * Scheduler configuration
 */
export interface TelemetryAlertSchedulerConfig {
  enabled: boolean;
  checkInterval: number;    // Minutes between checks
  maxConcurrentChecks: number;
  alertRetentionDays: number;
  notificationBatchSize: number;
  rules: AlertRule[];
  channels: NotificationChannel[];
  globalCooldownMinutes: number; // Minimum time between any alerts
  metadata: {
    version: string;
    createdAt: number;
    updatedAt: number;
  };
}

/**
 * KPI data source interface
 */
export interface KPIDataSource {
  id: string;
  name: string;
  type: 'telemetry' | 'performance' | 'system' | 'custom';
  fetchMetrics(): Promise<Record<string, any>>;
  getAvailableMetrics(): string[];
}

/**
 * Alert notification
 */
export interface AlertNotification {
  id: string;
  alertId: string;
  channelId: string;
  channelType: NotificationChannelType;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Scheduler statistics
 */
export interface SchedulerStats {
  totalChecks: number;
  totalAlertsTriggered: number;
  totalAlertsResolved: number;
  activeAlerts: number;
  checksPerMinute: number;
  averageCheckDuration: number;
  lastCheckAt?: number;
  nextCheckAt?: number;
  uptime: number; // Seconds
}

/**
 * Default configurations
 */
export const DEFAULT_TELEMETRY_ALERT_SCHEDULER_CONFIG: TelemetryAlertSchedulerConfig = {
  enabled: true,
  checkInterval: 5, // 5 minutes
  maxConcurrentChecks: 3,
  alertRetentionDays: 30,
  notificationBatchSize: 10,
  globalCooldownMinutes: 1,
  rules: [],
  channels: [
    {
      id: 'console-default',
      type: 'console',
      name: 'Console Output',
      enabled: true,
      config: {},
      filters: {},
    },
  ],
  metadata: {
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

/**
 * Create default alert rule for high error rates
 */
export function createDefaultErrorRateRule(): AlertRule {
  return {
    id: 'error-rate-high',
    name: 'High Error Rate Alert',
    description: 'Triggers when error rate exceeds threshold',
    enabled: true,
    severity: 'warning',
    conditions: [
      {
        metric: 'errors.totalErrors',
        operator: 'gt',
        value: 10,
        unit: 'errors',
      },
    ],
    conditionLogic: 'AND',
    cooldownPeriod: 15, // 15 minutes
    autoResolve: true,
    resolveThreshold: 5,
    tags: ['errors', 'performance'],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'system',
      version: '1.0.0',
    },
  };
}

/**
 * Create default alert rule for performance degradation
 */
export function createDefaultPerformanceRule(): AlertRule {
  return {
    id: 'performance-degradation',
    name: 'Performance Degradation Alert',
    description: 'Triggers when average response times exceed threshold',
    enabled: true,
    severity: 'warning',
    conditions: [
      {
        metric: 'performance.averagePlayTime',
        operator: 'gt',
        value: 2000,
        unit: 'ms',
      },
    ],
    conditionLogic: 'AND',
    cooldownPeriod: 10,
    autoResolve: true,
    resolveThreshold: 1500,
    tags: ['performance', 'response-time'],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'system',
      version: '1.0.0',
    },
  };
}

// Zod schemas for validation
export const AlertSeveritySchema = z.enum(['info', 'warning', 'error', 'critical']);
export const AlertStatusSchema = z.enum(['active', 'resolved', 'acknowledged', 'suppressed']);
export const KPIMetricTypeSchema = z.enum(['number', 'percentage', 'duration', 'count', 'boolean', 'rate']);
export const AlertConditionOperatorSchema = z.enum([
  'gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'contains', 'not_contains', 'matches', 'not_matches'
]);
export const NotificationChannelTypeSchema = z.enum(['console', 'webhook', 'email', 'slack', 'discord', 'in_app']);

// Utility functions
export function validateAlertRule(rule: AlertRule): boolean {
  try {
    // Basic validation
    if (!rule.id || !rule.name || !rule.conditions.length) {
      return false;
    }

    // Validate conditions
    for (const condition of rule.conditions) {
      if (!condition.metric || !condition.operator) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function validateNotificationChannel(channel: NotificationChannel): boolean {
  try {
    if (!channel.id || !channel.name || !channel.type) {
      return false;
    }

    // Validate channel-specific config
    switch (channel.type) {
      case 'webhook':
        if (!channel.config.url) return false;
        break;
      case 'email':
        if (!channel.config.recipients || !Array.isArray(channel.config.recipients)) return false;
        break;
      case 'slack':
        if (!channel.config.webhookUrl) return false;
        break;
      case 'discord':
        if (!channel.config.webhookUrl) return false;
        break;
    }

    return true;
  } catch {
    return false;
  }
}

export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'info': return 'blue';
    case 'warning': return 'yellow';
    case 'error': return 'red';
    case 'critical': return 'purple';
    default: return 'gray';
  }
}

export function getSeverityPriority(severity: AlertSeverity): number {
  switch (severity) {
    case 'info': return 1;
    case 'warning': return 2;
    case 'error': return 3;
    case 'critical': return 4;
    default: return 0;
  }
}
