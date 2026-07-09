/**
 * WL-STY-011: ActivityCapsuleDetail Skin Override Hooks (TS-Series Integration)
 * 
 * Advanced React hooks for managing ActivityCapsuleDetail skin configurations
 * with full TS-Series integration, caching, validation, hot-reloading,
 * legacy compatibility, and development tools.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSkinSystem } from '../hooks/useSkinSystem';
import { useSkinSlot } from '../components/SkinSlot';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { ActivityCapsuleDetailSkinConfig } from './ActivityCapsuleDetailSkinSchema';
import {
  DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
  getActivityCapsuleDetailSkinConfig,
  createActivityCapsuleDetailSkinBinding,
  validateActivityCapsuleDetailSkinConfig,
  mergeActivityCapsuleDetailSkinConfig,
  isValidActivityCapsuleDetailSkinConfig,
  isActivityCapsuleDetailSkinBinding,
} from './ActivityCapsuleDetailSkinSchema';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult,
  SkinHookOptions,
} from '../SkinSchema';

// Hook options interface
export interface UseActivityCapsuleDetailSkinOptions extends SkinHookOptions {
  /** Component identification */
  componentId?: string;
  componentType?: string;
  
  /** Skin configuration */
  pillar?: StyleLabPillar;
  skinPresetId?: SkinPresetId;
  motionLevel?: MotionLevel;
  skinConfigOverride?: Partial<ActivityCapsuleDetailSkinConfig>;
  
  /** Feature flags */
  enableSkinBinding?: boolean;
  enableValidation?: boolean;
  enableHotReload?: boolean;
  enableTelemetry?: boolean;
  enableDevTools?: boolean;
  enableCache?: boolean;
  enableLegacySupport?: boolean;
  
  /** Performance options */
  cacheTimeout?: number;
  debounceTime?: number;
  maxCacheSize?: number;
  
  /** Development options */
  onValidationError?: (errors: SkinValidationResult) => void;
  onSkinChange?: (config: ActivityCapsuleDetailSkinConfig) => void;
  onBindingChange?: (binding: ComponentSkinBinding | null) => void;
  onHotReload?: (config: ActivityCapsuleDetailSkinConfig) => void;
  
  /** Legacy compatibility */
  legacyConfigAdapter?: (legacy: any) => Partial<ActivityCapsuleDetailSkinConfig>;
  enableLegacyMigration?: boolean;
}

// Hook return interface
export interface UseActivityCapsuleDetailSkinReturn {
  /** Current skin configuration */
  config: ActivityCapsuleDetailSkinConfig;
  
  /** Validation state */
  validation: SkinValidationResult;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  
  /** Binding state */
  binding: ComponentSkinBinding | null;
  isBound: boolean;
  
  /** Performance state */
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: number;
  cacheHit: boolean;
  
  /** Actions */
  updateConfig: (config: Partial<ActivityCapsuleDetailSkinConfig>) => void;
  resetConfig: () => void;
  refreshConfig: () => Promise<void>;
  validateConfig: () => SkinValidationResult;
  
  /** Binding actions */
  bindSkin: (binding: ComponentSkinBinding) => void;
  unbindSkin: () => void;
  updateBinding: (config: Partial<ActivityCapsuleDetailSkinConfig>) => void;
  
  /** Utility actions */
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  copyConfig: () => void;
  
  /** Development tools */
  enableDevMode: () => void;
  disableDevMode: () => void;
  getDebugInfo: () => any;
  
  /** Legacy support */
  migrateLegacy: (legacy: any) => boolean;
  getLegacyAdapter: () => ((legacy: any) => Partial<ActivityCapsuleDetailSkinConfig>) | null;
}

// Cache interface
interface SkinCache {
  config: ActivityCapsuleDetailSkinConfig;
  timestamp: number;
  validation: SkinValidationResult;
}

/**
 * Main ActivityCapsuleDetail skin hook with full TS-Series integration
 */
