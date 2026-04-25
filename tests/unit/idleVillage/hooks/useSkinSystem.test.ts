/**
 * useSkinSystem Hook Tests
 * 
 * Unit tests for the useSkinSystem hook and related functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  SkinPresetConfig,
  ComponentSkinBinding,
  SkinSystemConfig,
  SkinPresetId,
  StyleLabPillar,
  MotionLevel,
} from '@/ui/idleVillage/skins/types/SkinSchema';
import { 
  useSkinSystem,
  useSkinConfig,
  useSkinOperations,
  useSkinValidation,
  useSkinComponent,
  SkinSystemProvider,
  useSkinSystemContext,
  useIsPresetAvailable,
  useIsPillarSupported,
  useIsMotionLevelSupported,
  useAvailablePresetsForPillar,
  useSupportedPillars,
  useSupportedMotionLevels,
  useSkinDevTools,
  useSkinPerformance,
} from '@/ui/idleVillage/hooks/useSkinSystem';

// Mock the skin manager
const mockManager = {
  getState: vi.fn(),
  setPreset: vi.fn(),
  setPillar: vi.fn(),
  setMotionLevel: vi.fn(),
  resetState: vi.fn(),
  getPreset: vi.fn(),
  getAllPresets: vi.fn(),
  registerComponent: vi.fn(),
  unregisterComponent: vi.fn(),
  getComponentBinding: vi.fn(),
  generateClasses: vi.fn(),
  generateAttributes: vi.fn(),
  generateStyles: vi.fn(),
  validateState: vi.fn(),
  validateTransition: vi.fn(),
  subscribe: vi.fn(),
  trackEvent: vi.fn(),
};

// Mock getSkinManager
vi.mock('@/ui/idleVillage/skins/SkinManager', () => ({
  getSkinManager: vi.fn(() => mockManager),
}));

describe('useSkinSystem', () => {
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
    tags: ['test', 'component'],
  };

  const mockState = {
    currentPreset: 'minimal-frontier' as SkinPresetId,
    currentPillar: 'frontier' as StyleLabPillar,
    currentMotionLevel: 'full' as MotionLevel,
    activeBindings: {
      TestComponent: mockBinding,
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue(mockState);
    mockManager.getPreset.mockReturnValue(mockPreset);
    mockManager.getAllPresets.mockReturnValue([mockPreset]);
    mockManager.getComponentBinding.mockReturnValue(mockBinding);
    mockManager.generateClasses.mockReturnValue(['test-component', 'test-component-minimal-frontier']);
    mockManager.generateAttributes.mockReturnValue({ 'test-preset': 'minimal-frontier' });
    mockManager.generateStyles.mockReturnValue({ '--test-component-color-primary': '#000000' });
    mockManager.validateState.mockReturnValue({ isValid: true, errors: [], warnings: [] });
    mockManager.validateTransition.mockReturnValue({ isValid: true, errors: [], warnings: [] });
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  describe('Basic functionality', () => {
    it('should return current state', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      expect(result.current.state).toEqual(mockState);
      expect(result.current.isTransitioning).toBe(false);
    });

    it('should call setPreset when setPreset is called', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      act(() => {
        result.current.setPreset('wanderlust');
      });
      
      expect(mockManager.setPreset).toHaveBeenCalledWith('wanderlust');
    });

    it('should call setPillar when setPillar is called', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      act(() => {
        result.current.setPillar('wilderness');
      });
      
      expect(mockManager.setPillar).toHaveBeenCalledWith('wilderness');
    });

    it('should call setMotionLevel when setMotionLevel is called', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      act(() => {
        result.current.setMotionLevel('minimal');
      });
      
      expect(mockManager.setMotionLevel).toHaveBeenCalledWith('minimal');
    });

    it('should call resetState when resetState is called', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      act(() => {
        result.current.resetState();
      });
      
      expect(mockManager.resetState).toHaveBeenCalled();
    });
  });

  describe('Preset management', () => {
    it('should get preset by ID', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const preset = result.current.getPreset('test-preset');
      
      expect(preset).toEqual(mockPreset);
      expect(mockManager.getPreset).toHaveBeenCalledWith('test-preset');
    });

    it('should get all presets', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const presets = result.current.getAllPresets();
      
      expect(presets).toEqual([mockPreset]);
      expect(mockManager.getAllPresets).toHaveBeenCalled();
    });
  });

  describe('Component management', () => {
    it('should register component', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      act(() => {
        result.current.registerComponent(mockBinding);
      });
      
      expect(mockManager.registerComponent).toHaveBeenCalledWith(mockBinding);
    });

    it('should unregister component', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      act(() => {
        result.current.unregisterComponent('TestComponent');
      });
      
      expect(mockManager.unregisterComponent).toHaveBeenCalledWith('TestComponent');
    });

    it('should get component binding', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const binding = result.current.getComponentBinding('TestComponent');
      
      expect(binding).toEqual(mockBinding);
      expect(mockManager.getComponentBinding).toHaveBeenCalledWith('TestComponent');
    });

    it('should check if component exists', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const hasComponent = result.current.hasComponent('TestComponent');
      
      expect(hasComponent).toBe(true);
    });

    it('should return false for non-existent component', () => {
      mockManager.getComponentBinding.mockReturnValue(undefined);
      
      const { result } = renderHook(() => useSkinSystem());
      
      const hasComponent = result.current.hasComponent('NonExistentComponent');
      
      expect(hasComponent).toBe(false);
    });
  });

  describe('Style generation', () => {
    it('should generate classes', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const classes = result.current.generateClasses('TestComponent');
      
      expect(classes).toEqual(['test-component', 'test-component-minimal-frontier']);
      expect(mockManager.generateClasses).toHaveBeenCalledWith('TestComponent');
    });

    it('should generate attributes', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const attributes = result.current.generateAttributes('TestComponent');
      
      expect(attributes).toEqual({ 'test-preset': 'minimal-frontier' });
      expect(mockManager.generateAttributes).toHaveBeenCalledWith('TestComponent');
    });

    it('should generate styles', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const styles = result.current.generateStyles('TestComponent');
      
      expect(styles).toEqual({ '--test-component-color-primary': '#000000' });
      expect(mockManager.generateStyles).toHaveBeenCalledWith('TestComponent');
    });
  });

  describe('Validation', () => {
    it('should validate state', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const validation = result.current.validateState();
      
      expect(validation).toEqual({ isValid: true, errors: [], warnings: [] });
      expect(mockManager.validateState).toHaveBeenCalled();
    });

    it('should validate transition', () => {
      const { result } = renderHook(() => useSkinSystem());
      
      const validation = result.current.validateTransition('test-preset', 'frontier');
      
      expect(validation).toEqual({ isValid: true, errors: [], warnings: [] });
      expect(mockManager.validateTransition).toHaveBeenCalledWith('test-preset', 'frontier');
    });
  });

  describe('Configuration options', () => {
    it('should accept custom configuration', () => {
      const customConfig: Partial<SkinSystemConfig> = {
        enableTelemetry: false,
        defaultPreset: 'wanderlust',
      };

      renderHook(() => useSkinSystem({ config: customConfig }));
      
      // The hook should use the custom configuration
      expect(mockManager.getState).toHaveBeenCalled();
    });

    it('should disable auto updates when enableAutoUpdate is false', () => {
      renderHook(() => useSkinSystem({ enableAutoUpdate: false }));
      
      // Should not subscribe to manager changes
      expect(mockManager.subscribe).not.toHaveBeenCalled();
    });

    it('should use custom debounce time', () => {
      renderHook(() => useSkinSystem({ updateDebounceMs: 200 }));
      
      // Should still subscribe but with different debounce
      expect(mockManager.subscribe).toHaveBeenCalled();
    });
  });
});

describe('useSkinConfig', () => {
  const mockState = {
    currentPreset: 'minimal-frontier' as SkinPresetId,
    currentPillar: 'frontier' as StyleLabPillar,
    currentMotionLevel: 'full' as MotionLevel,
    activeBindings: {},
    computedStyles: {},
    computedClasses: {},
    computedAttributes: {},
    lastUpdated: '2023-01-01T00:00:00.000Z',
    updateCount: 0,
    isTransitioning: false,
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
    supportedComponents: [],
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    tags: ['minimal'],
    category: 'minimal',
    isDefault: false,
    isExperimental: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue(mockState);
    mockManager.getPreset.mockReturnValue(mockPreset);
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  it('should return current configuration', () => {
    const { result } = renderHook(() => useSkinConfig());
    
    expect(result.current).toEqual({
      presetId: 'minimal-frontier',
      pillar: 'frontier',
      motionLevel: 'full',
      preset: mockPreset,
      isTransitioning: false,
    });
  });
});

describe('useSkinOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue({
      currentPreset: 'minimal-frontier' as SkinPresetId,
      currentPillar: 'frontier' as StyleLabPillar,
      currentMotionLevel: 'full' as MotionLevel,
      activeBindings: {},
      computedStyles: {},
      computedClasses: {},
      computedAttributes: {},
      lastUpdated: '2023-01-01T00:00:00.000Z',
      updateCount: 0,
      isTransitioning: false,
    });
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  it('should return operations only', () => {
    const { result } = renderHook(() => useSkinOperations());
    
    expect(result.current).toEqual({
      setPreset: expect.any(Function),
      setPillar: expect.any(Function),
      setMotionLevel: expect.any(Function),
      resetState: expect.any(Function),
    });
  });
});

describe('useSkinValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue({
      currentPreset: 'minimal-frontier' as SkinPresetId,
      currentPillar: 'frontier' as StyleLabPillar,
      currentMotionLevel: 'full' as MotionLevel,
      activeBindings: {},
      computedStyles: {},
      computedClasses: {},
      computedAttributes: {},
      lastUpdated: '2023-01-01T00:00:00.000Z',
      updateCount: 0,
      isTransitioning: false,
    });
    mockManager.validateState.mockReturnValue({ isValid: true, errors: [], warnings: [] });
    mockManager.validateTransition.mockReturnValue({ isValid: true, errors: [], warnings: [] });
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  it('should return validation functions', () => {
    const { result } = renderHook(() => useSkinValidation());
    
    expect(result.current).toEqual({
      validateState: expect.any(Function),
      validateTransition: expect.any(Function),
    });
  });
});

describe('useSkinComponent', () => {
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
    tags: ['test', 'component'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue({
      currentPreset: 'minimal-frontier' as SkinPresetId,
      currentPillar: 'frontier' as StyleLabPillar,
      currentMotionLevel: 'full' as MotionLevel,
      activeBindings: {
        TestComponent: mockBinding,
      },
      computedStyles: {},
      computedClasses: {},
      computedAttributes: {},
      lastUpdated: '2023-01-01T00:00:00.000Z',
      updateCount: 0,
      isTransitioning: false,
    });
    mockManager.getComponentBinding.mockReturnValue(mockBinding);
    mockManager.generateClasses.mockReturnValue(['test-component']);
    mockManager.generateAttributes.mockReturnValue({ 'test-preset': 'minimal-frontier' });
    mockManager.generateStyles.mockReturnValue({ '--test-component-color': '#000000' });
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  it('should return component data', () => {
    const { result } = renderHook(() => useSkinComponent('TestComponent'));
    
    expect(result.current).toEqual({
      isRegistered: true,
      binding: mockBinding,
      classes: ['test-component'],
      attributes: { 'test-preset': 'minimal-frontier' },
      styles: { '--test-component-color': '#000000' },
    });
  });

  it('should return false for non-existent component', () => {
    mockManager.getComponentBinding.mockReturnValue(undefined);
    
    const { result } = renderHook(() => useSkinComponent('NonExistentComponent'));
    
    expect(result.current.isRegistered).toBe(false);
    expect(result.current.binding).toBeUndefined();
  });
});

describe('SkinSystemProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue({
      currentPreset: 'minimal-frontier' as SkinPresetId,
      currentPillar: 'frontier' as StyleLabPillar,
      currentMotionLevel: 'full' as MotionLevel,
      activeBindings: {},
      computedStyles: {},
      computedClasses: {},
      computedAttributes: {},
      lastUpdated: '2023-01-01T00:00:00.000Z',
      updateCount: 0,
      isTransitioning: false,
    });
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  it('should provide skin system context', () => {
    const { result } = renderHook(() => useSkinSystemContext(), {
      wrapper: ({ children }) => (
        <SkinSystemProvider>{children}</SkinSystemProvider>
      ),
    });
    
    expect(result.current).toBeDefined();
    expect(result.current.state).toBeDefined();
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useSkinSystemContext());
    }).toThrow('useSkinSystemContext must be used within a SkinSystemProvider');
  });
});

describe('Utility hooks', () => {
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
    supportedComponents: [],
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    supportedMotionLevels: ['minimal', 'reduced', 'full'],
    tags: ['test'],
    category: 'minimal',
    isDefault: false,
    isExperimental: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue({
      currentPreset: 'minimal-frontier' as SkinPresetId,
      currentPillar: 'frontier' as StyleLabPillar,
      currentMotionLevel: 'full' as MotionLevel,
      activeBindings: {},
      computedStyles: {},
      computedClasses: {},
      computedAttributes: {},
      lastUpdated: '2023-01-01T00:00:00.000Z',
      updateCount: 0,
      isTransitioning: false,
    });
    mockManager.getPreset.mockReturnValue(mockPreset);
    mockManager.getAllPresets.mockReturnValue([mockPreset]);
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  it('useIsPresetAvailable should check preset availability', () => {
    const { result } = renderHook(() => useIsPresetAvailable('test-preset'));
    
    expect(result.current).toBe(true);
    expect(mockManager.getPreset).toHaveBeenCalledWith('test-preset');
  });

  it('useIsPillarSupported should check pillar support', () => {
    const { result } = renderHook(() => useIsPillarSupported('frontier'));
    
    expect(result.current).toBe(true);
  });

  it('useIsMotionLevelSupported should check motion level support', () => {
    const { result } = renderHook(() => useIsMotionLevelSupported('full'));
    
    expect(result.current).toBe(true);
  });

  it('useAvailablePresetsForPillar should filter presets by pillar', () => {
    const { result } = renderHook(() => useAvailablePresetsForPillar('frontier'));
    
    expect(result.current).toEqual([mockPreset]);
  });

  it('useSupportedPillars should return supported pillars', () => {
    const { result } = renderHook(() => useSupportedPillars());
    
    expect(result.current).toEqual(['frontier', 'wilderness', 'empire']);
  });

  it('useSupportedMotionLevels should return supported motion levels', () => {
    const { result } = renderHook(() => useSupportedMotionLevels());
    
    expect(result.current).toEqual(['minimal', 'reduced', 'full']);
  });
});

describe('Development tools hooks', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager.getState.mockReturnValue({
      currentPreset: 'minimal-frontier' as SkinPresetId,
      currentPillar: 'frontier' as StyleLabPillar,
      currentMotionLevel: 'full' as MotionLevel,
      activeBindings: {},
      computedStyles: {},
      computedClasses: {},
      computedAttributes: {},
      lastUpdated: '2023-01-01T00:00:00.000Z',
      updateCount: 0,
      isTransitioning: false,
    });
    mockManager.validateState.mockReturnValue({ isValid: true, errors: [], warnings: [] });
    mockManager.subscribe.mockReturnValue(vi.fn());
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('useSkinDevTools should return debug info in development', () => {
    process.env.NODE_ENV = 'development';
    
    const { result } = renderHook(() => useSkinDevTools());
    
    expect(result.current.isDevMode).toBe(true);
    expect(result.current.debugInfo).toBeDefined();
  });

  it('useSkinDevTools should return disabled in production', () => {
    process.env.NODE_ENV = 'production';
    
    const { result } = renderHook(() => useSkinDevTools());
    
    expect(result.current.isDevMode).toBe(false);
    expect(result.current.debugInfo).toBeNull();
  });

  it('useSkinPerformance should return performance metrics', () => {
    const { result } = renderHook(() => useSkinPerformance());
    
    expect(result.current.componentCount).toBe(0);
    expect(result.current.updateCount).toBe(0);
    expect(result.current.isTransitioning).toBe(false);
  });
});
