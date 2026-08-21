import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { trackTelemetryEvent } from '@/shared/telemetry';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import {
  equippableItems,
  consumables,
} from '@/balancing/config/idleVillage/heroItems';
import type { ConsumableItem, EquippableItem } from '@/balancing/config/idleVillage/heroItems';
import { getAllEquipment } from '@/balancing/equipment/equipmentStorage';
import type { EquipmentItem } from '@/balancing/equipment/equipmentTypes';

/**
 * Persisted hero state for a single resident.
 *
 * Equipment is stored as slot -> item id; inventory and skills are stored as
 * lists of ids with counts. The names and metadata are resolved from the
 * canonical `heroItems` config.
 */
export interface HeroState {
  equipment: Record<string, string | null>;
  inventory: { id: string; count: number }[];
  skills: string[];
}

export interface UseResidentHeroStateOptions {
  /** Base resident (source of truth for identity and base stats). */
  resident: ResidentState;
  /** Maximum number of skills that can be equipped at once. */
  maxSkills?: number;
}

export interface UseResidentHeroStateReturn {
  /** Resident state with hero fields overlaid on `statSnapshot`. */
  resident: ResidentState;
  /** Map slot -> item name, ready for `PgDetailCard` and `EquipSlotRack`. */
  equipment: Record<string, string | null>;
  /** Current consumable counts merged with canonical config. */
  inventory: ConsumableItem[];
  /** Equipped skill ids. */
  skillLoadout: string[];
  /** Equip an item by id in a slot. */
  equip: (slotId: string, itemId: string) => void;
  /** Remove the item from a slot. */
  unequip: (slotId: string) => void;
  /** Consume one unit of a consumable by id. */
  useConsumable: (itemId: string) => void;
  /** Equip/unequip a skill by id. */
  toggleSkill: (skillId: string) => void;
}

const heroStateKey = (residentId: string) => `hero-state:${residentId}`;

const defaultHeroState = (resident: ResidentState): HeroState => ({
  equipment: (resident.statSnapshot?.equipment ?? {}) as Record<string, string | null>,
  inventory: [],
  skills: [],
});

/**
 * `useResidentHeroState` — ties a resident to persisted hero equipment,
 * consumable inventory and skill loadout.
 *
 * The hook resolves canonical item/skill metadata from `heroItems.ts`, persists
 * the mutable state via `PersistenceService`, and returns a synthetic
 * `ResidentState` whose `statSnapshot` includes the current equipment,
 * inventory and skills so `PgDetailCard` can display them.
 */
export function useResidentHeroState({
  resident,
  maxSkills = 3,
}: UseResidentHeroStateOptions): UseResidentHeroStateReturn {
  const [heroState, setHeroState] = useState<HeroState>(() => defaultHeroState(resident));
  const [savedEquipment, setSavedEquipment] = useState<EquipmentItem[]>([]);

  // Load persisted state on mount or when resident id changes.
  useEffect(() => {
    let mounted = true;
    loadData<HeroState>(heroStateKey(resident.id), defaultHeroState(resident)).then(
      (loaded) => {
        if (mounted) setHeroState(loaded);
      },
    );
    getAllEquipment().then((all) => {
      if (mounted) setSavedEquipment(all);
    });
    return () => {
      mounted = false;
    };
  }, [resident]);

  // Autosave the hero state whenever it changes, skipping the initial load.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveData(heroStateKey(resident.id), heroState).catch(() => undefined);
  }, [heroState, resident.id]);

  type EquippableLike = EquippableItem | EquipmentItem;

  const allItems = useMemo<EquippableLike[]>(
    () => [...equippableItems, ...savedEquipment],
    [savedEquipment]
  );

  const equipment = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const [slot, itemId] of Object.entries(heroState.equipment)) {
      const item = allItems.find((i) => i.id === itemId);
      map[slot] = item ? item.name : null;
    }
    return map;
  }, [heroState.equipment, allItems]);

  const equipmentIds = useMemo(() => heroState.equipment, [heroState.equipment]);

  const inventory = useMemo(() => {
    return consumables.map((c) => {
      const saved = heroState.inventory.find((i) => i.id === c.id);
      return { ...c, count: saved ? Math.max(0, saved.count) : c.count };
    });
  }, [heroState.inventory]);

  const equip = useCallback((slotId: string, itemId: string) => {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;
    // Optional slot validation: only allow the item in its declared slot for now.
    if (item.slot !== slotId) return;
    trackTelemetryEvent('hero_equip', {
      residentId: resident.id,
      slotId,
      itemId,
      itemName: item.name,
    });
    setHeroState((prev) => ({
      ...prev,
      equipment: { ...prev.equipment, [slotId]: itemId },
    }));
  }, [resident.id, allItems]);

  const unequip = useCallback((slotId: string) => {
    trackTelemetryEvent('hero_unequip', { residentId: resident.id, slotId });
    setHeroState((prev) => {
      const next = { ...prev.equipment };
      delete next[slotId];
      return { ...prev, equipment: next };
    });
  }, [resident.id]);

  const useConsumable = useCallback((itemId: string) => {
    trackTelemetryEvent('hero_use_consumable', { residentId: resident.id, itemId });
    setHeroState((prev) => {
      const base = consumables.find((c) => c.id === itemId);
      if (!base) return prev;
      const saved = prev.inventory.find((i) => i.id === itemId);
      const currentCount = saved ? saved.count : base.count;
      const nextCount = currentCount - 1;
      if (nextCount <= 0) {
        return {
          ...prev,
          inventory: prev.inventory.filter((i) => i.id !== itemId),
        };
      }
      const nextInventory = prev.inventory.filter((i) => i.id !== itemId);
      nextInventory.push({ id: itemId, count: nextCount });
      return { ...prev, inventory: nextInventory };
    });
  }, [resident.id]);

  const toggleSkill = useCallback(
    (skillId: string) => {
      trackTelemetryEvent('hero_toggle_skill', { residentId: resident.id, skillId });
      setHeroState((prev) => {
        const index = prev.skills.indexOf(skillId);
        if (index >= 0) {
          return { ...prev, skills: prev.skills.filter((id) => id !== skillId) };
        }
        if (prev.skills.length >= maxSkills) {
          return prev;
        }
        return { ...prev, skills: [...prev.skills, skillId] };
      });
    },
    [maxSkills, resident.id],
  );

  const skillLoadout = heroState.skills;

  const syntheticResident = useMemo(
    () =>
      ({
        ...resident,
        statSnapshot: {
          ...resident.statSnapshot,
          equipment: equipmentIds,
          inventory: inventory.map((i) => i.name),
          skills: skillLoadout,
        },
      } as unknown as ResidentState),
    [resident, equipmentIds, inventory, skillLoadout],
  );

  return {
    resident: syntheticResident,
    equipment,
    inventory,
    skillLoadout,
    equip,
    unequip,
    useConsumable,
    toggleSkill,
  };
}
