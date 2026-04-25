/**
 * TS-002: useSkinSlot Hook
 * 
 * Advanced hook for skin slot integration with automatic registration,
 * style generation, and lifecycle management. Provides a clean API
 * for components to integrate with the skin system.
 */

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useSkinSystem } from './useSkinSystem';

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

export interface UseSkinSlotOptions {
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
   * Whether to enable real-time style updates
   * @default true
   */
  enableLiveUpdates?: boolean;
  
  /**
   * Whether to generate CSS classes
   * @default true
   */
  generateClasses?: boolean;
  
  /**
   * Whether to generate CSS attributes
   * @default true
   */
  generateAttributes?: boolean;
  
  /**
   * Whether to generate inline styles
   * @default false
   */
  generateStyles?: boolean;
  
  /**
   * Custom skin properties to merge with binding
   */
  skinProperties?: Record<string, unknown>;
  
  /**
   * Callback for style generation errors
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback for successful registration
   */
  onRegistered?: (componentId: ComponentId) => void;
  
  /**
   * Callback for successful unregistration
   */
  onUnregistered?: (componentId: ComponentId) => void;
}

export interface UseSkinSlotResult {
  // Generated styles
  classes: string[];
  attributes: Record<string, string>;
  styles: Record<string, string>;
  
  // CSS class string for convenience
  className: string;
  
  // Registration state
  isRegistered: boolean;
  isTransitioning: boolean;
  
  // Current skin context
  currentPreset: SkinPresetId;
  currentPillar: StyleLabPillar;
  currentMotionLevel: MotionLevel;
  
  // Control functions
  register: () => void;
  unregister: () => void;
  updateProperties: (properties: Record<string, unknown>) => void;
  
  // Utility functions
  hasClass: (className: string) => boolean;
  getAttribute: (name: string) => string | undefined;
  setAttribute: (name: string, value: string) => void;
  
