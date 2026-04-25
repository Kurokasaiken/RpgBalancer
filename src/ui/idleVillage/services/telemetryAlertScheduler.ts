/**
 * NP-039 – Idle Village Scheduler Telemetry Alerting
 *
 * Telemetry alert scheduler service for monitoring KPIs and triggering alerts.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import type {
  TelemetryAlertSchedulerConfig,
  AlertRule,
  AlertInstance,
  AlertStatus,
  AlertSeverity,
  NotificationChannel,
  KPIDataSource,
  AlertNotification,
  SchedulerStats,
  AlertCondition,
  AlertConditionOperator,
} from '../types/telemetryAlertScheduler';

import {
  DEFAULT_TELEMETRY_ALERT_SCHEDULER_CONFIG,
  validateAlertRule,
  validateNotificationChannel,
  getSeverityPriority,
} from '../types/telemetryAlertScheduler';

/**
 * Telemetry Alert Scheduler Service
 */
export class TelemetryAlertScheduler {
  private config: TelemetryAlertSchedulerConfig;
  private dataSources: Map<string, KPIDataSource>;
  private activeAlerts: Map<string, AlertInstance>;
  private alertHistory: AlertInstance[];
  private notifications: AlertNotification[];
  private isRunning: boolean;
  private checkIntervalId?: NodeJS.Timeout;
  private stats: SchedulerStats;
  private lastGlobalAlertAt: number;

  constructor(config: Partial<TelemetryAlertSchedulerConfig> = {}) {
    this.config = { ...DEFAULT_TELEMETRY_ALERT_SCHEDULER_CONFIG, ...config };
    this.dataSources = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.notifications = [];
    this.isRunning = false;
    this.stats = {
      totalChecks: 0,
      totalAlertsTriggered: 0,
      totalAlertsResolved: 0,
      activeAlerts: 0,
      checksPerMinute: 0,
      averageCheckDuration: 0,
      uptime: 0,
    };
    this.lastGlobalAlertAt = 0;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.stats.lastCheckAt = Date.now();

    // Initial check
    this.performCheck();

    // Set up periodic checks
    const intervalMs = this.config.checkInterval * 60 * 1000; // Convert minutes to milliseconds
    this.checkIntervalId = setInterval(() => {
      this.performCheck();
    }, intervalMs);

    console.log(`[TelemetryAlertScheduler] Started with ${intervalMs}ms check interval`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = undefined;
    }

    console.log('[TelemetryAlertScheduler] Stopped');
  }

  /**
   * Register a KPI data source
   */
  registerDataSource(source: KPIDataSource): void {
    this.dataSources.set(source.id, source);
    console.log(`[TelemetryAlertScheduler] Registered data source: ${source.name}`);
  }

  /**
   * Unregister a KPI data source
   */
  unregisterDataSource(sourceId: string): void {
    this.dataSources.delete(sourceId);
    console.log(`[TelemetryAlertScheduler] Unregistered data source: ${sourceId}`);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TelemetryAlertSchedulerConfig>): void {
    this.config = { ...this.config, ...config, metadata: { ...this.config.metadata, updatedAt: Date.now() } };

    // Validate rules and channels
    this.config.rules = this.config.rules.filter(validateAlertRule);
    this.config.channels = this.config.channels.filter(validateNotificationChannel);

    console.log(`[TelemetryAlertScheduler] Configuration updated. Rules: ${this.config.rules.length}, Channels: ${this.config.channels.length}`);
  }

  /**
   * Perform telemetry check
   */
  private async performCheck(): Promise<void> {
    const checkStartTime = Date.now();
    this.stats.totalChecks++;

    try {
      // Gather metrics from all data sources
      const allMetrics: Record<string, any> = {};

      for (const source of this.dataSources.values()) {
        try {
          const metrics = await source.fetchMetrics();
          Object.assign(allMetrics, metrics);
        } catch (error) {
          console.warn(`[TelemetryAlertScheduler] Failed to fetch metrics from ${source.name}:`, error);
        }
      }

      // Evaluate alert rules
      await this.evaluateRules(allMetrics);

      // Clean up old alerts
      this.cleanupOldAlerts();

      // Update statistics
      const checkDuration = Date.now() - checkStartTime;
      this.updateStats(checkDuration);

    } catch (error) {
      console.error('[TelemetryAlertScheduler] Check failed:', error);
    }

    this.stats.lastCheckAt = checkStartTime;
    this.stats.nextCheckAt = checkStartTime + (this.config.checkInterval * 60 * 1000);
  }

