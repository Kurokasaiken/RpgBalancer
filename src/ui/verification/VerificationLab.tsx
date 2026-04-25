import React, { useState } from 'react';
import type { TestCase, ValidationResult } from '../../balancing/validation/types';
import { runValidationSuite } from '../../balancing/validation/runner';
import { DEFAULT_STATS } from '../../balancing/types';

const INITIAL_TEST_CASES: TestCase[] = [
    {
        id: 'baseline_fairness',
        name: 'Baseline Fairness',
        description: 'Verifies that two identical entities have a ~50% win rate.',
        config: {
            entityA: DEFAULT_STATS,
            entityB: DEFAULT_STATS,
            iterations: 500
        },
        expectedResult: {
            minWinRateA: 45,
            maxWinRateA: 55
        }
    },
    {
        id: 'tank_vs_glass_cannon',
        name: 'Tank vs Glass Cannon',
        description: 'Verifies Rock-Paper-Scissors dynamic (Tank should beat GC).',
        config: {
            entityA: 'tank',
            entityB: 'glass_cannon',
            iterations: 500,
            pointBudget: 100
        },
        expectedResult: {
            minWinRateA: 55, // Tank should win > 55%
            maxWinRateA: 100
        }
    },
    {
        id: 'glass_cannon_vs_evasive',
        name: 'Glass Cannon vs Evasive',
        description: 'Verifies Rock-Paper-Scissors dynamic (GC should beat Evasive).',
        config: {
            entityA: 'glass_cannon',
            entityB: 'evasive',
            iterations: 500,
            pointBudget: 100
        },
        expectedResult: {
            minWinRateA: 55,
            maxWinRateA: 100
        }
    }
];

export const VerificationLab: React.FC = () => {
    const [results, setResults] = useState<ValidationResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const handleRunAll = async () => {
        setIsRunning(true);
        setResults([]); // Clear previous

        // Small timeout to allow UI to update
        setTimeout(async () => {
            try {
                const res = await runValidationSuite(INITIAL_TEST_CASES);
                setResults(res);
            } catch (error) {
                console.error("Validation failed:", error);
                // Ideally show an error toast or message here
            } finally {
                setIsRunning(false);
            }
        }, 100);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-green-400">Verification Lab</h2>
                    <p className="text-gray-400 mt-2">Automated validation suite for game balance.</p>
                </div>
                <button
                    onClick={handleRunAll}
                    disabled={isRunning}
                    className={`px-6 py-3 rounded font-bold text-lg transition-colors ${isRunning
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-500'
                        }`}
                >
                    {isRunning ? 'Running Tests...' : 'Run All Tests'}
                </button>
            </div>

            <div className="grid gap-4">
                {INITIAL_TEST_CASES.map(test => {
                    const result = results.find(r => r.testId === test.id);

                    return (
                        <div key={test.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold">{test.name}</h3>
                                    {result && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${result.passed ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                                            }`}>
                                            {result.passed ? 'PASS' : 'FAIL'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">{test.description}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Config: {typeof test.config.entityA === 'string' ? test.config.entityA : 'Custom'} vs {typeof test.config.entityB === 'string' ? test.config.entityB : 'Custom'} ({test.config.iterations} iterations)
                                </p>
                            </div>

                            {result ? (
                                <div className="text-right">
                                    <div className="text-2xl font-bold mb-1">
                                        <span className="text-blue-400">{result.winRateA.toFixed(1)}%</span>
                                        <span className="text-gray-600 mx-2">/</span>
                                        <span className="text-red-400">{result.winRateB.toFixed(1)}%</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Draws: {result.drawRate.toFixed(1)}% | Avg Turns: {result.averageTurns.toFixed(1)}
                                    </div>
                                    {!result.passed && (
                                        <div className="text-red-400 text-xs mt-1 font-bold">
                                            {result.message}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-600 italic">
                                    Waiting to run...
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
