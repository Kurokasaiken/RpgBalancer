/**
 * Character Storage - Async PersistenceService-based persistence
 *
 * Provides async persistence for player-created characters.
 */

import type { Character } from './types';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const STORAGE_KEY = 'rpg_balancer_characters';

/**
 * Load all characters from storage
 */
export async function loadCharacters(): Promise<Character[]> {
    try {
        const parsed = await loadData<Character[]>(STORAGE_KEY, []);
        // Convert date strings back to Date objects
        return parsed.map((char: any) => ({
            ...char,
            createdAt: new Date(char.createdAt),
            modifiedAt: new Date(char.modifiedAt)
        }));
    } catch (error) {
        console.error('Error loading characters:', error);
        return [];
    }
}

/**
 * Save all characters to storage
 */
async function saveCharacters(characters: Character[]): Promise<void> {
    try {
        await saveData(STORAGE_KEY, characters);
    } catch (error) {
        console.error('Error saving characters:', error);
        throw error;
    }
}

/**
 * Save or update a character
 */
export async function upsertCharacter(character: Character): Promise<void> {
    const characters = await loadCharacters();
    const index = characters.findIndex(c => c.id === character.id);

    // Update modifiedAt timestamp
    character.modifiedAt = new Date();

    if (index >= 0) {
        characters[index] = character;
    } else {
        characters.push(character);
    }

    await saveCharacters(characters);
}

/**
 * Delete a character by ID
 */
export async function deleteCharacter(id: string): Promise<void> {
    const characters = (await loadCharacters()).filter(c => c.id !== id);
    await saveCharacters(characters);
}

/**
 * Get a single character by ID
 */
export async function getCharacter(id: string): Promise<Character | undefined> {
    const characters = await loadCharacters();
    return characters.find(c => c.id === id);
}

/**
 * Export a character to JSON string
 */
export function exportCharacterJSON(character: Character): string {
    return JSON.stringify(character, null, 2);
}

/**
 * Import a character from JSON string
 */
export function importCharacterJSON(json: string): Character {
    try {
        const parsed = JSON.parse(json);

        // Validate required fields
        if (!parsed.id || !parsed.name || !parsed.stats) {
            throw new Error('Invalid character JSON: missing required fields');
        }

        // Convert date strings to Date objects
        return {
            ...parsed,
            createdAt: new Date(parsed.createdAt || Date.now()),
            modifiedAt: new Date(parsed.modifiedAt || Date.now())
        };
    } catch (error) {
        console.error('Error importing character:', error);
        throw new Error('Failed to import character: ' + (error as Error).message);
    }
}

/**
 * Export all characters to JSON
 */
export async function exportAllCharactersJSON(): Promise<string> {
    const characters = await loadCharacters();
    return JSON.stringify(characters, null, 2);
}

/**
 * Import multiple characters from JSON
 */
export async function importAllCharactersJSON(json: string): Promise<void> {
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) {
            throw new Error('Invalid format: expected array of characters');
        }

        const characters = parsed.map(char => ({
            ...char,
            createdAt: new Date(char.createdAt || Date.now()),
            modifiedAt: new Date(char.modifiedAt || Date.now())
        }));

        await saveCharacters(characters);
    } catch (error) {
        console.error('Error importing characters:', error);
        throw new Error('Failed to import characters: ' + (error as Error).message);
    }
}

/**
 * Clear all characters (use with caution!)
 */
export async function clearAllCharacters(): Promise<void> {
    await saveData(STORAGE_KEY, []);
}

/**
 * Get character count
 */
export async function getCharacterCount(): Promise<number> {
    const characters = await loadCharacters();
    return characters.length;
}

/**
 * Search characters by name
 */
export async function searchCharactersByName(query: string): Promise<Character[]> {
    const lowerQuery = query.toLowerCase();
    const characters = await loadCharacters();
    return characters.filter(c =>
        c.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Filter characters by archetype
 */
export async function filterCharactersByArchetype(archetype: string): Promise<Character[]> {
    const characters = await loadCharacters();
    return characters.filter(c => c.archetype === archetype);
}

/**
 * Filter characters by tags
 */
export async function filterCharactersByTags(tags: string[]): Promise<Character[]> {
    const characters = await loadCharacters();
    return characters.filter(c =>
        c.tags && c.tags.some(tag => tags.includes(tag))
    );
}
