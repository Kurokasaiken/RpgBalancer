import React, { useEffect, useMemo, useRef, useState } from 'react';

interface StatRow {
  name: string;
  questValue: number;
  heroValue: number;
}

type OutcomeZone = 'safe' | 'injury' | 'death';
type OutcomeResult = 'success' | 'fail';

interface LastOutcome {
  zone: OutcomeZone;
  result: OutcomeResult;
}

interface Point {
  x: number;
  y: number;
}

const MAX_STATS = 6;
const MIN_STATS = 1;

const CANVAS_SIZE = 360;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
const RADIUS = 120;

interface PinballOptions {
  shotPower: number;
  spinBias: number;
}

// ─── Star Polygon Options ─────────────────────────────────────────────────
interface PolygonOptions {
  baseRatio: number;    // 0-0.5: minimum radius as fraction of RADIUS
  valleyDepth: number;  // 0-0.5: how deep valleys go between peaks
  curveTension: number; // 0-1: smoothness of curves (0=sharp, 1=very smooth)
  numPoints?: number;   // Fixed number of points (default 5)
}

const DEFAULT_POLYGON_OPTIONS: PolygonOptions = {
  baseRatio: 0.2,
  valleyDepth: 0.85,    // Default VERY sharp (Triangle/Needle look)
  curveTension: 0.15,
  numPoints: 5,
};

/**
 * Build a fixed N-point star polygon (Sheriff Star style).
 * - Always 5 peaks.
 * - Inactive peaks (value 0) retreat to the inner valley radius.
 * - Active peaks extend from valley radius to max radius.
 * - Valley Depth 100% creates a very thin, sharp star.
 */
function buildStarPolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: PolygonOptions = DEFAULT_POLYGON_OPTIONS,
): Point[] {
  const { valleyDepth, numPoints = 5 } = options;
  const points: Point[] = [];

  // Angle step
  const peakAngleStep = (2 * Math.PI) / numPoints;

  // Refined Valley Radius Calculation
  // 0% slider => Full Radius (Circle-like)
  // 100% slider => 0 Radius (Center point)
  const valleyRadius = RADIUS * (1.0 - valleyDepth);

  for (let i = 0; i < numPoints; i++) {
    // ── Peak point ──
    let value = 0;
    if (i < stats.length) {
      const stat = stats[i];
      const raw = Number(stat[key]);
      value = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
    }

    // Peak Radius
    // If value is 0, peak is physically AT the valley radius.
    const peakRadius = valleyRadius + (value / 100) * (RADIUS - valleyRadius);

    const peakAngle = -Math.PI / 2 + i * peakAngleStep;

    points.push({
      x: CENTER_X + peakRadius * Math.cos(peakAngle),
      y: CENTER_Y + peakRadius * Math.sin(peakAngle),
    });

    // ── Valley point ──
    // Valley is always at valleyRadius for consistent star shape
    // (Fixed valley radius makes a more consistent "Sheriff" star.)

    const valleyAngle = peakAngle + peakAngleStep / 2;

    points.push({
      x: CENTER_X + valleyRadius * Math.cos(valleyAngle),
      y: CENTER_Y + valleyRadius * Math.sin(valleyAngle),
    });
  }

  return points;
}

// Legacy buildPolygonPoints removed - using buildStarPolygon instead

/**
 * Builds points for a single stat triangle (Tip, BaseCCW, BaseCW)
 * New Logic: Base is anchored at CENTER (0,0) and expands perpendicularly.
 * @param index - stat index
 * @param total - total stats
 * @param widthFactor - 0..1 from slider. 1.0 = +/- 50px width? Or 100?
 *                      User said "If 1, then 1 pixel left/right".
 *                      Let's map slider 0..100 -> 0..100 pixels half-width.
 */
function getTrianglePoints(index: number, total: number, widthFactor: number) {
  const angleStep = (2 * Math.PI) / total;
  const tipAngle = -Math.PI / 2 + index * angleStep;

  const tipRadius = RADIUS * 0.95;

  // Slider is 0-100. widthFactor is 0..1.
  // User: "If 1 (slider?), 1 pixel left/right".
  // Let's assume max width (slider=100) is reasonable, e.g. 100px half-width.
  const halfWidth = widthFactor * 100; // 0 to 100px

  const tip: Point = {
    x: CENTER_X + tipRadius * Math.cos(tipAngle),
    y: CENTER_Y + tipRadius * Math.sin(tipAngle),
  };

  // Perpendicular angle for base expansion
  // If Tip is UP (-90deg), Perp is Right (0deg)
  const perpAngle = tipAngle + Math.PI / 2;

  const dx = Math.cos(perpAngle) * halfWidth;
  const dy = Math.sin(perpAngle) * halfWidth;

  // Base is centered at (CENTER_X, CENTER_Y)
  // CW side (Right of tip) vs CCW side (Left of tip)
  // If Tip is Up, CW is Right.

  return {
    tip,
    baseCCW: { // "Left"
      x: CENTER_X - dx,
      y: CENTER_Y - dy,
    },
    baseCW: { // "Right"
      x: CENTER_X + dx,
      y: CENTER_Y + dy,
    }
  };
}

/**
 * Build a pure Triangle polygon for single-stat cases.
 * Uses getTrianglePoints for consistency.
 */
function buildTriangle(
  stats: StatRow[],
  activeIndex: number,
  options: PolygonOptions
): Point[] {
  const pts = getTrianglePoints(activeIndex, stats.length, options.baseRatio);
  return [pts.tip, pts.baseCW, pts.baseCCW];
}

/**
 * Validates active stats and chooses the best shape.
 * - 1 Active Stat: Triangle
 * - 2-3 Active Stats: Stitched Triangles (Fan/Bowtie/Polygon)
 * - 4-5 Active Stats: Sheriff Star
 */
function buildAdaptivePolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: PolygonOptions
): Point[] {
  // Count active stats (value > 0)
  const activeStats = stats.map((s, i) => ({ val: Number(s[key]), index: i }))
    .filter(s => s.val > 0);

  const count = activeStats.length;

  if (count === 1) {
    // SINGLE STAT MODE -> TRIANGLE
    return buildTriangle(stats, activeStats[0].index, options);
  }

  if (count === 2 || count === 3) {
    // 2-3 STATS -> STITCHED GEOMETRY
    // Connect Tip -> CW Base -> Next CCW Base -> Next Tip...
    const points: Point[] = [];
    const total = stats.length;

    activeStats.forEach((stat, i) => {
      const nextStat = activeStats[(i + 1) % count];

      const currentTri = getTrianglePoints(stat.index, total, options.baseRatio);
      const nextTri = getTrianglePoints(nextStat.index, total, options.baseRatio);

      points.push(currentTri.tip);
      points.push(currentTri.baseCW);
      // The line segment from currentTri.baseCW to nextTri.baseCCW forms the connection
      // (Straight line, Touch, or Rhombus side)
      points.push(nextTri.baseCCW);
    });

    return points;
  }

  // DEFAULT MODE (4-5 Stats) -> STAR
  return buildStarPolygon(stats, key, options);
}



function polygonToPointsAttr(points: Point[]): string {
  if (points.length === 0) return '';
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function polygonToPathD(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  return `M ${first.x} ${first.y} ${segments} Z`;
}

/**
 * Convert polygon points to smooth SVG path using quadratic Bézier curves.
 * @param points - Array of polygon vertices
 * @param tension - 0 = straight lines, 1 = very smooth curves
 */
function polygonToSmoothPathD(points: Point[], tension: number = 0.3): string {
  if (points.length < 3) return polygonToPathD(points);
  if (tension <= 0) return polygonToPathD(points);

  const n = points.length;
  const parts: string[] = [];

  // Start at first point
  parts.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 0; i < n; i++) {
    const current = points[i];
    const next = points[(i + 1) % n];

    // Control point: interpolate between midpoint and current point based on tension
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    // Use quadratic bezier with control point pulled toward the current point
    const cpX = current.x + (midX - current.x) * (1 - tension);
    const cpY = current.y + (midY - current.y) * (1 - tension);

    // Draw quadratic curve to next point via control point
    parts.push(`Q ${cpX} ${cpY} ${next.x} ${next.y}`);
  }

  return parts.join(' ');
}


function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

function clampPercentage(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function getQuestEdges(points: Point[]): { a: Point; b: Point }[] {
  if (points.length < 2) return [];
  return points.map((point, index) => ({
    a: point,
    b: points[(index + 1) % points.length],
  }));
}

function getInwardNormal(edge: { a: Point; b: Point }): { x: number; y: number } {
  const ex = edge.b.x - edge.a.x;
  const ey = edge.b.y - edge.a.y;
  // For CCW polygons, outward normal is (ey, -ex). Inward is (-ey, ex).
  let nx = -ey;
  let ny = ex;
  const length = Math.hypot(nx, ny) || 1;
  nx /= length;
  ny /= length;
  const centerVectorX = CENTER_X - edge.a.x;
  const centerVectorY = CENTER_Y - edge.a.y;
  if (nx * centerVectorX + ny * centerVectorY < 0) {
    // Normal pointing outward, flip it.
    nx *= -1;
    ny *= -1;
  }
  return { x: nx, y: ny };
}

function segmentsIntersect(
  p1: Point,
  p2: Point,
  q1: Point,
  q2: Point,
): { t: number; point: Point } | null {
  const rdx = p2.x - p1.x;
  const rdy = p2.y - p1.y;
  const sdx = q2.x - q1.x;
  const sdy = q2.y - q1.y;
  const denom = rdx * sdy - rdy * sdx;
  if (Math.abs(denom) < 1e-6) return null;
  const t = ((q1.x - p1.x) * sdy - (q1.y - p1.y) * sdx) / denom;
  const u = ((q1.x - p1.x) * rdy - (q1.y - p1.y) * rdx) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      t,
      point: { x: p1.x + t * rdx, y: p1.y + t * rdy },
    };
  }
  return null;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // convert to 32bit int
  }
  return hash >>> 0;
}

function createSeededRng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (1664525 * state + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function simulatePinballPath(target: Point, polygon: Point[], options: PinballOptions): Point[] {
  const path: Point[] = [];
  if (polygon.length < 3) {
    return [target];
  }
  const edges = getQuestEdges(polygon);
  // Physics Timing Tuning
  // 180 steps @ 60fps ~= 3 seconds max duration
  const maxSteps = 180;

  const clampedShot = Math.max(0, Math.min(1, options.shotPower));
  const clampedSpin = Math.max(-1, Math.min(1, options.spinBias));

  // Very High Energy Launch
  const baseSpeed = 30 + clampedShot * 40;
  const spinStrength = 0.02 * clampedSpin;
  const restitution = 0.92;

  const minSpeedThreshold = 1.0;
  const maxSpeed = 70;

  let pos: Point = { x: CENTER_X, y: CENTER_Y };
  const initialTheta = Math.random() * Math.PI * 2;
  let vel = {
    x: Math.cos(initialTheta) * baseSpeed,
    y: Math.sin(initialTheta) * baseSpeed,
  };

  path.push({ ...pos });

  for (let step = 0; step < maxSteps; step += 1) {
    const speed = Math.hypot(vel.x, vel.y);

    // ── EXPONENTIAL BRAKING ──
    // Fast for 1s (60 steps), then progressive braking
    const progress = step / maxSteps;
    let friction = 0.995;

    if (progress > 0.3) {
      // Brake phase starts earlier to ensure stop
      const brake = (progress - 0.3) / 0.7; // 0..1
      // Triple friction increase as requested (was 0.25)
      friction = 0.995 - (brake * brake * 0.75);
    }

    // Apply friction
    vel.x *= friction;
    vel.y *= friction;

    // Apply Spin
    if (spinStrength !== 0) {
      const spinForceX = -vel.y * spinStrength;
      const spinForceY = vel.x * spinStrength;
      vel.x += spinForceX;
      vel.y += spinForceY;
    }

    // Clamp speed
    const currentSpeed = Math.hypot(vel.x, vel.y);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      vel.x *= scale;
      vel.y *= scale;
    }

    // Movement step
    const nextPos = { x: pos.x + vel.x, y: pos.y + vel.y };

    // Collision detection
    let collided = false;
    let collisionPoint: Point | null = null;
    let collisionNormal: { x: number; y: number } | null = null;

    for (const edge of edges) {
      const intersection = segmentsIntersect(pos, nextPos, edge.a, edge.b);
      if (intersection) {
        collided = true;
        collisionPoint = intersection.point;
        collisionNormal = getInwardNormal(edge);
        break;
      }
    }

    if (collided && collisionPoint && collisionNormal) {
      // Bounce response
      pos = {
        x: collisionPoint.x + collisionNormal.x * 0.8,
        y: collisionPoint.y + collisionNormal.y * 0.8,
      };

      const dot = vel.x * collisionNormal.x + vel.y * collisionNormal.y;
      vel = {
        x: vel.x - (1 + restitution) * dot * collisionNormal.x,
        y: vel.y - (1 + restitution) * dot * collisionNormal.y,
      };

      // Energy loss on wall
      vel.x *= 0.9;
      vel.y *= 0.9;
    } else {
      // No collision, verify sticking to polygon
      pos = nextPos;

      if (!pointInPolygon(pos, polygon)) {
        // Emergency snap to center if leaked
        const angle = Math.atan2(pos.y - CENTER_Y, pos.x - CENTER_X);
        const radius = Math.min(RADIUS, Math.hypot(pos.x - CENTER_X, pos.y - CENTER_Y));
        pos = {
          x: CENTER_X + radius * Math.cos(angle),
          y: CENTER_Y + radius * Math.sin(angle),
        };
        vel.x *= -0.5;
        vel.y *= -0.5;
      }
    }

    path.push({ ...pos });

    // Stop condition
    if (currentSpeed < minSpeedThreshold) {
      break;
    }
  }

  // Ensure last point is recorded
  if (path[path.length - 1] !== pos) {
    path.push(pos);
  }

  return path;
}

export const SkillCheckPreviewPage: React.FC = () => {
  const [stats, setStats] = useState<StatRow[]>([
    { name: 'Combat', questValue: 70, heroValue: 60 },
    { name: 'Vigor', questValue: 0, heroValue: 55 },
    { name: 'Agility', questValue: 0, heroValue: 50 },
    { name: 'Intellect', questValue: 0, heroValue: 65 },
    { name: 'Presence', questValue: 0, heroValue: 45 },
  ]);
  const [injuryPct, setInjuryPct] = useState(10);
  const [deathPct, setDeathPct] = useState(5);
  const [shotPower, setShotPower] = useState(0.8); // 0..1 slider
  const [spinBias, setSpinBias] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<LastOutcome | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [ballPosition, setBallPosition] = useState<Point | null>(null);
  const [heroStrokeProgress, setHeroStrokeProgress] = useState(1);
  const [timer, setTimer] = useState<string>("0.00s");

  // ─── Polygon Tuning State ───────────────────────────────────────────────
  const [valleyDepth, setValleyDepth] = useState(0.5);  // 0-1: Unified control
  const [curveTension, setCurveTension] = useState(0.3); // 0-1: curve smoothness
  const [heroPrecision, setHeroPrecision] = useState(0.2); // 0-0.6: Makes hero shape sharper/thinner

  // ─── Monte Carlo / Ghost State ──────────────────────────────────────────
  const ballAnimFrameRef = useRef<number | null>(null);

  // New derived state for UI
  const activeCount = stats.filter(s => s.questValue > 0).length;

  const safePct = useMemo(() => {
    const total = clampPercentage(injuryPct) + clampPercentage(deathPct);
    return clampPercentage(100 - total);
  }, [injuryPct, deathPct]);

  // Use star polygon with valleys instead of simple polygon
  const questPolygon = useMemo(() => {
    return buildAdaptivePolygon(stats, 'questValue', {
      baseRatio: (1 - valleyDepth), // Inverse: Low Valley = High Width/Radius
      valleyDepth,
      curveTension,
      numPoints: 5,
    });
  }, [stats, valleyDepth, curveTension]);

  const heroPolygon = useMemo(() => {
    // Effective valley depth for hero is base + precision offset.
    // Higher precision = Deeper valleys = Thinner star = Harder to hit between axes
    const heroValley = Math.min(0.95, valleyDepth + heroPrecision * (1 - valleyDepth));

    return buildAdaptivePolygon(stats, 'heroValue', {
      baseRatio: (1 - heroValley), // Also affects width logic (thinner base)
      valleyDepth: heroValley,
      curveTension,
      numPoints: 5,
    });
  }, [stats, valleyDepth, heroPrecision, curveTension]);



  // ... (rest of logic) ...

  const questPolygonAttr = useMemo(() => polygonToPointsAttr(questPolygon), [questPolygon]);
  const heroPolygonAttr = useMemo(() => polygonToPointsAttr(heroPolygon), [heroPolygon]);

  // Simple path (for fills and physics)
  const questPathD = useMemo(() => polygonToPathD(questPolygon), [questPolygon]);
  const heroPathD = useMemo(() => polygonToPathD(heroPolygon), [heroPolygon]);

  // Smooth path (for visual strokes when curveTension > 0)
  const questSmoothPathD = useMemo(
    () => polygonToSmoothPathD(questPolygon, curveTension),
    [questPolygon, curveTension],
  );
  const heroSmoothPathD = useMemo(
    () => polygonToSmoothPathD(heroPolygon, curveTension),
    [heroPolygon, curveTension],
  );


  const radii = useMemo(() => {
    if (questPolygon.length < 3) {
      return {
        safeRadius: 0,
        injuryInnerRadius: 0,
        injuryOuterRadius: 0,
        deathInnerRadius: 0,
        deathOuterRadius: 0,
      };
    }

    const safeBase = clampPercentage(safePct, 0, 100);
    const injuryBase = clampPercentage(injuryPct, 0, 100);
    const deathBase = clampPercentage(deathPct, 0, 100);
    let total = safeBase + injuryBase + deathBase;
    if (total <= 0) total = 1;
    const safeFraction = safeBase / total;
    const injuryFraction = injuryBase / total;

    const rngSeedSource = JSON.stringify({ stats, injuryPct, deathPct });
    const rng = createSeededRng(hashString(rngSeedSource));

    const sampleDistances: number[] = [];
    const sampleCount = 800;
    let attempts = 0;
    const maxAttempts = sampleCount * 10;

    while (sampleDistances.length < sampleCount && attempts < maxAttempts) {
      attempts += 1;
      const u = rng();
      const r = Math.sqrt(u) * RADIUS;
      const angle = rng() * Math.PI * 2;
      const x = CENTER_X + r * Math.cos(angle);
      const y = CENTER_Y + r * Math.sin(angle);
      const p = { x, y };
      if (pointInPolygon(p, questPolygon)) {
        const dx = x - CENTER_X;
        const dy = y - CENTER_Y;
        sampleDistances.push(Math.sqrt(dx * dx + dy * dy));
      }
    }

    if (sampleDistances.length === 0) {
      return {
        safeRadius: 0,
        injuryInnerRadius: 0,
        injuryOuterRadius: 0,
        deathInnerRadius: 0,
        deathOuterRadius: 0,
      };
    }

    sampleDistances.sort((a, b) => a - b);
    const n = sampleDistances.length;

    const safeIndex = Math.max(0, Math.min(n - 1, Math.floor(n * safeFraction) - 1));
    const injuryIndex = Math.max(
      safeIndex,
      Math.min(n - 1, Math.floor(n * (safeFraction + injuryFraction)) - 1),
    );
    const maxIndex = n - 1;

    const safeRadius = sampleDistances[safeIndex];
    const injuryOuterRadius = sampleDistances[injuryIndex];
    const deathOuterRadius = sampleDistances[maxIndex];

    return {
      safeRadius,
      injuryInnerRadius: safeRadius,
      injuryOuterRadius,
      deathInnerRadius: injuryOuterRadius,
      deathOuterRadius,
    };
  }, [questPolygon, safePct, injuryPct, deathPct, stats]);


  useEffect(() => {
    if (!heroPathD) {
      return;
    }

    let frame: number | null = null;
    const duration = 400;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const tRaw = Math.min(1, elapsed / duration);
      const t = tRaw * tRaw * (3 - 2 * tRaw);
      setHeroStrokeProgress(t);
      if (tRaw < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame((ts) => {
      startTime = ts;
      setHeroStrokeProgress(0);
      animate(ts);
    });

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [heroPathD]);

  useEffect(() => () => {
    // Cleanup ball animation on unmount
    if (ballAnimFrameRef.current !== null) {
      cancelAnimationFrame(ballAnimFrameRef.current);
    }
  }, []);

  // Removed handleStatCountChange

  const handleStatChange = (index: number, field: keyof StatRow, raw: string) => {
    setStats((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      if (field === 'name') {
        next[index] = { ...current, name: raw };
        return next;
      }
      const parsed = raw === '' ? 0 : Number(raw);
      const clamped = clampPercentage(parsed);
      next[index] = { ...current, [field]: clamped } as StatRow;
      return next;
    });
  };

  const handleThrow = () => {
    if (questPolygon.length < 3) return;

    const maxAttempts = 200;
    let chosen: Point | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const u = Math.random();
      const r = Math.sqrt(u) * RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const x = CENTER_X + r * Math.cos(angle);
      const y = CENTER_Y + r * Math.sin(angle);
      const candidate = { x, y };
      if (pointInPolygon(candidate, questPolygon)) {
        chosen = candidate;
        break;
      }
    }

    if (!chosen) {
      chosen = { x: CENTER_X, y: CENTER_Y };
    }

    const dx = chosen.x - CENTER_X;
    const dy = chosen.y - CENTER_Y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let zone: OutcomeZone = 'safe';
    if (distance > radii.deathInnerRadius) {
      zone = 'death';
    } else if (distance > radii.injuryInnerRadius) {
      zone = 'injury';
    }

    const success = pointInPolygon(chosen, heroPolygon);
    const result: OutcomeResult = success ? 'success' : 'fail';

    const label = `Roll: ${result.toUpperCase()} + ${zone.toUpperCase()}`;

    setLastOutcome({ zone, result });
    setLog((prev) => [label, ...prev].slice(0, 12));

    // Animate ball with pinball-style trajectory simulated via simple physics in Q.
    if (ballAnimFrameRef.current !== null) {
      cancelAnimationFrame(ballAnimFrameRef.current);
      ballAnimFrameRef.current = null;
    }

    // 1. Calculate path
    const path = simulatePinballPath(
      { x: CENTER_X, y: CENTER_Y }, // Not really used as target for now? target arg is unused in physics?
      questPolygon,
      { shotPower, spinBias }
    );

    // Debug Logging for Verification
    console.log("--- DEBUG: Handle Throw ---");
    console.log("Physics Path Steps:", path.length);
    console.log("Estimated Duration (60fps):", (path.length / 60).toFixed(2) + "s");
    console.log("Polygon Points:", questPolygon.length);
    if (questPolygon.length > 0) {
      console.log("Poly P0:", questPolygon[0]);
      console.log("Poly P1:", questPolygon[1]);
    }

    // 2. Animate
    const segmentCount = path.length - 1;
    if (segmentCount <= 0) {
      setBallPosition(chosen);
      return;
    }

    // Tuning for ~5s total duration.
    // "Slow down substantially after 2 seconds".
    // 180 steps total.
    // Phase 1 (Fast): First ~50% (90 steps).
    //    90 steps * 20ms = 1800ms (~1.8s). Close to 2s.
    // Phase 2 (Braking): Remaining ~50% (90 steps).
    //    We want this to take ~3.2s.
    //    Avg duration needed = 3200 / 90 = ~35ms.
    //    Base is 20ms. Mean Extra needed = 15ms.
    //    Quadratic ramp means Mean Extra = Peak Extra / 3.
    //    Peak Extra = 15 * 3 = 45ms.
    //    Let's use 50ms to be safe and "substantial".

    const baseDuration = 20; // ms per segment

    const segmentDurations = path.slice(0, -1).map((_, idx) => {
      const p = idx / segmentCount;

      let extra = 0;
      // Start braking halfway through
      if (p > 0.5) {
        const brakeP = (p - 0.5) / 0.5; // 0..1 in braking zone
        extra = brakeP * brakeP * 55;   // Max extra 55ms
      }

      return baseDuration + extra;
    });

    // Calculate expected total for debug
    const totalDuration = segmentDurations.reduce((a, b) => a + b, 0);
    console.log("Estimated Animation Duration:", (totalDuration / 1000).toFixed(2) + "s");

    let segmentIndex = 0;
    let segmentStartTime: number | null = null;
    let animationStartTime: number | null = null;

    const animateBall = (timestamp: number) => {
      if (animationStartTime === null) animationStartTime = timestamp;

      // Update Timer
      const totalElapsed = timestamp - animationStartTime;
      setTimer((totalElapsed / 1000).toFixed(2) + "s");

      if (segmentIndex >= segmentCount) {
        ballAnimFrameRef.current = null;
        return;
      }

      if (segmentStartTime === null) segmentStartTime = timestamp;
      const localElapsed = timestamp - segmentStartTime;
      const duration = segmentDurations[segmentIndex];
      const tRaw = Math.min(1, localElapsed / duration);
      const t = 1 - (1 - tRaw) * (1 - tRaw); // easeOutQuad for micro-segment interaction

      const from = path[segmentIndex];
      const to = path[segmentIndex + 1];
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      setBallPosition({ x, y });

      if (tRaw < 1) {
        ballAnimFrameRef.current = requestAnimationFrame(animateBall);
      } else {
        segmentIndex += 1;
        segmentStartTime = null;
        ballAnimFrameRef.current = requestAnimationFrame(animateBall);
      }
    };

    setBallPosition(path[0]);
    ballAnimFrameRef.current = requestAnimationFrame(animateBall);
  };

  const outcomeLabel = useMemo(() => {
    if (!lastOutcome) return 'Nessun tiro effettuato.';
    const { result, zone } = lastOutcome;
    const resultLabel = result === 'success' ? 'SUCCESSO' : 'FALLIMENTO';
    let zoneLabel = '';
    if (zone === 'safe') zoneLabel = 'SAFE';
    if (zone === 'injury') zoneLabel = 'INJURY';
    if (zone === 'death') zoneLabel = 'DEATH';
    return `${resultLabel} + ${zoneLabel}`;
  }, [lastOutcome]);

  return (
    <div className="p-3 md:p-4 text-ivory">
      <h1 className="text-lg md:text-xl font-cinzel tracking-[0.2em] uppercase mb-2">Skill Check Preview Lab</h1>
      <p className="text-[11px] text-slate-300 mb-3 max-w-2xl">
        Giocattolo per visualizzare lo skill check stile Dispatch. Configura numero di stat, profilo quest/PG,
        percentuali di injury/death e lancia una pallina che rimbalza dentro l&apos;area della quest.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── LEFT COLUMN: CONTROLS ─── */}
        <div className="default-card p-3 space-y-4">

          {/* Stats Config (Checkboxes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wide">Active Stats ({activeCount})</h3>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 bg-slate-900/50 p-2 rounded border border-slate-800/50">
              {stats.map((stat, index) => {
                const isActive = stat.questValue > 0;
                return (
                  <div key={index} className="flex items-center gap-2 p-1.5 bg-slate-800/80 rounded border border-slate-700/50">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => {
                        const newValue = e.target.checked ? 60 : 0;
                        handleStatChange(index, 'questValue', String(newValue));
                      }}
                      className="cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={stat.name}
                        onChange={(e) => handleStatChange(index, 'name', e.target.value)}
                        className="w-full bg-transparent text-[11px] font-semibold text-cyan-300 focus:outline-none"
                      />
                    </div>
                    {/* Value Input (only if active) */}
                    <div className="w-12 text-right transition-opacity {isActive ? 'opacity-100' : 'opacity-30'}">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={stat.questValue}
                        disabled={!isActive}
                        onChange={(e) => handleStatChange(index, 'questValue', e.target.value)}
                        className="w-full bg-transparent text-right text-[11px] text-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Settings (Injury/Death) */}
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <label className="block font-semibold mb-0.5 text-slate-400">Injury %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={injuryPct}
                onChange={(e) => setInjuryPct(clampPercentage(Number(e.target.value) || 0))}
                className="w-full px-2 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-0.5 text-slate-400">Death %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={deathPct}
                onChange={(e) => setDeathPct(clampPercentage(Number(e.target.value) || 0))}
                className="w-full px-2 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[11px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-0.5 text-slate-400">Safe %</label>
              <div className="px-2 py-0.5 bg-slate-900 border border-slate rounded text-emerald-300 text-[11px] h-[26px] flex items-center">
                {safePct}%
              </div>
            </div>
          </div>

          {/* Physics Tuning */}
          <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800 pt-3">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold uppercase tracking-[0.12em] text-slate-300">Shot Power</span>
                <span className="text-slate-400">{Math.round(shotPower * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(shotPower * 100)}
                onChange={(e) => setShotPower(Number(e.target.value) / 100)}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold uppercase tracking-[0.12em] text-slate-300">Spin Bias</span>
                <span className="text-slate-400">{spinBias >= 0 ? '+' : ''}{spinBias.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={Math.round(spinBias * 100)}
                onChange={(e) => setSpinBias(Number(e.target.value) / 100)}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Polygon Tuning Section */}
          <div className="text-[11px] mt-3 border-t border-cyan-800/40 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400 mb-2">⭐ Polygon Shape</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-slate-300">Forma</span>
                  <span className="text-slate-400">{Math.round(valleyDepth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(valleyDepth * 100)}
                  onChange={(e) => setValleyDepth(Number(e.target.value) / 100)}
                  className="w-full accent-cyan-500"
                />
                <div className="text-[9px] text-slate-500 mt-0.5">Tutti i poligoni</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-emerald-300">Precisione</span>
                  <span className="text-slate-400">+{Math.round(heroPrecision * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(heroPrecision * 100)}
                  onChange={(e) => setHeroPrecision(Number(e.target.value) / 100)}
                  className="w-full accent-emerald-500"
                />
                <div className="text-[9px] text-slate-500 mt-0.5">Stringe l'Eroe</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-slate-300">Curve</span>
                  <span className="text-slate-400">{Math.round(curveTension * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(curveTension * 100)}
                  onChange={(e) => setCurveTension(Number(e.target.value) / 100)}
                  className="w-full accent-cyan-500"
                />
                <div className="text-[9px] text-slate-500 mt-0.5">Arrotondamento</div>
              </div>
            </div>
          </div>



          {/* ... controls ... */}

          <div className="pt-2 flex justify-between items-center">

            <div className="flex items-center">
              <button
                type="button"
                onClick={handleThrow}
                className="px-4 py-2 rounded-full border border-emerald-400/70 bg-emerald-500/10 text-[11px] uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-500/20 active:scale-95 transition-all"
              >
                Lancia pallina
              </button>

            </div>
          </div>


          {/* Ghost Stats Panel */}
        </div>

        {/* ─── RIGHT COLUMN: PREVIEW ─── */}
        <div className="default-card p-3 space-y-3 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Visuale Skill Check</span>
            {/* Mini legend or status could go here */}
          </div>

          <div className="relative">
            <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="bg-slate-950/80 rounded-xl border border-slate-800 shadow-2xl">
              <defs>
                <clipPath id="quest-clip">
                  <polygon points={questPolygonAttr} />
                </clipPath>
              </defs>

              {/* Axes/Grid */}
              <line x1={CENTER_X} y1={0} x2={CENTER_X} y2={CANVAS_SIZE} stroke="rgba(148,163,184,0.1)" strokeWidth={1} />
              <line x1={0} y1={CENTER_Y} x2={CANVAS_SIZE} y2={CENTER_Y} stroke="rgba(148,163,184,0.1)" strokeWidth={1} />


              {/* Fixed Background Axes (Radial Lines) */}
              {stats.map((_, idx) => {
                const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / stats.length;
                const x2 = CENTER_X + RADIUS * Math.cos(angle);
                const y2 = CENTER_Y + RADIUS * Math.sin(angle);
                return (
                  <line
                    key={`axis-bg-${idx}`}
                    x1={CENTER_X}
                    y1={CENTER_Y}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(148,163,184,0.15)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Rings clipped to Q */}
              <g clipPath="url(#quest-clip)">
                {/* Injury ring */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={Math.max(0, RADIUS * ((safePct + injuryPct) / 100))}
                  className="fill-none stroke-yellow-500/30"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                />
                {/* Safe ring */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={Math.max(0, RADIUS * (safePct / 100))}
                  className="fill-none stroke-emerald-500/30"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                />
              </g>

              {/* Quest polygon (transparent fill) */}
              <polygon points={questPolygonAttr} fill="rgba(56,189,248,0.08)" stroke="none" />
              {/* ... defs, axes ... */}


              {/* ... Rings, Polygons, Ball ... */}


              {/* Quest Polygon Stroke */}
              <path
                d={questSmoothPathD}
                fill="none"
                stroke="rgb(34, 211, 238)"
                strokeWidth="2"
                className="drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
              />

              {/* Hero polygon Stroke (No Fill) */}
              <path
                d={heroSmoothPathD}
                fill="none"
                stroke="rgba(52,211,153,0.95)"
                strokeWidth={1.5}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - heroStrokeProgress}
              />

              {/* Fixed Stat Labels */}
              {stats.map((stat, idx) => {
                const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / stats.length;
                const distFactor = 1.15;
                const labelX = CENTER_X + RADIUS * Math.cos(angle) * distFactor;
                const labelY = CENTER_Y + RADIUS * Math.sin(angle) * distFactor;
                const isActive = stat.questValue > 0;

                return (
                  <text
                    key={`lbl-${idx}`}
                    x={labelX}
                    y={labelY}
                    className={`text-[9px] font-bold ${isActive ? 'fill-slate-200' : 'fill-slate-600'}`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {stat.name}
                  </text>
                );
              })}

              {/* Ball */}
              {ballPosition && (
                <circle cx={ballPosition.x} cy={ballPosition.y} r={5} fill="#f97316" stroke="#fde68a" strokeWidth={1} className="drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
              )}
            </svg>
          </div >

          <div className="w-full text-center mt-2 p-2 bg-slate-900/50 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Risultato</div>
            <div className="flex justify-between items-center px-4">
              <div className="text-sm font-bold text-slate-100">{outcomeLabel || '-'}</div>
              <div className="font-mono text-xs text-cyan-400">{timer}</div>
            </div>
          </div>

          {/* Log */}
          {
            log.length > 0 && (
              <div className="w-full text-[10px] text-slate-500 font-mono bg-black/20 p-2 rounded max-h-20 overflow-y-auto">
                {log.map((entry, idx) => (
                  <div key={idx} className="mb-0.5 border-b border-slate-800/30 pb-0.5 last:border-0">{entry}</div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default SkillCheckPreviewPage;
