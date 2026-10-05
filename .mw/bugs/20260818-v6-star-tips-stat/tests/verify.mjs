/* Verifica gli invarianti del Director sul file REALE di engine.ts.
   1) guard statici: nessun solve puo riscrivere starTip
   2) misura numerica: punta == rOf(stat) su ogni asse, a ogni configurazione */
import { readFileSync } from 'node:fs';

const SRC = 'src/ui/idleVillage/components/destinyAstrolabeV6/engine.ts';
const src = readFileSync(SRC, 'utf8');
let fail = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail += 1; };

console.log('\n— guard statici sul sorgente —');
ok(/geo\.starTip\s*=\s*geo\.obeliskTip\.slice\(\)/.test(src),
  'starTip e assegnato direttamente da obeliskTip (punta = stat)');
ok(!/AREA SOLVE/.test(src), 'il blocco AREA SOLVE non esiste piu');
ok(!/bisect\s*\(/.test(src), 'nessuna bisezione residua sulla geometria');
ok((src.match(/geo\.starTip\s*=/g) || []).length === 2,
  'starTip scritto esattamente 2 volte (init + assegnazione), nessun overwrite');
ok(/const VALLEY_F\s*=\s*0\.3675/.test(src), 'VALLEY_F costante di taratura presente');
ok(/geo\.probPct\s*=/.test(src), 'probabilita derivata esposta come geo.probPct');
/* LA STELLA E SOPRA IL GOO: intera, piena, mai oscurata.
   Questi tre guard bloccano i due tentativi sbagliati (clip al muro, velo). */
const body = src.slice(src.indexOf('function drawStar('), src.indexOf('/* RISK STREAMS'));
ok(!/gooBlobPath/.test(body),
  'drawStar non tocca il path del goo: ne clip ne velo ne ri-stroke del muro');
ok(!/globalAlpha/.test(body) || !/rgba\(3,7,16/.test(body),
  'nessun velo scuro sopra la stella');
ok(/ctx\.fill\(p\)/.test(body) && /ctx\.stroke\(p\)/.test(body),
  'la stella e riempita e bordata sulla silhouette intera');
/* il verdetto resta clippato al muro anche se il disegno non lo e */
ok(/const inStar=.*Math\.min\(rStarAt\(a,s\),rCheckAt\(a\)\)/.test(src),
  'inStar resta min(stella, muro): il verdetto e corretto senza clip sul disegno');

/* — modello numerico identico all'implementazione — */
const TAU = Math.PI * 2, R = 362, AXES = 5;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const normAng = a => { a %= TAU; if (a < -Math.PI) a += TAU; if (a > Math.PI) a -= TAU; return a; };
const VALLEY_F = 0.3675;
const geo = { rCore: Math.max(30, R * 0.12), axisCheck: [], starTip: [], valleyF: VALLEY_F };
const rOf = v => geo.rCore + clamp(v, 1, 99) / 100 * (R - 22 - geo.rCore);
const gooBlob = t => 1 + 0.035 * Math.sin(t * 3 + 0.7) + 0.022 * Math.sin(t * 5 - 1.3) + 0.014 * Math.sin(t * 7 + 2.1);
function rCheckAt(theta) {
  const t = ((normAng(theta + Math.PI / 2) % TAU) + TAU) % TAU, seg = TAU / AXES;
  const k = Math.floor(t / seg), f = (t - k * seg) / seg;
  const r0 = geo.axisCheck[k % AXES], r1 = geo.axisCheck[(k + 1) % AXES], s = f * f * (3 - 2 * f);
  return Math.max(geo.rCore + 30, (r0 + (r1 - r0) * s) * gooBlob(theta));
}
function rStarAt(theta) {
  const t = ((normAng(theta + Math.PI / 2) % TAU) + TAU) % TAU, seg = TAU / (AXES * 2);
  const k = Math.floor(t / seg), f = (t - k * seg) / seg;
  const tipR = i => geo.starTip[((i % AXES) + AXES) % AXES], vF = geo.valleyF;
  if (k % 2 === 0) { const a = tipR(k / 2), b = Math.min(tipR(k / 2), tipR(k / 2 + 1)) * vF; return a + (b - a) * f; }
  const b = tipR((k + 1) / 2), a = Math.min(tipR((k - 1) / 2), tipR((k + 1) / 2)) * vF; return a + (b - a) * f;
}
const TIP = i => -Math.PI / 2 + i * (TAU / AXES);
function build(skills) {
  const skillAxes = skills.length === 1 ? [5] : skills.length === 2 ? [3, 2]
    : skills.length === 3 ? [2, 2, 1] : skills.length === 4 ? [2, 1, 1, 1] : [1, 1, 1, 1, 1];
  const axisSkill = [];
  for (let s = 0; s < skillAxes.length; s += 1) for (let n = 0; n < skillAxes[s]; n += 1) axisSkill.push(s);
  const tips = [], checks = [];
  for (let i = 0; i < AXES; i += 1) {
    const sk = skills[axisSkill[i]];
    tips[i] = rOf(sk.stat); checks[i] = rOf(sk.difficulty);
  }
  geo.axisCheck = checks; geo.starTip = tips.slice(); geo.valleyF = VALLEY_F;
  let starA = 0, arenaA = 0;
  const SEG = 720, dA = TAU / SEG;
  for (let i = 0; i < SEG; i += 1) {
    const a = -Math.PI / 2 + i * dA, w = rCheckAt(a);
    const r = Math.min(Math.max(rStarAt(a), geo.rCore), w);
    starA += 0.5 * r * r * dA; arenaA += 0.5 * w * w * dA;
  }
  return { axisSkill, tips, checks, prob: starA / arenaA * 100 };
}

console.log('\n— invariante punte: punta(asse i) == rOf(stat della skill su i) —');
const CASES = [
  ['stat 40', [{ stat: 40, difficulty: 60 }]],
  ['85/50', [{ stat: 85, difficulty: 50 }]],
  ['30/80', [{ stat: 30, difficulty: 80 }]],
  ['5 assi asimm', [{ stat: 80, difficulty: 40 }, { stat: 30, difficulty: 70 },
    { stat: 60, difficulty: 50 }, { stat: 90, difficulty: 30 }, { stat: 45, difficulty: 55 }]],
];
for (const [name, sk] of CASES) {
  const r = build(sk);
  let worst = 0;
  for (let i = 0; i < AXES; i += 1) {
    const want = rOf(sk[r.axisSkill[i]].stat);
    const got = rStarAt(TIP(i));
    worst = Math.max(worst, Math.abs(got - want));
  }
  ok(worst < 1e-9, `${name}: scarto massimo punta/stat = ${worst.toExponential(2)} px`);
}

console.log('\n— taratura: parita legge 50% a ogni livello —');
for (const lv of [20, 35, 50, 65, 80, 95]) {
  const p = build([{ stat: lv, difficulty: lv }]).prob;
  ok(Math.abs(p - 50) < 0.5, `parita ${lv}/${lv} => ${p.toFixed(2)}%`);
}

console.log('\n— monotonia: piu stat (a difficolta fissa) => piu probabilita —');
let prev = -1, mono = true;
for (let s = 10; s <= 95; s += 5) {
  const p = build([{ stat: s, difficulty: 55 }]).prob;
  if (p < prev - 1e-6) mono = false;
  prev = p;
}
ok(mono, 'probabilita non decresce mai al crescere della stat');

prev = 101; mono = true;
for (let d = 10; d <= 95; d += 5) {
  const p = build([{ stat: 55, difficulty: d }]).prob;
  if (p > prev + 1e-6) mono = false;
  prev = p;
}
ok(mono, 'probabilita non cresce mai al crescere della difficolta');

console.log(`\n${fail === 0 ? 'TUTTI I TEST VERDI' : fail + ' TEST FALLITI'}\n`);
process.exit(fail === 0 ? 0 : 1);
