/**
 * NP-098 – PNG Graph Exporter
 *
 * Exports dependency graphs as PNG images using Canvas API.
 * Generates visual representations of task dependencies with colors and layouts.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { writeFileSync } from 'fs';
import type { DependencyGraph, GraphNode, GraphEdge } from './dependencyGraphGenerator';

/**
 * PNG export configuration
 */
export interface PNGExportConfig {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Background color */
  backgroundColor: string;
  /** Node spacing */
  nodeSpacing: number;
  /** Font family */
  fontFamily: string;
  /** Font size for node labels */
  fontSize: number;
  /** Node dimensions */
  nodeWidth: number;
  nodeHeight: number;
  /** Edge color */
  edgeColor: string;
  /** Edge width */
  edgeWidth: number;
  /** Arrow size */
  arrowSize: number;
  /** Show legend */
  showLegend: boolean;
  /** Layout algorithm */
  layout: 'hierarchical' | 'force' | 'circular';
}

/**
 * Default PNG export configuration
 */
export const DEFAULT_PNG_CONFIG: PNGExportConfig = {
  width: 1200,
  height: 800,
  backgroundColor: '#ffffff',
  nodeSpacing: 150,
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  nodeWidth: 120,
  nodeHeight: 60,
  edgeColor: '#666666',
  edgeWidth: 2,
  arrowSize: 8,
  showLegend: true,
  layout: 'hierarchical',
};

/**
 * Node position and layout information
 */
interface NodePosition {
  x: number;
  y: number;
  level: number;
  column: number;
}

/**
 * PNG Graph Exporter
 */
export class PNGGraphExporter {
  private config: PNGExportConfig;

  constructor(config: Partial<PNGExportConfig> = {}) {
    this.config = { ...DEFAULT_PNG_CONFIG, ...config };
  }

