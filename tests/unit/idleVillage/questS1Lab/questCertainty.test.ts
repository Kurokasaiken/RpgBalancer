/**
 * questCertainty — PLAN-019-S3 T-1.
 *
 * The certainty matrix the plan mandates: linear, branched without
 * dominator, dead-end, cycle (F6-shaped), optional checkpoint — plus the
 * real goblin/rovine authored graphs. Synthetic scenarios run as `gen`
 * instances with authored `verdictTable`s (engine v2 routing); the authored
 * quests exercise the legacy `applyNodeOutcome` switch, so coverage of both
 * routing regimes is real, not mocked.
 */
import { describe, expect, it } from 'vitest';
import {
  certainChecks,
  exploreScenarioGraph,
  memberReveals,
  planningHints,
} from '@/ui/idleVillage/questS1Lab/questCertainty';
import type { ScenarioInstance } from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabMember, QuestNode, VerdictTable } from '@/ui/idleVillage/questS1Lab/questScenario';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const PARTY: LabMember[] = [
  { id: 'p1', name: 'P1', role: 'leader', stats: { perc: 50, int: 50, str: 50, con: 50, agi: 50, cha: 50 }, hp: 10_000 },
];

let instSeq = 0;
function instance(nodes: Record<string, QuestNode>, startNode: string): ScenarioInstance {
  return {
    instanceId: `qsi-test-${++instSeq}`,
    questId: 'gen',
    scenarioHash: `test-${instSeq}`,
    nodes,
    startNode,
  };
}

/** Full verdict table routing every verdict to `target`. */
function tableTo(target: string): VerdictTable {
  return { else: { goto: target } };
}

/** Verdict table routing win-ish and fail-ish verdicts differently. */
function splitTable(win: string, fail: string): VerdictTable {
  return {
    bigwin: { goto: win },
    win: { goto: win },
    almost: { goto: win },
    else: { goto: fail },
  };
}

const end = (id = 'fine'): QuestNode => ({ id, kind: 'end', title: 'Fine', body: '' });
const choice = (id: string, options: QuestNode['options']): QuestNode => ({
  id, kind: 'choice', title: id, body: '', options,
});
const check = (id: string, verdictTable: VerdictTable, stats: QuestNode['stats'] = ['str']): QuestNode => ({
  id, kind: 'check', title: id, body: '', stats, risk: { wound: 0, death: 0 }, verdictTable,
});
const info = (id: string, next: string): QuestNode => ({ id, kind: 'info', title: id, body: '', next });
const opt = (id: string, next: string) => ({ id, label: id, detail: '', next });

/* ------------------------------------------------------------------ */
/* Matrix                                                             */
/* ------------------------------------------------------------------ */

describe('certainChecks — matrice del piano', () => {
  it('grafo lineare: ogni check è certo', { timeout: 30_000 }, () => {
    const nodes = {
      start: choice('start', [opt('vai', 'CHECK:c1')]),
      c1: check('c1', tableTo('meta')),
      meta: choice('meta', [opt('avanti', 'CHECK:c2')]),
      c2: check('c2', tableTo('fine')),
      fine: end(),
    };
    const r = certainChecks({ questId: 'gen', scenarioInstance: instance(nodes, 'start'), party: PARTY });
    expect(r.truncated).toBe(false);
    expect(r.certain.map((c) => c.nodeId).sort()).toEqual(['c1', 'c2']);
  });

  it('ramificato senza dominatore: solo il check dopo la riconvergenza è certo', { timeout: 30_000 }, () => {
    const nodes = {
      start: choice('start', [opt('sx', 'CHECK:cA'), opt('dx', 'CHECK:cB')]),
      cA: check('cA', tableTo('merge')),
      cB: check('cB', tableTo('merge')),
      merge: choice('merge', [opt('avanti', 'CHECK:c3')]),
      c3: check('c3', tableTo('fine')),
      fine: end(),
    };
    const r = certainChecks({ questId: 'gen', scenarioInstance: instance(nodes, 'start'), party: PARTY });
    expect(r.certain.map((c) => c.nodeId)).toEqual(['c3']);
  });

  it('dead-end: un cammino che chiude il run senza check rende il check incerto', { timeout: 30_000 }, () => {
    const nodes = {
      start: choice('start', [opt('rischio', 'CHECK:c1'), opt('rinuncia', 'rinuncia-info')]),
      'rinuncia-info': info('rinuncia-info', 'fine'),
      c1: check('c1', tableTo('fine')),
      fine: end(),
    };
    const r = certainChecks({ questId: 'gen', scenarioInstance: instance(nodes, 'start'), party: PARTY });
    expect(r.certain).toEqual([]);
  });

  it('ciclo (F6): il check d\u2019ingresso al loop domina, quello interno no', { timeout: 30_000 }, () => {
    const nodes = {
      start: choice('start', [opt('vai', 'CHECK:ingresso')]),
      ingresso: check('ingresso', tableTo('hub')),
      hub: choice('hub', [
        opt('fruga', 'CHECK:fruga'),
        opt('esci', 'fine'),
      ]),
      fruga: check('fruga', tableTo('hub')),
      fine: end(),
    };
    const r = certainChecks({ questId: 'gen', scenarioInstance: instance(nodes, 'start'), party: PARTY });
    expect(r.certain.map((c) => c.nodeId)).toEqual(['ingresso']);
  });

  it('checkpoint opzionale: un check raggiungibile solo da un ramo gated non è certo', { timeout: 30_000 }, () => {
    const nodes = {
      start: choice('start', [
        { ...opt('scava', 'CHECK:profondo'), requiresInfo: 'pista' },
        opt('avanti', 'meta'),
      ]),
      profondo: check('profondo', tableTo('meta')),
      meta: choice('meta', [opt('avanti', 'CHECK:finale')]),
      finale: check('finale', tableTo('fine')),
      fine: end(),
    };
    // 'pista' is never produced → the gated branch is unreachable → `profondo`
    // is simply absent from the graph; `finale` remains certain.
    const r = certainChecks({ questId: 'gen', scenarioInstance: instance(nodes, 'start'), party: PARTY });
    expect(r.certain.map((c) => c.nodeId)).toEqual(['finale']);
  });

  it('verdictTable split: il dominatore vale per tutti i verdetti, non per uno', { timeout: 30_000 }, () => {
    const nodes = {
      start: choice('start', [opt('vai', 'CHECK:c1')]),
      c1: check('c1', splitTable('via-alta', 'via-bassa')),
      'via-alta': info('via-alta', 'fine'),
      'via-bassa': info('via-bassa', 'fine'),
      fine: end(),
    };
    const g = exploreScenarioGraph({ questId: 'gen', scenarioInstance: instance(nodes, 'start'), party: PARTY });
    // Both verdict branches realized → both terminal edges exist.
    expect(g.edges.get('c1')).toEqual(new Set(['via-alta', 'via-bassa']));
    const r = certainChecks({ questId: 'gen', scenarioInstance: instance(nodes, 'start'), party: PARTY });
    expect(r.certain.map((c) => c.nodeId)).toEqual(['c1']);
  });
});

