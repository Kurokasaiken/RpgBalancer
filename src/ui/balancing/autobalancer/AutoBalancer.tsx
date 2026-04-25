/**
 * AutoBalancer Component  
 * 
 * Analyzes matchup matrix and provides automatic buff/nerf suggestions
 * to improve overall balance.
 */

import React, { useState } from 'react';
import type { MatrixRunResult } from '../../../balancing/1v1/types';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassButton } from '../../atoms/GlassButton';
import { calculateBalanceScore, findMostImbalanced } from '../../../balancing/1v1/matrixRunner';

interface AutoBalancerProps {
    matrixResult: MatrixRunResult;
}

interface BalanceSuggestion {
    archetype: string;
    stat: string;
    change: number;
    reasoning: string;
    impact: number;
}

export const AutoBalancer: React.FC<AutoBalancerProps> = ({ matrixResult }) => {
    const [suggestions, setSuggestions] = useState<BalanceSuggestion[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    const balanceScore = calculateBalanceScore(matrixResult);
    const balancePercent = (balanceScore * 100).toFixed(1);
    const imbalanced = findMostImbalanced(matrixResult, 5);

    const generateSuggestions = () => {
        setAnalyzing(true);
        setTimeout(() => {
            const newSuggestions: BalanceSuggestion[] = [];
            const archetypeStats = new Map<string, { totalWins: number, totalGames: number }>();

            matrixResult.matrix.forEach(cell => {
                if (cell.row === cell.col) return;

                if (!archetypeStats.has(cell.row)) {
                    archetypeStats.set(cell.row, { totalWins: 0, totalGames: 0 });
                }
                const rowStats = archetypeStats.get(cell.row)!;
                rowStats.totalWins += cell.wins_row;
                rowStats.totalGames += cell.total;

                if (!archetypeStats.has(cell.col)) {
                    archetypeStats.set(cell.col, { totalWins: 0, totalGames: 0 });
                }
                const colStats = archetypeStats.get(cell.col)!;
                colStats.totalWins += cell.wins_col;
                colStats.totalGames += cell.total;
            });

            archetypeStats.forEach((stats, archetype) => {
                const winRate = stats.totalWins / stats.totalGames;

                if (winRate > 0.55) {
                    newSuggestions.push({
                        archetype,
                        stat: 'damage',
                        change: -Math.round((winRate - 0.5) * 20),
                        reasoning: `High win rate ${(winRate * 100).toFixed(1)}% - reduce damage`,
                        impact: Math.min(10, Math.round((winRate - 0.5) * 20))
                    });
                } else if (winRate < 0.45) {
                    newSuggestions.push({
                        archetype,
                        stat: 'hp',
                        change: Math.round((0.5 - winRate) * 30),
                        reasoning: `Low win rate ${(winRate * 100).toFixed(1)}% - increase HP`,
                        impact: Math.min(10, Math.round((0.5 - winRate) * 20))
                    });
                }
            });

            newSuggestions.sort((a, b) => b.impact - a.impact);
            setSuggestions(newSuggestions.slice(0, 6));
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="p-6 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-white mb-2">🤖 Auto-Balancer</h1>
                    <p className="text-gray-400">AI-powered balance suggestions</p>
                </div>

                <GlassCard className="mb-6" padding="lg">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Balance Score</h3>
                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-400">Deviation</span>
                                <span className="text-white font-mono text-2xl">{balancePercent}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-4">
                                <div
                                    className={`h-4 rounded-full ${balanceScore < 0.1 ? 'bg-green-500' :
                                            balanceScore < 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(100, balanceScore * 200)}%` }}
                                />
                            </div>
                        </div>
                        <div className={`text-6xl ${balanceScore < 0.1 ? 'text-green-400' :
                                balanceScore < 0.2 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {balanceScore < 0.1 ? '✓' : balanceScore < 0.2 ? '!' : '✗'}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="mb-6" padding="lg">
                    <h3 className="text-xl font-bold text-orange-400 mb-4">Most Imbalanced</h3>
                    <div className="space-y-3">
                        {imbalanced.map((cell, idx) => (
                            <div key={`${cell.row}-${cell.col}`} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl text-gray-600">#{idx + 1}</div>
                                    <div className="text-white">{cell.row} vs {cell.col}</div>
                                </div>
                                <div className={`text-2xl font-bold ${cell.win_rate_row > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                                    {(cell.win_rate_row * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {suggestions.length === 0 && (
                    <div className="text-center">
                        <GlassButton onClick={generateSuggestions} disabled={analyzing} variant="primary" size="lg">
                            {analyzing ? '🔄 Analyzing...' : '🔬 Generate Suggestions'}
                        </GlassButton>
                    </div>
                )}

                {suggestions.length > 0 && (
                    <GlassCard padding="lg">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-xl font-bold text-purple-400">Suggestions</h3>
                            <GlassButton onClick={generateSuggestions} variant="secondary" size="sm">🔄</GlassButton>
                        </div>
                        <div className="space-y-4">
                            {suggestions.map((sug, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="flex gap-3 mb-2">
                                                <span className="text-white font-bold">{sug.archetype}</span>
                                                <span className={`px-3 py-1 rounded text-sm ${sug.change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {sug.change > 0 ? 'BUFF' : 'NERF'}
                                                </span>
                                            </div>
                                            <div className="text-gray-400 text-sm mb-2">{sug.reasoning}</div>
                                            <div className="text-white font-mono">
                                                {sug.stat}: <span className={sug.change > 0 ? 'text-green-400' : 'text-red-400'}>
                                                    {sug.change > 0 ? '+' : ''}{sug.change}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Impact</div>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 10 }).map((_, i) => (
                                                    <div key={i} className={`w-2 h-6 rounded ${i < sug.impact ? 'bg-purple-500' : 'bg-gray-700'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                )}
            </div>
        </div>
    );
};
