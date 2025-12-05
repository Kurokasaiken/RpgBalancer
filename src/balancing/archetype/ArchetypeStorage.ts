import type { ArchetypeTemplate } from './types';

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

export class ArchetypeStorage {
    private static instance: ArchetypeStorage;

    private constructor() { }

    static getInstance(): ArchetypeStorage {
        if (!ArchetypeStorage.instance) {
            ArchetypeStorage.instance = new ArchetypeStorage();
        }
        return ArchetypeStorage.instance;
    }

    // --- Archetypes ---

    saveArchetype(archetype: ArchetypeTemplate): void {
        const archetypes = this.getAllArchetypes();
        const index = archetypes.findIndex(a => a.id === archetype.id);

        if (index >= 0) {
            archetypes[index] = archetype;
        } else {
            archetypes.push(archetype);
        }

        this.persistArchetypes(archetypes);
    }

    deleteArchetype(id: string): void {
        const archetypes = this.getAllArchetypes();
        const filtered = archetypes.filter(a => a.id !== id);
        this.persistArchetypes(filtered);
    }

    getArchetype(id: string): ArchetypeTemplate | undefined {
        return this.getAllArchetypes().find(a => a.id === id);
    }

    getAllArchetypes(): ArchetypeTemplate[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load archetypes', e);
            return [];
        }
    }

    private persistArchetypes(archetypes: ArchetypeTemplate[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(archetypes));
        } catch (e) {
            console.error('Failed to save archetypes', e);
        }
    }

    // --- Categories ---

    saveCategory(category: ArchetypeCategoryDef): void {
        const categories = this.getAllCategories();
        const index = categories.findIndex(c => c.id === category.id);

        if (index >= 0) {
            categories[index] = category;
        } else {
            categories.push(category);
        }

        this.persistCategories(categories);
    }

    deleteCategory(id: string): void {
        const categories = this.getAllCategories();
        // Prevent deleting default categories if needed, or handle logic in UI
        const filtered = categories.filter(c => c.id !== id);
        this.persistCategories(filtered);
    }

    getAllCategories(): ArchetypeCategoryDef[] {
        try {
            const data = localStorage.getItem(CATEGORIES_KEY);
            if (!data) {
                // Initialize defaults if empty
                this.persistCategories(DEFAULT_CATEGORIES);
                return DEFAULT_CATEGORIES;
            }
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to load categories', e);
            return DEFAULT_CATEGORIES;
        }
    }

    private persistCategories(categories: ArchetypeCategoryDef[]): void {
        try {
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        } catch (e) {
            console.error('Failed to save categories', e);
        }
    }

    // --- Import/Export ---

    exportAll(): string {
        const data = {
            archetypes: this.getAllArchetypes(),
            categories: this.getAllCategories(),
            version: '1.0',
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    importAll(json: string): { success: boolean, message: string } {
        try {
            const data = JSON.parse(json);
            if (!data.archetypes || !Array.isArray(data.archetypes)) {
                return { success: false, message: 'Invalid format: missing archetypes array' };
            }

            // Merge strategy: Overwrite existing IDs, add new ones
            const currentArchetypes = this.getAllArchetypes();
            const newArchetypes = data.archetypes as ArchetypeTemplate[];

            newArchetypes.forEach(newArch => {
                const index = currentArchetypes.findIndex(curr => curr.id === newArch.id);
                if (index >= 0) {
                    currentArchetypes[index] = newArch;
                } else {
                    currentArchetypes.push(newArch);
                }
            });
            this.persistArchetypes(currentArchetypes);

            // Merge Categories
            if (data.categories && Array.isArray(data.categories)) {
                const currentCategories = this.getAllCategories();
                const newCategories = data.categories as ArchetypeCategoryDef[];

                newCategories.forEach(newCat => {
                    const index = currentCategories.findIndex(curr => curr.id === newCat.id);
                    if (index >= 0) {
                        currentCategories[index] = newCat;
                    } else {
                        currentCategories.push(newCat);
                    }
                });
                this.persistCategories(currentCategories);
            }

            return { success: true, message: `Imported ${newArchetypes.length} archetypes successfully.` };
        } catch (e) {
            return { success: false, message: 'Failed to parse JSON' };
        }
    }
}
