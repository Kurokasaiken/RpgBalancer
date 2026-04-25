/**
 * Seed Archetypes - Populate archetypes.json with 16 base templates
 * 
 * Run with: npx tsx src/balancing/archetype/seedArchetypes.ts
 */

import { saveArchetypes } from './storage';
import type { ArchetypeTemplate, StatAllocation } from './types';
import { withAllocationDefaults } from './allocationDefaults';

const allocation = (partial: Partial<StatAllocation>): StatAllocation =>
    withAllocationDefaults(partial);

const TEMPLATE_VERSION = '1.0.0';

const BASE_ARCHETYPES: ArchetypeTemplate[] = [
    // ==================
    // TANK (5 variants)
    // ==================
    {
        id: 'tank_high_hp',
        name: 'Tank - High HP',
        category: 'tank',
        description: 'Massive health pool focused tank',
        allocation: allocation({
            hp: 70,
            armor: 20,
            resistance: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['tank', 'high-hp', 'durable'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'tank_armor',
        name: 'Tank - Armor',
        category: 'tank',
        description: 'Heavy armor mitigation specialist',
        allocation: allocation({
            armor: 50,
            hp: 30,
            resistance: 20,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['tank', 'armor', 'mitigation'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'tank_evasion',
        name: 'Tank - Evasion',
        category: 'tank',
        description: 'Dodges attacks with high evasion',
        allocation: allocation({
            evasion: 40,
            hp: 40,
            armor: 20,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['tank', 'evasion', 'dodge'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'tank_support',
        name: 'Tank - Support',
        category: 'tank',
        description: 'Self-sustaining tank with healing',
        allocation: allocation({
            hp: 40,
            regen: 30,
            lifesteal: 20,
            armor: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['tank', 'sustain', 'regen'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'tank_shield',
        name: 'Tank - Shield',
        category: 'tank',
        description: 'Shield-based damage absorption',
        allocation: allocation({
            hp: 40,
            ward: 30,
            energyShield: 20,
            block: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['tank', 'shield', 'ward'],
        version: TEMPLATE_VERSION,
    },

    // ==================
    // DPS (4 variants)
    // ==================
    {
        id: 'dps_pure',
        name: 'DPS - Pure Damage',
        category: 'dps',
        description: 'Maximum raw damage output',
        allocation: allocation({
            damage: 70,
            hitChance: 20,
            hp: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['dps', 'burst', 'damage'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'dps_crit',
        name: 'DPS - Critical',
        category: 'dps',
        description: 'Critical strike specialist',
        allocation: allocation({
            damage: 40,
            critChance: 30,
            critMult: 20,
            hitChance: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['dps', 'crit', 'burst'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'dps_penetration',
        name: 'DPS - Penetration',
        category: 'dps',
        description: 'Armor and resistance penetration',
        allocation: allocation({
            damage: 50,
            armorPen: 25,
            penPercent: 15,
            hitChance: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['dps', 'penetration', 'anti-tank'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'dps_accurate',
        name: 'DPS - Accurate',
        category: 'dps',
        description: 'High accuracy and consistent damage',
        allocation: allocation({
            damage: 50,
            hitChance: 40,
            critChance: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['dps', 'accuracy', 'consistent'],
        version: TEMPLATE_VERSION,
    },

    // ==================
    // ASSASSIN (2 variants)
    // ==================
    {
        id: 'assassin_oneshot',
        name: 'Assassin - One-Shot King',
        category: 'assassin',
        description: 'Maximum burst damage in one hit',
        allocation: allocation({
            damage: 35,
            critChance: 30,
            critMult: 30,
            hp: 5,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['assassin', 'burst', 'glass-cannon'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'assassin_evasive',
        name: 'Assassin - Evasive',
        category: 'assassin',
        description: 'High damage with hit-and-run evasion',
        allocation: allocation({
            damage: 40,
            critChance: 25,
            evasion: 25,
            hp: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['assassin', 'evasion', 'mobile'],
        version: TEMPLATE_VERSION,
    },

    // ==================
    // BRUISER (3 variants)
    // ==================
    {
        id: 'bruiser_balanced',
        name: 'Bruiser - Balanced',
        category: 'bruiser',
        description: 'Equal parts offense and defense',
        allocation: allocation({
            damage: 30,
            hp: 30,
            armor: 20,
            lifesteal: 20,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['bruiser', 'balanced', 'versatile'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'bruiser_sustain',
        name: 'Bruiser - Sustain',
        category: 'bruiser',
        description: 'Outlasts enemies with healing',
        allocation: allocation({
            damage: 35,
            lifesteal: 30,
            regen: 20,
            hp: 15,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['bruiser', 'sustain', 'lifesteal'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'bruiser_duelist',
        name: 'Bruiser - Duelist',
        category: 'bruiser',
        description: 'Specialized for 1v1 combat',
        allocation: allocation({
            damage: 40,
            hp: 25,
            critChance: 20,
            armor: 15,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['bruiser', 'duelist', '1v1'],
        version: TEMPLATE_VERSION,
    },

    // ==================
    // SUPPORT (2 variants)
    // ==================
    {
        id: 'support_healer',
        name: 'Support - Healer',
        category: 'support',
        description: 'Regeneration and healing over time',
        allocation: allocation({
            regen: 50,
            hp: 30,
            resistance: 20,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['support', 'healer', 'regen'],
        version: TEMPLATE_VERSION,
    },
    {
        id: 'support_shielder',
        name: 'Support - Shielder',
        category: 'support',
        description: 'Protective shields and barriers',
        allocation: allocation({
            ward: 40,
            energyShield: 30,
            hp: 20,
            block: 10,
        }),
        minBudget: 10,
        maxBudget: 100,
        createdBy: 'system',
        tags: ['support', 'shield', 'protection'],
        version: TEMPLATE_VERSION,
    },
];

// Run seeding
function seedArchetypes() {
    console.log('🌱 Seeding archetypes...');
    console.log(`Creating ${BASE_ARCHETYPES.length} base archetype templates`);

    try {
        saveArchetypes(BASE_ARCHETYPES);
        console.log('✅ Successfully seeded archetypes.json');

        // Print summary
        const byCategory = BASE_ARCHETYPES.reduce((acc, arch) => {
            acc[arch.category] = (acc[arch.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('\n📊 Summary:');
        Object.entries(byCategory).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} variants`);
        });

    } catch (error) {
        console.error('❌ Error seeding archetypes:', error);
        throw error;
    }
}

// Run if executed directly (ESM version)
seedArchetypes();

export { seedArchetypes, BASE_ARCHETYPES };
