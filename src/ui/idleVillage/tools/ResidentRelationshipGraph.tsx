import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ScheduledActivity, ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useMapContext } from '@/ui/idleVillage/hooks/useMapContext';
import { useCrewSchedulerAnalytics } from '@/ui/idleVillage/hooks/useCrewSchedulerAnalytics';
import {
  type RelationshipToggleKey,
  type ResidentRelationshipGraphSourceData,
  useResidentRelationshipGraph,
} from '@/ui/idleVillage/hooks/useResidentRelationshipGraph';
import type {
  CrewDropFeedbackEvent,
  CrewSchedulerAnalyticsEvent,
} from '@/ui/idleVillage/utils/crewSchedulerAnalyticsChannel';

const SVG_WIDTH = 1100;
const SVG_HEIGHT = 720;

export interface ResidentRelationshipGraphToolProps {
  title?: string;
}

export const ResidentRelationshipGraphTool: React.FC<ResidentRelationshipGraphToolProps> = ({
  title = 'Resident Relationship Graph',
}) => {
  const mapContext = useMapContext();
  const { history } = useCrewSchedulerAnalytics({
    enableHistory: true,
    resetHistoryOnMount: false,
  });

  const graphSource = useMemo<ResidentRelationshipGraphSourceData>(
    () => buildGraphSource(mapContext.residentsById, mapContext.villageState.activities ?? {}, mapContext.config, history),
    [mapContext.residentsById, mapContext.villageState.activities, mapContext.config, history],
  );

  const {
    graph,
    isEmpty,
    filters,
    updateFilters,
    toggles,
    setToggle,
    exportAsJson,
  } = useResidentRelationshipGraph({
    source: graphSource,
  });

  const layout = useForceLayout(graph.nodes, graph.edges, graph.config.forceLayout);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  const handleStatusToggle = useCallback(
    (status: ResidentState['status']) => {
      const next = filters.includeStatuses.includes(status)
        ? filters.includeStatuses.filter((s) => s !== status)
        : [...filters.includeStatuses, status];
      updateFilters({ includeStatuses: next });
    },
    [filters.includeStatuses, updateFilters],
  );

  const handleExportJson = useCallback(() => {
    const payload = exportAsJson();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'resident-relationship-graph.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [exportAsJson]);

  const handleExportPng = useCallback(() => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL;
    const url = DOMURL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SVG_WIDTH;
      canvas.height = SVG_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      DOMURL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = DOMURL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = pngUrl;
        anchor.download = 'resident-relationship-graph.png';
        anchor.click();
        DOMURL.revokeObjectURL(pngUrl);
      });
    };
    image.src = url;
  }, []);

  const statusOptions = useMemo(() => {
    const residentStatuses = new Set<ResidentState['status']>();
    Object.values(mapContext.residentsById).forEach((resident) => {
      if (resident?.status) {
        residentStatuses.add(resident.status);
      }
    });
    return Array.from(residentStatuses).sort();
  }, [mapContext.residentsById]);

  const topEdges = useMemo(() => graph.edges.slice(0, 8), [graph.edges]);
  const selectedNode = graph.nodes.find((node) => node.id === highlightedNode) ?? null;

  return (
    <div className="observatory-page space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="observatory-kicker">Idle Village – Analysis Tool</p>
          <h1 className="text-2xl font-semibold text-ivory">{title}</h1>
          <p className="text-slate-300 text-sm">
            Visualize crew history, quest bonds, synergy tags, and fatigue compatibility to discover trusted crews.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={handleExportJson}>
            Export JSON
          </button>
          <button type="button" className="btn-secondary" onClick={handleExportPng}>
            Export PNG
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="default-card space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-widest">Filters</h2>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-2">Resident Status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <label key={status} className="flex items-center gap-1 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        className="rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400"
                        checked={filters.includeStatuses.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs text-slate-400">
                  <span>Min Activity Count</span>
                  <span className="text-amber-300 font-mono">{filters.minActivityCount}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={Math.max(5, ...graph.nodes.map((node) => node.activityCount))}
                  value={filters.minActivityCount}
                  onChange={(event) => updateFilters({ minActivityCount: Number(event.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-xs text-slate-400">
                  <span>Max Fatigue</span>
                  <span className="text-amber-300 font-mono">{filters.maxFatigue}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.maxFatigue}
                  onChange={(event) => updateFilters({ maxFatigue: Number(event.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-widest">Relationships</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(toggles).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-800 text-emerald-400 focus:ring-emerald-400"
                    checked={value}
                    onChange={(event) => setToggle(key as RelationshipToggleKey, event.target.checked)}
                  />
                  {TOGGLE_LABELS[key as RelationshipToggleKey]}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ivory uppercase tracking-widest">Snapshot</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-200">
              <MetricCard label="Residents" value={graph.nodes.length} />
              <MetricCard label="Connections" value={graph.edges.length} />
              <MetricCard label="Strongest Edge" value={graph.edges[0]?.weight.toFixed(2) ?? '—'} />
              <MetricCard label="Updated" value={new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(graph.metadata.generatedAt)} />
            </div>
          </section>

          {selectedNode ? (
            <section>
              <h2 className="text-sm font-semibold text-ivory uppercase tracking-widest">Selection</h2>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <p className="text-lg font-semibold text-ivory">{selectedNode.label}</p>
                <p>Status: <span className="text-amber-300">{selectedNode.status}</span></p>
                <p>Activities: {selectedNode.activityCount}</p>
                <p>Quests: {selectedNode.questCount}</p>
                <p>Fatigue: {selectedNode.fatigue}</p>
                <p>Synergy Score: {(selectedNode.synergyScore * 100).toFixed(0)}%</p>
                {selectedNode.statTags.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedNode.statTags.map((tag) => (
                        <span key={tag} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="text-xs text-slate-400">
              Hover a resident node to inspect details.
            </section>
          )}
        </aside>

        <div className="default-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h2 className="text-lg font-semibold text-ivory">Force Layout</h2>
              <p className="text-xs text-slate-400">
                Charge: {graph.config.forceLayout.chargeStrength} | Link Distance: {graph.config.forceLayout.linkDistance}px
              </p>
            </div>
            {!isEmpty && (
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {graph.nodes.length} nodes · {graph.edges.length} edges
              </span>
            )}
          </div>
          <div className="relative overflow-hidden rounded border border-slate-800 bg-slate-950">
            {isEmpty ? (
              <div className="flex h-[540px] items-center justify-center text-sm text-slate-400">
                No resident data available. Assign residents to activities to build history.
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="h-[540px] w-full"
                role="img"
                aria-label="Resident relationship graph"
              >
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {graph.edges.map((edge) => {
                  const source = layout.positions[edge.source];
                  const target = layout.positions[edge.target];
                  if (!source || !target) return null;
                  const strokeWidth = 1 + Math.max(0, edge.weight);
                  const color = edge.weight >= 0 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(239, 68, 68, 0.4)';
                  return (
                    <line
                      key={edge.id}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      className="transition-opacity duration-300"
                      opacity={highlightedNode && ![edge.source, edge.target].includes(highlightedNode) ? 0.25 : 0.9}
                    />
                  );
                })}
                {graph.nodes.map((node) => {
                  const position = layout.positions[node.id];
                  if (!position) return null;
                  const radius = 10 + node.synergyScore * 16;
                  const isActive = highlightedNode === node.id;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${position.x}, ${position.y})`}
                      onMouseEnter={() => setHighlightedNode(node.id)}
                      onMouseLeave={() => setHighlightedNode(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        r={radius}
                        fill={isActive ? 'url(#glow)' : 'rgba(59, 130, 246, 0.85)'}
                        stroke={isActive ? '#fde68a' : '#1e3a8a'}
                        strokeWidth={isActive ? 3 : 2}
                        filter={isActive ? 'url(#glow)' : undefined}
                      />
                      <text
                        textAnchor="middle"
                        dy={4}
                        className="text-[10px] font-semibold"
                        fill="#f8fafc"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-ivory mb-2">Strongest Connections</h3>
              {topEdges.length === 0 ? (
                <p className="text-xs text-slate-500">Edges will appear once residents share activities.</p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-200">
                  {topEdges.map((edge) => {
                    const source = graph.nodes.find((node) => node.id === edge.source);
                    const target = graph.nodes.find((node) => node.id === edge.target);
                    if (!source || !target) return null;
                    return (
                      <li
                        key={edge.id}
                        className="flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/50 px-2 py-1"
                      >
                        <span>
                          {source.label} ↔ {target.label}
                        </span>
                        <span className="font-mono text-amber-300">{edge.weight.toFixed(2)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ivory mb-2">Edge Breakdown</h3>
              <p className="text-xs text-slate-400 mb-2">
                Hover a node to see contribution details in the tooltip below.
              </p>
              {highlightedNode ? (
                <ContributionList
                  nodeId={highlightedNode}
                  edges={graph.edges.filter((edge) => edge.source === highlightedNode || edge.target === highlightedNode)}
                />
              ) : (
                <p className="text-xs text-slate-500">No node selected.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-slate-700/70 bg-slate-900/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-ivory">{value}</p>
    </div>
  );
}

function ContributionList({
  nodeId,
  edges,
}: {
  nodeId: string;
  edges: ResidentRelationshipGraphSourceData['activities'] extends never ? never : any;
}) {
  const contributions = useMemo(() => {
    const list: Array<{
      label: string;
      value: number;
    }> = [];
    edges.forEach((edge) => {
      edge.contributions?.forEach((contribution: any) => {
        list.push({
          label: `${edge.source === nodeId ? edge.target : edge.source} · ${contribution.label}`,
          value: contribution.weight,
        });
      });
    });
    return list.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [edges, nodeId]);

  if (contributions.length === 0) {
    return <p className="text-xs text-slate-500">No contributions recorded.</p>;
  }
  return (
    <ul className="space-y-1 text-xs text-slate-200">
      {contributions.map((entry) => (
        <li key={entry.label} className="flex items-center justify-between rounded bg-slate-900/50 px-2 py-1">
          <span>{entry.label}</span>
          <span className={entry.value >= 0 ? 'text-emerald-300 font-mono' : 'text-red-300 font-mono'}>
            {entry.value.toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function buildGraphSource(
  residentsById: Record<string, ResidentState>,
  activities: Record<string, ScheduledActivity>,
  config: IdleVillageConfig,
  history: CrewSchedulerAnalyticsEvent[],
): ResidentRelationshipGraphSourceData {
  const scheduledActivities = Object.values(activities ?? {});
  const questParties = buildQuestParties(scheduledActivities, config);
  const dropFeedback = history
    .filter((event): event is CrewDropFeedbackEvent => event.type === 'drop_feedback')
    .map((event) => ({
      residentId: event.residentId ?? '',
      severity: event.feedbackType === 'blocked' ? 'blocked' : event.feedbackType === 'invalid' ? 'invalid' : 'warning',
      timestamp: event.timestamp,
    }))
    .filter((entry) => entry.residentId);

  return {
    residents: residentsById,
    activities,
    activityHistory: scheduledActivities,
    questParties,
    dropFeedback,
  };
}

function buildQuestParties(activities: ScheduledActivity[], config: IdleVillageConfig) {
  return activities
    .map((activity) => {
      const definition = config.activities?.[activity.activityId];
      const tags = definition?.tags ?? [];
      if (!tags.includes('quest')) {
        return null;
      }
      return {
        questId: activity.activityId,
        participantIds: activity.characterIds ?? [],
        timestamp: activity.startTime ?? 0,
        success: activity.status === 'completed',
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function useForceLayout(
  nodes: ReturnType<typeof useResidentRelationshipGraph>['graph']['nodes'],
  edges: ReturnType<typeof useResidentRelationshipGraph>['graph']['edges'],
  config: ReturnType<typeof useResidentRelationshipGraph>['graph']['config']['forceLayout'],
) {
  return useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    if (nodes.length === 0) {
      return { positions };
    }
    const indexMap = new Map<string, number>();
    nodes.forEach((node, index) => {
      indexMap.set(node.id, index);
      const angle = (index / nodes.length) * Math.PI * 2;
      positions[node.id] = {
        x: SVG_WIDTH / 2 + Math.cos(angle) * 250,
        y: SVG_HEIGHT / 2 + Math.sin(angle) * 250,
      };
    });

    const velocities = nodes.map(() => ({ x: 0, y: 0 }));
    const iterations = 220;
    const charge = config.chargeStrength;
    const linkDistance = config.linkDistance;
    const linkStrength = config.linkStrength;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      // Repulsion
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const posA = positions[nodeA.id];
          const posB = positions[nodeB.id];
          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const force = charge / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          velocities[i].x += fx;
          velocities[i].y += fy;
          velocities[j].x -= fx;
          velocities[j].y -= fy;
        }
      }

      // Attraction
      edges.forEach((edge) => {
        const sourceIndex = indexMap.get(edge.source);
        const targetIndex = indexMap.get(edge.target);
        if (sourceIndex === undefined || targetIndex === undefined) return;
        const sourcePos = positions[edge.source];
        const targetPos = positions[edge.target];
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const delta = distance - linkDistance;
        const force = linkStrength * delta;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        velocities[sourceIndex].x += fx;
        velocities[sourceIndex].y += fy;
        velocities[targetIndex].x -= fx;
        velocities[targetIndex].y -= fy;
      });

      // Integrate
      nodes.forEach((node, index) => {
        const pos = positions[node.id];
        pos.x = clamp(pos.x + velocities[index].x * config.velocityDecay, 40, SVG_WIDTH - 40);
        pos.y = clamp(pos.y + velocities[index].y * config.velocityDecay, 40, SVG_HEIGHT - 40);
        velocities[index].x *= 0.6;
        velocities[index].y *= 0.6;
      });
    }

    return { positions };
  }, [nodes, edges, config]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const TOGGLE_LABELS: Record<RelationshipToggleKey, string> = {
  sharedActivity: 'Shared Activities',
  questBond: 'Quest Bonds',
  statTagOverlap: 'Synergy Tags',
  fatigueCompatibility: 'Fatigue Complement',
  crewHistory: 'Crew History',
};

export default ResidentRelationshipGraphTool;
