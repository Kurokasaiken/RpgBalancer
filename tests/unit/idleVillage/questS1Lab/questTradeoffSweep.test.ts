/**
 * PLAN-019-S3 T-5 — misura dei trade-off (evidenza per il gate Director).
 *
 * Sweep Monte Carlo su una griglia di party plausibili (stessa forma 4-slot
 * della quest goblin: leader / member ×2 / bodyguard) e sulle strategie
 * in-run significative. Il console.log della tabella è l'evidenza — le
 * asserzioni sono il contratto del gate:
 *
 *   (i)   nessun party domina su tutte le metriche — la scelta del party è
 *         un trade-off reale, non «il numero più alto»;
 *   (ii)  la varianza tra strategie in-run resta significativa — la quest
 *         NON si risolve nel Planner: dopo la preparazione ottimale le
 *         decisioni in-run cambiano ancora l'esito;
 *   (iii) un membro «carne da macello» è identificabile nel BY MEMBER —
 *         il forecast per-membro segnala chi paga.
 *
 * Nota sulle strategie: `gob-esplora-extra` ricircola su `gob-cerca`
 * («Razzia») e il motore scala il danno a ogni giro (`exploreBaseDamage ×
 * exploreTurn`) — una policy «sempre spingi» è un wipe certo per OGNI party.
 * È authored (push-your-luck) e lo misuriamo come evidenza a parte
 * (`rapaceInfinito`), ma le strategie del confronto fermano la razzia.
 */

import { describe, expect, it } from 'vitest';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabMember, LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  simulateQuest,
  type QuestSimResult,
  type SimStrategy,
} from '@/ui/idleVillage/questS1Lab/questSimulation';

const SEED = 7;
const RUNS = 800;
const STATS: LabStat[] = ['str', 'con', 'agi', 'perc', 'int', 'cha'];

const stats = (v: Record<string, number>): Record<LabStat, number> =>
  Object.fromEntries(STATS.map((s) => [s, v[s] ?? 40])) as Record<LabStat, number>;

const member = (id: string, name: string, role: LabMember['role'], hp: number, s: Record<string, number>): LabMember => ({
  id,
  name,
  role,
  hp,
  stats: stats(s),
});

/* Griglia di party plausibili — stesse 4 posizioni dell'offerta goblin,
 * variazioni sul tema «chi togli dal villaggio». La `banda` è il preset di
 * calibrazione (dangerBandRef 'alta'); le altre sono mutazioni oneste dello
 * stesso budget: nessun super-party inventato. */
