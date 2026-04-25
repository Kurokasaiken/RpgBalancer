/**
 * Crew Scheduler Debug Panel Component – NP-106
 * 
 * Visual debug panel for crew scheduler state with timeline, heatmap,
 * and conflict detection. Uses Gilded Observatory theme for consistency.
 * 
 * @since NP-106
 */

import React, { useMemo } from 'react';
import { useCrewSchedulerDebug } from '../hooks/useCrewSchedulerDebug';
import type { QueuedAssignment } from '../hooks/useCrewScheduler';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';
import type { CrewSchedulerDebugConfig, VisualizationMode } from '../config/crewSchedulerDebugConfig';
import { getSeverityColor } from '../config/crewSchedulerDebugConfig';

/**
 * Props for the CrewSchedulerDebugPanel component.
 */
export interface CrewSchedulerDebugPanelProps {
  /** Current queue state from scheduler */
  queue: QueuedAssignment[];
  /** Scheduler configuration */
  schedulerConfig?: CrewSchedulerConfig;
  /** Debug panel configuration */
  debugConfig?: Partial<CrewSchedulerDebugConfig>;
  /** Whether panel is visible */
  isVisible?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Crew Scheduler Debug Panel component.
 * 
 * Provides real-time visualization of scheduler state including:
 * - Timeline view of queue size and priority over time
 * - Heatmap of slot occupancy
 * - Conflict detection and severity indicators
 * - Performance metrics
 */
export function CrewSchedulerDebugPanel({
  queue,
  schedulerConfig,
  debugConfig,
  isVisible = true,
  className = '',
}: CrewSchedulerDebugPanelProps): React.ReactElement | null {
  const {
    metrics,
    conflicts,
    slotOccupancy,
    timeline,
    visualizationMode,
    setVisualizationMode,
    clearTimeline,
    exportDebugData,
    config,
  } = useCrewSchedulerDebug({
    queue,
    schedulerConfig,
    debugConfig,
    isActive: isVisible,
  });

  if (!isVisible || !config.enabled) {
    return null;
  }

  return (
    <div
      className={`crew-scheduler-debug-panel ${className}`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '600px',
        maxHeight: '80vh',
        backgroundColor: '#1a1a2e',
        border: '2px solid #e94560',
        borderRadius: '8px',
        padding: '16px',
        color: '#eee',
        fontFamily: 'monospace',
        fontSize: '12px',
        overflow: 'auto',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid #533483',
        }}
      >
        <h3 style={{ margin: 0, color: '#e94560', fontSize: '14px', fontWeight: 'bold' }}>
          Crew Scheduler Debug
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearTimeline}
            style={{
              padding: '4px 8px',
              backgroundColor: '#16213e',
              border: '1px solid #533483',
              borderRadius: '4px',
              color: '#eee',
              cursor: 'pointer',
              fontSize: '11px',
            }}
            title="Clear timeline history"
          >
            Clear
          </button>
          <button
            onClick={() => void exportDebugData()}
            style={{
              padding: '4px 8px',
              backgroundColor: '#16213e',
              border: '1px solid #533483',
              borderRadius: '4px',
              color: '#eee',
              cursor: 'pointer',
              fontSize: '11px',
            }}
            title="Export debug data"
          >
            Export
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      {config.metrics.showQueueSize && (
        <MetricsSection metrics={metrics} config={config} />
      )}

      {/* Visualization Mode Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#aaa', fontSize: '11px' }}>
          View Mode:
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['timeline', 'heatmap', 'list', 'split'] as VisualizationMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setVisualizationMode(mode)}
              style={{
                padding: '4px 12px',
                backgroundColor: visualizationMode === mode ? '#533483' : '#16213e',
                border: '1px solid #533483',
                borderRadius: '4px',
                color: '#eee',
                cursor: 'pointer',
                fontSize: '11px',
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Content */}
      {(visualizationMode === 'timeline' || visualizationMode === 'split') && (
        <TimelineView timeline={timeline} config={config} />
      )}

      {(visualizationMode === 'heatmap' || visualizationMode === 'split') && (
        <HeatmapView slotOccupancy={slotOccupancy} config={config} />
      )}

      {(visualizationMode === 'list' || visualizationMode === 'split') && (
        <ConflictList conflicts={conflicts} config={config} />
      )}
    </div>
  );
}

/**
 * Metrics summary section.
 */
function MetricsSection({
  metrics,
  config,
}: {
  metrics: ReturnType<typeof useCrewSchedulerDebug>['metrics'];
  config: CrewSchedulerDebugConfig;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '16px',
      }}
    >
      {config.metrics.showQueueSize && (
        <MetricCard label="Queue Size" value={metrics.queueSize.toString()} />
      )}
      {config.metrics.showAvgPriority && (
        <MetricCard label="Avg Priority" value={metrics.avgPriority.toFixed(2)} />
      )}
      {config.metrics.showConflictCount && (
        <MetricCard
          label="Conflicts"
          value={metrics.conflictCount.toString()}
          color={metrics.conflictCount > 0 ? '#e94560' : '#4ade80'}
        />
      )}
      {config.metrics.showAssignmentRate && (
        <MetricCard label="Rate (a/s)" value={metrics.assignmentRate.toFixed(2)} />
      )}
      {config.metrics.showFatigueLevels && (
        <MetricCard
          label="Avg Fatigue"
          value={`${(metrics.avgFatigue * 100).toFixed(0)}%`}
          color={metrics.avgFatigue > 0.7 ? '#fb923c' : '#4ade80'}
        />
      )}
      {config.metrics.showSpecializationMatches && (
        <MetricCard
          label="Spec Match"
          value={`${(metrics.specializationMatchRate * 100).toFixed(0)}%`}
        />
      )}
    </div>
  );
}

