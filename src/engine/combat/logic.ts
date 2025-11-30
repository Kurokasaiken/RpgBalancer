import type { CombatState } from './state';
import { HitChanceModule } from '../../balancing/modules/hitchance';
import { MitigationModule } from '../../balancing/modules/mitigation';
import { CriticalModule } from '../../balancing/modules/critical';
import { SustainModule } from '../../balancing/modules/sustain';
import { DotModule } from '../../balancing/modules/dot';
import { BuffModule } from '../../balancing/modules/buffs';
import type { RNG } from '../../balancing/simulation/types';

// ... (inside resolveCombatRound)

// 1. Hit Chance (Always active for now, but could be toggled)


export function resolveCombatRound(state: CombatState, rng: RNG = Math.random): CombatState {
    if (state.isFinished) return state;

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

    // ========== DOT/HOT: Apply Periodic Effects ==========
    // ARCHITECTURE: Inheriting formula from DotModule
    for (const { entity } of allEntities) {
        const effects = state.entityEffects.get(entity.id);
        if (!effects || effects.dots.length === 0) continue;

        // Apply each DoT/HoT tick
        effects.dots.forEach(dot => {
            const result = DotModule.applyTick(
                entity.currentHp,
                dot.amountPerTurn * (dot.currentStacks || 1),
                entity.statBlock?.hp || entity.currentHp
            );

            entity.currentHp = result.newHp;

            if (Math.abs(result.actualAmount) > 0) {
                const dotType = dot.type === 'damage' ? 'takes' : 'heals';
                state.log.push({
                    turn: state.turn,
                    message: `${entity.name} ${dotType} ${Math.abs(result.actualAmount).toFixed(1)} from ${dot.source}`,
                    type: dot.type
                });
            }
        });

        // Tick down durations
        effects.dots = DotModule.tickDurations(effects.dots);
    }

    // ========== BUFFS: Tick Down Durations ==========
    // ARCHITECTURE: Inheriting from BuffModule
    for (const { entity } of allEntities) {
        const effects = state.entityEffects.get(entity.id);
        if (!effects) continue;

        effects.buffs = BuffModule.tickDurations(effects.buffs);
    }

    // Sort by speed (descending)
    allEntities.sort((a, b) => b.entity.derivedStats.speed - a.entity.derivedStats.speed);

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

        // Simple AI: Attack random living enemy
        const target = livingEnemies[Math.floor(rng() * livingEnemies.length)];

        // Perform Attack
        let totalDamage = 0;
        const isHit = true; // Default to true for legacy

        // --- STAT BLOCK LOGIC (Balancing Lab) ---
        if (entity.statBlock && target.statBlock) {
            const attackerStats = entity.statBlock;
            const defenderStats = target.statBlock;

            // ========== BUFFS: Apply to Stats ==========
            // ARCHITECTURE: Inheriting from BuffModule
            const attackerEffects = state.entityEffects.get(entity.id);
            const defenderEffects = state.entityEffects.get(target.id);

            // Apply buffs to attacker damage
            const buffedDamage = attackerEffects
                ? BuffModule.applyStatModifiers(attackerStats.damage, attackerEffects.buffs, 'damage')
                : attackerStats.damage;

            // Apply buffs to defender armor
            const buffedArmor = defenderEffects
                ? BuffModule.applyStatModifiers(defenderStats.armor, defenderEffects.buffs, 'armor')
                : defenderStats.armor;

            // 1. Hit Chance
            const hitChance = HitChanceModule.calculateHitChance(attackerStats.txc, defenderStats.evasion);
            const hitRoll = rng() * 100;
            const isHit = hitRoll <= hitChance;

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
            // ========== SHIELDS: Absorb Damage First ==========
            // ARCHITECTURE: Inheriting from BuffModule
            const targetEffects = state.entityEffects.get(target.id);
            let damageToHp = totalDamage;

            if (targetEffects && targetEffects.buffs.length > 0) {
                const result = BuffModule.applyDamageToShields(
                    totalDamage,
                    targetEffects.buffs
                );

                targetEffects.buffs = result.updatedBuffs;
                damageToHp = result.remainingDamage;

                const shieldAbsorbed = totalDamage - damageToHp;
                if (shieldAbsorbed > 0) {
                    state.log.push({
                        turn: state.turn,
                        message: `${target.name}'s shield absorbs ${shieldAbsorbed.toFixed(0)} damage!`,
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
