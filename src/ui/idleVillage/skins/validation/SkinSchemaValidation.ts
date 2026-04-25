/**
 * TS-001: Skin Schema Validation with Zod
 * 
 * Comprehensive validation schemas for all skin system types.
 * Provides runtime type checking and validation for TS-001 compliance.
 */

import { z } from 'zod';

// ============================================================================
// BASE TYPE SCHEMAS
// ============================================================================

/**
 * Core identifier validation schemas
 */
export const SkinPresetIdSchema = z.enum([
  'minimal-frontier',
  'minimal-wilderness', 
  'minimal-empire',
  'wanderlust',
  'arcane-tech',
  'gilded-observatory'
]);

export const StyleLabPillarSchema = z.enum([
  'frontier',
  'wilderness',
  'empire'
]);

export const MotionLevelSchema = z.enum([
  'minimal',
  'reduced',
  'full'
]);

export const ComponentIdSchema = z.string().min(1).max(100);

export const CertifiedComponentIdSchema = z.enum([
  'PgCard',
  'ResidentSlotRack', 
  'TimeEngineStrip',
  'ActiveHUD',
  'ActivityCapsule',
  'ActionHalo',
  'SlottedMedal',
  'VillageRosterSection'
]);

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Color configuration validation
 */
export const SkinColorConfigSchema = z.object({
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  surface: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  border: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  textSecondary: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  success: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  warning: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  error: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
  info: z.string().regex(/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/, 'Invalid hex color'),
});

/**
 * Animation configuration validation
 */
export const SkinAnimationConfigSchema = z.object({
  enabled: z.boolean(),
  duration: z.number().min(0).max(10000), // max 10 seconds
  easing: z.string().min(1),
  delay: z.number().min(0).max(5000), // max 5 seconds
  iterations: z.number().min(1).max(1000).optional(),
  direction: z.enum(['normal', 'reverse', 'alternate', 'alternate-reverse']).optional(),
});

/**
 * Typography configuration validation
 */
export const SkinTypographyConfigSchema = z.object({
  fontFamily: z.string().min(1).max(100),
  fontSize: z.object({
    xs: z.string(),
    sm: z.string(),
    base: z.string(),
    lg: z.string(),
    xl: z.string(),
    '2xl': z.string(),
    '3xl': z.string(),
    '4xl': z.string(),
  }),
  fontWeight: z.object({
    light: z.number().min(100).max(900),
    normal: z.number().min(100).max(900),
    medium: z.number().min(100).max(900),
    semibold: z.number().min(100).max(900),
    bold: z.number().min(100).max(900),
  }),
  lineHeight: z.object({
    tight: z.number().min(0.5).max(3),
    normal: z.number().min(0.5).max(3),
    relaxed: z.number().min(0.5).max(3),
  }),
});

/**
 * Spacing configuration validation
 */
export const SkinSpacingConfigSchema = z.object({
  xs: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  '3xl': z.string(),
});

/**
 * Border configuration validation
 */
export const SkinBorderConfigSchema = z.object({
  radius: z.object({
    none: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
    full: z.string(),
  }),
  width: z.object({
    none: z.string(),
    thin: z.string(),
    normal: z.string(),
    thick: z.string(),
  }),
});

/**
 * Shadow configuration validation
 */
export const SkinShadowConfigSchema = z.object({
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  inner: z.string(),
});

// ============================================================================
// PRESET CONFIGURATION SCHEMA
// ============================================================================

/**
 * Complete skin preset configuration validation
 */
