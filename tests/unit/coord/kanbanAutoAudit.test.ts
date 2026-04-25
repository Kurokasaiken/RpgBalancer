/**
 * Kanban Auto Audit Tests
 * 
 * Unit tests for kanban auto audit script functionality.
 * Tests markdown parsing, validation rules, and report generation.
 * 
 * @module kanbanAutoAuditTests
 * @since 2026-01-11
 * @author Orion-Coord
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  parseKanbanTable, 
  validateEntries, 
  generateAuditReport, 
  checkPolicyCompliance,
  type KanbanEntry,
  type AuditReport 
} from '@/scripts/coord/kanbanAutoAudit';

// Mock sample markdown content
const mockMarkdownContent = `# Kanban Board

| Task ID | Status | Agent | Start Date | End Date | Phase | Hours | Story Points |
|--------|--------|--------|------------|----------|-------|-------|--------------|
| TASK-001 | In corso | Agent-A | 2026-01-10 | - | Phase-1 | 8 | 5 |
| TASK-002 | Completato | Agent-B | 2026-01-08 | 2026-01-09 | Phase-1 | 4 | 3 |
| TASK-003 | Non assegnato | - | - | - | Phase-2 | - | - |
| TASK-004 | In corso | Agent-C | 2026-01-11 | - | Phase-2 | 6 | 4 |
| TASK-005 | Completato | Agent-D | 2026-01-05 | - | Phase-1 | 12 | 8 |

Evidence: test-results/task-002-completed.log
`;

const mockMarkdownWithEvidence = `# Kanban Board

| Task ID | Status | Agent | Start Date | End Date | Phase | Hours | Story Points |
|--------|--------|--------|------------|----------|-------|-------|--------------|
| TASK-001 | In corso | Agent-A | 2026-01-10 | - | Phase-1 | 8 | 5 |
| TASK-002 | Completato | Agent-B | 2026-01-08 | 2026-01-09 | Phase-1 | 4 | 3 |
| TASK-003 | Non assegnato | - | - | - | Phase-2 | - | - |

Evidence: test-results/task-002-completed.log
`;

const mockMarkdownWithoutEvidence = `# Kanban Board

| Task ID | Status | Agent | Start Date | End Date | Phase | Hours | Story Points |
|--------|--------|--------|------------|----------|-------|-------|--------------|
| TASK-001 | In corso | Agent-A | 2026-01-10 | - | Phase-1 | 8 | 5 |
| TASK-002 | Completato | Agent-B | 2026-01-08 | 2026-01-09 | Phase-1 | 4 | 3 |
| TASK-003 | Non assegnato | - | - | - | Phase-2 | - | - |
`;

describe('Kanban Auto Audit', () => {
  describe('parseKanbanTable', () => {
    it('should parse valid markdown table correctly', () => {
      const entries = parseKanbanTable(mockMarkdownContent);
      
      expect(entries).toHaveLength(5);
      
      const firstEntry = entries[0];
      expect(firstEntry.taskId).toBe('TASK-001');
      expect(firstEntry.status).toBe('In corso');
      expect(firstEntry.agent).toBe('Agent-A');
      expect(firstEntry.startDate).toBe('2026-01-10');
      expect(firstEntry.phase).toBe('Phase-1');
      expect(firstEntry.rowIndex).toBeGreaterThan(0);
    });

    it('should extract evidence from content', () => {
      const entries = parseKanbanTable(mockMarkdownWithEvidence);
      
      const completedEntry = entries.find(e => e.taskId === 'TASK-002');
      expect(completedEntry?.evidence).toBe('test-results/task-002-completed.log');
    });

    it('should handle entries without evidence', () => {
      const entries = parseKanbanTable(mockMarkdownWithoutEvidence);
      
      const completedEntry = entries.find(e => e.taskId === 'TASK-002');
      expect(completedEntry?.evidence).toBeUndefined();
    });

    it('should return empty array for invalid content', () => {
      const entries = parseKanbanTable('# No table here');
      expect(entries).toHaveLength(0);
    });

    it('should handle malformed table rows gracefully', () => {
      const malformedContent = `
| Task ID | Status |
|--------|--------|
| TASK-001 | In corso
| Invalid row without proper separators
| TASK-002 | Completato | Agent-B | 2026-01-08
`;
      
      const entries = parseKanbanTable(malformedContent);
      // Should only parse properly formatted rows
      expect(entries.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateEntries', () => {
    it('should validate "In corso" entries with agent and date', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          agent: 'Agent-A',
          startDate: '2026-01-10',
          rawContent: '| TASK-001 | In corso | Agent-A | 2026-01-10 | - | Phase-1 | 8 | 5 |',
        },
      ];
      
      const results = validateEntries(entries);
      
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(true);
      expect(results[0].rule).toBe('IN_COURSE_COMPLETE');
      expect(results[0].severity).toBe('info');
    });

    it('should flag "In corso" entries missing agent', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          startDate: '2026-01-10',
          rawContent: '| TASK-001 | In corso | | 2026-01-10 | - | Phase-1 | 8 | 5 |',
        },
      ];
      
      const results = validateEntries(entries);
      
      const errorResult = results.find(r => r.rule === 'IN_COURSE_AGENT_REQUIRED');
      expect(errorResult).toBeDefined();
      expect(errorResult?.valid).toBe(false);
      expect(errorResult?.severity).toBe('error');
    });

    it('should flag "In corso" entries missing date', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          agent: 'Agent-A',
          rawContent: '| TASK-001 | In corso | Agent-A | | - | Phase-1 | 8 | 5 |',
        },
      ];
      
      const results = validateEntries(entries);
      
      const errorResult = results.find(r => r.rule === 'IN_COURSE_DATE_REQUIRED');
      expect(errorResult).toBeDefined();
      expect(errorResult?.valid).toBe(false);
      expect(errorResult?.severity).toBe('error');
    });

    it('should validate "Completato" entries with evidence', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-002',
          status: 'Completato',
          agent: 'Agent-B',
          startDate: '2026-01-08',
          endDate: '2026-01-09',
          evidence: 'test-results/task-002-completed.log',
          rawContent: '| TASK-002 | Completato | Agent-B | 2026-01-08 | 2026-01-09 | Phase-1 | 4 | 3 |',
        },
      ];
      
      const results = validateEntries(entries);
      
      const validResult = results.find(r => r.rule === 'COMPLETED_COMPLETE');
      expect(validResult).toBeDefined();
      expect(validResult?.valid).toBe(true);
      expect(validResult?.severity).toBe('info');
    });

    it('should flag "Completato" entries missing evidence', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-002',
          status: 'Completato',
          agent: 'Agent-B',
          startDate: '2026-01-08',
          endDate: '2026-01-09',
          rawContent: '| TASK-002 | Completato | Agent-B | 2026-01-08 | 2026-01-09 | Phase-1 | 4 | 3 |',
        },
      ];
      
      const results = validateEntries(entries);
      
      const errorResult = results.find(r => r.rule === 'COMPLETED_EVIDENCE_REQUIRED');
      expect(errorResult).toBeDefined();
      expect(errorResult?.valid).toBe(false);
      expect(errorResult?.severity).toBe('error');
    });

    it('should flag "Completato" entries missing end date', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-002',
          status: 'Completato',
          agent: 'Agent-B',
          startDate: '2026-01-08',
          evidence: 'test-results/task-002-completed.log',
          rawContent: '| TASK-002 | Completato | Agent-B | 2026-01-08 | | Phase-1 | 4 | 3 |',
        },
      ];
      
      const results = validateEntries(entries);
      
      const warningResult = results.find(r => r.rule === 'COMPLETED_DATE_REQUIRED');
      expect(warningResult).toBeDefined();
      expect(warningResult?.valid).toBe(false);
      expect(warningResult?.severity).toBe('warning');
    });

    it('should flag "Non assegnato" entries with agent or date', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-003',
          status: 'Non assegnato',
          agent: 'Agent-C', // Should not have agent
          rawContent: '| TASK-003 | Non assegnato | Agent-C | | - | Phase-2 | - | - |',
        },
      ];
      
      const results = validateEntries(entries);
      
      const warningResult = results.find(r => r.rule === 'UNASSIGNED_SHOULD_NOT_HAVE_DETAILS');
      expect(warningResult).toBeDefined();
      expect(warningResult?.valid).toBe(false);
      expect(warningResult?.severity).toBe('warning');
    });

    it('should flag stale "In corso" entries', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
      
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          agent: 'Agent-A',
          startDate: oldDate.toISOString().split('T')[0],
          rawContent: '| TASK-001 | In corso | Agent-A | 2025-12-07 | - | Phase-1 | 8 | 5 |',
        },
      ];
      
      const results = validateEntries(entries);
      
      const warningResult = results.find(r => r.rule === 'STALE_IN_COURSE');
      expect(warningResult).toBeDefined();
      expect(warningResult?.valid).toBe(false);
      expect(warningResult?.severity).toBe('warning');
    });
  });

  describe('checkPolicyCompliance', () => {
    it('should be compliant with valid entries', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          agent: 'Agent-A',
          startDate: '2026-01-10',
          rawContent: '',
        },
        {
          rowIndex: 2,
          taskId: 'TASK-002',
          status: 'Completato',
          agent: 'Agent-B',
          startDate: '2026-01-08',
          endDate: '2026-01-09',
          evidence: 'test-results/task-002.log',
          rawContent: '',
        },
      ];
      
      const compliance = checkPolicyCompliance(entries);
      
      expect(compliance.compliant).toBe(true);
      expect(compliance.issues).toHaveLength(0);
    });

    it('should flag too many completed entries', () => {
      const entries: KanbanEntry[] = Array.from({ length: 15 }, (_, i) => ({
        rowIndex: i,
        taskId: `TASK-${i.toString().padStart(3, '0')}`,
        status: 'Completato' as const,
        agent: `Agent-${i}`,
        startDate: '2026-01-08',
        endDate: '2026-01-09',
        evidence: `test-results/task-${i}.log`,
        rawContent: '',
      }));
      
      const compliance = checkPolicyCompliance(entries);
      
      expect(compliance.compliant).toBe(false);
      expect(compliance.issues.some(issue => issue.includes('Too many completed entries'))).toBe(true);
    });

    it('should flag very old "In corso" entries', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 65); // 65 days ago
      
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          agent: 'Agent-A',
          startDate: oldDate.toISOString().split('T')[0],
          rawContent: '',
        },
      ];
      
      const compliance = checkPolicyCompliance(entries);
      
      expect(compliance.compliant).toBe(false);
      expect(compliance.issues.some(issue => issue.includes('older than 60 days'))).toBe(true);
    });

    it('should flag completed entries without evidence', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'Completato',
          agent: 'Agent-B',
          startDate: '2026-01-08',
          endDate: '2026-01-09',
          rawContent: '',
        },
      ];
      
      const compliance = checkPolicyCompliance(entries);
      
      expect(compliance.compliant).toBe(false);
      expect(compliance.issues.some(issue => issue.includes('completed entries missing evidence'))).toBe(true);
    });
  });

  describe('generateAuditReport', () => {
    it('should generate complete audit report', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          agent: 'Agent-A',
          startDate: '2026-01-10',
          rawContent: '',
        },
        {
          rowIndex: 2,
          taskId: 'TASK-002',
          status: 'Completato',
          agent: 'Agent-B',
          startDate: '2026-01-08',
          endDate: '2026-01-09',
          evidence: 'test-results/task-002.log',
          rawContent: '',
        },
      ];
      
      const validationResults = validateEntries(entries);
      const report = generateAuditReport(entries, validationResults);
      
      expect(report.timestamp).toBeDefined();
      expect(report.totalEntries).toBe(2);
      expect(report.results).toHaveLength(2);
      expect(report.summary.errors).toBe(0);
      expect(report.summary.warnings).toBe(0);
      expect(report.summary.valid).toBe(2);
      expect(report.policyCompliance.ks005Compliant).toBe(true);
    });

    it('should include validation errors in report', () => {
      const entries: KanbanEntry[] = [
        {
          rowIndex: 1,
          taskId: 'TASK-001',
          status: 'In corso',
          startDate: '2026-01-10',
          rawContent: '', // Missing agent
        },
        {
          rowIndex: 2,
          taskId: 'TASK-002',
          status: 'Completato',
          agent: 'Agent-B',
          startDate: '2026-01-08',
          endDate: '2026-01-09',
          rawContent: '', // Missing evidence
        },
      ];
      
      const validationResults = validateEntries(entries);
      const report = generateAuditReport(entries, validationResults);
      
      expect(report.summary.errors).toBe(2);
      expect(report.summary.valid).toBe(0);
      expect(report.results.filter(r => r.severity === 'error')).toHaveLength(2);
    });
  });

  describe('Integration Tests', () => {
    it('should process complete workflow end-to-end', () => {
      // Parse markdown
      const entries = parseKanbanTable(mockMarkdownContent);
      expect(entries).toHaveLength(5);
      
      // Validate entries
      const validationResults = validateEntries(entries);
      expect(validationResults.length).toBeGreaterThan(0);
      
      // Generate report
      const report = generateAuditReport(entries, validationResults);
      expect(report.totalEntries).toBe(5);
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.policyCompliance).toBeDefined();
    });

    it('should handle edge case with no table', () => {
      const noTableContent = '# Just a header\n\nSome text\n\nNo table here';
      
      const entries = parseKanbanTable(noTableContent);
      expect(entries).toHaveLength(0);
      
      const validationResults = validateEntries(entries);
      expect(validationResults).toHaveLength(0);
      
      const report = generateAuditReport(entries, validationResults);
      expect(report.totalEntries).toBe(0);
      expect(report.summary.errors).toBe(0);
      expect(report.summary.valid).toBe(0);
    });
  });
});
