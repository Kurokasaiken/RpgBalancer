/**
 * Stress Testing Analytics
 * 
 * Telemetry tracking for stress testing operations including
 * stat profile visualization, marginal utility analysis, and
 * synergy heatmap interactions.
 * 
 * @module stressTesting
 * @since 2026-01-14
 * @author Lyra-Visuals
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

// Create diagnostics instance for stress testing
const diagnostics = createHeadlessDiagnostics('stress-testing');

/**
 * Stress testing telemetry event types
 */
export type StressTestingEventType = 
  | 'stat_profile_viewed'
  | 'stat_profile_selected'
  | 'stat_profile_exported'
  | 'stat_profile_refreshed'
  | 'marginal_utility_calculated'
  | 'synergy_heatmap_viewed'
  | 'synergy_cell_selected'
  | 'stress_test_started'
  | 'stress_test_completed'
  | 'stress_test_cancelled'
  | 'stress_test_failed';

/**
 * Base telemetry payload for stress testing events
 */
export interface StressTestingTelemetryPayload {
  /** Event timestamp */
  timestamp: number;
  /** Session identifier */
  sessionId?: string;
  /** User identifier (if available) */
  userId?: string;
  /** Additional event-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Stat profile viewed event payload
 */
export interface StatProfileViewedPayload extends StressTestingTelemetryPayload {
  /** Number of stat profiles displayed */
  profileCount: number;
  /** Maximum value for radar scale */
  maxValue: number;
  /** Whether a stat is currently selected */
  hasSelection: boolean;
  /** Whether auto-tuning is enabled */
  autoTuneEnabled: boolean;
}

/**
 * Stat profile selected event payload
 */
export interface StatProfileSelectedPayload extends StressTestingTelemetryPayload {
  /** Selected stat identifier */
  statId: string;
  /** Stat display name */
  displayName: string;
  /** Stat value */
  value: number;
  /** Performance tier */
  tier: 'excellent' | 'good' | 'average' | 'poor';
  /** Marginal utility value if available */
  marginalUtility?: number;
  /** Synergy multiplier if available */
  synergyMultiplier?: number;
}

/**
 * Stat profile exported event payload
 */
export interface StatProfileExportedPayload extends StressTestingTelemetryPayload {
  /** Number of stat profiles exported */
  profileCount: number;
  /** Whether a stat was selected */
  hasSelection: boolean;
  /** Maximum value used for scaling */
  maxValue: number;
}

/**
 * Stress test started event payload
 */
export interface StressTestStartedPayload extends StressTestingTelemetryPayload {
  /** Test configuration */
  config: {
    iterations: number;
    statCount: number;
    seed: number;
    testType: 'single' | 'pair' | 'comprehensive';
  };
}

/**
 * Stress test completed event payload
 */
export interface StressTestCompletedPayload extends StressTestingTelemetryPayload {
  /** Test results summary */
  results: {
    totalArchetypes: number;
    totalSimulations: number;
    runtimeMs: number;
    successRate: number;
    averageSynergyMultiplier: number;
  };
}

/**
 * Track stress testing telemetry event
 */
export function trackStressTestEvent<T extends StressTestingEventType>(
  eventType: T,
  payload: T extends 'stat_profile_viewed' ? StatProfileViewedPayload :
    T extends 'stat_profile_selected' ? StatProfileSelectedPayload :
    T extends 'stat_profile_exported' ? StatProfileExportedPayload :
    T extends 'stress_test_started' ? StressTestStartedPayload :
    T extends 'stress_test_completed' ? StressTestCompletedPayload :
    StressTestingTelemetryPayload
): void {
  const enrichedPayload = {
    ...payload,
    timestamp: payload.timestamp || Date.now(),
  };

  // Log via sandbox diagnostics (always enabled for stress testing)
  diagnostics.info(`Stress testing event: ${eventType}`, enrichedPayload, [
    'stress-testing',
    eventType,
  ]);

  // Store in global telemetry window object if available
  if (typeof window !== 'undefined') {
    const globalKey = '__stressTestingEvents';
    if (!(window as any)[globalKey]) {
      (window as any)[globalKey] = [];
    }
    (window as any)[globalKey].push({
      type: eventType,
      payload: enrichedPayload,
      timestamp: Date.now(),
    });

    // Keep only last 100 events to prevent memory issues
    const events = (window as any)[globalKey];
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
  }
}

/**
 * Get recent stress testing events
 */
export function getStressTestingEvents(limit = 50): Array<{
  type: StressTestingEventType;
  payload: StressTestingTelemetryPayload;
  timestamp: number;
}> {
  if (typeof window === 'undefined') return [];
  
  const events = (window as any).__stressTestingEvents || [];
  return events.slice(-limit);
}

/**
 * Clear stress testing events
 */
export function clearStressTestingEvents(): void {
  if (typeof window !== 'undefined') {
    (window as any).__stressTestingEvents = [];
  }
}

/**
 * Export stress testing telemetry data
 */
export function exportStressTestingTelemetry(): string {
  const events = getStressTestingEvents();
  const exportData = {
    exportedAt: Date.now(),
    eventCount: events.length,
    events,
  };
  
  return JSON.stringify(exportData, null, 2);
}
