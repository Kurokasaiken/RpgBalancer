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

/* ── LA STELLA, QUELLA VERA ────────────────────────────────────────────────
 * Il Director, guardando le prime tre versioni: «la forma del pg e' sempre
 * strana. Sai cosa e' una stella?»
 *
 * Aveva ragione e la causa e' precisa. I profili precedenti interpolavano il
 * RAGGIO in funzione dell'angolo — con `smoothstep` nel primo caso, lineare nel
 * secondo. Un raggio che varia dolcemente con l'angolo produce petali TONDI, e
 * un fondovalle a raggio costante produce un DISCO: fiore e disco, mai stella.
 *
 * Una stella e' un POLIGONO: dieci vertici, cinque punte a `rOf(stat_i)` e
 * cinque incavi a meta' fra due punte, uniti da SEGMENTI DRITTI. I fianchi
 * retti e gli angoli vivi non sono uno stile: sono la definizione.
 *
 * Il raggio del bordo a un angolo si ricava dalla CORDA fra due vertici, in
 * forma chiusa — non si campiona e non si arrotonda:
 *
 *     r(t) = r0*r1*sin(a1-a0) / ( r0*sin(t-a0) + r1*sin(a1-t) )
 *
 * PUNTE CHE SI ALLUNGANO E SI STRINGONO. In una stella a cinque punte gli assi
 * distano 72 gradi fissi: la snellezza NON e' un angolo libero, e' il rapporto
 * fra incavo e punta. Abbassare l'incavo allunga e assottiglia; alzarlo
 * ingrassa. Quindi la variabile e' `valleyF`, ma come FUNZIONE
 * dell'allungamento e non come manopola.
 */

/**
 * LA PROGRESSIONE. Decisione del Director, e il vincolo negativo e' esplicito:
 *
 *     «Quando possibile voglio il fiore, quando non possibile da stella a
 *      stella stretta e allungata. La stella cicciona non voglio vederla mai.»
 *
 * Quindi non c'e' una stella che ingrassa: ci sono DUE FAMIGLIE e un passaggio.
 * Il fiore e' un profilo dolce (raggio interpolato, petali tondi); la stella e'
 * un poligono a fianchi retti come `tracePerfectStar` della V6. La stella entra
 * in scena GIA' SNELLA — incavo 0.40, il valore della V6 — e da li' si affila.
 * Il tratto grasso non esiste in nessun punto del dominio.
 *
 * Il passaggio e' governato dall'allungamento punta/trama: finche' la punta sta
 * dentro la materia c'e' spazio per i petali, quando la supera serve la punta.
 */
export const FLOWER_UNTIL = 0.82;   // sotto: fiore puro
export const STAR_FROM = 1.16;      // sopra: stella pura
export const STAR_VALLEY_WIDE = 0.40;   // la stella appena entra: mai piu' grassa
export const STAR_VALLEY_SLIM = 0.22;   // affilata, quando sfonda la trama

/** 0 = fiore, 1 = stella. Fra le due si mescola, e non si vede mai il salto. */
export function starMix(elong: number): number {
  const u = clamp((elong - FLOWER_UNTIL) / (STAR_FROM - FLOWER_UNTIL), 0, 1);
  return u * u * (3 - 2 * u);
}

/** incavo della stella: parte snella e si affila con l'allungamento */
export function valleyDepthFor(elong: number): number {
  const u = clamp((elong - STAR_FROM) / 1.9, 0, 1);
  return STAR_VALLEY_WIDE - (STAR_VALLEY_WIDE - STAR_VALLEY_SLIM) * (u * u * (3 - 2 * u));
}

export interface HeroShape {
  /** angoli dei dieci vertici della stella, crescenti */
  angs: number[];
  /** raggi dei dieci vertici: punta, incavo, punta, incavo... */
  radii: number[];
  tips: number[];
  /** quanto la forma e' stella invece che fiore, per asse */
  mix: number[];
}

