/**
 * zones.ts — LA PARTIZIONE DELLO SKILL CHECK. Modulo puro: nessun DOM, nessun
 * canvas, deterministico. PLAN-008 T-001.
 *
 * DUE ASSI, NON UNO. È la correzione strutturale che questo file porta.
 *
 * Nella V7 `spatialVerdict` metteva in una sola catena di `if` cose che vengono
 * da DUE dadi diversi: l'esito (successo/almost/fallimento/critico) dal primo
 * D100, la ferita e la morte dal secondo. Messe in fila, la banda con lo
 * spessore maggiore mangiava le altre — misurato: la fascia ferita è 23.3px
 * verso l'interno, quella critica 4.9px, la seconda è CONTENUTA nella prima ed
 * era testata dopo, quindi il fallimento critico era **inarrivabile per
 * posizione** con qualunque bersaglio.
 *
 * Qui i due assi sono separati:
 *   REGIONE (dal 1° dado) — critWin | win | almost | fail | critFail
 *                           partizione completa dell'arena
 *   ZONA    (dal 2° dado) — none | wound | death
 *                           partizione completa dell'arena, indipendente
 * Un punto d'atterraggio valido sta nell'INTERSEZIONE di una regione e di una
 * zona. Non c'è più contenimento da ridefinire: il problema si dissolve, perché
 * le due cose non erano in competizione — erano su assi ortogonali.
 *
 * INVARIANTE DI DIREZIONE (PLAN-008): la geometria è primaria, le aree si
 * misurano dalla geometria, le bande del D100 si leggono dalle aree. Niente in
 * questo file scrive verso la geometria per far tornare una banda.
 */

const TAU = Math.PI * 2;

/** raggio del board in unità engine — la V7 lavora in questa scala */
export const R = 362;
export const AXES = 5;
/**
 * Offset della scala dei valori. NON è la regione di trionfo: sta dentro `rOf`,
 * quindi regge la mappatura di TUTTI i valori sul raggio. Cambiarlo sposta le
 * punte della stella, il muro dell'arena e la calibrazione della parità.
 */
export const R_CORE = Math.max(30, R * 0.12);
/**
 * Profondità delle valli della stella. COSTANTE TARATA: a questo valore la
 * parità (stat == difficoltà) copre esattamente il 50% dell'area dell'arena, e
 * la proprietà è scale-invariant. Non si tocca senza rifare la taratura.
 */
export const VALLEY_F = 0.3675;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** valore 1..99 -> raggio */
export const rOf = (v: number): number =>
  R_CORE + (clamp(v, 1, 99) / 100) * (R - 22 - R_CORE);

/** angolo della punta i (asse i) */
export const tipAngle = (i: number): number => -Math.PI / 2 + i * (TAU / AXES);

export interface SkillInput {
  /** stat del PG per ciascun asse */
  stats: number[];
  /** difficoltà della prova per ciascun asse */
  diffs: number[];
}

export interface CheckConfig {
  /** fallimento critico: % dell'area dell'ARENA (tutti gli esiti) */
  crit: number;
  /** successo critico: % dell'area di SUCCESSO (stella ∩ arena) */
  critWin: number;
  /**
   * "per un soffio": % dell'area dell'arena, misurata verso l'interno dal bordo
   * della stella. FRAZIONE D'AREA e non pixel fissi (PLAN-008 T-001): con
   * `ALMOST_W = 16` la banda valeva una frazione diversa a ogni difficoltà.
   * PUÒ COLLASSARE A ZERO ed è ammissibile — il Director: «almost non è
   * garantito, può stare fuori da quell'area».
   */
  almost: number;
  /** morte: probabilità del 2° dado, e dimensione della zona voragine */
  death: number;
  /** ferita: probabilità del 2° dado, e spessore della corona */
  wound: number;
}

export const DEFAULT_CHECK_CONFIG: CheckConfig = {
  crit: 5,
  critWin: 5,
  almost: 5,
  death: 5,
  wound: 10,
};

export type RegionId = 'critWin' | 'win' | 'almost' | 'fail' | 'critFail';
export type ZoneId = 'none' | 'wound' | 'death';

