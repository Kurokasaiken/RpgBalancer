/**
 * Location Tooltip Hook - NP-109
 * 
 * Hook for managing location tooltip state and data aggregation.
 * Provides tooltip positioning, visibility control, and data formatting.
 * 
 * @since 2026-01-23
 * @author Cascade
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { LocationFeaturedActivity } from '@/ui/idleVillage/components/LocationCard';
import {
  DEFAULT_LOCATION_TOOLTIP_CONFIG,
  type LocationTooltipConfig,
  type CrewCapacityStatus,
  type ActivityRiskLevel,
  getCrewCapacityStatus,
} from '@/ui/idleVillage/config/locationTooltipConfig';

/**
 * Location data for tooltip display
 */
export interface LocationTooltipData {
  /** Location identifier */
  locationId: string;
  /** Location title */
  title: string;
  /** Location description */
  description: string;
  /** Featured activity data */
  featuredActivity?: LocationFeaturedActivity | null;
  /** Current crew count */
  crewCurrent: number;
  /** Maximum crew capacity */
  crewMax: number;
  /** Crew capacity status */
  crewStatus: CrewCapacityStatus;
  /** Assigned crew member names */
  assignedCrew: string[];
  /** Required stat tags for activities */
  requiredStats?: string[];
  /** Activity risk level */
  riskLevel?: ActivityRiskLevel;
  /** Whether location is locked by phase */
  isLockedByPhase: boolean;
  /** Phase status text (e.g., "Day", "Night") */
  phaseStatus?: string;
  /** Estimated time to completion (seconds) */
  etaSeconds?: number;
  /** Progress fraction (0-1) */
  progressFraction?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Tooltip position data
 */
export interface TooltipPosition {
  x: number;
  y: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Hook return type
 */
export interface UseLocationTooltipReturn {
  /** Whether tooltip is currently visible */
  isVisible: boolean;
  /** Current tooltip position */
  position: TooltipPosition | null;
  /** Processed tooltip data */
  tooltipData: LocationTooltipData | null;
  /** Show tooltip with data */
  showTooltip: (data: LocationTooltipData, mouseEvent: React.MouseEvent | MouseEvent) => void;
  /** Hide tooltip */
  hideTooltip: () => void;
  /** Hide tooltip immediately (no delay) */
  hideTooltipImmediate: () => void;
  /** Update tooltip position */
  updatePosition: (mouseEvent: React.MouseEvent | MouseEvent) => void;
}

/**
 * Hook for managing location tooltip state and behavior
 */
export function useLocationTooltip(
  config: Partial<LocationTooltipConfig> = {}
): UseLocationTooltipReturn {
  const mergedConfig = useMemo(
    () => ({
      ...DEFAULT_LOCATION_TOOLTIP_CONFIG,
      visual: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.visual, ...config.visual },
      behavior: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.behavior, ...config.behavior },
      content: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.content, ...config.content },
      sections: { ...DEFAULT_LOCATION_TOOLTIP_CONFIG.sections, ...config.sections },
    }),
    [config]
  );

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [tooltipData, setTooltipData] = useState<LocationTooltipData | null>(null);

  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const autoHideTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Calculate tooltip position based on mouse event and viewport constraints
   */
  const calculatePosition = useCallback(
    (mouseEvent: React.MouseEvent | MouseEvent): TooltipPosition => {
      const mouseX = mouseEvent.clientX;
      const mouseY = mouseEvent.clientY;
      const offset = mergedConfig.behavior.offsetPx;
      const maxWidth = mergedConfig.visual.maxWidth;
      const tooltipHeight = 200; // Approximate height

      let placement: TooltipPosition['placement'] = 'bottom';
      let x = mouseX;
      let y = mouseY + offset;

      if (mergedConfig.behavior.constrainToViewport) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 8;

        // Determine best placement based on available space
        const spaceBelow = viewportHeight - mouseY;
        const spaceAbove = mouseY;
        const spaceRight = viewportWidth - mouseX;
        const spaceLeft = mouseX;

        if (mergedConfig.behavior.preferredPlacement === 'auto') {
          // Auto-determine best placement
          if (spaceBelow >= tooltipHeight + offset) {
            placement = 'bottom';
            y = mouseY + offset;
          } else if (spaceAbove >= tooltipHeight + offset) {
            placement = 'top';
            y = mouseY - tooltipHeight - offset;
          } else if (spaceRight >= maxWidth + offset) {
            placement = 'right';
            x = mouseX + offset;
            y = Math.max(padding, Math.min(viewportHeight - tooltipHeight - padding, mouseY - tooltipHeight / 2));
          } else if (spaceLeft >= maxWidth + offset) {
            placement = 'left';
            x = mouseX - maxWidth - offset;
            y = Math.max(padding, Math.min(viewportHeight - tooltipHeight - padding, mouseY - tooltipHeight / 2));
          } else {
            // Fallback to bottom with constraint
            placement = 'bottom';
            y = Math.min(viewportHeight - tooltipHeight - padding, mouseY + offset);
          }
        } else {
          placement = mergedConfig.behavior.preferredPlacement;
        }

        // Constrain to viewport bounds
        x = Math.max(padding, Math.min(viewportWidth - maxWidth - padding, x));
        y = Math.max(padding, Math.min(viewportHeight - tooltipHeight - padding, y));
      }

      return { x, y, placement };
    },
    [mergedConfig]
  );

  /**
   * Show tooltip with data
   */
  const showTooltip = useCallback(
    (data: LocationTooltipData, mouseEvent: React.MouseEvent | MouseEvent) => {
      // Clear any existing timeouts
      if (showTimeoutRef.current !== undefined) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current !== undefined) clearTimeout(hideTimeoutRef.current);
      if (autoHideTimeoutRef.current !== undefined) clearTimeout(autoHideTimeoutRef.current);

      // Process data with crew capacity status
      const processedData: LocationTooltipData = {
        ...data,
        crewStatus: getCrewCapacityStatus(data.crewCurrent, data.crewMax),
      };

      // Show with delay
      showTimeoutRef.current = setTimeout(() => {
        setTooltipData(processedData);
        setPosition(calculatePosition(mouseEvent));
        setIsVisible(true);

        // Set auto-hide if configured
        if (mergedConfig.behavior.autoHideDurationMs > 0) {
          autoHideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
          }, mergedConfig.behavior.autoHideDurationMs);
        }
      }, mergedConfig.behavior.showDelayMs);
    },
    [mergedConfig, calculatePosition]
  );

  /**
   * Hide tooltip with delay
   */
  const hideTooltip = useCallback(() => {
    if (showTimeoutRef.current !== undefined) clearTimeout(showTimeoutRef.current);
    if (autoHideTimeoutRef.current !== undefined) clearTimeout(autoHideTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setPosition(null);
      setTooltipData(null);
    }, mergedConfig.behavior.hideDelayMs);
  }, [mergedConfig]);

  /**
   * Hide tooltip immediately
   */
  const hideTooltipImmediate = useCallback(() => {
    if (showTimeoutRef.current !== undefined) clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current !== undefined) clearTimeout(hideTimeoutRef.current);
    if (autoHideTimeoutRef.current !== undefined) clearTimeout(autoHideTimeoutRef.current);

    setIsVisible(false);
    setPosition(null);
    setTooltipData(null);
  }, []);

  /**
   * Update tooltip position (for follow mouse behavior)
   */
  const updatePosition = useCallback(
    (mouseEvent: React.MouseEvent | MouseEvent) => {
      if (isVisible && mergedConfig.behavior.followMouse) {
        setPosition(calculatePosition(mouseEvent));
      }
    },
    [isVisible, mergedConfig, calculatePosition]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current !== undefined) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current !== undefined) clearTimeout(hideTimeoutRef.current);
      if (autoHideTimeoutRef.current !== undefined) clearTimeout(autoHideTimeoutRef.current);
    };
  }, []);

  return {
    isVisible,
    position,
    tooltipData,
    showTooltip,
    hideTooltip,
    hideTooltipImmediate,
    updatePosition,
  };
}

