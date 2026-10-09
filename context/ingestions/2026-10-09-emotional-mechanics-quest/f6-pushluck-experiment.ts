/**
 * f6-pushluck-experiment — Round 3 experiment: does the F6 push-your-luck
 * rework create real decisions? Drives the REAL goblin engine
 * (createRun/applyChoice) and implements variants as script-level state
 * adjustments between applyChoice calls. NO engine code is modified.
 *
 * Variants:
 *   A = baseline F6 (damage-only cost, loot instantly banked)
 *   B = A + bust: fail|epicfail on 'gob-cerca' loses the F6-accumulated pile
 *   C = B + chosen scavenger: the scavenger's int/perc decide the check and
 *       the scavenger occupies the exposed (rear) slot during the fruga
 *   C-cover* = C + a designated coverer occupies the exposed slot instead
 *
 * Usage: npx tsx context/ingestions/2026-10-09-emotional-mechanics-quest/f6-pushluck-experiment.ts [N] [--quick] [--regret] [--sens]
 */

import {
  applyChoice,
  availableOptions,
  createRun,
  groupScore,
  useHealing,
  nodesFor,
  TUNE,
  type QuestRunState,
} from '../../../src/ui/idleVillage/questS1Lab/questRun';
import type { LabStat } from '../../../src/ui/idleVillage/questS1Lab/questScenario';

type Variant = 'A' | 'B' | 'B5' | 'BE' | 'C' | 'C-cover';
type ScavPick = 'best' | 'worst' | 'tank' | 'weak';
type PolicyId = 'stop2' | 'stop4' | 'hp40' | 'ev' | 'always';
type PartyId = 'default' | 'weak' | 'three' | 'solo';

const F6_NODE = 'gob-esplora-extra';
const F6_CHECK = 'gob-cerca';
const F6_LOOT_ITEM = 'bottino del campo';
const HP_GOLD_WEIGHT = 0.35; // policy parameter: gold-equivalent of 1 HP
const BUST_PER_TURN = Number(process.env.F6_BUST ?? 0.12); // variant BE: P(trap) = exploreTurn × ramp/turn

/** Deterministic [0,1) for experiment-side rolls, decoupled from the engine
 *  RNG (same value for paired seeds at the same rngCalls point). */
function seededRng(seed: number, salt: number): number {
  let t = (seed * 2654435761 + salt * 974634) >>> 0;
  return ((t ^ (t >>> 15)) * 2246822519 >>> 0) / 4294967296;
}

interface RunResult {
  outcome: string;
  gold: number;
  deaths: number;
  woundedAlive: number;
  frugaTurns: number;
  busts: number;
  goldLostToBust: number;
  f6DamageByMember: Record<string, number>;
  f6DeathsByMember: Record<string, number>;
}

interface RunConfig {
  variant: Variant;
  scav: ScavPick;
  cover: ScavPick | 'none';
  policy: PolicyId;
  party: PartyId;
  seed: number;
}

/* Fixed F0–F5 prefix so every cell enters F6 from a paired state (same seed
 * → same trajectory until the first F6 decision divergence). */
function prefixChoose(state: QuestRunState): string {
  const opts = availableOptions(state);
  const pick = (id: string) => (opts.some((o) => o.id === id) ? id : (opts[0]?.id ?? 'advance'));
  switch (state.nodeId) {
    case 'gob-esplora':
      return pick('gob-cerca-tracce');
    case 'gob-bottino-scelta':
      return pick('gob-prendi');
    case 'gob-accampamento':
      return state.flags.includes('bonusStealth') || state.flags.includes('bonusStealthPiccolo')
        ? pick('gob-via-stealth')
        : pick('gob-via-assalto');
    case 'gob-incalzare':
      return pick('gob-insegui');
    case 'gob-agguato-scelta':
      return pick('gob-ultima-mischia');
    default: {
      const node = nodesFor(state)[state.nodeId];
      return node?.kind === 'combat' ? 'fight-turn' : (opts[0]?.id ?? 'advance');
    }
  }
}

