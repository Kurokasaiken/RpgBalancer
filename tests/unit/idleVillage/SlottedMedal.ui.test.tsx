/**
 * SlottedMedal UI Components Test Suite
 * 
 * Tests for the modular SlottedMedal components:
 * - SlottedMedalSkin
 * - SlottedMedalHaloCanvas  
 * - SlottedMedalResistRing
 * - SlottedMedal (main component)
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import SlottedMedalSkin from '@/ui/idleVillage/components/SlottedMedalSkin';
import SlottedMedalHaloCanvas from '@/ui/idleVillage/components/SlottedMedalHaloCanvas';
import SlottedMedalResistRing from '@/ui/idleVillage/components/SlottedMedalResistRing';

// Mock dependencies
vi.mock('@/ui/idleVillage/hooks/useSlottedMedalBehavior', () => ({
  useSlottedMedalBehavior: vi.fn(() => ({
    state: 'idle',
    animationControls: {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      subscribe: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      stopAll: vi.fn(),
      mount: vi.fn(),
      unmount: vi.fn(),
    },
    springToCenter: vi.fn(),
    triggerShake: vi.fn(),
    triggerClank: vi.fn(),
    resistStart: vi.fn(),
    triggerDetach: vi.fn(),
    handleDrop: vi.fn(),
    handleReject: vi.fn(),
    handleComplete: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: vi.fn(() => ({
    config: {
      slottedMedal: {
        medalTypes: {
          bronze: {
            glyph: '🥉',
            halo: {
              idleWidth: 2,
              activeWidth: 8,
              colors: [
                { token: 'metallic.bronze.primary', fallback: '#CD7F32' },
                { token: 'metallic.bronze.secondary', fallback: '#B87333' },
              ],
            },
            dropShadow: 'rgba(205, 127, 50, 0.3)',
          },
          silver: {
            glyph: '🥈',
            halo: {
              idleWidth: 2,
              activeWidth: 8,
              colors: [
                { token: 'metallic.silver.primary', fallback: '#C0C0C0' },
                { token: 'metallic.silver.secondary', fallback: '#B8B8B8' },
              ],
            },
            dropShadow: 'rgba(192, 192, 192, 0.3)',
          },
          gold: {
            glyph: '🥇',
            halo: {
              idleWidth: 2,
              activeWidth: 8,
              colors: [
                { token: 'metallic.gold.primary', fallback: '#FFD700' },
                { token: 'metallic.gold.secondary', fallback: '#FFA500' },
              ],
            },
            dropShadow: 'rgba(255, 215, 0, 0.3)',
          },
        },
        behavior: {
          resistDurationMs: 1500,
          springStiffness: 400,
          springDamping: 0.8,
          magneticPull: {
            enabled: true,
            elasticity: 1.2,
          },
        },
        telemetry: {
          dropEvent: 'slot_medal_dropped',
          detachEvent: 'slot_medal_detached',
          completeEvent: 'slot_medal_completed',
        },
      },
    },
  })),
}));

vi.mock('@/ui/styleLab/hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: vi.fn(() => ({})),
}));

vi.mock('@dnd-kit/core', () => ({
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
  })),
}));

describe('SlottedMedal UI Components', () => {
  describe('SlottedMedalSkin', () => {
    it('should render with minimal preset', () => {
      render(
        <SlottedMedalSkin
          id="test-medal"
          type="bronze"
          skinPreset="minimal"
        />
      );
      
      expect(screen.getByTestId('slotted-medal-skin')).toBeInTheDocument();
    });

    it('should render with enhanced preset', () => {
      render(
        <SlottedMedalSkin
          id="test-medal"
          type="gold"
          skinPreset="enhanced"
        />
      );
      
      expect(screen.getByTestId('slotted-medal-skin')).toBeInTheDocument();
    });

    it('should render with ceremonial preset', () => {
      render(
        <SlottedMedalSkin
          id="test-medal"
          type="platinum"
          skinPreset="ceremonial"
        />
      );
      
      expect(screen.getByTestId('slotted-medal-skin')).toBeInTheDocument();
    });

    it('should handle active state', () => {
      render(
        <SlottedMedalSkin
          id="test-medal"
          type="silver"
          isActive={true}
        />
      );
      
      expect(screen.getByTestId('slotted-medal-skin')).toBeInTheDocument();
    });

    it('should handle drag state', () => {
      render(
        <SlottedMedalSkin
          id="test-medal"
          type="gold"
          isDragging={true}
        />
      );
      
      expect(screen.getByTestId('slotted-medal-skin')).toBeInTheDocument();
    });
  });

  describe('SlottedMedalHaloCanvas', () => {
    it('should render for active state', () => {
      render(
        <SlottedMedalHaloCanvas
          state="active"
          medalType="bronze"
          medalId="test-medal"
        />
      );
      
      // Halo canvas should be present in DOM (no testId needed)
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should not render for empty state', () => {
      render(
        <SlottedMedalHaloCanvas
          state="empty"
          medalType="silver"
          medalId="test-medal"
        />
      );
      
      // Should not render anything for empty state
      expect(document.querySelector('svg')).toBeNull();
    });

    it('should render with different size presets', () => {
      const { rerender } = render(
        <SlottedMedalHaloCanvas
          state="idle"
          medalType="gold"
          medalId="test-medal"
          sizePreset="small"
        />
      );
      
      expect(document.querySelector('svg')).toBeInTheDocument();
      
      rerender(
        <SlottedMedalHaloCanvas
          state="idle"
          medalType="gold"
          medalId="test-medal"
          sizePreset="large"
        />
      );
      
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should render with different animation levels', () => {
      render(
        <SlottedMedalHaloCanvas
          state="landing"
          medalType="platinum"
          medalId="test-medal"
          animationLevel="intense"
        />
      );
      
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('SlottedMedalResistRing', () => {
    it('should not render when not resisting', () => {
      render(
        <SlottedMedalResistRing
          isResisting={false}
          medalType="bronze"
        />
      );
      
      // Should not render anything when not resisting
      expect(document.querySelector('svg')).toBeNull();
    });

    it('should render when resisting', () => {
      render(
        <SlottedMedalResistRing
          isResisting={true}
          medalType="silver"
        />
      );
      
      // Should render resistance ring
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should render with timer', () => {
      render(
        <SlottedMedalResistRing
          isResisting={true}
          medalType="gold"
          showTimer={true}
          resistanceDuration={2000}
        />
      );
      
      expect(document.querySelector('svg')).toBeInTheDocument();
      expect(document.querySelector('text')).toBeInTheDocument();
    });

    it('should render with magnetic pull', () => {
      render(
        <SlottedMedalResistRing
          isResisting={true}
          medalType="platinum"
          magneticPullEnabled={true}
        />
      );
      
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('SlottedMedal (Main Component)', () => {
    it('should render with default props', () => {
      render(<SlottedMedal id="test-medal" type="bronze" />);
      
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('should render with all skin presets', () => {
      const { rerender } = render(
        <SlottedMedal id="test-medal" type="gold" skinPreset="minimal" />
      );
      
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      
      rerender(<SlottedMedal id="test-medal" type="gold" skinPreset="enhanced" />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      
      rerender(<SlottedMedal id="test-medal" type="gold" skinPreset="ceremonial" />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('should render with different medal types', () => {
      const { rerender } = render(<SlottedMedal id="test-medal" type="bronze" />);
      
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      
      rerender(<SlottedMedal id="test-medal" type="silver" />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      
      rerender(<SlottedMedal id="test-medal" type="gold" />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      
      rerender(<SlottedMedal id="test-medal" type="platinum" />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('should render when active', () => {
      render(<SlottedMedal id="test-medal" type="silver" isActive={true} />);
      
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('should render with resident assigned', () => {
      render(
        <SlottedMedal 
          id="test-medal" 
          type="gold" 
          residentId="resident-123" 
        />
      );
      
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(
        <SlottedMedal 
          id="test-medal" 
          type="platinum" 
          className="custom-medal-class" 
        />
      );
      
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      expect(screen.getByTestId('slotted-medal')).toHaveClass('custom-medal-class');
    });

    it('should render with custom testId', () => {
      render(
        <SlottedMedal 
          id="test-medal" 
          type="bronze" 
          data-testid="custom-test-id" 
        />
      );
      
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render all components together', () => {
      render(
        <SlottedMedal
          id="integration-test"
          type="gold"
          skinPreset="ceremonial"
          isActive={true}
        />
      );
      
      // Main component should render
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      
      // All sub-components should be present
      expect(document.querySelector('svg')).toBeInTheDocument(); // Halo and/or resist ring
    });

    it('should handle state changes gracefully', () => {
      const { rerender } = render(
        <SlottedMedal id="state-test" type="silver" isActive={false} />
      );
      
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
      
      rerender(<SlottedMedal id="state-test" type="silver" isActive={true} />);
      expect(screen.getByTestId('slotted-medal')).toBeInTheDocument();
    });
  });
});
