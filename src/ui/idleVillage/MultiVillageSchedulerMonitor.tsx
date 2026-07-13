/**
 * NP-088 – Idle Village Multi-Village Scheduler Monitor Dashboard
 *
 * React dashboard component for monitoring and comparing scheduler performance across multiple village environments.
 * Provides real-time visualization, KPI charts, alerts display, and comparative analysis.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import type { SchedulerKPIs, MonitorAlert, ComparativeAnalysis } from '../services/multiVillageSchedulerMonitor';

/**
 * Dashboard configuration
 */
interface MultiVillageSchedulerMonitorDashboardProps {
  /** Monitor service instance */
  monitor: {
    getVillages(): Array<{ id: string; name: string; metadata?: any }>;
    getLatestKPIs(villageId: string): SchedulerKPIs | null;
    getKPIHistory(villageId: string, limit?: number): SchedulerKPIs[];
    getActiveAlerts(): MonitorAlert[];
    performComparativeAnalysis(timeWindow: number): ComparativeAnalysis;
    getStats(): {
      villagesMonitored: number;
      totalKpisCollected: number;
      activeAlerts: number;
      uptime: number;
    };
  };
  /** Dashboard refresh interval in milliseconds */
  refreshInterval?: number;
  /** Maximum history points to display in charts */
  maxHistoryPoints?: number;
}

/**
 * Multi-Village Scheduler Monitor Dashboard Component
 */
