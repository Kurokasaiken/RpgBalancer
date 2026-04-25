/**
 * Auto-Balance Console UI Component
 * 
 * Displays auto-balance recommendations and allows applying adjustments.
 * 
 * Features:
 * - Show proposed nerfs/buffs
 * - One-click apply
 * - Session history
 * - Version comparison
 * 
 * TODO: Full implementation with interactive controls
 */

import React, { useState } from 'react';
import type { StatAdjustment } from '../../../balancing/1v1/autobalancer';
import { proposeAdjustments, applyAdjustments, DEFAULT_AUTO_BALANCE_CONFIG } from '../../../balancing/1v1/autobalancer';
import type { Archetype, MatrixRunResult } from '../../../balancing/1v1/types';

interface AutoBalanceConsoleProps {
    matrix: MatrixRunResult;
    archetypes: Archetype[];
    onApply?: (modified: Archetype[]) => void;
}

export const AutoBalanceConsole: React.FC<AutoBalanceConsoleProps> = ({
    matrix,
    archetypes,
    onApply,
}) => {
    const [adjustments, setAdjustments] = useState<StatAdjustment[]>([]);

    const handleAnalyze = () => {
        const proposed = proposeAdjustments(matrix, archetypes, DEFAULT_AUTO_BALANCE_CONFIG);
        setAdjustments(proposed);
    };

    const handleApply = () => {
        const modified = applyAdjustments(archetypes, adjustments);
        onApply?.(modified);
    };

    return (
        <div className="auto-balance-console">
            <h2>Auto-Balance Console</h2>

            <button onClick={handleAnalyze}>Analyze & Propose Adjustments</button>

            {adjustments.length > 0 && (
                <div>
                    <h3>Proposed Adjustments ({adjustments.length})</h3>

                    <ul>
                        {adjustments.map((adj, index) => (
                            <li key={index}>
                                <strong>{adj.archetypeId}</strong>: {adj.statKey}
                                <br />
                                {adj.currentValue.toFixed(1)} → {adj.proposedValue.toFixed(1)}
                                ({adj.changePercent > 0 ? '+' : ''}{adj.changePercent.toFixed(1)}%)
                                <br />
                                <em>{adj.reason}</em>
                            </li>
                        ))}
                    </ul>

                    <button onClick={handleApply}>Apply All Adjustments</button>
                </div>
            )}

            <p>TODO: Add session tracking, version history, rollback support</p>
        </div>
    );
};
