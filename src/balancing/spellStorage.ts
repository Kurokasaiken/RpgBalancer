// Spell persistence utilities (localStorage based)

import type { Spell } from "./spellTypes";
import { DEFAULT_SPELLS } from './defaultSpells';

const STORAGE_KEY = "idle_combat_spells";

/** Initialize localStorage with default spells if empty */
export function initializeDefaultSpells(): void {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SPELLS));
        } catch (error) {
            console.error("Failed to initialize default spells:", error);
        }
    }
}

/** Retrieve all saved spells from localStorage */
export function loadSpells(): Spell[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        // If no spells are stored, initialize with defaults and then load them.
        initializeDefaultSpells();
        const initializedRaw = window.localStorage.getItem(STORAGE_KEY);
        if (initializedRaw) {
            try {
                const parsed = JSON.parse(initializedRaw) as Spell[];
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                console.error("Failed to parse initialized default spells from localStorage");
                return [];
            }
        }
        return []; // Should not happen if initializeDefaultSpells works
    }
    try {
        const parsed = JSON.parse(raw) as Spell[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.error("Failed to parse spells from localStorage");
        return [];
    }
}

/** Save the entire spell list back to localStorage */
export function saveSpells(spells: Spell[]): void {
    if (typeof window === "undefined") return;
    try {
        const serialized = JSON.stringify(spells);
        window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
        console.error("Failed to serialize spells for localStorage");
    }
}

/** Add or update a single spell */
export function upsertSpell(spell: Spell): void {
    const spells = loadSpells();
    const idx = spells.findIndex((s) => s.id === spell.id);
    if (idx >= 0) spells[idx] = spell;
    else spells.push(spell);
    saveSpells(spells);
}

/** Delete a spell by id */
export function deleteSpell(id: string): void {
    const spells = loadSpells().filter((s) => s.id !== id);
    saveSpells(spells);
}
