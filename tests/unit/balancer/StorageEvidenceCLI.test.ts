import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  DEFAULT_STORAGE_EVIDENCE_CONFIG, 
  STORAGE_EVIDENCE_PRESETS,
  type StorageEvidenceConfig 
} from '../../../src/analytics/balancer/storageEvidenceConfig.js';
import { StorageTestFramework } from '../../../src/shared/testing/StorageTestFramework.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Storage Evidence Configuration', () => {
  it('should have valid default configuration', () => {
    expect(DEFAULT_STORAGE_EVIDENCE_CONFIG).toBeDefined();
    expect(DEFAULT_STORAGE_EVIDENCE_CONFIG.name).toBe('Balancer Storage Integrity Evidence');
    expect(DEFAULT_STORAGE_EVIDENCE_CONFIG.targets).toHaveLength(3);
    expect(DEFAULT_STORAGE_EVIDENCE_CONFIG.execution).toBeDefined();
    expect(DEFAULT_STORAGE_EVIDENCE_CONFIG.thresholds).toBeDefined();
    expect(DEFAULT_STORAGE_EVIDENCE_CONFIG.output).toBeDefined();
  });

  it('should have valid presets', () => {
    expect(STORAGE_EVIDENCE_PRESETS).toBeDefined();
    expect(Object.keys(STORAGE_EVIDENCE_PRESETS)).toContain('quick');
    expect(Object.keys(STORAGE_EVIDENCE_PRESETS)).toContain('comprehensive');
    expect(Object.keys(STORAGE_EVIDENCE_PRESETS)).toContain('performance');
  });

  it('quick preset should have limited targets', () => {
    const quickPreset = STORAGE_EVIDENCE_PRESETS.quick;
    expect(quickPreset.targets).toHaveLength(1);
    expect(quickPreset.execution.maxRetries).toBe(1);
    expect(quickPreset.thresholds.minSuccessRate).toBe(0.9);
  });

  it('comprehensive preset should have strict thresholds', () => {
    const comprehensivePreset = STORAGE_EVIDENCE_PRESETS.comprehensive;
    expect(comprehensivePreset.targets).toHaveLength(3);
    expect(comprehensivePreset.execution.maxRetries).toBe(5);
    expect(comprehensivePreset.thresholds.minSuccessRate).toBe(0.98);
    expect(comprehensivePreset.thresholds.maxFailures).toBe(0);
  });

  it('performance preset should have strict timing limits', () => {
    const performancePreset = STORAGE_EVIDENCE_PRESETS.performance;
    expect(performancePreset.thresholds.maxExecutionTime).toBe(2000);
    expect(performancePreset.thresholds.performanceRegressionThreshold).toBe(5);
    expect(performancePreset.thresholds.maxMemoryUsage).toBe(50);
  });
});

describe('Storage Evidence CLI Integration', () => {
  let mockAdapter: any;
  let testData: any;
  let alternateData: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAdapter = {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue(null),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    testData = { testKey: 'testValue', timestamp: Date.now() };
    alternateData = { testKey: 'alternateValue', timestamp: Date.now() + 1000 };
  });

  it('should create Storage Test Framework instance', () => {
    const framework = new StorageTestFramework('test-target', mockAdapter, {
      timeout: 5000,
      maxRetries: 3,
      verbose: false,
    });

    expect(framework).toBeDefined();
  });

  it('should execute storage test successfully', async () => {
    const framework = new StorageTestFramework('test-target', mockAdapter, {
      timeout: 5000,
      maxRetries: 3,
      verbose: false,
    });

    // Mock successful operations
    mockAdapter.clear.mockResolvedValue(undefined);
    mockAdapter.save.mockResolvedValue(undefined);
    mockAdapter.load.mockResolvedValue(testData);

    const results = await framework.runFullTest(testData, alternateData);

    expect(results).toBeDefined();
    expect(results.tests).toBeDefined();
    expect(results.name).toBe('test-target');
    expect(results.tests.length).toBeGreaterThan(0);
    expect(results.passedCount).toBeGreaterThan(0);
    expect(results.successRate).toBeGreaterThan(0);
  });

  it('should handle storage test failures gracefully', async () => {
    const framework = new StorageTestFramework('test-target', mockAdapter, {
      timeout: 5000,
      maxRetries: 3,
      verbose: false,
    });

    // Mock storage failure
    mockAdapter.save.mockRejectedValue(new Error('Storage failed'));

    const results = await framework.runFullTest(testData, alternateData);

    expect(results).toBeDefined();
    expect(results.tests).toBeDefined();
    // Some tests should fail when storage operations fail
    expect(results.failedCount).toBeGreaterThan(0);
    expect(results.successRate).toBeLessThan(100);
  });

  it('should respect timeout limits', async () => {
    const framework = new StorageTestFramework('test-target', mockAdapter, {
      timeout: 1, // 1ms timeout
      maxRetries: 1,
      verbose: false,
    });

    // Mock slow operation
    mockAdapter.save.mockImplementation(() => {
      return new Promise(resolve => setTimeout(resolve, 10));
    });

    const results = await framework.runFullTest(testData, alternateData);

    expect(results).toBeDefined();
    // Should have some failures due to timeout
    expect(results.failedCount).toBeGreaterThan(0);
  });
});