/** Expected gold of one more fruga turn, given the CURRENT state (variant-aware). */
function evContinue(state: QuestRunState, cfg: RunConfig, scavId?: string): number {
  const node = nodesFor(state)[F6_CHECK];
  let score: number;
  if (cfg.variant.startsWith('C') && scavId) {
    const scav = state.party.find((m) => m.id === scavId && !m.dead);
    const stats = (node.stats ?? []) as LabStat[];
    score = scav ? stats.reduce((s, st) => s + scav.stats[st], 0) / Math.max(1, stats.length) : 0;
  } else {
    score = groupScore(state, (node.stats ?? []) as LabStat[]);
  }
  const bound = Math.min(95, Math.max(5, score));
  const pGain = bound / 100; // win|bigwin → +8
  const pAlmost = 5 / 100; // flat band → +4
  const pBust =
    cfg.variant === 'A'
      ? 0
      : cfg.variant === 'B5'
        ? 5 / 100
        : cfg.variant === 'BE'
          ? Math.min(0.9, (state.exploreTurn + 1) * BUST_PER_TURN)
          : Math.max(0, 1 - (bound + 5) / 100); // fail|epicfail
  const pile = Math.max(0, state.gold - goldAtF6Entry);
  const dmg = TUNE.exploreBaseDamage * (state.exploreTurn + 1);
  return pGain * TUNE.exploreLootGold + pAlmost * (TUNE.exploreLootGold / 2) - pBust * pile - HP_GOLD_WEIGHT * dmg;
}

let goldAtF6Entry = 0;

function f6Decide(state: QuestRunState, cfg: RunConfig): 'gob-fruga' | 'gob-fermati' {
  const scavId = cfg.variant.startsWith('C') ? pickMember(state, cfg.scav)?.id : undefined;
  switch (cfg.policy) {
    case 'stop2':
      return state.exploreTurn < 2 ? 'gob-fruga' : 'gob-fermati';
    case 'stop4':
      return state.exploreTurn < 4 ? 'gob-fruga' : 'gob-fermati';
    case 'hp40': {
      const weak = state.party.some((m) => !m.dead && m.hp < 40);
      return !weak && state.exploreTurn < 8 ? 'gob-fruga' : 'gob-fermati';
    }
    case 'ev':
      return state.exploreTurn < 12 && evContinue(state, cfg, scavId) > 0 ? 'gob-fruga' : 'gob-fermati';
    case 'always':
      return 'gob-fruga';
  }
}

/** Member pick among alive: 'best' = max int+perc, 'worst' = min int+perc,
 *  'tank' = max hp, 'weak' = min hp (the sacrificial pick). */
function pickMember(state: QuestRunState, how: ScavPick | 'none', excludeId?: string) {
  const alive = state.party.filter((m) => !m.dead && m.id !== excludeId);
  if (!alive.length || how === 'none') return undefined;
  const val = (m: (typeof alive)[0]) =>
    how === 'tank' || how === 'weak' ? m.hp : m.stats.int + m.stats.perc;
  return alive.reduce((a, b) =>
    how === 'worst' || how === 'weak' ? (val(b) < val(a) ? b : a) : val(b) > val(a) ? b : a,
  );
}

/** Variant-C mutation: scavenger's stats decide the check; `exposedId` moves
 *  to the rear slot (80% weight). Fully restored after the resolution. */
function withVariantC<T>(state: QuestRunState, scavId: string | undefined, exposedId: string | undefined, fn: () => T): T {
  const savedStats = state.party.map((m) => ({ m, int: m.stats.int, perc: m.stats.perc }));
  const savedOrder = [...state.party];
  if (scavId) for (const m of state.party) if (m.id !== scavId) { m.stats.int = 0; m.stats.perc = 0; }
  if (exposedId) {
    const idx = state.party.findIndex((m) => m.id === exposedId);
    if (idx >= 0) { const [m] = state.party.splice(idx, 1); state.party.push(m); }
  }
  try {
    return fn();
  } finally {
    savedStats.forEach(({ m, int, perc }) => { m.stats.int = int; m.stats.perc = perc; });
    state.party.splice(0, state.party.length, ...savedOrder);
  }
}

