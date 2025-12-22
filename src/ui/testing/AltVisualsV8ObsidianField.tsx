import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { deriveAxisValues, randomizeAxisValues } from './altVisualsAxis';
import type { StatRow } from './types';

const AXES = 5;
const MAX_STAT = 100;
const TICKS = 10;
const RADIUS = 220;
const MIN_BASE_VALUE = 3;
const PILLAR_DELAY = 15; // Faster sequence for cinematic feel

const VISUAL_CONFIG = {
  enableSparks: false,
  morphSpeed: 0.05,
  glowStrengthPentagon: 32,
  glowStrengthStar: 40,
  particleSize: 8,
  particleCount: 24,
  particleLifetime: 700,
  screenShakeIntensity: 5,
  colors: {
    // --- NUOVA PALETTE MONOLITI ---
    // JET (Nemico - Nero/Ossidiana)
    jetBase: '#1f1f2b',       // Colore corpo principale
    jetHighlight: '#6c6c88',  // Faccia superiore (luce)
    jetShadow: '#0b0b10',     // Faccia laterale (ombra)
    // AVORIO (Eroe - Bianco Crema)
    ivoryBase: '#fdfbe7',     // Colore corpo principale
    ivoryHighlight: '#ffffff',// Faccia superiore (luce pura)
    ivoryShadow: '#e8e4c9',   // Faccia laterale (ombra crema)

    // Altri colori esistenti
    pentagonFill: '#050505',
    pentagonGlow: 'rgba(20,20,30,0.85)',
    starFill: '#fdd97b',
    starGlow: 'rgba(255,215,126,0.75)',
    starBronzeDark: '#4a2507',
    starBronzeMid: '#b7741f',
    starBronzeLight: '#ffd08a',
    tarCore: '#1c2852',
    tarMid: '#2f3f74',
    tarEdge: '#7db7ff',
    tarHalo: 'rgba(111, 193, 255, 0.65)',
    tarHighlight: '#f9fbff',
    particle: '#ffb347',
    particleSecondary: '#ffe29a',
    enemyText: '#9387ff',
    playerText: '#8cf8d5',
    flash: 'rgba(255,255,255,0.8)',
    enemyImpact: '#4cd9ff',
    enemyImpactGlow: 'rgba(76,217,255,0.65)',
    playerImpact: '#ffd866',
    playerImpactGlow: 'rgba(255,216,102,0.7)',
  },
} as const;

type MaterialMode = 'gradient' | 'image';

interface MaterialSpec {
  mode: MaterialMode;
  image?: HTMLImageElement;
}

let ivoryVeinSourceCanvas: HTMLCanvasElement | null = null;

