/**
 * Quest Decision Heatmap Configuration - NP-022
 * 
 * Configuration schema and types for the Idle Village Quest Decision Heatmap.
 * Defines spatial data structures, visualization settings, and interaction patterns.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('QuestDecisionHeatmapConfig', 'config');

/**
 * Quest decision types
 */
export enum QuestDecisionType {
  ACCEPT = 'accept',
  DECLINE = 'decline',
  POSTPONE = 'postpone',
  DELEGATE = 'delegate',
  EMERGENCY = 'emergency',
  STRATEGIC = 'strategic',
  ROUTINE = 'routine',
  SPECIAL = 'special',
}

/**
 * Quest priority levels
 */
export enum QuestPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  TRIVIAL = 'trivial',
}

/**
 * Quest categories
 */
export enum QuestCategory {
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  DIPLOMACY = 'diplomacy',
  CRAFTING = 'crafting',
  TRADE = 'trade',
  MYSTERY = 'mystery',
  DEFENSE = 'defense',
  RESOURCES = 'resources',
}

/**
 * Spatial coordinates for quest locations
 */
export interface QuestCoordinates {
  x: number;
  y: number;
  z?: number; // For multi-level maps
  region?: string;
  zone?: string;
}

/**
 * Quest decision data point
 */
export interface QuestDecisionData {
  id: string;
  questId: string;
  questName: string;
  coordinates: QuestCoordinates;
  decisionType: QuestDecisionType;
  priority: QuestPriority;
  category: QuestCategory;
  timestamp: number;
  decisionMaker?: string; // Who made the decision
  outcome?: 'success' | 'failure' | 'partial' | 'pending';
  impact?: {
    resources: number;
    reputation: number;
    time: number;
    risk: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Heatmap cell data
 */
export interface HeatmapCell {
  x: number;
  y: number;
  z?: number;
  decisions: QuestDecisionData[];
  intensity: number;
  dominantDecision: QuestDecisionType;
  dominantCategory: QuestCategory;
  averagePriority: number;
  successRate: number;
  totalDecisions: number;
  region?: string;
  zone?: string;
}

/**
 * Color scheme configuration
 */
export interface ColorScheme {
  name: string;
  colors: Record<QuestDecisionType, string>;
  opacity: number;
  gradient: boolean;
  scale: 'linear' | 'logarithmic' | 'exponential';
}

/**
 * Legend configuration
 */
export interface LegendConfig {
  position: 'top' | 'right' | 'bottom' | 'left' | 'floating';
  orientation: 'horizontal' | 'vertical';
  showLabels: boolean;
  showValues: boolean;
  showCategories: boolean;
  collapsible: boolean;
  interactive: boolean;
  maxItems: number;
  grouping: 'decision' | 'priority' | 'category' | 'outcome';
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  enabled: boolean;
  showOnHover: boolean;
  showOnClick: boolean;
  delay: number;
  duration: number;
  maxWidth: number;
  showCoordinates: boolean;
  showTimestamp: boolean;
  showDecisionMaker: boolean;
  showImpact: boolean;
  showOutcome: boolean;
  customFields?: string[];
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  enabled: boolean;
  position: 'top' | 'right' | 'bottom' | 'left' | 'floating';
  collapsible: boolean;
  multiSelect: boolean;
  showCounts: boolean;
  showReset: boolean;
  autoApply: boolean;
  filters: {
    decisionTypes: QuestDecisionType[];
    priorities: QuestPriority[];
    categories: QuestCategory[];
    outcomes?: ('success' | 'failure' | 'partial' | 'pending')[];
    timeRange?: {
      start: number;
      end: number;
    };
    regions?: string[];
    zones?: string[];
    decisionMakers?: string[];
  };
}

/**
 * Rendering configuration
 */
export interface RenderingConfig {
  mode: 'canvas' | 'svg' | 'webgl';
  resolution: number; // pixels per unit
  smoothing: boolean;
  antialiasing: boolean;
  interpolation: 'nearest' | 'linear' | 'cubic';
  clustering: boolean;
  clusterRadius: number;
  maxPoints: number;
  performanceMode: boolean;
  lazyLoading: boolean;
  virtualization: boolean;
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
  enabled: boolean;
  zoom: {
    enabled: boolean;
    min: number;
    max: number;
    step: number;
    wheel: boolean;
    pinch: boolean;
  };
  pan: {
    enabled: boolean;
    momentum: boolean;
    boundaries: boolean;
  };
  selection: {
    enabled: boolean;
    mode: 'single' | 'multiple' | 'area';
    showOutline: boolean;
    showHighlight: boolean;
  };
  click: {
    enabled: boolean;
    doubleClick: boolean;
    longPress: boolean;
    threshold: number;
  };
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  transitions: {
    enter: boolean;
    update: boolean;
    exit: boolean;
    hover: boolean;
    select: boolean;
  };
  effects: {
    fade: boolean;
    scale: boolean;
    slide: boolean;
    glow: boolean;
    pulse: boolean;
  };
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  maxDataPoints: number;
  updateInterval: number;
  batchSize: number;
  throttleTime: number;
  debounceTime: number;
  memoryLimit: number;
  cacheSize: number;
  enableWorker: boolean;
  enableWebGL: boolean;
  enableOffscreenCanvas: boolean;
}

/**
 * Main heatmap configuration
 */
export interface QuestDecisionHeatmapConfig {
  // Core settings
  enabled: boolean;
  autoUpdate: boolean;
  realTime: boolean;
  
  // Data settings
  data: {
    source: string;
    refreshInterval: number;
    maxAge: number; // Maximum age of data points in ms
    aggregation: 'none' | 'hour' | 'day' | 'week' | 'month';
  };
  
  // Visualization
  visualization: {
    colorScheme: ColorScheme;
    rendering: RenderingConfig;
    interaction: InteractionConfig;
    animation: AnimationConfig;
    performance: PerformanceConfig;
  };
  
  // UI Components
  legend: LegendConfig;
  tooltip: TooltipConfig;
  filter: FilterConfig;
  
  // Layout
  layout: {
    width: number;
    height: number;
    margin: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    padding: number;
    responsive: boolean;
    maintainAspectRatio: boolean;
  };
  
  // Accessibility
  accessibility: {
    keyboardNavigation: boolean;
    screenReader: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    focusVisible: boolean;
    ariaLabels: boolean;
  };
  
  // Debugging
  debug: {
    enabled: boolean;
    showGrid: boolean;
    showCoordinates: boolean;
    showBounds: boolean;
    showStats: boolean;
    logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Default color schemes
 */
export const DEFAULT_COLOR_SCHEMES: Record<string, ColorScheme> = {
  classic: {
    name: 'Classic',
    colors: {
      [QuestDecisionType.ACCEPT]: '#10b981',
      [QuestDecisionType.DECLINE]: '#ef4444',
      [QuestDecisionType.POSTPONE]: '#f59e0b',
      [QuestDecisionType.DELEGATE]: '#3b82f6',
      [QuestDecisionType.EMERGENCY]: '#dc2626',
      [QuestDecisionType.STRATEGIC]: '#8b5cf6',
      [QuestDecisionType.ROUTINE]: '#6b7280',
      [QuestDecisionType.SPECIAL]: '#ec4899',
    },
    opacity: 0.8,
    gradient: true,
    scale: 'linear',
  },
  thermal: {
    name: 'Thermal',
    colors: {
      [QuestDecisionType.ACCEPT]: '#00ff00',
      [QuestDecisionType.DECLINE]: '#ff0000',
      [QuestDecisionType.POSTPONE]: '#ffff00',
      [QuestDecisionType.DELEGATE]: '#00ffff',
      [QuestDecisionType.EMERGENCY]: '#ff00ff',
      [QuestDecisionType.STRATEGIC]: '#0000ff',
      [QuestDecisionType.ROUTINE]: '#808080',
      [QuestDecisionType.SPECIAL]: '#ff8800',
    },
    opacity: 0.7,
    gradient: true,
    scale: 'exponential',
  },
  monochrome: {
    name: 'Monochrome',
    colors: {
      [QuestDecisionType.ACCEPT]: '#000000',
      [QuestDecisionType.DECLINE]: '#333333',
      [QuestDecisionType.POSTPONE]: '#666666',
      [QuestDecisionType.DELEGATE]: '#999999',
      [QuestDecisionType.EMERGENCY]: '#cccccc',
      [QuestDecisionType.STRATEGIC]: '#555555',
      [QuestDecisionType.ROUTINE]: '#777777',
      [QuestDecisionType.SPECIAL]: '#aaaaaa',
    },
    opacity: 0.9,
    gradient: false,
    scale: 'linear',
  },
};

/**
 * Default configuration
 */
export const DEFAULT_QUEST_DECISION_HEATMAP_CONFIG: QuestDecisionHeatmapConfig = {
  enabled: true,
  autoUpdate: true,
  realTime: false,
  
  data: {
    source: 'idle-village-quest-decisions',
    refreshInterval: 30000, // 30 seconds
    maxAge: 86400000, // 24 hours
    aggregation: 'none',
  },
  
  visualization: {
    colorScheme: DEFAULT_COLOR_SCHEMES.classic,
    rendering: {
      mode: 'canvas',
      resolution: 1,
      smoothing: true,
      antialiasing: true,
      interpolation: 'linear',
      clustering: true,
      clusterRadius: 50,
      maxPoints: 10000,
      performanceMode: false,
      lazyLoading: true,
      virtualization: true,
    },
    interaction: {
      enabled: true,
      zoom: {
        enabled: true,
        min: 0.5,
        max: 5,
        step: 0.1,
        wheel: true,
        pinch: true,
      },
      pan: {
        enabled: true,
        momentum: true,
        boundaries: true,
      },
      selection: {
        enabled: true,
        mode: 'multiple',
        showOutline: true,
        showHighlight: true,
      },
      click: {
        enabled: true,
        doubleClick: true,
        longPress: false,
        threshold: 10,
      },
    },
    animation: {
      enabled: true,
      duration: 300,
      easing: 'ease-out',
      transitions: {
        enter: true,
        update: true,
        exit: true,
        hover: true,
        select: true,
      },
      effects: {
        fade: true,
        scale: true,
        slide: false,
        glow: false,
        pulse: false,
      },
    },
    performance: {
      maxDataPoints: 50000,
      updateInterval: 1000,
      batchSize: 1000,
      throttleTime: 16,
      debounceTime: 100,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      cacheSize: 1000,
      enableWorker: false,
      enableWebGL: false,
      enableOffscreenCanvas: true,
    },
  },
  
  legend: {
    position: 'right',
    orientation: 'vertical',
    showLabels: true,
    showValues: true,
    showCategories: true,
    collapsible: true,
    interactive: true,
    maxItems: 10,
    grouping: 'decision',
  },
  
  tooltip: {
    enabled: true,
    showOnHover: true,
    showOnClick: false,
    delay: 200,
    duration: 3000,
    maxWidth: 300,
    showCoordinates: true,
    showTimestamp: true,
    showDecisionMaker: true,
    showImpact: true,
    showOutcome: true,
  },
  
  filter: {
    enabled: true,
    position: 'top',
    collapsible: true,
    multiSelect: true,
    showCounts: true,
    showReset: true,
    autoApply: true,
    filters: {
      decisionTypes: Object.values(QuestDecisionType),
      priorities: Object.values(QuestPriority),
      categories: Object.values(QuestCategory),
      outcomes: ['success', 'failure', 'partial', 'pending'],
      timeRange: undefined,
      regions: [],
      zones: [],
      decisionMakers: [],
    },
  },
  
  layout: {
    width: 800,
    height: 600,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    padding: 10,
    responsive: true,
    maintainAspectRatio: true,
  },
  
  accessibility: {
    keyboardNavigation: true,
    screenReader: true,
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    ariaLabels: true,
  },
  
  debug: {
    enabled: false,
    showGrid: false,
    showCoordinates: false,
    showBounds: false,
    showStats: false,
    logLevel: 'error',
  },
};

/**
 * Utility functions
 */

/**
 * Generate unique ID for quest decisions
 */
export function generateQuestDecisionId(): string {
  return `quest-decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate distance between two coordinates
 */
export function calculateDistance(
  coord1: QuestCoordinates,
  coord2: QuestCoordinates
): number {
  const dx = coord1.x - coord2.x;
  const dy = coord1.y - coord2.y;
  const dz = (coord1.z || 0) - (coord2.z || 0);
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if coordinates are within bounds
 */
export function isWithinBounds(
  coordinates: QuestCoordinates,
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }
): boolean {
  return (
    coordinates.x >= bounds.minX &&
    coordinates.x <= bounds.maxX &&
    coordinates.y >= bounds.minY &&
    coordinates.y <= bounds.maxY
  );
}

/**
 * Get color for decision type
 */
export function getDecisionTypeColor(
  decisionType: QuestDecisionType,
  colorScheme: ColorScheme
): string {
  return colorScheme.colors[decisionType] || '#000000';
}

/**
 * Get priority weight for calculations
 */
export function getPriorityWeight(priority: QuestPriority): number {
  const weights = {
    [QuestPriority.CRITICAL]: 5,
    [QuestPriority.HIGH]: 4,
    [QuestPriority.MEDIUM]: 3,
    [QuestPriority.LOW]: 2,
    [QuestPriority.TRIVIAL]: 1,
  };
  
  return weights[priority] || 1;
}

/**
 * Calculate intensity for heatmap cell
 */
export function calculateIntensity(decisions: QuestDecisionData[]): number {
  if (decisions.length === 0) return 0;
  
  // Base intensity on number of decisions and priority weights
  const totalWeight = decisions.reduce((sum, decision) => {
    return sum + getPriorityWeight(decision.priority);
  }, 0);
  
  // Normalize to 0-1 range
  const maxWeight = decisions.length * 5; // Max priority weight is 5
  return Math.min(totalWeight / maxWeight, 1);
}

/**
 * Get dominant decision type in a cell
 */
export function getDominantDecisionType(
  decisions: QuestDecisionData[]
): QuestDecisionType {
  if (decisions.length === 0) return QuestDecisionType.ROUTINE;
  
  const counts = decisions.reduce((acc, decision) => {
    acc[decision.decisionType] = (acc[decision.decisionType] || 0) + 1;
    return acc;
  }, {} as Record<QuestDecisionType, number>);
  
  return Object.entries(counts).reduce((a, b) => 
    counts[a[0] as QuestDecisionType] > counts[b[0] as QuestDecisionType] ? a : b
  )[0] as QuestDecisionType;
}

/**
 * Get dominant category in a cell
 */
export function getDominantCategory(
  decisions: QuestDecisionData[]
): QuestCategory {
  if (decisions.length === 0) return QuestCategory.ROUTINE;
  
  const counts = decisions.reduce((acc, decision) => {
    acc[decision.category] = (acc[decision.category] || 0) + 1;
    return acc;
  }, {} as Record<QuestCategory, number>);
  
  return Object.entries(counts).reduce((a, b) => 
    counts[a[0] as QuestCategory] > counts[b[0] as QuestCategory] ? a : b
  )[0] as QuestCategory;
}

/**
 * Calculate success rate for decisions
 */
export function calculateSuccessRate(decisions: QuestDecisionData[]): number {
  if (decisions.length === 0) return 0;
  
  const completedDecisions = decisions.filter(d => 
    d.outcome && d.outcome !== 'pending'
  );
  
  if (completedDecisions.length === 0) return 0;
  
  const successfulDecisions = completedDecisions.filter(d => 
    d.outcome === 'success' || d.outcome === 'partial'
  );
  
  return successfulDecisions.length / completedDecisions.length;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Validate quest decision data
 */
export function validateQuestDecisionData(
  data: QuestDecisionData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.id) errors.push('ID is required');
  if (!data.questId) errors.push('Quest ID is required');
  if (!data.questName) errors.push('Quest name is required');
  if (!data.coordinates) errors.push('Coordinates are required');
  if (!data.decisionType) errors.push('Decision type is required');
  if (!data.priority) errors.push('Priority is required');
  if (!data.category) errors.push('Category is required');
  if (!data.timestamp) errors.push('Timestamp is required');
  
  if (data.coordinates) {
    if (typeof data.coordinates.x !== 'number') errors.push('Invalid X coordinate');
    if (typeof data.coordinates.y !== 'number') errors.push('Invalid Y coordinate');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Aggregate decisions by time period
 */
export function aggregateDecisionsByTime(
  decisions: QuestDecisionData[],
  period: 'hour' | 'day' | 'week' | 'month'
): QuestDecisionData[] {
  const aggregated = new Map<string, QuestDecisionData[]>();
  
  decisions.forEach(decision => {
    const date = new Date(decision.timestamp);
    let key: string;
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
    }
    
    if (!aggregated.has(key)) {
      aggregated.set(key, []);
    }
    aggregated.get(key)!.push(decision);
  });
  
  // Create aggregated decision data
  const result: QuestDecisionData[] = [];
  aggregated.forEach((group, key) => {
    const firstDecision = group[0];
    const aggregatedDecision: QuestDecisionData = {
      ...firstDecision,
      id: `aggregated-${key}`,
      questName: `${group.length} quests (${period})`,
      // Use average coordinates
      coordinates: {
        x: group.reduce((sum, d) => sum + d.coordinates.x, 0) / group.length,
        y: group.reduce((sum, d) => sum + d.coordinates.y, 0) / group.length,
      },
      // Use dominant decision type
      decisionType: getDominantDecisionType(group),
      // Use highest priority
      priority: group.reduce((highest, d) => 
        getPriorityWeight(d.priority) > getPriorityWeight(highest.priority) ? d : highest
      ).priority,
      // Use dominant category
      category: getDominantCategory(group),
      // Use latest timestamp
      timestamp: Math.max(...group.map(d => d.timestamp)),
      // Aggregate outcomes
      outcome: calculateSuccessRate(group) > 0.5 ? 'success' : 'failure',
    };
    result.push(aggregatedDecision);
  });
  
  return result;
}

/**
 * Export configuration validation
 */
export function validateHeatmapConfig(
  config: Partial<QuestDecisionHeatmapConfig>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.layout) {
    if (config.layout.width <= 0) errors.push('Width must be positive');
    if (config.layout.height <= 0) errors.push('Height must be positive');
  }
  
  if (config.visualization?.rendering) {
    const rendering = config.visualization.rendering;
    if (rendering.resolution <= 0) errors.push('Resolution must be positive');
    if (rendering.maxPoints <= 0) errors.push('Max points must be positive');
  }
  
  if (config.visualization?.performance) {
    const perf = config.visualization.performance;
    if (perf.maxDataPoints <= 0) errors.push('Max data points must be positive');
    if (perf.updateInterval <= 0) errors.push('Update interval must be positive');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
