/**
 * QuestDecisionFeed Component
 *
 * Real-time decision feed for quest telemetry with filtering, analysis, and interactive features.
 * Shows branch decisions, choice patterns, and decision analytics.
 * Enhanced with new quest telemetry transforms and decision feed integration.
 */

import React, { useMemo, useCallback } from 'react';
import clsx from 'clsx';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { BranchDecision, BranchOutcome } from '@/engine/quest/types';
import { useIdleVillageConfigStore } from '@/balancing/config/idleVillage/IdleVillageConfigStore';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';
import { useQuestDecisionFeed } from '@/ui/idleVillage/hooks/useQuestDecisionFeed';
import type { QuestDecisionFeedConfig as QuestDecisionFeedDomainConfig } from '@/ui/idleVillage/config/questDecisionFeedConfig';
import {
  DEFAULT_DECISION_FEED_CONFIG,
  type QuestDecisionFeedConfig as QuestDecisionFeedDisplayConfig,
  type DecisionAnalytics as DecisionAnalyticsStats,
} from './QuestDecisionFeedConfig';
import { QuestRiskBadge } from './QuestRiskBadge';
import { DecisionFeedHeader } from './QuestDecisionFeedHeader';
import { DecisionFeedToolbar } from './QuestDecisionFeedToolbar';

export interface QuestDecisionFeedProps {
  className?: string;
  telemetry: AggregatedTelemetry;
  /** Presentation overrides (timestamps, quest tags visibility, etc.). */
  config?: Partial<QuestDecisionFeedDisplayConfig>;
  /** Domain config overrides applied before running the hook. */
  feedConfigOverrides?: Partial<QuestDecisionFeedDomainConfig>;
  onDecisionClick?: (decision: BranchDecision, metadata: Record<string, unknown>) => void;
  showAnalytics?: boolean;
  showControls?: boolean;
  compact?: boolean;
}

interface DecisionMetaFlags {
  isHeroic: boolean;
  isQuick: boolean;
  isSlow: boolean;
  choiceTime: number;
}

const EXPORT_MIME: Record<'json' | 'csv', string> = {
  json: 'application/json',
  csv: 'text/csv',
};

const buildExportFilename = (format: 'json' | 'csv') =>
  `quest-decisions-${new Date().toISOString().slice(0, 10)}.${format}`;

interface ExtendedQuestMetadata {
  questId?: string;
  choiceMade?: string;
  lastChoiceTime?: number;
  isHeroicMoment?: boolean;
  injuryRisk?: number;
  deathRisk?: number;
  duration?: number;
  result?: 'success' | 'failure' | string;
  success?: boolean;
  narrativeSummary?: string;
  branchReason?: string;
  [key: string]: unknown;
}

type ExtendedBranchOutcome = BranchOutcome & {
  success?: boolean;
  description?: string;
  metadata?: ExtendedQuestMetadata;
};

const getExtendedOutcome = (decision: BranchDecision): ExtendedBranchOutcome =>
  (decision?.outcome as ExtendedBranchOutcome) ?? ({} as ExtendedBranchOutcome);

const getDecisionMetadata = (decision: BranchDecision): ExtendedQuestMetadata =>
  getExtendedOutcome(decision).metadata ?? {};

const getDecisionSuccess = (decision: BranchDecision): boolean => {
  const outcome = getExtendedOutcome(decision);
  if (typeof outcome.success === 'boolean') return outcome.success;
  const metadata = getDecisionMetadata(decision);
  if (typeof metadata.success === 'boolean') return metadata.success;
  if (typeof metadata.result === 'string') return metadata.result === 'success';
  return false;
};

const getDecisionDescription = (decision: BranchDecision): string => {
  const outcome = getExtendedOutcome(decision);
  if (typeof outcome.description === 'string') return outcome.description;
  const metadata = getDecisionMetadata(decision);
  if (typeof metadata.narrativeSummary === 'string') return metadata.narrativeSummary;
  if (typeof metadata.branchReason === 'string') return metadata.branchReason;
  return '';
};

const getDecisionChoice = (decision: BranchDecision): string => {
  const choice = getDecisionMetadata(decision).choiceMade;
  return typeof choice === 'string' ? choice : '';
};

/**
 * Decision item component
 */
