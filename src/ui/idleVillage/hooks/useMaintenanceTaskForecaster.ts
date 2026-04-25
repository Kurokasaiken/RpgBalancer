/**
 * Maintenance Task Forecaster Hook
 *
 * React hook for integrating maintenance task forecasting into UI components,
 * providing real-time task generation, scheduling recommendations, and state management.
 *
 * @module useMaintenanceTaskForecaster
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaintenanceTaskForecaster,
  type MaintenanceForecastConfig,
  type MaintenanceTaskForecast,
  type MaintenanceTask,
  type TaskSchedulingRecommendation,
  DEFAULT_MAINTENANCE_FORECAST_CONFIG,
} from '@/analytics/idleVillageMaintenanceTaskForecaster';
import { loadIdleVillageConfig } from '@/balancing/config/idleVillage/configLoader';
import { PersistenceService } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

const diagnostics = createSandboxDiagnostics('MaintenanceTaskForecasterHook', 'maintenance_forecast_hook');

/**
 * Hook configuration options
 */
export interface UseMaintenanceTaskForecasterConfig {
  /** Auto-generate forecasts when village state changes */
  autoGenerate?: boolean;
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
  /** Enable telemetry logging */
  enableTelemetry?: boolean;
  /** Maximum forecast history to keep */
  maxHistorySize?: number;
  /** Custom forecaster configuration */
  forecasterConfig?: Partial<MaintenanceForecastConfig>;
}

/**
 * Hook return value
 */
export interface UseMaintenanceTaskForecasterReturn {
  // Forecast state
  currentForecast: MaintenanceTaskForecast | null;
  forecastHistory: MaintenanceTaskForecast[];
  isGenerating: boolean;
  lastGenerated: number;
  error: string | null;

  // Village state
  villageState: VillageState | null;
  isLoadingState: boolean;

  // Task management
  selectedTask: MaintenanceTask | null;
  taskFilter: {
    priority?: MaintenanceTask['priority'];
    category?: MaintenanceTask['category'];
    status?: MaintenanceTask['status'];
    showCompleted?: boolean;
  };

  // Actions
  generateForecast: (customState?: Partial<VillageState>) => Promise<void>;
  updateVillageState: (state: VillageState) => Promise<void>;
  selectTask: (task: MaintenanceTask | null) => void;
  updateTaskFilter: (filter: Partial<UseMaintenanceTaskForecasterReturn['taskFilter']>) => void;
  markTaskCompleted: (taskId: string, completedAt?: number) => Promise<void>;
  getTaskSchedulingRecommendation: (taskId: string) => TaskSchedulingRecommendation | null;

  // Utility functions
  refreshForecast: () => Promise<void>;
  clearHistory: () => void;
  exportForecast: (format?: 'json' | 'csv') => string;
  getForecastStats: () => {
    totalTasks: number;
    criticalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    averageConfidence: number;
  };

  // Configuration
  updateConfig: (config: Partial<UseMaintenanceTaskForecasterConfig>) => void;
  getConfig: () => UseMaintenanceTaskForecasterConfig;
}

/**
 * Hook for managing maintenance task forecasting in React components
 *
 * @param initialConfig - Initial hook configuration
 * @returns Maintenance task forecasting state and actions
 *
 * @example
 * ```typescript
 * const {
 *   currentForecast,
 *   generateForecast,
 *   selectedTask,
 *   selectTask
 * } = useMaintenanceTaskForecaster({
 *   autoGenerate: true,
 *   autoRefreshInterval: 300000, // 5 minutes
 * });
 * ```
 */
