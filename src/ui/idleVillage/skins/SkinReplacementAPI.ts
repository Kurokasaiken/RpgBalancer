/**
 * Skin Replacement API
 * 
 * Centralized API for dynamic skin replacement and runtime skin management.
 * Provides methods for hot-swapping skins, managing replacements, and tracking changes.
 */

import { getSkinManager, SkinManager } from './SkinManager';
import { getSkinRegistryManager, SkinRegistryManager } from './SkinRegistry';

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

type SkinAction = 
  | { type: 'SET_PRESET'; payload: SkinPresetId }
  | { type: 'SET_PILLAR'; payload: StyleLabPillar }
  | { type: 'SET_MOTION_LEVEL'; payload: MotionLevel }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'REGISTER_COMPONENT'; payload: { binding: ComponentSkinBinding } }
  | { type: 'UNREGISTER_COMPONENT'; payload: { componentId: ComponentId } }
  | { type: 'UPDATE_SKIN_PROPERTIES'; payload: { componentId: ComponentId; properties: Record<string, unknown> } };

interface SkinPresetConfig {
  id: SkinPresetId;
  name: string;
  description: string;
  category: string;
  colors: Record<string, string>;
  animations: Record<string, any>;
  components: Record<string, any>;
}

// ============================================================================
// REPLACEMENT API TYPES
// ============================================================================

export interface SkinReplacementOptions {
  /**
   * Whether to validate compatibility before replacement
   * @default true
   */
  validateCompatibility?: boolean;
  
  /**
   * Whether to preserve current pillar/motion when replacing preset
   * @default true
   */
  preserveCurrentState?: boolean;
  
  /**
   * Whether to animate the transition
   * @default true
   */
  animateTransition?: boolean;
  
  /**
   * Transition duration in milliseconds
   * @default 300
   */
  transitionDuration?: number;
  
  /**
   * Whether to track telemetry for the replacement
   * @default true
   */
  trackTelemetry?: boolean;
  
  /**
   * Custom metadata for the replacement
   */
  metadata?: Record<string, any>;
}

export interface SkinReplacementResult {
  /**
   * Whether the replacement was successful
   */
  success: boolean;
  
  /**
   * Previous state before replacement
   */
  previousState: {
    presetId: SkinPresetId;
    pillar: StyleLabPillar;
    motionLevel: MotionLevel;
  };
  
  /**
   * New state after replacement
   */
  newState: {
    presetId: SkinPresetId;
    pillar: StyleLabPillar;
    motionLevel: MotionLevel;
  };
  
  /**
   * Validation results (if validation was performed)
   */
  validation?: {
    isValid: boolean;
    errors: any[];
    warnings: any[];
  };
  
  /**
   * Error message if replacement failed
   */
  error?: string;
  
  /**
   * Metadata about the replacement
   */
  metadata: {
    timestamp: string;
    duration: number;
    reason: string;
    source: string;
  };
}

export interface SkinReplacementHistory {
  /**
   * Unique identifier for the replacement
   */
  id: string;
  
  /**
   * Replacement result
   */
  result: SkinReplacementResult;
  
  /**
   * Whether this replacement can be undone
   */
  canUndo: boolean;
  
  /**
   * User who performed the replacement
   */
  user?: string;
  
  /**
   * Session identifier
   */
  sessionId: string;
}

export interface SkinReplacementRule {
  /**
   * Unique identifier for the rule
   */
  id: string;
  
  /**
   * Rule name
   */
  name: string;
  
  /**
   * Rule description
   */
  description: string;
  
  /**
   * Condition function that determines when to apply this rule
   */
  condition: (state: SkinState) => boolean;
  
  /**
   * Replacement function that returns the target state
   */
  replacement: (state: SkinState) => Partial<SkinState>;
  
  /**
   * Whether the rule is enabled
   */
  enabled: boolean;
  
  /**
   * Rule priority (higher = more priority)
   */
  priority: number;
  
  /**
   * Rule metadata
   */
  metadata?: Record<string, any>;
}

export interface SkinReplacementAPIConfig {
  /**
   * Maximum number of replacement history entries to keep
   * @default 50
   */
  maxHistorySize?: number;
  
  /**
   * Whether to enable automatic replacement rules
   * @default false
   */
  enableAutoRules?: boolean;
  
  /**
   * Whether to enable replacement validation
   * @default true
   */
  enableValidation?: boolean;
  
  /**
   * Whether to enable replacement telemetry
   * @default true
   */
  enableTelemetry?: boolean;
  
