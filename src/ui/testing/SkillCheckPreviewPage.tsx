import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';

import AltVisualsV6Asterism from './AltVisualsV6Asterism';
import AltVisualsV8ObsidianField from './AltVisualsV8ObsidianField';
import type { OutcomeZone, OutcomeResult, StatRow, LastOutcome, Point } from './types';

const CANVAS_SIZE = 300;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
const RADIUS = 120;
const ALT_VISUAL_ENTRIES = [
  {
    id: 'alt-v8',
    label: 'Alt Visuals v8',
    tagline: 'Obsidian Meridian · colonne cinematiche',
    Component: AltVisualsV8ObsidianField,
  },
  {
    id: 'alt-v6',
    label: 'Alt Visuals v6',
    tagline: 'Starfield Duel · morph pentagono/stella',
    Component: AltVisualsV6Asterism,
  },
] as const;
type AltVisualId = (typeof ALT_VISUAL_ENTRIES)[number]['id'];

const ALT_VIEW_MODE_STORAGE_KEY = 'skill-check-preview-alt-view';
const VIEW_MODE_STORAGE_KEY = 'skill-check-preview-view-mode';

interface RadiiSnapshot {
  safeRadius: number;
  injuryInnerRadius: number;
  injuryOuterRadius: number;
  deathInnerRadius: number;
  deathOuterRadius: number;
}

const EMPTY_RADII: RadiiSnapshot = {
  safeRadius: 0,
  injuryInnerRadius: 0,
  injuryOuterRadius: 0,
  deathInnerRadius: 0,
  deathOuterRadius: 0,
};

