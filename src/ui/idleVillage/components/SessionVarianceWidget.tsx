/**
 * Idle Village Session Variance Widget
 * 
 * Active HUD widget for monitoring session duration variance across
 * desktop and mobile platforms with compact charts and real-time alerts.
 * 
 * @since NP-053 – Idle Village Session Variance Monitor
 */

import React, { useState, useEffect, useMemo } from 'react';
import type {
  SessionVarianceConfig,
  SessionStatistics,
  VarianceAlert,
  Platform,
  SessionBucket,
} from '../config/sessionVarianceConfig';
import {
  formatDuration,
  calculatePercentageDifference,
} from '../config/sessionVarianceConfig';
import { useSessionVariance } from '../hooks/useSessionVariance';

/**
 * Widget props
 */
export interface SessionVarianceWidgetProps {
  /** Custom configuration */
  config?: Partial<SessionVarianceConfig>;
  /** Widget size variant */
  size?: 'compact' | 'normal' | 'expanded';
  /** Show platform breakdown */
  showPlatforms?: boolean;
  /** Show bucket breakdown */
  showBuckets?: boolean;
  /** Show alerts */
  showAlerts?: boolean;
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Maximum data points for charts */
  maxDataPoints?: number;
  /** Custom className */
  className?: string;
}

/**
 * Session Variance Widget Component
 */
