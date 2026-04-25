/**
 * NP-098 – Coordinator Prompt Dependency Planner CLI
 *
 * Command-line interface for analyzing and visualizing Kanban prompt dependencies.
 * Generates ASCII and PNG dependency graphs with comprehensive reporting.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { DependencyGraphGenerator, type DependencyGraph } from '../../src/balancing/dependencyGraphGenerator';
import { ASCIIGraphRenderer, type ASCIIGraphConfig } from '../../src/balancing/asciiGraphRenderer';
import { PNGGraphExporter, type PNGExportConfig } from '../../src/balancing/pngGraphExporter';

/**
 * CLI configuration options
 */
interface DependencyPlannerCLIConfig {
  /** Command to execute */
  command: 'analyze' | 'render' | 'export' | 'validate' | 'report';
  /** Kanban file path */
  kanbanFile?: string;
  /** Output directory */
  outputDir?: string;
  /** Output format for render/export */
  format?: 'ascii' | 'png' | 'svg' | 'all';
  /** Graph layout for PNG export */
  layout?: 'hierarchical' | 'circular' | 'force';
  /** Filter by domain */
  domain?: string;
  /** Filter by status */
  status?: string;
  /** Focus on specific task */
  focusTask?: string;
  /** Include completed tasks */
  includeCompleted?: boolean;
  /** Include blocked tasks */
  includeBlocked?: boolean;
  /** Maximum graph depth */
  maxDepth?: number;
  /** ASCII rendering options */
  asciiOptions?: Partial<ASCIIGraphConfig>;
  /** PNG export options */
  pngOptions?: Partial<PNGExportConfig>;
  /** Enable critical path analysis */
  criticalPathOnly?: boolean;
  /** Generate summary report */
  generateSummary?: boolean;
}

/**
 * Default CLI configuration
 */
const DEFAULT_CLI_CONFIG: Partial<DependencyPlannerCLIConfig> = {
  kanbanFile: 'src/docs/docs/coordinator/agent_assignments.md',
  outputDir: './data/dependency-planner',
  format: 'ascii',
  layout: 'hierarchical',
  includeCompleted: false,
  includeBlocked: true,
  maxDepth: 10,
  generateSummary: true,
  criticalPathOnly: false,
};

/**
 * Dependency Planner CLI
 */
export class DependencyPlannerCLI {
  private config: DependencyPlannerCLIConfig;
  private generator: DependencyGraphGenerator;
  private asciiRenderer: ASCIIGraphRenderer;
  private pngExporter: PNGGraphExporter;

