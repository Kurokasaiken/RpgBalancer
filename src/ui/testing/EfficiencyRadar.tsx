import React from 'react';
import type { StatEfficiency } from '../../balancing/testing/RoundRobinRunner';

interface EfficiencyRadarProps {
  efficiencies: StatEfficiency[];
  getLabel?: (statId: string) => string;
}

export const EfficiencyRadar: React.FC<EfficiencyRadarProps> = ({ efficiencies, getLabel }) => {
  if (!efficiencies.length) return null;

  const maxEff = Math.max(...efficiencies.map((e) => e.efficiency));
  if (maxEff <= 0) return null;

  const data = efficiencies.map((e) => ({
    stat: e.statId,
    value: e.efficiency / maxEff,
    actual: e.efficiency,
  }));

  const size = 260;
  const center = size / 2;
  const radius = size / 3;
  const points = data.length;
  const angleSlice = (Math.PI * 2) / Math.max(points, 1);

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
        {/* Grid circles */}
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

        {/* Axes */}
        {data.map((_, i) => {
          const { x, y } = getCoords(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#020617"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={pathData}
          fill="#22d3ee"
          fillOpacity={0.22}
          stroke="#67e8f9"
          strokeWidth={2}
        />

        {/* Labels */}
        {data.map((d, i) => {
          const { x, y } = getCoords(i, 1.12);
          const label = getLabel ? getLabel(d.stat) : d.stat;
          return (
            <text
              key={d.stat}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[9px] fill-indigo-200 font-semibold uppercase tracking-[0.16em]"
            >
              {label}
            </text>
          );
        })}
      </svg>
      <p className="mt-2 text-[9px] text-slate-400 uppercase tracking-[0.22em]">
        Efficiency Profile (normalized)
      </p>
    </div>
  );
}
