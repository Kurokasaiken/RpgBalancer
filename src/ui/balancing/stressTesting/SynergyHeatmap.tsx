import type { SynergyResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';

interface SynergyHeatmapProps {
  synergies: SynergyResult[];
  statLabels: Record<string, string>;
  className?: string;
}

export default function SynergyHeatmap({ synergies, statLabels, className = '' }: SynergyHeatmapProps) {
  const statIds = Object.keys(statLabels);
  const synergyMap = new Map<string, SynergyResult>();

  synergies.forEach(synergy => {
    const key = synergy.statIds.sort().join('_');
    synergyMap.set(key, synergy);
  });

  const getSynergyForPair = (statId1: string, statId2: string): SynergyResult | null => {
    if (statId1 === statId2) return null;
    const key = [statId1, statId2].sort().join('_');
    return synergyMap.get(key) || null;
  };

  const getCellColor = (synergy: SynergyResult | null): string => {
    if (!synergy) return 'bg-slate-800';
    if (synergy.isOpSynergy) return 'bg-emerald-600';
    if (synergy.isWeakSynergy) return 'bg-rose-600';
    return 'bg-amber-600';
  };

  const getCellText = (synergy: SynergyResult | null): string => {
    if (!synergy) return '—';
    return `${synergy.synergyMultiplier.toFixed(2)}x`;
  };

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-lg font-semibold text-ivory mb-4">Stat Synergy Heatmap</h3>
      <div className="overflow-x-auto">
        <table className="border border-amber-400/40 bg-slate-950/95 text-ivory rounded-lg">
          <thead>
            <tr className="border-b border-amber-400/30">
              <th className="px-2 py-1 text-xs uppercase tracking-wider text-amber-200">Stat Pair</th>
              {statIds.map(statId => (
                <th key={statId} className="px-2 py-1 text-xs uppercase tracking-wider text-amber-200 text-center">
                  {statLabels[statId]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statIds.map(statId1 => (
              <tr key={statId1} className="border-b border-slate-800/50">
                <td className="px-2 py-1 text-xs font-semibold text-amber-200">
                  {statLabels[statId1]}
                </td>
                {statIds.map(statId2 => {
                  const synergy = getSynergyForPair(statId1, statId2);
                  return (
                    <td
                      key={statId2}
                      className={`px-2 py-1 text-center text-xs font-mono border border-slate-700/50 ${getCellColor(synergy)}`}
                      title={synergy ? `${synergy.pairArchetype.name}: ${synergy.synergyMultiplier.toFixed(3)}x` : ''}
                    >
                      {getCellText(synergy)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-600 rounded"></div>
          <span className="text-slate-300">OP Synergy (&gt;1.15x)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-600 rounded"></div>
          <span className="text-slate-300">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-rose-600 rounded"></div>
          <span className="text-slate-300">Weak Synergy (&lt;0.95x)</span>
        </div>
      </div>
    </div>
  );
}
