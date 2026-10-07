/**
 * questSimulation — probabilistic forecast layer for the S1 lab quests
 * (R-082, Director spec 2026-10-04).
 *
 * Two surfaces, one rule set:
 *
 * - `analyzeCheck` — EXACT analytic forecast of a single skill check: the
 *   D100 verdict distribution is closed-form, and per-member harm odds are
 *   computed by the same band math the engine rolls (`memberRisk` bands,
 *   verdict modifiers, bodyguard interception, 5% death save, epicfail
 *   upgrade inside the declared band, bigwin downgrade).
 *
 * - `simulateQuest` — Monte Carlo over the REAL run engine: the state is
 *   cloned, consumables are stripped (Director 2026-10-04: the quest sim
 *   ignores them), and `applyChoice`/`enterNode` drive each run with a
 *   declared strategy for the choice nodes. Wounds, deaths, flags, alarm,
 *   loot and days propagate between phases exactly as in a real run.
 *
 * Determinism: every run uses `seed = seedBase + runIndex`; the engine's
 * mulberry32(seed + rngCalls) keeps each run independent and reproducible —
 * same inputs → same output, no Math.random anywhere.
 */

import {
  applyChoice,
  availableOptions,
  clampSuccessBound,
  consumableBonusFor,
  groupScore,
  intelBonusFor,
  memberRisk,
  nodesFor,
  positionalWeights,
  QUESTS,
  STAT_LABELS,
  TUNE,
} from './questRun';
import type { QuestRunState, Verdict } from './questRun';
import type { LabStat, QuestNode } from './questScenario';
import { DEFAULT_QUEST_SKILL_CHECK_CONFIG } from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';

const CHECK_BANDS = DEFAULT_QUEST_SKILL_CHECK_CONFIG.backgroundResolution;

/** Consumable flags the quest sim strips — Director 2026-10-04: the total
 *  forecast ignores consumables; they are a per-check commitment and live
 *  only in the pre-check preview. `hasCoagulo` is NOT stripped: it gates a
 *  quest choice (the wounded traveler), not a check bonus. */
const CHECK_CONSUMABLE_FLAGS = new Set(['hasFumogeno', 'hasCorda', 'hasPozione']);

/** A declared strategy: choice node id → option id. */
export type SimStrategy = Record<string, string>;

/* ================================================================== */
/* 1. ANALYTIC CHECK FORECAST                                          */
/* ================================================================== */

/** Exact probabilities of the five verdicts for a clamped success bound.
 *  Mirrors `verdictFromRoll` (questRun.ts): epicfail on die ≥ 96, bigwin on
 *  die ≤ 5, win on die ≤ bound, almost on the 5 rolls past the bound. */
export function verdictDistribution(bound: number): Record<Verdict, number> {
  const b = clampSuccessBound(bound);
  const almostEnd = Math.min(b + TUNE.almostBand, CHECK_BANDS.successCeiling);
  return {
    epicfail: (100 - CHECK_BANDS.epicFailThreshold + 1) / 100,
    bigwin: TUNE.bigwinBand / 100,
    win: Math.max(0, b - TUNE.bigwinBand) / 100,
    almost: Math.max(0, almostEnd - b) / 100,
    fail: Math.max(0, CHECK_BANDS.successCeiling - almostEnd) / 100,
  };
}

export interface MemberOutcome {
  id: string;
  name: string;
  role: string;
  /** Member was already wounded before this check. */
  alreadyWounded: boolean;
  /** Final-state probabilities in percent (sum ≈ 100). */
  healthyPct: number;
  woundPct: number;
  deathPct: number;
}

/** Why-line produced by the analysis — the component renders it via i18n. */
export interface WhyItem {
  tone: 'up' | 'down' | 'neutral';
  key: string;
  params?: Record<string, string | number>;
}

