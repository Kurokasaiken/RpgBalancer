import {
  applyChoice,
  availableOptions,
  createRun,
  nodesFor,
  useHealing,
  type QuestRunState,
} from '../src/ui/idleVillage/questS1Lab/questRun';

type Policy = 'optimal' | 'cautious' | 'greedy';

function pick(state: QuestRunState, policy: Policy): string {
  const opts = availableOptions(state);
  const has = (id: string) => (opts.some((o) => o.id === id) ? id : (opts[0]?.id ?? 'advance'));
  switch (state.nodeId) {
    case 'gob-esplora': return policy === 'greedy' ? has('gob-forza-tracce') : has('gob-cerca-tracce');
    case 'gob-bottino-scelta': return policy === 'cautious' ? has('gob-lascia-bottino') : has('gob-prendi');
    case 'gob-accampamento':
      if (policy !== 'optimal') return has('gob-via-assalto');
      return state.flags.includes('bonusStealth') || state.flags.includes('bonusStealthPiccolo') ? has('gob-via-stealth') : has('gob-via-assalto');
    case 'gob-combattimento': case 'gob-ultimo-scontro': return 'fight-turn';
    case 'gob-incalzare': return policy === 'cautious' ? has('gob-lascia-fuggire') : has('gob-insegui');
    case 'gob-esplora-extra': {
      if (policy === 'cautious') return has('gob-fermati');
      const limit = policy === 'greedy' ? 4 : 2;
      const hurt = state.party.filter((m) => !m.dead && m.hp < 20).length;
      return state.exploreTurn < limit && hurt === 0 ? has('gob-fruga') : has('gob-fermati');
    }
    case 'gob-agguato-scelta': return policy === 'cautious' ? has('gob-molla-trofeo') : has('gob-ultima-mischia');
    default: return opts[0]?.id ?? 'advance';
  }
}

const hpLine = (s: QuestRunState) =>
  s.party.map((m) => `${m.name} ${m.dead ? '✝' : `${m.hp}/${m.maxHp}`}`).join(' · ');

function transcript(seed: number, policy: Policy): string {
  let s = createRun('gob-band', seed, 'goblin');
  const out: string[] = [`\n##### SEED ${seed} — policy ${policy} #####`, `Party: ${hpLine(s)}`];
  let guard = 0;
  while (!s.ended && guard++ < 80) {
    const node = nodesFor(s)[s.nodeId];
    if (!node) break;
    if (s.flags.includes('hasHealing')) {
      const w = s.party.filter((m) => !m.dead).sort((a, b) => a.hp - b.hp)[0];
      if (w && w.hp < 25) { s = useHealing(s); out.push(`   [consumabile] cura usata`); }
    }
    if (node.transit) out.push(`\n≈ TRANSIT: ${node.transit}`);
    out.push(`\n[${node.id}] ${node.title}\n   ${node.body}`);
    const id = pick(s, policy);
    const opt = node.options?.find((o) => o.id === id);
    out.push(`   → scelta: ${opt ? opt.label : id}`);
    s = applyChoice(s, id, { useConsumable: true });
    for (const c of s.checkQueue) {
      out.push(`   ◆ CHECK «${c.title}» → ${c.verdict.toUpperCase()} (roll ${c.rollPct} vs ${c.score})`);
      if (c.flavor) out.push(`     flavor: ${c.flavor}`);
      if (c.harmLines.length) out.push(`     danno: ${c.harmLines.join(' | ')}`);
      if (c.authoredText) out.push(`     esito: ${c.authoredText}`);
    }
    if (s.recentHarms.length) out.push(`   (ambient) ${s.recentHarms.length} harm`);
    out.push(`   HP: ${hpLine(s)}${s.goblinLeft ? ` · goblin ${s.goblinLeft}` : ''}`);
  }
  out.push(`\n=== ESITO: ${s.outcome} · gold ${s.gold} · xp ${s.xp} · flags ${s.flags.join(',')}`);
  return out.join('\n');
}

const mode = process.argv[2];
if (mode === 'play') {
  for (const [seed, pol] of [[7, 'optimal'], [41, 'greedy'], [1983, 'optimal'], [2024, 'cautious']] as [number, Policy][]) {
    console.log(transcript(seed, pol));
  }
} else {
  const N = 4000;
  const m = { f4end: 0, f4desperate: 0, f4broken: 0, f5: 0, f5dilemma: 0, f6: 0, f6tempt: 0, f7: 0, f7oh: 0, deaths: 0, deathImpactful: 0, wipe: 0, f4all: 0 };
  for (let seed = 1; seed <= N; seed++) {
    let s = createRun('gob-band', seed, 'goblin');
    let g = 0;
    while (!s.ended && g++ < 80) {
      const before = s.nodeId;
      if (s.flags.includes('hasHealing')) {
        const w = s.party.filter((x) => !x.dead).sort((a, b) => a.hp - b.hp)[0];
        if (w && w.hp < 25) s = useHealing(s);
      }
      const alive = () => s.party.filter((x) => !x.dead);
      const sev = () => alive().filter((x) => x.hp / x.maxHp < 0.35).length;
      if (before === 'gob-incalzare') {
        m.f5++;
        const hurt = sev() > 0 || alive().some((x) => x.wounded);
        const rear = alive()[alive().length - 1];
        if (hurt && rear && rear.hp > 10) m.f5dilemma++;
      }
      if (before === 'gob-esplora-extra' && s.exploreTurn === 0) {
        m.f6++;
        const minF = Math.min(...alive().map((x) => x.hp / x.maxHp));
        if (minF >= 0.3 && minF <= 0.75) m.f6tempt++;
      }
      if (before === 'gob-agguato-scelta') {
        m.f7++;
        const lost = s.party.reduce((a, x) => a + (x.maxHp - (x.dead ? 0 : x.hp)), 0);
        const rear = alive()[alive().length - 1];
        if (lost >= 40 && rear && rear.hp / rear.maxHp < 0.7) m.f7oh++;
      }
      const id = pick(s, 'optimal');
      s = applyChoice(s, id, { useConsumable: true });
      if (before === 'gob-combattimento' && s.nodeId !== 'gob-combattimento') {
        m.f4end++;
        const survivors = s.goblinLeft;
        if (sev() > 0 && alive().length > 0) m.f4desperate++;
        if (survivors > 0 && survivors <= 2 && sev() > 0) m.f4broken++;
      }
    }
    const dead = s.party.filter((x) => x.dead).length;
    m.deaths += dead;
    if (s.outcome === 'wipe') m.wipe++;
  }
  const p = (a: number, b: number) => `${((a / Math.max(b, 1)) * 100).toFixed(1)}%`;
  console.log(JSON.stringify({
    N,
    'F4 chiuso (esce dal nodo)': p(m.f4end, N),
    'F4 end con >=1 PG grave (<35%)': p(m.f4desperate, m.f4end),
    'F4 end: goblin 1-2 rimasti + PG grave ("quasi spezzati")': p(m.f4broken, m.f4end),
    'F5 raggiunto': p(m.f5, N),
    'F5 con dilemma credibile (PG ferito, coda ancora in piedi)': p(m.f5dilemma, m.f5),
    'F6 raggiunto': p(m.f6, N),
    'F6 con HP minimo 30-75% (tentante ma pericoloso)': p(m.f6tempt, m.f6),
    'F7 scelta raggiunta': p(m.f7, N),
    'F7 con danno accumulato >=40 e coda <70% ("oh no")': p(m.f7oh, m.f7),
    'morti medie/run': (m.deaths / N).toFixed(2),
    wipe: p(m.wipe, N),
  }, null, 1));
}
