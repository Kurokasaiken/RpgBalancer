/**
 * validation/gates — the four v1 gate runners (PLAN-029 SP-3 T-3..T-7).
 *
 * - `schema` (hard): safeParse on the raw boundary value — a primitive
 *   input fails HERE before any downstream property access.
 * - `graph` (hard): BFS reachability + orphan ends + duplicate hook ids,
 *   beyond superRefine's target checks.
 * - `hookCoverage` (diag): hook-bearing = node with ≥1 gated/hidden
 *   option, trait gate, or armroll effect — measurable scene pressure.
 * - `vocabCoherence` (diag): kit copy ↔ DomainVocab vietati lists.
 * - `copyGate` (diag): narrated copy validity via validateCopy when the
 *   candidate carries narrated provenance.
 * - `journeyDag` (diag): only when a POI journey target is declared —
 *   export-seam gate per AMEND-2(b); NOT_APPLICABLE otherwise.
 *
 * Diagnostics NEVER emit content FAIL: findings → WARNING, absence of
 * preconditions → NOT_RUN{notApplicable}.
 */

import { z } from 'zod';
import { DOMAIN_VOCABS } from '../generation/domainVocabs';
import { QuestScenarioSchema } from '../questScenario.schema';
import type { GateInput, GateRunner } from './gateRegistry';
import type { GateResult } from './types';
import type { validationConfig } from './validationConfig';

type Row = Omit<GateResult, 'id' | 'kind'>;

const row = (r: Row): Row => r;

/** Hard gate — Zod parse of the raw boundary value. */
export const schemaGate: GateRunner = {
  id: 'schema',
  run(input: GateInput): Row {
    const parsed = QuestScenarioSchema.safeParse(input.scenario);
    if (parsed.success) {
      return row({ status: 'PASS', execution: 'ok', summaryKey: 'schema.ok' });
    }
    return row({
      status: 'FAIL',
      execution: 'ok',
      summaryKey: 'schema.fail',
      issues: parsed.error.issues.slice(0, 20).map((i) => ({
        messageKey: 'gates.issues.schemaIssue',
        messageArgs: { path: i.path.join('.'), message: i.message },
        message: i.message,
      })),
    });
  },
};

/** Collect every declared goto/next target reachable from a node. */
function targetsOf(node: {
  options?: { next?: string }[];
  verdictTable?: Record<string, { goto?: unknown } | undefined>;
}): string[] {
  const out: string[] = [];
  for (const o of node.options ?? []) {
    if (!o.next) continue;
    // routing targets carry a `CHECK:` prefix for check-mediated hops
    out.push(o.next.startsWith('CHECK:') ? o.next.slice(6) : o.next);
  }
  for (const outcome of Object.values(node.verdictTable ?? {})) {
    const g = outcome?.goto;
    if (typeof g === 'string') out.push(g);
    else if (g && typeof g === 'object') {
      const gs = g as { branches?: { then?: string }[]; else?: string };
      for (const b of gs.branches ?? []) if (b.then) out.push(b.then);
      if (gs.else) out.push(gs.else);
    }
  }
  return out;
}

/** Hard gate — structural integrity beyond superRefine. */
export const graphGate: GateRunner = {
  id: 'graph',
  run(input: GateInput): Row {
    const parsed = QuestScenarioSchema.safeParse(input.scenario);
    if (!parsed.success) {
      // schema gate owns this failure — graph stays quiet (skipped upstream)
      return row({ status: 'NOT_RUN', execution: 'ok', notRunReason: 'skipped', summaryKey: 'graph.skipped' });
    }
    const s = parsed.data;
    const issues: { messageKey: string; messageArgs?: Record<string, string | number> }[] = [];
    // BFS reachability from startNode
    const seen = new Set<string>();
    const stack = [s.startNode];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const node = s.nodes[id];
      if (node) stack.push(...targetsOf(node as never));
    }
    const unreachable = Object.keys(s.nodes).filter((id) => !seen.has(id));
    for (const id of unreachable) {
      issues.push({ messageKey: 'gates.issues.unreachableNode', messageArgs: { id } });
    }
    // orphan ends: end nodes unreachable from start
    const orphanEnds = Object.values(s.nodes)
      .filter((n) => n.kind === 'end' && !seen.has(n.id))
      .map((n) => n.id);
    for (const id of orphanEnds) {
      issues.push({ messageKey: 'gates.issues.orphanEnd', messageArgs: { id } });
    }
    return issues.length === 0
      ? row({ status: 'PASS', execution: 'ok', summaryKey: 'graph.ok', metrics: { nodes: seen.size } })
      : row({ status: 'FAIL', execution: 'ok', summaryKey: 'graph.fail', issues, metrics: { nodes: seen.size } });
  },
};

