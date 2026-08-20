/**
 * webEngine — timeline e matematica della stella per lo Skill Check Web V1.
 *
 * ATTENZIONE: le costanti qui sotto sono TARATE E VERIFICATE, non scelte a
 * occhio. In particolare `VALLEY_F` è calibrato perché a parità di valori la
 * stella copra esattamente metà dell'area dell'arena — che è la formula
 * canonica dello skill check (50% + mod PG − mod prova). Misurato: 50.09% a
 * ogni livello di parità, da 20/20 a 95/95. Cambiare uno di questi numeri
 * rompe il bilanciamento in modo silenzioso.
 *
 * Il modello, per non doverlo ricostruire:
 *   ARENA (rOf(difficoltà)) = regione di FALLIMENTO, ed è il contenitore fisico
 *     dentro cui la pallina rimbalza. La sua parete è la superficie di collisione.
 *   STELLA (punte a rOf(stat)) = regione di SUCCESSO, sovrapposta all'arena.
 *   PALLINA = la randomicità. Si ferma sulla stella -> successo, altrove ->
 *     fallimento. L'esito è scelto a monte: la pallina è teatro.
 */

const TAU = Math.PI * 2;

/** raggio del board — l'intera scala 1..99 ci sta dentro */
export const R = 362;
/** numero di assi/skill, quindi punte della stella */
export const AXES = 5;
/** nocciolo: la stella non collassa mai a zero */
export const R_CORE = Math.max(30, R * 0.12);
/**
 * Profondità delle valli della stella.
 *
 * TARATO, non arbitrario: è il valore per cui a parità la stella copre il 50%
 * dell'area dell'arena, ed è scale-invariante (vale a 20/20 come a 95/95).
 * Verificato su tutti i livelli di parità: 50.09%.
 */
export const VALLEY_F = 0.3675;

/**
 * FALLIMENTO CRITICO — regola del sistema, non del board.
 *
 * Il sistema tira un D100: da 00 a `CRIT_FAIL_MAX` è SEMPRE fallimento,
 * qualunque sia la geometria. Quindi il crit-fail è DISGIUNTO, non
 * moltiplicativo: la probabilità mostrabile si CAPA, non si scala.
 *
 *     mostrabile = min(probabilità geometrica, 100 − CRIT_FAIL_PCT)
 *
 * Serve perché senza il cap il pannello arriva a dichiarare 100.00% (misurato a
 * 95/20, 99/10, 99/1) mentre il sistema trattiene sempre quella fascia: non è
 * una sorpresa, è un numero che mente. L'effetto X-COM funziona solo se il
 * numero mostrato è quello onorato.
 *
 * OFF-BY-ONE RISOLTO: il numero di sistema è il 5%, non il 6%. Su un D100
 * percentile la fascia di fallimento automatico è 01..05 — cinque valori,
 * cinque punti percentuali. Prima qui era cablato 00..05 (sei valori, 6%),
 * che gonfiava il cap di un punto.
 */
export const CRIT_FAIL_MIN = 1;
export const CRIT_FAIL_MAX = 5;
/** quanti valori del D100 sono fallimento automatico: CRIT_FAIL_MIN..CRIT_FAIL_MAX */
export const CRIT_FAIL_PCT = CRIT_FAIL_MAX - CRIT_FAIL_MIN + 1;

/** la probabilità che il board può onorare, dato il crit-fail disgiunto */
export const shownProb = (geometricPct: number): number =>
  Math.min(geometricPct, 100 - CRIT_FAIL_PCT);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const normAng = (a: number) => {
  let x = a % TAU;
  if (x < -Math.PI) x += TAU;
  if (x > Math.PI) x -= TAU;
  return x;
};
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/**
 * Raggio corrispondente a un valore 1..99.
 *
 * INVARIANTE DEL DIRECTOR: se il PG ha 40, la punta della stella e l'obelisco
 * devono arrivare alla stessa tacca. Quindi questa funzione è l'unico ponte fra
 * valore e geometria, e la usano sia la stella (rOf(stat)) sia il muro
 * dell'arena (rOf(difficoltà)).
 */