export function useActivityCapsuleDetailSkin(
  options: UseActivityCapsuleDetailSkinOptions = {}
): UseActivityCapsuleDetailSkinReturn {
  const {
    componentId = 'activity-capsule-detail',
    componentType = 'ActivityCapsuleDetail',
    pillar,
    skinPresetId,
    motionLevel,
    skinConfigOverride,
    enableSkinBinding = true,
    enableValidation = true,
    enableHotReload = true,
    enableTelemetry = true,
    enableDevTools = false,
    enableCache = true,
    enableLegacySupport = false,
    cacheTimeout = 300000, // 5 minutes
    debounceTime = 100,
    maxCacheSize = 10,
    onValidationError,
    onSkinChange,
    onBindingChange,
    onHotReload,
    legacyConfigAdapter,
    enableLegacyMigration = false,
  } = options;
  
  // TS-Series skin system integration
  const skinSystem = useSkinSystem();
  const skinSlot = useSkinSlot({
    componentId,
    componentType,
    enabled: enableSkinBinding,
    priority: 'normal',
  });
  
  // Component state
  const [config, setConfig] = useState<ActivityCapsuleDetailSkinConfig>(() => 
    getActivityCapsuleDetailSkinConfig(pillar, {
      presetId: skinPresetId,
      pillar: pillar || skinSystem.pillar,
      motionLevel: motionLevel || skinSystem.motionLevel,
      ...skinConfigOverride,
    })
  );
  
  const [validation, setValidation] = useState<SkinValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [cacheHit, setCacheHit] = useState(false);
  const [devMode, setDevMode] = useState(enableDevTools);
  
  // Refs
  const cacheRef = useRef<Map<string, SkinCache>>(new Map());
  const configRef = useRef(config);
  const validationRef = useRef(validation);
  const debounceRef = useRef<NodeJS.Timeout>();
  const hotReloadRef = useRef<NodeJS.Timeout>();
  
  // Update refs
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  useEffect(() => {
    validationRef.current = validation;
  }, [validation]);
  
  // Generate cache key
  const getCacheKey = useCallback((pillar: StyleLabPillar, presetId: SkinPresetId, motionLevel: MotionLevel) => {
    return `${componentId}-${pillar}-${presetId}-${motionLevel}`;
  }, [componentId]);
  
  // Get cached configuration
  const getCachedConfig = useCallback((cacheKey: string): ActivityCapsuleDetailSkinConfig | null => {
    if (!enableCache) return null;
    
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cacheTimeout) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    setCacheHit(true);
    return cached.config;
  }, [enableCache, cacheTimeout]);
  
  // Set cached configuration
  const setCachedConfig = useCallback((cacheKey: string, config: ActivityCapsuleDetailSkinConfig, validation: SkinValidationResult) => {
    if (!enableCache) return;
    
    // Clean old cache entries if needed
    if (cacheRef.current.size >= maxCacheSize) {
      const oldestKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(oldestKey);
    }
    
    cacheRef.current.set(cacheKey, {
      config: { ...config },
      timestamp: Date.now(),
      validation: { ...validation },
    });
  }, [enableCache, maxCacheSize]);
  
  // Resolve skin configuration
  const resolveConfig = useCallback(async (forceRefresh = false): Promise<ActivityCapsuleDetailSkinConfig> => {
    const resolvedPillar = pillar || skinSystem.pillar;
    const resolvedPresetId = skinPresetId || skinSystem.presetId;
    const resolvedMotionLevel = motionLevel || skinSystem.motionLevel;
    
    const cacheKey = getCacheKey(resolvedPillar, resolvedPresetId, resolvedMotionLevel);
    
    if (!forceRefresh) {
      const cached = getCachedConfig(cacheKey);
      if (cached) return cached;
    }
    
    setCacheHit(false);
    
    let baseConfig = getActivityCapsuleDetailSkinConfig(resolvedPillar, {
      presetId: resolvedPresetId,
      pillar: resolvedPillar,
      motionLevel: resolvedMotionLevel,
      ...skinConfigOverride,
    });
    
    // Apply skin slot overrides if available
    if (skinSlot.binding?.config) {
      baseConfig = mergeActivityCapsuleDetailSkinConfig(baseConfig, skinSlot.binding.config);
    }
    
    // Apply runtime overrides
    if (skinConfigOverride) {
      baseConfig = mergeActivityCapsuleDetailSkinConfig(baseConfig, skinConfigOverride);
    }
    
    // Validate configuration
    const validation = enableValidation ? validateActivityCapsuleDetailSkinConfig(baseConfig) : { isValid: true, errors: [], warnings: [] };
    
    // Cache the result
    setCachedConfig(cacheKey, baseConfig, validation);
    
    return baseConfig;
  }, [
    pillar, 
    skinPresetId, 
    motionLevel, 
    skinConfigOverride,
    skinSystem.pillar,
    skinSystem.presetId,
    skinSystem.motionLevel,
    skinSlot.binding?.config,
    enableValidation,
    getCacheKey,
    getCachedConfig,
    setCachedConfig,
  ]);
  
  // Validate configuration
  const validateCurrentConfig = useCallback((): SkinValidationResult => {
    const validation = validateActivityCapsuleDetailSkinConfig(config);
    setValidation(validation);
    
    if (!validation.isValid && onValidationError) {
      onValidationError(validation);
    }
    
    return validation;
  }, [config, onValidationError]);
  
  // Update configuration
  const updateConfig = useCallback((updates: Partial<ActivityCapsuleDetailSkinConfig>) => {
    const newConfig = mergeActivityCapsuleDetailSkinConfig(config, updates);
    setConfig(newConfig);
    
    if (enableValidation) {
      validateCurrentConfig();
    }
    
    if (onSkinChange) {
      onSkinChange(newConfig);
    }
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_config_updated', {
        componentId,
        updateKeys: Object.keys(updates),
        pillar: newConfig.pillar,
        presetId: newConfig.presetId,
        motionLevel: newConfig.motionLevel,
        timestamp: Date.now(),
      });
    }
  }, [
    config, 
    enableValidation, 
    validateCurrentConfig, 
    onSkinChange, 
    enableTelemetry, 
    componentId,
  ]);
  
  // Reset configuration
  const resetConfig = useCallback(() => {
    const resolvedPillar = pillar || skinSystem.pillar;
    const resolvedPresetId = skinPresetId || skinSystem.presetId;
    const resolvedMotionLevel = motionLevel || skinSystem.motionLevel;
    
    const defaultConfig = getActivityCapsuleDetailSkinConfig(resolvedPillar, {
      presetId: resolvedPresetId,
      pillar: resolvedPillar,
      motionLevel: resolvedMotionLevel,
    });
    
    setConfig(defaultConfig);
    
    if (enableValidation) {
      validateCurrentConfig();
    }
    
    if (onSkinChange) {
      onSkinChange(defaultConfig);
    }
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_config_reset', {
        componentId,
        pillar: resolvedPillar,
        presetId: resolvedPresetId,
        motionLevel: resolvedMotionLevel,
        timestamp: Date.now(),
      });
    }
  }, [
    pillar, 
    skinPresetId, 
    motionLevel, 
    skinSystem.pillar, 
    skinSystem.presetId, 
    skinSystem.motionLevel,
    enableValidation, 
    validateCurrentConfig, 
    onSkinChange, 
    enableTelemetry, 
    componentId,
  ]);
  
  // Refresh configuration
  const refreshConfig = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const newConfig = await resolveConfig(true);
      setConfig(newConfig);
      setLastRefresh(Date.now());
      
      if (enableValidation) {
        validateCurrentConfig();
      }
      
      if (onSkinChange) {
        onSkinChange(newConfig);
      }
      
      if (enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_config_refreshed', {
          componentId,
          pillar: newConfig.pillar,
          presetId: newConfig.presetId,
          motionLevel: newConfig.motionLevel,
          cacheHit,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to refresh ActivityCapsuleDetail skin config:', error);
      
      if (enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_config_refresh_error', {
          componentId,
          error: String(error),
          timestamp: Date.now(),
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [
    resolveConfig,
    enableValidation,
    validateCurrentConfig,
    onSkinChange,
    enableTelemetry,
    componentId,
    cacheHit,
  ]);
  
  // Bind skin
  const bindSkin = useCallback((binding: ComponentSkinBinding) => {
    if (!isActivityCapsuleDetailSkinBinding(binding)) {
      console.warn('Invalid ActivityCapsuleDetail skin binding provided');
      return;
    }
    
    skinSlot.register(binding);
    
    if (onBindingChange) {
      onBindingChange(binding);
    }
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_bound', {
        componentId,
        bindingId: binding.componentId,
        pillar: binding.pillar,
        presetId: binding.skinPresetId,
        motionLevel: binding.motionLevel,
        timestamp: Date.now(),
      });
    }
  }, [skinSlot, onBindingChange, enableTelemetry, componentId]);
  
  // Unbind skin
  const unbindSkin = useCallback(() => {
    skinSlot.unregister();
    
    if (onBindingChange) {
      onBindingChange(null);
    }
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_unbound', {
        componentId,
        timestamp: Date.now(),
      });
    }
  }, [skinSlot, onBindingChange, enableTelemetry, componentId]);
  
  // Update binding
  const updateBinding = useCallback((updates: Partial<ActivityCapsuleDetailSkinConfig>) => {
    if (!skinSlot.binding) return;
    
    const updatedBinding = {
      ...skinSlot.binding,
      config: mergeActivityCapsuleDetailSkinConfig(skinSlot.binding.config as ActivityCapsuleDetailSkinConfig, updates),
    };
    
    skinSlot.update(updatedBinding);
    
    if (onBindingChange) {
      onBindingChange(updatedBinding);
    }
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_binding_updated', {
        componentId,
        bindingId: skinSlot.binding.componentId,
        updateKeys: Object.keys(updates),
        timestamp: Date.now(),
      });
    }
  }, [skinSlot.binding, skinSlot, onBindingChange, enableTelemetry, componentId]);
  
  // Export configuration
  const exportConfig = useCallback((): string => {
    return JSON.stringify(config, null, 2);
  }, [config]);
  
  // Import configuration
  const importConfig = useCallback((configString: string): boolean => {
    try {
      const importedConfig = JSON.parse(configString);
      
      if (!isValidActivityCapsuleDetailSkinConfig(importedConfig)) {
        console.warn('Invalid ActivityCapsuleDetail skin configuration provided');
        return false;
      }
      
      updateConfig(importedConfig);
      
      if (enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_config_imported', {
          componentId,
          success: true,
          timestamp: Date.now(),
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import ActivityCapsuleDetail skin config:', error);
      
      if (enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_config_import_error', {
          componentId,
          error: String(error),
          timestamp: Date.now(),
        });
      }
      
      return false;
    }
  }, [updateConfig, enableTelemetry, componentId]);
  
  // Copy configuration
  const copyConfig = useCallback(() => {
    const configString = exportConfig();
    navigator.clipboard.writeText(configString).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = configString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_config_copied', {
        componentId,
        timestamp: Date.now(),
      });
    }
  }, [exportConfig, enableTelemetry, componentId]);
  
  // Development tools
  const enableDevMode = useCallback(() => {
    setDevMode(true);
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_dev_mode_enabled', {
        componentId,
        timestamp: Date.now(),
      });
    }
  }, [enableTelemetry, componentId]);
  
  const disableDevMode = useCallback(() => {
    setDevMode(false);
    
    if (enableTelemetry) {
      trackTelemetryEvent('activity_capsule_detail_skin_dev_mode_disabled', {
        componentId,
        timestamp: Date.now(),
      });
    }
  }, [enableTelemetry, componentId]);
  
  const getDebugInfo = useCallback(() => {
    return {
      componentId,
      componentType,
      config,
      validation,
      binding: skinSlot.binding,
      isLoading,
      isRefreshing,
      lastRefresh,
      cacheHit,
      devMode,
      cacheSize: cacheRef.current.size,
      system: {
        pillar: skinSystem.pillar,
        presetId: skinSystem.presetId,
        motionLevel: skinSystem.motionLevel,
      },
    };
  }, [
    componentId,
    componentType,
    config,
    validation,
    skinSlot.binding,
    isLoading,
    isRefreshing,
    lastRefresh,
    cacheHit,
    devMode,
    skinSystem.pillar,
    skinSystem.presetId,
    skinSystem.motionLevel,
  ]);
  
  // Legacy support
  const migrateLegacy = useCallback((legacy: any): boolean => {
    if (!enableLegacySupport || !enableLegacyMigration) return false;
    
    try {
      let adaptedConfig: Partial<ActivityCapsuleDetailSkinConfig>;
      
      if (legacyConfigAdapter) {
        adaptedConfig = legacyConfigAdapter(legacy);
      } else {
        // Default legacy adapter
        adaptedConfig = {
          window: legacy.window || {},
          poi: legacy.poi || {},
          header: legacy.header || {},
          // ... other sections
        };
      }
      
      updateConfig(adaptedConfig);
      
      if (enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_legacy_migrated', {
          componentId,
          success: true,
          timestamp: Date.now(),
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to migrate legacy ActivityCapsuleDetail skin config:', error);
      
      if (enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_legacy_migration_error', {
          componentId,
          error: String(error),
          timestamp: Date.now(),
        });
      }
      
      return false;
    }
  }, [
    enableLegacySupport,
    enableLegacyMigration,
    legacyConfigAdapter,
    updateConfig,
    enableTelemetry,
    componentId,
  ]);
  
  const getLegacyAdapter = useCallback(() => {
    return legacyConfigAdapter || null;
  }, [legacyConfigAdapter]);
  
  // Initialize configuration
  useEffect(() => {
    setIsLoading(true);
    
    resolveConfig().then((initialConfig) => {
      setConfig(initialConfig);
      setIsLoading(false);
      
      if (enableValidation) {
        validateCurrentConfig();
      }
      
      if (enableTelemetry) {
        trackTelemetryEvent('activity_capsule_detail_skin_hook_initialized', {
          componentId,
          pillar: initialConfig.pillar,
          presetId: initialConfig.presetId,
          motionLevel: initialConfig.motionLevel,
          enableSkinBinding,
          enableValidation,
          enableHotReload,
          enableCache,
          timestamp: Date.now(),
        });
      }
    });
  }, [
    resolveConfig,
    enableValidation,
    validateCurrentConfig,
    enableTelemetry,
    componentId,
    enableSkinBinding,
    enableValidation,
    enableHotReload,
    enableCache,
  ]);
  
  // Handle skin system changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      resolveConfig().then((newConfig) => {
        if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
          setConfig(newConfig);
          
          if (enableValidation) {
            validateCurrentConfig();
          }
          
          if (onSkinChange) {
            onSkinChange(newConfig);
          }
        }
      });
    }, debounceTime);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    skinSystem.pillar,
    skinSystem.presetId,
    skinSystem.motionLevel,
    pillar,
    skinPresetId,
    motionLevel,
    skinConfigOverride,
    resolveConfig,
    enableValidation,
    validateCurrentConfig,
    onSkinChange,
    debounceTime,
    config,
  ]);
  
  // Handle skin slot changes
  useEffect(() => {
    if (skinSlot.binding?.config && enableSkinBinding) {
      resolveConfig().then((newConfig) => {
        if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
          setConfig(newConfig);
          
          if (enableValidation) {
            validateCurrentConfig();
          }
          
          if (onSkinChange) {
            onSkinChange(newConfig);
          }
        }
      });
    }
  }, [
    skinSlot.binding?.config,
    enableSkinBinding,
    resolveConfig,
    enableValidation,
    validateCurrentConfig,
    onSkinChange,
    config,
  ]);
  
  // Hot reload support
  useEffect(() => {
    if (!enableHotReload) return;
    
    const handleHotReload = () => {
      if (hotReloadRef.current) {
        clearTimeout(hotReloadRef.current);
      }
      
      hotReloadRef.current = setTimeout(() => {
        refreshConfig().then(() => {
          if (onHotReload) {
            onHotReload(config);
          }
        });
      }, 100);
    };
    
    // Listen for hot reload events
    window.addEventListener('skin-hot-reload', handleHotReload);
    
    return () => {
      window.removeEventListener('skin-hot-reload', handleHotReload);
      if (hotReloadRef.current) {
        clearTimeout(hotReloadRef.current);
      }
    };
  }, [enableHotReload, refreshConfig, onHotReload, config]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (hotReloadRef.current) {
        clearTimeout(hotReloadRef.current);
      }
    };
  }, []);
  
  return {
    config,
    validation,
    isValid: validation.isValid,
    errors: validation.errors.map(e => `${e.path}: ${e.message}`),
    warnings: validation.warnings.map(w => `${w.path}: ${w.message}`),
    binding: skinSlot.binding,
    isBound: !!skinSlot.binding,
    isLoading,
    isRefreshing,
    lastRefresh,
    cacheHit,
    updateConfig,
    resetConfig,
    refreshConfig,
    validateConfig: validateCurrentConfig,
    bindSkin,
    unbindSkin,
    updateBinding,
    exportConfig,
    importConfig,
    copyConfig,
    enableDevMode,
    disableDevMode,
    getDebugInfo,
    migrateLegacy,
    getLegacyAdapter,
  };
}