  constructor(config: DependencyPlannerCLIConfig) {
    this.config = { ...DEFAULT_CLI_CONFIG, ...config };
    this.generator = new DependencyGraphGenerator();
    this.asciiRenderer = new ASCIIGraphRenderer(this.config.asciiOptions);
    this.pngExporter = new PNGGraphExporter(this.config.pngOptions);
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(args: string[]): DependencyPlannerCLIConfig {
    const parsed: DependencyPlannerCLIConfig = {
      command: 'analyze',
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case 'analyze':
        case 'render':
        case 'export':
        case 'validate':
        case 'report':
          parsed.command = arg;
          break;
        case '--kanban':
        case '-k':
          parsed.kanbanFile = args[++i];
          break;
        case '--output':
        case '-o':
          parsed.outputDir = args[++i];
          break;
        case '--format':
        case '-f':
          parsed.format = args[++i] as 'ascii' | 'png' | 'svg' | 'all';
          break;
        case '--layout':
        case '-l':
          parsed.layout = args[++i] as 'hierarchical' | 'circular' | 'force';
          break;
        case '--domain':
        case '-d':
          parsed.domain = args[++i];
          break;
        case '--status':
        case '-s':
          parsed.status = args[++i];
          break;
        case '--focus':
          parsed.focusTask = args[++i];
          break;
        case '--include-completed':
          parsed.includeCompleted = true;
          break;
        case '--include-blocked':
          parsed.includeBlocked = true;
          break;
        case '--exclude-blocked':
          parsed.includeBlocked = false;
          break;
        case '--max-depth':
          parsed.maxDepth = parseInt(args[++i], 10);
          break;
        case '--critical-path-only':
          parsed.criticalPathOnly = true;
          break;
        case '--no-summary':
          parsed.generateSummary = false;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return { ...DEFAULT_CLI_CONFIG, ...parsed };
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
Coordinator Prompt Dependency Planner CLI

Usage: dependency-planner <command> [options]

Commands:
  analyze    Analyze Kanban dependencies and show statistics
  render     Render dependency graph in specified format
  export     Export dependency graph to file(s)
  validate   Validate dependency graph for cycles and issues
  report     Generate comprehensive dependency report

Options:
  -k, --kanban <file>         Kanban file path [default: src/docs/docs/coordinator/agent_assignments.md]
  -o, --output <dir>          Output directory [default: ./data/dependency-planner]
  -f, --format <format>       Output format (ascii|png|svg|all) [default: ascii]
  -l, --layout <layout>       Graph layout (hierarchical|circular|force) [default: hierarchical]
  -d, --domain <domain>       Filter by domain (Idle Village|STS|Balancer|Coordinator)
  -s, --status <status>       Filter by status (Non assegnato|In corso|Completato|blocked)
  --focus <task-id>           Focus analysis on specific task
  --include-completed         Include completed tasks in analysis
  --include-blocked           Include blocked tasks [default: true]
  --exclude-blocked           Exclude blocked tasks
  --max-depth <number>        Maximum dependency depth [default: 10]
  --critical-path-only        Show only critical path
  --no-summary                Skip summary generation
  -h, --help                  Show this help message

Examples:
  # Analyze current Kanban dependencies
  dependency-planner analyze

  # Render ASCII graph for Idle Village tasks
  dependency-planner render --domain "Idle Village" --format ascii

  # Export PNG graph with circular layout
  dependency-planner export --format png --layout circular

  # Validate for dependency cycles
  dependency-planner validate

  # Generate comprehensive report for all domains
  dependency-planner report --include-completed --format all

Available Domains:
  - Idle Village (🏘️)
  - STS (⚔️)
  - Balancer (⚖️)
  - Coordinator (🎯)

Available Layouts:
  - hierarchical: Top-down dependency flow
  - circular: Radial node arrangement
  - force: Physics-based positioning

Output Formats:
  - ascii: Terminal-friendly text visualization
  - png: High-quality image export
  - svg: Scalable vector graphics
  - all: Generate all formats
`);
  }

  /**
   * Execute analyze command
   */
  private async executeAnalyze(): Promise<void> {
    console.log('🔍 Analyzing Kanban dependencies...\n');

    // Load and parse Kanban data
    this.generator.loadKanbanTasks(this.config.kanbanFile);
    const tasks = this.generator.getTasks();

    console.log(`📊 Found ${tasks.length} tasks in Kanban\n`);

    // Basic statistics
    const stats = this.generateBasicStats(tasks);
    console.log('📈 Basic Statistics:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');

    // Domain breakdown
    const domainStats = this.generateDomainStats(tasks);
    console.log('🏷️ Domain Breakdown:');
    Object.entries(domainStats).forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count} tasks`);
    });
    console.log('');

