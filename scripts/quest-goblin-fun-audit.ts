/**
 * QUEST FUN AUDIT — S1 goblin quest (R-096).
 * Extends `quest-goblin-mc.ts`: same real engine, same 4 policies, plus a
 * `random` exploratory policy and per-run decision tracing. Goal: measure the
 * *quality* of gameplay (agency, tension, cascades, replayability), not
 * balance. Output: console + markdown report in test-results/.
 *
 * Usage: `npx tsx scripts/quest-goblin-fun-audit.ts [runsPerPolicy]`
 */
import { writeFileSync } from 'node:fs';
import {
  applyChoice,
  availableOptions,
  consumableBonusFor,
  createRun,
  flee,
  nodesFor,
  useHealing,
  type QuestRunState,
} from '../src/ui/idleVillage/questS1Lab/questRun';

type Policy = 'optimal' | 'cautious' | 'greedy' | 'optimal-flee' | 'random';

interface Snap {
  nodeId: string;
  hpFrac: Record<string, number>; // name → hp/maxHp at decision time
  dead: string[];
  wounded: string[];
  gold: number;
  xp: number;
  flags: string[];
  alarm: boolean;
  goblinLeft: number;
}

interface DecisionTrace {
  nodeId: string;
  optionId: string;
  optionCount: number;
  before: Snap;
  verdict?: string;
  checkTitle?: string;
  events: string[];
  consumable: 'used' | 'saved' | 'none';
  consumableLabel?: string;
  dangerBefore: number;
  stepIndex: number;
}

interface TracedRun {
  state: QuestRunState;
  decisions: DecisionTrace[];
  seed: number;
  dangerTrack: number[]; // danger level at each decision + final
}

/* ------------------------------------------------------------------ */

function seededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function snap(state: QuestRunState): Snap {
  return {
    nodeId: state.nodeId,
    hpFrac: Object.fromEntries(state.party.map((m) => [m.name, m.dead ? 0 : m.hp / m.maxHp])),
    dead: state.party.filter((m) => m.dead).map((m) => m.name),
    wounded: state.party.filter((m) => m.wounded && !m.dead).map((m) => m.name),
    gold: state.gold,
    xp: state.xp,
    flags: [...state.flags],
    alarm: state.alarm,
    goblinLeft: state.goblinLeft,
  };
}

/** 0 safe · 1 uncertain · 2 dangerous · 3 crisis. */
function dangerLevel(state: QuestRunState): number {
  const alive = state.party.filter((m) => !m.dead);
  if (alive.length === 0) return 3;
  const deadCount = state.party.length - alive.length;
  const minFrac = Math.min(...alive.map((m) => m.hp / m.maxHp));
  const leader = state.party.find((m) => m.role === 'leader');
  const leaderFrac = leader && !leader.dead ? leader.hp / leader.maxHp : 0;
  if (deadCount >= 2 || leaderFrac < 0.25 || minFrac < 0.15) return 3;
  if (deadCount === 1 || minFrac < 0.35) return 2;
  if (minFrac < 0.7 || alive.some((m) => m.wounded)) return 1;
  return 0;
}

/* ------------------------------ policies ------------------------------ */

const HEAL_BELOW = 25;

