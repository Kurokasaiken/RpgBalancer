/**
 * WL-STY-010: ActivityCapsule Skin Override Hooks (TS-Series Integration)
 * 
 * Advanced React hooks for ActivityCapsule skin management with full TS-Series
 * integration. Provides skin binding, override management, hot-reloading,
 * validation, and performance optimization for ActivityCapsule components.
 * 
 * Dependencies: TS-001 (SkinSchema), TS-002 (SkinSlot), TS-003 (SkinReplacementAPI)
 * Integration: useSkinSystem, SkinRegistry, telemetry, persistence
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSkinSystem } from '../hooks/useSkinSystem';
import { useSkinSlot } from '../components/SkinSlot';
import { getSkinReplacementAPI_TS003 } from '../SkinReplacementAPI_TS003';
import { 
  ActivityCapsuleSkinConfig,
  getActivityCapsuleSkinConfig,
  createActivityCapsuleSkinBinding,
  validateActivityCapsuleSkinConfig,
  mergeActivityCapsuleSkinConfig,
  type ActivityCapsuleFrameConfig,
  type ActivityCapsuleProgressConfig,
  type ActivityCapsuleCTAConfig,
  type ActivityCapsuleAnimationConfig,
  type ActivityCapsuleTypographyConfig,
  type ActivityCapsuleStatusConfig,
  type ActivityCapsuleAccessibilityConfig,
} from './ActivityCapsuleSkinSchema';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult
} from '../SkinSchema';

// ============================================================================
// ACTIVITY CAPSULE SKIN HOOK OPTIONS
// ============================================================================

export interface UseActivityCapsuleSkinOptions {
  /** Component identifier for skin binding */
  componentId: string;
  
  /** Initial skin configuration */
  initialPillar?: StyleLabPillar;
  initialPresetId?: SkinPresetId;
  initialMotionLevel?: MotionLevel;
  initialConfig?: Partial<ActivityCapsuleSkinConfig>;
  
  /** Skin binding options */
  enableSkinBinding?: boolean;
  bindingPriority?: 'low' | 'normal' | 'high' | 'critical';
  autoRegister?: boolean;
  
  /** Validation options */
  enableValidation?: boolean;
  validationMode?: 'strict' | 'lenient' | 'disabled';
  onValidationError?: (errors: SkinValidationResult) => void;
  
  /** Hot-reload options */
  enableHotReload?: boolean;
  hotReloadDebounceMs?: number;
  onHotReload?: (config: ActivityCapsuleSkinConfig) => void;
  
  /** Performance options */
  enablePerformanceOptimization?: boolean;
  cacheConfig?: boolean;
  cacheMaxAge?: number;
  
  /** Development options */
  enableDevTools?: boolean;
  enableDebugMode?: boolean;
  logSkinChanges?: boolean;
  
  /** Legacy compatibility */
  enableLegacyCompatibility?: boolean;
  legacyConfigMapper?: (legacy: any) => Partial<ActivityCapsuleSkinConfig>;
}

export interface UseActivityCapsuleSkinReturn {
  /** Current skin configuration */
  config: ActivityCapsuleSkinConfig;
  
  /** Skin binding state */
  binding: ComponentSkinBinding | null;
  isBound: boolean;
  bindingError: string | null;
  
  /** Validation state */
  validation: SkinValidationResult | null;
  isValid: boolean;
  validationErrors: string[];
  
  /** Hot-reload state */
  isHotReloading: boolean;
  lastHotReload: number | null;
  
  /** Performance state */
  cacheHits: number;
  cacheMisses: number;
  renderCount: number;
  
  /** Actions */
  updateConfig: (updates: Partial<ActivityCapsuleSkinConfig>) => void;
  updatePillar: (pillar: StyleLabPillar) => void;
  updatePresetId: (presetId: SkinPresetId) => void;
  updateMotionLevel: (motionLevel: MotionLevel) => void;
  
  /** Skin binding actions */
  bind: () => void;
  unbind: () => void;
  rebind: () => void;
  
  /** Validation actions */
  validate: () => SkinValidationResult;
  clearValidationErrors: () => void;
  
