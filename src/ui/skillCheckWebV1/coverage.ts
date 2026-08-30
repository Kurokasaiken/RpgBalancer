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

import { AXES, R_CORE, rWallAt, type Snapshot, type SkillInput, type CheckConfig,
         VALLEY_F, DEFAULT_CHECK_CONFIG, buildSnapshot } from './zones';

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * La stella del PERSONAGGIO: punte a `rOf(stat_i)`, fianchi retti fino al
 * fondovalle. Nessuna scala, nessun `bodyMix`: se una punta esce dalla trama,
 * esce — la parte fuori non copre niente perche' non c'e' niente da coprire.
 */
export function rHeroAt(
  tips: number[],
  theta: number,
  /**
   * Scalare, oppure UN VALORE PER INCAVO. Il vettore serve al pilota d'area: con
   * un morph per petalo le cinque valli sono diverse, e uno scalare le
   * appiattirebbe tutte sulla stessa profondita' — cancellando proprio la lettura
   * «quale skill ti tradisce».
   */
  valleyF: number | number[] = VALLEY_F,
): number {
  const t = (((theta + Math.PI / 2) % TAU) + TAU) % TAU;
  const seg = TAU / (AXES * 2);
  const k = Math.floor(t / seg);
  const f = (t - k * seg) / seg;
  const tip = (i: number) => tips[((i % AXES) + AXES) % AXES];
  /* l'incavo del segmento k: pari = fra k/2 e k/2+1, dispari = fra (k-1)/2 e (k+1)/2 */
  const vAt = (i: number): number => {
    if (typeof valleyF === 'number') return valleyF;
    return valleyF[((i % AXES) + AXES) % AXES];
  };
  if (k % 2 === 0) {
    const a = tip(k / 2);
    const b = Math.min(tip(k / 2), tip(k / 2 + 1)) * vAt(k / 2);
    return a + (b - a) * f;
  }
  const b = tip((k + 1) / 2);
  const a = Math.min(tip((k - 1) / 2), tip((k + 1) / 2)) * vAt((k - 1) / 2);
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
/* LE SOGLIE. Quando le skill sono pari o superiori alla difficoltà la stella
   deve stringere i fianchi: le valli si restringono e la forma diventa sempre
   più una stella vera, non un fiore. La transizione inizia appena sotto la
   parità e procede via via che il personaggio supera la prova. */
export const FLOWER_UNTIL = 0.85;   // sotto: fiore puro
export const STAR_FROM = 1.30;      // sopra: stella pura
export const STAR_VALLEY_WIDE = 0.30;   // stella appena entra: snella
export const STAR_VALLEY_SLIM = 0.15;   // affilata, punta che sfonda
export const STAR_VALLEY_REACH = 0.90;  // delta elong da STAR_FROM a valle sottilissima

/** 0 = fiore, 1 = stella. Fra le due si mescola, e non si vede mai il salto. */
export function starMix(elong: number): number {
  const u = clamp((elong - FLOWER_UNTIL) / (STAR_FROM - FLOWER_UNTIL), 0, 1);
  return u * u * (3 - 2 * u);
}

/** incavo della stella: parte snella e si affila con l'allungamento */
export function valleyDepthFor(elong: number): number {
  const u = clamp((elong - STAR_FROM) / STAR_VALLEY_REACH, 0, 1);
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
  /**
   * Valle del ramo FIORE, una per incavo. Assente = `VALLEY_F`, cioe' il
   * comportamento di V16.
   *
   * Serve perche' `rHeroNarrowAt` miscela DUE profili: se la valle del ramo stella
   * si muove col morph e quella del fiore resta inchiodata, al capo fiore la forma
   * non arriva mai al petalo pieno — misurato, e' proprio il tetto che faceva
   * mancare 5 punti a 85/50.
   */
  flowerValley?: number[];
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

/* ═══════════════════════════════════════════════════════════════════════════
   IL PILOTA D'AREA — PLAN-010 CP-C, desiderata v17

   Qui non cambia nessuna primitiva di forma: `rHeroAt`, `rStarChord` e
   `rHeroNarrowAt` restano quelle di V16. Cambia CHI decide `mix` e `valleyF`.

   Prima decideva l'allungamento `punta/muro`. Il Director l'ha dichiarato morto,
   e la v17 dice cosa mettere al suo posto: **il contratto di copertura vince sulla
   forma**, quindi la forma e' quella che serve a produrre `50 + delta`.

   UN SOLO parametro per petalo, `morph`, e la punta lo segue in proporzione —
   e' la regola del Director: «in proporzione a quanto e' fiore e quanto e'
   stella dovrebbe essere anche la forma della punta».

       morph = 0  -> fiore:  punta tonda,  valle alta  -> AREA MASSIMA
       morph = 1  -> stella: punta acuta,  valle bassa -> AREA MINIMA

   Il tetto della valle non e' inventato: CP-B ha misurato che serve **0.774**
   (caso 10/20) per rendere EXACT il dominio giocabile. 0.80 tiene il margine.
   ═══════════════════════════════════════════════════════════════════════════ */

/** valle al capo FIORE del morph. Da CP-B: serve 0.774, questo tiene il margine. */
export const MORPH_VALLEY_FLOWER = 0.80;
/** valle al capo STELLA del morph: la forma piu' magra che il modello ammette. */
export const MORPH_VALLEY_STAR = STAR_VALLEY_SLIM;

/** la valle che corrisponde a una posizione del morph */
export const valleyForMorph = (m: number): number =>
  MORPH_VALLEY_FLOWER + (MORPH_VALLEY_STAR - MORPH_VALLEY_FLOWER) * clamp(m, 0, 1);


/** copertura del solo settore dell'asse `k`, in % dell'area di quel settore */
function sectorCoverage(s: Snapshot, sh: HeroShape, k: number, angles = 240): number {
  const half = Math.PI / AXES;
  const centre = -Math.PI / 2 + (k * TAU) / AXES;
  const dth = (2 * half) / angles;
  let trama = 0;
  let covered = 0;
  for (let i = 0; i < angles; i += 1) {
    const th = centre - half + (i + 0.5) * dth;
    const rt = rWallAt(s, th);
    /* il pavimento del nucleo: il successo e' «nucleo + stella», non solo stella */
    const rh = Math.max(rHeroNarrowAt(sh, th), R_CORE);
    const c = Math.min(rt, rh);
    trama += 0.5 * rt * rt * dth;
    covered += 0.5 * c * c * dth;
  }
  return trama > 0 ? (covered / trama) * 100 : 0;
}

/**
 * IL SOLVER. Trova il morph per petalo che porta la copertura di ogni settore al
 * proprio bersaglio.
 *
 * `targets` e' un vettore, uno per asse, e non un numero solo: su un board a piu'
 * skill ogni punta ha il suo delta, e il sorgente dell'astrolabio ammette che con
 * un bersaglio unico «su un board multi-skill il bersaglio era mal posto per
 * costruzione». Con un bersaglio per settore ogni petalo dice la verita' sulla
 * PROPRIA skill, e il totale viene da se'. Con una skill sola i cinque bersagli
 * coincidono e il vettore degenera nel caso singolo.
 *
 * I settori sono accoppiati — ogni valle appartiene a due petali — quindi si itera:
 * la copertura di un settore CALA quando il suo morph cresce (piu' stella = meno
 * area), percio' la bisezione per asse e' lecita e le passate convergono.
 *
 * Dove il bersaglio sta fuori dall'insieme ammesso il morph SATURA al capo giusto:
 * e' la policy della v17 — lo scarto viene dalla frontiera di fattibilita', non da
 * una taratura opportunistica. CP-B ha misurato che il caso peggiore sfonda di 4.9
 * punti su 61 casi giocabili.
 */
/**
 * I dieci vertici da profondita' di valle gia' decise.
 *
 * Il `mix` — quanto la punta e' spigolo invece che arco — segue in PROPORZIONE,
 * come chiede il Director: e' la posizione delle valli dentro l'intervallo
 * fiore..stella, mediata fra le due che delimitano quel petalo. Un petalo con
 * valli profonde ha la punta acuta; uno con valli alte ce l'ha tonda.
 */
export function buildHeroShapeFromValleys(s: Snapshot, valleys: number[]): HeroShape {
  const angs: number[] = [];
  const radii: number[] = [];
  const mix: number[] = [];
  const flowerValley: number[] = [];
  const toMorph = (vf: number) =>
    clamp((MORPH_VALLEY_FLOWER - vf) / (MORPH_VALLEY_FLOWER - MORPH_VALLEY_STAR), 0, 1);
  for (let i = 0; i < AXES; i += 1) {
    const aTip = -Math.PI / 2 + (i * TAU) / AXES;
    const j = (i + 1) % AXES;
    const prev = (i + AXES - 1) % AXES;
    angs.push(aTip);
    radii.push(s.axisTip[i]);
    mix.push((toMorph(valleys[prev]) + toMorph(valleys[i])) / 2);
    /* il raggio di base resta quello dell'asse debole: e' geometria, non stile —
       una valle piu' lunga della punta piu' corta rovescerebbe il vertice */
    const weakIdx = s.axisTip[i] <= s.axisTip[j] ? i : j;
    angs.push(aTip + Math.PI / AXES);
    radii.push(s.axisTip[weakIdx] * valleys[i]);
    flowerValley.push(valleys[i]);
  }
  return { angs, radii, tips: s.axisTip, mix, flowerValley };
}

/**
 * IL SOLVER SULLE VALLI — cinque incognite, cinque bersagli.
 *
 * Il solver per-petalo (`solveMorph`) lasciava saturare un asse forte fra vicini
 * deboli: nella sua parametrizzazione la valle e' condivisa, quindi il morph di un
 * petalo non basta a controllare i propri due confini. Misurato: -13 punti.
 *
 * Ma le valli sono CINQUE e i bersagli sono CINQUE: il sistema e' quadrato, e non
 * c'e' nessuna scelta da fare fra «la valle» e «il contratto» — c'era solo una
 * parametrizzazione che sprecava gradi di liberta'.
 *
 * Qui le incognite sono le profondita' delle valli. Ogni valle confina con due
 * settori, quindi si rilassa: si guarda l'errore di ciascun settore e si spingono
 * le sue due valli nella direzione che lo riduce. Piu' copertura del dovuto ->
 * valli piu' profonde.
 */
export function solveValleys(s: Snapshot, targets: number[], passes = 400): number[] {
  const lo = MORPH_VALLEY_STAR;
  const hi = MORPH_VALLEY_FLOWER;
  const v = new Array<number>(AXES).fill((lo + hi) / 2);
  const shapeOf = () => buildHeroShapeFromValleys(s, v);
  /* Uscita per STAGNAZIONE, non solo per convergenza. Le celle sature non
     convergono mai — le valli sono incollate ai bordi e l'errore resta dov'e' —
     quindi senza questa bruciano tutte le passate per niente. Misurato: era il
     motivo per cui il test sulla griglia 9x9 stava a 15.7s e sotto carico
     sfondava il proprio timeout, cioe' falliva a intermittenza. */
  let prevErr = Infinity;
  let fermo = 0;
  for (let pass = 0; pass < passes; pass += 1) {
    const sh = shapeOf();
    const err = targets.map((t, k) => sectorCoverage(s, sh, k) - t);
    const peggiore = Math.max(...err.map(Math.abs));
    if (peggiore < 0.05) break;
    if (prevErr - peggiore < 1e-4) { fermo += 1; if (fermo >= 12) break; } else fermo = 0;
    prevErr = peggiore;
    /* la valle j delimita i settori j e j+1: la muove la somma dei loro errori */
    const next = v.slice();
    for (let j = 0; j < AXES; j += 1) {
      const e = err[j] + err[(j + 1) % AXES];
      next[j] = clamp(v[j] - e * 0.004, lo, hi);
    }
    for (let j = 0; j < AXES; j += 1) v[j] = next[j];
  }
  return v;
}


/**
 * La forma che il contratto impone. UN SOLO percorso: delega al solver sulle valli.
 *
 * Per un giro qui e' esistito un secondo solver (per-petalo) mentre il motore usava
 * gia' quello sulle valli. I test misuravano il morto e restavano verdi. Un secondo
 * percorso silenzioso e' il difetto che ha aperto questa sessione: non se ne tiene
 * uno "per compatibilita'".
 */
export function solveHeroShape(s: Snapshot, targets: number[]): HeroShape {
  return buildHeroShapeFromValleys(s, solveValleys(s, targets));
}

/* ── LA POLICY DI SATURAZIONE — PLAN-010 CP-D ───────────────────────────────
   Dove il contratto non e' raggiungibile la forma va al massimo ammesso e lo
   scarto resta. La v17 chiede che quello scarto sia **spiegato dalla frontiera**
   e non da una taratura opportunistica — e per esserlo dev'essere ISPEZIONABILE.

   Senza questo la saturazione e' muta: il quadro smette di predire l'esito e
   nessuno se ne accorge. Con questo, chi guarda sa quale asse ha ceduto, contro
   quale limite, e di quanto.

   Due frontiere, e dicono cose diverse:
     'flower' — morph al minimo: la forma e' gia' il petalo piu' pieno ammesso e
                non c'e' altra area da prendere. Succede a un asse forte i cui
                vicini deboli gli scavano le valli (misurato: oltre ~20 punti di
                spread fra le stat, sempre e solo un settore).
     'star'   — morph al massimo: la forma e' gia' la piu' magra ammessa e copre
                comunque troppo. Succede quando la punta e' molto piu' corta del
                muro, cioe' ai bersagli bassissimi.
   ─────────────────────────────────────────────────────────────────────────── */

export interface AxisReport {
  axis: number;
  /** il bersaglio del contratto per questo settore */
  target: number;
  /** cio' che la forma risolta copre davvero in quel settore */
  achieved: number;
  morph: number;
  /** contro quale frontiera si e' fermata, se si e' fermata */
  saturated: 'none' | 'flower' | 'star';
  /** achieved - target, con segno */
  residual: number;
}

export interface SolvedShape {
  shape: HeroShape;
  morph: number[];
  report: AxisReport[];
  /** vero se almeno un settore ha ceduto contro una frontiera */
  anySaturated: boolean;
}

/** quanto un morph puo' avvicinarsi al bordo prima di chiamarsi saturo */
const SAT_EPS = 1e-3;
/** oltre questo scarto la saturazione e' degna di nota, non rumore di bisezione */
export const CONTRACT_TOLERANCE = 3;

/**
 * Risolve la forma E dice cosa e' successo. E' `solveHeroShape` piu' il verbale.
 */
export function solveShapeReported(s: Snapshot, targets: number[]): SolvedShape {
  const valleys = solveValleys(s, targets);
  const shape = buildHeroShapeFromValleys(s, valleys);
  const morph = shape.mix.slice();
  const pinnedFlower = valleys.some((v) => v >= MORPH_VALLEY_FLOWER - SAT_EPS);
  const pinnedStar = valleys.some((v) => v <= MORPH_VALLEY_STAR + SAT_EPS);
  const report: AxisReport[] = [];
  for (let k = 0; k < AXES; k += 1) {
    const achieved = sectorCoverage(s, shape, k);
    const residual = achieved - targets[k];
    let saturated: AxisReport['saturated'] = 'none';
    if (Math.abs(residual) > CONTRACT_TOLERANCE) {
      /* La frontiera si guarda sul SISTEMA, non sulla singola valle. Le valli sono
         cinque e i bersagli cinque, ma se anche una sola si incolla a un bordo
         restano quattro incognite per cinque equazioni: il sistema e'
         sovravincolato e NESSUN settore e' piu' garantito esatto, nemmeno quelli
         con le proprie valli libere. Misurato su [90,30,60,75,45]: due valli al
         tetto del fiore e l'errore che si distribuisce su tutti e cinque i settori
         a +-2.9, invece di concentrarsi. Attribuirlo a `none` perche' «la mia
         valle non e' incollata» sarebbe uno scarto muto travestito. */
      if (pinnedFlower) saturated = 'flower';
      else if (pinnedStar) saturated = 'star';
    }
    report.push({
      axis: k,
      target: targets[k],
      achieved: +achieved.toFixed(2),
      morph: +morph[k].toFixed(4),
      saturated,
      residual: +residual.toFixed(2),
    });
  }
  return { shape, morph, report, anySaturated: report.some((r) => r.saturated !== 'none') };
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
  const flower = rHeroAt(sh.tips, theta, sh.flowerValley ?? VALLEY_F);
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
export function measureCoverage(
  s: Snapshot,
  angles = 7200,
  narrow = false,
  /**
   * Profondita' della valle, come frazione della punta. Assente = comportamento
   * storico (`VALLEY_F` per il fiore, `valleyDepthFor` per la stella): nessuna
   * chiamata esistente cambia risultato.
   *
   * Esiste perche' la valle e' la manopola dell'AREA, e senza poterla muovere non
   * si puo' rispondere alla domanda di CP-B — quale copertura e' raggiungibile,
   * caso per caso, dentro l'insieme delle forme ammesse.
   */
  opts: {
    valleyF?: number;
    /** forma gia' risolta (dal pilota d'area): se c'e', vince su `narrow`/`valleyF` */
    shape?: HeroShape;
    /**
     * Conta anche il NUCLEO come successo. Il Director definisce il successo come
     * «nucleo + stella clippata al muro», e nel regime a valle bassa il nucleo
     * sporge oltre la valle: senza questo, il solver centra un bersaglio che non
     * e' quello che il giocatore vede. Default spento: V15/V16 non si muovono.
     */
    withCore?: boolean;
  } = {},
): Coverage {
  const tips = s.axisTip;
  const shape = opts.shape ?? (narrow ? buildHeroShape(s, opts.valleyF) : null);
  const floor = opts.withCore ? R_CORE : 0;
  let trama = 0, covered = 0, wasted = 0;
  const perAxisExposed = new Array<number>(AXES).fill(0);
  const perAxisTotal = new Array<number>(AXES).fill(0);
  const dth = TAU / angles;
  for (let i = 0; i < angles; i += 1) {
    const th = -Math.PI / 2 + (i + 0.5) * dth;
    const rt = rWallAt(s, th);
    const rh0 = shape ? rHeroNarrowAt(shape, th) : rHeroAt(tips, th, opts.valleyF);
    const rh = Math.max(rh0, floor);
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