export interface CheckAnalysis {
  checkTitle: string;
  stats: LabStat[];
  statLabels: Record<LabStat, string>;
  /** Group score before consumable/intel bonuses (includes alarm penalty). */
  baseScore: number;
  bonus: number;
  successBound: number;
  /** P(win ∪ bigwin) — same number the engine clamps against the D100. */
  successPct: number;
  verdicts: Record<Verdict, number>;
  contributors: { stat: LabStat; bestName: string; bestValue: number }[];
  consumable?: { label: string; bonus: number; flag: string };
  consumableApplied: boolean;
  intel?: { label: string; bonus: number };
  alarm: boolean;
  /** Aggregate consequences of THIS check (final member state, %). */
  noHarmPct: number;
  anyWoundPct: number;
  anyDeathPct: number;
  leaderWoundPct: number;
  leaderDeathPct: number;
  interceptorName?: string;
  perMember: MemberOutcome[];
  failHint?: string;
  /** Authored deterministic toll paid before the verdict (e.g. the F5
   *  pursuit): `expected` marginalizes `epicfailAmount` over the verdict
   *  distribution; `targetName` is the most-exposed living member under the
   *  positional weights. */
  toll?: { amount: number; epicfailAmount: number; expected: number; targetName?: string };
  primaryStatsUsed: LabStat[];
}

/**
 * Exact per-verdict harm model — the closed form of `rollCheckHarms` +
 * `applyHarm` (questRun.ts). Per member and verdict: death band `d`, wound
 * band `w` after the verdict modifier; bigwin downgrades deaths to wounds,
 * epicfail upgrades wounds to deaths only where the declared band was > 0;
 * a living bodyguard intercepts every harm aimed at other members; each
 * death event is saved to a wound with probability `deathSaveChance`.
 */
function harmsForVerdict(
  state: QuestRunState,
  node: QuestNode,
  verdict: Verdict,
): { dead: number; wounded: number }[] {
  const vmod = verdict === 'win' || verdict === 'bigwin' ? TUNE.winRiskMod : 0;
  const save = TUNE.deathSaveChance;
  const living = state.party.filter((m) => !m.dead);
  const events = living.map((m) => {
    const base = memberRisk(m, node);
    let d = Math.max(0, base.deathPct + vmod) / 100;
    let w = Math.max(0, base.woundPct + vmod) / 100;
    if (verdict === 'bigwin') {
      w += d;
      d = 0;
    } else if (verdict === 'epicfail' && d > 0) {
      d += w;
      w = 0;
    }
    return { m, d, w };
  });
  const bodyguard = events.find((e) => e.m.role === 'bodyguard');
  if (bodyguard) {
    // Every harm lands on the bodyguard: his dead/wounded odds accumulate
    // across all sources; the others are always safe under his cover.
    let pNoHarm = 1;
    let pNoFatal = 1;
    for (const e of events) {
      pNoHarm *= 1 - e.d - e.w;
      pNoFatal *= 1 - e.d * (1 - save);
    }
    const pDead = 1 - pNoFatal;
    const pWounded = 1 - pNoHarm - pDead;
    return events.map((e) =>
      e === bodyguard
        ? { dead: pDead, wounded: e.m.wounded ? Math.max(0, 1 - pDead) : pWounded }
        : { dead: 0, wounded: e.m.wounded ? 1 : 0 },
    );
  }
  return events.map((e) => {
    const pDead = e.d * (1 - save);
    const pWoundedNew = e.w + e.d * save;
    // An already-wounded member stays wounded unless the check kills him.
    const pWounded = e.m.wounded ? 1 - pDead : pWoundedNew;
    return { dead: pDead, wounded: Math.min(1, pWounded) };
  });
}

/**
 * Exact forecast of one check node in the current state — the same numbers
 * the engine would produce in expectation, without rolling. `useConsumable`
 * is the commit state: true = the armed consumable fires on this check
 * (hypothetical — nothing is consumed by analyzing).
 */
