/**
 * Skin Schema Types
 * 
 * Complete TypeScript schema definitions for the skin system.
 * Provides type-safe interfaces for all skin-related operations.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Base skin identifier types
 */
export type SkinPresetId = 
  | 'minimal-frontier'
  | 'minimal-wilderness' 
  | 'minimal-empire'
  | 'wanderlust'
  | 'arcane-tech'
  | 'gilded-observatory';

export type StyleLabPillar = 
  | 'frontier'
  | 'wilderness'
  | 'empire';

export type MotionLevel = 
  | 'minimal'
  | 'reduced'
  | 'full';

export type ComponentId = string;

/**
 * Certified component identifiers
 */
export type CertifiedComponentId = 
  | 'PgCard'
  | 'ResidentSlotRack' 
  | 'TimeEngineStrip'
  | 'ActiveHUD'
  | 'ActivityCapsule'
  | 'ActionHalo'
  | 'SlottedMedal'
  | 'VillageRosterSection'
  | 'POI'
  | 'ActivitySlot';

// ============================================================================
// SKIN PRESET CONFIGURATION
// ============================================================================

/**
 * Color configuration for a skin preset
 */
export interface SkinColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Animation configuration
 */
export interface SkinAnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  delay: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

/**
 * Typography configuration
 */
export interface SkinTypographyConfig {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Spacing configuration
 */
export interface SkinSpacingConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

/**
 * Border configuration
 */
export interface SkinBorderConfig {
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  width: {
    none: string;
    thin: string;
    normal: string;
    thick: string;
  };
}

/**
 * Shadow configuration
 */
export interface SkinShadowConfig {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

/**
 * Complete skin preset configuration
 */
export interface SkinPresetConfig {
  id: SkinPresetId;
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  
  // Core configurations
  colors: SkinColorConfig;
  animations: SkinAnimationConfig;
  typography: SkinTypographyConfig;
  spacing: SkinSpacingConfig;
  borders: SkinBorderConfig;
  shadows: SkinShadowConfig;
  
  // Pillar-specific overrides
  pillarOverrides?: Partial<Record<StyleLabPillar, Partial<SkinPresetConfig>>>;
  
  // Metadata
  tags: string[];
  category: 'minimal' | 'themed' | 'experimental';
  isDefault: boolean;
  isExperimental: boolean;
  
  // Dependencies
  dependencies?: SkinPresetId[];
  
  // Compatibility
  supportedComponents: ComponentId[];
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
}

// ============================================================================
// COMPONENT SKIN BINDING
// ============================================================================

/**
 * Component-specific skin properties
 */
export interface ComponentSkinProperties {
  [key: string]: any;
}

/**
 * Skin binding configuration for a component
 */
export interface ComponentSkinBinding {
  componentId: ComponentId;
  name: string;
  description: string;
  version: string;
  
  // Skin configuration
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  
  // CSS generation
  cssClassBase: string;
  dataAttributePrefix: string;
  
  // Features
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  supportsPillarSwitching: boolean;
  
  // Component-specific properties
  skinProperties?: ComponentSkinProperties;
  
  // Validation
  requiredProperties: string[];
  optionalProperties: string[];
  
  // Metadata
  category: 'ui' | 'interactive' | 'display' | 'container';
  priority: number;
  tags: string[];
}

// ============================================================================
// SKIN STATE MANAGEMENT
// ============================================================================

/**
 * Current skin state
 */
export interface SkinState {
  // Current selections
  currentPreset: SkinPresetId;
  currentPillar: StyleLabPillar;
  currentMotionLevel: MotionLevel;
  
  // Active bindings
  activeBindings: Record<ComponentId, ComponentSkinBinding>;
  
  // Computed values
  computedStyles: Record<string, string>;
  computedClasses: Record<string, string[]>;
  computedAttributes: Record<string, Record<string, string>>;
  
  // State metadata
  lastUpdated: string;
  updateCount: number;
  isTransitioning: boolean;
}

/**
 * Skin action types for state management
 */
export type SkinAction =
  | { type: 'SET_PRESET'; payload: { presetId: SkinPresetId } }
  | { type: 'SET_PILLAR'; payload: { pillar: StyleLabPillar } }
  | { type: 'SET_MOTION_LEVEL'; payload: { motionLevel: MotionLevel } }
  | { type: 'REGISTER_COMPONENT'; payload: { binding: ComponentSkinBinding } }
  | { type: 'UNREGISTER_COMPONENT'; payload: { componentId: ComponentId } }
  | { type: 'UPDATE_SKIN_PROPERTIES'; payload: { componentId: ComponentId; properties: ComponentSkinProperties } }
  | { type: 'RESET_STATE'; payload?: undefined }
  | { type: 'LOAD_STATE'; payload: { state: Partial<SkinState> } };

// ============================================================================
// TELEMETRY AND ANALYTICS
// ============================================================================

/**
 * Telemetry event payload base
 */
export interface SkinTelemetryPayload {
  timestamp: string;
  sessionId: string;
  userId?: string;
  
