/**
 * Prompt Dependency Analyzer - NP-146
 * 
 * Config-first analyzer for coordinator prompt dependencies.
 * Reads dependencies from Kanban and generates heatmap data.
 * 
 * @since 2026-01-24
 */

import { z } from 'zod';
import * as fs from 'fs/promises';

/**
 * Dependency analysis configuration
 */
export const DependencyConfigSchema = z.object({
  threshold: z.number().min(0).max(1).default(0.1),
  window: z.number().positive().default(30),
  includeCompleted: z.boolean().default(true),
  includeInProgress: z.boolean().default(true),
  includeNonAssigned: z.boolean().default(false),
});

export type DependencyConfig = z.infer<typeof DependencyConfigSchema>;

/**
 * Prompt entry
 */
export interface PromptEntry {
  id: string;
  description: string;
  status: string;
  dependencies: string[];
  agent?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * Dependency relationship
 */
export interface DependencyRelation {
  from: string;
  to: string;
  weight: number;
  type: 'direct' | 'transitive';
}

/**
 * Heatmap data
 */
export interface HeatmapData {
  prompts: PromptEntry[];
  dependencies: DependencyRelation[];
  matrix: number[][];
  labels: string[];
  stats: {
    totalPrompts: number;
    totalDependencies: number;
    avgDependenciesPerPrompt: number;
    maxDependencies: number;
    circularDependencies: string[][];
  };
}

/**
 * Default configuration
 */
export const DEFAULT_DEPENDENCY_CONFIG: DependencyConfig = {
  threshold: 0.1,
  window: 30,
  includeCompleted: true,
  includeInProgress: true,
  includeNonAssigned: false,
};

/**
 * Parse Kanban file to extract prompt entries
 */
export async function parseKanbanFile(filePath: string): Promise<PromptEntry[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const prompts: PromptEntry[] = [];
  let currentPrompt: Partial<PromptEntry> | null = null;
  
  for (const line of lines) {
    // Match prompt line: | NP-XXX – Description | Status | Dependencies | ...
    const promptMatch = line.match(/^\|\s*(NP-\d+)\s*–\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/);
    
    if (promptMatch) {
      if (currentPrompt && currentPrompt.id) {
        prompts.push(currentPrompt as PromptEntry);
      }
      
      const [, id, description, status, deps] = promptMatch;
      
      // Parse dependencies
      const dependencies: string[] = [];
      if (deps && deps.trim() !== '-') {
        const depMatches = deps.matchAll(/NP-\d+/g);
        for (const match of depMatches) {
          dependencies.push(match[0]);
        }
      }
      
      currentPrompt = {
        id: id.trim(),
        description: description.trim(),
        status: status.trim(),
        dependencies,
      };
    }
  }
  
  // Add last prompt
  if (currentPrompt && currentPrompt.id) {
    prompts.push(currentPrompt as PromptEntry);
  }
  
  return prompts;
}

/**
 * Build dependency matrix
 */
export function buildDependencyMatrix(prompts: PromptEntry[]): {
  matrix: number[][];
  labels: string[];
} {
  const labels = prompts.map(p => p.id);
  const size = prompts.length;
  const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Build adjacency matrix
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    
    for (const dep of prompt.dependencies) {
      const depIndex = prompts.findIndex(p => p.id === dep);
      if (depIndex >= 0) {
        matrix[i][depIndex] = 1;
      }
    }
  }
  
  return { matrix, labels };
}

/**
 * Calculate dependency weights
 */
export function calculateDependencyWeights(
  prompts: PromptEntry[],
  matrix: number[][]
): DependencyRelation[] {
  const relations: DependencyRelation[] = [];
  
  for (let i = 0; i < prompts.length; i++) {
    for (let j = 0; j < prompts.length; j++) {
      if (matrix[i][j] > 0) {
        // Calculate weight based on dependency depth
        const weight = matrix[i][j];
        
        relations.push({
          from: prompts[i].id,
          to: prompts[j].id,
          weight,
          type: 'direct',
        });
      }
    }
  }
  
  return relations;
}

/**
 * Detect circular dependencies
 */
export function detectCircularDependencies(
  prompts: PromptEntry[],
  matrix: number[][]
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<number>();
  const recStack = new Set<number>();
  
  function dfs(node: number, path: number[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);
    
    for (let i = 0; i < matrix[node].length; i++) {
      if (matrix[node][i] > 0) {
        if (!visited.has(i)) {
          dfs(i, [...path]);
        } else if (recStack.has(i)) {
          // Found cycle
          const cycleStart = path.indexOf(i);
          const cycle = path.slice(cycleStart).map(idx => prompts[idx].id);
          cycle.push(prompts[i].id);
          cycles.push(cycle);
        }
      }
    }
    
    recStack.delete(node);
  }
  
  for (let i = 0; i < prompts.length; i++) {
    if (!visited.has(i)) {
      dfs(i, []);
    }
  }
  
  return cycles;
}

