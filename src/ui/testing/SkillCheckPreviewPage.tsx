import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';
import { RiskVisualization } from './RiskVisualization';
import type {
  OutcomeZone,
  OutcomeResult,
  AltCardState,
  StatRow,
  LastOutcome,
  Point,
  SkinGeometry,
  AltVisualSkin,
} from './types';

const CANVAS_SIZE = 300;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
const RADIUS = 120;
const ALT_CARD_WIDTH = 240;
const ALT_CARD_HEIGHT = 220;
const ALT_CARD_CENTER = { x: ALT_CARD_WIDTH / 2, y: ALT_CARD_HEIGHT / 2 };
const ALT_CARD_SCALE = (Math.min(ALT_CARD_WIDTH, ALT_CARD_HEIGHT) * 0.42) / RADIUS;

const POKER_PRESET_BASE_POINTS: { x: number; y: number }[] = [
  { x: 0, y: -1 },
  { x: 0.28, y: -0.95 },
  { x: 0.5, y: -0.75 },
  { x: 0.58, y: -0.45 },
  { x: 0.78, y: -0.18 },
  { x: 0.85, y: 0.08 },
  { x: 0.72, y: 0.32 },
  { x: 0.52, y: 0.46 },
  { x: 0.32, y: 0.55 },
  { x: 0.24, y: 0.82 },
  { x: 0.2, y: 1.0 },
  { x: -0.2, y: 1.0 },
  { x: -0.24, y: 0.82 },
  { x: -0.32, y: 0.55 },
  { x: -0.52, y: 0.46 },
  { x: -0.72, y: 0.32 },
  { x: -0.85, y: 0.08 },
  { x: -0.78, y: -0.18 },
  { x: -0.58, y: -0.45 },
  { x: -0.5, y: -0.75 },
  { x: -0.28, y: -0.95 },
];

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
    title: 'Poker · Classic Cross',
    subtitle: '4 Stat · Classico',
    description: 'Croce geometrica ispirata al seme ♣️ tradizionale.',
    structure: 'quattro',
    statCount: 4,
    accent: 'from-teal-400/30 to-cyan-500/20',
    style: 'poker',
  },
  {
    id: 'quattro-poker-clover',
    title: 'Poker · Clover',
    subtitle: '4 Stat · Quadrifoglio',
    description: 'Quadrifoglio morbido con stelo centrale.',
    structure: 'quattro',
    statCount: 4,
    accent: 'from-emerald-400/30 to-emerald-500/20',
    style: 'poker-clover',
  },
  {
    id: 'quattro-poker-club',
    title: 'Poker · Club Glyph',
    subtitle: '4 Stat · Trifoglio',
    description: 'Trifoglio bombato con lobo superiore dominante.',
    structure: 'quattro',
    statCount: 4,
    accent: 'from-lime-400/30 to-teal-500/20',
    style: 'poker-club',
  },
  {
    id: 'quattro-poker-preset',
    title: 'Poker · Preset SVG',
    subtitle: '4 Stat · Profilo disegnato',
    description: 'Profilo importato da preset per confronto rapido.',
    structure: 'quattro',
    statCount: 4,
    accent: 'from-slate-200/30 to-slate-500/20',
    style: 'poker-preset',
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
  {
    id: 'preview-param-rose',
    title: 'Preview · Rosa Parametrica',
    subtitle: 'Demo veloce',
    description: 'Rose curve dinamiche basate su parametri configurabili.',
    structure: 'epic',
    statCount: 5,
    accent: 'from-rose-400/30 via-amber-400/30 to-emerald-400/20',
    style: 'param-rose',
  },
  {
    id: 'preview-ribbon-bezier',
    title: 'Preview · Ribbon Bezier',
    subtitle: 'Demo veloce',
    description: 'Nastri Bezier che intrecciano i vettori delle stats.',
    structure: 'epic',
    statCount: 5,
    accent: 'from-indigo-400/30 via-cyan-400/30 to-violet-400/20',
    style: 'ribbon-bezier',
  },
  {
    id: 'preview-overlay-combo',
    title: 'Preview · Overlay SVG',
    subtitle: 'Demo veloce',
    description: 'Overlay multilayer con clipPath e blend per geometrie ibride.',
    structure: 'epic',
    statCount: 5,
    accent: 'from-slate-300/30 via-slate-600/20 to-slate-900/10',
    style: 'overlay-combo',
  },
];

function createAltCardState(id: string, profileKey: string): AltCardState {
  return {
    id,
    profileKey,
    phase: 'idle',
    result: null,
    zone: null,
    value: null,
    ballPosition: null,
    path: [],
    pathIndex: 0,
    lastUpdated: Date.now()
  };
}

const createAltCardStateMap = (profileKey: string): Record<string, AltCardState> => {
  return ALT_VISUAL_SKINS.reduce<Record<string, AltCardState>>((acc, skin) => {
    acc[skin.id] = createAltCardState(skin.id, profileKey);
    return acc;
  }, {});
};

