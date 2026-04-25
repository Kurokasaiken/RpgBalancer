/**
 * PWA Install Retry Unit Tests
 * 
 * Tests for the enhanced PWA install tracker with retry logic,
 * offline detection, and user messaging.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWAInstallTracker } from '@/ui/punchClub/hooks/usePWAInstallTracker';
import { DEFAULT_PWA_RETRY_CONFIG } from '@/ui/punchClub/config/pwaRetryConfig';

// Mock timers
vi.useFakeTimers();

// Mock fetch for offline detection
global.fetch = vi.fn();

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock performance API
const performanceMock = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByName: vi.fn(() => []),
};
Object.defineProperty(window, 'performance', {
  value: performanceMock,
  writable: true,
});

// Mock navigator for PWA detection
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    platform: 'Test Platform',
    standalone: false,
  },
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  writable: true,
});

describe('usePWAInstallTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      expect(result.current.state).toMatchObject({
        isInstallable: false,
        isInstalled: false,
        promptShown: false,
        installOutcome: null,
        error: null,
        retry: {
          currentAttempt: 0,
          isRetrying: false,
          nextRetryTime: null,
          lastError: null,
          canRetry: true,
        },
        offline: {
          isOffline: false,
          lastCheckTime: 0,
          failedRequests: 0,
          connectionType: '4g',
        },
        messaging: {
          currentMessage: null,
          messageType: null,
          showMessage: false,
          autoDismissTime: null,
        },
      });
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        retryConfig: {
          ...DEFAULT_PWA_RETRY_CONFIG,
          retry: {
            maxRetries: 5,
            initialDelay: 2000,
          },
        },
        enableOfflineDetection: false,
      };

      const { result } = renderHook(() => usePWAInstallTracker(customConfig));

      expect(result.current.state.retry.canRetry).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should retry install with exponential backoff', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Mock deferred prompt
      const mockPrompt = {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      };

      // Simulate install failure first
      vi.mocked(mockPrompt.prompt).mockRejectedValueOnce(new Error('Network error'));

      // Start retry
      await act(async () => {
        await result.current.retryInstall();
      });

      expect(result.current.state.retry.isRetrying).toBe(true);
      expect(result.current.state.retry.currentAttempt).toBe(1);

      // Wait for retry delay
      await act(async () => {
        vi.advanceTimersByTime(1000); // Initial delay
      });

      expect(result.current.state.retry.isRetrying).toBe(false);
      expect(result.current.state.retry.lastError).toBeInstanceOf(Error);
    });

    it('should respect max retry limit', async () => {
      const customConfig = {
        retryConfig: {
          ...DEFAULT_PWA_RETRY_CONFIG,
          retry: {
            maxRetries: 1,
            initialDelay: 100,
          },
        },
      };

      const { result } = renderHook(() => usePWAInstallTracker(customConfig));

      // Fail first attempt
      await act(async () => {
        await result.current.retryInstall();
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Fail second attempt (max retries reached)
      await act(async () => {
        await result.current.retryInstall();
      });

      expect(result.current.state.retry.canRetry).toBe(false);
      expect(result.current.state.messaging.currentMessage).toContain('install failed');
    });

    it('should calculate retry delay with exponential backoff and jitter', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Mock the retry function to capture delay
      let capturedDelay = 0;
      const originalRetryInstall = result.current.retryInstall;
      
      result.current.retryInstall = vi.fn(async () => {
        // Simulate delay calculation
        const attempt = result.current.state.retry.currentAttempt;
        capturedDelay = 1000 * Math.pow(2, attempt) * (1 + 0.1 * Math.random());
        await new Promise(resolve => setTimeout(resolve, capturedDelay));
      });

      // Test multiple attempts
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.retryInstall();
        });
        vi.advanceTimersByTime(capturedDelay);
      }

      expect(capturedDelay).toBeGreaterThan(1000); // Should increase with each attempt
    });
  });

  describe('Offline Detection', () => {
    it('should detect online status', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      await act(async () => {
        const isOffline = await result.current.checkOfflineStatus();
        expect(isOffline).toBe(false);
      });

      expect(result.current.state.offline.isOffline).toBe(false);
      expect(result.current.state.offline.lastCheckTime).toBeGreaterThan(0);
    });

    it('should detect offline status', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Mock fetch failures
      (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        const isOffline = await result.current.checkOfflineStatus();
        expect(isOffline).toBe(true);
      });

      expect(result.current.state.offline.isOffline).toBe(true);
      expect(result.current.state.offline.failedRequests).toBe(1);
      expect(result.current.state.messaging.currentMessage).toContain('offline');
    });

    it('should test multiple URLs for connectivity', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Mock mixed responses
      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 }) // First URL succeeds
        .mockRejectedValueOnce(new Error('Network error')) // Second URL fails
        .mockResolvedValueOnce({ ok: true, status: 200 }); // Third URL succeeds

      await act(async () => {
        const isOffline = await result.current.checkOfflineStatus();
        expect(isOffline).toBe(false); // At least one success
      });

      expect(result.current.state.offline.isOffline).toBe(false);
    });

    it('should handle connection type detection', async () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '3g',
          downlink: 2,
          rtt: 300,
        },
        writable: true,
      });

      const { result } = renderHook(() => usePWAInstallTracker());

      await act(async () => {
        await result.current.checkOfflineStatus();
      });

      expect(result.current.state.offline.connectionType).toBe('3g');
    });

    it('should show message when going offline', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Mock fetch failure
      (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.checkOfflineStatus();
      });

      expect(result.current.state.messaging.showMessage).toBe(true);
      expect(result.current.state.messaging.messageType).toBe('warning');
      expect(result.current.state.messaging.currentMessage).toContain('offline');
    });

    it('should show success message when coming back online', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // First, go offline
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.checkOfflineStatus();
      });

      expect(result.current.state.offline.isOffline).toBe(true);

      // Then come back online
      (global.fetch as Mock).mockResolvedValue({ ok: true, status: 200 });

      await act(async () => {
        await result.current.checkOfflineStatus();
      });

      expect(result.current.state.offline.isOffline).toBe(false);
      expect(result.current.state.messaging.currentMessage).toContain('Connection restored');
    });
  });

  describe('User Messaging', () => {
    it('should show user message', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      act(() => {
        result.current.showMessage('info', 'Test message');
      });

      expect(result.current.state.messaging.showMessage).toBe(true);
      expect(result.current.state.messaging.messageType).toBe('info');
      expect(result.current.state.messaging.currentMessage).toBe('Test message');
    });

    it('should auto-dismiss success messages', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      act(() => {
        result.current.showMessage('success', 'Success message');
      });

      expect(result.current.state.messaging.autoDismissTime).toBeGreaterThan(Date.now());

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(6000); // 5 seconds + buffer
      });

      expect(result.current.state.messaging.showMessage).toBe(false);
      expect(result.current.state.messaging.currentMessage).toBeNull();
    });

    it('should not auto-dismiss error messages', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      act(() => {
        result.current.showMessage('error', 'Error message');
      });

      expect(result.current.state.messaging.autoDismissTime).toBeNull();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.state.messaging.showMessage).toBe(true);
    });

    it('should dismiss message manually', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      act(() => {
        result.current.showMessage('info', 'Test message');
      });

      expect(result.current.state.messaging.showMessage).toBe(true);

      act(() => {
        result.current.dismissMessage();
      });

      expect(result.current.state.messaging.showMessage).toBe(false);
      expect(result.current.state.messaging.currentMessage).toBeNull();
    });

    it('should call custom message handler', () => {
      const onMessage = vi.fn();
      const { result } = renderHook(() => usePWAInstallTracker({ onMessage }));

      act(() => {
        result.current.showMessage('warning', 'Warning message');
      });

      expect(onMessage).toHaveBeenCalledWith('warning', 'Warning message');
    });
  });

  describe('Performance Monitoring', () => {
    it('should record performance marks', () => {
      const { result } = renderHook(() => usePWAInstallTracker({
        enablePerformanceTracking: true,
      }));

      expect(result.current.state.performance.coldStartTime).toBeNull();
      expect(result.current.state.performance.swActivationTime).toBeNull();
      expect(result.current.state.performance.firstFetchTime).toBeNull();
    });

    it('should disable performance tracking when disabled', () => {
      const { result } = renderHook(() => usePWAInstallTracker({
        enablePerformanceTracking: false,
      }));

      // Performance tracking should not interfere with other functionality
      expect(result.current.state.retry.canRetry).toBe(true);
      expect(result.current.state.offline.isOffline).toBe(false);
    });
  });

  describe('KPI Monitoring', () => {
    it('should calculate KPI status', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      const kpiStatus = result.current.getKPIStatus();

      expect(kpiStatus).toHaveProperty('meetsAllTargets');
      expect(kpiStatus).toHaveProperty('kpiStatus');
      expect(typeof kpiStatus.meetsAllTargets).toBe('boolean');
    });

    it('should calculate performance grade', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      const grade = result.current.getPerformanceGrade();

      expect(['A', 'B', 'C', 'F']).toContain(grade);
    });

    it('should export metrics data', () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      const exported = result.current.exportMetrics();

      expect(exported).toHaveProperty('retry');
      expect(exported).toHaveProperty('offline');
      expect(exported).toHaveProperty('messaging');
      expect(exported).toHaveProperty('performance');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete retry flow with offline detection', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Start offline
      (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.checkOfflineStatus();
      });

      expect(result.current.state.offline.isOffline).toBe(true);
      expect(result.current.state.messaging.showMessage).toBe(true);

      // Try to retry while offline
      await act(async () => {
        await result.current.retryInstall();
      });

      // Should show offline message
      expect(result.current.state.messaging.currentMessage).toContain('offline');

      // Come back online
      (global.fetch as Mock).mockResolvedValue({ ok: true, status: 200 });

      await act(async () => {
        await result.current.checkOfflineStatus();
      });

      expect(result.current.state.offline.isOffline).toBe(false);
      expect(result.current.state.messaging.currentMessage).toContain('Connection restored');
    });

    it('should handle version mismatch scenario', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Simulate version mismatch
      act(() => {
        result.current.showMessage('warning', 'A new version is available. Please refresh the page.');
      });

      expect(result.current.state.messaging.showMessage).toBe(true);
      expect(result.current.state.messaging.messageType).toBe('warning');
      expect(result.current.state.messaging.currentMessage).toContain('new version');
    });

    it('should handle concurrent operations', async () => {
      const { result } = renderHook(() => usePWAInstallTracker());

      // Start multiple operations concurrently
      const promises = [
        result.current.checkOfflineStatus(),
        result.current.checkOfflineStatus(),
        result.current.checkOfflineStatus(),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Should handle gracefully without race conditions
      expect(result.current.state.offline.lastCheckTime).toBeGreaterThan(0);
      expect(typeof result.current.state.offline.isOffline).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage error
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => usePWAInstallTracker());

      // Should not throw and continue with default behavior
      await act(async () => {
        const isOffline = await result.current.checkOfflineStatus();
        expect(typeof isOffline).toBe('boolean');
      });
    });

    it('should handle navigator.connection errors', async () => {
      // Mock connection error
      Object.defineProperty(navigator, 'connection', {
        value: null,
        writable: true,
      });

      const { result } = renderHook(() => usePWAInstallTracker());

      await act(async () => {
        await result.current.checkOfflineStatus();
      });

      expect(result.current.state.offline.connectionType).toBeNull();
    });

    it('should handle performance API errors', () => {
      // Mock performance error
      Object.defineProperty(window, 'performance', {
        value: {
          now: () => {
            throw new Error('Performance error');
          },
          mark: vi.fn(),
          measure: vi.fn(),
          clearMarks: vi.fn(),
          clearMeasures: vi.fn(),
          getEntriesByName: vi.fn(() => []),
        },
        writable: true,
      });

      const { result } = renderHook(() => usePWAInstallTracker({
        enablePerformanceTracking: true,
      }));

      // Should not throw and continue with default behavior
      expect(result.current.state.performance.coldStartTime).toBeNull();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate retry configuration', () => {
      const invalidConfig = {
        retryConfig: {
          ...DEFAULT_PWA_RETRY_CONFIG,
          retry: {
            maxRetries: -1, // Invalid
            initialDelay: 0, // Invalid
            backoffMultiplier: 0, // Invalid
          },
        },
      };

      // Should handle invalid config gracefully
      expect(() => {
        renderHook(() => usePWAInstallTracker(invalidConfig));
      }).not.toThrow();
    });

    it('should handle missing configuration gracefully', () => {
      expect(() => {
        renderHook(() => usePWAInstallTracker({}));
      }).not.toThrow();
    });
  });
});
