import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import type { DragDropTelemetryPayload } from '@/ui/idleVillage/utils/dragDropTelemetry';
import {
  DEFAULT_DROP_TIMELINE_FILTERS,
  type DropTimelineData,
  type DropTimelineFilters,
  buildDropTimelineData,
  exportDropTimelineCSV,
  exportDropTimelineJSON,
  emitDropTimelineTelemetry,
} from '@/analytics/idleVillageDropTimeline';

const DEFAULT_STORAGE_KEY = 'idle-village-drop-timeline-filters';
const DEFAULT_AUTO_REFRESH_INTERVAL_MS = 15_000;

interface PersistedFiltersPayload {
  filters: DropTimelineFilters;
  updatedAt: number;
}

export interface UseDropTimelineDataOptions {
  storageKey?: string;
  /** Optional seed events (e.g., fixture or SSR data). */
  initialEvents?: DragDropTelemetryPayload[];
  /** Partial filters merged with persisted/default filters. */
  initialFilters?: Partial<DropTimelineFilters>;
  /** Provider for live telemetry events (synchronous or async). */
  getTelemetryEvents?: () => DragDropTelemetryPayload[] | Promise<DragDropTelemetryPayload[]>;
  /** Interval for auto-refresh; set to null to disable. */
  autoRefreshMs?: number | null;
}

export interface UseDropTimelineDataReturn {
  data: DropTimelineData | null;
  filters: DropTimelineFilters;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  updateFilters: (partial: Partial<DropTimelineFilters>) => void;
  resetFilters: () => void;
  ingestEvents: (events: DragDropTelemetryPayload[]) => void;
  refresh: () => Promise<void>;
  exportAsJSON: () => string | null;
  exportAsCSV: () => string | null;
}

/**
 * React hook that builds Drop Timeline analytics data, persists filters with PersistenceService,
 * and emits panel telemetry for view/export events.
 */
