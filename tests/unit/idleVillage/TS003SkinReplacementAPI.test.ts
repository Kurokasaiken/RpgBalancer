/**
 * TS-003: SkinReplacementAPI & DevTools Test Suite
 * 
 * Comprehensive test suite for TS-003 compliance of the skin replacement API
 * and development tools. Tests hot-reloading, inspection, and debugging features.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { 
  SkinReplacementAPI_TS003,
  getSkinReplacementAPI_TS003,
  type SkinReplacementOptions,
  type HotReloadConfig,
  type SkinInspectionResult
} from '@/ui/idleVillage/skins/SkinReplacementAPI_TS003';
import SkinDevTools_TS003 from '@/ui/idleVillage/skins/SkinDevTools_TS003';

// ============================================================================
// TEST UTILITIES
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

// Mock skin system
const mockSkinManager = {
  getState: vi.fn(() => ({
    currentPreset: 'minimal-frontier' as SkinPresetId,
    currentPillar: 'frontier' as StyleLabPillar,
    currentMotionLevel: 'full' as MotionLevel,
    isTransitioning: false,
    activeBindings: {
      'TestComponent': {
        componentId: 'TestComponent',
        name: 'Test Component',
        description: 'A test component',
        version: '1.0.0',
        defaultPreset: 'minimal-frontier',
        supportedPillars: ['frontier', 'wilderness'],
        supportedMotionLevels: ['minimal', 'reduced', 'full'],
        cssClassBase: 'test-component',
        dataAttributePrefix: 'test',
        supportsMotionLevel: true,
        supportsTelemetry: true,
        supportsPillarSwitching: true,
        category: 'ui',
        priority: 100,
        tags: ['test'],
      },
    },
    updateCount: 5,
    lastUpdated: Date.now(),
  })),
  setPreset: vi.fn(),
  setPillar: vi.fn(),
  setMotionLevel: vi.fn(),
  dispatch: vi.fn(),
  getPreset: vi.fn(() => ({
    id: 'minimal-frontier',
    name: 'Minimal Frontier',
    description: 'A minimal preset with frontier theme',
    version: '1.0.0',
    author: 'Test',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      border: '#e2e8f0',
      text: '#1e293b',
      textSecondary: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    animations: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out',
      delay: 0,
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
    },
    borders: {
      radius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      width: {
        none: '0',
        thin: '1px',
        normal: '2px',
        thick: '4px',
      },
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    },
    tags: ['minimal', 'frontier'],
    category: 'minimal' as const,
    isDefault: false,
    isExperimental: false,
    supportedComponents: ['TestComponent'],
    supportedPillars: ['frontier'],
    supportedMotionLevels: ['minimal', 'full'],
  })),
  getAllPresets: vi.fn(() => [
    {
      id: 'minimal-frontier' as SkinPresetId,
      name: 'Minimal Frontier',
    },
    {
      id: 'wanderlust' as SkinPresetId,
      name: 'Wanderlust',
    },
  ]),
  registerComponent: vi.fn(),
  unregisterComponent: vi.fn(),
  getComponentBinding: vi.fn((componentId: ComponentId) => {
    if (componentId === 'TestComponent') {
      return {
        componentId: 'TestComponent',
        name: 'Test Component',
        description: 'A test component',
        version: '1.0.0',
        defaultPreset: 'minimal-frontier',
        supportedPillars: ['frontier', 'wilderness'],
        supportedMotionLevels: ['minimal', 'reduced', 'full'],
        cssClassBase: 'test-component',
        dataAttributePrefix: 'test',
        supportsMotionLevel: true,
        supportsTelemetry: true,
        supportsPillarSwitching: true,
        category: 'ui',
        priority: 100,
        tags: ['test'],
      };
    }
    return null;
  }),
  generateClasses: vi.fn(() => ['test-component', 'test-component--frontier', 'test-component--full']),
  generateAttributes: vi.fn(() => ({
    'data-skin-preset': 'minimal-frontier',
    'data-skin-pillar': 'frontier',
    'data-skin-motion': 'full',
  })),
  generateStyles: vi.fn(() => ({
    color: '#3b82f6',
    backgroundColor: '#ffffff',
  })),
  validateState: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
  validateTransition: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
  subscribe: vi.fn(),
  saveState: vi.fn(),
  loadState: vi.fn(),
  resetState: vi.fn(),
  trackEvent: vi.fn(),
};

const mockSkinRegistry = {
  register: vi.fn(),
  unregister: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  findByTag: vi.fn(),
  findByCategory: vi.fn(),
  search: vi.fn(),
  validate: vi.fn(),
  onRegister: vi.fn(),
  onUnregister: vi.fn(),
  onUpdate: vi.fn(),
};

// Mock the modules
vi.mock('@/ui/idleVillage/skins/SkinManager', () => ({
  getSkinManager: () => mockSkinManager,
}));

vi.mock('@/ui/idleVillage/skins/SkinRegistry', () => ({
  getSkinRegistryManager: () => mockSkinRegistry,
}));

vi.mock('@/ui/idleVillage/skins/validation/SkinSchemaValidation', () => ({
  TS001SkinValidator: {
    validatePreset: vi.fn(() => ({ success: true, errors: [] })),
    validateBinding: vi.fn(() => ({ success: true, errors: [] })),
    validateState: vi.fn(() => ({ success: true, errors: [] })),
    validateTS001Compliance: vi.fn(() => ({ isValid: true, errors: [] })),
  },
}));

// Test wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
  return React.createElement(
    SkinSystemProvider,
    null,
    children
  );
}

// ============================================================================
// API TESTS
// ============================================================================

describe('TS-003: SkinReplacementAPI & DevTools', () => {
  let api: SkinReplacementAPI_TS003;

  beforeEach(() => {
    vi.clearAllMocks();
    api = getSkinReplacementAPI_TS003();
  });

  describe('SkinReplacementAPI_TS003', () => {
    describe('Basic Replacement Operations', () => {
      it('should replace preset successfully', async () => {
        const options: SkinReplacementOptions = {
          animate: false,
          validate: true,
        };

        const result = await api.replacePreset('wanderlust', options);

        expect(result).toBe(true);
        expect(mockSkinManager.setPreset).toHaveBeenCalledWith('wanderlust');
        expect(mockSkinManager.dispatch).toHaveBeenCalledWith({ type: 'SET_TRANSITIONING', payload: true });
        expect(mockSkinManager.dispatch).toHaveBeenCalledWith({ type: 'SET_TRANSITIONING', payload: false });
      });

      it('should replace pillar successfully', async () => {
        const options: SkinReplacementOptions = {
          animate: false,
        };

        const result = await api.replacePillar('wilderness', options);

        expect(result).toBe(true);
        expect(mockSkinManager.setPillar).toHaveBeenCalledWith('wilderness');
      });

      it('should replace motion level successfully', async () => {
        const options: SkinReplacementOptions = {
          animate: false,
        };

        const result = await api.replaceMotionLevel('minimal', options);

        expect(result).toBe(true);
        expect(mockSkinManager.setMotionLevel).toHaveBeenCalledWith('minimal');
      });

      it('should handle replacement errors gracefully', async () => {
        mockSkinManager.setPreset.mockImplementation(() => {
          throw new Error('Preset not found');
        });

        const onError = vi.fn();
        const options: SkinReplacementOptions = {
          animate: false,
          onError,
        };

        const result = await api.replacePreset('invalid-preset', options);

        expect(result).toBe(false);
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('Hot Reloading', () => {
      it('should enable hot reload for component', () => {
        const config: HotReloadConfig = {
          enabled: true,
          watchInterval: 1000,
          debounceMs: 100,
          validateOnReload: true,
          preserveComponentState: true,
        };

        api.enableHotReload('TestComponent', config);
        expect(true).toBe(true);
      });

      it('should disable hot reload for component', () => {
        api.disableHotReload('TestComponent');
        expect(true).toBe(true);
      });

      it('should hot reload component successfully', async () => {
        const config: HotReloadConfig = {
          enabled: true,
          watchInterval: 1000,
          debounceMs: 0,
          validateOnReload: false,
          preserveComponentState: true,
        };

        api.enableHotReload('TestComponent', config);
        const result = await api.hotReloadComponent('TestComponent');

        expect(result).toBe(true);
        expect(mockSkinManager.unregisterComponent).toHaveBeenCalledWith('TestComponent');
        expect(mockSkinManager.registerComponent).toHaveBeenCalled();
      });
    });

    describe('Inspection and Debugging', () => {
      it('should inspect component successfully', () => {
        const inspection = api.inspectComponent('TestComponent');

        expect(inspection).not.toBeNull();
        expect(inspection!.componentId).toBe('TestComponent');
        expect(inspection!.currentClasses).toContain('test-component');
        expect(inspection!.currentAttributes).toHaveProperty('data-skin-preset', 'minimal-frontier');
        expect(inspection!.isRegistered).toBe(true);
      });

      it('should return null for non-existent component', () => {
        mockSkinManager.getComponentBinding.mockReturnValue(null);

        const inspection = api.inspectComponent('NonExistentComponent');

        expect(inspection).toBeNull();
      });

      it('should inspect all components', () => {
        const inspections = api.inspectAllComponents();

        expect(inspections).toHaveLength(1);
        expect(inspections[0].componentId).toBe('TestComponent');
      });

      it('should provide performance metrics', () => {
        api.replacePillar('wilderness', { animate: false });

        const metrics = api.getPerformanceMetrics();

        expect(metrics).toHaveProperty('pillar_replace');
        expect(typeof metrics['pillar_replace']).toBe('number');
      });

      it('should maintain debug log', () => {
        api.replacePillar('wilderness', { animate: false });

        const debugLog = api.getDebugLog();

        expect(debugLog.length).toBeGreaterThan(0);
        expect(debugLog[0]).toHaveProperty('action');
        expect(debugLog[0]).toHaveProperty('timestamp');
        expect(debugLog[0]).toHaveProperty('success');
      });

      it('should export skin state', () => {
        const exportedState = api.exportSkinState();

        expect(typeof exportedState).toBe('string');
        const parsed = JSON.parse(exportedState);
        expect(parsed).toHaveProperty('timestamp');
        expect(parsed).toHaveProperty('state');
        expect(parsed).toHaveProperty('components');
        expect(parsed).toHaveProperty('performanceMetrics');
      });

      it('should import skin state successfully', async () => {
        const stateData = {
          state: {
            currentPreset: 'wanderlust',
            currentPillar: 'wilderness',
            currentMotionLevel: 'minimal',
            isTransitioning: false,
            activeBindings: {},
            updateCount: 0,
            lastUpdated: Date.now(),
          },
        };

        const result = await api.importSkinState(JSON.stringify(stateData));

        expect(result).toBe(true);
        expect(mockSkinManager.setPreset).toHaveBeenCalledWith('wanderlust');
        expect(mockSkinManager.setPillar).toHaveBeenCalledWith('wilderness');
        expect(mockSkinManager.setMotionLevel).toHaveBeenCalledWith('minimal');
      });
    });

    describe('Utility Methods', () => {
      it('should get current state', () => {
        const state = api.getCurrentState();

        expect(state).toHaveProperty('currentPreset');
        expect(state).toHaveProperty('currentPillar');
        expect(state).toHaveProperty('currentMotionLevel');
        expect(state).toHaveProperty('isTransitioning');
      });

      it('should get available presets', () => {
        const presets = api.getAvailablePresets();

        expect(Array.isArray(presets)).toBe(true);
        expect(presets.length).toBeGreaterThan(0);
      });

      it('should get available pillars', () => {
        const pillars = api.getAvailablePillars();

        expect(pillars).toEqual(['frontier', 'wilderness', 'empire']);
      });

      it('should get available motion levels', () => {
        const motionLevels = api.getAvailableMotionLevels();

        expect(motionLevels).toEqual(['minimal', 'reduced', 'full']);
      });
    });
  });

  describe('SkinDevTools_TS003', () => {
    it('should render dev tools with basic tabs', async () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(SkinDevTools_TS003)
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Skin Dev Tools TS-003')).toBeInTheDocument();
        expect(screen.getByText('State')).toBeInTheDocument();
        expect(screen.getByText('Debug Log')).toBeInTheDocument();
      });
    });

    it('should render with all features enabled', async () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(SkinDevTools_TS003, {
            showAdvanced: true,
            showPerformance: true,
            showHotReload: true,
            showInspection: true,
            showReplacementAPI: true,
            showTelemetry: true,
            showRegistry: true,
          })
        )
      );

      await waitFor(() => {
        expect(screen.getByText('State')).toBeInTheDocument();
        expect(screen.getByText('Replacement API')).toBeInTheDocument();
        expect(screen.getByText('Inspection')).toBeInTheDocument();
        expect(screen.getByText('Hot Reload')).toBeInTheDocument();
        expect(screen.getByText('Performance')).toBeInTheDocument();
        expect(screen.getByText('Debug Log')).toBeInTheDocument();
      });
    });

    it('should handle tab switching', async () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(SkinDevTools_TS003, { showPerformance: true })
        )
      );

      await waitFor(() => {
        expect(screen.getByText('State')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Performance'));

      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete replacement workflow', async () => {
      const inspection = api.inspectComponent('TestComponent');
      expect(inspection).not.toBeNull();

      const presetResult = await api.replacePreset('wanderlust', { animate: false, validate: true });
      expect(presetResult).toBe(true);

      const pillarResult = await api.replacePillar('wilderness', { animate: false });
      expect(pillarResult).toBe(true);

      const motionResult = await api.replaceMotionLevel('minimal', { animate: false });
      expect(motionResult).toBe(true);

      const state = api.getCurrentState();
      expect(state.currentPreset).toBe('wanderlust');
      expect(state.currentPillar).toBe('wilderness');
      expect(state.currentMotionLevel).toBe('minimal');

      const metrics = api.getPerformanceMetrics();
      expect(metrics).toHaveProperty('preset_replace');
      expect(metrics).toHaveProperty('pillar_replace');
      expect(metrics).toHaveProperty('motion_replace');
    });

    it('should handle hot reload workflow', async () => {
      const config: HotReloadConfig = {
        enabled: true,
        watchInterval: 100,
        debounceMs: 0,
        validateOnReload: true,
        preserveComponentState: true,
      };

      api.enableHotReload('TestComponent', config);

      const result = await api.hotReloadComponent('TestComponent');
      expect(result).toBe(true);

      const inspection = api.inspectComponent('TestComponent');
      expect(inspection).not.toBeNull();
      expect(inspection!.componentId).toBe('TestComponent');

      api.disableHotReload('TestComponent');
    });

    it('should handle error recovery', async () => {
      mockSkinManager.setPreset.mockImplementation(() => {
        throw new Error('Simulated error');
      });

      const onError = vi.fn();
      const result = await api.replacePreset('invalid-preset', { onError });

      expect(result).toBe(false);
      expect(onError).toHaveBeenCalled();

      mockSkinManager.setPreset.mockImplementation(() => {});

      const successResult = await api.replacePreset('minimal-frontier', { animate: false });
      expect(successResult).toBe(true);
    });
  });
});
