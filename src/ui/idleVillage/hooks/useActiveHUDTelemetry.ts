import { useEffect, useRef, useCallback } from 'react';
import { reportActiveHUDEvent, type ActiveHUDTelemetryEventType, type ActiveHUDTelemetryEventPayload } from '@/analytics/telemetry/telemetryProvider';
import type { ActiveHUDState } from './useActiveHUDState';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';

/**
 * Props for useActiveHUDTelemetry hook.
 */
export interface UseActiveHUDTelemetryProps {
  /** Active HUD state to monitor */
  hudState?: ActiveHUDState;
  /** Legacy active slots for backwards compatibility */
  activeSlots?: { slot: ActivitySlotData; state: ScheduledActivityState }[];
  /** Full village state for context */
  villageState?: VillageState;
  /** HUD variant being used */
  variant?: 'default' | 'compact';
  /** Maximum visible activities (if clamped) */
  maxVisible?: number;
  /** Whether telemetry is enabled */
  enabled?: boolean;
}

/**
 * Hook that instruments Active HUD with telemetry events for render,
 * interactions, and notifications. Emits events to analytics system
 * and provides performance monitoring.
 * 
 * Events emitted:
 * - `hud_rendered`: When HUD renders with activity data
 * - `hud_card_selected`: When user clicks on an activity card
 * - `hud_notification_action`: When notification actions occur
 * - `hud_overflow_shown`: When overflow indicator is displayed
 * - `hud_empty_state`: When HUD shows no activities
 * - `hud_variant_changed`: When HUD variant changes
 * 
 * @param props - Telemetry configuration
 */
export function useActiveHUDTelemetry(props: UseActiveHUDTelemetryProps): void {
  const { 
    hudState, 
    activeSlots, 
    villageState, 
    variant = 'default', 
    maxVisible, 
    enabled = true 
  } = props;

  // Track previous variant to detect changes
  const prevVariantRef = useRef<'default' | 'compact' | null>(null);
  
  // Track previous activity count to detect changes
  const prevActivityCountRef = useRef<number>(0);

  /**
   * Emits a telemetry event with proper payload.
   */
  const emitEvent = useCallback((
    eventType: ActiveHUDTelemetryEventType,
    additionalPayload?: Partial<ActiveHUDTelemetryEventPayload>
  ) => {
    if (!enabled) return;

    const activityCount = hudState 
      ? hudState.activities.length 
      : (activeSlots?.length ?? 0);

    const hasOverflow = typeof maxVisible === 'number' 
      ? activityCount > maxVisible 
      : false;

    const payload: ActiveHUDTelemetryEventPayload = {
      variant,
      activityCount,
      maxVisible,
      hasOverflow,
      timestamp: Date.now(),
      ...additionalPayload,
    };

    reportActiveHUDEvent({ eventType, data: payload });
  }, [enabled, hudState, activeSlots, variant, maxVisible]);

  // Emit render event when HUD state or activities change
  useEffect(() => {
    if (!enabled) return;

    const activityCount = hudState 
      ? hudState.activities.length 
      : (activeSlots?.length ?? 0);

    // Emit render event
    if (activityCount === 0) {
      emitEvent('hud_empty_state');
    } else {
      emitEvent('hud_rendered');
    }

    // Detect overflow
    const hasOverflow = typeof maxVisible === 'number' 
      ? activityCount > maxVisible 
      : false;
    
    if (hasOverflow) {
      emitEvent('hud_overflow_shown');
    }

    // Detect variant changes
    if (prevVariantRef.current !== null && prevVariantRef.current !== variant) {
      emitEvent('hud_variant_changed', {
        metadata: { previousVariant: prevVariantRef.current }
      });
    }

    // Update refs
    prevVariantRef.current = variant;
    prevActivityCountRef.current = activityCount;

  }, [enabled, hudState, activeSlots, variant, maxVisible, emitEvent]);

  /**
   * Handler for activity card selection/click.
   */
  const handleCardSelection = useCallback((activityKey: string, activityType?: string, residentName?: string) => {
    emitEvent('hud_card_selected', {
      activityKey,
      activityType,
      residentName,
    });
  }, [emitEvent]);

  /**
   * Handler for notification actions.
   */
  const handleNotificationAction = useCallback((action: string, metadata?: Record<string, unknown>) => {
    emitEvent('hud_notification_action', {
      metadata: { action, ...metadata }
    });
  }, [emitEvent]);

  // Expose handlers for component integration
  useEffect(() => {
    if (!enabled) return;

    // Attach handlers to window for component access
    (window as any).__activeHUDHandlers = {
      handleCardSelection,
      handleNotificationAction,
    };

    return () => {
      delete (window as any).__activeHUDHandlers;
    };
  }, [enabled, handleCardSelection, handleNotificationAction]);
}

/**
 * Global interface for window handlers.
 */
declare global {
  interface Window {
    __activeHUDHandlers?: {
      handleCardSelection: (activityKey: string, activityType?: string, residentName?: string) => void;
      handleNotificationAction: (action: string, metadata?: Record<string, unknown>) => void;
    };
  }
}
