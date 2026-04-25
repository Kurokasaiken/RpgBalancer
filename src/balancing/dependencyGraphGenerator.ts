/**
 * NP-098 – Coordinator Prompt Dependency Planner
 *
 * Core dependency graph generator for Kanban prompt dependencies.
 * Analyzes agent assignments, builds dependency graphs, and generates visualizations.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Kanban task entry from agent assignments
 */
export interface KanbanTask {
  /** Task ID (e.g., "NP-098") */
  id: string;
  /** Task description */
  description: string;
  /** Current status */
  status: 'Non assegnato' | 'In corso' | 'Completato' | 'blocked';
  /** Owner/agent assigned */
  owner: string;
  /** Files/directories affected */
  files: string;
  /** Dependencies (comma-separated IDs) */
  dependsOn: string[];
  /** Priority level (extracted from description if available) */
  priority: 'high' | 'medium' | 'low';
  /** Domain category */
  domain: 'Idle Village' | 'STS' | 'Balancer' | 'Coordinator' | 'Other';
}

/**
 * Dependency graph node
 */
export interface GraphNode {
  /** Task ID */
  id: string;
  /** Task label */
  label: string;
  /** Node status for visualization */
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  /** Node priority for styling */
  priority: 'high' | 'medium' | 'low';
  /** Node domain for coloring */
  domain: string;
  /** Position in graph (calculated) */
  x?: number;
  y?: number;
}

/**
 * Dependency graph edge
 */
export interface GraphEdge {
  /** Source task ID */
  from: string;
  /** Target task ID */
  to: string;
  /** Edge label (optional) */
  label?: string;
  /** Edge type for styling */
  type: 'dependency' | 'blocking';
}

/**
 * Complete dependency graph
 */
export interface DependencyGraph {
  /** Graph nodes */
  nodes: GraphNode[];
  /** Graph edges */
  edges: GraphEdge[];
  /** Graph metadata */
  metadata: {
    /** Total tasks */
    totalTasks: number;
    /** Tasks by status */
    tasksByStatus: Record<string, number>;
    /** Tasks by domain */
    tasksByDomain: Record<string, number>;
    /** Critical path tasks */
    criticalPath: string[];
    /** Longest dependency chain */
    maxDepth: number;
    /** Tasks with no dependencies */
    rootTasks: string[];
    /** Tasks with no dependents */
    leafTasks: string[];
  };
}

/**
 * Graph generation configuration
 */
export interface GraphConfig {
  /** Include completed tasks */
  includeCompleted: boolean;
  /** Include blocked tasks */
  includeBlocked: boolean;
  /** Maximum graph depth */
  maxDepth: number;
  /** Focus on specific domain */
  domainFilter?: string;
  /** Focus on specific task ID */
  focusTask?: string;
  /** Include only critical path */
  criticalPathOnly: boolean;
}

/**
 * Dependency Graph Generator
 */
export class DependencyGraphGenerator {
  private kanbanTasks: KanbanTask[] = [];

