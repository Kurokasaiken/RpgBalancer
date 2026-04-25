/**
 * Assignment Undo Hook - NP-020
 * 
 * React hook for managing assignment undo/redo state and operations.
 * Integrates with the undo engine, keyboard shortcuts, and UI components
 * to provide a complete assignment management solution.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { AssignmentUndoEngine } from '../utils/assignmentUndoEngine';
import { AssignmentKeyboardShortcuts } from '../utils/assignmentKeyboardShortcuts';
import {
  type AssignmentUndoConfig,
  type AssignmentChange,
  type AssignmentState,
  type AssignmentDiffSummary,
  type TimelineEntry,
  AssignmentChangeType,
  generateStateChecksum,
  DEFAULT_ASSIGNMENT_UNDO_CONFIG,
} from '../config/assignmentUndoConfig';

const diagnostics = createSandboxDiagnostics('useAssignmentUndo', 'hook');

/**
 * Props for useAssignmentUndo hook
 */
export interface UseAssignmentUndoProps {
  /** Configuration for undo/redo behavior */
  config?: Partial<AssignmentUndoConfig>;
  /** Current assignment state */
  currentAssignments?: Record<string, string>; // residentId -> activityId
  /** Callback for assignment state changes */
  onAssignmentChange?: (assignments: Record<string, string>) => void;
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Whether to enable persistence */
  enablePersistence?: boolean;
}

/**
 * Assignment undo state and operations
 */
export interface UseAssignmentUndoReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  history: AssignmentChange[];
  currentPosition: number;
  timelineEntries: TimelineEntry[];
  currentDiffSummary?: AssignmentDiffSummary;
  statistics: {
    totalChanges: number;
    currentChangeIndex: number;
    changesByType: Record<AssignmentChangeType, number>;
    sessionDuration: number;
  };
  
  // Actions
  undo: () => AssignmentState | null;
  redo: () => AssignmentState | null;
  addChange: (
    type: AssignmentChangeType,
    description: string,
    previousState: AssignmentState,
    newState: AssignmentState,
    metadata?: Partial<AssignmentChange['metadata']>
  ) => void;
  clearHistory: (reason?: string) => void;
  navigateToTimelineEntry: (entryId: string) => AssignmentState | null;
  
  // Configuration
  updateConfig: (config: Partial<AssignmentUndoConfig>) => void;
  enableShortcuts: () => void;
  disableShortcuts: () => void;
  toggleShortcuts: () => void;
  
  // Utilities
  generateDiffSummary: (change: AssignmentChange) => AssignmentDiffSummary;
  getUndoStack: () => AssignmentChange[];
  getRedoStack: () => AssignmentChange[];
  getCurrentState: () => AssignmentState | null;
}

/**
 * Assignment undo hook
 */
