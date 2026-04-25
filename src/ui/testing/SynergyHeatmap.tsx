import React from 'react';
import type { PairSynergyMetrics } from '../../balancing/testing/metrics';

interface SynergyHeatmapProps {
  synergies: PairSynergyMetrics[];
  getLabel?: (statId: string) => string;
}

export const SynergyHeatmap: React.FC<SynergyHeatmapProps> = ({ synergies, getLabel }) => {
  const statSet = new Set<string>();
  synergies.forEach((s) => {
    statSet.add(s.statA);
    statSet.add(s.statB);
  });
  const stats = Array.from(statSet).sort();

  const matrix: Record<string, Record<string, PairSynergyMetrics | undefined>> = {};
  stats.forEach((a) => {
    matrix[a] = {};
    stats.forEach((b) => {
      matrix[a][b] = undefined;
    });
  });

  synergies.forEach((s) => {
    // We only keep the highest tier per pair for now (largest pointsPerStat)
    const keyA = s.statA;
    const keyB = s.statB;
    const existing = matrix[keyA][keyB];
    if (!existing || existing.pointsPerStat < s.pointsPerStat) {
      matrix[keyA][keyB] = s;
      matrix[keyB][keyA] = s;
    }
  });

  const getCellColor = (ratio: number | undefined) => {
    if (ratio === undefined) return 'bg-slate-900/40';
    if (ratio > 1.15) return 'bg-rose-600/70';
    if (ratio > 1.05) return 'bg-amber-500/70';
    if (ratio > 0.95) return 'bg-slate-600/80';
    return 'bg-sky-600/70';
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur-md p-3 shadow-[0_18px_45px_rgba(15,23,42,0.9)] overflow-x-auto">
      <table className="border-collapse text-[10px] text-slate-200">
        <thead>
          <tr>
            <th className="px-2 py-1" />
            {stats.map((s) => {
              const label = getLabel ? getLabel(s) : s;
              return (
                <th
                  key={s}
                  className="px-2 py-1 text-center text-[10px] uppercase tracking-[0.18em] text-indigo-200"
                  title={label}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => (
            <tr key={row}>
              <th className="px-2 py-1 text-right text-[10px] uppercase tracking-[0.18em] text-indigo-200">
                {getLabel ? getLabel(row) : row}
              </th>
              {stats.map((col) => {
                const syn = matrix[row][col];
                const ratio = syn?.synergyRatio;
                const pct = ratio ? (ratio * 100).toFixed(0) : '';
                const labelRow = getLabel ? getLabel(row) : row;
                const labelCol = getLabel ? getLabel(col) : col;
                const title = syn
                  ? `${labelRow} + ${labelCol} @ +${syn.pointsPerStat}: ${pct}% of expected ( ${syn.assessment} )`
                  : '';
                return (
                  <td
                    key={`${row}-${col}`}
                    className={`w-8 h-6 text-center align-middle border border-slate-800/60 ${getCellColor(
                      ratio,
                    )}`}
                    title={title}
                  >
                    {row === col ? '—' : pct}
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