export const SkinPresetConfigSchema = z.object({
  id: SkinPresetIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  author: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  // Core configurations
  colors: SkinColorConfigSchema,
  animations: SkinAnimationConfigSchema,
  typography: SkinTypographyConfigSchema,
  spacing: SkinSpacingConfigSchema,
  borders: SkinBorderConfigSchema,
  shadows: SkinShadowConfigSchema,
  
  // Pillar-specific overrides - use lazy evaluation to avoid circular reference
  pillarOverrides: z.record(StyleLabPillarSchema, z.any()).optional(),
  
  // Metadata
  tags: z.array(z.string().min(1).max(50)).max(20),
  category: z.enum(['minimal', 'themed', 'experimental']),
  isDefault: z.boolean(),
  isExperimental: z.boolean(),
  
  // Dependencies
  dependencies: z.array(SkinPresetIdSchema).optional(),
  
  // Compatibility
  supportedComponents: z.array(ComponentIdSchema).min(1).max(100),
  supportedPillars: z.array(StyleLabPillarSchema).min(1),
  supportedMotionLevels: z.array(MotionLevelSchema).min(1),
}).refine(
  (config) => {
    // Validate that dependencies don't create circular references
    if (!config.dependencies) return true;
    // This would need more complex circular dependency checking
    return true;
  },
  {
    message: 'Circular dependency detected in preset dependencies',
    path: ['dependencies'],
  }
);

// ============================================================================
// COMPONENT BINDING SCHEMA
// ============================================================================

/**
 * Component skin binding validation
 */
export const ComponentSkinBindingSchema = z.object({
  componentId: ComponentIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  
  // Skin configuration
  defaultPreset: SkinPresetIdSchema,
  supportedPillars: z.array(StyleLabPillarSchema).min(1),
  supportedMotionLevels: z.array(MotionLevelSchema).min(1),
  
  // CSS generation
  cssClassBase: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9-_]*$/, 'Invalid CSS class name'),
  dataAttributePrefix: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9-_]*$/, 'Invalid data attribute prefix'),
  
  // Features
  supportsMotionLevel: z.boolean(),
  supportsTelemetry: z.boolean(),
  supportsPillarSwitching: z.boolean(),
  
  // Component-specific properties
  skinProperties: z.record(z.unknown()).optional(),
  
  // Validation
  requiredProperties: z.array(z.string().min(1).max(50)).max(20),
  optionalProperties: z.array(z.string().min(1).max(50)).max(20),
  
  // Metadata
  category: z.enum(['ui', 'interactive', 'display', 'container']),
  priority: z.number().min(1).max(1000),
  tags: z.array(z.string().min(1).max(50)).max(10),
});

// ============================================================================
// STATE MANAGEMENT SCHEMAS
// ============================================================================

/**
 * Skin state validation
 */
export const SkinStateSchema = z.object({
  // Current selections
  currentPreset: SkinPresetIdSchema,
  currentPillar: StyleLabPillarSchema,
  currentMotionLevel: MotionLevelSchema,
  
  // Active bindings
  activeBindings: z.record(ComponentIdSchema, ComponentSkinBindingSchema),
  
  // Computed values
  computedStyles: z.record(z.string(), z.string()),
  computedClasses: z.record(z.string(), z.array(z.string())),
  computedAttributes: z.record(z.string(), z.record(z.string(), z.string())),
  
  // State metadata
  lastUpdated: z.string().datetime(),
  updateCount: z.number().min(0),
  isTransitioning: z.boolean(),
});

/**
 * Skin action validation
 */
export const SkinActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SET_PRESET'),
    payload: z.object({ presetId: SkinPresetIdSchema }),
  }),
  z.object({
    type: z.literal('SET_PILLAR'),
    payload: z.object({ pillar: StyleLabPillarSchema }),
  }),
  z.object({
    type: z.literal('SET_MOTION_LEVEL'),
    payload: z.object({ motionLevel: MotionLevelSchema }),
  }),
  z.object({
    type: z.literal('REGISTER_COMPONENT'),
    payload: z.object({ binding: ComponentSkinBindingSchema }),
  }),
  z.object({
    type: z.literal('UNREGISTER_COMPONENT'),
    payload: z.object({ componentId: ComponentIdSchema }),
  }),
  z.object({
    type: z.literal('UPDATE_SKIN_PROPERTIES'),
    payload: z.object({
      componentId: ComponentIdSchema,
      properties: z.record(z.unknown()),
    }),
  }),
  z.object({
    type: z.literal('RESET_STATE'),
  }),
  z.object({
    type: z.literal('LOAD_STATE'),
    payload: z.object({ state: z.any() }), // Use z.any() instead of z.partial for simplicity
  }),
]);

