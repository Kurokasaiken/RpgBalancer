/**
 * pillars.ts — FUNZIONI PURE per i monoliti V5.
 *
 * Stesso statuto di `geometry.ts`: nessun DOM, nessun side effect, tutto in
 * spazio normalizzato (raggio arena = 1, centro 0,0). Testabile senza canvas.
 *
 * I monoliti V5 non sono decorazione: SONO il check avversariale.
 *   - livello d'oro nel fusto  → stat del PG
 *   - architrave inciso        → soglia di difficoltà
 *   - cresta sopra / morso sotto → scarto (margine o deficit)
 *
 * Perché V3 leggeva come "sticker incollati" (e cosa cambia qui):
 *  1. Non c'era una camera condivisa. V3 spostava la punta di −h in Y schermo,
 *     uguale per tutti e cinque, e la inclinava VERSO il centro. In una vista
 *     dall'alto il punto di fuga delle verticali è il nadir (il centro), quindi
 *     le verticali devono divergere VERSO L'ESTERNO di rb·H/(C−H). Qui c'è una
 *     sola camera, `cameraHeightR`, e la proiezione discende da quella.
 *  2. L'ombra era un'ellisse nera identica per tutti, rotazione 0. Qui è un
 *     quadrilatero proiettato che punta lontano dalla luce, diverso per ogni
 *     monolito perché dipende dalla sua posizione.
 *  3. Le due facce differivano di 8 unità RGB (volume nullo) e il rim era oro
 *     sempre a sinistra: corretto per 1 pilastro su 5. Qui ogni faccia ha una
 *     normale vera e un lambert calcolato dalla posizione reale della luce.
 */
