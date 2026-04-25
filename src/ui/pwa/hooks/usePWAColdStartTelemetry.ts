/**
 * PWA Cold Start Telemetry Hook
 * 
 * Collects and validates cold start performance metrics for PWA optimization.
 * Integrates with service worker cold start tracking and provides analytics.
 * 
 * @module usePWAColdStartTelemetry
 * @since 2026-01-12
 * @author Cascade
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('PWAColdStartTelemetry');

/**
 * Cold start telemetry metrics
 */
export interface ColdStartMetrics {
  /** Service worker activation time (ms) */
  swActivationTime: number;
  /** First fetch time (ms) */
  firstFetchTime: number;
  /** Total cold start time (ms) */
  totalTime: number;
  /** Timestamp when metrics were collected */
  timestamp: number;
  /** Service worker version */
  swVersion: string;
  /** Browser information */
  browserInfo: {
    userAgent: string;
    platform: string;
    language: string;
    connection?: string;
  };
  /** Performance marks */
  performanceMarks: {
    swStart?: number;
    swActivated?: number;
    firstRequest?: number;
  };
}

/**
 * Cold start telemetry configuration
 */
export interface ColdStartTelemetryConfig {
  /** Enable cold start tracking */
  enableTracking: boolean;
  /** Track detailed performance marks */
  trackPerformanceMarks: boolean;
  /** Track browser information */
  trackBrowserInfo: boolean;
  /** Track connection information */
  trackConnectionInfo: boolean;
  /** Send metrics to analytics */
  enableAnalytics: boolean;
  /** Analytics endpoint */
  analyticsEndpoint?: string;
  /** Local storage key for metrics */
  storageKey: string;
  /** Maximum metrics to store locally */
  maxStoredMetrics: number;
  /** Validation rules */
  validation: {
    maxActivationTime: number; // ms
    maxFirstFetchTime: number; // ms
    maxTotalTime: number; // ms
  };
}

/**
 * Default cold start telemetry configuration
 */
export const DEFAULT_COLD_START_CONFIG: ColdStartTelemetryConfig = {
  enableTracking: true,
  trackPerformanceMarks: true,
  trackBrowserInfo: true,
  trackConnectionInfo: true,
  enableAnalytics: false,
  storageKey: 'pwa-cold-start-metrics',
  maxStoredMetrics: 50,
  validation: {
    maxActivationTime: 5000, // 5 seconds
    maxFirstFetchTime: 3000, // 3 seconds
    maxTotalTime: 8000, // 8 seconds
  },
};

/**
 * PWA Cold Start Telemetry Hook
 */
