import type { CombatState } from './state';
import { HitChanceModule } from '../../balancing/modules/hitchance';
import { MitigationModule } from '../../balancing/modules/mitigation';
import { CriticalModule } from '../../balancing/modules/critical';
import { SustainModule } from '../../balancing/modules/sustain';
import { StatusEffectManager, StatusEffectFactory } from '../../balancing/statusEffects/StatusEffectManager';
import { InitiativeModule } from '../../balancing/modules/initiative';
import type { EffectedCharacter } from '../../balancing/statusEffects/StatusEffectManager';
import type { RNG } from '../../balancing/simulation/types';
import { DEFAULT_STATS } from '../../balancing/types';

// ... (inside resolveCombatRound)

// 1. Hit Chance (Always active for now, but could be toggled)


export function resolveCombatRound(state: CombatState, rng: RNG): CombatState {
    if (state.isFinished) return state;

    const effectManager = new StatusEffectManager();

    state.turn++;
    state.log.push({ turn: state.turn, message: `--- Turn ${state.turn} ---`, type: 'info' });

    // Collect all living entities
    const allEntities = [
        ...state.teamA.filter(e => e.isAlive()).map(e => ({ entity: e, team: 'A' })),
        ...state.teamB.filter(e => e.isAlive()).map(e => ({ entity: e, team: 'B' }))
    ];

    // ========== SUSTAIN: Apply Regen at Start of Turn ==========
    // ARCHITECTURE: Inheriting formula from SustainModule
    for (const { entity } of allEntities) {
        if (entity.statBlock && entity.statBlock.regen > 0) {
            const regenHeal = SustainModule.calculateRegenHeal(entity.statBlock.regen);
            const actualHeal = SustainModule.applyHealingCap(
                entity.currentHp,
                regenHeal,
                entity.statBlock.hp
            );

            if (actualHeal > 0) {
                entity.currentHp += actualHeal;
                state.log.push({
                    turn: state.turn,
                    message: `${entity.name} regenerates ${actualHeal.toFixed(1)} HP (${entity.currentHp.toFixed(0)}/${entity.statBlock.hp})`,
                    type: 'heal'
                });
            }
        }
    }

    // ========== STATUS EFFECTS: Process DoTs, HoTs, Stuns, etc. ==========
    for (const { entity } of allEntities) {
        const effects = state.entityEffects.get(entity.id) || [];

        // Create adapter for StatusEffectManager
        const effectedChar: EffectedCharacter = {
            id: entity.id,
            name: entity.name,
            baseStats: entity.statBlock || DEFAULT_STATS,
            statusEffects: effects
        };

        // Process effects (DoTs, HoTs, etc.)
        const result = effectManager.processEffects(effectedChar);

        // Apply DoT damage
        if (result.damageReceived > 0) {
            entity.takeDamage(result.damageReceived);
            state.log.push({
                turn: state.turn,
                message: `${entity.name} takes ${result.damageReceived.toFixed(1)} damage from effects`,
                type: 'dot'
            });
        }

        // Apply HoT healing
        if (result.healingReceived > 0) {
            entity.heal(result.healingReceived);
            state.log.push({
                turn: state.turn,
                message: `${entity.name} heals ${result.healingReceived.toFixed(1)} HP from effects`,
                type: 'hot'
            });
        }

        // Tick down durations at end of turn (or start? usually end, but logic.ts had it at start)
        // logic.ts had it at start. Let's keep it here.
        effectManager.tickDuration(effectedChar);

        // Update state with modified effects list
        state.entityEffects.set(entity.id, effectedChar.statusEffects);
    }

    // ========== INITIATIVE: Determine Turn Order ==========
    // ARCHITECTURE: Using InitiativeModule for dynamic turn order
    const initiativeCandidates = allEntities.map(({ entity }) => ({
        id: entity.id,
        agility: entity.statBlock?.agility || entity.derivedStats.speed || 0
    }));

    const initiativeRolls = InitiativeModule.generateDetailedRolls(initiativeCandidates, rng);

    // Record initiative metrics
    initiativeRolls.forEach(roll => {
        const rolls = state.metrics.initiativeRolls.get(roll.characterId) || [];
        rolls.push(roll.totalInitiative);
        state.metrics.initiativeRolls.set(roll.characterId, rolls);
    });

    // Log initiative rolls
    state.log.push({
        turn: state.turn,
        message: `Initiative Order: ${initiativeRolls.map(r => {
            const name = allEntities.find(e => e.entity.id === r.characterId)?.entity.name || r.characterId;
            return `${name} (${r.totalInitiative.toFixed(1)})`;
        }).join(', ')}`,
        type: 'info'
    });

    // Sort entities based on initiative rolls
    allEntities.sort((a, b) => {
        const rollA = initiativeRolls.find(r => r.characterId === a.entity.id)?.totalInitiative || 0;
        const rollB = initiativeRolls.find(r => r.characterId === b.entity.id)?.totalInitiative || 0;
        return rollB - rollA;
    });

    for (const { entity, team } of allEntities) {
        if (!entity.isAlive()) continue; // Might have died during this turn

        // Find target
        const enemyTeam = team === 'A' ? state.teamB : state.teamA;
        const livingEnemies = enemyTeam.filter(e => e.isAlive());

        if (livingEnemies.length === 0) {
            state.isFinished = true;
            state.winner = team === 'A' ? 'teamA' : 'teamB';
            state.log.push({ turn: state.turn, message: `Team ${team} wins!`, type: 'info' });
            return state;
        }

        // Check for Stun
        const currentEffects = state.entityEffects.get(entity.id) || [];
        const isStunned = currentEffects.some(e => e.type === 'stun');

        if (isStunned) {
            state.log.push({ turn: state.turn, message: `${entity.name} is stunned and cannot act!`, type: 'info' });
            state.metrics.turnsStunned.set(entity.id, (state.metrics.turnsStunned.get(entity.id) || 0) + 1);
            continue;
        }

        // Simple AI: Attack random living enemy
        const target = livingEnemies[Math.floor(rng() * livingEnemies.length)];

        // --- SPELL CASTING LOGIC ---
        // Check if entity has spells to cast
        let spellCast = false;
        if (entity.spells && entity.spells.length > 0) {
            // Simple AI: Filter for buff/debuff spells that are off cooldown (assuming all ready for now)
            const availableSpells = entity.spells.filter(s => s.type === 'buff' || s.type === 'debuff');

            if (availableSpells.length > 0) {
                // 50% chance to cast a spell if available
                if (rng() < 0.5) {
                    const spell = availableSpells[Math.floor(rng() * availableSpells.length)];
                    spellCast = true;

                    // Create effect
                    if (spell.type === 'buff' || spell.type === 'debuff') {
                        const statChanges: Partial<typeof DEFAULT_STATS> = {};
                        if (spell.targetStat) {
                            // For debuffs, the effect should be negative if it's not already
                            // But usually debuffs are defined with negative values or positive values that mean reduction?
                            // In spellTypes.ts, effect is "Base effect percentage".
                            // Let's assume for debuffs we invert it if it's positive, or trust the user input.
                            // User input in UI: "Modification %". If user puts 20% for debuff, it likely means -20%.
                            // But let's look at SpellCreation.tsx:
                            // {spell.type === 'buff' ? 'Increases' : 'Decreases'} ... {Math.abs(spell.effect)}%
                            // So the UI treats it as absolute value and applies sign based on type.
                            // We should do the same here.
                            let value = Math.abs(spell.effect);
                            if (spell.type === 'debuff') value = -value;
                            (statChanges as any)[spell.targetStat] = value;
                        }

                        const effect = spell.type === 'buff'
                            ? StatusEffectFactory.createBuff(statChanges, spell.eco || 1, spell.name, entity.name)
                            : StatusEffectFactory.createDebuff(statChanges, spell.eco || 1, spell.name, entity.name);

                        // Apply to target (Debuff) or Self (Buff)
                        // Usually buffs are self, debuffs are enemy.
                        const targetEntity = spell.type === 'buff' ? entity : target;

                        // We need to get the EffectedCharacter adapter for the target
                        const targetEffects = state.entityEffects.get(targetEntity.id) || [];
                        const targetAdapter: EffectedCharacter = {
                            id: targetEntity.id,
                            name: targetEntity.name,
                            baseStats: targetEntity.statBlock || DEFAULT_STATS,
                            statusEffects: targetEffects
                        };

                        effectManager.applyEffect(targetAdapter, effect);
                        state.metrics.statusApplied.set(entity.id, (state.metrics.statusApplied.get(entity.id) || 0) + 1);

                        // Update state
                        state.entityEffects.set(targetEntity.id, targetAdapter.statusEffects);

                        state.log.push({
                            turn: state.turn,
                            message: `${entity.name} casts ${spell.name} on ${targetEntity.name} (${spell.type === 'buff' ? 'Buff' : 'Debuff'} ${spell.targetStat} by ${spell.effect}%)`,
                            type: spell.type
                        });
                    }
                }
            }
        }

        if (spellCast) continue; // Skip basic attack if spell was cast

        // Perform Attack

        // Perform Attack
        let totalDamage = 0;
        // The `isHit` variable is declared here and used later in the `if (isHit)` block.
        // The `isHit` inside the `if (entity.statBlock && target.statBlock)` block is a separate, block-scoped variable.
        const isHit = true; // Default to true for legacy

        // --- STAT BLOCK LOGIC (Balancing Lab) ---
        if (entity.statBlock && target.statBlock) {
            const attackerStats = entity.statBlock;
            const defenderStats = target.statBlock;

            // ========== BUFFS: Apply to Stats ==========
            // ARCHITECTURE: Using StatusEffectManager
            const attackerEffectsList = state.entityEffects.get(entity.id) || [];
            const defenderEffectsList = state.entityEffects.get(target.id) || [];

            const attackerAdapter: EffectedCharacter = {
                id: entity.id,
                name: entity.name,
                baseStats: attackerStats,
                statusEffects: attackerEffectsList
            };

            const defenderAdapter: EffectedCharacter = {
                id: target.id,
                name: target.name,
                baseStats: defenderStats,
                statusEffects: defenderEffectsList
            };

            const effectiveAttackerStats = effectManager.getEffectiveStats(attackerAdapter);
            const effectiveDefenderStats = effectManager.getEffectiveStats(defenderAdapter);

            // Use effective stats
            const buffedDamage = effectiveAttackerStats.damage;
            const buffedArmor = effectiveDefenderStats.armor;

            // 1. Hit Chance
            const hitChance = HitChanceModule.calculateHitChance(attackerStats.txc, defenderStats.evasion);
            const hitRoll = rng() * 100;
            const isHit = hitRoll <= hitChance;

            state.metrics.attacks.set(entity.id, (state.metrics.attacks.get(entity.id) || 0) + 1);

            if (!isHit) {
                state.log.push({
                    turn: state.turn,
                    message: `${entity.name} misses ${target.name} (Chance: ${hitChance.toFixed(0)}%, Roll: ${hitRoll.toFixed(0)})`,
                    type: 'info'
                });
                // Continue to next entity instead of returning from function
                continue;
            }

            // 2. Critical Hits
            // Logic always runs. If user wants "no crits", they should set chance to 0.
            // "Deactivated" module just means it's a fixed global rule, not dynamic.
            let isCritical = false;
            let rawDamage = buffedDamage; // Use buffed damage!

            const critRoll = rng() * 100;
            isCritical = critRoll <= attackerStats.critChance;

            if (isCritical) {
                rawDamage = CriticalModule.calculateCriticalDamage(buffedDamage, attackerStats.critMult);
                state.log.push({ turn: state.turn, message: `${entity.name} CRITS!`, type: 'info' });
                state.metrics.crits.set(entity.id, (state.metrics.crits.get(entity.id) || 0) + 1);
            }

            // 3. Mitigation (using buffed armor!)
            // Logic always runs.
            const finalDamage = MitigationModule.calculateEffectiveDamage(
                rawDamage,
                buffedArmor, // Buffed armor!
                defenderStats.resistance,
                attackerStats.armorPen,
                attackerStats.penPercent,
                defenderStats.configFlatFirst
            );

            totalDamage = Math.round(finalDamage);
        }
        // --- LEGACY LOGIC (RPG Attributes) ---
        else {
            // Calculate Damage
            // Base damage + Weapon damage + Random variance (0.9 - 1.1)
            const baseDmg = entity.derivedStats.attackPower;
            const weaponDmg = entity.equipment.weapon?.damage || 0;
            const variance = 0.9 + rng() * 0.2;

            totalDamage = Math.floor((baseDmg + weaponDmg) * variance);

            // Check Crit
            if (rng() < entity.derivedStats.critChance) {
                totalDamage = Math.floor(totalDamage * 1.5);
                state.log.push({ turn: state.turn, message: `${entity.name} CRITS!`, type: 'info' });
            }

            // Simple Defense
            totalDamage = Math.max(1, totalDamage - target.derivedStats.defense);
        }

        if (isHit) {
            state.metrics.hits.set(entity.id, (state.metrics.hits.get(entity.id) || 0) + 1);

            // ========== SHIELDS: Absorb Damage First ==========
            // ARCHITECTURE: Using StatusEffectManager (Manual Shield Logic)
            const targetEffectsList = state.entityEffects.get(target.id) || [];
            let damageToHp = totalDamage;

            // Filter for shields
            const shields = targetEffectsList.filter(e => e.type === 'shield') as any[]; // Cast to any to access shieldAmount

            if (shields.length > 0) {
                let absorbedTotal = 0;

                for (const shield of shields) {
                    if (damageToHp <= 0) break;

                    const absorb = Math.min(damageToHp, shield.shieldAmount);
                    shield.shieldAmount -= absorb;
                    damageToHp -= absorb;
                    absorbedTotal += absorb;
                }

                // Remove depleted shields
                const activeEffects = targetEffectsList.filter(e => e.type !== 'shield' || (e as any).shieldAmount > 0);
                state.entityEffects.set(target.id, activeEffects);

                if (absorbedTotal > 0) {
                    state.log.push({
                        turn: state.turn,
                        message: `${target.name}'s shield absorbs ${absorbedTotal.toFixed(0)} damage!`,
                        type: 'info'
                    });
                }
            }

            // Apply remaining damage to HP
            target.takeDamage(Math.floor(damageToHp));

            state.log.push({
                turn: state.turn,
                message: `${entity.name} attacks ${target.name} for ${Math.floor(totalDamage)} damage. (${target.currentHp}/${target.derivedStats.maxHp} HP left)`,
                type: 'attack'
            });

            // ========== SUSTAIN: Apply Lifesteal After Damage ==========
            // ARCHITECTURE: Inheriting formula from SustainModule
            if (entity.statBlock && entity.statBlock.lifesteal > 0) {
                const lifestealHeal = SustainModule.calculateLifestealHeal(
                    totalDamage,
                    entity.statBlock.lifesteal
                );
                const actualHeal = SustainModule.applyHealingCap(
                    entity.currentHp,
                    lifestealHeal,
                    entity.statBlock.hp
                );

                if (actualHeal > 0) {
                    entity.currentHp += actualHeal;
                    state.log.push({
                        turn: state.turn,
                        message: `${entity.name} lifesteals ${actualHeal.toFixed(1)} HP (${entity.currentHp.toFixed(0)}/${entity.statBlock.hp})`,
                        type: 'heal'
                    });
                }
            }

            if (!target.isAlive()) {
                state.log.push({ turn: state.turn, message: `${target.name} dies!`, type: 'death' });
            }
        }
    }

    // Check win condition again at end of round
    const teamAAlive = state.teamA.some(e => e.isAlive());
    const teamBAlive = state.teamB.some(e => e.isAlive());

    if (!teamAAlive && !teamBAlive) {
        state.isFinished = true;
        state.winner = 'draw';
        state.log.push({ turn: state.turn, message: `Draw!`, type: 'info' });
    } else if (!teamAAlive) {
        state.isFinished = true;
        state.winner = 'teamB';
        state.log.push({ turn: state.turn, message: `Team B wins!`, type: 'info' });
    } else if (!teamBAlive) {
        state.isFinished = true;
        state.winner = 'teamA';
        state.log.push({ turn: state.turn, message: `Team A wins!`, type: 'info' });
    }

    return state;
}
