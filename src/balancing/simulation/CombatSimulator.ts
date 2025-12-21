import type {
    CombatConfig,
    CombatResult,
    CombatTimelineFrame,
    TurnData,
    RNG,
    EntityStats
} from './types';
import { Entity } from '../../engine/core/entity';
import { createCombatState } from '../../engine/combat/state';
import { resolveCombatRound } from '../../engine/combat/logic';
import { BASELINE_STATS } from '../baseline';
import type { StatBlock } from '../types';
import type { CombatState, CombatLogEntry } from '../../engine/combat/state';
import type { AnyStatusEffect, ShieldEffect, OverTimeEffect } from '../statusEffects/StatusEffectManager';
import type { CombatTeamSnapshot, CombatPhaseEvent, CombatActorSnapshot, StatusEffectSummary } from './types';
import { resolveSpriteForArchetype } from '../config/combatSprites';

/**
 * Combat Simulator - Turn-based 1v1 combat engine
 * 
 * CRITICAL: This simulator INHERITS from existing combat engine.
 * ZERO formula implementation - all logic from src/engine/combat/logic.ts
 * 
 * @see src/engine/combat/logic.ts for combat engine
 * @see src/balancing/baseline.ts for baseline stats
 * @see src/balancing/modules/* for all combat formulas
 */
export class CombatSimulator {
    private rng: RNG;

    /**
     * Create a new CombatSimulator con RNG deterministico
     * @param rng Random Number Generator function (deve essere esplicito)
     */
    constructor(rng: RNG) {
        this.rng = rng;
    }

    private applySpriteMetadata(entity: Entity, stats: EntityStats) {
        const binding = (!stats.spriteId || !stats.spritePalette)
            ? resolveSpriteForArchetype({ spriteId: stats.spriteId, tags: stats.tags })
            : { spriteId: stats.spriteId, palette: stats.spritePalette };

        entity.spriteId = binding.spriteId;
        entity.spritePalette = binding.palette;
        entity.tags = stats.tags;
    }

    /**
     * Run a single combat simulation (Static Wrapper)
     * RNG deve essere esplicito: nessun fallback a Math.random
     */
    static simulate(config: CombatConfig, rng: RNG): CombatResult {
        return new CombatSimulator(rng).simulate(config);
    }

