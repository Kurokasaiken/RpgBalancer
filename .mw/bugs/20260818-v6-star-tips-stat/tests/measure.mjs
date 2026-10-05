/* Harness fedele al modello geometrico di engine.ts (V6).
   Replica: rOf, gooBlob, rCheckAt, radialFromAxes, area solve.
   Costanti copiate dal file reale: R=362, AXES=5, rCore=max(30,R*0.12). */

const TAU = Math.PI * 2;
const R = 362, AXES = 5;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const normAng = a => { a %= TAU; if (a < -Math.PI) a += TAU; if (a > Math.PI) a -= TAU; return a; };
const TIP = i => -Math.PI / 2 + i * (TAU / AXES);

const geo = { rCore: Math.max(30, R * 0.12), axisCheck: [], valleyF: 0.5 };
const rOf = v => geo.rCore + clamp(v, 1, 99) / 100 * (R - 22 - geo.rCore);

const gooBlob = t => 1 + 0.035 * Math.sin(t * 3 + 0.7) + 0.022 * Math.sin(t * 5 - 1.3) + 0.014 * Math.sin(t * 7 + 2.1);

function rCheckAt(theta) {
  const t = ((normAng(theta + Math.PI / 2) % TAU) + TAU) % TAU;
  const seg = TAU / AXES;
  const k = Math.floor(t / seg), f = (t - k * seg) / seg;
  const r0 = geo.axisCheck[k % AXES], r1 = geo.axisCheck[(k + 1) % AXES];
  const s = f * f * (3 - 2 * f);
  return Math.max(geo.rCore + 30, (r0 + (r1 - r0) * s) * gooBlob(theta));
}

function radialFromAxes(theta, arr, scale) {
  const t = ((normAng(theta + Math.PI / 2) % TAU) + TAU) % TAU;
  const seg = TAU / (AXES * 2);
  const k = Math.floor(t / seg), f = (t - k * seg) / seg;
  const tipR = i => arr[((i % AXES) + AXES) % AXES] * scale;
  const vF = geo.valleyF;
  if (k % 2 === 0) { const a = tipR(k / 2), b = Math.min(tipR(k / 2), tipR(k / 2 + 1)) * vF; return a + (b - a) * f; }
  const b = tipR((k + 1) / 2), a = Math.min(tipR((k - 1) / 2), tipR((k + 1) / 2)) * vF; return a + (b - a) * f;
}

const SEG = 720, dA = TAU / SEG;

function sampleArena() {
  const arenaR = []; let arenaA = 0;
  for (let i = 0; i < SEG; i += 1) {
    const a = -Math.PI / 2 + i * dA;
    const r = rCheckAt(a);
    arenaR.push(r); arenaA += 0.5 * r * r * dA;
  }
  return { arenaR, arenaA };
}

/* area(stella ∩ arena) */
function areaOf(sh, kk, vf, arenaR) {
  geo.valleyF = vf;
  let A = 0;
  for (let i = 0; i < SEG; i += 1) {
    const a = -Math.PI / 2 + i * dA;
    const rs = radialFromAxes(a, sh, kk);
    const r = Math.min(Math.max(rs, geo.rCore), arenaR[i]);
    A += 0.5 * r * r * dA;
  }
  return A;
}

function setup(skills) {
  const axisSkill = [];
  const skillAxes = skills.length === 1 ? [5]
    : skills.length === 2 ? [3, 2]
    : skills.length === 3 ? [2, 2, 1]
    : skills.length === 4 ? [2, 1, 1, 1] : [1, 1, 1, 1, 1];
  for (let s = 0; s < skillAxes.length; s += 1) for (let n = 0; n < skillAxes[s]; n += 1) axisSkill.push(s);
  const axisTip = [], axisCheck = [];
  for (let i = 0; i < AXES; i += 1) {
    const sk = skills[axisSkill[i]] || { stat: 60, difficulty: 50 };
    axisTip[i] = rOf(sk.stat); axisCheck[i] = rOf(sk.difficulty);
  }
  geo.axisCheck = axisCheck;
  const sk0 = skills[0];
  const tst = clamp(50 + (sk0.stat - sk0.difficulty), 1, 99);
  return { axisTip, axisCheck, tst };
}

