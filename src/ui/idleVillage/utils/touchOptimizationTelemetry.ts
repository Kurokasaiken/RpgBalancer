/**
 * Touch Optimization Telemetry Utilities
 * 
 * Telemetry event tracking for touch optimization metrics and user interactions.
 * 
 * @since NP-064 – Idle Village Interaction Touch Optimizer
 */

import type { TouchOptimizerConfig, TouchEventData } from '@/ui/idleVillage/hooks/useSandboxTouchOptimizer';

/**
 * Touch optimization telemetry event types
 */
export type TouchOptimizationEventType = 
  | 'config_updated'
  | 'config_reset'
  | 'haptic_triggered'
  | 'touch_event_recorded'
  | 'optimizations_applied'
  | 'optimizations_removed'
  | 'device_capabilities_detected';

/**
 * Touch optimization telemetry payload
 */
export interface TouchOptimizationTelemetryPayload {
  /** Event type */
  eventType: TouchOptimizationEventType;
  /** Timestamp */
  timestamp: number;
  /** Interaction mode */
  interactionMode: 'desktop' | 'mobile';
  /** Is mobile device */
  isMobile: boolean;
  /** Configuration snapshot */
  config?: TouchOptimizerConfig;
  /** Touch event data */
  touchEvent?: TouchEventData;
  /** Haptic feedback details */
  hapticDetails?: {
    type: 'light' | 'medium' | 'heavy';
    duration: number;
    intensity: number;
  };
  /** Device capabilities */
  deviceCapabilities?: {
    supportsHaptics: boolean;
    supportsMomentum: boolean;
    maxTouchPoints: number;
    touchType: 'capacitive' | 'resistive' | 'unknown';
  };
  /** Performance metrics */
  performanceMetrics?: {
    optimizationApplicationTime: number;
    cssPropertyUpdateTime: number;
  };
}

/**
 * Record touch optimization telemetry event
 */
export function recordTouchOptimizationEvent(
  eventType: TouchOptimizationEventType,
  payload: Omit<TouchOptimizationTelemetryPayload, 'eventType' | 'timestamp'>
): void {
  const telemetryPayload: TouchOptimizationTelemetryPayload = {
    eventType,
    timestamp: Date.now(),
    ...payload,
  };

  // Route to appropriate telemetry channel
  if (typeof window !== 'undefined' && (window as any).telemetryBuffer) {
    (window as any).telemetryBuffer.push({
      event: 'idle_village_touch_optimization',
      payload: telemetryPayload,
      timestamp: Date.now(),
    });
  }

  // Console logging for development
  if (import.meta.env?.MODE === 'development') {
    console.log(`📱 Touch Optimization Telemetry: ${eventType}`, telemetryPayload);
  }
}

/**
 * Batch record multiple touch events
 */
export function batchRecordTouchEvents(events: TouchEventData[]): void {
  events.forEach(event => {
    recordTouchOptimizationEvent('touch_event_recorded', {
      touchEvent: event,
      interactionMode: 'mobile', // Assume mobile for batch events
      isMobile: true,
    });
  });
}

/**
 * Record performance metrics for optimization application
 */
export function recordOptimizationPerformance(
  optimizationTime: number,
  cssUpdateTime: number,
  interactionMode: 'desktop' | 'mobile',
  isMobile: boolean
): void {
  recordTouchOptimizationEvent('optimizations_applied', {
    interactionMode,
    isMobile,
    performanceMetrics: {
      optimizationApplicationTime: optimizationTime,
      cssPropertyUpdateTime: cssUpdateTime,
    },
  });
}

/**
 * Create touch optimization session summary
 */
export function createTouchOptimizationSessionSummary(
  totalEvents: number,
  averageLongPressDuration: number,
  hapticFeedbackCount: number,
  errorRate: number,
  interactionMode: 'desktop' | 'mobile',
  isMobile: boolean
): void {
  recordTouchOptimizationEvent('optimizations_applied', {
    interactionMode,
    isMobile,
    performanceMetrics: {
      optimizationApplicationTime: totalEvents,
      cssPropertyUpdateTime: averageLongPressDuration,
    },
  });
}
