/**
 * Activity Analytics Dashboard for Idle Village Phase 12.
 * Config-first dashboard with Style Laboratory tokens and real-time metrics.
 */

import React, { useMemo } from 'react';
import { useActivityAnalytics } from './useActivityAnalytics';
import { 
  DEFAULT_ANALYTICS_DASHBOARD_CONFIG, 
  DEFAULT_ANALYTICS_THRESHOLDS,
  type ActivityAnalyticsDashboardConfig 
} from './activityTelemetryConfig';

/**
 * Props for ActivityAnalyticsDashboard component.
 */
export interface ActivityAnalyticsDashboardProps {
  /** Dashboard configuration override */
  config?: ActivityAnalyticsDashboardConfig;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show threshold alerts */
  showThresholds?: boolean;
  /** Whether to enable real-time updates */
  enableRealTime?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Metric card component for displaying key analytics.
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  config: ActivityAnalyticsDashboardConfig['theme'];
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  color, 
  config 
}) => (
  <div 
    className="p-4 rounded-lg border transition-all duration-300 hover:shadow-lg"
    style={{
      backgroundColor: config.colors.surface,
      borderColor: config.colors.border,
      fontFamily: config.typography.fontFamily,
    }}
  >
    <div 
      className="text-sm font-medium mb-1"
      style={{
        color: config.colors.textSecondary,
        fontSize: config.typography.fontSize.sm,
        fontWeight: config.typography.fontWeight.medium,
      }}
    >
      {title}
    </div>
    <div 
      className="text-2xl font-bold mb-1"
      style={{
        color: color || config.colors.text,
        fontSize: config.typography.fontSize.xl,
        fontWeight: config.typography.fontWeight.bold,
      }}
    >
      {value}
    </div>
    {subtitle && (
      <div 
        className="text-xs"
        style={{
          color: config.colors.textSecondary,
          fontSize: config.typography.fontSize.xs,
        }}
      >
        {subtitle}
      </div>
    )}
    {trend && (
      <div className="mt-2">
        <span 
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: trend === 'up' ? config.colors.success : 
                           trend === 'down' ? config.colors.error : config.colors.secondary,
            color: config.colors.background,
          }}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      </div>
    )}
  </div>
);

/**
 * Simple chart component for activity patterns.
 */
interface ActivityChartProps {
  data: number[];
  labels: string[];
  color: string;
  config: ActivityAnalyticsDashboardConfig['theme'];
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data, labels, color, config }) => {
  const maxValue = Math.max(...data, 1);
  
  return (
    <div 
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: config.colors.surface,
        borderColor: config.colors.border,
        fontFamily: config.typography.fontFamily,
      }}
    >
      <div 
        className="text-sm font-medium mb-3"
        style={{
          color: config.colors.text,
          fontSize: config.typography.fontSize.sm,
          fontWeight: config.typography.fontWeight.medium,
        }}
      >
        Hourly Activity Pattern
      </div>
      <div className="relative h-32 flex items-end justify-between gap-1">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex-1 relative group"
            style={{
              height: `${(value / maxValue) * 100}%`,
              backgroundColor: color,
              borderRadius: config.borderRadius.sm,
              transition: 'all 0.3s ease',
            }}
            title={`${labels[index]}: ${value} activities`}
          >
            <div 
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                color: config.colors.text,
                backgroundColor: config.colors.surface,
                padding: '2px 6px',
                borderRadius: config.borderRadius.sm,
                border: `1px solid ${config.colors.border}`,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <div 
        className="flex justify-between mt-2 text-xs"
        style={{
          color: config.colors.textSecondary,
          fontSize: config.typography.fontSize.xs,
        }}
      >
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
};

/**
 * Threshold alerts component.
 */
interface ThresholdAlertsProps {
  violations: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'error';
  }>;
  config: ActivityAnalyticsDashboardConfig['theme'];
}

