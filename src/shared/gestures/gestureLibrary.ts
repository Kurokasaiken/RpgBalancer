/**
 * Gesture Library System - NP-226
 * 
 * Config-first unified gesture system that consolidates all gesture
 * functionality across the RPG Balancer project. Provides core gestures,
 * bindings, configuration management, and utilities.
 * 
 * @since NP-226
 * @author Gesture-Master
 */

import { z } from 'zod';

/**
 * Core gesture types supported by the library
 */
export const GESTURE_TYPES = {
  // Basic gestures
  TAP: 'tap',
  DOUBLE_TAP: 'doubleTap',
  LONG_PRESS: 'longPress',
  
  // Swipe gestures
  SWIPE_UP: 'swipeUp',
  SWIPE_DOWN: 'swipeDown',
  SWIPE_LEFT: 'swipeLeft',
  SWIPE_RIGHT: 'swipeRight',
  
  // Multi-finger gestures
  PINCH: 'pinch',
  SPREAD: 'spread',
  ROTATE: 'rotate',
  
  // Advanced gestures
  CIRCULAR: 'circular',
  TRIANGLE: 'triangle',
  Z_SHAPE: 'zShape',
  L_SHAPE: 'lShape',
  
  // Custom gestures
  CUSTOM: 'custom',
} as const;

export type GestureType = typeof GESTURE_TYPES[keyof typeof GESTURE_TYPES];

/**
 * Gesture direction enum
 */
export const GESTURE_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  DIAGONAL_UP_LEFT: 'diagonalUpLeft',
  DIAGONAL_UP_RIGHT: 'diagonalUpRight',
  DIAGONAL_DOWN_LEFT: 'diagonalDownLeft',
  DIAGONAL_DOWN_RIGHT: 'diagonalDownRight',
  CIRCULAR_CLOCKWISE: 'circularClockwise',
  CIRCULAR_COUNTER_CLOCKWISE: 'circularCounterClockwise',
} as const;

export type GestureDirection = typeof GESTURE_DIRECTIONS[keyof typeof GESTURE_DIRECTIONS];

/**
 * Gesture binding configuration
 */
export interface GestureBinding {
  id: string;
  gestureType: GestureType;
  direction?: GestureDirection;
  action: string;
  target: string;
  parameters?: Record<string, unknown>;
  enabled: boolean;
  priority: number;
  contexts: string[];
  deviceTypes: ('mobile' | 'tablet' | 'desktop')[];
  accessibility?: {
    hapticFeedback: boolean;
    visualFeedback: boolean;
    audioFeedback: boolean;
  };
  performance?: {
    debounceMs: number;
    throttleMs: number;
    maxConcurrent: number;
  };
}

/**
 * Gesture configuration schema
 */
export interface GestureConfig {
  thresholds: {
    swipe: {
      minDistance: number;
      maxTime: number;
      minVelocity: number;
    };
    tap: {
      maxTime: number;
      maxMovement: number;
    };
    longPress: {
      minTime: number;
      maxMovement: number;
    };
    doubleTap: {
      maxTime: number;
      maxMovement: number;
      maxInterval: number;
    };
    pinch: {
      minScale: number;
      maxScale: number;
      minDistance: number;
    };
    rotate: {
      minAngle: number;
      maxAngle: number;
      minDistance: number;
    };
    circular: {
      minAngle: number;
      maxRadius: number;
      minPoints: number;
    };
  };
  sensitivity: {
    overall: number;
    directional: number;
    temporal: number;
    spatial: number;
  };
  feedback: {
    haptic: {
      enabled: boolean;
      patterns: Record<string, string>;
    };
    visual: {
      enabled: boolean;
      duration: number;
      opacity: number;
      showTrails: boolean;
      showIndicators: boolean;
    };
    audio: {
      enabled: boolean;
      volume: number;
      sounds: Record<string, string>;
    };
  };
  performance: {
    debounceMs: number;
    throttleMs: number;
    maxHistorySize: number;
    enablePerformanceMonitoring: boolean;
    batchProcessing: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeTargets: boolean;
    hapticEnhancement: boolean;
    voiceAnnouncements: boolean;
  };
}