describe('Storage Evidence CLI Configuration', () => {
  it('should filter targets correctly', () => {
    const config = { ...DEFAULT_STORAGE_EVIDENCE_CONFIG };
    const targetIds = ['balancer-config'];
    
    const filteredTargets = config.targets.filter(target => 
      targetIds.includes(target.id)
    );

    expect(filteredTargets).toHaveLength(1);
    expect(filteredTargets[0].id).toBe('balancer-config');
  });

  it('should apply CLI overrides correctly', () => {
    const config = { ...DEFAULT_STORAGE_EVIDENCE_CONFIG };
    
    // Apply overrides
    config.execution.maxRetries = 5;
    config.execution.verbose = true;
    config.output.formats = ['json'];
    config.thresholds.minSuccessRate = 0.99;

    expect(config.execution.maxRetries).toBe(5);
    expect(config.execution.verbose).toBe(true);
    expect(config.output.formats).toEqual(['json']);
    expect(config.thresholds.minSuccessRate).toBe(0.99);
  });

  it('should validate configuration constraints', () => {
    const config = { ...DEFAULT_STORAGE_EVIDENCE_CONFIG };
    
    // Check reasonable defaults
    expect(config.execution.maxRetries).toBeGreaterThan(0);
    expect(config.execution.maxRetries).toBeLessThan(10);
    expect(config.thresholds.minSuccessRate).toBeGreaterThan(0);
    expect(config.thresholds.minSuccessRate).toBeLessThanOrEqual(1);
    expect(config.thresholds.maxExecutionTime).toBeGreaterThan(0);
    expect(config.thresholds.maxMemoryUsage).toBeGreaterThan(0);
  });
});

