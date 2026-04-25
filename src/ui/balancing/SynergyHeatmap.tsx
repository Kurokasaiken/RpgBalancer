import type { SynergyResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';

/**
 * Props for SynergyHeatmap component
 */
export interface SynergyHeatmapProps {
  synergies: SynergyResult[];
}

/**
 * Component to visualize synergy multipliers as a heatmap
 */
export function SynergyHeatmap({ synergies }: SynergyHeatmapProps) {
  // Collect unique stats
  const statSet = new Set<string>();
  synergies.forEach(synergy => {
    statSet.add(synergy.statIds[0]);
    statSet.add(synergy.statIds[1]);
  });
  const stats = Array.from(statSet).sort();

  // Create matrix
  const matrix: Record<string, Record<string, number>> = {};
  stats.forEach(stat => {
    matrix[stat] = {};
    stats.forEach(otherStat => {
      matrix[stat][otherStat] = 0;
    });
  });

  synergies.forEach(synergy => {
    const [stat1, stat2] = synergy.statIds;
    matrix[stat1][stat2] = synergy.synergyMultiplier;
    matrix[stat2][stat1] = synergy.synergyMultiplier;
  });

  const getCellStyle = (multiplier: number) => {
    if (multiplier === 0) return {};
    if (multiplier > 1.15) return { backgroundColor: '#d4edda' }; // light green
    if (multiplier < 0.95) return { backgroundColor: '#f8d7da' }; // light red
    return { backgroundColor: '#fff3cd' }; // light yellow
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Synergy Heatmap</h3>
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1"></th>
            {stats.map(stat => (
              <th key={stat} className="border border-gray-300 px-2 py-1">{stat}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map(stat => (
            <tr key={stat}>
              <th className="border border-gray-300 px-2 py-1">{stat}</th>
              {stats.map(otherStat => (
                <td
                  key={otherStat}
                  className="border border-gray-300 px-2 py-1 text-center"
                  style={getCellStyle(matrix[stat][otherStat])}
                >
                  {matrix[stat][otherStat] > 0 ? matrix[stat][otherStat].toFixed(2) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
