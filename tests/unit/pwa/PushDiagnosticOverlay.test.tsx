import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PushDiagnosticOverlay } from '@/ui/pwa/PushDiagnosticOverlay';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

const mockSWHook = {
  updateStatus: null as null | {
    updateAvailable: boolean;
    currentVersion?: string;
    availableVersion?: string;
    lastChecked?: number;
  },
  checkForUpdates: vi.fn(),
};

vi.mock('@/ui/pwa/hooks/useSWVersionManager', () => ({
  useSWVersionManager: () => mockSWHook,
}));

const mockTrackTelemetryEvent = vi.mocked(trackTelemetryEvent);
const mockSaveData = vi.mocked(saveData);
const mockLoadData = vi.mocked(loadData);

const MOCK_VAPID_KEY = 'aGVsbG8gd29ybGQ='; // "hello world" base64

const mockRequestPermission = vi.fn<() => Promise<NotificationPermission>>();
let notificationPermission: NotificationPermission = 'default';

const notificationMock = {
  requestPermission: mockRequestPermission,
};

Object.defineProperty(notificationMock, 'permission', {
  get: () => notificationPermission,
  set: (value: NotificationPermission) => {
    notificationPermission = value;
  },
});

Object.defineProperty(globalThis, 'Notification', {
  configurable: true,
  value: notificationMock,
});

const ensureAtob = () => {
  const polyfill = (input: string) => Buffer.from(input, 'base64').toString('binary');
  if (!globalThis.atob) {
    globalThis.atob = polyfill;
  }
  if (typeof window !== 'undefined' && !window.atob) {
    window.atob = polyfill;
  }
};

ensureAtob();

const mockPostMessage = vi.fn();
const mockGetSubscription = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

const createServiceWorkerRegistration = () => ({
  pushManager: {
    getSubscription: mockGetSubscription,
    subscribe: mockSubscribe,
  },
  active: {
    postMessage: mockPostMessage,
  },
});

const buildServiceWorkerContainer = (): ServiceWorkerContainer => {
  const controller = {
    postMessage: mockPostMessage,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    state: 'activated' as ServiceWorkerState,
    scriptURL: '/mock-sw.js',
    onstatechange: null,
  } as unknown as ServiceWorker;

  const container = {
    ready: Promise.resolve(createServiceWorkerRegistration()),
    controller,
    oncontrollerchange: null,
    onmessage: null,
    onmessageerror: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    getRegistration: vi.fn(),
    getRegistrations: vi.fn(),
    register: vi.fn(),
    startMessages: vi.fn(),
  } as unknown as ServiceWorkerContainer;

  return container;
};

const setServiceWorkerMocks = () => {
  const container = buildServiceWorkerContainer();

  Object.defineProperty(globalThis.navigator, 'serviceWorker', {
    configurable: true,
    value: container,
  });

  if (typeof window !== 'undefined') {
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: container,
    });
  }
};

describe('PushDiagnosticOverlay', () => {
  beforeEach(() => {
    notificationPermission = 'default';
    mockRequestPermission.mockResolvedValue('granted');

    mockPostMessage.mockReset();
    mockGetSubscription.mockReset();
    mockSubscribe.mockReset();
    mockUnsubscribe.mockReset();
    mockTrackTelemetryEvent.mockReset();
    mockSaveData.mockReset();
    mockLoadData.mockReset();
    mockSWHook.checkForUpdates.mockReset();

    mockLoadData.mockResolvedValue({ visible: true, pinnedStrategyId: 'aggressive' });
    mockSaveData.mockResolvedValue(undefined);

    const expirationTime = Date.now() + 60_000;
    mockGetSubscription.mockResolvedValue({
      endpoint: 'https://push.example/endpoint/123',
      expirationTime,
      unsubscribe: mockUnsubscribe,
    });
    mockSubscribe.mockResolvedValue({
      endpoint: 'https://push.example/new-endpoint',
      expirationTime: expirationTime + 120_000,
    });
    mockUnsubscribe.mockResolvedValue(true);

    mockSWHook.updateStatus = {
      updateAvailable: false,
      currentVersion: '1.0.0',
      availableVersion: '1.0.0',
      lastChecked: Date.now(),
    };

    setServiceWorkerMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all diagnostic sections once persistence completes', async () => {
    render(<PushDiagnosticOverlay />);

    await waitFor(() => expect(screen.getByTestId('push-diagnostic-overlay')).toBeInTheDocument());
    expect(screen.getByText('Permessi')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Fallback & Retry')).toBeInTheDocument();
    expect(screen.getByText('Service Worker')).toBeInTheDocument();
  });

  it('persists overlay visibility when toggled', async () => {
    render(<PushDiagnosticOverlay />);
    await screen.findByTestId('push-diagnostic-overlay');

    await userEvent.click(screen.getByRole('button', { name: /Nascondi/i }));

    await waitFor(() => expect(screen.getByText('Mostra Push Overlay')).toBeInTheDocument());
    await waitFor(() => {
      expect(mockSaveData).toHaveBeenCalledWith(
        'pwa_push_diagnostic_overlay_state',
        expect.objectContaining({ visible: false }),
      );
    });
  });

  it('requests notification permission and tracks telemetry', async () => {
    render(<PushDiagnosticOverlay />);
    await screen.findByTestId('push-diagnostic-overlay');

    await userEvent.click(screen.getByRole('button', { name: 'Richiedi permesso' }));

    expect(mockRequestPermission).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('push_diag_permission_request', { result: 'granted' });
      expect(screen.getByText('Concesso')).toBeInTheDocument();
    });
  });

  it('resubscribes using the configured VAPID key and emits telemetry', async () => {
    render(
      <PushDiagnosticOverlay
        configOverride={{
          subscription: {
            vapidPublicKeyHint: MOCK_VAPID_KEY,
          },
        }}
      />,
    );

    await screen.findByTestId('push-diagnostic-overlay');

    await userEvent.click(screen.getByRole('button', { name: 'Forza nuova subscription' }));

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalledWith(
        expect.objectContaining({ applicationServerKey: expect.any(Uint8Array) }),
      );
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'push_diag_subscription_resubscribe',
        expect.objectContaining({ endpoint: 'https://push.example/new-endpoint' }),
      );
    });
  });

  it('triggers fallback via service worker and records telemetry', async () => {
    render(<PushDiagnosticOverlay />);
    await screen.findByTestId('push-diagnostic-overlay');

    const fallbackButtons = screen.getAllByRole('button', { name: 'Invia fallback' });
    await userEvent.click(fallbackButtons[0]);

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'PWA_TRIGGER_PUSH_FALLBACK',
        payload: expect.objectContaining({
          strategyId: 'aggressive',
          channelId: 'push-primary',
        }),
      });
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'push_diag_fallback_triggered',
        expect.objectContaining({
          strategyId: 'aggressive',
          channelId: 'push-primary',
        }),
      );
    });
  });

  it('runs service worker update check and emits telemetry snapshot', async () => {
    mockSWHook.updateStatus = {
      updateAvailable: true,
      currentVersion: '1.0.0',
      availableVersion: '1.1.0',
      lastChecked: Date.now(),
    };

    render(<PushDiagnosticOverlay />);
    await screen.findByTestId('push-diagnostic-overlay');

    await userEvent.click(screen.getByRole('button', { name: 'Controlla aggiornamenti' }));

    await waitFor(() => {
      expect(mockSWHook.checkForUpdates).toHaveBeenCalled();
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'push_diag_sw_update_check',
        expect.objectContaining({ updateAvailable: true }),
      );
    });
  });
});
