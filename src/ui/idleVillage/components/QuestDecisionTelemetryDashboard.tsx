/**
 * Idle Village Quest Decision Telemetry Dashboard
 * 
 * Comprehensive dashboard for visualizing quest decision telemetry
 * with real-time feeds, analytics, and alerting.
 * 
 * @module QuestDecisionTelemetryDashboard
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useQuestDecisionTelemetry,
  useQuestDecisionAnalytics,
  useQuestDecisionAlerts,
  type QuestDecisionTelemetryEvent,
  type QuestDecisionMetrics,
} from '@/ui/idleVillage/hooks/useQuestDecisionTelemetry';

/**
 * Dashboard Props
 */
export interface QuestDecisionTelemetryDashboardProps {
  /** Dashboard configuration */
  config?: {
    showFeed?: boolean;
    showAnalytics?: boolean;
    showAlerts?: boolean;
    showRealTime?: boolean;
    refreshInterval?: number;
    maxEvents?: number;
  };
  /** CSS class name */
  className?: string;
  /** Height */
  height?: string | number;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Simple decision card component
 */
const DecisionCard: React.FC<{
  event: QuestDecisionTelemetryEvent;
  compact?: boolean;
}> = ({ event, compact = false }) => {
  const getDecisionColor = (type: string) => {
    const colors = {
      quest_accept: '#22c55e',
      quest_reject: '#ef4444',
      quest_abandon: '#f59e0b',
      quest_complete: '#10b981',
      quest_fail: '#ef4444',
      quest_pause: '#6b7280',
      quest_resume: '#3b82f6',
      quest_skip: '#8b5cf6',
      quest_retry: '#f97316',
      quest_modify: '#06b6d4',
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  const getConfidenceColor = (confidence: string) => {
    const colors = {
      very_low: '#ef4444',
      low: '#f59e0b',
      medium: '#eab308',
      high: '#84cc16',
      very_high: '#22c55e',
      certain: '#10b981',
    };
    return colors[confidence as keyof typeof colors] || '#6b7280';
  };

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '6px',
          marginBottom: '4px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getDecisionColor(event.outcome.decisionType),
            }}
          />
          <span style={{ color: '#f3f4f6', fontWeight: 'bold' }}>
            {event.questName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#9ca3af' }}>
            {event.outcome.decisionType.replace('_', ' ')}
          </span>
          <div
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: getConfidenceColor(event.outcome.confidence),
              color: '#ffffff',
              fontSize: '10px',
            }}
          >
            {event.outcome.confidence}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getDecisionColor(event.outcome.decisionType),
            }}
          />
          <div>
            <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '14px' }}>
              {event.questName}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              {event.questCategory} • {event.questDifficulty}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: getDecisionColor(event.outcome.decisionType),
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {event.outcome.decisionType.replace('_', ' ').toUpperCase()}
          </div>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: getConfidenceColor(event.outcome.confidence),
              color: '#ffffff',
              fontSize: '11px',
            }}
          >
            {event.outcome.confidence.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
        <div>
          <span style={{ color: '#9ca3af' }}>Player Level:</span>
          <span style={{ color: '#f3f4f6', marginLeft: '8px' }}>
            {event.context.playerLevel}
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Processing Time:</span>
          <span style={{ color: '#f3f4f6', marginLeft: '8px' }}>
            {event.outcome.processingTime}ms
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Source:</span>
          <span style={{ color: '#f3f4f6', marginLeft: '8px' }}>
            {event.outcome.source.replace('_', ' ')}
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Time:</span>
          <span style={{ color: '#f3f4f6', marginLeft: '8px' }}>
            {new Date(event.outcome.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      {event.outcome.justification && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #374151' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
            Justification:
          </div>
          <div style={{ color: '#f3f4f6', fontSize: '12px' }}>
            {event.outcome.justification}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Metrics display component
 */
const MetricsDisplay: React.FC<{
  metrics: QuestDecisionMetrics;
  compact?: boolean;
}> = ({ metrics, compact = false }) => {
  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
  };

  const formatPercentage = (num: number) => (num * 100).toFixed(1) + '%';

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
        <div>
          <span style={{ color: '#9ca3af' }}>Total:</span>
          <span style={{ color: '#f3f4f6', marginLeft: '4px', fontWeight: 'bold' }}>
            {formatNumber(metrics.totalDecisions)}
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Success:</span>
          <span style={{ color: '#22c55e', marginLeft: '4px', fontWeight: 'bold' }}>
            {formatPercentage(metrics.successRate)}
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Avg Time:</span>
          <span style={{ color: '#f3f4f6', marginLeft: '4px', fontWeight: 'bold' }}>
            {metrics.avgProcessingTime.toFixed(0)}ms
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '12px' }}>
        Quest Decision Metrics
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>Total Decisions</div>
          <div style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: 'bold' }}>
            {formatNumber(metrics.totalDecisions)}
          </div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>Success Rate</div>
          <div style={{ color: '#22c55e', fontSize: '18px', fontWeight: 'bold' }}>
            {formatPercentage(metrics.successRate)}
          </div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>Completion Rate</div>
          <div style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
            {formatPercentage(metrics.completionRate)}
          </div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>Revert Rate</div>
          <div style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>
            {formatPercentage(metrics.revertRate)}
          </div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>Avg Processing</div>
          <div style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: 'bold' }}>
            {metrics.avgProcessingTime.toFixed(0)}ms
          </div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>Avg Confidence</div>
          <div style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 'bold' }}>
            {formatPercentage(metrics.avgConfidence)}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Analytics charts component
 */
