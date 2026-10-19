/**
 * questJourneyEngine — the PLAN-053 T-003 runtime half of the quest journey
 * (R-226, artifact r011). `questJourney.ts` owns the pure model (geometry,
 * clock arithmetic, fase projection); this module owns the deterministic
 * scheduler that drives a journey-enabled run through its fasi:
 *
 *   andata (village→POI) → svolgimento (scenario engine) → ritorno (POI→village)
 *
 * Design contract (artifact r011, §4):
 * - `advance` is a discrete-event loop with re-discovery: after every state
 *   transition the next event is recomputed on the remaining interval —
 *   opening a pin can create new interruptions (a check that wipes, a
 *   pending that matures at once). No zero-length advances.
 * - `processedUpToTick` is the single authoritative watermark: the only t0
 *   any advance resumes from. `t1 < processedUpToTick` is rejected
 *   (throw — dev/test callers are the only writers); `t1 <=
 *   processedUpToTick` is a side-effect-free no-op.
 * - Parked waiting beats freeze the ROUTE but not the clock: parked ticks
 *   accumulate into `accumulatedParkedTicks`, pending beats keep maturing.
 * - Canonical tie-ordering at a tick: input resolution (host-side) → pin
 *   openings in progression order → pending maturations → terminal effects
 *   → phase boundary → settlement. `resolveJourneyDecision` performs the
 *   input step + the drain-at-T.
 * - Fase completion = route fill 100% AND every beat of the fase resolved.
 *   A pending beat still maturing at fill 100% leaves the run in
 *   `endpointResolving` — derived, never persisted.
 * - Wipe settles immediately (a wiped party never arrives — otherwise the
 *   sequential gate would deadlock); return-with-survivors settles at the
 *   village.
 *
 * The module is DELIBERATELY engine-agnostic: it mutates only
 * `state.journey` (+ the lifecycle fields) and delegates every scenario
 * interaction to injected {@link JourneyEngineOps}, implemented by the host
 * (`questRun.ts`) where the private node machinery lives.
 */
import type {
  JourneyBeatEntry,
  JourneyJournal,
  JourneySnapshot,
  QuestFase,
  WorldPoint,
} from './questJourney';
import { buildJourneyPolyline, totalTravelTicks } from './questJourney';
import type { QuestRunState } from '../questS1Lab/questRun';

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

/** Terminal kinds for a journey run (artifact r011): the POI verdict that
 *  opens ritorno, the arrival that settles, and the wipe that settles in
 *  place. `contentCompleteAtPoi` is the trigger that opens ritorno, not a
 *  settlement. */
export type JourneyTerminal = 'contentCompleteAtPoi' | 'returnWithSurvivors' | 'wiped';

/** Phase-aware lifecycle status reported to consumers (`runPhaseStatus`). */
export type RunPhaseStatus = 'active' | 'returning' | 'settled' | 'wiped';

/**
 * One scheduled travel beat of a fase: where on the route it opens (`pin`,
 * phase-local arc-length fraction), whether it parks the marker (`waiting`
 * = choice/combat) or matures on its own clock (`pending` = info/harm/check),
 * and for pending beats the authored maturation delay
 * (`resolvedAtTick = openedAtTick + durationTicks`).
 */
export interface JourneyBeatPlan {
  /** Scenario node id this beat is bound to. */
  nodeId: string;
  /** Phase-local arc-length fraction in [0,1]. */
  pin: number;
  /** 'waiting' parks the marker until player input; 'pending' never parks. */
  kind: 'waiting' | 'pending';
  /** Pending maturation delay in quest ticks (ignored for waiting). */
  durationTicks: number;
}

/**
 * The launch-time frozen snapshot plus the resolved beat schedule — every
 * field here is written once at launch and never recomputed live
 * (artifact r011 "Frozen at launch").
 */