/** i dieci vertici piu' il mix fiore/stella. Niente qui e' scelto a mano. */
export function buildHeroShape(s: Snapshot, valleyF?: number): HeroShape {
  const angs: number[] = [];
  const radii: number[] = [];
  const mix: number[] = [];
  for (let i = 0; i < AXES; i += 1) {
    const aTip = -Math.PI / 2 + (i * TAU) / AXES;
    const tipR = s.axisTip[i];
    angs.push(aTip);
    radii.push(tipR);
    mix.push(starMix(tipR / Math.max(1e-6, rWallAt(s, aTip))));

    /* l'incavo fra la punta i e la i+1 appartiene a entrambe, quindi segue la
       PIU' CORTA delle due: e' cosi' che un asse debole scava la valle */
    const aVal = aTip + Math.PI / AXES;
    const weak = Math.min(tipR, s.axisTip[(i + 1) % AXES]);
    const trama = rWallAt(s, aVal);
    const vf = valleyF ?? valleyDepthFor(trama > 0 ? weak / trama : 1);
    angs.push(aVal);
    radii.push(weak * vf);
  }
  return { angs, radii, tips: s.axisTip, mix };
}

/** il bordo della STELLA: intersezione del raggio con la corda, forma chiusa */
function rStarChord(sh: HeroShape, theta: number): number {
  const n = sh.angs.length;
  const a0 = sh.angs[0];
  const t = (((theta - a0) % TAU) + TAU) % TAU;
  const seg = TAU / n;
  const k = Math.floor(t / seg) % n;
  const rA = sh.radii[k];
  const rB = sh.radii[(k + 1) % n];
  const d = seg;
  const u = t - k * seg;
  const den = rA * Math.sin(u) + rB * Math.sin(d - u);
  if (Math.abs(den) < 1e-12) return Math.max(rA, rB);
  return (rA * rB * Math.sin(d)) / den;
}

/**
 * Il bordo dell'eroe: fiore, stella, o la mescola fra i due. Il mix e' preso
 * sull'asse piu' vicino, cosi' una scheda squilibrata puo' avere un petalo da
 * una parte e una punta dall'altra — che e' il ritratto giusto.
 */
