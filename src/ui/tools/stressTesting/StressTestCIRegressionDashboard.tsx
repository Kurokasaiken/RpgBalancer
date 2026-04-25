/**
 * Stress Test CI Regression Dashboard
 * 
 * React component for monitoring stress testing pipeline regressions.
 * Displays real-time metrics, trends, and alerts for stress test performance.
 * 
 * @module StressTestCIRegressionDashboard
 * @since 2026-01-12
 * @author Vector-Monitor
 */

import React, { useState, useEffect } from 'react';
import type { CIPipelineMetrics, RegressionAlert, StressTestMetrics } from '@/scripts/coord/ci-regression-monitor';

/**
 * Dashboard props
 */
interface StressTestCIRegressionDashboardProps {
  /** Base URL for CI API */
  apiBaseUrl?: string;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether to show stress test specific metrics */
  showStressTestMetrics?: boolean;
}

/**
 * Dashboard state
 */
interface DashboardState {
  metrics: CIPipelineMetrics[];
  alerts: RegressionAlert[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Stress Test CI Regression Dashboard Component
 */
export const StressTestCIRegressionDashboard: React.FC<StressTestCIRegressionDashboardProps> = ({
  apiBaseUrl = '/api/ci-regression-monitor',
  refreshInterval = 30000, // 30 seconds
  showStressTestMetrics = true,
}) => {
  const [state, setState] = useState<DashboardState>({
    metrics: [],
    alerts: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const [selectedMetric, setSelectedMetric] = useState<string>('buildDuration');
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  /**
   * Fetch CI metrics from API
   */
  const fetchMetrics = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`${apiBaseUrl}/metrics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState({
        metrics: data.metrics || [],
        alerts: data.alerts || [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  /**
   * Setup refresh interval
   */
  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [apiBaseUrl, refreshInterval]);

  /**
   * Get filtered alerts
   */
  const getFilteredAlerts = (): RegressionAlert[] => {
    if (alertFilter === 'all') return state.alerts;
    return state.alerts.filter(alert => alert.severity === alertFilter);
  };

  /**
   * Get recent stress test metrics
   */
  const getRecentStressTestMetrics = (): StressTestMetrics[] => {
    return state.metrics
      .filter(m => m.stressTestResults !== undefined)
      .map(m => m.stressTestResults!)
      .slice(-10); // Last 10 stress test runs
  };

  /**
   * Calculate trend for a metric
   */
  const calculateTrend = (metricName: string): 'up' | 'down' | 'stable' => {
    if (state.metrics.length < 2) return 'stable';

    const recent = state.metrics.slice(-5);
    const older = state.metrics.slice(-10, -5);

    const getMetricValue = (metric: CIPipelineMetrics): number => {
      switch (metricName) {
        case 'buildDuration':
          return metric.buildDuration;
        case 'testDuration':
          return metric.testDuration;
        case 'stressTestDuration':
          return metric.stressTestResults?.duration || 0;
        case 'stressTestSimulationsPerSecond':
          return metric.stressTestResults?.performance.simulationsPerSecond || 0;
        case 'stressTestMemoryUsage':
          return metric.stressTestResults?.memoryUsage || 0;
        default:
          return 0;
      }
    };

    const recentAvg = recent.reduce((sum, m) => sum + getMetricValue(m), 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + getMetricValue(m), 0) / older.length;

    if (Math.abs(recentAvg - olderAvg) / olderAvg < 0.05) return 'stable';
    return recentAvg > olderAvg ? 'up' : 'down';
  };

  /**
   * Format duration
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  /**
   * Format memory size
   */
  const formatMemory = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  };

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (state.loading && state.metrics.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CI regression metrics...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Metrics</h3>
        <p className="text-red-600">{state.error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredAlerts = getFilteredAlerts();
  const recentStressMetrics = getRecentStressTestMetrics();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stress Test CI Regression Monitor</h1>
          <p className="text-gray-600">
            Last updated: {state.lastUpdated?.toLocaleString() || 'Never'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            state.loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {state.loading ? 'Updating...' : 'Live'}
          </span>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={state.loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Build Duration</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {formatDuration(state.metrics.slice(-1)[0]?.buildDuration || 0)}
            </span>
            <span className="text-lg">
              {getTrendIcon(calculateTrend('buildDuration'))}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Test Duration</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {formatDuration(state.metrics.slice(-1)[0]?.testDuration || 0)}
            </span>
            <span className="text-lg">
              {getTrendIcon(calculateTrend('testDuration'))}
            </span>
          </div>
        </div>

        {showStressTestMetrics && (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Stress Test Duration</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {formatDuration(state.metrics.slice(-1)[0]?.stressTestResults?.duration || 0)}
                </span>
                <span className="text-lg">
                  {getTrendIcon(calculateTrend('stressTestDuration'))}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Simulations/sec</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {state.metrics.slice(-1)[0]?.stressTestResults?.performance.simulationsPerSecond.toFixed(0) || '0'}
                </span>
                <span className="text-lg">
                  {getTrendIcon(calculateTrend('stressTestSimulationsPerSecond'))}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Alerts Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Regression Alerts</h2>
            <div className="flex items-center space-x-2">
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All ({state.alerts.length})</option>
                <option value="critical">Critical ({state.alerts.filter(a => a.severity === 'critical').length})</option>
                <option value="high">High ({state.alerts.filter(a => a.severity === 'high').length})</option>
                <option value="medium">Medium ({state.alerts.filter(a => a.severity === 'medium').length})</option>
                <option value="low">Low ({state.alerts.filter(a => a.severity === 'low').length})</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No {alertFilter === 'all' ? '' : alertFilter} alerts detected
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{alert.type}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{alert.description}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alert.recommendation}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Current: {alert.currentValue}</span>
                      <span>Baseline: {alert.baselineValue}</span>
                      <span>Threshold: {alert.threshold}</span>
                      <span>Commit: {alert.commit.substring(0, 7)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stress Test Metrics Table */}
      {showStressTestMetrics && recentStressMetrics.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Stress Test Runs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Simulations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sim/sec
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Memory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cache Hit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OP Synergies
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentStressMetrics.map((metrics, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metrics.config.seed}-{new Date().toISOString().split('T')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(metrics.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metrics.simulationsRun.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metrics.performance.simulationsPerSecond.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMemory(metrics.memoryUsage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metrics.cacheHitRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metrics.opSynergies}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StressTestCIRegressionDashboard;
