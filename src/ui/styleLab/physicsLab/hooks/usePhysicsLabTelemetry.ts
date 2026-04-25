/**
 * Physics Lab Telemetry Hook
 *
 * Provides telemetry tracking for Physics Lab interactions including
 * load events, preset changes, slider adjustments, and export operations.
 * Integrates with TelemetryProvider and provides aggregation for high-frequency events.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type PhysicsLabBasePayload,
  type PhysicsLabPresetAppliedPayload,
  type PhysicsLabExportAttemptPayload,
  type PhysicsLabExportBlockedPayload,
  type PhysicsLabSliderChangePayload,
  generatePhysicsLabSessionId,
  logPhysicsLabEvent,
  createBasePayload,
  isTelemetryProviderAvailable,
} from '@/analytics/styleLab/physicsLabTelemetry';
// import { type PhysicsPreset, type PhysicsPresetId } from '@/ui/styleLab/config/physicsPresets';

/**
 * Configuration for the telemetry hook.
 */
export interface PhysicsLabTelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Aggregation window for slider changes in milliseconds */
  sliderAggregationWindowMs: number;
  /** Maximum number of slider changes to aggregate */
  maxSliderChangesPerBatch: number;
  /** Whether to log debug information */
  debug: boolean;
}

/**
 * Default configuration for the telemetry hook.
 */
export const DEFAULT_TELEMETRY_CONFIG: PhysicsLabTelemetryConfig = {
  enabled: true,
  sliderAggregationWindowMs: 1000,
  maxSliderChangesPerBatch: 10,
  debug: false,
};

/**
 * Aggregated slider change data.
 */
interface SliderChangeAggregate {
  field: string;
  values: number[];
  timestamps: number[];
  lastSent: number;
}

/**
 * Return contract for the Physics Lab telemetry hook.
 */
export interface UsePhysicsLabTelemetryReturn {
  /** Current session ID */
  sessionId: string;
  /** Record a load event */
  recordLoad: (presetId: string) => void;
  /** Record a preset application */
  recordPresetApplied: (presetId: string, previousPresetId: string, isReset?: boolean) => void;
  /** Record a slider adjustment (aggregated) */
  recordSliderChange: (field: string, value: number) => void;
  /** Record an export attempt */
  recordExportAttempt: (format: string, sizeBytes: number, success: boolean, error?: string) => void;
  /** Record an export block due to performance issues */
  recordExportBlocked: (
    reason: PhysicsLabExportBlockedPayload['reason'],
    currentFps: number,
    currentCpuMs: number,
    audioConcurrency: number,
    hapticConcurrency: number,
    durationSeconds: number
  ) => void;
  /** Get aggregated slider changes */
  getAggregatedSliderChanges: () => SliderChangeAggregate[];
  /** Flush pending aggregated events */
  flushAggregatedEvents: () => void;
}

/**
 * Physics Lab telemetry hook.
 *
 * Provides methods to record various Physics Lab events with automatic
 * session management and aggregation for high-frequency events like slider changes.
 *
 * @param config - Optional configuration overrides
 * @param presetId - Current preset ID
 * @returns Hook API for Physics Lab telemetry
 */