/**
 * Gesture event data
 */
export interface GestureEvent {
  id: string;
  type: GestureType;
  direction?: GestureDirection;
  timestamp: number;
  duration: number;
  coordinates: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    current: { x: number; y: number };
  };
  distance: number;
  velocity: number;
  pressure?: number;
  fingerCount: number;
  confidence: number;
  context: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  metadata: Record<string, unknown>;
}

/**
 * Gesture recognition result
 */
export interface GestureRecognitionResult {
  recognized: boolean;
  gesture: GestureType;
  direction?: GestureDirection;
  confidence: number;
  accuracy: number;
  timing: number;
  errors: string[];
  suggestions: string[];
}

/**
 * Gesture library state
 */
export interface GestureLibraryState {
  initialized: boolean;
  activeBindings: Map<string, GestureBinding>;
  gestureHistory: GestureEvent[];
  performanceMetrics: {
    totalGestures: number;
    recognizedGestures: number;
    averageConfidence: number;
    averageLatency: number;
    errorRate: number;
  };
  currentContext: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  accessibilityMode: boolean;
}

// Zod schemas for validation
export const GestureBindingSchema = z.object({
  id: z.string(),
  gestureType: z.enum(Object.values(GESTURE_TYPES) as [string, ...string[]]),
  direction: z.enum(Object.values(GESTURE_DIRECTIONS) as [string, ...string[]]).optional(),
  action: z.string(),
  target: z.string(),
  parameters: z.record(z.unknown()).optional(),
  enabled: z.boolean(),
  priority: z.number(),
  contexts: z.array(z.string()),
  deviceTypes: z.array(z.enum(['mobile', 'tablet', 'desktop'])),
  accessibility: z.object({
    hapticFeedback: z.boolean(),
    visualFeedback: z.boolean(),
    audioFeedback: z.boolean(),
  }).optional(),
  performance: z.object({
    debounceMs: z.number(),
    throttleMs: z.number(),
    maxConcurrent: z.number(),
  }).optional(),
});

export const GestureConfigSchema = z.object({
  thresholds: z.object({
    swipe: z.object({
      minDistance: z.number(),
      maxTime: z.number(),
      minVelocity: z.number(),
    }),
    tap: z.object({
      maxTime: z.number(),
      maxMovement: z.number(),
    }),
    longPress: z.object({
      minTime: z.number(),
      maxMovement: z.number(),
    }),
    doubleTap: z.object({
      maxTime: z.number(),
      maxMovement: z.number(),
      maxInterval: z.number(),
    }),
    pinch: z.object({
      minScale: z.number(),
      maxScale: z.number(),
      minDistance: z.number(),
    }),
    rotate: z.object({
      minAngle: z.number(),
      maxAngle: z.number(),
      minDistance: z.number(),
    }),
    circular: z.object({
      minAngle: z.number(),
      maxRadius: z.number(),
      minPoints: z.number(),
    }),
  }),
  sensitivity: z.object({
    overall: z.number(),
    directional: z.number(),
    temporal: z.number(),
    spatial: z.number(),
  }),
  feedback: z.object({
    haptic: z.object({
      enabled: z.boolean(),
      patterns: z.record(z.string()),
    }),
    visual: z.object({
      enabled: z.boolean(),
      duration: z.number(),
      opacity: z.number(),
      showTrails: z.boolean(),
      showIndicators: z.boolean(),
    }),
    audio: z.object({
      enabled: z.boolean(),
      volume: z.number(),
      sounds: z.record(z.string()),
    }),
  }),
  performance: z.object({
    debounceMs: z.number(),
    throttleMs: z.number(),
    maxHistorySize: z.number(),
    enablePerformanceMonitoring: z.boolean(),
    batchProcessing: z.boolean(),
  }),
  accessibility: z.object({
    reducedMotion: z.boolean(),
    highContrast: z.boolean(),
    largeTargets: z.boolean(),
    hapticEnhancement: z.boolean(),
    voiceAnnouncements: z.boolean(),
  }),
});

