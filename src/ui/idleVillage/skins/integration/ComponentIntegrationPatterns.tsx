/**
 * TS-004: Component Integration Patterns
 * 
 * Standardized patterns and utilities for integrating existing components
 * with the TS-Series skin system. Provides migration paths, wrapper
 * patterns, and integration utilities.
 */

import React from 'react';
import { 
  SkinSlot, 
  useSkinSlot, 
  withSkinSlot, 
  BasicSkinSlot,
  AdvancedSkinSlot 
} from '../../components/SkinSlot';
import { getSkinReplacementAPI_TS003 } from '../SkinReplacementAPI_TS003';
import { TS001SkinValidator } from '../validation/SkinSchemaValidation';

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

export interface ComponentIntegrationConfig {
  /** Component identifier for skin system */
  componentId: ComponentId;
  /** Component display name */
  name: string;
  /** Component description */
  description: string;
  /** Component version */
  version: string;
  /** Default skin preset */
  defaultPreset: SkinPresetId;
  /** Supported style pillars */
  supportedPillars: StyleLabPillar[];
  /** Supported motion levels */
  supportedMotionLevels: MotionLevel[];
  /** CSS class base */
  cssClassBase: string;
  /** Data attribute prefix */
  dataAttributePrefix: string;
  /** Component category */
  category: string;
  /** Priority for skin loading */
  priority: number;
  /** Component tags */
  tags: string[];
  /** Custom skin properties */
  skinProperties?: Record<string, unknown>;
  /** Integration options */
  integrationOptions?: {
    /** Whether to enable hot reload */
    enableHotReload?: boolean;
    /** Whether to generate classes */
    generateClasses?: boolean;
    /** Whether to generate attributes */
    generateAttributes?: boolean;
    /** Whether to generate styles */
    generateStyles?: boolean;
    /** Whether to enable telemetry */
    enableTelemetry?: boolean;
    /** Custom validation rules */
    customValidation?: boolean;
  };
}

export interface MigrationResult {
  success: boolean;
  componentId: ComponentId;
  originalComponent: React.ComponentType<any>;
  wrappedComponent: React.ComponentType<any>;
  migrationTime: number;
  warnings: string[];
  errors: string[];
}

export interface IntegrationPattern {
  name: string;
  description: string;
  useCase: string;
  complexity: 'simple' | 'medium' | 'advanced';
  migrationEffort: 'low' | 'medium' | 'high';
  examples: string[];
}

// ============================================================================
// INTEGRATION PATTERNS
// ============================================================================

export const ComponentIntegrationPatterns: IntegrationPattern[] = [
  {
    name: 'Basic Wrapper',
    description: 'Simple wrapper component using SkinSlot',
    useCase: 'Components that need basic skin integration without complex logic',
    complexity: 'simple',
    migrationEffort: 'low',
    examples: ['ActivitySlot', 'ActionCard', 'DetailPanel'],
  },
  {
    name: 'Hook Integration',
    description: 'Direct hook usage in component with full control',
    useCase: 'Components that need fine-grained control over skin behavior',
    complexity: 'medium',
    migrationEffort: 'medium',
    examples: ['ActiveHUD', 'PgCard', 'CrewScheduler'],
  },
  {
    name: 'Higher-Order Component',
    description: 'HOC wrapper for existing components',
    useCase: 'Legacy components that cannot be modified directly',
    complexity: 'medium',
    migrationEffort: 'medium',
    examples: ['DraggableWorker', 'ActivityCapsule', 'BoutCard'],
  },
  {
    name: 'Advanced Integration',
    description: 'Full integration with hot-reload and DevTools',
    useCase: 'Critical components that need advanced skin features',
    complexity: 'advanced',
    migrationEffort: 'high',
    examples: ['MainLayout', 'GameInterface', 'DevTools'],
  },
];

// ============================================================================
// INTEGRATION UTILITIES
// ============================================================================

/**
 * Create a skin binding configuration for a component
 */
export function createSkinBinding(config: ComponentIntegrationConfig): ComponentSkinBinding {
  return {
    componentId: config.componentId,
    name: config.name,
    description: config.description,
    version: config.version,
    defaultPreset: config.defaultPreset,
    supportedPillars: config.supportedPillars,
    supportedMotionLevels: config.supportedMotionLevels,
    cssClassBase: config.cssClassBase,
    dataAttributePrefix: config.dataAttributePrefix,
    supportsMotionLevel: config.supportedMotionLevels.length > 1,
    supportsTelemetry: config.integrationOptions?.enableTelemetry ?? true,
    supportsPillarSwitching: config.supportedPillars.length > 1,
    category: config.category,
    priority: config.priority,
    tags: config.tags,
    skinProperties: config.skinProperties,
  };
}

/**
 * Validate a component integration configuration
 */