const PARTIES: Record<string, LabMember[]> = {
  banda: [
    member('e', 'Edda', 'leader', 100, { str: 70, con: 60, agi: 45, perc: 40, int: 35, cha: 40 }),
    member('m1', 'Milo', 'member', 60, { str: 60, con: 55, agi: 50, perc: 45, int: 40, cha: 35 }),
    member('m2', 'Bruna', 'member', 60, { str: 65, con: 60, agi: 40, perc: 35, int: 30, cha: 30 }),
    member('bg', 'Kran', 'bodyguard', 60, { str: 60, con: 70, agi: 40, perc: 30, int: 20, cha: 20 }),
  ],
  falange: [
    member('e', 'Vera', 'leader', 100, { str: 80, con: 75, agi: 30, perc: 25, int: 25, cha: 35 }),
    member('m1', 'Bor', 'member', 60, { str: 75, con: 65, agi: 30, perc: 25, int: 30, cha: 30 }),
    member('m2', 'Gilda', 'member', 60, { str: 70, con: 65, agi: 30, perc: 20, int: 25, cha: 25 }),
    member('bg', 'Rok', 'bodyguard', 60, { str: 70, con: 80, agi: 25, perc: 20, int: 15, cha: 15 }),
  ],
  sentinelle: [
    member('e', 'Aira', 'leader', 100, { str: 55, con: 50, agi: 65, perc: 60, int: 45, cha: 45 }),
    member('m1', 'Tobia', 'member', 60, { str: 40, con: 45, agi: 65, perc: 65, int: 50, cha: 40 }),
    member('m2', 'Noa', 'member', 60, { str: 40, con: 40, agi: 60, perc: 60, int: 45, cha: 45 }),
    member('bg', 'Ettore', 'bodyguard', 60, { str: 45, con: 55, agi: 55, perc: 55, int: 30, cha: 25 }),
  ],
  milizia: [
    member('e', 'Odo', 'leader', 100, { str: 50, con: 40, agi: 30, perc: 25, int: 20, cha: 25 }),
    member('m1', 'Pina', 'member', 60, { str: 40, con: 35, agi: 35, perc: 25, int: 25, cha: 25 }),
    member('m2', 'Teo', 'member', 60, { str: 45, con: 40, agi: 25, perc: 20, int: 15, cha: 20 }),
    member('bg', 'Umbo', 'bodyguard', 60, { str: 40, con: 50, agi: 25, perc: 15, int: 10, cha: 10 }),
  ],
  /* Una recluta presa «perché serviva il quarto» — il BY MEMBER deve
   *  mostrare chi paga (iii). */
  recluta: [
    member('e', 'Edda', 'leader', 100, { str: 70, con: 60, agi: 45, perc: 40, int: 35, cha: 40 }),
    member('m1', 'Milo', 'member', 60, { str: 60, con: 55, agi: 50, perc: 45, int: 40, cha: 35 }),
    member('m2', 'Nibbio', 'member', 60, { str: 25, con: 25, agi: 25, perc: 25, int: 25, cha: 25 }),
    member('bg', 'Kran', 'bodyguard', 60, { str: 60, con: 70, agi: 40, perc: 30, int: 20, cha: 20 }),
  ],
  /* Il capo è il punto debole: se muore lui la quest non paga. */
  capoGracile: [
    member('e', 'Lena', 'leader', 100, { str: 40, con: 35, agi: 45, perc: 60, int: 55, cha: 60 }),
    member('m1', 'Milo', 'member', 60, { str: 60, con: 55, agi: 50, perc: 45, int: 40, cha: 35 }),
    member('m2', 'Bruna', 'member', 60, { str: 65, con: 60, agi: 40, perc: 35, int: 30, cha: 30 }),
    member('bg', 'Kran', 'bodyguard', 60, { str: 60, con: 70, agi: 40, perc: 30, int: 20, cha: 20 }),
  ],
};

/* Strategie in-run = archetipi di giocatore. Tutte chiudono la razzia con
 * `gob-fermati` tranne `rapaceInfinito` — la policy degenere «spingi per
 * sempre» tenuta come evidenza del muro push-your-luck authored. */
const CAUTO: SimStrategy = {
  'gob-esplora': 'gob-cerca-tracce',
  'gob-bottino-scelta': 'gob-lascia-bottino',
  'gob-accampamento': 'gob-via-assalto',
  'gob-incalzare': 'gob-lascia-fuggire',
  'gob-esplora-extra': 'gob-fermati',
  'gob-agguato-scelta': 'gob-molla-trofeo',
};
const STANDARD: SimStrategy = {
  'gob-esplora': 'gob-cerca-tracce',
  'gob-bottino-scelta': 'gob-prendi',
  'gob-accampamento': 'gob-via-stealth',
  'gob-incalzare': 'gob-lascia-fuggire',
  'gob-esplora-extra': 'gob-fermati',
  'gob-agguato-scelta': 'gob-molla-trofeo',
};
const SANGUINARIO: SimStrategy = {
  'gob-esplora': 'gob-forza-tracce',
  'gob-bottino-scelta': 'gob-prendi',
  'gob-accampamento': 'gob-via-assalto',
  'gob-incalzare': 'gob-insegui',
  'gob-esplora-extra': 'gob-fermati',
  'gob-agguato-scelta': 'gob-ultima-mischia',
};
const RAPACE_INFINITO: SimStrategy = {
  'gob-esplora': 'gob-cerca-tracce',
  'gob-bottino-scelta': 'gob-prendi',
  'gob-accampamento': 'gob-via-stealth',
  'gob-incalzare': 'gob-insegui',
  'gob-esplora-extra': 'gob-fruga',
  'gob-agguato-scelta': 'gob-ultima-mischia',
};

