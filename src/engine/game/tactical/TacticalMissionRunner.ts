import type { GridState } from '../../grid/combatTypes';
import type { StatBlock } from '../../../balancing/types';
import type { TacticalMissionConfig, TacticalObjectiveType } from './TacticalTypes';
import type { TacticalBattleState, TacticalUnitState } from './TacticalTurnEngine';

export type TacticalMissionProgress = 'ongoing' | 'victory' | 'defeat';

export interface TacticalMissionInitOptions {
  mission: TacticalMissionConfig;
  grid: GridState;
  resolveStats: (refId: string) => StatBlock;
  getMaxApForUnit: (refId: string, stats: StatBlock) => number;
}

export class TacticalMissionRunner {
  static initBattleFromMission(options: TacticalMissionInitOptions): TacticalBattleState {
    const { mission, grid, resolveStats, getMaxApForUnit } = options;

    const units: TacticalUnitState[] = [];

    for (const squad of mission.squads) {
      for (const member of squad.members) {
        if (member.spawnX == null || member.spawnY == null) {
          continue;
        }

        const stats = resolveStats(member.id);
        const maxAp = getMaxApForUnit(member.id, stats);

        units.push({
          id: `${squad.id}_${member.id}_${units.length}`,
          name: member.id,
          team: squad.team,
          position: { x: member.spawnX, y: member.spawnY },
          baseStats: stats,
          currentHp: stats.hp,
          currentAp: 0,
          maxAp,
          isAlive: true,
        });
      }
    }

    return {
      grid,
      units,
      activeUnitId: null,
      turn: 0,
      log: [],
    };
  }

  static evaluateMissionProgress(
    mission: TacticalMissionConfig,
    battle: TacticalBattleState,
  ): TacticalMissionProgress {
    const primaryObjectives = mission.objectives.filter((o) => o.isPrimary);

    if (primaryObjectives.length === 0) {
      return 'ongoing';
    }

    const types = new Set<TacticalObjectiveType>(primaryObjectives.map((o) => o.type));

    if (types.has('eliminateAllEnemies')) {
      return this.evaluateEliminateAllEnemies(battle);
    }

    return 'ongoing';
  }

  private static evaluateEliminateAllEnemies(battle: TacticalBattleState): TacticalMissionProgress {
    const anyPlayerAlive = battle.units.some((u) => u.team === 'player' && u.isAlive);
    const anyEnemyAlive = battle.units.some((u) => u.team === 'enemy' && u.isAlive);

    if (anyPlayerAlive && anyEnemyAlive) return 'ongoing';
    if (anyPlayerAlive && !anyEnemyAlive) return 'victory';
    if (!anyPlayerAlive && anyEnemyAlive) return 'defeat';

    return 'defeat';
  }
}
