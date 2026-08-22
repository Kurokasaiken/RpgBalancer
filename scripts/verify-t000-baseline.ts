/**
 * T-000 — LA BASELINE CONGELATA. PLAN-009 gate G0.
 *
 * Registra i numeri che tutto il resto del piano deve preservare. Non verifica
 * niente di nuovo: fissa il metro. Serve a una cosa sola — quando fra tre
 * giorni un numero sarà diverso, si deve poter dire QUALE modifica lo ha
 * spostato. Senza questo file il debug diventa archeologia.
 *
 * Uscita: JSON deterministico su .mw/baselines/t000-baseline.json, e una
 * tabella leggibile su stdout. Rieseguito a codice invariato deve produrre un
 * file BIT-IDENTICO: è quella la verifica di questo gate.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  buildSnapshot, buildRegionGrid, buildZoneLayer, solveCorolla, tstOf,
  rOf, rWallAt, rStarAt, regionAt, R, R_CORE, AXES, VALLEY_F, REGION_IDS, ZONE_IDS,
  DEFAULT_CHECK_CONFIG, GRID_ANGLES, GRID_RADII,
  type RegionId, type ZoneId,
} from '@/ui/skillCheckWebV1/zones';
import { bandsFromAreas, pickLanding } from '@/ui/skillCheckWebV1/resolution';

const five = (v: number) => Array.from({ length: AXES }, () => v);
const round = (v: number, n = 6) => Number(v.toFixed(n));

/* L'ORDINE DEGLI ID NON SI RISCRIVE A MANO. Scritto a mano era invertito, e la
   baseline dava 5% di vittoria a 99/10 invece del 95%: un mismapping silenzioso
   che passa tutti i test perche' i numeri restano plausibili. */
const CASES: [number, number][] = [
  [1, 99], [20, 80], [30, 80], [40, 60], [50, 50],
  [60, 50], [65, 60], [75, 50], [85, 50], [95, 20], [99, 10],
];
const REGIONS = REGION_IDS;
const ZONES = ZONE_IDS;

/** la griglia di prove: copre parità, sfondamento e le due estremità */

interface CaseRow {
  stat: number; diff: number; tst: number;
  rOfStat: number; rCore: number; wallMin: number; wallMax: number;
  arenaArea: number; starArea: number;
  regionArea: Record<string, number>;
  regionProb: Record<string, number>;
  zoneArea: Record<string, number>;
  bands: { region: RegionId; lo: number; hi: number }[];
  landings: { want: string; x: number; y: number; stage: number }[];
  tipRadialError: number;
}

const rows: CaseRow[] = [];