const runOf = (party: LabMember[]) =>
  createRun({ party: { members: party, gold: 0 }, seed: SEED, questId: 'goblin' });
const simOf = (party: LabMember[], strategy: SimStrategy) =>
  simulateQuest(runOf(party), strategy, { runs: RUNS, seed: SEED });

const cell = (r: QuestSimResult) => ({
  reward: r.outcomePct.reward,
  death: r.anyDeathPct,
  wound: r.anyWoundPct,
  gold: r.goldAvg,
});

const row = (name: string, r: QuestSimResult) =>
  `| ${name} | ${r.outcomePct.reward.toFixed(1)}% | ${r.anyWoundPct.toFixed(1)}% | ${r.anyDeathPct.toFixed(1)}% | ${r.outcomePct.wipe.toFixed(1)}% | ${r.goldAvg.toFixed(0)} |`;

describe('T-5 — misura dei trade-off sul party (gate a)', () => {
  it('tabella sweep: il fronte di Pareto non è un singolo punto', () => {
    const results = Object.fromEntries(
      Object.entries(PARTIES).map(([name, p]) => [name, simOf(p, STANDARD)]),
    );
    const table = ['| party (strategia standard) | reward | wound | death | wipe | gold avg |', '|---|---|---|---|---|---|'];
    for (const [name, r] of Object.entries(results)) table.push(row(name, r));
    console.log(`\nT-5 sweep goblin (${RUNS} run/cella, seed ${SEED}):\n${table.join('\n')}\n`);

    /* Dominio stretto: A domina B se è migliore-o-pari su TUTTI gli assi e
     * strettamente migliore su almeno uno. Il gate chiede che il fronte di
     * Pareto non sia un singolo punto — la scelta resta un trade-off. */
    const cells = Object.entries(results).map(([name, r]) => ({ name, ...cell(r) }));
    const dominates = (a: (typeof cells)[0], b: (typeof cells)[0]) =>
      a.reward >= b.reward &&
      a.death <= b.death &&
      a.wound <= b.wound &&
      a.gold >= b.gold &&
      (a.reward > b.reward || a.death < b.death || a.wound < b.wound || a.gold > b.gold);
    const frontier = cells.filter((c) => !cells.some((o) => o !== c && dominates(o, c)));
    expect(
      frontier.length,
      `fronte di Pareto degenere: ${frontier.map((f) => f.name).join(', ')}`,
    ).toBeGreaterThanOrEqual(2);

    /* Il party più debole deve pagare più del riferimento — la difficoltà
     * è leggibile, non piatta. */
    expect(results.milizia.anyDeathPct).toBeGreaterThan(results.banda.anyDeathPct);
  }, 120_000);
});

