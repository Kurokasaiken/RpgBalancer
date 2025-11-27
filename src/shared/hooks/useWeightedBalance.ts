/**
 * Custom hook for calculating weight-based balance
 * Generic implementation that can be used for spells, items, characters, etc.
 */

import { useMemo } from 'react';

export const useWeightedBalance = <T,>(
    entity: T,
    statSteps: Record<string, Array<{ value: number; weight: number }>>,
    selectedTicks: Record<string, number>,
    targetCost: number,
    statFields: string[]
): number => {
    return useMemo(() => {
        const totalWeightCost = statFields.reduce((sum, field) => {
            const steps = statSteps[field];
            if (steps && steps.length > 0) {
                const selectedIdx = selectedTicks[field] || 0;
                const selectedStep = steps[selectedIdx];
                return sum + (selectedStep?.weight || 0);
            }
            return sum;
        }, 0);

        return totalWeightCost - targetCost;
    }, [entity, statSteps, selectedTicks, targetCost, statFields]);
};
