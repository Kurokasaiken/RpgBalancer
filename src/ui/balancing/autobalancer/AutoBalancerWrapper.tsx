import React from 'react';
import { AutoBalancer } from './AutoBalancer';
import type { MatrixRunResult } from '../../../balancing/1v1/types';
import { runMatrix } from '../../../balancing/1v1/matrixRunner';
import { GlassCard } from '../../atoms/GlassCard';
import { useState, useEffect } from 'react';

export const AutoBalancerWrapper: React.FC = () => {
    const [matrixData, setMatrixData] = useState<MatrixRunResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const archetypeIds = ['Tank', 'DPS', 'Assassin', 'Bruiser', 'Evasive', 'Sustain'];
            const result = await runMatrix(archetypeIds, { fast: true, seed: Date.now() });
            setMatrixData(result);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading || !matrixData) {
        return (
            <div className="h-full flex items-center justify-center">
                <GlassCard><div className="text-white">Loading...</div></GlassCard>
            </div>
        );
    }

    return <AutoBalancer matrixResult={matrixData} />;
};
