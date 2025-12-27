import type { MarginalUtilityResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';

interface MarginalUtilityTableProps {
  results: MarginalUtilityResult[];
  className?: string;
}

export default function MarginalUtilityTable({ results, className = '' }: MarginalUtilityTableProps) {
  const sortedResults = [...results].sort((a, b) => b.marginalUtility - a.marginalUtility);

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-lg font-semibold text-ivory mb-4">Marginal Utility Analysis</h3>
      <div className="overflow-x-auto">
        <table className="w-full border border-amber-400/40 bg-slate-950/95 text-ivory rounded-lg">
          <thead>
            <tr className="border-b border-amber-400/30">
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-amber-200">Archetype</th>
              <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-amber-200">Avg Score</th>
              <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-amber-200">Marginal Utility</th>
              <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-amber-200">Std Dev</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => (
              <tr key={result.archetype.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                <td className="px-4 py-2 text-sm text-slate-200">{result.archetype.name}</td>
                <td className="px-4 py-2 text-sm text-right text-slate-100 font-mono">
                  {result.averageScore.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-sm text-right font-mono">
                  <span
                    className={
                      result.marginalUtility > 0
                        ? 'text-emerald-300'
                        : result.marginalUtility < 0
                        ? 'text-rose-300'
                        : 'text-slate-400'
                    }
                  >
                    {result.marginalUtility > 0 ? '+' : ''}
                    {result.marginalUtility.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-right text-slate-400 font-mono">
                  {result.standardDeviation.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Sorted by marginal utility. Positive values indicate stronger than baseline.
      </p>
    </div>
  );
}
