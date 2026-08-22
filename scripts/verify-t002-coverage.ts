/**
 * T-002 + T-003 + T-007 — LA COPERTURA MISURATA. PLAN-009, desiderata v15.
 *
 * Verifica che la percentuale sia un OUTPUT: nessuna forma viene toccata, e la
 * probabilita' e' area coperta / area della trama. Piu' tre proprieta' che il
 * piano dichiara falsificabili:
 *   - la parte di stella fuori dalla trama NON contribuisce;
 *   - lo scoperto compare sull'asse dove la stat e' corta (T-003);
 *   - monotonia: piu' stat non puo' dare meno copertura (T-007).
 */
import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES, rOf } from '@/ui/skillCheckWebV1/zones';
import { measureCoverage, rHeroAt, shouldRoll } from '@/ui/skillCheckWebV1/coverage';

const five = (v: number) => Array.from({ length: AXES }, () => v);
const snap = (stats: number[], diffs: number[]) =>
  buildSnapshot({ stats, diffs }, DEFAULT_CHECK_CONFIG, 0);
const cov = (stats: number[], diffs: number[]) => measureCoverage(snap(stats, diffs));

let fails = 0;
const fail = (m: string) => { console.log('  FALLITO — ' + m); fails += 1; };

/* ── 1. la curva: la copertura in funzione di stat - difficolta ─────────── */
console.log('T-002 — LA PERCENTUALE E UN OUTPUT (v15)');
console.log('  stat/diff | copertura | scoperto | sprecato fuori trama');
for (const [s, d] of [[20,80],[30,70],[40,60],[50,50],[60,50],[70,50],[85,50],[95,20],[99,10],[10,90]] as [number,number][]) {
  const c = cov(five(s), five(d));
  console.log(`  ${(s+'/'+d).padEnd(10)}|${c.pct.toFixed(2).padStart(9)}% |${(100-c.pct).toFixed(2).padStart(8)}% |` +
    `${((c.wastedArea/c.tramaArea)*100).toFixed(1).padStart(19)}%`);
}

/* ── 2. parita: stat == difficolta deve dare esattamente il 50% ─────────── */
console.log('');
console.log('  parita (stat == difficolta), la taratura di VALLEY_F:');
for (const v of [20, 35, 50, 65, 80, 95]) {
  const c = cov(five(v), five(v));
  const err = Math.abs(c.pct - 50);
  console.log(`    ${String(v).padStart(3)}/${v}  ->  ${c.pct.toFixed(3)}%   scarto ${err.toFixed(3)}`);
  if (err > 1.5) fail(`parita a ${v}/${v}: ${c.pct.toFixed(2)}% invece di 50%`);
}

/* ── 3. la stella fuori dalla trama non paga ────────────────────────────── */
console.log('');
console.log('T-002b — la punta oltre la trama non contribuisce');
{
  const d = five(40);
  const a = cov(five(80), d), b = cov(five(99), d);
  console.log(`    stat 80 -> ${a.pct.toFixed(3)}%   stat 99 -> ${b.pct.toFixed(3)}%`);
  console.log(`    sprecato fuori: ${(a.wastedArea/a.tramaArea*100).toFixed(1)}% -> ${(b.wastedArea/b.tramaArea*100).toFixed(1)}%`);
  if (b.pct < a.pct - 1e-9) fail('crescere la stat ha ridotto la copertura');
  if (b.wastedArea <= a.wastedArea) fail('crescere la stat oltre la trama non ha aumentato lo spreco');
}

/* ── 4. T-003: lo scoperto sta sull'asse della skill che tradisce ───────── */
console.log('');
console.log('T-003 — lo scoperto compare dove la stat e corta');
{
  const diffs = five(70);
  const stats = [95, 95, 95, 25, 95];          // il quarto asse tradisce
  const c = cov(stats, diffs);
  const worst = c.exposedByAxis.indexOf(Math.max(...c.exposedByAxis));
  c.exposedByAxis.forEach((e, i) =>
    console.log(`    asse ${i} stat ${String(stats[i]).padStart(2)} vs ${diffs[i]}  ->  scoperto ${e.toFixed(1)}%`));
  if (worst !== 3) fail(`lo scoperto massimo e sull'asse ${worst}, non sul 3 che e quello corto`);
  /* NON e' un'implicazione binaria, e la prima versione di questo test sbagliava
     proprio qui: lo scoperto esiste in OGNI settore, perche' la valle fra due
     punte e' bassa per costruzione e appartiene a due assi. La proprieta' vera e
     falsificabile e' che lo scoperto sia CONCENTRATO dove la stat e corta. */
  const shortAx = stats.map((s, i) => s < diffs[i]);
  const maxCovered = Math.max(...c.exposedByAxis.filter((_, i) => !shortAx[i]));
  const minShort = Math.min(...c.exposedByAxis.filter((_, i) => shortAx[i]));
  console.log(`    asse corto: ${minShort.toFixed(1)}% scoperto contro ${maxCovered.toFixed(1)}% ` +
    `del peggiore coperto -> rapporto ${(minShort / maxCovered).toFixed(2)}x`);
  if (minShort < maxCovered * 2) fail(`lo scoperto non e concentrato: ${(minShort/maxCovered).toFixed(2)}x < 2x`);
}

/* ── 5. T-007: monotonia ────────────────────────────────────────────────── */
console.log('');
console.log('T-007 — monotonia: piu stat non puo dare meno copertura');
{
  let worst = 0, prev = -1;
  for (let s = 5; s <= 99; s += 2) {
    const p = cov(five(s), five(55)).pct;
    if (prev >= 0 && p < prev - 1e-9) worst = Math.max(worst, prev - p);
    prev = p;
  }
  console.log(`    48 passi di stat a difficolta 55: peggior inversione ${worst.toExponential(1)}`);
  if (worst > 1e-9) fail(`la copertura scende salendo la stat: ${worst.toFixed(4)} punti`);
}

/* ── 6. T-006: il gate ──────────────────────────────────────────────────── */
console.log('');
console.log('T-006 — il gate: se il successo e automatico non si tira');
for (const [s, d] of [[99,5],[99,10],[95,20],[60,50]] as [number,number][]) {
  const c = cov(five(s), five(d));
  console.log(`    ${s}/${d}  copertura ${c.pct.toFixed(2)}%  ->  ${shouldRoll(c) ? 'si tira' : 'NON si tira, si mostra il risultato'}`);
}

console.log('');
console.log(fails === 0 ? '  TUTTI I GATE PASSANO.' : `  ${fails} GATE FALLITI.`);
if (fails) process.exit(1);
