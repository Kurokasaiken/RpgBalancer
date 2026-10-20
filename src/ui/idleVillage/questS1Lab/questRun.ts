/**
 * questRun — run engine for the S1 lab quest «La cassa delle sementi».
 *
 * Quest-specific state machine, deliberately NOT a general engine.
 * Implements the Director-approved risk model (desiderata rev.2):
 * verdict → per-slot wound/death risk, bodyguard interception,
 * 5% death save, wipe = lose everything, leader alive = reward.
 */

import { DEFAULT_QUEST_SKILL_CHECK_CONFIG } from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { QUEST_STASH, resolveStashLoadout } from '@/balancing/config/idleVillage/quests/questStash';
import { defaultQuestItems, QUEST_FLAG_TO_ITEM } from '@/balancing/config/idleVillage/quests/questItems';
import { PARTY_PRESETS, PRIMARY_STATS, SCENARIO_NODES, START_NODE } from './questScenario';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { localizeNodes } from '@/balancing/config/idleVillage/quests/questContentLocale';
import { engineText } from './questEngineText';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import { GOBLIN_PRESETS, ROVINE_PRESETS } from './questLabPresets';
import type {
  ArmRoll,
  GotoSpec,
  LabMember,
  LabStat,
  OutcomeCond,
  OutcomeSpec,
  PartyPreset,
  QuestNode,
  VarOp,
  Verdict,
} from './questScenario';
import type { SettlementMarker } from '../quests/questSettlement';
import {
  advanceJourney,
  buildJourneyRuntime,
  enterJourneyFase,
  resolveJourneyDecision,
} from '../quests/questJourneyEngine';
import type {
  JourneyEngineOps,
  JourneyTerminal,
  QuestJourneyLaunchSpec,
  QuestJourneyRuntime,
} from '../quests/questJourneyEngine';
import type { QuestFase } from '../quests/questJourney';

/** The authored S1 lab quests. 'cassa' = infiltration (agi/perc,
 *  alertness states); 'rovine' = attrition gauntlet (str/con, days & HP);
 *  'goblin' = combat quest (str, positional targeting, HP pools).
 *  'gen' = generated-quest profile (PLAN-026): no authored nodes of its own —
 *  every 'gen' run executes a `ScenarioInstance` under generic-objective
 *  semantics (objectiveDone + living leader → reward). */
export type QuestId = 'cassa' | 'rovine' | 'goblin' | 'gen';

interface QuestDef {
  nodes: Record<string, QuestNode>;
  presets: PartyPreset[];
  primaryStats: readonly LabStat[];
  startNode: string;
}

const QUESTS: Record<QuestId, QuestDef> = {
  cassa: {
    nodes: SCENARIO_NODES,
    presets: PARTY_PRESETS,
    primaryStats: PRIMARY_STATS,
    startNode: START_NODE,
  },
  rovine: {
    nodes: ROVINE_SCENARIO.nodes,
    presets: ROVINE_PRESETS,
    primaryStats: ROVINE_SCENARIO.primaryStats,
    startNode: ROVINE_SCENARIO.startNode,
  },
  goblin: {
    nodes: GOBLIN_SCENARIO.nodes,
    presets: GOBLIN_PRESETS,
    primaryStats: GOBLIN_SCENARIO.primaryStats,
    startNode: GOBLIN_SCENARIO.startNode,
  },
  /* Generated-quest profile: empty by contract — nodes, startNode and
   * primaryStats always arrive frozen inside the run's ScenarioInstance. */
  gen: { nodes: {}, presets: [], primaryStats: [], startNode: '' },
};

/* ------------------------------------------------------------------ */
/* Scenario instances (PLAN-019-S2.3) — a run may execute a scaled copy  */
/* of the authored nodes produced by `resolveQuestOffer`. The instance  */
/* nodes live in a process-level registry keyed by `instanceId`; the    */
/* run state carries only the id (cheap for `structuredClone` in Monte  */
/* Carlo), the save payload carries the instance itself so a reloaded   */
/* run re-registers it and never reads the current config (frozen       */
/* values contract).                                                    */
/* ------------------------------------------------------------------ */

/**
 * A scaled node map for one resolved offer. `nodes` is a deep-transformed
 * copy of `QUESTS[questId].nodes` — never mutate it; the engine and the
 * Monte Carlo read it exactly like the authored map.
 */
export interface ScenarioInstance {
  /** Registry key — `qsi-<hash>` of the transformed content. */
  instanceId: string;
  questId: QuestId;
  /** `computeScenarioVersion` of the BASE scenario the instance derives
   *  from — provenance only; the frozen instance travels with the save. */
  scenarioHash: string;
  nodes: Record<string, QuestNode>;
  /**
   * Own entry node — absent on scaled copies of authored scenarios (they
   * share `QUESTS[questId].startNode`); generated scenarios carry theirs.
   */
  startNode?: string;
  /** Run-start twist arming rolls (PLAN-026) — frozen into the instance. */
  armRolls?: ArmRoll[];
  /** Initial numeric vars for the run state (PLAN-026 engine v2). */
  initialVars?: Record<string, number>;
  /** Declared primary stats (generated scenarios — drives the preview's
   *  "via maestra" marking; authored quests read QUESTS[questId] instead). */
  primaryStats?: LabStat[];
}

const SCENARIO_INSTANCES = new Map<string, ScenarioInstance>();

/** Register an instance (idempotent — same id wins the first write) and
 *  return it. Called by `resolveQuestOffer`, `createRun`, and the reload
 *  path that rehydrates a persisted run. */
export function registerScenarioInstance(instance: ScenarioInstance): ScenarioInstance {
  if (!SCENARIO_INSTANCES.has(instance.instanceId)) SCENARIO_INSTANCES.set(instance.instanceId, instance);
  return SCENARIO_INSTANCES.get(instance.instanceId)!;
}

/** Registry lookup — `undefined` for unknown ids (callers fall back to the
 *  authored map: a run without a registered instance is by definition a
 *  legacy run on the base scenario — declared migration). */
export function scenarioInstanceById(instanceId: string): ScenarioInstance | undefined {
  return SCENARIO_INSTANCES.get(instanceId);
}

/**
 * The resolved-offer record frozen INTO the run (PLAN-019-S2.3): every
 * external input that produced the run's `ScenarioInstance`, so the run
 * uses only these values — never the current config.
 */
export interface ResolvedOfferRecord {
  offerSchemaVersion: number;
  /** POI the offer came from. */
  poiId: string;
  /** Instance registry key the run's nodes come from. */
  instanceId: string;
  /** `computeScenarioVersion` of the base scenario — provenance. */
  scenarioHash: string;
  /** World-scaling multipliers applied to the whitelisted fields. */
  scales: { dangerScale: number; rewardScale: number };
  /** Derived band ids — `danger` = «hypothesis on the reference party». */
  bandIds: { danger: string; rewardTier: string };
  /** Signals the resolution read — `daysPlayed` fixed at resolve time. */
  signals: { daysPlayed: number };
  /** Nominal quest reward ALREADY resolved (integer) — the settlement pays
   *  this, never a recomputation (S2.5). */
  rewardResolved: number;
  /** Day index the offer was resolved at — provenance/staleness marker. */
  resolvedAtDay: number;
}

/** The active quest's node map: the run's ScenarioInstance when the run
 *  was launched on one (S2.3), else the authored map (legacy/lab path —
 *  declared migration for pre-instance runs). */
export function nodesFor(state: QuestRunState): Record<string, QuestNode> {
  /* Authored prose follows the content locale (R-234): the engine copies node text into its records
   * from here, so this is the one place the overlay has to reach. English returns the same object. */
  if (state.scenarioInstanceId) {
    const inst = SCENARIO_INSTANCES.get(state.scenarioInstanceId);
    if (inst) return localizeNodes(inst.nodes, state.questId);
  }
  return localizeNodes(QUESTS[state.questId].nodes, state.questId);
}

/** Five-verdict scale, reusing the Astrolabe vocabulary — the type lives in
 *  questScenario (content side) and is re-exported here for engine callers. */
export type { Verdict };

export type QuestOutcome = 'running' | 'reward' | 'survived' | 'fled' | 'wipe';

export interface RuntimeMember extends LabMember {
  hp: number;
  maxHp: number;
  wounded: boolean;
  dead: boolean;
}

export interface LogEntry {
  kind:
    | 'NODE'
    | 'CHOICE'
    | 'CHECK'
    | 'WOUND'
    | 'DEATH'
    | 'DEATH_SAVE'
    | 'INTERCEPT'
    | 'INFO'
    | 'LOOT'
    | 'HARM'
    | 'RETREAT'
    | 'QUEST_END';
  text: string;
}

export interface QuestRunState {
  seed: number;
  rngCalls: number;
  /** Which authored quest this run is playing. */
  questId: QuestId;
  presetId: string;
  nodeId: string;
  party: RuntimeMember[];
  gold: number;
  /** Elapsed quest days — the ruins quest's visible cost currency. */
  days: number;
  /** Gold value of the treasure in hand (ruins quest) — the stake shown at
   *  the checkpoint, reducible by trap damage. */
  bottinoOro: number;
  loot: string[];
  info: string[];
  flags: string[];
  /** Derived: campoSveglio applies the difficulty penalty to checks. */
  alarm: boolean;
  objectiveDone: boolean;
  ended: boolean;
  outcome: QuestOutcome;
  /** What the last resolution produced — shown to the player before the next node. */
  lastEvent: string;
  /** Last resolved check — drives the astrolabe cinematic overlay in the lab UI. */
  lastCheck?: ResolvedCheck;
  /** All checks resolved by the latest player action, in order — the UI plays
   *  each cinematic in sequence instead of showing only the last one. */
  checkQueue: ResolvedCheck[];
  log: LogEntry[];
  /* ---- Goblin quest (PLAN-022) ---------------------------------------- */
  /** Current turn inside a 'combat' node (1-based once fighting). */
  combatTurn: number;
  /** Enemies still standing in the active combat. */
  goblinLeft: number;
  /** Push-your-luck turns spent looting after the objective (F6). */
  exploreTurn: number;
  /** XP awarded at run end — the goblin quest always pays XP. */
  xp: number;
  /* ---- Presentation contracts (PLAN-023) ------------------------------ */
  /** Monotonic counter naming each queued resolution (`chk-N`). */
  checkSeq: number;
  /** Monotonic counter sequencing applied harm events. */
  harmSeq: number;
  /** Harms applied since the last drain — collected into the owning
   *  ResolvedCheck (or `recentHarms` for check-less beats) at finalize. */
  pendingHarms: HarmEvent[];
  /** Harms of the latest player action NOT owned by a check (ambush flat
   *  damage, travel incidents, attrition) — the UI plays them as an ambient
   *  beat, then clears. */
  recentHarms: HarmEvent[];
  /* ---- Temporal frontier (PLAN-025 T-004, desiderata v27) --------------- */
  /** Schema stamp — persisted runs with a different value are re-migrated or
   *  discarded, never reinterpreted. */
  engineSchemaVersion: number;
  /** Bumped on every committed frontier advance; presentation projections key
   *  on it and are discarded when it does not match. */
  frontierVersion: number;
  /** Frontier contract: 'waiting' = the node needs player input (choice,
   *  combat turn); 'pending' = a timed node maturing toward `readyAt`.
   *  Ticks are caller-supplied (game clock on /game, 0 = instant elsewhere). */
  frontier: { status: 'waiting' | 'pending'; startedAt: number; readyAt: number };
  /** Caller-tick duration of one maturable node (info/harm). 0 = instant:
   *  legacy callers keep the old auto-chain behaviour via `matureReady`. */
  nodeTicks: number;
  /** Node ids in the order they were entered — append-only traversal history
   *  (revisits included, e.g. the F6 loot loop). The theatre adapter renders
   *  resolved nodes from this, never from the graph (PLAN-025 T-006). */
  visitedNodes: string[];
  /* ---- Overlay identity (PLAN-040 T-003a) ------------------------------- */
  /** Monotonic visit counter — bumped once per node entry (one per
   *  `visitedNodes` push, revisits included). Overlay controllers tell a
   *  check is "settled" (its presentation window is over) when
   *  `check.visitSeq < cursorVisitSeq` — immune to graph loops, unlike
   *  queue positions or beat indices. */
  cursorVisitSeq: number;
  /** High-water mark of check sequences whose outcome no longer needs
   *  surfacing (toast dismissed, or settled history from before the overlay
   *  era). Persisted; hydration takes `max(persisted, highestSettled)` and
   *  never lowers it. */
  dismissedUpTo: number;
  /* ---- Resolved offer (PLAN-019-S2.3) -------------------------------- */
  /** Registry key of the ScenarioInstance this run executes — absent on
   *  legacy/lab runs (authored map, declared migration). */
  scenarioInstanceId?: string;
  /** Caller tick the run was launched at (S2.4 D-J — the halo's elapsed
   *  clock). Absent on legacy/lab runs started before the field existed —
   *  declared fallback: `frontier.startedAt` at load (the halo
   *  underestimates elapsed on those runs only). */
  launchedAtTick?: number;
  /** The frozen resolved offer — scales, signals, reward, band ids at
   *  launch time. The settlement reads `rewardResolved` from here (S2.5). */
  resolvedOffer?: ResolvedOfferRecord;
  /* ---- Settlement journal (PLAN-019-S2.5) ------------------------------ */
  /** Persistent settlement marker: `settling` = intent persisted, effects
   *  being applied; `settled` = consequences landed exactly once. Absent on
   *  a live run; absent on legacy terminal runs = not yet settled (the next
   *  settle pass converges them). `inExpedition` releases on `settled`. */
  settlement?: SettlementMarker;
  /* ---- Declarative outcomes (PLAN-026, engine v2) ---------------------- */
  /** Numeric run vars — the `you`/`rival`/`goal` counters declarative
   *  outcomes read and write. Absent on legacy persisted runs (the
   *  interpreter treats a missing map as all-zeroes). */
  vars?: Record<string, number>;
  /* ---- Epilogue record (PLAN-019-S4 T-2) ------------------------------- */
  /** Engine flags spent during the run — consumables used, bag options
   *  consumed. Append-only record for the return report's «spesi e
   *  distrutti» section; absent on legacy persisted runs (treated empty). */
  consumablesUsed?: string[];
  /* ---- Quest journey (PLAN-053 T-003, artifact r011) ------------------- */
  /** Journey runtime (frozen snapshot + mutable journal) — present only on
   *  journey-enabled runs (POI with `fasi`); absent = legacy lifecycle. */
  journey?: QuestJourneyRuntime;
  /** Tick the outcome resolved: end of svolgimento (POI verdict frozen) or
   *  a wipe in any fase. Distinct from {@link settledAtTick}: a returning
   *  party has a verdict but is not home yet. */
  outcomeResolvedAtTick?: number | null;
  /** First tick the run can settle: ritorno arrival (fill 100% + beats
   *  resolved) or `outcomeResolvedAtTick` on a wipe — a wiped party never
   *  arrives, so it settles in place or the sequential gate deadlocks. */
  settledAtTick?: number | null;
  /** Typed terminal: `contentCompleteAtPoi` (opens ritorno),
   *  `returnWithSurvivors` (arrival settles), `wiped`. */
  terminalKind?: JourneyTerminal | null;
  /** Fase the run ended in — the report's double verdict (success at POI
   *  ≠ success home). */
  lastFase?: QuestFase | null;
  /** The verdict frozen at svolgimento end (or the latest non-wipe outcome
   *  during travel, e.g. a flee). Awarded at arrival — party state (wounds,
   *  deaths) stays mutable until then. */
  verdictAtPoi?: QuestOutcome | null;
  /** Transient current quest tick — refreshed by every engine entry point
   *  (submitCommand/matureNode/arriveNode/journey ops); read by `endRun`
   *  for the journey lifecycle ticks. Persisted harmlessly; never a t0. */
  nowTick?: number;
}

/** A resolved check shown to the player as an astrolabe cinematic. */
export interface ResolvedCheck {
  /** Unique id within the run (`chk-N`) — keys the presentation timeline so
   *  replays/StrictMode re-effects stay idempotent. */
  id: string;
  title: string;
  verdict: Verdict;
  /** Success bound after clamps — the canonical `s` the roll is tested against. */
  score: number;
  /** The D100 result (1-100). */
  rollPct: number;
  /** Worst harm the check inflicted — the astrolabe paints it in the fail zones. */
  harm: 'none' | 'wound' | 'death';
  /** Node base risk, passed to the astrolabe so wound/death bands stay proportional. */
  woundPct: number;
  deathPct: number;
  /** What this verdict caused: authored consequence + physical harms, shown
   *  under the cinematic verdict once the roll resolves (Director 2026-10-06). */
  outcomeText?: string;
  /** The check node's transit line — shown while the astrolabe spins, as the
   *  cinematic context of the attempt (Director flavor-layer probe 2026-10-08). */
  transit?: string;
  /** Authored per-verdict flavor — what the result *felt like*, kept separate
   *  from `outcomeText` (which stays the mechanical consequence). */
  flavor?: string;
  /* ---- Presentation contract (PLAN-023) ------------------------------- */
  /** Structured harms applied by this resolution — the presentation plays
   *  them on the formation HUD instead of parsing the log. */
  harms: HarmEvent[];
  /** Log lines describing the harms (log drawer + aria-live only). */
  harmLines: string[];
  /** The subset of `harmLines` that narrate a death — kind-derived, so the
   *  presentation can paint fatal lines without matching prose (R-135). */
  deathLines?: string[];
  /** Non-harm consequence lines (loot, flags, kills…) — the authored part of
   *  the outcome, shown on the verdict card without duplicating harms. */
  authoredText: string;
  /** memberId → chance-per-hit % at resolution time — the HUD renders this
   *  snapshot, never recomputing `positionalWeights` itself. */
  exposure: Record<string, number>;
  /** Enemies killed by this resolution (combat turns only). */
  kills?: number;
  /* ---- Overlay identity (PLAN-040 T-003a) ------------------------------- */
  /** Run-scoped resolution sequence — strictly monotonic and unique for the
   *  whole run (never reused after queue trims or graph loops). Allocated
   *  atomically with the check's creation from the run-level `checkSeq`
   *  counter; for records written by this schema it equals the N in `id`. */
  checkSeq: number;
  /** `cursorVisitSeq` value of the visit during which this check resolved —
   *  the check is settled once `visitSeq < run.cursorVisitSeq`. Stamped in
   *  the same state mutation as the resolution, so a crash between resolve
   *  and cursor advance can never invent a settled check. */
  visitSeq: number;
  /** Position within the committing action's check batch (queue order at
   *  push time — the queue resets per command). Debug/dedupe aid. */
  beatIndex: number;
}

/* ------------------------------------------------------------------ */
/* Seeded RNG (mulberry32) — deterministic per seed + call count.      */
/* ------------------------------------------------------------------ */

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

/** Draw the next uniform [0,1) value; mutates rngCalls so runs stay deterministic per seed. */
export function roll(state: QuestRunState): number {
  state.rngCalls += 1;
  return mulberry32(state.seed + state.rngCalls)();
}

/* ------------------------------------------------------------------ */
/* Tunables — mock values, all provisional and easy to tune.            */
/* ------------------------------------------------------------------ */