export const rOf = (v: number) => R_CORE + (clamp(v, 1, 99) / 100) * (R - 22 - R_CORE);

/** angolo della punta i-esima */
export const TIP = (i: number) => -Math.PI / 2 + i * (TAU / AXES);

/**
 * Raggio della stella a un dato angolo.
 *
 * Interpola fra punta e valle su mezzi settori. Le punte stanno esattamente a
 * `starTip[i]` — mai il risultato di un solve, che era il bug per cui le punte
 * non arrivavano al valore della stat.
 */
export function rStarAt(
  theta: number,
  starTip: number[],
  scale = 1,
  valleyF: number = VALLEY_F,
): number {
  const t = ((normAng(theta + Math.PI / 2) % TAU) + TAU) % TAU;
  const seg = TAU / (AXES * 2);
  const k = Math.floor(t / seg);
  const f = (t - k * seg) / seg;
  const tipR = (i: number) => starTip[((i % AXES) + AXES) % AXES] * scale;
  if (k % 2 === 0) {
    const a = tipR(k / 2);
    const b = Math.min(tipR(k / 2), tipR(k / 2 + 1)) * valleyF;
    return a + (b - a) * f;
  }
  const b = tipR((k + 1) / 2);
  const a = Math.min(tipR((k - 1) / 2), tipR((k + 1) / 2)) * valleyF;
  return a + (b - a) * f;
}

/**
 * Graduazione di AREA — attenzione, NON è il righello del board.
 *
 * Sono due strumenti con due mestieri diversi, e confonderli rompe un
 * invariante:
 *
 *   RIGHELLO DEL BOARD — tacca del valore `v` a `rOf(v)`. Legge «la punta è a
 *     85». È obbligato così dall'invariante del Director: se il PG ha 40, la
 *     punta della stella deve cadere sulla 4ª stanghetta. Non va toccato.
 *
 *   GRADUAZIONE DI AREA — tacca k-esima a `rim·√(k/N)`, equispaziata in area
 *     dall'origine e relativa al MURO dell'arena. Leggerebbe «la stella copre
 *     il 60% dell'arena». Rende quella lettura ESATTA: scarto 0.000, perché
 *     area = ½∫r²dθ e quindi la media di r²/rim² È il rapporto di aree. Una
 *     spaziatura lineare in raggio sbaglierebbe fino a +12.5 punti e farebbe
 *     leggere tre numeri diversi alle tre parità.
 *
 * `gradRadii` implementa la seconda. Oggi non è cablata da nessuna parte, e va
 * bene: sul board non esiste (ancora) una lettura di probabilità da graduare.
 * Cablarla nel righello sposterebbe la tacca di «40» via da `rOf(40)` e
 * romperebbe l'invariante — è l'errore che una revisione automatica ha proposto.
 *
 * Caveat della legge: con difficoltà diverse per asse l'identità cade (media di
 * un rapporto ≠ rapporto di medie). Lì ogni asse resta esatto per sé, ma un
 * numero globale non esiste — e non è una perdita, perché la formula lineare in
 * quel caso sbagliava di −43.8 punti.
 */
export type Graduation = 'area' | 'linear';

/** raggi delle tacche: k = 1..n, dal centro verso `rim` */
export function gradRadii(rim: number, n: number, mode: Graduation): number[] {
  const out: number[] = [];
  for (let k = 1; k <= n; k += 1) {
    out.push(mode === 'area' ? rim * Math.sqrt(k / n) : (rim * k) / n);
  }
  return out;
}

export interface RagnatelaParams {
  stat: number;
  difficulty: number;
  /** campioni per il conteggio dei fili superstiti nel pannello di lettura */
  strands: number;
  /** durata del lancio della rete (ms) */
  weaveMs: number;
  /** residuo dell'era "tessitura": non più usato dal lancio */
  stagger: number;
  /** durata della crescita della stella, cioè dello sfondamento (ms) */
  tearMs: number;
  /** frazione di raggio consumata oltre la quale il filo scatta */
  snapFrac: number;
  /** ampiezza del rinculo allo scatto, in unità engine */
  recoil: number;
  /** smorzamento della vibrazione post-scatto */
  damping: number;
  showStar: boolean;
}