export interface JourneyRuntimeSnapshot extends JourneySnapshot {
  /** Run seed the beat RNG derives from (`beatSeed(runSeed, nodeId)`). */
  runSeed: number;
  /** `ENGINE_SCHEMA_VERSION` at launch — the hydrate-time shim key. */
  engineSchemaVersion: number;
  /** Content hash of the scenario instance at launch. */
  scenarioHash: string;
  /** Feature flag read once at launch — never re-read for an active run. */
  journeyEnabled: true;
  /** Ordered beat schedules per travel fase (ascending pin). */
  fasePlans: { andata: readonly JourneyBeatPlan[]; ritorno: readonly JourneyBeatPlan[] };
  /** Scenario node id the engine arrives at when svolgimento opens. */
  svolgimentoEntryNodeId: string;
}

/** The `run.journey` carrier attached to a journey-enabled run. */
export interface QuestJourneyRuntime {
  /** Frozen launch data — serialized verbatim with the run. */
  snapshot: JourneyRuntimeSnapshot;
  /** Mutable journal — watermark, beats, park accounting. */
  journal: JourneyJournal;
}

/**
 * Caller-supplied launch contract: everything the runtime freezes. The
 * beat plans are resolved upstream (T-004's DAG attribution for authored
 * scenarios; tests/specs provide them directly).
 */
export interface QuestJourneyLaunchSpec {
  /** Authored duration of BOTH travel fasi in game days (ritorno = andata). */
  travelDays: number;
  /** `dayLengthInTimeUnits` sampled at launch. */
  ticksPerDay: number;
  /** Village anchor in map world-px space (route origin for andata). */
  origin: WorldPoint;
  /** POI position in map world-px space (route destination for andata). */
  destination: WorldPoint;
  /** Optional authored waypoints between origin and destination. */
  waypoints?: readonly WorldPoint[];
  /** Resolved beat schedules per travel fase. */
  fasePlans: { andata: readonly JourneyBeatPlan[]; ritorno: readonly JourneyBeatPlan[] };
  /** Scenario node the engine enters when svolgimento opens. */
  svolgimentoEntryNodeId: string;
  /** Run seed (`state.seed`) — frozen into the beat RNG contract. */
  runSeed: number;
  /** `ENGINE_SCHEMA_VERSION` at launch. */
  engineSchemaVersion: number;
  /** `computeScenarioVersion` of the run's scenario at launch. */
  scenarioHash: string;
  /** Quest tick the run launches at — the journal watermark seed. */
  launchedAtTick: number;
}

/**
 * The host seam: every scenario-facing transition the scheduler needs.
 * Implemented once by `questRun.ts`, which owns the private node machinery
 * (arriveNode/matureNode/submitCommand/endRun) — the engine never reaches
 * into it directly.
 */
export interface JourneyEngineOps {
  /**
   * Open a waiting beat at `tick`: the party reaches a decision/combat
   * node — the run's frontier becomes interactive at `nodeId`. The beat's
   * journal entry is already marked `openedAtTick` by the caller.
   */
  openWaitingBeat(state: QuestRunState, nodeId: string, tick: number): void;
  /**
   * Present a pending beat at open (`tick`): the scene shows now; its
   * authored effects land later at `resolvedAtTick` via
   * {@link JourneyEngineOps.maturePendingBeat}.
   */
  presentPendingBeat(state: QuestRunState, nodeId: string, tick: number): void;
  /**
   * Apply a pending beat's authored effects at maturation (`tick` ==
   * `entry.resolvedAtTick`). May terminal-wipe the run through `endRun`.
   */
  maturePendingBeat(state: QuestRunState, nodeId: string, tick: number): void;
  /**
   * Andata complete: hand control to the scenario engine at the POI
   * (`snapshot.svolgimentoEntryNodeId`). The journal has already switched
   * to `svolgimento` before this call.
   */
  enterSvolgimento(state: QuestRunState, tick: number): void;
  /**
   * Ritorno complete: the party reaches the village — terminal arrival
   * (`returnWithSurvivors`): ends the run on the frozen `verdictAtPoi`.
   */
  arriveHome(state: QuestRunState, tick: number): void;
  /**
   * Resolve the parked waiting beat with a player command at `tick` —
   * the host's normal choice/combat resolution path. `opts` carries the
   * command modifiers (consumable use, armed bag flags).
   */
  resolveWaiting(
    state: QuestRunState,
    nodeId: string,
    optionId: string,
    tick: number,
    opts?: { useConsumable?: boolean; forceDie?: number; armedFlags?: ReadonlySet<string> },
  ): void;
}

