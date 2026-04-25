import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

export type ResidentGraphNodeStatus = ResidentState['status'];

export interface ResidentRelationshipGraphWeights {
  sharedActivityWeight: number;
  questBondWeight: number;
  statTagOverlapWeight: number;
  fatigueCompatibilityWeight: number;
  crewHistoryWeight: number;
  dropFeedbackPenalty: number;
}

export interface ResidentRelationshipGraphThresholds {
  minEdgeWeight: number;
  minSharedActivities: number;
  minTagOverlap: number;
  minFatigueCompatibility: number;
  maxFatigueDifference: number;
  maxFatigueValue: number;
}

export interface ResidentRelationshipGraphNormalization {
  maxSharedActivitiesForFullWeight: number;
  maxSharedQuestsForFullWeight: number;
}

export interface ResidentRelationshipGraphForceLayout {
  chargeStrength: number;
  linkDistance: number;
  linkStrength: number;
  collisionRadius: number;
  alphaDecay: number;
  velocityDecay: number;
}

export interface ResidentRelationshipGraphFilters {
  includeStatuses: ResidentGraphNodeStatus[];
  minActivityCount: number;
  maxFatigue: number;
}

export interface ResidentRelationshipGraphExportOptions {
  enableJson: boolean;
  enablePng: boolean;
  filenamePrefix: string;
}

export interface ResidentRelationshipGraphTelemetryConfig {
  enabled: boolean;
  eventName: string;
}

export interface ResidentRelationshipGraphLimits {
  maxResidents: number;
  maxEdges: number;
}

export interface ResidentRelationshipGraphConfig {
  version: string;
  enabled: boolean;
  weights: ResidentRelationshipGraphWeights;
  thresholds: ResidentRelationshipGraphThresholds;
  normalization: ResidentRelationshipGraphNormalization;
  forceLayout: ResidentRelationshipGraphForceLayout;
  filters: ResidentRelationshipGraphFilters;
  exportOptions: ResidentRelationshipGraphExportOptions;
  telemetry: ResidentRelationshipGraphTelemetryConfig;
  limits: ResidentRelationshipGraphLimits;
}

export interface EdgeContribution {
  type:
    | 'shared_activity'
    | 'quest_history'
    | 'stat_tag_overlap'
    | 'fatigue_complement'
    | 'crew_history'
    | 'penalty';
  label: string;
  value: number;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface ResidentGraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  contributions: EdgeContribution[];
  sharedActivities: number;
  sharedQuests: number;
  sharedTags: string[];
  fatigueDelta: number;
}

export interface ResidentGraphNode {
  id: string;
  label: string;
  status: ResidentGraphNodeStatus;
  fatigue: number;
  statTags: string[];
  activityCount: number;
  questCount: number;
  synergyScore: number;
  portraitUrl?: string;
  visualProfileId?: string;
  homeId?: string;
}

export interface ResidentGraphMetadata {
  generatedAt: number;
  configVersion: string;
  totalResidents: number;
  totalEdges: number;
}

export interface ResidentRelationshipGraphData {
  nodes: ResidentGraphNode[];
  edges: ResidentGraphEdge[];
  metadata: ResidentGraphMetadata;
  config: ResidentRelationshipGraphConfig;
}

export const DEFAULT_RESIDENT_RELATIONSHIP_GRAPH_CONFIG: ResidentRelationshipGraphConfig = {
  version: '1.0.0',
  enabled: true,
  weights: {
    sharedActivityWeight: 1.0,
    questBondWeight: 1.2,
    statTagOverlapWeight: 0.8,
    fatigueCompatibilityWeight: 0.6,
    crewHistoryWeight: 0.4,
    dropFeedbackPenalty: 0.5,
  },
  thresholds: {
    minEdgeWeight: 0.25,
    minSharedActivities: 1,
    minTagOverlap: 0.2,
    minFatigueCompatibility: 0.4,
    maxFatigueDifference: 40,
    maxFatigueValue: 100,
  },
  normalization: {
    maxSharedActivitiesForFullWeight: 5,
    maxSharedQuestsForFullWeight: 3,
  },
  forceLayout: {
    chargeStrength: -220,
    linkDistance: 120,
    linkStrength: 0.9,
    collisionRadius: 38,
    alphaDecay: 0.03,
    velocityDecay: 0.3,
  },
  filters: {
    includeStatuses: ['available', 'away', 'injured', 'exhausted'],
    minActivityCount: 0,
    maxFatigue: 100,
  },
  exportOptions: {
    enableJson: true,
    enablePng: true,
    filenamePrefix: 'idle-village-resident-graph',
  },
  telemetry: {
    enabled: true,
    eventName: 'resident_graph_viewed',
  },
  limits: {
    maxResidents: 60,
    maxEdges: 400,
  },
};

export function mergeResidentRelationshipGraphConfig(
  override?: Partial<ResidentRelationshipGraphConfig>,
): ResidentRelationshipGraphConfig {
  if (!override) {
    return DEFAULT_RESIDENT_RELATIONSHIP_GRAPH_CONFIG;
  }

  const base = DEFAULT_RESIDENT_RELATIONSHIP_GRAPH_CONFIG;
  return {
    ...base,
    ...override,
    weights: {
      ...base.weights,
      ...(override.weights ?? {}),
    },
    thresholds: {
      ...base.thresholds,
      ...(override.thresholds ?? {}),
    },
    normalization: {
      ...base.normalization,
      ...(override.normalization ?? {}),
    },
    forceLayout: {
      ...base.forceLayout,
      ...(override.forceLayout ?? {}),
    },
    filters: {
      ...base.filters,
      ...(override.filters ?? {}),
    },
    exportOptions: {
      ...base.exportOptions,
      ...(override.exportOptions ?? {}),
    },
    telemetry: {
      ...base.telemetry,
      ...(override.telemetry ?? {}),
    },
    limits: {
      ...base.limits,
      ...(override.limits ?? {}),
    },
  };
}
