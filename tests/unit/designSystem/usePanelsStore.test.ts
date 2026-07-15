import { describe, it, expect, beforeEach } from 'vitest';
import { usePanelsStore, selectVisiblePanels, selectActivePanel, selectPanelsByZIndex } from '@/ui/designSystem/store/usePanelsStore';
import type { Panel, LayoutMode } from '@/ui/designSystem/store/panelsTypes';

/**
 * Unit tests for usePanelsStore
 * 
 * Tests the Zustand store for panel state management including:
 * - Initial state
 * - CRUD operations (add, remove, update)
 * - Visibility and state (setActive, toggle, minimize, maximize)
 * - Layout mode changes
 * - Position and size management
 * - Reordering and reset
 */
describe('usePanelsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePanelsStore.getState().resetPanels();
  });

  describe('Initial State', () => {
    it('should have 3 default panels', () => {
      const { panels } = usePanelsStore.getState();
      expect(Object.keys(panels)).toHaveLength(3);
    });

    it('should have panel-1 as active panel', () => {
      const { activePanelId } = usePanelsStore.getState();
      expect(activePanelId).toBe('panel-1');
    });

    it('should have full layout mode by default', () => {
      const { layoutMode } = usePanelsStore.getState();
      expect(layoutMode).toBe('full');
    });

    it('should have zIndexCounter starting at 3', () => {
      const { zIndexCounter } = usePanelsStore.getState();
      expect(zIndexCounter).toBe(3);
    });
  });

  describe('CRUD Operations', () => {
    it('should add a new panel', () => {
      const { addPanel } = usePanelsStore.getState();
      
      addPanel({
        id: 'panel-4',
        title: 'Panel 4',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 200 },
        isVisible: true,
        isMinimized: false,
      });

      const { panels, zIndexCounter } = usePanelsStore.getState();
      expect(panels['panel-4']).toBeDefined();
      expect(panels['panel-4'].title).toBe('Panel 4');
      expect(zIndexCounter).toBe(4);
    });

    it('should remove a panel', () => {
      const { removePanel } = usePanelsStore.getState();
      
      removePanel('panel-1');

      const { panels, activePanelId } = usePanelsStore.getState();
      expect(panels['panel-1']).toBeUndefined();
      expect(activePanelId).toBeNull();
    });

    it('should update a panel', () => {
      const { updatePanel } = usePanelsStore.getState();
      
      updatePanel('panel-1', { title: 'Updated Panel 1' });

      const { panels } = usePanelsStore.getState();
      expect(panels['panel-1'].title).toBe('Updated Panel 1');
    });

    it('should not update non-existent panel', () => {
      const { updatePanel } = usePanelsStore.getState();
      const originalPanels = { ...usePanelsStore.getState().panels };
      
      updatePanel('non-existent', { title: 'Should not update' });

      const { panels } = usePanelsStore.getState();
      expect(panels).toEqual(originalPanels);
    });
  });

  describe('Visibility and State', () => {
    it('should set active panel', () => {
      const { setActivePanel } = usePanelsStore.getState();
      
      setActivePanel('panel-2');

      const { activePanelId, panels, zIndexCounter } = usePanelsStore.getState();
      expect(activePanelId).toBe('panel-2');
      expect(panels['panel-2'].zIndex).toBe(4);
      expect(zIndexCounter).toBe(4);
    });

    it('should set active panel to null', () => {
      const { setActivePanel } = usePanelsStore.getState();
      
      setActivePanel(null);

      const { activePanelId } = usePanelsStore.getState();
      expect(activePanelId).toBeNull();
    });

    it('should toggle panel visibility', () => {
      const { togglePanel } = usePanelsStore.getState();
      const initialVisible = usePanelsStore.getState().panels['panel-1'].isVisible;
      
      togglePanel('panel-1');

      const { panels } = usePanelsStore.getState();
      expect(panels['panel-1'].isVisible).toBe(!initialVisible);
    });

    it('should minimize a panel', () => {
      const { minimizePanel } = usePanelsStore.getState();
      
      minimizePanel('panel-1');

      const { panels } = usePanelsStore.getState();
      expect(panels['panel-1'].isMinimized).toBe(true);
    });

    it('should maximize a panel', () => {
      const { minimizePanel, maximizePanel } = usePanelsStore.getState();
      
      minimizePanel('panel-1');
      maximizePanel('panel-1');

      const { panels } = usePanelsStore.getState();
      expect(panels['panel-1'].isMinimized).toBe(false);
    });
  });

  describe('Layout Mode', () => {
    it('should set layout mode to strip', () => {
      const { setLayoutMode } = usePanelsStore.getState();
      
      setLayoutMode('strip');

      const { layoutMode } = usePanelsStore.getState();
      expect(layoutMode).toBe('strip');
    });

    it('should set layout mode to grid', () => {
      const { setLayoutMode } = usePanelsStore.getState();
      
      setLayoutMode('grid');

      const { layoutMode } = usePanelsStore.getState();
      expect(layoutMode).toBe('grid');
    });

    it('should set layout mode to full', () => {
      const { setLayoutMode } = usePanelsStore.getState();
      
      setLayoutMode('full');

      const { layoutMode } = usePanelsStore.getState();
      expect(layoutMode).toBe('full');
    });
  });

  describe('Position and Size', () => {
    it('should move a panel', () => {
      const { movePanel } = usePanelsStore.getState();
      
      movePanel('panel-1', { x: 500, y: 500 });

      const { panels } = usePanelsStore.getState();
      expect(panels['panel-1'].position.x).toBe(500);
      expect(panels['panel-1'].position.y).toBe(500);
    });

    it('should resize a panel', () => {
      const { resizePanel } = usePanelsStore.getState();
      
      resizePanel('panel-1', { width: 600, height: 400 });

      const { panels } = usePanelsStore.getState();
      expect(panels['panel-1'].size.width).toBe(600);
      expect(panels['panel-1'].size.height).toBe(400);
    });
  });

  describe('Reordering', () => {
    it('should reorder panels', () => {
      const { reorderPanels } = usePanelsStore.getState();
      
      reorderPanels(['panel-3', 'panel-2', 'panel-1']);

      const { panels } = usePanelsStore.getState();
      expect(panels['panel-3'].zIndex).toBe(0);
      expect(panels['panel-2'].zIndex).toBe(1);
      expect(panels['panel-1'].zIndex).toBe(2);
    });
  });

  describe('Reset', () => {
    it('should reset panels to initial state', () => {
      const { addPanel, setLayoutMode, resetPanels } = usePanelsStore.getState();
      
      // Modify state
      addPanel({
        id: 'panel-4',
        title: 'Panel 4',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 200 },
        isVisible: true,
        isMinimized: false,
      });
      setLayoutMode('strip');

      // Reset
      resetPanels();

      const { panels, activePanelId, layoutMode, zIndexCounter } = usePanelsStore.getState();
      expect(Object.keys(panels)).toHaveLength(3);
      expect(activePanelId).toBe('panel-1');
      expect(layoutMode).toBe('full');
      expect(zIndexCounter).toBe(3);
    });
  });

  describe('Selectors', () => {
    it('should return visible panels', () => {
      const { togglePanel } = usePanelsStore.getState();
      
      togglePanel('panel-1');
      
      const visiblePanels = selectVisiblePanels(usePanelsStore.getState());
      expect(visiblePanels).toHaveLength(2);
      expect(visiblePanels.every((p: Panel) => p.isVisible)).toBe(true);
    });

    it('should return active panel', () => {
      const activePanel = selectActivePanel(usePanelsStore.getState());
      expect(activePanel?.id).toBe('panel-1');
    });

    it('should return null for active panel when none is active', () => {
      const { setActivePanel } = usePanelsStore.getState();
      
      setActivePanel(null);
      
      const activePanel = selectActivePanel(usePanelsStore.getState());
      expect(activePanel).toBeNull();
    });

    it('should return panels sorted by z-index', () => {
      const sortedPanels = selectPanelsByZIndex(usePanelsStore.getState());
      expect(sortedPanels[0].zIndex).toBeLessThanOrEqual(sortedPanels[1].zIndex);
      expect(sortedPanels[1].zIndex).toBeLessThanOrEqual(sortedPanels[2].zIndex);
    });
  });
});