/* ------------------------------------------------------------------ */
/* Journal helpers                                                     */
/* ------------------------------------------------------------------ */

/** Travel ticks consumed in the current fase (route-driving clock). */
function consumedTravel(journal: JourneyJournal): number {
  return Math.max(0, journal.processedUpToTick - journal.faseStartedAtTick - journal.accumulatedParkedTicks);
}

/**
 * True while the host frontier is the travel sentinel — a pending frontier
 * that never matures (`travelFrontier`, readyAt = MAX_SAFE_INTEGER). A real
 * pending chain node mid-flight is NOT idle: the boundary must wait for
 * its effects, or a fill that lands mid-maturation would clobber them.
 */
export function frontierIsTravelSentinel(state: QuestRunState): boolean {
  return state.frontier.status === 'pending' && state.frontier.readyAt === Number.MAX_SAFE_INTEGER;
}

/** A beat counts as complete when a waiting beat is resolved or a pending
 *  beat's effects were applied (skipped beats are always complete). */
function beatComplete(beat: JourneyBeatEntry): boolean {
  if (beat.skipped) return true;
  return beat.kind === 'waiting' ? beat.resolvedAtTick !== null : (beat.appliedAtTick ?? null) !== null;
}

/** Fresh journal entries for a fase's beat plans (order = plan order). */
function entriesFor(plans: readonly JourneyBeatPlan[]): JourneyBeatEntry[] {
  return plans.map((p) => ({
    nodeId: p.nodeId,
    pin: p.pin,
    kind: p.kind,
    openedAtTick: null,
    resolvedAtTick: null,
    appliedAtTick: null,
  }));
}

/**
 * Switch the journal to a new fase at `tick`. `initialConsumedTicks` keeps
 * the marker's physical position across an andata→ritorno turnaround (a
 * flee mid-andata re-enters the reversed route already part-way home);
 * beats whose pin is already behind are marked `skipped`.
 */
export function enterJourneyFase(
  runtime: QuestJourneyRuntime,
  fase: QuestFase,
  tick: number,
  initialConsumedTicks = 0,
): void {
  const j = runtime.journal;
  j.currentFase = fase;
  // The consumed clock is derived (processed − faseStart − parked), so an
  // initial offset is expressed by back-dating the fase start.
  j.faseStartedAtTick = tick - Math.max(0, initialConsumedTicks);
  j.accumulatedParkedTicks = 0;
  j.parkedNodeId = null;
  j.parkedAtTick = null;
  j.beats = fase === 'svolgimento' ? [] : entriesFor(runtime.snapshot.fasePlans[fase]);
  if (initialConsumedTicks > 0) {
    const total = totalTravelTicks(runtime.snapshot, runtime.snapshot.ticksPerDay);
    const progress = initialConsumedTicks / total;
    for (const b of j.beats) {
      if (b.pin <= progress) {
        b.openedAtTick = tick;
        b.resolvedAtTick = tick;
        b.appliedAtTick = tick;
        b.skipped = true;
      }
    }
  }
}

/**
 * Build the frozen snapshot + fresh journal for a launch. Beat plans are
 * re-sorted by pin (stable) so the schedule is canonical even if the
 * caller passed authoring order.
 */