export const REGION_IDS: RegionId[] = ['critWin', 'win', 'almost', 'fail', 'critFail'];
export const ZONE_IDS: ZoneId[] = ['none', 'wound', 'death'];

export interface Snapshot {
  input: SkillInput;
  config: CheckConfig;
  /** raggio della punta della stella per asse = rOf(stat) — INVARIANTE */
  axisTip: number[];
  /** raggio del muro dell'arena per asse = rOf(difficoltà) */
  axisCheck: number[];
  /** raggio del disco di trionfo: critWin% dell'area di successo */
  rCrit: number;
  /** fattore radiale della fascia critica: r > muro*kEpic => critFail */
  kEpic: number;
  /** frazione dell'arena occupata dalla fascia almost (0..1) */
  fAlmost: number;
  /** semi-spessore della corona ferita, centrata sul bordo della stella */
  woundHalf: number;
  /** raggio dei dischi voragine, uno per valle */
  voidRadius: number;
  /** centri delle voragini, a cavallo del bordo stella nelle valli */
  voidCenters: { x: number; y: number }[];
  /** fase della geometria del rischio: è la sola manopola RIGIDA della riparazione */
  riskPhase: number;
  /** aree misurate (in % dell'arena) — la fonte delle bande del D100 */
  areas: Record<RegionId, number>;
  /** area di successo (stella ∩ arena) in unità engine² */
  successArea: number;
  /** area dell'arena in unità engine² */
  arenaArea: number;
}

/* ── funzioni radiali ─────────────────────────────────────────────────────── */

/**
 * Deformazione organica del muro. Ampiezza piccola per costruzione: con lobi
 * grossi l'arena si gonfiava fra gli obelischi e la stella, ancorata alle punte,
 * non poteva coprire più del ~73% dell'arena, rendendo impossibili le
 * probabilità alte.
 */
const blob = (theta: number): number =>
  1 +
  0.035 * Math.sin(theta * 3 + 0.7) +
  0.022 * Math.sin(theta * 5 - 1.3) +
  0.014 * Math.sin(theta * 7 + 2.1);

/** raggio della stella all'angolo theta: le punte cadono esattamente su axisTip */
export function rStarAt(s: Snapshot, theta: number): number {
  const t = (((theta + Math.PI / 2) % TAU) + TAU) % TAU;
  const seg = TAU / (AXES * 2);
  const k = Math.floor(t / seg);
  const f = (t - k * seg) / seg;
  const tip = (i: number) => s.axisTip[((i % AXES) + AXES) % AXES];
  if (k % 2 === 0) {
    const a = tip(k / 2);
    const b = Math.min(tip(k / 2), tip(k / 2 + 1)) * VALLEY_F;
    return a + (b - a) * f;
  }
  const b = tip((k + 1) / 2);
  const a = Math.min(tip((k - 1) / 2), tip((k + 1) / 2)) * VALLEY_F;
  return a + (b - a) * f;
}

/** raggio del muro dell'arena all'angolo theta — il confine FISICO della pallina */
export function rWallAt(s: Snapshot, theta: number): number {
  const t = (((theta + Math.PI / 2) % TAU) + TAU) % TAU;
  const seg = TAU / AXES;
  const k = Math.floor(t / seg);
  const f = (t - k * seg) / seg;
  const sm = f * f * (3 - 2 * f);
  const r0 = s.axisCheck[k % AXES];
  const r1 = s.axisCheck[(k + 1) % AXES];
  return Math.max(R_CORE + 30, (r0 + (r1 - r0) * sm) * blob(theta));
}

/** angolo della valle fra la punta i e la punta i+1 */
export const valleyAngle = (i: number): number => tipAngle(i) + Math.PI / AXES;

/* ── i due assi ───────────────────────────────────────────────────────────── */

/**
 * REGIONE di un punto: dal PRIMO dado. Partizione completa dell'arena.
 *
 * L'ordine è RADIALE e non un ordine di `if` arbitrario: dal muro verso il
 * centro, ogni soglia è geometrica, quindi ogni punto cade in una e una sola
 * regione per costruzione.
 *
 * Il BORDO HA PRIORITÀ SULLA STELLA — decisione del Director: «epicFail è
 * semplicemente il bordo come sempre». La tela sta sopra il fiore, quindi il
 * bordo non viene mai coperto: di conseguenza la fascia critica vale `crit`% a
 * ogni combinazione, anche quando la stella sfonda l'arena. È anche la ragione
 * per cui il massimo successo mostrabile è 100 − crit.
 */