function fixedChoice(state: QuestRunState, policy: Policy): string {
  const opts = availableOptions(state);
  const pickOpt = (id: string) => (opts.some((o) => o.id === id) ? id : (opts[0]?.id ?? 'advance'));
  switch (state.nodeId) {
    case 'gob-esplora':
      return policy === 'greedy' ? pickOpt('gob-forza-tracce') : pickOpt('gob-cerca-tracce');
    case 'gob-bottino-scelta':
      return policy === 'cautious' ? pickOpt('gob-lascia-bottino') : pickOpt('gob-prendi');
    case 'gob-accampamento':
      if (policy === 'cautious' || policy === 'greedy') return pickOpt('gob-via-assalto');
      return state.flags.includes('bonusStealth') || state.flags.includes('bonusStealthPiccolo')
        ? pickOpt('gob-via-stealth')
        : pickOpt('gob-via-assalto');
    case 'gob-combattimento':
    case 'gob-ultimo-scontro':
      return 'fight-turn';
    case 'gob-incalzare':
      return policy === 'cautious' ? pickOpt('gob-lascia-fuggire') : pickOpt('gob-insegui');
    case 'gob-esplora-extra': {
      if (policy === 'cautious') return pickOpt('gob-fermati');
      const limit = policy === 'greedy' ? 4 : 2;
      const hurt = state.party.filter((m) => !m.dead && m.hp < 20).length;
      return state.exploreTurn < limit && hurt === 0 ? pickOpt('gob-fruga') : pickOpt('gob-fermati');
    }
    case 'gob-agguato-scelta':
      return policy === 'cautious' ? pickOpt('gob-molla-trofeo') : pickOpt('gob-ultima-mischia');
    default:
      return opts[0]?.id ?? 'advance';
  }
}

function shouldFlee(state: QuestRunState, policy: Policy, rng: () => number): boolean {
  if (policy === 'optimal-flee') {
    const dead = state.party.filter((m) => m.dead).length;
    const leader = state.party.find((m) => m.role === 'leader');
    return dead >= 2 || !!leader?.dead;
  }
  // random: small chance to bail at any decision point (retreat exists in UI)
  return policy === 'random' && nodesFor(state)[state.nodeId]?.kind === 'choice' && rng() < 0.02;
}

function playTraced(seed: number, policy: Policy): TracedRun {
  let state = createRun('gob-band', seed, 'goblin');
  const rng = seededRng(seed * 2654435761 + 97);
  const decisions: DecisionTrace[] = [];
  const dangerTrack: number[] = [dangerLevel(state)];
  let guard = 0;

  while (!state.ended && guard++ < 150) {
    const node = nodesFor(state)[state.nodeId];
    if (!node) break;
    if (state.flags.includes('hasHealing')) {
      const worst = state.party.filter((m) => !m.dead).sort((a, b) => a.hp - b.hp)[0];
      if (worst && worst.hp < HEAL_BELOW) state = useHealing(state);
    }
    if (shouldFlee(state, policy, rng)) {
      const logMark = state.log.length;
      const before = snap(state);
      state = flee(state);
      decisions.push({
        nodeId: before.nodeId, optionId: 'RETREAT', optionCount: 0, before,
        events: state.log.slice(logMark).map((e) => e.text),
        consumable: 'none', dangerBefore: dangerTrack[dangerTrack.length - 1],
        stepIndex: decisions.length,
      });
      break;
    }

    const opts = availableOptions(state);
    let optionId: string;
    let useConsumable = true;
    if (policy === 'random') {
      optionId = opts[Math.floor(rng() * opts.length)]?.id ?? 'advance';
      useConsumable = rng() < 0.5;
    } else {
      optionId = fixedChoice(state, policy);
    }

    // Which consumable would fire on the check behind this option?
    let consumable: DecisionTrace['consumable'] = 'none';
    let consumableLabel: string | undefined;
    const opt = node.options?.find((o) => o.id === optionId);
    if (opt?.next.startsWith('CHECK:')) {
      const cn = nodesFor(state)[opt.next.slice(6)];
      const c = cn ? consumableBonusFor(state, cn) : null;
      if (c) {
        consumable = useConsumable ? 'used' : 'saved';
        consumableLabel = c.label;
      }
    }

    const before = snap(state);
    const logMark = state.log.length;
    state = applyChoice(state, optionId, { useConsumable });
    // checkQueue is reset per action by applyChoice — non-empty means THIS
    // action resolved a check (fixes stale lastCheck attribution).
    const lastResolved = state.checkQueue[state.checkQueue.length - 1];
    decisions.push({
      nodeId: before.nodeId, optionId, optionCount: opts.length, before,
      verdict: lastResolved?.verdict,
      checkTitle: lastResolved?.title,
      events: state.log.slice(logMark).map((e) => e.text),
      consumable, consumableLabel,
      dangerBefore: dangerTrack[dangerTrack.length - 1],
      stepIndex: decisions.length,
    });
    dangerTrack.push(dangerLevel(state));
  }
  return { state, decisions, seed, dangerTrack };
}

