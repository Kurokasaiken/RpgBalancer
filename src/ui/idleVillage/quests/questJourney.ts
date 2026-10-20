/**
 * questJourney — pure model for the PLAN-053 quest journey fasi (R-226).
 *
 * A journey-enabled run has three temporal fasi: `andata` (village→POI),
 * `svolgimento` (the emergent scenario engine at the POI), `ritorno`
 * (POI→village, same authored duration as andata). This module owns the
 * deterministic, side-effect-free half of the contract — geometry, clock
 * arithmetic, and seeded beat RNG — so T-003's engine integration and
 * every property test share one implementation.
 *
 * Debate-grounded invariants (artifact r011):
 * - One travel clock: `travelDays × ticksPerDay` frozen at launch —
 *   `dayLengthInTimeUnits`, never `msPerDay`/`questTimeScale`.
 * - `processedUpToTick` is the watermark: the only t0 of any advance;
 *   caller-supplied t0s are never accepted.
 * - `faseProgress` includes parked time (pure clock); `routeProgress`
 *   excludes it (the marker does not move while parked).
 * - Pending beats mature on `resolvedAtTick = openedAtTick +
 *   authoredDurationTicks`, independent of marker position and parking.
 * - Beat RNG: `seedString = "${runSeed}:${nodeId}"` hashed to 32-bit,
 *   then the same mulberry32 derivation as the scenario engine
 *   (`questRun.roll` = `mulberry32(seed + callIndex)`).
 */
