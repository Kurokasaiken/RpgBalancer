/**
 * questJourneyAuthoring — PLAN-053 T-004: the journey DAG validator and
 * the launch-spec resolver.
 *
 * `validateQuestJourneyDag` enforces the §7 contract on a journey-enabled
 * scenario (one whose POI authors `fasi`):
 *
 *   - every pin key names an existing node, attributed to a travel fase,
 *     with a `:`-free id (the beat seed format is `${runSeed}:${nodeId}`);
 *   - `startNode` is not `ritorno`-attributed; when it is `andata` the
 *     entry into the POI content is `fasi.svolgimentoEntryNodeId`;
 *   - cross-fase edges only ever move FORWARD — andata→svolgimento (and
 *     only into the entry node) or svolgimento→ritorno (a boundary exit);
 *   - pins on one leg are non-decreasing along the leg's own subgraph
 *     (an edge pinned(u)→pinned(v) with pin(v) < pin(u) is an error);
 *   - every reachable svolgimento node can reach a boundary (an `end`
 *     *node or an edge into ritorno) — no content strands the party;
 *   - every ritorno node is reachable from the leg's seeds (its pins and
 *     the boundary exits) through the ritorno subgraph — no road beat is
 *     unreachable;
 *   - waiting-beat discipline: ≥2 pinned waiting beats in andata is an
 *     error, in ritorno a warning (r011 §7);
 *   - a pending pinned beat whose maturation outlives the remaining leg
 *     warns (it would resolve after the boundary).
 *
 * Edge data comes from `probeQuestJourneyEdges` (questRun.ts), which
 * live-drives the real routing where the declared fields are opaque
 * (legacy check switches, the `gob-ritorno` flag router). The validator
 * itself is pure graph work — no engine import, testable on literals.
 */
