/**
 * engineV4.ts — Destiny Astrolabe V4.
 *
 * Modello zone (vedi zonesV4.ts, tutte le % calibrate sull'area del NEMICO):
 *   nucleo (successo critico) · stella (successo) · banda bronzo esterna alla
 *   stella (Almost/near-miss) · nemico (fallimento) · banda interna al bordo
 *   nemico (fallimento critico) · strisce diagonali α30% (ferita/morte).
 *
 * Estetica: ghiera bronzo battuto pre-cotta, colonne NERE (valori richiesti
 * dalla prova, sul bordo nemico) + colonne BIANCHE (stat della spedizione,
 * sulle punte della stella), nemico in tono slate distinto dallo sfondo,
 * scena decluttered (niente corona/voragini/coni luce).
 *
 * Explanation mode: la timeline si ferma dopo ogni elemento presentato e
 * emette onExplain(step); riparte con handle.resume().
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
import type { Point } from '../destinyAstrolabeV3/zones';
import {
  applyModifiersToInput,
  type AstrolabeModifier,
  type AstrolabeModifierApi,
  type ModifiersChangedListener,
} from '../destinyAstrolabeV3/modifiers';
import { buildZonesV4, type ZonesV4, type ZoneV4 } from './zonesV4';
import { simulateThrowV4, type AstrolabeOutcomeV4 } from './simulationV4';
import type { Trajectory } from '../destinyAstrolabeV3/simulation';

export type EnginePhase =
  | 'idle'
  | 'ring-lock'
  | 'threat-pillars'
  | 'threat-surface'
  | 'agency-pillars'
  | 'agency-star'
  | 'risk-pour'
  | 'action-trigger'
  | 'the-spin'
  | 'magnetic-snap'
  | 'resolution';

export type ExplainStep = 'required' | 'enemy' | 'stats' | 'star' | 'legend';

export interface AstrolabeV4Result {
  outcome: AstrolabeOutcomeV4;
  zone: ZoneV4;
  landing: Point;
}

export interface EngineV4Opts {
  input: GeometryInput;
  config?: Partial<AstrolabeV3Config>;
  reducedMotion?: boolean;
  explainMode?: boolean;
  onState?: (s: EnginePhase) => void;
  onArmed?: (armed: boolean) => void;
  onResolve?: (r: AstrolabeV4Result) => void;
  onExplain?: (step: ExplainStep | null) => void;
  onLayout?: (anchors: { x: number; y: number; axis: number; skill: number }[]) => void;
  onSound?: (kind: 'slam' | 'burst' | 'spin' | 'bounce' | 'snap' | 'success' | 'failure') => void;
}

export interface AstrolabeV4EngineHandle extends AstrolabeModifierApi {
  roll(): void;
  throw(): void;
  skip(): void;
  resume(): void;
  setExplainMode(on: boolean): void;
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
  enemy: string;
  nucleus: string;
  stripeWound: string;
  stripeDeath: string;
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
    enemy: g('--skin-astro-enemy', '#26314a'),
    nucleus: g('--skin-astro-nucleus', '#ffe9b0'),
    stripeWound: g('--skin-astro-stripe-wound', '#c22a3d'),
    stripeDeath: g('--skin-astro-stripe-death', '#05060a'),
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

const ZONE_COLOR: Record<ZoneV4, keyof Palette> = {
  nucleus: 'nucleus',
  star: 'ivory',
  almost: 'gold',
  enemy: 'enemy',
  crit: 'obsidian',
};

export function createAstrolabeV4Engine(
  root: HTMLElement,
  opts: EngineV4Opts,
): AstrolabeV4EngineHandle {
  const cfg: AstrolabeV3Config = { ...astrolabeV3Config, ...(opts.config ?? {}) };
  const palette = readPalette(root);
  let explainMode = opts.explainMode ?? false;

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
  const ringLayer = document.createElement('canvas');
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
  let zones: ZonesV4 = rebuildZones(snap);
  resize();
  const settleTimers = [
    window.setTimeout(resize, 50),
    window.setTimeout(resize, 250),
    window.setTimeout(resize, 800),
  ];

  function rebuildZones(s: GeometrySnapshot): ZonesV4 {
    return buildZonesV4(s, {
      critSuccessPct: cfg.critSuccessPct,
      nearMissPct: cfg.nearMissPct,
      critPct: s.input.critPct,
      woundPct: s.input.woundPct,
      deathPct: s.input.deathPct,
      minVisualThickness: cfg.minVisualThickness,
    });
  }

  let ghostSnap: GeometrySnapshot | null = null;
  let morphFrom: GeometrySnapshot | null = null;
  let morphT0 = 0;
  const activeModifiers: AstrolabeModifier[] = [];
  const modifierListeners = new Set<ModifiersChangedListener>();

  let phase: EnginePhase = 'idle';
  let phaseT0 = performance.now();
  let armed = false;
  let seedCounter = Math.floor(Math.random() * 2 ** 31);

  /* explanation: pausa a fine fase */
  let paused = false;
  let pausedAt = 0;
  let pendingNext: (() => void) | null = null;

  let trajectory: Trajectory | null = null;
  let outcome: AstrolabeOutcomeV4 | null = null;
  let resultZone: ZoneV4 = 'enemy';
  let spinClock = 0;
  let lastFrame = performance.now();
  let hitStopUntil = 0;
  let cameraZoom = 1;
  let flashT = 0;
  let shockT = -1;

  interface TrailPoint { x: number; y: number; t: number; }
  const trail: TrailPoint[] = [];
  let ballPx: Point = { x: 0, y: 0 };
  let nextBounce = 0;

  /* starfield (2 layer: decluttered) */
  type Star = { x: number; y: number; r: number; ph: number };
  const starLayers: Star[][] = [70, 26].map((n, li) =>
    Array.from({ length: n }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: (0.3 + Math.random() * 0.6) * (1 + li * 0.6),
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

  /** Fine fase: o pausa esplicativa (explainMode) o transizione diretta. */
  function advance(step: ExplainStep | null, next: () => void) {
    if (explainMode && step) {
      paused = true;
      pausedAt = performance.now();
      pendingNext = next;
      opts.onExplain?.(step);
    } else {
      next();
    }
  }
  function resume() {
    if (!paused) return;
    paused = false;
    /* il tempo in pausa non conta per la fase corrente */
    phaseT0 += performance.now() - pausedAt;
    opts.onExplain?.(null);
    const next = pendingNext;
    pendingNext = null;
    next?.();
  }

  function emitLayout() {
    if (!opts.onLayout) return;
    const rootRect = root.getBoundingClientRect();
    const cvRect = canvas.getBoundingClientRect();
    const offX = cvRect.left - rootRect.left;
    const offY = cvRect.top - rootRect.top;
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

  /* ── backdrop pre-cotto ── */
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
    leak.addColorStop(0, rgba(palette.azure, 0.14));
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

  /* ── ghiera bronzo battuto pre-cotta ── */
  function paintRingLayer() {
    ringLayer.width = canvas.width;
    ringLayer.height = canvas.height;
    const b = ringLayer.getContext('2d')!;
    b.clearRect(0, 0, ringLayer.width, ringLayer.height);
    const outer = R * 1.16;
    const inner = R * 1.02;
    const mid = (outer + inner) / 2;
    const bandW = outer - inner;

    b.save();
    b.beginPath();
    b.arc(cx, cy + R * 0.012, outer * 1.01, 0, TAU);
    b.arc(cx, cy, inner * 0.99, 0, TAU, true);
    b.fillStyle = 'rgba(0,0,0,0.45)';
    b.fill('evenodd');
    b.restore();

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

    b.lineWidth = Math.max(1.5, R * 0.006);
    b.strokeStyle = 'rgba(255,240,200,0.55)';
    b.beginPath();
    b.arc(cx, cy, outer - b.lineWidth / 2, Math.PI * 0.9, Math.PI * 1.9);
    b.stroke();
    b.strokeStyle = 'rgba(20,12,2,0.7)';
    b.beginPath();
    b.arc(cx, cy, outer - b.lineWidth / 2, Math.PI * -0.1, Math.PI * 0.9);
    b.stroke();
    b.lineWidth = Math.max(1, R * 0.003);
    b.strokeStyle = 'rgba(20,12,2,0.85)';
    b.beginPath();
    b.arc(cx, cy, inner + R * 0.012, 0, TAU);
    b.stroke();
    b.strokeStyle = rgba(palette.warmGold, 0.5);
    b.beginPath();
    b.arc(cx, cy, inner + R * 0.018, 0, TAU);
    b.stroke();

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
      const depth = (li + 1) / 2;
      const speed = [0.6, 1.2][li];
      const base = [0.14, 0.26][li];
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

  /* ── NEMICO: superficie slate distinta dallo sfondo + bordo bronzo inciso ── */
  function drawEnemy(s: GeometrySnapshot, reveal: number) {
    if (reveal <= 0.001) return;
    const path = polarPath(s, rChallengeAt, reveal);
    ctx.save();
    const fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    fill.addColorStop(0, rgba(palette.enemy, 0.98));
    fill.addColorStop(0.75, rgba(palette.enemy, 0.94));
    fill.addColorStop(1, 'rgba(10,14,24,0.96)');
    ctx.fillStyle = fill;
    ctx.fill(path);
    /* tessitura minima: spicchi radiali appena percettibili (no clutter) */
    ctx.save();
    ctx.clip(path);
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < AXES; i += 1) {
      const a = tipAngle(i) + Math.PI / AXES;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.stroke();
    }
    ctx.restore();
    /* bordo: inciso bronzo scuro (muro, non neon) */
    ctx.strokeStyle = rgba(palette.gold, 0.5);
    ctx.lineWidth = Math.max(1.5, R * 0.007);
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = Math.max(1, R * 0.003);
    ctx.stroke(path);
    ctx.restore();
  }

  /* ── bande e strisce (risk-pour) ── */
  function drawZones(s: GeometrySnapshot, z: ZonesV4, pour: number) {
    if (pour <= 0.001) return;
    ctx.save();

    /* banda crit: si allarga verso l'interno del nemico (fumo denso) */
    if (z.critThickness > 0) {
      const outer = polarPath(s, rChallengeAt);
      const inner = polarPath(s, (ss, a) => Math.max(0.02, rChallengeAt(ss, a) - z.critThickness * pour));
      const band = new Path2D();
      band.addPath(outer);
      band.addPath(inner);
      ctx.fillStyle = `rgba(8,10,16,${0.75 * pour})`;
      ctx.fill(band, 'evenodd');
      ctx.strokeStyle = rgba(palette.gold, 0.25 * pour);
      ctx.lineWidth = Math.max(1, R * 0.002);
      ctx.stroke(inner);
    }

    /* strisce diagonali α30%: ferita (cremisi) e morte (nera) */
    const challengeClip = polarPath(s, rChallengeAt);
    const drawStripe = (spec: ZonesV4['woundStripe'], color: string) => {
      if (spec.halfWidth <= 0) return;
      ctx.save();
      ctx.clip(challengeClip);
      ctx.translate(cx, cy);
      ctx.rotate(Math.atan2(spec.ny, spec.nx));
      /* dopo la rotazione la normale è l'asse X: la striscia è la fascia
         x ∈ [offset−w, offset+w] */
      ctx.fillStyle = rgba(color, 0.3 * pour);
      ctx.fillRect((spec.offset - spec.halfWidth) * R, -R * 1.5, spec.halfWidth * 2 * R, R * 3);
      ctx.restore();
    };
    drawStripe(z.woundStripe, palette.stripeWound);
    drawStripe(z.deathStripe, palette.stripeDeath);

    /* banda bronzo (Almost): esterna alla stella — l'unico "bordo" della stella */
    if (z.almostThickness > 0) {
      const outer = polarPath(s, (ss, a) => rStarAt(ss, a) + z.almostThickness * pour);
      const inner = polarPath(s, rStarAt);
      const band = new Path2D();
      band.addPath(outer);
      band.addPath(inner);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, rgba(palette.gold, 0.75 * pour));
      g.addColorStop(1, rgba('#8a652a', 0.7 * pour));
      ctx.fillStyle = g;
      ctx.fill(band, 'evenodd');
      ctx.strokeStyle = 'rgba(30,18,4,0.6)';
      ctx.lineWidth = Math.max(1, R * 0.002);
      ctx.stroke(outer);
    }

    ctx.restore();
  }

  /* ── stella d'avorio + nucleo ── */
  let sceneStarScale = 0;
  function drawStar(
    s: GeometrySnapshot,
    z: ZonesV4,
    scale: number,
    pour: number,
    highlight: number,
  ) {
    if (scale <= 0.001) return;
    const path = polarPath(s, rStarAt, scale);
    ctx.save();
    const maxTip = Math.max(...s.axisTip) * R * scale;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxTip);
    g.addColorStop(0, `rgba(255,252,242,${0.92 + 0.06 * highlight})`);
    g.addColorStop(0.55, 'rgba(246,238,216,0.85)');
    g.addColorStop(1, 'rgba(226,206,162,0.6)');
    ctx.fillStyle = g;
    ctx.fill(path);
    /* filo di definizione sottile (il bordo vero è la banda bronzo) */
    ctx.strokeStyle = 'rgba(120,92,44,0.55)';
    ctx.lineWidth = Math.max(1, R * 0.003);
    ctx.stroke(path);

    /* NUCLEO: successo critico, area ∝ critSuccessPct */
    if (pour > 0 && z.nucleusRadius > 0) {
      const nr = z.nucleusRadius * R * pour;
      const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, nr * 1.25);
      ng.addColorStop(0, rgba(palette.nucleus, 0.95));
      ng.addColorStop(0.7, rgba(palette.nucleus, 0.55));
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(cx, cy, nr * 1.25, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(palette.gold, 0.7);
      ctx.lineWidth = Math.max(1, R * 0.0025);
      ctx.beginPath();
      ctx.arc(cx, cy, nr, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── colonne: NERE (valori richiesti) sul bordo nemico, BIANCHE (stat) sulle punte ── */
  interface Pillar { drop: number; flash: number; }
  const blackPillars: Pillar[] = Array.from({ length: AXES }, () => ({ drop: 0, flash: 0 }));
  const whitePillars: Pillar[] = Array.from({ length: AXES }, () => ({ drop: 0, flash: 0 }));

  function drawPillarSet(
    s: GeometrySnapshot,
    set: Pillar[],
    kind: 'black' | 'white',
    now: number,
  ) {
    ctx.save();
    for (let i = 0; i < AXES; i += 1) {
      const pl = set[i];
      if (pl.drop <= 0) continue;
      const a = tipAngle(i);
      const baseR = kind === 'black' ? rChallengeAt(s, a) : rStarAt(s, a) * sceneStarScale;
      if (baseR <= 0.03) continue;
      const bx = cx + Math.cos(a) * baseR * R;
      const by = cy + Math.sin(a) * baseR * R;
      const h = R * (kind === 'black' ? 0.24 : 0.18) * pl.drop;
      const w = R * (kind === 'black' ? 0.05 : 0.038);
      const tipX = bx - Math.cos(a) * h * 0.32;
      const tipY = by - Math.sin(a) * h * 0.32 - h;

      /* ombra + anello base bronzo */
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(bx, by + w * 0.26, w * 1.7, w * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(palette.gold, 0.7);
      ctx.lineWidth = Math.max(1.1, R * 0.0035);
      ctx.beginPath();
      ctx.ellipse(bx, by + w * 0.08, w * 1.4, w * 0.45, 0, 0, TAU);
      ctx.stroke();

      /* due facce */
      const leftX = bx - w;
      const midX = bx + w * 0.15;
      const rightX = bx + w * 0.9;
      const faceL = new Path2D();
      faceL.moveTo(leftX, by);
      faceL.lineTo(tipX, tipY);
      faceL.lineTo(midX, by - h * 0.12);
      faceL.lineTo(midX, by);
      faceL.closePath();
      const faceR = new Path2D();
      faceR.moveTo(midX, by);
      faceR.lineTo(midX, by - h * 0.12);
      faceR.lineTo(tipX, tipY);
      faceR.lineTo(rightX, by);
      faceR.closePath();
      if (kind === 'black') {
        ctx.fillStyle = 'rgba(4,7,13,0.98)';
        ctx.fill(faceL);
        const gm = ctx.createLinearGradient(midX, tipY, rightX, by);
        gm.addColorStop(0, 'rgba(30,40,58,0.98)');
        gm.addColorStop(1, 'rgba(10,14,24,0.98)');
        ctx.fillStyle = gm;
        ctx.fill(faceR);
      } else {
        ctx.fillStyle = 'rgba(214,202,176,0.97)';
        ctx.fill(faceL);
        const gm = ctx.createLinearGradient(midX, tipY, rightX, by);
        gm.addColorStop(0, 'rgba(255,250,238,0.97)');
        gm.addColorStop(1, 'rgba(230,216,186,0.97)');
        ctx.fillStyle = gm;
        ctx.fill(faceR);
      }
      /* rim: oro a sinistra; azzurro (nere) / bronzo scuro (bianche) a destra */
      ctx.strokeStyle = rgba(palette.gold, 0.85 + pl.flash * 0.15);
      ctx.lineWidth = Math.max(1.1, R * 0.003);
      ctx.beginPath();
      ctx.moveTo(leftX, by);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      const shimmer = 0.45 + 0.3 * Math.sin(now / 700 + i * 1.3);
      ctx.strokeStyle =
        kind === 'black' ? rgba(palette.azure, shimmer + pl.flash * 0.4) : 'rgba(138,101,42,0.8)';
      ctx.beginPath();
      ctx.moveTo(rightX, by);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      if (pl.flash > 0.01) {
        ctx.fillStyle = rgba(palette.warmGold, pl.flash * 0.45);
        ctx.beginPath();
        ctx.arc(bx, by, w * 2 * pl.flash, 0, TAU);
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

  function drawResolutionFx(now: number) {
    if (phase !== 'magnetic-snap' && phase !== 'resolution') return;
    if (!trajectory) return;
    const lp = toPx(trajectory.landing);
    const colorKey = ZONE_COLOR[resultZone];
    const color = colorKey === 'obsidian' ? '#9aa0ad' : palette[colorKey];

    const pulse = flashT > 0 ? flashT : 0.4 + 0.15 * Math.sin(now / 300);
    const g = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, R * 0.16);
    g.addColorStop(0, rgba(color, 0.5 * pulse));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, R * 0.16, 0, TAU);
    ctx.fill();
    flashT = Math.max(0, flashT - 0.02);

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
  let enemyReveal = 0;
  let pourP = 0;

  const dropPillars = (set: Pillar[], p: number): boolean => {
    let allLanded = true;
    set.forEach((pl, i) => {
      const local = clamp((p - i * 0.1) / 0.4, 0, 1);
      const prev = pl.drop;
      pl.drop = local * local * local;
      if (prev < 1 && pl.drop >= 1) {
        pl.flash = 1;
        opts.onSound?.('slam');
      }
      if (pl.drop < 1) allLanded = false;
    });
    return allLanded;
  };

  function tickTimeline(now: number) {
    if (paused) return;
    switch (phase) {
      case 'ring-lock': {
        const p = phaseP(cfg.tRingLock);
        ringReveal = easeOutCubic(p);
        if (p >= 1) setPhase('threat-pillars');
        break;
      }
      case 'threat-pillars': {
        const p = phaseP(cfg.tThreatSlam * 0.8);
        dropPillars(blackPillars, p);
        if (p >= 1) advance('required', () => setPhase('threat-surface'));
        break;
      }
      case 'threat-surface': {
        const p = phaseP(cfg.tThreatSlam * 0.8);
        enemyReveal = clamp(easeOutBack(p), 0, 1.05);
        if (p >= 1) {
          enemyReveal = 1;
          opts.onSound?.('burst');
          advance('enemy', () => setPhase('agency-pillars'));
        }
        break;
      }
      case 'agency-pillars': {
        const p = phaseP(cfg.tAgencyBurst * 0.7);
        /* le colonne bianche nascono con la stella già alla scala minima */
        sceneStarScale = Math.max(sceneStarScale, 0.25);
        dropPillars(whitePillars, p);
        if (p >= 1) advance('stats', () => setPhase('agency-star'));
        break;
      }
      case 'agency-star': {
        const p = phaseP(cfg.tAgencyBurst);
        sceneStarScale = clamp(0.25 + 0.75 * easeOutBack(p), 0, 1.08);
        if (p >= 1) {
          sceneStarScale = 1;
          advance('star', () => setPhase('risk-pour'));
        }
        break;
      }
      case 'risk-pour': {
        pourP = easeOutCubic(phaseP(cfg.tRiskPour));
        if (phaseP(cfg.tRiskPour) >= 1) {
          pourP = 1;
          advance('legend', () => {
            setArmed(true);
            setPhase('action-trigger');
          });
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
    if (enemyReveal > 0) drawEnemy(s, enemyReveal);
    if (pourP > 0) drawZones(s, zones, pourP);
    if (sceneStarScale > 0)
      drawStar(s, zones, sceneStarScale, pourP, phase === 'resolution' && outcome?.success ? 1 : 0);
    drawPillarSet(s, blackPillars, 'black', now);
    if (sceneStarScale > 0.2) drawPillarSet(s, whitePillars, 'white', now);
    drawGhost();
    drawResolutionFx(now);
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
    zones = rebuildZones(snap);
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
    enemyReveal = 0;
    ringReveal = 0;
    shockT = -1;
    paused = false;
    pendingNext = null;
    opts.onExplain?.(null);
    blackPillars.forEach((pl) => { pl.drop = 0; pl.flash = 0; });
    whitePillars.forEach((pl) => { pl.drop = 0; pl.flash = 0; });
    setArmed(false);
    if (opts.reducedMotion) {
      ringReveal = 1;
      enemyReveal = 1;
      sceneStarScale = 1;
      pourP = 1;
      blackPillars.forEach((pl) => { pl.drop = 1; });
      whitePillars.forEach((pl) => { pl.drop = 1; });
      setArmed(true);
      setPhase('action-trigger');
    } else {
      setPhase('ring-lock');
    }
  }

  function doThrow() {
    if (phase === 'the-spin' || phase === 'magnetic-snap') return;
    paused = false;
    pendingNext = null;
    opts.onExplain?.(null);
    ringReveal = 1;
    enemyReveal = 1;
    sceneStarScale = 1;
    pourP = 1;
    blackPillars.forEach((pl) => { pl.drop = 1; });
    whitePillars.forEach((pl) => { pl.drop = 1; });
    setArmed(false);
    seedCounter = (seedCounter + 0x1000193) >>> 0;
    const sim = simulateThrowV4(snap, seedCounter, cfg);
    outcome = sim.outcome;
    trajectory = sim.trajectory;
    resultZone = sim.zone;
    zones = sim.zones;
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
    resume,
    setExplainMode(on: boolean) {
      explainMode = on;
      if (!on) resume();
    },
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