export function validateIntegrationConfig(config: ComponentIntegrationConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!config.componentId || config.componentId.trim() === '') {
    errors.push('Component ID is required');
  }

  if (!config.name || config.name.trim() === '') {
    errors.push('Component name is required');
  }

  if (!config.cssClassBase || config.cssClassBase.trim() === '') {
    errors.push('CSS class base is required');
  }

  if (!config.dataAttributePrefix || config.dataAttributePrefix.trim() === '') {
    errors.push('Data attribute prefix is required');
  }

  // Format validation
  if (config.componentId && !/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(config.componentId)) {
    errors.push('Component ID must be a valid identifier');
  }

  if (config.cssClassBase && !/^[a-z][a-z0-9-_]*$/.test(config.cssClassBase)) {
    errors.push('CSS class base must be lowercase with hyphens/underscores');
  }

  // Warnings
  if (config.supportedPillars.length === 0) {
    warnings.push('No supported pillars specified');
  }

  if (config.supportedMotionLevels.length === 0) {
    warnings.push('No supported motion levels specified');
  }

  if (config.priority < 0 || config.priority > 1000) {
    warnings.push('Priority should be between 0 and 1000');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Migrate a component to use skin system
 */
export function migrateComponent(
  OriginalComponent: React.ComponentType<any>,
  config: ComponentIntegrationConfig,
  pattern: keyof typeof ComponentIntegrationPatterns = 'Basic Wrapper'
): MigrationResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Validate configuration
    const validation = validateIntegrationConfig(config);
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
    warnings.push(...validation.warnings);

    // Create skin binding
    const skinBinding = createSkinBinding(config);

    // Validate skin binding
    const bindingValidation = TS001SkinValidator.validateBinding(skinBinding);
    if (!bindingValidation.success) {
      errors.push(...bindingValidation.errors.map(e => e.message));
    }

    let WrappedComponent: React.ComponentType<any>;

    switch (pattern) {
      case 'Basic Wrapper':
        WrappedComponent = createBasicWrapper(OriginalComponent, skinBinding, config);
        break;
      case 'Hook Integration':
        WrappedComponent = createHookWrapper(OriginalComponent, skinBinding, config);
        break;
      case 'Higher-Order Component':
        WrappedComponent = createHOCWrapper(OriginalComponent, skinBinding, config);
        break;
      case 'Advanced Integration':
        WrappedComponent = createAdvancedWrapper(OriginalComponent, skinBinding, config);
        break;
      default:
        WrappedComponent = createBasicWrapper(OriginalComponent, skinBinding, config);
    }

    const migrationTime = performance.now() - startTime;

    return {
      success: errors.length === 0,
      componentId: config.componentId,
      originalComponent: OriginalComponent,
      wrappedComponent: WrappedComponent,
      migrationTime,
      warnings,
      errors,
    };
  } catch (error) {
    const migrationTime = performance.now() - startTime;
    errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return {
      success: false,
      componentId: config.componentId,
      originalComponent: OriginalComponent,
      wrappedComponent: OriginalComponent, // Return original on failure
      migrationTime,
      warnings,
      errors,
    };
  }
}

// ============================================================================
// WRAPPER FACTORIES
// ============================================================================

/**
 * Create a basic wrapper using SkinSlot
 */
function createBasicWrapper(
  OriginalComponent: React.ComponentType<any>,
  skinBinding: ComponentSkinBinding,
  config: ComponentIntegrationConfig
): React.ComponentType<any> {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    return (
      <SkinSlot
        componentId={skinBinding.componentId}
        binding={skinBinding}
        className={props.className}
        style={props.style}
        ref={ref}
        {...(config.integrationOptions || {})}
      >
        <OriginalComponent {...props} />
      </SkinSlot>
    );
  });

  WrappedComponent.displayName = `SkinWrapped(${OriginalComponent.displayName || OriginalComponent.name})`;
  return WrappedComponent;
}

/**
 * Create a hook-based wrapper
 */
function createHookWrapper(
  OriginalComponent: React.ComponentType<any>,
  skinBinding: ComponentSkinBinding,
  config: ComponentIntegrationConfig
): React.ComponentType<any> {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const skinData = useSkinSlot(skinBinding.componentId, skinBinding, {
      generateClasses: config.integrationOptions?.generateClasses ?? true,
      generateAttributes: config.integrationOptions?.generateAttributes ?? true,
      generateStyles: config.integrationOptions?.generateStyles ?? false,
    });

    return (
      <div
        ref={ref}
        className={skinData.className}
        style={{ ...skinData.styles, ...props.style }}
        {...skinData.attributes}
      >
        <OriginalComponent {...props} />
      </div>
    );
  });

  WrappedComponent.displayName = `HookWrapped(${OriginalComponent.displayName || OriginalComponent.name})`;
  return WrappedComponent;
}

/**
 * Create a higher-order component wrapper
 */
function createHOCWrapper(
  OriginalComponent: React.ComponentType<any>,
  skinBinding: ComponentSkinBinding,
  config: ComponentIntegrationConfig
): React.ComponentType<any> {
  return withSkinSlot(OriginalComponent, skinBinding.componentId, skinBinding);
}

/**
 * Create an advanced wrapper with hot-reload support
 */
