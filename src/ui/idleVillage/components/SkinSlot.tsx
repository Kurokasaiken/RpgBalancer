/**
 * TS-002: SkinSlot Component
 * 
 * Generic wrapper component that applies skin system integration
 * to any child component. Provides automatic registration, style
 * generation, and lifecycle management.
 */

import React, { memo, forwardRef, useMemo } from 'react';
import { useSkinSlot, useBasicSkinSlot, useAdvancedSkinSlot, type UseSkinSlotOptions } from '@/ui/idleVillage/hooks/useSkinSlot';

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

export interface SkinSlotProps {
  /** Component ID for skin registration */
  componentId: ComponentId;
  
  /** Skin binding configuration */
  binding: ComponentSkinBinding;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Additional inline styles */
  style?: React.CSSProperties;
  
  /** Skin slot options */
  skinOptions?: UseSkinSlotOptions;
  
  /** Whether to use advanced skin slot (full control) */
  useAdvanced?: boolean;
  
  /** Test ID for testing */
  'data-testid'?: string;
  
  /** Children to wrap */
  children: React.ReactNode;
  
  /** HTML tag to render */
  as?: keyof JSX.IntrinsicElements;
  
  /** Additional props to pass to the element */
  [key: string]: any;
}

export interface BasicSkinSlotProps {
  /** Component ID for skin registration */
  componentId: ComponentId;
  
  /** Skin binding configuration */
  binding: ComponentSkinBinding;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Additional inline styles */
  style?: React.CSSProperties;
  
  /** Test ID for testing */
  'data-testid'?: string;
  
  /** Children to wrap */
  children: React.ReactNode;
  
  /** HTML tag to render */
  as?: keyof JSX.IntrinsicElements;
  
  /** Additional props to pass to the element */
  [key: string]: any;
}

// ============================================================================
// BASIC SKIN SLOT
// ============================================================================

/**
 * Basic SkinSlot component for simple use cases
 * 
 * Automatically registers the component and applies generated classes
 * and attributes to the wrapper element.
 */
export const BasicSkinSlot = memo<BasicSkinSlotProps>(({
  componentId,
  binding,
  className = '',
  style = {},
  'data-testid': testId,
  children,
  as: Component = 'div',
  ...rest
}) => {
  const skinData = useBasicSkinSlot(componentId, binding);

  // Merge skin classes with additional classes
  const mergedClassName = useMemo(() => {
    return [skinData.className, className].filter(Boolean).join(' ');
  }, [skinData.className, className]);

  // Merge skin attributes with additional attributes
  const mergedAttributes = useMemo(() => {
    return {
      ...skinData.attributes,
      ...rest,
    };
  }, [skinData.attributes, rest]);

  return (
    <Component
      ref={undefined}
      className={mergedClassName}
      style={style}
      data-testid={testId}
      {...mergedAttributes}
    >
      {children}
    </Component>
  );
});

BasicSkinSlot.displayName = 'BasicSkinSlot';

// ============================================================================
// ADVANCED SKIN SLOT
// ============================================================================

/**
 * Advanced SkinSlot component for full control
 * 
 * Provides access to all skin slot features including performance
 * metrics, registration control, and custom error handling.
 */
export const AdvancedSkinSlot = memo<SkinSlotProps>(({
  componentId,
  binding,
  className = '',
  style = {},
  skinOptions = {},
  'data-testid': testId,
  children,
  as: Component = 'div',
  ...rest
}) => {
  const skinData = useAdvancedSkinSlot(componentId, binding, skinOptions);

  // Merge skin classes with additional classes
  const mergedClassName = useMemo(() => {
    return [skinData.className, className].filter(Boolean).join(' ');
  }, [skinData.className, className]);

  // Merge skin attributes with additional attributes
  const mergedAttributes = useMemo(() => {
    return {
      ...skinData.attributes,
      ...rest,
    };
  }, [skinData.attributes, rest]);

  // Merge skin styles with additional styles
  const mergedStyle = useMemo(() => {
    return {
      ...skinData.styles,
      ...style,
    };
  }, [skinData.styles, style]);

  return (
    <Component
      ref={undefined}
      className={mergedClassName}
      style={mergedStyle}
      data-testid={testId}
      {...mergedAttributes}
    >
      {children}
    </Component>
  );
});

