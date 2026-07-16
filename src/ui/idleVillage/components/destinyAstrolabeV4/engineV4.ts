/**
 * engineV4.ts — Destiny Astrolabe V4: stessa architettura informativa della V3
 * (zone ∝ probabilità, D100 pre-rollato, canali colore esclusivi) con i tre
 * assi estetici recuperati dalla V1:
 *   1. GHIERA MATERICA — bronzo battuto pre-cotto su offscreen (bevel, brush,
 *      borchie con specular e ombra), non un gradiente piatto;
 *   2. OBELISCHI CARISMATICI — cristalli d'ossidiana grandi e sfaccettati,
 *      anello di base bronzo, rim oro + spigolo azzurro vivo;
 *   3. CLIMAX — shockwave anulare dal punto di atterraggio (mai fog sopra
 *      l'arena: il landing point resta la prova visiva).
 *
 * La logica pura (geometry/zones/simulation/modifiers) è riusata dalla V3.
 */
import {
  astrolabeV3Config,
  type AstrolabeV3Config,
} from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';
import {
  AXES,
  TAU,
  buildGeometry,
  lerpGeometry,
  rChallengeAt,
  rStarAt,
  tipAngle,
  type AstrolabeSkill,
  type GeometryInput,
  type GeometrySnapshot,
} from '../destinyAstrolabeV3/geometry';
import { classify, type Point, type Zone } from '../destinyAstrolabeV3/zones';
import { simulateThrow, type AstrolabeOutcome, type Trajectory } from '../destinyAstrolabeV3/simulation';
import {
  applyModifiersToInput,
  type AstrolabeModifier,
  type AstrolabeModifierApi,
  type ModifiersChangedListener,
} from '../destinyAstrolabeV3/modifiers';

export type EnginePhase =
  | 'idle'
  | 'ring-lock'
  | 'threat-slam'
  | 'agency-burst'
  | 'risk-pour'
  | 'action-trigger'
  | 'the-spin'
  | 'magnetic-snap'
  | 'resolution';

export interface AstrolabeV4Result {
  outcome: AstrolabeOutcome;
  zone: Zone;
  landing: Point;
}

export interface EngineV4Opts {
  input: GeometryInput;
  config?: Partial<AstrolabeV3Config>;
  reducedMotion?: boolean;
  onState?: (s: EnginePhase) => void;
  onArmed?: (armed: boolean) => void;
  onResolve?: (r: AstrolabeV4Result) => void;
  /** ancore placche label in px CSS relative al wrap, spinte FUORI dal bordo sfida */
  onLayout?: (anchors: { x: number; y: number; axis: number; skill: number }[]) => void;
  onSound?: (kind: 'slam' | 'burst' | 'spin' | 'bounce' | 'snap' | 'success' | 'failure') => void;
}