export const TUNE = {
  deathSaveChance: 0.05,
  woundedRiskBonus: 5, // pp added to wound+death risk when already wounded
  winRiskMod: -5, // win/bigwin reduce wound & death risk
  incidentChance: 0.25,
  incidentWoundHpLoss: 2,
  woundHpLoss: 3,
  hp: 10,
  alarmDifficultyBonus: 10, // pp the party score loses while alarm is up
  bigwinBand: 5, // lowest N rolls of the D100 = triumph
  almostBand: 5, // N rolls just past the success bound = near-miss
  /* ---- Rovine quest: days & stakes ---------------------------------------
   * Time is the visible cost; the treasure's gold value is the stake the
   * checkpoint shows before the push-your-luck. */
  rovineBaseDays: 4,
  rovineWoundedRecoveryDays: 3,
  treasureMin: 80,
  treasureSpan: 80, // 80–159 gold rolled at the take
  deepChamberMin: 60,
  deepChamberSpan: 61, // 60–120 gold
  woundedManSale: 50, // the coagulo sells for more than it's worth
  woundedManRide: 20, // carrying him earns a future favor, cashed now in gold
  maxAutoSteps: 64, // hard cap on auto-resolved node chains (check/info/harm): an authored cycle degrades to a terminal state instead of a stack overflow
  /* ---- Goblin quest (PLAN-022) — placeholders, MC calibration pending --- */
  goblinCheckDifficulty: 20, // subtracted from the party score: best FOR 70 → ~50% combat bound (Director calibration 2026-10-06)
  ambushFlatDamage: 5, // dry damage to every member at the ambush's start
  ambushWorsenedBonus: 5, // extra hit damage when the pursuit failed
  ambushMiteBonus: -5, // F7 last-stand hit modifier when the ambush is mild (let them flee / pursuit «almost»). agguatoMite was dead code until R-097.
  ambushPeggioreFlatBonus: 0, // extra flat ambush damage when pursuit failed (R-097: rejected — toll covers it)
  ambushPeggioreExtraHits: 0, // extra counterattack hits at the last stand when pursuit failed (R-097: rejected — C4 added brutality for marginal effect)
  /* F5 pursuit toll moved to authored data: gob-incalza-check.upfrontDamage
     (R-097 v2) — the preview reads the same field, single source of truth. */
  exploreBaseDamage: 5, // F6: turn N costs 5·N HP, positional target
  exploreLootGold: 8, // gold found per winning F6 turn
  trofeoGold: 50, // trophy → gold conversion on return to town
  goblinXp: 40, // XP always awarded (non-wipe endings)
};

/**
 * Canonical clamps + epicfail tail (questSkillCheckConfig.backgroundResolution).
 * NOTE: the lab's bigwin/almost bands are FLAT (TUNE.*Band = 5 rolls each),
 * per the Director's 5-lowest / 5-past / 5-highest rule — the canonical spec
 * uses a bigwin fraction of the success band and a wider near-miss band.
 */
const CHECK_BANDS = DEFAULT_QUEST_SKILL_CHECK_CONFIG.backgroundResolution;

/** Per-slot extra risk (percentage points) on top of the node's base. */
export const SLOT_RISK: Record<string, { wound: number; death: number }> = {
  bodyguard: { wound: 10, death: 5 }, // exposed role
  leader: { wound: -5, death: -1 }, // protected position
  member: { wound: 0, death: 0 },
};

/* ------------------------------------------------------------------ */
/* Goblin quest (PLAN-022): positional slot targeting + HP pools        */
/* ------------------------------------------------------------------ */

/**
 * Positional target profile by number of LIVING members (Director rule):
 * the risk lives at the back — 1→100, 2→20/80, 3→0/20/80, 4→0/0/20/80.
 * `turn` applies the combat escalation: after T1 the rear loses 10pp to the
 * second/third slots; after T2 it loses 10pp more to the first/second —
 * T1 `0/0/20/80` → T2 `0/5/25/70` → T3+ `5/10/25/60` (stable past T3,
 * placeholder values pending MC calibration).
 */
export function positionalWeights(aliveCount: number, turn = 0): number[] {
  const base: Record<number, number[]> = { 1: [100], 2: [20, 80], 3: [0, 20, 80], 4: [0, 0, 20, 80] };
  const w = [...(base[Math.min(Math.max(aliveCount, 1), 4)] ?? [0, 0, 20, 80])];
  while (w.length < aliveCount) w.unshift(0);
  /** Shift 10pp off the last slot into the given positions (skipped when the
   *  formation is too thin — escalation is authored for a 4-slot party). */
  const shift = (to: number[]) => {
    const idxs = to.filter((i) => i < w.length - 1);
    if (idxs.length === 0 || w.length < 3) return;
    w[w.length - 1] -= 10;
    idxs.forEach((i) => (w[i] += 10 / idxs.length));
  };
  if (turn >= 2) shift([1, 2]);
  if (turn >= 3) shift([0, 1]);
  return w.map((v) => Math.max(0, v));
}

/**
 * Pick a living member by the positional profile. `exclude` holds ids already
 * hit this turn — the same member can never take two hits in one turn.
 */
function pickPositionalTarget(
  state: QuestRunState,
  exclude: Set<string>,
  turn = 0,
): RuntimeMember | null {
  const alive = state.party.filter((m) => !m.dead);
  const w = positionalWeights(alive.length, turn);
  const cand = alive.map((m, i) => ({ m, w: w[i] })).filter((c) => !exclude.has(c.m.id));
  if (cand.length === 0) return null;
  const total = cand.reduce((s, c) => s + c.w, 0);
  let r = roll(state) * (total > 0 ? total : cand.length);
  for (const c of cand) {
    r -= total > 0 ? c.w : 1;
    if (r < 0) return c.m;
  }
  return cand[cand.length - 1].m;
}

/**
 * Deal `amount` HP damage to a member: surviving damage marks them wounded;
 * 0 HP = death (Director rule). No instant-death rolls here — HP only.
 */
/** Record an applied harm into the pending collector — every code path that
 *  changes a member's HP/wounded/dead state reports here so the presentation
 *  can replay it (PLAN-023 presented-vs-committed contract). */
function recordHarm(
  state: QuestRunState,
  memberId: string,
  amount: number,
  kind: HarmEvent['kind'],
  hpBefore: number,
  hpAfter: number,
  source?: string,
): void {
  state.harmSeq += 1;
  state.pendingHarms.push({ seq: state.harmSeq, memberId, amount, kind, hpBefore, hpAfter, source });
}

/** Log sink: the engine's own line, in the content locale (English: untouched — R-234, T-A13b). */
function pushLog(state: QuestRunState, entry: LogEntry): void {
  state.log.push({ ...entry, text: engineText(entry.text) });
}

function applyHpDamage(state: QuestRunState, target: RuntimeMember, amount: number, source?: string): void {
  const hpBefore = target.hp;
  target.hp -= amount;
  if (target.hp <= 0) {
    target.hp = 0;
    target.dead = true;
    pushLog(state, {
      kind: 'DEATH',
      text: `${target.name} falls, and does not get back up${source ? ` — at «${source}»` : ''}.`,
    });
    recordHarm(state, target.id, amount, 'death', hpBefore, 0, source);
    return;
  }
  target.wounded = true;
  // The wound line reads the *state*, not the number: who is close to the
  // edge must be visible in the prose, not only in the HP chip.
  const frac = target.hp / target.maxHp;
  const line =
    frac < 0.2
      ? `${target.name} holds on only because there is nothing else to do`
      : frac < 0.35
        ? `${target.name} staggers: blood on their side`
        : frac <= 0.7
          ? `${target.name} bends, then straightens up`
          : `${target.name} grits their teeth and stays standing`;
  pushLog(state, { kind: 'HARM', text: `${line} (−${amount} HP).` });
  recordHarm(state, target.id, amount, 'harm', hpBefore, target.hp, source);
}

/** Deal flat damage to one positional target (base profile, no escalation). */
function positionalDamage(state: QuestRunState, amount: number, source?: string): void {
  const target = pickPositionalTarget(state, new Set());
  if (target) applyHpDamage(state, target, amount, source);
}

/** Move pending harms onto the last queued resolution — call when the harms
 *  were generated by that check's own resolution (incl. wipe exits taken
 *  before the normal finalize path). */
function drainHarmsIntoLastCheck(state: QuestRunState): void {
  const last = state.checkQueue[state.checkQueue.length - 1];
  if (last) last.harms.push(...state.pendingHarms.splice(0));
  else state.recentHarms.push(...state.pendingHarms.splice(0));
}

/** Move pending harms to the ambient bucket — harms with no owning check
 *  (ambush flat damage, travel incidents, attrition) surface as their own
 *  presentation beat instead of polluting an unrelated check. */
function drainHarmsToAmbient(state: QuestRunState): void {
  state.recentHarms.push(...state.pendingHarms.splice(0));
}

/** memberId → chance-per-hit % for a given positional profile turn — the
 *  UI renders this snapshot and never recomputes `positionalWeights`. */
function exposureSnapshot(state: QuestRunState, turn: number): Record<string, number> {
  const alive = state.party.filter((m) => !m.dead);
  const w = positionalWeights(alive.length, turn);
  const out: Record<string, number> = {};
  alive.forEach((m, i) => {
    out[m.id] = w[i] ?? 0;
  });
  return out;
}

/** Exposure of the NEXT incoming hit for the formation HUD: the upcoming
 *  combat turn's escalated profile mid-fight, the base profile elsewhere. */
export function currentExposure(state: QuestRunState): Record<string, number> {
  const node = nodesFor(state)[state.nodeId];
  const inCombat = node?.kind === 'combat' && !combatDone(state, node) && !state.ended;
  const turn = inCombat && node?.combat?.escalateProfile ? state.combatTurn + 1 : 0;
  return exposureSnapshot(state, turn);
}

/** Counterattack hits the NEXT combat turn will carry — the only honest
 *  enemy "intent" the engine has (spec-constant, knowable pre-click). */
export function nextCombatHits(state: QuestRunState): number {
  const node = nodesFor(state)[state.nodeId];
  if (node?.kind !== 'combat' || !node.combat || state.ended) return 0;
  const turn = state.combatTurn + 1;
  return (
    (node.combat.escalateProfile ? (turn >= 3 ? 2 : 1) : 1) +
    (state.flags.includes('agguatoPeggiore') ? TUNE.ambushPeggioreExtraHits : 0)
  );
}

/* ------------------------------------------------------------------ */
/* Check resolution                                                     */
/* ------------------------------------------------------------------ */

export const STAT_LABELS: Record<LabStat, string> = {
  perc: 'Perception',
  int: 'Intelligence',
  str: 'Strength',
  con: 'Constitution',
  agi: 'Agility',
  cha: 'Charisma',
};

/** Lucide icon ids per lab stat — resolved through `getStatIconComponent`. */
export const STAT_ICONS: Record<LabStat, string> = {
  str: 'axe',
  con: 'shield',
  agi: 'wind',
  perc: 'sun',
  int: 'book',
  cha: 'crown',
};

/**
 * Group check score: best living member per stat, averaged.
 * Composition matters because different approaches use different stats.
 */
export function groupScore(state: QuestRunState, stats: LabStat[]): number {
  const alive = state.party.filter((m) => !m.dead);
  if (alive.length === 0 || stats.length === 0) return 0;
  const total = stats.reduce(
    (sum, s) => sum + Math.max(...alive.map((m) => m.stats[s])),
    0,
  );
  const score = total / stats.length;
  return state.alarm ? score - TUNE.alarmDifficultyBonus : score;
}

/**
 * Verdict from a D100 die against the success bound — the Director's flat
 * 5/5/5 rule: the 5 lowest rolls are bigwin, the 5 rolls just past the bound
 * are almost, the top tail (r ≥ epicFailThreshold = 96) is epicfail.
 * Epicfail is checked first, mirroring the canonical resolver.
 */
function verdictFromRoll(die: number, successBound: number): Verdict {
  if (die >= CHECK_BANDS.epicFailThreshold) return 'epicfail';
  if (die <= TUNE.bigwinBand) return 'bigwin';
  if (die <= successBound) return 'win';
  if (die <= successBound + TUNE.almostBand) return 'almost';
  return 'fail';
}

/** Success bound clamped to the canonical floor/ceiling. */
export function clampSuccessBound(score: number): number {
  return Math.min(CHECK_BANDS.successCeiling, Math.max(CHECK_BANDS.successFloor, score));
}

/** A rolled harm intent — what the risk table *could* inflict before
 *  interception, death saves and verdict adjustments turn it into applied
 *  harm. Internal; the public applied record is `HarmEvent`. */
interface HarmRoll {
  memberId: string;
  kind: 'wound' | 'death';
  /** This slot's declared death band (pp) for the check — gates the epicfail
   *  wound→death upgrade so no death can occur where M% was shown as 0. */
  deathBand: number;
}

/**
 * An applied physical harm — the structured record the UI animates
 * (floaters, ghost HP, delta chips). Emitted by every code path that wounds
 * or kills a member: check risk rolls, positional damage, counterattacks,
 * ambushes, travel incidents. `kind`: 'harm' = HP damage survived,
 * 'wound' = wound status (small HP loss), 'death' = member died.
 */
export interface HarmEvent {
  /** Monotonic per-run sequence — stable keys/order for the presentation. */
  seq: number;
  memberId: string;
  amount: number;
  kind: 'harm' | 'wound' | 'death';
  hpBefore: number;
  hpAfter: number;
  source?: string;
}

/**
 * Cover (D1, PLAN-019-S4 T-5): the pp deltas packed cover items grant every
 * OTHER living member while the bearer stands. In the party-level bag there
 * is no per-member assignment — the **leader** is the designated bearer
 * (the required quest slot, the standard-bearer): if he falls, the aura
 * falls with him; he never benefits from his own standard. Deltas are read
 * off the packed flags through the item catalog — any future
 * `coverRiskDelta` flag item works without touching the engine.
 */
export function coverDeltaFor(
  state: QuestRunState,
  memberId: string,
): { wound: number; death: number } {
  const bearer = state.party.find((m) => m.role === 'leader' && !m.dead);
  if (!bearer || bearer.id === memberId) return { wound: 0, death: 0 };
  let wound = 0;
  let death = 0;
  for (const flag of state.flags) {
    const itemId = QUEST_FLAG_TO_ITEM.get(flag);
    const cover = itemId ? defaultQuestItems[itemId]?.coverRiskDelta : undefined;
    if (!cover) continue;
    wound += cover.injuryChance ?? 0;
    death += cover.deathChance ?? 0;
  }
  return { wound, death };
}

/**
 * Roll per-slot harm for a skill check.
 * Bodyguard rule (rev.2): while a living bodyguard exists, ALL harms rolled
 * on other members are redirected to the bodyguard — even several in one check.
 * Death save (5%) turns any death outcome into a wound.
 * Director rule 2026-10-03: a death names its cause — the check that inflicted it.
 */
function applyHarm(
  state: QuestRunState,
  harms: HarmRoll[],
  interceptable: boolean,
  sourceTitle?: string,
): HarmRoll['kind'][] {
  const applied: HarmRoll['kind'][] = [];
  const bodyguard = state.party.find((m) => m.role === 'bodyguard' && !m.dead);
  for (const harm of harms) {
    let target = state.party.find((m) => m.id === harm.memberId);
    if (!target || target.dead) continue;
    if (interceptable && bodyguard && target.id !== bodyguard.id) {
      pushLog(state, {
        kind: 'INTERCEPT',
        text: `${bodyguard.name} steps in and takes the blow meant for ${target.name}.`,
      });
      target = bodyguard;
    }
    if (harm.kind === 'death') {
      // Death save — 5%: survives, wounded.
      if (roll(state) < TUNE.deathSaveChance) {
        const hpBefore = target.hp;
        target.wounded = true;
        pushLog(state, {
          kind: 'DEATH_SAVE',
          text: `${target.name} is down… and gets back up. Death save succeeded.`,
        });
        recordHarm(state, target.id, 0, 'wound', hpBefore, target.hp, sourceTitle);
        applied.push('wound');
        continue;
      }
      const hpBefore = target.hp;
      target.dead = true;
      target.hp = 0;
      pushLog(state, {
        kind: 'DEATH',
        text: `${target.name} dies${sourceTitle ? ` — at «${sourceTitle}»` : ''}.`,
      });
      recordHarm(state, target.id, hpBefore, 'death', hpBefore, 0, sourceTitle);
      applied.push('death');
    } else {
      const hpBefore = target.hp;
      target.wounded = true;
      target.hp = Math.max(1, target.hp - TUNE.woundHpLoss);
      pushLog(state, { kind: 'WOUND', text: `${target.name} is wounded.` });
      recordHarm(state, target.id, hpBefore - target.hp, 'wound', hpBefore, target.hp, sourceTitle);
      applied.push('wound');
    }
  }
  return applied;
}

/**
 * Roll harm for every living member against a check's risk table — one
 * independent D100 per slot (death band, then wound band), matching the
 * canonical per-member risk model of mission_planner_math_spec §harm.
 * @returns the worst harm actually suffered, for the astrolabe cinematic.
 */
function rollCheckHarms(
  state: QuestRunState,
  node: QuestNode,
  verdict: Verdict,
): 'none' | 'wound' | 'death' {
  const base = node.risk ?? { wound: 0, death: 0 };
  const harms: HarmRoll[] = [];
  for (const m of state.party) {
    if (m.dead) continue;
    const slot = SLOT_RISK[m.role];
    /* Cover is snapshotted at roll time: a bearer downed ON this check
     *  still covered it — the standard stood when the blow landed. */
    const cover = coverDeltaFor(state, m.id);
    let wound = base.wound + slot.wound + cover.wound;
    let death = base.death + slot.death + cover.death;
    if (m.wounded) {
      wound += TUNE.woundedRiskBonus;
      death += TUNE.woundedRiskBonus;
    }
    if (verdict === 'win' || verdict === 'bigwin') {
      wound += TUNE.winRiskMod;
      death += TUNE.winRiskMod;
    }
    const r = roll(state) * 100;
    const deathBand = Math.max(0, death);
    if (r < deathBand) harms.push({ memberId: m.id, kind: 'death', deathBand });
    else if (r < deathBand + Math.max(0, wound)) harms.push({ memberId: m.id, kind: 'wound', deathBand });
  }
  // bigwin: downgrade every death to wound. epicfail: upgrade wounds to
  // deaths — but ONLY inside the declared band (Director rule 2026-10-03):
  // where the slot's death risk was shown as 0, an epicfail cannot kill.
  const adjusted = harms.map((h) =>
    verdict === 'bigwin' && h.kind === 'death'
      ? { ...h, kind: 'wound' as const }
      : verdict === 'epicfail' && h.kind === 'wound' && h.deathBand > 0
        ? { ...h, kind: 'death' as const }
        : h,
  );
  const applied = applyHarm(state, adjusted, true, node.title);
  return applied.includes('death') ? 'death' : applied.includes('wound') ? 'wound' : 'none';
}

/* ------------------------------------------------------------------ */
/* Engine                                                               */
/* ------------------------------------------------------------------ */

/** Explicit party for a run — the real-roster path (PLAN-019-S2.2 T-3).
 *  `members` are `LabMember`-shaped (the adapter `residentToQuestMember`
 *  produces them; `member.id` carries the residentId, the persisted lock
 *  source of S2.4/S2.5). */
