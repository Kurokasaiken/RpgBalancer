/**
 * MatchupMatrixWrapper
 * 
 * Wrapper component that loads matrix data and passes it to MatchupMatrix.
 * Handles loading, error states, and data fetching.
 */

import React, { useState, useEffect } from 'react';
import { MatchupMatrix } from './MatchupMatrix';
import type { MatrixRunResult } from '../../../balancing/1v1/types';
import { runMatrix } from '../../../balancing/1v1/matrixRunner';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassButton } from '../../atoms/GlassButton';

export const MatchupMatrixWrapper: React.FC = () => {
    const [matrixData, setMatrixData] = useState<MatrixRunResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Run matrix simulation
    const handleRunMatrix = async () => {
        setLoading(true);
        setError(null);

        try {
            // Use test archetypes
            const archetypeIds = ['Tank', 'DPS', 'Assassin', 'Bruiser', 'Evasive', 'Sustain'];

            const result = await runMatrix(archetypeIds, {
                fast: true, // Use fast mode for UI
                seed: Date.now(),
                onProgress: (current, total, info) => {
                    console.log(`Progress: ${current}/${total} - ${info}`);
                }
            });

            setMatrixData(result);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-run on mount
    useEffect(() => {
        handleRunMatrix();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
                <GlassCard className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-white mb-2">Running Matrix Simulations...</h2>
                    <p className="text-gray-400">This may take a few seconds</p>
                </GlassCard>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
                <GlassCard className="text-center max-w-md">
                    <div className="text-4xl mb-4">❌</div>
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <GlassButton onClick={handleRunMatrix} variant="primary">
                        Try Again
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    if (!matrixData) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
                <GlassCard className="text-center">
                    <h2 className="text-xl font-bold text-white mb-4">No Matrix Data</h2>
                    <GlassButton onClick={handleRunMatrix} variant="primary">
                        Run Matrix
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    return <MatchupMatrix matrixResult={matrixData} />;
};