    /**
     * Run a single combat simulation
     * 
     * @param config Combat configuration (entities, turn limit, logging)
     * @returns Combat result with winner, turns, damage stats, HP remaining, etc.
     */
    simulate(config: CombatConfig): CombatResult {
        const { entity1, entity2, turnLimit, enableDetailedLogging = false, suddenDeath } = config;

        // Convert EntityStats to StatBlock format
        const statBlock1 = this.entityToStatBlock(entity1);
        const statBlock2 = this.entityToStatBlock(entity2);

        const baseDamage1 = statBlock1.damage;
        const baseDamage2 = statBlock2.damage;

        const suddenDeathRules = suddenDeath && suddenDeath.startTurn > 0 && suddenDeath.damageMultiplierPerTurn > 0
            ? suddenDeath
            : undefined;

        // Create Entity instances using fromStatBlock factory
        // This bypasses Attributes system and uses pure StatBlock
        const fighter1 = Entity.fromStatBlock('entity1', entity1.name || 'Entity 1', statBlock1);
        const fighter2 = Entity.fromStatBlock('entity2', entity2.name || 'Entity 2', statBlock2);
        this.applySpriteMetadata(fighter1, entity1);
        this.applySpriteMetadata(fighter2, entity2);

        // Apply equipped spells from combat config, if any
        if (entity1.spells && entity1.spells.length > 0) {
            fighter1.spells = [...entity1.spells];
        }
        if (entity2.spells && entity2.spells.length > 0) {
            fighter2.spells = [...entity2.spells];
        }

        // Create combat state using EXISTING combat system
        let state = createCombatState([fighter1], [fighter2]);

        // Track total damage dealt by each entity
        let totalDamage1 = 0;
        let totalDamage2 = 0;
        const initialHP1 = fighter1.currentHp;
        const initialHP2 = fighter2.currentHp;

        const timelineFrames: CombatTimelineFrame[] = [];

        // Run combat loop using EXISTING engine
        while (!state.isFinished && state.turn < turnLimit) {
            if (suddenDeathRules && fighter1.statBlock && fighter2.statBlock) {
                const upcomingTurn = state.turn + 1;
                let damageMultiplier = 1;

                if (upcomingTurn >= suddenDeathRules.startTurn) {
                    const turnsPast = upcomingTurn - suddenDeathRules.startTurn + 1;
                    damageMultiplier = 1 + suddenDeathRules.damageMultiplierPerTurn * turnsPast;

                    if (typeof suddenDeathRules.maxDamageMultiplier === 'number') {
                        damageMultiplier = Math.min(damageMultiplier, suddenDeathRules.maxDamageMultiplier);
                    }
                }

                fighter1.statBlock.damage = baseDamage1 * damageMultiplier;
                fighter2.statBlock.damage = baseDamage2 * damageMultiplier;
            }

            // Track HP before turn
            const hpBefore1 = fighter1.currentHp;
            const hpBefore2 = fighter2.currentHp;

            // Capture pre-turn snapshot & log index for timeline reconstruction
            const startSnapshot = this.captureTeams(state);
            const logStartIndex = state.log.length;

            // Resolve combat round using EXISTING logic
            // CRITICAL: Pass the seeded RNG to the logic engine
            state = resolveCombatRound(state, this.rng);

            // Calculate damage dealt this turn
            const damageTaken1 = hpBefore1 - fighter1.currentHp;
            const damageTaken2 = hpBefore2 - fighter2.currentHp;

            // Track cumulative damage (damage dealt TO opponent)
            totalDamage2 += damageTaken1; // Entity2 dealt damage to Entity1
            totalDamage1 += damageTaken2; // Entity1 dealt damage to Entity2

            // Capture end-of-turn snapshot and compose timeline frame
            const endSnapshot = this.captureTeams(state);
            const hpDelta = this.computeHpDelta(startSnapshot, endSnapshot);
            const turnEntries = state.log.slice(logStartIndex);
            const phases = this.buildPhaseEvents(turnEntries);

            timelineFrames.push({
                turn: state.turn,
                startSnapshot,
                endSnapshot,
                hpDelta,
                phases
            });
        }

        // Calculate overkill (damage dealt after opponent reached 0 HP)
        // Overkill = total damage dealt - initial HP (if entity died)
        const hp1 = Math.max(0, fighter1.currentHp);
        const hp2 = Math.max(0, fighter2.currentHp);

        let overkill1 = 0;
        let overkill2 = 0;

        // Entity1's overkill = damage dealt to entity2 beyond its HP
        if (hp2 === 0 && totalDamage1 > initialHP2) {
            overkill1 = totalDamage1 - initialHP2;
        }

        // Entity2's overkill = damage dealt to entity1 beyond its HP
        if (hp1 === 0 && totalDamage2 > initialHP1) {
            overkill2 = totalDamage2 - initialHP1;
        }

        // Determine winner
        // Default mapping from engine result
        let winner: 'entity1' | 'entity2' | 'draw';
        if (state.winner === 'teamA') {
            winner = 'entity1';
        } else if (state.winner === 'teamB') {
            winner = 'entity2';
        } else {
            winner = 'draw';
        }

        // If we reached the turn limit without a decisive winner, resolve the tie
        // in favour of the side with higher remaining HP (or damage dealt).
        const timedOut = !state.isFinished && state.turn >= turnLimit;
        if (timedOut && winner === 'draw') {
            if (hp1 > hp2) {
                winner = 'entity1';
            } else if (hp2 > hp1) {
                winner = 'entity2';
            } else if (totalDamage1 > totalDamage2) {
                winner = 'entity1';
            } else if (totalDamage2 > totalDamage1) {
                winner = 'entity2';
            } else {
                // Perfect tie on both HP and damage: extremely rare, keep as draw
                winner = 'draw';
            }
        }

        // Extract turn-by-turn log if requested
        const turnByTurnLog = enableDetailedLogging ? this.extractTurnLog(state) : undefined;
        const timeline = enableDetailedLogging ? timelineFrames : undefined;

        return {
            winner,
            turns: state.turn,
            damageDealt: {
                entity1: totalDamage1,
                entity2: totalDamage2,
            },
            hpRemaining: {
                entity1: hp1,
                entity2: hp2,
            },
            overkill: {
                entity1: overkill1,
                entity2: overkill2,
            },
            turnByTurnLog,

            // Enhanced Metrics (Phase 9)
            initiativeRolls: {
                entity1: state.metrics.initiativeRolls.get(fighter1.id) || [],
                entity2: state.metrics.initiativeRolls.get(fighter2.id) || [],
            },
            hitRate: {
                entity1: (state.metrics.hits.get(fighter1.id) || 0) / Math.max(1, state.metrics.attacks.get(fighter1.id) || 1),
                entity2: (state.metrics.hits.get(fighter2.id) || 0) / Math.max(1, state.metrics.attacks.get(fighter2.id) || 1),
            },
            critRate: {
                entity1: (state.metrics.crits.get(fighter1.id) || 0) / Math.max(1, state.metrics.hits.get(fighter1.id) || 1),
                entity2: (state.metrics.crits.get(fighter2.id) || 0) / Math.max(1, state.metrics.hits.get(fighter2.id) || 1),
            },
            statusEffectsApplied: {
                entity1: state.metrics.statusApplied.get(fighter1.id) || 0,
                entity2: state.metrics.statusApplied.get(fighter2.id) || 0,
            },
            turnsStunned: {
                entity1: state.metrics.turnsStunned.get(fighter1.id) || 0,
                entity2: state.metrics.turnsStunned.get(fighter2.id) || 0,
            },
            timeline,
        };
    }

