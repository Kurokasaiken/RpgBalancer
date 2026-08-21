/**
 * fracture.ts — I DUE TERREMOTI. Modulo puro, deterministico. PLAN-008 T-007b.
 *
 * È la messa in scena del SECONDO dado, e l'antitesi è tutta qui:
 *
 *     LA FERITA SI CHIUDE, LA MORTE RESTA APERTA.
 *
 * Non due effetti diversi con lo stesso significato: lo stesso gesto con due
 * finali opposti. La fenditura si apre e si richiude — il terreno regge, tu
 * resti; lo spacco si apre e non torna — il terreno non c'è più.
 *
 * REGOLA D'ESCLUSIONE (ereditata dalla V5, ed è la parte che si sbaglia
 * facilmente): una crepa NATA ALTROVE non deve raggiungere il punto
 * d'atterraggio, perché il giocatore leggerebbe una CAUSA dove c'è solo un
 * secondo dado. Ma se l'epicentro È il punto d'atterraggio — morte caduta
 * dentro una voragine, ferita atterrata nella corona — allora la crepa nasce
 * legittimamente sotto la pallina: il terreno ha ceduto lì, e non c'è niente da
 * nascondere. In quel caso l'esclusione è zero, altrimenti il vincolo
 * contraddirebbe la geometria che lo ha generato.
 *
 * DETERMINISMO — vincolo duro: l'RNG della frattura è SALATO e locale. Non deve
 * mai consumare dallo stream che produce i due dadi e l'atterraggio: una sola
 * chiamata in più prima del secondo dado cambierebbe TUTTI gli esiti a parità di
 * seed.
 */

import { createRng, rStarAt, rWallAt, valleyAngle, type Snapshot, type ZoneId } from './zones';

export interface Point {
  x: number;
  y: number;
}

export interface FractureNode {
  x: number;
  y: number;
  /** semilarghezza dell'apertura in questo nodo, 0 in punta */
  w: number;
}

export interface FractureBranch {
  nodes: FractureNode[];
}

export interface Fracture {
  kind: ZoneId;
  /** 'fissure' si richiude, 'rift' resta aperto */
  tier: 'none' | 'fissure' | 'rift';
  epicenter: Point;
  /** true se l'epicentro è il punto d'atterraggio: allora l'esclusione è 0 */
  atLanding: boolean;
  branches: FractureBranch[];
}

const EMPTY: Fracture = {
  kind: 'none',
  tier: 'none',
  epicenter: { x: 0, y: 0 },
  atLanding: false,
  branches: [],
};

/** salt dedicato: separa lo stream della frattura da quello dei dadi */
export const FRACTURE_SALT = 0x5bf03635;

/**
 * Epicentro onesto: il punto d'atterraggio se è già nella zona giusta, altrimenti
 * il centro di zona più vicino — e in quel caso la crepa viene spinta FUORI da un
 * raggio d'esclusione attorno alla pallina.
 */
