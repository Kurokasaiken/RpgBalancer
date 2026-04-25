#!/usr/bin/env tsx

/**
 * NP-169 – Coordinator Dependency Graph Export Script
 *
 * Generates visual dependency graphs from DependencyGraphGenerator with configurable layouts.
 * Exports SVG, PNG, and JSON metadata with telemetry integration.
 *
 * Usage:
 *   npm run dependency-graph-export
 *   npm run dependency-graph-export --preset detailed
 *   npm run dependency-graph-export --layout LR --output-dir ./exports
 *
 * @since 2026-01-24
 * @author Atlas-Coordinator
 */

import { join } from 'path';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import type { DependencyGraph, GraphNode, GraphEdge } from '../../balancing/dependencyGraphGenerator';
import {
  DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG,
  DEPENDENCY_GRAPH_VIZ_PRESETS,
  type DependencyGraphVizConfig,
  validateDependencyGraphVizConfig,
} from '../dependencyGraphVizConfig';

/**
 * Export statistics
 */
interface ExportStats {
  totalNodes: number;
  totalEdges: number;
  nodesByStatus: Record<string, number>;
  nodesByDomain: Record<string, number>;
  nodesByPriority: Record<string, number>;
  criticalPath: string[];
  orphanedNodes: string[];
  circularDependencies: string[][];
}

/**
 * Export metadata
 */
interface ExportMetadata {
  timestamp: number;
  config: DependencyGraphVizConfig;
  stats: ExportStats;
  graph: DependencyGraph;
  files: {
    svg?: string;
    png?: string;
    json?: string;
  };
  telemetry: {
    eventType: string;
    data: any;
  };
}

/**
 * Command line options
 */
interface CLIOptions {
  preset?: keyof typeof DEPENDENCY_GRAPH_VIZ_PRESETS;
  layout?: string;
  outputDir?: string;
  prefix?: string;
  format?: 'svg' | 'png' | 'json' | 'all';
  verbose?: boolean;
  help?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--preset':
        options.preset = args[++i] as keyof typeof DEPENDENCY_GRAPH_VIZ_PRESETS;
        break;
      case '--layout':
        options.layout = args[++i];
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--prefix':
        options.prefix = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'svg' | 'png' | 'json' | 'all';
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }
  
  return options;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Dependency Graph Export Script

Usage: npm run dependency-graph-export [options]

Options:
  --preset <name>        Use preset configuration (compact, detailed, mobile, print)
  --layout <direction>    Graph layout direction (TB, LR, BT, RL)
  --output-dir <path>     Output directory for generated files
  --prefix <name>         File name prefix
  --format <type>         Output format (svg, png, json, all)
  --verbose               Enable verbose logging
  --help                  Show this help message

Examples:
  npm run dependency-graph-export
  npm run dependency-graph-export --preset detailed
  npm run dependency-graph-export --layout LR --format svg
  npm run dependency-graph-export --output-dir ./exports --prefix my-graph

Presets:
  compact    - Compact view for quick overview
  detailed   - Detailed view for analysis
  mobile     - Mobile-friendly view
  print      - Print-friendly view
