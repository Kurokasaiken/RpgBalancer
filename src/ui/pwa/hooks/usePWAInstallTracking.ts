/**
 * PWA Install Tracking Hook
 * 
 * Tracks PWA installation events, distribution channels, and user engagement
 * for analytics and optimization purposes.
 * 
 * @module usePWAInstallTracking
 * @since 2026-01-12
 * @author Cascade
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('PWAInstallTracking');

/**
 * PWA install event types
 */
export type PWAInstallEventType = 
  | 'beforeinstallprompt'
  | 'appinstalled' 
  | 'install_dismissed'
  | 'install_rejected'
  | 'pwa_detected'
  | 'standalone_mode';

/**
 * PWA install event data
 */
export interface PWAInstallEventData {
  type: PWAInstallEventType;
  timestamp: number;
  userAgent: string;
  platform?: string;
  language: string;
  referrer?: string;
  installSource?: 'direct' | 'prompt' | 'browser_install' | 'manual';
  timeToInstall?: number; // ms from first prompt to install
  promptShown?: boolean;
  promptAccepted?: boolean;
  standaloneMode?: boolean;
}

/**
 * PWA install tracking configuration
 */
export interface PWAInstallTrackingConfig {
  /** Enable detailed tracking */
  enableTracking: boolean;
  /** Track referrer information */
  trackReferrer: boolean;
  /** Track user agent details */
  trackUserAgent: boolean;
  /** Send events to analytics service */
  enableAnalytics: boolean;
  /** Analytics endpoint URL */
  analyticsEndpoint?: string;
  /** Local storage key for tracking */
  storageKey: string;
  /** Debounce time for events (ms) */
  debounceMs: number;
}

/**
 * Default PWA install tracking configuration
 */
export const DEFAULT_PWA_INSTALL_CONFIG: PWAInstallTrackingConfig = {
  enableTracking: true,
  trackReferrer: true,
  trackUserAgent: true,
  enableAnalytics: false, // Disabled by default for privacy
  storageKey: 'pwa-install-tracking',
  debounceMs: 1000,
};

/**
 * PWA install tracking hook
 */
