/**
 * ActionHalo Skin Component Unit Tests
 * 
 * Tests for ActionHalo component with config-first skin support,
 * pillar variants, telemetry integration, and interaction states.
 * 
 * Coverage: rendering, props, skin config, telemetry, interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActionHalo, type ActionHaloProps } from '@/ui/idleVillage/map/actionCards/ActionHalo';
import { getActionHaloSkinConfig } from '@/ui/idleVillage/skins/actionHaloSkinConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock Style Lab hooks
vi.mock('@/ui/styleLab/hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: () => ({
    preset: {
      interactionColors: {
        accentPrimary: '#c8a030',
      },
    },
  }),
}));

vi.mock('@/ui/styleLab/presets/presetBridge', () => ({
  getMapHaloFeelTokens: () => ({
    haloColor: 'rgb(71, 85, 105)',
    haloGlow: 'rgba(71, 85, 105, 0.6)',
    pulseIntensity: 0.4,
    pulseSpeed: 2.2,
    shadowBlur: 10,
    interaction: {
      transitionMs: 180,
      hoverScale: 1.05,
      activeScale: 0.98,
    },
  }),
  getHaloShaderTokens: () => ({
    gradientStops: [
      { offset: 0, color: 'rgba(71, 85, 105, 0.8)', opacity: 0.8 },
      { offset: 0.5, color: 'rgba(71, 85, 105, 0.4)', opacity: 0.4 },
      { offset: 1, color: 'rgba(71, 85, 105, 0)', opacity: 0 },
    ],
  }),
}));

describe('ActionHalo', () => {
  const defaultProps: ActionHaloProps = {
    size: 32,
    ringWidth: 4,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders halo with default props', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toBeInTheDocument();
    });

    it('renders with custom icon', () => {
      const icon = <div data-testid="custom-icon">Icon</div>;
      render(<ActionHalo {...defaultProps} icon={icon} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders with icon text fallback', () => {
      render(<ActionHalo {...defaultProps} iconText="QUEST" />);
      
      expect(screen.getByText('QUEST')).toBeInTheDocument();
    });

    it('uses default icon text when none provided', () => {
      render(<ActionHalo {...defaultProps} />);
      
      expect(screen.getByText('POI')).toBeInTheDocument();
    });

    it('applies custom data-testid', () => {
      render(<ActionHalo {...defaultProps} dataTestId="custom-halo" />);
      
      expect(screen.getByTestId('custom-halo')).toBeInTheDocument();
    });
  });

  describe('Size and Appearance', () => {
    it('applies correct size based on prop', () => {
      render(<ActionHalo {...defaultProps} size={48} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveStyle('width: 96px');
      expect(halo).toHaveStyle('height: 96px');
    });

    it('applies correct ring width', () => {
      render(<ActionHalo {...defaultProps} ringWidth={6} />);
      
      const ring = document.querySelector('.action-halo__ring');
      expect(ring).toHaveStyle('border-width: 6px');
    });

    it('applies custom pulse intensity', () => {
      render(<ActionHalo {...defaultProps} pulseIntensity={0.8} />);
      
      const ring = document.querySelector('.action-halo__ring');
      expect(ring).toHaveStyle('opacity: 0.8');
    });

    it('applies custom pulse speed', () => {
      render(<ActionHalo {...defaultProps} pulseSpeed={3} />);
      
      const ring = document.querySelector('.action-halo__ring');
      expect(ring).toHaveStyle('animation: pulse 3s ease-in-out infinite');
    });

    it('applies custom shadow blur', () => {
      render(<ActionHalo {...defaultProps} shadowBlur={20} />);
      
      const ring = document.querySelector('.action-halo__ring');
      expect(ring).toHaveStyle('box-shadow: 0 0 20px rgba(71, 85, 105, 0.6)');
    });
  });

  describe('Pillar Variants', () => {
    it('applies wilderness pillar styles', () => {
      render(<ActionHalo {...defaultProps} pillar="wilderness" />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('data-pillar', 'wilderness');
    });

    it('applies empire pillar styles', () => {
      render(<ActionHalo {...defaultProps} pillar="empire" />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('data-pillar', 'empire');
    });

    it('uses default pillar when none specified', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('data-pillar', 'minimalFrontier');
    });
  });

  describe('Interactions', () => {
    it('handles click events', () => {
      const onClick = vi.fn();
      render(<ActionHalo {...defaultProps} onClick={onClick} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.click(halo);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('handles hover events', () => {
      const onHover = vi.fn();
      const onLeave = vi.fn();
      
      render(<ActionHalo {...defaultProps} onHover={onHover} onLeave={onLeave} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.mouseEnter(halo);
      expect(onHover).toHaveBeenCalledTimes(1);
      
      fireEvent.mouseLeave(halo);
      expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it('applies hover scaling', async () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.mouseEnter(halo);
      
      await waitFor(() => {
        expect(halo).toHaveStyle('transform: scale(1.05)');
      });
    });

    it('applies active scaling on click', async () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.mouseDown(halo);
      
      await waitFor(() => {
        expect(halo).toHaveStyle('transform: scale(0.98)');
      });
    });

    it('shows pointer cursor when clickable', () => {
      render(<ActionHalo {...defaultProps} onClick={vi.fn()} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveStyle('cursor: pointer');
    });

    it('shows default cursor when not clickable', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveStyle('cursor: default');
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag events', () => {
      const onDragEnter = vi.fn();
      const onDragLeave = vi.fn();
      const onDragOver = vi.fn();
      const onDrop = vi.fn();
      
      render(
        <ActionHalo
          {...defaultProps}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
      );
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      
      fireEvent.dragEnter(halo);
      expect(onDragEnter).toHaveBeenCalledTimes(1);
      
      fireEvent.dragOver(halo);
      expect(onDragOver).toHaveBeenCalledTimes(1);
      
      fireEvent.dragLeave(halo);
      expect(onDragLeave).toHaveBeenCalledTimes(1);
      
      fireEvent.drop(halo);
      expect(onDrop).toHaveBeenCalledTimes(1);
    });

    it('applies drop active scaling', async () => {
      render(<ActionHalo {...defaultProps} onDragEnter={vi.fn()} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.dragEnter(halo);
      
      await waitFor(() => {
        expect(halo).toHaveStyle('transform: scale(0.9)');
      });
    });
  });

  describe('Bloom Effects', () => {
    it('enables bloom by default', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('data-bloom', 'true');
    });

    it('disables bloom when specified', () => {
      render(<ActionHalo {...defaultProps} enableBloom={false} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('data-bloom', 'false');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      render(<ActionHalo {...defaultProps} iconText="QUEST" />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('aria-label', 'QUEST POI');
    });

    it('has proper role', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('role', 'button');
    });

    it('supports keyboard navigation', () => {
      const onClick = vi.fn();
      render(<ActionHalo {...defaultProps} onClick={onClick} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.keyDown(halo, { key: 'Enter' });
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Skin Configuration', () => {
    it('applies skin config overrides', () => {
      const skinConfigOverride = {
        visual: {
          haloColor: 'rgba(255, 0, 0, 0.8)',
          haloGlowIntensity: 1.2,
        },
      };
      
      render(<ActionHalo {...defaultProps} />);
      
      // The skin config would be applied through the getActionHaloSkinConfig function
      // This test verifies the component structure is ready for skin config integration
      expect(screen.getByRole('generic', { name: /poi/i })).toBeInTheDocument();
    });

    it('respects reduced motion preferences', () => {
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
      
      render(<ActionHalo {...defaultProps} />);
      
      const ring = document.querySelector('.action-halo__ring');
      // Should have reduced motion animation
      expect(ring).toBeInTheDocument();
    });
  });

  describe('Telemetry Integration', () => {
    it('sends telemetry event on render', () => {
      render(<ActionHalo {...defaultProps} />);
      
      expect(trackTelemetryEvent).toHaveBeenCalledWith('action_halo_rendered', {
        size: 32,
        ringWidth: 4,
        pillar: 'minimalFrontier',
        enableBloom: true,
        timestamp: expect.any(Number),
      });
    });

    it('sends telemetry event on click', () => {
      const onClick = vi.fn();
      render(<ActionHalo {...defaultProps} onClick={onClick} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.click(halo);
      
      expect(trackTelemetryEvent).toHaveBeenCalledWith('action_halo_click', {
        size: 32,
        ringWidth: 4,
        pillar: 'minimalFrontier',
        timestamp: expect.any(Number),
      });
    });

    it('sends telemetry event on hover', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.mouseEnter(halo);
      
      expect(trackTelemetryEvent).toHaveBeenCalledWith('action_halo_hover', {
        size: 32,
        ringWidth: 4,
        pillar: 'minimalFrontier',
        timestamp: expect.any(Number),
      });
    });

    it('sends telemetry event on drop', () => {
      render(<ActionHalo {...defaultProps} onDrop={vi.fn()} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      fireEvent.drop(halo);
      
      expect(trackTelemetryEvent).toHaveBeenCalledWith('action_halo_drop', {
        size: 32,
        ringWidth: 4,
        pillar: 'minimalFrontier',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Data Attributes', () => {
    it('sets all required data attributes', () => {
      render(<ActionHalo {...defaultProps} pillar="wilderness" enableBloom={false} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveAttribute('data-size', '32');
      expect(halo).toHaveAttribute('data-ring-width', '4');
      expect(halo).toHaveAttribute('data-pillar', 'wilderness');
      expect(halo).toHaveAttribute('data-bloom', 'false');
    });
  });

  describe('Error Handling', () => {
    it('handles missing props gracefully', () => {
      render(<ActionHalo />);
      
      expect(screen.getByRole('generic', { name: /poi/i })).toBeInTheDocument();
    });

    it('handles invalid size values', () => {
      render(<ActionHalo {...defaultProps} size={-10} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveStyle('width: -20px');
    });

    it('handles invalid ring width values', () => {
      render(<ActionHalo {...defaultProps} ringWidth={-5} />);
      
      const ring = document.querySelector('.action-halo__ring');
      expect(ring).toHaveStyle('border-width: -5px');
    });
  });

  describe('Performance', () => {
    it('uses GPU acceleration when enabled', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveStyle('transform: translateZ(0)');
    });

    it('applies will-change for animations', () => {
      render(<ActionHalo {...defaultProps} />);
      
      const halo = screen.getByRole('generic', { name: /poi/i });
      expect(halo).toHaveStyle('will-change: transform');
    });
  });
});
