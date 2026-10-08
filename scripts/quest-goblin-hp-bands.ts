/**
 * HP-band + death-source metrics on the goblin engine (R-103 emotional check).
 * For each policy: how often someone is below 35%/20% HP mid-run (the
 * "grave"/"al limite" narration bands), where deaths happen (which source),
 * and which harm lines actually fired.
 * Usage: `npx tsx scripts/quest-goblin-hp-bands.ts [runs]`
 */
import {
  applyChoice,
  availableOptions,
  createRun,
  nodesFor,
  useHealing,
  type QuestRunState,
} from '../src/ui/idleVillage/questS1Lab/questRun';

type Policy = 'optimal' | 'greedy' | 'cautious';
const HEAL_BELOW = 25;

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

interface RunStats {
  minFracEver: number; // lowest alive-member hp fraction reached at any point
  minFracEnd: number; // lowest alive-member fraction at run end
  deathSources: string[]; // «source» of each death line
  harmBand: Record<string, number>; // narration band counts
}

function playRun(seed: number, policy: Policy): { s: QuestRunState; st: RunStats } {
  let state = createRun('gob-band', seed, 'goblin');
  const st: RunStats = { minFracEver: 1, minFracEnd: 1, deathSources: [], harmBand: {} };
  const mark = () => {
    const alive = state.party.filter((m) => !m.dead);
    if (alive.length) {
      const f = Math.min(...alive.map((m) => m.hp / m.maxHp));
      if (f < st.minFracEver) st.minFracEver = f;
    }
  };
  let guard = 0;
  let logIdx = 0;
  while (!state.ended && guard++ < 120) {
    if (state.flags.includes('hasHealing')) {
      const worst = state.party.filter((m) => !m.dead).sort((a, b) => a.hp - b.hp)[0];
      if (worst && worst.hp < HEAL_BELOW) state = useHealing(state);
    }
    const node = nodesFor(state)[state.nodeId];
    if (!node) break;
    state = applyChoice(state, choose(state, policy), { useConsumable: true });
    mark();
    for (; logIdx < state.log.length; logIdx += 1) {
      const e = state.log[logIdx];
      if (e.kind === 'DEATH') {
        const src = e.text.match(/su «([^»]+)»/);
        st.deathSources.push(src ? src[1] : '(no source)');
      }
      if (e.kind === 'HARM') {
        const band = e.text.includes('regge solo perché')
          ? '<20%'
          : e.text.includes('sangue sul fianco')
            ? '20-35%'
            : e.text.includes('si piega')
              ? '35-70%'
              : '>70%';
        st.harmBand[band] = (st.harmBand[band] ?? 0) + 1;
      }
    }
  }
  const alive = state.party.filter((m) => !m.dead);
  if (alive.length) st.minFracEnd = Math.min(...alive.map((m) => m.hp / m.maxHp));
  return { s: state, st };
}

const N = Number(process.argv[2] ?? 20000);
for (const policy of ['optimal', 'greedy', 'cautious'] as const) {
  let below35 = 0, below20 = 0, below35End = 0;
  let harmGrave = 0, harmLimite = 0, harmSolido = 0, harmLieve = 0;
  const deathSrc: Record<string, number> = {};
  let deaths = 0;
  for (let seed = 1; seed <= N; seed++) {
    const { st } = playRun(seed, policy);
    if (st.minFracEver < 0.35) below35++;
    if (st.minFracEver < 0.2) below20++;
    if (st.minFracEnd < 0.35) below35End++;
    harmLieve += st.harmBand['>70%'] ?? 0;
    harmSolido += st.harmBand['35-70%'] ?? 0;
    harmGrave += st.harmBand['20-35%'] ?? 0;
    harmLimite += st.harmBand['<20%'] ?? 0;
    for (const s of st.deathSources) {
      deathSrc[s] = (deathSrc[s] ?? 0) + 1;
      deaths++;
    }
  }
  const pct = (x: number) => `${((x / N) * 100).toFixed(1)}%`;
  console.log(`\n=== ${policy} (N=${N}) ===`);
  console.log(`min-HP mai <35% durante la run: ${pct(below35)} | mai <20%: ${pct(below20)} | <35% a fine run: ${pct(below35End)}`);
  const totH = harmLieve + harmSolido + harmGrave + harmLimite;
  console.log(
    `righe di danno: lieve ${((harmLieve / totH) * 100).toFixed(0)}% | solido ${((harmSolido / totH) * 100).toFixed(0)}% | grave ${((harmGrave / totH) * 100).toFixed(0)}% | al limite ${((harmLimite / totH) * 100).toFixed(0)}% (tot ${totH})`,
  );
  console.log(
    `morti per fonte: ${Object.entries(deathSrc)
      .sort((a, b) => b[1] - a[1])
      .map(([s, c]) => `${s} ${((c / deaths) * 100).toFixed(0)}%`)
      .join(' | ')} (tot ${deaths})`,
  );
}