export function analyzeCheck(
  state: QuestRunState,
  node: QuestNode,
  opts?: { useConsumable?: boolean },
): CheckAnalysis {
  const stats = node.stats ?? [];
  const baseScore = groupScore(state, stats);
  const consumable = consumableBonusFor(state, node) ?? undefined;
  const consumableApplied = !!consumable && opts?.useConsumable !== false;
  const intel = intelBonusFor(state, node) ?? undefined;
  const bonus = (consumableApplied ? consumable!.bonus : 0) + (intel?.bonus ?? 0);
  const successBound = clampSuccessBound(baseScore + bonus);
  const verdicts = verdictDistribution(successBound);

  const alive = state.party.filter((m) => !m.dead);
  const contributors = stats.map((s) => {
    const best = alive.length
      ? alive.reduce((a, b) => (b.stats[s] > a.stats[s] ? b : a))
      : null;
    return { stat: s, bestName: best?.name ?? '—', bestValue: best?.stats[s] ?? 0 };
  });

  // Marginalize the per-verdict harm model over the verdict distribution.
  const perMemberAcc = new Map<string, { dead: number; wounded: number }>();
  let noHarm = 0;
  let anyDeath = 0;
  let anyWound = 0;
  for (const v of Object.keys(verdicts) as Verdict[]) {
    const p = verdicts[v];
    if (p === 0) continue;
    const vmod = v === 'win' || v === 'bigwin' ? TUNE.winRiskMod : 0;
    const living = state.party.filter((m) => !m.dead);
    const bands = living.map((m) => {
      const base = memberRisk(m, node);
      let d = Math.max(0, base.deathPct + vmod) / 100;
      let w = Math.max(0, base.woundPct + vmod) / 100;
      if (v === 'bigwin') {
        w += d;
        d = 0;
      } else if (v === 'epicfail' && d > 0) {
        d += w;
        w = 0;
      }
      return { m, d, w };
    });
    const outcomes = harmsForVerdict(state, node, v);
    living.forEach((m, i) => {
      const acc = perMemberAcc.get(m.id) ?? { dead: 0, wounded: 0 };
      acc.dead += p * outcomes[i].dead;
      acc.wounded += p * outcomes[i].wounded;
      perMemberAcc.set(m.id, acc);
    });
    let pNoHarm = 1;
    let pNoFatal = 1;
    let pAllSafe = 1;
    for (const b of bands) {
      pNoHarm *= 1 - b.d - b.w;
      pNoFatal *= 1 - b.d * (1 - TUNE.deathSaveChance);
      // any-wounded-alive: a member stays wounded if already wounded and not
      // killed, or gains a wound (incl. a saved death).
      const woundFinal = b.m.wounded
        ? 1 - b.d * (1 - TUNE.deathSaveChance)
        : b.w + b.d * TUNE.deathSaveChance;
      pAllSafe *= 1 - woundFinal;
    }
    // With a living bodyguard every harm lands on him — the "any" aggregates
    // are the bodyguard's own odds; members already wounded still count.
    if (bands.some((b) => b.m.role === 'bodyguard')) {
      const bgOut = outcomes[bands.findIndex((b) => b.m.role === 'bodyguard')];
      const alreadyWounded = living.some((m) => m.wounded);
      noHarm += p * pNoHarm;
      anyDeath += p * bgOut.dead;
      anyWound += p * (alreadyWounded ? 1 : bgOut.wounded);
    } else {
      noHarm += p * pNoHarm;
      anyDeath += p * (1 - pNoFatal);
      anyWound += p * (1 - pAllSafe);
    }
  }

  /* Deterministic upfront toll (authored, positional) — the guaranteed cost
   * of attempting the check, independent of the verdict bands above. */
  let toll: CheckAnalysis['toll'];
  if (node.upfrontDamage) {
    const pEpic = verdicts.epicfail;
    const epic = node.upfrontDamage.epicfailAmount ?? node.upfrontDamage.amount;
    const w = positionalWeights(alive.length);
    const targetIdx = alive.reduce((best, _, i) => (w[i] > (w[best] ?? 0) ? i : best), 0);
    toll = {
      amount: node.upfrontDamage.amount,
      epicfailAmount: epic,
      expected: node.upfrontDamage.amount * (1 - pEpic) + epic * pEpic,
      targetName: alive[targetIdx]?.name,
    };
  }

  const leader = alive.find((m) => m.role === 'leader');
  const perMember: MemberOutcome[] = alive.map((m) => {
    const acc = perMemberAcc.get(m.id) ?? { dead: 0, wounded: 0 };
    const dead = acc.dead * 100;
    const wounded = acc.wounded * 100;
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      alreadyWounded: m.wounded,
      healthyPct: Math.max(0, 100 - dead - wounded),
      woundPct: wounded,
      deathPct: dead,
    };
  });
  const leaderOut = leader ? perMemberAcc.get(leader.id) : undefined;

  return {
    checkTitle: node.title,
    stats,
    statLabels: STAT_LABELS,
    baseScore,
    bonus,
    successBound,
    successPct: Math.round(successBound),
    verdicts,
    contributors,
    consumable,
    consumableApplied,
    intel,
    alarm: state.alarm,
    noHarmPct: noHarm * 100,
    anyWoundPct: anyWound * 100,
    anyDeathPct: anyDeath * 100,
    leaderWoundPct: (leaderOut?.wounded ?? 0) * 100,
    leaderDeathPct: (leaderOut?.dead ?? 0) * 100,
    interceptorName: alive.find((m) => m.role === 'bodyguard')?.name,
    perMember,
    failHint: node.failHint,
    toll,
    primaryStatsUsed: stats.filter((s) => QUESTS[state.questId].primaryStats.includes(s)),
  };
}

