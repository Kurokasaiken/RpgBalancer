/**
 * Storage Telemetry Dashboard
 * 
 * Visualizes PersistenceService performance metrics, alerts, and recent operations.
 * Provides export functionality and real-time monitoring capabilities.
 */

import React, { useState } from 'react';
import { 
  useStorageTelemetry, 
  useStorageAlerts, 
  useStorageTrends,
  type StorageAlert 
} from '../hooks/useStorageTelemetry';
import { 
  type StorageOperationRecord,
  DEFAULT_STORAGE_TELEMETRY_CONFIG 
} from '@/analytics/balancerStorageTelemetry';

/**
 * Metric card component for displaying key performance indicators.
 */
function MetricCard({ 
  title, 
  value, 
  unit, 
  status, 
  threshold 
}: { 
  title: string; 
  value: number; 
  unit: string; 
  status: 'good' | 'warning' | 'critical'; 
  threshold?: number;
}) {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-2xl font-bold">
        {value.toLocaleString()}{unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
      {threshold && (
        <div className="text-xs text-gray-500 mt-1">
          Threshold: {threshold}{unit}
        </div>
      )}
    </div>
  );
}

/**
 * Recent operations table component.
 */
function RecentOperationsTable({ records }: { records: StorageOperationRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent operations recorded
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Key
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Backend
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Latency
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record, index) => (
            <tr key={index} className={record.success ? '' : 'bg-red-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(record.timestamp).toLocaleTimeString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  record.type === 'save' ? 'bg-blue-100 text-blue-800' :
                  record.type === 'load' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {record.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.key}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  record.backend === 'tauri' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {record.backend}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.latencyMs}ms
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {record.success ? (
                  <span className="text-green-600">✓ Success</span>
                ) : (
                  <span className="text-red-600">✗ Failed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Alert panel component.
 */
function AlertsPanel({ alerts }: { alerts: StorageAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No active alerts
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="font-medium text-red-800">
                {alert.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-red-600">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-sm text-red-700 mt-1">
            {alert.actual} {alert.type.includes('latency') ? 'ms' : '%'} 
            {' '} (threshold: {alert.threshold} {alert.type.includes('latency') ? 'ms' : '%'})
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Main dashboard component.
 */
export function StorageTelemetryDashboard() {
  const [showDetails, setShowDetails] = useState(false);
  const [recordLimit, setRecordLimit] = useState(20);
  
  const {
    metrics,
    records,
    isLoading,
    lastUpdate,
    exportCSV,
    clear,
    refresh,
  } = useStorageTelemetry({ recordLimit });

  const alerts = useStorageAlerts();
  const trends = useStorageTrends();

  const handleExportCSV = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storage-telemetry-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatus = (value: number, threshold: number): 'good' | 'warning' | 'critical' => {
    if (value >= threshold * 1.5) return 'critical';
    if (value >= threshold) return 'warning';
    return 'good';
  };

  const errorRateStatus = getStatus(
    metrics.errorRatePercent, 
    DEFAULT_STORAGE_TELEMETRY_CONFIG.errorRateThresholdPercent
  );
  const avgLatencyStatus = getStatus(
    metrics.avgLatencyMs, 
    DEFAULT_STORAGE_TELEMETRY_CONFIG.avgLatencyThresholdMs
  );
  const maxLatencyStatus = getStatus(
    metrics.maxLatencyMs, 
    DEFAULT_STORAGE_TELEMETRY_CONFIG.maxLatencyThresholdMs
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Storage Telemetry Monitor</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
          {isLoading && (
            <span className="text-sm text-blue-600">Refreshing...</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh
        </button>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export CSV
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Data
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
        <select
          value={recordLimit}
          onChange={(e) => setRecordLimit(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value={10}>10 records</option>
          <option value={20}>20 records</option>
          <option value={50}>50 records</option>
          <option value={100}>100 records</option>
        </select>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Operations"
          value={metrics.totalOperations}
          unit=""
          status="good"
        />
        <MetricCard
          title="Error Rate"
          value={Math.round(metrics.errorRatePercent * 10) / 10}
          unit="%"
          status={errorRateStatus}
          threshold={DEFAULT_STORAGE_TELEMETRY_CONFIG.errorRateThresholdPercent}
        />
        <MetricCard
          title="Avg Latency"
          value={Math.round(metrics.avgLatencyMs)}
          unit="ms"
          status={avgLatencyStatus}
          threshold={DEFAULT_STORAGE_TELEMETRY_CONFIG.avgLatencyThresholdMs}
        />
        <MetricCard
          title="Max Latency"
          value={metrics.maxLatencyMs}
          unit="ms"
          status={maxLatencyStatus}
          threshold={DEFAULT_STORAGE_TELEMETRY_CONFIG.maxLatencyThresholdMs}
        />
      </div>

      {/* Alerts Panel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Alerts</h3>
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Recent Operations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Recent Operations ({records.length})
        </h3>
        <RecentOperationsTable records={records} />
      </div>

      {/* Detailed Trends (when expanded) */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Trends</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-700 mb-2">Latency Trend</h4>
              <div className="text-sm text-gray-600">
                {trends.latencyTrend.length > 0 ? (
                  `Latest: ${trends.latencyTrend[trends.latencyTrend.length - 1]?.value || 0}ms`
                ) : (
                  'No data'
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-700 mb-2">Error Rate Trend</h4>
              <div className="text-sm text-gray-600">
                {trends.errorRateTrend.length > 0 ? (
                  `Latest: ${trends.errorRateTrend[trends.errorRateTrend.length - 1]?.value || 0}%`
                ) : (
                  'No data'
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-700 mb-2">Operation Count Trend</h4>
              <div className="text-sm text-gray-600">
                {trends.operationCountTrend.length > 0 ? (
                  `Latest: ${trends.operationCountTrend[trends.operationCountTrend.length - 1]?.value || 0} ops`
                ) : (
                  'No data'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
