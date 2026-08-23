/**
 * T-009 — LE TRE BANDE VALGONO ESATTAMENTE IL 5%. PLAN-009, richiesta diretta
 * del Director: «tutti devono essere 5% (5% del valore interno allo skill
 * check)». La base e' l'area della trama, che e' il dominio dove la pallina si
 * ferma.
 *
 * Il difetto che questo gate impedisce e' gia' successo una volta: in PLAN-008
 * la fascia critica aveva spessore FISSO e valeva il 31.9% dell'area a
 * difficolta' 20 e il 10.4% a 99. Uno spessore costante non e' una probabilita'
 * costante.
 */
import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES, rWallAt } from '@/ui/skillCheckWebV1/zones';
import { buildHeroShape, rHeroNarrowAt, solveOuterBands, solveGooBand, solveCoreRadius,
         reachArea, BALL_R } from '@/ui/skillCheckWebV1/coverage';

const TAU = Math.PI * 2;
const five = (v: number) => Array.from({ length: AXES }, () => v);
const CRIT = DEFAULT_CHECK_CONFIG.crit;
let fails = 0;

console.log("T-009 — le tre bande, sull'AREA DI TIRO (trama meno il raggio della pallina)");
console.log('  prova   | crit win | crit fail | almost  | nucleo dentro la stella?');
for (const [s, d] of [[20,80],[40,60],[50,50],[60,50],[75,50],[85,50],[95,30],[99,15]] as [number,number][]) {
  const snap = buildSnapshot({ stats: five(s), diffs: five(d) }, DEFAULT_CHECK_CONFIG, 0);
  const shape = buildHeroShape(snap);
  const hero = (th: number) => rHeroNarrowAt(shape, th);
  const base = reachArea(snap, 5760);
  /* almost attaccato alla stella, il critico sul bordo interno del goo */
  const [e1] = solveOuterBands(snap, hero, [DEFAULT_CHECK_CONFIG.almost], 2880);
  const fGoo = solveGooBand(snap, CRIT, 2880);

  /* misura INDIPENDENTE dal solver: integrazione a griglia piu' fitta */
  const N = 5760, dth = TAU / N;
  let aCritFail = 0, aAlmost = 0;
  for (let i = 0; i < N; i += 1) {
    const th = -Math.PI / 2 + (i + 0.5) * dth;
    const rt = rWallAt(snap, th);
    const r0 = Math.min(hero(th), rt);
    const r1 = Math.min(r0 * (1 + e1), rt);
    aAlmost += 0.5 * (r1 * r1 - r0 * r0) * dth;
    const g1 = Math.max(0, rt - BALL_R);
    const g0 = g1 * (1 - fGoo);
    aCritFail += 0.5 * (g1 * g1 - g0 * g0) * dth;
  }
  const rCore = solveCoreRadius(snap, DEFAULT_CHECK_CONFIG.critWin, 5760);
  const aCore = Math.PI * rCore * rCore;

  let minHero = Infinity;
  for (let i = 0; i < 1440; i += 1) minHero = Math.min(minHero, hero((i / 1440) * TAU));
  const fits = rCore <= minHero;

  const pc = (a: number) => (a / base) * 100;
  console.log(
    `  ${(s + '/' + d).padEnd(8)}|${pc(aCore).toFixed(3).padStart(9)}%|` +
    `${pc(aAlmost).toFixed(3).padStart(22)}%|${pc(aCritFail).toFixed(3).padStart(22)}%| ${fits ? 'si' : 'NO — sborda'}`);

  for (const [name, val] of [['crit win', pc(aCore)], ['crit fail', pc(aCritFail)], ['almost', pc(aAlmost)]] as [string, number][]) {
    /* tolleranza: le bande esterne possono venire TRONCATE dal muro quando la
       stella e gia' quasi tutta la trama — in quel caso la banda non ci sta, e
       va detto, non arrotondato */
    if (Math.abs(val - CRIT) > 0.05 && val < CRIT - 0.05) {
      console.log(`      ${name} vale ${val.toFixed(3)}% invece di ${CRIT}% — la banda non ci sta nella trama`);
      fails += 1;
    } else if (Math.abs(val - CRIT) > 0.05) {
      console.log(`      FALLITO — ${name} vale ${val.toFixed(3)}% invece di ${CRIT}%`);
      fails += 1;
    }
  }
}
console.log('');
console.log(fails === 0 ? '  T-009 passa: tutte le bande al 5.000%.' : `  ${fails} bande fuori tolleranza (vedi righe sopra).`);
