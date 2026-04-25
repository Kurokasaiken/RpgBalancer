import { useMemo, useState } from 'react';
import type { RNG } from '../../balancing/simulation/types';
import { DEFAULT_STATS } from '../../balancing/types';
import { TACTICAL_MISSIONS } from '../../balancing/config/tacticalConfig';
import { TacticalMissionRunner } from '../../engine/game/tactical/TacticalMissionRunner';
import { TacticalTurnEngine, type TacticalBattleState } from '../../engine/game/tactical/TacticalTurnEngine';
import type { GridState } from '../../engine/grid/combatTypes';

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

const rng: RNG = () => Math.random();

export function TacticalDebugPage() {
  const mission = TACTICAL_MISSIONS.test_engagement;

  const [battle, setBattle] = useState<TacticalBattleState>(() => {
    const grid = createTestGrid(8, 8);
    return TacticalMissionRunner.initBattleFromMission({
      mission,
      grid,
      resolveStats: () => ({ ...DEFAULT_STATS }),
      getMaxApForUnit: () => 2,
    });
  });

  const [lastAction, setLastAction] = useState<string | null>(null);

  const progress = useMemo(
    () => TacticalMissionRunner.evaluateMissionProgress(mission, battle),
    [mission, battle],
  );

  const runScriptedTurn = () => {
    const player = battle.units.find((u) => u.team === 'player' && u.isAlive);
    const enemy = battle.units.find((u) => u.team === 'enemy' && u.isAlive);
    if (!player || !enemy) return;

    setBattle((prev) => {
      const cloned: TacticalBattleState = JSON.parse(JSON.stringify(prev));
      TacticalTurnEngine.beginTurn(cloned, player.id);
      TacticalTurnEngine.performAction(
        cloned,
        {
          unitId: player.id,
          actionId: 'attack',
          targetUnitId: enemy.id,
        },
        rng,
      );
      return cloned;
    });

    setLastAction(`Turn executed: ${player.name} attacks ${enemy.name}`);
  };

  const grid = battle.grid;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-amber-100">Tactical Debug - Test Engagement</h2>
            <p className="text-xs text-amber-200/70">
              Mission: {mission.name} · Status: <span className="font-mono">{progress}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={runScriptedTurn}
            className="px-3 py-1.5 text-xs rounded bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow"
          >
            Run Scripted Turn
          </button>
        </div>

        <div
          className="grid bg-slate-900 p-2 rounded-xl border border-slate-800"
          style={{
            gridTemplateColumns: `repeat(${grid.width}, minmax(0, 1fr))`,
            aspectRatio: '1 / 1',
          }}
          data-testid="tactical-debug-grid"
        >
          {Array.from({ length: grid.height }).map((_, y) =>
            Array.from({ length: grid.width }).map((__, x) => {
              const unit = battle.units.find(
                (u) => u.isAlive && u.position.x === x && u.position.y === y,
              );
              const isPlayer = unit?.team === 'player';
              return (
                <div
                  key={`${x}-${y}`}
                  className="relative border border-slate-800/60 flex items-center justify-center text-[10px] text-slate-300"
                >
                  {unit && (
                    <div
                      className={`flex flex-col items-center justify-center w-8 h-8 rounded-full text-[9px] font-semibold ${
                        isPlayer ? 'bg-cyan-500/80 text-slate-900' : 'bg-rose-500/80 text-slate-900'
                      }`}
                    >
                      <span>{unit.name[0]}</span>
                      <span>{Math.round((unit.currentHp / unit.baseStats.hp) * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-amber-100 mb-2">Units</h3>
          <div className="space-y-1.5 text-[11px] text-slate-200">
            {battle.units.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded bg-slate-800/60 px-2 py-1"
              >
                <div>
                  <div className={u.team === 'player' ? 'text-cyan-300' : 'text-rose-300'}>{u.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Team: {u.team} · HP: {u.currentHp}/{u.baseStats.hp}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">AP: {u.currentAp}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-amber-100 mb-2">Log</h3>
          <div className="text-[11px] text-slate-200 space-y-1 max-h-40 overflow-y-auto">
            {lastAction && (
              <div className="border-l-2 border-amber-500 pl-2 text-amber-100/80">{lastAction}</div>
            )}
            {battle.log.slice(0, 10).map((entry, i) => (
              <div key={i} className="border-l border-slate-700 pl-2 text-slate-300/90">
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
