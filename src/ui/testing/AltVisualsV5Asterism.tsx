import { useEffect, useMemo, useRef } from 'react';
import type { StatRow } from './types';

const AXES = 5;
const MAX_STAT = 100;
const TICKS = 10;
const RADIUS = 220;
const MIN_BASE_VALUE = 3;
const PILLAR_DELAY = 30;

const FALLBACK_AXIS_VALUES = {
  enemy: [68, 60, 58, 55, 62],
  player: [62, 58, 56, 50, 59],
} as const;

const FALLBACK_AXIS_META = [
  { name: 'Forza', icon: '💪' },
  { name: 'Velocità', icon: '⚡' },
  { name: 'Intelligenza', icon: '🧠' },
  { name: 'Difesa', icon: '🛡️' },
  { name: 'Vitalità', icon: '❤️' },
] as const;

const PERFECT_STAR_VALUE = 70;

interface AxisValues {
  enemy: number[];
  player: number[];
}

interface AxisMeta {
  name: string;
  icon: string;
}

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
  speed: number;
  startTime: number;
  duration: number;
  stopped: boolean;
  success: boolean | null;
}

interface PillarState {
  angle: number;
  radius: number;
  targetRadius: number;
  growing: boolean;
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
  alpha: number;
  decay: number;
}

interface InternalState {
  centerX: number;
  centerY: number;
  axisMeta: AxisMeta[];
  usePerfectStar: boolean;
  baseEnemyValues: number[];
  basePlayerValues: number[];
  enemyStatValues: number[];
  playerStatValues: number[];
  tarPuddle: MorphShapeState;
  goldStar: MorphShapeState;
  ball: BallState;
  enemyPillars: PillarState[];
  playerPillars: PillarState[];
  tentacles: TentacleState[];
  particles: Particle[];
  currentEnemyPillarIndex: number;
  currentPlayerPillarIndex: number;
  enemyPillarAnimationDelay: number;
  playerPillarAnimationDelay: number;
  playerAnimationStarted: boolean;
  animationFrameId: number | null;
}

interface AltVisualsV5AsterismProps {
  stats: StatRow[];
}

export function AltVisualsV5Asterism({ stats }: AltVisualsV5AsterismProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const axisValues = useMemo(() => deriveAxisValues(stats), [stats]);
  const axisMeta = useMemo(() => deriveAxisMeta(stats), [stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const checkbox = checkboxRef.current;
    if (!canvas || !checkbox) return undefined;
    const cleanup = initAltVisualsV7(canvas, checkbox, axisValues, axisMeta);
    return cleanup;
  }, [axisValues, axisMeta]);

  return (
    <div className="space-y-4">
      <header className="text-center space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
          Alt Visuals v5 · Anime Starfield
        </h3>
        <p className="text-[11px] text-slate-300">
          Replica uno skill check anime-style con morphing pentagono/stella, pilastri glow e particelle reattive.
        </p>
      </header>

      <div className="flex justify-center">
        <label className="flex items-center gap-3 px-4 py-2 rounded-full border border-slate-800 bg-slate-950/60 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
          <input ref={checkboxRef} type="checkbox" className="size-4 accent-amber-400 rounded border border-slate-500" />
          Stella Perfetta
        </label>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          className="w-full max-w-[680px] rounded-[28px] border border-white/5 bg-[radial-gradient(circle_at_center,#14141c_0%,#07070a_80%)] shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
        />
      </div>
    </div>
  );
}

export default AltVisualsV5Asterism;