// Utility functions
function clampPercentage(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeValue(value: number, fallback = 0): number {
  const clamped = clampPercentage(value);
  return Number.isFinite(clamped) ? clamped / 100 : fallback;
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

// Geometry functions
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

function polygonToSmoothPathD(points: Point[], tension: number = 0.3): string {
  if (points.length < 3) return polygonToPathD(points);
  if (tension <= 0) return polygonToPathD(points);

  const n = points.length;
  const parts: string[] = [];

  parts.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 0; i < n; i++) {
    const current = points[i];
    const next = points[(i + 1) % n];

    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    const cpX = current.x + (midX - current.x) * (1 - tension);
    const cpY = current.y + (midY - current.y) * (1 - tension);

    parts.push(`Q ${cpX} ${cpY} ${next.x} ${next.y}`);
  }

  return parts.join(' ');
}

const projectPointToAltCard = (point: Point): Point => ({
  x: ALT_CARD_CENTER.x + (point.x - CENTER_X) * ALT_CARD_SCALE,
  y: ALT_CARD_CENTER.y + (point.y - CENTER_Y) * ALT_CARD_SCALE,
});

function buildSkinGeometry(skin: AltVisualSkin, stats: StatRow[]): SkinGeometry | null {
  const selectedStats = selectStatsForSkin(stats, skin.statCount);
  if (!selectedStats.length) {
    return null;
  }

  const questValues = selectedStats.map((stat) => normalizeValue(stat.questValue));
  const heroValues = selectedStats.map((stat) => normalizeValue(stat.heroValue));

  const questBase = buildSkinPolygon(skin, questValues);
  const heroBase = buildSkinPolygon(skin, heroValues);

  if (questBase.length < 3 || heroBase.length < 3) {
    return null;
  }

  return {
    questBase,
    heroBase,
    questCard: questBase.map(projectPointToAltCard),
    heroCard: heroBase.map(projectPointToAltCard),
    questCardAttr: polygonToPointsAttr(questBase.map(projectPointToAltCard)),
    questCardPath: polygonToPathD(questBase.map(projectPointToAltCard)),
    questCardSmoothPath: polygonToSmoothPathD(questBase.map(projectPointToAltCard), 0.25),
    heroCardPath: polygonToPathD(heroBase.map(projectPointToAltCard)),
    heroCardSmoothPath: polygonToSmoothPathD(heroBase.map(projectPointToAltCard), 0.35),
    projectToCard: projectPointToAltCard,
    selectedStats,
    maxRadius: questBase.reduce(
      (max, point) => Math.max(max, Math.hypot(point.x - CENTER_X, point.y - CENTER_Y)),
      0,
    ),
  };
}

type ShapeBuilder = (values: number[], skin?: AltVisualSkin) => Point[];

const styleBuilders: Partial<Record<AltVisualSkin['style'], ShapeBuilder>> = {
  triangle: (values) => buildTriangleSpire(values[0] ?? 0),
  flame: (values) => buildFlamePolygon(values[0] ?? 0),
  drop: (values) => buildDropPolygon(values[0] ?? 0),
  column: (values) => buildColumnPolygon(values[0] ?? 0),
  diamond: (values) => buildDiamondPolygon(values),
  lens: (values) => buildLensPolygon(values),
  petal: (values) => buildPetalPolygon(values),
  bridge: (values) => buildBridgePolygon(values),
  'soft-triangle': (values) => buildSoftTrianglePolygon(values),
  triskel: (values) => buildTriskelPolygon(values),
  'tri-flower': (values) => buildRosePolygon(values, 3, { wobble: 0.15, stepsMultiplier: 6 }),
  poker: (values) => buildCrossPolygon(values),
  'poker-clover': (values) => buildPokerCloverPolygon(values),
  'poker-club': (values) => buildPokerClubPolygon(values),
  'poker-preset': (values) => buildPokerPresetPolygon(values),
  'wind-rose': (values) => buildRosePolygon(values, 4, { wobble: 0.12, stepsMultiplier: 6 }),
  elastic: (values) => buildElasticPolygon(values),
  pentagon: (values) => buildRadialPolygon(values, 5),
  star: (values) => buildStarPolygon(values),
  pentaflower: (values) => buildRosePolygon(values, 5, { wobble: 0.18, stepsMultiplier: 5 }),
  'param-rose': (values, skin) =>
    buildParamRosePreviewPolygon(values, (skin?.statCount ?? values.length) || 5),
  'ribbon-bezier': (values) => buildRibbonBezierPolygon(values),
  'overlay-combo': (values) => buildOverlayComboPolygon(values),
};

function buildSkinPolygon(skin: AltVisualSkin, values: number[]): Point[] {
  const builder = styleBuilders[skin.style];
  if (builder) {
    return builder(values, skin);
  }
  switch (skin.structure) {
    case 'solo':
      return buildTriangleSpire(values[0] ?? 0);
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

/*********************
 * Classic Quest Logic
 *********************/

function buildSingleStatTriangle(
  totalCount: number,
  entry: { index: number; value: number },
  baseRatio: number,
): Point[] {
  const angleStep = (2 * Math.PI) / Math.max(1, totalCount);
  const angle = -Math.PI / 2 + entry.index * angleStep;
  const minRadius = RADIUS * baseRatio;
  const tipRadius = minRadius + entry.value * (RADIUS - minRadius);
  const baseRadius = Math.max(minRadius * 0.75, tipRadius * 0.35);
  const tip: Point = {
    x: CENTER_X + tipRadius * Math.cos(angle),
    y: CENTER_Y + tipRadius * Math.sin(angle),
  };
  const baseCenter = {
    x: CENTER_X + baseRadius * Math.cos(angle),
    y: CENTER_Y + baseRadius * Math.sin(angle),
  };
  const perpAngle = angle + Math.PI / 2;
  const halfWidth = 24 + entry.value * 30;
  const baseRight: Point = {
    x: baseCenter.x + Math.cos(perpAngle) * halfWidth,
    y: baseCenter.y + Math.sin(perpAngle) * halfWidth,
  };
  const baseLeft: Point = {
    x: baseCenter.x - Math.cos(perpAngle) * halfWidth,
    y: baseCenter.y - Math.sin(perpAngle) * halfWidth,
  };
  return [tip, baseRight, { x: CENTER_X, y: CENTER_Y }, baseLeft];
}

function buildStatWedge(
  totalCount: number,
  entry: { index: number; value: number },
  baseRatio: number,
) {
  const angleStep = (2 * Math.PI) / Math.max(1, totalCount);
  const angle = -Math.PI / 2 + entry.index * angleStep;
  const minRadius = RADIUS * baseRatio;
  const tipRadius = minRadius + entry.value * (RADIUS - minRadius);
  const baseRadius = Math.max(minRadius * 0.8, tipRadius * 0.45);
  const tip: Point = {
    x: CENTER_X + tipRadius * Math.cos(angle),
    y: CENTER_Y + tipRadius * Math.sin(angle),
  };
  const baseCenter = {
    x: CENTER_X + baseRadius * Math.cos(angle),
    y: CENTER_Y + baseRadius * Math.sin(angle),
  };
  const perpAngle = angle + Math.PI / 2;
  const halfWidth = 18 + entry.value * 26;
  const baseRight: Point = {
    x: baseCenter.x + Math.cos(perpAngle) * halfWidth,
    y: baseCenter.y + Math.sin(perpAngle) * halfWidth,
  };
  const baseLeft: Point = {
    x: baseCenter.x - Math.cos(perpAngle) * halfWidth,
    y: baseCenter.y - Math.sin(perpAngle) * halfWidth,
  };
  return { tip, baseLeft, baseRight };
}

const clampValue = (value: number, min = 0.05): number => Math.max(min, value);

interface ClassicPolygonOptions {
  baseRatio?: number;
  valleyDepth?: number;
  triangleWidth?: number;
  numPoints?: number;
  shapeType?: 'hero' | 'quest';
}

const DEFAULT_CLASSIC_POLYGON_OPTIONS: ClassicPolygonOptions = {
  baseRatio: 0.25,
  valleyDepth: 0.6,
  triangleWidth: 0.35,
  numPoints: 5,
};

const CLASSIC_CURVE_TENSION = 0.3;
const CLASSIC_VALLEY_DEPTH = 0.5;
const CLASSIC_HERO_PRECISION = 0.2;
const CLASSIC_TRIANGLE_WIDTH = 0.35;

function getClassicTrianglePoints(index: number, total: number, widthFactor: number) {
  const angleStep = (2 * Math.PI) / Math.max(1, total);
  const tipAngle = -Math.PI / 2 + index * angleStep;
  const tipRadius = RADIUS * 0.95;
  const halfWidth = widthFactor * 90;
  const tip: Point = {
    x: CENTER_X + tipRadius * Math.cos(tipAngle),
    y: CENTER_Y + tipRadius * Math.sin(tipAngle),
  };
  const perpAngle = tipAngle + Math.PI / 2;
  const dx = Math.cos(perpAngle) * halfWidth;
  const dy = Math.sin(perpAngle) * halfWidth;
  return {
    tip,
    baseCW: {
      x: CENTER_X + dx,
      y: CENTER_Y + dy,
    },
    baseCCW: {
      x: CENTER_X - dx,
      y: CENTER_Y - dy,
    },
  };
}

function buildClassicTriangle(
  stats: StatRow[],
  activeIndex: number,
  options: ClassicPolygonOptions,
): Point[] {
  const triangleWidth = Math.max(
    0.01,
    Math.min(1, options.triangleWidth ?? DEFAULT_CLASSIC_POLYGON_OPTIONS.triangleWidth ?? 0.35),
  );
  const pts = getClassicTrianglePoints(activeIndex, stats.length, triangleWidth);
  return [pts.tip, pts.baseCW, pts.baseCCW];
}

function buildClassicQuestPolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: ClassicPolygonOptions,
): Point[] {
  const numPoints = options.numPoints ?? stats.length;
  const baseRatio = Math.max(0.05, options.baseRatio ?? DEFAULT_CLASSIC_POLYGON_OPTIONS.baseRatio ?? 0.25);
  const minRadius = RADIUS * baseRatio;
  const points: Point[] = [];
  for (let i = 0; i < Math.max(1, numPoints); i += 1) {
    const stat = stats[i];
    const raw = stat ? Number(stat[key]) : 0;
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
    const radius = minRadius + (clamped / 100) * (RADIUS - minRadius);
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, numPoints);
    points.push({
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle),
    });
  }
  return points;
}

function buildClassicStarPolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: ClassicPolygonOptions = {},
): Point[] {
  const numPoints = Math.max(3, options.numPoints ?? stats.length);
  const valleyDepth = Math.max(0, Math.min(1, options.valleyDepth ?? DEFAULT_CLASSIC_POLYGON_OPTIONS.valleyDepth ?? 0.6));
  const valleyRadius = RADIUS * (1 - valleyDepth);
  const peakAngleStep = (2 * Math.PI) / numPoints;
  const points: Point[] = [];
  for (let i = 0; i < numPoints; i += 1) {
    const stat = stats[i];
    const raw = stat ? Number(stat[key]) : 0;
    const value = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
    const peakRadius = valleyRadius + (value / 100) * (RADIUS - valleyRadius);
    const peakAngle = -Math.PI / 2 + i * peakAngleStep;
    points.push({
      x: CENTER_X + peakRadius * Math.cos(peakAngle),
      y: CENTER_Y + peakRadius * Math.sin(peakAngle),
    });
    const valleyAngle = peakAngle + peakAngleStep / 2;
    points.push({
      x: CENTER_X + valleyRadius * Math.cos(valleyAngle),
      y: CENTER_Y + valleyRadius * Math.sin(valleyAngle),
    });
  }
  return points;
}

function buildClassicStitchedPolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: ClassicPolygonOptions,
): Point[] {
  const triangleWidth = Math.max(
    0.01,
    Math.min(1, options.triangleWidth ?? DEFAULT_CLASSIC_POLYGON_OPTIONS.triangleWidth ?? 0.35),
  );
  const center: Point = { x: CENTER_X, y: CENTER_Y };
  const activeStats = stats
    .map((s, index) => ({ value: Number(s[key]) || 0, index }))
    .filter((entry) => entry.value > 0);
  const points: Point[] = [];
  activeStats.forEach((entry, idx) => {
    const current = getClassicTrianglePoints(entry.index, stats.length, triangleWidth);
    const nextEntry = activeStats[(idx + 1) % activeStats.length];
    const next = getClassicTrianglePoints(nextEntry.index, stats.length, triangleWidth);
    points.push(current.tip);
    points.push(current.baseCW);
    points.push(center);
    points.push(next.baseCCW);
  });
  return points;
}