export function regionAt(s: Snapshot, x: number, y: number): RegionId {
  const d = Math.hypot(x, y);
  const a = Math.atan2(y, x);
  const wall = rWallAt(s, a);
  if (d > wall) return 'critFail'; // fuori dal muro non si atterra: clamp difensivo
  if (d > wall * s.kEpic) return 'critFail';
  const star = Math.min(rStarAt(s, a), wall * s.kEpic);
  if (d <= s.rCrit) return 'critWin';
  if (d <= star) return 'win';
  const almostOut = Math.sqrt(star * star + s.fAlmost * wall * wall);
  if (d <= Math.min(almostOut, wall * s.kEpic)) return 'almost';
  return 'fail';
}

/**
 * ZONA di un punto: dal SECONDO dado. Partizione completa dell'arena,
 * indipendente dalla regione.
 *
 * La geometria è quella della V5: la CORONA è una banda centrata sul bordo
 * della stella (la ferita arriva dove il successo finisce), le VORAGINI sono
 * dischi nelle valli a cavallo del bordo (la morte si apre dove la stella è più
 * debole). `riskPhase` le ruota tutte insieme: è una trasformazione RIGIDA, la
 * sola ammessa dalla riparazione.
 */
export function zoneAt(s: Snapshot, x: number, y: number): ZoneId {
  for (const c of s.voidCenters) {
    if (Math.hypot(x - c.x, y - c.y) <= s.voidRadius) return 'death';
  }
  const d = Math.hypot(x, y);
  const a = Math.atan2(y, x);
  const star = rStarAt(s, a);
  if (Math.abs(d - star) <= s.woundHalf) return 'wound';
  return 'none';
}

/* ── costruzione dello snapshot ───────────────────────────────────────────── */

/** integrale polare di un raggio: area racchiusa */
function polarArea(f: (a: number) => number, steps = 2880): number {
  let A = 0;
  const dA = TAU / steps;
  for (let i = 0; i < steps; i += 1) {
    const r = f(-Math.PI / 2 + i * dA);
    A += 0.5 * r * r * dA;
  }
  return A;
}

/**
 * GRIGLIA POLARE — parametro DICHIARATO, era nascosto (critica del protocollo
 * multi-AI). Le aree e i campionamenti si misurano su questa risoluzione, e il
 * test di convergenza verifica che raddoppiandola le aree restino entro 0.02
 * punti percentuali.
 */
export const GRID_ANGLES = 720;
export const GRID_RADII = 240;

/**
 * Aree delle regioni in % dell'arena.
 *
 * INTEGRAZIONE RADIALE IN FORMA CHIUSA. Prima campionavo anche il raggio a
 * celle, e la fascia critica misurava 4.937% invece di 5.000%: un bias di
 * discretizzazione, non un errore di geometria — la banda è spessa il 2.5% del
 * raggio, quindi con 240 celle radiali il suo confine cade a metà cella e la
 * cella intera finisce da un lato.
 *
 * Per un angolo fissato le soglie sono raggi noti, quindi l'area di ogni
 * regione è un settore anulare esatto ½(r₂²−r₁²)dθ. Resta solo la
 * discretizzazione ANGOLARE, che converge molto più in fretta (misurato: 0.006
 * punti raddoppiando).
 */
