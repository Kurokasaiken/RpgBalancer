/**
 * Agent Analytics Dashboard - NP-125
 * 
 * Dashboard UI for displaying agent performance metrics, trends, and insights.
 * Follows Gilded Observatory theme with config-first design.
 * 
 * @since 2026-01-23
 * @author Sentinel-Coordinator
 */

import React, { useState } from 'react';
import { useAgentAnalytics, useAgentTrendData } from '@/analytics/hooks/useAgentAnalytics';
import type { AgentPerformanceMetrics } from '@/analytics/AgentPerformanceAnalytics';
import {
  getPerformanceRatingColor,
  formatDurationMinutes,
  formatPercentage,
} from '@/analytics/config/agentAnalyticsConfig';

/**
 * Performance metric card component
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'improving' | 'stable' | 'declining';
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, color }) => {
  const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
  const trendColor = trend === 'improving' ? 'text-green-400' : trend === 'declining' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="rounded-lg border border-slate-600/60 bg-slate-800/50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold" style={{ color: color || 'rgb(240, 239, 228)' }}>
          {value}
        </div>
        {trend && (
          <span className={`text-sm ${trendColor}`}>
            {trendIcon}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Agent performance table row
 */
interface AgentRowProps {
  metrics: AgentPerformanceMetrics;
  onSelect: () => void;
}

const AgentRow: React.FC<AgentRowProps> = ({ metrics, onSelect }) => {
  const ratingColor = getPerformanceRatingColor(metrics.performanceRating);

  return (
    <tr
      className="border-b border-slate-700/50 hover:bg-slate-800/30 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <td className="px-4 py-3 text-sm text-slate-200">{metrics.agentName}</td>
      <td className="px-4 py-3 text-sm text-center text-slate-300">{metrics.completedTasks}</td>
      <td className="px-4 py-3 text-sm text-center text-slate-300">
        {formatDurationMinutes(metrics.averageCompletionTime)}
      </td>
      <td className="px-4 py-3 text-sm text-center text-slate-300">
        {formatPercentage(metrics.errorRate, 1)}
      </td>
      <td className="px-4 py-3 text-sm text-center text-slate-300">
        {Math.round(metrics.qualityScore)}
      </td>
      <td className="px-4 py-3 text-sm text-center text-slate-300">
        {metrics.velocity.toFixed(1)}
      </td>
      <td className="px-4 py-3 text-sm text-center">
        <span
          className="inline-block px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide"
          style={{
            color: ratingColor,
            backgroundColor: `${ratingColor}20`,
            border: `1px solid ${ratingColor}40`,
          }}
        >
          {metrics.performanceRating.replace('_', ' ')}
        </span>
      </td>
    </tr>
  );
};

/**
 * Agent detail panel
 */
interface AgentDetailPanelProps {
  agentName: string;
  metrics: AgentPerformanceMetrics;
  onClose: () => void;
}

