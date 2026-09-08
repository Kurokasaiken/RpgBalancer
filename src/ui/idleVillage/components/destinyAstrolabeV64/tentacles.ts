/**
 * tentacles.ts — I TENTACOLI D'OMBRA. V6.3, transitorio di crescita del catrame.
 *
 * PERCHE' UN MODULO NUOVO E NON UN PARAMETRO IN PIU'.
 * Due tentativi hanno fallito allo stesso modo, e la causa era il modello, non
 * la taratura:
 *
 *     petalo    = distanza dal centro in funzione dell'angolo,  r(theta)
 *     tentacolo = un PERCORSO nello spazio + una SEZIONE variabile, C(s), w(s)
 *
 * Con `r(theta)` per ogni angolo esiste un solo raggio: la forma e' stellata
 * rispetto al centro per costruzione, e nessuna funzione angolare puo' produrre
 * un'ansa, una S o un braccio che curva di lato. E' la frontiera invalicabile di
 * quella rappresentazione, non un limite della funzione.
 *
 * I QUATTRO SEGNALI CHE PESANO (in ordine, e tutti fuori portata di r(theta)):
 *   1. un asse lungo che percorre lo spazio;
 *   2. rastremazione continua con una PANCIA muscolare, non un cono;
 *   3. la radice INGLOBATA nella massa — non un attacco fra due forme;
 *   4. il movimento come cambio di POSTURA, non come onda che scorre.
 *
 * Il quarto e' il motivo per cui qui non c'e' nessun `sin(t + s*f)`: quella e'
 * un'onda matematica che viaggia lungo una forma ferma. La flessione laterale e'
 * una MOLLA SMORZATA verso un bersaglio che cambia piano: il braccio prende una
 * posa, la tiene, la cambia.
 *
 * DOVE VIVE, e questo e' il vincolo che decide tutto: nel nostro board il goo E'
 * il muro — la sagoma a riposo e' `rCheckAt`, che confina la pallina e porta le
 * probabilita'. Quindi i tentacoli sono SOLO IL TRANSITORIO: durante la crescita
 * non si sta decidendo niente, e a riposo la massa torna alla sagoma radiale. Le
 * braccia si allargano e la pozza cresce, cosi' l'unione CONVERGE alla sagoma
 * radiale e il passaggio non si vede.
 *
 * COME VIENE DISEGNATO: non come poligoni. Il renderer del catrame valuta uno
 * smooth-min fra il rim radiale e un insieme di metaball, quindi i campioni
 * della centerline entrano come primitive e si FONDONO col corpo — corpo e
 * braccio non sono due oggetti, e nessuna giunzione puo' tradirsi.
 */

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smoothstep = (t: number, a: number, b: number): number => {
  if (t <= a) return 0;
  if (t >= b) return 1;
  const m = (t - a) / (b - a);
  return m * m * (3 - 2 * m);
};

/** campioni per braccio: 4 bastano perche' lo smooth-min riempie fra loro */
export const SAMPLES_PER_ARM = 4;

export interface ArmState {
  /** flessione laterale corrente, in frazione della portata */
  bend: number;
  bendVel: number;
  /** bersaglio della posa: cambia piano, non a ogni frame */
  bendTarget: number;
  nextPoseMs: number;
  /** per-braccio: nessun arto e' la copia di un altro */
  lenScale: number;
  lag: number;
  stiff: number;
  damp: number;
  bulge: number;
  side: number;
}

export interface TentacleField {
  arms: ArmState[];
  /** [x,y,r] per ogni campione, pronto per il renderer */
  blobs: Float32Array;
  count: number;
}

