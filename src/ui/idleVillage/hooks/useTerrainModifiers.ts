/**
 * Hook powering the Idle Village Terrain Modifier Config Tool.
 *
 * Loads/saves modifier definitions via PersistenceService, exposes CRUD helpers,
 * computes layered previews, and emits telemetry when configs are persisted.
 *
 * @module useTerrainModifiers
 * @since 2026-01-13
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MapLayoutDefinition, MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import { resolveMapLayout, computeSlotPercentPosition } from '@/ui/idleVillage/mapLayoutUtils';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import {
  TERRAIN_IMPACT_TYPES,
  TERRAIN_PATTERN_TYPES,
  TerrainModifierSchema,
  type TerrainModifierDefinition,
  type TerrainModifierLayerConfig,
  type TerrainModifierLayerState,
  DEFAULT_TERRAIN_MODIFIER_PERSISTENCE,
  TERRAIN_MODIFIER_PERSISTENCE_VERSION,
  TerrainModifierPersistenceSchema,
  createDefaultLayerState,
  createTerrainModifierTemplate,
} from '@/ui/idleVillage/config/terrainModifierConfig';

/**
 * Storage key used by default.
 */
const DEFAULT_STORAGE_KEY = 'idleVillage-terrain-modifiers';

/**
 * Slot-level preview entry.
 */
export interface TerrainModifierPreview {
  slotId: string;
  slotLabel: string;
  effects: Record<(typeof TERRAIN_IMPACT_TYPES)[number], number>;
  layers: TerrainModifierPreviewLayer[];
  position: {
    leftPercent: number;
    topPercent: number;
  };
}

/**
 * Per-layer preview metadata.
 */
export interface TerrainModifierPreviewLayer {
  modifierId: string;
  label: string;
  color: string;
  intensity: number;
  layerId: string;
  layerName: string;
  visible: boolean;
  pattern?: (typeof TERRAIN_PATTERN_TYPES)[number];
  order: number;
}

/**
 * Hook options controlling persistence and preview context.
 */
export interface UseTerrainModifiersOptions {
  storageKey?: string;
  mapSlots?: Record<string, MapSlotDefinition>;
  mapLayout?: MapLayoutDefinition | null;
  baseLayers?: TerrainModifierLayerConfig[];
}

/**
 * Hook return shape.
 */