function computeRadiiSnapshot(
  questPolygon: Point[],
  stats: StatRow[],
  safePct: number,
  injuryPct: number,
  deathPct: number,
): RadiiSnapshot {
  if (questPolygon.length < 3) {
    return EMPTY_RADII;
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
    return EMPTY_RADII;
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
}

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

function clampPercentage(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeValue(value: number, fallback = 0): number {
  const clamped = clampPercentage(value);
  return Number.isFinite(clamped) ? clamped / 100 : fallback;
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

function buildClassicQuestPolygon(
  stats: StatRow[],
  key: keyof StatRow,
  options: ClassicPolygonOptions,
): Point[] {
  const numPoints = options.numPoints ?? stats.length;
  const baseRatio = Math.max(
    0.05,
    options.baseRatio ?? DEFAULT_CLASSIC_POLYGON_OPTIONS.baseRatio ?? 0.25,
  );
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
  const valleyDepth = Math.max(
    0,
    Math.min(1, options.valleyDepth ?? DEFAULT_CLASSIC_POLYGON_OPTIONS.valleyDepth ?? 0.6),
  );
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

/*
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
*/

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
  const baseStatsPool = useMemo(
    () =>
      Object.values(config.stats ?? {}).filter(
        (stat) => stat.baseStat && !stat.isDerived && !stat.isHidden,
      ),
    [config.stats],
  );

  const buildInitialStats = useCallback(() => {
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

  const [stats, setStats] = useState<StatRow[]>(() => buildInitialStats());

  useEffect(() => {
    setStats(buildInitialStats());
  }, [buildInitialStats]);
  const [injuryPct, setInjuryPct] = useState(30);
  const [deathPct, setDeathPct] = useState(15);
  const [shotPower, setShotPower] = useState(0.5);
  const [spinBias, setSpinBias] = useState(0.0);
  const [viewMode, setViewMode] = useState<'classic' | 'alt-v6-plus'>(() => {
    if (typeof window === 'undefined') {
      return 'classic';
    }
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === 'alt-v6-plus' ? 'alt-v6-plus' : 'classic';
  });
  const [altViewMode, setAltViewMode] = useState<AltVisualId>(() => {
    if (typeof window === 'undefined') {
      return 'alt-v8';
    }
    const stored = window.localStorage.getItem(ALT_VIEW_MODE_STORAGE_KEY);
    const normalized = stored === 'alt-v7' ? 'alt-v8' : (stored as AltVisualId | null);
    const valid = ALT_VISUAL_ENTRIES.find((entry) => entry.id === normalized);
    return valid?.id ?? 'alt-v8';
  });
  const [ballPosition, setBallPosition] = useState<Point | null>(null);
  const [lastOutcome, setLastOutcome] = useState<LastOutcome | null>(null);
  const [timer, setTimer] = useState('0.0s');
  const [log, setLog] = useState<string[]>([]);

  const ballAnimFrameRef = useRef<number | null>(null);


  const activeCount = stats.filter((s) => s.questValue > 0).length;

  const safePct = useMemo(() => {
    const total = clampPercentage(injuryPct) + clampPercentage(deathPct);
    return clampPercentage(100 - total);
  }, [injuryPct, deathPct]);

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

  const heroPeakPoints = useMemo(() => heroPolygon.filter((_, idx) => idx % 2 === 0), [heroPolygon]);
  const heroObelisks = useMemo(
    () =>
      heroPeakPoints.map((tip, index) => {
        const angle = Math.atan2(tip.y - CENTER_Y, tip.x - CENTER_X);
        const baseOffset = 18;
        const baseX = tip.x - Math.cos(angle) * baseOffset;
        const baseY = tip.y - Math.sin(angle) * baseOffset;
        return {
          key: `obelisk-${index}`,
          transform: `translate(${baseX} ${baseY}) rotate(${(angle * 180) / Math.PI + 90})`,
        };
      }),
    [heroPeakPoints],
  );

  const [starPulse, setStarPulse] = useState(false);

  useEffect(() => {
    setStarPulse(true);
    const timeout = window.setTimeout(() => setStarPulse(false), 520);
    return () => window.clearTimeout(timeout);
  }, [heroSmoothPathD]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ALT_VIEW_MODE_STORAGE_KEY, altViewMode);
  }, [altViewMode]);

  const radii = useMemo(
    () => computeRadiiSnapshot(questPolygon, stats, safePct, injuryPct, deathPct),
    [questPolygon, stats, safePct, injuryPct, deathPct],
  );

  const handleStatChange = useCallback(
    (index: number, field: keyof StatRow, raw: string) => {
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
    },
    [],
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
          {(['classic', 'alt-v6-plus'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] transition-all ${viewMode === mode
                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-slate-100'
                }`}
            >
              {mode === 'classic' ? 'Dispatch Polygon' : 'Alt Visuals · Anime'}
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
                  <radialGradient id="tar-circle" cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor="#07030a" />
                    <stop offset="45%" stopColor="#120518" />
                    <stop offset="100%" stopColor="#3b0a45" />
                  </radialGradient>
                  <filter id="tar-goo" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" in="SourceGraphic" result="blur" />
                    <feColorMatrix
                      in="blur"
                      type="matrix"
                      values="1 0 0 0 0  0 0.7 0 0 0  0 0 0.9 0 0  0 0 0 18 -7"
                      result="goo"
                    />
                    <feBlend in="SourceGraphic" in2="goo" mode="normal" />
                  </filter>
                  <pattern id="ivory-crepe" width="32" height="32" patternUnits="userSpaceOnUse">
                    <rect width="32" height="32" fill="var(--marble-ivory)" />
                    <path
                      d="M0 24 L12 18 L20 28 L32 20"
                      stroke="#b6aa94"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.35"
                    />
                    <path
                      d="M4 4 L16 12 L28 6"
                      stroke="#d5cdbf"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      opacity="0.4"
                    />
                  </pattern>
                  <filter id="ivory-depth" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2a2015" floodOpacity="0.65" />
                    <feDropShadow dx="0" dy="-2" stdDeviation="2" floodColor="#fff9f0" floodOpacity="0.35" />
                  </filter>
                  <linearGradient id="obelisk-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--bronze-glow)" />
                    <stop offset="55%" stopColor="var(--bronze-aged)" />
                    <stop offset="100%" stopColor="var(--marble-ivory)" />
                  </linearGradient>
                  <radialGradient id="amber-core" cx="50%" cy="35%" r="70%">
                    <stop offset="0%" stopColor="#ffe7a3" />
                    <stop offset="45%" stopColor="#fcb142" />
                    <stop offset="100%" stopColor="#a34707" />
                  </radialGradient>
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

                {/* Tar Circle */}
                <path
                  d={questSmoothPathD}
                  fill="url(#tar-circle)"
                  stroke="rgba(104,58,183,0.65)"
                  strokeWidth={1.5}
                  filter="url(#tar-goo)"
                  opacity={0.92}
                />

                {/* Hero Ivory Star */}
                <g
                  style={{
                    transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
                    transition: 'transform 520ms cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `translate(${CENTER_X}px, ${CENTER_Y}px) scale(${starPulse ? 1.035 : 1}) translate(${-CENTER_X}px, ${-CENTER_Y}px)`,
                  }}
                >
                  <path
                    d={heroSmoothPathD}
                    fill="url(#ivory-crepe)"
                    stroke="rgba(234, 225, 206, 0.8)"
                    strokeWidth={2}
                    filter="url(#ivory-depth)"
                    opacity={0.95}
                  />
                  {heroObelisks.map((obelisk) => (
                    <rect
                      key={obelisk.key}
                      width={8}
                      height={32}
                      x={-4}
                      y={-32}
                      rx={2}
                      fill="url(#obelisk-gradient)"
                      stroke="rgba(21,12,7,0.5)"
                      strokeWidth={0.6}
                      transform={obelisk.transform}
                      opacity={0.95}
                    />
                  ))}
                </g>

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
                    fill="url(#amber-core)"
                    stroke="#fef3c7"
                    strokeWidth={0.8}
                    filter="url(#ivory-depth)"
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
          <div className="default-card p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                  Alt Visuals Anime · Modalità
                </h3>
                <p className="text-[11px] text-slate-400">
                  Scegli la versione con glow FX che preferisci (stessa logica pinball, estetica diversa).
                </p>
              </div>
              <div className="flex gap-2 bg-slate-900/70 border border-slate-800 rounded-full p-1">
                {ALT_VISUAL_ENTRIES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setAltViewMode(entry.id)}
                    className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] transition-all ${altViewMode === entry.id
                      ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-300/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                      : 'text-slate-400 hover:text-slate-100'
                      }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-300">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
                <div className="uppercase tracking-[0.18em] text-slate-500">Stats attive</div>
                <div className="text-lg font-mono text-cyan-300">{stats.filter((stat) => stat.questValue > 0).length}</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
                <div className="uppercase tracking-[0.18em] text-slate-500">Safe%</div>
                <div className="text-lg font-mono text-emerald-300">
                  {Math.max(0, 100 - injuryPct - deathPct)}%
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
                <div className="uppercase tracking-[0.18em] text-slate-500">Injury%</div>
                <div className="text-lg font-mono text-amber-300">{injuryPct}%</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
                <div className="uppercase tracking-[0.18em] text-slate-500">Death%</div>
                <div className="text-lg font-mono text-rose-300">{deathPct}%</div>
              </div>
            </div>
          </div>

          <div className="default-card p-6 space-y-3">
            {(() => {
              const entry = ALT_VISUAL_ENTRIES.find((item) => item.id === altViewMode) ?? ALT_VISUAL_ENTRIES[0];
              const VisualComponent = entry.Component;
              return (
                <>
                  <p className="text-[11px] text-slate-400 text-center uppercase tracking-[0.18em]">
                    {entry.tagline}
                  </p>
                  <VisualComponent stats={stats} />
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillCheckPreviewPage;
