import { renderHook, act, waitFor } from '@testing-library/react';
import type { MockedFunction } from 'vitest';
import { describe, it, beforeEach, afterEach, beforeAll, afterAll, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';

const recordMetricMock = vi.fn();

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(),
  saveData: vi.fn(),
}));

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('@/analytics/idleVillageDragInstrumentation', () => ({
  dragPreviewInstrumentationAnalytics: {
    recordMetric: recordMetricMock,
  },
}));

type HookModule = typeof import('@/ui/idleVillage/hooks/useDragPreviewInstrumentation');
type ConfigModule = typeof import('@/ui/idleVillage/config/dragPreviewInstrumentationConfig');
type PersistenceModule = typeof import('@/shared/persistence/PersistenceService');

describe('useDragPreviewInstrumentation', () => {
  let jsdom: JSDOM;

  beforeAll(() => {
    jsdom = new JSDOM('<!doctype html><html><body></body></html>');
    (globalThis as any).window = jsdom.window;
    (globalThis as any).document = jsdom.window.document;
    (globalThis as any).navigator = jsdom.window.navigator;
    (globalThis as any).HTMLElement = jsdom.window.HTMLElement;
    (globalThis as any).CustomEvent = jsdom.window.CustomEvent;
  });

  afterAll(() => {
    jsdom.window.close();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).navigator;
    delete (globalThis as any).HTMLElement;
    delete (globalThis as any).CustomEvent;
  });

  let useDragPreviewInstrumentation: HookModule['useDragPreviewInstrumentation'];
  let overrideDragPreviewInstrumentationConfig: ConfigModule['overrideDragPreviewInstrumentationConfig'];
  let resetDragPreviewInstrumentationConfig: ConfigModule['resetDragPreviewInstrumentationConfig'];
  let loadData: MockedFunction<PersistenceModule['loadData']>;
  let saveData: MockedFunction<PersistenceModule['saveData']>;
  let originalWindow: typeof globalThis.window;
  let originalPerformance: typeof globalThis.performance;

  beforeEach(async () => {
    vi.resetModules();
    recordMetricMock.mockReset();

    const hookModule = await import('@/ui/idleVillage/hooks/useDragPreviewInstrumentation');
    const configModule = await import('@/ui/idleVillage/config/dragPreviewInstrumentationConfig');
    const persistenceModule = await import('@/shared/persistence/PersistenceService');

    useDragPreviewInstrumentation = hookModule.useDragPreviewInstrumentation;
    overrideDragPreviewInstrumentationConfig =
      configModule.overrideDragPreviewInstrumentationConfig;
    resetDragPreviewInstrumentationConfig = configModule.resetDragPreviewInstrumentationConfig;
    loadData = persistenceModule.loadData as MockedFunction<typeof persistenceModule.loadData>;
    saveData = persistenceModule.saveData as MockedFunction<typeof persistenceModule.saveData>;

    overrideDragPreviewInstrumentationConfig({
      devOnly: false,
      enabledByDefault: true,
      sampleFrameCount: 2,
      sampleTimeoutMs: 25,
      maxConcurrentMeasurements: 4,
      thresholds: {
        creationBudgetMs: 6,
        frameWarningBudgetMs: 12,
        frameErrorBudgetMs: 18,
        longFrameThresholdMs: 14,
      },
      indicator: {
        enabled: true,
        maxSamples: 4,
      },
      telemetry: {
        channel: 'drag_preview_metric',
        maxEvents: 50,
      },
    });

    loadData.mockReset();
    loadData.mockResolvedValue(true);
    saveData.mockReset();

    originalWindow = globalThis.window;
    originalPerformance = globalThis.performance;

    let nowValue = 0;
    const performanceNow = vi.fn(() => {
      nowValue += 5;
      return nowValue;
    });

    Object.defineProperty(globalThis, 'performance', {
      value: { now: performanceNow },
      configurable: true,
    });

    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const handle = Math.floor(Math.random() * 10_000);
      setTimeout(() => {
        callback(performanceNow());
      }, 0);
      return handle;
    });

    const cancelAnimationFrame = vi.fn();

    Object.assign(globalThis.window, {
      requestAnimationFrame,
      cancelAnimationFrame,
    });
  });

  afterEach(() => {
    resetDragPreviewInstrumentationConfig();

    if (originalWindow) {
      (globalThis as any).window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }

    if (originalPerformance) {
      Object.defineProperty(globalThis, 'performance', {
        value: originalPerformance,
        configurable: true,
      });
    } else {
      delete (globalThis as any).performance;
    }
  });

  it('collects drag preview metrics when enabled', async () => {
    const { result } = renderHook(() =>
      useDragPreviewInstrumentation({ residentId: 'resident-1', source: 'pg_card' }),
    );

    await act(async () => {
      await waitFor(() => expect(result.current.state.enabled).toBe(true));
    });

    let measurementResult: Awaited<ReturnType<typeof result.current.measurePreviewCreation>> | null =
      null;

    await act(async () => {
      measurementResult = await result.current.measurePreviewCreation({ startTime: 0 });
    });

    expect(measurementResult).not.toBeNull();
    expect(measurementResult?.measurement.frameDurationsMs).toHaveLength(2);
    await waitFor(() => expect(result.current.state.latestMeasurement).toBeDefined());
    expect(recordMetricMock).toHaveBeenCalledTimes(1);
  });

  it('persists toggle state changes via PersistenceService', async () => {
    const { result } = renderHook(() => useDragPreviewInstrumentation());

    await waitFor(() => expect(result.current.state.enabled).toBe(true));

    await act(async () => {
      await result.current.setEnabled(false);
    });

    expect(saveData).toHaveBeenCalledWith('idleVillage.dragPreviewInstrumentation', false);
    expect(result.current.state.enabled).toBe(false);
  });
});
