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

import { AXES, R_CORE, rOf, rWallAt, type Snapshot, type SkillInput, type CheckConfig,
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
export function measureCoverage(s: Snapshot, angles = 7200): Coverage {
  const tips = s.axisTip;
  let trama = 0, covered = 0, wasted = 0;
  const perAxisExposed = new Array<number>(AXES).fill(0);
  const perAxisTotal = new Array<number>(AXES).fill(0);
  const dth = TAU / angles;
  for (let i = 0; i < angles; i += 1) {
    const th = -Math.PI / 2 + (i + 0.5) * dth;
    const rt = rWallAt(s, th);
    const rh = rHeroAt(tips, th);
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
