/**
 * Character Storage - Browser-based persistence
 * 
 * Similar to spellStorage.ts, provides localStorage-based
 * persistence for player-created characters.
 */

import type { Character } from './types';

const STORAGE_KEY = 'rpg_balancer_characters';

/**
 * Load all characters from localStorage
 */
export function loadCharacters(): Character[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const parsed = JSON.parse(data);
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
 * Save all characters to localStorage
 */
function saveCharacters(characters: Character[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    } catch (error) {
        console.error('Error saving characters:', error);
        throw error;
    }
}

/**
 * Save or update a character
 */
export function upsertCharacter(character: Character): void {
    const characters = loadCharacters();
    const index = characters.findIndex(c => c.id === character.id);

    // Update modifiedAt timestamp
    character.modifiedAt = new Date();

    if (index >= 0) {
        characters[index] = character;
    } else {
        characters.push(character);
    }

    saveCharacters(characters);
}

/**
 * Delete a character by ID
 */
export function deleteCharacter(id: string): void {
    const characters = loadCharacters().filter(c => c.id !== id);
    saveCharacters(characters);
}

/**
 * Get a single character by ID
 */
export function getCharacter(id: string): Character | undefined {
    return loadCharacters().find(c => c.id === id);
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
export function exportAllCharactersJSON(): string {
    const characters = loadCharacters();
    return JSON.stringify(characters, null, 2);
}

/**
 * Import multiple characters from JSON
 */
export function importAllCharactersJSON(json: string): void {
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

        saveCharacters(characters);
    } catch (error) {
        console.error('Error importing characters:', error);
        throw new Error('Failed to import characters: ' + (error as Error).message);
    }
}

/**
 * Clear all characters (use with caution!)
 */
export function clearAllCharacters(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get character count
 */
export function getCharacterCount(): number {
    return loadCharacters().length;
}

/**
 * Search characters by name
 */
export function searchCharactersByName(query: string): Character[] {
    const lowerQuery = query.toLowerCase();
    return loadCharacters().filter(c =>
        c.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Filter characters by archetype
 */
export function filterCharactersByArchetype(archetype: string): Character[] {
    return loadCharacters().filter(c => c.archetype === archetype);
}

/**
 * Filter characters by tags
 */
export function filterCharactersByTags(tags: string[]): Character[] {
    return loadCharacters().filter(c =>
        c.tags && c.tags.some(tag => tags.includes(tag))
    );
}
