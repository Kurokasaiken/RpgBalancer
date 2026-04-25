/**
 * NP-102 ActivitySlot Telemetry Hook
 * 
 * Hook that listens to UI store and sends telemetry events for ActivitySlot (Phase 12).
 * Provides real-time telemetry emission, event aggregation, and export capabilities.
 * 
 * @author Helix-Idle – Activity Telemetry
 * @since 2026-01-21
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import {
  ACTIVITYSLOT_TELEMETRY_EVENTS,
  type ActivitySlotTelemetryEvent,
  type ActivitySlotTelemetryData,
  type ActivitySlotTelemetryExport,
  type ActivitySlotTelemetryConfig,
  type SlotState,
  type DropResult,
  DEFAULT_ACTIVITYSLOT_TELEMETRY_CONFIG,
  ActivitySlotTelemetryUtils,
  isValidActivitySlotTelemetryEvent,
} from '@/ui/idleVillage/activeHud/ActivitySlotTelemetryMirror';

type SandboxTimeout = ReturnType<typeof globalThis.setTimeout>;

/**
 * Hook return interface
 */
export interface UseActivitySlotTelemetryReturn {
  /** Current telemetry events */
  events: ActivitySlotTelemetryEvent[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Export telemetry data */
  exportTelemetry: (format: 'json' | 'csv') => Promise<void>;
  /** Clear all telemetry data */
  clearTelemetry: () => Promise<void>;
  /** Emit custom telemetry event */
  emitEvent: (eventType: string, data: ActivitySlotTelemetryData, metadata?: Record<string, unknown>) => void;
  /** Get aggregated statistics */
  getStatistics: () => {
    totalEvents: number;
    stateChanges: number;
    assignments: number;
    dropAttempts: number;
    dropSuccessRate: number;
    completionRate: number;
    avgProcessingTime: number;
  };
  /** Configuration */
  config: ActivitySlotTelemetryConfig;
  /** Update configuration */
  updateConfig: (config: Partial<ActivitySlotTelemetryConfig>) => void;
}

const STORAGE_KEY = 'activityslot-telemetry';
const MAX_EVENTS = 1000;
const AUTO_SAVE_DELAY = 1000; // 1 second

/**
 * Hook for ActivitySlot telemetry management and emission
 */
export function useActivitySlotTelemetry(config: Partial<ActivitySlotTelemetryConfig> = {}): UseActivitySlotTelemetryReturn {
  const [events, setEvents] = useState<ActivitySlotTelemetryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ActivitySlotTelemetryConfig>({
    ...DEFAULT_ACTIVITYSLOT_TELEMETRY_CONFIG,
    ...config,
  });

  const sessionIdRef = useRef<string>('');
  const saveTimeoutRef = useRef<SandboxTimeout | null>(null);
  const lastStateRef = useRef<Map<string, SlotState>>(new Map());
  const autoExportIntervalRef = useRef<SandboxTimeout | null>(null);

  // Initialize session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = ActivitySlotTelemetryUtils.generateSessionId();
    }
  }, []);

  // Load telemetry data on mount
  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const saved = await loadData(STORAGE_KEY, []);
        const normalizedEvents = Array.isArray(saved) ? saved.filter(isValidActivitySlotTelemetryEvent) : [];
        setEvents(normalizedEvents);
      } catch (err) {
        console.warn('[useActivitySlotTelemetry] Failed to load telemetry:', err);
        setError('Failed to load telemetry data');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTelemetry();
  }, []);

  // Auto-save with debouncing
  const debouncedSave = useCallback(
    async (data: ActivitySlotTelemetryEvent[]) => {
      if (saveTimeoutRef.current) {
        globalThis.clearTimeout(saveTimeoutRef.current);
      }

      return new Promise<void>((resolve) => {
        saveTimeoutRef.current = globalThis.setTimeout(async () => {
          try {
            await saveData(STORAGE_KEY, data);
          } catch (err) {
            console.warn('[useActivitySlotTelemetry] Failed to save telemetry:', err);
            setError('Failed to save telemetry data');
          }
          resolve();
        }, AUTO_SAVE_DELAY);
      });
    },
    [],
  );

  // Emit telemetry event
  const emitEvent = useCallback(
    (
      eventType: string,
      data: ActivitySlotTelemetryData,
      metadata: Record<string, unknown> = {},
    ) => {
      if (!currentConfig.enabled) return;

      // Apply sampling rate
      if (Math.random() > currentConfig.sampleRate) return;

      const startTime = currentConfig.performance.trackProcessingTime ? performance.now() : undefined;

      const event: ActivitySlotTelemetryEvent = {
        eventType: eventType as any, // Type assertion for dynamic event types
        timestamp: Date.now(),
        sessionId: sessionIdRef.current,
        data,
        metadata: {
          source: 'useActivitySlotTelemetry',
          ...metadata,
          ...(currentConfig.performance.trackProcessingTime && startTime
            ? {
                performance: {
                  processingTime: performance.now() - (startTime || 0),
                },
              }
            : {}),
        },
      };

      setEvents((prev) => {
        const newEvents = [event, ...prev].slice(0, currentConfig.maxEvents);
        debouncedSave(newEvents);
        return newEvents;
      });

      // Emit custom DOM event for external listeners
      window.dispatchEvent(
        new CustomEvent('activityslot-telemetry', {
          detail: {
            eventType,
            data,
            timestamp: event.timestamp,
            sessionId: sessionIdRef.current,
          },
        }),
      );
    },
    [currentConfig, debouncedSave],
  );

  // Track slot state changes
  const trackSlotStateChange = useCallback(
    (slotData: ActivitySlotData, newState: SlotState, resident?: ResidentState) => {
      const oldState = lastStateRef.current.get(slotData.slotId);
      lastStateRef.current.set(slotData.slotId, newState);

      if (oldState !== newState) {
        const telemetryData = ActivitySlotTelemetryUtils.createSlotTelemetryData(
          slotData,
          newState,
          resident,
        );

        emitEvent(ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED, telemetryData, {
          oldState,
          newState,
        });
      }
    },
    [emitEvent],
  );

  // Track resident assignments
  const trackResidentAssignment = useCallback(
    (slotData: ActivitySlotData, resident: ResidentState) => {
      const telemetryData = ActivitySlotTelemetryUtils.createSlotTelemetryData(
        slotData,
        'occupied',
        resident,
      );

      emitEvent(ACTIVITYSLOT_TELEMETRY_EVENTS.RESIDENT_ASSIGNED, telemetryData, {
        context: 'manual_assignment',
      });

      trackSlotStateChange(slotData, 'occupied', resident);
    },
    [emitEvent, trackSlotStateChange],
  );

  // Track resident removal
  const trackResidentRemoval = useCallback(
    (slotData: ActivitySlotData) => {
      const telemetryData = ActivitySlotTelemetryUtils.createSlotTelemetryData(slotData, 'empty');

      emitEvent(ACTIVITYSLOT_TELEMETRY_EVENTS.RESIDENT_REMOVED, telemetryData, {
        context: 'manual_assignment',
      });

      trackSlotStateChange(slotData, 'empty');
    },
    [emitEvent, trackSlotStateChange],
  );

  // Track drop attempts
  const trackDropAttempt = useCallback(
    (slotData: ActivitySlotData, residentId: string, result: DropResult, reason?: string) => {
      const telemetryData = ActivitySlotTelemetryUtils.createSlotTelemetryData(
        slotData,
        result === 'valid' ? 'occupied' : 'empty',
        undefined,
        undefined,
        result,
        reason,
      );

      const eventType = result === 'valid'
        ? ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED
        : ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_FAILED;

      emitEvent(eventType, telemetryData, {
        context: 'drag_drop',
        residentId,
        dropResult: result,
      });
    },
    [emitEvent],
  );

  // Track progress updates
  const trackProgressUpdate = useCallback(
    (slotData: ActivitySlotData, resident: ResidentState, progress: { fraction: number; elapsedSeconds: number; totalSeconds: number }) => {
      const telemetryData = ActivitySlotTelemetryUtils.createSlotTelemetryData(
        slotData,
        'in_progress',
        resident,
        progress,
      );

      emitEvent(ACTIVITYSLOT_TELEMETRY_EVENTS.PROGRESS_UPDATED, telemetryData, {
        progress,
      });
    },
    [emitEvent],
  );

  // Track activity completion
  const trackActivityCompletion = useCallback(
    (slotData: ActivitySlotData, resident: ResidentState) => {
      const telemetryData = ActivitySlotTelemetryUtils.createSlotTelemetryData(
        slotData,
        'completed',
        resident,
      );

      emitEvent(ACTIVITYSLOT_TELEMETRY_EVENTS.ACTIVITY_COMPLETED, telemetryData, {
        context: 'system_update',
      });

      trackSlotStateChange(slotData, 'completed', resident);
    },
    [emitEvent, trackSlotStateChange],
  );

  // Export telemetry data
  const exportTelemetry = useCallback(
    async (format: 'json' | 'csv') => {
      if (!currentConfig.export[format]) {
        throw new Error(`${format.toUpperCase()} export is disabled in configuration`);
      }

      const now = Date.now();
      const exportData: ActivitySlotTelemetryExport = {
        metadata: {
          timestamp: now,
          sessionId: sessionIdRef.current,
          totalEvents: events.length,
          dateRange: {
            start: events.length > 0 ? Math.min(...events.map(e => e.timestamp)) : now,
            end: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : now,
          },
          version: '1.0.0',
        },
        events,
        statistics: {
          stateChanges: events.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED).length,
          assignments: events.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.RESIDENT_ASSIGNED).length,
          dropAttempts: events.filter(e => 
            e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED || 
            e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_FAILED
          ).length,
          dropSuccessRate: ActivitySlotTelemetryUtils.calculateDropSuccessRate(events),
          commonStates: ActivitySlotTelemetryUtils.aggregateSlotStates(events),
          completionRate: ActivitySlotTelemetryUtils.calculateCompletionRate(events),
          avgProcessingTime: ActivitySlotTelemetryUtils.calculateAverageProcessingTime(events),
        },
      };

      const filename = `activityslot-telemetry-${new Date().toISOString().split('T')[0]}`;

      if (format === 'json') {
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const csv = convertToCSV(exportData.events);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [events, currentConfig],
  );

  // Clear telemetry data
  const clearTelemetry = useCallback(async () => {
    try {
      // Clear any pending save
      if (saveTimeoutRef.current) {
        globalThis.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      setEvents([]);
      await clearData(STORAGE_KEY);
      setError(null);
      lastStateRef.current.clear();
    } catch (err) {
      console.warn('[useActivitySlotTelemetry] Failed to clear telemetry:', err);
      setError('Failed to clear telemetry data');
    }
  }, []);

  // Get aggregated statistics
  const getStatistics = useCallback(() => {
    return {
      totalEvents: events.length,
      stateChanges: events.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED).length,
      assignments: events.filter(e => e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.RESIDENT_ASSIGNED).length,
      dropAttempts: events.filter(e => 
        e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED || 
        e.eventType === ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_FAILED
      ).length,
      dropSuccessRate: ActivitySlotTelemetryUtils.calculateDropSuccessRate(events),
      completionRate: ActivitySlotTelemetryUtils.calculateCompletionRate(events),
      avgProcessingTime: ActivitySlotTelemetryUtils.calculateAverageProcessingTime(events),
    };
  }, [events]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<ActivitySlotTelemetryConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Auto-export interval management
  useEffect(() => {
    if (currentConfig.export.autoExportInterval > 0) {
      autoExportIntervalRef.current = globalThis.setInterval(async () => {
        try {
          await exportTelemetry('json');
        } catch (err) {
          console.warn('[useActivitySlotTelemetry] Auto-export failed:', err);
        }
      }, currentConfig.export.autoExportInterval);
    } else {
      if (autoExportIntervalRef.current) {
        globalThis.clearInterval(autoExportIntervalRef.current);
        autoExportIntervalRef.current = null;
      }
    }

    return () => {
      if (autoExportIntervalRef.current) {
        globalThis.clearInterval(autoExportIntervalRef.current);
      }
    };
  }, [currentConfig.export.autoExportInterval, exportTelemetry]);

  // Emit mirror active event on mount
  useEffect(() => {
    if (currentConfig.enabled && !isLoading) {
      emitEvent(ACTIVITYSLOT_TELEMETRY_EVENTS.MIRROR_ACTIVE, {
        slotId: 'system',
        slotLabel: 'System',
        state: 'empty',
        lastStateChanged: Date.now(),
        timeInCurrentState: 0,
      }, {
        source: 'useActivitySlotTelemetry',
        context: 'system_init',
      });
    }
  }, [currentConfig.enabled, isLoading, emitEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        globalThis.clearTimeout(saveTimeoutRef.current);
      }
      if (autoExportIntervalRef.current) {
        globalThis.clearInterval(autoExportIntervalRef.current);
      }
    };
  }, []);

  return {
    events,
    isLoading,
    error,
    exportTelemetry,
    clearTelemetry,
    emitEvent,
    getStatistics,
    config: currentConfig,
    updateConfig,
    // Expose tracking methods for external usage
    trackSlotStateChange,
    trackResidentAssignment,
    trackResidentRemoval,
    trackDropAttempt,
    trackProgressUpdate,
    trackActivityCompletion,
  };
}

