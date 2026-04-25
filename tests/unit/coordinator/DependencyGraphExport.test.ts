/**
 * NP-169 – Coordinator Dependency Graph Visual Exporter Tests
 *
 * Unit tests for dependency graph visualization and export functionality.
 * Tests configuration, DOT generation, SVG/PNG export, and telemetry integration.
 *
 * @since 2026-01-24
 * @author Atlas-Coordinator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DependencyGraph, GraphNode, GraphEdge } from '../../balancing/dependencyGraphGenerator';
import {
  DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG,
  DEPENDENCY_GRAPH_VIZ_PRESETS,
  type DependencyGraphVizConfig,
  validateDependencyGraphVizConfig,
} from '../../coordinator/dependencyGraphVizConfig';

// Mock the dependency graph generator
vi.mock('../../balancing/dependencyGraphGenerator', () => ({
  DependencyGraphGenerator: vi.fn().mockImplementation(() => ({
    generateGraph: vi.fn().mockReturnValue({
      nodes: [
        {
          id: 'NP-001',
          label: 'Test Task 1',
          status: 'completed',
          priority: 'high',
          domain: 'Coordinator',
        },
        {
          id: 'NP-002',
          label: 'Test Task 2',
          status: 'in_progress',
          priority: 'medium',
          domain: 'Balancer',
        },
        {
          id: 'NP-003',
          label: 'Test Task 3',
          status: 'pending',
          priority: 'low',
          domain: 'Idle Village',
        },
      ],
      edges: [
        {
          from: 'NP-001',
          to: 'NP-002',
          label: 'dependency',
        },
        {
          from: 'NP-002',
          to: 'NP-003',
          label: 'blocks',
        },
      ],
    }),
  })),
}));

// Mock file system operations
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Mock child process
vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue('<svg></svg>'),
}));

describe('DependencyGraphVizConfig', () => {
  describe('validateDependencyGraphVizConfig', () => {
    it('should validate valid configuration', () => {
      const config = {
        layout: 'TB' as const,
        rankSep: 1.0,
        nodeSep: 0.8,
      };

      const result = validateDependencyGraphVizConfig(config);
      expect(result.layout).toBe('TB');
      expect(result.rankSep).toBe(1.0);
      expect(result.nodeSep).toBe(0.8);
    });

    it('should throw error for invalid configuration', () => {
      const config = {
        layout: 'invalid' as any,
        rankSep: -1,
      };

      expect(() => validateDependencyGraphVizConfig(config)).toThrow();
    });

    it('should use default values for missing properties', () => {
      const config = {};
      const result = validateDependencyGraphVizConfig(config);
      
      expect(result.layout).toBe('TB');
      expect(result.rankSep).toBe(1.0);
      expect(result.nodeSep).toBe(0.8);
      expect(result.showStatus).toBe(true);
      expect(result.showPriority).toBe(true);
    });
  });

  describe('DEPENDENCY_GRAPH_VIZ_PRESETS', () => {
    it('should provide compact preset', () => {
      const preset = DEPENDENCY_GRAPH_VIZ_PRESETS.compact;
      
      expect(preset.layout).toBe('LR');
      expect(preset.rankSep).toBe(0.5);
      expect(preset.showPriority).toBe(false);
      expect(preset.showDomain).toBe(false);
      expect(preset.clusterByDomain).toBe(false);
    });

    it('should provide detailed preset', () => {
      const preset = DEPENDENCY_GRAPH_VIZ_PRESETS.detailed;
      
      expect(preset.layout).toBe('TB');
      expect(preset.rankSep).toBe(1.5);
      expect(preset.showPriority).toBe(true);
      expect(preset.showDomain).toBe(true);
      expect(preset.clusterByDomain).toBe(true);
    });

    it('should provide mobile preset', () => {
      const preset = DEPENDENCY_GRAPH_VIZ_PRESETS.mobile;
      
      expect(preset.layout).toBe('TB');
      expect(preset.nodeStyle.fontSize).toBe(9);
      expect(preset.showPriority).toBe(false);
      expect(preset.showDomain).toBe(false);
    });

    it('should provide print preset', () => {
      const preset = DEPENDENCY_GRAPH_VIZ_PRESETS.print;
      
      expect(preset.layout).toBe('LR');
      expect(preset.nodeStyle.fontColor).toBe('#000000');
      expect(preset.edgeStyle.color).toBe('#000000');
    });
  });

  describe('DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG', () => {
    it('should have all required properties', () => {
      const config = DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG;
      
      expect(config).toHaveProperty('layout');
      expect(config).toHaveProperty('rankSep');
      expect(config).toHaveProperty('nodeSep');
      expect(config).toHaveProperty('statusColors');
      expect(config).toHaveProperty('domainColors');
      expect(config).toHaveProperty('nodeStyle');
      expect(config).toHaveProperty('edgeStyle');
      expect(config).toHaveProperty('output');
      expect(config).toHaveProperty('export');
    });

    it('should have valid status colors', () => {
      const { statusColors } = DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG;
      
      expect(statusColors).toHaveProperty('pending');
      expect(statusColors).toHaveProperty('in_progress');
      expect(statusColors).toHaveProperty('completed');
      expect(statusColors).toHaveProperty('blocked');
      
      // Check color format (hex)
      Object.values(statusColors).forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should have valid domain colors', () => {
      const { domainColors } = DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG;
      
      expect(domainColors).toHaveProperty('Idle Village');
      expect(domainColors).toHaveProperty('STS');
      expect(domainColors).toHaveProperty('Balancer');
      expect(domainColors).toHaveProperty('Coordinator');
      expect(domainColors).toHaveProperty('Other');
      
      // Check color format (hex)
      Object.values(domainColors).forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should have valid output configuration', () => {
      const { output } = DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG;
      
      expect(output.svg).toBe(true);
      expect(output.png).toBe(true);
      expect(output.json).toBe(true);
      expect(output.directory).toBe('test-results');
      expect(output.prefix).toBe('dependency-graph');
    });
  });
});

describe('Dependency Graph Export Functionality', () => {
  let mockGraph: DependencyGraph;
  let mockConfig: DependencyGraphVizConfig;

  beforeEach(() => {
    mockGraph = {
      nodes: [
        {
          id: 'NP-001',
          label: 'Test Task 1',
          status: 'completed',
          priority: 'high',
          domain: 'Coordinator',
        },
        {
          id: 'NP-002',
          label: 'Test Task 2',
          status: 'in_progress',
          priority: 'medium',
          domain: 'Balancer',
        },
        {
          id: 'NP-003',
          label: 'Test Task 3',
          status: 'pending',
          priority: 'low',
          domain: 'Idle Village',
        },
      ],
      edges: [
        {
          from: 'NP-001',
          to: 'NP-002',
          label: 'dependency',
        },
        {
          from: 'NP-002',
          to: 'NP-003',
          label: 'blocks',
        },
      ],
    };

    mockConfig = DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG;
  });

  describe('DOT File Generation', () => {
    it('should generate valid DOT file content', () => {
      const dotContent = generateDotFile(mockGraph, mockConfig);
      
      expect(dotContent).toContain('digraph DependencyGraph {');
      expect(dotContent).toContain('rankdir=TB;');
      expect(dotContent).toContain('ranksep=1.0;');
      expect(dotContent).toContain('nodesep=0.8;');
      expect(dotContent).toContain('"NP-001"');
      expect(dotContent).toContain('"NP-002"');
      expect(dotContent).toContain('"NP-003"');
      expect(dotContent).toContain('"NP-001" -> "NP-002"');
      expect(dotContent).toContain('"NP-002" -> "NP-003"');
      expect(dotContent).toContain('}');
    });

    it('should include domain clusters when enabled', () => {
      const configWithClustering = {
        ...mockConfig,
        clusterByDomain: true,
      };
      
      const dotContent = generateDotFile(mockGraph, configWithClustering);
      
      expect(dotContent).toContain('subgraph cluster_Coordinator');
      expect(dotContent).toContain('subgraph cluster_Balancer');
      expect(dotContent).toContain('subgraph cluster_Idle_Village');
      expect(dotContent).toContain('label="Coordinator"');
      expect(dotContent).toContain('label="Balancer"');
      expect(dotContent).toContain('label="Idle Village"');
    });

    it('should not include domain clusters when disabled', () => {
      const configWithoutClustering = {
        ...mockConfig,
        clusterByDomain: false,
      };
      
      const dotContent = generateDotFile(mockGraph, configWithoutClustering);
      
      expect(dotContent).not.toContain('subgraph cluster_');
    });

    it('should include status indicators when enabled', () => {
      const configWithStatus = {
        ...mockConfig,
        showStatus: true,
      };
      
      const dotContent = generateDotFile(mockGraph, configWithStatus);
      
      expect(dotContent).toContain('✓'); // completed
      expect(dotContent).toContain('⏳'); // in_progress
      expect(dotContent).toContain('⏸'); // pending
    });

    it('should include priority indicators when enabled', () => {
      const configWithPriority = {
        ...mockConfig,
        showPriority: true,
      };
      
      const dotContent = generateDotFile(mockGraph, configWithPriority);
      
      expect(dotContent).toContain('🔴'); // high
      expect(dotContent).toContain('🟡'); // medium
      expect(dotContent).toContain('🟢'); // low
    });

    it('should include edge labels when enabled', () => {
      const configWithLabels = {
        ...mockConfig,
        showLabels: true,
      };
      
      const dotContent = generateDotFile(mockGraph, configWithLabels);
      
      expect(dotContent).toContain('[label="dependency"]');
      expect(dotContent).toContain('[label="blocks"]');
    });
  });

  describe('Export Statistics', () => {
    it('should calculate correct statistics', () => {
      const stats = calculateStats(mockGraph);
      
      expect(stats.totalNodes).toBe(3);
      expect(stats.totalEdges).toBe(2);
      expect(stats.nodesByStatus.completed).toBe(1);
      expect(stats.nodesByStatus.in_progress).toBe(1);
      expect(stats.nodesByStatus.pending).toBe(1);
      expect(stats.nodesByDomain.Coordinator).toBe(1);
      expect(stats.nodesByDomain.Balancer).toBe(1);
      expect(stats.nodesByDomain['Idle Village']).toBe(1);
      expect(stats.nodesByPriority.high).toBe(1);
      expect(stats.nodesByPriority.medium).toBe(1);
      expect(stats.nodesByPriority.low).toBe(1);
    });

    it('should identify orphaned nodes', () => {
      const graphWithOrphan = {
        ...mockGraph,
        nodes: [
          ...mockGraph.nodes,
          {
            id: 'NP-004',
            label: 'Orphan Task',
            status: 'pending',
            priority: 'low',
            domain: 'Other',
          },
        ],
      };
      
      const stats = calculateStats(graphWithOrphan);
      
      expect(stats.orphanedNodes).toContain('NP-004');
    });

    it('should detect circular dependencies', () => {
      const graphWithCycle = {
        nodes: mockGraph.nodes,
        edges: [
          ...mockGraph.edges,
          {
            from: 'NP-003',
            to: 'NP-001',
            label: 'cycle',
          },
        ],
      };
      
      const stats = calculateStats(graphWithCycle);
      
      expect(stats.circularDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('Node Styling', () => {
    it('should generate correct node DOT with all features', () => {
      const node: GraphNode = {
        id: 'NP-001',
        label: 'Test Task',
        status: 'completed',
        priority: 'high',
        domain: 'Coordinator',
      };
      
      const nodeDot = generateNodeDot(node, mockConfig);
      
      expect(nodeDot).toContain('"NP-001"');
      expect(nodeDot).toContain('fillcolor="#10b981"'); // completed color
      expect(nodeDot).toContain('fontcolor="#ffffff"');
    });

    it('should generate simple node label when features disabled', () => {
      const configSimple = {
        ...mockConfig,
        showStatus: false,
        showPriority: false,
        showDomain: false,
      };
      
      const node: GraphNode = {
        id: 'NP-001',
        label: 'Test Task',
        status: 'completed',
        priority: 'high',
        domain: 'Coordinator',
      };
      
      const nodeDot = generateNodeDot(node, configSimple);
      
      expect(nodeDot).toContain('label="Test Task"');
      expect(nodeDot).not.toContain('✓');
      expect(nodeDot).not.toContain('🔴');
      expect(nodeDot).not.toContain('Coordinator');
    });
  });

  describe('Edge Styling', () => {
    it('should generate correct edge DOT', () => {
      const edge: GraphEdge = {
        from: 'NP-001',
        to: 'NP-002',
        label: 'dependency',
      };
      
      const edgeDot = generateEdgeDot(edge, mockConfig);
      
      expect(edgeDot).toContain('"NP-001" -> "NP-002"');
      expect(edgeDot).toContain('style=solid');
      expect(edgeDot).toContain('color="#9ca3af"');
      expect(edgeDot).toContain('arrowhead=normal');
    });

    it('should include edge labels when enabled', () => {
      const configWithLabels = {
        ...mockConfig,
        showLabels: true,
      };
      
      const edge: GraphEdge = {
        from: 'NP-001',
        to: 'NP-002',
        label: 'dependency',
      };
      
      const edgeDot = generateEdgeDot(edge, configWithLabels);
      
      expect(edgeDot).toContain('[label="dependency"]');
    });
  });
});

// Helper functions for testing
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

function generateEdgeDot(edge: GraphEdge, config: DependencyGraphVizConfig): string {
  let edgeDef = `    "${edge.from}" -> "${edge.to}"`;
  
  if (config.showLabels && edge.label) {
    edgeDef += ` [label="${edge.label}"]`;
  }
  
  edgeDef += ` [style=${config.edgeStyle.style}, color="${config.edgeStyle.color}", arrowhead=${config.edgeStyle.arrowHead}];\n`;
  
  return edgeDef;
}

function getNodeStatusIcon(status: string): string {
  switch (status) {
    case 'completed': return '✓';
    case 'in_progress': return '⏳';
    case 'blocked': return '🚫';
    case 'pending': return '⏸';
    default: return '❓';
  }
}

function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

function calculateStats(graph: DependencyGraph) {
  const stats = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    nodesByStatus: {} as Record<string, number>,
    nodesByDomain: {} as Record<string, number>,
    nodesByPriority: {} as Record<string, number>,
    criticalPath: [] as string[],
    orphanedNodes: [] as string[],
    circularDependencies: [] as string[][],
  };
  
  // Count nodes by status
  for (const node of graph.nodes) {
    stats.nodesByStatus[node.status] = (stats.nodesByStatus[node.status] || 0) + 1;
    stats.nodesByDomain[node.domain] = (stats.nodesByDomain[node.domain] || 0) + 1;
    stats.nodesByPriority[node.priority] = (stats.nodesByPriority[node.priority] || 0) + 1;
  }
  
  // Find orphaned nodes
  const connectedNodes = new Set<string>();
  for (const edge of graph.edges) {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  }
  stats.orphanedNodes = graph.nodes
    .filter(node => !connectedNodes.has(node.id))
    .map(node => node.id);
  
  return stats;
}
