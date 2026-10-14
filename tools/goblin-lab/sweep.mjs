// sweep.mjs — sweep N seed del goblin lab con statistiche (S0/S1).
// Uso: node tools/goblin-lab/sweep.mjs [N=300] [startSeed=1] [concurrency=8] [scenario=base] [persona=rush]
// Output: JSON con identità run + metriche aggregate con CI.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { wilson, median, causeCounts } from './stats.mjs';

const execFileP = promisify(execFile);
const N = Number(process.argv[2] ?? 300);
const START = Number(process.argv[3] ?? 1);
const CONC = Number(process.argv[4] ?? 8);
const SCENARIO = process.argv[5] ?? 'base';
const PERSONA = process.argv[6] ?? 'rush';

async function runSeed(s) {
  const { stdout } = await execFileP('npx', [
    'tsx', 'tools/goblin-lab/lab.ts',
    `--seed=${s}`, `--scenario=${SCENARIO}`, `--persona=${PERSONA}`,
  ], { maxBuffer: 64 * 1024 * 1024 });
  const j = JSON.parse(stdout.slice(stdout.indexOf('=== SUMMARY ===') + 15));
  return {
    s, configHash: j.configHash, end: j.end, day: j.day,
    alive: j.villagerAlive, tot: j.totalAlive, inj: j.injured,
    qOk: j.qOk, qFail: j.qFail, inv: j.inv, pal: j.pal, trn: j.trn, st: j.stats,
    funnel: j.offerFunnel, outcomes: j.questOutcomes, harm: j.harm, personDays: j.personDays,
  };
}

const rows = [];
const seeds = Array.from({ length: N }, (_, i) => START + i);
let idx = 0;
async function worker() {
  while (idx < seeds.length) {
    const s = seeds[idx++];
    try { rows.push(await runSeed(s)); }
    catch (e) { rows.push({ s, end: { kind: 'lose', day: -1, why: 'harness-error' }, error: String(e).slice(0, 120) }); }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
rows.sort((a, b) => a.s - b.s);

const wins = rows.filter((r) => r.end.kind === 'win');
const heroDeaths = rows.filter((r) => r.end.why?.includes('eroe caduto'));
const byFidelity = rows.reduce((a, r) => {
  const f = r.end.fidelity ?? 'none';
  a[f] = (a[f] ?? 0) + 1; return a;
}, {});
const sum = (k) => rows.reduce((a, r) => a + (r.harm?.[k] ?? 0), 0);

console.log(JSON.stringify({
  scenario: SCENARIO, persona: PERSONA,
  configHash: rows[0]?.configHash, n: rows.length,
  winRate: { p: +wilson(wins.length, rows.length).p.toFixed(3), ci95: [+wilson(wins.length, rows.length).lo.toFixed(3), +wilson(wins.length, rows.length).hi.toFixed(3)] },
  heroDeathRate: { p: +wilson(heroDeaths.length, rows.length).p.toFixed(3), ci95: [+wilson(heroDeaths.length, rows.length).lo.toFixed(3), +wilson(heroDeaths.length, rows.length).hi.toFixed(3)] },
  causeCounts: causeCounts(rows),
  endByFidelity: byFidelity,
  medianWinDay: median(wins.map((r) => r.end.day)),
  medianDay: median(rows.map((r) => r.day)),
  medianAliveAtEnd: median(rows.map((r) => r.tot)),
  totalWounds: sum('wounds'), totalDeaths: sum('deaths'), totalHeroDeaths: sum('heroDeaths'),
  medianPersonDaysBusy: median(rows.map((r) => r.personDays?.busy ?? 0)),
  medianFunnel: {
    generated: median(rows.map((r) => r.funnel?.generated ?? 0)),
    committed: median(rows.map((r) => r.funnel?.committed ?? 0)),
    expired: median(rows.map((r) => r.funnel?.expired ?? 0)),
  },
  errors: rows.filter((r) => r.error).map((r) => `s${r.s}: ${r.error}`),
}, null, 2));
