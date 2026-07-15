import { create } from 'zustand';
import type {
  Panel,
  PanelState,
  PanelsStore,
  LayoutMode,
} from './panelsTypes';
import {
  createDefaultPanel,
  DEFAULT_LAYOUT_MODE,
} from './panelsTypes';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';

/**
 * Storage key for panel state persistence
 */
const PANELS_STORAGE_KEY = 'rpg-balancer-panels-state';

/**
 * Load panel state from PersistenceService
 */
async function loadPanelsState(): Promise<PanelState> {
  try {
    return await loadData<PanelState>(PANELS_STORAGE_KEY, INITIAL_STATE);
  } catch (error) {
    console.warn('[PanelsStore] Failed to load from storage:', error);
    return INITIAL_STATE;
  }
}

/**
 * Save panel state to PersistenceService
 */
async function savePanelsState(state: PanelState): Promise<void> {
  try {
    await saveData(PANELS_STORAGE_KEY, state);
  } catch (error) {
    console.warn('[PanelsStore] Failed to save to storage:', error);
  }
}

/**
 * Clear panel state from PersistenceService
 */
async function clearPanelsState(): Promise<void> {
  try {
    await clearData(PANELS_STORAGE_KEY);
  } catch (error) {
    console.warn('[PanelsStore] Failed to clear storage:', error);
  }
}

/**
 * Initial panel state with default panels
 */
const INITIAL_PANELS: Record<string, Panel> = {
  'panel-1': createDefaultPanel('panel-1', 'Panel 1', {
    position: { x: 50, y: 50 },
    size: { width: 400, height: 300 },
  }),
  'panel-2': createDefaultPanel('panel-2', 'Panel 2', {
    position: { x: 500, y: 50 },
    size: { width: 400, height: 300 },
  }),
  'panel-3': createDefaultPanel('panel-3', 'Panel 3', {
    position: { x: 50, y: 400 },
    size: { width: 400, height: 300 },
  }),
};

/**
 * Initial state for panels store
 */
const INITIAL_STATE: PanelState = {
  panels: INITIAL_PANELS,
  activePanelId: 'panel-1',
  layoutMode: DEFAULT_LAYOUT_MODE,
  zIndexCounter: 3,
};

/**
 * Zustand store for panel state management
 * 
 * This store manages draggable panels with:
 * - CRUD operations for panels
 * - Visibility and minimization state
 * - Layout modes (full, strip, grid)
 * - Position and size management
 * - Z-index layering
 * - Persistence via PersistenceService
 */
export const usePanelsStore = create<PanelsStore>((set, get) => ({
  ...INITIAL_STATE,

  // CRUD operations

  /**
   * Add a new panel to the store
   */
  addPanel: (panelData) => {
    const { zIndexCounter } = get();
    const newPanel: Panel = {
      ...panelData,
      zIndex: zIndexCounter + 1,
    };
    set((state) => ({
      panels: { ...state.panels, [newPanel.id]: newPanel },
      zIndexCounter: zIndexCounter + 1,
    }));
  },

  /**
   * Remove a panel from the store
   */
  removePanel: (panelId) => {
    set((state) => {
      const { [panelId]: _removed, ...remainingPanels } = state.panels;
      const newActivePanelId = state.activePanelId === panelId ? null : state.activePanelId;
      return {
        panels: remainingPanels,
        activePanelId: newActivePanelId,
      };
    });
  },

  /**
   * Update an existing panel
   */
  updatePanel: (panelId, updates) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: state.panels[panelId] ? { ...state.panels[panelId], ...updates } : state.panels[panelId],
      },
    }));
  },

  // Visibility and state

  /**
   * Set the active panel
   */
  setActivePanel: (panelId) => {
    const { panels, zIndexCounter } = get();
    if (panelId && panels[panelId]) {
      set((state) => ({
        activePanelId: panelId,
        panels: {
          ...state.panels,
          [panelId]: { ...state.panels[panelId], zIndex: zIndexCounter + 1 },
        },
        zIndexCounter: zIndexCounter + 1,
      }));
    } else {
      set({ activePanelId: null });
    }
  },

  /**
   * Toggle panel visibility
   */
  togglePanel: (panelId) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: state.panels[panelId]
          ? { ...state.panels[panelId], isVisible: !state.panels[panelId].isVisible }
          : state.panels[panelId],
      },
    }));
  },

  /**
   * Minimize a panel
   */
  minimizePanel: (panelId) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: state.panels[panelId]
          ? { ...state.panels[panelId], isMinimized: true }
          : state.panels[panelId],
      },
    }));
  },

  /**
   * Maximize a panel
   */
  maximizePanel: (panelId) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: state.panels[panelId]
          ? { ...state.panels[panelId], isMinimized: false }
          : state.panels[panelId],
      },
    }));
  },

  // Layout

  /**
   * Set the layout mode
   */
  setLayoutMode: (mode: LayoutMode) => {
    set({ layoutMode: mode });
  },

  /**
   * Reorder panels by ID order
   */
  reorderPanels: (panelIds) => {
    const { panels } = get();
    const reorderedPanels: Record<string, Panel> = {};
    panelIds.forEach((id, index) => {
      if (panels[id]) {
        reorderedPanels[id] = { ...panels[id], zIndex: index };
      }
    });
    set({ panels: reorderedPanels });
  },

  // Position and size

  /**
   * Move a panel to a new position
   */
  movePanel: (panelId, position) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: state.panels[panelId]
          ? { ...state.panels[panelId], position }
          : state.panels[panelId],
      },
    }));
  },

  /**
   * Resize a panel
   */
  resizePanel: (panelId, size) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: state.panels[panelId]
          ? { ...state.panels[panelId], size }
          : state.panels[panelId],
      },
    }));
  },

  // Bulk operations

  /**
   * Reset panels to initial state
   */
  resetPanels: () => {
    set(INITIAL_STATE);
  },

  // Persistence operations

  /**
   * Save current state to PersistenceService
   */
  saveState: async () => {
    const state = get();
    await savePanelsState(state);
  },

  /**
   * Load state from PersistenceService
   */
  loadState: async () => {
    const state = await loadPanelsState();
    set(state);
  },

  /**
   * Clear state from PersistenceService
   */
  clearState: async () => {
    await clearPanelsState();
    set(INITIAL_STATE);
  },
}));

/**
 * Selector for visible panels
 */
export const selectVisiblePanels = (state: PanelsStore) =>
  Object.values(state.panels).filter((panel) => panel.isVisible);

/**
 * Selector for active panel
 */
export const selectActivePanel = (state: PanelsStore) =>
  state.activePanelId ? state.panels[state.activePanelId] : null;

/**
 * Selector for panels sorted by z-index
 */
export const selectPanelsByZIndex = (state: PanelsStore) =>
  Object.values(state.panels).sort((a, b) => a.zIndex - b.zIndex);