export interface QuestRunPartyInput {
  members: LabMember[];
  /** Party purse for the run — defaults to 0 (preset path keeps its own
   *  authored `gold`). */
  gold?: number;
  /** Recorded in `state.presetId` for provenance — defaults to 'party'. */
  presetId?: string;
}

/** Object form of {@link createRun} (PLAN-019-S2.2 T-3): the real-roster
 *  entry — `{party, seed, questId, loadout, clock}`. `party` is either a
 *  {@link QuestRunPartyInput} or a bare `LabMember[]`. */
export interface CreateRunInput {
  party: QuestRunPartyInput | LabMember[];
  seed: number;
  questId?: QuestId;
  loadout?: string[];
  clock?: { nodeTicks?: number; startTick?: number };
  /** S2.3: the resolved offer's node map — registered and referenced by
   *  `state.scenarioInstanceId`; `nodesFor` serves it for the whole run. */
  scenarioInstance?: ScenarioInstance;
  /** S2.3: the frozen resolved-offer record — stored verbatim in the run. */
  resolvedOffer?: ResolvedOfferRecord;
  /** PLAN-053 T-003 launch seam: when the POI carries authored `fasi`, the
   *  caller passes the resolved {@link QuestJourneyLaunchSpec} (beat plans,
   *  route geometry, frozen clock) and the run is born journey-enabled.
   *  `runSeed`/`launchedAtTick` are re-derived from the run itself — a
   *  caller-side spec can never drift from the run it attaches to. */
  journey?: QuestJourneyLaunchSpec;
}

/**
 * Create a fresh run. Two call shapes:
 * - `(presetId, seed, questId, loadout?, frontier?)` — lab / Monte Carlo path.
 * - `({party, seed, questId?, loadout?, clock?})` — real-roster path: `party`
 *   members are `LabMember`-shaped (built by `residentToQuestMember`);
 *   `member.id` carries the residentId S2.4/S2.5 derive the expedition lock
 *   from.
 * `questId` selects the authored quest: 'cassa' (default, infiltration),
 * 'rovine' (attrition gauntlet) or 'goblin' (combat). `loadout` is the stash
 * pick (R-102) — omitted = config default. `clock`/`frontier` is the v27
 * caller-tick schedule — omitted = instant maturation (lab, Monte Carlo).
 */
export function createRun(input: CreateRunInput): QuestRunState;
export function createRun(
  presetId: string,
  seed: number,
  questId?: QuestId,
  loadout?: string[],
  frontier?: { nodeTicks?: number; startTick?: number },
): QuestRunState;
export function createRun(
  preset: string | CreateRunInput,
  seed?: number,
  questId: QuestId = 'cassa',
  loadout?: string[],
  frontier?: { nodeTicks?: number; startTick?: number },
): QuestRunState {
  let input: QuestRunPartyInput | undefined;
  let scenarioInstance: ScenarioInstance | undefined;
  let resolvedOffer: ResolvedOfferRecord | undefined;
  let journeySpec: QuestJourneyLaunchSpec | undefined;
  if (typeof preset !== 'string' && 'party' in preset) {
    const p: QuestRunPartyInput = Array.isArray(preset.party) ? { members: preset.party } : preset.party;
    input = { members: p.members, gold: p.gold, presetId: p.presetId };
    seed = preset.seed;
    questId = preset.questId ?? 'cassa';
    loadout = preset.loadout;
    frontier = preset.clock;
    scenarioInstance = preset.scenarioInstance;
    resolvedOffer = preset.resolvedOffer;
    journeySpec = preset.journey;
  } else if (typeof preset !== 'string') {
    input = preset;
  }
  if (scenarioInstance) registerScenarioInstance(scenarioInstance);
  if (questId === 'gen' && (!input || !scenarioInstance)) {
    throw new Error("createRun: questId 'gen' requires an explicit party and a ScenarioInstance (generated scenarios carry all content in the instance)");
  }
  const quest = QUESTS[questId];
  const found = input ? undefined : quest.presets.find((p) => p.id === (preset as string));
  const members = input ? input.members : (found ?? quest.presets[0]).members;
  const gold = input ? (input.gold ?? 0) : (found ?? quest.presets[0]).gold;
  const presetId = input ? (input.presetId ?? 'party') : (found ?? quest.presets[0]).id;
  const party: RuntimeMember[] = members.map((m) => ({
    ...m,
    hp: m.hp ?? TUNE.hp,
    maxHp: m.hp ?? TUNE.hp,
    wounded: false,
    dead: false,
  }));
  const intro =
    questId === 'rovine'
      ? {
          lastEvent: 'The expedition leaves for the ruins beneath the river.',
          firstLog: 'Departure — objective: bring back the ruins treasure. The road counts in days.',
        }
      : questId === 'goblin'
        ? {
            lastEvent: 'The wood has gone quiet. The goblins have not.',
            firstLog: 'Assignment — combat quest, based on Strength. The goblin trophy converts to Gold on return.',
          }
        : questId === 'gen'
          ? {
              lastEvent: 'The expedition departs.',
              firstLog: 'Departure — objective: complete the mission.',
            }
          : {
              lastEvent: 'The expedition leaves for the Crow Pass.',
              firstLog: 'Departure — objective: bring back the seed crate.',
            };
  // Generated/scaled instances may carry their own start node (engine v2).
  const startNode = scenarioInstance?.startNode ?? quest.startNode;
  const state: QuestRunState = {
    seed: seed ?? 0,
    rngCalls: 0,
    questId,
    presetId,
    nodeId: startNode,
    party,
    gold,
    days: questId === 'rovine' ? TUNE.rovineBaseDays : 0,
    bottinoOro: 0,
    loot: [],
    info: [],
    // Goblin quest (R-102): the bag is the stash pick, resolved and clamped by
    // the stash config; no explicit pick = the config default loadout.
    flags: questId === 'goblin' ? resolveStashLoadout(loadout) : [],
    alarm: false,
    objectiveDone: false,
    ended: false,
    outcome: 'running',
    lastEvent: engineText(intro.lastEvent),
    checkQueue: [],
    log: [{ kind: 'NODE', text: engineText(intro.firstLog) }],
    combatTurn: 0,
    goblinLeft: 0,
    exploreTurn: 0,
    xp: 0,
    checkSeq: 0,
    harmSeq: 0,
    pendingHarms: [],
    recentHarms: [],
    engineSchemaVersion: ENGINE_SCHEMA_VERSION,
    frontierVersion: 0,
    // Every quest starts on a 'choice' node → the initial frontier waits.
    frontier: { status: 'waiting', startedAt: frontier?.startTick ?? 0, readyAt: frontier?.startTick ?? 0 },
    nodeTicks: frontier?.nodeTicks ?? 0,
    visitedNodes: [startNode],
    cursorVisitSeq: 1,
    dismissedUpTo: 0,
    ...(scenarioInstance ? { scenarioInstanceId: scenarioInstance.instanceId } : {}),
    ...(resolvedOffer ? { resolvedOffer } : {}),
    launchedAtTick: frontier?.startTick ?? 0,
  };
  // Engine v2 (PLAN-026): seed the numeric vars and run the runstart arm
  // rolls (trait-gated twist arming) — legacy runs without an instance get
  // neither and stay bit-identical.
  if (scenarioInstance?.initialVars) state.vars = { ...scenarioInstance.initialVars };
  runArmRolls(state, scenarioInstance?.armRolls);
  if (journeySpec) {
    attachQuestJourney(state, {
      ...journeySpec,
      runSeed: state.seed,
      engineSchemaVersion: state.engineSchemaVersion,
      launchedAtTick: state.launchedAtTick,
    });
  }
  return state;
}

/** Persisted-state schema version (PLAN-025 T-005 reads this). */
export const ENGINE_SCHEMA_VERSION = 2;

/** Maturable nodes = timed, non-decision kinds that carry scene time (v27). */
export function maturableNodeCount(questId: QuestId): number {
  return Object.values(QUESTS[questId].nodes).filter((n) => n.kind === 'info' || n.kind === 'harm').length;
}

/** Duration rule (PLAN-025 T-004): the quest's authored total ticks are shared
 *  evenly across its maturable nodes — no new duration numbers are invented. */
export function nodeDurationTicks(questId: QuestId, totalTicks: number): number {
  const n = maturableNodeCount(questId);
  return n ? Math.floor(totalTicks / n) : 0;
}

function allDead(state: QuestRunState): boolean {
  return state.party.every((m) => m.dead);
}

function leader(state: QuestRunState): RuntimeMember | undefined {
  return state.party.find((m) => m.role === 'leader');
}

function endRun(state: QuestRunState, outcome: QuestOutcome, text: string): void {
  text = engineText(text);
  if (state.journey) {
    journeyOutcome(state, outcome, text);
  } else {
    finishRun(state, outcome, text);
  }
  /* `nowTick` is caller context for the current engine call, not run
   * state — it must not leak into the persisted record (the golden
   * characterization suite pins the terminal shape byte-identical). */
  delete state.nowTick;
}

/** The terminal write shared by legacy ends and journey arrivals/wipes. */
function finishRun(state: QuestRunState, outcome: QuestOutcome, text: string): void {
  state.ended = true;
  state.outcome = outcome;
  if (outcome === 'wipe') {
    state.loot = [];
    state.info = [];
    pushLog(state, { kind: 'QUEST_END', text: 'No one comes back. Everything is lost.' });
  } else {
    // Goblin quest (Director): XP is always awarded, whatever the outcome.
    if (state.questId === 'goblin') {
      state.xp = TUNE.goblinXp;
      pushLog(state, { kind: 'INFO', text: `The hunt teaches. +${TUNE.goblinXp} XP.` });
    }
    pushLog(state, { kind: 'QUEST_END', text });
  }
  state.lastEvent = engineText(composeEndingText(state, text));
}

/**
 * PLAN-053 lifecycle split (artifact r011): inside a journey-enabled run a
 * non-wipe outcome is a VERDICT, not an arrival — the verdict freezes
 * (`verdictAtPoi`, `outcomeResolvedAtTick`, `terminalKind:
 * contentCompleteAtPoi`) and the party walks home; `ended` stays false so
 * every legacy consumer (expedition lock, halo, gates) keeps reading an
 * in-flight run. A wipe is terminal wherever it lands: it settles in place
 * (`settledAtTick = outcomeResolvedAtTick`) or the gate would deadlock.
 * XP is awarded by {@link finishRun} at arrival — provisional Director
 * default: no XP on a return wipe (the PR of the ruling may update the
 * pinned test).
 */
function journeyOutcome(state: QuestRunState, outcome: QuestOutcome, text: string): void {
  const jr = state.journey!;
  const j = jr.journal;
  const t = state.nowTick ?? j.processedUpToTick;
  if (outcome === 'wipe') {
    state.outcomeResolvedAtTick = t;
    state.settledAtTick = t;
    state.terminalKind = 'wiped';
    state.lastFase = j.currentFase;
    finishRun(state, 'wipe', text);
    return;
  }
  state.outcomeResolvedAtTick = state.outcomeResolvedAtTick ?? t;
  state.verdictAtPoi = outcome;
  state.terminalKind = state.terminalKind ?? 'contentCompleteAtPoi';
  pushLog(state, { kind: 'QUEST_END', text });
  state.lastEvent = engineText(composeEndingText(state, text));
  if (j.currentFase === 'svolgimento') {
    enterReturnFase(state, t, 0);
  } else if (j.currentFase === 'andata') {
    // A flee mid-andata turns the party around: the reversed route keeps
    // the physical position — consumed(ritorno) = total − consumed(andata).
    const total = jr.snapshot.travelDays * jr.snapshot.ticksPerDay;
    const consumed = Math.max(0, t - j.faseStartedAtTick - j.accumulatedParkedTicks);
    enterReturnFase(state, t, Math.max(0, total - consumed));
  }
  // A non-wipe verdict during ritorno (e.g. a retreat choice) only
  // overwrites the frozen verdict — the party is already walking home.
}

/** Enter the ritorno fase: journal side lives in the journey engine, the
 *  engine side drops the frontier back to the travel sentinel. */
function enterReturnFase(state: QuestRunState, tick: number, initialConsumedTicks: number): void {
  const jr = state.journey;
  if (!jr) return;
  enterJourneyFase(jr, 'ritorno', tick, initialConsumedTicks);
  state.frontier = travelFrontier(tick);
}

/** The travel sentinel frontier: pending forever — the ROUTE is the
 *  frontier while no beat is open (`matureReady` never matures it). */
function travelFrontier(tick: number): QuestRunState['frontier'] {
  return { status: 'pending', startedAt: tick, readyAt: Number.MAX_SAFE_INTEGER };
}

/** A taken-but-not-secured loot item drops out of the party's hands. */
function dropLoot(state: QuestRunState, item: string, reason: string): void {
  if (!state.loot.includes(item)) return;
  state.loot = state.loot.filter((l) => l !== item);
  pushLog(state, { kind: 'LOOT', text: `${item}: ${reason}` });
}

/**
 * TAKEN ≠ SECURED (Director-approved minimal redesign, 2026-10-03): the
 * objective — the seed crate, or the ruins treasure — is acquired, not
 * banked. It is lost if the escape fails or the party panics (flee).
 * Once lost it stays behind.
 */
function dropObjective(state: QuestRunState, reason: string): void {
  if (!state.objectiveDone) return;
  state.objectiveDone = false;
  if (state.questId === 'rovine') {
    state.flags.push('tesoroPerso');
    state.bottinoOro = 0;
    dropLoot(state, 'ruins treasure', reason);
  } else if (state.questId === 'goblin') {
    state.flags.push('trofeoPerso');
    dropLoot(state, 'goblin trophy', reason);
  } else if (state.questId === 'gen') {
    state.flags.push('objectiveLost');
    for (const l of [...state.loot]) dropLoot(state, l, reason);
  } else {
    state.flags.push('cassaPersa');
    dropLoot(state, 'seed crate', reason);
  }
}

/** Player chooses to flee — quest failed, secured loot kept; the objective
 *  is still "in hand", not banked: panic means dropping it to run. */
export function flee(state: QuestRunState, tick?: number): QuestRunState {
  if (state.ended) return state;
  state.nowTick = tick ?? state.frontier.startedAt;
  pushLog(state, { kind: 'RETREAT', text: 'The expedition retreats.' });
  if (state.objectiveDone) {
    dropObjective(
      state,
      state.questId === 'rovine'
        ? 'in the flight the treasure weighs too much — you abandon it among the ruins.'
        : state.questId === 'gen'
          ? 'in the flight the load slows you too much — you drop it by the roadside.'
          : 'in the flight the crate slows you too much — you drop it at the edge of the camp.',
    );
  }
  endRun(state, 'fled', 'You flee toward the village with what you gathered. The quest has failed.');
  return state;
}

/**
 * Spend a carried flag — it leaves `flags` and joins the run's consumed
 * record (`consumablesUsed`, S4 T-2 epilogue «spesi e distrutti»).
 */
function consumeFlag(state: QuestRunState, flag: string): void {
  state.flags = state.flags.filter((f) => f !== flag);
  (state.consumablesUsed ??= []).push(flag);
}

/** Use a consumable from the merchant (mock inventory flags). */
export function drinkPotion(state: QuestRunState, flag: 'hasPozione'): QuestRunState {
  if (state.ended || !state.flags.includes(flag)) return state;
  consumeFlag(state, flag);
  const target = state.party.find((m) => !m.dead && (m.wounded || m.hp < m.maxHp));
  if (target) {
    target.wounded = false;
    target.hp = target.maxHp;
    pushLog(state, { kind: 'INFO', text: `Potion used: ${target.name} is back in shape.` });
  } else {
    pushLog(state, { kind: 'INFO', text: 'Potion used, but no one needed it.' });
  }
  return state;
}

/**
 * Goblin quest consumable — «La ferita si chiude. +20 HP».
 * Director rule: usable only before a skill check or a choice — i.e. while
 * the run waits at a decision node (choice/combat), never mid-resolution.
 */
export function useHealing(state: QuestRunState): QuestRunState {
  if (state.ended || !state.flags.includes('hasHealing')) return state;
  const node = nodesFor(state)[state.nodeId];
  if (!node || (node.kind !== 'choice' && node.kind !== 'combat')) return state;
  consumeFlag(state, 'hasHealing');
  const target = state.party
    .filter((m) => !m.dead)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (target && target.hp < target.maxHp) {
    target.hp = Math.min(target.maxHp, target.hp + 20);
    if (target.hp >= target.maxHp) target.wounded = false;
    pushLog(state, { kind: 'INFO', text: `The wound closes: ${target.name} recovers 20 HP.` });
  } else {
    pushLog(state, { kind: 'INFO', text: 'The healing helps no one — kept for nothing.' });
  }
  return state;
}

interface CheckResult {
  verdict: Verdict;
  score: number;
  rollPct: number;
}

/** English label of each check consumable — engine-side (log lines are English by convention). */
const CHECK_CONSUMABLE_LABELS: Record<string, string> = {
  hasBonusForza: 'Strength Bonus',
  hasBonusPerc: 'Perception Bonus',
  hasFumogeno: 'Smoke bomb',
  hasCorda: 'Rope and grappling hook',
};

/**
 * Which owned consumable would boost this check, and by how much (preview +
 * resolution share this). R-196: candidates come from `QUEST_STASH` check
 * items; when `armedFlags` is provided ONLY the items the player illuminated
 * in the belt may apply. The winner covers the most of the check's stats
 * (coverage desc, bonus desc, catalog order) — one item per check, never two
 * spent on the same roll.
 */
export function consumableBonusFor(
  state: QuestRunState,
  node: QuestNode,
  armedFlags?: ReadonlySet<string>,
): { bonus: number; label: string; flag: string } | null {
  const stats = node.stats ?? [];
  if (!stats.length) return null;
  const candidates = QUEST_STASH.items.filter(
    (item) =>
      item.kind === 'check' &&
      state.flags.includes(item.flag) &&
      (item.stats?.some((s) => stats.includes(s)) ?? false) &&
      (!armedFlags || armedFlags.has(item.flag)),
  );
  if (!candidates.length) return null;
  const coverage = (item: (typeof candidates)[number]) => (item.stats ?? []).filter((s) => stats.includes(s)).length;
  const winner = candidates.reduce((best, item) => {
    const dc = coverage(item) - coverage(best);
    if (dc !== 0) return dc > 0 ? item : best;
    const db = (item.bonus ?? 0) - (best.bonus ?? 0);
    return db > 0 ? item : best;
  });
  return { bonus: winner.bonus ?? 0, label: CHECK_CONSUMABLE_LABELS[winner.flag] ?? winner.flag, flag: winner.flag };
}

/**
 * Per-armed-item qualifier for the belt (R-196): given the check the party is
 * about to face, a held item is 'winner' (it would apply), 'shadowed' (an
 * armed sibling beats it on coverage — never consumed), 'inert' (no current
 * option's check needs it — never consumed) or 'available' (held, not armed).
 */
export type BeltItemStatus = 'armed' | 'winner' | 'shadowed' | 'inert' | 'available' | 'passive';

/** Resolves the belt status of every packed item for the current frontier.
 *  `checkNodes` = the check nodes reachable from the options on stage. */
