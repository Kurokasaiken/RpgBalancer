import { useEffect, useMemo, useState } from 'react';
import type { ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import {
  type ResidentRelationshipGraphConfig,
  type ResidentGraphEdge,
  type ResidentGraphNode,
  type ResidentRelationshipGraphData,
  type EdgeContribution,
  DEFAULT_RESIDENT_RELATIONSHIP_GRAPH_CONFIG,
  mergeResidentRelationshipGraphConfig,
} from '@/ui/idleVillage/config/residentRelationshipGraphConfig';

/**
 * Supplemental quest party data describing which residents participated in a quest.
 *
 * Consumers can derive this from quest telemetry, scheduled activity history, or persistence logs.
 */
export interface ResidentQuestParty {
  questId: string;
  participantIds: string[];
  timestamp: number;
  success?: boolean;
}

/**
 * Supplemental crew assignment data capturing arbitrary crews that worked together.
 * Typically derived from Crew Scheduler analytics/telemetry.
 */
export interface ResidentCrewAssignmentRecord {
  activityId: string;
  residentIds: string[];
  timestamp: number;
}

/**
 * Optional drop feedback payload to penalize low-quality pairings.
 */
export interface ResidentDropFeedbackRecord {
  residentId: string;
  severity: 'warning' | 'blocked' | 'invalid';
  timestamp: number;
}

export interface ResidentRelationshipGraphSourceData {
  residents: Record<string, ResidentState>;
  activities?: Record<string, ScheduledActivity>;
  activityHistory?: ScheduledActivity[];
  questParties?: ResidentQuestParty[];
  crewAssignments?: ResidentCrewAssignmentRecord[];
  dropFeedback?: ResidentDropFeedbackRecord[];
}

export type RelationshipToggleKey =
  | 'sharedActivity'
  | 'questBond'
  | 'statTagOverlap'
  | 'fatigueCompatibility'
  | 'crewHistory';

export interface RelationshipToggles {
  sharedActivity: boolean;
  questBond: boolean;
  statTagOverlap: boolean;
  fatigueCompatibility: boolean;
  crewHistory: boolean;
}

export interface ResidentRelationshipGraphFilters {
  includeStatuses: ResidentState['status'][];
  minActivityCount: number;
  maxFatigue: number;
}

export interface UseResidentRelationshipGraphOptions {
  source: ResidentRelationshipGraphSourceData;
  configOverride?: Partial<ResidentRelationshipGraphConfig>;
  autoEmitTelemetry?: boolean;
  telemetryEmitter?: (eventName: string, payload: Record<string, unknown>) => void;
}

export interface UseResidentRelationshipGraphReturn {
  graph: ResidentRelationshipGraphData;
  isEmpty: boolean;
  filters: ResidentRelationshipGraphFilters;
  updateFilters: (updates: Partial<ResidentRelationshipGraphFilters>) => void;
  toggles: RelationshipToggles;
  setToggle: (key: RelationshipToggleKey, value: boolean) => void;
  exportAsJson: () => string;
  lastGeneratedAt: number;
}

const DEFAULT_TOGGLES: RelationshipToggles = {
  sharedActivity: true,
  questBond: true,
  statTagOverlap: true,
  fatigueCompatibility: true,
  crewHistory: true,
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function useResidentRelationshipGraph({
  source,
  configOverride,
  autoEmitTelemetry = true,
  telemetryEmitter,
}: UseResidentRelationshipGraphOptions): UseResidentRelationshipGraphReturn {
  const config = useMemo(
    () => mergeResidentRelationshipGraphConfig(configOverride),
    [configOverride],
  );

  const [filters, setFilters] = useState<ResidentRelationshipGraphFilters>({
    includeStatuses: [...config.filters.includeStatuses],
    minActivityCount: config.filters.minActivityCount,
    maxFatigue: config.filters.maxFatigue,
  });

  const [toggles, setToggles] = useState<RelationshipToggles>({ ...DEFAULT_TOGGLES });

  const filteredResidents = useMemo(() => {
    const residentsArray = Object.values(source.residents ?? {});
    if (residentsArray.length === 0) {
      return [];
    }
    const allowedStatuses = new Set(filters.includeStatuses);
    return residentsArray
      .filter((resident) => allowedStatuses.has(resident.status))
      .filter((resident) => resident.fatigue <= filters.maxFatigue)
      .slice(0, config.limits.maxResidents);
  }, [source.residents, filters.includeStatuses, filters.maxFatigue, config.limits.maxResidents]);

  const residentActivityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const aggregateActivities = (activityList?: Iterable<ScheduledActivity>) => {
      if (!activityList) return;
      for (const activity of activityList) {
        const charIds = activity.characterIds ?? [];
        charIds.forEach((id) => {
          counts[id] = (counts[id] ?? 0) + 1;
        });
      }
    };

    aggregateActivities(source.activities ? Object.values(source.activities) : undefined);
    aggregateActivities(source.activityHistory);

    return counts;
  }, [source.activities, source.activityHistory]);

  const qualifiedResidents = useMemo(() => {
    if (filteredResidents.length === 0) {
      return [];
    }
    const list = filteredResidents.filter((resident) => {
      const activityCount = residentActivityCounts[resident.id] ?? 0;
      return activityCount >= filters.minActivityCount;
    });
    return list;
  }, [filteredResidents, residentActivityCounts, filters.minActivityCount]);

  const { pairStats, residentQuestCounts, residentDropPenalty } = useMemo(
    () =>
      buildPairStatistics({
        residentIds: qualifiedResidents.map((resident) => resident.id),
        activities: source.activities,
        activityHistory: source.activityHistory,
        questParties: source.questParties,
        crewAssignments: source.crewAssignments,
        dropFeedback: source.dropFeedback,
      }),
    [
      qualifiedResidents,
      source.activities,
      source.activityHistory,
      source.questParties,
      source.crewAssignments,
      source.dropFeedback,
    ],
  );

  const nodes = useMemo<ResidentGraphNode[]>(() => {
    if (qualifiedResidents.length === 0) {
      return [];
    }
    const maxActivityCount =
      qualifiedResidents.reduce(
        (max, resident) => Math.max(max, residentActivityCounts[resident.id] ?? 0),
        1,
      ) || 1;

    return qualifiedResidents.map((resident) => {
      const activityCount = residentActivityCounts[resident.id] ?? 0;
      const questCount = residentQuestCounts[resident.id] ?? 0;
      const fatigue = resident.fatigue ?? 0;
      const fatigueScore = 1 - clamp(fatigue / config.thresholds.maxFatigueValue);
      const activityScore = clamp(activityCount / maxActivityCount);
      const tagScore = clamp((resident.statTags?.length ?? 0) / 6);
      const synergyScore = clamp((fatigueScore * 0.4 + activityScore * 0.4 + tagScore * 0.2), 0, 1);

      return {
        id: resident.id,
        label: resident.displayName ?? resident.id,
        status: resident.status,
        fatigue,
        statTags: resident.statTags ?? [],
        activityCount,
        questCount,
        synergyScore,
        portraitUrl: resident.portraitUrl,
        visualProfileId: resident.visualProfileId,
        homeId: resident.homeId,
      } satisfies ResidentGraphNode;
    });
  }, [
    qualifiedResidents,
    residentActivityCounts,
    residentQuestCounts,
    config.thresholds.maxFatigueValue,
  ]);

  const edges = useMemo<ResidentGraphEdge[]>(() => {
    if (nodes.length === 0) {
      return [];
    }

    const contributionsEnabled: RelationshipToggles = toggles;
    const edgesAccumulator: ResidentGraphEdge[] = [];
    const nodeLookup: Record<string, ResidentGraphNode> = Object.fromEntries(nodes.map((node) => [node.id, node]));

    const residentIds = nodes.map((node) => node.id);
    for (let i = 0; i < residentIds.length; i += 1) {
      for (let j = i + 1; j < residentIds.length; j += 1) {
        const a = residentIds[i];
        const b = residentIds[j];
        const pairKey = buildPairKey(a, b);
        const stats = pairStats.get(pairKey);

        const contributions: EdgeContribution[] = [];
        if (!stats) {
          continue;
        }

        const residentA = nodeLookup[a];
        const residentB = nodeLookup[b];
        if (!residentA || !residentB) {
          continue;
        }

        const weights = config.weights;

        // Shared activity contribution
        if (contributionsEnabled.sharedActivity && stats.sharedActivities > 0) {
          const normalized = clamp(
            stats.sharedActivities / config.normalization.maxSharedActivitiesForFullWeight,
          );
          contributions.push({
            type: 'shared_activity',
            label: 'Shared Activities',
            value: normalized,
            weight: normalized * weights.sharedActivityWeight,
            metadata: { count: stats.sharedActivities },
          });
        }

        // Quest bonds
        if (contributionsEnabled.questBond && stats.questRuns > 0) {
          const normalized = clamp(stats.questRuns / config.normalization.maxSharedQuestsForFullWeight);
          contributions.push({
            type: 'quest_history',
            label: 'Quest Bond',
            value: normalized,
            weight: normalized * weights.questBondWeight,
            metadata: { questRuns: stats.questRuns },
          });
        }

        // Stat tag overlap
        if (contributionsEnabled.statTagOverlap) {
          const sharedTags = intersectStrings(residentA.statTags, residentB.statTags);
          if (sharedTags.length > 0) {
            const unionSize = new Set([...(residentA.statTags ?? []), ...(residentB.statTags ?? [])]).size || 1;
            const overlap = sharedTags.length / unionSize;
            if (overlap >= config.thresholds.minTagOverlap) {
              contributions.push({
                type: 'stat_tag_overlap',
                label: 'Synergy Tags',
                value: overlap,
                weight: overlap * weights.statTagOverlapWeight,
                metadata: { sharedTags },
              });
            }
          }
        }

        // Fatigue compatibility
        if (contributionsEnabled.fatigueCompatibility) {
          const fatigueDelta = Math.abs(residentA.fatigue - residentB.fatigue);
          if (fatigueDelta <= config.thresholds.maxFatigueDifference) {
            const compatibility = clamp(
              1 - fatigueDelta / config.thresholds.maxFatigueDifference,
              0,
              1,
            );
            if (compatibility >= config.thresholds.minFatigueCompatibility) {
              contributions.push({
                type: 'fatigue_complement',
                label: 'Fatigue Complement',
                value: compatibility,
                weight: compatibility * weights.fatigueCompatibilityWeight,
                metadata: { fatigueDelta },
              });
            }
          }
        }

        // Crew history contribution
        if (contributionsEnabled.crewHistory && stats.crewAssignments > 0) {
          const normalized = clamp(
            stats.crewAssignments / config.normalization.maxSharedActivitiesForFullWeight,
          );
          contributions.push({
            type: 'crew_history',
            label: 'Crew History',
            value: normalized,
            weight: normalized * weights.crewHistoryWeight,
            metadata: { crewAssignments: stats.crewAssignments },
          });
        }

        // Drop penalty (applies regardless of toggles to keep UX consistent)
        const penalties: EdgeContribution[] = [];
        const dropPenalty = Math.min(residentDropPenalty[a] ?? 0, residentDropPenalty[b] ?? 0);
        if (dropPenalty > 0) {
          const penaltyValue = -dropPenalty * weights.dropFeedbackPenalty;
          penalties.push({
            type: 'penalty',
            label: 'Drop Feedback',
            value: dropPenalty,
            weight: penaltyValue,
          });
        }

        const netWeight =
          contributions.reduce((sum, contribution) => sum + contribution.weight, 0) +
          penalties.reduce((sum, penalty) => sum + penalty.weight, 0);

        if (netWeight < config.thresholds.minEdgeWeight) {
          continue;
        }

        const sharedTagsMeta =
          contributions.find((c) => c.type === 'stat_tag_overlap')?.metadata?.sharedTags ?? [];

        const edge: ResidentGraphEdge = {
          id: pairKey,
          source: a,
          target: b,
          weight: clamp(netWeight, -1, 10),
          contributions: [...contributions, ...penalties],
          sharedActivities: stats.sharedActivities,
          sharedQuests: stats.questRuns,
          sharedTags: sharedTagsMeta as string[],
          fatigueDelta: Math.abs(residentA.fatigue - residentB.fatigue),
        };

        edgesAccumulator.push(edge);
      }
    }

    return edgesAccumulator
      .sort((a, b) => b.weight - a.weight)
      .slice(0, config.limits.maxEdges);
  }, [nodes, pairStats, toggles, residentDropPenalty, config]);

  const generatedAt = useMemo(
    () => computeGraphSignature(nodes, edges, config.version),
    [nodes, edges, config.version],
  );

  const graph = useMemo<ResidentRelationshipGraphData>(
    () => ({
      nodes,
      edges,
      metadata: {
        generatedAt,
        configVersion: config.version,
        totalResidents: nodes.length,
        totalEdges: edges.length,
      },
      config,
    }),
    [nodes, edges, config, generatedAt],
  );

  // Optional telemetry emission for Resident Graph views.
  useEffect(() => {
    if (!autoEmitTelemetry || !config.telemetry.enabled) {
      return;
    }
    const emitter =
      telemetryEmitter ??
      ((eventName: string, payload: Record<string, unknown>) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
        } else {
          console.info(`[telemetry:${eventName}]`, payload);
        }
      });

    emitter(config.telemetry.eventName, {
      generatedAt: graph.metadata.generatedAt,
      totalResidents: graph.metadata.totalResidents,
      totalEdges: graph.metadata.totalEdges,
    });
  }, [
    autoEmitTelemetry,
    config.telemetry.enabled,
    config.telemetry.eventName,
    graph.metadata.generatedAt,
    graph.metadata.totalResidents,
    graph.metadata.totalEdges,
    telemetryEmitter,
  ]);

  const updateFilters = (updates: Partial<ResidentRelationshipGraphFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const setToggle = (key: RelationshipToggleKey, value: boolean) => {
    setToggles((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const exportAsJson = () => JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      graph,
    },
    null,
    2,
  );

  return {
    graph,
    isEmpty: graph.nodes.length === 0,
    filters,
    updateFilters,
    toggles,
    setToggle,
    exportAsJson,
    lastGeneratedAt: graph.metadata.generatedAt,
  };
}

interface PairStats {
  sharedActivities: number;
  questRuns: number;
  crewAssignments: number;
}

interface PairStatsResult {
  pairStats: Map<string, PairStats>;
  residentQuestCounts: Record<string, number>;
  residentDropPenalty: Record<string, number>;
}

interface PairStatsBuilderInput {
  residentIds: string[];
  activities?: Record<string, ScheduledActivity>;
  activityHistory?: ScheduledActivity[];
  questParties?: ResidentQuestParty[];
  crewAssignments?: ResidentCrewAssignmentRecord[];
  dropFeedback?: ResidentDropFeedbackRecord[];
}

function buildPairStatistics(input: PairStatsBuilderInput): PairStatsResult {
  const pairStats = new Map<string, PairStats>();
  const residentQuestCounts: Record<string, number> = {};
  const residentDropPenalty: Record<string, number> = {};

  const residentSet = new Set(input.residentIds);

  const considerPair = (ids: string[], aggregator: (stats: PairStats) => void) => {
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = ids[i];
        const b = ids[j];
        if (!residentSet.has(a) || !residentSet.has(b)) continue;
        const key = buildPairKey(a, b);
        const stats = pairStats.get(key) ?? { sharedActivities: 0, questRuns: 0, crewAssignments: 0 };
        aggregator(stats);
        pairStats.set(key, stats);
      }
    }
  };

  // Shared activities from current + historical schedule
  const accumulateActivities = (activityList?: Iterable<ScheduledActivity>) => {
    if (!activityList) return;
    for (const activity of activityList) {
      if (!activity?.characterIds || activity.characterIds.length < 2) {
        // Skip solo assignments since they don't create edges.
        continue;
      }

      considerPair(activity.characterIds, (stats) => {
        stats.sharedActivities += 1;
      });
    }
  };

  accumulateActivities(input.activities ? Object.values(input.activities) : undefined);
  accumulateActivities(input.activityHistory);

  // Quest parties
  if (input.questParties) {
    input.questParties.forEach((party) => {
      const memberIds = party.participantIds.filter((id) => residentSet.has(id));
      memberIds.forEach((id) => {
        residentQuestCounts[id] = (residentQuestCounts[id] ?? 0) + 1;
      });
      considerPair(memberIds, (stats) => {
        stats.questRuns += 1;
      });
    });
  }

  // Crew assignment history
  if (input.crewAssignments) {
    input.crewAssignments.forEach((assignment) => {
      const memberIds = assignment.residentIds.filter((id) => residentSet.has(id));
      considerPair(memberIds, (stats) => {
        stats.crewAssignments += 1;
      });
    });
  }

  // Drop feedback (per resident)
  if (input.dropFeedback) {
    const severityWeight: Record<ResidentDropFeedbackRecord['severity'], number> = {
      warning: 0.5,
      blocked: 1,
      invalid: 1.2,
    };
    input.dropFeedback.forEach((feedback) => {
      if (!residentSet.has(feedback.residentId)) return;
      residentDropPenalty[feedback.residentId] =
        (residentDropPenalty[feedback.residentId] ?? 0) + severityWeight[feedback.severity];
    });
  }

  return { pairStats, residentQuestCounts, residentDropPenalty };
}

function buildPairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function intersectStrings(a?: string[], b?: string[]): string[] {
  if (!a || !b || a.length === 0 || b.length === 0) {
    return [];
  }
  const setB = new Set(b);
  return a.filter((value) => setB.has(value));
}

// Exporting helpers for unit tests
export const __internal = {
  buildPairStatistics,
  buildPairKey,
  clamp,
  computeGraphSignature,
  DEFAULT_TOGGLES,
  DEFAULT_CONFIG: DEFAULT_RESIDENT_RELATIONSHIP_GRAPH_CONFIG,
};

function computeGraphSignature(
  nodes: ResidentGraphNode[],
  edges: ResidentGraphEdge[],
  version: string,
): number {
  const canonical = JSON.stringify({
    version,
    nodes: nodes.map((node) => ({
      id: node.id,
      status: node.status,
      activityCount: node.activityCount,
      questCount: node.questCount,
      tags: node.statTags?.slice().sort(),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      weight: edge.weight,
      source: edge.source,
      target: edge.target,
    })),
  });

  let hash = 0;
  for (let i = 0; i < canonical.length; i += 1) {
    hash = (hash * 31 + canonical.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
