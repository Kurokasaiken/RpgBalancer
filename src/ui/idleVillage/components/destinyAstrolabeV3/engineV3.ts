/**
 * engineV3.ts — orchestratore canvas della V3 (piano §2, §3, §5, §6, §8).
 *
 * Possiede UN solo canvas. Timeline data-driven:
 *   idle → ring-lock → threat-slam → agency-burst → risk-pour →
 *   action-trigger (gated) → the-spin (3 atti + slow-mo a soglia) →
 *   magnetic-snap (hit-stop) → resolution
 *
 * Estetica: evoluzione V1 (ghiera bronzo, obelischi-cristallo D8, stella
 * d'avorio cappata, materia pittorica) su palette da --skin-* token.
 * Performance: backdrop pre-cotto su offscreen canvas; niente ctx.filter né
 * shadowBlur per-frame su path complessi; DPR cap; ResizeObserver.
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
  valleyAngle,
  type AstrolabeSkill,
  type GeometryInput,
  type GeometrySnapshot,
} from './geometry';
import { classify, type Point, type Zone } from './zones';
import { simulateThrow, type AstrolabeOutcome, type Trajectory } from './simulation';
import { applyModifiersToInput, type AstrolabeModifier, type AstrolabeModifierApi, type ModifiersChangedListener } from './modifiers';

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

export interface AstrolabeV3Result {
  outcome: AstrolabeOutcome;
  zone: Zone;
  landing: Point;
}

export interface EngineV3Opts {
  input: GeometryInput;
  config?: Partial<AstrolabeV3Config>;
  reducedMotion?: boolean;
  onState?: (s: EnginePhase) => void;
  onArmed?: (armed: boolean) => void;
  onResolve?: (r: AstrolabeV3Result) => void;
  /** posizioni ancore obelischi in px CSS (per le placche label nel layer React) */
  onLayout?: (anchors: { x: number; y: number; axis: number; skill: number }[]) => void;
  onSound?: (kind: 'slam' | 'burst' | 'spin' | 'bounce' | 'snap' | 'success' | 'failure') => void;
}