export function useAssignmentUndo({
  config: userConfig,
  currentAssignments = {},
  onAssignmentChange,
  enableKeyboardShortcuts = true,
  enablePersistence = true,
}: UseAssignmentUndoProps = {}): UseAssignmentUndoReturn {
  const config = useMemo(() => ({
    ...DEFAULT_ASSIGNMENT_UNDO_CONFIG,
    ...userConfig,
  }), [userConfig]);

  // Engine and shortcuts instances
  const engineRef = useRef<AssignmentUndoEngine>();
  const shortcutsRef = useRef<AssignmentKeyboardShortcuts>();

  // State
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [history, setHistory] = useState<AssignmentChange[]>([]);
  const [currentPosition, setCurrentPosition] = useState(-1);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [currentDiffSummary, setCurrentDiffSummary] = useState<AssignmentDiffSummary>();
  const [statistics, setStatistics] = useState({
    totalChanges: 0,
    currentChangeIndex: -1,
    changesByType: {} as Record<AssignmentChangeType, number>,
    sessionDuration: 0,
  });

  // Initialize engine and shortcuts
  useEffect(() => {
    // Create undo engine
    engineRef.current = new AssignmentUndoEngine(config);
    
    // Create keyboard shortcuts if enabled
    if (enableKeyboardShortcuts) {
      shortcutsRef.current = new AssignmentKeyboardShortcuts(config);
      setupShortcutListeners();
    }

    // Setup engine event listeners
    setupEngineListeners();

    // Initial state sync
    const currentState = engineRef.current.getCurrentState();
    if (currentState) {
      syncAssignments(currentState.assignments);
    }

    return () => {
      // Cleanup
      engineRef.current?.destroy();
      shortcutsRef.current?.destroy();
    };
  }, [config, enableKeyboardShortcuts]);

  // Setup engine event listeners
  const setupEngineListeners = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Timeline changes
    engine.addEventListener('timeline-changed', ({ position, totalEntries }) => {
      setCurrentPosition(position - 1);
      setCanUndo(engine.canUndo());
      setCanRedo(engine.canRedo());
      setHistory(engine.getHistory());
      setTimelineEntries(engine.generateTimelineEntries());
      setStatistics(engine.getStatistics());
      
      // Update current state
      const currentState = engine.getCurrentState();
      if (currentState) {
        syncAssignments(currentState.assignments);
        
        // Generate diff summary for current change
        if (position > 0 && position <= engine.getHistory().length) {
          const currentChange = engine.getHistory()[position - 1];
          const summary = engine.generateDiffSummary(currentChange);
          setCurrentDiffSummary(summary);
        } else {
          setCurrentDiffSummary(undefined);
        }
      }
    });

    // Undo/redo operations
    engine.addEventListener('undo-performed', ({ newState }) => {
      syncAssignments(newState.assignments);
    });

    engine.addEventListener('redo-performed', ({ newState }) => {
      syncAssignments(newState.assignments);
    });

    // Error handling
    engine.addEventListener('error', ({ error, context }) => {
      diagnostics.error('Undo engine error', { error, context });
    });
  }, []);

  // Setup shortcut listeners
  const setupShortcutListeners = useCallback(() => {
    const shortcuts = shortcutsRef.current;
    if (!shortcuts) return;

    shortcuts.addEventListener('shortcut-triggered', ({ shortcut }) => {
      const engine = engineRef.current;
      if (!engine) return;

      switch (shortcut.action) {
        case 'undo':
          engine.undo();
          break;
        case 'redo':
          engine.redo();
          break;
        case 'clear_history':
          engine.clearHistory('keyboard_shortcut');
          break;
        case 'toggle_timeline':
          // This would typically toggle timeline visibility
          // Implementation depends on UI integration
          break;
      }
    });

    shortcuts.addEventListener('error', ({ error, context }) => {
      diagnostics.error('Keyboard shortcuts error', { error, context });
    });
  }, []);

  // Sync assignments with external state
  const syncAssignments = useCallback((assignments: Record<string, string>) => {
    if (onAssignmentChange) {
      onAssignmentChange(assignments);
    }
  }, [onAssignmentChange]);

  // Track external assignment changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Create current state snapshot
    const currentState: AssignmentState = {
      assignments: currentAssignments,
      activityCapacities: {}, // Would be populated from actual data
      residentAvailability: {}, // Would be populated from actual data
      activityRequirements: {}, // Would be populated from actual data
      timestamp: Date.now(),
      checksum: '',
    };

    currentState.checksum = generateStateChecksum(currentState);

    // Check if state differs from engine state
    const engineState = engine.getCurrentState();
    if (!engineState || JSON.stringify(engineState.assignments) !== JSON.stringify(currentState.assignments)) {
      // This would typically trigger a change detection
      // For now, we'll just update the engine state
      diagnostics.debug('External assignment change detected');
    }
  }, [currentAssignments]);

  // Actions
  const undo = useCallback((): AssignmentState | null => {
    return engineRef.current?.undo() || null;
  }, []);

  const redo = useCallback((): AssignmentState | null => {
    return engineRef.current?.redo() || null;
  }, []);

  const addChange = useCallback((
    type: AssignmentChangeType,
    description: string,
    previousState: AssignmentState,
    newState: AssignmentState,
    metadata?: Partial<AssignmentChange['metadata']>
  ) => {
    engineRef.current?.addChange(type, description, previousState, newState, metadata);
  }, []);

  const clearHistory = useCallback((reason?: string) => {
    engineRef.current?.clearHistory(reason);
  }, []);

  const navigateToTimelineEntry = useCallback((entryId: string): AssignmentState | null => {
    return engineRef.current?.navigateToTimelineEntry(entryId) || null;
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AssignmentUndoConfig>) => {
    engineRef.current?.updateConfig(newConfig);
    shortcutsRef.current?.updateConfig(newConfig);
  }, []);

  const enableShortcuts = useCallback(() => {
    shortcutsRef.current?.enable();
  }, []);

  const disableShortcuts = useCallback(() => {
    shortcutsRef.current?.disable();
  }, []);

  const toggleShortcuts = useCallback(() => {
    shortcutsRef.current?.toggle();
  }, []);

  const generateDiffSummary = useCallback((change: AssignmentChange): AssignmentDiffSummary => {
    return engineRef.current?.generateDiffSummary(change) || {} as AssignmentDiffSummary;
  }, []);

  const getUndoStack = useCallback((): AssignmentChange[] => {
    return engineRef.current?.getUndoStack() || [];
  }, []);

  const getRedoStack = useCallback((): AssignmentChange[] => {
    return engineRef.current?.getRedoStack() || [];
  }, []);

  const getCurrentState = useCallback((): AssignmentState | null => {
    return engineRef.current?.getCurrentState() || null;
  }, []);

  return {
    // State
    canUndo,
    canRedo,
    history,
    currentPosition,
    timelineEntries,
    currentDiffSummary,
    statistics,
    
    // Actions
    undo,
    redo,
    addChange,
    clearHistory,
    navigateToTimelineEntry,
    
    // Configuration
    updateConfig,
    enableShortcuts,
    disableShortcuts,
    toggleShortcuts,
    
    // Utilities
    generateDiffSummary,
    getUndoStack,
    getRedoStack,
    getCurrentState,
  };
}

