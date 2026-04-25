/**
 * Telemetry Evidence Aggregator - Unit Tests
 *
 * Test suite for the NP-025 Telemetry Evidence Aggregator CLI script.
 * Covers command execution, output parsing, evidence collection, and report generation.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { TelemetryEvidenceAggregator, type TelemetryEvidence, type AggregatedEvidence, type AggregatorConfig } from '../../../scripts/telemetry/TelemetryEvidenceAggregator';

// Mock child_process
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

// Mock fs
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

const mockSpawn = spawn as Mock<typeof spawn>;
const mockExistsSync = existsSync as Mock<typeof existsSync>;
const mockMkdirSync = mkdirSync as Mock<typeof mkdirSync>;
const mockWriteFileSync = writeFileSync as Mock<typeof writeFileSync>;
const mockReadFileSync = readFileSync as Mock<typeof readFileSync>;

describe('TelemetryEvidenceAggregator', () => {
  let aggregator: TelemetryEvidenceAggregator;
  let mockConfig: Partial<AggregatorConfig>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConfig = {
      workingDirectory: '/test/project',
      outputDirectory: '/test/output',
      commands: {
        lint: ['npm', 'run', 'lint'],
        test: ['npm', 'run', 'test'],
        build: ['npm', 'run', 'build:check'],
        kanban: ['npm', 'run', 'kanban:lint'],
      },
      thresholds: {
        maxDuration: 300000,
        maxErrors: 10,
        maxWarnings: 50,
      },
      output: {
        format: 'both',
        includeRawOutput: true,
        includeAnalysis: true,
      },
    };

    // Mock directory existence
    mockExistsSync.mockReturnValue(true);
    mockMkdirSync.mockImplementation();

    aggregator = new TelemetryEvidenceAggregator(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultAggregator = new TelemetryEvidenceAggregator();
      const config = defaultAggregator.getConfig();
      
      expect(config.workingDirectory).toBe(process.cwd());
      expect(config.outputDirectory).toContain('test-results/telemetry');
      expect(config.commands.lint).toEqual(['npm', 'run', 'lint']);
      expect(config.commands.test).toEqual(['npm', 'run', 'test']);
      expect(config.commands.build).toEqual(['npm', 'run', 'build:check']);
      expect(config.commands.kanban).toEqual(['npm', 'run', 'kanban:lint']);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        workingDirectory: '/custom/path',
        outputDirectory: '/custom/output',
        commands: {
          lint: ['yarn', 'lint'],
          test: ['yarn', 'test'],
          build: ['yarn', 'build'],
          kanban: ['yarn', 'kanban'],
        },
      };

      const customAggregator = new TelemetryEvidenceAggregator(customConfig);
      const config = customAggregator.getConfig();
      
      expect(config.workingDirectory).toBe('/custom/path');
      expect(config.outputDirectory).toBe('/custom/output');
      expect(config.commands.lint).toEqual(['yarn', 'lint']);
    });

    it('should create output directory if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      
      new TelemetryEvidenceAggregator(mockConfig);
      
      expect(mockMkdirSync).toHaveBeenCalledWith('/test/output', { recursive: true });
    });
  });

  describe('Session ID Generation', () => {
    it('should generate unique session IDs', () => {
      const aggregator1 = new TelemetryEvidenceAggregator(mockConfig);
      const aggregator2 = new TelemetryEvidenceAggregator(mockConfig);
      
      const sessionId1 = aggregator1.getSessionId();
      const sessionId2 = aggregator2.getSessionId();
      
      expect(sessionId1).toMatch(/^telemetry-\d+-[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^telemetry-\d+-[a-z0-9]+$/);
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Command Execution', () => {
    it('should execute commands successfully', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn(),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      // Mock stdout data
      let stdoutCallback: ((data: Buffer) => void) | null = null;
      let stderrCallback: ((data: Buffer) => void) | null = null;
      let closeCallback: ((code: number | null) => void) | null = null;

      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') stdoutCallback = callback;
      });

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') stderrCallback = callback;
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') closeCallback = callback;
      });

      // Simulate command execution
      setTimeout(() => {
        stdoutCallback?.(Buffer.from('Command output'));
        stderrCallback?.(Buffer.from(''));
        closeCallback?.(0);
      }, 10);

      const evidence = await aggregator.executeCommand('lint', ['npm', 'run', 'lint']);

      expect(evidence.type).toBe('lint');
      expect(evidence.command).toBe('npm run lint');
      expect(evidence.exitCode).toBe(0);
      expect(evidence.stdout).toBe('Command output');
      expect(evidence.stderr).toBe('');
      expect(evidence.duration).toBeGreaterThan(0);
      expect(evidence.metadata.workingDirectory).toBe('/test/project');
    });

    it('should handle command errors', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn(),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      let stdoutCallback: ((data: Buffer) => void) | null = null;
      let stderrCallback: ((data: Buffer) => void) | null = null;
      let closeCallback: ((code: number | null) => void) | null = null;

      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') stdoutCallback = callback;
      });

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') stderrCallback = callback;
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') closeCallback = callback;
      });

      // Simulate command failure
      setTimeout(() => {
        stdoutCallback?.(Buffer.from(''));
        stderrCallback?.(Buffer.from('Error message'));
        closeCallback?.(1);
      }, 10);

      const evidence = await aggregator.executeCommand('test', ['npm', 'run', 'test']);

      expect(evidence.type).toBe('test');
      expect(evidence.command).toBe('npm run test');
      expect(evidence.exitCode).toBe(1);
      expect(evidence.stdout).toBe('');
      expect(evidence.stderr).toBe('Error message');
    });

    it('should handle spawn errors', async () => {
      mockSpawn.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const evidence = await aggregator.executeCommand('build', ['nonexistent', 'command']);

      expect(evidence.type).toBe('build');
      expect(evidence.command).toBe('nonexistent command');
      expect(evidence.exitCode).toBe(1);
      expect(evidence.stderr).toBe('Command not found');
    });
  });

  describe('Output Parsing', () => {
    it('should parse lint output correctly', () => {
      const evidence: TelemetryEvidence = {
        timestamp: Date.now(),
        type: 'lint',
        command: 'npm run lint',
        exitCode: 0,
        stdout: '2 errors, 3 warnings in file.ts',
        stderr: '',
        duration: 1000,
        metadata: {
          workingDirectory: '/test',
          nodeVersion: 'v18.0.0',
          npmVersion: '1.0.0',
          osPlatform: 'linux',
          osArch: 'x64',
        },
      };

      const parsed = aggregator.parseLintOutput(evidence);

      expect(parsed.errors).toBe(2);
      expect(parsed.warnings).toBe(3);
      expect(parsed.files).toBe(1);
    });

    it('should parse test output correctly', () => {
      const evidence: TelemetryEvidence = {
        timestamp: Date.now(),
        type: 'test',
        command: 'npm run test',
        exitCode: 0,
        stdout: '✓ 10 passed\n✗ 2 failed\n○ 1 skipped',
        stderr: '',
        duration: 5000,
        metadata: {
          workingDirectory: '/test',
          nodeVersion: 'v18.0.0',
          npmVersion: '1.0.0',
          osPlatform: 'linux',
          osArch: 'x64',
        },
      };

      const parsed = aggregator.parseTestOutput(evidence);

      expect(parsed.total).toBe(13);
      expect(parsed.passed).toBe(10);
      expect(parsed.failed).toBe(2);
      expect(parsed.skipped).toBe(1);
    });

    it('should parse build output correctly', () => {
      const evidence: TelemetryEvidence = {
        timestamp: Date.now(),
        type: 'build',
        command: 'npm run build',
        exitCode: 0,
        stdout: 'Build completed successfully',
        stderr: '',
        duration: 3000,
        metadata: {
          workingDirectory: '/test',
          nodeVersion: 'v18.0.0',
          npmVersion: '1.0.0',
          osPlatform: 'linux',
          osArch: 'x64',
        },
      };

      const parsed = aggregator.parseBuildOutput(evidence);

      expect(parsed.errors).toBe(0);
      expect(parsed.warnings).toBe(0);
      expect(parsed.success).toBe(true);
    });

    it('should parse kanban output correctly', () => {
      const evidence: TelemetryEvidence = {
        timestamp: Date.now(),
        type: 'kanban',
        command: 'npm run kanban:lint',
        exitCode: 0,
        stdout: '25 prompts validated, 2 failed',
        stderr: '',
        duration: 2000,
        metadata: {
          workingDirectory: '/test',
          nodeVersion: 'v18.0.0',
          npmVersion: '1.0.0',
          osPlatform: 'linux',
          osArch: 'x64',
        },
      };

      const parsed = aggregator.parseKanbanOutput(evidence);

      expect(parsed.prompts).toBe(25);
      expect(parsed.validated).toBe(25);
      expect(parsed.failed).toBe(2);
      expect(parsed.warnings).toBe(0);
    });
  });

  describe('Evidence Collection', () => {
    it('should collect evidence from all command types', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      // Mock successful command execution
      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('Success')), 10);
        }
      });

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('')), 10);
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 20);
        }
      });

      await aggregator.collectEvidence();

      // Should have executed all command types
      expect(mockSpawn).toHaveBeenCalledTimes(4);
      expect(mockSpawn).toHaveBeenCalledWith('npm', ['run', 'lint'], {
        cwd: '/test/project',
        stdio: 'pipe',
        shell: true,
      });
      expect(mockSpawn).toHaveBeenCalledWith('npm', ['run', 'test'], {
        cwd: '/test/project',
        stdio: 'pipe',
        shell: true,
      });
      expect(mockSpawn).toHaveBeenCalledWith('npm', ['run', 'build:check'], {
        cwd: '/test/project',
        stdio: 'pipe',
        shell: true,
      });
      expect(mockSpawn).toHaveBeenCalledWith('npm', ['run', 'kanban:lint'], {
        cwd: '/test/project',
        stdio: 'pipe',
        shell: true,
      });
    });

    it('should handle slow commands with warnings', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      // Mock slow command execution
      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('Success')), 400000); // 400ms
        }
      });

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('')), 10);
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 400010);
        }
      });

      // Override threshold to trigger warning
      const slowConfig = {
        ...mockConfig,
        thresholds: {
          ...mockConfig.thresholds,
          maxDuration: 300000, // 300ms
        },
      };

      const slowAggregator = new TelemetryEvidenceAggregator(slowConfig);
      await slowAggregator.collectEvidence();

      // Should still complete but with warning
      expect(mockSpawn).toHaveBeenCalled();
    });
  });

  describe('Evidence Analysis', () => {
    beforeEach(() => {
      // Add mock evidence
      const mockEvidence: TelemetryEvidence[] = [
        {
          timestamp: Date.now(),
          type: 'lint',
          command: 'npm run lint',
          exitCode: 0,
          stdout: '1 error, 2 warnings',
          stderr: '',
          duration: 1000,
          metadata: {
            workingDirectory: '/test',
            nodeVersion: 'v18.0.0',
            npmVersion: '1.0.0',
            osPlatform: 'linux',
            osArch: 'x64',
          },
        },
        {
          timestamp: Date.now(),
          type: 'test',
          command: 'npm run test',
          exitCode: 1,
          stdout: '✓ 5 passed\n✗ 1 failed',
          stderr: 'Test failed',
          duration: 2000,
          metadata: {
            workingDirectory: '/test',
            nodeVersion: 'v18.0.0',
            npmVersion: '1.0.0',
            osPlatform: 'linux',
            osArch: 'x64',
          },
        },
        {
          timestamp: Date.now(),
          type: 'build',
          command: 'npm run build',
          exitCode: 0,
          stdout: 'Build success',
          stderr: '',
          duration: 3000,
          metadata: {
            workingDirectory: '/test',
            nodeVersion: 'v18.0.0',
            npmVersion: '1.0.0',
            osPlatform: 'linux',
            osArch: 'x64',
          },
        },
        {
          timestamp: Date.now(),
          type: 'kanban',
          command: 'npm run kanban:lint',
          exitCode: 0,
          stdout: '10 prompts validated',
          stderr: '',
          duration: 500,
          metadata: {
            workingDirectory: '/test',
            nodeVersion: 'v18.0.0',
            npmVersion: '1.0.0',
            osPlatform: 'linux',
            osArch: 'x64',
          },
        },
      ];

      // Manually set evidence for testing
      (aggregator as any).evidence = mockEvidence;
    });

    it('should analyze performance metrics correctly', () => {
      const analysis = aggregator.analyzeEvidence();

      expect(analysis.performance.averageDuration).toBe(1625); // (1000 + 2000 + 3000 + 500) / 4
      expect(analysis.performance.slowestCommand).toContain('npm run build');
      expect(analysis.performance.fastestCommand).toContain('npm run kanban:lint');
    });

    it('should analyze quality metrics correctly', () => {
      const analysis = aggregator.analyzeEvidence();

      expect(analysis.quality.successRate).toBe(0.75); // 3/4 passed
      expect(analysis.quality.errorRate).toBe(0.5); // 2 errors (1 lint + 1 test)
      expect(analysis.quality.warningRate).toBe(0.25); // 2 warnings from lint
    });

    it('should identify error patterns', () => {
      const analysis = aggregator.analyzeEvidence();

      expect(analysis.trends.mostFrequentErrors).toHaveLength(2);
      expect(analysis.trends.mostFrequentErrors[0].pattern).toBe('Test failed');
      expect(analysis.trends.mostFrequentErrors[0].count).toBe(1);
    });

    it('should identify performance issues', () => {
      const performanceConfig = {
        ...mockConfig,
        thresholds: {
          maxDuration: 1000, // Low threshold to trigger issues
          maxErrors: 10,
          maxWarnings: 50,
        },
      };

      const performanceAggregator = new TelemetryEvidenceAggregator(performanceConfig);
      (performanceAggregator as any).evidence = (aggregator as any).evidence;

      const analysis = performanceAggregator.analyzeEvidence();

      expect(analysis.trends.performanceIssues).toHaveLength(3); // test, build > 1000ms
      expect(analysis.trends.performanceIssues[0].command).toBe('npm run test');
      expect(analysis.trends.performanceIssues[0].duration).toBe(2000);
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      const mockEvidence: TelemetryEvidence[] = [
        {
          timestamp: Date.now(),
          type: 'lint',
          command: 'npm run lint',
          exitCode: 0,
          stdout: 'Lint success',
          stderr: '',
          duration: 1000,
          metadata: {
            workingDirectory: '/test',
            nodeVersion: 'v18.0.0',
            npmVersion: '1.0.0',
            osPlatform: 'linux',
            osArch: 'x64',
          },
        },
      ];

      (aggregator as any).evidence = mockEvidence;
    });

    it('should generate JSON output correctly', () => {
      const aggregated = aggregator.generateAggregatedEvidence();
      const jsonOutput = aggregator.generateJSONOutput(aggregated);

      const parsed = JSON.parse(jsonOutput);
      expect(parsed.sessionId).toBeDefined();
      expect(parsed.startTime).toBeDefined();
      expect(parsed.endTime).toBeDefined();
      expect(parsed.totalDuration).toBeDefined();
      expect(parsed.evidence).toHaveLength(1);
      expect(parsed.summary).toBeDefined();
      expect(parsed.analysis).toBeDefined();
    });

    it('should generate Markdown output correctly', () => {
      const aggregated = aggregator.generateAggregatedEvidence();
      const markdownOutput = aggregator.generateMarkdownOutput(aggregated);

      expect(markdownOutput).toContain('# Telemetry Evidence Report');
      expect(markdownOutput).toContain('## Summary');
      expect(markdownOutput).toContain('| Total Commands | 1 |');
      expect(markdownOutput).toContain('| Passed | 1 |');
      expect(markdownOutput).toContain('## Performance Analysis');
    });

    it('should exclude raw output when configured', () => {
      const noRawConfig = {
        ...mockConfig,
        output: {
          ...mockConfig.output,
          includeRawOutput: false,
        },
      };

      const noRawAggregator = new TelemetryEvidenceAggregator(noRawConfig);
      (noRawAggregator as any).evidence = (aggregator as any).evidence;

      const aggregated = noRawAggregator.generateAggregatedEvidence();
      expect(aggregated.evidence).toHaveLength(1);
      expect(noRawAggregator.generateAggregatedEvidence().evidence).toHaveLength(0);
    });

    it('should exclude analysis when configured', () => {
      const noAnalysisConfig = {
        ...mockConfig,
        output: {
          ...mockConfig.output,
          includeAnalysis: false,
        },
      };

      const noAnalysisAggregator = new TelemetryEvidenceAggregator(noAnalysisConfig);
      (noAnalysisAggregator as any).evidence = (aggregator as any).evidence;

      const aggregated = noAnalysisAggregator.generateAggregatedEvidence();
      expect(aggregated.analysis.performance.averageDuration).toBeGreaterThan(0);
      expect(noAnalysisAggregator.generateAggregatedEvidence().analysis.performance.averageDuration).toBe(0);
    });
  });

  describe('Output Saving', () => {
    it('should save JSON and Markdown files', async () => {
      const mockEvidence: TelemetryEvidence[] = [
        {
          timestamp: Date.now(),
          type: 'lint',
          command: 'npm run lint',
          exitCode: 0,
          stdout: 'Success',
          stderr: '',
          duration: 1000,
          metadata: {
            workingDirectory: '/test',
            nodeVersion: 'v18.0.0',
            npmVersion: '1.0.0',
            osPlatform: 'linux',
            osArch: 'x64',
          },
        },
      ];

      (aggregator as any).evidence = mockEvidence;

      await aggregator.saveOutput(aggregator.generateAggregatedEvidence());

      expect(mockWriteFileSync).toHaveBeenCalledTimes(2); // JSON + Markdown
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/telemetry-evidence-.*\.json$/),
        expect.any(String)
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/telemetry-evidence-.*\.md$/),
        expect.any(String)
      );
    });

    it('should save only JSON when format is JSON', async () => {
      const jsonConfig = {
        ...mockConfig,
        output: {
          ...mockConfig.output,
          format: 'json' as const,
        },
      };

      const jsonAggregator = new TelemetryEvidenceAggregator(jsonConfig);
      (jsonAggregator as any).evidence = [];

      await jsonAggregator.saveOutput(jsonAggregator.generateAggregatedEvidence());

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/telemetry-evidence-.*\.json$/),
        expect.any(String)
      );
    });

    it('should save only Markdown when format is Markdown', async () => {
      const mdConfig = {
        ...mockConfig,
        output: {
          ...mockConfig.output,
          format: 'markdown' as const,
        },
      };

      const mdAggregator = new TelemetryEvidenceAggregator(mdConfig);
      (mdAggregator as any).evidence = [];

      await mdAggregator.saveOutput(mdAggregator.generateAggregatedEvidence());

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/telemetry-evidence-.*\.md$/),
        expect.any(String)
      );
    });
  });

  describe('Full Run Process', () => {
    it('should complete full run successfully', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      // Mock successful command execution
      mockChild.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('Success')), 10);
        }
      });

      mockChild.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('')), 10);
        }
      });

      mockChild.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 20);
        }
      });

      await aggregator.run();

      expect(mockSpawn).toHaveBeenCalledTimes(4);
      expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
    });

    it('should handle run errors gracefully', async () => {
      mockSpawn.mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      // Mock console.error to avoid test output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      await expect(aggregator.run()).rejects.toThrow('Spawn failed');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    it('should get current configuration', () => {
      const config = aggregator.getConfig();
      
      expect(config.workingDirectory).toBe('/test/project');
      expect(config.outputDirectory).toBe('/test/output');
      expect(config.commands.lint).toEqual(['npm', 'run', 'lint']);
    });

    it('should update configuration', () => {
      const newConfig = {
        commands: {
          lint: ['yarn', 'lint'],
          test: ['yarn', 'test'],
          build: ['yarn', 'build'],
          kanban: ['yarn', 'kanban'],
        },
      };

      const updatedAggregator = new TelemetryEvidenceAggregator(newConfig);
      const config = updatedAggregator.getConfig();
      
      expect(config.commands.lint).toEqual(['yarn', 'lint']);
      expect(config.commands.test).toEqual(['yarn', 'test']);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing working directory', () => {
      const invalidConfig = {
        workingDirectory: '/nonexistent/path',
      };

      expect(() => {
        new TelemetryEvidenceAggregator(invalidConfig);
      }).not.toThrow();
    });

    it('should handle invalid commands', async () => {
      const invalidConfig = {
        commands: {
          lint: [''],
          test: [''],
          build: [''],
          kanban: [''],
        },
      };

      const invalidAggregator = new TelemetryEvidenceAggregator(invalidConfig);
      
      // Should not throw during initialization
      expect(invalidAggregator.getConfig()).toBeDefined();
    });

    it('should handle file system errors', async () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      (aggregator as any).evidence = [];

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      await expect(aggregator.saveOutput(aggregator.generateAggregatedEvidence())).rejects.toThrow('Write failed');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large evidence sets efficiently', () => {
      const largeEvidence: TelemetryEvidence[] = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: Date.now() + i,
        type: 'lint' as const,
        command: `npm run lint ${i}`,
        exitCode: i % 10 === 0 ? 1 : 0,
        stdout: `Output ${i}`,
        stderr: i % 10 === 0 ? `Error ${i}` : '',
        duration: 1000 + i,
        metadata: {
          workingDirectory: '/test',
          nodeVersion: 'v18.0.0',
          npmVersion: '1.0.0',
          osPlatform: 'linux',
          osArch: 'x64',
        },
      }));

      (aggregator as any).evidence = largeEvidence;

      const startTime = performance.now();
      const analysis = aggregator.analyzeEvidence();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
      expect(analysis.performance.averageDuration).toBeGreaterThan(0);
      expect(analysis.trends.mostFrequentErrors).toBeDefined();
    });

    it('should generate reports efficiently', () => {
      const largeEvidence: TelemetryEvidence[] = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() + i,
        type: 'lint' as const,
        command: `npm run lint ${i}`,
        exitCode: 0,
        stdout: `Output ${i}`,
        stderr: '',
        duration: 1000,
        metadata: {
          workingDirectory: '/test',
          nodeVersion: 'v18.0.0',
          npmVersion: '1.0.0',
          osPlatform: 'linux',
          osArch: 'x64',
        },
      }));

      (aggregator as any).evidence = largeEvidence;

      const startTime = performance.now();
      const aggregated = aggregator.generateAggregatedEvidence();
      const jsonOutput = aggregator.generateJSONOutput(aggregated);
      const markdownOutput = aggregator.generateMarkdownOutput(aggregated);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should complete in < 200ms
      expect(jsonOutput.length).toBeGreaterThan(0);
      expect(markdownOutput.length).toBeGreaterThan(0);
      expect(aggregated.evidence).toHaveLength(100);
    });
  });
});
