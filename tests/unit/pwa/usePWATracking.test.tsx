import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWAInstallTracking, PWAInstallTrackingUtils } from '../../../src/ui/pwa/hooks/usePWAInstallTracking';
import { usePWAColdStartTelemetry, ColdStartTelemetryUtils } from '../../../src/ui/pwa/hooks/usePWAColdStartTelemetry';

// Mock navigator and window APIs
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  platform: 'Test Platform',
  language: 'en-US',
  serviceWorker: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  standalone: false,
};

const mockWindow = {
  matchMedia: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  location: { href: 'http://localhost:3000' },
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock fetch
const mockFetch = vi.fn();

// Setup mocks
beforeEach(() => {
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true,
  });

  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
  });

  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });

  global.fetch = mockFetch;

  vi.clearAllMocks();
});

describe('usePWAInstallTracking', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('[]');
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with default config', () => {
    const { result } = renderHook(() => usePWAInstallTracking());

    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isStandalone).toBe(false);
    expect(result.current.installPrompt).toBe(null);
    expect(result.current.trackingData).toEqual([]);
  });

  it('should track PWA detection on mount', () => {
    const { result } = renderHook(() => usePWAInstallTracking());

    expect(result.current.trackingData).toHaveLength(1);
    expect(result.current.trackingData[0].type).toBe('pwa_detected');
  });

  it('should handle beforeinstallprompt event', async () => {
    const { result } = renderHook(() => usePWAInstallTracking());
    
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    // Simulate beforeinstallprompt event
    await act(async () => {
      const eventHandler = mockWindow.addEventListener.mock.calls.find(call => call[0] === 'beforeinstallprompt')?.[1];
      if (eventHandler) {
        eventHandler(mockEvent);
      }
    });

    expect(result.current.installPrompt).toBe(mockEvent);
    expect(result.current.trackingData.some(e => e.type === 'beforeinstallprompt')).toBe(true);
  });

  it('should show install prompt successfully', async () => {
    const { result } = renderHook(() => usePWAInstallTracking());
    
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue({
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    // Set install prompt
    await act(async () => {
      const eventHandler = mockWindow.addEventListener.mock.calls.find(call => call[0] === 'beforeinstallprompt')?.[1];
      if (eventHandler) {
        eventHandler(mockEvent);
      }
    });

    // Show install prompt
    let installResult;
    await act(async () => {
      installResult = await result.current.showInstallPrompt();
    });

    expect(installResult).toBe(true);
    expect(result.current.isInstalled).toBe(true);
    expect(mockEvent.prompt).toHaveBeenCalled();
  });

  it('should handle install rejection', async () => {
    const { result } = renderHook(() => usePWAInstallTracking());
    
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue({
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      }),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    };

    // Set install prompt
    await act(async () => {
      const eventHandler = mockWindow.addEventListener.mock.calls.find(call => call[0] === 'beforeinstallprompt')?.[1];
      if (eventHandler) {
        eventHandler(mockEvent);
      }
    });

    // Show install prompt
    let installResult;
    await act(async () => {
      installResult = await result.current.showInstallPrompt();
    });

    expect(installResult).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it('should detect standalone mode', () => {
    mockWindow.matchMedia.mockReturnValue({ 
      matches: true, 
      addEventListener: vi.fn(), 
      removeEventListener: vi.fn() 
    });

    const { result } = renderHook(() => usePWAInstallTracking());

    expect(result.current.isStandalone).toBe(true);
    expect(result.current.trackingData.some(e => e.type === 'standalone_mode')).toBe(true);
  });

  it('should store tracking data in localStorage', () => {
    const { result } = renderHook(() => usePWAInstallTracking());

    act(() => {
      result.current.trackEvent({
        type: 'test_event',
        timestamp: Date.now(),
        userAgent: 'test',
        language: 'en',
      });
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should clear tracking data', () => {
    const { result } = renderHook(() => usePWAInstallTracking());

    act(() => {
      result.current.clearTrackingData();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    expect(result.current.trackingData).toEqual([]);
  });

  it('should respect disabled tracking', () => {
    const { result } = renderHook(() => usePWAInstallTracking({ enableTracking: false }));

    expect(result.current.trackingData).toEqual([]);
  });
});

describe('PWAInstallTrackingUtils', () => {
  const mockTrackingData = [
    { type: 'beforeinstallprompt', timestamp: Date.now(), userAgent: 'test', language: 'en' },
    { type: 'appinstalled', timestamp: Date.now(), userAgent: 'test', language: 'en', timeToInstall: 5000 },
    { type: 'appinstalled', timestamp: Date.now(), userAgent: 'test', language: 'en', timeToInstall: 3000 },
  ];

  it('should calculate conversion rate correctly', () => {
    const rate = PWAInstallTrackingUtils.getConversionRate(mockTrackingData);
    expect(rate).toBe(100); // 2 installs / 1 prompt * 100
  });

  it('should handle zero conversion rate', () => {
    const noInstalls = mockTrackingData.filter(e => e.type !== 'appinstalled');
    const rate = PWAInstallTrackingUtils.getConversionRate(noInstalls);
    expect(rate).toBe(0);
  });

  it('should calculate average time to install', () => {
    const avgTime = PWAInstallTrackingUtils.getAverageTimeToInstall(mockTrackingData);
    expect(avgTime).toBe(4000); // (5000 + 3000) / 2
  });

  it('should get install source distribution', () => {
    const distribution = PWAInstallTrackingUtils.getInstallSourceDistribution(mockTrackingData);
    expect(Object.keys(distribution)).toContain('unknown');
  });

  it('should get daily install trends', () => {
    const trends = PWAInstallTrackingUtils.getDailyInstallTrends(mockTrackingData);
    expect(Object.keys(trends)).toHaveLength(1); // All events on same day
  });
});

describe('usePWAColdStartTelemetry', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('[]');
    mockSessionStorage.getItem.mockReturnValue(null);
    mockNavigator.serviceWorker.addEventListener.mockImplementation(() => {});
  });

  it('should initialize with default config', () => {
    const { result } = renderHook(() => usePWAColdStartTelemetry());

    expect(result.current.metrics).toBe(null);
    expect(result.current.isCollecting).toBe(false);
    expect(result.current.validationErrors).toEqual([]);
  });

  it('should handle service worker cold start metrics message', async () => {
    const { result } = renderHook(() => usePWAColdStartTelemetry());

    const mockMessage = {
      data: {
        type: 'PWA_COLD_START_METRICS',
        data: {
          swActivationTime: 100,
          firstFetchTime: 200,
          totalTime: 300,
          timestamp: Date.now(),
          swVersion: '1.0.0',
        },
      },
    };

    await act(async () => {
      const messageHandler = mockNavigator.serviceWorker.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      if (messageHandler) {
        messageHandler(mockMessage);
      }
    });

    await waitFor(() => {
      expect(result.current.metrics).not.toBe(null);
    });

    expect(result.current.metrics?.swActivationTime).toBe(100);
    expect(result.current.metrics?.firstFetchTime).toBe(200);
    expect(result.current.metrics?.totalTime).toBe(300);
  });

  it('should validate metrics and detect errors', async () => {
    const { result } = renderHook(() => usePWAColdStartTelemetry());

    const mockMessage = {
      data: {
        type: 'PWA_COLD_START_METRICS',
        data: {
          swActivationTime: 10000, // Too high (exceeds default max of 5000)
          firstFetchTime: 200,
          totalTime: 300,
          timestamp: Date.now(),
          swVersion: '1.0.0',
        },
      },
    };

    await act(async () => {
      const messageHandler = mockNavigator.serviceWorker.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      if (messageHandler) {
        messageHandler(mockMessage);
      }
    });

    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    expect(result.current.validationErrors[0]).toContain('SW activation time too high');
  });

  it('should store metrics locally', async () => {
    const { result } = renderHook(() => usePWAColdStartTelemetry());

    const mockMessage = {
      data: {
        type: 'PWA_COLD_START_METRICS',
        data: {
          swActivationTime: 100,
          firstFetchTime: 200,
          totalTime: 300,
          timestamp: Date.now(),
          swVersion: '1.0.0',
        },
      },
    };

    await act(async () => {
      const messageHandler = mockNavigator.serviceWorker.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      if (messageHandler) {
        messageHandler(mockMessage);
      }
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should get stored metrics', () => {
    const mockStoredMetrics = [
      {
        swActivationTime: 100,
        firstFetchTime: 200,
        totalTime: 300,
        timestamp: Date.now(),
        swVersion: '1.0.0',
        browserInfo: { userAgent: 'test', platform: 'test', language: 'en' },
        performanceMarks: {},
      },
    ];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStoredMetrics));

    const { result } = renderHook(() => usePWAColdStartTelemetry());

    const storedMetrics = result.current.getStoredMetrics();
    expect(storedMetrics).toEqual(mockStoredMetrics);
  });

  it('should clear stored metrics', () => {
    const { result } = renderHook(() => usePWAColdStartTelemetry());

    act(() => {
      result.current.clearStoredMetrics();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    expect(result.current.metrics).toBe(null);
  });

  it('should calculate metrics statistics', () => {
    const mockStoredMetrics = [
      {
        swActivationTime: 100,
        firstFetchTime: 200,
        totalTime: 300,
        timestamp: Date.now(),
        swVersion: '1.0.0',
        browserInfo: { userAgent: 'test', platform: 'test', language: 'en' },
        performanceMarks: {},
      },
      {
        swActivationTime: 200,
        firstFetchTime: 300,
        totalTime: 500,
        timestamp: Date.now(),
        swVersion: '1.0.0',
        browserInfo: { userAgent: 'test', platform: 'test', language: 'en' },
        performanceMarks: {},
      },
    ];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStoredMetrics));

    const { result } = renderHook(() => usePWAColdStartTelemetry());

    const stats = result.current.getMetricsStatistics();
    
    expect(stats).not.toBe(null);
    expect(stats?.count).toBe(2);
    expect(stats?.swActivationTime.avg).toBe(150);
    expect(stats?.firstFetchTime.avg).toBe(250);
    expect(stats?.totalTime.avg).toBe(400);
  });

  it('should respect disabled tracking', () => {
    const { result } = renderHook(() => usePWAColdStartTelemetry({ enableTracking: false }));

    expect(mockNavigator.serviceWorker.addEventListener).not.toHaveBeenCalled();
  });
});

describe('ColdStartTelemetryUtils', () => {
  const mockMetrics = {
    swActivationTime: 100,
    firstFetchTime: 200,
    totalTime: 300,
    timestamp: Date.now(),
    swVersion: '1.0.0',
    browserInfo: { userAgent: 'test', platform: 'test', language: 'en' },
    performanceMarks: {},
  };

  it('should check if performance is acceptable', () => {
    const isAcceptable = ColdStartTelemetryUtils.isPerformanceAcceptable(mockMetrics);
    expect(isAcceptable).toBe(true);
  });

  it('should detect unacceptable performance', () => {
    const badMetrics = {
      ...mockMetrics,
      totalTime: 10000, // Exceeds default max of 8000
    };

    const isAcceptable = ColdStartTelemetryUtils.isPerformanceAcceptable(badMetrics);
    expect(isAcceptable).toBe(false);
  });

  it('should calculate performance grade', () => {
    const grade = ColdStartTelemetryUtils.getPerformanceGrade(mockMetrics);
    expect(grade).toBe('A'); // Should be 'A' for good performance
  });

  it('should calculate performance score', () => {
    const score = ColdStartTelemetryUtils.calculatePerformanceScore(mockMetrics);
    expect(score).toBeGreaterThan(80); // Should be high for good performance
  });

  it('should format metrics for display', () => {
    const formatted = ColdStartTelemetryUtils.formatMetrics(mockMetrics);
    expect(formatted).toContain('Cold Start Performance Metrics');
    expect(formatted).toContain('SW Activation: 100ms');
    expect(formatted).toContain('First Fetch: 200ms');
    expect(formatted).toContain('Total Time: 300ms');
  });

  it('should handle edge cases in performance grading', () => {
    const veryBadMetrics = {
      ...mockMetrics,
      swActivationTime: 10000,
      firstFetchTime: 10000,
      totalTime: 20000,
    };

    const grade = ColdStartTelemetryUtils.getPerformanceGrade(veryBadMetrics);
    expect(grade).toBe('F');
  });
});

describe('Integration Tests', () => {
  it('should handle PWA install and cold start telemetry together', async () => {
    // Test install tracking
    const { result: installResult } = renderHook(() => usePWAInstallTracking());
    const { result: coldStartResult } = renderHook(() => usePWAColdStartTelemetry());

    // Simulate install
    const mockInstallEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue({
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    await act(async () => {
      const eventHandler = mockWindow.addEventListener.mock.calls.find(call => call[0] === 'beforeinstallprompt')?.[1];
      if (eventHandler) {
        eventHandler(mockInstallEvent);
      }
    });

    await act(async () => {
      await installResult.current.showInstallPrompt();
    });

    expect(installResult.current.isInstalled).toBe(true);

    // Simulate cold start metrics
    const mockColdStartMessage = {
      data: {
        type: 'PWA_COLD_START_METRICS',
        data: {
          swActivationTime: 150,
          firstFetchTime: 250,
          totalTime: 400,
          timestamp: Date.now(),
          swVersion: '1.0.0',
        },
      },
    };

    await act(async () => {
      const messageHandler = mockNavigator.serviceWorker.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      if (messageHandler) {
        messageHandler(mockColdStartMessage);
      }
    });

    await waitFor(() => {
      expect(coldStartResult.current.metrics).not.toBe(null);
    });

    expect(coldStartResult.current.metrics?.totalTime).toBe(400);
  });

  it('should handle error scenarios gracefully', async () => {
    const { result } = renderHook(() => usePWAInstallTracking({ enableAnalytics: true, analyticsEndpoint: 'http://test.com' }));

    // Mock fetch failure
    mockFetch.mockRejectedValue(new Error('Network error'));

    act(() => {
      result.current.trackEvent({
        type: 'test_event',
        timestamp: Date.now(),
        userAgent: 'test',
        language: 'en',
      });
    });

    // Should not throw error, just handle gracefully
    expect(mockFetch).toHaveBeenCalled();
  });
});
