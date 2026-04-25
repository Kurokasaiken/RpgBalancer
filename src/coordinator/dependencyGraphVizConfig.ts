/**
 * NP-169 – Coordinator Dependency Graph Visualization Configuration
 *
 * Configuration for dependency graph visualization with Graphviz/SVG export.
 * Defines layout options, color schemes, and export settings.
 *
 * @since 2026-01-24
 * @author Atlas-Coordinator
 */

import { z } from 'zod';

/**
 * Graph layout direction options
 */
export type GraphLayout = 'TB' | 'LR' | 'BT' | 'RL';

/**
 * Node status colors
 */
export interface StatusColors {
  pending: string;
  in_progress: string;
  completed: string;
  blocked: string;
}

/**
 * Domain colors for visual categorization
 */
export interface DomainColors {
  'Idle Village': string;
  'STS': string;
  'Balancer': string;
  'Coordinator': string;
  'Other': string;
}

/**
 * Node styling options
 */
export interface NodeStyle {
  shape: 'box' | 'ellipse' | 'diamond' | 'circle' | 'plaintext';
  style: 'filled' | 'solid' | 'dashed' | 'dotted' | 'bold';
  fontName: string;
  fontSize: number;
  fontColor: string;
  margin: number;
  padding: number;
}

/**
 * Edge styling options
 */
export interface EdgeStyle {
  style: 'solid' | 'dashed' | 'dotted' | 'bold';
  color: string;
  arrowHead: 'normal' | 'vee' | 'crow' | 'diamond' | 'dot' | 'open' | 'none';
  weight: number;
  penWidth: number;
}

/**
 * Graph visualization configuration
 */
export interface DependencyGraphVizConfig {
  /** Graph layout direction */
  layout: GraphLayout;
  /** Graph rank separation */
  rankSep: number;
  /** Node separation */
  nodeSep: number;
  /** Graph size constraints */
  size?: string;
  /** Graph aspect ratio */
  ratio?: string;
  /** Status color scheme */
  statusColors: StatusColors;
  /** Domain color scheme */
  domainColors: DomainColors;
  /** Node styling */
  nodeStyle: NodeStyle;
  /** Edge styling */
  edgeStyle: EdgeStyle;
  /** Show node status indicators */
  showStatus: boolean;
  /** Show node priorities */
  showPriority: boolean;
  /** Show node domains */
  showDomain: boolean;
  /** Show dependency labels */
  showLabels: boolean;
  /** Cluster nodes by domain */
  clusterByDomain: boolean;
  /** Output format options */
  output: {
    /** Generate SVG output */
    svg: boolean;
    /** Generate PNG output */
    png: boolean;
    /** Generate JSON metadata */
    json: boolean;
    /** Output directory */
    directory: string;
    /** File name prefix */
    prefix: string;
  };
  /** Export options */
  export: {
    /** Include graph statistics */
    includeStats: boolean;
    /** Include node metadata */
    includeNodeMetadata: boolean;
    /** Include edge metadata */
    includeEdgeMetadata: boolean;
    /** Compress JSON output */
    compressJson: boolean;
  };
}

/**
 * Zod schema for configuration validation
 */
export const DependencyGraphVizConfigSchema = z.object({
  layout: z.enum(['TB', 'LR', 'BT', 'RL']).default('TB'),
  rankSep: z.number().min(0.1).max(5.0).default(1.0),
  nodeSep: z.number().min(0.1).max(5.0).default(0.8),
  size: z.string().optional(),
  ratio: z.string().optional(),
  statusColors: z.object({
    pending: z.string().default('#fbbf24'), // amber-400
    in_progress: z.string().default('#3b82f6'), // blue-500
    completed: z.string().default('#10b981'), // emerald-500
    blocked: z.string().default('#ef4444'), // red-500
  }),
  domainColors: z.object({
    'Idle Village': z.string().default('#8b5cf6'), // violet-500
    'STS': z.string().default('#f59e0b'), // amber-500
    'Balancer': z.string().default('#06b6d4'), // cyan-500
    'Coordinator': z.string().default('#ec4899'), // pink-500
    'Other': z.string().default('#6b7280'), // gray-500
  }),
  nodeStyle: z.object({
    shape: z.enum(['box', 'ellipse', 'diamond', 'circle', 'plaintext']).default('box'),
    style: z.enum(['filled', 'solid', 'dashed', 'dotted', 'bold']).default('filled'),
    fontName: z.string().default('Arial, sans-serif'),
    fontSize: z.number().min(8).max(24).default(12),
    fontColor: z.string().default('#ffffff'),
    margin: z.number().min(0).max(20).default(8),
    padding: z.number().min(0).max(20).default(6),
  }),
  edgeStyle: z.object({
    style: z.enum(['solid', 'dashed', 'dotted', 'bold']).default('solid'),
    color: z.string().default('#9ca3af'), // gray-400
    arrowHead: z.enum(['normal', 'vee', 'crow', 'diamond', 'dot', 'open', 'none']).default('normal'),
    weight: z.number().min(0).max(10).default(1),
    penWidth: z.number().min(0.1).max(5.0).default(1.0),
  }),
  showStatus: z.boolean().default(true),
  showPriority: z.boolean().default(true),
  showDomain: z.boolean().default(true),
  showLabels: z.boolean().default(true),
  clusterByDomain: z.boolean().default(true),
  output: z.object({
    svg: z.boolean().default(true),
    png: z.boolean().default(true),
    json: z.boolean().default(true),
    directory: z.string().default('test-results'),
    prefix: z.string().default('dependency-graph'),
  }),
  export: z.object({
    includeStats: z.boolean().default(true),
    includeNodeMetadata: z.boolean().default(true),
    includeEdgeMetadata: z.boolean().default(true),
    compressJson: z.boolean().default(false),
  }),
});

