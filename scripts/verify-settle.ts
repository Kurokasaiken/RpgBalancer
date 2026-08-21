import { buildSnapshot, AXES, regionAt } from '@/ui/skillCheckWebV1/zones';
import { resolveCheck, TEASE_MAX_PX, TEASE_TO } from '@/ui/skillCheckWebV1/resolution';
const five = (v: number) => Array.from({ length: AXES }, () => v);
let bad = 0;
console.log('ASSESTAMENTO — velocita\' massima nell\'ultimo tratto (px/frame a 120Hz)');
console.log('  prova  | esitazioni | dist. media esit.->atterr. | v max settle | v max globale | salti >12px');
for (const [n, st, df] of [['50/50', five(50), five(50)], ['85/50', five(85), five(50)],
                           ['30/80', five(30), five(80)], ['95/20', five(95), five(20)]] as [string,number[],number[]][]) {
  const s = buildSnapshot({ stats: st, diffs: df });
  let teased = 0, sumD = 0, vSettle = 0, vAll = 0, jumps = 0, N = 300;
  for (let i = 0; i < N; i += 1) {
    const r = resolveCheck(s, 41000 + i);
    const P = r.trajectory.points;
    const cut = Math.floor(P.length * TEASE_TO);
    if (r.trajectory.teasedAt) {
      teased += 1;
      sumD += Math.hypot(r.trajectory.teasedAt.x - r.landing.x, r.trajectory.teasedAt.y - r.landing.y);
    }
    for (let k = 1; k < P.length; k += 1) {
      const v = Math.hypot(P[k].x - P[k-1].x, P[k].y - P[k-1].y);
      vAll = Math.max(vAll, v);
      if (k >= cut) { vSettle = Math.max(vSettle, v); if (v > 12) jumps += 1; }
    }
  }
  if (jumps > 0) bad += 1;
  console.log(`  ${n.padEnd(7)}|${String(teased+'/'+N).padStart(11)} |${(teased?(sumD/teased).toFixed(1):'—').padStart(27)} |` +
    `${vSettle.toFixed(2).padStart(13)} |${vAll.toFixed(1).padStart(14)} |${String(jumps).padStart(12)}`);
}
console.log(`\ntetto sull'esitazione: ${TEASE_MAX_PX}px — oltre, nessuna esitazione invece di un teletrasporto`);
console.log(bad === 0 ? 'Assestamento: nessun salto oltre 12px/frame nell\'ultimo tratto' : `Assestamento: ${bad} casi con salti`);
