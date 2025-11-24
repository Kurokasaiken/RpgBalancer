import { Entity } from '../core/entity';

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
}

export function createCombatState(teamA: Entity[], teamB: Entity[]): CombatState {
    return {
        turn: 0,
        teamA,
        teamB,
        log: [],
        isFinished: false,
    };
}