function playRun(cfg: RunConfig): RunResult {
  let state = createRun('gob-band', cfg.seed, 'goblin');
  const startDead = new Set<string>();
  if (cfg.party === 'weak') {
    for (const m of state.party) {
      for (const s of Object.keys(m.stats) as LabStat[]) m.stats[s] = Math.max(5, m.stats[s] - 10);
      m.maxHp = Math.max(20, m.maxHp - 15);
      m.hp = m.maxHp;
    }
  }
  // 'three': Milo (best scavenger) never made it to the quest. 'solo': Edda alone.
  if (cfg.party === 'three' || cfg.party === 'solo') {
    const killIds = cfg.party === 'three' ? ['g2'] : ['g2', 'g3', 'g4'];
    for (const m of state.party) {
      if (killIds.includes(m.id)) { m.dead = true; m.hp = 0; startDead.add(m.id); }
    }
  }
  goldAtF6Entry = -1;
  let busts = 0;
  let goldLostToBust = 0;
  const f6DamageByMember: Record<string, number> = {};
  const f6DeathsByMember: Record<string, number> = {};
  let guard = 0;

  while (!state.ended && guard++ < 250) {
    const node = nodesFor(state)[state.nodeId];
    if (!node) break;
    if (state.nodeId === F6_NODE && goldAtF6Entry < 0) goldAtF6Entry = state.gold;
    if (state.flags.includes('hasHealing')) {
      const worst = state.party.filter((m) => !m.dead).sort((a, b) => a.hp - b.hp)[0];
      if (worst && worst.hp < 25) state = useHealing(state);
    }

    let optionId: string;
    if (state.nodeId === F6_NODE) {
      optionId = f6Decide(state, cfg);
    } else {
      optionId = prefixChoose(state);
    }

    if (optionId === 'gob-fruga' && cfg.variant.startsWith('C')) {
      const scav = pickMember(state, cfg.scav);
      const cover = cfg.variant === 'C-cover' ? pickMember(state, cfg.cover, scav?.id) : undefined;
      const exposed = cover ?? scav;
      const hpBefore = Object.fromEntries(state.party.map((m) => [m.name, m.hp]));
      const deadBefore = Object.fromEntries(state.party.map((m) => [m.name, m.dead]));
      state = withVariantC(state, scav?.id, exposed?.id, () => applyChoice(state, optionId, { useConsumable: true }));
      for (const m of state.party) {
        const d = (hpBefore[m.name] ?? m.hp) - m.hp;
        if (d > 0) f6DamageByMember[m.name] = (f6DamageByMember[m.name] ?? 0) + d;
        if (m.dead && !deadBefore[m.name]) f6DeathsByMember[m.name] = (f6DeathsByMember[m.name] ?? 0) + 1;
      }
    } else {
      const isFruga = optionId === 'gob-fruga';
      const hpBefore = isFruga ? Object.fromEntries(state.party.map((m) => [m.name, m.hp])) : null;
      const deadBefore = isFruga ? Object.fromEntries(state.party.map((m) => [m.name, m.dead])) : null;
      state = applyChoice(state, optionId, { useConsumable: true });
      if (isFruga && hpBefore) {
        for (const m of state.party) {
          const d = (hpBefore[m.name] ?? m.hp) - m.hp;
          if (d > 0) f6DamageByMember[m.name] = (f6DamageByMember[m.name] ?? 0) + d;
          if (m.dead && !deadBefore?.[m.name]) f6DeathsByMember[m.name] = (f6DeathsByMember[m.name] ?? 0) + 1;
        }
      }
    }

    // Variant B/C bust: a failed fruga loses the F6 pile (state.gold delta
    // since F6 entry) and the carried 'bottino del campo' items.
    // B/C: bust on fail|epicfail. B5: bust only on epicfail (the 5% tail —
    // the trap springs rarely, so pushing stays viable deeper).
    // BE: bust is an independent escalating trap roll (12% × exploreTurn),
    // decoupled from the loot check — fires on ANY verdict, win included.
    if (optionId === 'gob-fruga' && cfg.variant !== 'A' && !state.ended) {
      const v = state.lastCheck?.verdict;
      const isBust =
        cfg.variant === 'BE'
          ? seededRng(cfg.seed, 50_000 + state.rngCalls) < Math.min(0.9, state.exploreTurn * BUST_PER_TURN)
          : cfg.variant === 'B5'
            ? v === 'epicfail'
            : v === 'fail' || v === 'epicfail';
      const checkOk = cfg.variant === 'BE' || state.lastCheck?.title?.startsWith('Razzia');
      if (checkOk && isBust) {
        const pile = Math.max(0, state.gold - goldAtF6Entry);
        if (pile > 0 || state.loot.includes(F6_LOOT_ITEM)) {
          state.gold -= pile;
          state.loot = state.loot.filter((l) => l !== F6_LOOT_ITEM);
          busts += 1;
          goldLostToBust += pile;
          state.log.push({ kind: 'LOOT', text: `La trappola scatta: il mucchio raccolto resta tra le mani del campo (−${pile} gold).` });
        }
      }
    }
  }

  return {
    outcome: state.outcome,
    gold: state.gold,
    deaths: state.party.filter((m) => m.dead && !startDead.has(m.id)).length,
    woundedAlive: state.party.filter((m) => !m.dead && m.wounded).length,
    frugaTurns: state.exploreTurn,
    busts,
    goldLostToBust,
    f6DamageByMember,
    f6DeathsByMember,
  };
}