/* ------------------------------ helpers ------------------------------ */

const pct = (x: number, n: number) => (n ? `${((x / n) * 100).toFixed(1)}%` : '—');
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const NODE_LABEL: Record<string, string> = {
  'gob-esplora': 'F1 Esplorazione', 'gob-bottino-scelta': 'F2 Bottino', 'gob-accampamento': 'F3 Approccio',
  'gob-combattimento': 'F4 Combattimento', 'gob-incalzare': 'F5 Incalzare', 'gob-esplora-extra': 'F6 Razzia',
  'gob-agguato-scelta': 'F7 Trofeo-o-sangue', 'gob-ultimo-scontro': 'F7 Ultima mischia',
};
const OPT_LABEL: Record<string, string> = {
  'gob-cerca-tracce': 'Cercare tracce (PER)', 'gob-forza-tracce': 'Sentiero a forza (PER+FOR)',
  'gob-prendi': 'Prendere il bottino (AGI)', 'gob-lascia-bottino': 'Lasciare stare',
  'gob-via-stealth': 'Stealth (AGI)', 'gob-via-assalto': 'Assalto (FOR)',
  'gob-lascia-fuggire': 'Lasciarli fuggire', 'gob-insegui': 'Incalzare (FOR)',
  'gob-fruga': 'Frugare ancora', 'gob-fermati': 'Fermarsi',
  'gob-molla-trofeo': 'Mollare il trofeo', 'gob-ultima-mischia': 'Affrontare la mischia',
  'fight-turn': 'Combatti (turno)', 'gob-partenza': 'Partire', 'RETREAT': 'Retreat',
};
const LVL = ['safe', 'uncertain', 'dangerous', 'crisis'];

/* ------------------------------------------------------------------ */

const N = Number(process.argv[2] ?? 10000);
const RANDOM_N = N * 2;
const lines: string[] = [];
const out = (s = '') => { lines.push(s); console.log(s); };

out('# QUEST FUN AUDIT — Goblin S1');
out(`N=${N} per policy fissa · N=${RANDOM_N} policy random esplorativa\n`);

