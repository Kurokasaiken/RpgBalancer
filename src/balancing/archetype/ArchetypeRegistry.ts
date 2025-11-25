/**
 * Archetype Registry - CRUD and search operations for archetypes
 * 
 * Provides high-level API over storage layer with:
 * - CRUD operations
 * - Search and filtering
 * - Tag management
 * - Validation
 */

import type { ArchetypeTemplate } from './types';
import {
    loadArchetypes,
    saveArchetypes,
    upsertArchetype as storageUpsert,
    deleteArchetype as storageDelete,
    getArchetype as storageGet,
} from './storage';

/**
 * List all archetype templates
 */
export function listArchetypes(): ArchetypeTemplate[] {
    return loadArchetypes();
}

/**
 * Get archetype by ID
 */
export function getArchetype(id: string): ArchetypeTemplate | undefined {
    return storageGet(id);
}

/**
 * Add or update archetype template
 */
export function upsertArchetype(archetype: ArchetypeTemplate): void {
    // Validate before saving
    validateArchetypeTemplate(archetype);

    storageUpsert(archetype);
}

/**
 * Delete archetype template
 */
export function deleteArchetype(id: string): void {
    storageDelete(id);
}

/**
 * Create new archetype template with generated ID
 */
export function createArchetype(
    data: Omit<ArchetypeTemplate, 'id' | 'createdBy'>
): ArchetypeTemplate {
    const id = generateArchetypeId(data.name);

    const archetype: ArchetypeTemplate = {
        ...data,
        id,
        createdBy: 'user',
    };

    upsertArchetype(archetype);
    return archetype;
}

/**
 * Clone existing archetype with new name
 */
export function cloneArchetype(
    sourceId: string,
    newName: string
): ArchetypeTemplate | null {
    const source = getArchetype(sourceId);
    if (!source) return null;

    const clone: ArchetypeTemplate = {
        ...source,
        id: generateArchetypeId(newName),
        name: newName,
        createdBy: 'user',
        testResults: undefined, // Clear test results
    };

    upsertArchetype(clone);
    return clone;
}

/**
 * Filter archetypes by category
 */
export function filterByCategory(
    category: ArchetypeTemplate['category']
): ArchetypeTemplate[] {
    return loadArchetypes().filter(a => a.category === category);
}

/**
 * Search archetypes by name (case-insensitive, partial match)
 */
