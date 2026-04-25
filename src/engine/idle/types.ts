// src/engine/idle/types.ts

import type { Entity } from "../core/entity";
import type { Spell } from "../../balancing/spellTypes";

export type Team = 'hero' | 'enemy';
export type AIBehavior = 'tank' | 'dps' | 'support' | 'random';

export interface Combatant {
    id: string;
    name: string;
    entity: Entity; // Base stats
    team: Team;
    equippedSpells: Spell[]; // Max 4
    activeEffects: ActiveEffect[];
    cooldowns: Record<string, number>; // spellId -> rounds remaining
    aiBehavior: AIBehavior;
    isDead: boolean;
}

export interface ActiveEffect {
    id: string;
    sourceId: string;
    spellId: string;
    type: 'buff' | 'debuff' | 'dot' | 'hot';
    name: string;
    value: number; // Magnitude (damage, heal amount, stat mod)
    duration: number; // Rounds remaining
    statModified?: string; // For buffs/debuffs (legacy)
    statModifications?: Record<string, number>; // For new buff/debuff system
}

export interface CombatState {
    combatants: Combatant[];
    turnOrder: string[]; // Array of combatant IDs
    currentTurnIndex: number;
    round: number;
    log: CombatLogEntry[];
    winner?: Team | null;
    activeIntents: Record<string, Intent>; // combatantId -> Intent
}

export interface Intent {
    sourceId: string;
    targetId: string;
    spellId: string;
    description: string; // "Casting Fireball on Orc"
}

export interface CombatLogEntry {
    round: number;
    sourceId?: string;
    targetId?: string;
    message: string;
    type: 'info' | 'damage' | 'heal' | 'effect' | 'death';
    value?: number;
}
