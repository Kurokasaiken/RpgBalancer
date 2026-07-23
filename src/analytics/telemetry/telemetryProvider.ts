import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const landingDiagnostics = createHeadlessDiagnostics('PunchClubLanding');
const stsDiagnostics = createHeadlessDiagnostics('STSCombatMetrics');
const stressDiagnostics = createHeadlessDiagnostics('StressTestTelemetry');
const sessionDiagnostics = createHeadlessDiagnostics('STSSessionPersistence');
const slottedMedalDiagnostics = createHeadlessDiagnostics('SlottedMedal');
const modifierDiagnostics = createHeadlessDiagnostics('ModifierTelemetry');

/**
 * Events emitted by the Punch Club landing analytics helper.
 */
export type PunchClubLandingEvent = 'landing_view' | 'cta_click' | 'opt_out' | 'consent_accepted' | 'shared_link_accessed' | 'session_started' | 'launch_click' | 'redirect_completed';

/**
 * Events emitted by stress test telemetry system.
 */
export type StressTestTelemetryEvent = 'stress_run_completed' | 'stress_run_failed' | 'stress_batch_completed';

/**
 * Events emitted by PWA installation tracking system.
 */
export type PWATelemetryEvent = 
  | 'pwa_install_prompt_available'
  | 'pwa_install_prompt_shown'
  | 'pwa_install_success'
  | 'pwa_install_dismissed'
  | 'pwa_install_error'
  | 'pwa_cold_start'
  | 'pwa_update_available'
  | 'pwa_update_applied';

/**
 * Events emitted by Slotted Medal interactions.
 */
export type SlottedMedalEvent = 
  | 'slot_medal_dropped'
  | 'slot_medal_detached'
  | 'slot_medal_completed'
  | 'slot_medal_resist_started'
  | 'slot_medal_resist_cancelled';

/**
 * Events emitted by the gameplay modifier telemetry pipeline.
 */
export type ModifierTelemetryEvent =
  | 'modifier_applied'
  | 'modifier_removed'
  | 'modifier_stack_changed'
  | 'modifier_evaluated';

/**
 * Payload attached to analytics events. The shape is intentionally open-ended
 * so we can enrich it with new KPI fields without changing the contract.
 */
export interface PunchClubLandingEventPayload {
  [key: string]: unknown;
}

/**
 * Payload for stress test telemetry events.
 */
export interface StressTestTelemetryEventPayload {
  /** Unique identifier for the stress test run */
  runId: string;
  /** Archetype identifier used in the test */
  archetypeId: string;
  /** Stat pair being tested (e.g., "hp+damage" or "single-hp") */
  statPair: string;
  /** Win rate percentage from simulation */
  winRate: number;
  /** Synergy multiplier calculated */
  synergyMultiplier: number;
  /** Number of simulation iterations */
  iterations: number;
  /** Random seed used for deterministic results */
  seed: number;
  /** Total simulation duration in milliseconds */
  durationMs?: number;
  /** Test configuration parameters */
  config?: {
    pointsPerWeight: number;
    simulationCount: number;
    baselineStats: Record<string, number>;
  };
  /** Error details if run failed */
  error?: {
    message: string;
    stack?: string;
  };
  /** Batch information for batch runs */
  batchInfo?: {
    batchId: string;
    totalRuns: number;
    currentRun: number;
  };
}

/**
 * Payload for PWA telemetry events.
 */
export interface PWATelemetryEventPayload {
  /** Event timestamp */
  timestamp: number;
  /** User agent information */
  userAgent: string;
  /** Platform information */
  platform?: string;
  /** Install prompt shown flag */
  promptShown?: boolean;
  /** Error message if any */
  error?: string;
  /** Cold start timing breakdown */
  coldStartMetrics?: {
    swActivationTime: number;
    firstPaintTime: number;
    totalTime: number;
  };
  /** Update version information */
  updateInfo?: {
    oldVersion: string;
    newVersion: string;
  };
}

/**
 * Payload for Slotted Medal telemetry events.
 */
export interface SlottedMedalEventPayload {
  /** Event timestamp */
  timestamp: number;
  /** Slot identifier */
  slotId: string;
  /** Resident identifier */
  residentId?: string;
  /** Medal type identifier */
  medalType?: string;
  /** Current slot state */
  slotState?: 'empty' | 'landing' | 'idle' | 'active' | 'locked' | 'unlocking';
  /** Progress percentage (0-1) for active slots */
  progress?: number;
  /** Resistance progress (0-1) when holding to detach */
  resistProgress?: number;
  /** Interaction duration in milliseconds */
  durationMs?: number;
  /** Error details if event failed */
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Payload attached to modifier telemetry events.
 */
export interface ModifierTelemetryEventPayload {
  /** Modifier identifier */
  modifierId: string;
  /** Target stat identifier */
  statId: string;
  /** Modifier scope */
  scope: string;
  /** Modifier operation */
  operation: string;
  /** Modifier value */
  value: number;
  /** Current stack count */
  stackCount?: number;
  /** Maximum allowed stacks */
  maxStacks?: number;
  /** Modifier owner metadata */
  owner?: { type: string; id: string; label: string };
  /** Source config or preset identifier */
  sourceConfigId?: string;
  /** Event timestamp */
  timestamp?: string;
  /** Removal or evaluation reason */
  reason?: string;
  /** Previous stack count for stack change events */
  previousStackCount?: number;
  /** New stack count for stack change events */
  newStackCount?: number;
  /** Optional numeric delta */
  delta?: number;
  /** Additional context (resident, quest, location) */
  context?: Record<string, unknown>;
  /** Error details if event failed */
  error?: {
    message: string;
    code?: string;
  };
}

interface PunchClubLandingAnalyticsEntry {
  event: PunchClubLandingEvent;
  payload?: PunchClubLandingEventPayload;
  timestamp: number;
}

interface StressTestTelemetryAnalyticsEntry {
  event: StressTestTelemetryEvent;
  payload?: StressTestTelemetryEventPayload;
  timestamp: number;
}

interface PWATelemetryAnalyticsEntry {
  event: PWATelemetryEvent;
  payload?: PWATelemetryEventPayload;
  timestamp: number;
}

interface SlottedMedalAnalyticsEntry {
  event: SlottedMedalEvent;
  payload?: SlottedMedalEventPayload;
  timestamp: number;
}

interface ModifierTelemetryAnalyticsEntry {
  event: ModifierTelemetryEvent;
  payload?: ModifierTelemetryEventPayload;
  timestamp: number;
}

/**
 * Generic analytics entry interface for general analytics events
 */
export interface AnalyticsEntry {
  event: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

declare global {
  interface Window {
    __analyticsEvents?: PunchClubLandingAnalyticsEntry[];
    __stressTestTelemetryEvents?: StressTestTelemetryAnalyticsEntry[];
    __pwaTelemetryEvents?: PWATelemetryAnalyticsEntry[];
    __slottedMedalEvents?: SlottedMedalAnalyticsEntry[];
    __modifierTelemetryEvents?: ModifierTelemetryAnalyticsEntry[];
  }
}

const pushAnalyticsEntry = (entry: PunchClubLandingAnalyticsEntry): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray(window.__analyticsEvents)) {
    window.__analyticsEvents = [];
  }
  window.__analyticsEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('punch-club-landing-analytics', {
      detail: entry,
    }),
  );
};