export interface AstrolabeV3EngineHandle extends AstrolabeModifierApi {
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

export function createAstrolabeV3Engine(
  root: HTMLElement,
  opts: EngineV3Opts,
): AstrolabeV3EngineHandle {
  const cfg: AstrolabeV3Config = { ...astrolabeV3Config, ...(opts.config ?? {}) };
  let palette = readPalette(root);

  const canvas = document.createElement('canvas');
  canvas.className = 'dav3-canvas';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  /* ── sizing ── */
  let sizePx = 800;
  let dpr = 1;
  let cx = 400;
  let cy = 400;
  let R = 360; // raggio arena in px device
  const backdrop = document.createElement('canvas');
  let backdropDirty = true;

  function resize() {
    const rect = root.getBoundingClientRect();
    const size = Math.max(160, Math.min(rect.width, rect.height));
    dpr = Math.min(cfg.dprCap, window.devicePixelRatio || 1);
    sizePx = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    cx = canvas.width / 2;
    cy = canvas.height / 2;
    R = Math.min(canvas.width, canvas.height) * 0.44;
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
  // il primo layout può avvenire prima che il flex posizioni il canvas:
  // ri-emetti le ancore quando il DOM è assestato (double rAF)
  requestAnimationFrame(() => requestAnimationFrame(() => emitLayout()));
  let ghostSnap: GeometrySnapshot | null = null; // preview modifier (outline)
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
  /* clock dello spin con time-scale (slow-mo a soglia + hit-stop) */
  let spinClock = 0;
  let lastFrame = performance.now();
  let hitStopUntil = 0;
  let cameraZoom = 1;
  let flashT = 0; // lampeggio zona alla cattura

  interface TrailPoint { x: number; y: number; t: number; }
  const trail: TrailPoint[] = [];
  let ballPx: Point = { x: 0, y: 0 };
  let nextBounce = 0;

  /* starfield parallattico (3 layer, dalla V2) */
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

  /* materia pittorica */
  const bgImg = new Image();
  bgImg.onload = () => { backdropDirty = true; };
  bgImg.src = '/assets/ui/bg.png';
  const grainImg = new Image();
  grainImg.onload = () => { backdropDirty = true; };
  grainImg.src = '/assets/ui/oil-grain.png';

  /* ── helpers spazio: normalizzato (unit) ↔ pixel ── */
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
    /* ancore in px CSS relative al wrap (il canvas è centrato nel root) */
    const rootRect = root.getBoundingClientRect();
    const cvRect = canvas.getBoundingClientRect();
    const offX = cvRect.left - rootRect.left;
    const offY = cvRect.top - rootRect.top;
    const anchors = Array.from({ length: AXES }, (_, i) => {
      const a = tipAngle(i);
      const r = rChallengeAt(snap, a);
      return {
        x: offX + (cx + Math.cos(a) * r * R) / dpr,
        y: offY + (cy + Math.sin(a) * r * R) / dpr,
        axis: i,
        skill: snap.axisSkill[i],
      };
    });
    opts.onLayout(anchors);
  }

  /* ── path builders (Path2D cache, rebuild solo su cambio geometria) ── */
  const SEG = 180;
  let cachedPathsFor: GeometrySnapshot | null = null;
  let starPath = new Path2D();
  let challengePath = new Path2D();
  function polarPath(s: GeometrySnapshot, rFn: (s: GeometrySnapshot, a: number) => number, scale = 1): Path2D {
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
    /* 1. pittura a olio (o fallback gradiente scuro) */
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
    /* 2. velatura teal scuro in multiply */
    b.globalCompositeOperation = 'multiply';
    const veil = b.createRadialGradient(cx, cy, 0, cx, cy, R);
    veil.addColorStop(0, 'rgb(28,62,72)');
    veil.addColorStop(1, 'rgb(8,18,28)');
    b.fillStyle = veil;
    b.fillRect(0, 0, backdrop.width, backdrop.height);
    /* 3. grana */
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
    /* 4. light-leak azzurro alto-sinistra (firma V9) */
    b.globalCompositeOperation = 'screen';
    const leak = b.createRadialGradient(cx - R * 0.7, cy - R * 0.7, 0, cx - R * 0.7, cy - R * 0.7, R * 1.4);
    leak.addColorStop(0, rgba(palette.azure, 0.16));
    leak.addColorStop(0.5, rgba(palette.azure, 0.03));
    leak.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = leak;
    b.fillRect(0, 0, backdrop.width, backdrop.height);
    /* 5. vignettatura da lente sul bordo interno ghiera */
    b.globalCompositeOperation = 'source-over';
    const vig = b.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.02);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    b.fillStyle = vig;
    b.fillRect(0, 0, backdrop.width, backdrop.height);
    b.restore();
    backdropDirty = false;
  }

  /* ── layer: ghiera bronzo ── */
  function drawRing(reveal: number) {
    if (reveal <= 0) return;
    const outer = R * 1.13 * (1 + (1 - reveal) * 0.15);
    const inner = R * 1.02;
    ctx.save();
    ctx.globalAlpha = reveal;
    const g = ctx.createLinearGradient(cx - outer, cy - outer, cx + outer, cy + outer);
    g.addColorStop(0, '#8a6a2f');
    g.addColorStop(0.35, palette.gold);
    g.addColorStop(0.55, '#7a5a28');
    g.addColorStop(0.8, palette.warmGold);
    g.addColorStop(1, '#5c421c');
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.arc(cx, cy, inner, 0, TAU, true);
    ctx.fillStyle = g;
    ctx.fill('evenodd');
    /* borchie */
    const mid = (outer + inner) / 2;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * TAU + 0.12;
      const bx = cx + Math.cos(a) * mid;
      const by = cy + Math.sin(a) * mid;
      const rg = ctx.createRadialGradient(bx - 2, by - 2, 0, bx, by, R * 0.018);
      rg.addColorStop(0, '#fff2c8');
      rg.addColorStop(0.5, palette.gold);
      rg.addColorStop(1, '#4a3414');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(bx, by, R * 0.016, 0, TAU);
      ctx.fill();
    }
    /* filo interno inciso */
    ctx.strokeStyle = rgba(palette.warmGold, 0.5);
    ctx.lineWidth = Math.max(1, R * 0.004);
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  /* ── layer: starfield parallattico ── */
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

