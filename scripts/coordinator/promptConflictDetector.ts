#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { 
  PromptConflictRules,
  ConflictSeverity,
  ConflictType,
  type Conflict,
  type ConflictDetectionConfig,
  DEFAULT_CONFLICT_DETECTION_CONFIG
} from '../../src/coordinator/promptConflictRules';

/**
 * CLI tool for detecting conflicts in Kanban prompt assignments
 * 
 * Analyzes the Kanban board for file target overlaps, dependency cycles,
 * agent overloads, and other conflicts that could impact workflow efficiency.
 */

interface KanbanPrompt {
  id: string;
  name: string;
  status: string;
  agent: string;
  startDate?: string;
  updateDate?: string;
  evidence?: string;
  dependencies?: string[];
  fileTargets?: string[];
}

interface ConflictReport {
  timestamp: string;
  totalPrompts: number;
  totalConflicts: number;
  conflictScore: number;
  conflicts: Conflict[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
  dependencyGraph: DependencyGraph;
}

interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cycles: string[][];
}

interface GraphNode {
  id: string;
  label: string;
  status: string;
  agent: string;
  group: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'dependency';
}

const program = new Command();

program
  .name('prompt-conflict-detector')
  .description('Detect conflicts in Kanban prompt assignments')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze Kanban for conflicts')
  .requiredOption('-k, --kanban <path>', 'Kanban file path', 'src/docs/docs/coordinator/agent_assignments.md')
  .option('-o, --output <path>', 'Output directory', 'test-results')
  .option('-f, --format <format>', 'Output format (json|markdown|csv)', 'json')
  .option('--severity <level>', 'Minimum severity to report (low|medium|high|critical)', 'low')
  .option('--config <path>', 'Configuration file path')
  .option('--telemetry', 'Emit telemetry events', false)
  .action(async (options) => {
    try {
      console.log('🔍 Analyzing Kanban for conflicts...');
      
      // Load configuration
      const config = loadConfig(options.config);
      
      // Parse Kanban
      const prompts = parseKanban(options.kanban);
      console.log(`📋 Found ${prompts.size} prompts`);
      
      // Detect conflicts
      const rules = new PromptConflictRules(config);
      const conflicts = detectAllConflicts(rules, prompts);
      
      // Filter by severity
      const filteredConflicts = filterConflictsBySeverity(conflicts, options.severity);
      
      // Generate report
      const report = generateReport(prompts, filteredConflicts, config);
      
      // Export results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `prompt-conflict-report-${timestamp}`;
      const outputPath = join(options.output, `${filename}.${options.format}`);
      
      console.log(`💾 Saving report to ${outputPath}...`);
      
      switch (options.format) {
        case 'json':
          await exportJSON(report, outputPath);
          break;
        case 'markdown':
          await exportMarkdown(report, outputPath);
          break;
        case 'csv':
          await exportCSV(report, outputPath);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
      
      // Emit telemetry if requested
      if (options.telemetry) {
        await emitTelemetry('coordinator_prompt_conflict_detected', {
          totalPrompts: report.totalPrompts,
          totalConflicts: report.totalConflicts,
          conflictScore: report.conflictScore,
          criticalConflicts: report.summary.critical,
          outputPath,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Display summary
      console.log('✅ Analysis completed!');
      console.log(`📊 Summary: ${report.totalConflicts} conflicts detected`);
      console.log(`🔴 Critical: ${report.summary.critical}`);
      console.log(`🟠 High: ${report.summary.high}`);
      console.log(`🟡 Medium: ${report.summary.medium}`);
      console.log(`🟢 Low: ${report.summary.low}`);
      console.log(`📈 Conflict Score: ${report.conflictScore}`);
      console.log(`📄 Report saved to: ${outputPath}`);
      
      // Exit with error code if critical conflicts found
      if (report.summary.critical > 0) {
        console.log('⚠️  Critical conflicts detected - review required');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error analyzing conflicts:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate specific prompt for conflicts')
  .requiredOption('-p, --prompt <id>', 'Prompt ID to validate')
  .requiredOption('-k, --kanban <path>', 'Kanban file path')
  .option('--config <path>', 'Configuration file path')
  .action(async (options) => {
    try {
      console.log(`🔍 Validating prompt ${options.prompt}...`);
      
      const config = loadConfig(options.config);
      const prompts = parseKanban(options.kanban);
      const rules = new PromptConflictRules(config);
      
      // Find the specific prompt
      const prompt = prompts.get(options.prompt);
      if (!prompt) {
        console.error(`❌ Prompt ${options.prompt} not found`);
        process.exit(1);
      }
      
      // Create a map with just this prompt for validation
      const singlePromptMap = new Map([[options.prompt, prompt]]);
      const conflicts = detectAllConflicts(rules, singlePromptMap);
      
      if (conflicts.length === 0) {
        console.log('✅ No conflicts detected for this prompt');
      } else {
        console.log(`⚠️  ${conflicts.length} conflicts detected:`);
        conflicts.forEach(conflict => {
          console.log(`  - ${conflict.type}: ${conflict.description}`);
        });
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error validating prompt:', error);
      process.exit(1);
    }
  });

program
  .command('graph')
  .description('Generate dependency graph visualization')
  .requiredOption('-k, --kanban <path>', 'Kanban file path')
  .option('-o, --output <path>', 'Output file path', 'test-results/dependency-graph.dot')
  .option('--format <format>', 'Graph format (dot|mermaid)', 'dot')
  .action(async (options) => {
    try {
      console.log('🔍 Generating dependency graph...');
      
      const prompts = parseKanban(options.kanban);
      const graph = buildDependencyGraph(prompts);
      
      if (options.format === 'dot') {
        await exportDotGraph(graph, options.output);
      } else if (options.format === 'mermaid') {
        await exportMermaidGraph(graph, options.output);
      }
      
      console.log(`📄 Dependency graph saved to: ${options.output}`);
      console.log(`📊 Found ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
      console.log(`🔄 Detected ${graph.cycles.length} cycles`);
      
    } catch (error) {
      console.error('❌ Error generating graph:', error);
      process.exit(1);
    }
  });

/**
 * Load configuration from file
 */
function loadConfig(configPath?: string): ConflictDetectionConfig {
  if (!configPath) {
    return DEFAULT_CONFLICT_DETECTION_CONFIG;
  }
  
  try {
    const configData = JSON.parse(readFileSync(configPath, 'utf-8'));
    return configData;
  } catch (_error) {
    console.warn(`⚠️  Could not load config from ${configPath}, using defaults`);
    return DEFAULT_CONFLICT_DETECTION_CONFIG;
  }
}

/**
 * Parse Kanban markdown file
 */
function parseKanban(kanbanPath: string): Map<string, KanbanPrompt> {
  const content = readFileSync(kanbanPath, 'utf-8');
  const prompts = new Map<string, KanbanPrompt>();
  
  // Simple regex-based parsing (in production, use markdownPromptParser)
  const promptRegex = /\| (NP-\d+) – (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/g;
  
  let match;
  while ((match = promptRegex.exec(content)) !== null) {
    const [
      , id, name, status, dependencies, agent, startDate, updateDate, 
      _duration, _points, _evidenceDate, evidence
    ] = match;
    
    // Parse file targets from the prompt text section
    const fileTargets = extractFileTargets(content, id);
    
    // Parse dependencies
    const deps = dependencies !== '-' ? dependencies.split(',').map(d => d.trim()) : [];
    
    prompts.set(id, {
      id,
      name,
      status,
      agent: agent === '-' ? '' : agent,
      startDate: startDate === '-' ? undefined : startDate,
      updateDate: updateDate === '-' ? undefined : updateDate,
      evidence: evidence === '-' ? undefined : evidence,
      dependencies: deps.length > 0 ? deps : undefined,
      fileTargets: fileTargets.length > 0 ? fileTargets : undefined,
    });
  }
  
  return prompts;
}

/**
 * Extract file targets from prompt text
 */
function extractFileTargets(content: string, promptId: string): string[] {
  const lines = content.split('\n');
  let inPromptSection = false;
  const fileTargets: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes(promptId)) {
      inPromptSection = true;
      continue;
    }
    
    if (inPromptSection && line.startsWith('|')) {
      // Look for file target patterns
      if (line.includes('[esistente]') || line.includes('[nuovo]')) {
        const match = line.match(/\[.*?\] (.+?) \|/);
        if (match) {
          fileTargets.push(match[1].trim());
        }
      }
    }
    
    if (inPromptSection && line.startsWith('```')) {
      break;
    }
  }
  
  return fileTargets;
}

/**
 * Detect all conflicts using rules engine
 */
function detectAllConflicts(rules: PromptConflictRules, prompts: Map<string, KanbanPrompt>): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Convert prompts to any type for rules engine
  const promptsAny = new Map(prompts);
  
  // Run all conflict detection rules
  conflicts.push(...rules.detectFileTargetOverlaps(promptsAny));
  conflicts.push(...rules.detectDependencyCycles(promptsAny));
  conflicts.push(...rules.detectAgentOverload(promptsAny));
  conflicts.push(...rules.detectStatusInconsistencies(promptsAny));
  conflicts.push(...rules.detectMissingEvidence(promptsAny));
  conflicts.push(...rules.detectDuplicatePrompts(promptsAny));
  
  return conflicts;
}

/**
 * Filter conflicts by minimum severity
 */
function filterConflictsBySeverity(conflicts: Conflict[], minSeverity: string): Conflict[] {
  const severityOrder = [ConflictSeverity.LOW, ConflictSeverity.MEDIUM, ConflictSeverity.HIGH, ConflictSeverity.CRITICAL];
  const minIndex = severityOrder.indexOf(minSeverity as ConflictSeverity);
  
  return conflicts.filter(conflict => 
    severityOrder.indexOf(conflict.severity) >= minIndex
  );
}

/**
 * Generate comprehensive conflict report
 */
function generateReport(prompts: Map<string, KanbanPrompt>, conflicts: Conflict[], config: ConflictDetectionConfig): ConflictReport {
  const rules = new PromptConflictRules(config);
  const conflictScore = rules.getConflictScore(conflicts);
  const conflictsBySeverity = rules.getConflictsBySeverity(conflicts);
  const dependencyGraph = buildDependencyGraph(prompts);
  
  return {
    timestamp: new Date().toISOString(),
    totalPrompts: prompts.size,
    totalConflicts: conflicts.length,
    conflictScore,
    conflicts,
    summary: {
      critical: conflictsBySeverity.critical?.length || 0,
      high: conflictsBySeverity.high?.length || 0,
      medium: conflictsBySeverity.medium?.length || 0,
      low: conflictsBySeverity.low?.length || 0,
    },
    recommendations: generateRecommendations(conflicts),
    dependencyGraph,
  };
}

/**
 * Generate recommendations based on conflicts
 */
function generateRecommendations(conflicts: Conflict[]): string[] {
  const recommendations = new Set<string>();
  
  conflicts.forEach(conflict => {
    recommendations.add(conflict.recommendation);
  });
  
  // Add general recommendations
  if (conflicts.some(c => c.type === ConflictType.AGENT_OVERLOAD)) {
    recommendations.add('Consider redistributing workload among agents');
  }
  
  if (conflicts.some(c => c.type === ConflictType.FILE_TARGET_OVERLAP)) {
    recommendations.add('Review file target assignments to prevent conflicts');
  }
  
  if (conflicts.some(c => c.type === ConflictType.DEPENDENCY_CYCLE)) {
    recommendations.add('Break dependency cycles to enable proper execution order');
  }
  
  return Array.from(recommendations);
}

/**
 * Build dependency graph
 */
function buildDependencyGraph(prompts: Map<string, KanbanPrompt>): DependencyGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const cycles: string[][] = [];
  
  // Build nodes
  for (const [id, prompt] of prompts) {
    nodes.push({
      id,
      label: prompt.name,
      status: prompt.status,
      agent: prompt.agent,
      group: getAgentGroup(prompt.agent),
    });
  }
  
  // Build edges
  for (const [id, prompt] of prompts) {
    if (prompt.dependencies) {
      for (const depId of prompt.dependencies) {
        if (prompts.has(depId)) {
          edges.push({
            from: id,
            to: depId,
            type: 'dependency',
          });
        }
      }
    }
  }
  
  // Detect cycles (simplified)
  cycles.push(...detectCycles(nodes, edges));
  
  return { nodes, edges, cycles };
}

/**
 * Get agent group for graph visualization
 */
function getAgentGroup(agent: string): string {
  if (!agent || agent === '-') return 'unassigned';
  return agent.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Detect cycles in dependency graph
 */
function detectCycles(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const cycle = findCycle(node.id, nodes, edges, visited, recursionStack, []);
      if (cycle) {
        cycles.push(cycle);
      }
    }
  }
  
  return cycles;
}

/**
 * Find cycle using DFS
 */
function findCycle(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  visited: Set<string>,
  recursionStack: Set<string>,
  path: string[]
): string[] | null {
  visited.add(nodeId);
  recursionStack.add(nodeId);
  path.push(nodeId);
  
  const outgoingEdges = edges.filter(edge => edge.from === nodeId);
  for (const edge of outgoingEdges) {
    if (!visited.has(edge.to)) {
      const cycle = findCycle(edge.to, nodes, edges, visited, recursionStack, [...path]);
      if (cycle) return cycle;
    } else if (recursionStack.has(edge.to)) {
      const cycleStart = path.indexOf(edge.to);
      return path.slice(cycleStart);
    }
  }
  
  recursionStack.delete(nodeId);
  return null;
}

/**
 * Export report as JSON
 */
async function exportJSON(report: ConflictReport, outputPath: string): Promise<void> {
  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Export report as Markdown
 */
async function exportMarkdown(report: ConflictReport, outputPath: string): Promise<void> {
  const lines: string[] = [];
  
  // Header
  lines.push('# Prompt Conflict Detection Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.timestamp).toLocaleString()}`);
  lines.push(`**Total Prompts:** ${report.totalPrompts}`);
  lines.push(`**Total Conflicts:** ${report.totalConflicts}`);
  lines.push(`**Conflict Score:** ${report.conflictScore}`);
  lines.push('');
  
  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **🔴 Critical:** ${report.summary.critical}`);
  lines.push(`- **🟠 High:** ${report.summary.high}`);
  lines.push(`- **🟡 Medium:** ${report.summary.medium}`);
  lines.push(`- **🟢 Low:** ${report.summary.low}`);
  lines.push('');
  
  // Conflicts by type
  const conflictsByType = report.conflicts.reduce((acc, conflict) => {
    if (!acc[conflict.type]) acc[conflict.type] = [];
    acc[conflict.type].push(conflict);
    return acc;
  }, {} as Record<string, Conflict[]>);
  
  lines.push('## Conflicts by Type');
  lines.push('');
  
  for (const [type, typeConflicts] of Object.entries(conflictsByType)) {
    lines.push(`### ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    lines.push('');
    
    typeConflicts.forEach(conflict => {
      const severityIcon = getSeverityIcon(conflict.severity);
      lines.push(`#### ${severityIcon} ${conflict.description}`);
      lines.push('');
      lines.push(`**Severity:** ${conflict.severity}`);
      lines.push(`**Recommendation:** ${conflict.recommendation}`);
      
      if ('promptIds' in conflict) {
        lines.push(`**Affected Prompts:** ${conflict.promptIds.join(', ')}`);
      }
      if ('agent' in conflict) {
        lines.push(`**Agent:** ${conflict.agent}`);
      }
      
      lines.push('');
    });
  }
  
  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  report.recommendations.forEach(rec => {
    lines.push(`- ${rec}`);
  });
  lines.push('');
  
  // Dependency Graph
  lines.push('## Dependency Graph');
  lines.push('');
  lines.push(`- **Nodes:** ${report.dependencyGraph.nodes.length}`);
  lines.push(`- **Edges:** ${report.dependencyGraph.edges.length}`);
  lines.push(`- **Cycles:** ${report.dependencyGraph.cycles.length}`);
  
  if (report.dependencyGraph.cycles.length > 0) {
    lines.push('');
    lines.push('### Detected Cycles');
    lines.push('');
    report.dependencyGraph.cycles.forEach((cycle, index) => {
      lines.push(`${index + 1}. ${cycle.join(' → ')} → ${cycle[0]}`);
    });
  }
  
  lines.push('');
  lines.push('---');
  lines.push(`*Generated on ${new Date().toLocaleDateString()} using Prompt Conflict Detector v1.0.0*`);
  
  const markdown = lines.join('\n');
  writeFileSync(outputPath, markdown, 'utf-8');
}

/**
 * Export report as CSV
 */
async function exportCSV(report: ConflictReport, outputPath: string): Promise<void> {
  const lines: string[] = [];
  
  // Header
  lines.push('Prompt Conflict Detection Report');
  lines.push(`Generated,${new Date(report.timestamp).toISOString()}`);
  lines.push(`Total Prompts,${report.totalPrompts}`);
  lines.push(`Total Conflicts,${report.totalConflicts}`);
  lines.push(`Conflict Score,${report.conflictScore}`);
  lines.push('');
  
  // Summary
  lines.push('Summary');
  lines.push('Severity,Count');
  lines.push(`Critical,${report.summary.critical}`);
  lines.push(`High,${report.summary.high}`);
  lines.push(`Medium,${report.summary.medium}`);
  lines.push(`Low,${report.summary.low}`);
  lines.push('');
  
  // Conflicts
  lines.push('Conflicts');
  lines.push('Type,Severity,Description,Recommendation,Affected Items');
  
  report.conflicts.forEach(conflict => {
    const affectedItems = 'promptIds' in conflict 
      ? conflict.promptIds.join(';')
      : 'agent' in conflict 
        ? conflict.agent
        : ('promptId' in conflict ? conflict.promptId : '');
    
    const description = conflict.description.replace(/,/g, ';');
    const recommendation = conflict.recommendation.replace(/,/g, ';');
    
    lines.push(`${conflict.type},${conflict.severity},"${description}","${recommendation}","${affectedItems}"`);
  });
  
  const csv = lines.join('\n');
  writeFileSync(outputPath, csv, 'utf-8');
}

/**
 * Export dependency graph as DOT format
 */
async function exportDotGraph(graph: DependencyGraph, outputPath: string): Promise<void> {
  const lines: string[] = [];
  
  lines.push('digraph dependencies {');
  lines.push('  rankdir=TB;');
  lines.push('  node [shape=box, style=filled];');
  lines.push('');
  
  // Add nodes with colors based on status
  graph.nodes.forEach(node => {
    const color = getNodeColor(node.status);
    lines.push(`  "${node.id}" [label="${node.label}", fillcolor="${color}", group="${node.group}"];`);
  });
  
  lines.push('');
  
  // Add edges
  graph.edges.forEach(edge => {
    lines.push(`  "${edge.from}" -> "${edge.to}";`);
  });
  
  lines.push('}');
  
  const dot = lines.join('\n');
  writeFileSync(outputPath, dot, 'utf-8');
}

/**
 * Export dependency graph as Mermaid format
 */
async function exportMermaidGraph(graph: DependencyGraph, outputPath: string): Promise<void> {
  const lines: string[] = [];
  
  lines.push('graph TD');
  lines.push('');
  
  // Add nodes
  graph.nodes.forEach(node => {
    const status = node.status.replace(/\s+/g, '-');
    lines.push(`  ${node.id}[${node.label}]:::${status}`);
  });
  
  lines.push('');
  
  // Add edges
  graph.edges.forEach(edge => {
    lines.push(`  ${edge.from} --> ${edge.to};`);
  });
  
  lines.push('');
  
  // Add styling
  lines.push('classDef completed fill:#90EE90,stroke:#333,stroke-width:2px');
  lines.push('classDef in-corso fill:#FFD700,stroke:#333,stroke-width:2px');
  lines.push('classDef non-assegnato fill:#D3D3D3,stroke:#333,stroke-width:2px');
  lines.push('');
  
  // Apply classes
  graph.nodes.forEach(node => {
    const status = node.status.replace(/\s+/g, '-');
    lines.push(`  class ${node.id} ${status}`);
  });
  
  const mermaid = lines.join('\n');
  writeFileSync(outputPath, mermaid, 'utf-8');
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: ConflictSeverity): string {
  switch (severity) {
    case ConflictSeverity.CRITICAL: return '🔴';
    case ConflictSeverity.HIGH: return '🟠';
    case ConflictSeverity.MEDIUM: return '🟡';
    case ConflictSeverity.LOW: return '🟢';
    default: return '⚪';
  }
}

/**
 * Get node color for DOT graph
 */
function getNodeColor(status: string): string {
  switch (status) {
    case 'Completato': return 'lightgreen';
    case 'In corso': return 'gold';
    case 'Non assegnato': return 'lightgray';
    default: return 'white';
  }
}

/**
 * Emit telemetry event
 */
async function emitTelemetry(event: string, data: Record<string, unknown>): Promise<void> {
  try {
    const telemetry = {
      eventType: event,
      timestamp: new Date().toISOString(),
      data,
    };
    
    // Save telemetry to test-results
    const telemetryPath = join('test-results', `telemetry-${Date.now()}.json`);
    writeFileSync(telemetryPath, JSON.stringify(telemetry, null, 2));
    
  } catch (error) {
    console.warn('⚠️ Failed to emit telemetry:', error);
  }
}

// Parse command line arguments
program.parse();