  // Skin context
  presetId: SkinPresetId;
  pillar: StyleLabPillar;
  motionLevel: MotionLevel;
  
  // Component context
  componentId?: ComponentId;
  componentType?: string;
  
  // Event metadata
  action: string;
  category: 'skin' | 'component' | 'system';
  severity: 'info' | 'warning' | 'error';
  
  // Additional data
  metadata?: Record<string, any>;
}

/**
 * Specific telemetry event types
 */
export interface SkinTelemetryEvents {
  'skin_preset_changed': SkinTelemetryPayload & {
    previousPreset: SkinPresetId;
    newPreset: SkinPresetId;
    changeReason: 'user' | 'system' | 'auto';
  };
  
  'skin_pillar_changed': SkinTelemetryPayload & {
    previousPillar: StyleLabPillar;
    newPillar: StyleLabPillar;
    changeReason: 'user' | 'system' | 'auto';
  };
  
  'skin_motion_changed': SkinTelemetryPayload & {
    previousMotionLevel: MotionLevel;
    newMotionLevel: MotionLevel;
    changeReason: 'user' | 'system' | 'auto';
  };
  
  'skin_component_registered': SkinTelemetryPayload & {
    componentId: ComponentId;
    binding: ComponentSkinBinding;
  };
  
  'skin_component_unregistered': SkinTelemetryPayload & {
    componentId: ComponentId;
    reason: 'user' | 'system' | 'cleanup';
  };
  
  'skin_error': SkinTelemetryPayload & {
    error: string;
    stack?: string;
    context: Record<string, any>;
  };
  
  'skin_performance': SkinTelemetryPayload & {
    operation: string;
    duration: number;
    memoryUsage?: number;
    componentCount?: number;
  };
}

// ============================================================================
// VALIDATION AND SCHEMA
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Skin-specific validation result helper.
 * Re-exported separately so skin modules can import the explicit name without
 * depending on the generic ValidationResult alias.
 */
export interface SkinValidationResult extends ValidationResult {}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  context?: Record<string, any>;
}

/**
 * Schema validator interface
 */
export interface SkinSchemaValidator {
  validatePreset(config: SkinPresetConfig): ValidationResult;
  validateBinding(binding: ComponentSkinBinding): ValidationResult;
  validateState(state: SkinState): ValidationResult;
  validateTransition(from: SkinState, to: SkinState): ValidationResult;
}

// ============================================================================
// CONFIGURATION AND SETTINGS
// ============================================================================

/**
 * Global skin system configuration
 */
export interface SkinSystemConfig {
  // System settings
  enableTelemetry: boolean;
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
  
  // Default values
  defaultPreset: SkinPresetId;
  defaultPillar: StyleLabPillar;
  defaultMotionLevel: MotionLevel;
  
  // Performance settings
  maxComponentCount: number;
  updateDebounceMs: number;
  transitionTimeoutMs: number;
  
  // Validation settings
  enableStrictValidation: boolean;
  enableExperimentalFeatures: boolean;
  
  // Cache settings
  enableCache: boolean;
  cacheMaxAge: number;
  cacheMaxSize: number;
  
  // Persistence settings
  enablePersistence: boolean;
  persistenceKey: string;
  persistenceStrategy: 'localStorage' | 'sessionStorage' | 'memory';
}

// ============================================================================
// REGISTRY TYPES
// ============================================================================

/**
 * Registry entry base
 */
export interface RegistryEntry<T> {
  id: string;
  name: string;
  description: string;
  version: string;
  data: T;
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
    tags: string[];
    category: string;
  };
}

/**
 * Preset registry entry
 */
export type PresetRegistryEntry = RegistryEntry<SkinPresetConfig>;

/**
 * Component registry entry
 */
export type ComponentRegistryEntry = RegistryEntry<ComponentSkinBinding>;

/**
 * Registry interface
 */
export interface SkinRegistry<T> {
  // Basic operations
  register(entry: RegistryEntry<T>): void;
  unregister(id: string): boolean;
  get(id: string): RegistryEntry<T> | undefined;
  getAll(): RegistryEntry<T>[];
  
  // Query operations
  findByTag(tag: string): RegistryEntry<T>[];
  findByCategory(category: string): RegistryEntry<T>[];
  search(query: string): RegistryEntry<T>[];
  
  // Validation
  validate(entry: RegistryEntry<T>): ValidationResult;
  
  // Events
  onRegister: (entry: RegistryEntry<T>) => void;
  onUnregister: (id: string) => void;
  onUpdate: (entry: RegistryEntry<T>) => void;
}

