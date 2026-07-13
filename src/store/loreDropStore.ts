import { create, type StateCreator } from 'zustand';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { LORE_DROP_SAMPLES } from '@/balancing/config/lore/loreDropSamples';
import type {
  LoreDrop,
  LoreDropAssignment,
  LoreDropState,
  LoreDropEntity,
} from '@/balancing/config/lore/loreDropTypes';
import {
  assignLoreDrop,
  discoverLoreDrop,
  getLoreDropForEntity,
  getDiscoveredLoreDrops,
} from '@/engine/game/lore/LoreDropService';

export const LORE_DROP_STATE_KEY = 'lore-drop-state';

export interface LoreDropStoreState extends LoreDropState {
  pool: LoreDrop[];
  load: () => Promise<void>;
  assignLoreDropToEntity: (entity: LoreDropEntity, rng?: () => number) => LoreDropAssignment | null;
  discoverLoreDropForEntity: (entityId: string) => void;
  resetLoreDrops: () => void;
}

const DEFAULT_LORE_DROP_STATE: LoreDropState = {
  assigned: {},
  discoveredIds: [],
  loaded: false,
};

const loreDropStoreInitializer: StateCreator<LoreDropStoreState> = (set, get) => ({
  ...DEFAULT_LORE_DROP_STATE,
  pool: LORE_DROP_SAMPLES,

  load: async () => {
    const persisted = await loadData<LoreDropState>(LORE_DROP_STATE_KEY, DEFAULT_LORE_DROP_STATE);
    set({
      ...persisted,
      loaded: true,
    });
  },

  assignLoreDropToEntity: (entity, rng) => {
    const state = get();
    const { assignment, state: nextState } = assignLoreDrop(state.pool, entity, state, rng);

    if (!assignment) return null;

    set(nextState);
    saveData(LORE_DROP_STATE_KEY, {
      assigned: nextState.assigned,
      discoveredIds: nextState.discoveredIds,
      loaded: true,
    }).catch((error) => {
      console.warn('[LoreDropStore] Failed to save assigned state:', error);
    });

    trackTelemetryEvent('lore_drop_assigned', {
      loreDropId: assignment.loreDropId,
      entityId: assignment.entityId,
      entityType: assignment.entityType,
      source: 'LoreDropStore',
    });

    return assignment;
  },

  discoverLoreDropForEntity: (entityId) => {
    const state = get();
    const assignment = state.assigned[entityId];
    if (!assignment || assignment.discovered) return;

    const nextState = discoverLoreDrop(state, entityId);
    set(nextState);

    saveData(LORE_DROP_STATE_KEY, {
      assigned: nextState.assigned,
      discoveredIds: nextState.discoveredIds,
      loaded: true,
    }).catch((error) => {
      console.warn('[LoreDropStore] Failed to save discovered state:', error);
    });

    const drop = getLoreDropForEntity(state.pool, nextState, entityId);
    trackTelemetryEvent('lore_drop_discovered', {
      loreDropId: assignment.loreDropId,
      entityId: assignment.entityId,
      entityType: assignment.entityType,
      titleKey: drop?.titleKey,
      title: drop?.title,
      source: 'LoreDropStore',
    });
  },

  resetLoreDrops: () => {
    set({ ...DEFAULT_LORE_DROP_STATE, loaded: true });
    clearData(LORE_DROP_STATE_KEY).catch((error) => {
      console.warn('[LoreDropStore] Failed to clear lore drop state:', error);
    });
    trackTelemetryEvent('lore_drop_reset', { source: 'LoreDropStore' });
  },
});

export const useLoreDropStore = create<LoreDropStoreState>()(loreDropStoreInitializer);

export const selectLoreDropForEntity = (entityId: string) => (state: LoreDropStoreState) =>
  getLoreDropForEntity(state.pool, state, entityId);

export const selectDiscoveredLoreDrops = (state: LoreDropStoreState) =>
  getDiscoveredLoreDrops(state.pool, state);

export const selectLoreDropLoaded = (state: LoreDropStoreState) => state.loaded;