function createAdvancedWrapper(
  OriginalComponent: React.ComponentType<any>,
  skinBinding: ComponentSkinBinding,
  config: ComponentIntegrationConfig
): React.ComponentType<any> {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const skinData = useSkinSlot(skinBinding.componentId, skinBinding, {
      generateClasses: config.integrationOptions?.generateClasses ?? true,
      generateAttributes: config.integrationOptions?.generateAttributes ?? true,
      generateStyles: config.integrationOptions?.generateStyles ?? true,
      enableLiveUpdates: true,
    });

    // Enable hot reload if requested
    React.useEffect(() => {
      if (config.integrationOptions?.enableHotReload) {
        const api = getSkinReplacementAPI_TS003();
        api.enableHotReload(skinBinding.componentId, {
          enabled: true,
          watchInterval: 1000,
          debounceMs: 100,
          validateOnReload: true,
          preserveComponentState: true,
        });

        return () => {
          api.disableHotReload(skinBinding.componentId);
        };
      }
    }, [skinBinding.componentId, config.integrationOptions?.enableHotReload]);

    return (
      <div
        ref={ref}
        className={skinData.className}
        style={{ ...skinData.styles, ...props.style }}
        {...skinData.attributes}
      >
        <OriginalComponent {...props} />
      </div>
    );
  });

  WrappedComponent.displayName = `AdvancedWrapped(${OriginalComponent.displayName || OriginalComponent.name})`;
  return WrappedComponent;
}

// ============================================================================
// BATCH MIGRATION UTILITIES
// ============================================================================

export interface BatchMigrationConfig {
  components: Array<{
    component: React.ComponentType<any>;
    config: ComponentIntegrationConfig;
    pattern?: keyof typeof ComponentIntegrationPatterns;
  }>;
  onProgress?: (completed: number, total: number, current: ComponentId) => void;
  onComplete?: (results: MigrationResult[]) => void;
  onError?: (error: Error, componentId: ComponentId) => void;
}

/**
 * Migrate multiple components in batch
 */
export async function batchMigrateComponents(
  batchConfig: BatchMigrationConfig
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  const { components, onProgress, onComplete, onError } = batchConfig;

  for (let i = 0; i < components.length; i++) {
    const { component, config, pattern = 'Basic Wrapper' } = components[i];

    try {
      const result = migrateComponent(component, config, pattern);
      results.push(result);

      onProgress?.(i + 1, components.length, config.componentId);

      // Add small delay to prevent blocking
      if (i < components.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err, config.componentId);

      results.push({
        success: false,
        componentId: config.componentId,
        originalComponent: component,
        wrappedComponent: component,
        migrationTime: 0,
        warnings: [],
        errors: [err.message],
      });
    }
  }

  onComplete?.(results);
  return results;
}

// ============================================================================
// PREDEFINED CONFIGURATIONS
// ============================================================================

export const CommonComponentConfigs: Record<string, ComponentIntegrationConfig> = {
  ActivitySlot: {
    componentId: 'ActivitySlot',
    name: 'Activity Slot',
    description: 'Interactive slot for activity assignments',
    version: '1.0.0',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    cssClassBase: 'activity-slot',
    dataAttributePrefix: 'activity-slot',
    category: 'interactive',
    priority: 100,
    tags: ['activity', 'slot', 'interactive'],
    integrationOptions: {
      enableHotReload: true,
      generateClasses: true,
      generateAttributes: true,
      enableTelemetry: true,
    },
  },

  ActiveHUD: {
    componentId: 'ActiveHUD',
    name: 'Active HUD',
    description: 'Heads-up display for active activities',
    version: '1.0.0',
    defaultPreset: 'gilded-observatory',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    cssClassBase: 'active-hud',
    dataAttributePrefix: 'active-hud',
    category: 'ui',
    priority: 200,
    tags: ['hud', 'active', 'monitoring'],
    integrationOptions: {
      enableHotReload: true,
      generateClasses: true,
      generateAttributes: true,
      generateStyles: true,
      enableTelemetry: true,
    },
  },

  PgCard: {
    componentId: 'PgCard',
    name: 'Player Character Card',
    description: 'Draggable card for player characters',
    version: '1.0.0',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    cssClassBase: 'pg-card',
    dataAttributePrefix: 'pg-card',
    category: 'interactive',
    priority: 150,
    tags: ['card', 'player', 'character', 'draggable'],
    integrationOptions: {
      enableHotReload: true,
      generateClasses: true,
      generateAttributes: true,
      generateStyles: true,
      enableTelemetry: true,
    },
  },

  CrewScheduler: {
    componentId: 'CrewScheduler',
    name: 'Crew Scheduler',
    description: 'Interface for crew scheduling and management',
    version: '1.0.0',
    defaultPreset: 'arcane-tech',
    supportedPillars: ['frontier', 'empire'],
    supportedMotionLevels: ['reduced', 'full'],
    cssClassBase: 'crew-scheduler',
    dataAttributePrefix: 'crew-scheduler',
    category: 'management',
    priority: 120,
    tags: ['crew', 'scheduler', 'management'],
    integrationOptions: {
      enableHotReload: false,
      generateClasses: true,
      generateAttributes: true,
      generateStyles: false,
      enableTelemetry: true,
    },
  },
};

// ============================================================================
// EXPORTS
// ============================================================================