export function beltItemStatuses(
  state: QuestRunState,
  checkNodes: QuestNode[],
  armedFlags: ReadonlySet<string>,
): Record<string, BeltItemStatus> {
  const out: Record<string, BeltItemStatus> = {};
  const winners = new Set(
    checkNodes.map((n) => consumableBonusFor(state, n, armedFlags)?.flag).filter((f): f is string => !!f),
  );
  for (const item of QUEST_STASH.items) {
    if (!state.flags.includes(item.flag)) continue;
    if (item.kind === 'passive') {
      out[item.flag] = 'passive';
      continue;
    }
    if (!armedFlags.has(item.flag)) {
      out[item.flag] = 'available';
      continue;
    }
    if (item.kind === 'action') {
      /* Eligibility of an action item depends on whether the next command can
       * spend it — `stepArmedActionItems` decides on commit; for display we
       * mark it armed when a living member could still benefit. */
      out[item.flag] = armedActionEligible(state) ? 'armed' : 'inert';
      continue;
    }
    const needed = checkNodes.some((n) => (n.stats ?? []).some((s) => item.stats?.includes(s)));
    if (!needed) {
      out[item.flag] = 'inert';
    } else if (winners.has(item.flag)) {
      out[item.flag] = 'winner';
    } else {
      /* Armed and needed by some check, but another armed item covers that
       * check better — it lights dimmed and is never consumed. */
      out[item.flag] = 'shadowed';
    }
  }
  return out;
}

/** Any living member an armed action item could still help (belt display). */
function armedActionEligible(state: QuestRunState): boolean {
  return state.party.some((m) => !m.dead && (m.wounded || m.hp < m.maxHp));
}

/* ------------------------------------------------------------------ */
/* Armed action items (R-196): one deterministic routine shared by the  */
/* belt preview (on a clone) and the commit path (on the live state).   */
/* ------------------------------------------------------------------ */

/** The member `hasHealing` would treat: the living member furthest from full
 *  health (tie: party order). `null` when nobody needs a heal. */
function healingTarget(state: QuestRunState): RuntimeMember | undefined {
  return state.party
    .filter((m) => !m.dead && m.hp < m.maxHp)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

/** The member `hasPozione` would treat: the first living member in party
 *  order that is wounded or below full HP. */
function potionTarget(state: QuestRunState): RuntimeMember | undefined {
  return state.party.find((m) => !m.dead && (m.wounded || m.hp < m.maxHp));
}

/** What one pass of the armed action items did to a state. */
export interface ArmedActionStepResult {
  /** Item flags actually consumed (mutation applied). */
  consumedFlags: string[];
  /** memberId → heal delta applied. */
  memberDeltas: Record<string, { hpDelta: number; clearedWound: boolean }>;
  /** Armed items that lost their target to an earlier item in the same pass. */
  shadowedFlags: string[];
  /** Armed items with no eligible target even before the pass. */
  inertFlags: string[];
}

/**
 * ONE deterministic resolution routine for the armed action items (R-196
 * WITNESS-11): iterates `QUEST_STASH` action items in catalog order on
 * `state`, mutating sequentially — `hasHealing` first (+20 HP on the most
 * hurt living member, wound cleared at full), then `hasPozione` on the
 * post-heal state (full heal + wound clear on the first living member in
 * need). An item is consumed ONLY when its mutation is actually applied;
 * items left without a target are `shadowed` (the pristine state had one,
 * an earlier heal took it) or `inert` (nobody needed it to begin with).
 *
 * Preview runs it on a `structuredClone`, execution on the live state —
 * identical inputs produce identical results.
 */
export function stepArmedActionItems(
  state: QuestRunState,
  armedFlags?: ReadonlySet<string>,
): ArmedActionStepResult {
  const result: ArmedActionStepResult = { consumedFlags: [], memberDeltas: {}, shadowedFlags: [], inertFlags: [] };
  if (!armedFlags || armedFlags.size === 0) return result;
  /* Pristine eligibility decides shadow vs inert when a target vanishes
   * mid-pass (the kit healed the only wounded member the potion eyed). */
  const hadHealingTarget = !!healingTarget(state);
  const hadPotionTarget = !!potionTarget(state);
  const mergeDelta = (id: string, hpDelta: number, clearedWound: boolean) => {
    const prev = result.memberDeltas[id];
    result.memberDeltas[id] = { hpDelta: (prev?.hpDelta ?? 0) + hpDelta, clearedWound: clearedWound || !!prev?.clearedWound };
  };
  for (const item of QUEST_STASH.items) {
    if (item.kind !== 'action' || !armedFlags.has(item.flag) || !state.flags.includes(item.flag)) continue;
    if (item.flag === 'hasHealing') {
      const target = healingTarget(state);
      if (target) {
        const before = target.hp;
        const wasWounded = target.wounded;
        target.hp = Math.min(target.maxHp, target.hp + 20);
        if (target.hp >= target.maxHp) target.wounded = false;
        consumeFlag(state, item.flag);
        pushLog(state, { kind: 'INFO', text: `The wound closes: ${target.name} recovers ${target.hp - before} HP.` });
        result.consumedFlags.push(item.flag);
        mergeDelta(target.id, target.hp - before, wasWounded && !target.wounded);
      } else {
        (hadHealingTarget ? result.shadowedFlags : result.inertFlags).push(item.flag);
      }
    } else if (item.flag === 'hasPozione') {
      const target = potionTarget(state);
      if (target) {
        const wasWounded = target.wounded;
        const hpDelta = Math.max(0, target.maxHp - target.hp);
        target.hp = target.maxHp;
        target.wounded = false;
        consumeFlag(state, item.flag);
        pushLog(state, { kind: 'INFO', text: `Potion used: ${target.name} is back in shape.` });
        result.consumedFlags.push(item.flag);
        mergeDelta(target.id, hpDelta, wasWounded);
      } else {
        (hadPotionTarget ? result.shadowedFlags : result.inertFlags).push(item.flag);
      }
    }
  }
  return result;
}

/** Preview pass: the SAME routine on a deep clone — what the belt and the
 *  roster show is exactly what a commit will do (R-196 WITNESS-11). */
export function previewArmedActionItems(
  state: QuestRunState,
  armedFlags: ReadonlySet<string>,
): ArmedActionStepResult & { state: QuestRunState } {
  const clone = structuredClone(state);
  const result = stepArmedActionItems(clone, armedFlags);
  return { ...result, state: clone };
}

/**
 * Discovered intel that changes a check's numbers — the payoff of the
 * sighting phase. turni→sneak, pattuglia→side door, mappa→perquisizione.
 */
export function intelBonusFor(state: QuestRunState, node: QuestNode): { bonus: number; label: string } | null {
  if (node.id === 'check-ingresso-agi' && state.info.includes('turni')) {
    return { bonus: 10, label: 'you know the guard shifts' };
  }
  if (node.id === 'check-ingresso-laterale' && state.info.includes('pattuglia')) {
    return { bonus: 10, label: 'you know when the patrol passes' };
  }
  if (node.id === 'perquisizione' && state.info.includes('mappaAccampamento')) {
    return { bonus: 10, label: 'you have a mental map of the camp' };
  }
  // Rovine: the merchant's intel pays on the checks it describes —
  // the rough map helps at the river and spotting the trap; knowing what
  // the guards really watch makes sneaking past them easier.
  if (node.id === 'rv-fiume' && state.info.includes('mappaRovine')) {
    return { bonus: 10, label: 'the map marks the weak current point' };
  }
  if (node.id === 'rv-check-sneak' && state.info.includes('guardiePiuAvanti')) {
    return { bonus: 10, label: 'you know what they are really guarding' };
  }
  if (node.id === 'rv-sala' && state.info.includes('mappaRovine')) {
    return { bonus: 10, label: 'the map marks the trapdoor slabs' };
  }
  // Goblin: the F1 tracks pay on the F3 stealth approach (Director rule).
  if (node.id === 'gob-stealth' && state.flags.includes('bonusStealth')) {
    return { bonus: 10, label: 'the tracks show how to approach' };
  }
  if (node.id === 'gob-stealth' && state.flags.includes('bonusStealthPiccolo')) {
    return { bonus: 5, label: 'the tracks give some hints' };
  }
  return null;
}

/**
 * Escalate the camp's alertness — named states, not a meter (Director
 * 2026-10-03: noise meter removed; the camp is quieto / allertato / sveglio).
 * quiet + fail → campoAllertato (a warning, no mechanical penalty).
 * campoAllertato + fail, or quiet + epicfail → campoSveglio (+alarm, −10pp).
 * Any bad verdict while already sveglio → the thing in the tower wakes
 * (caller diverts to 'risveglio'). Returns true when the camp must wake.
 */
function escalateCamp(state: QuestRunState, epicfail: boolean, reason: string): boolean {
  if (state.flags.includes('campoSveglio')) {
    pushLog(state, { kind: 'INFO', text: `${reason} Something is waking up in the tower.` });
    return true;
  }
  const allertato = state.flags.includes('campoAllertato');
  if (allertato || epicfail) {
    if (!allertato) state.flags.push('campoAllertato');
    state.flags.push('campoSveglio');
    state.alarm = true;
    pushLog(state, { kind: 'INFO', text: `${reason} The camp wakes: shouts and torches everywhere — checks will be harder.` });
    return false;
  }
  state.flags.push('campoAllertato');
  pushLog(state, { kind: 'INFO', text: `${reason} Someone in the camp heard something.` });
  return false;
}

/**
 * Resolve a check. `useConsumable=false` means the player saw the preview and
 * chose to keep the consumable in the bag — it is NOT consumed and adds no
 * bonus. Forced checks (risveglio, epicfail→scontro) auto-spend: the party is
 * desperate and there is no preview moment to decide in.
 * R-196: when `armedFlags` is provided the per-item belt selection replaces the
 * bag-level boolean — the coverage winner among the ARMED check items applies
 * and is consumed; unarmed siblings stay in the bag untouched.
 */
function resolveCheck(
  state: QuestRunState,
  node: QuestNode,
  useConsumable = true,
  forceDie?: number,
  armedFlags?: ReadonlySet<string>,
): CheckResult {
  const stats = node.stats ?? [];
  const score = groupScore(state, stats);
  /* `forceDie` is the deterministic analysis seam (questCertainty probe):
   * the verdict is fixed while every downstream consequence (harms, tolls)
   * still rolls — production callers never pass it. The check's die draw is
   * skipped when forced so the harm stream stays reproducible per offset. */
  const die = forceDie ?? 1 + Math.floor(roll(state) * 100);
  // consumables: fumogeno helps agi checks, corda helps the climb
  let bonus = 0;
  const consumable = consumableBonusFor(state, node, armedFlags);
  if (consumable && (armedFlags ? true : useConsumable)) {
    bonus = consumable.bonus;
    consumeFlag(state, consumable.flag);
    if (consumable.flag === 'hasFumogeno') {
      pushLog(state, { kind: 'INFO', text: 'The smoke bomb covers your infiltration (+15).' });
    } else if (consumable.flag === 'hasCorda') {
      pushLog(state, { kind: 'INFO', text: 'Rope and grappling hook make the climb safer (+15).' });
    } else {
      pushLog(state, { kind: 'INFO', text: `${consumable.label}: the bonus comes into play (+${consumable.bonus}).` });
    }
  } else if (consumable && !armedFlags) {
    pushLog(state, { kind: 'INFO', text: `You decide to keep ${consumable.label} in the bag.` });
  }
  const intel = intelBonusFor(state, node);
  if (intel) {
    bonus += intel.bonus;
    pushLog(state, { kind: 'INFO', text: `The intel pays off: ${intel.label} (+${intel.bonus}).` });
  }
  const successBound = clampSuccessBound(score + bonus);
  const verdict = verdictFromRoll(die, successBound);
  state.checkSeq += 1;
  const resolved: ResolvedCheck = {
    id: `chk-${state.checkSeq}`,
    title: node.title,
    verdict,
    score: Math.round(successBound),
    rollPct: die,
    harm: 'none',
    woundPct: node.risk?.wound ?? 0,
    deathPct: node.risk?.death ?? 0,
    transit: node.transit,
    flavor: node.verdictFlavor?.[verdict],
    harms: [],
    harmLines: [],
    authoredText: '',
    exposure: exposureSnapshot(state, 0),
    checkSeq: state.checkSeq,
    visitSeq: state.cursorVisitSeq,
    beatIndex: state.checkQueue.length,
  };
  state.lastCheck = resolved;
  state.checkQueue.push(resolved);
  pushLog(state, {
    kind: 'CHECK',
    text: `${node.title}: ${stats.map((s) => STAT_LABELS[s]).join(' + ')} → ${verdict.toUpperCase()} (${Math.round(successBound)} vs roll ${die}).`,
  });
  // Surface the verdict→risk modifier: the player must FEEL the lucky escape.
  if (verdict === 'win' || verdict === 'bigwin') {
    pushLog(state, {
      kind: 'INFO',
      text: `The ${verdict.toUpperCase()} spared the party (−${-TUNE.winRiskMod}pp to wound and death).`,
    });
  }
  if (verdict === 'bigwin') {
    pushLog(state, { kind: 'INFO', text: 'Bigwin: every death outcome is downgraded to a wound.' });
  }
  if (verdict === 'epicfail') {
    pushLog(state, { kind: 'INFO', text: 'Epicfail: every wound becomes a death.' });
  }
  resolved.harm = rollCheckHarms(state, node, verdict);
  return { verdict, score: successBound, rollPct: die };
}

/* ------------------------------------------------------------------ */
/* Goblin quest: turn-based combat resolution (PLAN-022)                */
/* ------------------------------------------------------------------ */

/** Authored one-liners for the goblin fight's attack verdicts (spec §Testi). */
const GOBLIN_ATTACK_LINES: Record<Verdict, string> = {
  bigwin: 'The impact booms across the clearing. The enemy line buckles and the din of shields drowns under a volley of blows.',
  win: 'Iron grates on iron. The shapes in front of you stagger and the first rank falls back into the fire’s uncertain light.',
  almost: 'The blade opens a gap through leather and shields, but at once another shape slips into the space left free.',
  fail: 'The blow smashes into wood. A spearhead darts out of the smoke, close enough that you feel its air on your face.',
  epicfail: 'There is no room to raise your weapon. Blows, screams and iron points close on you from every side while the smoke wipes out every landmark.',
};

/** F6 push-your-luck: the sheltering ruin degrades turn by turn — the rising
 *  damage IS the structure giving way, narrated once per exploreTurn. */
const GOBLIN_F6_CREAK_LINES = [
  'The pole holding the tarp creaks.',
  'The embers still smoulder beneath the blackened canvas; the heat licks at your face.',
  'A beam tears free with a crash and falls where, an instant before, you were rummaging.',
] as const;

/**
 * Resolve ONE combat turn (a click = a round):
 * the party rolls attackStats against the F4 bound; the goblins hit back
 * `hits` times, each on a different positional target. NO instant death in
 * the fight phase — hits remove HP; 0 HP kills (Director rule).
 * F4 bonuses (stealth→vantaggioGrande, assalto→vantaggioPiccolo) lift the
 * attack bound for the whole phase; the ambush's worsened flag hardens hits.
 */
function resolveCombatTurn(state: QuestRunState, node: QuestNode): void {
  const spec = node.combat;
  if (!spec || state.ended) return;
  state.combatTurn += 1;
  const turn = state.combatTurn;
  const vantage = state.flags.includes('vantaggioGrande')
    ? 15
    : state.flags.includes('vantaggioPiccolo')
      ? 10
      : 0;
  const score = groupScore(state, spec.attackStats) + vantage;
  const bound = clampSuccessBound(score - TUNE.goblinCheckDifficulty);
  const die = 1 + Math.floor(roll(state) * 100);
  const verdict = verdictFromRoll(die, bound);
  const attackLine = spec.attackLines?.[verdict] ?? GOBLIN_ATTACK_LINES[verdict];
  state.checkSeq += 1;
  state.lastCheck = {
    id: `chk-${state.checkSeq}`,
    title: engineText(`${node.title} — turn ${turn}`),
    verdict,
    score: Math.round(bound),
    rollPct: die,
    harm: 'none',
    woundPct: 0,
    deathPct: 0,
    // The transit line belongs to the phase entrance, not every round.
    transit: turn === 1 ? node.transit : undefined,
    flavor: engineText(attackLine),
    harms: [],
    harmLines: [],
    authoredText: '',
    exposure: exposureSnapshot(state, spec.escalateProfile ? turn : 0),
    checkSeq: state.checkSeq,
    visitSeq: state.cursorVisitSeq,
    beatIndex: state.checkQueue.length,
  };
  state.checkQueue.push(state.lastCheck);
  pushLog(state, {
    kind: 'CHECK',
    text: `Turn ${turn}: ${spec.attackStats.map((s) => STAT_LABELS[s]).join(' + ')} → ${verdict.toUpperCase()} (${Math.round(bound)} vs roll ${die}). ${attackLine}`,
  });
  // Everything logged after this point is a consequence of the attack roll.
  const consequenceMark = state.log.length;
  const kills =
    verdict === 'bigwin' ? spec.killPerBigwin : verdict === 'win' || verdict === 'almost' ? spec.killPerWin : 0;
  if (kills > 0) {
    state.goblinLeft = Math.max(0, state.goblinLeft - kills);
    pushLog(state, { kind: 'INFO', text: `${spec.enemyName ?? 'Goblins'} down: ${kills}. ${state.goblinLeft} remain.` });
  }
  // Counterattack: hits land on positional targets, never twice the same one.
  const hits =
    (spec.escalateProfile ? (turn >= 3 ? 2 : 1) : 1) +
    (state.flags.includes('agguatoPeggiore') ? TUNE.ambushPeggioreExtraHits : 0);
  const used = new Set<string>();
  const hitDamage =
    spec.hitDamage +
    (state.flags.includes('agguatoPeggiore') ? TUNE.ambushWorsenedBonus : 0) +
    (state.flags.includes('agguatoMite') ? TUNE.ambushMiteBonus : 0);
  for (let h = 0; h < hits; h += 1) {
    const target = pickPositionalTarget(state, used, spec.escalateProfile ? turn : 0);
    if (!target) break;
    used.add(target.id);
    applyHpDamage(state, target, hitDamage, node.title);
  }
  /* The combat cinematic splits flavor from consequence: the attack line
   *  lives in `lastCheck.flavor`; outcomeText keeps only who paid / what fell. */
  const lc = state.lastCheck;
  lc.kills = kills > 0 ? kills : undefined;
  drainHarmsIntoLastCheck(state);
  lc.harmLines = state.log
    .slice(consequenceMark)
    .filter((e) => CHECK_CONSEQUENCE_KINDS.has(e.kind))
    .map((e) => e.text);
  lc.deathLines = state.log
    .slice(consequenceMark)
    .filter((e) => e.kind === 'DEATH')
    .map((e) => e.text);
  lc.authoredText = state.log
    .slice(consequenceMark)
    .filter((e) => e.kind !== 'NODE' && !CHECK_CONSEQUENCE_KINDS.has(e.kind))
    .map((e) => e.text)
    .join(' ');
  const outcomeLines = () => state.log.slice(consequenceMark).map((e) => e.text).join(' ');
  if (allDead(state)) {
    lc.outcomeText = outcomeLines();
    endRun(state, 'wipe', 'The expedition was wiped out.');
    return;
  }
  if (state.goblinLeft <= 0) {
    if (!state.flags.includes('sterminio')) {
      state.flags.push('sterminio');
      pushLog(state, { kind: 'INFO', text: 'Extermination: not one remains.' });
    }
    state.lastEvent = engineText(spec.clearedText ?? 'The camp is conquered. No goblin left alive.');
  } else if (turn >= spec.turns) {
    state.lastEvent = engineText(spec.survivorsText ?? 'The camp is conquered. The survivors flee into the woods.');
  } else {
    state.lastEvent = engineText(
      spec.holdingText
        ? spec.holdingText.replace('{turn}', String(turn)).replace('{left}', String(state.goblinLeft))
        : `Turn ${turn} closed — the goblins still hold the camp (${state.goblinLeft} standing).`,
    );
  }
  state.lastCheck.outcomeText = outcomeLines();
}

/** Whether the active combat has run its course (enemies dead or turns done). */
function combatDone(state: QuestRunState, node: QuestNode): boolean {
  const spec = node.combat;
  return !!spec && (state.goblinLeft <= 0 || state.combatTurn >= spec.turns);
}

/** What the UI can show before the player commits to a check option. */
export interface OptionPreview {
  checkTitle: string;
  /** Per-stat best living contributor — the party member who carries the roll. */
  contributors: { stat: LabStat; label: string; bestName: string; bestValue: number }[];
  /** Group score incl. alarm penalty + consumable/intel bonuses that would apply. */
  score: number;
  consumableLabel?: string;
  consumableBonus?: number;
  /** Inventory flag consumed if the player arms the consumable before the check. */
  consumableFlag?: string;
  intelLabel?: string;
  intelBonus?: number;
  /** ≈ P(verdict ≥ win): margin ≥ 0 ⇔ roll ≤ score. */
  successPct: number;
  /** Base per-slot risk on this check (worst case adds wounded/role modifiers). */
  woundPct: number;
  deathPct: number;
  /** Living bodyguard who will intercept every harm — risks shown are HIS. */
  interceptor?: { name: string; woundPct: number; deathPct: number };
  /** Effective per-member risk on this check — base + slot bonus/malus +
      wounded penalty. This is where the player SEES that some slots are
      exposed (bodyguard) or protected (leader). */
  perSlot: { id: string; name: string; role: string; woundPct: number; deathPct: number; wounded: boolean }[];
  /** Which of the quest's declared PRIMARY_STATS this check uses — options
      using them are the "via maestra". */
  primaryStatsUsed: string[];
  /** Authored state-consequence of failing this check (questScenario.failHint)
      — shown so the player weighs "what changes", not only "what it costs". */
  failHint?: string;
}

/**
 * Preview of an option's mechanical weight: resolves `CHECK:<id>` targets to
 * the check node and projects score, success chance, harm risk and the
 * consumable that would be consumed — without rolling anything.
 */
export function previewOption(
  state: QuestRunState,
  optionId: string,
  opts?: { useConsumable?: boolean; armedFlags?: ReadonlySet<string> },
): OptionPreview | null {
  if (state.ended) return null;
  const nodes = nodesFor(state);
  const node = nodes[state.nodeId];
  const option = node?.options?.find((o) => o.id === optionId);
  if (!option || !option.next.startsWith('CHECK:')) return null;
  const checkNode = nodes[option.next.slice(6)];
  if (!checkNode || !checkNode.stats) return null;

  /* R-196: the armed action items (healing kit, potion) fire BEFORE the roll
   * on commit — the preview must read the post-heal state, so the same
   * `stepArmedActionItems` runs on a clone and risk/HP derive from it. */
  const eff = opts?.armedFlags ? previewArmedActionItems(state, opts.armedFlags).state : state;

  const alive = eff.party.filter((m) => !m.dead);
  if (!alive.length) return null;
  const contributors = checkNode.stats.map((s) => {
    const best = alive.reduce((a, b) => (b.stats[s] > a.stats[s] ? b : a));
    return { stat: s, label: STAT_LABELS[s], bestName: best.name, bestValue: best.stats[s] };
  });
  const consumable = consumableBonusFor(eff, checkNode, opts?.armedFlags);
  const consumableApplied = consumable && opts?.useConsumable !== false ? consumable : null;
  const intel = intelBonusFor(eff, checkNode);
  const score = groupScore(eff, checkNode.stats) + (consumableApplied?.bonus ?? 0) + (intel?.bonus ?? 0);
  const bodyguard = eff.party.find((m) => m.role === 'bodyguard' && !m.dead);
  const perSlot = alive.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    wounded: m.wounded,
    ...memberRisk(m, checkNode, coverDeltaFor(eff, m.id)),
  }));
  const inst = state.scenarioInstanceId
    ? scenarioInstanceById(state.scenarioInstanceId)
    : undefined;
  const primaryStats = inst?.primaryStats ?? QUESTS[state.questId].primaryStats;
  const primaryStatsUsed = checkNode.stats.filter((s) => primaryStats.includes(s));
  return {
    checkTitle: checkNode.title,
    contributors,
    score,
    consumableLabel: consumable?.label,
    consumableBonus: consumable?.bonus,
    consumableFlag: consumable?.flag,
    intelLabel: intel?.label,
    intelBonus: intel?.bonus,
    successPct: Math.round(clampSuccessBound(score)),
    woundPct: checkNode.risk?.wound ?? 0,
    deathPct: checkNode.risk?.death ?? 0,
    interceptor: bodyguard
      ? { name: bodyguard.name, ...memberRisk(bodyguard, checkNode, coverDeltaFor(eff, bodyguard.id)) }
      : undefined,
    perSlot,
    primaryStatsUsed,
    failHint: checkNode.failHint,
  };
}

