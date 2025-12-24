// src/engine/idle/characterStorage.ts

import type { StatBlock } from '../../balancing/types';
import { DEFAULT_STATS } from '../../balancing/types';

const STORAGE_KEY = 'idle_combat_characters';
const STORAGE_UPDATED_EVENT = 'characterStorageUpdated';

const hasWindow = () => typeof window !== 'undefined';

function emitCharacterStorageUpdated(): void {
  if (!hasWindow()) return;
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_UPDATED_EVENT));
  } catch {
    // Ignore CustomEvent failures in non-browser runtimes.
  }
}

export function getCharacterStorageEventName(): string {
  return STORAGE_UPDATED_EVENT;
}

export interface SavedCharacter {
    id: string;
    name: string;
    aiBehavior: 'tank' | 'dps' | 'support' | 'random';
    statBlock: StatBlock; // Use balancing StatBlock instead of custom attributes
    equippedSpellIds: string[]; // Store spell IDs instead of full spell objects
}

export function saveCharacter(character: SavedCharacter): void {
    const characters = loadCharacters();
    const existingIndex = characters.findIndex(c => c.id === character.id);

    if (existingIndex >= 0) {
        characters[existingIndex] = character;
    } else {
        characters.push(character);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    emitCharacterStorageUpdated();
}

export function loadCharacters(): SavedCharacter[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        const parsed = JSON.parse(stored) as SavedCharacter[];
        // Migrate/Merge with defaults to ensure new fields exist
        return parsed.map(char => ({
            ...char,
            statBlock: {
                ...DEFAULT_STATS,
                ...char.statBlock,
            }
        }));
    } catch {
        return [];
    }
}

export function deleteCharacter(id: string): void {
    const characters = loadCharacters().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    emitCharacterStorageUpdated();
}

export function getCharacter(id: string): SavedCharacter | null {
    const characters = loadCharacters();
    return characters.find(c => c.id === id) || null;
}
