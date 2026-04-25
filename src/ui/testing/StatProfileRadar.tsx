import React from 'react';
import type { MarginalUtilityMetrics } from '../../balancing/testing/metrics';

interface StatProfileRadarProps {
  metrics: MarginalUtilityMetrics[];
}

export const StatProfileRadar: React.FC<StatProfileRadarProps> = ({ metrics }) => {
  if (!metrics.length) return null;

  const byStat: Record<string, MarginalUtilityMetrics[]> = {};
  metrics.forEach((m) => {
    (byStat[m.statId] ||= []).push(m);
  });

  const aggregated = Object.entries(byStat).map(([statId, list]) => {
    const avgUtility = list.reduce((sum, m) => sum + m.utilityScore, 0) / list.length;
    return { statId, utility: avgUtility };
  });

  const maxUtility = Math.max(...aggregated.map((m) => m.utility));
  const data = aggregated.map((m) => ({
    stat: m.statId,
    value: maxUtility > 0 ? m.utility / maxUtility : 0,
    actual: m.utility,
  }));

  const size = 260;
  const center = size / 2;
  const radius = size / 3;
  const points = data.length;
  const angleSlice = (Math.PI * 2) / points;

  const getCoords = (index: number, value: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = radius * value;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const pathData =
    data
      .map((d, i) => {
        const { x, y } = getCoords(i, d.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ') + ' Z';

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur-md p-4 shadow-[0_18px_45px_rgba(15,23,42,0.9)] flex flex-col items-center">
      <svg width={size} height={size} className="mx-auto">
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="#1f2937"
            strokeWidth={1}
          />
        ))}
        {data.map((_, i) => {
          const { x, y } = getCoords(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#111827"
              strokeWidth={1}
            />
          );
        })}
        <path d={pathData} fill="#4f46e5" fillOpacity={0.3} stroke="#818cf8" strokeWidth={2} />
        {data.map((d, i) => {
          const { x, y } = getCoords(i, 1.15);
          return (
            <text
              key={d.stat}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[10px] fill-indigo-200 font-semibold uppercase tracking-[0.16em]"
            >
              {d.stat}
            </text>
          );
        })}
      </svg>
      <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-[0.18em]">
        Stat Utility Profile (normalized)
      </p>
    </div>
  );
};