export function usePWAInstallTracking(config: Partial<PWAInstallTrackingConfig> = {}) {
  const trackingConfig = { ...DEFAULT_PWA_INSTALL_CONFIG, ...config };
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<PWAInstallEventData[]>([]);
  
  const installPromptTimeRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eventQueueRef = useRef<PWAInstallEventData[]>([]);

  /**
   * Create install event data
   */
  const createEventData = useCallback((type: PWAInstallEventType, additionalData: Partial<PWAInstallEventData> = {}): PWAInstallEventData => {
    const now = Date.now();
    const baseData: PWAInstallEventData = {
      type,
      timestamp: now,
      userAgent: trackingConfig.trackUserAgent ? navigator.userAgent : 'redacted',
      language: navigator.language,
      platform: navigator.platform,
      referrer: trackingConfig.trackReferrer ? document.referrer : undefined,
      ...additionalData,
    };

    // Add time to install if we have prompt time
    if (type === 'appinstalled' && installPromptTimeRef.current) {
      baseData.timeToInstall = now - installPromptTimeRef.current;
    }

    return baseData;
  }, [trackingConfig]);

  /**
   * Track event locally and optionally send to analytics
   */
  const trackEvent = useCallback((eventData: PWAInstallEventData) => {
    if (!trackingConfig.enableTracking) return;

    // Add to local tracking data
    setTrackingData(prev => [...prev, eventData]);

    // Store in localStorage for persistence
    try {
      const existingData = JSON.parse(localStorage.getItem(trackingConfig.storageKey) || '[]');
      existingData.push(eventData);
      // Keep only last 100 events to prevent storage bloat
      const trimmedData = existingData.slice(-100);
      localStorage.setItem(trackingConfig.storageKey, JSON.stringify(trimmedData));
    } catch (error) {
      diagnostics.warn('Failed to store tracking data locally', error);
    }

    // Send to analytics if enabled
    if (trackingConfig.enableAnalytics && trackingConfig.analyticsEndpoint) {
      // Debounce analytics calls
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        sendToAnalytics(eventData);
      }, trackingConfig.debounceMs);
    }

    diagnostics.info('PWA install event tracked', eventData);
  }, [trackingConfig]);

  /**
   * Send event to analytics endpoint
   */
  const sendToAnalytics = useCallback(async (eventData: PWAInstallEventData) => {
    if (!trackingConfig.analyticsEndpoint) return;

    try {
      const response = await fetch(trackingConfig.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: [eventData],
          sessionId: getSessionId(),
          appVersion: getAppVersion(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }

      diagnostics.info('PWA install event sent to analytics', eventData);
    } catch (error) {
      diagnostics.warn('Failed to send PWA install event to analytics', error);
    }
  }, [trackingConfig]);

  /**
   * Get session ID for tracking
   */
  const getSessionId = useCallback((): string => {
    const sessionKey = 'pwa-session-id';
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(sessionKey, sessionId);
    }
    
    return sessionId;
  }, []);

  /**
   * Get app version from manifest or build info
   */
  const getAppVersion = useCallback((): string => {
    // Try to get version from service worker
    if ('serviceWorker' in navigator) {
      return '1.0.0'; // This should match SW_VERSION
    }
    
    // Fallback to build timestamp
    return `build_${Date.now()}`;
  }, []);

  /**
   * Show install prompt
   */
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      diagnostics.warn('No install prompt available');
      return false;
    }

    try {
      installPromptTimeRef.current = Date.now();
      
      // Track prompt shown
      trackEvent(createEventData('beforeinstallprompt', {
        promptShown: true,
        installSource: 'prompt',
      }));

      const result = await installPrompt.prompt();
      const choiceResult = await result.userChoice;

      if (choiceResult.outcome === 'accepted') {
        trackEvent(createEventData('appinstalled', {
          promptAccepted: true,
          installSource: 'prompt',
        }));
        setIsInstalled(true);
        return true;
      } else {
        trackEvent(createEventData('install_rejected', {
          promptAccepted: false,
          installSource: 'prompt',
        }));
        return false;
      }
    } catch (error) {
      diagnostics.error('Failed to show install prompt', error);
      trackEvent(createEventData('install_dismissed', {
        installSource: 'prompt',
      }));
      return false;
    } finally {
      setInstallPrompt(null);
      installPromptTimeRef.current = null;
    }
  }, [installPrompt, createEventData, trackEvent]);

  /**
   * Check if app is running in standalone mode
   */
  const checkStandaloneMode = useCallback(() => {
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      document.referrer.includes('android-app://');

    setIsStandalone(standalone);
    
    if (standalone) {
      trackEvent(createEventData('standalone_mode', {
        standaloneMode: true,
        installSource: 'browser_install',
      }));
    }

    return standalone;
  }, [createEventData, trackEvent]);

  /**
   * Load existing tracking data from localStorage
   */
  const loadTrackingData = useCallback(() => {
    try {
      const stored = localStorage.getItem(trackingConfig.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        setTrackingData(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      diagnostics.warn('Failed to load tracking data from localStorage', error);
    }
  }, [trackingConfig]);

  /**
   * Clear tracking data
   */
  const clearTrackingData = useCallback(() => {
    setTrackingData([]);
    localStorage.removeItem(trackingConfig.storageKey);
    diagnostics.info('PWA install tracking data cleared');
  }, [trackingConfig]);

  // Initialize tracking
  useEffect(() => {
    if (!trackingConfig.enableTracking) return;

    loadTrackingData();
    checkStandaloneMode();

    // Track PWA detection
    trackEvent(createEventData('pwa_detected'));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      trackEvent(createEventData('beforeinstallprompt', {
        installSource: 'direct',
      }));
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      trackEvent(createEventData('appinstalled', {
        installSource: 'browser_install',
      }));
    };

    // Listen for display mode changes
    const handleDisplayModeChange = () => {
      checkStandaloneMode();
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [trackingConfig, loadTrackingData, checkStandaloneMode, createEventData, trackEvent]);

  return {
    // State
    isInstalled,
    isStandalone,
    installPrompt,
    trackingData,
    
    // Actions
    showInstallPrompt,
    checkStandaloneMode,
    clearTrackingData,
    
    // Analytics
    trackEvent,
    
    // Configuration
    config: trackingConfig,
  };
}

/**
 * PWA install tracking utilities
 */
export const PWAInstallTrackingUtils = {
  /**
   * Get install conversion rate
   */
  getConversionRate: (trackingData: PWAInstallEventData[]): number => {
    const prompts = trackingData.filter(e => e.type === 'beforeinstallprompt');
    const installs = trackingData.filter(e => e.type === 'appinstalled');
    
    if (prompts.length === 0) return 0;
    return (installs.length / prompts.length) * 100;
  },

  /**
   * Get average time to install
   */
  getAverageTimeToInstall: (trackingData: PWAInstallEventData[]): number => {
    const installEvents = trackingData.filter(e => e.type === 'appinstalled' && e.timeToInstall);
    
    if (installEvents.length === 0) return 0;
    
    const totalTime = installEvents.reduce((sum, event) => sum + (event.timeToInstall || 0), 0);
    return totalTime / installEvents.length;
  },

  /**
   * Get install source distribution
   */
  getInstallSourceDistribution: (trackingData: PWAInstallEventData[]): Record<string, number> => {
    const installs = trackingData.filter(e => e.type === 'appinstalled');
    const distribution: Record<string, number> = {};
    
    installs.forEach(event => {
      const source = event.installSource || 'unknown';
      distribution[source] = (distribution[source] || 0) + 1;
    });
    
    return distribution;
  },

  /**
   * Get daily install trends
   */
  getDailyInstallTrends: (trackingData: PWAInstallEventData[]): Record<string, number> => {
    const installs = trackingData.filter(e => e.type === 'appinstalled');
    const trends: Record<string, number> = {};
    
    installs.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });
    
    return trends;
  },
};

export default usePWAInstallTracking;
