import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafeguardMonitor, SafeguardReport, SafeguardCheckResult } from '../../../scripts/coordinator/safeguardMonitor';

// Mock the Evidence Log Harvester
vi.mock('../../../src/docs/coordinator/evidenceLogHarvester', () => ({
  EvidenceLogHarvester: {
    harvest: vi.fn(),
  },
}));

// Mock fs and path modules
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    writeFileSync: vi.fn(),
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
  };
});

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

describe('SafeguardMonitor', () => {
  let monitor: SafeguardMonitor;
  let mockHarvest: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    monitor = new SafeguardMonitor();
    // Get the mocked harvest function from the mock
    const mockModule = vi.mocked(await import('../../../src/docs/coordinator/evidenceLogHarvester'));
    mockHarvest = mockModule.EvidenceLogHarvester.harvest;
  });

  describe('run', () => {
    it('should process evidence logs and generate report', async () => {
      // Mock harvest results
      const mockHarvestResults = {
        totalScanned: 10,
        processed: 5,
        filtered: 5,
        errors: [],
        entries: [
          {
            path: '/test/np-099-evidence.log',
            name: 'np-099-evidence.log',
            extension: '.log',
            size: 1024,
            modifiedAt: Date.now(),
            taskId: 'NP-099',
            date: '2026-01-13',
            type: 'evidence' as const,
            preview: 'SUCCESS: lint test build kanban',
            metadata: {
              checks: {
                lint: { status: 'success', timestamp: Date.now() },
                test: { status: 'success', timestamp: Date.now() },
                build: { status: 'success', timestamp: Date.now() },
                kanban: { status: 'success', timestamp: Date.now() },
              },
            },
          },
          {
            path: '/test/ks-081-evidence.log',
            name: 'ks-081-evidence.log',
            extension: '.log',
            size: 2048,
            modifiedAt: Date.now(),
            taskId: 'KS-081',
            date: '2026-01-13',
            type: 'evidence' as const,
            preview: 'FAILED: lint',
            metadata: {
              checks: {
                lint: { status: 'failed', timestamp: Date.now(), error: 'Syntax error' },
                test: { status: 'success', timestamp: Date.now() },
                build: { status: 'success', timestamp: Date.now() },
                kanban: { status: 'success', timestamp: Date.now() },
              },
            },
          },
        ],
        summary: {
          byType: { evidence: 5 },
          byExtension: { '.log': 5 },
          byTask: { 'NP-099': 1, 'KS-081': 1 },
          dateRange: { earliest: Date.now() - 86400000, latest: Date.now() },
        },
      };

      mockHarvest.mockResolvedValue(mockHarvestResults);

      const report = await monitor.run();

      expect(report).toBeDefined();
      expect(report.summary.totalPrompts).toBe(2);
      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(1);
      expect(report.results).toHaveLength(2);

      // Check NP-099 result (should pass)
      const np099Result = report.results.find(r => r.promptId === 'NP-099');
      expect(np099Result).toBeDefined();
      expect(np099Result!.status).toBe('pass');
      expect(np099Result!.severity).toBe(0);

      // Check KS-081 result (should fail)
      const ks081Result = report.results.find(r => r.promptId === 'KS-081');
      expect(ks081Result).toBeDefined();
      expect(ks081Result!.status).toBe('fail');
      expect(ks081Result!.severity).toBe(25); // 25 for failed lint
    });

    it('should handle empty evidence logs', async () => {
      const mockHarvestResults = {
        totalScanned: 0,
        processed: 0,
        filtered: 0,
        errors: [],
        entries: [],
        summary: {
          byType: {},
          byExtension: {},
          byTask: {},
          dateRange: { earliest: null, latest: null },
        },
      };

      mockHarvest.mockResolvedValue(mockHarvestResults);

      const report = await monitor.run();

      expect(report.summary.totalPrompts).toBe(0);
      expect(report.results).toHaveLength(0);
    });

    it('should handle harvest errors', async () => {
      mockHarvest.mockRejectedValue(new Error('Harvest failed'));

      await expect(monitor.run()).rejects.toThrow('Harvest failed');
    });
  });

  describe('severity calculation', () => {
    it('should calculate severity correctly for different failure combinations', async () => {
      const mockHarvestResults = {
        totalScanned: 1,
        processed: 1,
        filtered: 0,
        errors: [],
        entries: [
          {
            path: '/test/multi-failure.log',
            name: 'multi-failure.log',
            extension: '.log',
            size: 1024,
            modifiedAt: Date.now(),
            taskId: 'TEST-001',
            date: '2026-01-13',
            type: 'evidence' as const,
            preview: 'FAILED: lint test',
            metadata: {
              checks: {
                lint: { status: 'failed', timestamp: Date.now() },
                test: { status: 'failed', timestamp: Date.now() },
                build: { status: 'warning', timestamp: Date.now() },
                kanban: { status: 'success', timestamp: Date.now() },
              },
            },
          },
        ],
        summary: {
          byType: { evidence: 1 },
          byExtension: { '.log': 1 },
          byTask: { 'TEST-001': 1 },
          dateRange: { earliest: Date.now(), latest: Date.now() },
        },
      };

      mockHarvest.mockResolvedValue(mockHarvestResults);

      const report = await monitor.run();
      const result = report.results[0];

      // 2 failures (25 each) + 1 warning (10) = 60 severity
      expect(result.severity).toBe(60);
      expect(result.status).toBe('fail');
    });
  });

  describe('CSV export', () => {
    it('should generate valid CSV format', async () => {
      const mockReport: SafeguardReport = {
        generatedAt: Date.now(),
        version: '1.0.0',
        summary: {
          totalPrompts: 1,
          passed: 0,
          failed: 1,
          warnings: 0,
          unknown: 0,
          averageSeverity: 50,
          worstSeverity: 50,
        },
        results: [
          {
            promptId: 'TEST-001',
            title: 'Test Prompt',
            status: 'fail',
            checks: {
              lint: { status: 'fail', timestamp: Date.now(), error: 'Syntax error' },
              test: { status: 'pass', timestamp: Date.now() },
              build: { status: 'pass', timestamp: Date.now() },
              kanban: { status: 'pass', timestamp: Date.now() },
            },
            lastEvidence: Date.now(),
            evidencePath: '/test/evidence.log',
            severity: 50,
            issues: ['lint failed: Syntax error'],
            metadata: {},
          },
        ],
        globalIssues: ['1 prompts failed safeguard checks'],
        period: {
          start: Date.now() - 86400000,
          end: Date.now(),
        },
      };

      // Access private method for testing
      const csvMethod = monitor as any;
      const csv = csvMethod.reportToCsv(mockReport);

      expect(csv).toContain('promptId,title,status,lint_status,lint_duration');
      expect(csv).toContain('TEST-001,"Test Prompt",fail,fail,');
      expect(csv).toContain('lint failed: Syntax error');
    });
  });

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        evidenceDirs: ['/custom/path'],
        promptIds: ['NP-099'],
        severityThresholds: {
          warning: 20,
          critical: 60,
        },
        outputFormat: 'json' as const,
      };

      const customMonitor = new SafeguardMonitor(customConfig);
      expect(customMonitor).toBeDefined();
    });
  });
});

describe('SafeguardMonitor CLI', () => {
  it('should have proper CLI structure', () => {
    // This test verifies the CLI structure exists
    // Actual CLI testing would require different setup
    expect(SafeguardMonitor).toBeDefined();
  });
});
