import React from 'react';
import type { MarginalUtilityResult } from '../../../balancing/stressTesting/MarginalUtilityCalculator';
import { getAssessment, getAssessmentColor, formatPercentage } from '../../../balancing/stressTesting/types';

interface MarginalUtilityTableProps {
  results: MarginalUtilityResult[];
  isLoading?: boolean;
  title?: string;
  showDetails?: boolean;
}

/**
 * MarginalUtilityTable component for visualizing stress testing results
 * Shows stat efficiency rankings with assessment highlighting
 */
export const MarginalUtilityTable: React.FC<MarginalUtilityTableProps> = ({
  results,
  isLoading = false,
  title = 'Marginal Utility Analysis',
  showDetails = true,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-slate-400">No marginal utility results available</div>
          <div className="text-slate-500 text-sm mt-2">Run stress testing to see results</div>
        </div>
      </div>
    );
  }

  // Sort by marginal utility (descending)
  const sortedResults = [...results].sort((a, b) => b.marginalUtility - a.marginalUtility);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        <div className="text-slate-400 text-sm mt-1">
          {results.length} stats analyzed • Sorted by marginal utility
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Stat
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                Marginal Utility
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                Assessment
              </th>
              {showDetails && (
                <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Simulations
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedResults.map((result, index) => {
              const assessment = getAssessment(result.averageScore);
              const assessmentColor = getAssessmentColor(assessment);
              const isPositive = result.marginalUtility > 0;
              const isNegative = result.marginalUtility < 0;

              return (
                <tr 
                  key={result.archetype.id}
                  className="hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {result.archetype.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {result.archetype.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-slate-200">
                      {formatPercentage(result.averageScore)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-mono ${
                      isPositive ? 'text-green-400' : 
                      isNegative ? 'text-red-400' : 
                      'text-slate-400'
                    }`}>
                      {isPositive ? '+' : ''}{(result.marginalUtility * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assessmentColor}`}>
                      {assessment.toUpperCase()}
                    </span>
                  </td>
                  {showDetails && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-400">
                        {result.simulationCount.toLocaleString()}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-400">OP Stats</div>
            <div className="text-slate-200 font-semibold">
              {results.filter(r => getAssessment(r.averageScore) === 'OP').length}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Strong Stats</div>
            <div className="text-slate-200 font-semibold">
              {results.filter(r => getAssessment(r.averageScore) === 'strong').length}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Weak Stats</div>
            <div className="text-slate-200 font-semibold">
              {results.filter(r => getAssessment(r.averageScore) === 'weak').length}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Underpowered</div>
            <div className="text-slate-200 font-semibold">
              {results.filter(r => getAssessment(r.averageScore) === 'underpowered').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version of the table for dashboard use
 */
export const CompactMarginalUtilityTable: React.FC<{
  results: MarginalUtilityResult[];
  maxRows?: number;
}> = ({ results, maxRows = 5 }) => {
  if (results.length === 0) return null;

  const sortedResults = [...results]
    .sort((a, b) => b.marginalUtility - a.marginalUtility)
    .slice(0, maxRows);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h4 className="text-sm font-semibold text-slate-200 mb-3">Top Stats</h4>
      <div className="space-y-2">
        {sortedResults.map((result, index) => {
          const assessment = getAssessment(result.averageScore);
          const assessmentColor = getAssessmentColor(assessment);
          const isPositive = result.marginalUtility > 0;

          return (
            <div key={result.archetype.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">#{index + 1}</span>
                <span className="text-sm text-slate-200">{result.archetype.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${assessmentColor}`}>
                  {assessment}
                </span>
              </div>
              <div className={`text-sm font-mono ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositive ? '+' : ''}{(result.marginalUtility * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
