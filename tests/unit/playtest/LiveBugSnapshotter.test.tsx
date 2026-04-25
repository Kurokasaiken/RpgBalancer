import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';

import { LiveBugSnapshotter } from '@/ui/playtest/LiveBugSnapshotter';
import type { PlaytestLogger } from '@/ui/playtest/systems/playtestLogger';
import type { PlaytestEvent, PlaytestSession } from '@/ui/playtest/config/playtestConfig';
import type { LiveSnapshotConfig } from '@/ui/playtest/playtestSnapshotConfig';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(),
  saveData: vi.fn(),
}));

type LoggerSubset = Pick<PlaytestLogger, 'getRecentEvents' | 'getCurrentSession' | 'getSessionStats'>;

const mockedLoadData = loadData as unknown as Mock;
const mockedSaveData = saveData as unknown as Mock;

const defaultEvents: PlaytestEvent[] = [
  {
    id: 'evt-1',
    timestamp: 1700000000000,
    type: 'tap',
    sessionId: 'session-1',
    userId: 'player-1',
    value: 'buttonA',
  },
];

const defaultSession: PlaytestSession = {
  id: 'session-1',
  startTime: 1700000000000,
  deviceInfo: {
    userAgent: 'test-agent',
    platform: 'test-platform',
    vendor: 'test-vendor',
    screenResolution: '100x100',
    colorDepth: 24,
    pixelRatio: 2,
    touchSupport: true,
    maxTouchPoints: 2,
  },
  events: defaultEvents,
  buildVersion: '1.0.0',
  platform: 'ios',
  completed: false,
  crashDetected: false,
  errorCount: 0,
  interactionCount: 1,
};

const defaultStats = {
  duration: 1000,
  eventCount: 5,
  interactionCount: 2,
  errorCount: 0,
  bugReportCount: 0,
  heatmapPointCount: 0,
};

function createLogger(overrides: Partial<LoggerSubset> = {}): PlaytestLogger {
  const base: LoggerSubset = {
    getRecentEvents: vi.fn(() => defaultEvents),
    getCurrentSession: vi.fn(() => defaultSession),
    getSessionStats: vi.fn(() => defaultStats),
    ...overrides,
  };

  return base as unknown as PlaytestLogger;
}

declare global {
  interface Navigator {
    connection?: any;
    getBattery?: () => Promise<{ level?: number }>;
  }
}

beforeAll(() => {
  const canvasProto = HTMLCanvasElement.prototype as HTMLCanvasElement;

  if (!canvasProto.toDataURL) {
    Object.defineProperty(canvasProto, 'toDataURL', {
      configurable: true,
      value: vi.fn(() => 'data:image/png;base64,canvas'),
    });
  }

  if (!canvasProto.getContext) {
    Object.defineProperty(canvasProto, 'getContext', {
      configurable: true,
      value: vi.fn((contextId: string) => (contextId === '2d' ? createCanvasContextStub() : null)),
    });
  } else {
    vi
      .spyOn(canvasProto, 'getContext')
      .mockImplementation((contextId: string) => (contextId === '2d' ? createCanvasContextStub() : null));
  }
});

beforeEach(() => {
  mockedLoadData.mockResolvedValue([]);
  mockedSaveData.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'connection', {
    value: { type: 'wifi', effectiveType: 'wifi', downlink: 100, rtt: 10 },
    configurable: true,
  });
  navigator.getBattery = vi.fn(async () => ({ level: 0.8 }));
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderWithCanvas(
  ui: React.ReactNode,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  return render(
    <div>
      <canvas ref={canvasRef} width={320} height={200} />
      {ui}
    </div>,
  );
}

function createCanvasContextStub(): CanvasRenderingContext2D {
  const metrics: TextMetrics = {
    width: 100,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 0,
    fontBoundingBoxAscent: 0,
    fontBoundingBoxDescent: 0,
    emHeightAscent: 0,
    emHeightDescent: 0,
    hangingBaseline: 0,
    alphabeticBaseline: 0,
    ideographicBaseline: 0,
  } as TextMetrics;

  const context = {
    canvas: document.createElement('canvas'),
    fillStyle: '#000000',
    globalAlpha: 1,
    font: '16px monospace',
    textBaseline: 'bottom',
    textAlign: 'left',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn(() => metrics),
  } as unknown as CanvasRenderingContext2D;

  return context;
}

describe('LiveBugSnapshotter', () => {
  it('queues snapshot with recent events and session metadata', async () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const logger = createLogger();
    const onSnapshotQueued = vi.fn();

    renderWithCanvas(
      <LiveBugSnapshotter
        targetRef={canvasRef}
        logger={logger}
        onSnapshotQueued={onSnapshotQueued}
        config={{ throttling: { minIntervalMs: 0, cooldownAfterFailureMs: 1000 } }}
      />,
      canvasRef,
    );

    const button = await screen.findByTestId('snapshot-button');
    fireEvent.click(button);

    await waitFor(() => expect(mockedSaveData).toHaveBeenCalledTimes(1));

    const [, savedQueue] = mockedSaveData.mock.calls[0];
    expect(Array.isArray(savedQueue)).toBe(true);
    expect(savedQueue).toHaveLength(1);

    const entry = savedQueue[0];
    expect(entry.payload.events).toEqual(defaultEvents);
    expect(entry.payload.screenshot.startsWith('data:image/')).toBe(true);
    expect(onSnapshotQueued).toHaveBeenCalledWith(entry);
  });

  it('blocks capture when Wi-Fi is required but not available', async () => {
    Object.defineProperty(navigator, 'connection', {
      value: { type: 'cellular', effectiveType: '4g' },
      configurable: true,
    });

    const canvasRef = createRef<HTMLCanvasElement>();
    const logger = createLogger();

    renderWithCanvas(
      <LiveBugSnapshotter
        targetRef={canvasRef}
        logger={logger}
        config={{ upload: { wifiOnly: true } as Partial<LiveSnapshotConfig>['upload'] }}
      />,
      canvasRef,
    );

    const button = await screen.findByTestId('snapshot-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('snapshot-error').textContent).toContain('Wi-Fi');
    });

    expect(mockedSaveData).not.toHaveBeenCalled();
  });

  it('honors disabled prop and prevents captures', async () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    const logger = createLogger();

    renderWithCanvas(
      <LiveBugSnapshotter targetRef={canvasRef} logger={logger} disabled />,
      canvasRef,
    );

    const button = await screen.findByTestId('snapshot-button');
    expect(button).toBeDisabled();
    fireEvent.click(button);

    await waitFor(() => expect(mockedSaveData).not.toHaveBeenCalled());
  });
});
