/**
 * engineV5.ts — orchestratore canvas della V5 (il reliquiario).
 *
 * Fork di `engineV3.ts`. Cosa CONSERVA, cosa BUTTA, e perché.
 *
 * CONSERVA
 *  - `paintBackdrop` e le sue 5 passate (pittura → velatura teal → grana →
 *    light-leak NW → vignetta) con l'idioma del canvas offscreen e il flag
 *    `backdropDirty`. Il verde stellato è il punto di forza dichiarato del
 *    componente: non si tocca, si estende soltanto il clip a R*envelopeR.
 *  - La geometria del FIORE, importata verbatim da `geometry.ts`. Nessuna riga
 *    della sua matematica passa da qui.
 *  - ResizeObserver con debounce e doppio rAF di bootstrap.
 *
 * BUTTA
 *  - `drawRing`: la ghiera bronzea con 12 borchie. Occupava ~28% dell'area per
 *    zero informazione. L'annulus che libera diventa lo spazio dove crescono i
 *    monoliti e corre l'anello delle etichette.
 *  - Lo shimmer azzurro sugli spigoli: cinque sinusoidi sfasate = cinque
 *    lucine che battono = il "troppi glow" del feedback.
 *  - L'ombra ellittica nera identica sotto tutti e cinque i pilastri.
 *  - Il rendering della corona cremisi e dei dischi voragine: ferita e morte
 *    non si dicono più con una tinta versata prima del lancio, si dicono col
 *    terremoto. La MATEMATICA di quelle zone resta viva in `geometry.ts`,
 *    perché `pickLandingPoint` ne ha bisogno.
 *  - `emitLayout` e le placche DOM: erano il contratto di coordinate più
 *    fragile del componente e in un box da 380px venivano tagliate.
 *
 * REGOLA DEL RUMORE — un solo glow primario per fase:
 *   arm → il fiore · volo → la pallina · esito → la zona.
 * Mai due contemporaneamente.
 */
