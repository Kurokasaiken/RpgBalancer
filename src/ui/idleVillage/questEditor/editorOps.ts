/**
 * questEditor/editorOps — EditorOp union + atomic apply (PLAN-102 D6).
 *
 * Every op is a single total validate-then-apply function: failed
 * validation → draft unchanged, error surfaced, op never logged (W-01).
 * Compound ops (removeNode + inbound rewire) apply atomically and revert
 * atomically. The draft is TOLERANT: it may be schema-invalid while
 * typing; ops only enforce structural preconditions, never Zod.
 */
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { QuestNode, QuestNodeOption, Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';

/** Node ids whose routing lives in the engine switch (questRun.ts
 *  applyNodeOutcome + INSIDE_CHECKS) — engine-owned, D4 badge list. */
export const ENGINE_ROUTED_NODE_IDS: ReadonlySet<string> = new Set([
  'avvistamento', 'check-ingresso-forza', 'check-ingresso-agi',
  'check-ingresso-cha', 'check-ingresso-laterale', 'perquisizione',
  'check-gabbia', 'obiettivo', 'check-forziere', 'risveglio',
  'check-uscita-breccia', 'check-uscita-calma', 'check-uscita-allarme',
  'rv-check-osserva', 'rv-check-incalza', 'rv-fiume', 'rv-check-sneak',
  'rv-check-fight', 'rv-sala', 'rv-check-trappola', 'rv-check-prendi',
  'rv-check-sicuro', 'rv-camera',
  'gob-tracce-per', 'gob-tracce-perfor', 'gob-stealth', 'gob-assalto',
  'gob-incalza-check', 'gob-cerca',
]);

/** Fields a writer may touch per node — engine-owned ids only constrain
 *  routing/verdictTable, not text or balance. */
export type EditorOp =
  | { kind: 'setNodeField'; nodeId: string; field: string; value: unknown }
  | { kind: 'setScenarioField'; field: string; value: unknown }
  | { kind: 'setOptionField'; nodeId: string; optionIdx: number; field: string; value: unknown }
  | { kind: 'addNode'; node: QuestNode }
  | { kind: 'removeNode'; nodeId: string; rewires?: { fromNodeId: string; optionIdx: number | 'next'; to: string }[] }
  | { kind: 'addOption'; nodeId: string; option: QuestNodeOption }
  | { kind: 'removeOption'; nodeId: string; optionIdx: number }
  | { kind: 'rewireNext'; nodeId: string; optionIdx: number | 'next'; to: string }
  | { kind: 'setVerdictRow'; nodeId: string; verdict: Verdict | 'else'; spec: unknown }
  | { kind: 'remapOverlayKeys'; map: Record<string, string> }
  | { kind: 'setBeat'; nodeId: string; beat: QuestNode['beat'] };

/** Result of trying an op: either the new nodes map or a refusal reason. */
export type OpResult = { ok: true; scenario: QuestScenario } | { ok: false; reason: string };

/** Option-level fields that carry a `next` target checked at rewire. */
const deep = (o: unknown) => JSON.parse(JSON.stringify(o)) as never;

const stripCheck = (t?: string) => (t?.startsWith('CHECK:') ? t.slice(6) : t);

function targetOf(node: QuestNode, optionIdx: number | 'next'): string | undefined {
  if (optionIdx === 'next') return (node as { next?: string }).next;
  return node.options?.[optionIdx]?.next;
}

/** Count inbound references to `nodeId` (options.next + node.next + startNode). */
export function inboundRefs(scenario: QuestScenario, nodeId: string): { nodeId: string; optionIdx: number | 'next' }[] {
  const refs: { nodeId: string; optionIdx: number | 'next' }[] = [];
  for (const [id, n] of Object.entries(scenario.nodes)) {
    if (stripCheck((n as { next?: string }).next) === nodeId) refs.push({ nodeId: id, optionIdx: 'next' });
    n.options?.forEach((o, i) => { if (stripCheck(o.next) === nodeId) refs.push({ nodeId: id, optionIdx: i }); });
  }
  return refs;
}

function setTarget(node: QuestNode, optionIdx: number | 'next', to: string): void {
  const cur = targetOf(node, optionIdx) ?? '';
  const next = cur.startsWith('CHECK:') ? `CHECK:${to}` : to;
  if (optionIdx === 'next') (node as { next?: string }).next = next;
  else node.options![optionIdx].next = next;
}

/**
 * Try to apply one op to `scenario`. Atomic: on refusal the input is
 * untouched (we mutate only the deep copy, returned on ok).
 */
export function applyOp(scenario: QuestScenario, op: EditorOp): OpResult {
  const sc = deep(scenario) as QuestScenario;
  const node = sc.nodes[(op as { nodeId?: string }).nodeId ?? ''];
  switch (op.kind) {
    case 'setNodeField': {
      if (!node) return { ok: false, reason: `node ${op.nodeId} not found` };
      (node as Record<string, unknown>)[op.field] = op.value;
      return { ok: true, scenario: sc };
    }
    case 'setScenarioField': {
      (sc as Record<string, unknown>)[op.field] = op.value;
      return { ok: true, scenario: sc };
    }
    case 'setOptionField': {
      const opt = node?.options?.[op.optionIdx];
      if (!opt) return { ok: false, reason: `option ${op.optionIdx} not found on ${op.nodeId}` };
      (opt as Record<string, unknown>)[op.field] = op.value;
      return { ok: true, scenario: sc };
    }
    case 'addNode': {
      if (sc.nodes[op.node.id]) return { ok: false, reason: `node ${op.node.id} exists` };
      if (ENGINE_ROUTED_NODE_IDS.has(op.node.id) && !sc.nodes[op.node.id])
        return { ok: false, reason: `id ${op.node.id} is engine-routed (rename or explicit fork)` };
      sc.nodes[op.node.id] = deep(op.node);
      return { ok: true, scenario: sc };
    }
    case 'removeNode': {
      if (!node) return { ok: false, reason: `node ${op.nodeId} not found` };
      if (ENGINE_ROUTED_NODE_IDS.has(op.nodeId)) return { ok: false, reason: `${op.nodeId} is engine-routed — locked id` };
      const inbound = inboundRefs(scenario, op.nodeId);
      const resolved = new Set((op.rewires ?? []).map((r) => `${r.fromNodeId}:${r.optionIdx}`));
      for (const r of inbound) if (!resolved.has(`${r.nodeId}:${r.optionIdx}`))
        return { ok: false, reason: `inbound ${r.nodeId}[${r.optionIdx}] unresolved — repoint or keep dangling via rewire op` };
      for (const r of op.rewires ?? []) {
        const src = sc.nodes[r.fromNodeId];
        if (!src || stripCheck(targetOf(src, r.optionIdx)) !== op.nodeId) return { ok: false, reason: `rewire source ${r.fromNodeId}[${r.optionIdx}] does not point to ${op.nodeId}` };
        if (!sc.nodes[r.to] && r.to !== op.nodeId) return { ok: false, reason: `rewire target ${r.to} not found` };
        setTarget(src, r.optionIdx, r.to);
      }
      delete sc.nodes[op.nodeId];
      if (sc.startNode === op.nodeId) return { ok: false, reason: `${op.nodeId} is startNode` };
      return { ok: true, scenario: sc };
    }
    case 'addOption': {
      if (!node) return { ok: false, reason: `node ${op.nodeId} not found` };
      if (!node.options) return { ok: false, reason: `${op.nodeId} has no options (kind ${node.kind})` };
      node.options.push(deep(op.option));
      return { ok: true, scenario: sc };
    }
    case 'removeOption': {
      if (!node?.options?.[op.optionIdx]) return { ok: false, reason: `option ${op.optionIdx} not found` };
      node.options.splice(op.optionIdx, 1);
      return { ok: true, scenario: sc };
    }
    case 'rewireNext': {
      if (!node) return { ok: false, reason: `node ${op.nodeId} not found` };
      if (!sc.nodes[stripCheck(op.to)]) return { ok: false, reason: `target ${op.to} not found` };
      if (targetOf(node, op.optionIdx) === undefined) return { ok: false, reason: `${op.nodeId}[${op.optionIdx}] has no next` };
      setTarget(node, op.optionIdx, op.to);
      return { ok: true, scenario: sc };
    }
    case 'setVerdictRow': {
      if (!node) return { ok: false, reason: `node ${op.nodeId} not found` };
      if (ENGINE_ROUTED_NODE_IDS.has(op.nodeId) && !node.verdictTable)
        return { ok: false, reason: `${op.nodeId} routing is engine-owned — fork-to-new-id to edit verdictTable` };
      const vt = { ...(node.verdictTable ?? {}) } as Record<string, unknown>;
      vt[op.verdict] = op.spec;
      node.verdictTable = vt as QuestNode['verdictTable'];
      return { ok: true, scenario: sc };
    }
    case 'remapOverlayKeys':
      return { ok: true, scenario: sc }; // overlay lives outside nodes — noop on scenario, recorded for the candidate payload
    case 'setBeat': {
      if (!node) return { ok: false, reason: `node ${op.nodeId} not found` };
      node.beat = op.beat;
      return { ok: true, scenario: sc };
    }
  }
}
