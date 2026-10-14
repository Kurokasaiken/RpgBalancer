// matrix.mjs — matrice scenario × persona [× resolver] a seed accoppiati (S1.5/r003, S3).
// Uso: node tools/goblin-lab/matrix.mjs [N=300] [startSeed=1] [concurrency=8] [resolvers=A]
// Output: JSON {cells: {scenario|persona[|resolver]|stats}, paired: {deltas}}.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { wilson, median, causeCounts } from './stats.mjs';

const execFileP = promisify(execFile);
const N = Number(process.argv[2] ?? 300);
const START = Number(process.argv[3] ?? 1);
const CONC = Number(process.argv[4] ?? 8);
const RESOLVERS = (process.argv[5] ?? 'A').split(',');

const SCENARIOS = ['base', 'deadly', 'scarce'];
const PERSONAS = ['rush', 'turtle', 'optimizer'];

async function runSeed(s, scenario, persona, resolver) {
  const { stdout } = await execFileP('npx', [
    'tsx', 'tools/goblin-lab/lab.ts',
    `--seed=${s}`, `--scenario=${scenario}`, `--persona=${persona}`,
    `--resolver=${resolver}`,
  ], { maxBuffer: 64 * 1024 * 1024 });
  const j = JSON.parse(stdout.slice(stdout.indexOf('=== SUMMARY ===') + 15));
  return {
    s, end: j.end, day: j.day, alive: j.villagerAlive, tot: j.totalAlive,
    qOk: j.qOk, qFail: j.qFail, trn: j.trn, st: j.stats,
    funnel: j.offerFunnel, outcomes: j.questOutcomes, harm: j.harm,
    personDays: j.personDays, res: j.res,
    kingAttempts: j.offerFunnel?.byOffer?.attempted?.['king-assault'] ?? 0,
    divergences: j.resolverDivergences ?? 0,
  };
}