import type { QuestJourneyFasi, QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

/** The three temporal fasi of a journey-enabled quest run. */
export type QuestFase = 'andata' | 'svolgimento' | 'ritorno';

/** A point in map world-px space (same space as `QuestPoi.x/y`). */
export interface WorldPoint {
  x: number;
  y: number;
}

/**
 * A route polyline with precomputed cumulative arc lengths — built once
 * per resolved route and memoized; `pointAt` interpolates over them.
 */
export interface JourneyPolyline {
  /** Ordered vertices: origin, waypoints, destination. */
  points: readonly WorldPoint[];
  /** `cumulativeLengths[i]` = arc length from the origin to `points[i]`;
   *  same length as `points`, `cumulativeLengths[0] === 0`, last entry
   *  equals `totalLength`. */
  cumulativeLengths: readonly number[];
  /** Total arc length of the polyline — always > 0 (degenerate routes
   *  are rejected at build time). */
  totalLength: number;
}

/**
 * One authored travel beat's journal entry. `kind` is recorded at open
 * time: `waiting` frontiers (choice/combat) park the marker, `pending`
 * beats mature on their own clock and never park.
 */
export interface JourneyBeatEntry {
  /** Scenario node id this beat is bound to. */
  nodeId: string;
  /** Arc-length fraction in the phase-local progress space [0,1]. */
  pin: number;
  /** 'waiting' parks the marker at open; 'pending' matures on its own clock. */
  kind: 'waiting' | 'pending';
  /** Quest tick the marker reached the pin — null while unopened. For a
   *  waiting frontier this is also `parkStartTick` (the wait begins at
   *  open). */
  openedAtTick: number | null;
  /** Quest tick the beat resolved — null while unresolved. For pending
   *  beats this is the SCHEDULED maturation (`openedAtTick +
   *  authoredDurationTicks`), fixed at open time; `appliedAtTick` records
   *  when the effects actually landed (the two coincide on the happy path,
   *  differ across a hydrate between schedule and application). */
  resolvedAtTick: number | null;
  /** Quest tick the pending beat's effects were applied — null until the
   *  scheduled `resolvedAtTick` is reached (waiting beats resolve
   *  atomically at `resolvedAtTick` and never set this). The drain/journal
   *  authority for "this beat's effects already landed". */
  appliedAtTick?: number | null;
  /** Authored pin already behind the marker at fase entry (e.g. a flee
   *  mid-andata that enters ritorno past some return beats): the beat is
   *  marked resolved without ever opening — `skipped` records why. */
  skipped?: boolean;
}

/**
 * Mutable journey journal — the persisted half of the run's travel
 * state (artifact r011 "journal mutabile", the non-frozen list).
 * Counters are fase-scoped: a fase transition resets `faseStartedAtTick`
 * and `accumulatedParkedTicks`.
 */
export interface JourneyJournal {
  /** Fase the run is currently in. */
  currentFase: QuestFase;
  /** Quest tick the current fase started at. */
  faseStartedAtTick: number;
  /** Watermark: the boundary up to which time has been attributed
   *  (travel or park). The only t0 any `advance` may resume from —
   *  never a caller-supplied value. */
  processedUpToTick: number;
  /** Σ parked intervals inside the current fase. */
  accumulatedParkedTicks: number;
  /** Node id of the waiting frontier currently parking the marker, or
   *  null when the marker is free to move. A chained node without its own
   *  beat entry can hold the park — then {@link parkedAtTick} is the only
   *  park-start record. */
  parkedNodeId: string | null;
  /** Quest tick the current park began — set/cleared with `parkedNodeId`.
   *  For beat-bound parks it equals the beat's `openedAtTick`. */
  parkedAtTick?: number | null;
  /** Travel beats of the current fase (opened or still scheduled). */
  beats: JourneyBeatEntry[];
}

/**
 * The launch-time frozen snapshot (artifact r011 "Frozen at launch"):
 * resolved once, never recomputed live.
 */
export interface JourneySnapshot {
  /** Authored outbound/return duration in game days (ritorno = andata). */
  travelDays: number;
  /** `dayLengthInTimeUnits` sampled at launch — never re-read live. */
  ticksPerDay: number;
  /** Resolved route polyline (village→POI with authored waypoints). */
  route: JourneyPolyline;
  /** Authored pins: scenario nodeId → phase-local arc-length fraction. */
  pins: Readonly<Record<string, number>>;
}

/**
 * Pure projection returned by `faseAt` — the single read the map layer,
 * HUD chips and selectors consume (artifact r011 contract).
 */
export interface FaseView {
  /** Current fase. */
  fase: QuestFase;
  /** Ticks elapsed inside the current fase — includes parked time. */
  faseElapsedTicks: number;
  /** Temporal progress of the fase (elapsed / totalTravelTicks for
   *  travel fasi — clock-pure, includes parked time). `null` in
   *  svolgimento: the denominator is engine-owned and emergent — never
   *  fabricate a ratio that can regress. */
  faseProgress: number | null;
  /** Geometric position on the route [0,1] — excludes parked time. */
  routeProgress: number;
  /** A waiting frontier holds the marker. */
  parked: boolean;
  /** A waiting frontier awaits player input (implies `parked`). */
  pendingDecision: boolean;
  /** Marker at fill 100% waiting on an unresolved opened beat —
   *  distinct from `parked`; never both true (parked wins). */
  endpointResolving: boolean;
}

/* ------------------------------------------------------------------ */
/* Journey detection (the `fasi === null` legacy sentinel)             */
/* ------------------------------------------------------------------ */

/**
 * The authored journey contract of a POI, or `null` when absent — the
 * legacy sentinel: a POI without `fasi` keeps pre-journey behaviour
 * (strictly additive schema, PLAN-053 §8).
 */
export function journeyFasiOf(poi: Pick<QuestPoi, 'fasi'>): QuestJourneyFasi | null {
  return poi.fasi ?? null;
}

/** Total authored ticks of one travel fase — the shared denominator of
 *  `faseProgress` and `routeProgress` for andata/ritorno. */
export function totalTravelTicks(fasi: Pick<QuestJourneyFasi, 'travelDays'>, ticksPerDay: number): number {
  return fasi.travelDays * ticksPerDay;
}

/* ------------------------------------------------------------------ */
/* Route geometry                                                      */
/* ------------------------------------------------------------------ */

const dist = (a: WorldPoint, b: WorldPoint): number => Math.hypot(b.x - a.x, b.y - a.y);

/**
 * Builds the route polyline `from → waypoints → to` with cumulative arc
 * lengths. Rejects degenerate chains: fewer than 2 effective points,
 * consecutive duplicate points / zero-length segments, and any waypoint
 * coincident with an endpoint — validation is hard, never a silent fix.
 */
export function buildJourneyPolyline(
  from: WorldPoint,
  to: WorldPoint,
  waypoints: readonly WorldPoint[] = [],
): JourneyPolyline {
  const points = [from, ...waypoints, to];
  const cumulativeLengths: number[] = [0];
  for (let i = 1; i < points.length; i += 1) {
    const len = dist(points[i - 1], points[i]);
    if (len <= 0) {
      throw new Error(
        `questJourney: degenerate route — zero-length segment at index ${i} ` +
          `(${points[i - 1].x},${points[i - 1].y})→(${points[i].x},${points[i].y})`,
      );
    }
    cumulativeLengths.push(cumulativeLengths[i - 1] + len);
  }
  return { points, cumulativeLengths, totalLength: cumulativeLengths[cumulativeLengths.length - 1] };
}

/** Deterministic unit hash in [0, 1) for the route meander (no `Math.random`: a frozen route must replay). */
function unit(seed: number, salt: number): number {
  let h = Math.imul((seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Intermediate points that make a journey wind like a path on foot instead of a ruler line:
 * a lateral offset (sum of two slow waves, zero at both ends) sampled densely so the
 * polyline reads as a smooth curve. Pure and seeded, so the frozen route replays identically.
 * Amplitude is a fraction of the straight distance (capped), never touching the endpoints.
 */
export function meanderWaypoints(from: WorldPoint, to: WorldPoint, seed: number, samples = 72): WorldPoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0 || samples < 1) return [];
  const nx = -dy / length;
  const ny = dx / length;
  const amp = Math.min(length * 0.085, 70);
  const side = unit(seed, 1) < 0.5 ? -1 : 1;
  const phase1 = unit(seed, 2) * Math.PI * 2;
  const phase2 = unit(seed, 3) * Math.PI * 2;
  const bends = 1.1 + unit(seed, 4) * 0.5; // between ~1.1 and ~1.6 full waves
  const points: WorldPoint[] = [];
  for (let i = 1; i <= samples; i += 1) {
    const t = i / (samples + 1);
    const envelope = Math.sin(Math.PI * t) ** 0.8;
    const wave = 0.8 * Math.sin(bends * Math.PI * 2 * t + phase1) + 0.3 * Math.sin(bends * 1.7 * Math.PI * 2 * t + phase2);
    const off = side * amp * envelope * wave;
    points.push({ x: from.x + dx * t + nx * off, y: from.y + dy * t + ny * off });
  }
  return points;
}

/**
 * Interpolates the world-px point at arc-length fraction `progress`
 * (clamped to [0,1]) along the route — monotone non-decreasing in
 * progress; `pointAt(route, 0)` is the origin, `pointAt(route, 1)` the
 * destination.
 */
export function pointAt(route: JourneyPolyline, progress: number): WorldPoint {
  const target = Math.min(Math.max(progress, 0), 1) * route.totalLength;
  const { points, cumulativeLengths } = route;
  let i = 1;
  while (i < cumulativeLengths.length - 1 && cumulativeLengths[i] < target) i += 1;
  const segStart = cumulativeLengths[i - 1];
  const segLen = cumulativeLengths[i] - segStart;
  const t = segLen > 0 ? (target - segStart) / segLen : 0;
  const a = points[i - 1];
  const b = points[i];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * The same polyline traversed backwards — the ritorno route
 * (`ritorno(t) = andata(1−t)` reversal symmetry is a tested invariant).
 */
export function reversedRoute(route: JourneyPolyline): JourneyPolyline {
  const points = [...route.points].reverse();
  const cumulativeLengths = route.cumulativeLengths.map((c) => route.totalLength - c).reverse();
  return { points, cumulativeLengths, totalLength: route.totalLength };
}

/* ------------------------------------------------------------------ */
/* Clock arithmetic                                                    */
/* ------------------------------------------------------------------ */

/**
 * Travel ticks actually consumed inside the current fase — elapsed from
 * the fase start boundary minus parked time
 * (`consumedTravel = processedUpToTick − faseStartedAtTick −
 * accumulatedParkedTicks`, artifact r011 doppia misura del tempo).
 */
export function travelTicksConsumed(journal: Pick<JourneyJournal, 'processedUpToTick' | 'faseStartedAtTick' | 'accumulatedParkedTicks'>): number {
  return journal.processedUpToTick - journal.faseStartedAtTick - journal.accumulatedParkedTicks;
}

/**
 * Pure projection of the authoritative journey state — `faseAt`
 * (artifact r011). Reads snapshot + journal, never mutates: the map
 * layer, HUD chips and selectors all consume this single view.
 */
export function faseAt(snapshot: JourneySnapshot, journal: JourneyJournal): FaseView {
  const faseElapsedTicks = journal.processedUpToTick - journal.faseStartedAtTick;
  const isTravel = journal.currentFase !== 'svolgimento';
  const total = totalTravelTicks({ travelDays: snapshot.travelDays }, snapshot.ticksPerDay);
  const consumed = travelTicksConsumed(journal);
  const faseProgress = isTravel ? Math.min(1, faseElapsedTicks / total) : null;
  const routeProgress = isTravel ? Math.min(1, consumed / total) : 1;
  const parked = journal.parkedNodeId !== null;
  const parkedBeat = parked ? journal.beats.find((b) => b.nodeId === journal.parkedNodeId) : undefined;
  const pendingDecision = parked && (parkedBeat === undefined || parkedBeat.kind === 'waiting');
  // "Complete" mirrors the engine's beatComplete(): a pending beat is done
  // only when its effects landed (appliedAtTick — resolvedAtTick is the
  // schedule, set at open); a waiting beat resolves atomically on input.
  const beatDone = (b: JourneyBeatEntry) =>
    b.skipped === true ||
    (b.kind === 'waiting' ? b.resolvedAtTick !== null : (b.appliedAtTick ?? null) !== null);
  const endpointResolving =
    !parked &&
    routeProgress >= 1 &&
    journal.beats.some((b) => b.openedAtTick !== null && !beatDone(b));
  return {
    fase: journal.currentFase,
    faseElapsedTicks,
    faseProgress,
    routeProgress,
    parked,
    pendingDecision,
    endpointResolving,
  };
}

/* ------------------------------------------------------------------ */
/* Seeded beat RNG (same derivation as the scenario engine)            */
/* ------------------------------------------------------------------ */

/**
 * mulberry32 — the same PRNG the scenario engine uses
 * (`questRun.roll` = `mulberry32(state.seed + state.rngCalls)`). Kept
 * inline so this pure model has no import edge into the engine; the
 * algorithm itself is the contract (artifact r011 fixes the format).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit — the fixed string→seed hash for beat seed strings. */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * 32-bit beat seed: `fnv1a32("${runSeed}:${nodeId}")` — the format is
 * fixed by artifact r011. Rejects a nodeId containing `:` so the seed
 * separator can never be corrupted silently (the T-004 DAG validator
 * bans `:` in authored nodeIds outright).
 */
export function beatSeed(runSeed: number, nodeId: string): number {
  if (nodeId.includes(':')) {
    throw new Error(`questJourney: nodeId must not contain ':' (beat seed separator) — got "${nodeId}"`);
  }
  return fnv1a32(`${runSeed}:${nodeId}`);
}

/**
 * The `callIndex`-th deterministic draw in [0,1) of a beat —
 * `mulberry32(beatSeed + callIndex)`, mirroring the engine's
 * `mulberry32(seed + rngCalls)` derivation. Pure: callers track the
 * call index in the beat journal, never a shared counter.
 */
export function beatDraw(seed: number, callIndex: number): number {
  return mulberry32(seed + callIndex)();
}