function buildClassicAdaptivePolygon(
  stats: StatRow[],
  selector: keyof StatRow,
  options: ClassicPolygonOptions,
): Point[] {
  const total = stats.length;
  if (total === 0) return [];

  const baseRatio = Math.max(
    0.05,
    options.baseRatio ?? DEFAULT_CLASSIC_POLYGON_OPTIONS.baseRatio ?? 0.25,
  );

  const entries = stats.map((stat, index) => ({
    index,
    value: normalizeValue(stat[selector] as number),
  }));

  const activeEntries = entries.filter((entry) => entry.value > 0);
  if (activeEntries.length === 0) {
    return [];
  }

  const buildFan = () => {
    const center: Point = { x: CENTER_X, y: CENTER_Y };
    const points: Point[] = [];
    activeEntries.forEach((entry) => {
      const wedge = buildStatWedge(total, entry, baseRatio);
      points.push(wedge.tip, wedge.baseRight, center, wedge.baseLeft);
    });
    return points;
  };

  if (activeEntries.length === 1) {
    return buildSingleStatTriangle(total, activeEntries[0], baseRatio);
  }

  if (options.shapeType === 'quest') {
    if (activeEntries.length <= 3) {
      return buildFan();
    }
    return buildClassicQuestPolygon(stats, selector, {
      ...options,
      baseRatio,
    });
  }

  if (activeEntries.length <= 3) {
    return buildFan();
  }

  return buildClassicStarPolygon(stats, selector, {
    ...options,
  });
}

function buildTriangleSpire(value: number): Point[] {
  const heightRatio = Math.max(0.05, value);
  const topY = CENTER_Y - heightRatio * (RADIUS * 0.95);
  const baseY = CENTER_Y + RADIUS * 0.65;
  const halfWidth = 30 + value * 40;
  return [
    { x: CENTER_X, y: topY },
    { x: CENTER_X + halfWidth, y: baseY },
    { x: CENTER_X, y: baseY - halfWidth * 0.25 },
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

function buildParamRosePreviewPolygon(values: number[], petals: number): Point[] {
  return buildRosePolygon(values, Math.max(3, petals), {
    wobble: 0.22,
    inner: 0.18,
    outer: 0.65,
    stepsMultiplier: 14,
  });
}

function cubicBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
}

function cubicBezierTangent(p0: Point, p1: Point, p2: Point, p3: Point, t: number): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x:
      3 * mt * mt * (p1.x - p0.x) +
      6 * mt * t * (p2.x - p1.x) +
      3 * t * t * (p3.x - p2.x),
    y:
      3 * mt * mt * (p1.y - p0.y) +
      6 * mt * t * (p2.y - p1.y) +
      3 * t * t * (p3.y - p2.y),
  };
}

function buildRibbonBezierPolygon(values: number[]): Point[] {
  const intensity = clampValue(values[0] ?? 0.5);
  const curvature = clampValue(values[1] ?? values[0] ?? 0.4);
  const ribbonWidth = 25 + intensity * 35;
  const start: Point = { x: CENTER_X - RADIUS * 0.75, y: CENTER_Y + RADIUS * 0.4 };
  const end: Point = { x: CENTER_X + RADIUS * 0.75, y: CENTER_Y - RADIUS * 0.4 };
  const control1: Point = {
    x: CENTER_X - RADIUS * 0.2,
    y: CENTER_Y - (0.1 + curvature * 0.6) * RADIUS,
  };
  const control2: Point = {
    x: CENTER_X + RADIUS * 0.15,
    y: CENTER_Y + (0.05 + curvature * 0.55) * RADIUS,
  };
  const steps = 36;
  const top: Point[] = [];
  const bottom: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = cubicBezierPoint(start, control1, control2, end, t);
    const tangent = cubicBezierTangent(start, control1, control2, end, t);
    const len = Math.hypot(tangent.x, tangent.y) || 1;
    const normal = { x: -tangent.y / len, y: tangent.x / len };
    const widthMod = 0.5 + Math.sin(Math.PI * t * 2) * 0.2;
    const offset = ribbonWidth * widthMod;
    top.push({
      x: point.x + normal.x * offset,
      y: point.y + normal.y * offset,
    });
    bottom.push({
      x: point.x - normal.x * offset,
      y: point.y - normal.y * offset,
    });
  }
  return [...top, ...bottom.reverse()];
}

function buildOverlayComboPolygon(values: number[]): Point[] {
  const base = buildRosePolygon(values, Math.max(4, values.length), {
    wobble: 0.16,
    inner: 0.22,
    outer: 0.58,
    stepsMultiplier: 10,
  });
  return base.map((point, index) => {
    const radius = Math.hypot(point.x - CENTER_X, point.y - CENTER_Y);
    const angle = Math.atan2(point.y - CENTER_Y, point.x - CENTER_X);
    const modulation = index % 2 === 0 ? 1.08 : 0.92;
    const adjustedRadius = radius * modulation;
    return {
      x: CENTER_X + adjustedRadius * Math.cos(angle),
      y: CENTER_Y + adjustedRadius * Math.sin(angle),
    };
  });
}

function buildPokerCloverPolygon(values: number[]): Point[] {
  const base = buildRosePolygon(values, 4, {
    wobble: 0.08,
    inner: 0.3,
    outer: 0.5,
    stepsMultiplier: 9,
  });
  const stemWidth = 16;
  const stemLength = RADIUS * 0.4;
  const stemTop = CENTER_Y + RADIUS * 0.45;
  const stemPoints: Point[] = [
    { x: CENTER_X + stemWidth, y: stemTop },
    { x: CENTER_X + stemWidth * 0.65, y: stemTop + stemLength },
    { x: CENTER_X - stemWidth * 0.65, y: stemTop + stemLength },
    { x: CENTER_X - stemWidth, y: stemTop },
  ];
  return [...base, ...stemPoints];
}

