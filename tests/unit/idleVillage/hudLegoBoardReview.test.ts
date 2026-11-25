/**
 * PLAN-134 T-004/T-005 — review/export rules and pure packet preflight.
 */
import { describe, expect, it } from 'vitest';
import { createInventorySnapshot, type HudLegoInventorySnapshot } from '@/pages/hud-lab/lego/inventory';
import {
  buildRulingPacket,
  preflightRulingPacket,
  renderRulingPacketMarkdown,
  rulingPacketSchema,
  serializeRulingPacket,
} from '@/pages/hud-lab/lego/review';

const NOW = '2026-11-25T12:00:00.000Z';
const firstByStatus = (snapshot: HudLegoInventorySnapshot, status: 'candidate' | 'baptized' | 'retired') => {
  const piece = snapshot.pieces.find((candidate) => candidate.status === status);
  expect(piece, `fixture needs a ${status} piece`).toBeTruthy();
  return piece!;
};

describe('ruling packet behavioral contract (PLAN-134 §6)', () => {
  it('1. a baptized piece appears approved as baseline but is absent from the packet while untouched', () => {
    const snapshot = createInventorySnapshot();
    const baptized = firstByStatus(snapshot, 'baptized');
    expect(baptized.status).toBe('baptized');
    const result = buildRulingPacket({}, snapshot, NOW);
    expect(result.packet).toBeUndefined();
    expect(result.issues.some((issue) => issue.code === 'no-decisions')).toBe(true);
  });

  it('2. explicitly approving a baptized piece creates an exportable touched decision', () => {
    const snapshot = createInventorySnapshot();
    const baptized = firstByStatus(snapshot, 'baptized');
    const result = buildRulingPacket({ [baptized.id]: { decision: 'approved' } }, snapshot, NOW);
    expect(result.issues).toEqual([]);
    expect(result.packet?.decisions).toEqual([
      expect.objectContaining({ id: baptized.id, decision: 'approved', previousStatus: 'baptized' }),
    ]);
  });

  it('3. rejecting a baptized piece exports previousStatus baptized and applies as retirement', () => {
    const snapshot = createInventorySnapshot();
    const baptized = firstByStatus(snapshot, 'baptized');
    const result = buildRulingPacket({ [baptized.id]: { decision: 'rejected', reason: 'scale-mismatch' } }, snapshot, NOW);
    expect(result.issues).toEqual([]);
    expect(result.packet?.decisions[0]).toEqual(expect.objectContaining({ previousStatus: 'baptized', decision: 'rejected' }));
    const preflight = preflightRulingPacket(result.packet, snapshot);
    expect(preflight.status).toBe('applicable');
    expect(preflight.transitions).toEqual([{ id: baptized.id, from: 'baptized', to: 'retired' }]);
  });

  it('4. reject without reason blocks export; reject other without note blocks export', () => {
    const snapshot = createInventorySnapshot();
    const candidate = firstByStatus(snapshot, 'candidate');
    const missingReason = buildRulingPacket({ [candidate.id]: { decision: 'rejected' } }, snapshot, NOW);
    expect(missingReason.packet).toBeUndefined();
    expect(missingReason.issues.map((issue) => issue.code)).toContain('missing-reason');
    const missingNote = buildRulingPacket({ [candidate.id]: { decision: 'rejected', reason: 'other' } }, snapshot, NOW);
    expect(missingNote.packet).toBeUndefined();
    expect(missingNote.issues.map((issue) => issue.code)).toContain('missing-other-note');
    const validOther = buildRulingPacket({ [candidate.id]: { decision: 'rejected', reason: 'other', note: 'needs a different material story' } }, snapshot, NOW);
    expect(validOther.issues).toEqual([]);
  });

  it('5. rejecting frame-x-v1 does not imply rejecting frame-x-v2 immutable revisions', () => {
    const snapshot = createInventorySnapshot();
    const source = snapshot.pieces.find((piece) => piece.kind === 'frame')!;
    const fixture: HudLegoInventorySnapshot = {
      ...structuredClone(snapshot),
      pieces: [
        { ...source, id: 'frame-x-v1' },
        { ...source, id: 'frame-x-v2' },
      ],
    };
    const result = buildRulingPacket({ 'frame-x-v1': { decision: 'rejected', reason: 'scale-mismatch' } }, fixture, NOW);
    expect(result.packet?.decisions.map((decision) => decision.id)).toEqual(['frame-x-v1']);
    expect(result.packet?.decisions.some((decision) => decision.id === 'frame-x-v2')).toBe(false);
  });

  it('6. unresolved lab entries have no piece id and cannot enter the packet', () => {
    const snapshot = createInventorySnapshot();
    expect(snapshot.labReconciliation.piastrina.classification).toBe('unresolved');
    expect(snapshot.labReconciliation.piastrina.pieceIds).toBeUndefined();
    expect(snapshot.pieces.some((piece) => piece.id === 'piastrina')).toBe(false);
    const result = buildRulingPacket({ piastrina: { decision: 'approved' } }, snapshot, NOW);
    expect(result.packet).toBeUndefined();
    expect(result.issues.map((issue) => issue.code)).toContain('unknown-piece');
  });

  it('7. export JSON validates as schema v1 and Markdown derives from the same packet object', () => {
    const snapshot = createInventorySnapshot();
    const candidate = firstByStatus(snapshot, 'candidate');
    const result = buildRulingPacket({ [candidate.id]: { decision: 'approved', constraint: 'use only as major CTA' } }, snapshot, NOW);
    expect(result.packet).toBeTruthy();
    const parsedJson = JSON.parse(serializeRulingPacket(result.packet!));
    expect(rulingPacketSchema.safeParse(parsedJson).success).toBe(true);
    const markdown = renderRulingPacketMarkdown(result.packet!);
    expect(markdown).toContain(candidate.id);
    expect(markdown).toContain(result.packet!.inventoryRev);
    expect(markdown).toContain('use only as major CTA');
  });

  it('8. changing inventory/status after the decision makes preflight stale; status mismatch is conflict', () => {
    const snapshot = createInventorySnapshot();
    const candidate = firstByStatus(snapshot, 'candidate');
    const beforeCanon = JSON.stringify(snapshot.pieces);
    const result = buildRulingPacket({ [candidate.id]: { decision: 'approved' } }, snapshot, NOW);
    const changed = structuredClone(snapshot);
    changed.pieces = snapshot.pieces.map((piece) => piece.id === candidate.id ? { ...piece, status: 'baptized' as const } : piece);
    expect(preflightRulingPacket(result.packet, changed).status).toBe('stale');
    const wrongPrevious = { ...result.packet!, decisions: result.packet!.decisions.map((decision) => ({ ...decision, previousStatus: 'retired' as const })) };
    const conflict = preflightRulingPacket(wrongPrevious, snapshot);
    expect(conflict.status).toBe('conflict');
    expect(conflict.issues.map((issue) => issue.code)).toContain('status-conflict');
    expect(JSON.stringify(snapshot.pieces)).toBe(beforeCanon);
  });

  it('retired immutable ids cannot be re-approved in export or preflight', () => {
    const snapshot = createInventorySnapshot();
    const source = firstByStatus(snapshot, 'candidate');
    const fixture: HudLegoInventorySnapshot = {
      ...structuredClone(snapshot),
      pieces: [{ ...source, id: 'retired-fixture-v1', status: 'retired' }],
    };
    const build = buildRulingPacket({ 'retired-fixture-v1': { decision: 'approved' } }, fixture, NOW);
    expect(build.issues.map((issue) => issue.code)).toContain('retired-reapproval');
  });

  it('preflight invalid schema is invalid and never mutates input/snapshot', () => {
    const snapshot = createInventorySnapshot();
    const before = JSON.stringify(snapshot);
    expect(preflightRulingPacket({ schemaVersion: 99 }, snapshot).status).toBe('invalid');
    expect(JSON.stringify(snapshot)).toBe(before);
  });
});