    // Status breakdown
    const statusStats = this.generateStatusStats(tasks);
    console.log('📋 Status Breakdown:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} tasks`);
    });
    console.log('');

    // Generate dependency graph
    const graphConfig = {
      includeCompleted: this.config.includeCompleted || false,
      includeBlocked: this.config.includeBlocked !== false,
      maxDepth: this.config.maxDepth || 10,
      domainFilter: this.config.domain,
      focusTask: this.config.focusTask,
      criticalPathOnly: this.config.criticalPathOnly || false,
    };

    const graph = this.generator.generateGraph(graphConfig);

    console.log('🔗 Dependency Analysis:');
    console.log(`  Total dependencies: ${graph.edges.length}`);
    console.log(`  Graph nodes: ${graph.nodes.length}`);
    console.log(`  Root tasks: ${graph.metadata.rootTasks.length}`);
    console.log(`  Leaf tasks: ${graph.metadata.leafTasks.length}`);
    console.log(`  Maximum depth: ${graph.metadata.maxDepth}`);
    console.log('');

    if (graph.metadata.criticalPath.length > 0) {
      console.log('🎯 Critical Path:');
      console.log(`  ${graph.metadata.criticalPath.join(' → ')}`);
      console.log('');
    }

    // Validate graph
    const validation = this.generator.validateGraph();
    if (!validation.valid) {
      console.log('⚠️ Dependency Issues Found:');
      validation.cycles.forEach((cycle, index) => {
        console.log(`  Cycle ${index + 1}: ${cycle.join(' → ')}`);
      });
      console.log('');
    } else {
      console.log('✅ No dependency cycles detected\n');
    }

    if (this.config.generateSummary) {
      console.log('📋 Recommendations:');
      const recommendations = this.generateRecommendations(graph, validation);
      recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
  }

  /**
   * Execute render command
   */
  private async executeRender(): Promise<void> {
    console.log('🎨 Rendering dependency graph...\n');

    // Load and generate graph
    this.generator.loadKanbanTasks(this.config.kanbanFile);
    const graph = this.generator.generateGraph({
      includeCompleted: this.config.includeCompleted || false,
      includeBlocked: this.config.includeBlocked !== false,
      maxDepth: this.config.maxDepth || 10,
      domainFilter: this.config.domain,
      focusTask: this.config.focusTask,
      criticalPathOnly: this.config.criticalPathOnly || false,
    });

    // Render based on format
    switch (this.config.format) {
      case 'ascii': {
        const asciiOutput = this.asciiRenderer.render(graph);
        console.log(asciiOutput);
        break;
      }

      case 'png':
      case 'svg':
      case 'all':
        console.log('📊 Graph rendering complete');
        console.log(`   Nodes: ${graph.nodes.length}`);
        console.log(`   Edges: ${graph.edges.length}`);
        console.log(`   Domains: ${Object.keys(graph.metadata.tasksByDomain).length}`);
        console.log('\n💡 Use "export" command to save visualizations to files');
        break;

      default:
        console.log('❌ Unsupported format. Use --format ascii|png|svg|all');
    }
  }

  /**
   * Execute export command
   */
  private async executeExport(): Promise<void> {
    console.log('📤 Exporting dependency graph...\n');

    // Load and generate graph
    this.generator.loadKanbanTasks(this.config.kanbanFile);
    const graph = this.generator.generateGraph({
      includeCompleted: this.config.includeCompleted || false,
      includeBlocked: this.config.includeBlocked !== false,
      maxDepth: this.config.maxDepth || 10,
      domainFilter: this.config.domain,
      focusTask: this.config.focusTask,
      criticalPathOnly: this.config.criticalPathOnly || false,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `dependency-graph-${timestamp}`;

    // Export based on format
    if (this.config.format === 'ascii' || this.config.format === 'all') {
      const asciiOutput = this.asciiRenderer.render(graph);
      const asciiPath = join(this.config.outputDir!, `${baseName}.txt`);
      writeFileSync(asciiPath, asciiOutput, 'utf8');
      console.log(`✅ ASCII graph exported: ${asciiPath}`);
    }

    if (this.config.format === 'png' || this.config.format === 'all') {
      const pngPath = join(this.config.outputDir!, `${baseName}.png`);
      await this.pngExporter.exportWithLayout(graph, pngPath, this.config.layout || 'hierarchical');
      console.log(`✅ PNG graph exported: ${pngPath}`);
    }

    if (this.config.format === 'svg' || this.config.format === 'all') {
      // SVG export would be implemented in PNG exporter
      const svgPath = join(this.config.outputDir!, `${baseName}.svg`);
      // Placeholder - would implement SVG export
      console.log(`⚠️ SVG export not yet implemented: ${svgPath}`);
    }

    console.log('\n🎯 Export Summary:');
    console.log(`   Tasks analyzed: ${graph.metadata.totalTasks}`);
    console.log(`   Dependencies found: ${graph.edges.length}`);
    console.log(`   Critical path length: ${graph.metadata.criticalPath.length}`);
    console.log(`   Output directory: ${this.config.outputDir}`);
  }

  /**
   * Execute validate command
   */
  private executeValidate(): Promise<void> {
    console.log('🔍 Validating dependency graph...\n');

    this.generator.loadKanbanTasks(this.config.kanbanFile);
    const validation = this.generator.validateGraph();

    if (validation.valid) {
      console.log('✅ Dependency graph is valid');
      console.log('   No cycles detected');
      console.log('   All dependencies are well-formed');
    } else {
      console.log('❌ Dependency issues found:');
      console.log('');

      validation.cycles.forEach((cycle, index) => {
        console.log(`🔄 Cycle ${index + 1}:`);
        console.log(`   ${cycle.join(' → ')}`);
        console.log(`   This creates a circular dependency`);
        console.log('');
      });

      console.log('💡 To resolve cycles:');
      console.log('   1. Review the dependency chain above');
      console.log('   2. Remove or reorder dependencies in agent_assignments.md');
      console.log('   3. Consider breaking tasks into smaller units');

      process.exit(1);
    }

    return Promise.resolve();
  }

  /**
   * Execute report command
   */
  private async executeReport(): Promise<void> {
    console.log('📊 Generating comprehensive dependency report...\n');

    // Load data and generate analysis
    this.generator.loadKanbanTasks(this.config.kanbanFile);
    const tasks = this.generator.getTasks();

    const graph = this.generator.generateGraph({
      includeCompleted: this.config.includeCompleted || false,
      includeBlocked: this.config.includeBlocked !== false,
      maxDepth: this.config.maxDepth || 10,
      domainFilter: this.config.domain,
      focusTask: this.config.focusTask,
      criticalPathOnly: this.config.criticalPathOnly || false,
    });

    const validation = this.generator.validateGraph();

    // Generate report
    const report = this.generateComprehensiveReport(tasks, graph, validation);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(this.config.outputDir!, `dependency-report-${timestamp}.md`);

    writeFileSync(reportPath, report, 'utf8');
    console.log(`✅ Comprehensive report generated: ${reportPath}`);
    console.log('');

    // Also export graphs if requested
    if (this.config.format === 'all' || this.config.format === 'ascii') {
      const asciiOutput = this.asciiRenderer.render(graph);
      const asciiPath = join(this.config.outputDir!, `dependency-graph-${timestamp}.txt`);
      writeFileSync(asciiPath, asciiOutput, 'utf8');
      console.log(`✅ ASCII graph exported: ${asciiPath}`);
    }

    // Summary
    console.log('📈 Report Summary:');
    console.log(`   Kanban file: ${this.config.kanbanFile}`);
    console.log(`   Tasks analyzed: ${tasks.length}`);
    console.log(`   Dependencies found: ${graph.edges.length}`);
    console.log(`   Domains covered: ${Object.keys(graph.metadata.tasksByDomain).length}`);
    console.log(`   Validation status: ${validation.valid ? '✅ Valid' : '❌ Issues found'}`);
  }

  /**
   * Generate basic statistics
   */
  private generateBasicStats(tasks: any[]): Record<string, any> {
    return {
      'Total Tasks': tasks.length,
      'Active Tasks': tasks.filter(t => t.status === 'In corso').length,
      'Pending Tasks': tasks.filter(t => t.status === 'Non assegnato').length,
      'Completed Tasks': tasks.filter(t => t.status === 'Completato').length,
      'Blocked Tasks': tasks.filter(t => t.status === 'blocked').length,
    };
  }

  /**
   * Generate domain statistics
   */
  private generateDomainStats(tasks: any[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.domain] = (acc[task.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Generate status statistics
   */
  private generateStatusStats(tasks: any[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(graph: DependencyGraph, validation: any): string[] {
    const recommendations: string[] = [];

    if (!validation.valid) {
      recommendations.push('Fix dependency cycles to ensure proper task execution order');
    }

    if (graph.metadata.maxDepth > 5) {
      recommendations.push('Consider breaking down deep dependency chains into smaller tasks');
    }

    if (graph.metadata.rootTasks.length > graph.metadata.leafTasks.length * 2) {
      recommendations.push('High number of independent tasks - consider parallel execution opportunities');
    }

    if (graph.edges.length < graph.nodes.length * 0.5) {
      recommendations.push('Low dependency density - tasks may be overly independent');
    }

    const blockedTasks = Object.values(graph.metadata.tasksByStatus).reduce((sum, count) => sum + (count as number), 0) - graph.metadata.totalTasks;
    if (blockedTasks > graph.metadata.totalTasks * 0.2) {
      recommendations.push('High number of blocked tasks - review dependency management');
    }

    if (recommendations.length === 0) {
      recommendations.push('Dependency structure looks healthy');
    }

    return recommendations;
  }

  /**
   * Generate comprehensive report
   */
  private generateComprehensiveReport(tasks: any[], graph: DependencyGraph, validation: any): string {
    const timestamp = new Date().toISOString();

    const report = `# Coordinator Prompt Dependency Report

**Generated:** ${timestamp}
**Kanban File:** ${this.config.kanbanFile}
**Analysis Configuration:**
- Include Completed: ${this.config.includeCompleted}
- Include Blocked: ${this.config.includeBlocked}
- Max Depth: ${this.config.maxDepth}
- Domain Filter: ${this.config.domain || 'None'}
- Critical Path Only: ${this.config.criticalPathOnly}

## Executive Summary

- **Total Tasks:** ${graph.metadata.totalTasks}
- **Active Dependencies:** ${graph.edges.length}
- **Dependency Density:** ${((graph.edges.length / Math.max(graph.nodes.length, 1)) * 100).toFixed(1)}%
- **Maximum Chain Length:** ${graph.metadata.maxDepth}
- **Validation Status:** ${validation.valid ? '✅ Valid' : '❌ Issues Found'}

## Task Statistics

### By Status
${Object.entries(graph.metadata.tasksByStatus)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join('\n')}

### By Domain
${Object.entries(graph.metadata.tasksByDomain)
  .map(([domain, count]) => `- ${domain}: ${count}`)
  .join('\n')}

## Dependency Analysis

### Structure Metrics
- **Root Tasks:** ${graph.metadata.rootTasks.length} (${graph.metadata.rootTasks.join(', ')})
- **Leaf Tasks:** ${graph.metadata.leafTasks.length} (${graph.metadata.leafTasks.slice(0, 5).join(', ')}${graph.metadata.leafTasks.length > 5 ? '...' : ''})
- **Critical Path Length:** ${graph.metadata.criticalPath.length}

### Critical Path
${graph.metadata.criticalPath.length > 0
  ? graph.metadata.criticalPath.map((taskId, index) => `${index + 1}. ${taskId}`).join('\n')
  : 'No critical path identified'}

## Validation Results

${validation.valid
  ? '✅ **No dependency cycles detected**'
  : `❌ **Dependency cycles found:**\n\n${validation.cycles.map((cycle, index) =>
      `**Cycle ${index + 1}:** ${cycle.join(' → ')}`
    ).join('\n\n')}`}

## Recommendations

${this.generateRecommendations(graph, validation).map(rec => `- ${rec}`).join('\n')}

## Detailed Task List

${graph.nodes.map(node => {
  const task = tasks.find(t => t.id === node.id);
  return `### ${node.id}
- **Status:** ${node.status}
- **Priority:** ${node.priority}
- **Domain:** ${node.domain}
- **Description:** ${task?.description || 'N/A'}
- **Dependencies:** ${task?.dependsOn?.length || 0} (${task?.dependsOn?.join(', ') || 'None'})`;
}).join('\n\n')}

---

*Report generated by NP-098 Coordinator Prompt Dependency Planner*
`;

    return report;
  }

  /**
   * Run the CLI
   */
  public async run(args: string[]): Promise<void> {
    try {
      this.config = this.parseArgs(args);

      switch (this.config.command) {
        case 'analyze':
          await this.executeAnalyze();
          break;
        case 'render':
          await this.executeRender();
          break;
        case 'export':
          await this.executeExport();
          break;
        case 'validate':
          await this.executeValidate();
          break;
        case 'report':
          await this.executeReport();
          break;
        default:
          throw new Error(`Unknown command: ${this.config.command}`);
      }
    } catch (error) {
      console.error('CLI execution failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  const cli = new DependencyPlannerCLI({} as DependencyPlannerCLIConfig);
  await cli.run(process.argv.slice(2));
}
