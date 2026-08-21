/**
 * resolution.ts — LA CATENA ESITO-PRIMA. Modulo puro. PLAN-008 T-002/003/004/005.
 *
 * L'ordine è quello del modello del Director, e oggi nella V7 è invertito:
 *
 *   1. si tirano ENTRAMBI i D100, prima di qualunque disegno;
 *   2. dalla COPPIA (esito, rischio) si ricava l'insieme richiesto:
 *      regione(esito) ∩ zona(rischio) — INTERSEZIONE, non evitamento. Se l'esito
 *      è `almost + ferita` deve ESISTERE un punto dove la ferita tocca l'almost;
 *   3. si verifica che quell'insieme esista PRIMA di animare; se non esiste si
 *      cambia la geometria — non si riestrae il tiro;
 *   4. si sceglie il punto dentro l'insieme;
 *   5. la traiettoria viene SINTETIZZATA per terminare su quel punto: tiro unico;
 *   6. `regionAt(endpoint)` è un'ASSERZIONE, non la fonte della verità.
 *
 * Cosa faceva la V7 invece: `cfg.mode='random'` per default, quindi nessun
 * bersaglio e nessun magnetismo — la pallina rimbalzava e `spatialVerdict`
 * LEGGEVA dove era finita. E con un esito forzato, `resolve()` sovrascriveva il
 * verdetto a prescindere da dove la pallina si era fermata: la carta poteva dire
 * ROVINA con la pallina su un petalo.
 */

import {
  REGION_IDS,
  ZONE_IDS,
  type CellGrid,
  type RegionId,
  type Snapshot,
  type ZoneId,
  buildRegionGrid,
  buildZoneLayer,
  createRng,
  regionAt,
  rWallAt,
  withRiskPhase,
  zoneAt,
} from './zones';

/* TAU non serve piu qui: le funzioni angolari vivono in zones.ts */

export interface Point {
  x: number;
  y: number;
}

/* ── T-002: le bande del D100, lette dalle aree ───────────────────────────── */

export interface Band {
  region: RegionId;
  /** primo e ultimo valore del D100 assegnati alla regione (inclusivi) */
  from: number;
  to: number;
}

/**
 * L'ordine sul D100 è MONOTONO dal peggio al meglio, e non è una scelta
 * estetica: il Director ha fissato che «da 01 a 05 è sempre fallimento», quindi
 * il fallimento critico deve occupare i numeri BASSI. Da lì la scala sale, e il
 * trionfo prende la fetta alta.
 */
const LADDER: RegionId[] = ['critFail', 'fail', 'almost', 'win', 'critWin'];

/**
 * Bande dalle AREE, in una direzione sola (invariante di PLAN-008): la geometria
 * è primaria, le aree si misurano dalla geometria, le bande si leggono dalle
 * aree. Niente qui torna a scrivere sulla geometria per far quadrare una banda.
 *
 * L'arrotondamento distribuisce il resto sulle bande più grandi, così la somma
 * è esattamente 100 valori del D100 senza spostare le proporzioni percepibili.
 * Una banda a zero è legittima: `almost` collassa quando la stella riempie
 * l'arena, e in quel caso non deve essere estraibile.
 */
export function bandsFromAreas(s: Snapshot): Band[] {
  const raw = LADDER.map((region) => ({ region, want: s.areas[region] }));
  const floors = raw.map((r) => ({ ...r, n: Math.floor(r.want) }));
  let left = 100 - floors.reduce((x, r) => x + r.n, 0);
  /* il resto va a chi ha la parte frazionaria più alta: minimizza lo scarto */
  const order = [...floors]
    .map((r, i) => ({ i, frac: r.want - Math.floor(r.want) }))
    .sort((a, b) => b.frac - a.frac);
  for (const o of order) {
    if (left <= 0) break;
    /* mai risuscitare una banda che la geometria ha azzerato */
    if (floors[o.i].want <= 0) continue;
    floors[o.i].n += 1;
    left -= 1;
  }
  /* se restano valori (tutte le bande a zero: impossibile, ma difensivo) */
  if (left > 0) floors[floors.length - 1].n += left;

  const out: Band[] = [];
  let cur = 1;
  for (const f of floors) {
    if (f.n <= 0) {
      out.push({ region: f.region, from: 0, to: -1 }); // banda vuota, non estraibile
      continue;
    }
    out.push({ region: f.region, from: cur, to: cur + f.n - 1 });
    cur += f.n;
  }
  return out;
}

