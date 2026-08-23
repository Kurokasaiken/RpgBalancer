/**
 * coverage.ts — LA COPERTURA. Desiderata v15, PLAN-009 T-002/T-003.
 *
 *     la stella = il personaggio      (punte a rOf(stat), una per skill)
 *     la trama  = la difficolta       (rOf(difficolta) per asse, la materia sotto)
 *     la prova  = quanto resta scoperto
 *
 * `P(successo) = area(trama INTERSEZIONE stella) / area(trama)`, MISURATA.
 *
 * Qui non c'e' nessuna manopola. E' la differenza con la corolla, che risolveva
 * `bodyMix`/`bodyScale` per far combaciare l'area con una probabilita' decisa
 * altrove: quella era una forma adattata a un numero. La v15 rovescia la
 * direzione — le due forme vengono dai dati e il numero e' la sottrazione — e
 * per questo il modulo non espone nessun solver.
 *
 * L'unica costante del mondo e' `VALLEY_F`: quanto scende la stella fra due
 * punte, cioe' quanto vali fuori dalle tue skill. E' tarata perche' a parita'
 * (stat == difficolta') la copertura sia esattamente il 50%.
 */

import { AXES, rWallAt, type Snapshot, type SkillInput, type CheckConfig,
         VALLEY_F, DEFAULT_CHECK_CONFIG, buildSnapshot } from './zones';

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * La stella del PERSONAGGIO: punte a `rOf(stat_i)`, fianchi retti fino al
 * fondovalle. Nessuna scala, nessun `bodyMix`: se una punta esce dalla trama,
 * esce — la parte fuori non copre niente perche' non c'e' niente da coprire.
 */
export function rHeroAt(tips: number[], theta: number, valleyF = VALLEY_F): number {
  const t = (((theta + Math.PI / 2) % TAU) + TAU) % TAU;
  const seg = TAU / (AXES * 2);
  const k = Math.floor(t / seg);
  const f = (t - k * seg) / seg;
  const tip = (i: number) => tips[((i % AXES) + AXES) % AXES];
  if (k % 2 === 0) {
    const a = tip(k / 2);
    const b = Math.min(tip(k / 2), tip(k / 2 + 1)) * valleyF;
    return a + (b - a) * f;
  }
  const b = tip((k + 1) / 2);
  const a = Math.min(tip((k - 1) / 2), tip((k + 1) / 2)) * valleyF;
  return a + (b - a) * f;
}

/* ── LA PUNTA CHE SI ALLUNGA E SI STRINGE ──────────────────────────────────
 * Il sistema della desiderata v14 punto 2, che nella riscrittura della v15 era
 * sparito: la punta cresce con la stat (lo fa gia', sta su `rOf(stat)`) e la
 * valle si STRINGE mentre cresce.
 *
 * `rHeroAt` fa variare la PROFONDITA' su settori fissi da 36 gradi: e' il
 * motivo per cui una stella lunga restava larga e la forma leggeva fiore a
 * qualunque stat. Qui la variabile e' l'AMPIEZZA: la punta occupa `pw` gradi
 * attorno al suo asse, e fuori da `pw` c'e' il fondovalle.
 *
 * L'ampiezza non e' una manopola: e' una FUNZIONE dell'allungamento, cioe' di
 * quanto la punta supera la trama su quel raggio. Sotto la v15 questo si puo'
 * fare senza rompere niente, perche' la copertura e' un OUTPUT — sotto la v14
 * no, e per questo l'avevo accantonato: la restrizione riduce l'area, e la' l'
 * area doveva tornare a un numero deciso prima.
 */
export const PW_MAX = (Math.PI / AXES) * 0.98;   // ~35 gradi: petalo pieno
export const PW_MIN = (Math.PI / AXES) * 0.26;   // ~9 gradi: spillo