import {
  AXES,
  TAU,
  buildGeometry,
  lerpGeometry,
  rChallengeAt,
  rStarAt,
  tipAngle,
  type GeometryInput,
  type GeometrySnapshot,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import { classify, type Point, type Zone } from '@/ui/idleVillage/components/destinyAstrolabeV3/zones';
import {
  applyModifiersToInput,
  type AstrolabeModifier,
  type AstrolabeModifierApi,
  type ModifiersChangedListener,
} from '@/ui/idleVillage/components/destinyAstrolabeV3/modifiers';
import {
  astrolabeV5Config,
  resolveAstrolabeV5Config,
  type AstrolabeV5Config,
} from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';
import {
  buildTimeWarp,
  sampleTrajectoryAt,
  simulateThrowV5,
  type AstrolabeOutcome,
  type TrajectoryV5,
} from './simulationV5';
import {
  buildFracture,
  ribbonPolygon,
  shakeOffset,
  type FractureModel,
} from './fracture';
import {
  buildPillars,
  crossSegment,
  halfWidthAt,
  pillarTierFor,
  pointOnShaft,
  readableDelta,
  sortPillarsByDepth,
  type PillarModel,
  type PillarTier,
} from './pillars';

export type EnginePhaseV5 =
  | 'idle'
  | 'arm'
  | 'ready'
  | 'the-spin'
  | 'impact'
  | 'settle'
  | 'verdict'
  | 'closure'
  | 'risk'
  | 'done';

export interface AstrolabeV5Result {
  outcome: AstrolabeOutcome;
  zone: Zone;
  landing: Point;
}

export interface PillarReadout {
  axis: number;
  skillIndex: number;
  skillName: string;
  stat: number;
  difficulty: number;
  /** 'margine' | 'deficit' | 'pari' — per la lista sr-only */
  relation: 'margin' | 'deficit' | 'even';
}

export interface EngineV5Opts {
  input: GeometryInput;
  config?: Partial<AstrolabeV5Config>;
  reducedMotion?: boolean;
  onState?: (s: EnginePhaseV5) => void;
  onArmed?: (armed: boolean) => void;
  onResolve?: (r: AstrolabeV5Result) => void;
  /** Emesso a ogni rebuild: alimenta la lista sr-only e la result plate. */
  onReadout?: (rows: PillarReadout[]) => void;
  /** QUANTITÀ del rischio, emessa durante l'arm: è ciò che il giocatore deve
   *  sapere PRIMA di lanciare per scegliere i consumabili (vincolo FROZEN,
   *  `.mw/desiderata.md:88`). Non dice se il rischio si avvererà. */
  onRiskDeclared?: (r: { deathPct: number; woundPct: number }) => void;
  /** RISOLUZIONE del rischio, emessa DOPO il verdetto: è la prova che i due
   *  dadi sono due. Dice se il rischio dichiarato si è avverato. */
  onRiskRevealed?: (r: { riskRoll: number; wounded: boolean; dead: boolean }) => void;
  onSound?: (
    kind: 'arm' | 'pillar-slam' | 'spin' | 'bounce' | 'snap' | 'quake' | 'success' | 'failure',
  ) => void;
}

export interface AstrolabeV5EngineHandle extends AstrolabeModifierApi {
  roll(): void;
  throw(): void;
  skip(): void;
  setInput(input: GeometryInput): void;
  destroy(): void;
}

interface Palette {
  obsidian: string;
  azure: string;
  gold: string;
  warmGold: string;
  ivory: string;
  wound: string;
  death: string;
  basalt: string;
  teal: string;
}

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    obsidian: g('--skin-surface-base', '#060f16'),
    azure: g('--skin-icon-accent', '#00e5ff'),
    gold: g('--skin-icon-color', '#dfb857'),
    warmGold: g('--skin-close-color', '#f7dd80'),
    ivory: g('--skin-text-primary', '#F5F2E8'),
    wound: g('--skin-status-wound', '#a11d33'),
    death: g('--skin-status-death', '#6d3fb0'),
    /* token nuovi V5: aggiunte, mai override di famiglie esistenti */
    basalt: g('--skin-astro-basalt', '#141a1f'),
    teal: g('--skin-astro-shadow-teal', '#0a282c'),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(color: string, a: number): string {
  if (!color.startsWith('#')) return color;
  const [r, g, b] = hexToRgb(color);
  return `rgba(${r},${g},${b},${a})`;
}
function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutBack = (t: number) => {
  const c1 = 1.05;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const envelope = (now: number, t0: number, start: number, end: number) =>
  clamp01((now - t0 - start) / Math.max(1, end - start));

export function createAstrolabeV5Engine(
  root: HTMLElement,
  opts: EngineV5Opts,
): AstrolabeV5EngineHandle {
  const cfg: AstrolabeV5Config = opts.config
    ? resolveAstrolabeV5Config(opts.config)
    : astrolabeV5Config;
  let palette = readPalette(root);

  const canvas = document.createElement('canvas');
  canvas.className = 'dav5-canvas';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  /* ── sizing ─────────────────────────────────────────────────────────────
     Il board è SEMPRE quadrato e con un pavimento e un tetto. V3 non aveva
     tetto: in un pannello massimizzato si gonfiava a 1400px sprecando fill
     rate su un oggetto che oltre i 720 non guadagna informazione.           */
  let boardPx = cfg.minBoardPx;
  let dpr = 1;
  let cx = 0;
  let cy = 0;
  let R = 1;
  let tier: PillarTier = 'compact';
  const backdrop = document.createElement('canvas');
  let backdropDirty = true;
  /* dichiarata QUI e non con gli altri path: `resize()` la invalida ed è
     chiamata durante l'init, prima del blocco della path cache. Lasciarla più
     in basso la mette in temporal dead zone e il componente esplode al mount. */
  let cachedPathsFor: GeometrySnapshot | null = null;

  function resize() {
    const rect = root.getBoundingClientRect();
    /* Se il parent ha altezza auto, rect.height può essere 0: in V3 questo
       inchiodava il canvas a 160×160 in silenzio. Qui si ripiega sulla
       larghezza, che è sempre significativa. */
    const h = rect.height > 1 ? rect.height : rect.width;
    const raw = Math.min(rect.width || cfg.minBoardPx, h || cfg.minBoardPx);
    boardPx = clamp(Math.round(raw), cfg.minBoardPx, cfg.maxBoardPx);
    dpr = Math.min(cfg.dprCap, window.devicePixelRatio || 1);
    canvas.style.width = `${boardPx}px`;
    canvas.style.height = `${boardPx}px`;
    canvas.width = Math.round(boardPx * dpr);
    canvas.height = Math.round(boardPx * dpr);
    cx = canvas.width / 2;
    cy = canvas.height / 2;
    R = Math.min(canvas.width, canvas.height) * cfg.arenaRadiusFraction;
    tier = pillarTierFor(boardPx);
    root.style.setProperty('--dav5-board', `${boardPx}px`);
    backdropDirty = true;
    cachedPathsFor = null;
  }
  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 80);
  });
  ro.observe(root);

  /* ── stato ── */
  let input: GeometryInput = opts.input;
  let snap: GeometrySnapshot = buildGeometry(input, cfg);
  let pillars: PillarModel[] = buildPillars(snap, cfg);
  resize();
  requestAnimationFrame(() => requestAnimationFrame(resize));

  let morphFrom: GeometrySnapshot | null = null;
  let morphT0 = 0;
  const activeModifiers: AstrolabeModifier[] = [];
  const modifierListeners = new Set<ModifiersChangedListener>();

  let phase: EnginePhaseV5 = 'idle';
  let phaseT0 = performance.now();
  let armed = false;
  let seedCounter = Math.floor(Math.random() * 2 ** 31);

  let trajectory: TrajectoryV5 | null = null;
  let outcome: AstrolabeOutcome | null = null;
  let fracture: FractureModel | null = null;
  let resultZone: Zone = 'ruin';
  let zoneFlash = 0;
  let cameraZoom = 1;
  let ballUnit: Point = { x: 0, y: 0 };
  let nextBounce = 0;
  let riskRevealed = false;
  const timeWarp = buildTimeWarp(cfg);

  interface TrailPoint { x: number; y: number; t: number; }
  const trail: TrailPoint[] = [];

  /* ── starfield calmato ──────────────────────────────────────────────────
     V3 aveva 3 layer (90/45/18) con twinkle 0.6: era il secondo emettitore
     animato della scena e competeva col fiore. Qui densità e twinkle sono
     manopole, e il default dimezza tutto.                                   */
  type Star = { x: number; y: number; r: number; ph: number };
  const starRng = (() => {
    let s = 0x2f6e2b1 >>> 0;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 0xffffffff;
    };
  })();
  const starLayers: Star[][] = [90, 45, 18]
    .slice(0, cfg.starfieldLayers)
    .map((n, li) =>
      Array.from({ length: Math.max(1, Math.round(n * cfg.starfieldDensityScale)) }, () => ({
        x: starRng(),
        y: starRng(),
        r: (0.3 + starRng() * 0.6) * (1 + li * 0.5),
        ph: starRng() * TAU,
      })),
    );

  /* ── materia pittorica (identica a V3) ── */
  const bgImg = new Image();
  bgImg.onload = () => { backdropDirty = true; };
  bgImg.src = '/assets/ui/bg.png';

  const toPx = (p: Point): Point => ({ x: cx + p.x * R, y: cy + p.y * R });

  function currentSnap(now: number): GeometrySnapshot {
    if (!morphFrom) return snap;
    const t = clamp01((now - morphT0) / cfg.tMorphMs);
    if (t >= 1) {
      morphFrom = null;
      return snap;
    }
    return lerpGeometry(morphFrom, snap, easeOutCubic(t));
  }

  function setPhase(s: EnginePhaseV5) {
    phase = s;
    phaseT0 = performance.now();
    opts.onState?.(s);
  }
  const phaseP = (dur: number) => clamp01((performance.now() - phaseT0) / dur);
  function setArmed(a: boolean) {
    if (armed !== a) {
      armed = a;
      opts.onArmed?.(a);
    }
  }

  function emitReadout() {
    if (!opts.onReadout) return;
    opts.onReadout(
      pillars.map((p) => ({
        axis: p.index,
        skillIndex: p.skillIndex,
        skillName: p.skillName,
        stat: p.statValue,
        difficulty: p.difficultyValue,
        relation: p.delta > 0.001 ? 'margin' : p.delta < -0.001 ? 'deficit' : 'even',
      })),
    );
  }

  /* ── path cache ── */
  const SEG = cfg.pathSegments;
  let starPath = new Path2D();
  let challengePath = new Path2D();
  let outsideStarPath = new Path2D();

  function polarPath(
    s: GeometrySnapshot,
    rFn: (s: GeometrySnapshot, a: number) => number,
    scale = 1,
  ): Path2D {
    const p = new Path2D();
    for (let i = 0; i <= SEG; i += 1) {
      const a = (i / SEG) * TAU;
      const r = rFn(s, a) * scale * R;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.closePath();
    return p;
  }

  function ensurePaths(s: GeometrySnapshot, starScale: number, chalScale: number, force: boolean) {
    if (!force && cachedPathsFor === s) return;
    challengePath = polarPath(s, rChallengeAt, chalScale);
    starPath = polarPath(s, rStarAt, starScale);
    /* challenge MENO star, per la passata di frattura fuori dal fiore */
    outsideStarPath = new Path2D();
    outsideStarPath.addPath(challengePath);
    outsideStarPath.addPath(starPath);
    cachedPathsFor = s;
  }

  /* ── backdrop pre-cotto ─────────────────────────────────────────────────
     Identico a V3 nelle 5 passate. Cambia solo il raggio del clip: da R*1.02
     a R*envelopeR, così la materia pittorica copre anche l'anello dei
     monoliti e del testo, invece di fermarsi dove finiva la vecchia ghiera.  */
  function paintBackdrop() {
    backdrop.width = canvas.width;
    backdrop.height = canvas.height;
    const b = backdrop.getContext('2d')!;
    b.clearRect(0, 0, backdrop.width, backdrop.height);
    b.save();
    b.beginPath();
    b.arc(cx, cy, R * cfg.envelopeR + cfg.shakeOverscanPx * dpr, 0, TAU);
    b.clip();

    const span = R * cfg.envelopeR * 2;
    if (bgImg.complete && bgImg.naturalWidth) {
      const scale = Math.max(span / bgImg.width, span / bgImg.height);
      b.globalAlpha = 0.9;
      b.drawImage(
        bgImg,
        cx - (bgImg.width * scale) / 2,
        cy - (bgImg.height * scale) / 2,
        bgImg.width * scale,
        bgImg.height * scale,
      );
      b.globalAlpha = 1;
    } else {
      b.fillStyle = palette.obsidian;
      b.fillRect(0, 0, backdrop.width, backdrop.height);
    }

    b.globalCompositeOperation = 'multiply';
    const veil = b.createRadialGradient(cx, cy, 0, cx, cy, R * cfg.envelopeR);
    veil.addColorStop(0, 'rgb(28,62,72)');
    veil.addColorStop(1, 'rgb(8,18,28)');
    b.fillStyle = veil;
    b.fillRect(0, 0, backdrop.width, backdrop.height);

    /* la grana era il primo contributo al rumore: resta disponibile ma spenta */

    b.globalCompositeOperation = 'screen';
    const lx = cx + Math.cos((cfg.lightAzimuthDeg * Math.PI) / 180) * R * cfg.lightDistanceR;
    const ly = cy + Math.sin((cfg.lightAzimuthDeg * Math.PI) / 180) * R * cfg.lightDistanceR;
    const leak = b.createRadialGradient(lx, ly, 0, lx, ly, R * 1.4);
    leak.addColorStop(0, rgba(palette.azure, 0.16));
    leak.addColorStop(0.5, rgba(palette.azure, 0.03));
    leak.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = leak;
    b.fillRect(0, 0, backdrop.width, backdrop.height);

    b.globalCompositeOperation = 'source-over';
    const vig = b.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * cfg.envelopeR);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    b.fillStyle = vig;
    b.fillRect(0, 0, backdrop.width, backdrop.height);
    b.restore();
    backdropDirty = false;
  }

  /* ── starfield ── */
  function drawStars(now: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * cfg.envelopeR, 0, TAU);
    ctx.clip();
    const base = [0.15, 0.24, 0.36];
    starLayers.forEach((layer, li) => {
      const alpha = base[li] * cfg.starfieldAlphaScale;
      const depth = 1 + li * 0.6;
      layer.forEach((s) => {
        const x = cx + (s.x - 0.5) * R * 2.4 + Math.sin(now / 9000 + s.ph) * depth;
        const y = cy + (s.y - 0.5) * R * 2.4 + Math.cos(now / 11000 + s.ph) * depth;
        const tw = 1 - cfg.twinkleAmount + cfg.twinkleAmount * (0.5 + 0.5 * Math.sin(now / 1400 + s.ph));
        ctx.globalAlpha = alpha * tw;
        ctx.fillStyle = palette.ivory;
        ctx.beginPath();
        ctx.arc(x, y, s.r * dpr, 0, TAU);
        ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ── la lastra di ossidiana ─────────────────────────────────────────────
     È dipinta SOPRA il backdrop: è questo che rende possibile spaccarla e
     rivelare il cielo senza dipingere un solo colore nuovo.                 */
  function drawChallenge(s: GeometrySnapshot, reveal: number) {
    ctx.save();
    ctx.globalAlpha = reveal;
    const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    g.addColorStop(0, rgba(palette.obsidian, 0.98));
    g.addColorStop(0.62, rgba(palette.obsidian, 0.97));
    g.addColorStop(1, rgba(palette.basalt, 0.96));
    ctx.fillStyle = g;
    ctx.fill(challengePath);
    /* bordo inciso: una hairline, non una banda */
    ctx.strokeStyle = rgba(palette.gold, 0.22);
    ctx.lineWidth = Math.max(1, R * 0.004);
    ctx.stroke(challengePath);
    ctx.restore();
  }

  /**
   * Dichiarazione del rischio — la QUANTITÀ, non la risoluzione.
   *
   * Un arco inciso sul perimetro la cui ESTENSIONE è proporzionale al rischio
   * totale, diviso in due tratti: morte e ferita. Si legge a colpo d'occhio
   * quanto è pericoloso il tiro, e quanto di quel pericolo è mortale — che è
   * l'informazione su cui il giocatore decide se spendere un consumabile.
   *
   * V3 diceva la stessa cosa versando una banda cremisi PIENA sul board e
   * tenendocela per ~8 secondi prima del verdetto: informazione giusta, resa
   * sbagliata. Qui sono due hairline sul bordo, fuori dal campo di gioco, che
   * non competono con il fiore né con la pallina.
   *
   * Non dice MAI se il rischio si avvererà: quello è il secondo dado, e arriva
   * dopo il verdetto.
   */
  function drawRiskDeclaration(s: GeometrySnapshot, reveal: number) {
    if (!cfg.riskArcEnabled || reveal <= 0) return;
    const death = Math.max(0, s.input.deathPct);
    const wound = Math.max(0, s.input.woundPct);
    const total = Math.min(cfg.riskPctMax, death + wound);
    if (total <= 0) return;

    const rr = R * cfg.riskArcR;
    const start = -Math.PI / 2;
    const sweep = (total / 100) * TAU * reveal;
    const deathSweep = total > 0 ? sweep * (death / total) : 0;

    ctx.save();
    ctx.lineCap = 'butt';
    ctx.lineWidth = Math.max(cfg.riskArcWidthPx, R * 0.005) * dpr;

    if (deathSweep > 0) {
      ctx.strokeStyle = rgba(palette.death, cfg.riskArcAlpha);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, start, start + deathSweep);
      ctx.stroke();
    }
    if (sweep - deathSweep > 0) {
      ctx.strokeStyle = rgba(palette.wound, cfg.riskArcAlpha);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, start + deathSweep, start + sweep);
      ctx.stroke();
    }
    /* tacca d'inizio: dà un punto zero all'arco, altrimenti la sua estensione
       non è misurabile a occhio */
    ctx.strokeStyle = rgba(palette.ivory, cfg.riskArcAlpha * 0.8);
    ctx.lineWidth = Math.max(1, R * 0.003);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(start) * rr * 0.985, cy + Math.sin(start) * rr * 0.985);
    ctx.lineTo(cx + Math.cos(start) * rr * 1.02, cy + Math.sin(start) * rr * 1.02);
    ctx.stroke();
    ctx.restore();
  }

  /* ── il fiore ───────────────────────────────────────────────────────────
     Geometria importata verbatim. È l'unico oggetto caldo su una scena
     interamente teal: è questo che lo tiene in cima alla gerarchia senza
     spendere un solo glow.                                                  */
  function drawStar(s: GeometrySnapshot, scale: number, glow: number) {
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * scale);
    g.addColorStop(0, rgba(palette.ivory, 0.95));
    g.addColorStop(0.55, rgba(palette.ivory, 0.7));
    g.addColorStop(1, rgba(palette.warmGold, 0.42));
    ctx.fillStyle = g;
    ctx.fill(starPath);
    ctx.strokeStyle = rgba(palette.warmGold, 0.75);
    ctx.lineWidth = Math.max(1, R * 0.005);
    ctx.stroke(starPath);
    if (glow > 0 && cfg.glowPrimaryEnabled) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = glow * 0.28;
      ctx.fillStyle = rgba(palette.warmGold, 1);
      ctx.fill(starPath);
    }
    ctx.restore();
  }

  /* ── i monoliti ─────────────────────────────────────────────────────────
     Grandi, 3D, e ora MISURANO il check avversariale.                       */
  function drawPillars(now: number, drop: (i: number) => number) {
    const order = sortPillarsByDepth(pillars);
    const rPx = R;

    /* 1. ombre e caustiche, clippate alla lastra (cadono SUL piano) */
    ctx.save();
    ctx.clip(challengePath);
    order.forEach((p) => {
      const d = drop(p.index);
      if (d <= 0) return;
      ctx.globalAlpha = d * cfg.shadowAlpha;
      ctx.fillStyle = rgba(palette.teal, 1);
      ctx.beginPath();
      p.shadow.forEach((pt, i) => {
        const q = toPx(pt);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.closePath();
      ctx.fill();

      if (cfg.causticEnabled) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = d * cfg.causticAlpha;
        const a = toPx(p.caustic[0]);
        const c = toPx(p.caustic[2]);
        const cg = ctx.createLinearGradient(a.x, a.y, c.x, c.y);
        cg.addColorStop(0, rgba(palette.warmGold, 0.55));
        cg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        p.caustic.forEach((pt, i) => {
          const q = toPx(pt);
          if (i === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    });
    ctx.restore();

    /* 2. invaso + occlusione di contatto: il monolito EMERGE, non appoggia */
    ctx.save();
    ctx.clip(challengePath);
    order.forEach((p) => {
      const d = drop(p.index);
      if (d <= 0) return;
      const b = toPx(p.base);
      const ao = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, cfg.contactAoR * R);
      ao.addColorStop(0, rgba(palette.teal, 0.75 * d));
      ao.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ao;
      ctx.beginPath();
      ctx.arc(b.x, b.y, cfg.contactAoR * R, 0, TAU);
      ctx.fill();

      /* labbro lontano dell'invaso, scuro */
      ctx.globalAlpha = d;
      ctx.fillStyle = rgba('#000000', 0.55);
      ctx.beginPath();
      p.footprint.forEach((pt, i) => {
        const q = toPx(pt);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    /* 3. corpo */
    order.forEach((p) => {
      const d = drop(p.index);
      if (d <= 0) return;
      drawPillarBody(p, d, rPx);
    });

    /* 4. labbro VICINO dell'invaso, ridipinto SOPRA il piede: è il taglio che
          dice "il pilastro esce dal piano" invece di "sta appoggiato sopra" */
    ctx.save();
    ctx.clip(challengePath);
    order.forEach((p) => {
      const d = drop(p.index);
      if (d <= 0) return;
      const near = p.footprint.filter((pt) => pt.y >= p.base.y);
      if (near.length < 2) return;
      ctx.globalAlpha = d * 0.9;
      ctx.strokeStyle = rgba(palette.warmGold, 0.35);
      ctx.lineWidth = Math.max(1, R * 0.004);
      ctx.beginPath();
      near.forEach((pt, i) => {
        const q = toPx(pt);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    if (tier !== 'glyph') order.forEach((p) => drawPillarLabel(p, drop(p.index)));
  }

  function drawPillarBody(p: PillarModel, d: number, rPx: number) {
    const atmo = p.atmo;
    ctx.save();
    ctx.globalAlpha = d;

    /* ── caduta lungo il PROPRIO asse ───────────────────────────────────────
       Non è un fade e non è una traslazione verticale in Y schermo. In questa
       camera l'altezza si proietta radialmente verso l'esterno: un monolito che
       cade dal cielo parte quindi PIÙ IN FUORI e rientra nel proprio invaso.
       Una caduta verticale identica per tutti e cinque sarebbe lo stesso errore
       di proiezione che il corpo di V3 commetteva — e che qui è stato corretto:
       non va reintrodotto nell'animazione.                                    */
    const fallH = (1 - easeOutCubic(d)) * cfg.pillarFallHeightR;
    if (fallH > 0) {
      const out = (p.baseR * fallH) / Math.max(1e-6, cfg.cameraHeightR - fallH);
      ctx.translate(Math.cos(p.angle) * out * R, Math.sin(p.angle) * out * R);
    }

    const poly = (pts: { x: number; y: number }[]) => {
      ctx.beginPath();
      pts.forEach((pt, i) => {
        const q = toPx(pt);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.closePath();
    };

    /* facce: basalto in basso, vetro in alto, con gradiente sull'altezza */
    const baseQ = toPx(p.base);
    const tipQ = toPx(p.tip);
    const faceGrad = (shade: number) => {
      const g = ctx.createLinearGradient(baseQ.x, baseQ.y, tipQ.x, tipQ.y);
      const dark = mixHex(palette.basalt, palette.teal, 0.5);
      const lit = mixHex(palette.basalt, palette.ivory, clamp01(shade) * 0.75);
      g.addColorStop(0, rgba(dark, 1));
      g.addColorStop(0.45, lit);
      g.addColorStop(1, mixHex(lit, palette.ivory, 0.25));
      return g;
    };

    const shadeL = p.shadeLeft * (1 - atmo);
    const shadeR = p.shadeRight * (1 - atmo);
    const mid = { x: (p.shaft[0].x + p.shaft[1].x) / 2, y: (p.shaft[0].y + p.shaft[1].y) / 2 };
    const midTop = { x: (p.shaft[2].x + p.shaft[3].x) / 2, y: (p.shaft[2].y + p.shaft[3].y) / 2 };

    ctx.fillStyle = faceGrad(shadeL);
    poly([p.shaft[0], mid, midTop, p.shaft[3]]);
    ctx.fill();

    ctx.fillStyle = faceGrad(shadeR);
    poly([mid, p.shaft[1], p.shaft[2], midTop]);
    ctx.fill();

    /* piramidion: è quello che fa leggere "obelisco" invece di "scatola" */
    ctx.fillStyle = faceGrad((shadeL + shadeR) / 2 + 0.12);
    poly(p.pyramidion);
    ctx.fill();

    /* spigolo: una sola hairline, nessuno shimmer animato */
    const a = toPx(p.ridge[0]);
    const b = toPx(p.ridge[1]);
    ctx.strokeStyle = rgba(palette.warmGold, 0.28 * (1 - atmo));
    ctx.lineWidth = Math.max(1, R * 0.003);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    drawPillarSemantics(p, rPx, atmo);
    ctx.restore();
  }

  /**
   * Il check avversariale, disegnato SUL monolito.
   *
   *   livello d'oro  → stat del PG
   *   architrave     → soglia di difficoltà
   *   cresta / morso → scarto
   *
   * È questo che manda in pensione il pannello di confronto separato: un
   * elemento invece di due, e l'informazione sta dove la si guarda già.
   */
  function drawPillarSemantics(p: PillarModel, rPx: number, atmo: number) {
    const dim = 1 - atmo;

    /* 1. livello d'oro: riempie il fusto fino alla stat */
    const lvl = clamp01(p.statNorm);
    if (lvl > 0.002) {
      const seg = crossSegment(p, cfg, lvl);
      const baseSeg = crossSegment(p, cfg, 0);
      const q0 = toPx(baseSeg[0]);
      const q1 = toPx(baseSeg[1]);
      const q2 = toPx(seg[1]);
      const q3 = toPx(seg[0]);
      const g = ctx.createLinearGradient(q0.x, q0.y, q3.x, q3.y);
      g.addColorStop(0, rgba(palette.gold, 0.5 * dim));
      g.addColorStop(1, rgba(palette.warmGold, 0.85 * dim));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(q0.x, q0.y);
      ctx.lineTo(q1.x, q1.y);
      ctx.lineTo(q2.x, q2.y);
      ctx.lineTo(q3.x, q3.y);
      ctx.closePath();
      ctx.fill();
    }

    /* 2. architrave della difficoltà: sporge oltre il fusto, così si legge
          come una soglia imposta dall'esterno e non come parte del pilastro */
    const dl = clamp01(p.difficultyNorm);
    const lint = crossSegment(p, cfg, dl, cfg.lintelOverhang);
    const l0 = toPx(lint[0]);
    const l1 = toPx(lint[1]);
    ctx.strokeStyle = rgba(palette.ivory, 0.82 * dim);
    ctx.lineWidth = Math.max(cfg.lintelLipWidthPx, R * 0.006);
    ctx.beginPath();
    ctx.moveTo(l0.x, l0.y);
    ctx.lineTo(l1.x, l1.y);
    ctx.stroke();

    /* 3. scarto: cresta se supera, morso se non arriva */
    const delta = readableDelta(p, cfg, rPx);
    if (delta === 0) return;
    const from = Math.min(lvl, dl);
    const to = Math.max(lvl, dl);
    const a0 = crossSegment(p, cfg, from, 1.02);
    const a1 = crossSegment(p, cfg, to, 1.02);
    const p0 = toPx(a0[0]);
    const p1 = toPx(a0[1]);
    const p2 = toPx(a1[1]);
    const p3 = toPx(a1[0]);

    if (delta > 0) {
      /* cresta: il margine sopra la soglia, con un riflesso che lo stacca */
      ctx.fillStyle = rgba(palette.warmGold, 0.55 * dim);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
      if (cfg.crestSpecularEnabled && tier !== 'glyph') {
        ctx.strokeStyle = rgba(palette.ivory, 0.5 * dim);
        ctx.lineWidth = Math.max(1, R * 0.0025);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    } else {
      /* morso: il deficit sotto la soglia, tratteggiato — è un vuoto, non
         una massa, e il tratteggio lo dice senza aggiungere un colore */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.clip();
      ctx.strokeStyle = rgba(palette.teal, 0.85 * dim);
      ctx.lineWidth = Math.max(1, R * 0.0035);
      const step = Math.max(3, R * 0.02);
      const ang = (cfg.biteHatchAngleDeg * Math.PI) / 180;
      const dx = Math.cos(ang) * R;
      const dy = Math.sin(ang) * R;
      const cxp = (p0.x + p2.x) / 2;
      const cyp = (p0.y + p2.y) / 2;
      for (let k = -8; k <= 8; k += 1) {
        const ox = -Math.sin(ang) * k * step;
        const oy = Math.cos(ang) * k * step;
        ctx.beginPath();
        ctx.moveTo(cxp + ox - dx, cyp + oy - dy);
        ctx.lineTo(cxp + ox + dx, cyp + oy + dy);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /**
   * Etichetta TANGENZIALE sull'anello.
   *
   * V3 usava placche DOM ancorate via `emitLayout`: il contratto di coordinate
   * più fragile del componente, che si scollava al resize e in un box da 380px
   * veniva tagliato da `overflow:hidden`. Qui il testo è sul canvas e corre
   * lungo la tangente, quindi l'estensione radiale è la sola altezza del font:
   * il clipping diventa geometricamente impossibile, non improbabile.
   */
  function drawPillarLabel(p: PillarModel, d: number) {
    if (d <= 0.2) return;
    const a = p.angle;
    const rr = R * cfg.labelRingR;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;

    const full = tier === 'full';
    const size = Math.max(8, R * (full ? 0.062 : 0.056));
    const label = full
      ? `${p.skillName} ${p.statValue}`
      : tier === 'compact'
        ? `${p.skillName.slice(0, 3).toUpperCase()} ${p.statValue}`
        : `${p.statValue}`;

    ctx.save();
    ctx.globalAlpha = d;
    ctx.translate(x, y);
    /* tangente: il testo gira col cerchio, mai radiale */
    let rot = a + Math.PI / 2;
    if (Math.cos(a) < 0) rot += Math.PI; // niente testo a testa in giù
    ctx.rotate(rot);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${size}px "Cinzel", Georgia, serif`;
    ctx.fillStyle = rgba(palette.ivory, 0.9);
    ctx.fillText(label, 0, 0);

    if (full) {
      ctx.font = `500 ${size * 0.78}px "Cinzel", Georgia, serif`;
      ctx.fillStyle = rgba(palette.ivory, 0.45);
      ctx.fillText(`${p.difficultyValue}`, 0, size * 0.95);
    }
    ctx.restore();
  }

  /* ── il terremoto ───────────────────────────────────────────────────────
     La lastra si spacca e sotto c'è il cielo: `clip(nastro)` +
     `drawImage(backdrop)`. Il verde stellato non si dipinge, si SMASCHERA.   */
  function drawFracture(f: FractureModel, open: number, healed: number) {
    if (f.kind === 'none' || open <= 0) return;
    const semantic = f.kind === 'death' ? palette.death : palette.wound;

    const ribbonPath = (branch: (typeof f.branches)[number], o: number): Path2D | null => {
      const poly = ribbonPolygon(branch, o);
      if (poly.length < 3) return null;
      const path = new Path2D();
      poly.forEach((pt, i) => {
        const q = toPx(pt);
        if (i === 0) path.moveTo(q.x, q.y);
        else path.lineTo(q.x, q.y);
      });
      path.closePath();
      return path;
    };

    /* ── passata A: fuori dal fiore, fenditura piena ── */
    ctx.save();
    ctx.clip(outsideStarPath, 'evenodd');

    f.branches.forEach((branch) => {
      const path = ribbonPath(branch, open);
      if (!path) return;

      /* ombra dentro la fessura: lo spessore della lastra che cade dentro.
         Nessun blur: è lo stesso path traslato. */
      ctx.save();
      ctx.translate(cfg.crackShadowOffsetPx * dpr, cfg.crackShadowOffsetPx * dpr);
      ctx.fillStyle = rgba(palette.teal, cfg.crackShadowAlpha * open);
      ctx.fill(path);
      ctx.restore();

      /* il cielo, smascherato */
      ctx.save();
      ctx.clip(path);
      ctx.drawImage(backdrop, 0, 0);
      /* dentro la crepa le stelle riprendono peso: è l'unico posto dove lo
         starfield calmato torna a brillare */
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < cfg.crackStarCount; i += 1) {
        const n = branch.nodes[Math.floor((i / cfg.crackStarCount) * branch.nodes.length)];
        if (!n) continue;
        const q = toPx(n);
        ctx.fillStyle = rgba(palette.ivory, 0.5);
        ctx.beginPath();
        ctx.arc(q.x, q.y, Math.max(0.6, R * 0.004), 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      /* nucleo semantico: TINTA, mai emissione */
      ctx.fillStyle = rgba(semantic, cfg.crackCoreFillAlpha * open);
      ctx.fill(path);

      /* labbro illuminato, coerente col rig NW */
      ctx.strokeStyle = rgba(palette.ivory, cfg.crackLipAlpha * open);
      ctx.lineWidth = Math.max(1, R * 0.0025);
      ctx.stroke(path);
    });

    /* detriti */
    if (cfg.debrisEnabled && open > 0.4) {
      ctx.fillStyle = rgba(palette.basalt, 0.85);
      f.debris.forEach((d) => {
        const q = toPx(d);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(d.rot);
        const s = d.r * R;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      });
    }
    ctx.restore();

    /* ── passata B: sopra il fiore, solo hairline in ombra ───────────────
       Stessa polilinea, nessun gap, nessun labbro. Si legge come una lastra
       d'avorio INTATTA posata su un piano che si è spaccato SOTTO.
       `rStarAt` non viene chiamata da una sola riga di questo blocco: il
       fiore è intoccabile per costruzione, non per convenzione.             */
    if (cfg.fractureStarCrossMode !== 'avoid') {
      ctx.save();
      ctx.clip(starPath);
      ctx.strokeStyle = rgba(palette.teal, 0.35 * open);
      ctx.lineWidth = Math.max(1, R * 0.0035);
      f.branches.forEach((branch) => {
        ctx.beginPath();
        branch.nodes.forEach((n, i) => {
          const q = toPx(n);
          if (i === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.stroke();
      });
      ctx.restore();
    }

    /* ── cicatrice: ciò che resta quando la ferita si è richiusa ── */
    if (healed > 0) {
      ctx.save();
      ctx.clip(challengePath);
      ctx.strokeStyle = rgba(semantic, cfg.scarAlpha * healed);
      ctx.lineWidth = Math.max(1, R * 0.003);
      f.branches.forEach((branch) => {
        ctx.beginPath();
        branch.nodes.forEach((n, i) => {
          const q = toPx(n);
          if (i === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  /* ── pallina ── */
  function drawBall(now: number) {
    const q = toPx(ballUnit);
    /* trail */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    trail.forEach((t) => {
      const age = clamp01(1 - (now - t.t) / cfg.trailFadeMs);
      if (age <= 0) return;
      const p = toPx(t);
      ctx.globalAlpha = age * 0.4;
      ctx.fillStyle = rgba(palette.warmGold, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, R * 0.02 * age, 0, TAU);
      ctx.fill();
    });
    ctx.restore();

    const rr = R * 0.026;
    const g = ctx.createRadialGradient(q.x - rr * 0.3, q.y - rr * 0.3, 0, q.x, q.y, rr);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, palette.warmGold);
    g.addColorStop(1, rgba(palette.gold, 0.9));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(q.x, q.y, rr, 0, TAU);
    ctx.fill();
  }

  /* ── flash di zona ──────────────────────────────────────────────────────
     V3 pulsava con periodo 2.1s (dentro la soglia in cui l'occhio insegue) e
     faceva EMETTERE cremisi e viola, che sono canali semantici. Qui è un
     flash a decadimento esponenziale su dt, spento entro zoneFlashDecayMs.   */
  function drawZoneFlash() {
    if (zoneFlash <= 0.001 || !cfg.glowSecondaryEnabled) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = zoneFlash * 0.3;
    ctx.fillStyle = rgba(resultZone === 'star' || resultZone === 'crit' ? palette.warmGold : palette.ivory, 1);
    ctx.fill(resultZone === 'star' ? starPath : challengePath);
    ctx.restore();
  }

  /* ── timeline ─────────────────────────────────────────────────────────── */
  let chalReveal = 0;
  let starScale = 0;
  let pillarDrop = new Array(AXES).fill(0);
  let quakeOpen = 0;
  let quakeHealed = 0;
  let shakeT0 = 0;
  let shakeActive = false;
  /** Istante di atterraggio di ciascun monolito, -1 se non è ancora atterrato.
   *  Alimenta la micro-scossa d'impatto: cinque colpi sfalsati dallo stagger. */
  let pillarImpactAt: number[] = new Array(AXES).fill(-1);
  let riskDeclared = false;
  /** Comparsa dell'arco che dichiara la quantità di rischio. Sale nella
   *  finestra armRisk e poi RESTA: il rischio dichiarato è leggibile per tutto
   *  il tempo in cui il giocatore può ancora decidere se spendere qualcosa. */
  let riskArcReveal = 0;

  function tickTimeline(now: number) {
    const dtMs = Math.max(0, now - lastFrame);

    /* decadimento esponenziale su dt: indipendente dal frame rate */
    if (zoneFlash > 0) zoneFlash *= Math.exp(-dtMs / cfg.zoneFlashDecayMs);

    if (phase === 'arm') {
      /* clock UNICO con quattro inviluppi SOVRAPPOSTI. V3 aveva quattro fasi
         in sequenza per 3400ms; qui l'arm chiude a 900. */
      chalReveal = easeOutBack(envelope(now, phaseT0, cfg.armThreatStart, cfg.armThreatEnd));
      starScale = easeOutBack(envelope(now, phaseT0, cfg.armAgencyStart, cfg.armAgencyEnd));
      for (let i = 0; i < AXES; i += 1) {
        const s = cfg.armThreatStart + i * cfg.pillarStaggerMs;
        pillarDrop[i] = easeOutCubic(envelope(now, phaseT0, s, s + cfg.pillarDropMs));
        /* il monolito si è appena piantato: registra il colpo. Cinque impatti
           sfalsati dallo stagger, non un rimbombo unico. */
        if (pillarDrop[i] >= 1 && pillarImpactAt[i] < 0) {
          pillarImpactAt[i] = now;
          opts.onSound?.('pillar-slam');
        }
      }
      /* la QUANTITÀ di rischio è dichiarata durante l'arm, non dopo: è ciò che
         rende informata la scelta dei consumabili prima del lancio */
      riskArcReveal = cfg.riskDeclaredAtArm
        ? easeOutCubic(envelope(now, phaseT0, cfg.armRiskStart, cfg.armRiskEnd))
        : 0;
      if (cfg.riskDeclaredAtArm && !riskDeclared && now - phaseT0 >= cfg.armRiskStart) {
        riskDeclared = true;
        opts.onRiskDeclared?.({
          deathPct: snap.input.deathPct,
          woundPct: snap.input.woundPct,
        });
      }
      if (now - phaseT0 >= cfg.tArmTotal) {
        chalReveal = 1;
        starScale = 1;
        pillarDrop = new Array(AXES).fill(1);
        if (cfg.riskDeclaredAtArm) riskArcReveal = 1;
        setArmed(true);
        setPhase('ready');
      }
      return;
    }

    if (phase === 'the-spin' && trajectory) {
      const u = clamp01((now - phaseT0) / cfg.tSpinWallMs);
      const tTraj = timeWarp(u) * trajectory.durationMs;
      ballUnit = sampleTrajectoryAt(trajectory, tTraj);
      trail.push({ x: ballUnit.x, y: ballUnit.y, t: now });
      while (trail.length && now - trail[0].t > cfg.trailFadeMs) trail.shift();
      while (
        nextBounce < trajectory.bounceTimes.length &&
        trajectory.bounceTimes[nextBounce] <= tTraj
      ) {
        opts.onSound?.('bounce');
        nextBounce += 1;
      }
      cameraZoom = 1 + cfg.cameraPushIn * easeOutCubic(u);
      if (u >= 1) {
        ballUnit = trajectory.landing;
        zoneFlash = 1;
        opts.onSound?.('snap');
        setPhase('impact');
      }
      return;
    }

    if (phase === 'impact') {
      /* hit-stop: un frame tenuto, niente si muove */
      if (phaseP(cfg.tHitStopMs) >= 1) setPhase('settle');
      return;
    }

    if (phase === 'settle') {
      const p = phaseP(cfg.tSettleMs);
      cameraZoom = 1 + cfg.cameraPushIn * (1 - 0.5 * p);
      if (p >= 1) {
        setPhase('verdict');
        if (outcome) {
          opts.onResolve?.({ outcome, zone: resultZone, landing: trajectory!.landing });
          opts.onSound?.(outcome.success ? 'success' : 'failure');
        }
      }
      return;
    }

    if (phase === 'verdict') {
      if (phaseP(cfg.tVerdictInMs) >= 1) setPhase('closure');
      return;
    }

    if (phase === 'closure') {
      /* 260ms in cui NULLA si muove. È il punto fermo a fine frase e la prova
         temporale che il rischio è un secondo tiro. Sotto i 200ms i due
         eventi si fondono e il rischio torna a leggersi come parte del D100. */
      if (phaseP(cfg.tClosureBeatMs) >= 1) {
        setPhase('risk');
        shakeT0 = performance.now();
        shakeActive = true;
        if (fracture && fracture.kind !== 'none') opts.onSound?.('quake');
      }
      return;
    }

    if (phase === 'risk') {
      const el = now - phaseT0;
      const f = fracture;
      const hasQuake = !!f && f.kind !== 'none';

      if (!hasQuake) {
        /* flessione senza frattura: il secondo dado va VISTO comunque, o il
           giocatore non impara che è stato tirato */
        if (el >= cfg.riskFlexMs && !riskRevealed) revealRisk();
        if (el >= cfg.riskFlexMs + 120) setPhase('done');
        return;
      }

      const tPre = cfg.quakePreTremorMs;
      const tFrac = tPre + cfg.quakeFractureMs;
      const tSpread = tFrac + cfg.quakeSpreadMs;
      const tEnd = tSpread + (f!.kind === 'wound' ? cfg.quakeHealMs : cfg.quakeSinkMs);

      if (el < tPre) {
        quakeOpen = 0;
      } else if (el < tFrac) {
        quakeOpen = easeOutQuart((el - tPre) / cfg.quakeFractureMs) * 0.35;
      } else if (el < tSpread) {
        quakeOpen = 0.35 + easeOutCubic((el - tFrac) / cfg.quakeSpreadMs) * 0.65;
      } else if (f!.kind === 'wound') {
        /* LA FERITA SI CHIUDE: la larghezza va a 0, la lunghezza resta */
        const p = clamp01((el - tSpread) / cfg.quakeHealMs);
        quakeOpen = 1 - easeOutCubic(p);
        quakeHealed = p;
      } else {
        /* LA MORTE RESTA APERTA */
        quakeOpen = 1;
      }

      if (el >= tSpread && !riskRevealed) revealRisk();
      if (el >= tEnd) {
        shakeActive = false;
        setPhase('done');
      }
      return;
    }
  }

  function revealRisk() {
    riskRevealed = true;
    if (outcome) {
      opts.onRiskRevealed?.({
        riskRoll: outcome.riskRoll,
        wounded: outcome.wounded,
        dead: outcome.dead,
      });
    }
  }

  /* ── loop ─────────────────────────────────────────────────────────────── */
  let lastFrame = performance.now();
  let raf = 0;

  function frameBody(now: number) {
    tickTimeline(now);
    if (backdropDirty) paintBackdrop();
    const s = currentSnap(now);
    ensurePaths(s, Math.max(0.001, starScale), 1, morphFrom !== null);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    /* ── camera ───────────────────────────────────────────────────────────
       Zoom E scossa vivono QUI DENTRO. Tre conseguenze, tutte volute:
        (a) la scatola non trema — è DOM, disegnata fuori dal canvas: il
            contenuto si rompe dentro un contenitore fermo;
        (b) la pallina trema INSIEME al campo, quindi non cambia di un pixel
            la sua posizione relativa alla zona in cui è atterrata. Se si
            muovesse, il giocatore dedurrebbe che il terremoto ha influito;
        (c) la result plate è DOM e resta immobile mentre il canvas scuote:
            prova visiva diretta che ciò che ha detto il risultato non è ciò
            che si è rotto.                                                   */
    let sx = 0;
    let sy = 0;
    const shakeAllowed = boardPx >= cfg.shakeMinBoardPx && !opts.reducedMotion;

    if (shakeAllowed) {
      /* 1. scossa del terremoto */
      if (shakeActive && fracture) {
        const noQuake = fracture.kind === 'none';
        const amp = noQuake
          ? cfg.shakeAmpWound * cfg.riskFlexAmpMul
          : fracture.shakeAmp;
        const tau = noQuake ? 60 : fracture.shakeTauMs;
        const o = shakeOffset(now - shakeT0, amp, tau, cfg);
        sx += o.x * R;
        sy += o.y * R;
      }
      /* 2. micro-impatti dei monoliti che si piantano nel piano.
            Si SOMMANO: cinque colpi sfalsati dallo stagger, ognuno che decade
            in ~90ms, invece di un rimbombo unico. È il contatto che si legge. */
      for (let i = 0; i < AXES; i += 1) {
        const t0 = pillarImpactAt[i];
        if (t0 < 0) continue;
        const el = now - t0;
        if (el > cfg.pillarImpactTauMs * 5) continue;
        const o = shakeOffset(el, cfg.pillarImpactShakeAmp, cfg.pillarImpactTauMs, cfg);
        sx += o.x * R;
        sy += o.y * R;
      }
    }
    ctx.translate(cx + sx, cy + sy);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-cx, -cy);

    ctx.drawImage(backdrop, 0, 0);
    drawStars(now);
    if (chalReveal > 0) drawChallenge(s, chalReveal);
    if (riskArcReveal > 0) drawRiskDeclaration(s, riskArcReveal);
    if (starScale > 0) {
      const glow = phase === 'arm' || phase === 'ready' ? 1 : 0;
      drawStar(s, starScale, glow);
    }
    if (chalReveal > 0) drawPillars(now, (i) => pillarDrop[i]);
    if (fracture && quakeOpen > 0) drawFracture(fracture, quakeOpen, quakeHealed);
    else if (fracture && quakeHealed > 0) drawFracture(fracture, 0.001, quakeHealed);
    drawZoneFlash();
    if (phase === 'the-spin' || phase === 'impact' || phase === 'settle' ||
        phase === 'verdict' || phase === 'closure' || phase === 'risk' || phase === 'done') {
      drawBall(now);
    }
    ctx.restore();
  }

  function frame(now: number) {
    try {
      frameBody(now);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[dav5] frame error', e);
    }
    lastFrame = now;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  /* ── API ──────────────────────────────────────────────────────────────── */
  function rebuild() {
    const effective = applyModifiersToInput(input, activeModifiers, cfg);
    morphFrom = snap;
    morphT0 = performance.now();
    snap = buildGeometry(effective, cfg);
    pillars = buildPillars(snap, cfg);
    cachedPathsFor = null;
    emitReadout();
  }

  function startRoll() {
    trajectory = null;
    outcome = null;
    /* RESET ESPLICITO della frattura: l'astrolabio viene riusato per fasi
       consecutive nella stessa quest, e il basalto spaccato non deve
       sopravvivere al round successivo. È un bug silenzioso: si vedrebbe solo
       al secondo tiro. */
    fracture = null;
    quakeOpen = 0;
    quakeHealed = 0;
    shakeActive = false;
    riskRevealed = false;
    trail.length = 0;
    nextBounce = 0;
    cameraZoom = 1;
    zoneFlash = 0;
    ballUnit = { x: 0, y: 0 };
    chalReveal = 0;
    starScale = 0;
    pillarDrop = new Array(AXES).fill(0);
    pillarImpactAt = new Array(AXES).fill(-1);
    riskDeclared = false;
    riskArcReveal = 0;
    setArmed(false);
    opts.onSound?.('arm');
    if (opts.reducedMotion) {
      chalReveal = 1;
      starScale = 1;
      pillarDrop = new Array(AXES).fill(1);
      if (cfg.riskDeclaredAtArm) {
        riskArcReveal = 1;
        riskDeclared = true;
        opts.onRiskDeclared?.({
          deathPct: snap.input.deathPct,
          woundPct: snap.input.woundPct,
        });
      }
      setArmed(true);
      setPhase('ready');
    } else {
      setPhase('arm');
    }
    emitReadout();
  }

  function doThrow() {
    if (phase === 'the-spin' || phase === 'impact') return;
    chalReveal = 1;
    starScale = 1;
    pillarDrop = new Array(AXES).fill(1);
    /* il rischio dichiarato resta a schermo: era già leggibile prima del tiro
       e non deve sparire proprio nel momento in cui diventa rilevante */
    if (cfg.riskDeclaredAtArm) riskArcReveal = 1;
    setArmed(false);
    seedCounter = (seedCounter + 0x1000193) >>> 0;
    const sim = simulateThrowV5(snap, seedCounter, cfg);
    outcome = sim.outcome;
    trajectory = sim.trajectory;
    resultZone = classify(trajectory.landing, snap);
    fracture = buildFracture(snap, sim.outcome, trajectory.landing, seedCounter, cfg);
    nextBounce = 0;
    ballUnit = trajectory.points[0];
    opts.onSound?.('spin');
    if (opts.reducedMotion) {
      ballUnit = trajectory.landing;
      zoneFlash = 1;
      setPhase('settle');
    } else {
      setPhase('the-spin');
    }
  }

  function skip() {
    if (phase === 'idle') return;
    if (!trajectory) {
      doThrow();
      return;
    }
    ballUnit = trajectory.landing;
    quakeOpen = fracture && fracture.kind === 'death' ? 1 : 0;
    quakeHealed = fracture && fracture.kind === 'wound' ? 1 : 0;
    shakeActive = false;
    if (!riskRevealed) revealRisk();
    setPhase('done');
  }

  emitReadout();

  return {
    roll: startRoll,
    throw: doThrow,
    skip,
    setInput(next: GeometryInput) {
      input = next;
      rebuild();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(resizeTimer);
      canvas.remove();
    },
    /* ── AstrolabeModifierApi (contratto già consumato da V4) ── */
    addModifier(m: AstrolabeModifier) {
      activeModifiers.push(m);
      rebuild();
      modifierListeners.forEach((l) => l([...activeModifiers]));
    },
    removeModifier(id: string) {
      const i = activeModifiers.findIndex((m) => m.id === id);
      if (i >= 0) {
        activeModifiers.splice(i, 1);
        rebuild();
        modifierListeners.forEach((l) => l([...activeModifiers]));
      }
    },
    clearModifiers() {
      activeModifiers.length = 0;
      rebuild();
      modifierListeners.forEach((l) => l([]));
    },
    getModifiers: () => [...activeModifiers],
    onModifiersChanged(l: ModifiersChangedListener) {
      modifierListeners.add(l);
      return () => modifierListeners.delete(l);
    },
    previewModifier() { /* la preview ghost non è parte della V5 */ },
    clearPreview() { /* idem */ },
  } as AstrolabeV5EngineHandle;
}
