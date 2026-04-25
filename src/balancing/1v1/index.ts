/**
 * Main entry point for 1v1 Balancing Module
 * 
 * Exports all public APIs for:
 * - Math engine (pure functions)
 * - Deterministic simulator
 * - Monte Carlo runner
 * - SWI engine
 * - Matrix runner
 * - IO module
 * - Types
 */

// Math Engine
export { MathEngine, DEFAULT_1V1_CONFIG } from './mathEngine';
export type { BalancerConfig1v1 } from './mathEngine';

// Deterministic Simulator
export { simulateExpectedTTK, predictWinProbability } from './simulator';
export type { SimulationResult } from './simulator';

// Monte Carlo
export { runMonteCarlo, runMonteCarloParallel, SeededRNG } from './montecarlo';
export type { MonteCarloMatchResult, MonteCarloResult } from './montecarlo';

// SWI Engine
export {
    computeSWIForMatchup,
    computeAllSWIForMatchup,
    computeBidirectionalSWI,
    formatSWI,
} from './swi';

// Matrix Runner
export {
    runMatrix,
    getMatrixCell,
    calculateBalanceScore,
    findMostImbalanced,
} from './matrixRunner';
export type { MatrixOptions } from './matrixRunner';

// IO Module
export {
    ioManager,
    saveRunResults,
    loadRunResults,
    listRuns,
    saveArchetype,
    loadArchetype,
    loadArchetypes,
    savePreset,
    loadPreset,
    loadPresets,
    saveMatchupResult,
    loadMatchupResult,
    DEFAULT_IO_CONFIG,
} from './io';
export type { IOConfig } from './io';

// Types
export type {
    Archetype,
    MatchupResult,
    MatrixRunResult,
    SWIResult,
} from './types';
