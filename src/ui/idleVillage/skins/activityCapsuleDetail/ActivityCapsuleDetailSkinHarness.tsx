/**
 * WL-STY-011: ActivityCapsuleDetail Skin Harness System Integration (TS-Series)
 * 
 * Advanced harness system for ActivityCapsuleDetail skin management with
 * centralized control, batch operations, performance monitoring, and
 * developer tools integration.
 */

import { createContext, useContext, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { 
  ActivityCapsuleDetailSkinConfig,
  DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
  validateActivityCapsuleDetailSkinConfig,
  mergeActivityCapsuleDetailSkinConfig,
} from './ActivityCapsuleDetailSkinSchema';
import { 
  ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS,
  getActivityCapsuleDetailSkinPreset,
  getActivityCapsuleDetailMotionAdaptations,
  getActivityCapsuleDetailSkinConfigWithPreset,
} from './ActivityCapsuleDetailSkinPresets';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult,
} from '../SkinSchema';

// ============================================================================
// HARNESS CONTEXT AND TYPES
// ============================================================================

/**
 * Harness configuration interface
 */
export interface ActivityCapsuleDetailSkinHarnessConfig {
  /** Global settings */
  enableGlobalOverrides: boolean;
  enableBatchOperations: boolean;
  enablePerformanceMonitoring: boolean;
  enableDevTools: boolean;
  enableTelemetry: boolean;
  
  /** Performance settings */
  batchUpdateDelay: number;
  validationDebounceTime: number;
  cacheTimeout: number;
  maxCacheSize: number;
  
  /** Development settings */
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  enableHotReload: boolean;
  enableValidationWarnings: boolean;
  
  /** Feature flags */
  enableExperimentalPresets: boolean;
  enableLegacySupport: boolean;
  enableCustomPresets: boolean;
}

/**
 * Harness state interface
 */
export interface ActivityCapsuleDetailSkinHarnessState {
  /** Current configuration */
  globalConfig: ActivityCapsuleDetailSkinConfig;
  
  /** Component registry */
  components: Map<string, ComponentSkinBinding>;
  
  /** Performance metrics */
  metrics: {
    totalComponents: number;
    activeComponents: number;
    cacheHits: number;
    cacheMisses: number;
    validationErrors: number;
    averageRenderTime: number;
    lastUpdateTime: number;
  };
  
  /** Batch operations */
  pendingUpdates: Map<string, Partial<ActivityCapsuleDetailSkinConfig>>;
  isProcessingBatch: boolean;
  
  /** Validation state */
  globalValidation: SkinValidationResult;
  componentValidations: Map<string, SkinValidationResult>;
  
  /** Development state */
  devMode: boolean;
  debugInfo: Map<string, any>;
}

/**
 * Harness actions interface
 */
export interface ActivityCapsuleDetailSkinHarnessActions {
  /** Configuration management */
  updateGlobalConfig: (updates: Partial<ActivityCapsuleDetailSkinConfig>) => void;
  resetGlobalConfig: () => void;
  applyPreset: (presetId: SkinPresetId, pillar?: StyleLabPillar, motionLevel?: MotionLevel) => void;
  applyMotionAdaptations: (motionLevel: MotionLevel) => void;
  
  /** Component management */
  registerComponent: (componentId: string, binding: ComponentSkinBinding) => void;
  unregisterComponent: (componentId: string) => void;
  updateComponent: (componentId: string, updates: Partial<ActivityCapsuleDetailSkinConfig>) => void;
  getComponentConfig: (componentId: string) => ActivityCapsuleDetailSkinConfig | null;
  
  /** Batch operations */
  batchUpdateComponents: (updates: Map<string, Partial<ActivityCapsuleDetailSkinConfig>>) => Promise<void>;
  applyGlobalToAll: () => Promise<void>;
  resetAllComponents: () => Promise<void>;
  
  /** Validation */
  validateGlobal: () => SkinValidationResult;
  validateComponent: (componentId: string) => SkinValidationResult;
  validateAll: () => Map<string, SkinValidationResult>;
  
