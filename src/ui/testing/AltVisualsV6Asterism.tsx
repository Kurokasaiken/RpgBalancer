import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { deriveAxisValues, deriveAxisMeta, randomizeAxisValues } from './altVisualsAxis';
import type { AxisMetaEntry } from './altVisualsAxis';
import type { StatRow } from './types';

const AXES = 5;
const MAX_STAT = 100;
const TICKS = 10;
const RADIUS = 220;
const MIN_BASE_VALUE = 3;
const PILLAR_DELAY = 15; // Faster sequence for cinematic feel

const VISUAL_CONFIG = {
  morphSpeed: 0.05,
  glowStrengthPentagon: 32,
  glowStrengthStar: 40,
  particleSize: 8,
  particleCount: 24,
  particleLifetime: 700,
  screenShakeIntensity: 5,
  ballTargetOffsets: {
    successInset: 14,
    failureOutset: 18,
  },
  ballPath: {
    chaosDamping: 0.985,
    chaosImpulse: 1.05,
    residualNoise: 0.18,
    globalDrag: 0.994,
    pinballFriction: 0.985,
  },
  colors: {
    background: '#3a3c42',
    pentagonFill: '#050505',
    pentagonGlow: 'rgba(20,20,30,0.85)',
    starFill: '#fdd97b',
    starGlow: 'rgba(255,215,126,0.75)',
    enemyPillarFill: 'rgba(130,74,255,0.9)',
    enemyPillarStroke: '#a57cff',
    playerPillarFill: 'rgba(73,236,193,0.9)',
    playerPillarStroke: '#4fe8b2',
    particle: '#ff94f8',
    particleSecondary: '#5de9ff',
    enemyText: '#9387ff',
    playerText: '#8cf8d5',
    flash: 'rgba(255,255,255,0.8)',
    obeliskEnemy: {
      base: '#1f1f2b',
      highlight: '#6c6c88',
      shadow: '#0b0b10',
    },
    obeliskPlayer: {
      base: '#fdfbe7',
      highlight: '#ffffff',
      shadow: '#e8e4c9',
    },
    obeliskEdgeGlow: '#ffd08a',
  },
} as const;

const CHAOS_PHASE_DURATION_MS = 1100;
const GUIDANCE_PHASE_DURATION_MS = 2200;
const FINAL_EASE_DURATION_MS = 800;
const BALL_TOTAL_DURATION_MS = CHAOS_PHASE_DURATION_MS + GUIDANCE_PHASE_DURATION_MS + FINAL_EASE_DURATION_MS;

const MOCK_STAT_RANGE = { min: 35, max: 80 } as const;
const SUCCESS_PROB_CLAMP = { min: 5, max: 95 } as const;

interface MorphShapeState {
  active: boolean;
  radius: number;
  maxRadius: number;
  growing: boolean;
  morphing: boolean;
  morphProgress: number;
}