export interface UseTerrainModifiersReturn {
  loading: boolean;
  error: string | null;
  modifiers: TerrainModifierDefinition[];
  layers: TerrainModifierLayerState[];
  previews: TerrainModifierPreview[];
  hasUnsavedChanges: boolean;
  addModifier: (slotId?: string) => TerrainModifierDefinition;
  updateModifier: (modifier: TerrainModifierDefinition) => void;
  removeModifier: (modifierId: string) => void;
  toggleModifierEnabled: (modifierId: string) => void;
  duplicateModifier: (modifierId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  reorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  resetToDefaults: () => void;
  saveChanges: () => Promise<void>;
  exportConfig: () => string;
  importConfig: (json: string) => Promise<void>;
  getSlotsForModifier: (modifierId: string) => string[];
}

/**
 * Builds a canonical snapshot used for hashing/persistence.
 */
function buildSnapshot(modifiers: TerrainModifierDefinition[], layers: TerrainModifierLayerState[]) {
  return {
    version: TERRAIN_MODIFIER_PERSISTENCE_VERSION,
    modifiers,
    layers: layers.map((layer) => ({
      id: layer.id,
      visible: layer.visible,
      order: layer.order,
    })),
  };
}

/**
 * Ensures layer state keeps metadata from defaults while honoring persisted visibility/order.
 */
function hydrateLayers(
  baseLayers: TerrainModifierLayerConfig[],
  persistedLayers?: { id: string; visible: boolean; order: number }[],
): TerrainModifierLayerState[] {
  const persistedLookup = new Map(persistedLayers?.map((entry) => [entry.id, entry]) ?? []);
  return baseLayers
    .map((layer) => {
      const persisted = persistedLookup.get(layer.id);
      return {
        ...layer,
        visible: persisted?.visible ?? layer.defaultVisible,
        order: persisted?.order ?? layer.order,
      };
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Hook implementation.
 */
export function useTerrainModifiers({
  storageKey = DEFAULT_STORAGE_KEY,
  mapSlots,
  mapLayout,
  baseLayers = createDefaultLayerState(),
}: UseTerrainModifiersOptions = {}): UseTerrainModifiersReturn {
  const diagnostics = useMemo(() => createSandboxDiagnostics('TerrainModifierTool', 'terrain'), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modifiers, setModifiers] = useState<TerrainModifierDefinition[]>(DEFAULT_TERRAIN_MODIFIER_PERSISTENCE.modifiers);
  const [layers, setLayers] = useState<TerrainModifierLayerState[]>(hydrateLayers(baseLayers));
  const [persistedHash, setPersistedHash] = useState<string>('');

  const layout = useMemo(() => resolveMapLayout(mapLayout ?? null), [mapLayout]);
  const slotLookup = useMemo(() => mapSlots ?? {}, [mapSlots]);

  const snapshot = useMemo(() => buildSnapshot(modifiers, layers), [modifiers, layers]);
  const serializedSnapshot = useMemo(() => JSON.stringify(snapshot), [snapshot]);
  const hasUnsavedChanges = persistedHash !== '' && serializedSnapshot !== persistedHash;

  useEffect(() => {
    let mounted = true;
    const loadState = async () => {
      setLoading(true);
      setError(null);
      try {
        const persisted = await loadData(storageKey, DEFAULT_TERRAIN_MODIFIER_PERSISTENCE);
        const parsed = TerrainModifierPersistenceSchema.safeParse(persisted);
        const safePayload = parsed.success ? parsed.data : DEFAULT_TERRAIN_MODIFIER_PERSISTENCE;

        const sanitizedModifiers = safePayload.modifiers
          .map((candidate) => {
            const result = TerrainModifierSchema.safeParse(candidate);
            return result.success ? result.data : null;
          })
          .filter(Boolean) as TerrainModifierDefinition[];

        const nextLayers = hydrateLayers(baseLayers, safePayload.layers);

        if (mounted) {
          setModifiers(sanitizedModifiers);
          setLayers(nextLayers);
          setPersistedHash(JSON.stringify(buildSnapshot(sanitizedModifiers, nextLayers)));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown persistence error';
        diagnostics.error('Failed to load terrain modifiers', { message });
        if (mounted) {
          setError(message);
          setModifiers(DEFAULT_TERRAIN_MODIFIER_PERSISTENCE.modifiers);
          setLayers(hydrateLayers(baseLayers));
          setPersistedHash(JSON.stringify(buildSnapshot(
            DEFAULT_TERRAIN_MODIFIER_PERSISTENCE.modifiers,
            hydrateLayers(baseLayers),
          )));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadState();
    return () => {
      mounted = false;
    };
  }, [storageKey, diagnostics, baseLayers]);

  const addModifier = useCallback(
    (slotId?: string) => {
      const resolvedSlot = slotId ?? Object.keys(slotLookup)[0] ?? 'village_square';
      const template = createTerrainModifierTemplate(resolvedSlot);
      setModifiers((prev) => [...prev, template]);
      return template;
    },
    [slotLookup],
  );

  const updateModifier = useCallback((modifier: TerrainModifierDefinition) => {
    setModifiers((prev) => prev.map((entry) => (entry.id === modifier.id ? modifier : entry)));
  }, []);

  const removeModifier = useCallback((modifierId: string) => {
    setModifiers((prev) => prev.filter((modifier) => modifier.id !== modifierId));
  }, []);

  const toggleModifierEnabled = useCallback((modifierId: string) => {
    setModifiers((prev) =>
      prev.map((modifier) =>
        modifier.id === modifierId ? { ...modifier, isEnabled: !modifier.isEnabled } : modifier,
      ),
    );
  }, []);

  const duplicateModifier = useCallback((modifierId: string) => {
    setModifiers((prev) => {
      const target = prev.find((entry) => entry.id === modifierId);
      if (!target) return prev;
      const clone: TerrainModifierDefinition = {
        ...target,
        id: `${target.id}_copy_${Date.now().toString(36)}`,
        label: `${target.label} Copy`,
      };
      return [...prev, clone];
    });
  }, []);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)),
    );
  }, []);

  const reorderLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((layer) => layer.id === layerId);
      if (index === -1) return prev;
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) {
        return prev;
      }
      const temp = sorted[index].order;
      sorted[index].order = sorted[swapIndex].order;
      sorted[swapIndex].order = temp;
      return [...sorted].sort((a, b) => a.order - b.order);
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setModifiers(DEFAULT_TERRAIN_MODIFIER_PERSISTENCE.modifiers);
    setLayers(hydrateLayers(baseLayers));
  }, [baseLayers]);

