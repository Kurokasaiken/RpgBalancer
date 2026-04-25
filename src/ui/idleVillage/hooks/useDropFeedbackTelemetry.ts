/**
 * Drop Feedback Telemetry Hook
 *
 * Integrates telemetry events for drop feedback operations.
 * Tracks validation results, feedback types, and user interactions.
 */

import { useCallback, useRef } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { DropFeedbackType } from '@/ui/idleVillage/config/dropFeedbackConfig';

/**
 * Telemetry event payload for drop feedback operations.
 */
export interface DropFeedbackTelemetryEvent {
  /** Event type */
  type: 'drop_feedback_validation' | 'drop_feedback_shown' | 'drop_feedback_hidden';
  /** Timestamp */
  timestamp: number;
  /** Source component */
  source: string;
  /** Resident ID being dragged */
  residentId?: string;
  /** Activity ID being dropped on */
  activityId?: string;
  /** Feedback type shown */
  feedbackType?: DropFeedbackType;
  /** Whether validation passed */
  isValid?: boolean;
  /** Validation reason/message */
  reason?: string;
  /** Time taken for validation (ms) */
  validationTimeMs?: number;
}

/**
 * Parameters for the useDropFeedbackTelemetry hook.
 */
export interface UseDropFeedbackTelemetryParams {
  /** Component source identifier */
  source: string;
  /** Whether to enable telemetry */
  enabled?: boolean;
}

/**
 * Return value for the useDropFeedbackTelemetry hook.
 */
export interface UseDropFeedbackTelemetryReturn {
  /** Track a drop validation event */
  trackValidation: (params: {
    residentId: string;
    activityId: string;
    isValid: boolean;
    reason?: string;
    validationTimeMs?: number;
  }) => void;
  /** Track feedback shown event */
  trackFeedbackShown: (params: {
    feedbackType: DropFeedbackType;
    residentId?: string;
    activityId?: string;
  }) => void;
  /** Track feedback hidden event */
  trackFeedbackHidden: () => void;
}

/**
 * Hook for drop feedback telemetry.
 */
export function useDropFeedbackTelemetry({
  source,
  enabled = true,
}: UseDropFeedbackTelemetryParams): UseDropFeedbackTelemetryReturn {
  const lastValidationRef = useRef<string | null>(null);

  const trackValidation = useCallback(
    ({ residentId, activityId, isValid, reason, validationTimeMs }: {
      residentId: string;
      activityId: string;
      isValid: boolean;
      reason?: string;
      validationTimeMs?: number;
    }) => {
      if (!enabled) return;

      const validationKey = `${residentId}-${activityId}`;
      
      // Avoid duplicate validation events
      if (lastValidationRef.current === validationKey) {
        return;
      }
      lastValidationRef.current = validationKey;

      const event: DropFeedbackTelemetryEvent = {
        type: 'drop_feedback_validation',
        timestamp: Date.now(),
        source,
        residentId,
        activityId,
        isValid,
        reason,
        validationTimeMs,
      };

      trackTelemetryEvent('drop_feedback_validation', event as unknown as Record<string, unknown>);
    },
    [enabled, source]
  );

  const trackFeedbackShown = useCallback(
    ({ feedbackType, residentId, activityId }: {
      feedbackType: DropFeedbackType;
      residentId?: string;
      activityId?: string;
    }) => {
      if (!enabled) return;

      const event: DropFeedbackTelemetryEvent = {
        type: 'drop_feedback_shown',
        timestamp: Date.now(),
        source,
        residentId,
        activityId,
        feedbackType,
      };

      trackTelemetryEvent('drop_feedback_shown', event as unknown as Record<string, unknown>);
    },
    [enabled, source]
  );

  const trackFeedbackHidden = useCallback(() => {
    if (!enabled) return;

      const event: DropFeedbackTelemetryEvent = {
        type: 'drop_feedback_hidden',
        timestamp: Date.now(),
        source,
      };

      trackTelemetryEvent('drop_feedback_hidden', event as unknown as Record<string, unknown>);
    }, [enabled, source]);

  return {
    trackValidation,
    trackFeedbackShown,
    trackFeedbackHidden,
  };
}