    /**
     * Convert EntityStats to StatBlock format required by combat engine
     * 
     * Uses BASELINE_STATS as reference for missing values
     */
    private entityToStatBlock(entity: any): StatBlock {
        // ✅ INHERIT baseline stats, override only what's provided
        return {
            ...BASELINE_STATS, // Start with validated baseline

            // Override with entity-specific stats
            hp: entity.hp ?? BASELINE_STATS.hp,
            damage: entity.attack ?? entity.damage ?? BASELINE_STATS.damage,
            armor: entity.defense ?? entity.armor ?? BASELINE_STATS.armor,
            resistance: entity.resistance ?? BASELINE_STATS.resistance,

            // Hit chance stats
            txc: entity.txc ?? BASELINE_STATS.txc,
            evasion: entity.evasion ?? BASELINE_STATS.evasion,

            // Critical stats
            critChance: entity.critChance ?? BASELINE_STATS.critChance,
            critMult: entity.critMult ?? BASELINE_STATS.critMult,
            critTxCBonus: entity.critTxCBonus ?? BASELINE_STATS.critTxCBonus,

            // Fail stats
            failChance: entity.failChance ?? BASELINE_STATS.failChance,
            failMult: entity.failMult ?? BASELINE_STATS.failMult,
            failTxCMalus: entity.failTxCMalus ?? BASELINE_STATS.failTxCMalus,

            // Penetration stats
            armorPen: entity.armorPen ?? BASELINE_STATS.armorPen,
            penPercent: entity.penPercent ?? BASELINE_STATS.penPercent,

            // Config flags
            configFlatFirst: entity.configFlatFirst ?? BASELINE_STATS.configFlatFirst,
            configApplyBeforeCrit: entity.configApplyBeforeCrit ?? BASELINE_STATS.configApplyBeforeCrit,
        } as StatBlock;
    }

    /**
   * Extract turn-by-turn data from combat log
   */
    private extractTurnLog(state: any): TurnData[] {
        const turnLog: TurnData[] = [];

        // Parse combat log for attack entries
        let currentTurn = 0;

        for (const entry of state.log) {
            // Track turn markers
            if (entry.message.startsWith('--- Turn')) {
                currentTurn = entry.turn;
                continue;
            }

            // Parse attack messages
            if (entry.type === 'attack' && entry.message.includes('attacks')) {
                // Example: "Entity 1 attacks Entity 2 for 25 damage. (75/100 HP left)"
                const match = entry.message.match(/attacks .+ for (\d+) damage\. \((\d+)\/\d+ HP left\)/);

                if (match) {
                    const damageDealt = parseInt(match[1]);
                    const defenderHPRemaining = parseInt(match[2]);

                    // Determine attacker based on message
                    const isEntity1Attacking = entry.message.startsWith('Entity 1') || entry.message.startsWith('entity1');

                    turnLog.push({
                        turnNumber: currentTurn,
                        attacker: isEntity1Attacking ? 'entity1' : 'entity2',
                        defender: isEntity1Attacking ? 'entity2' : 'entity1',
                        damageDealt,
                        defenderHPRemaining,
                    });
                }
            }
        }

        return turnLog;
    }

