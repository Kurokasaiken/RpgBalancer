import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const CHARACTER_STORAGE_KEY = 'idle_combat_characters';
const CHARACTER_STORAGE_UPDATED_EVENT = 'characterStorageUpdated';

const hasWindow = () => typeof window !== 'undefined';

function emitUpdateEvent() {
  if (!hasWindow()) return;
  try {
    window.dispatchEvent(new CustomEvent(CHARACTER_STORAGE_UPDATED_EVENT));
  } catch {
    // Ignore CustomEvent failures (e.g., non-browser contexts).
  }
}

/**
 * Ensures the character persistence layer is initialized.
 */
export async function initializeCharacterPersistence(): Promise<void> {
  // Check if data exists, if not initialize with empty array
  const existing = await loadData(CHARACTER_STORAGE_KEY, null);
  if (existing === null) {
    await saveData(CHARACTER_STORAGE_KEY, []);
  }
}

/**
 * Retrieves the character snapshot.
 */
export async function readCharacterSnapshot(): Promise<string | null> {
  try {
    const data = await loadData(CHARACTER_STORAGE_KEY, null);
    return data ? JSON.stringify(data) : null;
  } catch {
    return null;
  }
}

/**
 * Persists the given JSON snapshot.
 */
export async function writeCharacterSnapshot(payload: string): Promise<void> {
  try {
    const parsed = JSON.parse(payload);
    await saveData(CHARACTER_STORAGE_KEY, parsed);
    emitUpdateEvent();
  } catch (error) {
    console.error('Failed to write character snapshot:', error);
  }
}

/**
 * Returns the storage key used for character persistence.
 */
export function getCharacterStorageKey(): string {
  return CHARACTER_STORAGE_KEY;
}

/**
 * Returns the DOM event name dispatched whenever the snapshot is updated.
 */
export function getCharacterStorageEventName(): string {
  return CHARACTER_STORAGE_UPDATED_EVENT;
}
