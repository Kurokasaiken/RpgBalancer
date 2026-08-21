import { buildSnapshot, AXES, regionAt, createRng, rWallAt } from '@/ui/skillCheckWebV1/zones';
import { resolveCheck, teasePoint } from '@/ui/skillCheckWebV1/resolution';
const five = (v: number) => Array.from({ length: AXES }, () => v);
const CASES: [string, number[], number[]][] = [
  ['50/50', five(50), five(50)], ['85/50', five(85), five(50)],
  ['30/80', five(30), five(80)], ['95/20', five(95), five(20)],
];
let bad = 0;
console.log('LE QUATTRO FASI — esitazione sul confine vero, e arrivo esatto');
for (const [n, st, df] of CASES) {
  const s = buildSnapshot({ stats: st, diffs: df });
  let teased = 0, teaseWrong = 0, endBad = 0, endRegionBad = 0, minGap = 1e9;
  const N = 400;
  for (let i = 0; i < N; i += 1) {
    const r = resolveCheck(s, 31000 + i);
    const T = r.trajectory;
    if (T.teasedAt) {
      teased += 1;
      /* l'esitazione deve stare DENTRO la regione dell'esito: se fosse oltre il
         confine il board mostrerebbe per un istante l'esito sbagliato */
      if (regionAt(r.snap, T.teasedAt.x, T.teasedAt.y) !== r.rolled.region) teaseWrong += 1;
      /* e deve essere VICINA a un confine: misuro quanto */
      const a = Math.atan2(T.teasedAt.y, T.teasedAt.x);
      const d0 = Math.hypot(T.teasedAt.x, T.teasedAt.y);
      const step = rWallAt(r.snap, a) / 480;
      let gap = 1e9;
      for (let k = 1; k <= 60; k += 1) for (const dir of [1, -1]) {
        const d = d0 + dir * k * step;
        const p = { x: Math.cos(a) * d, y: Math.sin(a) * d };
        if (d > 2 && d < rWallAt(r.snap, a) - 1 && regionAt(r.snap, p.x, p.y) !== r.rolled.region) {
          gap = Math.min(gap, k * step); break;
        }
      }
      if (gap < 1e9) minGap = Math.min(minGap, gap);
    }
    const dEnd = Math.hypot(T.endpoint.x - r.landing.x, T.endpoint.y - r.landing.y);
    if (dEnd > 0.5) endBad += 1;
    if (!r.verified) endRegionBad += 1;
  }
  if (teaseWrong || endBad || endRegionBad) bad += 1;
  console.log(`  ${n.padEnd(7)} ${N} tiri · esitazioni ${teased}/${N} · esitazioni nella regione SBAGLIATA ${teaseWrong}` +
    ` · endpoint fuori 0.5px ${endBad} · asserzione violata ${endRegionBad}`);
}
console.log(`\n${bad === 0 ? 'Tease: tutti i criteri passati' : 'Tease: ' + bad + ' casi FALLITI'}`);
