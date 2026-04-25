/**
 * Config Dependency Graph Generator CLI
 * Generates dependency graphs for config files with cycle detection and multiple output formats
 * 
 * @see NP-140 – Tooling: Config Dependency Graph Generator
 * 
 * Usage:
 *   tsx scripts/config/dependencyGraphGenerator.ts --format json
 *   tsx scripts/config/dependencyGraphGenerator.ts --format dot --output graph.dot
 *   tsx scripts/config/dependencyGraphGenerator.ts --format mermaid --detect-cycles
 */

import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import * as path from 'node:path';
import {
  ConfigDependencyAnalyzer,
  DEFAULT_ANALYSIS_CONFIG,
  type DependencyGraph,
  type AnalysisConfig,
} from '../../src/balancing/config/analysis/configDependencyAnalyzer';

// CLI argument parsing
const { values: args } = parseArgs({
  options: {
    format: { type: 'string', short: 'f', default: 'json' },
    output: { type: 'string', short: 'o' },
    'root-dir': { type: 'string', short: 'r' },
    'detect-cycles': { type: 'boolean', default: true },
    'detect-orphans': { type: 'boolean', default: true },
    'follow-types': { type: 'boolean', default: true },
    'max-depth': { type: 'string', default: '10' },
    verbose: { type: 'boolean', short: 'v' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: false,
});

// Show help
if (args.help) {
  console.log(`
Config Dependency Graph Generator

Usage:
  tsx scripts/config/dependencyGraphGenerator.ts [options]

Options:
  -f, --format <format>       Output format: json, dot, mermaid (default: json)
  -o, --output <file>         Output file path (default: stdout)
  -r, --root-dir <dir>        Root directory to analyze (default: ./src/balancing/config)
  --detect-cycles             Detect circular dependencies (default: true)
  --detect-orphans            Detect orphaned files (default: true)
  --follow-types              Follow type-only imports (default: true)
  --max-depth <n>             Maximum directory depth (default: 10)
  -v, --verbose               Verbose output
  -h, --help                  Show this help message

Examples:
  # Generate JSON output
  tsx scripts/config/dependencyGraphGenerator.ts --format json

  # Generate DOT file for Graphviz
  tsx scripts/config/dependencyGraphGenerator.ts --format dot --output graph.dot

  # Generate Mermaid diagram
  tsx scripts/config/dependencyGraphGenerator.ts --format mermaid --output diagram.md

  # Analyze specific directory
  tsx scripts/config/dependencyGraphGenerator.ts --root-dir ./src/balancing --format json
`);
  process.exit(0);
}

// Logging utilities
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  }[level];
  console.error(`${prefix} ${message}`);
}

function verbose(message: string): void {
  if (args.verbose) {
    console.error(`[DEBUG] ${message}`);
  }
}

/**
 * Format graph as JSON
 */