/* ================================================================== */
/* 2. MONTE CARLO QUEST FORECAST                                       */
/* ================================================================== */

export interface MemberSimStats {
  id: string;
  name: string;
  role: string;
  healthyPct: number;
  woundPct: number;
  deathPct: number;
  /** Expected days of post-quest unavailability if wounded (0 if dead/alive). */
  downtimeDays: number;
}

export interface QuestSimResult {
  runs: number;
  /** Outcome distribution in percent. */
  outcomePct: Record<'reward' | 'survived' | 'fled' | 'wipe', number>;
  /** Deaths histogram: index = number of deaths, value = percent. */
  deathsDistPct: number[];
  zeroDeathsPct: number;
  anyDeathPct: number;
  twoPlusDeathsPct: number;
  avgDeathsOnReward: number;
  anyWoundPct: number;
  avgWounded: number;
  leaderWoundPct: number;
  leaderDeathPct: number;
  /** Expected downtime days for the leader (wounded → recovery window). */
  leaderDowntimeDays: number;
  daysAvg: number;
  daysMin: number;
  daysMax: number;
  daysP50: number;
  daysP90: number;
  /** Expected gold in hand at quest end (gold purse + treasure value). */
  goldAvg: number;
  treasureAvg: number;
  lootAvgCount: number;
  /** Optional/high-risk rewards — percent of runs containing the item/flag. */
  optionalPct: { relic: number; guardLoot: number; chestLoot: number; viandanteHelped: number };
  humanDaysAvg: number;
  woundedDowntimeAvg: number;
  perMember: MemberSimStats[];
}