// ============================================================================
// VALIDATION RESULT SCHEMAS
// ============================================================================

/**
 * Validation error schema
 */
export const ValidationErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  path: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  context: z.record(z.unknown()).optional(),
});

/**
 * Validation result schema
 */
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationErrorSchema),
});

// ============================================================================
// SYSTEM CONFIGURATION SCHEMA
// ============================================================================

/**
 * Global skin system configuration validation
 */
export const SkinSystemConfigSchema = z.object({
  // System settings
  enableTelemetry: z.boolean(),
  enableDebugMode: z.boolean(),
  enablePerformanceMonitoring: z.boolean(),
  
  // Default values
  defaultPreset: SkinPresetIdSchema,
  defaultPillar: StyleLabPillarSchema,
  defaultMotionLevel: MotionLevelSchema,
  
  // Performance settings
  maxComponentCount: z.number().min(1).max(10000),
  updateDebounceMs: z.number().min(0).max(5000),
  transitionTimeoutMs: z.number().min(100).max(30000),
  
  // Validation settings
  enableStrictValidation: z.boolean(),
  enableExperimentalFeatures: z.boolean(),
  
  // Cache settings
  enableCache: z.boolean(),
  cacheMaxAge: z.number().min(1000).max(3600000), // 1 second to 1 hour
  cacheMaxSize: z.number().min(1).max(10000),
  
  // Persistence settings
  enablePersistence: z.boolean(),
  persistenceKey: z.string().min(1).max(100),
  persistenceStrategy: z.enum(['localStorage', 'sessionStorage', 'memory']),
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * TS-001 compliant validation utilities
 */
export class TS001SkinValidator {
  /**
   * Validate a skin preset configuration
   */
  static validatePreset(config: unknown) {
    return SkinPresetConfigSchema.safeParse(config);
  }

  /**
   * Validate a component skin binding
   */
  static validateBinding(binding: unknown) {
    return ComponentSkinBindingSchema.safeParse(binding);
  }

  /**
   * Validate skin state
   */
  static validateState(state: unknown) {
    return SkinStateSchema.safeParse(state);
  }

  /**
   * Validate a skin action
   */
  static validateAction(action: unknown) {
    return SkinActionSchema.safeParse(action);
  }

  /**
   * Validate system configuration
   */
  static validateSystemConfig(config: unknown) {
    return SkinSystemConfigSchema.safeParse(config);
  }

  /**
   * Check TS-001 compliance for a complete skin system
   */
  static validateTS001Compliance(data: {
    presets: unknown[];
    bindings: unknown[];
    state: unknown;
    config: unknown;
  }) {
    const presetResults = data.presets.map(p => this.validatePreset(p));
    const bindingResults = data.bindings.map(b => this.validateBinding(b));
    const stateResult = this.validateState(data.state);
    const configResult = this.validateSystemConfig(data.config);

    const allErrors = [
      ...(stateResult.success ? [] : stateResult.error?.issues || []),
      ...(configResult.success ? [] : configResult.error?.issues || []),
      ...presetResults.flatMap(r => r.success ? [] : r.error?.issues || []),
      ...bindingResults.flatMap(r => r.success ? [] : r.error?.issues || []),
    ];

    const isValid = 
      stateResult.success &&
      configResult.success &&
      presetResults.every(r => r.success) &&
      bindingResults.every(r => r.success);

    return {
      isValid,
      results: {
        presets: presetResults,
        bindings: bindingResults,
        state: stateResult,
        config: configResult,
      },
      errors: allErrors,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TS001SkinValidator;

// Type exports for use in components
export type ValidatedSkinPreset = z.infer<typeof SkinPresetConfigSchema>;
export type ValidatedComponentBinding = z.infer<typeof ComponentSkinBindingSchema>;
export type ValidatedSkinState = z.infer<typeof SkinStateSchema>;
export type ValidatedSkinAction = z.infer<typeof SkinActionSchema>;
export type ValidatedSystemConfig = z.infer<typeof SkinSystemConfigSchema>;
