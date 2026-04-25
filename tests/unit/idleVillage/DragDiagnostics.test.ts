import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  DEFAULT_DRAG_DIAGNOSTICS_CONFIG, 
  DRAG_DIAGNOSTICS_PRESETS,
  type DragDiagnosticsConfig,
  type DragScenario 
} from '../../../src/ui/idleVillage/diagnostics/dragDiagnosticsConfig.js';

describe('Drag Diagnostics Configuration', () => {
  it('should have valid default configuration', () => {
    expect(DEFAULT_DRAG_DIAGNOSTICS_CONFIG).toBeDefined();
    expect(DEFAULT_DRAG_DIAGNOSTICS_CONFIG.name).toBe('Idle Village Drag Diagnostics');
    expect(DEFAULT_DRAG_DIAGNOSTICS_CONFIG.scenarios).toHaveLength(4);
    expect(DEFAULT_DRAG_DIAGNOSTICS_CONFIG.execution).toBeDefined();
    expect(DEFAULT_DRAG_DIAGNOSTICS_CONFIG.output).toBeDefined();
    expect(DEFAULT_DRAG_DIAGNOSTICS_CONFIG.telemetry).toBeDefined();
  });

  it('should have valid presets', () => {
    expect(DRAG_DIAGNOSTICS_PRESETS).toBeDefined();
    expect(Object.keys(DRAG_DIAGNOSTICS_PRESETS)).toContain('quick');
    expect(Object.keys(DRAG_DIAGNOSTICS_PRESETS)).toContain('comprehensive');
    expect(Object.keys(DRAG_DIAGNOSTICS_PRESETS)).toContain('performance');
  });

  it('quick preset should have limited scenarios', () => {
    const quickPreset = DRAG_DIAGNOSTICS_PRESETS.quick;
    expect(quickPreset.scenarios).toHaveLength(2);
    expect(quickPreset.execution.parallelExecution).toBe(false);
    expect(quickPreset.execution.maxConcurrentOps).toBe(1);
  });

  it('comprehensive preset should have all scenarios', () => {
    const comprehensivePreset = DRAG_DIAGNOSTICS_PRESETS.comprehensive;
    expect(comprehensivePreset.scenarios).toHaveLength(4);
    expect(comprehensivePreset.execution.parallelExecution).toBe(true);
    expect(comprehensivePreset.execution.verbose).toBe(true);
  });

  it('performance preset should have strict thresholds', () => {
    const performancePreset = DRAG_DIAGNOSTICS_PRESETS.performance;
    expect(performancePreset.execution.useDOMHarness).toBe(true);
    expect(performancePreset.execution.captureMetrics).toBe(true);
    expect(performancePreset.output.generateLatencyChart).toBe(true);
  });

  it('should validate scenario structure', () => {
    const scenario = DEFAULT_DRAG_DIAGNOSTICS_CONFIG.scenarios[0];
    
    expect(scenario.id).toBeDefined();
    expect(scenario.name).toBeDefined();
    expect(scenario.type).toBeDefined();
    expect(scenario.description).toBeDefined();
    expect(scenario.resident).toBeDefined();
    expect(scenario.slot).toBeDefined();
    expect(scenario.currentAssignments).toBeDefined();
    expect(scenario.expected).toBeDefined();
    expect(scenario.iterations).toBeGreaterThan(0);
    expect(scenario.enabled).toBeDefined();
    expect(scenario.priority).toBeDefined();
  });

  it('should validate resident structure', () => {
    const resident = DEFAULT_DRAG_DIAGNOSTICS_CONFIG.scenarios[0].resident;
    
    expect(resident.id).toBeDefined();
    expect(resident.name).toBeDefined();
    expect(resident.status).toBeDefined();
    expect(typeof resident.fatigue).toBe('number');
    expect(Array.isArray(resident.statTags)).toBe(true);
    expect(typeof resident.stats).toBe('object');
  });

  it('should validate slot structure', () => {
    const slot = DEFAULT_DRAG_DIAGNOSTICS_CONFIG.scenarios[0].slot;
    
    expect(slot.id).toBeDefined();
    expect(slot.activityId).toBeDefined();
    expect(slot.name).toBeDefined();
    expect(typeof slot.maxCapacity).toBe('number');
    expect(slot.maxCapacity).toBeGreaterThan(0);
  });

  it('should validate expected results structure', () => {
    const expected = DEFAULT_DRAG_DIAGNOSTICS_CONFIG.scenarios[0].expected;
    
    expect(typeof expected.valid).toBe('boolean');
    // reason is optional, so check if it exists or is undefined
    expect(expected.reason === undefined || typeof expected.reason === 'string').toBe(true);
  });
});

