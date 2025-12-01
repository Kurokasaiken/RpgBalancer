import { GridCombatSimulator } from '../../engine/grid/GridCombatSimulator.ts';
import { GridState, GridCombatCharacter } from '../../engine/grid/combatTypes.ts';
import { DEFAULT_STATS } from '../../balancing/types.ts';
import { createEmptySpell } from '../../balancing/spellTypes.ts';

// Mock RNG
const createSeededRNG = (seed: number) => {
    let s = seed;
    return () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
};

async function verifyGridCombat() {
    console.log('--- Verifying Grid Combat System ---\n');

    // Create a simple 10x10 grid
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

    // Add some blockers (walls)
    grid.tiles[5][4].blocker = true;
    grid.tiles[5][5].blocker = true;
    grid.tiles[5][6].blocker = true;

    // Create a simple damage spell
    const attackSpell = createEmptySpell('BasicAttack');
    attackSpell.type = 'damage';
    attackSpell.effect = 100; // 100% damage
    attackSpell.cooldown = 0;
    attackSpell.range = 1; // Melee

    // Create Team 1 (2 characters)
    const team1: GridCombatCharacter[] = [
        {
            id: 'hero1',
            name: 'Warrior',
            baseStats: { ...DEFAULT_STATS, hp: 100, damage: 20, agility: 55 },
            team: 'team1',
            position: { x: 2, y: 2 },
            currentHp: 100,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [attackSpell],
            sprite: '⚔️'
        },
        {
            id: 'hero2',
            name: 'Archer',
            baseStats: { ...DEFAULT_STATS, hp: 80, damage: 25, agility: 60 },
            team: 'team1',
            position: { x: 3, y: 2 },
            currentHp: 80,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [attackSpell],
            sprite: '🏹'
        }
    ];

    // Create Team 2 (2 characters)
    const team2: GridCombatCharacter[] = [
        {
            id: 'enemy1',
            name: 'Goblin',
            baseStats: { ...DEFAULT_STATS, hp: 60, damage: 15, agility: 50 },
            team: 'team2',
            position: { x: 7, y: 7 },
            currentHp: 60,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [attackSpell],
            sprite: '👹'
        },
        {
            id: 'enemy2',
            name: 'Orc',
            baseStats: { ...DEFAULT_STATS, hp: 90, damage: 18, agility: 45 },
            team: 'team2',
            position: { x: 8, y: 7 },
            currentHp: 90,
            currentMana: 0,
            statusEffects: [],
            cooldowns: new Map(),
            equippedSpells: [attackSpell],
            sprite: '👺'
        }
    ];

    // Simulate combat
    console.log('Starting Grid Combat...\n');
    const result = GridCombatSimulator.simulate(team1, team2, grid, createSeededRNG(42), 30);

    console.log(`Winner: ${result.winner}`);
    console.log(`Turns: ${result.turn}`);
    console.log(`\nCombat Log (first 10 entries):`);
    result.log.slice(0, 10).forEach(entry => {
        console.log(`  [Turn ${entry.turn}] ${entry.message}`);
    });

    console.log(`\nMetrics:`);
    result.characters.forEach(char => {
        console.log(`  ${char.name}:`);
        console.log(`    HP: ${char.currentHp}/${char.baseStats.hp}`);
        console.log(`    Attacks: ${result.metrics.attacks.get(char.id) || 0}`);
        console.log(`    Hits: ${result.metrics.hits.get(char.id) || 0}`);
        console.log(`    Crits: ${result.metrics.crits.get(char.id) || 0}`);
        console.log(`    Tiles Moved: ${result.metrics.tilesMoved.get(char.id) || 0}`);
        console.log(`    Initiative Rolls: ${(result.metrics.initiativeRolls.get(char.id) || []).slice(0, 3).map(r => r.toFixed(1)).join(', ')}...`);
    });

    if (result.winner !== 'draw') {
        console.log('\n✅ Grid Combat simulation completed successfully');
    } else {
        console.log('\n⚠️ Combat ended in a draw (turn limit reached)');
    }
}

verifyGridCombat().catch(console.error);