function createTarPath(state: InternalState, center: { x: number; y: number }) {
  const path = new Path2D();
  const { tarPuddle, tentacles } = state;

  if (!tarPuddle.morphing || tarPuddle.morphProgress === 0) {
    path.arc(center.x, center.y, tarPuddle.radius, 0, Math.PI * 2);
    return path;
  }

  const segments = 80;
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const circleRadius = tarPuddle.radius;
    let pentagonRadius = tarPuddle.radius;

    for (let j = 0; j < AXES; j += 1) {
      const vertexAngle = -Math.PI / 2 + j * ((2 * Math.PI) / AXES);
      const nextVertexAngle = -Math.PI / 2 + ((j + 1) % AXES) * ((2 * Math.PI) / AXES);
      let normalizedAngle = angle;
      let normalizedNextVertex = nextVertexAngle;
      if (j === AXES - 1) {
        normalizedNextVertex = nextVertexAngle + Math.PI * 2;
        if (angle < 0) normalizedAngle = angle + Math.PI * 2;
      }
      const angleInSegment =
        (j < AXES - 1 && angle >= vertexAngle && angle <= nextVertexAngle) ||
        (j === AXES - 1 && normalizedAngle >= vertexAngle && normalizedAngle <= normalizedNextVertex);
      if (angleInSegment) {
        const vertex1Dist = tentacles[j]?.length ?? circleRadius;
        const vertex2Dist = tentacles[(j + 1) % AXES]?.length ?? circleRadius;
        const t = (normalizedAngle - vertexAngle) / (normalizedNextVertex - vertexAngle || 1);
        pentagonRadius = vertex1Dist + (vertex2Dist - vertex1Dist) * t;
        break;
      }
    }

    const radius = circleRadius + (pentagonRadius - circleRadius) * tarPuddle.morphProgress;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

function drawObsidianSpeculars(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, time: number) {
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i += 1) {
    const phase = time * 0.15 + i * 0.8;
    const angle = phase * Math.PI * 0.5;
    const ellipseRadius = radius * (0.75 + 0.08 * Math.sin(phase));
    const x = center.x + Math.cos(angle) * radius * 0.3;
    const y = center.y + Math.sin(angle) * radius * 0.25;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(-ellipseRadius, 0, ellipseRadius, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(-ellipseRadius, -radius * 0.05, ellipseRadius * 2, radius * 0.1);
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawObsidianBubbles(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, time: number) {
  for (let i = 0; i < 3; i += 1) {
    const local = (time * 0.08 + i * 0.3) % 1;
    const grow = local < 0.7 ? local / 0.7 : 1 - (local - 0.7) / 0.3;
    const bubbleRadius = radius * 0.05 * grow;
    const bubbleAngle = i * (Math.PI * 2) / 3 + time * 0.2;
    const bubbleDistance = radius * 0.35;
    const x = center.x + Math.cos(bubbleAngle) * bubbleDistance;
    const y = center.y + Math.sin(bubbleAngle) * bubbleDistance;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, bubbleRadius), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.15 * grow})`;
    ctx.fill();
  }
}

function drawTarRipple(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, time: number) {
  const ripplePhase = (time * 0.35) % 1;
  const rippleRadius = radius + ripplePhase * radius * 0.65;
  const opacity = 0.6 * (1 - ripplePhase);
  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, rippleRadius, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(4, radius * 0.08);
  const ringGrad = ctx.createRadialGradient(center.x, center.y, rippleRadius * 0.8, center.x, center.y, rippleRadius);
  ringGrad.addColorStop(0, `${VISUAL_CONFIG.colors.tarEdge}00`);
  ringGrad.addColorStop(1, `${VISUAL_CONFIG.colors.tarEdge}`);
  ctx.strokeStyle = ringGrad;
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'screen';
  ctx.stroke();
  ctx.restore();
}

function getTarFill(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number) {
  const grad = ctx.createRadialGradient(center.x, center.y, radius * 0.1, center.x, center.y, radius);
  grad.addColorStop(0, `${VISUAL_CONFIG.colors.tarHighlight}33`);
  grad.addColorStop(0.2, `${VISUAL_CONFIG.colors.tarHighlight}22`);
  grad.addColorStop(0.45, VISUAL_CONFIG.colors.tarMid);
  grad.addColorStop(0.8, VISUAL_CONFIG.colors.tarCore);
  grad.addColorStop(1, 'rgba(3,4,10,0.9)');
  return grad;
}

function applyBronzeTint(ctx: CanvasRenderingContext2D, starPath: Path2D, center: { x: number; y: number }, radius: number) {
  const bronze = ctx.createLinearGradient(center.x - radius, center.y - radius, center.x + radius, center.y + radius);
  bronze.addColorStop(0, VISUAL_CONFIG.colors.starBronzeDark);
  bronze.addColorStop(0.45, VISUAL_CONFIG.colors.starBronzeMid);
  bronze.addColorStop(1, VISUAL_CONFIG.colors.starBronzeLight);
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = bronze;
  ctx.fill(starPath);
  ctx.globalCompositeOperation = 'source-over';
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}


function createStarPath(state: InternalState, center: { x: number; y: number }) {
  const path = new Path2D();
  const baseRadius = state.goldStar.radius;
  const effectiveMorph = state.goldStar.morphing ? Math.max(0, Math.min(1, state.goldStar.morphProgress)) : 1;

  for (let i = 0; i < AXES * 2; i += 1) {
    const angle = -Math.PI / 2 + i * (Math.PI / AXES);
    const isOuter = i % 2 === 0;
    let targetRadius: number;

    if (isOuter) {
      const pillarIndex = Math.floor(i / 2);
      targetRadius = state.playerPillars[pillarIndex]?.finalRadius ?? baseRadius;
    } else {
      const pillarIndex = Math.floor(i / 2);
      const nextIndex = (pillarIndex + 1) % AXES;
      const avg =
        ((state.playerPillars[pillarIndex]?.finalRadius ?? baseRadius) +
          (state.playerPillars[nextIndex]?.finalRadius ?? baseRadius)) /
        2;
      targetRadius = avg * 0.4;
    }

    const finalRadius = baseRadius + (targetRadius - baseRadius) * effectiveMorph;
    const x = center.x + Math.cos(angle) * finalRadius;
    const y = center.y + Math.sin(angle) * finalRadius;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

function getSigilFill(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  spec: MaterialSpec,
) {
  if (spec.mode === 'image' && spec.image && spec.image.complete && spec.image.naturalWidth > 0) {
    try {
      const pattern = ctx.createPattern(spec.image, 'repeat');
      if (pattern) return pattern;
    } catch {
      // ignore and fall through to gradient
    }
  }
  const grad = ctx.createLinearGradient(center.x - radius, center.y - radius, center.x + radius, center.y + radius);
  grad.addColorStop(0, '#3c220b');
  grad.addColorStop(0.25, '#7b4b14');
  grad.addColorStop(0.45, '#c28a32');
  grad.addColorStop(0.65, '#f3cd6c');
  grad.addColorStop(0.9, '#fff4cc');
  grad.addColorStop(1, '#754719');
  return grad;
}

function applySigilTexture(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  bronzeGlow: string,
) {
  const hammered = ctx.createLinearGradient(center.x - radius, center.y, center.x + radius, center.y);
  hammered.addColorStop(0, 'rgba(255,255,255,0.18)');
  hammered.addColorStop(0.2, 'rgba(255,200,120,0.12)');
  hammered.addColorStop(0.5, 'rgba(40,20,0,0.15)');
  hammered.addColorStop(0.8, 'rgba(255,255,255,0.1)');
  hammered.addColorStop(1, 'rgba(255,205,140,0.2)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = hammered;
  ctx.fillRect(center.x - radius, center.y - radius, radius * 2, radius * 2);

  ctx.globalCompositeOperation = 'lighten';
  const rimGrad = ctx.createRadialGradient(center.x, center.y, radius * 0.5, center.x, center.y, radius);
  rimGrad.addColorStop(0.7, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(1, `${bronzeGlow}55`);
  ctx.fillStyle = rimGrad;
  ctx.fillRect(center.x - radius, center.y - radius, radius * 2, radius * 2);

  ctx.globalCompositeOperation = 'source-over';
}

function getIvoryVeinSourceCanvas() {
  if (typeof document === 'undefined') return null;
  if (ivoryVeinSourceCanvas) return ivoryVeinSourceCanvas;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const veinCtx = canvas.getContext('2d');
  if (!veinCtx) return null;
  veinCtx.fillStyle = '#f0ead2';
  veinCtx.fillRect(0, 0, 64, 64);
  veinCtx.strokeStyle = 'rgba(180,160,120,0.75)';
  veinCtx.lineWidth = 1.5;
  for (let i = 0; i < 6; i += 1) {
    veinCtx.beginPath();
    const startX = Math.random() * 64;
    veinCtx.moveTo(startX, 0);
    veinCtx.bezierCurveTo(
      Math.random() * 64,
      16,
      Math.random() * 64,
      48,
      Math.random() * 64,
      64,
    );
    veinCtx.stroke();
  }
  ivoryVeinSourceCanvas = canvas;
  return ivoryVeinSourceCanvas;
}

function applyIvoryVeins(
  ctx: CanvasRenderingContext2D,
  maskPath: Path2D,
  px: number,
  visualY: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.clip(maskPath);
  const sourceCanvas = getIvoryVeinSourceCanvas();
  if (sourceCanvas) {
    const pattern = ctx.createPattern(sourceCanvas, 'repeat');
    if (pattern) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = pattern;
      ctx.fillRect(px - w, visualY - h - 40, w * 2, h * 2);
      ctx.globalAlpha = 1;
    }
  }
  const sheenGrad = ctx.createLinearGradient(px - w / 2, visualY - h, px + w / 2, visualY);
  sheenGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
  sheenGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(1, 'rgba(255,255,255,0.25)');
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(px - w, visualY - h - 20, w * 2, h * 2);
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

function applyOnyxSheen(
  ctx: CanvasRenderingContext2D,
  maskPath: Path2D,
  px: number,
  visualY: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.clip(maskPath);
  const streakGrad = ctx.createLinearGradient(px - w, visualY - h, px + w, visualY);
  streakGrad.addColorStop(0, 'rgba(255,255,255,0.05)');
  streakGrad.addColorStop(0.4, 'rgba(120,140,200,0.08)');
  streakGrad.addColorStop(0.6, 'rgba(10,12,20,0.2)');
  streakGrad.addColorStop(1, 'rgba(255,255,255,0.04)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = streakGrad;
  ctx.fillRect(px - w, visualY - h - 20, w * 2, h * 2);
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

interface HeroicMaterials {
  obsidian: MaterialSpec;
  sigil: MaterialSpec;
  bronzeGlow: string;
}

function extractCssUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/url\((['"]?)(.*?)\1\)/i);
  return match ? match[2] : trimmed;
}

function loadMaterialImage(url?: string | null): HTMLImageElement | undefined {
  if (!url) return undefined;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  return img;
}

function resolveHeroicMaterials(): HeroicMaterials {
  if (typeof window === 'undefined') {
    return {
      obsidian: { mode: 'gradient' },
      sigil: { mode: 'gradient' },
      bronzeGlow: VISUAL_CONFIG.colors.starGlow,
    };
  }
  const root = getComputedStyle(document.documentElement);
  const obsidianMode = (root.getPropertyValue('--heroic-obsidian-source').trim() || 'gradient') as MaterialMode;
  const sigilMode = (root.getPropertyValue('--heroic-sigil-source').trim() || 'gradient') as MaterialMode;
  const obsidianImage =
    obsidianMode === 'image' ? loadMaterialImage(extractCssUrl(root.getPropertyValue('--heroic-obsidian-image'))) : undefined;
  const sigilImage =
    sigilMode === 'image' ? loadMaterialImage(extractCssUrl(root.getPropertyValue('--heroic-sigil-image'))) : undefined;
  const bronzeGlow = root.getPropertyValue('--bronze-glow').trim() || VISUAL_CONFIG.colors.starGlow;
  return {
    obsidian: { mode: obsidianMode, image: obsidianImage },
    sigil: { mode: sigilMode, image: sigilImage },
    bronzeGlow,
  };
}

// --- INTERFACCE (Invariate) ---
interface MorphShapeState {
  active: boolean;
  radius: number;
  maxRadius: number;
  growing: boolean;
  morphing: boolean;
  morphProgress: number;
}

interface BallState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  initialSpeed: number;
  speed: number;
  startTime: number;
  duration: number;
  stopped: boolean;
  success: boolean | null;
}

interface PillarState {
  angle: number;
  finalRadius: number;
  currentHeight: number;
  velocity: number;
  landed: boolean;
}

interface TentacleState {
  angle: number;
  length: number;
  targetLength: number;
  growing: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  color: string;
}

interface ScreenShake {
  active: boolean;
  trauma: number;
  offsetX: number;
  offsetY: number;
}

interface InternalState {
  usePerfectStar: boolean;
  tarPuddle: MorphShapeState;
  goldStar: MorphShapeState;
  ball: BallState;
  baseEnemyValues: number[];
  basePlayerValues: number[];
  enemyStatValues: number[];
  playerStatValues: number[];
  enemyPillars: PillarState[];
  playerPillars: PillarState[];
  tentacles: TentacleState[];
  particleBursts: Particle[][];
  currentEnemyPillarIndex: number;
  currentPlayerPillarIndex: number;
  enemyPillarAnimationDelay: number;
  playerPillarAnimationDelay: number;
  playerAnimationStarted: boolean;
  screenShake: ScreenShake;
  flashOpacity: number;
  animationFrameId: number | null;
  lastTimestamp: number;
}

const STAT_ICONS = ['💪', '⚡', '🧠', '🛡️', '❤️'];

const FALLBACK_AXIS_VALUES = {
  enemy: [65, 58, 60, 55, 62],
  player: [60, 54, 58, 50, 59],
} as const;

// --- COMPONENTE REACT PRINCIPALE (Invariato) ---
interface AltVisualsV8ObsidianFieldProps {
  stats: StatRow[];
  controlsPortal?: HTMLElement | null;
}

export function AltVisualsV8ObsidianField({ stats, controlsPortal }: AltVisualsV8ObsidianFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const debugPanelRef = useRef<HTMLDivElement | null>(null);
  const autoStartRef = useRef(false);
  const [sceneRunId, setSceneRunId] = useState(0);
  const baseAxisValues = useMemo(() => {
    const derived = deriveAxisValues(stats, FALLBACK_AXIS_VALUES.enemy, FALLBACK_AXIS_VALUES.player, AXES);
    const totalMagnitude =
      derived.enemy.reduce((sum, value) => sum + value, 0) + derived.player.reduce((sum, value) => sum + value, 0);
    if (totalMagnitude <= 0) {
      return {
        enemy: [...FALLBACK_AXIS_VALUES.enemy],
        player: [...FALLBACK_AXIS_VALUES.player],
      };
    }
    return derived;
  }, [stats]);
  const axisValues = useMemo(
    () => randomizeAxisValues(baseAxisValues, { min: 25, max: 95, variance: 35 }),
    [baseAxisValues, sceneRunId],
  );

  useEffect(() => {
    if (sceneRunId === 0) return;
    const canvas = canvasRef.current;
    const checkbox = checkboxRef.current;
    if (!canvas || !checkbox) return;

    const cleanup = initAltVisualsV8(canvas, checkbox, debugPanelRef.current, axisValues);
    return cleanup;
  }, [axisValues, sceneRunId]);

  useEffect(() => {
    if (autoStartRef.current) return;
    const hasValues =
      baseAxisValues.enemy.some((value) => value > 0) || baseAxisValues.player.some((value) => value > 0);
    if (hasValues) {
      autoStartRef.current = true;
      setSceneRunId(1);
    }
  }, [baseAxisValues]);

  const handleStartScene = () => {
    setSceneRunId((prev) => prev + 1);
  };

  const controlsNode = (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={handleStartScene}
          className="px-5 py-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 text-[10px] uppercase tracking-[0.2em] text-emerald-100 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] focus:outline-none focus:ring-2 focus:ring-emerald-400/80 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {sceneRunId === 0 ? 'Avvia scena' : 'Riavvia scena'}
        </button>
        <label className="flex items-center gap-3 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/60 text-[10px] uppercase tracking-[0.2em] text-cyan-200 hover:bg-slate-800 transition-colors cursor-pointer">
          <input ref={checkboxRef} type="checkbox" className="size-4 accent-amber-400 rounded border border-slate-500 cursor-pointer focus:ring-2 focus:ring-amber-400/80 focus:ring-offset-2 focus:ring-offset-slate-900" />
          Stella Perfetta (Test Mode)
        </label>
    </div>
  );

  return (
    <div className="space-y-4" data-testid="alt-visuals-v8">
      {controlsPortal ? createPortal(controlsNode, controlsPortal) : controlsNode}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          className="w-full max-w-[680px] rounded-[28px] border border-white/10 bg-linear-to-br from-[#05060f] via-[#080a16] to-[#040508] shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_60px_rgba(79,232,178,0.15)]"
        />
      </div>

      <header className="text-center space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200">Alt Visuals v8 · Cinematic Monoliths</h3>
        <p className="text-[11px] text-slate-300">
          Monoliti Jet e Avorio, impatto sismico e flash per un feeling AAA.
        </p>
      </header>

      {sceneRunId === 0 && (
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Premi &quot;Avvia scena&quot; per lanciare la simulazione
        </p>
      )}

      <div
        ref={debugPanelRef}
        className="flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-500 opacity-60"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-slate-200">
        {axisValues.enemy.map((enemyValue, index) => (
          <div
            key={`axis-${index}`}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl px-3 py-2 flex items-center justify-between shadow-inner shadow-black/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{STAT_ICONS[index]}</span>
              <span className="uppercase tracking-[0.24em] text-slate-400">Axis {index + 1}</span>
            </div>
            <div className="text-right font-mono">
              <div className="text-cyan-300">Quest {enemyValue.toFixed(0)}%</div>
              <div className="text-emerald-300">Hero {axisValues.player[index].toFixed(0)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AltVisualsV8ObsidianField;

// --- FUNZIONE DI INIZIALIZZAZIONE (Logica invariata, cambiano solo le draw calls) ---
function initAltVisualsV8(
  canvas: HTMLCanvasElement,
  checkbox: HTMLInputElement,
  _debugPanel: HTMLDivElement | null | undefined,
  axisValues: { enemy: number[]; player: number[] },
) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return () => { };

  // Carica texture per elementi
  const ivoryImg = new Image();
  ivoryImg.crossOrigin = 'anonymous';
  ivoryImg.src = 'https://dl.polyhaven.com/textures/rock_marble_01_4k_2023-06-25/rock_marble_01_diff_4k.jpg'; // Ivory marble texture CC0

  const heroicMaterials = resolveHeroicMaterials();

  const internalState: InternalState = {
    usePerfectStar: false,
    tarPuddle: { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 },
    goldStar: { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 },
    ball: {
      active: false,
      x: 320,
      y: 320,
      vx: 0,
      vy: 0,
      radius: 8,
      initialSpeed: 60,
      speed: 60, // Velocità iniziale aumentata per effetto pinball
      startTime: 0,
      duration: 5000,
      stopped: false,
      success: null,
    },
    baseEnemyValues: [...axisValues.enemy],
    basePlayerValues: [...axisValues.player],
    enemyStatValues: [],
    playerStatValues: [],
    enemyPillars: [],
    playerPillars: [],
    tentacles: [],
    particleBursts: [],
    currentEnemyPillarIndex: 0,
    currentPlayerPillarIndex: 0,
    enemyPillarAnimationDelay: 0,
    playerPillarAnimationDelay: 0,
    playerAnimationStarted: false,
    screenShake: { active: false, trauma: 0, offsetX: 0, offsetY: 0 },
    flashOpacity: 0,
    animationFrameId: null,
    lastTimestamp: performance.now(),
  };

  const handleCheckboxChange = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    internalState.usePerfectStar = event.target.checked;
    resetAnimation(internalState);
  };

  checkbox.checked = false;
  checkbox.addEventListener('change', handleCheckboxChange);
  resetAnimation(internalState);

  const drawLoop = () => {
    const now = performance.now();
    const delta = now - internalState.lastTimestamp;
    internalState.lastTimestamp = now;

    // Logic updates
    updateScreenShake(internalState);
    updatePillars(internalState);
    updateTarAnimation(internalState);
    updateBall(internalState);
    updateParticles(internalState, delta);

    if (internalState.flashOpacity > 0) {
      internalState.flashOpacity -= 0.05;
      if (internalState.flashOpacity < 0) internalState.flashOpacity = 0;
    }

    // Drawing
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.fillStyle = '#05060f'; // Manual clear with bg color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Shake
    const centerX = canvas.width / 2 + internalState.screenShake.offsetX;
    const centerY = canvas.height / 2 + internalState.screenShake.offsetY;

    ctx.translate(centerX - 320, centerY - 320); // Center adjustment

    drawGrid(ctx);
    drawTarAnimation(ctx, internalState, heroicMaterials);
    drawGoldStar(ctx, internalState, heroicMaterials);
    // drawPillars ora usa la nuova logica dei monoliti
    drawPillars(ctx, internalState, ivoryImg);
    drawBall(ctx, internalState);
    drawParticles(ctx, internalState);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawStatLabels(ctx, internalState);

    if (internalState.flashOpacity > 0) {
      ctx.fillStyle = `rgba(255,255,255,${internalState.flashOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    internalState.animationFrameId = requestAnimationFrame(drawLoop);
  };

  drawLoop();

  return () => {
    if (internalState.animationFrameId !== null) cancelAnimationFrame(internalState.animationFrameId);
    checkbox.removeEventListener('change', handleCheckboxChange);
  };
}

// --- FUNZIONI DI SUPPORTO LOGICO (Invariate) ---
function resetAnimation(state: InternalState) {
  if (state.usePerfectStar) {
    const perfectValue = 70;
    state.enemyStatValues = Array.from({ length: AXES }, () => perfectValue);
    state.playerStatValues = Array.from({ length: AXES }, () => perfectValue);
  } else {
    state.enemyStatValues = [...state.baseEnemyValues];
    state.playerStatValues = [...state.basePlayerValues];
  }

  state.tarPuddle = { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 };
  state.goldStar = { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 };
  state.enemyPillars = [];
  state.playerPillars = [];
  state.tentacles = [];
  state.particleBursts = [];
  state.currentEnemyPillarIndex = 0;
  state.currentPlayerPillarIndex = 0;
  state.enemyPillarAnimationDelay = 0;
  state.playerPillarAnimationDelay = 0;
  state.playerAnimationStarted = false;
  state.screenShake = { active: false, trauma: 0, offsetX: 0, offsetY: 0 };
  state.flashOpacity = 0;
  state.ball = {
    active: false,
    x: 320,
    y: 320,
    vx: 0,
    vy: 0,
    radius: 8,
    initialSpeed: 60,
    speed: 60,
    startTime: 0,
    duration: 5000,
    stopped: false,
    success: null,
  };
}

function canvasCenter(_state: InternalState) {
  return { x: 320, y: 320 };
}

function triggerShake(state: InternalState, intensity: number) {
  state.screenShake.trauma = Math.min(1, state.screenShake.trauma + intensity);
}

function updateScreenShake(state: InternalState) {
  if (state.screenShake.trauma > 0) {
    state.screenShake.trauma -= 0.05;
    if (state.screenShake.trauma < 0) state.screenShake.trauma = 0;
    const shakeMap = state.screenShake.trauma * state.screenShake.trauma;
    const maxOffset = VISUAL_CONFIG.screenShakeIntensity * shakeMap * 10;
    state.screenShake.offsetX = (Math.random() * 2 - 1) * maxOffset;
    state.screenShake.offsetY = (Math.random() * 2 - 1) * maxOffset;
  } else {
    state.screenShake.offsetX = 0;
    state.screenShake.offsetY = 0;
  }
}

function updatePillars(state: InternalState) {
  // Spawn Enemy Pillars
  state.enemyPillarAnimationDelay += 1;
  const PILLAR_START_HEIGHT = 450; // Altezza di caduta aumentata per più impatto

  if (state.enemyPillarAnimationDelay % PILLAR_DELAY === 0 && state.currentEnemyPillarIndex < AXES) {
    const statValue = state.enemyStatValues[state.currentEnemyPillarIndex];
    const angle = -Math.PI / 2 + state.currentEnemyPillarIndex * ((2 * Math.PI) / AXES);
    const effectiveValue = MIN_BASE_VALUE + statValue;
    const progress = effectiveValue / (MAX_STAT + MIN_BASE_VALUE);
    const finalRadius = RADIUS * progress;

    state.enemyPillars.push({
      angle,
      finalRadius,
      currentHeight: PILLAR_START_HEIGHT,
      velocity: 0,
      landed: false
    });

    state.tentacles.push({ angle, length: 0, targetLength: finalRadius, growing: false });
    state.currentEnemyPillarIndex += 1;
  }

  // Animate Enemy Pillars Falling
  state.enemyPillars.forEach((pillar, i) => {
    if (!pillar.landed) {
      pillar.velocity += 2;
      pillar.currentHeight -= pillar.velocity;

      if (pillar.currentHeight <= 0) {
        pillar.currentHeight = 0;
        pillar.landed = true;
        pillar.velocity = 0;
        if (state.tentacles[i]) state.tentacles[i].growing = true;
        // Impatto Jet (senza shake iniziale)
        spawnParticleBurst(
          state,
          pillar.angle,
          pillar.finalRadius,
          VISUAL_CONFIG.colors.enemyImpact,
          VISUAL_CONFIG.colors.enemyImpactGlow,
          18,
        );
      }
    }
  });

  // Update Tentacles
  state.tentacles.forEach((tentacle) => {
    if (tentacle.growing && tentacle.length < tentacle.targetLength) {
      tentacle.length += 15;
      if (tentacle.length >= tentacle.targetLength) {
        tentacle.length = tentacle.targetLength;
      }
    }
  });

  // Start Player sequence
  if (!state.playerAnimationStarted && state.tarPuddle.morphing && state.tarPuddle.morphProgress >= 1) {
    state.playerAnimationStarted = true;
  }

  // Spawn Player Pillars
  if (state.playerAnimationStarted) {
    state.playerPillarAnimationDelay += 1;
    if (state.playerPillarAnimationDelay % PILLAR_DELAY === 0 && state.currentPlayerPillarIndex < AXES) {
      const statValue = state.playerStatValues[state.currentPlayerPillarIndex];
      const angle = -Math.PI / 2 + state.currentPlayerPillarIndex * ((2 * Math.PI) / AXES);
      const effectiveValue = MIN_BASE_VALUE + statValue;
      const progress = effectiveValue / (MAX_STAT + MIN_BASE_VALUE);
      const finalRadius = RADIUS * progress;

      state.playerPillars.push({
        angle,
        finalRadius,
        currentHeight: PILLAR_START_HEIGHT,
        velocity: 0,
        landed: false
      });
      state.currentPlayerPillarIndex += 1;
    }

    // Animate Player Pillars Falling
    state.playerPillars.forEach((pillar) => {
      if (!pillar.landed) {
        pillar.velocity += 2.5;
        pillar.currentHeight -= pillar.velocity;

        if (pillar.currentHeight <= 0) {
          pillar.currentHeight = 0;
          pillar.landed = true;
          pillar.velocity = 0;
          spawnParticleBurst(
            state,
            pillar.angle,
            pillar.finalRadius,
            VISUAL_CONFIG.colors.playerImpact,
            VISUAL_CONFIG.colors.playerImpactGlow,
            24,
          );
        }
      }
    });
  }
}

function updateTarAnimation(state: InternalState) {
  if (!state.tarPuddle.active && state.enemyPillarAnimationDelay > 30) {
    state.tarPuddle.active = true;
  }

  if (state.tarPuddle.active && state.tarPuddle.growing && state.tarPuddle.radius < state.tarPuddle.maxRadius) {
    state.tarPuddle.radius += 2;
    if (state.tarPuddle.radius >= state.tarPuddle.maxRadius) {
      state.tarPuddle.growing = false;
    }
  }

  if (!state.tarPuddle.growing && state.tentacles.length === AXES && state.enemyPillars.every(p => p.landed) && state.tentacles.every(t => t.length >= t.targetLength)) {
    state.tarPuddle.morphing = true;
  }

  if (state.tarPuddle.morphing && state.tarPuddle.morphProgress < 1) {
    state.tarPuddle.morphProgress += VISUAL_CONFIG.morphSpeed;
    if (state.tarPuddle.morphProgress > 1) {
      state.tarPuddle.morphProgress = 1;
    }
  }

  if (state.playerAnimationStarted && !state.goldStar.active) {
    state.goldStar.active = true;
  }

  if (state.goldStar.active && state.goldStar.growing && state.goldStar.radius < state.goldStar.maxRadius) {
    state.goldStar.radius += 2;
    if (state.goldStar.radius >= state.goldStar.maxRadius) {
      state.goldStar.growing = false;
    }
  }

  if (state.goldStar.active && !state.goldStar.growing && state.playerPillars.length === AXES && state.playerPillars.every((p) => p.landed)) {
    state.goldStar.morphing = true;
  }

  if (state.goldStar.morphing && state.goldStar.morphProgress < 1) {
    state.goldStar.morphProgress += VISUAL_CONFIG.morphSpeed;
    if (state.goldStar.morphProgress > 1) {
      state.goldStar.morphProgress = 1;
      state.flashOpacity = 1;
    }
  }

  if (state.goldStar.morphing && state.goldStar.morphProgress >= 1 && !state.ball.active && !state.ball.stopped) {
    state.ball.active = true;
    state.ball.startTime = Date.now();
    const randomAngle = Math.random() * Math.PI * 2;
    state.ball.vx = Math.cos(randomAngle) * state.ball.speed;
    state.ball.vy = Math.sin(randomAngle) * state.ball.speed;
  }
}

function updateBall(state: InternalState) {
  if (!state.ball.active || state.ball.stopped) return;

  const elapsed = Date.now() - state.ball.startTime;
  const progress = Math.min(elapsed / state.ball.duration, 1);
  const dynamicFriction = 0.996 - progress * 0.04; // Più attrito verso la fine
  const bounceDecay = 0.99 - progress * 0.02;

  if (elapsed > state.ball.duration) {
    state.ball.stopped = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    const starVertices = getStarVertices(state);
    state.ball.success = isPointInPolygon(state.ball.x, state.ball.y, starVertices);
    triggerShake(state, 0.6);
    return;
  }

  const nextX = state.ball.x + state.ball.vx;
  const nextY = state.ball.y + state.ball.vy;
  const pentagonVertices = getPentagonVertices(state);
  const inside = isPointInPolygon(nextX, nextY, pentagonVertices);

  if (!inside) {
    let minDist = Infinity;
    let bestNormal = { x: 0, y: 0 };
    pentagonVertices.forEach((vertex, index) => {
      const nextVertex = pentagonVertices[(index + 1) % pentagonVertices.length];
      const dx = nextVertex.x - vertex.x;
      const dy = nextVertex.y - vertex.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const d = Math.abs((state.ball.x - vertex.x) * nx + (state.ball.y - vertex.y) * ny);
      if (d < minDist) {
        minDist = d;
        bestNormal = { x: nx, y: ny };
      }
    });

    const dotProduct = state.ball.vx * bestNormal.x + state.ball.vy * bestNormal.y;
    state.ball.vx -= 2 * dotProduct * bestNormal.x;
    state.ball.vy -= 2 * dotProduct * bestNormal.y;
    state.ball.vx *= bounceDecay;
    state.ball.vy *= bounceDecay;

    spawnParticleBurst(state, 0, 0, VISUAL_CONFIG.colors.particle, '#fff', 20, state.ball.x, state.ball.y); // Più particelle

  } else {
    state.ball.x = nextX;
    state.ball.y = nextY;
  }

  // Rallentamento progressivo per effetto pinball
  state.ball.vx *= dynamicFriction;
  state.ball.vy *= dynamicFriction;

  const currentSpeed = Math.hypot(state.ball.vx, state.ball.vy);
  const targetSpeed = Math.max(4, state.ball.initialSpeed * (1 - progress * 0.85));
  if (currentSpeed > targetSpeed) {
    const scale = targetSpeed / currentSpeed;
    state.ball.vx *= scale;
    state.ball.vy *= scale;
  }
  state.ball.speed = Math.hypot(state.ball.vx, state.ball.vy);
}

// --- FUNZIONI DI DISEGNO (Modificate per il restyle grafico) ---

function drawGrid(ctx: CanvasRenderingContext2D) {
  const center = canvasCenter({} as InternalState);
  for (let i = 0; i < AXES; i += 1) {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / AXES);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + dx * RADIUS, center.y + dy * RADIUS);
    ctx.stroke();

    for (let t = 1; t <= TICKS; t += 1) {
      const r = (RADIUS / TICKS) * t;
      const tx = center.x + dx * r;
      const ty = center.y + dy * r;
      const nx = -dy;
      const ny = dx;

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx - nx * 6, ty - ny * 6);
      ctx.lineTo(tx + nx * 6, ty + ny * 6);
      ctx.stroke();
    }

    ctx.font = `600 24px 'Space Grotesk', system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(STAT_ICONS[i], center.x + dx * (RADIUS + 36), center.y + dy * (RADIUS + 36));
  }
}

function drawBall(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.ball.active && !state.ball.stopped) return;

  ctx.save();
  // Gradiente radiale per effetto texture lucida
  const ballGrad = ctx.createRadialGradient(state.ball.x, state.ball.y, 0, state.ball.x, state.ball.y, state.ball.radius);
  ballGrad.addColorStop(0, '#ffffff'); // Centro bianco per highlight
  ballGrad.addColorStop(0.7, VISUAL_CONFIG.colors.particleSecondary);
  ballGrad.addColorStop(1, VISUAL_CONFIG.colors.particle); // Bordo più scuro
  ctx.fillStyle = ballGrad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (state.ball.stopped) {
    // Usa il colore Avorio per il testo di successo per coerenza
    ctx.fillStyle = state.ball.success ? VISUAL_CONFIG.colors.ivoryHighlight : VISUAL_CONFIG.colors.particle;
    ctx.font = 'bold 26px "Space Grotesk", system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 22;
    ctx.fillText(state.ball.success ? 'SUCCESSO! ' : 'FALLITO ', canvasCenter(state).x, canvasCenter(state).y - 100);
  }
}

// --- NUOVA FUNZIONE DISEGNO MONOLITI ---
function drawPillars(ctx: CanvasRenderingContext2D, state: InternalState, ivoryImg?: HTMLImageElement) {
  const center = canvasCenter(state);

  // Helper per disegnare un singolo monolite 3D con gradienti per texture
  const drawMonolith = (pillar: PillarState, colors: { base: string, highlight: string, shadow: string }, isIvory: boolean = false) => {
    const dx = Math.cos(pillar.angle);
    const dy = Math.sin(pillar.angle);
    const px = center.x + dx * pillar.finalRadius;
    const py = center.y + dy * pillar.finalRadius;
    const visualY = py - pillar.currentHeight;
    const w = 24; // Larghezza monolite
    const h = 60; // Altezza monolite

    ctx.save();

    if (pillar.currentHeight > 0) {
         // Scia di caduta con gradiente
         ctx.beginPath();
         ctx.moveTo(px - w / 2, visualY - h + 10);
         ctx.lineTo(px, visualY - h - 40);
         ctx.lineTo(px + w / 2, visualY - h + 10);
         const trailGrad = ctx.createLinearGradient(px, visualY - h, px, visualY - h - 50);
         trailGrad.addColorStop(0, colors.base);
         trailGrad.addColorStop(1, 'transparent');
         ctx.fillStyle = trailGrad;
         ctx.globalAlpha = 0.5;
         ctx.fill();
         ctx.globalAlpha = 1.0;
    }

    // 1. Faccia Laterale (Ombra - gradiente verticale)
    const lateralGrad = ctx.createLinearGradient(px - w/2, visualY - h, px - w/2, visualY);
    lateralGrad.addColorStop(0, colors.shadow);
    lateralGrad.addColorStop(1, colors.base);
    ctx.fillStyle = lateralGrad;
    ctx.beginPath();
    ctx.moveTo(px, visualY + 10);
    ctx.lineTo(px - w / 2, visualY);
    ctx.lineTo(px - w / 2, visualY - h);
    ctx.lineTo(px, visualY - h + 10);
    ctx.fill();

    // 2. Faccia Frontale (Colore Base - texture o gradiente)
    let frontFill: CanvasGradient | CanvasPattern | string;
    if (isIvory && ivoryImg && ivoryImg.complete && ivoryImg.naturalWidth > 0) {
      try {
        const pattern = ctx.createPattern(ivoryImg, 'repeat');
        if (pattern) {
          frontFill = pattern;
        } else {
          const frontalGradFallback = ctx.createLinearGradient(px - w / 2, visualY - h, px + w / 2, visualY);
          frontalGradFallback.addColorStop(0, colors.highlight);
          frontalGradFallback.addColorStop(0.5, colors.base);
          frontalGradFallback.addColorStop(1, colors.shadow);
          frontFill = frontalGradFallback;
        }
      } catch {
        const frontalGradFallback = ctx.createLinearGradient(px - w / 2, visualY - h, px + w / 2, visualY);
        frontalGradFallback.addColorStop(0, colors.highlight);
        frontalGradFallback.addColorStop(0.5, colors.base);
        frontalGradFallback.addColorStop(1, colors.shadow);
        frontFill = frontalGradFallback;
      }
    } else {
      const frontalGrad = ctx.createLinearGradient(px - w / 2, visualY - h, px + w / 2, visualY);
      frontalGrad.addColorStop(0, colors.highlight);
      frontalGrad.addColorStop(0.5, colors.base);
      frontalGrad.addColorStop(1, colors.shadow);
      frontFill = frontalGrad;
    }

    const frontFacePath = new Path2D();
    frontFacePath.moveTo(px, visualY + 10);
    frontFacePath.lineTo(px + w / 2, visualY);
    frontFacePath.lineTo(px + w / 2, visualY - h);
    frontFacePath.lineTo(px, visualY - h + 10);
    frontFacePath.closePath();

    ctx.fillStyle = frontFill ?? colors.base;
    ctx.fill(frontFacePath);

    if (isIvory) {
      applyIvoryVeins(ctx, frontFacePath, px, visualY, w, h);
    } else {
      applyOnyxSheen(ctx, frontFacePath, px, visualY, w, h);
    }

    // 3. Faccia Superiore (Luce - gradiente radiale per texture lucida)
    const topGrad = ctx.createRadialGradient(px, visualY - h - 5, 0, px, visualY - h - 5, w);
    topGrad.addColorStop(0, colors.highlight);
    topGrad.addColorStop(1, colors.base);
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.moveTo(px, visualY - h + 10);
    ctx.lineTo(px - w / 2, visualY - h);
    ctx.lineTo(px, visualY - h - 10);
    ctx.lineTo(px + w / 2, visualY - h);
    ctx.fill();

    // Glow sottile sui bordi
    ctx.shadowBlur = 10;
    ctx.shadowColor = colors.highlight;
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  // Disegna Nemici (Jet)
  state.enemyPillars.forEach((p) =>
    drawMonolith(
      p,
      {
        base: VISUAL_CONFIG.colors.jetBase,
        highlight: VISUAL_CONFIG.colors.jetHighlight,
        shadow: VISUAL_CONFIG.colors.jetShadow,
      },
      false,
    ),
  );

  // Disegna Giocatore (Avorio)
  state.playerPillars.forEach((p) =>
    drawMonolith(
      p,
      {
        base: VISUAL_CONFIG.colors.ivoryBase,
        highlight: VISUAL_CONFIG.colors.ivoryHighlight,
        shadow: VISUAL_CONFIG.colors.ivoryShadow,
      },
      true,
    ),
  );
}


function spawnParticleBurst(state: InternalState, angle: number, targetRadius: number, primary: string, secondary: string, count = 18, overrideX?: number, overrideY?: number) {
  const particles: Particle[] = [];
  const center = canvasCenter(state);
  const originX = overrideX ?? (center.x + Math.cos(angle) * targetRadius);
  const originY = overrideY ?? (center.y + Math.sin(angle) * targetRadius);

  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      radius: Math.random() * (VISUAL_CONFIG.particleSize / 2) + 2,
      life: VISUAL_CONFIG.particleLifetime,
      color: Math.random() > 0.5 ? primary : secondary,
    });
  }
  state.particleBursts.push(particles);
}

function updateParticles(state: InternalState, delta: number) {
  for (let i = state.particleBursts.length - 1; i >= 0; i -= 1) {
    const burst = state.particleBursts[i];
    for (let j = burst.length - 1; j >= 0; j -= 1) {
      const particle = burst[j];
      particle.life -= delta;
      if (particle.life <= 0) {
        burst.splice(j, 1);
        continue;
      }
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1;
      particle.radius *= 0.95;
    }
    if (burst.length === 0) {
      state.particleBursts.splice(i, 1);
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, state: InternalState) {
  state.particleBursts.forEach((burst) => {
    burst.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life / VISUAL_CONFIG.particleLifetime);
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  });
}

// --- DISEGNO CATRAME E STELLA (Invariati, usano i colori della config) ---
function drawTarAnimation(ctx: CanvasRenderingContext2D, state: InternalState, materials: HeroicMaterials) {
  if (!state.tarPuddle.active || state.tarPuddle.radius <= 0) return;

  const center = canvasCenter(state);
  const radius = state.tarPuddle.radius;
  const puddlePath = createTarPath(state, center);
  const time = performance.now() * 0.001;

  ctx.save();
  ctx.shadowColor = 'rgba(12,20,60,0.65)';
  ctx.shadowBlur = radius * 0.65;
  ctx.shadowOffsetY = radius * 0.15;
  ctx.fillStyle = getTarFill(ctx, center, radius);
  ctx.fill(puddlePath);
  ctx.restore();

  ctx.save();
  ctx.clip(puddlePath);
  drawObsidianSpeculars(ctx, center, radius, time);
  drawObsidianBubbles(ctx, center, radius, time);
  ctx.restore();

  drawTarRipple(ctx, center, radius, time);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineWidth = Math.max(6, radius * 0.12);
  ctx.strokeStyle = VISUAL_CONFIG.colors.tarHalo;
  ctx.stroke(puddlePath);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `${VISUAL_CONFIG.colors.tarEdge}aa`;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `${VISUAL_CONFIG.colors.tarHighlight}bb`;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGoldStar(ctx: CanvasRenderingContext2D, state: InternalState, materials: HeroicMaterials) {
  if (!state.goldStar.active || state.goldStar.radius <= 0) return;
  if (!state.goldStar.morphing && state.goldStar.morphProgress <= 0) return;

  const center = canvasCenter(state);
  const radius = state.goldStar.radius;
  const starPath = createStarPath(state, center);
  const starScale = easeOutBack(Math.max(0, Math.min(1, state.goldStar.morphProgress)));

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.scale(starScale, starScale);
  ctx.translate(-center.x, -center.y);
  const bronzeGlow = materials.bronzeGlow || VISUAL_CONFIG.colors.starGlow;
  ctx.shadowColor = `${bronzeGlow}55`;
  ctx.shadowBlur = radius * 0.85;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = getSigilFill(ctx, center, radius, materials.sigil);
  ctx.fill(starPath);
  applyBronzeTint(ctx, starPath, center, radius);
  ctx.restore();

  ctx.save();
  ctx.clip(starPath);
  applySigilTexture(ctx, center, radius, bronzeGlow);
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(40,23,10,0.9)';
  ctx.stroke(starPath);
  ctx.globalCompositeOperation = 'screen';
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.stroke(starPath);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const sigilPulse = ctx.createRadialGradient(center.x, center.y, radius * 0.05, center.x, center.y, radius * 0.85);
  sigilPulse.addColorStop(0, 'rgba(255, 255, 220, 0.45)');
  sigilPulse.addColorStop(0.4, 'rgba(255, 230, 160, 0.15)');
  sigilPulse.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sigilPulse;
  ctx.fill(starPath);
  ctx.restore();

  ctx.save();
  const parallaxX = (state.screenShake.offsetX || 0) * 0.2;
  const parallaxY = (state.screenShake.offsetY || 0) * 0.2;
  const emboss = ctx.createLinearGradient(center.x - radius, center.y - radius, center.x + radius + parallaxX, center.y + radius + parallaxY);
  emboss.addColorStop(0, 'rgba(15, 8, 2, 0.65)');
  emboss.addColorStop(0.35, 'rgba(255, 230, 160, 0)');
  emboss.addColorStop(0.65, 'rgba(255, 248, 230, 0.15)');
  emboss.addColorStop(1, 'rgba(30, 12, 5, 0.85)');
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = emboss;
  ctx.fill(starPath);
  ctx.restore();
}

function getStarVertices(state: InternalState) {
  const vertices = [];
  for (let i = 0; i < AXES * 2; i += 1) {
    const angle = -Math.PI / 2 + i * (Math.PI / AXES);
    const isOuter = i % 2 === 0;
    let radius: number;
    if (isOuter) {
      const pillarIndex = Math.floor(i / 2);
      radius = state.playerPillars[pillarIndex]?.finalRadius ?? state.goldStar.radius;
    } else {
      const pillarIndex = Math.floor(i / 2);
      const nextIndex = (pillarIndex + 1) % AXES;
      const avg =
        ((state.playerPillars[pillarIndex]?.finalRadius ?? state.goldStar.radius) +
          (state.playerPillars[nextIndex]?.finalRadius ?? state.goldStar.radius)) /
        2;
      radius = avg * 0.4;
    }
    vertices.push({
      x: canvasCenter(state).x + Math.cos(angle) * radius,
      y: canvasCenter(state).y + Math.sin(angle) * radius,
    });
  }
  return vertices;
}

function getPentagonVertices(state: InternalState) {
  const vertices = [];
  for (let i = 0; i < AXES; i += 1) {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / AXES);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const dist = state.tentacles[i]?.length ?? 0;
    vertices.push({
      x: canvasCenter(state).x + dx * dist,
      y: canvasCenter(state).y + dy * dist,
    });
  }
  return vertices;
}

function isPointInPolygon(x: number, y: number, vertices: { x: number; y: number }[]) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawStatLabels(ctx: CanvasRenderingContext2D, state: InternalState) {
  const center = canvasCenter(state);
  for (let i = 0; i < AXES; i += 1) {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / AXES);
    const labelRadius = RADIUS + 40;
    const x = center.x + Math.cos(angle) * labelRadius;
    const y = center.y + Math.sin(angle) * labelRadius;

    ctx.font = "bold 14px 'Space Grotesk', system-ui";
    ctx.fillStyle = VISUAL_CONFIG.colors.playerText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;

    const playerVal = Math.round(state.playerStatValues[i] ?? 0);
    const enemyVal = Math.round(state.enemyStatValues[i] ?? 0);
    ctx.fillText(`${playerVal} vs ${enemyVal}`, x, y + 20);
  }
}