/**
 * Generic telemetry event tracking function.
 * Used by various systems to send telemetry events.
 * 
 * @param eventType - Type of telemetry event
 * @param payload - Event payload data
 */
export function trackTelemetryEvent(
  eventType: string,
  payload: Record<string, unknown>
): void {
  // Forward to appropriate diagnostics channel based on event type
  if (eventType.startsWith('landing_')) {
    landingDiagnostics.info('Landing event', payload, ['landing', eventType]);
  } else if (eventType.startsWith('sts_')) {
    stsDiagnostics.info('STS event', payload, ['sts', eventType]);
  } else if (eventType.startsWith('stress_')) {
    stressDiagnostics.info('Stress test event', payload, ['stress', eventType]);
  } else if (eventType.startsWith('quest_')) {
    landingDiagnostics.info('Quest event', payload, ['quest', eventType]);
  } else if (eventType.startsWith('fatigue_')) {
    landingDiagnostics.info('Fatigue event', payload, ['fatigue', eventType]);
  } else if (eventType.startsWith('analytics_')) {
    stressDiagnostics.info('Analytics event', payload, ['analytics', eventType]);
  } else if (eventType.startsWith('slot_medal_')) {
    slottedMedalDiagnostics.info('Slotted Medal event', payload, ['slotted_medal', eventType]);
  } else if (eventType.startsWith('modifier_')) {
    modifierDiagnostics.info('Modifier telemetry event', payload, ['modifier', eventType]);
  } else {
    // Default to stress diagnostics for unknown event types
    stressDiagnostics.info('Generic telemetry event', payload, ['telemetry', eventType]);
  }

  // Add to shared window event buffer if available
  if (typeof window !== 'undefined' && window.telemetryBuffer) {
    window.telemetryBuffer.push({
      eventType,
      payload,
      timestamp: Date.now(),
      source: 'trackTelemetryEvent'
    });
  }
}

/**
 * Records a gameplay modifier telemetry event, forwarding it to the
 * dedicated diagnostics channel and the shared window event buffer.
 *
 * @param event - Modifier telemetry event type
 * @param payload - Modifier telemetry payload
 */
export function trackModifierTelemetry(
  event: ModifierTelemetryEvent,
  payload?: ModifierTelemetryEventPayload,
): void {
  const entry: ModifierTelemetryAnalyticsEntry = {
    event,
    payload,
    timestamp: Date.now(),
  };

  if (modifierDiagnostics.isEnabled()) {
    modifierDiagnostics.info('Modifier telemetry event', entry, ['modifier-telemetry', event]);
  }

  if (typeof window !== 'undefined') {
    if (!Array.isArray(window.__modifierTelemetryEvents)) {
      window.__modifierTelemetryEvents = [];
    }
    window.__modifierTelemetryEvents.push(entry);
    window.dispatchEvent(
      new CustomEvent('modifier-telemetry-event', {
        detail: entry,
      }),
    );
  }

  if (typeof window !== 'undefined' && window.telemetryBuffer) {
    window.telemetryBuffer.push({
      eventType: event,
      payload,
      timestamp: Date.now(),
      source: 'trackModifierTelemetry',
    });
  }
}

/**
 * Records a Punch Club landing analytics event, forwarding it to the
 * diagnostics channel and the shared window event buffer.
 */
export function trackPunchClubLanding(
  event: PunchClubLandingEvent,
  payload?: PunchClubLandingEventPayload,
): void {
  const entry: PunchClubLandingAnalyticsEntry = {
    event,
    payload,
    timestamp: Date.now(),
  };

  if (landingDiagnostics.isEnabled()) {
    landingDiagnostics.info('Landing analytics event', entry, ['punch-club-landing', event]);
  }

  pushAnalyticsEntry(entry);
}

const pushSTSTelemetryEntry = (entry: STSTelemetryEvent): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray((window as typeof window & { __stsTelemetryEvents?: STSTelemetryEvent[] }).__stsTelemetryEvents)) {
    (window as typeof window & { __stsTelemetryEvents?: STSTelemetryEvent[] }).__stsTelemetryEvents = [];
  }
  (window as typeof window & { __stsTelemetryEvents: STSTelemetryEvent[] }).__stsTelemetryEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('sts-telemetry-event', {
      detail: entry,
    }),
  );
};

const pushStressTestTelemetryEntry = (entry: StressTestTelemetryAnalyticsEntry): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray(window.__stressTestTelemetryEvents)) {
    window.__stressTestTelemetryEvents = [];
  }
  window.__stressTestTelemetryEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('stress-test-telemetry-event', {
      detail: entry,
    }),
  );
};

