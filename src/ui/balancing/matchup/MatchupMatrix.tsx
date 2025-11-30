/**
 * MatchupMatrix Component
 * 
 * Interactive NxN heatmap visualization for archetype matchup results.
 * Shows win rates with color-coded cells and detailed tooltips.
 */

import React, { useState } from 'react';
import type { MatrixRunResult, MatchupResult } from '../../../balancing/1v1/types';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassButton } from '../../atoms/GlassButton';
import { MatchupDetailPanel } from './MatchupDetailPanel';

interface MatchupMatrixProps {
    matrixResult: MatrixRunResult;
    onCellClick?: (cell: MatchupResult) => void;
}

// Color scale based on win rate
const getWinRateColor = (winRate: number, isDiagonal: boolean): string => {
    if (isDiagonal) return 'bg-gray-700 border-gray-600'; // Self vs self

    if (winRate >= 0.70) return 'bg-green-600 border-green-500';
    if (winRate >= 0.55) return 'bg-lime-500 border-lime-400';
    if (winRate >= 0.45) return 'bg-yellow-500 border-yellow-400';
    if (winRate >= 0.30) return 'bg-orange-500 border-orange-400';
    return 'bg-red-600 border-red-500';
};

const getWinRateTextColor = (winRate: number): string => {
    if (winRate >= 0.45 && winRate <= 0.55) return 'text-gray-900'; // Yellow cells need dark text
    return 'text-white';
};

