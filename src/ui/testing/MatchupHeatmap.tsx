import React, { useMemo } from 'react';
import type { MatchupResult } from '../../balancing/testing/RoundRobinRunner';

interface MatchupHeatmapProps {
  matchups: MatchupResult[];
  statIds: string[];
}

function getColor(winRate: number): string {
  if (winRate > 0.7) return 'bg-green-600';
  if (winRate > 0.6) return 'bg-green-500/70';
  if (winRate > 0.55) return 'bg-green-500/40';
  if (winRate > 0.45) return 'bg-slate-600';
  if (winRate > 0.4) return 'bg-red-500/40';
  if (winRate > 0.3) return 'bg-red-500/70';
  return 'bg-red-600';
}

export const MatchupHeatmap: React.FC<MatchupHeatmapProps> = ({
  matchups,
  statIds,
}) => {
  // Build NxN matrix
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};

    statIds.forEach((s) => {
      m[s] = {};
      statIds.forEach((s2) => {
        m[s][s2] = 0.5; // Default = draw
      });
    });

    matchups.forEach((match) => {
      m[match.statA][match.statB] = match.winRateA;
      m[match.statB][match.statA] = match.winRateB;
    });

    return m;
  }, [matchups, statIds]);

  if (statIds.length === 0) {
    return (
      <div className="text-center text-slate-500 py-4 text-xs">
        No matchup data yet. Run tests to see the heatmap.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
      <table className="border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="px-1 py-1 text-slate-500 text-[8px]">vs</th>
            {statIds.map((s) => (
              <th
                key={s}
                className="px-1 py-1 text-indigo-200 font-semibold text-center min-w-[32px]"
                title={s}
              >
                {s.slice(0, 4)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statIds.map((statA) => (
            <tr key={statA}>
              <th className="px-1 py-1 text-indigo-200 font-semibold text-right">
                {statA.slice(0, 4)}
              </th>
              {statIds.map((statB) => {
                const winRate = matrix[statA]?.[statB] ?? 0.5;
                const isSelf = statA === statB;
                return (
                  <td
                    key={`${statA}-${statB}`}
                    className={`px-1 py-1 text-center min-w-[32px] ${
                      isSelf ? 'bg-slate-800' : getColor(winRate)
                    } text-white cursor-help`}
                    title={`${statA} vs ${statB}: ${(winRate * 100).toFixed(0)}%`}
                  >
                    {isSelf ? '—' : (winRate * 100).toFixed(0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