export type STSTelemetryEventType =
  | 'sts_run_start'
  | 'sts_turn_tick'
  | 'sts_agency_gap'
  | 'sts_pacing_band'
  | 'sts_resource_balance'
  | 'sts_run_complete'
  | 'sts_preset_saved'
  | 'sts_preset_loaded'
  | 'sts_preset_deleted'
  | 'sts_preset_exported'
  | 'sts_preset_imported'
  | 'sts_preset_lint_failed';

export interface STSTelemetryEvent {
  type: STSTelemetryEventType;
  timestamp: number;
  runId: string;
  deckId: string;
  enemyId: string;
  seed: number;
  data: Record<string, unknown>;
}

/**
 * Records STS simulator telemetry events to diagnostics + shared window buffer.
 */
export function reportSTSCombatMetrics(event: STSTelemetryEvent): void {
  if (stsDiagnostics.isEnabled()) {
    stsDiagnostics.info('STS telemetry event', event, ['sts-simulator', event.type]);
  }
  pushSTSTelemetryEntry(event);
}

/**
 * Records stress test telemetry events to diagnostics + shared window buffer.
 */
export function reportStressTestTelemetry(
  event: StressTestTelemetryEvent,
  payload?: StressTestTelemetryEventPayload
): void {
  const entry: StressTestTelemetryAnalyticsEntry = {
    event,
    payload,
    timestamp: Date.now(),
  };

  if (stressDiagnostics.isEnabled()) {
    stressDiagnostics.info('Stress test telemetry event', entry, ['stress-test', event]);
  }

  pushStressTestTelemetryEntry(entry);
}

/**
 * Records STS preset management telemetry events.
 * Generic function for all preset-related events.
 */
export function trackSTSTelemetry(
  eventType: STSTelemetryEventType,
  payload: Record<string, unknown>
): void {
  const event: STSTelemetryEvent = {
    type: eventType,
    timestamp: Date.now(),
    runId: payload.runId as string || 'preset-operation',
    deckId: payload.deckId as string || 'unknown',
    enemyId: payload.enemyId as string || 'unknown',
    seed: payload.seed as number || 0,
    data: payload
  };

  if (stsDiagnostics.isEnabled()) {
    stsDiagnostics.info('STS preset telemetry event', event, ['sts-preset', eventType]);
  }
  pushSTSTelemetryEntry(event);
}

/**
 * Calculates injury and death percentages for a quest activity based on danger rating.
 * Reads from activity danger rating, normalizes to 0-100 range, with fallback to 0.
 */
export function calculateQuestRiskPercentages(activity: { dangerRating?: number }): { injuryPercentage: number; deathPercentage: number } {
  // Read from activity danger rating with fallback
  const dangerRating = activity?.dangerRating ?? 0;
  
  // Normalize to 0-100 range, no magic numbers
  const injuryPercentage = Math.max(0, Math.min(100, dangerRating * 15));
  const deathPercentage = Math.max(0, Math.min(100, Math.round(injuryPercentage / 2)));
  
  return { injuryPercentage, deathPercentage };
}

/**
 * Normalizes risk percentages from any telemetry/config source.
 * Ensures values are clamped to 0-100 range with fallback to 0 for missing data.
 */
export function normalizeRiskPercentages(input: { injury?: number; death?: number }): { injuryPercentage: number; deathPercentage: number } {
  const normalizeValue = (value: number | undefined): number => {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  };
  
  const injuryPercentage = normalizeValue(input?.injury);
  const deathPercentage = normalizeValue(input?.death);
  
  return { injuryPercentage, deathPercentage };
}

// Quest Telemetry Analytics Events

const questDiagnostics = createHeadlessDiagnostics('QuestTelemetry');

/**
 * Events emitted by the Quest Telemetry analytics system.
 */
export type QuestTelemetryEventType = 
  | 'quest_heatmap_rendered'
  | 'quest_decision_selected'
  | 'quest_bucket_clicked'
  | 'quest_filter_applied'
  | 'quest_export_triggered'
  | 'quest_analytics_viewed';

/**
 * Payload attached to quest telemetry analytics events.
 */
export interface QuestTelemetryEventPayload {
  [key: string]: unknown;
}

interface QuestTelemetryAnalyticsEntry {
  event: QuestTelemetryEventType;
  payload?: QuestTelemetryEventPayload;
  timestamp: number;
}

declare global {
  interface Window {
    __questTelemetryEvents?: QuestTelemetryAnalyticsEntry[];
  }
}

const pushQuestTelemetryEntry = (entry: QuestTelemetryAnalyticsEntry): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray(window.__questTelemetryEvents)) {
    window.__questTelemetryEvents = [];
  }
  window.__questTelemetryEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('quest-telemetry-analytics', {
      detail: entry,
    }),
  );
};

/**
 * Records a Quest Telemetry analytics event, forwarding it to the
 * diagnostics channel and the shared window event buffer.
 */
export function trackQuestTelemetry(
  event: QuestTelemetryEventType,
  payload?: QuestTelemetryEventPayload,
): void {
  const entry: QuestTelemetryAnalyticsEntry = {
    event,
    payload,
    timestamp: Date.now(),
  };

  if (questDiagnostics.isEnabled()) {
    questDiagnostics.info('Quest telemetry event', entry, ['quest-telemetry', event]);
  }

  pushQuestTelemetryEntry(entry);
}

// Phase E Fatigue Telemetry Events

const fatigueDiagnostics = createHeadlessDiagnostics('PhaseEFatigueTelemetry');

/**
 * Fatigue telemetry events for Phase E validation
 */
export type FatigueTelemetryEventType = 
  | 'fatigue_threshold_warn'
  | 'fatigue_threshold_block'
  | 'fatigue_threshold_reset'
  | 'fatigue_recovery_completed'
  | 'fatigue_anomaly_alert';

/**
 * Payload attached to fatigue threshold telemetry events.
 */
