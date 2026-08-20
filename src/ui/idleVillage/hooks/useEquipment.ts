import { useState, useCallback } from 'react';

/**
 * Minimal equipment state hook for the hero components placeholder.
 *
 * Maps a slot id to the currently equipped item name. The state is local by
 * default; the caller can lift it to a store when the system requires
 * persistence or cross-page sharing.
 */
export interface UseEquipmentOptions {
  /** Initial slot-to-item mapping. Empty slots are omitted or `null`. */
  initial?: Record<string, string | null>;
}

export interface UseEquipmentReturn {
  /** Current equipment mapping. */
  equipment: Record<string, string | null>;
  /** Equip `item` in the given slot. */
  equip: (slotId: string, item: string) => void;
  /** Remove the item from the given slot. */
  unequip: (slotId: string) => void;
  /** Toggle an item: unequip if already present, otherwise equip. */
  toggle: (slotId: string, item: string) => void;
}

export function useEquipment(options: UseEquipmentOptions = {}): UseEquipmentReturn {
  const [equipment, setEquipment] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    const source = options.initial ?? {};
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && value !== undefined) {
        initial[key] = value;
      }
    }
    return initial;
  });

  const equip = useCallback((slotId: string, item: string) => {
    setEquipment((prev) => ({ ...prev, [slotId]: item }));
  }, []);

  const unequip = useCallback((slotId: string) => {
    setEquipment((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  const toggle = useCallback(
    (slotId: string, item: string) => {
      if (equipment[slotId] === item) {
        unequip(slotId);
      } else {
        equip(slotId, item);
      }
    },
    [equipment, equip, unequip],
  );

  return { equipment, equip, unequip, toggle };
}