/** rng deterministico: la scena non deve cambiare fra due esecuzioni */
/** RNG deterministico a seme. Esportato per la sim del catrame (PLAN-010 CP-E). */
export const rng32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export function createTentacles(axes: number, seed = 0x7ea1): TentacleField {
  const rnd = rng32(seed);
  const arms: ArmState[] = [];
  for (let i = 0; i < axes; i += 1) {
    arms.push({
      /* un arto non parte MAI dritto: la posa iniziale e' gia' una curva */
      bend: (rnd() - 0.5) * 0.7,
      bendVel: 0,
      bendTarget: (rnd() - 0.5) * 0.5,
      nextPoseMs: 0,
      /* lunghezze diverse: cinque bracci identici tornano a leggere come petali */
      lenScale: 0.84 + rnd() * 0.16,
      lag: rnd() * 0.16,
      /* RIGIDITA' TARATA SULLA DURATA DELLA COLATA. Con 0.006 la molla arriva
         alla posa in circa 1.7s, ma la colata dura 1.1s: misurato, la flessione
         laterale massima restava 3.9px su un muro da 200 — invisibile, e il
         braccio tornava a essere un raggio dritto. A 0.04-0.07 la posa si
         raggiunge in 300-400ms, quindi il braccio si piega DENTRO il transitorio.
         Restano diversi per braccio: non devono sembrare cinque copie dello
         stesso oscillatore. */
      stiff: 0.040 + rnd() * 0.030,
      damp: 0.84 + rnd() * 0.08,
      bulge: 0.16 + rnd() * 0.12,
      side: rnd() > 0.5 ? 1 : -1,
    });
  }
  return { arms, blobs: new Float32Array(axes * SAMPLES_PER_ARM * 3), count: 0 };
}

/**
 * LA POSA. Ogni braccio ha una molla smorzata verso `bendTarget`, e il bersaglio
 * cambia a intervalli irregolari. E' questo che si legge come muscolare: una
 * sinusoide continua dice «onda», una molla che raggiunge una posa e poi ne
 * prende un'altra dice «arto».
 */
export function tickPose(tf: TentacleField, nowMs: number, dtMs: number): void {
  const k = Math.min(3, dtMs / 16.7);
  for (let i = 0; i < tf.arms.length; i += 1) {
    const a = tf.arms[i];
    if (nowMs >= a.nextPoseMs) {
      /* il nuovo bersaglio dipende dall'indice e dal tempo, senza Math.random,
         cosi' la scena resta riproducibile */
      const p = Math.sin(nowMs * 0.00042 + i * 2.399963) * Math.cos(nowMs * 0.00017 + i);
      a.bendTarget = clamp(p * 0.62 * a.side, -0.62, 0.62);
      a.nextPoseMs = nowMs + 520 + ((i * 137) % 380);
    }
    a.bendVel = (a.bendVel + (a.bendTarget - a.bend) * a.stiff * k) * Math.pow(a.damp, k);
    a.bend += a.bendVel * k;
  }
}

/**
 * LA SEZIONE. Non un cono: c'e' una pancia verso `s = 0.30`, ed e' quella che
 * dice «volume vivo» invece di «triangolo allungato».
 */
export function widthAt(s: number, reach: number, fill: number, bulge: number): number {
  const baseW = reach * (0.085 + 0.30 * fill);
  const tipW = reach * 0.016;
  const taper = Math.pow(1 - s, 1.7);
  const muscle = reach * bulge * 0.10 * Math.exp(-Math.pow((s - 0.30) / 0.18, 2));
  return tipW + (baseW - tipW) * taper + muscle;
}

/**
 * Riempie le primitive. `reachAt(theta)` e' il muro: la punta del braccio ci
 * arriva quando il braccio e' completamente esteso, cosi' i tentacoli toccano
 * gli obelischi neri e non un raggio inventato.
 *
 * `rootDepth` mette P0 DENTRO la pozza: la radice deve sembrare che la massa
 * abbia deciso di diventare piu' stretta in quella direzione, non un oggetto
 * appiccicato al corpo.
 */
export function buildBlobs(
  tf: TentacleField,
  cx: number,
  cy: number,
  rev: number,
  axisAngle: (i: number) => number,
  reachAt: (theta: number) => number,
): number {
  let n = 0;
  const fill = smoothstep(rev, 0.52, 1.0);
  for (let i = 0; i < tf.arms.length; i += 1) {
    const a = tf.arms[i];
    const ang = axisAngle(i);
    const reach = reachAt(ang) * a.lenScale;
    const ext = smoothstep(rev, a.lag, a.lag + 0.54);
    if (ext <= 0.001) continue;
    const dirX = Math.cos(ang), dirY = Math.sin(ang);
    const perpX = -dirY, perpY = dirX;
    const rootR = reach * 0.14;                       // la radice sta dentro
    const tipR = reach * ext;
    const p0x = cx + dirX * rootR, p0y = cy + dirY * rootR;
    const p2x = cx + dirX * tipR, p2y = cy + dirY * tipR;
    /* il controllo della Bezier E' la posa: sposta il braccio DI LATO, che e'
       la cosa che r(theta) non poteva fare */
    const off = a.bend * reach * 0.42 * ext;
    const p1x = (p0x + p2x) / 2 + perpX * off;
    const p1y = (p0y + p2y) / 2 + perpY * off;
    for (let k = 0; k < SAMPLES_PER_ARM; k += 1) {
      /* i campioni si addensano verso la punta: la' la sezione cambia in fretta */
      const s = Math.pow((k + 1) / SAMPLES_PER_ARM, 0.85);
      const om = 1 - s;
      const x = om * om * p0x + 2 * om * s * p1x + s * s * p2x;
      const y = om * om * p0y + 2 * om * s * p1y + s * s * p2y;
      tf.blobs[n * 3] = x;
      tf.blobs[n * 3 + 1] = y;
      tf.blobs[n * 3 + 2] = widthAt(s, reach, fill, a.bulge);
      n += 1;
    }
  }
  tf.count = n;
  return n;
}

/**
 * Quanto la pozza deve essere grande. Piccola durante i tentacoli — o il collo
 * non si vede — e piena alla fine, perche' e' lei a far convergere l'unione
 * sulla sagoma radiale. Se si fermasse sotto, il riempimento finale lo farebbe
 * il lucchetto della simulazione: di colpo, ed e' il difetto che il Director
 * chiamava «si ferma in uno step».
 */
/**
 * LA SECONDA CURVA, che vanificava la prima (PLAN-010 CP-E).
 *
 * Il fronte del catrame non segue `tarPour`: segue QUESTA. E qui c'era una
 * `smoothstep(rev, 0.52, 1.0)` che riaccelerava nella sua prima meta' cio' che a
 * monte era gia' stato reso decelerante. Misurato sul fronte simulato: velocita'
 * per quarto `[0.93, 0.89, 3.09, 3.85]` — il catrame accelerava lo stesso.
 *
 * Il ritardo iniziale resta: la pozza seminata sta ferma, poi cede. Ma la salita
 * dopo il ritardo ora e' `^0.5`, cioe' la stessa legge viscosa di monte: la
 * composizione di due mappe decrescenti resta decrescente, e la velocita' del
 * fronte non puo' piu' risalire.
 */
export function poolFraction(rev: number): number {
  /* NESSUNA SECONDA CURVA. `rev` porta gia' la legge viscosa; qui si lasciava
     passare, e invece c'era una `smoothstep(rev, 0.52, 1.0)` che riaccelerava a
     valle cio' che a monte era stato reso decelerante.
     Ne e' caduto anche il plateau: la pozza restava ferma fino a rev=0.52 e poi
     ripartiva, e un plateau seguito da movimento RICHIEDE un'accelerazione — non
     e' una taratura da aggiustare, e' la forma. Misurato prima: velocita' per
     quarto `[0.93, 0.89, 3.09, 3.85]`.
     Resta il pavimento del seme, che e' la pozza iniziale gia' presente e non un
     ritardo: superato subito dalla colata, non introduce nessun salto. */
  const seed = 0.15 * smoothstep(rev, 0.02, 0.20);
  return Math.max(seed, Math.min(1, rev));
}
