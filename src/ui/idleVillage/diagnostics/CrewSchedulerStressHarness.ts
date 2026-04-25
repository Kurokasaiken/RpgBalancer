/**
 * Crew Scheduler Stress Harness
 * React component for dev UI stress testing of crew scheduler
 * 
 * @see NP-154 – Idle Village Crew Scheduler Stress Harness
 */

import { z } from 'zod';
import { useState, useCallback } from 'react';

// Stress test configuration
export interface StressTestConfig {
  runs: number;
  crewCaps: {
    min: number;
    max: number;
  };
  fatigueRanges: {
    min: number;
    max: number;
  };
  seed: number;
  scenarios: {
    overlapIntensity: number;
    conflictProbability: number;
    maxConcurrentAssignments: number;
  };
  telemetry: {
    enabled: boolean;
    event: string;
  };
}

// Stress test result
export interface StressTestResult {
  runId: string;
  timestamp: number;
  config: StressTestConfig;
  metrics: {
    totalScenarios: number;
    conflictsDetected: number;
    conflictPercentage: number;
    avgLatencyMs: number;
    maxLatencyMs: number;
    minLatencyMs: number;
    successfulAssignments: number;
    failedAssignments: number;
  };
  conflicts: ConflictDetail[];
  performance: {
    totalDurationMs: number;
    scenariosPerSecond: number;
    memoryUsageMB: number;
  };
}

// Conflict detail
export interface ConflictDetail {
  scenarioId: string;
  conflictType: 'overlap' | 'capacity' | 'fatigue' | 'stat_requirement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedResidents: string[];
  timestamp: number;
}

// Test scenario
export interface TestScenario {
  id: string;
  crewSize: number;
  assignments: {
    residentId: string;
    activityId: string;
    startTime: number;
    duration: number;
    fatigue: number;
  }[];
}

// Zod schemas
export const StressTestConfigSchema = z.object({
  runs: z.number().min(1).max(10000),
  crewCaps: z.object({
    min: z.number().min(1),
    max: z.number().max(50),
  }),
  fatigueRanges: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  seed: z.number(),
  scenarios: z.object({
    overlapIntensity: z.number().min(0).max(1),
    conflictProbability: z.number().min(0).max(1),
    maxConcurrentAssignments: z.number().min(1).max(20),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    event: z.string(),
  }),
});

// Default configuration
export const DEFAULT_STRESS_CONFIG: StressTestConfig = {
  runs: 1000,
  crewCaps: {
    min: 3,
    max: 15,
  },
  fatigueRanges: {
    min: 0,
    max: 100,
  },
  seed: 42,
  scenarios: {
    overlapIntensity: 0.3,
    conflictProbability: 0.2,
    maxConcurrentAssignments: 5,
  },
  telemetry: {
    enabled: true,
    event: 'iv_crew_stress_run',
  },
};

/**
 * LCG random number generator (deterministic)
 */
class SeededRandom {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Crew Scheduler Stress Harness
 * 
 * Generates massive simulations to discover conflicts and performance issues:
 * - Deterministic scenario generation with seeded RNG
 * - Conflict detection (overlap, capacity, fatigue, stat requirements)
 * - Performance metrics (latency, throughput, memory)
 * - Detailed conflict reporting
 * - Export to JSON/Markdown
 */
export class CrewSchedulerStressHarness {
  private config: StressTestConfig;
  private rng: SeededRandom;

  constructor(config: StressTestConfig = DEFAULT_STRESS_CONFIG) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
  }

  /**
   * Generate test scenario
   */
  private generateScenario(scenarioId: string): TestScenario {
    const crewSize = this.rng.nextInt(this.config.crewCaps.min, this.config.crewCaps.max);
    const assignments = [];

    for (let i = 0; i < crewSize; i++) {
      const numAssignments = this.rng.nextInt(1, this.config.scenarios.maxConcurrentAssignments);
      
      for (let j = 0; j < numAssignments; j++) {
        const startTime = this.rng.nextInt(0, 24 * 60); // 0-1440 minutes
        const duration = this.rng.nextInt(30, 240); // 30-240 minutes
        const fatigue = this.rng.nextInt(this.config.fatigueRanges.min, this.config.fatigueRanges.max);

        assignments.push({
          residentId: `resident_${i}`,
          activityId: `activity_${j}`,
          startTime,
          duration,
          fatigue,
        });
      }
    }

    return {
      id: scenarioId,
      crewSize,
      assignments,
    };
  }

