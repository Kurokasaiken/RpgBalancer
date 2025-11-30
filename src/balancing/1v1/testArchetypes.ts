/**
 * Test Archetypes - Registry-Based Loading
 * 
 * Loads test archetypes from fixtures using ArchetypeRegistry and ArchetypeBuilder.
 * Replaces hardcoded arrays to enforce Single Source of Truth architecture.
 */

import type { Archetype } from './types';
import { ArchetypeBuilder } from '../archetype/ArchetypeBuilder';
import testArchetypesJSON from '../archetype/fixtures/test_archetypes.json';

/**
 * Load test archetypes from fixtures
 */
export async function loadTestArchetypes(): Promise<Archetype[]> {
    // Use ArchetypeBuilder methods directly (it's a namespace, not a class)
    const budget = 100;
    const archetypes: Archetype[] = [];

    for (const template of testArchetypesJSON) {
        const instance = ArchetypeBuilder.buildArchetype(template as any, budget);

        archetypes.push({
            id: template.id,
            name: template.name,
            role: template.category as any,
            description: template.description,
            stats: instance,
            meta: {
                createdBy: 'system',
                createdAt: new Date().toISOString(),
            },
        });
    }

    return archetypes;
}

/**
 * Get archetype by ID (lazy-loaded)
 */
let cachedArchetypes: Archetype[] | null = null;

export async function getArchetype(id: string): Promise<Archetype | undefined> {
    if (!cachedArchetypes) {
        cachedArchetypes = await loadTestArchetypes();
    }
    return cachedArchetypes.find(a => a.id === id);
}

/**
 * Get all archetype IDs
 */
export function getAllArchetypeIds(): string[] {
    return testArchetypesJSON.map(t => t.id);
}

/**
 * Synchronous version for compatibility (uses cached data)
 * Note: Must call loadTestArchetypes() first to populate cache
 */
export function getArchetypeSync(id: string): Archetype | undefined {
    if (!cachedArchetypes) {
        throw new Error('Archetypes not loaded. Call loadTestArchetypes() first.');
    }
    return cachedArchetypes.find(a => a.id === id);
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use loadTestArchetypes() instead
 */
export const TEST_ARCHETYPES_PROMISE = loadTestArchetypes();
