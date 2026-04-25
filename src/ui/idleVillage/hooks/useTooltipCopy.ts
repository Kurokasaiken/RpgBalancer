/**
 * Tooltip Copy Hook
 *
 * Config-first hook for tooltip content with telemetry integration.
 * Reads from tooltip configuration and emits telemetry events.
 */

import { useCallback, useMemo } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { MinimalUITooltips } from '@/balancing/config/idleVillage/minimalConfig';

/**
 * Hook parameters for useTooltipCopy
 */
export interface UseTooltipCopyParams {
  /** Tooltip configuration */
  tooltipConfig?: MinimalUITooltips;
  /** Whether telemetry is enabled */
  telemetryEnabled?: boolean;
  /** Optional source identifier for telemetry */
  telemetrySource?: string;
}

/**
 * Hook return value
 */
export interface UseTooltipCopyReturn {
  /** Get tooltip content for a section and key */
  getTooltipCopy: (section: keyof MinimalUITooltips, key: string) => string;
  /** Check if tooltip exists */
  hasTooltip: (section: keyof MinimalUITooltips, key: string) => boolean;
  /** Get all tooltips for a section */
  getSectionTooltips: (section: keyof MinimalUITooltips) => Record<string, string>;
}

/**
 * Hook for accessing tooltip content with telemetry integration.
 * Reads from tooltip configuration and emits telemetry events when tooltips are shown.
 */
export const useTooltipCopy = ({
  tooltipConfig,
  telemetryEnabled = true,
  telemetrySource = 'unknown',
}: UseTooltipCopyParams): UseTooltipCopyReturn => {
  // Memoize tooltip entries to avoid repeated lookups
  const tooltipEntries = useMemo(() => {
    if (!tooltipConfig) return {};
    
    return {
      hudResources: tooltipConfig.hudResources?.entries || {},
      workerTraits: tooltipConfig.workerTraits?.entries || {},
      slotStatus: tooltipConfig.slotStatus?.entries || {},
    };
  }, [tooltipConfig]);

  // Get tooltip content for a section and key
  const getTooltipCopy = useCallback(
    (section: keyof MinimalUITooltips, key: string): string => {
      const content = tooltipEntries[section]?.[key] || '';
      
      // Emit telemetry event when tooltip is accessed
      if (telemetryEnabled && content) {
        trackTelemetryEvent('tooltip_shown', {
          tooltipId: `${section}.${key}`,
          section,
          key,
          content,
          source: telemetrySource,
          timestamp: Date.now(),
        });
      }
      
      return content;
    },
    [tooltipEntries, telemetryEnabled, telemetrySource]
  );

  // Check if tooltip exists
  const hasTooltip = useCallback(
    (section: keyof MinimalUITooltips, key: string): boolean => {
      return Boolean(tooltipEntries[section]?.[key]);
    },
    [tooltipEntries]
  );

  // Get all tooltips for a section
  const getSectionTooltips = useCallback(
    (section: keyof MinimalUITooltips): Record<string, string> => {
      return tooltipEntries[section] || {};
    },
    [tooltipEntries]
  );

  return {
    getTooltipCopy,
    hasTooltip,
    getSectionTooltips,
  };
};

/**
 * Hook for tooltip interaction telemetry
 */
export const useTooltipInteraction = ({
  tooltipId,
  telemetryEnabled = true,
  telemetrySource = 'unknown',
}: {
  tooltipId: string;
  telemetryEnabled?: boolean;
  telemetrySource?: string;
}) => {
  const trackInteraction = useCallback(
    (action: 'click' | 'hover' | 'focus' | 'dismiss') => {
      if (!telemetryEnabled) return;
      
      trackTelemetryEvent('tooltip_interaction', {
        tooltipId,
        action,
        source: telemetrySource,
        timestamp: Date.now(),
      });
    },
    [tooltipId, telemetryEnabled, telemetrySource]
  );

  return {
    trackClick: () => trackInteraction('click'),
    trackHover: () => trackInteraction('hover'),
    trackFocus: () => trackInteraction('focus'),
    trackDismiss: () => trackInteraction('dismiss'),
  };
};

/**
 * Default fallback tooltip copy for missing entries
 */
export const FALLBACK_TOOLTIP_COPY = {
  gold: 'Gold reserves for village operations.',
  food: 'Food supplies for resident consumption.',
  day: 'Current day in the village cycle.',
  fatigue: 'Resident fatigue level affecting performance.',
  strength: 'Physical power for strenuous activities.',
  endurance: 'Stamina for sustained work.',
  agility: 'Speed and reflexes for quick tasks.',
  intelligence: 'Mental acuity for complex problems.',
  perception: 'Awareness for detecting opportunities.',
  injured: 'This resident cannot work while injured.',
  exhausted: 'This resident needs rest before working.',
  idle: 'This slot is available for work assignment.',
  active: 'Work is currently in progress.',
  blocked: 'This slot is temporarily unavailable.',
  warning: 'Assignment may have risks or requirements.',
  valid_drop: 'This worker can be assigned here.',
  invalid_drop: 'This worker cannot be assigned here.',
} as const;

/**
 * Get fallback tooltip copy
 */
export const getFallbackTooltip = (key: string): string => {
  return FALLBACK_TOOLTIP_COPY[key as keyof typeof FALLBACK_TOOLTIP_COPY] || 'Information unavailable.';
};

export default useTooltipCopy;
