import type { StatBlock } from '../../balancing/types';
import type { Spell } from '../../balancing/spellTypes';
import type { AnyStatusEffect } from '../../balancing/statusEffects/StatusEffectManager';
import type { CombatLogEntry } from '../combat/state';

export type AoEShape =
    | { type: 'circle', radius: number }
    | { type: 'cone', angle: number, length: number } // angle in degrees
    | { type: 'line', length: number, width: number };

export interface Position {
    x: number;
    y: number;
}

export interface GridTile {
    x: number;
    y: number;
    walkable: boolean;
    terrainCost: number; // 1 = normal, 2 = difficult
    blocker?: boolean; // Wall or obstacle
}

export interface GridState {
    width: number;
    height: number;
    tiles: GridTile[][];
}

export interface GridCombatCharacter {
    id: string;
    name: string;
    baseStats: StatBlock;
    team: 'team1' | 'team2';

    // Runtime state
    position: Position;
    currentHp: number;
    currentMana: number;
    statusEffects: AnyStatusEffect[];
    cooldowns: Map<string, number>; // spellId -> turns remaining

    // Equipment/Spells
    equippedSpells: Spell[];

    // Visual
    sprite?: string;
}

export interface CombatAction {
    characterId: string;
    type: 'spell' | 'move' | 'wait';
    spellId?: string;
    targetId?: string;
    targetPosition?: Position;
    moveToPosition?: Position;
}

export interface GridCombatState {
    grid: GridState;
    characters: GridCombatCharacter[];

    turn: number;
    turnQueue: string[]; // Character IDs in action order

    log: CombatLogEntry[];
    winner?: 'team1' | 'team2' | 'draw';
    isFinished: boolean;

    // Metrics (Phase 9)
    metrics: {
        initiativeRolls: Map<string, number[]>;
        attacks: Map<string, number>;
        hits: Map<string, number>;
        crits: Map<string, number>;
        statusApplied: Map<string, number>;
        turnsStunned: Map<string, number>;
        tilesMoved: Map<string, number>; // NEW for Grid
    };
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
