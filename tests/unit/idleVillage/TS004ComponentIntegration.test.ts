/**
 * TS-004: Component Integration & Test Harness Test Suite
 * 
 * Comprehensive test suite for TS-004 compliance of component integration
 * patterns, migration utilities, and test harness functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { 
  ComponentIntegrationPatterns,
  createSkinBinding,
  validateIntegrationConfig,
  migrateComponent,
  batchMigrateComponents,
  CommonComponentConfigs,
  type ComponentIntegrationConfig,
  type MigrationResult,
  type BatchMigrationConfig
} from '@/ui/idleVillage/skins/integration/ComponentIntegrationPatterns';
import SkinTestHarness from '@/ui/idleVillage/skins/integration/SkinTestHarness';
import { 
  getSkinReplacementAPI_TS003,
  type SkinReplacementAPI_TS003 
} from '@/ui/idleVillage/skins/SkinReplacementAPI_TS003';

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

// Mock components for testing
const MockComponent: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => 
  React.createElement('div', { className }, children);

const MockComplexComponent: React.FC<{ 
  title: string; 
  data: Record<string, unknown>;
  onClick?: () => void;
}> = ({ title, data, onClick }) => 
  React.createElement('div', { onClick }, [
    React.createElement('h3', { key: 'title' }, title),
    React.createElement('pre', { key: 'data' }, JSON.stringify(data, null, 2)),
  ]);

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

vi.mock('@/ui/idleVillage/skins/SkinReplacementAPI_TS003', () => ({
  getSkinReplacementAPI_TS003: () => ({
    getCurrentState: mockSkinManager.getState,
    getPerformanceMetrics: vi.fn(() => ({})),
    getDebugLog: vi.fn(() => []),
    clearDebugLog: vi.fn(),
    exportSkinState: vi.fn(() => '{}'),
    importSkinState: vi.fn(() => Promise.resolve(true)),
    inspectComponent: vi.fn(() => null),
    inspectAllComponents: vi.fn(() => []),
    replacePreset: vi.fn(() => Promise.resolve(true)),
    replacePillar: vi.fn(() => Promise.resolve(true)),
    replaceMotionLevel: vi.fn(() => Promise.resolve(true)),
    replaceAll: vi.fn(() => Promise.resolve(true)),
    enableHotReload: vi.fn(),
    disableHotReload: vi.fn(),
    hotReloadComponent: vi.fn(() => Promise.resolve(true)),
    startHotReloadWatcher: vi.fn(),
    getAvailablePresets: vi.fn(() => ['minimal-frontier', 'wanderlust']),
    getAvailablePillars: vi.fn(() => ['frontier', 'wilderness', 'empire']),
    getAvailableMotionLevels: vi.fn(() => ['minimal', 'reduced', 'full']),
  }),
}));

// Test wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
  return React.createElement('div', { 'data-testid': 'test-wrapper' }, children);
}

// ============================================================================
// INTEGRATION PATTERNS TESTS
// ============================================================================

describe('TS-004: Component Integration & Test Harness', () => {
  describe('ComponentIntegrationPatterns', () => {
    describe('Integration Patterns', () => {
      it('should have all required integration patterns', () => {
        expect(ComponentIntegrationPatterns).toHaveLength(4);
        
        const patternNames = ComponentIntegrationPatterns.map(p => p.name);
        expect(patternNames).toContain('Basic Wrapper');
        expect(patternNames).toContain('Hook Integration');
        expect(patternNames).toContain('Higher-Order Component');
        expect(patternNames).toContain('Advanced Integration');
      });

      it('should have valid pattern metadata', () => {
        ComponentIntegrationPatterns.forEach(pattern => {
          expect(pattern.name).toBeDefined();
          expect(pattern.description).toBeDefined();
          expect(pattern.useCase).toBeDefined();
          expect(pattern.complexity).toMatch(/^(simple|medium|advanced)$/);
          expect(pattern.migrationEffort).toMatch(/^(low|medium|high)$/);
          expect(Array.isArray(pattern.examples)).toBe(true);
        });
      });
    });

    describe('createSkinBinding', () => {
      it('should create valid skin binding from config', () => {
        const config: ComponentIntegrationConfig = {
          componentId: 'TestComponent',
          name: 'Test Component',
          description: 'A test component',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier', 'wilderness'],
          supportedMotionLevels: ['minimal', 'reduced', 'full'],
          cssClassBase: 'test-component',
          dataAttributePrefix: 'test',
          category: 'ui',
          priority: 100,
          tags: ['test'],
        };

        const binding = createSkinBinding(config);

        expect(binding.componentId).toBe('TestComponent');
        expect(binding.name).toBe('Test Component');
        expect(binding.supportsMotionLevel).toBe(true);
        expect(binding.supportsTelemetry).toBe(true);
        expect(binding.supportsPillarSwitching).toBe(true);
      });

      it('should handle custom skin properties', () => {
        const config: ComponentIntegrationConfig = {
          componentId: 'TestComponent',
          name: 'Test Component',
          description: 'A test component',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal'],
          cssClassBase: 'test-component',
          dataAttributePrefix: 'test',
          category: 'ui',
          priority: 100,
          tags: ['test'],
          skinProperties: {
            customProp: 'customValue',
            anotherProp: 123,
          },
        };

        const binding = createSkinBinding(config);

        expect(binding.skinProperties).toEqual({
          customProp: 'customValue',
          anotherProp: 123,
        });
      });
    });

    describe('validateIntegrationConfig', () => {
      it('should validate valid configuration', () => {
        const config: ComponentIntegrationConfig = {
          componentId: 'ValidComponent',
          name: 'Valid Component',
          description: 'A valid component',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal'],
          cssClassBase: 'valid-component',
          dataAttributePrefix: 'valid',
          category: 'ui',
          priority: 100,
          tags: ['test'],
        };

        const validation = validateIntegrationConfig(config);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should detect missing required fields', () => {
        const config = {
          componentId: '',
          name: '',
          description: '',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: [],
          supportedMotionLevels: [],
          cssClassBase: '',
          dataAttributePrefix: '',
          category: 'ui',
          priority: 100,
          tags: [],
        } as ComponentIntegrationConfig;

        const validation = validateIntegrationConfig(config);

        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.errors).toContain('Component ID is required');
        expect(validation.errors).toContain('Component name is required');
        expect(validation.errors).toContain('CSS class base is required');
        expect(validation.errors).toContain('Data attribute prefix is required');
      });

      it('should detect invalid formats', () => {
        const config: ComponentIntegrationConfig = {
          componentId: 'Invalid Component ID',
          name: 'Valid Component',
          description: 'A component with invalid ID',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal'],
          cssClassBase: 'Invalid-Class',
          dataAttributePrefix: 'valid',
          category: 'ui',
          priority: 100,
          tags: ['test'],
        };

        const validation = validateIntegrationConfig(config);

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Component ID must be a valid identifier');
        expect(validation.errors).toContain('CSS class base must be lowercase with hyphens/underscores');
      });

      it('should generate warnings for optional issues', () => {
        const config: ComponentIntegrationConfig = {
          componentId: 'ValidComponent',
          name: 'Valid Component',
          description: 'A valid component',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: [],
          supportedMotionLevels: [],
          cssClassBase: 'valid-component',
          dataAttributePrefix: 'valid',
          category: 'ui',
          priority: 2000, // High priority
          tags: ['test'],
        };

        const validation = validateIntegrationConfig(config);

        expect(validation.warnings).toContain('No supported pillars specified');
        expect(validation.warnings).toContain('No supported motion levels specified');
        expect(validation.warnings).toContain('Priority should be between 0 and 1000');
      });
    });

    describe('migrateComponent', () => {
      it('should migrate component successfully', () => {
        const config: ComponentIntegrationConfig = {
          componentId: 'TestComponent',
          name: 'Test Component',
          description: 'A test component',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal'],
          cssClassBase: 'test-component',
          dataAttributePrefix: 'test',
          category: 'ui',
          priority: 100,
          tags: ['test'],
        };

        const result = migrateComponent(MockComponent, config, 'Basic Wrapper');

        expect(result.success).toBe(true);
        expect(result.componentId).toBe('TestComponent');
        expect(result.originalComponent).toBe(MockComponent);
        expect(result.wrappedComponent).not.toBe(MockComponent);
        expect(result.errors).toHaveLength(0);
        expect(result.migrationTime).toBeGreaterThan(0);
      });

      it('should handle invalid configuration', () => {
        const invalidConfig = {
          componentId: '',
          name: '',
          description: '',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: [],
          supportedMotionLevels: [],
          cssClassBase: '',
          dataAttributePrefix: '',
          category: 'ui',
          priority: 100,
          tags: [],
        } as ComponentIntegrationConfig;

        const result = migrateComponent(MockComponent, invalidConfig);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.wrappedComponent).toBe(MockComponent); // Return original on failure
      });

      it('should support different migration patterns', () => {
        const config: ComponentIntegrationConfig = {
          componentId: 'TestComponent',
          name: 'Test Component',
          description: 'A test component',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal'],
          cssClassBase: 'test-component',
          dataAttributePrefix: 'test',
          category: 'ui',
          priority: 100,
          tags: ['test'],
        };

        const patterns: Array<keyof typeof ComponentIntegrationPatterns> = [
          'Basic Wrapper',
          'Hook Integration',
          'Higher-Order Component',
          'Advanced Integration',
        ];

        patterns.forEach(pattern => {
          const result = migrateComponent(MockComponent, config, pattern);
          expect(result.success).toBe(true);
          expect(result.wrappedComponent).not.toBe(MockComponent);
        });
      });
    });

    describe('batchMigrateComponents', () => {
      it('should migrate multiple components', async () => {
        const configs: ComponentIntegrationConfig[] = [
          {
            componentId: 'Component1',
            name: 'Component 1',
            description: 'First component',
            version: '1.0.0',
            defaultPreset: 'minimal-frontier',
            supportedPillars: ['frontier'],
            supportedMotionLevels: ['minimal'],
            cssClassBase: 'component-1',
            dataAttributePrefix: 'comp1',
            category: 'ui',
            priority: 100,
            tags: ['test'],
          },
          {
            componentId: 'Component2',
            name: 'Component 2',
            description: 'Second component',
            version: '1.0.0',
            defaultPreset: 'minimal-frontier',
            supportedPillars: ['frontier'],
            supportedMotionLevels: ['minimal'],
            cssClassBase: 'component-2',
            dataAttributePrefix: 'comp2',
            category: 'ui',
            priority: 100,
            tags: ['test'],
          },
        ];

        const batchConfig: BatchMigrationConfig = {
          components: configs.map((config, index) => ({
            component: MockComponent,
            config,
            pattern: 'Basic Wrapper',
          })),
        };

        const results = await batchMigrateComponents(batchConfig);

        expect(results).toHaveLength(2);
        expect(results.every(r => r.success)).toBe(true);
        expect(results[0].componentId).toBe('Component1');
        expect(results[1].componentId).toBe('Component2');
      });

      it('should handle progress callbacks', async () => {
        const onProgress = vi.fn();
        const onComplete = vi.fn();

        const config: ComponentIntegrationConfig = {
          componentId: 'TestComponent',
          name: 'Test Component',
          description: 'A test component',
          version: '1.0.0',
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal'],
          cssClassBase: 'test-component',
          dataAttributePrefix: 'test',
          category: 'ui',
          priority: 100,
          tags: ['test'],
        };

        const batchConfig: BatchMigrationConfig = {
          components: [
            { component: MockComponent, config, pattern: 'Basic Wrapper' },
          ],
          onProgress,
          onComplete,
        };

        await batchMigrateComponents(batchConfig);

        expect(onProgress).toHaveBeenCalledWith(1, 1, 'TestComponent');
        expect(onComplete).toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        const onError = vi.fn();

        const batchConfig: BatchMigrationConfig = {
          components: [
            {
              component: MockComponent,
              config: {
                componentId: '',
                name: '',
                description: '',
                version: '1.0.0',
                defaultPreset: 'minimal-frontier',
                supportedPillars: [],
                supportedMotionLevels: [],
                cssClassBase: '',
                dataAttributePrefix: '',
                category: 'ui',
                priority: 100,
                tags: [],
              } as ComponentIntegrationConfig,
              pattern: 'Basic Wrapper',
            },
          ],
          onError,
        };

        const results = await batchMigrateComponents(batchConfig);

        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(false);
        expect(results[0].errors.length).toBeGreaterThan(0);
      });
    });

    describe('CommonComponentConfigs', () => {
      it('should have all required component configs', () => {
        expect(Object.keys(CommonComponentConfigs)).toContain('ActivitySlot');
        expect(Object.keys(CommonComponentConfigs)).toContain('ActiveHUD');
        expect(Object.keys(CommonComponentConfigs)).toContain('PgCard');
        expect(Object.keys(CommonComponentConfigs)).toContain('CrewScheduler');
      });

      it('should have valid component configs', () => {
        Object.values(CommonComponentConfigs).forEach(config => {
          const validation = validateIntegrationConfig(config);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        });
      });
    });
  });

  describe('SkinTestHarness', () => {
    it('should render test harness with basic tabs', async () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(SkinTestHarness)
        )
      );

      await waitFor(() => {
        expect(screen.getByText('TS-Series Skin System Test Harness')).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Component Testing')).toBeInTheDocument();
        expect(screen.getByText('Migration Tools')).toBeInTheDocument();
        expect(screen.getByText('Performance')).toBeInTheDocument();
      });
    });

    it('should render with advanced features enabled', async () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(SkinTestHarness, {
            showAdvanced: true,
            enableMonitoring: true,
            showMigrationTools: true,
            showComponentTesting: true,
            showPerformanceMetrics: true,
          })
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Component Testing')).toBeInTheDocument();
        expect(screen.getByText('Migration Tools')).toBeInTheDocument();
        expect(screen.getByText('Performance')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
      });
    });

    it('should handle tab switching', async () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(SkinTestHarness)
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Component Testing'));

      await waitFor(() => {
        expect(screen.getByText('Component Testing')).toBeInTheDocument();
        expect(screen.getByText('Select Test Suites:')).toBeInTheDocument();
      });
    });

    it('should show system overview information', async () => {
      render(
        React.createElement(TestWrapper, null,
          React.createElement(SkinTestHarness)
        )
      );

      await waitFor(() => {
        expect(screen.getByText('TS-001: Core Schema & Manager ✓')).toBeInTheDocument();
        expect(screen.getByText('TS-002: SkinSlot & Hook Integration ✓')).toBeInTheDocument();
        expect(screen.getByText('TS-003: SkinReplacementAPI & DevTools ✓')).toBeInTheDocument();
        expect(screen.getByText('TS-004: Component Integration & Test Harness ✓')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete integration workflow', async () => {
      // Create a valid config
      const config: ComponentIntegrationConfig = {
        componentId: 'IntegrationTestComponent',
        name: 'Integration Test Component',
        description: 'A component for integration testing',
        version: '1.0.0',
        defaultPreset: 'minimal-frontier',
        supportedPillars: ['frontier', 'wilderness'],
        supportedMotionLevels: ['minimal', 'reduced', 'full'],
        cssClassBase: 'integration-test',
        dataAttributePrefix: 'integration-test',
        category: 'test',
        priority: 100,
        tags: ['test', 'integration'],
      };

      // Validate config
      const validation = validateIntegrationConfig(config);
      expect(validation.isValid).toBe(true);

      // Create skin binding
      const binding = createSkinBinding(config);
      expect(binding.componentId).toBe('IntegrationTestComponent');

      // Migrate component
      const migrationResult = migrateComponent(MockComponent, config, 'Basic Wrapper');
      expect(migrationResult.success).toBe(true);

      // Test batch migration
      const batchConfig: BatchMigrationConfig = {
        components: [
          { component: MockComponent, config, pattern: 'Basic Wrapper' },
          { component: MockComplexComponent, config, pattern: 'Hook Integration' },
        ],
      };

      const batchResults = await batchMigrateComponents(batchConfig);
      expect(batchResults).toHaveLength(2);
      expect(batchResults.every(r => r.success)).toBe(true);
    });

    it('should handle error recovery workflow', async () => {
      // Create invalid config
      const invalidConfig = {
        componentId: '',
        name: '',
        description: '',
        version: '1.0.0',
        defaultPreset: 'minimal-frontier',
        supportedPillars: [],
        supportedMotionLevels: [],
        cssClassBase: '',
        dataAttributePrefix: '',
        category: 'ui',
        priority: 100,
        tags: [],
      } as ComponentIntegrationConfig;

      // Validate should fail
      const validation = validateIntegrationConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Migration should fail gracefully
      const migrationResult = migrateComponent(MockComponent, invalidConfig);
      expect(migrationResult.success).toBe(false);
      expect(migrationResult.errors.length).toBeGreaterThan(0);
      expect(migrationResult.wrappedComponent).toBe(MockComponent); // Return original on failure
    });

    it('should demonstrate all integration patterns', () => {
      const config: ComponentIntegrationConfig = {
        componentId: 'PatternTestComponent',
        name: 'Pattern Test Component',
        description: 'A component for testing all patterns',
        version: '1.0.0',
        defaultPreset: 'minimal-frontier',
        supportedPillars: ['frontier'],
        supportedMotionLevels: ['minimal'],
        cssClassBase: 'pattern-test',
        dataAttributePrefix: 'pattern-test',
        category: 'test',
        priority: 100,
        tags: ['test', 'pattern'],
      };

      // Test all patterns
      const patterns: Array<keyof typeof ComponentIntegrationPatterns> = [
        'Basic Wrapper',
        'Hook Integration', 
        'Higher-Order Component',
        'Advanced Integration',
      ];

      patterns.forEach(pattern => {
        const result = migrateComponent(MockComponent, config, pattern);
        expect(result.success).toBe(true);
        expect(result.componentId).toBe('PatternTestComponent');
        expect(result.wrappedComponent).not.toBe(MockComponent);
        expect(result.migrationTime).toBeGreaterThan(0);
      });
    });
  });
});
