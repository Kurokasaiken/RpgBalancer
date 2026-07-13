/**
 * Tooltip Copy Hook
 *
 * i18next-backed hook for tooltip content with telemetry integration.
 * Reads from the `idleVillage` namespace and falls back to the provided
 * tooltip configuration and static fallback copy.
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { MinimalUITooltips } from '@/balancing/config/idleVillage/minimalConfig';

/**
 * Tooltip sections exposed by the hook.
 */
export type TooltipSection = 'hudResources' | 'workerTraits' | 'slotStatus';

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
  getTooltipCopy: (section: TooltipSection, key: string) => string;
  /** Check if tooltip exists */
  hasTooltip: (section: TooltipSection, key: string) => boolean;
  /** Get all tooltips for a section */
  getSectionTooltips: (section: TooltipSection) => Record<string, string>;
}

/**
 * Hook for accessing tooltip content with telemetry integration.
 * Reads from the `idleVillage` i18next namespace and emits telemetry
 * events when tooltips are resolved.
 */
export const useTooltipCopy = ({
  tooltipConfig,
  telemetryEnabled = true,
  telemetrySource = 'unknown',
}: UseTooltipCopyParams): UseTooltipCopyReturn => {
  const { t, i18n } = useTranslation('idleVillage');

  // Extract entry-only records from the optional config fallback.
  const configEntries = useMemo(
    () =>
      tooltipConfig
        ? {
            hudResources: tooltipConfig.hudResources?.entries || {},
            workerTraits: tooltipConfig.workerTraits?.entries || {},
            slotStatus: tooltipConfig.slotStatus?.entries || {},
          }
        : undefined,
    [tooltipConfig]
  );

  // Get tooltip content for a section and key
  const getTooltipCopy = useCallback(
    (section: TooltipSection, key: string): string => {
      const nsKey = `${section}.${key}`;
      const fallback = configEntries?.[section]?.[key] || getFallbackTooltip(key);
      const content = t(nsKey, { defaultValue: fallback }) as string;

      // Emit telemetry event when tooltip is accessed
      if (telemetryEnabled && content && content !== nsKey) {
        trackTelemetryEvent('tooltip_shown', {
          tooltipId: nsKey,
          section,
          key,
          content,
          source: telemetrySource,
          timestamp: Date.now(),
        });
      }

      return content;
    },
    [t, configEntries, telemetryEnabled, telemetrySource]
  );

  // Check if tooltip exists
  const hasTooltip = useCallback(
    (section: TooltipSection, key: string): boolean => {
      const nsKey = `${section}.${key}`;
      const lng = i18n.resolvedLanguage || i18n.language || 'en';
      if (typeof i18n.exists === 'function' && i18n.exists(nsKey, { lng })) {
        return true;
      }
      const fallback = configEntries?.[section]?.[key];
      return Boolean(fallback);
    },
    [i18n, configEntries]
  );

  // Get all tooltips for a section
  const getSectionTooltips = useCallback(
    (section: TooltipSection): Record<string, string> => {
      const fallback = configEntries?.[section] || {};
      const lng = i18n.resolvedLanguage || i18n.language || 'en';
      const bundle = i18n.getResourceBundle(lng, 'idleVillage') as
        | Record<string, unknown>
        | undefined;
      const sectionData = bundle?.[section] as Record<string, string> | undefined;
      return sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)
        ? sectionData
        : fallback;
    },
    [i18n, configEntries]
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
