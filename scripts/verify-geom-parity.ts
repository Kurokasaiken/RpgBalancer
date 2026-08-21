/* La geometria del modulo nuovo e quella dell'engine V7 devono essere LA STESSA
   funzione, non due copie che si assomigliano. Prima di far delegare l'engine,
   verifico che le formule coincidano al bit. */
import { buildSnapshot, rStarAt, rWallAt, rOf, AXES } from '@/ui/skillCheckWebV1/zones';
const R = 362, rCore = Math.max(30, R * 0.12), VF = 0.3675, TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rOf7 = (v: number) => rCore + clamp(v, 1, 99) / 100 * (R - 22 - rCore);
const blob7 = (t: number) => 1 + 0.035*Math.sin(t*3+0.7) + 0.022*Math.sin(t*5-1.3) + 0.014*Math.sin(t*7+2.1);
function radial7(t0: number, arr: number[]) {
  const t = (((t0 + Math.PI/2) % TAU) + TAU) % TAU, seg = TAU/(AXES*2);
  const k = Math.floor(t/seg), f = (t-k*seg)/seg, tip = (i: number) => arr[((i%AXES)+AXES)%AXES];
  if (k%2===0) { const a = tip(k/2), b = Math.min(tip(k/2), tip(k/2+1))*VF; return a+(b-a)*f; }
  const b = tip((k+1)/2), a = Math.min(tip((k-1)/2), tip((k+1)/2))*VF; return a+(b-a)*f;
}
function check7(t0: number, chk: number[]) {
  const t = (((t0 + Math.PI/2) % TAU) + TAU) % TAU, seg = TAU/AXES;
  const k = Math.floor(t/seg), f = (t-k*seg)/seg, sm = f*f*(3-2*f);
  return Math.max(rCore+30, (chk[k%AXES] + (chk[(k+1)%AXES]-chk[k%AXES])*sm) * blob7(t0));
}
let worstStar = 0, worstWall = 0, worstROf = 0;
for (let v = 1; v <= 99; v += 1) worstROf = Math.max(worstROf, Math.abs(rOf(v) - rOf7(v)));
for (const [st, df] of [[[85,85,85,85,85],[50,50,50,50,50]], [[65,55,70,40,85],[50,60,45,70,55]]]) {
  const s = buildSnapshot({ stats: st, diffs: df });
  const tip = st.map(rOf7), chk = df.map(rOf7);
  for (let i = 0; i < 5000; i += 1) {
    const a = -Math.PI/2 + (i/5000)*TAU;
    worstStar = Math.max(worstStar, Math.abs(rStarAt(s, a) - radial7(a, tip)));
    worstWall = Math.max(worstWall, Math.abs(rWallAt(s, a) - check7(a, chk)));
  }
}
console.log(`rOf   scarto max ${worstROf.toExponential(1)}`);
console.log(`stella scarto max ${worstStar.toExponential(1)}`);
console.log(`muro   scarto max ${worstWall.toExponential(1)}`);
const ok = worstROf === 0 && worstStar === 0 && worstWall === 0;
console.log(ok ? 'IDENTICHE al bit: la delega e\' sicura' : 'DIVERGONO: non delegare prima di capire perche\'');