export function buildJourneyRuntime(spec: QuestJourneyLaunchSpec): QuestJourneyRuntime {
  const route = buildJourneyPolyline(spec.origin, spec.destination, spec.waypoints ?? []);
  const sortByPin = (plans: readonly JourneyBeatPlan[]) =>
    [...plans].sort((a, b) => a.pin - b.pin);
  const snapshot: JourneyRuntimeSnapshot = {
    travelDays: spec.travelDays,
    ticksPerDay: spec.ticksPerDay,
    route,
    pins: Object.fromEntries(
      [...spec.fasePlans.andata, ...spec.fasePlans.ritorno].map((b) => [b.nodeId, b.pin]),
    ),
    runSeed: spec.runSeed,
    engineSchemaVersion: spec.engineSchemaVersion,
    scenarioHash: spec.scenarioHash,
    journeyEnabled: true,
    fasePlans: { andata: sortByPin(spec.fasePlans.andata), ritorno: sortByPin(spec.fasePlans.ritorno) },
    svolgimentoEntryNodeId: spec.svolgimentoEntryNodeId,
  };
  const runtime: QuestJourneyRuntime = {
    snapshot,
    journal: {
      currentFase: 'andata',
      faseStartedAtTick: spec.launchedAtTick,
      processedUpToTick: spec.launchedAtTick,
      accumulatedParkedTicks: 0,
      parkedNodeId: null,
      beats: [],
    },
  };
  runtime.journal.beats = entriesFor(snapshot.fasePlans.andata);
  return runtime;
}

/* ------------------------------------------------------------------ */
/* Canonical event application at a single tick                        */
/* ------------------------------------------------------------------ */

/** Beat plan lookup for the current fase (durationTicks lives there). */
function planOf(snapshot: JourneyRuntimeSnapshot, fase: 'andata' | 'ritorno', nodeId: string): JourneyBeatPlan | undefined {
  return snapshot.fasePlans[fase].find((p) => p.nodeId === nodeId);
}

/**
 * Apply every event eligible at tick `t`, in the canonical tie-order —
 * pin openings in progression order → pending maturations → terminal
 * effects (host-side) → phase boundary. Loops until quiescent so a
 * transition that creates a new same-tick event (a pending opened with
 * `durationTicks: 0`) is still drained before any advance past `t`.
 *
 * NEVER advances the watermark: callers own `processedUpToTick`.
 */
function processEventsAtTick(state: QuestRunState, t: number, ops: JourneyEngineOps): void {
  const runtime = state.journey;
  if (!runtime) return;
  const j = runtime.journal;
  const total = totalTravelTicks(runtime.snapshot, runtime.snapshot.ticksPerDay);
  for (let steps = 0; steps < MAX_DRAIN_STEPS; steps += 1) {
    if (state.ended || j.currentFase === 'svolgimento') return;
    const consumed = consumedTravel(j);
    let acted = false;

    // (2) Pin openings in progression order — every pin already reached.
    // While parked, `consumed` is frozen: only pins coincident with the
    // park position can still qualify, and the truncation rule says the
    // pin exactly at the park DOES open (it caused the park).
    for (const beat of j.beats) {
      if (beat.openedAtTick !== null || beat.pin * total > consumed) continue;
      if (beat.kind === 'waiting') {
        /* A waiting beat claims the party's single cursor — the frontier.
         * While a chain hop is still in flight (pending mid-maturation,
         * e.g. the ambush damage walking to its choice) the marker has
         * already crossed the pin but the scene cannot interrupt: the
         * opening stays DUE and is retried once the road frees. A second
         * waiting beat arriving while another is parked is a degenerate
         * config (the T-004 validator rejects it) and is skipped rather
         * than deadlocking. */
        if (j.parkedNodeId === null && frontierIsTravelSentinel(state)) {
          beat.openedAtTick = t;
          j.parkedNodeId = beat.nodeId;
          j.parkedAtTick = t;
          ops.openWaitingBeat(state, beat.nodeId, t);
          acted = true;
        } else if (j.parkedNodeId !== null) {
          beat.openedAtTick = t;
          beat.resolvedAtTick = t;
          beat.skipped = true;
          acted = true;
        }
        /* frontier busy on a chain: leave the beat unopened — retry. */
      } else {
        beat.openedAtTick = t;
        const plan = planOf(runtime.snapshot, j.currentFase as 'andata' | 'ritorno', beat.nodeId);
        beat.resolvedAtTick = t + (plan?.durationTicks ?? 0);
        ops.presentPendingBeat(state, beat.nodeId, t);
        acted = true;
      }
      if (state.ended) return;
    }

    // (3) Pending maturations due at or before `t`. The beat's effects run
    // through the frontier (matureNode) — a pending beat can only mature
    // while the party's cursor is on the road (the sentinel). A frontier
    // mid-chain (a spawned hop still maturing, or a parked decision) keeps
    // the beat due; its effects land when the party is back on the road.
    for (const beat of j.beats) {
      if (beat.kind !== 'pending' || beat.openedAtTick === null) continue;
      if ((beat.appliedAtTick ?? null) !== null || beat.resolvedAtTick === null || beat.resolvedAtTick > t) continue;
      if (!frontierIsTravelSentinel(state)) continue;
      ops.maturePendingBeat(state, beat.nodeId, t);
      beat.appliedAtTick = t;
      acted = true;
      if (state.ended) return;
    }

    // (5) Phase boundary: route full AND every beat of the fase resolved
    // AND the frontier is the travel sentinel — a real pending chain node
    // still in flight keeps the fase open until its effects land.
    if (
      j.parkedNodeId === null &&
      frontierIsTravelSentinel(state) &&
      consumed >= total &&
      j.beats.every(beatComplete)
    ) {
      acted = true;
      if (j.currentFase === 'andata') {
        enterJourneyFase(runtime, 'svolgimento', t);
        ops.enterSvolgimento(state, t);
      } else {
        // (6) Settlement trigger: arrival ends the run — the host marks
        // terminalKind/settledAtTick inside arriveHome.
        ops.arriveHome(state, t);
      }
      return;
    }

    if (!acted) return;
  }
  throw new Error(
    `questJourneyEngine: drain at tick ${t} exceeded ${MAX_DRAIN_STEPS} steps — a cycle of zero-duration beats is an authoring error`,
  );
}

