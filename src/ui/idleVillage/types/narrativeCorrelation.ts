/**
 * NP-033 – Idle Village Quest Narrative Telemetry Correlator
 * 
 * Narrative-outcome correlation data types and interfaces for
 * analyzing relationships between narrative content and quest outcomes.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

// Narrative and Outcome Types
export type NarrativeType = 'quest_start' | 'quest_progress' | 'quest_complete' | 'quest_fail' | 'resident_interaction' | 'environmental_trigger';
export type NarrativeTone = 'positive' | 'neutral' | 'negative' | 'urgent' | 'mysterious' | 'humorous' | 'dramatic';
export type NarrativeStyle = 'descriptive' | 'dialogue' | 'action' | 'exposition' | 'reflection' | 'instruction';

export type QuestOutcome = 'success' | 'failure' | 'partial_success' | 'abandoned' | 'timeout' | 'critical_success' | 'critical_failure';
export type QuestDifficulty = 'trivial' | 'easy' | 'normal' | 'hard' | 'extreme' | 'impossible';
export type QuestCategory = 'combat' | 'exploration' | 'social' | 'crafting' | 'puzzle' | 'survival' | 'diplomacy';

// Narrative Data Interface
export interface NarrativeData {
  id: string;
  questId: string;
  type: NarrativeType;
  timestamp: number;
  content: string;
  tone: NarrativeTone;
  style: NarrativeStyle;
  sentiment: {
    score: number; // -1 to 1
    confidence: number; // 0 to 1
    emotions: string[];
    keywords: string[];
  };
  metadata: {
    length: number; // character count
    complexity: number; // 0 to 1
    readability: number; // 0 to 1
    engagement: number; // 0 to 1
    urgency: number; // 0 to 1
  };
  context: {
    residentId?: string;
    locationId?: string;
    weatherCondition?: string;
    timeOfDay?: string;
    season?: string;
    previousNarratives: string[];
  };
  variables: Record<string, any>;
  tags: string[];
}

// Quest Outcome Data Interface
export interface QuestOutcomeData {
  id: string;
  questId: string;
  narrativeId: string;
  timestamp: number;
  outcome: QuestOutcome;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  duration: number; // milliseconds
  successRate: number; // 0 to 1
  completionRate: number; // 0 to 1
  participantIds: string[];
  metrics: {
    experience: number;
    rewards: {
      gold: number;
      items: string[];
      reputation: number;
    };
    penalties: {
      fatigue: number;
      injury: number;
      morale: number;
    };
    performance: {
      efficiency: number; // 0 to 1
      accuracy: number; // 0 to 1
      creativity: number; // 0 to 1
      teamwork: number; // 0 to 1
    };
  };
  factors: {
    weather: number; // -1 to 1
    residentStats: number; // -1 to 1
    equipment: number; // -1 to 1
    location: number; // -1 to 1
    timeOfDay: number; // -1 to 1
    random: number; // -1 to 1
  };
  metadata: {
    attempts: number;
    hints: number;
    saves: number;
    loadTime: number; // milliseconds
    bugs: number;
    crashes: number;
  };
}

// Correlation Data Interface
export interface CorrelationData {
  id: string;
  narrativeId: string;
  outcomeId: string;
  timestamp: number;
  correlation: {
    strength: number; // 0 to 1
    direction: 'positive' | 'negative' | 'neutral';
    significance: number; // 0 to 1 (p-value)
    confidence: number; // 0 to 1
  };
  analysis: {
    method: 'pearson' | 'spearman' | 'kendall' | 'mutual_info' | 'chi_square' | 'custom';
    sampleSize: number;
    pValue: number;
    effectSize: number;
    power: number; // statistical power
  };
  factors: {
    narrative: {
      tone: number; // correlation strength
      style: number;
      sentiment: number;
      complexity: number;
      engagement: number;
      urgency: number;
    };
    outcome: {
      successRate: number;
      completionRate: number;
      duration: number;
      performance: number;
      efficiency: number;
    };
    contextual: {
      weather: number;
      timeOfDay: number;
      location: number;
      participantCount: number;
    };
  };
  patterns: {
    trends: string[];
    anomalies: string[];
    clusters: string[];
    outliers: string[];
  };
  metadata: {
    version: string;
    algorithm: string;
    parameters: Record<string, any>;
    processingTime: number; // milliseconds
    accuracy: number; // 0 to 1
  };
}

// Correlation Analysis Interface
export interface CorrelationAnalysis {
  id: string;
  timestamp: number;
  parameters: {
    timeRange: {
      start: number;
      end: number;
    };
    filters: {
      narrativeTypes?: NarrativeType[];
      questCategories?: QuestCategory[];
      difficulties?: QuestDifficulty[];
      outcomes?: QuestOutcome[];
      tones?: NarrativeTone[];
      styles?: NarrativeStyle[];
    };
    thresholds: {
      minCorrelation: number;
      minSignificance: number;
      minSampleSize: number;
      maxPValue: number;
    };
    methods: CorrelationMethod[];
  };
  results: {
    correlations: CorrelationData[];
    summary: {
      totalCorrelations: number;
      significantCorrelations: number;
      strongCorrelations: number;
      averageCorrelation: number;
      averageSignificance: number;
    };
    insights: {
      topPositiveCorrelations: CorrelationData[];
      topNegativeCorrelations: CorrelationData[];
      unexpectedCorrelations: CorrelationData[];
      actionableInsights: string[];
    };
    trends: {
      improving: string[];
      declining: string[];
      stable: string[];
      volatile: string[];
    };
  };
  performance: {
    processingTime: number; // milliseconds
    memoryUsage: number; // bytes
    accuracy: number; // 0 to 1
    completeness: number; // 0 to 1
  };
  metadata: {
    version: string;
    algorithm: string;
    sampleSize: number;
    confidence: number; // 0 to 1
  };
}

// Correlation Method Interface
export interface CorrelationMethod {
  name: string;
  type: 'parametric' | 'non_parametric' | 'information_theoretic' | 'custom';
  description: string;
  parameters: Record<string, any>;
  requirements: {
    minSampleSize: number;
    dataTypes: string[];
    assumptions: string[];
  };
  performance: {
    complexity: 'low' | 'medium' | 'high';
    accuracy: number; // 0 to 1
    speed: number; // relative speed
  };
}

// Dashboard Configuration Interface
export interface CorrelationDashboardConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  layout: {
    type: 'grid' | 'flex' | 'custom';
    columns: number;
    rows: number;
    gaps: number;
  };
  widgets: CorrelationWidget[];
  filters: {
    timeRange: {
      enabled: boolean;
      default: '24h' | '7d' | '30d' | '90d' | 'custom';
      minDate?: number;
      maxDate?: number;
    };
    narrative: {
      enabled: boolean;
      types: NarrativeType[];
      tones: NarrativeTone[];
      styles: NarrativeStyle[];
    };
    quest: {
      enabled: boolean;
      categories: QuestCategory[];
      difficulties: QuestDifficulty[];
      outcomes: QuestOutcome[];
    };
    correlation: {
      enabled: boolean;
      minStrength: number;
      minSignificance: number;
      methods: string[];
    };
  };
  export: {
    formats: ('csv' | 'json' | 'xlsx' | 'pdf')[];
    autoExport: boolean;
    schedule: string; // cron expression
    destination: string;
  };
  refresh: {
    enabled: boolean;
    interval: number; // milliseconds
    realTime: boolean;
  };
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  metadata: {
    version: string;
    author?: string;
    tags: string[];
    category: string;
  };
}

// Widget Interface
export interface CorrelationWidget {
  id: string;
  type: 'correlation_matrix' | 'scatter_plot' | 'time_series' | 'heatmap' | 'histogram' | 'summary_stats' | 'insights' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    dataSource: string;
    filters: Record<string, any>;
    visualization: {
      type: string;
      options: Record<string, any>;
    };
    interaction: {
      clickable: boolean;
      hoverable: boolean;
      selectable: boolean;
      zoomable: boolean;
    };
  };
  data: {
    query: string;
    parameters: Record<string, any>;
    cache: boolean;
    refreshInterval: number;
  };
  metadata: {
    version: string;
    tags: string[];
  };
}

// Export Configuration Interface
export interface CorrelationExportConfig {
  id: string;
  name: string;
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  template?: string;
  data: {
    sources: string[];
    filters: Record<string, any>;
    columns: string[];
    aggregations: Record<string, string>;
    sorting: {
      column: string;
      direction: 'asc' | 'desc';
    };
    limits: {
      offset: number;
      count: number;
    };
  };
  formatting: {
    headers: boolean;
    dateFormat: string;
    numberFormat: string;
    precision: number;
    locale: string;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'zip' | 'deflate';
    level: number; // 0 to 9
  };
  delivery: {
    method: 'download' | 'email' | 'api' | 'webhook';
    destination: string;
    retry: {
      enabled: boolean;
      attempts: number;
      delay: number; // milliseconds
    };
  };
  metadata: {
    version: string;
    author?: string;
    tags: string[];
    category: string;
  };
}

// Zod Schemas
export const NarrativeDataSchema = z.object({
  id: z.string(),
  questId: z.string(),
  type: z.enum(['quest_start', 'quest_progress', 'quest_complete', 'quest_fail', 'resident_interaction', 'environmental_trigger']),
  timestamp: z.number(),
  content: z.string(),
  tone: z.enum(['positive', 'neutral', 'negative', 'urgent', 'mysterious', 'humorous', 'dramatic']),
  style: z.enum(['descriptive', 'dialogue', 'action', 'exposition', 'reflection', 'instruction']),
  sentiment: z.object({
    score: z.number().min(-1).max(1),
    confidence: z.number().min(0).max(1),
    emotions: z.array(z.string()),
    keywords: z.array(z.string()),
  }),
  metadata: z.object({
    length: z.number().min(0),
    complexity: z.number().min(0).max(1),
    readability: z.number().min(0).max(1),
    engagement: z.number().min(0).max(1),
    urgency: z.number().min(0).max(1),
  }),
  context: z.object({
    residentId: z.string().optional(),
    locationId: z.string().optional(),
    weatherCondition: z.string().optional(),
    timeOfDay: z.string().optional(),
    season: z.string().optional(),
    previousNarratives: z.array(z.string()),
  }),
  variables: z.record(z.any()),
  tags: z.array(z.string()),
});

export const QuestOutcomeDataSchema = z.object({
  id: z.string(),
  questId: z.string(),
  narrativeId: z.string(),
  timestamp: z.number(),
  outcome: z.enum(['success', 'failure', 'partial_success', 'abandoned', 'timeout', 'critical_success', 'critical_failure']),
  difficulty: z.enum(['trivial', 'easy', 'normal', 'hard', 'extreme', 'impossible']),
  category: z.enum(['combat', 'exploration', 'social', 'crafting', 'puzzle', 'survival', 'diplomacy']),
  duration: z.number().min(0),
  successRate: z.number().min(0).max(1),
  completionRate: z.number().min(0).max(1),
  participantIds: z.array(z.string()),
  metrics: z.object({
    experience: z.number().min(0),
    rewards: z.object({
      gold: z.number().min(0),
      items: z.array(z.string()),
      reputation: z.number(),
    }),
    penalties: z.object({
      fatigue: z.number().min(0),
      injury: z.number().min(0),
      morale: z.number(),
    }),
    performance: z.object({
      efficiency: z.number().min(0).max(1),
      accuracy: z.number().min(0).max(1),
      creativity: z.number().min(0).max(1),
      teamwork: z.number().min(0).max(1),
    }),
  }),
  factors: z.object({
    weather: z.number().min(-1).max(1),
    residentStats: z.number().min(-1).max(1),
    equipment: z.number().min(-1).max(1),
    location: z.number().min(-1).max(1),
    timeOfDay: z.number().min(-1).max(1),
    random: z.number().min(-1).max(1),
  }),
  metadata: z.object({
    attempts: z.number().min(0),
    hints: z.number().min(0),
    saves: z.number().min(0),
    loadTime: z.number().min(0),
    bugs: z.number().min(0),
    crashes: z.number().min(0),
  }),
});

export const CorrelationDataSchema = z.object({
  id: z.string(),
  narrativeId: z.string(),
  outcomeId: z.string(),
  timestamp: z.number(),
  correlation: z.object({
    strength: z.number().min(0).max(1),
    direction: z.enum(['positive', 'negative', 'neutral']),
    significance: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
  }),
  analysis: z.object({
    method: z.enum(['pearson', 'spearman', 'kendall', 'mutual_info', 'chi_square', 'custom']),
    sampleSize: z.number().min(0),
    pValue: z.number().min(0).max(1),
    effectSize: z.number(),
    power: z.number().min(0).max(1),
  }),
  factors: z.object({
    narrative: z.object({
      tone: z.number().min(-1).max(1),
      style: z.number().min(-1).max(1),
      sentiment: z.number().min(-1).max(1),
      complexity: z.number().min(-1).max(1),
      engagement: z.number().min(-1).max(1),
      urgency: z.number().min(-1).max(1),
    }),
    outcome: z.object({
      successRate: z.number().min(-1).max(1),
      completionRate: z.number().min(-1).max(1),
      duration: z.number().min(-1).max(1),
      performance: z.number().min(-1).max(1),
      efficiency: z.number().min(-1).max(1),
    }),
    contextual: z.object({
      weather: z.number().min(-1).max(1),
      timeOfDay: z.number().min(-1).max(1),
      location: z.number().min(-1).max(1),
      participantCount: z.number().min(-1).max(1),
    }),
  }),
  patterns: z.object({
    trends: z.array(z.string()),
    anomalies: z.array(z.string()),
    clusters: z.array(z.string()),
    outliers: z.array(z.string()),
  }),
  metadata: z.object({
    version: z.string(),
    algorithm: z.string(),
    parameters: z.record(z.any()),
    processingTime: z.number().min(0),
    accuracy: z.number().min(0).max(1),
  }),
});

// Default configurations
export const DEFAULT_CORRELATION_DASHBOARD_CONFIG: Partial<CorrelationDashboardConfig> = {
  id: 'default-dashboard',
  name: 'Narrative-Outcome Correlation Dashboard',
  description: 'Default dashboard for analyzing narrative-outcome correlations',
  enabled: true,
  layout: {
    type: 'grid',
    columns: 3,
    rows: 2,
    gaps: 16,
  },
  widgets: [],
  filters: {
    timeRange: {
      enabled: true,
      default: '7d',
    },
    narrative: {
      enabled: true,
      types: ['quest_start', 'quest_progress', 'quest_complete', 'quest_fail'],
      tones: ['positive', 'neutral', 'negative'],
      styles: ['descriptive', 'dialogue', 'action'],
    },
    quest: {
      enabled: true,
      categories: ['combat', 'exploration', 'social', 'crafting'],
      difficulties: ['easy', 'normal', 'hard'],
      outcomes: ['success', 'failure', 'partial_success'],
    },
    correlation: {
      enabled: true,
      minStrength: 0.3,
      minSignificance: 0.05,
      methods: ['pearson', 'spearman'],
    },
  },
  export: {
    formats: ['csv', 'json'],
    autoExport: false,
    schedule: '0 0 * * *', // Daily at midnight
    destination: '/exports/correlation',
  },
  refresh: {
    enabled: true,
    interval: 300000, // 5 minutes
    realTime: false,
  },
  theme: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    text: '#1e293b',
    accent: '#f59e0b',
  },
  metadata: {
    version: '1.0.0',
    tags: ['default', 'correlation', 'dashboard'],
    category: 'analytics',
  },
};

export const DEFAULT_CORRELATION_EXPORT_CONFIG: Partial<CorrelationExportConfig> = {
  id: 'default-export',
  name: 'Default Correlation Export',
  format: 'csv',
  data: {
    sources: ['correlations', 'narratives', 'outcomes'],
    filters: {},
    columns: ['timestamp', 'narrativeId', 'outcomeId', 'correlation.strength', 'correlation.direction', 'correlation.significance'],
    aggregations: {},
    sorting: {
      column: 'timestamp',
      direction: 'desc',
    },
    limits: {
      offset: 0,
      count: 10000,
    },
  },
  formatting: {
    headers: true,
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    numberFormat: 'en-US',
    precision: 4,
    locale: 'en-US',
  },
  compression: {
    enabled: false,
    algorithm: 'gzip',
    level: 6,
  },
  delivery: {
    method: 'download',
    destination: '/downloads',
    retry: {
      enabled: true,
      attempts: 3,
      delay: 1000,
    },
  },
  metadata: {
    version: '1.0.0',
    tags: ['default', 'export', 'correlation'],
    category: 'export',
  },
};

// Utility functions
export function validateNarrativeData(data: any): { valid: boolean; errors: string[] } {
  try {
    NarrativeDataSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

export function validateQuestOutcomeData(data: any): { valid: boolean; errors: string[] } {
  try {
    QuestOutcomeDataSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

export function validateCorrelationData(data: any): { valid: boolean; errors: string[] } {
  try {
    CorrelationDataSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

export function createNarrativeData(overrides: Partial<NarrativeData>): NarrativeData {
  const data = {
    id: `narrative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    questId: 'quest-default',
    type: 'quest_start' as NarrativeType,
    timestamp: Date.now(),
    content: '',
    tone: 'neutral' as NarrativeTone,
    style: 'descriptive' as NarrativeStyle,
    sentiment: {
      score: 0,
      confidence: 0.5,
      emotions: [],
      keywords: [],
    },
    metadata: {
      length: 0,
      complexity: 0.5,
      readability: 0.5,
      engagement: 0.5,
      urgency: 0.5,
    },
    context: {
      previousNarratives: [],
    },
    variables: {},
    tags: [],
    ...overrides,
  };
  
  const validation = validateNarrativeData(data);
  if (!validation.valid) {
    throw new Error(`Invalid narrative data: ${validation.errors.join(', ')}`);
  }
  
  return data as NarrativeData;
}

export function createQuestOutcomeData(overrides: Partial<QuestOutcomeData>): QuestOutcomeData {
  const data = {
    id: `outcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    questId: 'quest-default',
    narrativeId: 'narrative-default',
    timestamp: Date.now(),
    outcome: 'success' as QuestOutcome,
    difficulty: 'normal' as QuestDifficulty,
    category: 'exploration' as QuestCategory,
    duration: 3600000, // 1 hour
    successRate: 0.8,
    completionRate: 1.0,
    participantIds: [],
    metrics: {
      experience: 100,
      rewards: {
        gold: 50,
        items: [],
        reputation: 10,
      },
      penalties: {
        fatigue: 20,
        injury: 0,
        morale: 5,
      },
      performance: {
        efficiency: 0.8,
        accuracy: 0.9,
        creativity: 0.7,
        teamwork: 0.8,
      },
    },
    factors: {
      weather: 0,
      residentStats: 0,
      equipment: 0,
      location: 0,
      timeOfDay: 0,
      random: 0,
    },
    metadata: {
      attempts: 1,
      hints: 0,
      saves: 0,
      loadTime: 1000,
      bugs: 0,
      crashes: 0,
    },
    ...overrides,
  };
  
  const validation = validateQuestOutcomeData(data);
  if (!validation.valid) {
    throw new Error(`Invalid quest outcome data: ${validation.errors.join(', ')}`);
  }
  
  return data as QuestOutcomeData;
}

export function createCorrelationData(overrides: Partial<CorrelationData>): CorrelationData {
  const data = {
    id: `correlation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    narrativeId: 'narrative-default',
    outcomeId: 'outcome-default',
    timestamp: Date.now(),
    correlation: {
      strength: 0.5,
      direction: 'positive' as const,
      significance: 0.05,
      confidence: 0.8,
    },
    analysis: {
      method: 'pearson' as const,
      sampleSize: 100,
      pValue: 0.05,
      effectSize: 0.5,
      power: 0.8,
    },
    factors: {
      narrative: {
        tone: 0.3,
        style: 0.2,
        sentiment: 0.4,
        complexity: 0.1,
        engagement: 0.3,
        urgency: 0.2,
      },
      outcome: {
        successRate: 0.6,
        completionRate: 0.7,
        duration: -0.2,
        performance: 0.5,
        efficiency: 0.4,
      },
      contextual: {
        weather: 0.1,
        timeOfDay: 0.05,
        location: 0.15,
        participantCount: 0.2,
      },
    },
    patterns: {
      trends: [],
      anomalies: [],
      clusters: [],
      outliers: [],
    },
    metadata: {
      version: '1.0.0',
      algorithm: 'pearson',
      parameters: {},
      processingTime: 100,
      accuracy: 0.9,
    },
    ...overrides,
  };
  
  const validation = validateCorrelationData(data);
  if (!validation.valid) {
    throw new Error(`Invalid correlation data: ${validation.errors.join(', ')}`);
  }
  
  return data as CorrelationData;
}

// Type exports
export type NarrativeDataType = z.infer<typeof NarrativeDataSchema>;
export type QuestOutcomeDataType = z.infer<typeof QuestOutcomeDataSchema>;
export type CorrelationDataType = z.infer<typeof CorrelationDataSchema>;
