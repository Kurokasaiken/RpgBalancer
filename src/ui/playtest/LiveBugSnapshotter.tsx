import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';

import {
  DEFAULT_LIVE_SNAPSHOT_CONFIG,
  type LiveSnapshotConfig,
} from './playtestSnapshotConfig';
import {
  getPlaytestLogger,
  type PlaytestLogger,
} from './systems/playtestLogger';
import type {
  PlaytestEvent,
  PlaytestSession,
} from './config/playtestConfig';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

export type SnapshotStatus = 'pending' | 'blocked';

export interface SnapshotMetadata {
  sessionId?: string;
  userId?: string;
  platform?: string;
  buildVersion?: string;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  batteryPercent?: number;
  isDeviceIdle?: boolean;
}

export interface SnapshotPayload {
  id: string;
  createdAt: number;
  screenshot: string;
  events: PlaytestEvent[];
  eventSummary: string[];
  session?: PlaytestSession | null;
  stats?: SnapshotStats;
}

export interface SnapshotQueueEntry {
  id: string;
  status: SnapshotStatus;
  attempts: number;
  nextAttemptAt: number;
  metadata: SnapshotMetadata;
  payload: SnapshotPayload;
}

type SnapshotStats = ReturnType<PlaytestLogger['getSessionStats']>;

const DEFAULT_QUEUE: SnapshotQueueEntry[] = [];

export interface LiveBugSnapshotterProps {
  /** Optional ref to the canvas/element to capture */
  targetRef?: RefObject<HTMLElement>;
  /** CSS selector fallback when ref is not provided */
  targetSelector?: string;
  /** Override logger instance (otherwise global singleton is used) */
  logger?: PlaytestLogger;
  /** Partial config overrides */
  config?: Partial<LiveSnapshotConfig>;
  /** Optional callback when snapshot is queued */
  onSnapshotQueued?: (entry: SnapshotQueueEntry) => void;
  /** Additional class name for wrapper */
  className?: string;
  /** Custom button label */
  buttonLabel?: string;
  /** Disable interactions externally */
  disabled?: boolean;
}

