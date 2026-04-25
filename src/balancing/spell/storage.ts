/**
 * Spell storage – JSON persistence for SpellTemplate objects.
 * Mirrors the archetype storage implementation.
 */

import type { SpellTemplate } from './types';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPELLS_PATH = join(__dirname, 'spells.json');

/** Load all spells from JSON file */
export function loadSpells(): SpellTemplate[] {
    if (!existsSync(SPELLS_PATH)) {
        console.warn('spells.json not found – returning empty array');
        return [];
    }
    const data = readFileSync(SPELLS_PATH, 'utf-8');
    return JSON.parse(data) as SpellTemplate[];
}

/** Save the full spell array to disk */
export function saveSpells(spells: SpellTemplate[]): void {
    writeFileSync(SPELLS_PATH, JSON.stringify(spells, null, 2), 'utf-8');
}

/** Insert or update a spell */
export function upsertSpell(spell: SpellTemplate): void {
    const spells = loadSpells();
    const idx = spells.findIndex(s => s.id === spell.id);
    if (idx >= 0) {
        spells[idx] = spell;
    } else {
        spells.push(spell);
    }
    saveSpells(spells);
}

/** Delete a spell by id */
export function deleteSpell(id: string): void {
    const spells = loadSpells().filter(s => s.id !== id);
    saveSpells(spells);
}

/** Retrieve a spell by id */
export function getSpell(id: string): SpellTemplate | undefined {
    return loadSpells().find(s => s.id === id);
}