    private captureTeams(state: CombatState): CombatTeamSnapshot[] {
        return [
            this.buildTeamSnapshot(state.teamA, 'A', state),
            this.buildTeamSnapshot(state.teamB, 'B', state)
        ];
    }

    private buildTeamSnapshot(team: Entity[], teamId: 'A' | 'B', state: CombatState): CombatTeamSnapshot {
        return {
            teamId,
            members: team.map(entity => this.buildActorSnapshot(entity, teamId, state))
        };
    }

    private buildActorSnapshot(entity: Entity, team: 'A' | 'B', state: CombatState): CombatActorSnapshot {
        const effects = state.entityEffects.get(entity.id) || [];
        return {
            id: entity.id,
            name: entity.name,
            team,
            hp: Math.max(0, entity.currentHp),
            maxHp: entity.statBlock?.hp ?? entity.derivedStats.maxHp ?? 0,
            isAlive: entity.isAlive(),
            shieldValue: this.calculateShieldValue(effects),
            statusEffects: this.summarizeStatusEffects(effects),
            state: entity.isAlive() ? 'idle' : 'defeated',
            spriteId: entity.spriteId,
            spritePalette: entity.spritePalette,
            tags: entity.tags
        };
    }

    private calculateShieldValue(effects: AnyStatusEffect[]): number {
        return effects
            .filter(effect => effect.type === 'shield')
            .reduce((total, effect) => total + ((effect as ShieldEffect).shieldAmount || 0), 0);
    }

    private summarizeStatusEffects(effects: AnyStatusEffect[]): StatusEffectSummary[] {
        return effects.map(effect => ({
            id: effect.id,
            type: effect.type,
            remainingDuration: effect.duration,
            potency: 'tickDamage' in effect ? (effect as OverTimeEffect).tickDamage : undefined,
            shieldValue: effect.type === 'shield' ? (effect as ShieldEffect).shieldAmount : undefined
        }));
    }

    private computeHpDelta(start: CombatTeamSnapshot[], end: CombatTeamSnapshot[]): Record<string, number> {
        const delta: Record<string, number> = {};
        const endMap = new Map<string, CombatActorSnapshot>();
        end.forEach(team => team.members.forEach(member => endMap.set(member.id, member)));

        start.forEach(team => {
            team.members.forEach(member => {
                const after = endMap.get(member.id);
                if (after) {
                    delta[member.id] = member.hp - after.hp;
                }
            });
        });

        return delta;
    }

    private buildPhaseEvents(entries: CombatLogEntry[]): CombatPhaseEvent[] {
        const buckets: Record<CombatPhaseEvent['phase'], CombatLogEntry[]> = {
            prep: [],
            initiative: [],
            action: [],
            resolution: []
        };

        entries.forEach(entry => {
            const phase = this.mapLogToPhase(entry);
            buckets[phase].push(entry);
        });

        return (Object.entries(buckets) as [CombatPhaseEvent['phase'], CombatLogEntry[]][])
            .filter(([, events]) => events.length > 0)
            .map(([phase, events]) => ({ phase, events }));
    }

    private mapLogToPhase(entry: CombatLogEntry): CombatPhaseEvent['phase'] {
        if (entry.type === 'info' && entry.message.includes('Turn')) return 'prep';
        if (entry.type === 'info' && entry.message.includes('Initiative')) return 'initiative';
        if (entry.type === 'initiative') return 'initiative';
        if (entry.type === 'death' || entry.message.includes('wins') || entry.message.includes('Draw')) return 'resolution';
        if (['heal', 'hot', 'dot', 'buff', 'debuff'].includes(entry.type)) return 'prep';
        return 'action';
    }
}