for (const [stat, diff] of CASES) {
  const input = { stats: five(stat), diffs: five(diff) };
  const tst = tstOf(stat, diff, DEFAULT_CHECK_CONFIG.crit);
  const corolla = solveCorolla(input, DEFAULT_CHECK_CONFIG, tst);
  const snap = buildSnapshot(input, DEFAULT_CHECK_CONFIG, 0, corolla);

  /* muro: estremi sul giro */
  let wallMin = Infinity, wallMax = -Infinity;
  for (let i = 0; i < 1440; i += 1) {
    const a = (i / 1440) * Math.PI * 2;
    const w = rWallAt(snap, a);
    if (w < wallMin) wallMin = w;
    if (w > wallMax) wallMax = w;
  }

  /* INVARIANTE DELLE PUNTE: la punta dell'asse i deve stare su rOf(stat).
     È il numero che il piano vieta di muovere, quindi va nella baseline. */
  let tipErr = 0;
  for (let i = 0; i < AXES; i += 1) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / AXES);
    tipErr = Math.max(tipErr, Math.abs(snap.axisTip[i] - rOf(stat)));
  }

  /* aree per integrazione sulla griglia classificata: la stessa griglia che
     il risolutore usa per sapere se una coppia esito×zona esiste */
  const grid = buildRegionGrid(snap, GRID_ANGLES, GRID_RADII);
  const zoneLayer = buildZoneLayer(snap, grid);
  const regionArea: Record<string, number> = {};
  const zoneArea: Record<string, number> = {};
  for (const r of REGIONS) regionArea[r] = 0;
  for (const z of ZONES) zoneArea[z] = 0;
  let total = 0;
  for (let i = 0; i < grid.region.length; i += 1) {
    const w = grid.area[i];
    total += w;
    regionArea[REGIONS[grid.region[i]] ?? 'fail'] += w;
    zoneArea[ZONES[zoneLayer[i]] ?? 'none'] += w;
  }
  const regionProb: Record<string, number> = {};
  for (const r of REGIONS) {
    regionArea[r] = round(regionArea[r]);
    regionProb[r] = round((regionArea[r] / total) * 100, 4);
  }
  for (const z of ZONES) zoneArea[z] = round(zoneArea[z]);

  const bands = bandsFromAreas(snap).map(b => ({ region: b.region, lo: b.from, hi: b.to }));

  /* il punto d'atterraggio per ogni coppia, a seed fisso: è l'output finale
     della catena, e nessuna modifica grafica lo può spostare */
  const landings: CaseRow['landings'] = [];
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const want = { roll: 1, riskRoll: 1, region: r, zone: z };
      const res = pickLanding(snap, want, mulberry(0x9e3779b9));
      landings.push({
        want: `${r}+${z}`,
        x: res ? round(res.point.x, 4) : NaN,
        y: res ? round(res.point.y, 4) : NaN,
        stage: res ? (res.relaxed ? 2 : res.repairs > 0 ? 1 : 0) : -1,
      });
    }
  }

  rows.push({
    stat, diff, tst,
    rOfStat: round(rOf(stat)), rCore: round(R_CORE),
    wallMin: round(wallMin), wallMax: round(wallMax),
    arenaArea: round(total), starArea: round(regionArea.win + regionArea.critWin),
    regionArea, regionProb, zoneArea, bands, landings,
    tipRadialError: tipErr,
  });
}

/** rng deterministico locale: la baseline non deve consumare stream altrui */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const payload = {
  gate: 'T-000',
  plan: 'PLAN-009',
  constants: { R, R_CORE: round(R_CORE), AXES, VALLEY_F, GRID_ANGLES, GRID_RADII },
  config: DEFAULT_CHECK_CONFIG,
  cases: rows,
};
const json = JSON.stringify(payload, null, 2);
const hash = createHash('sha256').update(json).digest('hex').slice(0, 16);

if (!existsSync('.mw/baselines')) mkdirSync('.mw/baselines', { recursive: true });
const out = '.mw/baselines/t000-baseline.json';
const prev = existsSync(out) ? readFileSync(out, 'utf8') : null;
writeFileSync(out, json);

console.log('T-000 — BASELINE CONGELATA (PLAN-009 G0)');
console.log('  prova  | tst | rOf(stat) | muro min/max | area arena | area stella | err punte');
for (const r of rows) {
  console.log(
    `  ${(r.stat + '/' + r.diff).padEnd(7)}|${String(r.tst).padStart(4)} |` +
    `${r.rOfStat.toFixed(2).padStart(10)} |${(r.wallMin.toFixed(0) + '/' + r.wallMax.toFixed(0)).padStart(13)} |` +
    `${(r.arenaArea / 1000).toFixed(1).padStart(11)}k |${(r.starArea / 1000).toFixed(1).padStart(12)}k |` +
    `${r.tipRadialError.toExponential(1).padStart(10)}`,
  );
}
const worstTip = Math.max(...rows.map(r => r.tipRadialError));
const emptyPairs = rows.reduce((n, r) => n + r.landings.filter(l => l.stage < 0).length, 0);
console.log('');
console.log(`  errore massimo delle punte : ${worstTip.toExponential(1)}  (deve restare 0.0e+0)`);
console.log(`  coppie esito x zona senza atterraggio: ${emptyPairs} su ${rows.length * 15}`);
console.log(`  sha256(16) della baseline  : ${hash}`);
if (prev !== null) {
  console.log(prev === json
    ? '  RIESECUZIONE: file BIT-IDENTICO — il gate G0 passa.'
    : '  RIESECUZIONE: file DIVERSO dal precedente — qualcosa a monte e cambiato.');
}
if (worstTip !== 0) {
  console.log('  FALLITO: le punte non sono su rOf(stat).');
  process.exit(1);
}