describe('Drag Diagnostics CLI Integration', () => {
  let mockConfig: DragDiagnosticsConfig;
  let mockIdleVillageConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConfig = { ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG };
    
    mockIdleVillageConfig = {
      activities: {
        'forest-work': {
          id: 'forest-work',
          name: 'Forest Work',
          statRequirements: {
            allOf: ['strength'],
            anyOf: [],
            noneOf: [],
          },
          fatigueThreshold: 80,
          maxCrew: 3,
        },
      },
      global: {
        invasionRules: {},
      },
    };
  });

  it('should create mock Idle Village config', () => {
    expect(mockIdleVillageConfig).toBeDefined();
    expect(mockIdleVillageConfig.activities).toBeDefined();
    expect(mockIdleVillageConfig.activities['forest-work']).toBeDefined();
    expect(mockIdleVillageConfig.global).toBeDefined();
  });

  it('should filter scenarios correctly', () => {
    const config = { ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG };
    const scenarioIds = ['valid-basic-drop'];
    
    const filteredScenarios = config.scenarios.filter((scenario: DragScenario) => 
      scenarioIds.includes(scenario.id)
    );

    expect(filteredScenarios).toHaveLength(1);
    expect(filteredScenarios[0].id).toBe('valid-basic-drop');
  });

  it('should apply CLI overrides correctly', () => {
    const config = { ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG };
    
    // Apply overrides
    config.execution.verbose = true;
    config.execution.scenarioTimeoutMs = 15000;
    config.execution.parallelExecution = false;
    config.output.formats = ['json'];
    config.telemetry.enabled = false;

    expect(config.execution.verbose).toBe(true);
    expect(config.execution.scenarioTimeoutMs).toBe(15000);
    expect(config.execution.parallelExecution).toBe(false);
    expect(config.output.formats).toEqual(['json']);
    expect(config.telemetry.enabled).toBe(false);
  });

  it('should validate configuration constraints', () => {
    const config = { ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG };
    
    // Check reasonable defaults
    expect(config.execution.maxConcurrentOps).toBeGreaterThan(0);
    expect(config.execution.scenarioTimeoutMs).toBeGreaterThan(0);
    expect(config.scenarios.every((s: DragScenario) => s.iterations > 0)).toBe(true);
    expect(config.scenarios.every((s: DragScenario) => s.iterations <= 1000)).toBe(true);
  });
});

describe('Drag Diagnostics Bundle Generation', () => {
  it('should generate valid bundle structure', () => {
    const mockResults = [
      {
        scenarioId: 'test-scenario-1',
        scenarioName: 'Test Scenario 1',
        scenarioType: 'valid',
        iterations: 10,
        results: [
          {
            iteration: 1,
            success: true,
            latencyMs: 25,
            valid: true,
          },
          {
            iteration: 2,
            success: true,
            latencyMs: 30,
            valid: true,
          },
        ],
        summary: {
          totalIterations: 2,
          successfulIterations: 2,
          failedIterations: 0,
          averageLatencyMs: 27.5,
          minLatencyMs: 25,
          maxLatencyMs: 30,
          successRate: 1.0,
          validationConsistency: 1.0,
          performanceScore: 95.0,
        },
        performance: {
          passedThresholds: true,
          latencyThresholdMs: 50,
          successRateThreshold: 1.0,
          thresholdViolations: [],
        },
      },
      {
        scenarioId: 'test-scenario-2',
        scenarioName: 'Test Scenario 2',
        scenarioType: 'invalid',
        iterations: 10,
        results: [
          {
            iteration: 1,
            success: false,
            latencyMs: 15,
            valid: false,
            error: 'Validation failed',
          },
        ],
        summary: {
          totalIterations: 1,
          successfulIterations: 0,
          failedIterations: 1,
          averageLatencyMs: 15,
          minLatencyMs: 15,
          maxLatencyMs: 15,
          successRate: 0,
          validationConsistency: 0,
          performanceScore: 25.0,
        },
        performance: {
          passedThresholds: false,
          latencyThresholdMs: 50,
          successRateThreshold: 1.0,
          thresholdViolations: ['Success rate 0.0% < 100.0%'],
        },
      },
    ];

    const bundle = {
      id: 'test-bundle',
      name: 'Test Bundle',
      description: 'Test Description',
      timestamp: new Date().toISOString(),
      duration: 300,
      config: DEFAULT_DRAG_DIAGNOSTICS_CONFIG,
      results: mockResults,
      summary: {
        totalScenarios: 2,
        successfulScenarios: 1,
        failedScenarios: 1,
        totalIterations: 3,
        overallSuccessRate: 0.5,
        averageLatencyMs: 21.25,
        performanceScore: 60.0,
        kpiAchieved: false,
      },
      telemetry: {
        eventId: 'test-event',
        timestamp: new Date().toISOString(),
        metadata: {},
      },
    };

    expect(bundle.id).toBeDefined();
    expect(bundle.name).toBeDefined();
    expect(bundle.results).toHaveLength(2);
    expect(bundle.summary.totalScenarios).toBe(2);
    expect(bundle.summary.successfulScenarios).toBe(1);
    expect(bundle.summary.failedScenarios).toBe(1);
    expect(bundle.summary.overallSuccessRate).toBe(0.5);
  });

  it('should calculate summary metrics correctly', () => {
    const results = [
      { performance: { passedThresholds: true } },
      { performance: { passedThresholds: true } },
      { performance: { passedThresholds: false } },
      { performance: { passedThresholds: true } },
    ];

    const successfulScenarios = results.filter(r => r.performance.passedThresholds).length;
    const overallSuccessRate = results.length > 0 ? successfulScenarios / results.length : 0;

    expect(successfulScenarios).toBe(3);
    expect(overallSuccessRate).toBe(0.75);
  });
});