/* ------------------------------------------------------------------ */
/* Counterfactual regret probe (§5): at the LAST F6 continue decision of   */
/* a run, clone the state and evaluate stop-now vs continue-once.          */
/* ------------------------------------------------------------------ */

interface RegretProbe {
  seed: number;
  pileAtDecision: number;
  turn: number;
  chose: 'continue';
  stopGold: number; stopDeaths: number; stopOutcome: string;
  contGold: number; contDeaths: number; contOutcome: string;
}

function probeRegret(cfg: RunConfig, seed: number): RegretProbe | null {
  let state = createRun('gob-band', seed, 'goblin');
  goldAtF6Entry = -1;
  let guard = 0;
  let snapshot: QuestRunState | null = null;
  let pileAtDecision = 0;
  let turnAtDecision = 0;

  while (!state.ended && guard++ < 250) {
    const node = nodesFor(state)[state.nodeId];
    if (!node) break;
    if (state.nodeId === F6_NODE && goldAtF6Entry < 0) goldAtF6Entry = state.gold;
    if (state.flags.includes('hasHealing')) {
      const worst = state.party.filter((m) => !m.dead && m.hp < 25)[0];
      if (worst) state = useHealing(state);
    }
    let optionId: string;
    if (state.nodeId === F6_NODE) {
      optionId = f6Decide(state, cfg);
      if (optionId === 'gob-fruga') {
        snapshot = structuredClone(state) as QuestRunState;
        pileAtDecision = Math.max(0, state.gold - goldAtF6Entry);
        turnAtDecision = state.exploreTurn + 1;
      }
    } else {
      optionId = prefixChoose(state);
    }
    state = applyChoice(state, optionId, { useConsumable: true });
  }
  if (!snapshot) return null;

  // Play out the cloned state under variant-B rules: first action given,
  // then always 'gob-fermati' at F6 and the fixed prefix elsewhere.
  const finishB = (s: QuestRunState, first: string): QuestRunState => {
    let g = 0;
    let st = s;
    let action = first;
    while (!st.ended && g++ < 250) {
      st = applyChoice(st, action, { useConsumable: true });
      if (action === 'gob-fruga' && !st.ended) {
        const v = st.lastCheck?.verdict;
        const isBust =
          cfg.variant === 'BE'
            ? seededRng(seed, 50_000 + st.rngCalls) < Math.min(0.9, st.exploreTurn * BUST_PER_TURN)
            : cfg.variant === 'B5'
              ? v === 'epicfail'
              : v === 'fail' || v === 'epicfail';
        if (st.lastCheck?.title?.startsWith('Razzia') && isBust) {
          const lose = Math.max(0, st.gold - goldAtF6Entry);
          st.gold -= lose;
          st.loot = st.loot.filter((l) => l !== F6_LOOT_ITEM);
        }
      }
      if (st.ended) break;
      if (!nodesFor(st)[st.nodeId]) break;
      action = st.nodeId === F6_NODE ? 'gob-fermati' : prefixChoose(st);
    }
    return st;
  };

  const stopState = finishB(structuredClone(snapshot), 'gob-fermati');
  const contState = finishB(structuredClone(snapshot), 'gob-fruga');
  return {
    seed,
    pileAtDecision,
    turn: turnAtDecision,
    chose: 'continue',
    stopGold: stopState.gold,
    stopDeaths: stopState.party.filter((m) => m.dead).length,
    stopOutcome: stopState.outcome,
    contGold: contState.gold,
    contDeaths: contState.party.filter((m) => m.dead).length,
    contOutcome: contState.outcome,
  };
}

