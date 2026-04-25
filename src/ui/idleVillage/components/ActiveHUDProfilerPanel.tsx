/**
 * Active HUD Performance Profiler Panel Component
 * 
 * React component that displays real-time performance metrics for the Active HUD.
 * Provides toggleable panel with FPS, render time, and other performance indicators.
 * 
 * @since NP-104 – Idle Village Active HUD Performance Profiler
 * @dependencies Phase 12 Active HUD
 */

import React, { memo, useMemo } from 'react';
import type { 
  PerformanceMetricType,
  PerformanceThreshold,
  ActiveHUDProfilerConfig 
} from '../config/activeHUDProfilerConfig';
import type { 
  UseActiveHUDProfilerReturn,
  PerformanceStats 
} from '../hooks/useActiveHUDProfiler';
import { getPerformanceColor } from '../config/activeHUDProfilerConfig';

/**
 * Component props
 */
export interface ActiveHUDProfilerPanelProps {
  /** Profiler hook return value */
  profiler: UseActiveHUDProfilerReturn;
  /** Additional CSS class names */
  className?: string;
  /** Custom styling */
  style?: React.CSSProperties;
}

/**
 * Metric display component
 */
const MetricDisplay: React.FC<{
  metricType: PerformanceMetricType;
  stats: PerformanceStats | null;
  config: ActiveHUDProfilerConfig;
}> = memo(({ metricType, stats, config }) => {
  const metricConfig = config.metrics.find(m => m.id === metricType);
  if (!metricConfig || !metricConfig.enabled || !stats) return null;

  const color = getPerformanceColor(config, stats.currentThreshold);
  const unit = metricConfig.unit;
  const value = stats.average;

  return (
    <div className="profiler-metric" style={{ borderColor: color }}>
      <div className="metric-header">
        <span className="metric-name">{metricConfig.name}</span>
        <span 
          className="metric-threshold" 
          style={{ color }}
        >
          {stats.currentThreshold}
        </span>
      </div>
      <div className="metric-value">
        <span className="value" style={{ color }}>
          {unit === 'fps' ? Math.round(value) : value.toFixed(unit === 'ms' ? 1 : 0)}
        </span>
        <span className="unit">{unit}</span>
      </div>
      <div className="metric-details">
        <span>Min: {stats.min.toFixed(1)}</span>
        <span>Max: {stats.max.toFixed(1)}</span>
        <span>P95: {stats.p95.toFixed(1)}</span>
      </div>
    </div>
  );
});

MetricDisplay.displayName = 'MetricDisplay';

/**
 * Session info component
 */
const SessionInfo: React.FC<{
  profiler: UseActiveHUDProfilerReturn;
}> = memo(({ profiler }) => {
  const session = profiler.currentSession;
  if (!session) return null;

  const duration = session.endTime ? session.duration : Date.now() - session.startTime;
  const durationFormatted = new Date(duration).toISOString().substr(14, 8).replace(/^[0:]*/, '');

  return (
    <div className="session-info">
      <div className="session-header">
        <span>Session: {session.id.substr(0, 8)}</span>
        <span className={`status ${profiler.isProfiling ? 'active' : 'stopped'}`}>
          {profiler.isProfiling ? '● Recording' : '■ Stopped'}
        </span>
      </div>
      <div className="session-details">
        <span>Duration: {durationFormatted}</span>
        <span>Data Points: {session.dataPoints}</span>
      </div>
    </div>
  );
});

SessionInfo.displayName = 'SessionInfo';

/**
 * Export controls component
 */
