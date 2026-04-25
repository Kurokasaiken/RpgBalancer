/**
 * NP-039 – Idle Village Scheduler Telemetry Alerting
 *
 * React hook for managing telemetry alert configuration with persistence.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { saveData, loadData } from '../../../shared/persistence/PersistenceService';
import { TelemetryAlertScheduler } from '../services/telemetryAlertScheduler';
import type {
  TelemetryAlertSchedulerConfig,
  AlertRule,
  NotificationChannel,
  AlertInstance,
  SchedulerStats,
  AlertSeverity,
} from '../types/telemetryAlertScheduler';
import {
  DEFAULT_TELEMETRY_ALERT_SCHEDULER_CONFIG,
  createDefaultErrorRateRule,
  createDefaultPerformanceRule,
  validateAlertRule,
  validateNotificationChannel,
} from '../types/telemetryAlertScheduler';

/**
 * Hook state
 */
interface UseTelemetryAlertConfigState {
  config: TelemetryAlertSchedulerConfig;
  scheduler: TelemetryAlertScheduler | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  stats: SchedulerStats | null;
  activeAlerts: AlertInstance[];
  alertHistory: AlertInstance[];
}

/**
 * Hook return type
 */
interface UseTelemetryAlertConfigReturn extends UseTelemetryAlertConfigState {
  // Scheduler control
  startScheduler: () => void;
  stopScheduler: () => void;

  // Configuration management
  updateConfig: (updates: Partial<TelemetryAlertSchedulerConfig>) => void;
  addAlertRule: (rule: Omit<AlertRule, 'id' | 'metadata'>) => string;
  updateAlertRule: (ruleId: string, updates: Partial<AlertRule>) => void;
  removeAlertRule: (ruleId: string) => void;
  duplicateAlertRule: (ruleId: string) => string;
  toggleAlertRule: (ruleId: string) => void;

  // Notification channels
  addNotificationChannel: (channel: Omit<NotificationChannel, 'id'>) => string;
  updateNotificationChannel: (channelId: string, updates: Partial<NotificationChannel>) => void;
  removeNotificationChannel: (channelId: string) => void;
  toggleNotificationChannel: (channelId: string) => void;

  // Alert management
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;

  // Data sources
  registerDataSource: (source: any) => void; // KPIDataSource
  unregisterDataSource: (sourceId: string) => void;

  // Utility methods
  getAvailableMetrics: () => string[];
  createDefaultRules: () => void;
  validateConfig: () => boolean;
  exportConfig: () => TelemetryAlertSchedulerConfig;
  importConfig: (config: TelemetryAlertSchedulerConfig) => boolean;
  resetToDefaults: () => void;
}

/**
 * Telemetry alert configuration hook
 */
