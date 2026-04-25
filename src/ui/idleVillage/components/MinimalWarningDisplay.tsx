/**
 * Minimal Warning Display component for roster and resource warnings.
 * 
 * This component displays only essential warning information without
 * decorative elements or redundant data, following the minimal UI approach.
 */

import React from 'react';
import type { WarningSystemState, Warning, WarningSeverity } from '../hooks/useWarningSystem';

/**
 * Props for MinimalWarningDisplay component
 */
export interface MinimalWarningDisplayProps {
  /** Current warning system state */
  warningState: WarningSystemState;
  /** Maximum number of warnings to display */
  maxWarnings?: number;
  /** Show warning count badge */
  showCount?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * Get color for warning severity
 */
const getSeverityColor = (severity: WarningSeverity): string => {
  switch (severity) {
    case 'critical': return 'rgb(239, 68, 68)';    // red-500
    case 'high': return 'rgb(251, 146, 60)';      // orange-400
    case 'medium': return 'rgb(251, 191, 36)';    // amber-400
    case 'low': return 'rgb(59, 130, 246)';       // blue-500
    default: return 'rgb(156, 163, 175)';        // slate-400
  }
};

/**
 * Get background color for warning severity
 */
const getSeverityBgColor = (severity: WarningSeverity): string => {
  switch (severity) {
    case 'critical': return 'rgba(239, 68, 68, 0.1)';    // red-500/10
    case 'high': return 'rgba(251, 146, 60, 0.1)';      // orange-400/10
    case 'medium': return 'rgba(251, 191, 36, 0.1)';    // amber-400/10
    case 'low': return 'rgba(59, 130, 246, 0.1)';       // blue-500/10
    default: return 'rgba(156, 163, 175, 0.1)';        // slate-400/10
  }
};

/**
 * Minimal Warning Display Component
 */
export const MinimalWarningDisplay: React.FC<MinimalWarningDisplayProps> = ({
  warningState,
  maxWarnings = 3,
  showCount = true,
  compact = false,
}) => {
  const { warnings, hasCriticalWarnings, hasHighWarnings, warningCount } = warningState;

  // Don't render if no warnings
  if (warnings.length === 0) {
    return null;
  }

  // Limit warnings to display
  const displayWarnings = warnings.slice(0, maxWarnings);
  const hasMoreWarnings = warnings.length > maxWarnings;

  return (
    <div 
      className={`rounded border p-2 text-xs ${
        hasCriticalWarnings 
          ? 'border-red-500/30 bg-red-500/5' 
          : hasHighWarnings 
            ? 'border-orange-400/30 bg-orange-400/5'
            : 'border-amber-400/30 bg-amber-400/5'
      }`}
      style={{
        borderColor: hasCriticalWarnings 
          ? 'rgba(239, 68, 68, 0.3)'
          : hasHighWarnings 
            ? 'rgba(251, 146, 60, 0.3)'
            : 'rgba(251, 191, 36, 0.3)',
        backgroundColor: hasCriticalWarnings 
          ? 'rgba(239, 68, 68, 0.05)'
          : hasHighWarnings 
            ? 'rgba(251, 146, 60, 0.05)'
            : 'rgba(251, 191, 36, 0.05)',
      }}
    >
      {/* Header with count */}
      <div className="flex items-center justify-between mb-1">
        <div className="font-semibold text-white/80">
          Warnings
        </div>
        {showCount && (
          <div 
            className="rounded-full px-2 py-0.5 text-white font-medium"
            style={{
              backgroundColor: hasCriticalWarnings 
                ? 'rgba(239, 68, 68, 0.8)'
                : hasHighWarnings 
                  ? 'rgba(251, 146, 60, 0.8)'
                  : 'rgba(251, 191, 36, 0.8)',
            }}
          >
            {warningCount}
          </div>
        )}
      </div>

      {/* Warning list */}
      {!compact && (
        <div className="space-y-1">
          {displayWarnings.map((warning) => (
            <div 
              key={warning.id}
              className="flex items-center gap-2 text-white/70"
            >
              {/* Severity indicator */}
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getSeverityColor(warning.severity) }}
              />
              
              {/* Warning message */}
              <div className="flex-1 min-w-0">
                <div className="truncate">{warning.message}</div>
                {warning.count > 1 && (
                  <div className="text-white/50 text-[10px]">
                    {warning.count} affected
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* More warnings indicator */}
          {hasMoreWarnings && (
            <div className="text-white/50 text-[10px] italic">
              +{warnings.length - maxWarnings} more...
            </div>
          )}
        </div>
      )}

      {/* Compact mode - just show summary */}
      {compact && (
        <div className="text-white/70">
          {displayWarnings[0]?.message}
          {hasMoreWarnings && ` +${warnings.length - 1} more`}
        </div>
      )}
    </div>
  );
};

/**
 * Individual Warning Item Component
 */
export const MinimalWarningItem: React.FC<{ warning: Warning }> = ({ warning }) => {
  return (
    <div 
      className="flex items-center gap-2 p-1 rounded border text-xs text-white/70"
      style={{
        borderColor: getSeverityColor(warning.severity),
        backgroundColor: getSeverityBgColor(warning.severity),
      }}
    >
      {/* Severity indicator */}
      <div 
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: getSeverityColor(warning.severity) }}
      />
      
      {/* Warning message */}
      <div className="flex-1 min-w-0 truncate">
        {warning.message}
      </div>
      
      {/* Count indicator */}
      {warning.count > 1 && (
        <div 
          className="rounded px-1 py-0.5 text-white text-[10px]"
          style={{ backgroundColor: getSeverityColor(warning.severity) }}
        >
          {warning.count}
        </div>
      )}
    </div>
  );
};
