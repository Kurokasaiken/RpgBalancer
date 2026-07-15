/**
 * Crew Scheduler Debug Panel – NP-106 Visual Debug Panel
 *
 * Visual debug panel for crew scheduler system. Displays scheduler state,
 * assignments, constraints, and real-time operations for debugging and
 * inspection. Uses Style Lab tokens for theming.
 *
 * @since NP-106
 */

import React, { useState } from 'react';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import type { UseCrewSchedulerDebugReturn } from './hooks/useCrewSchedulerDebug';
import type { QueuedAssignment } from '../../hooks/useCrewScheduler';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';

/**
 * Props for CrewSchedulerDebugPanel component.
 */
export interface CrewSchedulerDebugPanelProps {
  /** Debug hook return value */
  debug: UseCrewSchedulerDebugReturn;
  /** Whether panel is expanded */
  expanded?: boolean;
  /** Callback when panel expand/collapse changes */
  onExpandChange?: (expanded: boolean) => void;
}

/**
 * Component displaying a single queued assignment with its factors.
 */
function AssignmentCard({ assignment }: { assignment: QueuedAssignment }) {
  const tokens = useStyleLabTokens();

  const formatFactor = (value: number, label: string) => {
    const percentage = (value * 100).toFixed(0);
    return (
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-gray-400">{label}:</span>
        <span 
          className="font-mono"
          style={{ color: value > 0.7 ? tokens.interactionColors.success : value < 0.3 ? tokens.interactionColors.danger : tokens.interactionColors.accentPrimary }}
        >
          {percentage}%
        </span>
      </div>
    );
  };

  return (
    <div 
      className="p-3 rounded border mb-2"
      style={{
        backgroundColor: tokens.surfaces.card.background,
        borderColor: tokens.surfaces.card.borderColor,
        boxShadow: tokens.materialFeel.shadowDepth,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-medium" style={{ color: tokens.typography.headingColor }}>
            {assignment.residentId}
          </div>
          <div className="text-xs text-gray-400">{assignment.activityId}</div>
        </div>
        <div 
          className="px-2 py-1 rounded text-xs font-mono"
          style={{
            backgroundColor: tokens.interactionColors.accentPrimary + '20',
            color: tokens.interactionColors.accentPrimary,
          }}
        >
          Priority: {assignment.priorityScore.toFixed(1)}
        </div>
      </div>
      
      <div className="border-t pt-2 mt-2" style={{ borderColor: tokens.surfaces.panel.borderColor }}>
        {formatFactor(assignment.factors.statTagMatch, 'Stat Match')}
        {formatFactor(assignment.factors.fatigue, 'Fatigue')}
        {formatFactor(assignment.factors.specialization, 'Specialization')}
        {formatFactor(assignment.factors.difficulty, 'Difficulty')}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Enqueued: {new Date(assignment.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

/**
 * Component displaying queue statistics.
 */
function QueueStats({ stats }: { stats: { total: number; avgPriority: number; byActivity: Record<string, number>; maxSize: number } }) {
  const tokens = useStyleLabTokens();

  const fillPercentage = (stats.total / stats.maxSize) * 100;
  const isNearFull = fillPercentage > 80;

  return (
    <div 
      className="p-4 rounded border mb-4"
      style={{
        backgroundColor: tokens.surfaces.panel.background,
        borderColor: tokens.surfaces.panel.borderColor,
      }}
    >
      <h3 className="text-sm font-medium mb-3" style={{ color: tokens.typography.headingColor }}>
        Queue Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">Total Assignments</div>
          <div className="text-2xl font-mono" style={{ color: tokens.interactionColors.accentPrimary }}>
            {stats.total}
          </div>
          <div className="text-xs text-gray-500">/ {stats.maxSize} max</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Avg Priority</div>
          <div className="text-2xl font-mono" style={{ color: tokens.interactionColors.accentSecondary }}>
            {stats.avgPriority.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Queue fill indicator */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">Queue Fill</div>
        <div 
          className="h-2 rounded overflow-hidden"
          style={{ backgroundColor: tokens.surfaces.card.background }}
        >
          <div 
            className="h-full transition-all duration-300"
            style={{
              width: `${fillPercentage}%`,
              backgroundColor: isNearFull ? tokens.interactionColors.danger : tokens.interactionColors.success,
            }}
          />
        </div>
      </div>

      {/* Activity breakdown */}
      <div>
        <div className="text-xs text-gray-400 mb-2">By Activity</div>
        <div className="space-y-1">
          {Object.entries(stats.byActivity).map(([activityId, count]) => (
            <div key={activityId} className="flex justify-between text-xs">
              <span className="text-gray-300">{activityId}</span>
              <span className="font-mono" style={{ color: tokens.interactionColors.accentPrimary }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Component displaying configuration settings.
 */
function ConfigDisplay({ config }: { config: CrewSchedulerConfig }) {
  const tokens = useStyleLabTokens();

  return (
    <div 
      className="p-4 rounded border mb-4"
      style={{
        backgroundColor: tokens.surfaces.panel.background,
        borderColor: tokens.surfaces.panel.borderColor,
      }}
    >
      <h3 className="text-sm font-medium mb-3" style={{ color: tokens.typography.headingColor }}>
        Configuration
      </h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Deterministic:</span>
          <span className="font-mono" style={{ color: config.seeding.deterministic ? tokens.interactionColors.success : tokens.interactionColors.warning }}>
            {config.seeding.deterministic ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Seed Strategy:</span>
          <span className="font-mono" style={{ color: tokens.interactionColors.accentPrimary }}>
            {config.seeding.seedStrategy}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Max Queue Size:</span>
          <span className="font-mono" style={{ color: tokens.interactionColors.accentPrimary }}>
            {config.maxQueueSize}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Diagnostics:</span>
          <span className="font-mono" style={{ color: config.enableDiagnostics ? tokens.interactionColors.success : tokens.interactionColors.warning }}>
            {config.enableDiagnostics ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Analytics Channel:</span>
          <span className="font-mono" style={{ color: config.analytics?.enableChannel ? tokens.interactionColors.success : tokens.interactionColors.warning }}>
            {config.analytics?.enableChannel ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Priority weights */}
      <div className="mt-4 pt-3 border-t" style={{ borderColor: tokens.surfaces.card.borderColor }}>
        <div className="text-xs text-gray-400 mb-2">Priority Weights</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Stat Match:</span>
            <span className="font-mono">{config.priorityWeights.statTagMatch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fatigue Penalty:</span>
            <span className="font-mono">{config.priorityWeights.fatiguePenalty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Quest Urgency:</span>
            <span className="font-mono">{config.priorityWeights.questUrgency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Specialization:</span>
            <span className="font-mono">{config.priorityWeights.specializationBonus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component displaying recent debug events.
 */
function EventLog({ events }: { events: Array<{ id: string; timestamp: number; type: string; data: unknown }> }) {
  const tokens = useStyleLabTokens();

  const getEventColor = (type: string) => {
    switch (type) {
      case 'enqueue': return tokens.interactionColors.success;
      case 'process': return tokens.interactionColors.accentPrimary;
      case 'rebalance': return tokens.interactionColors.warning;
      case 'consume': return tokens.interactionColors.accentSecondary;
      default: return tokens.interactionColors.focusRing;
    }
  };

  return (
    <div 
      className="p-4 rounded border"
      style={{
        backgroundColor: tokens.surfaces.panel.background,
        borderColor: tokens.surfaces.panel.borderColor,
      }}
    >
      <h3 className="text-sm font-medium mb-3" style={{ color: tokens.typography.headingColor }}>
        Event Log
      </h3>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No events recorded</div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id}
              className="flex items-start gap-2 text-xs p-2 rounded"
              style={{ backgroundColor: tokens.surfaces.card.background + '40' }}
            >
              <div 
                className="px-2 py-0.5 rounded font-mono text-xs"
                style={{ 
                  backgroundColor: getEventColor(event.type) + '30',
                  color: getEventColor(event.type),
                }}
              >
                {event.type}
              </div>
              <div className="flex-1">
                <div className="text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</div>
                <div className="text-gray-500 truncate">{JSON.stringify(event.data)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Main debug panel component.
 */
export function CrewSchedulerDebugPanel({
  debug,
  expanded = false,
  onExpandChange,
}: CrewSchedulerDebugPanelProps) {
  const tokens = useStyleLabTokens();
  const [activeTab, setActiveTab] = useState<'queue' | 'config' | 'events'>('queue');

  const handleToggle = () => {
    onExpandChange?.(!expanded);
  };

  if (!expanded) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50"
        style={{
          backgroundColor: tokens.interactionColors.accentPrimary,
          color: tokens.typography.headingColor,
          boxShadow: tokens.materialFeel.shadowDepth,
        }}
      >
        🐛 Debug Scheduler
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-4 right-4 w-96 max-h-[80vh] rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col"
      style={{
        backgroundColor: tokens.surfaces.panel.background,
        borderColor: tokens.surfaces.panel.borderColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: tokens.materialFeel.shadowDepth,
      }}
    >
      {/* Header */}
      <div 
        className="p-3 flex justify-between items-center border-b"
        style={{ borderColor: tokens.surfaces.card.borderColor }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🐛</span>
          <h2 className="text-sm font-medium" style={{ color: tokens.typography.headingColor }}>
            Crew Scheduler Debug
          </h2>
        </div>
        <button
          onClick={handleToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div 
        className="flex border-b"
        style={{ borderColor: tokens.surfaces.card.borderColor }}
      >
        {(['queue', 'config', 'events'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 px-3 py-2 text-xs font-medium transition-colors"
            style={{
              color: activeTab === tab ? tokens.interactionColors.accentPrimary : tokens.typography.bodyColor,
              backgroundColor: activeTab === tab ? tokens.interactionColors.accentPrimary + '15' : 'transparent',
              borderBottom: activeTab === tab ? `2px solid ${tokens.interactionColors.accentPrimary}` : 'none',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'queue' && (
          <>
            <QueueStats stats={debug.debugState.queueStats} />
            <div className="text-xs text-gray-400 mb-2">Queue ({debug.debugState.queue.length})</div>
            {debug.debugState.queue.length === 0 ? (
              <div className="text-xs text-gray-500 italic p-3">Queue is empty</div>
            ) : (
              debug.debugState.queue.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))
            )}
          </>
        )}

        {activeTab === 'config' && (
          <ConfigDisplay config={debug.debugState.config} />
        )}

        {activeTab === 'events' && (
          <EventLog events={debug.debugState.events} />
        )}
      </div>

      {/* Footer actions */}
      <div 
        className="p-3 border-t flex gap-2"
        style={{ borderColor: tokens.surfaces.card.borderColor }}
      >
        <button
          onClick={debug.clearDebugHistory}
          className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: tokens.interactionColors.danger + '20',
            color: tokens.interactionColors.danger,
          }}
        >
          Clear History
        </button>
        <button
          onClick={() => {
            const data = debug.exportDebugState();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crew-scheduler-debug-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: tokens.interactionColors.accentPrimary + '20',
            color: tokens.interactionColors.accentPrimary,
          }}
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}
