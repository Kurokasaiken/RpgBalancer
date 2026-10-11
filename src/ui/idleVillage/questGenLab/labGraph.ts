/**
 * labGraph — scenario graph derivation for the Quest Generation Lab
 * (R-140).
 *
 * Turns a `QuestScenario` node map into a renderable tree: a DFS from
 * `startNode` through every declared edge — options, CHECK: hops, node.next
 * and the verdictTable's declarative routing (branches + else). Cycles are
 * expected (the flood hub returns to the crossroads): a node already shown
 * is emitted as a `repeated` row, never expanded twice.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type {
  GotoSpec,
  OutcomeCond,
  QuestNode,
  QuestOption,
  Verdict,
} from '@/ui/idleVillage/questS1Lab/questScenario';
import { gatesOfOption } from './labModel';

/* ------------------------------------------------------------------ */
/* Edges                                                                */
/* ------------------------------------------------------------------ */

/** How a hop between nodes was declared. */
export type EdgeVia = 'option' | 'next' | 'verdict' | 'branch' | 'else' | 'combat';

/** One declared edge of the scenario graph. */
export interface LabEdge {
  from: string;
  to: string;
  via: EdgeVia;
  /** Option label or verdict name — how the player/engine reaches `to`. */
  label: string;
  /** Gate chips on the option (`info:x`, `trait:avido`, `gold:8`). */
  gates: string[];
  /** Compact branch condition (`flag x`, `acqua ≥ 8`). */
  cond?: string;
}

/** Compact human-readable condition for an `OutcomeCond`. */
export function condLabel(cond: OutcomeCond): string {
  const parts: string[] = [];
  if (cond.flag) parts.push(`flag:${cond.flag}`);
  if (cond.notFlag) parts.push(`¬${cond.notFlag}`);
  if (cond.varGE) parts.push(`${cond.varGE.var}≥${cond.varGE.value}`);
  if (cond.varLT) parts.push(`${cond.varLT.var}<${cond.varLT.value}`);
  return parts.join(' & ');
}

function verdictEdges(node: QuestNode): LabEdge[] {
  const edges: LabEdge[] = [];
  for (const [verdict, outcome] of Object.entries(node.verdictTable ?? {})) {
    if (!outcome) continue;
    const label = verdict as Verdict | 'else';
    const push = (to: string, via: EdgeVia, cond?: string) =>
      edges.push({ from: node.id, to, via, label, gates: [], ...(cond ? { cond } : {}) });
    const g: GotoSpec = outcome.goto;
    if (typeof g === 'string') {
      push(g, 'verdict');
    } else {
      for (const branch of g.branches) {
        push(branch.then, 'branch', condLabel(branch.when));
      }
      push(g.else, 'else');
    }
  }
  return edges;
}

function optionEdges(node: QuestNode): LabEdge[] {
  return (node.options ?? []).flatMap((o: QuestOption): LabEdge[] => {
    const gates = gatesOfOption(o);
    if (o.next.startsWith('CHECK:')) {
      return [
        {
          from: node.id,
          to: o.next.slice('CHECK:'.length),
          via: 'option',
          label: o.label,
          gates: [...gates, 'check'],
        },
      ];
    }
    return [{ from: node.id, to: o.next, via: 'option', label: o.label, gates }];
  });
}

/** Every declared edge of a node — options, next, combat exits, verdicts. */
export function nodeEdges(node: QuestNode): LabEdge[] {
  const edges: LabEdge[] = [];
  if (node.kind === 'choice') edges.push(...optionEdges(node));
  if (node.combat) {
    if (node.combat.nextCleared)
      edges.push({ from: node.id, to: node.combat.nextCleared, via: 'combat', label: 'sconfitti', gates: [] });
    if (node.combat.nextSurvivors)
      edges.push({ from: node.id, to: node.combat.nextSurvivors, via: 'combat', label: 'tempo scaduto', gates: [] });
  }
  if (node.next) edges.push({ from: node.id, to: node.next, via: 'next', label: 'continua', gates: [] });
  edges.push(...verdictEdges(node));
  return edges;
}

/* ------------------------------------------------------------------ */
/* DFS tree                                                             */
/* ------------------------------------------------------------------ */

/** One row of the rendered scenario tree. */
export interface TreeRow {
  /** Node id — key for detail selection. */
  nodeId: string;
  depth: number;
  /** The edge that brought the traversal here (absent on the root). */
  edge?: LabEdge;
  /** True when the node was already expanded — a cycle reference. */
  repeated: boolean;
  node: QuestNode;
}

const MAX_DEPTH = 10;
const MAX_ROWS = 120;

/**
 * DFS from `startNode`. First visit expands; re-visits emit a `repeated`
 * stub row so the tree stays finite on hub graphs (flood `crocevia`).
 */
export function scenarioTreeRows(scenario: QuestScenario): TreeRow[] {
  const rows: TreeRow[] = [];
  const expanded = new Set<string>();
  const walk = (nodeId: string, depth: number, edge?: LabEdge) => {
    const node = scenario.nodes[nodeId];
    if (!node || rows.length >= MAX_ROWS) return;
    if (expanded.has(nodeId)) {
      rows.push({ nodeId, depth, edge, repeated: true, node });
      return;
    }
    expanded.add(nodeId);
    rows.push({ nodeId, depth, edge, repeated: false, node });
    if (depth >= MAX_DEPTH) return;
    for (const e of nodeEdges(node)) walk(e.to, depth + 1, e);
  };
  walk(scenario.startNode, 0);
  return rows;
}