export function useMaintenanceTaskForecaster(
  initialConfig: UseMaintenanceTaskForecasterConfig = {}
): UseMaintenanceTaskForecasterReturn {
  const {
    autoGenerate = false,
    autoRefreshInterval,
    enableTelemetry = true,
    maxHistorySize = 10,
    forecasterConfig = {},
  } = initialConfig;

  // State
  const [currentForecast, setCurrentForecast] = useState<MaintenanceTaskForecast | null>(null);
  const [forecastHistory, setForecastHistory] = useState<MaintenanceTaskForecast[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Village state
  const [villageState, setVillageState] = useState<VillageState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(false);

  // Task selection and filtering
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [taskFilter, setTaskFilter] = useState<UseMaintenanceTaskForecasterReturn['taskFilter']>({
    showCompleted: false,
  });

  // Forecaster instance (memoized)
  const forecaster = useMemo(() => {
    return (async () => {
      const villageConfig = await loadIdleVillageConfig();
      return new MaintenanceTaskForecaster(villageConfig, forecasterConfig);
    })();
  }, []);

  // Load initial village state
  useEffect(() => {
    loadVillageState();
  }, []);

  // Auto-generate forecasts
  useEffect(() => {
    if (autoGenerate && villageState && !currentForecast) {
      generateForecast();
    }
  }, [autoGenerate, villageState, currentForecast]);

  // Auto-refresh forecasts
  useEffect(() => {
    if (!autoRefreshInterval || !villageState) return;

    const interval = setInterval(() => {
      generateForecast();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, villageState]);

  // Load village state from persistence
  const loadVillageState = useCallback(async () => {
    try {
      setIsLoadingState(true);
      setError(null);

      const savedState = await PersistenceService.load('idle_village_state');
      if (savedState) {
        setVillageState(savedState as VillageState);
      } else {
        // Create default state
        const defaultState: VillageState = {
          resources: { food: 100, wood: 50, stone: 25 },
          residents: {},
          buildings: {},
          activities: {},
          timestamp: Date.now(),
        };
        setVillageState(defaultState);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load village state';
      setError(errorMessage);

      if (enableTelemetry) {
        diagnostics.error('Failed to load village state', { error: errorMessage });
      }
    } finally {
      setIsLoadingState(false);
    }
  }, [enableTelemetry]);

  // Generate forecast
  const generateForecast = useCallback(async (customState?: Partial<VillageState>) => {
    if (!villageState && !customState) return;

    try {
      setIsGenerating(true);
      setError(null);

      const forecastState = customState ? { ...villageState, ...customState } : villageState;
      if (!forecastState) return;

      const forecasterInstance = await forecaster;
      const forecast = forecasterInstance.generateForecast(forecastState);

      setCurrentForecast(forecast);
      setForecastHistory(prev => {
        const newHistory = [forecast, ...prev].slice(0, maxHistorySize);
        return newHistory;
      });
      setLastGenerated(Date.now());

      // Auto-select first critical task if none selected
      if (!selectedTask && forecast.tasks.some(t => t.priority === 'critical')) {
        const criticalTask = forecast.tasks.find(t => t.priority === 'critical');
        if (criticalTask) {
          setSelectedTask(criticalTask);
        }
      }

      if (enableTelemetry) {
        diagnostics.info('Maintenance forecast generated', {
          tasksGenerated: forecast.tasks.length,
          alerts: forecast.alerts.length,
          qualityScore: forecast.metadata.forecastQualityScore,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate forecast';
      setError(errorMessage);

      if (enableTelemetry) {
        diagnostics.error('Failed to generate forecast', { error: errorMessage });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [villageState, forecaster, maxHistorySize, selectedTask, enableTelemetry]);

  // Update village state
  const updateVillageState = useCallback(async (state: VillageState) => {
    setVillageState(state);

    // Save to persistence
    try {
      await PersistenceService.save('idle_village_state', state);
    } catch (err) {
      console.warn('Failed to save village state:', err);
    }

    // Auto-regenerate forecast if enabled
    if (autoGenerate) {
      await generateForecast(state);
    }
  }, [autoGenerate, generateForecast]);

  // Task selection
  const selectTask = useCallback((task: MaintenanceTask | null) => {
    setSelectedTask(task);
  }, []);

  // Task filter updates
  const updateTaskFilter = useCallback((filter: Partial<UseMaintenanceTaskForecasterReturn['taskFilter']>) => {
    setTaskFilter(prev => ({ ...prev, ...filter }));
  }, []);

  // Mark task as completed
  const markTaskCompleted = useCallback(async (taskId: string, completedAt?: number) => {
    if (!currentForecast) return;

    try {
      // Update task status in forecast
      const updatedForecast = {
        ...currentForecast,
        tasks: currentForecast.tasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'completed' as const, completedAt: completedAt || Date.now() }
            : task
        ),
      };

      setCurrentForecast(updatedForecast);

      // Update village state to reflect completion
      if (villageState) {
        // Apply task effects to village state (simplified)
        const task = currentForecast.tasks.find(t => t.id === taskId);
        if (task) {
          const updatedState = { ...villageState };

          // Apply resource changes
          Object.entries(task.requiredResources).forEach(([resource, amount]) => {
            if (updatedState.resources) {
              const currentAmount = updatedState.resources[resource] || 0;
              updatedState.resources[resource] = Math.max(0, currentAmount - amount);
            }
          });

          await updateVillageState(updatedState);
        }
      }

      if (enableTelemetry) {
        diagnostics.info('Task marked as completed', { taskId, completedAt });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark task as completed';
      setError(errorMessage);

      if (enableTelemetry) {
        diagnostics.error('Failed to complete task', { taskId, error: errorMessage });
      }
    }
  }, [currentForecast, villageState, updateVillageState, enableTelemetry]);

  // Get scheduling recommendation for a task
  const getTaskSchedulingRecommendation = useCallback((taskId: string): TaskSchedulingRecommendation | null => {
    if (!currentForecast) return null;

    return currentForecast.schedulingRecommendations.find(rec => rec.task.id === taskId) || null;
  }, [currentForecast]);

  // Refresh forecast
  const refreshForecast = useCallback(async () => {
    await generateForecast();
  }, [generateForecast]);

  // Clear history
  const clearHistory = useCallback(() => {
    setForecastHistory([]);
    setCurrentForecast(null);
    setSelectedTask(null);
  }, []);

  // Export forecast
  const exportForecast = useCallback((format: 'json' | 'csv' = 'json'): string => {
    if (!currentForecast) return '';

    if (format === 'csv') {
      const headers = [
        'ID', 'Name', 'Category', 'Priority', 'Status', 'Duration', 'Deadline', 'Confidence'
      ];
      const rows = currentForecast.tasks.map(task => [
        task.id,
        `"${task.name}"`,
        task.category,
        task.priority,
        task.status,
        task.estimatedDuration.toString(),
        new Date(task.targetCompletionTime).toISOString(),
        (task.confidence * 100).toFixed(1) + '%',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(currentForecast, null, 2);
  }, [currentForecast]);

  // Get forecast statistics
  const getForecastStats = useCallback(() => {
    if (!currentForecast) {
      return {
        totalTasks: 0,
        criticalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        averageConfidence: 0,
      };
    }

    const tasks = currentForecast.tasks;
    const totalTasks = tasks.length;
    const criticalTasks = tasks.filter(t => t.priority === 'critical').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const averageConfidence = totalTasks > 0
      ? tasks.reduce((sum, t) => sum + t.confidence, 0) / totalTasks
      : 0;

    return {
      totalTasks,
      criticalTasks,
      completedTasks,
      pendingTasks,
      averageConfidence,
    };
  }, [currentForecast]);

  // Configuration management
  const updateConfig = useCallback((config: Partial<UseMaintenanceTaskForecasterConfig>) => {
    // This would update the hook's internal config
    // In a real implementation, this might trigger a re-initialization
    console.log('Configuration update requested:', config);
  }, []);

  const getConfig = useCallback((): UseMaintenanceTaskForecasterConfig => {
    return {
      autoGenerate,
      autoRefreshInterval,
      enableTelemetry,
      maxHistorySize,
      forecasterConfig,
    };
  }, [autoGenerate, autoRefreshInterval, enableTelemetry, maxHistorySize, forecasterConfig]);

  // Filtered tasks based on current filter
  const filteredTasks = useMemo(() => {
    if (!currentForecast) return [];

    return currentForecast.tasks.filter(task => {
      if (taskFilter.priority && task.priority !== taskFilter.priority) return false;
      if (taskFilter.category && task.category !== taskFilter.category) return false;
      if (taskFilter.status && task.status !== taskFilter.status) return false;
      if (!taskFilter.showCompleted && task.status === 'completed') return false;

      return true;
    });
  }, [currentForecast, taskFilter]);

  // Critical alerts from current forecast
  const criticalAlerts = useMemo(() => {
    return currentForecast?.alerts.filter(alert => alert.type === 'error') || [];
  }, [currentForecast]);

  // Upcoming tasks (next 24 hours)
  const upcomingTasks = useMemo(() => {
    if (!currentForecast) return [];

    const now = Date.now();
    const tomorrow = now + 24 * 60 * 60 * 1000;

    return currentForecast.tasks
      .filter(task =>
        task.status === 'pending' &&
        task.targetCompletionTime >= now &&
        task.targetCompletionTime <= tomorrow
      )
      .sort((a, b) => a.targetCompletionTime - b.targetCompletionTime);
  }, [currentForecast]);

  return {
    // Forecast state
    currentForecast,
    forecastHistory,
    isGenerating,
    lastGenerated,
    error,

    // Village state
    villageState,
    isLoadingState,

    // Task management
    selectedTask,
    taskFilter,

    // Actions
    generateForecast,
    updateVillageState,
    selectTask,
    updateTaskFilter,
    markTaskCompleted,
    getTaskSchedulingRecommendation,

    // Utility functions
    refreshForecast,
    clearHistory,
    exportForecast,
    getForecastStats,

    // Configuration
    updateConfig,
    getConfig,

    // Additional computed values
    filteredTasks,
    criticalAlerts,
    upcomingTasks,
  } as UseMaintenanceTaskForecasterReturn & {
    filteredTasks: MaintenanceTask[];
    criticalAlerts: MaintenanceTaskForecast['alerts'];
    upcomingTasks: MaintenanceTask[];
  };
}

/**
 * Hook for monitoring maintenance task trends over time
 *
 * @param history - Array of forecast history
 * @returns Trend analysis for maintenance tasks
 */
export function useMaintenanceTaskTrends(history: MaintenanceTaskForecast[]) {
  return useMemo(() => {
    if (history.length === 0) {
      return {
        taskTrends: [],
        efficiencyTrends: [],
        alertTrends: [],
        predictions: [],
      };
    }

    // Task count trends
    const taskTrends = history.map(forecast => ({
      timestamp: forecast.generatedAt,
      totalTasks: forecast.tasks.length,
      criticalTasks: forecast.tasksByPriority.critical.length,
      completedTasks: forecast.tasks.filter(t => t.status === 'completed').length,
    }));

    // Efficiency trends
    const efficiencyTrends = history.map(forecast => ({
      timestamp: forecast.generatedAt,
      qualityScore: forecast.metadata.forecastQualityScore,
      averageConfidence: forecast.metadata.averageConfidence,
      tasksGenerated: forecast.metadata.totalTasksGenerated,
      tasksFiltered: forecast.metadata.tasksFilteredByConfidence + forecast.metadata.tasksFilteredByConcurrency,
    }));

    // Alert trends
    const alertTrends = history.map(forecast => ({
      timestamp: forecast.generatedAt,
      totalAlerts: forecast.alerts.length,
      errorAlerts: forecast.alerts.filter(a => a.type === 'error').length,
      warningAlerts: forecast.alerts.filter(a => a.type === 'warning').length,
    }));

    // Generate simple predictions (linear extrapolation)
    const predictions = [];
    if (history.length >= 3) {
      const recent = history.slice(0, 3);
      const avgTasks = recent.reduce((sum, f) => sum + f.tasks.length, 0) / recent.length;
      const avgAlerts = recent.reduce((sum, f) => sum + f.alerts.length, 0) / recent.length;

      predictions.push({
        type: 'task_volume',
        predictedValue: Math.round(avgTasks),
        confidence: 0.7,
        description: `Expected ${Math.round(avgTasks)} tasks in next forecast`,
      });

      predictions.push({
        type: 'alert_frequency',
        predictedValue: Math.round(avgAlerts),
        confidence: 0.6,
        description: `Expected ${Math.round(avgAlerts)} alerts in next forecast`,
      });
    }

    return {
      taskTrends,
      efficiencyTrends,
      alertTrends,
      predictions,
    };
  }, [history]);
}

/**
 * Hook for managing maintenance task scheduling conflicts
 *
 * @param recommendations - Array of scheduling recommendations
 * @returns Conflict analysis and resolution suggestions
 */
export function useTaskSchedulingConflicts(recommendations: TaskSchedulingRecommendation[]) {
  return useMemo(() => {
    const conflicts = recommendations.flatMap(rec => rec.conflicts);
    const conflictTypes = conflicts.reduce((acc, conflict) => {
      const type = conflict.toLowerCase().includes('resource') ? 'resource' :
                   conflict.toLowerCase().includes('resident') ? 'personnel' :
                   'scheduling';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolutions = [];
    if (conflictTypes.resource > 0) {
      resolutions.push('Consider resource allocation priorities');
    }
    if (conflictTypes.personnel > 0) {
      resolutions.push('Review resident scheduling assignments');
    }
    if (conflictTypes.scheduling > 0) {
      resolutions.push('Adjust task timing to avoid overlaps');
    }

    return {
      totalConflicts: conflicts.length,
      conflictTypes,
      resolutions,
      highConflictTasks: recommendations
        .filter(rec => rec.conflicts.length > 2)
        .map(rec => rec.task.name),
    };
  }, [recommendations]);
}
