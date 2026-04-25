/**
 * NP-098 – ASCII Graph Renderer
 *
 * Renders dependency graphs as ASCII art for terminal output.
 * Provides clean, readable visualizations of task dependencies and status.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import type { DependencyGraph, GraphNode, GraphEdge } from './dependencyGraphGenerator';

/**
 * ASCII rendering configuration
 */
export interface ASCIIGraphConfig {
  /** Maximum width of the output */
  maxWidth: number;
  /** Show node status indicators */
  showStatus: boolean;
  /** Show node priorities */
  showPriority: boolean;
  /** Show node domains */
  showDomain: boolean;
  /** Node box style */
  boxStyle: 'single' | 'double' | 'rounded';
  /** Color output (ANSI escape codes) */
  useColor: boolean;
}

/**
 * Default ASCII rendering configuration
 */
export const DEFAULT_ASCII_CONFIG: ASCIIGraphConfig = {
  maxWidth: 120,
  showStatus: true,
  showPriority: true,
  showDomain: false,
  boxStyle: 'single',
  useColor: true,
};

/**
 * ASCII Graph Renderer
 */
export class ASCIIGraphRenderer {
  private config: ASCIIGraphConfig;

  constructor(config: Partial<ASCIIGraphConfig> = {}) {
    this.config = { ...DEFAULT_ASCII_CONFIG, ...config };
  }

  /**
   * Render dependency graph as ASCII art
   */
  render(graph: DependencyGraph): string {
    let output = '';

    // Header
    output += this.renderHeader(graph);
    output += '\n';

    // Statistics
    output += this.renderStatistics(graph);
    output += '\n';

    // Graph visualization
    output += this.renderGraph(graph);
    output += '\n';

    // Legend
    output += this.renderLegend();
    output += '\n';

    return output;
  }

  /**
   * Render header section
   */
  private renderHeader(graph: DependencyGraph): string {
    let header = '╔══════════════════════════════════════════════════════════════════════════════╗\n';
    header += '║                     COORDINATOR PROMPT DEPENDENCY GRAPH                      ║\n';
    header += '╚══════════════════════════════════════════════════════════════════════════════╝\n';
    header += `\n📊 Total Tasks: ${graph.metadata.totalTasks}`;
    header += ` | 🔗 Dependencies: ${graph.edges.length}`;
    header += ` | 📏 Max Depth: ${graph.metadata.maxDepth}`;

    return header;
  }

  /**
   * Render statistics section
   */
  private renderStatistics(graph: DependencyGraph): string {
    let stats = '📈 STATISTICS\n';
    stats += '─'.repeat(50) + '\n';

    // Status breakdown
    stats += 'Status Breakdown:\n';
    Object.entries(graph.metadata.tasksByStatus).forEach(([status, count]) => {
      const icon = this.getStatusIcon(status);
      stats += `  ${icon} ${status}: ${count}\n`;
    });
    stats += '\n';

    // Domain breakdown
    stats += 'Domain Breakdown:\n';
    Object.entries(graph.metadata.tasksByDomain).forEach(([domain, count]) => {
      const icon = this.getDomainIcon(domain);
      stats += `  ${icon} ${domain}: ${count}\n`;
    });
    stats += '\n';

    // Critical path info
    if (graph.metadata.criticalPath.length > 0) {
      stats += `🎯 Critical Path: ${graph.metadata.criticalPath.join(' → ')}\n`;
    }

    stats += `🌱 Root Tasks: ${graph.metadata.rootTasks.length} (${graph.metadata.rootTasks.slice(0, 3).join(', ')}${graph.metadata.rootTasks.length > 3 ? '...' : ''})\n`;
    stats += `🍃 Leaf Tasks: ${graph.metadata.leafTasks.length} (${graph.metadata.leafTasks.slice(0, 3).join(', ')}${graph.metadata.leafTasks.length > 3 ? '...' : ''})`;

    return stats;
  }