/** The check's harm risk for a specific member (slot modifier + wounded
 *  penalty + optional cover — `coverDeltaFor(state, member.id)` when a run
 *  state is known; callers without one get the bare band). */
export function memberRisk(
  member: RuntimeMember,
  node: QuestNode,
  cover: { wound: number; death: number } = { wound: 0, death: 0 },
): { woundPct: number; deathPct: number } {
  const slot = SLOT_RISK[member.role] ?? SLOT_RISK.member;
  const extra = member.wounded ? TUNE.woundedRiskBonus : 0;
  return {
    woundPct: Math.max(0, (node.risk?.wound ?? 0) + slot.wound + extra + cover.wound),
    deathPct: Math.max(0, (node.risk?.death ?? 0) + slot.death + extra + cover.death),
  };
}

/**
 * Apply the consequences of a check verdict and pick the next node.
 * Node-specific, hardcoded — this quest's authored matrix, not a system.
 */
/**
 * Checks made while INSIDE the camp escalate the camp's alertness on
 * failure — quieto → allertato → sveglio → the thing in the tower wakes.
 */
const INSIDE_CHECKS = new Set([
  'check-ingresso-agi',
  'check-ingresso-cha',
  'check-ingresso-laterale',
  'check-ingresso-forza',
  'perquisizione',
  'check-gabbia',
  'obiettivo',
  'check-forziere',
]);

/* ------------------------------------------------------------------ */
/* Declarative outcome interpreter (PLAN-026, engine v2): nodes with a  */
/* `verdictTable` resolve effects + routing from DATA; nodes without it */
/* keep the authored per-id switch below — additive, not a migration.   */
/* ------------------------------------------------------------------ */

/** True when any living party member carries `trait` (option gating +
 *  armRoll eligibility share this rule). */
export function partyHasTrait(state: QuestRunState, trait: string): boolean {
  return state.party.some((m) => !m.dead && (m.traits ?? []).includes(trait));
}

/** Evaluate an `OutcomeCond` against the run — AND of declared fields. */
function evalOutcomeCond(state: QuestRunState, cond: OutcomeCond): boolean {
  if (cond.flag && !state.flags.includes(cond.flag)) return false;
  if (cond.notFlag && state.flags.includes(cond.notFlag)) return false;
  if (cond.varGE && (state.vars?.[cond.varGE.var] ?? 0) < cond.varGE.value) return false;
  if (cond.varLT && (state.vars?.[cond.varLT.var] ?? 0) >= cond.varLT.value) return false;
  return true;
}

/** Resolve a `GotoSpec` — plain id, or first matching branch, else `else`. */
function resolveGotoSpec(state: QuestRunState, gotoSpec: GotoSpec): string {
  if (typeof gotoSpec === 'string') return gotoSpec;
  for (const branch of gotoSpec.branches) {
    if (evalOutcomeCond(state, branch.when)) return branch.then;
  }
  return gotoSpec.else;
}

/** Apply `VarOp`s to the run vars map (created lazily — legacy runs lack it). */
function applyVarOps(state: QuestRunState, ops: VarOp[]): void {
  const vars = (state.vars ??= {});
  for (const op of ops) {
    const cur = vars[op.var] ?? 0;
    vars[op.var] = op.op === 'set' ? op.value : op.op === 'inc' ? cur + op.value : cur - op.value;
  }
}

/**
 * Apply one declarative outcome: effects land first (so `goto` branches see
 * the post-effect state — e.g. `rival` incremented past a threshold routes
 * differently), then routing resolves to the next node id.
 * Exported for unit tests; the engine only reaches it via `applyNodeOutcome`.
 */
export function applyOutcomeSpec(state: QuestRunState, node: QuestNode, spec: OutcomeSpec): string {
  if (spec.setFlags) {
    for (const f of spec.setFlags) if (!state.flags.includes(f)) state.flags.push(f);
  }
  if (spec.clearFlags?.length) {
    const clear = new Set(spec.clearFlags);
    state.flags = state.flags.filter((f) => !clear.has(f));
  }
  if (spec.setInfo) {
    for (const i of spec.setInfo) if (!state.info.includes(i)) state.info.push(i);
  }
  if (spec.takeLoot) {
    for (const l of spec.takeLoot) {
      if (!state.loot.includes(l)) {
        state.loot.push(l);
        pushLog(state, { kind: 'LOOT', text: `${l} — in hand, not safe yet.` });
      }
    }
  }
  if (spec.dropLoot?.length) {
    const drop = new Set(spec.dropLoot);
    state.loot = state.loot.filter((l) => !drop.has(l));
  }
  if (spec.goldDelta) {
    state.gold += spec.goldDelta;
    pushLog(state, { kind: 'LOOT', text: `${spec.goldDelta > 0 ? '+' : ''}${spec.goldDelta} gold.` });
  }
  if (spec.damage && spec.damage > 0) positionalDamage(state, spec.damage, node.title);
  if (spec.setAlarm !== undefined) state.alarm = spec.setAlarm;
  if (spec.setObjective === 'done') state.objectiveDone = true;
  else if (spec.setObjective === 'lost') {
    state.objectiveDone = false;
    if (!state.flags.includes('objectiveLost')) state.flags.push('objectiveLost');
  }
  if (spec.vars) applyVarOps(state, spec.vars);
  if (spec.rollFlag && !state.flags.includes(spec.rollFlag.flag)) {
    if (roll(state) * 100 < spec.rollFlag.chance) state.flags.push(spec.rollFlag.flag);
  }
  if (spec.log) pushLog(state, { kind: 'INFO', text: spec.log });
  return resolveGotoSpec(state, spec.goto);
}

/**
 * Run `count` arm rolls at run creation (mixed twist arming, runstart half):
 * a `requiresTrait` roll only happens when a living member carries the trait;
 * each roll draws from the seeded rng, so arming is deterministic per seed.
 */
function runArmRolls(state: QuestRunState, armRolls: ArmRoll[] | undefined): void {
  for (const ar of armRolls ?? []) {
    if (ar.requiresTrait && !partyHasTrait(state, ar.requiresTrait)) continue;
    if (roll(state) * 100 < ar.chance && !state.flags.includes(ar.flag)) state.flags.push(ar.flag);
  }
}

function applyCheckOutcome(state: QuestRunState, node: QuestNode, verdict: Verdict): string {
  const success = verdict === 'win' || verdict === 'bigwin' || verdict === 'almost';
  const bad = verdict === 'fail' || verdict === 'epicfail';
  /* Authored upfront toll (R-097 v2): deterministic positional damage paid
   * whatever the die says — verdict branches see the party already hurt. */
  if (node.upfrontDamage) {
    const toll =
      verdict === 'epicfail'
        ? (node.upfrontDamage.epicfailAmount ?? node.upfrontDamage.amount)
        : node.upfrontDamage.amount;
    if (toll > 0) positionalDamage(state, toll, node.title);
  }
  let wake = false;
  if (INSIDE_CHECKS.has(node.id) && bad) {
    wake = escalateCamp(state, verdict === 'epicfail', node.title + '.');
  }
  const next = applyNodeOutcome(state, node, verdict, success, bad);
  // The thing in the tower wakes: Chekhov's gun fires. The check's effects
  // have already landed (you grab the crate AS it wakes) — only the
  // destination is hijacked.
  if (wake && node.id !== 'risveglio') {
    return 'risveglio';
  }
  return next;
}

/** Days are the ruins quest's visible cost — every delay is logged so the
 *  player watches the price accumulate before the checkpoint. */
function addDays(state: QuestRunState, n: number, reason: string): void {
  state.days += n;
  pushLog(state, { kind: 'INFO', text: `+${n} ${n === 1 ? 'day' : 'days'} — ${reason}` });
}