/** probabilità mostrabile: successo = critWin + win, sempre ≤ 100 − crit */
export function shownSuccessPct(s: Snapshot): number {
  return s.areas.critWin + s.areas.win;
}

/* ── i due dadi ───────────────────────────────────────────────────────────── */

export interface Rolled {
  /** 1..100, primo dado: l'esito */
  roll: number;
  /** 1..100, secondo dado: ferita / morte / niente */
  riskRoll: number;
  region: RegionId;
  zone: ZoneId;
}

/**
 * ENTRAMBI i dadi, subito. Il secondo non dipende dal primo: `P(ferita)` e
 * `P(morte)` vengono dal dado, non dalla geometria — ed è la ragione per cui la
 * forma della crepa può cambiare liberamente senza toccare nessuna probabilità.
 */
export function rollBoth(s: Snapshot, rng: () => number): Rolled {
  const roll = 1 + Math.floor(rng() * 100);
  const riskRoll = 1 + Math.floor(rng() * 100);
  const bands = bandsFromAreas(s);
  const hit = bands.find((b) => b.to >= b.from && roll >= b.from && roll <= b.to);
  const region: RegionId = hit ? hit.region : 'fail';
  const zone: ZoneId =
    riskRoll <= s.config.death
      ? 'death'
      : riskRoll <= s.config.death + s.config.wound
        ? 'wound'
        : 'none';
  return { roll, riskRoll, region, zone };
}

/* ── T-003/T-004: l'insieme richiesto, e come garantirlo ──────────────────── */

export interface LandingResult {
  point: Point;
  /** quante rotazioni rigide sono servite (0 = l'insieme c'era già) */
  repairs: number;
  /** true se si è dovuto rilassare: risale fino al risolutore, mai silenzioso */
  relaxed: boolean;
  /** snapshot effettivo: la riparazione può averne ruotato la geometria del rischio */
  snap: Snapshot;
  /** area dell'insieme da cui il punto è stato estratto (0 = si è rilassato) */
  area: number;
}

/** il punto soddisfa la coppia? È il predicato dell'INTERSEZIONE */
export function satisfies(s: Snapshot, p: Point, want: Rolled): boolean {
  return regionAt(s, p.x, p.y) === want.region && zoneAt(s, p.x, p.y) === want.zone;
}

/**
 * L'insieme richiesto, sulla griglia classificata: indici delle celle che
 * soddisfano la coppia, e la loro area totale.
 *
 * «Esiste» vuol dire AREA POSITIVA: un contatto di bordo o un punto singolo non
 * contano, perché il campionamento non li troverebbe mai.
 */
export function requiredCells(
  g: CellGrid,
  zoneLayer: Uint8Array,
  want: { region: RegionId; zone: ZoneId },
): { idx: number[]; area: number } {
  const ri = REGION_IDS.indexOf(want.region);
  const zi = ZONE_IDS.indexOf(want.zone);
  const idx: number[] = [];
  let area = 0;
  for (let i = 0; i < g.region.length; i += 1) {
    if (g.region[i] === ri && zoneLayer[i] === zi) {
      idx.push(i);
      area += g.area[i];
    }
  }
  return { idx, area };
}

/** area dell'intersezione in unità engine² — 0 significa "non esiste" */
export function intersectionArea(
  s: Snapshot,
  want: { region: RegionId; zone: ZoneId },
  g?: CellGrid,
): number {
  const grid = g ?? buildRegionGrid(s);
  return requiredCells(grid, buildZoneLayer(s, grid), want).area;
}

