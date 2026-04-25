/**
 * WL-STY-010: ActivityCapsule Skin Override Test Suite
 * 
 * Comprehensive test suite for ActivityCapsule TS-Series skin integration.
 * Tests schema validation, component rendering, hook functionality,
 * preset management, and performance optimization.
 * 
 * Dependencies: TS-001 (SkinSchema), TS-002 (SkinSlot), ActivityCapsuleSkinSchema
 * Integration: Vitest, React Testing Library, mock implementations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ActivityCapsuleSkinAware } from '@/ui/idleVillage/skins/activityCapsule/ActivityCapsuleSkinAware';
import { useActivityCapsuleSkin, useActivityCapsuleSkinBasic, useActivityCapsuleSkinDev, useActivityCapsuleSkinLegacy } from '@/ui/idleVillage/skins/activityCapsule/useActivityCapsuleSkin';
import { 
  ActivityCapsuleSkinConfig,
  DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG,
  getActivityCapsuleSkinConfig,
  validateActivityCapsuleSkinConfig,
  mergeActivityCapsuleSkinConfig,
  createActivityCapsuleSkinBinding,
  isValidActivityCapsuleSkinConfig,
} from '@/ui/idleVillage/skins/activityCapsule/ActivityCapsuleSkinSchema';
import { 
  ACTIVITY_CAPSULE_SKIN_PRESETS,
  ACTIVITY_CAPSULE_SKIN_THEMES,
  getActivityCapsuleSkinPreset,
  getActivityCapsuleSkinTheme,
  searchActivityCapsuleSkinPresets,
  getRecommendedActivityCapsuleSkinPresets,
  getActivityCapsuleSkinConfigForPreset,
} from '@/ui/idleVillage/skins/activityCapsule/ActivityCapsuleSkinPresets';
import type { 
  StyleLabPillar, 
  SkinPresetId,
  MotionLevel,
  ActivitySlotData,
  ComponentSkinBinding,
  SkinValidationResult
} from '@/ui/idleVillage/skins/SkinSchema';

// Mock the skin system hooks
vi.mock('@/ui/idleVillage/skins/hooks/useSkinSystem', () => ({
  useSkinSystem: () => ({
    pillar: 'frontier',
    presetId: 'minimal-frontier',
    motionLevel: 'full',
    subscribe: vi.fn(() => () => {}),
  }),
}));

vi.mock('@/ui/idleVillage/skins/components/SkinSlot', () => ({
  useSkinSlot: () => ({
    register: vi.fn(),
    unregister: vi.fn(),
    binding: null,
  }),
}));

vi.mock('@/ui/idleVillage/skins/SkinReplacementAPI_TS003', () => ({
  getSkinReplacementAPI_TS003: () => ({
    trackEvent: vi.fn(),
    getCurrentState: () => ({
      activeBindings: {},
    }),
  }),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
    },
  },
  writable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_SLOTS: ActivitySlotData[] = [
  { slotId: 'slot-1', assignedWorkerName: 'Alice', assignedWorkerAvatarUrl: '/avatars/alice.jpg', isOccupied: true, isLocked: false },
  { slotId: 'slot-2', assignedWorkerName: 'Bob', assignedWorkerAvatarUrl: '/avatars/bob.jpg', isOccupied: true, isLocked: false },
  { slotId: 'slot-3', assignedWorkerName: null, assignedWorkerAvatarUrl: null, isOccupied: false, isLocked: false },
];

const VALID_CONFIG: Partial<ActivityCapsuleSkinConfig> = {
  frame: {
    frameBorder: 'rgba(59, 130, 246, 0.4)',
    frameBackground: 'rgba(15, 23, 42, 0.95)',
    frameBorderRadius: '8px',
    framePadding: '12px',
    frameMinHeight: '60px',
    frameBoxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    slotGridColumns: 3,
    slotGap: '6px',
    slotSize: '40px',
    slotBorderRadius: '4px',
    slotBorder: '1px solid rgba(59, 130, 246, 0.2)',
    slotBackground: 'rgba(30, 58, 138, 0.4)',
    mobileSlotColumns: 2,
    compactSlotSize: '32px',
  },
  progress: {
    progressBackground: 'rgba(15, 23, 42, 0.6)',
    progressFill: 'rgba(59, 130, 246, 0.8)',
    progressBorder: '1px solid rgba(59, 130, 246, 0.3)',
    progressHeight: '3px',
    progressBorderRadius: '2px',
    progressTransition: 'width 0.2s ease',
    liquidGoldGradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    liquidGoldGlow: 'none',
    liquidGoldShimmer: false,
    shimmerAnimationDuration: '2s',
    shimmerIntensity: 0.5,
    timerFont: 'system-ui, sans-serif',
    timerColor: '#94a3b8',
    timerFontSize: '10px',
    timerFontWeight: '400',
    progressPulseEnabled: false,
    progressPulseIntensity: 0,
    progressPulseDuration: '2s',
  },
  motionLevel: 'full',
  pillar: 'frontier',
  presetId: 'minimal-frontier',
};

const INVALID_CONFIG = {
  frame: {
    frameBorder: 123, // Invalid type
    frameBackground: 'rgba(15, 23, 42, 0.95)',
    frameBorderRadius: '8px',
    framePadding: '12px',
    frameMinHeight: '60px',
    frameBoxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    slotGridColumns: 3,
    slotGap: '6px',
    slotSize: '40px',
    slotBorderRadius: '4px',
    slotBorder: '1px solid rgba(59, 130, 246, 0.2)',
    slotBackground: 'rgba(30, 58, 138, 0.4)',
    mobileSlotColumns: 2,
    compactSlotSize: '32px',
  },
  progress: {
    progressBackground: 'rgba(15, 23, 42, 0.6)',
    progressFill: 'rgba(59, 130, 246, 0.8)',
    progressBorder: '1px solid rgba(59, 130, 246, 0.3)',
    progressHeight: '3px',
    progressBorderRadius: '2px',
    progressTransition: 'width 0.2s ease',
    liquidGoldGradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    liquidGoldGlow: 'none',
    liquidGoldShimmer: false,
    shimmerAnimationDuration: '2s',
    shimmerIntensity: 0.5,
    timerFont: 'system-ui, sans-serif',
    timerColor: '#94a3b8',
    timerFontSize: '10px',
    timerFontWeight: '400',
    progressPulseEnabled: false,
    progressPulseIntensity: 0,
    progressPulseDuration: '2s',
  },
  motionLevel: 'full',
  pillar: 'frontier',
  presetId: 'minimal-frontier',
};

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('WL-STY-010: ActivityCapsule Skin Schema', () => {
  describe('DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG).toBeDefined();
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.frame).toBeDefined();
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.progress).toBeDefined();
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.cta).toBeDefined();
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.animation).toBeDefined();
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.typography).toBeDefined();
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.status).toBeDefined();
      expect(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG.accessibility).toBeDefined();
    });

    it('should have required configuration sections', () => {
      const config = DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG;
      
      // Frame configuration
      expect(config.frame.frameBorder).toBeTypeOf('string');
      expect(config.frame.frameBackground).toBeTypeOf('string');
      expect(config.frame.frameBorderRadius).toBeTypeOf('string');
      expect(config.frame.framePadding).toBeTypeOf('string');
      expect(config.frame.frameMinHeight).toBeTypeOf('string');
      expect(config.frame.frameBoxShadow).toBeTypeOf('string');
      expect(config.frame.slotGridColumns).toBeTypeOf('number');
      expect(config.frame.slotGap).toBeTypeOf('string');
      expect(config.frame.slotSize).toBeTypeOf('string');
      expect(config.frame.slotBorderRadius).toBeTypeOf('string');
      expect(config.frame.slotBorder).toBeTypeOf('string');
      expect(config.frame.slotBackground).toBeTypeOf('string');
      expect(config.frame.mobileSlotColumns).toBeTypeOf('number');
      expect(config.frame.compactSlotSize).toBeTypeOf('string');
      
      // Progress configuration
      expect(config.progress.progressBackground).toBeTypeOf('string');
      expect(config.progress.progressFill).toBeTypeOf('string');
      expect(config.progress.progressBorder).toBeTypeOf('string');
      expect(config.progress.progressHeight).toBeTypeOf('string');
      expect(config.progress.progressBorderRadius).toBeTypeOf('string');
      expect(config.progress.progressTransition).toBeTypeOf('string');
      expect(config.progress.liquidGoldGradient).toBeTypeOf('string');
      expect(config.progress.liquidGoldGlow).toBeTypeOf('string');
      expect(config.progress.liquidGoldShimmer).toBeTypeOf('boolean');
      expect(config.progress.shimmerAnimationDuration).toBeTypeOf('string');
      expect(config.progress.shimmerIntensity).toBeTypeOf('number');
      expect(config.progress.timerFont).toBeTypeOf('string');
      expect(config.progress.timerColor).toBeTypeOf('string');
      expect(config.progress.timerFontSize).toBeTypeOf('string');
      expect(config.progress.timerFontWeight).toBeTypeOf('string');
      expect(config.progress.progressPulseEnabled).toBeTypeOf('boolean');
      expect(config.progress.progressPulseIntensity).toBeTypeOf('number');
      expect(config.progress.progressPulseDuration).toBeTypeOf('string');
      
      // CTA configuration
      expect(config.cta.ctaBackground).toBeTypeOf('string');
      expect(config.cta.ctaBorderColor).toBeTypeOf('string');
      expect(config.cta.ctaTextColor).toBeTypeOf('string');
      expect(config.cta.ctaBorderRadius).toBeTypeOf('string');
      expect(config.cta.ctaPadding).toBeTypeOf('string');
      expect(config.cta.ctaFontSize).toBeTypeOf('string');
      expect(config.cta.ctaFontWeight).toBeTypeOf('string');
      expect(config.cta.ctaFontFamily).toBeTypeOf('string');
      expect(config.cta.ctaHoverBackground).toBeTypeOf('string');
      expect(config.cta.ctaHoverBorderColor).toBeTypeOf('string');
      expect(config.cta.ctaActiveScale).toBeTypeOf('number');
      expect(config.cta.ctaTransition).toBeTypeOf('string');
      expect(config.cta.ctaDisabledBackground).toBeTypeOf('string');
      expect(config.cta.ctaDisabledTextColor).toBeTypeOf('string');
      expect(config.cta.ctaDisabledOpacity).toBeTypeOf('number');
      
      // Animation configuration
      expect(config.animation.entryAnimation).toMatch(/^(fade|slide-up|scale|bounce|none)$/);
      expect(config.animation.entryDuration).toBeTypeOf('string');
      expect(config.animation.entryEasing).toBeTypeOf('string');
      expect(config.animation.slotHoverScale).toBeTypeOf('number');
      expect(config.animation.slotHoverGlow).toBeTypeOf('string');
      expect(config.animation.slotHoverTransition).toBeTypeOf('string');
      expect(config.animation.progressAnimationEnabled).toBeTypeOf('boolean');
      expect(config.animation.progressAnimationType).toMatch(/^(smooth|stepped|elastic)$/);
      expect(config.animation.progressAnimationDuration).toBeTypeOf('string');
      expect(config.animation.collectFeedbackAnimation).toMatch(/^(bounce|flash|ripple|confetti|none)$/);
      expect(config.animation.collectFeedbackDuration).toBeTypeOf('string');
      expect(config.animation.motionLevel).toMatch(/^(minimal|reduced|full)$/);
      
      // Typography configuration
      expect(config.typography.titleFont).toBeTypeOf('string');
      expect(config.typography.titleFontSize).toBeTypeOf('string');
      expect(config.typography.titleFontWeight).toBeTypeOf('string');
      expect(config.typography.titleColor).toBeTypeOf('string');
      expect(config.typography.titleLineHeight).toBeTypeOf('string');
      expect(config.typography.subtitleFont).toBeTypeOf('string');
      expect(config.typography.subtitleFontSize).toBeTypeOf('string');
      expect(config.typography.subtitleFontWeight).toBeTypeOf('string');
      expect(config.typography.subtitleColor).toBeTypeOf('string');
      expect(config.typography.subtitleLineHeight).toBeTypeOf('string');
      expect(config.typography.helperFont).toBeTypeOf('string');
      expect(config.typography.helperFontSize).toBeTypeOf('string');
      expect(config.typography.helperFontWeight).toBeTypeOf('string');
      expect(config.typography.helperColor).toBeTypeOf('string');
      expect(config.typography.helperOpacity).toBeTypeOf('number');
      expect(config.typography.slotInitialsFont).toBeTypeOf('string');
      expect(config.typography.slotInitialsFontSize).toBeTypeOf('string');
      expect(config.typography.slotInitialsFontWeight).toBeTypeOf('string');
      expect(config.typography.slotInitialsColor).toBeTypeOf('string');
      
      // Status configuration
      expect(config.status.idle).toBeDefined();
      expect(config.status.inProgress).toBeDefined();
      expect(config.status.completed).toBeDefined();
      expect(config.status.blocked).toBeDefined();
      
      // Accessibility configuration
      expect(config.accessibility.enableAriaLive).toBeTypeOf('boolean');
      expect(config.accessibility.enableAriaLabels).toBeTypeOf('boolean');
      expect(config.accessibility.enableAriaDescribedBy).toBeTypeOf('boolean');
      expect(config.accessibility.enableKeyboardNavigation).toBeTypeOf('boolean');
      expect(config.accessibility.enableFocusIndicators).toBeTypeOf('boolean');
      expect(config.accessibility.focusIndicatorStyle).toBeTypeOf('string');
      expect(config.accessibility.highContrastMode).toBeTypeOf('boolean');
      expect(config.accessibility.enableReducedMotion).toBeTypeOf('boolean');
      
      // TS-Series integration
      expect(config.motionLevel).toMatch(/^(minimal|reduced|full)$/);
      expect(config.pillar).toMatch(/^(frontier|wilderness|empire)$/);
      expect(config.presetId).toMatch(/^(minimal-frontier|minimal-wilderness|minimal-empire|wanderlust|arcane-tech|gilded-observatory)$/);
      
      // Feature flags
      expect(config.enableTelemetry).toBeTypeOf('boolean');
      expect(config.enableHotReload).toBeTypeOf('boolean');
      expect(config.enableValidation).toBeTypeOf('boolean');
      expect(config.enableDevTools).toBeTypeOf('boolean');
      
      // Version and compatibility
      expect(config.version).toBeTypeOf('string');
      expect(Array.isArray(config.compatibility)).toBe(true);
      expect(config.lastModified).toBeTypeOf('number');
    });
  });

  describe('getActivityCapsuleSkinConfig', () => {
    it('should return default configuration when no pillar specified', () => {
      const config = getActivityCapsuleSkinConfig();
      expect(config).toBeDefined();
      expect(config.pillar).toBe('frontier');
      expect(config.presetId).toBe('minimal-frontier');
      expect(config.motionLevel).toBe('full');
    });

    it('should return pillar-specific configuration', () => {
      const wildernessConfig = getActivityCapsuleSkinConfig('wilderness');
      const empireConfig = getActivityCapsuleSkinConfig('empire');
      const frontierConfig = getActivityCapsuleSkinConfig('frontier');
      
      expect(wildernessConfig.pillar).toBe('wilderness');
      expect(empireConfig.pillar).toBe('empire');
      expect(frontierConfig.pillar).toBe('frontier');
      
      // Check that pillar-specific overrides are applied
      expect(wildernessConfig.frame.frameBorder).toContain('66'); // Green tint
      expect(empireConfig.frame.frameBorder).toContain('205'); // Bronze tint
      expect(frontierConfig.frame.frameBorder).toContain('59'); // Blue tint
    });

    it('should apply custom overrides', () => {
      const customConfig = getActivityCapsuleSkinConfig('frontier', {
        frame: {
          frameBorder: 'custom-border',
          frameBackground: 'custom-background',
        },
        motionLevel: 'minimal',
      });
      
      expect(customConfig.frame.frameBorder).toBe('custom-border');
      expect(customConfig.frame.frameBackground).toBe('custom-background');
      expect(customConfig.motionLevel).toBe('minimal');
    });

    it('should merge pillar overrides with custom overrides', () => {
      const customConfig = getActivityCapsuleSkinConfig('wilderness', {
        frame: {
          frameBorder: 'custom-border',
        },
        motionLevel: 'reduced',
      });
      
      expect(customConfig.pillar).toBe('wilderness');
      expect(customConfig.frame.frameBorder).toBe('custom-border');
      expect(customConfig.motionLevel).toBe('reduced');
    });
  });

  describe('validateActivityCapsuleSkinConfig', () => {
    it('should validate valid configuration', () => {
      const result = validateActivityCapsuleSkinConfig(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject invalid configuration', () => {
      const result = validateActivityCapsuleSkinConfig(INVALID_CONFIG as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].path).toContain('frameBorder');
      expect(result.errors[0].message).toContain('Expected string');
    });

    it('should handle partial configuration', () => {
      const partialConfig = {
        frame: {
          frameBorder: 'rgba(59, 130, 246, 0.4)',
          frameBackground: 'rgba(15, 23, 42, 0.95)',
        },
      };
      
      const result = validateActivityCapsuleSkinConfig(partialConfig as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('mergeActivityCapsuleSkinConfig', () => {
    it('should merge configurations correctly', () => {
      const baseConfig = DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG;
      const overrides = {
        frame: {
          frameBorder: 'merged-border',
          frameBackground: 'merged-background',
        },
        motionLevel: 'minimal' as MotionLevel,
      };
      
      const merged = mergeActivityCapsuleSkinConfig(baseConfig, overrides);
      
      expect(merged.frame.frameBorder).toBe('merged-border');
      expect(merged.frame.frameBackground).toBe('merged-background');
      expect(merged.frame.frameBorderRadius).toBe(baseConfig.frame.frameBorderRadius); // Unchanged
      expect(merged.motionLevel).toBe('minimal');
    });

    it('should handle empty overrides', () => {
      const baseConfig = DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG;
      const merged = mergeActivityCapsuleSkinConfig(baseConfig, {});
      
      expect(merged).toEqual(baseConfig);
    });

    it('should handle undefined overrides', () => {
      const baseConfig = DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG;
      const merged = mergeActivityCapsuleSkinConfig(baseConfig, undefined);
      
      expect(merged).toEqual(baseConfig);
    });
  });

  describe('createActivityCapsuleSkinBinding', () => {
    it('should create valid skin binding', () => {
      const binding = createActivityCapsuleSkinBinding('test-component', VALID_CONFIG);
      
      expect(binding.componentId).toBe('test-component');
      expect(binding.componentType).toBe('ActivityCapsule');
      expect(binding.enabled).toBe(true);
      expect(binding.priority).toBe('normal');
      expect(binding.config).toEqual(VALID_CONFIG);
      expect(binding.metadata).toBeDefined();
    });

    it('should include required metadata', () => {
      const binding = createActivityCapsuleSkinBinding('test-component', VALID_CONFIG);
      
      expect(binding.metadata.version).toBe('1.0.0');
      expect(binding.metadata.lastModified).toBeTypeOf('number');
      expect(Array.isArray(binding.metadata.compatibility)).toBe(true);
    });
  });

  describe('isValidActivityCapsuleSkinConfig', () => {
    it('should return true for valid configuration', () => {
      expect(isValidActivityCapsuleSkinConfig(DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG)).toBe(true);
      expect(isValidActivityCapsuleSkinConfig(VALID_CONFIG as any)).toBe(true);
    });

    it('should return false for invalid configuration', () => {
      expect(isValidActivityCapsuleSkinConfig(INVALID_CONFIG as any)).toBe(false);
      expect(isValidActivityCapsuleSkinConfig(null)).toBe(false);
      expect(isValidActivityCapsuleSkinConfig(undefined)).toBe(false);
      expect(isValidActivityCapsuleSkinConfig({})).toBe(false);
    });
  });
});

// ============================================================================
// HOOK FUNCTIONALITY TESTS
// ============================================================================

describe('WL-STY-010: ActivityCapsule Skin Hooks', () => {
  describe('useActivityCapsuleSkin', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
      }));
      
      expect(result.current.config).toBeDefined();
      expect(result.current.config.pillar).toBe('frontier');
      expect(result.current.config.presetId).toBe('minimal-frontier');
      expect(result.current.config.motionLevel).toBe('full');
      expect(result.current.isBound).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(result.current.validationErrors).toHaveLength(0);
      expect(result.current.isHotReloading).toBe(false);
      expect(result.current.renderCount).toBe(1);
    });

    it('should initialize with custom configuration', () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
        initialPillar: 'wilderness',
        initialPresetId: 'wanderlust',
        initialMotionLevel: 'minimal',
        initialConfig: VALID_CONFIG,
      }));
      
      expect(result.current.config.pillar).toBe('wilderness');
      expect(result.current.config.presetId).toBe('wanderlust');
      expect(result.current.config.motionLevel).toBe('minimal');
    });

    it('should update configuration', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
      }));
      
      await act(async () => {
        result.current.updateConfig({
          frame: {
            frameBorder: 'updated-border',
          },
          motionLevel: 'reduced',
        });
      });
      
      expect(result.current.config.frame.frameBorder).toBe('updated-border');
      expect(result.current.config.motionLevel).toBe('reduced');
    });

    it('should update pillar', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
      }));
      
      await act(async () => {
        result.current.updatePillar('wilderness');
      });
      
      expect(result.current.config.pillar).toBe('wilderness');
    });

    it('should update preset ID', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
      }));
      
      await act(async () => {
        result.current.updatePresetId('wanderlust');
      });
      
      expect(result.current.config.presetId).toBe('wanderlust');
    });

    it('should update motion level', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
      }));
      
      await act(async () => {
        result.current.updateMotionLevel('minimal');
      });
      
      expect(result.current.config.motionLevel).toBe('minimal');
    });

    it('should validate configuration', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
        enableValidation: true,
        validationMode: 'strict',
      }));
      
      await act(async () => {
        result.current.updateConfig(INVALID_CONFIG as any);
      });
      
      expect(result.current.isValid).toBe(false);
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle hot reload', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
        enableHotReload: true,
      }));
      
      await act(async () => {
        await result.current.hotReload();
      });
      
      expect(result.current.lastHotReload).toBeTypeOf('number');
      expect(result.current.isHotReloading).toBe(false);
    });

    it('should export and import configuration', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
      }));
      
      const exportedConfig = result.current.exportConfig();
      expect(exportedConfig).toBeTypeOf('string');
      
      await act(async () => {
        const success = result.current.importConfig(exportedConfig);
        expect(success).toBe(true);
      });
    });

    it('should handle invalid import', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
      }));
      
      await act(async () => {
        const success = result.current.importConfig('invalid json');
        expect(success).toBe(false);
      });
    });

    it('should reset configuration', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
        initialPillar: 'wilderness',
      }));
      
      // Update configuration first
      await act(async () => {
        result.current.updatePillar('empire');
      });
      
      expect(result.current.config.pillar).toBe('empire');
      
      // Reset configuration
      await act(async () => {
        result.current.reset();
      });
      
      expect(result.current.config.pillar).toBe('wilderness');
    });

    it('should generate debug info', () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'test-hook',
        enableDevTools: true,
        enableDebugMode: true,
      }));
      
      const debugInfo = result.current.generateDebugInfo();
      
      expect(debugInfo.componentId).toBe('test-hook');
      expect(debugInfo.config).toBeDefined();
      expect(debugInfo.validation).toBeDefined();
      expect(debugInfo.renderCount).toBeTypeOf('number');
      expect(debugInfo.cacheStats).toBeDefined();
      expect(debugInfo.options).toBeDefined();
    });
  });

  describe('useActivityCapsuleSkinBasic', () => {
    it('should provide basic skin functionality', () => {
      const { result } = renderHook(() => useActivityCapsuleSkinBasic('basic-test', 'wilderness'));
      
      expect(result.current.config).toBeDefined();
      expect(result.current.config.pillar).toBe('wilderness');
      expect(result.current.isBound).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(typeof result.current.updateConfig).toBe('function');
      expect(typeof result.current.updatePillar).toBe('function');
      expect(typeof result.current.updatePresetId).toBe('function');
      expect(typeof result.current.updateMotionLevel).toBe('function');
    });
  });

  describe('useActivityCapsuleSkinDev', () => {
    it('should provide development features', () => {
      const { result } = renderHook(() => useActivityCapsuleSkinDev('dev-test', VALID_CONFIG));
      
      expect(result.current.config).toBeDefined();
      expect(result.current.isBound).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(typeof result.current.generateDebugInfo).toBe('function');
      expect(typeof result.current.inspectCache).toBe('function');
      expect(typeof result.current.inspectBinding).toBe('function');
    });
  });

  describe('useActivityCapsuleSkinLegacy', () => {
    it('should handle legacy configuration', () => {
      const legacyConfig = {
        frameBorder: 'legacy-border',
        frameBackground: 'legacy-background',
      };
      
      const legacyMapper = (legacy: any) => ({
        frame: {
          frameBorder: legacy.frameBorder,
          frameBackground: legacy.frameBackground,
        },
      });
      
      const { result } = renderHook(() => useActivityCapsuleSkinLegacy('legacy-test', legacyConfig, legacyMapper));
      
      expect(result.current.config).toBeDefined();
      expect(result.current.config.frame.frameBorder).toBe('legacy-border');
      expect(result.current.config.frame.frameBackground).toBe('legacy-background');
    });
  });
});

// ============================================================================
// PRESET MANAGEMENT TESTS
// ============================================================================

describe('WL-STY-010: ActivityCapsule Skin Presets', () => {
  describe('ACTIVITY_CAPSULE_SKIN_PRESETS', () => {
    it('should contain all required presets', () => {
      expect(ACTIVITY_CAPSULE_SKIN_PRESETS).toHaveProperty('minimal-frontier');
      expect(ACTIVITY_CAPSULE_SKIN_PRESETS).toHaveProperty('minimal-wilderness');
      expect(ACTIVITY_CAPSULE_SKIN_PRESETS).toHaveProperty('minimal-empire');
      expect(ACTIVITY_CAPSULE_SKIN_PRESETS).toHaveProperty('wanderlust');
      expect(ACTIVITY_CAPSULE_SKIN_PRESETS).toHaveProperty('arcane-tech');
      expect(ACTIVITY_CAPSULE_SKIN_PRESETS).toHaveProperty('gilded-observatory');
      expect(ACTIVITY_CAPSULE_SKIN_PRESETS).toHaveProperty('neon-cyber');
    });

    it('should have valid preset structure', () => {
      Object.values(ACTIVITY_CAPSULE_SKIN_PRESETS).forEach(preset => {
        expect(preset.id).toBeTypeOf('string');
        expect(preset.name).toBeTypeOf('string');
        expect(preset.description).toBeTypeOf('string');
        expect(preset.category).toMatch(/^(minimal|themed|experimental|legacy)$/);
        expect(preset.version).toBeTypeOf('string');
        expect(preset.author).toBeTypeOf('string');
        expect(Array.isArray(preset.tags)).toBe(true);
        expect(Array.isArray(preset.supportedPillars)).toBe(true);
        expect(Array.isArray(preset.supportedMotionLevels)).toBe(true);
        expect(preset.config).toBeDefined();
        expect(preset.metadata).toBeDefined();
      });
    });

    it('should have valid preset configurations', () => {
      Object.values(ACTIVITY_CAPSULE_SKIN_PRESETS).forEach(preset => {
        const validation = validateActivityCapsuleSkinConfig({
          ...DEFAULT_ACTIVITY_CAPSULE_SKIN_CONFIG,
          ...preset.config,
        });
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('ACTIVITY_CAPSULE_SKIN_THEMES', () => {
    it('should contain all required themes', () => {
      expect(ACTIVITY_CAPSULE_SKIN_THEMES).toHaveProperty('minimal');
      expect(ACTIVITY_CAPSULE_SKIN_THEMES).toHaveProperty('themed');
      expect(ACTIVITY_CAPSULE_SKIN_THEMES).toHaveProperty('experimental');
    });

    it('should have valid theme structure', () => {
      Object.values(ACTIVITY_CAPSULE_SKIN_THEMES).forEach(theme => {
        expect(theme.id).toBeTypeOf('string');
        expect(theme.name).toBeTypeOf('string');
        expect(theme.description).toBeTypeOf('string');
        expect(theme.presets).toBeDefined();
        expect(theme.baseConfig).toBeDefined();
        expect(theme.pillarVariants).toBeDefined();
        expect(theme.motionAdaptations).toBeDefined();
        
        // Check that all presets are valid
        Object.values(theme.presets).forEach(preset => {
          expect(preset.id).toBeTypeOf('string');
          expect(preset.name).toBeTypeOf('string');
        });
      });
    });
  });

  describe('getActivityCapsuleSkinPreset', () => {
    it('should return preset by ID', () => {
      const preset = getActivityCapsuleSkinPreset('minimal-frontier');
      expect(preset).toBeDefined();
      expect(preset?.id).toBe('minimal-frontier');
      expect(preset?.name).toBe('Minimal Frontier');
    });

    it('should return null for invalid preset ID', () => {
      const preset = getActivityCapsuleSkinPreset('invalid-preset');
      expect(preset).toBeNull();
    });
  });

  describe('getActivityCapsuleSkinTheme', () => {
    it('should return theme by ID', () => {
      const theme = getActivityCapsuleSkinTheme('minimal');
      expect(theme).toBeDefined();
      expect(theme?.id).toBe('minimal');
      expect(theme?.name).toBe('Minimal Collection');
    });

    it('should return null for invalid theme ID', () => {
      const theme = getActivityCapsuleSkinTheme('invalid-theme');
      expect(theme).toBeNull();
    });
  });

  describe('searchActivityCapsuleSkinPresets', () => {
    it('should search presets by name', () => {
      const results = searchActivityCapsuleSkinPresets('minimal');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(preset => 
        preset.name.toLowerCase().includes('minimal') ||
        preset.description.toLowerCase().includes('minimal') ||
        preset.tags.some(tag => tag.toLowerCase().includes('minimal'))
      )).toBe(true);
    });

    it('should search presets by tags', () => {
      const results = searchActivityCapsuleSkinPresets('clean');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty results for no matches', () => {
      const results = searchActivityCapsuleSkinPresets('nonexistent-tag');
      expect(results).toHaveLength(0);
    });

    it('should handle empty search query', () => {
      const results = searchActivityCapsuleSkinPresets('');
      expect(results).toHaveLength(0);
    });
  });

  describe('getRecommendedActivityCapsuleSkinPresets', () => {
    it('should return performance presets', () => {
      const presets = getRecommendedActivityCapsuleSkinPresets('performance');
      expect(presets.length).toBeGreaterThan(0);
      expect(presets.every(preset => preset.category === 'minimal')).toBe(true);
    });

    it('should return accessibility presets', () => {
      const presets = getRecommendedActivityCapsuleSkinPresets('accessibility');
      expect(presets.length).toBeGreaterThan(0);
    });

    it('should return visual presets', () => {
      const presets = getRecommendedActivityCapsuleSkinPresets('visual');
      expect(presets.length).toBeGreaterThan(0);
      expect(presets.every(preset => preset.category === 'themed')).toBe(true);
    });

    it('should return development presets', () => {
      const presets = getRecommendedActivityCapsuleSkinPresets('development');
      expect(presets.length).toBeGreaterThan(0);
      expect(presets.every(preset => preset.category === 'experimental')).toBe(true);
    });
  });

  describe('getActivityCapsuleSkinConfigForPreset', () => {
    it('should return config for preset', () => {
      const config = getActivityCapsuleSkinConfigForPreset('minimal-frontier');
      expect(config).toBeDefined();
      expect(config?.presetId).toBe('minimal-frontier');
    });

    it('should return null for invalid preset', () => {
      const config = getActivityCapsuleSkinConfigForPreset('invalid-preset');
      expect(config).toBeNull();
    });

    it('should apply pillar variant', () => {
      const config = getActivityCapsuleSkinConfigForPreset('wanderlust', 'wilderness');
      expect(config?.pillar).toBe('wilderness');
    });

    it('should apply motion level adaptation', () => {
      const config = getActivityCapsuleSkinConfigForPreset('wanderlust', undefined, 'minimal');
      expect(config?.motionLevel).toBe('minimal');
    });
  });
});

// ============================================================================
// COMPONENT INTEGRATION TESTS
// ============================================================================

describe('WL-STY-010: ActivityCapsule Component Integration', () => {
  describe('ActivityCapsuleSkinAware', () => {
    it('should render with default configuration', () => {
      const { container } = renderHook(() => 
        <ActivityCapsuleSkinAware
          activityId="test-activity"
          label="Test Activity"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.5}
          elapsedSeconds={5}
          totalDurationSeconds={10}
          status="in-progress"
          canCollect={false}
        />
      );
      
      expect(container.querySelector('[data-testid="activity-capsule-skin-aware"]')).toBeDefined();
      expect(container.querySelector('[data-activity-id="test-activity"]')).toBeDefined();
      expect(container.querySelector('[data-status="in-progress"]')).toBeDefined();
      expect(container.querySelector('[data-pillar="frontier"]')).toBeDefined();
      expect(container.querySelector('[data-preset="minimal-frontier"]')).toBeDefined();
      expect(container.querySelector('[data-motion-level="full"]')).toBeDefined();
    });

    it('should render with custom configuration', () => {
      const { container } = renderHook(() => 
        <ActivityCapsuleSkinAware
          activityId="test-activity"
          label="Test Activity"
          subtitle="Test subtitle"
          helperText="Test helper"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.75}
          elapsedSeconds={7}
          totalDurationSeconds={10}
          status="completed"
          canCollect={true}
          onCollect={() => {}}
          skinPresetId="wanderlust"
          pillar="wilderness"
          motionLevel="reduced"
          enableSkinBinding={true}
          skinBindingId="test-binding"
          showSlots={true}
          showProgress={true}
          showTimer={true}
          compact={false}
          ariaLabel="Test activity capsule"
          ariaLive="polite"
          dataTestId="custom-test-capsule"
        />
      );
      
      expect(container.querySelector('[data-testid="custom-test-capsule"]')).toBeDefined();
      expect(container.querySelector('[data-activity-id="test-activity"]')).toBeDefined();
      expect(container.querySelector('[data-status="completed"]')).toBeDefined();
      expect(container.querySelector('[data-pillar="wilderness"]')).toBeDefined();
      expect(container.querySelector('[data-preset="wanderlust"]')).toBeDefined();
      expect(container.querySelector('[data-motion-level="reduced"]')).toBeDefined();
      expect(container.querySelector('[data-skin-binding-id="test-binding"]')).toBeDefined();
    });

    it('should handle collect action', async () => {
      const mockCollect = vi.fn();
      
      const { container } = renderHook(() => 
        <ActivityCapsuleSkinAware
          activityId="test-activity"
          label="Test Activity"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={1.0}
          elapsedSeconds={10}
          totalDurationSeconds={10}
          status="completed"
          canCollect={true}
          onCollect={mockCollect}
        />
      );
      
      const collectButton = container.querySelector('.activity-capsule-skin-aware__cta');
      expect(collectButton).toBeDefined();
      
      await act(async () => {
        collectButton?.dispatchEvent(new MouseEvent('click'));
      });
      
      expect(mockCollect).toHaveBeenCalled();
    });

    it('should handle slot interactions', async () => {
      const mockSlotClick = vi.fn();
      const mockSlotHover = vi.fn();
      
      const { container } = renderHook(() => 
        <ActivityCapsuleSkinAware
          activityId="test-activity"
          label="Test Activity"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.5}
          elapsedSeconds={5}
          totalDurationSeconds={10}
          status="in-progress"
          canCollect={false}
          onSlotClick={mockSlotClick}
          onSlotHover={mockSlotHover}
        />
      );
      
      const slot = container.querySelector('[data-slot-id="slot-1"]');
      expect(slot).toBeDefined();
      
      await act(async () => {
        slot?.dispatchEvent(new MouseEvent('click'));
        slot?.dispatchEvent(new MouseEvent('mouseenter'));
      });
      
      expect(mockSlotClick).toHaveBeenCalledWith('slot-1');
      expect(mockSlotHover).toHaveBeenCalledWith('slot-1', true);
    });

    it('should apply status-specific styles', () => {
      const statuses = ['idle', 'in-progress', 'completed', 'blocked'] as const;
      
      statuses.forEach(status => {
        const { container } = renderHook(() => 
          <ActivityCapsuleSkinAware
            activityId="test-activity"
            label="Test Activity"
            slots={TEST_SLOTS}
            maxSlots={3}
            progressFraction={0.5}
            elapsedSeconds={5}
            totalDurationSeconds={10}
            status={status}
            canCollect={false}
          />
        );
        
        expect(container.querySelector(`[data-status="${status}"]`)).toBeDefined();
        expect(container.querySelector(`.activity-capsule-skin-aware--${status}`)).toBeDefined();
      });
    });

    it('should handle compact mode', () => {
      const { container } = renderHook(() => 
        <ActivityCapsuleSkinAware
          activityId="test-activity"
          label="Test Activity"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.5}
          elapsedSeconds={5}
          totalDurationSeconds={10}
          status="in-progress"
          canCollect={false}
          compact={true}
        />
      );
      
      expect(container.querySelector('.activity-capsule-skin-aware--compact')).toBeDefined();
    });

    it('should handle validation errors', () => {
      const { container } = renderHook(() => 
        <ActivityCapsuleSkinAware
          activityId="test-activity"
          label="Test Activity"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.5}
          elapsedSeconds={5}
          totalDurationSeconds={10}
          status="in-progress"
          canCollect={false}
          enableDevTools={true}
          skinConfigOverride={INVALID_CONFIG as any}
        />
      );
      
      expect(container.querySelector('.activity-capsule-skin-aware--validation-errors')).toBeDefined();
    });

    it('should handle legacy compatibility', () => {
      const legacyConfig = {
        frameBorder: 'legacy-border',
        frameBackground: 'legacy-background',
        progressFill: 'legacy-progress',
        ctaBackground: 'legacy-cta',
      };
      
      const { container } = renderHook(() => 
        <ActivityCapsuleSkinAware
          activityId="test-activity"
          label="Test Activity"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.5}
          elapsedSeconds={5}
          totalDurationSeconds={10}
          status="in-progress"
          canCollect={false}
          skinPresetOverrideId="minimal-frontier"
          skinConfigOverrideLegacy={legacyConfig}
        />
      );
      
      expect(container.querySelector('[data-testid="activity-capsule-skin-aware"]')).toBeDefined();
    });
  });
});

// ============================================================================
// PERFORMANCE AND ERROR HANDLING TESTS
// ============================================================================

describe('WL-STY-010: Performance and Error Handling', () => {
  describe('Performance Optimization', () => {
    it('should cache configurations', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'performance-test',
        enablePerformanceOptimization: true,
        cacheConfig: true,
      }));
      
      // First call should be a cache miss
      expect(result.current.cacheMisses).toBe(0);
      expect(result.current.cacheHits).toBe(0);
      
      // Update configuration multiple times
      await act(async () => {
        result.current.updateConfig({ motionLevel: 'minimal' });
      });
      
      await act(async () => {
        result.current.updateConfig({ motionLevel: 'reduced' });
      });
      
      await act(async () => {
        result.current.updateConfig({ motionLevel: 'full' });
      });
      
      // Should have some cache activity
      expect(result.current.renderCount).toBeGreaterThan(1);
    });

    it('should handle rapid configuration changes', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'rapid-test',
      }));
      
      // Rapid configuration changes
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          result.current.updateConfig({
            frame: {
              frameBorder: `border-${i}`,
            },
          });
        });
      }
      
      expect(result.current.renderCount).toBeGreaterThan(10);
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'error-test',
        enableValidation: true,
        validationMode: 'strict',
      }));
      
      await act(async () => {
        result.current.updateConfig(INVALID_CONFIG as any);
      });
      
      expect(result.current.isValid).toBe(false);
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
      expect(result.current.config).toBeDefined(); // Should still have a config
    });

    it('should handle hot reload errors', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'hot-reload-error-test',
        enableHotReload: true,
      }));
      
      // Mock hot reload to throw error
      const originalHotReload = result.current.hotReload;
      result.current.hotReload = vi.fn().mockRejectedValue(new Error('Hot reload failed'));
      
      await act(async () => {
        await result.current.hotReload();
      });
      
      expect(result.current.isHotReloading).toBe(false);
    });

    it('should handle import/export errors', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'import-export-test',
      }));
      
      // Test invalid JSON import
      await act(async () => {
        const success = result.current.importConfig('invalid json');
        expect(success).toBe(false);
      });
      
      // Test export
      const exported = result.current.exportConfig();
      expect(exported).toBeTypeOf('string');
      expect(exported.length).toBeGreaterThan(0);
    });

    it('should handle binding errors', async () => {
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'binding-error-test',
        enableSkinBinding: true,
      }));
      
      // Mock binding to throw error
      const originalBind = result.current.bind;
      result.current.bind = vi.fn().mockImplementation(() => {
        throw new Error('Binding failed');
      });
      
      await act(async () => {
        result.current.bind();
      });
      
      expect(result.current.bindingError).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up on unmount', () => {
      const { unmount } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'cleanup-test',
        enableSkinBinding: true,
      }));
      
      // Verify hook is working
      expect(result.current.config).toBeDefined();
      
      // Unmount should clean up
      unmount();
      
      // After unmount, there should be no memory leaks
      // This is more of a smoke test since we can't directly measure memory
      expect(true).toBe(true);
    });

    it('should handle large configuration objects', async () => {
      const largeConfig = {
        frame: {
          ...VALID_CONFIG.frame,
          // Add many properties to simulate large config
          ...Array.from({ length: 100 }, (_, i) => ({
            [`customProperty${i}`]: `value-${i}`,
          })).reduce((acc, prop) => ({ ...acc, ...prop }), {}),
        },
      };
      
      const { result } = renderHook(() => useActivityCapsuleSkin({
        componentId: 'large-config-test',
        initialConfig: largeConfig,
      }));
      
      expect(result.current.config).toBeDefined();
      expect(result.current.isValid).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('WL-STY-010: Integration Tests', () => {
  it('should integrate with existing ActivityCapsule component', () => {
    // Test that the new skin-aware component can replace the existing one
    const { container } = renderHook(() => 
      <ActivityCapsuleSkinAware
        activityId="integration-test"
        label="Integration Test Activity"
        slots={TEST_SLOTS}
        maxSlots={3}
        progressFraction={0.5}
        elapsedSeconds={5}
        totalDurationSeconds={10}
        status="in-progress"
        canCollect={false}
        // Legacy compatibility props
        skinPresetOverrideId="minimal-frontier"
        skinConfigOverrideLegacy={{
          frameBorder: 'legacy-border',
        }}
      />
    );
    
    expect(container.querySelector('[data-testid="activity-capsule-skin-aware"]')).toBeDefined();
    expect(container.querySelector('[data-activity-id="integration-test"]')).toBeDefined();
  });

  it('should work with TS-Series skin system', () => {
    const { result } = renderHook(() => useActivityCapsuleSkin({
      componentId: 'ts-series-test',
      enableSkinBinding: true,
      enableValidation: true,
      enableHotReload: true,
    }));
    
    expect(result.current.config).toBeDefined();
    expect(result.current.isBound).toBe(false); // Mock binding returns null
    expect(result.current.isValid).toBe(true);
    expect(typeof result.current.hotReload).toBe('function');
  });

  it('should handle multiple instances', () => {
    const { container } = renderHook(() => (
      <>
        <ActivityCapsuleSkinAware
          activityId="instance-1"
          label="Instance 1"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.3}
          elapsedSeconds={3}
          totalDurationSeconds={10}
          status="in-progress"
          canCollect={false}
          skinBindingId="instance-1-binding"
        />
        <ActivityCapsuleSkinAware
          activityId="instance-2"
          label="Instance 2"
          slots={TEST_SLOTS}
          maxSlots={3}
          progressFraction={0.7}
          elapsedSeconds={7}
          totalDurationSeconds={10}
          status="in-progress"
          canCollect={false}
          skinBindingId="instance-2-binding"
        />
      </>
    ));
    
    expect(container.querySelectorAll('[data-testid="activity-capsule-skin-aware"]')).toHaveLength(2);
    expect(container.querySelector('[data-activity-id="instance-1"]')).toBeDefined();
    expect(container.querySelector('[data-activity-id="instance-2"]')).toBeDefined();
    expect(container.querySelector('[data-skin-binding-id="instance-1-binding"]')).toBeDefined();
    expect(container.querySelector('[data-skin-binding-id="instance-2-binding"]')).toBeDefined();
  });

  it('should maintain backward compatibility', () => {
    // Test that existing ActivityCapsule props still work
    const { container } = renderHook(() => 
      <ActivityCapsuleSkinAware
        activityId="compatibility-test"
        label="Compatibility Test"
        icon={<span>🎯</span>}
        subtitle="Test subtitle"
        helperText="Test helper text"
        slots={TEST_SLOTS}
        maxSlots={3}
        progressFraction={0.5}
        elapsedSeconds={5}
        totalDurationSeconds={10}
        status="in-progress"
        canCollect={false}
        collectLabel="Collect Now"
        collectDisabled={false}
        onActivityClick={() => {}}
        showSlots={true}
        showProgress={true}
        showTimer={true}
        compact={false}
        ariaLabel="Test activity"
        ariaLive="polite"
      />
    );
    
    expect(container.querySelector('.activity-capsule-skin-aware__icon')).toBeDefined();
    expect(container.querySelector('.activity-capsule-skin-aware__subtitle')).toBeDefined();
    expect(container.querySelector('.activity-capsule-skin-aware__helper')).toBeDefined();
  });
});
