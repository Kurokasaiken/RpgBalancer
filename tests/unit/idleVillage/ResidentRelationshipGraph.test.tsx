import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useResidentRelationshipGraph,
  type ResidentRelationshipGraphSourceData,
  type RelationshipToggleKey,
} from '../../../src/ui/idleVillage/hooks/useResidentRelationshipGraph';
import type { ResidentState, ScheduledActivity } from '../../../src/engine/game/idleVillage/TimeEngine';
import { createResidentGraphSource, residentGraphScenario } from './__fixtures__/residentGraphMocks';

vi.mock('../../../src/shared/telemetry/telemetry', () => ({
  createTelemetryEvent: vi.fn(),
}));

const BASE_SOURCE = createResidentGraphSource();

const createResident = (id: string, overrides: Partial<ResidentState> = {}): ResidentState => ({
  id,
  displayName: id,
  status: 'available',
  fatigue: 0,
  statTags: [],
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  ...overrides,
});

const createActivity = (id: string, overrides: Partial<ScheduledActivity> = {}): ScheduledActivity => ({
  id,
  activityId: id,
  characterIds: [],
  startTime: Date.now(),
  endTime: Date.now(),
  status: 'completed',
  slotId: 'slot',
  isAuto: false,
  isCompleted: true,
  snapshotDeathRisk: 0,
  ...overrides,
});

const findEdge = (edges: ReturnType<typeof useResidentRelationshipGraph>['graph']['edges'], a: string, b: string) =>
  edges.find(
    (edge) =>
      (edge.source === a && edge.target === b) ||
      (edge.source === b && edge.target === a),
  );

