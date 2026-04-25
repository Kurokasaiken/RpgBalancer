/**
 * PWA Install Timing Tests – NP-206
 * 
 * Comprehensive test suite for PWA install timing system with engagement metrics.
 * Tests timing logic, state management, telemetry integration, and A/B testing.
 * 
 * @since NP-206
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWAInstallTiming } from '../../../src/ui/punchClub/hooks/usePWAInstallTiming';
import { DEFAULT_PWA_INSTALL_CONFIG } from '../../../src/ui/punchClub/config/pwaInstallConfig';
import { saveData, loadData } from '../../../src/shared/persistence/PersistenceService';
import { 
  createInstallPromptTelemetry,
  generateSessionContext,
  validatePWASessionContext,
  type PWASessionContext,
} from '../../../src/analytics/punchClub/installPromptTelemetry';

// Mock PersistenceService
vi.mock('../../../src/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock window and navigator
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/punch-club',
  },
  writable: true,
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  writable: true,
});

Object.defineProperty(navigator, 'platform', {
  value: 'iPhone',
  writable: true,
});

Object.defineProperty(screen, 'width', {
  value: 375,
  writable: true,
});

Object.defineProperty(screen, 'height', {
  value: 667,
  writable: true,
});

// Mock setTimeout
vi.mock('timers', () => ({
  setTimeout: vi.fn((callback, delay) => {
    // Execute immediately for tests
    callback();
    return 1;
  }),
}));

describe('usePWAInstallTiming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadData).mockResolvedValue(null);
    vi.mocked(saveData).mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      expect(result.current.state.config).toEqual(DEFAULT_PWA_INSTALL_CONFIG);
      expect(result.current.state.isInstallable).toBe(false);
      expect(result.current.state.isInstalled).toBe(false);
      expect(result.current.state.promptShown).toBe(false);
      expect(result.current.state.sessionMetrics.pageViews).toBe(0);
      expect(result.current.state.timingState.isEligible).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        cadence: {
          minPromptInterval: 3600000, // 1 hour
          maxPromptsPerSession: 2,
          initialPromptDelay: 3000,
          autoDismissTimeout: 8000,
        },
      };
      
      const { result } = renderHook(() => usePWAInstallTiming(customConfig));
      
      expect(result.current.state.config.cadence.minPromptInterval).toBe(3600000);
      expect(result.current.state.config.cadence.maxPromptsPerSession).toBe(2);
      expect(result.current.state.config.cadence.initialPromptDelay).toBe(3000);
      expect(result.current.state.config.cadence.autoDismissTimeout).toBe(8000);
    });

    it('should load persisted state on mount', async () => {
      const persistedState = {
        config: {
          cadence: { minPromptInterval: 7200000 },
        },
        sessionContext: {
          sessionId: 'test-session',
          sessionStartTime: Date.now() - 60000,
          pageViews: 3,
        },
        currentPath: '/test-path',
        timingState: {
          isEligible: true,
          eligibilityTime: Date.now() - 30000,
        },
      };
      
      vi.mocked(loadData).mockResolvedValue(persistedState);
      
      const { result } = renderHook(() => usePWAInstallTiming());
      
      await waitFor(() => {
        expect(result.current.state.config.cadence.minPromptInterval).toBe(7200000);
        expect(result.current.state.sessionContext.sessionId).toBe('test-session');
        expect(result.current.state.currentPath).toBe('/test-path');
        expect(result.current.state.timingState.isEligible).toBe(true);
      });
    });

    it('should handle persistence loading errors gracefully', async () => {
      vi.mocked(loadData).mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      renderHook(() => usePWAInstallTiming());
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load PWA install timing state:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Eligibility Checking', () => {
    it('should check eligibility based on session time', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Initially not eligible due to insufficient session time
      expect(result.current.actions.checkEligibility()).toBe(false);
      
      // Update session context to simulate longer session
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000; // 35 seconds ago
      });
      
      expect(result.current.actions.checkEligibility()).toBe(true);
    });

    it('should check eligibility based on page views', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Update session to meet time requirement but not page views
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 1;
      });
      
      expect(result.current.actions.checkEligibility()).toBe(false);
      
      // Update page views to meet requirement
      act(() => {
        result.current.state.sessionContext.pageViews = 2;
      });
      
      expect(result.current.actions.checkEligibility()).toBe(true);
    });

    it('should check eligibility based on path gating', () => {
      const { result } = renderHook(() => usePWAInstallTiming({
        gating: {
          ...DEFAULT_PWA_INSTALL_CONFIG.gating,
          allowedPaths: ['/punch-club'],
          excludedPaths: ['/punch-club/settings'],
        },
      }));
      
      // Update session to meet basic requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
        result.current.state.currentPath = '/punch-club';
      });
      
      expect(result.current.actions.checkEligibility()).toBe(true);
      
      // Test excluded path
      act(() => {
        result.current.state.currentPath = '/punch-club/settings';
      });
      
      expect(result.current.actions.checkEligibility()).toBe(false);
      
      // Test non-allowed path
      act(() => {
        result.current.state.currentPath = '/other-path';
      });
      
      expect(result.current.actions.checkEligibility()).toBe(false);
    });

    it('should check eligibility based on device gating', () => {
      const { result } = renderHook(() => usePWAInstallTiming({
        gating: {
          ...DEFAULT_PWA_INSTALL_CONFIG.gating,
          deviceGating: {
            showMobile: true,
            showDesktop: false,
            showTablet: false,
          },
        },
      }));
      
      // Update session to meet basic requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
        result.current.state.sessionContext.deviceInfo.deviceType = 'mobile';
      });
      
      expect(result.current.actions.checkEligibility()).toBe(true);
      
      // Test desktop device
      act(() => {
        result.current.state.sessionContext.deviceInfo.deviceType = 'desktop';
      });
      
      expect(result.current.actions.checkEligibility()).toBe(false);
    });

    it('should check eligibility based on prompt interval', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Update session to meet basic requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
      });
      
      expect(result.current.actions.checkEligibility()).toBe(true);
      
      // Set last prompt time within interval
      act(() => {
        result.current.state.timingState.lastPromptTime = Date.now() - 10000; // 10 seconds ago
      });
      
      expect(result.current.actions.checkEligibility()).toBe(false);
    });

    it('should check eligibility based on session prompt limit', () => {
      const { result } = renderHook(() => usePWAInstallTiming({
        cadence: {
          ...DEFAULT_PWA_INSTALL_CONFIG.cadence,
          maxPromptsPerSession: 2,
        },
      }));
      
      // Update session to meet basic requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
        result.current.state.sessionMetrics.promptsShown = 2;
      });
      
      expect(result.current.actions.checkEligibility()).toBe(false);
    });
  });

  describe('Prompt Display', () => {
    it('should show prompt when eligible', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Update session to meet all requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
      });
      
      act(() => {
        result.current.actions.showPrompt();
      });
      
      expect(result.current.state.promptShown).toBe(true);
      expect(result.current.state.sessionMetrics.lastPromptTime).toBeDefined();
      expect(result.current.state.sessionMetrics.promptsShown).toBe(1);
      expect(result.current.state.timingState.lastPromptTime).toBeDefined();
    });

    it('should not show prompt when not eligible', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      act(() => {
        result.current.actions.showPrompt();
      });
      
      expect(result.current.state.promptShown).toBe(false);
    });

    it('should schedule prompt with delay', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Update session to meet all requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
      });
      
      act(() => {
        result.current.actions.schedulePrompt(1000);
      });
      
      expect(result.current.state.timingState.promptScheduled).toBe(true);
      expect(result.current.state.timingState.promptScheduledTime).toBeDefined();
    });

    it('should hide prompt', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Show prompt first
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
        result.current.actions.showPrompt();
      });
      
      expect(result.current.state.promptShown).toBe(true);
      
      // Hide prompt
      act(() => {
        result.current.actions.hidePrompt();
      });
      
      expect(result.current.state.promptShown).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('should handle accept interaction', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Show prompt first
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
        result.current.actions.showPrompt();
      });
      
      act(() => {
        result.current.actions.handleInteraction('accept');
      });
      
      expect(result.current.state.installOutcome).toBe('accepted');
      expect(result.current.state.promptShown).toBe(false);
    });

    it('should handle dismiss interaction', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Show prompt first
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
        result.current.actions.showPrompt();
      });
      
      act(() => {
        result.current.actions.handleInteraction('dismiss');
      });
      
      expect(result.current.state.installOutcome).toBe('dismissed');
      expect(result.current.state.promptShown).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should update page view count', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      expect(result.current.state.sessionMetrics.pageViews).toBe(0);
      
      act(() => {
        result.current.actions.updatePageView('/new-path');
      });
      
      expect(result.current.state.sessionMetrics.pageViews).toBe(1);
      expect(result.current.state.currentPath).toBe('/new-path');
      expect(result.current.state.sessionContext.pageViews).toBe(1);
      expect(result.current.state.sessionContext.currentPath).toBe('/new-path');
    });

    it('should update install capability', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      expect(result.current.state.isInstallable).toBe(false);
      expect(result.current.state.isInstalled).toBe(false);
      
      act(() => {
        result.current.actions.updateInstallCapability(true, false);
      });
      
      expect(result.current.state.isInstallable).toBe(true);
      expect(result.current.state.isInstalled).toBe(false);
      expect(result.current.state.sessionContext.installCapability.isInstallable).toBe(true);
      expect(result.current.state.sessionContext.installCapability.isInstalled).toBe(false);
    });
  });

  describe('A/B Testing', () => {
    it('should set A/B test configuration', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      const abTest = {
        testGroup: 'timing-test-001',
        variant: 'treatment' as const,
        parameters: {
          promptDelay: 3000,
          copyVariant: 'urgent',
        },
        testStartTime: Date.now(),
      };
      
      act(() => {
        result.current.actions.setABTest(abTest);
      });
      
      expect(result.current.state.abTest).toEqual(abTest);
    });
  });

  describe('State Management', () => {
    it('should reset timing state', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Set some timing state
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
        result.current.actions.showPrompt();
      });
      
      expect(result.current.state.timingState.isEligible).toBe(true);
      expect(result.current.state.timingState.eligibilityTime).toBeDefined();
      
      // Reset timing state
      act(() => {
        result.current.actions.resetTimingState();
      });
      
      expect(result.current.state.timingState.isEligible).toBe(false);
      expect(result.current.state.timingState.eligibilityTime).toBeNull();
      expect(result.current.state.timingState.promptScheduled).toBe(false);
      expect(result.current.state.timingState.promptScheduledTime).toBeNull();
      expect(result.current.state.timingState.lastPromptTime).toBeNull();
      expect(result.current.state.timingState.nextEligibleTime).toBeNull();
    });

    it('should export metrics data', () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      const metrics = result.current.actions.exportMetrics();
      
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('sessionContext');
      expect(metrics).toContain('timingMetrics');
      expect(metrics).toContain('engagementMetrics');
    });
  });

  describe('Auto-eligibility Detection', () => {
    it('should automatically detect eligibility when conditions are met', async () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Initially not eligible
      expect(result.current.state.timingState.isEligible).toBe(false);
      
      // Update session to meet requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
      });
      
      await waitFor(() => {
        expect(result.current.state.timingState.isEligible).toBe(true);
        expect(result.current.state.timingState.eligibilityTime).toBeDefined();
      });
    });

    it('should automatically remove eligibility when conditions are no longer met', async () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Set up eligible state
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
      });
      
      await waitFor(() => {
        expect(result.current.state.timingState.isEligible).toBe(true);
      });
      
      // Remove eligibility by reducing page views
      act(() => {
        result.current.state.sessionContext.pageViews = 1;
      });
      
      await waitFor(() => {
        expect(result.current.state.timingState.isEligible).toBe(false);
      });
    });
  });

  describe('Persistence', () => {
    it('should save state to persistence on changes', async () => {
      const { result } = renderHook(() => usePWAInstallTiming());
      
      // Trigger state change
      act(() => {
        result.current.actions.updatePageView('/test-path');
      });
      
      await waitFor(() => {
        expect(vi.mocked(saveData)).toHaveBeenCalledWith(
          'pwa_install_timing_state',
          expect.objectContaining({
            currentPath: '/test-path',
          })
        );
      });
    });

    it('should handle save errors gracefully', async () => {
      vi.mocked(saveData).mockRejectedValue(new Error('Save error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => usePWAInstallTiming());
      
      act(() => {
        result.current.actions.updatePageView('/test-path');
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save PWA install timing state:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Browser Compatibility', () => {
    it('should check Chrome version compatibility', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true,
      });
      
      const { result } = renderHook(() => usePWAInstallTiming({
        gating: {
          ...DEFAULT_PWA_INSTALL_CONFIG.gating,
          browserGating: {
            chromeVersions: ['80+'],
            safariVersions: [],
            firefoxVersions: [],
            excludeIncompatible: true,
          },
        },
      }));
      
      // Update session to meet basic requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
      });
      
      expect(result.current.actions.checkEligibility()).toBe(true);
    });

    it('should reject incompatible browser versions', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        writable: true,
      });
      
      const { result } = renderHook(() => usePWAInstallTiming({
        gating: {
          ...DEFAULT_PWA_INSTALL_CONFIG.gating,
          browserGating: {
            chromeVersions: ['80+'],
            safariVersions: [],
            firefoxVersions: [],
            excludeIncompatible: true,
          },
        },
      }));
      
      // Update session to meet basic requirements
      act(() => {
        result.current.state.sessionContext.sessionStartTime = Date.now() - 35000;
        result.current.state.sessionContext.pageViews = 2;
      });
      
      expect(result.current.actions.checkEligibility()).toBe(false);
    });
  });
});

describe('Install Prompt Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Context Generation', () => {
    it('should generate valid session context', () => {
      const context = generateSessionContext();
      
      expect(context.sessionId).toBeDefined();
      expect(context.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(context.sessionStartTime).toBeDefined();
      expect(context.currentPath).toBe(window.location.pathname);
      expect(context.pageViews).toBe(1);
      expect(context.deviceInfo.userAgent).toBe(navigator.userAgent);
      expect(context.deviceInfo.platform).toBe(navigator.platform);
      expect(context.deviceInfo.deviceType).toMatch(/^(mobile|tablet|desktop)$/);
      expect(context.deviceInfo.browser).toMatch(/^(chrome|firefox|safari|edge|opera|unknown)$/);
      expect(context.deviceInfo.screenResolution).toBe('375x667');
    });

    it('should detect mobile device type', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });
      
      const context = generateSessionContext();
      expect(context.deviceInfo.deviceType).toBe('mobile');
    });

    it('should detect tablet device type', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });
      
      const context = generateSessionContext();
      expect(context.deviceInfo.deviceType).toBe('tablet');
    });

    it('should detect desktop device type', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true,
      });
      
      const context = generateSessionContext();
      expect(context.deviceInfo.deviceType).toBe('desktop');
    });
  });

  describe('Telemetry Instance Creation', () => {
    it('should create telemetry instance with session context', () => {
      const sessionContext = generateSessionContext();
      const telemetry = createInstallPromptTelemetry(sessionContext);
      
      expect(telemetry).toBeDefined();
      expect(telemetry.getMetrics()).toBeDefined();
      expect(telemetry.getMetrics().session).toEqual(sessionContext);
    });

    it('should track eligibility event', () => {
      const sessionContext = generateSessionContext();
      const telemetry = createInstallPromptTelemetry(sessionContext);
      
      telemetry.trackEligibility(DEFAULT_PWA_INSTALL_CONFIG);
      
      const metrics = telemetry.getMetrics();
      expect(metrics.timing.timeToEligibility).toBeGreaterThan(0);
      expect(metrics.engagement.conversionFunnel.eligible).toBe(1);
    });

    it('should track prompt display event', () => {
      const sessionContext = generateSessionContext();
      const telemetry = createInstallPromptTelemetry(sessionContext);
      
      telemetry.trackEligibility(DEFAULT_PWA_INSTALL_CONFIG);
      telemetry.trackPromptDisplay();
      
      const metrics = telemetry.getMetrics();
      expect(metrics.engagement.impressionCount).toBe(1);
      expect(metrics.engagement.conversionFunnel.shown).toBe(1);
      expect(metrics.timing.sessionToPromptTime).toBeGreaterThan(0);
    });

    it('should track prompt interaction events', () => {
      const sessionContext = generateSessionContext();
      const telemetry = createInstallPromptTelemetry(sessionContext);
      
      telemetry.trackEligibility(DEFAULT_PWA_INSTALL_CONFIG);
      telemetry.trackPromptDisplay();
      telemetry.trackPromptInteraction('accept', 5000);
      
      const metrics = telemetry.getMetrics();
      expect(metrics.engagement.conversionFunnel.interacted).toBe(1);
      expect(metrics.engagement.conversionFunnel.accepted).toBe(1);
      expect(metrics.engagement.avgTimeToInteraction).toBe(5000);
    });

    it('should track install outcome events', () => {
      const sessionContext = generateSessionContext();
      const telemetry = createInstallPromptTelemetry(sessionContext);
      
      telemetry.trackEligibility(DEFAULT_PWA_INSTALL_CONFIG);
      telemetry.trackPromptDisplay();
      telemetry.trackPromptInteraction('accept');
      telemetry.trackInstallOutcome(true);
      
      const metrics = telemetry.getMetrics();
      expect(metrics.engagement.conversionFunnel.installed).toBe(1);
    });

    it('should set A/B test configuration', () => {
      const sessionContext = generateSessionContext();
      const telemetry = createInstallPromptTelemetry(sessionContext);
      
      const abTest = {
        testGroup: 'test-001',
        variant: 'treatment' as const,
        parameters: { delay: 3000 },
        testStartTime: Date.now(),
      };
      
      telemetry.setABTest(abTest);
      
      const metrics = telemetry.getMetrics();
      expect(metrics.abTest).toEqual(abTest);
    });

    it('should export telemetry data', () => {
      const sessionContext = generateSessionContext();
      const telemetry = createInstallPromptTelemetry(sessionContext);
      
      telemetry.trackEligibility(DEFAULT_PWA_INSTALL_CONFIG);
      
      const exportedData = telemetry.exportData();
      expect(typeof exportedData).toBe('string');
      
      const parsed = JSON.parse(exportedData);
      expect(parsed.sessionContext).toEqual(sessionContext);
      expect(parsed.timingMetrics).toBeDefined();
      expect(parsed.engagementMetrics).toBeDefined();
      expect(parsed.exportTimestamp).toBeDefined();
    });
  });

  describe('Session Context Validation', () => {
    it('should validate correct session context', () => {
      const sessionContext = generateSessionContext();
      
      expect(() => {
        // This should not throw
        const validated = sessionContext;
        expect(validated.sessionId).toBeDefined();
      }).not.toThrow();
    });

    it('should reject invalid session context', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        validatePWASessionContext(null);
      }).toThrow('Invalid session context');
      
      expect(() => {
        // @ts-expect-error - Testing invalid input
        validatePWASessionContext({});
      }).toThrow('Invalid session ID');
      
      expect(() => {
        // @ts-expect-error - Testing invalid input
        validatePWASessionContext({ sessionId: 'test' });
      }).toThrow('Invalid session start time');
    });
  });
});