function initAltVisualsV7(canvas: HTMLCanvasElement, checkbox: HTMLInputElement, axisValues: AxisValues, axisMeta: AxisMeta[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return () => {};
  }

  const internalState: InternalState = {
    centerX: canvas.width / 2,
    centerY: canvas.height / 2,
    axisMeta: axisMeta,
    usePerfectStar: false,
    baseEnemyValues: [...axisValues.enemy],
    basePlayerValues: [...axisValues.player],
    enemyStatValues: [],
    playerStatValues: [],
    tarPuddle: { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 },
    goldStar: { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 },
    ball: {
      active: false,
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0,
      vy: 0,
      radius: 8,
      speed: 12,
      startTime: 0,
      duration: 5000,
      stopped: false,
      success: null,
    },
    enemyPillars: [],
    playerPillars: [],
    tentacles: [],
    particles: [],
    currentEnemyPillarIndex: 0,
    currentPlayerPillarIndex: 0,
    enemyPillarAnimationDelay: 0,
    playerPillarAnimationDelay: 0,
    playerAnimationStarted: false,
    animationFrameId: null,
  };

  const handleCheckboxChange = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    internalState.usePerfectStar = event.target.checked;
    resetAnimation(internalState);
  };

  checkbox.checked = false;
  checkbox.addEventListener('change', handleCheckboxChange);
  resetAnimation(internalState);

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, internalState);
    spawnParticles(internalState);
    updateParticles(internalState);
    drawParticles(ctx, internalState);
    drawTarAnimation(ctx, internalState);
    drawGoldStar(ctx, internalState);
    updatePillars(internalState);
    drawPillars(ctx, internalState);
    updateBall(internalState);
    drawBall(ctx, internalState);
    drawStatLabels(ctx, internalState);
    internalState.animationFrameId = requestAnimationFrame(draw);
  };

  draw();

  return () => {
    if (internalState.animationFrameId !== null) {
      cancelAnimationFrame(internalState.animationFrameId);
    }
    checkbox.removeEventListener('change', handleCheckboxChange);
  };
}

function deriveAxisValues(stats: StatRow[]): AxisValues {
  const normalized = stats
    .map((stat, index) => ({
      quest: clampValue(stat.questValue),
      hero: clampValue(stat.heroValue ?? stat.questValue),
      fallbackIndex: index,
    }))
    .filter((entry) => entry.quest > 0 || entry.hero > 0)
    .slice(0, AXES);

  const enemy: number[] = [];
  const player: number[] = [];

  for (let i = 0; i < AXES; i += 1) {
    if (normalized[i]) {
      enemy.push(normalized[i].quest);
      player.push(normalized[i].hero);
    } else {
      enemy.push(FALLBACK_AXIS_VALUES.enemy[i]);
      player.push(FALLBACK_AXIS_VALUES.player[i]);
    }
  }

  return { enemy, player };
}

function clampValue(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_STAT, Number(value)));
}

function deriveAxisMeta(stats: StatRow[]): AxisMeta[] {
  const normalized = stats
    .map((stat, index) => ({
      name: stat.name?.trim() || FALLBACK_AXIS_META[index % FALLBACK_AXIS_META.length].name,
      icon: FALLBACK_AXIS_META[index % FALLBACK_AXIS_META.length].icon,
    }))
    .filter((entry) => !!entry.name)
    .slice(0, AXES);

  const result: AxisMeta[] = [];
  for (let i = 0; i < AXES; i += 1) {
    result.push(normalized[i] ?? FALLBACK_AXIS_META[i]);
  }
  return result;
}

function resetAnimation(state: InternalState) {
  if (state.usePerfectStar) {
    state.enemyStatValues = Array.from({ length: AXES }, () => PERFECT_STAR_VALUE);
    state.playerStatValues = Array.from({ length: AXES }, () => PERFECT_STAR_VALUE);
  } else {
    state.enemyStatValues = [...state.baseEnemyValues];
    state.playerStatValues = [...state.basePlayerValues];
  }

  state.tarPuddle = { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 };
  state.goldStar = { active: false, radius: 0, maxRadius: 30, growing: true, morphing: false, morphProgress: 0 };
  state.enemyPillars = [];
  state.playerPillars = [];
  state.tentacles = [];
  state.particles = [];
  state.currentEnemyPillarIndex = 0;
  state.currentPlayerPillarIndex = 0;
  state.enemyPillarAnimationDelay = 0;
  state.playerPillarAnimationDelay = 0;
  state.playerAnimationStarted = false;
  state.ball = {
    active: false,
    x: state.centerX,
    y: state.centerY,
    vx: 0,
    vy: 0,
    radius: 8,
    speed: 12,
    startTime: 0,
    duration: 5000,
    stopped: false,
    success: null,
  };
}

function drawGrid(ctx: CanvasRenderingContext2D, state: InternalState) {
  for (let i = 0; i < AXES; i += 1) {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / AXES);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(state.centerX, state.centerY);
    ctx.lineTo(state.centerX + dx * RADIUS, state.centerY + dy * RADIUS);
    ctx.stroke();

    for (let t = 1; t <= TICKS; t += 1) {
      const r = (RADIUS / TICKS) * t;
      const tx = state.centerX + dx * r;
      const ty = state.centerY + dy * r;
      const nx = -dy;
      const ny = dx;

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx - nx * 6, ty - ny * 6);
      ctx.lineTo(tx + nx * 6, ty + ny * 6);
      ctx.stroke();
    }

    ctx.font = '600 28px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(state.axisMeta[i].icon, state.centerX + dx * (RADIUS + 30), state.centerY + dy * (RADIUS + 30));
  }
}

