import { Entity } from '../core/entity';
import type { PeriodicEffect } from '../../balancing/modules/dot';
import type { Buff } from '../../balancing/modules/buffs';

export interface CombatLogEntry {
    turn: number;
    message: string;
    type: 'info' | 'attack' | 'damage' | 'heal' | 'death';
}

export interface CombatState {
    turn: number;
    teamA: Entity[];
    teamB: Entity[];
    log: CombatLogEntry[];
    winner?: 'teamA' | 'teamB' | 'draw';
    isFinished: boolean;

    // NEW: Track DoT/HoT and Buffs per entity
    entityEffects: Map<string, {
        dots: PeriodicEffect[];  // Damage/Heal over time effects
        buffs: Buff[];           // Stat modifiers, shields, status effects
    }>;
}

export function createCombatState(teamA: Entity[], teamB: Entity[]): CombatState {
    // Initialize entity effects map
    const entityEffects = new Map<string, { dots: PeriodicEffect[]; buffs: Buff[] }>();

    [...teamA, ...teamB].forEach(entity => {
        entityEffects.set(entity.id, { dots: [], buffs: [] });
    });

    return {
        turn: 0,
        teamA,
        teamB,
        log: [],
        isFinished: false,
        entityEffects
    };
}