/* ------------------------------------------------------------------ */
/* Real authored graphs — legacy engine routing                         */
/* ------------------------------------------------------------------ */

describe('certainChecks — scenari authored reali', () => {
  it('goblin: la struttura dichiarata dal grafo regge il dominatore', { timeout: 120_000 }, () => {
    const r = certainChecks({ questId: 'goblin' });
    expect(r.truncated).toBe(false);
    expect(r.statesExplored).toBeGreaterThan(10);
    // Whatever the graph yields, every claimed check must be a real goblin
    // check node — and the analysis must terminate within budget.
    const goblinChecks = ['gob-tracce-per', 'gob-tracce-perfor', 'gob-bottino-scelta',
      'gob-accampamento', 'gob-assalto', 'gob-incalzare', 'gob-esplora-extra'];
    for (const c of r.certain) expect(goblinChecks).toContain(c.nodeId);
    console.log('goblin certain:', r.certain.map((c) => c.nodeId), '| states:', r.statesExplored, '| edges:', r.edgesExplored);
  });

  it('rovine: termina e non dichiara check fantasma', { timeout: 60_000 }, () => {
    const r = certainChecks({ questId: 'rovine' });
    expect(r.truncated).toBe(false);
    for (const c of r.certain) expect(c.nodeId.startsWith('rv-')).toBe(true);
    console.log('rovine certain:', r.certain.map((c) => c.nodeId), '| states:', r.statesExplored);
  });
});

/* ------------------------------------------------------------------ */
/* revealAtPlanning + planningHints                                     */
/* ------------------------------------------------------------------ */

describe('revealAtPlanning (D-S3-3)', () => {
  const member = (stat: number): LabMember => ({
    id: 'm', name: 'M', role: 'member',
    stats: { perc: stat, int: 10, str: 10, con: 10, agi: 10, cha: 10 },
  });

  it('soglia derivata: sotto soglia non rivela, a soglia sì', () => {
    const spec = { stat: 'perc' as const, threshold: 60 };
    expect(memberReveals(spec, member(59))).toBe(false);
    expect(memberReveals(spec, member(60))).toBe(true);
    expect(memberReveals(spec, undefined)).toBe(false);
    expect(memberReveals(undefined, member(100))).toBe(false);
  });

  it('planningHints: previewHint sempre noto, revealHint solo se rivelato', () => {
    const nodes: Record<string, QuestNode> = {
      a: { id: 'a', kind: 'check', title: 'a', body: '', previewHint: 'occhio al ponte' },
      b: { id: 'b', kind: 'check', title: 'b', body: '', revealHint: 'la torre dorme' },
      c: { id: 'c', kind: 'info', title: 'c', body: '', previewHint: 'sempre visibile', revealHint: 'segreto' },
    };
    const base = planningHints(nodes, new Set());
    expect(base).toEqual([
      { nodeId: 'a', hint: 'occhio al ponte', revealed: false },
      { nodeId: 'c', hint: 'sempre visibile', revealed: false },
    ]);
    const withReveal = planningHints(nodes, new Set(['b', 'c']));
    expect(withReveal).toContainEqual({ nodeId: 'b', hint: 'la torre dorme', revealed: true });
    expect(withReveal).toContainEqual({ nodeId: 'c', hint: 'segreto', revealed: true });
  });
});