/**
 * Default configuration
 */
export const DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG: DependencyGraphVizConfig = {
  layout: 'TB',
  rankSep: 1.0,
  nodeSep: 0.8,
  statusColors: {
    pending: '#fbbf24', // amber-400
    in_progress: '#3b82f6', // blue-500
    completed: '#10b981', // emerald-500
    blocked: '#ef4444', // red-500
  },
  domainColors: {
    'Idle Village': '#8b5cf6', // violet-500
    'STS': '#f59e0b', // amber-500
    'Balancer': '#06b6d4', // cyan-500
    'Coordinator': '#ec4899', // pink-500
    'Other': '#6b7280', // gray-500
  },
  nodeStyle: {
    shape: 'box',
    style: 'filled',
    fontName: 'Arial, sans-serif',
    fontSize: 12,
    fontColor: '#ffffff',
    margin: 8,
    padding: 6,
  },
  edgeStyle: {
    style: 'solid',
    color: '#9ca3af', // gray-400
    arrowHead: 'normal',
    weight: 1,
    penWidth: 1.0,
  },
  showStatus: true,
  showPriority: true,
  showDomain: true,
  showLabels: true,
  clusterByDomain: true,
  output: {
    svg: true,
    png: true,
    json: true,
    directory: 'test-results',
    prefix: 'dependency-graph',
  },
  export: {
    includeStats: true,
    includeNodeMetadata: true,
    includeEdgeMetadata: true,
    compressJson: false,
  },
};

/**
 * Preset configurations for different use cases
 */
export const DEPENDENCY_GRAPH_VIZ_PRESETS = {
  /** Compact view for quick overview */
  compact: {
    ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG,
    layout: 'LR' as const,
    rankSep: 0.5,
    nodeSep: 0.6,
    nodeStyle: {
      ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG.nodeStyle,
      fontSize: 10,
      margin: 4,
      padding: 3,
    },
    showPriority: false,
    showDomain: false,
    clusterByDomain: false,
  },
  
  /** Detailed view for analysis */
  detailed: {
    ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG,
    layout: 'TB' as const,
    rankSep: 1.5,
    nodeSep: 1.2,
    nodeStyle: {
      ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG.nodeStyle,
      fontSize: 14,
      margin: 12,
      padding: 8,
    },
    showStatus: true,
    showPriority: true,
    showDomain: true,
    showLabels: true,
    clusterByDomain: true,
  },
  
  /** Mobile-friendly view */
  mobile: {
    ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG,
    layout: 'TB' as const,
    rankSep: 0.8,
    nodeSep: 0.5,
    nodeStyle: {
      ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG.nodeStyle,
      fontSize: 9,
      margin: 3,
      padding: 2,
    },
    showPriority: false,
    showDomain: false,
    clusterByDomain: false,
  },
  
  /** Print-friendly view */
  print: {
    ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG,
    layout: 'LR' as const,
    rankSep: 1.2,
    nodeSep: 1.0,
    nodeStyle: {
      ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG.nodeStyle,
      fontSize: 11,
      fontColor: '#000000',
      margin: 8,
      padding: 6,
    },
    statusColors: {
      pending: '#fbbf24', // amber-400
      in_progress: '#3b82f6', // blue-500
      completed: '#10b981', // emerald-500
      blocked: '#ef4444', // red-500
    },
    edgeStyle: {
      ...DEFAULT_DEPENDENCY_GRAPH_VIZ_CONFIG.edgeStyle,
      color: '#000000',
      penWidth: 1.5,
    },
    showStatus: true,
    showPriority: true,
    showDomain: true,
    clusterByDomain: true,
  },
} as const;

/**
 * Configuration validation helper
 */
export function validateDependencyGraphVizConfig(
  config: Partial<DependencyGraphVizConfig>
): DependencyGraphVizConfig {
  const result = DependencyGraphVizConfigSchema.safeParse(config);
  
  if (!result.success) {
    throw new Error(
      `Invalid dependency graph visualization configuration: ${result.error.message}`
    );
  }
  
  return result.data;
}

/**
 * Get preset configuration by name
 */
export function getDependencyGraphVizPreset(
  presetName: keyof typeof DEPENDENCY_GRAPH_VIZ_PRESETS
): DependencyGraphVizConfig {
  return DEPENDENCY_GRAPH_VIZ_PRESETS[presetName];
}

/**
 * Merge configuration with preset
 */
export function mergeWithPreset(
  presetName: keyof typeof DEPENDENCY_GRAPH_VIZ_PRESETS,
  overrides: Partial<DependencyGraphVizConfig>
): DependencyGraphVizConfig {
  const preset = getDependencyGraphVizPreset(presetName);
  const merged = { ...preset, ...overrides };
  return validateDependencyGraphVizConfig(merged);
}