function randomPointOnPolygonEdges(vertices: { x: number; y: number }[]) {
  if (vertices.length === 0) return null;
  const edgeIndex = Math.floor(Math.random() * vertices.length);
  const start = vertices[edgeIndex];
  const end = vertices[(edgeIndex + 1) % vertices.length];
  const t = Math.random();
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function movePointTowardCenter(point: { x: number; y: number }, center: { x: number; y: number }, distance: number) {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  return {
    x: point.x - nx * distance,
    y: point.y - ny * distance,
  };
}

function tracePerfectStar(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number) {
  for (let i = 0; i < AXES * 2; i += 1) {
    const angle = -Math.PI / 2 + i * (Math.PI / AXES);
    const isOuter = i % 2 === 0;
    const currentRadius = isOuter ? radius : radius * 0.4;
    const x = center.x + Math.cos(angle) * currentRadius;
    const y = center.y + Math.sin(angle) * currentRadius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

interface BallState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  startTime: number;
  duration: number;
  stopped: boolean;
  success: boolean | null;
  targetX: number;
  targetY: number;
  targetAssigned: boolean;
  guidanceDelay: number;
  targetArrivalTime: number;
  forcedOutcome: boolean | null;
  guidanceActive: boolean;
  guidanceDuration: number;
  guidanceStartX: number;
  guidanceStartY: number;
  hasSettled: boolean;
}

interface AltVisualsController {
  cleanup: () => void;
  rerollDice: () => void;
}

interface PillarState {
  angle: number;
  finalRadius: number; // Distance from center where it lands
  currentHeight: number; // Vertical offset (starts high, ends 0)
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
  trauma: number; // 0 to 1
  offsetX: number;
  offsetY: number;
}

interface InternalState {
  usePerfectStar: boolean;
  tarPuddle: MorphShapeState;
  goldStar: MorphShapeState;
  ball: BallState;
  axisMeta: AxisMetaEntry[];
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
  successChance: number;
  successRoll: number | null;
}

const FALLBACK_AXIS_META: AxisMetaEntry[] = [
  { name: 'Forza', icon: '💪' },
  { name: 'Velocità', icon: '⚡' },
  { name: 'Intelletto', icon: '🧠' },
  { name: 'Difesa', icon: '🛡️' },
  { name: 'Vita', icon: '❤️' },
] as const;

const FALLBACK_AXIS_VALUES = {
  enemy: [65, 58, 60, 55, 62],
  player: [60, 54, 58, 50, 59],
} as const;

interface AltVisualsV6AsterismProps {
  stats: StatRow[];
  controlsPortal?: HTMLElement | null;
  axisMeta?: AxisMetaEntry[];
  enablePerfectStarToggle?: boolean;
}

export function AltVisualsV6Asterism({
  stats,
  controlsPortal,
  axisMeta,
  enablePerfectStarToggle = true,
}: AltVisualsV6AsterismProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const debugPanelRef = useRef<HTMLDivElement | null>(null);
  const [sceneRunId, setSceneRunId] = useState(0);
  const rerollRef = useRef<(() => void) | null>(null);
  const baseAxisValues = useMemo(
    () => deriveAxisValues(stats, FALLBACK_AXIS_VALUES.enemy, FALLBACK_AXIS_VALUES.player, AXES),
    [stats],
  );
  const axisValues = useMemo(
    () => randomizeAxisValues(baseAxisValues, { min: 25, max: 95, variance: 35 }),
    [baseAxisValues, sceneRunId],
  );
  const resolvedAxisMeta = useMemo(
    () => (axisMeta && axisMeta.length ? axisMeta : deriveAxisMeta(stats, FALLBACK_AXIS_META, AXES)),
    [axisMeta, stats],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const checkbox = checkboxRef.current;
    if (!canvas || !checkbox) return;

    const controller = initAltVisualsV6(
      canvas,
      enablePerfectStarToggle ? checkbox : null,
      debugPanelRef.current,
      axisValues,
      resolvedAxisMeta,
    );
    rerollRef.current = controller.rerollDice;
    return () => {
      rerollRef.current = null;
      controller.cleanup();
    };
  }, [axisValues, resolvedAxisMeta, sceneRunId, enablePerfectStarToggle]);

  const handleRestart = () => {
    setSceneRunId((prev) => prev + 1);
  };

  const handleReroll = () => {
    rerollRef.current?.();
  };

  const controlsNode = (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <button
        type="button"
        onClick={handleRestart}
        className="px-5 py-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 text-[10px] uppercase tracking-[0.2em] text-emerald-100 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] focus:outline-none focus:ring-2 focus:ring-emerald-400/80 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        Riavvia scena
      </button>
      <button
        type="button"
        onClick={handleReroll}
        className="px-5 py-2 rounded-full border border-amber-400/60 bg-amber-500/10 text-[10px] uppercase tracking-[0.2em] text-amber-100 hover:bg-amber-500/20 active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.25)] focus:outline-none focus:ring-2 focus:ring-amber-400/80 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        Ritira dado
      </button>
      {enablePerfectStarToggle && (
        <label className="flex items-center gap-3 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/60 text-[10px] uppercase tracking-[0.2em] text-cyan-200 hover:bg-slate-800 transition-colors cursor-pointer">
          <input ref={checkboxRef} type="checkbox" className="size-4 accent-amber-400 rounded border border-slate-500 cursor-pointer" />
          Stella Perfetta (Test Mode)
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-4" data-testid="alt-visuals-v6">
      {controlsPortal ? createPortal(controlsNode, controlsPortal) : controlsNode}
      <header className="text-center space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200">Alt Visuals v6 · Cinematic Column Drop</h3>
        <p className="text-[11px] text-slate-300">
          Colonne cadenti, impatto sismico e flash per un feeling AAA.
        </p>
      </header>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          className="w-full max-w-[680px] rounded-[28px] border border-white/10 bg-linear-to-br from-[#05060f] via-[#080a16] to-[#040508] shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_60px_rgba(79,232,178,0.15)]"
        />
      </div>

      <div
        ref={debugPanelRef}
        className="flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-500 opacity-60"
      />
    </div>
  );
}

export default AltVisualsV6Asterism;

function initAltVisualsV6(
  canvas: HTMLCanvasElement,
  checkbox: HTMLInputElement | null,
  _debugPanel: HTMLDivElement | null | undefined,
  axisValues: { enemy: number[]; player: number[] },
  axisMeta: AxisMetaEntry[],
): AltVisualsController {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx)
    return {
      cleanup: () => { },
      rerollDice: () => { },
    };

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
      speed: 12,
      startTime: 0,
      duration: 5000,
      stopped: false,
      success: null,
      targetX: 320,
      targetY: 320,
      targetAssigned: false,
      guidanceDelay: 0,
      targetArrivalTime: 0,
      forcedOutcome: null,
      guidanceActive: false,
      guidanceDuration: 0,
      guidanceStartX: 320,
      guidanceStartY: 320,
      hasSettled: false,
    },
    axisMeta,
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
    successChance: 50,
    successRoll: null,
  };

  const handleCheckboxChange = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    internalState.usePerfectStar = event.target.checked;
    resetAnimation(internalState);
  };

  if (checkbox) {
    checkbox.checked = false;
    checkbox.addEventListener('change', handleCheckboxChange);
  } else {
    internalState.usePerfectStar = false;
  }
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
    ctx.fillStyle = VISUAL_CONFIG.colors.background; // Manual clear with bg color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Shake
    const centerX = canvas.width / 2 + internalState.screenShake.offsetX;
    const centerY = canvas.height / 2 + internalState.screenShake.offsetY;

    // Grid relative to shake
    ctx.translate(centerX - 320, centerY - 320); // Center adjustment

    drawGrid(ctx);
    drawTarAnimation(ctx, internalState);
    drawGoldStar(ctx, internalState);
    drawPillars(ctx, internalState);
    drawBall(ctx, internalState);
    drawParticles(ctx, internalState);

    // Reset for UI (static elements)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawStatOverlay(ctx, internalState);

    // Flash overlay
    if (internalState.flashOpacity > 0) {
      ctx.fillStyle = `rgba(255,255,255,${internalState.flashOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    internalState.animationFrameId = requestAnimationFrame(drawLoop);
  };

  drawLoop();

  const rerollDice = () => {
    if (!internalState.goldStar.active || internalState.goldStar.morphProgress < 1) return;
    internalState.ball.active = false;
    internalState.ball.stopped = false;
    internalState.ball.success = null;
    internalState.ball.targetAssigned = false;
    startBallLaunch(internalState, { skipReadinessCheck: true });
  };

  const cleanup = () => {
    if (internalState.animationFrameId !== null) cancelAnimationFrame(internalState.animationFrameId);
    if (checkbox) {
      checkbox.removeEventListener('change', handleCheckboxChange);
    }
  };

  return { cleanup, rerollDice };
}

function resetAnimation(state: InternalState) {
  if (state.usePerfectStar) {
    const perfectValue = 70;
    state.enemyStatValues = Array.from({ length: AXES }, () => perfectValue);
    state.playerStatValues = Array.from({ length: AXES }, () => perfectValue);
    state.baseEnemyValues = [...state.enemyStatValues];
    state.basePlayerValues = [...state.playerStatValues];
  } else {
    state.enemyStatValues = generateMockStats();
    state.playerStatValues = generateMockStats();
    state.baseEnemyValues = [...state.enemyStatValues];
    state.basePlayerValues = [...state.playerStatValues];
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
    speed: 16,
    startTime: 0,
    duration: BALL_TOTAL_DURATION_MS,
    stopped: false,
    success: null,
    targetX: 320,
    targetY: 320,
    targetAssigned: false,
    guidanceDelay: 0,
    targetArrivalTime: 0,
    forcedOutcome: null,
    guidanceActive: false,
    guidanceDuration: 0,
    guidanceStartX: 320,
    guidanceStartY: 320,
    hasSettled: false,
  };

  state.successChance = calculateSuccessChance(state);
  state.successRoll = null;
}

function canvasCenter(_state: InternalState) {
  return { x: 320, y: 320 };
}

function triggerShake(state: InternalState, intensity: number) {
  state.screenShake.trauma = Math.min(1, state.screenShake.trauma + intensity);
}

function updateScreenShake(state: InternalState) {
  if (state.screenShake.trauma > 0) {
    state.screenShake.trauma -= 0.05; // Decay
    if (state.screenShake.trauma < 0) state.screenShake.trauma = 0;

    const shakeMap = state.screenShake.trauma * state.screenShake.trauma; // Non-linear falloff
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
  const PILLAR_START_HEIGHT = 400; // Drop height

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

    // Tentacles spawn but stay 0 until pillar lands
    state.tentacles.push({ angle, length: 0, targetLength: finalRadius, growing: false }); // Wait for landing
    state.currentEnemyPillarIndex += 1;
  }

  // Animate Enemy Pillars Falling
  state.enemyPillars.forEach((pillar, i) => {
    if (!pillar.landed) {
      pillar.velocity += 2; // Gravity
      pillar.currentHeight -= pillar.velocity;

      if (pillar.currentHeight <= 0) {
        // Impact!
        pillar.currentHeight = 0;
        pillar.landed = true;
        pillar.velocity = 0;

        // Start tentacle growth
        if (state.tentacles[i]) state.tentacles[i].growing = true;

        // FX
        triggerShake(state, 0.4);
        spawnParticleBurst(state, pillar.angle, pillar.finalRadius, VISUAL_CONFIG.colors.particle, VISUAL_CONFIG.colors.particleSecondary, 12);
      }
    }
  });

  // Update Tentacles (grow after impact)
  state.tentacles.forEach((tentacle) => {
    if (tentacle.growing && tentacle.length < tentacle.targetLength) {
      tentacle.length += 15; // Fast grow on impact
      if (tentacle.length >= tentacle.targetLength) {
        tentacle.length = tentacle.targetLength;
      }
    }
  });

  // Start Player sequence after Enemy sequence finishes morphing
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
        pillar.velocity += 2.5; // Heavier gravity for player
        pillar.currentHeight -= pillar.velocity;

        if (pillar.currentHeight <= 0) {
          pillar.currentHeight = 0;
          pillar.landed = true;
          pillar.velocity = 0;

          triggerShake(state, 0.5); // Stronger shake
          spawnParticleBurst(state, pillar.angle, pillar.finalRadius, VISUAL_CONFIG.colors.playerPillarStroke, VISUAL_CONFIG.colors.playerPillarFill, 16);
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
      triggerShake(state, 0.3); // Shake on morph complete
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
      state.flashOpacity = 1; // FLASH!
      triggerShake(state, 0.8);
    }
  }

  if (!state.ball.active && !state.ball.stopped) {
    startBallLaunch(state);
  }
}

function updateBall(state: InternalState) {
  if (!state.ball.active || state.ball.stopped) return;

  const now = Date.now();
  const elapsed = now - state.ball.startTime;
  const timeRemaining = state.ball.duration - elapsed;

  if (timeRemaining <= 0) {
    state.ball.stopped = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    const starVertices = getStarVertices(state);
    state.ball.success = isPointInPolygon(state.ball.x, state.ball.y, starVertices);
    if (state.ball.forcedOutcome !== null) {
      state.ball.success = state.ball.forcedOutcome;
    }
    triggerShake(state, 0.6); // Final result shake
    return;
  }

  if (elapsed < state.ball.guidanceDelay) {
    state.ball.vx = (state.ball.vx + (Math.random() - 0.5) * VISUAL_CONFIG.ballPath.chaosImpulse) * VISUAL_CONFIG.ballPath.chaosDamping;
    state.ball.vy = (state.ball.vy + (Math.random() - 0.5) * VISUAL_CONFIG.ballPath.chaosImpulse) * VISUAL_CONFIG.ballPath.chaosDamping;
  } else {
    state.ball.vx *= VISUAL_CONFIG.ballPath.globalDrag;
    state.ball.vy *= VISUAL_CONFIG.ballPath.globalDrag;
  }

  const guidanceStart = state.ball.guidanceDelay;

  if (state.ball.targetAssigned && elapsed >= guidanceStart) {
    if (!state.ball.guidanceActive) {
      state.ball.guidanceActive = true;
      state.ball.guidanceStartX = state.ball.x;
      state.ball.guidanceStartY = state.ball.y;
      state.ball.guidanceDuration = state.ball.targetArrivalTime - (state.ball.startTime + state.ball.guidanceDelay);
      spawnParticleBurst(
        state,
        Math.random() * Math.PI * 2,
        40,
        VISUAL_CONFIG.colors.playerPillarStroke,
        VISUAL_CONFIG.colors.particleSecondary,
        8,
        state.ball.x,
        state.ball.y,
      );
      triggerShake(state, 0.25);
    }

    const starVertices = getStarVertices(state);
    const insideStar = isPointInPolygon(state.ball.x, state.ball.y, starVertices);
    const shouldBeInsideStar = state.ball.forcedOutcome === true;
    const currentSpeed = Math.hypot(state.ball.vx, state.ball.vy);

    if (insideStar !== shouldBeInsideStar) {
      if (currentSpeed < 10) {
        state.ball.vx *= 1.02;
        state.ball.vy *= 1.02;
      }
      if (currentSpeed > 12) {
        state.ball.vx *= VISUAL_CONFIG.ballPath.pinballFriction;
        state.ball.vy *= VISUAL_CONFIG.ballPath.pinballFriction;
      }
    } else {
      const brakeForce = 0.92;
      state.ball.vx *= brakeForce;
      state.ball.vy *= brakeForce;
      if (Math.hypot(state.ball.vx, state.ball.vy) < 0.2) {
        state.ball.vx = 0;
        state.ball.vy = 0;
      }
    }

    if (state.ball.vx === 0 && state.ball.vy === 0 && !state.ball.hasSettled) {
      state.ball.hasSettled = true;
      state.ball.stopped = true;
      state.ball.success = shouldBeInsideStar;
      triggerShake(state, 0.4);
      return;
    }
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
    state.ball.vx *= 0.98;
    state.ball.vy *= 0.98;

    // Impact effect
    triggerShake(state, 0.2);
    spawnParticleBurst(state, 0, 0, VISUAL_CONFIG.colors.particle, '#fff', 5, state.ball.x, state.ball.y);

  } else {
    state.ball.x = nextX;
    state.ball.y = nextY;
  }
}

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
  }
}

function drawStatOverlay(ctx: CanvasRenderingContext2D, state: InternalState) {
  const center = canvasCenter(state);
  for (let i = 0; i < AXES; i += 1) {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / AXES);
    const labelRadius = RADIUS + 36;
    const iconX = center.x + Math.cos(angle) * labelRadius;
    const iconY = center.y + Math.sin(angle) * labelRadius;
    const axisEntry = state.axisMeta[i] ?? FALLBACK_AXIS_META[i % FALLBACK_AXIS_META.length];
    const axisIcon = axisEntry?.icon ?? '◆';
    ctx.font = `600 24px 'Space Grotesk', system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(axisIcon, iconX, iconY);

    const textY = iconY + 20;
    const playerVal = Math.round(state.playerStatValues[i] ?? 0);
    const enemyVal = Math.round(state.enemyStatValues[i] ?? 0);
    ctx.font = `600 12px 'Space Grotesk', system-ui`;
    ctx.fillStyle = VISUAL_CONFIG.colors.playerText;
    ctx.fillText(`${playerVal} vs ${enemyVal}`, iconX, textY);
  }

  ctx.font = `600 16px 'Space Grotesk', system-ui`;
  ctx.fillStyle = '#cbd5f5';
  ctx.textAlign = 'center';
  ctx.fillText(`SUCCESSO STIMATO: ${state.successChance.toFixed(1)}%`, center.x, center.y + RADIUS + 70);

  const rollValue = state.successRoll === null ? '--' : state.successRoll.toFixed(1);
  const resolvedOutcome = state.ball.success ?? state.ball.forcedOutcome;
  const outcomeLabel =
    resolvedOutcome === null ? 'IN CORSO' : resolvedOutcome ? 'SUCCESSO' : 'FALLIMENTO';
  ctx.font = `600 14px 'Space Grotesk', system-ui`;
  ctx.fillStyle = '#94a3ff';
  ctx.fillText(`ROLL: ${rollValue} → ${outcomeLabel}`, center.x, center.y + RADIUS + 92);
}

