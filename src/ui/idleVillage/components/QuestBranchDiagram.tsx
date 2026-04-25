import React, { useMemo } from 'react';
import clsx from 'clsx';
import type {
  QuestDefinition,
  QuestPhase,
  QuestState,
  BranchDecision,
  DialogueChoice,
  TimedChoice,
  BranchCondition,
} from '@/engine/quest/types';

type DiagramNodeStatus = 'completed' | 'active' | 'pending' | 'failed';

/**
 * Representation of an edge between quest phases in the diagram.
 */
interface DiagramEdge {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  isTaken: boolean;
  isFuture: boolean;
  isPrimaryPath: boolean;
}

/**
 * Visual node representation derived from QuestPhase data.
 */
interface DiagramNode {
  id: string;
  phase: QuestPhase;
  column: number;
  status: DiagramNodeStatus;
  isBranchPoint: boolean;
  icon: string;
  variantClass: string;
  heroicBadge?: string;
  choiceSummary?: string | null;
  edges: DiagramEdge[];
}

/**
 * Props for QuestBranchDiagram.
 */
export interface QuestBranchDiagramProps {
  quest: QuestDefinition;
  questState: QuestState;
  className?: string;
  compact?: boolean;
  onNodeSelect?: (phaseId: string) => void;
}

const PHASE_ICON: Record<QuestPhase['type'], string> = {
  check: '🔍',
  fight: '⚔️',
  stealth: '👤',
  trap: '🪤',
  explore: '🧭',
  dialogue: '💬',
  branch: '🔀',
  timedChoice: '⏱️',
};

const VARIANT_CLASSES: Record<QuestPhase['type'], string> = {
  check: 'from-fuchsia-400 via-purple-500 to-fuchsia-300',
  fight: 'from-amber-400 via-orange-500 to-rose-400',
  stealth: 'from-indigo-300 via-purple-500 to-indigo-200',
  trap: 'from-emerald-300 via-teal-500 to-emerald-200',
  explore: 'from-cyan-300 via-sky-400 to-cyan-100',
  dialogue: 'from-blue-300 via-sky-500 to-blue-200',
  branch: 'from-yellow-200 via-amber-400 to-yellow-100',
  timedChoice: 'from-slate-300 via-slate-500 to-slate-200',
};

const STATUS_STYLES: Record<DiagramNodeStatus, string> = {
  completed: 'border-emerald-300/70 bg-emerald-500/10 text-emerald-50 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
  active:
    'border-amber-300/80 bg-amber-500/10 text-amber-50 shadow-[0_0_35px_rgba(251,191,36,0.35)] ring-1 ring-amber-300/60',
  pending: 'border-white/10 text-slate-100 opacity-90',
  failed: 'border-rose-400/70 bg-rose-500/10 text-rose-50 shadow-[0_0_25px_rgba(244,63,94,0.25)]',
};

const EDGE_STYLE = {
  taken: 'border-emerald-300/60 text-emerald-100 bg-emerald-500/10',
  pending: 'border-white/10 text-slate-200',
  future: 'border-amber-200/40 text-amber-100 bg-amber-500/5',
};

const FALLBACK_EDGE_LABEL = 'Prosegue';

/**
 * QuestBranchDiagram renders a compact branch visualization for multi-phase quests.
 */
