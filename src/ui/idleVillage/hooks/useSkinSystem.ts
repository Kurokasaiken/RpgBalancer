/**
 * useSkinSystem Hook
 * 
 * Main React hook for accessing the skin system.
 * Provides access to skin manager, state, and basic operations.
 */

import { useLayoutEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createContext, useContext, ReactNode } from 'react';
import React from 'react';
import { DEFAULT_COMPONENT_SKIN_PRESET } from '../skins/SkinManager';

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'base' | 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory' | 'neon-cyber' | 'shadow-realm';

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

interface SkinSystemConfig {
  enableTelemetry: boolean;
  enableTransitions: boolean;
  defaultPreset: SkinPresetId;
  defaultPillar: StyleLabPillar;
  defaultMotionLevel: MotionLevel;
}

interface SkinPresetConfig {
  id: SkinPresetId;
  name: string;
  description: string;
  category: string;
  colors: Record<string, string>;
  animations: Record<string, any>;
  components: Record<string, any>;
}
import { getSkinManager, SkinManager } from '../skins/SkinManager';

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseSkinSystemOptions {
  /**
   * Custom configuration for the skin manager
   */
  config?: Partial<SkinSystemConfig>;
  
  /**
   * Whether to enable automatic state updates
   * @default true
   */
  enableAutoUpdate?: boolean;
  
  /**
   * Debounce time for state updates (ms)
   * @default 100
   */
  updateDebounceMs?: number;
}

export interface UseSkinSystemReturn {
  // Current state
  state: SkinState;
  
  // Basic operations
  setPreset: (presetId: SkinPresetId) => void;
  setPillar: (pillar: StyleLabPillar) => void;
  setMotionLevel: (motionLevel: MotionLevel) => void;
  resetState: () => void;
  
  // Preset management
  getPreset: (presetId: SkinPresetId) => SkinPresetConfig | undefined;
  getAllPresets: () => SkinPresetConfig[];
  
  // Component management
  registerComponent: (binding: ComponentSkinBinding) => void;
  unregisterComponent: (componentId: string) => void;
  getComponentBinding: (componentId: string) => ComponentSkinBinding | undefined;
  
  // Style generation
  generateClasses: (componentId: string) => string[];
  generateAttributes: (componentId: string) => Record<string, string>;
  generateStyles: (componentId: string) => Record<string, string>;
  
  // Validation
  validateState: () => { isValid: boolean; errors: any[]; warnings: any[] };
  validateTransition: (presetId: SkinPresetId, pillar: StyleLabPillar) => { isValid: boolean; errors: any[]; warnings: any[] };
  
  // Utilities
  isTransitioning: boolean;
  hasComponent: (componentId: string) => boolean;
  