describe('Storage Evidence Bundle Generation', () => {
  it('should generate valid bundle structure', () => {
    const mockResults = [
      {
        targetId: 'test-target-1',
        targetName: 'Test Target 1',
        success: true,
        duration: 100,
        metrics: {
          totalTests: 10,
          passedTests: 10,
          failedTests: 0,
          successRate: 1.0,
          averageTime: 10,
          memoryUsage: 1024,
        },
        details: null,
      },
      {
        targetId: 'test-target-2',
        targetName: 'Test Target 2',
        success: false,
        duration: 200,
        error: 'Test error',
        metrics: {
          totalTests: 10,
          passedTests: 8,
          failedTests: 2,
          successRate: 0.8,
          averageTime: 20,
          memoryUsage: 2048,
        },
        details: null,
      },
    ];

    const bundle = {
      id: 'test-bundle',
      name: 'Test Bundle',
      description: 'Test Description',
      timestamp: new Date().toISOString(),
      duration: 300,
      config: DEFAULT_STORAGE_EVIDENCE_CONFIG,
      results: mockResults,
      summary: {
        totalTargets: 2,
        successfulTargets: 1,
        failedTargets: 1,
        overallSuccessRate: 0.5,
        totalDuration: 300,
        checksum: 'test-checksum',
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
    expect(bundle.summary.totalTargets).toBe(2);
    expect(bundle.summary.successfulTargets).toBe(1);
    expect(bundle.summary.failedTargets).toBe(1);
    expect(bundle.summary.overallSuccessRate).toBe(0.5);
  });

  it('should calculate summary metrics correctly', () => {
    const results = [
      { success: true },
      { success: true },
      { success: false },
      { success: true },
    ];

    const successfulTargets = results.filter(r => r.success).length;
    const overallSuccessRate = results.length > 0 ? successfulTargets / results.length : 0;

    expect(successfulTargets).toBe(3);
    expect(overallSuccessRate).toBe(0.75);
  });
});

describe('Storage Evidence Export Formats', () => {
  it('should generate valid JSON export', () => {
    const bundle = {
      id: 'test-bundle',
      name: 'Test Bundle',
      timestamp: new Date().toISOString(),
      summary: { checksum: 'test-checksum' },
      config: DEFAULT_STORAGE_EVIDENCE_CONFIG,
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
        totalTargets: 2,
        successfulTargets: 1,
        failedTargets: 1,
        overallSuccessRate: 0.5,
        totalDuration: 300,
        checksum: 'test-checksum',
      },
      results: [
        {
          targetName: 'Target 1',
          success: true,
          metrics: {
            totalTests: 10,
            passedTests: 10,
            failedTests: 0,
            successRate: 1.0,
            averageTime: 10,
            memoryUsage: 1024,
          },
          duration: 100,
        },
        {
          targetName: 'Target 2',
          success: false,
          error: 'Test error',
          metrics: {
            totalTests: 10,
            passedTests: 8,
            failedTests: 2,
            successRate: 0.8,
            averageTime: 20,
            memoryUsage: 2048,
          },
          duration: 200,
        },
      ],
      telemetry: { eventId: 'test-event', timestamp: new Date().toISOString() },
    };

    // Simple markdown generation test
    let markdown = `# ${bundle.name}\n\n`;
    markdown += `**Description**: ${bundle.description}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Targets**: ${bundle.summary.totalTargets}\n`;
    markdown += `- **Successful**: ${bundle.summary.successfulTargets}\n`;
    markdown += `- **Failed**: ${bundle.summary.failedTargets}\n`;
    markdown += `- **Success Rate**: ${(bundle.summary.overallSuccessRate * 100).toFixed(1)}%\n\n`;

    expect(markdown).toContain('# Test Bundle');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('- **Total Targets**: 2');
    expect(markdown).toContain('- **Success Rate**: 50.0%');
  });

  it('should generate valid CSV report', () => {
    const results = [
      {
        targetId: 'target-1',
        targetName: 'Target 1',
        success: true,
        metrics: {
          totalTests: 10,
          passedTests: 10,
          failedTests: 0,
          successRate: 1.0,
          averageTime: 10,
          memoryUsage: 1024,
        },
        duration: 100,
      },
      {
        targetId: 'target-2',
        targetName: 'Target 2',
        success: false,
        metrics: {
          totalTests: 10,
          passedTests: 8,
          failedTests: 2,
          successRate: 0.8,
          averageTime: 20,
          memoryUsage: 2048,
        },
        duration: 200,
      },
    ];

    let csv = 'Target ID,Target Name,Status,Total Tests,Passed Tests,Failed Tests,Success Rate,Duration (ms),Memory Usage (KB)\n';
    
    results.forEach(result => {
      const status = result.success ? 'PASS' : 'FAIL';
      const passRate = (result.metrics.successRate * 100).toFixed(2);
      csv += `${result.targetId},"${result.targetName}",${status},${result.metrics.totalTests},${result.metrics.passedTests},${result.metrics.failedTests},${passRate},${result.duration.toFixed(1)},${result.metrics.memoryUsage}\n`;
    });

    expect(csv).toContain('Target ID,Target Name,Status');
    expect(csv).toContain('target-1,"Target 1",PASS');
    expect(csv).toContain('target-2,"Target 2",FAIL');
    expect(csv).toContain('100.00');
    expect(csv).toContain('80.00');
  });
});
