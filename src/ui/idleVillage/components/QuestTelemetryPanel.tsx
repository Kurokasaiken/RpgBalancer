/**
 * QuestTelemetryPanel Component
 *
 * Enhanced dashboard displaying quest telemetry with interactive heatmap, decision feed,
 * and risk assessment. Shows aggregated statistics and real-time telemetry for quest analytics.
 * Integrated with new quest telemetry transforms and visualization components.
 */

import React from 'react';
import clsx from 'clsx';
import { useMemo, useCallback } from 'react';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { BranchDecision } from '@/engine/quest/types';
import { useIdleVillageConfigStore } from '@/balancing/config/idleVillage/IdleVillageConfigStore';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';
import QuestRiskDisplay from './QuestRiskDisplay';
import QuestHeatmap from './QuestHeatmap';
import QuestDecisionFeed from './QuestDecisionFeed';
import { transformTelemetryData } from '@/ui/idleVillage/utils/questTelemetryTransforms';
import { DEFAULT_QUEST_TELEMETRY_CONFIG } from '@/balancing/config/idleVillage/questTelemetryConfig';
import { DEFAULT_DECISION_FEED_CONFIG } from './QuestDecisionFeedConfig';
import type { HeatmapCell } from '@/ui/idleVillage/utils/questTelemetryTransforms';

export interface QuestTelemetryPanelProps {
  className?: string;
  compact?: boolean;
  showHeatmap?: boolean;
  showRecentDecisions?: boolean;
  showRiskDisplay?: boolean;
  telemetry: AggregatedTelemetry;
  isLoading?: boolean;
  error?: string | null;
  onClear?: () => void;
  onRiskStripeClick?: (type: 'injury' | 'death', percentage: number) => void;
}

/**
 * Mini heatmap component for visualizing quest type distribution.
 */