  /**
   * Load Kanban tasks from agent assignments file
   */
  loadKanbanTasks(filePath: string = 'src/docs/docs/coordinator/agent_assignments.md'): void {
    try {
      const content = readFileSync(filePath, 'utf8');
      this.kanbanTasks = this.parseKanbanTasks(content);
    } catch (error) {
      throw new Error(`Failed to load Kanban tasks: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Parse Kanban tasks from markdown content
   */
  private parseKanbanTasks(content: string): KanbanTask[] {
    const tasks: KanbanTask[] = [];
    const lines = content.split('\n');

    // Find table rows (skip header)
    let inTable = false;
    for (const line of lines) {
      if (line.includes('| NP-') && line.includes('| Non assegnato') || line.includes('| In corso') || line.includes('| Completato')) {
        inTable = true;
        const task = this.parseTableRow(line);
        if (task) {
          tasks.push(task);
        }
      } else if (inTable && line.trim() === '') {
        break; // End of table
      }
    }

    return tasks;
  }

  /**
   * Parse a single table row into a Kanban task
   */
  private parseTableRow(line: string): KanbanTask | null {
    // Split by | and clean up
    const columns = line.split('|').map(col => col.trim()).slice(1, -1); // Remove first and last empty columns

    if (columns.length < 6) return null;

    const [id, description, status, owner, files, dependsOn] = columns;

    // Skip header row
    if (id === 'Prompt ID' || !id.startsWith('NP-') && !id.startsWith('KS-') && !id.startsWith('IV-') && !id.startsWith('ST-') && !id.startsWith('CF-')) {
      return null;
    }

    return {
      id,
      description,
      status: this.parseStatus(status),
      owner: owner || 'Unassigned',
      files: files || '',
      dependsOn: this.parseDependencies(dependsOn),
      priority: this.extractPriority(description),
      domain: this.extractDomain(description, id),
    };
  }

  /**
   * Parse status string
   */
  private parseStatus(status: string): KanbanTask['status'] {
    if (status.includes('Non assegnato')) return 'Non assegnato';
    if (status.includes('In corso')) return 'In corso';
    if (status.includes('Completato')) return 'Completato';
    if (status.includes('blocked')) return 'blocked';
    return 'Non assegnato'; // Default
  }

  /**
   * Parse dependency string
   */
  private parseDependencies(deps: string): string[] {
    if (!deps || deps === '-' || deps.trim() === '') return [];

    // Handle different formats: "NP-123, NP-124" or "dipende da NP-123"
    const cleaned = deps.replace(/^dipende da\s+/i, '').replace(/^depends?\s+/i, '');
    return cleaned.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0);
  }

  /**
   * Extract priority from description
   */
  private extractPriority(description: string): 'high' | 'medium' | 'low' {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('urgent') || lowerDesc.includes('critical') || lowerDesc.includes('high priority')) {
      return 'high';
    }
    if (lowerDesc.includes('medium') || lowerDesc.includes('normal')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Extract domain from description and ID
   */
  private extractDomain(description: string, id: string): KanbanTask['domain'] {
    const lowerDesc = description.toLowerCase();

    if (id.startsWith('IV-') || lowerDesc.includes('idle village')) return 'Idle Village';
    if (id.startsWith('ST-') || id.startsWith('STS') || lowerDesc.includes('sts') || lowerDesc.includes('simulator')) return 'STS';
    if (id.startsWith('CF-') || lowerDesc.includes('config') || lowerDesc.includes('balancer')) return 'Balancer';
    if (id.startsWith('KS-') || lowerDesc.includes('coordinator') || lowerDesc.includes('kanban')) return 'Coordinator';

    return 'Other';
  }

  /**
   * Generate dependency graph with given configuration
   */
  generateGraph(config: Partial<GraphConfig> = {}): DependencyGraph {
    const fullConfig: GraphConfig = {
      includeCompleted: false,
      includeBlocked: false,
      maxDepth: 10,
      criticalPathOnly: false,
      ...config,
    };

    // Filter tasks based on config
    const filteredTasks = this.kanbanTasks.filter(task => {
      if (!fullConfig.includeCompleted && task.status === 'Completato') return false;
      if (!fullConfig.includeBlocked && task.status === 'blocked') return false;
      if (fullConfig.domainFilter && task.domain !== fullConfig.domainFilter) return false;
      return true;
    });

    // Build nodes
    const nodes: GraphNode[] = filteredTasks.map(task => ({
      id: task.id,
      label: `${task.id}\n${task.description.substring(0, 30)}${task.description.length > 30 ? '...' : ''}`,
      status: this.mapStatus(task.status),
      priority: task.priority,
      domain: task.domain,
    }));

    // Build edges
    const edges: GraphEdge[] = [];
    const taskMap = new Map(filteredTasks.map(task => [task.id, task]));

    for (const task of filteredTasks) {
      for (const depId of task.dependsOn) {
        const depTask = taskMap.get(depId);
        if (depTask && filteredTasks.some(t => t.id === depId)) {
          edges.push({
            from: depId,
            to: task.id,
            type: 'dependency',
          });
        }
      }
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(filteredTasks, edges);

    return {
      nodes,
      edges,
      metadata,
    };
  }

  /**
   * Map Kanban status to graph status
   */
  private mapStatus(status: KanbanTask['status']): GraphNode['status'] {
    switch (status) {
      case 'Non assegnato': return 'pending';
      case 'In corso': return 'in_progress';
      case 'Completato': return 'completed';
      case 'blocked': return 'blocked';
      default: return 'pending';
    }
  }

  /**
   * Calculate graph metadata
   */
  private calculateMetadata(tasks: KanbanTask[], edges: GraphEdge[]): DependencyGraph['metadata'] {
    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByDomain = tasks.reduce((acc, task) => {
      acc[task.domain] = (acc[task.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const { rootTasks, leafTasks, maxDepth, criticalPath } = this.analyzeGraphStructure(tasks, edges);

    return {
      totalTasks: tasks.length,
      tasksByStatus,
      tasksByDomain,
      criticalPath,
      maxDepth,
      rootTasks,
      leafTasks,
    };
  }

  /**
   * Analyze graph structure for metadata
   */
  private analyzeGraphStructure(tasks: KanbanTask[], edges: GraphEdge[]): {
    rootTasks: string[];
    leafTasks: string[];
    maxDepth: number;
    criticalPath: string[];
  } {
    const taskIds = new Set(tasks.map(t => t.id));
    const incoming = new Map<string, string[]>();
    const outgoing = new Map<string, string[]>();

    // Initialize maps
    for (const taskId of taskIds) {
      incoming.set(taskId, []);
      outgoing.set(taskId, []);
    }

    // Build adjacency lists
    for (const edge of edges) {
      if (taskIds.has(edge.from) && taskIds.has(edge.to)) {
        incoming.get(edge.to)!.push(edge.from);
        outgoing.get(edge.from)!.push(edge.to);
      }
    }

    // Find root tasks (no incoming edges)
    const rootTasks = Array.from(taskIds).filter(id => incoming.get(id)!.length === 0);

    // Find leaf tasks (no outgoing edges)
    const leafTasks = Array.from(taskIds).filter(id => outgoing.get(id)!.length === 0);

    // Calculate maximum depth using topological sort
    const maxDepth = this.calculateMaxDepth(rootTasks, outgoing);

    // Find critical path (simplified - just longest chain)
    const criticalPath = this.findCriticalPath(rootTasks, outgoing);

    return { rootTasks, leafTasks, maxDepth, criticalPath };
  }

  /**
   * Calculate maximum depth from root tasks
   */
  private calculateMaxDepth(rootTasks: string[], outgoing: Map<string, string[]>): number {
    const depths = new Map<string, number>();

    const calculateDepth = (taskId: string): number => {
      if (depths.has(taskId)) return depths.get(taskId)!;

      const children = outgoing.get(taskId) || [];
      if (children.length === 0) {
        depths.set(taskId, 0);
        return 0;
      }

      const childDepths = children.map(calculateDepth);
      const maxChildDepth = Math.max(...childDepths);
      const depth = maxChildDepth + 1;
      depths.set(taskId, depth);
      return depth;
    };

    let maxDepth = 0;
    for (const rootTask of rootTasks) {
      maxDepth = Math.max(maxDepth, calculateDepth(rootTask));
    }

    return maxDepth;
  }

  /**
   * Find critical path (simplified longest chain)
   */
  private findCriticalPath(rootTasks: string[], outgoing: Map<string, string[]>): string[] {
    const paths: string[][] = [];

    const buildPaths = (currentPath: string[]): void => {
      const lastTask = currentPath[currentPath.length - 1];
      const children = outgoing.get(lastTask) || [];

      if (children.length === 0) {
        paths.push([...currentPath]);
        return;
      }

      for (const child of children) {
        if (!currentPath.includes(child)) { // Avoid cycles
          buildPaths([...currentPath, child]);
        }
      }
    };

    for (const rootTask of rootTasks) {
      buildPaths([rootTask]);
    }

    // Return longest path
    return paths.reduce((longest, current) =>
      current.length > longest.length ? current : longest,
      [] as string[]
    );
  }

  /**
   * Get all loaded tasks
   */
  getTasks(): KanbanTask[] {
    return [...this.kanbanTasks];
  }

  /**
   * Get task by ID
   */
  getTaskById(id: string): KanbanTask | undefined {
    return this.kanbanTasks.find(task => task.id === id);
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: KanbanTask['status']): KanbanTask[] {
    return this.kanbanTasks.filter(task => task.status === status);
  }

  /**
   * Get tasks by domain
   */
  getTasksByDomain(domain: KanbanTask['domain']): KanbanTask[] {
    return this.kanbanTasks.filter(task => task.domain === domain);
  }

  /**
   * Validate graph for cycles
   */
  validateGraph(): { valid: boolean; cycles: string[][] } {
    const graph = this.generateGraph({ includeCompleted: true, includeBlocked: true });
    return this.detectCycles(graph);
  }

  /**
   * Detect cycles in dependency graph
   */
  private detectCycles(graph: DependencyGraph): { valid: boolean; cycles: string[][] } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        // Found cycle
        const cycleStart = path.indexOf(nodeId);
        cycles.push([...path.slice(cycleStart), nodeId]);
        return true;
      }

      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = graph.edges.filter(edge => edge.from === nodeId);
      for (const edge of outgoingEdges) {
        if (dfs(edge.to, [...path, nodeId])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return { valid: cycles.length === 0, cycles };
  }
}