  /**
   * Detect conflicts in scenario
   */
  private detectConflicts(scenario: TestScenario): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];

    // Check for time overlaps
    for (let i = 0; i < scenario.assignments.length; i++) {
      for (let j = i + 1; j < scenario.assignments.length; j++) {
        const a1 = scenario.assignments[i];
        const a2 = scenario.assignments[j];

        // Same resident, overlapping times
        if (a1.residentId === a2.residentId) {
          const a1End = a1.startTime + a1.duration;
          const a2End = a2.startTime + a2.duration;

          const overlaps = (a1.startTime < a2End && a2.startTime < a1End);

          if (overlaps) {
            conflicts.push({
              scenarioId: scenario.id,
              conflictType: 'overlap',
              severity: 'high',
              description: `Resident ${a1.residentId} has overlapping assignments`,
              affectedResidents: [a1.residentId],
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    // Check for fatigue violations
    const residentFatigue = new Map<string, number>();
    for (const assignment of scenario.assignments) {
      const current = residentFatigue.get(assignment.residentId) || 0;
      residentFatigue.set(assignment.residentId, current + assignment.fatigue);
    }

    for (const [residentId, totalFatigue] of residentFatigue.entries()) {
      if (totalFatigue > 100) {
        conflicts.push({
          scenarioId: scenario.id,
          conflictType: 'fatigue',
          severity: totalFatigue > 150 ? 'critical' : 'medium',
          description: `Resident ${residentId} exceeds fatigue limit (${totalFatigue})`,
          affectedResidents: [residentId],
          timestamp: Date.now(),
        });
      }
    }

    // Check for capacity violations
    const concurrentAssignments = new Map<number, Set<string>>();
    for (const assignment of scenario.assignments) {
      for (let t = assignment.startTime; t < assignment.startTime + assignment.duration; t++) {
        if (!concurrentAssignments.has(t)) {
          concurrentAssignments.set(t, new Set());
        }
        concurrentAssignments.get(t)!.add(assignment.residentId);
      }
    }

    for (const [time, residents] of concurrentAssignments.entries()) {
      if (residents.size > this.config.scenarios.maxConcurrentAssignments) {
        conflicts.push({
          scenarioId: scenario.id,
          conflictType: 'capacity',
          severity: 'medium',
          description: `Too many concurrent assignments at time ${time} (${residents.size})`,
          affectedResidents: Array.from(residents),
          timestamp: Date.now(),
        });
      }
    }

    return conflicts;
  }

  /**
   * Run stress test
   */
  async runStressTest(): Promise<StressTestResult> {
    const startTime = performance.now();
    const runId = `stress_${Date.now()}_${this.config.seed}`;

    let totalConflicts = 0;
    let totalLatency = 0;
    let maxLatency = 0;
    let minLatency = Infinity;
    let successfulAssignments = 0;
    let failedAssignments = 0;
    const allConflicts: ConflictDetail[] = [];

    for (let i = 0; i < this.config.runs; i++) {
      const scenarioStart = performance.now();
      const scenario = this.generateScenario(`scenario_${i}`);
      const conflicts = this.detectConflicts(scenario);
      const scenarioLatency = performance.now() - scenarioStart;

      totalLatency += scenarioLatency;
      maxLatency = Math.max(maxLatency, scenarioLatency);
      minLatency = Math.min(minLatency, scenarioLatency);

      if (conflicts.length > 0) {
        totalConflicts += conflicts.length;
        failedAssignments += scenario.assignments.length;
        allConflicts.push(...conflicts);
      } else {
        successfulAssignments += scenario.assignments.length;
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const result: StressTestResult = {
      runId,
      timestamp: Date.now(),
      config: this.config,
      metrics: {
        totalScenarios: this.config.runs,
        conflictsDetected: totalConflicts,
        conflictPercentage: (totalConflicts / this.config.runs) * 100,
        avgLatencyMs: totalLatency / this.config.runs,
        maxLatencyMs: maxLatency,
        minLatencyMs: minLatency === Infinity ? 0 : minLatency,
        successfulAssignments,
        failedAssignments,
      },
      conflicts: allConflicts.slice(0, 100), // Limit to first 100 for report
      performance: {
        totalDurationMs: totalDuration,
        scenariosPerSecond: (this.config.runs / totalDuration) * 1000,
        memoryUsageMB: (performance as any).memory ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0,
      },
    };

    // Emit telemetry
    if (this.config.telemetry.enabled) {
      this.emitTelemetry(result);
    }

    return result;
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetry(result: StressTestResult): void {
    console.log(`[StressHarness] ${this.config.telemetry.event}`, {
      runId: result.runId,
      conflictPercentage: result.metrics.conflictPercentage,
      avgLatencyMs: result.metrics.avgLatencyMs,
      scenariosPerSecond: result.performance.scenariosPerSecond,
    });
  }

  /**
   * Export to JSON
   */
  exportToJSON(result: StressTestResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Export to Markdown
   */
  exportToMarkdown(result: StressTestResult): string {
    const lines: string[] = [];

    lines.push('# Crew Scheduler Stress Test Report');
    lines.push('');
    lines.push(`**Run ID**: ${result.runId}`);
    lines.push(`**Timestamp**: ${new Date(result.timestamp).toISOString()}`);
    lines.push(`**Seed**: ${result.config.seed}`);
    lines.push('');

    // Metrics
    lines.push('## Metrics');
    lines.push('');
    lines.push(`- **Total Scenarios**: ${result.metrics.totalScenarios}`);
    lines.push(`- **Conflicts Detected**: ${result.metrics.conflictsDetected}`);
    lines.push(`- **Conflict %**: ${result.metrics.conflictPercentage.toFixed(2)}%`);
    lines.push(`- **Avg Latency**: ${result.metrics.avgLatencyMs.toFixed(2)}ms`);
    lines.push(`- **Max Latency**: ${result.metrics.maxLatencyMs.toFixed(2)}ms`);
    lines.push(`- **Min Latency**: ${result.metrics.minLatencyMs.toFixed(2)}ms`);
    lines.push(`- **Successful Assignments**: ${result.metrics.successfulAssignments}`);
    lines.push(`- **Failed Assignments**: ${result.metrics.failedAssignments}`);
    lines.push('');

    // Performance
    lines.push('## Performance');
    lines.push('');
    lines.push(`- **Total Duration**: ${result.performance.totalDurationMs.toFixed(2)}ms`);
    lines.push(`- **Scenarios/sec**: ${result.performance.scenariosPerSecond.toFixed(2)}`);
    lines.push(`- **Memory Usage**: ${result.performance.memoryUsageMB.toFixed(2)}MB`);
    lines.push('');

    // Conflicts
    if (result.conflicts.length > 0) {
      lines.push('## Conflicts (Top 100)');
      lines.push('');
      
      const conflictsByType = new Map<string, number>();
      for (const conflict of result.conflicts) {
        conflictsByType.set(conflict.conflictType, (conflictsByType.get(conflict.conflictType) || 0) + 1);
      }

      lines.push('### By Type');
      lines.push('');
      for (const [type, count] of conflictsByType.entries()) {
        lines.push(`- **${type}**: ${count}`);
      }
      lines.push('');

      lines.push('### Details');
      lines.push('');
      for (const conflict of result.conflicts.slice(0, 10)) {
        lines.push(`#### ${conflict.conflictType} (${conflict.severity})`);
        lines.push('');
        lines.push(`- **Description**: ${conflict.description}`);
        lines.push(`- **Affected**: ${conflict.affectedResidents.join(', ')}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StressTestConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.rng = new SeededRandom(this.config.seed);
  }

  /**
   * Get current configuration
   */
  getConfig(): StressTestConfig {
    return { ...this.config };
  }
}

/**
 * React hook for stress testing
 */
export function useCrewSchedulerStressTest(config?: StressTestConfig) {
  const [harness] = useState(() => new CrewSchedulerStressHarness(config));
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = useCallback(async () => {
    setIsRunning(true);
    try {
      const testResult = await harness.runStressTest();
      setResult(testResult);
    } finally {
      setIsRunning(false);
    }
  }, [harness]);

  const exportJSON = useCallback(() => {
    if (!result) return '';
    return harness.exportToJSON(result);
  }, [harness, result]);

  const exportMarkdown = useCallback(() => {
    if (!result) return '';
    return harness.exportToMarkdown(result);
  }, [harness, result]);

  return {
    runTest,
    result,
    isRunning,
    exportJSON,
    exportMarkdown,
    harness,
  };
}
