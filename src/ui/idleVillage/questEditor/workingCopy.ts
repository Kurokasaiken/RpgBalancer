/**
 * questEditor/workingCopy — tolerant working copy = base + op log.
 * Undo drops ops (per-op / per-field / reset-to-parent); derived is
 * recomputed by replay. Ops that fail validation are refused whole.
 */
import { applyOp, type EditorOp } from './editorOps';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

export interface WorkingCopy {
  readonly base: QuestScenario;
  readonly ops: readonly EditorOp[];
  /** Invalid ops collected for diagnostics — never applied. */
  readonly rejected: readonly { op: EditorOp; reason: string }[];
}

export function createWorkingCopy(base: QuestScenario, ops: readonly EditorOp[] = []): WorkingCopy {
  const wc: WorkingCopy = { base, ops: [], rejected: [] };
  for (const op of ops) applyTo(wc as { ops: EditorOp[]; rejected: { op: EditorOp; reason: string }[] }, op, base);
  return wc;
}

function applyTo(wc: { ops: EditorOp[]; rejected: { op: EditorOp; reason: string }[] }, op: EditorOp, base: QuestScenario): boolean {
  const r = applyOp(derive({ base, ops: wc.ops, rejected: [] }), op);
  if (!r.ok) { wc.rejected.push({ op, reason: r.reason }); return false; }
  wc.ops.push(op);
  return true;
}

/** Push an op; returns false + surfaces reason on refusal (draft unchanged). */
export function applyEditorOp(wc: WorkingCopy, op: EditorOp): { ok: boolean; reason?: string } {
  const r = applyOp(derive(wc), op);
  if (!r.ok) {
    (wc.rejected as { op: EditorOp; reason: string }[]).push({ op, reason: r.reason });
    return { ok: false, reason: r.reason };
  }
  (wc.ops as EditorOp[]).push(op);
  return { ok: true };
}

/** Replay ops over base — the derived (possibly invalid) scenario. */
export function derive(wc: { base: QuestScenario; ops: readonly EditorOp[] }): QuestScenario {
  let sc = JSON.parse(JSON.stringify(wc.base)) as QuestScenario;
  for (const op of wc.ops) {
    const r = applyOp(sc, op);
    if (r.ok) sc = r.scenario;
  }
  return sc;
}

/** Undo the last logged op (compound ops revert atomically). */
export function undo(wc: WorkingCopy): WorkingCopy {
  return { ...wc, ops: wc.ops.slice(0, -1) };
}

/** Drop all ops touching (nodeId, field) — per-field revert. */
export function revertField(wc: WorkingCopy, nodeId: string, field: string): WorkingCopy {
  const keep = wc.ops.filter((op) =>
    !(op.kind === 'setNodeField' && op.nodeId === nodeId && op.field === field) &&
    !(op.kind === 'setOptionField' && op.nodeId === nodeId && op.field === field));
  return { ...wc, ops: keep };
}

/** Reset to parent — drop every op. */
export function resetToParent(wc: WorkingCopy): WorkingCopy {
  return { ...wc, ops: [], rejected: [] };
}

export const isDirty = (wc: WorkingCopy) => wc.ops.length > 0;
