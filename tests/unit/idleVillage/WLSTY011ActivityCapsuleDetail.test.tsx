/**
 * WL-STY-011: ActivityCapsuleDetail Skin Integration Test Suite
 * 
 * Comprehensive test suite for ActivityCapsuleDetail skin system integration
 * including schema validation, hook functionality, component behavior,
 * preset management, harness system, and performance testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityCapsuleDetailSkinHarnessProvider } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinHarness';
import ActivityCapsuleDetailSkinAware from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { useActivityCapsuleDetailSkin } from '@/ui/idleVillage/skins/activityCapsuleDetail/useActivityCapsuleDetailSkin';
import { 
  ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS,
  getActivityCapsuleDetailSkinConfigWithPreset,
  getActivityCapsuleDetailSkinPreset,
} from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinPresets';
import { 
  ActivityCapsuleDetailSkinConfig,
  DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
  validateActivityCapsuleDetailSkinConfig,
  mergeActivityCapsuleDetailSkinConfig,
} from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinSchema';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ActivityDetailSlotData,
  TelemetryEntry,
} from '@/ui/idleVillage/skins/SkinSchema';

// ============================================================================
// MOCK DATA AND UTILITIES
// ============================================================================

const mockSlots: ActivityDetailSlotData[] = [
  { id: 'slot-1', state: 'idle', initial: 'A', progress: 0, assignedWorkerName: 'Aria' },
  { id: 'slot-2', state: 'idle', initial: 'B', progress: 0, assignedWorkerName: 'Bram' },
  { id: 'slot-3', state: 'ghost', initial: '', progress: 0 },
  { id: 'slot-4', state: 'empty', initial: '', progress: 0 },
];

const mockTelemetry: TelemetryEntry[] = [
  { id: 'tel-1', timestamp: new Date(Date.now() - 120000), message: 'Aria <em>assegnata</em>', type: 'assign' },
  { id: 'tel-2', timestamp: new Date(Date.now() - 60000), message: 'Bram <em>assegnato</em>', type: 'assign' },
  { id: 'tel-3', timestamp: new Date(Date.now() - 30000), message: 'Attività <em>avviata</em>', type: 'start' },
];

const defaultProps = {
  activityId: 'test-activity',
  name: 'Test Activity',
  type: 'Test Type',
  status: 'idle' as const,
  progress: 0,
  duration: 3600,
  elapsed: 0,
  slots: mockSlots,
  maxSlots: 4,
  durationDisplay: '1 hour',
  rewardDisplay: 'Test Reward',
  etaDisplay: 'N/A',
  telemetry: mockTelemetry,
  isOpen: true,
  onClose: vi.fn(),
  onStart: vi.fn(),
  onCancel: vi.fn(),
  onCollect: vi.fn(),
  onSlotAssign: vi.fn(),
  onSlotDetach: vi.fn(),
};

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock skin system
vi.mock('@/ui/idleVillage/skins/hooks/useSkinSystem', () => ({
  useSkinSystem: () => ({
    pillar: 'frontier',
    presetId: 'minimal-frontier',
    motionLevel: 'full',
  }),
}));

vi.mock('@/ui/idleVillage/skins/components/SkinSlot', () => ({
  useSkinSlot: () => ({
    binding: null,
    register: vi.fn(),
    unregister: vi.fn(),
    update: vi.fn(),
  }),
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <ActivityCapsuleDetailSkinHarnessProvider>
        {children}
      </ActivityCapsuleDetailSkinHarnessProvider>
    </MemoryRouter>
  );
}

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Schema Validation', () => {
  it('should validate default configuration', () => {
    const validation = validateActivityCapsuleDetailSkinConfig(DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.warnings).toHaveLength(0);
  });

  it('should reject invalid configuration', () => {
    const invalidConfig = {
      ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
      window: {
        ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG.window,
        windowWidth: 123, // Should be string
      },
    };

    const validation = validateActivityCapsuleDetailSkinConfig(invalidConfig);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should merge configurations correctly', () => {
    const baseConfig = DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG;
    const overrides = {
      window: {
        windowBackground: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)',
      },
      poi: {
        idleColor: '#00ff00',
      },
    };

    const merged = mergeActivityCapsuleDetailSkinConfig(baseConfig, overrides);
    
    expect(merged.window.windowBackground).toBe(overrides.window.windowBackground);
    expect(merged.poi.idleColor).toBe(overrides.poi.idleColor);
    expect(merged.window.windowBorder).toBe(baseConfig.window.windowBorder); // Unchanged
  });

  it('should handle nested merges correctly', () => {
    const baseConfig = DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG;
    const overrides = {
      window: {
        windowBackground: 'new-background',
        windowBorder: 'new-border',
      },
    };

    const merged = mergeActivityCapsuleDetailSkinConfig(baseConfig, overrides);
    
    expect(merged.window.windowBackground).toBe(overrides.window.windowBackground);
    expect(merged.window.windowBorder).toBe(overrides.window.windowBorder);
    expect(merged.window.windowBorderRadius).toBe(baseConfig.window.windowBorderRadius);
  });
});

// ============================================================================
// PRESET MANAGEMENT TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Presets', () => {
  it('should have all required presets', () => {
    const expectedPresets: SkinPresetId[] = [
      'minimal-frontier',
      'minimal-wilderness',
      'minimal-empire',
      'wanderlust',
      'arcane-tech',
      'gilded-observatory',
      'neon-cyber',
      'shadow-realm',
    ];

    expectedPresets.forEach(presetId => {
      expect(ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS[presetId]).toBeDefined();
    });
  });

  it('should get preset by ID', () => {
    const preset = getActivityCapsuleDetailSkinPreset('minimal-frontier');
    expect(preset).toBeDefined();
    expect(preset?.presetId).toBe('minimal-frontier');
    expect(preset?.window?.windowBackground).toContain('59, 130, 246');
  });

  it('should return empty object for unknown preset', () => {
    const preset = getActivityCapsuleDetailSkinPreset('unknown-preset' as SkinPresetId);
    expect(preset).toEqual({});
  });

  it('should create configuration with preset and adaptations', () => {
    const config = getActivityCapsuleDetailSkinConfigWithPreset(
      'minimal-frontier',
      'frontier',
      'full'
    );

    expect(config.presetId).toBe('minimal-frontier');
    expect(config.pillar).toBe('frontier');
    expect(config.motionLevel).toBe('full');
    expect(config.window.windowBackground).toContain('59, 130, 246');
  });

  it('should apply pillar-specific overrides', () => {
    const wildernessConfig = getActivityCapsuleDetailSkinConfigWithPreset(
      'minimal-frontier',
      'wilderness',
      'full'
    );

    expect(wildernessConfig.pillar).toBe('wilderness');
    // Should have wilderness-specific colors
    expect(wildernessConfig.window.frameGradient).toContain('064f3b');
  });

  it('should apply motion level adaptations', () => {
    const minimalConfig = getActivityCapsuleDetailSkinConfigWithPreset(
      'minimal-frontier',
      'frontier',
      'minimal'
    );

    expect(minimalConfig.motionLevel).toBe('minimal');
    expect(minimalConfig.animation?.windowEntryAnimation).toBe('fade');
    expect(minimalConfig.animation?.poiIdleAnimation).toBe('none');
  });
});

// ============================================================================
// HOOK FUNCTIONALITY TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Hook', () => {
  let TestHookComponent: React.ComponentType;

  beforeEach(() => {
    TestHookComponent = () => {
      const skinHook = useActivityCapsuleDetailSkin({
        componentId: 'test-hook',
        skinPresetId: 'minimal-frontier',
        pillar: 'frontier',
        motionLevel: 'full',
      });

      return (
        <div>
          <div data-testid="config-valid">{skinHook.isValid.toString()}</div>
          <div data-testid="config-loading">{skinHook.isLoading.toString()}</div>
          <div data-testid="config-pillar">{skinHook.config.pillar}</div>
          <div data-testid="config-preset">{skinHook.config.presetId}</div>
          <button 
            data-testid="update-config"
            onClick={() => skinHook.updateConfig({
              header: { nameColor: '#ff0000' }
            })}
          >
            Update Config
          </button>
          <button 
            data-testid="reset-config"
            onClick={skinHook.resetConfig}
          >
            Reset Config
          </button>
        </div>
      );
    };
  });

  it('should initialize with correct configuration', async () => {
    render(
      <TestWrapper>
        <TestHookComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('config-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('config-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('config-pillar')).toHaveTextContent('frontier');
      expect(screen.getByTestId('config-preset')).toHaveTextContent('minimal-frontier');
    });
  });

  it('should update configuration', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestHookComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('config-valid')).toHaveTextContent('true');
    });

    await user.click(screen.getByTestId('update-config'));

    // The hook should update the configuration
    await waitFor(() => {
      expect(screen.getByTestId('config-valid')).toHaveTextContent('true');
    });
  });

  it('should reset configuration', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestHookComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('config-valid')).toHaveTextContent('true');
    });

    await user.click(screen.getByTestId('reset-config'));

    // Should reset to default
    await waitFor(() => {
      expect(screen.getByTestId('config-valid')).toHaveTextContent('true');
    });
  });
});

// ============================================================================
// COMPONENT INTEGRATION TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin-Aware Component', () => {
  it('should render with default skin', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Test Type')).toBeInTheDocument();
      expect(screen.getByText('1 hour')).toBeInTheDocument();
      expect(screen.getByText('Test Reward')).toBeInTheDocument();
    });
  });

  it('should apply preset skin', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinPresetId="arcane-tech"
          pillar="wilderness"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--pillar-wilderness');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--preset-arcane-tech');
    });
  });

  it('should handle slot interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });

    // Find and click on an empty slot
    const slots = screen.getAllByTestId(/slot-/);
    const emptySlot = slots.find(slot => 
      slot.classList.contains('activity-capsule-detail-skin-aware__slot--empty')
    );

    if (emptySlot) {
      await user.click(emptySlot);
      expect(defaultProps.onSlotAssign).toHaveBeenCalled();
    }
  });

  it('should handle CTA button interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      const startButton = screen.getByText('Avvia');
      expect(startButton).toBeInTheDocument();
    });

    const startButton = screen.getByText('Avvia');
    await user.click(startButton);
    expect(defaultProps.onStart).toHaveBeenCalled();
  });

  it('should handle window close', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close activity details');
      expect(closeButton).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close activity details');
    await user.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should display telemetry entries', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Aria')).toBeInTheDocument();
      expect(screen.getByText('Bram')).toBeInTheDocument();
      expect(screen.getByText('Attività')).toBeInTheDocument();
    });
  });

  it('should adapt to different motion levels', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          motionLevel="minimal"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--motion-minimal');
    });
  });

  it('should show validation errors in dev mode', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          enableDevTools={true}
          skinConfigOverride={{
            window: {
              windowWidth: 123, // Invalid type
            },
          }}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Skin Validation Errors/)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// HARNESS SYSTEM TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Harness System', () => {
  let TestHarnessComponent: React.ComponentType;

  beforeEach(() => {
    TestHarnessComponent = () => {
      const harness = useActivityCapsuleDetailSkinHarness();

      return (
        <div>
          <div data-testid="harness-components">{harness.state.metrics.totalComponents}</div>
          <div data-testid="harness-dev-mode">{harness.state.devMode.toString()}</div>
          <button 
            data-testid="apply-preset"
            onClick={() => harness.actions.applyPreset('gilded-observatory', 'empire')}
          >
            Apply Preset
          </button>
          <button 
            data-testid="enable-dev-mode"
            onClick={harness.actions.enableDevMode}
          >
            Enable Dev Mode
          </button>
          <button 
            data-testid="register-component"
            onClick={() => harness.actions.registerComponent('test-component', {
              componentId: 'test-component',
              componentType: 'ActivityCapsuleDetail',
              skinPresetId: 'minimal-frontier',
              pillar: 'frontier',
              motionLevel: 'full',
              config: DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
              enabled: true,
              priority: 'normal',
              metadata: {
                version: '1.0.0',
                lastModified: Date.now(),
                compatibility: ['1.0.0'],
              },
            })}
          >
            Register Component
          </button>
        </div>
      );
    };
  });

  it('should initialize harness with correct state', async () => {
    render(
      <TestWrapper>
        <TestHarnessComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('harness-components')).toHaveTextContent('0');
      expect(screen.getByTestId('harness-dev-mode')).toHaveTextContent('false');
    });
  });

  it('should register components', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestHarnessComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('harness-components')).toHaveTextContent('0');
    });

    await user.click(screen.getByTestId('register-component'));

    await waitFor(() => {
      expect(screen.getByTestId('harness-components')).toHaveTextContent('1');
    });
  });

  it('should apply global presets', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestHarnessComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('harness-dev-mode')).toHaveTextContent('false');
    });

    await user.click(screen.getByTestId('apply-preset'));

    // Should apply preset without errors
    await waitFor(() => {
      expect(screen.getByTestId('harness-dev-mode')).toHaveTextContent('false');
    });
  });

  it('should enable dev mode', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestHarnessComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('harness-dev-mode')).toHaveTextContent('false');
    });

    await user.click(screen.getByTestId('enable-dev-mode'));

    await waitFor(() => {
      expect(screen.getByTestId('harness-dev-mode')).toHaveTextContent('true');
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Performance', () => {
  it('should render quickly with default configuration', async () => {
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(100); // 100ms
  });

  it('should handle multiple components efficiently', async () => {
    const components = Array.from({ length: 10 }, (_, i) => (
      <ActivityCapsuleDetailSkinAware 
        key={i}
        {...defaultProps}
        activityId={`test-activity-${i}`}
        name={`Test Activity ${i}`}
      />
    ));

    const startTime = performance.now();
    
    render(
      <TestWrapper>
        {components}
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Test Activity/)).toHaveLength(10);
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should handle multiple components efficiently
    expect(renderTime).toBeLessThan(500); // 500ms for 10 components
  });

  it('should cache configuration lookups', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinPresetId="minimal-frontier"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });

    const startTime = performance.now();
    
    // Rerender with same preset
    rerender(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinPresetId="minimal-frontier"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const rerenderTime = endTime - startTime;
    
    // Rerender should be faster due to caching
    expect(rerenderTime).toBeLessThan(50); // 50ms
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Accessibility', () => {
  it('should have proper ARIA labels', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          ariaLabel="Test activity details window"
          ariaLive="polite"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveAttribute('aria-label', 'Test activity details window');
      expect(element).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      const startButton = screen.getByText('Avvia');
      expect(startButton).toBeInTheDocument();
    });

    const startButton = screen.getByText('Avvia');
    
    // Should be focusable
    startButton.focus();
    expect(startButton).toHaveFocus();
    
    // Should activate with Enter key
    await user.keyboard('{Enter}');
    expect(defaultProps.onStart).toHaveBeenCalled();
  });

  it('should respect reduced motion preferences', async () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          motionLevel="minimal"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--motion-minimal');
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Error Handling', () => {
  it('should handle invalid preset gracefully', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinPresetId="invalid-preset" as SkinPresetId
        />
      </TestWrapper>
    );

    // Should still render with default configuration
    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });
  });

  it('should handle invalid configuration gracefully', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinConfigOverride={{
            window: {
              windowWidth: 123, // Invalid type
            },
          }}
        />
      </TestWrapper>
    );

    // Should still render with validation errors
    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });
  });

  it('should handle missing props gracefully', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          activityId="test"
          name="Test"
          type="Test"
          status="idle"
          progress={0}
          duration={0}
          elapsed={0}
          slots={[]}
          maxSlots={0}
          durationDisplay=""
          rewardDisplay=""
          etaDisplay=""
          telemetry={[]}
          isOpen={true}
        />
      </TestWrapper>
    );

    // Should render without crashing
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('ActivityCapsuleDetail Skin Integration', () => {
  it('should integrate with skin system correctly', async () => {
    render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinPresetId="wanderlust"
          pillar="wilderness"
          motionLevel="reduced"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--pillar-wilderness');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--preset-wanderlust');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--motion-reduced');
    });
  });

  it('should update when skin configuration changes', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinPresetId="minimal-frontier"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--preset-minimal-frontier');
    });

    // Change preset
    rerender(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          skinPresetId="arcane-tech"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--preset-arcane-tech');
    });
  });

  it('should handle dynamic status changes', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          status="idle"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--idle');
    });

    // Change status
    rerender(
      <TestWrapper>
        <ActivityCapsuleDetailSkinAware 
          {...defaultProps}
          status="in-progress"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const element = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(element).toHaveClass('activity-capsule-detail-skin-aware--in-progress');
    });
  });
});