describe('T-5 — varianza in-run (gate b)', () => {
  it('a parità di party, le strategie in-run cambiano l\'esito — e il muro push-your-luck è authored', () => {
    const cauta = simOf(PARTIES.banda, CAUTO);
    const standard = simOf(PARTIES.banda, STANDARD);
    const sanguinaria = simOf(PARTIES.banda, SANGUINARIO);
    const rapace = simOf(PARTIES.banda, RAPACE_INFINITO);

    const table = ['| strategia (party banda) | reward | wound | death | wipe | gold avg |', '|---|---|---|---|---|---|'];
    for (const [n, r] of [['cauto', cauta], ['standard', standard], ['sanguinario', sanguinaria], ['rapace∞', rapace]] as const) table.push(row(n, r));
    console.log(`\nT-5 strategie su banda (${RUNS} run/cella):\n${table.join('\n')}\n`);

    /* La quest non si risolve nel planner: lo spread tra gli archetipi deve
     * essere materiale su ≥2 assi tra ricompensa e rischio. */
    const rewardSpread = Math.max(cauta.outcomePct.reward, standard.outcomePct.reward, sanguinaria.outcomePct.reward) -
      Math.min(cauta.outcomePct.reward, standard.outcomePct.reward, sanguinaria.outcomePct.reward);
    const deathSpread = Math.max(cauta.anyDeathPct, standard.anyDeathPct, sanguinaria.anyDeathPct) -
      Math.min(cauta.anyDeathPct, standard.anyDeathPct, sanguinaria.anyDeathPct);
    const woundSpread = Math.max(cauta.anyWoundPct, standard.anyWoundPct, sanguinaria.anyWoundPct) -
      Math.min(cauta.anyWoundPct, standard.anyWoundPct, sanguinaria.anyWoundPct);
    expect(
      [rewardSpread, deathSpread, woundSpread].filter((s) => s >= 5).length,
      `spread in-run debole: reward ${rewardSpread.toFixed(1)}pp, death ${deathSpread.toFixed(1)}pp, wound ${woundSpread.toFixed(1)}pp`,
    ).toBeGreaterThanOrEqual(2);

    /* Evidenza authored: spingere la razzia all'infinito = wipe quasi certo
     * per chiunque (danno crescente per giro). */
    expect(rapace.outcomePct.wipe).toBeGreaterThanOrEqual(90);
  }, 120_000);
});

describe('T-5 — «carne da macello» identificabile (BY MEMBER)', () => {
  it('chi paga è leggibile: il bodyguard intercetta, il debole esposto muore', () => {
    /* Gamba 1 — la recluta è PROTETTA dal bodyguard: il targeting
     *  posizionale + il ruolo scudo fanno pagare Kran, non Nibbio.
     *  Il BY MEMBER deve dire chiaramente chi fa da scudo. */
    const r = simOf(PARTIES.recluta, SANGUINARIO);
    const table = r.perMember.map(
      (m) => `| ${m.name} (${m.role}) | ${m.deathPct.toFixed(1)}% death | ${m.woundPct.toFixed(1)}% wound |`,
    );
    console.log(`\nT-5 BY MEMBER recluta+sanguinario:\n${table.join('\n')}\n`);

    const kran = r.perMember.find((m) => m.name === 'Kran')!;
    const others = r.perMember.filter((m) => m.name !== 'Kran');
    expect(kran.deathPct).toBeGreaterThanOrEqual(Math.max(...others.map((m) => m.deathPct)));
    /* Spread leggibile a colpo, non rumore di ±2pp. */
    const spread = Math.max(...r.perMember.map((m) => m.deathPct)) - Math.min(...r.perMember.map((m) => m.deathPct));
    expect(spread, `spread death% troppo piatto: ${spread.toFixed(1)}pp`).toBeGreaterThanOrEqual(20);

    /* Gamba 2 — togli lo scudo e metti il debole in coda: ora il BY MEMBER
     *  deve puntare sulla recluta. «Chi togli dal villaggio» decide chi
     *  non torna — visibile prima di partire. */
    const scoperta: LabMember[] = [
      PARTIES.recluta[0], PARTIES.recluta[1],
      member('bg', 'Orso', 'member', 60, { str: 55, con: 60, agi: 40, perc: 30, int: 20, cha: 20 }),
      member('m2', 'Nibbio', 'member', 60, { str: 25, con: 25, agi: 25, perc: 25, int: 25, cha: 25 }),
    ];
    const r2 = simOf(scoperta, SANGUINARIO);
    const nibbio = r2.perMember.find((m) => m.name === 'Nibbio')!;
    const altri = r2.perMember.filter((m) => m.name !== 'Nibbio');
    console.log(`BY MEMBER senza scudo (Nibbio in coda):\n${r2.perMember.map((m) => `| ${m.name} | ${m.deathPct.toFixed(1)}% d |`).join('\n')}\n`);
    expect(nibbio.deathPct).toBeGreaterThanOrEqual(Math.max(...altri.map((m) => m.deathPct)));
    expect(nibbio.deathPct - Math.min(...altri.map((m) => m.deathPct))).toBeGreaterThanOrEqual(10);
  }, 120_000);
});
