/**
 * MatchupDetailPanel Component
 * 
 * Shows detailed statistics and charts for a single matchup cell.
 * Displays when user clicks on a cell in MatchupMatrix.
 */

import React from 'react';
import type { MatchupResult } from '../../../balancing/1v1/types';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassButton } from '../../atoms/GlassButton';

interface MatchupDetailPanelProps {
    matchup: MatchupResult | null;
    onClose: () => void;
}

export const MatchupDetailPanel: React.FC<MatchupDetailPanelProps> = ({ matchup, onClose }) => {
    if (!matchup) return null;

    const winRateRow = (matchup.win_rate_row * 100).toFixed(1);
    const winRateCol = ((1 - matchup.win_rate_row) * 100).toFixed(1);

    // Get top 5 SWI stats
    const topSWI = Object.entries(matchup.SWI)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 5);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto" padding="lg">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {matchup.row} vs {matchup.col}
                    </h2>
                    <GlassButton onClick={onClose} variant="secondary" size="sm">
                        ✕ Close
                    </GlassButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Win Rates */}
                    <div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-3">Win Rates</h3>
                        <div className="space-y-3">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">{matchup.row}</span>
                                    <span className="text-2xl font-bold text-green-400">{winRateRow}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3">
                                    <div
                                        className="bg-green-500 h-3 rounded-full transition-all"
                                        style={{ width: `${winRateRow}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">{matchup.col}</span>
                                    <span className="text-2xl font-bold text-red-400">{winRateCol}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3">
                                    <div
                                        className="bg-red-500 h-3 rounded-full transition-all"
                                        style={{ width: `${winRateCol}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Draws</span>
                                    <span className="text-white font-mono">{matchup.draws}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Combat Stats */}
                    <div>
                        <h3 className="text-lg font-bold text-purple-400 mb-3">Combat Stats</h3>
                        <div className="space-y-2">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Avg TTK ({matchup.row} wins)</span>
                                    <span className="text-white font-mono">{matchup.avg_TTK_row_win.toFixed(1)} rounds</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Avg TTK ({matchup.col} wins)</span>
                                    <span className="text-white font-mono">{matchup.avg_TTK_col_win.toFixed(1)} rounds</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Median TTK</span>
                                    <span className="text-white font-mono">{matchup.median_TTK.toFixed(1)} rounds</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Std Dev TTK</span>
                                    <span className="text-white font-mono">±{matchup.std_TTK.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Avg Overkill</span>
                                    <span className="text-white font-mono">{matchup.avg_overkill.toFixed(1)} HP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HP Remaining */}
                    <div>
                        <h3 className="text-lg font-bold text-green-400 mb-3">HP Remaining</h3>
                        <div className="space-y-2">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{matchup.row} wins avg</span>
                                    <span className="text-white font-mono">{matchup.avg_hp_remaining_row_wins.toFixed(1)} HP</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{matchup.col} wins avg</span>
                                    <span className="text-white font-mono">{matchup.avg_hp_remaining_col_wins.toFixed(1)} HP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Early Impact */}
                    <div>
                        <h3 className="text-lg font-bold text-orange-400 mb-3">Early Impact (First 3 Turns)</h3>
                        <div className="space-y-2">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="text-gray-400 mb-2">{matchup.row}</div>
                                <div className="flex gap-2">
                                    {matchup.earlyImpact_row.map((damage, i) => (
                                        <div key={i} className="flex-1 text-center">
                                            <div className="text-xs text-gray-500">T{i + 1}</div>
                                            <div className="text-white font-mono text-sm">{damage.toFixed(0)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="text-gray-400 mb-2">{matchup.col}</div>
                                <div className="flex gap-2">
                                    {matchup.earlyImpact_col.map((damage, i) => (
                                        <div key={i} className="flex-1 text-center">
                                            <div className="text-xs text-gray-500">T{i + 1}</div>
                                            <div className="text-white font-mono text-sm">{damage.toFixed(0)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SWI (Stat Weight Index) */}
                <div className="mt-6">
                    <h3 className="text-lg font-bold text-yellow-400 mb-3">
                        Top 5 Stat Weights (SWI)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {topSWI.map(([stat, value]) => (
                            <div
                                key={stat}
                                className={`bg-white/5 border rounded-lg p-3 text-center ${value > 0 ? 'border-green-500/30' : 'border-red-500/30'
                                    }`}
                            >
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                    {stat}
                                </div>
                                <div className={`text-2xl font-bold ${value > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {value > 0 ? '+' : ''}{value.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metadata */}
                <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Total Simulations: {matchup.total.toLocaleString()}</span>
                        <span>Runtime: {matchup.runtimeMs}ms</span>
                        <span>Seed: {matchup.seed}</span>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