/** FNV-1a 32-bit — stable seed derived from the sim input (no Math.random). */
export function hashSimInput(input: unknown): number {
  const s = JSON.stringify(input);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function cloneForSim(state: QuestRunState): QuestRunState {
  const s = structuredClone(state);
  s.flags = s.flags.filter((f) => !CHECK_CONSUMABLE_FLAGS.has(f));
  return s;
}

/** Drive one simulated run to its end with the declared strategy.
 *  Choice nodes consult the strategy map; unavailable/disabled picks fall
 *  back to the first available option. Checks, harm and info beats resolve
 *  inside `applyChoice`/`enterNode` exactly as in a real run. */
function runOneSim(
  s: QuestRunState,
  nodes: Record<string, QuestNode>,
  strategy: SimStrategy,
): void {
  let guard = 0;
  while (!s.ended && guard++ < 100) {
    const node = nodes[s.nodeId];
    // Combat nodes wait for per-turn input like choice nodes — the sim just
    // keeps taking the single 'fight-turn' action until the fight ends.
    if (!node || (node.kind !== 'choice' && node.kind !== 'combat')) break;
    const opts = availableOptions(s);
    if (opts.length === 0) break;
    const want = strategy[node.id];
    const pick =
      opts.find((o) => o.id === want && !o.disabled) ??
      opts.find((o) => !o.disabled) ??
      opts[0];
    // Mid-run consumable flags are stripped too — the total forecast ignores
    // consumables entirely (Director 2026-10-04).
    s.flags = s.flags.filter((f) => !CHECK_CONSUMABLE_FLAGS.has(f));
    applyChoice(s, pick.id, { useConsumable: false });
  }
}

/**
 * Monte Carlo forecast of the quest from the current state forward.
 * `strategy` declares which option the sim takes at each choice node;
 * `seed` should be a stable hash of the sim inputs so the preview does not
 * jitter on unrelated re-renders.
 */
export function simulateQuest(
  state: QuestRunState,
  strategy: SimStrategy = {},
  opts?: { runs?: number; seed?: number },
): QuestSimResult {
  const runs = Math.max(1, opts?.runs ?? 10000);
  const seedBase = (opts?.seed ?? 1) >>> 0;
  const nodes = nodesFor(state);

  const outcomes = { reward: 0, survived: 0, fled: 0, wipe: 0, running: 0 };
  const deathCounts = new Map<number, number>();
  const memberAcc = new Map<string, { healthy: number; wounded: number; dead: number }>();
  const daysList: number[] = [];
  let sumDeathsOnReward = 0;
  let rewardRuns = 0;
  let anyWound = 0;
  let sumWounded = 0;
  let leaderWounded = 0;
  let leaderDead = 0;
  let goldSum = 0;
  let treasureSum = 0;
  let lootSum = 0;
  let relic = 0;
  let guardLoot = 0;
  let chestLoot = 0;
  let viandante = 0;
  let humanDaysSum = 0;
  let woundedDowntimeSum = 0;

  for (let i = 0; i < runs; i++) {
    const s = cloneForSim(state);
    s.seed = seedBase + i;
    s.rngCalls = 0;
    runOneSim(s, nodes, strategy);

    const outcome = s.outcome === 'running' ? 'running' : s.outcome;
    outcomes[outcome] += 1;
    const dead = s.party.filter((m) => m.dead);
    const woundedAlive = s.party.filter((m) => !m.dead && m.wounded);
    deathCounts.set(dead.length, (deathCounts.get(dead.length) ?? 0) + 1);
    if (outcome === 'reward') {
      rewardRuns += 1;
      sumDeathsOnReward += dead.length;
    }
    if (woundedAlive.length > 0) anyWound += 1;
    sumWounded += woundedAlive.length;
    woundedDowntimeSum += woundedAlive.length * TUNE.rovineWoundedRecoveryDays;
    humanDaysSum += s.party.length * s.days;
    daysList.push(s.days);
    goldSum += s.gold;
    treasureSum += s.bottinoOro;
    lootSum += s.loot.length;
    if (s.loot.includes('reliquia antica')) relic += 1;
    if (s.loot.includes('bottino delle guardie')) guardLoot += 1;
    if (s.loot.includes('forziere goblin')) chestLoot += 1;
    if (s.flags.includes('viandanteAiutato')) viandante += 1;
    for (const m of s.party) {
      const acc = memberAcc.get(m.id) ?? { healthy: 0, wounded: 0, dead: 0 };
      if (m.dead) acc.dead += 1;
      else if (m.wounded) acc.wounded += 1;
      else acc.healthy += 1;
      memberAcc.set(m.id, acc);
    }
    const lead = s.party.find((m) => m.role === 'leader');
    if (lead?.dead) leaderDead += 1;
    else if (lead?.wounded) leaderWounded += 1;
  }

  daysList.sort((a, b) => a - b);
  const pct = (n: number) => (n / runs) * 100;
  const maxDeaths = Math.max(0, ...deathCounts.keys());
  const deathsDistPct = Array.from({ length: maxDeaths + 1 }, (_, i) => pct(deathCounts.get(i) ?? 0));
  const zeroDeaths = pct(deathCounts.get(0) ?? 0);
  const anyDeath = 100 - zeroDeaths;
  const twoPlus = 100 - zeroDeaths - pct(deathCounts.get(1) ?? 0);

  const perMember: MemberSimStats[] = state.party.map((m) => {
    const acc = memberAcc.get(m.id) ?? { healthy: 0, wounded: 0, dead: 0 };
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      healthyPct: pct(acc.healthy),
      woundPct: pct(acc.wounded),
      deathPct: pct(acc.dead),
      downtimeDays: (acc.wounded / runs) * TUNE.rovineWoundedRecoveryDays,
    };
  });

  return {
    runs,
    outcomePct: {
      reward: pct(outcomes.reward),
      survived: pct(outcomes.survived),
      fled: pct(outcomes.fled),
      wipe: pct(outcomes.wipe),
    },
    deathsDistPct,
    zeroDeathsPct: zeroDeaths,
    anyDeathPct: anyDeath,
    twoPlusDeathsPct: twoPlus,
    avgDeathsOnReward: rewardRuns > 0 ? sumDeathsOnReward / rewardRuns : 0,
    anyWoundPct: pct(anyWound),
    avgWounded: sumWounded / runs,
    leaderWoundPct: pct(leaderWounded),
    leaderDeathPct: pct(leaderDead),
    leaderDowntimeDays: pct(leaderWounded) / 100 * TUNE.rovineWoundedRecoveryDays,
    daysAvg: daysList.reduce((a, b) => a + b, 0) / runs,
    daysMin: daysList[0] ?? 0,
    daysMax: daysList[daysList.length - 1] ?? 0,
    daysP50: daysList[Math.floor(runs * 0.5)] ?? 0,
    daysP90: daysList[Math.floor(runs * 0.9)] ?? 0,
    goldAvg: goldSum / runs,
    treasureAvg: treasureSum / runs,
    lootAvgCount: lootSum / runs,
    optionalPct: {
      relic: pct(relic),
      guardLoot: pct(guardLoot),
      chestLoot: pct(chestLoot),
      viandanteHelped: pct(viandante),
    },
    humanDaysAvg: humanDaysSum / runs,
    woundedDowntimeAvg: woundedDowntimeSum / runs,
    perMember,
  };
}

