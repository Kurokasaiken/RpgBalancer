/**
 * Quest Risk Telemetry Utilities
 * 
 * Provides telemetry emission and subscription utilities for quest risk display.
 * Integrates with the existing quest telemetry system to log risk rendering events.
 * 
 * @since IV-QuestRisk-stripes
 */

import { useCallback } from 'react';
import { useQuestTelemetryEmitter } from '@/ui/idleVillage/hooks/useQuestTelemetry';

/**
 * Payload for quest risk rendered telemetry events.
 */
export interface QuestRiskRenderedPayload {
  /** Unique identifier for the quest */
  questId: string;
  /** Injury risk percentage (0-100) */
  injuryPercentage: number;
  /** Death risk percentage (0-100) */
  deathPercentage: number;
  /** Calculated stripe heights in pixels */
  stripeHeights: {
    injuryHeightPx: number;
    deathHeightPx: number;
  };
  /** Whether stripes are shown (based on configuration) */
  showStripes: boolean;
  /** Configuration source used */
  configSource: 'default' | 'test' | 'custom';
  /** Rendering timestamp */
  timestamp: number;
}

/**
 * Hook for emitting quest risk telemetry events.
 * 
 * Provides a convenient interface for emitting quest_risk_rendered events
 * with proper payload structure and timestamping.
 * 
 * @returns Object with emitRiskRendered function
 */
export function useQuestRiskTelemetry() {
  const { emitTelemetryEvent } = useQuestTelemetryEmitter<QuestRiskRenderedPayload>();

  /**
   * Emit a quest risk rendered telemetry event.
   * 
   * @param payload - Risk rendering data
   */
  const emitRiskRendered = useCallback((payload: Omit<QuestRiskRenderedPayload, 'timestamp'>) => {
    const fullPayload: QuestRiskRenderedPayload = {
      ...payload,
      timestamp: Date.now(),
    };

    emitTelemetryEvent('quest_risk_rendered', fullPayload);
  }, [emitTelemetryEvent]);

  /**
   * Emit a quest risk stripe clicked telemetry event.
   * 
   * @param questId - Quest identifier
   * @param stripeType - Type of stripe clicked
   * @param percentage - Risk percentage
   */
  const emitStripeClicked = useCallback((
    questId: string,
    stripeType: 'injury' | 'death',
    percentage: number
  ) => {
    emitTelemetryEvent('quest_risk_stripe_clicked', {
      questId,
      stripeType,
      percentage,
      timestamp: Date.now(),
    });
  }, [emitTelemetryEvent]);

  return {
    emitRiskRendered,
    emitStripeClicked,
  };
}

/**
 * Type for quest risk telemetry event subscriptions.
 */
export type QuestRiskTelemetryEvent = 
  | { eventType: 'quest_risk_rendered'; data: QuestRiskRenderedPayload }
  | { 
      eventType: 'quest_risk_stripe_clicked'; 
      data: { 
        questId: string; 
        stripeType: 'injury' | 'death'; 
        percentage: number; 
        timestamp: number; 
      }; 
    };

/**
 * Hook for subscribing to quest risk telemetry events.
 * 
 * @param callback - Function to handle telemetry events
 * @returns Object with subscribe function
 */
export function useQuestRiskTelemetrySubscription(
  callback: (event: QuestRiskTelemetryEvent) => void
) {
  const subscribe = useCallback(() => {
    const handler = (event: CustomEvent<QuestRiskTelemetryEvent>) => callback(event.detail);

    window.addEventListener('quest-telemetry', handler as EventListener);

    return () => {
      window.removeEventListener('quest-telemetry', handler as EventListener);
    };
  }, [callback]);

  return { subscribe };
}

/**
 * Utility function to create a risk telemetry payload from component data.
 * 
 * @param questId - Quest identifier
 * @param injuryPercentage - Injury risk percentage
 * @param deathPercentage - Death risk percentage
 * @param stripeHeights - Calculated stripe heights
 * @param showStripes - Whether stripes are shown
 * @param configSource - Configuration source
 * @returns Complete telemetry payload
 */
export function createRiskTelemetryPayload(
  questId: string,
  injuryPercentage: number,
  deathPercentage: number,
  stripeHeights: { injuryHeightPx: number; deathHeightPx: number },
  showStripes: boolean,
  configSource: 'default' | 'test' | 'custom'
): Omit<QuestRiskRenderedPayload, 'timestamp'> {
  return {
    questId,
    injuryPercentage,
    deathPercentage,
    stripeHeights,
    showStripes,
    configSource,
  };
}

/**
 * Default export for convenience.
 */
export default useQuestRiskTelemetry;