/**
 * Convert telemetry events to CSV format
 */
function convertToCSV(events: ActivitySlotTelemetryEvent[]): string {
  const headers = [
    'timestamp',
    'eventType',
    'sessionId',
    'slotId',
    'slotLabel',
    'state',
    'residentId',
    'residentName',
    'dropResult',
    'validationReason',
    'progressFraction',
    'elapsedSeconds',
    'totalSeconds',
    'source',
    'context',
    'processingTime',
  ];

  const rows = events.map(event => [
    event.timestamp,
    event.eventType,
    event.sessionId,
    event.data.slotId,
    event.data.slotLabel,
    event.data.state,
    event.data.resident?.id || '',
    event.data.resident?.displayName || '',
    event.data.dropResult || '',
    event.data.validationReason || '',
    event.data.progress?.fraction || '',
    event.data.progress?.elapsedSeconds || '',
    event.data.progress?.totalSeconds || '',
    event.metadata?.source || '',
    event.metadata?.context || '',
    event.metadata?.performance?.processingTime || '',
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Hook for subscribing to ActivitySlot telemetry events
 */
export function useActivitySlotTelemetrySubscriber(callback: (event: CustomEvent) => void) {
  const subscribe = useCallback(() => {
    const handler = (event: CustomEvent) => callback(event);

    window.addEventListener('activityslot-telemetry', handler as EventListener);

    return () => {
      window.removeEventListener('activityslot-telemetry', handler as EventListener);
    };
  }, [callback]);

  return { subscribe };
}
