/**
 * Seed a few starter spells into spells.json.
 * Run with: npx tsx src/balancing/spell/spellSeed.ts
 */

import { upsertSpell } from './storage';
import type { SpellTemplate } from './types';

const BASE_SPELLS: SpellTemplate[] = [
    {
        id: 'fireball',
        name: 'Fireball',
        description: 'A classic fire projectile dealing direct damage.',
        damage: 40,
        armorPen: 5,
        resPen: 10,
        hitChance: 80,
        critChance: 15,
        critMult: 2,
        configFlatFirst: true,
        configApplyBeforeCrit: true,
    },
    {
        id: 'piercing_arrow',
        name: 'Piercing Arrow',
        description: 'High armor penetration, moderate damage.',
        damage: 30,
        armorPen: 20,
        resPen: 5,
        hitChance: 85,
        critChance: 10,
        critMult: 1.8,
        configFlatFirst: true,
        configApplyBeforeCrit: true,
    },
    {
        id: 'quick_shot',
        name: 'Quick Shot',
        description: 'High hit chance, low damage, low crit.',
        damage: 20,
        armorPen: 0,
        resPen: 0,
        hitChance: 95,
        critChance: 5,
        critMult: 1.5,
        configFlatFirst: true,
        configApplyBeforeCrit: true,
    },
];

function seed() {
    console.log('🌱 Seeding spells...');
    BASE_SPELLS.forEach(spell => {
        upsertSpell(spell);
        console.log(`  - ${spell.name} (id: ${spell.id})`);
    });
    console.log('✅ Done');
}

if (require.main === module) {
    seed();
}

export { seed, BASE_SPELLS };