import {
  AXES,
  TAU,
  type GeometrySnapshot,
  rChallengeAt,
  tipAngle,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import type { AstrolabeV5Config } from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';

export interface Pt {
  x: number;
  y: number;
}

/** Livello di dettaglio in funzione della larghezza del board. */
export type PillarTier = 'full' | 'compact' | 'tight' | 'glyph';

export interface PillarModel {
  index: number;
  /** Angolo dell'asse (punta del petalo corrispondente). */
  angle: number;
  /** Base del monolito, sul perimetro sfida all'angolo dell'asse. */
  base: Pt;
  /** Distanza della base dal centro. */
  baseR: number;
  /** Punta proiettata: base + spostamento radiale verso l'esterno. */
  tip: Pt;
  /** Altezza reale sopra il piano (unità normalizzate). */
  height: number;
  halfWidth: number;

  /* ── semantica: il check avversariale ─────────────────────────────────── */
  skillIndex: number;
  skillName: string;
  statValue: number;
  difficultyValue: number;
  /** Stat normalizzata 0..1 lungo il fusto: è l'altezza del livello d'oro. */
  statNorm: number;
  /** Difficoltà normalizzata 0..1: è l'altezza dell'architrave. */
  difficultyNorm: number;
  /** statNorm − difficultyNorm. Positivo = cresta, negativo = morso. */
  delta: number;

  /* ── geometria proiettata ─────────────────────────────────────────────── */
  /** Impronta esagonale schiacciata alla base (l'invaso è la sua ellisse). */
  footprint: Pt[];
  /** Fusto: 4 vertici (base sinistra, base destra, spalla destra, spalla sinistra). */
  shaft: Pt[];
  /** Piramidion: 3 vertici (spalla sinistra, spalla destra, punta). */
  pyramidion: Pt[];
  /** Spigolo verticale che separa le due facce visibili. */
  ridge: [Pt, Pt];
  /** Quadrilatero dell'ombra portata, direzionale. */
  shadow: Pt[];
  /** Cuneo di caustica dentro l'ombra. */
  caustic: Pt[];

  /* ── luce ─────────────────────────────────────────────────────────────── */
  /** Lambert della faccia sinistra e destra rispetto alla luce reale. */
  shadeLeft: number;
  shadeRight: number;
  /** Prospettiva atmosferica: 0 = pieno contrasto, 1 = completamente smorzato. */
  atmo: number;
  /** Ordine di disegno: i monoliti più in basso sullo schermo davanti. */
  depth: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Tier di dettaglio dalla larghezza del board in CSS px. */
export function pillarTierFor(boardPx: number): PillarTier {
  if (boardPx >= 520) return 'full';
  if (boardPx >= 300) return 'compact';
  if (boardPx >= 240) return 'tight';
  return 'glyph';
}

/** Direzione unitaria dal centro verso la luce, in coordinate canvas (y giù). */
export function lightDir(cfg: AstrolabeV5Config): Pt {
  const a = (cfg.lightAzimuthDeg * Math.PI) / 180;
  return { x: Math.cos(a), y: Math.sin(a) };
}

/**
 * POSIZIONE della luce, non solo la sua direzione.
 *
 * La sorgente di questa scena è puntuale e a distanza finita: è il light-leak
 * già cotto nel backdrop. È la differenza fra ombre che ventagliano e cinque
 * ombre parallele — e cinque ombre parallele su un board circolare sono la
 * firma inequivocabile del collage.
 */
export function lightPosition(cfg: AstrolabeV5Config): Pt {
  const d = lightDir(cfg);
  return { x: d.x * cfg.lightDistanceR, y: d.y * cfg.lightDistanceR };
}

/**
 * Costruisce i cinque monoliti.
 *
 * `axisStatNorm` è calcolato dallo STESSO dato che alimenta la punta del petalo
 * (`snap.axisTip`), normalizzato sullo stesso intervallo core→max. I due canali
 * visivi dello stesso numero non possono quindi divergere: è ciò che rende
 * onesto il confronto stat-vs-difficoltà.
 */
export function buildPillars(
  snap: GeometrySnapshot,
  cfg: AstrolabeV5Config,
): PillarModel[] {
  const lightPos = lightPosition(cfg);
  /* Lunghezza dell'ombra in multipli dell'altezza del monolito. `shadowLengthMul`
     è la manopola diretta (1.7 = ombra lunga quasi il doppio del corpo); non si
     moltiplica anche per 1/tan(elevazione), o l'elevazione conterebbe due volte.
     L'elevazione governa l'ombreggiatura delle facce, non la lunghezza.
     Un'ombra più corta della base non è un'ombra, è un piedistallo: era il caso
     di V3, che disegnava un'ellisse lunga 0.056R sotto un corpo alto 0.16R. */
  const shadowLen = cfg.pillarHeightR * cfg.shadowLengthMul;

  const skills = snap.input.stats;
  const span = Math.max(1e-6, snap.config.maxRadius - snap.config.coreRadius);

  const models: PillarModel[] = [];

  for (let i = 0; i < AXES; i += 1) {
    const angle = tipAngle(i);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    const baseR = rChallengeAt(snap, angle);
    const base: Pt = { x: ca * baseR, y: sa * baseR };

    const H = cfg.pillarHeightR;
    const hw = cfg.pillarHalfWidthR;

    /* ── proiezione: UNA camera per tutta la scena ────────────────────────
       Punto a distanza rb dal nadir e altezza h → distanza rb·C/(C−h).
       Lo spostamento è RADIALE VERSO L'ESTERNO e cresce con rb: i monoliti
       vicini al bordo si sdraiano di più. È questo che li fa appartenere al
       piano invece che galleggiarci sopra.                                   */
    const C = cfg.cameraHeightR;
    const proj = (h: number) => (baseR * h) / Math.max(1e-6, C - h);
    const tipOut = proj(H);
    const shoulderH = H * (1 - cfg.pyramidionPct);
    const shoulderOut = proj(shoulderH);

    const tip: Pt = { x: ca * (baseR + tipOut), y: sa * (baseR + tipOut) };

    /* tangente al cerchio: è la direzione della larghezza del fusto */
    const tx = -sa;
    const ty = ca;

    const hwTip = hw * cfg.pillarTaper;
    const shaft: Pt[] = [
      { x: base.x - tx * hw, y: base.y - ty * hw },
      { x: base.x + tx * hw, y: base.y + ty * hw },
      {
        x: ca * (baseR + shoulderOut) + tx * hwTip,
        y: sa * (baseR + shoulderOut) + ty * hwTip,
      },
      {
        x: ca * (baseR + shoulderOut) - tx * hwTip,
        y: sa * (baseR + shoulderOut) - ty * hwTip,
      },
    ];

    const pyramidion: Pt[] = [shaft[3], shaft[2], tip];

    /* lo spigolo corre dal centro della base al centro della spalla */
    const ridge: [Pt, Pt] = [
      base,
      { x: ca * (baseR + shoulderOut), y: sa * (baseR + shoulderOut) },
    ];

    /* ── impronta esagonale schiacciata ──────────────────────────────────
       Fase per indice: nessun monolito ha l'impronta identica a un altro.   */
    const ky = 1 - cfg.boardTiltKy;
    const phase = (i * 0.7) % TAU;
    const footprint: Pt[] = Array.from({ length: 6 }, (_, k) => {
      const t = (k / 6) * TAU + phase;
      const rr = hw * (1.28 + 0.1 * Math.sin(t * 3 + phase));
      return {
        x: base.x + Math.cos(t) * rr,
        y: base.y + Math.sin(t) * rr * ky,
      };
    });

    /* ── vettore verso la luce, calcolato DA QUESTO monolito ─────────────
       Con una sorgente puntuale ogni pilastro vede la luce da un'angolazione
       diversa: è ciò che fa ventagliare le ombre e cambiare lato al rim.     */
    const lvx = lightPos.x - base.x;
    const lvy = lightPos.y - base.y;
    const lvLen = Math.hypot(lvx, lvy) || 1;
    const L: Pt = { x: lvx / lvLen, y: lvy / lvLen };

    /* ── ombra portata: punta LONTANO dalla luce, diversa per ogni monolito
       Con la luce ad alto-sinistra, il monolito a sud-est getta l'ombra in
       basso-destra e quello a ovest quasi in verticale.                      */
    const sdx = -L.x;
    const sdy = -L.y * ky;
    const sLen = Math.hypot(sdx, sdy) || 1;
    const ux = sdx / sLen;
    const uy = sdy / sLen;
    const px = -uy;
    const py = ux;
    const far: Pt = { x: base.x + ux * shadowLen, y: base.y + uy * shadowLen };
    const shadow: Pt[] = [
      { x: base.x - px * hw * 1.15, y: base.y - py * hw * 1.15 },
      { x: base.x + px * hw * 1.15, y: base.y + py * hw * 1.15 },
      { x: far.x + px * hw * cfg.pillarTaper * 0.8, y: far.y + py * hw * cfg.pillarTaper * 0.8 },
      { x: far.x - px * hw * cfg.pillarTaper * 0.8, y: far.y - py * hw * cfg.pillarTaper * 0.8 },
    ];

    /* caustica: cuneo stretto di luce che il vetro concentra lungo l'ombra */
    const caustic: Pt[] = [
      { x: base.x - px * hw * 0.22, y: base.y - py * hw * 0.22 },
      { x: base.x + px * hw * 0.22, y: base.y + py * hw * 0.22 },
      { x: far.x, y: far.y },
    ];

    /* ── luce: normali vere, non una regola costante ─────────────────────
       Le due facce visibili hanno normali ±tangente. Il lambert dipende dalla
       posizione ANGOLARE del monolito, quindi il rim illuminato cambia lato
       lungo il giro. In V3 era oro sempre a sinistra: giusto per 1 su 5.      */
    const nL = { x: -tx, y: -ty };
    const nR = { x: tx, y: ty };
    const amb = cfg.pillarAmbient;
    const k = cfg.pillarFaceContrast;
    const shadeLeft = clamp(amb + k * Math.max(0, nL.x * L.x + nL.y * L.y), 0, 1);
    const shadeRight = clamp(amb + k * Math.max(0, nR.x * L.x + nR.y * L.y), 0, 1);

    /* prospettiva atmosferica: i monoliti opposti alla luce si smorzano */
    const towardLight = (ca * L.x + sa * L.y + 1) / 2; // 0..1
    const atmo = clamp((1 - towardLight) * cfg.pillarAtmoStrength, 0, 1);

    /* ── semantica ───────────────────────────────────────────────────────
       statNorm nasce da axisTip, cioè dallo STESSO numero che disegna il
       petalo: i due canali non possono divergere.                           */
    const skillIndex = snap.axisSkill[i] ?? 0;
    const skill = skills[skillIndex] ?? skills[0];
    const statNorm = clamp((snap.axisTip[i] - snap.config.coreRadius) / span, 0, 1);

    const rawDifficulty = cfg.perAxisDifficultyEnabled
      ? (skill?.difficulty ?? snap.input.difficulty)
      : snap.input.difficulty;
    const difficultyNorm = clamp(
      clamp(rawDifficulty, cfg.difficultyClampMin, cfg.difficultyClampMax) / 100,
      0,
      1,
    );

    models.push({
      index: i,
      angle,
      base,
      baseR,
      tip,
      height: H,
      halfWidth: hw,
      skillIndex,
      skillName: skill?.name ?? `Asse ${i + 1}`,
      statValue: skill?.stat ?? 0,
      difficultyValue: rawDifficulty,
      statNorm,
      difficultyNorm,
      delta: statNorm - difficultyNorm,
      footprint,
      shaft,
      pyramidion,
      ridge,
      shadow,
      caustic,
      shadeLeft,
      shadeRight,
      atmo,
      /* i monoliti più in basso sullo schermo vanno disegnati per ultimi:
         senza questo, l'asse 4 copriva sempre l'asse 3 a prescindere dalla y */
      depth: base.y,
    });
  }

  return models;
}

/** Ordine di disegno back-to-front. V3 non ordinava affatto. */
export function sortPillarsByDepth(models: PillarModel[]): PillarModel[] {
  return [...models].sort((a, b) => a.depth - b.depth);
}

/**
 * Punto lungo il fusto a frazione `t` dell'altezza (0 = base, 1 = punta),
 * proiettato con la stessa camera. Serve per architrave, livello d'oro,
 * cresta e morso: devono stare sul fusto, non su una retta arbitraria.
 */
export function pointOnShaft(p: PillarModel, cfg: AstrolabeV5Config, t: number): Pt {
  const ca = Math.cos(p.angle);
  const sa = Math.sin(p.angle);
  const h = p.height * clamp(t, 0, 1);
  const out = (p.baseR * h) / Math.max(1e-6, cfg.cameraHeightR - h);
  return { x: ca * (p.baseR + out), y: sa * (p.baseR + out) };
}

/** Semilarghezza del fusto alla frazione `t` (rastremazione lineare). */
export function halfWidthAt(p: PillarModel, cfg: AstrolabeV5Config, t: number): number {
  return p.halfWidth * lerp(1, cfg.pillarTaper, clamp(t, 0, 1));
}

/**
 * Segmento trasversale del fusto alla frazione `t`: i due estremi
 * dell'architrave, del livello d'oro, della cresta o del morso.
 */
export function crossSegment(
  p: PillarModel,
  cfg: AstrolabeV5Config,
  t: number,
  widthMul = 1,
): [Pt, Pt] {
  const c = pointOnShaft(p, cfg, t);
  const tx = -Math.sin(p.angle);
  const ty = Math.cos(p.angle);
  const w = halfWidthAt(p, cfg, t) * widthMul;
  return [
    { x: c.x - tx * w, y: c.y - ty * w },
    { x: c.x + tx * w, y: c.y + ty * w },
  ];
}

/**
 * Scarto disegnabile in unità normalizzate, con clamp di leggibilità.
 * Sotto `minDeltaPx` lo scarto diventa SEGNO invece che magnitudine: la
 * primitiva grafica non cambia mai, cambia solo il dettaglio. È questo che fa
 * passare il test del 25%.
 */
export function readableDelta(
  p: PillarModel,
  cfg: AstrolabeV5Config,
  rPx: number,
): number {
  if (p.delta === 0) return 0;
  const raw = Math.abs(p.delta) * p.height;
  const minR = rPx > 0 ? cfg.minDeltaPx / rPx : 0;
  return Math.sign(p.delta) * Math.max(minR, raw);
}