const AnalyticsCharts: React.FC<{
  analytics: any;
  compact?: boolean;
}> = ({ analytics, compact = false }) => {
  const renderChart = (title: string, data: Record<string, number>, colors: Record<string, string>) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div
        style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: compact ? '12px' : '16px',
          marginBottom: '12px',
        }}
      >
        <div style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '8px', fontSize: compact ? '12px' : '14px' }}>
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(data).slice(0, compact ? 3 : undefined).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '80px', color: '#9ca3af', fontSize: '11px' }}>
                {key.replace('_', ' ')}
              </div>
              <div
                style={{
                  flex: 1,
                  height: compact ? '12px' : '16px',
                  backgroundColor: '#374151',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: colors[key] || '#3b82f6',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <div style={{ width: '30px', color: '#f3f4f6', fontSize: '11px', textAlign: 'right' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {renderChart('Categories', analytics.decisionsByCategory, {
          main_story: '#ef4444',
          side_story: '#3b82f6',
          daily: '#22c55e',
          weekly: '#f59e0b',
          special: '#8b5cf6',
        })}
        {renderChart('Sources', analytics.decisionsBySource, {
          player_choice: '#3b82f6',
          auto_decision: '#22c55e',
          system_override: '#ef4444',
          time_expired: '#f59e0b',
        })}
      </div>
    );
  }

  return (
    <div>
      {renderChart('Decisions by Category', analytics.decisionsByCategory, {
        main_story: '#ef4444',
        side_story: '#3b82f6',
        daily: '#22c55e',
        weekly: '#f59e0b',
        special: '#8b5cf6',
        event: '#06b6d4',
        tutorial: '#6b7280',
        challenge: '#f97316',
        social: '#ec4899',
      })}
      
      {renderChart('Decisions by Difficulty', analytics.decisionsByDifficulty, {
        trivial: '#22c55e',
        easy: '#84cc16',
        normal: '#3b82f6',
        hard: '#f59e0b',
        very_hard: '#ef4444',
        extreme: '#dc2626',
        impossible: '#7c2d12',
      })}
      
      {renderChart('Decisions by Source', analytics.decisionsBySource, {
        player_choice: '#3b82f6',
        auto_decision: '#22c55e',
        system_override: '#ef4444',
        time_expired: '#f59e0b',
        condition_met: '#10b981',
        condition_failed: '#ef4444',
        external_trigger: '#8b5cf6',
        ai_suggestion: '#06b6d4',
      })}
    </div>
  );
};

/**
 * Alerts component
 */
const AlertsDisplay: React.FC<{
  alerts: any[];
  onClearAlerts: () => void;
  compact?: boolean;
}> = ({ alerts, onClearAlerts, compact = false }) => {
  if (alerts.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: compact ? '12px' : '14px' }}>
          Alerts ({alerts.length})
        </div>
        <button
          onClick={onClearAlerts}
          style={{
            padding: '2px 6px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            borderRadius: '2px',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {alerts.slice(0, compact ? 2 : undefined).map((alert, index) => (
          <div
            key={`${alert.timestamp}-${index}`}
            style={{
              padding: '6px 8px',
              backgroundColor: alert.type === 'error' ? '#ef4444' : '#f59e0b',
              color: '#ffffff',
              borderRadius: '2px',
              fontSize: '11px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{alert.message}</span>
            <span style={{ fontSize: '9px', opacity: 0.8 }}>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main Dashboard Component
 */
export const QuestDecisionTelemetryDashboard: React.FC<QuestDecisionTelemetryDashboardProps> = ({
  config = {},
  className = '',
  height = '800px',
  compact = false,
}) => {
  const {
    events,
    metrics,
    filteredEvents,
    isLoading,
    error,
    status,
    clearEvents,
    refreshFeed,
    exportEvents,
  } = useQuestDecisionTelemetry();

  const analytics = useQuestDecisionAnalytics(events);
  const { alerts, clearAlerts } = useQuestDecisionAlerts(metrics, {
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
  });

  const currentConfig = {
    showFeed: config.showFeed !== false,
    showAnalytics: config.showAnalytics !== false,
    showAlerts: config.showAlerts !== false,
    showRealTime: config.showRealTime !== false,
    refreshInterval: config.refreshInterval ?? 5000,
    maxEvents: config.maxEvents ?? 50,
  };

  // Auto-refresh setup
  useEffect(() => {
    if (currentConfig.showRealTime && currentConfig.refreshInterval > 0) {
      const timer = setInterval(() => {
        refreshFeed();
      }, currentConfig.refreshInterval);
      
      return () => clearInterval(timer);
    }
  }, [currentConfig.showRealTime, currentConfig.refreshInterval, refreshFeed]);

  // Process events for display
  const displayEvents = useMemo(() => {
    let filtered = filteredEvents;
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.outcome.timestamp - a.outcome.timestamp);

    // Apply limit
    if (currentConfig.maxEvents > 0) {
      filtered = filtered.slice(0, currentConfig.maxEvents);
    }

    return filtered;
  }, [filteredEvents, currentConfig.maxEvents]);

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportEvents(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quest-decisions.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <div
        className={className}
        style={{
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '12px',
          height: height,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '14px' }}>
            Quest Decisions
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => refreshFeed()}
              disabled={isLoading}
              style={{
                padding: '4px 8px',
                backgroundColor: isLoading ? '#374151' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: isLoading ? 'default' : 'pointer',
              }}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <MetricsDisplay metrics={metrics} compact={true} />
        
        {currentConfig.showAlerts && (
          <AlertsDisplay alerts={alerts} onClearAlerts={clearAlerts} compact={true} />
        )}
        
        {currentConfig.showAnalytics && (
          <AnalyticsCharts analytics={analytics} compact={true} />
        )}
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {displayEvents.map(event => (
            <DecisionCard key={event.eventId} event={event} compact={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '16px',
        height: height,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '16px' }}>
            Quest Decision Telemetry Dashboard
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
            Status: {status} • {displayEvents.length} events
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleExport('json')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => refreshFeed()}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: isLoading ? '#374151' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: isLoading ? 'default' : 'pointer',
            }}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={clearEvents}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Metrics */}
      {currentConfig.showFeed && <MetricsDisplay metrics={metrics} />}

      {/* Alerts */}
      {currentConfig.showAlerts && (
        <AlertsDisplay alerts={alerts} onClearAlerts={clearAlerts} />
      )}

      {/* Analytics */}
      {currentConfig.showAnalytics && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '12px' }}>
            Analytics Overview
          </div>
          <AnalyticsCharts analytics={analytics} />
        </div>
      )}

      {/* Events list */}
      {currentConfig.showFeed && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '12px' }}>
            Recent Decisions
          </div>
          {displayEvents.length === 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              No quest decisions found
            </div>
          ) : (
            displayEvents.map(event => (
              <DecisionCard key={event.eventId} event={event} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