  /**
   * Render graph visualization
   */
  private renderGraph(graph: DependencyGraph): string {
    let output = '🔗 DEPENDENCY GRAPH\n';
    output += '─'.repeat(50) + '\n';

    if (graph.nodes.length === 0) {
      output += '📭 No tasks to display\n';
      return output;
    }

    // Group nodes by level (simplified topological layout)
    const levels = this.calculateNodeLevels(graph);

    // Render each level
    for (let level = 0; level <= Math.max(...Object.values(levels)); level++) {
      const levelNodes = Object.entries(levels)
        .filter(([_, nodeLevel]) => nodeLevel === level)
        .map(([nodeId, _]) => graph.nodes.find(n => n.id === nodeId)!)
        .filter(Boolean);

      if (levelNodes.length > 0) {
        output += `\nLevel ${level}:\n`;
        levelNodes.forEach(node => {
          output += this.renderNode(node);
          output += '\n';
        });
      }
    }

    // Render edges (simplified)
    output += '\n📋 Dependencies:\n';
    const renderedEdges = new Set<string>();

    graph.edges.forEach(edge => {
      const edgeKey = `${edge.from}-${edge.to}`;
      if (!renderedEdges.has(edgeKey)) {
        output += `  ${edge.from} → ${edge.to}\n`;
        renderedEdges.add(edgeKey);
      }
    });

    return output;
  }

  /**
   * Calculate node levels for hierarchical layout
   */
  private calculateNodeLevels(graph: DependencyGraph): Record<string, number> {
    const levels: Record<string, number> = {};
    const visited = new Set<string>();

    const calculateLevel = (nodeId: string, currentLevel: number = 0): number => {
      if (visited.has(nodeId)) return levels[nodeId] || 0;

      visited.add(nodeId);

      // Find all nodes that depend on this node (incoming edges)
      const dependents = graph.edges
        .filter(edge => edge.from === nodeId)
        .map(edge => edge.to);

      if (dependents.length === 0) {
        // Leaf node
        levels[nodeId] = Math.max(levels[nodeId] || 0, currentLevel);
        return currentLevel;
      }

      // Calculate maximum level of dependents
      let maxDependentLevel = currentLevel;
      for (const dependent of dependents) {
        const dependentLevel = calculateLevel(dependent, currentLevel + 1);
        maxDependentLevel = Math.max(maxDependentLevel, dependentLevel);
      }

      levels[nodeId] = currentLevel;
      return currentLevel;
    };

    // Start from root nodes
    graph.metadata.rootTasks.forEach(rootId => {
      calculateLevel(rootId, 0);
    });

    // Handle any remaining nodes
    graph.nodes.forEach(node => {
      if (!levels[node.id]) {
        calculateLevel(node.id, 0);
      }
    });

    return levels;
  }

  /**
   * Render a single node as ASCII box
   */
  private renderNode(node: GraphNode): string {
    const lines = node.label.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const boxWidth = Math.max(maxLineLength + 4, 20);

    const chars = this.getBoxChars();
    let output = '';

    // Top border
    output += chars.topLeft + chars.horizontal.repeat(boxWidth - 2) + chars.topRight + '\n';

    // Content lines
    lines.forEach((line, index) => {
      const paddedLine = line.padEnd(maxLineLength);
      output += chars.vertical + ' ' + paddedLine + ' '.repeat(boxWidth - maxLineLength - 3) + chars.vertical + '\n';

      // Add status/priority line if first line and configured
      if (index === 0 && (this.config.showStatus || this.config.showPriority)) {
        let infoLine = '';
        if (this.config.showStatus) {
          infoLine += this.getStatusIcon(node.status);
        }
        if (this.config.showPriority) {
          infoLine += ' ' + this.getPriorityIcon(node.priority);
        }
        if (this.config.showDomain) {
          infoLine += ' ' + this.getDomainIcon(node.domain);
        }

        if (infoLine.trim()) {
          const paddedInfo = infoLine.trim().padEnd(maxLineLength);
          output += chars.vertical + ' ' + this.colorize(paddedInfo, this.getNodeColor(node)) + ' '.repeat(boxWidth - maxLineLength - 3) + chars.vertical + '\n';
        }
      }
    });

    // Bottom border
    output += chars.bottomLeft + chars.horizontal.repeat(boxWidth - 2) + chars.bottomRight;

    return output;
  }