describe('Drag Diagnostics Export Formats', () => {
  it('should generate valid JSON export', () => {
    const bundle = {
      id: 'test-bundle',
      name: 'Test Bundle',
      timestamp: new Date().toISOString(),
      summary: { kpiAchieved: true },
      config: DEFAULT_DRAG_DIAGNOSTICS_CONFIG,
      results: [],
      telemetry: { eventId: 'test-event', timestamp: new Date().toISOString(), metadata: {} },
    };

    const jsonExport = JSON.stringify(bundle, null, 2);
    
    expect(jsonExport).toBeDefined();
    expect(() => JSON.parse(jsonExport)).not.toThrow();
    
    const parsed = JSON.parse(jsonExport);
    expect(parsed.id).toBe('test-bundle');
    expect(parsed.name).toBe('Test Bundle');
  });

  it('should generate valid markdown report', () => {
    const bundle = {
      name: 'Test Bundle',
      description: 'Test Description',
      timestamp: new Date().toISOString(),
      duration: 300,
      summary: {
        totalScenarios: 2,
        successfulScenarios: 1,
        failedScenarios: 1,
        overallSuccessRate: 0.5,
        averageLatencyMs: 25.5,
        performanceScore: 75.0,
        kpiAchieved: false,
      },
      results: [
        {
          scenarioName: 'Scenario 1',
          scenarioType: 'valid',
          summary: {
            totalIterations: 10,
            successRate: 1.0,
            averageLatencyMs: 20.0,
            performanceScore: 95.0,
          },
          performance: {
            passedThresholds: true,
          },
        },
        {
          scenarioName: 'Scenario 2',
          scenarioType: 'invalid',
          summary: {
            totalIterations: 10,
            successRate: 0.0,
            averageLatencyMs: 30.0,
            performanceScore: 25.0,
          },
          performance: {
            passedThresholds: false,
          },
        },
      ],
      config: { output: { generateLatencyChart: true } },
      telemetry: { eventId: 'test-event', timestamp: new Date().toISOString() },
    };

    // Simple markdown generation test
    let markdown = `# ${bundle.name}\n\n`;
    markdown += `**Description**: ${bundle.description}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Scenarios**: ${bundle.summary.totalScenarios}\n`;
    markdown += `- **Successful**: ${bundle.summary.successfulScenarios}\n`;
    markdown += `- **Failed**: ${bundle.summary.failedScenarios}\n`;
    markdown += `- **Overall Success Rate**: ${(bundle.summary.overallSuccessRate * 100).toFixed(1)}%\n\n`;

    expect(markdown).toContain('# Test Bundle');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('- **Total Scenarios**: 2');
    expect(markdown).toContain('- **Overall Success Rate**: 50.0%');
  });

  it('should generate valid CSV report', () => {
    const results = [
      {
        scenarioId: 'scenario-1',
        scenarioName: 'Scenario 1',
        scenarioType: 'valid',
        summary: {
          totalIterations: 10,
          successfulIterations: 10,
          failedIterations: 0,
          successRate: 1.0,
          averageLatencyMs: 20.5,
          minLatencyMs: 15.0,
          maxLatencyMs: 25.0,
          performanceScore: 95.0,
        },
        performance: {
          passedThresholds: true,
        },
      },
      {
        scenarioId: 'scenario-2',
        scenarioName: 'Scenario 2',
        scenarioType: 'invalid',
        summary: {
          totalIterations: 10,
          successfulIterations: 5,
          failedIterations: 5,
          successRate: 0.5,
          averageLatencyMs: 30.0,
          minLatencyMs: 20.0,
          maxLatencyMs: 40.0,
          performanceScore: 50.0,
        },
        performance: {
          passedThresholds: false,
        },
      },
    ];

    let csv = 'Scenario ID,Scenario Name,Type,Iterations,Successful,Failed,Success Rate,Avg Latency (ms),Min Latency (ms),Max Latency (ms),Performance Score,Status\n';
    
    results.forEach(result => {
      const status = result.performance.passedThresholds ? 'PASS' : 'FAIL';
      const successRate = (result.summary.successRate * 100).toFixed(2);
      const avgLatency = result.summary.averageLatencyMs.toFixed(2);
      const minLatency = result.summary.minLatencyMs.toFixed(2);
      const maxLatency = result.summary.maxLatencyMs.toFixed(2);
      const score = result.summary.performanceScore.toFixed(2);
      csv += `${result.scenarioId},"${result.scenarioName}",${result.scenarioType},${result.summary.totalIterations},${result.summary.successfulIterations},${result.summary.failedIterations},${successRate},${avgLatency},${minLatency},${maxLatency},${score},${status}\n`;
    });

    expect(csv).toContain('Scenario ID,Scenario Name,Type');
    expect(csv).toContain('scenario-1,"Scenario 1",valid');
    expect(csv).toContain('scenario-2,"Scenario 2",invalid');
    expect(csv).toContain('100.00');
    expect(csv).toContain('50.00');
  });
});

