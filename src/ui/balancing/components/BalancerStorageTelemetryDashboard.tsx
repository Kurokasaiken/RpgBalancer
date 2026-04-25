/**
 * Config Balancer Storage Telemetry Dashboard
 *
 * React component for monitoring Balancer storage operations with real-time metrics,
 * performance charts, alert management, and configurable thresholds.
 *
 * @module BalancerStorageTelemetryDashboard
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getStorageTelemetry, type StorageMetrics, type StorageAlert, type StorageAlertThresholds, type StorageOperationResult } from '../config/balancerStorageTelemetry';

export interface BalancerStorageTelemetryDashboardProps {
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
  /** Maximum number of operations to display */
  maxOperations?: number;
  /** CSS class name */
  className?: string;
}

/**
 * Storage Telemetry Dashboard Component
 *
 * Comprehensive monitoring dashboard for Balancer storage operations
 * with metrics, alerts, and threshold configuration.
 */
export const BalancerStorageTelemetryDashboard: React.FC<BalancerStorageTelemetryDashboardProps> = ({
  autoRefreshInterval = 5000,
  maxOperations = 50,
  className = '',
}) => {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [alerts, setAlerts] = useState<StorageAlert[]>([]);
  const [operations, setOperations] = useState<StorageOperationResult[]>([]);
  const [thresholds, setThresholds] = useState<StorageAlertThresholds | null>(null);
  const [showThresholds, setShowThresholds] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StorageAlert | null>(null);

  const telemetry = getStorageTelemetry();

  // Update data
  const updateData = useCallback(() => {
    setMetrics(telemetry.getMetrics());
    setAlerts(telemetry.getActiveAlerts());
    setOperations(telemetry.getRecentOperations(maxOperations));
    setThresholds(telemetry.getThresholds());
  }, [telemetry, maxOperations]);

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    telemetry.resolveAlert(alertId);
    updateData();
  }, [telemetry, updateData]);

  // Update thresholds
  const updateThresholds = useCallback((newThresholds: Partial<StorageAlertThresholds>) => {
    telemetry.setThresholds(newThresholds);
    setThresholds(telemetry.getThresholds());
  }, [telemetry]);

  // Export data
  const exportData = useCallback((format: 'json' | 'csv') => {
    const data = telemetry.exportData(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balancer-storage-telemetry.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [telemetry]);

  // Clear telemetry data
  const clearData = useCallback(() => {
    telemetry.clear();
    updateData();
  }, [telemetry, updateData]);

  // Initialize and set up auto-refresh
  useEffect(() => {
    updateData();

    const unsubscribe = telemetry.addListener(() => {
      updateData();
    });

    const interval = setInterval(updateData, autoRefreshInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [telemetry, updateData, autoRefreshInterval]);

  if (!metrics || !thresholds) {
    return (
      <div className={`storage-telemetry-dashboard loading ${className}`}>
        <div className="loading-spinner">Loading storage telemetry...</div>
      </div>
    );
  }

  const failureRate = metrics.totalOperations > 0 ? (metrics.failedOperations / metrics.totalOperations) * 100 : 0;
  const successRate = 100 - failureRate;

  return (
    <div className={`storage-telemetry-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <h2>💾 Balancer Storage Telemetry</h2>
        <div className="header-controls">
          <button
            className="control-button"
            onClick={() => setShowThresholds(!showThresholds)}
          >
            {showThresholds ? 'Hide' : 'Show'} Thresholds
          </button>
          <button
            className="control-button"
            onClick={() => exportData('json')}
          >
            📄 Export JSON
          </button>
          <button
            className="control-button"
            onClick={() => exportData('csv')}
          >
            📊 Export CSV
          </button>
          <button
            className="control-button danger"
            onClick={clearData}
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-value">{metrics.totalOperations}</div>
          <div className="metric-label">Total Operations</div>
        </div>
        <div className="metric-card success">
          <div className="metric-value">{successRate.toFixed(1)}%</div>
          <div className="metric-label">Success Rate</div>
        </div>
        <div className="metric-card warning">
          <div className="metric-value">{metrics.averageDuration.toFixed(0)}ms</div>
          <div className="metric-label">Avg Duration</div>
        </div>
        <div className="metric-card info">
          <div className="metric-value">{(metrics.dataSizeStats.averageBytes / 1024).toFixed(1)}KB</div>
          <div className="metric-label">Avg Data Size</div>
        </div>
        <div className="metric-card error">
          <div className="metric-value">{alerts.length}</div>
          <div className="metric-label">Active Alerts</div>
        </div>
      </div>

      {/* Thresholds Configuration */}
      {showThresholds && thresholds && (
        <div className="thresholds-panel">
          <h3>Alert Thresholds</h3>
          <div className="thresholds-grid">
            <div className="threshold-item">
              <label>Max Operation Duration (ms):</label>
              <input
                type="number"
                value={thresholds.maxDurationMs}
                onChange={(e) => updateThresholds({ maxDurationMs: parseInt(e.target.value) || 1000 })}
              />
            </div>
            <div className="threshold-item">
              <label>Max Failure Rate (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={thresholds.maxFailureRate * 100}
                onChange={(e) => updateThresholds({ maxFailureRate: (parseInt(e.target.value) || 10) / 100 })}
              />
            </div>
            <div className="threshold-item">
              <label>Max Consecutive Failures:</label>
              <input
                type="number"
                min="1"
                value={thresholds.maxConsecutiveFailures}
                onChange={(e) => updateThresholds({ maxConsecutiveFailures: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="threshold-item">
              <label>Min Data Size (bytes):</label>
              <input
                type="number"
                min="0"
                value={thresholds.minDataSizeBytes}
                onChange={(e) => updateThresholds({ minDataSizeBytes: parseInt(e.target.value) || 100 })}
              />
            </div>
            <div className="threshold-item">
              <label>Max Data Size (bytes):</label>
              <input
                type="number"
                value={thresholds.maxDataSizeBytes}
                onChange={(e) => updateThresholds({ maxDataSizeBytes: parseInt(e.target.value) || 10485760 })}
              />
            </div>
            <div className="threshold-item">
              <label>Alert Cooldown (ms):</label>
              <input
                type="number"
                min="1000"
                value={thresholds.alertCooldownMs}
                onChange={(e) => updateThresholds({ alertCooldownMs: parseInt(e.target.value) || 30000 })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>🚨 Active Alerts ({alerts.length})</h3>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`alert-item ${alert.severity}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="alert-header">
                  <span className="alert-type">{alert.type.replace('_', ' ').toUpperCase()}</span>
                  <span className={`alert-severity ${alert.severity}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <button
                    className="resolve-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resolveAlert(alert.id);
                    }}
                  >
                    ✓ Resolve
                  </button>
                </div>
                <p className="alert-message">{alert.message}</p>
                <div className="alert-timestamp">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Operation Statistics */}
        <div className="stats-section">
          <h3>Operation Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Load Operations:</span>
              <span className="stat-value">{metrics.operationCounts.load || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Save Operations:</span>
              <span className="stat-value">{metrics.operationCounts.save || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Backup Operations:</span>
              <span className="stat-value">{metrics.operationCounts.backup || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">History Loads:</span>
              <span className="stat-value">{metrics.operationCounts.history_load || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">History Saves:</span>
              <span className="stat-value">{metrics.operationCounts.history_save || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Operations */}
        <div className="operations-section">
          <h3>Recent Operations ({operations.length})</h3>
          <div className="operations-table">
            <div className="table-header">
              <span>Time</span>
              <span>Operation</span>
              <span>Status</span>
              <span>Duration</span>
              <span>Data Size</span>
            </div>
            {operations.slice().reverse().map((op, index) => (
              <div key={index} className={`table-row ${op.success ? 'success' : 'error'}`}>
                <span>{new Date(op.timestamp).toLocaleTimeString()}</span>
                <span>{op.operation.replace('_', ' ')}</span>
                <span className={`status ${op.success ? 'success' : 'error'}`}>
                  {op.success ? '✓' : '✗'}
                </span>
                <span>{op.duration}ms</span>
                <span>{op.dataSize ? `${(op.dataSize / 1024).toFixed(1)}KB` : '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="alert-modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alert Details</h3>
              <button
                className="close-button"
                onClick={() => setSelectedAlert(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="alert-detail-grid">
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">{selectedAlert.type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Severity:</span>
                  <span className={`value severity ${selectedAlert.severity}`}>
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Timestamp:</span>
                  <span className="value">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Resolved:</span>
                  <span className="value">{selectedAlert.resolved ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="alert-message-section">
                <h4>Message</h4>
                <p>{selectedAlert.message}</p>
              </div>

              {selectedAlert.operation && (
                <div className="operation-details">
                  <h4>Related Operation</h4>
                  <div className="operation-detail-grid">
                    <div className="detail-item">
                      <span className="label">Type:</span>
                      <span className="value">{selectedAlert.operation.operation}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Success:</span>
                      <span className="value">{selectedAlert.operation.success ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Duration:</span>
                      <span className="value">{selectedAlert.operation.duration}ms</span>
                    </div>
                    {selectedAlert.operation.error && (
                      <div className="detail-item">
                        <span className="label">Error:</span>
                        <span className="value error">{selectedAlert.operation.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="action-button primary"
                  onClick={() => resolveAlert(selectedAlert.id)}
                  disabled={selectedAlert.resolved}
                >
                  {selectedAlert.resolved ? 'Already Resolved' : 'Resolve Alert'}
                </button>
                <button
                  className="action-button secondary"
                  onClick={() => setSelectedAlert(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
