/**
 * Crew Alert Rules Hook - NP-031
 * 
 * React hook for managing configurable alert rules in Idle Village crew scheduler.
 * Evaluates rules against crew metrics and triggers alerts to Active HUD.
 * Follows config-first design with PersistenceService for preferences.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CrewSchedulerController } from '../controllers/CrewSchedulerController';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type {
  CrewAlertRulesConfig,
  CrewAlertRule,
  CrewAlertRuleType,
  CrewAlertRuleSeverity,
} from '../config/crewAlertRules';
import {
  createCrewAlertRulesConfig,
  createCrewAlertRule,
  getAlertRulesByType,
  getAlertRulesBySeverity,
  getAlertRulesByTags,
} from '../config/crewAlertRules';

/**
 * Crew alert data structure
 */
export interface CrewAlert {
  /** Unique alert identifier */
  id: string;
  /** Rule that triggered this alert */
  ruleId: string;
  /** Rule name */
  ruleName: string;
  /** Alert level */
  alertLevel: string;
  /** Alert message */
  message: string;
  /** Alert timestamp */
  timestamp: number;
  /** Alert severity */
  severity: string;
  /** Whether alert is active */
  active: boolean;
  /** Alert data context */
  context: Record<string, unknown>;
  /** Tags for categorization */
  tags: string[];
}

/**
 * Crew metrics for rule evaluation
 */
export interface CrewMetrics {
  /** Total crew count */
  totalCrew: number;
  /** Available crew count */
  availableCount: number;
  /** Working crew count */
  workingCount: number;
  /** Resting crew count */
  restingCount: number;
  /** Injured crew count */
  injuredCount: number;
  /** Exhausted crew count */
  exhaustedCount: number;
  /** Average fatigue level */
  averageFatigue: number;
  /** Queue size */
  queueSize: number;
  /** Average wait time in queue */
  averageWaitTime: number;
  /** Average response time */
  averageResponseTime: number;
  /** Pending tasks count */
  pendingCount: number;
  /** Injury rate (0-1) */
  injuryRate: number;
  /** Exhaustion rate (0-1) */
  exhaustionRate: number;
  /** Bottleneck activities count */
  bottleneckActivities: number;
  /** Queue utilization (0-1) */
  queueUtilization: number;
  /** High priority backlog count */
  highPriorityBacklog: number;
  /** Average priority score */
  averagePriority: number;
}

/**
 * Hook options
 */