  // Manager access (advanced usage)
  manager: SkinManager;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSkinSystem(options: UseSkinSystemOptions = {}): UseSkinSystemReturn {
  const {
    config,
    enableAutoUpdate = true,
    updateDebounceMs = 100,
  } = options;

  // Get or create skin manager instance
  const managerRef = useRef<SkinManager>();
  const [manager, setManager] = useState<SkinManager | null>(null);
  
  // State management - must be called before any conditional returns
  const [state, setState] = useState<SkinState>(() => {
    // Default state while manager initializes
    return {
      currentPreset: DEFAULT_COMPONENT_SKIN_PRESET,
      currentPillar: 'frontier' as StyleLabPillar,
      currentMotionLevel: 'full' as MotionLevel,
      isTransitioning: false,
      activeBindings: {},
      updateCount: 0,
      lastUpdated: Date.now(),
    };
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debounce timer for state updates
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Initialize manager
  useLayoutEffect(() => {
    if (!managerRef.current) {
      managerRef.current = getSkinManager(config);
      setManager(managerRef.current);
      // Initialize state with manager state
      setState(managerRef.current.getState());
    }
  }, [config]);

  // Update state from manager
  const updateState = useCallback(() => {
    if (managerRef.current) {
      const newState = managerRef.current.getState();
      setState(newState);
      setIsTransitioning(newState.isTransitioning);
    }
  }, []);

  // Debounced state update
  const debouncedUpdateState = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      updateState();
    }, updateDebounceMs);
  }, [updateState, updateDebounceMs]);

  // Subscribe to manager changes
  useLayoutEffect(() => {
    if (!enableAutoUpdate || !managerRef.current) {
      return;
    }

    const unsubscribe = managerRef.current.subscribe(() => {
      if (enableAutoUpdate) {
        debouncedUpdateState();
      }
    });

    // Initial state sync
    updateState();

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enableAutoUpdate, updateState, debouncedUpdateState]);

  // Basic operations
  const setPreset = useCallback((presetId: SkinPresetId) => {
    if (managerRef.current) {
      managerRef.current.setPreset(presetId);
    }
  }, []);

  const setPillar = useCallback((pillar: StyleLabPillar) => {
    if (managerRef.current) {
      managerRef.current.setPillar(pillar);
    }
  }, []);

  const setMotionLevel = useCallback((motionLevel: MotionLevel) => {
    if (managerRef.current) {
      managerRef.current.setMotionLevel(motionLevel);
    }
  }, []);

  const resetState = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.resetState();
    }
  }, []);

  const validateState = useCallback((stateToValidate?: Partial<SkinState>) => {
    return managerRef.current?.validateState(stateToValidate) ?? { isValid: true, errors: [], warnings: [] };
  }, []);

  const validateTransition = useCallback((presetId: SkinPresetId, pillar: StyleLabPillar) => {
    return managerRef.current?.validateTransition(presetId, pillar) ?? { isValid: true, errors: [], warnings: [] };
  }, []);

  const getPreset = useCallback((presetId: SkinPresetId) => {
    return managerRef.current?.getPreset(presetId);
  }, []);

  const getAllPresets = useCallback(() => {
    return managerRef.current?.getAllPresets() ?? [];
  }, []);

  // Component binding helpers
  const hasComponent = useCallback((componentId: string) => {
    return managerRef.current?.hasComponent(componentId) ?? false;
  }, []);

  const getComponentBinding = useCallback((componentId: string) => {
    return managerRef.current?.getComponentBinding(componentId);
  }, []);

  const registerComponent = useCallback((binding: ComponentSkinBinding) => {
    managerRef.current?.registerComponent(binding);
  }, []);

  const unregisterComponent = useCallback((componentId: string) => {
    managerRef.current?.unregisterComponent(componentId);
  }, []);

  // Generate classes, attributes, and styles for a component
  const generateClasses = useCallback((componentId: string) => {
    return managerRef.current?.generateClasses(componentId) ?? [];
  }, []);

  const generateAttributes = useCallback((componentId: string) => {
    return managerRef.current?.generateAttributes(componentId) ?? {};
  }, []);

  const generateStyles = useCallback((componentId: string) => {
    return managerRef.current?.generateStyles(componentId) ?? {};
  }, []);

  // Return memoized object
  return useMemo(() => ({
    state,
    setPreset,
    setPillar,
    setMotionLevel,
    resetState,
    validateState,
    validateTransition,
    getPreset,
    getAllPresets,
    hasComponent,
    getComponentBinding,
    registerComponent,
    unregisterComponent,
    generateClasses,
    generateAttributes,
    generateStyles,
  }), [
    state,
    setPreset,
    setPillar,
    setMotionLevel,
    resetState,
    validateState,
    validateTransition,
    getPreset,
    getAllPresets,
    hasComponent,
    getComponentBinding,
    registerComponent,
    unregisterComponent,
    generateClasses,
    generateAttributes,
    generateStyles,
  ]);
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for accessing current skin configuration
 */
export function useSkinConfig() {
  const { state, getPreset } = useSkinSystem();
  
  return useMemo(() => {
    const currentPreset = getPreset(state.currentPreset);
    return {
      presetId: state.currentPreset,
      pillar: state.currentPillar,
      motionLevel: state.currentMotionLevel,
      preset: currentPreset,
      isTransitioning: state.isTransitioning,
    };
  }, [state, getPreset]);
}

/**
 * Hook for accessing skin operations only
 */
export function useSkinOperations() {
  const { setPreset, setPillar, setMotionLevel, resetState } = useSkinSystem();
  
  return useMemo(() => ({
    setPreset,
    setPillar,
    setMotionLevel,
    resetState,
  }), [setPreset, setPillar, setMotionLevel, resetState]);
}

/**
 * Hook for accessing skin validation
 */
export function useSkinValidation() {
  const { validateState, validateTransition } = useSkinSystem();
  
  return useMemo(() => ({
    validateState,
    validateTransition,
  }), [validateState, validateTransition]);
}

/**
 * Hook for checking if a component is registered
 */
export function useSkinComponent(componentId: string) {
  const { hasComponent, getComponentBinding, generateClasses, generateAttributes, generateStyles } = useSkinSystem();
  
  return useMemo(() => ({
    isRegistered: hasComponent(componentId),
    binding: getComponentBinding(componentId),
    classes: generateClasses(componentId),
    attributes: generateAttributes(componentId),
    styles: generateStyles(componentId),
  }), [componentId, hasComponent, getComponentBinding, generateClasses, generateAttributes, generateStyles]);
}

// ============================================================================
// CONTEXT PROVIDER
// ============================================================================

interface SkinSystemContextValue {
  system: UseSkinSystemReturn;
}

const SkinSystemContext = createContext<SkinSystemContextValue | null>(null);

export interface SkinSystemProviderProps {
  children: ReactNode;
  options?: UseSkinSystemOptions;
}

/**
 * Context provider for skin system
 */
export function SkinSystemProvider({ children, options }: SkinSystemProviderProps): React.ReactElement {
  const system = useSkinSystem(options);
  
  const value = useMemo(() => ({ system }), [system]);
  
  return React.createElement(
    SkinSystemContext.Provider,
    { value },
    children
  );
}

/**
 * Hook for accessing skin system from context
 */
export function useSkinSystemContext(): UseSkinSystemReturn {
  const context = useContext(SkinSystemContext);

  if (!context) {
    throw new Error('useSkinSystemContext must be used within a SkinSystemProvider');
  }

  return context.system;
}

/**
 * Non-throwing variant: returns null when no SkinSystemProvider is mounted.
 * Used by the frozen KitShell to auto-mount only the providers that are missing.
 */
export function useOptionalSkinSystemContext(): UseSkinSystemReturn | null {
  const context = useContext(SkinSystemContext);
  return context?.system ?? null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a preset is available
 */
export function useIsPresetAvailable(presetId: SkinPresetId): boolean {
  const { getPreset } = useSkinSystem();
  
  return useMemo(() => {
    return getPreset(presetId) !== undefined;
  }, [getPreset, presetId]);
}

/**
 * Check if a pillar is supported by current preset
 */
export function useIsPillarSupported(pillar: StyleLabPillar): boolean {
  const { state, getPreset } = useSkinSystem();
  
  return useMemo(() => {
    const preset = getPreset(state.currentPreset);
    return preset?.supportedPillars.includes(pillar) ?? false;
  }, [state, getPreset, pillar]);
}

/**
 * Check if a motion level is supported by current preset
 */
export function useIsMotionLevelSupported(motionLevel: MotionLevel): boolean {
  const { state, getPreset } = useSkinSystem();
  
  return useMemo(() => {
    const preset = getPreset(state.currentPreset);
    return preset?.supportedMotionLevels.includes(motionLevel) ?? false;
  }, [state, getPreset, motionLevel]);
}

/**
 * Get available presets for current pillar
 */
export function useAvailablePresetsForPillar(pillar: StyleLabPillar): SkinPresetConfig[] {
  const { getAllPresets } = useSkinSystem();
  
  return useMemo(() => {
    const allPresets = getAllPresets();
    return allPresets.filter(preset => preset.supportedPillars.includes(pillar));
  }, [getAllPresets, pillar]);
}

/**
 * Get supported pillars for current preset
 */
export function useSupportedPillars(): StyleLabPillar[] {
  const { state, getPreset } = useSkinSystem();
  
  return useMemo(() => {
    const preset = getPreset(state.currentPreset);
    return preset?.supportedPillars ?? [];
  }, [state, getPreset]);
}

/**
 * Get supported motion levels for current preset
 */
export function useSupportedMotionLevels(): MotionLevel[] {
  const { state, getPreset } = useSkinSystem();
  
  const preset = getPreset(state.currentPreset);
  return useMemo(() => preset?.supportedMotionLevels ?? [], [state.currentPreset, preset]);
}

// ============================================================================
// DEV TOOLS
// ============================================================================

/**
 * Hook for development tools and debugging
 */
export function useSkinDevTools() {
  const { state, manager, validateState } = useSkinSystem();
  
  // Only expose in development
  if (process.env.NODE_ENV !== 'development') {
    return {
      isDevMode: false,
      debugInfo: null,
    };
  }
  
  const debugInfo = useMemo(() => {
    return {
      currentState: state,
      managerInstance: manager,
      validation: validateState(),
      statistics: {
        componentCount: Object.keys(state.activeBindings).length,
        updateCount: state.updateCount,
        lastUpdated: state.lastUpdated,
      },
    };
  }, [state, manager, validateState]);
  
  return {
    isDevMode: true,
    debugInfo,
  };
}

/**
 * Hook for skin system performance monitoring
 */
export function useSkinPerformance() {
  const { state } = useSkinSystem();
  
  return useMemo(() => {
    return {
      componentCount: Object.keys(state.activeBindings).length,
      updateCount: state.updateCount,
      lastUpdated: state.lastUpdated,
      isTransitioning: state.isTransitioning,
      computedValues: {
        classesCount: Object.keys(state.computedClasses).length,
        attributesCount: Object.keys(state.computedAttributes).length,
        stylesCount: Object.keys(state.computedStyles).length,
      },
    };
  }, [state]);
}
