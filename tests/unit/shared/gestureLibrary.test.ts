/**
 * Gesture Library Tests - NP-226
 * 
 * Comprehensive unit tests for the unified gesture library system.
 * Tests core functionality, configuration management, bindings,
 * validation, and performance metrics.
 * 
 * @since NP-226
 * @author Gesture-Master
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  GestureLibrary,
  gestureLibrary,
  GESTURE_TYPES,
  GESTURE_DIRECTIONS,
  DEFAULT_GESTURE_CONFIG,
  DEFAULT_GESTURE_BINDINGS,
  CONTEXT_GESTURE_CONFIGS,
  DEVICE_GESTURE_CONFIGS,
  createGestureEvent,
  validateGestureConfig,
  validateGestureBinding,
  getGestureTypeFromString,
  getGestureDirectionFromVector,
  calculateGestureConfidence,
  isGestureAccessible,
  type GestureEvent,
  type GestureBinding,
  type GestureConfig,
} from '@/shared/gestures/gestureLibrary';

describe('GestureLibrary', () => {
  let library: GestureLibrary;

  beforeEach(() => {
    library = new GestureLibrary();
  });

  afterEach(() => {
    library.clearHistory();
    library.resetMetrics();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = library.getConfig();
      expect(config).toBeDefined();
      expect(config.thresholds).toBeDefined();
      expect(config.sensitivity).toBeDefined();
      expect(config.feedback).toBeDefined();
    });

    it('should initialize with default bindings', () => {
      const bindings = library.getAllBindings();
      expect(bindings.length).toBeGreaterThan(0);
      expect(bindings.some(b => b.id === 'nav-swipe-left')).toBe(true);
      expect(bindings.some(b => b.id === 'action-tap')).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<GestureConfig> = {
        sensitivity: {
          overall: 1.5,
          directional: 1.2,
          temporal: 0.8,
          spatial: 1.1,
        },
      };
      
      const customLibrary = new GestureLibrary(customConfig);
      const config = customLibrary.getConfig();
      expect(config.sensitivity.overall).toBe(1.5);
    });

    it('should be initialized after construction', () => {
      const state = library.getState();
      expect(state.initialized).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<GestureConfig> = {
        sensitivity: {
          overall: 2.0,
          directional: 1.5,
          temporal: 1.2,
          spatial: 1.3,
        },
      };

      library.updateConfig(newConfig);
      const config = library.getConfig();
      expect(config.sensitivity.overall).toBe(2.0);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        sensitivity: {
          overall: 'invalid', // Should be number
        },
      } as any;

      // Should not throw error but log it
      expect(() => library.updateConfig(invalidConfig)).not.toThrow();
    });

    it('should get context-specific configuration', () => {
      const combatConfig = library.getConfigForContext('combat', 'mobile');
      expect(combatConfig.sensitivity.overall).toBe(1.2);
    });

    it('should get device-specific configuration', () => {
      const mobileConfig = library.getConfigForContext('general', 'mobile');
      expect(mobileConfig.sensitivity.overall).toBe(1.1);
    });

    it('should merge context and device configurations', () => {
      const config = library.getConfigForContext('combat', 'mobile');
      expect(config.sensitivity.overall).toBeGreaterThan(1.0);
    });
  });

  describe('Binding Management', () => {
    it('should add gesture binding', () => {
      const binding: GestureBinding = {
        id: 'test-binding',
        gestureType: GESTURE_TYPES.TAP,
        action: 'test-action',
        target: 'test-target',
        enabled: true,
        priority: 1,
        contexts: ['test'],
        deviceTypes: ['mobile'],
      };

      library.addBinding(binding);
      const retrieved = library.getBinding('test-binding');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-binding');
    });

    it('should remove gesture binding', () => {
      const binding: GestureBinding = {
        id: 'test-binding',
        gestureType: GESTURE_TYPES.TAP,
        action: 'test-action',
        target: 'test-target',
        enabled: true,
        priority: 1,
        contexts: ['test'],
        deviceTypes: ['mobile'],
      };

      library.addBinding(binding);
      const removed = library.removeBinding('test-binding');
      expect(removed).toBe(true);
      
      const retrieved = library.getBinding('test-binding');
      expect(retrieved).toBeUndefined();
    });

    it('should get bindings for context', () => {
      const bindings = library.getBindingsForContext('navigation', 'mobile');
      expect(bindings.length).toBeGreaterThan(0);
      expect(bindings.every(b => b.contexts.includes('navigation'))).toBe(true);
      expect(bindings.every(b => b.deviceTypes.includes('mobile'))).toBe(true);
    });

    it('should enable/disable binding', () => {
      const binding = library.getBinding('nav-swipe-left');
      expect(binding?.enabled).toBe(true);

      const disabled = library.setBindingEnabled('nav-swipe-left', false);
      expect(disabled).toBe(true);
      
      const updated = library.getBinding('nav-swipe-left');
      expect(updated?.enabled).toBe(false);
    });

    it('should reject invalid binding', () => {
      const invalidBinding = {
        id: 'invalid-binding',
        gestureType: 'invalid-gesture', // Invalid gesture type
        action: 'test-action',
        target: 'test-target',
        enabled: true,
        priority: 1,
        contexts: ['test'],
        deviceTypes: ['mobile'],
      } as any;

      // Should not throw error but log it
      expect(() => library.addBinding(invalidBinding)).not.toThrow();
    });
  });

  describe('Gesture Validation', () => {
    it('should validate tap gesture', () => {
      const event: GestureEvent = {
        id: 'test-tap',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      const result = library.validateGesture(event);
      expect(result.recognized).toBe(true);
      expect(result.gesture).toBe(GESTURE_TYPES.TAP);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should reject tap gesture that moved too much', () => {
      const event: GestureEvent = {
        id: 'test-tap-invalid',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 150, y: 100 },
          current: { x: 150, y: 100 },
        },
        distance: 50,
        velocity: 0.33,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      const result = library.validateGesture(event);
      expect(result.recognized).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should validate swipe gesture', () => {
      const event: GestureEvent = {
        id: 'test-swipe',
        type: GESTURE_TYPES.SWIPE_RIGHT,
        direction: GESTURE_DIRECTIONS.RIGHT,
        timestamp: Date.now(),
        duration: 250,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 200, y: 100 },
          current: { x: 200, y: 100 },
        },
        distance: 100,
        velocity: 0.4,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      const result = library.validateGesture(event);
      expect(result.recognized).toBe(true);
      expect(result.gesture).toBe(GESTURE_TYPES.SWIPE_RIGHT);
      expect(result.direction).toBe(GESTURE_DIRECTIONS.RIGHT);
    });

    it('should reject swipe gesture that is too short', () => {
      const event: GestureEvent = {
        id: 'test-swipe-invalid',
        type: GESTURE_TYPES.SWIPE_RIGHT,
        direction: GESTURE_DIRECTIONS.RIGHT,
        timestamp: Date.now(),
        duration: 250,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 120, y: 100 },
          current: { x: 120, y: 100 },
        },
        distance: 20,
        velocity: 0.08,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      const result = library.validateGesture(event);
      expect(result.recognized).toBe(false);
      expect(result.errors).toContain('Swipe distance too short: 20px < 50px');
    });

    it('should validate long press gesture', () => {
      const event: GestureEvent = {
        id: 'test-long-press',
        type: GESTURE_TYPES.LONG_PRESS,
        timestamp: Date.now(),
        duration: 600,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.008,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      const result = library.validateGesture(event);
      expect(result.recognized).toBe(true);
      expect(result.gesture).toBe(GESTURE_TYPES.LONG_PRESS);
    });

    it('should reject long press that is too short', () => {
      const event: GestureEvent = {
        id: 'test-long-press-invalid',
        type: GESTURE_TYPES.LONG_PRESS,
        timestamp: Date.now(),
        duration: 300,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.017,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      const result = library.validateGesture(event);
      expect(result.recognized).toBe(false);
      expect(result.errors).toContain('Long press too short: 300ms < 500ms');
    });
  });

  describe('Gesture Processing', () => {
    it('should process gesture and find matching bindings', () => {
      const event: GestureEvent = {
        id: 'test-swipe-process',
        type: GESTURE_TYPES.SWIPE_LEFT,
        direction: GESTURE_DIRECTIONS.LEFT,
        timestamp: Date.now(),
        duration: 250,
        coordinates: {
          start: { x: 200, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 100,
        velocity: 0.4,
        fingerCount: 1,
        confidence: 1.0,
        context: 'navigation',
        deviceType: 'mobile',
        metadata: {},
      };

      const bindings = library.processGesture(event);
      expect(bindings.length).toBeGreaterThan(0);
      expect(bindings[0].id).toBe('nav-swipe-left');
    });

    it('should add gesture to history', () => {
      const event: GestureEvent = {
        id: 'test-history',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      library.processGesture(event);
      const history = library.getGestureHistory();
      expect(history.length).toBe(1);
      expect(history[0].id).toBe('test-history');
    });

    it('should limit history size', () => {
      const smallConfig: Partial<GestureConfig> = {
        performance: {
          ...DEFAULT_GESTURE_CONFIG.performance,
          maxHistorySize: 3,
        },
      };
      const smallLibrary = new GestureLibrary(smallConfig);

      // Add more gestures than the limit
      for (let i = 0; i < 5; i++) {
        const event: GestureEvent = {
          id: `test-${i}`,
          type: GESTURE_TYPES.TAP,
          timestamp: Date.now(),
          duration: 150,
          coordinates: {
            start: { x: 100, y: 100 },
            end: { x: 100, y: 100 },
            current: { x: 100, y: 100 },
          },
          distance: 5,
          velocity: 0.03,
          fingerCount: 1,
          confidence: 1.0,
          context: 'general',
          deviceType: 'mobile',
          metadata: {},
        };
        smallLibrary.processGesture(event);
      }

      const history = smallLibrary.getGestureHistory();
      expect(history.length).toBe(3);
    });

    it('should update performance metrics', () => {
      const event: GestureEvent = {
        id: 'test-metrics',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      library.processGesture(event);
      const metrics = library.getPerformanceMetrics();
      expect(metrics.totalGestures).toBe(1);
      expect(metrics.recognizedGestures).toBe(1);
    });
  });

  describe('Event Listeners', () => {
    it('should add and trigger event listeners', () => {
      let triggeredEvent: GestureEvent | null = null;
      
      const listener = (event: GestureEvent) => {
        triggeredEvent = event;
      };

      library.addEventListener('gesture', listener);

      const event: GestureEvent = {
        id: 'test-listener',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      library.processGesture(event);
      expect(triggeredEvent).toBeDefined();
      expect(triggeredEvent?.id).toBe('test-listener');
    });

    it('should remove event listeners', () => {
      let triggeredCount = 0;
      
      const listener = () => {
        triggeredCount++;
      };

      library.addEventListener('gesture', listener);
      library.removeEventListener('gesture', listener);

      const event: GestureEvent = {
        id: 'test-remove-listener',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      library.processGesture(event);
      expect(triggeredCount).toBe(0);
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = () => {
        throw new Error('Test error');
      };

      library.addEventListener('gesture', faultyListener);

      const event: GestureEvent = {
        id: 'test-error-listener',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      // Should not throw error
      expect(() => library.processGesture(event)).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should set and get context', () => {
      library.setContext('combat');
      const state = library.getState();
      expect(state.currentContext).toBe('combat');
    });

    it('should set and get device type', () => {
      library.setDeviceType('tablet');
      const state = library.getState();
      expect(state.deviceType).toBe('tablet');
    });

    it('should set and get accessibility mode', () => {
      library.setAccessibilityMode(true);
      const state = library.getState();
      expect(state.accessibilityMode).toBe(true);
    });

    it('should update config when accessibility mode is enabled', () => {
      library.setAccessibilityMode(true);
      const config = library.getConfig();
      expect(config.accessibility.reducedMotion).toBe(true);
      expect(config.accessibility.largeTargets).toBe(true);
    });
  });

  describe('Import/Export', () => {
    it('should export configuration and bindings', () => {
      const exported = library.export();
      expect(exported.config).toBeDefined();
      expect(exported.bindings).toBeDefined();
      expect(exported.state).toBeDefined();
      expect(exported.bindings.length).toBeGreaterThan(0);
    });

    it('should import configuration and bindings', () => {
      const customBinding: GestureBinding = {
        id: 'import-test',
        gestureType: GESTURE_TYPES.DOUBLE_TAP,
        action: 'import-action',
        target: 'import-target',
        enabled: true,
        priority: 5,
        contexts: ['test'],
        deviceTypes: ['mobile'],
      };

      library.import({
        bindings: [customBinding],
        state: {
          currentContext: 'combat',
          deviceType: 'tablet',
          accessibilityMode: true,
        },
      });

      const binding = library.getBinding('import-test');
      expect(binding).toBeDefined();
      expect(binding?.action).toBe('import-action');

      const state = library.getState();
      expect(state.currentContext).toBe('combat');
      expect(state.deviceType).toBe('tablet');
      expect(state.accessibilityMode).toBe(true);
    });
  });

  describe('History and Metrics', () => {
    it('should clear history', () => {
      const event: GestureEvent = {
        id: 'test-clear',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      library.processGesture(event);
      expect(library.getGestureHistory().length).toBe(1);

      library.clearHistory();
      expect(library.getGestureHistory().length).toBe(0);
    });

    it('should get limited history', () => {
      // Add multiple gestures
      for (let i = 0; i < 5; i++) {
        const event: GestureEvent = {
          id: `test-${i}`,
          type: GESTURE_TYPES.TAP,
          timestamp: Date.now(),
          duration: 150,
          coordinates: {
            start: { x: 100, y: 100 },
            end: { x: 100, y: 100 },
            current: { x: 100, y: 100 },
          },
          distance: 5,
          velocity: 0.03,
          fingerCount: 1,
          confidence: 1.0,
          context: 'general',
          deviceType: 'mobile',
          metadata: {},
        };
        library.processGesture(event);
      }

      const limitedHistory = library.getGestureHistory(3);
      expect(limitedHistory.length).toBe(3);
      expect(limitedHistory[0].id).toBe('test-2'); // Should get last 3
      expect(limitedHistory[2].id).toBe('test-4');
    });

    it('should reset metrics', () => {
      const event: GestureEvent = {
        id: 'test-reset',
        type: GESTURE_TYPES.TAP,
        timestamp: Date.now(),
        duration: 150,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        distance: 5,
        velocity: 0.03,
        fingerCount: 1,
        confidence: 1.0,
        context: 'general',
        deviceType: 'mobile',
        metadata: {},
      };

      library.processGesture(event);
      expect(library.getPerformanceMetrics().totalGestures).toBe(1);

      library.resetMetrics();
      expect(library.getPerformanceMetrics().totalGestures).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('createGestureEvent', () => {
    it('should create gesture event from data', () => {
      const event = createGestureEvent({
        type: GESTURE_TYPES.SWIPE_RIGHT,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 200, y: 100 },
          current: { x: 200, y: 100 },
        },
        timestamp: Date.now(),
        duration: 250,
        fingerCount: 1,
        context: 'test',
        deviceType: 'mobile',
      });

      expect(event.type).toBe(GESTURE_TYPES.SWIPE_RIGHT);
      expect(event.direction).toBe(GESTURE_DIRECTIONS.RIGHT);
      expect(event.distance).toBe(100);
      expect(event.velocity).toBe(0.4);
      expect(event.confidence).toBe(1.0);
    });

    it('should calculate correct direction for swipe up', () => {
      const event = createGestureEvent({
        type: GESTURE_TYPES.SWIPE_UP,
        coordinates: {
          start: { x: 100, y: 200 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        timestamp: Date.now(),
        duration: 250,
        fingerCount: 1,
        context: 'test',
        deviceType: 'mobile',
      });

      expect(event.direction).toBe(GESTURE_DIRECTIONS.UP);
    });

    it('should include metadata', () => {
      const metadata = { test: 'value', number: 42 };
      const event = createGestureEvent({
        type: GESTURE_TYPES.TAP,
        coordinates: {
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          current: { x: 100, y: 100 },
        },
        timestamp: Date.now(),
        duration: 150,
        fingerCount: 1,
        context: 'test',
        deviceType: 'mobile',
        metadata,
      });

      expect(event.metadata).toEqual(metadata);
    });
  });

  describe('validateGestureConfig', () => {
    it('should validate valid configuration', () => {
      const validConfig = DEFAULT_GESTURE_CONFIG;
      const result = validateGestureConfig(validConfig);
      expect(result).toEqual(validConfig);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        thresholds: {
          swipe: {
            minDistance: -10, // Invalid negative value
            maxTime: 300,
            minVelocity: 0.1,
          },
        },
      } as any;

      const result = validateGestureConfig(invalidConfig);
      expect(result).toBeNull();
    });
  });

  describe('validateGestureBinding', () => {
    it('should validate valid binding', () => {
      const validBinding: GestureBinding = {
        id: 'test-binding',
        gestureType: GESTURE_TYPES.TAP,
        action: 'test-action',
        target: 'test-target',
        enabled: true,
        priority: 1,
        contexts: ['test'],
        deviceTypes: ['mobile'],
      };

      const result = validateGestureBinding(validBinding);
      expect(result).toEqual(validBinding);
    });

    it('should reject invalid binding', () => {
      const invalidBinding = {
        id: 'test-binding',
        gestureType: 'invalid-gesture', // Invalid type
        action: 'test-action',
        target: 'test-target',
        enabled: true,
        priority: 1,
        contexts: ['test'],
        deviceTypes: ['mobile'],
      } as any;

      const result = validateGestureBinding(invalidBinding);
      expect(result).toBeNull();
    });
  });

  describe('getGestureTypeFromString', () => {
    it('should return gesture type from valid string', () => {
      expect(getGestureTypeFromString('tap')).toBe(GESTURE_TYPES.TAP);
      expect(getGestureTypeFromString('swipeUp')).toBe(GESTURE_TYPES.SWIPE_UP);
      expect(getGestureTypeFromString('pinch')).toBe(GESTURE_TYPES.PINCH);
    });

    it('should return null for invalid string', () => {
      expect(getGestureTypeFromString('invalid')).toBeNull();
      expect(getGestureTypeFromString('')).toBeNull();
    });
  });

  describe('getGestureDirectionFromVector', () => {
    it('should return correct direction for vectors', () => {
      expect(getGestureDirectionFromVector(1, 0)).toBe(GESTURE_DIRECTIONS.RIGHT);
      expect(getGestureDirectionFromVector(-1, 0)).toBe(GESTURE_DIRECTIONS.LEFT);
      expect(getGestureDirectionFromVector(0, 1)).toBe(GESTURE_DIRECTIONS.DOWN);
      expect(getGestureDirectionFromVector(0, -1)).toBe(GESTURE_DIRECTIONS.UP);
    });

    it('should return null for zero vector', () => {
      expect(getGestureDirectionFromVector(0, 0)).toBeNull();
    });

    it('should handle diagonal vectors', () => {
      expect(getGestureDirectionFromVector(1, 1)).toBe(GESTURE_DIRECTIONS.DOWN);
      expect(getGestureDirectionFromVector(-1, -1)).toBe(GESTURE_DIRECTIONS.UP);
    });
  });

  describe('calculateGestureConfidence', () => {
    it('should calculate confidence from factors', () => {
      const factors = {
        accuracy: 0.8,
        speed: 0.9,
        consistency: 0.7,
        timing: 0.85,
      };

      const confidence = calculateGestureConfidence(factors);
      expect(confidence).toBeCloseTo(0.795, 3); // Weighted average
    });

    it('should handle edge cases', () => {
      const perfectFactors = {
        accuracy: 1.0,
        speed: 1.0,
        consistency: 1.0,
        timing: 1.0,
      };

      const confidence = calculateGestureConfidence(perfectFactors);
      expect(confidence).toBe(1.0);
    });
  });

  describe('isGestureAccessible', () => {
    it('should return true for basic gestures', () => {
      expect(isGestureAccessible(GESTURE_TYPES.TAP, DEFAULT_GESTURE_CONFIG)).toBe(true);
      expect(isGestureAccessible(GESTURE_TYPES.DOUBLE_TAP, DEFAULT_GESTURE_CONFIG)).toBe(true);
      expect(isGestureAccessible(GESTURE_TYPES.LONG_PRESS, DEFAULT_GESTURE_CONFIG)).toBe(true);
    });

    it('should return false for complex gestures without accessibility features', () => {
      expect(isGestureAccessible(GESTURE_TYPES.CIRCULAR, DEFAULT_GESTURE_CONFIG)).toBe(false);
      expect(isGestureAccessible(GESTURE_TYPES.TRIANGLE, DEFAULT_GESTURE_CONFIG)).toBe(false);
    });

    it('should return true for swipe gestures with large targets', () => {
      const accessibleConfig = {
        ...DEFAULT_GESTURE_CONFIG,
        accessibility: {
          ...DEFAULT_GESTURE_CONFIG.accessibility,
          largeTargets: true,
        },
      };

      expect(isGestureAccessible(GESTURE_TYPES.SWIPE_UP, accessibleConfig)).toBe(true);
    });

    it('should return true for pinch gestures with haptic enhancement', () => {
      const accessibleConfig = {
        ...DEFAULT_GESTURE_CONFIG,
        accessibility: {
          ...DEFAULT_GESTURE_CONFIG.accessibility,
          hapticEnhancement: true,
        },
      };

      expect(isGestureAccessible(GESTURE_TYPES.PINCH, accessibleConfig)).toBe(true);
    });
  });
});

describe('Global Instance', () => {
  it('should provide global gesture library instance', () => {
    expect(gestureLibrary).toBeDefined();
    expect(gestureLibrary.getConfig()).toBeDefined();
    expect(gestureLibrary.getAllBindings().length).toBeGreaterThan(0);
  });

  it('should maintain state across operations', () => {
    const initialMetrics = gestureLibrary.getPerformanceMetrics();
    expect(initialMetrics.totalGestures).toBe(0);

    const event: GestureEvent = {
      id: 'global-test',
      type: GESTURE_TYPES.TAP,
      timestamp: Date.now(),
      duration: 150,
      coordinates: {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 100 },
        current: { x: 100, y: 100 },
      },
      distance: 5,
      velocity: 0.03,
      fingerCount: 1,
      confidence: 1.0,
      context: 'general',
      deviceType: 'mobile',
      metadata: {},
    };

    gestureLibrary.processGesture(event);
    const updatedMetrics = gestureLibrary.getPerformanceMetrics();
    expect(updatedMetrics.totalGestures).toBe(1);

    // Clean up for other tests
    gestureLibrary.clearHistory();
    gestureLibrary.resetMetrics();
  });
});

describe('Constants and Enums', () => {
  it('should have all required gesture types', () => {
    expect(GESTURE_TYPES.TAP).toBe('tap');
    expect(GESTURE_TYPES.DOUBLE_TAP).toBe('doubleTap');
    expect(GESTURE_TYPES.LONG_PRESS).toBe('longPress');
    expect(GESTURE_TYPES.SWIPE_UP).toBe('swipeUp');
    expect(GESTURE_TYPES.SWIPE_DOWN).toBe('swipeDown');
    expect(GESTURE_TYPES.SWIPE_LEFT).toBe('swipeLeft');
    expect(GESTURE_TYPES.SWIPE_RIGHT).toBe('swipeRight');
    expect(GESTURE_TYPES.PINCH).toBe('pinch');
    expect(GESTURE_TYPES.SPREAD).toBe('spread');
    expect(GESTURE_TYPES.ROTATE).toBe('rotate');
    expect(GESTURE_TYPES.CIRCULAR).toBe('circular');
    expect(GESTURE_TYPES.TRIANGLE).toBe('triangle');
    expect(GESTURE_TYPES.Z_SHAPE).toBe('zShape');
    expect(GESTURE_TYPES.L_SHAPE).toBe('lShape');
    expect(GESTURE_TYPES.CUSTOM).toBe('custom');
  });

  it('should have all required gesture directions', () => {
    expect(GESTURE_DIRECTIONS.UP).toBe('up');
    expect(GESTURE_DIRECTIONS.DOWN).toBe('down');
    expect(GESTURE_DIRECTIONS.LEFT).toBe('left');
    expect(GESTURE_DIRECTIONS.RIGHT).toBe('right');
    expect(GESTURE_DIRECTIONS.DIAGONAL_UP_LEFT).toBe('diagonalUpLeft');
    expect(GESTURE_DIRECTIONS.DIAGONAL_UP_RIGHT).toBe('diagonalUpRight');
    expect(GESTURE_DIRECTIONS.DIAGONAL_DOWN_LEFT).toBe('diagonalDownLeft');
    expect(GESTURE_DIRECTIONS.DIAGONAL_DOWN_RIGHT).toBe('diagonalDownRight');
    expect(GESTURE_DIRECTIONS.CIRCULAR_CLOCKWISE).toBe('circularClockwise');
    expect(GESTURE_DIRECTIONS.CIRCULAR_COUNTER_CLOCKWISE).toBe('circularCounterClockwise');
  });

  it('should have default configuration with all required properties', () => {
    expect(DEFAULT_GESTURE_CONFIG).toBeDefined();
    expect(DEFAULT_GESTURE_CONFIG.thresholds).toBeDefined();
    expect(DEFAULT_GESTURE_CONFIG.sensitivity).toBeDefined();
    expect(DEFAULT_GESTURE_CONFIG.feedback).toBeDefined();
    expect(DEFAULT_GESTURE_CONFIG.performance).toBeDefined();
    expect(DEFAULT_GESTURE_CONFIG.accessibility).toBeDefined();
  });

  it('should have default bindings with all required properties', () => {
    expect(DEFAULT_GESTURE_BINDINGS.length).toBeGreaterThan(0);
    
    DEFAULT_GESTURE_BINDINGS.forEach(binding => {
      expect(binding.id).toBeDefined();
      expect(binding.gestureType).toBeDefined();
      expect(binding.action).toBeDefined();
      expect(binding.target).toBeDefined();
      expect(binding.enabled).toBeDefined();
      expect(binding.priority).toBeDefined();
      expect(binding.contexts).toBeDefined();
      expect(binding.deviceTypes).toBeDefined();
    });
  });

  it('should have context configurations', () => {
    expect(CONTEXT_GESTURE_CONFIGS).toBeDefined();
    expect(CONTEXT_GESTURE_CONFIGS.combat).toBeDefined();
    expect(CONTEXT_GESTURE_CONFIGS.terminal).toBeDefined();
    expect(CONTEXT_GESTURE_CONFIGS.navigation).toBeDefined();
    expect(CONTEXT_GESTURE_CONFIGS.accessibility).toBeDefined();
  });

  it('should have device configurations', () => {
    expect(DEVICE_GESTURE_CONFIGS).toBeDefined();
    expect(DEVICE_GESTURE_CONFIGS.mobile).toBeDefined();
    expect(DEVICE_GESTURE_CONFIGS.tablet).toBeDefined();
    expect(DEVICE_GESTURE_CONFIGS.desktop).toBeDefined();
  });
});