export function pickEpicenter(
  s: Snapshot,
  kind: ZoneId,
  landing: Point,
  inZone: boolean,
  exclusionR: number,
): { point: Point; atLanding: boolean } {
  if (inZone) return { point: landing, atLanding: true };

  let best: Point = { x: 0, y: 0 };
  if (kind === 'death') {
    let bd = Infinity;
    for (const c of s.voidCenters) {
      const d = Math.hypot(c.x - landing.x, c.y - landing.y);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
  } else {
    /* la corona è la banda sul bordo della stella: prendo il punto della banda
       più vicino, sullo stesso angolo dell'atterraggio */
    const a = Math.atan2(landing.y, landing.x);
    const r = rStarAt(s, a);
    best = { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  /* spinta fuori dall'esclusione: un epicentro di ripiego che cadesse addosso
     alla pallina rimetterebbe in scena proprio ciò che l'esclusione evita */
  if (exclusionR > 0) {
    const dx = best.x - landing.x;
    const dy = best.y - landing.y;
    const d = Math.hypot(dx, dy);
    if (d < exclusionR) {
      if (d < 1e-9) {
        const a = Math.atan2(landing.y, landing.x) + Math.PI / 2;
        best = {
          x: landing.x + Math.cos(a) * exclusionR,
          y: landing.y + Math.sin(a) * exclusionR,
        };
      } else {
        best = {
          x: landing.x + (dx / d) * exclusionR,
          y: landing.y + (dy / d) * exclusionR,
        };
      }
    }
  }
  /* L'EPICENTRO DEVE STARE DENTRO L'ARENA. La corona segue il bordo della
     stella, e dove la stat sfonda la prova quel bordo è FUORI dal muro: un
     epicentro là genera una crepa che non appartiene al board. Misurato a
     85/50: 12 nodi fuori. */
  const dE = Math.hypot(best.x, best.y);
  const wallE = rWallAt(s, Math.atan2(best.y, best.x)) * 0.94;
  if (dE > wallE && dE > 1e-9) {
    best = { x: (best.x / dE) * wallE, y: (best.y / dE) * wallE };
  }
  return { point: best, atLanding: false };
}

/**
 * Costruisce la frattura. `relaxed` viene dal risolutore: se l'atterraggio è
 * stato rilassato la crepa NON può rivendicare quel punto come epicentro,
 * perché la coerenza fra esito e zona lì non c'è.
 */
export function buildFracture(
  s: Snapshot,
  kind: ZoneId,
  landing: Point,
  seed: number,
  opts: { inZone: boolean; relaxed: boolean } = { inZone: true, relaxed: false },
): Fracture {
  if (kind === 'none') return EMPTY;
  const tier = kind === 'death' ? 'rift' : 'fissure';
  const rng = createRng((seed ^ FRACTURE_SALT) >>> 0);

  const scale = Math.sqrt(s.arenaArea / Math.PI);
  const inZone = opts.inZone && !opts.relaxed;
  const { point: epicenter, atLanding } = pickEpicenter(
    s,
    kind,
    landing,
    inZone,
    inZone ? 0 : scale * 0.22,
  );

  /* la morte apre di più e va più lontano: è la differenza di scala fra "il
     terreno ha ceduto" e "il terreno non c'è più" */
  /* PORTATA. Verificato a schermo che 0.62/0.34 producevano crepe da 60-70px su
     un'arena da 192 di raggio: leggibili ma timide, e "il terreno non c'e' piu'"
     non e' un graffio. La morte arriva quasi al muro, la ferita a meta' strada:
     l'antitesi resta nel FINALE (chiude / non chiude), la scala la rinforza. */
  const armCount = kind === 'death' ? 4 : 3;
  const reach = scale * (kind === 'death' ? 1.0 : 0.52);
  /* la ferita era 0.022 della scala, cioè ~4px di semilarghezza a difficoltà 50:
     una fessura da 8px che si apre e si richiude in 1.5s si perde. Serve corpo,
     restando la MINORE delle due: l'antitesi sta nel finale, non nella taglia. */
  const halfW = scale * (kind === 'death' ? 0.075 : 0.042);

  const branches: FractureBranch[] = [];
  const base = Math.atan2(epicenter.y, epicenter.x) + (rng() - 0.5) * 0.8;
  for (let b = 0; b < armCount; b += 1) {
    /* i rami NON sono equispaziati: una frattura simmetrica legge come un
       ornamento, e la simmetria è nella kill list */
    let a = base + (b / armCount) * Math.PI * 2 * (0.5 + rng() * 0.5) + (rng() - 0.5) * 0.9;
    let x = epicenter.x;
    let y = epicenter.y;
    const segs = 6 + Math.floor(rng() * 3);
    const len = reach * (0.55 + rng() * 0.45);
    const nodes: FractureNode[] = [{ x, y, w: halfW }];
    for (let k = 1; k <= segs; k += 1) {
      a += (rng() - 0.5) * 0.55;
      const step = len / segs;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      /* la crepa si assottiglia verso la punta: in punta è zero */
      const t = k / segs;
      const w = halfW * (1 - t) * (0.7 + rng() * 0.6);
      /* non esce dal muro: una crepa fuori dall'arena non appartiene a nessuno */
      const d = Math.hypot(x, y);
      const wall = rWallAt(s, Math.atan2(y, x));
      if (d > wall * 0.98) break;
      nodes.push({ x, y, w });
    }
    if (nodes.length > 2) branches.push({ nodes });
  }

  /* NESSUNA FRATTURA VUOTA. Se tutti i rami sono morti contro il muro — accade
     quando l'epicentro è già sul bordo — si riprova con una portata ridotta e
     puntando verso l'interno: un terremoto che non si vede non è la messa in
     scena di niente, e il secondo dado resterebbe muto. */
  if (!branches.length) {
    const inward = Math.atan2(-epicenter.y, -epicenter.x);
    for (let b = 0; b < armCount; b += 1) {
      let a = inward + (b - (armCount - 1) / 2) * 0.7 + (rng() - 0.5) * 0.3;
      let x = epicenter.x;
      let y = epicenter.y;
      const segs = 5;
      const len = reach * 0.45;
      const nodes: FractureNode[] = [{ x, y, w: halfW }];
      for (let k = 1; k <= segs; k += 1) {
        a += (rng() - 0.5) * 0.35;
        x += Math.cos(a) * (len / segs);
        y += Math.sin(a) * (len / segs);
        /* anche il ripiego rispetta il muro */
        if (Math.hypot(x, y) > rWallAt(s, Math.atan2(y, x)) * 0.98) break;
        nodes.push({ x, y, w: halfW * (1 - k / segs) });
      }
      if (nodes.length > 2) branches.push({ nodes });
    }
  }

  /* ultimo fondo: un ramo radiale verso il centro. Sta dentro per costruzione. */
  if (!branches.length) {
    const a = Math.atan2(-epicenter.y, -epicenter.x);
    const len = Math.min(reach * 0.4, Math.hypot(epicenter.x, epicenter.y) * 0.7);
    const nodes: FractureNode[] = [];
    for (let k = 0; k <= 5; k += 1) {
      nodes.push({
        x: epicenter.x + Math.cos(a) * (len * k) / 5,
        y: epicenter.y + Math.sin(a) * (len * k) / 5,
        w: halfW * (1 - k / 5),
      });
    }
    branches.push({ nodes });
  }

  return { kind, tier, epicenter, atLanding, branches };
}

/**
 * Il poligono del nastro a una data apertura.
 *
 * `open` 0..1 è ciò che distingue i due terremoti: la fenditura ci passa e torna
 * a 0, lo spacco ci arriva e resta. La forma è la stessa — cambia solo dove
 * finisce.
 */
export function ribbonPolygon(branch: FractureBranch, open: number): Point[] {
  const n = branch.nodes.length;
  if (n < 2) return [];
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = branch.nodes[i];
    const a = branch.nodes[Math.max(0, i - 1)];
    const b = branch.nodes[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const L = Math.hypot(tx, ty) || 1;
    tx /= L;
    ty /= L;
    const w = p.w * open;
    left.push({ x: p.x - ty * w, y: p.y + tx * w });
    right.push({ x: p.x + ty * w, y: p.y - tx * w });
  }
  return [...left, ...right.reverse()];
}

/** apertura nel tempo: la ferita ci passa, la morte ci resta */
export function openAt(tier: Fracture['tier'], t: number, durMs: number): number {
  if (tier === 'none') return 0;
  const p = Math.max(0, Math.min(1, t / durMs));
  if (tier === 'rift') {
    /* sale e resta: nessun ritorno */
    return 1 - Math.pow(1 - p, 3);
  }
  /* la fenditura: apre in fretta, richiude piano. L'asimmetria è il punto —
     chiudere in fretta come si apre leggerebbe come un lampeggio. */
  if (p < 0.32) return 1 - Math.pow(1 - p / 0.32, 3);
  const q = (p - 0.32) / 0.68;
  return 1 - (q * q * (3 - 2 * q));
}

export { valleyAngle };
