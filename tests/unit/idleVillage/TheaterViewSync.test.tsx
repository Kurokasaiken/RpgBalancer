/**
 * Theater View Sync Test Suite
 * 
 * Tests for Phase 12 Theater View synchronization with Active HUD.
 * Verifies ActivitySlotMiniCard integration, telemetry events, and parity with map view.
 * 
 * @module TheaterViewSync.test
 * @since 2026-01-11
 * @author Helios-Theater
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TheaterOverlay from '../../../src/ui/idleVillage/components/TheaterOverlay';
import type { ActivitySlotData } from '../../../src/ui/idleVillage/types/ActivitySlotData';
import type { VerbSummary } from '../../../src/ui/idleVillage/verbSummaries';

describe('TheaterViewSync - Phase 12 Integration', () => {
  let mockTheaterSlot: ActivitySlotData;
  let mockVerbs: VerbSummary[];
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnResidentDrop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset telemetry events
    if (typeof window !== 'undefined') {
      window.__theaterTelemetryEvents = [];
      window.__theaterHandlers = undefined;
    }

    mockTheaterSlot = {
      slotId: 'test-slot-1',
      label: 'Test Activity',
      iconName: '⚔️',
      assignedWorkerId: null,
      visualVariant: 'azure',
      activity: {
        id: 'test-activity',
        label: 'Test Activity',
        tags: [],
        slotTags: [],
        resolutionEngineId: 'test',
        durationFormula: '60',
      },
    };

    mockVerbs = [
      {
        key: 'verb-1',
        slotId: 'slot-1',
        label: 'Mining',
        icon: '⛏️',
        visualVariant: 'jade',
        progressFraction: 0.5,
        elapsedSeconds: 30,
        remainingSeconds: 30,
        totalDurationSeconds: 60,
        assigneeNames: ['Worker A'],
      },
      {
        key: 'verb-2',
        slotId: 'slot-2',
        label: 'Crafting',
        icon: '🔨',
        visualVariant: 'ember',
        progressFraction: 0.8,
        elapsedSeconds: 48,
        remainingSeconds: 12,
        totalDurationSeconds: 60,
        assigneeNames: ['Worker B'],
      },
    ];

    mockOnClose = vi.fn();
    mockOnResidentDrop = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ActivitySlotMiniCard Integration', () => {
    it('should render ActivitySlotMiniCard instead of ActivityActionCard', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      // Verify mini cards are rendered
      expect(screen.getByTestId('theater-mini-card-verb-1')).toBeInTheDocument();
      expect(screen.getByTestId('theater-mini-card-verb-2')).toBeInTheDocument();
    });

    it('should display correct progress and status for each verb', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      const card2 = screen.getByTestId('theater-mini-card-verb-2');

      // Verify data attributes
      expect(card1).toHaveAttribute('data-activity-id', 'slot-1');
      expect(card1).toHaveAttribute('data-progress', '0.5');
      expect(card1).toHaveAttribute('data-status', 'running');

      expect(card2).toHaveAttribute('data-activity-id', 'slot-2');
      expect(card2).toHaveAttribute('data-progress', '0.8');
      expect(card2).toHaveAttribute('data-status', 'running');
    });

    it('should use expanded size for theater mini cards', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      expect(card1).toHaveAttribute('data-size', 'expanded');
    });

    it('should display resident names when assigned', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      const card2 = screen.getByTestId('theater-mini-card-verb-2');

      expect(card1).toHaveAttribute('data-resident', 'Worker A');
      expect(card2).toHaveAttribute('data-resident', 'Worker B');
    });
  });

  describe('Telemetry Integration', () => {
    it('should emit theater_opened event when overlay opens', async () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(window.__theaterTelemetryEvents).toBeDefined();
        expect(window.__theaterTelemetryEvents!.length).toBeGreaterThan(0);
      });

      const openEvent = window.__theaterTelemetryEvents!.find(e => e.event === 'theater_opened');
      expect(openEvent).toBeDefined();
      expect(openEvent!.payload.slotId).toBe('test-slot-1');
      expect(openEvent!.payload.slotLabel).toBe('Test Activity');
      expect(openEvent!.payload.verbCount).toBe(2);
    });

    it('should emit theater_slot_selected event when mini card is clicked', async () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      fireEvent.click(card1);

      await waitFor(() => {
        const selectEvent = window.__theaterTelemetryEvents!.find(e => e.event === 'theater_slot_selected');
        expect(selectEvent).toBeDefined();
        expect(selectEvent!.payload.activityKey).toBe('verb-1');
        expect(selectEvent!.payload.residentName).toBe('Worker A');
      });
    });

    it('should emit theater_closed event on ESC key', async () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        const closeEvent = window.__theaterTelemetryEvents!.find(e => e.event === 'theater_closed');
        expect(closeEvent).toBeDefined();
        expect(closeEvent!.payload.slotId).toBe('test-slot-1');
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should setup window handlers for telemetry', async () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(window.__theaterHandlers).toBeDefined();
        expect(window.__theaterHandlers!.handleSlotSelection).toBeDefined();
        expect(window.__theaterHandlers!.handleResidentDrop).toBeDefined();
      });
    });

    it('should emit theater_resident_dropped event on drop', async () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId="resident-1"
          acceptResidentDrop={true}
          onClose={mockOnClose}
          onResidentDrop={mockOnResidentDrop}
        />
      );

      const overlay = screen.getByTestId('theater-overlay');
      
      // Simulate drop event
      fireEvent.drop(overlay, {
        dataTransfer: {
          getData: () => 'resident-1',
        },
      });

      await waitFor(() => {
        const dropEvent = window.__theaterTelemetryEvents!.find(e => e.event === 'theater_resident_dropped');
        expect(dropEvent).toBeDefined();
        expect(dropEvent!.payload.residentId).toBe('resident-1');
        expect(dropEvent!.payload.slotId).toBe('test-slot-1');
        expect(dropEvent!.payload.dropValid).toBe(true);
      });

      expect(mockOnResidentDrop).toHaveBeenCalledWith('resident-1');
    });
  });

  describe('Drop Feedback Parity', () => {
    it('should highlight mini cards when dragging resident', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId="resident-1"
          acceptResidentDrop={true}
          onClose={mockOnClose}
          onResidentDrop={mockOnResidentDrop}
        />
      );

      const overlay = screen.getByTestId('theater-overlay');
      
      // Simulate drag over
      fireEvent.dragOver(overlay);

      // Mini cards should be highlighted when drag is over overlay
      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      expect(card1.className).toContain('ring-2');
    });

    it('should show drop feedback overlay when dragging', () => {
      const { container } = render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId="resident-1"
          acceptResidentDrop={true}
          onClose={mockOnClose}
          onResidentDrop={mockOnResidentDrop}
        />
      );

      const overlay = screen.getByTestId('theater-overlay');
      
      // Simulate drag over
      fireEvent.dragOver(overlay);

      // Verify overlay has drop feedback styling
      expect(overlay.className).toContain('ring-4');
      expect(overlay.className).toContain('ring-amber-300/50');
    });

    it('should not accept drops when acceptResidentDrop is false', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId="resident-1"
          acceptResidentDrop={false}
          onClose={mockOnClose}
          onResidentDrop={mockOnResidentDrop}
        />
      );

      const overlay = screen.getByTestId('theater-overlay');
      
      // Simulate drop event
      fireEvent.drop(overlay, {
        dataTransfer: {
          getData: () => 'resident-1',
        },
      });

      // Drop handler should not be called
      expect(mockOnResidentDrop).not.toHaveBeenCalled();
    });
  });

  describe('Map/Theater Parity', () => {
    it('should use same visual variants as map mini cards', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      const card2 = screen.getByTestId('theater-mini-card-verb-2');

      expect(card1).toHaveAttribute('data-variant', 'jade');
      expect(card2).toHaveAttribute('data-variant', 'ember');
    });

    it('should display same progress calculation as map', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      const card2 = screen.getByTestId('theater-mini-card-verb-2');

      // Progress should be calculated from totalDuration and remainingSeconds
      // verb-1: (60 - 30) / 60 = 0.5
      // verb-2: (60 - 12) / 60 = 0.8
      expect(card1).toHaveAttribute('data-progress', '0.5');
      expect(card2).toHaveAttribute('data-progress', '0.8');
    });

    it('should handle empty verb list gracefully', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={[]}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Nessuna attività disponibile')).toBeInTheDocument();
    });

    it('should handle verbs without assigned residents', () => {
      const verbsWithoutResidents: VerbSummary[] = [
        {
          key: 'verb-3',
          slotId: 'slot-3',
          label: 'Idle Task',
          icon: '💤',
          visualVariant: 'azure',
          progressFraction: 0,
          elapsedSeconds: 0,
          remainingSeconds: 60,
          totalDurationSeconds: 60,
          assigneeNames: [],
        },
      ];

      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={verbsWithoutResidents}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card = screen.getByTestId('theater-mini-card-verb-3');
      expect(card).toHaveAttribute('data-resident', '');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for theater overlay', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByTestId('theater-overlay');
      expect(overlay).toHaveAttribute('role', 'dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
      expect(overlay).toHaveAttribute('aria-label', 'Theater overlay');
    });

    it('should support keyboard navigation for mini cards', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const card1 = screen.getByTestId('theater-mini-card-verb-1');
      
      // Focus should work
      card1.focus();
      expect(document.activeElement).toBe(card1);
    });

    it('should close on ESC key for accessibility', () => {
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should handle large number of verbs efficiently', () => {
      const manyVerbs: VerbSummary[] = Array.from({ length: 50 }, (_, i) => ({
        key: `verb-${i}`,
        slotId: `slot-${i}`,
        label: `Activity ${i}`,
        icon: '⚔️',
        visualVariant: 'azure',
        progressFraction: Math.random(),
        elapsedSeconds: Math.random() * 60,
        remainingSeconds: Math.random() * 60,
        totalDurationSeconds: 60,
        assigneeNames: [`Worker ${i}`],
      }));

      const startTime = performance.now();
      
      render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={manyVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should complete in reasonable time (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should cleanup telemetry handlers on unmount', () => {
      const { unmount } = render(
        <TheaterOverlay
          isOpen={true}
          theaterPrimarySlot={mockTheaterSlot}
          theaterVerbs={mockVerbs}
          draggingResidentId={null}
          onClose={mockOnClose}
        />
      );

      expect(window.__theaterHandlers).toBeDefined();

      unmount();

      expect(window.__theaterHandlers).toBeUndefined();
    });
  });
});
