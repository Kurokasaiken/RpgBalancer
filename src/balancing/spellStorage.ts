/**
 * Spell persistence utilities.
 * Provides a synchronous API (matching legacy expectations) backed by
 * a cached snapshot + async synchronization through PersistenceService.
 */

import type { Spell } from './spellTypes';
import { DEFAULT_SPELLS } from './defaultSpells';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const STORAGE_KEY = 'idle_combat_spells';

let cachedSpells: Spell[] | null = null;
let hydrationPromise: Promise<Spell[]> | null = null;

const cloneSpells = (spells: Spell[]): Spell[] => structuredClone(spells);

const readFromLocalStorage = (): Spell[] | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Spell[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeToLocalStorage = (spells: Spell[]): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spells));
  } catch {
    // Best effort only – ignore quota errors silently.
  }
};

const hydrateFromPersistence = async (): Promise<Spell[]> => {
  try {
    const spells = await loadData<Spell[]>(STORAGE_KEY, DEFAULT_SPELLS);
    const normalized = Array.isArray(spells) ? spells : DEFAULT_SPELLS;
    cachedSpells = cloneSpells(normalized);
    writeToLocalStorage(cachedSpells);
    return cachedSpells;
  } catch (error) {
    console.error('Failed to load spells from persistence', error);
    cachedSpells = cloneSpells(DEFAULT_SPELLS);
    return cachedSpells;
  } finally {
    hydrationPromise = null;
  }
};

/**
 * Ensures the in-memory cache is populated, kicking off an async hydration pass
 * the first time it is accessed.
 */
const ensureCache = (): Spell[] => {
  if (cachedSpells) {
    return cachedSpells;
  }

  cachedSpells = readFromLocalStorage() ?? cloneSpells(DEFAULT_SPELLS);

  if (!hydrationPromise) {
    hydrationPromise = hydrateFromPersistence();
  }

  return cachedSpells;
};

/**
 * Initialize default spells if not present in persistence.
 */
export async function initializeDefaultSpells(): Promise<void> {
  try {
    const existing = await loadData<Spell[]>(STORAGE_KEY, []);
    if (!Array.isArray(existing) || existing.length === 0) {
      await saveData(STORAGE_KEY, DEFAULT_SPELLS);
      cachedSpells = cloneSpells(DEFAULT_SPELLS);
      writeToLocalStorage(cachedSpells);
    }
  } catch (error) {
    console.error('Failed to initialize default spells:', error);
  }
}

/**
 * Retrieve all saved spells synchronously (from cache) while scheduling an async hydration.
 */
export function loadSpells(): Spell[] {
  return ensureCache();
}

/**
 * Force an async refresh of the spell cache and return the resolved list.
 */
export async function loadSpellsAsync(): Promise<Spell[]> {
  if (hydrationPromise) {
    return hydrationPromise;
  }
  hydrationPromise = hydrateFromPersistence();
  return hydrationPromise;
}

/**
 * Save the entire spell list and update cache/localStorage.
 */
export async function saveSpells(spells: Spell[]): Promise<void> {
  const normalized = cloneSpells(spells);
  cachedSpells = normalized;
  writeToLocalStorage(normalized);
  try {
    await saveData(STORAGE_KEY, normalized);
  } catch (error) {
    console.error('Failed to save spells', error);
  }
}

/**
 * Add or update a single spell.
 */
export async function upsertSpell(spell: Spell): Promise<void> {
  const spells = cloneSpells(loadSpells());
  const idx = spells.findIndex((s) => s.id === spell.id);
  if (idx >= 0) {
    spells[idx] = spell;
  } else {
    spells.push(spell);
  }
  await saveSpells(spells);
}

/**
 * Delete a spell by id.
 */
export async function deleteSpell(id: string): Promise<void> {
  const spells = cloneSpells(loadSpells()).filter((s) => s.id !== id);
  await saveSpells(spells);
}