/**
 * Convenience hook for basic ActivityCapsuleDetail skin usage
 */
export function useActivityCapsuleDetailSkinBasic(
  pillar?: StyleLabPillar,
  presetId?: SkinPresetId
): UseActivityCapsuleDetailSkinReturn {
  return useActivityCapsuleDetailSkin({
    pillar,
    skinPresetId: presetId,
    enableSkinBinding: false,
    enableValidation: false,
    enableHotReload: false,
    enableTelemetry: false,
    enableDevTools: false,
    enableCache: true,
  });
}

/**
 * Development hook with all features enabled
 */
export function useActivityCapsuleDetailSkinDev(
  componentId: string,
  options: Partial<UseActivityCapsuleDetailSkinOptions> = {}
): UseActivityCapsuleDetailSkinReturn {
  return useActivityCapsuleDetailSkin({
    componentId,
    enableSkinBinding: true,
    enableValidation: true,
    enableHotReload: true,
    enableTelemetry: true,
    enableDevTools: true,
    enableCache: true,
    enableLegacySupport: true,
    enableLegacyMigration: true,
    ...options,
  });
}

/**
 * Legacy compatibility hook
 */
export function useActivityCapsuleDetailSkinLegacy(
  legacyConfig: any,
  adapter?: (legacy: any) => Partial<ActivityCapsuleDetailSkinConfig>
): UseActivityCapsuleDetailSkinReturn {
  const hook = useActivityCapsuleDetailSkin({
    enableLegacySupport: true,
    enableLegacyMigration: true,
    legacyConfigAdapter: adapter,
  });
  
  // Auto-migrate legacy config on mount
  useEffect(() => {
    if (legacyConfig) {
      hook.migrateLegacy(legacyConfig);
    }
  }, [legacyConfig, hook]);
  
  return hook;
}

export default useActivityCapsuleDetailSkin;
