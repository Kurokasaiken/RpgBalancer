import type { ArchetypeTemplate } from './types';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

/**
 * Definition for an archetype category.
 */
export interface ArchetypeCategoryDef {
    id: string;
    name: string;
    description: string;
    color: string;
}

const STORAGE_KEY = 'rpg_balancer_archetypes_v1';
const CATEGORIES_KEY = 'rpg_balancer_categories_v1';

const DEFAULT_CATEGORIES: ArchetypeCategoryDef[] = [
    { id: 'Tank', name: 'Tank', description: 'High durability, low damage', color: '#3b82f6' },
    { id: 'DPS', name: 'DPS', description: 'High damage, low durability', color: '#ef4444' },
    { id: 'Assassin', name: 'Assassin', description: 'High burst, high mobility', color: '#a855f7' },
    { id: 'Bruiser', name: 'Bruiser', description: 'Balanced damage and durability', color: '#f97316' },
    { id: 'Support', name: 'Support', description: 'Buffs, heals, utility', color: '#22c55e' },
    { id: 'Hybrid', name: 'Hybrid', description: 'Mixed capabilities', color: '#eab308' },
];

/**
 * Singleton class for persisting archetypes and categories using async PersistenceService.
 */
export class ArchetypeStorage {
    private static instance: ArchetypeStorage;

    private constructor() { }

    /**
     * Returns the singleton instance of ArchetypeStorage.
     */
    static getInstance(): ArchetypeStorage {
        if (!ArchetypeStorage.instance) {
            ArchetypeStorage.instance = new ArchetypeStorage();
        }
        return ArchetypeStorage.instance;
    }

    // --- Archetypes ---

    /**
     * Saves or updates an archetype template.
     */
    async saveArchetype(archetype: ArchetypeTemplate): Promise<void> {
        const archetypes = await this.getAllArchetypes();
        const index = archetypes.findIndex(a => a.id === archetype.id);

        if (index >= 0) {
            archetypes[index] = archetype;
        } else {
            archetypes.push(archetype);
        }

        await this.persistArchetypes(archetypes);
    }

    /**
     * Deletes an archetype template by ID.
     */
    async deleteArchetype(id: string): Promise<void> {
        const archetypes = await this.getAllArchetypes();
        const filtered = archetypes.filter(a => a.id !== id);
        await this.persistArchetypes(filtered);
    }

    /**
     * Retrieves an archetype template by ID.
     */
    async getArchetype(id: string): Promise<ArchetypeTemplate | undefined> {
        const archetypes = await this.getAllArchetypes();
        return archetypes.find(a => a.id === id);
    }

    /**
     * Retrieves all stored archetype templates.
     */
    async getAllArchetypes(): Promise<ArchetypeTemplate[]> {
        try {
            return await loadData<ArchetypeTemplate[]>(STORAGE_KEY, []);
        } catch (e) {
            console.error('Failed to load archetypes', e);
            return [];
        }
    }

    /**
     * Persists the archetype array.
     */
    private async persistArchetypes(archetypes: ArchetypeTemplate[]): Promise<void> {
        try {
            await saveData(STORAGE_KEY, archetypes);
        } catch (e) {
            console.error('Failed to save archetypes', e);
        }
    }

    // --- Categories ---

    /**
     * Saves or updates a category definition.
     */
    async saveCategory(category: ArchetypeCategoryDef): Promise<void> {
        const categories = await this.getAllCategories();
        const index = categories.findIndex(c => c.id === category.id);

        if (index >= 0) {
            categories[index] = category;
        } else {
            categories.push(category);
        }

        await this.persistCategories(categories);
    }

    /**
     * Deletes a category definition by ID.
     */
    async deleteCategory(id: string): Promise<void> {
        const categories = await this.getAllCategories();
        // Prevent deleting default categories if needed, or handle logic in UI
        const filtered = categories.filter(c => c.id !== id);
        await this.persistCategories(filtered);
    }

    /**
     * Retrieves all stored category definitions.
     */
    async getAllCategories(): Promise<ArchetypeCategoryDef[]> {
        try {
            const data = await loadData<ArchetypeCategoryDef[]>(CATEGORIES_KEY, null);
            if (!data) {
                // Initialize defaults if empty
                await this.persistCategories(DEFAULT_CATEGORIES);
                return DEFAULT_CATEGORIES;
            }
            return data;
        } catch (e) {
            console.error('Failed to load categories', e);
            return DEFAULT_CATEGORIES;
        }
    }

    /**
     * Persists the category array.
     */
    private async persistCategories(categories: ArchetypeCategoryDef[]): Promise<void> {
        try {
            await saveData(CATEGORIES_KEY, categories);
        } catch (e) {
            console.error('Failed to save categories', e);
        }
    }

    // --- Import/Export ---

    /**
     * Exports all archetypes and categories as JSON string.
     */
    async exportAll(): Promise<string> {
        const data = {
            archetypes: await this.getAllArchetypes(),
            categories: await this.getAllCategories(),
            version: '1.0',
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Imports archetypes and categories from JSON string.
     */
    async importAll(json: string): Promise<{ success: boolean, message: string }> {
        try {
            const data = JSON.parse(json);
            if (!data.archetypes || !Array.isArray(data.archetypes)) {
                return { success: false, message: 'Invalid format: missing archetypes array' };
            }

            // Merge strategy: Overwrite existing IDs, add new ones
            const currentArchetypes = await this.getAllArchetypes();
            const newArchetypes = data.archetypes as ArchetypeTemplate[];

            newArchetypes.forEach(newArch => {
                const index = currentArchetypes.findIndex(curr => curr.id === newArch.id);
                if (index >= 0) {
                    currentArchetypes[index] = newArch;
                } else {
                    currentArchetypes.push(newArch);
                }
            });
            await this.persistArchetypes(currentArchetypes);

            // Merge Categories
            if (data.categories && Array.isArray(data.categories)) {
                const currentCategories = await this.getAllCategories();
                const newCategories = data.categories as ArchetypeCategoryDef[];

                newCategories.forEach(newCat => {
                    const index = currentCategories.findIndex(curr => curr.id === newCat.id);
                    if (index >= 0) {
                        currentCategories[index] = newCat;
                    } else {
                        currentCategories.push(newCat);
                    }
                });
                await this.persistCategories(currentCategories);
            }

            return { success: true, message: `Imported ${newArchetypes.length} archetypes successfully.` };
        } catch (e) {
            return { success: false, message: 'Failed to parse JSON' };
        }
    }
}