const ThresholdAlerts: React.FC<ThresholdAlertsProps> = ({ violations, config }) => {
  if (violations.length === 0) return null;

  return (
    <div 
      className="p-4 rounded-lg border mb-4"
      style={{
        backgroundColor: violations.some(v => v.severity === 'error') 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(251, 191, 36, 0.1)',
        borderColor: violations.some(v => v.severity === 'error')
          ? config.colors.error
          : config.colors.warning,
        fontFamily: config.typography.fontFamily,
      }}
    >
      <div 
        className="text-sm font-medium mb-2"
        style={{
          color: violations.some(v => v.severity === 'error')
            ? config.colors.error
            : config.colors.warning,
          fontSize: config.typography.fontSize.sm,
          fontWeight: config.typography.fontWeight.medium,
        }}
      >
        ⚠️ Threshold Alerts ({violations.length})
      </div>
      <div className="space-y-1">
        {violations.map((violation, index) => (
          <div 
            key={index}
            className="text-xs flex justify-between items-center"
            style={{
              color: config.colors.text,
              fontSize: config.typography.fontSize.xs,
            }}
          >
            <span>{violation.metric}</span>
            <span 
              className="px-2 py-1 rounded text-xs"
              style={{
                backgroundColor: violation.severity === 'error' 
                  ? config.colors.error 
                  : config.colors.warning,
                color: config.colors.background,
                borderRadius: config.borderRadius.sm,
              }}
            >
              {violation.value.toFixed(2)} / {violation.threshold}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Activity Analytics Dashboard Component.
 * 
 * Provides a comprehensive view of Idle Village activity metrics with:
 * - Real-time metric cards
 * - Activity pattern charts
 * - Threshold monitoring
 * - Config-first styling with Style Laboratory tokens
 * - Performance optimizations
 */
export const ActivityAnalyticsDashboard: React.FC<ActivityAnalyticsDashboardProps> = ({
  config = DEFAULT_ANALYTICS_DASHBOARD_CONFIG,
  showHeader = true,
  showThresholds = true,
  enableRealTime = true,
  className = '',
}) => {
  const {
    metrics,
    isLoading,
    error,
    storeStats,
    checkThresholds,
  } = useActivityAnalytics({
    enableAutoRefresh: enableRealTime,
    autoRefreshInterval: config.layout.refreshIntervalMs,
  });

  // Check thresholds
  const thresholdCheck = useMemo(() => {
    if (!metrics || !showThresholds) return { isAboveThresholds: false, violations: [] };
    return checkThresholds(DEFAULT_ANALYTICS_THRESHOLDS);
  }, [metrics, showThresholds, checkThresholds]);

  // Loading state
  if (isLoading && !metrics) {
    return (
      <div 
        className={`p-8 text-center ${className}`}
        style={{
          backgroundColor: config.theme.colors.background,
          color: config.theme.colors.text,
          fontFamily: config.theme.typography.fontFamily,
        }}
      >
        <div>Loading analytics...</div>
      </div>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <div 
        className={`p-8 text-center ${className}`}
        style={{
          backgroundColor: config.theme.colors.background,
          color: config.theme.colors.error,
          fontFamily: config.theme.typography.fontFamily,
        }}
      >
        <div>Error loading analytics: {error}</div>
      </div>
    );
  }

  return (
    <div 
      className={`space-y-6 ${className}`}
      style={{
        backgroundColor: config.theme.colors.background,
        color: config.theme.colors.text,
        fontFamily: config.theme.typography.fontFamily,
      }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{
                fontSize: config.theme.typography.fontSize['2xl'],
                fontWeight: config.theme.typography.fontWeight.bold,
                color: config.theme.colors.text,
              }}
            >
              Activity Analytics Dashboard
            </h1>
            <p 
              className="text-sm mt-1"
              style={{
                fontSize: config.theme.typography.fontSize.sm,
                color: config.theme.colors.textSecondary,
              }}
            >
              Real-time insights for Idle Village activities
            </p>
          </div>
          {storeStats && (
            <div 
              className="text-xs text-right"
              style={{
                fontSize: config.theme.typography.fontSize.xs,
                color: config.theme.colors.textSecondary,
              }}
            >
              <div>Session: {storeStats.sessionId.slice(-8)}</div>
              <div>Events: {storeStats.eventCount}</div>
              <div>Cache: {Math.round(storeStats.cacheAge / 1000)}s old</div>
            </div>
          )}
        </div>
      )}

      {/* Threshold Alerts */}
      {thresholdCheck.isAboveThresholds && (
        <ThresholdAlerts 
          violations={thresholdCheck.violations} 
          config={config.theme}
        />
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
          }}
        >
          {/* Total Activities */}
          <MetricCard
            title="Total Activities"
            value={Object.values(metrics.eventsByType).reduce((sum, count) => sum + count, 0)}
            subtitle="All time"
            color={config.theme.colors.primary}
            config={config.theme}
          />

          {/* Job Completion Rate */}
          <MetricCard
            title="Job Completion Rate"
            value={`${(metrics.completionRates.job * 100).toFixed(1)}%`}
            subtitle="Jobs completed successfully"
            trend={metrics.completionRates.job >= 0.8 ? 'up' : 'down'}
            color={metrics.completionRates.job >= 0.8 ? config.theme.colors.success : config.theme.colors.error}
            config={config.theme}
          />

          {/* Quest Completion Rate */}
          <MetricCard
            title="Quest Completion Rate"
            value={`${(metrics.completionRates.quest * 100).toFixed(1)}%`}
            subtitle="Quests completed successfully"
            trend={metrics.completionRates.quest >= 0.8 ? 'up' : 'down'}
            color={metrics.completionRates.quest >= 0.8 ? config.theme.colors.success : config.theme.colors.error}
            config={config.theme}
          />

          {/* Maintenance Completion Rate */}
          <MetricCard
            title="Maintenance Rate"
            value={`${(metrics.completionRates.maintenance * 100).toFixed(1)}%`}
            subtitle="Maintenance completed"
            trend={metrics.completionRates.maintenance >= 0.8 ? 'up' : 'down'}
            color={metrics.completionRates.maintenance >= 0.8 ? config.theme.colors.success : config.theme.colors.error}
            config={config.theme}
          />

          {/* Average Job Time */}
          <MetricCard
            title="Avg Job Time"
            value={`${Math.round(metrics.averageCompletionTimes.job)}s`}
            subtitle="Time to complete jobs"
            color={config.theme.colors.accent}
            config={config.theme}
          />

          {/* High Risk Activities */}
          <MetricCard
            title="High Risk Activities"
            value={metrics.riskMetrics.highRiskActivities}
            subtitle="Activities above risk threshold"
            color={metrics.riskMetrics.highRiskActivities > 0 ? config.theme.colors.warning : config.theme.colors.success}
            config={config.theme}
          />

          {/* Fatigue Failures */}
          <MetricCard
            title="Fatigue Failures"
            value={metrics.fatigueMetrics.fatigueRelatedFailures}
            subtitle="Failures due to fatigue"
            color={metrics.fatigueMetrics.fatigueRelatedFailures > 0 ? config.theme.colors.error : config.theme.colors.success}
            config={config.theme}
          />

          {/* Active Residents */}
          <MetricCard
            title="Active Residents"
            value={Object.keys(metrics.residentPerformance).length}
            subtitle="Residents with activity data"
            color={config.theme.colors.primary}
            config={config.theme}
          />
        </div>
      )}

      {/* Activity Pattern Chart */}
      {metrics && (
        <ActivityChart
          data={metrics.hourlyActivityPattern}
          labels={['00', '04', '08', '12', '16', '20', '24']}
          color={config.theme.colors.primary}
          config={config.theme}
        />
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`,
          }}
        >
          {/* Resident Performance Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: config.theme.colors.surface,
              borderColor: config.theme.colors.border,
            }}
          >
            <div 
              className="text-sm font-medium mb-3"
              style={{
                color: config.theme.colors.text,
                fontSize: config.theme.typography.fontSize.sm,
                fontWeight: config.theme.typography.fontWeight.medium,
              }}
            >
              Top Residents by Performance
            </div>
            <div className="space-y-2">
              {Object.entries(metrics.residentPerformance)
                .sort(([,a], [,b]) => b.completionRate - a.completionRate)
                .slice(0, 5)
                .map(([residentId, performance], index) => (
                  <div 
                    key={residentId}
                    className="flex justify-between items-center text-xs"
                    style={{
                      color: config.theme.colors.text,
                      fontSize: config.theme.typography.fontSize.xs,
                    }}
                  >
                    <span>{residentId.slice(-8)}</span>
                    <span 
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: performance.completionRate >= 0.8 
                          ? config.theme.colors.success 
                          : config.theme.colors.warning,
                        color: config.theme.colors.background,
                        borderRadius: config.theme.borderRadius.sm,
                      }}
                    >
                      {(performance.completionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Risk Assessment Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: config.theme.colors.surface,
              borderColor: config.theme.colors.border,
            }}
          >
            <div 
              className="text-sm font-medium mb-3"
              style={{
                color: config.theme.colors.text,
                fontSize: config.theme.typography.fontSize.sm,
                fontWeight: config.theme.typography.fontWeight.medium,
              }}
            >
              Risk Assessment
            </div>
            <div className="space-y-2">
              {Object.entries(metrics.riskMetrics.riskByActivityType).map(([activityType, risk]) => (
                <div 
                  key={activityType}
                  className="flex justify-between items-center text-xs"
                  style={{
                    color: config.theme.colors.text,
                    fontSize: config.theme.typography.fontSize.xs,
                  }}
                >
                  <span className="capitalize">{activityType}</span>
                  <span 
                    className="px-2 py-1 rounded"
                    style={{
                      backgroundColor: risk > 0.5 
                        ? config.theme.colors.warning 
                        : config.theme.colors.success,
                      color: config.theme.colors.background,
                      borderRadius: config.theme.borderRadius.sm,
                    }}
                  >
                    {(risk * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
