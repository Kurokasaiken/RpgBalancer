/**
 * questJourneyAuthoring.test.ts — PLAN-053 T-004 acceptance battery (§7).
 *
 * The DAG validator gate: every journey-enabled POI (`fasi` authored)
 * must validate with zero errors; the synthetic fixtures pin each §7 rule
 * (pin integrity, start/entry, forward-only cross-fase edges, pin
 * monotonicity, svolgimento boundary reachability, ritorno reachability,
 * waiting-beat discipline, seed-safe ids). The edge probe's
 * `JOURNEY_ROUTE_EXTRAS` is drift-checked against the real router.
 */
import { describe, expect, it } from 'vitest';
import { QUEST_POIS, type QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import type { QuestJourneyFasi } from '@/balancing/config/idleVillage/quests/questPois';
import { scenarioForQuest } from '@/ui/idleVillage/questS1Lab/questOffer';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import { SCENARIO_NODES, START_NODE, type QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import { IMPR002_MINIERA_SCENARIO_AUTHORED } from '@/balancing/config/idleVillage/quests/generation/impr002Miniera';
import {
  createRun,
  matureReady,
  probeQuestJourneyEdges,
  JOURNEY_ROUTE_EXTRAS,
} from '@/ui/idleVillage/questS1Lab/questRun';
import {
  resolveQuestJourneyLaunchSpec,
  validateQuestJourneyDag,
} from '@/ui/idleVillage/quests/questJourneyAuthoring';
import { journeyFasiOf } from '@/ui/idleVillage/quests/questJourney';

const TICKS_PER_DAY = 5;
const NODE_TICKS = 10;

/* ------------------------------------------------------------------ */
/* Synthetic fixtures                                                  */
/* ------------------------------------------------------------------ */

const choice = (id: string, next: string, extra?: Partial<QuestNode>): QuestNode => ({
  id,
  kind: 'choice',
  title: id,
  body: id,
  options: [{ id: `${id}-go`, label: 'Go', detail: '', next }],
  ...extra,
});

const info = (id: string, next: string | undefined, extra?: Partial<QuestNode>): QuestNode => ({
  id,
  kind: 'info',
  title: id,
  body: id,
  ...(next ? { next } : {}),
  ...extra,
});

const end = (id: string, extra?: Partial<QuestNode>): QuestNode => ({
  id,
  kind: 'end',
  title: id,
  body: id,
  ...extra,
});

/**
 * Minimal valid journey scenario: `a-merchant` (andata, pinned) →
 * `s-poi` (svolgimento entry) → `s-end` boundary → `r-road` → `r-end`.
 */
function validNodes(): Record<string, QuestNode> {
  return {
    'a-merchant': choice('a-merchant', 's-poi', { fase: 'andata' }),
    's-poi': choice('s-poi', 's-end'),
    's-end': end('s-end'),
    'r-road': info('r-road', 'r-end', { fase: 'ritorno' }),
    'r-end': end('r-end', { fase: 'ritorno' }),
  };
}

/** Hand-declared edges for the synthetic graph (validator input). */
function edgesOf(nodes: Record<string, QuestNode>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const n of Object.values(nodes)) {
    const t: string[] = [];
    if (n.next) t.push(n.next);
    for (const o of n.options ?? []) t.push(o.next.replace(/^CHECK:/, ''));
    out[n.id] = t;
  }
  return out;
}

const FASI: QuestJourneyFasi = {
  travelDays: 2,
  svolgimentoEntryNodeId: 's-poi',
  pins: { 'a-merchant': 0.2, 'r-road': 0.4, 'r-end': 1 },
};

function dag(nodes: Record<string, QuestNode>, fasi: QuestJourneyFasi = FASI) {
  return validateQuestJourneyDag({
    nodes,
    startNode: 'a-merchant',
    fasi,
    edges: edgesOf(nodes),
    nodeTicks: NODE_TICKS,
    ticksPerDay: TICKS_PER_DAY,
  });
}

/* ------------------------------------------------------------------ */
/* §7 rules — synthetic fixtures                                       */
/* ------------------------------------------------------------------ */

describe('journey DAG validator — §7 rules', () => {
  it('a well-formed journey scenario validates clean', () => {
    const r = dag(validNodes());
    expect(r.errors).toEqual([]);
  });

  it('rejects a pin on a node that does not exist', () => {
    const r = dag(validNodes(), { ...FASI, pins: { ...FASI.pins, ghost: 0.5 } });
    expect(r.errors.some((e) => e.includes("'ghost'"))).toBe(true);
  });

  it('rejects a pin on a svolgimento node', () => {
    const r = dag(validNodes(), { ...FASI, pins: { ...FASI.pins, 's-poi': 0.3 } });
    expect(r.errors.some((e) => e.includes("'s-poi'") && e.includes('fase'))).toBe(true);
  });

  it('rejects node ids containing a colon (beatSeed format)', () => {
    const nodes = validNodes();
    nodes['r:end'] = end('r:end', { fase: 'ritorno' });
    const r = dag(nodes, { ...FASI, pins: { ...FASI.pins, 'r:end': 0.9 } });
    expect(r.errors.some((e) => e.includes("':'"))).toBe(true);
  });

  it('rejects a ritorno startNode and an andata startNode without entry', () => {
    const nodes = validNodes();
    nodes['a-merchant'].fase = 'ritorno';
    expect(dag(nodes).errors.some((e) => e.includes('startNode'))).toBe(true);

    const nodes2 = validNodes();
    const { svolgimentoEntryNodeId, ...fasiNoEntry } = FASI;
    expect(dag(nodes2, fasiNoEntry).errors.some((e) => e.includes('svolgimentoEntryNodeId'))).toBe(true);
  });

  it('rejects backward cross-fase edges (ritorno → svolgimento)', () => {
    const nodes = validNodes();
    nodes['r-road'].next = 's-poi';
    expect(dag(nodes).errors.some((e) => e.includes('cross-fase'))).toBe(true);
  });

  it('rejects andata → ritorno edges (a leg cannot skip the POI)', () => {
    const nodes = validNodes();
    nodes['a-merchant'].options = [{ id: 'x', label: 'x', detail: '', next: 'r-road' }];
    expect(dag(nodes).errors.some((e) => e.includes("'a-merchant' (andata) → 'r-road' (ritorno)"))).toBe(true);
  });

  it('allows andata → svolgimento edges only into the declared entry', () => {
    const nodes = validNodes();
    nodes['s-alt'] = choice('s-alt', 's-end');
    nodes['a-merchant'].options!.push({ id: 'alt', label: 'a', detail: '', next: 's-alt' });
    expect(dag(nodes).errors.some((e) => e.includes("'a-merchant' (andata) → 's-alt'"))).toBe(true);
  });

  it('rejects non-monotonic pins along a leg', () => {
    const nodes = validNodes();
    nodes['r-late'] = info('r-late', 'r-end', { fase: 'ritorno' });
    nodes['r-road'].next = 'r-late';
    const r = dag(nodes, { ...FASI, pins: { ...FASI.pins, 'r-road': 0.6, 'r-late': 0.3 } });
    expect(r.errors.some((e) => e.includes('non monotono'))).toBe(true);
  });

  it('rejects ≥2 pinned waiting beats in andata; warns in ritorno', () => {
    const nodes = validNodes();
    nodes['a-rest'] = choice('a-rest', 'a-merchant', { fase: 'andata' });
    nodes['a-merchant'].options = [{ id: 'x', label: 'x', detail: '', next: 's-poi' }];
    const fasi = { ...FASI, pins: { ...FASI.pins, 'a-rest': 0.5 } };
    expect(dag(nodes, fasi).errors.some((e) => e.includes('waiting beat'))).toBe(true);

    const nodes2 = validNodes();
    nodes2['r-choice'] = choice('r-choice', 'r-choice2', { fase: 'ritorno' });
    nodes2['r-choice2'] = choice('r-choice2', 'r-end', { fase: 'ritorno' });
    nodes2['r-road'].next = 'r-choice';
    const fasi2 = { ...FASI, pins: { ...FASI.pins, 'r-choice': 0.6, 'r-choice2': 0.8 } };
    const r2 = dag(nodes2, fasi2);
    expect(r2.errors).toEqual([]);
    expect(r2.warnings.some((w) => w.includes('waiting beat'))).toBe(true);
  });

  it('rejects a svolgimento node that cannot reach a return anchor', () => {
    const nodes = validNodes();
    nodes['s-lost'] = choice('s-lost', 's-lost2');
    nodes['s-lost2'] = choice('s-lost2', 's-lost');
    nodes['s-poi'].options!.push({ id: 'wander', label: 'w', detail: '', next: 's-lost' });
    expect(dag(nodes).errors.some((e) => e.includes("'s-lost") )).toBe(true);
  });

  it('rejects a ritorno node unreachable from any leg seed', () => {
    const nodes = validNodes();
    /* Unpinned (a pinned ritorno node IS a seed by construction) and
     * pointed at by nothing — the leg can never open it. */
    nodes['r-orphan'] = info('r-orphan', 'r-end', { fase: 'ritorno' });
    const r = dag(nodes);
    expect(r.errors.some((e) => e.includes("'r-orphan'") && e.includes('irraggiungibile'))).toBe(true);
  });

  it('warns when a pending beat outlives the remaining leg', () => {
    const r = dag(validNodes(), { travelDays: 1, svolgimentoEntryNodeId: 's-poi', pins: { 'a-merchant': 0.2, 'r-road': 0.9, 'r-end': 1 } });
    expect(r.warnings.some((w) => w.includes("'r-road'") && w.includes('rimasti'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* §7 gate — the shipped journey-enabled POIs                          */
/* ------------------------------------------------------------------ */

describe('journey DAG validator — shipped POIs (CI gate)', () => {
  it('every POI with authored fasi validates with zero errors', () => {
    const enabled = QUEST_POIS.filter((p) => journeyFasiOf(p) !== null);
    expect(enabled.length).toBeGreaterThan(0);
    for (const poi of enabled) {
      const scenario = scenarioForQuest(poi.questId);
      expect(scenario, `scenario for ${poi.questId}`).toBeDefined();
      const report = validateQuestJourneyDag({
        nodes: scenario!.nodes,
        startNode: scenario!.startNode,
        fasi: journeyFasiOf(poi)!,
        edges: probeQuestJourneyEdges(scenario!.nodes, scenario!.startNode),
        nodeTicks: poi.ticksPerNode,
        ticksPerDay: TICKS_PER_DAY,
      });
      expect(report.errors, `${poi.id}: ${report.errors.join(' | ')}`).toEqual([]);
    }
  });

  it('plan §7 coverage — authored attributions on the named nodes', () => {
    expect(SCENARIO_NODES['viaggio']?.fase).toBe('andata');
    expect(SCENARIO_NODES['incidente']?.fase).toBe('andata');
    expect(GOBLIN_SCENARIO.nodes['gob-ritorno']?.fase).toBe('ritorno');
    expect(GOBLIN_SCENARIO.nodes['gob-agguato']?.fase).toBe('ritorno');
    expect(GOBLIN_SCENARIO.nodes['gob-fine']?.fase).toBe('ritorno');
    expect(ROVINE_SCENARIO.nodes['rv-ritorno-evento']?.fase).toBe('ritorno');
    expect(IMPR002_MINIERA_SCENARIO_AUTHORED.nodes['mi-ritorno']?.fase).toBe('ritorno');
    expect(START_NODE).toBe('viaggio');
  });

  it('the edge probe enumerates real routing — incl. the gob-ritorno router extra', () => {
    const edges = probeQuestJourneyEdges(GOBLIN_SCENARIO.nodes, GOBLIN_SCENARIO.startNode);
    expect(edges['gob-ritorno']).toEqual(expect.arrayContaining(['gob-agguato', 'gob-fine']));
    expect(edges['gob-ultimo-scontro']).toEqual(expect.arrayContaining(['gob-fine']));
    expect(edges['gob-esplora']).toEqual(expect.arrayContaining(['gob-tracce-per', 'gob-tracce-perfor']));
  });
});

/* ------------------------------------------------------------------ */
/* Launch-spec resolver                                                */
/* ------------------------------------------------------------------ */

describe('resolveQuestJourneyLaunchSpec', () => {
  const poi = QUEST_POIS.find((p) => p.id === 'poi-goblin')!;

  it('returns null for a legacy POI (no fasi)', () => {
    const legacy = { ...poi } as QuestPoi;
    delete (legacy as Partial<QuestPoi>).fasi;
    expect(
      resolveQuestJourneyLaunchSpec({
        poi: legacy,
        nodes: GOBLIN_SCENARIO.nodes,
        startNode: GOBLIN_SCENARIO.startNode,
        origin: { x: 0, y: 0 },
        ticksPerDay: TICKS_PER_DAY,
        nodeTicks: NODE_TICKS,
        runSeed: 1,
        engineSchemaVersion: 1,
        scenarioHash: 'h',
        launchedAtTick: 0,
      }),
    ).toBeNull();
  });

  it('builds per-leg beat plans from pins + node fase', () => {
    const spec = resolveQuestJourneyLaunchSpec({
      poi,
      nodes: GOBLIN_SCENARIO.nodes,
      startNode: GOBLIN_SCENARIO.startNode,
      origin: { x: 2120, y: 1414 },
      ticksPerDay: TICKS_PER_DAY,
      nodeTicks: NODE_TICKS,
      runSeed: 42,
      engineSchemaVersion: 1,
      scenarioHash: 'h',
      launchedAtTick: 500,
    })!;
    expect(spec).not.toBeNull();
    expect(spec.fasePlans.andata).toEqual([]);
    expect(spec.fasePlans.ritorno).toEqual(
      expect.arrayContaining([
        { nodeId: 'gob-ritorno', pin: 0.2, kind: 'pending', durationTicks: NODE_TICKS },
        { nodeId: 'gob-fine', pin: 1, kind: 'pending', durationTicks: NODE_TICKS },
      ]),
    );
    expect(spec.svolgimentoEntryNodeId).toBe(GOBLIN_SCENARIO.startNode);
    expect(spec.destination).toEqual({ x: poi.x, y: poi.y });
    expect(spec.travelDays).toBe(2);
  });
});

/* ------------------------------------------------------------------ */
/* JOURNEY_ROUTE_EXTRAS drift guard — drive the REAL router            */
/* ------------------------------------------------------------------ */

describe('JOURNEY_ROUTE_EXTRAS drift guard', () => {
  function matureFromGobRitorno(sterminio: boolean): string {
    const run = createRun({
      party: { members: [{ id: 'm1', name: 'P', role: 'leader', stats: { str: 50, con: 50, agi: 50, perc: 50, int: 50, cha: 50 } }] },
      seed: 1,
      questId: 'goblin',
    });
    if (sterminio) run.flags.push('sterminio');
    run.nodeId = 'gob-ritorno';
    run.frontier = { status: 'pending', startedAt: 0, readyAt: 0 };
    const before = run.visitedNodes.length;
    matureReady(run, 10);
    return run.visitedNodes[before] ?? run.nodeId;
  }

  it('the sterminio router destination is declared in the extras', () => {
    expect(matureFromGobRitorno(false)).toBe('gob-agguato');
    expect(matureFromGobRitorno(true)).toBe('gob-fine');
    expect(JOURNEY_ROUTE_EXTRAS['gob-ritorno']).toEqual(expect.arrayContaining(['gob-fine']));
  });
});