/** tentativi di raffinamento DENTRO una cella già selezionata */
export const CELL_ATTEMPTS = 24;
/** passo e numero delle rotazioni rigide dello stadio 1 */
export const REPAIR_STEPS = 36;
export const REPAIR_STEP_RAD = (10 * Math.PI) / 180;

/** un punto uniforme dentro la cella i, validato col predicato ESATTO */
function pointInCell(
  s: Snapshot,
  g: CellGrid,
  i: number,
  want: { region: RegionId; zone: ZoneId },
  rng: () => number,
): Point {
  const ia = Math.floor(i / g.radii);
  const ir = i % g.radii;
  const dA = (Math.PI * 2) / g.angles;
  for (let k = 0; k < CELL_ATTEMPTS; k += 1) {
    const a = -Math.PI / 2 + (ia + rng()) * dA;
    const w = rWallAt(s, a);
    const r = (w * (ir + rng())) / g.radii;
    const p = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    if (regionAt(s, p.x, p.y) === want.region && zoneAt(s, p.x, p.y) === want.zone) return p;
  }
  /* il centro della cella: era classificato giusto quando la cella è stata scelta */
  return { x: g.cx[i], y: g.cy[i] };
}

/**
 * Il punto d'atterraggio, col CONTRATTO D'USCITA completo.
 *
 * Stadio 0 — l'insieme richiesto sulla griglia; se ha area positiva si estrae una
 *            cella con probabilità proporzionale all'area, poi un punto dentro la
 *            cella. Uniforme in area, e nessun tentativo sprecato: prima si SA se
 *            l'insieme esiste, poi si campiona.
 * Stadio 1 — RIPARAZIONE RIGIDA: ruota la sola geometria del rischio a passi di
 *            10°. La griglia delle REGIONI non si ricalcola, perché la rotazione
 *            non la tocca: è questo che rende la conservazione della misura una
 *            proprietà strutturale e non una speranza.
 * Stadio 2 — RILASSAMENTO (decisione del Director): si mantiene vera SOLO la
 *            verità primaria successo/fallimento — «mai mentire sull\'esito del
 *            check» — e si segnala con `relaxed`. Il ciclo esce sempre.
 */
export function pickLanding(s0: Snapshot, want: Rolled, rng: () => number): LandingResult {
  const grid = buildRegionGrid(s0);

  const pickFrom = (s: Snapshot, cells: { idx: number[]; area: number }): Point | null => {
    if (cells.area <= 0 || cells.idx.length === 0) return null;
    let t = rng() * cells.area;
    for (const i of cells.idx) {
      t -= grid.area[i];
      if (t <= 0) return pointInCell(s, grid, i, want, rng);
    }
    return pointInCell(s, grid, cells.idx[cells.idx.length - 1], want, rng);
  };

  let cells = requiredCells(grid, buildZoneLayer(s0, grid), want);
  let hit = pickFrom(s0, cells);
  if (hit) return { point: hit, repairs: 0, relaxed: false, snap: s0, area: cells.area };

  for (let k = 1; k <= REPAIR_STEPS; k += 1) {
    const s = withRiskPhase(s0, s0.riskPhase + k * REPAIR_STEP_RAD);
    cells = requiredCells(grid, buildZoneLayer(s, grid), want);
    hit = pickFrom(s, cells);
    if (hit) return { point: hit, repairs: k, relaxed: false, snap: s, area: cells.area };
  }

  const wantSuccess = isSuccess(want.region);
  const pool: number[] = [];
  let poolArea = 0;
  for (let i = 0; i < grid.region.length; i += 1) {
    if (isSuccess(REGION_IDS[grid.region[i]]) === wantSuccess) {
      pool.push(i);
      poolArea += grid.area[i];
    }
  }
  if (poolArea > 0) {
    let t = rng() * poolArea;
    for (const i of pool) {
      t -= grid.area[i];
      if (t <= 0) {
        return { point: { x: grid.cx[i], y: grid.cy[i] }, repairs: REPAIR_STEPS,
                 relaxed: true, snap: s0, area: poolArea };
      }
    }
  }
  return { point: { x: 0, y: 0 }, repairs: REPAIR_STEPS, relaxed: true, snap: s0, area: 0 };
}

