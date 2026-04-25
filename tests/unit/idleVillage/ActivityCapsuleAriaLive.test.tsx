/**
 * ActivityCapsule ARIA Live Enhancement Tests
 * 
 * Tests for granular ARIA live announcements (progress, slot occupancy)
 * gated by skinConfig.enableAriaLive
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ActivityCapsule, { type ActivityCapsuleProps } from '@/ui/idleVillage/components/ActivityCapsule';
import { StyleLabProvider } from '@/ui/styleLab/StyleLabProvider';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock skin config
vi.mock('@/ui/idleVillage/skins/activityCapsuleSkinConfig', () => ({
  getActivityCapsuleSkinConfig: () => ({
    layout: {
      frameBorder: '#1px solid #ccc',
      frameBackground: '#fff',
      frameBorderRadius: '8px',
      framePadding: '16px',
      frameMinHeight: '120px',
      frameBoxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      slotGridColumns: 3,
      slotGap: '8px',
      slotSize: '40px',
      slotBorderRadius: '4px',
      slotBorder: '1px solid #ddd',
      slotBackground: '#f5f5f5',
      mobileSlotColumns: 2,
      compactSlotSize: '32px',
    },
    progress: {
      progressBackground: '#e0e0e0',
      progressFill: '#4caf50',
      progressBorder: 'none',
      progressHeight: '4px',
      progressBorderRadius: '2px',
      progressTransition: 'width 0.3s ease',
      liquidGoldGradient: 'linear-gradient(90deg, #ffd700, #ffed4e)',
      liquidGoldGlow: '0 0 8px rgba(255,215,0,0.3)',
      liquidGoldShimmer: true,
      shimmerAnimationDuration: '2s',
      timerFont: 'monospace',
      timerColor: '#666',
      timerFontSize: '12px',
    },
    cta: {
      ctaBackground: '#2196f3',
      ctaBorderColor: '#1976d2',
      ctaTextColor: '#fff',
      ctaBorderRadius: '4px',
      ctaPadding: '8px 16px',
      ctaFontSize: '14px',
      ctaFontWeight: '600',
      ctaHoverBackground: '#1976d2',
      ctaHoverBorderColor: '#0d47a1',
      ctaActiveScale: '0.95',
      ctaTransition: 'all 0.2s ease',
      ctaDisabledBackground: '#ccc',
      ctaDisabledTextColor: '#999',
      ctaDisabledOpacity: '0.6',
    },
    animation: {
      entryAnimation: 'fade',
      entryDuration: '0.3s',
      entryEasing: 'ease-out',
      slotHoverScale: '1.05',
      slotHoverGlow: '0 0 12px rgba(33,150,243,0.3)',
      slotHoverTransition: 'transform 0.2s ease',
      collectFeedbackAnimation: 'flash',
    },
    wilderness: {},
    empire: {},
    enableAriaLive: true,
    enableTelemetry: false,
    enableReducedMotion: false,
  }),
  getActivityCapsuleSkinOverrideById: () => ({}),
}));

// Mock POI skin config
vi.mock('@/ui/idleVillage/skins/poi/poiAmberSkinConfig', () => ({
  getPoiAmberSkinConfig: () => ({
    componentId: 'POIComponent',
    name: 'POI Amber Skin',
    description: 'POI visualization skin',
    version: '1.0.0',
    defaultPreset: 'minimal-wilderness',
    supportedPillars: ['wilderness'],
    supportedMotionLevels: ['full'],
    cssClassBase: 'poi-amber',
    dataAttributePrefix: 'data-poi-amber',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    supportsPillarSwitching: true,
    category: 'poi',
    priority: 1,
    tags: ['poi', 'amber', 'wilderness'],
    htmlTemplate: '<div>POI Content</div>',
    cssStyles: '.poi-amber { color: #ff6b35; }',
    colorTokens: {},
    filters: {},
    animation: {},
    particles: {},
    metadata: {
      pillar: 'wilderness',
      styleLabPreset: 'wanderlust',
      notes: 'Test POI skin',
    },
  }),
}));

// Mock temporary skin registry
vi.mock('@/ui/idleVillage/skins/temporary/temporarySkinRegistry', () => ({
  getTemporarySkinConfig: () => null,
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <StyleLabProvider>
      {component}
    </StyleLabProvider>
  );
};

describe('ActivityCapsule ARIA Live Enhancements', () => {
  const defaultProps: ActivityCapsuleProps = {
    activityId: 'test-activity',
    label: 'Test Activity',
    slots: [
      { slotId: 'slot1', isOccupied: false, isLocked: false },
      { slotId: 'slot2', isOccupied: false, isLocked: false },
    ],
    maxSlots: 2,
    progressFraction: 0.5,
    elapsedSeconds: 30,
    totalDurationSeconds: 60,
    status: 'in-progress',
    canCollect: false,
    showSlots: true,
    showProgress: true,
    showTimer: true,
    ariaLive: 'polite',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ARIA Live Region Rendering', () => {
    it('should render ARIA live region when enableAriaLive is true', () => {
      renderWithProvider(<ActivityCapsule {...defaultProps} />);
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should not render ARIA live region when enableAriaLive is false', () => {
      // Mock skin config with aria live disabled
      vi.mocked('@/ui/idleVillage/skins/activityCapsuleSkinConfig').getActivityCapsuleSkinConfig = () => ({
        ...(vi.mocked('@/ui/idleVillage/skins/activityCapsuleSkinConfig').getActivityCapsuleSkinConfig()),
        enableAriaLive: false,
      });

      renderWithProvider(<ActivityCapsule {...defaultProps} />);
      
      const liveRegion = screen.queryByRole('status', { hidden: true });
      expect(liveRegion).not.toBeInTheDocument();
    });

    it('should use custom aria-live mode when provided', () => {
      renderWithProvider(
        <ActivityCapsule {...defaultProps} ariaLive="assertive" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should hide ARIA live region visually but keep it accessible', () => {
      renderWithProvider(<ActivityCapsule {...defaultProps} />);
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toHaveStyle({
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      });
    });
  });

  describe('Status Change Announcements', () => {
    it('should announce when activity starts', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} status="idle" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toBeEmptyDOMElement();
      
      // Change status to in-progress
      rerender(
        <ActivityCapsule {...defaultProps} status="in-progress" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity activity started');
      });
    });

    it('should announce when activity completes', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} status="in-progress" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Change status to completed
      rerender(
        <ActivityCapsule {...defaultProps} status="completed" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity activity completed');
      });
    });

    it('should announce when activity is blocked', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} status="in-progress" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Change status to blocked
      rerender(
        <ActivityCapsule {...defaultProps} status="blocked" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity activity blocked');
      });
    });
  });

  describe('Progress Milestone Announcements', () => {
    it('should announce at 25% progress milestone', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} progressFraction={0.2} status="in-progress" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Update to 25% progress
      rerender(
        <ActivityCapsule {...defaultProps} progressFraction={0.25} status="in-progress" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity progress: 25%');
      });
    });

    it('should announce at 50% progress milestone', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} progressFraction={0.4} status="in-progress" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Update to 50% progress
      rerender(
        <ActivityCapsule {...defaultProps} progressFraction={0.5} status="in-progress" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity progress: 50%');
      });
    });

    it('should announce at 75% progress milestone', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} progressFraction={0.7} status="in-progress" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Update to 75% progress
      rerender(
        <ActivityCapsule {...defaultProps} progressFraction={0.75} status="in-progress" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity progress: 75%');
      });
    });

    it('should announce at 100% progress milestone', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} progressFraction={0.9} status="in-progress" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Update to 100% progress
      rerender(
        <ActivityCapsule {...defaultProps} progressFraction={1.0} status="in-progress" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity progress: 100%');
      });
    });

    it('should not announce progress changes when not in-progress', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} progressFraction={0.2} status="idle" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Update progress while idle
      rerender(
        <ActivityCapsule {...defaultProps} progressFraction={0.5} status="idle" />
      );
      
      // Should not announce progress when idle
      expect(liveRegion).toBeEmptyDOMElement();
    });
  });

  describe('Slot Occupancy Announcements', () => {
    it('should announce when worker is assigned to slot', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule 
          {...defaultProps} 
          slots={[
            { slotId: 'slot1', isOccupied: false, isLocked: false },
            { slotId: 'slot2', isOccupied: false, isLocked: false },
          ]}
        />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Assign worker to slot
      rerender(
        <ActivityCapsule 
          {...defaultProps} 
          slots={[
            { slotId: 'slot1', isOccupied: true, isLocked: false, assignedWorkerName: 'John Doe' },
            { slotId: 'slot2', isOccupied: false, isLocked: false },
          ]}
        />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('1 worker assigned to Test Activity');
      });
    });

    it('should announce when multiple workers are assigned', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule 
          {...defaultProps} 
          slots={[
            { slotId: 'slot1', isOccupied: false, isLocked: false },
            { slotId: 'slot2', isOccupied: false, isLocked: false },
          ]}
        />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Assign workers to both slots
      rerender(
        <ActivityCapsule 
          {...defaultProps} 
          slots={[
            { slotId: 'slot1', isOccupied: true, isLocked: false, assignedWorkerName: 'John Doe' },
            { slotId: 'slot2', isOccupied: true, isLocked: false, assignedWorkerName: 'Jane Smith' },
          ]}
        />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('2 workers assigned to Test Activity');
      });
    });

    it('should announce when slot is freed', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule 
          {...defaultProps} 
          slots={[
            { slotId: 'slot1', isOccupied: true, isLocked: false, assignedWorkerName: 'John Doe' },
            { slotId: 'slot2', isOccupied: false, isLocked: false },
          ]}
        />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Free the slot
      rerender(
        <ActivityCapsule 
          {...defaultProps} 
          slots={[
            { slotId: 'slot1', isOccupied: false, isLocked: false },
            { slotId: 'slot2', isOccupied: false, isLocked: false },
          ]}
        />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('1 slot freed from Test Activity');
      });
    });
  });

  describe('Collect Availability Announcements', () => {
    it('should announce when activity becomes ready to collect', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule 
          {...defaultProps} 
          canCollect={false}
          status="in-progress"
        />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Make ready to collect
      rerender(
        <ActivityCapsule 
          {...defaultProps} 
          canCollect={true}
          status="completed"
        />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity ready to collect');
      });
    });
  });

  describe('Combined Announcements', () => {
    it('should announce multiple changes in sequence', async () => {
      const { rerender } = renderWithProvider(
        <ActivityCapsule 
          {...defaultProps} 
          status="idle"
          slots={[
            { slotId: 'slot1', isOccupied: false, isLocked: false },
            { slotId: 'slot2', isOccupied: false, isLocked: false },
          ]}
        />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Start activity and assign worker
      rerender(
        <ActivityCapsule 
          {...defaultProps} 
          status="in-progress"
          slots={[
            { slotId: 'slot1', isOccupied: true, isLocked: false, assignedWorkerName: 'John Doe' },
            { slotId: 'slot2', isOccupied: false, isLocked: false },
          ]}
        />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity activity started. 1 worker assigned to Test Activity');
      });
    });
  });

  describe('Announcement Cleanup', () => {
    it('should clear announcement after timeout', async () => {
      vi.useFakeTimers();
      
      const { rerender } = renderWithProvider(
        <ActivityCapsule {...defaultProps} status="idle" />
      );
      
      const liveRegion = screen.getByRole('status', { hidden: true });
      
      // Trigger announcement
      rerender(
        <ActivityCapsule {...defaultProps} status="in-progress" />
      );
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Test Activity activity started');
      });
      
      // Fast-forward past 3 second timeout
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(liveRegion).toBeEmptyDOMElement();
      });
      
      vi.useRealTimers();
    });
  });
});
