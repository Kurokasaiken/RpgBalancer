/**
 * geometry.ts — FUNZIONI PURE (piano §2.1).
 * Input valori → zone in spazio normalizzato (raggio arena = 1, centro in 0,0).
 * Nessun side effect, nessun accesso al DOM: usato da engine, simulation e test.
 *
 * Modello radiale:
 *  - la Sfida (contenitore fisico della pallina) è un blob rChallenge(θ)
 *    che tocca gli obelischi (check per asse) e interpola smooth tra loro;
 *  - la Stella del giocatore è un fiore rStar(θ) con punte ∝ stat per asse;
 *  - corona ferita = banda centrata sul perimetro stella (spessore ∝ woundPct);
 *  - voragini morte = dischi a cavallo del bordo stella nelle valli (area ∝ deathPct);
 *  - banda rovina critica = anello interno al bordo sfida (spessore ∝ critPct);
 *  - nearMissBand = banda esterna alla stella, spessa nearMissPct% di rStar(θ) (D7).
 *
 * Proporzionalità onesta: gli spessori sono derivati da
 * areaTarget = pct% × areaSfida, con spessore = areaTarget / perimetro
 * e clamp minimo di leggibilità.
 */
import {
  astrolabeV3Config,
  type AstrolabeV3Config,
} from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';

export interface AstrolabeSkill {
  name: string;
  stat: number;
  difficulty: number;
}

export interface GeometryInput {
  /** 1..5 skill, espanse a 5 assi con la logica D5. */
  stats: AstrolabeSkill[];
  difficulty: number;
  critPct: number;
  woundPct: number;
  deathPct: number;
}

export const AXES = 5;
export const TAU = Math.PI * 2;
/** Angolo della punta dell'asse i (asse 0 in alto). */
export const tipAngle = (i: number): number => -Math.PI / 2 + (i * TAU) / AXES;
/** Angolo della valle tra asse i e i+1. */
export const valleyAngle = (i: number): number => tipAngle(i) + Math.PI / AXES;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const normAng = (a: number): number => {
  let t = a % TAU;
  if (t < 0) t += TAU;
  return t;
};
const smoothstep = (f: number) => f * f * (3 - 2 * f);

/** Distribuzione D5 (non negoziabile): n skill → pesi per 5 assi. */
export function expandSkillAxes(count: number): number[] {
  if (count <= 1) return [5];
  if (count === 2) return [3, 2];
  if (count === 3) return [2, 2, 1];
  if (count === 4) return [2, 1, 1, 1];
  return [1, 1, 1, 1, 1];
}

/** Indice skill assegnata a ciascuno dei 5 assi. */
export function axisSkillMap(skillCount: number): number[] {
  const weights = expandSkillAxes(skillCount);
  const map: number[] = [];
  weights.forEach((w, s) => {
    for (let n = 0; n < w; n += 1) map.push(s);
  });
  while (map.length < AXES) map.push(map.length % Math.max(1, skillCount));
  return map.slice(0, AXES);
}

export interface GeometrySnapshot {
  input: GeometryInput;
  config: AstrolabeV3Config;
  /** raggio punta stella per asse (∝ stat) */
  axisTip: number[];
  /** raggio sfida per asse (∝ difficulty del check) */
  axisCheck: number[];
  /** skill assegnata a ciascun asse */
  axisSkill: number[];
  coreRadius: number;
  /** spessore banda corona ferita (centrata sul perimetro stella) */
  woundThickness: number;
  /** raggio dei dischi voragine (uno per valle) */
  voidRadius: number;
  /** centri voragini {x,y} nelle 5 valli, a cavallo del bordo stella */
  voidCenters: { x: number; y: number }[];
  /** spessore banda rovina critica (dal bordo sfida verso l'interno) */
  critThickness: number;
  /** area della sfida (unità normalizzate²) — per audit proporzioni */
  challengeArea: number;
  /** TST aggregato per il roll D100 (clamp(50+(statMedia−difficulty),1,99)) */
  tst: number;
}

