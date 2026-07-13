/**
 * NP-029 – Idle Village Quest Narrative Hooks Refactor
 * 
 * Hook for accessing and managing narrative configuration.
 * Provides reactive access to narrative configuration with
 * real-time updates and validation.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  narrativeConfigManager, 
  type NarrativeConfig,
} from '../../../balancing/config/narrative/narrativeConfig';

export interface UseNarrativeConfigOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableValidation?: boolean;
}

export function useNarrativeConfig(options: UseNarrativeConfigOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5000, // 5 seconds
    enableValidation = true,
  } = options;

  const [config, setConfig] = useState<NarrativeConfig>(() => narrativeConfigManager.getConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Auto-refresh configuration
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const newConfig = narrativeConfigManager.getConfig();
      if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
        setConfig(newConfig);
        setLastUpdated(Date.now());
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, config]);

  /**
   * Refresh configuration from file
   */
  const refreshConfig = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const newConfig = narrativeConfigManager.getConfig();
      setConfig(newConfig);
      setLastUpdated(Date.now());
      
      if (enableValidation) {
        const validation = narrativeConfigManager.validateConfig();
        if (!validation.valid) {
          setError(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [enableValidation]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<NarrativeConfig>) => {
    setIsLoading(true);
    setError(null);

    try {
      narrativeConfigManager.updateConfig(updates);
      const newConfig = narrativeConfigManager.getConfig();
      setConfig(newConfig);
      setLastUpdated(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get hook configuration
   */
  const getHook = useCallback((hookId: string): NarrativeHook | undefined => {
    return narrativeConfigManager.getHook(hookId);
  }, []);

  /**
   * Get template configuration
   */
  const getTemplate = useCallback((templateId: string): NarrativeTemplate | undefined => {
    return narrativeConfigManager.getTemplate(templateId);
  }, []);

  /**
   * Get variable configuration
   */
  const getVariable = useCallback((variableName: string): NarrativeVariable | undefined => {
    return narrativeConfigManager.getVariable(variableName);
  }, []);

  /**
   * Get telemetry configuration
   */
  const getTelemetry = useCallback((): NarrativeTelemetry => {
    return narrativeConfigManager.getTelemetryConfig();
  }, []);

  /**
   * Add or update hook
   */
  const setHook = useCallback((hookId: string, hook: NarrativeHook) => {
    setIsLoading(true);
    setError(null);

    try {
      narrativeConfigManager.setHook(hookId, hook);
      const newConfig = narrativeConfigManager.getConfig();
      setConfig(newConfig);
      setLastUpdated(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add or update template
   */
  const setTemplate = useCallback((templateId: string, template: NarrativeTemplate) => {
    setIsLoading(true);
    setError(null);

    try {
      narrativeConfigManager.setTemplate(templateId, template);
      const newConfig = narrativeConfigManager.getConfig();
      setConfig(newConfig);
      setLastUpdated(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add or update variable
   */
  const setVariable = useCallback((variableName: string, variable: NarrativeVariable) => {
    setIsLoading(true);
    setError(null);

    try {
      narrativeConfigManager.setVariable(variableName, variable);
      const newConfig = narrativeConfigManager.getConfig();
      setConfig(newConfig);
      setLastUpdated(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Remove hook
   */
  const removeHook = useCallback((hookId: string): boolean => {
    setIsLoading(true);
    setError(null);

    try {
      const success = narrativeConfigManager.removeHook(hookId);
      if (success) {
        const newConfig = narrativeConfigManager.getConfig();
        setConfig(newConfig);
        setLastUpdated(Date.now());
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Remove template
   */
  const removeTemplate = useCallback((templateId: string): boolean => {
    setIsLoading(true);
    setError(null);

    try {
      const success = narrativeConfigManager.removeTemplate(templateId);
      if (success) {
        const newConfig = narrativeConfigManager.getConfig();
        setConfig(newConfig);
        setLastUpdated(Date.now());
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Remove variable
   */
  const removeVariable = useCallback((variableName: string): boolean => {
    setIsLoading(true);
    setError(null);

    try {
      const success = narrativeConfigManager.removeVariable(variableName);
      if (success) {
        const newConfig = narrativeConfigManager.getConfig();
        setConfig(newConfig);
        setLastUpdated(Date.now());
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate configuration
   */
  const validateConfig = useCallback(() => {
    return narrativeConfigManager.validateConfig();
  }, []);

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      narrativeConfigManager.resetToDefaults();
      const newConfig = narrativeConfigManager.getConfig();
      setConfig(newConfig);
      setLastUpdated(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Export configuration
   */
  const exportConfig = useCallback(() => {
    return narrativeConfigManager.exportConfig();
  }, []);

  /**
   * Import configuration
   */
  const importConfig = useCallback((configJson: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = narrativeConfigManager.importConfig(configJson);
      if (result.success) {
        const newConfig = narrativeConfigManager.getConfig();
        setConfig(newConfig);
        setLastUpdated(Date.now());
      } else {
        setError(result.errors.join(', '));
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, errors: [errorMessage] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized values
  const hooks = useMemo(() => config.hooks, [config.hooks]);
  const templates = useMemo(() => config.templates, [config.templates]);
  const variables = useMemo(() => config.variables, [config.variables]);
  const telemetry = useMemo(() => config.telemetry, [config.telemetry]);

  const hookIds = useMemo(() => Object.keys(hooks), [hooks]);
  const templateIds = useMemo(() => Object.keys(templates), [templates]);
  const variableNames = useMemo(() => Object.keys(variables), [variables]);

  const hooksByType = useMemo(() => {
    const grouped: Record<string, NarrativeHook[]> = {};
    Object.values(hooks).forEach(hook => {
      if (!grouped[hook.type]) {
        grouped[hook.type] = [];
      }
      grouped[hook.type].push(hook);
    });
    return grouped;
  }, [hooks]);

  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, NarrativeTemplate[]> = {};
    Object.values(templates).forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    return grouped;
  }, [templates]);

  return {
    // State
    config,
    isLoading,
    error,
    lastUpdated,
    
    // Configuration data
    hooks,
    templates,
    variables,
    telemetry,
    
    // Derived data
    hookIds,
    templateIds,
    variableNames,
    hooksByType,
    templatesByCategory,
    
    // Methods
    refreshConfig,
    updateConfig,
    getHook,
    getTemplate,
    getVariable,
    getTelemetry,
    setHook,
    setTemplate,
    setVariable,
    removeHook,
    removeTemplate,
    removeVariable,
    validateConfig,
    resetToDefaults,
    exportConfig,
    importConfig,
    
    // Options
    options,
  };
}

// Type aliases for cleaner imports
type NarrativeHook = NarrativeConfig['hooks'][string];
type NarrativeTemplate = NarrativeConfig['templates'][string];
type NarrativeVariable = NarrativeConfig['variables'][string];
type NarrativeTelemetry = NarrativeConfig['telemetry'];