const ExportControls: React.FC<{
  profiler: UseActiveHUDProfilerReturn;
}> = memo(({ profiler }) => {
  const handleExport = (format: 'json' | 'csv' | 'markdown') => {
    try {
      const data = profiler.exportData(format);
      const blob = new Blob([data], { 
        type: profiler.config.exports.find(e => e.id === format)?.mimeType 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `active-hud-profile-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="export-controls">
      <div className="export-header">Export Data</div>
      <div className="export-buttons">
        {profiler.config.exports
          .filter(format => format.available)
          .map(format => (
            <button
              key={format.id}
              onClick={() => handleExport(format.id as 'json' | 'csv' | 'markdown')}
              className="export-button"
              disabled={!profiler.currentSession}
            >
              {format.name}
            </button>
          ))}
      </div>
    </div>
  );
});

ExportControls.displayName = 'ExportControls';

/**
 * Main profiler panel component
 */
export const ActiveHUDProfilerPanel: React.FC<ActiveHUDProfilerPanelProps> = memo(({
  profiler,
  className = '',
  style
}) => {
  const { config, performanceStats, togglePanel, clearData, startProfiling, stopProfiling } = profiler;

  // Calculate overall performance score
  const overallScore = useMemo(() => {
    const enabledMetrics = config.metrics.filter(m => m.enabled);
    if (enabledMetrics.length === 0) return null;

    const scores = enabledMetrics.map(metric => {
      const stats = performanceStats[metric.id];
      if (!stats) return 0;

      const thresholdScores = {
        excellent: 100,
        good: 80,
        acceptable: 60,
        poor: 40,
        critical: 20
      };

      return thresholdScores[stats.currentThreshold];
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [config.metrics, performanceStats]);

  const overallColor = useMemo(() => {
    if (overallScore === null) return '#6b7280';
    if (overallScore >= 90) return config.ui.colorScheme.excellent;
    if (overallScore >= 70) return config.ui.colorScheme.good;
    if (overallScore >= 50) return config.ui.colorScheme.acceptable;
    if (overallScore >= 30) return config.ui.colorScheme.poor;
    return config.ui.colorScheme.critical;
  }, [overallScore, config.ui.colorScheme]);

  // Panel positioning classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (!profiler.panelVisible) {
    return (
      <button
        onClick={togglePanel}
        className="profiler-toggle"
        style={{
          position: 'fixed',
          ...positionClasses[config.ui.panelPosition].split(' ').reduce((acc, pos) => {
            if (pos.includes('top')) acc.top = '1rem';
            if (pos.includes('bottom')) acc.bottom = '1rem';
            if (pos.includes('left')) acc.left = '1rem';
            if (pos.includes('right')) acc.right = '1rem';
            return acc;
          }, {} as React.CSSProperties),
          zIndex: 9999,
          padding: '0.5rem',
          backgroundColor: '#1f2937',
          color: '#f3f4f6',
          border: `1px solid ${overallColor}`,
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          cursor: 'pointer'
        }}
      >
        📊 {overallScore !== null ? `${overallScore}%` : 'OFF'}
      </button>
    );
  }

  return (
    <div
      className={`active-hud-profiler-panel ${className} ${config.ui.compactMode ? 'compact' : ''}`}
      style={{
        position: 'fixed',
        ...positionClasses[config.ui.panelPosition].split(' ').reduce((acc, pos) => {
          if (pos.includes('top')) acc.top = '1rem';
          if (pos.includes('bottom')) acc.bottom = '1rem';
          if (pos.includes('left')) acc.left = '1rem';
          if (pos.includes('right')) acc.right = '1rem';
          return acc;
        }, {} as React.CSSProperties),
        zIndex: 9999,
        backgroundColor: '#1f2937',
        color: '#f3f4f6',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        padding: config.ui.compactMode ? '0.75rem' : '1rem',
        fontSize: '0.875rem',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        minWidth: config.ui.compactMode ? '200px' : '320px',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        ...style
      }}
    >
      {/* Header */}
      <div className="profiler-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid #374151'
      }}>
        <div className="header-title" style={{
          fontWeight: 'bold',
          fontSize: config.ui.compactMode ? '0.875rem' : '1rem'
        }}>
          📊 Active HUD Profiler
        </div>
        <div className="header-controls" style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          {overallScore !== null && (
            <div 
              className="overall-score"
              style={{
                backgroundColor: overallColor,
                color: '#ffffff',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              {overallScore}%
            </div>
          )}
          <button
            onClick={togglePanel}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Session Info */}
      <SessionInfo profiler={profiler} />

      {/* Controls */}
      <div className="profiler-controls" style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {!profiler.isProfiling ? (
          <button
            onClick={startProfiling}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ▶ Start
          </button>
        ) : (
          <button
            onClick={stopProfiling}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ■ Stop
          </button>
        )}
        <button
          onClick={clearData}
          style={{
            backgroundColor: '#6b7280',
            color: '#ffffff',
            border: 'none',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          🗑 Clear
        </button>
      </div>

      {/* Metrics */}
      <div className="metrics-container" style={{
        display: 'grid',
        gridTemplateColumns: config.ui.compactMode ? '1fr' : 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        {config.metrics
          .filter(metric => metric.enabled)
          .map(metric => (
            <MetricDisplay
              key={metric.id}
              metricType={metric.id}
              stats={performanceStats[metric.id]}
              config={config}
            />
          ))}
      </div>

      {/* Export Controls */}
      {!config.ui.compactMode && <ExportControls profiler={profiler} />}
    </div>
  );
});

ActiveHUDProfilerPanel.displayName = 'ActiveHUDProfilerPanel';

export default ActiveHUDProfilerPanel;
