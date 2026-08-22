/**
 * T-005 — LA CATENA DI RISOLUZIONE E INVARIANTE. PLAN-009.
 *
 * A seed fisso, misurare la copertura NON deve spostare niente: ne i due dadi,
 * ne l'esito, ne la zona, ne il punto d'atterraggio. E' il test che impedisce
 * alla grafica di contaminare la risoluzione — il difetto che nella V7 faceva
 * cambiare gli esiti quando si aggiungeva un effetto.
 */
import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES } from '@/ui/skillCheckWebV1/zones';
import { resolveCheck } from '@/ui/skillCheckWebV1/resolution';
import { measureCoverage, coverageOf } from '@/ui/skillCheckWebV1/coverage';

const five = (v: number) => Array.from({ length: AXES }, () => v);
let fails = 0;
console.log('T-005 — la copertura non tocca la risoluzione');
console.log('  seed | dadi  | esito+zona        | atterraggio        | identico con copertura?');
for (const seed of [1, 7, 42, 1337, 90210]) {
  for (const [s, d] of [[60, 50], [40, 60], [85, 50]] as [number, number][]) {
    const input = { stats: five(s), diffs: five(d) };
    const snapA = buildSnapshot(input, DEFAULT_CHECK_CONFIG, 0);
    const before = resolveCheck(snapA, seed);
    /* ora si misura la copertura, e POI si risolve di nuovo con lo stesso seed */
    const snapB = buildSnapshot(input, DEFAULT_CHECK_CONFIG, 0);
    measureCoverage(snapB);
    coverageOf(input);
    const after = resolveCheck(snapB, seed);
    const same =
      before.rolled.roll === after.rolled.roll &&
      before.rolled.riskRoll === after.rolled.riskRoll &&
      before.rolled.region === after.rolled.region &&
      before.rolled.zone === after.rolled.zone &&
      Math.abs(before.landing.x - after.landing.x) < 1e-12 &&
      Math.abs(before.landing.y - after.landing.y) < 1e-12;
    if (!same) fails += 1;
    if (seed === 42 || !same) {
      console.log(
        `  ${String(seed).padStart(5)}| ${String(before.rolled.roll).padStart(3)}/${String(before.rolled.riskRoll).padStart(3)} |` +
        ` ${(before.rolled.region + '+' + before.rolled.zone).padEnd(17)} |` +
        ` ${before.landing.x.toFixed(1).padStart(8)},${before.landing.y.toFixed(1).padStart(8)} | ${same ? 'SI' : 'NO'}`);
    }
  }
}
console.log('');
console.log(fails === 0 ? '  15 combinazioni seed x prova: tutte identiche. T-005 passa.' : `  ${fails} divergenze. T-005 FALLITO.`);
if (fails) process.exit(1);