/* ------------------------------------------------------------------ */
/* advance — the discrete-event loop                                   */
/* ------------------------------------------------------------------ */

/** Bounded re-discovery guard (dev/test throws; production defers). */
const MAX_DRAIN_STEPS = 256;
const MAX_ADVANCE_ITERATIONS = 4096;

/**
 * Drive the journey clock to `t1` (artifact r011 §4): a discrete-event loop
 * over the current journal — pin crossings, pending maturations, park
 * accounting, fase boundaries — with re-discovery after every transition.
 *
 * The caller supplies ONLY the target; the resume point is always the
 * persisted watermark `processedUpToTick`. During `svolgimento` the
 * scenario engine owns the clock and this only tracks the watermark.
 */
export function advanceJourney(state: QuestRunState, t1: number, ops: JourneyEngineOps): void {
  const runtime = state.journey;
  if (!runtime) return;
  const j = runtime.journal;
  if (t1 < j.processedUpToTick) {
    throw new Error(
      `questJourneyEngine: advance(${t1}) is behind the processed watermark (${j.processedUpToTick}) — callers never supply t0`,
    );
  }
  if (t1 <= j.processedUpToTick || state.ended) return;
  const total = totalTravelTicks(runtime.snapshot, runtime.snapshot.ticksPerDay);

  for (let iterations = 0; iterations < MAX_ADVANCE_ITERATIONS; iterations += 1) {
    if (j.processedUpToTick >= t1) return;
    if (state.ended) return;
    const t = j.processedUpToTick;

    if (j.currentFase === 'svolgimento') {
      // The scenario engine owns this stretch of clock — the watermark
      // follows so a later travel fase resumes with no gap and no replay.
      j.processedUpToTick = t1;
      return;
    }

    if (t < j.faseStartedAtTick) {
      // Dead window before the fase start (the engine entered this fase at
      // a tick ahead of the watermark — e.g. a mid-tick endRun): attribute
      // nothing, just move the watermark to the fase boundary.
      j.processedUpToTick = Math.min(j.faseStartedAtTick, t1);
      continue;
    }

    const consumed = consumedTravel(j);

    // --- Actionable-now discovery: events already due at `t` drain in
    // place (hydrate-safe — a reload mid-schedule re-enters here). A
    // pending maturation due but blocked by a busy frontier (a chain hop
    // mid-flight) is NOT actionable: claiming it now would stall the loop
    // re-draining the same tick — it retries once the road frees.
    const frontierFree = frontierIsTravelSentinel(state);
    let dueNow = false;
    for (const beat of j.beats) {
      if (beat.openedAtTick === null && beat.pin * total <= consumed) {
        /* Pending beats always open (presentation never claims the
         * frontier). Waiting beats claim the single cursor: actionable
         * only when they will actually progress — free frontier → opens;
         * already parked → the degenerate double-park is skipped. A
         * waiting beat due while a chain hop is mid-flight stays DUE. */
        if (beat.kind === 'pending' || j.parkedNodeId !== null || frontierFree) dueNow = true;
      }
      if (
        beat.kind === 'pending' &&
        beat.openedAtTick !== null &&
        (beat.appliedAtTick ?? null) === null &&
        beat.resolvedAtTick !== null &&
        beat.resolvedAtTick <= t &&
        frontierFree
      ) dueNow = true;
    }
    const boundaryDue =
      j.parkedNodeId === null && frontierIsTravelSentinel(state) && consumed >= total && j.beats.every(beatComplete);

    if (dueNow || boundaryDue) {
      processEventsAtTick(state, t, ops);
      continue;
    }

    // --- Earliest FUTURE event on the remaining interval (t, t1].
    let nextEvent: number | null = null;
    for (const beat of j.beats) {
      // Pending maturations are clock-driven — they mature even while
      // parked and while the marker waits at the endpoint.
      if (
        beat.kind === 'pending' &&
        beat.openedAtTick !== null &&
        (beat.appliedAtTick ?? null) === null &&
        beat.resolvedAtTick !== null &&
        beat.resolvedAtTick > t
      ) {
        nextEvent = nextEvent === null ? beat.resolvedAtTick : Math.min(nextEvent, beat.resolvedAtTick);
      }
    }
    if (j.parkedNodeId === null && consumed < total) {
      // Motion events only exist while the marker is free and the route
      // is not yet full: the next pin crossing and the travel end.
      let nextPinPos = Number.POSITIVE_INFINITY;
      for (const beat of j.beats) {
        if (beat.openedAtTick !== null) continue;
        const pos = beat.pin * total;
        if (pos > consumed) nextPinPos = Math.min(nextPinPos, pos);
      }
      if (nextPinPos < Number.POSITIVE_INFINITY) {
        nextEvent = nextEvent === null ? t + (nextPinPos - consumed) : Math.min(nextEvent, t + (nextPinPos - consumed));
      }
      nextEvent = nextEvent === null ? t + (total - consumed) : Math.min(nextEvent, t + (total - consumed));
    }

    if (nextEvent === null || nextEvent > t1) {
      if (j.parkedNodeId !== null) j.accumulatedParkedTicks += t1 - t;
      j.processedUpToTick = t1;
      return;
    }

    if (j.parkedNodeId !== null) j.accumulatedParkedTicks += nextEvent - t;
    j.processedUpToTick = nextEvent;
    processEventsAtTick(state, nextEvent, ops);
  }
  throw new Error(
    `questJourneyEngine: advance exceeded ${MAX_ADVANCE_ITERATIONS} iterations reaching tick ${t1} — event loop did not quiesce`,
  );
}