  /** Hot-reload actions */
  hotReload: () => Promise<void>;
  enableHotReloadMode: () => void;
  disableHotReloadMode: () => void;
  
  /** Utility actions */
  reset: () => void;
  exportConfig: () => string;
  importConfig: (configString: string) => boolean;
  
  /** Legacy compatibility */
  applyLegacyOverride: (legacyConfig: any) => void;
  
  /** Development tools */
  inspectBinding: () => ComponentSkinBinding | null;
  inspectCache: () => { size: number; entries: Array<any> };
  generateDebugInfo: () => any;
}

// ============================================================================
// ACTIVITY CAPSULE SKIN CACHE
// ============================================================================

class ActivityCapsuleSkinCache {
  private cache = new Map<string, { config: ActivityCapsuleSkinConfig; timestamp: number; ttl: number }>();
  private stats = { hits: 0, misses: 0 };
  
  get(key: string): ActivityCapsuleSkinConfig | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.config;
  }
  
  set(key: string, config: ActivityCapsuleSkinConfig, ttl: number = 300000): void {
    this.cache.set(key, {
      config,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
  
  getStats() {
    return { ...this.stats, size: this.cache.size };
  }
  
  inspect() {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      config: entry.config,
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      age: Date.now() - entry.timestamp,
    }));
  }
}

// ============================================================================
// MAIN ACTIVITY CAPSULE SKIN HOOK
// ============================================================================

