import React from 'react';
import { useMaintenanceAdvisor } from '@/ui/idleVillage/hooks/useMaintenanceAdvisor';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { Resident } from '@/engine/game/idleVillage/types';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/activities';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';

/**
 * Props for the MaintenanceAdvisorPanel component.
 */
export interface MaintenanceAdvisorPanelProps {
  /** Current village state to analyze. */
  villageState: VillageState;
  /** Available residents in the village. */
  residents: Resident[];
  /** Available activity definitions. */
  activities: ActivityDefinition[];
  /** Whether to show the panel collapsed by default. */
  collapsed?: boolean;
  /** Maximum number of recommendations to display. */
  maxRecommendations?: number;
  /** Optional CSS class name. */
  className?: string;
}

/**
 * Priority color mapping for visual indicators.
 */
const PRIORITY_COLORS = {
  critical: 'text-red-400 bg-red-900/20 border-red-700',
  high: 'text-orange-400 bg-orange-900/20 border-orange-700',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
  low: 'text-green-400 bg-green-900/20 border-green-700',
} as const;

/**
 * Priority icon mapping.
 */
const PRIORITY_ICONS = {
  critical: '🚨',
  high: '⚠️',
  medium: 'ℹ️',
  low: '💡',
} as const;

/**
 * Maintenance Advisor Panel - AI-powered recommendations for village management.
 * Displays intelligent suggestions for resource management, scheduling, and optimization.
 */
export const MaintenanceAdvisorPanel: React.FC<MaintenanceAdvisorPanelProps> = ({
  villageState,
  residents,
  activities,
  collapsed = false,
  maxRecommendations = 10,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);
  const { analysis, isAnalyzing, analyze, getRecommendationsByPriority } = useMaintenanceAdvisor({
    villageState,
    residents,
    activities,
  });

  const { config } = useIdleVillageConfig();

  const handleRefresh = React.useCallback(() => {
    analyze();
  }, [analyze]);

  const handleToggleCollapse = React.useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const criticalRecommendations = getRecommendationsByPriority('critical');
  const highRecommendations = getRecommendationsByPriority('high');
  const mediumRecommendations = getRecommendationsByPriority('medium');
  const lowRecommendations = getRecommendationsByPriority('low');

  const displayedRecommendations = React.useMemo(() => {
    const all = [
      ...criticalRecommendations,
      ...highRecommendations,
      ...mediumRecommendations,
      ...lowRecommendations,
    ];
    return all.slice(0, maxRecommendations);
  }, [criticalRecommendations, highRecommendations, mediumRecommendations, lowRecommendations, maxRecommendations]);

  if (!analysis || !config) {
    return (
      <div className={`maintenance-advisor-panel bg-slate-800 border border-slate-600 rounded-lg p-4 ${className}`}>
        <div className="text-slate-400 text-sm">Loading Maintenance Advisor...</div>
      </div>
    );
  }

  return (
    <div className={`maintenance-advisor-panel bg-slate-800 border border-slate-600 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-600">
        <div className="flex items-center space-x-2">
          <span className="text-slate-200 font-semibold">Maintenance Advisor</span>
          <span className="text-xs text-slate-400">AI</span>
          {isAnalyzing && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Priority Summary Badges */}
          {analysis.summary.criticalCount > 0 && (
            <span className="px-2 py-1 text-xs bg-red-900/20 text-red-400 border border-red-700 rounded">
              {analysis.summary.criticalCount} Critical
            </span>
          )}
          {analysis.summary.highCount > 0 && (
            <span className="px-2 py-1 text-xs bg-orange-900/20 text-orange-400 border border-orange-700 rounded">
              {analysis.summary.highCount} High
            </span>
          )}
          {/* Action Buttons */}
          <button
            onClick={handleRefresh}
            disabled={isAnalyzing}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors disabled:opacity-50"
            title="Refresh analysis"
          >
            🔄
          </button>
          <button
            onClick={handleToggleCollapse}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {displayedRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-400 text-2xl mb-2">✅</div>
              <div className="text-slate-300 font-medium">All Systems Optimal</div>
              <div className="text-slate-400 text-sm">No maintenance recommendations at this time.</div>
            </div>
          ) : (
            displayedRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
              />
            ))
          )}

          {/* Summary Footer */}
          {displayedRecommendations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-600">
              <div className="text-xs text-slate-400 text-center">
                Showing {displayedRecommendations.length} of {analysis.summary.totalCount} recommendations
                {analysis.summary.totalCount > maxRecommendations && (
                  <span className="text-slate-500"> • {analysis.summary.totalCount - maxRecommendations} more available</span>
                )}
              </div>
              <div className="flex justify-center space-x-4 mt-2 text-xs">
                <span className="text-red-400">Critical: {analysis.summary.criticalCount}</span>
                <span className="text-orange-400">High: {analysis.summary.highCount}</span>
                <span className="text-yellow-400">Medium: {analysis.summary.mediumCount}</span>
                <span className="text-green-400">Low: {analysis.summary.lowCount}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Individual recommendation card component.
 */
interface RecommendationCardProps {
  recommendation: import('@/ui/idleVillage/hooks/useMaintenanceAdvisor').MaintenanceRecommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const handleActionClick = React.useCallback(() => {
    if (recommendation.action) {
      recommendation.action.callback();
    }
  }, [recommendation.action]);

  return (
    <div className={`p-3 rounded-lg border ${PRIORITY_COLORS[recommendation.priority]} relative`}>
      {/* Priority Indicator */}
      <div className="flex items-start space-x-3">
        <div className="shrink-0 mt-0.5">
          <span className="text-lg" title={`${recommendation.priority} priority`}>
            {PRIORITY_ICONS[recommendation.priority]}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-medium text-slate-200 mb-1">
            {recommendation.title}
          </h4>

          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {recommendation.description}
          </p>

          {/* Action Button */}
          {recommendation.action && (
            <button
              onClick={handleActionClick}
              className="mt-2 px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
            >
              {recommendation.action.label}
            </button>
          )}
        </div>
      </div>

      {/* Type Badge */}
      <div className="absolute top-2 right-2">
        <span className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
          {recommendation.type.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};

export default MaintenanceAdvisorPanel;
