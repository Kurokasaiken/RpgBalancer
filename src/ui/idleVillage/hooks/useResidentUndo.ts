/**
 * Resident Undo Hook - NP-020
 * 
 * Hook for managing resident assignment undo/redo functionality.
 * Provides stack-based undo/redo with PersistenceService integration.
 * Follows config-first design with comprehensive telemetry tracking.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type {
  ResidentUndoConfig,
  UndoActionType,
  UndoBadgeType,
} from '../config/residentUndoConfig';
import {
  createResidentUndoConfig,
  getUndoBadgeType,
  getUndoActionLabel,
} from '../config/residentUndoConfig';

const diagnostics = createSandboxDiagnostics('useResidentUndo', 'hook');

/**
 * Undo action entry in the stack
 */
export interface UndoAction {
  /** Unique action identifier */
  id: string;
  /** Action type */
  type: UndoActionType;
  /** Action timestamp */
  timestamp: number;
  /** Resident ID affected */
  residentId: string;
  /** Activity ID affected */
  activityId?: string;
  /** Previous state before action */
  previousState: {
    residentId?: string;
    activityId?: string;
    priority?: number;
    status?: string;
  };
  /** New state after action */
  newState: {
    residentId?: string;
    activityId?: string;
    priority?: number;
    status?: string;
  };
  /** Whether action was successful */
  success: boolean;
  /** Whether action has warnings */
  hasWarnings: boolean;
  /** Action description for display */
  description: string;
  /** Badge type for timeline display */
  badgeType: UndoBadgeType;
}

/**
 * Undo/Redo stack state
 */
export interface UndoStackState {
  /** Undo stack (actions that can be undone) */
  undoStack: UndoAction[];
  /** Redo stack (actions that can be redone) */
  redoStack: UndoAction[];
  /** Current stack size */
  currentSize: number;
  /** Maximum stack size */
  maxSize: number;
}

/**
 * Hook return value
 */
export interface UseResidentUndoReturn {
  /** Current configuration */
  config: ResidentUndoConfig;
  /** Current stack state */
  stackState: UndoStackState;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Whether panel is visible */
  isPanelVisible: boolean;
  
  /** Actions */
  addUndoAction: (action: Omit<UndoAction, 'id' | 'timestamp' | 'badgeType'>) => void;
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  clearHistory: () => void;
  togglePanel: () => void;
  showPanel: () => void;
  hidePanel: () => void;
  
  /** Utilities */
  exportHistory: () => string;
  importHistory: (data: string) => boolean;
  getActionSummary: (action: UndoAction) => string;
}

/**
 * Storage key for undo stack
 */
const STORAGE_KEY = 'idle-village-resident-undo-stack';

/**
 * Main resident undo hook
 */
