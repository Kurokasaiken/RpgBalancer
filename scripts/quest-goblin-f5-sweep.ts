/**
 * F5 candidate sweep (R-097) — compares pursuit models on the real engine.
 * Each candidate toggles TUNE knobs / scenario flags per batch, runs two arms
 * (F5 always-pursue, F5 always-flee — optimal policy elsewhere) and prints the
 * metrics the spec requires. Usage: `npx tsx scripts/quest-goblin-f5-sweep.ts [N]`
 */
import {
  applyChoice,
  availableOptions,
  createRun,
  flee,
  nodesFor,
  useHealing,
  TUNE,
  type QuestRunState,
} from '../src/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_NODES } from '../src/ui/idleVillage/questS1Lab/questScenarioGoblin';

const N = Number(process.argv[2] ?? 10000);
const HEAL_BELOW = 25;

type F5Arm = 'pursue' | 'flee';

function choose(state: QuestRunState, arm: F5Arm): string {
  const opts = availableOptions(state);
  const node = nodesFor(state)[state.nodeId];
  const pickOpt = (id: string) => (opts.some((o) => o.id === id) ? id : (opts[0]?.id ?? 'advance'));
  switch (state.nodeId) {
    case 'gob-esplora': return pickOpt('gob-cerca-tracce');
    case 'gob-bottino-scelta': return pickOpt('gob-prendi');
    case 'gob-accampamento':
      return state.flags.includes('bonusStealth') || state.flags.includes('bonusStealthPiccolo')
        ? pickOpt('gob-via-stealth') : pickOpt('gob-via-assalto');
    case 'gob-incalzare': return arm === 'pursue' ? pickOpt('gob-insegui') : pickOpt('gob-lascia-fuggire');
    case 'gob-esplora-extra': {
      const hurt = state.party.filter((m) => !m.dead && m.hp < 20).length;
      return state.exploreTurn < 2 && hurt === 0 ? pickOpt('gob-fruga') : pickOpt('gob-fermati');
    }
    case 'gob-agguato-scelta': {
      // fight the last stand unless the expected hit would kill the weakest
      // rear member — then drop the trophy (if the bail-out exists).
      if (process.env.F7_ALWAYS_FIGHT === '1') return pickOpt('gob-ultima-mischia');
      const fightOpt = opts.find((o) => o.id === 'gob-ultima-mischia');
      if (!fightOpt) return opts[0]?.id ?? 'advance'; // bail hidden: fight is forced
      const expectedHit =
        25 + (state.flags.includes('agguatoPeggiore') ? 5 : 0) +
        (state.flags.includes('agguatoMite') ? -5 : 0);
      const rear = state.party.filter((m) => !m.dead && m.role !== 'leader').sort((a, b) => a.hp - b.hp)[0];
      return rear && rear.hp <= expectedHit ? pickOpt('gob-molla-trofeo') : 'gob-ultima-mischia';
    }
    default:
      return node?.kind === 'combat' ? 'fight-turn' : (opts[0]?.id ?? 'advance');
  }
}

interface ArmStats {
  reward: number; survived: number; fledN: number; wipe: number;
  deathsTot: number; woundsTot: number; goldTot: number; hpLostTot: number;
  f5win: number; f5fail: number; f5almost: number; f5reached: number;
  ambush: number; forcedFight: number; deathsAtF5: number;
  hurtN: number; hurtReward: number; hurtDeaths: number; hurtWipe: number;
}

function playArm(seed: number, arm: F5Arm): { st: QuestRunState; a: ArmStats } {
  let s = createRun('gob-band', seed, 'goblin');
  const a: ArmStats = { reward: 0, survived: 0, fledN: 0, wipe: 0, deathsTot: 0, woundsTot: 0, goldTot: 0, hpLostTot: 0, f5win: 0, f5fail: 0, f5almost: 0, f5reached: 0, ambush: 0, forcedFight: 0, deathsAtF5: 0, hurtN: 0, hurtReward: 0, hurtDeaths: 0, hurtWipe: 0 };
  let hurtAtF5 = false;
  let guard = 0;
  while (!s.ended && guard++ < 150) {
    const node = nodesFor(s)[s.nodeId];
    if (!node) break;
    if (s.flags.includes('hasHealing')) {
      const worst = s.party.filter((m) => !m.dead).sort((x, y) => x.hp - y.hp)[0];
      if (worst && worst.hp < HEAL_BELOW) s = useHealing(s);
    }
    if (s.nodeId === 'gob-incalzare') {
      const alive = s.party.filter((m) => !m.dead);
      const minFrac = Math.min(...alive.map((m) => m.hp / m.maxHp));
      hurtAtF5 = minFrac < 0.4 || s.party.some((m) => m.dead);
      if (hurtAtF5) a.hurtN++;
    }
    const optId = choose(s, arm);
    const deadBefore = s.party.filter((m) => m.dead).length;
    const wasF5 = s.nodeId === 'gob-incalzare' && optId === 'gob-insegui';
    s = applyChoice(s, optId, { useConsumable: true });
    if (wasF5) {
      a.f5reached++;
      const v = s.lastCheck?.verdict;
      if (v === 'win' || v === 'bigwin') a.f5win++;
      else if (v === 'almost') a.f5almost++;
      else a.f5fail++;
      a.deathsAtF5 += s.party.filter((m) => m.dead).length - deadBefore;
    }
  }
  if (s.outcome === 'reward') a.reward++;
  else if (s.outcome === 'survived') a.survived++;
  else if (s.outcome === 'fled') a.fledN++;
  else if (s.outcome === 'wipe') a.wipe++;
  if (hurtAtF5) {
    if (s.outcome === 'reward') a.hurtReward++;
    if (s.outcome === 'wipe') a.hurtWipe++;
    a.hurtDeaths += s.party.filter((m) => m.dead).length;
  }
  a.deathsTot += s.party.filter((m) => m.dead).length;
  a.woundsTot += s.party.filter((m) => m.wounded && !m.dead).length;
  a.goldTot += s.gold;
  a.hpLostTot += s.party.reduce((sum, m) => sum + (m.dead ? m.maxHp : m.maxHp - m.hp), 0);
  if (s.log.some((e) => e.text.includes('Agguato'))) a.ambush++;
  if (s.log.some((e) => e.text.includes('ultima mischia')) && s.flags.includes('agguatoPeggiore')) a.forcedFight++;
  return { st: s, a };
}