  // Performance metrics
  renderCount: number;
  lastUpdate: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSkinSlot(
  componentId: ComponentId,
  binding: ComponentSkinBinding,
  options: UseSkinSlotOptions = {}
): UseSkinSlotResult {
  const {
    autoRegister = true,
    autoUnregister = true,
    enableLiveUpdates = true,
    generateClasses = true,
    generateAttributes = true,
    generateStyles = false,
    skinProperties = {},
    onError,
    onRegistered,
    onUnregistered,
  } = options;

  // Get skin system context
  const skinSystem = useSkinSystem();
  
  // State management
  const [isRegistered, setIsRegistered] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Refs for tracking
  const isRegisteredRef = useRef(false);
  const propertiesRef = useRef(skinProperties);
  const bindingRef = useRef(binding);

  // Enhanced binding with custom properties
  const enhancedBinding = useMemo(() => ({
    ...bindingRef.current,
    skinProperties: {
      ...bindingRef.current.skinProperties,
      ...propertiesRef.current,
    },
  }), [bindingRef.current, propertiesRef.current]);

  // Register component
  const register = useCallback(() => {
    if (!isRegisteredRef.current && skinSystem.registerComponent) {
      try {
        skinSystem.registerComponent(enhancedBinding);
        isRegisteredRef.current = true;
        setIsRegistered(true);
        onRegistered?.(componentId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Registration failed');
        onError?.(err);
      }
    }
  }, [componentId, enhancedBinding, skinSystem.registerComponent, onRegistered, onError]);

  // Unregister component
  const unregister = useCallback(() => {
    if (isRegisteredRef.current && skinSystem.unregisterComponent) {
      try {
        skinSystem.unregisterComponent(componentId);
        isRegisteredRef.current = false;
        setIsRegistered(false);
        onUnregistered?.(componentId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unregistration failed');
        onError?.(err);
      }
    }
  }, [componentId, skinSystem.unregisterComponent, onUnregistered, onError]);

  // Update skin properties
  const updateProperties = useCallback((newProperties: Record<string, unknown>) => {
    propertiesRef.current = { ...propertiesRef.current, ...newProperties };
    setLastUpdate(Date.now());
    setRenderCount(prev => prev + 1);
    
    // Re-register if already registered to apply new properties
    if (isRegisteredRef.current) {
      unregister();
      setTimeout(() => register(), 0);
    }
  }, [register, unregister]);

  // Generate skin data
  const skinData = useMemo(() => {
    if (!isRegisteredRef.current) {
      return {
        classes: [],
        attributes: {},
        styles: {},
      };
    }

    try {
      const genClasses = skinSystem.generateClasses?.(componentId) || [];
      const genAttributes = skinSystem.generateAttributes?.(componentId) || {};
      const genStyles = skinSystem.generateStyles?.(componentId) || {};

      return {
        classes: generateClasses ? genClasses : [],
        attributes: generateAttributes ? genAttributes : {},
        styles: generateStyles ? genStyles : {},
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Style generation failed');
      onError?.(err);
      return {
        classes: [],
        attributes: {},
        styles: {},
      };
    }
  }, [
    componentId,
    isRegisteredRef.current,
    skinSystem.generateClasses,
    skinSystem.generateAttributes,
    skinSystem.generateStyles,
    generateClasses,
    generateAttributes,
    generateStyles,
    onError,
  ]);

  // Convenience className
  const className = useMemo(() => {
    return skinData.classes.join(' ');
  }, [skinData.classes]);

  // Utility functions
  const hasClass = useCallback((className: string) => {
    return skinData.classes.includes(className);
  }, [skinData.classes]);

  const getAttribute = useCallback((name: string) => {
    return skinData.attributes[name];
  }, [skinData.attributes]);

  const setAttribute = useCallback((name: string, value: string) => {
    // This would need to be implemented in the skin system
    // For now, we'll update properties and trigger re-registration
    updateProperties({ [`attribute_${name}`]: value });
  }, [updateProperties]);

  // Auto-registration effect
  useEffect(() => {
    if (autoRegister && !isRegisteredRef.current) {
      register();
    }
  }, [autoRegister, register]);

  // Auto-unregistration effect
  useEffect(() => {
    return () => {
      if (autoUnregister && isRegisteredRef.current) {
        unregister();
      }
    };
  }, [autoUnregister, unregister]);

  // Live updates effect
  useEffect(() => {
    if (enableLiveUpdates && isRegisteredRef.current) {
      setRenderCount(prev => prev + 1);
      setLastUpdate(Date.now());
    }
  }, [
    enableLiveUpdates,
    skinSystem.state?.currentPreset,
    skinSystem.state?.currentPillar,
    skinSystem.state?.currentMotionLevel,
    isRegisteredRef.current,
  ]);

  // Update binding ref when binding changes
  useEffect(() => {
    bindingRef.current = binding;
  }, [binding]);

  // Update properties ref when skinProperties changes
  useEffect(() => {
    propertiesRef.current = skinProperties;
  }, [skinProperties]);

  return {
    // Generated styles
    classes: skinData.classes,
    attributes: skinData.attributes,
    styles: skinData.styles,
    
    // Convenience
    className,
    
    // Registration state
    isRegistered,
    isTransitioning: skinSystem.state?.isTransitioning || false,
    
    // Current skin context
    currentPreset: skinSystem.state?.currentPreset || 'minimal-frontier',
    currentPillar: skinSystem.state?.currentPillar || 'frontier',
    currentMotionLevel: skinSystem.state?.currentMotionLevel || 'full',
    
    // Control functions
    register,
    unregister,
    updateProperties,
    
    // Utility functions
    hasClass,
    getAttribute,
    setAttribute,
    
    // Performance metrics
    renderCount,
    lastUpdate,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Simplified hook for basic skin slot usage
 */
export function useBasicSkinSlot(
  componentId: ComponentId,
  binding: ComponentSkinBinding
): Pick<UseSkinSlotResult, 'className' | 'classes' | 'attributes' | 'styles'> {
  const result = useSkinSlot(componentId, binding, {
    autoRegister: true,
    autoUnregister: true,
    enableLiveUpdates: true,
    generateClasses: true,
    generateAttributes: true,
    generateStyles: false,
  });

  return {
    className: result.className,
    classes: result.classes,
    attributes: result.attributes,
    styles: result.styles,
  };
}

/**
 * Hook for components that need full control over skin slot
 */
export function useAdvancedSkinSlot(
  componentId: ComponentId,
  binding: ComponentSkinBinding,
  options: UseSkinSlotOptions
): UseSkinSlotResult {
  return useSkinSlot(componentId, binding, options);
}

/**
 * Hook for components that only need CSS classes
 */
export function useSkinClasses(
  componentId: ComponentId,
  binding: ComponentSkinBinding,
  options: Omit<UseSkinSlotOptions, 'generateClasses' | 'generateAttributes' | 'generateStyles'> = {}
): Pick<UseSkinSlotResult, 'className' | 'classes' | 'isRegistered' | 'currentPreset' | 'currentPillar' | 'currentMotionLevel'> {
  const result = useSkinSlot(componentId, binding, {
    ...options,
    generateClasses: true,
    generateAttributes: false,
    generateStyles: false,
  });

  return {
    className: result.className,
    classes: result.classes,
    isRegistered: result.isRegistered,
    currentPreset: result.currentPreset,
    currentPillar: result.currentPillar,
    currentMotionLevel: result.currentMotionLevel,
  };
}

/**
 * Hook for components that only need attributes
 */
export function useSkinAttributes(
  componentId: ComponentId,
  binding: ComponentSkinBinding,
  options: Omit<UseSkinSlotOptions, 'generateClasses' | 'generateAttributes' | 'generateStyles'> = {}
): Pick<UseSkinSlotResult, 'attributes' | 'isRegistered' | 'currentPreset' | 'currentPillar' | 'currentMotionLevel'> {
  const result = useSkinSlot(componentId, binding, {
    ...options,
    generateClasses: false,
    generateAttributes: true,
    generateStyles: false,
  });

  return {
    attributes: result.attributes,
    isRegistered: result.isRegistered,
    currentPreset: result.currentPreset,
    currentPillar: result.currentPillar,
    currentMotionLevel: result.currentMotionLevel,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useSkinSlot;