export interface FatigueTelemetryEventPayload {
  /** Resident ID experiencing fatigue */
  residentId: string;
  /** Activity ID where fatigue occurred */
  activityId?: string;
  /** Current fatigue percentage */
  currentFatigue: number;
  /** Fatigue threshold that was crossed */
  threshold: number;
  /** Type of fatigue threshold event */
  eventType: FatigueTelemetryEventType;
  /** Context of the fatigue event */
  context?: string;
  /** Additional metadata */
  metadata?: {
    /** Previous fatigue level before threshold crossing */
    previousFatigue?: number;
    /** Time since last fatigue event (ms) */
    timeSinceLastEvent?: number;
    /** Cumulative fatigue events in session */
    sessionEventCount?: number;
    /** Activity type/category */
    activityType?: string;
    /** Resident stats affecting fatigue */
    residentStats?: Record<string, number>;
    /** Fatigue anomaly rule identifier */
    ruleId?: string;
    /** Percent delta captured by anomaly detector */
    deltaPercent?: number;
    /** Absolute delta captured by anomaly detector */
    deltaValue?: number;
    /** Resident baseline segment identifier */
    segmentId?: string;
  };
}

interface FatigueTelemetryAnalyticsEntry {
  event: FatigueTelemetryEventType;
  payload: FatigueTelemetryEventPayload;
  timestamp: number;
}

declare global {
  interface Window {
    __fatigueTelemetryEvents?: FatigueTelemetryAnalyticsEntry[];
  }
}

const pushFatigueTelemetryEntry = (entry: FatigueTelemetryAnalyticsEntry): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray(window.__fatigueTelemetryEvents)) {
    window.__fatigueTelemetryEvents = [];
  }
  window.__fatigueTelemetryEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('fatigue-telemetry-analytics', {
      detail: entry,
    }),
  );
};

/**
 * Records a Phase E Fatigue Threshold telemetry event.
 * 
 * @param eventType - Type of fatigue threshold event
 * @param payload - Event payload with fatigue details
 */
export function trackFatigueTelemetry(
  eventType: FatigueTelemetryEventType,
  payload: Omit<FatigueTelemetryEventPayload, 'eventType' | 'timestamp'>,
): void {
  const entry: FatigueTelemetryAnalyticsEntry = {
    event: eventType,
    payload: {
      ...payload,
      eventType,
    },
    timestamp: Date.now(),
  };

  if (fatigueDiagnostics.isEnabled()) {
    fatigueDiagnostics.info('Fatigue threshold telemetry event', entry, ['phase-e-fatigue', eventType]);
  }

  pushFatigueTelemetryEntry(entry);
}

/**
 * Utility function to create a fatigue telemetry payload from validation data.
 * 
 * @param residentId - Resident ID
 * @param activityId - Activity ID
 * @param currentFatigue - Current fatigue percentage
 * @param threshold - Fatigue threshold crossed
 * @param context - Event context
 * @param metadata - Additional metadata
 * @returns Complete fatigue telemetry payload
 */
export function createFatigueTelemetryPayload(
  residentId: string,
  activityId: string | undefined,
  currentFatigue: number,
  threshold: number,
  context?: string,
  metadata?: FatigueTelemetryEventPayload['metadata'],
): Omit<FatigueTelemetryEventPayload, 'eventType' | 'timestamp'> {
  return {
    residentId,
    activityId,
    currentFatigue,
    threshold,
    context,
    metadata,
  };
}

// STS Telemetry Export Utilities

/**
 * Export STS telemetry data for analysis
 * 
 * @param runId - Optional specific run ID to export
 * @returns Array of STS telemetry events
 */
export function exportSTSTelemetry(runId?: string): STSTelemetryEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const events = (window as typeof window & { __stsTelemetryEvents?: STSTelemetryEvent[] }).__stsTelemetryEvents || [];
  
  if (runId) {
    return events.filter(event => event.runId === runId);
  }
  
  return events;
}

/**
 * Get STS telemetry summary statistics
 * 
 * @param runId - Optional specific run ID to analyze
 * @returns Summary statistics for STS telemetry
 */
export function getSTSTelemetrySummary(runId?: string) {
  const events = exportSTSTelemetry(runId);
  
  const summary = {
    totalEvents: events.length,
    runs: new Set(events.map(e => e.runId)).size,
    eventTypes: {} as Record<string, number>,
    dateRange: {
      start: events.length > 0 ? new Date(Math.min(...events.map(e => e.timestamp))) : null,
      end: events.length > 0 ? new Date(Math.max(...events.map(e => e.timestamp))) : null,
    },
  };
  
  // Count event types
  events.forEach(event => {
    summary.eventTypes[event.type] = (summary.eventTypes[event.type] || 0) + 1;
  });
  
  return summary;
}

/**
 * Export STS telemetry to JSON string
 * 
 * @param runId - Optional specific run ID to export
 * @param pretty - Whether to format JSON with indentation
 * @returns JSON string of telemetry data
 */