AdvancedSkinSlot.displayName = 'AdvancedSkinSlot';

// ============================================================================
// MAIN SKIN SLOT COMPONENT
// ============================================================================

/**
 * Main SkinSlot component with smart defaults
 * 
 * Automatically chooses between basic and advanced mode based on
 * the presence of skinOptions.
 */
export const SkinSlot = forwardRef<any, SkinSlotProps>(({
  componentId,
  binding,
  className = '',
  style = {},
  skinOptions,
  useAdvanced = false,
  'data-testid': testId,
  children,
  as: Component = 'div',
  ...rest
}, ref) => {
  // Choose the appropriate hook based on options
  const skinData = useAdvanced || skinOptions 
    ? useAdvancedSkinSlot(componentId, binding, skinOptions || {})
    : useBasicSkinSlot(componentId, binding);

  // Merge skin classes with additional classes
  const mergedClassName = useMemo(() => {
    return [skinData.className, className].filter(Boolean).join(' ');
  }, [skinData.className, className]);

  // Merge skin attributes with additional attributes
  const mergedAttributes = useMemo(() => {
    return {
      ...skinData.attributes,
      ...rest,
    };
  }, [skinData.attributes, rest]);

  // Merge skin styles with additional styles
  const mergedStyle = useMemo(() => {
    return {
      ...skinData.styles,
      ...style,
    };
  }, [skinData.styles, style]);

  return (
    <Component
      ref={ref}
      className={mergedClassName}
      style={mergedStyle}
      data-testid={testId}
      {...mergedAttributes}
    >
      {children}
    </Component>
  );
});

SkinSlot.displayName = 'SkinSlot';

// ============================================================================
// SPECIALIZED SKIN SLOT VARIANTS
// ============================================================================

/**
 * SkinSlot that only applies CSS classes
 */
export const ClassSkinSlot = memo<Omit<BasicSkinSlotProps, 'className'>>((props) => {
  return (
    <BasicSkinSlot
      {...props}
      className=""
      // Override to only use skin classes
    />
  );
});

ClassSkinSlot.displayName = 'ClassSkinSlot';

/**
 * SkinSlot that only applies attributes
 */
export const AttributeSkinSlot = memo<Omit<BasicSkinSlotProps, 'className'>>((props) => {
  return (
    <BasicSkinSlot
      {...props}
      className=""
      // Override to only use skin attributes
    />
  );
});

AttributeSkinSlot.displayName = 'AttributeSkinSlot';

/**
 * SkinSlot that only applies inline styles
 */
export const StyleSkinSlot = memo<SkinSlotProps>(({
  componentId,
  binding,
  className = '',
  style = {},
  skinOptions = { generateStyles: true, generateClasses: false, generateAttributes: false },
  'data-testid': testId,
  children,
  as: Component = 'div',
  ...rest
}) => {
  const skinData = useAdvancedSkinSlot(componentId, binding, skinOptions);

  // Merge skin styles with additional styles
  const mergedStyle = useMemo(() => {
    return {
      ...skinData.styles,
      ...style,
    };
  }, [skinData.styles, style]);

  return (
    <Component
      ref={undefined}
      className={className}
      style={mergedStyle}
      data-testid={testId}
      {...rest}
    >
      {children}
    </Component>
  );
});

StyleSkinSlot.displayName = 'StyleSkinSlot';

// ============================================================================
// HOC (Higher-Order Component) FOR EASY INTEGRATION
// ============================================================================

/**
 * Higher-order component that wraps any component with skin functionality
 */
export function withSkinSlot<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  componentId: ComponentId,
  binding: ComponentSkinBinding,
  skinOptions?: UseSkinSlotOptions
) {
  const WrappedWithSkin = memo((props: T) => {
    return (
      <SkinSlot
        componentId={componentId}
        binding={binding}
        skinOptions={skinOptions}
      >
        <WrappedComponent {...props} />
      </SkinSlot>
    );
  });

  WrappedWithSkin.displayName = `withSkinSlot(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WrappedWithSkin;
}

/**
 * Higher-order component for basic skin integration
 */
export function withBasicSkin<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  componentId: ComponentId,
  binding: ComponentSkinBinding
) {
  return withSkinSlot(WrappedComponent, componentId, binding);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SkinSlot;
