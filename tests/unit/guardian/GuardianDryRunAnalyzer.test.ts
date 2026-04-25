/**
 * Guardian Dry Run Analyzer Tests - NP-041
 * 
 * Unit tests for the Guardian Dry Run Analyzer functionality.
 * Tests log parsing, synthetic scenarios, ASCII dashboard generation,
 * and CLI commands.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GuardianDryRunAnalyzer, type DryRunConfig, type DryRunSimulation } from '../../../src/analytics/guardian/GuardianDryRunAnalyzer';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('path');

// Mock data
const mockLogContent = `[12:34:56] 🛡️ Avvio Auto-Commit Guardian (stage=commit)...
[12:34:57] npm run lint (2000ms)
[12:34:59] npm run test (5000ms)
[12:35:04] npm run build:check (3000ms)
[12:35:07] npm run kanban:lint (1000ms)
[12:35:08] npm run deploy:vercel:verify (2000ms)
[12:35:10] 🛡️ Guardian completato per stage commit.
[12:35:10] ✅ All diagnostics passed successfully.`;

const mockLogContentWithFailure = `[12:34:56] 🛡️ Avvio Auto-Commit Guardian (stage=commit)...
[12:34:57] npm run lint (2000ms)
[12:34:59] ❌ npm run test failed
[12:35:00] error: Test suite failed
[12:35:00] 🛡️ Guardian terminato: diagnosi non superata.`;

const mockSyntheticScenarios = [
  {
    name: 'Test Success',
    description: 'Test scenario for success',
    stage: 'commit',
    branch: 'main',
    diagnostics: [
      {
        label: 'npm run lint',
        command: 'npm',
        args: ['run', 'lint'],
        exitCode: 0,
        stdout: 'All files pass linting',
        stderr: '',
        duration: 1000,
      },
    ],
    expectedOutcome: 'success',
  },
  {
    name: 'Test Failure',
    description: 'Test scenario for failure',
    stage: 'push',
    branch: 'main',
    diagnostics: [
      {
        label: 'npm run test',
        command: 'npm',
        args: ['run', 'test'],
        exitCode: 1,
        stdout: '',
        stderr: 'Test failed',
        duration: 2000,
      },
    ],
    expectedOutcome: 'failure',
  },
];

describe('GuardianDryRunAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readdir).mockResolvedValue(['20230119-123456-commit-main.log', '20230119-124567-push-main.log']);
    vi.mocked(readFile).mockResolvedValue(mockLogContent);
    vi.mocked(stat).mockResolvedValue({
      size: 1024,
      mtime: new Date('2023-01-19T12:34:56.000Z'),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeDryRun', () => {
    it('should analyze dry run with default configuration', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.simulationType).toBe('synthetic'); // No time range specified
      expect(result.result).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include synthetic scenarios when requested', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        includeSynthetic: true,
        syntheticScenarios: mockSyntheticScenarios,
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      expect(result.simulationType).toBe('synthetic');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should filter by time range', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        timeRange: {
          start: '2023-01-01',
          end: '2023-01-31',
        },
        syntheticScenarios: [],
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      expect(result.simulationType).toBe('historical');
    });

    it('should filter by branch', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        branch: 'main',
        syntheticScenarios: [],
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      expect(result.result.branch).toBe('main');
    });

    it('should filter by stage', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        stage: 'commit',
        syntheticScenarios: [],
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      expect(result.result.stage).toBe('commit');
    });
  });

  describe('generateASCIIDashboard', () => {
    it('should generate ASCII dashboard with proper structure', () => {
      const simulation: DryRunSimulation = {
        sessionId: 'test-session',
        timestamp: '2023-01-19T12:34:56.000Z',
        simulationType: 'synthetic',
        config: {
          outputFormat: 'ascii',
          verbose: false,
          syntheticScenarios: [],
        },
        result: {
          sessionId: 'test-session',
          startTime: '2023-01-19T12:34:56.000Z',
          endTime: '2023-01-19T12:35:10.000Z',
          duration: 14000,
          stage: 'commit',
          status: 'success',
          entries: [],
          diagnostics: [],
          branch: 'main',
          summary: {
            totalDiagnostics: 5,
            successfulDiagnostics: 5,
            failedDiagnostics: 0,
            totalDuration: 14000,
            averageDiagnosticDuration: 2800,
          },
          issues: [],
        },
        recommendations: ['✅ No issues detected - system operating normally'],
      };

      const dashboard = GuardianDryRunAnalyzer.generateASCIIDashboard(simulation);

      expect(dashboard).toContain('GUARDIAN AUTOPUSH DRY-RUN ANALYZER');
      expect(dashboard).toContain('SESSION INFORMATION');
      expect(dashboard).toContain('SUMMARY METRICS');
      expect(dashboard).toContain('RECOMMENDATIONS');
      expect(dashboard).toContain('test-session');
      expect(dashboard).toContain('SUCCESS');
      expect(dashboard).toContain('main');
      expect(dashboard).toContain('14s');
    });

    it('should include issues when present', () => {
      const simulation: DryRunSimulation = {
        sessionId: 'test-session',
        timestamp: '2023-01-19T12:34:56.000Z',
        simulationType: 'synthetic',
        config: {
          outputFormat: 'ascii',
          verbose: true,
          syntheticScenarios: [],
        },
        result: {
          sessionId: 'test-session',
          startTime: '2023-01-19T12:34:56.000Z',
          endTime: '2023-01-19T12:35:10.000Z',
          duration: 14000,
          stage: 'commit',
          status: 'failed',
          entries: [],
          diagnostics: [],
          branch: 'main',
          summary: {
            totalDiagnostics: 5,
            successfulDiagnostics: 3,
            failedDiagnostics: 2,
            totalDuration: 14000,
            averageDiagnosticDuration: 2800,
          },
          issues: [
            {
              type: 'diagnostic_failure',
              severity: 'medium',
              stage: 'commit',
              message: 'Diagnostic failed: npm run test',
              diagnostic: 'npm run test',
              suggestion: 'Fix failing tests and retry',
              timestamp: '2023-01-19T12:34:58.000Z',
            },
          ],
        },
        recommendations: ['🔍 Fix failing diagnostics before retrying'],
      };

      const dashboard = GuardianDryRunAnalyzer.generateASCIIDashboard(simulation);

      expect(dashboard).toContain('DETECTED ISSUES');
      expect(dashboard).toContain('DIAGNOSTIC_FAILURE');
      expect(dashboard).toContain('Diagnostic failed: npm run test');
      expect(dashboard).toContain('Fix failing tests and retry');
    });
  });

  describe('exportToJSON', () => {
    it('should export simulation to JSON format', () => {
      const simulation: DryRunSimulation = {
        sessionId: 'test-session',
        timestamp: '2023-01-19T12:34:56.000Z',
        simulationType: 'synthetic',
        config: {
          outputFormat: 'ascii',
          verbose: false,
          syntheticScenarios: [],
        },
        result: {
          sessionId: 'test-session',
          startTime: '2023-01-19T12:34:56.000Z',
          endTime: '2023-01-19T12:35:10.000Z',
          duration: 14000,
          stage: 'commit',
          status: 'success',
          entries: [],
          diagnostics: [],
          branch: 'main',
          summary: {
            totalDiagnostics: 5,
            successfulDiagnostics: 5,
            failedDiagnostics: 0,
            totalDuration: 14000,
            averageDiagnosticDuration: 2800,
          },
          issues: [],
        },
        recommendations: ['✅ No issues detected - system operating normally'],
      };

      const json = GuardianDryRunAnalyzer.exportToJSON(simulation);
      const parsed = JSON.parse(json);

      expect(parsed.sessionId).toBe('test-session');
      expect(parsed.timestamp).toBe('2023-01-19T12:34:56.000Z');
      expect(parsed.simulationType).toBe('synthetic');
      expect(parsed.result.status).toBe('success');
      expect(parsed.result.branch).toBe('main');
      expect(parsed.result.duration).toBe(14000);
    });
  });

  describe('exportToMarkdown', () => {
    it('should export simulation to Markdown format', () => {
      const simulation: DryRunSimulation = {
        sessionId: 'test-session',
        timestamp: '2023-01-19T12:34:56.000Z',
        simulationType: 'synthetic',
        config: {
          outputFormat: 'ascii',
          verbose: false,
          syntheticScenarios: [],
        },
        result: {
          sessionId: 'test-session',
          startTime: '2023-01-19T12:34:56.000Z',
          endTime: '2023-01-19T12:35:10.000Z',
          duration: 14000,
          stage: 'commit',
          status: 'success',
          entries: [],
          diagnostics: [],
          branch: 'main',
          summary: {
            totalDiagnostics: 5,
            successfulDiagnostics: 5,
            failedDiagnostics: 0,
            totalDuration: 14000,
            averageDiagnosticDuration: 2800,
          },
          issues: [],
        },
        recommendations: ['✅ No issues detected - system operating normally'],
      };

      const markdown = GuardianDryRunAnalyzer.exportToMarkdown(simulation);

      expect(markdown).toContain('# Guardian Autopush Dry-Run Analysis');
      expect(markdown).toContain('**Session ID:** test-session');
      expect(markdown).toContain('**Status:** success');
      expect(markdown).toContain('## Session Information');
      expect(markdown).toContain('## Summary Metrics');
      expect(markdown).toContain('## Recommendations');
      expect(markdown).toContain('- **Stage:** commit');
      expect(markdown).toContain('- **Branch:** main');
      expect(markdown).toContain('- **Duration:** 14s');
    });
  });

  describe('Synthetic Scenarios', () => {
    it('should generate synthetic sessions correctly', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        includeSynthetic: true,
        syntheticScenarios: mockSyntheticScenarios,
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      expect(result.simulationType).toBe('synthetic');
      expect(result.result.status).toBe('success'); // Should pick the successful scenario
      expect(result.result.sessionId).toContain('synthetic-');
      expect(result.result.stage).toBe('commit'); // Should pick the commit scenario
    });

    it('should handle failure scenarios', async () => {
      const failureOnlyScenarios = [mockSyntheticScenarios[1]]; // Only the failure scenario

      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        includeSynthetic: true,
        syntheticScenarios: failureOnlyScenarios,
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      expect(result.result.status).toBe('failed');
      expect(result.result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Log Parsing', () => {
    it('should parse successful commit log', async () => {
      const mockFiles = ['20230119-123456-commit-main.log'];
      vi.mocked(readdir).mockResolvedValue(mockFiles);
      vi.mocked(readFile).mockResolvedValue(mockLogContent);

      const sessions = await GuardianDryRunAnalyzer['loadHistoricalSessions']({
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe('success');
      expect(sessions[0].stage).toBe('commit');
      expect(sessions[0].branch).toBe('main');
      expect(sessions[0].summary.totalDiagnostics).toBe(5);
      expect(sessions[0].summary.successfulDiagnostics).toBe(5);
      expect(sessions[0].summary.failedDiagnostics).toBe(0);
    });

    it('should parse failed commit log', async () => {
      const mockFiles = ['20230119-123456-commit-main.log'];
      vi.mocked(readdir).mockResolvedValue(mockFiles);
      vi.mocked(readFile).mockResolvedValue(mockLogContentWithFailure);

      const sessions = await GuardianDryRunAnalyzer['loadHistoricalSessions']({
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe('failed');
      expect(sessions[0].stage).toBe('commit');
      expect(sessions[0].issues.length).toBeGreaterThan(0);
      expect(sessions[0].issues[0].type).toBe('diagnostic_failure');
    });

    it('should handle empty log directory', async () => {
      vi.mocked(readdir).mockResolvedValue([]);

      const sessions = await GuardianDryRunAnalyzer['loadHistoricalSessions']({
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      });

      expect(sessions).toHaveLength(0);
    });

    it('should handle parse errors gracefully', async () => {
      const mockFiles = ['20230119-123456-commit-main.log'];
      vi.mocked(readdir).mockResolvedValue(mockFiles);
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

      const sessions = await GuardianDryRunAnalyzer['loadHistoricalSessions']({
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      });

      expect(sessions).toHaveLength(0);
    });
  });

  describe('Issue Detection', () => {
    it('should detect diagnostic failures', () => {
      const entries = [
        {
          timestamp: '2023-01-19T12:34:58.000Z',
          stage: 'commit',
          status: 'failed',
          message: 'Diagnostic failed',
          diagnostics: [
            {
              label: 'npm run test',
              command: 'npm',
              args: ['run', 'test'],
              exitCode: 1,
              stdout: '',
              stderr: 'Test failed',
              duration: 2000,
              success: false,
            },
          ],
          branch: 'main',
        },
      ];

      const issues = GuardianDryRunAnalyzer['detectIssues'](entries);

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('diagnostic_failure');
      expect(issues[0].severity).toBe('high');
      expect(issues[0].stage).toBe('commit');
      expect(issues[0].message).toContain('npm run test');
    });

    it('should detect timeouts', () => {
      const entries = [
        {
          timestamp: '2023-01-19T12:34:58.000Z',
          stage: 'commit',
          status: 'completed',
          message: 'Operation completed',
          diagnostics: [],
          branch: 'main',
          duration: 45000, // 45 seconds
        },
      ];

      const issues = GuardianDryRunAnalyzer['detectIssues'](entries);

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('timeout');
      expect(issues[0].severity).toBe('medium');
      expect(issues[0].message).toContain('45000ms');
    });

    it('should detect script errors', () => {
      const entries = [
        {
          timestamp: '2023-01-19T12:34:58.000Z',
          stage: 'commit',
          status: 'failed',
          message: 'Script error occurred',
          diagnostics: [],
          branch: 'main',
          error: 'Permission denied',
        },
      ];

      const issues = GuardianDryRunAnalyzer['detectIssues'](entries);

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('script_error');
      expect(issues[0].severity).toBe('high');
      expect(issues[0].message).toContain('Permission denied');
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations for failed sessions', () => {
      const analysis = {
        sessionId: 'test-session',
        startTime: '2023-01-19T12:34:56.000Z',
        endTime: '2023-01-19T12:35:10.000Z',
        duration: 14000,
        stage: 'commit',
        status: 'failed',
        entries: [],
        diagnostics: [],
        branch: 'main',
        summary: {
          totalDiagnostics: 5,
          successfulDiagnostics: 3,
          failedDiagnostics: 2,
          totalDuration: 14000,
          averageDiagnosticDuration: 2800,
        },
        issues: [
          {
            type: 'diagnostic_failure',
            severity: 'medium',
            stage: 'commit',
            message: 'Diagnostic failed: npm run test',
            diagnostic: 'npm run test',
            suggestion: 'Fix failing tests and retry',
            timestamp: '2023-01-19T12:34:58.000Z',
          },
        ],
      };

      const recommendations = GuardianDryRunAnalyzer['generateRecommendations'](analysis, {
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      });

      expect(recommendations).toContain('🔍 Fix failing diagnostics before retrying');
      expect(recommendations).toContain('📋 Review commit stage configuration');
      expect(recommendations).toContain('🛠️ Fix 2 failing diagnostics');
    });

    it('should generate performance recommendations for slow operations', () => {
      const analysis = {
        sessionId: 'test-session',
        startTime: '2023-01-19T12:34:56.000Z',
        endTime: '2023-01-19T12:35:10.000Z',
        duration: 120000, // 2 minutes
        stage: 'commit',
        status: 'success',
        entries: [],
        diagnostics: [],
        branch: 'main',
        summary: {
          totalDiagnostics: 5,
          successfulDiagnostics: 5,
          failedDiagnostics: 0,
          totalDuration: 120000,
          averageDiagnosticDuration: 24000, // 24 seconds
        },
        issues: [],
      };

      const recommendations = GuardianDryRunAnalyzer['generateRecommendations'](analysis, {
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      });

      expect(recommendations).toContain('⏱️ Optimize slow operations to reduce duration');
      expect(recommendations).toContain('⚡ Investigate slow diagnostic operations');
    });

    it('should generate success message for healthy sessions', () => {
      const analysis = {
        sessionId: 'test-session',
        startTime: '2023-01-19T12:34:56.000Z',
        endTime: '2023-01-19T12:35:10.000Z',
        duration: 14000,
        stage: 'commit',
        status: 'success',
        entries: [],
        diagnostics: [],
        branch: 'main',
        summary: {
          totalDiagnostics: 5,
          successfulDiagnostics: 5,
          failedDiagnostics: 0,
          totalDuration: 14000,
          averageDiagnosticDuration: 2800,
        },
        issues: [],
      };

      const recommendations = GuardianDryRunAnalyzer['generateRecommendations'](analysis, {
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toContain('✅ No issues detected - system operating normally');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing sessions gracefully', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: false,
        syntheticScenarios: [],
      };

      // Mock empty sessions
      vi.mocked(GuardianDryRunAnalyzer['loadHistoricalSessions']).mockResolvedValue([]);
      vi.mocked(GuardianDryRunAnalyzer['generateSyntheticSessions']).mockResolvedValue([]);

      await expect(GuardianDryRunAnalyzer.analyzeDryRun(config)).rejects.toThrow('No sessions found matching criteria');
    });

    it('should handle invalid configuration', async () => {
      const invalidConfig = {
        outputFormat: 'invalid' as any,
        verbose: false,
        syntheticScenarios: [],
      };

      await expect(GuardianDryRunAnalyzer.analyzeDryRun(invalidConfig)).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full analysis workflow', async () => {
      const config: DryRunConfig = {
        outputFormat: 'ascii',
        verbose: true,
        includeSynthetic: true,
        syntheticScenarios: mockSyntheticScenarios,
      };

      const result = await GuardianDryRunAnalyzer.analyzeDryRun(config);

      // Verify analysis structure
      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.simulationType).toBe('synthetic');
      expect(result.config).toEqual(config);
      expect(result.result).toBeDefined();
      expect(result.recommendations).toBeDefined();

      // Verify result structure
      expect(result.result.sessionId).toBeDefined();
      expect(result.result.stage).toBeDefined();
      expect(result.result.status).toBeDefined();
      expect(result.result.branch).toBeDefined();
      expect(result.result.summary).toBeDefined();
      expect(result.result.issues).toBeDefined();
      expect(result.result.entries).toBeDefined();
      expect(result.result.diagnostics).toBeDefined();

      // Verify recommendations
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Test different output formats
      const ascii = GuardianDryRunAnalyzer.generateASCIIDashboard(result);
      const json = GuardianDryRunAnalyzer.exportToJSON(result);
      const markdown = GuardianDryRunAnalyzer.exportToMarkdown(result);

      expect(ascii).toContain('GUARDIAN AUTOPUSH DRY-RUN ANALYZER');
      expect(json).toContain('"sessionId"');
      expect(markdown).toContain('# Guardian Autopush Dry-Run Analysis');

      // Parse JSON to verify it's valid
      const parsedJson = JSON.parse(json);
      expect(parsedJson.sessionId).toBe(result.sessionId);
      expect(parsedJson.result.status).toBe(result.result.status);
    });
  });
});
