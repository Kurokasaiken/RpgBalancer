/**
 * Skin Schema Tests
 * 
 * Unit tests for skin schema types and validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SkinPresetId,
  StyleLabPillar,
  MotionLevel,
  SkinPresetConfig,
  ComponentSkinBinding,
  SkinState,
  SkinAction,
  ValidationErrorCode,
  ComponentCategory,
  PresetCategory,
  TelemetryCategory,
  EventSeverity,
} from '@/ui/idleVillage/skins/types/SkinSchema';

describe('Skin Schema Types', () => {
  describe('Basic Types', () => {
    it('should have valid preset IDs', () => {
      const validPresets: SkinPresetId[] = [
        'minimal-frontier',
        'minimal-wilderness',
        'minimal-empire',
        'wanderlust',
        'arcane-tech',
        'gilded-observatory',
      ];

      expect(validPresets).toHaveLength(6);
      expect(validPresets).toContain('minimal-frontier');
      expect(validPresets).toContain('wanderlust');
    });

    it('should have valid pillars', () => {
      const validPillars: StyleLabPillar[] = ['frontier', 'wilderness', 'empire'];
      
      expect(validPillars).toHaveLength(3);
      expect(validPillars).toContain('frontier');
      expect(validPillars).toContain('wilderness');
      expect(validPillars).toContain('empire');
    });

    it('should have valid motion levels', () => {
      const validMotionLevels: MotionLevel[] = ['minimal', 'reduced', 'full'];
      
      expect(validMotionLevels).toHaveLength(3);
      expect(validMotionLevels).toContain('minimal');
      expect(validMotionLevels).toContain('reduced');
      expect(validMotionLevels).toContain('full');
    });
  });

  describe('SkinPresetConfig', () => {
    it('should create valid preset config', () => {
      const config: SkinPresetConfig = {
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

      expect(config.id).toBe('test-preset');
      expect(config.name).toBe('Test Preset');
      expect(config.colors.primary).toBe('#000000');
      expect(config.supportedPillars).toHaveLength(3);
      expect(config.category).toBe('minimal');
    });

    it('should handle pillar overrides', () => {
      const config: SkinPresetConfig = {
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
        pillarOverrides: {
          wilderness: {
            colors: {
              primary: '#00ff00',
              secondary: '#ff00ff',
            },
          },
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

      expect(config.pillarOverrides).toBeDefined();
      expect(config.pillarOverrides?.wilderness).toBeDefined();
      expect(config.pillarOverrides?.wilderness?.colors?.primary).toBe('#00ff00');
    });
  });

  describe('ComponentSkinBinding', () => {
    it('should create valid component binding', () => {
      const binding: ComponentSkinBinding = {
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
        skinProperties: {
          materialType: 'metal',
          interactionPhysics: true,
        },
        requiredProperties: ['materialType'],
        optionalProperties: ['interactionPhysics'],
        category: 'interactive',
        priority: 1,
        tags: ['test', 'component'],
      };

      expect(binding.componentId).toBe('TestComponent');
      expect(binding.cssClassBase).toBe('test-component');
      expect(binding.supportsMotionLevel).toBe(true);
      expect(binding.supportsPillars).toContain('frontier');
      expect(binding.skinProperties?.materialType).toBe('metal');
      expect(binding.category).toBe('interactive');
    });
  });

  describe('SkinState', () => {
    it('should create valid skin state', () => {
      const state: SkinState = {
        currentPreset: 'minimal-frontier',
        currentPillar: 'frontier',
        currentMotionLevel: 'full',
        activeBindings: {
          TestComponent: {
            componentId: 'TestComponent',
            name: 'Test Component',
            description: 'A test component',
            version: '1.0.0',
            defaultPreset: 'minimal-frontier',
            supportedPillars: ['frontier', 'wilderness'],
            supportedMotionLevels: ['full'],
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
          },
        },
        computedStyles: {
          TestComponent: {
            '--test-component-color-primary': '#000000',
          },
        },
        computedClasses: {
          TestComponent: ['test-component', 'test-component-minimal-frontier'],
        },
        computedAttributes: {
          TestComponent: {
            'test-preset': 'minimal-frontier',
            'test-pillar': 'frontier',
          },
        },
        lastUpdated: '2023-01-01T00:00:00.000Z',
        updateCount: 0,
        isTransitioning: false,
      };

      expect(state.currentPreset).toBe('minimal-frontier');
      expect(state.currentPillar).toBe('frontier');
      expect(state.currentMotionLevel).toBe('full');
      expect(Object.keys(state.activeBindings)).toContain('TestComponent');
      expect(state.computedClasses.TestComponent).toContain('test-component');
      expect(state.isTransitioning).toBe(false);
    });
  });

  describe('SkinAction', () => {
    it('should create valid actions', () => {
      const setPresetAction: SkinAction = {
        type: 'SET_PRESET',
        payload: { presetId: 'wanderlust' },
      };

      const setPillarAction: SkinAction = {
        type: 'SET_PILLAR',
        payload: { pillar: 'wilderness' },
      };

      const setMotionAction: SkinAction = {
        type: 'SET_MOTION_LEVEL',
        payload: { motionLevel: 'minimal' },
      };

      const registerComponentAction: SkinAction = {
        type: 'REGISTER_COMPONENT',
        payload: {
          binding: {
            componentId: 'TestComponent',
            name: 'Test Component',
            description: 'A test component',
            version: '1.0.0',
            defaultPreset: 'minimal-frontier',
            supportedPillars: ['frontier'],
            supportedMotionLevels: ['full'],
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
          },
        },
      };

      expect(setPresetAction.type).toBe('SET_PRESET');
      expect(setPresetAction.payload.presetId).toBe('wanderlust');
      expect(setPillarAction.payload.pillar).toBe('wilderness');
      expect(setMotionAction.payload.motionLevel).toBe('minimal');
      expect(registerComponentAction.payload.binding.componentId).toBe('TestComponent');
    });
  });
});

describe('Validation Error Codes', () => {
  it('should have all required error codes', () => {
    const expectedCodes = [
      ValidationErrorCode.INVALID_PRESET_ID,
      ValidationErrorCode.INVALID_PILLAR,
      ValidationErrorCode.INVALID_MOTION_LEVEL,
      ValidationErrorCode.MISSING_REQUIRED_PROPERTY,
      ValidationErrorCode.INVALID_COLOR_FORMAT,
      ValidationErrorCode.INVALID_ANIMATION_CONFIG,
      ValidationErrorCode.COMPONENT_NOT_FOUND,
      ValidationErrorCode.PRESET_NOT_FOUND,
      ValidationErrorCode.INVALID_TRANSITION,
      ValidationErrorCode.CIRCULAR_DEPENDENCY,
      ValidationErrorCode.VALIDATION_FAILED,
    ];

    expect(expectedCodes).toHaveLength(11);
    expect(expectedCodes).toContain(ValidationErrorCode.INVALID_PRESET_ID);
    expect(expectedCodes).toContain(ValidationErrorCode.MISSING_REQUIRED_PROPERTY);
  });
});

describe('Enums', () => {
  it('should have correct component categories', () => {
    expect(ComponentCategory.UI).toBe('ui');
    expect(ComponentCategory.INTERACTIVE).toBe('interactive');
    expect(ComponentCategory.DISPLAY).toBe('display');
    expect(ComponentCategory.CONTAINER).toBe('container');
  });

  it('should have correct preset categories', () => {
    expect(PresetCategory.MINIMAL).toBe('minimal');
    expect(PresetCategory.THEMED).toBe('themed');
    expect(PresetCategory.EXPERIMENTAL).toBe('experimental');
  });

  it('should have correct telemetry categories', () => {
    expect(TelemetryCategory.SKIN).toBe('skin');
    expect(TelemetryCategory.COMPONENT).toBe('component');
    expect(TelemetryCategory.SYSTEM).toBe('system');
  });

  it('should have correct event severity levels', () => {
    expect(EventSeverity.INFO).toBe('info');
    expect(EventSeverity.WARNING).toBe('warning');
    expect(EventSeverity.ERROR).toBe('error');
  });
});

describe('Type Safety', () => {
  it('should enforce type constraints', () => {
    // This should compile without errors
    const presetId: SkinPresetId = 'minimal-frontier';
    const pillar: StyleLabPillar = 'frontier';
    const motionLevel: MotionLevel = 'full';

    expect(typeof presetId).toBe('string');
    expect(typeof pillar).toBe('string');
    expect(typeof motionLevel).toBe('string');

    // These should cause compilation errors if uncommented:
    // const invalidPreset: SkinPresetId = 'invalid-preset';
    // const invalidPillar: StyleLabPillar = 'invalid-pillar';
    // const invalidMotionLevel: MotionLevel = 'invalid-motion';
  });

  it('should handle optional properties correctly', () => {
    const binding: ComponentSkinBinding = {
      componentId: 'TestComponent',
      name: 'Test Component',
      description: 'A test component',
      version: '1.0.0',
      defaultPreset: 'minimal-frontier',
      supportedPillars: ['frontier'],
      supportedMotionLevels: ['full'],
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
      // skinProperties is optional
    };

    expect(binding.skinProperties).toBeUndefined();
    expect(binding.dependencies).toBeUndefined();
  });
});