export function useResidentUndo(
  customConfig: Partial<ResidentUndoConfig> = {}
): UseResidentUndoReturn {
  // State management
  const [config] = useState<ResidentUndoConfig>(() => 
    createResidentUndoConfig(customConfig)
  );
  const [stackState, setStackState] = useState<UndoStackState>(() => ({
    undoStack: [],
    redoStack: [],
    currentSize: 0,
    maxSize: config.timeline.maxItems,
  }));
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  
  // Refs for keyboard shortcuts
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load saved stack from PersistenceService
   */
  const loadStack = useCallback(async (): Promise<UndoStackState> => {
    try {
      const saved = await loadData(STORAGE_KEY, null);
      if (saved && typeof saved === 'object') {
        const parsed = saved as { undoStack: UndoAction[], redoStack: UndoAction[] };
        return {
          undoStack: parsed.undoStack || [],
          redoStack: parsed.redoStack || [],
          currentSize: (parsed.undoStack?.length || 0) + (parsed.redoStack?.length || 0),
          maxSize: config.timeline.maxItems,
        };
      }
    } catch (error) {
      diagnostics.warn('Failed to load undo stack', { error });
    }
    
    return {
      undoStack: [],
      redoStack: [],
      currentSize: 0,
      maxSize: config.timeline.maxItems,
    };
  }, [config.timeline.maxItems]);

  /**
   * Save stack to PersistenceService
   */
  const saveStack = useCallback(async (state: UndoStackState) => {
    try {
      const data = {
        undoStack: state.undoStack,
        redoStack: state.redoStack,
      };
      
      await saveData(STORAGE_KEY, data);
      diagnostics.info('Saved undo stack', { 
        undoCount: state.undoStack.length,
        redoCount: state.redoStack.length,
      });
    } catch (error) {
      diagnostics.warn('Failed to save undo stack', { error });
    }
  }, []);

  /**
   * Generate unique action ID
   */
  const generateActionId = useCallback((): string => {
    return `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Add undo action to stack
   */
  const addUndoAction = useCallback((action: Omit<UndoAction, 'id' | 'timestamp' | 'badgeType'>) => {
    const fullAction: UndoAction = {
      ...action,
      id: generateActionId(),
      timestamp: Date.now(),
      badgeType: getUndoBadgeType(action),
    };

    setStackState(prev => {
      // Clear redo stack when new action is added
      const newUndoStack = [...prev.undoStack, fullAction];
      const newRedoStack: UndoAction[] = [];
      
      // Trim stack if it exceeds max size
      if (newUndoStack.length > config.timeline.maxItems) {
        newUndoStack.splice(0, newUndoStack.length - config.timeline.maxItems);
      }
      
      const newState = {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        currentSize: newUndoStack.length + newRedoStack.length,
        maxSize: config.timeline.maxItems,
      };
      
      // Save to storage
      saveStack(newState);
      
      // Emit telemetry
      if (config.enableTelemetry) {
        diagnostics.info('Telemetry: resident_undo_action_added', {
          actionId: fullAction.id,
          actionType: fullAction.type,
          residentId: fullAction.residentId,
          success: fullAction.success,
        });
      }
      
      return newState;
    });
  }, [generateActionId, config.timeline.maxItems, config.enableTelemetry, saveStack]);

  /**
   * Undo last action
   */
  const undo = useCallback((): UndoAction | null => {
    const action = stackState.undoStack[stackState.undoStack.length - 1];
    
    if (!action) {
      return null;
    }

    // Move action from undo stack to redo stack
    setStackState(prev => {
      const newUndoStack = prev.undoStack.slice(0, -1);
      const newRedoStack = [...prev.redoStack, action];
      
      const newState = {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        currentSize: newUndoStack.length + newRedoStack.length,
        maxSize: prev.maxSize,
      };
      
      saveStack(newState);
      
      // Emit telemetry
      if (config.enableTelemetry) {
        diagnostics.info('Telemetry: resident_undo_performed', {
          actionId: action.id,
          actionType: action.type,
          residentId: action.residentId,
          undoCount: newUndoStack.length,
          redoCount: newRedoStack.length,
        });
      }
      
      return newState;
    });

    return action;
  }, [stackState.undoStack, config.enableTelemetry, saveStack]);

  /**
   * Redo last undone action
   */
  const redo = useCallback((): UndoAction | null => {
    const action = stackState.redoStack[stackState.redoStack.length - 1];
    
    if (!action) {
      return null;
    }

    // Move action from redo stack to undo stack
    setStackState(prev => {
      const newUndoStack = [...prev.undoStack, action];
      const newRedoStack = prev.redoStack.slice(0, -1);
      
      // Trim stack if it exceeds max size
      if (newUndoStack.length > config.timeline.maxItems) {
        newUndoStack.splice(0, newUndoStack.length - config.timeline.maxItems);
      }
      
      const newState = {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        currentSize: newUndoStack.length + newRedoStack.length,
        maxSize: prev.maxSize,
      };
      
      saveStack(newState);
      
      // Emit telemetry
      if (config.enableTelemetry) {
        diagnostics.info('Telemetry: resident_redo_performed', {
          actionId: action.id,
          actionType: action.type,
          residentId: action.residentId,
          undoCount: newUndoStack.length,
          redoCount: newRedoStack.length,
        });
      }
      
      return newState;
    });

    return action;
  }, [stackState.redoStack, config.timeline.maxItems, config.enableTelemetry, saveStack]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setStackState({
      undoStack: [],
      redoStack: [],
      currentSize: 0,
      maxSize: config.timeline.maxItems,
    });
    
    // Clear storage
    clearData(STORAGE_KEY);
    
    // Emit telemetry
    if (config.enableTelemetry) {
      diagnostics.info('Telemetry: resident_undo_history_cleared', {
        timestamp: Date.now(),
      });
    }
  }, [config.timeline.maxItems, config.enableTelemetry]);

  /**
   * Toggle panel visibility
   */
  const togglePanel = useCallback(() => {
    setIsPanelVisible(prev => !prev);
  }, []);

  /**
   * Show panel
   */
  const showPanel = useCallback(() => {
    setIsPanelVisible(true);
  }, []);

  /**
   * Hide panel
   */
  const hidePanel = useCallback(() => {
    setIsPanelVisible(false);
  }, []);

  /**
   * Export history as JSON
   */
  const exportHistory = useCallback((): string => {
    const exportData = {
      timestamp: Date.now(),
      config: config,
      stackState,
      metadata: {
        version: '1.0.0',
        exportedBy: 'NP-020 Resident Undo Hook',
      },
    };

    return JSON.stringify(exportData, null, 2);
  }, [config, stackState]);

  /**
   * Import history from JSON
   */
  const importHistory = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.stackState && typeof parsed.stackState === 'object') {
        setStackState(parsed.stackState);
        saveStack(parsed.stackState);
        
        diagnostics.info('Imported undo history', {
          undoCount: parsed.stackState.undoStack?.length || 0,
          redoCount: parsed.stackState.redoStack?.length || 0,
        });
        
        return true;
      }
    } catch (error) {
      diagnostics.warn('Failed to import undo history', { error });
    }
    
    return false;
  }, [saveStack]);

  /**
   * Get action summary for display
   */
  const getActionSummary = useCallback((action: UndoAction): string => {
    const actionLabel = getUndoActionLabel(action.type);
    const time = new Date(action.timestamp).toLocaleTimeString();
    
    return `${actionLabel} - ${action.description} (${time})`;
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    if (!config.shortcuts.enabled) {
      return;
    }

    // Prevent shortcuts in input fields
    if (config.shortcuts.preventInInputs && 
        (event.target instanceof HTMLInputElement || 
         event.target instanceof HTMLTextAreaElement)) {
      return;
    }

    const key = [
      event.ctrlKey ? 'ctrl' : '',
      event.shiftKey ? 'shift' : '',
      event.altKey ? 'alt' : '',
      event.key.toLowerCase(),
    ].filter(Boolean).join('+');

    // Debounce rapid key presses - disabled due to setTimeout restriction
    // TODO: Implement with SchedulerService or useSandboxClock
    if (debounceRef.current) {
      diagnostics.warn('Keyboard debounce disabled - requires SchedulerService integration');
    }
    
    // Process immediately without debounce
    switch (key) {
      case 'ctrl+z': {
        event.preventDefault();
        undo();
        break;
      }
      case 'ctrl+y': {
        event.preventDefault();
        redo();
        break;
      }
      case 'ctrl+shift+z': {
        event.preventDefault();
        // Batch undo - undo multiple actions
        let undone = 0;
        while (stackState.undoStack.length > 0 && undone < 5) {
          undo();
          undone++;
        }
        break;
      }
      case 'ctrl+shift+delete': {
        event.preventDefault();
        clearHistory();
        break;
      }
      case 'ctrl+shift+u': {
        event.preventDefault();
        togglePanel();
        break;
      }
    }
  }, [config, undo, redo, clearHistory, togglePanel, stackState.undoStack.length]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      const loadedStack = await loadStack();
      setStackState(loadedStack);
    };
    initialize();
  }, [loadStack]);

  // Set up keyboard shortcuts
  useEffect(() => {
    if (config.shortcuts.enabled) {
      document.addEventListener('keydown', handleKeyboardShortcut);
      
      return () => {
        document.removeEventListener('keydown', handleKeyboardShortcut);
        const currentTimeout = debounceRef.current;
        if (currentTimeout) {
          clearTimeout(currentTimeout);
        }
      };
    }
  }, [config.shortcuts.enabled, handleKeyboardShortcut]);

  // Auto-hide panel - disabled for now due to setTimeout restriction
  // TODO: Implement with SchedulerService or useSandboxClock
  useEffect(() => {
    if (config.panel.autoHide && isPanelVisible) {
      diagnostics.warn('Auto-hide panel disabled - requires SchedulerService integration');
    }
  }, [config.panel.autoHide, config.panel.autoHideTimeout, isPanelVisible]);

  const canUndo = stackState.undoStack.length > 0;
  const canRedo = stackState.redoStack.length > 0;

  return {
    config,
    stackState,
    canUndo,
    canRedo,
    isPanelVisible,
    addUndoAction,
    undo,
    redo,
    clearHistory,
    togglePanel,
    showPanel,
    hidePanel,
    exportHistory,
    importHistory,
    getActionSummary,
  };
}

export default useResidentUndo;
