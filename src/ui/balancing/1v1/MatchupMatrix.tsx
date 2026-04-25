/**
 * Matchup Matrix UI Component
 * 
 * Displays NxN matchup matrix with color-coded win rates.
 * 
 * Features:
 * - Heatmap visualization
 * - Click to view detailed matchup
 * - Export/import runs
 * - Balance score display
 * 
 * TODO: Full implementation with recharts/canvas rendering
 */

import React from 'react';
import type { MatrixRunResult } from '../../../balancing/1v1/types';
import { calculateBalanceScore } from '../../../balancing/1v1/matrixRunner';

interface MatchupMatrixProps {
    matrix: MatrixRunResult;
    onCellClick?: (rowId: string, colId: string) => void;
}

export const MatchupMatrix: React.FC<MatchupMatrixProps> = ({
    matrix,
    onCellClick,
}) => {
    const balanceScore = calculateBalanceScore(matrix);

    return (
        <div className="matchup-matrix">
            <h2>Matchup Matrix</h2>

            <div>
                <strong>Balance Score: </strong>
                <span>{(balanceScore * 100).toFixed(2)}%</span>
                {balanceScore < 0.05 ? ' ✅' : ' ⚠️'}
            </div>

            {/* TODO: Implement:
                - Full NxN grid rendering
                - Color-coded heatmap (green = balanced, red = imbalanced)
                - Cell tooltips with win rates
                - Click handlers for detailed view
                - Export/import buttons
            */}

            <table>
                <thead>
                    <tr>
                        <th></th>
                        {matrix.archetypes.map(id => (
                            <th key={id}>{id}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {matrix.archetypes.map(rowId => (
                        <tr key={rowId}>
                            <th>{rowId}</th>
                            {matrix.archetypes.map(colId => {
                                const cell = matrix.matrix.find(
                                    c => c.row === rowId && c.col === colId
                                );
                                const winRate = cell?.win_rate_row || 0;

                                return (
                                    <td
                                        key={colId}
                                        onClick={() => onCellClick?.(rowId, colId)}
                                        style={{
                                            backgroundColor: `hsl(${120 * (1 - Math.abs(winRate - 0.5) * 2)}, 70%, 70%)`,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {(winRate * 100).toFixed(0)}%
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <p>TODO: Add recharts heatmap, better styling, tooltips</p>
        </div>
    );
};
