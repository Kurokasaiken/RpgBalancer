/**
 * Skin Manager
 * 
 * Central management system for skin operations, state management,
 * and coordination between skin components.
 */

import {
  SKIN_SYSTEM_CONSTANTS,
} from './types/SkinSchema';

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

// ← CAMBIA QUI per switchare la skin di default di tutti i componenti (v9 = 'wanderlust', v8 = 'minimal-frontier')
export const DEFAULT_COMPONENT_SKIN_PRESET: SkinPresetId = 'base';

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

type SkinAction = 
  | { type: 'SET_PRESET'; payload: SkinPresetId }
  | { type: 'SET_PILLAR'; payload: StyleLabPillar }
  | { type: 'SET_MOTION_LEVEL'; payload: MotionLevel }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'REGISTER_COMPONENT'; payload: { binding: ComponentSkinBinding } }
  | { type: 'UNREGISTER_COMPONENT'; payload: { componentId: ComponentId } }
  | { type: 'UPDATE_SKIN_PROPERTIES'; payload: { componentId: ComponentId; properties: Record<string, unknown> } };

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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface SkinSchemaValidator {
  validatePreset(config: SkinPresetConfig): ValidationResult;
  validateBinding(binding: ComponentSkinBinding): ValidationResult;
  validateState(state: SkinState): ValidationResult;
}

interface SkinTelemetryEvents {
  preset_changed: { presetId: SkinPresetId; previousPreset: SkinPresetId };
  pillar_changed: { pillar: StyleLabPillar; previousPillar: StyleLabPillar };
  motion_level_changed: { motionLevel: MotionLevel; previousMotionLevel: MotionLevel };
  component_registered: { componentId: ComponentId; binding: ComponentSkinBinding };
  component_unregistered: { componentId: ComponentId; reason: string };
  error: { error: string; context?: any };
}

type ValidationErrorCode = string;

// Validation error codes
const VALIDATION_ERROR_CODES = {
  MISSING_REQUIRED_PROPERTY: 'MISSING_REQUIRED_PROPERTY',
  PRESET_NOT_FOUND: 'PRESET_NOT_FOUND',
  COMPONENT_NOT_FOUND: 'COMPONENT_NOT_FOUND',
  INVALID_PILLAR: 'INVALID_PILLAR',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_COLOR_FORMAT: 'INVALID_COLOR_FORMAT',
  INVALID_ANIMATION_CONFIG: 'INVALID_ANIMATION_CONFIG',
} as const;

// ============================================================================
// STATE REDUCER
// ============================================================================

/**
 * Reducer function for skin state management
 */
function skinReducer(state: SkinState, action: SkinAction): SkinState {
  switch (action.type) {
    case 'SET_PRESET':
      return {
        ...state,
        currentPreset: action.payload.presetId,
        lastUpdated: new Date().toISOString(),
        updateCount: state.updateCount + 1,
        isTransitioning: true,
      };

    case 'SET_PILLAR':
      return {
        ...state,
        currentPillar: action.payload.pillar,
        lastUpdated: new Date().toISOString(),
        updateCount: state.updateCount + 1,
        isTransitioning: true,
      };

    case 'SET_MOTION_LEVEL':
      return {
        ...state,
        currentMotionLevel: action.payload.motionLevel,
        lastUpdated: new Date().toISOString(),
        updateCount: state.updateCount + 1,
        isTransitioning: true,
      };

    case 'REGISTER_COMPONENT':
      return {
        ...state,
        activeBindings: {
          ...state.activeBindings,
          [action.payload.binding.componentId]: action.payload.binding,
        },
        lastUpdated: new Date().toISOString(),
        updateCount: state.updateCount + 1,
      };

    case 'UNREGISTER_COMPONENT':
      const newBindings = { ...state.activeBindings };
      delete newBindings[action.payload.componentId];
      
      // Clean up computed values for unregistered component
      const newComputedClasses = { ...state.computedClasses };
      const newComputedAttributes = { ...state.computedAttributes };
      const newComputedStyles = { ...state.computedStyles };
      
      delete newComputedClasses[action.payload.componentId];
      delete newComputedAttributes[action.payload.componentId];
      delete newComputedStyles[action.payload.componentId];
      
      return {
        ...state,
        activeBindings: newBindings,
        computedClasses: newComputedClasses,
        computedAttributes: newComputedAttributes,
        computedStyles: newComputedStyles,
        lastUpdated: new Date().toISOString(),
        updateCount: state.updateCount + 1,
      };

    case 'UPDATE_SKIN_PROPERTIES':
      const binding = state.activeBindings[action.payload.componentId];
      if (!binding) return state;
      
      return {
        ...state,
        activeBindings: {
          ...state.activeBindings,
          [action.payload.componentId]: {
            ...binding,
            skinProperties: {
              ...binding.skinProperties,
              ...action.payload.properties,
            },
          },
        },
        lastUpdated: new Date().toISOString(),
        updateCount: state.updateCount + 1,
      };

    case 'RESET_STATE':
      return createInitialState(state.currentPreset, state.currentPillar, state.currentMotionLevel);

    case 'LOAD_STATE':
      return {
        ...createInitialState(
          action.payload.state.currentPreset || state.currentPreset,
          action.payload.state.currentPillar || state.currentPillar,
          action.payload.state.currentMotionLevel || state.currentMotionLevel
        ),
        ...action.payload.state,
      };

    default:
      return state;
  }
}

