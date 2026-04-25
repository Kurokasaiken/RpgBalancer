import React from 'react';
import clsx from 'clsx';
import type { QuestDecisionFeedConfig } from './QuestDecisionFeedConfig';
import type { QuestDecisionFeedFilter, QuestDecisionFeedSort } from '@/ui/idleVillage/config/questDecisionFeedConfig';

export interface DecisionFeedToolbarProps {
  filter: QuestDecisionFeedFilter;
  sort: QuestDecisionFeedSort;
  searchTerm: string;
  groupByQuest: boolean;
  highlightHeroic: boolean;
  config: QuestDecisionFeedConfig;
  onFilterChange: (value: QuestDecisionFeedFilter) => void;
  onSortChange: (value: QuestDecisionFeedSort) => void;
  onSearchChange: (value: string) => void;
  onToggleGroupByQuest: (value: boolean) => void;
  onToggleHighlightHeroic: (value: boolean) => void;
  onExportJson?: () => void;
  onExportCsv?: () => void;
  compact?: boolean;
}

export const DecisionFeedToolbar: React.FC<DecisionFeedToolbarProps> = ({
  filter,
  sort,
  searchTerm,
  groupByQuest,
  highlightHeroic,
  config,
  onFilterChange,
  onSortChange,
  onSearchChange,
  onToggleGroupByQuest,
  onToggleHighlightHeroic,
  onExportJson,
  onExportCsv,
  compact,
}) => {
  const showControls = config.enableFiltering || config.enableSorting || config.enableSearch;
  if (!showControls) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-slate-900/50 border border-slate-800 rounded-lg p-3 mb-4',
        compact && 'mb-3'
      )}
    >
      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
        <button
          type="button"
          className={clsx(
            'px-3 py-1 rounded border transition-colors',
            groupByQuest ? 'border-amber-400 text-amber-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'
          )}
          onClick={() => onToggleGroupByQuest(!groupByQuest)}
        >
          Group by Quest
        </button>
        <button
          type="button"
          className={clsx(
            'px-3 py-1 rounded border transition-colors',
            highlightHeroic ? 'border-amber-400 text-amber-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'
          )}
          onClick={() => onToggleHighlightHeroic(!highlightHeroic)}
        >
          Highlight Heroic
        </button>
        {config.enableFiltering && (
          <select
            className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1 text-slate-200"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as QuestDecisionFeedFilter)}
          >
            <option value="all">All</option>
            <option value="recent">Recent</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="quick">Quick</option>
            <option value="slow">Slow</option>
            <option value="heroic">Heroic</option>
          </select>
        )}
        {config.enableSorting && (
          <select
            className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1 text-slate-200"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as QuestDecisionFeedSort)}
          >
            <option value="timestamp">Timestamp</option>
            <option value="duration">Duration</option>
            <option value="choice-time">Choice Time</option>
            <option value="success">Success</option>
            <option value="quest-type">Quest Type</option>
          </select>
        )}
        {config.enableSearch && (
          <input
            type="search"
            className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1 text-slate-200"
            placeholder="Search decisions"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {onExportJson && (
          <button
            type="button"
            className="px-3 py-1 text-xs border border-slate-700 rounded text-slate-300 hover:text-white"
            onClick={onExportJson}
          >
            Export JSON
          </button>
        )}
        {onExportCsv && (
          <button
            type="button"
            className="px-3 py-1 text-xs border border-slate-700 rounded text-slate-300 hover:text-white"
            onClick={onExportCsv}
          >
            Export CSV
          </button>
        )}
      </div>
    </div>
  );
};