  /* ── layer: superficie sfida (ossidiana) + banda crit ── */
  function drawChallenge(s: GeometrySnapshot, reveal: number) {
    if (reveal <= 0.001) return;
    ensurePaths(s, sceneStarScale, reveal, true);
    ctx.save();
    /* fill ossidiana opaca */
    const fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    fill.addColorStop(0, rgba(palette.obsidian, 0.98));
    fill.addColorStop(1, 'rgba(2,4,9,0.96)');
    ctx.fillStyle = fill;
    ctx.fill(challengePath);
    /* banda rovina critica: fumo denso dal bordo verso l'interno */
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
    /* bordo inciso bronzo scuro — un muro, non un neon */
    ctx.strokeStyle = rgba(palette.gold, 0.55);
    ctx.lineWidth = Math.max(1.5, R * 0.008);
    ctx.stroke(challengePath);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = Math.max(1, R * 0.003);
    ctx.stroke(challengePath);
    ctx.restore();
  }

  /* ── layer: stella d'avorio (luminanza cappata) ── */
  let sceneStarScale = 0;
  function drawStar(s: GeometrySnapshot, scale: number, highlight: number) {
    if (scale <= 0.001) return;
    const path = polarPath(s, rStarAt, scale);
    ctx.save();
    const maxTip = Math.max(...s.axisTip) * R;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxTip);
    /* cap: mai sopra ~70% del bianco pieno */
    g.addColorStop(0, rgba(palette.ivory, 0.72 + 0.1 * highlight));
    g.addColorStop(0.65, rgba(palette.ivory, 0.5));
    g.addColorStop(1, 'rgba(212,190,140,0.34)');
    ctx.fillStyle = g;
    ctx.fill(path);
    ctx.strokeStyle = rgba(palette.ivory, 0.85);
    ctx.lineWidth = Math.max(1, R * 0.004);
    ctx.stroke(path);
    ctx.restore();
  }

  /* ── layer: rischio (corona ferita + voragini) ── */
  function drawRisk(s: GeometrySnapshot, pour: number) {
    if (pour <= 0.001) return;
    ctx.save();
    /* corona cremisi: banda centrata sul perimetro stella */
    if (s.input.woundPct > 0) {
      const outer = polarPath(s, (ss, a) => rStarAt(ss, a) + (ss.woundThickness / 2) * pour);
      const inner = polarPath(s, (ss, a) => Math.max(0.02, rStarAt(ss, a) - (ss.woundThickness / 2) * pour));
      const band = new Path2D();
      band.addPath(outer);
      band.addPath(inner);
      ctx.fillStyle = rgba(palette.wound, 0.5 * pour);
      ctx.fill(band, 'evenodd');
      ctx.strokeStyle = rgba(palette.wound, 0.8 * pour);
      ctx.lineWidth = Math.max(1, R * 0.002);
      ctx.stroke(outer);
    }
    /* voragini viola: assorbono luce (lente scura + nucleo violaceo) */
    if (s.voidRadius > 0) {
      s.voidCenters.forEach((c) => {
        const p = toPx(c);
        const vr = s.voidRadius * pour * R;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, vr);
        g.addColorStop(0, 'rgba(4,0,10,0.96)');
        g.addColorStop(0.55, rgba(palette.death, 0.55));
        g.addColorStop(0.9, rgba(palette.death, 0.2));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, vr, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(palette.death, 0.6 * pour);
        ctx.lineWidth = Math.max(1, R * 0.0025);
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  /* ── layer: obelischi-cristallo (D8) ── */
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
      const h = R * 0.16 * pl.drop;
      const w = R * 0.035;
      /* leggera inclinazione verso il centro + asimmetria per asse */
      const lean = 0.16 + (i % 2) * 0.06;
      const dirX = -Math.cos(a);
      const dirY = -Math.sin(a);
      const tipX = bx + dirX * h * lean * 3;
      const tipY = by + dirY * h * lean * 3 - h;
      const skew = (i - 2) * w * 0.18;
      /* ombra morbida alla base (ancoraggio) */
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(bx, by + w * 0.3, w * 1.6, w * 0.55, 0, 0, TAU);
      ctx.fill();
      /* corpo: cristallo sfaccettato asimmetrico (due facce) */
      const leftX = bx - w + skew;
      const rightX = bx + w * 0.8 + skew;
      const midX = bx + skew * 0.4;
      const faceL = new Path2D();
      faceL.moveTo(leftX, by);
      faceL.lineTo(tipX, tipY);
      faceL.lineTo(midX, by - h * 0.12);
      faceL.closePath();
      const faceR = new Path2D();
      faceR.moveTo(midX, by - h * 0.12);
      faceR.lineTo(tipX, tipY);
      faceR.lineTo(rightX, by);
      faceR.closePath();
      ctx.fillStyle = 'rgba(6,10,18,0.96)';
      ctx.fill(faceL);
      ctx.fillStyle = 'rgba(14,22,34,0.96)';
      ctx.fill(faceR);
      /* rim bronzo + azzurro sugli spigoli */
      ctx.strokeStyle = rgba(palette.gold, 0.75 + pl.flash * 0.25);
      ctx.lineWidth = Math.max(1, R * 0.003);
      ctx.beginPath();
      ctx.moveTo(leftX, by);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      const shimmer = 0.35 + 0.3 * Math.sin(now / 900 + i * 1.3);
      ctx.strokeStyle = rgba(palette.azure, shimmer + pl.flash * 0.4);
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(rightX, by);
      ctx.stroke();
      /* flash di atterraggio */
      if (pl.flash > 0.01) {
        ctx.fillStyle = rgba(palette.warmGold, pl.flash * 0.5);
        ctx.beginPath();
        ctx.arc(bx, by, w * 2 * pl.flash, 0, TAU);
        ctx.fill();
      }
      pl.flash = Math.max(0, pl.flash - 0.03);
    }
    ctx.restore();
  }

  /* ── layer: pallina + trail ── */
  function drawBall(now: number) {
    if (!trajectory) return;
    const p = ballPx;
    ctx.save();
    /* motion trail persistente (fade da config) */
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
    /* scintilla grande: nucleo bianco-oro (≥2.5× la V1) */
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

  /* ── layer: ghost preview modifiers ── */
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

  /* ── layer: zona illuminata alla resolution ── */
  function drawResolutionGlow(s: GeometrySnapshot, now: number) {
    if (phase !== 'magnetic-snap' && phase !== 'resolution') return;
    if (!trajectory) return;
    const pulse = flashT > 0 ? flashT : 0.4 + 0.15 * Math.sin(now / 300);
    const colorKey = ZONE_COLOR[resultZone];
    const color = colorKey === 'obsidian' ? '#9aa0ad' : palette[colorKey];
    const lp = toPx(trajectory.landing);
    const g = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, R * 0.16);
    g.addColorStop(0, rgba(color, 0.5 * pulse));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, R * 0.16, 0, TAU);
    ctx.fill();
    flashT = Math.max(0, flashT - 0.02);
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
        /* obelischi calano in stagger */
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
        /* i lobi dominanti nascono per primi: scale globale con overshoot */
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
        break; // gated: attende THROW
      case 'the-spin': {
        if (!trajectory) break;
        if (now < hitStopUntil) break; // (hit-stop gestito in snap)
        const dt = Math.min(50, now - lastFrame);
        /* slow-mo a soglia: entro slowMoDistance dal landing il tempo scala */
        const dLand = Math.hypot(
          ballPx.x - toPx(trajectory.landing).x,
          ballPx.y - toPx(trajectory.landing).y,
        ) / R;
        const nearEnd = spinClock / trajectory.durationMs > 0.55;
        const scale = nearEnd && dLand < cfg.slowMoDistance ? cfg.slowMoScale : 1;
        spinClock += dt * scale;
        /* camera push-in durante la caccia */
        const prog = spinClock / trajectory.durationMs;
        cameraZoom = 1 + cfg.cameraPushIn * clamp((prog - 0.3) / 0.5, 0, 1);
        /* posizione pallina */
        const pts = trajectory.points;
        const idx = clamp(Math.floor((spinClock / trajectory.durationMs) * (pts.length - 1)), 0, pts.length - 1);
        const pt = pts[idx];
        ballPx = toPx(pt);
        trail.push({ ...ballPx, t: now });
        /* suoni rimbalzo */
        while (nextBounce < trajectory.bounceIndices.length && trajectory.bounceIndices[nextBounce] <= idx) {
          opts.onSound?.('bounce');
          nextBounce += 1;
        }
        if (spinClock >= trajectory.durationMs) {
          ballPx = toPx(trajectory.landing);
          /* hit-stop: freeze + flash zona */
          hitStopUntil = now + cfg.hitStopFreezeMs;
          flashT = 1;
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
      console.error('[dav3] frame error', e);
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
    /* camera push-in (canvas scale/translate, §A) */
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
    drawResolutionGlow(s, now);
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
    /* warp: completa qualunque reveal ancora in corso */
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
      /* salto diretto a snap+resolution (§5) */
      spinClock = trajectory.durationMs;
      ballPx = toPx(trajectory.landing);
      flashT = 1;
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
      canvas.remove();
    },
  };
}

export type { AstrolabeSkill, GeometryInput };
