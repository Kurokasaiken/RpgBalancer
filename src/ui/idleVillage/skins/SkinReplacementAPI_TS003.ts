/**
 * TS-003: Enhanced Skin Replacement API
 * 
 * Advanced API for dynamic skin replacement, hot-reloading, and runtime
 * skin management with comprehensive debugging and inspection capabilities.
 */

import { getSkinManager, SkinManager } from './SkinManager';
import { getSkinRegistryManager, SkinRegistryManager } from './SkinRegistry';
import { TS001SkinValidator } from './validation/SkinSchemaValidation';

// ============================================================================
// TYPES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface ComponentSkinBinding {
  componentId: ComponentId;
  name: string;
  description: string;
  version: string;
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  cssClassBase: string;
  dataAttributePrefix: string;
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  supportsPillarSwitching: boolean;
  category: string;
  priority: number;
  tags: string[];
  skinProperties?: Record<string, unknown>;
}

interface SkinState {
  currentPreset: SkinPresetId;
  currentPillar: StyleLabPillar;
  currentMotionLevel: MotionLevel;
  isTransitioning: boolean;
  activeBindings: Record<ComponentId, ComponentSkinBinding>;
  updateCount: number;
  lastUpdated: number;
}

export interface SkinReplacementOptions {
  /** Whether to animate the transition */
  animate?: boolean;
  /** Transition duration in ms */
  transitionDuration?: number;
  /** Whether to validate before replacement */
  validate?: boolean;
  /** Whether to preserve component state */
  preserveState?: boolean;
  /** Custom transition callback */
  onTransitionStart?: () => void;
  /** Custom transition callback */
  onTransitionEnd?: () => void;
  /** Custom error callback */
  onError?: (error: Error) => void;
}

export interface SkinInspectionResult {
  componentId: ComponentId;
  binding: ComponentSkinBinding;
  currentClasses: string[];
  currentAttributes: Record<string, string>;
  currentStyles: Record<string, string>;
  isRegistered: boolean;
  renderCount: number;
  lastUpdate: number;
  validationErrors: string[];
  performanceMetrics: {
    renderTime: number;
    styleGenerationTime: number;
    classGenerationTime: number;
  };
}

export interface HotReloadConfig {
  enabled: boolean;
  watchInterval: number;
  debounceMs: number;
  validateOnReload: boolean;
  preserveComponentState: boolean;
  onReloadStart?: (componentId: ComponentId) => void;
  onReloadComplete?: (componentId: ComponentId, success: boolean) => void;
  onReloadError?: (componentId: ComponentId, error: Error) => void;
}

export interface SkinDebugInfo {
  timestamp: string;
  action: string;
  componentId?: ComponentId;
  presetId?: SkinPresetId;
  pillar?: StyleLabPillar;
  motionLevel?: MotionLevel;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MAIN API CLASS
// ============================================================================

export class SkinReplacementAPI_TS003 {
  private manager: SkinManager;
  private registry: SkinRegistryManager;
  private debugLog: SkinDebugInfo[] = [];
  private hotReloadConfigs: Map<ComponentId, HotReloadConfig> = new Map();
  private inspectionCache: Map<ComponentId, SkinInspectionResult> = new Map();
  private performanceMetrics: Map<string, number> = new Map();

  constructor() {
    this.manager = getSkinManager();
    this.registry = getSkinRegistryManager();
  }

  // ============================================================================
  // BASIC REPLACEMENT OPERATIONS
  // ============================================================================