export function searchByName(query: string): ArchetypeTemplate[] {
    const lowerQuery = query.toLowerCase();
    return loadArchetypes().filter(a =>
        a.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Filter archetypes by tags
 * 
 * @param tags - Array of tags to match (OR logic)
 * @param requireAll - If true, use AND logic (all tags must match)
 */
export function filterByTags(
    tags: string[],
    requireAll: boolean = false
): ArchetypeTemplate[] {
    return loadArchetypes().filter(archetype => {
        if (requireAll) {
            // All tags must be present
            return tags.every(tag => archetype.tags.includes(tag));
        } else {
            // At least one tag must match
            return tags.some(tag => archetype.tags.includes(tag));
        }
    });
}

/**
 * Get all unique tags across all archetypes
 */
export function getAllTags(): string[] {
    const allTags = new Set<string>();

    loadArchetypes().forEach(archetype => {
        archetype.tags.forEach(tag => allTags.add(tag));
    });

    return Array.from(allTags).sort();
}

/**
 * Add tag to archetype
 */
export function addTag(archetypeId: string, tag: string): void {
    const archetype = getArchetype(archetypeId);
    if (!archetype) throw new Error(`Archetype not found: ${archetypeId}`);

    if (!archetype.tags.includes(tag)) {
        archetype.tags.push(tag);
        upsertArchetype(archetype);
    }
}

/**
 * Remove tag from archetype
 */
export function removeTag(archetypeId: string, tag: string): void {
    const archetype = getArchetype(archetypeId);
    if (!archetype) throw new Error(`Archetype not found: ${archetypeId}`);

    archetype.tags = archetype.tags.filter(t => t !== tag);
    upsertArchetype(archetype);
}

/**
 * Get archetypes by variant within a category
 */
export function getByVariant(
    category: ArchetypeTemplate['category'],
    variant: string
): ArchetypeTemplate | undefined {
    return loadArchetypes().find(
        a => a.category === category && a.variant === variant
    );
}

/**
 * Count archetypes by category
 */
export function countByCategory(): Record<ArchetypeTemplate['category'], number> {
    const counts = {
        tank: 0,
        dps: 0,
        assassin: 0,
        bruiser: 0,
        support: 0,
    } as Record<ArchetypeTemplate['category'], number>;

    loadArchetypes().forEach(archetype => {
        counts[archetype.category]++;
    });

    return counts;
}

/**
 * Get archetypes sorted by test performance
 */
export function getSortedByPerformance(descending: boolean = true): ArchetypeTemplate[] {
    const archetypes = loadArchetypes().filter(a => a.testResults !== undefined);

    return archetypes.sort((a, b) => {
        const scoreA = a.testResults?.avgWinRate || 0;
        const scoreB = b.testResults?.avgWinRate || 0;

        return descending ? scoreB - scoreA : scoreA - scoreB;
    });
}

/**
 * Find counter matchups (archetypes that beat each other)
 */
export function findCounters(archetypeId: string): {
    strongAgainst: ArchetypeTemplate[];
    weakAgainst: ArchetypeTemplate[];
} {
    const archetype = getArchetype(archetypeId);
    if (!archetype || !archetype.testResults) {
        return { strongAgainst: [], weakAgainst: [] };
    }

    const allArchetypes = loadArchetypes();

    const strongAgainst = allArchetypes.filter(a =>
        archetype.testResults!.counters.includes(a.id)
    );

    const weakAgainst = allArchetypes.filter(a =>
        archetype.testResults!.counteredBy.includes(a.id)
    );

    return { strongAgainst, weakAgainst };
}

/**
 * Validate archetype template
 */
function validateArchetypeTemplate(archetype: ArchetypeTemplate): void {
    const errors: string[] = [];

    // Check required fields
    if (!archetype.id) errors.push('ID is required');
    if (!archetype.name) errors.push('Name is required');
    if (!archetype.category) errors.push('Category is required');
    if (!archetype.variant) errors.push('Variant is required');

    // Check budget constraints
    if (archetype.minBudget < 0) {
        errors.push('minBudget cannot be negative');
    }
    if (archetype.maxBudget <= archetype.minBudget) {
        errors.push('maxBudget must be greater than minBudget');
    }

    // Check stat allocation
    const allocSum = Object.values(archetype.statAllocation).reduce(
        (acc, val) => acc + val,
        0
    );
    if (Math.abs(allocSum - 100) > 0.1) {
        errors.push(`Stat allocation sum is ${allocSum}%, expected 100%`);
    }

    if (errors.length > 0) {
        throw new Error(`Invalid archetype template: ${errors.join(', ')}`);
    }
}

/**
 * Generate unique archetype ID from name
 */
function generateArchetypeId(name: string): string {
    // Convert to lowercase, replace spaces with underscores
    const base = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Check if ID already exists
    const existing = getArchetype(base);
    if (!existing) return base;

    // Append number suffix
    let counter = 1;
    let id = `${base}_${counter}`;
    while (getArchetype(id)) {
        counter++;
        id = `${base}_${counter}`;
    }

    return id;
}

/**
 * Export archetypes by category
 */
export function exportByCategory(category: ArchetypeTemplate['category']): ArchetypeTemplate[] {
    return filterByCategory(category);
}

/**
 * Bulk import archetypes
 */
export function bulkImport(archetypes: ArchetypeTemplate[]): {
    imported: number;
    skipped: number;
    errors: string[];
} {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    archetypes.forEach(archetype => {
        try {
            validateArchetypeTemplate(archetype);

            // Check if already exists
            const existing = getArchetype(archetype.id);
            if (existing) {
                skipped++;
                return;
            }

            upsertArchetype(archetype);
            imported++;
        } catch (error) {
            errors.push(`Failed to import ${archetype.id}: ${error}`);
        }
    });

    return { imported, skipped, errors };
}

/**
 * Reset all archetypes to system defaults
 * (Re-run seeding)
 */
export function resetToDefaults(): void {
    // This would import BASE_ARCHETYPES from seedArchetypes
    // For now, just clear and user can re-run seed script
    saveArchetypes([]);
}
