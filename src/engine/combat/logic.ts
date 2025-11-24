import type { CombatState } from './state';
import { HitChanceModule } from '../../balancing/modules/hitchance';
import { MitigationModule } from '../../balancing/modules/mitigation';
import { CriticalModule } from '../../balancing/modules/critical';

// ... (inside resolveCombatRound)

// 1. Hit Chance (Always active for now, but could be toggled)


export function resolveCombatRound(state: CombatState): CombatState {
    if (state.isFinished) return state;

    state.turn++;
    state.log.push({ turn: state.turn, message: `--- Turn ${state.turn} ---`, type: 'info' });

    // Collect all living entities
    const allEntities = [
        ...state.teamA.filter(e => e.isAlive()).map(e => ({ entity: e, team: 'A' })),
        ...state.teamB.filter(e => e.isAlive()).map(e => ({ entity: e, team: 'B' }))
    ];

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
        const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];

        // Perform Attack
        let totalDamage = 0;
        let isCrit = false;
        let isHit = true; // Default to true for legacy

        // --- STAT BLOCK LOGIC (Balancing Lab) ---
        if (entity.statBlock && target.statBlock) {
            const attackerStats = entity.statBlock;
            const defenderStats = target.statBlock;

            // 1. Hit Chance
            const hitChance = HitChanceModule.calculateHitChance(attackerStats.txc, defenderStats.evasion);
            const hitRoll = Math.random() * 100;
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
            let rawDamage = attackerStats.damage;

            const critRoll = Math.random() * 100;
            isCritical = critRoll <= attackerStats.critChance;

            if (isCritical) {
                rawDamage = CriticalModule.calculateCriticalDamage(attackerStats.damage, attackerStats.critMult);
                state.log.push({ turn: state.turn, message: `${entity.name} CRITS!`, type: 'info' });
            }

            // 3. Mitigation
            // Logic always runs.
            const finalDamage = MitigationModule.calculateEffectiveDamage(
                rawDamage,
                defenderStats.armor,
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
            const variance = 0.9 + Math.random() * 0.2;

            totalDamage = Math.floor((baseDmg + weaponDmg) * variance);

            // Check Crit
            if (Math.random() < entity.derivedStats.critChance) {
                totalDamage = Math.floor(totalDamage * 1.5);
                state.log.push({ turn: state.turn, message: `${entity.name} CRITS!`, type: 'info' });
            }

            // Simple Defense
            totalDamage = Math.max(1, totalDamage - target.derivedStats.defense);
        }

        if (isHit) {
            target.takeDamage(Math.floor(totalDamage));

            state.log.push({
                turn: state.turn,
                message: `${entity.name} attacks ${target.name} for ${Math.floor(totalDamage)} damage. (${target.currentHp}/${target.derivedStats.maxHp} HP left)`,
                type: 'attack'
            });

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