  /**
   * Whether to enable debug mode
   * @default false
   */
  enableDebugMode?: boolean;
}

// ============================================================================
// SKIN REPLACEMENT API
// ============================================================================

export class SkinReplacementAPI {
  private manager: SkinManager;
  private registry: SkinRegistryManager;
  private config: Required<SkinReplacementAPIConfig>;
  private history: SkinReplacementHistory[] = [];
  private rules: Map<string, SkinReplacementRule> = new Map();
  private sessionId: string;
  private isDestroyed = false;

  constructor(config: SkinReplacementAPIConfig = {}) {
    this.manager = getSkinManager();
    this.registry = getSkinRegistryManager();
    this.config = {
      maxHistorySize: 50,
      enableAutoRules: false,
      enableValidation: true,
      enableTelemetry: true,
      enableDebugMode: false,
      ...config,
    };
    this.sessionId = this.generateSessionId();
    
    // Subscribe to manager changes for auto-rules
    if (this.config.enableAutoRules) {
      this.manager.subscribe(() => this.checkAutoRules());
    }
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Replace the current preset with a new one
   */
  async replacePreset(
    newPresetId: SkinPresetId,
    options: SkinReplacementOptions = {}
  ): Promise<SkinReplacementResult> {
    const startTime = performance.now();
    const previousState = this.manager.getState();
    
    try {
      // Validate new preset
      if (options.validateCompatibility !== false && this.config.enableValidation) {
        const validation = this.validatePresetReplacement(newPresetId, previousState);
        if (!validation.isValid) {
          return this.createFailureResult(previousState, {
            presetId: newPresetId,
            pillar: previousState.currentPillar,
            motionLevel: previousState.currentMotionLevel,
          }, validation.errors.join(', '), startTime);
        }
      }

      // Get new preset
      const newPreset = this.manager.getPreset(newPresetId);
      if (!newPreset) {
        return this.createFailureResult(previousState, {
          presetId: newPresetId,
          pillar: previousState.currentPillar,
          motionLevel: previousState.currentMotionLevel,
        }, `Preset not found: ${newPresetId}`, startTime);
      }

      // Determine target state
      const targetPillar = options.preserveCurrentState !== false 
        ? this.findCompatiblePillar(newPreset, previousState.currentPillar)
        : newPreset.supportedPillars[0];
      
      const targetMotion = options.preserveCurrentState !== false
        ? this.findCompatibleMotionLevel(newPreset, previousState.currentMotionLevel)
        : newPreset.supportedMotionLevels[0];

      // Apply replacement
      if (options.animateTransition !== false) {
        await this.animateReplacement(previousState, {
          presetId: newPresetId,
          pillar: targetPillar,
          motionLevel: targetMotion,
        }, options.transitionDuration);
      } else {
        this.manager.setPreset(newPresetId);
        this.manager.setPillar(targetPillar);
        this.manager.setMotionLevel(targetMotion);
      }

      const newState = this.manager.getState();
      const duration = performance.now() - startTime;

      // Track telemetry
      if (options.trackTelemetry !== false && this.config.enableTelemetry) {
        this.manager.trackEvent('skin_preset_replaced', {
          previousPreset: previousState.currentPreset,
          newPreset: newPresetId,
          previousPillar: previousState.currentPillar,
          newPillar: targetPillar,
          previousMotion: previousState.currentMotionLevel,
          newMotion: targetMotion,
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        });
      }

      // Create result and add to history
      const result: SkinReplacementResult = {
        success: true,
        previousState: {
          presetId: previousState.currentPreset,
          pillar: previousState.currentPillar,
          motionLevel: previousState.currentMotionLevel,
        },
        newState: {
          presetId: newState.currentPreset,
          pillar: newState.currentPillar,
          motionLevel: newState.currentMotionLevel,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        },
      };

      this.addToHistory(result, options.metadata?.user);

      return result;

    } catch (error) {
      return this.createFailureResult(previousState, {
        presetId: newPresetId,
        pillar: previousState.currentPillar,
        motionLevel: previousState.currentMotionLevel,
      }, error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  /**
   * Replace the current pillar with a new one
   */
  async replacePillar(
    newPillar: StyleLabPillar,
    options: SkinReplacementOptions = {}
  ): Promise<SkinReplacementResult> {
    const startTime = performance.now();
    const previousState = this.manager.getState();
    
    try {
      // Validate pillar compatibility
      if (options.validateCompatibility !== false && this.config.enableValidation) {
        const validation = this.validatePillarReplacement(newPillar, previousState);
        if (!validation.isValid) {
          return this.createFailureResult(previousState, {
            presetId: previousState.currentPreset,
            pillar: newPillar,
            motionLevel: previousState.currentMotionLevel,
          }, validation.errors.join(', '), startTime);
        }
      }

      // Apply replacement
      if (options.animateTransition !== false) {
        await this.animateReplacement(previousState, {
          presetId: previousState.currentPreset,
          pillar: newPillar,
          motionLevel: previousState.currentMotionLevel,
        }, options.transitionDuration);
      } else {
        this.manager.setPillar(newPillar);
      }

      const newState = this.manager.getState();
      const duration = performance.now() - startTime;

      // Track telemetry
      if (options.trackTelemetry !== false && this.config.enableTelemetry) {
        this.manager.trackEvent('skin_pillar_replaced', {
          presetId: previousState.currentPreset,
          pillar: newPillar,
          previousPillar: previousState.currentPillar,
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        });
      }

      const result: SkinReplacementResult = {
        success: true,
        previousState: {
          presetId: previousState.currentPreset,
          pillar: previousState.currentPillar,
          motionLevel: previousState.currentMotionLevel,
        },
        newState: {
          presetId: newState.currentPreset,
          pillar: newState.currentPillar,
          motionLevel: newState.currentMotionLevel,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        },
      };

      this.addToHistory(result, options.metadata?.user);

      return result;

    } catch (error) {
      return this.createFailureResult(previousState, {
        presetId: previousState.currentPreset,
        pillar: newPillar,
        motionLevel: previousState.currentMotionLevel,
      }, error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  /**
   * Replace the current motion level with a new one
   */
  async replaceMotionLevel(
    newMotionLevel: MotionLevel,
    options: SkinReplacementOptions = {}
  ): Promise<SkinReplacementResult> {
    const startTime = performance.now();
    const previousState = this.manager.getState();
    
    try {
      // Validate motion level compatibility
      if (options.validateCompatibility !== false && this.config.enableValidation) {
        const validation = this.validateMotionReplacement(newMotionLevel, previousState);
        if (!validation.isValid) {
          return this.createFailureResult(previousState, {
            presetId: previousState.currentPreset,
            pillar: previousState.currentPillar,
            motionLevel: newMotionLevel,
          }, validation.errors.join(', '), startTime);
        }
      }

      // Apply replacement
      if (options.animateTransition !== false) {
        await this.animateReplacement(previousState, {
          presetId: previousState.currentPreset,
          pillar: previousState.currentPillar,
          motionLevel: newMotionLevel,
        }, options.transitionDuration);
      } else {
        this.manager.setMotionLevel(newMotionLevel);
      }

      const newState = this.manager.getState();
      const duration = performance.now() - startTime;

      // Track telemetry
      if (options.trackTelemetry !== false && this.config.enableTelemetry) {
        this.manager.trackEvent('skin_motion_replaced', {
          presetId: previousState.currentPreset,
          motionLevel: newMotionLevel,
          previousMotion: previousState.currentMotionLevel,
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        });
      }

      const result: SkinReplacementResult = {
        success: true,
        previousState: {
          presetId: previousState.currentPreset,
          pillar: previousState.currentPillar,
          motionLevel: previousState.currentMotionLevel,
        },
        newState: {
          presetId: newState.currentPreset,
          pillar: newState.currentPillar,
          motionLevel: newState.currentMotionLevel,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        },
      };

      this.addToHistory(result, options.metadata?.user);

      return result;

    } catch (error) {
      return this.createFailureResult(previousState, {
        presetId: previousState.currentPreset,
        pillar: previousState.currentPillar,
        motionLevel: newMotionLevel,
      }, error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  /**
   * Replace the entire skin state
   */
  async replaceState(
    targetState: Partial<SkinState>,
    options: SkinReplacementOptions = {}
  ): Promise<SkinReplacementResult> {
    const startTime = performance.now();
    const previousState = this.manager.getState();
    
    try {
      // Validate target state
      if (options.validateCompatibility !== false && this.config.enableValidation) {
        const validation = this.validateStateReplacement(targetState, previousState);
        if (!validation.isValid) {
          return this.createFailureResult(previousState, {
            presetId: targetState.currentPreset || previousState.currentPreset,
            pillar: targetState.currentPillar || previousState.currentPillar,
            motionLevel: targetState.currentMotionLevel || previousState.currentMotionLevel,
          }, validation.errors.join(', '), startTime);
        }
      }

      // Apply replacements in order
      const replacements: Promise<void>[] = [];
      
      if (targetState.currentPreset && targetState.currentPreset !== previousState.currentPreset) {
        replacements.push(Promise.resolve(this.manager.setPreset(targetState.currentPreset)));
      }
      
      if (targetState.currentPillar && targetState.currentPillar !== previousState.currentPillar) {
        replacements.push(Promise.resolve(this.manager.setPillar(targetState.currentPillar)));
      }
      
      if (targetState.currentMotionLevel && targetState.currentMotionLevel !== previousState.currentMotionLevel) {
        replacements.push(Promise.resolve(this.manager.setMotionLevel(targetState.currentMotionLevel)));
      }

      if (options.animateTransition !== false) {
        await this.animateReplacement(previousState, {
          presetId: targetState.currentPreset || previousState.currentPreset,
          pillar: targetState.currentPillar || previousState.currentPillar,
          motionLevel: targetState.currentMotionLevel || previousState.currentMotionLevel,
        }, options.transitionDuration);
      } else {
        await Promise.all(replacements);
      }

      const newState = this.manager.getState();
      const duration = performance.now() - startTime;

      // Track telemetry
      if (options.trackTelemetry !== false && this.config.enableTelemetry) {
        this.manager.trackEvent('skin_state_replaced', {
          previousState,
          newState,
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        });
      }

      const result: SkinReplacementResult = {
        success: true,
        previousState: {
          presetId: previousState.currentPreset,
          pillar: previousState.currentPillar,
          motionLevel: previousState.currentMotionLevel,
        },
        newState: {
          presetId: newState.currentPreset,
          pillar: newState.currentPillar,
          motionLevel: newState.currentMotionLevel,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          reason: options.metadata?.reason || 'manual',
          source: options.metadata?.source || 'api',
        },
      };

      this.addToHistory(result, options.metadata?.user);

      return result;

    } catch (error) {
      return this.createFailureResult(previousState, {
        presetId: targetState.currentPreset || previousState.currentPreset,
        pillar: targetState.currentPillar || previousState.currentPillar,
        motionLevel: targetState.currentMotionLevel || previousState.currentMotionLevel,
      }, error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  /**
   * Undo the last replacement
   */
  async undoLastReplacement(): Promise<SkinReplacementResult | null> {
    const lastEntry = this.history.find(entry => entry.canUndo);
    if (!lastEntry) {
      return null;
    }

    const { previousState } = lastEntry.result;
    return this.replaceState(previousState, {
      validateCompatibility: false,
      animateTransition: true,
      trackTelemetry: true,
      metadata: {
        reason: 'undo',
        source: 'api',
        originalReplacementId: lastEntry.id,
      },
    });
  }

  /**
   * Get replacement history
   */
  getHistory(): SkinReplacementHistory[] {
    return [...this.history];
  }

  /**
   * Clear replacement history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Add a replacement rule
   */
  addRule(rule: SkinReplacementRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a replacement rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get all replacement rules
   */
  getRules(): SkinReplacementRule[] {
    return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Enable/disable a replacement rule
   */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get available presets for replacement
   */
  getAvailablePresets(): SkinPresetConfig[] {
    return this.manager.getAllPresets();
  }

  /**
   * Get compatible presets for current state
   */
  getCompatiblePresets(): SkinPresetConfig[] {
    const currentState = this.manager.getState();
    return this.manager.getAllPresets().filter(preset => 
      preset.supportedPillars.includes(currentState.currentPillar) &&
      preset.supportedMotionLevels.includes(currentState.currentMotionLevel)
    );
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    sessionId: string;
    totalReplacements: number;
    successfulReplacements: number;
    failedReplacements: number;
    averageDuration: number;
    mostReplacedPreset: SkinPresetId | null;
    mostReplacedPillar: StyleLabPillar | null;
    mostReplacedMotion: MotionLevel | null;
  } {
    const successful = this.history.filter(entry => entry.result.success);
    const failed = this.history.filter(entry => !entry.result.success);
    const durations = successful.map(entry => entry.result.metadata.duration);
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;

    // Count most replaced items
    const presetCounts = new Map<SkinPresetId, number>();
    const pillarCounts = new Map<StyleLabPillar, number>();
    const motionCounts = new Map<MotionLevel, number>();

    successful.forEach(entry => {
      const preset = entry.result.newState.presetId;
      presetCounts.set(preset, (presetCounts.get(preset) || 0) + 1);
      
      const pillar = entry.result.newState.pillar;
      pillarCounts.set(pillar, (pillarCounts.get(pillar) || 0) + 1);
      
      const motion = entry.result.newState.motionLevel;
      motionCounts.set(motion, (motionCounts.get(motion) || 0) + 1);
    });

    const getMostCommon = <T>(map: Map<T, number>): T | null => {
      let mostCommon: T | null = null;
      let maxCount = 0;
      for (const [item, count] of map) {
        if (count > maxCount) {
          maxCount = count;
          mostCommon = item;
        }
      }
      return mostCommon;
    };

    return {
      sessionId: this.sessionId,
      totalReplacements: this.history.length,
      successfulReplacements: successful.length,
      failedReplacements: failed.length,
      averageDuration,
      mostReplacedPreset: getMostCommon(presetCounts),
      mostReplacedPillar: getMostCommon(pillarCounts),
      mostReplacedMotion: getMostCommon(motionCounts),
    };
  }

  /**
   * Destroy the API and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.history = [];
    this.rules.clear();
    this.isDestroyed = true;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateSessionId(): string {
    return `skin-replacement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private validatePresetReplacement(newPresetId: SkinPresetId, currentState: SkinState) {
    const newPreset = this.manager.getPreset(newPresetId);
    if (!newPreset) {
      return {
        isValid: false,
        errors: [`Preset not found: ${newPresetId}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check pillar compatibility
    if (!newPreset.supportedPillars.includes(currentState.currentPillar)) {
      warnings.push(`Current pillar ${currentState.currentPillar} not supported by preset ${newPresetId}`);
    }

    // Check motion level compatibility
    if (!newPreset.supportedMotionLevels.includes(currentState.currentMotionLevel)) {
      warnings.push(`Current motion level ${currentState.currentMotionLevel} not supported by preset ${newPresetId}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validatePillarReplacement(newPillar: StyleLabPillar, currentState: SkinState) {
    const currentPreset = this.manager.getPreset(currentState.currentPreset);
    if (!currentPreset) {
      return {
        isValid: false,
        errors: [`Current preset not found: ${currentState.currentPreset}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!currentPreset.supportedPillars.includes(newPillar)) {
      errors.push(`Pillar ${newPillar} not supported by current preset ${currentState.currentPreset}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateMotionReplacement(newMotionLevel: MotionLevel, currentState: SkinState) {
    const currentPreset = this.manager.getPreset(currentState.currentPreset);
    if (!currentPreset) {
      return {
        isValid: false,
        errors: [`Current preset not found: ${currentState.currentPreset}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!currentPreset.supportedMotionLevels.includes(newMotionLevel)) {
      errors.push(`Motion level ${newMotionLevel} not supported by current preset ${currentState.currentPreset}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateStateReplacement(targetState: Partial<SkinState>, currentState: SkinState) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (targetState.currentPreset) {
      const presetValidation = this.validatePresetReplacement(targetState.currentPreset, currentState);
      errors.push(...presetValidation.errors);
      warnings.push(...presetValidation.warnings);
    }

    if (targetState.currentPillar) {
      const pillarValidation = this.validatePillarReplacement(targetState.currentPillar, currentState);
      errors.push(...pillarValidation.errors);
      warnings.push(...pillarValidation.warnings);
    }

    if (targetState.currentMotionLevel) {
      const motionValidation = this.validateMotionReplacement(targetState.currentMotionLevel, currentState);
      errors.push(...motionValidation.errors);
      warnings.push(...motionValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private findCompatiblePillar(preset: SkinPresetConfig, currentPillar: StyleLabPillar): StyleLabPillar {
    if (preset.supportedPillars.includes(currentPillar)) {
      return currentPillar;
    }
    return preset.supportedPillars[0];
  }

  private findCompatibleMotionLevel(preset: SkinPresetConfig, currentMotion: MotionLevel): MotionLevel {
    if (preset.supportedMotionLevels.includes(currentMotion)) {
      return currentMotion;
    }
    return preset.supportedMotionLevels[0];
  }

  private async animateReplacement(
    fromState: SkinState,
    toState: Partial<SkinState>,
    duration?: number
  ): Promise<void> {
    // Set transition state
    this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: { isTransitioning: true } });

    // Apply the replacement
    if (toState.currentPreset && toState.currentPreset !== fromState.currentPreset) {
      this.manager.setPreset(toState.currentPreset);
    }
    if (toState.currentPillar && toState.currentPillar !== fromState.currentPillar) {
      this.manager.setPillar(toState.currentPillar);
    }
    if (toState.currentMotionLevel && toState.currentMotionLevel !== fromState.currentMotionLevel) {
      this.manager.setMotionLevel(toState.currentMotionLevel);
    }

    // Wait for transition duration
    const transitionDuration = duration || 300;
    await new Promise(resolve => setTimeout(resolve, transitionDuration));

    // Clear transition state
    this.manager.dispatch({ type: 'SET_TRANSITIONING', payload: { isTransitioning: false } });
  }

  private createFailureResult(
    previousState: SkinState,
    targetState: { presetId: SkinPresetId; pillar: StyleLabPillar; motionLevel: MotionLevel },
    error: string,
    startTime: number
  ): SkinReplacementResult {
    return {
      success: false,
      previousState: {
        presetId: previousState.currentPreset,
        pillar: previousState.currentPillar,
        motionLevel: previousState.currentMotionLevel,
      },
      newState: targetState,
      error,
      metadata: {
        timestamp: new Date().toISOString(),
        duration: performance.now() - startTime,
        reason: 'error',
        source: 'api',
      },
    };
  }

  private addToHistory(result: SkinReplacementResult, user?: string): void {
    const historyEntry: SkinReplacementHistory = {
      id: this.generateHistoryId(),
      result,
      canUndo: result.success,
      user,
      sessionId: this.sessionId,
    };

    this.history.unshift(historyEntry);

    // Trim history if it exceeds max size
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(0, this.config.maxHistorySize);
    }
  }

  private generateHistoryId(): string {
    return `replacement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkAutoRules(): void {
    if (!this.config.enableAutoRules) {
      return;
    }

    const currentState = this.manager.getState();
    const enabledRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of enabledRules) {
      try {
        if (rule.condition(currentState)) {
          const replacement = rule.replacement(currentState);
          if (Object.keys(replacement).length > 0) {
            this.replaceState(replacement, {
              validateCompatibility: false,
              animateTransition: true,
              trackTelemetry: true,
              metadata: {
                reason: 'auto-rule',
                source: 'api',
                ruleId: rule.id,
                ruleName: rule.name,
              },
            });
            break; // Apply only one auto-rule per change
          }
        }
      } catch (error) {
        if (this.config.enableDebugMode) {
          console.error(`Auto-rule ${rule.id} failed:`, error);
        }
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let replacementAPIInstance: SkinReplacementAPI | null = null;

export function getSkinReplacementAPI(config?: SkinReplacementAPIConfig): SkinReplacementAPI {
  if (!replacementAPIInstance) {
    replacementAPIInstance = new SkinReplacementAPI(config);
  }
  return replacementAPIInstance;
}

export function destroySkinReplacementAPI(): void {
  if (replacementAPIInstance) {
    replacementAPIInstance.destroy();
    replacementAPIInstance = null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a replacement rule
 */
export function createReplacementRule(
  id: string,
  name: string,
  description: string,
  condition: (state: SkinState) => boolean,
  replacement: (state: SkinState) => Partial<SkinState>,
  options: Partial<SkinReplacementRule> = {}
): SkinReplacementRule {
  return {
    id,
    name,
    description,
    condition,
    replacement,
    enabled: true,
    priority: 0,
    metadata: {},
    ...options,
  };
}

/**
 * Create a time-based replacement rule
 */
export function createTimeBasedRule(
  id: string,
  name: string,
  targetState: Partial<SkinState>,
  timeCondition: (date: Date) => boolean,
  options: Partial<SkinReplacementRule> = {}
): SkinReplacementRule {
  return createReplacementRule(
    id,
    name,
    `Time-based rule: ${name}`,
    (state) => timeCondition(new Date()),
    () => targetState,
    options
  );
}

/**
 * Create a user preference-based replacement rule
 */
export function createUserPreferenceRule(
  id: string,
  name: string,
  targetState: Partial<SkinState>,
  preferenceKey: string,
  options: Partial<SkinReplacementRule> = {}
): SkinReplacementRule {
  return createReplacementRule(
    id,
    name,
    `User preference rule: ${name}`,
    () => {
      try {
        const preferences = JSON.parse(localStorage.getItem('skin-preferences') || '{}');
        return preferences[preferenceKey] === true;
      } catch {
        return false;
      }
    },
    () => targetState,
    options
  );
}