  /**
   * Replace the current preset with a new one
   */
  async replacePreset(
    presetId: SkinPresetId, 
    options: SkinReplacementOptions = {}
  ): Promise<boolean> {
    const startTime = performance.now();
    const {
      animate = true,
      transitionDuration = 300,
      validate = true,
      preserveState = true,
      onTransitionStart,
      onTransitionEnd,
      onError,
    } = options;

    try {
      // Validate preset if required
      if (validate) {
        const preset = this.manager.getPreset(presetId);
        if (!preset) {
          throw new Error(`Preset not found: ${presetId}`);
        }

        const validation = TS001SkinValidator.validatePreset(preset);
        if (!validation.success) {
          throw new Error(`Preset validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Start transition
      onTransitionStart?.();
      this.logDebug('preset_replace_start', { presetId, animate, transitionDuration });

      // Set transitioning state
      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: true });

      // Apply new preset
      this.manager.setPreset(presetId);

      // Handle animation if requested
      if (animate && transitionDuration > 0) {
        await new Promise(resolve => setTimeout(resolve, transitionDuration));
      }

      // End transition
      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onTransitionEnd?.();

      const duration = performance.now() - startTime;
      this.performanceMetrics.set('preset_replace', duration);
      this.logDebug('preset_replace_complete', { presetId, duration, success: true });

      return true;
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onError?.(err);
      this.logDebug('preset_replace_error', { presetId, duration, success: false, error: err.message });

      return false;
    }
  }

  /**
   * Replace the current pillar
   */
  async replacePillar(
    pillar: StyleLabPillar, 
    options: SkinReplacementOptions = {}
  ): Promise<boolean> {
    const startTime = performance.now();
    const { animate = true, transitionDuration = 200, onTransitionStart, onTransitionEnd, onError } = options;

    try {
      onTransitionStart?.();
      this.logDebug('pillar_replace_start', { pillar, animate, transitionDuration });

      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: true });
      this.manager.setPillar(pillar);

      if (animate && transitionDuration > 0) {
        await new Promise(resolve => setTimeout(resolve, transitionDuration));
      }

      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onTransitionEnd?.();

      const duration = performance.now() - startTime;
      this.performanceMetrics.set('pillar_replace', duration);
      this.logDebug('pillar_replace_complete', { pillar, duration, success: true });

      return true;
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onError?.(err);
      this.logDebug('pillar_replace_error', { pillar, duration, success: false, error: err.message });

      return false;
    }
  }

  /**
   * Replace the current motion level
   */
  async replaceMotionLevel(
    motionLevel: MotionLevel, 
    options: SkinReplacementOptions = {}
  ): Promise<boolean> {
    const startTime = performance.now();
    const { animate = true, transitionDuration = 150, onTransitionStart, onTransitionEnd, onError } = options;

    try {
      onTransitionStart?.();
      this.logDebug('motion_replace_start', { motionLevel, animate, transitionDuration });

      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: true });
      this.manager.setMotionLevel(motionLevel);

      if (animate && transitionDuration > 0) {
        await new Promise(resolve => setTimeout(resolve, transitionDuration));
      }

      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onTransitionEnd?.();

      const duration = performance.now() - startTime;
      this.performanceMetrics.set('motion_replace', duration);
      this.logDebug('motion_replace_complete', { motionLevel, duration, success: true });

      return true;
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onError?.(err);
      this.logDebug('motion_replace_error', { motionLevel, duration, success: false, error: err.message });

      return false;
    }
  }

  /**
   * Replace all skin settings at once
   */
  async replaceAll(
    presetId: SkinPresetId,
    pillar: StyleLabPillar,
    motionLevel: MotionLevel,
    options: SkinReplacementOptions = {}
  ): Promise<boolean> {
    const startTime = performance.now();
    const { animate = true, transitionDuration = 300, onTransitionStart, onTransitionEnd, onError } = options;

    try {
      onTransitionStart?.();
      this.logDebug('all_replace_start', { presetId, pillar, motionLevel, animate, transitionDuration });

      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: true });

      // Apply all changes
      await Promise.all([
        this.replacePreset(presetId, { animate: false, validate: true }),
        this.replacePillar(pillar, { animate: false }),
        this.replaceMotionLevel(motionLevel, { animate: false }),
      ]);

      // Handle final animation
      if (animate && transitionDuration > 0) {
        await new Promise(resolve => setTimeout(resolve, transitionDuration));
      }

      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onTransitionEnd?.();

      const duration = performance.now() - startTime;
      this.performanceMetrics.set('all_replace', duration);
      this.logDebug('all_replace_complete', { presetId, pillar, motionLevel, duration, success: true });

      return true;
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: false });
      onError?.(err);
      this.logDebug('all_replace_error', { presetId, pillar, motionLevel, duration, success: false, error: err.message });

      return false;
    }
  }

  // ============================================================================
  // HOT RELOADING
  // ============================================================================

  /**
   * Enable hot reloading for a component
   */
  enableHotReload(componentId: ComponentId, config: HotReloadConfig): void {
    this.hotReloadConfigs.set(componentId, config);
    this.logDebug('hot_reload_enabled', { componentId, config });
  }

  /**
   * Disable hot reloading for a component
   */
  disableHotReload(componentId: ComponentId): void {
    this.hotReloadConfigs.delete(componentId);
    this.logDebug('hot_reload_disabled', { componentId });
  }

  /**
   * Hot reload a specific component
   */
  async hotReloadComponent(componentId: ComponentId): Promise<boolean> {
    const config = this.hotReloadConfigs.get(componentId);
    if (!config || !config.enabled) {
      return false;
    }

    const startTime = performance.now();
    config.onReloadStart?.(componentId);

    try {
      // Get current binding
      const binding = this.manager.getComponentBinding(componentId);
      if (!binding) {
        throw new Error(`Component not found: ${componentId}`);
      }

      // Validate if required
      if (config.validateOnReload) {
        const validation = TS001SkinValidator.validateBinding(binding);
        if (!validation.success) {
          throw new Error(`Binding validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Unregister and re-register
      this.manager.unregisterComponent(componentId);
      
      if (config.debounceMs > 0) {
        await new Promise(resolve => setTimeout(resolve, config.debounceMs));
      }

      this.manager.registerComponent(binding);

      const duration = performance.now() - startTime;
      this.performanceMetrics.set(`hot_reload_${componentId}`, duration);
      config.onReloadComplete?.(componentId, true);
      this.logDebug('hot_reload_complete', { componentId, duration, success: true });

      return true;
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      config.onReloadError?.(componentId, err);
      this.logDebug('hot_reload_error', { componentId, duration, success: false, error: err.message });

      return false;
    }
  }

  /**
   * Start hot reload watcher for all enabled components
   */
  startHotReloadWatcher(): void {
    const watchInterval = Math.min(...Array.from(this.hotReloadConfigs.values())
      .filter(config => config.enabled)
      .map(config => config.watchInterval));

    if (watchInterval > 0) {
      setInterval(() => {
        for (const [componentId, config] of this.hotReloadConfigs.entries()) {
          if (config.enabled) {
            this.hotReloadComponent(componentId);
          }
        }
      }, watchInterval);

      this.logDebug('hot_reload_watcher_started', { watchInterval });
    }
  }

  // ============================================================================
  // INSPECTION AND DEBUGGING
  // ============================================================================

  /**
   * Inspect a component's current skin state
   */
  inspectComponent(componentId: ComponentId): SkinInspectionResult | null {
    // Check cache first
    const cached = this.inspectionCache.get(componentId);
    if (cached && Date.now() - cached.lastUpdate < 1000) { // 1 second cache
      return cached;
    }

    const startTime = performance.now();

    try {
      const binding = this.manager.getComponentBinding(componentId);
      if (!binding) {
        return null;
      }

      const styleGenStart = performance.now();
      const currentStyles = this.manager.generateStyles?.(componentId) || {};
      const styleGenTime = performance.now() - styleGenStart;

      const classGenStart = performance.now();
      const currentClasses = this.manager.generateClasses?.(componentId) || [];
      const classGenTime = performance.now() - classGenStart;

      const attrGenStart = performance.now();
      const currentAttributes = this.manager.generateAttributes?.(componentId) || {};
      const attrGenTime = performance.now() - attrGenStart;

      // Validate component
      const validation = TS001SkinValidator.validateBinding(binding);
      const validationErrors = validation.success ? [] : validation.errors.map(e => e.message);

      const result: SkinInspectionResult = {
        componentId,
        binding,
        currentClasses,
        currentAttributes,
        currentStyles,
        isRegistered: true,
        renderCount: this.manager.getState().updateCount,
        lastUpdate: Date.now(),
        validationErrors,
        performanceMetrics: {
          renderTime: performance.now() - startTime,
          styleGenerationTime: styleGenTime,
          classGenerationTime: classGenTime,
        },
      };

      // Cache result
      this.inspectionCache.set(componentId, result);

      return result;
    } catch (error) {
      this.logDebug('inspection_error', { componentId, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  /**
   * Get all registered components with their inspection data
   */
  inspectAllComponents(): SkinInspectionResult[] {
    const state = this.manager.getState();
    const results: SkinInspectionResult[] = [];

    for (const componentId of Object.keys(state.activeBindings)) {
      const inspection = this.inspectComponent(componentId);
      if (inspection) {
        results.push(inspection);
      }
    }

    return results;
  }

  /**
   * Get system performance metrics
   */
  getPerformanceMetrics(): Record<string, number> {
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Get debug log
   */
  getDebugLog(limit?: number): SkinDebugInfo[] {
    const log = [...this.debugLog].reverse();
    return limit ? log.slice(0, limit) : log;
  }

  /**
   * Clear debug log
   */
  clearDebugLog(): void {
    this.debugLog = [];
  }

  /**
   * Export current skin state
   */
  exportSkinState(): string {
    const state = this.manager.getState();
    const exportData = {
      timestamp: new Date().toISOString(),
      state,
      components: this.inspectAllComponents(),
      performanceMetrics: this.getPerformanceMetrics(),
      hotReloadConfigs: Object.fromEntries(this.hotReloadConfigs),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import skin state
   */
  async importSkinState(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.state) {
        throw new Error('Invalid skin state data');
      }

      // Apply state
      await this.replaceAll(
        data.state.currentPreset,
        data.state.currentPillar,
        data.state.currentMotionLevel,
        { animate: false, validate: true }
      );

      this.logDebug('state_imported', { success: true });
      return true;
    } catch (error) {
      this.logDebug('state_import_error', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private logDebug(action: string, metadata: Record<string, unknown> = {}): void {
    const debugInfo: SkinDebugInfo = {
      timestamp: new Date().toISOString(),
      action,
      success: true,
      metadata,
    };

    this.debugLog.push(debugInfo);

    // Keep log size manageable
    if (this.debugLog.length > 1000) {
      this.debugLog = this.debugLog.slice(-500);
    }
  }

  /**
   * Get current skin state
   */
  getCurrentState(): SkinState {
    return this.manager.getState();
  }

  /**
   * Get available presets
   */
  getAvailablePresets(): SkinPresetId[] {
    return this.manager.getAllPresets().map(p => p.id);
  }

  /**
   * Get available pillars
   */
  getAvailablePillars(): StyleLabPillar[] {
    return ['frontier', 'wilderness', 'empire'];
  }

  /**
   * Get available motion levels
   */
  getAvailableMotionLevels(): MotionLevel[] {
    return ['minimal', 'reduced', 'full'];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let apiInstance: SkinReplacementAPI_TS003 | null = null;

export function getSkinReplacementAPI_TS003(): SkinReplacementAPI_TS003 {
  if (!apiInstance) {
    apiInstance = new SkinReplacementAPI_TS003();
  }
  return apiInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SkinReplacementAPI_TS003;
