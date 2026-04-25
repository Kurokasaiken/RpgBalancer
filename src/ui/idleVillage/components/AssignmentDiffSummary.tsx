/**
 * Assignment Diff Summary Component - NP-020
 * 
 * React component for displaying assignment change diffs with
 * visual indicators, impact metrics, and detailed change breakdown.
 * Provides comprehensive view of assignment modifications.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useMemo, useCallback } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type AssignmentUndoConfig,
  type AssignmentDiffSummary,
  type AssignmentChangeType,
  DEFAULT_ASSIGNMENT_UNDO_CONFIG,
  getChangeTypeColor,
  getChangeTypeIcon,
  formatTimestamp,
} from '../config/assignmentUndoConfig';

const diagnostics = createSandboxDiagnostics('AssignmentDiffSummary', 'diff');

/**
 * Props for AssignmentDiffSummary component
 */
export interface AssignmentDiffSummaryProps {
  /** Diff summary data to display */
  summary: AssignmentDiffSummary;
  /** Configuration for display options */
  config?: Partial<AssignmentUndoConfig>;
  /** Whether to show detailed view */
  showDetails?: boolean;
  /** Whether to show impact metrics */
  showImpactMetrics?: boolean;
  /** Whether to show timestamps */
  showTimestamp?: boolean;
  /** Maximum number of changes to display */
  maxChanges?: number;
  /** Callback for change selection */
  onChangeSelect?: (changeId: string) => void;
  /** Whether component is expanded */
  expanded?: boolean;
  /** Callback for expand toggle */
  onExpandToggle?: (expanded: boolean) => void;
  /** Custom CSS class names */
  className?: string;
}

/**
 * Individual change item component
 */
interface ChangeItemProps {
  type: 'added' | 'removed' | 'moved';
  item: AssignmentDiffSummary['details']['added'][0] | 
        AssignmentDiffSummary['details']['removed'][0] | 
        AssignmentDiffSummary['details']['moved'][0];
  config: AssignmentUndoConfig;
  onSelect?: () => void;
}

const ChangeItem: React.FC<ChangeItemProps> = ({ type, item, config, onSelect }) => {
  const getChangeIcon = (changeType: 'added' | 'removed' | 'moved'): string => {
    switch (changeType) {
      case 'added': return '➕';
      case 'removed': return '➖';
      case 'moved': return '↔️';
      default: return '📝';
    }
  };

  const getChangeColor = (changeType: 'added' | 'removed' | 'moved'): string => {
    switch (changeType) {
      case 'added': return config.ui.visual.colors.success;
      case 'removed': return config.ui.visual.colors.danger;
      case 'moved': return config.ui.visual.colors.primary;
      default: return config.ui.visual.colors.secondary;
    }
  };

  const renderMovedItem = () => {
    if (type !== 'moved') return null;
    const movedItem = item as AssignmentDiffSummary['details']['moved'][0];
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm">{movedItem.residentName}</span>
        <span className="text-gray-400">→</span>
        <span className="text-sm">{movedItem.toActivityName}</span>
      </div>
    );
  };

  const renderSimpleItem = () => {
    if (type === 'moved') return null;
    const simpleItem = item as AssignmentDiffSummary['details']['added'][0] | 
                      AssignmentDiffSummary['details']['removed'][0];
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm">{simpleItem.residentName}</span>
        <span className="text-gray-400">→</span>
        <span className="text-sm">{simpleItem.activityName}</span>
      </div>
    );
  };

  return (
    <div
      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
        onSelect ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={onSelect}
      style={{ color: getChangeColor(type) }}
    >
      <span className="text-lg">{getChangeIcon(type)}</span>
      {type === 'moved' ? renderMovedItem() : renderSimpleItem()}
    </div>
  );
};

/**
 * Impact metrics component
 */
interface ImpactMetricsProps {
  impact: AssignmentDiffSummary['impact'];
  config: AssignmentUndoConfig;
};

