/**
 * Quick test for ArchetypeBuilder and ArchetypeRegistry
 * 
 * Run with: npx tsx src/balancing/archetype/testArchetype.ts
 */

import { ArchetypeBuilder } from './ArchetypeBuilder';
import type { StatAllocation } from './types';
import { listArchetypes, filterByCategory, getAllTags } from './ArchetypeRegistry';
import { calculateStatBlockCost } from '../costs';

console.log('🧪 Testing Archetype System...\n');

const buildAllocation = (overrides: Partial<StatAllocation>): StatAllocation => ({
    hp: 0,
    damage: 0,
    armor: 0,
    resistance: 0,
    txc: 0,
    hitChance: 0,
    evasion: 0,
    critChance: 0,
    critMult: 0,
    lifesteal: 0,
    regen: 0,
    ward: 0,
    energyShield: 0,
    block: 0,
    armorPen: 0,
    penPercent: 0,
    ...overrides
});

// Test 1: Load archetypes
console.log('📋 Test 1: Load Archetypes');
const archetypes = listArchetypes();
console.log(`  Loaded ${archetypes.length} archetypes`);

if (archetypes.length > 0) {
    const first = archetypes[0];
    console.log(`  First: ${first.name} (${first.category})`);
}

// Test 2: Filter by category
console.log('\n🏷️  Test 2: Filter by Category');
const tanks = filterByCategory('tank');
console.log(`  Tanks: ${tanks.length}`);
tanks.forEach(t => console.log(`    - ${t.name}`));

// Test 3: Get all tags
console.log('\n🔖 Test 3: All Tags');
const tags = getAllTags();
console.log(`  Tags: ${tags.join(', ')}`);

// Test 4: Build archetype instance
console.log('\n⚙️  Test 4: Build Archetype Instance');
if (archetypes.length > 0) {
    const template = archetypes[0];
    console.log(`  Building: ${template.name} at 50 budget`);

    const instance = ArchetypeBuilder.createInstance(template, 50);
    const statBlock = instance.statBlock;
    console.log(`  HP: ${statBlock.hp}`);
    console.log(`  Damage: ${statBlock.damage}`);
    console.log(`  Armor: ${statBlock.armor}`);

    const power = calculateStatBlockCost(statBlock);
    console.log(`  Power Score (budget cost): ${power} HP`);
}

// Test 5: Validate allocation
console.log('\n✅ Test 5: Validate Allocation');
const validAlloc = buildAllocation({ hp: 50, damage: 30, armor: 20 });
try {
    ArchetypeBuilder.validateAllocation(validAlloc);
    console.log('  Valid (50/30/20): true');
} catch (error) {
    console.log(`  Valid (50/30/20): false -> ${(error as Error).message}`);
}

const invalidAlloc = buildAllocation({ hp: 60, damage: 30, armor: 20 }); // Sum = 110
try {
    ArchetypeBuilder.validateAllocation(invalidAlloc);
    console.log('  Valid (60/30/20): true');
} catch (error) {
    console.log(`  Valid (60/30/20): false`);
    console.log(`  Error: ${(error as Error).message}`);
}

console.log('\n✅ All tests complete!');
