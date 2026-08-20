import { useState, useCallback } from 'react';

/**
 * Minimal skill loadout hook for the hero components placeholder.
 *
 * Keeps a list of currently equipped skill ids. The deck has a fixed number of
 * slots; the caller must pass a `maxSlots` value.
 */
export interface UseSkillLoadoutOptions {
  /** Maximum number of skills that can be equipped at once. */
  maxSlots: number;
  /** Initial equipped skill ids. */
  initial?: string[];
}

export interface UseSkillLoadoutReturn {
  /** Currently equipped skill ids. */
  loadout: string[];
  /** Equip a skill if a slot is free, or remove it if already present. */
  toggleSkill: (skillId: string) => void;
  /** Remove a skill from the loadout. */
  unequipSkill: (skillId: string) => void;
}

export function useSkillLoadout({
  maxSlots,
  initial = [],
}: UseSkillLoadoutOptions): UseSkillLoadoutReturn {
  const [loadout, setLoadout] = useState<string[]>(initial.slice(0, maxSlots));

  const toggleSkill = useCallback(
    (skillId: string) => {
      setLoadout((prev) => {
        const index = prev.indexOf(skillId);
        if (index >= 0) {
          return prev.filter((id) => id !== skillId);
        }
        if (prev.length >= maxSlots) {
          return prev;
        }
        return [...prev, skillId];
      });
    },
    [maxSlots],
  );

  const unequipSkill = useCallback((skillId: string) => {
    setLoadout((prev) => prev.filter((id) => id !== skillId));
  }, []);

  return { loadout, toggleSkill, unequipSkill };
}
