/**
 * questRun — run engine for the S1 lab quest «La cassa delle sementi».
 *
 * Quest-specific state machine, deliberately NOT a general engine.
 * Implements the Director-approved risk model (desiderata rev.2):
 * verdict → per-slot wound/death risk, bodyguard interception,
 * 5% death save, wipe = lose everything, leader alive = reward.
 */

import { DEFAULT_QUEST_SKILL_CHECK_CONFIG } from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { resolveStashLoadout } from '@/balancing/config/idleVillage/quests/questStash';
import { PARTY_PRESETS, PRIMARY_STATS, SCENARIO_NODES, START_NODE } from './questScenario';
import {
  ROVINE_NODES,
  ROVINE_PRESETS,
  ROVINE_PRIMARY_STATS,
  ROVINE_START_NODE,
} from './questScenarioRovine';
import {
  GOBLIN_NODES,
  GOBLIN_PRESETS,
  GOBLIN_PRIMARY_STATS,
  GOBLIN_START_NODE,
} from './questScenarioGoblin';
import type { LabMember, LabStat, PartyPreset, QuestNode, Verdict } from './questScenario';

/** The authored S1 lab quests. 'cassa' = infiltration (agi/perc,
 *  alertness states); 'rovine' = attrition gauntlet (str/con, days & HP);
 *  'goblin' = combat quest (str, positional targeting, HP pools). */
export type QuestId = 'cassa' | 'rovine' | 'goblin';

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
    nodes: ROVINE_NODES,
    presets: ROVINE_PRESETS,
    primaryStats: ROVINE_PRIMARY_STATS,
    startNode: ROVINE_START_NODE,
  },
  goblin: {
    nodes: GOBLIN_NODES,
    presets: GOBLIN_PRESETS,
    primaryStats: GOBLIN_PRIMARY_STATS,
    startNode: GOBLIN_START_NODE,
  },
};

