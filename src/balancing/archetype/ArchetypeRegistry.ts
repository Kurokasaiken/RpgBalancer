/**
 * Archetype Registry
 * 
 * CRUD operations for archetype templates with persistence
 */

import type { ArchetypeTemplate } from './types';
import { DEFAULT_ARCHETYPES } from './constants';

export class ArchetypeRegistry {
    private templates: Map<string, ArchetypeTemplate>;

    constructor(initialTemplates: ArchetypeTemplate[] = DEFAULT_ARCHETYPES) {
        this.templates = new Map();
        initialTemplates.forEach(t => this.templates.set(t.id, t));
    }

    /**
     * Add a new archetype template
     */
    add(template: ArchetypeTemplate): void {
        if (this.templates.has(template.id)) {
            throw new Error(`Archetype with id "${template.id}" already exists`);
        }
        this.templates.set(template.id, template);
    }

    /**
     * Get archetype by ID
     */
    get(id: string): ArchetypeTemplate | undefined {
        return this.templates.get(id);
    }

    /**
     * Update existing archetype
     */
    update(id: string, template: ArchetypeTemplate): void {
        if (!this.templates.has(id)) {
            throw new Error(`Archetype with id "${id}" not found`);
        }
        this.templates.set(id, template);
    }

    /**
     * Delete archetype
     */
    delete(id: string): boolean {
        return this.templates.delete(id);
    }

    /**
     * List all archetypes
     */
    listAll(): ArchetypeTemplate[] {
        return Array.from(this.templates.values());
    }

    /**
     * Filter by category
     */
    filterByCategory(category: string): ArchetypeTemplate[] {
        return this.listAll().filter(t => t.category === category);
    }

    /**
     * Search by name (case-insensitive)
     */
    searchByName(query: string): ArchetypeTemplate[] {
        const lowerQuery = query.toLowerCase();
        return this.listAll().filter(t =>
            t.name.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Filter by tags
     */
    filterByTags(tags: string[]): ArchetypeTemplate[] {
        return this.listAll().filter(t =>
            tags.some(tag => t.tags.includes(tag))
        );
    }

    /**
     * Save to JSON
     */
    toJSON(): string {
        const templates = this.listAll();
        return JSON.stringify(templates, null, 2);
    }

    /**
     * Load from JSON
     */
    static fromJSON(json: string): ArchetypeRegistry {
        const templates = JSON.parse(json) as ArchetypeTemplate[];
        return new ArchetypeRegistry(templates);
    }

    /**
     * Get count
     */
    get count(): number {
        return this.templates.size;
    }
}