/* ── T-005: la traiettoria che TERMINA sul punto ──────────────────────────── */

export interface Trajectory {
  points: Point[];
  endpoint: Point;
  durationMs: number;
  /** dove la pallina ha esitato: serve alla messa in scena, e ai test */
  teasedAt: Point | null;
}

/**
 * Traiettoria SINTETIZZATA, non simulata: si costruisce un percorso caotico
 * credibile e poi si CHIUDE sul punto d'atterraggio.
 *
 * Perché non una fisica con magnetismo: il magnetismo non garantisce l'arrivo —
 * attriti, rimbalzi caotici e la condizione di stop possono lasciare la pallina
 * altrove, e allora la carta e il board si contraddicono. Qui l'ultimo campione
 * È il punto, per costruzione.
 *
 * T-005 non può CORREGGERE il punto: lo farebbe diventare una seconda
 * risoluzione dell'esito. Il punto arriva già valido da `pickLanding`.
 */
/**
 * Il punto di ESITAZIONE: sul confine vero fra la regione dell'esito e la sua
 * vicina, vicino all'atterraggio.
 *
 * Non «a cavallo fra due zone qualsiasi»: fra la regione VERA e quella
 * immediatamente adiacente, perché il quasi-successo negato e il quasi-fallimento
 * scampato sono due emozioni diverse, e quale mostrare è la regia del singolo
 * tiro. Si può fare solo perché l'esito è deciso PRIMA: su una fisica simulata
 * non si sa dove sarà il confine da sfiorare.
 */
export function teasePoint(s: Snapshot, landing: Point, want: RegionId): Point | null {
  const a = Math.atan2(landing.y, landing.x);
  const d0 = Math.hypot(landing.x, landing.y);
  const wall = rWallAt(s, a);
  const at = (d: number) => ({ x: Math.cos(a) * d, y: Math.sin(a) * d });
  const isWant = (d: number) => {
    const p = at(d);
    return regionAt(s, p.x, p.y) === want;
  };
  if (!isWant(d0)) return null;

  /* cammino lungo il raggio nei due versi e tengo il PRIMO cambio di regione:
     dIn è l'ultimo raggio ancora dentro, dOut il primo fuori. */
  const STEP = wall / 240;
  let best: { dIn: number; dOut: number; dist: number } | null = null;
  for (const dir of [1, -1]) {
    let dIn = d0;
    for (let k = 1; k <= 260; k += 1) {
      const d = d0 + dir * k * STEP;
      if (d <= 2 || d >= wall - 1) break;
      if (isWant(d)) {
        dIn = d;
        continue;
      }
      const dist = Math.abs(dIn - d0);
      if (!best || dist < best.dist) best = { dIn, dOut: d, dist };
      break;
    }
  }
  if (!best) return null;

  /* BISEZIONE fino al confine. Il mezzo passo indietro non bastava: il confine
     può cadere in qualunque punto dell'ultimo passo, e infatti misurato il 55%
     delle esitazioni finiva nella regione SBAGLIATA — cioè il board avrebbe
     mostrato per un istante l'esito che non è. */
  let lo = best.dIn;
  let hi = best.dOut;
  for (let i = 0; i < 24; i += 1) {
    const m = (lo + hi) / 2;
    if (isWant(m)) lo = m;
    else hi = m;
  }
  /* si esita DENTRO, a un soffio dal bordo: il margine è metà del raggio della
     pallina, così il disco non sborda visivamente dalla regione giusta */
  const inward = lo + Math.sign(best.dIn - hi || 1) * 4.5;
  const p = isWant(inward) ? at(inward) : at(lo);

  /* TETTO ALLA DISTANZA — il difetto che il Director ha visto: «la risoluzione
     finale cambia troppo velocemente e si allontana, si vede che stiamo
     cheattando».
     Causa: per un atterraggio in mezzo a una regione grande (win può valere il
     90% dell'arena) il confine più vicino sta anche a 100px, e lo scatto finale
     trascinava la pallina per 100px in 260ms. Nessuna fisica fa quel movimento:
     legge come una mano che la sposta.
     Quindi: si esita solo su un confine RAGGIUNGIBILE con un rotolamento
     credibile. Più lontano di così, meglio nessuna esitazione che una bugia. */
  const dist = Math.hypot(p.x - landing.x, p.y - landing.y);
  return dist <= TEASE_MAX_PX ? p : null;
}

