/**
 * ActivityCapsule Skin Component Unit Tests
 * 
 * Tests for ActivityCapsule component with config-first skin support,
 * pillar variants, telemetry integration, and accessibility features.
 * 
 * Coverage: rendering, props, skin config, telemetry, accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivityCapsule, type ActivityCapsuleProps } from '@/ui/idleVillage/components/ActivityCapsule';
import { getActivityCapsuleSkinConfig } from '@/ui/idleVillage/skins/activityCapsuleSkinConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock skin preferences hook
vi.mock('@/ui/idleVillage/hooks/useSkinPreferences', () => ({
  useSkinPreferences: () => ({
    presetId: 'wanderlust',
    pillar: 'wilderness',
    skinConfig: {},
    supportedPillars: ['wilderness', 'empire'],
    availablePresets: [],
    isLoading: false,
    setPreset: vi.fn(),
    setPillar: vi.fn(),
    updateOverrides: vi.fn(),
    resetOverrides: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock idle village config hook
vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({
    activities: {},
    residents: [],
    worldState: {},
    saveGame: vi.fn(),
    loadGame: vi.fn(),
  }),
}));

// Mock Style Lab surface
vi.mock('@/ui/styleLab/StyleLabSurface', () => ({
  StyleLabSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ActivityCapsule', () => {
  const defaultProps: ActivityCapsuleProps = {
    activityId: 'test-activity',
    label: 'Test Activity',
    slots: [
      { slotId: 'slot-1', isOccupied: false, isLocked: false },
      { slotId: 'slot-2', isOccupied: true, isLocked: false, assignedWorkerName: 'John Doe' },
    ],
    maxSlots: 3,
    progressFraction: 0.5,
    elapsedSeconds: 30,
    totalDurationSeconds: 60,
    status: 'in-progress',
    canCollect: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders activity capsule with required props', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      expect(screen.getByTestId('activity-capsule')).toBeInTheDocument();
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    it('renders with subtitle and helper text', () => {
      render(
        <ActivityCapsule
          {...defaultProps}
          subtitle="Test subtitle"
          helperText="Test helper"
        />
      );
      
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
      expect(screen.getByText('Test helper')).toBeInTheDocument();
    });

    it('renders custom icon when provided', () => {
      const icon = <div data-testid="custom-icon">Icon</div>;
      render(<ActivityCapsule {...defaultProps} icon={icon} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('hides slots when showSlots is false', () => {
      render(<ActivityCapsule {...defaultProps} showSlots={false} />);
      
      expect(screen.queryByTestId('slot-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('slot-2')).not.toBeInTheDocument();
    });

    it('hides progress when showProgress is false', () => {
      render(<ActivityCapsule {...defaultProps} showProgress={false} />);
      
      expect(screen.queryByText('0:30')).not.toBeInTheDocument();
    });

    it('hides timer when showTimer is false', () => {
      render(<ActivityCapsule {...defaultProps} showTimer={false} />);
      
      expect(screen.queryByText('0:30')).not.toBeInTheDocument();
    });
  });

  describe('Slot Display', () => {
    it('renders correct number of slots', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      expect(screen.getByTestId('slot-1')).toBeInTheDocument();
      expect(screen.getByTestId('slot-2')).toBeInTheDocument();
    });

    it('displays worker initials for occupied slots', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      const slot2 = screen.getByTestId('slot-2');
      expect(slot2).toHaveTextContent('JD');
    });

    it('shows empty indicator for unoccupied slots', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      const slot1 = screen.getByTestId('slot-1');
      expect(slot1.querySelector('.activity-capsule__slot-empty')).toBeInTheDocument();
    });

    it('applies correct data attributes to slots', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      const slot1 = screen.getByTestId('slot-1');
      expect(slot1).toHaveAttribute('data-slot-id', 'slot-1');
      expect(slot1).toHaveAttribute('data-occupied', 'false');
      expect(slot1).toHaveAttribute('data-locked', 'false');
      
      const slot2 = screen.getByTestId('slot-2');
      expect(slot2).toHaveAttribute('data-occupied', 'true');
      expect(slot2).toHaveAttribute('data-locked', 'false');
    });
  });

  describe('Progress Display', () => {
    it('displays correct remaining time', () => {
      render(<ActivityCapsule {...defaultProps} elapsedSeconds={45} totalDurationSeconds={60} />);
      
      expect(screen.getByText('0:15')).toBeInTheDocument();
    });

    it('displays --:-- for invalid time', () => {
      render(<ActivityCapsule {...defaultProps} elapsedSeconds={-1} totalDurationSeconds={60} />);
      
      expect(screen.getByText('--:--')).toBeInTheDocument();
    });

    it('calculates progress fraction correctly', async () => {
      render(<ActivityCapsule {...defaultProps} progressFraction={0.75} />);
      
      await waitFor(() => {
        const progressFill = document.querySelector('.activity-capsule__progress-fill');
        expect(progressFill).toHaveStyle('width: 75%');
      });
    });
  });

  describe('Collect CTA', () => {
    it('shows collect button when can collect', () => {
      render(<ActivityCapsule {...defaultProps} canCollect={true} onCollect={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: 'Collect' })).toBeInTheDocument();
    });

    it('uses custom collect label', () => {
      render(
        <ActivityCapsule
          {...defaultProps}
          canCollect={true}
          onCollect={vi.fn()}
          collectLabel="Harvest"
        />
      );
      
      expect(screen.getByRole('button', { name: 'Harvest' })).toBeInTheDocument();
    });

    it('disables button when collect disabled', () => {
      render(
        <ActivityCapsule
          {...defaultProps}
          canCollect={true}
          onCollect={vi.fn()}
          collectDisabled={true}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Collect' });
      expect(button).toBeDisabled();
    });

    it('calls onCollect when button clicked', async () => {
      const onCollect = vi.fn();
      render(<ActivityCapsule {...defaultProps} canCollect={true} onCollect={onCollect} />);
      
      const button = screen.getByRole('button', { name: 'Collect' });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(onCollect).toHaveBeenCalledTimes(1);
      });
    });

    it('shows collecting state during async collect', async () => {
      const onCollect = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ActivityCapsule {...defaultProps} canCollect={true} onCollect={onCollect} />);
      
      const button = screen.getByRole('button', { name: 'Collect' });
      fireEvent.click(button);
      
      expect(screen.getByRole('button', { name: 'Collecting...' })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Collect' })).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Interactions', () => {
    it('calls onSlotClick when slot clicked', () => {
      const onSlotClick = vi.fn();
      render(<ActivityCapsule {...defaultProps} onSlotClick={onSlotClick} />);
      
      const slot1 = screen.getByTestId('slot-1');
      fireEvent.click(slot1);
      
      expect(onSlotClick).toHaveBeenCalledWith('slot-1');
    });

    it('calls onSlotHover when slot hovered', () => {
      const onSlotHover = vi.fn();
      render(<ActivityCapsule {...defaultProps} onSlotHover={onSlotHover} />);
      
      const slot1 = screen.getByTestId('slot-1');
      fireEvent.mouseEnter(slot1);
      expect(onSlotHover).toHaveBeenCalledWith('slot-1', true);
      
      fireEvent.mouseLeave(slot1);
      expect(onSlotHover).toHaveBeenCalledWith('slot-1', false);
    });

    it('calls onActivityClick when capsule clicked', () => {
      const onActivityClick = vi.fn();
      render(<ActivityCapsule {...defaultProps} onActivityClick={onActivityClick} />);
      
      const capsule = screen.getByTestId('activity-capsule');
      fireEvent.click(capsule);
      
      expect(onActivityClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Skin Configuration', () => {
    it('applies wilderness pillar styles by default', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveAttribute('data-pillar', 'wilderness');
    });

    it('applies custom pillar when specified', () => {
      render(<ActivityCapsule {...defaultProps} pillar="empire" />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveAttribute('data-pillar', 'empire');
    });

    it('applies skin config overrides', () => {
      const skinConfigOverride = {
        layout: {
          frameBorder: '2px solid red',
        },
      };
      
      render(<ActivityCapsule {...defaultProps} skinConfigOverride={skinConfigOverride} />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveStyle('--capsule-frame-border: 2px solid red');
    });

    it('applies compact mode styles', () => {
      render(<ActivityCapsule {...defaultProps} compact={true} />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveClass('activity-capsule--compact');
    });
  });

  describe('Telemetry Integration', () => {
    it('sends telemetry event on render', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      expect(trackTelemetryEvent).toHaveBeenCalledWith('activity_capsule_rendered', {
        activityId: 'test-activity',
        status: 'in-progress',
        progressFraction: 0.5,
        slotCount: 2,
        pillar: 'wilderness',
        skinPresetId: 'wanderlust',
        compact: false,
        timestamp: expect.any(Number),
      });
    });

    it('sends telemetry event on slot click', () => {
      render(<ActivityCapsule {...defaultProps} onSlotClick={vi.fn()} />);
      
      const slot1 = screen.getByTestId('slot-1');
      fireEvent.click(slot1);
      
      expect(trackTelemetryEvent).toHaveBeenCalledWith('activity_capsule_slot_click', {
        activityId: 'test-activity',
        slotId: 'slot-1',
        pillar: 'wilderness',
        skinPresetId: 'wanderlust',
        timestamp: expect.any(Number),
      });
    });

    it('sends telemetry event on collect', async () => {
      const onCollect = vi.fn();
      render(<ActivityCapsule {...defaultProps} canCollect={true} onCollect={onCollect} />);
      
      const button = screen.getByRole('button', { name: 'Collect' });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(trackTelemetryEvent).toHaveBeenCalledWith('activity_capsule_collect', {
          activityId: 'test-activity',
          status: 'in-progress',
          pillar: 'wilderness',
          skinPresetId: 'wanderlust',
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label by default', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveAttribute('aria-label', 'Test Activity activity capsule');
    });

    it('uses custom aria-label when provided', () => {
      render(<ActivityCapsule {...defaultProps} ariaLabel="Custom label" />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveAttribute('aria-label', 'Custom label');
    });

    it('sets aria-live when enabled', () => {
      render(<ActivityCapsule {...defaultProps} ariaLive="assertive" />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveAttribute('aria-live', 'assertive');
    });

    it('disables aria-live when skin config disables it', () => {
      const skinConfigOverride = { enableAriaLive: false };
      render(<ActivityCapsule {...defaultProps} skinConfigOverride={skinConfigOverride} />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveAttribute('aria-live', 'off');
    });
  });

  describe('Status Variants', () => {
    it('applies idle status class', () => {
      render(<ActivityCapsule {...defaultProps} status="idle" />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveClass('activity-capsule--idle');
    });

    it('applies in-progress status class', () => {
      render(<ActivityCapsule {...defaultProps} status="in-progress" />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveClass('activity-capsule--in-progress');
    });

    it('applies completed status class', () => {
      render(<ActivityCapsule {...defaultProps} status="completed" />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveClass('activity-capsule--completed');
    });

    it('applies blocked status class', () => {
      render(<ActivityCapsule {...defaultProps} status="blocked" />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveClass('activity-capsule--blocked');
    });
  });

  describe('Data Attributes', () => {
    it('sets all required data attributes', () => {
      render(<ActivityCapsule {...defaultProps} />);
      
      const capsule = screen.getByTestId('activity-capsule');
      expect(capsule).toHaveAttribute('data-activity-id', 'test-activity');
      expect(capsule).toHaveAttribute('data-status', 'in-progress');
      expect(capsule).toHaveAttribute('data-pillar', 'wilderness');
      expect(capsule).toHaveAttribute('data-skin-preset', 'wanderlust');
    });
  });

  describe('Error Handling', () => {
    it('handles missing onCollect gracefully', () => {
      render(<ActivityCapsule {...defaultProps} canCollect={true} />);
      
      const button = screen.getByRole('button', { name: 'Collect' });
      expect(button).toBeInTheDocument();
    });

    it('handles collect errors gracefully', async () => {
      const onCollect = vi.fn(() => Promise.reject(new Error('Collect failed')));
      render(<ActivityCapsule {...defaultProps} canCollect={true} onCollect={onCollect} />);
      
      const button = screen.getByRole('button', { name: 'Collect' });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Collect');
      });
    });
  });
});