export const useActivityCapsuleSkin = (options: UseActivityCapsuleSkinOptions): UseActivityCapsuleSkinReturn => {
  const {
    componentId,
    initialPillar,
    initialPresetId,
    initialMotionLevel,
    initialConfig,
    enableSkinBinding = true,
    bindingPriority = 'normal',
    autoRegister = true,
    enableValidation = true,
    validationMode = 'lenient',
    onValidationError,
    enableHotReload = false,
    hotReloadDebounceMs = 300,
    onHotReload,
    enablePerformanceOptimization = true,
    cacheConfig = true,
    cacheMaxAge = 300000,
    enableDevTools = false,
    enableDebugMode = false,
    logSkinChanges = false,
    enableLegacyCompatibility = true,
    legacyConfigMapper,
  } = options;
  
  // TS-Series skin system integration
  const skinSystem = useSkinSystem();
  const skinSlot = useSkinSlot({
    componentId,
    componentType: 'ActivityCapsule',
    enabled: enableSkinBinding,
    priority: bindingPriority,
  });
  
  // Component state
  const [config, setConfig] = useState<ActivityCapsuleSkinConfig>(() => 
    getActivityCapsuleSkinConfig(initialPillar || skinSystem.pillar, {
      presetId: initialPresetId || skinSystem.presetId,
      motionLevel: initialMotionLevel || skinSystem.motionLevel,
      pillar: initialPillar || skinSystem.pillar,
      ...initialConfig,
    })
  );
  const [binding, setBinding] = useState<ComponentSkinBinding | null>(null);
  const [bindingError, setBindingError] = useState<string | null>(null);
  const [validation, setValidation] = useState<SkinValidationResult | null>(null);
  const [isHotReloading, setIsHotReloading] = useState(false);
  const [lastHotReload, setLastHotReload] = useState<number | null>(null);
  const [renderCount, setRenderCount] = useState(0);
  
  // Refs and cache
  const configRef = useRef(config);
  const validationRef = useRef(validation);
  const cacheRef = useRef(new ActivityCapsuleSkinCache());
  const hotReloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const apiRef = useRef(getSkinReplacementAPI_TS003());
  
  // Update refs when values change
  useEffect(() => {
    configRef.current = config;
    setRenderCount(prev => prev + 1);
  }, [config]);
  
  useEffect(() => {
    validationRef.current = validation;
  }, [validation]);
  
  // Generate cache key for configuration
  const getCacheKey = useCallback((config: ActivityCapsuleSkinConfig): string => {
    return `${componentId}-${config.pillar}-${config.presetId}-${config.motionLevel}-${config.version}`;
  }, [componentId]);
  
  // Get configuration with caching
  const getConfigWithCache = useCallback((
    pillar: StyleLabPillar,
    presetId: SkinPresetId,
    motionLevel: MotionLevel,
    overrides?: Partial<ActivityCapsuleSkinConfig>
  ): ActivityCapsuleSkinConfig => {
    if (!enablePerformanceOptimization || !cacheConfig) {
      return getActivityCapsuleSkinConfig(pillar, {
        presetId,
        motionLevel,
        pillar,
        ...overrides,
      });
    }
    
    const cacheKey = getCacheKey({
      pillar,
      presetId,
      motionLevel,
      version: '1.0.0',
      ...overrides,
    } as ActivityCapsuleSkinConfig);
    
    let cachedConfig = cacheRef.current.get(cacheKey);
    if (!cachedConfig) {
      cachedConfig = getActivityCapsuleSkinConfig(pillar, {
        presetId,
        motionLevel,
        pillar,
        ...overrides,
      });
      cacheRef.current.set(cacheKey, cachedConfig, cacheMaxAge);
    }
    
    return cachedConfig;
  }, [
    enablePerformanceOptimization,
    cacheConfig,
    getCacheKey,
    cacheMaxAge,
  ]);
  
  // Validate configuration
  const validateConfig = useCallback((config: ActivityCapsuleSkinConfig): SkinValidationResult => {
    if (!enableValidation || validationMode === 'disabled') {
      return { isValid: true, errors: [], warnings: [] };
    }
    
    const result = validateActivityCapsuleSkinConfig(config);
    
    if (validationMode === 'strict' && !result.isValid) {
      return result;
    }
    
    if (validationMode === 'lenient') {
      // In lenient mode, treat warnings as non-critical
      return {
        isValid: true,
        errors: result.errors,
        warnings: result.warnings,
      };
    }
    
    return result;
  }, [enableValidation, validationMode]);
  
  // Update configuration with validation and caching
  const updateConfigInternal = useCallback((
    updates: Partial<ActivityCapsuleSkinConfig>,
    skipValidation: boolean = false
  ) => {
    const newConfig = mergeActivityCapsuleSkinConfig(config, updates);
    
    // Validate new configuration
    const validationResult = skipValidation ? { isValid: true, errors: [], warnings: [] } : validateConfig(newConfig);
    setValidation(validationResult);
    
    if (!validationResult.isValid && onValidationError) {
      onValidationError(validationResult);
    }
    
    // Only update if valid or in lenient mode
    if (validationResult.isValid || validationMode === 'lenient') {
      setConfig(newConfig);
      
      // Log changes if enabled
      if (enableDebugMode && logSkinChanges) {
        console.log(`[ActivityCapsuleSkin] Config updated for ${componentId}:`, updates);
      }
      
      // Telemetry
      if (newConfig.enableTelemetry) {
        trackTelemetryEvent('activity_capsule_skin_config_updated', {
          componentId,
          updates: Object.keys(updates),
          isValid: validationResult.isValid,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length,
          timestamp: Date.now(),
        });
      }
      
      return newConfig;
    }
    
    return config;
  }, [
    config,
    validateConfig,
    onValidationError,
    validationMode,
    enableDebugMode,
    logSkinChanges,
    componentId,
  ]);
  
  // Initialize skin binding
  useEffect(() => {
    if (enableSkinBinding && autoRegister) {
      const skinBinding = createActivityCapsuleSkinBinding(componentId, config);
      
      try {
        skinSlot.register(skinBinding);
        setBinding(skinBinding);
        setBindingError(null);
        
        if (enableDebugMode) {
          console.log(`[ActivityCapsuleSkin] Binding registered for ${componentId}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown binding error';
        setBindingError(errorMessage);
        
        if (enableDevTools) {
          console.error(`[ActivityCapsuleSkin] Binding failed for ${componentId}:`, error);
        }
      }
    }
    
    return () => {
      if (enableSkinBinding) {
        skinSlot.unregister();
        setBinding(null);
      }
    };
  }, [
    componentId,
    config,
    enableSkinBinding,
    autoRegister,
    skinSlot,
    enableDebugMode,
    enableDevTools,
  ]);
  
  // Handle skin system changes
  useEffect(() => {
    const handleSkinSystemChange = () => {
      const newConfig = getConfigWithCache(
        skinSystem.pillar,
        skinSystem.presetId,
        skinSystem.motionLevel,
        {
          pillar: skinSystem.pillar,
          presetId: skinSystem.presetId,
          motionLevel: skinSystem.motionLevel,
        }
      );
      
      updateConfigInternal(newConfig, true); // Skip validation for system changes
    };
    
    // Subscribe to skin system changes
    const unsubscribe = skinSystem.subscribe(handleSkinSystemChange);
    
    return unsubscribe;
  }, [
    skinSystem,
    getConfigWithCache,
    updateConfigInternal,
  ]);
  
  // Hot-reload functionality
  const hotReload = useCallback(async (): Promise<void> => {
    if (!enableHotReload) return;
    
    setIsHotReloading(true);
    setLastHotReload(Date.now());
    
    try {
      // Get current configuration from skin system
      const currentConfig = getConfigWithCache(
        config.pillar,
        config.presetId,
        config.motionLevel,
        config
      );
      
      // Apply hot-reload updates
      const hotReloadedConfig = mergeActivityCapsuleSkinConfig(currentConfig, {
        lastModified: Date.now(),
      });
      
      updateConfigInternal(hotReloadedConfig, true);
      
      // Notify API of hot-reload
      apiRef.current.trackEvent('hot_reload', {
        componentId,
        configVersion: hotReloadedConfig.version,
        timestamp: Date.now(),
      });
      
      // Call hot-reload callback
      if (onHotReload) {
        onHotReload(hotReloadedConfig);
      }
      
      if (enableDebugMode) {
        console.log(`[ActivityCapsuleSkin] Hot-reload completed for ${componentId}`);
      }
    } catch (error) {
      console.error(`[ActivityCapsuleSkin] Hot-reload failed for ${componentId}:`, error);
    } finally {
      setIsHotReloading(false);
    }
  }, [
    enableHotReload,
    componentId,
    config,
    getConfigWithCache,
    updateConfigInternal,
    onHotReload,
    enableDebugMode,
  ]);
  
  // Debounced hot-reload
  const debouncedHotReload = useCallback(() => {
    if (hotReloadTimeoutRef.current) {
      clearTimeout(hotReloadTimeoutRef.current);
    }
    
    hotReloadTimeoutRef.current = setTimeout(() => {
      hotReload();
    }, hotReloadDebounceMs);
  }, [hotReload, hotReloadDebounceMs]);
  
  // Public API methods
  const updateConfig = useCallback((updates: Partial<ActivityCapsuleSkinConfig>) => {
    return updateConfigInternal(updates);
  }, [updateConfigInternal]);
  
  const updatePillar = useCallback((pillar: StyleLabPillar) => {
    const newConfig = getConfigWithCache(pillar, config.presetId, config.motionLevel, {
      pillar,
    });
    return updateConfigInternal(newConfig);
  }, [getConfigWithCache, config.presetId, config.motionLevel, updateConfigInternal]);
  
  const updatePresetId = useCallback((presetId: SkinPresetId) => {
    const newConfig = getConfigWithCache(config.pillar, presetId, config.motionLevel, {
      presetId,
    });
    return updateConfigInternal(newConfig);
  }, [getConfigWithCache, config.pillar, config.motionLevel, updateConfigInternal]);
  
  const updateMotionLevel = useCallback((motionLevel: MotionLevel) => {
    const newConfig = getConfigWithCache(config.pillar, config.presetId, motionLevel, {
      motionLevel,
    });
    return updateConfigInternal(newConfig);
  }, [getConfigWithCache, config.pillar, config.presetId, updateConfigInternal]);
  
  const bind = useCallback(() => {
    if (!enableSkinBinding) return;
    
    const skinBinding = createActivityCapsuleSkinBinding(componentId, config);
    
    try {
      skinSlot.register(skinBinding);
      setBinding(skinBinding);
      setBindingError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown binding error';
      setBindingError(errorMessage);
    }
  }, [enableSkinBinding, componentId, config, skinSlot]);
  
  const unbind = useCallback(() => {
    if (enableSkinBinding) {
      skinSlot.unregister();
      setBinding(null);
    }
  }, [enableSkinBinding, skinSlot]);
  
  const rebind = useCallback(() => {
    unbind();
    bind();
  }, [unbind, bind]);
  
  const validate = useCallback((): SkinValidationResult => {
    const result = validateConfig(config);
    setValidation(result);
    return result;
  }, [validateConfig, config]);
  
  const clearValidationErrors = useCallback(() => {
    setValidation({ isValid: true, errors: [], warnings: [] });
  }, []);
  
  const enableHotReloadMode = useCallback(() => {
    if (enableHotReload) return;
    
    // This would typically be handled by updating options or state
    if (enableDebugMode) {
      console.log(`[ActivityCapsuleSkin] Hot-reload mode enabled for ${componentId}`);
    }
  }, [enableHotReload, enableDebugMode, componentId]);
  
  const disableHotReloadMode = useCallback(() => {
    if (!enableHotReload) return;
    
    if (hotReloadTimeoutRef.current) {
      clearTimeout(hotReloadTimeoutRef.current);
      hotReloadTimeoutRef.current = null;
    }
    
    if (enableDebugMode) {
      console.log(`[ActivityCapsuleSkin] Hot-reload mode disabled for ${componentId}`);
    }
  }, [enableHotReload, enableDebugMode, componentId]);
  
  const reset = useCallback(() => {
    const defaultConfig = getActivityCapsuleSkinConfig(initialPillar || skinSystem.pillar, {
      presetId: initialPresetId || skinSystem.presetId,
      motionLevel: initialMotionLevel || skinSystem.motionLevel,
      pillar: initialPillar || skinSystem.pillar,
      ...initialConfig,
    });
    
    updateConfigInternal(defaultConfig, true);
    clearValidationErrors();
    cacheRef.current.clear();
    
    if (enableDebugMode) {
      console.log(`[ActivityCapsuleSkin] Reset to default config for ${componentId}`);
    }
  }, [
    initialPillar,
    initialPresetId,
    initialMotionLevel,
    initialConfig,
    skinSystem.pillar,
    skinSystem.presetId,
    skinSystem.motionLevel,
    updateConfigInternal,
    clearValidationErrors,
    enableDebugMode,
    componentId,
  ]);
  
  const exportConfig = useCallback((): string => {
    return JSON.stringify(config, null, 2);
  }, [config]);
  
  const importConfig = useCallback((configString: string): boolean => {
    try {
      const importedConfig = JSON.parse(configString);
      const validationResult = validateActivityCapsuleSkinConfig(importedConfig);
      
      if (validationResult.isValid) {
        updateConfigInternal(importedConfig);
        return true;
      } else {
        setValidation(validationResult);
        return false;
      }
    } catch (error) {
      console.error(`[ActivityCapsuleSkin] Failed to import config for ${componentId}:`, error);
      return false;
    }
  }, [updateConfigInternal, componentId]);
  
  const applyLegacyOverride = useCallback((legacyConfig: any) => {
    if (!enableLegacyCompatibility) return;
    
    try {
      const mappedConfig = legacyConfigMapper ? legacyConfigMapper(legacyConfig) : legacyConfig;
      updateConfigInternal(mappedConfig, true);
      
      if (enableDebugMode) {
        console.log(`[ActivityCapsuleSkin] Applied legacy override for ${componentId}`);
      }
    } catch (error) {
      console.error(`[ActivityCapsuleSkin] Failed to apply legacy override for ${componentId}:`, error);
    }
  }, [enableLegacyCompatibility, legacyConfigMapper, updateConfigInternal, enableDebugMode, componentId]);
  
  const inspectBinding = useCallback((): ComponentSkinBinding | null => {
    return binding;
  }, [binding]);
  
  const inspectCache = useCallback(() => {
    return {
      size: cacheRef.current.getStats().size,
      entries: cacheRef.current.inspect(),
    };
  }, []);
  
  const generateDebugInfo = useCallback(() => {
    return {
      componentId,
      config,
      binding,
      validation,
      isHotReloading,
      lastHotReload,
      renderCount,
      cacheStats: cacheRef.current.getStats(),
      skinSystem: {
        pillar: skinSystem.pillar,
        presetId: skinSystem.presetId,
        motionLevel: skinSystem.motionLevel,
      },
      options: {
        enableSkinBinding,
        enableValidation,
        validationMode,
        enableHotReload,
        enablePerformanceOptimization,
        cacheConfig,
        enableDevTools,
        enableDebugMode,
      },
    };
  }, [
    componentId,
    config,
    binding,
    validation,
    isHotReloading,
    lastHotReload,
    renderCount,
    skinSystem,
    enableSkinBinding,
    enableValidation,
    validationMode,
    enableHotReload,
    enablePerformanceOptimization,
    cacheConfig,
    enableDevTools,
    enableDebugMode,
  ]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (hotReloadTimeoutRef.current) {
        clearTimeout(hotReloadTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    config,
    binding,
    isBound: !!binding,
    bindingError,
    validation,
    isValid: validation?.isValid ?? true,
    validationErrors: validation?.errors.map(e => e.message) ?? [],
    isHotReloading,
    lastHotReload,
    cacheHits: cacheRef.current.getStats().hits,
    cacheMisses: cacheRef.current.getStats().misses,
    renderCount,
    updateConfig,
    updatePillar,
    updatePresetId,
    updateMotionLevel,
    bind,
    unbind,
    rebind,
    validate,
    clearValidationErrors,
    hotReload,
    enableHotReloadMode,
    disableHotReloadMode,
    reset,
    exportConfig,
    importConfig,
    applyLegacyOverride,
    inspectBinding,
    inspectCache,
    generateDebugInfo,
  };
};

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Simplified hook for basic ActivityCapsule skin management
 */
export const useActivityCapsuleSkinBasic = (
  componentId: string,
  initialPillar?: StyleLabPillar
): UseActivityCapsuleSkinReturn => {
  return useActivityCapsuleSkin({
    componentId,
    initialPillar,
    enableSkinBinding: true,
    enableValidation: true,
    enableHotReload: false,
    enablePerformanceOptimization: true,
    cacheConfig: true,
  });
};

/**
 * Hook for ActivityCapsule skin development and debugging
 */
export const useActivityCapsuleSkinDev = (
  componentId: string,
  initialConfig?: Partial<ActivityCapsuleSkinConfig>
): UseActivityCapsuleSkinReturn => {
  return useActivityCapsuleSkin({
    componentId,
    initialConfig,
    enableSkinBinding: true,
    enableValidation: true,
    validationMode: 'strict',
    enableHotReload: true,
    hotReloadDebounceMs: 100,
    enablePerformanceOptimization: false,
    cacheConfig: false,
    enableDevTools: true,
    enableDebugMode: true,
    logSkinChanges: true,
  });
};

/**
 * Hook for ActivityCapsule skin with legacy compatibility
 */
export const useActivityCapsuleSkinLegacy = (
  componentId: string,
  legacyConfig?: any,
  legacyMapper?: (legacy: any) => Partial<ActivityCapsuleSkinConfig>
): UseActivityCapsuleSkinReturn => {
  const hook = useActivityCapsuleSkin({
    componentId,
    enableLegacyCompatibility: true,
    legacyConfigMapper: legacyMapper,
    enableSkinBinding: true,
    enableValidation: false, // Disable validation for legacy compatibility
    enableHotReload: false,
    enablePerformanceOptimization: true,
    cacheConfig: true,
  });
  
  // Apply legacy config on mount
  useEffect(() => {
    if (legacyConfig) {
      hook.applyLegacyOverride(legacyConfig);
    }
  }, [legacyConfig, hook]);
  
  return hook;
};

export default useActivityCapsuleSkin;