const ImpactMetrics: React.FC<ImpactMetricsProps> = ({ impact, config }) => {
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return config.ui.visual.colors.danger;
      case 'high': return config.ui.visual.colors.warning;
      case 'medium': return config.ui.visual.colors.accent;
      case 'low': return config.ui.visual.colors.success;
      default: return config.ui.visual.colors.secondary;
    }
  };

  const getProductivityColor = (impact: number): string => {
    if (impact > 0.5) return config.ui.visual.colors.success;
    if (impact > 0) return config.ui.visual.colors.primary;
    if (impact < -0.5) return config.ui.visual.colors.danger;
    return config.ui.visual.colors.warning;
  };

  const getProductivityIcon = (impact: number): string => {
    if (impact > 0.5) return '📈';
    if (impact > 0) return '⬆️';
    if (impact < -0.5) return '📉';
    return '➡️';
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-3 bg-opacity-10 bg-gray-600 rounded">
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Priority</div>
        <div 
          className="text-sm font-semibold"
          style={{ color: getPriorityColor(impact.priority) }}
        >
          {impact.priority.toUpperCase()}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Productivity Impact</div>
        <div className="flex items-center space-x-1">
          <span className="text-lg">{getProductivityIcon(impact.productivityImpact)}</span>
          <span 
            className="text-sm font-semibold"
            style={{ color: getProductivityColor(impact.productivityImpact) }}
          >
            {Math.round(impact.productivityImpact * 100)}%
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Affected Residents</div>
        <div className="text-sm font-semibold text-white">
          {impact.affectedResidents}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Affected Activities</div>
        <div className="text-sm font-semibold text-white">
          {impact.affectedActivities}
        </div>
      </div>
    </div>
  );
};

/**
 * Main AssignmentDiffSummary component
 */
