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

    // Phase 9: Enhanced Metrics
    metrics: {
        initiativeRolls: Map<string, number[]>;
        attacks: Map<string, number>;
        hits: Map<string, number>;
        crits: Map<string, number>;
        statusApplied: Map<string, number>;
        turnsStunned: Map<string, number>;
    };
}

export function createCombatState(teamA: Entity[], teamB: Entity[]): CombatState {
    // Initialize entity effects map
    const entityEffects = new Map<string, AnyStatusEffect[]>();

    // Initialize metrics maps
    const metrics = {
        initiativeRolls: new Map<string, number[]>(),
        attacks: new Map<string, number>(),
        hits: new Map<string, number>(),
        crits: new Map<string, number>(),
        statusApplied: new Map<string, number>(),
        turnsStunned: new Map<string, number>()
    };

    [...teamA, ...teamB].forEach(entity => {
        entityEffects.set(entity.id, []);
        metrics.initiativeRolls.set(entity.id, []);
        metrics.attacks.set(entity.id, 0);
        metrics.hits.set(entity.id, 0);
        metrics.crits.set(entity.id, 0);
        metrics.statusApplied.set(entity.id, 0);
        metrics.turnsStunned.set(entity.id, 0);
    });

    return {
        turn: 0,
        teamA,
        teamB,
        log: [],
        isFinished: false,
        entityEffects,
        metrics
    };
}
