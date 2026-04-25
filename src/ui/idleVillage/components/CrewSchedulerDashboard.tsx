import React, { useMemo, useCallback } from 'react';
import { useCrewSchedulerAnalytics } from '@/ui/idleVillage/hooks/useCrewSchedulerAnalytics';
import type { CrewSchedulerAnalyticsConfig } from '@/ui/idleVillage/utils/crewSchedulerAnalyticsConfig';

/**
 * Props for the retro-styled CrewSchedulerDashboard component.
 */
export interface CrewSchedulerDashboardProps {
  /** Optional configuration overrides for analytics thresholds and layout. */
  config?: Partial<CrewSchedulerAnalyticsConfig>;
  /** Enable real-time updates via the analytics hook. */
  enableRealTime?: boolean;
  /** Maximum number of history events to display in the timeline. */
  maxHistoryEvents?: number;
  /** Optional callback for metric drill-down actions. */
  onMetricClick?: (metricType: string, value: number) => void;
}

const CrewSchedulerDashboard: React.FC<CrewSchedulerDashboardProps> = ({
  config,
  enableRealTime = true,
  maxHistoryEvents = 10,
  onMetricClick,
}) => {
  const { metrics, statuses, history } = useCrewSchedulerAnalytics({
    config,
    enableHistory: true,
    resetHistoryOnMount: false,
  });

  // Cache current timestamp to avoid impure Date.now calls
  const currentTimestamp = useMemo(() => new Date().getTime(), []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  // Generate ASCII status indicators
  const getStatusIndicator = useCallback((status: string) => {
    switch (status) {
      case 'ok':
        return '●'; // Green dot
      case 'warning':
        return '◐'; // Yellow circle
      case 'critical':
        return '◉'; // Red circle with dot
      default:
        return '○';
    }
  }, []);

  // Generate ASCII bar for progress visualization
  const getProgressBar = useCallback((value: number, max: number, width: number = 20) => {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }, []);

  // Calculate display metrics with safe defaults
  const displayMetrics = useMemo(() => {
    return {
      queueUtilization: metrics.queue.maxSize > 0 
        ? Math.round((metrics.queue.total / metrics.queue.maxSize) * 100) 
        : 0,
      avgFatiguePercent: Math.round(metrics.queue.avgFatigue * 100),
      throughputEfficiency: metrics.throughput.decisionsPerMinute > 0
        ? Math.min(100, Math.round((metrics.throughput.assigned / metrics.throughput.decisionsPerMinute) * 100))
        : 0,
      dropFailureRate: Math.round(metrics.dropFeedback.failureRate * 100),
    };
  }, [metrics]);

  // Filter and sort history events for display
  const recentHistory = useMemo(() => {
    return history
      .slice(-maxHistoryEvents)
      .reverse()
      .map(event => ({
        ...event,
        timestamp: formatTimestamp(event.timestamp),
        indicator: getStatusIndicator('ok'), // All events are ok for now
      }));
  }, [history, maxHistoryEvents, formatTimestamp, getStatusIndicator]);

  // Handle metric click events
  const handleMetricClick = useCallback((metricType: string, value: number) => {
    if (onMetricClick) {
      onMetricClick(metricType, value);
    }
  }, [onMetricClick]);

  return (
    <div className="bg-black/90 border border-amber-300/30 rounded-lg p-4 font-mono text-sm space-y-4">
      {/* Header */}
      <header className="border-b border-amber-300/20 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-amber-200 text-lg font-bold">Crew Scheduler Analytics</h2>
          <div className="text-xs text-amber-100/60">
            Last Updated: {formatTimestamp(currentTimestamp)}
          </div>
        </div>
      </header>

      {/* Status Overview */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          className="border border-amber-300/20 rounded p-3 cursor-pointer hover:border-amber-300/40 transition-colors"
          onClick={() => handleMetricClick('queue', metrics.queue.total)}
        >
          <div className="text-amber-200/80 text-xs uppercase tracking-wider">Queue Status</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl" style={{ color: statuses.queue === 'critical' ? '#ef4444' : statuses.queue === 'warning' ? '#eab308' : '#22c55e' }}>
              {getStatusIndicator(statuses.queue)}
            </span>
            <span className="text-white font-bold">{metrics.queue.total}</span>
          </div>
          <div className="text-xs text-amber-100/60 mt-1">
            {displayMetrics.queueUtilization}% utilized
          </div>
        </div>

        <div 
          className="border border-amber-300/20 rounded p-3 cursor-pointer hover:border-amber-300/40 transition-colors"
          onClick={() => handleMetricClick('fatigue', metrics.queue.avgFatigue)}
        >
          <div className="text-amber-200/80 text-xs uppercase tracking-wider">Avg Fatigue</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl" style={{ color: statuses.fatigue === 'critical' ? '#ef4444' : statuses.fatigue === 'warning' ? '#eab308' : '#22c55e' }}>
              {getStatusIndicator(statuses.fatigue)}
            </span>
            <span className="text-white font-bold">{displayMetrics.avgFatiguePercent}%</span>
          </div>
          <div className="w-full mt-1">
            {getProgressBar(metrics.queue.avgFatigue, 1, 16)}
          </div>
        </div>

        <div 
          className="border border-amber-300/20 rounded p-3 cursor-pointer hover:border-amber-300/40 transition-colors"
          onClick={() => handleMetricClick('throughput', metrics.throughput.assigned)}
        >
          <div className="text-amber-200/80 text-xs uppercase tracking-wider">Throughput</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl" style={{ color: statuses.throughput === 'critical' ? '#ef4444' : statuses.throughput === 'warning' ? '#eab308' : '#22c55e' }}>
              {getStatusIndicator(statuses.throughput)}
            </span>
            <span className="text-white font-bold">{metrics.throughput.assigned}</span>
          </div>
          <div className="text-xs text-amber-100/60 mt-1">
            {metrics.throughput.decisionsPerMinute.toFixed(1)}/min
          </div>
        </div>

        <div 
          className="border border-amber-300/20 rounded p-3 cursor-pointer hover:border-amber-300/40 transition-colors"
          onClick={() => handleMetricClick('dropFailure', metrics.dropFeedback.failureRate)}
        >
          <div className="text-amber-200/80 text-xs uppercase tracking-wider">Drop Failures</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl" style={{ color: statuses.dropFailure === 'critical' ? '#ef4444' : statuses.dropFailure === 'warning' ? '#eab308' : '#22c55e' }}>
              {getStatusIndicator(statuses.dropFailure)}
            </span>
            <span className="text-white font-bold">{displayMetrics.dropFailureRate}%</span>
          </div>
          <div className="text-xs text-amber-100/60 mt-1">
            {metrics.dropFeedback.total} attempts
          </div>
        </div>
      </section>

      {/* Queue Breakdown */}
      <section className="border border-amber-300/20 rounded p-3">
        <h3 className="text-amber-200/80 text-xs uppercase tracking-wider mb-2">Queue Breakdown</h3>
        <div className="space-y-1">
          {Object.entries(metrics.queue.byActivity).map(([activity, count]) => (
            <div key={activity} className="flex items-center justify-between text-xs">
              <span className="text-amber-100/80 capitalize">{activity}</span>
              <div className="flex items-center gap-2">
                <div className="w-16">
                  {getProgressBar(count, Math.max(...Object.values(metrics.queue.byActivity)), 12)}
                </div>
                <span className="text-white font-medium">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent History Timeline */}
      <section className="border border-amber-300/20 rounded p-3">
        <h3 className="text-amber-200/80 text-xs uppercase tracking-wider mb-2">Recent Events</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {recentHistory.length === 0 ? (
            <div className="text-amber-100/40 text-xs">No recent events</div>
          ) : (
            recentHistory.map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="flex items-center gap-2 text-xs">
                <span className="text-amber-100/60">{event.timestamp}</span>
                <span className="text-lg">{event.indicator}</span>
                <span className="text-amber-100/80 capitalize">{event.type}</span>
                {event.type === 'decision' && (
                  <span className="text-amber-100/60">
                    {event.decision.assigned ? 'Assigned' : 'Rejected'}
                  </span>
                )}
                {event.type === 'drop_feedback' && (
                  <span className="text-amber-100/60">
                    {event.feedbackType}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Performance Indicators */}
      <section className="border-t border-amber-300/20 pt-2">
        <div className="flex items-center justify-between text-xs text-amber-100/60">
          <div>Real-time: {enableRealTime ? 'ENABLED' : 'DISABLED'}</div>
          <div>History Events: {history.length}</div>
          <div>Refresh Rate: {config?.layout?.refreshIntervalMs || 1000}ms</div>
        </div>
      </section>
    </div>
  );
};

export default CrewSchedulerDashboard;
