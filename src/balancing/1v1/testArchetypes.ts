import type { Archetype } from './types';
import { BASELINE_STATS } from '../baseline';

/**
 * Test Archetypes for Balance Analysis
 * 
 * Each archetype has specific stat distributions to test different combat styles:
 * - Tank: High HP, high armor, low damage
 * - DPS: High damage, low armor, medium HP
 * - Assassin: Very high damage, very low armor, low HP
 * - Bruiser: Medium everything (balanced)
 * - Evasive: High evasion, low armor, medium HP
 * - Sustain: High regen + lifesteal, medium damage
 */

export const TEST_ARCHETYPES: Archetype[] = [
    {
        id: 'Tank',
        name: 'Tank',
        role: 'Tank',
        description: 'High survivability, low damage',
        stats: {
            ...BASELINE_STATS,
            hp: 160,
            damage: 22,
            armor: 25,
            resistance: 10,
        },
        meta: {
            createdBy: 'system',
            createdAt: new Date().toISOString(),
        },
    },
    {
        id: 'DPS',
        name: 'DPS',
        role: 'Damage Dealer',
        description: 'High damage, low survivability',
        stats: {
            ...BASELINE_STATS,
            hp: 100,
            damage: 32,
            armor: 5,
            resistance: 5,
        },
        meta: {
            createdBy: 'system',
            createdAt: new Date().toISOString(),
        },
    },
    {
        id: 'Assassin',
        name: 'Assassin',
        role: 'Burst Damage',
        description: 'Extreme damage, glass cannon',
        stats: {
            ...BASELINE_STATS,
            hp: 80,
            damage: 38,
            armor: 3,
            resistance: 3,
            critChance: 25,
            critMult: 2.2,
        },
        meta: {
            createdBy: 'system',
            createdAt: new Date().toISOString(),
        },
    },
    {
        id: 'Bruiser',
        name: 'Bruiser',
        role: 'Balanced Fighter',
        description: 'Balanced stats across the board',
        stats: {
            ...BASELINE_STATS,
            hp: 120,
            damage: 25,
            armor: 12,
            resistance: 8,
        },
        meta: {
            createdBy: 'system',
            createdAt: new Date().toISOString(),
        },
    },
    {
        id: 'Evasive',
        name: 'Evasive',
        role: 'Dodge Tank',
        description: 'High evasion, low armor',
        stats: {
            ...BASELINE_STATS,
            hp: 90,
            damage: 22,
            armor: 5,
            resistance: 5,
            txc: 80,
            evasion: 15,
        },
        meta: {
            createdBy: 'system',
            createdAt: new Date().toISOString(),
        },
    },
    {
        id: 'Sustain',
        name: 'Sustain',
        role: 'Healer Fighter',
        description: 'High regeneration and lifesteal',
        stats: {
            ...BASELINE_STATS,
            hp: 120,
            damage: 28,
            armor: 10,
            resistance: 8,
            regen: 12,
            lifesteal: 0.35,
        },
        meta: {
            createdBy: 'system',
            createdAt: new Date().toISOString(),
        },
    },
];

/**
 * Get archetype by ID
 */
export function getArchetype(id: string): Archetype | undefined {
    return TEST_ARCHETYPES.find(a => a.id === id);
}

/**
 * Get all archetype IDs
 */
export function getAllArchetypeIds(): string[] {
    return TEST_ARCHETYPES.map(a => a.id);
}
