/**
 * trama.ts — LA MATERIA DELLA DIFFICOLTA, SENZA CERCHIO. Desiderata v15.
 *
 * Il Director ha rifiutato tre volte «quella specie di cerchio attorno»:
 *
 *     «Vorrei si vedesse solo un'area della ragnatela orientativamente della
 *      dimensione corretta, non un cerchio.»
 *
 * PERCHE' NON RIUSO `drawWeb`. Non e' pigrizia al contrario: `drawWeb` E' una
 * tela intelaiata — telaio su `rFrameAt`, festone concavo, tiranti, e tutte le
 * trame che chiudono il giro. Il cerchio non e' un dettaglio da spegnere, e' la
 * sua struttura portante: l'ho spento tre volte e e' ricomparso da tre sorgenti
 * diverse (il taglio della lastra, il bordo del festone, l'ultimo giro di
 * trame). Qui il bordo chiuso non si spegne: NON ESISTE PER COSTRUZIONE.
 *
 * COME: nessun contorno. La tela e' solo ORDITO (raggi) e TRAME (fili
 * trasversali), e ogni raggio FINISCE DOVE VUOLE — la sua punta e' `rTrama`
 * meno un accorcio pseudocasuale. Le trame collegano raggi adiacenti e si
 * fermano al piu' corto dei due. Il risultato e' una frangia irregolare: la
 * massa dice la dimensione, nessuna linea dice il confine.
 *
 * IL VINCOLO CHE RESTA. L'area deve leggersi «orientativamente» giusta, perche'
 * l'area E' la probabilita'. Quindi l'accorcio e' PICCOLO (<=9%) e i finali si
 * ADDENSANO verso il muro invece di sfumare a nulla: se il bordo svanisse, la
 * pallina rimbalzerebbe contro il niente — ed e' esattamente il difetto che il
 * Director aveva segnalato sulle versioni precedenti.
 */

const TAU = Math.PI * 2;

export interface TramaInk {
  /** filo in luce */
  silk: string;
  /** filo in ombra, per lo spessore alternato */
  silkDim: string;
  /** nodi e gocce */
  bead: string;
}

export const TRAMA_INK: TramaInk = {
  silk: 'rgba(214,238,246,0.92)',
  silkDim: 'rgba(150,206,222,0.7)',
  bead: 'rgba(236,250,254,0.85)',
};

export interface TramaOpts {
  /** raggi dell'ordito */
  radii: number;
  /** numero di giri di trame */
  wefts: number;
  /** cedimento delle trame verso il centro: e' la gravita, e vieta il vortice */
  sag: number;
  /** accorcio massimo della punta di un raggio, frazione di rTrama */
  fray: number;
  /** quanti raggi portano una goccia */
  beads: number;
  seed: number;
}

/* TARATO A SCHERMO. Con 26 raggi e 7 giri la tela c'era ma non pesava: lo
   scoperto leggeva come vuoto scuro, e il fallimento deve essere una SUPERFICIE
   FORTE. Il numero che conta e' la densita' dei giri, non dei raggi: sono le
   trame a fare massa, i raggi fanno solo direzione. */
export const TRAMA_DEFAULTS: TramaOpts = {
  radii: 32, wefts: 13, sag: 0.15, fray: 0.09, beads: 0.3, seed: 0x51c5,
};

const rng32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export interface TramaCtx {
  cx: number;
  cy: number;
  /** raggio della trama per angolo, in px: e' rCheckAt scalato */
  rTrama: (theta: number) => number;
  /** raggio del nucleo da cui parte l'ordito */
  rCore: number;
  ink?: TramaInk;
}

/**
 * Disegna la trama. Nessun path chiuso viene mai costruito: chi cerca il cerchio
 * nel codice non lo trova, ed e' il punto.
 */
