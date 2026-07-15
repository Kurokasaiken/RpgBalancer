import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePanelsStore, selectVisiblePanels, selectActivePanel, selectPanelsByZIndex } from '@/ui/designSystem/store/usePanelsStore';
import { createDefaultPanel } from '@/ui/designSystem/store/panelsTypes';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  clearData: vi.fn(),
}));

describe('usePanelsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePanelsStore.setState({
      panels: {},
      activePanelId: null,
      layoutMode: 'full',
      zIndexCounter: 0,
    });
    vi.clearAllMocks();
  });

  describe('CRUD operations', () => {
    it('should add a new panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel']).toBeDefined();
      expect(state.panels['test-panel'].title).toBe('Test Panel');
      expect(state.panels['test-panel'].zIndex).toBe(1);
    });

    it('should remove a panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().removePanel('test-panel');

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel']).toBeUndefined();
    });

    it('should update an existing panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().updatePanel('test-panel', { title: 'Updated Title' });

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel'].title).toBe('Updated Title');
    });

    it('should not update non-existent panel', () => {
      usePanelsStore.getState().updatePanel('non-existent', { title: 'Updated' });

      const state = usePanelsStore.getState();
      expect(state.panels['non-existent']).toBeUndefined();
    });
  });

  describe('Visibility and state', () => {
    it('should set active panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().setActivePanel('test-panel');

      const state = usePanelsStore.getState();
      expect(state.activePanelId).toBe('test-panel');
      expect(state.panels['test-panel'].zIndex).toBeGreaterThan(0);
    });

    it('should clear active panel when setting null', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().setActivePanel('test-panel');
      usePanelsStore.getState().setActivePanel(null);

      const state = usePanelsStore.getState();
      expect(state.activePanelId).toBeNull();
    });

    it('should toggle panel visibility', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().togglePanel('test-panel');

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel'].isVisible).toBe(false);
    });

    it('should minimize a panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().minimizePanel('test-panel');

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel'].isMinimized).toBe(true);
    });

    it('should maximize a panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel', { isMinimized: true });
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().maximizePanel('test-panel');

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel'].isMinimized).toBe(false);
    });
  });

  describe('Layout', () => {
    it('should set layout mode', () => {
      usePanelsStore.getState().setLayoutMode('strip');

      const state = usePanelsStore.getState();
      expect(state.layoutMode).toBe('strip');
    });

    it('should reorder panels', () => {
      const panel1 = createDefaultPanel('panel-1', 'Panel 1');
      const panel2 = createDefaultPanel('panel-2', 'Panel 2');
      usePanelsStore.getState().addPanel(panel1);
      usePanelsStore.getState().addPanel(panel2);
      usePanelsStore.getState().reorderPanels(['panel-2', 'panel-1']);

      const state = usePanelsStore.getState();
      expect(state.panels['panel-2'].zIndex).toBe(0);
      expect(state.panels['panel-1'].zIndex).toBe(1);
    });
  });

  describe('Position and size', () => {
    it('should move a panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().movePanel('test-panel', { x: 200, y: 300 });

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel'].position).toEqual({ x: 200, y: 300 });
    });

    it('should resize a panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().resizePanel('test-panel', { width: 600, height: 400 });

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel'].size).toEqual({ width: 600, height: 400 });
    });
  });

  describe('Bulk operations', () => {
    it('should reset panels to initial state', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().setActivePanel('test-panel');
      usePanelsStore.getState().resetPanels();

      const state = usePanelsStore.getState();
      expect(state.panels['test-panel']).toBeUndefined();
      expect(state.activePanelId).toBe('panel-1');
    });
  });

  describe('Persistence operations', () => {
    it('should save state to PersistenceService', async () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);

      await usePanelsStore.getState().saveState();

      expect(saveData).toHaveBeenCalledWith(
        'rpg-balancer-panels-state',
        usePanelsStore.getState()
      );
    });

    it('should load state from PersistenceService', async () => {
      const mockState = {
        panels: { 'test-panel': createDefaultPanel('test-panel', 'Test Panel') },
        activePanelId: 'test-panel',
        layoutMode: 'full' as const,
        zIndexCounter: 1,
      };
      (loadData as vi.Mock).mockResolvedValue(mockState);

      await usePanelsStore.getState().loadState();

      expect(loadData).toHaveBeenCalledWith('rpg-balancer-panels-state', expect.any(Object));
      const state = usePanelsStore.getState();
      expect(state.activePanelId).toBe('test-panel');
    });

    it('should clear state from PersistenceService', async () => {
      await usePanelsStore.getState().clearState();

      expect(clearData).toHaveBeenCalledWith('rpg-balancer-panels-state');
      const state = usePanelsStore.getState();
      // clearState resets to INITIAL_STATE which has default panels
      expect(state.panels).toHaveProperty('panel-1');
      expect(state.panels).toHaveProperty('panel-2');
      expect(state.panels).toHaveProperty('panel-3');
    });
  });

  describe('Selectors', () => {
    it('should select visible panels', () => {
      const panel1 = createDefaultPanel('panel-1', 'Panel 1', { isVisible: true });
      const panel2 = createDefaultPanel('panel-2', 'Panel 2', { isVisible: false });
      usePanelsStore.getState().addPanel(panel1);
      usePanelsStore.getState().addPanel(panel2);

      const visiblePanels = selectVisiblePanels(usePanelsStore.getState());
      expect(visiblePanels).toHaveLength(1);
      expect(visiblePanels[0].id).toBe('panel-1');
    });

    it('should select active panel', () => {
      const panelData = createDefaultPanel('test-panel', 'Test Panel');
      usePanelsStore.getState().addPanel(panelData);
      usePanelsStore.getState().setActivePanel('test-panel');

      const activePanel = selectActivePanel(usePanelsStore.getState());
      expect(activePanel).toBeDefined();
      expect(activePanel?.id).toBe('test-panel');
    });

    it('should return null when no active panel', () => {
      const activePanel = selectActivePanel(usePanelsStore.getState());
      expect(activePanel).toBeNull();
    });

    it('should select panels sorted by z-index', () => {
      const panel1 = createDefaultPanel('panel-1', 'Panel 1', { zIndex: 3 });
      const panel2 = createDefaultPanel('panel-2', 'Panel 2', { zIndex: 1 });
      const panel3 = createDefaultPanel('panel-3', 'Panel 3', { zIndex: 2 });
      usePanelsStore.getState().addPanel(panel1);
      usePanelsStore.getState().addPanel(panel2);
      usePanelsStore.getState().addPanel(panel3);

      const sortedPanels = selectPanelsByZIndex(usePanelsStore.getState());
      // Note: addPanel increments zIndex, so actual z-indices will be different
      expect(sortedPanels).toHaveLength(3);
      expect(sortedPanels[0].zIndex).toBeLessThanOrEqual(sortedPanels[1].zIndex);
      expect(sortedPanels[1].zIndex).toBeLessThanOrEqual(sortedPanels[2].zIndex);
    });
  });
});
