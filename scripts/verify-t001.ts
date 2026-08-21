import { buildSnapshot, measureRegionAreas, regionAt, zoneAt, REGION_IDS,
         DEFAULT_CHECK_CONFIG, rWallAt, GRID_ANGLES, GRID_RADII, AXES } from '@/ui/skillCheckWebV1/zones';

const five = (v: number) => Array.from({ length: AXES }, () => v);
const CASES: [string, number[], number[]][] = [
  ['50/50', five(50), five(50)],
  ['85/50', five(85), five(50)],
  ['30/80', five(30), five(80)],
  ['65/60', five(65), five(60)],
  ['20/20', five(20), five(20)],
  ['95/20', five(95), five(20)],
  ['99/10', five(99), five(10)],
  ['99/1',  five(99), five(1)],
  ['1/99',  five(1),  five(99)],
  ['misto', [65,55,70,40,85], [50,60,45,70,55]],
];

console.log('T-001 — AREE DELLA PARTIZIONE (% dell\'arena)');
console.log('  prova  |' + REGION_IDS.map(k => k.padStart(9)).join(' |') + ' |   somma | epicfail>0');
let fails = 0;
for (const [name, st, df] of CASES) {
  const s = buildSnapshot({ stats: st, diffs: df }, DEFAULT_CHECK_CONFIG);
  const sum = REGION_IDS.reduce((x, k) => x + s.areas[k], 0);
  const okEpic = s.areas.critFail > 0.5;
  if (!okEpic) fails += 1;
  console.log(`  ${name.padEnd(7)}|` + REGION_IDS.map(k => s.areas[k].toFixed(2).padStart(9)).join(' |') +
    ` |${sum.toFixed(2).padStart(8)} | ${okEpic ? 'SI' : 'NO'}`);
}

console.log('\nTARATURA delle due bande garantite (tolleranza 0.05 pt)');
for (const [name, st, df] of CASES) {
  const s = buildSnapshot({ stats: st, diffs: df }, DEFAULT_CHECK_CONFIG);
  const dCrit = Math.abs(s.areas.critFail - DEFAULT_CHECK_CONFIG.crit);
  const succ = s.areas.critWin + s.areas.win;
  const critWinPct = succ > 0 ? (100 * s.areas.critWin) / succ : 0;
  const dWin = Math.abs(critWinPct - DEFAULT_CHECK_CONFIG.critWin);
  const ok = dCrit <= 0.05 && (succ < 1 || dWin <= 0.35);
  if (!ok) fails += 1;
  console.log(`  ${name.padEnd(7)} critFail ${s.areas.critFail.toFixed(3)}% (Δ${dCrit.toFixed(3)})` +
    `  critWin ${critWinPct.toFixed(2)}% del successo (Δ${dWin.toFixed(2)})  ${ok ? 'ok' : 'FUORI'}`);
}

console.log('\nPARTIZIONE: ogni punto in UNA regione e UNA zona');
{
  const s = buildSnapshot({ stats: five(65), diffs: five(60) });
  let n = 0;
  for (let i = 0; i < 360; i += 1) for (let j = 1; j < 120; j += 1) {
    const a = -Math.PI/2 + (i/360)*Math.PI*2;
    const r = rWallAt(s, a) * (j/120);
    const reg = regionAt(s, Math.cos(a)*r, Math.sin(a)*r);
    const zon = zoneAt(s, Math.cos(a)*r, Math.sin(a)*r);
    if (!REGION_IDS.includes(reg)) { console.log('  regione ignota', reg); fails += 1; }
    if (!['none','wound','death'].includes(zon)) { console.log('  zona ignota', zon); fails += 1; }
    n += 1;
  }
  console.log(`  ${n} punti, ogni punto una sola regione e una sola zona (funzioni totali)  ok`);
}

console.log('\nCONVERGENZA DELLA GRIGLIA (raddoppio: scarto max ammesso 0.02 pt)');
for (const [name, st, df] of CASES.slice(0, 5)) {
  const s = buildSnapshot({ stats: st, diffs: df });
  const a1 = measureRegionAreas(s, GRID_ANGLES, GRID_RADII);
  const a2 = measureRegionAreas(s, GRID_ANGLES * 2, GRID_RADII * 2);
  const worst = Math.max(...REGION_IDS.map(k => Math.abs(a1[k] - a2[k])));
  const ok = worst <= 0.02;
  if (!ok) fails += 1;
  console.log(`  ${name.padEnd(7)} scarto max ${worst.toFixed(4)} pt  ${ok ? 'ok' : 'FUORI'}`);
}

console.log(`\n${fails === 0 ? 'T-001: tutti i criteri passati' : 'T-001: ' + fails + ' criteri FALLITI'}`);
