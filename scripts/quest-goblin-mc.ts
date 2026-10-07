/**
 * Monte Carlo on the real goblin-quest engine (PLAN-022, S1 lab).
 * Runs N seeds per decision policy and reports outcome/death/wound/gold stats.
 * Usage: `npx tsx scripts/quest-goblin-mc.ts [runs]`
 */
import {
  applyChoice,
  availableOptions,
  createRun,
  flee,
  nodesFor,
  useHealing,
  type QuestRunState,
} from '../src/ui/idleVillage/questS1Lab/questRun';

type Policy = 'optimal' | 'cautious' | 'greedy' | 'optimal-flee';

const HEAL_BELOW = 25;
/** Flat damage every member carries into the run (simulates prior phases). */
const START_DMG = Number(process.env.START_DMG ?? 0);
/** Chip damage dealt to a rear-weighted member on every NEW node entered. */
const ATTRITION = Number(process.env.ATTRITION ?? 0);
const ATTRITION_P = Number(process.env.ATTRITION_P ?? 1); // probability per phase

/** Rear-biased attrition target (positional weights, no escalation). */
function attritionTarget(state: QuestRunState, rng: () => number): void {
  const alive = state.party.filter((m) => !m.dead);
  const w = alive.length === 4 ? [0, 0, 20, 80] : alive.length === 3 ? [0, 20, 80] : alive.length === 2 ? [20, 80] : [100];
  let r = rng() * 100;
  const m = alive.find((_, i) => (r -= w[i]) < 0) ?? alive[alive.length - 1];
  m.hp -= ATTRITION;
  if (m.hp <= 0) { m.hp = 0; m.dead = true; }
}

function seededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function choose(state: QuestRunState, policy: Policy): string {
  const opts = availableOptions(state);
  const node = nodesFor(state)[state.nodeId];
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
      return node?.kind === 'combat' ? 'fight-turn' : (opts[0]?.id ?? 'advance');
  }
}

/** Retreat rule (optimal-flee only): bail when the leader is dead or 2+ members are dead. */
function shouldFlee(state: QuestRunState, policy: Policy): boolean {
  if (policy !== 'optimal-flee') return false;
  const dead = state.party.filter((m) => m.dead).length;
  const leader = state.party.find((m) => m.role === 'leader');
  return dead >= 2 || !!leader?.dead;
}

function playRun(seed: number, policy: Policy): QuestRunState {
  let state = createRun('gob-band', seed, 'goblin');
  if (START_DMG > 0) {
    for (const m of state.party) m.hp = Math.max(1, m.hp - START_DMG);
  }
  const rng = seededRng(seed * 7919 + 13);
  let lastNode = '';
  let guard = 0;
  while (!state.ended && guard++ < 120) {
    if (ATTRITION > 0 && state.nodeId !== lastNode && rng() < ATTRITION_P) {
      attritionTarget(state, rng);
      if (state.party.every((m) => m.dead)) break;
    }
    lastNode = state.nodeId;
    const node = nodesFor(state)[state.nodeId];
    if (!node) break;
    if (state.flags.includes('hasHealing')) {
      const worst = state.party.filter((m) => !m.dead).sort((a, b) => a.hp - b.hp)[0];
      if (worst && worst.hp < HEAL_BELOW) state = useHealing(state);
    }
    if (shouldFlee(state, policy)) return flee(state);
    const optionId = choose(state, policy);
    state = applyChoice(state, optionId, { useConsumable: true });
  }
  return state;
}

const N = Number(process.argv[2] ?? 20000);
const policies: Policy[] = ['optimal', 'cautious', 'greedy', 'optimal-flee'];

for (const policy of policies) {
  let reward = 0, survived = 0, fled = 0, wipe = 0;
  let d0 = 0, d1 = 0, d2 = 0, d3p = 0, deathsTot = 0, woundsTot = 0;
  let goldTot = 0, xpTot = 0, hpLostTot = 0;
  let sterminio = 0, ambush = 0, alarm = 0, trophyLost = 0;
  let combatTurnsTot = 0, goblinLeftTot = 0;
  const deadByMember: Record<string, number> = {};
  const woundByMember: Record<string, number> = {};

  for (let s = 1; s <= N; s++) {
    const r = playRun(s, policy);
    if (r.outcome === 'reward') reward++;
    else if (r.outcome === 'survived') survived++;
    else if (r.outcome === 'fled') fled++;
    else if (r.outcome === 'wipe') wipe++;

    const dead = r.party.filter((m) => m.dead).length;
    if (dead === 0) d0++; else if (dead === 1) d1++; else if (dead === 2) d2++; else d3p++;
    deathsTot += dead;
    woundsTot += r.party.filter((m) => m.wounded && !m.dead).length;
    hpLostTot += r.party.reduce((sum, m) => sum + (m.dead ? m.maxHp : m.maxHp - m.hp), 0);
    goldTot += r.gold;
    xpTot += r.xp;
    if (r.flags.includes('sterminio')) sterminio++;
    if (r.log.some((e) => e.text.includes('Agguato'))) ambush++;
    if (r.alarm) alarm++;
    if (r.flags.includes('trofeoLasciato') || r.flags.includes('trofeoPerso')) trophyLost++;
    combatTurnsTot += r.combatTurn;
    goblinLeftTot += r.goblinLeft;
    for (const m of r.party) {
      if (m.dead) deadByMember[m.name] = (deadByMember[m.name] ?? 0) + 1;
      else if (m.wounded) woundByMember[m.name] = (woundByMember[m.name] ?? 0) + 1;
    }
  }

  const pct = (x: number) => `${((x / N) * 100).toFixed(1)}%`;
  console.log(`\n=== POLICY: ${policy} (N=${N}) ===`);
  console.log(`outcome  reward ${pct(reward)} | survived-no-trophy ${pct(survived)} | fled ${pct(fled)} | WIPE ${pct(wipe)}`);
  console.log(`deaths   0: ${pct(d0)} | 1: ${pct(d1)} | 2: ${pct(d2)} | 3+: ${pct(d3p)} | mean ${(deathsTot / N).toFixed(2)}`);
  console.log(`wounds   mean ${(woundsTot / N).toFixed(2)} alive-but-wounded | HP lost mean ${(hpLostTot / N).toFixed(0)}/280`);
  console.log(`gold     mean ${(goldTot / N).toFixed(1)} | XP mean ${(xpTot / N).toFixed(0)} | sterminio ${pct(sterminio)} | ambush ${pct(ambush)} | alarm ${pct(alarm)} | trophy lost ${pct(trophyLost)}`);
  console.log(`combat   mean turns ${(combatTurnsTot / N).toFixed(1)} | mean goblins left ${(goblinLeftTot / N).toFixed(1)}`);
  console.log(`members  ${Object.keys(deadByMember).concat(Object.keys(woundByMember)).filter((v, i, a) => a.indexOf(v) === i).map((n) => `${n}: dead ${pct(deadByMember[n] ?? 0)} / wounded ${pct(woundByMember[n] ?? 0)}`).join(' | ')}`);
}