/**
 * Filter prompts by configuration
 */
export function filterPrompts(
  prompts: PromptEntry[],
  config: DependencyConfig
): PromptEntry[] {
  return prompts.filter(prompt => {
    const status = prompt.status.toLowerCase();
    
    if (status.includes('completato') && !config.includeCompleted) {
      return false;
    }
    
    if (status.includes('in corso') && !config.includeInProgress) {
      return false;
    }
    
    if (status.includes('non assegnato') && !config.includeNonAssigned) {
      return false;
    }
    
    return true;
  });
}

/**
 * Calculate statistics
 */
export function calculateStats(
  prompts: PromptEntry[],
  dependencies: DependencyRelation[],
  circularDeps: string[][]
): HeatmapData['stats'] {
  const depCounts = prompts.map(p => p.dependencies.length);
  
  return {
    totalPrompts: prompts.length,
    totalDependencies: dependencies.length,
    avgDependenciesPerPrompt: depCounts.reduce((a, b) => a + b, 0) / prompts.length || 0,
    maxDependencies: Math.max(...depCounts, 0),
    circularDependencies: circularDeps,
  };
}

/**
 * Analyze prompt dependencies
 */
export async function analyzePromptDependencies(
  kanbanPath: string,
  config: Partial<DependencyConfig> = {}
): Promise<HeatmapData> {
  const fullConfig = { ...DEFAULT_DEPENDENCY_CONFIG, ...config };
  
  // Parse Kanban file
  const allPrompts = await parseKanbanFile(kanbanPath);
  
  // Filter prompts
  const prompts = filterPrompts(allPrompts, fullConfig);
  
  // Build dependency matrix
  const { matrix, labels } = buildDependencyMatrix(prompts);
  
  // Calculate weights
  const dependencies = calculateDependencyWeights(prompts, matrix);
  
  // Detect circular dependencies
  const circularDeps = detectCircularDependencies(prompts, matrix);
  
  // Calculate statistics
  const stats = calculateStats(prompts, dependencies, circularDeps);
  
  return {
    prompts,
    dependencies,
    matrix,
    labels,
    stats,
  };
}

/**
 * Export heatmap data to JSON
 */
export async function exportToJSON(
  data: HeatmapData,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(outputPath, json, 'utf-8');
}

/**
 * Export heatmap data to Markdown
 */
export async function exportToMarkdown(
  data: HeatmapData,
  outputPath: string
): Promise<void> {
  const lines: string[] = [];
  
  lines.push('# Prompt Dependency Heatmap');
  lines.push('');
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push('');
  
  // Statistics
  lines.push('## Statistics');
  lines.push('');
  lines.push(`- **Total Prompts**: ${data.stats.totalPrompts}`);
  lines.push(`- **Total Dependencies**: ${data.stats.totalDependencies}`);
  lines.push(`- **Avg Dependencies per Prompt**: ${data.stats.avgDependenciesPerPrompt.toFixed(2)}`);
  lines.push(`- **Max Dependencies**: ${data.stats.maxDependencies}`);
  lines.push(`- **Circular Dependencies**: ${data.stats.circularDependencies.length}`);
  lines.push('');
  
  // Circular dependencies
  if (data.stats.circularDependencies.length > 0) {
    lines.push('## Circular Dependencies');
    lines.push('');
    
    for (const cycle of data.stats.circularDependencies) {
      lines.push(`- ${cycle.join(' → ')}`);
    }
    
    lines.push('');
  }
  
  // Top dependencies
  lines.push('## Top Dependencies');
  lines.push('');
  
  const promptDeps = data.prompts
    .map(p => ({ id: p.id, count: p.dependencies.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  for (const { id, count } of promptDeps) {
    lines.push(`- **${id}**: ${count} dependencies`);
  }
  
  lines.push('');
  
  // Dependency matrix (simplified)
  lines.push('## Dependency Matrix');
  lines.push('');
  lines.push('```');
  
  const maxPrompts = 20;
  const displayPrompts = data.prompts.slice(0, maxPrompts);
  
  // Header
  const header = '     ' + displayPrompts.map(p => p.id.padEnd(8)).join(' ');
  lines.push(header);
  
  // Rows
  for (let i = 0; i < displayPrompts.length; i++) {
    const row = displayPrompts[i].id.padEnd(5);
    const cells = displayPrompts.map((_, j) => {
      const val = data.matrix[i][j];
      return (val > 0 ? '█' : '·').padEnd(8);
    }).join(' ');
    
    lines.push(row + cells);
  }
  
  if (data.prompts.length > maxPrompts) {
    lines.push(`... (${data.prompts.length - maxPrompts} more prompts)`);
  }
  
  lines.push('```');
  lines.push('');
  
  await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
}