/** oltre questa distanza dall'atterraggio l'esitazione diventa un teletrasporto */
export const TEASE_MAX_PX = 38;

/**
 * Traiettoria SINTETIZZATA in QUATTRO FASI, non simulata.
 *
 *   0.00-0.40  CAOS         velocità alta, rimbalzi secchi sul muro
 *   0.40-0.72  DECELERAZIONE attrito esponenziale, rimbalzi più corti e vicini
 *   0.72-0.90  ESITAZIONE   la pallina indugia sul confine fra la regione
 *                           dell'esito e la vicina: è il beat del gioco
 *                           d'azzardo, e l'unico che crea tensione
 *   0.90-1.00  SCATTO       micro-scatto magnetico dentro la regione vera
 *
 * Perché non una fisica con magnetismo: il magnetismo non garantisce l'arrivo —
 * attriti, rimbalzi caotici e la condizione di stop possono lasciare la pallina
 * altrove, e allora la carta e il board si contraddicono. Qui l'ultimo campione
 * È il punto, per costruzione.
 *
 * T-005 non può CORREGGERE il punto: lo farebbe diventare una seconda
 * risoluzione dell'esito. Il punto arriva già valido da `pickLanding`.
 */
export const TEASE_FROM = 0.66;
export const TEASE_TO = 0.88;

export function synthesizeTrajectory(
  s: Snapshot,
  landing: Point,
  seed: number,
  want: RegionId = 'win',
  durationMs = 2600,
): Trajectory {
  const rng = createRng(seed);
  const dt = 1000 / 120;
  const steps = Math.max(48, Math.round(durationMs / dt));
  const pts: Point[] = [];
  const tease = teasePoint(s, landing, want);

  const base = Math.atan2(landing.y, landing.x);
  let ang = base + (rng() * 2 - 1) * Math.PI * 0.85;
  let sp = 30 + rng() * 8;
  let x = 0;
  let y = 0;
  /* il punto da cui parte l'assestamento: fissato al primo frame della fase, o
     l'interpolazione inseguirebbe un bersaglio che si muove */
  let settleFrom: Point | null = null;

  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);

    /* attrito per fase: piatto nel caos, esponenziale in decelerazione */
    const fric = t < 0.4 ? 0.9985 : Math.pow(0.955, 1 + (t - 0.4) * 3);
    sp *= fric;
    x += Math.cos(ang) * sp;
    y += Math.sin(ang) * sp;

    /* LA CONCA. Dalla decelerazione in poi il board si comporta come una
       superficie che pende verso il punto: un'attrazione debole e crescente.
       Serve perché senza di lei la fisica si fermava DOVE CAPITAVA e
       l'assestamento finale doveva trascinare la pallina per l'intera arena —
       misurato fino a 27px per frame, ed è esattamente il «si vede che stiamo
       cheattando» del Director. Con la conca, all'inizio dell'assestamento la
       pallina è già a una decina di pixel: il rotolamento finale è vero.
       Non è la fisica a garantire l'arrivo — quello lo garantisce la
       costruzione — è la fisica a renderlo credibile. */
    if (t > 0.34) {
      const target = tease ?? landing;
      const mag = 0.012 + 0.075 * ((t - 0.34) / 0.66);
      x += (target.x - x) * mag;
      y += (target.y - y) * mag;
    }

    /* rimbalzo NON speculare: nessun percorso a specchio, e il muro è quello
       vero — la pallina rimbalza sulla stessa funzione che il board disegna */
    const d = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const edge = rWallAt(s, a) - 9;
    if (d > edge) {
      const nx = x / d;
      const ny = y / d;
      x = nx * edge;
      y = ny * edge;
      const dot = Math.cos(ang) * nx + Math.sin(ang) * ny;
      ang = Math.atan2(Math.sin(ang) - 2 * dot * ny, Math.cos(ang) - 2 * dot * nx)
        + (rng() * 2 - 1) * 0.55;
      sp *= 0.9;
    }

    /* ESITAZIONE: la pallina converge sul confine e ci RESTA, con un tremolio
       che si spegne. Non è un rallentamento generico: è la pallina che sta *su*
       una decisione. */
    if (tease && t > TEASE_FROM && t <= TEASE_TO) {
      const k = (t - TEASE_FROM) / (TEASE_TO - TEASE_FROM);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const jx = (rng() - 0.5) * 1.4 * (1 - e * 0.85);
      const jy = (rng() - 0.5) * 1.4 * (1 - e * 0.85);
      x = x * (1 - e) + (tease.x + jx) * e;
      y = y * (1 - e) + (tease.y + jy) * e;
      /* la velocità va spenta o il tratto successivo eredita uno scatto */
      sp *= 0.82;
    }
    /* ASSESTAMENTO: dall'esitazione (o da dove si è fermata) all'atterraggio, in
       linea retta e in DECELERAZIONE, senza fisica addosso. È un rotolamento in
       una conca, non uno spostamento: dura il 12% della durata su una distanza
       di al più TEASE_MAX_PX, cioè una velocità plausibile.
       Prima erano 100px in 260ms con la fisica ancora attiva: si vedeva. */
    if (t > TEASE_TO) {
      const k = (t - TEASE_TO) / (1 - TEASE_TO);
      const e = 1 - Math.pow(1 - k, 2.2);
      const from = settleFrom ?? (settleFrom = { x, y });
      x = from.x + (landing.x - from.x) * e;
      y = from.y + (landing.y - from.y) * e;
      sp = 0;
    }
    pts.push({ x, y });
  }
  pts[pts.length - 1] = { x: landing.x, y: landing.y };
  return { points: pts, endpoint: pts[pts.length - 1], durationMs, teasedAt: tease };
}

