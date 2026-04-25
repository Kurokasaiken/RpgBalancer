#!/usr/bin/env tsx

/**
 * IV-CLP-002 – Sandbox Dependency Mapper CLI
 *
 * Analyzes import/export dependencies of sandbox components for the Component Lab.
 * Generates dependency graphs and reports to support extraction workflows.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

interface DependencyNode {
  id: string;
  type: 'component' | 'hook' | 'config' | 'utility' | 'store' | 'type';
  filePath: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Array<{ from: string; to: string; type: 'import' | 'export' | 'usage' }>;
}

const SANDBOX_COMPONENTS = [
  'VillageSandbox',
  'VillageSandboxContent',
  'VillageSandboxColumns',
  'VillageSandboxHeader',
  'WorkerPickerSheet',
  'WorkerPickerDiagnosticsPanel',
  'DiagnosticsPanel',
  'DragPreviewInstrumentationPanel',
  'IdleVillagePinballMonitor',
  'ActionDetailHarness',
  'GymShiftHUD',
  'GymShiftCard',
  'TrainingTracker',
];

class SandboxDependencyMapper {
  private graph: DependencyGraph;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: [],
    };
  }

  async analyzeSandboxComponents(): Promise<DependencyGraph> {
    console.log('🔍 Analyzing sandbox components...');

    // Find all TypeScript files in src
    const srcDir = path.join(process.cwd(), 'src');
    const files = this.getAllTypeScriptFiles(srcDir);

    console.log(`📁 Found ${files.length} TypeScript files to scan`);

    let sandboxRelatedCount = 0;
    for (const file of files) {
      if (this.isSandboxRelatedFile(file)) {
        console.log(`📁 Processing: ${path.relative(process.cwd(), file)}`);
        await this.analyzeFile(file);
        sandboxRelatedCount++;
      }
    }

    console.log(`📊 Found ${sandboxRelatedCount} sandbox-related files`);
    console.log(`📊 Graph has ${this.graph.nodes.size} nodes before optimization`);

    this.buildDependencyEdges();
    this.optimizeGraph();

    return this.graph;
  }

  private getAllTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];

    function scanDir(currentDir: string) {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules and other common directories
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
              scanDir(fullPath);
            }
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.log(`⚠️ Error scanning directory: ${currentDir} - ${error}`);
      }
    }

    scanDir(dir);
    return files;
  }

  private isSandboxRelatedFile(filePath: string): boolean {
    console.log(`🔍 Checking file: ${path.relative(process.cwd(), filePath)}`);

    // Check if file is in sandbox-related directories
    const sandboxPaths = [
      'src/ui/idleVillage/VillageSandbox',
      'src/ui/idleVillage/components/VillageSandbox',
      'src/ui/idleVillage/hooks/useVillageSandbox',
      'src/ui/idleVillage/hooks/useSandbox',
      'src/ui/idleVillage/components/WorkerPicker',
      'src/ui/idleVillage/components/Diagnostics',
      'src/ui/idleVillage/components/IdleVillagePinballMonitor',
    ];

    for (const p of sandboxPaths) {
      if (filePath.includes(p)) {
        console.log(`  ✅ Sandbox path match: ${p}`);
        return true;
      }
    }

    // Quick file content check for sandbox components
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for exports of sandbox components
      for (const component of SANDBOX_COMPONENTS) {
        if (content.includes(`export`) && content.includes(component)) {
          console.log(`  ✅ Exports sandbox component: ${component}`);
          return true;
        }
      }

      // Check for imports of sandbox modules
      const sandboxImports = [
        'VillageSandbox',
        'idleVillage/components',
        'idleVillage/hooks/useVillageSandbox',
        'WorkerPicker',
        'Diagnostics',
        'PinballMonitor',
      ];

      for (const importPattern of sandboxImports) {
        if (content.includes(`from`) && content.includes(importPattern)) {
          console.log(`  ✅ Imports sandbox module: ${importPattern}`);
          return true;
        }
      }
    } catch (error) {
      console.log(`  ⚠️ Error reading file: ${error}`);
    }

    console.log(`  ❌ Not sandbox-related`);
    return false;
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath, path.extname(filePath));

      // Determine node type
      let nodeType: DependencyNode['type'] = 'utility';
      if (filePath.includes('/components/')) {
        nodeType = 'component';
      } else if (filePath.includes('/hooks/')) {
        nodeType = 'hook';
      } else if (filePath.includes('/config/')) {
        nodeType = 'config';
      } else if (filePath.includes('/store/') || filePath.includes('/state/')) {
        nodeType = 'store';
      } else if (filePath.includes('/types/')) {
        nodeType = 'type';
      }

      const nodeId = `${nodeType}:${fileName}`;

      // Analyze imports with regex
      const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
      const imports: string[] = [];
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
          imports.push(importPath);
        }
      }

      // Analyze exports with regex
      const exports: string[] = [];
      const exportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }

      // Also check for default exports
      if (content.includes('export default')) {
        exports.push('default');
      }

      const node: DependencyNode = {
        id: nodeId,
        type: nodeType,
        filePath,
        imports,
        exports,
        dependencies: [],
      };

      this.graph.nodes.set(nodeId, node);
    } catch (error) {
      console.log(`  ❌ Error analyzing file: ${filePath} - ${error}`);
    }
  }

  private buildDependencyEdges(): void {
    for (const [nodeId, node] of this.graph.nodes) {
      for (const importPath of node.imports) {
        // Resolve import path to potential node IDs
        const resolvedNodes = this.resolveImportToNodes(importPath, node.filePath);
        for (const targetNodeId of resolvedNodes) {
          if (this.graph.nodes.has(targetNodeId)) {
            this.graph.edges.push({
              from: nodeId,
              to: targetNodeId,
              type: 'import',
            });
          }
        }
      }
    }
  }

  private resolveImportToNodes(importPath: string, fromFile: string): string[] {
    const resolved: string[] = [];

    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = path.dirname(fromFile);
      const resolvedPath = path.resolve(fromDir, importPath);

      // Check if resolved path exists as file or directory
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        const candidatePath = resolvedPath + ext;
        if (fs.existsSync(candidatePath)) {
          const fileName = path.basename(candidatePath, ext);
          const nodeType = this.inferNodeType(candidatePath);
          resolved.push(`${nodeType}:${fileName}`);
          break;
        }

        // Check for index file in directory
        const candidateIndexPath = path.join(resolvedPath, 'index') + ext;
        if (fs.existsSync(candidateIndexPath)) {
          const dirName = path.basename(resolvedPath);
          const nodeType = this.inferNodeType(candidateIndexPath);
          resolved.push(`${nodeType}:${dirName}`);
          break;
        }
      }
    }

    // Handle @/ imports (alias to src/)
    if (importPath.startsWith('@/')) {
      const aliasPath = importPath.replace('@/', 'src/');
      const resolvedPath = path.resolve(process.cwd(), aliasPath);

      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        const candidatePath = resolvedPath + ext;
        if (fs.existsSync(candidatePath)) {
          const fileName = path.basename(candidatePath, ext);
          const nodeType = this.inferNodeType(candidatePath);
          resolved.push(`${nodeType}:${fileName}`);
          break;
        }

        const candidateIndexPath = path.join(resolvedPath, 'index') + ext;
        if (fs.existsSync(candidateIndexPath)) {
          const dirName = path.basename(resolvedPath);
          const nodeType = this.inferNodeType(candidateIndexPath);
          resolved.push(`${nodeType}:${dirName}`);
          break;
        }
      }
    }

    return resolved;
  }

  private inferNodeType(filePath: string): DependencyNode['type'] {
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/hooks/')) return 'hook';
    if (filePath.includes('/config/')) return 'config';
    if (filePath.includes('/store/') || filePath.includes('/state/')) return 'store';
    if (filePath.includes('/types/')) return 'type';
    return 'utility';
  }

  private optimizeGraph(): void {
    // Remove isolated nodes (no imports or exports)
    const nodesToRemove: string[] = [];
    for (const [nodeId, node] of this.graph.nodes) {
      const hasIncomingEdges = this.graph.edges.some(edge => edge.to === nodeId);
      const hasOutgoingEdges = this.graph.edges.some(edge => edge.from === nodeId);

      if (!hasIncomingEdges && !hasOutgoingEdges && node.imports.length === 0 && node.exports.length === 0) {
        nodesToRemove.push(nodeId);
      }
    }

    for (const nodeId of nodesToRemove) {
      this.graph.nodes.delete(nodeId);
    }

    // Remove duplicate edges
    const edgeSet = new Set<string>();
    const uniqueEdges: typeof this.graph.edges = [];

    for (const edge of this.graph.edges) {
      const edgeKey = `${edge.from}->${edge.to}:${edge.type}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        uniqueEdges.push(edge);
      }
    }

    this.graph.edges = uniqueEdges;
  }

  generateReport(outputFormat: 'json' | 'text' | 'dot'): string {
    switch (outputFormat) {
      case 'json':
        return this.generateJsonReport();
      case 'text':
        return this.generateTextReport();
      case 'dot':
        return this.generateDotReport();
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }
  }

  private generateJsonReport(): string {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        componentCount: this.graph.nodes.size,
        dependencyCount: this.graph.edges.length,
        analyzedComponents: SANDBOX_COMPONENTS,
      },
      nodes: Array.from(this.graph.nodes.values()),
      edges: this.graph.edges,
    };
    return JSON.stringify(report, null, 2);
  }

  private generateTextReport(): string {
    let report = '# Sandbox Dependency Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Components: ${this.graph.nodes.size}\n`;
    report += `Dependencies: ${this.graph.edges.length}\n\n`;

    report += '## Components\n\n';
    for (const [nodeId, node] of this.graph.nodes) {
      report += `### ${nodeId}\n`;
      report += `- **Type**: ${node.type}\n`;
      report += `- **File**: ${node.filePath}\n`;
      report += `- **Exports**: ${node.exports.join(', ') || 'none'}\n`;
      if (node.imports.length > 0) {
        report += `- **Imports**: ${node.imports.slice(0, 5).join(', ')}${node.imports.length > 5 ? '...' : ''}\n`;
      }
      report += '\n';
    }

    report += '## Dependency Graph\n\n';
    for (const edge of this.graph.edges.slice(0, 50)) {
      report += `${edge.from} → ${edge.to} (${edge.type})\n`;
    }

    if (this.graph.edges.length > 50) {
      report += `\n... and ${this.graph.edges.length - 50} more dependencies\n`;
    }

    return report;
  }

  private generateDotReport(): string {
    let dot = 'digraph SandboxDependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    // Group nodes by type
    const typeGroups: Record<string, string[]> = {};
    for (const [nodeId, node] of this.graph.nodes) {
      if (!typeGroups[node.type]) {
        typeGroups[node.type] = [];
      }
      typeGroups[node.type].push(nodeId);
    }

    for (const [type, nodes] of Object.entries(typeGroups)) {
      dot += `  subgraph cluster_${type} {\n`;
      dot += `    label="${type}";\n`;
      dot += `    color=blue;\n`;
      for (const nodeId of nodes) {
        dot += `    "${nodeId}";\n`;
      }
      dot += '  }\n\n';
    }

    for (const edge of this.graph.edges) {
      dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.type}"];\n`;
    }

    dot += '}\n';
    return dot;
  }
}

// CLI Interface
const program = new Command();

program
  .name('sandbox-dependency-mapper')
  .description('Analyzes import/export dependencies of sandbox components')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze sandbox component dependencies')
  .option('-o, --output <format>', 'Output format (json|text|dot)', 'text')
  .option('-f, --file <path>', 'Output file path', 'sandbox-dependencies.json')
  .action(async (options) => {
    try {
      console.log('🚀 Starting sandbox dependency analysis...\n');

      const mapper = new SandboxDependencyMapper();
      const graph = await mapper.analyzeSandboxComponents();

      console.log(`📊 Analysis complete: ${graph.nodes.size} components, ${graph.edges.length} dependencies\n`);

      const report = mapper.generateReport(options.output);

      if (options.file) {
        fs.writeFileSync(options.file, report);
        console.log(`💾 Report saved to: ${options.file}`);
      } else {
        console.log(report);
      }

      console.log('\n✅ Analysis completed successfully!');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

program.parse();