`);
}

/**
 * Get preset configuration by name
 */
function getDependencyGraphVizPreset(
  presetName: keyof typeof DEPENDENCY_GRAPH_VIZ_PRESETS
): DependencyGraphVizConfig {
  return DEPENDENCY_GRAPH_VIZ_PRESETS[presetName];
}

/**
 * Load dependency graph from generator
 */
async function loadDependencyGraph(): Promise<DependencyGraph> {
  try {
    // Import the dependency graph generator
    const generatorPath = join(__dirname, '../../balancing/dependencyGraphGenerator');
    const generatorModule = await import(generatorPath);
    const { DependencyGraphGenerator } = generatorModule;
    
    const generator = new DependencyGraphGenerator();
    return generator.generateGraph();
  } catch (error) {
    console.error('Failed to load dependency graph:', error);
    process.exit(1);
  }
}

/**
 * Generate Graphviz DOT file content
 */
function generateDotFile(graph: DependencyGraph, config: DependencyGraphVizConfig): string {
  let dot = `digraph DependencyGraph {
  rankdir=${config.layout};
  ranksep=${config.rankSep};
  nodesep=${config.nodeSep};
  fontname="${config.nodeStyle.fontName}";
  fontsize=${config.nodeStyle.fontSize};
  splines=ortho;
  node [shape=${config.nodeStyle.shape}, style=${config.nodeStyle.style}, fontname="${config.nodeStyle.fontName}", fontsize=${config.nodeStyle.fontSize}];\n`;
  
  // Add domain clusters if enabled
  if (config.clusterByDomain) {
    const domains = [...new Set(graph.nodes.map(node => node.domain))];
    
    for (const domain of domains) {
      const domainColor = config.domainColors[domain as keyof typeof config.domainColors] || config.domainColors.Other;
      dot += `  subgraph cluster_${domain.replace(/\s+/g, '_')} {
    label="${domain}";
    style=filled;
    color="${domainColor}";
    fillcolor="${domainColor}20";
    fontcolor="${domainColor}";
    fontsize=14;\n`;
      
      const domainNodes = graph.nodes.filter(node => node.domain === domain);
      for (const node of domainNodes) {
        dot += generateNodeDot(node, config);
      }
      
      dot += '  }\n';
    }
  } else {
    // Add nodes without clustering
    for (const node of graph.nodes) {
      dot += generateNodeDot(node, config);
    }
  }
  
  // Add edges
  for (const edge of graph.edges) {
    dot += generateEdgeDot(edge, config);
  }
  
  dot += '}\n';
  return dot;
}

/**
 * Generate DOT for a single node
 */
function generateNodeDot(node: GraphNode, config: DependencyGraphVizConfig): string {
  const statusColor = config.statusColors[node.status] || config.statusColors.pending;
  const domainColor = config.domainColors[node.domain as keyof typeof config.domainColors] || config.domainColors.Other;
  
  let label = node.label;
  
  if (config.showStatus && config.showPriority && config.showDomain) {
    const statusIcon = getNodeStatusIcon(node.status);
    const priorityIcon = getPriorityIcon(node.priority);
    label = `<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
      <TR><TD>${statusIcon} ${priorityIcon} ${node.label}</TD></TR>
      <TR><TD><FONT COLOR="${domainColor}" POINT-SIZE="9">${node.domain}</FONT></TD></TR>
    </TABLE>>`;
  } else if (config.showStatus && config.showPriority) {
    const statusIcon = getNodeStatusIcon(node.status);
    const priorityIcon = getPriorityIcon(node.priority);
    label = `${statusIcon} ${priorityIcon} ${node.label}`;
  } else if (config.showStatus) {
    const statusIcon = getNodeStatusIcon(node.status);
    label = `${statusIcon} ${node.label}`;
  } else if (config.showPriority) {
    const priorityIcon = getPriorityIcon(node.priority);
    label = `${priorityIcon} ${node.label}`;
  }
  
  return `    "${node.id}" [label=${label}, fillcolor="${statusColor}", fontcolor="${config.nodeStyle.fontColor}"];\n`;
}

/**
 * Generate DOT for a single edge
 */
function generateEdgeDot(edge: GraphEdge, config: DependencyGraphVizConfig): string {
  let edgeDef = `    "${edge.from}" -> "${edge.to}"`;
  
  if (config.showLabels && edge.label) {
    edgeDef += ` [label="${edge.label}"]`;
  }
  
  edgeDef += ` [style=${config.edgeStyle.style}, color="${config.edgeStyle.color}", arrowhead=${config.edgeStyle.arrowHead}];\n`;
  
  return edgeDef;
}

/**
 * Get status icon for node
 */
function getNodeStatusIcon(status: string): string {
  switch (status) {
    case 'completed': return '✓';
    case 'in_progress': return '⏳';
    case 'blocked': return '🚫';
    case 'pending': return '⏸';
    default: return '❓';
  }
}

/**
 * Get priority icon for node
 */
function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

/**
 * Calculate export statistics
 */
function calculateStats(graph: DependencyGraph): ExportStats {
  const stats: ExportStats = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    nodesByStatus: {},
    nodesByDomain: {},
    nodesByPriority: {},
    criticalPath: [],
    orphanedNodes: [],
    circularDependencies: [],
  };
  
  // Count nodes by status
  for (const node of graph.nodes) {
    stats.nodesByStatus[node.status] = (stats.nodesByStatus[node.status] || 0) + 1;
    stats.nodesByDomain[node.domain] = (stats.nodesByDomain[node.domain] || 0) + 1;
    stats.nodesByPriority[node.priority] = (stats.nodesByPriority[node.priority] || 0) + 1;
  }
  
  // Find orphaned nodes (no incoming or outgoing edges)
  const connectedNodes = new Set<string>();
  for (const edge of graph.edges) {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  }
  stats.orphanedNodes = graph.nodes
    .filter(node => !connectedNodes.has(node.id))
    .map(node => node.id);
  
  // Find circular dependencies (simplified detection)
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];
  
  function detectCycle(nodeId: string, path: string[]): void {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      cycles.push(path.slice(cycleStart));
      return;
    }
    
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const outgoingEdges = graph.edges.filter(edge => edge.from === nodeId);
    for (const edge of outgoingEdges) {
      detectCycle(edge.to, [...path, nodeId]);
    }
    
    recursionStack.delete(nodeId);
  }
  
  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      detectCycle(node.id, []);
    }
  }
  
  stats.circularDependencies = cycles;
  
  return stats;
}

/**
 * Export graph to SVG using Graphviz
 */
function exportToSVG(dotContent: string, outputPath: string): void {
  try {
    const svg = execSync(`dot -Tsvg`, { input: dotContent }).toString();
    writeFileSync(outputPath, svg);
  } catch (error) {
    console.error('Failed to export SVG:', error);
    throw error;
  }
}

/**
 * Export graph to PNG using Graphviz
 */
function exportToPNG(dotContent: string, outputPath: string): void {
  try {
    execSync(`dot -Tpng -o "${outputPath}"`, { input: dotContent });
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw error;
  }
}

/**
 * Export graph metadata to JSON
 */
function exportToJSON(metadata: ExportMetadata, outputPath: string): void {
  try {
    const json = JSON.stringify(metadata, null, config.export.compressJson ? 0 : 2);
    writeFileSync(outputPath, json);
  } catch (error) {
    console.error('Failed to export JSON:', error);
    throw error;
  }
}

/**
 * Emit telemetry event
 */
async function emitTelemetry(metadata: ExportMetadata): Promise<void> {
  try {
    const telemetryData = {
      eventType: 'coord_dependency_graph_exported',
      data: {
        timestamp: metadata.timestamp,
        stats: metadata.stats,
        config: {
          layout: metadata.config.layout,
          outputFormats: Object.keys(metadata.files),
          clustered: metadata.config.clusterByDomain,
        },
        files: metadata.files,
      },
    };
    
    // Store telemetry data
    const telemetryPath = join(metadata.config.output.directory, 'telemetry.json');
    writeFileSync(telemetryPath, JSON.stringify(telemetryData, null, 2));
    
    if (options.verbose) {
      console.log('Telemetry event emitted:', telemetryData);
    }
  } catch (error) {
    console.warn('Failed to emit telemetry:', error);
  }
}

/**
 * Main export function
 */
async function exportDependencyGraph(options: CLIOptions): Promise<void> {
  // Load configuration
  let config: DependencyGraphVizConfig;
  
  if (options.preset) {
    config = getDependencyGraphVizPreset(options.preset);
    if (options.verbose) {
      console.log(`Using preset: ${options.preset}`);
    }
  } else {
    config = DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG;
  }
  
  // Apply overrides
  const overrides: Partial<DependencyGraphVizConfig> = {};
  
  if (options.layout) overrides.layout = options.layout as any;
  if (options.outputDir) overrides.output = { ...config.output, directory: options.outputDir };
  if (options.prefix) overrides.output = { ...config.output, prefix: options.prefix };
  
  if (Object.keys(overrides).length > 0) {
    config = validateDependencyGraphVizConfig({ ...config, ...overrides });
  }
  
  if (options.verbose) {
    console.log('Configuration:', JSON.stringify(config, null, 2));
  }
  
  // Load dependency graph
  if (options.verbose) {
    console.log('Loading dependency graph...');
  }
  
  const graph = await loadDependencyGraph();
  
  if (options.verbose) {
    console.log(`Loaded graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
  }
  
  // Generate DOT file
  if (options.verbose) {
    console.log('Generating DOT file...');
  }
  
  const dotContent = generateDotFile(graph, config);
  
  // Create output directory
  const outputDir = join(process.cwd(), config.output.directory);
  mkdirSync(outputDir, { recursive: true });
  
  // Generate file paths
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = config.output.prefix;
  
  const files: ExportMetadata['files'] = {};
  
  // Export based on format options
  const formats = options.format === 'all' ? ['svg', 'png', 'json'] : [options.format || 'all'];
  
  for (const format of formats) {
    if (format === 'svg' && config.output.svg) {
      const svgPath = join(outputDir, `${prefix}-${timestamp}.svg`);
      exportToSVG(dotContent, svgPath);
      files.svg = svgPath;
      
      if (options.verbose) {
        console.log(`SVG exported to: ${svgPath}`);
      }
    }
    
    if (format === 'png' && config.output.png) {
      const pngPath = join(outputDir, `${prefix}-${timestamp}.png`);
      exportToPNG(dotContent, pngPath);
      files.png = pngPath;
      
      if (options.verbose) {
        console.log(`PNG exported to: ${pngPath}`);
      }
    }
    
    if (format === 'json' && config.output.json) {
      const stats = calculateStats(graph);
      const metadata: ExportMetadata = {
        timestamp: Date.now(),
        config,
        stats,
        graph,
        files,
        telemetry: {
          eventType: 'coord_dependency_graph_exported',
          data: null,
        },
      };
      
      const jsonPath = join(outputDir, `${prefix}-${timestamp}.json`);
      exportToJSON(metadata, jsonPath);
      files.json = jsonPath;
      
      if (options.verbose) {
        console.log(`JSON exported to: ${jsonPath}`);
      }
    }
  }
  
  // Emit telemetry
  if (config.output.json) {
    const stats = calculateStats(graph);
    const metadata: ExportMetadata = {
      timestamp: Date.now(),
      config,
      stats,
      graph,
      files,
      telemetry: {
        eventType: 'coord_dependency_graph_exported',
        data: null,
      },
    };
    
    await emitTelemetry(metadata);
  }
  
  // Print summary
  console.log('\n📊 Dependency Graph Export Summary');
  console.log('=====================================');
  console.log(`Nodes: ${graph.nodes.length}`);
  console.log(`Edges: ${graph.edges.length}`);
  console.log(`Layout: ${config.layout}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Files generated: ${Object.keys(files).length}`);
  
  if (files.svg) console.log(`  SVG: ${files.svg}`);
  if (files.png) console.log(`  PNG: ${files.png}`);
  if (files.json) console.log(`  JSON: ${files.json}`);
  
  // Print statistics
  const stats = calculateStats(graph);
  console.log('\n📈 Statistics');
  console.log('============');
  console.log(`Nodes by status:`, stats.nodesByStatus);
  console.log(`Nodes by domain:`, stats.nodesByDomain);
  console.log(`Nodes by priority:`, stats.nodesByPriority);
  
  if (stats.orphanedNodes.length > 0) {
    console.log(`Orphaned nodes: ${stats.orphanedNodes.join(', ')}`);
  }
  
  if (stats.circularDependencies.length > 0) {
    console.log(`Circular dependencies: ${stats.circularDependencies.length} detected`);
  }
}

// CLI entry point
const options = parseArgs(process.argv.slice(2));

if (options.help) {
  showHelp();
  process.exit(0);
}

// Run export
exportDependencyGraph(options)
  .then(() => {
    console.log('\n✅ Dependency graph export completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  });