  /**
   * Get box drawing characters based on style
   */
  private getBoxChars(): { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string; horizontal: string; vertical: string } {
    switch (this.config.boxStyle) {
      case 'double':
        return {
          topLeft: '╔',
          topRight: '╗',
          bottomLeft: '╚',
          bottomRight: '╝',
          horizontal: '═',
          vertical: '║',
        };
      case 'rounded':
        return {
          topLeft: '╭',
          topRight: '╮',
          bottomLeft: '╰',
          bottomRight: '╯',
          horizontal: '─',
          vertical: '│',
        };
      default: // single
        return {
          topLeft: '┌',
          topRight: '┐',
          bottomLeft: '└',
          bottomRight: '┘',
          horizontal: '─',
          vertical: '│',
        };
    }
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'blocked': return '🚫';
      default: return '❓';
    }
  }

  /**
   * Get priority icon
   */
  private getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  /**
   * Get domain icon
   */
  private getDomainIcon(domain: string): string {
    switch (domain) {
      case 'Idle Village': return '🏘️';
      case 'STS': return '⚔️';
      case 'Balancer': return '⚖️';
      case 'Coordinator': return '🎯';
      default: return '📋';
    }
  }

  /**
   * Get node color based on status and priority
   */
  private getNodeColor(node: GraphNode): string {
    if (!this.config.useColor) return '';

    // ANSI color codes
    switch (node.status) {
      case 'completed': return '\x1b[32m'; // Green
      case 'in_progress': return '\x1b[33m'; // Yellow
      case 'blocked': return '\x1b[31m'; // Red
      case 'pending': return '\x1b[37m'; // White
      default: return '';
    }
  }

  /**
   * Apply ANSI color to text
   */
  private colorize(text: string, color: string): string {
    if (!this.config.useColor || !color) return text;
    return `${color}${text}\x1b[0m`;
  }

  /**
   * Render legend
   */
  private renderLegend(): string {
    let legend = '📖 LEGEND\n';
    legend += '─'.repeat(50) + '\n';

    legend += 'Status:\n';
    legend += '  ⏳ Pending    🔄 In Progress    ✅ Completed    🚫 Blocked\n\n';

    legend += 'Priority:\n';
    legend += '  🔴 High    🟡 Medium    🟢 Low\n\n';

    legend += 'Domains:\n';
    legend += '  🏘️ Idle Village    ⚔️ STS    ⚖️ Balancer    🎯 Coordinator\n\n';

    legend += 'Connections:\n';
    legend += '  A → B means "B depends on A" (A must be done before B)\n\n';

    legend += 'Layout:\n';
    legend += '  Tasks are arranged by dependency level (0 = no dependencies)\n';
    legend += '  Critical path shown in statistics section';

    return legend;
  }

  /**
   * Update rendering configuration
   */
  updateConfig(newConfig: Partial<ASCIIGraphConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ASCIIGraphConfig {
    return { ...this.config };
  }

  /**
   * Render graph summary (compact version)
   */
  renderSummary(graph: DependencyGraph): string {
    let output = `📊 Kanban Dependencies: ${graph.metadata.totalTasks} tasks, ${graph.edges.length} dependencies\n`;
    output += `🔄 Status: ${Object.entries(graph.metadata.tasksByStatus).map(([s, c]) => `${s}:${c}`).join(' | ')}\n`;
    output += `🏷️ Domains: ${Object.entries(graph.metadata.tasksByDomain).map(([d, c]) => `${d}:${c}`).join(' | ')}\n`;

    if (graph.metadata.criticalPath.length > 0) {
      output += `🎯 Critical Path: ${graph.metadata.criticalPath.join(' → ')}\n`;
    }

    return output;
  }

  /**
   * Render graph as simple list
   */
  renderList(graph: DependencyGraph): string {
    let output = '📋 TASK LIST\n';
    output += '─'.repeat(50) + '\n';

    graph.nodes.forEach(node => {
      const statusIcon = this.getStatusIcon(node.status);
      const priorityIcon = this.getPriorityIcon(node.priority);
      const domainIcon = this.getDomainIcon(node.domain);

      output += `${statusIcon} ${priorityIcon} ${domainIcon} ${node.id}: ${node.label.replace('\n', ' ')}\n`;
    });

    output += '\n📋 DEPENDENCIES\n';
    output += '─'.repeat(50) + '\n';

    graph.edges.forEach(edge => {
      output += `${edge.from} → ${edge.to}\n`;
    });

    return output;
  }
}