/* ── MODELLO ATTUALE: scala k risolta, poi cap a obeliskTip ────────── */
function current(skills) {
  const { axisTip, tst } = setup(skills);
  const { arenaR, arenaA } = sampleArena();
  const target = arenaA * tst / 100;
  const mx = Math.max(...axisTip);
  const shape0 = axisTip.map(r => r / mx);
  let lo = geo.rCore, hi = Math.max(...arenaR) * 4;
  for (let it = 0; it < 44; it += 1) { const mid = (lo + hi) / 2; if (areaOf(shape0, mid, 0.5, arenaR) < target) lo = mid; else hi = mid; }
  const kUsed = (lo + hi) / 2;
  const starTip = shape0.map((v, i) => Math.min(Math.max(geo.rCore + 2, v * kUsed), axisTip[i]));
  geo.valleyF = 0.5;
  const areaPct = areaOf(starTip.map(r => r / Math.max(...starTip)), Math.max(...starTip), 0.5, arenaR) / arenaA * 100;
  return { tst, axisTip, starTip, areaPct, tipRatio: starTip[0] / axisTip[0] };
}

/* ── MODELLO PROPOSTO: punte inchiodate alla stat, si risolve vF ───── */
function proposed(skills) {
  const { axisTip, tst } = setup(skills);
  const { arenaR, arenaA } = sampleArena();
  const target = arenaA * tst / 100;
  /* punte fisse: shape = axisTip normalizzato, k = max(axisTip) */
  const mx = Math.max(...axisTip);
  const shape = axisTip.map(r => r / mx);
  const aAt = vf => areaOf(shape, mx, vf, arenaR);
  const aMin = aAt(0), aMax = aAt(1);
  /* bisezione su vF (monotona crescente in vF) */
  let lo = 0, hi = 1;
  for (let it = 0; it < 40; it += 1) { const mid = (lo + hi) / 2; if (aAt(mid) < target) lo = mid; else hi = mid; }
  const vF = (lo + hi) / 2;
  const got = aAt(vF);
  return {
    tst, axisTip, vF,
    areaPct: got / arenaA * 100,
    feasible: [aMin / arenaA * 100, aMax / arenaA * 100],
    inRange: target >= aMin - 1e-9 && target <= aMax + 1e-9,
  };
}

const CASES = [
  ['default 65/50', [{ stat: 65, difficulty: 50 }]],
  ['nuovo default 85/50', [{ stat: 85, difficulty: 50 }]],
  ['parità 50/50', [{ stat: 50, difficulty: 50 }]],
  ['parità 80/80', [{ stat: 80, difficulty: 80 }]],
  ['stat 40 diff 40', [{ stat: 40, difficulty: 40 }]],
  ['debole 40/60', [{ stat: 40, difficulty: 60 }]],
  ['HARD 30/80', [{ stat: 30, difficulty: 80 }]],
  ['estremo 20/90', [{ stat: 20, difficulty: 90 }]],
  ['forte 90/40', [{ stat: 90, difficulty: 40 }]],
  ['5 assi asimm', [
    { stat: 80, difficulty: 40 }, { stat: 30, difficulty: 70 }, { stat: 60, difficulty: 50 },
    { stat: 90, difficulty: 30 }, { stat: 45, difficulty: 55 }]],
];

const pad = (s, n) => String(s).padEnd(n);
const num = (v, n = 1) => v.toFixed(n);

console.log('\n=== ATTUALE (scala risolta + cap) ===');
console.log(pad('caso', 22), pad('tst', 5), pad('rOf(stat)', 10), pad('punta', 8), pad('punta/stat', 11), 'area%');
for (const [name, sk] of CASES) {
  const r = current(sk);
  console.log(pad(name, 22), pad(r.tst, 5), pad(num(r.axisTip[0]), 10), pad(num(r.starTip[0]), 8),
    pad(num(r.tipRatio * 100) + '%', 11), num(r.areaPct) + '%');
}

