import React, { useState } from 'react';
import { DEFAULT_STATS } from '../../balancing/types';
import { SynergyAnalyzer, type SynergyResult } from '../../balancing/synergy';

export const SynergyMatrix: React.FC = () => {
    const [matrix, setMatrix] = useState<SynergyResult[][]>([]);
    const [topSynergies, setTopSynergies] = useState<SynergyResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);

    // Core stats to test (7x7 matrix for manageable compute time)
    const stats: Array<keyof typeof DEFAULT_STATS> = [
        'hp', 'damage', 'armor', 'resistance',
        'critChance', 'lifesteal', 'regen'
    ];

    const runMatrix = async () => {
        setIsRunning(true);
        setProgress(0);

        const analyzer = new SynergyAnalyzer(DEFAULT_STATS);
        const totalTests = stats.length * stats.length;
        let completed = 0;

        // Generate matrix with progress tracking
        const result: SynergyResult[][] = [];
        for (let i = 0; i < stats.length; i++) {
            result[i] = [];
            for (let j = 0; j < stats.length; j++) {
                if (i === j) {
                    // Diagonal: dummy result
                    result[i][j] = {
                        statA: stats[i],
                        statB: stats[j],
                        soloValueA: 0,
                        soloValueB: 0,
                        combinedValue: 0,
                        expectedValue: 0,
                        synergyScore: 0,
                        synergyType: 'neutral',
                        synergyPercent: 0
                    };
                } else {
                    const testResult = await analyzer.testSynergy({
                        statA: stats[i],
                        statB: stats[j],
                        valueA: 10,
                        valueB: 10,
                        expectedEffect: 'multiplicative'
                    });
                    result[i][j] = testResult;
                }

                completed++;
                setProgress((completed / totalTests) * 100);
            }
        }

        setMatrix(result);

        // Extract top synergies
        const top = analyzer.getTopSynergies(result, 10);
        setTopSynergies(top);

        setIsRunning(false);
    };

    const getSynergyColor = (score: number): string => {
        if (score > 0.15) return 'bg-green-700';
        if (score > 0.05) return 'bg-green-900';
        if (score < -0.15) return 'bg-red-700';
        if (score < -0.05) return 'bg-red-900';
        return 'bg-gray-900';
    };

    const getSynergyTextColor = (score: number): string => {
        if (score > 0.05) return 'text-green-400';
        if (score < -0.05) return 'text-red-400';
        return 'text-gray-400';
    };

    const getSynergyDescription = (statA: string, statB: string, score: number): string => {
        if (score > 0.1) {
            return `${statA} and ${statB} work together to provide more value than the sum of their parts.`;
        }
        if (score < -0.1) {
            return `${statA} and ${statB} have diminishing returns or anti-synergy when combined.`;
        }
        return `${statA} and ${statB} have a linear relationship (no special bonus).`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Synergy Matrix</h2>
                    <p className="text-gray-400 text-sm">
                        Analyzing stat combinations for multiplicative effects
                    </p>
                </div>
                <button
                    onClick={runMatrix}
                    disabled={isRunning}
                    className={`w-full md:w-auto px-6 py-3 rounded font-bold transition-colors ${isRunning
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                >
                    {isRunning ? `Analyzing... ${progress.toFixed(0)}%` : 'Generate Matrix'}
                </button>
            </div>

            {/* Progress Bar */}
            {isRunning && (
                <div className="bg-gray-800 rounded p-4">
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-purple-600 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Top Synergies */}
            {topSynergies.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Top 10 Synergies</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {topSynergies.map((result, idx) => (
                            <div key={idx} className="bg-gray-900 rounded p-3 flex items-center justify-between group relative hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-mono text-xs">#{idx + 1}</span>
                                    <span className="font-bold text-white">
                                        {result.statA} + {result.statB}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className={`font-bold ${getSynergyTextColor(result.synergyScore)}`}>
                                        {result.synergyPercent > 0 ? '+' : ''}{result.synergyPercent.toFixed(1)}%
                                    </div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {getSynergyDescription(result.statA, result.statB, result.synergyScore)}
                                    <div className="mt-1 text-gray-400">
                                        Expected: {result.expectedValue.toFixed(1)} | Actual: {result.combinedValue.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Matrix Table */}
            {matrix.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 overflow-x-auto">
                    <h3 className="text-xl font-bold text-white mb-4">Full Matrix</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Green = Positive synergy (better than sum) | Red = Anti-synergy (worse than sum)
                    </p>

                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-gray-400 font-semibold sticky left-0 bg-gray-800 z-10">Stat</th>
                                {stats.map(s => (
                                    <th key={s} className="p-2 text-center text-gray-400 font-semibold min-w-[80px]">
                                        {s}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((rowStat, i) => (
                                <tr key={rowStat} className="border-t border-gray-700">
                                    <td className="p-2 font-bold text-white sticky left-0 bg-gray-800 z-10 border-r border-gray-700">{rowStat}</td>
                                    {stats.map((colStat, j) => (
                                        <td key={colStat} className="p-2 relative group">
                                            {i === j ? (
                                                <div className="text-center text-gray-600">—</div>
                                            ) : (
                                                <div className={`${getSynergyColor(matrix[i][j].synergyScore)} rounded p-2 text-center cursor-help transition-transform hover:scale-105`}>
                                                    <div className={`font-bold ${getSynergyTextColor(matrix[i][j].synergyScore)}`}>
                                                        {matrix[i][j].synergyPercent > 0 ? '+' : ''}
                                                        {matrix[i][j].synergyPercent.toFixed(0)}%
                                                    </div>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                        <div className="font-bold mb-1">{rowStat} + {colStat}</div>
                                                        {getSynergyDescription(rowStat, colStat, matrix[i][j].synergyScore)}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend */}
            {matrix.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-sm font-bold text-white mb-2">How to Read:</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                        <li>• <span className="text-green-400">Positive %</span> = Combining stats gives MORE value than sum (synergy)</li>
                        <li>• <span className="text-red-400">Negative %</span> = Combining stats gives LESS value than sum (anti-synergy)</li>
                        <li>• <span className="text-gray-400">~0%</span> = Linear (no interaction)</li>
                        <li>• Example: Armor + Resistance = +20% means together they're 20% more effective than separate</li>
                    </ul>
                </div>
            )}
        </div>
    );
};