/* ── funzioni radiali ────────────────────────────────────────────────────── */

/** Deformazione organica deterministica del bordo sfida (mai un cerchio pulito). */
function blob(theta: number): number {
  return (
    1 +
    0.09 * Math.sin(theta * 3 + 0.7) +
    0.055 * Math.sin(theta * 5 - 1.3) +
    0.035 * Math.sin(theta * 7 + 2.1)
  );
}

/** Raggio del bordo Sfida all'angolo θ (contenitore fisico della pallina). */
export function rChallengeAt(snap: GeometrySnapshot, theta: number): number {
  const t = normAng(theta + Math.PI / 2);
  const seg = TAU / AXES;
  const k = Math.floor(t / seg);
  const f = (t - k * seg) / seg;
  const r0 = snap.axisCheck[k % AXES];
  const r1 = snap.axisCheck[(k + 1) % AXES];
  const base = (r0 + (r1 - r0) * smoothstep(f)) * blob(theta);
  return clamp(base, snap.coreRadius + 0.1, snap.config.maxRadius);
}

/** Raggio della Stella (confine di successo) all'angolo θ — fiore a 5 lobi. */
export function rStarAt(snap: GeometrySnapshot, theta: number): number {
  const t = normAng(theta + Math.PI / 2);
  const seg = TAU / (AXES * 2); // 36°: alterna punta→valle→punta
  const k = Math.floor(t / seg);
  const f = smoothstep((t - k * seg) / seg);
  const tipR = (i: number) => snap.axisTip[((i % AXES) + AXES) % AXES];
  let r: number;
  if (k % 2 === 0) {
    const a = tipR(k / 2);
    const b = Math.min(tipR(k / 2), tipR(k / 2 + 1)) * 0.5;
    r = a + (b - a) * f;
  } else {
    const b = tipR((k + 1) / 2);
    const a = Math.min(tipR((k - 1) / 2), tipR((k + 1) / 2)) * 0.5;
    r = a + (b - a) * f;
  }
  // la stella non può eccedere il perimetro sfida (vincolo piano §2.1)
  return Math.min(r, rChallengeAt(snap, theta) - snap.config.minVisualThickness);
}

/** Spessore banda near-miss all'angolo θ: nearMissPct% della distanza centro→stella. */
export function nearMissThicknessAt(snap: GeometrySnapshot, theta: number): number {
  return (snap.config.nearMissPct / 100) * rStarAt(snap, theta);
}

/* ── misure numeriche (pure, deterministiche) ────────────────────────────── */

const SAMPLES = 720;

function polarArea(r: (theta: number) => number): number {
  let area = 0;
  for (let i = 0; i < SAMPLES; i += 1) {
    const v = r((i / SAMPLES) * TAU);
    area += 0.5 * v * v * (TAU / SAMPLES);
  }
  return area;
}

function polarPerimeter(r: (theta: number) => number): number {
  let per = 0;
  let lx = Math.cos(0) * r(0);
  let ly = Math.sin(0) * r(0);
  for (let i = 1; i <= SAMPLES; i += 1) {
    const a = (i / SAMPLES) * TAU;
    const v = r(a);
    const x = Math.cos(a) * v;
    const y = Math.sin(a) * v;
    per += Math.hypot(x - lx, y - ly);
    lx = x;
    ly = y;
  }
  return per;
}

/* ── costruzione snapshot ────────────────────────────────────────────────── */

/** Mappa un valore 0..100 su un raggio dal core verso il bordo. */
function rOf(v: number, cfg: AstrolabeV3Config): number {
  return cfg.coreRadius + (clamp(v, 1, 99) / 100) * (cfg.maxRadius - cfg.coreRadius);
}