/** The active quest's authored node map. */
export function nodesFor(state: QuestRunState): Record<string, QuestNode> {
  return QUESTS[state.questId].nodes;
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
  /** Italian log lines describing the harms (log drawer + aria-live only). */
  harmLines: string[];
  /** Non-harm consequence lines (loot, flags, kills…) — the authored part of
   *  the outcome, shown on the verdict card without duplicating harms. */
  authoredText: string;
  /** memberId → chance-per-hit % at resolution time — the HUD renders this
   *  snapshot, never recomputing `positionalWeights` itself. */
  exposure: Record<string, number>;
  /** Enemies killed by this resolution (combat turns only). */
  kills?: number;
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

function applyHpDamage(state: QuestRunState, target: RuntimeMember, amount: number, source?: string): void {
  const hpBefore = target.hp;
  target.hp -= amount;
  if (target.hp <= 0) {
    target.hp = 0;
    target.dead = true;
    state.log.push({
      kind: 'DEATH',
      text: `${target.name} cade, e non si rialza più${source ? ` — su «${source}»` : ''}.`,
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
      ? `${target.name} regge solo perché non c’è altro da fare`
      : frac < 0.35
        ? `${target.name} barcolla: c’è sangue sul fianco`
        : frac <= 0.7
          ? `${target.name} si piega, poi si rimette dritto`
          : `${target.name} serra i denti e resta in piedi`;
  state.log.push({ kind: 'HARM', text: `${line} (−${amount} HP).` });
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
  perc: 'Percezione',
  int: 'Intelligenza',
  str: 'Forza',
  con: 'Costituzione',
  agi: 'Agilità',
  cha: 'Carisma',
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
      state.log.push({
        kind: 'INTERCEPT',
        text: `${bodyguard.name} si frappone e subisce il colpo destinato a ${target.name}.`,
      });
      target = bodyguard;
    }
    if (harm.kind === 'death') {
      // Death save — 5%: survives, wounded.
      if (roll(state) < TUNE.deathSaveChance) {
        const hpBefore = target.hp;
        target.wounded = true;
        state.log.push({
          kind: 'DEATH_SAVE',
          text: `${target.name} è a terra… e si rialza. Death save riuscito.`,
        });
        recordHarm(state, target.id, 0, 'wound', hpBefore, target.hp, sourceTitle);
        applied.push('wound');
        continue;
      }
      const hpBefore = target.hp;
      target.dead = true;
      target.hp = 0;
      state.log.push({
        kind: 'DEATH',
        text: `${target.name} è morto${sourceTitle ? ` — su «${sourceTitle}»` : ''}.`,
      });
      recordHarm(state, target.id, hpBefore, 'death', hpBefore, 0, sourceTitle);
      applied.push('death');
    } else {
      const hpBefore = target.hp;
      target.wounded = true;
      target.hp = Math.max(1, target.hp - TUNE.woundHpLoss);
      state.log.push({ kind: 'WOUND', text: `${target.name} è ferito.` });
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
    let wound = base.wound + slot.wound;
    let death = base.death + slot.death;
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

/** Create a fresh run from a preset + seed. `questId` selects the authored
 *  quest: 'cassa' (default, infiltration), 'rovine' (attrition gauntlet) or
 *  'goblin' (combat). `loadout` is the stash pick (R-102): engine flags for
 *  the consumables packed before departure — omitted = config default. */
export function createRun(
  presetId: string,
  seed: number,
  questId: QuestId = 'cassa',
  loadout?: string[],
  /** v27 frontier clock: caller-tick duration per maturable node and the tick
   *  the run starts at. Omitted = instant maturation (lab, Monte Carlo). */
  frontier?: { nodeTicks?: number; startTick?: number },
): QuestRunState {
  const quest = QUESTS[questId];
  const preset = quest.presets.find((p) => p.id === presetId) ?? quest.presets[0];
  const party: RuntimeMember[] = preset.members.map((m) => ({
    ...m,
    hp: m.hp ?? TUNE.hp,
    maxHp: m.hp ?? TUNE.hp,
    wounded: false,
    dead: false,
  }));
  const intro =
    questId === 'rovine'
      ? {
          lastEvent: 'La spedizione parte per le rovine sotto il fiume.',
          firstLog: 'Partenza — obiettivo: riportare il tesoro delle rovine. La strada conta in giorni.',
        }
      : questId === 'goblin'
        ? {
            lastEvent: 'Il guado è chiuso dalla paura. Sterminateli.',
            firstLog: 'Assegnazione — quest di combattimento, basata su Forza. Il trofeo dei goblin si converte in Gold al ritorno.',
          }
        : {
            lastEvent: 'La spedizione parte per il Passo del Corvo.',
            firstLog: 'Partenza — obiettivo: riportare la cassa delle sementi.',
          };
  const state: QuestRunState = {
    seed,
    rngCalls: 0,
    questId,
    presetId: preset.id,
    nodeId: quest.startNode,
    party,
    gold: preset.gold,
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
    lastEvent: intro.lastEvent,
    checkQueue: [],
    log: [{ kind: 'NODE', text: intro.firstLog }],
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
  };
  return state;
}

/** Persisted-state schema version (PLAN-025 T-005 reads this). */
export const ENGINE_SCHEMA_VERSION = 1;

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
  state.ended = true;
  state.outcome = outcome;
  if (outcome === 'wipe') {
    state.loot = [];
    state.info = [];
    state.log.push({ kind: 'QUEST_END', text: 'Nessuno torna. Si perde tutto.' });
  } else {
    // Goblin quest (Director): XP is always awarded, whatever the outcome.
    if (state.questId === 'goblin') {
      state.xp = TUNE.goblinXp;
      state.log.push({ kind: 'INFO', text: `La strada insegna. +${TUNE.goblinXp} XP.` });
    }
    state.log.push({ kind: 'QUEST_END', text });
  }
  state.lastEvent = composeEndingText(state, text);
}

/** A taken-but-not-secured loot item drops out of the party's hands. */
function dropLoot(state: QuestRunState, item: string, reason: string): void {
  if (!state.loot.includes(item)) return;
  state.loot = state.loot.filter((l) => l !== item);
  state.log.push({ kind: 'LOOT', text: `${item}: ${reason}` });
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
    dropLoot(state, 'tesoro delle rovine', reason);
  } else if (state.questId === 'goblin') {
    state.flags.push('trofeoPerso');
    dropLoot(state, 'trofeo dei goblin', reason);
  } else {
    state.flags.push('cassaPersa');
    dropLoot(state, 'cassa delle sementi', reason);
  }
}

/** Player chooses to flee — quest failed, secured loot kept; the objective
 *  is still "in hand", not banked: panic means dropping it to run. */
export function flee(state: QuestRunState): QuestRunState {
  if (state.ended) return state;
  state.log.push({ kind: 'RETREAT', text: 'La spedizione si ritira.' });
  if (state.objectiveDone) {
    dropObjective(
      state,
      state.questId === 'rovine'
        ? 'nella fuga il tesoro vi pesa troppo — lo abbandonate tra i ruderi.'
        : 'nella fuga la cassa vi rallenta troppo — la mollate ai bordi del campo.',
    );
  }
  endRun(state, 'fled', 'Fuggite verso il villaggio con quanto avete raccolto. La quest è fallita.');
  return state;
}

/** Use a consumable from the merchant (mock inventory flags). */
export function drinkPotion(state: QuestRunState, flag: 'hasPozione'): QuestRunState {
  if (state.ended || !state.flags.includes(flag)) return state;
  state.flags = state.flags.filter((f) => f !== flag);
  const target = state.party.find((m) => !m.dead && (m.wounded || m.hp < m.maxHp));
  if (target) {
    target.wounded = false;
    target.hp = target.maxHp;
    state.log.push({ kind: 'INFO', text: `Pozione usata: ${target.name} è di nuovo in forze.` });
  } else {
    state.log.push({ kind: 'INFO', text: 'Pozione usata, ma nessuno ne aveva bisogno.' });
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
  state.flags = state.flags.filter((f) => f !== 'hasHealing');
  const target = state.party
    .filter((m) => !m.dead)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (target && target.hp < target.maxHp) {
    target.hp = Math.min(target.maxHp, target.hp + 20);
    if (target.hp >= target.maxHp) target.wounded = false;
    state.log.push({ kind: 'INFO', text: `La ferita si chiude: ${target.name} recupera 20 HP.` });
  } else {
    state.log.push({ kind: 'INFO', text: 'La cura non serve a nessuno — conservata per nulla.' });
  }
  return state;
}

interface CheckResult {
  verdict: Verdict;
  score: number;
  rollPct: number;
}

/** Which owned consumable would boost this check, and by how much (preview + resolution share this). */
export function consumableBonusFor(
  state: QuestRunState,
  node: QuestNode,
): { bonus: number; label: string; flag: string } | null {
  const stats = node.stats ?? [];
  if (state.flags.includes('hasBonusForza') && stats.includes('str')) {
    return { bonus: 15, label: 'Bonus Forza', flag: 'hasBonusForza' };
  }
  if (state.flags.includes('hasBonusPerc') && stats.includes('perc')) {
    return { bonus: 15, label: 'Bonus Percezione', flag: 'hasBonusPerc' };
  }
  if (state.flags.includes('hasFumogeno') && stats.includes('agi')) {
    return { bonus: 15, label: 'Fumogeno', flag: 'hasFumogeno' };
  }
  if (state.flags.includes('hasCorda') && (stats.includes('con') || stats.includes('str'))) {
    return { bonus: 15, label: 'Corda e rampino', flag: 'hasCorda' };
  }
  return null;
}

/**
 * Discovered intel that changes a check's numbers — the payoff of the
 * sighting phase. turni→sneak, pattuglia→side door, mappa→perquisizione.
 */
export function intelBonusFor(state: QuestRunState, node: QuestNode): { bonus: number; label: string } | null {
  if (node.id === 'check-ingresso-agi' && state.info.includes('turni')) {
    return { bonus: 10, label: 'conoscete i turni di guardia' };
  }
  if (node.id === 'check-ingresso-laterale' && state.info.includes('pattuglia')) {
    return { bonus: 10, label: 'sapete quando passa la pattuglia' };
  }
  if (node.id === 'perquisizione' && state.info.includes('mappaAccampamento')) {
    return { bonus: 10, label: 'avete la mappa mentale del campo' };
  }
  // Rovine: the merchant's intel pays on the checks it describes —
  // the rough map helps at the river and spotting the trap; knowing what
  // the guards really watch makes sneaking past them easier.
  if (node.id === 'rv-fiume' && state.info.includes('mappaRovine')) {
    return { bonus: 10, label: 'la mappa segna il punto di corrente debole' };
  }
  if (node.id === 'rv-check-sneak' && state.info.includes('guardiePiuAvanti')) {
    return { bonus: 10, label: 'sapete cosa sorvegliano davvero' };
  }
  if (node.id === 'rv-sala' && state.info.includes('mappaRovine')) {
    return { bonus: 10, label: 'la mappa segna le lastre trabocchetto' };
  }
  // Goblin: the F1 tracks pay on the F3 stealth approach (Director rule).
  if (node.id === 'gob-stealth' && state.flags.includes('bonusStealth')) {
    return { bonus: 10, label: 'le tracce dicono come avvicinarvi' };
  }
  if (node.id === 'gob-stealth' && state.flags.includes('bonusStealthPiccolo')) {
    return { bonus: 5, label: 'le tracce danno qualche indicazione' };
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
    state.log.push({ kind: 'INFO', text: `${reason} Qualcosa si sta svegliando nella torre.` });
    return true;
  }
  const allertato = state.flags.includes('campoAllertato');
  if (allertato || epicfail) {
    if (!allertato) state.flags.push('campoAllertato');
    state.flags.push('campoSveglio');
    state.alarm = true;
    state.log.push({ kind: 'INFO', text: `${reason} Il campo si sveglia: urla e torce ovunque — i check saranno più difficili.` });
    return false;
  }
  state.flags.push('campoAllertato');
  state.log.push({ kind: 'INFO', text: `${reason} Qualcuno nel campo ha sentito qualcosa.` });
  return false;
}

/**
 * Resolve a check. `useConsumable=false` means the player saw the preview and
 * chose to keep the consumable in the bag — it is NOT consumed and adds no
 * bonus. Forced checks (risveglio, epicfail→scontro) auto-spend: the party is
 * desperate and there is no preview moment to decide in.
 */
function resolveCheck(state: QuestRunState, node: QuestNode, useConsumable = true): CheckResult {
  const stats = node.stats ?? [];
  const score = groupScore(state, stats);
  const die = 1 + Math.floor(roll(state) * 100);
  // consumables: fumogeno helps agi checks, corda helps the climb
  let bonus = 0;
  const consumable = consumableBonusFor(state, node);
  if (consumable && useConsumable) {
    bonus = consumable.bonus;
    state.flags = state.flags.filter((f) => f !== consumable.flag);
    if (consumable.flag === 'hasFumogeno') {
      state.log.push({ kind: 'INFO', text: 'Il fumogeno copre la vostra infiltrazione (+15).' });
    } else if (consumable.flag === 'hasCorda') {
      state.log.push({ kind: 'INFO', text: 'Corda e rampino rendono la salita più sicura (+15).' });
    } else {
      state.log.push({ kind: 'INFO', text: `${consumable.label}: il bonus entra in gioco (+${consumable.bonus}).` });
    }
  } else if (consumable) {
    state.log.push({ kind: 'INFO', text: `Decidete di tenere ${consumable.label} nella sacca.` });
  }
  const intel = intelBonusFor(state, node);
  if (intel) {
    bonus += intel.bonus;
    state.log.push({ kind: 'INFO', text: `L’informazione paga: ${intel.label} (+${intel.bonus}).` });
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
  };
  state.lastCheck = resolved;
  state.checkQueue.push(resolved);
  state.log.push({
    kind: 'CHECK',
    text: `${node.title}: ${stats.map((s) => STAT_LABELS[s]).join(' + ')} → ${verdict.toUpperCase()} (${Math.round(successBound)} vs tiro ${die}).`,
  });
  // Surface the verdict→risk modifier: the player must FEEL the lucky escape.
  if (verdict === 'win' || verdict === 'bigwin') {
    state.log.push({
      kind: 'INFO',
      text: `Il ${verdict.toUpperCase()} ha risparmiato il party (−${-TUNE.winRiskMod}pp a ferita e morte).`,
    });
  }
  if (verdict === 'bigwin') {
    state.log.push({ kind: 'INFO', text: 'Bigwin: ogni esito di morte è degradato a ferita.' });
  }
  if (verdict === 'epicfail') {
    state.log.push({ kind: 'INFO', text: 'Epicfail: ogni ferita diventa morte.' });
  }
  resolved.harm = rollCheckHarms(state, node, verdict);
  return { verdict, score: successBound, rollPct: die };
}

/* ------------------------------------------------------------------ */
/* Goblin quest: turn-based combat resolution (PLAN-022)                */
/* ------------------------------------------------------------------ */

/** Authored one-liners for the goblin fight's attack verdicts (spec §Testi). */
const GOBLIN_ATTACK_LINES: Record<Verdict, string> = {
  bigwin: 'Il colpo li spacca a metà: due goblin crollano insieme.',
  win: 'Il colpo arriva. La linea cede di un passo.',
  almost: 'Il colpo morde, non uccide: arretrano e restano in piedi.',
  fail: 'Scudi serrati. Il colpo muore su legno e cuoio.',
  epicfail: 'La linea si richiude: per un istante lungo siete circondati.',
};

/** F6 push-your-luck: the sheltering ruin degrades turn by turn — the rising
 *  damage IS the structure giving way, narrated once per exploreTurn. */
const GOBLIN_F6_CREAK_LINES = [
  'Il palo che regge il telo scricchiola.',
  'Il telo brucia ancora, in basso. Il caldo arriva al viso.',
  'Una trave cede. Chi frugava arretra — e vede il cuoio più vicino.',
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
  state.checkSeq += 1;
  state.lastCheck = {
    id: `chk-${state.checkSeq}`,
    title: `${node.title} — turno ${turn}`,
    verdict,
    score: Math.round(bound),
    rollPct: die,
    harm: 'none',
    woundPct: 0,
    deathPct: 0,
    // The transit line belongs to the phase entrance, not every round.
    transit: turn === 1 ? node.transit : undefined,
    flavor: GOBLIN_ATTACK_LINES[verdict],
    harms: [],
    harmLines: [],
    authoredText: '',
    exposure: exposureSnapshot(state, spec.escalateProfile ? turn : 0),
  };
  state.checkQueue.push(state.lastCheck);
  state.log.push({
    kind: 'CHECK',
    text: `Turno ${turn}: ${spec.attackStats.map((s) => STAT_LABELS[s]).join(' + ')} → ${verdict.toUpperCase()} (${Math.round(bound)} vs tiro ${die}). ${GOBLIN_ATTACK_LINES[verdict]}`,
  });
  // Everything logged after this point is a consequence of the attack roll.
  const consequenceMark = state.log.length;
  const kills =
    verdict === 'bigwin' ? spec.killPerBigwin : verdict === 'win' || verdict === 'almost' ? spec.killPerWin : 0;
  if (kills > 0) {
    state.goblinLeft = Math.max(0, state.goblinLeft - kills);
    state.log.push({ kind: 'INFO', text: `Goblin abbattuti: ${kills}. Ne restano ${state.goblinLeft}.` });
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
  lc.authoredText = state.log
    .slice(consequenceMark)
    .filter((e) => e.kind !== 'NODE' && !CHECK_CONSEQUENCE_KINDS.has(e.kind))
    .map((e) => e.text)
    .join(' ');
  const outcomeLines = () => state.log.slice(consequenceMark).map((e) => e.text).join(' ');
  if (allDead(state)) {
    lc.outcomeText = outcomeLines();
    endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
    return;
  }
  if (state.goblinLeft <= 0) {
    if (!state.flags.includes('sterminio')) {
      state.flags.push('sterminio');
      state.log.push({ kind: 'INFO', text: 'Sterminio: non ne resta nessuno.' });
    }
    state.lastEvent = 'Il campo è conquistato. Non resta un goblin vivo.';
  } else if (turn >= spec.turns) {
    state.lastEvent = 'Il campo è conquistato. I superstiti scappano nel bosco.';
  } else {
    state.lastEvent = `Turno ${turn} chiuso — i goblin tengono ancora il campo (${state.goblinLeft} in piedi).`;
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
  opts?: { useConsumable?: boolean },
): OptionPreview | null {
  if (state.ended) return null;
  const nodes = nodesFor(state);
  const node = nodes[state.nodeId];
  const option = node?.options?.find((o) => o.id === optionId);
  if (!option || !option.next.startsWith('CHECK:')) return null;
  const checkNode = nodes[option.next.slice(6)];
  if (!checkNode || !checkNode.stats) return null;

  const alive = state.party.filter((m) => !m.dead);
  if (!alive.length) return null;
  const contributors = checkNode.stats.map((s) => {
    const best = alive.reduce((a, b) => (b.stats[s] > a.stats[s] ? b : a));
    return { stat: s, label: STAT_LABELS[s], bestName: best.name, bestValue: best.stats[s] };
  });
  const consumable = consumableBonusFor(state, checkNode);
  const consumableApplied = consumable && opts?.useConsumable !== false ? consumable : null;
  const intel = intelBonusFor(state, checkNode);
  const score = groupScore(state, checkNode.stats) + (consumableApplied?.bonus ?? 0) + (intel?.bonus ?? 0);
  const bodyguard = state.party.find((m) => m.role === 'bodyguard' && !m.dead);
  const perSlot = alive.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    wounded: m.wounded,
    ...memberRisk(m, checkNode),
  }));
  const primaryStatsUsed = checkNode.stats.filter((s) =>
    QUESTS[state.questId].primaryStats.includes(s),
  );
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
      ? { name: bodyguard.name, ...memberRisk(bodyguard, checkNode) }
      : undefined,
    perSlot,
    primaryStatsUsed,
    failHint: checkNode.failHint,
  };
}

/** The check's harm risk for a specific member (slot modifier + wounded penalty). */
export function memberRisk(
  member: RuntimeMember,
  node: QuestNode,
): { woundPct: number; deathPct: number } {
  const slot = SLOT_RISK[member.role] ?? SLOT_RISK.member;
  const extra = member.wounded ? TUNE.woundedRiskBonus : 0;
  return {
    woundPct: Math.max(0, (node.risk?.wound ?? 0) + slot.wound + extra),
    deathPct: Math.max(0, (node.risk?.death ?? 0) + slot.death + extra),
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
  state.log.push({ kind: 'INFO', text: `+${n} ${n === 1 ? 'giorno' : 'giorni'} — ${reason}` });
}

function applyNodeOutcome(state: QuestRunState, node: QuestNode, verdict: Verdict, success: boolean, bad: boolean): string {
  switch (node.id) {
    case 'avvistamento':
      if (verdict === 'bigwin') {
        state.info.push('gabbia', 'sideDoor', 'turni', 'pattuglia', 'qualcosaDiGrosso', 'mappaAccampamento');
        state.log.push({
          kind: 'INFO',
          text: 'Vedete tutto: la gabbia col prigioniero, la porta laterale, i turni, la pattuglia — e qualcosa di grosso che dorme nella torre.',
        });
      } else if (verdict === 'win') {
        state.info.push('gabbia', 'sideDoor', 'qualcosaDiGrosso');
        state.log.push({
          kind: 'INFO',
          text: 'Scorgete una gabbia con un prigioniero, una porta laterale… e qualcosa di grosso nella torre.',
        });
      } else if (verdict === 'almost') {
        state.info.push('turni');
        state.log.push({ kind: 'INFO', text: 'Riuscite solo a contare i turni di guardia.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'Nient’altro: entrerete alla cieca.' });
      }
      return 'approccio';
    case 'check-ingresso-forza':
      // Forcing the entry wakes the camp for good, whatever the roll says:
      // the quiet way out is gone and checks run under alarm.
      if (!state.flags.includes('campoSveglio')) {
        state.flags.push('campoSveglio');
        state.alarm = true;
        state.log.push({ kind: 'INFO', text: 'Lo scontro si sente in tutto il campo: è sveglio, e resterà sveglio.' });
      }
      return 'perquisizione';
    case 'check-ingresso-agi':
    case 'check-ingresso-cha':
    case 'check-ingresso-laterale':
      if (verdict === 'epicfail') return 'check-ingresso-forza'; // everything goes loud
      return 'perquisizione';
    case 'perquisizione':
      if (success) {
        state.loot.push('segnale della cassa');
        state.log.push({ kind: 'INFO', text: 'Trovate la cassa delle sementi, ancora intatta. In cima alla torre.' });
        state.flags.push('knowsCassa');
      } else {
        state.log.push({ kind: 'INFO', text: 'La ricerca fa rumore e non trovate niente di preciso — tirate a indovinare verso la torre.' });
      }
      return 'torre';
    case 'check-gabbia':
      if (success) {
        state.flags.push('prigionieroLibero');
        state.log.push({ kind: 'LOOT', text: 'Il prigioniero vi segue in silenzio. Al villaggio potrebbe restare.' });
      }
      return 'obiettivo';
    case 'obiettivo':
      if (success) {
        state.objectiveDone = true;
        state.loot.push('cassa delle sementi');
        state.log.push({ kind: 'LOOT', text: 'Cassa delle sementi presa — in mano, non ancora al sicuro.' });
      } else {
        // Fail-forward: the crate stays, but the run is not over — now you
        // must extract empty-handed through whatever your entry left behind.
        state.log.push({ kind: 'INFO', text: 'La cassa vi sfugge di mano — resta al campo. Ora conta solo uscire vivi.' });
        return 'estrazione';
      }
      return 'rientra-o-rischi';
    case 'check-forziere':
      if (success) {
        state.gold += 15;
        state.loot.push('forziere goblin');
        state.log.push({ kind: 'LOOT', text: 'Forziere goblin: +15 gold.' });
      }
      // The chest creaks even on success — greed is loud. Loot already in hand.
      if (escalateCamp(state, false, 'Il forziere cigola.')) return 'risveglio';
      return 'estrazione';
    case 'risveglio':
      if (success) {
        state.log.push({ kind: 'INFO', text: 'Correte nella notte. Dietro di voi la torre si sgretola — eravate a un soffio.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'La fuga è un massacro disperato.' });
        dropObjective(state, 'la lasciate cadere correndo — resta nella torre.');
      }
      return 'ritorno';
    case 'check-uscita-breccia':
      if (bad) {
        // The breach is forgiving on lives but not on baggage: the squeeze
        // costs whatever you could not hold. Only an epicfail drops the crate.
        dropLoot(state, 'forziere goblin', 'resta incastrato nella breccia.');
        dropLoot(state, 'segnale della cassa', 'perso nella strettoia.');
        if (verdict === 'epicfail') {
          dropObjective(state, 'la cassa si incastra nel varco — per uscire dovete lasciarla.');
          state.log.push({ kind: 'INFO', text: 'Il prigioniero vi trascina oltre il muro: siete fuori, a mani vuote.' });
        } else {
          state.log.push({ kind: 'INFO', text: 'Uscite dalla breccia spinti a forza — qualcosa resta indietro.' });
        }
      }
      return 'ritorno';
    case 'check-uscita-calma':
      if (bad) {
        dropLoot(state, 'forziere goblin', 'troppo pesante per sparire in silenzio.');
        dropLoot(state, 'segnale della cassa', 'perso nel buio.');
        if (verdict === 'epicfail') {
          dropObjective(state, 'una pattuglia taglia la via: per scappare mollate la cassa.');
        } else {
          state.log.push({ kind: 'INFO', text: 'Qualcuno alza lo sguardo al momento sbagliato: vi dileguate, più leggeri.' });
        }
      }
      return 'ritorno';
    case 'check-uscita-allarme':
      if (bad) {
        // The loud way out: a fail means the crate is the price of speed.
        dropObjective(state, 'il campo vi addossa — la cassa vi rallenta troppo, resta qui.');
        dropLoot(state, 'forziere goblin', 'perso nella corsa.');
        dropLoot(state, 'segnale della cassa', 'perso nella corsa.');
      }
      return 'ritorno';
    /* ---- Le Rovine sotto il Fiume ----------------------------------------
     * Attrition gauntlet: costs are HP and days. The merchant's choice is a
     * real check-fork; the trap cascade demonstrates fail-forward; the
     * treasure is TAKEN≠SECURED from the take to the end node. */
    case 'rv-check-osserva':
      if (verdict === 'bigwin') {
        state.info.push('guardiePiuAvanti', 'mappaRovine');
        state.log.push({
          kind: 'INFO',
          text: 'Lo leggete aperto: «le guardie non proteggono l’ingresso — proteggono qualcosa più avanti». E vi lascia la sua mappa abbozzata.',
        });
      } else if (verdict === 'win' || verdict === 'almost') {
        state.info.push('guardiePiuAvanti');
        state.log.push({
          kind: 'INFO',
          text: 'Il mercante rivela: «le guardie non stanno proteggendo l’ingresso. Stanno proteggendo qualcosa più avanti.»',
        });
      } else {
        state.log.push({ kind: 'INFO', text: 'Non capite più di quanto vi ha detto. Entrerete quasi alla cieca.' });
      }
      return 'rv-fiume';
    case 'rv-check-incalza':
      if (success) {
        state.info.push('guardiePiuAvanti', 'mappaRovine');
        state.flags.push('hasCoagulo');
        state.log.push({
          kind: 'INFO',
          text: 'Cede: «le guardie proteggono qualcosa più avanti». Vi lascia la mappa abbozzata e un coagulo — «per la strada, potrebbe servirvi».',
        });
        if (verdict === 'bigwin') {
          state.gold += 10;
          state.log.push({ kind: 'LOOT', text: 'Vi allunga anche 10 gold per «non dirlo in giro».' });
        }
      } else {
        state.log.push({ kind: 'INFO', text: 'Vi caccia malamente: niente informazioni, e partite con l’amaro in bocca.' });
      }
      return 'rv-fiume';
    case 'rv-fiume':
      if (verdict === 'almost') {
        addDays(state, 1, 'la corrente vi trascina mezzo miglio più a valle.');
      } else if (verdict === 'fail') {
        addDays(state, 1 + Math.floor(roll(state) * 2), 'trascinati dalla corrente, risalire costa tempo.');
      } else if (verdict === 'epicfail') {
        addDays(state, 2, 'sbattuti sugli scogli — zoppicate fuori dall’acqua.');
      }
      return 'rv-guardie';
    case 'rv-check-sneak':
      if (bad) {
        state.flags.push('inseguiti');
        state.log.push({
          kind: 'INFO',
          text: 'Vi hanno visti: le picche vi inseguono fino all’uscita della galleria.',
        });
      }
      return 'rv-sala';
    case 'rv-check-fight':
      if (verdict === 'bigwin') {
        state.gold += 40;
        state.loot.push('bottino delle guardie');
        state.log.push({ kind: 'LOOT', text: 'Le guardie cadono senza chiamare aiuto: +40 gold di bottino.' });
      } else if (success) {
        state.gold += 25;
        state.loot.push('bottino delle guardie');
        state.log.push({ kind: 'LOOT', text: 'Le guardie sono a terra: +25 gold di bottino.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'Riuscite a passare, ma le picche si sono fatte pagare.' });
      }
      return 'rv-sala';
    case 'rv-sala':
      if (success) {
        state.log.push({ kind: 'INFO', text: 'La vedete: la lastra davanti al tesoro è un trabocchetto. Ora potete scegliere come muovervi.' });
        return 'rv-tesoro-scelta';
      }
      state.log.push({ kind: 'INFO', text: 'Niente di strano… finché il pavimento non cede sotto i vostri piedi.' });
      return 'rv-check-trappola';
    case 'rv-check-trappola':
      state.flags.push('tesoroDanneggiato');
      if (success) {
        state.log.push({ kind: 'INFO', text: 'Vi tirate fuori dalla fossa — ma parte del tesoro è finito sotto la frana.' });
      } else {
        addDays(state, 1, 'scavare per uscire dalla trappola vi costa un giorno.');
        state.log.push({ kind: 'INFO', text: 'Uscite dalla trappola a fatica: il tesoro si è parzialmente danneggiato.' });
      }
      return 'rv-tesoro-scelta';
    case 'rv-check-prendi':
    case 'rv-check-sicuro': {
      if (success) {
        let value = TUNE.treasureMin + Math.floor(roll(state) * TUNE.treasureSpan);
        if (state.flags.includes('tesoroDanneggiato')) {
          value = Math.floor(value / 2);
          state.log.push({ kind: 'INFO', text: 'Quel che resta dopo la frana vale la metà.' });
        }
        if (node.id === 'rv-check-sicuro') {
          value = Math.round(value * 1.2);
        }
        state.bottinoOro = value;
        state.objectiveDone = true;
        state.loot.push('tesoro delle rovine');
        state.log.push({ kind: 'LOOT', text: `Tesoro caricato — in mano, non ancora al sicuro. Vale circa ${value} gold.` });
        return 'rv-checkpoint';
      }
      // Failed take: the treasure stays — the run continues to the exit empty.
      state.log.push({ kind: 'INFO', text: 'Il tesoro è troppo per le vostre schiene — ne portate via solo briciole. Uscirete quasi a mani vuote.' });
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
        state.log.push({ kind: 'INFO', text: 'Orme fresche verso nord. Sapete come avvicinarvi (bonus Stealth).' });
      } else if (verdict === 'almost') {
        state.flags.push('bonusStealthPiccolo');
        state.log.push({ kind: 'INFO', text: 'Qualche segno confuso. Meglio di niente.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'Il bosco tace.' });
      }
      return 'gob-accampamento';
    case 'gob-tracce-perfor':
      if (success) {
        state.log.push({ kind: 'INFO', text: 'Dall’alto si vede ciò che da terra resta invisibile: qualcosa è nascosto presso il masso.' });
        return 'gob-bottino-scelta';
      }
      positionalDamage(state, 10, node.title);
      state.log.push({ kind: 'INFO', text: 'La caduta vi costa. (−10 HP)' });
      return 'gob-accampamento';
    case 'gob-bottino': {
      state.loot.push('bottino di guerra');
      state.gold += 12;
      state.log.push({ kind: 'LOOT', text: 'Bottino di guerra: +12 gold.' });
      if (bad) {
        positionalDamage(state, 10, node.title);
        if (!state.flags.includes('campoAllertato')) state.flags.push('campoAllertato');
        state.alarm = true;
        state.log.push({ kind: 'INFO', text: 'Un rumore di troppo. I goblin drizzano le orecchie — il campo è all’erta.' });
      } else if (verdict === 'almost') {
        if (!state.flags.includes('campoAllertato')) state.flags.push('campoAllertato');
        state.log.push({ kind: 'INFO', text: 'Ce l’avete — ma qualcosa si è mosso nel campo.' });
      }
      return 'gob-accampamento';
    }
    case 'gob-stealth':
      if (verdict === 'bigwin' || verdict === 'win') {
        state.flags.push('vantaggioGrande');
        state.log.push({ kind: 'INFO', text: 'Vi piazzate alle loro spalle. Colpirete per primi.' });
      } else if (verdict === 'almost') {
        state.flags.push('vantaggioPiccolo');
        state.log.push({ kind: 'INFO', text: 'Un ramo spezzato vi costa il vantaggio perfetto.' });
      } else {
        if (!state.flags.includes('campoAllertato')) state.flags.push('campoAllertato');
        state.alarm = true;
        state.log.push({ kind: 'INFO', text: 'Pietre rotolano sotto i piedi. Il campo vi ha visti.' });
      }
      return 'gob-combattimento';
    case 'gob-assalto':
      if (verdict === 'bigwin' || verdict === 'win') {
        state.flags.push('vantaggioPiccolo');
        state.log.push({ kind: 'INFO', text: 'Sfondando la linea, il primo colpo è vostro.' });
      } else if (verdict === 'epicfail') {
        positionalDamage(state, 5, node.title);
        state.log.push({ kind: 'INFO', text: 'Vi schiantate contro le palizzate. Nessun vantaggio — e male alle ossa.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'La carica si smorza nel fango. Nessun vantaggio.' });
      }
      return 'gob-combattimento';
    case 'gob-incalza-check':
      /* v2: the toll is generic `upfrontDamage` — applied before this switch.
         If they still escape, they come back bloodied and scattered: the
         ambush is MILDER than letting them flee rested. */
      if (verdict === 'bigwin' || verdict === 'win') {
        state.flags.push('sterminio');
        state.log.push({ kind: 'INFO', text: 'Li raggiungete sul crinale. Non ne resta nessuno.' });
      } else if (verdict === 'almost') {
        state.flags.push('agguatoMite');
        state.log.push({ kind: 'INFO', text: 'Vi sfuggono per un soffio, feriti e sparsi. Saranno un’ombra sulla via del ritorno.' });
      } else {
        state.flags.push('agguatoMite');
        state.log.push({ kind: 'INFO', text: 'Scappano tra le rocce, ridendo. Vi aspetteranno sulla via del ritorno.' });
      }
      return 'gob-esplora-extra';
    case 'gob-cerca': {
      state.exploreTurn += 1;
      const dmg = TUNE.exploreBaseDamage * state.exploreTurn;
      positionalDamage(state, dmg, node.title);
      const creak = GOBLIN_F6_CREAK_LINES[Math.min(state.exploreTurn, GOBLIN_F6_CREAK_LINES.length) - 1];
      state.log.push({ kind: 'INFO', text: creak });
      if (verdict === 'bigwin' || verdict === 'win') {
        state.gold += TUNE.exploreLootGold;
        state.loot.push('bottino del campo');
        state.log.push({ kind: 'LOOT', text: `Sotto il telo, qualcosa che valeva ancora. (+${TUNE.exploreLootGold} gold)` });
      } else if (verdict === 'almost') {
        state.gold += Math.floor(TUNE.exploreLootGold / 2);
        state.log.push({ kind: 'INFO', text: 'Un bottino misero — e una ferita in più.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'Solo cenere e spine.' });
      }
      return 'gob-esplora-extra';
    }
    case 'rv-camera':
      if (verdict === 'bigwin') {
        const gain = TUNE.deepChamberMin + Math.floor(roll(state) * TUNE.deepChamberSpan);
        state.bottinoOro += gain;
        state.loot.push('reliquia antica');
        state.log.push({ kind: 'LOOT', text: `Il deposito era intatto: +${gain} gold e una reliquia antica.` });
        addDays(state, 1, 'svuotare la camera profonda.');
      } else if (success) {
        const gain = TUNE.deepChamberMin + Math.floor(roll(state) * TUNE.deepChamberSpan);
        state.bottinoOro += gain;
        state.log.push({ kind: 'LOOT', text: `Il deposito paga: +${gain} gold.` });
        addDays(state, 1, 'svuotare la camera profonda.');
      } else {
        addDays(state, 1 + Math.floor(roll(state) * 2), 'il deposito era già quasi vuoto — scavare non paga.');
        state.log.push({ kind: 'INFO', text: 'Qualcuno era passato prima di voi: restano solo scarti.' });
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
    pieces.push(`${dead.join(', ')} non ${dead.length > 1 ? 'sono tornati' : 'è tornato'}.`);
  }
  if (aliveCount > 0) {
    pieces.push(`Tornate in ${aliveCount}.`);
  }
  if (state.questId === 'rovine') {
    // Report-style epilogue (mockup): the cost continues after the quest —
    // days spent, human-days burned, wounded members unavailable.
    pieces.push(`Durata: ${state.days} giorni.`);
    pieces.push(`Giorni-uomo utilizzati: ${state.party.length} × ${state.days} = ${state.party.length * state.days}.`);
    if (state.bottinoOro > 0) {
      pieces.push(`Bottino riportato: ${state.bottinoOro} gold.`);
    }
    if (state.flags.includes('tesoroPerso')) {
      pieces.push('Il tesoro è rimasto nelle rovine.');
    }
    const wounded = state.party.filter((m) => !m.dead && m.wounded).map((m) => m.name);
    for (const name of wounded) {
      pieces.push(`${name}: FERITO — indisponibile per ${TUNE.rovineWoundedRecoveryDays} giorni.`);
    }
    if (state.flags.includes('viandanteAiutato')) {
      pieces.push('Il viandante che avete curato vi ha pagato più del dovuto.');
    } else if (state.flags.includes('viandantePortato')) {
      pieces.push('Il viandante che avete portato al villaggio vi deve un favore.');
    } else if (state.flags.includes('viandanteLasciato')) {
      pieces.push('Il ferito sulla strada è rimasto dove lo avete lasciato.');
    }
    const extra = state.loot.filter((l) => l !== 'tesoro delle rovine');
    if (extra.length > 0) {
      pieces.push(`Portate a casa: ${extra.join(', ')}.`);
    }
    return pieces.join(' ');
  }
  if (state.questId === 'goblin') {
    if (state.flags.includes('trofeoPerso')) {
      pieces.push('Il trofeo dei goblin è rimasto sulla strada.');
    }
    const extra = state.loot.filter((l) => l !== 'trofeo dei goblin');
    if (extra.length > 0) {
      pieces.push(`Portate a casa: ${extra.join(', ')}.`);
    }
    if (state.xp > 0) {
      pieces.push(`Esperienza: +${state.xp} XP.`);
    }
    return pieces.join(' ');
  }
  if (state.flags.includes('cassaPersa')) {
    pieces.push('La cassa delle sementi è rimasta al campo.');
  }
  if (state.flags.includes('prigionieroLibero')) {
    pieces.push('Il prigioniero che avete liberato è con voi.');
  }
  const extra = state.loot.filter((l) => l !== 'cassa delle sementi');
  if (extra.length > 0) {
    pieces.push(`Portate a casa: ${extra.join(', ')}.`);
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
  // Iterative, bounded traversal: check/info/harm chains used to recurse.
  // A cycle in authored `next` links must degrade to a terminal state —
  // an infinite recursion here crashes the whole React tree with a
  // RangeError (mount flood → error boundary retry → page reload).
  let cursor: string | undefined = nodeId;
  for (let steps = 0; cursor; steps += 1) {
    if (steps >= TUNE.maxAutoSteps) {
      state.log.push({ kind: 'INFO', text: `Il percorso si è chiuso in un ciclo (${cursor}). La spedizione torna al villaggio.` });
      endRun(state, 'survived', 'Il percorso si è chiuso su se stesso: la spedizione è rientrata.');
      return;
    }
    const node = nodesFor(state)[cursor];
    if (!node) return;
    state.nodeId = cursor;
    state.frontierVersion += 1;
    state.log.push({ kind: 'NODE', text: node.title });

    // Spotted sneaking past the guards: their patrol chases the party out —
    // the return costs a day.
    if (cursor === 'rv-ritorno-evento' && state.flags.includes('inseguiti')) {
      addDays(state, 1, 'seminare le guardie che vi inseguivano.');
    }

    // Combat nodes stop and wait for per-turn player input: each command
    // resolves one turn via the 'fight-turn' synthetic option.
    if (node.kind === 'combat') {
      state.combatTurn = 0;
      state.goblinLeft = node.combat?.enemies ?? 0;
      state.lastEvent = node.body;
      state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick };
      return;
    }

    // Check nodes resolve as soon as they are reached: the choice that led here
    // already committed the party; resolution is the consequence.
    if (node.kind === 'check') {
      const preMark = state.log.length;
      const result = resolveCheck(state, node);
      const outcomeMark = state.log.length;
      state.lastEvent = `${node.title} — ${result.verdict.toUpperCase()}.`;
      if (allDead(state)) {
        drainHarmsIntoLastCheck(state);
        endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
        return;
      }
      cursor = applyCheckOutcome(state, node, result.verdict);
      setCheckOutcomeText(state, preMark, outcomeMark);
      // Same rule as submitCommand: an outcome toll that kills the last member is a wipe.
      if (allDead(state)) {
        endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
        return;
      }
      continue;
    }

    // Info and harm nodes are timed beats, not decisions: arrival commits a
    // pending frontier and shows the scene; the node's effects land when the
    // frontier matures (matureNode). Only the clock crosses them (v27).
    if (node.kind === 'info' || node.kind === 'harm') {
      if (node.kind === 'info') state.log.push({ kind: 'INFO', text: node.body });
      state.lastEvent = node.body ?? node.title;
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
          endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
        } else if (state.objectiveDone && lead && !lead.dead) {
          state.gold += TUNE.trofeoGold;
          state.loot = state.loot.filter((l) => l !== 'trofeo dei goblin');
          state.log.push({ kind: 'LOOT', text: `Le teste sul banco del giudice: +${TUNE.trofeoGold} gold.` });
          endRun(state, 'reward', 'Con il trofeo sulla bilancia: da domani, i carri ripassano dal guado.');
        } else {
          endRun(
            state,
            'survived',
            state.flags.includes('trofeoPerso')
              ? 'A mani vuote: il trofeo è rimasto sulla strada. Il guado resta deserto.'
              : 'Tornate senza completare lo sterminio. Il guado resta deserto.',
          );
        }
      } else if (allDead(state)) {
        endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
      } else if (state.objectiveDone && lead && !lead.dead) {
        // Arriving at the end with the objective IS the secure event: TAKEN
        // only becomes SECURED here, after a route the player chose and rolled.
        endRun(
          state,
          'reward',
          state.questId === 'rovine'
            ? 'Il tesoro delle rovine è al villaggio. La quest è completa — reward ottenuta.'
            : 'Cassa delle sementi riportata al villaggio. La quest è completa — reward ottenuta.',
        );
      } else if (state.objectiveDone && (!lead || lead.dead)) {
        endRun(
          state,
          'survived',
          state.questId === 'rovine'
            ? 'Il tesoro torna al villaggio, ma il leader non c’è più. La reward della quest va persa.'
            : 'La cassa torna al villaggio, ma il leader non c’è più. La reward della quest va persa.',
        );
      } else {
        endRun(
          state,
          'survived',
          state.questId === 'rovine'
            ? 'Tornate al villaggio senza il tesoro. La quest è fallita, ma siete vivi.'
            : 'Tornate al villaggio senza la cassa. La quest è fallita, ma siete vivi.',
        );
      }
    }

    // Choice nodes (and anything unknown) stop and wait for player input.
    if (!state.ended) state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick };
    return;
  }
}

/**
 * Resolve a matured pending node (PLAN-025 T-004): the node's authored
 * effects land now — the F7 router, ambush/incident damage — then the run
 * arrives at the authored next node. No-op while the frontier is not ready.
 */
function matureNode(state: QuestRunState, tick: number): void {
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
      state.lastEvent = 'Frecce dal ciglio della strada. Erano rimasti in attesa.';
    } else if (node.id === 'rv-attrito') {
      // The unstable zone: no check can erase this cost (Director mockup —
      // "continuare deve costare qualcosa"). +1 day always, then a roll:
      // a wound worsens, or someone new is hurt, or luck holds.
      addDays(state, 1, 'attraversare la zona instabile.');
      const candidates = state.party.filter((m) => !m.dead);
      const r = roll(state);
      if (r < 0.35 && candidates.some((m) => m.wounded)) {
        const victim = candidates.find((m) => m.wounded);
        if (victim) {
          const hpBefore = victim.hp;
          victim.hp = Math.max(1, victim.hp - TUNE.incidentWoundHpLoss);
          state.log.push({ kind: 'HARM', text: `La ferita di ${victim.name} peggiora nella zona instabile.` });
          recordHarm(state, victim.id, hpBefore - victim.hp, 'wound', hpBefore, victim.hp, node.title);
          state.lastEvent = `${victim.name} peggiora: la zona non perdona chi è già ferito.`;
        }
      } else if (r < 0.7) {
        const victim = candidates[Math.floor(roll(state) * candidates.length)];
        if (victim) {
          const hpBefore = victim.hp;
          victim.wounded = true;
          victim.hp = Math.max(1, victim.hp - TUNE.incidentWoundHpLoss);
          state.log.push({ kind: 'HARM', text: `${victim.name} è ferito nella zona instabile.` });
          recordHarm(state, victim.id, hpBefore - victim.hp, 'wound', hpBefore, victim.hp, node.title);
          state.lastEvent = `La pietra cede sotto ${victim.name}: ferito. Il costo del passaggio.`;
        }
      } else {
        state.lastEvent = 'La zona scricchiola ma regge: passate indenni — stavolta.';
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
          state.log.push({ kind: 'HARM', text: `La frana colpisce ${victim.name}: ferito.` });
          recordHarm(state, victim.id, hpBefore - victim.hp, 'wound', hpBefore, victim.hp, node.title);
          state.lastEvent = `La frana coglie ${victim.name}. Il resto della strada lo farà con una ferita.`;
        }
      } else {
        state.lastEvent = 'La frana passa a pochi metri: spavento, ma nessun danno.';
      }
    }
    if (allDead(state)) {
      endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
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
      state.log.push({ kind: 'INFO', text: `Il percorso si è chiuso in un ciclo (${state.nodeId}). La spedizione torna al villaggio.` });
      endRun(state, 'survived', 'Il percorso si è chiuso su se stesso: la spedizione è rientrata.');
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
  opts?: { useConsumable?: boolean; tick?: number },
): QuestRunState {
  if (state.ended) return state;
  if (state.frontier.status === 'pending') return state;
  const tick = opts?.tick ?? state.frontier.startedAt;
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
    resolveCombatTurn(state, node);
    if (state.ended) return state;
    if (combatDone(state, node)) {
      // Taking the camp IS taking the trophy — TAKEN ≠ SECURED (can still
      // be abandoned at the F7 ambush or lost on a wipe).
      if (node.id === 'gob-combattimento' && !state.objectiveDone) {
        state.objectiveDone = true;
        state.loot.push('trofeo dei goblin');
        state.log.push({ kind: 'LOOT', text: 'Trofeo dei goblin preso — in mano, non ancora al sicuro.' });
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
  if (option.costGold && state.gold < option.costGold) return state;
  if (option.consumesFlag && !state.flags.includes(option.consumesFlag)) return state;

  if (option.costGold) {
    state.gold -= option.costGold;
    // buying anything earns the merchant's tip once
    if (!state.info.includes('simbolo')) {
      state.info.push('simbolo');
      state.log.push({ kind: 'INFO', text: 'Il mercante: «non sono goblin qualunque… portano un simbolo».' });
    }
  }
  if (option.consumesFlag) {
    state.flags = state.flags.filter((f) => f !== option.consumesFlag);
  }
  if (option.grantsGold) {
    state.gold += option.grantsGold;
    state.log.push({ kind: 'LOOT', text: `+${option.grantsGold} gold.` });
  }
  if (option.grantsInfo && !state.info.includes(option.grantsInfo)) {
    state.info.push(option.grantsInfo);
  }
  if (option.costDays) {
    addDays(state, option.costDays, 'la scelta fatta.');
  }
  if (option.sets) state.flags.push(option.sets);
  if (option.abandonsObjective) {
    dropObjective(state, 'il trofeo resta nel fosso — la strada si libera.');
    state.flags.push('trofeoLasciato');
    state.log.push({ kind: 'INFO', text: 'Gettate la testa nel fosso e correte. La quest è persa.' });
  }
  state.log.push({ kind: 'CHOICE', text: option.label });

  const next = option.next;
  if (next.startsWith('CHECK:')) {
    const checkNode = nodes[next.slice(6)];
    state.nodeId = checkNode.id;
    state.frontierVersion += 1;
    const preMark = state.log.length;
    const result = resolveCheck(state, checkNode, opts?.useConsumable !== false);
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
      state.lastEvent = `${checkNode.title} — ${result.verdict.toUpperCase()}. ${hurt || 'Nessuna conseguenza fisica.'}`;
    };
    summarize();
    if (allDead(state)) {
      drainHarmsIntoLastCheck(state);
      endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
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
      endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
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
  opts?: { useConsumable?: boolean },
): QuestRunState {
  submitCommand(state, optionId, opts);
  return matureReady(state, Number.MAX_SAFE_INTEGER);
}

/** Options visible at the current node (filters info-gated options). */
export function availableOptions(state: QuestRunState): { id: string; label: string; detail: string; costGold?: number; disabled: boolean }[] {
  const node = nodesFor(state)[state.nodeId];
  // A pending frontier is a timed beat, not a decision — no input exists yet.
  if (!node || state.ended || state.frontier.status === 'pending') return [];
  if (node.kind === 'info') {
    return [{ id: 'advance', label: 'Continua', detail: 'Prosegui.', disabled: false }];
  }
  if (node.kind === 'combat') {
    return [
      {
        id: 'fight-turn',
        label: `Combatti — turno ${state.combatTurn + 1}`,
        detail: `Goblin in piedi: ${state.goblinLeft}. Rispondono colpo per colpo.`,
        disabled: false,
      },
    ];
  }
  if (node.kind !== 'choice') return [];
  return (node.options ?? [])
    .filter(
      (o) =>
        (!o.requiresInfo || state.info.includes(o.requiresInfo)) &&
        (!o.requiresFlag || state.flags.includes(o.requiresFlag)) &&
        (!o.hiddenIfFlag || !state.flags.includes(o.hiddenIfFlag)),
    )
    .map((o) => ({
      id: o.id,
      label: o.label,
      detail: o.detail,
      costGold: o.costGold,
      disabled: !!o.costGold && state.gold < o.costGold,
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
