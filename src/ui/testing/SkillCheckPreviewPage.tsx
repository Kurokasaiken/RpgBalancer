import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';

interface StatRow {
  id: string;
  name: string;
  questValue: number;
  heroValue: number;
  isDetrimental: boolean;
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

const CANVAS_SIZE = 300;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
const RADIUS = 120;
const ALT_CARD_WIDTH = 240;
const ALT_CARD_HEIGHT = 220;
const ALT_CARD_CENTER = { x: ALT_CARD_WIDTH / 2, y: ALT_CARD_HEIGHT / 2 };
const ALT_CARD_SCALE = (Math.min(ALT_CARD_WIDTH, ALT_CARD_HEIGHT) * 0.42) / RADIUS;

type AltStructure = 'solo' | 'dual' | 'triple' | 'quattro' | 'epic';

interface SkinGeometry {
  questBase: Point[];
  heroBase: Point[];
  questCard: Point[];
  heroCard: Point[];
  questCardAttr: string;
  questCardPath: string;
  questCardSmoothPath: string;
  heroCardPath: string;
  heroCardSmoothPath: string;
  projectToCard: (point: Point) => Point;
  selectedStats: StatRow[];
  maxRadius: number;
}

interface AltVisualSkin {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  structure: AltStructure;
  statCount: number;
  accent: string;
  style: 'triangle' | 'flame' | 'drop' | 'column' | 'diamond' | 'lens' | 'petal' | 'bridge' | 'soft-triangle' | 'triskel' | 'tri-flower' | 'poker' | 'wind-rose' | 'elastic' | 'pentagon' | 'star' | 'pentaflower';
}

const ALT_VISUAL_SKINS: AltVisualSkin[] = [
  {
    id: 'solo-triangle',
    title: 'Linea Triangolo',
    subtitle: '1 Stat · Prova lineare',
    description: 'Triangolo verticale che cresce con il valore.',
    structure: 'solo',
    statCount: 1,
    accent: 'from-cyan-400/30 to-blue-500/20',
    style: 'triangle',
  },
  {
    id: 'solo-flame',
    title: 'Fiamma Radiale',
    subtitle: '1 Stat · Skin fiamma',
    description: 'Colpo di calore che pulsa verso l’alto.',
    structure: 'solo',
    statCount: 1,
    accent: 'from-amber-400/30 to-rose-500/20',
    style: 'flame',
  },
  {
    id: 'solo-drop',
    title: 'Goccia Prisma',
    subtitle: '1 Stat · Skin goccia',
    description: 'Forma simmetrica ancorata alla base.',
    structure: 'solo',
    statCount: 1,
    accent: 'from-sky-400/30 to-emerald-400/20',
    style: 'drop',
  },
  {
    id: 'solo-column',
    title: 'Colonna Dorica',
    subtitle: '1 Stat · Skin colonna',
    description: 'Colonna geometrica che si estende in altezza.',
    structure: 'solo',
    statCount: 1,
    accent: 'from-slate-200/20 to-slate-600/20',
    style: 'column',
  },
  {
    id: 'dual-diamond',
    title: 'Rombo Equilibrio',
    subtitle: '2 Stat · Equilibrio',
    description: 'Rombo che visualizza immediatamente lo sbilancio.',
    structure: 'dual',
    statCount: 2,
    accent: 'from-emerald-400/30 to-cyan-500/20',
    style: 'diamond',
  },
  {
    id: 'dual-lens',
    title: 'Lente Binaria',
    subtitle: '2 Stat · Intersezione',
    description: 'Intersezione morbida di due archi contrapposti.',
    structure: 'dual',
    statCount: 2,
    accent: 'from-indigo-400/30 to-fuchsia-400/20',
    style: 'lens',
  },
  {
    id: 'dual-petal',
    title: 'Petali Gemelli',
    subtitle: '2 Stat · Petali',
    description: 'Petali contrapposti che indicano la direzione di forza.',
    structure: 'dual',
    statCount: 2,
    accent: 'from-rose-400/30 to-amber-400/20',
    style: 'petal',
  },
  {
    id: 'dual-bridge',
    title: 'Ponte Instabile',
    subtitle: '2 Stat · Ponte',
    description: 'Deck centrale che mostra la tenuta del ponte.',
    structure: 'dual',
    statCount: 2,
    accent: 'from-slate-400/30 to-slate-700/20',
    style: 'bridge',
  },
  {
    id: 'triple-soft',
    title: 'Triangolo Morbido',
    subtitle: '3 Stat · Superficie continua',
    description: 'Triangolo smussato per prove di controllo.',
    structure: 'triple',
    statCount: 3,
    accent: 'from-cyan-400/30 to-emerald-400/20',
    style: 'soft-triangle',
  },
  {
    id: 'triple-triskel',
    title: 'Triskel Vector',
    subtitle: '3 Stat · Triskel',
    description: 'Tre bracci che convergono sul centro.',
    structure: 'triple',
    statCount: 3,
    accent: 'from-violet-400/30 to-purple-400/20',
    style: 'triskel',
  },
  {
    id: 'triple-flower',
    title: 'Fiore a 3 Petali',
    subtitle: '3 Stat · Fiore',
    description: 'Petali arrotondati che mostrano armonie o gap.',
    structure: 'triple',
    statCount: 3,
    accent: 'from-rose-400/30 to-sky-400/20',
    style: 'tri-flower',
  },
  {
    id: 'quattro-flower',
    title: 'Fiore Poker',
    subtitle: '4 Stat · Petali',
    description: 'Fiore ispirato ai semi del poker.',
    structure: 'quattro',
    statCount: 4,
    accent: 'from-teal-400/30 to-cyan-500/20',
    style: 'poker',
  },
  {
    id: 'quattro-rose',
    title: 'Rosa dei Venti',
    subtitle: '4 Stat · Bussola',
    description: 'Braccia cardinali protese verso l’esterno.',
    structure: 'quattro',
    statCount: 4,
    accent: 'from-blue-400/30 to-indigo-400/20',
    style: 'wind-rose',
  },
  {
    id: 'quattro-elastic',
    title: 'Quadrato Elastico',
    subtitle: '4 Stat · Contenitore',
    description: 'Quadrato che si deforma lungo gli assi.',
    structure: 'quattro',
    statCount: 4,
    accent: 'from-amber-400/30 to-rose-400/20',
    style: 'elastic',
  },
  {
    id: 'epic-pentagon',
    title: 'Pentagono Epico',
    subtitle: '5 Stat · Poligono',
    description: 'Poligono regolare per prove epiche.',
    structure: 'epic',
    statCount: 5,
    accent: 'from-cyan-400/30 to-blue-500/20',
    style: 'pentagon',
  },
  {
    id: 'epic-star',
    title: 'Stella a 5 punte',
    subtitle: '5 Stat · Stella',
    description: 'Sheriff star con punte appuntite.',
    structure: 'epic',
    statCount: 5,
    accent: 'from-emerald-400/30 to-lime-400/20',
    style: 'star',
  },
  {
    id: 'epic-pentaflower',
    title: 'Pentafoglio',
    subtitle: '5 Stat · Fiore',
    description: 'Cinque petali armonici con nucleo centrale.',
    structure: 'epic',
    statCount: 5,
    accent: 'from-fuchsia-400/30 to-purple-500/20',
    style: 'pentaflower',
  },
];

const DEFAULT_ALT_VISUAL_ID = ALT_VISUAL_SKINS[0]?.id ?? null;

function buildSkinGeometry(skin: AltVisualSkin, stats: StatRow[]): SkinGeometry | null {
  const selectedStats = selectStatsForSkin(stats, skin.statCount);
  if (!selectedStats.length) {
    return null;
  }

  const questValues = selectedStats.map((stat) => normalizeValue(stat.questValue));
  const heroValues = selectedStats.map((stat) => normalizeValue(stat.heroValue));

  const questBase = buildSkinPolygon(skin.structure, questValues);
  const heroBase = buildSkinPolygon(skin.structure, heroValues);

  if (questBase.length < 3 || heroBase.length < 3) {
    return null;
  }

  const projectToCard = (point: Point): Point => ({
    x: ALT_CARD_CENTER.x + (point.x - CENTER_X) * ALT_CARD_SCALE,
    y: ALT_CARD_CENTER.y + (point.y - CENTER_Y) * ALT_CARD_SCALE,
  });

  return {
    questBase,
    heroBase,
    questCard: questBase.map(projectToCard),
    heroCard: heroBase.map(projectToCard),
    questCardAttr: polygonToPointsAttr(questBase.map(projectToCard)),
    questCardPath: polygonToPathD(questBase.map(projectToCard)),
    questCardSmoothPath: polygonToSmoothPathD(questBase.map(projectToCard), 0.25),
    heroCardPath: polygonToPathD(heroBase.map(projectToCard)),
    heroCardSmoothPath: polygonToSmoothPathD(heroBase.map(projectToCard), 0.35),
    projectToCard,
    selectedStats,
    maxRadius: questBase.reduce(
      (max, point) => Math.max(max, Math.hypot(point.x - CENTER_X, point.y - CENTER_Y)),
      0,
    ),
  };
}

interface PinballOptions {
  shotPower: number;
  spinBias: number;
}

// ─── Star Polygon Options ─────────────────────────────────────────────────
interface PolygonOptions {
  baseRatio: number;    // 0-0.5: minimum radius as fraction of RADIUS
  valleyDepth: number;  // 0-0.5: how deep valleys go between peaks
  curveTension: number; // 0-1: smoothness of curves (0=sharp, 1=very smooth)
  triangleWidth?: number; // 0-1: shared base width for triangle segments
  numPoints?: number;   // Fixed number of points (default 5)
  shapeType?: 'hero' | 'quest'; // 'quest' uses special difficulty envelopes (Rectangle, Convex)
}

const DEFAULT_POLYGON_OPTIONS: PolygonOptions = {
  baseRatio: 0.2,
  valleyDepth: 0.85,    // Default VERY sharp (Triangle/Needle look)
  curveTension: 0.15,
  triangleWidth: 0.35,
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

  return {
    tip,
    baseCCW: {
      x: CENTER_X - dx,
      y: CENTER_Y - dy,
    },
    baseCW: {
      x: CENTER_X + dx,
      y: CENTER_Y + dy,
    },
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
  const width = Math.max(
    0.01,
    Math.min(1, options.triangleWidth ?? options.baseRatio ?? DEFAULT_POLYGON_OPTIONS.triangleWidth ?? 0.35),
  );
  const pts = getTrianglePoints(activeIndex, stats.length, width);
  return [pts.tip, pts.baseCW, pts.baseCCW];
}

/**
 * Validates active stats and chooses the best shape.
 * - 1 Active Stat: Triangle
 * - 2-3 Active Stats: Stitched Triangles (Fan/Bowtie/Polygon)
 * - 4-5 Active Stats: Sheriff Star
 */
function buildQuestConvexPolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: PolygonOptions,
): Point[] {
  const numPoints = options.numPoints ?? stats.length;
  const baseRatio = Math.max(0.1, options.baseRatio ?? 0);
  const minRadius = RADIUS * baseRatio;
  const points: Point[] = [];

  for (let i = 0; i < numPoints; i++) {
    const stat = stats[i];
    const raw = stat ? Number(stat[key]) : 0;
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
    const radius = minRadius + (clamped / 100) * (RADIUS - minRadius);
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numPoints;
    points.push({
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle),
    });
  }