/* ---- candidates (v2 spec: pursue = toll ALWAYS + mild ambush on escape;
 * flee = no toll + HEAVY ambush. Before = R-097 v1 results, already measured) ---- */
interface Cfg {
  name: string;
  toll: number; epic: number; pegFlatBonus: number; miteBonus: number;
  fleeFlag: 'agguatoPeggiore' | 'agguatoMite' | null;
  peggioreHidesDrop: boolean;
}
const CANDIDATES: Cfg[] = [
  { name: 'N1 v2 spec-faithful', toll: 10, epic: 20, pegFlatBonus: 0, miteBonus: -5, fleeFlag: 'agguatoPeggiore', peggioreHidesDrop: false },
  { name: 'N2 N1 + flee hides bail', toll: 10, epic: 20, pegFlatBonus: 0, miteBonus: -5, fleeFlag: 'agguatoPeggiore', peggioreHidesDrop: true },
  { name: 'N3 N1 + flee flat +5', toll: 10, epic: 20, pegFlatBonus: 5, miteBonus: -5, fleeFlag: 'agguatoPeggiore', peggioreHidesDrop: false },
  { name: 'N4 N1 + toll 15', toll: 15, epic: 25, pegFlatBonus: 0, miteBonus: -5, fleeFlag: 'agguatoPeggiore', peggioreHidesDrop: false },
];

const mollaOpt = () => GOBLIN_NODES['gob-agguato-scelta'].options?.find((o) => o.id === 'gob-molla-trofeo');
const fleeOpt = () => GOBLIN_NODES['gob-incalzare'].options?.find((o) => o.id === 'gob-lascia-fuggire');

const pct = (x: number, n: number) => `${((x / n) * 100).toFixed(1)}%`;

for (const c of CANDIDATES) {
  // apply candidate config
  TUNE.ambushMiteBonus = c.miteBonus;
  GOBLIN_NODES['gob-incalza-check'].upfrontDamage = { amount: c.toll, epicfailAmount: c.epic };
  TUNE.ambushPeggioreFlatBonus = c.pegFlatBonus;
  const fo = fleeOpt()!; if (c.fleeFlag) fo.sets = c.fleeFlag; else delete fo.sets;
  const mo = mollaOpt()!; if (c.peggioreHidesDrop) mo.hiddenIfFlag = 'agguatoPeggiore'; else delete mo.hiddenIfFlag;

  console.log(`\n===== ${c.name} =====`);
  const blankArm = (): ArmStats => ({ reward: 0, survived: 0, fledN: 0, wipe: 0, deathsTot: 0, woundsTot: 0, goldTot: 0, hpLostTot: 0, f5win: 0, f5fail: 0, f5almost: 0, f5reached: 0, ambush: 0, forcedFight: 0, deathsAtF5: 0, hurtN: 0, hurtReward: 0, hurtDeaths: 0, hurtWipe: 0 });
  const arms: Record<F5Arm, ArmStats> = { pursue: blankArm(), flee: blankArm() };
  for (let s = 1; s <= N; s++) {
    const p = playArm(s, 'pursue'); for (const k of Object.keys(arms.pursue) as (keyof ArmStats)[]) arms.pursue[k] += p.a[k];
    const f = playArm(s, 'flee'); for (const k of Object.keys(arms.flee) as (keyof ArmStats)[]) arms.flee[k] += f.a[k];
  }
  for (const arm of ['pursue', 'flee'] as F5Arm[]) {
    const a = arms[arm];
    console.log(`  arm=${arm}: reward ${pct(a.reward, N)} | survived ${pct(a.survived, N)} | fled ${pct(a.fledN, N)} | wipe ${pct(a.wipe, N)} | deaths ${(a.deathsTot / N).toFixed(2)} | wounds ${(a.woundsTot / N).toFixed(2)} | gold ${(a.goldTot / N).toFixed(1)} | HP lost ${(a.hpLostTot / N).toFixed(0)}`);
    console.log(`           F5: reached ${pct(a.f5reached, N)} win ${pct(a.f5win, Math.max(1, a.f5reached))} almost ${pct(a.f5almost, Math.max(1, a.f5reached))} fail ${pct(a.f5fail, Math.max(1, a.f5reached))} | deaths@F5 ${(a.deathsAtF5 / N).toFixed(3)} | ambush ${pct(a.ambush, N)} | forced-fight ${pct(a.forcedFight, N)}`);
    if (a.hurtN > 0)
      console.log(`           HURT-at-F5 (n=${a.hurtN}): reward ${pct(a.hurtReward, a.hurtN)} | wipe ${pct(a.hurtWipe, a.hurtN)} | deaths ${(a.hurtDeaths / a.hurtN).toFixed(2)}`);
  }
}
