/**
 * Unit tests for Prompt Quick Buffer automation
 * 
 * @module tests/unit/coordinator/PromptQuickBuffer.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Kanban content
const MOCK_KANBAN = `# WS6 Prompt Kanban

| Prompt ID/Descrizione | Stato | Dipende da | Agente | Start Time | End Time | Duration | Est. | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NP-100 – Test Prompt 1 | Non assegnato | - | - | - | - | - | 60 | - | - |
| PC-200 – Test Prompt 2 | Non assegnato | - | - | - | - | - | 90 | - | - |
| IV-300 – Test Prompt 3 | In corso | - | Agent1 | 2026-01-24 | - | - | 120 | 2026-01-24 | - |
| ST-400 – Test Prompt 4 | Completato | - | Agent2 | 2026-01-23 | 2026-01-23 | 60 | 60 | 2026-01-23 | Done |
| NP-101 – Test Prompt 5 | Non assegnato | - | - | - | - | - | 45 | - | - |
`;

describe('Prompt Quick Buffer', () => {
  let tempDir: string;
  let kanbanPath: string;
  let bufferPath: string;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, '../../../tmp/test-buffer');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    kanbanPath = path.join(tempDir, 'agent_assignments.md');
    bufferPath = path.join(tempDir, 'prompt_quick_buffer.md');

    // Write mock Kanban
    fs.writeFileSync(kanbanPath, MOCK_KANBAN, 'utf-8');
  });

  describe('parseKanban', () => {
    it('should parse Kanban table correctly', async () => {
      const { parseKanban } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const prompts = parseKanban(kanbanPath);

      expect(prompts).toHaveLength(5);
      expect(prompts[0].id).toBe('NP-100');
      expect(prompts[0].status).toBe('Non assegnato');
      expect(prompts[1].id).toBe('PC-200');
      expect(prompts[2].id).toBe('IV-300');
      expect(prompts[2].status).toBe('In corso');
      expect(prompts[3].id).toBe('ST-400');
      expect(prompts[3].status).toBe('Completato');
    });

    it('should extract prompt IDs from description', async () => {
      const { parseKanban } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const prompts = parseKanban(kanbanPath);

      expect(prompts[0].id).toBe('NP-100');
      expect(prompts[0].description).toContain('Test Prompt 1');
    });

    it('should handle empty Kanban', async () => {
      const emptyKanban = `# WS6 Prompt Kanban

| Prompt ID/Descrizione | Stato | Dipende da | Agente | Start Time | End Time | Duration | Est. | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
`;
      fs.writeFileSync(kanbanPath, emptyKanban, 'utf-8');

      const { parseKanban } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const prompts = parseKanban(kanbanPath);

      expect(prompts).toHaveLength(0);
    });
  });

  describe('filterPrompts', () => {
    it('should exclude "In corso" and "Completato" prompts', async () => {
      const { parseKanban, filterPrompts } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const allPrompts = parseKanban(kanbanPath);
      
      const policy = {
        minPrompts: 1,
        requireDomainDiversity: false,
        excludeStatuses: ['In corso', 'Completato'],
      };

      const filtered = filterPrompts(allPrompts, policy);

      expect(filtered).toHaveLength(3);
      expect(filtered.every(p => p.status === 'Non assegnato')).toBe(true);
    });

    it('should check domain diversity', async () => {
      const { parseKanban, filterPrompts } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const allPrompts = parseKanban(kanbanPath);
      
      const policy = {
        minPrompts: 1,
        requireDomainDiversity: true,
        excludeStatuses: ['In corso', 'Completato'],
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const filtered = filterPrompts(allPrompts, policy);

      // Should have 3 domains: NP, PC, IV (ST is excluded as Completato)
      expect(filtered).toHaveLength(3);
      
      consoleSpy.mockRestore();
    });

    it('should warn if below minimum prompts', async () => {
      const { parseKanban, filterPrompts } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const allPrompts = parseKanban(kanbanPath);
      
      const policy = {
        minPrompts: 20,
        requireDomainDiversity: false,
        excludeStatuses: ['In corso', 'Completato'],
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      filterPrompts(allPrompts, policy);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Buffer has 3 prompts (policy requires ≥20)')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('generateBufferMarkdown', () => {
    it('should generate valid markdown with prompts table', async () => {
      const { parseKanban, filterPrompts, generateBufferMarkdown } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const allPrompts = parseKanban(kanbanPath);
      
      const policy = {
        minPrompts: 1,
        requireDomainDiversity: false,
        excludeStatuses: ['In corso', 'Completato'],
      };

      const filtered = filterPrompts(allPrompts, policy);
      const markdown = generateBufferMarkdown(filtered, []);

      expect(markdown).toContain('# Prompt Quick Buffer');
      expect(markdown).toContain('**Total Ready Prompts**: 3');
      expect(markdown).toContain('## Ready Prompts');
      expect(markdown).toContain('| Prompt ID | Description | Status | Dependencies | Estimate |');
      expect(markdown).toContain('| NP-100 |');
      expect(markdown).toContain('| PC-200 |');
      expect(markdown).toContain('| NP-101 |');
    });

    it('should include changelog section', async () => {
      const { generateBufferMarkdown } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      
      const changelog = [
        {
          timestamp: '2026-01-24T10:00:00Z',
          action: 'refreshed' as const,
          promptId: 'ALL',
          reason: 'Buffer refreshed',
        },
      ];

      const markdown = generateBufferMarkdown([], changelog);

      expect(markdown).toContain('## Recent Changes');
      expect(markdown).toContain('| Timestamp | Action | Prompt ID | Reason |');
      expect(markdown).toContain('| 2026-01-24T10:00:00Z | refreshed | ALL | Buffer refreshed |');
    });

    it('should limit changelog to last 10 entries', async () => {
      const { generateBufferMarkdown } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      
      const changelog = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2026-01-24T${String(i).padStart(2, '0')}:00:00Z`,
        action: 'refreshed' as const,
        promptId: 'ALL',
        reason: `Entry ${i}`,
      }));

      const markdown = generateBufferMarkdown([], changelog);

      // Should only show last 10
      expect(markdown).toContain('Entry 14');
      expect(markdown).toContain('Entry 5');
      expect(markdown).not.toContain('Entry 4');
    });
  });

  describe('loadExistingChangelog', () => {
    it('should return empty array if buffer does not exist', async () => {
      const { loadExistingChangelog } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      const nonExistentPath = path.join(tempDir, 'nonexistent.md');
      
      const changelog = loadExistingChangelog(nonExistentPath);

      expect(changelog).toHaveLength(0);
    });

    it('should parse existing changelog from buffer file', async () => {
      const { loadExistingChangelog } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      
      const existingBuffer = `# Prompt Quick Buffer

## Recent Changes

| Timestamp | Action | Prompt ID | Reason |
| --- | --- | --- | --- |
| 2026-01-23T10:00:00Z | added | NP-100 | New prompt |
| 2026-01-23T11:00:00Z | refreshed | ALL | Buffer refresh |
`;
      fs.writeFileSync(bufferPath, existingBuffer, 'utf-8');

      const changelog = loadExistingChangelog(bufferPath);

      expect(changelog).toHaveLength(2);
      expect(changelog[0].action).toBe('added');
      expect(changelog[0].promptId).toBe('NP-100');
      expect(changelog[1].action).toBe('refreshed');
    });
  });

  describe('Integration', () => {
    it('should create buffer file with correct structure', async () => {
      const { parseKanban, filterPrompts, generateBufferMarkdown } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      
      const allPrompts = parseKanban(kanbanPath);
      const policy = {
        minPrompts: 1,
        requireDomainDiversity: false,
        excludeStatuses: ['In corso', 'Completato'],
      };
      
      const filtered = filterPrompts(allPrompts, policy);
      const markdown = generateBufferMarkdown(filtered, []);
      
      fs.writeFileSync(bufferPath, markdown, 'utf-8');

      expect(fs.existsSync(bufferPath)).toBe(true);
      
      const content = fs.readFileSync(bufferPath, 'utf-8');
      expect(content).toContain('# Prompt Quick Buffer');
      expect(content).toContain('**Total Ready Prompts**: 3');
    });

    it('should preserve changelog across refreshes', async () => {
      const { parseKanban, filterPrompts, generateBufferMarkdown, loadExistingChangelog } = await import('../../../scripts/coordinator/promptQuickBuffer.ts');
      
      // First refresh
      const allPrompts = parseKanban(kanbanPath);
      const policy = {
        minPrompts: 1,
        requireDomainDiversity: false,
        excludeStatuses: ['In corso', 'Completato'],
      };
      
      const filtered = filterPrompts(allPrompts, policy);
      const changelog1 = [
        {
          timestamp: '2026-01-24T10:00:00Z',
          action: 'refreshed' as const,
          promptId: 'ALL',
          reason: 'First refresh',
        },
      ];
      
      const markdown1 = generateBufferMarkdown(filtered, changelog1);
      fs.writeFileSync(bufferPath, markdown1, 'utf-8');

      // Second refresh - load existing changelog
      const existingChangelog = loadExistingChangelog(bufferPath);
      const changelog2 = [
        ...existingChangelog,
        {
          timestamp: '2026-01-24T11:00:00Z',
          action: 'refreshed' as const,
          promptId: 'ALL',
          reason: 'Second refresh',
        },
      ];
      
      const markdown2 = generateBufferMarkdown(filtered, changelog2);
      fs.writeFileSync(bufferPath, markdown2, 'utf-8');

      const finalContent = fs.readFileSync(bufferPath, 'utf-8');
      expect(finalContent).toContain('First refresh');
      expect(finalContent).toContain('Second refresh');
    });
  });
});
