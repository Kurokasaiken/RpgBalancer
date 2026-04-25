/**
 * Multi-Village Monitor Panel Component
 *
 * Dashboard component for monitoring and comparing scheduler performance across multiple village environments.
 * Provides real-time KPIs, alert management, and comparative analysis visualization.
 *
 * @module MultiVillageMonitorPanel
 * @since 2026-01-13
 * @author Atlas-MultiVillage
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useMultiVillageMonitor, useAlertTrends } from '../hooks/useMultiVillageMonitor';
import type { VillageEnvironment, MonitorAlert, SchedulerKPIs } from '../services/multiVillageSchedulerMonitor';
import type { UseMultiVillageMonitorConfig } from '../hooks/useMultiVillageMonitor';

export interface MultiVillageMonitorPanelProps {
  /** Initial villages to monitor */
  initialVillages?: VillageEnvironment[];
  /** Hook configuration */
  config?: UseMultiVillageMonitorConfig;
  /** CSS class name */
  className?: string;
  /** Callback when alerts are resolved */
  onAlertsResolved?: (resolvedAlerts: MonitorAlert[]) => void;
  /** Callback when comparative analysis is performed */
  onComparativeAnalysis?: (analysis: any) => void;
}

/**
 * Status badge component
 */
interface StatusBadgeProps {
  status: 'stable' | 'warning' | 'critical';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig = {
    stable: { label: 'STABLE', color: 'text-green-400 bg-green-900/20', icon: '🟢' },
    warning: { label: 'WARNING', color: 'text-yellow-400 bg-yellow-900/20', icon: '🟡' },
    critical: { label: 'CRITICAL', color: 'text-red-400 bg-red-900/20', icon: '🔴' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

/**
 * KPI Metric Card Component
 */
interface KPIMetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  threshold?: number;
  format?: 'number' | 'percentage' | 'time';
  className?: string;
}

const KPIMetricCard: React.FC<KPIMetricCardProps> = ({
  title,
  value,
  unit = '',
  change,
  threshold,
  format = 'number',
  className = '',
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`;
      case 'time':
        return val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${val}ms`;
      default:
        return val.toFixed(1);
    }
  };

  const isAboveThreshold = threshold !== undefined && typeof value === 'number' && value > threshold;
  const isBelowThreshold = threshold !== undefined && typeof value === 'number' && value < threshold;

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-3 ${className}`}>
      <div className="text-xs text-gray-400 uppercase tracking-wide">{title}</div>
      <div className="flex items-baseline mt-1">
        <span className={`text-lg font-semibold ${isAboveThreshold ? 'text-red-400' : isBelowThreshold ? 'text-yellow-400' : 'text-white'}`}>
          {formatValue(value)}
        </span>
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
        {change !== undefined && (
          <span className={`text-xs ml-2 ${change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Village KPI Row Component
 */
interface VillageKPIRowProps {
  village: VillageEnvironment;
  kpis: SchedulerKPIs | null;
  alerts: MonitorAlert[];
  onViewDetails?: (villageId: string) => void;
}

const VillageKPIRow: React.FC<VillageKPIRowProps> = ({
  village,
  kpis,
  alerts,
  onViewDetails,
}) => {
  const villageAlerts = alerts.filter(alert => alert.villageId === village.id);
  const hasCriticalAlerts = villageAlerts.some(alert => alert.severity === 'critical');
  const hasWarningAlerts = villageAlerts.some(alert => alert.severity === 'warning');

  const status = hasCriticalAlerts ? 'critical' : hasWarningAlerts ? 'warning' : 'stable';

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-medium text-white">{village.name}</h3>
          <StatusBadge status={status} />
          {villageAlerts.length > 0 && (
            <span className="text-xs text-gray-400">
              {villageAlerts.length} alert{villageAlerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => onViewDetails?.(village.id)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Details →
        </button>
      </div>

      {kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPIMetricCard
            title="Queue Size"
            value={kpis.queue.size}
            unit="tasks"
            threshold={kpis.queue.maxSize * 0.8}
          />
          <KPIMetricCard
            title="Success Rate"
            value={kpis.assignments.successRate}
            format="percentage"
            threshold={0.7}
          />
          <KPIMetricCard
            title="Active Residents"
            value={kpis.residents.active}
            unit={`/${kpis.residents.total}`}
          />
          <KPIMetricCard
            title="Throughput"
            value={kpis.performance.throughput}
            unit="/min"
          />
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">
          No KPI data available
        </div>
      )}

      {villageAlerts.length > 0 && (
        <div className="mt-3 space-y-2">
          {villageAlerts.slice(0, 2).map(alert => (
            <div key={alert.id} className={`text-xs p-2 rounded ${
              alert.severity === 'critical' ? 'bg-red-900/20 border border-red-700/50' :
              alert.severity === 'warning' ? 'bg-yellow-900/20 border border-yellow-700/50' :
              'bg-blue-900/20 border border-blue-700/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  alert.severity === 'critical' ? 'text-red-400' :
                  alert.severity === 'warning' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {alert.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-gray-400">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-300 mt-1">{alert.message}</p>
            </div>
          ))}
          {villageAlerts.length > 2 && (
            <div className="text-xs text-gray-400 text-center">
              +{villageAlerts.length - 2} more alerts
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Alert Summary Component
 */
interface AlertSummaryProps {
  alerts: MonitorAlert[];
  onResolveAlert?: (alertId: string) => void;
  className?: string;
}

const AlertSummary: React.FC<AlertSummaryProps> = ({
  alerts,
  onResolveAlert,
  className = '',
}) => {
  const alertTrends = useAlertTrends(alerts);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Active Alerts</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>Last hour: {alertTrends.recentAlerts}</span>
          <span>•</span>
          <span>Last 24h: {alertTrends.dailyAlerts}</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <div className="text-2xl mb-2">✅</div>
          <p>All systems stable</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map(alert => (
            <div key={alert.id} className={`p-3 rounded-lg border ${
              alert.severity === 'critical' ? 'bg-red-900/20 border-red-700/50' :
              alert.severity === 'warning' ? 'bg-yellow-900/20 border-yellow-700/50' :
              'bg-blue-900/20 border-blue-700/50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      alert.severity === 'critical' ? 'bg-red-600 text-white' :
                      alert.severity === 'warning' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{alert.message}</p>
                  {alert.context && (
                    <div className="mt-2 text-xs text-gray-400">
                      {Object.entries(alert.context).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onResolveAlert?.(alert.id)}
                  className="ml-2 text-green-400 hover:text-green-300 text-sm transition-colors"
                  title="Resolve alert"
                >
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Comparative Analysis Component
 */
interface ComparativeAnalysisProps {
  analysis: any;
  className?: string;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  analysis,
  className = '',
}) => {
  if (!analysis) return null;

  const { rankings, summary, recommendations } = analysis;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-medium text-white">Comparative Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Performance Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Best:</span>
              <span className="text-green-400">{summary.bestPerforming}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Worst:</span>
              <span className="text-red-400">{summary.worstPerforming}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Avg Efficiency:</span>
              <span className="text-blue-400">{summary.averageEfficiency.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Top Rankings</h4>
          <div className="space-y-1">
            {rankings.queueEfficiency.slice(0, 3).map((ranking: any, index: number) => (
              <div key={ranking.villageId} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  #{index + 1} {ranking.villageId}
                </span>
                <span className={`${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-400' :
                  'text-orange-600'
                }`}>
                  {(ranking.score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <h4 className="text-xs text-blue-400 uppercase tracking-wide mb-2">Recommendations</h4>
          <ul className="text-sm text-blue-200 space-y-1">
            {recommendations.map((rec: string, index: number) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Multi-Village Monitor Panel Component
 *
 * Main dashboard component for monitoring scheduler performance across multiple villages
 */
export const MultiVillageMonitorPanel: React.FC<MultiVillageMonitorPanelProps> = ({
  initialVillages = [],
  config = {},
  className = '',
  onAlertsResolved,
  onComparativeAnalysis,
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'alerts' | 'comparison' | 'export'>('overview');
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

  const {
    isRunning,
    isLoading,
    error,
    villages,
    villageKPIs,
    alerts,
    comparativeAnalysis,
    monitorStats,
    startMonitoring,
    stopMonitoring,
    resolveAlert,
    exportKPIs,
    exportComparativeAnalysis,
    exportAlerts,
    exportFullReport,
    refreshData,
  } = useMultiVillageMonitor(initialVillages, config);

  // Handle alert resolution
  const handleResolveAlert = useCallback((alertId: string) => {
    resolveAlert(alertId);
    onAlertsResolved?.([alerts.find(a => a.id === alertId)!].filter(Boolean));
  }, [resolveAlert, alerts, onAlertsResolved]);

  // Handle export
  const handleExport = useCallback((type: 'kpis' | 'comparison' | 'alerts' | 'full') => {
    let data: string;
    let filename: string;

    switch (type) {
      case 'kpis':
        data = exportKPIs('json');
        filename = `village-kpis-${Date.now()}.json`;
        break;
      case 'comparison':
        data = exportComparativeAnalysis();
        filename = `comparative-analysis-${Date.now()}.json`;
        break;
      case 'alerts':
        data = exportAlerts('json');
        filename = `alerts-${Date.now()}.json`;
        break;
      case 'full':
        data = exportFullReport('json');
        filename = `full-report-${Date.now()}.json`;
        break;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportKPIs, exportComparativeAnalysis, exportAlerts, exportFullReport]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!monitorStats) return null;

    const avgEfficiency = villages.reduce((sum, village) => {
      const kpis = villageKPIs.get(village.id);
      return sum + (kpis ? (1 - kpis.queue.utilization) * kpis.assignments.successRate : 0);
    }, 0) / villages.length;

    return {
      totalVillages: villages.length,
      monitoredVillages: monitorStats.villagesMonitored,
      totalKPIs: monitorStats.totalKpisCollected,
      activeAlerts: monitorStats.activeAlerts,
      averageEfficiency: avgEfficiency,
      uptime: monitorStats.uptime,
    };
  }, [villages, villageKPIs, monitorStats]);

  return (
    <div className={`multi-village-monitor-panel ${className}`}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Multi-Village Scheduler Monitor</h2>
            <p className="text-sm text-gray-400">
              Monitoring {villages.length} villages • {alerts.length} active alerts
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={isRunning ? stopMonitoring : startMonitoring}
              disabled={isLoading}
              className={`px-3 py-2 text-sm rounded transition-colors ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading ? '⏳' : isRunning ? '⏹️ Stop' : '▶️ Start'} Monitoring
            </button>

            <button
              onClick={refreshData}
              disabled={isLoading || !isRunning}
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        {monitorStats && (
          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-400">
            <span>Uptime: {Math.floor(monitorStats.uptime / 1000 / 60)}m</span>
            <span>•</span>
            <span>KPI Collections: {monitorStats.totalKpisCollected}</span>
            <span>•</span>
            <span>Last Update: {new Date(monitorStats.lastCollectionTime).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 m-4 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-400">⚠️</span>
            <span className="text-red-200 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* View Navigation */}
      <div className="border-b border-gray-700 px-4 py-2">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'alerts', label: 'Alerts', icon: '🚨' },
            { id: 'comparison', label: 'Comparison', icon: '⚖️' },
            { id: 'export', label: 'Export', icon: '💾' },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as any)}
              className={`px-3 py-2 text-sm rounded transition-colors ${
                selectedView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="mr-1">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Summary Metrics */}
            {summaryMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <KPIMetricCard
                  title="Villages"
                  value={summaryMetrics.totalVillages}
                  className="md:col-span-2"
                />
                <KPIMetricCard
                  title="Active Alerts"
                  value={summaryMetrics.activeAlerts}
                  threshold={5}
                />
                <KPIMetricCard
                  title="Total KPIs"
                  value={summaryMetrics.totalKPIs}
                />
                <KPIMetricCard
                  title="Avg Efficiency"
                  value={summaryMetrics.averageEfficiency}
                  format="percentage"
                  threshold={0.7}
                />
                <KPIMetricCard
                  title="Uptime"
                  value={summaryMetrics.uptime}
                  format="time"
                  className="md:col-span-2"
                />
              </div>
            )}

            {/* Village List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">Village Status</h3>
              {villages.map(village => (
                <VillageKPIRow
                  key={village.id}
                  village={village}
                  kpis={villageKPIs.get(village.id) || null}
                  alerts={alerts}
                  onViewDetails={setSelectedVillageId}
                />
              ))}
            </div>
          </div>
        )}

        {selectedView === 'alerts' && (
          <AlertSummary
            alerts={alerts}
            onResolveAlert={handleResolveAlert}
          />
        )}

        {selectedView === 'comparison' && (
          <ComparativeAnalysis analysis={comparativeAnalysis} />
        )}

        {selectedView === 'export' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Export Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleExport('kpis')}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">📊 KPI Data</div>
                <div className="text-xs text-gray-400 mt-1">
                  Export all collected performance metrics for all villages
                </div>
              </button>

              <button
                onClick={() => handleExport('comparison')}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">⚖️ Comparative Analysis</div>
                <div className="text-xs text-gray-400 mt-1">
                  Export rankings and comparative performance analysis
                </div>
              </button>

              <button
                onClick={() => handleExport('alerts')}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">🚨 Alert History</div>
                <div className="text-xs text-gray-400 mt-1">
                  Export all alerts and resolution status
                </div>
              </button>

              <button
                onClick={() => handleExport('full')}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-colors text-left"
              >
                <div className="text-sm font-medium text-white">📋 Full Report</div>
                <div className="text-xs text-gray-400 mt-1">
                  Complete monitoring report with all data and analysis
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Village Detail Modal */}
      {selectedVillageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  Village Details: {villages.find(v => v.id === selectedVillageId)?.name}
                </h3>
                <button
                  onClick={() => setSelectedVillageId(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-300">
                Detailed metrics and charts would go here for village {selectedVillageId}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