export const QuestBranchDiagram: React.FC<QuestBranchDiagramProps> = ({
  quest,
  questState,
  className,
  compact = false,
  onNodeSelect,
}) => {
  const data = useMemo(() => buildDiagramData(quest, questState), [quest, questState]);

  return (
    <section
      className={clsx(
        'rounded-3xl border border-white/10 bg-black/50 p-5 text-ivory shadow-[0_25px_60px_rgba(0,0,0,0.55)] backdrop-blur-lg',
        className,
      )}
      aria-label="Quest Branch Diagram"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Quest Branch Diagram</p>
          <h3 className="text-xl font-semibold tracking-[0.25em] text-amber-100">{quest.title}</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-slate-300">
          <span>
            Fasi {questState.completedPhaseIds.length}/{quest.phases.length}
          </span>
          <span>Diramazioni {questState.branchHistory.length}</span>
        </div>
      </header>

      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-full items-start gap-6">
          {data.columns.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-300">
              Nessuna fase disponibile per questa quest.
            </div>
          )}

          {data.columns.map((column, columnIndex) => (
            <div key={`column_${columnIndex}`} className="flex min-w-[180px] flex-1 flex-col items-center gap-6">
              <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Fase {columnIndex + 1}</div>
              {column.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  disabled={!onNodeSelect}
                  onClick={() => onNodeSelect?.(node.id)}
                  className={clsx(
                    'w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200',
                    STATUS_STYLES[node.status],
                    onNodeSelect && 'hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-amber-300/70',
                    !onNodeSelect && 'cursor-default',
                  )}
                  data-testid={`quest-node-${node.id}`}
                  aria-label={`Fase ${node.phase.title} stato ${node.status}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">{node.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-300">#{node.id}</p>
                      <p className={clsx('font-semibold tracking-[0.15em]', compact ? 'text-sm' : 'text-base')}>
                        {node.phase.title}
                      </p>
                      {!compact && node.phase.description && (
                        <p className="text-xs text-slate-300/80">{node.phase.description}</p>
                      )}
                    </div>
                  </div>

                  {node.choiceSummary && (
                    <div className="mt-3 rounded-xl border border-blue-300/40 bg-blue-500/10 px-3 py-1 text-[11px] text-blue-100">
                      {node.choiceSummary}
                    </div>
                  )}

                  {node.heroicBadge && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-100">
                      🏆 {node.heroicBadge}
                    </div>
                  )}

                  {node.edges.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {node.edges.map((edge) => (
                        <div
                          key={edge.id}
                          className={clsx(
                            'flex items-center justify-between rounded-xl border px-3 py-1 text-xs uppercase tracking-[0.2em]',
                            edge.isTaken
                              ? EDGE_STYLE.taken
                              : edge.isFuture
                                ? EDGE_STYLE.future
                                : EDGE_STYLE.pending,
                          )}
                          data-testid={`quest-edge-${edge.id}`}
                        >
                          <span className="truncate">{edge.label}</span>
                          {edge.isTaken && <span className="text-[10px] text-emerald-100">✓</span>}
                          {!edge.isTaken && edge.isFuture && <span className="text-[10px] text-amber-200">→</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuestBranchDiagram;

/**
 * Builds columnar quest diagram data from raw quest configuration.
 */
function buildDiagramData(quest: QuestDefinition, questState: QuestState) {
  const adjacency = buildAdjacencyMap(quest);
  const depthInfo = buildDepthColumns(quest.startPhaseId, adjacency);
  const takenEdges = buildTakenEdgeMap(questState.branchHistory);
  const nodesById = new Map<string, DiagramNode>();

  quest.phases.forEach((phase, index) => {
    const status = resolveStatus(phase.id, quest, questState);
    const isBranchPoint = ['dialogue', 'branch', 'timedChoice'].includes(phase.type);
    const icon = PHASE_ICON[phase.type];
    const variantClass = VARIANT_CLASSES[phase.type];
    const column = depthInfo.depthMap.get(phase.id) ?? depthInfo.columns.length;
    const edges = buildEdgesForPhase({
      phase,
      quest,
      questState,
      adjacency,
      takenEdges,
      phaseIndex: index,
    });

    const choiceSummary = questState.branchHistory
      .find((decision) => decision.phaseId === phase.id)?.outcome.metadata?.choiceMade ?? null;

    const heroicBadge = questState.branchHistory
      .find((decision) => decision.phaseId === phase.id)?.outcome.metadata?.heroicThreshold
      ? 'Heroic Threshold'
      : undefined;

    nodesById.set(phase.id, {
      id: phase.id,
      phase,
      column,
      status,
      isBranchPoint,
      icon,
      variantClass,
      heroicBadge,
      choiceSummary,
      edges,
    });
  });

  const columns: DiagramNode[][] = [];
  depthInfo.columns.forEach((ids, depth) => {
    const columnNodes = ids
      .map((id) => nodesById.get(id))
      .filter((node): node is DiagramNode => Boolean(node));
    if (columnNodes.length > 0) {
      columns[depth] = columnNodes;
    }
  });

  // Include nodes that were not reachable in BFS (e.g. detached definitions)
  nodesById.forEach((node) => {
    if (!columns[node.column]) {
      columns[node.column] = [node];
      return;
    }
    if (!columns[node.column].some((entry) => entry.id === node.id)) {
      columns[node.column].push(node);
    }
  });

  return { columns };
}

/**
 * Builds adjacency between quest phases using BranchOutcome definitions.
 */
function buildAdjacencyMap(quest: QuestDefinition) {
  const map = new Map<string, Set<string>>();

  quest.phases.forEach((phase, index) => {
    const targets = new Set<string>();
    switch (phase.type) {
      case 'dialogue':
        phase.choices.forEach((choice: DialogueChoice) => {
          choice.outcome.nextPhaseIds.forEach((nextId) => targets.add(nextId));
        });
        break;
      case 'timedChoice':
        phase.choices.forEach((choice: TimedChoice) => {
          choice.outcome.nextPhaseIds.forEach((nextId) => targets.add(nextId));
        });
        phase.timeoutOutcome.nextPhaseIds.forEach((nextId) => targets.add(nextId));
        break;
      case 'branch':
        phase.conditions.forEach((condition: BranchCondition) => {
          condition.outcome.nextPhaseIds.forEach((nextId) => targets.add(nextId));
        });
        phase.defaultOutcome.nextPhaseIds.forEach((nextId) => targets.add(nextId));
        break;
      default: {
        const sequential = quest.phases[index + 1];
        if (sequential) {
          targets.add(sequential.id);
        }
        break;
      }
    }

    if (!map.has(phase.id)) {
      map.set(phase.id, new Set());
    }
    targets.forEach((targetId) => map.get(phase.id)?.add(targetId));
  });

  return map;
}

/**
 * Generates BFS depth columns for visual alignment.
 */
function buildDepthColumns(startPhaseId: string, adjacency: Map<string, Set<string>>) {
  const depthMap = new Map<string, number>();
  const columns: string[][] = [];
  const queue: Array<{ id: string; depth: number }> = [{ id: startPhaseId, depth: 0 }];
  depthMap.set(startPhaseId, 0);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (!columns[depth]) {
      columns[depth] = [];
    }
    if (!columns[depth].includes(id)) {
      columns[depth].push(id);
    }

    const neighbors = adjacency.get(id);
    if (!neighbors) continue;
    neighbors.forEach((neighborId) => {
      const existingDepth = depthMap.get(neighborId);
      if (existingDepth === undefined || existingDepth > depth + 1) {
        depthMap.set(neighborId, depth + 1);
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    });
  }

  return { depthMap, columns };
}

/**
 * Returns quick lookup map for edges already traversed during quest execution.
 */
function buildTakenEdgeMap(branchHistory: BranchDecision[]) {
  const map = new Map<string, Set<string>>();
  branchHistory.forEach((decision) => {
    if (!map.has(decision.phaseId)) {
      map.set(decision.phaseId, new Set());
    }
    decision.outcome.nextPhaseIds.forEach((nextId) => map.get(decision.phaseId)?.add(nextId));
  });
  return map;
}

/**
 * Derives visual status for a node based on quest progress.
 */
function resolveStatus(phaseId: string, quest: QuestDefinition, questState: QuestState): DiagramNodeStatus {
  const isCompleted = questState.completedPhaseIds.includes(phaseId);
  const isCurrent = questState.currentPhaseId === phaseId;
  const isFailurePhase = quest.failurePhaseIds.includes(phaseId);

  if (isCurrent && isFailurePhase) {
    return 'failed';
  }
  if (isCurrent) {
    return 'active';
  }
  if (isCompleted && isFailurePhase) {
    return 'failed';
  }
  if (isCompleted) {
    return 'completed';
  }
  return 'pending';
}

/**
 * Builds edges for a specific phase, annotating taken/future branches.
 */
function buildEdgesForPhase({
  phase,
  quest,
  questState,
  adjacency,
  takenEdges,
  phaseIndex,
}: {
  phase: QuestPhase;
  quest: QuestDefinition;
  questState: QuestState;
  adjacency: Map<string, Set<string>>;
  takenEdges: Map<string, Set<string>>;
  phaseIndex: number;
}): DiagramEdge[] {
  const nextPhaseIds = adjacency.get(phase.id);
  if (!nextPhaseIds || nextPhaseIds.size === 0) {
    return [];
  }

  const edges: DiagramEdge[] = [];
  const takenTargets = takenEdges.get(phase.id) ?? new Set();

  const addEdge = (toId: string, label: string) => {
    if (!toId) return;
    const isTaken = takenTargets.has(toId);
    const isFuture =
      !isTaken &&
      (questState.currentPhaseId === phase.id ||
        questState.currentPhaseId === toId ||
        questState.completedPhaseIds.includes(phase.id));

    const edge: DiagramEdge = {
      id: `${phase.id}-${toId}-${label}`,
      fromId: phase.id,
      toId,
      label: label || FALLBACK_EDGE_LABEL,
      isTaken,
      isFuture,
      isPrimaryPath: false,
    };
    edges.push(edge);
  };

  switch (phase.type) {
    case 'dialogue':
      phase.choices.forEach((choice) => {
        choice.outcome.nextPhaseIds.forEach((nextId) => addEdge(nextId, choice.text));
      });
      break;
    case 'timedChoice':
      phase.choices.forEach((choice) => {
        choice.outcome.nextPhaseIds.forEach((nextId) => addEdge(nextId, `${choice.text} · ${choice.timeCostSeconds}s`));
      });
      phase.timeoutOutcome.nextPhaseIds.forEach((nextId) => addEdge(nextId, 'Timeout'));
      break;
    case 'branch':
      phase.conditions.forEach((condition, idx) => {
        condition.outcome.nextPhaseIds.forEach((nextId) => addEdge(nextId, `Cond. ${idx + 1}`));
      });
      phase.defaultOutcome.nextPhaseIds.forEach((nextId) => addEdge(nextId, 'Default'));
      break;
    default: {
      const sequential = quest.phases[phaseIndex + 1];
      if (sequential) {
        addEdge(sequential.id, FALLBACK_EDGE_LABEL);
      }
      break;
    }
  }

  return edges;
}