function arcPoints(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, steps: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = startAngle + (endAngle - startAngle) * t;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

function buildPokerClubPolygon(values: number[]): Point[] {
  const intensity = clampValue(values[0] ?? 0.6);
  const radius = (0.32 + intensity * 0.4) * RADIUS;
  const topCenter = { x: CENTER_X, y: CENTER_Y - radius * 0.65 };
  const rightCenter = { x: CENTER_X + radius * 0.85, y: CENTER_Y + radius * 0.05 };
  const leftCenter = { x: CENTER_X - radius * 0.85, y: CENTER_Y + radius * 0.05 };
  const bottomCenter = { x: CENTER_X, y: CENTER_Y + radius * 0.9 };
  const stemWidth = radius * 0.35;
  const stemLength = radius * 0.9;

  const path = [
    ...arcPoints(topCenter.x, topCenter.y, radius * 0.85, -Math.PI / 2, Math.PI / 2, 14),
    ...arcPoints(rightCenter.x, rightCenter.y, radius, -Math.PI / 2, Math.PI / 2, 16),
    ...arcPoints(bottomCenter.x, bottomCenter.y, radius * 0.85, 0, Math.PI, 16),
    ...arcPoints(leftCenter.x, leftCenter.y, radius, Math.PI / 2, (3 * Math.PI) / 2, 16),
    ...arcPoints(topCenter.x, topCenter.y, radius * 0.85, Math.PI / 2, (3 * Math.PI) / 2, 14),
  ];

  return [
    ...path,
    { x: CENTER_X + stemWidth, y: CENTER_Y + radius * 1.5 },
    { x: CENTER_X + stemWidth * 0.5, y: CENTER_Y + radius * 1.5 + stemLength },
    { x: CENTER_X - stemWidth * 0.5, y: CENTER_Y + radius * 1.5 + stemLength },
    { x: CENTER_X - stemWidth, y: CENTER_Y + radius * 1.5 },
  ];
}

function buildPokerPresetPolygon(values: number[]): Point[] {
  const intensity = clampValue(values[0] ?? 0.5);
  const scale = (0.35 + intensity * 0.45) * RADIUS;
  return POKER_PRESET_BASE_POINTS.map((point) => ({
    x: CENTER_X + point.x * scale,
    y: CENTER_Y + point.y * scale,
  }));
}

function buildFlamePolygon(value: number): Point[] {
  const intensity = clampValue(value);
  const height = (0.5 + intensity * 0.45) * RADIUS;
  const baseY = CENTER_Y + RADIUS * 0.55;
  const tipY = CENTER_Y - height;
  const waistY = (tipY + baseY) / 2;
  const flare = 30 + intensity * 40;
  return [
    { x: CENTER_X, y: tipY },
    { x: CENTER_X + flare * 0.35, y: tipY + height * 0.25 },
    { x: CENTER_X + flare, y: waistY },
    { x: CENTER_X + flare * 0.65, y: baseY },
    { x: CENTER_X, y: baseY + flare * 0.3 },
    { x: CENTER_X - flare * 0.65, y: baseY },
    { x: CENTER_X - flare, y: waistY },
    { x: CENTER_X - flare * 0.35, y: tipY + height * 0.25 },
  ];
}

function buildDropPolygon(value: number): Point[] {
  const intensity = clampValue(value);
  const height = (0.55 + intensity * 0.35) * RADIUS;
  const width = 25 + intensity * 35;
  const tipY = CENTER_Y - height;
  const baseY = CENTER_Y + RADIUS * 0.6;
  const controlY = (tipY + baseY) / 2;
  return [
    { x: CENTER_X, y: tipY },
    { x: CENTER_X + width * 0.7, y: controlY },
    { x: CENTER_X + width, y: baseY },
    { x: CENTER_X, y: baseY + width * 0.5 },
    { x: CENTER_X - width, y: baseY },
    { x: CENTER_X - width * 0.7, y: controlY },
  ];
}

function buildColumnPolygon(value: number): Point[] {
  const intensity = clampValue(value);
  const height = (0.4 + intensity * 0.6) * RADIUS;
  const width = 35 + intensity * 20;
  const topY = CENTER_Y - height;
  const baseY = CENTER_Y + RADIUS * 0.5;
  return [
    { x: CENTER_X - width, y: baseY },
    { x: CENTER_X - width, y: topY + width * 0.3 },
    { x: CENTER_X - width * 0.5, y: topY },
    { x: CENTER_X + width * 0.5, y: topY },
    { x: CENTER_X + width, y: topY + width * 0.3 },
    { x: CENTER_X + width, y: baseY },
    { x: CENTER_X + width * 0.4, y: baseY + width * 0.4 },
    { x: CENTER_X - width * 0.4, y: baseY + width * 0.4 },
  ];
}

function buildDiamondPolygon(values: number[]): Point[] {
  const major = clampValue(values[0] ?? 0);
  const minor = clampValue(values[1] ?? values[0] ?? 0);
  const vertical = (0.3 + major * 0.6) * RADIUS;
  const horizontal = (0.2 + minor * 0.5) * RADIUS;
  return [
    { x: CENTER_X, y: CENTER_Y - vertical },
    { x: CENTER_X + horizontal, y: CENTER_Y },
    { x: CENTER_X, y: CENTER_Y + vertical },
    { x: CENTER_X - horizontal, y: CENTER_Y },
  ];
}

function buildLensPolygon(values: number[]): Point[] {
  const width = (0.35 + clampValue(values[0] ?? 0) * 0.4) * RADIUS;
  const height = (0.15 + clampValue(values[1] ?? values[0] ?? 0) * 0.35) * RADIUS;
  const steps = 18;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = Math.PI * (i / steps);
    points.push({
      x: CENTER_X + width * Math.cos(theta),
      y: CENTER_Y - height * Math.sin(theta),
    });
  }
  for (let i = steps; i >= 0; i -= 1) {
    const theta = Math.PI * (i / steps);
    points.push({
      x: CENTER_X + width * Math.cos(theta),
      y: CENTER_Y + height * Math.sin(theta),
    });
  }
  return points;
}

