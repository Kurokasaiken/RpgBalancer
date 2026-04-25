/**
 * Drop Feedback Telemetry Utilities for Idle Village Phase E
 * 
 * Provides telemetry emission and subscription utilities for drop feedback events.
 * Integrates with the existing quest telemetry system to log feedback
 * display events with proper payload structure.
 * 
 * @since IV-PhaseE-drop-feedback
 */

import { useCallback } from 'react';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Payload for drop feedback telemetry events.
 */
export interface DropFeedbackTelemetryPayload {
  /** Type of feedback shown */
  feedbackType: 'valid' | 'invalid' | 'warning' | 'blocked';
  /** Validation rule that triggered the feedback */
  validationRule?: string;
  /** Resident ID being dragged */
  residentId?: string;
  /** Activity ID being dropped on */
  activityId?: string;
  /** Context of the drop operation */
  context?: string;
  /** Whether the feedback was interactive (user saw it) */
  interactive: boolean;
  /** Timestamp of the feedback event */
  timestamp: number;
  /** Additional metadata */
  metadata?: {
    /** Feedback message shown */
    message?: string;
    /** Duration feedback was visible (ms) */
    duration?: number;
    /** Position of feedback element */
    position?: {
      x: number;
      y: number;
    };
  };
}

/**
 * Hook for emitting drop feedback telemetry events.
 * 
 * Provides a convenient interface for emitting drop_feedback_shown events
 * with proper payload structure and timestamping.
 * 
 * @returns Object with emitFeedbackShown function
 */
export function useDropFeedbackTelemetry() {
  const diagnostics = createSandboxDiagnostics('drop-feedback-telemetry');

  /**
   * Emit a drop feedback shown telemetry event.
   * 
   * @param payload - Feedback telemetry data
   */
  const emitFeedbackShown = useCallback((payload: Omit<DropFeedbackTelemetryPayload, 'timestamp'>) => {
    const fullPayload: DropFeedbackTelemetryPayload = {
      ...payload,
      timestamp: Date.now(),
    };

    diagnostics.info('drop_feedback_shown', fullPayload);
  }, [diagnostics]);

  /**
   * Emit a drop feedback clicked telemetry event.
   * 
   * @param feedbackType - Type of feedback clicked
   * @param context - Context of the click
   * @param metadata - Additional metadata
   */
  const emitFeedbackClicked = useCallback((
    feedbackType: string,
    context?: string,
    metadata?: Record<string, unknown>
  ) => {
    diagnostics.info('drop_feedback_clicked', {
      feedbackType,
      context,
      metadata,
      timestamp: Date.now(),
    });
  }, [diagnostics]);

  /**
   * Emit a drop feedback dismissed telemetry event.
   * 
   * @param feedbackType - Type of feedback dismissed
   * @param context - Context of the dismissal
   * @param duration - Duration feedback was visible (ms)
   */
  const emitFeedbackDismissed = useCallback((
    feedbackType: string,
    context?: string,
    duration?: number
  ) => {
    diagnostics.info('drop_feedback_dismissed', {
      feedbackType,
      context,
      duration,
      timestamp: Date.now(),
    });
  }, [diagnostics]);

  return {
    emitFeedbackShown,
    emitFeedbackClicked,
    emitFeedbackDismissed,
  };
}

/**
 * Type for drop feedback telemetry event subscriptions.
 */
export type DropFeedbackTelemetryEvent = 
  | { eventType: 'drop_feedback_shown'; data: DropFeedbackTelemetryPayload }
  | { 
      eventType: 'drop_feedback_clicked'; 
      data: { 
        feedbackType: string; 
        context?: string; 
        metadata?: Record<string, unknown>; 
        timestamp: number; 
      }; 
    }
  | { 
      eventType: 'drop_feedback_dismissed'; 
      data: { 
        feedbackType: string; 
        context?: string; 
        duration?: number; 
        timestamp: number; 
      }; 
    };

/**
 * Hook for subscribing to drop feedback telemetry events.
 * 
 * @param callback - Function to handle telemetry events
 * @returns Object with subscribe function
 */
export function useDropFeedbackTelemetrySubscription(
  callback: (event: DropFeedbackTelemetryEvent) => void
) {
  const subscribe = useCallback(() => {
    const handler = (event: CustomEvent<DropFeedbackTelemetryEvent>) => callback(event.detail);

    window.addEventListener('drop-feedback-telemetry', handler as EventListener);

    return () => {
      window.removeEventListener('drop-feedback-telemetry', handler as EventListener);
    };
  }, [callback]);

  return { subscribe };
}

/**
 * Utility function to create a drop feedback telemetry payload from component data.
 * 
 * @param feedbackType - Type of feedback shown
 * @param validationRule - Validation rule that triggered feedback
 * @param residentId - Resident ID involved
 * @param activityId - Activity ID involved
 * @param context - Context of the operation
 * @param interactive - Whether feedback was interactive
 * @param message - Feedback message shown
 * @returns Complete telemetry payload
 */
export function createDropFeedbackTelemetryPayload(
  feedbackType: 'valid' | 'invalid' | 'warning' | 'blocked',
  validationRule?: string,
  residentId?: string,
  activityId?: string,
  context?: string,
  interactive: boolean = false,
  message?: string
): Omit<DropFeedbackTelemetryPayload, 'timestamp'> {
  return {
    feedbackType,
    validationRule,
    residentId,
    activityId,
    context,
    interactive,
    metadata: {
      message,
    },
  };
}

/**
 * Utility function to dispatch drop feedback telemetry events.
 * 
 * @param eventType - Type of telemetry event
 * @param data - Event data payload
 */
export function dispatchDropFeedbackTelemetry(
  eventType: string,
  data: Record<string, unknown>
) {
  const event = new CustomEvent('drop-feedback-telemetry', {
    detail: {
      eventType,
      data,
      timestamp: Date.now(),
    },
  });

  window.dispatchEvent(event);
}

/**
 * Default export for convenience.
 */
export default useDropFeedbackTelemetry;