  const saveChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await saveData(storageKey, snapshot);
      setPersistedHash(serializedSnapshot);
      diagnostics.info('terrain_modifier_saved', {
        modifierCount: modifiers.length,
        layerCount: layers.length,
        timestamp: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save terrain modifiers';
      setError(message);
      diagnostics.error('Failed to save terrain modifiers', { message });
    } finally {
      setLoading(false);
    }
  }, [storageKey, snapshot, serializedSnapshot, diagnostics, modifiers.length, layers.length]);

  const exportConfig = useCallback(() => JSON.stringify(snapshot, null, 2), [snapshot]);

  const importConfig = useCallback(
    async (json: string) => {
      const parsed = TerrainModifierPersistenceSchema.safeParse(JSON.parse(json));
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join(', '));
      }
      setModifiers(parsed.data.modifiers);
      setLayers(hydrateLayers(baseLayers, parsed.data.layers));
    },
    [baseLayers],
  );

  const getSlotsForModifier = useCallback(
    (modifierId: string) => {
      const modifier = modifiers.find((entry) => entry.id === modifierId);
      return modifier?.slotIds ?? [];
    },
    [modifiers],
  );

  const layerLookup = useMemo(() => {
    const lookup = new Map<string, TerrainModifierLayerState>();
    layers.forEach((layer, index) => {
      lookup.set(layer.id, { ...layer, order: layer.order ?? index * 10 });
    });
    return lookup;
  }, [layers]);

  const effectAccumulator = useCallback(() => {
    return TERRAIN_IMPACT_TYPES.reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<(typeof TERRAIN_IMPACT_TYPES)[number], number>,
    );
  }, []);

  const previews = useMemo<TerrainModifierPreview[]>(() => {
    const cells: Record<string, TerrainModifierPreview> = {};
    const layerOrder = layers
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((layer) => layer.id);

    modifiers
      .filter((modifier) => modifier.isEnabled)
      .forEach((modifier) => {
        modifier.slotIds.forEach((slotId) => {
          const slot = slotLookup[slotId];
          if (!cells[slotId]) {
            const { leftPercent, topPercent } = computeSlotPercentPosition(
              slot ?? { x: 0, y: 0 },
              layout,
            );
            cells[slotId] = {
              slotId,
              slotLabel: slot?.label ?? slotId,
              effects: effectAccumulator(),
              layers: [],
              position: {
                leftPercent,
                topPercent,
              },
            };
          }

          cells[slotId].effects[modifier.effectType] += modifier.magnitude;
          const layerMeta = layerLookup.get(modifier.layerId);

          cells[slotId].layers.push({
            modifierId: modifier.id,
            label: modifier.label,
            color: modifier.color,
            intensity: modifier.intensity,
            layerId: modifier.layerId,
            layerName: layerMeta?.name ?? modifier.layerId,
            visible: layerMeta?.visible ?? true,
            pattern: modifier.pattern,
            order: layerMeta?.order ?? layerOrder.indexOf(modifier.layerId) ?? 0,
          });
        });
      });

    return Object.values(cells).map((cell) => ({
      ...cell,
      layers: cell.layers.sort((a, b) => a.order - b.order),
    }));
  }, [modifiers, slotLookup, layout, effectAccumulator, layerLookup, layers]);

  return {
    loading,
    error,
    modifiers,
    layers,
    previews,
    hasUnsavedChanges,
    addModifier,
    updateModifier,
    removeModifier,
    toggleModifierEnabled,
    duplicateModifier,
    toggleLayerVisibility,
    reorderLayer,
    resetToDefaults,
    saveChanges,
    exportConfig,
    importConfig,
    getSlotsForModifier,
  };
}

export default useTerrainModifiers;