  /** Performance monitoring */
  getMetrics: () => ActivityCapsuleDetailSkinHarnessState['metrics'];
  resetMetrics: () => void;
  optimizePerformance: () => void;
  
  /** Development tools */
  enableDevMode: () => void;
  disableDevMode: () => void;
  getDebugInfo: (componentId?: string) => any;
  exportState: () => string;
  importState: (stateJson: string) => boolean;
  
  /** Preset management */
  getAvailablePresets: () => SkinPresetId[];
  searchPresets: (keywords: string[]) => SkinPresetId[];
  getRecommendedPresets: (pillar: StyleLabPillar, motionLevel?: MotionLevel) => SkinPresetId[];
  createCustomPreset: (name: string, config: Partial<ActivityCapsuleDetailSkinConfig>) => boolean;
}

/**
 * Harness context interface
 */
export interface ActivityCapsuleDetailSkinHarnessContext {
  state: ActivityCapsuleDetailSkinHarnessState;
  actions: ActivityCapsuleDetailSkinHarnessActions;
  config: ActivityCapsuleDetailSkinHarnessConfig;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_HARNESS_CONFIG: ActivityCapsuleDetailSkinHarnessConfig = {
  enableGlobalOverrides: true,
  enableBatchOperations: true,
  enablePerformanceMonitoring: true,
  enableDevTools: false,
  enableTelemetry: true,
  batchUpdateDelay: 50,
  validationDebounceTime: 100,
  cacheTimeout: 300000, // 5 minutes
  maxCacheSize: 50,
  logLevel: 'warn',
  enableHotReload: true,
  enableValidationWarnings: true,
  enableExperimentalPresets: false,
  enableLegacySupport: true,
  enableCustomPresets: false,
};

// ============================================================================
// HARNESS CONTEXT
// ============================================================================

const ActivityCapsuleDetailSkinHarnessContext = createContext<ActivityCapsuleDetailSkinHarnessContext | null>(null);

/**
 * Hook to access the ActivityCapsuleDetail skin harness
 */
export function useActivityCapsuleDetailSkinHarness(): ActivityCapsuleDetailSkinHarnessContext {
  const context = useContext(ActivityCapsuleDetailSkinHarnessContext);
  if (!context) {
    throw new Error('useActivityCapsuleDetailSkinHarness must be used within ActivityCapsuleDetailSkinHarnessProvider');
  }
  return context;
}

/**
 * Provider component for the ActivityCapsuleDetail skin harness
 */
export function ActivityCapsuleDetailSkinHarnessProvider({
  children,
  config = DEFAULT_HARNESS_CONFIG,
  initialPreset,
  initialPillar,
  initialMotionLevel,
}: {
  children: React.ReactNode;
  config?: Partial<ActivityCapsuleDetailSkinHarnessConfig>;
  initialPreset?: SkinPresetId;
  initialPillar?: StyleLabPillar;
  initialMotionLevel?: MotionLevel;
}) {
  const harnessConfig = useMemo(() => ({ ...DEFAULT_HARNESS_CONFIG, ...config }), [config]);
  
  // Initialize global configuration
  const [globalConfig, setGlobalConfig] = useState<ActivityCapsuleDetailSkinConfig>(() => {
    if (initialPreset) {
      return getActivityCapsuleDetailSkinConfigWithPreset(
        initialPreset,
        initialPillar,
        initialMotionLevel
      );
    }
    return { ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG };
  });
  
  // Component registry
  const [components, setComponents] = useState<Map<string, ComponentSkinBinding>>(new Map());
  
  // Performance metrics
  const [metrics, setMetrics] = useState<ActivityCapsuleDetailSkinHarnessState['metrics']>({
    totalComponents: 0,
    activeComponents: 0,
    cacheHits: 0,
    cacheMisses: 0,
    validationErrors: 0,
    averageRenderTime: 0,
    lastUpdateTime: Date.now(),
  });
  
  // Batch operations
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<ActivityCapsuleDetailSkinConfig>>>(new Map());
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  
  // Validation state
  const [globalValidation, setGlobalValidation] = useState<SkinValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [componentValidations, setComponentValidations] = useState<Map<string, SkinValidationResult>>(new Map());
  
  // Development state
  const [devMode, setDevMode] = useState(harnessConfig.enableDevTools);
  const [debugInfo, setDebugInfo] = useState<Map<string, any>>(new Map());
  
  // Refs
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const performanceStartRef = useRef<number>(Date.now());
  const cacheRef = useRef<Map<string, ActivityCapsuleDetailSkinConfig>>(new Map());
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const log = useCallback((level: ActivityCapsuleDetailSkinHarnessConfig['logLevel'], message: string, data?: any) => {
    if (!devMode || level === 'none') return;
    
    const logLevels = { none: 0, error: 1, warn: 2, info: 3, debug: 4 };
    const currentLevel = logLevels[harnessConfig.logLevel];
    const messageLevel = logLevels[level];
    
    if (messageLevel <= currentLevel) {
      console[level](`[ActivityCapsuleDetailSkinHarness] ${message}`, data);
    }
  }, [devMode, harnessConfig.logLevel]);
  
  const updateMetrics = useCallback((updates: Partial<ActivityCapsuleDetailSkinHarnessState['metrics']>) => {
    setMetrics(prev => ({ ...prev, ...updates, lastUpdateTime: Date.now() }));
  }, []);
  
  const trackPerformance = useCallback((operation: string, startTime: number) => {
    if (!harnessConfig.enablePerformanceMonitoring) return;
    
    const duration = Date.now() - startTime;
    log('debug', `Performance: ${operation} took ${duration}ms`);
    
    updateMetrics({
      averageRenderTime: duration,
      totalComponents: components.size,
      activeComponents: Array.from(components.values()).filter(c => c.enabled).length,
    });
    
    if (harnessConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_harness_performance', {
        operation,
        duration,
        componentCount: components.size,
        timestamp: Date.now(),
      });
    }
  }, [harnessConfig.enablePerformanceMonitoring, harnessConfig.enableTelemetry, components.size, log, updateMetrics]);
  
  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================
  
  const updateGlobalConfig = useCallback((updates: Partial<ActivityCapsuleDetailSkinConfig>) => {
    const startTime = performanceStartRef.current;
    
    setGlobalConfig(prev => {
      const newConfig = mergeActivityCapsuleDetailSkinConfig(prev, updates);
      
      // Validate new configuration
      if (harnessConfig.enableValidationWarnings) {
        const validation = validateActivityCapsuleDetailSkinConfig(newConfig);
        setGlobalValidation(validation);
        
        if (!validation.isValid) {
          log('warn', 'Global configuration validation failed', validation.errors);
          updateMetrics({ validationErrors: validation.errors.length });
        }
      }
      
      log('info', 'Global configuration updated', updates);
      trackPerformance('updateGlobalConfig', startTime);
      
      return newConfig;
    });
  }, [harnessConfig.enableValidationWarnings, log, updateMetrics, trackPerformance]);
  
  const resetGlobalConfig = useCallback(() => {
    const startTime = performanceStartRef.current;
    
    setGlobalConfig({ ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG });
    setGlobalValidation({ isValid: true, errors: [], warnings: [] });
    
    log('info', 'Global configuration reset');
    trackPerformance('resetGlobalConfig', startTime);
    
    if (harnessConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_harness_config_reset', {
        timestamp: Date.now(),
      });
    }
  }, [log, trackPerformance, harnessConfig.enableTelemetry]);
  
  const applyPreset = useCallback((presetId: SkinPresetId, pillar?: StyleLabPillar, motionLevel?: MotionLevel) => {
    const startTime = performanceStartRef.current;
    
    try {
      const preset = getActivityCapsuleDetailSkinPreset(presetId);
      if (!preset) {
        log('error', `Preset not found: ${presetId}`);
        return;
      }
      
      const newConfig = getActivityCapsuleDetailSkinConfigWithPreset(presetId, pillar, motionLevel);
      setGlobalConfig(newConfig);
      
      log('info', `Applied preset: ${presetId}`, { pillar, motionLevel });
      trackPerformance('applyPreset', startTime);
      
      if (harnessConfig.enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_harness_preset_applied', {
          presetId,
          pillar,
          motionLevel,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      log('error', `Failed to apply preset: ${presetId}`, error);
    }
  }, [log, trackPerformance, harnessConfig.enableTelemetry]);
  
  const applyMotionAdaptations = useCallback((motionLevel: MotionLevel) => {
    const startTime = performanceStartRef.current;
    
    const adaptations = getActivityCapsuleDetailMotionAdaptations(motionLevel);
    updateGlobalConfig(adaptations);
    
    log('info', `Applied motion adaptations: ${motionLevel}`);
    trackPerformance('applyMotionAdaptations', startTime);
    
    if (harnessConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_harness_motion_applied', {
        motionLevel,
        timestamp: Date.now(),
      });
    }
  }, [updateGlobalConfig, log, trackPerformance, harnessConfig.enableTelemetry]);
  
  // ============================================================================
  // COMPONENT MANAGEMENT
  // ============================================================================
  
  const registerComponent = useCallback((componentId: string, binding: ComponentSkinBinding) => {
    const startTime = performanceStartRef.current;
    
    setComponents(prev => {
      const newComponents = new Map(prev);
      newComponents.set(componentId, binding);
      return newComponents;
    });
    
    log('info', `Component registered: ${componentId}`);
    trackPerformance('registerComponent', startTime);
    
    if (harnessConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_harness_component_registered', {
        componentId,
        componentType: binding.componentType,
        timestamp: Date.now(),
      });
    }
  }, [log, trackPerformance, harnessConfig.enableTelemetry]);
  
  const unregisterComponent = useCallback((componentId: string) => {
    const startTime = performanceStartRef.current;
    
    setComponents(prev => {
      const newComponents = new Map(prev);
      newComponents.delete(componentId);
      return newComponents;
    });
    
    setComponentValidations(prev => {
      const newValidations = new Map(prev);
      newValidations.delete(componentId);
      return newValidations;
    });
    
    setDebugInfo(prev => {
      const newDebugInfo = new Map(prev);
      newDebugInfo.delete(componentId);
      return newDebugInfo;
    });
    
    log('info', `Component unregistered: ${componentId}`);
    trackPerformance('unregisterComponent', startTime);
    
    if (harnessConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_harness_component_unregistered', {
        componentId,
        timestamp: Date.now(),
      });
    }
  }, [log, trackPerformance, harnessConfig.enableTelemetry]);
  
  const updateComponent = useCallback((componentId: string, updates: Partial<ActivityCapsuleDetailSkinConfig>) => {
    const startTime = performanceStartRef.current;
    
    if (!harnessConfig.enableBatchOperations) {
      // Direct update
      const component = components.get(componentId);
      if (component && component.config) {
        const newConfig = mergeActivityCapsuleDetailSkinConfig(
          component.config as ActivityCapsuleDetailSkinConfig,
          updates
        );
        
        const newBinding = { ...component, config: newConfig };
        registerComponent(componentId, newBinding);
        
        log('info', `Component updated directly: ${componentId}`, updates);
        trackPerformance('updateComponent', startTime);
      }
    } else {
      // Batch update
      setPendingUpdates(prev => {
        const newUpdates = new Map(prev);
        newUpdates.set(componentId, updates);
        return newUpdates;
      });
      
      log('debug', `Component update queued: ${componentId}`, updates);
    }
  }, [components, harnessConfig.enableBatchOperations, log, trackPerformance, registerComponent]);
  
  const getComponentConfig = useCallback((componentId: string): ActivityCapsuleDetailSkinConfig | null => {
    const component = components.get(componentId);
    if (!component || !component.config) return null;
    
    // Check cache first
    const cacheKey = `${componentId}-${JSON.stringify(component.config)}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      updateMetrics({ cacheHits: metrics.cacheHits + 1 });
      return cached;
    }
    
    // Generate merged config
    let config = component.config as ActivityCapsuleDetailSkinConfig;
    
    // Apply global overrides if enabled
    if (harnessConfig.enableGlobalOverrides) {
      config = mergeActivityCapsuleDetailSkinConfig(globalConfig, config);
    }
    
    // Cache the result
    if (cacheRef.current.size >= harnessConfig.maxCacheSize) {
      const oldestKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(oldestKey);
    }
    cacheRef.current.set(cacheKey, config);
    
    updateMetrics({ cacheMisses: metrics.cacheMisses + 1 });
    
    return config;
  }, [components, globalConfig, harnessConfig.enableGlobalOverrides, harnessConfig.maxCacheSize, metrics.cacheHits, metrics.cacheMisses, updateMetrics]);
  
  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================
  
  const batchUpdateComponents = useCallback(async (updates: Map<string, Partial<ActivityCapsuleDetailSkinConfig>>) => {
    if (!harnessConfig.enableBatchOperations) return;
    
    const startTime = performanceStartRef.current;
    setIsProcessingBatch(true);
    
    try {
      const newComponents = new Map(components);
      
      for (const [componentId, updates] of updates) {
        const component = newComponents.get(componentId);
        if (component && component.config) {
          const newConfig = mergeActivityCapsuleDetailSkinConfig(
            component.config as ActivityCapsuleDetailSkinConfig,
            updates
          );
          newComponents.set(componentId, { ...component, config: newConfig });
        }
      }
      
      setComponents(newComponents);
      setPendingUpdates(new Map());
      
      log('info', `Batch update completed for ${updates.size} components`);
      trackPerformance('batchUpdateComponents', startTime);
      
      if (harnessConfig.enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_harness_batch_update', {
          componentCount: updates.size,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      log('error', 'Batch update failed', error);
    } finally {
      setIsProcessingBatch(false);
    }
  }, [components, harnessConfig.enableBatchOperations, harnessConfig.enableTelemetry, log, trackPerformance]);
  
  const applyGlobalToAll = useCallback(async () => {
    if (!harnessConfig.enableGlobalOverrides) return;
    
    const startTime = performanceStartRef.current;
    const updates = new Map<string, Partial<ActivityCapsuleDetailSkinConfig>>();
    
    for (const [componentId, component] of components) {
      updates.set(componentId, globalConfig);
    }
    
    await batchUpdateComponents(updates);
    
    log('info', 'Global configuration applied to all components');
    trackPerformance('applyGlobalToAll', startTime);
  }, [components, globalConfig, harnessConfig.enableGlobalOverrides, batchUpdateComponents, log, trackPerformance]);
  
  const resetAllComponents = useCallback(async () => {
    const startTime = performanceStartRef.current;
    const updates = new Map<string, Partial<ActivityCapsuleDetailSkinConfig>>();
    
    for (const [componentId] of components) {
      updates.set(componentId, DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG);
    }
    
    await batchUpdateComponents(updates);
    
    log('info', 'All components reset to default');
    trackPerformance('resetAllComponents', startTime);
  }, [components, batchUpdateComponents, log, trackPerformance]);
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const validateGlobal = useCallback((): SkinValidationResult => {
    const validation = validateActivityCapsuleDetailSkinConfig(globalConfig);
    setGlobalValidation(validation);
    
    if (!validation.isValid) {
      log('warn', 'Global validation failed', validation.errors);
    }
    
    return validation;
  }, [globalConfig, log]);
  
  const validateComponent = useCallback((componentId: string): SkinValidationResult => {
    const config = getComponentConfig(componentId);
    if (!config) {
      return { isValid: false, errors: [{ path: 'config', message: 'Component not found', code: 'NOT_FOUND' }], warnings: [] };
    }
    
    const validation = validateActivityCapsuleDetailSkinConfig(config);
    
    setComponentValidations(prev => {
      const newValidations = new Map(prev);
      newValidations.set(componentId, validation);
      return newValidations;
    });
    
    if (!validation.isValid) {
      log('warn', `Component validation failed: ${componentId}`, validation.errors);
    }
    
    return validation;
  }, [getComponentConfig, log]);
  
  const validateAll = useCallback((): Map<string, SkinValidationResult> => {
    const results = new Map<string, SkinValidationResult>();
    
    // Validate global config
    results.set('global', validateGlobal());
    
    // Validate all components
    for (const componentId of components.keys()) {
      results.set(componentId, validateComponent(componentId));
    }
    
    return results;
  }, [components, validateGlobal, validateComponent]);
  
  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================
  
  const getMetrics = useCallback(() => metrics, [metrics]);
  
  const resetMetrics = useCallback(() => {
    setMetrics({
      totalComponents: 0,
      activeComponents: 0,
      cacheHits: 0,
      cacheMisses: 0,
      validationErrors: 0,
      averageRenderTime: 0,
      lastUpdateTime: Date.now(),
    });
    
    cacheRef.current.clear();
    
    log('info', 'Metrics reset');
  }, [log]);
  
  const optimizePerformance = useCallback(() => {
    // Clear cache
    cacheRef.current.clear();
    
    // Update metrics
    updateMetrics({
      cacheHits: 0,
      cacheMisses: 0,
      validationErrors: 0,
    });
    
    log('info', 'Performance optimization completed');
  }, [log, updateMetrics]);
  
  // ============================================================================
  // DEVELOPMENT TOOLS
  // ============================================================================
  
  const enableDevMode = useCallback(() => {
    setDevMode(true);
    log('info', 'Development mode enabled');
    
    if (harnessConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_harness_dev_mode_enabled', {
        timestamp: Date.now(),
      });
    }
  }, [log, harnessConfig.enableTelemetry]);
  
  const disableDevMode = useCallback(() => {
    setDevMode(false);
    setDebugInfo(new Map());
    log('info', 'Development mode disabled');
    
    if (harnessConfig.enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_harness_dev_mode_disabled', {
        timestamp: Date.now(),
      });
    }
  }, [log, harnessConfig.enableTelemetry]);
  
  const getDebugInfo = useCallback((componentId?: string) => {
    if (componentId) {
      return {
        component: components.get(componentId),
        validation: componentValidations.get(componentId),
        debug: debugInfo.get(componentId),
        metrics,
      };
    }
    
    return {
      globalConfig,
      components: Array.from(components.entries()),
      globalValidation,
      componentValidations: Array.from(componentValidations.entries()),
      debugInfo: Array.from(debugInfo.entries()),
      metrics,
      harnessConfig,
    };
  }, [globalConfig, components, globalValidation, componentValidations, debugInfo, metrics, harnessConfig]);
  
  const exportState = useCallback((): string => {
    const state = {
      globalConfig,
      components: Array.from(components.entries()),
      globalValidation,
      componentValidations: Array.from(componentValidations.entries()),
      metrics,
      harnessConfig,
      timestamp: Date.now(),
    };
    
    return JSON.stringify(state, null, 2);
  }, [globalConfig, components, globalValidation, componentValidations, metrics, harnessConfig]);
  
  const importState = useCallback((stateJson: string): boolean => {
    try {
      const state = JSON.parse(stateJson);
      
      if (state.globalConfig) {
        setGlobalConfig(state.globalConfig);
      }
      
      if (state.components) {
        setComponents(new Map(state.components));
      }
      
      if (state.globalValidation) {
        setGlobalValidation(state.globalValidation);
      }
      
      if (state.componentValidations) {
        setComponentValidations(new Map(state.componentValidations));
      }
      
      if (state.metrics) {
        setMetrics(state.metrics);
      }
      
      log('info', 'State imported successfully');
      return true;
    } catch (error) {
      log('error', 'Failed to import state', error);
      return false;
    }
  }, [log]);
  
  // ============================================================================
  // PRESET MANAGEMENT
  // ============================================================================
  
  const getAvailablePresets = useCallback((): SkinPresetId[] => {
    const presets = Object.keys(ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS) as SkinPresetId[];
    
    if (!harnessConfig.enableExperimentalPresets) {
      return presets.filter(id => !['neon-cyber', 'shadow-realm'].includes(id));
    }
    
    return presets;
  }, [harnessConfig.enableExperimentalPresets]);
  
  const searchPresets = useCallback((keywords: string[]): SkinPresetId[] => {
    const availablePresets = getAvailablePresets();
    
    return availablePresets.filter(presetId => {
      const preset = getActivityCapsuleDetailSkinPreset(presetId);
      const presetText = `${presetId} ${JSON.stringify(preset)}`.toLowerCase();
      return keywords.some(keyword => presetText.includes(keyword.toLowerCase()));
    });
  }, [getAvailablePresets]);
  
  const getRecommendedPresets = useCallback((pillar: StyleLabPillar, motionLevel?: MotionLevel): SkinPresetId[] => {
    const baseRecommendations: Record<StyleLabPillar, SkinPresetId[]> = {
      frontier: ['minimal-frontier', 'arcane-tech', 'wanderlust'],
      wilderness: ['minimal-wilderness', 'wanderlust', 'gilded-observatory'],
      empire: ['minimal-empire', 'gilded-observatory', 'neon-cyber'],
    };
    
    let recommendations = baseRecommendations[pillar] || [];
    
    // Filter by motion level
    if (motionLevel === 'minimal') {
      recommendations = recommendations.filter(id => id.startsWith('minimal-'));
    }
    
    // Filter by availability
    const availablePresets = getAvailablePresets();
    recommendations = recommendations.filter(id => availablePresets.includes(id));
    
    return recommendations;
  }, [getAvailablePresets]);
  
  const createCustomPreset = useCallback((name: string, config: Partial<ActivityCapsuleDetailSkinConfig>): boolean => {
    if (!harnessConfig.enableCustomPresets) {
      log('warn', 'Custom presets are disabled');
      return false;
    }
    
    try {
      // Validate the preset
      const validation = validateActivityCapsuleDetailSkinConfig(
        mergeActivityCapsuleDetailSkinConfig(DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG, config)
      );
      
      if (!validation.isValid) {
        log('error', 'Invalid preset configuration', validation.errors);
        return false;
      }
      
      // In a real implementation, this would persist the custom preset
      log('info', `Custom preset created: ${name}`);
      
      if (harnessConfig.enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_harness_custom_preset_created', {
          name,
          timestamp: Date.now(),
        });
      }
      
      return true;
    } catch (error) {
      log('error', 'Failed to create custom preset', error);
      return false;
    }
  }, [harnessConfig.enableCustomPresets, harnessConfig.enableTelemetry, log]);
  
  // ============================================================================
  // BATCH PROCESSING
  // ============================================================================
  
  // Process batch updates
  useEffect(() => {
    if (pendingUpdates.size > 0 && !isProcessingBatch) {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      batchTimeoutRef.current = setTimeout(() => {
        batchUpdateComponents(pendingUpdates);
      }, harnessConfig.batchUpdateDelay);
    }
    
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [pendingUpdates, isProcessingBatch, batchUpdateComponents, harnessConfig.batchUpdateDelay]);
  
  // ============================================================================
  // HOT RELOAD SUPPORT
  // ============================================================================
  
  useEffect(() => {
    if (!harnessConfig.enableHotReload) return;
    
    const handleHotReload = () => {
      log('info', 'Hot reload triggered');
      
      // Refresh all components
      for (const [componentId] of components) {
        updateComponent(componentId, {});
      }
    };
    
    window.addEventListener('skin-hot-reload', handleHotReload);
    
    return () => {
      window.removeEventListener('skin-hot-reload', handleHotReload);
    };
  }, [harnessConfig.enableHotReload, components, updateComponent, log]);
  
  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const contextValue = useMemo<ActivityCapsuleDetailSkinHarnessContext>(() => ({
    state: {
      globalConfig,
      components,
      metrics,
      pendingUpdates,
      isProcessingBatch,
      globalValidation,
      componentValidations,
      devMode,
      debugInfo,
    },
    actions: {
      updateGlobalConfig,
      resetGlobalConfig,
      applyPreset,
      applyMotionAdaptations,
      registerComponent,
      unregisterComponent,
      updateComponent,
      getComponentConfig,
      batchUpdateComponents,
      applyGlobalToAll,
      resetAllComponents,
      validateGlobal,
      validateComponent,
      validateAll,
      getMetrics,
      resetMetrics,
      optimizePerformance,
      enableDevMode,
      disableDevMode,
      getDebugInfo,
      exportState,
      importState,
      getAvailablePresets,
      searchPresets,
      getRecommendedPresets,
      createCustomPreset,
    },
    config: harnessConfig,
  }), [
    globalConfig,
    components,
    metrics,
    pendingUpdates,
    isProcessingBatch,
    globalValidation,
    componentValidations,
    devMode,
    debugInfo,
    harnessConfig,
    updateGlobalConfig,
    resetGlobalConfig,
    applyPreset,
    applyMotionAdaptations,
    registerComponent,
    unregisterComponent,
    updateComponent,
    getComponentConfig,
    batchUpdateComponents,
    applyGlobalToAll,
    resetAllComponents,
    validateGlobal,
    validateComponent,
    validateAll,
    getMetrics,
    resetMetrics,
    optimizePerformance,
    enableDevMode,
    disableDevMode,
    getDebugInfo,
    exportState,
    importState,
    getAvailablePresets,
    searchPresets,
    getRecommendedPresets,
    createCustomPreset,
  ]);
  
  return (
    <ActivityCapsuleDetailSkinHarnessContext.Provider value={contextValue}>
      {children}
    </ActivityCapsuleDetailSkinHarnessContext.Provider>
  );
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for components to easily integrate with the harness
 */
export function useActivityCapsuleDetailSkinHarnessIntegration(
  componentId: string,
  initialConfig?: Partial<ActivityCapsuleDetailSkinConfig>
) {
  const harness = useActivityCapsuleDetailSkinHarness();
  const [config, setConfig] = useState<ActivityCapsuleDetailSkinConfig>(() => 
    harness.actions.getComponentConfig(componentId) || DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG
  );
  
  // Register component on mount
  useEffect(() => {
    const binding = {
      componentId,
      componentType: 'ActivityCapsuleDetail',
      skinPresetId: config.presetId,
      pillar: config.pillar,
      motionLevel: config.motionLevel,
      config: initialConfig || config,
      enabled: true,
      priority: 'normal',
      metadata: {
        version: config.version,
        lastModified: config.lastModified,
        compatibility: config.compatibility,
      },
    };
    
    harness.actions.registerComponent(componentId, binding);
    
    return () => {
      harness.actions.unregisterComponent(componentId);
    };
  }, [componentId, config.presetId, config.pillar, config.motionLevel, config.version, config.lastModified, config.compatibility, initialConfig, harness.actions]);
  
  // Update local config when harness config changes
  useEffect(() => {
    const harnessConfig = harness.actions.getComponentConfig(componentId);
    if (harnessConfig && JSON.stringify(harnessConfig) !== JSON.stringify(config)) {
      setConfig(harnessConfig);
    }
  }, [harness.state.globalConfig, componentId, harness.actions, config]);
  
  return {
    config,
    updateConfig: (updates: Partial<ActivityCapsuleDetailSkinConfig>) => {
      harness.actions.updateComponent(componentId, updates);
    },
    validation: harness.state.componentValidations.get(componentId) || { isValid: true, errors: [], warnings: [] },
    isValid: (harness.state.componentValidations.get(componentId)?.isValid) ?? true,
    metrics: harness.state.metrics,
    devMode: harness.state.devMode,
  };
}

export default ActivityCapsuleDetailSkinHarnessProvider;