/**
 * Individual metric card.
 */
function MetricCard({
  label,
  value,
  color = '#eee',
}: {
  label: string;
  value: string;
  color?: string;
}): React.ReactElement {
  return (
    <div
      style={{
        padding: '8px',
        backgroundColor: '#16213e',
        border: '1px solid #0f3460',
        borderRadius: '4px',
      }}
    >
      <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

/**
 * Timeline visualization component.
 */
function TimelineView({
  timeline,
  config,
}: {
  timeline: ReturnType<typeof useCrewSchedulerDebug>['timeline'];
  config: CrewSchedulerDebugConfig;
}): React.ReactElement {
  const maxQueueSize = useMemo(() => {
    return Math.max(...timeline.map(e => e.queueSize), 1);
  }, [timeline]);

  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#e94560', fontSize: '12px' }}>Timeline</h4>
      <div
        style={{
          height: '120px',
          backgroundColor: '#16213e',
          border: '1px solid #0f3460',
          borderRadius: '4px',
          padding: '8px',
          position: 'relative',
        }}
      >
        {timeline.length === 0 ? (
          <div style={{ color: '#aaa', textAlign: 'center', paddingTop: '40px' }}>
            No timeline data yet
          </div>
        ) : (
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Queue size line */}
            <polyline
              points={timeline
                .map((entry, i) => {
                  const x = (i / (timeline.length - 1)) * 100;
                  const y = 100 - (entry.queueSize / maxQueueSize) * 90;
                  return `${x}%,${y}%`;
                })
                .join(' ')}
              fill="none"
              stroke="#e94560"
              strokeWidth="2"
            />
            {/* Conflict markers */}
            {timeline.map((entry, i) => {
              if (entry.conflictCount === 0) return null;
              const x = (i / (timeline.length - 1)) * 100;
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy="10%"
                  r="3"
                  fill="#ff6b6b"
                >
                  <title>{`${entry.conflictCount} conflicts`}</title>
                </circle>
              );
            })}
          </svg>
        )}
      </div>
      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px', textAlign: 'center' }}>
        Last {config.timeline.visibleRange} time units
      </div>
    </div>
  );
}

/**
 * Heatmap visualization component.
 */
function HeatmapView({
  slotOccupancy,
  config,
}: {
  slotOccupancy: ReturnType<typeof useCrewSchedulerDebug>['slotOccupancy'];
  config: CrewSchedulerDebugConfig;
}): React.ReactElement {
  const getOccupancyColor = (rate: number): string => {
    if (rate === 0) return config.heatmapColors.empty;
    if (rate <= 0.25) return config.heatmapColors.low;
    if (rate <= 0.5) return config.heatmapColors.medium;
    if (rate <= 0.75) return config.heatmapColors.high;
    return config.heatmapColors.full;
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#e94560', fontSize: '12px' }}>
        Slot Occupancy Heatmap
      </h4>
      {slotOccupancy.length === 0 ? (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#16213e',
            border: '1px solid #0f3460',
            borderRadius: '4px',
            color: '#aaa',
            textAlign: 'center',
          }}
        >
          No slot occupancy data
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '8px',
          }}
        >
          {slotOccupancy.map(slot => (
            <div
              key={slot.slotId}
              style={{
                padding: '8px',
                backgroundColor: getOccupancyColor(slot.occupancyRate),
                border: slot.hasConflict ? `2px solid ${config.heatmapColors.conflict}` : '1px solid #0f3460',
                borderRadius: '4px',
                textAlign: 'center',
              }}
              title={`${slot.activityId}\nAssignments: ${slot.assignmentCount}\nPriority: ${slot.avgPriority.toFixed(2)}`}
            >
              <div style={{ fontSize: '10px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {slot.activityId.slice(0, 8)}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {slot.assignmentCount}
              </div>
              <div style={{ fontSize: '9px', color: '#aaa' }}>
                {(slot.occupancyRate * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Conflict list component.
 */
function ConflictList({
  conflicts,
  config,
}: {
  conflicts: ReturnType<typeof useCrewSchedulerDebug>['conflicts'];
  config: CrewSchedulerDebugConfig;
}): React.ReactElement {
  return (
    <div>
      <h4 style={{ margin: '0 0 8px 0', color: '#e94560', fontSize: '12px' }}>
        Detected Conflicts ({conflicts.length})
      </h4>
      {conflicts.length === 0 ? (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#16213e',
            border: '1px solid #0f3460',
            borderRadius: '4px',
            color: '#4ade80',
            textAlign: 'center',
          }}
        >
          ✓ No conflicts detected
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {conflicts.map(conflict => (
            <div
              key={conflict.id}
              style={{
                padding: '8px',
                backgroundColor: '#16213e',
                border: `2px solid ${getSeverityColor(conflict.severity)}`,
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px' }}>
                  {conflict.type.replace(/_/g, ' ')}
                </span>
                <span
                  style={{
                    padding: '2px 6px',
                    backgroundColor: getSeverityColor(conflict.severity),
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  {conflict.severity}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '4px' }}>
                {conflict.description}
              </div>
              {config.showDetailedDiagnostics && (
                <div style={{ fontSize: '9px', color: '#aaa' }}>
                  Affected: {conflict.affectedAssignments.length} assignment(s)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
