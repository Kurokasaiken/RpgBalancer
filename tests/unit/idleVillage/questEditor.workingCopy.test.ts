import { describe, expect, it } from 'vitest';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { applyEditorOp, createWorkingCopy, derive, inboundRefs, resetToParent, undo } from '@/ui/idleVillage/questEditor';

const wc = () => createWorkingCopy(GOBLIN_SCENARIO);

describe('questEditor workingCopy (PLAN-102 T-2)', () => {
  it('setNodeField edits text tolerantly', () => {
    const w = wc();
    expect(applyEditorOp(w, { kind: 'setNodeField', nodeId: 'gob-accampamento', field: 'title', value: 'X' }).ok).toBe(true);
    expect((derive(w).nodes['gob-accampamento'] as { title: string }).title).toBe('X');
  });
  it('refuses op on missing node — draft unchanged', () => {
    const w = wc();
    const before = JSON.stringify(derive(w));
    expect(applyEditorOp(w, { kind: 'setNodeField', nodeId: 'nope', field: 'title', value: 1 }).ok).toBe(false);
    expect(JSON.stringify(derive(w))).toBe(before);
    expect(w.rejected.length).toBe(1);
  });
  it('removeNode blocks on unresolved inbound refs', () => {
    const w = wc();
    const refs = inboundRefs(GOBLIN_SCENARIO, 'gob-agguato');
    expect(refs.length).toBeGreaterThan(0);
    expect(applyEditorOp(w, { kind: 'removeNode', nodeId: 'gob-accampamento' }).ok).toBe(false);
  });
  it('removeNode with rewires applies atomically', () => {
    const w = wc();
    const refs = inboundRefs(GOBLIN_SCENARIO, 'gob-agguato');
    const target = 'gob-esplora';
    const rewires = refs.map((r) => ({ fromNodeId: r.nodeId, optionIdx: r.optionIdx, to: target }));
    const r = applyEditorOp(w, { kind: 'removeNode', nodeId: 'gob-agguato', rewires });
    expect(r.ok).toBe(true);
    expect(derive(w).nodes['gob-agguato']).toBeUndefined();
    expect(inboundRefs(derive(w), target).length).toBe(refs.length + inboundRefs(GOBLIN_SCENARIO, target).length);
  });
  it('engine-routed ids refuse remove and verdictTable writes', () => {
    const w = wc();
    expect(applyEditorOp(w, { kind: 'removeNode', nodeId: 'gob-accampamento' }).ok).toBe(false);
    expect(applyEditorOp(w, { kind: 'setVerdictRow', nodeId: 'gob-stealth', verdict: 'win', spec: { goto: 'x' } }).ok).toBe(false);
  });
  it('undo + reset revert whole ops', () => {
    const w = wc();
    applyEditorOp(w, { kind: 'setNodeField', nodeId: 'gob-accampamento', field: 'title', value: 'A' });
    applyEditorOp(w, { kind: 'setNodeField', nodeId: 'gob-accampamento', field: 'title', value: 'B' });
    const u = undo(w);
    expect((derive(u).nodes['gob-accampamento'] as { title: string }).title).toBe('A');
    expect(JSON.stringify(derive(resetToParent(w)))).toBe(JSON.stringify(GOBLIN_SCENARIO));
  });
});
