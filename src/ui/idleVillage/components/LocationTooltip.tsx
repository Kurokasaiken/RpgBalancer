/**
 * Location Tooltip Component - NP-109
 * 
 * Tooltip component for displaying location information including crew,
 * requirements, and activity stats. Follows Gilded Observatory theme.
 * 
 * @since 2026-01-23
 * @author Cascade
 */

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import type { LocationTooltipData, TooltipPosition } from '@/ui/idleVillage/hooks/useLocationTooltip';
import {
  DEFAULT_LOCATION_TOOLTIP_CONFIG,
  type LocationTooltipConfig,
  getCrewCapacityColor,
  getRiskLevelColor,
  getRiskLevelBgColor,
  formatDuration,
  formatPercentage,
} from '@/ui/idleVillage/config/locationTooltipConfig';

/**
 * Props for LocationTooltip component
 */
export interface LocationTooltipProps {
  /** Tooltip data to display */
  data: LocationTooltipData;
  /** Position for the tooltip */
  position: TooltipPosition;
  /** Whether the tooltip is visible */
  isVisible: boolean;
  /** Callback when tooltip should close */
  onClose?: () => void;
  /** Custom configuration */
  config?: Partial<LocationTooltipConfig>;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Location Tooltip component with crew info, requirements, and stats
 */
const LocationTooltip: React.FC<LocationTooltipProps> = ({
  data,
  position,
  isVisible,
  onClose,
  config: userConfig,
  testId = 'location-tooltip',
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const config = React.useMemo(
    () => ({
      ...DEFAULT_LOCATION_TOOLTIP_CONFIG,
      visual: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.visual, ...userConfig?.visual },
      behavior: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.behavior, ...userConfig?.behavior },
      content: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.content, ...userConfig?.content },
      sections: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.sections, ...userConfig?.sections },
    }),
    [userConfig]
  );

  // Close tooltip on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const crewCapacityColor = getCrewCapacityColor(data.crewStatus);
  const riskLevelColor = data.riskLevel ? getRiskLevelColor(data.riskLevel) : undefined;
  const riskLevelBgColor = data.riskLevel ? getRiskLevelBgColor(data.riskLevel) : undefined;

  // Sort sections by configured order
  const sections = [
    { key: 'crew', order: config.sections.sectionOrder.crew, show: config.sections.showCrewSection },
    { key: 'requirements', order: config.sections.sectionOrder.requirements, show: config.sections.showRequirementsSection },
    { key: 'stats', order: config.sections.sectionOrder.stats, show: config.sections.showStatsSection },
    { key: 'status', order: config.sections.sectionOrder.status, show: config.sections.showStatusSection },
  ]
    .filter((s) => s.show)
    .sort((a, b) => a.order - b.order);

  const tooltipContent = (
    <div
      ref={tooltipRef}
      data-testid={testId}
      className={clsx(
        'fixed rounded-lg border backdrop-blur-md',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${config.visual.maxWidth}px`,
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: config.visual.backgroundColor,
        borderColor: config.visual.borderColor,
        borderRadius: config.visual.borderRadius,
        boxShadow: config.visual.boxShadow,
        padding: config.visual.padding,
        zIndex: config.visual.zIndex,
        color: config.visual.textColor,
      }}
      role="tooltip"
      aria-label={`${data.title} - Location details`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {config.content.showTitle && (
            <h3 className="text-base font-semibold text-amber-100 truncate">{data.title}</h3>
          )}
          {config.content.showDescription && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">{data.description}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 shrink-0 text-slate-400 hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50 rounded p-1 transition-colors"
            aria-label="Close tooltip"
          >
            ✕
          </button>
        )}
      </div>

      {/* Phase Status Warning */}
      {config.content.showPhaseStatus && data.isLockedByPhase && (
        <div className="mb-3 rounded-md bg-slate-800/50 border border-slate-600/30 px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-lg" aria-hidden="true">🌙</span>
            <span className="text-slate-300">
              {data.phaseStatus || 'Location locked during night phase'}
            </span>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          switch (section.key) {
            case 'crew':
              return (
                <div key="crew" className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Crew Assignment
                  </h4>

                  {/* Crew Capacity */}
                  {config.content.showCrewCapacity && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Capacity</span>
                      <span
                        className="font-semibold"
                        style={{ color: crewCapacityColor }}
                      >
                        {data.crewCurrent} / {data.crewMax}
                      </span>
                    </div>
                  )}

                  {/* Assigned Crew */}
                  {config.content.showAssignedCrew && data.assignedCrew.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Assigned Workers</div>
                      <div className="flex flex-wrap gap-1">
                        {data.assignedCrew
                          .slice(0, config.content.maxCrewDisplay)
                          .map((name, index) => (
                            <span
                              key={`${data.locationId}-crew-${index}`}
                              className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded border border-slate-600/30"
                            >
                              {name}
                            </span>
                          ))}
                        {data.assignedCrew.length > config.content.maxCrewDisplay && (
                          <span className="text-xs px-2 py-1 text-slate-400">
                            +{data.assignedCrew.length - config.content.maxCrewDisplay} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {config.content.showAssignedCrew && data.assignedCrew.length === 0 && (
                    <div className="text-xs text-slate-500 italic">No workers assigned</div>
                  )}
                </div>
              );

            case 'requirements':
              return config.content.showRequirements && data.requiredStats && data.requiredStats.length > 0 ? (
                <div key="requirements" className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Requirements
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {data.requiredStats
                      .slice(0, config.content.maxRequirementsDisplay)
                      .map((stat, index) => (
                        <span
                          key={`${data.locationId}-req-${index}`}
                          className="text-xs px-2 py-1 bg-amber-900/20 text-amber-300 rounded border border-amber-600/30"
                        >
                          {stat}
                        </span>
                      ))}
                    {data.requiredStats.length > config.content.maxRequirementsDisplay && (
                      <span className="text-xs px-2 py-1 text-slate-400">
                        +{data.requiredStats.length - config.content.maxRequirementsDisplay} more
                      </span>
                    )}
                  </div>
                </div>
              ) : null;

            case 'stats':
              return config.content.showActivityStats && data.featuredActivity ? (
                <div key="stats" className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Activity Progress
                  </h4>

                  {/* Activity Info */}
                  <div className="flex items-center gap-2 text-xs">
                    {data.featuredActivity.icon && (
                      <span className="text-base" aria-hidden="true">
                        {data.featuredActivity.icon}
                      </span>
                    )}
                    <span className="text-slate-300">{data.featuredActivity.label}</span>
                  </div>

                  {/* Progress Bar */}
                  {data.progressFraction !== undefined && (
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{formatPercentage(data.progressFraction)}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_currentColor]"
                          style={{ width: `${data.progressFraction * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ETA */}
                  {data.etaSeconds !== undefined && data.etaSeconds > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Time Remaining</span>
                      <span className="text-slate-300 font-medium">
                        {formatDuration(data.etaSeconds)}
                      </span>
                    </div>
                  )}

                  {/* Meta Label */}
                  {data.featuredActivity.metaLabel && (
                    <div className="text-xs text-amber-200/70">
                      {data.featuredActivity.metaLabel}
                    </div>
                  )}
                </div>
              ) : null;

            case 'status':
              return (
                <div key="status" className="space-y-2">
                  {/* Risk Level */}
                  {config.content.showRiskLevel && data.riskLevel && data.riskLevel !== 'none' && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Risk Level</div>
                      <span
                        className="inline-block text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded"
                        style={{
                          color: riskLevelColor,
                          backgroundColor: riskLevelBgColor,
                        }}
                      >
                        {data.riskLevel}
                      </span>
                    </div>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Additional Metadata */}
      {config.content.showDetailedStats && data.metadata && Object.keys(data.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">Additional Details</h4>
          <div className="space-y-1">
            {Object.entries(data.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-slate-300">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(tooltipContent, document.body);
};

export default LocationTooltip;
