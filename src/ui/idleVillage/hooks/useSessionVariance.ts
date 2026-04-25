/**
 * Idle Village Session Variance Hook
 * 
 * Hook for monitoring session duration variance across desktop and mobile platforms.
 * Calculates statistics, detects alerts, and manages real-time updates.
 * 
 * @since NP-053 – Idle Village Session Variance Monitor
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type {
  SessionVarianceConfig,
  SessionData,
  SessionStatistics,
  VarianceAlert,
  Platform,
  SessionBucket,
} from '../config/sessionVarianceConfig';
import {
  DEFAULT_SESSION_VARIANCE_CONFIG,
  createSafeSessionVarianceConfig,
  getSessionBucket,
  validateSessionData,
  createSafeSessionData,
  calculateSessionStatistics,
  formatDuration,
  calculatePercentageDifference,
  isVarianceExcessive,
  isSessionOutlier,
  isBucketDistributionBalanced,
  isPlatformDistributionBalanced,
} from '../config/sessionVarianceConfig';

/**
 * Hook return type
 */
export interface UseSessionVarianceReturn {
  /** Current configuration */
  config: SessionVarianceConfig;
  /** Session data */
  sessions: SessionData[];
  /** Calculated statistics */
  statistics: SessionStatistics;
  /** Active alerts */
  alerts: VarianceAlert[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number;
  /** Add new session */
  addSession: (session: Partial<SessionData>) => void;
  /** Remove session */
  removeSession: (sessionId: string) => void;
  /** Clear all sessions */
  clearSessions: () => void;
  /** Update configuration */
  updateConfig: (config: Partial<SessionVarianceConfig>) => void;
  /** Export data */
  exportData: (format: 'json' | 'csv' | 'markdown') => string;
  /** Refresh statistics */
  refreshStatistics: () => void;
  /** Check for alerts */
  checkAlerts: () => VarianceAlert[];
  /** Get sessions by platform */
  getSessionsByPlatform: (platform: Platform) => SessionData[];
  /** Get sessions by bucket */
  getSessionsByBucket: (bucket: SessionBucket) => SessionData[];
  /** Get session duration trend */
  getSessionTrend: (limit?: number) => number[];
}

/**
 * Main session variance hook
 */
export function useSessionVariance(
  customConfig?: Partial<SessionVarianceConfig>
): UseSessionVarianceReturn {
  const [config, setConfig] = useState<SessionVarianceConfig>(
    createSafeSessionVarianceConfig(customConfig)
  );
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [alerts, setAlerts] = useState<VarianceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load configuration
        const savedConfig = await loadData<SessionVarianceConfig>(
          'idle-village-session-variance-config'
        );
        if (savedConfig) {
          setConfig(createSafeSessionVarianceConfig(savedConfig));
        }

        // Load sessions
        const savedSessions = await loadData<SessionData[]>(
          'idle-village-session-variance-sessions'
        );
        if (savedSessions && Array.isArray(savedSessions)) {
          const validSessions = savedSessions.filter(validateSessionData);
          setSessions(validSessions);
        }

        // Load alerts
        const savedAlerts = await loadData<VarianceAlert[]>(
          'idle-village-session-variance-alerts'
        );
        if (savedAlerts && Array.isArray(savedAlerts)) {
          setAlerts(savedAlerts);
        }

        setLastUpdate(Date.now());
      } catch (err) {
        console.error('Failed to load session variance data:', err);
        setError('Failed to load saved data');
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (!isLoading) {
      const saveData = async () => {
        try {
          await Promise.all([
            saveData('idle-village-session-variance-config', config),
            saveData('idle-village-session-variance-sessions', sessions),
            saveData('idle-village-session-variance-alerts', alerts),
          ]);
        } catch (err) {
          console.error('Failed to save session variance data:', err);
        }
      };

      saveData();
    }
  }, [config, sessions, alerts, isLoading]);

  // Real-time updates
  useEffect(() => {
    if (!config.processing.enableRealTime) return;

    const interval = setInterval(() => {
      refreshStatistics();
      if (config.alerts.enabled) {
        checkAlerts();
      }
    }, config.processing.refreshInterval);

    return () => clearInterval(interval);
  }, [config, sessions]);

  // Calculate statistics
  const statistics = useMemo(() => {
    return calculateSessionStatistics(sessions);
  }, [sessions]);

  // Add new session
  const addSession = useCallback((sessionData: Partial<SessionData>) => {
    const session = createSafeSessionData(sessionData);
    
    setSessions(prev => {
      const newSessions = [...prev, session];
      
      // Limit data points
      if (newSessions.length > config.processing.maxDataPoints) {
        return newSessions.slice(-config.processing.maxDataPoints);
      }
      
      return newSessions;
    });
    
    setLastUpdate(Date.now());
  }, [config.processing.maxDataPoints]);

  // Remove session
  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setLastUpdate(Date.now());
  }, []);

  // Clear all sessions
  const clearSessions = useCallback(() => {
    setSessions([]);
    setAlerts([]);
    setLastUpdate(Date.now());
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<SessionVarianceConfig>) => {
    setConfig(prev => createSafeSessionVarianceConfig({ ...prev, ...newConfig }));
  }, []);

  // Export data
  const exportData = useCallback((format: 'json' | 'csv' | 'markdown'): string => {
    const exportData = {
      config,
      sessions,
      statistics,
      alerts,
      exportedAt: new Date().toISOString(),
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      
      case 'csv':
        return exportToCsv(sessions, statistics);
      
      case 'markdown':
        return exportToMarkdown(exportData);
      
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }, [config, sessions, statistics, alerts]);

  // Refresh statistics
  const refreshStatistics = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  // Check for alerts
  const checkAlerts = useCallback((): VarianceAlert[] => {
    if (!config.alerts.enabled) return [];

    const newAlerts: VarianceAlert[] = [];
    const now = Date.now();

    // Check variance threshold
    if (isVarianceExcessive(
      statistics.variance,
      config.kpiTargets.maxVariance,
      config.alerts.thresholds.varianceThreshold
    )) {
      newAlerts.push({
        id: `variance-${now}`,
        type: 'high_variance',
        severity: 'high',
        message: `Session variance (${formatDuration(statistics.standardDeviation)}) exceeds target by ${calculatePercentageDifference(
          statistics.variance,
          config.kpiTargets.maxVariance
        ).toFixed(1)}%`,
        timestamp: now,
        data: {
          variance: statistics.variance,
          threshold: config.kpiTargets.maxVariance,
          actualValue: statistics.standardDeviation,
          expectedValue: Math.sqrt(config.kpiTargets.maxVariance),
        },
      });
    }

    // Check for outliers
    const outliers = sessions.filter(session =>
      isSessionOutlier(
        session.duration,
        statistics.averageDuration,
        statistics.standardDeviation,
        config.alerts.thresholds.outlierThreshold
      )
    );

    if (outliers.length > 0) {
      newAlerts.push({
        id: `outliers-${now}`,
        type: 'outlier',
        severity: 'medium',
        message: `Found ${outliers.length} outlier sessions (±${config.alerts.thresholds.outlierThreshold}σ)`,
        timestamp: now,
        data: {
          actualValue: outliers.length,
          threshold: config.alerts.thresholds.outlierThreshold,
        },
      });
    }

    // Check bucket distribution balance
    if (!isBucketDistributionBalanced(
      statistics.bucketDistribution,
      config.kpiTargets.targetBucketDistribution,
      config.alerts.thresholds.bucketImbalanceThreshold
    )) {
      newAlerts.push({
        id: `bucket-imbalance-${now}`,
        type: 'bucket_imbalance',
        severity: 'medium',
        message: 'Session bucket distribution is imbalanced',
        timestamp: now,
        data: {
          actualValue: Object.values(statistics.bucketDistribution).reduce((a, b) => a + b, 0),
          threshold: config.alerts.thresholds.bucketImbalanceThreshold,
        },
      });
    }

    // Check platform distribution balance
    if (!isPlatformDistributionBalanced(
      statistics.platformDistribution,
      config.kpiTargets.targetPlatformDistribution,
      config.alerts.thresholds.platformDivergenceThreshold
    )) {
      newAlerts.push({
        id: `platform-divergence-${now}`,
        type: 'platform_divergence',
        severity: 'low',
        message: 'Platform session distribution shows divergence',
        timestamp: now,
        data: {
          actualValue: Object.values(statistics.platformDistribution).reduce((a, b) => a + b, 0),
          threshold: config.alerts.thresholds.platformDivergenceThreshold,
        },
      });
    }

    // Update alerts with cooldown
    setAlerts(prev => {
      const filtered = prev.filter(alert => 
        now - alert.timestamp > config.alerts.cooldown
      );
      return [...filtered, ...newAlerts];
    });

    return newAlerts;
  }, [config, statistics, sessions]);

  // Get sessions by platform
  const getSessionsByPlatform = useCallback((platform: Platform): SessionData[] => {
    return sessions.filter(s => s.platform === platform);
  }, [sessions]);

  // Get sessions by bucket
  const getSessionsByBucket = useCallback((bucket: SessionBucket): SessionData[] => {
    return sessions.filter(s => s.bucket === bucket);
  }, [sessions]);

  // Get session duration trend
  const getSessionTrend = useCallback((limit?: number): number[] => {
    const limitedSessions = limit 
      ? sessions.slice(-limit)
      : sessions;
    
    return limitedSessions.map(s => s.duration);
  }, [sessions]);

  return {
    config,
    sessions,
    statistics,
    alerts,
    isLoading,
    error,
    lastUpdate,
    addSession,
    removeSession,
    clearSessions,
    updateConfig,
    exportData,
    refreshStatistics,
    checkAlerts,
    getSessionsByPlatform,
    getSessionsByBucket,
    getSessionTrend,
  };
}