/* ===== A. Statistical summary ===== */
out('## A. Statistical summary\n');
for (const policy of ['optimal', 'cautious', 'greedy', 'optimal-flee'] as Policy[]) {
  let reward = 0, survived = 0, fledN = 0, wipe = 0;
  const deadDist = [0, 0, 0, 0];
  let deathsTot = 0, woundsTot = 0, goldTot = 0, xpTot = 0, hpLostTot = 0;
  let sterminio = 0, ambush = 0, alarmN = 0, trophyLost = 0, combatTurnsTot = 0, goblinLeftTot = 0;
  const deadBy: Record<string, number> = {}; const woundBy: Record<string, number> = {};
  const hitBy: Record<string, number> = {};
  for (let s = 1; s <= N; s++) {
    const r = playTraced(s, policy).state;
    if (r.outcome === 'reward') reward++; else if (r.outcome === 'survived') survived++;
    else if (r.outcome === 'fled') fledN++; else if (r.outcome === 'wipe') wipe++;
    const dead = r.party.filter((m) => m.dead).length;
    deadDist[Math.min(dead, 3)]++;
    deathsTot += dead;
    woundsTot += r.party.filter((m) => m.wounded && !m.dead).length;
    hpLostTot += r.party.reduce((sum, m) => sum + (m.dead ? m.maxHp : m.maxHp - m.hp), 0);
    goldTot += r.gold; xpTot += r.xp;
    if (r.flags.includes('sterminio')) sterminio++;
    if (r.log.some((e) => e.text.includes('Agguato'))) ambush++;
    if (r.alarm) alarmN++;
    if (r.flags.includes('trofeoLasciato') || r.flags.includes('trofeoPerso')) trophyLost++;
    combatTurnsTot += r.combatTurn; goblinLeftTot += r.goblinLeft;
    for (const m of r.party) {
      if (m.dead) deadBy[m.name] = (deadBy[m.name] ?? 0) + 1;
      else if (m.wounded) woundBy[m.name] = (woundBy[m.name] ?? 0) + 1;
    }
    for (const e of r.log) {
      const m = e.text.match(/^([A-Z][a-z]+) incassa il colpo/);
      if (m) hitBy[m[1]] = (hitBy[m[1]] ?? 0) + 1;
    }
  }
  out(`### ${policy}`);
  out(`- outcome: reward **${pct(reward, N)}** | survived ${pct(survived, N)} | fled ${pct(fledN, N)} | **WIPE ${pct(wipe, N)}**`);
  out(`- deaths: 0 ${pct(deadDist[0], N)} | 1 ${pct(deadDist[1], N)} | 2 ${pct(deadDist[2], N)} | 3+ ${pct(deadDist[3], N)} · mean ${(deathsTot / N).toFixed(2)} · wounds/run ${(woundsTot / N).toFixed(2)} · HP lost ${(hpLostTot / N).toFixed(0)}/280`);
  out(`- gold ${(goldTot / N).toFixed(1)} · XP ${(xpTot / N).toFixed(0)} · sterminio ${pct(sterminio, N)} · ambush ${pct(ambush, N)} · alarm ${pct(alarmN, N)} · trophy lost ${pct(trophyLost, N)}`);
  out(`- combat turns ${(combatTurnsTot / N).toFixed(1)} · goblins left ${(goblinLeftTot / N).toFixed(1)}`);
  out(`- members: ${['Edda', 'Milo', 'Bruna', 'Kran'].map((n) => `**${n}** dead ${pct(deadBy[n] ?? 0, N)} / wounded ${pct(woundBy[n] ?? 0, N)} / hits ${((hitBy[n] ?? 0) / N).toFixed(1)}/run`).join(' · ')}`);
  out('');
}

/* ===== random exploratory runs (kept for all downstream analysis) ===== */
const randomRuns: TracedRun[] = [];
for (let s = 1; s <= RANDOM_N; s++) randomRuns.push(playTraced(s + 500000, 'random'));

/* ===== B. Decision audit ===== */
out('## B. Decision audit (policy random — tutte le opzioni esplorate)\n');
interface OptRec {
  n: number; reward: number; fail: number; fledN: number; wipeN: number;
  deathsAfter: number; woundsEnd: number; gold: number; hpLost: number;
  verdicts: Record<string, number>;
  byEntryHealth: { healthy: { n: number; reward: number; deaths: number }; hurt: { n: number; reward: number; deaths: number } };
}
const nodeOpt = new Map<string, Map<string, OptRec>>();
const blank = (): OptRec => ({
  n: 0, reward: 0, fail: 0, fledN: 0, wipeN: 0, deathsAfter: 0, woundsEnd: 0, gold: 0, hpLost: 0,
  verdicts: {}, byEntryHealth: { healthy: { n: 0, reward: 0, deaths: 0 }, hurt: { n: 0, reward: 0, deaths: 0 } },
});