export function measureRegionAreas(
  s: Snapshot,
  angles = GRID_ANGLES,
  _radii = GRID_RADII,
): Record<RegionId, number> {
  const acc: Record<string, number> = {};
  for (const k of REGION_IDS) acc[k] = 0;
  let tot = 0;
  const dA = TAU / angles;
  const ring = (r0: number, r1: number) => 0.5 * (r1 * r1 - r0 * r0) * dA;
  for (let i = 0; i < angles; i += 1) {
    const a = -Math.PI / 2 + (i + 0.5) * dA;
    const wall = rWallAt(s, a);
    const epicIn = wall * s.kEpic;
    const star = Math.min(rStarAt(s, a), epicIn);
    const almostOut = Math.min(Math.sqrt(star * star + s.fAlmost * wall * wall), epicIn);
    const c1 = clamp(s.rCrit, 0, epicIn);
    const c2 = clamp(star, c1, epicIn);
    const c3 = clamp(almostOut, c2, epicIn);
    acc.critWin += ring(0, c1);
    acc.win += ring(c1, c2);
    acc.almost += ring(c2, c3);
    acc.fail += ring(c3, epicIn);
    acc.critFail += ring(epicIn, wall);
    tot += ring(0, wall);
  }
  const out = {} as Record<RegionId, number>;
  for (const k of REGION_IDS) out[k] = tot > 0 ? (100 * acc[k]) / tot : 0;
  return out;
}

/**
 * Costruisce lo snapshot: geometria, poi soglie derivate, poi aree misurate.
 * L'ordine è quello dell'invariante di direzione e non è negoziabile — le aree
 * sono un OUTPUT, mai un input.
 */
export function buildSnapshot(
  input: SkillInput,
  config: CheckConfig = DEFAULT_CHECK_CONFIG,
  riskPhase = 0,
): Snapshot {
  const n = Math.max(1, Math.min(AXES, input.stats.length));
  const stats = Array.from({ length: AXES }, (_, i) => input.stats[i % n]);
  const diffs = Array.from({ length: AXES }, (_, i) => input.diffs[i % n]);
  const axisTip = stats.map(rOf);
  const axisCheck = diffs.map(rOf);

  /* soglia della fascia critica: l'area di un anello vale crit% quando
     1 - (soglia/muro)² = crit/100. Uno SPESSORE FISSO non può garantire
     un'area su un raggio variabile — era il difetto di `epicW`, misurato al
     31.9% dell'area a difficoltà 20 e al 10.4% a 99 invece del 5%. */
  const kEpic = Math.sqrt(Math.max(0, 1 - clamp(config.crit, 0, 100) / 100));
  /* la fascia almost deve valere `almost`% dell'ARENA. Per angolo:
       almostOut = sqrt(star² + (almost/100)·muro²)
     perché l'area aggiunta è ½(almostOut² − star²)dθ = ½·(almost/100)·muro²·dθ,
     che integrata dà esattamente `almost`% dell'area dell'arena. Dove lo spazio
     fino alla fascia critica non basta, la banda si tronca e può collassare a
     zero — ammesso: «almost non è garantito». */
  const fAlmost = clamp(config.almost, 0, 100) / 100;

  const base: Snapshot = {
    input: { stats, diffs },
    config,
    axisTip,
    axisCheck,
    rCrit: 0,
    kEpic,
    fAlmost,
    woundHalf: 0,
    voidRadius: 0,
    voidCenters: [],
    riskPhase,
    areas: { critWin: 0, win: 0, almost: 0, fail: 0, critFail: 0 },
    successArea: 0,
    arenaArea: 0,
  };

  base.arenaArea = polarArea((a) => rWallAt(base, a));
  /* area di successo = stella ∩ arena, tagliata anche dalla fascia critica che
     ha priorità: è la stessa quantità che `regionAt` chiama critWin+win */
  base.successArea = polarArea((a) =>
    Math.min(rStarAt(base, a), rWallAt(base, a) * kEpic),
  );

  /* TRIONFO = critWin% dell'area di SUCCESSO (non dell'arena, non dell'unione):
     è la sola normalizzazione definita su tutto il dominio. Sull'arena il disco
     richiesto non entra nella stella a 30/80 (63px contro una valle da 49) né a
     1/99 (75 contro 17); sull'unione il denominatore include le punte fuori
     dall'arena, dove la pallina non arriva mai. */
  const valley = Math.max(9, Math.min(...axisTip) * VALLEY_F);
  base.rCrit = clamp(
    Math.sqrt((clamp(config.critWin, 0, 100) / 100 * base.successArea) / Math.PI),
    6,
    valley,
  );

  /* geometria del rischio (T-007a): corona sul bordo stella, voragini nelle
     valli. Dimensionate in proporzione alla scala della prova, non in pixel. */
  const meanStar = Math.sqrt(base.successArea / Math.PI);
  base.woundHalf = meanStar * clamp(config.wound, 0, 100) * 0.006;
  base.voidRadius = meanStar * clamp(config.death, 0, 100) * 0.045;
  base.voidCenters = Array.from({ length: AXES }, (_, i) => {
    const a = valleyAngle(i) + riskPhase;
    const r = rStarAt(base, a);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });

  base.areas = measureRegionAreas(base);
  return base;
}