/* ------------------------------------------------------------------ */
/* Input resolution — drain-at-T                                       */
/* ------------------------------------------------------------------ */

/**
 * Resolve the parked waiting beat with a player command at `nowTick`
 * (artifact r011): immediate park accounting, `parkedNodeId = null`,
 * `processedUpToTick = nowTick`, the host's resolution, then the
 * idempotent drain of every event eligible at T in canonical order —
 * before any advance beyond T. Safe across a reload between resolution
 * and the next advance: the journal is the idempotency key.
 */
export function resolveJourneyDecision(
  state: QuestRunState,
  optionId: string,
  nowTick: number,
  ops: JourneyEngineOps,
  opts?: { useConsumable?: boolean; forceDie?: number; armedFlags?: ReadonlySet<string> },
): void {
  const runtime = state.journey;
  if (!runtime || state.ended) return;
  const j = runtime.journal;
  const nodeId = j.parkedNodeId;
  if (nodeId === null) return;
  if (nowTick < j.processedUpToTick) {
    throw new Error(
      `questJourneyEngine: decision at ${nowTick} is behind the processed watermark (${j.processedUpToTick})`,
    );
  }
  const entry = j.beats.find((b) => b.nodeId === nodeId);
  const parkStart = entry?.openedAtTick ?? j.parkedAtTick ?? nowTick;
  // Only the un-attributed parked tail counts — `advance` may already have
  // folded [parkStart, processedUpToTick] into accumulatedParkedTicks.
  j.accumulatedParkedTicks += Math.max(0, nowTick - Math.max(parkStart, j.processedUpToTick));
  j.parkedNodeId = null;
  j.parkedAtTick = null;
  j.processedUpToTick = nowTick;
  ops.resolveWaiting(state, nodeId, optionId, nowTick, opts);
  if (state.ended) return;
  if (state.frontier.status === 'waiting' && state.nodeId === nodeId) {
    // Multi-turn resolution (combat): the frontier is still on the beat —
    // the marker re-parks and the beat stays unresolved.
    j.parkedNodeId = nodeId;
    j.parkedAtTick = nowTick;
    return;
  }
  // The frontier left the beat node: the beat is resolved; if resolution
  // chained into another waiting node (inherited pin), that node parks
  // the marker where the party stands.
  if (entry) {
    entry.resolvedAtTick = nowTick;
    entry.appliedAtTick = nowTick;
  }
  if (state.frontier.status === 'waiting') {
    j.parkedNodeId = state.nodeId;
    j.parkedAtTick = nowTick;
  }
  processEventsAtTick(state, nowTick, ops);
}

