/**
 * PLAN-134 T-001/T-002 — inventory audit, reconciliation and inventoryRev.
 */
import { describe, expect, it } from 'vitest';
import { LAB_CATALOG } from '@/pages/hud-lab/catalog';
import {
  buildInventoryAudit,
  computeInventoryRev,
  createInventorySnapshot,
  inventoryRevisionPayload,
  sha256Hex,
  type HudLegoInventorySnapshot,
} from '@/pages/hud-lab/lego/inventory';

const cloneSnapshot = (snapshot: HudLegoInventorySnapshot): HudLegoInventorySnapshot => structuredClone(snapshot);

describe('hud LEGO inventory audit (PLAN-134 T-001)', () => {
  it('classifies every piece-ish lab entry exactly once', () => {
    const snapshot = createInventorySnapshot();
    const labPieceish = LAB_CATALOG.filter((entry) => entry.kind === 'piece').map((entry) => entry.id);
    expect(labPieceish.length).toBeGreaterThan(0);
    for (const id of labPieceish) {
      expect(snapshot.labReconciliation[id], `missing reconciliation for ${id}`).toBeTruthy();
    }
  });

  it('has unique valid piece ids, resolvable mappings and no orphan mapping', () => {
    const snapshot = createInventorySnapshot();
    const ids = snapshot.pieces.map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
    const valid = new Set(ids);
    for (const entry of Object.values(snapshot.labReconciliation)) {
      for (const pieceId of entry.pieceIds ?? []) expect(valid.has(pieceId), `${pieceId} from ${entry.labEntryId}`).toBe(true);
    }
    expect(buildInventoryAudit(snapshot).orphanMappings).toEqual([]);
  });

  it('marks unresolved entries as non-rulingable and keeps token/control entries outside piece ruling', () => {
    const snapshot = createInventorySnapshot();
    expect(snapshot.labReconciliation.piastrina.classification).toBe('unresolved');
    expect(snapshot.labReconciliation.piastrina.pieceIds).toBeUndefined();
    expect(snapshot.labReconciliation['cornici-mockup'].classification).toBe('unresolved');
    expect(snapshot.labReconciliation['tokens-hud'].classification).toBe('token-material-reference');
    expect(snapshot.labReconciliation['scroll-band'].classification).toBe('control-pattern-observed');
  });

  it('produces a machine-usable stash/roster/quest coverage matrix with explicit deltas', () => {
    const audit = buildInventoryAudit();
    const surfaces = new Set(audit.coverageMatrix.map((row) => row.surface));
    expect(surfaces).toEqual(new Set(['stash', 'roster', 'quest']));
    const valid = new Set(createInventorySnapshot().pieces.map((piece) => piece.id));
    for (const row of audit.coverageMatrix) {
      expect(row.need.length).toBeGreaterThan(0);
      expect(row.reusablePieceIds.length > 0 || Boolean(row.missingDelta), row.need).toBe(true);
      for (const id of row.reusablePieceIds) expect(valid.has(id), `${row.need}: ${id}`).toBe(true);
    }
    expect(audit.controlPatterns.some((pattern) => pattern.surface === 'stash')).toBe(true);
    expect(audit.controlPatterns.some((pattern) => pattern.surface === 'roster')).toBe(true);
    expect(audit.controlPatterns.some((pattern) => pattern.surface === 'cassetto')).toBe(true);
  });
});

describe('inventoryRev (PLAN-134 T-002)', () => {
  it('uses real SHA-256', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(computeInventoryRev()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for equal inventory input', () => {
    const a = createInventorySnapshot();
    const b = cloneSnapshot(a);
    expect(computeInventoryRev(a)).toBe(computeInventoryRev(b));
    expect(inventoryRevisionPayload(a)).toEqual(inventoryRevisionPayload(b));
  });

  it('changes when canonical piece status changes', () => {
    const before = createInventorySnapshot();
    const after = cloneSnapshot(before);
    after.pieces[0] = { ...after.pieces[0], status: after.pieces[0].status === 'candidate' ? 'baptized' : 'candidate' };
    expect(computeInventoryRev(after)).not.toBe(computeInventoryRev(before));
  });

  it('changes when a lab mapping changes', () => {
    const before = createInventorySnapshot();
    const after = cloneSnapshot(before);
    const mapped = Object.values(after.labReconciliation).find((entry) => (entry.pieceIds?.length ?? 0) > 1);
    expect(mapped).toBeTruthy();
    after.labReconciliation[mapped!.labEntryId] = { ...mapped!, pieceIds: [mapped!.pieceIds![0]] };
    expect(computeInventoryRev(after)).not.toBe(computeInventoryRev(before));
  });

  it('changes when an unresolved classification changes', () => {
    const before = createInventorySnapshot();
    const after = cloneSnapshot(before);
    after.labReconciliation.piastrina = { ...after.labReconciliation.piastrina, reason: 'changed unresolved classification evidence' };
    expect(computeInventoryRev(after)).not.toBe(computeInventoryRev(before));
  });
});