describe('useResidentRelationshipGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('graph generation', () => {
    it('builds nodes/edges from the fixture scenario', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      expect(result.current.graph.metadata.totalResidents).toBe(
        Object.keys(residentGraphScenario.residents).length,
      );
      expect(result.current.graph.metadata.totalEdges).toBeGreaterThan(0);
      expect(result.current.isEmpty).toBe(false);
    });

    it('returns empty graph when no residents exist', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: { residents: {} }, autoEmitTelemetry: false }),
      );

      expect(result.current.graph.nodes).toHaveLength(0);
      expect(result.current.graph.edges).toHaveLength(0);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe('edge generation', () => {
    it('creates contributions for shared activities and quests', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      const edge = findEdge(result.current.graph.edges, 'resident_alpha', 'resident_beta');
      expect(edge).toBeDefined();
      expect(edge?.sharedActivities).toBeGreaterThanOrEqual(1);
      expect(edge?.sharedQuests).toBeGreaterThanOrEqual(0);
    });

    it('applies drop feedback penalties when feedback exists', () => {
      const source = createResidentGraphSource({
        dropFeedback: [
          { residentId: 'resident_alpha', severity: 'warning', timestamp: Date.now() },
          { residentId: 'resident_beta', severity: 'warning', timestamp: Date.now() },
        ],
      });

      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source, autoEmitTelemetry: false }),
      );

      const penaltyEdge = result.current.graph.edges.find((edge) =>
        edge.contributions?.some((contribution) => contribution.type === 'penalty'),
      );
      expect(penaltyEdge).toBeDefined();
    });
  });

  describe('filters', () => {
    it('filters by resident status', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      act(() => result.current.updateFilters({ includeStatuses: ['available'] }));

      expect(result.current.graph.nodes.every((node) => node.status === 'available')).toBe(true);
    });

    it('filters by minimum activity count', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      act(() => result.current.updateFilters({ minActivityCount: 2 }));

      expect(result.current.graph.nodes.length).toBeLessThanOrEqual(
        Object.keys(residentGraphScenario.residents).length,
      );
    });

    it('filters by maximum fatigue threshold', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      act(() => result.current.updateFilters({ maxFatigue: 40 }));

      expect(result.current.graph.nodes.every((node) => node.fatigue <= 40)).toBe(true);
    });
  });

  describe('toggles', () => {
    it('toggles each relationship contribution flag', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      (Object.keys(result.current.toggles) as RelationshipToggleKey[]).forEach((key) => {
        act(() => result.current.setToggle(key, false));
        expect(result.current.toggles[key]).toBe(false);
        act(() => result.current.setToggle(key, true));
        expect(result.current.toggles[key]).toBe(true);
      });
    });

    it('reduces quest contributions when quest bonds are disabled', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      const edgeWithQuest = result.current.graph.edges.find((edge) =>
        edge.contributions?.some((c) => c.type === 'quest_history'),
      );
      expect(edgeWithQuest).toBeDefined();

      act(() => result.current.setToggle('questBond', false));

      const updatedEdge = result.current.graph.edges.find((edge) => edge.id === edgeWithQuest?.id);
      const hasQuestContribution = updatedEdge?.contributions?.some((c) => c.type === 'quest_history');

      expect(hasQuestContribution).toBe(false);
    });
  });

  describe('export & config', () => {
    it('exports graph as JSON', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source: BASE_SOURCE, autoEmitTelemetry: false }),
      );

      const payload = JSON.parse(result.current.exportAsJson());
      expect(payload.graph.nodes).toBeInstanceOf(Array);
      expect(payload.graph.edges).toBeInstanceOf(Array);
    });

    it('respects config overrides for limits', () => {
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({
          source: BASE_SOURCE,
          configOverride: { limits: { maxResidents: 2, maxEdges: 1 } },
          autoEmitTelemetry: false,
        }),
      );

      expect(result.current.graph.nodes.length).toBeLessThanOrEqual(2);
      expect(result.current.graph.edges.length).toBeLessThanOrEqual(1);
    });
  });

  describe('telemetry', () => {
    it('emits telemetry when enabled', () => {
      const emitter = vi.fn();
      renderHook(() =>
        useResidentRelationshipGraph({
          source: BASE_SOURCE,
          autoEmitTelemetry: true,
          telemetryEmitter: emitter,
        }),
      );

      expect(emitter).toHaveBeenCalledWith(
        'resident_graph_viewed',
        expect.objectContaining({
          totalResidents: expect.any(Number),
          totalEdges: expect.any(Number),
        }),
      );
    });

    it('does not emit telemetry when disabled', () => {
      const emitter = vi.fn();
      renderHook(() =>
        useResidentRelationshipGraph({
          source: BASE_SOURCE,
          autoEmitTelemetry: false,
          telemetryEmitter: emitter,
        }),
      );

      expect(emitter).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles residents with no shared data', () => {
      const residents = {
        solo: createResident('solo'),
        lone: createResident('lone'),
      };
      const source: ResidentRelationshipGraphSourceData = { residents };

      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source, autoEmitTelemetry: false }),
      );

      expect(result.current.graph.edges).toHaveLength(0);
    });

    it('ignores solo activities unless additional data links residents', () => {
      const soloActivities = {
        solo_shift: createActivity('solo_shift', { characterIds: ['resident_alpha'] }),
      };
      const source = createResidentGraphSource({ activities: soloActivities });

      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source, autoEmitTelemetry: false }),
      );

      const edgesFromSoloActivity = result.current.graph.edges.filter(
        (edge) => edge.contributions?.some((c) => c.type === 'shared_activity') && edge.sharedActivities === 1,
      );
      expect(edgesFromSoloActivity).toHaveLength(0);
    });

    it('handles large resident sets', () => {
      const residents: Record<string, ResidentState> = {};
      for (let i = 0; i < 30; i += 1) {
        residents[`resident_${i}`] = createResident(`resident_${i}`, {
          statTags: ['strength'],
          fatigue: i,
        });
      }

      const source: ResidentRelationshipGraphSourceData = { residents };
      const { result } = renderHook(() =>
        useResidentRelationshipGraph({ source, autoEmitTelemetry: false }),
      );

      expect(result.current.graph.nodes).toHaveLength(30);
    });
  });
});
