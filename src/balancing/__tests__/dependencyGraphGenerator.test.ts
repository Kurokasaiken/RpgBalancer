/**
 * NP-098 – Dependency Graph Generator Unit Tests
 *
 * Comprehensive test suite for the DependencyGraphGenerator class.
 * Tests Kanban parsing, graph generation, dependency analysis, and validation.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { DependencyGraphGenerator, type KanbanTask } from '../dependencyGraphGenerator';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('DependencyGraphGenerator', () => {
  let generator: DependencyGraphGenerator;
  let mockKanbanContent: string;

  beforeEach(() => {
    generator = new DependencyGraphGenerator();
    mockKanbanContent = `
| NP-098 | Coordinator Prompt Dependency Planner | Non assegnato | Cascade | scripts/coordinator/dependencyPlanner.ts | - |
| NP-099 | Next Task | Non assegnato | User | - | NP-098 |
| NP-100 | Final Task | Completato | User | - | NP-099 |
| IV-001 | Idle Village Task | In corso | Developer | - | - |
| CF-001 | Config Balancer Task | blocked | Developer | - | NP-098 |
`;
    vi.mocked(readFileSync).mockReturnValue(mockKanbanContent);
  });

  describe('Initialization', () => {
    it('should initialize with empty task list', () => {
      expect(generator.getTasks()).toHaveLength(0);
    });

    it('should load Kanban tasks from file', () => {
      generator.loadKanbanTasks('test.md');
      const tasks = generator.getTasks();

      expect(tasks).toHaveLength(5);
      expect(tasks[0]).toMatchObject({
        id: 'NP-098',
        description: 'Coordinator Prompt Dependency Planner',
        status: 'Non assegnato',
        owner: 'Cascade',
        dependsOn: [],
      });
    });

    it('should parse different task statuses', () => {
      generator.loadKanbanTasks('test.md');
      const tasks = generator.getTasks();

      expect(tasks[0].status).toBe('Non assegnato');
      expect(tasks[2].status).toBe('Completato');
      expect(tasks[3].status).toBe('In corso');
      expect(tasks[4].status).toBe('blocked');
    });

    it('should parse dependency relationships', () => {
      generator.loadKanbanTasks('test.md');
      const tasks = generator.getTasks();

      expect(tasks[1].dependsOn).toEqual(['NP-098']);
      expect(tasks[2].dependsOn).toEqual(['NP-099']);
      expect(tasks[0].dependsOn).toEqual([]);
      expect(tasks[3].dependsOn).toEqual([]);
    });

    it('should extract domain information', () => {
      generator.loadKanbanTasks('test.md');
      const tasks = generator.getTasks();

      expect(tasks[0].domain).toBe('Coordinator');
      expect(tasks[3].domain).toBe('Idle Village');
      expect(tasks[4].domain).toBe('Balancer');
    });

    it('should extract priority information', () => {
      // Test with priority keywords in description
      const contentWithPriority = `
| NP-101 | Urgent critical task | Non assegnato | User | - | - |
| NP-102 | Normal task | Non assegnato | User | - | - |
| NP-103 | Low priority item | Non assegnato | User | - | - |
`;
      vi.mocked(readFileSync).mockReturnValue(contentWithPriority);
      generator.loadKanbanTasks('test.md');
      const tasks = generator.getTasks();

      expect(tasks[0].priority).toBe('high');
      expect(tasks[1].priority).toBe('medium');
      expect(tasks[2].priority).toBe('low');
    });
  });

  describe('Task Retrieval', () => {
    beforeEach(() => {
      generator.loadKanbanTasks('test.md');
    });

    it('should retrieve all tasks', () => {
      const tasks = generator.getTasks();
      expect(tasks).toHaveLength(5);
      expect(tasks.every(task => task.id && task.description)).toBe(true);
    });

    it('should retrieve task by ID', () => {
      const task = generator.getTaskById('NP-098');
      expect(task).toMatchObject({
        id: 'NP-098',
        description: 'Coordinator Prompt Dependency Planner',
        status: 'Non assegnato',
      });
    });

    it('should return undefined for non-existent task', () => {
      const task = generator.getTaskById('NON-EXISTENT');
      expect(task).toBeUndefined();
    });

    it('should filter tasks by status', () => {
      const pendingTasks = generator.getTasksByStatus('Non assegnato');
      const completedTasks = generator.getTasksByStatus('Completato');
      const inProgressTasks = generator.getTasksByStatus('In corso');

      expect(pendingTasks).toHaveLength(2);
      expect(completedTasks).toHaveLength(1);
      expect(inProgressTasks).toHaveLength(1);
    });

    it('should filter tasks by domain', () => {
      const coordinatorTasks = generator.getTasksByDomain('Coordinator');
      const idleVillageTasks = generator.getTasksByDomain('Idle Village');
      const balancerTasks = generator.getTasksByDomain('Balancer');

      expect(coordinatorTasks).toHaveLength(2);
      expect(idleVillageTasks).toHaveLength(1);
      expect(balancerTasks).toHaveLength(1);
    });
  });

  describe('Graph Generation', () => {
    beforeEach(() => {
      generator.loadKanbanTasks('test.md');
    });

    it('should generate basic dependency graph', () => {
      const graph = generator.generateGraph();

      expect(graph.nodes).toHaveLength(5);
      expect(graph.edges).toHaveLength(3); // NP-099 → NP-098, NP-100 → NP-099, CF-001 → NP-098

      // Check root tasks (no dependencies)
      expect(graph.metadata.rootTasks).toContain('NP-098');
      expect(graph.metadata.rootTasks).toContain('IV-001');

      // Check leaf tasks (no dependents)
      expect(graph.metadata.leafTasks).toContain('NP-100');
      expect(graph.metadata.leafTasks).toContain('IV-001');
    });

    it('should exclude completed tasks when configured', () => {
      const graph = generator.generateGraph({ includeCompleted: false });
      const completedNodes = graph.nodes.filter(node => node.status === 'completed');

      expect(completedNodes).toHaveLength(0);
    });

    it('should exclude blocked tasks when configured', () => {
      const graph = generator.generateGraph({ includeBlocked: false });
      const blockedNodes = graph.nodes.filter(node => node.status === 'blocked');

      expect(blockedNodes).toHaveLength(0);
    });

    it('should filter by domain', () => {
      const coordinatorGraph = generator.generateGraph({ domainFilter: 'Coordinator' });

      expect(coordinatorGraph.nodes.every(node => node.domain === 'Coordinator')).toBe(true);
      expect(coordinatorGraph.nodes).toHaveLength(2);
    });

    it('should respect maximum depth', () => {
      const shallowGraph = generator.generateGraph({ maxDepth: 1 });

      // Should only include tasks within depth 1 from root
      expect(shallowGraph.nodes.length).toBeLessThanOrEqual(3);
    });

    it('should generate graph with proper node properties', () => {
      const graph = generator.generateGraph();

      graph.nodes.forEach(node => {
        expect(node.id).toBeDefined();
        expect(node.label).toBeDefined();
        expect(['pending', 'in_progress', 'completed', 'blocked']).toContain(node.status);
        expect(['high', 'medium', 'low']).toContain(node.priority);
        expect(node.domain).toBeDefined();
      });
    });

    it('should generate graph with proper edge properties', () => {
      const graph = generator.generateGraph();

      graph.edges.forEach(edge => {
        expect(edge.from).toBeDefined();
        expect(edge.to).toBeDefined();
        expect(edge.type).toBe('dependency');
      });
    });
  });

  describe('Graph Metadata', () => {
    beforeEach(() => {
      generator.loadKanbanTasks('test.md');
    });

    it('should calculate accurate task counts by status', () => {
      const graph = generator.generateGraph();

      expect(graph.metadata.tasksByStatus['Non assegnato']).toBe(2);
      expect(graph.metadata.tasksByStatus['Completato']).toBe(1);
      expect(graph.metadata.tasksByStatus['In corso']).toBe(1);
      expect(graph.metadata.tasksByStatus['blocked']).toBe(1);
    });

    it('should calculate accurate task counts by domain', () => {
      const graph = generator.generateGraph();

      expect(graph.metadata.tasksByDomain['Coordinator']).toBe(2);
      expect(graph.metadata.tasksByDomain['Idle Village']).toBe(1);
      expect(graph.metadata.tasksByDomain['Balancer']).toBe(1);
      expect(graph.metadata.tasksByDomain['STS']).toBeUndefined();
    });

    it('should identify root and leaf tasks correctly', () => {
      const graph = generator.generateGraph();

      expect(graph.metadata.rootTasks).toHaveLength(2);
      expect(graph.metadata.leafTasks).toHaveLength(2);

      expect(graph.metadata.rootTasks).toContain('NP-098');
      expect(graph.metadata.rootTasks).toContain('IV-001');

      expect(graph.metadata.leafTasks).toContain('NP-100');
      expect(graph.metadata.leafTasks).toContain('IV-001');
    });

    it('should calculate maximum dependency depth', () => {
      const graph = generator.generateGraph();

      // NP-098 → NP-099 → NP-100 = depth 2
      expect(graph.metadata.maxDepth).toBe(2);
    });

    it('should identify critical path', () => {
      const graph = generator.generateGraph();

      // Should find the longest chain: NP-098 → NP-099 → NP-100
      expect(graph.metadata.criticalPath).toEqual(['NP-098', 'NP-099', 'NP-100']);
    });
  });

  describe('Graph Validation', () => {
    it('should validate acyclic graphs as valid', () => {
      generator.loadKanbanTasks('test.md');
      const validation = generator.validateGraph();

      expect(validation.valid).toBe(true);
      expect(validation.cycles).toHaveLength(0);
    });

    it('should detect dependency cycles', () => {
      // Create content with a cycle: A → B → C → A
      const cyclicContent = `
| NP-200 | Task A | Non assegnato | User | - | NP-202 |
| NP-201 | Task B | Non assegnato | User | - | NP-200 |
| NP-202 | Task C | Non assegnato | User | - | NP-201 |
`;
      vi.mocked(readFileSync).mockReturnValue(cyclicContent);
      generator.loadKanbanTasks('test.md');

      const validation = generator.validateGraph();

      expect(validation.valid).toBe(false);
      expect(validation.cycles.length).toBeGreaterThan(0);
      expect(validation.cycles[0]).toContain('NP-200');
      expect(validation.cycles[0]).toContain('NP-201');
      expect(validation.cycles[0]).toContain('NP-202');
    });

    it('should handle self-referencing dependencies', () => {
      const selfReferencingContent = `
| NP-300 | Self Task | Non assegnato | User | - | NP-300 |
`;
      vi.mocked(readFileSync).mockReturnValue(selfReferencingContent);
      generator.loadKanbanTasks('test.md');

      const validation = generator.validateGraph();

      expect(validation.valid).toBe(false);
      expect(validation.cycles.length).toBeGreaterThan(0);
    });

    it('should handle disconnected components', () => {
      const disconnectedContent = `
| NP-400 | Task A | Non assegnato | User | - | - |
| NP-401 | Task B | Non assegnato | User | - | - |
| NP-402 | Task C | Non assegnato | User | - | NP-401 |
`;
      vi.mocked(readFileSync).mockReturnValue(disconnectedContent);
      generator.loadKanbanTasks('test.md');

      const graph = generator.generateGraph();

      expect(graph.metadata.rootTasks).toHaveLength(2); // NP-400, NP-401
      expect(graph.metadata.leafTasks).toHaveLength(2); // NP-400, NP-402
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Kanban file', () => {
      vi.mocked(readFileSync).mockReturnValue('');
      generator.loadKanbanTasks('empty.md');

      const tasks = generator.getTasks();
      expect(tasks).toHaveLength(0);

      const graph = generator.generateGraph();
      expect(graph.nodes).toHaveLength(0);
      expect(graph.edges).toHaveLength(0);
    });

    it('should handle malformed table rows', () => {
      const malformedContent = `
| NP-500 | Valid Task | Non assegnato | User | - | - |
| Incomplete row |
| NP-501 | Another Task | Non assegnato |
`;
      vi.mocked(readFileSync).mockReturnValue(malformedContent);
      generator.loadKanbanTasks('malformed.md');

      const tasks = generator.getTasks();
      // Should only parse the valid complete row
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].id).toBe('NP-500');
    });

    it('should handle tasks with multiple dependencies', () => {
      const multiDepContent = `
| NP-600 | Root A | Non assegnato | User | - | - |
| NP-601 | Root B | Non assegnato | User | - | - |
| NP-602 | Combined | Non assegnato | User | - | NP-600, NP-601 |
`;
      vi.mocked(readFileSync).mockReturnValue(multiDepContent);
      generator.loadKanbanTasks('multi.md');

      const graph = generator.generateGraph();

      expect(graph.edges).toHaveLength(2);
      expect(graph.edges.some(e => e.from === 'NP-600' && e.to === 'NP-602')).toBe(true);
      expect(graph.edges.some(e => e.from === 'NP-601' && e.to === 'NP-602')).toBe(true);
    });

    it('should handle tasks with complex dependency chains', () => {
      const complexContent = `
| NP-700 | Level 0 | Non assegnato | User | - | - |
| NP-701 | Level 1A | Non assegnato | User | - | NP-700 |
| NP-702 | Level 1B | Non assegnato | User | - | NP-700 |
| NP-703 | Level 2 | Non assegnato | User | - | NP-701, NP-702 |
| NP-704 | Level 3 | Non assegnato | User | - | NP-703 |
`;
      vi.mocked(readFileSync).mockReturnValue(complexContent);
      generator.loadKanbanTasks('complex.md');

      const graph = generator.generateGraph();

      expect(graph.metadata.maxDepth).toBe(3);
      expect(graph.metadata.rootTasks).toEqual(['NP-700']);
      expect(graph.metadata.leafTasks).toEqual(['NP-704']);
    });

    it('should handle tasks with missing dependency targets', () => {
      const missingDepContent = `
| NP-800 | Valid Task | Non assegnato | User | - | - |
| NP-801 | Task with missing dep | Non assegnato | User | - | NP-999 |
`;
      vi.mocked(readFileSync).mockReturnValue(missingDepContent);
      generator.loadKanbanTasks('missing.md');

      const graph = generator.generateGraph();

      // Should only include edges for existing tasks
      expect(graph.edges).toHaveLength(0);
      expect(graph.nodes).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should handle large Kanban files efficiently', () => {
      // Generate a large mock Kanban file
      const largeContent = Array.from({ length: 100 }, (_, i) => {
        const id = `NP-${String(i + 900).padStart(3, '0')}`;
        const dependsOn = i > 0 ? `NP-${String(i + 899).padStart(3, '0')}` : '-';
        return `| ${id} | Task ${i} | Non assegnato | User | - | ${dependsOn} |`;
      }).join('\n');

      vi.mocked(readFileSync).mockReturnValue(largeContent);

      const startTime = Date.now();
      generator.loadKanbanTasks('large.md');
      const loadTime = Date.now() - startTime;

      expect(generator.getTasks()).toHaveLength(100);
      expect(loadTime).toBeLessThan(1000); // Should load in under 1 second

      const graphStartTime = Date.now();
      const graph = generator.generateGraph();
      const graphTime = Date.now() - graphStartTime;

      expect(graph.nodes).toHaveLength(100);
      expect(graph.edges).toHaveLength(99);
      expect(graphTime).toBeLessThan(500); // Should generate graph in under 500ms
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => generator.loadKanbanTasks('nonexistent.md')).toThrow('Failed to load Kanban tasks');
    });

    it('should handle invalid task IDs gracefully', () => {
      const invalidIdContent = `
| INVALID-ID | Task with invalid ID | Non assegnato | User | - | - |
| NP-900 | Valid task | Non assegnato | User | - | - |
`;
      vi.mocked(readFileSync).mockReturnValue(invalidIdContent);
      generator.loadKanbanTasks('invalid.md');

      const tasks = generator.getTasks();
      // Should only include valid tasks
      expect(tasks.some(t => t.id === 'NP-900')).toBe(true);
      expect(tasks.every(t => t.id.startsWith('NP-') || t.id.startsWith('IV-') || t.id.startsWith('ST-') || t.id.startsWith('CF-') || t.id.startsWith('KS-'))).toBe(true);
    });
  });
});