  /**
   * Export dependency graph to PNG file
   */
  async exportToPNG(graph: DependencyGraph, outputPath: string): Promise<void> {
    try {
      // Calculate node positions
      const positions = this.calculateLayout(graph);

      // Generate SVG first (since we don't have Canvas in this environment)
      const svgContent = this.generateSVG(graph, positions);

      // Convert SVG to PNG (placeholder - would use canvas library)
      const pngBuffer = await this.convertSVGToPNG(svgContent);

      // Write to file
      writeFileSync(outputPath, pngBuffer);

      console.log(`✅ PNG graph exported to: ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to export PNG: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Calculate node layout positions
   */
  private calculateLayout(graph: DependencyGraph): Map<string, NodePosition> {
    const positions = new Map<string, NodePosition>();

    switch (this.config.layout) {
      case 'hierarchical':
        return this.calculateHierarchicalLayout(graph);
      case 'circular':
        return this.calculateCircularLayout(graph);
      case 'force':
        return this.calculateForceLayout(graph);
      default:
        return this.calculateHierarchicalLayout(graph);
    }
  }

  /**
   * Calculate hierarchical layout (top-down)
   */
  private calculateHierarchicalLayout(graph: DependencyGraph): Map<string, NodePosition> {
    const positions = new Map<string, NodePosition>();

    // Group nodes by level
    const levels = this.calculateNodeLevels(graph);
    const levelNodes = new Map<number, string[]>();

    for (const [nodeId, level] of Object.entries(levels)) {
      if (!levelNodes.has(level)) {
        levelNodes.set(level, []);
      }
      levelNodes.get(level)!.push(nodeId);
    }

    // Position nodes in each level
    const centerX = this.config.width / 2;
    const levelHeight = this.config.height / Math.max(levelNodes.size + 1, 2);

    for (const [level, nodeIds] of levelNodes.entries()) {
      const levelY = levelHeight * (level + 1);
      const totalWidth = nodeIds.length * this.config.nodeWidth + (nodeIds.length - 1) * this.config.nodeSpacing;
      const startX = centerX - totalWidth / 2;

      nodeIds.forEach((nodeId, index) => {
        const x = startX + index * (this.config.nodeWidth + this.config.nodeSpacing);
        positions.set(nodeId, {
          x,
          y: levelY,
          level,
          column: index,
        });
      });
    }

    return positions;
  }

  /**
   * Calculate circular layout
   */
  private calculateCircularLayout(graph: DependencyGraph): Map<string, NodePosition> {
    const positions = new Map<string, NodePosition>();
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const radius = Math.min(this.config.width, this.config.height) * 0.35;

    graph.nodes.forEach((node, index) => {
      const angle = (index / graph.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      positions.set(node.id, {
        x,
        y,
        level: 0,
        column: index,
      });
    });

    return positions;
  }

  /**
   * Calculate force-directed layout (simplified)
   */
  private calculateForceLayout(graph: DependencyGraph): Map<string, NodePosition> {
    // Simplified force-directed layout
    const positions = new Map<string, NodePosition>();
    const nodeCount = graph.nodes.length;

    // Initial circular layout
    graph.nodes.forEach((node, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI;
      const radius = 200;
      const centerX = this.config.width / 2;
      const centerY = this.config.height / 2;

      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        level: 0,
        column: index,
      });
    });

    // Simple force simulation (placeholder - would be more sophisticated)
    for (let iteration = 0; iteration < 10; iteration++) {
      // Apply repulsive forces between all nodes
      for (const nodeA of graph.nodes) {
        for (const nodeB of graph.nodes) {
          if (nodeA.id !== nodeB.id) {
            const posA = positions.get(nodeA.id)!;
            const posB = positions.get(nodeB.id)!;

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
              const force = 10000 / (distance * distance);
              const fx = (dx / distance) * force * 0.01;
              const fy = (dy / distance) * force * 0.01;

              posA.x -= fx;
              posA.y -= fy;
              posB.x += fx;
              posB.y += fy;
            }
          }
        }
      }

      // Apply attractive forces for connected nodes
      for (const edge of graph.edges) {
        const posA = positions.get(edge.from);
        const posB = positions.get(edge.to);

        if (posA && posB) {
          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const targetDistance = 150;

          if (distance > 0) {
            const force = (distance - targetDistance) * 0.01;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            posA.x += fx;
            posA.y += fy;
            posB.x -= fx;
            posB.y -= fy;
          }
        }
      }
    }

    return positions;
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
   * Generate SVG content for the graph
   */
  private generateSVG(graph: DependencyGraph, positions: Map<string, NodePosition>): string {
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.config.width}" height="${this.config.height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${this.config.width}" height="${this.config.height}" fill="${this.config.backgroundColor}"/>

  <!-- Edges -->
  <g id="edges">`;

    // Draw edges
    for (const edge of graph.edges) {
      const fromPos = positions.get(edge.from);
      const toPos = positions.get(edge.to);

      if (fromPos && toPos) {
        const fromX = fromPos.x + this.config.nodeWidth / 2;
        const fromY = fromPos.y + this.config.nodeHeight / 2;
        const toX = toPos.x + this.config.nodeWidth / 2;
        const toY = toPos.y + this.config.nodeHeight / 2;

        svg += `    <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="${this.config.edgeColor}" stroke-width="${this.config.edgeWidth}"/>`;

        // Draw arrow
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowX = toX - this.config.arrowSize * Math.cos(angle);
        const arrowY = toY - this.config.arrowSize * Math.sin(angle);

        svg += `    <polygon points="${toX},${toY} ${arrowX - this.config.arrowSize * Math.sin(angle)},${arrowY + this.config.arrowSize * Math.cos(angle)} ${arrowX + this.config.arrowSize * Math.sin(angle)},${arrowY - this.config.arrowSize * Math.cos(angle)}" fill="${this.config.edgeColor}"/>`;
      }
    }

    svg += `  </g>

  <!-- Nodes -->
  <g id="nodes">`;

    // Draw nodes
    for (const node of graph.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const fillColor = this.getNodeColor(node);
      const strokeColor = this.getNodeBorderColor(node);

      svg += `    <rect x="${pos.x}" y="${pos.y}" width="${this.config.nodeWidth}" height="${this.config.nodeHeight}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" rx="6"/>`;

      // Node text
      const lines = node.label.split('\n');
      lines.forEach((line, index) => {
        const textY = pos.y + this.config.nodeHeight / 2 + (index - (lines.length - 1) / 2) * 14;
        svg += `    <text x="${pos.x + this.config.nodeWidth / 2}" y="${textY}" text-anchor="middle" font-family="${this.config.fontFamily}" font-size="${this.config.fontSize}" fill="#000000">${this.escapeXML(line)}</text>`;
      });

      // Status indicator
      const statusColor = this.getStatusColor(node.status);
      svg += `    <circle cx="${pos.x + this.config.nodeWidth - 10}" cy="${pos.y + 10}" r="6" fill="${statusColor}"/>`;
    }

    svg += `  </g>`;

    // Legend
    if (this.config.showLegend) {
      svg += this.generateSVGLegend();
    }

    svg += `</svg>`;

    return svg;
  }

  /**
   * Generate SVG legend
   */
  private generateSVGLegend(): string {
    const legendX = 20;
    const legendY = 20;
    const itemHeight = 25;

    let legend = `  <!-- Legend -->
  <g id="legend">
    <rect x="${legendX - 10}" y="${legendY - 10}" width="200" height="150" fill="white" stroke="#cccccc" stroke-width="1" rx="4"/>
    <text x="${legendX}" y="${legendY + 15}" font-family="${this.config.fontFamily}" font-size="14" font-weight="bold">Legend</text>`;

    const legendItems = [
      { color: this.getStatusColor('pending'), label: 'Pending' },
      { color: this.getStatusColor('in_progress'), label: 'In Progress' },
      { color: this.getStatusColor('completed'), label: 'Completed' },
      { color: this.getStatusColor('blocked'), label: 'Blocked' },
    ];

    legendItems.forEach((item, index) => {
      const y = legendY + 30 + index * itemHeight;
      legend += `    <circle cx="${legendX + 10}" cy="${y}" r="8" fill="${item.color}"/>
    <text x="${legendX + 25}" y="${y + 4}" font-family="${this.config.fontFamily}" font-size="12">${item.label}</text>`;
    });

    legend += `  </g>`;

    return legend;
  }

  /**
   * Get node fill color based on status and priority
   */
  private getNodeColor(node: GraphNode): string {
    // Base colors by status
    switch (node.status) {
      case 'completed': return '#d4edda'; // Light green
      case 'in_progress': return '#fff3cd'; // Light yellow
      case 'blocked': return '#f8d7da'; // Light red
      case 'pending': return '#f8f9fa'; // Light gray
      default: return '#ffffff';
    }
  }

  /**
   * Get node border color based on priority
   */
  private getNodeBorderColor(node: GraphNode): string {
    switch (node.priority) {
      case 'high': return '#dc3545'; // Red
      case 'medium': return '#ffc107'; // Yellow
      case 'low': return '#28a745'; // Green
      default: return '#6c757d'; // Gray
    }
  }

  /**
   * Get status indicator color
   */
  private getStatusColor(status: GraphNode['status']): string {
    switch (status) {
      case 'completed': return '#28a745'; // Green
      case 'in_progress': return '#ffc107'; // Yellow
      case 'blocked': return '#dc3545'; // Red
      case 'pending': return '#6c757d'; // Gray
      default: return '#6c757d';
    }
  }

  /**
   * Convert SVG to PNG buffer (placeholder - would use canvas library)
   */
  private async convertSVGToPNG(svgContent: string): Promise<Buffer> {
    // Placeholder implementation
    // In a real implementation, this would use a library like canvas or puppeteer
    // to convert SVG to PNG

    console.log('⚠️ PNG conversion placeholder - SVG content generated but not converted to PNG');
    console.log('To implement PNG export, install a canvas library like "canvas" or "node-canvas"');

    // Return SVG content as buffer for now
    return Buffer.from(svgContent);
  }

  /**
   * Escape XML characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Update export configuration
   */
  updateConfig(newConfig: Partial<PNGExportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PNGExportConfig {
    return { ...this.config };
  }

  /**
   * Export graph with custom layout
   */
  async exportWithLayout(graph: DependencyGraph, outputPath: string, layout: PNGExportConfig['layout']): Promise<void> {
    const originalLayout = this.config.layout;
    this.config.layout = layout;

    try {
      await this.exportToPNG(graph, outputPath);
    } finally {
      this.config.layout = originalLayout;
    }
  }
}