export interface UseCrewAlertRulesOptions {
  /** Custom configuration */
  config?: Partial<CrewAlertRulesConfig>;
  /** Custom crew controller */
  controller?: CrewSchedulerController;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook return value
 */
export interface UseCrewAlertRulesReturn {
  /** Current configuration */
  config: CrewAlertRulesConfig;
  /** Active alerts */
  alerts: CrewAlert[];
  /** Current crew metrics */
  metrics: CrewMetrics | null;
  /** Whether rules are enabled */
  enabled: boolean;
  /** Update configuration */
  updateConfig: (config: Partial<CrewAlertRulesConfig>) => void;
  /** Add new alert rule */
  addRule: (rule: Partial<CrewAlertRule>) => void;
  /** Update existing rule */
  updateRule: (ruleId: string, updates: Partial<CrewAlertRule>) => void;
  /** Remove alert rule */
  removeRule: (ruleId: string) => void;
  /** Toggle rule enabled state */
  toggleRule: (ruleId: string) => void;
  /** Clear all alerts */
  clearAlerts: () => void;
  /** Dismiss specific alert */
  dismissAlert: (alertId: string) => void;
  /** Get rules by type */
  getRulesByType: (type: CrewAlertRuleType) => CrewAlertRule[];
  /** Get rules by severity */
  getRulesBySeverity: (severity: CrewAlertRuleSeverity) => CrewAlertRule[];
  /** Get rules by tags */
  getRulesByTags: (tags: string[]) => CrewAlertRule[];
  /** Force evaluation of all rules */
  evaluateRules: () => void;
  /** Get alert statistics */
  getAlertStats: () => {
    total: number;
    active: number;
    byLevel: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

const CREW_ALERT_RULES_STORAGE_KEY = 'crew_alert_rules_config';
const CREW_ALERTS_STORAGE_KEY = 'crew_alerts_history';

/**
 * Hook for managing crew alert rules
 */
export function useCrewAlertRules(options: UseCrewAlertRulesOptions = {}): UseCrewAlertRulesReturn {
  const { config: userConfig, controller, debug = false } = options;
  
  // State management
  const [config, setConfig] = useState<CrewAlertRulesConfig>(() => 
    createCrewAlertRulesConfig(userConfig)
  );
  const [alerts, setAlerts] = useState<CrewAlert[]>([]);
  const [metrics, setMetrics] = useState<CrewMetrics | null>(null);
  
  // Refs for tracking
  const lastEvaluationRef = useRef<number>(0);
  const ruleCooldownsRef = useRef<Map<string, number>>(new Map());
  const alertHistoryRef = useRef<CrewAlert[]>([]);
  
  // Load persisted configuration on mount
  useEffect(() => {
    const loadPersistedConfig = async () => {
      try {
        const persisted = await loadData<CrewAlertRulesConfig>(
          CREW_ALERT_RULES_STORAGE_KEY,
          config
        );
        if (persisted) {
          setConfig(createCrewAlertRulesConfig(persisted));
        }
      } catch (error) {
        if (debug) {
          console.warn('Failed to load crew alert rules config:', error);
        }
      }
    };
    
    const loadPersistedAlerts = async () => {
      try {
        const persisted = await loadData<CrewAlert[]>(
          CREW_ALERTS_STORAGE_KEY,
          []
        );
        if (persisted) {
          alertHistoryRef.current = persisted;
          setAlerts(persisted.filter(alert => alert.active));
        }
      } catch (error) {
        if (debug) {
          console.warn('Failed to load crew alerts history:', error);
        }
      }
    };
    
    loadPersistedConfig();
    loadPersistedAlerts();
  }, [debug]); // Only debug in dependencies to avoid infinite loops
  
  // Save configuration to persistence
  const saveConfig = useCallback(async (newConfig: CrewAlertRulesConfig) => {
    try {
      await saveData(CREW_ALERT_RULES_STORAGE_KEY, newConfig);
    } catch (error) {
      if (debug) {
        console.warn('Failed to save crew alert rules config:', error);
      }
    }
  }, [debug]);
  
  // Save alerts to persistence
  const saveAlerts = useCallback(async () => {
    try {
      await saveData(CREW_ALERTS_STORAGE_KEY, alertHistoryRef.current);
    } catch (error) {
      if (debug) {
        console.warn('Failed to save crew alerts history:', error);
      }
    }
  }, [debug]);
  
  // Calculate crew metrics from controller state
  const calculateMetrics = useCallback((): CrewMetrics | null => {
    if (!controller) {
      return null;
    }
    
    try {
      // Use type assertion to handle different controller interfaces
      const state = (controller as any).getState?.() || {};
      const residents = state.residents || [];
      const queue = state.queue || [];
      const activities = state.activities || [];
      
      // Basic counts
      const totalCrew = residents.length;
      const availableCount = residents.filter((r: any) => r.status === 'available').length;
      const workingCount = residents.filter((r: any) => r.status === 'working').length;
      const restingCount = residents.filter((r: any) => r.status === 'resting').length;
      const injuredCount = residents.filter((r: any) => r.status === 'injured').length;
      const exhaustedCount = residents.filter((r: any) => r.fatigue >= 0.9).length;
      
      // Fatigue calculations
      const averageFatigue = residents.reduce((sum: number, r: any) => sum + (r.fatigue || 0), 0) / totalCrew;
      const exhaustionRate = exhaustedCount / totalCrew;
      const injuryRate = injuredCount / totalCrew;
      
      // Queue metrics
      const queueSize = queue.length;
      const averageWaitTime = queue.reduce((sum: number, item: any) => sum + (item.waitTime || 0), 0) / queueSize || 0;
      const queueUtilization = queueSize / Math.max(1, totalCrew);
      
      // Response time and priority
      const pendingCount = queue.filter((item: any) => !item.started).length;
      const averageResponseTime = residents.reduce((sum: number, r: any) => sum + (r.responseTime || 0), 0) / totalCrew || 0;
      const highPriorityBacklog = queue.filter((item: any) => (item.priority || 0.5) > 0.7).length;
      const averagePriority = queue.reduce((sum: number, item: any) => sum + (item.priority || 0.5), 0) / queueSize || 0;
      
      // Activity bottleneck detection
      const activityCounts = activities.reduce((acc: any, activity: any) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const maxActivityCount = Math.max(...Object.values(activityCounts), 0);
      const bottleneckActivities = Object.values(activityCounts).filter((count: number) => count >= maxActivityCount * 0.8).length;
      
      return {
        totalCrew,
        availableCount,
        workingCount,
        restingCount,
        injuredCount,
        exhaustedCount,
        averageFatigue,
        queueSize,
        averageWaitTime,
        averageResponseTime,
        pendingCount,
        injuryRate,
        exhaustionRate,
        bottleneckActivities,
        queueUtilization,
        highPriorityBacklog,
        averagePriority,
      };
    } catch (error) {
      if (debug) {
        console.warn('Failed to calculate crew metrics:', error);
      }
      return null;
    }
  }, [controller, debug]);
  
  // Evaluate a single rule condition
  const evaluateCondition = useCallback((condition: {
    field: string;
    operator: string;
    threshold: number;
    secondaryThreshold?: number;
  }, metrics: CrewMetrics): boolean => {
    const { field, operator, threshold } = condition;
    const value = metrics[field as keyof CrewMetrics] as number;
    
    if (value === undefined || value === null) {
      return false;
    }
    
    switch (operator) {
      case '>':
        return value > threshold;
      case '>=':
        return value >= threshold;
      case '<':
        return value < threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      case '%>':
        return (value / 100) > threshold;
      case '%<':
        return (value / 100) < threshold;
      default:
        return false;
    }
  }, []);
  
  // Evaluate all rules and trigger alerts
  const evaluateRules = useCallback(() => {
    if (!config.enabled || !metrics) {
      return;
    }
    
    const now = Date.now();
    const newAlerts: CrewAlert[] = [];
    
    // Check each enabled rule
    for (const rule of config.rules.filter(r => r.enabled)) {
      // Check cooldown
      const lastTrigger = ruleCooldownsRef.current.get(rule.id) || 0;
      if (now - lastTrigger < rule.cooldownMs) {
        continue;
      }
      
      // Evaluate all conditions
      const conditionsMet = rule.conditions.every(condition => 
        evaluateCondition(condition, metrics)
      );
      
      if (conditionsMet) {
        // Update cooldown
        ruleCooldownsRef.current.set(rule.id, now);
        
        // Generate alert message
        const message = rule.messageTemplate || `${rule.name} triggered`;
        const formattedMessage = message.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return metrics[key as keyof CrewMetrics]?.toString() || match;
        });
        
        // Create alert
        const alert: CrewAlert = {
          id: `alert_${rule.id}_${now}`,
          ruleId: rule.id,
          ruleName: rule.name,
          alertLevel: rule.alertLevel,
          message: formattedMessage,
          timestamp: now,
          severity: rule.severity,
          active: true,
          context: { ...metrics, rule },
          tags: rule.tags,
        };
        
        newAlerts.push(alert);
        
        if (debug) {
          console.log(`Crew alert triggered: ${rule.name}`, alert);
        }
      }
    }
    
    // Update alerts
    if (newAlerts.length > 0) {
      const updatedAlerts = [...newAlerts, ...alertHistoryRef.current];
      alertHistoryRef.current = updatedAlerts.slice(-config.maxAlertHistory);
      setAlerts(updatedAlerts.filter(alert => alert.active));
      saveAlerts();
    }
    
    lastEvaluationRef.current = now;
  }, [config, metrics, evaluateCondition, debug, saveAlerts]);
  
  // Update metrics and evaluate rules periodically
  useEffect(() => {
    if (!controller) {
      return;
    }
    
    const updateAndEvaluate = () => {
      const newMetrics = calculateMetrics();
      setMetrics(newMetrics);
      
      if (newMetrics) {
        evaluateRules();
      }
      
      // Schedule next evaluation
      const timeoutId = setTimeout(updateAndEvaluate, config.refreshRate || 5000);
      return () => clearTimeout(timeoutId);
    };
    
    // Initial evaluation
    const timeoutId = setTimeout(updateAndEvaluate, 0);
    
    return () => clearTimeout(timeoutId);
  }, [controller, calculateMetrics, evaluateRules, config.refreshRate]);
  
  // Clean up old alerts periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const cutoff = now - config.alertRetentionMs;
      
      const cleanedAlerts = alertHistoryRef.current.filter(alert => 
        alert.timestamp > cutoff || alert.active
      );
      
      if (cleanedAlerts.length !== alertHistoryRef.current.length) {
        alertHistoryRef.current = cleanedAlerts;
        setAlerts(cleanedAlerts.filter(alert => alert.active));
        saveAlerts();
      }
      
      // Schedule next cleanup
      const timeoutId = setTimeout(cleanup, 60000); // Check every minute
      return () => clearTimeout(timeoutId);
    };
    