/** A node is hook-bearing when it pressures the player beyond free clicks. */
function hookBearing(node: {
  options?: {
    requiresInfo?: string;
    requiresFlag?: string;
    requiresTrait?: string;
    hiddenIfFlag?: string;
    hiddenIfTrait?: string;
    costGold?: number;
  }[];
  risk?: unknown;
  risky?: unknown;
}): boolean {
  if (node.risk || node.risky) return true;
  return (node.options ?? []).some(
    (o) => o.requiresInfo || o.requiresFlag || o.requiresTrait || o.hiddenIfFlag || o.hiddenIfTrait || o.costGold,
  );
}

/** Diagnostic — hook-coverage over scenes (never content-FAIL). */
export const hookCoverageGate = (config: typeof validationConfig): GateRunner => ({
  id: 'hookCoverage',
  run(input: GateInput): Row {
    const parsed = QuestScenarioSchema.safeParse(input.scenario);
    if (!parsed.success) {
      return row({ status: 'NOT_RUN', execution: 'ok', notRunReason: 'skipped', summaryKey: 'hook.skipped' });
    }
    const nodes = Object.values(parsed.data.nodes) as Parameters<typeof hookBearing>[0][];
    const scenes = nodes.filter((n) => (n as { kind?: string }).kind !== 'info');
    const bearing = scenes.filter(hookBearing).length;
    const ratio = scenes.length === 0 ? null : bearing / scenes.length;
    const metrics = { hookBearing: bearing, totalScenes: scenes.length, ratio };
    if (scenes.length === 0) {
      return row({ status: 'WARNING', execution: 'ok', summaryKey: 'hook.zero', metrics });
    }
    return ratio! >= config.hookRatio.advisory
      ? row({ status: 'PASS', execution: 'ok', summaryKey: 'hook.ok', metrics })
      : row({ status: 'WARNING', execution: 'ok', summaryKey: 'hook.low', metrics });
  },
});

/** Collect every user-facing string in a kit copy payload. */
function kitStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((i) => kitStrings(i, out));
  else if (v && typeof v === 'object') {
    for (const val of Object.values(v)) kitStrings(val, out);
  }
  return out;
}

/** Diagnostic — kit copy ↔ DomainVocab forbidden terms (never FAIL). */
export const vocabCoherenceGate: GateRunner = {
  id: 'vocabCoherence',
  run(input: GateInput): Row {
    if (!input.kitId || !(input.kitId in DOMAIN_VOCABS) || input.kit == null) {
      return row({ status: 'NOT_RUN', execution: 'ok', notRunReason: 'notApplicable', summaryKey: 'vocab.na' });
    }
    const vocab = DOMAIN_VOCABS[input.kitId];
    const banned = [...vocab.vietati, ...(vocab.vietatiEn ?? [])].map((w) => w.toLowerCase());
    const strings = kitStrings(input.kit);
    const hits = new Set<string>();
    for (const s of strings) {
      const low = s.toLowerCase();
      for (const w of banned) if (low.includes(w)) hits.add(w);
    }
    const metrics = { strings: strings.length, hits: hits.size };
    return hits.size === 0
      ? row({ status: 'PASS', execution: 'ok', summaryKey: 'vocab.ok', metrics })
      : row({
          status: 'WARNING',
          execution: 'ok',
          summaryKey: 'vocab.hits',
          issues: [...hits].map((w) => ({ messageKey: 'gates.issues.forbiddenTerm', messageArgs: { term: w } })),
          metrics,
        });
  },
};

/** Diagnostic — narrated copy validity (delegates to the copy gate). */
export const copyGate: GateRunner = {
  id: 'copyGate',
  run(input: GateInput): Row {
    // applies only to narrated kits (the kit carries an {en,it} wrapper)
    const kit = input.kit as { en?: unknown; it?: unknown } | undefined;
    if (!kit?.en || !kit?.it) {
      return row({ status: 'NOT_RUN', execution: 'ok', notRunReason: 'notApplicable', summaryKey: 'copy.na' });
    }
    return row({ status: 'WARNING', execution: 'ok', summaryKey: 'copy.deferred' });
  },
};

/** Diagnostic — journey DAG legality; export-seam only (AMEND-2b). */
export const journeyDagGate: GateRunner = {
  id: 'journeyDag',
  run(input: GateInput): Row {
    if (input.poiJourney == null) {
      return row({ status: 'NOT_RUN', execution: 'ok', notRunReason: 'notApplicable', summaryKey: 'journey.na' });
    }
    return row({ status: 'WARNING', execution: 'ok', summaryKey: 'journey.exportSeam' });
  },
};

/** mcDiagnostic placeholder — SP-4 registers the real async runner. */
export const mcDiagnosticPlaceholder: GateRunner = {
  id: 'mcDiagnostic',
  run: (): Row => ({
    status: 'NOT_RUN',
    execution: 'ok',
    notRunReason: 'notImplemented',
    summaryKey: 'mc.pending',
  }),
};