function buildPetalPolygon(values: number[]): Point[] {
  return buildRosePolygon(values, 2, { wobble: 0.2, stepsMultiplier: 6 });
}

function buildBridgePolygon(values: number[]): Point[] {
  const width = (0.4 + clampValue(values[0] ?? 0) * 0.4) * RADIUS;
  const height = (0.15 + clampValue(values[1] ?? values[0] ?? 0) * 0.4) * RADIUS;
  const baseY = CENTER_Y + RADIUS * 0.5;
  const steps = 12;
  const arcPoints: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = Math.PI * (i / steps);
    arcPoints.push({
      x: CENTER_X - width + (Math.cos(theta) + 1) * width,
      y: baseY - Math.sin(theta) * height,
    });
  }
  return [
    { x: CENTER_X - width, y: baseY },
    { x: CENTER_X - width, y: baseY + height * 0.35 },
    { x: CENTER_X + width, y: baseY + height * 0.35 },
    { x: CENTER_X + width, y: baseY },
    ...arcPoints.reverse(),
  ];
}

function buildSoftTrianglePolygon(values: number[]): Point[] {
  return buildRadialPolygon(values, 3).flatMap((point, idx, arr) => {
    const next = arr[(idx + 1) % arr.length];
    const mid = {
      x: (point.x + next.x) / 2 + 0.12 * (CENTER_X - (point.x + next.x) / 2),
      y: (point.y + next.y) / 2 + 0.12 * (CENTER_Y - (point.y + next.y) / 2),
    };
    return [point, mid];
  });
}

function buildTriskelPolygon(values: number[]): Point[] {
  return buildRosePolygon(values, 3, { wobble: 0.1, phase: Math.PI / 3, stepsMultiplier: 5 });
}

function buildCrossPolygon(values: number[]): Point[] {
  const v = clampValue(values[0] ?? 0);
  const h = clampValue(values[1] ?? values[0] ?? 0);
  const armLong = (0.25 + v * 0.55) * RADIUS;
  const armShort = (0.15 + h * 0.4) * RADIUS;
  const thickness = 25 + v * 20;
  return [
    { x: CENTER_X - thickness, y: CENTER_Y - armLong },
    { x: CENTER_X + thickness, y: CENTER_Y - armLong },
    { x: CENTER_X + thickness, y: CENTER_Y - thickness },
    { x: CENTER_X + armShort, y: CENTER_Y - thickness },
    { x: CENTER_X + armShort, y: CENTER_Y + thickness },
    { x: CENTER_X + thickness, y: CENTER_Y + thickness },
    { x: CENTER_X + thickness, y: CENTER_Y + armLong },
    { x: CENTER_X - thickness, y: CENTER_Y + armLong },
    { x: CENTER_X - thickness, y: CENTER_Y + thickness },
    { x: CENTER_X - armShort, y: CENTER_Y + thickness },
    { x: CENTER_X - armShort, y: CENTER_Y - thickness },
    { x: CENTER_X - thickness, y: CENTER_Y - thickness },
  ];
}

function buildRosePolygon(
  values: number[],
  petals: number,
  options: { wobble?: number; phase?: number; inner?: number; outer?: number; stepsMultiplier?: number } = {},
): Point[] {
  const steps = Math.max(12, Math.round((options.stepsMultiplier ?? 8) * petals));
  const wobble = options.wobble ?? 0.08;
  const inner = options.inner ?? 0.25;
  const outer = options.outer ?? 0.6;
  const points: Point[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = i / steps;
    const theta = -Math.PI / 2 + t * Math.PI * 2;
    const baseIndex = Math.floor(t * values.length) % values.length;
    const baseValue = clampValue(values[baseIndex] ?? values[0] ?? 0);
    const modulation = Math.sin(petals * theta + (options.phase ?? 0)) * wobble;
    const radius = Math.max(0.05, inner + baseValue * outer + modulation) * RADIUS;
    points.push({
      x: CENTER_X + radius * Math.cos(theta),
      y: CENTER_Y + radius * Math.sin(theta),
    });
  }
  return points;
}

function buildElasticPolygon(values: number[]): Point[] {
  return buildRosePolygon(values, values.length, { wobble: 0.05, stepsMultiplier: 10, inner: 0.3, outer: 0.5 });
}

