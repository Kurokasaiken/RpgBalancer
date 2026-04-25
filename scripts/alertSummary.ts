#!/usr/bin/env ts-node

/**
 * NP-039 – Idle Village Scheduler Telemetry Alerting
 *
 * CLI command for displaying telemetry alert status and summary.
 *
 * Usage: npm run alert-summary
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { loadData } from '../src/shared/persistence/PersistenceService';
import {
  TelemetryAlertSchedulerConfig,
  AlertInstance,
  SchedulerStats,
  AlertStatus,
  AlertSeverity,
  getSeverityColor,
} from '../src/ui/idleVillage/types/telemetryAlertScheduler';

/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Get severity emoji
 */
function getSeverityEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '🚨';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '❓';
  }
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: AlertStatus): string {
  switch (status) {
    case 'active': return '🔴';
    case 'resolved': return '✅';
    case 'acknowledged': return '👁️';
    case 'suppressed': return '🔇';
    default: return '❓';
  }
}

/**
 * Main CLI function
 */
async function main() {
  console.log('🔔 Idle Village Telemetry Alert Summary');
  console.log('=' .repeat(50));

  try {
    // Load configuration
    console.log('\n📋 Loading configuration...');
    const config = await loadData<TelemetryAlertSchedulerConfig>('telemetry-alert-config', null);

    if (!config) {
      console.log('❌ No alert configuration found. Run the app first to create configuration.');
      return;
    }

    // Configuration summary
    console.log('\n⚙️  Configuration Status:');
    console.log(`   Scheduler: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Check Interval: ${config.checkInterval} minutes`);
    console.log(`   Alert Rules: ${config.rules.length}`);
    console.log(`   Notification Channels: ${config.channels.length}`);
    console.log(`   Last Updated: ${formatTimestamp(config.metadata.updatedAt)}`);

    // Alert rules summary
    console.log('\n📊 Alert Rules:');
    if (config.rules.length === 0) {
      console.log('   No alert rules configured');
    } else {
      config.rules.forEach((rule, index) => {
        const status = rule.enabled ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${rule.name} (${rule.severity})`);
        console.log(`      Conditions: ${rule.conditions.length}, Cooldown: ${rule.cooldownPeriod}min`);
      });
    }

    // Notification channels summary
    console.log('\n📢 Notification Channels:');
    if (config.channels.length === 0) {
      console.log('   No notification channels configured');
    } else {
      config.channels.forEach((channel, index) => {
        const status = channel.enabled ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${channel.name} (${channel.type})`);
      });
    }

    // Try to load alert history (this would be from a separate storage key)
    console.log('\n📈 Recent Alerts:');
    try {
      const alertHistory = await loadData<AlertInstance[]>('telemetry-alert-history', []);
      if (alertHistory.length === 0) {
        console.log('   No recent alerts');
      } else {
        const recentAlerts = alertHistory
          .sort((a, b) => b.triggeredAt - a.triggeredAt)
          .slice(0, 10);

        recentAlerts.forEach((alert, index) => {
          const severityEmoji = getSeverityEmoji(alert.severity);
          const statusEmoji = getStatusEmoji(alert.status);
          console.log(`   ${index + 1}. ${severityEmoji}${statusEmoji} ${alert.title}`);
          console.log(`      Triggered: ${formatTimestamp(alert.triggeredAt)}`);
          console.log(`      Status: ${alert.status}`);
          if (alert.resolvedAt) {
            console.log(`      Resolved: ${formatTimestamp(alert.resolvedAt)}`);
          }
        });
      }
    } catch (error) {
      console.log('   Could not load alert history');
    }

    // Performance metrics (if available)
    console.log('\n📈 Performance Metrics:');
    try {
      const stats = await loadData<SchedulerStats>('telemetry-scheduler-stats', null);
      if (stats) {
        console.log(`   Total Checks: ${stats.totalChecks}`);
        console.log(`   Alerts Triggered: ${stats.totalAlertsTriggered}`);
        console.log(`   Alerts Resolved: ${stats.totalAlertsResolved}`);
        console.log(`   Active Alerts: ${stats.activeAlerts}`);
        console.log(`   Checks/Minute: ${stats.checksPerMinute.toFixed(2)}`);
        console.log(`   Avg Check Duration: ${formatDuration(stats.averageCheckDuration)}`);
        if (stats.lastCheckAt) {
          console.log(`   Last Check: ${formatTimestamp(stats.lastCheckAt)}`);
        }
      } else {
        console.log('   No performance metrics available');
      }
    } catch (error) {
      console.log('   Could not load performance metrics');
    }

    console.log('\n✅ Alert summary completed');

  } catch (error) {
    console.error('❌ Failed to load alert summary:', error);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

export { main as alertSummary };
