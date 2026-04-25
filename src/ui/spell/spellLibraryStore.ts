import type { Spell } from '@/balancing/spellTypes';
import { sortSpellsByName } from '@/balancing/spellCreator/SpellLibraryHelpers';

type Listener = () => void;

let snapshot: Spell[] = [];
const listeners = new Set<Listener>();

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

export const subscribeSpellLibrary = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getSpellLibrarySnapshot = (): Spell[] => snapshot;

export const setSpellLibrarySnapshot = (spells: Spell[]): void => {
  snapshot = sortSpellsByName(spells);
  notify();
};
