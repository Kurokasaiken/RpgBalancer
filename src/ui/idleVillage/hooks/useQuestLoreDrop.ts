import { useEffect, useMemo, useState } from 'react';
import type { LoreDrop, LoreDropAssignableTo } from '@/balancing/config/lore/loreDropTypes';
import { useLoreDropStore } from '@/store/loreDropStore';

export interface UseQuestLoreDropParams {
  /** Runtime id of the entity the drop is attached to (e.g. activity id). */
  entityId?: string | null;
  /** Entity type used to filter compatible lore drops. */
  entityType: LoreDropAssignableTo;
  /** Tags used for matching against drop tags. */
  tags?: string[];
  /** Whether the entity has been completed, triggering discovery. */
  completed?: boolean;
}

export interface UseQuestLoreDropResult {
  /** The assigned lore drop, if any. */
  loreDrop: LoreDrop | null;
  /** Whether the assigned drop has been discovered. */
  isDiscovered: boolean;
  /** Whether the persisted store has finished loading. */
  loaded: boolean;
}

/**
 * Hook that assigns and discovers a lore drop for a given entity.
 *
 * It lazily loads the persisted lore drop state, assigns a compatible drop
 * once (if available), and marks it as discovered when `completed` becomes true.
 */
export function useQuestLoreDrop({
  entityId,
  entityType,
  tags,
  completed,
}: UseQuestLoreDropParams): UseQuestLoreDropResult {
  const loaded = useLoreDropStore((state) => state.loaded);
  const assign = useLoreDropStore((state) => state.assignLoreDropToEntity);
  const discover = useLoreDropStore((state) => state.discoverLoreDropForEntity);
  const [assignedId, setAssignedId] = useState<string | null>(null);

  // Hydrate the store on first mount.
  useEffect(() => {
    useLoreDropStore.getState().load();
  }, []);

  // Assign a drop once the store is loaded and an entity id is known.
  const tagsKey = tags?.join(',') ?? '';
  useEffect(() => {
    if (!loaded || !entityId) return;

    const existing = useLoreDropStore.getState().assigned[entityId];
    if (existing) {
      setAssignedId(existing.loreDropId);
      return;
    }

    const assignment = assign({ id: entityId, type: entityType, tags }, Math.random);
    if (assignment) {
      setAssignedId(assignment.loreDropId);
    }
  }, [loaded, entityId, entityType, tagsKey, assign]);

  // Discover the drop when the entity is completed.
  useEffect(() => {
    if (!completed || !entityId || !loaded) return;
    discover(entityId);
  }, [completed, entityId, loaded, discover]);

  const loreDrop = useLoreDropStore(
    useMemo(
      () => (state) => {
        const id = assignedId || (entityId ? state.assigned[entityId ?? '']?.loreDropId : null);
        if (!id) return null;
        return state.pool.find((drop) => drop.id === id) ?? null;
      },
      [assignedId, entityId],
    ),
  );

  const isDiscovered = useLoreDropStore(
    useMemo(
      () => (state) => {
        if (!entityId) return false;
        return Boolean(state.assigned[entityId]?.discovered);
      },
      [entityId],
    ),
  );

  return { loreDrop, isDiscovered, loaded };
}