function drawBall(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.ball.active && !state.ball.stopped) return;

  ctx.save();
  ctx.shadowColor = VISUAL_CONFIG.colors.particleSecondary;
  ctx.shadowBlur = 18;
  ctx.fillStyle = VISUAL_CONFIG.colors.particleSecondary;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (state.ball.stopped) {
    const endColor = state.ball.success ? VISUAL_CONFIG.colors.obeliskEdgeGlow : '#ff6b6b';
    ctx.fillStyle = endColor;
    ctx.font = 'bold 26px "Space Grotesk", system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillText(state.ball.success ? 'SUCCESSO! ✓' : 'FALLITO ✗', canvasCenter(state).x, canvasCenter(state).y - 100);
  }
}

function drawPillars(ctx: CanvasRenderingContext2D, state: InternalState) {
  const center = canvasCenter(state);

  const drawObelisk = (
    pillar: PillarState,
    palette: { base: string; highlight: string; shadow: string },
    glowColor: string,
  ) => {
    const dx = Math.cos(pillar.angle);
    const dy = Math.sin(pillar.angle);
    const px = center.x + dx * pillar.finalRadius;
    const py = center.y + dy * pillar.finalRadius;
    const visualY = py - pillar.currentHeight;
    const isFalling = pillar.currentHeight > 0;
    const width = 24 + pillar.finalRadius * 0.02;
    const height = 60 + pillar.finalRadius * 0.04;

    ctx.save();

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(px, py, width * 0.55, width * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Falling trail
    if (isFalling) {
      const trailGradient = ctx.createLinearGradient(px, visualY - height, px, visualY);
      trailGradient.addColorStop(0, `${glowColor}55`);
      trailGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = trailGradient;
      ctx.beginPath();
      ctx.moveTo(px - width * 0.35, visualY - height * 0.4);
      ctx.lineTo(px, visualY - height - 50);
      ctx.lineTo(px + width * 0.35, visualY - height * 0.4);
      ctx.closePath();
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Side face (shadow)
    const sidePath = new Path2D();
    sidePath.moveTo(px, visualY + 12);
    sidePath.lineTo(px - width * 0.5, visualY);
    sidePath.lineTo(px - width * 0.5, visualY - height);
    sidePath.lineTo(px, visualY - height + 12);
    sidePath.closePath();
    const sideGradient = ctx.createLinearGradient(px - width * 0.5, visualY - height, px - width * 0.5, visualY);
    sideGradient.addColorStop(0, palette.shadow);
    sideGradient.addColorStop(1, palette.base);
    ctx.fillStyle = sideGradient;
    ctx.fill(sidePath);

    // Front face
    const frontPath = new Path2D();
    frontPath.moveTo(px, visualY + 12);
    frontPath.lineTo(px + width * 0.5, visualY);
    frontPath.lineTo(px + width * 0.5, visualY - height);
    frontPath.lineTo(px, visualY - height + 12);
    frontPath.closePath();
    const frontGradient = ctx.createLinearGradient(px - width * 0.5, visualY - height, px + width * 0.5, visualY);
    frontGradient.addColorStop(0, palette.highlight);
    frontGradient.addColorStop(0.5, palette.base);
    frontGradient.addColorStop(1, palette.shadow);
    ctx.fillStyle = frontGradient;
    ctx.fill(frontPath);

    // Top facet
    const topGradient = ctx.createRadialGradient(px, visualY - height - 6, 0, px, visualY - height - 6, width);
    topGradient.addColorStop(0, palette.highlight);
    topGradient.addColorStop(1, palette.base);
    ctx.fillStyle = topGradient;
    ctx.beginPath();
    ctx.moveTo(px, visualY - height + 12);
    ctx.lineTo(px - width * 0.5, visualY - height);
    ctx.lineTo(px, visualY - height - 12);
    ctx.lineTo(px + width * 0.5, visualY - height);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isFalling ? 16 : 8;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.stroke(frontPath);

    ctx.restore();
  };

  const combinedPillars = [
    ...state.enemyPillars.map((pillar) => ({
      pillar,
      palette: VISUAL_CONFIG.colors.obeliskEnemy,
      glow: VISUAL_CONFIG.colors.obeliskEdgeGlow,
    })),
    ...state.playerPillars.map((pillar) => ({
      pillar,
      palette: VISUAL_CONFIG.colors.obeliskPlayer,
      glow: VISUAL_CONFIG.colors.obeliskEdgeGlow,
    })),
  ];

  combinedPillars
    .sort((a, b) => {
      const visualYA = center.y + Math.sin(a.pillar.angle) * a.pillar.finalRadius - a.pillar.currentHeight;
      const visualYB = center.y + Math.sin(b.pillar.angle) * b.pillar.finalRadius - b.pillar.currentHeight;
      return visualYA - visualYB;
    })
    .forEach(({ pillar, palette, glow }) => drawObelisk(pillar, palette, glow));
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
      // Physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity
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

function drawTarAnimation(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.tarPuddle.active || state.tarPuddle.radius <= 0) return;

  ctx.save();
  ctx.fillStyle = VISUAL_CONFIG.colors.pentagonFill;
  ctx.shadowColor = VISUAL_CONFIG.colors.pentagonGlow;
  ctx.shadowBlur = VISUAL_CONFIG.glowStrengthPentagon;
  ctx.beginPath();

  if (!state.tarPuddle.morphing || state.tarPuddle.morphProgress === 0) {
    ctx.arc(canvasCenter(state).x, canvasCenter(state).y, state.tarPuddle.radius, 0, Math.PI * 2);
  } else {
    // Morph logic... (copied from original V6 just in case)
    const segments = 60;
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
      const circleRadius = state.tarPuddle.radius;
      let pentagonRadius = state.tarPuddle.radius;
      for (let j = 0; j < AXES; j += 1) {
        const vertexAngle = -Math.PI / 2 + j * ((2 * Math.PI) / AXES);
        const nextVertexAngle = -Math.PI / 2 + ((j + 1) % AXES) * ((2 * Math.PI) / AXES);
        let normalizedAngle = angle;
        let normalizedNextVertex = nextVertexAngle;
        if (j === AXES - 1) {
          normalizedNextVertex = nextVertexAngle + Math.PI * 2;
          if (angle < 0) normalizedAngle = angle + Math.PI * 2;
        }
        if (
          (j < AXES - 1 && angle >= vertexAngle && angle <= nextVertexAngle) ||
          (j === AXES - 1 && normalizedAngle >= vertexAngle && normalizedAngle <= normalizedNextVertex)
        ) {
          const vertex1Dist = state.tentacles[j]?.length ?? circleRadius;
          const vertex2Dist = state.tentacles[(j + 1) % AXES]?.length ?? circleRadius;
          const t = (normalizedAngle - vertexAngle) / (normalizedNextVertex - vertexAngle || 1);
          pentagonRadius = vertex1Dist + (vertex2Dist - vertex1Dist) * t;
          break;
        }
      }
      const radius = circleRadius + (pentagonRadius - circleRadius) * state.tarPuddle.morphProgress;
      const x = canvasCenter(state).x + Math.cos(angle) * radius;
      const y = canvasCenter(state).y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  ctx.fill();
  ctx.restore();

}

function drawGoldStar(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.goldStar.active || state.goldStar.radius <= 0) return;

  ctx.save();
  ctx.fillStyle = VISUAL_CONFIG.colors.starFill;
  ctx.shadowColor = VISUAL_CONFIG.colors.starGlow;
  ctx.shadowBlur = VISUAL_CONFIG.glowStrengthStar;
  ctx.beginPath();

  const center = canvasCenter(state);
  if (!state.goldStar.morphing || state.goldStar.morphProgress === 0) {
    tracePerfectStar(ctx, center, state.goldStar.radius);
    ctx.closePath();
  } else {
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
      const finalRadius = state.goldStar.radius + (radius - state.goldStar.radius) * state.goldStar.morphProgress;
      const x = center.x + Math.cos(angle) * finalRadius;
      const y = center.y + Math.sin(angle) * finalRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  ctx.fill();
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

function generateMockStats() {
  const range = MOCK_STAT_RANGE.max - MOCK_STAT_RANGE.min;
  return Array.from({ length: AXES }, () => Math.round(MOCK_STAT_RANGE.min + Math.random() * range));
}

function calculateSuccessChance(state: InternalState) {
  const playerSum = state.playerStatValues.reduce((sum, value) => sum + value, 0);
  const enemySum = state.enemyStatValues.reduce((sum, value) => sum + value, 0);
  const rawChance = 50 + (playerSum - enemySum);
  return clamp(rawChance, SUCCESS_PROB_CLAMP.min, SUCCESS_PROB_CLAMP.max);
}

function rollForOutcome(state: InternalState) {
  const roll = Math.random() * 100;
  state.successRoll = roll;
  return roll <= state.successChance;
}

function assignBallTarget(state: InternalState) {
  const starVertices = getStarVertices(state);
  const pentagonVertices = getPentagonVertices(state);
  const center = canvasCenter(state);

  if (state.ball.forcedOutcome === null) {
    state.ball.targetAssigned = false;
    return;
  }

  if (state.ball.forcedOutcome) {
    const edgePoint = randomPointOnPolygonEdges(starVertices) ?? center;
    const inset = VISUAL_CONFIG.ballTargetOffsets.successInset;
    const targetPoint = movePointTowardCenter(edgePoint, center, inset);
    state.ball.targetX = targetPoint.x;
    state.ball.targetY = targetPoint.y;
  } else {
    const edgePoint = randomPointOnPolygonEdges(starVertices) ?? randomPointOnPolygonEdges(pentagonVertices) ?? center;
    const outset = VISUAL_CONFIG.ballTargetOffsets.failureOutset;
    let targetPoint = movePointTowardCenter(edgePoint, center, -outset);

    if (!isPointInPolygon(targetPoint.x, targetPoint.y, pentagonVertices) || isPointInPolygon(targetPoint.x, targetPoint.y, starVertices)) {
      targetPoint =
        randomPointInsidePolygon(pentagonVertices, (x, y) => !isPointInPolygon(x, y, starVertices)) ??
        movePointTowardCenter(edgePoint, center, 0);
    }

    state.ball.targetX = targetPoint.x;
    state.ball.targetY = targetPoint.y;
  }

  state.ball.targetAssigned = true;
}

function startBallLaunch(state: InternalState, options: { skipReadinessCheck?: boolean } = {}) {
  if (!options.skipReadinessCheck) {
    const goldReady = state.goldStar.active && state.goldStar.morphProgress >= 1;
    const playerReady = state.playerPillars.length === AXES && state.playerPillars.every((p) => p.landed);
    if (!goldReady || !playerReady) {
      return;
    }
  }

  state.ball.active = true;
  state.ball.stopped = false;
  state.ball.success = null;
  state.ball.targetAssigned = false;
  state.ball.startTime = Date.now();
  state.ball.duration = BALL_TOTAL_DURATION_MS;
  state.ball.guidanceDelay = CHAOS_PHASE_DURATION_MS;
  state.ball.targetArrivalTime = state.ball.startTime + BALL_TOTAL_DURATION_MS;
  state.ball.x = canvasCenter(state).x;
  state.ball.y = canvasCenter(state).y;
  state.ball.guidanceActive = false;
  state.ball.guidanceDuration = GUIDANCE_PHASE_DURATION_MS;
  state.ball.guidanceStartX = state.ball.x;
  state.ball.guidanceStartY = state.ball.y;
  state.ball.hasSettled = false;

  state.successChance = calculateSuccessChance(state);
  const forcedSuccess = rollForOutcome(state);
  state.ball.forcedOutcome = forcedSuccess;
  assignBallTarget(state);

  const launchAngle = Math.random() * Math.PI * 2;
  const launchSpeed = state.ball.speed * 1.4;
  state.ball.vx = Math.cos(launchAngle) * launchSpeed;
  state.ball.vy = Math.sin(launchAngle) * launchSpeed;
}

function randomPointInsidePolygon(
  vertices: { x: number; y: number }[],
  predicate: (x: number, y: number) => boolean = () => true,
) {
  const bounds = vertices.reduce(
    (acc, vertex) => ({
      minX: Math.min(acc.minX, vertex.x),
      maxX: Math.max(acc.maxX, vertex.x),
      minY: Math.min(acc.minY, vertex.y),
      maxY: Math.max(acc.maxY, vertex.y),
    }),
    {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    },
  );

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX || 1);
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY || 1);
    if (isPointInPolygon(x, y, vertices) && predicate(x, y)) {
      return { x, y };
    }
  }
  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