/**
 * Ampiezza della punta in funzione dell'allungamento punta/trama.
 *
 * LA SOGLIA E' 1, e non e' una taratura: e' il punto in cui la punta RAGGIUNGE
 * la trama. Prima di quel momento la punta ha ancora materia da coprire e
 * stringerla toglierebbe copertura per niente; dopo, cresce solo in territorio
 * che la prova non chiede, ed e' li' che stringere ha un senso — e' la frase
 * del Director «quando occuperebbe troppo spazio rispetto al goo».
 *
 * Misurato con soglia 0.55 (il primo tentativo): la copertura crollava a 38% a
 * parita' e diventava NON MONOTONA — 37.8 -> 38.7 -> 38.5 — cioe' piu' stat
 * dava meno successo. Con la soglia a 1 la parita' resta intatta perche' li'
 * l'allungamento e' 0.99 e la punta e' ancora piena.
 *
 * La RAMPA e' 1.6 e non 1.2 per lo stesso motivo misurato: con 1.2 restava una
 * inversione di 0.27 punti fra stat 70 e 85, dove lo stringersi mangiava esatta-
 * mente cio' che l'allungarsi guadagnava. Con 1.6 le inversioni sono 0.0000 su
 * tutte e tre le difficolta' provate. Il PLATEAU invece resta, ed e' voluto:
 * salire di stat li' non compra quasi niente, che e' la frase del Director
 * «avere una stat alta non ti da il 100% di vittoria automaticamente».
 */
export function pointWidth(elong: number): number {
  const u = clamp((elong - 1) / 1.6, 0, 1);
  return PW_MAX - (PW_MAX - PW_MIN) * (u * u * (3 - 2 * u));
}

export interface HeroShape {
  tips: number[];
  /** ampiezza per asse, derivata: NON si passa a mano */
  widths: number[];
  valleyF: number;
}

/** costruisce la forma: le ampiezze escono dal rapporto punta/trama, per asse */
export function buildHeroShape(s: Snapshot, valleyF = VALLEY_F): HeroShape {
  const widths = s.axisTip.map((tipR, i) => {
    const a = -Math.PI / 2 + (i * TAU) / AXES;
    const trama = rWallAt(s, a);
    return pointWidth(trama > 0 ? tipR / trama : 1);
  });
  return { tips: s.axisTip, widths, valleyF };
}

/**
 * Il profilo a punte strette. La valle e' PIATTA al fondo: e' li' che la
 * materia scura si vede per tutta la sua lunghezza, ed e' il motivo per cui
 * stringere rende il fallimento leggibile invece di nasconderlo.
 */
export function rHeroNarrowAt(sh: HeroShape, theta: number): number {
  let best = Infinity;
  let bi = 0;
  for (let i = 0; i < AXES; i += 1) {
    const a = -Math.PI / 2 + (i * TAU) / AXES;
    let d = Math.abs((((theta - a) % TAU) + TAU + Math.PI) % TAU - Math.PI);
    if (d < best) { best = d; bi = i; }
  }
  const tipR = sh.tips[bi];
  /* il fondovalle resta ancorato alla punta MINORE delle due vicine, come nel
     profilo storico: e' quello che tiene la valle bassa su un asse debole */
  const prev = sh.tips[(bi + AXES - 1) % AXES];
  const next = sh.tips[(bi + 1) % AXES];
  const floor = Math.min(tipR, Math.min(prev, next)) * sh.valleyF;
  const pw = sh.widths[bi];
  if (best >= pw) return floor;
  const u = 1 - best / pw;
  const sm = u * u * (3 - 2 * u);
  return floor + (tipR - floor) * sm;
}

export interface Coverage {
  /** P(successo) in % — area coperta / area della trama */
  pct: number;
  /** area della trama, unita engine^2 */
  tramaArea: number;
  /** area coperta (trama INTERSEZIONE stella) */
  coveredArea: number;
  /** area di stella FUORI dalla trama: talento che la prova non chiede */
  wastedArea: number;
  /** scoperto per asse, in % dell'area del settore dell'asse */
  exposedByAxis: number[];
}

/**
 * Integrazione radiale in FORMA CHIUSA sull'angolo: per ogni raggio angolare il
 * settore vale `r^2/2 * dtheta`, esatto. Il campionamento e' solo sull'angolo,
 * dove le due funzioni sono lineari a tratti — nessun bias di discretizzazione
 * radiale come quello che falsava la banda critica di 0.063 punti.
 */
