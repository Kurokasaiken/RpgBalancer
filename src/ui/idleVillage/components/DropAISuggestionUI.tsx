/**
 * AI Drop Suggestion UI Components for Idle Village Phase E
 * 
 * Provides visual hints and overlays for AI-powered resident-activity suggestions.
 * Follows Gilded Observatory theme with retro styling and accessibility.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { 
  DropSuggestion, 
  SuggestionType, 
  SuggestionPriority 
} from '@/ui/idleVillage/ai/dropSuggestionEngine';

/**
 * Suggestion tooltip component
 */
export interface SuggestionTooltipProps {
  /** Suggestion to display */
  suggestion: DropSuggestion;
  /** Position relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** On click handler */
  onClick?: () => void;
  /** CSS classes */
  className?: string;
}

export const SuggestionTooltip: React.FC<SuggestionTooltipProps> = ({
  suggestion,
  position = 'top',
  showDetails = false,
  onClick,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority: SuggestionPriority): string => {
    switch (priority) {
      case 'critical': return 'text-red-400 border-red-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getPriorityIcon = (priority: SuggestionPriority): string => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚡';
      case 'medium': return '💡';
      case 'low': return '💭';
      default: return '📝';
    }
  };

  const getTypeIcon = (type: SuggestionType): string => {
    switch (type) {
      case 'optimal_assignment': return '🎯';
      case 'crew_optimization': return '👥';
      case 'fatigue_management': return '😴';
      case 'resource_need': return '📦';
      case 'stat_development': return '📈';
      case 'emergency_fill': return '🆘';
      default: return '💡';
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`
        absolute z-50 w-80 bg-slate-900 border rounded-lg shadow-2xl
        ${getPriorityColor(suggestion.priority)}
        ${positionClasses[position]}
        ${className}
      `}
      onClick={onClick}
      role="tooltip"
      aria-label={`AI Suggestion: ${suggestion.reason}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
            <span className="text-lg">{getPriorityIcon(suggestion.priority)}</span>
            <span className="font-semibold text-white truncate">
              {suggestion.activity.label}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {Math.round(suggestion.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="p-3">
        <p className="text-sm text-slate-200">{suggestion.reason}</p>
      </div>

      {/* Expandable details */}
      {(showDetails || isExpanded) && (
        <div className="border-t border-slate-700">
          <div className="p-3 space-y-2">
            {/* Expected outcomes */}
            {suggestion.expectedOutcomes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1">Expected Outcomes</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Success:</span>
                    <span className="text-slate-200 ml-1">
                      {Math.round((suggestion.expectedOutcomes.successProbability || 0) * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Yield:</span>
                    <span className="text-slate-200 ml-1">
                      {((suggestion.expectedOutcomes.yieldMultiplier || 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Fatigue:</span>
                    <span className="text-slate-200 ml-1 capitalize">
                      {suggestion.expectedOutcomes.fatigueImpact}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Risk:</span>
                    <span className="text-slate-200 ml-1 capitalize">
                      {suggestion.expectedOutcomes.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Context factors */}
            {suggestion.metadata.contextFactors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1">Context</h4>
                <div className="flex flex-wrap gap-1">
                  {suggestion.metadata.contextFactors.map(factor => (
                    <span
                      key={factor}
                      className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded"
                    >
                      {factor.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {suggestion.metadata.alternatives.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-1">Alternatives</h4>
                <div className="space-y-1">
                  {suggestion.metadata.alternatives.slice(0, 2).map((alt, index) => (
                    <div key={index} className="text-xs text-slate-300">
                      <span className="text-slate-400">{alt.activity.label}:</span> {alt.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expand toggle */}
      {!showDetails && (
        <button
          className="w-full p-2 text-xs text-slate-400 hover:text-slate-200 transition-colors border-t border-slate-700"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
};

/**
 * Suggestion indicator component (small badge)
 */
export interface SuggestionIndicatorProps {
  /** Suggestion to indicate */
  suggestion: DropSuggestion;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show pulse animation */
  showPulse?: boolean;
  /** On click handler */
  onClick?: () => void;
  /** CSS classes */
  className?: string;
}

export const SuggestionIndicator: React.FC<SuggestionIndicatorProps> = ({
  suggestion,
  size = 'medium',
  showPulse = true,
  onClick,
  className = '',
}) => {
  const getPriorityColor = (priority: SuggestionPriority): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500 border-red-400';
      case 'high': return 'bg-orange-500 border-orange-400';
      case 'medium': return 'bg-yellow-500 border-yellow-400';
      case 'low': return 'bg-blue-500 border-blue-400';
      default: return 'bg-gray-500 border-gray-400';
    }
  };

  const getSizeClasses = (size: 'small' | 'medium' | 'large'): string => {
    switch (size) {
      case 'small': return 'w-4 h-4 text-xs';
      case 'medium': return 'w-6 h-6 text-sm';
      case 'large': return 'w-8 h-8 text-base';
      default: return 'w-6 h-6 text-sm';
    }
  };

  const getTypeIcon = (type: SuggestionType): string => {
    switch (type) {
      case 'optimal_assignment': return '🎯';
      case 'crew_optimization': return '👥';
      case 'fatigue_management': return '😴';
      case 'resource_need': return '📦';
      case 'stat_development': return '📈';
      case 'emergency_fill': return '🆘';
      default: return '💡';
    }
  };

  return (
    <div
      className={`
        relative flex items-center justify-center rounded-full border-2 cursor-pointer
        ${getPriorityColor(suggestion.priority)}
        ${getSizeClasses(size)}
        ${showPulse ? 'animate-pulse' : ''}
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`AI suggestion: ${suggestion.reason}`}
      title={suggestion.reason}
    >
      <span className="select-none">{getTypeIcon(suggestion.type)}</span>
      
      {/* Confidence indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-900 rounded-full flex items-center justify-center">
        <span className="text-xs text-white font-bold">
          {Math.round(suggestion.confidence * 10)}
        </span>
      </div>
    </div>
  );
};

/**
 * Suggestion overlay component (covers an activity slot)
 */
export interface SuggestionOverlayProps {
  /** Suggestions to display */
  suggestions: DropSuggestion[];
  /** Whether to show the overlay */
  visible: boolean;
  /** Position and size */
  position: { x: number; y: number; width: number; height: number };
  /** On suggestion select */
  onSelectSuggestion?: (suggestion: DropSuggestion) => void;
  /** On dismiss */
  onDismiss?: () => void;
  /** CSS classes */
  className?: string;
}

export const SuggestionOverlay: React.FC<SuggestionOverlayProps> = ({
  suggestions,
  visible,
  position,
  onSelectSuggestion,
  onDismiss,
  className = '',
}) => {
  if (!visible || suggestions.length === 0) return null;

  const sortedSuggestions = useMemo(() => {
    return [...suggestions].sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by confidence
      return b.confidence - a.confidence;
    });
  }, [suggestions]);

  return (
    <div
      className={`
        fixed z-50 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl
        ${className}
      `}
      style={{
        left: position.x,
        top: position.y,
        minWidth: Math.max(200, position.width),
        maxWidth: 400,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
        <button
          className="text-slate-400 hover:text-white transition-colors"
          onClick={onDismiss}
          aria-label="Dismiss suggestions"
        >
          ✕
        </button>
      </div>

      {/* Suggestions list */}
      <div className="max-h-64 overflow-y-auto">
        {sortedSuggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`
              p-3 border-b border-slate-800 last:border-b-0
              hover:bg-slate-800 cursor-pointer transition-colors
              ${index === 0 ? 'border-l-4 border-l-green-400' : ''}
            `}
            onClick={() => onSelectSuggestion?.(suggestion)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <SuggestionIndicator
                    suggestion={suggestion}
                    size="small"
                    showPulse={false}
                  />
                  <span className="text-sm font-medium text-white truncate">
                    {suggestion.activity.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {suggestion.reason}
                </p>
                {suggestion.expectedOutcomes && (
                  <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                    <span>Success: {Math.round((suggestion.expectedOutcomes.successProbability || 0) * 100)}%</span>
                    <span>Risk: {suggestion.expectedOutcomes.riskLevel}</span>
                  </div>
                )}
              </div>
              <div className="ml-2 text-xs text-slate-400">
                {Math.round(suggestion.confidence * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-700 text-xs text-slate-500 text-center">
        {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
};

/**
 * Suggestion highlight component (highlights suggested activities)
 */
export interface SuggestionHighlightProps {
  /** Whether to show highlight */
  active: boolean;
  /** Suggestion priority */
  priority?: SuggestionPriority;
  /** Highlight intensity */
  intensity?: 'subtle' | 'normal' | 'strong';
  /** CSS classes */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

export const SuggestionHighlight: React.FC<SuggestionHighlightProps> = ({
  active,
  priority = 'medium',
  intensity = 'normal',
  className = '',
  children,
}) => {
  if (!active) return <>{children}</>;

  const getPriorityColor = (priority: SuggestionPriority): string => {
    switch (priority) {
      case 'critical': return 'rgba(239, 68, 68, '; // red-500
      case 'high': return 'rgba(251, 146, 60, '; // orange-400
      case 'medium': return 'rgba(251, 191, 36, '; // amber-400
      case 'low': return 'rgba(96, 165, 250, '; // blue-400
      default: return 'rgba(156, 163, 175, '; // gray-400
    }
  };

  const getIntensityAlpha = (intensity: 'subtle' | 'normal' | 'strong'): string => {
    switch (intensity) {
      case 'subtle': return '0.1)';
      case 'normal': return '0.2)';
      case 'strong': return '0.3)';
      default: return '0.2)';
    }
  };

  const highlightStyle = {
    boxShadow: `0 0 0 2px ${getPriorityColor(priority)}${getIntensityAlpha(intensity)}`,
    backgroundColor: `${getPriorityColor(priority)}${getIntensityAlpha('subtle')}`,
  };

  return (
    <div
      className={`
        relative rounded-lg transition-all duration-300
        ${intensity === 'strong' ? 'animate-pulse' : ''}
        ${className}
      `}
      style={highlightStyle}
    >
      {children}
      
      {/* Priority indicator dot */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse" />
    </div>
  );
};

/**
 * Complete suggestion container with all components
 */
export interface DropAISuggestionContainerProps {
  /** Current suggestions */
  suggestions: DropSuggestion[];
  /** Target activity */
  activity: ActivityDefinition;
  /** Target resident (if being dragged) */
  resident?: ResidentState;
  /** Whether to show UI */
  showUI: boolean;
  /** On suggestion select */
  onSelectSuggestion?: (suggestion: DropSuggestion) => void;
  /** Container position */
  position: { x: number; y: number; width: number; height: number };
  /** UI mode */
  mode?: 'tooltip' | 'overlay' | 'highlight' | 'all';
  /** CSS classes */
  className?: string;
}

export const DropAISuggestionContainer: React.FC<DropAISuggestionContainerProps> = ({
  suggestions,
  activity,
  resident,
  showUI,
  onSelectSuggestion,
  position,
  mode = 'all',
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Filter suggestions for this activity/resident
  const relevantSuggestions = useMemo(() => {
    if (!showUI) return [];
    return suggestions.filter(s => {
      const activityMatch = s.activity.id === activity.id;
      const residentMatch = !resident || s.resident.id === resident.id;
      return activityMatch && residentMatch;
    });
  }, [suggestions, activity, resident, showUI]);

  const bestSuggestion = relevantSuggestions[0];

  const handleIndicatorClick = useCallback(() => {
    if (mode === 'overlay' || mode === 'all') {
      setShowOverlay(true);
    } else if (mode === 'tooltip') {
      setShowTooltip(true);
    }
  }, [mode]);

  const handleSuggestionSelect = useCallback((suggestion: DropSuggestion) => {
    onSelectSuggestion?.(suggestion);
    setShowOverlay(false);
    setShowTooltip(false);
  }, [onSelectSuggestion]);

  if (!showUI || relevantSuggestions.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Highlight effect */}
      {(mode === 'highlight' || mode === 'all') && bestSuggestion && (
        <SuggestionHighlight
          active={true}
          priority={bestSuggestion.priority}
          intensity="normal"
        >
          <div> {/* Children placeholder */} </div>
        </SuggestionHighlight>
      )}

      {/* Indicator */}
      {(mode === 'tooltip' || mode === 'overlay' || mode === 'all') && bestSuggestion && (
        <div
          className="absolute top-1 right-1 z-40"
          onClick={handleIndicatorClick}
        >
          <SuggestionIndicator
            suggestion={bestSuggestion}
            size="small"
            showPulse={bestSuggestion.priority === 'critical'}
          />
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && bestSuggestion && (
        <div className="absolute z-50">
          <SuggestionTooltip
            suggestion={bestSuggestion}
            position="top"
            showDetails={true}
            onClick={() => handleSuggestionSelect(bestSuggestion)}
          />
        </div>
      )}

      {/* Overlay */}
      {showOverlay && (
        <SuggestionOverlay
          suggestions={relevantSuggestions}
          visible={true}
          position={{
            x: position.x,
            y: position.y + position.height + 5,
            width: position.width,
            height: 200,
          }}
          onSelectSuggestion={handleSuggestionSelect}
          onDismiss={() => setShowOverlay(false)}
        />
      )}
    </div>
  );
};
