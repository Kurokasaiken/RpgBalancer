import type { StatBlock } from '../../balancing/types';

export interface GridPosition {
    x: number;
    y: number;
}

export type EntityState = 'idle' | 'moving' | 'attacking' | 'hit' | 'dead';

export interface GridEntity {
    id: string;
    name: string;
    stats: StatBlock;
    position: GridPosition;
    state: EntityState;
    team: 'player' | 'enemy';
    color: string; // For visual distinction
    maxHp: number;
    currentHp: number;
    actionPoints: number; // For turn-based logic
}

export interface CombatState {
    gridSize: number; // e.g., 8
    entities: GridEntity[];
    turn: number;
    activeEntityId: string | null;
    selectedEntityId: string | null; // For player selection
    logs: string[];
}
