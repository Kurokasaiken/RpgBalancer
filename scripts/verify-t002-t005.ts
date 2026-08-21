import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES, regionAt, zoneAt, createRng,
         REGION_IDS, buildRegionGrid, withRiskPhase, measureRegionAreas,
         type RegionId, type ZoneId } from '@/ui/skillCheckWebV1/zones';
import { bandsFromAreas, rollBoth, pickLanding, intersectionArea, resolveCheck,
         rollablePairs, isSuccess, shownSuccessPct } from '@/ui/skillCheckWebV1/resolution';

const five = (v: number) => Array.from({ length: AXES }, () => v);
const CASES: [string, number[], number[]][] = [
  ['50/50', five(50), five(50)], ['85/50', five(85), five(50)],
  ['30/80', five(30), five(80)], ['65/60', five(65), five(60)],
  ['20/20', five(20), five(20)], ['95/20', five(95), five(20)],
  ['1/99', five(1), five(99)],   ['misto', [65,55,70,40,85], [50,60,45,70,55]],
];
let fails = 0;

console.log('T-002 — BANDE DEL D100 LETTE DALLE AREE');
for (const [n, st, df] of CASES) {
  const s = buildSnapshot({ stats: st, diffs: df });
  const b = bandsFromAreas(s);
  const tot = b.reduce((x, k) => x + (k.to >= k.from ? k.to - k.from + 1 : 0), 0);
  const ok = tot === 100;
  if (!ok) fails += 1;
  const txt = b.map(k => `${k.region}${k.to >= k.from ? ` ${k.from}-${k.to}` : ' —'}`).join('  ');
  console.log(`  ${n.padEnd(7)} ${txt}   somma ${tot} ${ok ? 'ok' : 'FUORI'}  |  successo mostrato ${shownSuccessPct(s).toFixed(2)}%`);
}

console.log('\nT-003 — ESISTENZA DELL\'INTERSEZIONE (area > 0) per ogni coppia estraibile');
let pairsTot = 0, pairsEmpty = 0;
for (const [n, st, df] of CASES) {
  const s = buildSnapshot({ stats: st, diffs: df });
  const pairs = rollablePairs(s);
  const grid = buildRegionGrid(s);
  const empties: string[] = [];
  for (const p of pairs) {
    pairsTot += 1;
    const A = intersectionArea(s, p, grid);
    if (A <= 0) { empties.push(`${p.region}+${p.zone}`); pairsEmpty += 1; }
  }
  console.log(`  ${n.padEnd(7)} ${pairs.length} coppie estraibili, vuote: ${empties.length ? empties.join(', ') : 'nessuna'}`);
}
console.log(`  totale: ${pairsTot} coppie, ${pairsEmpty} vuote (${(100*pairsEmpty/pairsTot).toFixed(1)}%)`);

console.log('\nT-003/004 — pickLanding: riparazioni e rilassamenti su ogni coppia');
for (const [n, st, df] of CASES) {
  const s = buildSnapshot({ stats: st, diffs: df });
  const pairs = rollablePairs(s);
  let rep = 0, rel = 0, bad = 0;
  pairs.forEach((p, i) => {
    const rng = createRng(1000 + i);
    const r = pickLanding(s, { roll: 0, riskRoll: 0, ...p }, rng);
    if (r.repairs > 0) rep += 1;
    if (r.relaxed) rel += 1;
    const okReg = r.relaxed
      ? isSuccess(regionAt(r.snap, r.point.x, r.point.y)) === isSuccess(p.region)
      : regionAt(r.snap, r.point.x, r.point.y) === p.region && zoneAt(r.snap, r.point.x, r.point.y) === p.zone;
    if (!okReg) { bad += 1; }
  });
  if (bad > 0) fails += 1;
  console.log(`  ${n.padEnd(7)} ${pairs.length} coppie · riparate ${rep} · rilassate ${rel} · punti non conformi ${bad} ${bad ? 'FUORI' : 'ok'}`);
}

console.log('\nT-004 — la riparazione conserva le aree della partizione degli esiti');
{
  const s = buildSnapshot({ stats: five(65), diffs: five(60) });
  const a0 = measureRegionAreas(s);
  let worst = 0;
  for (let k = 1; k <= 36; k += 1) {
    const a1 = measureRegionAreas(withRiskPhase(s, k * 10 * Math.PI / 180));
    worst = Math.max(worst, ...REGION_IDS.map(r => Math.abs(a0[r] - a1[r])));
  }
  const ok = worst === 0;
  if (!ok) fails += 1;
  console.log(`  36 rotazioni, scarto massimo delle aree: ${worst} ${ok ? '(uguaglianza esatta) ok' : 'FUORI'}`);
}

console.log('\nT-005/006 — catena completa: N per ciascuna coppia, endpoint conforme');
for (const [n, st, df] of CASES) {
  const s = buildSnapshot({ stats: st, diffs: df });
  const seen = new Map<string, number>();
  let bad = 0, relaxed = 0, endBad = 0;
  for (let i = 0; i < 1500; i += 1) {
    const r = resolveCheck(s, 700000 + i);
    const key = `${r.rolled.region}+${r.rolled.zone}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if (r.relaxed) relaxed += 1;
    if (!r.verified) bad += 1;
    const d = Math.hypot(r.trajectory.endpoint.x - r.landing.x, r.trajectory.endpoint.y - r.landing.y);
    if (d > 0.5) endBad += 1;
  }
  const pairs = rollablePairs(s);
  const missing = pairs.filter(p => !seen.has(`${p.region}+${p.zone}`));
  if (bad > 0 || endBad > 0) fails += 1;
  console.log(`  ${n.padEnd(7)} 1500 tiri · asserzione violata ${bad} · endpoint fuori 0.5px ${endBad} · rilassati ${relaxed}` +
    ` · coppie non viste ${missing.length}${missing.length ? ' ('+missing.map(m=>m.region+'+'+m.zone).join(',')+')' : ''}`);
}

console.log(`\n${fails === 0 ? 'T-002..T-005: tutti i criteri passati' : 'T-002..T-005: ' + fails + ' criteri FALLITI'}`);
