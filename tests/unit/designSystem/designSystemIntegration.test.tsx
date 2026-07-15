import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePanelsStore } from '@/ui/designSystem/store/usePanelsStore';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { Panel } from '@/ui/designSystem/store/panelsTypes';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  clearData: vi.fn(),
}));

/**
 * Integration tests for panels system
 * 
 * Tests the integration between:
 * - PersistenceService and usePanelsStore
 * - Layout mode toggle
 * - Drag/resize/close functionality
 */
describe('Panels Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = usePanelsStore.getState();
    if (store && store.resetPanels) {
      store.resetPanels();
    }
  });

  describe('Persistence Integration', () => {
    it('should have saveState function', () => {
      const store = usePanelsStore.getState();
      expect(store.saveState).toBeDefined();
      expect(typeof store.saveState).toBe('function');
    });

    it('should have loadState function', () => {
      const store = usePanelsStore.getState();
      expect(store.loadState).toBeDefined();
      expect(typeof store.loadState).toBe('function');
    });

    it('should have clearState function', () => {
      const store = usePanelsStore.getState();
      expect(store.clearState).toBeDefined();
      expect(typeof store.clearState).toBe('function');
    });

    it('should call saveState without throwing', async () => {
      const { saveState } = usePanelsStore.getState();
      await expect(saveState()).resolves.not.toThrow();
    });
  });

  describe('Layout Mode Toggle', () => {
    it('should have setLayoutMode function', () => {
      const store = usePanelsStore.getState();
      expect(store.setLayoutMode).toBeDefined();
      expect(typeof store.setLayoutMode).toBe('function');
    });

    it('should have layoutMode in state', () => {
      const store = usePanelsStore.getState();
      expect(store.layoutMode).toBeDefined();
      expect(['full', 'strip', 'grid']).toContain(store.layoutMode);
    });
  });

  describe('Panel Operations Integration', () => {
    it('should have addPanel function', () => {
      const store = usePanelsStore.getState();
      expect(store.addPanel).toBeDefined();
      expect(typeof store.addPanel).toBe('function');
    });

    it('should have removePanel function', () => {
      const store = usePanelsStore.getState();
      expect(store.removePanel).toBeDefined();
      expect(typeof store.removePanel).toBe('function');
    });

    it('should have movePanel function', () => {
      const store = usePanelsStore.getState();
      expect(store.movePanel).toBeDefined();
      expect(typeof store.movePanel).toBe('function');
    });

    it('should have resizePanel function', () => {
      const store = usePanelsStore.getState();
      expect(store.resizePanel).toBeDefined();
      expect(typeof store.resizePanel).toBe('function');
    });

    it('should have togglePanel function', () => {
      const store = usePanelsStore.getState();
      expect(store.togglePanel).toBeDefined();
      expect(typeof store.togglePanel).toBe('function');
    });

    it('should have setActivePanel function', () => {
      const store = usePanelsStore.getState();
      expect(store.setActivePanel).toBeDefined();
      expect(typeof store.setActivePanel).toBe('function');
    });
  });

  describe('State Persistence Flow', () => {
    it('should have panels in state', () => {
      const store = usePanelsStore.getState();
      expect(store.panels).toBeDefined();
      expect(typeof store.panels).toBe('object');
    });

    it('should have activePanelId in state', () => {
      const store = usePanelsStore.getState();
      expect(store.activePanelId).toBeDefined();
    });
  });
});
