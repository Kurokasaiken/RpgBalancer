/**
 * Config Balancer Storage Telemetry Panel
 *
 * React component that displays comprehensive telemetry data for Config Balancer storage operations.
 * Shows health metrics, performance data, recent operations, and error analysis.
 *
 * @since NP-097
 */

import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import type {
  StorageTelemetryEvent,
  StorageHealthMetrics,
} from '@/balancing/config/storageTelemetryMonitor';

/**
 * Mock telemetry data for development and testing
 * In production, this would be connected to the actual telemetry system
 */
const MOCK_TELEMETRY_EVENTS: StorageTelemetryEvent[] = [
  {
    id: 'telemetry_1',
    type: 'storage_operation_success',
    timestamp: Date.now() - 300000, // 5 minutes ago
    sessionId: 'session_123',
    metrics: {
      operation: 'save',
      startTime: Date.now() - 300000,
      endTime: Date.now() - 299800,
      duration: 200,
      success: true,
      dataSize: 15432,
      configVersion: '1.0.0',
    },
  },
  {
    id: 'telemetry_2',
    type: 'storage_operation_success',
    timestamp: Date.now() - 180000, // 3 minutes ago
    sessionId: 'session_123',
    metrics: {
      operation: 'load',
      startTime: Date.now() - 180000,
      endTime: Date.now() - 179950,
      duration: 50,
      success: true,
      dataSize: 15432,
    },
  },
  {
    id: 'telemetry_3',
    type: 'storage_performance_warning',
    timestamp: Date.now() - 120000, // 2 minutes ago
    sessionId: 'session_123',
    metrics: {
      operation: 'export',
      startTime: Date.now() - 120000,
      endTime: Date.now() - 119000,
      duration: 1000,
      success: true,
      dataSize: 25678,
    },
    metadata: {
      warningThreshold: 100,
      actualDuration: 1000,
    },
  },
];

const MOCK_HEALTH_METRICS: StorageHealthMetrics = {
  totalOperations: 156,
  successfulOperations: 152,
  failedOperations: 4,
  averageDuration: 87.3,
  errorRate: 2.56,
  lastSuccessfulSave: Date.now() - 300000,
  lastSuccessfulLoad: Date.now() - 180000,
  storageSize: 15432,
  dataChecksum: 'abc123def456',
};

interface ConfigBalancerTelemetryPanelProps {
  /** Custom CSS classes */
  className?: string;
  /** Whether to show detailed metrics */
  showDetailedMetrics?: boolean;
  /** Maximum events to display */
  maxEvents?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Config Balancer Storage Telemetry Panel Component
 */
export const ConfigBalancerTelemetryPanel: React.FC<ConfigBalancerTelemetryPanelProps> = ({
  className,
  showDetailedMetrics = true,
  maxEvents = 10,
  compact = false,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [telemetryEvents] = useState<StorageTelemetryEvent[]>(MOCK_TELEMETRY_EVENTS);
  const [healthMetrics] = useState<StorageHealthMetrics>(MOCK_HEALTH_METRICS);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh telemetry data
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      // In production, fetch real telemetry data here
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (selectedEventType === 'all') {
      return telemetryEvents.slice(0, maxEvents);
    }
    return telemetryEvents
      .filter(event => event.type === selectedEventType)
      .slice(0, maxEvents);
  }, [telemetryEvents, selectedEventType, maxEvents]);

  // Get unique event types for filter
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    telemetryEvents.forEach(event => types.add(event.type));
    return Array.from(types).sort();
  }, [telemetryEvents]);

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get event type color
  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'storage_operation_success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'storage_operation_error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'storage_performance_warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'storage_data_integrity_check':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Calculate performance score (0-100)
  const performanceScore = useMemo(() => {
    if (healthMetrics.totalOperations === 0) return 100;

    const successRate = (healthMetrics.successfulOperations / healthMetrics.totalOperations) * 100;
    const durationScore = Math.max(0, 100 - (healthMetrics.averageDuration / 10)); // Penalize >1s avg
    const errorRateScore = Math.max(0, 100 - (healthMetrics.errorRate * 10)); // Penalize >10% errors

    return Math.round((successRate + durationScore + errorRateScore) / 3);
  }, [healthMetrics]);

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Storage Telemetry Monitor
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Config Balancer storage operations and performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Refresh</div>
              <div className="text-sm font-medium text-gray-900">
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center">
              <div className={clsx(
                'px-2 py-1 rounded-full text-xs font-medium',
                performanceScore >= 90 ? 'bg-green-100 text-green-800' :
                performanceScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              )}>
                Performance: {performanceScore}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Health Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Total Operations</div>
            <div className="text-2xl font-bold text-gray-900">{healthMetrics.totalOperations}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600">Success Rate</div>
            <div className="text-2xl font-bold text-green-900">
              {((healthMetrics.successfulOperations / Math.max(healthMetrics.totalOperations, 1)) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600">Avg Duration</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatDuration(healthMetrics.averageDuration)}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm font-medium text-red-600">Error Rate</div>
            <div className="text-2xl font-bold text-red-900">
              {healthMetrics.errorRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Recent Operations */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-900">Recent Operations</h3>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('storage_', '').replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No telemetry events available
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={clsx(
                    'border rounded-lg p-3',
                    getEventTypeColor(event.type)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">
                        {event.type.replace('storage_', '').replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {event.metrics.operation.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>

                  {showDetailedMetrics && (
                    <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-1 font-medium">
                          {event.metrics.duration ? formatDuration(event.metrics.duration) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data Size:</span>
                        <span className="ml-1 font-medium">
                          {event.metrics.dataSize ? `${(event.metrics.dataSize / 1024).toFixed(1)}KB` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Success:</span>
                        <span className={clsx('ml-1 font-medium', event.metrics.success ? 'text-green-600' : 'text-red-600')}>
                          {event.metrics.success ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  )}

                  {event.metrics.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      Error: {event.metrics.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Insights */}
        {!compact && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Operation Success Rates</h4>
                <div className="space-y-2">
                  {['save', 'load', 'export', 'import', 'clear'].map(operation => {
                    const opEvents = telemetryEvents.filter(e => e.metrics.operation === operation);
                    const successCount = opEvents.filter(e => e.metrics.success).length;
                    const totalCount = opEvents.length;
                    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

                    return (
                      <div key={operation} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{operation}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-900 w-12 text-right">
                            {successRate.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">System Health</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Successful Save:</span>
                    <span className="font-medium">
                      {healthMetrics.lastSuccessfulSave
                        ? formatTimestamp(healthMetrics.lastSuccessfulSave)
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Successful Load:</span>
                    <span className="font-medium">
                      {healthMetrics.lastSuccessfulLoad
                        ? formatTimestamp(healthMetrics.lastSuccessfulLoad)
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage Size:</span>
                    <span className="font-medium">
                      {healthMetrics.storageSize
                        ? `${(healthMetrics.storageSize / 1024).toFixed(1)} KB`
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Checksum:</span>
                    <span className="font-medium font-mono text-xs">
                      {healthMetrics.dataChecksum || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigBalancerTelemetryPanel;
