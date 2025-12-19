import { useEffect, useMemo, useRef } from 'react';
import { deriveAxisValues } from './altVisualsAxis';
import type { StatRow } from './types';

const AXES = 5;
const MAX_STAT = 100;
const TICKS = 10;
const RADIUS = 220;
const MIN_BASE_VALUE = 3;
const PILLAR_DELAY = 30;

const VISUAL_CONFIG = {
  morphSpeed: 0.02,
  glowStrengthPentagon: 26,
  glowStrengthStar: 32,
  particleSize: 8,
  particleCount: 18,
  particleLifetime: 420,
  colors: {
    pentagonFill: '#050505',
    pentagonGlow: 'rgba(20,20,30,0.85)',
    starFill: '#fdd97b',
    starGlow: 'rgba(255,215,126,0.75)',
    enemyPillarFill: 'rgba(130,74,255,0.75)',
    enemyPillarStroke: '#a57cff',
    playerPillarFill: 'rgba(73,236,193,0.75)',
    playerPillarStroke: '#4fe8b2',
    particle: '#ff94f8',
    particleSecondary: '#5de9ff',
    enemyText: '#9387ff',
    playerText: '#8cf8d5',
  },
} as const;

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
  life: number;
  color: string;
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
  animationFrameId: number | null;
  lastTimestamp: number;
}

const STAT_ICONS = ['💪', '⚡', '🧠', '🛡️', '❤️'];
const STAT_NAMES = ['Forza', 'Velocità', 'Intelligenza', 'Difesa', 'Vitalità'];
const FALLBACK_AXIS_VALUES = {
  enemy: [65, 58, 60, 55, 62],
  player: [60, 54, 58, 50, 59],
} as const;

interface AltVisualsV6AsterismProps {
  stats: StatRow[];
}

export function AltVisualsV6Asterism({ stats }: AltVisualsV6AsterismProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const debugPanelRef = useRef<HTMLDivElement | null>(null);
  const axisValues = useMemo(
    () => deriveAxisValues(stats, FALLBACK_AXIS_VALUES.enemy, FALLBACK_AXIS_VALUES.player, AXES),
    [stats],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const checkbox = checkboxRef.current;
    if (!canvas || !checkbox) {
      return;
    }

    const cleanup = initAltVisualsV6(canvas, checkbox, debugPanelRef.current, axisValues);
    return cleanup;
  }, [axisValues]);

  return (
    <div className="space-y-4">
      <header className="text-center space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200">Alt Visuals v6 · Starfield Duel</h3>
        <p className="text-[11px] text-slate-300">
          Morphing anime/manga con glow, particelle e identica logica pinball del prototipo originale.
        </p>
      </header>

      <div className="flex justify-center">
        <label className="flex items-center gap-3 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/60 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
          <input ref={checkboxRef} type="checkbox" className="size-4 accent-amber-400 rounded border border-slate-500" />
          Stella Perfetta (tutte le stat uguali)
        </label>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          className="w-full max-w-[680px] rounded-[28px] border border-white/5 bg-gradient-to-br from-[#11152b] via-[#080a16] to-[#05060f] shadow-[0_30px_90px_rgba(0,0,0,0.7),0_0_40px_rgba(93,233,255,0.25)]"
        />
      </div>

      <div
        ref={debugPanelRef}
        className="flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-400"
      />
    </div>
  );
}

export default AltVisualsV6Asterism;

function initAltVisualsV6(
  canvas: HTMLCanvasElement,
  checkbox: HTMLInputElement,
  debugPanel: HTMLDivElement | null | undefined,
  axisValues: { enemy: number[]; player: number[] },
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return () => {};
  }

  const internalState: InternalState = {
    usePerfectStar: false,
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

  if (debugPanel) {
    debugPanel.innerHTML = `
      <div>morphSpeed: ${VISUAL_CONFIG.morphSpeed}</div>
      <div>glowPentagon: ${VISUAL_CONFIG.glowStrengthPentagon}px</div>
      <div>glowStar: ${VISUAL_CONFIG.glowStrengthStar}px</div>
      <div>particleSize: ${VISUAL_CONFIG.particleSize}</div>
      <div>particleCount: ${VISUAL_CONFIG.particleCount}</div>
      <div>particleLifetime: ${VISUAL_CONFIG.particleLifetime}ms</div>
    `;
  }

  const drawLoop = () => {
    const now = performance.now();
    const delta = now - internalState.lastTimestamp;
    internalState.lastTimestamp = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
    updateTarAnimation(internalState);
    drawTarAnimation(ctx, internalState);
    drawGoldStar(ctx, internalState);
    updatePillars(internalState);
    drawPillars(ctx, internalState);
    updateBall(internalState);
    drawBall(ctx, internalState);
    updateParticles(internalState, delta);
    drawParticles(ctx, internalState);
    drawStatLabels(ctx, internalState);

    internalState.animationFrameId = requestAnimationFrame(drawLoop);
  };

  drawLoop();

  return () => {
    if (internalState.animationFrameId !== null) {
      cancelAnimationFrame(internalState.animationFrameId);
    }
    checkbox.removeEventListener('change', handleCheckboxChange);
  };
}

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
  state.ball = {
    active: false,
    x: canvasCenter(state).x,
    y: canvasCenter(state).y,
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

function canvasCenter(state: InternalState) {
  return { x: 320, y: 320 };
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

    ctx.font = `600 24px 'Space Grotesk', system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(STAT_ICONS[i], center.x + dx * (RADIUS + 36), center.y + dy * (RADIUS + 36));
  }
}

function drawStatLabels(ctx: CanvasRenderingContext2D, state: InternalState) {
  ctx.font = '600 13px "Space Grotesk", system-ui';
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Nemico', 24, 30);
  ctx.fillText('PG', 190, 30);

  state.enemyStatValues.forEach((enemyValue, i) => {
    const playerValue = state.playerStatValues[i];
    const y = 60 + i * 30;
    ctx.fillStyle = VISUAL_CONFIG.colors.enemyText;
    ctx.fillText(`${STAT_ICONS[i]} ${STAT_NAMES[i]}: ${enemyValue}`, 24, y);
    ctx.fillStyle = VISUAL_CONFIG.colors.playerText;
    ctx.fillText(`${STAT_ICONS[i]} ${STAT_NAMES[i]}: ${playerValue}`, 190, y);
  });
}

function updateTarAnimation(state: InternalState) {
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
    state.tarPuddle.morphProgress += VISUAL_CONFIG.morphSpeed;
    if (state.tarPuddle.morphProgress > 1) state.tarPuddle.morphProgress = 1;
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
    state.goldStar.morphProgress += VISUAL_CONFIG.morphSpeed;
    if (state.goldStar.morphProgress > 1) state.goldStar.morphProgress = 1;
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

  if (Date.now() - state.ball.startTime > state.ball.duration) {
    state.ball.stopped = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    const starVertices = getStarVertices(state);
    state.ball.success = isPointInPolygon(state.ball.x, state.ball.y, starVertices);
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
    state.ball.vx *= 0.98;
    state.ball.vy *= 0.98;
  } else {
    state.ball.x = nextX;
    state.ball.y = nextY;
  }
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
    ctx.fillStyle = state.ball.success ? VISUAL_CONFIG.colors.playerPillarStroke : VISUAL_CONFIG.colors.particle;
    ctx.font = 'bold 26px "Space Grotesk", system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 22;
    ctx.fillText(state.ball.success ? 'SUCCESSO! ✓' : 'FALLITO ✗', canvasCenter(state).x, canvasCenter(state).y - 100);
  }
}

function drawTarAnimation(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.tarPuddle.active || state.tarPuddle.radius <= 0) return;

  ctx.save();
  ctx.fillStyle = VISUAL_CONFIG.colors.pentagonFill;
  ctx.shadowColor = VISUAL_CONFIG.colors.pentagonGlow; // V6 visuals: glow pentagono
  ctx.shadowBlur = VISUAL_CONFIG.glowStrengthPentagon;
  ctx.beginPath();

  if (!state.tarPuddle.morphing || state.tarPuddle.morphProgress === 0) {
    ctx.arc(canvasCenter(state).x, canvasCenter(state).y, state.tarPuddle.radius, 0, Math.PI * 2);
  } else {
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

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(canvasCenter(state).x, canvasCenter(state).y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoldStar(ctx: CanvasRenderingContext2D, state: InternalState) {
  if (!state.goldStar.active || state.goldStar.radius <= 0) return;

  ctx.save();
  ctx.fillStyle = VISUAL_CONFIG.colors.starFill;
  ctx.shadowColor = VISUAL_CONFIG.colors.starGlow; // V6 visuals: glow stella
  ctx.shadowBlur = VISUAL_CONFIG.glowStrengthStar;
  ctx.beginPath();

  if (!state.goldStar.morphing || state.goldStar.morphProgress === 0) {
    ctx.arc(canvasCenter(state).x, canvasCenter(state).y, state.goldStar.radius, 0, Math.PI * 2);
  } else {
    for (let i = 0; i < AXES * 2; i += 1) {
      const angle = -Math.PI / 2 + i * (Math.PI / AXES);
      const isOuter = i % 2 === 0;
      let radius: number;
      if (isOuter) {
        const pillarIndex = Math.floor(i / 2);
        radius = state.playerPillars[pillarIndex]?.targetRadius ?? state.goldStar.radius;
      } else {
        const pillarIndex = Math.floor(i / 2);
        const nextIndex = (pillarIndex + 1) % AXES;
        const avg =
          ((state.playerPillars[pillarIndex]?.targetRadius ?? state.goldStar.radius) +
            (state.playerPillars[nextIndex]?.targetRadius ?? state.goldStar.radius)) /
          2;
        radius = avg * 0.4;
      }
      const finalRadius = state.goldStar.radius + (radius - state.goldStar.radius) * state.goldStar.morphProgress;
      const x = canvasCenter(state).x + Math.cos(angle) * finalRadius;
      const y = canvasCenter(state).y + Math.sin(angle) * finalRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(canvasCenter(state).x, canvasCenter(state).y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function getStarVertices(state: InternalState) {
  const vertices = [];
  for (let i = 0; i < AXES * 2; i += 1) {
    const angle = -Math.PI / 2 + i * (Math.PI / AXES);
    const isOuter = i % 2 === 0;
    let radius: number;
    if (isOuter) {
      const pillarIndex = Math.floor(i / 2);
      radius = state.playerPillars[pillarIndex]?.targetRadius ?? state.goldStar.radius;
    } else {
      const pillarIndex = Math.floor(i / 2);
      const nextIndex = (pillarIndex + 1) % AXES;
      const avg =
        ((state.playerPillars[pillarIndex]?.targetRadius ?? state.goldStar.radius) +
          (state.playerPillars[nextIndex]?.targetRadius ?? state.goldStar.radius)) /
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

function updatePillars(state: InternalState) {
  state.enemyPillarAnimationDelay += 1;
  if (state.enemyPillarAnimationDelay % PILLAR_DELAY === 0 && state.currentEnemyPillarIndex < AXES) {
    const statValue = state.enemyStatValues[state.currentEnemyPillarIndex];
    const angle = -Math.PI / 2 + state.currentEnemyPillarIndex * ((2 * Math.PI) / AXES);
    const effectiveValue = MIN_BASE_VALUE + statValue;
    const progress = effectiveValue / (MAX_STAT + MIN_BASE_VALUE);
    const targetRadius = RADIUS * progress;
    state.enemyPillars.push({ angle, radius: 0, targetRadius, growing: true });
    state.tentacles.push({ angle, length: 0, targetLength: targetRadius, growing: true });
    spawnParticleBurst(state, angle, targetRadius, VISUAL_CONFIG.colors.particle, VISUAL_CONFIG.colors.particleSecondary);
    state.currentEnemyPillarIndex += 1;
  }

  state.enemyPillars.forEach((pillar) => {
    if (pillar.growing && pillar.radius < pillar.targetRadius) {
      pillar.radius += 6;
      if (pillar.radius >= pillar.targetRadius) {
        pillar.radius = pillar.targetRadius;
        pillar.growing = false;
      }
    }
  });

  state.tentacles.forEach((tentacle) => {
    if (tentacle.growing && tentacle.length < tentacle.targetLength) {
      tentacle.length += 6;
      if (tentacle.length >= tentacle.targetLength) {
        tentacle.length = tentacle.targetLength;
        tentacle.growing = false;
      }
    }
  });

  if (!state.playerAnimationStarted && state.tarPuddle.morphing && state.tarPuddle.morphProgress >= 1) {
    state.playerAnimationStarted = true;
  }

  if (state.playerAnimationStarted) {
    state.playerPillarAnimationDelay += 1;
    if (state.playerPillarAnimationDelay % PILLAR_DELAY === 0 && state.currentPlayerPillarIndex < AXES) {
      const statValue = state.playerStatValues[state.currentPlayerPillarIndex];
      const angle = -Math.PI / 2 + state.currentPlayerPillarIndex * ((2 * Math.PI) / AXES);
      const effectiveValue = MIN_BASE_VALUE + statValue;
      const progress = effectiveValue / (MAX_STAT + MIN_BASE_VALUE);
      const targetRadius = RADIUS * progress;
      state.playerPillars.push({ angle, radius: 0, targetRadius, growing: true });
      spawnParticleBurst(state, angle, targetRadius, VISUAL_CONFIG.colors.particleSecondary, VISUAL_CONFIG.colors.particle);
      state.currentPlayerPillarIndex += 1;
    }

    state.playerPillars.forEach((pillar) => {
      if (pillar.growing && pillar.radius < pillar.targetRadius) {
        pillar.radius += 6;
        if (pillar.radius >= pillar.targetRadius) {
          pillar.radius = pillar.targetRadius;
          pillar.growing = false;
        }
      }
    });
  }
}

function drawPillars(ctx: CanvasRenderingContext2D, state: InternalState) {
  state.enemyPillars.forEach((pillar) => {
    const dx = Math.cos(pillar.angle);
    const dy = Math.sin(pillar.angle);
    const px = canvasCenter(state).x + dx * pillar.radius;
    const py = canvasCenter(state).y + dy * pillar.radius;
    ctx.save();
    ctx.fillStyle = VISUAL_CONFIG.colors.enemyPillarFill;
    ctx.strokeStyle = VISUAL_CONFIG.colors.enemyPillarStroke;
    ctx.lineWidth = 2;
    ctx.shadowColor = VISUAL_CONFIG.colors.enemyPillarStroke; // V6 visuals: glow pilastri nemico
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  state.playerPillars.forEach((pillar) => {
    const dx = Math.cos(pillar.angle);
    const dy = Math.sin(pillar.angle);
    const px = canvasCenter(state).x + dx * pillar.radius;
    const py = canvasCenter(state).y + dy * pillar.radius;
    ctx.save();
    ctx.fillStyle = VISUAL_CONFIG.colors.playerPillarFill;
    ctx.strokeStyle = VISUAL_CONFIG.colors.playerPillarStroke;
    ctx.lineWidth = 2;
    ctx.shadowColor = VISUAL_CONFIG.colors.playerPillarStroke; // V6 visuals: glow pilastri player
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function spawnParticleBurst(state: InternalState, angle: number, targetRadius: number, primary: string, secondary: string) {
  const particles: Particle[] = [];
  const center = canvasCenter(state);
  const originX = center.x + Math.cos(angle) * targetRadius;
  const originY = center.y + Math.sin(angle) * targetRadius;
  for (let i = 0; i < VISUAL_CONFIG.particleCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(theta) * (Math.random() * 2 + 0.5),
      vy: Math.sin(theta) * (Math.random() * 2 + 0.5),
      radius: Math.random() * (VISUAL_CONFIG.particleSize / 2) + 1,
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
      particle.radius *= 0.98;
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
      ctx.shadowColor = particle.color; // V6 visuals: particelle glow
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  });
}