describe('Drag Diagnostics Performance Metrics', () => {
  it('should calculate performance score correctly', () => {
    // Test case: good latency, good success rate, good consistency
    const latencyScore = Math.max(0, 100 - (25 / 50) * 100); // 50ms threshold, 25ms actual
    const successScore = 1.0 * 100; // 100% success rate
    const consistencyScore = 1.0 * 100; // 100% consistency
    const performanceScore = (latencyScore + successScore + consistencyScore) / 3;

    expect(latencyScore).toBe(50);
    expect(successScore).toBe(100);
    expect(consistencyScore).toBe(100);
    expect(performanceScore).toBe(83.33333333333333);
  });

  it('should detect threshold violations', () => {
    const thresholds = { maxLatencyMs: 50, minSuccessRate: 1.0 };
    const averageLatency = 75; // Above threshold
    const successRate = 0.8; // Below threshold
    
    const passedThresholds = averageLatency <= thresholds.maxLatencyMs && successRate >= thresholds.minSuccessRate;
    const thresholdViolations: string[] = [];
    
    if (averageLatency > thresholds.maxLatencyMs) {
      thresholdViolations.push(`Latency ${averageLatency.toFixed(2)}ms > ${thresholds.maxLatencyMs}ms`);
    }
    if (successRate < thresholds.minSuccessRate) {
      thresholdViolations.push(`Success rate ${(successRate * 100).toFixed(1)}% < ${(thresholds.minSuccessRate * 100).toFixed(1)}%`);
    }

    expect(passedThresholds).toBe(false);
    expect(thresholdViolations).toHaveLength(2);
    expect(thresholdViolations[0]).toContain('Latency 75.00ms > 50ms');
    expect(thresholdViolations[1]).toContain('Success rate 80.0% < 100.0%');
  });

  it('should generate latency chart data', () => {
    const results = [
      { scenarioName: 'Fast Scenario', summary: { averageLatencyMs: 15.5 } },
      { scenarioName: 'Medium Scenario', summary: { averageLatencyMs: 35.2 } },
      { scenarioName: 'Slow Scenario', summary: { averageLatencyMs: 60.8 } },
    ];

    const maxLatency = Math.max(...results.map(r => r.summary.averageLatencyMs));
    const chartWidth = 50;
    
    const chartData = results.map(result => ({
      name: result.scenarioName,
      barLength: Math.round((result.summary.averageLatencyMs / maxLatency) * chartWidth),
      value: result.summary.averageLatencyMs.toFixed(1),
    }));

    expect(chartData).toHaveLength(3);
    expect(chartData[0].barLength).toBe(Math.round((15.5 / 60.8) * 50)); // ~13
    expect(chartData[1].barLength).toBe(Math.round((35.2 / 60.8) * 50)); // ~29
    expect(chartData[2].barLength).toBe(Math.round((60.8 / 60.8) * 50)); // 50
    expect(chartData[0].value).toBe('15.5');
    expect(chartData[1].value).toBe('35.2');
    expect(chartData[2].value).toBe('60.8');
  });
});