import type { QuestJourneyFasi, QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { journeyFasiOf } from './questJourney';
import type { QuestFase, WorldPoint } from './questJourney';
import type { QuestNode } from '../questS1Lab/questScenario';
import type { JourneyBeatPlan, QuestJourneyLaunchSpec } from './questJourneyEngine';

/* ------------------------------------------------------------------ */
/* Validator                                                          */
/* ------------------------------------------------------------------ */

/** Input the DAG validator reasons over — all derivable from config. */
export interface JourneyDagInput {
  /** Node map under validation (scenario instance shape). */
  nodes: Record<string, QuestNode>;
  /** Authored scenario entry node id. */
  startNode: string;
  /** The POI's authored journey contract (non-null — caller gated it). */
  fasi: QuestJourneyFasi;
  /** Node-id → destination ids — from `probeQuestJourneyEdges`. */
  edges: Record<string, string[]>;
  /** Authored per-node tick quantum — the pending-beat maturation delay. */
  nodeTicks: number;
  /** `dayLengthInTimeUnits` — for the pending-dominance warning. */
  ticksPerDay: number;
}

/** Diagnostics of one validation pass — errors block, warnings advise. */
export interface JourneyDagReport {
  errors: string[];
  warnings: string[];
}

/** Node kinds that park the marker (player input); the rest are pending. */
const WAITING_KINDS: ReadonlySet<QuestNode['kind']> = new Set(['choice', 'combat']);

/** A node's effective fase — absent `fase` means POI content (svolgimento). */
function nodeFase(node: QuestNode | undefined): QuestFase {
  return node?.fase ?? 'svolgimento';
}

/** Ids reachable from `from` through edges whose endpoints all satisfy `in`. */
function reachableWithin(edges: Record<string, string[]>, from: string, inSet: (id: string) => boolean): Set<string> {
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const cur = stack.pop()!;
    if (!inSet(cur)) continue;
    for (const next of edges[cur] ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return seen;
}

/**
 * Validate one journey-enabled scenario against the §7 contract.
 * Diagnostics are strings (the CI script prints them verbatim); `errors`
 * block the launch, `warnings` are authoring smells worth a look.
 */
export function validateQuestJourneyDag(input: JourneyDagInput): JourneyDagReport {
  const { nodes, startNode, fasi, edges, nodeTicks, ticksPerDay } = input;
  const errors: string[] = [];
  const warnings: string[] = [];
  const pins = fasi.pins ?? {};
  const travelTicks = fasi.travelDays * ticksPerDay;

  /* --- pins: existing node, travel-fase attributed, seed-safe id ------ */
  for (const [nodeId, pin] of Object.entries(pins)) {
    const node = nodes[nodeId];
    if (!node) {
      errors.push(`pin '${nodeId}' non esiste nella mappa nodi`);
      continue;
    }
    if (nodeId.includes(':')) {
      errors.push(`pin '${nodeId}': gli id nodo non possono contenere ':' (formato beatSeed)`);
    }
    const fase = nodeFase(node);
    if (fase === 'svolgimento') {
      errors.push(`pin '${nodeId}' (${pin}): il nodo non è attribuito a una fase di viaggio (fase: ${node.fase ?? 'assente'})`);
    }
  }

  /* --- startNode / svolgimento entry ---------------------------------- */
  const startFase = nodeFase(nodes[startNode]);
  if (startFase === 'ritorno') {
    errors.push(`startNode '${startNode}' è attribuito a ritorno — lo START deve essere andata o svolgimento`);
  }
  const entryNodeId = startFase === 'andata' ? fasi.svolgimentoEntryNodeId : (fasi.svolgimentoEntryNodeId ?? startNode);
  if (startFase === 'andata' && !fasi.svolgimentoEntryNodeId) {
    errors.push(`startNode '${startNode}' è andata — serve fasi.svolgimentoEntryNodeId`);
  } else if (entryNodeId && nodeFase(nodes[entryNodeId]) !== 'svolgimento') {
    errors.push(`svolgimento entry '${entryNodeId}' non è un nodo svolgimento (fase: ${nodes[entryNodeId]?.fase ?? 'mancante'})`);
  }

  /* --- cross-fase edges: forward-only, via the sanctioned doors ------- */
  for (const [from, targets] of Object.entries(edges)) {
    const fromNode = nodes[from];
    if (!fromNode) continue;
    const fromFase = nodeFase(fromNode);
    for (const to of targets) {
      const toNode = nodes[to];
      if (!toNode) continue; // dangling targets are sentinel terminals, not graph errors
      const toFase = nodeFase(toNode);
      if (toFase === fromFase) continue;
      const ok =
        (fromFase === 'andata' && toFase === 'svolgimento' && to === entryNodeId) ||
        (fromFase === 'svolgimento' && toFase === 'ritorno');
      if (!ok) {
        errors.push(
          `edge cross-fase non lecito: '${from}' (${fromFase}) → '${to}' (${toFase})`,
        );
      }
    }
  }

  /* --- pinned monotonicity inside each leg ----------------------------- */
  for (const fase of ['andata', 'ritorno'] as const) {
    const pinned = Object.keys(pins).filter((id) => nodeFase(nodes[id]) === fase);
    const inLeg = (id: string) => nodeFase(nodes[id]) === fase;
    for (const u of pinned) {
      const reached = reachableWithin(edges, u, inLeg);
      for (const v of pinned) {
        if (v === u) continue;
        if (reached.has(v) && (pins[v] as number) < (pins[u] as number)) {
          errors.push(
            `pin non monotono in ${fase}: '${u}' (${pins[u]}) raggiunge '${v}' (${pins[v]})`,
          );
        }
      }
    }

    /* --- waiting-beat discipline (r011 §7) ------------------------------ */
    const waitingPinned = pinned.filter((id) => WAITING_KINDS.has(nodes[id]!.kind));
    if (waitingPinned.length >= 2 && fase === 'andata') {
      errors.push(`andata ha ${waitingPinned.length} waiting beat pinnati (${waitingPinned.join(', ')}) — il viaggio d'andata non può parcheggiare due volte`);
    }
    if (waitingPinned.length >= 2 && fase === 'ritorno') {
      warnings.push(`ritorno ha ${waitingPinned.length} waiting beat pinnati (${waitingPinned.join(', ')}) — accettabile ma verifica il ritmo`);
    }

    /* --- pending dominance vs the remaining leg ------------------------- */
    for (const id of pinned) {
      const node = nodes[id]!;
      if (WAITING_KINDS.has(node.kind)) continue;
      const remaining = (1 - (pins[id] as number)) * travelTicks;
      if (nodeTicks > remaining) {
        warnings.push(
          `beat pending '${id}' (pin ${pins[id]}): matura in ${nodeTicks} tick > ${remaining} tick rimasti di ${fase} — risolverebbe oltre il confine`,
        );
      }
    }

    /* --- reachability of pinned beats inside the leg -------------------- */
    if (fase === 'andata') {
      for (const id of pinned) {
        if (startFase === 'andata' && id === startNode) continue;
        /* Andata beats are schedule-driven: reachability means an intra-leg
         * path exists from the start node (or from the entry of the leg). */
        if (startFase !== 'andata') {
          warnings.push(`beat andata '${id}' senza startNode in andata — si apre al pin ma non è raggiunto dalla catena: verificato solo come beat schedulato`);
        } else if (!reachableWithin(edges, startNode, inLeg).has(id) && id !== startNode) {
          warnings.push(`beat andata pinnato '${id}' non raggiungibile da '${startNode}' dentro la gamba — si aprirà comunque al pin (schedule-driven)`);
        }
      }
    }
  }

  /* --- svolgimento: ≥1 node, every reachable node reaches a boundary --- */
  const isSvolgimento = (id: string) => nodeFase(nodes[id]) === 'svolgimento';
  const svolgimentoReachable = entryNodeId ? reachableWithin(edges, entryNodeId, (id) => id === entryNodeId || isSvolgimento(id) || nodeFase(nodes[id]) === 'ritorno') : new Set<string>();
  const svolgimentoNodes = [...svolgimentoReachable].filter(isSvolgimento);
  if (entryNodeId && svolgimentoNodes.length === 0) {
    errors.push('nessun nodo svolgimento raggiungibile dall’entry');
  }
  const boundaryExits = new Set(
    svolgimentoNodes.filter((id) => {
      const node = nodes[id]!;
      return node.kind === 'end' || (edges[id] ?? []).some((t) => nodes[t] && nodeFase(nodes[t]) === 'ritorno');
    }),
  );
  if (svolgimentoNodes.length > 0 && boundaryExits.size === 0) {
    errors.push('nessuna uscita di confine: lo svolgimento non raggiunge mai un nodo end né un nodo ritorno');
  }
  for (const id of svolgimentoNodes) {
    /* Reverse reachability: does a boundary exit sit downstream of `id`?
     *  Walk forward within svolgimento; a node that cannot hit any exit
     *  strands the party mid-POI. */
    const fwd = reachableWithin(edges, id, isSvolgimento);
    if (![...fwd].some((x) => boundaryExits.has(x)) && !boundaryExits.has(id)) {
      errors.push(`nodo svolgimento '${id}' non raggiunge alcuna ancora di ritorno`);
    }
  }

  /* --- ritorno: every attributed node reachable inside the leg ---------
   * The ritorno leg is SEED-driven, not edge-driven: `enterReturnFase`
   * schedules the pinned ritorno nodes and boundary edges (svolgimento →
   * ritorno) open their target directly. Unpinned ritorno nodes only ever
   * open as chains off an opened ritorno node — so reachability means
   * "reachable from the seeds". */
  const isRitorno = (id: string) => nodeFase(nodes[id]) === 'ritorno';
  const ritornoSeeds = new Set<string>();
  for (const id of svolgimentoNodes) {
    for (const t of edges[id] ?? []) if (nodes[t] && isRitorno(t)) ritornoSeeds.add(t);
  }
  for (const id of Object.keys(pins)) if (isRitorno(id)) ritornoSeeds.add(id);
  const ritornoReachable = new Set<string>(ritornoSeeds);
  for (const e of ritornoSeeds) {
    for (const id of reachableWithin(edges, e, isRitorno)) ritornoReachable.add(id);
  }
  for (const id of Object.keys(nodes).filter(isRitorno)) {
    if (!ritornoReachable.has(id)) {
      errors.push(`nodo ritorno '${id}' irraggiungibile: nessun seed (pin o uscita di confine) lo raggiunge dentro la gamba`);
    }
  }

  return { errors, warnings };
}

/* ------------------------------------------------------------------ */
/* Launch-spec resolver                                                */
/* ------------------------------------------------------------------ */

/** Beat kind from the node kind — the r011 ALPHA rule (waiting parks the
 *  marker; everything else matures on its own clock). */
function beatKindOf(node: QuestNode): JourneyBeatPlan['kind'] {
  return WAITING_KINDS.has(node.kind) ? 'waiting' : 'pending';
}

/**
 * Resolve the authored journey contract of a POI into the frozen launch
 * spec the runtime consumes. Returns `null` for a legacy POI
 * (`fasi === null` sentinel) — callers keep the pre-journey path.
 *
 * Beat plans come from `fasi.pins` + the node-level `fase` attribution:
 * each pin names the node that opens at that arc-length fraction of its
 * leg; unpinned travel nodes inherit the reaching pin via chains (they
 * are not beats). Pending beats mature after `nodeTicks` — the same
 * quantum a normal node window uses, no invented durations.
 */
export function resolveQuestJourneyLaunchSpec(input: {
  /** The POI being launched (fasi + map position). */
  poi: Pick<QuestPoi, 'fasi' | 'x' | 'y'>;
  /** The run's node map (the resolved scenario instance). */
  nodes: Record<string, QuestNode>;
  /** The instance's start node. */
  startNode: string;
  /** Village anchor in world px (route origin). */
  origin: WorldPoint;
  /** `dayLengthInTimeUnits` sampled at launch. */
  ticksPerDay: number;
  /** The run's per-node tick quantum. */
  nodeTicks: number;
  /** Run seed — frozen into the beat RNG contract. */
  runSeed: number;
  /** `ENGINE_SCHEMA_VERSION` at launch. */
  engineSchemaVersion: number;
  /** `computeScenarioVersion` of the run's scenario at launch. */
  scenarioHash: string;
  /** Quest tick the run launches at. */
  launchedAtTick: number;
}): QuestJourneyLaunchSpec | null {
  const fasi = journeyFasiOf(input.poi);
  if (!fasi) return null;
  const plans: { andata: JourneyBeatPlan[]; ritorno: JourneyBeatPlan[] } = { andata: [], ritorno: [] };
  for (const [nodeId, pin] of Object.entries(fasi.pins ?? {})) {
    const node = input.nodes[nodeId];
    const fase = nodeFase(node);
    if (!node || fase === 'svolgimento') continue; // the validator owns the diagnostic
    plans[fase].push({
      nodeId,
      pin,
      kind: beatKindOf(node),
      durationTicks: node.kind === 'choice' || node.kind === 'combat' ? 0 : input.nodeTicks,
    });
  }
  return {
    travelDays: fasi.travelDays,
    ticksPerDay: input.ticksPerDay,
    origin: input.origin,
    destination: { x: input.poi.x, y: input.poi.y },
    ...(fasi.waypoints ? { waypoints: fasi.waypoints } : {}),
    fasePlans: plans,
    /* startNode attributed to andata needs the authored POI entry; the
     *  validator guarantees it exists — the fallback keeps a malformed
     *  config degrading to startNode instead of a crash. */
    svolgimentoEntryNodeId: fasi.svolgimentoEntryNodeId ?? input.startNode,
    runSeed: input.runSeed,
    engineSchemaVersion: input.engineSchemaVersion,
    scenarioHash: input.scenarioHash,
    launchedAtTick: input.launchedAtTick,
  };
}
