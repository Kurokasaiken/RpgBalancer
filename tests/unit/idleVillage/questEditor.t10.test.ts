/** PLAN-102 T-10 — permanent regression tests (R-247). */
import { describe, expect, it } from 'vitest';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { applyEditorOp, createWorkingCopy, derive, inboundRefs } from '@/ui/idleVillage/questEditor';
import { validateDraft } from '@/ui/idleVillage/questEditor/validation';
import { buildEditedCandidate, buildEditedExportEnvelope, unwaivedFidelityItems } from '@/ui/idleVillage/questEditor/editedCandidate';
import { parseExportEnvelope } from '@/ui/idleVillage/questGenLab/exportEnvelope';
import { parseQuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

describe('PLAN-102 closure regression', () => {
  it('goblin round-trip: edit→candidate→export→import = valid + hash-consistent', () => {
    const wc = createWorkingCopy(GOBLIN_SCENARIO);
    applyEditorOp(wc, { kind: 'setNodeField', nodeId: 'gob-esplora', field: 'title', value: 'Il campo dei goblin (edited)' });
    const c = buildEditedCandidate(wc, 'authored', 'goblin', ['stashFlags', 'xpAward', 'trofeoPerso', 'trophyGold', 'epilogue'], { 'gob-esplora.body': 'prova IT' });
    const env = buildEditedExportEnvelope(c, validateDraft(derive(wc)));
    const re = parseExportEnvelope(JSON.parse(JSON.stringify(env)));
    expect(re).not.toBeNull();
    expect(re!.generationReceipt.provenance).toBe('edited');
    const sc = parseQuestScenario(re!.scenario);
    expect((sc.nodes['gob-esplora'] as { title: string }).title).toContain('edited');
  });

  it('export refuses an invalid scenario (preflight)', () => {
    const wc = createWorkingCopy(GOBLIN_SCENARIO);
    applyEditorOp(wc, { kind: 'rewireNext', nodeId: 'gob-esplora', optionIdx: 0, to: 'gob-esplora' }); // legal op
    const broken = derive(wc);
    (broken.nodes['gob-bottino'] as { next?: string }).next = 'nodo-fantasma'; // forge dangling outside ops
    const diag = validateDraft(broken);
    expect(diag.dangling.length).toBeGreaterThan(0);
    const c = buildEditedCandidate(wc, 'authored', 'goblin', [], {});
    expect(() => buildEditedExportEnvelope(c, diag)).toThrow(/export refused/);
  });

  it('fork gate (W-04): authored blocks until all manifest items waived', () => {
    expect(unwaivedFidelityItems('authored', 'goblin', new Set()).length).toBe(5);
    expect(unwaivedFidelityItems('authored', 'goblin', new Set(['stashFlags', 'xpAward', 'trofeoPerso', 'trophyGold', 'epilogue'])).length).toBe(0);
    expect(unwaivedFidelityItems('catalog', 'gen-x', new Set()).length).toBe(0);
  });

  it('engine-routed nodes refuse remove/verdictTable (dead-table refusal)', () => {
    const wc = createWorkingCopy(GOBLIN_SCENARIO);
    expect(applyEditorOp(wc, { kind: 'removeNode', nodeId: 'gob-stealth' }).ok).toBe(false);
    expect(applyEditorOp(wc, { kind: 'setVerdictRow', nodeId: 'gob-stealth', verdict: 'win', spec: { goto: 'x' } }).ok).toBe(false);
  });

  it('inbound refs resolve CHECK: prefixed targets', () => {
    const refs = inboundRefs(GOBLIN_SCENARIO, 'gob-stealth');
    expect(refs.length).toBeGreaterThan(0); // 'CHECK:gob-stealth' counts
  });
});
