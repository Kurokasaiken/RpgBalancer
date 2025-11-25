import type { StatBlock } from '../../balancing/types';
import type { Spell } from '../../balancing/spellTypes';

// Character with equipped spells and combat state
export interface CombatCharacter {
    id: string;
    name: string;
    baseStats: StatBlock;

    // Equipment
    equippedSpells: Spell[];
    maxSpellSlots: number; // Default 4, can be modified by stats
    equipment?: {
        weapon?: Equipment;
        armor?: Equipment;
        accessory?: Equipment;
    };

    // Combat state (runtime)
    position: Position;
    currentHp: number;
    currentMana: number;
    statusEffects: StatusEffect[];
    cooldowns: Map<string, number>; // spellId -> turns remaining

    // Visual
    sprite: string;
    team: 'team1' | 'team2';
}

export interface Equipment {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'accessory';
    statModifiers: Partial<StatBlock>;
    abilities?: Spell[]; // Equipment can grant abilities
}

export interface StatusEffect {
    id: string;
    name: string;
    type: 'buff' | 'debuff' | 'stun' | 'dot'; // damage over time
    duration: number; // turns
    effect: Partial<StatBlock> | { damage: number }; // Stat changes or direct damage
}

export interface Position {
    x: number;
    y: number;
}

// Combat action that a character can take
export interface CombatAction {
    characterId: string;
    type: 'spell' | 'move' | 'wait';
    spellId?: string;
    targetId?: string;
    targetPosition?: Position;
    moveToPosition?: Position;
}

// Turn-based combat state
export interface IdleCombatState {
    phase: 'setup' | 'positioning' | 'combat' | 'ended';

    characters: CombatCharacter[];
    gridSize: number;

    currentTurn: number;
    turnQueue: string[]; // Character IDs in action order

    // Idle settings
    autoSpeed: number; // 0.5x, 1x, 2x, 5x
    isPaused: boolean;

    // Combat result
    winner?: 'team1' | 'team2' | 'draw';

    // Logs
    events: CombatEvent[];
}

export interface CombatEvent {
    turn: number;
    timestamp: number;
    type: 'damage' | 'heal' | 'spell_cast' | 'move' | 'status_applied' | 'death';
    actorId: string;
    targetId?: string;
    details: {
        spellName?: string;
        damage?: number;
        healing?: number;
        statusEffect?: string;
    };
    message: string; // Human-readable log
}

// AI decision for what action to take
export interface AIDecision {
    action: CombatAction;
    reasoning: string; // For debugging/display
    priority: number; // Higher = more urgent
    indicators?: {
        icon: string; // emoji or icon name
        target?: Position | string; // Show indicator where AI will act
    };
}

// Scenario-based positioning (for later phases)
export type PositioningScenario =
    | 'surprise' // Player ambushes AI
    | 'ambushed' // AI ambushes player
    | 'encounter'; // Both see each other

export interface ScenarioSetup {
    scenario: PositioningScenario;
    team1StartZone: Position[]; // Valid starting tiles
    team2StartZone: Position[];
    team1GoesFirst: boolean; // Who positions first
}