/**
 * Hook for processing location data into tooltip format
 */
export function useLocationTooltipData(
  locationId: string,
  title: string,
  description: string,
  featuredActivity?: LocationFeaturedActivity | null,
  additionalData?: Partial<LocationTooltipData>
): LocationTooltipData {
  return useMemo(() => {
    // Extract crew data from featured activity
    const assignedCrew = featuredActivity?.assignedNames || [];
    const crewCurrent = assignedCrew.length;
    const crewMax = additionalData?.crewMax || 5; // Default max crew

    // Calculate progress and ETA from featured activity
    const progressFraction = featuredActivity?.progressFraction || 0;
    const etaSeconds = additionalData?.etaSeconds;

    // Determine risk level based on activity tone
    let riskLevel: ActivityRiskLevel = 'none';
    if (featuredActivity?.tone === 'danger') {
      riskLevel = 'high';
    } else if (featuredActivity?.tone === 'quest') {
      riskLevel = 'medium';
    } else if (featuredActivity?.tone === 'job') {
      riskLevel = 'low';
    }

    return {
      locationId,
      title,
      description,
      featuredActivity,
      crewCurrent,
      crewMax,
      crewStatus: getCrewCapacityStatus(crewCurrent, crewMax),
      assignedCrew,
      requiredStats: additionalData?.requiredStats,
      riskLevel: additionalData?.riskLevel || riskLevel,
      isLockedByPhase: additionalData?.isLockedByPhase || false,
      phaseStatus: additionalData?.phaseStatus,
      etaSeconds,
      progressFraction,
      metadata: additionalData?.metadata,
    };
  }, [locationId, title, description, featuredActivity, additionalData]);
}