function applyNodeOutcome(state: QuestRunState, node: QuestNode, verdict: Verdict, success: boolean, bad: boolean): string {
  // Engine v2 (PLAN-026): declarative nodes resolve from data — the authored
  // switch below is the legacy fallback for Goblin/cassa/rovine nodes.
  if (node.verdictTable) {
    const spec = node.verdictTable[verdict] ?? node.verdictTable.else;
    if (spec) return applyOutcomeSpec(state, node, spec);
    // Schema enforces full coverage or an `else`; if a malformed table ever
    // reaches here, extraction is the safe authored default.
    return 'ritorno';
  }
  switch (node.id) {
    case 'avvistamento':
      if (verdict === 'bigwin') {
        state.info.push('gabbia', 'sideDoor', 'turni', 'pattuglia', 'qualcosaDiGrosso', 'mappaAccampamento');
        pushLog(state, {
          kind: 'INFO',
          text: 'You see everything: the cage with the prisoner, the side door, the shifts, the patrol — and something big sleeping in the tower.',
        });
      } else if (verdict === 'win') {
        state.info.push('gabbia', 'sideDoor', 'qualcosaDiGrosso');
        pushLog(state, {
          kind: 'INFO',
          text: 'You glimpse a cage with a prisoner, a side door… and something big in the tower.',
        });
      } else if (verdict === 'almost') {
        state.info.push('turni');
        pushLog(state, { kind: 'INFO', text: 'You only manage to count the guard shifts.' });
      } else {
        pushLog(state, { kind: 'INFO', text: 'Nothing else: you will go in blind.' });
      }
      return 'approccio';
    case 'check-ingresso-forza':
      // Forcing the entry wakes the camp for good, whatever the roll says:
      // the quiet way out is gone and checks run under alarm.
      if (!state.flags.includes('campoSveglio')) {
        state.flags.push('campoSveglio');
        state.alarm = true;
        pushLog(state, { kind: 'INFO', text: 'The fight is heard across the camp: it is awake, and it will stay awake.' });
      }
      return 'perquisizione';
    case 'check-ingresso-agi':
    case 'check-ingresso-cha':
    case 'check-ingresso-laterale':
      if (verdict === 'epicfail') return 'check-ingresso-forza'; // everything goes loud
      return 'perquisizione';
    case 'perquisizione':
      if (success) {
        state.loot.push('crate signal');
        pushLog(state, { kind: 'INFO', text: 'You find the seed crate, still intact. At the top of the tower.' });
        state.flags.push('knowsCassa');
      } else {
        pushLog(state, { kind: 'INFO', text: 'The search makes noise and finds nothing certain — you guess your way toward the tower.' });
      }
      return 'torre';
    case 'check-gabbia':
      if (success) {
        state.flags.push('prigionieroLibero');
        pushLog(state, { kind: 'LOOT', text: 'The prisoner follows you in silence. At the village he might stay.' });
      }
      return 'obiettivo';
    case 'obiettivo':
      if (success) {
        state.objectiveDone = true;
        state.loot.push('seed crate');
        pushLog(state, { kind: 'LOOT', text: 'Seed crate taken — in hand, not safe yet.' });
      } else {
        // Fail-forward: the crate stays, but the run is not over — now you
        // must extract empty-handed through whatever your entry left behind.
        pushLog(state, { kind: 'INFO', text: 'The crate slips from your hands — it stays at the camp. Now only getting out alive matters.' });
        return 'estrazione';
      }
      return 'rientra-o-rischi';
    case 'check-forziere':
      if (success) {
        state.gold += 15;
        state.loot.push('goblin chest');
        pushLog(state, { kind: 'LOOT', text: 'Goblin chest: +15 gold.' });
      }
      // The chest creaks even on success — greed is loud. Loot already in hand.
      if (escalateCamp(state, false, 'The chest creaks.')) return 'risveglio';
      return 'estrazione';
    case 'risveglio':
      if (success) {
        pushLog(state, { kind: 'INFO', text: 'You run into the night. Behind you the tower crumbles — you were a breath away.' });
      } else {
        pushLog(state, { kind: 'INFO', text: 'The escape is a desperate massacre.' });
        dropObjective(state, 'you drop it while running — it stays in the tower.');
      }
      return 'ritorno';
    case 'check-uscita-breccia':
      if (bad) {
        // The breach is forgiving on lives but not on baggage: the squeeze
        // costs whatever you could not hold. Only an epicfail drops the crate.
        dropLoot(state, 'goblin chest', 'stays stuck in the breach.');
        dropLoot(state, 'crate signal', 'lost in the squeeze.');
        if (verdict === 'epicfail') {
          dropObjective(state, 'the crate gets stuck in the gap — to get out you must leave it.');
          pushLog(state, { kind: 'INFO', text: 'The prisoner drags you past the wall: you are out, empty-handed.' });
        } else {
          pushLog(state, { kind: 'INFO', text: 'You exit the breach pushed hard — something stays behind.' });
        }
      }
      return 'ritorno';
    case 'check-uscita-calma':
      if (bad) {
        dropLoot(state, 'goblin chest', 'too heavy to vanish in silence.');
        dropLoot(state, 'crate signal', 'lost in the dark.');
        if (verdict === 'epicfail') {
          dropObjective(state, 'a patrol cuts your way: to escape you drop the crate.');
        } else {
          pushLog(state, { kind: 'INFO', text: 'Someone looks up at the wrong moment: you slip away, lighter.' });
        }
      }
      return 'ritorno';
    case 'check-uscita-allarme':
      if (bad) {
        // The loud way out: a fail means the crate is the price of speed.
        dropObjective(state, 'the camp is on you — the crate slows you too much, it stays here.');
        dropLoot(state, 'goblin chest', 'lost in the run.');
        dropLoot(state, 'crate signal', 'lost in the run.');
      }
      return 'ritorno';
    /* ---- Le Rovine sotto il Fiume ----------------------------------------
     * Attrition gauntlet: costs are HP and days. The merchant's choice is a
     * real check-fork; the trap cascade demonstrates fail-forward; the
     * treasure is TAKEN≠SECURED from the take to the end node. */
    case 'rv-check-osserva':
      if (verdict === 'bigwin') {
        state.info.push('guardiePiuAvanti', 'mappaRovine');
        pushLog(state, {
          kind: 'INFO',
          text: 'You read him open: «the guards are not protecting the entrance — they are protecting something further on». And he leaves you his rough map.',
        });
      } else if (verdict === 'win' || verdict === 'almost') {
        state.info.push('guardiePiuAvanti');
        pushLog(state, {
          kind: 'INFO',
          text: 'The merchant reveals: «the guards are not guarding the entrance. They are guarding something further on.»',
        });
      } else {
        pushLog(state, { kind: 'INFO', text: 'You learn no more than what he told you. You will go in almost blind.' });
      }
      return 'rv-fiume';
    case 'rv-check-incalza':
      if (success) {
        state.info.push('guardiePiuAvanti', 'mappaRovine');
        state.flags.push('hasCoagulo');
        pushLog(state, {
          kind: 'INFO',
          text: 'He gives in: «the guards are protecting something further on». He leaves you the rough map and a clotting agent — «for the road, you might need it».',
        });
        if (verdict === 'bigwin') {
          state.gold += 10;
          pushLog(state, { kind: 'LOOT', text: 'He also hands you 10 gold to «keep it quiet».' });
        }
      } else {
        pushLog(state, { kind: 'INFO', text: 'He chases you off with a snarl: no information, and you leave with a bitter taste.' });
      }
      return 'rv-fiume';
    case 'rv-fiume':
      if (verdict === 'almost') {
        addDays(state, 1, 'the current drags you half a mile downstream.');
      } else if (verdict === 'fail') {
        addDays(state, 1 + Math.floor(roll(state) * 2), 'dragged by the current, climbing back costs time.');
      } else if (verdict === 'epicfail') {
        addDays(state, 2, 'battered against the rocks — you limp out of the water.');
      }
      return 'rv-guardie';
    case 'rv-check-sneak':
      if (bad) {
        state.flags.push('inseguiti');
        pushLog(state, {
          kind: 'INFO',
          text: 'They saw you: the pikes chase you to the gallery exit.',
        });
      }
      return 'rv-sala';
    case 'rv-check-fight':
      if (verdict === 'bigwin') {
        state.gold += 40;
        state.loot.push('guards’ loot');
        pushLog(state, { kind: 'LOOT', text: 'The guards fall without calling for help: +40 gold loot.' });
      } else if (success) {
        state.gold += 25;
        state.loot.push('guards’ loot');
        pushLog(state, { kind: 'LOOT', text: 'The guards are down: +25 gold loot.' });
      } else {
        pushLog(state, { kind: 'INFO', text: 'You get through, but the pikes made you pay.' });
      }
      return 'rv-sala';
    case 'rv-sala':
      if (success) {
        pushLog(state, { kind: 'INFO', text: 'You see it: the slab in front of the treasure is a trap. Now you can choose how to move.' });
        return 'rv-tesoro-scelta';
      }
      pushLog(state, { kind: 'INFO', text: 'Nothing strange… until the floor gives way under your feet.' });
      return 'rv-check-trappola';
    case 'rv-check-trappola':
      state.flags.push('tesoroDanneggiato');
      if (success) {
        pushLog(state, { kind: 'INFO', text: 'You pull yourselves out of the pit — but part of the treasure ended up under the collapse.' });
      } else {
        addDays(state, 1, 'digging out of the trap costs you a day.');
        pushLog(state, { kind: 'INFO', text: 'You get out of the trap with effort: the treasure is partially damaged.' });
      }
      return 'rv-tesoro-scelta';
    case 'rv-check-prendi':
    case 'rv-check-sicuro': {
      if (success) {
        let value = TUNE.treasureMin + Math.floor(roll(state) * TUNE.treasureSpan);
        if (state.flags.includes('tesoroDanneggiato')) {
          value = Math.floor(value / 2);
          pushLog(state, { kind: 'INFO', text: 'What remains after the collapse is worth half.' });
        }
        if (node.id === 'rv-check-sicuro') {
          value = Math.round(value * 1.2);
        }
        state.bottinoOro = value;
        state.objectiveDone = true;
        state.loot.push('ruins treasure');
        pushLog(state, { kind: 'LOOT', text: `Treasure loaded — in hand, not safe yet. Worth about ${value} gold.` });
        return 'rv-checkpoint';
      }
      // Failed take: the treasure stays — the run continues to the exit empty.
      pushLog(state, { kind: 'INFO', text: 'The treasure is too much for your backs — you carry away only crumbs. You will leave almost empty-handed.' });
      state.bottinoOro = Math.floor((TUNE.treasureMin / 4) + roll(state) * 20);
      return 'rv-checkpoint';
    }
    /* ---- Sterminio dei goblin -------------------------------------------
     * Authored outcomes (spec F1–F6). Damage here is HP on a positional
     * target; alertness states reuse the cassa flags (campoAllertato/alarm
     * applies −10pp to F4 bounds via groupScore). */
    case 'gob-tracce-per':
      if (verdict === 'bigwin' || verdict === 'win') {
        state.flags.push('bonusStealth');
        pushLog(state, { kind: 'INFO', text: 'Fresh tracks heading north. You know how to approach (Stealth bonus).' });
      } else if (verdict === 'almost') {
        state.flags.push('bonusStealthPiccolo');
        pushLog(state, { kind: 'INFO', text: 'Some confused signs. Better than nothing.' });
      } else if (verdict === 'epicfail') {
        /* r008 (2026-10-19): the epicfail is the crash-down through dead
         * branches — the wired −10 HP (v3 ruling) stays, the log names
         * the cause the verdict text implies. */
        positionalDamage(state, 10, node.title);
        pushLog(state, { kind: 'INFO', text: 'The dead branches tear you on the way down. (−10 HP)' });
      } else {
        pushLog(state, { kind: 'INFO', text: 'The wood stays silent.' });
      }
      return 'gob-accampamento';
    case 'gob-tracce-perfor':
      if (success) {
        pushLog(state, { kind: 'INFO', text: 'From above you see what stays invisible from the ground: a hiding place under a too-regular weave of branches.' });
        return 'gob-bottino';
      }
      positionalDamage(state, 10, node.title);
      pushLog(state, {
        kind: 'INFO',
        text: verdict === 'epicfail'
          ? 'The fall costs you. (−10 HP)'
          : 'The climb costs you. (−10 HP)',
      });
      return 'gob-accampamento';
    case 'gob-stealth':
      if (verdict === 'bigwin' || verdict === 'win') {
        state.flags.push('vantaggioGrande');
        pushLog(state, { kind: 'INFO', text: 'You position yourselves behind them. You will strike first.' });
      } else if (verdict === 'almost') {
        state.flags.push('vantaggioPiccolo');
        pushLog(state, { kind: 'INFO', text: 'A broken branch costs you the perfect vantage.' });
      } else {
        if (!state.flags.includes('campoAllertato')) state.flags.push('campoAllertato');
        state.alarm = true;
        pushLog(state, { kind: 'INFO', text: 'Stones roll under your feet. The camp has seen you.' });
      }
      return 'gob-combattimento';
    case 'gob-assalto':
      if (verdict === 'bigwin' || verdict === 'win') {
        state.flags.push('vantaggioPiccolo');
        pushLog(state, { kind: 'INFO', text: 'Breaking the line, the first strike is yours.' });
      } else if (verdict === 'epicfail') {
        positionalDamage(state, 5, node.title);
        pushLog(state, { kind: 'INFO', text: 'You slam into the palisades. No vantage — and aching bones.' });
      } else {
        pushLog(state, { kind: 'INFO', text: 'The charge dies in the mud. No vantage.' });
      }
      return 'gob-combattimento';
    case 'gob-incalza-check':
      /* v2: the toll is generic `upfrontDamage` — applied before this switch.
         If they still escape, they come back bloodied and scattered: the
         ambush is MILDER than letting them flee rested. */
      if (verdict === 'bigwin' || verdict === 'win') {
        state.flags.push('sterminio');
        pushLog(state, { kind: 'INFO', text: 'You catch them on the ridge. None remains.' });
      } else if (verdict === 'almost') {
        state.flags.push('agguatoMite');
        pushLog(state, { kind: 'INFO', text: 'They escape by a breath, wounded and scattered. They will be a shadow on the way back.' });
      } else {
        state.flags.push('agguatoMite');
        pushLog(state, { kind: 'INFO', text: 'They flee among the rocks, laughing. They will be waiting on the way back.' });
      }
      return 'gob-esplora-extra';
    case 'gob-cerca': {
      state.exploreTurn += 1;
      const dmg = TUNE.exploreBaseDamage * state.exploreTurn;
      positionalDamage(state, dmg, node.title);
      const creak = GOBLIN_F6_CREAK_LINES[Math.min(state.exploreTurn, GOBLIN_F6_CREAK_LINES.length) - 1];
      pushLog(state, { kind: 'INFO', text: creak });
      if (verdict === 'bigwin' || verdict === 'win') {
        state.gold += TUNE.exploreLootGold;
        state.loot.push('camp loot');
        pushLog(state, { kind: 'LOOT', text: `Under the tarp, something still worth taking. (+${TUNE.exploreLootGold} gold)` });
      } else if (verdict === 'almost') {
        state.gold += Math.floor(TUNE.exploreLootGold / 2);
        pushLog(state, { kind: 'INFO', text: 'A miserable loot — and one more wound.' });
      } else {
        pushLog(state, { kind: 'INFO', text: 'Only ash and thorns.' });
      }
      return 'gob-esplora-extra';
    }
    case 'rv-camera':
      if (verdict === 'bigwin') {
        const gain = TUNE.deepChamberMin + Math.floor(roll(state) * TUNE.deepChamberSpan);
        state.bottinoOro += gain;
        state.loot.push('ancient relic');
        pushLog(state, { kind: 'LOOT', text: `The vault was untouched: +${gain} gold and an ancient relic.` });
        addDays(state, 1, 'emptying the deep chamber.');
      } else if (success) {
        const gain = TUNE.deepChamberMin + Math.floor(roll(state) * TUNE.deepChamberSpan);
        state.bottinoOro += gain;
        pushLog(state, { kind: 'LOOT', text: `The vault pays: +${gain} gold.` });
        addDays(state, 1, 'emptying the deep chamber.');
      } else {
        addDays(state, 1 + Math.floor(roll(state) * 2), 'the vault was already almost empty — digging does not pay.');
        pushLog(state, { kind: 'INFO', text: 'Someone had been there before you: only scraps remain.' });
      }
      return 'rv-ritorno-evento';
    default:
      return 'ritorno';
  }
}

/**
 * Epilogue composer: the outcome line must account the *cost*, not only the
 * result — who died, what was dropped, who was saved. Peak-end research says
 * this ending line is what the run will be remembered as.
 */
function composeEndingText(state: QuestRunState, base: string): string {
  const pieces = [base];
  const dead = state.party.filter((m) => m.dead).map((m) => m.name);
  const aliveCount = state.party.filter((m) => !m.dead).length;
  if (dead.length > 0) {
    pieces.push(`${dead.join(', ')} did not come back.`);
  }
  if (aliveCount > 0) {
    pieces.push(`${aliveCount} of you return.`);
  }
  if (state.questId === 'rovine') {
    // Report-style epilogue (mockup): the cost continues after the quest —
    // days spent, human-days burned, wounded members unavailable.
    pieces.push(`Duration: ${state.days} days.`);
    pieces.push(`Man-days used: ${state.party.length} × ${state.days} = ${state.party.length * state.days}.`);
    if (state.bottinoOro > 0) {
      pieces.push(`Loot brought back: ${state.bottinoOro} gold.`);
    }
    if (state.flags.includes('tesoroPerso')) {
      pieces.push('The treasure stayed in the ruins.');
    }
    const wounded = state.party.filter((m) => !m.dead && m.wounded).map((m) => m.name);
    for (const name of wounded) {
      pieces.push(`${name}: WOUNDED — unavailable for ${TUNE.rovineWoundedRecoveryDays} days.`);
    }
    if (state.flags.includes('viandanteAiutato')) {
      pieces.push('The traveler you healed paid you more than due.');
    } else if (state.flags.includes('viandantePortato')) {
      pieces.push('The traveler you brought to the village owes you a favor.');
    } else if (state.flags.includes('viandanteLasciato')) {
      pieces.push('The wounded man on the road stayed where you left him.');
    }
    const extra = state.loot.filter((l) => l !== 'ruins treasure');
    if (extra.length > 0) {
      pieces.push(`You bring home: ${extra.join(', ')}.`);
    }
    return pieces.join(' ');
  }
  if (state.questId === 'goblin') {
    if (state.flags.includes('trofeoPerso')) {
      pieces.push('The goblin trophy stayed in the ditch.');
    }
    const extra = state.loot.filter((l) => l !== 'goblin trophy');
    if (extra.length > 0) {
      pieces.push(`You bring home: ${extra.join(', ')}.`);
    }
    if (state.xp > 0) {
      pieces.push(`Experience: +${state.xp} XP.`);
    }
    return pieces.join(' ');
  }
  if (state.flags.includes('cassaPersa')) {
    pieces.push('The seed crate stayed at the camp.');
  }
  if (state.flags.includes('prigionieroLibero')) {
    pieces.push('The prisoner you freed is with you.');
  }
  const extra = state.loot.filter((l) => l !== 'seed crate');
  if (extra.length > 0) {
    pieces.push(`You bring home: ${extra.join(', ')}.`);
  }
  return pieces.join(' ');
}

/** Log kinds that describe physical consequences of a roll. */
const CHECK_CONSEQUENCE_KINDS = new Set(['WOUND', 'DEATH', 'DEATH_SAVE', 'INTERCEPT', 'HARM']);

/**
 * Attach the post-roll explanation to the just-resolved check: the harms
 * rolled during resolution (`preMark..outcomeMark`) followed by the authored
 * consequence lines the outcome application logged (`outcomeMark..now`).
 */
function setCheckOutcomeText(state: QuestRunState, preMark: number, outcomeMark: number): void {
  const resolved = state.checkQueue[state.checkQueue.length - 1];
  if (!resolved) return;
  // Harms this check owns (risk rolls + toll) attach to it now — harms
  // generated LATER in the chain (ambush, incidents) stay pending and
  // surface as an ambient beat when the action closes.
  drainHarmsIntoLastCheck(state);
  const window = state.log.slice(preMark);
  const harmLines = window.filter((e) => CHECK_CONSEQUENCE_KINDS.has(e.kind)).map((e) => e.text);
  const authoredLines = state.log
    .slice(outcomeMark)
    .filter((e) => e.kind !== 'NODE' && !CHECK_CONSEQUENCE_KINDS.has(e.kind))
    .map((e) => e.text);
  resolved.harmLines = harmLines;
  resolved.deathLines = window.filter((e) => e.kind === 'DEATH').map((e) => e.text);
  resolved.authoredText = authoredLines.join(' ');
  resolved.outcomeText = [...harmLines, ...authoredLines].join(' ');
}

/**
 * Arrive at a node under v27 frontier semantics (PLAN-025 T-004): choice and
 * combat nodes commit a 'waiting' frontier (player input), info and harm
 * commit a 'pending' frontier that matures at `tick + nodeTicks` (the scene
 * lands on arrival, the effects at maturation — the F7 relief reads BEFORE
 * the ambush), check nodes resolve inline as the consequence of a committed
 * choice, end nodes resolve the run.
 */
function arriveNode(state: QuestRunState, nodeId: string, tick: number): void {
  state.nowTick = tick;
  if (journeyDeferToPin(state, nodeId)) return;
  // Iterative, bounded traversal: check/info/harm chains used to recurse.
  // A cycle in authored `next` links must degrade to a terminal state —
  // an infinite recursion here crashes the whole React tree with a
  // RangeError (mount flood → error boundary retry → page reload).
  let cursor: string | undefined = nodeId;
  for (let steps = 0; cursor; steps += 1) {
    if (steps >= TUNE.maxAutoSteps) {
      pushLog(state, { kind: 'INFO', text: `The path closed into a loop (${cursor}). The expedition returns to the village.` });
      endRun(state, 'survived', 'The path closed on itself: the expedition returned.');
      return;
    }
    const node = nodesFor(state)[cursor];
    if (!node) return;
    state.nodeId = cursor;
    state.frontierVersion += 1;
    state.visitedNodes.push(cursor);
    state.cursorVisitSeq += 1;
    pushLog(state, { kind: 'NODE', text: node.title });

    // Spotted sneaking past the guards: their patrol chases the party out —
    // the return costs a day.
    if (cursor === 'rv-ritorno-evento' && state.flags.includes('inseguiti')) {
      addDays(state, 1, 'shaking off the guards chasing you.');
    }

    // Combat nodes stop and wait for per-turn player input: each command
    // resolves one turn via the 'fight-turn' synthetic option. R-199: the
    // march TO the node costs `nodeTicks` — the frontier opens at readyAt,
    // then turns are immediate (the frontier is not re-armed inside a node).
    if (node.kind === 'combat') {
      state.combatTurn = 0;
      state.goblinLeft = node.combat?.enemies ?? 0;
      state.lastEvent = engineText(node.body);
      state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick + state.nodeTicks };
      journeyParkWaiting(state, cursor, tick);
      return;
    }

    // Check nodes resolve as soon as they are reached: the choice that led here
    // already committed the party; resolution is the consequence.
    if (node.kind === 'check') {
      const preMark = state.log.length;
      const result = resolveCheck(state, node);
      const outcomeMark = state.log.length;
      state.lastEvent = engineText(`${node.title} — ${result.verdict.toUpperCase()}.`);
      if (allDead(state)) {
        drainHarmsIntoLastCheck(state);
        endRun(state, 'wipe', 'The expedition was wiped out.');
        return;
      }
      cursor = applyCheckOutcome(state, node, result.verdict);
      setCheckOutcomeText(state, preMark, outcomeMark);
      // Same rule as submitCommand: an outcome toll that kills the last member is a wipe.
      if (allDead(state)) {
        endRun(state, 'wipe', 'The expedition was wiped out.');
        return;
      }
      continue;
    }

    // Info and harm nodes are timed beats, not decisions: arrival commits a
    // pending frontier and shows the scene; the node's effects land when the
    // frontier matures (matureNode). Only the clock crosses them (v27).
    if (node.kind === 'info' || node.kind === 'harm') {
      if (node.kind === 'info') pushLog(state, { kind: 'INFO', text: node.body });
      state.lastEvent = engineText(node.body ?? node.title);
      state.frontier = { status: 'pending', startedAt: tick, readyAt: tick + state.nodeTicks };
      return;
    }

    if (node.kind === 'end') {
      const lead = leader(state);
      if (state.questId === 'goblin') {
        // The trophy becomes the real reward only on return to town
        // (Director): held objective + living leader → gold; lost/dropped
        // trophy → quest failed, only XP (awarded in endRun).
        if (allDead(state)) {
          endRun(state, 'wipe', 'The expedition was wiped out.');
        } else if (state.objectiveDone && lead && !lead.dead) {
          state.gold += TUNE.trofeoGold;
          state.loot = state.loot.filter((l) => l !== 'goblin trophy');
          pushLog(state, { kind: 'LOOT', text: `The heads on the judge’s bench: +${TUNE.trofeoGold} gold.` });
          endRun(state, 'reward', 'The trophy is on the scales. The village breathes again.');
        } else {
          endRun(
            state,
            'survived',
            state.flags.includes('trofeoPerso')
              ? 'Empty-handed: the trophy stayed in the ditch. The goblins keep the wood.'
              : 'You return without completing the extermination. The goblins keep the wood.',
          );
        }
      } else if (allDead(state)) {
        endRun(state, 'wipe', 'The expedition was wiped out.');
      } else if (state.objectiveDone && lead && !lead.dead) {
        // Arriving at the end with the objective IS the secure event: TAKEN
        // only becomes SECURED here, after a route the player chose and rolled.
        endRun(
          state,
          'reward',
          state.questId === 'rovine'
            ? 'The ruins treasure is at the village. The quest is complete — reward earned.'
            : state.questId === 'gen'
              ? 'Objective brought back to the village. The quest is complete — reward earned.'
              : 'Seed crate brought back to the village. The quest is complete — reward earned.',
        );
      } else if (state.objectiveDone && (!lead || lead.dead)) {
        endRun(
          state,
          'survived',
          state.questId === 'rovine'
            ? 'The treasure returns to the village, but the leader is gone. The quest reward is lost.'
            : state.questId === 'gen'
              ? 'The objective returns to the village, but the leader is gone. The quest reward is lost.'
              : 'The crate returns to the village, but the leader is gone. The quest reward is lost.',
        );
      } else {
        endRun(
          state,
          'survived',
          state.questId === 'rovine'
            ? 'You return to the village without the treasure. The quest failed, but you are alive.'
            : state.questId === 'gen'
              ? 'You return to the village without the objective. The quest failed, but you are alive.'
              : 'You return to the village without the crate. The quest failed, but you are alive.',
        );
      }
    }

    // Choice nodes (and anything unknown) stop and wait for player input.
    // R-199: arrival also costs `nodeTicks` — the choice is VISIBLE at once
    // but committable only when the phase's own slot on the bar has come.
    // R-231: `immediate: true` intra-phase discoveries (e.g. `gob-bottino`)
    // carry weight 0 and unlock immediately on arrival (`readyAt = tick`).
    // PLAN-053: a journey run does not end at an end node — `journeyOutcome`
    // already opened ritorno and set the travel sentinel; do not re-arm a
    // waiting frontier on the end node. During ritorno an end node is road
    // content, not the terminal: restore the sentinel so the boundary can
    // still fire once the marker reaches the village.
    if (!state.ended && !(state.journey && node.kind === 'end')) {
      const waitTicks = node.kind === 'choice' && node.immediate ? 0 : state.nodeTicks;
      state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick + waitTicks };
      journeyParkWaiting(state, cursor, tick);
    } else if (state.journey && !state.ended && node.kind === 'end') {
      state.frontier = travelFrontier(tick);
    }
    return;
  }
}