for (const r of randomRuns) {
  const finalDead = r.state.party.filter((m) => m.dead).length;
  const finalWounds = r.state.party.filter((m) => m.wounded && !m.dead).length;
  const finalHpLost = r.state.party.reduce((s, m) => s + (m.dead ? m.maxHp : m.maxHp - m.hp), 0);
  for (const d of r.decisions) {
    if (!nodeOpt.has(d.nodeId)) nodeOpt.set(d.nodeId, new Map());
    const m = nodeOpt.get(d.nodeId)!;
    if (!m.has(d.optionId)) m.set(d.optionId, blank());
    const a = m.get(d.optionId)!;
    a.n++;
    if (r.state.outcome === 'reward') a.reward++;
    else if (r.state.outcome === 'survived') a.fail++;
    else if (r.state.outcome === 'fled') a.fledN++;
    else a.wipeN++;
    a.deathsAfter += finalDead - d.before.dead.length;
    a.woundsEnd += finalWounds;
    a.gold += r.state.gold;
    a.hpLost += finalHpLost;
    if (d.verdict) a.verdicts[d.verdict] = (a.verdicts[d.verdict] ?? 0) + 1;
    // situationality buckets: min alive hpFrac + dead count at entry
    const aliveFracs = Object.entries(d.before.hpFrac).filter(([n]) => !d.before.dead.includes(n)).map(([, f]) => f);
    const minFrac = aliveFracs.length ? Math.min(...aliveFracs) : 0;
    const bucket = (minFrac >= 0.6 && d.before.dead.length === 0) ? a.byEntryHealth.healthy : a.byEntryHealth.hurt;
    bucket.n++;
    if (r.state.outcome === 'reward') bucket.reward++;
    bucket.deaths += finalDead - d.before.dead.length;
  }
}

for (const [nodeId, opts] of nodeOpt) {
  if (opts.size < 2) continue;
  const total = [...opts.values()].reduce((s, a) => s + a.n, 0);
  out(`### ${NODE_LABEL[nodeId] ?? nodeId} — ${total}× reached, ${opts.size} options`);
  // dominance check: does one option beat the other on both survival AND reward?
  const rows = [...opts.entries()].map(([id, a]) => ({ id, a }));
  for (const { id, a } of rows) {
    const v = Object.entries(a.verdicts).map(([k, c]) => `${k} ${pct(c, a.n)}`).join(' ');
    const h = a.byEntryHealth.healthy, u = a.byEntryHealth.hurt;
    out(`- **${OPT_LABEL[id] ?? id}** (${pct(a.n, total)}, n=${a.n}): reward ${pct(a.reward, a.n)} · fail ${pct(a.fail, a.n)} · fled ${pct(a.fledN, a.n)} · wipe ${pct(a.wipeN, a.n)} | deaths→${(a.deathsAfter / a.n).toFixed(2)} · wounds ${(a.woundsEnd / a.n).toFixed(2)} · gold ${(a.gold / a.n).toFixed(1)} · HP lost ${(a.hpLost / a.n).toFixed(0)}${v ? ` | check: ${v}` : ''}`);
    if (h.n >= 30 && u.n >= 30) {
      out(`    situationality — healthy party: reward ${pct(h.reward, h.n)} deaths ${(h.deaths / h.n).toFixed(2)} | hurt party: reward ${pct(u.reward, u.n)} deaths ${(u.deaths / u.n).toFixed(2)}`);
    }
  }
  // flag dominance / situational flip
  if (rows.length === 2) {
    const [x, y] = rows;
    const winX = x.a.reward / x.a.n, winY = y.a.reward / y.a.n;
    const dX = x.a.deathsAfter / x.a.n, dY = y.a.deathsAfter / y.a.n;
    if (winX > winY && dX < dY) out(`  ⚑ **DOMINANT**: «${OPT_LABEL[x.id]}» wins on reward AND costs fewer deaths — «${OPT_LABEL[y.id]}» may be a trap.`);
    if (winY > winX && dY < dX) out(`  ⚑ **DOMINANT**: «${OPT_LABEL[y.id]}» wins on reward AND costs fewer deaths — «${OPT_LABEL[x.id]}» may be a trap.`);
    if (Math.abs(winX - winY) > 0.03 && Math.abs(dX - dY) > 0.05 && Math.sign(winX - winY) !== Math.sign(dX - dY))
      out(`  ⚑ **TRADEOFF**: more reward ↔ more deaths — potentially healthy decision.`);
    // situational flip: different argmax in healthy vs hurt buckets
    const argH = rows.reduce((b, r) => (r.a.byEntryHealth.healthy.reward / (r.a.byEntryHealth.healthy.n || 1)) > (b.a.byEntryHealth.healthy.reward / (b.a.byEntryHealth.healthy.n || 1)) ? r : b);
    const argU = rows.reduce((b, r) => (r.a.byEntryHealth.hurt.reward / (r.a.byEntryHealth.hurt.n || 1)) > (b.a.byEntryHealth.hurt.reward / (b.a.byEntryHealth.hurt.n || 1)) ? r : b);
    if (argH.id !== argU.id) out(`  ⚑ **SITUATIONAL**: healthy party prefers «${OPT_LABEL[argH.id]}», hurt party prefers «${OPT_LABEL[argU.id]}».`);
  }
  out('');
}