export function useTelemetryAlertConfig(
  initialConfig?: Partial<TelemetryAlertSchedulerConfig>
): UseTelemetryAlertConfigReturn {
  const schedulerRef = useRef<TelemetryAlertScheduler | null>(null);
  const [state, setState] = useState<UseTelemetryAlertConfigState>({
    config: { ...DEFAULT_TELEMETRY_ALERT_SCHEDULER_CONFIG, ...initialConfig },
    scheduler: null,
    isInitialized: false,
    isLoading: false,
    error: null,
    stats: null,
    activeAlerts: [],
    alertHistory: [],
  });

  // Initialize scheduler and load persisted config
  useEffect(() => {
    const initializeScheduler = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Load persisted config
        const persistedConfig = await loadData<TelemetryAlertSchedulerConfig>('telemetry-alert-config', DEFAULT_TELEMETRY_ALERT_SCHEDULER_CONFIG);

        // Merge with initial config if provided
        const mergedConfig = initialConfig
          ? { ...persistedConfig, ...initialConfig }
          : persistedConfig;

        // Validate loaded config
        const validatedConfig = {
          ...mergedConfig,
          rules: mergedConfig.rules.filter(validateAlertRule),
          channels: mergedConfig.channels.filter(validateNotificationChannel),
        };

        setState(prev => ({ ...prev, config: validatedConfig }));

        // Create and initialize scheduler
        const scheduler = new TelemetryAlertScheduler(validatedConfig);
        schedulerRef.current = scheduler;

        setState(prev => ({
          ...prev,
          scheduler,
          isInitialized: true,
          isLoading: false,
          stats: scheduler.getStats(),
          activeAlerts: scheduler.getActiveAlerts(),
          alertHistory: scheduler.getAlertHistory(50),
        }));

      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize alert scheduler',
        }));
      }
    };

    initializeScheduler();

    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.dispose();
        schedulerRef.current = null;
      }
    };
  }, []);

  // Update scheduler when config changes
  useEffect(() => {
    if (schedulerRef.current && state.isInitialized) {
      schedulerRef.current.updateConfig(state.config);
    }
  }, [state.config, state.isInitialized]);

  // Update stats and alerts periodically
  useEffect(() => {
    if (!state.isInitialized || !schedulerRef.current) return;

    const updateData = () => {
      const scheduler = schedulerRef.current!;
      setState(prev => ({
        ...prev,
        stats: scheduler.getStats(),
        activeAlerts: scheduler.getActiveAlerts(),
        alertHistory: scheduler.getAlertHistory(50),
      }));
    };

    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [state.isInitialized]);

  // Auto-save config changes
  useEffect(() => {
    if (!state.isInitialized || state.isLoading) return;

    const saveConfig = async () => {
      try {
        await saveData('telemetry-alert-config', state.config);
      } catch (error) {
        console.warn('[useTelemetryAlertConfig] Failed to save config:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? `Save failed: ${error.message}` : 'Failed to save configuration',
        }));
      }
    };

    saveConfig();
  }, [state.config, state.isInitialized, state.isLoading]);

  /**
   * Start scheduler
   */
  const startScheduler = useCallback(() => {
    if (!schedulerRef.current) return;
    schedulerRef.current.start();
  }, []);

  /**
   * Stop scheduler
   */
  const stopScheduler = useCallback(() => {
    if (!schedulerRef.current) return;
    schedulerRef.current.stop();
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<TelemetryAlertSchedulerConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates, metadata: { ...prev.config.metadata, updatedAt: Date.now() } },
    }));
  }, []);

  /**
   * Add new alert rule
   */
  const addAlertRule = useCallback((ruleData: Omit<AlertRule, 'id' | 'metadata'>): string => {
    const newRule: AlertRule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: 'system',
        version: '1.0.0',
      },
    };

    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rules: [...prev.config.rules, newRule],
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));

    return newRule.id;
  }, []);

  /**
   * Update existing alert rule
   */
  const updateAlertRule = useCallback((ruleId: string, updates: Partial<AlertRule>) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rules: prev.config.rules.map(rule =>
          rule.id === ruleId
            ? { ...rule, ...updates, metadata: { ...rule.metadata, updatedAt: Date.now() } }
            : rule
        ),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Remove alert rule
   */
  const removeAlertRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rules: prev.config.rules.filter(rule => rule.id !== ruleId),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Duplicate alert rule
   */
  const duplicateAlertRule = useCallback((ruleId: string): string => {
    const originalRule = state.config.rules.find(rule => rule.id === ruleId);
    if (!originalRule) return '';

    const duplicatedRule = {
      ...originalRule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalRule.name} (Copy)`,
      enabled: false, // Disable by default
      metadata: {
        ...originalRule.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rules: [...prev.config.rules, duplicatedRule],
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));

    return duplicatedRule.id;
  }, [state.config.rules]);

  /**
   * Toggle alert rule enabled/disabled
   */
  const toggleAlertRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rules: prev.config.rules.map(rule =>
          rule.id === ruleId
            ? { ...rule, enabled: !rule.enabled, metadata: { ...rule.metadata, updatedAt: Date.now() } }
            : rule
        ),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Add notification channel
   */
  const addNotificationChannel = useCallback((channelData: Omit<NotificationChannel, 'id'>): string => {
    const newChannel: NotificationChannel = {
      ...channelData,
      id: `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        channels: [...prev.config.channels, newChannel],
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));

    return newChannel.id;
  }, []);

  /**
   * Update notification channel
   */
  const updateNotificationChannel = useCallback((channelId: string, updates: Partial<NotificationChannel>) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        channels: prev.config.channels.map(channel =>
          channel.id === channelId ? { ...channel, ...updates } : channel
        ),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Remove notification channel
   */
  const removeNotificationChannel = useCallback((channelId: string) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        channels: prev.config.channels.filter(channel => channel.id !== channelId),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Toggle notification channel enabled/disabled
   */
  const toggleNotificationChannel = useCallback((channelId: string) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        channels: prev.config.channels.map(channel =>
          channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
        ),
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    if (!schedulerRef.current) return;
    schedulerRef.current.acknowledgeAlert(alertId);
  }, []);

  /**
   * Resolve alert
   */
  const resolveAlert = useCallback((alertId: string) => {
    if (!schedulerRef.current) return;
    schedulerRef.current.resolveAlert(alertId);
  }, []);

  /**
   * Register data source
   */
  const registerDataSource = useCallback((source: any) => {
    if (!schedulerRef.current) return;
    schedulerRef.current.registerDataSource(source);
  }, []);

  /**
   * Unregister data source
   */
  const unregisterDataSource = useCallback((sourceId: string) => {
    if (!schedulerRef.current) return;
    schedulerRef.current.unregisterDataSource(sourceId);
  }, []);

  /**
   * Get available metrics
   */
  const getAvailableMetrics = useCallback((): string[] => {
    return schedulerRef.current?.getAvailableMetrics() || [];
  }, []);

  /**
   * Create default alert rules
   */
  const createDefaultRules = useCallback(() => {
    const errorRule = createDefaultErrorRateRule();
    const performanceRule = createDefaultPerformanceRule();

    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rules: [...prev.config.rules, errorRule, performanceRule],
        metadata: { ...prev.config.metadata, updatedAt: Date.now() },
      },
    }));
  }, []);

  /**
   * Validate configuration
   */
  const validateConfig = useCallback((): boolean => {
    const rulesValid = state.config.rules.every(validateAlertRule);
    const channelsValid = state.config.channels.every(validateNotificationChannel);
    return rulesValid && channelsValid;
  }, [state.config]);

  /**
   * Export configuration
   */
  const exportConfig = useCallback((): TelemetryAlertSchedulerConfig => {
    return { ...state.config };
  }, [state.config]);

  /**
   * Import configuration
   */
  const importConfig = useCallback((config: TelemetryAlertSchedulerConfig): boolean => {
    // Basic validation
    const rulesValid = config.rules?.every(validateAlertRule) ?? true;
    const channelsValid = config.channels?.every(validateNotificationChannel) ?? true;

    if (!rulesValid || !channelsValid) {
      setState(prev => ({ ...prev, error: 'Invalid configuration data' }));
      return false;
    }

    setState(prev => ({
      ...prev,
      config: { ...config, metadata: { ...config.metadata, updatedAt: Date.now() } },
      error: null
    }));

    return true;
  }, []);

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(() => {
    const defaultConfig = { ...DEFAULT_TELEMETRY_ALERT_SCHEDULER_CONFIG };
    setState(prev => ({
      ...prev,
      config: defaultConfig,
      error: null
    }));
  }, []);

  return {
    ...state,
    startScheduler,
    stopScheduler,
    updateConfig,
    addAlertRule,
    updateAlertRule,
    removeAlertRule,
    duplicateAlertRule,
    toggleAlertRule,
    addNotificationChannel,
    updateNotificationChannel,
    removeNotificationChannel,
    toggleNotificationChannel,
    acknowledgeAlert,
    resolveAlert,
    registerDataSource,
    unregisterDataSource,
    getAvailableMetrics,
    createDefaultRules,
    validateConfig,
    exportConfig,
    importConfig,
    resetToDefaults,
  };
}
