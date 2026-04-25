import type { MarginalUtilityResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';

/**
 * Props for MarginalUtilityTable component
 */
export interface MarginalUtilityTableProps {
  marginalUtilities: MarginalUtilityResult[];
}

/**
 * Component to display marginal utility metrics in a table
 */
export function MarginalUtilityTable({ marginalUtilities }: MarginalUtilityTableProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Marginal Utilities</h3>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1">Archetype</th>
            <th className="border border-gray-300 px-2 py-1">Avg Score</th>
            <th className="border border-gray-300 px-2 py-1">Marginal Utility (%)</th>
            <th className="border border-gray-300 px-2 py-1">Std Dev</th>
            <th className="border border-gray-300 px-2 py-1">Simulations</th>
          </tr>
        </thead>
        <tbody>
          {marginalUtilities.map((result, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-2 py-1">{result.archetype.name}</td>
              <td className="border border-gray-300 px-2 py-1">{result.averageScore.toFixed(4)}</td>
              <td className="border border-gray-300 px-2 py-1">{result.marginalUtility.toFixed(2)}</td>
              <td className="border border-gray-300 px-2 py-1">{result.standardDeviation.toFixed(4)}</td>
              <td className="border border-gray-300 px-2 py-1">{result.simulationCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