function spawnParticles(state: InternalState) {
  if (Math.random() < 0.2) {
    state.particles.push({
      x: state.centerX + Math.random() * 200 - 100,
      y: state.centerY + Math.random() * 200 - 100,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      radius: Math.random() * 2 + 1,
      alpha: 1,
      decay: Math.random() * 0.01 + 0.005,
    });
  }
}

function updateParticles(state: InternalState) {
  state.particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.alpha -= particle.decay;
  });
  state.particles = state.particles.filter((particle) => particle.alpha > 0);
}

function drawParticles(ctx: CanvasRenderingContext2D, state: InternalState) {
  state.particles.forEach((particle) => {
    ctx.fillStyle = `rgba(255,255,200,${particle.alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

function drawTarAnimation(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.tarPuddle.active || state.tarPuddle.radius <= 0) return;
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.fillStyle = '#111';
  ctx.beginPath();
  const segments = 60;

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const tentacleLength = state.tentacles[i % AXES]?.length ?? state.tarPuddle.radius;
    const easedRadius =
      state.tarPuddle.radius +
      (tentacleLength - state.tarPuddle.radius) * easeOutCubic(state.tarPuddle.morphProgress);
    const x = state.centerX + Math.cos(angle) * easedRadius;
    const y = state.centerY + Math.sin(angle) * easedRadius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(state.centerX, state.centerY, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoldStar(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.goldStar.active || state.goldStar.radius <= 0) return;
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = 'gold';
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();

  for (let i = 0; i < AXES * 2; i += 1) {
    const angle = -Math.PI / 2 + i * (Math.PI / AXES);
    const isOuter = i % 2 === 0;
    let targetRadius = state.goldStar.radius * 0.4;
    if (isOuter) {
      const pillar = state.playerPillars[Math.floor(i / 2)];
      targetRadius = pillar?.targetRadius ?? state.goldStar.radius;
    }
    const easedRadius =
      state.goldStar.radius + (targetRadius - state.goldStar.radius) * easeOutCubic(state.goldStar.morphProgress);
    const x = state.centerX + Math.cos(angle) * easedRadius;
    const y = state.centerY + Math.sin(angle) * easedRadius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(state.centerX, state.centerY, 3, 0, Math.PI * 2);
  ctx.fill();
}

function updateBall(state: InternalState) {
  if (!state.ball.active || state.ball.stopped) return;
  if (Date.now() - state.ball.startTime > state.ball.duration) {
    state.ball.stopped = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.success = true;
    return;
  }
  state.ball.x += state.ball.vx + (Math.random() - 0.5) * 0.5;
  state.ball.y += state.ball.vy + (Math.random() - 0.5) * 0.5;
}

function drawBall(ctx: CanvasRenderingContext2D, state: InternalState) {
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.stroke();

  if (state.ball.stopped) {
    ctx.fillStyle = state.ball.success ? '#48bb78' : '#ff4444';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(state.ball.success ? 'SUCCESSO! ✓' : 'FALLITO ✗', state.centerX, state.centerY - 100);
  }
}

function updatePillars(state: InternalState) {
  state.enemyPillarAnimationDelay += 1;
  if (state.enemyPillarAnimationDelay % PILLAR_DELAY === 0 && state.currentEnemyPillarIndex < AXES) {
    const angle = -Math.PI / 2 + state.currentEnemyPillarIndex * ((2 * Math.PI) / AXES);
    const statValue = MIN_BASE_VALUE + state.enemyStatValues[state.currentEnemyPillarIndex];
    const targetRadius = (RADIUS * statValue) / (MAX_STAT + MIN_BASE_VALUE);
    state.enemyPillars.push({ angle, radius: 0, targetRadius, growing: true });
    state.tentacles.push({ angle, length: 0, targetLength: targetRadius, growing: true });
    state.currentEnemyPillarIndex += 1;
  }

  state.enemyPillars.forEach((pillar) => {
    pillar.radius += (pillar.targetRadius - pillar.radius) * 0.2;
    if (Math.abs(pillar.radius - pillar.targetRadius) < 0.5) {
      pillar.radius = pillar.targetRadius;
      pillar.growing = false;
    }
  });
  state.tentacles.forEach((tentacle) => {
    tentacle.length += (tentacle.targetLength - tentacle.length) * 0.2;
    if (Math.abs(tentacle.length - tentacle.targetLength) < 0.5) {
      tentacle.length = tentacle.targetLength;
      tentacle.growing = false;
    }
  });

  if (!state.playerAnimationStarted && state.tarPuddle.morphing && state.tarPuddle.morphProgress >= 1) {
    state.playerAnimationStarted = true;
  }

  if (state.playerAnimationStarted) {
    state.playerPillarAnimationDelay += 1;
    if (state.playerPillarAnimationDelay % PILLAR_DELAY === 0 && state.currentPlayerPillarIndex < AXES) {
      const angle = -Math.PI / 2 + state.currentPlayerPillarIndex * ((2 * Math.PI) / AXES);
      const statValue = MIN_BASE_VALUE + state.playerStatValues[state.currentPlayerPillarIndex];
      const targetRadius = (RADIUS * statValue) / (MAX_STAT + MIN_BASE_VALUE);
      state.playerPillars.push({ angle, radius: 0, targetRadius, growing: true });
      state.currentPlayerPillarIndex += 1;
    }

    state.playerPillars.forEach((pillar) => {
      pillar.radius += (pillar.targetRadius - pillar.radius) * 0.2;
      if (Math.abs(pillar.radius - pillar.targetRadius) < 0.5) {
        pillar.radius = pillar.targetRadius;
        pillar.growing = false;
      }
    });
  }

  if (!state.tarPuddle.active && state.enemyPillarAnimationDelay > 30) {
    state.tarPuddle.active = true;
  }
  if (state.tarPuddle.active && state.tarPuddle.growing && state.tarPuddle.radius < state.tarPuddle.maxRadius) {
    state.tarPuddle.radius += 1;
    if (state.tarPuddle.radius >= state.tarPuddle.maxRadius) {
      state.tarPuddle.growing = false;
    }
  }
  if (!state.tarPuddle.growing && state.tentacles.length === AXES && state.tentacles.every((t) => !t.growing)) {
    state.tarPuddle.morphing = true;
  }
  if (state.tarPuddle.morphing && state.tarPuddle.morphProgress < 1) {
    state.tarPuddle.morphProgress += 0.02;
    if (state.tarPuddle.morphProgress > 1) {
      state.tarPuddle.morphProgress = 1;
    }
  }

  if (state.playerAnimationStarted && !state.goldStar.active) {
    state.goldStar.active = true;
  }
  if (state.goldStar.active && state.goldStar.growing && state.goldStar.radius < state.goldStar.maxRadius) {
    state.goldStar.radius += 1;
    if (state.goldStar.radius >= state.goldStar.maxRadius) {
      state.goldStar.growing = false;
    }
  }
  if (state.goldStar.active && !state.goldStar.growing && state.playerPillars.length === AXES && state.playerPillars.every((p) => !p.growing)) {
    state.goldStar.morphing = true;
  }
  if (state.goldStar.morphing && state.goldStar.morphProgress < 1) {
    state.goldStar.morphProgress += 0.02;
    if (state.goldStar.morphProgress > 1) {
      state.goldStar.morphProgress = 1;
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

function drawPillars(ctx: CanvasRenderingContext2D, state: InternalState) {
  state.enemyPillars.forEach((pillar) => {
    const dx = Math.cos(pillar.angle);
    const dy = Math.sin(pillar.angle);
    const px = state.centerX + dx * pillar.radius;
    const py = state.centerY + dy * pillar.radius;
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(102,126,234,0.7)';
    ctx.fillStyle = 'rgba(102,126,234,0.7)';
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  state.playerPillars.forEach((pillar) => {
    const dx = Math.cos(pillar.angle);
    const dy = Math.sin(pillar.angle);
    const px = state.centerX + dx * pillar.radius;
    const py = state.centerY + dy * pillar.radius;
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(72,187,120,0.7)';
    ctx.fillStyle = 'rgba(72,187,120,0.7)';
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#48bb78';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });
}

function drawStatLabels(ctx: CanvasRenderingContext2D, state: InternalState) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Nemico', 20, 15);
  ctx.fillText('PG', 150, 15);
  state.axisMeta.forEach((meta, index) => {
    const y = 40 + index * 25;
    ctx.fillText(`${meta.icon} ${meta.name}: ${state.enemyStatValues[index]}`, 20, y);
    ctx.fillText(`${meta.icon} ${meta.name}: ${state.playerStatValues[index]}`, 150, y);
  });
}