/* ------------------------------------------------------------------ */
/* Driver                                                                */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const N = Number(args[0] ?? (flags.has('--quick') ? 500 : 3000));

function summarize(label: string, rs: RunResult[]) {
  const n = rs.length;
  const mean = (f: (r: RunResult) => number) => rs.reduce((s, r) => s + f(r), 0) / n;
  const pct = (x: number) => `${((x / n) * 100).toFixed(1)}%`;
  const goldMean = mean((r) => r.gold);
  const sd = Math.sqrt(rs.reduce((s, r) => s + (r.gold - goldMean) ** 2, 0) / n);
  const ci = (1.96 * sd) / Math.sqrt(n);
  const bustRuns = rs.filter((r) => r.busts > 0).length;
  const members = [...new Set(rs.flatMap((r) => Object.keys(r.f6DamageByMember)))];
  console.log(
    `${label.padEnd(46)} | E[gold] ${goldMean.toFixed(1).padStart(6)} ±${ci.toFixed(1)} | bust ${pct(bustRuns).padStart(5)}` +
      ` | wipe ${pct(rs.filter((r) => r.outcome === 'wipe').length).padStart(5)} | dead m ${mean((r) => r.deaths).toFixed(2)}` +
      ` | fruga μ${mean((r) => r.frugaTurns).toFixed(1)} | lostμ ${mean((r) => r.goldLostToBust).toFixed(1)}g`,
  );
  if (members.length) {
    console.log(
      `${''.padEnd(46)} | dmgF6: ` +
        members.map((n) => `${n} ${mean((r) => r.f6DamageByMember[n] ?? 0).toFixed(1)}hp`).join(' | '),
    );
  }
}

const cells: { variant: Variant; scav: ScavPick; cover: ScavPick | 'none'; label: string }[] = [
  { variant: 'A', scav: 'best', cover: 'none', label: 'A baseline' },
  { variant: 'B', scav: 'best', cover: 'none', label: 'B bust-on-pile (fail+epic)' },
  { variant: 'B5', scav: 'best', cover: 'none', label: 'B5 bust=epicfail only' },
  { variant: 'BE', scav: 'best', cover: 'none', label: `BE bust=trap ${Math.round(BUST_PER_TURN * 100)}%/turn` },
  { variant: 'C', scav: 'best', cover: 'none', label: 'C scav=best' },
  { variant: 'C', scav: 'worst', cover: 'none', label: 'C scav=worst' },
  { variant: 'C', scav: 'tank', cover: 'none', label: 'C scav=tank' },
  { variant: 'C-cover', scav: 'best', cover: 'tank', label: 'C-cover scav=best cov=tank' },
  { variant: 'C-cover', scav: 'best', cover: 'weak', label: 'C-cover scav=best cov=weak' },
];
const policies: PolicyId[] = ['stop2', 'stop4', 'hp40', 'ev', 'always'];

const cellFilter = process.env.F6_CELLS?.split(',');
const activeCells = cellFilter ? cells.filter((c) => cellFilter.some((f) => c.label.startsWith(f))) : cells;

if (!flags.has('--regret') && !flags.has('--sens')) {
  for (const party of (process.env.F6_PARTIES?.split(',') ?? ['default', 'weak']) as PartyId[]) {
    console.log(`\n##### PARTY: ${party}  (N=${N} per cell, seeds 1..N paired)`);
    for (const cell of activeCells) {
      for (const policy of policies) {
        const rs: RunResult[] = [];
        for (let s = 1; s <= N; s++) {
          rs.push(playRun({ variant: cell.variant, scav: cell.scav, cover: cell.cover, policy, party, seed: s }));
        }
        summarize(`${cell.label} | ${policy}`, rs);
      }
    }
  }
}