function buildStarPolygon(values: number[]): Point[] {
  const baseValue = clampValue(values[0] ?? 0);
  const outerRadius = (0.35 + baseValue * 0.55) * RADIUS;
  const innerRadius = outerRadius * 0.45;
  const points: Point[] = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
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

// Pinball simulation
interface PinballOptions {
  shotPower: number;
  spinBias: number;
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
  let nx = -ey;
  let ny = ex;
  const length = Math.hypot(nx, ny) || 1;
  nx /= length;
  ny /= length;
  const centerVectorX = CENTER_X - edge.a.x;
  const centerVectorY = CENTER_Y - edge.a.y;
  if (nx * centerVectorX + ny * centerVectorY < 0) {
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

function simulatePinballPath(target: Point, polygon: Point[], options: PinballOptions): Point[] {
  const path: Point[] = [];
  if (polygon.length < 3) {
    return [target];
  }
  const edges = getQuestEdges(polygon);
  const maxSteps = 180;

  const clampedShot = Math.max(0, Math.min(1, options.shotPower));
  const clampedSpin = Math.max(-1, Math.min(1, options.spinBias));

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
    const progress = step / maxSteps;
    let friction = 0.995;

    if (progress > 0.3) {
      const brake = (progress - 0.3) / 0.7;
      friction = 0.995 - (brake * brake * 0.75);
    }

    vel.x *= friction;
    vel.y *= friction;

    if (spinStrength !== 0) {
      const spinForceX = -vel.y * spinStrength;
      const spinForceY = vel.x * spinStrength;
      vel.x += spinForceX;
      vel.y += spinForceY;
    }

    const currentSpeed = Math.hypot(vel.x, vel.y);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      vel.x *= scale;
      vel.y *= scale;
    }

    const nextPos = { x: pos.x + vel.x, y: pos.y + vel.y };

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
      pos = {
        x: collisionPoint.x + collisionNormal.x * 0.8,
        y: collisionPoint.y + collisionNormal.y * 0.8,
      };

      const dot = vel.x * collisionNormal.x + vel.y * collisionNormal.y;
      vel = {
        x: vel.x - (1 + restitution) * dot * collisionNormal.x,
        y: vel.y - (1 + restitution) * dot * collisionNormal.y,
      };

      vel.x *= 0.9;
      vel.y *= 0.9;
    } else {
      pos = nextPos;

      if (!pointInPolygon(pos, polygon)) {
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

    if (currentSpeed < minSpeedThreshold) {
      break;
    }
  }

  if (path[path.length - 1] !== pos) {
    path.push(pos);
  }

  return path;
}

// Main component
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
      const fallback = index === 0 ? 60 : 0;
      const baseValue = typeof stat.defaultValue === 'number' ? stat.defaultValue : fallback;
      const normalized = clampPercentage(baseValue);
      return {
        id: stat.id,
        name: stat.label,
        questValue: normalized,
        heroValue: normalized,
        isDetrimental: stat.isDetrimental || false,
      };
    });
  }, [baseStatsPool]);

  const [stats, setStats] = useState<StatRow[]>(initialStats);
  const [injuryPct, setInjuryPct] = useState(30);
  const [deathPct, setDeathPct] = useState(15);
  const [shotPower, setShotPower] = useState(0.5);
  const [spinBias, setSpinBias] = useState(0.0);
  const [viewMode, setViewMode] = useState<'classic' | 'alt' | 'alt-v2'>('classic');
  const [ballPosition, setBallPosition] = useState<Point | null>(null);
  const [lastOutcome, setLastOutcome] = useState<LastOutcome | null>(null);
  const [timer, setTimer] = useState('0.0s');
  const [log, setLog] = useState<string[]>([]);

  const ballAnimFrameRef = useRef<number | null>(null);
  const altCardAnimRefs = useRef<Record<string, number | null>>({});

  const [altCardStates, setAltCardStates] = useState<Record<string, AltCardState>>(() =>
    createAltCardStateMap('default'),
  );

  const activeCount = stats.filter((s) => s.questValue > 0).length;

  const altSkinEntries = useMemo(
    () =>
      ALT_VISUAL_SKINS.map((skin) => ({
        skin,
        geometry: buildSkinGeometry(skin, stats),
      })),
    [stats],
  );

  const geometryBySkinId = useMemo(() => {
    const map = new Map<string, SkinGeometry>();
    altSkinEntries.forEach((entry) => {
      if (entry.geometry) {
        map.set(entry.skin.id, entry.geometry);
      }
    });
    return map;
  }, [altSkinEntries]);

  const safePct = useMemo(() => {
    const total = clampPercentage(injuryPct) + clampPercentage(deathPct);
    return clampPercentage(100 - total);
  }, [injuryPct, deathPct]);

  const profileKey = 'default';

  const setAltCardState = useCallback(
    (skinId: string, updater: (prev: AltCardState) => AltCardState) => {
      setAltCardStates((prev) => {
        const prevState = prev[skinId] ?? createAltCardState(skinId, profileKey);
        const nextState = updater(prevState);
        if (prevState === nextState) {
          return prev;
        }
        return {
          ...prev,
          [skinId]: nextState,
        };
      });
    },
    [profileKey],
  );

  const handleLaunchClick = useCallback((skinId: string) => {
    const geometry = geometryBySkinId.get(skinId);
    if (!geometry) return;

    const path = simulatePinballPath(
      { x: ALT_CARD_CENTER.x, y: ALT_CARD_CENTER.y },
      geometry.questCard,
      { shotPower, spinBias }
    );

    setAltCardState(skinId, (prev) => ({
      ...prev,
      path,
      pathIndex: 0,
      phase: 'rolling',
      ballPosition: path[0],
      lastUpdated: Date.now(),
      result: null,
      zone: null
    }));

    let animationId: number;
    const animate = () => {
      setAltCardState(skinId, (prev) => {
        if (prev.phase !== 'rolling') return prev;

        const nextIndex = prev.pathIndex + 1;
        if (nextIndex < prev.path.length) {
          return {
            ...prev,
            pathIndex: nextIndex,
            ballPosition: prev.path[nextIndex],
            lastUpdated: Date.now()
          };
        } else {
          // Animation finished, calculate outcome
          const finalPos = prev.path[prev.path.length - 1];
          if (!finalPos) return prev;

          const dx = finalPos.x - ALT_CARD_CENTER.x;
          const dy = finalPos.y - ALT_CARD_CENTER.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let zone: OutcomeZone = 'safe';
          if (distance > RADIUS * 0.8) {
            zone = 'death';
          } else if (distance > RADIUS * 0.5) {
            zone = 'injury';
          }

          const success = pointInPolygon(finalPos, geometry.heroCard);
          const result: OutcomeResult = success ? 'success' : 'fail';

          return {
            ...prev,
            phase: 'settled',
            zone,
            result,
            lastUpdated: Date.now()
          };
        }
      });

      const currentState = altCardStates[skinId];
      if (currentState?.phase === 'rolling') {
        animationId = requestAnimationFrame(animate);
        altCardAnimRefs.current[skinId] = animationId;
      }
    };

    animationId = requestAnimationFrame(animate);
    altCardAnimRefs.current[skinId] = animationId;
  }, [geometryBySkinId, shotPower, spinBias, setAltCardState, altCardStates]);

  // Quest and Hero polygons
  const questPolygon = useMemo(() => {
    const valleyDepth = CLASSIC_VALLEY_DEPTH;
    return buildClassicAdaptivePolygon(stats, 'questValue', {
      baseRatio: 1 - valleyDepth,
      valleyDepth,
      triangleWidth: CLASSIC_TRIANGLE_WIDTH,
      numPoints: stats.length,
      shapeType: 'quest',
    });
  }, [stats]);

  const heroPolygon = useMemo(() => {
    const heroValley = Math.min(0.95, CLASSIC_VALLEY_DEPTH + CLASSIC_HERO_PRECISION * (1 - CLASSIC_VALLEY_DEPTH));
    return buildClassicAdaptivePolygon(stats, 'heroValue', {
      baseRatio: 1 - heroValley,
      valleyDepth: heroValley,
      triangleWidth: CLASSIC_TRIANGLE_WIDTH,
      numPoints: stats.length,
      shapeType: 'hero',
    });
  }, [stats]);

  const questPolygonAttr = useMemo(() => polygonToPointsAttr(questPolygon), [questPolygon]);
  const questSmoothPathD = useMemo(
    () => polygonToSmoothPathD(questPolygon, CLASSIC_CURVE_TENSION),
    [questPolygon],
  );
  const heroSmoothPathD = useMemo(
    () => polygonToSmoothPathD(heroPolygon, CLASSIC_CURVE_TENSION),
    [heroPolygon],
  );

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

    // Animate ball
    if (ballAnimFrameRef.current !== null) {
      cancelAnimationFrame(ballAnimFrameRef.current);
      ballAnimFrameRef.current = null;
    }

    const path = simulatePinballPath(
      { x: CENTER_X, y: CENTER_Y },
      questPolygon,
      { shotPower, spinBias }
    );

    const segmentDurations = path.slice(0, -1).map((_, idx) => {
      const p = idx / (path.length - 1);
      let extra = 0;
      if (p > 0.5) {
        const brakeP = (p - 0.5) / 0.5;
        extra = brakeP * brakeP * 55;
      }
      return 20 + extra;
    });

    let segmentIndex = 0;
    let segmentStartTime: number | null = null;
    let animationStartTime: number | null = null;

    const animateBall = (timestamp: number) => {
      if (animationStartTime === null) animationStartTime = timestamp;

      const totalElapsed = timestamp - animationStartTime;
      setTimer((totalElapsed / 1000).toFixed(2) + "s");

      if (segmentIndex >= path.length - 1) {
        ballAnimFrameRef.current = null;
        return;
      }

      if (segmentStartTime === null) segmentStartTime = timestamp;
      const localElapsed = timestamp - segmentStartTime;
      const duration = segmentDurations[segmentIndex];
      const tRaw = Math.min(1, localElapsed / duration);
      const t = 1 - (1 - tRaw) * (1 - tRaw);

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

  // Utility functions
  function hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
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
          {(['classic', 'alt-v2'] as const).map((mode) => (
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
              {mode === 'classic' ? 'Dispatch Polygon' : 'Alt Visuals v2'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'classic' ? (
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
          </div>

          {/* ─── RIGHT COLUMN: PREVIEW ─── */}
          <div className="default-card p-3 space-y-3 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                Visuale Skill Check
              </span>
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
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="default-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Alt Visuals v2 · Parametri</h3>
                <p className="text-[10px] text-slate-400">Scegli le percentuali di rischio e il comportamento della pallina.</p>
              </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] border-t border-slate-800 pt-3">
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
          </div>

          <div className="grid grid-cols-1 md-grid-cols-2 xl:grid-cols-3 gap-4">
            {ALT_VISUAL_SKINS.map((skin) => {
              const geometry = geometryBySkinId.get(skin.id);
              const cardState = altCardStates[skin.id];

              return (
                <div
                  key={skin.id}
                  className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-slate-200">{skin.title}</h3>
                      <p className="text-xs text-slate-400">{skin.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLaunchClick(skin.id)}
                      disabled={cardState?.phase === 'rolling'}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        cardState?.phase === 'rolling'
                          ? 'bg-slate-600/60 text-slate-300 cursor-not-allowed'
                          : 'bg-emerald-600/80 hover:bg-emerald-500/90 text-white'
                      }`}
                    >
                      {cardState?.phase === 'rolling' ? 'Lanciando...' : 'Lancia'}
                    </button>
                  </div>

                  <div className="relative">
                    {geometry ? (
                      <RiskVisualization
                        width={ALT_CARD_WIDTH}
                        height={ALT_CARD_HEIGHT}
                        injuryPct={injuryPct}
                        deathPct={deathPct}
                        questCardAttr={geometry.questCardAttr}
                        heroCardPath={geometry.heroCardSmoothPath}
                        ballPosition={cardState?.ballPosition}
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-slate-500">
                        Geometry not available
                      </div>
                    )}
                  </div>

                  {cardState?.phase === 'settled' && cardState.result && (
                    <div className={`text-center py-1.5 px-3 rounded-md text-sm font-medium ${
                      cardState.result === 'success'
                        ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-800/50'
                        : 'bg-rose-900/50 text-rose-200 border border-rose-800/50'
                    }`}>
                      {cardState.result === 'success' ? 'SUCCESSO' : 'FALLIMENTO'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillCheckPreviewPage;
