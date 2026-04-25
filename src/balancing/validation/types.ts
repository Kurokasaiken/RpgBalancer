import type { StatBlock } from '../types';
import type { Archetype } from '../generator';

export interface TestCaseConfig {
    entityA: StatBlock | Archetype;
    entityB: StatBlock | Archetype;
    iterations: number;
    pointBudget?: number; // If using Archetypes, generate with this budget
}

export interface ValidationResult {
    testId: string;
    passed: boolean;
    winRateA: number;
    winRateB: number;
    drawRate: number;
    averageTurns: number;
    message: string;
    details?: string;
}

export interface TestCase {
    id: string;
    name: string;
    description: string;
    config: TestCaseConfig;
    expectedResult: {
        minWinRateA: number;
        maxWinRateA: number;
    };
}
