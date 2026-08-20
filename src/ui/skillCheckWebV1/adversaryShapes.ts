/**
 * adversaryShapes — geometria dell'avversario per lo Skill Check Web V1.
 *
 * La tela NON è un reticolo polare e NON si tesse: viene LANCIATA. Vedi la nota
 * su `WebAnim` per il perché (il ragno non esiste, quindi non c'è nessuno che
 * posi i fili uno per volta).
 *
 * VOCABOLARIO: qui non esiste nessuna spirale. Il termine biologico è "capture
 * spiral", ma le trasversali sono CORDE fra raggi consecutivi che scendono a
 * gradini, e quella parola importa un read escluso dal Director. Si usa il
 * lessico della tessitura:
 *     ORDITO = i raggi, dal mozzo al telaio
 *     TRAME  = le corde trasversali fra due raggi
 *
 * Nota tecnica su `feTurbulence`: non serve. Quel filtro conta per le TEXTURE
 * d'area; su un filamento sottile l'organicità la dà lo spostamento dei vertici,
 * che canvas fa nativamente. Il limite vero di canvas è un altro — non esiste
 * stroke a larghezza variabile, quindi tutto ciò che si assottiglia va disegnato
 * come poligono riempito (vedi `fillTapered`).
 */

const TAU = Math.PI * 2;

/** PRNG deterministico: la stessa tela ogni frame, nessuno sfarfallio. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ShapeCtx {
  cx: number;
  cy: number;
  /** unità engine -> px */
  k: number;
  /** raggio del muro dell'arena in unità engine (valore RAPPRESENTATIVO: serve
   *  a normalizzare il lancio anche quando il muro è per-angolo) */
  rFrame: number;
  /**
   * MURO PER ANGOLO. Assente = arena circolare di raggio `rFrame`.
   *
   * Serve perché nella V7 la prova è multi-skill: ogni asse porta la sua
   * difficoltà, quindi il muro dell'arena è un PROFILO, non un cerchio. Il
   * telaio della tela È quel muro, quindi ancoraggi, sfondamento e clip della
   * stella devono leggerlo da qui.
   */
  rFrameAt?: (theta: number) => number;
  /** l'host disegna già campo e righello: qui non ridisegnarli */
  skipArena?: boolean;
  /** palette dell'host: la tela porta il carattere, non il colore */
  ink?: Partial<Ink>;
  /** raggio PIENO della stella a un dato angolo (la scala la applica drawWeb) */
  rStar: (theta: number) => number;
  seed: number;
  /**
   * IL RIGHELLO. Senza, una punta che sporge dal telaio non "arriva a 85":
   * sporge e basta, e legge come linea di costruzione. La graduazione vive sul
   * BOARD e copre l'intera scala 1..99, così sia la punta della stella
   * (rOf(stat)) sia il muro dell'arena (rOf(difficoltà)) si leggono sullo stesso
   * metro. È anche la risposta a "dove vive la graduazione": qui, non sulla
   * tela — la tela porta il carattere, il board porta la misura.
   */
  rig?: { axes: number[]; ticks: { r: number; major: boolean }[] };
}

export type Ink = Record<
  | 'bg' | 'field' | 'silk' | 'silkDim' | 'frame' | 'wood' | 'woodDark' | 'leaf'
  | 'star' | 'starEdge' | 'tick' | 'tickMajor',
  string
>;

const INK: Ink = {
  bg: '#0d1117',
  field: '#161c24',
  silk: '#aab6c2',
  silkDim: '#6e7a87',
  frame: '#cdd6e0',
  wood: '#9aa5b1',
  woodDark: '#5b6672',
  leaf: '#7d8894',
  star: '#454e59',
  starEdge: '#8b96a3',
  tick: '#39424e',
  tickMajor: '#5d6875',
};

/* ── utilità ─────────────────────────────────────────────────────────── */

/** Poligono rastremato: l'unico modo di avere spessore variabile su canvas. */
function fillTapered(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  w0: number,
  w1: number,
  color: string,
): void {
  if (pts.length < 2) return;
  const n = pts.length;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const t = i / (n - 1);
    const hw = Math.max(0.12, (w0 + (w1 - w0) * t) / 2);
    left.push({ x: p.x - ty * hw, y: p.y + tx * hw });
    right.push({ x: p.x + ty * hw, y: p.y - tx * hw });
  }
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i += 1) ctx.lineTo(left[i].x, left[i].y);
  for (let i = n - 1; i >= 0; i -= 1) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** il campo dell'arena, poi il righello SOPRA */
function drawArena(ctx: CanvasRenderingContext2D, S: ShapeCtx, C: Ink): void {
  const { cx, cy, k } = S;

  ctx.beginPath();
  ctx.arc(cx, cy, S.rFrame * k, 0, TAU);
  ctx.fillStyle = C.field;
  ctx.fill();

  /* Le tacche vanno DOPO il disco, o il disco le copre. Dentro l'arena sono più
     tenui, perché lì ci passano pallina e stella; fuori sono piene, perché è là
     che si legge lo sfondamento. */
  if (!S.rig) return;
  for (const a of S.rig.axes) {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const pr = a + Math.PI / 2;
    const cp = Math.cos(pr);
    const sp = Math.sin(pr);
    for (const t of S.rig.ticks) {
      const x = cx + ca * t.r * k;
      const y = cy + sa * t.r * k;
      const len = t.major ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(x - cp * len, y - sp * len);
      ctx.lineTo(x + cp * len, y + sp * len);
      ctx.strokeStyle = t.major ? C.tickMajor : C.tick;
      ctx.globalAlpha = t.r < S.rFrame ? 0.55 : 1;
      ctx.lineWidth = t.major ? 1.4 : 0.9;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * La stella (il mozzo).
 *
 * `clipTo` = raggio del muro dell'arena. Dentro, la stella è PIENA: è la regione
 * di successo, quella dove la pallina può davvero fermarsi. Fuori, resta solo il
 * CONTORNO: è lo sfondamento, e non promette un successo non ottenibile (la
 * pallina non esce dall'arena). Così le punte restano puntute e al valore di stat
 * giusto senza inghiottire il board — clampare il raggio le appiattiva in archi
 * e leggevano tagliate invece che sfondate.
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  S: ShapeCtx,
  radiusAt: (a: number) => number,
  C: Ink,
  clipTo?: (a: number) => number,
): void {
  const path = () => {
    ctx.beginPath();
    const STEP = 320;
    for (let i = 0; i <= STEP; i += 1) {
      const a = -Math.PI / 2 + (i / STEP) * TAU;
      const r = radiusAt(a) * S.k;
      const x = S.cx + Math.cos(a) * r;
      const y = S.cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  if (clipTo) {
    /* clip POLIGONALE, non circolare: con muro per-angolo un cerchio taglierebbe
       dove il muro non c'è. */
    ctx.save();
    ctx.beginPath();
    const STEP = 240;
    for (let i = 0; i <= STEP; i += 1) {
      const a = -Math.PI / 2 + (i / STEP) * TAU;
      const r = clipTo(a) * S.k;
      const x = S.cx + Math.cos(a) * r;
      const y = S.cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.clip();
    path();
    ctx.fillStyle = C.star;
    ctx.fill();
    ctx.restore();
  } else {
    path();
    ctx.fillStyle = C.star;
    ctx.fill();
  }

  path();
  ctx.strokeStyle = C.starEdge;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

/* ── (a) LA TELA ────────────────────────────────────────────────────────── */

export interface WebOpts {
  /** numero di raggi (ordito) — nelle tele reali 15-35 */
  radii: number;
  /** quanto le trame cedono verso il mozzo (0 = reticolo polare) */
  sag: number;
  /** passo fra due trame in unità engine */
  weftStep: number;
  /** ampiezza del disturbo sui vertici */
  wobble: number;
  /** quanto i raggi si incurvano (frazione della loro lunghezza). 0 = retti */
  curve: number;
  /**
   * Come si piegano i raggi.
   *
   * `gravity` — verso il BASSO in coordinate mondo. È l'unica scelta che non può
   *   generare un vortice: un vortice richiede che tutte le linee flettano nello
   *   stesso senso ROTAZIONALE, mentre qui i raggi di sinistra e di destra
   *   flettono in versi opposti pur cedendo entrambi in basso. In più la
   *   componente perpendicolare al raggio vale |cos(angolo)|, quindi i fili
   *   orizzontali flettono al massimo e quelli verticali per niente: è come cede
   *   la seta vera, e porta gratis l'asimmetria verticale delle tele reali.
   *
   * `swirl` — perpendicolare al raggio, quindi la direzione ruota con l'angolo.
   *   Tenuto solo come controesempio: è il modo di ottenere un vortice per
   *   sbaglio.
   *
   * `none` — raggi retti, il read "sunburst" da grafico a raggi.
   */
  curveMode: 'gravity' | 'swirl' | 'none';
  /**
   * Numero di ANCORAGGI del telaio.
   *
   * ATTENZIONE ALLA DOSE — storia degli errori su questo bordo, perché non si
   * ripeta: (1) cerchio con tremolio 3% = né cerchio né telaio; (2) poligono a 6
   * ancoraggi = un ESAGONO che compete col cerchio dell'arena, e due bordi che si
   * contraddicono non leggono; (3) poligono a 13 = ancora un tridecagono. Il
   * difetto comune erano le FACCETTE, non gli ancoraggi. Ora la curva è liscia e
   * gli ancoraggi servono solo a variarne il raggio e a portare i nodi.
   *
   * Il telaio non deve essere una forma diversa dal cerchio: deve far leggere il
   * cerchio come FILO TESO invece che come tratto disegnato.
   */
  anchors: number;
  /** irregolarità del raggio degli ancoraggi (frazione). 0 = cerchio perfetto */
  anchorJitter: number;
  /** sovraelongazione dell'apertura: 0.07 = arriva al 107% e rientra */
  overshoot: number;
  /** rotazione iniziale della rete in radianti, decelera fino a 0 */
  spin: number;
  /** scostamento iniziale dal centro, frazione di rFrame: è la traiettoria */
  throwOffset: number;
  /** quanto il centro ritarda rispetto al perimetro (0..0.8) */
  centerLag: number;
  /**
   * SPAZZATA ANGOLARE — è la differenza fra una ragnatela e una rete da pesca.
   *
   * Una rete si apre come un disco: tutto il perimetro arriva insieme, ruotando.
   * Una tela LANCIATA no: parte un filo, colpisce, e la struttura si TENDE in
   * un'onda che gira attorno all'anello a partire dal punto d'impatto. Ogni
   * raggio, ogni ancoraggio e ogni trama arriva col proprio ritardo, funzione
   * della distanza angolare da `shotAngle`.
   *
   * 0 = tutto insieme (la rete). 0.5-0.7 = l'onda si legge come tensione che si
   * propaga. Sopra 0.8 si vede il ragno tessere, e il ragno NON ESISTE.
   */
  sweep: number;
  /** direzione da cui arriva il filo, radianti (0 = dall'alto) */
  shotAngle: number;
  /** stacco fra stella e prima trama, in unità engine */
  freeZone: number;
  /** tolleranza prima di considerare il telaio sfondato: a parità niente scintille */
  punchOut: number;
  droplets: boolean;
}

export const WEB_DEFAULTS: WebOpts = {
  radii: 26,
  sag: 0.17,
  weftStep: 13,
  wobble: 1.5,
  curve: 0.09,
  curveMode: 'gravity',
  anchors: 13,
  anchorJitter: 0.035,
  overshoot: 0.1,
  /* la ROTAZIONE è la firma della rete lanciata a mano: un filo scoccato non
     ruota. Ne resta solo un residuo, come frustata all'arrivo. */
  spin: 0.07,
  throwOffset: 0.16,
  /* il ritardo del centro serviva a far leggere "si apre": adesso il read lo
     porta la spazzata, e un centerLag alto la impasterebbe. */
  centerLag: 0.16,
  sweep: 0.55,
  shotAngle: 0,
  freeZone: 16,
  punchOut: 0.07,
  droplets: true,
};

/**
 * Stato di animazione. Assente = rete aperta e ferma.
 *
 * NON esiste un progresso separato per ordito e trame. Il ragno non esiste,
 * quindi non c'è nessuno che posi i fili uno per volta: la rete arriva come
 * EVENTO UNICO e la sua topologia è completa dal primo frame. Si scala, non si
 * costruisce.
 */
export interface WebAnim {
  /** 0..1 apertura della rete lanciata */
  launch: number;
  /** scala della stella 0..1 */
  starS: number;
  /** ms dall'inizio dello sfondamento, per le vibrazioni smorzate */
  tearT: number;
  /** durata totale dello sfondamento (ms): serve a DATARE lo scatto di ogni filo */
  tearMs: number;
  /** frazione di raggio consumata oltre la quale il filo scatta */
  snapFrac: number;
  /** ampiezza del rinculo allo scatto, in unità engine */
  recoil: number;
  /** smorzamento della vibrazione */
  damping: number;
  /**
   * Disegnare la stella? Serve a SPEGNERE LA RISPOSTA: senza questo, ogni
   * giudizio su "il beat si vede in anticipo?" viene dato guardando un board che
   * mostra sempre la soluzione. Era un parametro scritto dalla checkbox e mai
   * letto da nessuno.
   */
  showStar: boolean;
}

const STATIC: WebAnim = {
  launch: 1,
  showStar: true,
  starS: 1,
  tearT: 1e6,
  tearMs: 900,
  snapFrac: 0.55,
  recoil: 0,
  damping: 6,
};

/** quanto dura la ritrazione di un filo scattato (ms) */
const RETRACT_MS = 220;

const easeOut3 = (p: number) => 1 - (1 - p) ** 3;
/**
 * Inversa di easeInOutCubic, in forma chiusa.
 *
 * Serve per datare lo scatto: la stella cresce con easeInOutCubic, quindi il
 * filo i scatta a starS = snapAt(i), e questa funzione dice a QUALE FRAZIONE
 * dello sfondamento corrisponde. Senza, la ritrazione andrebbe pilotata dallo
 * scarto di starS e resterebbe congelata a meta' durante l'assestamento, dove
 * starS vale 1 fisso.
 */
export const invEaseInOutCubic = (e: number): number => {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  if (e < 0.5) return Math.cbrt(e / 4);
  return 1 - Math.cbrt(2 * (1 - e)) / 2;
};
const cl01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** sovraelongazione: supera il bersaglio e rientra. È la molla della rete. */
const easeOutBack = (p: number, over: number) => {
  const c = 1.70158 * (over / 0.07);
  const q = p - 1;
  return 1 + (c + 1) * q * q * q + c * q * q;
};

/** gocce selettive: 200 punti seppellirebbero la pallina */
function drawDroplets(
  ctx: CanvasRenderingContext2D,
  drops: { x: number; y: number }[],
  C: Ink,
): void {
  for (const d of drops) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 1.5, 0, TAU);
    ctx.fillStyle = C.frame;
    ctx.fill();
  }
}

export function drawWeb(
  ctx: CanvasRenderingContext2D,
  S: ShapeCtx,
  o: WebOpts,
  anim?: WebAnim,
): void {
  const A = anim ?? STATIC;
  const { cx, cy, k, rFrame } = S;
  const C: Ink = S.ink ? { ...INK, ...S.ink } : INK;
  /** il muro dell'arena all'angolo a: per-angolo se l'host lo fornisce */
  const wallAt = (a: number) => (S.rFrameAt ? S.rFrameAt(a) : rFrame);
  /* STREAM PRNG SEPARATI PER SOTTOSISTEMA.
     Prima c'era un solo stream condiviso, e ogni raggio che moriva saltava le 15
     estrazioni del suo ciclo di campioni: tutto il rumore a valle (jitter della
     seconda passata del telaio, wobble di ogni trama, posizione delle gocce) si
     rigenerava diverso. Risultato: un GUIZZO GLOBALE della tela sincronizzato al
     frame esatto in cui un filo moriva — un tell che l'occhio prende benissimo e
     che puntava al momento della morte.
     Con stream indipendenti `dead[]` non puo' piu' spostare il rumore di nessun
     altro elemento: non "consumo comunque", elimino la classe di bug. */
  const rndAnc = mulberry32((S.seed ^ 0x9e3779b1) >>> 0);
  const rndAng = mulberry32((S.seed ^ 0x85ebca6b) >>> 0);
  const rndFrm = mulberry32((S.seed ^ 0xc2b2ae35) >>> 0);
  const rndWft = mulberry32((S.seed ^ 0x27d4eb2f) >>> 0);
  /** stream dedicato al raggio i: indipendente da quanti altri sono morti */
  const rayRnd = (i: number) =>
    mulberry32((Math.imul(S.seed, 0x27d4eb2d) ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0);

  if (!S.skipArena) drawArena(ctx, S, C);

  const N = Math.max(8, o.radii);

  /* ── IL LANCIO: TELA SCOCCATA, NON RETE GETTATA ─────────────────────────
     La differenza sta tutta in COME arriva il perimetro.

     Una rete da pesca è un disco che si apre: tutto l'anello parte insieme e
     ruota. Una tela viene SCOCCATA: parte un filo lungo una direzione, si
     appiccica, e da quel punto d'impatto la struttura si TENDE in un'onda che
     gira attorno all'anello. Quindi:

     1. SPAZZATA angolare (`sweep`) — ogni raggio, ancoraggio e trama ha il suo
        istante d'arrivo, ordinato per distanza angolare da `shotAngle`. È il
        meccanismo principale: senza, qualsiasi altra cosa resta una rete;
     2. TENSIONE con sovraelongazione — il filo arriva teso e rimbalza, non si
        gonfia;
     3. traiettoria ALLINEATA al tiro — la tela entra dal lato da cui è stata
        scoccata, non da un angolo arbitrario;
     4. rotazione ridotta a un residuo — un filo scoccato non gira;
     5. il centro ritarda appena: la seta si estende dal mozzo verso il telaio.

     NON è il ragno che tesse: la topologia è completa dal primo frame, è solo
     l'ordine in cui i fili si TENDONO che segue il colpo.                    */
  const L = cl01(A.launch);
  const settled = easeOut3(L);
  const spin = o.spin * (1 - settled);
  const shotA = -Math.PI / 2 + o.shotAngle;
  const travel = o.throwOffset * rFrame * k * (1 - settled);
  const offX = Math.cos(shotA) * travel;
  const offY = Math.sin(shotA) * travel;

  /** ritardo normalizzato di un angolo: 0 = colpito per primo, 1 = per ultimo */
  const sweepAt = (a: number) => {
    /* distanza angolare ripiegata in 0..PI, poi normalizzata */
    const d = Math.abs((((a - shotA) % TAU + TAU * 1.5) % TAU) - Math.PI);
    return d / Math.PI;
  };

  /** avanzamento locale del lancio all'angolo a */
  const launchAt = (a: number) => {
    if (L >= 1) return 1;
    const lag = o.sweep * sweepAt(a);
    return cl01((L - lag) / Math.max(0.05, 1 - o.sweep));
  };

  /** scala al raggio normalizzato u (0 = centro, 1 = telaio), all'angolo a */
  const scaleAt = (u: number, a: number) => {
    if (L >= 1) return 1;
    const la = launchAt(a);
    const lag = o.centerLag * (1 - cl01(u));
    const span = Math.max(0.05, 1 - o.centerLag);
    return easeOutBack(cl01((la - lag) / span), o.overshoot);
  };

  /** un punto della rete, con lancio applicato */
  const P = (r: number, a: number, jx = 0, jy = 0) => {
    const sc = scaleAt(r / Math.max(1, rFrame), a);
    const aa = a + spin;
    return {
      x: cx + Math.cos(aa) * r * sc * k + jx + offX,
      y: cy + Math.sin(aa) * r * sc * k + jy + offY,
    };
  };

  /* ── ANCORAGGI ──────────────────────────────────────────────────────── */
  const AN = Math.max(3, o.anchors);
  const ancA: number[] = [];
  for (let i = 0; i < AN; i += 1) {
    ancA.push(-Math.PI / 2 + (i / AN) * TAU + (rndAnc() - 0.5) * (TAU / AN) * 0.55);
  }
  ancA.sort((x, y) => x - y);
  /* gli ancoraggi stanno SUL muro, che può variare con l'angolo */
  const ancR = ancA.map((a) => wallAt(a) * (1 - rndAnc() * o.anchorJitter));

  /** raggio del telaio all'angolo a: intersezione raggio/segmento fra ancoraggi */
  const frameRadiusAt = (a: number): number => {
    let t = a;
    while (t < ancA[0]) t += TAU;
    while (t >= ancA[0] + TAU) t -= TAU;
    let i = AN - 1;
    for (let j = 0; j < AN - 1; j += 1) {
      if (t >= ancA[j] && t < ancA[j + 1]) {
        i = j;
        break;
      }
    }
    const j = (i + 1) % AN;
    const ax = Math.cos(ancA[i]) * ancR[i];
    const ay = Math.sin(ancA[i]) * ancR[i];
    const bx = Math.cos(ancA[j]) * ancR[j];
    const by = Math.sin(ancA[j]) * ancR[j];
    const dx = bx - ax;
    const dy = by - ay;
    const den = Math.cos(t) * dy - Math.sin(t) * dx;
    if (Math.abs(den) < 1e-9) return rFrame;
    const r = (ax * dy - ay * dx) / den;
    return r > 0 ? r : rFrame;
  };

  const rsAt = (a: number) => S.rStar(a) * A.starS;

  /* Il FALLIMENTO CRITICO NON E' SUL BOARD — decisione del Director. Il 5% viene
     dato dal sistema, l'esito e' scelto a monte, e il board mette in scena solo
     l'esito geometrico onesto: la HUD dice il resto. Quindi qui non esiste ne'
     una regione dedicata, ne' un agente, ne' un tetto alle valli — c'era, era
     misurato a 0.13% d'area con sacche larghe 3px, ed e' stato rimosso.
     Conseguenza accettata: a vantaggio schiacciante la rete puo' sparire del
     tutto, e va bene — vuol dire che hai coperto tutto. */
  const punchedAt = (a: number) => rsAt(a) >= frameRadiusAt(a) * (1 + o.punchOut);

  if (A.showStar) drawStar(ctx, S, rsAt, C, frameRadiusAt);

  /* ── ORDITO ─────────────────────────────────────────────────────────── */
  const ang: number[] = [];
  for (let i = 0; i < N; i += 1) {
    ang.push(-Math.PI / 2 + (i / N) * TAU + (rndAng() - 0.5) * (TAU / N) * 0.6);
  }
  ang.sort((x, y) => x - y);

  const rInner: number[] = [];
  const rOuter: number[] = [];
  const dead: boolean[] = [];

  for (let i = 0; i < N; i += 1) {
    const a = ang[i];
    const rOut = frameRadiusAt(a);
    rOuter.push(rOut);

    /* La zona libera non puo' essere assoluta: nelle sacche del fallimento
       critico l'anello disponibile scende a 4-12 unita', meno della freeZone
       stessa, e i raggi morivano tutti (span <= 0.5). Qui e' proporzionale
       all'anello, con un tetto sul valore nominale. */
    const gapAvail = Math.max(0, rOut - rsAt(a));
    const fz = Math.min(o.freeZone, gapAvail * 0.35);
    const r0Adj = rsAt(a) + fz;
    /* UNA SOLA CAUSA DI MORTE: lo sfondamento del telaio. Prima c'era anche
       `span <= 0.5`, e a parita' perfetta faceva svanire 3 raggi su 26 nel frame
       culminante — dove per specifica non deve accadere niente. Era un tell
       FALSO. Ora uno span piccolo ACCORCIA il filo, non lo cancella. */
    const span = Math.max(0, rOut - r0Adj);
    rInner.push(r0Adj);
    const gone = punchedAt(a);
    dead.push(gone);
    if (span < 0.2) continue;

    /* IL FILO SI RITRAE, NON SVANISCE.
       Prima un raggio scattato faceva `continue` e scompariva in un frame: un
       pop. Qui lo scatto e' DATATO — il filo i scatta quando la stella arriva a
       snapAt(i) — e da quel momento il filo si ritira verso il telaio in
       RETRACT_MS, vibrando. Il capo che sopravvive e' quello ESTERNO, annodato
       al telaio: la stella lo ha mangiato dall'interno. */
    const rs1 = S.rStar(a);
    const snapAt = rs1 > 0 ? (rOut * (1 + o.punchOut)) / rs1 : Infinity;
    let retract = 0;
    if (Number.isFinite(snapAt) && snapAt <= 1) {
      const snapMs = invEaseInOutCubic(snapAt) * Math.max(1, A.tearMs);
      retract = cl01((A.tearT - snapMs) / RETRACT_MS);
    }
    if (retract >= 1) continue;

    /* RINCULO COME CONSEGUENZA, non come profezia.
       Prima vibravano i fili che STAVANO PER rompersi (soglia su snapFrac): a
       meta' crescita 11 fili tremavano con zero morti, quindi la vibrazione
       pre-marcava i condannati e i fermi erano i superstiti. Ora vibra solo chi
       ha GIA' scattato, dal proprio istante di scatto. I vivi hanno rinculo zero. */
    let kick = 0;
    if (A.recoil > 0 && retract > 0) {
      const snapMs = invEaseInOutCubic(snapAt) * Math.max(1, A.tearMs);
      const tau = Math.max(0, A.tearT - snapMs) / 1000;
      kick = A.recoil * Math.exp(-A.damping * tau * 0.6) * Math.sin(tau * 26);
    }

    /* la ritrazione alza l'estremo INTERNO verso il telaio */
    const rStart = r0Adj + span * easeOut3(retract);
    const spanNow = Math.max(0, rOut - rStart);
    /* FRUSTATA D'ARRIVO: finché il filo i sta ancora arrivando è inarcato, e si
       raddrizza nel tendersi. È ciò che fa leggere "filo scoccato che si tende"
       invece di "segmento che cresce"; svanisce del tutto quando ha finito. */
    const whip = (1 - easeOut3(launchAt(a))) * 0.28 * spanNow;
    const amp = (o.curveMode === 'none' ? 0 : o.curve * spanNow) + whip;
    /* `gravity`: versore FISSO verso il basso, non ruota con l'angolo — è questo
       che rende impossibile il vortice. */
    const px = o.curveMode === 'gravity' ? 0 : -Math.sin(a);
    const py = o.curveMode === 'gravity' ? 1 : Math.cos(a);
    const rr = rayRnd(i);
    const segs = 14;
    const pts: { x: number; y: number }[] = [];
    for (let sI = 0; sI <= segs; sI += 1) {
      const t = sI / segs;
      const r = rStart + kick + spanNow * t;
      const bow = amp * Math.sin(t * Math.PI) * k;
      const jit = (rr() - 0.5) * o.wobble * Math.sin(t * Math.PI);
      pts.push(P(r, a, px * bow + jit, py * bow + jit));
    }
    fillTapered(ctx, pts, 1.5, 0.9, C.silk);
  }

  /* ── TELAIO: un FASCIO liscio con i NODI ────────────────────────────────
     Curva liscia (quadratiche per i punti medi) con raggio che varia poco e in
     modo continuo, più due passate quasi parallele — un filo di telaio vero è
     rinforzato, il ragno ci ripassa — e i nodi dove è attaccato. */
  const fpt = ancA.map((a, i) => P(ancR[i], a));
  const midOf = (u: { x: number; y: number }, v: { x: number; y: number }) => ({
    x: (u.x + v.x) / 2,
    y: (u.y + v.y) / 2,
  });
  for (let pass = 0; pass < 2; pass += 1) {
    const jx = pass === 0 ? 0 : (rndFrm() - 0.5) * 2.2;
    const jy = pass === 0 ? 0 : (rndFrm() - 0.5) * 2.2;
    ctx.strokeStyle = C.frame;
    ctx.lineWidth = pass === 0 ? 1.9 : 0.85;
    ctx.globalAlpha = pass === 0 ? 1 : 0.5;
    let started = false;
    ctx.beginPath();
    for (let i = 0; i < AN; i += 1) {
      const j = (i + 1) % AN;
      const aMid = (ancA[i] + ancA[j] + (j === 0 ? TAU : 0)) / 2;
      if (punchedAt(aMid)) {
        started = false;
        continue;
      }
      const mPrev = midOf(fpt[(i - 1 + AN) % AN], fpt[i]);
      const mNext = midOf(fpt[i], fpt[j]);
      if (!started) {
        ctx.moveTo(mPrev.x + jx, mPrev.y + jy);
        started = true;
      }
      ctx.quadraticCurveTo(fpt[i].x + jx, fpt[i].y + jy, mNext.x + jx, mNext.y + jy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < AN; i += 1) {
    if (punchedAt(ancA[i])) continue;
    ctx.beginPath();
    ctx.arc(fpt[i].x, fpt[i].y, 1.8, 0, TAU);
    ctx.fillStyle = C.frame;
    ctx.fill();
  }

  /* ── TRAME ──────────────────────────────────────────────────────────────
     Corde fra raggi consecutivi, passo uniforme, cedenti verso il mozzo.
     Esistono tutte dal primo frame: è il lancio che le porta fuori. */
  const alive = rInner.map((r, i) => (dead[i] ? Infinity : r));
  const minInner = Math.min(...alive);
  /* Niente early return: quando tutti i raggi sono morti usciva di qui e
     cancellava anche trame, mozzo e gocce — la rete SPARIVA in un frame. Ora
     salta le sole trame, che senza raggi vivi non hanno appigli. */
  if (!Number.isFinite(minInner)) {
    drawDroplets(ctx, [], C);
    return;
  }

  const drops: { x: number; y: number }[] = [];
  ctx.lineCap = 'round';
  let r = Math.min(...rOuter) * 0.97;
  const step = o.weftStep / N;
  let guard = 0;
  while (r > minInner && guard < N * 80) {
    for (let i = 0; i < N; i += 1) {
      const j = (i + 1) % N;
      const rNext = r - step;
      guard += 1;
      if (rNext <= minInner) {
        r = rNext;
        break;
      }
      r = rNext;
      if (dead[i] || dead[j]) continue;
      if (r <= alive[i] || rNext <= alive[j]) continue;

      const p0 = P(r, ang[i]);
      const p1 = P(rNext, ang[j] + (j === 0 ? TAU : 0));
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const chord = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const pull = o.sag * chord;
      const dx = cx + offX - mx;
      const dy = cy + offY - my;
      const dl = Math.hypot(dx, dy) || 1;
      const qx = mx + (dx / dl) * pull + (rndWft() - 0.5) * o.wobble;
      const qy = my + (dy / dl) * pull + (rndWft() - 0.5) * o.wobble;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(qx, qy, p1.x, p1.y);
      ctx.strokeStyle = C.silkDim;
      ctx.lineWidth = 0.75;
      ctx.stroke();

      if (o.droplets && r > rFrame * 0.72 && rndWft() < 0.16) drops.push({ x: qx, y: qy });
    }
  }

  /* mozzo: poche corde corte attorno alla stella */
  for (let i = 0; i < N; i += 2) {
    const j = (i + 2) % N;
    if (dead[i] || dead[j]) continue;
    const p0 = P(alive[i] * 0.96, ang[i]);
    const p1 = P(alive[j] * 0.96, ang[j] + (j < i ? TAU : 0));
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(cx + offX, cy + offY, p1.x, p1.y);
    ctx.strokeStyle = C.silkDim;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  drawDroplets(ctx, drops, C);
}

/* ── (b) ROVERETO ────────────────────────────────────────────────────────
   Tenuto come RECORD del test di fattibilità, non come direzione: il Director
   ha scelto la tela. Verdetto misurato: leggeva come ghirlanda decorativa
   invece che come minaccia, cioè l'opposto del motivo per cui era stato
   proposto. L'identità di un rampicante è la FOGLIA (con picciolo, e grande
   abbastanza perché i lobi si leggano), non i rami — ed è per questo che costa
   area reale sul board.                                                      */

export interface BrambleOpts {
  vines: number;
  band: number;
  meander: number;
  thorns: boolean;
  leaves: boolean;
  /** taglia base della foglia in px — sotto ~14 i lobi non si leggono */
  leafSize: number;
  runners: number;
}

export const BRAMBLE_DEFAULTS: BrambleOpts = {
  vines: 22,
  band: 62,
  meander: 15,
  thorns: true,
  leaves: true,
  leafSize: 17,
  runners: 7,
};

function leafAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  size: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);

  /* picciolo: stacca la foglia dal ramo, senza sembra un nodulo */
  const pet = size * 0.42;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -pet);
  ctx.strokeStyle = INK.woodDark;
  ctx.lineWidth = Math.max(0.7, size * 0.07);
  ctx.stroke();

  ctx.translate(0, -pet);
  const S1 = size;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(S1 * 0.3, -S1 * 0.04, S1 * 0.62, -S1 * 0.1, S1 * 0.66, -S1 * 0.34);
  ctx.bezierCurveTo(S1 * 0.5, -S1 * 0.34, S1 * 0.46, -S1 * 0.42, S1 * 0.52, -S1 * 0.56);
  ctx.bezierCurveTo(S1 * 0.56, -S1 * 0.72, S1 * 0.36, -S1 * 0.74, S1 * 0.26, -S1 * 0.72);
  ctx.bezierCurveTo(S1 * 0.2, -S1 * 0.88, S1 * 0.08, -S1 * 0.98, 0, -S1 * 1.12);
  ctx.bezierCurveTo(-S1 * 0.08, -S1 * 0.98, -S1 * 0.2, -S1 * 0.88, -S1 * 0.26, -S1 * 0.72);
  ctx.bezierCurveTo(-S1 * 0.36, -S1 * 0.74, -S1 * 0.56, -S1 * 0.72, -S1 * 0.52, -S1 * 0.56);
  ctx.bezierCurveTo(-S1 * 0.46, -S1 * 0.42, -S1 * 0.5, -S1 * 0.34, -S1 * 0.66, -S1 * 0.34);
  ctx.bezierCurveTo(-S1 * 0.62, -S1 * 0.1, -S1 * 0.3, -S1 * 0.04, 0, 0);
  ctx.closePath();
  ctx.fillStyle = INK.leaf;
  ctx.fill();
  ctx.strokeStyle = INK.woodDark;
  ctx.lineWidth = Math.max(0.5, size * 0.045);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -S1 * 0.95);
  ctx.moveTo(0, -S1 * 0.3);
  ctx.lineTo(S1 * 0.44, -S1 * 0.46);
  ctx.moveTo(0, -S1 * 0.3);
  ctx.lineTo(-S1 * 0.44, -S1 * 0.46);
  ctx.strokeStyle = INK.woodDark;
  ctx.lineWidth = Math.max(0.4, S1 * 0.035);
  ctx.stroke();
  ctx.restore();
}

interface Stem {
  pts: { x: number; y: number }[];
  w0: number;
  w1: number;
}

export function drawBrambles(
  ctx: CanvasRenderingContext2D,
  S: ShapeCtx,
  o: BrambleOpts,
): void {
  const { cx, cy, k, rFrame } = S;
  const rnd = mulberry32(S.seed);
  drawArena(ctx, S, INK);
  drawStar(ctx, S, (a) => S.rStar(a), INK, () => S.rFrame);

  const stems: Stem[] = [];
  const P = (r: number, a: number) => ({
    x: cx + Math.cos(a) * r * k,
    y: cy + Math.sin(a) * r * k,
  });

  const rMid = rFrame - o.band * 0.45;
  for (let v = 0; v < o.vines; v += 1) {
    const a0 = rnd() * TAU;
    const dir = rnd() < 0.5 ? 1 : -1;
    const span = 0.8 + rnd() * 1.7;
    const freq = 2 + rnd() * 3;
    const phase = rnd() * TAU;
    const rBase = rMid + (rnd() - 0.5) * o.band * 0.55;
    const segs = 26;
    const pts: { x: number; y: number }[] = [];
    for (let s = 0; s <= segs; s += 1) {
      const t = s / segs;
      pts.push(P(rBase + Math.sin(t * freq + phase) * o.meander, a0 + dir * span * t));
    }
    const w0 = 2.6 + rnd() * 3.4;
    stems.push({ pts, w0, w1: w0 * 0.3 });

    const branches = 1 + Math.floor(rnd() * 2);
    for (let b = 0; b < branches; b += 1) {
      const at = 0.25 + rnd() * 0.5;
      const bSpan = span * (0.25 + rnd() * 0.3);
      const bDir = rnd() < 0.6 ? dir : -dir;
      const bSegs = 14;
      const bPts: { x: number; y: number }[] = [];
      const aStart = a0 + dir * span * at;
      const rStart = rBase + Math.sin(at * freq + phase) * o.meander;
      const rGoal = rStart + (rnd() - 0.5) * o.band * 0.9;
      for (let s = 0; s <= bSegs; s += 1) {
        const t = s / bSegs;
        bPts.push(
          P(
            rStart + (rGoal - rStart) * t + Math.sin(t * 4 + phase) * o.meander * 0.45,
            aStart + bDir * bSpan * t,
          ),
        );
      }
      const bw = w0 * (0.4 + rnd() * 0.25);
      stems.push({ pts: bPts, w0: bw, w1: bw * 0.22 });
    }
  }

  /* tralci radiali: agganciano la fascia alla stella, così sono UNA struttura */
  for (let i = 0; i < o.runners; i += 1) {
    const a = -Math.PI / 2 + (i / o.runners) * TAU + (rnd() - 0.5) * 0.35;
    const rIn = S.rStar(a) + 4;
    const segs = 18;
    const pts: { x: number; y: number }[] = [];
    const wig = 0.1 + rnd() * 0.18;
    for (let s = 0; s <= segs; s += 1) {
      const t = s / segs;
      pts.push(P(rIn + (rFrame - rIn) * t, a + Math.sin(t * 5) * wig * (1 - t)));
    }
    stems.push({ pts, w0: 1.1, w1: 3.4 });
  }

  /* intreccio: alone di fondo + ordine mescolato, così chi è disegnato dopo
     passa SOPRA. Non è intreccio vero (servirebbe spezzare i fusti agli incroci
     e ordinarli in profondità) ma è la tecnica con cui l'illustrazione
     vettoriale fa il tessuto. */
  const order = stems.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (const idx of order) {
    const st = stems[idx];
    fillTapered(ctx, st.pts, st.w0 + 3.2, st.w1 + 3.2, INK.field);
    fillTapered(ctx, st.pts, st.w0 + 1.4, st.w1 + 1.4, INK.woodDark);
    fillTapered(ctx, st.pts, st.w0, st.w1, INK.wood);
  }

  for (const idx of order) {
    const st = stems[idx];
    const n = st.pts.length;
    for (let i = 2; i < n - 1; i += 3) {
      const p = st.pts[i];
      const q = st.pts[i + 1];
      let tx = q.x - p.x;
      let ty = q.y - p.y;
      const l = Math.hypot(tx, ty) || 1;
      tx /= l;
      ty /= l;
      const side = i % 6 === 2 ? 1 : -1;
      const t = i / (n - 1);
      const w = st.w0 + (st.w1 - st.w0) * t;

      if (o.thorns && w > 1.1) {
        const len = 3.2 + w * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x - ty * side * w * 0.4, p.y + tx * side * w * 0.4);
        ctx.lineTo(p.x - ty * side * len + tx * len * 0.55, p.y + tx * side * len + ty * len * 0.55);
        ctx.lineTo(p.x + tx * w * 0.7, p.y + ty * w * 0.7);
        ctx.closePath();
        ctx.fillStyle = INK.wood;
        ctx.fill();
      }
      if (o.leaves && w > 1.0 && i % 3 === 2) {
        leafAt(ctx, p.x, p.y, Math.atan2(ty, tx) + (side > 0 ? 1.25 : -1.25), o.leafSize + w * 1.6);
      }
    }
  }
}
