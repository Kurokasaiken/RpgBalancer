/**
 * Skin Registry
 * 
 * Central registry system for managing skin presets, component bindings,
 * and skin-related configurations with validation and event handling.
 */

// Define all types locally to avoid import issues
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
  validateState(state: any): ValidationResult;
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

interface RegistryEntry<T> {
  id: string;
  data: T;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

interface ISkinRegistry<T> {
  register(entry: RegistryEntry<T>): void;
  unregister(id: string): void;
  get(id: string): RegistryEntry<T> | undefined;
  getAll(): RegistryEntry<T>[];
  clear(): void;
  size(): number;
  has(id: string): boolean;
  onRegister: (id: string, entry: RegistryEntry<T>) => void;
  onUnregister: (id: string) => void;
  onUpdate: (id: string, entry: RegistryEntry<T>) => void;
}

type ComponentRegistryEntry = RegistryEntry<ComponentSkinBinding>;
type PresetRegistryEntry = RegistryEntry<SkinPresetConfig>;

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

export class SkinRegistry<T> implements ISkinRegistry<T> {
  private entries: Map<string, RegistryEntry<T>> = new Map();
  private validator: SkinSchemaValidator;
  private eventListeners: Map<string, Set<(entry: RegistryEntry<T>) => void>> = new Map();

  constructor(validator?: SkinSchemaValidator) {
    this.validator = validator || new DefaultSkinValidator();
  }

  // ============================================================================
  // BASIC OPERATIONS
  // ============================================================================