/* ================================================================== */
/* 3. STRATEGY + WHY                                                   */
/* ================================================================== */

/** Choice nodes of a quest in authored order (drives the strategy editor). */
export function choiceNodesFor(state: QuestRunState): QuestNode[] {
  return Object.values(nodesFor(state)).filter((n) => n.kind === 'choice');
}

/** Default strategy: the first authored option of every choice node. */
export function defaultStrategy(state: QuestRunState): SimStrategy {
  const s: SimStrategy = {};
  for (const n of choiceNodesFor(state)) {
    if (n.options?.length) s[n.id] = n.options[0].id;
  }
  return s;
}

/** The push-your-luck choice of each authored quest: which option secures
 *  the stake vs which pushes deeper. Used for the RETURN/CONTINUE compare. */
export const CHECKPOINT_OPTIONS: Record<string, { nodeId: string; secure: string; push: string }> = {
  rovine: { nodeId: 'rv-checkpoint', secure: 'rv-torna', push: 'rv-continua' },
  cassa: { nodeId: 'rientra-o-rischi', secure: 'return-now', push: 'forziere' },
};

/** Causal WHY bullets for the total preview — cause → effect, no internals.
 *  Ordered strongest-first; the component caps the list. */
export function questWhy(state: QuestRunState, strategy: SimStrategy): WhyItem[] {
  const items: WhyItem[] = [];
  const nodes = nodesFor(state);
  const quest = QUESTS[state.questId];
  const alive = state.party.filter((m) => !m.dead);

  for (const s of quest.primaryStats) {
    const best = alive.reduce((a, b) => (b.stats[s] > a.stats[s] ? b : a), alive[0]);
    if (!best) continue;
    if (best.stats[s] >= 70) {
      items.push({ tone: 'up', key: 'statStrong', params: { stat: s, name: best.name, value: best.stats[s] } });
    } else if (best.stats[s] < 40) {
      items.push({ tone: 'down', key: 'statWeak', params: { stat: s, name: best.name, value: best.stats[s] } });
    }
  }
  const wounded = alive.filter((m) => m.wounded);
  if (wounded.length > 0) {
    items.push({ tone: 'down', key: 'woundedParty', params: { count: wounded.length } });
  }
  if (alive.some((m) => m.role === 'bodyguard')) {
    items.push({ tone: 'up', key: 'bodyguardCover', params: {} });
  }
  if (state.alarm) {
    items.push({ tone: 'down', key: 'alarm', params: {} });
  }
  const cp = CHECKPOINT_OPTIONS[state.questId];
  if (cp && nodes[cp.nodeId]) {
    const picked = strategy[cp.nodeId];
    if (picked === cp.push) {
      items.push({ tone: 'down', key: 'pushDeeper', params: {} });
    } else if (picked === cp.secure) {
      items.push({ tone: 'up', key: 'secureStake', params: {} });
    }
  }
  if (state.objectiveDone) {
    items.push({ tone: 'neutral', key: 'stakeOnTable', params: { value: state.bottinoOro } });
  }
  return items;
}