/* ------------------------------------------------------------------ */
/* Lifecycle projections                                               */
/* ------------------------------------------------------------------ */

/**
 * Phase-aware lifecycle status (artifact r011): the single read consumers
 * migrate to — `active` while traveling/at the POI, `returning` while the
 * party walks home, `settled` after arrival, `wiped` on total party loss.
 * `lastFase` reports where the run ended (the report's double verdict).
 */
export function runPhaseStatus(state: QuestRunState): { status: RunPhaseStatus; lastFase: QuestFase | null } {
  const jr = state.journey;
  if (!jr) {
    return {
      status: state.ended ? (state.outcome === 'wipe' ? 'wiped' : 'settled') : 'active',
      lastFase: null,
    };
  }
  if (state.terminalKind === 'wiped' || (state.ended && state.outcome === 'wipe')) {
    return { status: 'wiped', lastFase: state.lastFase ?? jr.journal.currentFase };
  }
  if ((state.settledAtTick ?? null) !== null) {
    return { status: 'settled', lastFase: state.lastFase ?? 'ritorno' };
  }
  if (jr.journal.currentFase === 'ritorno') {
    return { status: 'returning', lastFase: jr.journal.currentFase };
  }
  return { status: 'active', lastFase: jr.journal.currentFase };
}

/**
 * Settlement decision (artifact r011): `null` while the run has no
 * settlement event, else the tick the settlement must commit at —
 * `settledAtTick` (arrival) or `outcomeResolvedAtTick` for a wipe (a wiped
 * party never arrives; settling in place keeps the sequential gate alive).
 * Pure and idempotent: the persisted settlement marker
 * (`settle:<runId>` written by `settleRun`) is what makes repeated calls
 * and hydrates safe — this function only reports.
 */
export function settleIfArrived(state: QuestRunState): { atTick: number } | null {
  if (!state.journey) return null; // legacy runs settle on `ended` — unchanged path
  if (state.terminalKind === 'wiped') {
    const at = state.settledAtTick ?? state.outcomeResolvedAtTick ?? null;
    return at === null ? null : { atTick: at };
  }
  if ((state.settledAtTick ?? null) !== null) return { atTick: state.settledAtTick as number };
  return null;
}
