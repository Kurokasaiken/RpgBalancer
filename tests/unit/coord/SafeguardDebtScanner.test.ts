/**
 * Safeguard Debt Scanner Tests
 * 
 * Unit tests for safeguard debt scanner functionality.
 * 
 * @module SafeguardDebtScanner.test.ts
 * @since 2026-01-14
 * @author Orion-Coord
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  parseKanbanEntries, 
  getCompletedPrompts, 
  scanPrompt, 
  calculateDebtScore, 
  getPriority,
  parseSafeguardResults,
  type SafeguardDebtEntry,
  type ScannerConfig
} from '../../../scripts/coord/safeguardDebtScanner';

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn()
  };
});

describe('SafeguardDebtScanner', () => {
  const mockFs = vi.mocked('fs');
  
  const mockConfig: ScannerConfig = {
    lookbackDays: 14,
    testResultsDir: 'test-results',
    agentAssignmentsFile: 'src/docs/docs/coordinator/agent_assignments.md',
    minDebtScore: 1
  };

  describe('parseKanbanEntries', () => {
    it('should parse kanban table entries correctly', () => {
      const mockContent = `
| Task ID | Status | Phase | Agent | Start Date | End Date | ... |
|---------|--------|-------|-------|------------|----------|-----|
| KS-001 Test Prompt | Completato | KS-001 | Agent | 2026-01-01 | 2026-01-02 | ... |
| KS-002 Another Prompt | In corso | KS-002 | Agent | 2026-01-01 | - | ... |
| Non assegnato Prompt | Non assegnato | COORD | - | - | - | ... |
      `.trim();

      const entries = parseKanbanEntries(mockContent);

      expect(entries).toHaveLength(3);
      expect(entries[0]).toEqual({
        promptId: 'KS-001',
        promptName: 'Test Prompt',
        status: 'Completato',
        completionDate: '2026-01-02',
        evidence: '...'
      });
      expect(entries[1]).toEqual({
        promptId: 'KS-002',
        promptName: 'Another Prompt',
        status: 'In corso',
        completionDate: undefined,
        evidence: '...'
      });
      expect(entries[2]).toEqual({
        promptId: 'Non',
        promptName: 'assegnato Prompt',
        status: 'Non assegnato',
        completionDate: undefined,
        evidence: '...'
      });
    });

    it('should handle empty content', () => {
      const entries = parseKanbanEntries('');
      expect(entries).toHaveLength(0);
    });

    it('should handle malformed rows', () => {
      const mockContent = `
| Task ID | Status |
|---------|--------|
| Invalid row |
| KS-001 Valid | Completato | ...
      `.trim();

      const entries = parseKanbanEntries(mockContent);
      expect(entries).toHaveLength(0);
    });
  });

  describe('calculateDebtScore', () => {
    it('should calculate debt score correctly', () => {
      const entry: SafeguardDebtEntry = {
        promptId: 'KS-001',
        promptName: 'Test',
        completionDate: '2026-01-01',
        evidenceFile: 'test.log',
        lint: { passed: false, errors: 2, warnings: 1, issues: ['error1', 'error2'] },
        test: { passed: false, failures: 1, issues: ['test failure'] },
        build: { passed: false, errors: 1, issues: ['build error'] },
        kanban: { passed: true, issues: [] },
        debtScore: 0,
        priority: 'low'
      };

      const score = calculateDebtScore(entry);
      
      // Expected: (2 * 3) + 1 + (1 * 2) + (1 * 4) + 0 = 6 + 1 + 2 + 4 = 13
      expect(score).toBe(13);
    });

    it('should return 0 for entries with no issues', () => {
      const entry: SafeguardDebtEntry = {
        promptId: 'KS-001',
        promptName: 'Test',
        completionDate: '2026-01-01',
        evidenceFile: 'test.log',
        lint: { passed: true, errors: 0, warnings: 0, issues: [] },
        test: { passed: true, failures: 0, issues: [] },
        build: { passed: true, errors: 0, issues: [] },
        kanban: { passed: true, issues: [] },
        debtScore: 0,
        priority: 'low'
      };

      const score = calculateDebtScore(entry);
      expect(score).toBe(0);
    });
  });

  describe('getPriority', () => {
    it('should return high priority for score >= 10', () => {
      expect(getPriority(10)).toBe('high');
      expect(getPriority(15)).toBe('high');
    });

    it('should return medium priority for score >= 5', () => {
      expect(getPriority(5)).toBe('medium');
      expect(getPriority(9)).toBe('medium');
    });

    it('should return low priority for score < 5', () => {
      expect(getPriority(0)).toBe('low');
      expect(getPriority(4)).toBe('low');
    });
  });

  describe('parseSafeguardResults', () => {
    it('should parse safeguard results correctly', () => {
      const mockContent = `
✅ lint: 0 errors, 2 warnings
❌ test: 1 failing
✅ build: success
✅ kanban: passed
error: lint - unused variable
warning: lint - missing import
failed: test - Test suite failed
      `.trim();

      const results = parseSafeguardResults(mockContent);

      expect(results.lint.passed).toBe(true);
      expect(results.lint.errors).toBe(0);
      expect(results.lint.warnings).toBe(2);
      expect(results.lint.issues).toContain('lint - unused variable');
      expect(results.lint.issues).toContain('lint - missing import');

      expect(results.test.passed).toBe(false);
      expect(results.test.failures).toBe(1);
      expect(results.test.issues).toContain('test - Test suite failed');

      expect(results.build.passed).toBe(true);
      expect(results.build.errors).toBe(0);

      expect(results.kanban.passed).toBe(true);
      expect(results.kanban.issues).toHaveLength(0);
    });

    it('should handle empty content', () => {
      const results = parseSafeguardResults('');
      
      expect(results.lint.passed).toBe(true);
      expect(results.test.passed).toBe(true);
      expect(results.build.passed).toBe(true);
      expect(results.kanban.passed).toBe(true);
    });
  });

  describe('scanPrompt', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should scan prompt with valid evidence file', () => {
      // Mock file system operations
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['ks-001-test.log', 'other-file.log']);
      mockFs.statSync.mockReturnValue({ mtime: new Date() });
      
      // Mock evidence file content
      mockFs.readFileSync.mockReturnValue(`
✅ lint: 0 errors, 1 warnings
❌ test: 1 failing
✅ build: success
✅ kanban: passed
warning: lint - unused variable
failed: test - Test suite failed
      `.trim());

      const entry = scanPrompt('KS-001', 'Test Prompt', '2026-01-01', mockConfig);

      expect(entry).toBeDefined();
      expect(entry!.promptId).toBe('KS-001');
      expect(entry!.promptName).toBe('Test Prompt');
      expect(entry!.completionDate).toBe('2026-01-01');
      expect(entry!.evidenceFile).toBe('ks-001-test.log');
      expect(entry!.lint.passed).toBe(true);
      expect(entry!.test.passed).toBe(false);
      expect(entry!.debtScore).toBeGreaterThan(0);
      expect(entry!.priority).toBe('medium');
    });

    it('should handle missing evidence file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const entry = scanPrompt('KS-001', 'Test Prompt', '2026-01-01', mockConfig);

      expect(entry).toBeDefined();
      expect(entry!.evidenceFile).toBe('Not found');
      expect(entry!.lint.passed).toBe(false);
      expect(entry!.test.passed).toBe(false);
      expect(entry!.build.passed).toBe(false);
      expect(entry!.kanban.passed).toBe(false);
      expect(entry!.debtScore).toBe(5);
      expect(entry!.priority).toBe('medium');
    });

    it('should handle evidence file read error', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['ks-001-test.log']);
      mockFs.statSync.mockReturnValue({ mtime: new Date() });
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const entry = scanPrompt('KS-001', 'Test Prompt', '2026-01-01', mockConfig);

      expect(entry).toBeDefined();
      expect(entry!.lint.passed).toBe(false);
      expect(entry!.lint.issues).toContain('Failed to parse evidence file');
      expect(entry!.debtScore).toBe(3);
      expect(entry!.priority).toBe('medium');
    });
  });

  describe('getCompletedPrompts', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should filter completed prompts within lookback period', () => {
      const kanbanContent = `
| Task ID | Status | Phase | Agent | Start Date | End Date | ... |
|---------|--------|-------|-------|------------|----------|-----|
| KS-001 Old Prompt | Completato | KS-001 | Agent | 2025-12-01 | 2025-12-02 | ... |
| KS-002 Recent Prompt | Completato | KS-002 | Agent | 2026-01-10 | 2026-01-11 | ... |
| KS-003 In Progress | In corso | KS-003 | Agent | 2026-01-12 | - | ... |
      `.trim();

      mockFs.readFileSync.mockReturnValue(kanbanContent);

      const prompts = getCompletedPrompts(mockConfig);

      expect(prompts).toHaveLength(1);
      expect(prompts[0].promptId).toBe('KS-002');
      expect(prompts[0].completionDate).toBe('2026-01-11');
    });

    it('should handle empty kanban content', () => {
      mockFs.readFileSync.mockReturnValue('');

      const prompts = getCompletedPrompts(mockConfig);
      expect(prompts).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete scan workflow', () => {
      // Mock kanban content
      const kanbanContent = `
| Task ID | Status | Phase | Agent | Start Date | End Date | Evidence |
|---------|--------|-------|-------|------------|----------|---------|
| KS-001 Test Prompt | Completato | KS-001 | Agent | 2026-01-10 | 2026-01-11 | test.log |
      `.trim();

      // Mock evidence file
      const evidenceContent = `
❌ lint: 2 errors, 1 warnings
❌ test: 1 failing
✅ build: success
✅ kanban: passed
error: lint - unused variable
error: lint - missing import
failed: test - Test suite failed
      `.trim();

      mockFs.readFileSync.mockImplementation((path: string) => {
        if (path.includes('agent_assignments.md')) {
          return kanbanContent;
        }
        if (path.includes('test.log')) {
          return evidenceContent;
        }
        return '';
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['ks-001-test.log']);
      mockFs.statSync.mockReturnValue({ mtime: new Date() });

      const prompts = getCompletedPrompts(mockConfig);
      expect(prompts).toHaveLength(1);

      const entry = scanPrompt(prompts[0].promptId, prompts[0].promptName, prompts[0].completionDate, mockConfig);
      expect(entry).toBeDefined();
      expect(entry!.debtScore).toBeGreaterThan(0);
      expect(entry!.priority).toBe('high'); // Should be high due to multiple errors
    });
  });
});
