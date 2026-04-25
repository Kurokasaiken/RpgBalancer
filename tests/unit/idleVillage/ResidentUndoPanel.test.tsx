/**
 * Resident Undo Panel Tests - NP-020
 * 
 * React Testing Library tests for the Resident Undo Panel component.
 * Tests panel rendering, timeline display, controls, and interactions.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the config before any imports that use it
vi.mock('../../../src/ui/idleVillage/config/residentUndoConfig', () => ({
  DEFAULT_RESIDENT_UNDO_CONFIG: {
    timeline: {
      maxItems: 50,
      itemHeight: 40,
      timelineWidth: 400,
      animationDuration: 300,
      showTimestamps: true,
      showBadges: true,
      compactMode: false,
      autoCollapse: false,
      collapseTimeout: 5000,
    },
    shortcuts: {
      enabled: true,
      customMappings: {},
      showHints: true,
      debounceTime: 100,
      preventInInputs: true,
    },
    badges: {
      colors: {
        SUCCESS: 'rgb(34, 197, 94)',
        WARNING: 'rgb(251, 191, 36)',
        ERROR: 'rgb(239, 68, 68)',
        INFO: 'rgb(59, 130, 246)',
        NEUTRAL: 'rgb(107, 114, 128)',
      },
      size: 16,
      borderRadius: 4,
      showIcons: true,
      icons: {
        SUCCESS: '✓',
        WARNING: '⚠',
        ERROR: '✕',
        INFO: 'ℹ',
        NEUTRAL: '•',
      },
    },
    storage: {
      keyPrefix: 'idle-village-resident-undo',
      maxStorageSize: 1048576,
      retentionDays: 7,
      compressData: true,
      autoCleanup: true,
      cleanupInterval: 24,
    },
    panel: {
      panelWidth: 450,
      panelHeight: 500,
      position: 'right',
      showHeader: true,
      showFooter: true,
      resizable: true,
      draggable: true,
      showCloseButton: true,
      autoHide: false,
      autoHideTimeout: 3000,
    },
    enableTelemetry: true,
    debugMode: false,
  },
  formatShortcut: (shortcut: string) => {
    const parts = shortcut.split('+');
    const formatted = parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' + ');
    return formatted;
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResidentUndoPanel } from '../../../src/ui/idleVillage/components/ResidentUndoPanel';
import type { UndoAction, UndoStackState } from '../../../src/ui/idleVillage/hooks/useResidentUndo';
import type { ResidentUndoConfig } from '../../../src/ui/idleVillage/config/residentUndoConfig';
import {
  UNDO_BADGE_TYPES,
} from '../../../src/ui/idleVillage/config/residentUndoConfig';
import { DEFAULT_RESIDENT_UNDO_CONFIG } from '../../../src/ui/idleVillage/config/residentUndoConfig';

describe('ResidentUndoPanel', () => {
  const mockUndoAction: UndoAction = {
    id: 'undo-1',
    type: 'assign',
    timestamp: Date.now(),
    residentId: 'resident-1',
    activityId: 'activity-1',
    previousState: {
      residentId: 'resident-1',
      activityId: undefined,
    },
    newState: {
      residentId: 'resident-1',
      activityId: 'activity-1',
    },
    success: true,
    hasWarnings: false,
    description: 'Assigned resident to activity',
    badgeType: UNDO_BADGE_TYPES.SUCCESS,
  };

  const mockRedoAction: UndoAction = {
    id: 'redo-1',
    type: 'unassign',
    timestamp: Date.now() - 1000,
    residentId: 'resident-2',
    activityId: 'activity-2',
    previousState: {
      residentId: 'resident-2',
      activityId: 'activity-2',
    },
    newState: {
      residentId: 'resident-2',
      activityId: undefined,
    },
    success: true,
    hasWarnings: false,
    description: 'Unassigned resident from activity',
    badgeType: UNDO_BADGE_TYPES.NEUTRAL,
  };

  const mockStackState: UndoStackState = {
    undoStack: [mockUndoAction],
    redoStack: [mockRedoAction],
    currentSize: 2,
    maxSize: 50,
  };

  const mockOnUndo = vi.fn();
  const mockOnRedo = vi.fn();
  const mockOnClearHistory = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnExport = vi.fn();
  const mockOnImport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders panel with basic information', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Undo History')).toBeInTheDocument();
      expect(screen.getByText('2 actions in history')).toBeInTheDocument();
    });
  });

  it('displays undo and redo controls', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  it('disables controls when not available', async () => {
    render(
      <ResidentUndoPanel
        stackState={{ undoStack: [], redoStack: [], currentSize: 0, maxSize: 50 }}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={false}
        canRedo={false}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      const undoButton = screen.getByText('Undo');
      const redoButton = screen.getByText('Redo');
      const clearButton = screen.getByText('Clear');

      expect(undoButton).toBeDisabled();
      expect(redoButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
  });

  it('calls callbacks when controls are clicked', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('Undo'));
      expect(mockOnUndo).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Redo'));
      expect(mockOnRedo).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Clear'));
      expect(mockOnClearHistory).toHaveBeenCalledTimes(1);
    });
  });

  it('displays timeline with actions', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Assigned resident to activity')).toBeInTheDocument();
      expect(screen.getByText('Unassigned resident from activity')).toBeInTheDocument();
    });
  });

  it('displays empty state when no actions', async () => {
    render(
      <ResidentUndoPanel
        stackState={{ undoStack: [], redoStack: [], currentSize: 0, maxSize: 50 }}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={false}
        canRedo={false}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No actions in history')).toBeInTheDocument();
      expect(screen.getByText('Actions will appear here as you make changes')).toBeInTheDocument();
    });
  });

  it('displays action badges correctly', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('SUCCESS')).toBeInTheDocument();
      expect(screen.getByText('NEUTRAL')).toBeInTheDocument();
    });
  });

  it('displays timestamps when enabled', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      // Should show timestamps
      const timestamps = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  it('displays keyboard shortcuts when enabled', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();
      expect(screen.getByText('Batch Undo')).toBeInTheDocument();
      expect(screen.getByText('Clear History')).toBeInTheDocument();
      expect(screen.getByText('Toggle Panel')).toBeInTheDocument();
    });
  });

  it('displays footer with statistics', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Undo: 1')).toBeInTheDocument();
      expect(screen.getByText('Redo: 1')).toBeInTheDocument();
      expect(screen.getByText('Max: 50')).toBeInTheDocument();
    });
  });

  it('calls close callback when close button is clicked', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByTitle('Close panel');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls export callback when export button is clicked', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('Export'));
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });
  });

  it('handles file import when import button is clicked', async () => {
    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      result: '{"test": "data"}',
      onload: null as any,
    };
    global.FileReader = vi.fn(() => mockFileReader) as any;

    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);
      
      // Should create file input and trigger click
      expect(mockOnImport).not.toHaveBeenCalled();
    });
  });

  it('applies custom CSS classes', async () => {
    const customClass = 'custom-undo-panel';

    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
        className={customClass}
      />
    );

    await waitFor(() => {
      const panel = screen.getByTestId('resident-undo-panel');
      expect(panel).toHaveClass(customClass);
    });
  });

  it('displays action details correctly', async () => {
    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Resident: resident-1')).toBeInTheDocument();
      expect(screen.getByText('Activity: activity-1')).toBeInTheDocument();
      expect(screen.getByText('Success: ✓')).toBeInTheDocument();
    });
  });

  it('handles actions without activity ID', async () => {
    const actionWithoutActivity = {
      ...mockUndoAction,
      activityId: undefined,
    };

    const stackStateWithoutActivity = {
      undoStack: [actionWithoutActivity],
      redoStack: [],
      currentSize: 1,
      maxSize: 50,
    };

    render(
      <ResidentUndoPanel
        stackState={stackStateWithoutActivity}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={false}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Resident: resident-1')).toBeInTheDocument();
      expect(screen.queryByText('Activity:')).not.toBeInTheDocument();
    });
  });

  it('displays warnings for actions with warnings', async () => {
    const actionWithWarnings = {
      ...mockUndoAction,
      hasWarnings: true,
    };

    const stackStateWithWarnings = {
      undoStack: [actionWithWarnings],
      redoStack: [],
      currentSize: 1,
      maxSize: 50,
    };

    render(
      <ResidentUndoPanel
        stackState={stackStateWithWarnings}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={false}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('⚠ Warnings')).toBeInTheDocument();
    });
  });

  it('displays failed actions correctly', async () => {
    const failedAction = {
      ...mockUndoAction,
      success: false,
      badgeType: UNDO_BADGE_TYPES.ERROR,
    };

    const stackStateWithFailure = {
      undoStack: [failedAction],
      redoStack: [],
      currentSize: 1,
      maxSize: 50,
    };

    render(
      <ResidentUndoPanel
        stackState={stackStateWithFailure}
        config={DEFAULT_RESIDENT_UNDO_CONFIG}
        canUndo={true}
        canRedo={false}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ERROR')).toBeInTheDocument();
      expect(screen.getByText('Success: ✗')).toBeInTheDocument();
    });
  });

  it('limits timeline items to maxItems', async () => {
    const manyActions = Array.from({ length: 10 }, (_, i) => ({
      ...mockUndoAction,
      id: `undo-${i}`,
      timestamp: Date.now() - i * 1000,
    }));

    const stackStateWithMany = {
      undoStack: manyActions,
      redoStack: [],
      currentSize: 10,
      maxSize: 5, // Limit to 5 items
    };

    const configWithLimit = {
      ...DEFAULT_RESIDENT_UNDO_CONFIG,
      timeline: {
        ...DEFAULT_RESIDENT_UNDO_CONFIG.timeline,
        maxItems: 5,
      },
    };

    render(
      <ResidentUndoPanel
        stackState={stackStateWithMany}
        config={configWithLimit}
        canUndo={true}
        canRedo={false}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      const timelineItems = screen.getAllByText(/Assigned resident to activity/);
      expect(timelineItems.length).toBeLessThanOrEqual(5);
    });
  });

  it('hides header when showHeader is false', async () => {
    const configWithoutHeader = {
      ...DEFAULT_RESIDENT_UNDO_CONFIG,
      panel: {
        ...DEFAULT_RESIDENT_UNDO_CONFIG.panel,
        showHeader: false,
      },
    };

    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={configWithoutHeader}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Undo History')).not.toBeInTheDocument();
      expect(screen.queryByText('2 actions in history')).not.toBeInTheDocument();
    });
  });

  it('hides footer when showFooter is false', async () => {
    const configWithoutFooter = {
      ...DEFAULT_RESIDENT_UNDO_CONFIG,
      panel: {
        ...DEFAULT_RESIDENT_UNDO_CONFIG.panel,
        showFooter: false,
      },
    };

    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={configWithoutFooter}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Undo: 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Redo: 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Max: 50')).not.toBeInTheDocument();
    });
  });

  it('hides keyboard shortcuts when showHints is false', async () => {
    const configWithoutHints = {
      ...DEFAULT_RESIDENT_UNDO_CONFIG,
      shortcuts: {
        ...DEFAULT_RESIDENT_UNDO_CONFIG.shortcuts,
        showHints: false,
      },
    };

    render(
      <ResidentUndoPanel
        stackState={mockStackState}
        config={configWithoutHints}
        canUndo={true}
        canRedo={true}
        onUndo={mockOnUndo}
        onRedo={mockOnRedo}
        onClearHistory={mockOnClearHistory}
        onClose={mockOnClose}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
      expect(screen.queryByText('Ctrl + Z')).not.toBeInTheDocument();
    });
  });
});
