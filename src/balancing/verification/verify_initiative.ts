
import { InitiativeModule } from '../modules/initiative.ts';
import { CombatSimulator } from '../simulation/CombatSimulator.ts';

// Mock RNG
const createSeededRNG = (seed: number) => {
    let s = seed;
    return () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
};

async function verifyInitiative() {
    console.log('--- Verifying Initiative Module ---');

    const charA = { id: 'Fast', agility: 60 };
    const charB = { id: 'Slow', agility: 40 };
    const rng = createSeededRNG(123);

    // Test 1: Basic Order
    const order = InitiativeModule.generateTurnOrder([charA, charB], rng);
    console.log('Turn Order (Fast vs Slow):', order);

    if (order[0] === 'Fast') {
        console.log('✅ Fast character went first');
    } else {
        console.error('❌ Slow character went first (unexpected for this seed)');
    }

    // Test 2: Distribution
    console.log('\n--- Verifying Distribution (1000 runs) ---');
    let fastWins = 0;
    for (let i = 0; i < 1000; i++) {
        const r = createSeededRNG(i);
        const o = InitiativeModule.generateTurnOrder([charA, charB], r);
        if (o[0] === 'Fast') fastWins++;
    }
    console.log(`Fast wins: ${fastWins}/1000 (${(fastWins / 10).toFixed(1)}%)`);

    if (fastWins > 900) {
        console.log('✅ Distribution looks correct (High agility wins most of the time)');
    } else {
        console.error('❌ Distribution suspicious');
    }

    // Test 3: Combat Integration
    console.log('\n--- Verifying Combat Integration ---');

    // Create mock entities
    const entity1 = {
        name: 'FastHero',
        hp: 100,
        attack: 10,
        defense: 0,
        speed: 60, // Legacy speed
        agility: 60 // New stat
    };

    const entity2 = {
        name: 'SlowEnemy',
        hp: 100,
        attack: 10,
        defense: 0,
        speed: 40,
        agility: 40
    };

    const config = {
        entity1,
        entity2,
        turnLimit: 10,
        enableDetailedLogging: true
    };

    try {
        const result = CombatSimulator.simulate(config, createSeededRNG(42));
        console.log('Combat Result:', result.winner);
        console.log('Turns:', result.turns);

        // Check enhanced metrics
        console.log('Initiative Rolls (Entity1):', result.initiativeRolls?.entity1);
        console.log('Hit Rate (Entity1):', result.hitRate?.entity1);
        console.log('Crit Rate (Entity1):', result.critRate?.entity1);

        if (result.initiativeRolls?.entity1 && result.initiativeRolls.entity1.length > 0) {
            console.log('✅ Enhanced metrics populated');
        } else {
            console.error('❌ Enhanced metrics missing');
        }

        console.log('✅ Combat simulation ran successfully');
    } catch (e) {
        console.error('❌ Combat simulation failed:', e);
    }
}

verifyInitiative().catch(console.error);
