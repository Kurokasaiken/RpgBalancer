import { GridCombatSimulator } from '../../engine/grid/GridCombatSimulator.ts';
import type { GridState, GridCombatCharacter } from '../../engine/grid/combatTypes.ts';
import { DEFAULT_STATS } from '../types.ts';
import { createEmptySpell } from '../spellTypes.ts';

// Mock RNG
const createSeededRNG = (seed: number) => {
    let s = seed;
    return () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
};

async function verifyAoECombat() {
    console.log('--- Verifying AoE Multi-Unit Combat ---\n');

    // Create 10x10 grid
    const grid: GridState = {
        width: 10,
        height: 10,
        tiles: []
    };

    for (let y = 0; y < 10; y++) {
        grid.tiles[y] = [];
        for (let x = 0; x < 10; x++) {
            grid.tiles[y][x] = {
                x,
                y,
                walkable: true,
                terrainCost: 1,
                blocker: false
            };
        }
    }

    // Create AoE fireball spell
    const fireball = createEmptySpell('Fireball');
    fireball.type = 'damage';
    fireball.effect = 100;
    fireball.cooldown = 3;
    fireball.range = 5;
    fireball.aoeShape = 'circle';
    fireball.aoeRadius = 2;
    fireball.friendlyFire = false; // Safe AoE

    // Create basic attack
    const basicAttack = createEmptySpell('Strike');
    basicAttack.type = 'damage';
    basicAttack.effect = 100;
    basicAttack.cooldown = 0;
    basicAttack.range = 1;

    // Team 1: 3 characters (1 mage with AoE)
    const team1: GridCombatCharacter[] = [
        {
            id: 'mage1',
            name: 'Mage',
            baseStats: { ...DEFAULT_STATS, hp: 80, damage: 30, agility: 55 },
            team: 'team1',
            position: { x: 2, y: 5 },
            currentHp: 80,
            currentMana: 100,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [fireball, basicAttack],
            sprite: '🧙'
        },
        {
            id: 'warrior1',
            name: 'Warrior',
            baseStats: { ...DEFAULT_STATS, hp: 120, damage: 25, agility: 50 },
            team: 'team1',
            position: { x: 3, y: 5 },
            currentHp: 120,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [basicAttack],
            sprite: '⚔️'
        },
        {
            id: 'archer1',
            name: 'Archer',
            baseStats: { ...DEFAULT_STATS, hp: 70, damage: 28, agility: 60 },
            team: 'team1',
            position: { x: 4, y: 5 },
            currentHp: 70,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [basicAttack],
            sprite: '🏹'
        }
    ];

    // Team 2: 3 grouped enemies (perfect for AoE)
    const team2: GridCombatCharacter[] = [
        {
            id: 'goblin1',
            name: 'Goblin1',
            baseStats: { ...DEFAULT_STATS, hp: 60, damage: 15, agility: 45 },
            team: 'team2',
            position: { x: 7, y: 5 },
            currentHp: 60,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [basicAttack],
            sprite: '👹'
        },
        {
            id: 'goblin2',
            name: 'Goblin2',
            baseStats: { ...DEFAULT_STATS, hp: 60, damage: 15, agility: 45 },
            team: 'team2',
            position: { x: 7, y: 6 },
            currentHp: 60,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [basicAttack],
            sprite: '👹'
        },
        {
            id: 'goblin3',
            name: 'Goblin3',
            baseStats: { ...DEFAULT_STATS, hp: 60, damage: 15, agility: 45 },
            team: 'team2',
            position: { x: 8, y: 5 },
            currentHp: 60,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [basicAttack],
            sprite: '👹'
        }
    ];

    console.log('Starting 3v3 Combat with AoE...\n');
    const result = GridCombatSimulator.simulate(team1, team2, grid, createSeededRNG(42), 30);

    console.log(`Winner: ${result.winner}`);
    console.log(`Turns: ${result.turn}`);

    console.log(`\nCombat Log (AoE highlights):`);
    result.log
        .filter(entry => entry.message.toLowerCase().includes('aoe') || entry.message.includes('↳'))
        .slice(0, 15)
        .forEach(entry => {
            console.log(`  [Turn ${entry.turn}] ${entry.message}`);
        });

    console.log(`\nFinal State:`);
    result.characters.forEach(char => {
        console.log(`  ${char.name} (${char.team}): ${char.currentHp}/${char.baseStats.hp} HP`);
    });

    console.log(`\nMetrics Summary:`);
    const mage = result.characters.find(c => c.id === 'mage1');
    if (mage) {
        console.log(`  Mage Attacks: ${result.metrics.attacks.get('mage1') || 0}`);
        console.log(`  Mage Hits: ${result.metrics.hits.get('mage1') || 0}`);
        console.log(`  Mage Hit Rate: ${((result.metrics.hits.get('mage1') || 0) / Math.max(1, result.metrics.attacks.get('mage1') || 1) * 100).toFixed(1)}%`);
    }

    if (result.log.some(l => l.message.includes('AoE'))) {
        console.log('\n✅ AoE combat verified successfully');
    } else {
        console.log('\n⚠️ No AoE spells detected in combat log');
    }
}

verifyAoECombat().catch(console.error);
