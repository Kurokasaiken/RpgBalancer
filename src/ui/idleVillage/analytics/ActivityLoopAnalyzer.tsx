/**
 * Idle Village Activity Loop Bottleneck Analyzer Component
 * 
 * Interactive dashboard for identifying and visualizing activity loop bottlenecks
 * with charts, tables, and export functionality.
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useActivityLoopAnalytics } from '../hooks/useActivityLoopAnalytics';
import type { ActivityLoopPreset, ActivityBottleneck } from '../hooks/useActivityLoopAnalytics';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('ActivityLoopAnalyzer', 'idleVillage');

/**
 * Props for ActivityLoopAnalyzer component
 */
interface ActivityLoopAnalyzerProps {
  /** Initial configuration */
  initialConfig?: Partial<import('../analytics/activityLoopAnalyzerConfig').ActivityLoopAnalyzerConfig>;
  /** Enable sample data for testing */
  enableSampleData?: boolean;
  /** Height of the dashboard */
  height?: number;
  /** Width of the dashboard */
  width?: number;
  /** On export callback */
  onExport?: (data: string, format: 'json' | 'csv' | 'markdown') => void;
  /** On bottleneck click callback */
  onBottleneckClick?: (bottleneck: ActivityBottleneck) => void;
  /** Compact mode for minimal space usage */
  compactMode?: boolean;
}

/**
 * Severity badge component
 */
interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
  compact?: boolean;
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, compact = false }) => {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const size = compact ? 'text-xs' : 'text-sm';
  const padding = compact ? 'px-1' : 'px-2';

  return (
    <span
      className={`${getSeverityColor(severity)} ${size} ${padding} rounded-full text-white font-semibold inline-flex items-center justify-center`}
    >
      {severity.toUpperCase()}
    </span>
  );
};

/**
 * Metrics card component
 */
interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, subtitle, trend, color }) => {
  const getTrendIcon = (t: string) => {
    switch (t) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${color} mb-1`}>
        {value}
        {trend && <span className="text-sm ml-1">{getTrendIcon(trend)}</span>}
      </div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
};

/**
 * Activity Loop Analyzer Component
 */
export const ActivityLoopAnalyzer: React.FC<ActivityLoopAnalyzerProps> = ({
  initialConfig,
  enableSampleData = false,
  height = 600,
  width = 800,
  onExport,
  onBottleneckClick,
  compactMode = false,
}) => {
  const {
    state,
    updateConfig,
    updateFilters,
    resetToDefault,
    applyPreset,
    exportData,
    refreshData,
    getCurrentMetrics,
    getBottlenecks,
    toggleAutoRefresh,
  } = useActivityLoopAnalytics({
    initialConfig,
    enableSampleData,
    refreshInterval: 30,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Get severity color for bottleneck
   */
  const getSeverityColor = useCallback((severity: string): string => {
    switch (severity) {
      case 'low': return state.config.palette.low;
      case 'medium': return state.config.palette.medium;
      case 'high': return state.config.palette.high;
      case 'critical': return state.config.palette.critical;
      default: return state.config.palette.neutral;
    }
  }, [state.config.palette]);

  /**
   * Render bottleneck table
   */
  const renderBottleneckTable = useCallback((): JSX.Element => {
    const bottlenecks = getBottlenecks();

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-2">Activity</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Severity</th>
              <th className="text-left p-2">Impact</th>
              <th className="text-left p-2">Throughput</th>
              <th className="text-left p-2">Backlog</th>
              <th className="text-left p-2">Failure Rate</th>
              {!compactMode && <th className="text-left p-2">Recommendations</th>}
            </tr>
          </thead>
          <tbody>
            {bottlenecks.map((bottleneck, index) => (
              <tr
                key={`${bottleneck.activityId}-${index}`}
                className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => onBottleneckClick?.(bottleneck)}
              >
                <td className="p-2 capitalize">{bottleneck.activityType}</td>
                <td className="p-2">{bottleneck.bottleneckType}</td>
                <td className="p-2">
                  <SeverityBadge severity={bottleneck.severity} compact={true} />
                </td>
                <td className="p-2">{bottleneck.impactScore.toFixed(1)}%</td>
                <td className="p-2">
                  {bottleneck.currentMetrics.throughputRate.toFixed(2)} / {bottleneck.targetMetrics.targetThroughputRate.toFixed(2)}
                </td>
                <td className="p-2">
                  {bottleneck.currentMetrics.currentBacklog} / {bottleneck.targetMetrics.maxBacklog}
                </td>
                <td className="p-2">{bottleneck.currentMetrics.failureRate.toFixed(1)}%</td>
                {!compactMode && (
                  <td className="p-2">
                    <div className="max-w-xs truncate">
                      {bottleneck.recommendations.slice(0, 2).join(', ')}
                      {bottleneck.recommendations.length > 2 && '...'}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {bottlenecks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No bottlenecks detected within current filters
          </div>
        )}
      </div>
    );
  }, [getBottlenecks, onBottleneckClick, compactMode]);

  /**
   * Render export controls
   */
  const renderExportControls = useCallback((): JSX.Element => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
        <button
          onClick={() => {
            const data = exportData({
              includeRawEvents: true,
              includeBottlenecks: true,
              includeMetrics: true,
              includeRecommendations: true,
              format: 'json',
            });
            onExport?.(data, 'json');
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          Export JSON
        </button>
        <button
          onClick={() => {
            const data = exportData({
              includeRawEvents: false,
              includeBottlenecks: true,
              includeMetrics: true,
              includeRecommendations: true,
              format: 'csv',
            });
            onExport?.(data, 'csv');
          }}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
        >
          Export CSV
        </button>
        <button
          onClick={() => {
            const data = exportData({
              includeRawEvents: false,
              includeBottlenecks: true,
              includeMetrics: true,
              includeRecommendations: true,
              format: 'markdown',
            });
            onExport?.(data, 'markdown');
          }}
          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
        >
          Export MD
        </button>
      </div>
    );
  }, [exportData, onExport]);

  /**
   * Render preset controls
   */
  const renderPresetControls = useCallback((): JSX.Element => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
        <label className="text-sm text-gray-300">Preset:</label>
        <select
          onChange={(e) => {
            applyPreset(e.target.value as ActivityLoopPreset);
          }}
          className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600 text-sm"
        >
          <option value="default">Default</option>
          <option value="realtime">Real-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="performance">Performance</option>
        </select>
        <button
          onClick={resetToDefault}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
        >
          Reset
        </button>
      </div>
    );
  }, [applyPreset, resetToDefault]);

  /**
   * Render metrics summary
   */
  const renderMetricsSummary = useCallback((): JSX.Element => {
    const metrics = getCurrentMetrics();
    const bottlenecks = getBottlenecks();

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Started"
          value={metrics.totalStarted.toLocaleString()}
          color="text-blue-400"
        />
        <MetricsCard
          title="Throughput Rate"
          value={`${metrics.throughputRate.toFixed(2)}`}
          subtitle="activities/hour"
          color="text-green-400"
        />
        <MetricsCard
          title="Current Backlog"
          value={metrics.currentBacklog}
          subtitle={`avg: ${metrics.averageBacklog.toFixed(1)}`}
          color="text-yellow-400"
        />
        <MetricsCard
          title="Failure Rate"
          value={`${metrics.failureRate.toFixed(1)}%`}
          subtitle={`cancel: ${metrics.cancellationRate.toFixed(1)}%`}
          color="text-red-400"
        />
      </div>
    );
  }, [getCurrentMetrics, getBottlenecks]);

  /**
   * Render auto-refresh toggle
   */
  const renderAutoRefreshToggle = useCallback((): JSX.Element => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
        <label className="text-sm text-gray-300">Auto-refresh:</label>
        <button
          onClick={toggleAutoRefresh}
          className={`px-3 py-1 rounded transition-colors text-sm ${
            state.autoRefreshEnabled
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {state.autoRefreshEnabled ? 'Enabled' : 'Disabled'}
        </button>
        <span className="text-xs text-gray-400">
          ({state.config.display.chartRefreshInterval}s)
        </span>
      </div>
    );
  }, [state.autoRefreshEnabled, toggleAutoRefresh, state.config.display]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const newWidth = Math.min(clientWidth, width);
        containerRef.current.style.width = `${newWidth}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        refreshData();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [refreshData]);

  return (
    <div
      ref={containerRef}
      className={`bg-gray-900 rounded-lg overflow-hidden ${compactMode ? 'p-2' : 'p-4'}`}
      style={{ width: '100%', height: `${height}px` }}
    >
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-gray-300">Loading...</div>
        </div>
      )}
      
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75">
          <div className="text-red-300">Error: {state.error}</div>
        </div>
      )}
      
      <div className="space-y-4">
        {renderPresetControls()}
        {renderAutoRefreshToggle()}
        {renderExportControls()}
        {renderMetricsSummary()}
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Identified Bottlenecks</h3>
          {renderBottleneckTable()}
        </div>
      </div>
    </div>
  );
};