/**
 * Create initial skin state
 */
function createInitialState(
  preset: SkinPresetId = DEFAULT_COMPONENT_SKIN_PRESET,
  pillar: StyleLabPillar = 'frontier',
  motionLevel: MotionLevel = 'full'
): SkinState {
  return {
    currentPreset: preset,
    currentPillar: pillar,
    currentMotionLevel: motionLevel,
    activeBindings: {},
    computedStyles: {},
    computedClasses: {},
    computedAttributes: {},
    lastUpdated: new Date().toISOString(),
    updateCount: 0,
    isTransitioning: false,
  };
}

// ============================================================================
// SKIN MANAGER IMPLEMENTATION
// ============================================================================

export class SkinManager implements ISkinManager {
  private state: SkinState;
  private listeners: Set<(state: SkinState) => void> = new Set();
  private config: SkinSystemConfig;
  private validator: SkinSchemaValidator;
  private presets: Map<SkinPresetId, SkinPresetConfig> = new Map();
  private components: Map<ComponentId, ComponentSkinBinding> = new Map();
  private transitionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: Partial<SkinSystemConfig> = {},
    validator?: SkinSchemaValidator
  ) {
    this.config = {
      enableTelemetry: true,
      enableDebugMode: false,
      enablePerformanceMonitoring: false,
      defaultPreset: DEFAULT_COMPONENT_SKIN_PRESET,
      defaultPillar: 'frontier',
      defaultMotionLevel: 'full',
      maxComponentCount: SKIN_SYSTEM_CONSTANTS.MAX_COMPONENTS,
      updateDebounceMs: SKIN_SYSTEM_CONSTANTS.UPDATE_DEBOUNCE,
      transitionTimeoutMs: SKIN_SYSTEM_CONSTANTS.TRANSITION_TIMEOUT,
      enableStrictValidation: true,
      enableExperimentalFeatures: false,
      enableCache: true,
      cacheMaxAge: SKIN_SYSTEM_CONSTANTS.CACHE_MAX_AGE,
      cacheMaxSize: SKIN_SYSTEM_CONSTANTS.MAX_CACHE_SIZE,
      enablePersistence: true,
      persistenceKey: SKIN_SYSTEM_CONSTANTS.PERSISTENCE_KEY,
      persistenceStrategy: 'localStorage',
      ...config,
    };

    this.validator = validator || new DefaultSkinValidator();
    this.state = createInitialState(
      this.config.defaultPreset,
      this.config.defaultPillar,
      this.config.defaultMotionLevel
    );

    // Load persisted state if enabled
    if (this.config.enablePersistence) {
      this.loadState();
    }
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getState(): SkinState {
    return { ...this.state };
  }

  dispatch(action: SkinAction): void {
    const startTime = performance.now();
    
    try {
      // Validate action if strict validation is enabled
      if (this.config.enableStrictValidation) {
        const validationResult = this.validateAction(action);
        if (!validationResult.isValid) {
          throw new Error(`Invalid action: ${validationResult.errors.map(e => e.message).join(', ')}`);
        }
      }

      const previousState = this.state;
      this.state = skinReducer(this.state, action);

      // Update computed values
      this.updateComputedValues();

      // Notify listeners
      this.notifyListeners();

      // Track telemetry
      if (this.config.enableTelemetry) {
        this.trackActionTelemetry(action, previousState);
      }

      // Handle transitions
      this.handleTransitions(action);

      // Performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        const duration = performance.now() - startTime;
        this.trackEvent('skin_performance', {
          operation: action.type,
          duration,
          componentCount: Object.keys(this.state.activeBindings).length,
        });
      }

    } catch (error) {
      this.handleError(error as Error, action);
      throw error;
    }
  }

  subscribe(listener: (state: SkinState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  private updateComputedValues(): void {
    // Update computed values for all active components
    Object.entries(this.state.activeBindings).forEach(([componentId, binding]) => {
      this.state.computedClasses[componentId] = this.generateClasses(componentId);
      this.state.computedAttributes[componentId] = this.generateAttributes(componentId);
      this.state.computedStyles[componentId] = this.generateStyles(componentId);
    });
  }

  // ============================================================================
  // PRESET MANAGEMENT
  // ============================================================================

  setPreset(presetId: SkinPresetId): void {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    // Validate preset compatibility
    const validation = this.validateTransition(presetId, this.state.currentPillar);
    if (!validation.isValid) {
      throw new Error(`Invalid preset transition: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.dispatch({ type: 'SET_PRESET', payload: { presetId } });
  }

  getPreset(presetId: SkinPresetId): SkinPresetConfig | undefined {
    return this.presets.get(presetId);
  }

  getAllPresets(): SkinPresetConfig[] {
    return Array.from(this.presets.values());
  }

  registerPreset(preset: SkinPresetConfig): void {
    // Validate preset
    const validation = this.validator.validatePreset(preset);
    if (!validation.isValid) {
      throw new Error(`Invalid preset: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.presets.set(preset.id, preset);
  }

  unregisterPreset(presetId: SkinPresetId): boolean {
    return this.presets.delete(presetId);
  }

  // ============================================================================
  // PILLAR MANAGEMENT
  // ============================================================================

  setPillar(pillar: StyleLabPillar): void {
    this.dispatch({ type: 'SET_PILLAR', payload: { pillar } });
  }

  getCurrentPillar(): StyleLabPillar {
    return this.state.currentPillar;
  }

  // ============================================================================
  // MOTION MANAGEMENT
  // ============================================================================

  setMotionLevel(motionLevel: MotionLevel): void {
    this.dispatch({ type: 'SET_MOTION_LEVEL', payload: { motionLevel } });
  }

  getCurrentMotionLevel(): MotionLevel {
    return this.state.currentMotionLevel;
  }

  // ============================================================================
  // COMPONENT MANAGEMENT
  // ============================================================================

  registerComponent(binding: ComponentSkinBinding): void {
    // Check component limit
    if (Object.keys(this.state.activeBindings).length >= this.config.maxComponentCount) {
      throw new Error(`Maximum component count exceeded: ${this.config.maxComponentCount}`);
    }

    // Validate binding
    const validation = this.validator.validateBinding(binding);
    if (!validation.isValid) {
      throw new Error(`Invalid component binding: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.components.set(binding.componentId, binding);
    this.dispatch({ type: 'REGISTER_COMPONENT', payload: { binding } });
  }

  unregisterComponent(componentId: ComponentId): void {
    this.components.delete(componentId);
    this.dispatch({ type: 'UNREGISTER_COMPONENT', payload: { componentId } });
  }

  getComponentBinding(componentId: ComponentId): ComponentSkinBinding | undefined {
    return this.components.get(componentId);
  }

  hasComponent(componentId: ComponentId): boolean {
    return this.components.has(componentId);
  }

  // ============================================================================
  // STYLE GENERATION
  // ============================================================================

  generateClasses(componentId: ComponentId): string[] {
    const binding = this.components.get(componentId);
    if (!binding) {
      return [];
    }

    const preset = this.presets.get(this.state.currentPreset);
    if (!preset) {
      return [];
    }

    const classes: string[] = [];

    // Base class
    classes.push(binding.cssClassBase);

    // Preset class
    classes.push(`${binding.cssClassBase}-${this.state.currentPreset}`);

    // Pillar class
    classes.push(`${binding.cssClassBase}-${this.state.currentPillar}`);

    // Motion class
    if (binding.supportsMotionLevel) {
      classes.push(`${binding.cssClassBase}-motion-${this.state.currentMotionLevel}`);
    }

    // Component-specific classes
    if (binding.skinProperties) {
      Object.entries(binding.skinProperties).forEach(([key, value]) => {
        if (value) {
          classes.push(`${binding.cssClassBase}-${key}-${value}`);
        }
      });
    }

    return classes;
  }

  generateAttributes(componentId: ComponentId): Record<string, string> {
    const binding = this.components.get(componentId);
    if (!binding) {
      return {};
    }

    const attributes: Record<string, string> = {
      [`${binding.dataAttributePrefix}-preset`]: this.state.currentPreset,
      [`${binding.dataAttributePrefix}-pillar`]: this.state.currentPillar,
      [`${binding.dataAttributePrefix}-motion`]: this.state.currentMotionLevel,
      [`${binding.dataAttributePrefix}-component`]: binding.componentId,
    };

    // Component-specific attributes
    if (binding.skinProperties) {
      Object.entries(binding.skinProperties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert camelCase to kebab-case for DOM attributes
          const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
          attributes[`${binding.dataAttributePrefix}-${kebabKey}`] = String(value);
        }
      });
    }

    return attributes;
  }

  generateStyles(componentId: ComponentId): Record<string, string> {
    const binding = this.components.get(componentId);
    if (!binding) {
      return {};
    }

    const preset = this.presets.get(this.state.currentPreset);
    if (!preset) {
      return {};
    }

    const styles: Record<string, string> = {};

    // Apply preset colors
    Object.entries(preset.colors).forEach(([key, value]) => {
      styles[`--${binding.cssClassBase}-color-${key}`] = value;
    });

    // Apply preset animations
    if (binding.supportsMotionLevel && this.state.currentMotionLevel !== 'full') {
      const animationDuration = this.state.currentMotionLevel === 'minimal' 
        ? '0s' 
        : `${preset.animations.duration * 0.5}ms`;
      
      styles[`--${binding.cssClassBase}-animation-duration`] = animationDuration;
    }

    // Apply pillar overrides
    const pillarOverride = preset.pillarOverrides?.[this.state.currentPillar];
    if (pillarOverride?.colors) {
      Object.entries(pillarOverride.colors).forEach(([key, value]) => {
        styles[`--${binding.cssClassBase}-color-${key}`] = value;
      });
    }

    return styles;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  validateState(): ValidationResult {
    return this.validator.validateState(this.state);
  }

  validateTransition(presetId: SkinPresetId, pillar: StyleLabPillar): ValidationResult {
    const preset = this.presets.get(presetId);
    if (!preset) {
      return {
        isValid: false,
        errors: [{
          code: VALIDATION_ERROR_CODES.PRESET_NOT_FOUND,
          message: `Preset not found: ${presetId}`,
          path: 'presetId',
          severity: 'error',
        }],
        warnings: [],
      };
    }

    if (!preset.supportedPillars.includes(pillar)) {
      return {
        isValid: false,
        errors: [{
          code: VALIDATION_ERROR_CODES.INVALID_PILLAR,
          message: `Pillar ${pillar} not supported by preset ${presetId}`,
          path: 'pillar',
          severity: 'error',
        }],
        warnings: [],
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  private validateAction(action: SkinAction): ValidationResult {
    switch (action.type) {
      case 'SET_PRESET':
        return this.validateTransition(action.payload.presetId, this.state.currentPillar);
      
      case 'SET_PILLAR':
        const preset = this.presets.get(this.state.currentPreset);
        if (!preset) {
          return {
            isValid: false,
            errors: [{
              code: VALIDATION_ERROR_CODES.PRESET_NOT_FOUND,
              message: `Current preset not found: ${this.state.currentPreset}`,
              path: 'currentPreset',
              severity: 'error',
            }],
            warnings: [],
          };
        }

        if (!preset.supportedPillars.includes(action.payload.pillar)) {
          return {
            isValid: false,
            errors: [{
              code: VALIDATION_ERROR_CODES.INVALID_PILLAR,
              message: `Pillar ${action.payload.pillar} not supported by current preset`,
              path: 'pillar',
              severity: 'error',
            }],
            warnings: [],
          };
        }

        return { isValid: true, errors: [], warnings: [] };

      case 'SET_MOTION_LEVEL':
        return { isValid: true, errors: [], warnings: [] };

      case 'REGISTER_COMPONENT':
        return this.validator.validateBinding(action.payload.binding);

      case 'UNREGISTER_COMPONENT':
        // Silently succeed if component is already not registered
        return { isValid: true, errors: [], warnings: [] };

      default:
        return { isValid: true, errors: [], warnings: [] };
    }
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  saveState(): void {
    if (!this.config.enablePersistence) {
      return;
    }

    try {
      const stateToSave = {
        ...this.state,
        // Don't save computed values as they can be regenerated
        computedStyles: {},
        computedClasses: {},
        computedAttributes: {},
        isTransitioning: false,
      };

      const serialized = JSON.stringify(stateToSave);
      
      switch (this.config.persistenceStrategy) {
        case 'localStorage':
          localStorage.setItem(this.config.persistenceKey, serialized);
          break;
        case 'sessionStorage':
          sessionStorage.setItem(this.config.persistenceKey, serialized);
          break;
        case 'memory':
          // In-memory persistence is handled by the manager instance
          break;
      }
    } catch (error) {
      this.handleError(error as Error, { type: 'SAVE_STATE' });
    }
  }

  loadState(): void {
    if (!this.config.enablePersistence) {
      return;
    }

    try {
      let serialized: string | null = null;
      
      switch (this.config.persistenceStrategy) {
        case 'localStorage':
          serialized = localStorage.getItem(this.config.persistenceKey);
          break;
        case 'sessionStorage':
          serialized = sessionStorage.getItem(this.config.persistenceKey);
          break;
        case 'memory':
          // In-memory persistence is handled by the manager instance
          return;
      }

      if (serialized) {
        const loadedState = JSON.parse(serialized);
        this.dispatch({ type: 'LOAD_STATE', payload: { state: loadedState } });
      }
    } catch (error) {
      this.handleError(error as Error, { type: 'LOAD_STATE' });
    }
  }

  resetState(): void {
    this.dispatch({ type: 'RESET_STATE' });
    
    if (this.config.enablePersistence) {
      // Clear persisted state
      switch (this.config.persistenceStrategy) {
        case 'localStorage':
          localStorage.removeItem(this.config.persistenceKey);
          break;
        case 'sessionStorage':
          sessionStorage.removeItem(this.config.persistenceKey);
          break;
      }
    }
  }

  // ============================================================================
  // TELEMETRY
  // ============================================================================

  trackEvent<T extends keyof SkinTelemetryEvents>(
    eventType: T,
    payload: Omit<SkinTelemetryEvents[T], keyof SkinTelemetryPayload>
  ): void {
    if (!this.config.enableTelemetry) {
      return;
    }

    try {
      const fullPayload: SkinTelemetryPayload = {
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        presetId: this.state.currentPreset,
        pillar: this.state.currentPillar,
        motionLevel: this.state.currentMotionLevel,
        action: eventType,
        category: this.getEventCategory(eventType),
        severity: 'info',
        ...payload,
      };

      // Send to telemetry system
      if (typeof window !== 'undefined' && (window as any).trackTelemetryEvent) {
        (window as any).trackTelemetryEvent(eventType, fullPayload);
      }

      // Debug logging
      if (this.config.enableDebugMode) {
        console.log(`[SkinManager] Event: ${eventType}`, fullPayload);
      }
    } catch (error) {
      this.handleError(error as Error, { type: 'TRACK_EVENT', eventType });
    }
  }

  private trackActionTelemetry(action: SkinAction, previousState: SkinState): void {
    switch (action.type) {
      case 'SET_PRESET':
        this.trackEvent('skin_preset_changed', {
          previousPreset: previousState.currentPreset,
          newPreset: action.payload.presetId,
          changeReason: 'user',
        });
        break;

      case 'SET_PILLAR':
        this.trackEvent('skin_pillar_changed', {
          previousPillar: previousState.currentPillar,
          newPillar: action.payload.pillar,
          changeReason: 'user',
        });
        break;

      case 'SET_MOTION_LEVEL':
        this.trackEvent('skin_motion_changed', {
          previousMotionLevel: previousState.currentMotionLevel,
          newMotionLevel: action.payload.motionLevel,
          changeReason: 'user',
        });
        break;

      case 'REGISTER_COMPONENT':
        this.trackEvent('skin_component_registered', {
          componentId: action.payload.binding.componentId,
          binding: action.payload.binding,
        });
        break;

      case 'UNREGISTER_COMPONENT':
        this.trackEvent('skin_component_unregistered', {
          componentId: action.payload.componentId,
          reason: 'user',
        });
        break;
    }
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('skin-session-id');
      if (!sessionId) {
        sessionId = `skin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('skin-session-id', sessionId);
      }
      return sessionId;
    }
    return `skin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEventCategory(eventType: keyof SkinTelemetryEvents): 'skin' | 'component' | 'system' {
    if (eventType.startsWith('skin_')) return 'skin';
    if (eventType.includes('component')) return 'component';
    return 'system';
  }

  // ============================================================================
  // TRANSITION HANDLING
  // ============================================================================

  private handleTransitions(action: SkinAction): void {
    // Clear existing transition timeout
    const existingTimeout = this.transitionTimeouts.get('global');
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new transition timeout
    const timeout = setTimeout(() => {
      this.state.isTransitioning = false;
      this.notifyListeners();
    }, this.config.transitionTimeoutMs);

    this.transitionTimeouts.set('global', timeout);
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: Error, context: any): void {
    console.error('[SkinManager] Error:', error, context);
    
    this.trackEvent('skin_error', {
      error: error.message,
      stack: error.stack,
      context,
    });
  }
}

// ============================================================================
// DEFAULT VALIDATOR
// ============================================================================

class DefaultSkinValidator implements SkinSchemaValidator {
  validatePreset(config: SkinPresetConfig): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic validation
    if (!config.id) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Preset ID is required',
        path: 'id',
        severity: 'error',
      });
    }

    if (!config.name) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Preset name is required',
        path: 'name',
        severity: 'error',
      });
    }

    if (!config.colors) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Colors configuration is required',
        path: 'colors',
        severity: 'error',
      });
    }

    // Color format validation
    if (config.colors) {
      Object.entries(config.colors).forEach(([key, value]) => {
        if (!this.isValidColor(value)) {
          errors.push({
            code: VALIDATION_ERROR_CODES.INVALID_COLOR_FORMAT,
            message: `Invalid color format for ${key}: ${value}`,
            path: `colors.${key}`,
            severity: 'error',
          });
        }
      });
    }

    // Animation validation
    if (config.animations && config.animations.duration < 0) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_ANIMATION_CONFIG,
        message: 'Animation duration must be positive',
        path: 'animations.duration',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateBinding(binding: ComponentSkinBinding): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!binding.componentId) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Component ID is required',
        path: 'componentId',
        severity: 'error',
      });
    }

    if (!binding.cssClassBase) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'CSS class base is required',
        path: 'cssClassBase',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateState(state: SkinState): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic state validation
    if (!state.currentPreset) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Current preset is required',
        path: 'currentPreset',
        severity: 'error',
      });
    }

    if (!state.currentPillar) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Current pillar is required',
        path: 'currentPillar',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateTransition(from: SkinState, to: SkinState): ValidationResult {
    // Basic transition validation - can be extended
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  private isValidColor(color: string): boolean {
    // Simple color validation - can be extended
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) ||
           /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color) ||
           /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color) ||
           /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/.test(color) ||
           /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/.test(color) ||
           /^[a-z-]+$/.test(color);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalSkinManager: SkinManager | null = null;

export function getSkinManager(config?: Partial<SkinSystemConfig>): SkinManager {
  if (!globalSkinManager) {
    globalSkinManager = new SkinManager(config);
  }
  return globalSkinManager;
}

export function resetSkinManager(): void {
  globalSkinManager = null;
}