if (flags.has('--sens')) {
  // ±20% on exploreLootGold (8→7/10 rounding up to keep int-ish) and exploreBaseDamage (5→4/6)
  const baseLoot = TUNE.exploreLootGold;
  const baseDmg = TUNE.exploreBaseDamage;
  const grid: { name: string; loot: number; dmg: number }[] = [
    { name: 'loot×0.8 dmg×1.0', loot: Math.max(1, Math.round(baseLoot * 0.8)), dmg: baseDmg },
    { name: 'loot×1.0 dmg×1.0', loot: baseLoot, dmg: baseDmg },
    { name: 'loot×1.25 dmg×1.0', loot: Math.round(baseLoot * 1.25), dmg: baseDmg },
    { name: 'loot×1.0 dmg×0.8', loot: baseLoot, dmg: Math.max(1, Math.round(baseDmg * 0.8)) },
    { name: 'loot×1.0 dmg×1.2', loot: baseLoot, dmg: Math.round(baseDmg * 1.2) },
  ];
  console.log(`\n##### SENSITIVITY (N=${N}, party=default)`);
  for (const g of grid) {
    TUNE.exploreLootGold = g.loot;
    TUNE.exploreBaseDamage = g.dmg;
    console.log(`--- ${g.name} (loot=${g.loot} dmg=${g.dmg})`);
    for (const cell of cells.filter((c) => ['A baseline', 'B bust-on-pile (fail+epic)', 'B5 bust=epicfail only', 'C scav=best', 'C-cover scav=best cov=tank'].includes(c.label) || c.label.startsWith('BE bust'))) {
      for (const policy of policies) {
        const rs: RunResult[] = [];
        for (let s = 1; s <= N; s++) {
          rs.push(playRun({ variant: cell.variant, scav: cell.scav, cover: cell.cover, policy, party: 'default', seed: s }));
        }
        summarize(`${cell.label} | ${policy}`, rs);
      }
    }
  }
  TUNE.exploreLootGold = baseLoot;
  TUNE.exploreBaseDamage = baseDmg;
}

if (flags.has('--regret')) {
  for (const v of ['B', 'B5', 'BE'] as Variant[]) {
    for (const pol of ['stop4', 'ev'] as PolicyId[]) {
      console.log(`\n##### REGRET PROBE (variant ${v}, policy ${pol}, party=default, N=${N})`);
      const probes: RegretProbe[] = [];
      for (let s = 1; s <= N; s++) {
        const p = probeRegret({ variant: v, scav: 'best', cover: 'none', policy: pol, party: 'default', seed: s }, s);
        if (p) probes.push(p);
      }
      if (!probes.length) { console.log('no decision points probed'); continue; }
      let contBetter = 0, stopBetter = 0, tie = 0;
      const regretCases: RegretProbe[] = [];
      const counterCases: RegretProbe[] = [];
      for (const p of probes) {
        const score = (g: number, d: number) => g - 25 * d; // death counted ≈25g for comparison
        const ds = score(p.stopGold, p.stopDeaths);
        const dc = score(p.contGold, p.contDeaths);
        if (dc > ds) { contBetter++; counterCases.push(p); }
        else if (ds > dc) { stopBetter++; regretCases.push(p); }
        else tie++;
      }
      console.log(`decisions probed: ${probes.length}`);
      console.log(`continue better: ${contBetter} (${((contBetter / probes.length) * 100).toFixed(1)}%) | ` +
        `stop better (regret opportunity): ${stopBetter} (${((stopBetter / probes.length) * 100).toFixed(1)}%) | tie ${tie}`);
      console.log(`Illustrative regret cases (continue was reasonable, stop would have won):`);
      regretCases.slice(0, 5).forEach((p) =>
        console.log(
          `  seed ${p.seed} turn ${p.turn} pile ${p.pileAtDecision}g → continue: ${p.contGold}g/${p.contDeaths}d (${p.contOutcome}) | stop: ${p.stopGold}g/${p.stopDeaths}d (${p.stopOutcome})`,
        ),
      );
      console.log(`Counterfactual cases (continue paid off):`);
      counterCases.slice(0, 5).forEach((p) =>
        console.log(
          `  seed ${p.seed} turn ${p.turn} pile ${p.pileAtDecision}g → continue: ${p.contGold}g/${p.contDeaths}d (${p.contOutcome}) | stop: ${p.stopGold}g/${p.stopDeaths}d (${p.stopOutcome})`,
        ),
      );
    }
  }
}