export function usePWAColdStartTelemetry(config: Partial<ColdStartTelemetryConfig> = {}) {
  const telemetryConfig = { ...DEFAULT_COLD_START_CONFIG, ...config };
  const [metrics, setMetrics] = useState<ColdStartMetrics | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const metricsCollectedRef = useRef(false);
  const messageHandlerRef = useRef<(event: MessageEvent) => void | null>(null);

  /**
   * Get browser connection information
   */
  const getConnectionInfo = useCallback((): string | undefined => {
    if (!telemetryConfig.trackConnectionInfo) return undefined;
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (!connection) return undefined;
    
    return `${connection.effectiveType || 'unknown'}-${connection.downlink || 'unknown'}Mbps`;
  }, [telemetryConfig]);

  /**
   * Get browser information
   */
  const getBrowserInfo = useCallback(() => {
    if (!telemetryConfig.trackBrowserInfo) {
      return {
        userAgent: 'redacted',
        platform: 'redacted',
        language: 'redacted',
      };
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      connection: getConnectionInfo(),
    };
  }, [telemetryConfig, getConnectionInfo]);

  /**
   * Validate cold start metrics
   */
  const validateMetrics = useCallback((metricsData: ColdStartMetrics): string[] => {
    const errors: string[] = [];
    const { validation } = telemetryConfig;

    if (metricsData.swActivationTime > validation.maxActivationTime) {
      errors.push(`SW activation time too high: ${metricsData.swActivationTime}ms > ${validation.maxActivationTime}ms`);
    }

    if (metricsData.firstFetchTime > validation.maxFirstFetchTime) {
      errors.push(`First fetch time too high: ${metricsData.firstFetchTime}ms > ${validation.maxFirstFetchTime}ms`);
    }

    if (metricsData.totalTime > validation.maxTotalTime) {
      errors.push(`Total cold start time too high: ${metricsData.totalTime}ms > ${validation.maxTotalTime}ms`);
    }

    // Check for negative values
    if (metricsData.swActivationTime < 0) {
      errors.push('SW activation time cannot be negative');
    }

    if (metricsData.firstFetchTime < 0) {
      errors.push('First fetch time cannot be negative');
    }

    if (metricsData.totalTime < 0) {
      errors.push('Total time cannot be negative');
    }

    // Check logical consistency
    if (metricsData.totalTime < metricsData.swActivationTime) {
      errors.push('Total time should be >= SW activation time');
    }

    return errors;
  }, [telemetryConfig]);

  /**
   * Store metrics locally
   */
  const storeMetrics = useCallback((metricsData: ColdStartMetrics) => {
    try {
      const existingMetrics = JSON.parse(localStorage.getItem(telemetryConfig.storageKey) || '[]');
      
      // Add new metrics
      existingMetrics.push(metricsData);
      
      // Keep only the most recent metrics
      const trimmedMetrics = existingMetrics.slice(-telemetryConfig.maxStoredMetrics);
      
      localStorage.setItem(telemetryConfig.storageKey, JSON.stringify(trimmedMetrics));
      
      diagnostics.info('Cold start metrics stored locally', { count: trimmedMetrics.length });
    } catch (error) {
      diagnostics.warn('Failed to store cold start metrics locally', error);
    }
  }, [telemetryConfig]);

  /**
   * Send metrics to analytics
   */
  const sendToAnalytics = useCallback(async (metricsData: ColdStartMetrics) => {
    if (!telemetryConfig.enableAnalytics || !telemetryConfig.analyticsEndpoint) {
      return;
    }

    try {
      const response = await fetch(telemetryConfig.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'pwa_cold_start_metrics',
          data: metricsData,
          sessionId: getSessionId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }

      diagnostics.info('Cold start metrics sent to analytics', metricsData);
    } catch (error) {
      diagnostics.warn('Failed to send cold start metrics to analytics', error);
    }
  }, [telemetryConfig]);

  /**
   * Get session ID
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
   * Handle service worker message with cold start metrics
   */
  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    if (!telemetryConfig.enableTracking || metricsCollectedRef.current) return;

    const { type, data } = event.data;

    if (type === 'PWA_COLD_START_METRICS' && data) {
      setIsCollecting(true);
      
      const metricsData: ColdStartMetrics = {
        swActivationTime: data.swActivationTime || 0,
        firstFetchTime: data.firstFetchTime || 0,
        totalTime: data.totalTime || 0,
        timestamp: data.timestamp || Date.now(),
        swVersion: data.swVersion || 'unknown',
        browserInfo: getBrowserInfo(),
        performanceMarks: telemetryConfig.trackPerformanceMarks ? {
          swStart: data.swStart,
          swActivated: data.swActivated,
          firstRequest: data.firstRequest,
        } : undefined,
      };

      // Validate metrics
      const errors = validateMetrics(metricsData);
      setValidationErrors(errors);

      if (errors.length === 0) {
        setMetrics(metricsData);
        storeMetrics(metricsData);
        sendToAnalytics(metricsData);
        metricsCollectedRef.current = true;
        
        diagnostics.info('Cold start metrics collected and validated', metricsData);
      } else {
        diagnostics.warn('Cold start metrics validation failed', { errors, metrics: metricsData });
      }

      setIsCollecting(false);
    }
  }, [telemetryConfig, validateMetrics, getBrowserInfo, storeMetrics, sendToAnalytics]);

  /**
   * Get stored metrics
   */
  const getStoredMetrics = useCallback((): ColdStartMetrics[] => {
    try {
      const stored = localStorage.getItem(telemetryConfig.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      diagnostics.warn('Failed to load stored cold start metrics', error);
      return [];
    }
  }, [telemetryConfig]);

  /**
   * Clear stored metrics
   */
  const clearStoredMetrics = useCallback(() => {
    localStorage.removeItem(telemetryConfig.storageKey);
    setMetrics(null);
    setValidationErrors([]);
    metricsCollectedRef.current = false;
    diagnostics.info('Cold start metrics cleared');
  }, [telemetryConfig]);

  /**
   * Get metrics statistics
   */
  const getMetricsStatistics = useCallback(() => {
    const storedMetrics = getStoredMetrics();
    
    if (storedMetrics.length === 0) {
      return null;
    }

    const activationTimes = storedMetrics.map(m => m.swActivationTime);
    const fetchTimes = storedMetrics.map(m => m.firstFetchTime);
    const totalTimes = storedMetrics.map(m => m.totalTime);

    return {
      count: storedMetrics.length,
      swActivationTime: {
        avg: activationTimes.reduce((a, b) => a + b, 0) / activationTimes.length,
        min: Math.min(...activationTimes),
        max: Math.max(...activationTimes),
        median: getMedian(activationTimes),
      },
      firstFetchTime: {
        avg: fetchTimes.reduce((a, b) => a + b, 0) / fetchTimes.length,
        min: Math.min(...fetchTimes),
        max: Math.max(...fetchTimes),
        median: getMedian(fetchTimes),
      },
      totalTime: {
        avg: totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length,
        min: Math.min(...totalTimes),
        max: Math.max(...totalTimes),
        median: getMedian(totalTimes),
      },
      latestTimestamp: Math.max(...storedMetrics.map(m => m.timestamp)),
    };
  }, [getStoredMetrics]);

  /**
   * Get median value from array
   */
  const getMedian = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  };

  // Initialize message listener
  useEffect(() => {
    if (!telemetryConfig.enableTracking) return;

    messageHandlerRef.current = handleServiceWorkerMessage;
    
    navigator.serviceWorker?.addEventListener('message', messageHandlerRef.current);

    return () => {
      if (messageHandlerRef.current) {
        navigator.serviceWorker?.removeEventListener('message', messageHandlerRef.current);
      }
    };
  }, [telemetryConfig.enableTracking, handleServiceWorkerMessage]);

  // Check if metrics already collected this session
  useEffect(() => {
    if (!telemetryConfig.enableTracking) return;

    // Check if we already have metrics for this session
    const sessionMetrics = getStoredMetrics();
    const currentSessionId = getSessionId();
    
    // Look for metrics from current session
    const sessionHasMetrics = sessionMetrics.some(m => {
      const sessionKey = `session_${Math.floor(m.timestamp / (1000 * 60 * 60))}`; // Hour-based session
      return sessionKey === currentSessionId;
    });

    if (sessionHasMetrics) {
      metricsCollectedRef.current = true;
      diagnostics.info('Cold start metrics already collected for this session');
    }
  }, [telemetryConfig.enableTracking, getStoredMetrics, getSessionId]);

  return {
    // State
    metrics,
    isCollecting,
    validationErrors,
    
    // Actions
    getStoredMetrics,
    clearStoredMetrics,
    getMetricsStatistics,
    
    // Configuration
    config: telemetryConfig,
  };
}