/**
 * Default gesture configuration
 */
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  thresholds: {
    swipe: {
      minDistance: 50,
      maxTime: 300,
      minVelocity: 0.1,
    },
    tap: {
      maxTime: 200,
      maxMovement: 10,
    },
    longPress: {
      minTime: 500,
      maxMovement: 20,
    },
    doubleTap: {
      maxTime: 300,
      maxMovement: 15,
      maxInterval: 300,
    },
    pinch: {
      minScale: 0.8,
      maxScale: 1.2,
      minDistance: 50,
    },
    rotate: {
      minAngle: Math.PI / 8, // 22.5 degrees
      maxAngle: Math.PI * 2, // 360 degrees
      minDistance: 50,
    },
    circular: {
      minAngle: Math.PI * 1.5, // 270 degrees
      maxRadius: 200,
      minPoints: 8,
    },
  },
  sensitivity: {
    overall: 1.0,
    directional: 1.0,
    temporal: 1.0,
    spatial: 1.0,
  },
  feedback: {
    haptic: {
      enabled: true,
      patterns: {
        light: 'light',
        medium: 'medium',
        heavy: 'heavy',
        success: 'success',
        error: 'error',
      },
    },
    visual: {
      enabled: true,
      duration: 300,
      opacity: 0.8,
      showTrails: true,
      showIndicators: true,
    },
    audio: {
      enabled: false,
      volume: 0.5,
      sounds: {
        tap: 'tap.mp3',
        swipe: 'swipe.mp3',
        longPress: 'longPress.mp3',
      },
    },
  },
  performance: {
    debounceMs: 16, // 60fps
    throttleMs: 100,
    maxHistorySize: 100,
    enablePerformanceMonitoring: false,
    batchProcessing: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeTargets: false,
    hapticEnhancement: false,
    voiceAnnouncements: false,
  },
};

/**
 * Default gesture bindings for common actions
 */