  register(entry: RegistryEntry<T>): void {
    // Validate entry
    const validation = this.validate(entry);
    if (!validation.isValid) {
      throw new Error(`Invalid registry entry: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check for existing entry
    if (this.entries.has(entry.id)) {
      throw new Error(`Entry already exists: ${entry.id}`);
    }

    // Register entry
    this.entries.set(entry.id, entry);

    // Emit event
    this.emitEvent('onRegister', entry);
  }

  unregister(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    // Remove entry
    this.entries.delete(id);

    // Emit event
    this.emitEvent('onUnregister', entry);

    return true;
  }

  get(id: string): RegistryEntry<T> | undefined {
    return this.entries.get(id);
  }

  getAll(): RegistryEntry<T>[] {
    return Array.from(this.entries.values());
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  findByTag(tag: string): RegistryEntry<T>[] {
    return this.getAll().filter(entry => 
      entry.metadata.tags.includes(tag)
    );
  }

  findByCategory(category: string): RegistryEntry<T>[] {
    return this.getAll().filter(entry => 
      entry.metadata.category === category
    );
  }

  search(query: string): RegistryEntry<T>[] {
    const lowerQuery = query.toLowerCase();
    
    return this.getAll().filter(entry => 
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.id.toLowerCase().includes(lowerQuery) ||
      entry.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  validate(entry: RegistryEntry<T>): ValidationResult {
    // Basic validation
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!entry.id) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Entry ID is required',
        path: 'id',
        severity: 'error',
      });
    }

    if (!entry.name) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Entry name is required',
        path: 'name',
        severity: 'error',
      });
    }

    if (!entry.version) {
      errors.push({
        code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Entry version is required',
        path: 'version',
        severity: 'error',
      });
    }

    // Type-specific validation
    if (this.isPresetEntry(entry)) {
      const presetValidation = this.validator.validatePreset(entry.data);
      errors.push(...presetValidation.errors);
      warnings.push(...presetValidation.warnings);
    } else if (this.isComponentEntry(entry)) {
      const componentValidation = this.validator.validateBinding(entry.data);
      errors.push(...componentValidation.errors);
      warnings.push(...componentValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  onRegister(listener: (entry: RegistryEntry<T>) => void): void {
    this.addEventListener('onRegister', listener);
  }

  onUnregister(listener: (id: string) => void): void {
    this.addEventListener('onUnregister', (entry: RegistryEntry<T>) => {
      listener(entry.id);
    });
  }

  onUpdate(listener: (entry: RegistryEntry<T>) => void): void {
    this.addEventListener('onUpdate', listener);
  }

  private addEventListener(event: string, listener: (entry: RegistryEntry<T>) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  private emitEvent(event: string, entry: RegistryEntry<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(entry);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // ============================================================================
  // TYPE GUARDS
  // ============================================================================

  private isPresetEntry(entry: RegistryEntry<T>): entry is PresetRegistryEntry {
    return this.isSkinPresetConfig(entry.data);
  }

  private isComponentEntry(entry: RegistryEntry<T>): entry is ComponentRegistryEntry {
    return this.isComponentSkinBinding(entry.data);
  }

  private isSkinPresetConfig(data: any): data is SkinPresetConfig {
    return data && 
           typeof data.id === 'string' &&
           typeof data.name === 'string' &&
           typeof data.colors === 'object' &&
           Array.isArray(data.supportedPillars);
  }

  private isComponentSkinBinding(data: any): data is ComponentSkinBinding {
    return data && 
           typeof data.componentId === 'string' &&
           typeof data.cssClassBase === 'string' &&
           typeof data.defaultPreset === 'string' &&
           Array.isArray(data.supportedPillars);
  }
}

// ============================================================================
// SPECIALIZED REGISTRIES
// ============================================================================

/**
 * Preset registry for managing skin presets
 */
export class PresetRegistry extends SkinRegistry<SkinPresetConfig> {
  constructor(validator?: SkinSchemaValidator) {
    super(validator);
  }

  /**
   * Get presets by pillar support
   */
  findByPillar(pillar: string): PresetRegistryEntry[] {
    return this.getAll().filter(entry => 
      entry.data.supportedPillars.includes(pillar as any)
    );
  }

  /**
   * Get presets by category
   */
  findByPresetCategory(category: string): PresetRegistryEntry[] {
    return this.getAll().filter(entry => 
      entry.data.category === category
    );
  }

  /**
   * Get default preset
   */
  getDefault(): PresetRegistryEntry | undefined {
    return this.getAll().find(entry => entry.data.isDefault);
  }

  /**
   * Get experimental presets
   */
  getExperimental(): PresetRegistryEntry[] {
    return this.getAll().filter(entry => entry.data.isExperimental);
  }

  /**
   * Register preset with automatic ID generation
   */
  registerPreset(config: Omit<SkinPresetConfig, 'id'>): string {
    const id = this.generatePresetId(config.name);
    const entry: PresetRegistryEntry = {
      id,
      name: config.name,
      description: config.description,
      version: config.version,
      data: { ...config, id } as SkinPresetConfig,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: config.author,
        tags: config.tags,
        category: config.category,
      },
    };

    this.register(entry);
    return id;
  }

  private generatePresetId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

/**
 * Component registry for managing component bindings
 */
export class ComponentRegistry extends SkinRegistry<ComponentSkinBinding> {
  constructor(validator?: SkinSchemaValidator) {
    super(validator);
  }

  /**
   * Get components by preset support
   */
  findByPreset(presetId: SkinPresetId): ComponentRegistryEntry[] {
    return this.getAll().filter(entry => 
      entry.data.defaultPreset === presetId ||
      (entry.data.skinProperties?.supportedPresets as string[])?.includes(presetId)
    );
  }

  /**
   * Get components by pillar support
   */
  findByPillar(pillar: string): ComponentRegistryEntry[] {
    return this.getAll().filter(entry => 
      entry.data.supportedPillars.includes(pillar as any)
    );
  }

  /**
   * Get components by category
   */
  findByComponentCategory(category: string): ComponentRegistryEntry[] {
    return this.getAll().filter(entry => 
      entry.data.category === category
    );
  }

  /**
   * Get components that support motion
   */
  findMotionSupported(): ComponentRegistryEntry[] {
    return this.getAll().filter(entry => entry.data.supportsMotionLevel);
  }

  /**
   * Get components that support telemetry
   */
  findTelemetrySupported(): ComponentRegistryEntry[] {
    return this.getAll().filter(entry => entry.data.supportsTelemetry);
  }

  /**
   * Register component binding with automatic validation
   */
  registerComponent(binding: Omit<ComponentSkinBinding, 'version'>): string {
    const version = this.generateVersion();
    const entry: ComponentRegistryEntry = {
      id: binding.componentId,
      name: binding.name,
      description: binding.description,
      version,
      data: { ...binding, version } as ComponentSkinBinding,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'system',
        tags: binding.tags,
        category: binding.category,
      },
    };

    this.register(entry);
    return binding.componentId;
  }

  private generateVersion(): string {
    return `1.0.${Date.now()}`;
  }
}

// ============================================================================
// REGISTRY MANAGER
// ============================================================================

/**
 * Central registry manager that coordinates both preset and component registries
 */
export class SkinRegistryManager {
  private presetRegistry: PresetRegistry;
  private componentRegistry: ComponentRegistry;
  private validator: SkinSchemaValidator;

  constructor(validator?: SkinSchemaValidator) {
    this.validator = validator || new DefaultSkinValidator();
    this.presetRegistry = new PresetRegistry(this.validator);
    this.componentRegistry = new ComponentRegistry(this.validator);
  }

  // ============================================================================
  // PRESET REGISTRY ACCESS
  // ============================================================================

  get presets(): PresetRegistry {
    return this.presetRegistry;
  }

  // ============================================================================
  // COMPONENT REGISTRY ACCESS
  // ============================================================================

  get components(): ComponentRegistry {
    return this.componentRegistry;
  }

  // ============================================================================
  // CROSS-REGISTRY OPERATIONS
  // ============================================================================

  /**
   * Get all compatible presets for a component
   */
  getCompatiblePresets(componentId: ComponentId): PresetRegistryEntry[] {
    const component = this.componentRegistry.get(componentId);
    if (!component) {
      return [];
    }

    return this.presetRegistry.getAll().filter(preset =>
      preset.data.supportedComponents.includes(componentId) ||
      component.data.supportedPillars.some(pillar => preset.data.supportedPillars.includes(pillar))
    );
  }

  /**
   * Get all compatible components for a preset
   */
  getCompatibleComponents(presetId: SkinPresetId): ComponentRegistryEntry[] {
    const preset = this.presetRegistry.get(presetId);
    if (!preset) {
      return [];
    }

    return this.componentRegistry.getAll().filter(component =>
      preset.data.supportedComponents.includes(component.data.componentId) ||
      component.data.supportedPillars.some(pillar => preset.data.supportedPillars.includes(pillar))
    );
  }

  /**
   * Validate compatibility between preset and component
   */
  validateCompatibility(presetId: SkinPresetId, componentId: ComponentId): ValidationResult {
    const preset = this.presetRegistry.get(presetId);
    const component = this.componentRegistry.get(componentId);

    const errors: any[] = [];
    const warnings: any[] = [];

    if (!preset) {
      errors.push({
        code: VALIDATION_ERROR_CODES.PRESET_NOT_FOUND,
        message: `Preset not found: ${presetId}`,
        path: 'presetId',
        severity: 'error',
      });
    }

    if (!component) {
      errors.push({
        code: VALIDATION_ERROR_CODES.COMPONENT_NOT_FOUND,
        message: `Component not found: ${componentId}`,
        path: 'componentId',
        severity: 'error',
      });
    }

    if (preset && component) {
      // Check pillar compatibility
      const compatiblePillars = component.data.supportedPillars.filter(pillar =>
        preset.data.supportedPillars.includes(pillar)
      );

      if (compatiblePillars.length === 0) {
        errors.push({
          code: VALIDATION_ERROR_CODES.INVALID_PILLAR,
          message: `No compatible pillars between preset ${presetId} and component ${componentId}`,
          path: 'compatibility',
          severity: 'error',
        });
      }

      // Check explicit component support
      if (!preset.data.supportedComponents.includes(componentId)) {
        warnings.push({
          code: VALIDATION_ERROR_CODES.VALIDATION_FAILED,
          message: `Component ${componentId} not explicitly supported by preset ${presetId}`,
          path: 'compatibility',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    presets: { total: number; byCategory: Record<string, number>; byPillar: Record<string, number> };
    components: { total: number; byCategory: Record<string, number>; byPillar: Record<string, number> };
    compatibility: { compatiblePairs: number; totalPairs: number };
  } {
    const presets = this.presetRegistry.getAll();
    const components = this.componentRegistry.getAll();

    // Preset statistics
    const presetStats = {
      total: presets.length,
      byCategory: presets.reduce((acc, preset) => {
        acc[preset.data.category] = (acc[preset.data.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPillar: presets.reduce((acc, preset) => {
        preset.data.supportedPillars.forEach(pillar => {
          acc[pillar] = (acc[pillar] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
    };

    // Component statistics
    const componentStats = {
      total: components.length,
      byCategory: components.reduce((acc, component) => {
        acc[component.data.category] = (acc[component.data.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPillar: components.reduce((acc, component) => {
        component.data.supportedPillars.forEach(pillar => {
          acc[pillar] = (acc[pillar] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
    };

    // Compatibility statistics
    let compatiblePairs = 0;
    const totalPairs = presets.length * components.length;

    presets.forEach(preset => {
      components.forEach(component => {
        const compatibility = this.validateCompatibility(preset.data.id, component.data.componentId);
        if (compatibility.isValid) {
          compatiblePairs++;
        }
      });
    });

    return {
      presets: presetStats,
      components: componentStats,
      compatibility: {
        compatiblePairs,
        totalPairs,
      },
    };
  }

  /**
   * Export registry data
   */
  export(): {
    presets: PresetRegistryEntry[];
    components: ComponentRegistryEntry[];
    exportedAt: string;
    version: string;
  } {
    return {
      presets: this.presetRegistry.getAll(),
      components: this.componentRegistry.getAll(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Import registry data
   */
  import(data: {
    presets: PresetRegistryEntry[];
    components: ComponentRegistryEntry[];
  }): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Import presets
    data.presets.forEach(preset => {
      try {
        this.presetRegistry.register(preset);
      } catch (error) {
        errors.push({
          code: VALIDATION_ERROR_CODES.VALIDATION_FAILED,
          message: `Failed to import preset ${preset.id}: ${(error as Error).message}`,
          path: `presets.${preset.id}`,
          severity: 'error',
        });
      }
    });

    // Import components
    data.components.forEach(component => {
      try {
        this.componentRegistry.register(component);
      } catch (error) {
        errors.push({
          code: VALIDATION_ERROR_CODES.VALIDATION_FAILED,
          message: `Failed to import component ${component.id}: ${(error as Error).message}`,
          path: `components.${component.id}`,
          severity: 'error',
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Clear all registries
   */
  clear(): void {
    // Clear all entries
    this.presetRegistry.getAll().forEach(preset => {
      this.presetRegistry.unregister(preset.id);
    });

    this.componentRegistry.getAll().forEach(component => {
      this.componentRegistry.unregister(component.id);
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

    // Color validation
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

  validateState(state: any): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  validateTransition(from: any, to: any): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) ||
           /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color) ||
           /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color) ||
           /^[a-z-]+$/.test(color);
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let globalRegistryManager: SkinRegistryManager | null = null;

export function getSkinRegistryManager(): SkinRegistryManager {
  if (!globalRegistryManager) {
    globalRegistryManager = new SkinRegistryManager();
  }
  return globalRegistryManager;
}

export function resetSkinRegistryManager(): void {
  globalRegistryManager = null;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { SkinRegistry as BaseSkinRegistry };
export type { RegistryEntry, PresetRegistryEntry, ComponentRegistryEntry };
