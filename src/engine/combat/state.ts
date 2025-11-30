import { Entity } from '../core/entity';
import type { AnyStatusEffect } from '../../balancing/statusEffects/StatusEffectManager';

export interface CombatLogEntry {
    turn: number;
    message: string;
    type: 'info' | 'attack' | 'damage' | 'heal' | 'death' | 'buff' | 'debuff' | 'dot' | 'hot' | 'stun';
}

export interface CombatState {
    turn: number;
    teamA: Entity[];
    teamB: Entity[];
    log: CombatLogEntry[];
    winner?: 'teamA' | 'teamB' | 'draw';
    isFinished: boolean;

    // Track status effects per entity
    entityEffects: Map<string, AnyStatusEffect[]>;
}

export function createCombatState(teamA: Entity[], teamB: Entity[]): CombatState {
    // Initialize entity effects map
    const entityEffects = new Map<string, AnyStatusEffect[]>();

    [...teamA, ...teamB].forEach(entity => {
        entityEffects.set(entity.id, []);
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
