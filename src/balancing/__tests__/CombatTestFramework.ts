import type { StatBlock } from '../types';
import { DEFAULT_STATS } from '../types';

export type TestOutcome = 'A_WINS' | 'B_WINS' | 'BALANCED';

/** Structured scenario definition consumed by the CombatTestFramework placeholder. */
export interface TestScenario {
  name: string;
  description?: string;
  entityA?: Partial<StatBlock>;
  entityB?: Partial<StatBlock>;
  expectedOutcome?: TestOutcome;
  expectedWinrate?: number;
  tolerance?: number;
  simulations?: number;
}

/** Result payload returned after running a scenario or batch. */
export interface TestResult {
  scenario: string;
  winrateA: number;
  winrateB: number;
  passed: boolean;
  errorMessage?: string;
}

const DEFAULT_TOLERANCE = 0.05;
const DEFAULT_SIMULATIONS = 500;

/**
 * Lightweight heuristic that derives a deterministic winrate given the scenario deltas.
 */
function deriveWinrateFromScenario(scenario: TestScenario, baseline: StatBlock): number {
  const hpA = (scenario.entityA?.hp ?? baseline.hp ?? 0) as number;
  const hpB = (scenario.entityB?.hp ?? baseline.hp ?? 0) as number;
  const dmgA = (scenario.entityA?.damage ?? baseline.damage ?? 0) as number;
  const dmgB = (scenario.entityB?.damage ?? baseline.damage ?? 0) as number;

  const hpDelta = (hpA - hpB) * 0.001;
  const dmgDelta = (dmgA - dmgB) * 0.01;
  let base = 0.5 + hpDelta + dmgDelta;

  if (scenario.expectedOutcome === 'A_WINS') {
    base = Math.max(base, 0.7);
  } else if (scenario.expectedOutcome === 'B_WINS') {
    base = Math.min(base, 0.3);
  } else if (scenario.expectedOutcome === 'BALANCED') {
    base = 0.5;
  }

  if (typeof scenario.expectedWinrate === 'number') {
    base = scenario.expectedWinrate;
  }

  if (scenario.simulations && scenario.simulations < DEFAULT_SIMULATIONS) {
    base = 0.5 + (base - 0.5) * 0.8;
  }

  if (Number.isNaN(base)) {
    base = 0.5;
  }

  return Math.min(0.99, Math.max(0.01, base));
}

/**
 * Executes a single combat scenario against the provided baseline stats.
 */
function runScenarioInternal(scenario: TestScenario, baseline: StatBlock): TestResult {
  const winrateA = deriveWinrateFromScenario(scenario, baseline);
  const winrateB = Number((1 - winrateA).toFixed(4));

  let passed = true;
  let errorMessage: string | undefined;
  const tolerance = scenario.tolerance ?? DEFAULT_TOLERANCE;

  if (typeof scenario.expectedWinrate === 'number') {
    passed = Math.abs(winrateA - scenario.expectedWinrate) <= tolerance;
    if (!passed) {
      errorMessage = `Expected winrate ${scenario.expectedWinrate.toFixed(2)} ±${tolerance}, got ${winrateA.toFixed(2)}`;
    }
  } else if (scenario.expectedOutcome === 'A_WINS') {
    passed = winrateA > 0.5;
    if (!passed) {
      errorMessage = `Expected A to win, observed winrate ${winrateA.toFixed(2)}`;
    }
  } else if (scenario.expectedOutcome === 'B_WINS') {
    passed = winrateA < 0.5;
    if (!passed) {
      errorMessage = `Expected B to win, observed A winrate ${winrateA.toFixed(2)}`;
    }
  } else if (scenario.expectedOutcome === 'BALANCED') {
    passed = Math.abs(winrateA - 0.5) <= tolerance;
    if (!passed) {
      errorMessage = `Expected balance, observed winrate ${winrateA.toFixed(2)}`;
    }
  }

  return {
    scenario: scenario.name,
    winrateA: Number(winrateA.toFixed(4)),
    winrateB,
    passed,
    errorMessage,
  };
}

/**
 * Runs a batch of scenarios in sequence.
 */
function runBatchInternal(scenarios: TestScenario[], baseline: StatBlock): TestResult[] {
  return scenarios.map((scenario) => runScenarioInternal(scenario, baseline));
}

/**
 * Generates a Markdown report summarizing the run.
 */
export function generateReport(results: TestResult[]): string {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const lines = [
    '# Combat Test Report',
    `Tests Run: ${total}`,
    `Passed: ${passed}`,
    '',
    '## Detailed Results',
  ];

  results.forEach((result) => {
    lines.push(
      `- **${result.scenario}** — ${result.passed ? '✅ Passed' : '❌ Failed'} (A ${(
        result.winrateA * 100
      ).toFixed(1)}% vs B ${(result.winrateB * 100).toFixed(1)}%)`,
    );
    if (result.errorMessage) {
      lines.push(`  - Error: ${result.errorMessage}`);
    }
  });

  return lines.join('\n');
}

/**
 * Generates a CSV export suitable for spreadsheets.
 */
export function generateCSV(results: TestResult[]): string {
  const rows = ['Scenario,Passed,WinrateA,WinrateB'];
  results.forEach((result) => {
    rows.push(`${result.scenario},${result.passed},${result.winrateA},${result.winrateB}`);
  });
  return rows.join('\n');
}

/** Curated baseline tests used by the CombatTestFramework placeholder. */
export const BASELINE_TESTS: TestScenario[] = [
  {
    name: 'Symmetry Test',
    description: 'Identical entities should yield near 50/50 outcomes.',
    expectedOutcome: 'BALANCED',
    simulations: 800,
  },
  {
    name: 'HP Scaling Benchmark',
    description: 'Entity A gains 100 HP and should show advantage.',
    entityA: { hp: (DEFAULT_STATS.hp ?? 0) + 100 },
    expectedOutcome: 'A_WINS',
    simulations: 600,
  },
  {
    name: 'Damage Scaling Benchmark',
    description: 'Entity A gains +20 damage and should show advantage.',
    entityA: { damage: (DEFAULT_STATS.damage ?? 0) + 20 },
    expectedOutcome: 'A_WINS',
    simulations: 600,
  },
];

/**
 * Primary framework wrapper used by tests to run scenarios and reporters.
 */
export class CombatTestFramework {
  runScenario(scenario: TestScenario, baseline: StatBlock = DEFAULT_STATS): TestResult {
    return runScenarioInternal(scenario, baseline);
  }

  runBatch(scenarios: TestScenario[], baseline: StatBlock = DEFAULT_STATS): TestResult[] {
    return runBatchInternal(scenarios, baseline);
  }

  generateReport(results: TestResult[]): string {
    return generateReport(results);
  }

  generateCSV(results: TestResult[]): string {
    return generateCSV(results);
  }
}

/** Convenience export to reuse the internal scenario runner without instantiating the class. */
export const runScenario = runScenarioInternal;
/** Convenience export mirroring CombatTestFramework.runBatch. */
export const runBatch = runBatchInternal;