  /**
   * Evaluate alert rules against current metrics
   */
  private async evaluateRules(metrics: Record<string, any>): Promise<void> {
    const enabledRules = this.config.rules.filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      try {
        const shouldTrigger = this.evaluateRule(rule, metrics);

        if (shouldTrigger) {
          await this.triggerAlert(rule, metrics);
        } else if (rule.autoResolve) {
          this.resolveAlertIfNeeded(rule, metrics);
        }
      } catch (error) {
        console.error(`[TelemetryAlertScheduler] Failed to evaluate rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private evaluateRule(rule: AlertRule, metrics: Record<string, any>): boolean {
    // Check cooldown period
    const existingAlert = Array.from(this.activeAlerts.values()).find(alert => alert.ruleId === rule.id);
    if (existingAlert) {
      const timeSinceLastTrigger = Date.now() - existingAlert.lastTriggeredAt;
      const cooldownMs = rule.cooldownPeriod * 60 * 1000;
      if (timeSinceLastTrigger < cooldownMs) {
        return false; // Still in cooldown
      }
    }

    // Check global cooldown
    const timeSinceLastGlobalAlert = Date.now() - this.lastGlobalAlertAt;
    const globalCooldownMs = this.config.globalCooldownMinutes * 60 * 1000;
    if (timeSinceLastGlobalAlert < globalCooldownMs) {
      return false; // Global cooldown active
    }

    // Evaluate conditions
    const results = rule.conditions.map(condition => this.evaluateCondition(condition, metrics));

    if (rule.conditionLogic === 'AND') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: AlertCondition, metrics: Record<string, any>): boolean {
    const metricValue = this.getNestedValue(metrics, condition.metric);

    if (metricValue === undefined) {
      return false; // Metric not found
    }

    switch (condition.operator) {
      case 'gt':
        return metricValue > condition.value;
      case 'gte':
        return metricValue >= condition.value;
      case 'lt':
        return metricValue < condition.value;
      case 'lte':
        return metricValue <= condition.value;
      case 'eq':
        return metricValue === condition.value;
      case 'neq':
        return metricValue !== condition.value;
      case 'contains':
        return Array.isArray(metricValue) ? metricValue.includes(condition.value) : String(metricValue).includes(condition.value);
      case 'not_contains':
        return Array.isArray(metricValue) ? !metricValue.includes(condition.value) : !String(metricValue).includes(condition.value);
      case 'matches':
        return new RegExp(condition.value).test(String(metricValue));
      case 'not_matches':
        return !new RegExp(condition.value).test(String(metricValue));
      default:
        return false;
    }
  }

  /**
   * Get nested value from metrics object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, metrics: Record<string, any>): Promise<void> {
    const alertId = `alert-${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if alert already exists
    const existingAlert = Array.from(this.activeAlerts.values()).find(alert => alert.ruleId === rule.id);

    if (existingAlert) {
      // Update existing alert
      existingAlert.lastTriggeredAt = Date.now();
      existingAlert.triggerCount++;
      existingAlert.metrics = metrics;
      existingAlert.context = { rule, metrics };

      console.log(`[TelemetryAlertScheduler] Alert updated: ${existingAlert.title}`);
      return;
    }

    // Create new alert
    const alert: AlertInstance = {
      id: alertId,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, metrics),
      status: 'active',
      triggeredAt: Date.now(),
      lastTriggeredAt: Date.now(),
      triggerCount: 1,
      metrics: { ...metrics },
      context: { rule, metrics },
      tags: [...rule.tags],
    };

    this.activeAlerts.set(alertId, alert);
    this.alertHistory.push(alert);
    this.stats.totalAlertsTriggered++;
    this.stats.activeAlerts++;
    this.lastGlobalAlertAt = Date.now();

    console.log(`[TelemetryAlertScheduler] Alert triggered: ${alert.title} (${alert.severity})`);

    // Send notifications
    await this.sendNotifications(alert);
  }

  /**
   * Generate alert message from rule and metrics
   */
  private generateAlertMessage(rule: AlertRule, metrics: Record<string, any>): string {
    let message = rule.description;

    // Add condition details
    const conditionDetails = rule.conditions.map(condition => {
      const value = this.getNestedValue(metrics, condition.metric);
      const unit = condition.unit ? ` ${condition.unit}` : '';
      return `${condition.metric}: ${value}${unit}`;
    }).join(', ');

    if (conditionDetails) {
      message += ` (Current values: ${conditionDetails})`;
    }

    return message;
  }

  /**
   * Resolve alert if conditions are no longer met
   */
  private resolveAlertIfNeeded(rule: AlertRule, metrics: Record<string, any>): void {
    const existingAlert = Array.from(this.activeAlerts.values()).find(alert => alert.ruleId === rule.id);

    if (!existingAlert || existingAlert.status !== 'active') return;

    // Check if resolve threshold is met
    const resolveThreshold = rule.resolveThreshold;
    if (resolveThreshold !== undefined) {
      // Use resolve threshold for resolution check
      const shouldResolve = rule.conditions.every(condition => {
        const metricValue = this.getNestedValue(metrics, condition.metric);
        return metricValue <= resolveThreshold;
      });

      if (shouldResolve) {
        this.resolveAlert(existingAlert.id);
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();

    this.activeAlerts.delete(alertId);
    this.stats.totalAlertsResolved++;
    this.stats.activeAlerts--;

    console.log(`[TelemetryAlertScheduler] Alert resolved: ${alert.title}`);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = acknowledgedBy;

    console.log(`[TelemetryAlertScheduler] Alert acknowledged: ${alert.title}`);
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: AlertInstance): Promise<void> {
    const enabledChannels = this.config.channels.filter(channel => channel.enabled);

    for (const channel of enabledChannels) {
      // Check filters
      if (!this.shouldSendToChannel(channel, alert)) continue;

      const notification: AlertNotification = {
        id: `notification-${alert.id}-${channel.id}-${Date.now()}`,
        alertId: alert.id,
        channelId: channel.id,
        channelType: channel.type,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      };

      this.notifications.push(notification);

      try {
        await this.sendNotificationToChannel(notification, alert, channel);
        notification.status = 'sent';
        notification.sentAt = Date.now();
      } catch (error) {
        notification.status = 'failed';
        notification.error = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[TelemetryAlertScheduler] Failed to send notification to ${channel.name}:`, error);
      }
    }
  }

  /**
   * Check if alert should be sent to channel based on filters
   */
  private shouldSendToChannel(channel: NotificationChannel, alert: AlertInstance): boolean {
    const filters = channel.filters;

    if (filters.severities && !filters.severities.includes(alert.severity)) return false;
    if (filters.tags && !filters.tags.some(tag => alert.tags.includes(tag))) return false;
    if (filters.ruleIds && !filters.ruleIds.includes(alert.ruleId)) return false;

    return true;
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotificationToChannel(
    notification: AlertNotification,
    alert: AlertInstance,
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel.type) {
      case 'console':
        console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title}\n${alert.message}`);
        break;

      case 'webhook':
        await this.sendWebhookNotification(channel.config.url, alert);
        break;

      case 'email':
        await this.sendEmailNotification(channel.config, alert);
        break;

      case 'slack':
        await this.sendSlackNotification(channel.config.webhookUrl, alert);
        break;

      case 'discord':
        await this.sendDiscordNotification(channel.config.webhookUrl, alert);
        break;

      case 'in_app':
        // In-app notifications would be handled by the UI layer
        break;

      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(url: string, alert: AlertInstance): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert: {
          id: alert.id,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          triggeredAt: alert.triggeredAt,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(config: any, alert: AlertInstance): Promise<void> {
    // Placeholder for email implementation
    console.log(`[Email] Would send alert "${alert.title}" to ${config.recipients?.join(', ')}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(webhookUrl: string, alert: AlertInstance): Promise<void> {
    const color = this.getSlackColor(alert.severity);

    const payload = {
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Triggered', value: new Date(alert.triggeredAt).toISOString(), short: true },
        ],
      }],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }
  }

  /**
   * Send Discord notification
   */
  private async sendDiscordNotification(webhookUrl: string, alert: AlertInstance): Promise<void> {
    const color = this.getDiscordColor(alert.severity);

    const payload = {
      embeds: [{
        color,
        title: alert.title,
        description: alert.message,
        fields: [
          { name: 'Severity', value: alert.severity, inline: true },
          { name: 'Triggered', value: new Date(alert.triggeredAt).toISOString(), inline: true },
        ],
      }],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }
  }

  /**
   * Get Slack color for severity
   */
  private getSlackColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return 'good';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'critical': return '#8b0000';
      default: return '#808080';
    }
  }

  /**
   * Get Discord color for severity
   */
  private getDiscordColor(severity: AlertSeverity): number {
    switch (severity) {
      case 'info': return 0x3498db;
      case 'warning': return 0xf39c12;
      case 'error': return 0xe74c3c;
      case 'critical': return 0x8b0000;
      default: return 0x808080;
    }
  }

  /**
   * Clean up old alerts and notifications
   */
  private cleanupOldAlerts(): void {
    const retentionMs = this.config.alertRetentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    // Clean up resolved alerts older than retention period
    this.alertHistory = this.alertHistory.filter(alert =>
      alert.status === 'active' || alert.resolvedAt! > cutoffTime
    );

    // Clean up old notifications
    this.notifications = this.notifications.filter(notification =>
      notification.sentAt! > cutoffTime || notification.status === 'pending'
    );
  }

  /**
   * Update scheduler statistics
   */
  private updateStats(checkDuration: number): void {
    this.stats.averageCheckDuration =
      (this.stats.averageCheckDuration * (this.stats.totalChecks - 1) + checkDuration) / this.stats.totalChecks;

    // Calculate checks per minute (rolling average)
    if (this.stats.lastCheckAt && this.stats.nextCheckAt) {
      const intervalMs = this.stats.nextCheckAt - this.stats.lastCheckAt;
      this.stats.checksPerMinute = 60 * 1000 / intervalMs;
    }
  }

  /**
   * Get current statistics
   */
  getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): AlertInstance[] {
    const sorted = this.alertHistory.sort((a, b) => b.triggeredAt - a.triggeredAt);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get available metrics from all data sources
   */
  getAvailableMetrics(): string[] {
    const allMetrics = new Set<string>();

    for (const source of this.dataSources.values()) {
      source.getAvailableMetrics().forEach(metric => allMetrics.add(metric));
    }

    return Array.from(allMetrics);
  }

  /**
   * Dispose of the scheduler
   */
  dispose(): void {
    this.stop();
    this.dataSources.clear();
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.notifications = [];
  }
}
