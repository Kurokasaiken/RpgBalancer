import React, { useMemo } from 'react';
import clsx from 'clsx';

export interface DecisionFeedHeaderProps {
  visibleDecisions: number;
  totalBranches: number;
  newestDecisionTimestamp?: number;
  compact?: boolean;
  className?: string;
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
};

export const DecisionFeedHeader: React.FC<DecisionFeedHeaderProps> = ({
  visibleDecisions,
  totalBranches,
  newestDecisionTimestamp,
  compact = false,
  className,
}) => {
  const lastUpdatedLabel = useMemo(() => {
    if (!newestDecisionTimestamp) {
      return '—';
    }
    try {
      return new Date(newestDecisionTimestamp).toLocaleTimeString([], TIME_FORMAT);
    } catch {
      return '—';
    }
  }, [newestDecisionTimestamp]);

  return (
    <div
      className={clsx(
        'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4',
        compact && 'mb-3',
        className,
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Quest Decision Feed</h3>
        <p className="text-xs text-slate-500">Last update: {lastUpdatedLabel}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span>
            {visibleDecisions} decision{visibleDecisions === 1 ? '' : 's'}
          </span>
        </div>
        <span className="hidden sm:inline">•</span>
        <span>{totalBranches} total branches</span>
      </div>
    </div>
  );
};