// Tutte le celle in parallelo controllato (ogni cella = N run, seed accoppiati).
const jobs = [];
for (const sc of SCENARIOS) for (const pe of PERSONAS) for (const rs of RESOLVERS) {
  for (let i = 0; i < N; i++) jobs.push({ s: START + i, sc, pe, rs });
}
const cells = {}; // `${sc}|${pe}|${rs}` -> rows[]
let idx = 0;
async function worker() {
  while (idx < jobs.length) {
    const j = jobs[idx++];
    const key = `${j.sc}|${j.pe}|${j.rs}`;
    try {
      const r = await runSeed(j.s, j.sc, j.pe, j.rs);
      (cells[key] ??= []).push(r);
    } catch (e) {
      (cells[key] ??= []).push({ s: j.s, end: { kind: 'lose', day: -1, why: 'harness-error' }, error: String(e).slice(0, 140) });
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));

const cellStats = {};
for (const [key, rows0] of Object.entries(cells)) {
  const rows = rows0.sort((a, b) => a.s - b.s);
  const wins = rows.filter((r) => r.end.kind === 'win');
  const heroDeaths = rows.filter((r) => r.end.why?.includes('eroe caduto'));
  const byFid = rows.reduce((a, r) => { const f = r.end.fidelity ?? 'none'; a[f] = (a[f] ?? 0) + 1; return a; }, {});
  const sumH = (k) => rows.reduce((a, r) => a + (r.harm?.[k] ?? 0), 0);
  const woundTiers = {};
  for (const r of rows) for (const [t, n] of Object.entries(r.harm?.woundsByTier ?? {})) {
    woundTiers[t] = (woundTiers[t] ?? 0) + n;
  }
  cellStats[key] = {
    n: rows.length,
    winRate: { p: +wilson(wins.length, rows.length).p.toFixed(3), ci95: [+wilson(wins.length, rows.length).lo.toFixed(3), +wilson(wins.length, rows.length).hi.toFixed(3)] },
    heroDeathRate: { p: +wilson(heroDeaths.length, rows.length).p.toFixed(3), ci95: [+wilson(heroDeaths.length, rows.length).lo.toFixed(3), +wilson(heroDeaths.length, rows.length).hi.toFixed(3)] },
    causeCounts: causeCounts(rows),
    endByFidelity: byFid,
    medianWinDay: median(wins.map((r) => r.end.day)),
    medianDay: median(rows.map((r) => r.day)),
    medianAliveAtEnd: median(rows.map((r) => r.tot)),
    totalWounds: sumH('wounds'), woundsByTier: woundTiers,
    totalDeaths: sumH('deaths'), totalHeroDeaths: sumH('heroDeaths'),
    medianPersonDaysBusy: median(rows.map((r) => r.personDays?.busy ?? 0)),
    medianTrained: median(rows.map((r) => r.trn ?? 0)),
    medianStats: {
      FOR: median(rows.map((r) => r.st?.FOR ?? 0)),
      AST: median(rows.map((r) => r.st?.AST ?? 0)),
      CAR: median(rows.map((r) => r.st?.CAR ?? 0)),
    },
    // S3: tentativi al Re + divergenze canone/variante
    kingAttempts: {
      total: rows.reduce((a, r) => a + (r.kingAttempts ?? 0), 0),
      median: median(rows.map((r) => r.kingAttempts ?? 0)),
      runsWithAttempt: rows.filter((r) => (r.kingAttempts ?? 0) > 0).length,
    },
    totalDivergences: rows.reduce((a, r) => a + (r.divergences ?? 0), 0),
    errors: rows.filter((r) => r.error).length,
  };
}

// Paired-seed deltas: stesso seed, celle diverse → flips win/lose, Δday.
function paired(keyA, keyB) {
  const a = cells[keyA] ?? [], b = cells[keyB] ?? [];
  const mapB = new Map(b.map((r) => [r.s, r]));
  let flipsAB = 0, flipsBA = 0, dayDiffs = [];
  for (const ra of a) {
    const rb = mapB.get(ra.s);
    if (!rb || ra.error || rb.error) continue;
    const wa = ra.end.kind === 'win', wb = rb.end.kind === 'win';
    if (!wa && wb) flipsAB++; // B vince dove A perde
    if (wa && !wb) flipsBA++;
    dayDiffs.push(rb.day - ra.day);
  }
  const mDay = dayDiffs.length ? median(dayDiffs) : null;
  const n = dayDiffs.length;
  // McNemar grezzo: proporzione di flips netti sul totale
  return { a: keyA, b: keyB, n, bWinsWhereALoses: flipsAB, aWinsWhereBLoses: flipsBA, medianDayDiff: mDay };
}
const pairedDeltas = [];
for (const sc of SCENARIOS) for (const rs of RESOLVERS) {
  for (let i = 0; i < PERSONAS.length; i++)
    for (let j = i + 1; j < PERSONAS.length; j++)
      pairedDeltas.push(paired(`${sc}|${PERSONAS[i]}|${rs}`, `${sc}|${PERSONAS[j]}|${rs}`));
}
for (const sc of SCENARIOS) for (const pe of PERSONAS) {
  for (let i = 0; i < RESOLVERS.length; i++)
    for (let j = i + 1; j < RESOLVERS.length; j++)
      pairedDeltas.push(paired(`${sc}|${pe}|${RESOLVERS[i]}`, `${sc}|${pe}|${RESOLVERS[j]}`));
}
for (const pe of PERSONAS) for (const rs of RESOLVERS) {
  for (let i = 0; i < SCENARIOS.length; i++)
    for (let j = i + 1; j < SCENARIOS.length; j++)
      pairedDeltas.push(paired(`${SCENARIOS[i]}|${pe}|${rs}`, `${SCENARIOS[j]}|${pe}|${rs}`));
}

console.log(JSON.stringify({ n: N, start: START, resolvers: RESOLVERS, cells: cellStats, paired: pairedDeltas }, null, 1));