export function buildGeometry(
  input: GeometryInput,
  config: AstrolabeV3Config = astrolabeV3Config,
): GeometrySnapshot {
  const skills = input.stats?.length
    ? input.stats
    : [{ name: 'Skill', stat: 50, difficulty: input.difficulty }];
  const axisSkill = axisSkillMap(skills.length);
  const axisTip = axisSkill.map((s) => rOf(skills[s].stat, config));
  const axisCheck = axisSkill.map(() => rOf(Math.max(35, 100 - input.difficulty * 0.35), config));

  const avgStat = skills.reduce((sum, s) => sum + s.stat, 0) / skills.length;
  const tst = clamp(Math.round(50 + (avgStat - input.difficulty)), 1, 99);

  const snap: GeometrySnapshot = {
    input,
    config,
    axisTip,
    axisCheck,
    axisSkill,
    coreRadius: config.coreRadius,
    woundThickness: 0,
    voidRadius: 0,
    voidCenters: [],
    critThickness: 0,
    challengeArea: 0,
    tst,
  };

  const challengeArea = polarArea((a) => rChallengeAt(snap, a));
  const challengePerimeter = polarPerimeter((a) => rChallengeAt(snap, a));

  snap.challengeArea = challengeArea;
  // proporzionalità onesta: area banda = pct% dell'area sfida.
  // La corona è clippata dal bordo sfida vicino alle punte, quindi lo spessore
  // si calibra per bisezione sull'area REALE (integrazione polare esatta).
  const crownAreaFor = (w: number): number => {
    let area = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const a = (i / SAMPLES) * TAU;
      const rs = rStarAt(snap, a);
      const outer = Math.min(rChallengeAt(snap, a), rs + w / 2);
      const inner = Math.max(0, rs - w / 2);
      if (outer > inner) area += 0.5 * (outer * outer - inner * inner) * (TAU / SAMPLES);
    }
    return area;
  };
  const woundTarget = (input.woundPct / 100) * challengeArea;
  let wLo = 0;
  let wHi = 0.6;
  for (let it = 0; it < 24; it += 1) {
    const mid = (wLo + wHi) / 2;
    if (crownAreaFor(mid) < woundTarget) wLo = mid;
    else wHi = mid;
  }
  snap.woundThickness = Math.max(config.minVisualThickness, (wLo + wHi) / 2);
  snap.critThickness = Math.max(
    config.minVisualThickness,
    ((input.critPct / 100) * challengeArea) / Math.max(1e-6, challengePerimeter),
  );
  const totalVoidArea = (input.deathPct / 100) * challengeArea;
  snap.voidRadius =
    input.deathPct <= 0
      ? 0
      : Math.max(config.minVoidRadius, Math.sqrt(totalVoidArea / (AXES * Math.PI)));
  snap.voidCenters = Array.from({ length: AXES }, (_, i) => {
    const a = valleyAngle(i);
    const r = rStarAt(snap, a); // a cavallo del bordo stella (D2: morte ∩ successo possibile)
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });

  return snap;
}

/** Interpolazione per il morph animato (oggetti spesi / preview, §2.1). */
export function lerpGeometry(
  a: GeometrySnapshot,
  b: GeometrySnapshot,
  t: number,
): GeometrySnapshot {
  const k = clamp(t, 0, 1);
  const mix = (x: number, y: number) => x + (y - x) * k;
  return {
    ...b,
    axisTip: a.axisTip.map((v, i) => mix(v, b.axisTip[i])),
    axisCheck: a.axisCheck.map((v, i) => mix(v, b.axisCheck[i])),
    coreRadius: mix(a.coreRadius, b.coreRadius),
    woundThickness: mix(a.woundThickness, b.woundThickness),
    voidRadius: mix(a.voidRadius, b.voidRadius),
    critThickness: mix(a.critThickness, b.critThickness),
    voidCenters: a.voidCenters.map((c, i) => ({
      x: mix(c.x, b.voidCenters[i]?.x ?? c.x),
      y: mix(c.y, b.voidCenters[i]?.y ?? c.y),
    })),
  };
}