    const timeoutId = setTimeout(cleanup, 60000);
    
    return () => clearTimeout(timeoutId);
  }, [config.alertRetentionMs, saveAlerts]);
  
  // Configuration management
  const updateConfig = useCallback((updates: Partial<CrewAlertRulesConfig>) => {
    const newConfig = createCrewAlertRulesConfig({ ...config, ...updates });
    setConfig(newConfig);
    saveConfig(newConfig);
  }, [config, saveConfig]);
  
  // Rule management
  const addRule = useCallback((rule: Partial<CrewAlertRule>) => {
    const newRule = createCrewAlertRule(rule);
    const updatedConfig = {
      ...config,
      rules: [...config.rules, newRule],
    };
    updateConfig(updatedConfig);
  }, [config, updateConfig]);
  
  const updateRule = useCallback((ruleId: string, updates: Partial<CrewAlertRule>) => {
    const updatedRules = config.rules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates, updatedAt: Date.now() } : rule
    );
    updateConfig({ rules: updatedRules });
  }, [config.rules, updateConfig]);
  
  const removeRule = useCallback((ruleId: string) => {
    const updatedRules = config.rules.filter(rule => rule.id !== ruleId);
    updateConfig({ rules: updatedRules });
    
    // Remove related alerts
    const updatedAlerts = alertHistoryRef.current.filter(alert => alert.ruleId !== ruleId);
    alertHistoryRef.current = updatedAlerts;
    setAlerts(updatedAlerts.filter(alert => alert.active));
    saveAlerts();
  }, [config.rules, updateConfig, saveAlerts]);
  
  const toggleRule = useCallback((ruleId: string) => {
    const rule = config.rules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, { enabled: !rule.enabled });
    }
  }, [config.rules, updateRule]);
  
  // Alert management
  const clearAlerts = useCallback(() => {
    const deactivatedAlerts = alertHistoryRef.current.map(alert => ({
      ...alert,
      active: false,
    }));
    alertHistoryRef.current = deactivatedAlerts;
    setAlerts([]);
    saveAlerts();
  }, [saveAlerts]);
  
  const dismissAlert = useCallback((alertId: string) => {
    const updatedAlerts = alertHistoryRef.current.map(alert =>
      alert.id === alertId ? { ...alert, active: false } : alert
    );
    alertHistoryRef.current = updatedAlerts;
    setAlerts(updatedAlerts.filter(alert => alert.active));
    saveAlerts();
  }, [saveAlerts]);
  
  // Rule queries
  const getRulesByTypeCallback = useCallback((type: CrewAlertRuleType) => {
    return getAlertRulesByType(config.rules, type);
  }, [config.rules]);
  
  const getRulesBySeverityCallback = useCallback((severity: CrewAlertRuleSeverity) => {
    return getAlertRulesBySeverity(config.rules, severity);
  }, [config.rules]);
  
  const getRulesByTagsCallback = useCallback((tags: string[]) => {
    return getAlertRulesByTags(config.rules, tags);
  }, [config.rules]);
  
  // Statistics
  const getAlertStats = useCallback(() => {
    const activeAlerts = alerts.filter(alert => alert.active);
    const byLevel = activeAlerts.reduce((acc, alert) => {
      acc[alert.alertLevel] = (acc[alert.alertLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const bySeverity = activeAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: alertHistoryRef.current.length,
      active: activeAlerts.length,
      byLevel,
      bySeverity,
    };
  }, [alerts]);
  
  return {
    config,
    alerts: alerts.filter(alert => alert.active),
    metrics,
    enabled: config.enabled,
    updateConfig,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    clearAlerts,
    dismissAlert,
    getRulesByType: getRulesByTypeCallback,
    getRulesBySeverity: getRulesBySeverityCallback,
    getRulesByTags: getRulesByTagsCallback,
    evaluateRules,
    getAlertStats,
  };
}