/** ruota SOLO la geometria del rischio: trasformazione rigida, aree invariate */
export function withRiskPhase(s: Snapshot, riskPhase: number): Snapshot {
  const next: Snapshot = { ...s, riskPhase, voidCenters: [] };
  next.voidCenters = Array.from({ length: AXES }, (_, i) => {
    const a = valleyAngle(i) + riskPhase;
    const r = rStarAt(next, a);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
  return next;
}

/** un punto uniforme nell'arena, per il campionamento a rifiuto */
export function samplePointInArena(s: Snapshot, rnd: () => number): { x: number; y: number } {
  const a = -Math.PI / 2 + rnd() * TAU;
  const w = rWallAt(s, a);
  /* sqrt: uniforme in AREA, non in raggio — senza, il centro sarebbe
     sovracampionato e il trionfo capiterebbe più spesso del suo 5% */
  const r = w * Math.sqrt(rnd());
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

/** PRNG deterministico: gli stessi dadi e lo stesso atterraggio a ogni replay */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── GRIGLIA CLASSIFICATA ─────────────────────────────────────────────────────
   Il campionamento a rifiuto cieco non basta: una coppia con intersezione vuota
   costa 12.000 tentativi per SCOPRIRE che è vuota, e con 36 rotazioni sono
   432.000 campioni buttati prima di rilassare. Misurato: il verificatore non
   terminava.

   Quindi la griglia polare viene CLASSIFICATA una volta, e da lì esistenza, area
   e campionamento uniforme diventano letture di array. La griglia non sostituisce
   i predicati esatti: li CAMPIONA — ogni cella è classificata chiamando
   `regionAt`/`zoneAt` sul suo centro, e il punto estratto viene comunque
   validato col predicato esatto.

   La griglia delle REGIONI non dipende dalla fase del rischio, quindi la
   riparazione ricalcola solo quella delle ZONE: è ciò che rende le 36 rotazioni
   praticabili. */
export interface CellGrid {
  angles: number;
  radii: number;
  /** indice in REGION_IDS per ogni cella */
  region: Uint8Array;
  /** area della cella in unità engine² */
  area: Float64Array;
  /** centro della cella */
  cx: Float64Array;
  cy: Float64Array;
}

export function buildRegionGrid(s: Snapshot, angles = 360, radii = 120): CellGrid {
  const n = angles * radii;
  const g: CellGrid = {
    angles,
    radii,
    region: new Uint8Array(n),
    area: new Float64Array(n),
    cx: new Float64Array(n),
    cy: new Float64Array(n),
  };
  const dA = TAU / angles;
  for (let ia = 0; ia < angles; ia += 1) {
    const a = -Math.PI / 2 + (ia + 0.5) * dA;
    const w = rWallAt(s, a);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let ir = 0; ir < radii; ir += 1) {
      const r0 = (w * ir) / radii;
      const r1 = (w * (ir + 1)) / radii;
      const rm = (r0 + r1) / 2;
      const i = ia * radii + ir;
      const x = ca * rm;
      const y = sa * rm;
      g.cx[i] = x;
      g.cy[i] = y;
      g.area[i] = 0.5 * (r1 * r1 - r0 * r0) * dA;
      g.region[i] = REGION_IDS.indexOf(regionAt(s, x, y));
    }
  }
  return g;
}

/** zone della stessa griglia: dipende da `riskPhase`, quindi si ricalcola sola */
export function buildZoneLayer(s: Snapshot, g: CellGrid): Uint8Array {
  const out = new Uint8Array(g.region.length);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = ZONE_IDS.indexOf(zoneAt(s, g.cx[i], g.cy[i]));
  }
  return out;
}