const AgentDetailPanel: React.FC<AgentDetailPanelProps> = ({ agentName, metrics, onClose }) => {
  const { trendData, isLoading } = useAgentTrendData(agentName, 30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-600/60 bg-slate-900 shadow-[0_22px_55px_rgba(0,0,0,0.55)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-amber-100">{agentName}</h2>
            <p className="text-sm text-slate-400 mt-1">Performance Details</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-amber-200 transition-colors p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Completed Tasks"
              value={metrics.completedTasks}
              color={getPerformanceRatingColor(metrics.performanceRating)}
            />
            <MetricCard
              label="Avg Completion Time"
              value={formatDurationMinutes(metrics.averageCompletionTime)}
              trend={metrics.trends.completionTime}
            />
            <MetricCard
              label="Error Rate"
              value={formatPercentage(metrics.errorRate, 1)}
              trend={metrics.trends.errorRate}
            />
            <MetricCard
              label="Quality Score"
              value={Math.round(metrics.qualityScore)}
              trend={metrics.trends.quality}
            />
            <MetricCard
              label="Velocity"
              value={`${metrics.velocity.toFixed(1)} tasks/day`}
            />
            <MetricCard
              label="Time Ratio"
              value={`${(metrics.completionTimeRatio * 100).toFixed(0)}%`}
            />
          </div>

          {/* Trend Chart */}
          {!isLoading && trendData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                30-Day Trend
              </h3>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                <div className="h-48 flex items-end gap-1">
                  {trendData.map((point, index) => {
                    const maxQuality = Math.max(...trendData.map(p => p.qualityScore));
                    const height = (point.qualityScore / maxQuality) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-amber-500/70 rounded-t transition-all hover:bg-amber-400"
                        style={{ height: `${height}%` }}
                        title={`${point.date}: Quality ${point.qualityScore}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-slate-400 text-center">
                  Quality Score Trend (Last 30 Days)
                </div>
              </div>
            </div>
          )}

          {/* Trends Summary */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Performance Trends
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Completion Time</span>
                <span className={
                  metrics.trends.completionTime === 'improving' ? 'text-green-400' :
                  metrics.trends.completionTime === 'declining' ? 'text-red-400' : 'text-slate-400'
                }>
                  {metrics.trends.completionTime === 'improving' ? '↑ Improving' :
                   metrics.trends.completionTime === 'declining' ? '↓ Declining' : '→ Stable'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Error Rate</span>
                <span className={
                  metrics.trends.errorRate === 'improving' ? 'text-green-400' :
                  metrics.trends.errorRate === 'declining' ? 'text-red-400' : 'text-slate-400'
                }>
                  {metrics.trends.errorRate === 'improving' ? '↑ Improving' :
                   metrics.trends.errorRate === 'declining' ? '↓ Declining' : '→ Stable'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Quality Score</span>
                <span className={
                  metrics.trends.quality === 'improving' ? 'text-green-400' :
                  metrics.trends.quality === 'declining' ? 'text-red-400' : 'text-slate-400'
                }>
                  {metrics.trends.quality === 'improving' ? '↑ Improving' :
                   metrics.trends.quality === 'declining' ? '↓ Declining' : '→ Stable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Agent Analytics Dashboard component
 */
const AgentAnalyticsDashboard: React.FC = () => {
  const { allMetrics, topPerformers, needsAttention, summary, isLoading, error, refresh } = useAgentAnalytics();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'top' | 'attention'>('all');

  const selectedMetrics = selectedAgent ? allMetrics.find(m => m.agentName === selectedAgent) : null;

  const displayedMetrics = filter === 'top' ? topPerformers :
                          filter === 'attention' ? needsAttention :
                          allMetrics;

  if (error) {
    return (
      <div className="min-h-screen bg-[#050509] text-ivory p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-red-600/60 bg-red-900/20 p-6 text-center">
            <p className="text-red-400">Error loading analytics data: {error.message}</p>
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050509] text-ivory p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-100">Agent Performance Analytics</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time metrics and performance insights</p>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <MetricCard
            label="Total Agents"
            value={summary.totalAgents}
            color="rgb(251, 191, 36)"
          />
          <MetricCard
            label="Total Tasks"
            value={summary.totalTasks}
          />
          <MetricCard
            label="Completed"
            value={summary.completedTasks}
            color="rgb(34, 197, 94)"
          />
          <MetricCard
            label="Avg Quality"
            value={summary.averageQualityScore}
          />
          <MetricCard
            label="Avg Velocity"
            value={`${summary.averageVelocity}/day`}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Agents ({allMetrics.length})
          </button>
          <button
            onClick={() => setFilter('top')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'top'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Top Performers ({topPerformers.length})
          </button>
          <button
            onClick={() => setFilter('attention')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'attention'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Needs Attention ({needsAttention.length})
          </button>
        </div>

        {/* Agent Table */}
        <div className="rounded-lg border border-slate-600/60 bg-slate-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Agent
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tasks
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Avg Time
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Error Rate
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Quality
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Velocity
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedMetrics.map(metrics => (
                <AgentRow
                  key={metrics.agentName}
                  metrics={metrics}
                  onSelect={() => setSelectedAgent(metrics.agentName)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {displayedMetrics.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No agents found matching the selected filter.
          </div>
        )}
      </div>

      {/* Agent Detail Panel */}
      {selectedAgent && selectedMetrics && (
        <AgentDetailPanel
          agentName={selectedAgent}
          metrics={selectedMetrics}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
};

export default AgentAnalyticsDashboard;