export function LiveBugSnapshotter({
  targetRef,
  targetSelector = 'canvas',
  logger,
  config,
  onSnapshotQueued,
  className,
  buttonLabel = '📸 Snapshot',
  disabled = false,
}: LiveBugSnapshotterProps): React.JSX.Element {
  const resolvedConfig = useMemo(
    () => mergeSnapshotConfig(DEFAULT_LIVE_SNAPSHOT_CONFIG, config),
    [config],
  );

  const loggerInstance = useMemo(() => logger ?? getPlaytestLogger(), [logger]);
  const [queueSize, setQueueSize] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCaptureRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const queue = await loadQueue(resolvedConfig.upload.persistenceKey);
        if (!cancelled && mountedRef.current) {
          setQueueSize(queue.length);
        }
      } catch {
        // Ignore load errors; UI will retry on next capture.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedConfig.upload.persistenceKey]);

  const handleSnapshot = useCallback(async () => {
    if (!resolvedConfig.enabled) {
      setError('Snapshotter disabled via config');
      return;
    }
    if (disabled) {
      return;
    }
    if (isCapturing) {
      return;
    }

    const now = Date.now();
    if (now - lastCaptureRef.current < resolvedConfig.throttling.minIntervalMs) {
      const remaining = resolvedConfig.throttling.minIntervalMs - (now - lastCaptureRef.current);
      setError(`Please wait ${Math.ceil(remaining / 1000)}s before capturing again.`);
      return;
    }

    if (cooldownUntilRef.current > now) {
      const wait = Math.ceil((cooldownUntilRef.current - now) / 1000);
      setError(`Snapshot temporarily blocked. Retry in ${wait}s.`);
      return;
    }

    const connection = getNavigatorConnection();
    if (resolvedConfig.upload.wifiOnly && connection && !isWifiConnection(connection)) {
      setError('Wi-Fi required for snapshot upload.');
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const target = resolveTargetElement(targetRef, targetSelector);
      if (!target) {
        throw new Error('Snapshot target not found');
      }

      const screenshot = await captureElement(target, resolvedConfig);
      const events = loggerInstance?.getRecentEvents(resolvedConfig.maxBufferedEvents) ?? [];
      const session = loggerInstance?.getCurrentSession() ?? null;
      const stats = loggerInstance?.getSessionStats();
      const batteryPercent = await getBatteryPercent();
      const metadata: SnapshotMetadata = {
        sessionId: session?.id,
        userId: session?.userId,
        platform: session?.platform,
        buildVersion: session?.buildVersion,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        batteryPercent,
        isDeviceIdle: document.visibilityState === 'hidden',
      };

      const queue = await loadQueue(resolvedConfig.upload.persistenceKey);
      const entry: SnapshotQueueEntry = {
        id: `snapshot_${now}_${Math.random().toString(36).slice(2, 6)}`,
        status: shouldBlockUpload(metadata, resolvedConfig) ? 'blocked' : 'pending',
        attempts: 0,
        nextAttemptAt: now,
        metadata,
        payload: {
          id: session?.id ?? `snapshot-${now}`,
          createdAt: now,
          screenshot,
          events,
          eventSummary: buildEventSummary(events, resolvedConfig.logging.maxConsoleLines),
          session,
          stats,
        },
      };

      const nextQueue = [...queue, entry];
      while (nextQueue.length > resolvedConfig.upload.maxQueuedSnapshots) {
        nextQueue.shift();
      }

      await saveQueue(resolvedConfig.upload.persistenceKey, nextQueue);
      if (mountedRef.current) {
        setQueueSize(nextQueue.length);
        setIsCapturing(false);
        lastCaptureRef.current = now;
      }
      onSnapshotQueued?.(entry);
    } catch (snapshotError) {
      const message = snapshotError instanceof Error ? snapshotError.message : 'Snapshot failed';
      if (mountedRef.current) {
        setError(message);
        setIsCapturing(false);
        cooldownUntilRef.current = Date.now() + resolvedConfig.throttling.cooldownAfterFailureMs;
      }
    }
  }, [
    resolvedConfig,
    disabled,
    isCapturing,
    targetRef,
    targetSelector,
    loggerInstance,
    onSnapshotQueued,
  ]);

  const buttonDisabled = disabled || !resolvedConfig.enabled || isCapturing;

  return (
    <div className={`live-bug-snapshotter ${className ?? ''}`} data-testid="live-bug-snapshotter">
      <button
        type="button"
        className="snapshot-button"
        onClick={handleSnapshot}
        disabled={buttonDisabled}
        aria-busy={isCapturing}
        data-testid="snapshot-button"
      >
        {isCapturing ? 'Capturing…' : buttonLabel}
      </button>

      <div className="snapshot-meta" data-testid="snapshot-meta">
        <span>Queued snapshots: {queueSize}</span>
        {error && (
          <span className="snapshot-error" role="alert" data-testid="snapshot-error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

async function loadQueue(key: string): Promise<SnapshotQueueEntry[]> {
  try {
    return await loadData<SnapshotQueueEntry[]>(key, DEFAULT_QUEUE);
  } catch {
    return [...DEFAULT_QUEUE];
  }
}

async function saveQueue(key: string, queue: SnapshotQueueEntry[]): Promise<void> {
  await saveData(key, queue);
}

function mergeSnapshotConfig(
  base: LiveSnapshotConfig,
  overrides?: Partial<LiveSnapshotConfig>,
): LiveSnapshotConfig {
  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
    screenshot: {
      ...base.screenshot,
      ...(overrides.screenshot ?? {}),
      watermark: overrides.screenshot?.watermark ?? base.screenshot.watermark,
    },
    upload: {
      ...base.upload,
      ...(overrides.upload ?? {}),
      retry: {
        ...base.upload.retry,
        ...(overrides.upload?.retry ?? {}),
      },
    },
    throttling: {
      ...base.throttling,
      ...(overrides.throttling ?? {}),
    },
    logging: {
      ...base.logging,
      ...(overrides.logging ?? {}),
    },
  };
}

function resolveTargetElement(
  targetRef?: RefObject<HTMLElement>,
  selector?: string,
): HTMLCanvasElement | HTMLVideoElement | null {
  if (targetRef?.current) {
    return normalizeTarget(targetRef.current);
  }

  if (selector && typeof document !== 'undefined') {
    const candidate = document.querySelector<HTMLElement>(selector);
    if (candidate) {
      return normalizeTarget(candidate);
    }
  }

  return null;
}

function normalizeTarget(element: HTMLElement): HTMLCanvasElement | HTMLVideoElement | null {
  if (element instanceof HTMLCanvasElement) {
    return element;
  }
  if (element instanceof HTMLVideoElement) {
    return element;
  }
  const canvas = element.querySelector('canvas');
  if (canvas) {
    return canvas;
  }
  return null;
}

async function captureElement(
  element: HTMLCanvasElement | HTMLVideoElement,
  config: LiveSnapshotConfig,
): Promise<string> {
  if (element instanceof HTMLCanvasElement) {
    return captureCanvas(element, config.screenshot);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to acquire canvas context');
  }

  canvas.width = element.videoWidth || element.clientWidth || 1280;
  canvas.height = element.videoHeight || element.clientHeight || 720;
  ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
  return captureCanvas(canvas, config.screenshot);
}

function captureCanvas(
  source: HTMLCanvasElement,
  options: LiveSnapshotConfig['screenshot'],
): string {
  const scale = options.scale ?? 1;
  const padding = options.padding ?? 0;
  const width = (source.width || source.clientWidth || 1280) * scale + padding * 2;
  const height = (source.height || source.clientHeight || 720) * scale + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create drawing context');
  }

  ctx.fillStyle = options.backgroundColor ?? '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, padding, padding, canvas.width - padding * 2, canvas.height - padding * 2);

  if (options.watermark) {
    addWatermark(ctx, canvas, options.watermark);
  }

  const type = `image/${options.format ?? 'png'}`;
  return canvas.toDataURL(type, options.quality ?? 0.92);
}

function addWatermark(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  watermark: NonNullable<LiveSnapshotConfig['screenshot']['watermark']>,
): void {
  ctx.save();
  ctx.globalAlpha = watermark.opacity ?? 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';

  const padding = 16;
  let x = padding;
  let y = canvas.height - padding;

  switch (watermark.position) {
    case 'top-left':
      y = padding + 16;
      break;
    case 'top-right':
      x = canvas.width - ctx.measureText(watermark.text).width - padding;
      y = padding + 16;
      break;
    case 'bottom-right':
      x = canvas.width - ctx.measureText(watermark.text).width - padding;
      break;
    case 'bottom-left':
    default:
      break;
  }

  ctx.fillText(watermark.text, x, y);
  ctx.restore();
}

function shouldBlockUpload(
  metadata: SnapshotMetadata,
  config: LiveSnapshotConfig,
): boolean {
  if (config.upload.wifiOnly) {
    const type = metadata.connectionType || metadata.effectiveType;
    if (type && !isWifiType(type)) {
      return true;
    }
  }

  if (
    typeof metadata.batteryPercent === 'number' &&
    metadata.batteryPercent < config.upload.minBatteryPercent
  ) {
    return true;
  }

  return false;
}

type NavigatorWithConnection = Navigator & {
  connection?: {
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
};

interface SimpleNetworkInformation {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

function getNavigatorConnection(): SimpleNetworkInformation | null {
  if (typeof navigator === 'undefined') {
    return null;
  }
  return (navigator as NavigatorWithConnection).connection ?? null;
}

function isWifiConnection(connection: SimpleNetworkInformation | null): boolean {
  if (!connection) {
    return false;
  }
  return isWifiType(connection.type || connection.effectiveType || '');
}

function isWifiType(type: string): boolean {
  return type === 'wifi' || type === 'ethernet';
}

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<{ level?: number }>;
};

async function getBatteryPercent(): Promise<number | undefined> {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  try {
    const nav = navigator as NavigatorWithBattery;
    if (typeof nav.getBattery !== 'function') {
      return undefined;
    }
    const battery = await nav.getBattery();
    return Math.round(((battery.level ?? 1) as number) * 100);
  } catch {
    return undefined;
  }
}

function buildEventSummary(events: PlaytestEvent[], limit: number): string[] {
  return events.slice(-limit).map((event) => {
    const timestamp = new Date(event.timestamp).toISOString();
    const value = typeof event.value === 'object' ? JSON.stringify(event.value) : event.value;
    return `${timestamp} • ${event.type}${value ? ` → ${value}` : ''}`;
  });
}