/**
 * Export sessions to CSV format
 */
function exportToCsv(sessions: SessionData[], statistics: SessionStatistics): string {
  const headers = [
    'ID',
    'Platform',
    'Start Time',
    'End Time',
    'Duration (s)',
    'Bucket',
    'User ID',
  ];
  
  const rows = sessions.map(session => [
    session.id,
    session.platform,
    new Date(session.startTime).toISOString(),
    new Date(session.endTime).toISOString(),
    session.duration.toString(),
    session.bucket,
    session.userId || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '',
    'Statistics',
    `Total Sessions,${statistics.totalSessions}`,
    `Average Duration,${statistics.averageDuration}`,
    `Median Duration,${statistics.medianDuration}`,
    `Standard Deviation,${statistics.standardDeviation}`,
    `Variance,${statistics.variance}`,
    `Min Duration,${statistics.minDuration}`,
    `Max Duration,${statistics.maxDuration}`,
  ].join('\n');

  return csvContent;
}

/**
 * Export data to Markdown format
 */
function exportToMarkdown(data: {
  config: SessionVarianceConfig;
  sessions: SessionData[];
  statistics: SessionStatistics;
  alerts: VarianceAlert[];
  exportedAt: string;
}): string {
  const { config, sessions, statistics, alerts, exportedAt } = data;

  return `# Idle Village Session Variance Report

**Exported:** ${new Date(exportedAt).toLocaleString()}
**Total Sessions:** ${statistics.totalSessions}

## Configuration

### Buckets
${Object.entries(config.buckets).map(([key, bucket]) => 
  `- **${bucket.name}** (${key}): ${formatDuration(bucket.minDuration)} - ${bucket.maxDuration === Infinity ? '∞' : formatDuration(bucket.maxDuration)}`
).join('\n')}

### KPI Targets
- **Target Std Dev:** ${formatDuration(config.kpiTargets.targetStdDev)}
- **Max Variance:** ${config.kpiTargets.maxVariance}
- **Platform Divergence:** ${(config.kpiTargets.maxPlatformDivergence * 100).toFixed(1)}%

## Statistics

### Overall
- **Total Sessions:** ${statistics.totalSessions}
- **Average Duration:** ${formatDuration(statistics.averageDuration)}
- **Median Duration:** ${formatDuration(statistics.medianDuration)}
- **Standard Deviation:** ${formatDuration(statistics.standardDeviation)}
- **Variance:** ${statistics.variance.toFixed(0)}
- **Min Duration:** ${formatDuration(statistics.minDuration)}
- **Max Duration:** ${formatDuration(statistics.maxDuration)}

### Bucket Distribution
${Object.entries(statistics.bucketDistribution).map(([bucket, count]) => {
  const percentage = ((count / statistics.totalSessions) * 100).toFixed(1);
  return `- **${bucket}:** ${count} sessions (${percentage}%)`;
}).join('\n')}

### Platform Distribution
${Object.entries(statistics.platformDistribution).map(([platform, count]) => {
  const percentage = ((count / statistics.totalSessions) * 100).toFixed(1);
  return `- **${platform}:** ${count} sessions (${percentage}%)`;
}).join('\n')}

## Alerts

${alerts.length === 0 ? 'No active alerts.' : alerts.map(alert => 
  `- **${alert.type}** (${alert.severity}): ${alert.message}`
).join('\n')}

## Recent Sessions

| ID | Platform | Duration | Bucket | Start Time |
|---|---|---|---|---|
${sessions.slice(-10).map(session => 
  `| ${session.id} | ${session.platform} | ${formatDuration(session.duration)} | ${session.bucket} | ${new Date(session.startTime).toLocaleString()} |`
).join('\n')}
`;
}

/**
 * Mock data generator for testing
 */
export function generateMockSessionData(count: number = 100): SessionData[] {
  const mockSessions: SessionData[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const platform = Math.random() > 0.4 ? 'desktop' : 'mobile';
    const duration = Math.random() * 3600 + 60; // 1 minute to 1 hour
    const startTime = now - (i * 60000) - (Math.random() * 300000);
    const endTime = startTime + (duration * 1000);
    
    mockSessions.push(createSafeSessionData({
      id: `mock-session-${i}`,
      platform,
      startTime,
      endTime,
      duration,
      bucket: getSessionBucket(duration),
      userId: `user-${Math.floor(Math.random() * 50)}`,
    }));
  }
  
  return mockSessions;
}

/**
 * Hook for real-time session tracking
 */
export function useRealTimeSessionTracking(
  onSessionEnd?: (session: SessionData) => void
) {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Start session tracking
  const startSession = useCallback((platform: Platform = 'desktop') => {
    const now = Date.now();
    setSessionStartTime(now);
    setCurrentSession(createSafeSessionData({
      platform,
      startTime: now,
      endTime: now,
      duration: 0,
    }));
  }, []);

  // End session tracking
  const endSession = useCallback(() => {
    if (!sessionStartTime || !currentSession) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - sessionStartTime) / 1000);
    
    const completedSession = createSafeSessionData({
      ...currentSession,
      endTime,
      duration,
    });

    setCurrentSession(null);
    setSessionStartTime(null);
    
    onSessionEnd?.(completedSession);
    
    return completedSession;
  }, [sessionStartTime, currentSession, onSessionEnd]);

  // Get current session duration
  const getCurrentDuration = useCallback((): number => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime) / 1000);
  }, [sessionStartTime]);

  return {
    currentSession,
    sessionStartTime,
    startSession,
    endSession,
    getCurrentDuration,
    isActive: sessionStartTime !== null,
  };
}

export default useSessionVariance;