export function rHeroNarrowAt(sh: HeroShape, theta: number): number {
  const star = rStarChord(sh, theta);
  const flower = rHeroAt(sh.tips, theta, VALLEY_F);
  let best = Infinity;
  let bi = 0;
  for (let i = 0; i < AXES; i += 1) {
    const a = -Math.PI / 2 + (i * TAU) / AXES;
    const dd = Math.abs((((theta - a) % TAU) + TAU + Math.PI) % TAU - Math.PI);
    if (dd < best) { best = dd; bi = i; }
  }
  const m = sh.mix[bi];
  return flower * (1 - m) + star * m;
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

/* ── LE TRE BANDE, OGNUNA IL 5% ────────────────────────────────────────────
 * Il Director: «non vedo almost, non vedo successo critico o fallimento
 * critico, tutti devono essere 5% (5% del valore interno allo skill check)».
 *
 * «Valore interno allo skill check» = l'area della TRAMA, che e' il dominio in
 * cui la pallina si ferma. Quindi tutte e tre le bande si misurano sulla stessa
 * base, e nessuna delle tre e' disegnata a spessore fisso: lo spessore si
 * RISOLVE perche' l'area sia quella. Una banda a spessore fisso porta una
 * probabilita' diversa a ogni difficolta' — e' il difetto misurato in PLAN-008,
 * dove la fascia critica valeva il 31.9% dell'area a difficolta' 20 e il 10.4% a
 * 99.
 *
 * Ordine dal centro verso fuori:
 *
 *     SUCCESSO CRITICO  il nucleo della stella
 *     successo          il resto della stella
 *     [bordo stella]
 *     FALLIMENTO CRITICO  la prima materia scura che incontri mancando
 *     ALMOST              subito oltre
 *     fallimento          il resto della trama
 *
 * Il critico sta DENTRO e non al muro per decisione del Director: «all'esterno
 * non e' raggiungibile dal lancio della pallina».
 */

/**
 * IL RAGGIO DELLA PALLINA in unita' engine. Il centro della pallina non puo'
 * avvicinarsi al muro piu' del proprio raggio: quello e' il punto piu' profondo
 * che un tiro raggiunge davvero, ed e' il vincolo FISICO su cui si appoggia la
 * banda del fallimento critico.
 */
export const BALL_R = 9;

/** area della trama: la materia della difficolta, tutta intera */
export function tramaArea(s: Snapshot, angles = 2880): number {
  const dth = TAU / angles;
  let a = 0;
  for (let i = 0; i < angles; i += 1) {
    const th = -Math.PI / 2 + (i + 0.5) * dth;
    const rt = rWallAt(s, th);
    a += 0.5 * rt * rt * dth;
  }
  return a;
}

/**
 * L'AREA DI TIRO, ed e' questa la base delle percentuali. Il Director:
 *
 *     «e' il 5% dell'area totale entro cui puo' rimbalzare la pallina, l'area
 *      dello skill check»
 *
 * Non e' l'area della trama: il CENTRO della pallina non puo' avvicinarsi al
 * muro piu' del proprio raggio, quindi l'area davvero disponibile e' quella
 * dentro `trama - BALL_R`. Misurare sulla trama piena gonfia la base e rende
 * ogni banda piu' piccola del suo valore dichiarato — e di quanto dipende dalla
 * difficolta', perche' `BALL_R` e' costante mentre la trama no.
 */
export function reachArea(s: Snapshot, angles = 2880): number {
  const dth = TAU / angles;
  let a = 0;
  for (let i = 0; i < angles; i += 1) {
    const th = -Math.PI / 2 + (i + 0.5) * dth;
    const rr = Math.max(0, rWallAt(s, th) - BALL_R);
    a += 0.5 * rr * rr * dth;
  }
  return a;
}

/**
 * SUCCESSO CRITICO: il disco al centro la cui area e' `pct`% della trama.
 * Sta tutto dentro la stella finche' il nucleo non supera l'incavo — e quando
 * lo supera lo diciamo, invece di lasciar sbordare il trionfo nel fallimento.
 */
export function solveCoreRadius(s: Snapshot, pct: number, angles = 2880): number {
  return Math.sqrt((reachArea(s, angles) * (pct / 100)) / Math.PI);
}

/**
 * Le bande esterne, in cascata: ogni `pcts[i]` e' la sua fetta di trama, e la
 * banda parte dove finisce la precedente. Ritorna i fattori cumulativi `e`
 * tali che la banda k va da `rHero*(1+e[k-1])` a `rHero*(1+e[k])`.
 */

/**
 * FALLIMENTO CRITICO = il bordo interno del goo, e il goo comincia dove il tiro
 * arriva. Il Director:
 *
 *     «All'esterno non e' raggiungibile dal lancio della pallina, deve essere
 *      interno. Se si ferma li e' fallimento critico.»
 *     «Il fallimento critico e' il bordo interno del goo, non il bordo esterno
 *      della stella. Il bordo esterno della stella e' almost.»
 *
 * Quindi le due bande NON sono adiacenti: almost sta attaccato alla stella
 * (mancata di un soffio), il critico sta piu' in fuori, e fra i due c'e' il
 * fallimento normale. Il bordo esterno della banda critica e' `trama - BALL_R`,
 * cioe' il punto piu' profondo raggiungibile: oltre, la pallina non ci arriva e
 * una probabilita' assegnata la' non accadrebbe mai.
 *
 * Ritorna il fattore `f` tale che la banda va da `(trama - BALL_R) * (1 - f)` a
 * `trama - BALL_R`.
 */
export function solveGooBand(
  s: Snapshot,
  pct: number,
  angles = 1440,
): number {
  const dth = TAU / angles;
  const want = reachArea(s, angles) * (pct / 100);
  const areaOf = (f: number) => {
    let a = 0;
    for (let i = 0; i < angles; i += 1) {
      const th = -Math.PI / 2 + (i + 0.5) * dth;
      const r1 = Math.max(0, rWallAt(s, th) - BALL_R);
      const r0 = r1 * (1 - f);
      a += 0.5 * (r1 * r1 - r0 * r0) * dth;
    }
    return a;
  };
  let lo = 0, hi = 1;
  for (let k = 0; k < 44; k += 1) {
    const m = (lo + hi) / 2;
    if (areaOf(m) < want) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

export function solveOuterBands(
  s: Snapshot,
  rHero: (theta: number) => number,
  pcts: number[],
  angles = 1440,
): number[] {
  const dth = TAU / angles;
  const base = reachArea(s, angles);
  const areaUpTo = (e: number) => {
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
  const out: number[] = [];
  let want = 0;
  for (const pct of pcts) {
    want += base * (pct / 100);
    let lo = 0, hi = 4;
    for (let k = 0; k < 44; k += 1) {
      const m = (lo + hi) / 2;
      if (areaUpTo(m) < want) lo = m; else hi = m;
    }
    out.push((lo + hi) / 2);
  }
  return out;
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