export const MultiVillageSchedulerMonitorDashboard: React.FC<MultiVillageSchedulerMonitorDashboardProps> = ({
  monitor,
  refreshInterval = 5000,
  maxHistoryPoints = 50,
}) => {
  const { t } = useTranslation('idleVillage');
  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(60 * 60 * 1000); // 1 hour
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'alerts' | 'details'>('overview');
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Get current data
  const villages = monitor.getVillages();
  const alerts = monitor.getActiveAlerts();
  const stats = monitor.getStats();

  // Get selected village data
  const selectedVillageData = selectedVillage ? monitor.getLatestKPIs(selectedVillage) : null;
  const selectedVillageHistory = selectedVillage ? monitor.getKPIHistory(selectedVillage, maxHistoryPoints) : [];

  // Comparative analysis
  const comparativeAnalysis = useMemo(() => {
    return monitor.performComparativeAnalysis(timeRange);
  }, [monitor, timeRange, lastUpdate]);

  // Format percentage
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Format number
  const formatNumber = (value: number, decimals = 1) => value.toFixed(decimals);

  // Get severity color
  const getSeverityColor = (severity: MonitorAlert['severity']) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'error': return '#fd7e14';
      case 'warning': return '#ffc107';
      case 'info': return '#0dcaf0';
      default: return '#6c757d';
    }
  };

  return (
    <div className="multi-village-scheduler-monitor-dashboard">
      {/* Header */}
      <div className="dashboard-header bg-dark text-light p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1">{t('idleVillage:scheduler.title', { defaultValue: '🏘️ Multi-Village Scheduler Monitor' })}</h2>
            <small className="text-muted">
              {t('idleVillage:scheduler.subtitle', { villages: stats.villagesMonitored, kpis: stats.totalKpisCollected, alerts: stats.activeAlerts, defaultValue: 'Monitoring {villages} villages • {kpis} KPIs collected • {alerts} active alerts' })}
            </small>
          </div>
          <div className="text-end">
            <div className="small text-muted">{t('idleVillage:scheduler.lastUpdated', { defaultValue: 'Last updated' })}</div>
            <div>{new Date(lastUpdate).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <nav>
          <div className="nav nav-tabs" role="tablist">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              {t('idleVillage:scheduler.tabs.overview', { defaultValue: '📊 Overview' })}
            </button>
            <button
              className={`nav-link ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              {t('idleVillage:scheduler.tabs.comparison', { defaultValue: '🏆 Comparison' })}
            </button>
            <button
              className={`nav-link ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              {t('idleVillage:scheduler.tabs.alerts', { defaultValue: '🚨 Alerts' })} {alerts.length > 0 && <span className="badge bg-danger ms-1">{alerts.length}</span>}
            </button>
            <button
              className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              {t('idleVillage:scheduler.tabs.details', { defaultValue: '📈 Details' })}
            </button>
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-pane active">
            {/* Village Grid */}
            <div className="row">
              {villages.map(village => {
                const kpis = monitor.getLatestKPIs(village.id);
                if (!kpis) return null;

                return (
                  <div key={village.id} className="col-md-6 col-lg-4 mb-4">
                    <div
                      className={`card h-100 ${selectedVillage === village.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedVillage(village.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{village.name}</h5>
                        <small className="text-muted">{t('idleVillage:scheduler.overview.villageId', { id: village.id, defaultValue: '{id}' })}</small>
                      </div>
                      <div className="card-body">
                        {/* Queue Status */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">{t('idleVillage:scheduler.overview.queue', { defaultValue: 'Queue' })}</small>
                            <small>{t('idleVillage:scheduler.overview.queueSize', { size: kpis.queue.size, maxSize: kpis.queue.maxSize, defaultValue: '{size}/{maxSize}' })}</small>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className={`progress-bar ${kpis.queue.utilization > 0.8 ? 'bg-danger' : kpis.queue.utilization > 0.6 ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${kpis.queue.utilization * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Assignment Success */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">{t('idleVillage:scheduler.overview.successRate', { defaultValue: 'Success Rate' })}</small>
                            <small>{formatPercent(kpis.assignments.successRate)}</small>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className={`progress-bar ${kpis.assignments.successRate < 0.7 ? 'bg-danger' : kpis.assignments.successRate < 0.85 ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${kpis.assignments.successRate * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Resident Utilization */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">{t('idleVillage:scheduler.overview.utilization', { defaultValue: 'Utilization' })}</small>
                            <small>{formatPercent(kpis.residents.utilization)}</small>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className={`progress-bar ${kpis.residents.utilization < 0.6 ? 'bg-danger' : kpis.residents.utilization < 0.8 ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${kpis.residents.utilization * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="row text-center">
                          <div className="col-6">
                            <div className="small text-muted">{t('idleVillage:scheduler.overview.throughput', { defaultValue: 'Throughput' })}</div>
                            <div className="fw-bold">{formatNumber(kpis.performance.throughput)}</div>
                          </div>
                          <div className="col-6">
                            <div className="small text-muted">{t('idleVillage:scheduler.overview.efficiency', { defaultValue: 'Efficiency' })}</div>
                            <div className="fw-bold">{formatPercent(kpis.performance.efficiency)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="tab-pane active">
            {/* Time Range Selector */}
            <div className="mb-4">
              <label className="form-label">{t('idleVillage:scheduler.comparison.analysisTimeWindow', { defaultValue: 'Analysis Time Window' })}</label>
              <select
                className="form-select"
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value, 10))}
              >
                <option value={15 * 60 * 1000}>{t('idleVillage:scheduler.comparison.timeRanges.15m', { defaultValue: '15 minutes' })}</option>
                <option value={30 * 60 * 1000}>{t('idleVillage:scheduler.comparison.timeRanges.30m', { defaultValue: '30 minutes' })}</option>
                <option value={60 * 60 * 1000}>{t('idleVillage:scheduler.comparison.timeRanges.1h', { defaultValue: '1 hour' })}</option>
                <option value={4 * 60 * 60 * 1000}>{t('idleVillage:scheduler.comparison.timeRanges.4h', { defaultValue: '4 hours' })}</option>
                <option value={24 * 60 * 60 * 1000}>{t('idleVillage:scheduler.comparison.timeRanges.24h', { defaultValue: '24 hours' })}</option>
              </select>
            </div>

            {/* Summary Cards */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-success">{t('idleVillage:scheduler.comparison.bestPerformer', { defaultValue: 'Best Performer' })}</h5>
                    <p className="card-text fs-4">{comparativeAnalysis.summary.bestPerforming}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-danger">{t('idleVillage:scheduler.comparison.worstPerformer', { defaultValue: 'Worst Performer' })}</h5>
                    <p className="card-text fs-4">{comparativeAnalysis.summary.worstPerforming}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-info">{t('idleVillage:scheduler.comparison.avgEfficiency', { defaultValue: 'Avg Efficiency' })}</h5>
                    <p className="card-text fs-4">{formatPercent(comparativeAnalysis.summary.averageEfficiency)}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-warning">{t('idleVillage:scheduler.comparison.variance', { defaultValue: 'Variance' })}</h5>
                    <p className="card-text fs-4">{formatPercent(comparativeAnalysis.summary.standardDeviation)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rankings Table */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">{t('idleVillage:scheduler.comparison.performanceRankings', { defaultValue: 'Performance Rankings' })}</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>{t('idleVillage:scheduler.comparison.columns.village', { defaultValue: 'Village' })}</th>
                        <th>{t('idleVillage:scheduler.comparison.columns.queueEfficiency', { defaultValue: 'Queue Efficiency' })}</th>
                        <th>{t('idleVillage:scheduler.comparison.columns.assignmentSuccess', { defaultValue: 'Assignment Success' })}</th>
                        <th>{t('idleVillage:scheduler.comparison.columns.residentUtilization', { defaultValue: 'Resident Utilization' })}</th>
                        <th>{t('idleVillage:scheduler.comparison.columns.throughput', { defaultValue: 'Throughput' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparativeAnalysis.rankings.queueEfficiency.map((ranking, index) => {
                        const successRank = comparativeAnalysis.rankings.assignmentSuccess.find(r => r.villageId === ranking.villageId);
                        const utilizationRank = comparativeAnalysis.rankings.residentUtilization.find(r => r.villageId === ranking.villageId);
                        const throughputRank = comparativeAnalysis.rankings.throughput.find(r => r.villageId === ranking.villageId);

                        return (
                          <tr key={ranking.villageId}>
                            <td>
                              <strong>{ranking.villageId}</strong>
                              {index === 0 && <span className="badge bg-warning ms-2">🥇</span>}
                            </td>
                            <td>
                              {t('idleVillage:scheduler.comparison.rankValue', { rank: ranking.rank, score: formatPercent(ranking.score), defaultValue: '#{rank} ({score})' })}
                            </td>
                            <td>
                              {t('idleVillage:scheduler.comparison.rankValue', { rank: successRank?.rank || '?', score: formatPercent(successRank?.score || 0), defaultValue: '#{rank} ({score})' })}
                            </td>
                            <td>
                              {t('idleVillage:scheduler.comparison.rankValue', { rank: utilizationRank?.rank || '?', score: formatPercent(utilizationRank?.score || 0), defaultValue: '#{rank} ({score})' })}
                            </td>
                            <td>
                              {t('idleVillage:scheduler.comparison.rankValue', { rank: throughputRank?.rank || '?', score: `${formatNumber(throughputRank?.score || 0)}/min`, defaultValue: '#{rank} ({score})' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {comparativeAnalysis.recommendations.length > 0 && (
              <div className="card mt-4">
                <div className="card-header">
                  <h5 className="mb-0">{t('idleVillage:scheduler.comparison.recommendations', { defaultValue: '💡 Recommendations' })}</h5>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled">
                    {comparativeAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="mb-2">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="tab-pane active">
            {alerts.length === 0 ? (
              <div className="alert alert-success">
                <h5 className="alert-heading">{t('idleVillage:scheduler.alerts.noAlerts', { defaultValue: '✅ No Active Alerts' })}</h5>
                <p className="mb-0">{t('idleVillage:scheduler.alerts.noAlertsDescription', { defaultValue: 'All village schedulers are operating within normal parameters.' })}</p>
              </div>
            ) : (
              <div className="row">
                {alerts.map(alert => (
                  <div key={alert.id} className="col-md-6 mb-4">
                    <div className="card border-left-primary">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{alert.villageId}</h6>
                        <span
                          className="badge"
                          style={{ backgroundColor: getSeverityColor(alert.severity) }}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="card-body">
                        <p className="card-text">{alert.message}</p>
                        <small className="text-muted">
                          {new Date(alert.timestamp).toLocaleString()}
                        </small>
                        {Object.keys(alert.context).length > 0 && (
                          <div className="mt-2">
                            <details>
                              <summary className="small text-muted">{t('idleVillage:scheduler.alerts.contextDetails', { defaultValue: 'Context Details' })}</summary>
                              <pre className="small mt-2">{JSON.stringify(alert.context, null, 2)}</pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="tab-pane active">
            {/* Village Selector */}
            <div className="mb-4">
              <label className="form-label">{t('idleVillage:scheduler.details.selectVillage', { defaultValue: 'Select Village' })}</label>
              <select
                className="form-select"
                value={selectedVillage || ''}
                onChange={(e) => setSelectedVillage(e.target.value || null)}
              >
                <option value="">{t('idleVillage:scheduler.details.selectVillagePlaceholder', { defaultValue: 'Select a village...' })}</option>
                {villages.map(village => (
                  <option key={village.id} value={village.id}>
                    {village.name} ({village.id})
                  </option>
                ))}
              </select>
            </div>

            {selectedVillage && selectedVillageData ? (
              <div className="row">
                {/* Current Metrics */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">{t('idleVillage:scheduler.details.currentMetrics', { defaultValue: 'Current Metrics' })}</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-6">
                          <div className="metric-card p-3 bg-light rounded mb-3">
                            <div className="small text-muted">{t('idleVillage:scheduler.details.queueSize', { defaultValue: 'Queue Size' })}</div>
                            <div className="fs-4 fw-bold">{t('idleVillage:scheduler.overview.queueSize', { size: selectedVillageData.queue.size, maxSize: selectedVillageData.queue.maxSize, defaultValue: '{size}/{maxSize}' })}</div>
                            <div className="small text-muted">{t('idleVillage:scheduler.details.queueUtilized', { utilized: formatPercent(selectedVillageData.queue.utilization), defaultValue: '{utilized} utilized' })}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="metric-card p-3 bg-light rounded mb-3">
                            <div className="small text-muted">{t('idleVillage:scheduler.details.successRate', { defaultValue: 'Success Rate' })}</div>
                            <div className="fs-4 fw-bold">{formatPercent(selectedVillageData.assignments.successRate)}</div>
                            <div className="small text-muted">{t('idleVillage:scheduler.details.successCount', { successful: selectedVillageData.assignments.successful, total: selectedVillageData.assignments.total, defaultValue: '{successful}/{total}' })}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="metric-card p-3 bg-light rounded mb-3">
                            <div className="small text-muted">{t('idleVillage:scheduler.details.utilization', { defaultValue: 'Utilization' })}</div>
                            <div className="fs-4 fw-bold">{formatPercent(selectedVillageData.residents.utilization)}</div>
                            <div className="small text-muted">{t('idleVillage:scheduler.details.activeCount', { active: selectedVillageData.residents.active, total: selectedVillageData.residents.total, defaultValue: '{active}/{total} active' })}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="metric-card p-3 bg-light rounded mb-3">
                            <div className="small text-muted">{t('idleVillage:scheduler.details.throughput', { defaultValue: 'Throughput' })}</div>
                            <div className="fs-4 fw-bold">{formatNumber(selectedVillageData.performance.throughput)}</div>
                            <div className="small text-muted">{t('idleVillage:scheduler.details.throughputUnit', { defaultValue: 'assignments/min' })}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Distribution */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">{t('idleVillage:scheduler.details.activityDistribution', { defaultValue: 'Activity Distribution' })}</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span>{t('idleVillage:scheduler.details.totalActivities', { defaultValue: 'Total Activities' })}</span>
                          <span className="fw-bold">{selectedVillageData.activities.total}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>{t('idleVillage:scheduler.details.activeActivities', { defaultValue: 'Active Activities' })}</span>
                          <span className="fw-bold">{selectedVillageData.activities.active}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>{t('idleVillage:scheduler.details.utilizationLabel', { defaultValue: 'Utilization' })}</span>
                          <span className="fw-bold">{formatPercent(selectedVillageData.activities.utilization)}</span>
                        </div>
                      </div>

                      {Object.keys(selectedVillageData.activities.byType).length > 0 && (
                        <div>
                          <h6>{t('idleVillage:scheduler.details.byType', { defaultValue: 'By Type:' })}</h6>
                          {Object.entries(selectedVillageData.activities.byType).map(([type, count]) => (
                            <div key={type} className="d-flex justify-content-between">
                              <span className="text-capitalize">{type}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resident Fatigue Distribution */}
                <div className="col-md-12 mt-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">{t('idleVillage:scheduler.details.residentFatigueDistribution', { defaultValue: 'Resident Fatigue Distribution' })}</h5>
                    </div>
                    <div className="card-body">
                      <div className="row text-center">
                        <div className="col-3">
                          <div className="p-3 bg-success bg-opacity-25 rounded">
                            <div className="fs-4 fw-bold text-success">{selectedVillageData.residents.fatigueDistribution.low}</div>
                            <div className="small">{t('idleVillage:scheduler.details.fatigueLevels.low', { defaultValue: 'Low' })}</div>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="p-3 bg-info bg-opacity-25 rounded">
                            <div className="fs-4 fw-bold text-info">{selectedVillageData.residents.fatigueDistribution.medium}</div>
                            <div className="small">{t('idleVillage:scheduler.details.fatigueLevels.medium', { defaultValue: 'Medium' })}</div>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="p-3 bg-warning bg-opacity-25 rounded">
                            <div className="fs-4 fw-bold text-warning">{selectedVillageData.residents.fatigueDistribution.high}</div>
                            <div className="small">{t('idleVillage:scheduler.details.fatigueLevels.high', { defaultValue: 'High' })}</div>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="p-3 bg-danger bg-opacity-25 rounded">
                            <div className="fs-4 fw-bold text-danger">{selectedVillageData.residents.fatigueDistribution.critical}</div>
                            <div className="small">{t('idleVillage:scheduler.details.fatigueLevels.critical', { defaultValue: 'Critical' })}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                <h5 className="alert-heading">{t('idleVillage:scheduler.details.selectVillagePrompt', { defaultValue: 'Select a Village' })}</h5>
                <p className="mb-0">{t('idleVillage:scheduler.details.selectVillageHint', { defaultValue: 'Choose a village from the dropdown above to view detailed metrics and charts.' })}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiVillageSchedulerMonitorDashboard;
