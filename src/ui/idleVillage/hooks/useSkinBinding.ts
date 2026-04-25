/**
 * useSkinBinding Hook
 * 
 * Hook for integrating components with the skin binding system.
 * Provides automatic registration, style generation, and lifecycle management.
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';

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
import { useSkinSystem } from './useSkinSystem';

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseSkinBindingOptions {
  /**
   * Whether to automatically register the component
   * @default true
   */
  autoRegister?: boolean;
  
  /**
   * Whether to automatically unregister on unmount
   * @default true
   */
  autoUnregister?: boolean;
  
  /**
   * Custom properties for the component
   */
  properties?: Record<string, any>;
  
  /**
   * Override the component ID (defaults to binding.componentId)
   */
  componentId?: string;
  
  /**
   * Callback when skin changes
   */
  onSkinChange?: (skinData: SkinBindingData) => void;
  
  /**
   * Whether to generate styles automatically
   * @default true
   */
  generateStyles?: boolean;
  
  /**
   * Whether to generate attributes automatically
   * @default true
   */
  generateAttributes?: boolean;
  
  /**
   * Whether to generate classes automatically
   * @default true
   */
  generateClasses?: boolean;
}

export interface SkinBindingData {
  // Current skin state
  presetId: SkinPresetId;
  pillar: StyleLabPillar;
  motionLevel: MotionLevel;
  
  // Generated values
  classes: string[];
  attributes: Record<string, string>;
  styles: Record<string, string>;
  
  // Component info
  componentId: string;
  binding: ComponentSkinBinding;
  
  // Status
  isRegistered: boolean;
  isTransitioning: boolean;
  
  // Custom properties
  properties?: Record<string, any>;
}

export interface UseSkinBindingReturn {
  // Skin data
  skinData: SkinBindingData;
  
  // Generated values
  classes: string[];
  attributes: Record<string, string>;
  styles: Record<string, string>;
  
  // Status
  isRegistered: boolean;
  isTransitioning: boolean;
  
  // Operations
  updateProperties: (properties: Record<string, any>) => void;
  unregister: () => void;
  
  // Utilities
  hasClass: (className: string) => boolean;
  getAttribute: (name: string) => string | undefined;
  getStyle: (property: string) => string | undefined;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSkinBinding(
  binding: ComponentSkinBinding,
  options: UseSkinBindingOptions = {}
): UseSkinBindingReturn {
  const {
    autoRegister = true,
    autoUnregister = true,
    properties: initialProperties = {},
    componentId: overrideComponentId,
    onSkinChange,
    generateStyles = true,
    generateAttributes = true,
    generateClasses = true,
  } = options;

  const componentId = overrideComponentId || binding.componentId;
  
  // Get skin system
  const {
    state,
    registerComponent,
    unregisterComponent,
    generateClasses: genClasses,
    generateAttributes: genAttributes,
    generateStyles: genStyles,
    isTransitioning,
  } = useSkinSystem();

  // Refs for tracking
  const isRegisteredRef = useRef(false);
  const propertiesRef = useRef<Record<string, any>>(initialProperties);
  const lastSkinDataRef = useRef<SkinBindingData | null>(null);

  // Enhanced binding with properties
  const enhancedBinding = useMemo(() => {
    if (Object.keys(initialProperties).length === 0) {
      return binding;
    }
    
    return {
      ...binding,
      skinProperties: {
        ...binding.skinProperties,
        ...initialProperties,
      },
    };
  }, [binding, initialProperties]);

  // Register component
  useEffect(() => {
    if (autoRegister && !isRegisteredRef.current && registerComponent) {
      try {
        registerComponent(enhancedBinding);
        isRegisteredRef.current = true;
      } catch (error) {
        console.error(`Failed to register component ${componentId}:`, error);
      }
    }
  }, [autoRegister, enhancedBinding, registerComponent]);

  // Unregister component on unmount
  useEffect(() => {
    return () => {
      if (autoUnregister && isRegisteredRef.current) {
        unregisterComponent(componentId);
        isRegisteredRef.current = false;
      }
    };
  }, [autoUnregister, componentId, unregisterComponent]);

  // Generate skin data
  const skinData = useMemo(() => {
    // Safety check - if manager is not ready, return empty values
    if (!genClasses || !genAttributes || !genStyles) {
      return {
        presetId: 'minimal-frontier' as SkinPresetId,
        pillar: 'frontier' as StyleLabPillar,
        motionLevel: 'full' as MotionLevel,
        classes: [],
        attributes: {},
        styles: {},
        componentId,
        binding: enhancedBinding,
        isRegistered: false,
        isTransitioning: false,
      };
    }
    
    const classes = genClasses(componentId);
    const attributes = genAttributes(componentId);
    const styles = genStyles(componentId);

    const data: SkinBindingData = {
      presetId: state.currentPreset,
      pillar: state.currentPillar,
      motionLevel: state.currentMotionLevel,
      classes,
      attributes,
      styles,
      componentId,
      binding: enhancedBinding,
      isRegistered: isRegisteredRef.current,
      isTransitioning: state.isTransitioning,
      properties: propertiesRef.current,
    };

    return data;
  }, [
    state,
    componentId,
    enhancedBinding,
    genClasses,
    genAttributes,
    genStyles,
    generateClasses,
    generateAttributes,
    generateStyles,
  ]);

  // Call onSkinChange when skin data changes
  useEffect(() => {
    if (onSkinChange) {
      const hasChanged = !lastSkinDataRef.current || 
        JSON.stringify(lastSkinDataRef.current) !== JSON.stringify(skinData);
      
      if (hasChanged) {
        onSkinChange(skinData);
        lastSkinDataRef.current = skinData;
      }
    }
  }, [skinData, onSkinChange]);

  // Update properties
  const updateProperties = useCallback((newProperties: Record<string, any>) => {
    propertiesRef.current = { ...propertiesRef.current, ...newProperties };
    
    // Re-register with updated properties
    if (isRegisteredRef.current) {
      const updatedBinding = {
        ...binding,
        skinProperties: {
          ...binding.skinProperties,
          ...propertiesRef.current,
        },
      };
      registerComponent(updatedBinding);
    }
  }, [binding, registerComponent]);

  // Unregister manually
  const unregister = useCallback(() => {
    if (isRegisteredRef.current) {
      unregisterComponent(componentId);
      isRegisteredRef.current = false;
    }
  }, [componentId, unregisterComponent]);

  // Utility functions
  const hasClass = useCallback((className: string) => {
    return skinData.classes.includes(className);
  }, [skinData.classes]);

  const getAttribute = useCallback((name: string) => {
    return skinData.attributes[name];
  }, [skinData.attributes]);

  const getStyle = useCallback((property: string) => {
    return skinData.styles[property];
  }, [skinData.styles]);

  return useMemo(() => ({
    skinData,
    classes: skinData.classes,
    attributes: skinData.attributes,
    styles: skinData.styles,
    isRegistered: skinData.isRegistered,
    isTransitioning: skinData.isTransitioning,
    updateProperties,
    unregister,
    hasClass,
    getAttribute,
    getStyle,
  }), [
    skinData,
    updateProperties,
    unregister,
    hasClass,
    getAttribute,
    getStyle,
  ]);
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for simple skin binding with just component ID and class base
 */
export function useSimpleSkinBinding(
  componentId: string,
  cssClassBase: string,
  options: Omit<UseSkinBindingOptions, 'componentId'> = {}
): UseSkinBindingReturn {
  const binding: ComponentSkinBinding = useMemo(() => ({
    componentId,
    name: componentId,
    description: `Simple binding for ${componentId}`,
    version: '1.0.0',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    cssClassBase,
    dataAttributePrefix: componentId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    supportsMotionLevel: true,
    supportsTelemetry: true,
    supportsPillarSwitching: true,
    requiredProperties: [],
    optionalProperties: [],
    category: 'ui',
    priority: 1,
    tags: ['simple'],
  }), [componentId, cssClassBase]);

  return useSkinBinding(binding, options);
}

/**
 * Hook for skin binding with preset override
 */
export function useSkinBindingWithPreset(
  binding: ComponentSkinBinding,
  presetId: SkinPresetId,
  options: UseSkinBindingOptions = {}
): UseSkinBindingReturn {
  const { setPreset } = useSkinSystem();
  
  // Set preset when component mounts
  useEffect(() => {
    setPreset(presetId);
  }, [presetId, setPreset]);

  return useSkinBinding(binding, options);
}

/**
 * Hook for skin binding with pillar override
 */
export function useSkinBindingWithPillar(
  binding: ComponentSkinBinding,
  pillar: StyleLabPillar,
  options: UseSkinBindingOptions = {}
): UseSkinBindingReturn {
  const { setPillar } = useSkinSystem();
  
  // Set pillar when component mounts
  useEffect(() => {
    setPillar(pillar);
  }, [pillar, setPillar]);

  return useSkinBinding(binding, options);
}

/**
 * Hook for skin binding with motion level override
 */
export function useSkinBindingWithMotion(
  binding: ComponentSkinBinding,
  motionLevel: MotionLevel,
  options: UseSkinBindingOptions = {}
): UseSkinBindingReturn {
  const { setMotionLevel } = useSkinSystem();
  
  // Set motion level when component mounts
  useEffect(() => {
    setMotionLevel(motionLevel);
  }, [motionLevel, setMotionLevel]);

  return useSkinBinding(binding, options);
}

/**
 * Hook for conditional skin binding
 */
export function useConditionalSkinBinding(
  binding: ComponentSkinBinding,
  condition: boolean,
  options: UseSkinBindingOptions = {}
): UseSkinBindingReturn | null {
  const skinBinding = useSkinBinding(binding, {
    ...options,
    autoRegister: condition && options.autoRegister,
  });

  return condition ? skinBinding : null;
}

/**
 * Hook for dynamic skin binding (binding can change)
 */
export function useDynamicSkinBinding(
  binding: ComponentSkinBinding | null,
  options: UseSkinBindingOptions = {}
): UseSkinBindingReturn | null {
  const skinBinding = useSkinBinding(
    binding || {
      componentId: 'dummy',
      name: 'Dummy',
      description: 'Dummy binding',
      version: '1.0.0',
      defaultPreset: 'minimal-frontier',
      supportedPillars: ['frontier'],
      supportedMotionLevels: ['full'],
      cssClassBase: 'dummy',
      dataAttributePrefix: 'dummy',
      supportsMotionLevel: false,
      supportsTelemetry: false,
      supportsPillarSwitching: false,
      requiredProperties: [],
      optionalProperties: [],
      category: 'ui',
      priority: 999,
      tags: [],
    },
    {
      ...options,
      autoRegister: !!binding && options.autoRegister,
    }
  );

  return binding ? skinBinding : null;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for checking if a component supports a feature
 */
export function useSkinFeatureSupport(
  binding: ComponentSkinBinding,
  feature: 'motionLevel' | 'telemetry' | 'pillarSwitching'
): boolean {
  return useMemo(() => {
    switch (feature) {
      case 'motionLevel':
        return binding.supportsMotionLevel;
      case 'telemetry':
        return binding.supportsTelemetry;
      case 'pillarSwitching':
        return binding.supportsPillarSwitching;
      default:
        return false;
    }
  }, [binding]);
}

/**
 * Hook for getting component's supported pillars
 */
export function useSkinSupportedPillars(binding: ComponentSkinBinding): StyleLabPillar[] {
  return useMemo(() => {
    return binding.supportedPillars;
  }, [binding]);
}

/**
 * Hook for getting component's supported motion levels
 */
export function useSkinSupportedMotionLevels(binding: ComponentSkinBinding): MotionLevel[] {
  return useMemo(() => {
    return binding.supportedMotionLevels;
  }, [binding]);
}

/**
 * Hook for checking if component supports current pillar
 */
export function useSkinSupportsCurrentPillar(binding: ComponentSkinBinding): boolean {
  const { state } = useSkinSystem();
  
  return useMemo(() => {
    return binding.supportedPillars.includes(state.currentPillar);
  }, [binding, state]);
}

/**
 * Hook for checking if component supports current motion level
 */
export function useSkinSupportsCurrentMotion(binding: ComponentSkinBinding): boolean {
  const { state } = useSkinSystem();
  
  return useMemo(() => {
    return binding.supportedMotionLevels.includes(state.currentMotionLevel);
  }, [binding, state]);
}

// ============================================================================
// HOOK FOR INTEGRATION WITH EXISTING useSkinHarness
// ============================================================================

/**
 * Hook for bridging new skin system with existing useSkinHarness
 */
export function useSkinHarnessBridge(
  binding: ComponentSkinBinding,
  options: UseSkinBindingOptions = {}
) {
  const skinBinding = useSkinBinding(binding, options);
  
  // Bridge to useSkinHarness format
  const harnessData = useMemo(() => {
    return {
      // Existing useSkinHarness properties
      preset: skinBinding.skinData.presetId,
      pillar: skinBinding.skinData.pillar,
      motionLevel: skinBinding.skinData.motionLevel,
      
      // New properties from skin binding
      classes: skinBinding.classes,
      attributes: skinBinding.attributes,
      styles: skinBinding.styles,
      componentId: skinBinding.skinData.componentId,
      
      // Status
      isTransitioning: skinBinding.isTransitioning,
      isRegistered: skinBinding.isRegistered,
    };
  }, [skinBinding]);

  return {
    ...skinBinding,
    harnessData,
  };
}

/**
 * Hook for migrating from useSkinHarness to new system
 */
export function useSkinMigration(
  oldHookData: any, // Data from existing useSkinHarness
  binding: ComponentSkinBinding,
  options: UseSkinBindingOptions = {}
) {
  const skinBinding = useSkinBinding(binding, options);
  
  // Migration utilities
  const migrateProperties = useCallback((oldProperties: Record<string, any>) => {
    skinBinding.updateProperties(oldProperties);
  }, [skinBinding]);

  const getMigratedData = useCallback(() => {
    return {
      // Keep old format for compatibility
      ...oldHookData,
      
      // Add new capabilities
      classes: skinBinding.classes,
      attributes: skinBinding.attributes,
      styles: skinBinding.styles,
      isRegistered: skinBinding.isRegistered,
    };
  }, [oldHookData, skinBinding]);

  return {
    ...skinBinding,
    migrateProperties,
    getMigratedData,
  };
}
