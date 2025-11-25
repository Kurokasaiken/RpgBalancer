/**
 * Quick test for ArchetypeBuilder and ArchetypeRegistry
 * 
 * Run with: npx tsx src/balancing/archetype/testArchetype.ts
 */

import { buildArchetype, validateAllocation, calculatePowerScore } from './ArchetypeBuilder';
import { listArchetypes, filterByCategory, getAllTags } from './ArchetypeRegistry';

console.log('🧪 Testing Archetype System...\n');

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

    const instance = buildArchetype(template, 50);
    console.log(`  HP: ${instance.statBlock.hp}`);
    console.log(`  Damage: ${instance.statBlock.damage}`);
    console.log(`  Armor: ${instance.statBlock.armor}`);

    const power = calculatePowerScore(instance);
    console.log(`  Power Score: ${power.toFixed(2)} HP-eq`);
}

// Test 5: Validate allocation
console.log('\n✅ Test 5: Validate Allocation');
const validAlloc = { hp: 50, damage: 30, armor: 20 };
const validation = validateAllocation(validAlloc);
console.log(`  Valid (50/30/20): ${validation.valid}`);

const invalidAlloc = { hp: 60, damage: 30, armor: 20 }; // Sum = 110
const validation2 = validateAllocation(invalidAlloc);
console.log(`  Valid (60/30/20): ${validation2.valid}`);
if (!validation2.valid) {
    console.log(`  Errors: ${validation2.errors.join(', ')}`);
}

console.log('\n✅ All tests complete!');