export function drawTrama(
  ctx: CanvasRenderingContext2D,
  c: TramaCtx,
  o: TramaOpts = TRAMA_DEFAULTS,
): void {
  const ink = c.ink ?? TRAMA_INK;
  const rnd = rng32(o.seed);
  const N = Math.max(6, Math.round(o.radii));

  /* punte dell'ordito: ognuna finisce dove vuole, ma vicino al muro.
     `pow(0.7)` addensa i finali verso l'esterno — la frangia si legge come un
     bordo sfrangiato e non come una dissolvenza. */
  const angs: number[] = [];
  const ends: number[] = [];
  for (let i = 0; i < N; i += 1) {
    /* passo angolare irregolare: a passo fisso il giro ridiventa una ghiera */
    const a = (i / N) * TAU + (rnd() - 0.5) * (TAU / N) * 0.55;
    angs.push(a);
    ends.push(c.rTrama(a) * (1 - o.fray * Math.pow(rnd(), 0.7)));
  }

  ctx.save();
  ctx.lineCap = 'round';

  /* ── ORDITO ── */
  for (let i = 0; i < N; i += 1) {
    const a = angs[i], r1 = ends[i];
    ctx.beginPath();
    ctx.moveTo(c.cx + Math.cos(a) * c.rCore, c.cy + Math.sin(a) * c.rCore);
    ctx.lineTo(c.cx + Math.cos(a) * r1, c.cy + Math.sin(a) * r1);
    /* spessore alternato: un reticolo a filo unico legge come griglia tecnica */
    ctx.lineWidth = i % 3 === 0 ? 1.15 : 0.7;
    ctx.strokeStyle = i % 3 === 0 ? ink.silk : ink.silkDim;
    ctx.stroke();
  }

  /* ── TRAME ── un arco fra due raggi adiacenti, che CEDE verso il centro.
     Il cedimento e' anti-vortice per costruzione: una curva che cede verso il
     centro non puo' leggersi come una spirale. */
  for (let w = 1; w <= o.wefts; w += 1) {
    const t = w / (o.wefts + 1);
    /* i giri si infittiscono verso il bordo: e' dove la massa deve stare */
    const u = Math.pow(t, 0.78);
    for (let i = 0; i < N; i += 1) {
      const j = (i + 1) % N;
      let a0 = angs[i], a1 = angs[j];
      if (a1 < a0) a1 += TAU;
      const r0 = c.rCore + (ends[i] - c.rCore) * u;
      const r1 = c.rCore + (ends[j] - c.rCore) * u;
      /* qualche filo manca: una tela integra al 100% legge come stampata */
      if (rnd() < 0.06) continue;
      const x0 = c.cx + Math.cos(a0) * r0, y0 = c.cy + Math.sin(a0) * r0;
      const x1 = c.cx + Math.cos(a1) * r1, y1 = c.cy + Math.sin(a1) * r1;
      const am = (a0 + a1) / 2;
      const rm = ((r0 + r1) / 2) * (1 - o.sag * (0.75 + rnd() * 0.5));
      const xm = c.cx + Math.cos(am) * rm, ym = c.cy + Math.sin(am) * rm;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(2 * xm - (x0 + x1) / 2, 2 * ym - (y0 + y1) / 2, x1, y1);
      ctx.lineWidth = w % 3 === 0 ? 0.95 : 0.62;
      ctx.strokeStyle = w % 2 === 0 ? ink.silk : ink.silkDim;
      ctx.globalAlpha = 0.72 + 0.28 * u;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  /* ── GOCCE ── solo nella fascia esterna, piccole: dicono «appiccicoso».
     Senza, la tela resta un reticolo di linee. Grandi, leggono come palline. */
  for (let i = 0; i < N; i += 1) {
    if (rnd() > o.beads) continue;
    const a = angs[i];
    const r = c.rCore + (ends[i] - c.rCore) * (0.72 + rnd() * 0.26);
    ctx.beginPath();
    ctx.arc(c.cx + Math.cos(a) * r, c.cy + Math.sin(a) * r, 0.9 + rnd() * 0.7, 0, TAU);
    ctx.fillStyle = ink.bead;
    ctx.fill();
  }
  ctx.restore();
}