export function exportSTSTelemetryJSON(runId?: string, pretty: boolean = true): string {
  const events = exportSTSTelemetry(runId);
  const data = {
    exportedAt: new Date().toISOString(),
    runId: runId || 'all',
    totalEvents: events.length,
    events,
  };
  
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Download STS telemetry as JSON file
 * 
 * @param runId - Optional specific run ID to export
 * @param filename - Optional custom filename
 */
export function downloadSTSTelemetry(runId?: string, filename?: string): void {
  if (typeof window === 'undefined') {
    console.warn('downloadSTSTelemetry can only be used in browser environment');
    return;
  }
  
  const json = exportSTSTelemetryJSON(runId);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `sts-telemetry-${runId || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// STS Analytics Upload Adapter

/**
 * Upload configuration for STS analytics
 */
export interface STSUploadConfig {
  /** Analytics server URL */
  serverUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Compression algorithm */
  compression: 'none' | 'gzip' | 'deflate';
  /** Upload timeout in milliseconds */
  timeout: number;
  /** Retry attempts */
  retryAttempts: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

/**
 * Upload result interface
 */
export interface STSUploadResult {
  /** Upload success status */
  success: boolean;
  /** Run ID */
  runId: string;
  /** Number of events uploaded */
  eventCount: number;
  /** Upload duration in milliseconds */
  uploadDuration: number;
  /** Upload speed in bytes per second */
  uploadSpeed: number;
  /** Error message if failed */
  error?: string;
  /** Server response */
  response?: any;
}

/**
 * Upload STS telemetry data to analytics server
 * 
 * @param runId - Run ID to upload
 * @param config - Upload configuration
 * @returns Upload result
 */
export async function uploadSTSTelemetry(
  runId: string,
  config: STSUploadConfig
): Promise<STSUploadResult> {
  const startTime = Date.now();
  
  try {
    // Export telemetry data
    const events = exportSTSTelemetry(runId);
    const summary = getSTSTelemetrySummary(runId);
    
    if (events.length === 0) {
      return {
        success: false,
        runId,
        eventCount: 0,
        uploadDuration: 0,
        uploadSpeed: 0,
        error: 'No telemetry data found for run',
      };
    }
    
    // Prepare upload payload
    const payload = {
      runId,
      metadata: {
        eventCount: events.length,
        summary,
        uploadedAt: new Date().toISOString(),
        compression: config.compression,
      },
      events,
    };
    
    // Compress data if requested
    let data = JSON.stringify(payload);
    let compressedSize = data.length;
    
    if (config.compression !== 'none') {
      if (typeof window !== 'undefined' && window.CompressionStream) {
        // Browser compression
        const stream = new CompressionStream(config.compression === 'gzip' ? 'gzip' : 'deflate');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        data = btoa(String.fromCharCode(...compressed));
        compressedSize = compressed.length;
      } else {
        // Fallback: no compression in Node.js environment
        console.warn('Compression not available, uploading uncompressed data');
      }
    }
    
    // Upload to server
    const response = await fetch(`${config.serverUrl}/api/sts/telemetry/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Compression': config.compression,
        'X-Original-Size': payload.events.length.toString(),
        'X-Compressed-Size': compressedSize.toString(),
      },
      body: JSON.stringify({
        runId,
        data,
        metadata: payload.metadata,
      }),
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    const uploadDuration = Date.now() - startTime;
    const uploadSpeed = data.length / (uploadDuration / 1000);
    
    return {
      success: true,
      runId,
      eventCount: events.length,
      uploadDuration,
      uploadSpeed,
      response: responseData,
    };
    
  } catch (error) {
    const uploadDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      runId,
      eventCount: 0,
      uploadDuration,
      uploadSpeed: 0,
      error: errorMessage,
    };
  }
}

/**
 * Upload multiple STS telemetry runs with retry logic
 * 
 * @param runIds - Array of run IDs to upload
 * @param config - Upload configuration
 * @param onProgress - Progress callback
 * @returns Array of upload results
 */
export async function uploadMultipleSTSTelemetry(
  runIds: string[],
  config: STSUploadConfig,
  onProgress?: (completed: number, total: number, result: STSUploadResult) => void
): Promise<STSUploadResult[]> {
  const results: STSUploadResult[] = [];
  
  for (let i = 0; i < runIds.length; i++) {
    const runId = runIds[i];
    let lastError: string | undefined;
    
    // Retry logic
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      const result = await uploadSTSTelemetry(runId, config);
      
      if (result.success) {
        results.push(result);
        onProgress?.(i + 1, runIds.length, result);
        break;
      } else {
        lastError = result.error;
        
        if (attempt < config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
        } else {
          results.push(result);
          onProgress?.(i + 1, runIds.length, result);
        }
      }
    }
  }
  
  return results;
}

/**
 * Get upload statistics from results
 * 
 * @param results - Array of upload results
 * @returns Upload statistics
 */
export function getUploadStatistics(results: STSUploadResult[]) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return {
    totalRuns: results.length,
    successfulUploads: successful.length,
    failedUploads: failed.length,
    successRate: results.length > 0 ? (successful.length / results.length) * 100 : 0,
    totalEvents: successful.reduce((sum, r) => sum + r.eventCount, 0),
    totalUploadTime: successful.reduce((sum, r) => sum + r.uploadDuration, 0),
    averageUploadSpeed: successful.length > 0 
      ? successful.reduce((sum, r) => sum + r.uploadSpeed, 0) / successful.length 
      : 0,
    errors: failed.map(r => r.error).filter(Boolean) as string[],
  };
}

/**
 * Validate STS telemetry data before upload
 * 
 * @param runId - Run ID to validate
 * @returns Validation result
 */
export function validateSTSTelemetry(runId: string): {
  valid: boolean;
  eventCount: number;
  issues: string[];
} {
  const events = exportSTSTelemetry(runId);
  const issues: string[] = [];
  
  if (events.length === 0) {
    issues.push('No telemetry events found');
  }
  
  // Check for required fields
  events.forEach((event, index) => {
    if (!event.type) {
      issues.push(`Event ${index}: missing event type`);
    }
    if (!event.timestamp) {
      issues.push(`Event ${index}: missing timestamp`);
    }
    if (typeof event.timestamp !== 'number') {
      issues.push(`Event ${index}: invalid timestamp type`);
    }
  });
  
  // Check for duplicate timestamps
  const timestamps = events.map(e => e.timestamp);
  const duplicateTimestamps = timestamps.filter((timestamp, index) => timestamps.indexOf(timestamp) !== index);
  if (duplicateTimestamps.length > 0) {
    issues.push(`${duplicateTimestamps.length} events have duplicate timestamps`);
  }
  
  // Check for future timestamps
  const now = Date.now();
  const futureEvents = events.filter(e => e.timestamp > now);
  if (futureEvents.length > 0) {
    issues.push(`${futureEvents.length} events have future timestamps`);
  }
  
  return {
    valid: issues.length === 0,
    eventCount: events.length,
    issues,
  };
}

// Stress Test Telemetry Export Utilities