/**
 * Hook for assignment state management with undo/redo
 */
export function useAssignmentState({
  initialAssignments = {},
  config,
  onAssignmentChange,
}: {
  initialAssignments?: Record<string, string>;
  config?: Partial<AssignmentUndoConfig>;
  onAssignmentChange?: (assignments: Record<string, string>) => void;
} = {}) {
  const [assignments, setAssignments] = useState<Record<string, string>>(initialAssignments);
  const undoRedo = useAssignmentUndo({
    config,
    currentAssignments: assignments,
    onAssignmentChange: setAssignments,
  });

  // Assignment operations with undo/redo tracking
  const assignResident = useCallback((
    residentId: string,
    activityId: string,
    previousActivityId?: string
  ) => {
    const previousState: AssignmentState = {
      assignments: { ...assignments },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    previousState.checksum = generateStateChecksum(previousState);

    const newAssignments = { ...assignments, [residentId]: activityId };
    const newState: AssignmentState = {
      assignments: newAssignments,
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    newState.checksum = generateStateChecksum(newState);

    const description = previousActivityId 
      ? `Moved ${residentId} from ${previousActivityId} to ${activityId}`
      : `Assigned ${residentId} to ${activityId}`;

    const type = previousActivityId 
      ? AssignmentChangeType.RESIDENT_MOVED 
      : AssignmentChangeType.RESIDENT_ASSIGNED;

    undoRedo.addChange(type, description, previousState, newState, {
      affectedResidents: [residentId],
      affectedActivities: previousActivityId ? [previousActivityId, activityId] : [activityId],
    });

    setAssignments(newAssignments);
  }, [assignments, undoRedo]);

  const unassignResident = useCallback((residentId: string, activityId: string) => {
    const previousState: AssignmentState = {
      assignments: { ...assignments },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    previousState.checksum = generateStateChecksum(previousState);

    const newAssignments = { ...assignments };
    delete newAssignments[residentId];
    
    const newState: AssignmentState = {
      assignments: newAssignments,
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    newState.checksum = generateStateChecksum(newState);

    const description = `Unassigned ${residentId} from ${activityId}`;

    undoRedo.addChange(AssignmentChangeType.RESIDENT_UNASSIGNED, description, previousState, newState, {
      affectedResidents: [residentId],
      affectedActivities: [activityId],
    });

    setAssignments(newAssignments);
  }, [assignments, undoRedo]);

  const batchAssign = useCallback((assignments: Record<string, string>) => {
    const previousState: AssignmentState = {
      assignments: { ...assignments },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    previousState.checksum = generateStateChecksum(previousState);

    const newAssignments = { ...assignments, ...assignments };
    const newState: AssignmentState = {
      assignments: newAssignments,
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    newState.checksum = generateStateChecksum(newState);

    const affectedResidents = Object.keys(assignments);
    const affectedActivities = Object.values(assignments);

    undoRedo.addChange(AssignmentChangeType.BATCH_ASSIGNMENT, 
      `Batch assigned ${affectedResidents.length} residents`, 
      previousState, 
      newState, 
      {
        affectedResidents,
        affectedActivities,
      }
    );

    setAssignments(newAssignments);
  }, [assignments, undoRedo]);

  const batchUnassign = useCallback((residentIds: string[]) => {
    const previousState: AssignmentState = {
      assignments: { ...assignments },
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    previousState.checksum = generateStateChecksum(previousState);

    const newAssignments = { ...assignments };
    const affectedActivities: string[] = [];
    
    residentIds.forEach(residentId => {
      if (newAssignments[residentId]) {
        affectedActivities.push(newAssignments[residentId]);
        delete newAssignments[residentId];
      }
    });
    
    const newState: AssignmentState = {
      assignments: newAssignments,
      activityCapacities: {},
      residentAvailability: {},
      activityRequirements: {},
      timestamp: Date.now(),
      checksum: '',
    };
    newState.checksum = generateStateChecksum(newState);

    undoRedo.addChange(AssignmentChangeType.BATCH_UNASSIGNMENT, 
      `Batch unassigned ${residentIds.length} residents`, 
      previousState, 
      newState, 
      {
        affectedResidents: residentIds,
        affectedActivities,
      }
    );

    setAssignments(newAssignments);
  }, [assignments, undoRedo]);

  return {
    assignments,
    assignResident,
    unassignResident,
    batchAssign,
    batchUnassign,
    ...undoRedo,
  };
}
