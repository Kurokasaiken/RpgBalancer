/**
 * DropSuggestionBadges Component
 *
 * React component that displays AI-powered suggestion badges for resident drop operations.
 * Shows contextual hints during drag-and-drop to help users make optimal assignments.
 */

import React, { useMemo } from 'react';
import type { DropSuggestion } from '@/balancing/config/idleVillage/dropAdvisorConfig';

/**
 * Props for DropSuggestionBadges component
 */
export interface DropSuggestionBadgesProps {
  /** Current suggestions to display */
  suggestions: DropSuggestion[];
  /** Maximum number of badges to show */
  maxBadges?: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show detailed tooltips */
  showTooltips?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Callback when a badge is clicked */
  onBadgeClick?: (suggestion: DropSuggestion) => void;
}

/**
 * Individual suggestion badge component
 */
interface SuggestionBadgeProps {
  suggestion: DropSuggestion;
  size: 'small' | 'medium' | 'large';
  showTooltip: boolean;
  onClick?: (suggestion: DropSuggestion) => void;
}

const SuggestionBadge: React.FC<SuggestionBadgeProps> = ({
  suggestion,
  size,
  showTooltip,
  onClick,
}) => {
  const getPriorityColor = (priority: DropSuggestion['priority']): string => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white border-red-600';
      case 'medium': return 'bg-yellow-500 text-black border-yellow-600';
      case 'low': return 'bg-blue-500 text-white border-blue-600';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getTypeIcon = (type: DropSuggestion['type']): string => {
    switch (type) {
      case 'REST_RESIDENT': return '😴';
      case 'ALTERNATIVE_ACTIVITY': return '🔄';
      case 'STAT_UPGRADE': return '⬆️';
      case 'ACTIVITY_SWAP': return '↔️';
      case 'WAITING_RESIDENT': return '⏳';
      case 'PERFECT_MATCH': return '⭐';
      case 'GOOD_MATCH': return '👍';
      case 'SCHEDULER_CONFLICT': return '📅';
      case 'UNAVAILABLE_RESIDENT': return '🚫';
      default: return '💡';
    }
  };

  const getSizeClasses = (size: 'small' | 'medium' | 'large'): string => {
    switch (size) {
      case 'small': return 'px-2 py-1 text-xs';
      case 'medium': return 'px-3 py-1.5 text-sm';
      case 'large': return 'px-4 py-2 text-base';
      default: return 'px-3 py-1.5 text-sm';
    }
  };

  const tooltipContent = useMemo(() => {
    if (!showTooltip) return undefined;
    return (
      <div className="max-w-xs p-2 bg-slate-800 text-white text-sm rounded shadow-lg border">
        <div className="font-semibold mb-1">{suggestion.title}</div>
        <div className="text-slate-200 mb-2">{suggestion.description}</div>
        {suggestion.actionText && (
          <div className="text-slate-300 text-xs italic">{suggestion.actionText}</div>
        )}
        {suggestion.statHints && suggestion.statHints.length > 0 && (
          <div className="mt-2 text-xs">
            <div className="text-slate-400">Stats: {suggestion.statHints.join(', ')}</div>
          </div>
        )}
        {suggestion.alternativeActivities && suggestion.alternativeActivities.length > 0 && (
          <div className="mt-1 text-xs">
            <div className="text-slate-400">Try: {suggestion.alternativeActivities.join(', ')}</div>
          </div>
        )}
      </div>
    );
  }, [suggestion, showTooltip]);

  return (
    <div className="relative inline-block">
      <button
        className={`
          inline-flex items-center space-x-1 rounded-full border font-medium
          transition-all duration-200 hover:scale-105 active:scale-95
          ${getPriorityColor(suggestion.priority)}
          ${getSizeClasses(size)}
          ${onClick ? 'cursor-pointer' : 'cursor-default'}
        `}
        onClick={() => onClick?.(suggestion)}
        title={showTooltip ? undefined : `${suggestion.title}: ${suggestion.description}`}
        aria-label={`${suggestion.title}: ${suggestion.description}`}
      >
        <span className="select-none">{getTypeIcon(suggestion.type)}</span>
        <span className="truncate max-w-20">{suggestion.title}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && tooltipContent && (
        <div
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ display: 'none' }} // Initially hidden, shown on hover via CSS
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

/**
 * DropSuggestionBadges Component
 *
 * Displays AI-generated suggestion badges for resident drop operations.
 * Provides visual cues to help users make optimal assignments during drag-and-drop.
 */
export const DropSuggestionBadges: React.FC<DropSuggestionBadgesProps> = ({
  suggestions,
  maxBadges = 3,
  size = 'medium',
  showTooltips = true,
  className = '',
  onBadgeClick,
}) => {
  // Filter and prioritize suggestions
  const displaySuggestions = useMemo(() => {
    const sorted = [...suggestions].sort((a, b) => {
      // Sort by priority (high first), then by type for consistency
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort by suggestion type for consistency
      return a.type.localeCompare(b.type);
    });

    return sorted.slice(0, maxBadges);
  }, [suggestions, maxBadges]);

  if (displaySuggestions.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        inline-flex flex-wrap items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-600
        ${className}
      `}
      role="region"
      aria-label={`AI Suggestions (${displaySuggestions.length})`}
    >
      {displaySuggestions.map((suggestion, index) => (
        <SuggestionBadge
          key={`${suggestion.type}-${index}`}
          suggestion={suggestion}
          size={size}
          showTooltip={showTooltips}
          onClick={onBadgeClick}
        />
      ))}

      {/* Show count if there are more suggestions */}
      {suggestions.length > maxBadges && (
        <div className="text-xs text-slate-400 self-center">
          +{suggestions.length - maxBadges} more
        </div>
      )}
    </div>
  );
};

export default DropSuggestionBadges;