console.log('\n=== PROPOSTO (punte inchiodate alla stat, vF risolto) ===');
console.log(pad('caso', 22), pad('tst', 5), pad('vF', 7), pad('area%', 8), pad('range fattibile', 20), 'ok');
for (const [name, sk] of CASES) {
  const r = proposed(sk);
  console.log(pad(name, 22), pad(r.tst, 5), pad(num(r.vF, 3), 7), pad(num(r.areaPct) + '%', 8),
    pad(num(r.feasible[0]) + '% .. ' + num(r.feasible[1]) + '%', 20), r.inRange ? 'OK' : 'FUORI');
}
console.log();

/* ── MODELLO DEL DIRECTOR: punte = stat, goo = difficoltà, vF = 0.5 (V1).
      La probabilità NON è un input: è l'area di sovrapposizione. ────────── */
function director(skills) {
  const { axisTip, tst } = setup(skills);
  const { arenaR, arenaA } = sampleArena();
  const mx = Math.max(...axisTip);
  const shape = axisTip.map(r => r / mx);
  const got = areaOf(shape, mx, 0.5, arenaR);
  return { tst, axisTip, areaPct: got / arenaA * 100 };
}

console.log('=== MODELLO DIRECTOR (punte=stat, goo=diff, vF=0.5 fisso) ===');
console.log(pad('caso', 22), pad('formula tst', 12), pad('prob. geometrica', 17), 'scarto');
for (const [name, sk] of CASES) {
  const r = director(sk);
  const d = r.areaPct - r.tst;
  console.log(pad(name, 22), pad(r.tst + '%', 12), pad(num(r.areaPct) + '%', 17),
    (d >= 0 ? '+' : '') + num(d) + ' pt');
}
console.log();

/* ── vF calibrato: esiste un vF fisso per cui la PARITÀ legge esattamente 50%?
      Se sì è scale-invariant e diventa la costante di taratura. ──────────── */
function solveParityVF() {
  setup([{ stat: 50, difficulty: 50 }]);
  const { arenaR, arenaA } = sampleArena();
  const { axisTip } = setup([{ stat: 50, difficulty: 50 }]);
  const mx = Math.max(...axisTip), shape = axisTip.map(r => r / mx);
  let lo = 0, hi = 1;
  for (let it = 0; it < 50; it += 1) {
    const mid = (lo + hi) / 2;
    if (areaOf(shape, mx, mid, arenaR) < arenaA * 0.5) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
const VF = solveParityVF();
console.log(`=== vF di taratura (parità => 50%): ${VF.toFixed(4)} ===`);
/* verifica scale-invarianza su più livelli di parità */
for (const lv of [20, 35, 50, 65, 80, 95]) {
  const { axisTip } = setup([{ stat: lv, difficulty: lv }]);
  const { arenaR, arenaA } = sampleArena();
  const mx = Math.max(...axisTip), shape = axisTip.map(r => r / mx);
  console.log(`   parità ${pad(lv, 3)} => ${num(areaOf(shape, mx, VF, arenaR) / arenaA * 100, 2)}%`);
}

console.log(`\n=== MODELLO FINALE (punte=stat, goo=diff, vF=${VF.toFixed(3)}, clip al muro) ===`);
console.log(pad('caso', 22), pad('formula tst', 12), pad('prob. reale', 12), 'scarto');
for (const [name, sk] of CASES) {
  const { axisTip, tst } = setup(sk);
  const { arenaR, arenaA } = sampleArena();
  const mx = Math.max(...axisTip), shape = axisTip.map(r => r / mx);
  const p = areaOf(shape, mx, VF, arenaR) / arenaA * 100;
  const d = p - tst;
  console.log(pad(name, 22), pad(tst + '%', 12), pad(num(p) + '%', 12), (d >= 0 ? '+' : '') + num(d) + ' pt');
}
console.log();