/* ===== C. Tension analysis ===== */
out('## C. Tension analysis\n');
{
  let everDanger = 0, recovered = 0, disaster = 0, lateReversal = 0, damagedDecisions = 0, riskyCont = 0;
  let firstDangerSum = 0, firstDangerN = 0;
  const patterns = new Map<string, number>();
  const transitions = new Map<string, number>();
  for (const r of randomRuns) {
    const track = r.dangerTrack;
    const maxLvl = Math.max(...track);
    if (maxLvl >= 2) {
      everDanger++;
      firstDangerSum += track.findIndex((l) => l >= 2);
      firstDangerN++;
    }
    const finalLvl = track[track.length - 1];
    if (maxLvl >= 2 && finalLvl <= 1) recovered++;
    if (maxLvl >= 2 && (r.state.party.filter((m) => m.dead).length >= 2 || r.state.outcome === 'wipe' || r.state.outcome === 'survived')) disaster++;
    // late reversal: trophy held then lost, or death in last 2 decisions
    const heldTrophy = r.decisions.some((d) => d.events.some((e) => e.includes('Trofeo dei goblin preso')));
    const lostTrophy = r.state.flags.includes('trofeoLasciato') || r.state.flags.includes('trofeoPerso');
    if (heldTrophy && lostTrophy) lateReversal++;
    const dDec = r.decisions.filter((d) => d.dangerBefore >= 1).length;
    damagedDecisions += dDec;
    // risky continuation: chose the "keep going" option while dangerous
    riskyCont += r.decisions.filter((d) => d.dangerBefore >= 2 && ['gob-fruga', 'gob-insegui', 'gob-ultima-mischia', 'fight-turn'].includes(d.optionId)).length;
    const sig = track.filter((l, i) => i === 0 || l !== track[i - 1]).map((l) => LVL[l]).join('→');
    patterns.set(`${sig} ⇒ ${r.state.outcome}`, (patterns.get(`${sig} ⇒ ${r.state.outcome}`) ?? 0) + 1);
    for (let i = 1; i < track.length; i++) {
      const t = `${LVL[track[i - 1]]}→${LVL[track[i]]}`;
      transitions.set(t, (transitions.get(t) ?? 0) + 1);
    }
  }
  out(`- runs reaching danger/crisis: **${pct(everDanger, RANDOM_N)}** · first danger at decision index ${(firstDangerSum / Math.max(1, firstDangerN)).toFixed(1)}`);
  out(`- safe→danger→**recovery** (end safer than peak): ${pct(recovered, RANDOM_N)}`);
  out(`- danger→**disaster** (≥2 dead / wipe / quest failed): ${pct(disaster, RANDOM_N)}`);
  out(`- **trophy held then lost/dropped** (objective reversed mid-run): ${pct(lateReversal, RANDOM_N)}`);
  out(`- decisions taken while damaged/dangerous: ${(damagedDecisions / RANDOM_N).toFixed(1)}/run · risky continues while dangerous: ${(riskyCont / RANDOM_N).toFixed(2)}/run`);
  out(`\nTop tension patterns:`);
  [...patterns.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    .forEach(([p, c]) => out(`- ${pct(c, RANDOM_N)} — ${p}`));
  out('');
}

/* ===== D. Party analysis ===== */
out('## D. Party analysis\n');
{
  const hitBy: Record<string, number> = {}; const deadBy: Record<string, number> = {};
  for (const r of randomRuns) {
    for (const e of r.state.log) {
      const m = e.text.match(/^([A-Z][a-z]+) incassa il colpo/);
      if (m) hitBy[m[1]] = (hitBy[m[1]] ?? 0) + 1;
    }
    for (const m of r.state.party) if (m.dead) deadBy[m.name] = (deadBy[m.name] ?? 0) + 1;
  }
  const totalHits = Object.values(hitBy).reduce((a, b) => a + b, 0);
  out('- hit share (who absorbs): ' + ['Edda', 'Milo', 'Bruna', 'Kran'].map((n) => `${n} ${pct(hitBy[n] ?? 0, totalHits)}`).join(' · '));
  out('- death rate: ' + ['Edda', 'Milo', 'Bruna', 'Kran'].map((n) => `${n} ${pct(deadBy[n] ?? 0, RANDOM_N)}`).join(' · '));
  const maxShare = Math.max(...Object.values(hitBy).map((v) => v / totalHits));
  if (maxShare > 0.6) out(`\n⚑ **DESIGNATED VICTIM**: ${Object.entries(hitBy).sort((a, b) => b[1] - a[1])[0][0]} absorbs ${(maxShare * 100).toFixed(0)}% of all hits regardless of player decisions — positional profile is deterministic, not strategic.`);
  out('');
}

/* ===== E. Consumable analysis ===== */
out('## E. Consumable analysis\n');
{
  const perCheck = new Map<string, { used: { n: number; win: number }; saved: { n: number; win: number } }>();
  for (const r of randomRuns) {
    for (const d of r.decisions) {
      if (d.consumable === 'none' || !d.verdict) continue;
      const key = `${d.checkTitle ?? d.nodeId}`;
      if (!perCheck.has(key)) perCheck.set(key, { used: { n: 0, win: 0 }, saved: { n: 0, win: 0 } });
      const a = perCheck.get(key)!;
      const bucket = d.consumable === 'used' ? a.used : a.saved;
      bucket.n++;
      if (d.verdict === 'win' || d.verdict === 'bigwin') bucket.win++;
    }
  }
  for (const [k, a] of perCheck) {
    if (a.used.n < 30 || a.saved.n < 30) continue;
    out(`- **${k}**: armed ${pct(a.used.win, a.used.n)} success (n=${a.used.n}) vs saved ${pct(a.saved.win, a.saved.n)} (n=${a.saved.n}) — Δ${((a.used.win / a.used.n - a.saved.win / a.saved.n) * 100).toFixed(0)}pp`);
  }
  // does saving for later ever pay? consumables don't compete (different stats) — measured claim:
  const savedAny = randomRuns.filter((r) => r.decisions.some((d) => d.consumable === 'saved'));
  const usedAll = randomRuns.filter((r) => r.decisions.every((d) => d.consumable !== 'saved'));
  out(`\n- runs saving ≥1 consumable: reward ${pct(savedAny.filter((r) => r.state.outcome === 'reward').length, savedAny.length)} vs always-spend ${pct(usedAll.filter((r) => r.state.outcome === 'reward').length, usedAll.length)}`);
  out('');
}

/* ===== F. Replayability ===== */
out('## F. Replayability\n');
{
  const nodeSeqs = new Map<string, number>();
  const decisionSeqs = new Map<string, number>();
  const outcomeCombos = new Map<string, number>();
  for (const r of randomRuns) {
    const nSeq = r.decisions.map((d) => d.nodeId).join('>');
    const dSeq = r.decisions.map((d) => `${d.nodeId}:${d.optionId}`).join('>');
    nodeSeqs.set(nSeq, (nodeSeqs.get(nSeq) ?? 0) + 1);
    decisionSeqs.set(dSeq, (decisionSeqs.get(dSeq) ?? 0) + 1);
    const combo = `${r.state.outcome}|d${r.state.party.filter((m) => m.dead).length}w${r.state.party.filter((m) => m.wounded).length}|alarm:${r.state.alarm}|g${Math.round(r.state.gold / 10)}`;
    outcomeCombos.set(combo, (outcomeCombos.get(combo) ?? 0) + 1);
  }
  out(`- unique node sequences: **${nodeSeqs.size}** · unique decision sequences: **${decisionSeqs.size}** · unique outcome combos: **${outcomeCombos.size}** (su ${RANDOM_N} run)`);
  const topSeq = [...decisionSeqs.entries()].sort((a, b) => b[1] - a[1])[0];
  out(`- most common full trajectory: ${pct(topSeq[1], RANDOM_N)} of runs`);
  out(`- top 3 node paths:`);
  [...nodeSeqs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    .forEach(([s, c]) => out(`    ${pct(c, RANDOM_N)} — ${s.split('>').map((n) => NODE_LABEL[n] ?? n).join(' → ')}`));
  out('');
}

/* ===== G. Representative stories ===== */
out('## G. Representative stories\n');
{
  const story = (r: TracedRun): string[] => {
    const dead = r.state.party.filter((m) => m.dead).map((m) => m.name);
    const wnd = r.state.party.filter((m) => m.wounded && !m.dead).map((m) => m.name);
    const ls = r.decisions
      .filter((d) => d.optionId !== 'fight-turn')
      .map((d) => {
        const check = d.verdict ? ` → ${d.verdict.toUpperCase()}` : '';
        const harm = d.events.filter((e) => e.includes('incassa') || e.includes('non si rialza') || e.includes('muore')).map((e) => ` (${e})`).join('');
        const info = d.events.find((e) => e.includes('sveglia') || e.includes('Agguato') || e.includes('sterminio') || e.includes('trofeo') || e.includes('Trofeo'));
        return `  ${OPT_LABEL[d.optionId] ?? d.optionId}${check}${harm}${info ? ` — ${info}` : ''}`;
      });
    const fightTurns = r.decisions.filter((d) => d.optionId === 'fight-turn').length;
    return [
      `**Run #${r.seed}** — ${r.state.outcome.toUpperCase()} · ${dead.length} morti (${dead.join(',') || '—'}) · ${wnd.length} feriti · ${r.state.gold}g · ${r.state.xp}XP · ${fightTurns} turni F4`,
      ...ls, '',
    ];
  };
  const bucket = (pred: (r: TracedRun) => boolean) => randomRuns.filter(pred);
  const samples: [string, TracedRun[]][] = [
    ['Vittoria pulita', bucket((r) => r.state.outcome === 'reward' && r.state.party.every((m) => !m.dead)).slice(-3)],
    ['Vittoria costosa (morti)', bucket((r) => r.state.outcome === 'reward' && r.state.party.filter((m) => m.dead).length >= 1).slice(-3)],
    ['Quest fallita / resa', bucket((r) => r.state.outcome !== 'reward' && r.state.outcome !== 'wipe').slice(-3)],
    ['Wipe', bucket((r) => r.state.outcome === 'wipe').slice(-2)],
    ['Agguato subito', bucket((r) => r.state.log.some((e) => e.text.includes('Agguato'))).slice(-2)],
    ['Campo sveglio', bucket((r) => r.state.alarm).slice(-2)],
    ['Ritirata', bucket((r) => r.state.outcome === 'fled').slice(-2)],
  ];
  for (const [label, rs] of samples) {
    if (rs.length === 0) { out(`### ${label}\n*(nessuna run nella categoria — dato in sé)*\n`); continue; }
    out(`### ${label}`);
    for (const r of rs) out(story(r).join('\n'));
  }
}

/* ===== write report ===== */
const path = `test-results/quest-goblin-fun-audit-2026-10-07.md`;
writeFileSync(path, lines.join('\n'));
console.log(`\n[report written → ${path}]`);