const QuestTypeHeatmap: React.FC<{
  questTypeBreakdown: Record<string, number>;
  questTypeDefinitions: Record<string, QuestTypeDefinition>;
  className?: string;
}> = ({ questTypeBreakdown, questTypeDefinitions, className }) => {
  const totalQuests = Object.values(questTypeBreakdown).reduce((sum, count) => sum + count, 0);
  const questTypes = useMemo(() => sortQuestTypes(questTypeDefinitions), [questTypeDefinitions]);

  return (
    <div className={clsx('space-y-1', className)}>
      <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">Quest Types</h4>
      {questTypes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 px-3 py-2 text-center text-xs text-slate-500">
          No quest taxonomy configured. Define questTypes in IdleVillageConfig.
        </div>
      ) : totalQuests === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 px-3 py-2 text-center text-xs text-slate-500">
          No quest data yet
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1">
          {questTypes.map(({ id, label, colorClass }) => {
            const count = questTypeBreakdown[id] || 0;
            const percentage = (count / totalQuests) * 100;

            return (
              <div key={id} className="text-center">
                <div
                  className={clsx(
                    'h-8 rounded transition-all duration-300',
                    colorClass ?? 'bg-slate-600',
                    count > 0 ? 'opacity-80' : 'opacity-20'
                  )}
                  style={{ height: `${Math.max(8, percentage * 0.8)}px` }}
                  title={`${label}: ${count} quests (${percentage.toFixed(1)}%)`}
                />
                <div className="text-[10px] text-slate-400 mt-1 truncate" title={label}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Recent decisions list component.
 */
const RecentDecisionsList: React.FC<{
  branchDecisions: AggregatedTelemetry['branchDecisions'];
  className?: string;
}> = ({ branchDecisions, className }) => {
  const recentDecisions = branchDecisions.slice(-5); // Show last 5 decisions

  return (
    <div className={clsx('space-y-2', className)}>
      <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
        Recent Decisions
      </h4>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {recentDecisions.length === 0 ? (
          <div className="text-xs text-slate-500 italic">No decisions yet</div>
        ) : (
          recentDecisions.map((decision: AggregatedTelemetry['branchDecisions'][0], index: number) => (
            <div
              key={`${decision.phaseId}-${decision.timestamp}-${index}`}
              className="text-xs bg-slate-800/50 rounded px-2 py-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-300 truncate">
                  {decision.outcome.metadata?.choiceMade || 'Decision'}
                </span>
                <span className="text-slate-500 ml-2">
                  {new Date(decision.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Phase: {decision.phaseId}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Risk display section component.
 */
const RiskDisplaySection: React.FC<{
  _telemetry: AggregatedTelemetry;
  onRiskStripeClick?: (type: 'injury' | 'death', percentage: number) => void;
  className?: string;
}> = ({ _telemetry, onRiskStripeClick, className }) => {
  // Fixed mock risk data for demonstration - in real implementation this would come from quest telemetry
  const mockRiskData = useMemo(() => ({
    injuryPercentage: 25.5, // Fixed value for demo
    deathPercentage: 12.3,  // Fixed value for demo
  }), []);

  return (
    <div className={clsx('space-y-2', className)}>
      <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
        Quest Risk Assessment
      </h4>
      <div className="flex justify-center">
        <QuestRiskDisplay
          questId="demo-quest"
          injuryPercentage={mockRiskData.injuryPercentage}
          deathPercentage={mockRiskData.deathPercentage}
          onStripeClick={onRiskStripeClick}
          data-testid="quest-risk-display-demo"
        />
      </div>
      <div className="text-xs text-slate-500 text-center">
        Injury: {mockRiskData.injuryPercentage.toFixed(1)}% | 
        Death: {mockRiskData.deathPercentage.toFixed(1)}%
      </div>
    </div>
  );
};
const PerformanceMetrics: React.FC<{
  telemetry: AggregatedTelemetry;
  className?: string;
}> = ({ telemetry, className }) => {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={clsx('grid grid-cols-2 gap-3', className)}>
      <div className="text-center">
        <div className="text-lg font-bold text-amber-400">
          {telemetry.totalQuests}
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">
          Total Quests
        </div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-green-400">
          {formatPercentage(telemetry.successRate)}
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">
          Success Rate
        </div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-blue-400">
          {formatDuration(telemetry.averageDuration)}
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">
          Avg Duration
        </div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-purple-400">
          {telemetry.heroicMoments}
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">
          Heroic Moments
        </div>
      </div>
    </div>
  );
};

/**
 * Main QuestTelemetryPanel component.
 */
export const QuestTelemetryPanel: React.FC<QuestTelemetryPanelProps> = ({
  className,
  compact = false,
  showHeatmap = true,
  showRecentDecisions = true,
  showRiskDisplay = false,
  telemetry,
  isLoading = false,
  error = null,
  onClear,
  onRiskStripeClick,
}) => {
  const [selectedHeatmapCell, setSelectedHeatmapCell] = React.useState<HeatmapCell | null>(null);
  const questTypeDefinitions = useIdleVillageConfigStore((state) => state.config.questTypes ?? {});

  // Transform telemetry data for visualization
  const transformedData = useMemo(() => {
    if (!telemetry) return null;
    return transformTelemetryData(telemetry, DEFAULT_QUEST_TELEMETRY_CONFIG);
  }, [telemetry]);

  const decisionFeedConfig = useMemo(() => ({
    maxItems: 5,
    showTimestamps: !compact,
    showQuestTypes: !compact,
    showChoiceTimes: !compact,
    showOutcomes: true,
    enableFiltering: true,
    enableSorting: true,
    enableSearch: !compact,
    groupByQuest: false,
    highlightHeroic: true,
    compactMode: compact,
    autoRefresh: DEFAULT_DECISION_FEED_CONFIG.autoRefresh,
    refreshInterval: DEFAULT_DECISION_FEED_CONFIG.refreshInterval,
  }), [compact]);

  // Handle heatmap cell selection
  const handleHeatmapCellClick = useCallback((cell: HeatmapCell) => {
    setSelectedHeatmapCell(cell);
    // Emit telemetry event for heatmap interaction
    console.log('[QuestTelemetryPanel] Heatmap cell selected:', cell);
  }, []);

  // Handle decision selection
  const handleDecisionClick = useCallback((decision: BranchDecision, metadata: Record<string, unknown>) => {
    console.log('[QuestTelemetryPanel] Decision selected:', { decision, metadata });
  }, []);

  if (!telemetry) {
    return null;
  }

  const panelClasses = clsx(
    'bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4',
    compact ? 'text-sm' : 'text-base',
    className
  );

  if (isLoading) {
    return (
      <div className={panelClasses}>
        <div className="flex items-center justify-center h-32">
          <div className="text-slate-400 text-sm">Loading telemetry...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx(panelClasses, 'border-red-400/40 bg-red-500/10')}>
        <div className="text-red-300 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={panelClasses}>
      {/* Header */}
      <div
        className={clsx(
          'flex items-center justify-between mb-4',
          compact && 'text-sm'
        )}
      >
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Quest Telemetry
        </h3>
        <div className="flex items-center space-x-2">
          {onClear ? (
            <button
              type="button"
              onClick={() => onClear()}
              className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-slate-300 transition-colors"
            >
              Clear
            </button>
          ) : null}
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <PerformanceMetrics telemetry={telemetry} className="mb-4" />

      {/* Heatmap Section */}
      {showHeatmap && transformedData && (
        <div className="heatmap-section mb-4">
          <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide mb-3">
            Quest Risk Heatmap
          </h4>
          <QuestHeatmap
            matrix={transformedData.heatmapMatrix}
            config={DEFAULT_QUEST_TELEMETRY_CONFIG}
            selectable={true}
            onCellClick={handleHeatmapCellClick}
            testMode={compact}
          />
        </div>
      )}

      {/* Risk Display */}
      {showRiskDisplay && (
        <div className="risk-display-section mb-4">
          <QuestRiskDisplay
            injuryPercentage={transformedData.statistics.averageRisk * 0.6}
            deathPercentage={transformedData.statistics.averageRisk * 0.4}
            onStripeClick={onRiskStripeClick}
          />
        </div>
      )}

      {/* Decision Feed */}
      {showRecentDecisions && (
        <div className="decision-feed-section">
          <QuestDecisionFeed
            telemetry={telemetry}
            config={decisionFeedConfig}
            compact={compact}
            showControls={!compact}
            showAnalytics={!compact}
            onDecisionClick={handleDecisionClick}
          />
        </div>
      )}

      {/* Legacy Quest Types (for backward compatibility) */}
      {!showHeatmap && (
        <QuestTypeHeatmap
          questTypeBreakdown={telemetry.questTypeBreakdown}
          questTypeDefinitions={questTypeDefinitions}
          className="mb-4"
        />
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {telemetry.totalBranches} total branches
          </span>
          <span>
            {formatDuration(telemetry.averageChoiceTime)} avg choice time
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper function for formatting duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function sortQuestTypes(definitions: Record<string, QuestTypeDefinition>): QuestTypeDefinition[] {
  return Object.values(definitions ?? {}).sort(
    (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER),
  );
}

export default QuestTelemetryPanel;