  return points;
}

function buildAdaptivePolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: PolygonOptions
): Point[] {
  const triangleWidth = Math.max(
    0.01,
    Math.min(1, options.triangleWidth ?? options.baseRatio ?? DEFAULT_POLYGON_OPTIONS.triangleWidth ?? 0.35),
  );
  // Count active stats (value > 0)
  const activeStats = stats.map((s, i) => ({ val: Number(s[key]), index: i }))
    .filter(s => s.val > 0);

  const count = activeStats.length;
  const isQuest = options.shapeType === 'quest';

  if (count === 0) {
    return [];
  }

  if (isQuest) {
    if (count === 1) {
      const tri = getTrianglePoints(activeStats[0].index, stats.length, triangleWidth);
      return [tri.tip, tri.baseCW, tri.baseCCW];
    }

    // 2+ active stats -> Convex polygon without valleys
    return buildQuestConvexPolygon(stats, key, options);
  }

  if (count === 1) {
    // SINGLE STAT HERO -> TRIANGLE
    return buildTriangle(stats, activeStats[0].index, options);
  }

  if (count === 2 || count === 3) {
    // 2-3 STATS -> STITCHED GEOMETRY
    // Ensure the stitched area never creates empty regions between stats
    const points: Point[] = [];
    const total = stats.length;
    const center: Point = { x: CENTER_X, y: CENTER_Y };

    activeStats.forEach((stat, i) => {
      const nextStat = activeStats[(i + 1) % count];

      const currentTri = getTrianglePoints(stat.index, total, triangleWidth);
      const nextTri = getTrianglePoints(nextStat.index, total, triangleWidth);

      points.push(currentTri.tip);
      points.push(currentTri.baseCW);
      points.push(center);
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

function computeAverage(values: number[]): number {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!filtered.length) return 0;
  const total = filtered.reduce((sum, value) => sum + value, 0);
  return total / filtered.length;
}

function selectStatsForSkin(stats: StatRow[], count: number): StatRow[] {
  const sorted = [...stats].sort(
    (a, b) => clampPercentage(b.questValue) - clampPercentage(a.questValue),
  );
  if (!sorted.length) return [];
  const slice = sorted.slice(0, Math.min(count, sorted.length));
  if (slice.length < count) {
    const last = slice.slice(-1)[0] ?? sorted[0];
    while (slice.length < count) {
      slice.push(last);
    }
  }
  return slice;
}

function normalizeValue(value: number, fallback = 0): number {
  const clamped = clampPercentage(value);
  return Number.isFinite(clamped) ? clamped / 100 : fallback;
}

function buildSoloPolygon(value: number): Point[] {
  const heightRatio = Math.max(0.05, value);
  const topY = CENTER_Y - heightRatio * (RADIUS * 0.95);
  const baseY = CENTER_Y + RADIUS * 0.65;
  const halfWidth = 45;
  return [
    { x: CENTER_X, y: topY },
    { x: CENTER_X + halfWidth, y: baseY },
    { x: CENTER_X - halfWidth, y: baseY },
  ];
}

function buildDualPolygon(values: number[]): Point[] {
  const v = Math.max(0.05, values[0] ?? 0);
  const h = Math.max(0.05, values[1] ?? values[0] ?? 0);
  const vertical = v * (RADIUS * 0.9);
  const horizontal = h * (RADIUS * 0.9);
  return [
    { x: CENTER_X, y: CENTER_Y - vertical },
    { x: CENTER_X + horizontal, y: CENTER_Y },
    { x: CENTER_X, y: CENTER_Y + vertical },
    { x: CENTER_X - horizontal, y: CENTER_Y },
  ];
}

function buildRadialPolygon(values: number[], sides: number, offset = -Math.PI / 2): Point[] {
  if (sides < 3) sides = 3;
  const points: Point[] = [];
  for (let i = 0; i < sides; i += 1) {
    const idx = i % values.length;
    const value = Math.max(0.05, values[idx] ?? 0);
    const radius = (0.25 + value * 0.75) * RADIUS;
    const angle = offset + (i * 2 * Math.PI) / sides;
    points.push({
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle),
    });
  }
  return points;
}

function buildEpicPolygon(values: number[]): Point[] {
  const peaks = 5;
  const points: Point[] = [];
  for (let i = 0; i < peaks; i += 1) {
    const idx = i % values.length;
    const value = Math.max(0.05, values[idx] ?? 0);
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / peaks;
    const radius = (0.35 + value * 0.65) * RADIUS;
    points.push({
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle),
    });
    const valleyRadius = radius * 0.45;
    const valleyAngle = angle + Math.PI / peaks;
    points.push({
      x: CENTER_X + valleyRadius * Math.cos(valleyAngle),
      y: CENTER_Y + valleyRadius * Math.sin(valleyAngle),
    });
  }
  return points;
}

function buildSkinPolygon(structure: AltStructure, values: number[]): Point[] {
  switch (structure) {
    case 'solo':
      return buildSoloPolygon(values[0] ?? 0);
    case 'dual':
      return buildDualPolygon(values);
    case 'triple':
      return buildRadialPolygon(values, 3);
    case 'quattro':
      return buildRadialPolygon(values, 4);
    case 'epic':
      return buildEpicPolygon(values);
    default:
      return buildRadialPolygon(values, Math.max(3, values.length));
  }
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

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function samplePointInsidePolygon(polygon: Point[], maxAttempts = 200): Point {
  if (polygon.length < 3) return { x: CENTER_X, y: CENTER_Y };
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const u = Math.random();
    const r = Math.sqrt(u) * RADIUS;
    const angle = Math.random() * Math.PI * 2;
    const x = CENTER_X + r * Math.cos(angle);
    const y = CENTER_Y + r * Math.sin(angle);
    const candidate = { x, y };
    if (pointInPolygon(candidate, polygon)) {
      return candidate;
    }
  }
  return { x: CENTER_X, y: CENTER_Y };
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
  const { config } = useBalancerConfig();
  const baseStatsPool = useMemo(() => {
    return Object.values(config.stats ?? {}).filter(
      (stat) => stat.baseStat && !stat.isDerived && !stat.isHidden,
    );
  }, [config.stats]);

  const initialStats = useMemo<StatRow[]>(() => {
    if (!baseStatsPool.length) return [];
    const seedSource = JSON.stringify(baseStatsPool.map((stat) => stat.id).sort());
    const rng = createSeededRng(hashString(seedSource));
    const shuffled = shuffleWithRng(baseStatsPool, rng);
    return shuffled.slice(0, 5).map((stat, index) => {
      const defaultValue = index === 0 ? 60 : 0;
      return {
        id: stat.id,
        name: stat.label,
        questValue: defaultValue,
        heroValue: defaultValue,
        isDetrimental: !!stat.isDetrimental,
      };
    });
  }, [baseStatsPool]);

  const [stats, setStats] = useState<StatRow[]>([]);

  useEffect(() => {
    if (!initialStats.length) return undefined;
    const frame = requestAnimationFrame(() => {
      setStats(initialStats);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialStats]);
  const [injuryPct, setInjuryPct] = useState(10);
  const [deathPct, setDeathPct] = useState(5);
  const [shotPower, setShotPower] = useState(0.8); // 0..1 slider
  const [spinBias, setSpinBias] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<LastOutcome | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [ballPosition, setBallPosition] = useState<Point | null>(null);
  const [timer, setTimer] = useState<string>("0.00s");
  const [viewMode, setViewMode] = useState<'classic' | 'alt'>('classic');
  const profileKey = useMemo(
    () =>
      JSON.stringify({
        stats: stats.map((stat) => ({
          id: stat.id,
          quest: stat.questValue,
          hero: stat.heroValue,
          detrimental: stat.isDetrimental,
        })),
        injuryPct,
        deathPct,
      }),
    [stats, injuryPct, deathPct],
  );
  // ─── Polygon Tuning State ───────────────────────────────────────────────
  const [valleyDepth, setValleyDepth] = useState(0.5);  // 0-1: Unified control
  const [curveTension, setCurveTension] = useState(0.3); // 0-1: curve smoothness
  const [heroPrecision, setHeroPrecision] = useState(0.2); // 0-0.6: Makes hero shape sharper/thinner

  // ─── Monte Carlo / Ghost State ──────────────────────────────────────────
  const ballAnimFrameRef = useRef<number | null>(null);
  const altCardAnimRefs = useRef<Record<string, number | null>>({});
    // New derived state for UI
  const activeCount = stats.filter(s => s.questValue > 0).length;

  const questValues = useMemo(() => stats.map((stat) => clampPercentage(stat.questValue)), [stats]);
  const heroValues = useMemo(() => stats.map((stat) => clampPercentage(stat.heroValue)), [stats]);

  const altSkinEntries = useMemo(
    () =>
      ALT_VISUAL_SKINS.map((skin) => ({
        skin,
        geometry: buildSkinGeometry(skin, stats),
      })),
    [stats],
  );

  const questAverage = useMemo(() => computeAverage(questValues), [questValues]);
  const heroAverage = useMemo(() => computeAverage(heroValues), [heroValues]);
  const deltaEntries = useMemo(
    () =>
      stats.map((stat, index) => ({
        id: stat.id || `stat-${index}`,
        name: stat.name || `Stat ${index + 1}`,
        delta: clampPercentage(stat.heroValue) - clampPercentage(stat.questValue),
      })),
    [stats],
  );

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
      numPoints: stats.length,
      shapeType: 'quest',
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
      numPoints: stats.length,
      shapeType: 'hero',
    });
  }, [stats, valleyDepth, heroPrecision, curveTension]);



  // ... (rest of logic) ...

  const questPolygonAttr = useMemo(() => polygonToPointsAttr(questPolygon), [questPolygon]);

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
      if (tRaw < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame((ts) => {
      startTime = ts;
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
    if (altBallFrameRef.current !== null) {
      cancelAnimationFrame(altBallFrameRef.current);
    }
  }, []);


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
      if (field === 'questValue') {
        next[index] = { ...current, questValue: clamped, heroValue: clamped };
      } else if (field === 'heroValue') {
        next[index] = { ...current, heroValue: clamped };
      } else {
        next[index] = { ...current, [field]: clamped } as StatRow;
      }
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
    const rollPercent = clampPercentage((distance / Math.max(1, radii.deathOuterRadius || RADIUS)) * 100);
    setAltRollInfo({
      profileKey,
      value: rollPercent,
      zone,
      result,
      visualId: resolvedAltRoll.visualId,
    });
    setAltRollAnimKey((prev) => prev + 1);
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
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500 pt-1">View</span>
        <div className="bg-slate-900/70 border border-slate-800 rounded-full p-1 flex gap-1">
          {(['classic', 'alt'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] transition-all ${
                viewMode === mode
                  ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {mode === 'classic' ? 'Dispatch Polygon' : 'Alt Visuals'}
            </button>
          ))}
        </div>
      </div>

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

            <div className="flex items-center gap-2">
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              {viewMode === 'classic' ? 'Visuale Skill Check' : 'Alt Visuals'}
            </span>
          </div>
          {viewMode === 'classic' ? (
            <>
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
                    strokeDashoffset={0}
                  />

                  {/* Fixed Stat Labels */}
                  {stats.map((stat, idx) => {
                    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / Math.max(1, stats.length);
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
                    <circle
                      cx={ballPosition.x}
                      cy={ballPosition.y}
                      r={5}
                      fill="#f97316"
                      stroke="#fde68a"
                      strokeWidth={1}
                      className="drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]"
                    />
                  )}
                </svg>
              </div>

              <div className="w-full text-center mt-2 p-2 bg-slate-900/50 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Risultato</div>
                <div className="flex justify-between items-center px-4">
                  <div className="text-sm font-bold text-slate-100">{outcomeLabel || '-'}</div>
                  <div className="font-mono text-xs text-cyan-400">{timer}</div>
                </div>
              </div>

              {/* Log */}
              {log.length > 0 && (
                <div className="w-full text-[10px] text-slate-500 font-mono bg-black/20 p-2 rounded max-h-20 overflow-y-auto">
                  {log.map((entry, idx) => (
                    <div key={idx} className="mb-0.5 border-b border-slate-800/30 pb-0.5 last:border-0">
                      {entry}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="default-card p-3 flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Ultimo roll esperimento</div>
                  <div className="text-sm font-semibold text-slate-100">
                    {resolvedAltRoll.value !== null ? `${resolvedAltRoll.value.toFixed(1)}%` : '—'}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  {resolvedAltRoll.value !== null ? (
                    <>
                      <span className={resolvedAltRoll.result === 'success' ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                        {resolvedAltRoll.result.toUpperCase()}
                      </span>
                      {' • '}
                      <span
                        className={
                          resolvedAltRoll.zone === 'safe'
                            ? 'text-emerald-300 font-semibold'
                            : resolvedAltRoll.zone === 'injury'
                            ? 'text-amber-300 font-semibold'
                            : 'text-rose-400 font-semibold'
                        }
                      >
                        {resolvedAltRoll.zone.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    'Lancia una variante per vedere il risultato.'
                  )}
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] border border-emerald-500/40 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
                  onClick={() => runAltSimulation(resolvedAltRoll.visualId ?? ALT_VISUAL_SKINS[0]?.id ?? null)}
                  disabled={ALT_VISUAL_SKINS.length === 0}
                >
                  Rilancia variante attiva
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {ALT_VISUAL_CARDS.map((card) => {
                  const isActive = resolvedAltRoll.visualId === card.id;
                  return (
                    <div
                      key={card.id}
                      className={`bg-slate-950/80 border rounded-2xl p-3 flex flex-col gap-3 transition ${
                        isActive ? 'border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-300">{card.title}</div>
                          <div className="text-[11px] text-slate-500">{card.subtitle}</div>
                        </div>
                        {resolvedAltRoll.value !== null && isActive && (
                          <div className="text-right">
                            <div className="text-sm font-semibold text-emerald-300">{resolvedAltRoll.value.toFixed(1)}%</div>
                            <div className="text-[10px] uppercase tracking-[0.16em]">
                              {resolvedAltRoll.zone.toUpperCase()}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{card.description}</p>
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center py-3">
                        {renderAltVisualSvg(card)}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                          {isActive ? 'Attivo' : 'In standby'}
                        </span>
                        <button
                          type="button"
                          onClick={() => runAltSimulation(card.id)}
                          className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] transition ${
                            isActive
                              ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/40'
                              : 'bg-slate-800/60 text-slate-200 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          Lancia
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillCheckPreviewPage;
