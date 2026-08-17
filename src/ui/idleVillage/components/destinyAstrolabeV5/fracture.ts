/**
 * fracture.ts — FUNZIONI PURE del terremoto V5.
 *
 * Gemello di `simulation.ts`: nessun DOM, tutto in spazio normalizzato,
 * deterministico a parità di seed.
 *
 * L'idea: il campo di ossidiana è una LASTRA dipinta SOPRA il backdrop verde
 * stellato (che è già un canvas offscreen separato). Spaccarla non significa
 * dipingere una crepa: significa `clip(crackPath)` + `drawImage(backdrop)`.
 * Il cielo non si disegna, si SMASCHERA — zero colori nuovi, zero asset nuovi,
 * zero emettitori nuovi.
 *
 * L'antitesi, verificabile a schermo:
 *   LA FERITA SI CHIUDE, LA MORTE RESTA APERTA.
 *
 * DETERMINISMO — vincolo duro: l'RNG della frattura è SALATO e locale
 * (`fractureSeedSalt`, distinto dal salt della traiettoria). Non deve mai
 * consumare dallo stream che produce roll/riskRoll/landing: una sola chiamata
 * rng() inserita prima di riskRoll cambierebbe TUTTI gli esiti a parità di seed
 * e invaliderebbe ogni test deterministico esistente.
 */
