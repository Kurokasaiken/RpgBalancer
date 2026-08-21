import { buildSnapshot, AXES, zoneAt, rWallAt } from '@/ui/skillCheckWebV1/zones';
import { buildFracture, ribbonPolygon, openAt } from '@/ui/skillCheckWebV1/fracture';
import { resolveCheck } from '@/ui/skillCheckWebV1/resolution';
const five = (v: number) => Array.from({ length: AXES }, () => v);
let bad = 0;
console.log('T-007b — L\'ANTITESI: la ferita si chiude, la morte resta aperta');
for (const tier of ['fissure', 'rift'] as const) {
  const samples = [0, 0.15, 0.32, 0.5, 0.8, 1].map(k => openAt(tier, k * 1500, 1500));
  const closes = samples[samples.length - 1] < 0.02;
  const ok = tier === 'fissure' ? closes : !closes;
  if (!ok) bad += 1;
  console.log(`  ${tier.padEnd(9)} apertura: ${samples.map(v => v.toFixed(2)).join(' → ')}` +
    `  ${tier === 'fissure' ? (closes ? 'si richiude ok' : 'NON si richiude FUORI') : (closes ? 'si richiude FUORI' : 'resta aperta ok')}`);
}
console.log('\nEPICENTRO e contenimento');
for (const [n, st, df] of [['50/50', five(50), five(50)], ['30/80', five(30), five(80)], ['85/50', five(85), five(50)]] as [string, number[], number[]][]) {
  const s = buildSnapshot({ stats: st, diffs: df });
  let onLanding = 0, outside = 0, tot = 0, empty = 0;
  for (let i = 0; i < 600; i += 1) {
    const r = resolveCheck(s, 90000 + i);
    if (r.rolled.zone === 'none') continue;
    tot += 1;
    const F = buildFracture(r.snap, r.rolled.zone, r.landing, i, { inZone: !r.relaxed, relaxed: r.relaxed });
    if (F.atLanding) onLanding += 1;
    if (!F.branches.length) empty += 1;
    /* nessun nodo fuori dal muro: una crepa fuori dall'arena non appartiene a nessuno */
    for (const br of F.branches) for (const nd of br.nodes) {
      const d = Math.hypot(nd.x, nd.y);
      if (d > rWallAt(r.snap, Math.atan2(nd.y, nd.x)) * 1.02) outside += 1;
    }
  }
  if (outside > 0 || empty > 0) bad += 1;
  console.log(`  ${n.padEnd(7)} ${tot} terremoti · epicentro sull'atterraggio ${onLanding}/${tot}` +
    ` · nodi fuori dal muro ${outside} · fratture vuote ${empty}`);
}
console.log('\nDETERMINISMO: lo stream della frattura non tocca quello dei dadi');
{
  const s = buildSnapshot({ stats: five(65), diffs: five(60) });
  const a = Array.from({ length: 50 }, (_, i) => resolveCheck(s, 5000 + i));
  const b = Array.from({ length: 50 }, (_, i) => {
    const r = resolveCheck(s, 5000 + i);
    buildFracture(r.snap, 'death', r.landing, i);   // consuma dal suo stream
    return r;
  });
  const same = a.every((r, i) => r.rolled.roll === b[i].rolled.roll && r.rolled.riskRoll === b[i].rolled.riskRoll);
  if (!same) bad += 1;
  console.log(`  50 tiri, dadi identici con e senza frattura: ${same ? 'ok' : 'DIVERGONO'}`);
}
console.log(`\n${bad === 0 ? 'T-007b: tutti i criteri passati' : 'T-007b: ' + bad + ' criteri FALLITI'}`);