const DecisionItem: React.FC<{
  decision: BranchDecision;
  questTypeDefinition?: QuestTypeDefinition;
  displayConfig: QuestDecisionFeedDisplayConfig;
  highlightHeroic: boolean;
  flags: DecisionMetaFlags;
  onClick?: (decision: BranchDecision, metadata: Record<string, unknown>) => void;
}> = ({ decision, questTypeDefinition, displayConfig, highlightHeroic, flags, onClick }) => {
  const metadata = getDecisionMetadata(decision);
  const success = getDecisionSuccess(decision);

  const handleClick = useCallback(() => {
    onClick?.(decision, {
      questTypeDefinition,
      ...flags,
      metadata,
    });
  }, [decision, flags, metadata, onClick, questTypeDefinition]);

  return (
    <div
      className={clsx(
        'p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:z-10 relative',
        success ? 'bg-green-900/20 border-green-700/40' : 'bg-red-900/20 border-red-700/40',
        highlightHeroic && flags.isHeroic && 'ring-2 ring-amber-400/50',
        displayConfig.compactMode && 'p-2'
      )}
      onClick={handleClick}
    >
      {/* Risk Badge */}
      <QuestRiskBadge
        questId={decision.phaseId}
        injuryRisk={typeof metadata.injuryRisk === 'number' ? metadata.injuryRisk : undefined}
        deathRisk={typeof metadata.deathRisk === 'number' ? metadata.deathRisk : undefined}
        variant="compact"
        position="top-right"
        showPercentages={false}
        showLabels={false}
        enableHover={false}
        enableAnimations={false}
      />
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Choice */}
          <div className="flex items-center gap-2 mb-1">
            <div className={clsx(
              'w-2 h-2 rounded-full shrink-0',
              success ? 'bg-green-400' : 'bg-red-400'
            )} />
            <span className={clsx('font-medium text-white truncate', displayConfig.compactMode && 'text-sm')}>
              {getDecisionChoice(decision) || 'Unknown Choice'}
            </span>
            {highlightHeroic && flags.isHeroic && (
              <span className="px-2 py-0.5 text-xs bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/40">
                Heroic
              </span>
            )}
            {flags.isQuick && (
              <span className="px-2 py-0.5 text-xs bg-blue-400/20 text-blue-300 rounded-full border border-blue-400/40">
                Quick
              </span>
            )}
            {flags.isSlow && (
              <span className="px-2 py-0.5 text-xs bg-orange-400/20 text-orange-300 rounded-full border border-orange-400/40">
                Slow
              </span>
            )}
          </div>

          {/* Phase and Quest Type */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Phase: {decision.phaseId}</span>
            {displayConfig.showQuestTypes && questTypeDefinition && (
              <>
                <span>•</span>
                <span>{questTypeDefinition.label}</span>
              </>
            )}
          </div>

          {/* Choice Time */}
          {displayConfig.showChoiceTimes && flags.choiceTime > 0 && (
            <div className="text-xs text-slate-500">Choice time: {flags.choiceTime.toFixed(1)}s</div>
          )}

          {displayConfig.showOutcomes && getDecisionDescription(decision) && (
            <div className="text-xs text-slate-300 mt-1 italic">{getDecisionDescription(decision)}</div>
          )}
        </div>

        {/* Timestamp */}
        {displayConfig.showTimestamps && (
          <div className="text-xs text-slate-500 whitespace-nowrap">
            {new Date(decision.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              ...(displayConfig.compactMode ? {} : { second: '2-digit' })
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Decision analytics component
 */
const DecisionAnalytics: React.FC<{
  decisions: BranchDecision[];
  questTypeDefinitions: Record<string, QuestTypeDefinition>;
}> = ({ decisions, questTypeDefinitions }) => {
  const analytics = useMemo<DecisionAnalyticsStats>(() => {
    const totalDecisions = decisions.length;
    const successfulDecisions = decisions.filter((decision) => getDecisionSuccess(decision)).length;
    const successRate = totalDecisions > 0 ? successfulDecisions / totalDecisions : 0;

    const choiceTimes = decisions
      .map((decision) => getDecisionMetadata(decision).lastChoiceTime ?? 0)
      .filter((time) => time > 0);

    const averageChoiceTime =
      choiceTimes.length > 0 ? choiceTimes.reduce((sum, time) => sum + time, 0) / choiceTimes.length : 0;

    const quickDecisions = choiceTimes.filter((time) => time < 2).length;
    const slowDecisions = choiceTimes.filter((time) => time > 10).length;
    const heroicDecisions = decisions.filter((decision) => getDecisionMetadata(decision).isHeroicMoment === true).length;

    const choiceCounts: Record<string, number> = {};
    decisions.forEach((decision) => {
      const choice = getDecisionChoice(decision) || 'Unknown';
      choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
    });
    const mostCommonChoices = Object.entries(choiceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([choice, count]) => ({ choice, count }));

    const questTypeDistribution: Record<string, number> = {};
    decisions.forEach((decision) => {
      const definition = Object.values(questTypeDefinitions).find((def) =>
        def.matchers?.some((matcher) => matcher.includes?.some((needle) => decision.phaseId.includes(needle.toLowerCase()))),
      );
      if (definition) {
        questTypeDistribution[definition.id] = (questTypeDistribution[definition.id] || 0) + 1;
      }
    });

    const hourlyActivity: Record<number, number> = {};
    decisions.forEach((decision) => {
      const hour = new Date(decision.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    return {
      totalDecisions,
      averageChoiceTime,
      quickDecisions,
      slowDecisions,
      heroicDecisions,
      successRate,
      mostCommonChoices,
      questTypeDistribution,
      hourlyActivity,
    };
  }, [decisions, questTypeDefinitions]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
        Decision Analytics
      </h4>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-lg font-bold text-amber-400">
            {analytics.totalDecisions}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Total Decisions
          </div>
        </div>

        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-lg font-bold text-green-400">
            {(analytics.successRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Success Rate
          </div>
        </div>

        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-lg font-bold text-blue-400">
            {analytics.averageChoiceTime.toFixed(1)}s
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Avg Choice Time
          </div>
        </div>

        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-lg font-bold text-purple-400">
            {analytics.heroicDecisions}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Heroic Moments
          </div>
        </div>
      </div>

      {/* Choice Patterns */}
      <div>
        <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          Most Common Choices
        </h5>
        <div className="space-y-1">
          {analytics.mostCommonChoices.map(({ choice, count }, index) => (
            <div key={choice} className="flex items-center justify-between text-xs">
              <span className="text-slate-300 truncate flex-1">
                {index + 1}. {choice}
              </span>
              <span className="text-slate-500 ml-2">
                {count} ({((count / analytics.totalDecisions) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Speed */}
      <div>
        <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          Decision Speed Analysis
        </h5>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Quick decisions (&lt;2s)</span>
            <span className="text-blue-400">{analytics.quickDecisions}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Slow decisions (&gt;10s)</span>
            <span className="text-orange-400">{analytics.slowDecisions}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestDecisionFeed: React.FC<QuestDecisionFeedProps> = ({
  className,
  telemetry,
  config,
  feedConfigOverrides,
  onDecisionClick,
  showAnalytics,
  showControls,
  compact,
}) => {
  const feedState = useQuestDecisionFeed({ telemetry, config: feedConfigOverrides });
  const {
    processedDecisions,
    groupedDecisions,
    filter,
    sort,
    searchTerm,
    groupByQuest,
    highlightHeroic,
    setFilter,
    setSort,
    setSearchTerm,
    setGroupByQuest,
    setHighlightHeroic,
    exportDecisions,
  } = feedState;

  const currentConfig = useMemo(() => ({ ...DEFAULT_DECISION_FEED_CONFIG, ...config }), [config]);
  const questTypeDefinitions = useIdleVillageConfigStore((state) => state.questTypeDefinitions);

  const handleDecisionClick = useCallback(
    (decision: BranchDecision, metadata: Record<string, unknown>) => {
      onDecisionClick?.(decision, metadata);
    },
    [onDecisionClick]
  );

  const handleConfigChange = useCallback((newConfig: Partial<QuestDecisionFeedDisplayConfig>) => {
    // Presentation config overrides are managed upstream; placeholder for future coupling.
  }, []);

  const handleFilterChange = useCallback((value: QuestDecisionFeedFilter) => {
    setFilter(value);
  }, [setFilter]);

  const handleSortChange = useCallback((value: QuestDecisionFeedSort) => {
    setSort(value);
  }, [setSort]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, [setSearchTerm]);

  const handleToggleGroupByQuest = useCallback(() => {
    setGroupByQuest(!groupByQuest);
  }, [groupByQuest, setGroupByQuest]);

  const handleToggleHighlightHeroic = useCallback(() => {
    setHighlightHeroic(!highlightHeroic);
  }, [highlightHeroic, setHighlightHeroic]);

  const handleExportJson = useCallback(() => {
    const payload = exportDecisions('json');
    if (!payload) return;
    const blob = new Blob([payload], { type: EXPORT_MIME.json });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildExportFilename('json');
    link.click();
    URL.revokeObjectURL(url);
  }, [exportDecisions]);

  const handleExportCsv = useCallback(() => {
    const payload = exportDecisions('csv');
    if (!payload) return;
    const blob = new Blob([payload], { type: EXPORT_MIME.csv });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildExportFilename('csv');
    link.click();
    URL.revokeObjectURL(url);
  }, [exportDecisions]);

  const decoratedDecisions = useMemo(() => {
    return processedDecisions.map((decision) => {
      const choiceTime = (decision.outcome.metadata?.lastChoiceTime as number) || 0;
      const questTypeDefinition = Object.values(questTypeDefinitions).find((def) =>
        def.matchers?.some((matcher) => matcher.includes?.some((needle) => decision.phaseId.includes(needle.toLowerCase()))),
      );
      return {
        ...decision,
        flags: {
          isHeroic: decision.outcome.metadata?.isHeroicMoment === true,
          isQuick: choiceTime > 0 && choiceTime < 2,
          isSlow: choiceTime > 10,
          choiceTime,
        },
        questTypeDefinition,
      } as BranchDecision & { flags: DecisionMetaFlags; questTypeDefinition?: QuestTypeDefinition };
    });
  }, [processedDecisions, questTypeDefinitions]);

  const groupedDecoratedDecisions = useMemo(() => {
    if (!groupByQuest) {
      return { all: decoratedDecisions };
    }
    return decoratedDecisions.reduce<Record<string, typeof decoratedDecisions>>((acc, decision) => {
      const questId = getDecisionMetadata(decision).questId ?? decision.phaseId;
      if (!acc[questId]) {
        acc[questId] = [];
      }
      acc[questId].push(decision);
      return acc;
    }, {});
  }, [decoratedDecisions, groupByQuest]);

  const hasDecisions = decoratedDecisions.length > 0;

  return (
    <div
      className={clsx(
        'space-y-4',
        compact && 'p-3',
        className
      )}
    >
      {/* Header */}
      <DecisionFeedHeader
        config={currentConfig}
        onConfigChange={handleConfigChange}
        compact={compact}
      />

      {/* Controls */}
      {showControls && (
        <DecisionFeedToolbar
          config={currentConfig}
          filter={filter}
          sort={sort}
          searchTerm={searchTerm}
          groupByQuest={groupByQuest}
          highlightHeroic={highlightHeroic}
          onConfigChange={handleConfigChange}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          onToggleGroupByQuest={handleToggleGroupByQuest}
          onToggleHighlightHeroic={handleToggleHighlightHeroic}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          compact={compact}
        />
      )}

      {/* Analytics */}
      {showAnalytics && hasDecisions && (
        <div className="mb-4">
          <DecisionAnalytics
            decisions={decoratedDecisions}
            questTypeDefinitions={questTypeDefinitions}
            config={currentConfig}
          />
        </div>
      )}

      {/* Decision Feed */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(groupedDecoratedDecisions).map(([groupId, decisions]) => (
          <div key={groupId}>
            {currentConfig.groupByQuest && groupId !== 'all' && (
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Quest: {groupId}
              </h4>
            )}
            <div className="space-y-2">
              {decisions.map((decision) => (
                <DecisionItem
                  key={`${decision.phaseId}-${decision.timestamp}`}
                  decision={decision}
                  questTypeDefinition={decision.questTypeDefinition}
                  displayConfig={currentConfig}
                  highlightHeroic={highlightHeroic}
                  onClick={handleDecisionClick}
                  flags={decision.flags}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{telemetry.totalBranches} total branches</span>
          <span>Filter: {filter}</span>
          <span>Sort: {sort}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestDecisionFeed;