export const DEFAULT_GESTURE_BINDINGS: GestureBinding[] = [
  // Navigation gestures
  {
    id: 'nav-swipe-left',
    gestureType: GESTURE_TYPES.SWIPE_LEFT,
    direction: GESTURE_DIRECTIONS.LEFT,
    action: 'navigate',
    target: 'previous',
    enabled: true,
    priority: 1,
    contexts: ['navigation', 'menu', 'carousel'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  {
    id: 'nav-swipe-right',
    gestureType: GESTURE_TYPES.SWIPE_RIGHT,
    direction: GESTURE_DIRECTIONS.RIGHT,
    action: 'navigate',
    target: 'next',
    enabled: true,
    priority: 1,
    contexts: ['navigation', 'menu', 'carousel'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  {
    id: 'nav-swipe-up',
    gestureType: GESTURE_TYPES.SWIPE_UP,
    direction: GESTURE_DIRECTIONS.UP,
    action: 'navigate',
    target: 'up',
    enabled: true,
    priority: 1,
    contexts: ['navigation', 'menu', 'list'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  {
    id: 'nav-swipe-down',
    gestureType: GESTURE_TYPES.SWIPE_DOWN,
    direction: GESTURE_DIRECTIONS.DOWN,
    action: 'navigate',
    target: 'down',
    enabled: true,
    priority: 1,
    contexts: ['navigation', 'menu', 'list'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  
  // Action gestures
  {
    id: 'action-tap',
    gestureType: GESTURE_TYPES.TAP,
    action: 'select',
    target: 'element',
    enabled: true,
    priority: 2,
    contexts: ['general', 'combat', 'menu'],
    deviceTypes: ['mobile', 'tablet', 'desktop'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  {
    id: 'action-double-tap',
    gestureType: GESTURE_TYPES.DOUBLE_TAP,
    action: 'activate',
    target: 'element',
    enabled: true,
    priority: 2,
    contexts: ['general', 'combat'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  {
    id: 'action-long-press',
    gestureType: GESTURE_TYPES.LONG_PRESS,
    action: 'context-menu',
    target: 'element',
    enabled: true,
    priority: 3,
    contexts: ['general', 'menu'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  
  // Zoom gestures
  {
    id: 'zoom-pinch',
    gestureType: GESTURE_TYPES.PINCH,
    action: 'zoom',
    target: 'out',
    enabled: true,
    priority: 2,
    contexts: ['map', 'image', 'content'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  {
    id: 'zoom-spread',
    gestureType: GESTURE_TYPES.SPREAD,
    action: 'zoom',
    target: 'in',
    enabled: true,
    priority: 2,
    contexts: ['map', 'image', 'content'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  
  // Rotation gestures
  {
    id: 'rotate-left',
    gestureType: GESTURE_TYPES.ROTATE,
    direction: GESTURE_DIRECTIONS.CIRCULAR_COUNTER_CLOCKWISE,
    action: 'rotate',
    target: 'left',
    enabled: true,
    priority: 3,
    contexts: ['image', 'content', 'map'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
  {
    id: 'rotate-right',
    gestureType: GESTURE_TYPES.ROTATE,
    direction: GESTURE_DIRECTIONS.CIRCULAR_CLOCKWISE,
    action: 'rotate',
    target: 'right',
    enabled: true,
    priority: 3,
    contexts: ['image', 'content', 'map'],
    deviceTypes: ['mobile', 'tablet'],
    accessibility: {
      hapticFeedback: true,
      visualFeedback: true,
      audioFeedback: false,
    },
  },
];

/**
 * Context-specific gesture configurations
 */
export const CONTEXT_GESTURE_CONFIGS = {
  combat: {
    ...DEFAULT_GESTURE_CONFIG,
    thresholds: {
      ...DEFAULT_GESTURE_CONFIG.thresholds,
      swipe: {
        minDistance: 40, // More sensitive for combat
        maxTime: 250,
        minVelocity: 0.15,
      },
      longPress: {
        minTime: 400, // Faster long press for quick actions
        maxMovement: 25,
      },
    },
    sensitivity: {
      ...DEFAULT_GESTURE_CONFIG.sensitivity,
      overall: 1.2, // More sensitive in combat
    },
  },
  terminal: {
    ...DEFAULT_GESTURE_CONFIG,
    thresholds: {
      ...DEFAULT_GESTURE_CONFIG.thresholds,
      swipe: {
        minDistance: 60, // Less sensitive for terminal
        maxTime: 350,
        minVelocity: 0.08,
      },
      longPress: {
        minTime: 600, // Slower long press for terminal
        maxMovement: 30,
      },
    },
    sensitivity: {
      ...DEFAULT_GESTURE_CONFIG.sensitivity,
      overall: 0.8, // Less sensitive in terminal
    },
  },
  navigation: {
    ...DEFAULT_GESTURE_CONFIG,
    thresholds: {
      ...DEFAULT_GESTURE_CONFIG.thresholds,
      swipe: {
        minDistance: 45,
        maxTime: 280,
        minVelocity: 0.12,
      },
    },
    sensitivity: {
      ...DEFAULT_GESTURE_CONFIG.sensitivity,
      overall: 1.0,
    },
  },
  accessibility: {
    ...DEFAULT_GESTURE_CONFIG,
    thresholds: {
      ...DEFAULT_GESTURE_CONFIG.thresholds,
      swipe: {
        minDistance: 80, // Larger gestures for accessibility
        maxTime: 400,
        minVelocity: 0.05,
      },
      longPress: {
        minTime: 800, // Longer long press
        maxMovement: 40,
      },
      doubleTap: {
        maxTime: 500, // Longer double tap window
        maxMovement: 25,
        maxInterval: 500,
      },
    },
    sensitivity: {
      ...DEFAULT_GESTURE_CONFIG.sensitivity,
      overall: 0.6, // Less sensitive
    },
    accessibility: {
      ...DEFAULT_GESTURE_CONFIG.accessibility,
      reducedMotion: true,
      highContrast: true,
      largeTargets: true,
      hapticEnhancement: true,
      voiceAnnouncements: true,
    },
  },
};

/**
 * Device-specific configurations
 */
export const DEVICE_GESTURE_CONFIGS = {
  mobile: {
    ...DEFAULT_GESTURE_CONFIG,
    thresholds: {
      ...DEFAULT_GESTURE_CONFIG.thresholds,
      swipe: {
        minDistance: 45,
        maxTime: 280,
        minVelocity: 0.12,
      },
    },
    sensitivity: {
      ...DEFAULT_GESTURE_CONFIG.sensitivity,
      overall: 1.1, // More sensitive on mobile
    },
  },
  tablet: {
    ...DEFAULT_GESTURE_CONFIG,
    thresholds: {
      ...DEFAULT_GESTURE_CONFIG.thresholds,
      swipe: {
        minDistance: 60, // Larger screen = larger gestures
        maxTime: 320,
        minVelocity: 0.1,
      },
    },
    sensitivity: {
      ...DEFAULT_GESTURE_CONFIG.sensitivity,
      overall: 0.9,
    },
  },
  desktop: {
    ...DEFAULT_GESTURE_CONFIG,
    thresholds: {
      ...DEFAULT_GESTURE_CONFIG.thresholds,
      swipe: {
        minDistance: 50,
        maxTime: 300,
        minVelocity: 0.1,
      },
    },
    sensitivity: {
      ...DEFAULT_GESTURE_CONFIG.sensitivity,
      overall: 1.0,
    },
    feedback: {
      ...DEFAULT_GESTURE_CONFIG.feedback,
      haptic: {
        ...DEFAULT_GESTURE_CONFIG.feedback.haptic,
        enabled: false, // No haptic on desktop
      },
    },
  },
};

/**
 * Gesture Library Class
 */
export class GestureLibrary {
  private state: GestureLibraryState;
  private config: GestureConfig;
  private bindings: Map<string, GestureBinding>;
  private eventListeners: Map<string, Array<(event: GestureEvent) => void>>;

  constructor(config?: Partial<GestureConfig>) {
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config };
    this.bindings = new Map();
    this.eventListeners = new Map();
    
    this.state = {
      initialized: false,
      activeBindings: new Map(),
      gestureHistory: [],
      performanceMetrics: {
        totalGestures: 0,
        recognizedGestures: 0,
        averageConfidence: 0,
        averageLatency: 0,
        errorRate: 0,
      },
      currentContext: 'general',
      deviceType: 'mobile',
      accessibilityMode: false,
    };

    this.initialize();
  }

  private initialize(): void {
    // Load default bindings
    DEFAULT_GESTURE_BINDINGS.forEach(binding => {
      this.bindings.set(binding.id, binding);
    });

    this.state.initialized = true;
  }

  /**
   * Get current configuration
   */
  getConfig(): GestureConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GestureConfig>): void {
    const result = GestureConfigSchema.partial().safeParse(config);
    if (result.success) {
      this.config = { ...this.config, ...result.data };
    } else {
      console.error('Invalid gesture configuration:', result.error);
    }
  }

  /**
   * Get configuration for specific context and device
   */
  getConfigForContext(context: string, deviceType: 'mobile' | 'tablet' | 'desktop'): GestureConfig {
    const contextConfig = CONTEXT_GESTURE_CONFIGS[context as keyof typeof CONTEXT_GESTURE_CONFIGS];
    const deviceConfig = DEVICE_GESTURE_CONFIGS[deviceType];
    
    return {
      ...this.config,
      ...contextConfig,
      ...deviceConfig,
      thresholds: {
        ...this.config.thresholds,
        ...contextConfig?.thresholds,
        ...deviceConfig?.thresholds,
      },
    };
  }

  /**
   * Add gesture binding
   */
  addBinding(binding: GestureBinding): void {
    const result = GestureBindingSchema.safeParse(binding);
    if (result.success) {
      this.bindings.set(binding.id, result.data);
    } else {
      console.error('Invalid gesture binding:', result.error);
    }
  }

  /**
   * Remove gesture binding
   */
  removeBinding(id: string): boolean {
    return this.bindings.delete(id);
  }

  /**
   * Get gesture binding by ID
   */
  getBinding(id: string): GestureBinding | undefined {
    return this.bindings.get(id);
  }

  /**
   * Get all bindings
   */
  getAllBindings(): GestureBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Get bindings for context and device type
   */
  getBindingsForContext(context: string, deviceType: 'mobile' | 'tablet' | 'desktop'): GestureBinding[] {
    return this.getAllBindings().filter(binding => 
      binding.enabled &&
      binding.contexts.includes(context) &&
      binding.deviceTypes.includes(deviceType)
    );
  }

  /**
   * Enable/disable binding
   */
  setBindingEnabled(id: string, enabled: boolean): boolean {
    const binding = this.bindings.get(id);
    if (binding) {
      binding.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Validate gesture event against configuration
   */
  validateGesture(event: GestureEvent): GestureRecognitionResult {
    const config = this.getConfigForContext(event.context, event.deviceType);
    const threshold = config.thresholds[event.type as keyof typeof config.thresholds];
    
    if (!threshold) {
      return {
        recognized: false,
        gesture: event.type,
        confidence: 0,
        accuracy: 0,
        timing: event.duration,
        errors: [`Unsupported gesture type: ${event.type}`],
        suggestions: [],
      };
    }

    const errors: string[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;
    let accuracy = 1.0;

    // Validate based on gesture type
    switch (event.type) {
      case GESTURE_TYPES.SWIPE_UP:
      case GESTURE_TYPES.SWIPE_DOWN:
      case GESTURE_TYPES.SWIPE_LEFT:
      case GESTURE_TYPES.SWIPE_RIGHT:
        if (event.distance < (threshold as any).minDistance) {
          errors.push(`Swipe distance too short: ${event.distance}px < ${(threshold as any).minDistance}px`);
          confidence *= 0.5;
          suggestions.push('Swipe with longer distance');
        }
        if (event.duration > (threshold as any).maxTime) {
          errors.push(`Swipe too slow: ${event.duration}ms > ${(threshold as any).maxTime}ms`);
          confidence *= 0.7;
          suggestions.push('Swipe faster');
        }
        if (event.velocity < (threshold as any).minVelocity) {
          errors.push(`Swipe velocity too low: ${event.velocity}`);
          confidence *= 0.8;
          suggestions.push('Swipe with more consistent speed');
        }
        break;

      case GESTURE_TYPES.TAP:
        if (event.duration > (threshold as any).maxTime) {
          errors.push(`Tap too long: ${event.duration}ms > ${(threshold as any).maxTime}ms`);
          confidence *= 0.6;
          suggestions.push('Tap quicker');
        }
        if (event.distance > (threshold as any).maxMovement) {
          errors.push(`Tap moved too much: ${event.distance}px > ${(threshold as any).maxMovement}px`);
          confidence *= 0.7;
          suggestions.push('Tap without moving');
        }
        break;

      case GESTURE_TYPES.LONG_PRESS:
        if (event.duration < (threshold as any).minTime) {
          errors.push(`Long press too short: ${event.duration}ms < ${(threshold as any).minTime}ms`);
          confidence *= 0.5;
          suggestions.push('Hold longer');
        }
        if (event.distance > (threshold as any).maxMovement) {
          errors.push(`Long press moved too much: ${event.distance}px > ${(threshold as any).maxMovement}px`);
          confidence *= 0.6;
          suggestions.push('Hold steady');
        }
        break;

      case GESTURE_TYPES.DOUBLE_TAP:
        // Double tap validation would need more complex logic
        // For now, basic validation
        if (event.duration > (threshold as any).maxTime) {
          errors.push(`Double tap too long: ${event.duration}ms > ${(threshold as any).maxTime}ms`);
          confidence *= 0.6;
        }
        break;
    }

    // Apply sensitivity adjustments
    confidence *= config.sensitivity.overall;
    accuracy = confidence;

    return {
      recognized: errors.length === 0,
      gesture: event.type,
      direction: event.direction,
      confidence: Math.max(0, Math.min(1, confidence)),
      accuracy: Math.max(0, Math.min(1, accuracy)),
      timing: event.duration,
      errors,
      suggestions,
    };
  }

  /**
   * Find matching bindings for a gesture event
   */
  findMatchingBindings(event: GestureEvent): GestureBinding[] {
    const bindings = this.getBindingsForContext(event.context, event.deviceType);
    
    return bindings.filter(binding => {
      if (binding.gestureType !== event.type) return false;
      if (binding.direction && binding.direction !== event.direction) return false;
      return true;
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process gesture event
   */
  processGesture(event: GestureEvent): GestureBinding[] {
    // Add to history
    this.state.gestureHistory.push(event);
    if (this.state.gestureHistory.length > this.config.performance.maxHistorySize) {
      this.state.gestureHistory.shift();
    }

    // Update performance metrics
    this.state.performanceMetrics.totalGestures++;
    
    const validation = this.validateGesture(event);
    if (validation.recognized) {
      this.state.performanceMetrics.recognizedGestures++;
      this.state.performanceMetrics.averageConfidence = 
        (this.state.performanceMetrics.averageConfidence + validation.confidence) / 2;
    }

    // Find matching bindings
    const matchingBindings = this.findMatchingBindings(event);
    
    // Trigger event listeners
    this.triggerEventListeners(event);

    return matchingBindings;
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: (event: GestureEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: (event: GestureEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Trigger event listeners
   */
  private triggerEventListeners(event: GestureEvent): void {
    const listeners = this.eventListeners.get('gesture');
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in gesture event listener:', error);
        }
      });
    }
  }

  /**
   * Get current state
   */
  getState(): GestureLibraryState {
    return { ...this.state };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.state.performanceMetrics;
  }

  /**
   * Get gesture history
   */
  getGestureHistory(limit?: number): GestureEvent[] {
    if (limit) {
      return this.state.gestureHistory.slice(-limit);
    }
    return [...this.state.gestureHistory];
  }

  /**
   * Clear gesture history
   */
  clearHistory(): void {
    this.state.gestureHistory = [];
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.state.performanceMetrics = {
      totalGestures: 0,
      recognizedGestures: 0,
      averageConfidence: 0,
      averageLatency: 0,
      errorRate: 0,
    };
  }

  /**
   * Set current context
   */
  setContext(context: string): void {
    this.state.currentContext = context;
  }

  /**
   * Set device type
   */
  setDeviceType(deviceType: 'mobile' | 'tablet' | 'desktop'): void {
    this.state.deviceType = deviceType;
  }

  /**
   * Set accessibility mode
   */
  setAccessibilityMode(enabled: boolean): void {
    this.state.accessibilityMode = enabled;
    if (enabled) {
      this.updateConfig(CONTEXT_GESTURE_CONFIGS.accessibility);
    }
  }

  /**
   * Export configuration and bindings
   */
  export(): {
    config: GestureConfig;
    bindings: GestureBinding[];
    state: Partial<GestureLibraryState>;
  } {
    return {
      config: this.config,
      bindings: this.getAllBindings(),
      state: {
        currentContext: this.state.currentContext,
        deviceType: this.state.deviceType,
        accessibilityMode: this.state.accessibilityMode,
      },
    };
  }

  /**
   * Import configuration and bindings
   */
  import(data: {
    config?: Partial<GestureConfig>;
    bindings?: GestureBinding[];
    state?: Partial<GestureLibraryState>;
  }): void {
    if (data.config) {
      this.updateConfig(data.config);
    }
    
    if (data.bindings) {
      data.bindings.forEach(binding => {
        this.addBinding(binding);
      });
    }
    
    if (data.state) {
      if (data.state.currentContext) {
        this.setContext(data.state.currentContext);
      }
      if (data.state.deviceType) {
        this.setDeviceType(data.state.deviceType);
      }
      if (data.state.accessibilityMode !== undefined) {
        this.setAccessibilityMode(data.state.accessibilityMode);
      }
    }
  }
}

/**
 * Global gesture library instance
 */
export const gestureLibrary = new GestureLibrary();

/**
 * Utility functions
 */

/**
 * Create gesture event from touch/mouse data
 */
export function createGestureEvent(data: {
  type: GestureType;
  coordinates: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    current: { x: number; y: number };
  };
  timestamp: number;
  duration: number;
  fingerCount: number;
  context: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  pressure?: number;
  metadata?: Record<string, unknown>;
}): GestureEvent {
  const dx = data.coordinates.end.x - data.coordinates.start.x;
  const dy = data.coordinates.end.y - data.coordinates.start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const velocity = distance / data.duration;

  let direction: GestureDirection | undefined;
  if (data.type.startsWith('swipe')) {
    const angle = Math.atan2(dy, dx);
    if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
      direction = GESTURE_DIRECTIONS.RIGHT;
    } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
      direction = GESTURE_DIRECTIONS.DOWN;
    } else if (angle > 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) {
      direction = GESTURE_DIRECTIONS.LEFT;
    } else {
      direction = GESTURE_DIRECTIONS.UP;
    }
  }

  return {
    id: `gesture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    direction,
    timestamp: data.timestamp,
    duration: data.duration,
    coordinates: data.coordinates,
    distance,
    velocity,
    pressure: data.pressure,
    fingerCount: data.fingerCount,
    confidence: 1.0,
    context: data.context,
    deviceType: data.deviceType,
    metadata: data.metadata || {},
  };
}

/**
 * Validate gesture configuration
 */
export function validateGestureConfig(config: unknown): GestureConfig | null {
  const result = GestureConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}

/**
 * Validate gesture binding
 */
export function validateGestureBinding(binding: unknown): GestureBinding | null {
  const result = GestureBindingSchema.safeParse(binding);
  return result.success ? result.data : null;
}

/**
 * Get gesture type from string
 */
export function getGestureTypeFromString(type: string): GestureType | null {
  return Object.values(GESTURE_TYPES).find(gestureType => gestureType === type) || null;
}

/**
 * Get gesture direction from vector
 */
export function getGestureDirectionFromVector(dx: number, dy: number): GestureDirection | null {
  const angle = Math.atan2(dy, dx);
  
  if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
    return GESTURE_DIRECTIONS.RIGHT;
  } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
    return GESTURE_DIRECTIONS.DOWN;
  } else if (angle > 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) {
    return GESTURE_DIRECTIONS.LEFT;
  } else if (angle > -3 * Math.PI / 4 && angle <= -Math.PI / 4) {
    return GESTURE_DIRECTIONS.UP;
  }
  
  return null;
}

/**
 * Calculate gesture confidence based on multiple factors
 */
export function calculateGestureConfidence(factors: {
  accuracy: number;
  speed: number;
  consistency: number;
  timing: number;
}): number {
  const weights = {
    accuracy: 0.4,
    speed: 0.2,
    consistency: 0.3,
    timing: 0.1,
  };
  
  return (
    factors.accuracy * weights.accuracy +
    factors.speed * weights.speed +
    factors.consistency * weights.consistency +
    factors.timing * weights.timing
  );
}

/**
 * Check if gesture is accessible based on configuration
 */
export function isGestureAccessible(gestureType: GestureType, config: GestureConfig): boolean {
  // Check if gesture supports accessibility features
  switch (gestureType) {
    case GESTURE_TYPES.TAP:
    case GESTURE_TYPES.DOUBLE_TAP:
    case GESTURE_TYPES.LONG_PRESS:
      return true;
    case GESTURE_TYPES.SWIPE_UP:
    case GESTURE_TYPES.SWIPE_DOWN:
    case GESTURE_TYPES.SWIPE_LEFT:
    case GESTURE_TYPES.SWIPE_RIGHT:
      return config.accessibility.largeTargets;
    case GESTURE_TYPES.PINCH:
    case GESTURE_TYPES.SPREAD:
    case GESTURE_TYPES.ROTATE:
      return config.accessibility.hapticEnhancement;
    default:
      return false;
  }
}
