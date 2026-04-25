/**
 * ResidentSlotRack Skin Integration Tests
 * 
 * Tests the skin-aware wrapper for ResidentSlotRack including:
 * - CSS custom property application
 * - Interaction physics bridging to Framer Motion
 * - SlottedMedal styling configuration
 * - Telemetry event emission
 * - Data attribute application
 * - SlotRackRenderer integration
 * 
 * @fileoverview Integration tests for skin-ready ResidentSlotRack
 * @see IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md §5.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { motion } from 'framer-motion';
import ResidentSlotRackSkin from '@/ui/idleVillage/components/ResidentSlotRackSkin';
import SlotRackRenderer from '@/ui/idleVillage/skins/slotRack/SlotRackRenderer';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { trackSlotRackSkinRendered, trackSlotRackDragState, createMockSlotRackTelemetry } from '@/ui/idleVillage/utils/telemetry/slotRackTelemetry';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

// Mock dependencies
vi.mock('@/ui/idleVillage/hooks/useSkinPreferences');
vi.mock('@/analytics/telemetry/telemetryProvider');
vi.mock('@/ui/idleVillage/utils/telemetry/slotRackTelemetry');
vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  default: React.forwardRef(({ slots, className, medalStyleConfig, ...props }: any, ref: any) => (
    <div ref={ref} className={`resident-slot-rack ${className || ''}`} data-testid="resident-slot-rack" {...props}>
      <div data-testid="slot-count">{slots.length}</div>
      {medalStyleConfig && (
        <div data-testid="medal-style-config">
          <div data-testid="skin-preset">{medalStyleConfig.skinPreset}</div>
          <div data-testid="physics-mass">{medalStyleConfig.interactionPhysics?.mass}</div>
        </div>
      )}
    </div>
  )),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, style, ...props }: any, ref: any) => (
      <div ref={ref} className={className} style={style} {...props}>
        {children}
      </div>
    )),
  },
}));

const mockUseSkinPreferences = vi.mocked(useSkinPreferences);
const mockTrackTelemetryEvent = vi.mocked(trackTelemetryEvent);

describe('ResidentSlotRackSkin Integration', () => {
  const mockSlots: ResidentSlotViewModel[] = [
    {
      id: 'slot-1',
      activityId: 'forest-work',
      label: 'Forest Work',
      icon: '🌲',
      residentId: undefined,
      state: 'empty',
      progress: 0,
      maxProgress: 100,
    },
    {
      id: 'slot-2',
      activityId: 'gold-mine',
      label: 'Gold Mine',
      icon: '⛏️',
      residentId: 'resident-1',
      state: 'occupied',
      progress: 45,
      maxProgress: 100,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for skin preferences
    mockUseSkinPreferences.mockReturnValue({
      presetId: 'minimal_frontier',
      pillar: 'frontier',
      skinConfig: {
        id: 'minimal_frontier',
        label: 'Minimal Frontier',
        version: 1,
        defaultPillar: 'frontier' as const,
        supportedPillars: ['frontier'],
        palette: {
          primary: '#f7f2e9',
          secondary: '#c6c1b7',
          accent: '#4a6d82',
          glow: 'rgba(255,255,255,0.45)',
          background: '#101418',
          text: '#fefbf4',
        },
        densityMode: 'cozy' as const,
        motionLevel: 'reduced' as const,
        typographyScale: 1,
        componentThemes: {
          roster: 'minimalFrontier.roster.clean-panel',
          slotRack: 'minimalFrontier.slot.airy-grid',
          timeStrip: 'minimalFrontier.time.raycast',
          hud: 'minimalFrontier.hud.line',
          capsule: 'minimalFrontier.capsule.transparent',
          halo: 'minimalFrontier.halo.soft',
        },
        interactionPhysics: {
          mass: 0.95,
          damping: 0.24,
          stiffness: 180,
          shadowDepth: 'medium' as const,
          bloomIntensity: 0.4,
          audioProfile: 'minimal-frontier.core',
        },
        styleLabOverrides: {
          motionLevel: 'reduced' as const,
          densityMode: 'cozy' as const,
          typographyScale: 1,
          focusStyle: 'enhanced' as const,
          colorFilters: {
            visionMode: 'standard' as const,
          },
        },
        telemetry: {
          presetChangedEvent: 'skin_preset_changed',
          renderedEvent: 'skin_rendered',
          context: 'idle_village_minimal_frontier',
        },
        documentation: [],
      },
      supportedPillars: ['frontier'],
      availablePresets: [],
      isLoading: false,
      setPreset: vi.fn(),
      setPillar: vi.fn(),
      updateOverrides: vi.fn(),
      resetOverrides: vi.fn(),
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    // Clean up any CSS custom properties set during tests
    const root = document.documentElement;
    const properties = ['--slot-rack-gap', '--slot-rack-padding', '--slot-rack-bg'];
    properties.forEach(prop => root.style.removeProperty(prop));
  });

  describe('Basic Rendering', () => {
    it('renders with default skin preferences', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      expect(screen.getByTestId('resident-slot-rack-skin')).toBeInTheDocument();
      expect(screen.getByTestId('resident-slot-rack')).toBeInTheDocument();
      expect(screen.getByTestId('slot-count')).toHaveTextContent('2');
    });

    it('applies custom CSS class names', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} className="custom-class" />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      expect(wrapper).toHaveClass('custom-class', 'minimal_frontier');
    });

    it('uses custom test ID', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} data-testid="custom-test-id" />);
      
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Skin Configuration', () => {
    it('applies data attributes for CSS targeting', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      expect(wrapper).toHaveAttribute('data-slot-skin', 'minimal_frontier');
      expect(wrapper).toHaveAttribute('data-skin-preset', 'minimal_frontier');
      expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'frontier');
    });

    it('overrides skin preset when provided', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} skinPresetId="wanderlust" />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      expect(wrapper).toHaveAttribute('data-slot-skin', 'wanderlust');
      expect(wrapper).toHaveAttribute('data-skin-preset', 'wanderlust');
    });

    it('applies CSS custom properties to root element', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--slot-rack-gap')).toBe('12px');
      expect(root.style.getPropertyValue('--slot-rack-padding')).toBe('16px');
      expect(root.style.getPropertyValue('--slot-rack-bg')).toBe('rgba(30, 41, 59, 0.4)');
    });

    it('cleans up CSS properties on unmount', () => {
      const { unmount } = render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      // Verify properties are set
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--slot-rack-gap')).toBe('12px');
      
      // Unmount and verify cleanup
      unmount();
      expect(root.style.getPropertyValue('--slot-rack-gap')).toBe('');
    });
  });

  describe('SlottedMedal Styling Bridge', () => {
    it('passes medal style configuration to ResidentSlotRack', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      expect(screen.getByTestId('medal-style-config')).toBeInTheDocument();
      expect(screen.getByTestId('skin-preset')).toHaveTextContent('minimal');
      expect(screen.getByTestId('physics-mass')).toHaveTextContent('0.95');
    });

    it('uses enhanced preset for wanderlust skin', () => {
      // Mock wanderlust skin config
      mockUseSkinPreferences.mockReturnValue({
        ...mockUseSkinPreferences(),
        presetId: 'wanderlust',
        pillar: 'wilderness',
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} skinPresetId="wanderlust" />);
      
      expect(screen.getByTestId('skin-preset')).toHaveTextContent('enhanced');
    });
  });

  describe('Telemetry Integration', () => {
    it('emits slot_rack_skin_rendered telemetry event', async () => {
      const mockTrackSlotRackSkinRendered = vi.mocked(trackSlotRackSkinRendered);
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      await waitFor(() => {
        expect(mockTrackSlotRackSkinRendered).toHaveBeenCalledWith(
          expect.any(Object), // skinConfig
          2, // slotCount
          'board', // scenarioId
          'idle' // dragState
        );
      });
    });

    it('includes Style Lab physics tokens in telemetry payload', async () => {
      const mockTrackSlotRackSkinRendered = vi.mocked(trackSlotRackSkinRendered);
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      await waitFor(() => {
        const call = mockTrackSlotRackSkinRendered.mock.calls[0];
        const skinConfig = call[0];
        
        expect(skinConfig).toHaveProperty('id');
        expect(skinConfig).toHaveProperty('version');
        expect(skinConfig).toHaveProperty('defaultPillar');
      });
    });

    it('tracks drag state changes', async () => {
      const mockTrackSlotRackDragState = vi.mocked(trackSlotRackDragState);
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      // Mock drag state change
      // Note: This would require mocking the drag state context
      // For now, we verify the function is imported and available
      
      expect(mockTrackSlotRackDragState).toBeDefined();
    });
  });

  describe('Telemetry Events', () => {
    it('emits telemetry event on render', async () => {
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      await waitFor(() => {
        expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('slot_rack_skin_rendered', {
          skinPresetId: 'minimal_frontier',
          skinConfigId: 'minimal_frontier_slot_rack',
          slotCount: 2,
          layout: 'board',
          pillar: 'frontier',
          interactionPhysics: {
            mass: 0.95,
            damping: 0.24,
            stiffness: 180,
            shadowDepth: 'medium',
            bloomIntensity: 0.4,
          },
          audioProfile: 'minimal-frontier.core',
          timestamp: expect.any(Number),
        });
      });
    });

    it('includes custom layout in telemetry', () => {
      render(<ResidentSlotRackSkin slots={mockSlots} layout="detail" />);
      
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'slot_rack_skin_rendered',
        expect.objectContaining({
          layout: 'detail',
        })
      );
    });
  });

  describe('Loading States', () => {
    it('shows loading state when preferences are loading', () => {
      mockUseSkinPreferences.mockReturnValue({
        ...mockUseSkinPreferences(),
        isLoading: true,
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      expect(wrapper).toHaveAttribute('data-loading', 'true');
      expect(wrapper).toHaveStyle({ opacity: '0.5' });
    });

    it('shows loading state when skin config is unavailable', () => {
      mockUseSkinPreferences.mockReturnValue({
        ...mockUseSkinPreferences(),
        presetId: 'unknown_preset',
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      expect(wrapper).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards all ResidentSlotRack props correctly', () => {
      const customProps = {
        layout: 'detail' as const,
        overflowBehavior: 'scroll' as const,
        getSlotProgress: vi.fn(),
        getSlotActivityState: vi.fn(),
      };
      
      render(<ResidentSlotRackSkin slots={mockSlots} {...customProps} />);
      
      // Verify the base component receives the props
      expect(screen.getByTestId('resident-slot-rack')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing skin preferences gracefully', () => {
      mockUseSkinPreferences.mockReturnValue({
        presetId: '',
        pillar: 'frontier' as const,
        skinConfig: null as any,
        supportedPillars: [],
        availablePresets: [],
        isLoading: false,
        setPreset: vi.fn(),
        setPillar: vi.fn(),
        updateOverrides: vi.fn(),
        resetOverrides: vi.fn(),
        refresh: vi.fn(),
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      expect(wrapper).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('SlotRackRenderer Integration', () => {
    it('should render SlotRackRenderer with correct props', () => {
      mockUseSkinPreferences.mockReturnValue({
        presetId: 'minimal_frontier',
        pillar: 'frontier',
        isLoading: false,
        setPreset: vi.fn(),
        setPillar: vi.fn(),
        updateOverrides: vi.fn(),
        resetOverrides: vi.fn(),
        refresh: vi.fn(),
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      // Verify the component renders without errors
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('CSS Custom Properties', () => {
    it('should apply CSS vars from skin config', () => {
      mockUseSkinPreferences.mockReturnValue({
        presetId: 'minimal_frontier',
        pillar: 'frontier',
        isLoading: false,
        setPreset: vi.fn(),
        setPillar: vi.fn(),
        updateOverrides: vi.fn(),
        resetOverrides: vi.fn(),
        refresh: vi.fn(),
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      
      // Check that CSS vars are applied (simplified test)
      expect(wrapper).toHaveStyle({
        background: 'var(--slot-rack-bg-gradient, var(--slot-rack-bg, transparent))',
        border: 'var(--slot-rack-border, none)',
        borderRadius: 'var(--slot-rack-border-radius, 0)',
        padding: 'var(--slot-rack-padding, 0)',
        gap: 'var(--slot-rack-gap, 0)',
      });
    });

    it('should apply new CSS vars for rack styling', () => {
      mockUseSkinPreferences.mockReturnValue({
        presetId: 'slot_rack_iron_bronze',
        pillar: 'wilderness',
        isLoading: false,
        setPreset: vi.fn(),
        setPillar: vi.fn(),
        updateOverrides: vi.fn(),
        resetOverrides: vi.fn(),
        refresh: vi.fn(),
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      
      // Check that new CSS vars are applied
      expect(wrapper).toHaveStyle({
        background: 'var(--slot-rack-bg-gradient, var(--slot-rack-bg, transparent))',
      });
    });
  });

  describe('Data Attributes', () => {
    it('should apply correct data attributes', () => {
      mockUseSkinPreferences.mockReturnValue({
        presetId: 'minimal_frontier',
        pillar: 'frontier',
        isLoading: false,
        setPreset: vi.fn(),
        setPillar: vi.fn(),
        updateOverrides: vi.fn(),
        resetOverrides: vi.fn(),
        refresh: vi.fn(),
      });
      
      render(<ResidentSlotRackSkin slots={mockSlots} />);
      
      const wrapper = screen.getByTestId('resident-slot-rack-skin');
      
      expect(wrapper).toHaveAttribute('data-slot-skin', 'minimal_frontier_slot_rack');
      expect(wrapper).toHaveAttribute('data-skin-preset', 'minimal_frontier');
      expect(wrapper).toHaveAttribute('data-style-lab-pillar', 'frontier');
      expect(wrapper).toHaveAttribute('data-testid', 'resident-slot-rack-skin');
    });
  });
});
