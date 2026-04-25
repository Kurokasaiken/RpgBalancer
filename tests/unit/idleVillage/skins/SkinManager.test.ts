/**
 * Skin Manager Tests
 * 
 * Unit tests for the SkinManager class and its functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkinManager } from '@/ui/idleVillage/skins/SkinManager';
import { 
  SkinPresetConfig,
  ComponentSkinBinding,
  SkinSystemConfig,
  ValidationErrorCode,
  SkinPresetId,
  StyleLabPillar,
  MotionLevel,
} from '@/ui/idleVillage/skins/types/SkinSchema';

// Mock telemetry
const mockTrackTelemetryEvent = vi.fn();
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: mockTrackTelemetryEvent,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('SkinManager', () => {
  let manager: SkinManager;
  let mockValidator: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockValidator = {
      validatePreset: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
      validateBinding: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
      validateState: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
      validateTransition: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    };

    manager = new SkinManager({
      enableTelemetry: true,
      enableDebugMode: false,
      enablePerformanceMonitoring: false,
      enablePersistence: false, // Disable persistence for tests
    }, mockValidator);
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const state = manager.getState();
      
      expect(state.currentPreset).toBe('minimal-frontier');
      expect(state.currentPillar).toBe('frontier');
      expect(state.currentMotionLevel).toBe('full');
      expect(state.activeBindings).toEqual({});
      expect(state.updateCount).toBe(0);
      expect(state.isTransitioning).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<SkinSystemConfig> = {
        defaultPreset: 'wanderlust',
        defaultPillar: 'wilderness',
        defaultMotionLevel: 'minimal',
        enableTelemetry: false,
      };

      const customManager = new SkinManager(customConfig);
      const state = customManager.getState();
      
      expect(state.currentPreset).toBe('wanderlust');
      expect(state.currentPillar).toBe('wilderness');
      expect(state.currentMotionLevel).toBe('minimal');
    });
  });

  describe('State Management', () => {
    it('should update state when action is dispatched', () => {
      const initialState = manager.getState();
      
      manager.dispatch({ type: 'SET_PRESET', payload: { presetId: 'wanderlust' } });
      
      const newState = manager.getState();
      expect(newState.currentPreset).toBe('wanderlust');
      expect(newState.updateCount).toBe(initialState.updateCount + 1);
      expect(newState.lastUpdated).not.toBe(initialState.lastUpdated);
    });

    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);
      
      manager.dispatch({ type: 'SET_PRESET', payload: { presetId: 'wanderlust' } });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        currentPreset: 'wanderlust',
      }));
      
      unsubscribe();
    });

    it('should unsubscribe listeners correctly', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);
      
      unsubscribe();
      
      manager.dispatch({ type: 'SET_PRESET', payload: { presetId: 'wanderlust' } });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Preset Management', () => {
    const mockPreset: SkinPresetConfig = {
      id: 'test-preset',
      name: 'Test Preset',
      description: 'A test preset',
      version: '1.0.0',
      author: 'test-author',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#ff0000',
        background: '#f0f0f0',
        surface: '#ffffff',
        border: '#cccccc',
        text: '#333333',
        textSecondary: '#666666',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
        info: '#0000ff',
      },
      animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out',
        delay: 0,
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: {
          xs: '12px',
          sm: '14px',
          base: '16px',
          lg: '18px',
          xl: '20px',
          '2xl': '24px',
          '3xl': '30px',
          '4xl': '36px',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.8,
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borders: {
        radius: {
          none: '0',
          sm: '4px',
          md: '8px',
          lg: '12px',
          xl: '16px',
          full: '50%',
        },
        width: {
          none: '0',
          thin: '1px',
          normal: '2px',
          thick: '4px',
        },
      },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.1)',
        '2xl': '0 25px 50px rgba(0,0,0,0.25)',
        inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      },
      supportedComponents: ['TestComponent'],
      supportedPillars: ['frontier', 'wilderness', 'empire'],
      supportedMotionLevels: ['minimal', 'reduced', 'full'],
      tags: ['test'],
      category: 'minimal',
      isDefault: false,
      isExperimental: false,
    };

    it('should register and retrieve presets', () => {
      manager.registerPreset(mockPreset);
      
      const retrieved = manager.getPreset('test-preset');
      expect(retrieved).toEqual(mockPreset);
      
      const allPresets = manager.getAllPresets();
      expect(allPresets).toContain(mockPreset);
    });

    it('should set preset and update state', () => {
      manager.registerPreset(mockPreset);
      
      manager.setPreset('test-preset');
      
      const state = manager.getState();
      expect(state.currentPreset).toBe('test-preset');
    });

    it('should throw error for non-existent preset', () => {
      expect(() => {
        manager.setPreset('non-existent-preset');
      }).toThrow('Preset not found: non-existent-preset');
    });

    it('should unregister presets', () => {
      manager.registerPreset(mockPreset);
      expect(manager.getPreset('test-preset')).toBeDefined();
      
      const unregistered = manager.unregisterPreset('test-preset');
      expect(unregistered).toBe(true);
      expect(manager.getPreset('test-preset')).toBeUndefined();
    });

    it('should return false when unregistering non-existent preset', () => {
      const unregistered = manager.unregisterPreset('non-existent-preset');
      expect(unregistered).toBe(false);
    });
  });

  describe('Pillar Management', () => {
    it('should set pillar and update state', () => {
      manager.setPillar('wilderness');
      
      const state = manager.getState();
      expect(state.currentPillar).toBe('wilderness');
    });

    it('should return current pillar', () => {
      expect(manager.getCurrentPillar()).toBe('frontier');
      
      manager.setPillar('wilderness');
      expect(manager.getCurrentPillar()).toBe('wilderness');
    });
  });

  describe('Motion Level Management', () => {
    it('should set motion level and update state', () => {
      manager.setMotionLevel('minimal');
      
      const state = manager.getState();
      expect(state.currentMotionLevel).toBe('minimal');
    });

    it('should return current motion level', () => {
      expect(manager.getCurrentMotionLevel()).toBe('full');
      
      manager.setMotionLevel('minimal');
      expect(manager.getCurrentMotionLevel()).toBe('minimal');
    });
  });

  describe('Component Management', () => {
    const mockBinding: ComponentSkinBinding = {
      componentId: 'TestComponent',
      name: 'Test Component',
      description: 'A test component',
      version: '1.0.0',
      defaultPreset: 'minimal-frontier',
      supportedPillars: ['frontier', 'wilderness'],
      supportedMotionLevels: ['full', 'reduced'],
      cssClassBase: 'test-component',
      dataAttributePrefix: 'test',
      supportsMotionLevel: true,
      supportsTelemetry: true,
      supportsPillarSwitching: true,
      requiredProperties: ['materialType'],
      optionalProperties: ['interactionPhysics'],
      category: 'interactive',
      priority: 1,
      tags: ['test', 'component'],
      skinProperties: {
        materialType: 'metal',
        interactionPhysics: true,
      },
    };

    it('should register and retrieve component bindings', () => {
      manager.registerComponent(mockBinding);
      
      const retrieved = manager.getComponentBinding('TestComponent');
      expect(retrieved).toEqual(mockBinding);
      
      const state = manager.getState();
      expect(state.activeBindings.TestComponent).toEqual(mockBinding);
    });

    it('should unregister components', () => {
      manager.registerComponent(mockBinding);
      expect(manager.getComponentBinding('TestComponent')).toBeDefined();
      
      manager.unregisterComponent('TestComponent');
      expect(manager.getComponentBinding('TestComponent')).toBeUndefined();
      
      const state = manager.getState();
      expect(state.activeBindings.TestComponent).toBeUndefined();
    });

    it('should throw error for too many components', () => {
      const config: Partial<SkinSystemConfig> = { maxComponentCount: 1 };
      const limitedManager = new SkinManager(config);
      
      limitedManager.registerComponent(mockBinding);
      
      expect(() => {
        limitedManager.registerComponent({
          ...mockBinding,
          componentId: 'AnotherComponent',
        });
      }).toThrow('Maximum component count exceeded: 1');
    });
  });

  describe('Style Generation', () => {
    const mockBinding: ComponentSkinBinding = {
      componentId: 'TestComponent',
      name: 'Test Component',
      description: 'A test component',
      version: '1.0.0',
      defaultPreset: 'minimal-frontier',
      supportedPillars: ['frontier', 'wilderness'],
      supportedMotionLevels: ['full', 'reduced'],
      cssClassBase: 'test-component',
      dataAttributePrefix: 'test',
      supportsMotionLevel: true,
      supportsTelemetry: true,
      supportsPillarSwitching: true,
      requiredProperties: [],
      optionalProperties: [],
      category: 'interactive',
      priority: 1,
      tags: [],
    };

    const mockPreset: SkinPresetConfig = {
      id: 'minimal-frontier',
      name: 'Minimal Frontier',
      description: 'Minimal frontier preset',
      version: '1.0.0',
      author: 'test-author',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#ff0000',
        background: '#f0f0f0',
        surface: '#ffffff',
        border: '#cccccc',
        text: '#333333',
        textSecondary: '#666666',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
        info: '#0000ff',
      },
      animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out',
        delay: 0,
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: {
          xs: '12px',
          sm: '14px',
          base: '16px',
          lg: '18px',
          xl: '20px',
          '2xl': '24px',
          '3xl': '30px',
          '4xl': '36px',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.8,
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borders: {
        radius: {
          none: '0',
          sm: '4px',
          md: '8px',
          lg: '12px',
          xl: '16px',
          full: '50%',
        },
        width: {
          none: '0',
          thin: '1px',
          normal: '2px',
          thick: '4px',
        },
      },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.1)',
        '2xl': '0 25px 50px rgba(0,0,0,0.25)',
        inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      },
      supportedComponents: ['TestComponent'],
      supportedPillars: ['frontier', 'wilderness', 'empire'],
      supportedMotionLevels: ['minimal', 'reduced', 'full'],
      tags: ['minimal'],
      category: 'minimal',
      isDefault: false,
      isExperimental: false,
    };

    beforeEach(() => {
      manager.registerPreset(mockPreset);
      manager.registerComponent(mockBinding);
    });

    it('should generate CSS classes', () => {
      const classes = manager.generateClasses('TestComponent');
      
      expect(classes).toContain('test-component');
      expect(classes).toContain('test-component-minimal-frontier');
      expect(classes).toContain('test-component-frontier');
      expect(classes).toContain('test-component-motion-full');
    });

    it('should generate data attributes', () => {
      const attributes = manager.generateAttributes('TestComponent');
      
      expect(attributes['test-preset']).toBe('minimal-frontier');
      expect(attributes['test-pillar']).toBe('frontier');
      expect(attributes['test-motion']).toBe('full');
      expect(attributes['test-component']).toBe('TestComponent');
    });

    it('should generate CSS styles', () => {
      const styles = manager.generateStyles('TestComponent');
      
      expect(styles['--test-component-color-primary']).toBe('#000000');
      expect(styles['--test-component-color-secondary']).toBe('#ffffff');
      expect(styles['--test-component-animation-duration']).toBe('300ms');
    });

    it('should handle motion level changes in styles', () => {
      manager.setMotionLevel('minimal');
      
      const styles = manager.generateStyles('TestComponent');
      expect(styles['--test-component-animation-duration']).toBe('0s');
    });

    it('should handle pillar overrides', () => {
      const presetWithOverrides: SkinPresetConfig = {
        ...mockPreset,
        pillarOverrides: {
          wilderness: {
            colors: {
              primary: '#00ff00',
            },
          },
        },
      };
      
      manager.registerPreset(presetWithOverrides);
      manager.setPillar('wilderness');
      
      const styles = manager.generateStyles('TestComponent');
      expect(styles['--test-component-color-primary']).toBe('#00ff00');
    });

    it('should return empty arrays for non-existent components', () => {
      const classes = manager.generateClasses('NonExistentComponent');
      const attributes = manager.generateAttributes('NonExistentComponent');
      const styles = manager.generateStyles('NonExistentComponent');
      
      expect(classes).toEqual([]);
      expect(attributes).toEqual({});
      expect(styles).toEqual({});
    });
  });

  describe('Validation', () => {
    it('should validate state', () => {
      const result = manager.validateState();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate transitions', () => {
      const mockPreset: SkinPresetConfig = {
        id: 'test-preset',
        name: 'Test Preset',
        description: 'A test preset',
        version: '1.0.0',
        author: 'test-author',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#ff0000',
          background: '#f0f0f0',
          surface: '#ffffff',
          border: '#cccccc',
          text: '#333333',
          textSecondary: '#666666',
          success: '#00ff00',
          warning: '#ffff00',
          error: '#ff0000',
          info: '#0000ff',
        },
        animations: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out',
          delay: 0,
        },
        typography: {
          fontFamily: 'Arial, sans-serif',
          fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px',
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.8,
          },
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
          '2xl': '48px',
          '3xl': '64px',
        },
        borders: {
          radius: {
            none: '0',
            sm: '4px',
            md: '8px',
            lg: '12px',
            xl: '16px',
            full: '50%',
          },
          width: {
            none: '0',
            thin: '1px',
            normal: '2px',
            thick: '4px',
          },
        },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.1)',
          md: '0 4px 6px rgba(0,0,0,0.1)',
          lg: '0 10px 15px rgba(0,0,0,0.1)',
          xl: '0 20px 25px rgba(0,0,0,0.1)',
          '2xl': '0 25px 50px rgba(0,0,0,0.25)',
          inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        },
        supportedComponents: ['TestComponent'],
        supportedPillars: ['frontier', 'wilderness', 'empire'],
        supportedMotionLevels: ['minimal', 'reduced', 'full'],
        tags: ['test'],
        category: 'minimal',
        isDefault: false,
        isExperimental: false,
      };

      manager.registerPreset(mockPreset);
      
      const result = manager.validateTransition('test-preset', 'frontier');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid transitions', () => {
      mockValidator.validateTransition.mockReturnValue({
        isValid: false,
        errors: [{
          code: ValidationErrorCode.INVALID_PILLAR,
          message: 'Pillar not supported',
          path: 'pillar',
          severity: 'error',
        }],
        warnings: [],
      });

      expect(() => {
        manager.setPillar('invalid-pillar');
      }).toThrow('Invalid action: Pillar not supported');
    });
  });

  describe('Telemetry', () => {
    beforeEach(() => {
      // Mock session storage
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
        },
      });
    });

    it('should track events when telemetry is enabled', () => {
      manager.trackEvent('skin_preset_changed', {
        previousPreset: 'minimal-frontier',
        newPreset: 'wanderlust',
        changeReason: 'user',
      });

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'skin_preset_changed',
        expect.objectContaining({
          timestamp: expect.any(String),
          presetId: 'minimal-frontier',
          pillar: 'frontier',
          motionLevel: 'full',
          action: 'skin_preset_changed',
          category: 'skin',
          severity: 'info',
          previousPreset: 'minimal-frontier',
          newPreset: 'wanderlust',
          changeReason: 'user',
        })
      );
    });

    it('should not track events when telemetry is disabled', () => {
      const noTelemetryManager = new SkinManager({ enableTelemetry: false });
      
      noTelemetryManager.trackEvent('skin_preset_changed', {
        previousPreset: 'minimal-frontier',
        newPreset: 'wanderlust',
        changeReason: 'user',
      });

      expect(mockTrackTelemetryEvent).not.toHaveBeenCalled();
    });

    it('should track telemetry for actions', () => {
      const mockPreset: SkinPresetConfig = {
        id: 'test-preset',
        name: 'Test Preset',
        description: 'A test preset',
        version: '1.0.0',
        author: 'test-author',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#ff0000',
          background: '#f0f0f0',
          surface: '#ffffff',
          border: '#cccccc',
          text: '#333333',
          textSecondary: '#666666',
          success: '#00ff00',
          warning: '#ffff00',
          error: '#ff0000',
          info: '#0000ff',
        },
        animations: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out',
          delay: 0,
        },
        typography: {
          fontFamily: 'Arial, sans-serif',
          fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px',
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.8,
          },
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
          '2xl': '48px',
          '3xl': '64px',
        },
        borders: {
          radius: {
            none: '0',
            sm: '4px',
            md: '8px',
            lg: '12px',
            xl: '16px',
            full: '50%',
          },
          width: {
            none: '0',
            thin: '1px',
            normal: '2px',
            thick: '4px',
          },
        },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.1)',
          md: '0 4px 6px rgba(0,0,0,0.1)',
          lg: '0 10px 15px rgba(0,0,0,0.1)',
          xl: '0 20px 25px rgba(0,0,0,0.1)',
          '2xl': '0 25px 50px rgba(0,0,0,0.25)',
          inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        },
        supportedComponents: ['TestComponent'],
        supportedPillars: ['frontier', 'wilderness', 'empire'],
        supportedMotionLevels: ['minimal', 'reduced', 'full'],
        tags: ['test'],
        category: 'minimal',
        isDefault: false,
        isExperimental: false,
      };

      manager.registerPreset(mockPreset);
      manager.setPreset('test-preset');

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'skin_preset_changed',
        expect.objectContaining({
          action: 'skin_preset_changed',
          previousPreset: 'minimal-frontier',
          newPreset: 'test-preset',
          changeReason: 'user',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      mockValidator.validatePreset.mockReturnValue({
        isValid: false,
        errors: [{
          code: ValidationErrorCode.INVALID_COLOR_FORMAT,
          message: 'Invalid color format',
          path: 'colors.primary',
          severity: 'error',
        }],
        warnings: [],
      });

      const invalidPreset: SkinPresetConfig = {
        id: 'invalid-preset',
        name: 'Invalid Preset',
        description: 'An invalid preset',
        version: '1.0.0',
        author: 'test-author',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        colors: {
          primary: 'invalid-color',
          secondary: '#ffffff',
          accent: '#ff0000',
          background: '#f0f0f0',
          surface: '#ffffff',
          border: '#cccccc',
          text: '#333333',
          textSecondary: '#666666',
          success: '#00ff00',
          warning: '#ffff00',
          error: '#ff0000',
          info: '#0000ff',
        },
        animations: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out',
          delay: 0,
        },
        typography: {
          fontFamily: 'Arial, sans-serif',
          fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px',
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.8,
          },
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
          '2xl': '48px',
          '3xl': '64px',
        },
        borders: {
          radius: {
            none: '0',
            sm: '4px',
            md: '8px',
            lg: '12px',
            xl: '16px',
            full: '50%',
          },
          width: {
            none: '0',
            thin: '1px',
            normal: '2px',
            thick: '4px',
          },
        },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.1)',
          md: '0 4px 6px rgba(0,0,0,0.1)',
          lg: '0 10px 15px rgba(0,0,0,0.1)',
          xl: '0 20px 25px rgba(0,0,0,0.1)',
          '2xl': '0 25px 50px rgba(0,0,0,0.25)',
          inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        },
        supportedComponents: ['TestComponent'],
        supportedPillars: ['frontier', 'wilderness', 'empire'],
        supportedMotionLevels: ['minimal', 'reduced', 'full'],
        tags: ['test'],
        category: 'minimal',
        isDefault: false,
        isExperimental: false,
      };

      expect(() => {
        manager.registerPreset(invalidPreset);
      }).toThrow('Invalid preset: Invalid color format');
    });

    it('should track error telemetry', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error
      expect(() => {
        manager.setPreset('non-existent-preset');
      }).toThrow();

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'skin_error',
        expect.objectContaining({
          error: expect.any(String),
          action: 'SET_PRESET',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance when enabled', () => {
      const perfManager = new SkinManager({
        enablePerformanceMonitoring: true,
        enableTelemetry: true,
      });

      perfManager.dispatch({ type: 'SET_PRESET', payload: { presetId: 'minimal-frontier' } });

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'skin_performance',
        expect.objectContaining({
          operation: 'SET_PRESET',
          duration: expect.any(Number),
          componentCount: expect.any(Number),
        })
      );
    });

    it('should not track performance when disabled', () => {
      const perfManager = new SkinManager({
        enablePerformanceMonitoring: false,
        enableTelemetry: true,
      });

      perfManager.dispatch({ type: 'SET_PRESET', payload: { presetId: 'minimal-frontier' } });

      expect(mockTrackTelemetryEvent).not.toHaveBeenCalledWith(
        'skin_performance',
        expect.any(Object)
      );
    });
  });
});
