import { buildSnapshot, solveCorolla, tstOf, rOf, rWallAt, rStarAt, AXES,
         DEFAULT_CHECK_CONFIG } from '@/ui/skillCheckWebV1/zones';
const five = (v: number) => Array.from({ length: AXES }, () => v);
console.log('LA COROLLA RISOLTA — area = probabilita, punte libere, niente da clippare');
console.log('  prova    | tst | manopola | scala | area ottenuta | corpo dentro il muro?');
let bad = 0;
for (const [s, d] of [[20,80],[30,80],[40,60],[50,50],[60,50],[65,60],[75,50],[85,50],[95,20],[99,10],[1,99]] as [number,number][]) {
  const input = { stats: five(s), diffs: five(d) };
  const t = tstOf(s, d, DEFAULT_CHECK_CONFIG.crit);
  const c = solveCorolla(input, DEFAULT_CHECK_CONFIG, t);
  const snap = buildSnapshot(input, DEFAULT_CHECK_CONFIG, 0, c);
  /* il corpo sta dentro? confronto punta del CORPO con il muro, angolo per angolo */
  let worst = -1e9;
  for (let i = 0; i < 720; i += 1) {
    const a = -Math.PI/2 + (i/720)*Math.PI*2;
    worst = Math.max(worst, rStarAt(snap, a) - rWallAt(snap, a));
  }
  const err = Math.abs(c.got - t);
  if (err > 0.6) bad += 1;
  console.log(`  ${(s+'/'+d).padEnd(9)}|${String(t).padStart(4)} |${c.bodyMix.toFixed(3).padStart(9)} |${c.bodyScale.toFixed(2).padStart(7)} |` +
    `${(c.got.toFixed(1)+'%').padStart(14)} | ${worst <= 0 ? 'si' : 'sporge di '+worst.toFixed(0)+'px'}${err>0.6?'   AREA FUORI':''}`);
}
console.log(`\ngli AGHI restano a rOf(stat): 85 -> ${rOf(85).toFixed(0)}, 50 -> ${rOf(50).toFixed(0)}, 20 -> ${rOf(20).toFixed(0)}`);
console.log(bad === 0 ? 'Corolla: area centrata in tutti i casi' : `Corolla: ${bad} casi con area fuori`);