export interface AstrolabeV4EngineHandle extends AstrolabeModifierApi {
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

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const ZONE_COLOR: Record<Zone, keyof Palette> = {
  star: 'ivory',
  'near-miss': 'ivory',
  crown: 'wound',
  void: 'death',
  ruin: 'obsidian',
  crit: 'obsidian',
};

export function createAstrolabeV4Engine(
  root: HTMLElement,
  opts: EngineV4Opts,
): AstrolabeV4EngineHandle {
  const cfg: AstrolabeV3Config = { ...astrolabeV3Config, ...(opts.config ?? {}) };
  const palette = readPalette(root);

  const canvas = document.createElement('canvas');
  canvas.className = 'dav4-canvas';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  /* ── sizing ── */
  let dpr = 1;
  let cx = 400;
  let cy = 400;
  let R = 360;
  const backdrop = document.createElement('canvas');
  const ringLayer = document.createElement('canvas'); // ghiera pre-cotta (asse 1)
  let backdropDirty = true;

  function resize() {
    const rect = root.getBoundingClientRect();
    const size = Math.max(160, Math.min(rect.width, rect.height));
    dpr = Math.min(cfg.dprCap, window.devicePixelRatio || 1);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    cx = canvas.width / 2;
    cy = canvas.height / 2;
    R = Math.min(canvas.width, canvas.height) * 0.42;
    backdropDirty = true;
    emitLayout();
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
  resize(); // dopo l'init di snap: emitLayout legge la geometria
  /* il flex layout può assestarsi dopo il mount: ri-misura a breve distanza */
  const settleTimers = [
    window.setTimeout(resize, 50),
    window.setTimeout(resize, 250),
    window.setTimeout(resize, 800),
  ];

  let ghostSnap: GeometrySnapshot | null = null;
  let morphFrom: GeometrySnapshot | null = null;
  let morphT0 = 0;
  const activeModifiers: AstrolabeModifier[] = [];
  const modifierListeners = new Set<ModifiersChangedListener>();

  let phase: EnginePhase = 'idle';
  let phaseT0 = performance.now();
  let armed = false;
  let seedCounter = Math.floor(Math.random() * 2 ** 31);

  let trajectory: Trajectory | null = null;
  let outcome: AstrolabeOutcome | null = null;
  let resultZone: Zone = 'ruin';
  let spinClock = 0;
  let lastFrame = performance.now();
  let hitStopUntil = 0;
  let cameraZoom = 1;
  let flashT = 0;
  /* shockwave climax: anello che si espande dal landing point */
  let shockT = -1; // -1 = inattiva; 0..1 progressione

  interface TrailPoint { x: number; y: number; t: number; }
  const trail: TrailPoint[] = [];
  let ballPx: Point = { x: 0, y: 0 };
  let nextBounce = 0;

  /* starfield parallattico */
  type Star = { x: number; y: number; r: number; ph: number };
  const starLayers: Star[][] = [90, 45, 18].map((n, li) =>
    Array.from({ length: n }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: (0.3 + Math.random() * 0.6) * (1 + li * 0.5),
      ph: Math.random() * TAU,
    })),
  );
  let tiltX = 0;
  let tiltY = 0;
  let tiltCx = 0;
  let tiltCy = 0;
  const onMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    tiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    tiltY = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
  };
  document.addEventListener('mousemove', onMove);

  const bgImg = new Image();
  bgImg.onload = () => { backdropDirty = true; };
  bgImg.src = '/assets/ui/bg.png';
  const grainImg = new Image();
  grainImg.onload = () => { backdropDirty = true; };
  grainImg.src = '/assets/ui/oil-grain.png';

  const toPx = (p: Point): Point => ({ x: cx + p.x * R, y: cy + p.y * R });

  function currentSnap(now: number): GeometrySnapshot {
    if (!morphFrom) return snap;
    const t = clamp((now - morphT0) / cfg.tMorphMs, 0, 1);
    if (t >= 1) {
      morphFrom = null;
      return snap;
    }
    return lerpGeometry(morphFrom, snap, easeOutCubic(t));
  }

  function setPhase(s: EnginePhase) {
    phase = s;
    phaseT0 = performance.now();
    opts.onState?.(s);
  }
  const phaseP = (dur: number) => clamp((performance.now() - phaseT0) / dur, 0, 1);
  function setArmed(a: boolean) {
    if (armed !== a) {
      armed = a;
      opts.onArmed?.(a);
    }
  }

  function emitLayout() {
    if (!opts.onLayout) return;
    const rootRect = root.getBoundingClientRect();
    const cvRect = canvas.getBoundingClientRect();
    const offX = cvRect.left - rootRect.left;
    const offY = cvRect.top - rootRect.top;
    /* anti-collisione: le placche stanno FUORI dal bordo sfida, lungo l'asse,
       così non coprono mai stella/corona/voragini */
    const anchors = Array.from({ length: AXES }, (_, i) => {
      const a = tipAngle(i);
      const r = Math.min(0.99, rChallengeAt(snap, a) + 0.14);
      return {
        x: offX + (cx + Math.cos(a) * r * R) / dpr,
        y: offY + (cy + Math.sin(a) * r * R) / dpr,
        axis: i,
        skill: snap.axisSkill[i],
      };
    });
    opts.onLayout(anchors);
  }

  /* ── path builders ── */
  const SEG = 180;
  let cachedPathsFor: GeometrySnapshot | null = null;
  let starPath = new Path2D();
  let challengePath = new Path2D();
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
    cachedPathsFor = s;
  }

  /* ── backdrop pre-cotto (materia + velatura + vignetta + leak) ── */
  function paintBackdrop() {
    backdrop.width = canvas.width;
    backdrop.height = canvas.height;
    const b = backdrop.getContext('2d')!;
    b.clearRect(0, 0, backdrop.width, backdrop.height);
    b.save();
    b.beginPath();
    b.arc(cx, cy, R * 1.02, 0, TAU);
    b.clip();
    if (bgImg.complete && bgImg.naturalWidth) {
      const scale = Math.max((R * 2.04) / bgImg.width, (R * 2.04) / bgImg.height);
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
    const veil = b.createRadialGradient(cx, cy, 0, cx, cy, R);
    veil.addColorStop(0, 'rgb(30,64,74)');
    veil.addColorStop(1, 'rgb(8,18,28)');
    b.fillStyle = veil;
    b.fillRect(0, 0, backdrop.width, backdrop.height);
    b.globalCompositeOperation = 'overlay';
    if (grainImg.complete && grainImg.naturalWidth) {
      b.globalAlpha = 0.12;
      for (let x = cx - R; x < cx + R; x += grainImg.width) {
        for (let y = cy - R; y < cy + R; y += grainImg.height) {
          b.drawImage(grainImg, x, y);
        }
      }
      b.globalAlpha = 1;
    }
    b.globalCompositeOperation = 'screen';
    const leak = b.createRadialGradient(cx - R * 0.7, cy - R * 0.7, 0, cx - R * 0.7, cy - R * 0.7, R * 1.4);
    leak.addColorStop(0, rgba(palette.azure, 0.16));
    leak.addColorStop(0.5, rgba(palette.azure, 0.03));
    leak.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = leak;
    b.fillRect(0, 0, backdrop.width, backdrop.height);
    b.globalCompositeOperation = 'source-over';
    const vig = b.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.02);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    b.fillStyle = vig;
    b.fillRect(0, 0, backdrop.width, backdrop.height);
    b.restore();

    paintRingLayer();
    backdropDirty = false;
  }

  /* ── ASSE 1: ghiera materica pre-cotta (bronzo battuto stile V1) ── */
  function paintRingLayer() {
    ringLayer.width = canvas.width;
    ringLayer.height = canvas.height;
    const b = ringLayer.getContext('2d')!;
    b.clearRect(0, 0, ringLayer.width, ringLayer.height);
    const outer = R * 1.16;
    const inner = R * 1.02;
    const mid = (outer + inner) / 2;
    const bandW = outer - inner;

    /* ombra portata della ghiera sul fondo */
    b.save();
    b.beginPath();
    b.arc(cx, cy + R * 0.012, outer * 1.01, 0, TAU);
    b.arc(cx, cy, inner * 0.99, 0, TAU, true);
    b.fillStyle = 'rgba(0,0,0,0.45)';
    b.fill('evenodd');
    b.restore();

    /* corpo bronzo: luce da alto-sinistra */
    const body = b.createLinearGradient(cx - outer, cy - outer, cx + outer, cy + outer);
    body.addColorStop(0, '#a8843e');
    body.addColorStop(0.22, '#e9c96f');
    body.addColorStop(0.42, '#8a652a');
    body.addColorStop(0.6, '#c9a040');
    body.addColorStop(0.8, '#6e5122');
    body.addColorStop(1, '#3f2d12');
    b.beginPath();
    b.arc(cx, cy, outer, 0, TAU);
    b.arc(cx, cy, inner, 0, TAU, true);
    b.fillStyle = body;
    b.fill('evenodd');

    /* battitura: archi radiali irregolari (brush) dentro la banda */
    b.save();
    b.beginPath();
    b.arc(cx, cy, outer, 0, TAU);
    b.arc(cx, cy, inner, 0, TAU, true);
    b.clip('evenodd');
    for (let i = 0; i < 140; i += 1) {
      const a0 = (i / 140) * TAU + Math.sin(i * 12.9898) * 0.02;
      const rr = inner + ((Math.sin(i * 78.233) + 1) / 2) * bandW;
      const len = 0.02 + ((Math.sin(i * 43.758) + 1) / 2) * 0.05;
      const light = Math.sin(i * 91.7) > 0;
      b.strokeStyle = light ? 'rgba(255,236,180,0.10)' : 'rgba(30,18,4,0.18)';
      b.lineWidth = Math.max(1, R * 0.004);
      b.beginPath();
      b.arc(cx, cy, rr, a0, a0 + len);
      b.stroke();
    }
    /* macchie di ossidazione */
    for (let i = 0; i < 26; i += 1) {
      const a0 = Math.sin(i * 12.1) * TAU;
      const rr = mid + Math.sin(i * 5.3) * bandW * 0.3;
      const px = cx + Math.cos(a0) * rr;
      const py = cy + Math.sin(a0) * rr;
      const g = b.createRadialGradient(px, py, 0, px, py, R * 0.03);
      g.addColorStop(0, 'rgba(52,36,10,0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = g;
      b.beginPath();
      b.arc(px, py, R * 0.03, 0, TAU);
      b.fill();
    }
    b.restore();

    /* bevel: filo chiaro esterno-alto, scuro interno-basso */
    b.lineWidth = Math.max(1.5, R * 0.006);
    b.strokeStyle = 'rgba(255,240,200,0.55)';
    b.beginPath();
    b.arc(cx, cy, outer - b.lineWidth / 2, Math.PI * 0.9, Math.PI * 1.9);
    b.stroke();
    b.strokeStyle = 'rgba(20,12,2,0.7)';
    b.beginPath();
    b.arc(cx, cy, outer - b.lineWidth / 2, Math.PI * -0.1, Math.PI * 0.9);
    b.stroke();
    /* gola interna incisa (doppio filo) */
    b.lineWidth = Math.max(1, R * 0.003);
    b.strokeStyle = 'rgba(20,12,2,0.85)';
    b.beginPath();
    b.arc(cx, cy, inner + R * 0.012, 0, TAU);
    b.stroke();
    b.strokeStyle = rgba(palette.warmGold, 0.5);
    b.beginPath();
    b.arc(cx, cy, inner + R * 0.018, 0, TAU);
    b.stroke();

    /* borchie: specular alto-sx + ombra portata bassa */
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * TAU + 0.12;
      const bx = cx + Math.cos(a) * mid;
      const by = cy + Math.sin(a) * mid;
      const br = R * 0.02;
      b.fillStyle = 'rgba(0,0,0,0.5)';
      b.beginPath();
      b.ellipse(bx + br * 0.25, by + br * 0.45, br * 1.05, br * 0.8, 0, 0, TAU);
      b.fill();
      const rg = b.createRadialGradient(bx - br * 0.4, by - br * 0.4, 0, bx, by, br);
      rg.addColorStop(0, '#fff6d8');
      rg.addColorStop(0.35, palette.warmGold);
      rg.addColorStop(0.75, '#8a652a');
      rg.addColorStop(1, '#3a2810');
      b.fillStyle = rg;
      b.beginPath();
      b.arc(bx, by, br, 0, TAU);
      b.fill();
      b.fillStyle = 'rgba(255,255,255,0.85)';
      b.beginPath();
      b.arc(bx - br * 0.35, by - br * 0.38, br * 0.18, 0, TAU);
      b.fill();
    }
  }

  function drawRing(reveal: number) {
    if (reveal <= 0) return;
    ctx.save();
    ctx.globalAlpha = reveal;
    if (reveal < 1) {
      const s = 1 + (1 - reveal) * 0.12;
      ctx.translate(cx, cy);
      ctx.scale(s, s);
      ctx.translate(-cx, -cy);
    }
    ctx.drawImage(ringLayer, 0, 0);
    ctx.restore();
  }

  function drawStars(now: number) {
    tiltCx += (tiltX - tiltCx) * 0.04;
    tiltCy += (tiltY - tiltCy) * 0.04;
    const t = now / 1000;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.01, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    starLayers.forEach((layer, li) => {
      const depth = (li + 1) / 3;
      const speed = [0.6, 1.0, 1.5][li];
      const base = [0.15, 0.24, 0.36][li];
      layer.forEach((s, si) => {
        const tw = 0.5 + 0.5 * Math.sin(t * speed + s.ph);
        ctx.globalAlpha = base + base * 0.6 * tw;
        ctx.fillStyle = si % 3 === 0 ? rgba(palette.azure, 0.9) : '#ffe9a8';
        ctx.beginPath();
        ctx.arc(
          cx - R + s.x * R * 2 + tiltCx * depth * dpr,
          cy - R + s.y * R * 2 + tiltCy * depth * dpr,
          s.r * dpr,
          0,
          TAU,
        );
        ctx.fill();
      });
    });
    ctx.restore();
  }

  let sceneStarScale = 0;

  function drawChallenge(s: GeometrySnapshot, reveal: number) {
    if (reveal <= 0.001) return;
    ensurePaths(s, sceneStarScale, reveal, true);
    ctx.save();
    const fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    fill.addColorStop(0, rgba(palette.obsidian, 0.98));
    fill.addColorStop(1, 'rgba(2,4,9,0.96)');
    ctx.fillStyle = fill;
    ctx.fill(challengePath);
    if (s.critThickness > 0) {
      ctx.save();
      ctx.clip(challengePath);
      const critInner = polarPath(s, (ss, a) => rChallengeAt(ss, a) - ss.critThickness, reveal);
      ctx.fillStyle = 'rgba(120,120,130,0.16)';
      const both = new Path2D();
      both.addPath(challengePath);
      both.addPath(critInner);
      ctx.fill(both, 'evenodd');
      ctx.restore();
    }
    ctx.strokeStyle = rgba(palette.gold, 0.55);
    ctx.lineWidth = Math.max(1.5, R * 0.008);
    ctx.stroke(challengePath);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = Math.max(1, R * 0.003);
    ctx.stroke(challengePath);
    ctx.restore();
  }

  /* ── stella d'avorio caldo: traslucenza a 3 stop, cap ma non gesso ── */
  function drawStar(s: GeometrySnapshot, scale: number, highlight: number) {
    if (scale <= 0.001) return;
    const path = polarPath(s, rStarAt, scale);
    ctx.save();
    const maxTip = Math.max(...s.axisTip) * R * scale;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxTip);
    g.addColorStop(0, `rgba(255,250,235,${0.88 + 0.08 * highlight})`);
    g.addColorStop(0.45, 'rgba(243,232,205,0.78)');
    g.addColorStop(0.78, 'rgba(226,203,156,0.62)');
    g.addColorStop(1, 'rgba(196,163,106,0.46)');
    ctx.fillStyle = g;
    ctx.fill(path);
    /* vena interna: secondo fiore più piccolo, caldo (finto subsurface) */
    const innerPath = polarPath(s, rStarAt, scale * 0.62);
    const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxTip * 0.62);
    ig.addColorStop(0, 'rgba(255,241,200,0.5)');
    ig.addColorStop(1, 'rgba(255,241,200,0)');
    ctx.fillStyle = ig;
    ctx.fill(innerPath);
    /* bordo: doppio filo, avorio + oro scuro sotto */
    ctx.strokeStyle = 'rgba(120,92,44,0.8)';
    ctx.lineWidth = Math.max(1.5, R * 0.006);
    ctx.stroke(path);
    ctx.strokeStyle = rgba(palette.ivory, 0.95);
    ctx.lineWidth = Math.max(1, R * 0.003);
    ctx.stroke(path);
    ctx.restore();
  }

  /* ── rischio: corona con sangue che sbava, voragini che assorbono ── */
  function drawRisk(s: GeometrySnapshot, pour: number) {
    if (pour <= 0.001) return;
    ctx.save();
    if (s.input.woundPct > 0) {
      const half = (s.woundThickness / 2) * pour;
      const outerBleed = polarPath(s, (ss, a) => rStarAt(ss, a) + half * 1.9);
      const outer = polarPath(s, (ss, a) => rStarAt(ss, a) + half);
      const inner = polarPath(s, (ss, a) => Math.max(0.02, rStarAt(ss, a) - half));
      /* bleed esterno morbido (sangue che filtra nel buio) */
      const bleed = new Path2D();
      bleed.addPath(outerBleed);
      bleed.addPath(outer);
      ctx.fillStyle = rgba(palette.wound, 0.16 * pour);
      ctx.fill(bleed, 'evenodd');
      /* banda vera: piena, con filo scuro interno */
      const band = new Path2D();
      band.addPath(outer);
      band.addPath(inner);
      ctx.fillStyle = rgba(palette.wound, 0.58 * pour);
      ctx.fill(band, 'evenodd');
      ctx.strokeStyle = 'rgba(40,4,10,0.8)';
      ctx.lineWidth = Math.max(1, R * 0.002);
      ctx.stroke(inner);
      ctx.strokeStyle = rgba(palette.wound, 0.9 * pour);
      ctx.stroke(outer);
    }
    if (s.voidRadius > 0) {
      s.voidCenters.forEach((c) => {
        const p = toPx(c);
        const vr = s.voidRadius * pour * R;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, vr);
        g.addColorStop(0, 'rgba(4,0,10,0.97)');
        g.addColorStop(0.55, rgba(palette.death, 0.55));
        g.addColorStop(0.9, rgba(palette.death, 0.2));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, vr, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(palette.death, 0.65 * pour);
        ctx.lineWidth = Math.max(1, R * 0.0025);
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  /* ── ASSE 2: obelischi-cristallo carismatici ── */
  interface Pillar { drop: number; flash: number; }
  const pillars: Pillar[] = Array.from({ length: AXES }, () => ({ drop: 0, flash: 0 }));
  function drawObelisks(s: GeometrySnapshot, now: number) {
    ctx.save();
    for (let i = 0; i < AXES; i += 1) {
      const pl = pillars[i];
      if (pl.drop <= 0) continue;
      const a = tipAngle(i);
      const base = rChallengeAt(s, a) * R;
      const bx = cx + Math.cos(a) * base;
      const by = cy + Math.sin(a) * base;
      const h = R * 0.26 * pl.drop; // ~60% più alti della V3
      const w = R * 0.055;
      const lean = 0.14 + (i % 2) * 0.05;
      const dirX = -Math.cos(a);
      const dirY = -Math.sin(a);
      const tipX = bx + dirX * h * lean * 2.4;
      const tipY = by + dirY * h * lean * 2.4 - h;
      const skew = (i - 2) * w * 0.15;

      /* anello di base bronzo (firma V1) + ombra di ancoraggio */
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(bx, by + w * 0.28, w * 1.9, w * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(palette.gold, 0.75);
      ctx.lineWidth = Math.max(1.2, R * 0.004);
      ctx.beginPath();
      ctx.ellipse(bx, by + w * 0.1, w * 1.55, w * 0.5, 0, 0, TAU);
      ctx.stroke();

      /* tre facce: sinistra scura, centrale media, destra riflettente */
      const leftX = bx - w + skew;
      const midLX = bx - w * 0.25 + skew;
      const midRX = bx + w * 0.3 + skew;
      const rightX = bx + w * 0.95 + skew;
      const shoulderY = by - h * 0.16;
      const faceL = new Path2D();
      faceL.moveTo(leftX, by);
      faceL.lineTo(tipX, tipY);
      faceL.lineTo(midLX, shoulderY);
      faceL.closePath();
      const faceM = new Path2D();
      faceM.moveTo(midLX, shoulderY);
      faceM.lineTo(tipX, tipY);
      faceM.lineTo(midRX, shoulderY * 0.995 + by * 0.005);
      faceM.lineTo(midRX, by);
      faceM.lineTo(midLX, by);
      faceM.closePath();
      const faceR = new Path2D();
      faceR.moveTo(midRX, shoulderY);
      faceR.lineTo(tipX, tipY);
      faceR.lineTo(rightX, by);
      faceR.closePath();
      ctx.fillStyle = 'rgba(4,8,16,0.97)';
      ctx.fill(faceL);
      const gm = ctx.createLinearGradient(midLX, tipY, midRX, by);
      gm.addColorStop(0, 'rgba(26,38,56,0.97)');
      gm.addColorStop(1, 'rgba(10,16,28,0.97)');
      ctx.fillStyle = gm;
      ctx.fill(faceM);
      const gr = ctx.createLinearGradient(midRX, tipY, rightX, by);
      gr.addColorStop(0, 'rgba(44,64,88,0.95)');
      gr.addColorStop(1, 'rgba(16,24,40,0.95)');
      ctx.fillStyle = gr;
      ctx.fill(faceR);

      /* rim oro sullo spigolo sinistro, azzurro vivo sul destro */
      ctx.strokeStyle = rgba(palette.gold, 0.85 + pl.flash * 0.15);
      ctx.lineWidth = Math.max(1.2, R * 0.0035);
      ctx.beginPath();
      ctx.moveTo(leftX, by);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      const shimmer = 0.5 + 0.35 * Math.sin(now / 700 + i * 1.3);
      ctx.strokeStyle = rgba(palette.azure, shimmer + pl.flash * 0.4);
      ctx.lineWidth = Math.max(1.4, R * 0.004);
      ctx.beginPath();
      ctx.moveTo(rightX, by);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      /* scintilla in punta */
      const tg = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, w * 0.9);
      tg.addColorStop(0, rgba(palette.azure, 0.5 * shimmer + pl.flash * 0.4));
      tg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(tipX, tipY, w * 0.9, 0, TAU);
      ctx.fill();

      if (pl.flash > 0.01) {
        ctx.fillStyle = rgba(palette.warmGold, pl.flash * 0.5);
        ctx.beginPath();
        ctx.arc(bx, by, w * 2.2 * pl.flash, 0, TAU);
        ctx.fill();
      }
      pl.flash = Math.max(0, pl.flash - 0.03);
    }
    ctx.restore();
  }

  function drawBall(now: number) {
    if (!trajectory) return;
    const p = ballPx;
    ctx.save();
    for (let i = trail.length - 1; i >= 0; i -= 1) {
      const tp = trail[i];
      const age = now - tp.t;
      if (age > cfg.trailFadeMs) {
        trail.splice(i, 1);
        continue;
      }
      const a = 1 - age / cfg.trailFadeMs;
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = palette.warmGold;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, R * 0.012 * a + 1, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const br = R * 0.028;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, br * 2.2);
    g.addColorStop(0, '#fffdf2');
    g.addColorStop(0.35, palette.warmGold);
    g.addColorStop(0.7, rgba(palette.gold, 0.5));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, br * 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGhost() {
    if (!ghostSnap) return;
    ctx.save();
    ctx.setLineDash([6 * dpr, 5 * dpr]);
    ctx.strokeStyle = rgba(palette.azure, 0.8);
    ctx.lineWidth = Math.max(1, R * 0.004);
    ctx.stroke(polarPath(ghostSnap, rStarAt));
    ctx.strokeStyle = rgba(palette.gold, 0.5);
    ctx.stroke(polarPath(ghostSnap, rChallengeAt));
    ctx.restore();
  }

  /* ── ASSE 3: climax — shockwave anulare dal landing point + zona illuminata.
     Mai fog sull'arena: il punto di atterraggio resta sempre leggibile. ── */
  function drawResolutionFx(s: GeometrySnapshot, now: number) {
    if (phase !== 'magnetic-snap' && phase !== 'resolution') return;
    if (!trajectory) return;
    const lp = toPx(trajectory.landing);
    const colorKey = ZONE_COLOR[resultZone];
    const color = colorKey === 'obsidian' ? '#9aa0ad' : palette[colorKey];

    /* zona illuminata pulsante */
    const pulse = flashT > 0 ? flashT : 0.4 + 0.15 * Math.sin(now / 300);
    const g = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, R * 0.16);
    g.addColorStop(0, rgba(color, 0.5 * pulse));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, R * 0.16, 0, TAU);
    ctx.fill();
    flashT = Math.max(0, flashT - 0.02);

    /* shockwave: doppio anello che si espande e sfuma, clippato nell'arena */
    if (shockT >= 0 && shockT < 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.01, 0, TAU);
      ctx.clip();
      const e = easeOutCubic(shockT);
      const rad = e * R * 1.3;
      const alpha = (1 - shockT) * 0.7;
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = Math.max(2, R * 0.014 * (1 - shockT));
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, rad, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(palette.warmGold, alpha * 0.6);
      ctx.lineWidth = Math.max(1, R * 0.006 * (1 - shockT));
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, rad * 0.82, 0, TAU);
      ctx.stroke();
      ctx.restore();
      shockT += 0.02;
    }
  }

  /* ── timeline ── */
  let ringReveal = 0;
  let chalReveal = 0;
  let pourP = 0;

  function tickTimeline(now: number) {
    switch (phase) {
      case 'ring-lock': {
        const p = phaseP(cfg.tRingLock);
        ringReveal = easeOutCubic(p);
        if (p >= 1) setPhase('threat-slam');
        break;
      }
      case 'threat-slam': {
        const p = phaseP(cfg.tThreatSlam);
        chalReveal = clamp(easeOutBack(p), 0, 1.05);
        pillars.forEach((pl, i) => {
          const local = clamp((p - i * 0.11) / 0.4, 0, 1);
          const prev = pl.drop;
          pl.drop = local * local * local;
          if (prev < 1 && pl.drop >= 1) {
            pl.flash = 1;
            opts.onSound?.('slam');
          }
        });
        if (p >= 1) {
          chalReveal = 1;
          setPhase('agency-burst');
          opts.onSound?.('burst');
        }
        break;
      }
      case 'agency-burst': {
        const p = phaseP(cfg.tAgencyBurst);
        sceneStarScale = clamp(easeOutBack(p), 0, 1.08);
        if (p >= 1) {
          sceneStarScale = 1;
          setPhase('risk-pour');
        }
        break;
      }
      case 'risk-pour': {
        pourP = easeOutCubic(phaseP(cfg.tRiskPour));
        if (phaseP(cfg.tRiskPour) >= 1) {
          pourP = 1;
          setArmed(true);
          setPhase('action-trigger');
        }
        break;
      }
      case 'action-trigger':
        break;
      case 'the-spin': {
        if (!trajectory) break;
        if (now < hitStopUntil) break;
        const dt = Math.min(50, now - lastFrame);
        const dLand =
          Math.hypot(ballPx.x - toPx(trajectory.landing).x, ballPx.y - toPx(trajectory.landing).y) / R;
        const nearEnd = spinClock / trajectory.durationMs > 0.55;
        const scale = nearEnd && dLand < cfg.slowMoDistance ? cfg.slowMoScale : 1;
        spinClock += dt * scale;
        const prog = spinClock / trajectory.durationMs;
        cameraZoom = 1 + cfg.cameraPushIn * clamp((prog - 0.3) / 0.5, 0, 1);
        const pts = trajectory.points;
        const idx = clamp(Math.floor((spinClock / trajectory.durationMs) * (pts.length - 1)), 0, pts.length - 1);
        ballPx = toPx(pts[idx]);
        trail.push({ ...ballPx, t: now });
        while (nextBounce < trajectory.bounceIndices.length && trajectory.bounceIndices[nextBounce] <= idx) {
          opts.onSound?.('bounce');
          nextBounce += 1;
        }
        if (spinClock >= trajectory.durationMs) {
          ballPx = toPx(trajectory.landing);
          hitStopUntil = now + cfg.hitStopFreezeMs;
          flashT = 1;
          shockT = 0;
          opts.onSound?.('snap');
          setPhase('magnetic-snap');
        }
        break;
      }
      case 'magnetic-snap': {
        if (now < hitStopUntil) break;
        if (phaseP(cfg.tSnap) >= 1) doResolve();
        break;
      }
      default:
        break;
    }
  }

  function doResolve() {
    setPhase('resolution');
    cameraZoom = 1 + cfg.cameraPushIn;
    if (outcome && trajectory) {
      opts.onSound?.(outcome.success ? 'success' : 'failure');
      opts.onResolve?.({ outcome, zone: resultZone, landing: trajectory.landing });
    }
  }

  /* ── draw loop ── */
  let raf = 0;
  let destroyed = false;
  function frame(now: number) {
    if (destroyed) return;
    try {
      frameBody(now);
    } catch (e) {
      /* un errore di draw non deve mai uccidere il loop */
      // eslint-disable-next-line no-console
      console.error('[dav4] frame error', e);
    }
    lastFrame = now;
    raf = requestAnimationFrame(frame);
  }
  function frameBody(now: number) {
    tickTimeline(now);
    if (backdropDirty) paintBackdrop();
    const s = currentSnap(now);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (cameraZoom !== 1) {
      ctx.translate(cx, cy);
      ctx.scale(cameraZoom, cameraZoom);
      ctx.translate(-cx, -cy);
    }
    ctx.drawImage(backdrop, 0, 0);
    drawStars(now);
    if (chalReveal > 0) {
      drawChallenge(s, chalReveal);
      drawObelisks(s, now);
    }
    if (sceneStarScale > 0) drawStar(s, sceneStarScale, phase === 'resolution' && outcome?.success ? 1 : 0);
    if (pourP > 0) drawRisk(s, pourP);
    drawGhost();
    drawResolutionFx(s, now);
    if (phase === 'the-spin' || phase === 'magnetic-snap' || phase === 'resolution') drawBall(now);
    ctx.restore();
    drawRing(ringReveal);
  }
  raf = requestAnimationFrame(frame);

  /* ── API ── */
  function rebuild() {
    const effective = applyModifiersToInput(input, activeModifiers, cfg);
    morphFrom = snap;
    morphT0 = performance.now();
    snap = buildGeometry(effective, cfg);
    cachedPathsFor = null;
    emitLayout();
  }

  function startRoll() {
    trajectory = null;
    outcome = null;
    trail.length = 0;
    spinClock = 0;
    nextBounce = 0;
    cameraZoom = 1;
    pourP = 0;
    sceneStarScale = 0;
    chalReveal = 0;
    ringReveal = 0;
    shockT = -1;
    pillars.forEach((pl) => { pl.drop = 0; pl.flash = 0; });
    setArmed(false);
    if (opts.reducedMotion) {
      ringReveal = 1;
      chalReveal = 1;
      sceneStarScale = 1;
      pourP = 1;
      pillars.forEach((pl) => { pl.drop = 1; });
      setArmed(true);
      setPhase('action-trigger');
    } else {
      setPhase('ring-lock');
    }
  }

  function doThrow() {
    if (phase === 'the-spin' || phase === 'magnetic-snap') return;
    ringReveal = 1;
    chalReveal = 1;
    sceneStarScale = 1;
    pourP = 1;
    pillars.forEach((pl) => { pl.drop = 1; });
    setArmed(false);
    seedCounter = (seedCounter + 0x1000193) >>> 0;
    const sim = simulateThrow(snap, seedCounter, cfg);
    outcome = sim.outcome;
    trajectory = sim.trajectory;
    resultZone = classify(trajectory.landing, snap);
    spinClock = 0;
    nextBounce = 0;
    ballPx = toPx(trajectory.points[0]);
    if (opts.reducedMotion) {
      spinClock = trajectory.durationMs;
      ballPx = toPx(trajectory.landing);
      flashT = 1;
      shockT = 0;
      setPhase('magnetic-snap');
      hitStopUntil = 0;
      return;
    }
    opts.onSound?.('spin');
    setPhase('the-spin');
  }

  function skip() {
    if (phase === 'the-spin' && trajectory) {
      spinClock = trajectory.durationMs - 1;
      return;
    }
    if (phase !== 'idle' && phase !== 'resolution' && phase !== 'magnetic-snap') {
      doThrow();
    }
  }

  const notifyModifiers = () => modifierListeners.forEach((cb) => cb([...activeModifiers]));

  return {
    roll: startRoll,
    throw: doThrow,
    skip,
    setInput(next: GeometryInput) {
      input = next;
      rebuild();
    },
    previewModifier(m: AstrolabeModifier) {
      const preview = applyModifiersToInput(input, [...activeModifiers, m], cfg);
      ghostSnap = buildGeometry(preview, cfg);
    },
    clearPreview() {
      ghostSnap = null;
    },
    applyModifier(m: AstrolabeModifier) {
      ghostSnap = null;
      activeModifiers.push(m);
      rebuild();
      notifyModifiers();
    },
    revokeModifier(id: string) {
      const idx = activeModifiers.findIndex((m) => m.id === id);
      if (idx >= 0) {
        activeModifiers.splice(idx, 1);
        rebuild();
        notifyModifiers();
      }
    },
    onModifiersChanged(cb: ModifiersChangedListener) {
      modifierListeners.add(cb);
      return () => modifierListeners.delete(cb);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('mousemove', onMove);
      window.clearTimeout(resizeTimer);
      settleTimers.forEach((id) => window.clearTimeout(id));
      canvas.remove();
    },
  };
}

export type { AstrolabeSkill, GeometryInput };
