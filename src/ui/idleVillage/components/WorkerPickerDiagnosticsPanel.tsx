import React, { useMemo, useState } from 'react';
import type { WorkerPickerTelemetryEvent, AssignmentInteractionEvent, WorkerPickerTelemetryMetrics } from '../utils/workerPickerTelemetry';
import { aggregateAssignmentHeatmap } from '../utils/workerPickerTelemetry';
import HeatmapChart from './HeatmapChart';

/**
 * Desktop-only diagnostics panel for WorkerPickerSheet telemetry.
 * Shows KPI metrics, recent events, and assignment heatmap for debugging.
 */
const WorkerPickerDiagnosticsPanel: React.FC<{
  pickerTelemetryEvents?: WorkerPickerTelemetryEvent[];
  telemetryBuffer?: WorkerPickerTelemetryEvent[];
  telemetryMetrics?: WorkerPickerTelemetryMetrics;
  tapCount?: number;
  assignmentInteractions?: AssignmentInteractionEvent[];
  onReplayEvent?: (event: WorkerPickerTelemetryEvent) => void;
}> = ({
  pickerTelemetryEvents,
  telemetryBuffer,
  telemetryMetrics,
  tapCount = 0,
  assignmentInteractions = [],
  onReplayEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'heatmap'>('events');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [heatmapTimeWindow, setHeatmapTimeWindow] = useState<number>(300000); // 5 minutes
  const [heatmapMinAttempts, setHeatmapMinAttempts] = useState<number>(1);
  const [replayStatus, setReplayStatus] = useState<'idle' | 'replaying' | 'success' | 'error'>('idle');


  const telemetryEvents = useMemo(
    () => pickerTelemetryEvents ?? telemetryBuffer ?? [],
    [pickerTelemetryEvents, telemetryBuffer],
  );

  const kpis = useMemo(() => {
    const assignmentSuccesses = telemetryEvents.filter(e => e.type === 'assignment_success');
    const assignmentCancels = telemetryEvents.filter(e => e.type === 'assignment_cancel');
    const closes = telemetryEvents.filter(e => e.type === 'close');
    const latencies = assignmentSuccesses.map(e => e.latencyMs).filter((l): l is number => l !== undefined);

    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const closeRate = closes.length > 0 ? (closes.filter(c => c.closedWithinThreshold).length / closes.length) * 100 : 0;
    const successCount = assignmentSuccesses.length;
    const cancelCount = assignmentCancels.length;
    const totalAssignments = successCount + cancelCount;
    const successRate = totalAssignments > 0 ? (successCount / totalAssignments) * 100 : 0;

    return {
      avgLatency: Math.round(avgLatency),
      closeRate: Math.round(closeRate),
      successRate: Math.round(successRate),
      successCount,
      cancelCount,
      latencies,
      closes: closeRate,
    };
  }, [telemetryEvents]);

  const filteredEvents = useMemo(() => {
    let events = telemetryEvents.slice(-20).reverse();

    if (eventFilter !== 'all') {
      events = events.filter(e => e.type === eventFilter);
    }

    if (slotFilter !== 'all') {
      events = events.filter(e => e.slotId === slotFilter);
    }

    return events;
  }, [telemetryEvents, eventFilter, slotFilter]);

  const legacyTableEvents = useMemo(() => filteredEvents.slice(0, 5), [filteredEvents]);

  const recentInteractions = useMemo(() => {
    return assignmentInteractions.slice(-5).reverse();
  }, [assignmentInteractions]);

  const latencySparkline = useMemo(() => {
    const values = kpis.latencies.slice(-10);
    if (values.length === 0) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => `${i * 10},${100 - ((v - min) / range) * 80}`).join(' ');
    return `M0,100 L${points} L${(values.length - 1) * 10},100 Z`;
  }, [kpis.latencies]);

  const closeSparkline = useMemo(() => {
    const values = telemetryEvents.filter(e => e.type === 'close').slice(-10).map(e => e.closeDurationMs || 0);
    if (values.length === 0) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => `${i * 10},${100 - ((v - min) / range) * 80}`).join(' ');
    return `M0,100 L${points} L${(values.length - 1) * 10},100 Z`;
  }, [telemetryEvents]);

  // Get unique event types and slot IDs for filters
  const eventTypes = useMemo(() => {
    const types = new Set(telemetryEvents.map(e => e.type));
    return ['all', ...Array.from(types).sort()];
  }, [telemetryEvents]);

  const slotIds = useMemo(() => {
    const slots = new Set(telemetryEvents.map(e => e.slotId).filter(id => id !== null));
    return ['all', ...Array.from(slots).sort()];
  }, [telemetryEvents]);

  const latestEventTimestamp = useMemo(() => {
    const timestamps = telemetryEvents
      .map((event) => event.timestamp)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (timestamps.length === 0) {
      return 0;
    }
    return Math.max(...timestamps);
  }, [telemetryEvents]);

  const heatmapData = useMemo(() => {
    if (heatmapTimeWindow === Infinity || latestEventTimestamp === 0) {
      return aggregateAssignmentHeatmap(telemetryEvents, { since: undefined });
    }
    const since = latestEventTimestamp - heatmapTimeWindow;
    return aggregateAssignmentHeatmap(telemetryEvents, { since });
  }, [telemetryEvents, heatmapTimeWindow, latestEventTimestamp]);

  return (
    <div className="default-card rounded-2xl border border-white/10 bg-black/40 p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Worker Picker Diagnostics</h3>
      
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-white/10">
        {[
          { id: 'events' as const, label: 'Events', count: filteredEvents.length },
          { id: 'heatmap' as const, label: 'Heatmap', count: heatmapData.totalEvents },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-400/20 text-amber-200 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {activeTab === 'events' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400">Avg Latency</p>
              <p className="text-lg font-mono text-amber-200">{kpis.avgLatency}ms</p>
              <svg width="100" height="40" className="mt-1" role="img" aria-label="Assignment latency trend">
                <path d={latencySparkline} fill="url(#latencyGradient)" />
                <defs>
                  <linearGradient id="latencyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400">Close Rate</p>
              <p className="text-lg font-mono text-emerald-200">{telemetryMetrics?.picker_close_rate ?? kpis.closeRate}%</p>
              <svg width="100" height="40" className="mt-1" role="img" aria-label="Picker close duration trend">
                <path d={closeSparkline} fill="url(#closeGradient)" />
                <defs>
                  <linearGradient id="closeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tap Count</p>
              <p className="text-lg font-mono text-blue-200">{tapCount}</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs text-slate-400">Success Rate: {kpis.successRate}% ({kpis.successCount}/{kpis.successCount + kpis.cancelCount})</p>
          </div>

          {/* Filters */}
          <div className="mb-4 flex gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Event Type</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="text-xs bg-black/50 border border-white/20 rounded px-2 py-1 text-slate-200"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Events' : type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Slot ID</label>
              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value)}
                className="text-xs bg-black/50 border border-white/20 rounded px-2 py-1 text-slate-200"
              >
                {slotIds.map(slot => (
                  <option key={slot} value={slot}>
                    {slot === 'all' ? 'All Slots' : slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Replay Status and Quick Replay */}
          {filteredEvents.length > 0 && (
            <div className="mb-4 flex items-center gap-4">
              <div className="text-xs">
                <span className="text-slate-400">Replay Status: </span>
                <span className={`font-semibold ${
                  replayStatus === 'success' ? 'text-green-400' :
                  replayStatus === 'error' ? 'text-red-400' :
                  replayStatus === 'replaying' ? 'text-yellow-400' :
                  'text-slate-400'
                }`}>
                  {replayStatus}
                </span>
              </div>
              <button
                onClick={() => {
                  const lastEvent = filteredEvents[0];
                  if (lastEvent && onReplayEvent) {
                    setReplayStatus('replaying');
                    try {
                      onReplayEvent(lastEvent);
                      setReplayStatus('success');
                    } catch (error) {
                      setReplayStatus('error');
                      console.error('Replay failed:', error);
                    }
                  }
                }}
                className="px-3 py-1 bg-blue-600/20 border border-blue-400/40 text-blue-300 text-xs rounded hover:bg-blue-600/30 transition-colors"
                disabled={replayStatus === 'replaying' || filteredEvents.length === 0}
              >
                Quick Replay Last
              </button>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Recent Interactions</h4>
            <div className="divide-y divide-white/10 border border-white/10 rounded-lg text-xs text-slate-200">
              {recentInteractions.map((interaction, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="font-mono text-amber-200 uppercase tracking-wide">{interaction.method}</span>
                  <span className="text-slate-400">{interaction.slotId ?? '-'}</span>
                  <span className="text-slate-400">{interaction.residentId}</span>
                  <span className="text-slate-500">{new Date(interaction.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Filtered Events ({legacyTableEvents.length})</h4>
            <table className="w-full text-xs" aria-label="Worker Picker Events">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="text-left pb-1">Event</th>
                  <th className="text-left pb-1">Details</th>
                </tr>
              </thead>
              <tbody>
                {legacyTableEvents.map((event, i) => {
                  const detailParts: string[] = [];
                  if (event.slotId) {
                    detailParts.push(`Slot: ${event.slotId}`);
                  }
                  if ('residentId' in event && typeof event.residentId === 'string') {
                    detailParts.push(`Resident: ${event.residentId}`);
                  }
                  if (event.type === 'assignment_success') {
                    detailParts.push(
                      `Latency: ${event.latencyMs ?? '—'}ms, Score: ${event.compatibilityScore ?? '—'}`,
                    );
                  } else if (event.type === 'assignment_cancel') {
                    detailParts.push(`Reason: ${event.reason}`);
                  } else if (event.type === 'assignment_attempt') {
                    detailParts.push(`Score: ${event.compatibilityScore ?? '—'}, Taps: ${event.tapCount ?? '—'}`);
                  } else if (event.type === 'open' || event.type === 'candidate_count') {
                    detailParts.push(`Candidates: ${event.candidateCount}`);
                  } else if (event.type === 'close') {
                    detailParts.push(`Duration: ${event.closeDurationMs ?? '—'}ms`);
                  }
                  if (event.timestamp) {
                    detailParts.push(`Time: ${new Date(event.timestamp).toLocaleTimeString()}`);
                  }
                  return (
                    <tr key={`${event.type}-${event.timestamp || i}`} className="text-slate-200">
                      <td className="py-1">{event.type.replace('_', ' ')}</td>
                      <td className="py-1">
                        {detailParts.length > 0
                          ? detailParts.map((detail, index) => (
                              <div key={`${detail}-${index}`} className="leading-tight">
                                {detail}
                              </div>
                            ))
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'heatmap' && (
        <>
          {/* Heatmap Filters */}
          <div className="mb-4 flex gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Time Window</label>
              <select
                value={heatmapTimeWindow}
                onChange={(e) => setHeatmapTimeWindow(Number(e.target.value))}
                className="text-xs bg-black/50 border border-white/20 rounded px-2 py-1 text-slate-200"
                data-testid="heatmap-time-filter"
              >
                <option value={60000}>Last 1 minute</option>
                <option value={300000}>Last 5 minutes</option>
                <option value={900000}>Last 15 minutes</option>
                <option value={3600000}>Last hour</option>
                <option value={Infinity}>All time</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Min Attempts</label>
              <select
                value={heatmapMinAttempts}
                onChange={(e) => setHeatmapMinAttempts(Number(e.target.value))}
                className="text-xs bg-black/50 border border-white/20 rounded px-2 py-1 text-slate-200"
                data-testid="heatmap-min-attempts-filter"
              >
                <option value={1}>1+ attempts</option>
                <option value={2}>2+ attempts</option>
                <option value={5}>5+ attempts</option>
                <option value={10}>10+ attempts</option>
              </select>
            </div>
          </div>

          {/* Heatmap Chart */}
          <HeatmapChart
            data={heatmapData}
            minAttempts={heatmapMinAttempts}
            className="mb-4"
          />

          {/* Heatmap Stats */}
          <div className="text-xs text-slate-400">
            <p>Matrix: {heatmapData.slotIds.length} slots × {heatmapData.residentIds.length} residents</p>
            <p>Total events processed: {heatmapData.totalEvents}</p>
            <p>Time window: {heatmapTimeWindow === Infinity ? 'All time' : `${Math.round(heatmapTimeWindow / 60000)} minutes`}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkerPickerDiagnosticsPanel;
