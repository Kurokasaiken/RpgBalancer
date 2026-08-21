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
  /**
   * ANCORAGGI MAESTRI imposti dall'host (angoli). Nella V7 sono gli obelischi:
   * stanno già sul muro, quindi ancorando la tela a loro il muro, i picchetti e
   * il telaio diventano UNA cosa sola invece di tre cerchi che si contraddicono.
   * Fra due maestri il modulo inserisce gli ancoraggi intermedi.
   */
  anchorAngles?: number[];
  /**
   * IL RAMO. Raggio a cui arrivano i fili di ancoraggio che escono dalla tela.
   * Una tela vera è appesa a qualcosa di esterno, e senza quei fili lo spazio
   * fra il muro e la cornice non appartiene a nessuno: a difficoltà 50 è il 72%
   * dell'area dentro la ghiera. Assente = nessun filo verso l'esterno.
   */
  rTether?: number;
  /**
   * IL MURO FISICO, distinto dal telaio della tela.
   *
   * Da quando la tela e' grande come il board, il suo telaio non e' piu' il muro:
   * il muro e' dove la pallina rimbalza e sta molto piu' dentro. Il confine viene
   * disegnato con le TRAME VERE della tela che passano da quelle parti, in
   * evidenza — non con un oggetto separato, che rischierebbe di diventare un
   * secondo goo.
   */
  rWallAt?: (theta: number) => number;
  /** lampo 0..1 del confine a un dato angolo: la regola si manifesta all'impatto */
  flashAt?: (theta: number) => number;
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
  | 'star' | 'starEdge' | 'tick' | 'tickMajor' | 'shade' | 'ward' | 'wardGlow',
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
  /* SOTTOFONDO SCURO DELLA SETA. Serve perché la tela adesso passa DAVANTI al
     fiore: una seta pallida su un petalo crema ha contrasto quasi nullo, e i
     raggi sopra la stella semplicemente non si vedevano. Stessa soluzione della
     pallina — porta il proprio contrasto invece di prenderlo in prestito: una
     passata scura più larga sotto il filo chiaro. Su fondo scuro è scuro su
     scuro e non si vede; sul crema è lei a reggere la lettura. */
  shade: 'rgba(4,8,14,0.9)',
  /* IL CONFINE. Altra famiglia di materiale: la seta e' fredda e diffusa, il
     confine e' glifo saturo. Deve dirsi "magico" e "regola", non "tela". */
  ward: 'rgba(238,232,255,1)',
  wardGlow: 'rgba(150,118,255,1)',
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
  /**
   * FILO-PONTE. Frazione iniziale del lancio in cui esiste UNA SOLA LINEA.
   *
   * Prima il primo mezzo secondo mostrava una miniatura della tela finita
   * all'8% di scala: una struttura completa e minuscola al centro esatto del
   * board, che legge come un bozzolo che si schiude — l'opposto di una tela
   * scoccata, e in contraddizione col fatto che la minaccia non deve nascere
   * dal centro dove poi sboccia la stella.
   *
   * Ogni tela reale comincia con un filo solo, teso da un appoggio all'altro
   * (il bridge thread). Come lettura è anche il gesto di un tiro: un filo
   * parte, colpisce, si tende. Quindi qui i primi `bridge` del lancio hanno una
   * riga e nient'altro; la struttura arriva dopo.
   */
  bridge: number;
  /**
   * LA TELA DAVANTI AL FIORE.
   *
   * A `false` (come era) il raggio parte dal contorno della stella: quando il
   * fiore sboccia i fili si accorciano dall'interno, cioe' la tela SI RITIRA
   * davanti al fiore e non gli passa mai sopra. Per questo cambiare l'ordine di
   * disegno non produceva alcun pixel diverso.
   *
   * A `true` il raggio e' radicato al MOZZO e attraversa la stella: il fiore
   * sboccia DIETRO la tela, e il premio si vede attraverso la trappola. Le
   * trame restano fuori dalla stella — nelle tele vere la spirale di cattura non
   * entra nella zona libera — quindi sopra il fiore passano solo i raggi: legge
   * come una GABBIA e non come un tessuto che impasta il premio.
   */
  overStar: boolean;
  /** raggio del mozzo come frazione del festone: sotto 0.12 legge come radar */
  hubR: number;
  /** stacco fra stella e prima trama, in unità engine */
  freeZone: number;
  /** tolleranza prima di considerare il telaio sfondato: a parità niente scintille */
  punchOut: number;
  /**
   * TELAIO SECONDARIO — è questo che toglie il cerchio.
   *
   * Il telaio primario deve stare SUL muro, perché il muro è fisico: è dove la
   * pallina rimbalza. Ma un bordo che sta su un muro quasi circolare legge come
   * un cerchio. Nelle tele vere la soluzione esiste già ed è il telaio
   * secondario: corde che tagliano gli angoli appena dentro il primario, con
   * cedimento VERSO IL CENTRO, e i raggi si attaccano a quelle.
   *
   * La concavità è la chiave. I tre bordi che ho sbagliato prima erano poligoni
   * CONVESSI (esagono, tridecagono) e leggevano come faccette; una corda tesa
   * fra due punti *deve* cedere all'interno, quindi la concavità non legge come
   * geometria, legge come tensione.
   *
   * 0 = spento (bordo sul muro, cioè il cerchio di prima).
   */
  secFrame: number;
  /** ancoraggi intermedi inseriti fra due maestri: 1 = un festone per mezzo settore */
  perSector: number;
  /** fili di ancoraggio verso il ramo: quanti per ogni maestro. 0 = spenti */
  tether: number;
  /**
   * LAMPO SPECULARE. La seta è una fibra speculare: cattura la luce a lampi
   * discontinui, non con un tratto a opacità costante — e un tratto a opacità
   * costante È line-art per definizione. Qui i fili perpendicolari alla luce
   * brillano e quelli paralleli si spengono, con una sola direzione di luce.
   */
  glint: number;
  /** alone diffuso sotto ogni filo: trasforma il tratto in FIBRA. 0 = spento */
  halo: number;
  /** gocce viscide sulla spirale di cattura (frazione dei punti candidati) */
  beads: number;
  /** nodi agli incroci: due linee che si sovrappongono leggono come vettoriale */
  knots: boolean;
  /**
   * IL BORDO SPESSO E' IL FALLIMENTO CRITICO — non e' estetica (Director).
   *
   * Il confine e' un giro di trame vere appese al muro. Ogni trama CEDE verso il
   * mozzo, quindi fra la corda e il muro resta una lunetta, e l'insieme delle
   * lunette e' la fascia di fallimento critico: se la pallina si ferma li',
   * critico.
   *
   * La proprieta' che rende la cosa onesta e non decorativa: l'area della fascia
   * dipende SOLO dalla struttura della tela (numero di raggi x cedimento) e non
   * dalla difficolta'. Misurato identico a difficolta' 20, 50 e 80:
   *
   *     raggi 14 → 9.22%   raggi 18 → 6.35%
   *     raggi 22 → 5.23%   raggi 26 → 3.93%     (cedimento 0.17)
   *
   * Qui il giro viene poi scalato per bisezione fino a far valere alla fascia
   * ESATTAMENTE `critBand`%. Cosi' la FORMA resta casuale — segue il jitter dei
   * raggi, quindi la fascia e' spessa dove i raggi sono larghi e sottile dove
   * sono vicini, e cambia a ogni tiro — mentre il NUMERO e' imposto.
   * Forma libera, area esatta.
   *
   * 0 = nessun confine in evidenza.
   */
  critBand: number;
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
  overStar: true,
  hubR: 0.15,
  bridge: 0.18,
  secFrame: 0.16,
  perSector: 1,
  tether: 2,
  glint: 0.45,
  halo: 0.1,
  beads: 0.14,
  knots: true,
  critBand: 5,
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
  /* IL FILO-PONTE consuma la prima frazione del lancio: prima c'e' una riga
     sola, poi la struttura parte da zero sul tempo rimasto. */
  const L0 = cl01(A.launch);
  const L = o.bridge > 0 ? cl01((L0 - o.bridge) / (1 - o.bridge)) : L0;
  const bridgeP = o.bridge > 0 ? cl01(L0 / o.bridge) : 1;
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

  /* ── LAMPO SPECULARE ────────────────────────────────────────────────────
     Una sola direzione di luce, dall'alto a sinistra come da art direction. Un
     filo perpendicolare alla luce la riflette verso chi guarda e brilla; uno
     parallelo si spegne. Senza questo l'opacita' e' costante lungo tutta la
     tela, e un tratto a opacita' costante E' line-art per definizione. */
  const LIGHT = -Math.PI * 0.75;
  const glintAt = (a: number) => {
    if (o.glint <= 0) return 1;
    const f = Math.abs(Math.sin(a - LIGHT));            // 0 parallelo, 1 perpendicolare
    return 1 - o.glint * (1 - f * f);
  };

  /* ── ANCORAGGI ──────────────────────────────────────────────────────────
     Se l'host li impone (`anchorAngles`) quelli sono i MAESTRI — nella V7 gli
     obelischi — e fra due maestri si inseriscono `perSector` intermedi. Se non
     li impone, si generano come prima. Tutti stanno SUL muro: è il muro che
     porta il telaio primario, perché il muro è fisico. */
  const ancA: number[] = [];
  const ancMaster: boolean[] = [];
  if (S.anchorAngles && S.anchorAngles.length >= 3) {
    const M = S.anchorAngles.length;
    const per = Math.max(0, Math.round(o.perSector));
    for (let i = 0; i < M; i += 1) {
      const a0 = S.anchorAngles[i];
      let a1 = S.anchorAngles[(i + 1) % M];
      while (a1 <= a0) a1 += TAU;
      ancA.push(a0);
      ancMaster.push(true);
      for (let j = 1; j <= per; j += 1) {
        /* jitter sugli intermedi: festoni tutti uguali leggono come un centrino.
           I maestri restano dove li vuole il gioco, l'irregolarita' sta fra loro. */
        const base = ((a1 - a0) * j) / (per + 1);
        ancA.push(a0 + base + (rndAnc() - 0.5) * (a1 - a0) * 0.22);
        ancMaster.push(false);
      }
    }
  } else {
    const AN0 = Math.max(3, o.anchors);
    for (let i = 0; i < AN0; i += 1) {
      ancA.push(-Math.PI / 2 + (i / AN0) * TAU + (rndAnc() - 0.5) * (TAU / AN0) * 0.55);
      ancMaster.push(i % 3 === 0);
    }
    ancA.sort((x, y) => x - y);
  }
  const AN = ancA.length;
  const ancR = ancA.map((a) => wallAt(a) * (1 - rndAnc() * o.anchorJitter));

  /** TELAIO PRIMARIO: sta sul muro. Interpola il jitter, non taglia le corde. */
  const frameRadiusAt = (a: number): number => {
    const t = ((a - ancA[0]) % TAU + TAU) % TAU;
    let i = AN - 1;
    for (let j = 0; j < AN; j += 1) {
      const t0 = ((ancA[j] - ancA[0]) % TAU + TAU) % TAU;
      const t1 = j + 1 < AN ? ((ancA[j + 1] - ancA[0]) % TAU + TAU) % TAU : TAU;
      if (t >= t0 && t < t1) {
        i = j;
        break;
      }
    }
    const j = (i + 1) % AN;
    const t0 = ((ancA[i] - ancA[0]) % TAU + TAU) % TAU;
    const t1 = i + 1 < AN ? ((ancA[j] - ancA[0]) % TAU + TAU) % TAU : TAU;
    const f = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
    const sm = f * f * (3 - 2 * f);
    /* il rapporto ancoraggio/muro interpolato: il telaio segue il muro con la
       sua irregolarità, senza diventare un poligono */
    const k0 = ancR[i] / Math.max(1, wallAt(ancA[i]));
    const k1 = ancR[j] / Math.max(1, wallAt(ancA[j]));
    return wallAt(a) * (k0 + (k1 - k0) * sm);
  };

  /** TELAIO SECONDARIO: il festone concavo fra due ancoraggi. È il bordo del
   *  CORPO della tela — i raggi si attaccano qui, non al primario. */
  const rimAt = (a: number): number => {
    const prim = frameRadiusAt(a);
    if (o.secFrame <= 0) return prim;
    let i = AN - 1;
    const t = ((a - ancA[0]) % TAU + TAU) % TAU;
    for (let j = 0; j < AN; j += 1) {
      const t0 = ((ancA[j] - ancA[0]) % TAU + TAU) % TAU;
      const t1 = j + 1 < AN ? ((ancA[j + 1] - ancA[0]) % TAU + TAU) % TAU : TAU;
      if (t >= t0 && t < t1) {
        i = j;
        break;
      }
    }
    const j = (i + 1) % AN;
    const a0 = ancA[i];
    let a1 = ancA[j];
    while (a1 <= a0) a1 += TAU;
    let aa = a;
    while (aa < a0) aa += TAU;
    while (aa > a1) aa -= TAU;
    const f = (a1 - a0) / 1 > 0 ? (aa - a0) / (a1 - a0) : 0;
    /* la CORDA fra i due ancoraggi (che già scende sotto il muro), più il
       cedimento verso il centro: campana, massima a metà, zero agli ancoraggi */
    const half = (a1 - a0) / 2;
    const chordR = Math.cos(half) / Math.max(1e-6, Math.cos(half - (aa - a0)));
    const bell = Math.sin(f * Math.PI);
    const sag = o.secFrame * 2 * Math.sin(half) * bell;
    const r = prim * (chordR - sag);
    return Math.min(prim, Math.max(prim * 0.55, r));
  };

  const rsAt = (a: number) => S.rStar(a) * A.starS;

  /* Il FALLIMENTO CRITICO NON E' SUL BOARD — decisione del Director. Il 5% viene
     dato dal sistema, l'esito e' scelto a monte, e il board mette in scena solo
     l'esito geometrico onesto: la HUD dice il resto. Quindi qui non esiste ne'
     una regione dedicata, ne' un agente, ne' un tetto alle valli — c'era, era
     misurato a 0.13% d'area con sacche larghe 3px, ed e' stato rimosso.
     Conseguenza accettata: a vantaggio schiacciante la rete puo' sparire del
     tutto, e va bene — vuol dire che hai coperto tutto. */
  /* lo sfondamento si misura sul telaio PRIMARIO, che è il muro: è quello che
     la stella deve bucare per uscire dall'arena. Il festone secondario è più
     dentro, quindi i raggi muoiono prima — ma il muro cede solo qui. */
  const punchedAt = (a: number) => rsAt(a) >= frameRadiusAt(a) * (1 + o.punchOut);

  if (A.showStar) drawStar(ctx, S, rsAt, C, frameRadiusAt);

  /* ── IL FILO-PONTE ──────────────────────────────────────────────────────
     Una riga sola, tesa fra due ancoraggi ai lati del tiro, che si allunga e si
     tende. Finche' non e' arrivata NON esiste nient'altro: e' il primo gesto di
     ogni tela vera ed e' l'unico modo di non far nascere la minaccia come un
     bozzolo al centro del board. */
  if (o.bridge > 0 && bridgeP < 1) {
    const iA = ancA.reduce(
      (best, a, i) => (Math.abs(sweepAt(a) - 0.28) < Math.abs(sweepAt(ancA[best]) - 0.28) ? i : best),
      0,
    );
    const iB = ancA.reduce(
      (best, a, i) => (Math.abs(sweepAt(a) - 0.34) < Math.abs(sweepAt(ancA[best]) - 0.34) && i !== iA ? i : best),
      0,
    );
    const pA = { x: cx + Math.cos(ancA[iA]) * ancR[iA] * k, y: cy + Math.sin(ancA[iA]) * ancR[iA] * k };
    const pB = { x: cx + Math.cos(ancA[iB]) * ancR[iB] * k, y: cy + Math.sin(ancA[iB]) * ancR[iB] * k };
    const e = easeOut3(bridgeP);
    const SEG = 16;
    const pts: { x: number; y: number }[] = [];
    for (let q = 0; q <= SEG; q += 1) {
      const u = (q / SEG) * e;
      /* il filo cede mentre e' ancora lasso e si tende arrivando */
      const droop = Math.sin((q / SEG) * Math.PI) * (1 - e) * 46 * k;
      pts.push({ x: pA.x + (pB.x - pA.x) * u, y: pA.y + (pB.y - pA.y) * u + droop });
    }
    if (o.halo > 0) {
      ctx.globalAlpha = o.halo * 1.6;
      fillTapered(ctx, pts, 5.0, 4.0, C.frame);
      ctx.globalAlpha = 1;
    }
    fillTapered(ctx, pts, 2.2, 1.4, C.frame);
    ctx.beginPath();
    ctx.arc(pA.x, pA.y, 2.6, 0, TAU);
    ctx.fillStyle = C.frame;
    ctx.fill();
    if (e >= 1) {
      ctx.beginPath();
      ctx.arc(pB.x, pB.y, 2.6, 0, TAU);
      ctx.fill();
    }
    if (!S.skipArena) drawDroplets(ctx, [], C);
    return;
  }

  /* ── ORDITO ─────────────────────────────────────────────────────────── */
  const ang: number[] = [];
  for (let i = 0; i < N; i += 1) {
    ang.push(-Math.PI / 2 + (i / N) * TAU + (rndAng() - 0.5) * (TAU / N) * 0.6);
  }
  ang.sort((x, y) => x - y);

  const rInner: number[] = [];
  const weftInner: number[] = [];
  const rOuter: number[] = [];
  const dead: boolean[] = [];

  for (let i = 0; i < N; i += 1) {
    const a = ang[i];
    const rOut = rimAt(a);
    rOuter.push(rOut);

    /* La zona libera non puo' essere assoluta: nelle sacche del fallimento
       critico l'anello disponibile scende a 4-12 unita', meno della freeZone
       stessa, e i raggi morivano tutti (span <= 0.5). Qui e' proporzionale
       all'anello, con un tetto sul valore nominale. */
    const gapAvail = Math.max(0, rOut - rsAt(a));
    const fz = Math.min(o.freeZone, gapAvail * 0.35);
    /* IL MOZZO: sotto il 12% del festone venti raggi convergono in un punto
       matematico e la tela legge come un grafico a raggi. Nelle tele vere e' il
       15-25% e i raggi non si toccano al centro. */
    const hub = Math.max(fz, rOut * o.hubR);
    /* la radice del filo: al mozzo (tela DAVANTI al fiore) o al contorno della
       stella (tela che si ritira). Le trame partono comunque dalla stella. */
    const r0Adj = o.overStar ? hub : rsAt(a) + fz;
    /* UNA SOLA CAUSA DI MORTE: lo sfondamento del telaio. Prima c'era anche
       `span <= 0.5`, e a parita' perfetta faceva svanire 3 raggi su 26 nel frame
       culminante — dove per specifica non deve accadere niente. Era un tell
       FALSO. Ora uno span piccolo ACCORCIA il filo, non lo cancella. */
    const span = Math.max(0, rOut - r0Adj);
    rInner.push(r0Adj);
    /* limite interno delle TRAME: sempre il contorno della stella, anche quando
       i raggi la attraversano */
    weftInner.push(Math.max(rsAt(a) + fz, hub));
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
    /* CALIBRI: cavo di telaio 2.6, raggio 1.6, corda 1.2. Il rapporto c'era
       gia', il valore assoluto no — sotto 1px lo schermo butta via meta' del
       segnale, e la delicatezza la deve portare l'alone, non la sottigliezza. */
    if (o.halo > 0) {
      ctx.globalAlpha = o.halo;
      fillTapered(ctx, pts, 4.2, 3.0, C.silk);
      ctx.globalAlpha = 1;
    }
    /* sottofondo scuro: e' cio' che rende il filo leggibile sul petalo */
    fillTapered(ctx, pts, 3.0, 2.2, C.shade);
    ctx.globalAlpha = glintAt(a);
    fillTapered(ctx, pts, 1.6, 1.0, C.silk);
    ctx.globalAlpha = 1;
  }

  /* ── TELAIO ─────────────────────────────────────────────────────────────
     IL BORDO NON E' UN CERCHIO, e non puo' esserlo: il tratto piu' esterno e
     piu' contrastato e' quello che decide la forma percepita, e un tratto sul
     muro (che e' quasi circolare, perche' e' fisico) legge come cerchio.

     Una tela vera, guardata di fronte, NON ha un bordo circolare: ha pochi fili
     di telaio tesi fra pochi ancoraggi, e ogni filo cede verso il centro. Il
     tondo di una tela e' la spirale di cattura DENTRO, non il perimetro.

     Quindi qui il fascio segue il FESTONE (`rimAt`), che passa per gli
     ancoraggi e cede all'interno fra l'uno e l'altro. Il muro resta segnato dai
     nodi degli ancoraggi e dai tiranti che ne escono — cioe' dai punti in cui
     la tela lo tocca davvero — e non da un anello disegnato.

     La concavita' e' la chiave: i tre bordi che ho sbagliato prima erano
     poligoni CONVESSI e leggevano come faccette. Un filo teso fra due punti
     DEVE cedere all'interno, quindi la concavita' non legge come geometria,
     legge come tensione. */
  const fpt = ancA.map((a, i) => P(ancR[i], a));
  {
    const SEG = 24;
    for (let i = 0; i < AN; i += 1) {
      const j = (i + 1) % AN;
      const a0 = ancA[i];
      let a1 = ancA[j];
      while (a1 <= a0) a1 += TAU;
      const aMid = (a0 + a1) / 2;
      if (punchedAt(aMid)) continue;
      const pts: { x: number; y: number }[] = [];
      for (let q = 0; q <= SEG; q += 1) {
        const a = a0 + ((a1 - a0) * q) / SEG;
        pts.push(P(rimAt(a), a));
      }
      if (o.halo > 0) {
        ctx.globalAlpha = o.halo * 1.4;
        fillTapered(ctx, pts, 5.4, 5.4, C.frame);
        ctx.globalAlpha = 1;
      }
      /* due passate quasi parallele: un filo di telaio vero e' rinforzato */
      fillTapered(ctx, pts, 4.2, 4.2, C.shade);
      ctx.globalAlpha = glintAt(aMid);
      fillTapered(ctx, pts, 2.6, 2.6, C.frame);
      ctx.globalAlpha = glintAt(aMid) * 0.45;
      const jx = (rndFrm() - 0.5) * 2.4;
      const jy = (rndFrm() - 0.5) * 2.4;
      fillTapered(
        ctx,
        pts.map((p) => ({ x: p.x + jx, y: p.y + jy })),
        1.1,
        1.1,
        C.frame,
      );
      ctx.globalAlpha = 1;
    }
  }
  for (let i = 0; i < AN; i += 1) {
    if (punchedAt(ancA[i])) continue;
    ctx.beginPath();
    ctx.arc(fpt[i].x, fpt[i].y, ancMaster[i] ? 2.6 : 1.7, 0, TAU);
    ctx.fillStyle = C.frame;
    ctx.fill();
  }

  /* ── TIRANTI: la tela è APPESA a qualcosa ───────────────────────────────
     Fili che escono dagli ancoraggi maestri e vanno al ramo. Senza, lo spazio
     fra il muro e la cornice non appartiene a nessuno — a difficoltà 50 è il
     72% dell'area dentro la ghiera — e la tela sembra piccola invece di
     sospesa. Con questi, la cornice diventa il ramo a cui è legata. */
  if (o.tether > 0 && S.rTether && S.rTether > rFrame) {
    const T = Math.max(1, Math.round(o.tether));
    for (let i = 0; i < AN; i += 1) {
      if (!ancMaster[i]) continue;
      if (punchedAt(ancA[i])) continue;
      for (let t = 0; t < T; t += 1) {
        /* i tiranti DIVERGONO: un ancoraggio vero è tenuto da più fili che
           vanno in punti diversi, ed è la divergenza a far leggere "appeso" */
        const spread = (t - (T - 1) / 2) * 0.16 + (rndFrm() - 0.5) * 0.05;
        const SEG = 10;
        const pts: { x: number; y: number }[] = [];
        for (let q = 0; q <= SEG; q += 1) {
          const u = q / SEG;
          const r = ancR[i] + (S.rTether - ancR[i]) * u;
          const a = ancA[i] + spread * u;
          /* cedimento verso il basso in coordinate mondo, come per l'ordito */
          const droop = Math.sin(u * Math.PI) * 0.05 * (S.rTether - ancR[i]);
          const p = P(r, a);
          pts.push({ x: p.x, y: p.y + droop * k });
        }
        if (o.halo > 0) {
          ctx.globalAlpha = o.halo * 0.8;
          fillTapered(ctx, pts, 3.0, 2.2, C.frame);
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = glintAt(ancA[i]) * 0.85;
        fillTapered(ctx, pts, 1.5, 0.7, C.frame);
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ── TRAME ──────────────────────────────────────────────────────────────
     Corde fra raggi consecutivi. NON piu' a raggio uniforme: ogni corda si
     posiziona sulla FRAZIONE u della campata del suo raggio, fra il mozzo (0) e
     il festone (1). Cambia tutto per due motivi:
       - a raggio uniforme le corde erano cerchi concentrici, e con le tacche
         degli assi sopra il risultato leggeva come un grafico a radar;
       - seguendo la campata, le corde sono parallele al festone in periferia e
         parallele al mozzo al centro: e' cosi' che si dispone una spirale di
         cattura vera, e il festone concavo si propaga a tutto il corpo.
     Il gradino fra un raggio e il successivo e' cio' che fa scendere la corda.
     Esistono tutte dal primo frame: e' il lancio che le porta fuori. */
  const alive = weftInner.map((r, i) => (dead[i] ? Infinity : r));
  const minInner = Math.min(...alive);
  /* Niente early return: quando tutti i raggi sono morti usciva di qui e
     cancellava anche trame, mozzo e gocce — la rete SPARIVA in un frame. Ora
     salta le sole trame, che senza raggi vivi non hanno appigli. */
  if (!Number.isFinite(minInner)) {
    drawDroplets(ctx, [], C);
    return;
  }

  const drops: { x: number; y: number }[] = [];
  const knots: { x: number; y: number }[] = [];
  ctx.lineCap = 'round';
  const span = rOuter.map((ro, i) => Math.max(0, ro - weftInner[i]));
  const maxSpan = Math.max(...span, 1);
  /* passo in frazione di campata, non in unita' engine */
  const du = Math.max(0.012, o.weftStep / maxSpan);
  const rAtU = (i: number, u: number) => weftInner[i] + span[i] * cl01(u);
  const turns = Math.floor(1 / du);
  for (let t = 0; t < turns; t += 1) {
    for (let i = 0; i < N; i += 1) {
      const j = (i + 1) % N;
      if (dead[i] || dead[j]) continue;
      /* il gradino: la corda scende di 1/N di passo passando da un raggio al
         successivo, quindi il giro non si chiude su se stesso */
      const u0 = 1 - t * du - (i / N) * du;
      const u1 = u0 - du / N;
      if (u1 <= 0.015) continue;
      if (span[i] < 1 || span[j] < 1) continue;

      const p0 = P(rAtU(i, u0), ang[i]);
      const p1 = P(rAtU(j, u1), ang[j] + (j === 0 ? TAU : 0));
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const chord = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      /* CEDIMENTO VARIABILE: era una frazione costante, quindi tutte le corde si
         assomigliavano e il risultato leggeva come griglia. Ora dipende dalla
         corda e da un seed per raggio: tensione disomogenea, come in una tela. */
      const rr = rayRnd(i * 31 + t);
      const pull = o.sag * chord * (0.7 + 0.6 * rr());
      const dx = cx + offX - mx;
      const dy = cy + offY - my;
      const dl = Math.hypot(dx, dy) || 1;
      const qx = mx + (dx / dl) * pull + (rndWft() - 0.5) * o.wobble;
      const qy = my + (dy / dl) * pull + (rndWft() - 0.5) * o.wobble;

      /* ALONE: la seta diffonde la luce. Senza questa passata un filo e' un
         tratto; con questa e' una fibra. E' la modifica col miglior rapporto
         costo/effetto di tutto il pacchetto. */
      if (o.halo > 0) {
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(qx, qy, p1.x, p1.y);
        ctx.strokeStyle = C.silkDim;
        ctx.globalAlpha = o.halo;
        ctx.lineWidth = 3.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(qx, qy, p1.x, p1.y);
      ctx.strokeStyle = C.silkDim;
      ctx.globalAlpha = glintAt((ang[i] + ang[j]) / 2);
      ctx.lineWidth = 1.2;   // sotto 1px lo schermo butta via meta' del segnale
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* NODI: due linee che si sovrappongono leggono come vettoriale. Un punto
         dove la corda incontra il raggio dice ANNODATO invece di DISEGNATO. */
      if (o.knots) knots.push(p0);
      /* GOCCE VISCIDE: nella letteratura di rendering delle tele sono LA
         tecnica. Le avevo spente per paura che leggessero come palline: la
         risposta giusta non e' spegnerle, e' 1px contro una pallina da 9px con
         alone, poche e solo nella fascia esterna. */
      if (o.beads > 0 && u0 > 0.45 && rndWft() < o.beads) drops.push({ x: qx, y: qy });
    }
  }
  if (o.knots) {
    ctx.fillStyle = C.silk;
    ctx.globalAlpha = 0.75;
    for (const p of knots) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.85, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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

  drawDroplets(ctx, o.droplets ? drops : [], C);

  /* ── IL CONFINE: TRAME VERE IN EVIDENZA ────────────────────────────────
     Prima si disegna la tela intera, poi si ripassa in evidenza la parte che fa
     da muro: un oggetto, due letture. Le barre viola separate sono state
     smontate — un highlight su fili che esistono gia' non puo' diventare un
     secondo goo, perche' non ha materia propria.

     PERCHE' UNA TRAMA FA DA MURO PER COSTRUZIONE: una trama cede verso il mozzo,
     quindi il suo punto piu' interno e' a meta'. Fra la corda e il muro resta una
     LUNETTA, e l'insieme delle lunette e' la fascia di fallimento critico.

     L'area della fascia dipende solo da (raggi x cedimento), non dalla
     difficolta' — verificato identico a 20, 50 e 80. Qui il giro viene scalato
     per bisezione finche' la fascia vale esattamente `critBand`%: la forma resta
     casuale e cambia a ogni tiro, il numero e' imposto. */
  if (o.critBand > 0 && S.rWallAt) {
    const wl = S.rWallAt;
    /* area dell'arena (integrale polare) */
    let aArena = 0;
    const M = 720;
    for (let i = 0; i < M; i += 1) aArena += 0.5 * wl(-Math.PI / 2 + (i / M) * TAU) ** 2 * (TAU / M);
    /* il giro di corde al fattore di scala sc, campionato */
    const ringAt = (sc: number) => {
      const out: { x: number; y: number }[] = [];
      for (let i = 0; i < N; i += 1) {
        const a0 = ang[i];
        const a1 = i + 1 < N ? ang[i + 1] : ang[0] + TAU;
        const r0 = wl(a0) * sc;
        const r1 = wl(a1) * sc;
        const x0 = Math.cos(a0) * r0;
        const y0 = Math.sin(a0) * r0;
        const x1 = Math.cos(a1) * r1;
        const y1 = Math.sin(a1) * r1;
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        const chord = Math.hypot(x1 - x0, y1 - y0);
        const dl = Math.hypot(mx, my) || 1;
        const pull = o.sag * chord;
        const qx = mx - (mx / dl) * pull;
        const qy = my - (my / dl) * pull;
        for (let q = 0; q < 10; q += 1) {
          const t = q / 10;
          const u = 1 - t;
          out.push({
            x: u * u * x0 + 2 * u * t * qx + t * t * x1,
            y: u * u * y0 + 2 * u * t * qy + t * t * y1,
          });
        }
      }
      return out;
    };
    const polyArea = (p: { x: number; y: number }[]) => {
      let A = 0;
      for (let i = 0; i < p.length; i += 1) {
        const q = p[(i + 1) % p.length];
        A += p[i].x * q.y - q.x * p[i].y;
      }
      return Math.abs(A) / 2;
    };
    const target = aArena * (1 - o.critBand / 100);
    let lo = 0.55;
    let hi = 1.25;
    for (let it = 0; it < 22; it += 1) {
      const m = (lo + hi) / 2;
      if (polyArea(ringAt(m)) > target) hi = m;
      else lo = m;
    }
    const sc = (lo + hi) / 2;

    /* disegno: per ogni settore la corda in evidenza, piu' il NODO agli estremi.
       "Non solo i nodi" (Director): la linea porta il confine, il nodo lo ancora. */
    for (let i = 0; i < N; i += 1) {
      const a0 = ang[i];
      const a1 = i + 1 < N ? ang[i + 1] : ang[0] + TAU;
      const r0 = wl(a0) * sc;
      const r1 = wl(a1) * sc;
      const p0 = P(r0, a0);
      const p1 = P(r1, a1);
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const chord = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const dx = cx + offX - mx;
      const dy = cy + offY - my;
      const dl = Math.hypot(dx, dy) || 1;
      const pull = o.sag * chord;
      const qx = mx + (dx / dl) * pull;
      const qy = my + (dy / dl) * pull;
      const fl = S.flashAt ? cl01(S.flashAt((a0 + a1) / 2)) : 0;
      const br = 0.82 + 0.18 * Math.sin((a0 + a1) * 3.1);

      /* LA LUNETTA RIEMPITA: e' QUESTO lo "spessore" del bordo, e vale il 5%.
         Il bordo non e' una linea con un alone decorativo: e' una FASCIA, il suo
         bordo interno e' una trama vera, il suo bordo esterno e' il muro fisico
         (quindi la pallina rimbalza sul disegno, non contro il nulla), e la sua
         area e' il fallimento critico. Spessa dove i raggi sono larghi, sottile
         dove sono vicini: la casualita' della tela si vede nello spessore. */
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(qx, qy, p1.x, p1.y);
      {
        const STEP = 10;
        for (let q = STEP; q >= 0; q -= 1) {
          const aw = a0 + ((a1 - a0) * q) / STEP;
          const pw = P(wl(aw), aw);
          ctx.lineTo(pw.x, pw.y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = C.wardGlow;
      ctx.globalAlpha = (0.13 + 0.22 * fl) * br;
      ctx.fill();
      ctx.globalAlpha = 1;
      const pass = (w: number, alpha: number, col: string) => {
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(qx, qy, p1.x, p1.y);
        ctx.lineWidth = w;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = w * 2.1;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      };
      pass(12 + 10 * fl, (0.13 + 0.3 * fl) * br, C.wardGlow);
      pass(5.2, 0.5, C.shade);            // stacca dal petalo crema
      pass(3.4 + 1.6 * fl, (0.5 + 0.4 * fl) * br, C.wardGlow);
      pass(1.7 + 1.1 * fl, 0.92 + 0.08 * fl, C.ward);
      /* i nodi: dove il confine e' annodato al proprio raggio */
      for (const p of [p0, p1]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4 + 1.6 * fl, 0, TAU);
        ctx.fillStyle = C.ward;
        ctx.shadowColor = C.wardGlow;
        ctx.shadowBlur = 8 + 8 * fl;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

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