/**
 * Resolve a matured pending node (PLAN-025 T-004): the node's authored
 * effects land now — the F7 router, ambush/incident damage — then the run
 * arrives at the authored next node. No-op while the frontier is not ready.
 */
function matureNode(state: QuestRunState, tick: number): void {
  state.nowTick = tick;
  const node = nodesFor(state)[state.nodeId];
  if (!node || state.frontier.status !== 'pending' || tick < state.frontier.readyAt) return;
  // The next node starts when THIS one matured (its readyAt), not when the
  // player looked: elapsed time pre-pays durations, so a late catch-up
  // consumes the whole matured chain instead of restarting the clock (v27).
  const maturedAt = state.frontier.readyAt;
  if (node.kind === 'info') {
    // Goblin F7 router: a clean extermination walks home — survivors wait
    // in ambush instead.
    arriveNode(state, node.id === 'gob-ritorno' && state.flags.includes('sterminio') ? 'gob-fine' : node.next ?? 'ritorno', maturedAt);
    return;
  }
  if (node.kind === 'harm') {
    if (node.id === 'gob-agguato') {
      // The ambush opens with dry damage on EVERYONE (Director 2026-10-06,
      // tunable): no slot roll — the whole party pays the entrance fee.
      for (const m of state.party) {
        if (!m.dead)
          applyHpDamage(
            state,
            m,
            TUNE.ambushFlatDamage +
              (state.flags.includes('agguatoPeggiore') ? TUNE.ambushPeggioreFlatBonus : 0),
            node.title,
          );
      }
      state.lastEvent = engineText('Arrows out of the undergrowth. They had been waiting.');
    } else if (node.id === 'rv-attrito') {
      // The unstable zone: no check can erase this cost (Director mockup —
      // "continuare deve costare qualcosa"). +1 day always, then a roll:
      // a wound worsens, or someone new is hurt, or luck holds.
      addDays(state, 1, 'crossing the unstable zone.');
      const candidates = state.party.filter((m) => !m.dead);
      const r = roll(state);
      if (r < 0.35 && candidates.some((m) => m.wounded)) {
        const victim = candidates.find((m) => m.wounded);
        if (victim) {
          const hpBefore = victim.hp;
          victim.hp = Math.max(1, victim.hp - TUNE.incidentWoundHpLoss);
          pushLog(state, { kind: 'HARM', text: `${victim.name}’s wound worsens in the unstable zone.` });
          recordHarm(state, victim.id, hpBefore - victim.hp, 'wound', hpBefore, victim.hp, node.title);
          state.lastEvent = engineText(`${victim.name} worsens: the zone does not forgive those already wounded.`);
        }
      } else if (r < 0.7) {
        const victim = candidates[Math.floor(roll(state) * candidates.length)];
        if (victim) {
          const hpBefore = victim.hp;
          victim.wounded = true;
          victim.hp = Math.max(1, victim.hp - TUNE.incidentWoundHpLoss);
          pushLog(state, { kind: 'HARM', text: `${victim.name} is wounded in the unstable zone.` });
          recordHarm(state, victim.id, hpBefore - victim.hp, 'wound', hpBefore, victim.hp, node.title);
          state.lastEvent = engineText(`The stone gives way under ${victim.name}: wounded. The cost of the passage.`);
        }
      } else {
        state.lastEvent = engineText('The zone creaks but holds: you pass unharmed — this time.');
      }
    } else {
      // Travel incident: direct, non-check harm — the bodyguard cannot intercept.
      if (roll(state) < TUNE.incidentChance) {
        const candidates = state.party.filter((m) => !m.dead);
        const victim = candidates[Math.floor(roll(state) * candidates.length)];
        if (victim) {
          const hpBefore = victim.hp;
          victim.wounded = true;
          victim.hp = Math.max(1, victim.hp - TUNE.incidentWoundHpLoss);
          pushLog(state, { kind: 'HARM', text: `The collapse hits ${victim.name}: wounded.` });
          recordHarm(state, victim.id, hpBefore - victim.hp, 'wound', hpBefore, victim.hp, node.title);
          state.lastEvent = engineText(`The collapse catches ${victim.name}. The rest of the road will be walked with a wound.`);
        }
      } else {
        state.lastEvent = engineText('The landslide passes a few metres away: fright, but no harm.');
      }
    }
    if (allDead(state)) {
      endRun(state, 'wipe', 'The expedition was wiped out.');
      return;
    }
    drainHarmsToAmbient(state);
    arriveNode(state, node.next ?? 'ritorno', maturedAt);
    return;
  }
  // Unknown pending node kind: never stall the run on it.
  arriveNode(state, node.next ?? 'ritorno', maturedAt);
}

/**
 * v27 catch-up (PLAN-025 T-004): consume every timed node matured by `tick`,
 * in order, stopping at the first frontier that needs the player. A 'waiting'
 * frontier never advances here — offline time cannot decide for the player.
 */
export function matureReady(state: QuestRunState, tick: number): QuestRunState {
  for (let steps = 0; !state.ended && state.frontier.status === 'pending' && tick >= state.frontier.readyAt; steps += 1) {
    if (steps >= TUNE.maxAutoSteps) {
      pushLog(state, { kind: 'INFO', text: `The path closed into a loop (${state.nodeId}). The expedition returns to the village.` });
      endRun(state, 'survived', 'The path closed on itself: the expedition returned.');
      break;
    }
    matureNode(state, tick);
  }
  return state;
}

/**
 * Resolve ONE player command at a 'waiting' frontier (PLAN-025 T-004, v27):
 * a decision choice, one combat turn, or the synthetic 'advance'. The command
 * commits at most the current node — a `CHECK:<id>` outcome resolves inline
 * (it is the consequence of the committed choice), then the run ARRIVES at
 * the next node and stops: pending nodes mature only via `matureReady(tick)`,
 * a new 'waiting' frontier waits for the next command. A command issued while
 * the frontier is still pending is rejected — time, not input, crosses it.
 * `opts.tick` is the caller's game tick (defaults to the frontier's own tick,
 * i.e. "no time has passed" for clock-less callers).
 */
export function submitCommand(
  state: QuestRunState,
  optionId: string,
  opts?: { useConsumable?: boolean; tick?: number; forceDie?: number; armedFlags?: ReadonlySet<string> },
): QuestRunState {
  if (state.ended) return state;
  if (state.frontier.status === 'pending') return state;
  /* Clock-less callers (lab `applyChoice`, legacy paths) command «as if
   *  always on time»: defaulting to `readyAt` keeps the pre-R-199 full-step
   *  semantics while a real clock (the hook passes `tickRef`) enforces the
   *  phase schedule — options commit only once their slice of the bar has
   *  passed. */
  const tick = opts?.tick ?? Math.max(state.frontier.startedAt, state.frontier.readyAt);
  state.nowTick = tick;
  if (tick < state.frontier.readyAt) return state;
  const nodes = nodesFor(state);
  const node = nodes[state.nodeId];
  if (!node) return state;
  // A new player action starts a new burst of checks — and a fresh harm
  // window: whatever the last action left was already presented/drained.
  state.checkQueue = [];
  state.recentHarms = [];
  state.pendingHarms = [];
  // info nodes expose a single synthetic «continue» action
  if (node.kind === 'info') {
    if (optionId !== 'advance') return state;
    arriveNode(state, node.next ?? 'ritorno', tick);
    drainHarmsToAmbient(state);
    return state;
  }
  // combat nodes advance one turn per action; the phase ends when the
  // enemies are dead or the authored turns are spent.
  if (node.kind === 'combat') {
    if (optionId !== 'fight-turn' || !node.combat) return state;
    /* R-196 atomic commit: the command was validated — armed action items
     * apply to the LIVE state before the turn resolves, whatever the roll
     * brings. `stepArmedActionItems` reads the flags and consumes only the
     * items that actually landed a mutation. */
    if (!combatDone(state, node)) stepArmedActionItems(state, opts?.armedFlags);
    resolveCombatTurn(state, node);
    if (state.ended) return state;
    if (combatDone(state, node)) {
      // Taking the camp IS taking the trophy — TAKEN ≠ SECURED (can still
      // be abandoned at the F7 ambush or lost on a wipe).
      if (node.id === 'gob-combattimento' && !state.objectiveDone) {
        state.objectiveDone = true;
        state.loot.push('goblin trophy');
        pushLog(state, { kind: 'LOOT', text: 'Goblin trophy taken — in hand, not safe yet.' });
      }
      const next =
        state.goblinLeft <= 0 ? node.combat.nextCleared : (node.combat.nextSurvivors ?? node.next);
      if (next) arriveNode(state, next, tick);
    }
    drainHarmsToAmbient(state);
    return state;
  }
  if (node.kind !== 'choice') return state;
  const option = node.options?.find((o) => o.id === optionId);
  if (!option) return state;
  if (option.requiresInfo && !state.info.includes(option.requiresInfo)) return state;
  if (option.requiresFlag && !state.flags.includes(option.requiresFlag)) return state;
  if (option.hiddenIfFlag && state.flags.includes(option.hiddenIfFlag)) return state;
  if (option.requiresTrait && !partyHasTrait(state, option.requiresTrait)) return state;
  if (option.hiddenIfTrait && partyHasTrait(state, option.hiddenIfTrait)) return state;
  if (option.costGold && state.gold < option.costGold) return state;
  if (option.consumesFlag && !state.flags.includes(option.consumesFlag)) return state;

  if (option.costGold) {
    state.gold -= option.costGold;
    // buying anything earns the merchant's tip once
    if (!state.info.includes('simbolo')) {
      state.info.push('simbolo');
      pushLog(state, { kind: 'INFO', text: 'The merchant: «these are no ordinary goblins… they carry a symbol».' });
    }
  }
  if (option.consumesFlag) {
    consumeFlag(state, option.consumesFlag);
  }
  if (option.grantsGold) {
    state.gold += option.grantsGold;
    pushLog(state, { kind: 'LOOT', text: `+${option.grantsGold} gold.` });
  }
  /* Goblin F2 (v3, Director 2026-10-18): «Recover the loot» is a single
   * take-it-all action — the stash's gold and the loot item land
   * together, no check, no leave option. */
  if (option.id === 'gob-prendi' && !state.loot.includes('war loot')) {
    state.loot.push('war loot');
    pushLog(state, { kind: 'LOOT', text: 'War loot from the hiding place.' });
  }
  if (option.grantsInfo && !state.info.includes(option.grantsInfo)) {
    state.info.push(option.grantsInfo);
  }
  if (option.costDays) {
    addDays(state, option.costDays, 'the choice made.');
  }
  if (option.sets) state.flags.push(option.sets);
  if (option.abandonsObjective) {
    dropObjective(state, 'the trophy stays in the ditch — the goblins let you pass.');
    state.flags.push('trofeoLasciato');
    pushLog(state, { kind: 'INFO', text: 'You throw the head into the ditch and run. The quest is lost.' });
  }
  pushLog(state, { kind: 'CHOICE', text: option.label });

  const next = option.next;
  if (next.startsWith('CHECK:')) {
    const checkNode = nodes[next.slice(6)];
    /* R-196 atomic commit: option + target check validated — the armed
     * action items fire before the roll and stay fired even on a failed
     * verdict (same synchronous commit; `choose` in the hook re-reads
     * `armedFlags` at call time so no stale closure is possible). The
     * heal/potion lines stay above `preMark` so the check summary only
     * reports the check's own consequences. */
    stepArmedActionItems(state, opts?.armedFlags);
    state.nodeId = checkNode.id;
    state.frontierVersion += 1;
    state.visitedNodes.push(checkNode.id);
    state.cursorVisitSeq += 1;
    const preMark = state.log.length;
    const result = resolveCheck(state, checkNode, opts?.useConsumable !== false, opts?.forceDie, opts?.armedFlags);
    // Only this check's lines, HARM included, and written again once the outcome
    // has applied its toll: the F5 pursuit damage lands in applyCheckOutcome, and
    // the summary must never say «no physical consequence» over it (R-106 playtest).
    const summarize = () => {
      const hurt = state.log
        .slice(preMark)
        .filter((e) => CHECK_CONSEQUENCE_KINDS.has(e.kind))
        .slice(-4)
        .map((e) => e.text)
        .join(' ');
      state.lastEvent = engineText(`${checkNode.title} — ${result.verdict.toUpperCase()}. ${hurt || 'No physical consequence.'}`);
    };
    summarize();
    if (allDead(state)) {
      drainHarmsIntoLastCheck(state);
      endRun(state, 'wipe', 'The expedition was wiped out.');
      return state;
    }
    const outcomeMark = state.log.length;
    const nextId = applyCheckOutcome(state, checkNode, result.verdict);
    setCheckOutcomeText(state, preMark, outcomeMark);
    summarize();
    // Outcome tolls (F6 search, F5 pursuit, F1 fall) can kill the last member:
    // that is a wipe, not a run that keeps waiting with nobody alive (R-106
    // playtest — previewOption then reduced an empty party and crashed /game).
    if (allDead(state)) {
      endRun(state, 'wipe', 'The expedition was wiped out.');
      return state;
    }
    arriveNode(state, nextId, tick);
  } else {
    arriveNode(state, next, tick);
  }
  drainHarmsToAmbient(state);
  return state;
}

/**
 * Legacy full-step API (lab cockpit, Monte Carlo, tests): resolve the command,
 * then mature every timed node instantly — identical net effect to the old
 * auto-chain, with the frontier machinery underneath.
 */
export function applyChoice(
  state: QuestRunState,
  optionId: string,
  opts?: { useConsumable?: boolean; forceDie?: number; armedFlags?: ReadonlySet<string> },
): QuestRunState {
  submitCommand(state, optionId, opts);
  return matureReady(state, Number.MAX_SAFE_INTEGER);
}

/** Options visible at the current node (filters info-gated options). R-199:
 *  `nowTick` lets the caller mark a waiting frontier's options locked while
 *  the phase's slot on the time bar has not arrived — visible, not feasible. */
export function availableOptions(state: QuestRunState, nowTick?: number): { id: string; label: string; detail: string; costGold?: number; disabled: boolean }[] {
  const node = nodesFor(state)[state.nodeId];
  // A pending frontier is a timed beat, not a decision — no input exists yet.
  if (!node || state.ended || state.frontier.status === 'pending') return [];
  const locked = nowTick !== undefined && nowTick < state.frontier.readyAt;
  if (node.kind === 'info') {
    return [{ id: 'advance', label: engineText('Continue'), detail: engineText('Go on.'), disabled: locked }];
  }
  if (node.kind === 'combat') {
    return [
      {
        id: 'fight-turn',
        label: engineText(`Fight — turn ${state.combatTurn + 1}`),
        detail: engineText(`${node.combat?.enemyName ?? 'Goblins'} standing: ${state.goblinLeft}. They answer blow for blow.`),
        disabled: locked,
      },
    ];
  }
  if (node.kind !== 'choice') return [];
  return (node.options ?? [])
    .filter(
      (o) =>
        (!o.requiresInfo || state.info.includes(o.requiresInfo)) &&
        (!o.requiresFlag || state.flags.includes(o.requiresFlag)) &&
        (!o.hiddenIfFlag || !state.flags.includes(o.hiddenIfFlag)) &&
        (!o.requiresTrait || partyHasTrait(state, o.requiresTrait)) &&
        (!o.hiddenIfTrait || !partyHasTrait(state, o.hiddenIfTrait)),
    )
    .map((o) => ({
      id: o.id,
      label: o.label,
      detail: o.detail,
      costGold: o.costGold,
      disabled: locked || (!!o.costGold && state.gold < o.costGold),
    }));
}

/**
 * Authored checks still ahead that accept consumable `flag` — the "save it
 * for later" surface (R-097). Same consumableBonusFor mapping as the resolver,
 * evaluated on a hypothetical state where the flag is still held. Ordered by
 * beat. `excludeCheckId` drops the check currently being previewed.
 */
export function consumableFutureChecks(
  state: QuestRunState,
  flag: string,
  excludeCheckId?: string,
): { nodeId: string; title: string; beat: number }[] {
  const nodes = nodesFor(state);
  const curBeat = nodes[state.nodeId]?.beat ?? 0;
  const hypothetical: QuestRunState = { ...state, flags: [flag] };
  return Object.values(nodes)
    .filter(
      (n) =>
        n.kind === 'check' &&
        n.id !== excludeCheckId &&
        (n.beat ?? 0) > curBeat &&
        consumableBonusFor(hypothetical, n)?.flag === flag,
    )
    .sort((a, b) => (a.beat ?? 0) - (b.beat ?? 0))
    .map((n) => ({ nodeId: n.id, title: n.title, beat: n.beat ?? 0 }));
}

export { QUESTS };

/* ------------------------------------------------------------------ */
/* Overlay identity (PLAN-040 T-003a)                                  */
/* ------------------------------------------------------------------ */

/**
 * Every check record of the run that overlay controllers may still reference
 * — the presentation queue plus `lastCheck` (which may have been evicted
 * from the queue by a later command). `lastCheck` is appended only when it
 * is not already the queue's own tail entry.
 */