/**
 * Cold start telemetry utilities
 */
export const ColdStartTelemetryUtils = {
  /**
   * Check if cold start performance is acceptable
   */
  isPerformanceAcceptable: (metrics: ColdStartMetrics, thresholds: Partial<ColdStartTelemetryConfig['validation']> = {}): boolean => {
    const defaultThresholds = DEFAULT_COLD_START_CONFIG.validation;
    const finalThresholds = { ...defaultThresholds, ...thresholds };

    return (
      metrics.swActivationTime <= finalThresholds.maxActivationTime &&
      metrics.firstFetchTime <= finalThresholds.maxFirstFetchTime &&
      metrics.totalTime <= finalThresholds.maxTotalTime
    );
  },

  /**
   * Get performance grade
   */
  getPerformanceGrade: (metrics: ColdStartMetrics): 'A' | 'B' | 'C' | 'D' | 'F' => {
    const score = ColdStartTelemetryUtils.calculatePerformanceScore(metrics);
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  /**
   * Calculate performance score (0-100)
   */
  calculatePerformanceScore: (metrics: ColdStartMetrics): number => {
    const thresholds = DEFAULT_COLD_START_CONFIG.validation;
    
    const activationScore = Math.max(0, 100 - (metrics.swActivationTime / thresholds.maxActivationTime) * 100);
    const fetchScore = Math.max(0, 100 - (metrics.firstFetchTime / thresholds.maxFirstFetchTime) * 100);
    const totalScore = Math.max(0, 100 - (metrics.totalTime / thresholds.maxTotalTime) * 100);
    
    return Math.round((activationScore + fetchScore + totalScore) / 3);
  },

  /**
   * Format metrics for display
   */
  formatMetrics: (metrics: ColdStartMetrics): string => {
    return `
Cold Start Performance Metrics:
- SW Activation: ${metrics.swActivationTime}ms
- First Fetch: ${metrics.firstFetchTime}ms
- Total Time: ${metrics.totalTime}ms
- SW Version: ${metrics.swVersion}
- Grade: ${ColdStartTelemetryUtils.getPerformanceGrade(metrics)}
- Score: ${ColdStartTelemetryUtils.calculatePerformanceScore(metrics)}/100
    `.trim();
  },
};

export default usePWAColdStartTelemetry;