// ============================================================================
// MANAGER TYPES
// ============================================================================

/**
 * Skin manager interface
 */
export interface SkinManager {
  // State management
  getState(): SkinState;
  dispatch(action: SkinAction): void;
  subscribe(listener: (state: SkinState) => void): () => void;
  
  // Preset management
  setPreset(presetId: SkinPresetId): void;
  getPreset(presetId: SkinPresetId): SkinPresetConfig | undefined;
  getAllPresets(): SkinPresetConfig[];
  
  // Pillar management
  setPillar(pillar: StyleLabPillar): void;
  getCurrentPillar(): StyleLabPillar;
  
  // Motion management
  setMotionLevel(motionLevel: MotionLevel): void;
  getCurrentMotionLevel(): MotionLevel;
  
  // Component management
  registerComponent(binding: ComponentSkinBinding): void;
  unregisterComponent(componentId: ComponentId): void;
  getComponentBinding(componentId: ComponentId): ComponentSkinBinding | undefined;
  
  // Style generation
  generateClasses(componentId: ComponentId): string[];
  generateAttributes(componentId: ComponentId): Record<string, string>;
  generateStyles(componentId: ComponentId): Record<string, string>;
  
  // Validation
  validateState(): ValidationResult;
  validateTransition(presetId: SkinPresetId, pillar: StyleLabPillar): ValidationResult;
  
  // Persistence
  saveState(): void;
  loadState(): void;
  resetState(): void;
  
  // Telemetry
  trackEvent<T extends keyof SkinTelemetryEvents>(
    eventType: T,
    payload: Omit<SkinTelemetryEvents[T], keyof SkinTelemetryPayload>
  ): void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required fields for skin preset creation
 */
export type RequiredSkinPresetConfig = Pick<SkinPresetConfig, 
  'id' | 'name' | 'description' | 'colors' | 'supportedPillars'
>;

/**
 * Component skin binding creation type
 */
export type CreateComponentSkinBinding = Pick<ComponentSkinBinding,
  'componentId' | 'name' | 'defaultPreset' | 'supportedPillars' | 'cssClassBase'
>;

/**
 * Skin system event types
 */
export type SkinSystemEvent =
  | { type: 'preset_changed'; payload: { presetId: SkinPresetId } }
  | { type: 'pillar_changed'; payload: { pillar: StyleLabPillar } }
  | { type: 'motion_changed'; payload: { motionLevel: MotionLevel } }
  | { type: 'component_registered'; payload: { componentId: ComponentId } }
  | { type: 'component_unregistered'; payload: { componentId: ComponentId } }
  | { type: 'error'; payload: { error: string; context?: any } };

/**
 * Event listener type
 */
export type SkinEventListener<T extends SkinSystemEvent> = (event: T) => void;

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

/**
 * Skin system constants
 */
export const SKIN_SYSTEM_CONSTANTS = {
  // Version
  VERSION: '1.0.0',
  
  // Limits
  MAX_COMPONENTS: 1000,
  MAX_PRESETS: 100,
  MAX_CACHE_SIZE: 1000,
  
  // Timeouts
  TRANSITION_TIMEOUT: 5000,
  UPDATE_DEBOUNCE: 100,
  CACHE_MAX_AGE: 3600000, // 1 hour
  
  // Keys
  PERSISTENCE_KEY: 'skin-system-state',
  CACHE_KEY_PREFIX: 'skin-cache-',
  
  // Events
  EVENT_PREFIX: 'skin-',
} as const;

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  INVALID_PRESET_ID = 'INVALID_PRESET_ID',
  INVALID_PILLAR = 'INVALID_PILLAR',
  INVALID_MOTION_LEVEL = 'INVALID_MOTION_LEVEL',
  MISSING_REQUIRED_PROPERTY = 'MISSING_REQUIRED_PROPERTY',
  INVALID_COLOR_FORMAT = 'INVALID_COLOR_FORMAT',
  INVALID_ANIMATION_CONFIG = 'INVALID_ANIMATION_CONFIG',
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  PRESET_NOT_FOUND = 'PRESET_NOT_FOUND',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

/**
 * Component categories
 */
export enum ComponentCategory {
  UI = 'ui',
  INTERACTIVE = 'interactive',
  DISPLAY = 'display',
  CONTAINER = 'container',
}

/**
 * Preset categories
 */
export enum PresetCategory {
  MINIMAL = 'minimal',
  THEMED = 'themed',
  EXPERIMENTAL = 'experimental',
}

/**
 * Telemetry categories
 */
export enum TelemetryCategory {
  SKIN = 'skin',
  COMPONENT = 'component',
  SYSTEM = 'system',
}

/**
 * Event severity levels
 */
export enum EventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}