function formatJSON(graph: DependencyGraph): string {
  const output = {
    summary: {
      totalFiles: graph.nodes.size,
      totalDependencies: graph.edges.length,
      cycles: graph.cycles.length,
      orphans: graph.orphans.length,
      roots: graph.roots.length,
    },
    nodes: Array.from(graph.nodes.values()).map(node => ({
      filePath: node.filePath,
      relativePath: node.relativePath,
      dependencies: node.dependencies.map(dep => ({
        target: path.relative(process.cwd(), dep.target),
        type: dep.type,
        importedSymbols: dep.importedSymbols,
        line: dep.line,
      })),
      dependents: node.dependents.map(dep => path.relative(process.cwd(), dep)),
      isOrphaned: node.isOrphaned,
      cyclesWith: node.cyclesWith.map(file => path.relative(process.cwd(), file)),
    })),
    cycles: graph.cycles.map(cycle => 
      cycle.map(file => path.relative(process.cwd(), file))
    ),
    orphans: graph.orphans.map(file => path.relative(process.cwd(), file)),
    roots: graph.roots.map(file => path.relative(process.cwd(), file)),
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Format graph as DOT (Graphviz)
 */
function formatDOT(graph: DependencyGraph): string {
  const lines: string[] = [];
  
  lines.push('digraph ConfigDependencies {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box, style=rounded];');
  lines.push('');

  // Add nodes with styling
  for (const [filePath, node] of graph.nodes) {
    const label = path.basename(filePath, path.extname(filePath));
    const relPath = path.relative(process.cwd(), filePath);
    
    let style = '';
    let color = '';
    
    if (node.isOrphaned) {
      style = 'filled';
      color = 'lightgray';
    } else if (node.cyclesWith.length > 0) {
      style = 'filled';
      color = 'lightcoral';
    } else if (node.dependencies.length === 0) {
      style = 'filled';
      color = 'lightgreen';
    }

    const attrs = [
      `label="${label}"`,
      `tooltip="${relPath}"`,
      style ? `style="${style}"` : '',
      color ? `fillcolor="${color}"` : '',
    ].filter(Boolean).join(', ');

    lines.push(`  "${filePath}" [${attrs}];`);
  }

  lines.push('');

  // Add edges
  for (const dep of graph.edges) {
    const style = dep.isTypeOnly ? 'dashed' : 'solid';
    const color = dep.type === 'dynamic_import' ? 'blue' : 'black';
    const label = dep.importedSymbols.length > 0 
      ? dep.importedSymbols.slice(0, 3).join(', ') + (dep.importedSymbols.length > 3 ? '...' : '')
      : '';

    lines.push(`  "${dep.source}" -> "${dep.target}" [style="${style}", color="${color}", label="${label}"];`);
  }

  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Format graph as Mermaid
 */
function formatMermaid(graph: DependencyGraph): string {
  const lines: string[] = [];
  
  lines.push('```mermaid');
  lines.push('graph LR');
  lines.push('');

  // Create node ID map
  const nodeIds = new Map<string, string>();
  let idCounter = 0;
  
  for (const filePath of graph.nodes.keys()) {
    const id = `N${idCounter++}`;
    nodeIds.set(filePath, id);
  }

  // Add nodes with styling
  for (const [filePath, node] of graph.nodes) {
    const id = nodeIds.get(filePath)!;
    const label = path.basename(filePath, path.extname(filePath));
    
    if (node.isOrphaned) {
      lines.push(`  ${id}["${label}"]:::orphan`);
    } else if (node.cyclesWith.length > 0) {
      lines.push(`  ${id}["${label}"]:::cycle`);
    } else if (node.dependencies.length === 0) {
      lines.push(`  ${id}["${label}"]:::root`);
    } else {
      lines.push(`  ${id}["${label}"]`);
    }
  }

  lines.push('');

  // Add edges
  for (const dep of graph.edges) {
    const sourceId = nodeIds.get(dep.source);
    const targetId = nodeIds.get(dep.target);
    
    if (!sourceId || !targetId) continue;

    const arrow = dep.isTypeOnly ? '-.->' : '-->';
    const label = dep.importedSymbols.length > 0
      ? `|${dep.importedSymbols.slice(0, 2).join(', ')}|`
      : '';

    lines.push(`  ${sourceId} ${arrow}${label} ${targetId}`);
  }

  lines.push('');

  // Add style classes
  lines.push('  classDef orphan fill:#e0e0e0,stroke:#999');
  lines.push('  classDef cycle fill:#ffcccb,stroke:#f00');
  lines.push('  classDef root fill:#c8e6c9,stroke:#4caf50');
  
  lines.push('```');
  
  return lines.join('\n');
}

/**
 * Format graph as Markdown report
 */
function formatMarkdown(graph: DependencyGraph): string {
  const lines: string[] = [];
  
  lines.push('# Config Dependency Graph Report');
  lines.push('');
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Files**: ${graph.nodes.size}`);
  lines.push(`- **Total Dependencies**: ${graph.edges.length}`);
  lines.push(`- **Circular Dependencies**: ${graph.cycles.length}`);
  lines.push(`- **Orphaned Files**: ${graph.orphans.length}`);
  lines.push(`- **Root Files**: ${graph.roots.length}`);
  lines.push('');

  // Cycles
  if (graph.cycles.length > 0) {
    lines.push('## ⚠️ Circular Dependencies');
    lines.push('');
    
    for (let i = 0; i < graph.cycles.length; i++) {
      const cycle = graph.cycles[i];
      lines.push(`### Cycle ${i + 1}`);
      lines.push('');
      
      for (let j = 0; j < cycle.length; j++) {
        const file = path.relative(process.cwd(), cycle[j]);
        const arrow = j < cycle.length - 1 ? ' →' : '';
        lines.push(`${j + 1}. \`${file}\`${arrow}`);
      }
      
      lines.push('');
    }
  }

  // Orphans
  if (graph.orphans.length > 0) {
    lines.push('## 🔍 Orphaned Files');
    lines.push('');
    lines.push('Files that are not imported by any other file:');
    lines.push('');
    
    for (const file of graph.orphans) {
      const relPath = path.relative(process.cwd(), file);
      lines.push(`- \`${relPath}\``);
    }
    
    lines.push('');
  }

  // Roots
  if (graph.roots.length > 0) {
    lines.push('## 🌱 Root Files');
    lines.push('');
    lines.push('Files that do not import any other files:');
    lines.push('');
    
    for (const file of graph.roots) {
      const relPath = path.relative(process.cwd(), file);
      lines.push(`- \`${relPath}\``);
    }
    
    lines.push('');
  }

  // All files
  lines.push('## 📁 All Files');
  lines.push('');
  
  for (const [filePath, node] of graph.nodes) {
    const relPath = path.relative(process.cwd(), filePath);
    lines.push(`### \`${relPath}\``);
    lines.push('');
    
    if (node.dependencies.length > 0) {
      lines.push('**Dependencies:**');
      for (const dep of node.dependencies) {
        const target = path.relative(process.cwd(), dep.target);
        const symbols = dep.importedSymbols.length > 0
          ? ` (${dep.importedSymbols.join(', ')})`
          : '';
        lines.push(`- \`${target}\`${symbols}`);
      }
      lines.push('');
    }

    if (node.dependents.length > 0) {
      lines.push('**Imported by:**');
      for (const dependent of node.dependents) {
        const relDep = path.relative(process.cwd(), dependent);
        lines.push(`- \`${relDep}\``);
      }
      lines.push('');
    }

    if (node.cyclesWith.length > 0) {
      lines.push('**⚠️ Part of circular dependency with:**');
      for (const cycle of node.cyclesWith) {
        const relCycle = path.relative(process.cwd(), cycle);
        lines.push(`- \`${relCycle}\``);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Main CLI execution
 */
async function main(): Promise<void> {
  log('Config Dependency Graph Generator');
  log('==================================');
  log('');

  // Build configuration
  const config: AnalysisConfig = {
    ...DEFAULT_ANALYSIS_CONFIG,
    rootDir: args['root-dir'] || DEFAULT_ANALYSIS_CONFIG.rootDir,
    followTypeImports: args['follow-types'] ?? DEFAULT_ANALYSIS_CONFIG.followTypeImports,
    detectCycles: args['detect-cycles'] ?? DEFAULT_ANALYSIS_CONFIG.detectCycles,
    detectOrphans: args['detect-orphans'] ?? DEFAULT_ANALYSIS_CONFIG.detectOrphans,
    maxDepth: parseInt(args['max-depth'] || '10'),
  };

  verbose(`Root directory: ${config.rootDir}`);
  verbose(`Detect cycles: ${config.detectCycles}`);
  verbose(`Detect orphans: ${config.detectOrphans}`);
  verbose(`Follow type imports: ${config.followTypeImports}`);

  // Create analyzer
  const analyzer = new ConfigDependencyAnalyzer(config);

  // Analyze
  log('Analyzing config files...');
  const graph = await analyzer.analyze();

  log(`Found ${graph.nodes.size} files`);
  log(`Found ${graph.edges.length} dependencies`);
  
  if (graph.cycles.length > 0) {
    log(`⚠️  Found ${graph.cycles.length} circular dependencies`, 'warn');
  }
  
  if (graph.orphans.length > 0) {
    log(`Found ${graph.orphans.length} orphaned files`, 'info');
  }

  log('');

  // Format output
  const format = args.format || 'json';
  let output: string;

  switch (format) {
    case 'json':
      output = formatJSON(graph);
      break;
    case 'dot':
      output = formatDOT(graph);
      break;
    case 'mermaid':
      output = formatMermaid(graph);
      break;
    case 'markdown':
    case 'md':
      output = formatMarkdown(graph);
      break;
    default:
      log(`Unknown format: ${format}`, 'error');
      process.exit(1);
  }

  // Write output
  if (args.output) {
    writeFileSync(args.output, output, 'utf-8');
    log(`Output written to: ${args.output}`);
  } else {
    console.log(output);
  }

  // Exit with error if cycles detected
  if (graph.cycles.length > 0) {
    log('');
    log('⚠️  Circular dependencies detected!', 'error');
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
