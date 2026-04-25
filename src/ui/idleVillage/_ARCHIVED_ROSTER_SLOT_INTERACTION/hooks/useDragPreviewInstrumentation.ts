import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { nanoid } from 'nanoid';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { dragPreviewInstrumentationAnalytics } from '@/analytics/idleVillageDragInstrumentation';
import type {
  DragPreviewMeasurement,
  DragPreviewMeasurementStatus,
  DragPreviewMetricPayload,
  DragPreviewMetricSource,
} from '@/analytics/idleVillageDragInstrumentation';
import { getDragPreviewInstrumentationConfig } from '@/ui/idleVillage/config/dragPreviewInstrumentationConfig';
import { FeatureFlags, isDevRuntime } from '@/shared/config/featureFlags';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

export interface DragPreviewInstrumentationState {
  enabled: boolean;
  pendingMeasurements: number;
  latestMeasurement?: DragPreviewMetricPayload;
  samples: DragPreviewMeasurement[];
}

export interface UseDragPreviewInstrumentationOptions {
  residentId?: string;
  activityId?: string;
  source?: DragPreviewMetricSource;
  metadata?: Record<string, unknown>;
}

export interface DragPreviewMeasurementContext {
  startTime: number;
  previewId?: string;
  residentId?: string;
  activityId?: string;
  source?: DragPreviewMetricSource;
  metadata?: Record<string, unknown>;
}

export interface DragPreviewMeasurementResult {
  previewId: string;
  measurement: DragPreviewMeasurement;
  status: DragPreviewMeasurementStatus;
  errors?: string[];
}

export interface UseDragPreviewInstrumentationHook {
  state: DragPreviewInstrumentationState;
  measurePreviewCreation: (context: DragPreviewMeasurementContext) => Promise<DragPreviewMeasurementResult | null>;
  setEnabled: (enabled: boolean) => Promise<void>;
}

const PREFERENCE_CACHE = new Map<string, boolean>();
const diagnostics = createSandboxDiagnostics('drag-preview-hook', 'instrumentation');

type StoreState = DragPreviewInstrumentationState;

let storeState: StoreState = {
  enabled: false,
  pendingMeasurements: 0,
  latestMeasurement: undefined,
  samples: [],
};

const storeListeners = new Set<() => void>();
let storeInitialized = false;
let preferenceInitialized = false;
let preferenceInitPromise: Promise<void> | null = null;
let activeMeasurementCount = 0;

const getStoreSnapshot = () => storeState;

const subscribeToStore = (listener: () => void) => {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
};

const updateStore = (updater: (state: StoreState) => StoreState) => {
  storeState = updater(storeState);
  storeListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      diagnostics.warn('store_listener_failed', { error });
    }
  });
};

const resolveDefaultEnabled = (): boolean => {
  const config = getDragPreviewInstrumentationConfig();
  if (config.devOnly && !isDevRuntime) {
    return false;
  }
  const flagDefault = FeatureFlags.idleVillage?.dragPreviewInstrumentation;
  return typeof flagDefault === 'boolean' ? flagDefault : config.enabledByDefault;
};

const ensureStoreInitialized = (): void => {
  if (storeInitialized) {
    return;
  }
  storeInitialized = true;
  storeState = {
    ...storeState,
    enabled: resolveDefaultEnabled(),
  };
};

async function loadPreference(persistenceKey: string, fallback: boolean): Promise<boolean> {
  if (PREFERENCE_CACHE.has(persistenceKey)) {
    return PREFERENCE_CACHE.get(persistenceKey) ?? fallback;
  }

  try {
    const value = await loadData<boolean>(persistenceKey, fallback);
    if (typeof value === 'boolean') {
      PREFERENCE_CACHE.set(persistenceKey, value);
      return value;
    }
  } catch (error) {
    diagnostics.warn('preference_load_failed', { error, persistenceKey });
  }

  PREFERENCE_CACHE.set(persistenceKey, fallback);
  return fallback;
}

const ensurePreferenceLoaded = (
  persistenceKey: string,
  fallback: boolean,
): Promise<void> | undefined => {
  if (preferenceInitialized) {
    return undefined;
  }

  if (!preferenceInitPromise) {
    preferenceInitPromise = (async () => {
      const value = await loadPreference(persistenceKey, fallback);
      preferenceInitialized = true;
      updateStore((state) => ({ ...state, enabled: value }));
    })()
      .catch((error) => {
        diagnostics.error('preference_load_unhandled', { error });
      })
      .finally(() => {
        preferenceInitPromise = null;
      });
  }

  return preferenceInitPromise;
};

async function persistPreference(persistenceKey: string, enabled: boolean): Promise<void> {
  PREFERENCE_CACHE.set(persistenceKey, enabled);
  try {
    await saveData(persistenceKey, enabled);
  } catch (error) {
    diagnostics.error('preference_save_failed', { error, persistenceKey, enabled });
  }
}

export function useDragPreviewInstrumentation(
  options: UseDragPreviewInstrumentationOptions = {},
): UseDragPreviewInstrumentationHook {
  ensureStoreInitialized();

  const config = useMemo(() => getDragPreviewInstrumentationConfig(), []);
  const { persistenceKey, devOnly, enabledByDefault } = config;

  const state = useSyncExternalStore(subscribeToStore, getStoreSnapshot, getStoreSnapshot);

  useEffect(() => {
    if (devOnly && !isDevRuntime) {
      updateStore((prev) => ({ ...prev, enabled: false }));
      return;
    }
    ensurePreferenceLoaded(persistenceKey, enabledByDefault);
  }, [devOnly, enabledByDefault, persistenceKey]);

  const measurePreviewCreation = useCallback<
    UseDragPreviewInstrumentationHook['measurePreviewCreation']
  >(async ({ startTime, previewId = nanoid(), residentId, activityId, source, metadata }) => {
    if (!state.enabled || (devOnly && !isDevRuntime)) {
      return null;
    }

    if (activeMeasurementCount >= config.maxConcurrentMeasurements) {
      diagnostics.warn('max_measurements_exceeded', {
        previewId,
        limit: config.maxConcurrentMeasurements,
      });
      return null;
    }

    if (typeof performance === 'undefined') {
      diagnostics.warn('frame_sampling_unavailable');
      return null;
    }

    const hasWindow = typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined';
    if (!hasWindow) {
      diagnostics.warn('frame_sampling_unavailable');
      return null;
    }

    activeMeasurementCount += 1;
    updateStore((prev) => ({
      ...prev,
      pendingMeasurements: prev.pendingMeasurements + 1,
    }));

    const creationDurationMs = performance.now() - startTime;
    const frameDurations: number[] = [];
    const errors: string[] = [];
    let status: DragPreviewMeasurementStatus = 'success';
    let timeToFirstPaintMs: number | undefined;
    let frameBudgetBreached = false;
    let longFrameCount = 0;

    const waitForNextFrame = (controller: AbortController) =>
      new Promise<number>((resolve, reject) => {
        const handle = requestAnimationFrame((timestamp) => {
          resolve(timestamp);
        });

        controller.signal.addEventListener(
          'abort',
          () => {
            cancelAnimationFrame(handle);
            reject(new Error('frame_sample_timeout'));
          },
          { once: true },
        );
      });

    try {
      let lastFrameTimestamp = performance.now();
      for (let i = 0; i < config.sampleFrameCount; i += 1) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => {
          controller.abort();
        }, config.sampleTimeoutMs);

        const nextFrameTimestamp = await waitForNextFrame(controller).finally(() => {
          window.clearTimeout(timeoutId);
        });

        const frameDuration = nextFrameTimestamp - lastFrameTimestamp;
        if (i === 0) {
          timeToFirstPaintMs = frameDuration;
        }
        frameDurations.push(frameDuration);
        lastFrameTimestamp = nextFrameTimestamp;

        if (frameDuration >= config.thresholds.longFrameThresholdMs) {
          longFrameCount += 1;
        }

        if (frameDuration >= config.thresholds.frameErrorBudgetMs) {
          frameBudgetBreached = true;
        }
      }
    } catch (error) {
      status = error instanceof Error && error.message === 'frame_sample_timeout' ? 'timeout' : 'error';
      errors.push(error instanceof Error ? error.message : 'unknown_error');
      diagnostics.error('frame_sampling_failed', { error });
    }

    const measurement: DragPreviewMeasurement = {
      creationDurationMs,
      frameDurationsMs: frameDurations,
      timeToFirstPaintMs,
      longFrameCount,
      frameBudgetBreached,
    };

    const payload: DragPreviewMetricPayload = {
      previewId,
      residentId: residentId ?? options.residentId,
      activityId: activityId ?? options.activityId,
      source: source ?? options.source ?? 'unknown',
      status,
      measurement,
      metadata: metadata ?? options.metadata,
      errors: errors.length ? errors : undefined,
    };

    updateStore((prev) => {
      const nextSamples = [measurement, ...prev.samples].slice(0, config.indicator.maxSamples);
      return {
        ...prev,
        latestMeasurement: payload,
        samples: nextSamples,
      };
    });

    dragPreviewInstrumentationAnalytics.recordMetric(payload);

    updateStore((prev) => ({
      ...prev,
      pendingMeasurements: Math.max(prev.pendingMeasurements - 1, 0),
    }));
    activeMeasurementCount = Math.max(activeMeasurementCount - 1, 0);

    return {
      previewId,
      measurement,
      status,
      errors: errors.length ? errors : undefined,
    };
  }, [config.indicator.maxSamples, config.maxConcurrentMeasurements, config.sampleFrameCount, config.sampleTimeoutMs, config.thresholds.frameErrorBudgetMs, config.thresholds.longFrameThresholdMs, devOnly, options.activityId, options.metadata, options.residentId, options.source, state.enabled]);

  const setEnabled = useCallback<UseDragPreviewInstrumentationHook['setEnabled']>(async (nextEnabled) => {
    if (devOnly && !isDevRuntime) {
      updateStore((prev) => ({ ...prev, enabled: false }));
      return;
    }

    updateStore((prev) => ({ ...prev, enabled: nextEnabled }));
    await persistPreference(persistenceKey, nextEnabled);
  }, [devOnly, persistenceKey]);

  return {
    state,
    measurePreviewCreation,
    setEnabled,
  };
}