/**
 * Export stress test telemetry data for analysis
 * 
 * @param runId - Optional specific run ID to export
 * @returns Array of stress test telemetry events
 */
export function exportStressTestTelemetry(runId?: string): StressTestTelemetryAnalyticsEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const events = window.__stressTestTelemetryEvents || [];
  
  if (runId) {
    return events.filter(event => event.payload?.runId === runId);
  }
  
  return events;
}

/**
 * Get stress test telemetry summary statistics
 * 
 * @param runId - Optional specific run ID to analyze
 * @returns Summary statistics for stress test telemetry
 */
export function getStressTestTelemetrySummary(runId?: string) {
  const events = exportStressTestTelemetry(runId);
  
  const summary = {
    totalEvents: events.length,
    runs: new Set(events.map(e => e.payload?.runId)).size,
    eventTypes: {} as Record<string, number>,
    dateRange: {
      start: events.length > 0 ? new Date(Math.min(...events.map(e => e.timestamp))) : null,
      end: events.length > 0 ? new Date(Math.max(...events.map(e => e.timestamp))) : null,
    },
    stats: {
      completedRuns: events.filter(e => e.event === 'stress_run_completed').length,
      failedRuns: events.filter(e => e.event === 'stress_run_failed').length,
      avgWinRate: 0,
      avgSynergyMultiplier: 0,
      totalIterations: 0,
    },
  };
  
  // Count event types
  events.forEach(event => {
    summary.eventTypes[event.event] = (summary.eventTypes[event.event] || 0) + 1;
  });
  
  // Calculate statistics for completed runs
  const completedRuns = events.filter(e => e.event === 'stress_run_completed' && e.payload);
  if (completedRuns.length > 0) {
    summary.stats.avgWinRate = completedRuns.reduce((sum, e) => sum + (e.payload?.winRate || 0), 0) / completedRuns.length;
    summary.stats.avgSynergyMultiplier = completedRuns.reduce((sum, e) => sum + (e.payload?.synergyMultiplier || 0), 0) / completedRuns.length;
    summary.stats.totalIterations = completedRuns.reduce((sum, e) => sum + (e.payload?.iterations || 0), 0);
  }
  
  return summary;
}

/**
 * Export stress test telemetry to JSON string
 * 
 * @param runId - Optional specific run ID to export
 * @param pretty - Whether to format JSON with indentation
 * @returns JSON string of telemetry data
 */
