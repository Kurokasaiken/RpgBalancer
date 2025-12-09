import { describe, it, expect } from 'vitest';
import type { RNG } from '../../../../balancing/simulation/types';
import { TACTICAL_MISSIONS } from '../../../../balancing/config/tacticalConfig';
import type { GridState } from '../../../grid/combatTypes';
import { TacticalMissionRunner } from '../TacticalMissionRunner';
import { TacticalTurnEngine } from '../TacticalTurnEngine';
import { DEFAULT_STATS } from '../../../../balancing/types';

function createTestGrid(width: number, height: number): GridState {
  const tiles = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({ x, y, walkable: true, terrainCost: 1 });
    }
    tiles.push(row);
  }
  return { width, height, tiles };
}

function createDeterministicRng(): RNG {
  let seed = 1;
  return () => {
    // Simple LCG
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('TacticalMissionRunner + TacticalTurnEngine', () => {
  it('can initialize test_engagement mission and resolve basic attacks without crashing', () => {
    const mission = TACTICAL_MISSIONS.test_engagement;
    const grid = createTestGrid(8, 8);

    const resolveStats = () => ({ ...DEFAULT_STATS });
    const getMaxApForUnit = () => 2;

    const battle = TacticalMissionRunner.initBattleFromMission({
      mission,
      grid,
      resolveStats,
      getMaxApForUnit,
    });

    const rng = createDeterministicRng();

    // Simple scripted turn: first player unit attacks first enemy if possible
    const player = battle.units.find((u) => u.team === 'player');
    const enemy = battle.units.find((u) => u.team === 'enemy');

    expect(player).toBeDefined();
    expect(enemy).toBeDefined();

    if (!player || !enemy) return;

    TacticalTurnEngine.beginTurn(battle, player.id);

    TacticalTurnEngine.performAction(
      battle,
      {
        unitId: player.id,
        actionId: 'attack',
        targetUnitId: enemy.id,
      },
      rng,
    );

    // After the attack, mission evaluation should not throw and should be one of the valid states
    const progress = TacticalMissionRunner.evaluateMissionProgress(mission, battle);
    expect(['ongoing', 'victory', 'defeat']).toContain(progress);
  });
});