export function useDropTimelineData(options: UseDropTimelineDataOptions = {}): UseDropTimelineDataReturn {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    initialEvents = [],
    initialFilters = {},
    getTelemetryEvents,
    autoRefreshMs = DEFAULT_AUTO_REFRESH_INTERVAL_MS,
  } = options;

  const [rawEvents, setRawEvents] = useState<DragDropTelemetryPayload[]>(initialEvents);
  const [filters, setFilters] = useState<DropTimelineFilters>(() => mergeFilters(initialFilters, DEFAULT_DROP_TIMELINE_FILTERS));
  const [filtersReady, setFiltersReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const viewSignatureRef = useRef<string | null>(null);

  const data = useMemo<DropTimelineData | null>(() => {
    try {
      return buildDropTimelineData(rawEvents, filters);
    } catch (err) {
      console.warn('[useDropTimelineData] Failed to build timeline data', err);
      setError('Failed to process drop telemetry');
      return null;
    }
  }, [rawEvents, filters]);

  // Lazy load filters from persistence on mount.
  useEffect(() => {
    let cancelled = false;
    const loadFilters = async () => {
      try {
        const saved = await loadData<PersistedFiltersPayload | DropTimelineFilters>(storageKey, DEFAULT_DROP_TIMELINE_FILTERS);
        if (cancelled) return;
        const normalized = normalizePersistedFilters(saved);
        setFilters((current) => mergeFilters(initialFilters, normalized ?? current));
      } catch (err) {
        console.warn('[useDropTimelineData] Failed to load filters, using defaults', err);
        setFilters((current) => mergeFilters(initialFilters, current));
      } finally {
        if (!cancelled) {
          setFiltersReady(true);
        }
      }
    };

    loadFilters();
    return () => {
      cancelled = true;
    };
  }, [storageKey, initialFilters]);

  // Persist filters whenever they change after initial load.
  useEffect(() => {
    if (!filtersReady) return;
    const payload: PersistedFiltersPayload = {
      filters,
      updatedAt: Date.now(),
    };
    saveData(storageKey, payload).catch((err) => {
      console.warn('[useDropTimelineData] Failed to persist filters', err);
    });
  }, [filters, filtersReady, storageKey]);

  const refresh = useCallback(async () => {
    if (!getTelemetryEvents) {
      setLastUpdated(Date.now());
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const events = await Promise.resolve(getTelemetryEvents());
      setRawEvents(events);
      setLastUpdated(Date.now());
    } catch (err) {
      console.warn('[useDropTimelineData] Failed to refresh telemetry', err);
      setError('Unable to load drop telemetry');
    } finally {
      setIsLoading(false);
    }
  }, [getTelemetryEvents]);

  // Optional auto-refresh polling.
  useEffect(() => {
    if (!getTelemetryEvents || !autoRefreshMs || autoRefreshMs <= 0) {
      return;
    }
    const interval = window.setInterval(() => {
      refresh().catch((err) => console.warn('[useDropTimelineData] Auto-refresh error', err));
    }, autoRefreshMs);
    return () => {
      window.clearInterval(interval);
    };
  }, [autoRefreshMs, getTelemetryEvents, refresh]);

  // Emit view telemetry when dataset or filters change meaningfully.
  useEffect(() => {
    if (!data) return;
    const signature = JSON.stringify({
      sessions: data.metrics.sessionCount,
      events: data.metrics.totalEvents,
      filters,
    });
    if (viewSignatureRef.current === signature) return;
    viewSignatureRef.current = signature;
    emitDropTimelineTelemetry('idle_drop_timeline_viewed', {
      sessionCount: data.metrics.sessionCount,
      totalEvents: data.metrics.totalEvents,
      showBlockedOnly: filters.showBlockedOnly,
      contexts: filters.contexts,
      timeWindowHours: filters.timeWindowHours,
    });
  }, [data, filters]);

  const updateFilters = useCallback((partial: Partial<DropTimelineFilters>) => {
    setFilters((current) => mergeFilters(partial, current));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(mergeFilters(initialFilters, DEFAULT_DROP_TIMELINE_FILTERS));
  }, [initialFilters]);

  const ingestEvents = useCallback((events: DragDropTelemetryPayload[]) => {
    setRawEvents(events ?? []);
    setLastUpdated(Date.now());
  }, []);

  const exportAsJSON = useCallback(() => {
    if (!data) return null;
    const payload = exportDropTimelineJSON(data);
    emitDropTimelineTelemetry('idle_drop_timeline_exported', buildExportTelemetry('json', data, filters));
    return payload;
  }, [data, filters]);

  const exportAsCSV = useCallback(() => {
    if (!data) return null;
    const payload = exportDropTimelineCSV(data);
    emitDropTimelineTelemetry('idle_drop_timeline_exported', buildExportTelemetry('csv', data, filters));
    return payload;
  }, [data, filters]);

  return {
    data,
    filters,
    isLoading,
    error,
    lastUpdated,
    updateFilters,
    resetFilters,
    ingestEvents,
    refresh,
    exportAsJSON,
    exportAsCSV,
  };
}

const mergeFilters = (
  overrides: Partial<DropTimelineFilters>,
  base: DropTimelineFilters,
): DropTimelineFilters => {
  const merged = {
    ...base,
    ...overrides,
  } as DropTimelineFilters;
  if (!merged.contexts || merged.contexts.length === 0) {
    merged.contexts = DEFAULT_DROP_TIMELINE_FILTERS.contexts;
  }
  return merged;
};

const normalizePersistedFilters = (
  payload: PersistedFiltersPayload | DropTimelineFilters,
): DropTimelineFilters | null => {
  if (!payload) return null;
  if ('filters' in payload && payload.filters) {
    return mergeFilters(payload.filters, DEFAULT_DROP_TIMELINE_FILTERS);
  }
  return mergeFilters(payload, DEFAULT_DROP_TIMELINE_FILTERS);
};

const buildExportTelemetry = (
  format: 'json' | 'csv',
  data: DropTimelineData,
  filters: DropTimelineFilters,
) => ({
  format,
  sessionCount: data.metrics.sessionCount,
  totalEvents: data.metrics.totalEvents,
  filterSummary: {
    residentIds: filters.residentIds.length,
    activityIds: filters.activityIds.length,
    showBlockedOnly: filters.showBlockedOnly,
    timeWindowHours: filters.timeWindowHours,
  },
});
