/**
 * Unit tests for Physics Lab Evidence Automation
 * 
 * Tests the evidence collector, Guardian handoff, and report generation
 * functionality with mocked file system and command execution.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  parseSafeguardResults, 
  extractLogMetadata, 
  processLogFile, 
  generateGuardianReport 
} from '../../../scripts/guardian/physicsLabEvidence';

// Mock fs module
vi.mock('fs');
vi.mock('glob');
vi.mock('child_process');

const mockFs = vi.mocked(fs);
const mockGlob = vi.mocked(await import('glob'));
const mockExecSync = vi.mocked(await import('child_process')).execSync;

describe('Physics Lab Evidence Automation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseSafeguardResults', () => {
    it('should parse complete safeguard results', () => {
      const content = `
# Test Log

### ✅ Lint
- **Status**: Passed
- **Errors**: 0
- **Warnings**: 3

### ✅ Tests
- **Status**: Passed
- **Passed**: 25
- **Failed**: 2

### ✅ Build Check
- **Status**: Passed

### ✅ Kanban
- **Status**: Passed
- **Validated**: 46 prompts
      `;

      const result = parseSafeguardResults(content);

      expect(result).toEqual({
        lint: { status: 'PASS', errors: 0, warnings: 3 },
        test: { status: 'PASS', passed: 25, failed: 2 },
        build: { status: 'PASS' },
        kanban: { status: 'PASS', validated: 46 }
      });
    });

    it('should parse failed safeguard results', () => {
      const content = `
# Test Log

### ❌ Lint
- **Status**: Failed
- **Errors**: 5
- **Warnings**: 12

### ❌ Tests
- **Status**: Failed
- **Passed**: 15
- **Failed**: 8
      `;

      const result = parseSafeguardResults(content);

      expect(result).toEqual({
        lint: { status: 'FAIL', errors: 5, warnings: 12 },
        test: { status: 'FAIL', passed: 15, failed: 8 }
      });
    });

    it('should handle missing safeguard sections', () => {
      const content = `
# Test Log
No safeguard results here.
      `;

      const result = parseSafeguardResults(content);

      expect(result).toEqual({});
    });
  });

  describe('extractLogMetadata', () => {
    it('should extract complete metadata from log content', () => {
      const content = `
# PL-ARCH – Physics Lab Scaffold & Token Bridge

**Date**: 2026-02-19
**Agent**: Cascade
**Status**: Completato

## Summary
Successfully completed Physics Lab scaffold...
      `;

      const metadata = extractLogMetadata(content, 'test-results/pl-arch-2026-02-19.log');

      expect(metadata).toEqual({
        promptId: 'PL-ARCH',
        title: 'PL-ARCH – Physics Lab Scaffold & Token Bridge',
        date: '2026-02-19',
        agent: 'Cascade',
        status: 'Completato',
        summary: 'Successfully completed Physics Lab scaffold...',
        evidencePath: 'test-results/pl-arch-2026-02-19.log'
      });
    });

    it('should handle incomplete metadata', () => {
      const content = `
# Test Log
No metadata here.
      `;

      const metadata = extractLogMetadata(content, 'test-results/test.log');

      expect(metadata).toEqual({
        promptId: undefined,
        title: 'Test Log',
        date: undefined,
        agent: undefined,
        status: undefined,
        summary: '',
        evidencePath: 'test-results/test.log'
      });
    });

    it('should validate status values', () => {
      const content = `
# Test Log
**Status**: InvalidStatus
      `;

      const metadata = extractLogMetadata(content, 'test-results/test.log');

      expect(metadata.status).toBeUndefined();
    });
  });

  describe('processLogFile', () => {
    it('should process a complete log file', async () => {
      const content = `
# PL-TEL – Physics Lab Telemetry + Performance HUD

**Date**: 2026-02-19
**Agent**: Cascade
**Status**: Completato

## Summary
Successfully implemented telemetry system...

### ✅ Lint
- **Status**: Passed
- **Warnings**: 2

### ✅ Tests
- **Status**: Passed
- **Passed**: 30
- **Failed**: 0

## Files Created
- \`src/analytics/styleLab/physicsLabTelemetry.ts\`
- \`src/ui/styleLab/physicsLab/hooks/usePhysicsLabTelemetry.ts\`
      `;

      mockFs.readFileSync.mockReturnValue(content);

      const result = await processLogFile('test-results/pl-tel-2026-02-19.log');

      expect(result).toEqual({
        promptId: 'PL-TEL',
        title: 'PL-TEL – Physics Lab Telemetry + Performance HUD',
        date: '2026-02-19',
        agent: 'Cascade',
        status: 'Completato',
        safeguardResults: {
          lint: { status: 'PASS', warnings: 2 },
          test: { status: 'PASS', passed: 30, failed: 0 }
        },
        files: [
          'src/analytics/styleLab/physicsLabTelemetry.ts',
          'src/ui/styleLab/physicsLab/hooks/usePhysicsLabTelemetry.ts'
        ],
        summary: 'Successfully implemented telemetry system...',
        evidencePath: 'test-results/pl-tel-2026-02-19.log'
      });
    });

    it('should handle file read errors gracefully', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(processLogFile('nonexistent.log')).rejects.toThrow('File not found');
    });
  });

  describe('generateGuardianReport', () => {
    it('should generate comprehensive Guardian report', () => {
      const logs = [
        {
          promptId: 'PL-ARCH',
          title: 'Physics Lab Scaffold',
          date: '2026-02-19',
          agent: 'Cascade',
          status: 'Completato' as const,
          safeguardResults: {
            lint: { status: 'PASS' as const, warnings: 2 },
            test: { status: 'PASS' as const, passed: 25, failed: 0 },
            build: { status: 'PASS' as const },
            kanban: { status: 'PASS' as const, validated: 46 }
          },
          files: ['src/ui/styleLab/physicsLab/PhysicsLabApp.tsx'],
          summary: 'Scaffold completed successfully',
          evidencePath: 'test-results/pl-arch-2026-02-19.log'
        },
        {
          promptId: 'PL-TEL',
          title: 'Telemetry System',
          date: '2026-02-19',
          agent: 'Cascade',
          status: 'Completato' as const,
          safeguardResults: {
            lint: { status: 'FAIL' as const, errors: 3, warnings: 5 },
            test: { status: 'PASS' as const, passed: 30, failed: 0 },
            build: { status: 'PASS' as const },
            kanban: { status: 'PASS' as const, validated: 46 }
          },
          files: ['src/analytics/styleLab/physicsLabTelemetry.ts'],
          summary: 'Telemetry implemented',
          evidencePath: 'test-results/pl-tel-2026-02-19.log'
        }
      ];

      const report = generateGuardianReport(logs);

      expect(report.totalLogs).toBe(2);
      expect(report.completedTasks).toBe(2);
      expect(report.overallHealth).toBe('WARNING'); // One failed lint
      expect(report.summary.byStatus).toEqual({
        'Completato': 2
      });
      expect(report.summary.byAgent).toEqual({
        'Cascade': 2
      });
      expect(report.summary.commonIssues).toContain('1 tasks have lint failures');
      expect(report.summary.recommendations).toContain('Resolve lint warnings to maintain code quality');
    });

    it('should handle healthy report with no issues', () => {
      const logs = [
        {
          promptId: 'PL-ARCH',
          title: 'Physics Lab Scaffold',
          date: '2026-02-19',
          agent: 'Cascade',
          status: 'Completato' as const,
          safeguardResults: {
            lint: { status: 'PASS' as const },
            test: { status: 'PASS' as const },
            build: { status: 'PASS' as const },
            kanban: { status: 'PASS' as const }
          },
          files: [],
          summary: 'All good',
          evidencePath: 'test-results/pl-arch-2026-02-19.log'
        }
      ];

      const report = generateGuardianReport(logs);

      expect(report.overallHealth).toBe('HEALTHY');
      expect(report.summary.commonIssues).toHaveLength(0);
      expect(report.summary.recommendations).toContain('All Physics Lab tasks completed - ready for production review');
    });

    it('should handle critical health with many failures', () => {
      const logs = [
        {
          promptId: 'PL-FAIL1',
          title: 'Failed Task 1',
          date: '2026-02-19',
          agent: 'Cascade',
          status: 'Completato' as const,
          safeguardResults: {
            lint: { status: 'FAIL' as const },
            test: { status: 'FAIL' as const },
            build: { status: 'FAIL' as const },
            kanban: { status: 'FAIL' as const }
          },
          files: [],
          summary: 'Multiple failures',
          evidencePath: 'test-results/pl-fail1-2026-02-19.log'
        },
        {
          promptId: 'PL-FAIL2',
          title: 'Failed Task 2',
          date: '2026-02-19',
          agent: 'Cascade',
          status: 'Completato' as const,
          safeguardResults: {
            lint: { status: 'FAIL' as const },
            test: { status: 'FAIL' as const },
            build: { status: 'FAIL' as const },
            kanban: { status: 'FAIL' as const }
          },
          files: [],
          summary: 'More failures',
          evidencePath: 'test-results/pl-fail2-2026-02-19.log'
        }
      ];

      const report = generateGuardianReport(logs);

      expect(report.overallHealth).toBe('CRITICAL');
      expect(report.summary.commonIssues).toContain('2 tasks have lint failures');
      expect(report.summary.commonIssues).toContain('2 tasks have test failures');
      expect(report.summary.commonIssues).toContain('2 tasks have build failures');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete evidence collection workflow', async () => {
      // Mock glob to return log files
      mockGlob.glob.mockResolvedValue([
        'test-results/pl-arch-2026-02-19.log',
        'test-results/pl-tel-2026-02-19.log'
      ]);

      // Mock file reading
      const logContent1 = `
# PL-ARCH – Physics Lab Scaffold

**Date**: 2026-02-19
**Agent**: Cascade
**Status**: Completato

## Summary
Scaffold completed

### ✅ Lint
- **Status**: Passed
- **Warnings**: 1
      `;

      const logContent2 = `
# PL-TEL – Telemetry System

**Date**: 2026-02-19
**Agent**: Cascade
**Status**: Completato

## Summary
Telemetry done

### ✅ Tests
- **Status**: Passed
- **Passed**: 15
- **Failed**: 0
      `;

      mockFs.readFileSync
        .mockReturnValueOnce(logContent1)
        .mockReturnValueOnce(logContent2);

      // Import and test the main function
      const evidenceModule = await import('../../../scripts/guardian/physicsLabEvidence');
      const { main } = evidenceModule;
      
      // Mock console.log to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await main();

      // Verify file operations
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3); // JSON, Markdown, Log

      consoleSpy.mockRestore();
    });
  });
});