export const SessionVarianceWidget: React.FC<SessionVarianceWidgetProps> = ({
  config: customConfig,
  size = 'normal',
  showPlatforms = true,
  showBuckets = true,
  showAlerts = true,
  refreshInterval,
  maxDataPoints,
  className = '',
}) => {
  const variance = useSessionVariance(customConfig);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'platforms' | 'buckets' | 'alerts'>('overview');
  const [isExpanded, setIsExpanded] = useState(size === 'expanded');

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      variance.refreshStatistics();
      variance.checkAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, variance]);

  // Get chart data
  const chartData = useMemo(() => {
    const trend = variance.getSessionTrend(maxDataPoints || variance.config.ui.maxDataPoints);
    return trend.map((duration, index) => ({
      x: index,
      y: duration,
      label: formatDuration(duration),
    }));
  }, [variance, maxDataPoints]);

  // Calculate KPI status
  const kpiStatus = useMemo(() => {
    const { statistics, config } = variance;
    
    return {
      varianceStatus: statistics.variance > config.kpiTargets.maxVariance ? 'warning' : 'ok',
      variancePercentage: calculatePercentageDifference(
        statistics.variance,
        config.kpiTargets.maxVariance
      ),
      platformBalance: Object.entries(statistics.platformDistribution).every(([platform, count]) => {
        const total = Object.values(statistics.platformDistribution).reduce((a, b) => a + b, 0);
        if (total === 0) return true;
        const actualPercentage = count / total;
        const targetPercentage = config.kpiTargets.targetPlatformDistribution[platform as Platform];
        return Math.abs(actualPercentage - targetPercentage) <= 0.1; // 10% tolerance
      }) ? 'ok' : 'warning',
      bucketBalance: Object.entries(statistics.bucketDistribution).every(([bucket, count]) => {
        const total = Object.values(statistics.bucketDistribution).reduce((a, b) => a + b, 0);
        if (total === 0) return true;
        const actualPercentage = count / total;
        const targetPercentage = config.kpiTargets.targetBucketDistribution[bucket as SessionBucket];
        return Math.abs(actualPercentage - targetPercentage) <= 0.1; // 10% tolerance
      }) ? 'ok' : 'warning',
    };
  }, [variance]);

  // Render compact view
  if (size === 'compact' && !isExpanded) {
    return (
      <div className={`session-variance-widget compact ${className}`}>
        <div className="compact-header">
          <h4>Session Variance</h4>
          <button
            onClick={() => setIsExpanded(true)}
            className="expand-button"
            title="Expand widget"
          >
            ⤢
          </button>
        </div>
        
        <div className="compact-stats">
          <div className="stat-item">
            <span className="stat-label">Sessions</span>
            <span className="stat-value">{variance.statistics.totalSessions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Duration</span>
            <span className="stat-value">{formatDuration(variance.statistics.averageDuration)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Std Dev</span>
            <span className={`stat-value ${kpiStatus.varianceStatus}`}>
              {formatDuration(variance.statistics.standardDeviation)}
            </span>
          </div>
        </div>

        {showAlerts && variance.alerts.length > 0 && (
          <div className="compact-alerts">
            <span className="alert-indicator">⚠️ {variance.alerts.length}</span>
          </div>
        )}
      </div>
    );
  }

  // Render full widget
  return (
    <div className={`session-variance-widget ${size} ${className}`}>
      {/* Header */}
      <div className="widget-header">
        <div className="header-left">
          <h3>Session Variance Monitor</h3>
          <span className="last-update">
            Updated: {new Date(variance.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
        <div className="header-right">
          {size !== 'expanded' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="toggle-button"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '⤡' : '⤢'}
            </button>
          )}
          <button
            onClick={variance.refreshStatistics}
            className="refresh-button"
            title="Refresh data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="kpi-overview">
        <div className="kpi-item">
          <div className="kpi-label">Total Sessions</div>
          <div className="kpi-value">{variance.statistics.totalSessions}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">Average Duration</div>
          <div className="kpi-value">{formatDuration(variance.statistics.averageDuration)}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">Standard Deviation</div>
          <div className={`kpi-value ${kpiStatus.varianceStatus}`}>
            {formatDuration(variance.statistics.standardDeviation)}
            {kpiStatus.varianceStatus === 'warning' && (
              <span className="kpi-warning">
                ({kpiStatus.variancePercentage.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">Variance</div>
          <div className="kpi-value">{variance.statistics.variance.toFixed(0)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="widget-tabs">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`tab-button ${selectedTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        {showPlatforms && (
          <button
            onClick={() => setSelectedTab('platforms')}
            className={`tab-button ${selectedTab === 'platforms' ? 'active' : ''}`}
          >
            Platforms
          </button>
        )}
        {showBuckets && (
          <button
            onClick={() => setSelectedTab('buckets')}
            className={`tab-button ${selectedTab === 'buckets' ? 'active' : ''}`}
          >
            Buckets
          </button>
        )}
        {showAlerts && (
          <button
            onClick={() => setSelectedTab('alerts')}
            className={`tab-button ${selectedTab === 'alerts' ? 'active' : ''}`}
          >
            Alerts {variance.alerts.length > 0 && `(${variance.alerts.length})`}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {selectedTab === 'overview' && (
          <div className="overview-tab">
            {/* Mini Chart */}
            <div className="mini-chart">
              <h4>Session Duration Trend</h4>
              <div className="chart-container">
                <svg width="100%" height="120" viewBox="0 0 400 120">
                  {/* Chart grid */}
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="400" height="120" fill="url(#grid)" />
                  
                  {/* Chart line */}
                  {chartData.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      points={chartData.map((point, index) => 
                        `${(index / (chartData.length - 1)) * 380 + 10},${120 - (point.y / Math.max(...chartData.map(p => p.y))) * 100 - 10}`
                      ).join(' ')}
                    />
                  )}
                  
                  {/* Data points */}
                  {chartData.map((point, index) => (
                    <circle
                      key={index}
                      cx={(index / (chartData.length - 1)) * 380 + 10}
                      cy={120 - (point.y / Math.max(...chartData.map(p => p.y))) * 100 - 10}
                      r="3"
                      fill="#3b82f6"
                      className="data-point"
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-row">
                <span className="stat-label">Min Duration:</span>
                <span className="stat-value">{formatDuration(variance.statistics.minDuration)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Max Duration:</span>
                <span className="stat-value">{formatDuration(variance.statistics.maxDuration)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Median Duration:</span>
                <span className="stat-value">{formatDuration(variance.statistics.medianDuration)}</span>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'platforms' && (
          <div className="platforms-tab">
            <h4>Platform Distribution</h4>
            <div className="distribution-grid">
              {Object.entries(variance.statistics.platformDistribution).map(([platform, count]) => {
                const percentage = variance.statistics.totalSessions > 0 
                  ? (count / variance.statistics.totalSessions) * 100 
                  : 0;
                const target = variance.config.kpiTargets.targetPlatformDistribution[platform as Platform] * 100;
                
                return (
                  <div key={platform} className="distribution-item">
                    <div className="distribution-header">
                      <span className="platform-name">{platform}</span>
                      <span className="platform-count">{count} sessions</span>
                    </div>
                    <div className="distribution-bar">
                      <div 
                        className="distribution-fill"
                        style={{ width: `${percentage}%` }}
                      />
                      <div 
                        className="target-line"
                        style={{ left: `${target}%` }}
                        title={`Target: ${target.toFixed(1)}%`}
                      />
                    </div>
                    <div className="distribution-labels">
                      <span className="actual">{percentage.toFixed(1)}%</span>
                      <span className="target">Target: {target.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTab === 'buckets' && (
          <div className="buckets-tab">
            <h4>Session Bucket Distribution</h4>
            <div className="distribution-grid">
              {Object.entries(variance.statistics.bucketDistribution).map(([bucket, count]) => {
                const percentage = variance.statistics.totalSessions > 0 
                  ? (count / variance.statistics.totalSessions) * 100 
                  : 0;
                const target = variance.config.kpiTargets.targetBucketDistribution[bucket as SessionBucket] * 100;
                const bucketConfig = variance.config.buckets[bucket as SessionBucket];
                
                return (
                  <div key={bucket} className="distribution-item">
                    <div className="distribution-header">
                      <span className="bucket-name">{bucketConfig.name}</span>
                      <span className="bucket-count">{count} sessions</span>
                    </div>
                    <div className="distribution-bar">
                      <div 
                        className="distribution-fill"
                        style={{ width: `${percentage}%` }}
                      />
                      <div 
                        className="target-line"
                        style={{ left: `${target}%` }}
                        title={`Target: ${target.toFixed(1)}%`}
                      />
                    </div>
                    <div className="distribution-labels">
                      <span className="actual">{percentage.toFixed(1)}%</span>
                      <span className="target">Target: {target.toFixed(1)}%</span>
                    </div>
                    <div className="bucket-description">{bucketConfig.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTab === 'alerts' && (
          <div className="alerts-tab">
            <h4>Active Alerts</h4>
            {variance.alerts.length === 0 ? (
              <div className="no-alerts">
                <span className="no-alerts-icon">✅</span>
                <p>No active alerts. All KPIs are within target ranges.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {variance.alerts.map(alert => (
                  <div key={alert.id} className={`alert-item ${alert.severity}`}>
                    <div className="alert-header">
                      <span className="alert-type">{alert.type.replace('_', ' ')}</span>
                      <span className="alert-severity">{alert.severity}</span>
                      <span className="alert-time">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="alert-message">{alert.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="widget-actions">
        <button
          onClick={() => variance.exportData('json')}
          className="action-button"
          title="Export as JSON"
        >
          📄 Export JSON
        </button>
        <button
          onClick={() => variance.exportData('csv')}
          className="action-button"
          title="Export as CSV"
        >
          📊 Export CSV
        </button>
        <button
          onClick={() => variance.exportData('markdown')}
          className="action-button"
          title="Export as Markdown"
        >
          📝 Export MD
        </button>
        <button
          onClick={variance.clearSessions}
          className="action-button danger"
          title="Clear all sessions"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};

/**
 * Minimal session variance indicator
 */
export const SessionVarianceIndicator: React.FC<{
  statistics: SessionStatistics;
  config: SessionVarianceConfig;
  alerts: VarianceAlert[];
  onClick?: () => void;
}> = ({ statistics, config, alerts, onClick }) => {
  const varianceStatus = statistics.variance > config.kpiTargets.maxVariance ? 'warning' : 'ok';
  const hasAlerts = alerts.length > 0;

  return (
    <div 
      className={`session-variance-indicator ${varianceStatus} ${hasAlerts ? 'has-alerts' : ''}`}
      onClick={onClick}
      title={`Session Variance: ${formatDuration(statistics.standardDeviation)}${hasAlerts ? ` (${alerts.length} alerts)` : ''}`}
    >
      <span className="indicator-icon">
        {hasAlerts ? '⚠️' : varianceStatus === 'ok' ? '✅' : '⚡'}
      </span>
      <span className="indicator-text">
        {formatDuration(statistics.standardDeviation)}
      </span>
    </div>
  );
};

/**
 * Floating session variance widget
 */
export const FloatingSessionVarianceWidget: React.FC<SessionVarianceWidgetProps> = (props) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`floating-session-variance-widget ${isMinimized ? 'minimized' : ''}`}>
      {!isMinimized ? (
        <>
          <div className="widget-header">
            <h4>Session Variance</h4>
            <button
              onClick={() => setIsMinimized(true)}
              className="minimize-button"
              title="Minimize"
            >
              −
            </button>
          </div>
          <SessionVarianceWidget {...props} size="compact" />
        </>
      ) : (
        <div className="minimized-widget">
          <SessionVarianceIndicator
            statistics={useSessionVariance(props.config).statistics}
            config={useSessionVariance(props.config).config}
            alerts={useSessionVariance(props.config).alerts}
            onClick={() => setIsMinimized(false)}
          />
        </div>
      )}
    </div>
  );
};

export default SessionVarianceWidget;
