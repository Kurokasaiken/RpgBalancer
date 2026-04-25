import type { GridState, Position } from '../../grid/combatTypes';
import { TACTICAL_ACTIONS } from '../../../balancing/config/tacticalConfig';
import { findPath } from '../../pathfinding/AStar';
import { RangeCalculator } from '../../grid/RangeCalculator';
import { HitChanceModule } from '../../../balancing/modules/hitchance';
import { CriticalModule } from '../../../balancing/modules/critical';
import { MitigationModule } from '../../../balancing/modules/mitigation';
import type { StatBlock } from '../../../balancing/types';
import type { RNG } from '../../../balancing/simulation/types';

export interface TacticalUnitState {
  id: string;
  name: string;
  team: 'player' | 'enemy';
  position: Position;
  baseStats: StatBlock;
  currentHp: number;
  currentAp: number;
  maxAp: number;
  isAlive: boolean;
}

export interface TacticalBattleState {
  grid: GridState;
  units: TacticalUnitState[];
  activeUnitId: string | null;
  turn: number;
  log: string[];
}

export interface TacticalActionRequest {
  unitId: string;
  actionId: string;
  targetPosition?: Position;
   targetUnitId?: string;
}

export class TacticalTurnEngine {
  static beginTurn(state: TacticalBattleState, unitId: string): void {
    const unit = state.units.find(u => u.id === unitId && u.isAlive);
    if (!unit) return;

    state.activeUnitId = unitId;
    unit.currentAp = unit.maxAp;
    state.turn += 1;
    state.log.unshift(`Turn ${state.turn}: ${unit.name}`);
  }

  static performAction(state: TacticalBattleState, request: TacticalActionRequest, rng: RNG): void {
    const unit = state.units.find(u => u.id === request.unitId && u.isAlive);
    if (!unit) return;
    if (state.activeUnitId !== unit.id) return;

    const def = TACTICAL_ACTIONS[request.actionId];
    if (!def) return;

    if (unit.currentAp < def.baseApCost) {
      state.log.unshift(`${unit.name} does not have enough AP for ${def.label}`);
      return;
    }

    if (def.kind === 'move') {
      if (!request.targetPosition) return;

      const maxRange = def.maxRange ?? 1;
      if (maxRange <= 0) return;

      const path = findPath(unit.position, request.targetPosition, state.grid);
      if (!path || path.length < 2) return;

      const stepsAvailable = Math.min(maxRange, path.length - 1);
      const destination = path[stepsAvailable];

      const tile = state.grid.tiles[destination.y]?.[destination.x];
      if (!tile || !tile.walkable || tile.blocker) return;

      const occupied = state.units.some(u =>
        u.isAlive &&
        u.id !== unit.id &&
        u.position.x === destination.x &&
        u.position.y === destination.y,
      );
      if (occupied) return;

      unit.position = { ...destination };
      unit.currentAp -= def.baseApCost;
      state.log.unshift(
        `${unit.name} moves to (${unit.position.x}, ${unit.position.y}) [${stepsAvailable} tiles]`,
      );

      return;
    }

    if (def.kind === 'attack') {
      const targetId = request.targetUnitId;
      if (!targetId) return;

      const target = state.units.find(u => u.id === targetId && u.isAlive);
      if (!target) return;

      const minRange = def.minRange ?? 1;
      const maxRange = def.maxRange ?? 8;

      const distance = RangeCalculator.getDistance(unit.position, target.position);
      if (distance < minRange || distance > maxRange) {
        state.log.unshift(`${unit.name} is out of range to attack ${target.name}`);
        return;
      }

      if (def.requiresLineOfSight) {
        const hasLoS = RangeCalculator.hasLineOfSight(unit.position, target.position, state.grid);
        if (!hasLoS) {
          state.log.unshift(`${unit.name} has no line of sight to ${target.name}`);
          return;
        }
      }

      const attackerStats: StatBlock = { ...unit.baseStats };
      const defenderStats: StatBlock = { ...target.baseStats };

      // Hit check
      const hitChance = HitChanceModule.calculateHitChance(attackerStats.txc, defenderStats.evasion);
      const hitRoll = rng() * 100;
      const isHit = hitRoll <= hitChance;

      if (!isHit) {
        state.log.unshift(`${unit.name} misses ${target.name}!`);
        unit.currentAp -= def.baseApCost;
        return;
      }

      // Crit check
      const critRoll = rng() * 100;
      const isCrit = critRoll <= attackerStats.critChance;

      let damage = attackerStats.damage;
      if (isCrit) {
        damage = CriticalModule.calculateCriticalDamage(damage, attackerStats.critMult);
      }

      const finalDamage = MitigationModule.calculateEffectiveDamage(
        damage,
        defenderStats.armor,
        defenderStats.resistance,
        attackerStats.armorPen,
        attackerStats.penPercent,
        defenderStats.configFlatFirst,
      );

      target.currentHp = Math.max(0, target.currentHp - finalDamage);
      if (target.currentHp <= 0) {
        target.isAlive = false;
      }

      unit.currentAp -= def.baseApCost;

      state.log.unshift(
        `${unit.name} ${isCrit ? 'CRITS' : 'hits'} ${target.name} for ${finalDamage.toFixed(1)} damage!`,
      );

      if (!target.isAlive) {
        state.log.unshift(`${target.name} has been defeated!`);
      }

      return;
    }
  }
}
