/**
 * Prompt Dependency Heatmap Tests - NP-146
 * 
 * Comprehensive test suite for prompt dependency analyzer.
 * 
 * @since 2026-01-24
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseKanbanFile,
  buildDependencyMatrix,
  calculateDependencyWeights,
  detectCircularDependencies,
  filterPrompts,
  calculateStats,
  analyzePromptDependencies,
  DEFAULT_DEPENDENCY_CONFIG,
  type PromptEntry,
  type DependencyConfig,
} from '@/coordinator/promptDependencyAnalyzer';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Prompt Dependency Analyzer', () => {
  const mockKanbanContent = `
| NP-001 – Test Prompt 1 | Completato | - | 2026-01-01 | Agent1 |
| NP-002 – Test Prompt 2 | In corso | NP-001 | 2026-01-02 | Agent2 |
| NP-003 – Test Prompt 3 | Non assegnato | NP-001, NP-002 | - | - |
| NP-004 – Test Prompt 4 | Completato | NP-003 | 2026-01-03 | Agent3 |
`;

  const mockPrompts: PromptEntry[] = [
    {
      id: 'NP-001',
      description: 'Test Prompt 1',
      status: 'Completato',
      dependencies: [],
    },
    {
      id: 'NP-002',
      description: 'Test Prompt 2',
      status: 'In corso',
      dependencies: ['NP-001'],
    },
    {
      id: 'NP-003',
      description: 'Test Prompt 3',
      status: 'Non assegnato',
      dependencies: ['NP-001', 'NP-002'],
    },
    {
      id: 'NP-004',
      description: 'Test Prompt 4',
      status: 'Completato',
      dependencies: ['NP-003'],
    },
  ];

  describe('parseKanbanFile', () => {
    it('should parse Kanban file correctly', async () => {
      // Create temp file
      const tempPath = path.join(process.cwd(), 'test-kanban-temp.md');
      await fs.writeFile(tempPath, mockKanbanContent, 'utf-8');

      const prompts = await parseKanbanFile(tempPath);

      expect(prompts.length).toBe(4);
      expect(prompts[0].id).toBe('NP-001');
      expect(prompts[0].description).toBe('Test Prompt 1');
      expect(prompts[0].status).toBe('Completato');
      expect(prompts[0].dependencies).toEqual([]);

      expect(prompts[1].id).toBe('NP-002');
      expect(prompts[1].dependencies).toEqual(['NP-001']);

      expect(prompts[2].id).toBe('NP-003');
      expect(prompts[2].dependencies).toEqual(['NP-001', 'NP-002']);

      // Cleanup
      await fs.unlink(tempPath);
    });

    it('should handle empty dependencies', async () => {
      const content = '| NP-001 – Test | Completato | - | 2026-01-01 | Agent1 |';
      const tempPath = path.join(process.cwd(), 'test-kanban-empty.md');
      await fs.writeFile(tempPath, content, 'utf-8');

      const prompts = await parseKanbanFile(tempPath);

      expect(prompts[0].dependencies).toEqual([]);

      await fs.unlink(tempPath);
    });
  });

  describe('buildDependencyMatrix', () => {
    it('should build correct adjacency matrix', () => {
      const { matrix, labels } = buildDependencyMatrix(mockPrompts);

      expect(labels).toEqual(['NP-001', 'NP-002', 'NP-003', 'NP-004']);
      expect(matrix.length).toBe(4);
      expect(matrix[0].length).toBe(4);

      // NP-001 has no dependencies
      expect(matrix[0]).toEqual([0, 0, 0, 0]);

      // NP-002 depends on NP-001
      expect(matrix[1][0]).toBe(1);

      // NP-003 depends on NP-001 and NP-002
      expect(matrix[2][0]).toBe(1);
      expect(matrix[2][1]).toBe(1);

      // NP-004 depends on NP-003
      expect(matrix[3][2]).toBe(1);
    });

    it('should handle prompts with no dependencies', () => {
      const prompts: PromptEntry[] = [
        { id: 'NP-001', description: 'Test', status: 'Completato', dependencies: [] },
        { id: 'NP-002', description: 'Test', status: 'Completato', dependencies: [] },
      ];

      const { matrix } = buildDependencyMatrix(prompts);

      expect(matrix).toEqual([
        [0, 0],
        [0, 0],
      ]);
    });
  });

  describe('calculateDependencyWeights', () => {
    it('should calculate weights for dependencies', () => {
      const { matrix } = buildDependencyMatrix(mockPrompts);
      const relations = calculateDependencyWeights(mockPrompts, matrix);

      expect(relations.length).toBeGreaterThan(0);

      const np002ToNp001 = relations.find(r => r.from === 'NP-002' && r.to === 'NP-001');
      expect(np002ToNp001).toBeDefined();
      expect(np002ToNp001?.weight).toBe(1);
      expect(np002ToNp001?.type).toBe('direct');
    });

    it('should return empty array for no dependencies', () => {
      const prompts: PromptEntry[] = [
        { id: 'NP-001', description: 'Test', status: 'Completato', dependencies: [] },
      ];

      const { matrix } = buildDependencyMatrix(prompts);
      const relations = calculateDependencyWeights(prompts, matrix);

      expect(relations).toEqual([]);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect circular dependencies', () => {
      const circularPrompts: PromptEntry[] = [
        { id: 'NP-001', description: 'Test', status: 'Completato', dependencies: ['NP-003'] },
        { id: 'NP-002', description: 'Test', status: 'Completato', dependencies: ['NP-001'] },
        { id: 'NP-003', description: 'Test', status: 'Completato', dependencies: ['NP-002'] },
      ];

      const { matrix } = buildDependencyMatrix(circularPrompts);
      const cycles = detectCircularDependencies(circularPrompts, matrix);

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array for no cycles', () => {
      const { matrix } = buildDependencyMatrix(mockPrompts);
      const cycles = detectCircularDependencies(mockPrompts, matrix);

      expect(cycles).toEqual([]);
    });
  });

  describe('filterPrompts', () => {
    it('should filter completed prompts', () => {
      const config: DependencyConfig = {
        ...DEFAULT_DEPENDENCY_CONFIG,
        includeCompleted: false,
      };

      const filtered = filterPrompts(mockPrompts, config);

      expect(filtered.length).toBe(2);
      expect(filtered.every(p => !p.status.includes('Completato'))).toBe(true);
    });

    it('should filter in-progress prompts', () => {
      const config: DependencyConfig = {
        ...DEFAULT_DEPENDENCY_CONFIG,
        includeInProgress: false,
      };

      const filtered = filterPrompts(mockPrompts, config);

      expect(filtered.every(p => !p.status.includes('In corso'))).toBe(true);
    });

    it('should filter non-assigned prompts', () => {
      const config: DependencyConfig = {
        ...DEFAULT_DEPENDENCY_CONFIG,
        includeNonAssigned: false,
      };

      const filtered = filterPrompts(mockPrompts, config);

      expect(filtered.every(p => !p.status.includes('Non assegnato'))).toBe(true);
    });

    it('should include all prompts with default config', () => {
      const filtered = filterPrompts(mockPrompts, DEFAULT_DEPENDENCY_CONFIG);

      expect(filtered.length).toBe(mockPrompts.length);
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const { matrix } = buildDependencyMatrix(mockPrompts);
      const relations = calculateDependencyWeights(mockPrompts, matrix);
      const cycles = detectCircularDependencies(mockPrompts, matrix);

      const stats = calculateStats(mockPrompts, relations, cycles);

      expect(stats.totalPrompts).toBe(4);
      expect(stats.totalDependencies).toBe(relations.length);
      expect(stats.avgDependenciesPerPrompt).toBeGreaterThanOrEqual(0);
      expect(stats.maxDependencies).toBe(2); // NP-003 has 2 dependencies
      expect(stats.circularDependencies).toEqual([]);
    });

    it('should handle empty prompts', () => {
      const stats = calculateStats([], [], []);

      expect(stats.totalPrompts).toBe(0);
      expect(stats.totalDependencies).toBe(0);
      expect(stats.avgDependenciesPerPrompt).toBe(0);
      expect(stats.maxDependencies).toBe(0);
    });
  });

  describe('analyzePromptDependencies', () => {
    it('should perform full analysis', async () => {
      // Create temp file
      const tempPath = path.join(process.cwd(), 'test-kanban-analysis.md');
      await fs.writeFile(tempPath, mockKanbanContent, 'utf-8');

      const result = await analyzePromptDependencies(tempPath);

      expect(result.prompts.length).toBeGreaterThan(0);
      expect(result.dependencies).toBeDefined();
      expect(result.matrix).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.stats).toBeDefined();

      expect(result.stats.totalPrompts).toBeGreaterThan(0);

      // Cleanup
      await fs.unlink(tempPath);
    });

    it('should respect configuration', async () => {
      const tempPath = path.join(process.cwd(), 'test-kanban-config.md');
      await fs.writeFile(tempPath, mockKanbanContent, 'utf-8');

      const result = await analyzePromptDependencies(tempPath, {
        includeCompleted: false,
      });

      expect(result.prompts.every(p => !p.status.includes('Completato'))).toBe(true);

      await fs.unlink(tempPath);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full workflow', async () => {
      const tempPath = path.join(process.cwd(), 'test-kanban-workflow.md');
      await fs.writeFile(tempPath, mockKanbanContent, 'utf-8');

      // Parse
      const prompts = await parseKanbanFile(tempPath);
      expect(prompts.length).toBe(4);

      // Build matrix
      const { matrix, labels } = buildDependencyMatrix(prompts);
      expect(matrix.length).toBe(prompts.length);
      expect(labels.length).toBe(prompts.length);

      // Calculate weights
      const relations = calculateDependencyWeights(prompts, matrix);
      expect(relations.length).toBeGreaterThan(0);

      // Detect cycles
      const cycles = detectCircularDependencies(prompts, matrix);
      expect(cycles).toEqual([]);

      // Calculate stats
      const stats = calculateStats(prompts, relations, cycles);
      expect(stats.totalPrompts).toBe(4);

      // Cleanup
      await fs.unlink(tempPath);
    });

    it('should handle errors gracefully', async () => {
      await expect(parseKanbanFile('/nonexistent/path.md')).rejects.toThrow();
    });
  });

  describe('Default Configuration', () => {
    it('should have valid default config', () => {
      expect(DEFAULT_DEPENDENCY_CONFIG.threshold).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_DEPENDENCY_CONFIG.threshold).toBeLessThanOrEqual(1);
      expect(DEFAULT_DEPENDENCY_CONFIG.window).toBeGreaterThan(0);
      expect(DEFAULT_DEPENDENCY_CONFIG.includeCompleted).toBe(true);
      expect(DEFAULT_DEPENDENCY_CONFIG.includeInProgress).toBe(true);
      expect(DEFAULT_DEPENDENCY_CONFIG.includeNonAssigned).toBe(false);
    });
  });
});