export const AssignmentDiffSummary: React.FC<AssignmentDiffSummaryProps> = ({
  summary,
  config: userConfig,
  showDetails = true,
  showImpactMetrics = true,
  showTimestamp = true,
  maxChanges = 10,
  onChangeSelect,
  expanded = false,
  onExpandToggle,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);

  const config = useMemo(() => ({
    ...DEFAULT_ASSIGNMENT_UNDO_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const handleExpandToggle = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandToggle?.(newExpanded);
  }, [isExpanded, onExpandToggle]);

  const handleChangeSelect = useCallback((changeId: string) => {
    setSelectedChangeId(changeId);
    onChangeSelect?.(changeId);
  }, [onChangeSelect]);

  const limitedDetails = useMemo(() => {
    const details = summary.details;
    return {
      added: details.added.slice(0, maxChanges),
      removed: details.removed.slice(0, maxChanges),
      moved: details.moved.slice(0, maxChanges),
    };
  }, [summary.details, maxChanges]);

  const hasChanges = limitedDetails.added.length > 0 || 
                    limitedDetails.removed.length > 0 || 
                    limitedDetails.moved.length > 0;

  const totalChanges = limitedDetails.added.length + 
                      limitedDetails.removed.length + 
                      limitedDetails.moved.length;

  const getChangeTypeColor = useCallback((type: AssignmentChangeType): string => {
    return config.ui.visual.changeTypeColors[type];
  }, [config]);

  return (
    <div 
      className={`bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-4 ${className}`}
      style={{
        fontFamily: config.ui.visual.typography.fontFamily,
        fontSize: config.ui.visual.typography.fontSize.medium,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span 
            className="text-2xl"
            style={{ color: getChangeTypeColor(summary.type) }}
          >
            {getChangeTypeIcon(summary.type)}
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {summary.summary}
            </h3>
            {showTimestamp && (
              <div className="text-xs text-gray-400">
                {formatTimestamp(summary.timestamp)}
              </div>
            )}
          </div>
        </div>
        
        {hasChanges && (
          <button
            onClick={handleExpandToggle}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <span className="text-gray-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          </button>
        )}
      </div>

      {/* Impact Metrics */}
      {showImpactMetrics && (
        <ImpactMetrics impact={summary.impact} config={config} />
      )}

      {/* Change Details */}
      {isExpanded && hasChanges && (
        <div className="space-y-3">
          {/* Summary Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{totalChanges} changes</span>
            {totalChanges > maxChanges && (
              <span>Showing first {maxChanges}</span>
            )}
          </div>

          {/* Added Changes */}
          {limitedDetails.added.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-green-400">
                <span>➕</span>
                <span>Added ({limitedDetails.added.length})</span>
              </div>
              <div className="space-y-1">
                {limitedDetails.added.map((item, index) => (
                  <ChangeItem
                    key={`added-${index}`}
                    type="added"
                    item={item}
                    config={config}
                    onSelect={() => handleChangeSelect(summary.changeId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Removed Changes */}
          {limitedDetails.removed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-red-400">
                <span>➖</span>
                <span>Removed ({limitedDetails.removed.length})</span>
              </div>
              <div className="space-y-1">
                {limitedDetails.removed.map((item, index) => (
                  <ChangeItem
                    key={`removed-${index}`}
                    type="removed"
                    item={item}
                    config={config}
                    onSelect={() => handleChangeSelect(summary.changeId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Moved Changes */}
          {limitedDetails.moved.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-blue-400">
                <span>↔️</span>
                <span>Moved ({limitedDetails.moved.length})</span>
              </div>
              <div className="space-y-1">
                {limitedDetails.moved.map((item, index) => (
                  <ChangeItem
                    key={`moved-${index}`}
                    type="moved"
                    item={item}
                    config={config}
                    onSelect={() => handleChangeSelect(summary.changeId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selected Change Indicator */}
          {selectedChangeId === summary.changeId && (
            <div className="mt-3 p-2 bg-blue-500 bg-opacity-20 border border-blue-500 rounded">
              <div className="text-sm text-blue-400">
                Change selected for undo/redo
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Changes Message */}
      {isExpanded && !hasChanges && (
        <div className="text-center py-4 text-gray-400">
          <div className="text-lg mb-2">📝</div>
          <div className="text-sm">No assignment changes detected</div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact diff summary component for inline display
 */
export interface CompactDiffSummaryProps {
  summary: AssignmentDiffSummary;
  config?: Partial<AssignmentUndoConfig>;
  onClick?: () => void;
  className?: string;
}

export const CompactDiffSummary: React.FC<CompactDiffSummaryProps> = ({
  summary,
  config: userConfig,
  onClick,
  className = '',
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_ASSIGNMENT_UNDO_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const getChangeTypeColor = useCallback((type: AssignmentChangeType): string => {
    return config.ui.visual.changeTypeColors[type];
  }, [config]);

  const totalChanges = summary.details.added.length + 
                      summary.details.removed.length + 
                      summary.details.moved.length;

  return (
    <div
      className={`flex items-center space-x-3 p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors ${className}`}
      onClick={onClick}
    >
      <span 
        className="text-lg"
        style={{ color: getChangeTypeColor(summary.type) }}
      >
        {getChangeTypeIcon(summary.type)}
      </span>
      
      <div className="flex-1">
        <div className="text-sm text-white font-medium">
          {summary.summary}
        </div>
        <div className="text-xs text-gray-400">
          {totalChanges} changes • {formatTimestamp(summary.timestamp)}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {summary.details.added.length > 0 && (
          <span className="text-xs text-green-400">
            +{summary.details.added.length}
          </span>
        )}
        {summary.details.removed.length > 0 && (
          <span className="text-xs text-red-400">
            -{summary.details.removed.length}
          </span>
        )}
        {summary.details.moved.length > 0 && (
          <span className="text-xs text-blue-400">
            ↔{summary.details.moved.length}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Diff summary list component for multiple changes
 */
export interface DiffSummaryListProps {
  summaries: AssignmentDiffSummary[];
  config?: Partial<AssignmentUndoConfig>;
  maxItems?: number;
  onSummarySelect?: (summary: AssignmentDiffSummary) => void;
  className?: string;
}

export const DiffSummaryList: React.FC<DiffSummaryListProps> = ({
  summaries,
  config: userConfig,
  maxItems = 10,
  onSummarySelect,
  className = '',
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_ASSIGNMENT_UNDO_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const limitedSummaries = useMemo(() => {
    return summaries.slice(0, maxItems);
  }, [summaries, maxItems]);

  const handleSummarySelect = useCallback((summary: AssignmentDiffSummary) => {
    onSummarySelect?.(summary);
  }, [onSummarySelect]);

  if (limitedSummaries.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-400 ${className}`}>
        <div className="text-2xl mb-2">📋</div>
        <div className="text-sm">No assignment changes to display</div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {limitedSummaries.map((summary, index) => (
        <CompactDiffSummary
          key={summary.changeId}
          summary={summary}
          config={config}
          onClick={() => handleSummarySelect(summary)}
        />
      ))}
      
      {summaries.length > maxItems && (
        <div className="text-center py-2 text-gray-400 text-sm">
          ... and {summaries.length - maxItems} more changes
        </div>
      )}
    </div>
  );
};