export function checkHistory(run: QuestRunState): ResolvedCheck[] {
  const queue = Array.isArray(run.checkQueue) ? run.checkQueue.filter((c) => !!c && typeof c === 'object') : [];
  const last = run.lastCheck;
  if (last && !queue.includes(last)) queue.push(last);
  return queue;
}

/**
 * The highest `checkSeq` whose presentation is over — checks settled because
 * the cursor has since entered another node (`visitSeq < cursorVisitSeq`).
 * Checks resolved on the CURRENT visit (a held check, a run-ending one) are
 * never counted settled by this predicate.
 */
export function highestSettledCheckSeq(run: QuestRunState): number {
  return checkHistory(run).reduce(
    (max, c) => ((c.visitSeq ?? 0) < run.cursorVisitSeq ? Math.max(max, c.checkSeq ?? 0) : max),
    0,
  );
}

const CHECK_ID_SEQ = /^chk-(\d+)$/;

/**
 * PLAN-040 T-003a: backfill and validate the overlay-identity fields on a
 * persisted run (added after engine v2 shipped — legacy saves carry plain
 * `chk-N` ids and none of `checkSeq`/`visitSeq`/`beatIndex`/`cursorVisitSeq`/
 * `dismissedUpTo`). Mutates the run in place, deterministic, replay-safe.
 *
 * Rules (debate r007):
 * - `cursorVisitSeq` backfills to `visitedNodes.length` — the counter and the
 *   history are 1:1 since the start node counts as visit 1.
 * - `checkSeq` backfills from the `chk-N` id when valid; duplicate or
 *   malformed sequences are NOT repaired by inference — the whole check
 *   history is re-sequenced deterministically in queue order, starting
 *   AFTER the run allocator's high mark (fresh seq space, never reused).
 * - `visitSeq` of unknown provenance becomes 0 — the record is treated as
 *   settled history, and `dismissedUpTo` absorbs it via the max() below.
 * - `dismissedUpTo` lands at `max(persisted, highestSettled)` — never
 *   lowered: a remount mid-hold must not resurface an already-shown toast.
 */
export function normalizeRunOverlayIdentity(run: QuestRunState): QuestRunState {
  if (!Number.isFinite(run.cursorVisitSeq) || run.cursorVisitSeq < 1) {
    run.cursorVisitSeq = Math.max(1, Array.isArray(run.visitedNodes) ? run.visitedNodes.length : 1);
  }
  if (!Number.isFinite(run.dismissedUpTo) || run.dismissedUpTo < 0) {
    run.dismissedUpTo = 0;
  }
  const checks = checkHistory(run);
  const seqs = checks.map((c) => {
    if (Number.isInteger(c.checkSeq) && c.checkSeq > 0) return c.checkSeq;
    const m = CHECK_ID_SEQ.exec(typeof c.id === 'string' ? c.id : '');
    return m ? Number.parseInt(m[1], 10) : Number.NaN;
  });
  const valid =
    checks.length > 0 &&
    seqs.every((s) => Number.isInteger(s) && s > 0) &&
    new Set(seqs).size === seqs.length;
  if (checks.length && !valid) {
    /* Re-sequence deterministically in queue order, in a seq space that the
     * allocator can never reach — order is only as meaningful as the queue
     * itself; nothing is inferred beyond it. */
    const next = Math.max(0, Math.floor(run.checkSeq ?? 0)) + 1;
    checks.forEach((c, i) => {
      c.checkSeq = next + i;
      c.id = `chk-${next + i}`;
    });
  } else {
    checks.forEach((c, i) => {
      c.checkSeq = seqs[i];
    });
  }
  checks.forEach((c, i) => {
    if (!Number.isFinite(c.visitSeq)) c.visitSeq = 0;
    if (!Number.isFinite(c.beatIndex)) c.beatIndex = i;
  });
  const maxSeq = checks.reduce((m, c) => Math.max(m, c.checkSeq), 0);
  if (!Number.isFinite(run.checkSeq) || run.checkSeq < maxSeq) run.checkSeq = maxSeq;
  run.dismissedUpTo = Math.max(run.dismissedUpTo, highestSettledCheckSeq(run));
  return run;
}

/* ------------------------------------------------------------------ */
/* Quest journey integration (PLAN-053 T-003, artifact r011)            */
/*                                                                     */
/* The journey engine (`questJourneyEngine.ts`) owns the travel fasi    */
/* schedule — pins, parking, maturations, phase boundaries — through    */
/* injected host ops implemented here, where the private node machinery */
/* (arriveNode/matureNode/submitCommand/endRun) lives.                   */
/* ------------------------------------------------------------------ */

/**
 * Pin-defer rule (artifact r011, extended in T-004): inside a travel fase a
 * node carrying its OWN authored pin that the marker has not reached yet
 * defers — the scheduler opens it at the crossing. A node without a pin
 * INHERITS the reaching pin and opens immediately when it shares the
 * current fase; a node attributed to a DIFFERENT fase never arrives during
 * a travel leg — the party stays on the road (the route is the frontier).
 * During `svolgimento` the first `ritorno`-attributed node the scenario
 * reaches IS the phase boundary: the POI verdict freezes
 * (`journeyOutcome`), the journal switches to ritorno and the node defers
 * to its pin like any other return beat. Returns true when the arrival
 * was deferred (frontier dropped to the travel sentinel).
 */
function journeyDeferToPin(state: QuestRunState, nodeId: string): boolean {
  const jr = state.journey;
  if (!jr) return false;
  const fase = jr.journal.currentFase;
  const node = nodesFor(state)[nodeId];
  if (fase === 'svolgimento') {
    if (!node || (node.fase ?? 'svolgimento') !== 'ritorno') return false;
    /* Boundary crossing: freeze the POI verdict and open the return leg —
     * same lifecycle write `journeyOutcome` performs on an end node. */
    const lead = leader(state);
    journeyOutcome(
      state,
      allDead(state) ? 'wipe' : state.objectiveDone && lead && !lead.dead ? 'reward' : 'survived',
      'The work at the site is done — the party turns toward home.',
    );
    if (state.ended) return true;
    return journeyDeferToPin(state, nodeId);
  }
  const plan = jr.snapshot.fasePlans[fase].find((p) => p.nodeId === nodeId);
  if (plan) {
    const entry = jr.journal.beats.find((b) => b.nodeId === nodeId);
    if (entry && entry.openedAtTick !== null) {
      /* The chain reached an already-opened pinned beat — the arrival IS
       * the beat's discharge (an end node's verdict overwrite, an info's
       * effects already shown at its pin). Mark it applied so the
       * scheduled maturation does not re-run the node a second time. */
      if (entry.kind === 'pending' && entry.appliedAtTick === null) {
        entry.appliedAtTick = state.nowTick ?? null;
      }
      return false;
    }
    state.frontier = travelFrontier(state.nowTick ?? state.frontier.startedAt);
    return true;
  }
  /* Chain-end convention: inside a travel fase a `next`/goto target that
   * resolves to no node keeps the party on the road — the route itself is
   * the frontier. Without this a dangling target would leave a matured
   * pending frontier behind and `matureReady` would spin on it. */
  if (!node) {
    state.frontier = travelFrontier(state.nowTick ?? state.frontier.startedAt);
    return true;
  }
  /* Fase attribution (T-004): an unpinned node tagged with the current fase
   * inherits the reaching pin and arrives; a node of another fase is
   * out-of-leg content — the marker keeps walking and the node waits on
   * the road (andata content never skips into the POI early; svolgimento
   * content never re-opens on the way home). */
  if ((node.fase ?? 'svolgimento') !== fase) {
    state.frontier = travelFrontier(state.nowTick ?? state.frontier.startedAt);
    return true;
  }
  return false;
}

/** Waiting beat opens: the party reaches a decision/combat node — the
 *  normal arrival path makes the frontier interactive. The beat is
 *  already marked `openedAtTick` so the pin-defer lets it through. */
function journeyOpenWaitingBeat(state: QuestRunState, nodeId: string, tick: number): void {
  arriveNode(state, nodeId, tick);
}

/**
 * Park registration for UNPINNED waiting arrivals (T-004): a chain node
 * that inherits the reaching pin arrives normally — when it commits a
 * waiting frontier during a travel leg the marker must freeze on it, or
 * the route would keep filling while a decision waits. Pinned beats are
 * already parked by the scheduler before `openWaitingBeat`, so the guard
 * never double-registers.
 */
function journeyParkWaiting(state: QuestRunState, nodeId: string, tick: number): void {
  const j = state.journey?.journal;
  if (!j || (j.currentFase !== 'andata' && j.currentFase !== 'ritorno')) return;
  if (j.parkedNodeId !== null) return;
  j.parkedNodeId = nodeId;
  j.parkedAtTick = tick;
}

/** Pending beat opens: the scene shows now (node title/body, lastEvent);
 *  its authored effects land at `resolvedAtTick` via maturePendingBeat.
 *  `nodeId`/`frontier` stay untouched — they belong to the run's single
 *  content cursor (`matureNode` resolves `state.nodeId` against the
 *  frontier's node): a beat presenting while a chain is mid-flight must
 *  not hijack the in-flight node. */
function journeyPresentPendingBeat(state: QuestRunState, nodeId: string, tick: number): void {
  const node = nodesFor(state)[nodeId];
  if (!node) return;
  state.nowTick = tick;
  state.visitedNodes.push(nodeId);
  state.cursorVisitSeq += 1;
  pushLog(state, { kind: 'NODE', text: node.title });
  if (node.kind === 'info') pushLog(state, { kind: 'INFO', text: node.body });
  state.lastEvent = engineText(node.body ?? node.title);
}

/**
 * Pending beat matures at `tick`: apply the node's authored effects
 * through the SAME semantics the timed frontier uses — info/harm via a
 * matured `matureNode`, checks resolving inline like the arrival branch.
 * A `next` chain then defers or arrives per the pin rule.
 */
function journeyMaturePendingBeat(state: QuestRunState, nodeId: string, tick: number): void {
  const node = nodesFor(state)[nodeId];
  if (!node || state.ended) return;
  state.nowTick = tick;
  state.nodeId = nodeId;
  if (node.kind === 'check') {
    state.frontierVersion += 1;
    const preMark = state.log.length;
    const result = resolveCheck(state, node);
    const outcomeMark = state.log.length;
    state.lastEvent = engineText(`${node.title} — ${result.verdict.toUpperCase()}.`);
    if (allDead(state)) {
      drainHarmsIntoLastCheck(state);
      endRun(state, 'wipe', 'The expedition was wiped out.');
      return;
    }
    const nextId = applyCheckOutcome(state, node, result.verdict);
    setCheckOutcomeText(state, preMark, outcomeMark);
    if (allDead(state)) {
      endRun(state, 'wipe', 'The expedition was wiped out.');
      return;
    }
    arriveNode(state, nextId, tick);
    drainHarmsToAmbient(state);
    return;
  }
  state.frontier = { status: 'pending', startedAt: tick, readyAt: tick };
  matureNode(state, tick);
  // A beat whose `next` resolves nowhere (unmapped fallback) leaves the
  // swapped matured frontier behind — restore the travel sentinel so the
  // run never stalls on it.
  if (!state.ended && state.frontier.status === 'pending' && state.frontier.readyAt <= tick) {
    state.frontier = travelFrontier(tick);
  }
}

/** Andata complete: the engine takes over at the POI — arrival at the
 *  frozen svolgimento entry node (fase already switched by the caller, so
 *  the pin-defer is off). */
function journeyEnterSvolgimento(state: QuestRunState, tick: number): void {
  const jr = state.journey;
  if (!jr) return;
  arriveNode(state, jr.snapshot.svolgimentoEntryNodeId, tick);
}

/** Ritorno complete: the party reaches the village — terminal arrival.
 *  The frozen POI verdict becomes the outcome (encumbered loot banks);
 *  party state applied what the road did to it along the way. */
function journeyArriveHome(state: QuestRunState, tick: number): void {
  state.nowTick = tick;
  state.terminalKind = 'returnWithSurvivors';
  state.lastFase = 'ritorno';
  state.settledAtTick = tick;
  state.outcomeResolvedAtTick = state.outcomeResolvedAtTick ?? tick;
  finishRun(state, state.verdictAtPoi ?? 'survived', 'The expedition is back at the village.');
}

/** Waiting beat resolves via the normal command path (choice/combat turn). */
function journeyResolveWaiting(
  state: QuestRunState,
  _nodeId: string,
  optionId: string,
  tick: number,
  opts?: { useConsumable?: boolean; forceDie?: number; armedFlags?: ReadonlySet<string> },
): void {
  submitCommand(state, optionId, { tick, useConsumable: opts?.useConsumable, forceDie: opts?.forceDie, armedFlags: opts?.armedFlags });
}

/** The host seam the journey engine drives — single instance per module. */
const JOURNEY_ENGINE_OPS: JourneyEngineOps = {
  openWaitingBeat: journeyOpenWaitingBeat,
  presentPendingBeat: journeyPresentPendingBeat,
  maturePendingBeat: journeyMaturePendingBeat,
  enterSvolgimento: journeyEnterSvolgimento,
  arriveHome: journeyArriveHome,
  resolveWaiting: journeyResolveWaiting,
};

/**
 * Attach the journey runtime to a fresh run (launch-time, once — artifact
 * r011 "frozen at launch"). The initial frontier becomes the travel
 * sentinel; pinned beats open as the marker crosses them. Idempotent.
 */
export function attachQuestJourney(state: QuestRunState, spec: QuestJourneyLaunchSpec): QuestRunState {
  if (state.journey) return state;
  state.journey = buildJourneyRuntime(spec);
  state.nowTick = spec.launchedAtTick;
  state.frontier = travelFrontier(spec.launchedAtTick);
  return state;
}

/**
 * Drive a journey-enabled run's travel clock to `t1` — the discrete-event
 * loop (pins → maturations → boundary, park accounting, watermark). During
 * svolgimento it only tracks the watermark: the scenario engine owns the
 * clock there (`matureReady`/`submitCommand` as usual). No-op on legacy
 * runs and on `t1 <= processedUpToTick`; throws if `t1` is behind the
 * watermark.
 */
export function advanceJourneyRun(state: QuestRunState, t1: number): QuestRunState {
  advanceJourney(state, t1, JOURNEY_ENGINE_OPS);
  return state;
}

/**
 * Resolve a parked journey decision at `tick`: park accounting, the host
 * resolution path, then the idempotent drain-at-T in canonical order —
 * before any advance beyond T. During svolgimento (or for legacy runs)
 * callers keep using `submitCommand` directly.
 */
export function resolveJourneyRunDecision(
  state: QuestRunState,
  optionId: string,
  tick: number,
  opts?: { useConsumable?: boolean; forceDie?: number; armedFlags?: ReadonlySet<string> },
): QuestRunState {
  state.nowTick = tick;
  resolveJourneyDecision(state, optionId, tick, JOURNEY_ENGINE_OPS, opts);
  return state;
}

/* ------------------------------------------------------------------ */
/* DAG-validator edge probe (PLAN-053 T-004)                            */
/*                                                                      */
/* The validator needs the REAL destination set of every node — the     */
/* declarative fields are static, but legacy check nodes route through  */
/* the id-keyed `applyNodeOutcome` switch, opaque to static reading.    */
/* The probe drives `applyCheckOutcome` over all five verdicts on       */
/* throwaway run states, twice: clean and `campoSveglio`-flagged (the   */
/* INSIDE_CHECKS → 'risveglio' hijack only fires on a waking camp).    */
/* ------------------------------------------------------------------ */

/** The five verdicts `resolveCheck` can produce — the probe's sweep. */
const JOURNEY_PROBE_VERDICTS: readonly Verdict[] = ['epicfail', 'fail', 'almost', 'win', 'bigwin'];

/**
 * State-dependent destinations the probe cannot enumerate per-verdict:
 * `matureNode`'s `gob-ritorno` router branches on the `sterminio` flag,
 * not on a verdict. Mirrors the line `node.id === 'gob-ritorno' &&
 * flags.includes('sterminio') ? 'gob-fine' : node.next` — drift-checked by
 * `questJourneyAuthoring.test.ts`, which drives the real router on both
 * flag states and asserts every destination is declared here or in
 * `node.next`.
 */
export const JOURNEY_ROUTE_EXTRAS: Readonly<Record<string, readonly string[]>> = {
  'gob-ritorno': ['gob-fine'],
};

/** Every id a `GotoSpec` may route to (plain id, or branches + else). */
function gotoSpecTargetsOf(spec: GotoSpec): string[] {
  if (typeof spec === 'string') return [spec];
  return [...spec.branches.map((b) => b.then), spec.else];
}

/** Probe instance counter — registry ids must be unique per call. */
let journeyProbeSeq = 0;

/** A minimal probe run — a fully shaped state the outcome switch can
 *  legally mutate. `extraFlags` seeds camp-alertness variants. */
function journeyProbeState(nodes: Record<string, QuestNode>, startNode: string, extraFlags: readonly string[]): QuestRunState {
  const state = createRun({
    party: {
      members: [
        { id: 'probe-lead', name: 'Probe', role: 'leader', hp: 999, stats: { str: 50, con: 50, agi: 50, perc: 50, int: 50, cha: 50 } },
      ],
    },
    seed: 1,
    questId: 'gen',
    scenarioInstance: {
      instanceId: `qsi-journey-probe-${(journeyProbeSeq += 1)}`,
      questId: 'gen',
      scenarioHash: 'journey-probe',
      nodes,
      startNode,
    },
  });
  state.flags.push(...extraFlags);
  return state;
}

/**
 * The destination set the DAG validator reasons over: every node id a
 * node can route to under the real engine. Declared edges (`next`,
 * options — `CHECK:<id>` resolved to the check node — combat routes,
 * `verdictTable` gotos) are collected statically; legacy check nodes are
 * probed live per verdict; state-dependent router specials come from
 * {@link JOURNEY_ROUTE_EXTRAS}. Targets that resolve to no node (the
 * `?? 'ritorno'` magic fallback on maps without one) are reported too —
 * the validator treats them as road-sentinel terminals, not errors.
 */
export function probeQuestJourneyEdges(
  nodes: Record<string, QuestNode>,
  startNode: string,
): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  const add = (from: string, to: string | undefined) => {
    if (!to) return;
    (out[from] ??= new Set<string>()).add(to);
  };
  for (const node of Object.values(nodes)) {
    if (node.next) add(node.id, node.next);
    for (const opt of node.options ?? []) {
      add(node.id, opt.next.startsWith('CHECK:') ? opt.next.slice('CHECK:'.length) : opt.next);
    }
    if (node.combat?.nextCleared) add(node.id, node.combat.nextCleared);
    if (node.combat?.nextSurvivors) add(node.id, node.combat.nextSurvivors);
    if (node.verdictTable) {
      for (const spec of Object.values(node.verdictTable)) {
        if (spec) for (const t of gotoSpecTargetsOf(spec.goto)) add(node.id, t);
      }
    } else if (node.kind === 'check') {
      for (const flags of [[], ['campoSveglio']] as const) {
        const probe = journeyProbeState(nodes, startNode, flags);
        for (const verdict of JOURNEY_PROBE_VERDICTS) {
          add(node.id, applyCheckOutcome(probe, node, verdict));
        }
      }
    }
    for (const extra of JOURNEY_ROUTE_EXTRAS[node.id] ?? []) add(node.id, extra);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}