export function measureCoverage(s: Snapshot, angles = 7200, narrow = false): Coverage {
  const tips = s.axisTip;
  const shape = narrow ? buildHeroShape(s) : null;
  let trama = 0, covered = 0, wasted = 0;
  const perAxisExposed = new Array<number>(AXES).fill(0);
  const perAxisTotal = new Array<number>(AXES).fill(0);
  const dth = TAU / angles;
  for (let i = 0; i < angles; i += 1) {
    const th = -Math.PI / 2 + (i + 0.5) * dth;
    const rt = rWallAt(s, th);
    const rh = shape ? rHeroNarrowAt(shape, th) : rHeroAt(tips, th);
    const cov = Math.min(rt, rh);
    const at = 0.5 * rt * rt * dth;
    const ac = 0.5 * cov * cov * dth;
    trama += at;
    covered += ac;
    if (rh > rt) wasted += 0.5 * (rh * rh - rt * rt) * dth;
    /* a quale asse appartiene questo angolo: il settore centrato sulla punta */
    const k = Math.round(((th + Math.PI / 2) / TAU) * AXES) % AXES;
    const ki = (k + AXES) % AXES;
    perAxisTotal[ki] += at;
    perAxisExposed[ki] += at - ac;
  }
  return {
    pct: trama > 0 ? (covered / trama) * 100 : 0,
    tramaArea: trama,
    coveredArea: covered,
    wastedArea: wasted,
    exposedByAxis: perAxisExposed.map((e, i) => (perAxisTotal[i] > 0 ? (e / perAxisTotal[i]) * 100 : 0)),
  };
}

/** la copertura direttamente dai dati, senza costruire nulla a mano */
export function coverageOf(input: SkillInput, config: CheckConfig = DEFAULT_CHECK_CONFIG): Coverage {
  return measureCoverage(buildSnapshot(input, config, 0));
}

/**
 * IL GATE (v15 punto 8): se il successo e' automatico non si tira lo skill
 * check, si mostra il risultato. Non e' un tetto sulla forma — nessuna
 * geometria viene compressa per fare spazio a un margine.
 *
 * `threshold` resta una decisione del Director (100, o 95 "la cosa di XCOM"):
 * finche' non e' presa, il gate scatta solo a copertura totale.
 */
export const AUTO_THRESHOLD_PCT = 100;

export function shouldRoll(cov: Coverage, threshold = AUTO_THRESHOLD_PCT): boolean {
  return cov.pct < threshold;
}

/* ── IL BORDO INTERNO = IL FALLIMENTO CRITICO ──────────────────────────────
 * Decisione del Director, e la ragione e' fisica, non estetica:
 *
 *     «all'esterno non e' raggiungibile dal lancio della pallina, deve essere
 *      interno. Se si ferma li e' fallimento critico.»
 *
 * Il critico stava sulla fascia attaccata al muro (`regionAt`: d > muro*kEpic),
 * cioe' dove la pallina non arriva quasi mai: una probabilita' assegnata a un
 * posto irraggiungibile e' una probabilita' che non accade. Qui la fascia si
 * appoggia al bordo della stella, DALLA PARTE DI FUORI: e' il primo pezzo di
 * materia scura che incontri mancando la copertura.
 *
 * Lo spessore non e' scelto: si risolve perche' l'area della fascia sia
 * `pctOfTrama`% dell'area della trama. Il Director ha detto che deve essere
 * facilmente visibile — e con la fascia ancorata alla stella lo e' per
 * costruzione, perche' segue la sagoma invece di stare su un cerchio lontano.
 */
export function solveCritBand(
  s: Snapshot,
  rHero: (theta: number) => number,
  pctOfTrama: number,
  angles = 2880,
): number {
  const dth = TAU / angles;
  let trama = 0;
  for (let i = 0; i < angles; i += 1) {
    const th = -Math.PI / 2 + (i + 0.5) * dth;
    const rt = rWallAt(s, th);
    trama += 0.5 * rt * rt * dth;
  }
  const want = trama * (pctOfTrama / 100);
  const areaOf = (e: number) => {
    let a = 0;
    for (let i = 0; i < angles; i += 1) {
      const th = -Math.PI / 2 + (i + 0.5) * dth;
      const rt = rWallAt(s, th);
      const r0 = Math.min(rHero(th), rt);
      const r1 = Math.min(r0 * (1 + e), rt);
      a += 0.5 * (r1 * r1 - r0 * r0) * dth;
    }
    return a;
  };
  let lo = 0, hi = 3;
  for (let k = 0; k < 40; k += 1) {
    const m = (lo + hi) / 2;
    if (areaOf(m) < want) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
