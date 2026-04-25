/**
 * ArchetypeRegistry - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArchetypeRegistry } from '../ArchetypeRegistry';
import type { ArchetypeTemplate } from '../types';
import { TANK_JUGGERNAUT, DPS_BERSERKER, ASSASSIN_SHADOW } from '../constants';

describe('ArchetypeRegistry', () => {
    let registry: ArchetypeRegistry;

    beforeEach(() => {
        // Start with empty registry for most tests
        registry = new ArchetypeRegistry([]);
    });

    it('should add archetype template', () => {
        registry.add(TANK_JUGGERNAUT);

        expect(registry.count).toBe(1);
        expect(registry.get('tank_juggernaut')).toEqual(TANK_JUGGERNAUT);
    });

    it('should get archetype by ID', () => {
        registry.add(TANK_JUGGERNAUT);
        const retrieved = registry.get('tank_juggernaut');

        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Juggernaut');
    });

    it('should update existing archetype', () => {
        registry.add(TANK_JUGGERNAUT);

        const updated: ArchetypeTemplate = {
            ...TANK_JUGGERNAUT,
            name: 'Updated Juggernaut'
        };

        registry.update('tank_juggernaut', updated);
        const retrieved = registry.get('tank_juggernaut');

        expect(retrieved?.name).toBe('Updated Juggernaut');
    });

    it('should delete archetype', () => {
        registry.add(TANK_JUGGERNAUT);
        expect(registry.count).toBe(1);

        const deleted = registry.delete('tank_juggernaut');

        expect(deleted).toBe(true);
        expect(registry.count).toBe(0);
        expect(registry.get('tank_juggernaut')).toBeUndefined();
    });

    it('should list all archetypes', () => {
        registry.add(TANK_JUGGERNAUT);
        registry.add(DPS_BERSERKER);
        registry.add(ASSASSIN_SHADOW);

        const all = registry.listAll();

        expect(all).toHaveLength(3);
    });

    it('should filter by category', () => {
        registry.add(TANK_JUGGERNAUT);
        registry.add(DPS_BERSERKER);
        registry.add(ASSASSIN_SHADOW);

        const tanks = registry.filterByCategory('Tank');
        const dps = registry.filterByCategory('DPS');

        expect(tanks).toHaveLength(1);
        expect(dps).toHaveLength(1);
        expect(tanks[0].id).toBe('tank_juggernaut');
        expect(dps[0].id).toBe('dps_berserker');
    });

    it('should search by name', () => {
        registry.add(TANK_JUGGERNAUT); // "Juggernaut"
        registry.add(DPS_BERSERKER);   // "Berserker"

        const results = registry.searchByName('jugg');

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('tank_juggernaut');
    });

    it('should filter by tags', () => {
        registry.add(TANK_JUGGERNAUT);  // tags: ['defensive', 'physical', 'sustain']
        registry.add(DPS_BERSERKER);    // tags: ['offensive', 'glass-cannon']

        const defensive = registry.filterByTags(['defensive']);
        const offensive = registry.filterByTags(['offensive']);

        expect(defensive).toHaveLength(1);
        expect(offensive).toHaveLength(1);
    });

    it('should save to JSON file', () => {
        registry.add(TANK_JUGGERNAUT);
        registry.add(DPS_BERSERKER);

        const json = registry.toJSON();

        expect(json).toBeDefined();
        expect(json).toContain('tank_juggernaut');
        expect(json).toContain('dps_berserker');
    });

    it('should load from JSON file', () => {
        registry.add(TANK_JUGGERNAUT);
        const json = registry.toJSON();

        const loaded = ArchetypeRegistry.fromJSON(json);

        expect(loaded.count).toBe(1);
        expect(loaded.get('tank_juggernaut')).toEqual(TANK_JUGGERNAUT);
    });
});
