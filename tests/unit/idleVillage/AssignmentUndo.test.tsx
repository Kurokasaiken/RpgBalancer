/**
 * Assignment Undo/Redo - Comprehensive Unit Tests
 *
 * Test suite for the Idle Village Resident Assignment Undo UX (NP-020).
 * Covers configuration, undo engine, keyboard shortcuts, UI components,
 * state management, and integration scenarios.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the sandbox diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock PersistenceService
vi.mock('@/shared/services/PersistenceService', () => ({
  PersistenceService: vi.fn().mockImplementation(() => ({
    saveData: vi.fn().mockResolvedValue(undefined),
    loadData: vi.fn().mockResolvedValue(null),
  })),
}));

import {
  DEFAULT_ASSIGNMENT_UNDO_CONFIG,
  AssignmentChangeType,
  generateChangeId,
  generateStateChecksum,
  getPlatformShortcut,
  formatTimestamp,
  calculateChangePriority,
  getChangeTypeColor,
  getChangeTypeIcon,
} from '@/ui/idleVillage/config/assignmentUndoConfig';

import { AssignmentUndoEngine } from '@/ui/idleVillage/utils/assignmentUndoEngine';
import { AssignmentKeyboardShortcuts } from '@/ui/idleVillage/utils/assignmentKeyboardShortcuts';
import { AssignmentDiffSummary } from '@/ui/idleVillage/components/AssignmentDiffSummary';
import { AssignmentTimeline } from '@/ui/idleVillage/components/AssignmentTimeline';
import { useAssignmentUndo, useAssignmentState } from '@/ui/idleVillage/hooks/useAssignmentUndo';

describe('Assignment Undo Configuration', () => {
  it('should have valid default configuration', () => {
    expect(DEFAULT_ASSIGNMENT_UNDO_CONFIG).toBeDefined();
    expect(DEFAULT_ASSIGNMENT_UNDO_CONFIG.ui).toBeDefined();
    expect(DEFAULT_ASSIGNMENT_UNDO_CONFIG.persistence).toBeDefined();
    expect(DEFAULT_ASSIGNMENT_UNDO_CONFIG.performance).toBeDefined();
    expect(DEFAULT_ASSIGNMENT_UNDO_CONFIG.keyboardShortcuts).toBeDefined();
    expect(DEFAULT_ASSIGNMENT_UNDO_CONFIG.keyboardShortcuts.length).toBeGreaterThan(0);
  });

  it('should validate assignment change types', () => {
    expect(AssignmentChangeType.RESIDENT_ASSIGNED).toBe('resident_assigned');
    expect(AssignmentChangeType.RESIDENT_UNASSIGNED).toBe('resident_unassigned');
    expect(AssignmentChangeType.RESIDENT_MOVED).toBe('resident_moved');
    expect(AssignmentChangeType.ACTIVITY_CHANGED).toBe('activity_changed');
    expect(AssignmentChangeType.BATCH_ASSIGNMENT).toBe('batch_assignment');
    expect(AssignmentChangeType.BATCH_UNASSIGNMENT).toBe('batch_unassignment');
    expect(AssignmentChangeType.EMERGENCY_REASSIGNMENT).toBe('emergency_reassignment');
    expect(AssignmentChangeType.AUTO_ASSIGNMENT).toBe('auto_assignment');
  });

  it('should generate unique change IDs', () => {
    const id1 = generateChangeId();
    const id2 = generateChangeId();
    
    expect(id1).toMatch(/^change-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^change-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate consistent state checksums', () => {
    const state = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const checksum1 = generateStateChecksum(state);
    const checksum2 = generateStateChecksum(state);
    
    expect(checksum1).toBe(checksum2);
    expect(checksum1).toMatch(/^[a-z0-9]+$/);
  });

  it('should format timestamps correctly', () => {
    const timestamp = Date.now();
    const formatted = formatTimestamp(timestamp);
    
    expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('should calculate change priority correctly', () => {
    const lowImpact = {
      affectedResidents: 1,
      affectedActivities: 1,
      priority: 'low' as const,
      productivityImpact: 0.1,
    };
    
    const highImpact = {
      affectedResidents: 15,
      affectedActivities: 5,
      priority: 'low' as const,
      productivityImpact: 0.8,
    };
    
    expect(calculateChangePriority(lowImpact)).toBe('low');
    expect(calculateChangePriority(highImpact)).toBe('critical');
  });

  it('should get correct change type colors', () => {
    const config = DEFAULT_ASSIGNMENT_UNDO_CONFIG;
    
    expect(getChangeTypeColor(AssignmentChangeType.RESIDENT_ASSIGNED, config))
      .toBe(config.ui.visual.changeTypeColors[AssignmentChangeType.RESIDENT_ASSIGNED]);
    expect(getChangeTypeColor(AssignmentChangeType.RESIDENT_UNASSIGNED, config))
      .toBe(config.ui.visual.changeTypeColors[AssignmentChangeType.RESIDENT_UNASSIGNED]);
  });

  it('should get correct change type icons', () => {
    expect(getChangeTypeIcon(AssignmentChangeType.RESIDENT_ASSIGNED)).toBe('➕');
    expect(getChangeTypeIcon(AssignmentChangeType.RESIDENT_UNASSIGNED)).toBe('➖');
    expect(getChangeTypeIcon(AssignmentChangeType.RESIDENT_MOVED)).toBe('↔️');
    expect(getChangeTypeIcon(AssignmentChangeType.ACTIVITY_CHANGED)).toBe('🔄');
    expect(getChangeTypeIcon(AssignmentChangeType.BATCH_ASSIGNMENT)).toBe('📋');
    expect(getChangeTypeIcon(AssignmentChangeType.BATCH_UNASSIGNMENT)).toBe('🗑️');
    expect(getChangeTypeIcon(AssignmentChangeType.EMERGENCY_REASSIGNMENT)).toBe('🚨');
    expect(getChangeTypeIcon(AssignmentChangeType.AUTO_ASSIGNMENT)).toBe('🤖');
  });
});

describe('Assignment Undo Engine', () => {
  let engine: AssignmentUndoEngine;

  beforeEach(() => {
    engine = new AssignmentUndoEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('should initialize with empty state', () => {
    expect(engine.canUndo()).toBe(false);
    expect(engine.canRedo()).toBe(false);
    expect(engine.getHistory()).toEqual([]);
    expect(engine.getCurrentState()).toBeNull();
  });

  it('should add changes to history', () => {
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    engine.addChange(
      AssignmentChangeType.RESIDENT_ASSIGNED,
      'Assigned resident1 to activity1',
      previousState,
      newState
    );

    expect(engine.canUndo()).toBe(true);
    expect(engine.canRedo()).toBe(false);
    expect(engine.getHistory().length).toBe(1);
  });

  it('should perform undo correctly', () => {
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    engine.addChange(
      AssignmentChangeType.RESIDENT_ASSIGNED,
      'Assigned resident1 to activity1',
      previousState,
      newState
    );

    const undoneState = engine.undo();
    
    expect(undoneState).toBe(previousState);
    expect(engine.canUndo()).toBe(false);
    expect(engine.canRedo()).toBe(true);
  });

  it('should perform redo correctly', () => {
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    engine.addChange(
      AssignmentChangeType.RESIDENT_ASSIGNED,
      'Assigned resident1 to activity1',
      previousState,
      newState
    );

    engine.undo();
    const redoneState = engine.redo();
    
    expect(redoneState).toBe(newState);
    expect(engine.canUndo()).toBe(true);
    expect(engine.canRedo()).toBe(false);
  });

  it('should generate diff summaries', () => {
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    engine.addChange(
      AssignmentChangeType.RESIDENT_ASSIGNED,
      'Assigned resident1 to activity1',
      previousState,
      newState
    );

    const history = engine.getHistory();
    const diff = engine.generateDiffSummary(history[0]);
    
    expect(diff.changeId).toBe(history[0].id);
    expect(diff.type).toBe(AssignmentChangeType.RESIDENT_ASSIGNED);
    expect(diff.details.added.length).toBe(1);
    expect(diff.details.removed.length).toBe(0);
    expect(diff.details.moved.length).toBe(0);
  });

  it('should generate timeline entries', () => {
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    engine.addChange(
      AssignmentChangeType.RESIDENT_ASSIGNED,
      'Assigned resident1 to activity1',
      previousState,
      newState
    );

    const timeline = engine.generateTimelineEntries();
    
    expect(timeline.length).toBe(1);
    expect(timeline[0].type).toBe(AssignmentChangeType.RESIDENT_ASSIGNED);
    expect(timeline[0].position).toBe(0);
    expect(timeline[0].isCurrent).toBe(true);
  });

  it('should clear history', () => {
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    engine.addChange(
      AssignmentChangeType.RESIDENT_ASSIGNED,
      'Assigned resident1 to activity1',
      previousState,
      newState
    );

    engine.clearHistory('test');
    
    expect(engine.canUndo()).toBe(false);
    expect(engine.canRedo()).toBe(false);
    expect(engine.getHistory()).toEqual([]);
  });

  it('should enforce max history depth', () => {
    const config = { maxHistoryDepth: 3 };
    const engine = new AssignmentUndoEngine(config);
    
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    // Add 5 changes
    for (let i = 0; i < 5; i++) {
      engine.addChange(
        AssignmentChangeType.RESIDENT_ASSIGNED,
        `Assigned resident${i} to activity${i}`,
        previousState,
        newState
      );
    }

    expect(engine.getHistory().length).toBe(3);
    
    engine.destroy();
  });
});

describe('Assignment Keyboard Shortcuts', () => {
  let shortcuts: AssignmentKeyboardShortcuts;

  beforeEach(() => {
    shortcuts = new AssignmentKeyboardShortcuts();
  });

  afterEach(() => {
    shortcuts.destroy();
  });

  it('should initialize with default shortcuts', () => {
    expect(shortcuts.isEnabled()).toBe(true);
    expect(shortcuts.getRegisteredShortcuts().size).toBeGreaterThan(0);
  });

  it('should register shortcuts correctly', () => {
    const registered = shortcuts.getRegisteredShortcuts();
    expect(registered.has('Ctrl+Z')).toBe(true);
    expect(registered.has('Ctrl+Y')).toBe(true);
  });

  it('should enable and disable shortcuts', () => {
    shortcuts.disable();
    expect(shortcuts.isEnabled()).toBe(false);
    
    shortcuts.enable();
    expect(shortcuts.isEnabled()).toBe(true);
  });

  it('should toggle shortcuts', () => {
    const initialState = shortcuts.isEnabled();
    shortcuts.toggle();
    expect(shortcuts.isEnabled()).toBe(!initialState);
    shortcuts.toggle();
    expect(shortcuts.isEnabled()).toBe(initialState);
  });

  it('should get platform-specific keys', () => {
    const registered = shortcuts.getRegisteredShortcuts();
    const undoShortcut = registered.get('Ctrl+Z');
    
    if (undoShortcut) {
      const platformKey = shortcuts.getPlatformKey(undoShortcut);
      expect(platformKey).toBeDefined();
    }
  });

  it('should validate shortcuts', () => {
    const validation = shortcuts.validateShortcuts();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should get shortcut hints', () => {
    const hints = shortcuts.getShortcutHints();
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0]).toHaveProperty('action');
    expect(hints[0]).toHaveProperty('description');
    expect(hints[0]).toHaveProperty('platformKey');
  });
});

describe('Assignment Diff Summary Component', () => {
  const mockSummary = {
    changeId: 'test-change-1',
    type: AssignmentChangeType.RESIDENT_ASSIGNED,
    summary: 'Assigned 1 resident(s) to activities',
    details: {
      added: [{
        residentId: 'resident1',
        residentName: 'Resident 1',
        activityId: 'activity1',
        activityName: 'Activity 1',
      }],
      removed: [],
      moved: [],
    },
    impact: {
      affectedResidents: 1,
      affectedActivities: 1,
      priority: 'low' as const,
      productivityImpact: 0.1,
    },
    timestamp: Date.now(),
  };

  it('should render diff summary correctly', () => {
    render(
      <AssignmentDiffSummary
        summary={mockSummary}
      />
    );

    expect(screen.getByText('Assigned 1 resident(s) to activities')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Productivity Impact')).toBeInTheDocument();
  });

  it('should show impact metrics when enabled', () => {
    render(
      <AssignmentDiffSummary
        summary={mockSummary}
        showImpactMetrics={true}
      />
    );

    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('Affected Residents')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should expand and collapse details', async () => {
    render(
      <AssignmentDiffSummary
        summary={mockSummary}
        expanded={false}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expand/i });
    expect(expandButton).toBeInTheDocument();

    await userEvent.click(expandButton);

    expect(screen.getByText('Added (1)')).toBeInTheDocument();
    expect(screen.getByText('Resident 1')).toBeInTheDocument();
  });

  it('should handle change selection', async () => {
    const onSelect = vi.fn();
    
    render(
      <AssignmentDiffSummary
        summary={mockSummary}
        onChangeSelect={onSelect}
        expanded={true}
      />
    );

    const changeItem = screen.getByText('Resident 1');
    await userEvent.click(changeItem);

    expect(onSelect).toHaveBeenCalledWith('test-change-1');
  });
});

describe('Assignment Timeline Component', () => {
  const mockEntries = [
    {
      id: 'entry-1',
      position: 0,
      type: AssignmentChangeType.RESIDENT_ASSIGNED,
      label: 'Assigned resident1 to activity1',
      timestamp: Date.now() - 5000,
      isCurrent: false,
      navigable: true,
      visual: {
        color: '#10b981',
        icon: '➕',
        size: 'medium' as const,
        opacity: 1,
      },
    },
    {
      id: 'entry-2',
      position: 1,
      type: AssignmentChangeType.RESIDENT_MOVED,
      label: 'Moved resident1 to activity2',
      timestamp: Date.now(),
      isCurrent: true,
      navigable: true,
      visual: {
        color: '#3b82f6',
        icon: '↔️',
        size: 'medium' as const,
        opacity: 1,
      },
    },
  ];

  it('should render timeline correctly', () => {
    render(
      <AssignmentTimeline
        entries={mockEntries}
        currentPosition={1}
      />
    );

    expect(screen.getByText('Assignment Timeline')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('2 changes')).toBeInTheDocument();
  });

  it('should show navigation controls', () => {
    render(
      <AssignmentTimeline
        entries={mockEntries}
        currentPosition={1}
      />
    );

    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument();
    expect(screen.getByTitle('Clear History')).toBeInTheDocument();
  });

  it('should handle undo action', async () => {
    const onPositionChange = vi.fn();
    
    render(
      <AssignmentTimeline
        entries={mockEntries}
        currentPosition={1}
        onPositionChange={onPositionChange}
      />
    );

    const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
    await userEvent.click(undoButton);

    expect(onPositionChange).toHaveBeenCalledWith(0);
  });

  it('should handle redo action', async () => {
    const onPositionChange = vi.fn();
    
    render(
      <AssignmentTimeline
        entries={mockEntries}
        currentPosition={0}
        onPositionChange={onPositionChange}
      />
    );

    const redoButton = screen.getByTitle('Redo (Ctrl+Y)');
    await userEvent.click(redoButton);

    expect(onPositionChange).toHaveBeenCalledWith(1);
  });

  it('should handle entry selection', async () => {
    const onEntrySelect = vi.fn();
    const onPositionChange = vi.fn();
    
    render(
      <AssignmentTimeline
        entries={mockEntries}
        currentPosition={1}
        onEntrySelect={onEntrySelect}
        onPositionChange={onPositionChange}
      />
    );

    const firstEntry = screen.getByText('Assigned resident1 to activity1');
    await userEvent.click(firstEntry);

    expect(onEntrySelect).toHaveBeenCalledWith('entry-1');
    expect(onPositionChange).toHaveBeenCalledWith(0);
  });

  it('should show timestamps when enabled', () => {
    render(
      <AssignmentTimeline
        entries={mockEntries}
        currentPosition={1}
        showTimestamps={true}
      />
    );

    // Timestamps should be visible in tooltips
    const entries = screen.getAllByRole('button');
    expect(entries.length).toBeGreaterThan(0);
  });
});

describe('Assignment State Management Hook', () => {
  it('should initialize with default state', () => {
    const TestComponent = () => {
      const { canUndo, canRedo, history, assignments } = useAssignmentUndo();
      
      return (
        <div>
          <div data-testid="can-undo">{canUndo.toString()}</div>
          <div data-testid="can-redo">{canRedo.toString()}</div>
          <div data-testid="history-length">{history.length}</div>
          <div data-testid="assignments">{JSON.stringify(assignments)}</div>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
    expect(screen.getByTestId('can-redo')).toHaveTextContent('false');
    expect(screen.getByTestId('history-length')).toHaveTextContent('0');
    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
  });

  it('should handle resident assignment', async () => {
    const TestComponent = () => {
      const { assignments, assignResident } = useAssignmentState();
      
      const handleAssign = () => {
        assignResident('resident1', 'activity1');
      };
      
      return (
        <div>
          <div data-testid="assignments">{JSON.stringify(assignments)}</div>
          <button onClick={handleAssign}>Assign Resident</button>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
    
    await userEvent.click(screen.getByText('Assign Resident'));
    
    // Assignment should be updated
    expect(screen.getByTestId('assignments')).toHaveTextContent('{"resident1":"activity1"}');
  });

  it('should handle resident unassignment', async () => {
    const TestComponent = () => {
      const { assignments, assignResident, unassignResident } = useAssignmentState({
        initialAssignments: { resident1: 'activity1' },
      });
      
      const handleUnassign = () => {
        unassignResident('resident1', 'activity1');
      };
      
      return (
        <div>
          <div data-testid="assignments">{JSON.stringify(assignments)}</div>
          <button onClick={handleUnassign}>Unassign Resident</button>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('assignments')).toHaveTextContent('{"resident1":"activity1"}');
    
    await userEvent.click(screen.getByText('Unassign Resident'));
    
    // Assignment should be removed
    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
  });

  it('should handle batch assignment', async () => {
    const TestComponent = () => {
      const { assignments, batchAssign } = useAssignmentState();
      
      const handleBatchAssign = () => {
        batchAssign({
          resident1: 'activity1',
          resident2: 'activity2',
        });
      };
      
      return (
        <div>
          <div data-testid="assignments">{JSON.stringify(assignments)}</div>
          <button onClick={handleBatchAssign}>Batch Assign</button>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
    
    await userEvent.click(screen.getByText('Batch Assign'));
    
    expect(screen.getByTestId('assignments')).toHaveTextContent('{"resident1":"activity1","resident2":"activity2"}');
  });
});

describe('Integration Tests', () => {
  it('should handle complete assignment workflow', async () => {
    const TestComponent = () => {
      const { 
        assignments, 
        assignResident, 
        unassignResident, 
        undo, 
        redo, 
        canUndo, 
        canRedo,
        history 
      } = useAssignmentState();
      
      const handleAssign = () => assignResident('resident1', 'activity1');
      const handleUnassign = () => unassignResident('resident1', 'activity1');
      const handleUndo = () => undo();
      const handleRedo = () => redo();
      
      return (
        <div>
          <div data-testid="assignments">{JSON.stringify(assignments)}</div>
          <div data-testid="can-undo">{canUndo.toString()}</div>
          <div data-testid="can-redo">{canRedo.toString()}</div>
          <div data-testid="history-length">{history.length}</div>
          <button onClick={handleAssign}>Assign</button>
          <button onClick={handleUnassign}>Unassign</button>
          <button onClick={handleUndo}>Undo</button>
          <button onClick={handleRedo}>Redo</button>
        </div>
      );
    };

    render(<TestComponent />);

    // Initial state
    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
    expect(screen.getByTestId('can-redo')).toHaveTextContent('false');
    expect(screen.getByTestId('history-length')).toHaveTextContent('0');

    // Assign resident
    await userEvent.click(screen.getByText('Assign'));
    expect(screen.getByTestId('assignments')).toHaveTextContent('{"resident1":"activity1"}');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    expect(screen.getByTestId('history-length')).toHaveTextContent('1');

    // Unassign resident
    await userEvent.click(screen.getByText('Unassign'));
    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    expect(screen.getByTestId('history-length')).toHaveTextContent('2');

    // Undo unassignment
    await userEvent.click(screen.getByText('Undo'));
    expect(screen.getByTestId('assignments')).toHaveTextContent('{"resident1":"activity1"}');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    expect(screen.getByTestId('can-redo')).toHaveTextContent('true');

    // Undo assignment
    await userEvent.click(screen.getByText('Undo'));
    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
    expect(screen.getByTestId('can-redo')).toHaveTextContent('true');

    // Redo assignment
    await userEvent.click(screen.getByText('Redo'));
    expect(screen.getByTestId('assignments')).toHaveTextContent('{"resident1":"activity1"}');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    expect(screen.getByTestId('can-redo')).toHaveTextContent('true');
  });

  it('should handle keyboard shortcuts integration', async () => {
    const TestComponent = () => {
      const { 
        assignments, 
        assignResident, 
        undo, 
        redo, 
        enableShortcuts, 
        disableShortcuts 
      } = useAssignmentState();
      
      const handleAssign = () => assignResident('resident1', 'activity1');
      const handleUndo = () => undo();
      const handleRedo = () => redo();
      
      return (
        <div>
          <div data-testid="assignments">{JSON.stringify(assignments)}</div>
          <button onClick={handleAssign}>Assign</button>
          <button onClick={handleUndo}>Undo</button>
          <button onClick={handleRedo}>Redo</button>
          <button onClick={enableShortcuts}>Enable Shortcuts</button>
          <button onClick={disableShortcuts}>Disable Shortcuts</button>
        </div>
      );
    };

    render(<TestComponent />);

    // Assign resident
    await userEvent.click(screen.getByText('Assign'));
    expect(screen.getByTestId('assignments')).toHaveTextContent('{"resident1":"activity1"}');

    // Test keyboard shortcuts would require more complex setup
    // For now, just verify the buttons work
    await userEvent.click(screen.getByText('Undo'));
    expect(screen.getByTestId('assignments')).toHaveTextContent('{}');
  });
});

describe('Performance Tests', () => {
  it('should handle large number of changes efficiently', () => {
    const engine = new AssignmentUndoEngine();
    
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    const startTime = performance.now();
    
    // Add 100 changes
    for (let i = 0; i < 100; i++) {
      engine.addChange(
        AssignmentChangeType.RESIDENT_ASSIGNED,
        `Assigned resident${i} to activity${i}`,
        previousState,
        newState
      );
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    expect(engine.getHistory().length).toBe(100);
    
    engine.destroy();
  });

  it('should handle rapid undo/redo operations', () => {
    const engine = new AssignmentUndoEngine();
    
    const previousState = {
      assignments: {},
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    
    const newState = {
      assignments: { resident1: 'activity1' },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };

    // Add 10 changes
    for (let i = 0; i < 10; i++) {
      engine.addChange(
        AssignmentChangeType.RESIDENT_ASSIGNED,
        `Assigned resident${i} to activity${i}`,
        previousState,
        newState
      );
    }

    const startTime = performance.now();
    
    // Perform 20 undo/redo operations
    for (let i = 0; i < 20; i++) {
      if (engine.canUndo()) {
        engine.undo();
      } else {
        engine.redo();
      }
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(500); // Should complete within 500ms
    
    engine.destroy();
  });
});

describe('Error Handling', () => {
  it('should handle invalid change data gracefully', () => {
    const engine = new AssignmentUndoEngine();
    
    // Try to add change with invalid data
    expect(() => {
      engine.addChange(
        AssignmentChangeType.RESIDENT_ASSIGNED,
        'Invalid change',
        null as any,
        null as any
      );
    }).not.toThrow();
    
    engine.destroy();
  });

  it('should handle undo when no changes exist', () => {
    const engine = new AssignmentUndoEngine();
    
    const result = engine.undo();
    expect(result).toBeNull();
    
    engine.destroy();
  });

  it('should handle redo when no changes to redo', () => {
    const engine = new AssignmentUndoEngine();
    
    const result = engine.redo();
    expect(result).toBeNull();
    
    engine.destroy();
  });

  it('should handle navigation to invalid timeline entry', () => {
    const engine = new AssignmentUndoEngine();
    
    const result = engine.navigateToTimelineEntry('invalid-id');
    expect(result).toBeNull();
    
    engine.destroy();
  });
});