/* ── la catena completa ───────────────────────────────────────────────────── */

export interface Resolved {
  rolled: Rolled;
  landing: Point;
  repairs: number;
  relaxed: boolean;
  snap: Snapshot;
  trajectory: Trajectory;
  /** l'asserzione: la regione del punto d'arrivo coincide con quella estratta? */
  verified: boolean;
}

export function resolveCheck(s: Snapshot, seed: number): Resolved {
  const rng = createRng(seed);
  const rolled = rollBoth(s, rng);
  const { point, repairs, relaxed, snap } = pickLanding(s, rolled, rng);
  /* seed della traiettoria salato: non consuma dallo stream dei dadi, o un
     campione in più cambierebbe TUTTI gli esiti a parità di seed */
  const trajectory = synthesizeTrajectory(snap, point, (seed ^ 0x9e3779b9) >>> 0, rolled.region);
  const end = trajectory.endpoint;
  const verified = relaxed
    ? isSuccess(regionAt(snap, end.x, end.y)) === isSuccess(rolled.region)
    : regionAt(snap, end.x, end.y) === rolled.region &&
      zoneAt(snap, end.x, end.y) === rolled.zone;
  return { rolled, landing: point, repairs, relaxed, snap, trajectory, verified };
}

export const isSuccess = (r: RegionId): boolean => r === 'win' || r === 'critWin';

/** tutte le coppie estraibili: serve ai test per coprirle tutte */
export function rollablePairs(s: Snapshot): { region: RegionId; zone: ZoneId }[] {
  const bands = bandsFromAreas(s);
  const zones: ZoneId[] = [];
  if (s.config.death > 0) zones.push('death');
  if (s.config.wound > 0) zones.push('wound');
  if (s.config.death + s.config.wound < 100) zones.push('none');
  const out: { region: RegionId; zone: ZoneId }[] = [];
  for (const b of bands) {
    if (b.to < b.from) continue; // banda azzerata dalla geometria
    for (const z of zones) out.push({ region: b.region, zone: z });
  }
  return out;
}

export { REGION_IDS };