import {
  TAU,
  type GeometrySnapshot,
  rChallengeAt,
  valleyAngle,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import { type Point, createRng, inCrown, inVoid } from '@/ui/idleVillage/components/destinyAstrolabeV3/zones';
import type { AstrolabeOutcome } from '@/ui/idleVillage/components/destinyAstrolabeV3/simulation';
import type { AstrolabeV5Config } from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';

export type FractureTier = 'none' | 'fissure' | 'rift';
export type FractureKind = 'none' | 'wound' | 'death';

export interface FractureNode {
  x: number;
  y: number;
  /** Semilarghezza del nastro in questo nodo (0 in punta). */
  w: number;
}

export interface FractureBranch {
  nodes: FractureNode[];
  generation: number;
  /** I tronchi partono dall'epicentro e arrivano al bordo: sono quelli che
   *  partizionano la lastra in piastre. I rami muoiono all'interno. */
  isTrunk: boolean;
  parentIndex: number | null;
}

export interface FractureDebris {
  x: number;
  y: number;
  r: number;
  rot: number;
}

export interface FractureModel {
  tier: FractureTier;
  kind: FractureKind;
  epicenter: Point;
  /** false quando l'epicentro è un ripiego: il landing non provava il rischio. */
  epicenterIsLanding: boolean;
  branches: FractureBranch[];
  /** Piastre delimitate dai tronchi. Modellate sempre, spostate solo se
   *  `fracturePlateDisplacement` (costa un ridisegno del campo per frame). */
  plates: Point[][];
  debris: FractureDebris[];
  shakeAmp: number;
  shakeTauMs: number;
  /** La calotta sprofonda solo se morte E landing GIÀ dentro una voragine:
   *  in quel caso l'affondamento è tautologico ('void' resta 'void'). */
  capSinks: boolean;
  capRadius: number;
  totalNodes: number;
}

const EMPTY: FractureModel = {
  tier: 'none',
  kind: 'none',
  epicenter: { x: 0, y: 0 },
  epicenterIsLanding: false,
  branches: [],
  plates: [],
  debris: [],
  shakeAmp: 0,
  shakeTauMs: 0,
  capSinks: false,
  capRadius: 0,
  totalNodes: 0,
};

const wrapAngle = (a: number): number => {
  let t = a;
  while (t > Math.PI) t -= TAU;
  while (t < -Math.PI) t += TAU;
  return t;
};

/**
 * Epicentro onesto.
 *
 * Serve davvero: il doppio fallback di `pickLandingPoint` rilassa i vincoli
 * secondari e può restituire un punto che non prova il rischio (o (0,0)).
 * Senza questo ramo la crepa nascerebbe da un punto che non ha niente a che
 * vedere con la ferita.
 */
export function pickEpicenter(
  kind: FractureKind,
  snap: GeometrySnapshot,
  landing: Point,
  exclusionR = 0,
): { point: Point; isLanding: boolean } {
  /* Un epicentro di ripiego che cadesse addosso alla pallina rimetterebbe in
     scena proprio ciò che l'esclusione serve a evitare: lo si spinge fuori. */
  const pushOut = (p: Point): Point => {
    if (exclusionR <= 0) return p;
    const dx = p.x - landing.x;
    const dy = p.y - landing.y;
    const d = Math.hypot(dx, dy);
    if (d >= exclusionR) return p;
    if (d < 1e-9) {
      const a = Math.atan2(landing.y, landing.x) + Math.PI / 2;
      return { x: landing.x + Math.cos(a) * exclusionR, y: landing.y + Math.sin(a) * exclusionR };
    }
    return { x: landing.x + (dx / d) * exclusionR, y: landing.y + (dy / d) * exclusionR };
  };

  if (kind === 'death') {
    if (inVoid(landing, snap)) return { point: landing, isLanding: true };
    /* ripiego: la bocca di morte più vicina */
    let best = snap.voidCenters[0] ?? { x: 0, y: 0 };
    let bestD = Infinity;
    snap.voidCenters.forEach((c) => {
      const d = Math.hypot(c.x - landing.x, c.y - landing.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    });
    return { point: pushOut(best), isLanding: false };
  }
  if (kind === 'wound') {
    if (inCrown(landing, snap)) return { point: landing, isLanding: true };
    /* ripiego: il punto della corona all'angolo del landing */
    const a = Math.atan2(landing.y, landing.x);
    const rr = rChallengeAt(snap, a) * 0.72;
    return {
      point: pushOut({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }),
      isLanding: false,
    };
  }
  return { point: { x: 0, y: 0 }, isLanding: false };
}

interface WalkResult {
  nodes: FractureNode[];
  reachedEdge: boolean;
}

/**
 * Random walk angolare mean-reverting (Ornstein-Uhlenbeck discreto).
 *
 * κ è il cuore: la crepa TORNA verso la direzione radiale, quindi arriva
 * sempre al bordo. Una crepa che muore a metà lastra si legge come graffio;
 * una che raggiunge il bordo si legge come lastra rotta.
 * σ sotto 0.2 sembra un raggio vettoriale, sopra 0.45 un fulmine da cartone.
 */
function walk(
  start: Point,
  startAngle: number,
  snap: GeometrySnapshot,
  cfg: AstrolabeV5Config,
  rng: () => number,
  landing: Point,
  exclusionR: number,
  maxNodes: number,
  w0: number,
): WalkResult {
  const nodes: FractureNode[] = [{ x: start.x, y: start.y, w: w0 }];
  let theta = startAngle;
  let x = start.x;
  let y = start.y;
  let reachedEdge = false;

  for (let i = 0; i < maxNodes; i += 1) {
    const radial = Math.atan2(y, x);
    theta += cfg.crackKappa * wrapAngle(radial - theta) + cfg.crackSigma * (rng() * 2 - 1);

    const step = cfg.crackStepR * (1 + 0.4 * (rng() * 2 - 1));
    let nx = x + Math.cos(theta) * step;
    let ny = y + Math.sin(theta) * step;

    /* ── esclusione dura attorno al punto di atterraggio ──────────────────
       Le crepe non toccano MAI il landing: se lo toccassero, il terremoto si
       leggerebbe come causa dell'esito invece che come secondo dado.        */
    if (exclusionR > 0 && Math.hypot(nx - landing.x, ny - landing.y) < exclusionR) {
      const away = Math.atan2(y - landing.y, x - landing.x);
      theta = away + (rng() > 0.5 ? 0.4 : -0.4);
      nx = x + Math.cos(theta) * step;
      ny = y + Math.sin(theta) * step;
      if (Math.hypot(nx - landing.x, ny - landing.y) < exclusionR) break;
    }

    x = nx;
    y = ny;

    const a = Math.atan2(y, x);
    const edge = rChallengeAt(snap, a);
    const d = Math.hypot(x, y);
    if (d >= edge) {
      /* snap radiale esatto sul blob: terminare sul blob e non su un cerchio
         è ciò che fa leggere "rottura del piano" invece di "graffio" */
      nodes.push({ x: Math.cos(a) * edge, y: Math.sin(a) * edge, w: 0 });
      reachedEdge = true;
      break;
    }
    nodes.push({ x, y, w: 0 });
  }

  /* ── il nastro, non lo stroke ─────────────────────────────────────────
     Una crepa è larghissima all'origine e va a zero in punta.
     L'esponente 1.4 fa leggere "rottura"; 1.0 farebbe leggere "cuneo".
     Il jitter è precomputato QUI, una volta: per frame la crepa sfarfalla.  */
  const S = Math.max(1, nodes.length - 1);
  nodes.forEach((n, i) => {
    const s = i / S;
    const jitter = 1 + cfg.crackWidthJitter * (rng() * 2 - 1);
    n.w = w0 * Math.pow(Math.max(0, 1 - s), cfg.crackTaperExp) * jitter;
  });

  return { nodes, reachedEdge };
}

/**
 * Costruisce il modello della frattura. Gira UNA volta per lancio.
 *
 * Costo: ~75 nodi e ~75 valutazioni di `rChallengeAt`, contro le ~18000 che
 * `buildGeometry` fa già oggi a ogni cambio di input.
 */
export function buildFracture(
  snap: GeometrySnapshot,
  outcome: AstrolabeOutcome,
  landing: Point,
  seed: number,
  cfg: AstrolabeV5Config,
): FractureModel {
  if (!cfg.fractureEnabled) return EMPTY;

  const kind: FractureKind = outcome.dead ? 'death' : outcome.wounded ? 'wound' : 'none';
  if (kind === 'none') return EMPTY;

  const tier = kind === 'death' ? cfg.fractureDeathTier : cfg.fractureWoundTier;
  if (tier === 'none') return EMPTY;

  /* RNG locale e salato: non tocca lo stream di roll/riskRoll/landing */
  const rng = createRng((seed ^ cfg.fractureSeedSalt) >>> 0);

  /* ── esclusione attorno alla pallina: quando si applica, e quando no ────
     Serve a impedire che una crepa NATA ALTROVE raggiunga il punto di
     atterraggio, perché il giocatore leggerebbe una causa dove c'è solo un
     secondo dado. Se invece l'epicentro È il punto di atterraggio — morte
     caduta dentro una voragine, ferita atterrata nella corona — la crepa nasce
     legittimamente sotto la pallina: il terreno ha ceduto lì, e non c'è nulla
     da nascondere. In quel caso l'esclusione è 0, altrimenti il vincolo
     contraddirebbe la geometria che lo ha generato.                          */
  const { point: epicenter, isLanding } = pickEpicenter(
    kind,
    snap,
    landing,
    cfg.landingExclusionR,
  );
  const exclusionR = isLanding ? 0 : cfg.landingExclusionR;
  const trunkCount = kind === 'death' ? cfg.deathBranchCount : cfg.woundBranchCount;
  const w0 = kind === 'death' ? cfg.crackWidthDeath : cfg.crackWidthWound;
  const budget = cfg.fractureMaxNodes;

  const branches: FractureBranch[] = [];
  let nodeCount = 0;

  /* ── tronchi ──────────────────────────────────────────────────────────
     Nella morte i tronchi PUNTANO alle altre bocche di morte: la spaccatura
     mette in rete le cinque voragini, che smettono di essere dischi decalcati
     e diventano i punti in cui il piano ha ceduto.
     Nella ferita le direzioni sono polarizzate verso l'esterno.             */
  const trunkAngles: number[] = [];
  for (let t = 0; t < trunkCount; t += 1) {
    if (kind === 'death' && snap.voidCenters.length) {
      const target = snap.voidCenters[(t + 1) % snap.voidCenters.length];
      trunkAngles.push(Math.atan2(target.y - epicenter.y, target.x - epicenter.x));
    } else {
      const outward = Math.atan2(epicenter.y, epicenter.x);
      trunkAngles.push(outward + (t - (trunkCount - 1) / 2) * 0.9 + (rng() * 2 - 1) * 0.25);
    }
  }

  trunkAngles.forEach((a) => {
    if (nodeCount >= budget) return;
    const res = walk(
      epicenter,
      a,
      snap,
      cfg,
      rng,
      landing,
      exclusionR,
      Math.min(40, budget - nodeCount),
      w0,
    );
    nodeCount += res.nodes.length;
    branches.push({ nodes: res.nodes, generation: 0, isTrunk: res.reachedEdge, parentIndex: null });
  });

  /* ── rami: Galton-Watson subcritico (m ≈ 0.5) ─────────────────────────
     Fork a ±(0.52..0.92 rad): la finestra reale del vetro fragile.          */
  for (let gen = 0; gen < cfg.crackBranchMaxGen; gen += 1) {
    const parents = branches.filter((b) => b.generation === gen);
    parents.forEach((parent, pi) => {
      parent.nodes.forEach((n, ni) => {
        if (nodeCount >= budget) return;
        if (ni < 2 || ni >= parent.nodes.length - 1) return;
        const d = Math.hypot(n.x, n.y);
        const p = cfg.crackBranchP0 * Math.exp(-cfg.crackBranchLambda * d);
        if (rng() >= p) return;
        const prev = parent.nodes[ni - 1];
        const base = Math.atan2(n.y - prev.y, n.x - prev.x);
        const spread =
          cfg.crackForkAngleMin + rng() * (cfg.crackForkAngleMax - cfg.crackForkAngleMin);
        const dir = base + (rng() > 0.5 ? spread : -spread);
        const res = walk(
          { x: n.x, y: n.y },
          dir,
          snap,
          cfg,
          rng,
          landing,
          exclusionR,
          Math.min(Math.round(18 * Math.pow(0.68, gen)), budget - nodeCount),
          w0 * Math.pow(0.52, gen + 1),
        );
        nodeCount += res.nodes.length;
        branches.push({
          nodes: res.nodes,
          generation: gen + 1,
          isTrunk: false,
          parentIndex: branches.indexOf(parents[pi]),
        });
      });
    });
  }

  /* ── piastre ──────────────────────────────────────────────────────────
     n tronchi dallo stesso epicentro che terminano tutti sul bordo
     partizionano il disco in ESATTAMENTE n regioni. I rami, terminando
     all'interno, non partizionano mai: niente planar subdivision.           */
  const trunks = branches.filter((b) => b.isTrunk);
  const plates: Point[][] = [];
  if (trunks.length >= 2) {
    const sorted = [...trunks].sort((a, b) => {
      const ea = a.nodes[a.nodes.length - 1];
      const eb = b.nodes[b.nodes.length - 1];
      return Math.atan2(ea.y, ea.x) - Math.atan2(eb.y, eb.x);
    });
    for (let i = 0; i < sorted.length; i += 1) {
      const A = sorted[i];
      const B = sorted[(i + 1) % sorted.length];
      const endA = A.nodes[A.nodes.length - 1];
      const endB = B.nodes[B.nodes.length - 1];
      let a0 = Math.atan2(endA.y, endA.x);
      let a1 = Math.atan2(endB.y, endB.x);
      if (a1 < a0) a1 += TAU;
      const poly: Point[] = A.nodes.map((n) => ({ x: n.x, y: n.y }));
      const ARC = 24;
      for (let k = 1; k < ARC; k += 1) {
        const a = a0 + ((a1 - a0) * k) / ARC;
        const rr = rChallengeAt(snap, a);
        poly.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
      }
      for (let k = B.nodes.length - 1; k >= 0; k -= 1) {
        poly.push({ x: B.nodes[k].x, y: B.nodes[k].y });
      }
      plates.push(poly);
    }
  }

  /* ── detriti ──────────────────────────────────────────────────────────── */
  const debris: FractureDebris[] = [];
  if (cfg.debrisEnabled) {
    const all = branches.flatMap((b) => b.nodes);
    for (let i = 0; i < cfg.debrisCount && all.length; i += 1) {
      const n = all[Math.floor(rng() * all.length)];
      const a = rng() * TAU;
      const off = w0 * (1.5 + rng() * 4);
      debris.push({
        x: n.x + Math.cos(a) * off,
        y: n.y + Math.sin(a) * off,
        r: w0 * (0.35 + rng() * 0.9),
        rot: rng() * TAU,
      });
    }
  }

  const shakeAmp = Math.min(
    cfg.shakeAmpMax,
    kind === 'death' ? cfg.shakeAmpDeath : cfg.shakeAmpWound,
  );

  return {
    tier,
    kind,
    epicenter,
    epicenterIsLanding: isLanding,
    branches,
    plates,
    debris,
    shakeAmp,
    shakeTauMs: kind === 'death' ? cfg.shakeTauDeathMs : cfg.shakeTauWoundMs,
    capSinks: kind === 'death' && inVoid(landing, snap),
    capRadius: cfg.deathCapRadiusR,
    totalNodes: nodeCount,
  };
}

/**
 * Poligono di offset del nastro per un ramo, alla frazione di apertura `open`.
 *
 * `open` 0 = crepa chiusa (larghezza nulla): è lo stato finale della ferita,
 * che si risalda e lascia solo la cicatrice.
 */
export function ribbonPolygon(branch: FractureBranch, open: number): Point[] {
  const n = branch.nodes;
  if (n.length < 2) return [];
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < n.length; i += 1) {
    const prev = n[Math.max(0, i - 1)];
    const next = n[Math.min(n.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = n[i].w * open;
    left.push({ x: n[i].x + nx * w, y: n[i].y + ny * w });
    right.push({ x: n[i].x - nx * w, y: n[i].y - ny * w });
  }
  return [...left, ...right.reverse()];
}

/**
 * Scossa continua nel tempo — non un offset random per frame.
 *
 * Un offset random per frame È rumore bianco: strobizza e dipende dal frame
 * rate. Questa è una funzione continua di t, identica a 60 e a 120Hz.
 * f1 e f2 non armoniche → nessuna periodicità visibile, nessun moto lineare
 * diagonale.
 */
export function shakeOffset(
  tMs: number,
  amp: number,
  tauMs: number,
  cfg: AstrolabeV5Config,
): { x: number; y: number } {
  if (amp <= 0 || tMs < 0) return { x: 0, y: 0 };
  const a = amp * Math.exp(-tMs / Math.max(1, tauMs));
  const t = tMs / 1000;
  return {
    x: a * Math.sin(TAU * cfg.shakeFreq1Hz * t),
    y: a * Math.sin(TAU * cfg.shakeFreq2Hz * t + 1.7),
  };
}

/** Angolo di una valle, riesportato per i test di rete fra voragini. */
export { valleyAngle };