export const MatchupMatrix: React.FC<MatchupMatrixProps> = ({ matrixResult, onCellClick }) => {
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const [selectedCell, setSelectedCell] = useState<MatchupResult | null>(null);

    const archetypes = matrixResult.archetypes;
    const n = archetypes.length;

    // Get cell by row/col
    const getCell = (rowId: string, colId: string): MatchupResult | undefined => {
        return matrixResult.matrix.find(c => c.row === rowId && c.col === colId);
    };

    // Handle cell hover
    const handleCellHover = (rowId: string, colId: string, event: React.MouseEvent) => {
        setHoveredCell(`${rowId}-${colId}`);
        setTooltipPos({ x: event.clientX, y: event.clientY });
    };

    const handleCellLeave = () => {
        setHoveredCell(null);
        setTooltipPos(null);
    };

    // Export as JSON
    const handleExportJSON = () => {
        const json = JSON.stringify(matrixResult, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matrix_${matrixResult.runMeta.runId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            🗺️ Matchup Matrix
                        </h1>
                        <p className="text-gray-400">
                            {matrixResult.runMeta.nSim.toLocaleString()} simulations per matchup
                        </p>
                        <p className="text-gray-500 text-sm">
                            Run ID: {matrixResult.runMeta.runId}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <GlassButton onClick={handleExportJSON} variant="secondary">
                            📥 Export JSON
                        </GlassButton>
                    </div>
                </div>

                {/* Legend */}
                <GlassCard className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-3">Color Scale (Win Rate)</h3>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-600 border border-red-500 rounded"></div>
                            <span className="text-gray-300 text-sm">0-30% (Heavily Unfavored)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500 border border-orange-400 rounded"></div>
                            <span className="text-gray-300 text-sm">30-45% (Unfavored)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-500 border border-yellow-400 rounded"></div>
                            <span className="text-gray-300 text-sm">45-55% (Even)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-lime-500 border border-lime-400 rounded"></div>
                            <span className="text-gray-300 text-sm">55-70% (Favored)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-600 border border-green-500 rounded"></div>
                            <span className="text-gray-300 text-sm">70-100% (Heavily Favored)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-700 border border-gray-600 rounded"></div>
                            <span className="text-gray-300 text-sm">Self (Mirror Match)</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Heatmap */}
                <GlassCard padding="lg">
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full">
                            {/* Grid Container */}
                            <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${n}, 1fr)` }}>
                                {/* Top-left corner */}
                                <div className="h-12"></div>

                                {/* Column headers */}
                                {archetypes.map(colId => (
                                    <div
                                        key={`header-${colId}`}
                                        className="h-12 flex items-center justify-center bg-purple-900/30 border border-purple-700/50 rounded text-white text-sm font-semibold"
                                    >
                                        {colId}
                                    </div>
                                ))}

                                {/* Rows */}
                                {archetypes.map(rowId => (
                                    <React.Fragment key={`row-${rowId}`}>
                                        {/* Row header */}
                                        <div className="h-20 flex items-center justify-end pr-3 bg-purple-900/30 border border-purple-700/50 rounded text-white text-sm font-semibold">
                                            {rowId}
                                        </div>

                                        {/* Row cells */}
                                        {archetypes.map(colId => {
                                            const cell = getCell(rowId, colId);
                                            if (!cell) return <div key={`${rowId}-${colId}`} className="h-20"></div>;

                                            const isDiagonal = rowId === colId;
                                            const winRate = cell.win_rate_row;
                                            const bgColor = getWinRateColor(winRate, isDiagonal);
                                            const textColor = getWinRateTextColor(winRate);
                                            const isHovered = hoveredCell === `${rowId}-${colId}`;

                                            return (
                                                <div
                                                    key={`${rowId}-${colId}`}
                                                    className={`h-20 flex flex-col items-center justify-center border rounded cursor-pointer transition-all ${bgColor} ${isHovered ? 'scale-105 shadow-lg ring-2 ring-white' : ''
                                                        }`}
                                                    onMouseEnter={(e) => handleCellHover(rowId, colId, e)}
                                                    onMouseLeave={handleCellLeave}
                                                    onClick={() => {
                                                        setSelectedCell(cell);
                                                        onCellClick?.(cell);
                                                    }}
                                                >                                                    <div className={`text-lg font-bold ${textColor}`}>
                                                        {(winRate * 100).toFixed(1)}%
                                                    </div>
                                                    {!isDiagonal && (
                                                        <div className={`text-xs ${textColor} opacity-75`}>
                                                            {cell.avg_TTK_row_win.toFixed(1)} rounds
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Tooltip */}
                {hoveredCell && tooltipPos && (() => {
                    const [rowId, colId] = hoveredCell.split('-');
                    const cell = getCell(rowId, colId);
                    if (!cell) return null;

                    return (
                        <div
                            className="fixed z-50 pointer-events-none"
                            style={{
                                left: tooltipPos.x + 10,
                                top: tooltipPos.y + 10,
                            }}
                        >
                            <div className="bg-gray-900 border border-white/20 rounded-lg p-4 shadow-2xl max-w-xs">
                                <h4 className="text-white font-bold mb-2">
                                    {rowId} vs {colId}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Win Rate ({rowId}):</span>
                                        <span className="text-white font-mono">{(cell.win_rate_row * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Avg TTK:</span>
                                        <span className="text-white font-mono">{cell.avg_TTK_row_win.toFixed(1)} rounds</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Draws:</span>
                                        <span className="text-white font-mono">{cell.draws}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Sims:</span>
                                        <span className="text-white font-mono">{cell.total.toLocaleString()}</span>
                                    </div>
                                    {!Object.values(cell.SWI).every(v => v === 0) && (
                                        <>
                                            <div className="border-t border-white/10 my-2 pt-2">
                                                <div className="text-gray-400 mb-1">Top SWI Stats:</div>
                                                {Object.entries(cell.SWI)
                                                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                                                    .slice(0, 3)
                                                    .map(([stat, value]) => (
                                                        <div key={stat} className="flex justify-between text-xs">
                                                            <span className="text-gray-500">{stat}:</span>
                                                            <span className={value > 0 ? 'text-green-400' : 'text-red-400'}>
                                                                {value > 0 ? '+' : ''}{value.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Detail Panel */}
                <MatchupDetailPanel
                    matchup={selectedCell}
                    onClose={() => setSelectedCell(null)}
                />
            </div>
        </div>
    );
};
