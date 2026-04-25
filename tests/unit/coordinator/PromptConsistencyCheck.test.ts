/**
 * Unit Tests for Prompt Consistency Check CLI
 * 
 * Comprehensive test suite covering schema validation, parsing, and consistency checking.
 * Includes fixtures for different scenarios and edge cases.
 * 
 * @since 2026-01-20
 * @author Coordinator-Bot – Prompt QA
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownPromptParser } from '../../../scripts/coordinator/markdownPromptParser';
import { PromptConsistencyChecker } from '../../../scripts/coordinator/promptConsistencyCheck';
import type { PromptEntryType, MarkdownDocumentType } from '../../../scripts/coordinator/promptConsistencySchema';

describe('MarkdownPromptParser', () => {
  let parser: MarkdownPromptParser;
  
  beforeEach(() => {
    parser = new MarkdownPromptParser();
  });
  
  describe('parseDocument', () => {
    it('should parse a valid Kanban document', async () => {
      const content = `# WS6 Prompt Kanban

| Prompt ID/Descrizione | Stato | Dipende da | Agente | Start Time | End Time | Duration | Est. | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NP-001 – Test Prompt | Completato | - | Test Agent | 2026-01-20 | 2026-01-20 | 1.0 | 160 | 2026-01-20 | Evidence: test-results/np-001-test-2026-01-20.log |

AGENT
Test Agent – Test Role

OBIETTIVO
Test objective

KPI: Test KPI requirement`;
      
      const result = await parser.parseDocument(content);
      
      expect(result.title).toBe('WS6 Prompt Kanban');
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].id).toBe('NP-001');
      expect(result.prompts[0].title).toBe('Test Prompt');
      expect(result.prompts[0].state).toBe('Completato');
      expect(result.prompts[0].assignedTo).toEqual({
        name: 'Test Agent',
        role: 'Test Role',
      });
      expect(result.prompts[0].kpiRequirements).toHaveLength(1);
      expect(result.prompts[0].kpiRequirements![0].description).toBe('Test KPI requirement');
    });
    
    it('should handle empty document', async () => {
      const content = '# Empty Document\n\nNo content here.';
      
      const result = await parser.parseDocument(content);
      
      expect(result.title).toBe('Empty Document');
      expect(result.prompts).toHaveLength(0);
      expect(result.table.headers).toHaveLength(0);
      expect(result.table.rows).toHaveLength(0);
    });
    
    it('should parse multiple prompts', async () => {
      const content = `# Test Kanban

| Prompt ID/Descrizione | Stato | Dipende da | Agente |
| --- | --- | --- | --- |
| NP-001 – First Prompt | Completato | - | Agent A |
| NP-002 – Second Prompt | In corso | NP-001 | Agent B |

NP-001 – First Prompt
AGENT
Agent A – Role A

KPI: KPI for first prompt

NP-002 – Second Prompt  
AGENT
Agent B – Role B

KPI: KPI for second prompt`;
      
      const result = await parser.parseDocument(content);
      
      expect(result.prompts).toHaveLength(2);
      expect(result.prompts[0].id).toBe('NP-001');
      expect(result.prompts[1].id).toBe('NP-002');
      expect(result.prompts[1].dependsOn).toEqual(['NP-001']);
      expect(result.prompts[0].kpiRequirements![0].description).toBe('KPI for first prompt');
      expect(result.prompts[1].kpiRequirements![0].description).toBe('KPI for second prompt');
    });
    
    it('should handle malformed table rows gracefully', async () => {
      const content = `# Test Kanban

| Prompt ID/Descrizione | Stato |
| --- | --- |
| NP-001 – Valid Prompt | Completato |
| Invalid row without proper format |
| NP-002 – Another Valid | In corso |`;
      
      const result = await parser.parseDocument(content);
      
      expect(result.prompts).toHaveLength(2);
      expect(result.prompts[0].id).toBe('NP-001');
      expect(result.prompts[1].id).toBe('NP-002');
    });
  });
  
  describe('validatePrompt', () => {
    it('should validate a correct prompt', () => {
      const prompt: PromptEntryType = {
        id: 'NP-001',
        title: 'Test Prompt',
        description: 'Test Description',
        state: 'Completato',
      };
      
      expect(parser.validatePrompt(prompt)).toBe(true);
    });
    
    it('should reject prompt with invalid ID', () => {
      const prompt: PromptEntryType = {
        id: 'INVALID-001',
        title: 'Test Prompt',
        description: 'Test Description',
        state: 'Completato',
      };
      
      expect(parser.validatePrompt(prompt)).toBe(false);
    });
    
    it('should reject prompt with missing required fields', () => {
      const prompt = {
        id: 'NP-001',
        title: 'Test Prompt',
        // Missing state and description
      } as PromptEntryType;
      
      expect(parser.validatePrompt(prompt)).toBe(false);
    });
  });
  
  describe('extractDependencies', () => {
    it('should extract dependencies from content', () => {
      const content = `
DIPENDENZE: NP-001, NP-002
Requires: NP-003
Other content here
      `;
      
      const dependencies = parser.extractDependencies(content);
      
      expect(dependencies).toEqual(['NP-001', 'NP-002', 'NP-003']);
    });
    
    it('should handle content without dependencies', () => {
      const content = `
AGENT
Test Agent – Test Role

OBIETTIVO
Test objective
      `;
      
      const dependencies = parser.extractDependencies(content);
      
      expect(dependencies).toEqual([]);
    });
  });
});

describe('PromptConsistencyChecker', () => {
  let checker: PromptConsistencyChecker;
  
  beforeEach(() => {
    checker = new PromptConsistencyChecker();
  });
  
  describe('runCheck', () => {
    it('should detect duplicate prompt IDs', async () => {
      const documents: { [path: string]: MarkdownDocumentType } = {
        'test.md': {
          title: 'Test',
          content: '',
          prompts: [
            {
              id: 'NP-001',
              title: 'Test 1',
              description: 'Test 1',
              state: 'Completato',
            },
            {
              id: 'NP-001',
              title: 'Test 2',
              description: 'Test 2',
              state: 'In corso',
            },
          ],
          table: { headers: [], rows: [] },
        },
      };
      
      const result = await checker.runCheck(documents);
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('duplicate');
      expect(result.issues[0].promptId).toBe('NP-001');
      expect(result.issues[0].severity).toBe('high');
      expect(result.summary.duplicates).toBe(1);
    });
    
    it('should detect invalid states', async () => {
      const documents: { [path: string]: MarkdownDocumentType } = {
        'test.md': {
          title: 'Test',
          content: '',
          prompts: [
            {
              id: 'NP-001',
              title: 'Test 1',
              description: 'Test 1',
              state: 'Invalid State' as any,
            },
          ],
          table: { headers: [], rows: [] },
        },
      };
      
      const result = await checker.runCheck(documents);
      
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].type).toBe('invalid_state');
      expect(result.issues[0].promptId).toBe('NP-001');
      expect(result.issues[0].severity).toBe('medium');
      expect(result.summary.invalidStates).toBe(1);
    });
    
    it('should detect missing KPI requirements', async () => {
      const documents: { [path: string]: MarkdownDocumentType } = {
        'test.md': {
          title: 'Test',
          content: '',
          prompts: [
            {
              id: 'NP-001',
              title: 'Test 1',
              description: 'Test 1',
              state: 'Completato',
              kpiRequirements: [],
            },
          ],
          table: { headers: [], rows: [] },
        },
      };
      
      const result = await checker.runCheck(documents);
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('missing_kpi');
      expect(result.issues[0].promptId).toBe('NP-001');
      expect(result.issues[0].severity).toBe('medium');
      expect(result.summary.missingKpis).toBe(1);
    });
    
    it('should detect missing references', async () => {
      const documents: { [path: string]: MarkdownDocumentType } = {
        'test.md': {
          title: 'Test',
          content: '',
          prompts: [
            {
              id: 'NP-001',
              title: 'Test 1',
              description: 'Test 1',
              state: 'In corso',
              dependsOn: ['NP-002', 'NP-003'],
            },
          ],
          table: { headers: [], rows: [] },
        },
      };
      
      const result = await checker.runCheck(documents);
      
      expect(result.issues).toHaveLength(3);
      expect(result.issues[0].type).toBe('missing_kpi');
      expect(result.issues[0].promptId).toBe('NP-001');
      expect(result.summary.missingReferences).toBe(2);
    });
    
    it('should detect orphaned references', async () => {
      const documents: { [path: string]: MarkdownDocumentType } = {
        'test.md': {
          title: 'Test',
          content: '',
          prompts: [
            {
              id: 'NP-001',
              title: 'Test 1',
              description: 'Test 1',
              state: 'Completato',
              dependsOn: ['NP-002'],
            },
            {
              id: 'NP-002',
              title: 'Test 2',
              description: 'Test 2',
              state: 'Non assegnato',
            },
          ],
          table: { headers: [], rows: [] },
        },
      };
      
      const result = await checker.runCheck(documents);
      
      expect(result.issues).toHaveLength(3);
      expect(result.issues[0].type).toBe('missing_kpi');
      expect(result.issues[0].promptId).toBe('NP-001');
      expect(result.issues[0].severity).toBe('medium');
      expect(result.summary.orphanedReferences).toBe(1);
    });
    
    it('should pass with no issues', async () => {
      const documents: { [path: string]: MarkdownDocumentType } = {
        'test.md': {
          title: 'Test',
          content: '',
          prompts: [
            {
              id: 'NP-001',
              title: 'Test 1',
              description: 'Test 1',
              state: 'Completato',
              kpiRequirements: [
                {
                  type: 'performance',
                  description: 'Test KPI',
                },
              ],
            },
          ],
          table: { headers: [], rows: [] },
        },
      };
      
      const result = await checker.runCheck(documents);
      
      expect(result.issues).toHaveLength(0);
      expect(result.totalPrompts).toBe(1);
      expect(result.summary.duplicates).toBe(0);
      expect(result.summary.invalidStates).toBe(0);
      expect(result.summary.missingKpis).toBe(0);
      expect(result.summary.missingReferences).toBe(0);
      expect(result.summary.orphanedReferences).toBe(0);
    });
  });
  
  describe('export methods', () => {
    let mockResult: any;
    
    beforeEach(() => {
      mockResult = {
        timestamp: '2026-01-20T10:00:00Z',
        totalPrompts: 2,
        issues: [
          {
            type: 'duplicate',
            promptId: 'NP-001',
            description: 'Duplicate prompt ID found',
            severity: 'high',
            suggestion: 'Rename one of the duplicate prompts',
          },
        ],
        summary: {
          duplicates: 1,
          invalidStates: 0,
          missingKpis: 0,
          missingReferences: 0,
          orphanedReferences: 0,
        },
        exportFormat: 'json',
      };
    });
    
    it('should export to JSON', () => {
      const output = checker.exportToJson(mockResult);
      
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.issues).toHaveLength(1);
      expect(parsed.issues[0].type).toBe('duplicate');
    });
    
    it('should export to Markdown', () => {
      const output = checker.exportToMarkdown(mockResult);
      
      expect(output).toContain('# Prompt Consistency Check Results');
      expect(output).toContain('## Summary');
      expect(output).toContain('## Issues');
      expect(output).toContain('NP-001');
      expect(output).toContain('Duplicate prompt ID found');
    });
    
    it('should export to CSV', () => {
      const output = checker.exportToCsv(mockResult);
      
      const lines = output.split('\n');
      expect(lines[0]).toBe('Type,Prompt ID,Description,Severity,Suggestion');
      expect(lines[1]).toContain('duplicate,NP-001,"Duplicate prompt ID found",high,"Rename one of the duplicate prompts"');
    });
  });
  
  describe('telemetry emission', () => {
    it('should emit telemetry for issues', async () => {
      const mockEmit = vi.fn();
      global.window = {
        dispatchEvent: mockEmit,
      } as any;
      
      const documents: { [path: string]: MarkdownDocumentType } = {
        'test.md': {
          title: 'Test',
          content: '',
          prompts: [
            {
              id: 'NP-001',
              title: 'Test 1',
              description: 'Test 1',
              state: 'Invalid State' as any,
            },
          ],
          table: { headers: [], rows: [] },
        },
      };
      
      await checker.runCheck(documents);
      
      expect(mockEmit).toHaveBeenCalledWith(
        expect.any(CustomEvent)
      );
      
      const event = mockEmit.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('coordinator_prompt_inconsistency_found');
      expect(event.detail).toEqual(
        expect.objectContaining({
          totalIssues: 2,
          issuesByType: expect.objectContaining({
            invalidStates: 1,
          }),
        })
      );
    });
  });
});

describe('Integration Tests', () => {
  it('should handle real-world Kanban content', async () => {
    const realContent = `# WS6 Prompt Kanban

<!-- markdownlint-disable MD013 MD031 MD032 MD007 -->

Kanban per tracciare i prompt WS6. Ogni prompt deve essere aggiunto qui quando creato, aggiornato quando assegnato/completato.

| Prompt ID/Descrizione | Stato | Dipende da | Agente | Start Time | End Time | Duration | Est. | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NP-001 – STS Intent Visualizer Overlay | Completato | - | Cascade | 2026-01-19 | 2026-01-19 | 0.5 | 160 | 2026-01-19 | Evidence: test-results/np-001-sts-intent-visualizer-2026-01-19.log |
| NP-002 – STS Combo Efficiency Heatmap | In corso | NP-001 | Helix-STS | 2026-01-19 | - | 0 | 160 | - | Working on implementation |

AGENT
Cascade

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill \`agent-execution-mandate\` prima di iniziare.

OBIETTIVO
Visualizzare in tempo reale gli intent nemici previsti dal simulatore STS.

KPI: Performance metrics should be tracked and reported.`;

    const parser = new MarkdownPromptParser();
    const result = await parser.parseDocument(realContent);
    
    expect(result.title).toBe('WS6 Prompt Kanban');
    expect(result.prompts).toHaveLength(2);
    expect(result.prompts[0].id).toBe('001');
    expect(result.prompts[0].state).toBe('Completato');
    expect(result.prompts[1].id).toBe('002');
    expect(result.prompts[1].state).toBe('In corso');
    expect(result.prompts[1].dependsOn).toEqual(['NP-001']);
    expect(result.prompts[0].kpiRequirements).toBeDefined();
    expect(result.prompts[0].kpiRequirements?.length).toBeGreaterThan(0);
  });
});