export function usePhysicsLabTelemetry(
  config: Partial<PhysicsLabTelemetryConfig> = {},
  presetId: string
): UsePhysicsLabTelemetryReturn {
  const finalConfig = { ...DEFAULT_TELEMETRY_CONFIG, ...config };
  const [sessionId] = useState(() => generatePhysicsLabSessionId());
  const sliderAggregatesRef = useRef<Map<string, SliderChangeAggregate>>(new Map());
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Create base payload with preset and session info.
   */
  const createPayload = useCallback((
    context: PhysicsLabBasePayload['context'] = 'unknown',
    metadata: Record<string, unknown> = {}
  ): PhysicsLabBasePayload => {
    return createBasePayload(presetId, sessionId, context, metadata);
  }, [presetId, sessionId]);

  /**
   * Record a load event when the Physics Lab app initializes.
   */
  const recordLoad = useCallback((currentPresetId: string) => {
    if (!finalConfig.enabled || !isTelemetryProviderAvailable()) return;

    const payload: PhysicsLabBasePayload = createBasePayload(
      currentPresetId,
      sessionId,
      'canvas',
      { action: 'app_loaded' }
    );

    logPhysicsLabEvent('physics_lab_loaded', payload);

    if (finalConfig.debug) {
      console.log('[PhysicsLabTelemetry] Load event recorded:', payload);
    }
  }, [finalConfig.enabled, finalConfig.debug, createPayload, sessionId]);

  /**
   * Record a preset application event.
   */
  const recordPresetApplied = useCallback((
    newPresetId: string,
    previousPresetId: string,
    isReset = false
  ) => {
    if (!finalConfig.enabled || !isTelemetryProviderAvailable()) return;

    const payload: PhysicsLabPresetAppliedPayload = {
      ...createPayload('sidebar'),
      presetId: newPresetId,
      previousPresetId,
      isReset,
    };

    logPhysicsLabEvent('physics_lab_preset_applied', payload);

    if (finalConfig.debug) {
      console.log('[PhysicsLabTelemetry] Preset applied:', payload);
    }
  }, [finalConfig.enabled, finalConfig.debug, createPayload]);

  /**
   * Flush aggregated slider changes.
   */
  const flushAggregatedEvents = useCallback(() => {
    if (!finalConfig.enabled || !isTelemetryProviderAvailable()) return;

    const now = Date.now();
    const aggregates = sliderAggregatesRef.current;

    aggregates.forEach((aggregate, field) => {
      if (aggregate.values.length === 0) return;

      const payload: PhysicsLabSliderChangePayload = {
        ...createPayload('canvas'),
        field,
        value: aggregate.values[aggregate.values.length - 1], // Latest value
        changeCount: aggregate.values.length,
        windowMs: now - aggregate.timestamps[0],
      };

      logPhysicsLabEvent('physics_lab_slider_change', payload);

      // Reset aggregate
      aggregates.set(field, {
        field,
        values: [],
        timestamps: [],
        lastSent: now,
      });
    });

    if (finalConfig.debug) {
      console.log('[PhysicsLabTelemetry] Flushed aggregated slider changes');
    }
  }, [finalConfig.enabled, finalConfig.debug, createPayload]);

  /**
   * Record a slider change with aggregation.
   */
  const recordSliderChange = useCallback((field: string, value: number) => {
    if (!finalConfig.enabled) return;

    const now = Date.now();
    const aggregates = sliderAggregatesRef.current;
    
    // Get or create aggregate for this field
    let aggregate = aggregates.get(field);
    if (!aggregate) {
      aggregate = {
        field,
        values: [],
        timestamps: [],
        lastSent: 0,
      };
      aggregates.set(field, aggregate);
    }

    // Add new change
    aggregate.values.push(value);
    aggregate.timestamps.push(now);

    // Check if we should flush due to limits
    if (aggregate.values.length >= finalConfig.maxSliderChangesPerBatch) {
      flushAggregatedEvents();
    } else {
      // Set up timeout to flush after aggregation window
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      
      flushTimeoutRef.current = setTimeout(() => {
        flushAggregatedEvents();
      }, finalConfig.sliderAggregationWindowMs);
    }

    if (finalConfig.debug) {
      console.log('[PhysicsLabTelemetry] Slider change aggregated:', { field, value });
    }
  }, [finalConfig.enabled, finalConfig.maxSliderChangesPerBatch, finalConfig.sliderAggregationWindowMs, finalConfig.debug, flushAggregatedEvents]);

  /**
   * Record an export attempt.
   */
  const recordExportAttempt = useCallback((
    format: string,
    sizeBytes: number,
    success: boolean,
    error?: string
  ) => {
    if (!finalConfig.enabled || !isTelemetryProviderAvailable()) return;

    const payload: PhysicsLabExportAttemptPayload = {
      ...createPayload('sidebar'),
      format: format as any, // Cast to enum type
      sizeBytes,
      success,
      error,
    };

    logPhysicsLabEvent('physics_lab_export_attempt', payload);

    if (finalConfig.debug) {
      console.log('[PhysicsLabTelemetry] Export attempt recorded:', payload);
    }
  }, [finalConfig.enabled, finalConfig.debug, createPayload]);

  /**
   * Record an export block due to performance issues.
   */
  const recordExportBlocked = useCallback((
    reason: PhysicsLabExportBlockedPayload['reason'],
    currentFps: number,
    currentCpuMs: number,
    audioConcurrency: number,
    hapticConcurrency: number,
    durationSeconds: number
  ) => {
    if (!finalConfig.enabled || !isTelemetryProviderAvailable()) return;

    const payload: PhysicsLabExportBlockedPayload = {
      ...createPayload('hud'),
      reason,
      currentFps,
      currentCpuMs,
      audioConcurrency,
      hapticConcurrency,
      durationSeconds,
    };

    logPhysicsLabEvent('physics_lab_export_blocked', payload);

    if (finalConfig.debug) {
      console.log('[PhysicsLabTelemetry] Export blocked recorded:', payload);
    }
  }, [finalConfig.enabled, finalConfig.debug, createPayload]);

  /**
   * Get current aggregated slider changes.
   */
  const getAggregatedSliderChanges = useCallback((): SliderChangeAggregate[] => {
    return Array.from(sliderAggregatesRef.current.values());
  }, []);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushAggregatedEvents();
    };
  }, [flushAggregatedEvents]);

  return {
    sessionId,
    recordLoad,
    recordPresetApplied,
    recordSliderChange,
    recordExportAttempt,
    recordExportBlocked,
    getAggregatedSliderChanges,
    flushAggregatedEvents,
  };
}