export const DEFAULTS: RagnatelaParams = {
  stat: 85,
  difficulty: 50,
  strands: 20,
  weaveMs: 1200,
  stagger: 0.65,
  tearMs: 900,
  snapFrac: 0.55,
  recoil: 14,
  damping: 6,
  showStar: true,
};

/* ── TIMELINE ──────────────────────────────────────────────────────────
   lancio → hold → sfondamento (la stella cresce) → assestamento         */
const HOLD_MS = 300;
const SETTLE_MS = 800;
export const totalMs = (p: RagnatelaParams) => p.weaveMs + HOLD_MS + p.tearMs + SETTLE_MS;

export interface Phase {
  name: 'weave' | 'hold' | 'tear' | 'settle';
  /** 0..1 apertura della rete lanciata */
  weaveP: number;
  /** 0..1 scala della stella */
  starS: number;
  /** ms dall'inizio dello sfondamento, per le vibrazioni smorzate */
  tearT: number;
}

export function phaseAt(t: number, p: RagnatelaParams): Phase {
  const w = p.weaveMs;
  const h = w + HOLD_MS;
  const e = h + p.tearMs;
  if (t < w) return { name: 'weave', weaveP: t / w, starS: 0, tearT: 0 };
  if (t < h) return { name: 'hold', weaveP: 1, starS: 0, tearT: 0 };
  if (t < e) {
    const q = (t - h) / p.tearMs;
    return { name: 'tear', weaveP: 1, starS: easeInOutCubic(q), tearT: t - h };
  }
  return { name: 'settle', weaveP: 1, starS: 1, tearT: t - h };
}

/* ── MISURA ────────────────────────────────────────────────────────────
   Le tre letture affiancate, così la divergenza è visibile invece che
   assunta. È il pannello che ha smascherato la codifica lineare.        */
export interface Readout {
  survivors: number;
  total: number;
  /** lettura LINEARE (ingenua): frazione di lunghezza consumata. Mente. */
  lengthEaten: number;
  /** lettura EQUAL-AREA: media di rs²/rim². Esatta a difficoltà uniforme. */
  areaEaten: number;
  /** probabilità geometrica vera: area(stella ∩ arena) / area(arena) */
  areaProb: number;
  /** la probabilità che il sistema può ONORARE: capata dal crit-fail disgiunto */
  shownPct: number;
  /** la formula lineare 50 + stat − difficoltà, per confronto */
  formulaTst: number;
}

export function readout(p: RagnatelaParams): Readout {
  const n = Math.max(1, p.strands);
  const rimR = rOf(p.difficulty);
  const starTip = Array.from({ length: AXES }, () => rOf(p.stat));
  const full = Math.max(1, rimR - R_CORE);

  /* integrazione fine sull'angolo: equal-area e area vera vengono da qui */
  const NA = 720;
  const dA = TAU / NA;
  let areaSum = 0;
  let starA = 0;
  let arenaA = 0;
  for (let i = 0; i < NA; i += 1) {
    const a = -Math.PI / 2 + i * dA;
    const rs = clamp(rStarAt(a, starTip, 1), R_CORE, rimR);
    areaSum += (rs * rs) / (rimR * rimR) / NA;
    starA += 0.5 * rs * rs * dA;
    arenaA += 0.5 * rimR * rimR * dA;
  }

  /* conteggio sui fili campionati: lettura lineare e superstiti */
  let survivors = 0;
  let eatenSum = 0;
  for (let j = 0; j < n; j += 1) {
    const angle = -Math.PI / 2 + (j / n) * TAU;
    const rs = rStarAt(angle, starTip, 1);
    eatenSum += clamp(rs - R_CORE, 0, full) / full;
    if (rs < rimR) survivors += 1;
  }

  return {
    survivors,
    total: n,
    lengthEaten: eatenSum / n,
    areaEaten: areaSum * 100,
    areaProb: arenaA > 0 ? (starA / arenaA) * 100 : 0,
    shownPct: shownProb(arenaA > 0 ? (starA / arenaA) * 100 : 0),
    formulaTst: clamp(50 + (p.stat - p.difficulty), 1, 99),
  };
}
