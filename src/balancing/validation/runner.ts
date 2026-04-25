import { Entity } from '../../engine/core/entity';
import { createEmptyAttributes } from '../../engine/core/stats';
import { runSimulation } from '../../engine/simulation/runner';
import { generateStatBlock, type Archetype } from '../generator';
import type { TestCase, ValidationResult } from './types';
import type { StatBlock } from '../types';

export const runValidationSuite = async (tests: TestCase[]): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];

    for (const test of tests) {
        // 1. Prepare Entities
        let statsA: StatBlock;
        let statsB: StatBlock;

        if (typeof test.config.entityA === 'string') {
            // It's an Archetype
            statsA = generateStatBlock(test.config.entityA as Archetype, test.config.pointBudget || 100);
        } else {
            statsA = test.config.entityA as StatBlock;
        }

        if (typeof test.config.entityB === 'string') {
            // It's an Archetype
            statsB = generateStatBlock(test.config.entityB as Archetype, test.config.pointBudget || 100);
        } else {
            statsB = test.config.entityB as StatBlock;
        }

        const entityA = new Entity('test_a', 'Entity A', createEmptyAttributes());
        entityA.statBlock = statsA;
        entityA.derivedStats.maxHp = statsA.hp;
        entityA.currentHp = statsA.hp;

        const entityB = new Entity('test_b', 'Entity B', createEmptyAttributes());
        entityB.statBlock = statsB;
        entityB.derivedStats.maxHp = statsB.hp;
        entityB.currentHp = statsB.hp;

        // 2. Run Simulation
        // We run synchronously for now, but in a real app we might want to yield to main thread
        const simResult = runSimulation(entityA, entityB, test.config.iterations);

        // 3. Analyze Results
        const winRateA = (simResult.winsA / simResult.totalBattles) * 100;
        const winRateB = (simResult.winsB / simResult.totalBattles) * 100;
        const drawRate = (simResult.draws / simResult.totalBattles) * 100;

        const passed = winRateA >= test.expectedResult.minWinRateA && winRateA <= test.expectedResult.maxWinRateA;

        results.push({
            testId: test.id,
            passed,
            winRateA,
            winRateB,
            drawRate,
            averageTurns: simResult.averageTurns,
            message: passed ? 'PASSED' : `FAILED: Win Rate A ${winRateA.toFixed(1)}% (Expected ${test.expectedResult.minWinRateA}-${test.expectedResult.maxWinRateA}%)`
        });
    }

    return results;
};