export function exportStressTestTelemetryJSON(runId?: string, pretty: boolean = true): string {
  const events = exportStressTestTelemetry(runId);
  const data = {
    exportedAt: new Date().toISOString(),
    runId: runId || 'all',
    totalEvents: events.length,
    summary: getStressTestTelemetrySummary(runId),
    events,
  };
  
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

// HUD Notification Telemetry Events

const hudDiagnostics = createHeadlessDiagnostics('HUDNotificationTelemetry');

/**
 * HUD notification telemetry events
 */
export type HUDNotificationTelemetryEventType = 
  | 'hud_notification_shown'
  | 'hud_notification_dismissed'
  | 'hud_notifications_cleared';

/**
 * Payload attached to HUD notification telemetry events.
 */
export interface HUDNotificationTelemetryEventPayload {
  /** Unique notification ID */
  notificationId: string;
  /** Notification type */
  type?: string;
  /** Notification message */
  message?: string;
  /** Notification priority */
  priority?: number;
  /** Auto-dismiss duration */
  duration?: number;
  /** Timestamp of notification creation */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Number of notifications cleared */
  clearedCount?: number;
}

interface HUDNotificationTelemetryAnalyticsEntry {
  event: HUDNotificationTelemetryEventType;
  payload: HUDNotificationTelemetryEventPayload;
  timestamp: number;
}

/**
 * Active HUD telemetry events
 */
export type ActiveHUDTelemetryEventType =
  | 'hud_rendered'
  | 'hud_card_selected'
  | 'hud_notification_action'
  | 'hud_overflow_shown'
  | 'hud_empty_state'
  | 'hud_variant_changed';

/**
 * Payload attached to Active HUD telemetry events.
 */
export interface ActiveHUDTelemetryEventPayload {
  /** HUD variant being used */
  variant?: 'default' | 'compact';
  /** Number of activities currently displayed */
  activityCount?: number;
  /** Maximum visible activities (if clamped) */
  maxVisible?: number;
  /** Whether overflow is shown */
  hasOverflow?: boolean;
  /** Activity key that was selected (for card selection events) */
  activityKey?: string;
  /** Activity type (job, quest, maintenance) */
  activityType?: string;
  /** Resident assigned to activity */
  residentName?: string;
  /** Render timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

interface ActiveHUDTelemetryAnalyticsEntry {
  event: ActiveHUDTelemetryEventType;
  payload: ActiveHUDTelemetryEventPayload;
  timestamp: number;
}

declare global {
  interface Window {
    __activeHUDTelemetryEvents?: ActiveHUDTelemetryAnalyticsEntry[];
  }
}

const activeHUDDiagnostics = createHeadlessDiagnostics('ActiveHUDTelemetry');

const pushActiveHUDTelemetryEntry = (entry: ActiveHUDTelemetryAnalyticsEntry): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray(window.__activeHUDTelemetryEvents)) {
    window.__activeHUDTelemetryEvents = [];
  }
  window.__activeHUDTelemetryEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('active-hud-telemetry-analytics', {
      detail: entry,
    }),
  );
};

/**
 * Records an Active HUD telemetry event, forwarding it to the
 * diagnostics channel and the shared window event buffer.
 */
export function reportActiveHUDEvent(event: {
  eventType: ActiveHUDTelemetryEventType;
  data: ActiveHUDTelemetryEventPayload;
}): void {
  const entry: ActiveHUDTelemetryAnalyticsEntry = {
    event: event.eventType,
    payload: event.data,
    timestamp: Date.now(),
  };

  if (activeHUDDiagnostics.isEnabled()) {
    activeHUDDiagnostics.info('Active HUD telemetry event', entry, ['active-hud', event.eventType]);
  }

  pushActiveHUDTelemetryEntry(entry);
}

/**
 * Theater View telemetry events
 */
export type TheaterTelemetryEventType =
  | 'theater_opened'
  | 'theater_closed'
  | 'theater_slot_selected'
  | 'theater_resident_dropped'
  | 'theater_drag_started'
  | 'theater_drag_ended';

/**
 * Payload attached to Theater telemetry events.
 */
export interface TheaterTelemetryEventPayload {
  /** Theater primary slot ID */
  slotId?: string;
  /** Theater primary slot label */
  slotLabel?: string;
  /** Number of verbs/activities displayed */
  verbCount?: number;
  /** Selected activity key (for slot selection events) */
  activityKey?: string;
  /** Activity type */
  activityType?: string;
  /** Resident ID for drop events */
  residentId?: string;
  /** Resident name */
  residentName?: string;
  /** Drop validation result */
  dropValid?: boolean;
  /** Render timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

interface TheaterTelemetryAnalyticsEntry {
  event: TheaterTelemetryEventType;
  payload: TheaterTelemetryEventPayload;
  timestamp: number;
}

declare global {
  interface Window {
    __analyticsEvents?: PunchClubLandingAnalyticsEntry[];
    __punchClubLandingEvents?: PunchClubLandingAnalyticsEntry[];
    __stsTelemetryEvents?: STSTelemetryEvent[];
    __stressTestTelemetryEvents?: StressTestTelemetryAnalyticsEntry[];
    __questTelemetryEvents?: QuestTelemetryAnalyticsEntry[];
    __fatigueTelemetryEvents?: FatigueTelemetryAnalyticsEntry[];
    __activeHUDTelemetryEvents?: ActiveHUDTelemetryAnalyticsEntry[];
    __theaterTelemetryEvents?: TheaterTelemetryAnalyticsEntry[];
    __theaterHandlers?: {
      handleSlotSelection?: (activityKey: string, activityType?: string, residentName?: string) => void;
      handleResidentDrop?: (residentId: string, slotId: string, dropValid: boolean) => void;
    };
    __hudNotificationTelemetryEvents?: HUDNotificationTelemetryAnalyticsEntry[];
    telemetryBuffer?: Array<{
      eventType: string;
      payload: Record<string, unknown>;
      timestamp: number;
      source: string;
    }>;
    __pwaTelemetryEvents?: PWATelemetryAnalyticsEntry[];
    __MINIMAL_GAMEPLAY_TRACE__?: import('./telemetryProvider').MinimalGameplayTraceEntry[];
  }
}

const pushHUDNotificationTelemetryEntry = (entry: HUDNotificationTelemetryAnalyticsEntry): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray(window.__hudNotificationTelemetryEvents)) {
    window.__hudNotificationTelemetryEvents = [];
  }
  window.__hudNotificationTelemetryEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('hud-notification-telemetry-analytics', {
      detail: entry,
    }),
  );
};

/**
 * Records a HUD notification telemetry event, forwarding it to the
 * diagnostics channel and the shared window event buffer.
 */
export function reportHUDNotificationEvent(event: {
  eventType: HUDNotificationTelemetryEventType;
  data: HUDNotificationTelemetryEventPayload;
}): void {
  const entry: HUDNotificationTelemetryAnalyticsEntry = {
    event: event.eventType,
    payload: event.data,
    timestamp: Date.now(),
  };

  if (hudDiagnostics.isEnabled()) {
    hudDiagnostics.info('HUD notification telemetry event', entry, ['hud-notification', event.eventType]);
  }

  pushHUDNotificationTelemetryEntry(entry);
}

/**
 * PWA telemetry event entry push function
 */
const pushPWATelemetryEntry = (entry: PWATelemetryAnalyticsEntry): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!Array.isArray(window.__pwaTelemetryEvents)) {
    window.__pwaTelemetryEvents = [];
  }
  window.__pwaTelemetryEvents.push(entry);
  window.dispatchEvent(
    new CustomEvent('pwa-telemetry-analytics', {
      detail: entry,
    }),
  );
};

/**
 * Records a PWA telemetry event, forwarding it to the
 * diagnostics channel and the shared window event buffer.
 * 
 * @param event PWA telemetry event with type and data
 */
export function reportPWAEvent(event: {
  eventType: PWATelemetryEvent;
  data: PWATelemetryEventPayload;
}): void {
  const entry: PWATelemetryAnalyticsEntry = {
    event: event.eventType,
    payload: event.data,
    timestamp: Date.now(),
  };

  // Use landing diagnostics for PWA events (could create dedicated PWA diagnostics)
  if (landingDiagnostics.isEnabled()) {
    landingDiagnostics.info('PWA telemetry event', entry, ['pwa', event.eventType]);
  }

  pushPWATelemetryEntry(entry);
}

/**
 * STS telemetry session persistence helpers
 */

/**
 * Saves STS telemetry session data to persistent storage
 */
export async function saveSTSSession(sessionData: STSTelemetryEvent[]): Promise<void> {
  try {
    await saveData('sts-telemetry-session', {
      events: sessionData,
      lastUpdated: Date.now(),
      version: '1.0.0',
    });
    sessionDiagnostics.info('session_saved', {
      eventCount: sessionData.length,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    sessionDiagnostics.error('session_save_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Loads STS telemetry session data from persistent storage
 */
export async function loadSTSSession(): Promise<STSTelemetryEvent[]> {
  try {
    const sessionData = await loadData<{
      events: STSTelemetryEvent[];
      lastUpdated: number;
      version: string;
    }>('sts-telemetry-session', {
      events: [],
      lastUpdated: Date.now(),
      version: '1.0.0',
    });

    sessionDiagnostics.info('session_loaded', {
      eventCount: sessionData.events.length,
      lastUpdated: sessionData.lastUpdated,
      version: sessionData.version,
    });

    return sessionData.events;
  } catch (error) {
    sessionDiagnostics.error('session_load_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Clears STS telemetry session data from persistent storage
 */
export async function clearSTSSession(): Promise<void> {
  try {
    await saveData('sts-telemetry-session', {
      events: [],
      lastUpdated: Date.now(),
      version: '1.0.0',
    });
    sessionDiagnostics.info('session_cleared', {
      timestamp: Date.now(),
    });
  } catch (error) {
    sessionDiagnostics.error('session_clear_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Gets STS session statistics
 */
export async function getSTSSessionStats(): Promise<{
  eventCount: number;
  lastUpdated: number | null;
  version: string;
  oldestEvent: number | null;
  newestEvent: number | null;
}> {
  try {
    const sessionData = await loadData<{
      events: STSTelemetryEvent[];
      lastUpdated: number;
      version: string;
    }>('sts-telemetry-session', {
      events: [],
      lastUpdated: Date.now(),
      version: '1.0.0',
    });

    const timestamps = sessionData.events.map(event => event.timestamp);
    const oldestEvent = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestEvent = timestamps.length > 0 ? Math.max(...timestamps) : null;

    return {
      eventCount: sessionData.events.length,
      lastUpdated: sessionData.lastUpdated,
      version: sessionData.version,
      oldestEvent,
      newestEvent,
    };
  } catch (error) {
    sessionDiagnostics.error('session_stats_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      eventCount: 0,
      lastUpdated: null,
      version: '1.0.0',
      oldestEvent: null,
      newestEvent: null,
    };
  }
}

/**
 * Analytics uploader with batching and retry logic
 */
export class STSAnalyticsUploader {
  private batchSize = 100;
  private maxRetries = 3;
  private retryDelay = 1000;
  private uploadQueue: STSTelemetryEvent[] = [];
  private isUploading = false;

  constructor(config?: {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
  }) {
    if (config?.batchSize) this.batchSize = config.batchSize;
    if (config?.maxRetries) this.maxRetries = config.maxRetries;
    if (config?.retryDelay) this.retryDelay = config.retryDelay;
  }

  /**
   * Add events to upload queue
   */
  addEvents(events: STSTelemetryEvent[]): void {
    this.uploadQueue.push(...events);
    sessionDiagnostics.info('events_queued', {
      eventCount: events.length,
      queueSize: this.uploadQueue.length,
    });
  }

  /**
   * Upload events with retry logic
   */
  async uploadEvents(events: STSTelemetryEvent[]): Promise<{
    success: boolean;
    uploaded: number;
    failed: number;
    errors: string[];
  }> {
    let uploaded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Simulate upload to mock storage
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Simulate occasional failure
        if (Math.random() < 0.2) {
          throw new Error('Simulated upload failure');
        }

        uploaded = events.length;
        sessionDiagnostics.info('upload_success', {
          attempt,
          eventCount: uploaded,
        });
        break;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Attempt ${attempt}: ${errorMessage}`);
        
        sessionDiagnostics.info('upload_failed', {
          attempt,
          error: errorMessage,
          eventCount: events.length,
        });

        if (attempt === this.maxRetries) {
          failed = events.length;
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    return {
      success: uploaded > 0,
      uploaded,
      failed,
      errors,
    };
  }

  /**
   * Process upload queue in batches
   */
  async processQueue(): Promise<{
    totalBatches: number;
    successfulBatches: number;
    totalUploaded: number;
    totalFailed: number;
  }> {
    if (this.isUploading) {
      throw new Error('Upload already in progress');
    }

    this.isUploading = true;
    const totalBatches = Math.ceil(this.uploadQueue.length / this.batchSize);
    let successfulBatches = 0;
    let totalUploaded = 0;
    let totalFailed = 0;

    sessionDiagnostics.info('queue_processing_started', {
      totalBatches,
      queueSize: this.uploadQueue.length,
      batchSize: this.batchSize,
    });

    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.batchSize;
      const end = start + this.batchSize;
      const batch = this.uploadQueue.slice(start, end);

      const result = await this.uploadEvents(batch);
      
      if (result.success) {
        successfulBatches++;
        totalUploaded += result.uploaded;
      } else {
        totalFailed += result.failed;
      }

      sessionDiagnostics.info('batch_completed', {
        batchIndex: i + 1,
        success: result.success,
        uploaded: result.uploaded,
        failed: result.failed,
      });
    }

    // Clear processed events
    this.uploadQueue = [];
    this.isUploading = false;

    sessionDiagnostics.info('queue_processing_completed', {
      totalBatches,
      successfulBatches,
      totalUploaded,
      totalFailed,
    });

    return {
      totalBatches,
      successfulBatches,
      totalUploaded,
      totalFailed,
    };
  }

  /**
   * Get upload queue status
   */
  getQueueStatus(): {
    queueSize: number;
    isUploading: boolean;
    batchSize: number;
  } {
    return {
      queueSize: this.uploadQueue.length,
      isUploading: this.isUploading,
      batchSize: this.batchSize,
    };
  }

  /**
   * Clear upload queue
   */
  clearQueue(): void {
    this.uploadQueue = [];
    sessionDiagnostics.info('queue_cleared');
  }
}

/**
 * Global uploader instance
 */
export const stsAnalyticsUploader = new STSAnalyticsUploader();

export interface MinimalGameplayTraceEntry {
  ts: number;
  label: string;
  payload?: Record<string, unknown>;
}

/**
 * Traces minimal gameplay events for debugging and analytics
 * Only active in development mode
 */
export const traceMinimalGameplay = (label: string, payload?: Record<string, unknown>) => {
  if (!import.meta.env.DEV) {
    return;
  }
  const entry: MinimalGameplayTraceEntry = {
    ts: Date.now(),
    label,
    payload,
  };
  if (typeof window !== 'undefined') {
    const buffer = (window.__MINIMAL_GAMEPLAY_TRACE__ ??= []);
    buffer.push(entry);
  }
  console.debug(`[MinimalGameplayTrace] ${label}`, payload);
};
