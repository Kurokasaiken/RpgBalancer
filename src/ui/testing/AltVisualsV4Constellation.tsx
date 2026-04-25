import { useEffect, useMemo, useRef } from 'react';
import type { StatRow } from './types';

export const DEFAULT_V4_CANVAS_WIDTH = 640;
export const DEFAULT_V4_CANVAS_HEIGHT = 420;

interface AltVisualsV4ConstellationProps {
  stats: StatRow[];
  injuryPct: number;
  deathPct: number;
  width?: number;
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

const FALLBACK_STAT_ROWS: StatRow[] = [
  { id: 'fallback-str', name: 'STR', questValue: 65, heroValue: 60, isDetrimental: false },
  { id: 'fallback-dex', name: 'DEX', questValue: 55, heroValue: 52, isDetrimental: false },
  { id: 'fallback-int', name: 'INT', questValue: 58, heroValue: 62, isDetrimental: false },
];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

function getActiveStats(stats: StatRow[]): StatRow[] {
  const active = stats.filter((stat) => stat.questValue > 0);
  if (active.length >= 3) {
    return active;
  }
  const missing = Math.max(0, 3 - active.length);
  return [...active, ...FALLBACK_STAT_ROWS.slice(0, missing)];
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[], options: { fill?: string; stroke?: string; lineWidth?: number; shadowBlur?: number }) {
  if (points.length < 2) return;
  ctx.save();
  if (options.shadowBlur) {
    ctx.shadowColor = options.stroke ?? options.fill ?? 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = options.shadowBlur;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  if (options.fill) {
    ctx.fillStyle = options.fill;
    ctx.fill();
  }
  if (options.stroke) {
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.lineWidth ?? 1;
    ctx.stroke();
  }
  ctx.restore();
}

export function AltVisualsV4Constellation({
  stats,
  injuryPct,
  deathPct,
  width = DEFAULT_V4_CANVAS_WIDTH,
  height = DEFAULT_V4_CANVAS_HEIGHT,
}: AltVisualsV4ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const usableStats = useMemo(() => getActiveStats(stats), [stats]);

  const { safePct, injurySafeTotal } = useMemo(() => {
    const injury = clamp(injuryPct);
    const death = clamp(deathPct);
    const safe = clamp(100 - injury - death);
    return {
      safePct: safe,
      injurySafeTotal: safe + injury,
    };
  }, [injuryPct, deathPct]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center: Point = { x: width / 2, y: height / 2 };
    const outerRadius = Math.min(width, height) * 0.36;
    const safeRadius = outerRadius * (safePct / 100);
    const injuryRadius = outerRadius * (injurySafeTotal / 100);
    const deathRadius = outerRadius;
    const total = usableStats.length || 1;
    const baseAngleOffset = -Math.PI / 2;

    const polarNodes = usableStats.map((stat, index) => {
      const angle = baseAngleOffset + (index * 2 * Math.PI) / total;
      return { stat, angle };
    });

    const toPoint = (value: number, angle: number) => {
      const normalized = clamp(value) / 100;
      const radius = lerp(safeRadius * 0.5, deathRadius, normalized);
      return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
    };

    const questPoints = polarNodes.map(({ stat, angle }) => toPoint(stat.questValue, angle));
    const heroPoints = polarNodes.map(({ stat, angle }) => toPoint(stat.heroValue, angle));

    const connections = questPoints.flatMap((point, index) =>
      questPoints.slice(index + 1).map((otherPoint, offset) => {
        const targetIndex = index + offset + 1;
        const weight = (usableStats[index].questValue + usableStats[targetIndex].questValue) / 200;
        return { from: point, to: otherPoint, weight };
      }),
    );

    const averageQuestStrength =
      usableStats.reduce((sum, stat) => sum + stat.questValue, 0) / Math.max(1, usableStats.length) / 100;

    let animationFrame: number;
    let phase = 0;

    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(8,24,45,0.95)');
      gradient.addColorStop(1, 'rgba(2,6,23,0.92)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const drawZones = () => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(34,197,94,0.08)';
      ctx.beginPath();
      ctx.arc(center.x, center.y, safeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(234,179,8,0.07)';
      ctx.beginPath();
      ctx.arc(center.x, center.y, injuryRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(248,113,113,0.05)';
      ctx.beginPath();
      ctx.arc(center.x, center.y, deathRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = 'rgba(148,163,184,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, safeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center.x, center.y, injuryRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawConnections = () => {
      connections.forEach((connection) => {
        ctx.strokeStyle = `rgba(125,211,252,${0.1 + connection.weight * 0.35})`;
        ctx.lineWidth = 0.8 + connection.weight * 1.8;
        ctx.beginPath();
        ctx.moveTo(connection.from.x, connection.from.y);
        ctx.lineTo(connection.to.x, connection.to.y);
        ctx.stroke();
      });
    };

    const drawNodes = () => {
      polarNodes.forEach(({ stat, angle }, index) => {
        const point = questPoints[index];
        ctx.save();
        ctx.fillStyle = 'rgba(14,165,233,0.85)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(8,47,73,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        const labelOffset = { x: Math.cos(angle) * 18, y: Math.sin(angle) * 14 };
        ctx.fillStyle = 'rgba(226,232,240,0.85)';
        ctx.font = '10px "Space Grotesk", sans-serif';
        ctx.textAlign = labelOffset.x >= 0 ? 'left' : 'right';
        const labelX = point.x + labelOffset.x;
        const labelY = point.y + labelOffset.y;
        ctx.fillText(stat.name, labelX, labelY);
        ctx.fillStyle = 'rgba(94,234,212,0.8)';
        ctx.fillText(`${Math.round(stat.questValue)}%`, labelX, labelY + 12);
      });
    };

    const drawOrbitingParticle = () => {
      const orbitRadius = lerp(safeRadius * 0.9, deathRadius * 0.98, averageQuestStrength);
      const wobble = Math.sin(phase * 1.5) * 10;
      const orbitX = center.x + (orbitRadius + wobble) * Math.cos(phase);
      const orbitY = center.y + (orbitRadius + wobble) * Math.sin(phase);

      ctx.save();
      const trailAngle = phase - 0.35;
      const trailX = center.x + (orbitRadius + wobble * 0.5) * Math.cos(trailAngle);
      const trailY = center.y + (orbitRadius + wobble * 0.5) * Math.sin(trailAngle);

      const gradient = ctx.createLinearGradient(trailX, trailY, orbitX, orbitY);
      gradient.addColorStop(0, 'rgba(251,191,36,0)');
      gradient.addColorStop(1, 'rgba(251,191,36,0.8)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(orbitX, orbitY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(250,204,21,0.95)';
      ctx.shadowColor = 'rgba(251,191,36,0.65)';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(orbitX, orbitY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      drawBackground();
      drawZones();
      if (questPoints.length >= 3) {
        drawPolygon(ctx, questPoints, {
          fill: 'rgba(56,189,248,0.12)',
          stroke: 'rgba(14,165,233,0.8)',
          lineWidth: 1.5,
          shadowBlur: 12,
        });
      }
      if (heroPoints.length >= 3) {
        drawPolygon(ctx, heroPoints, {
          stroke: 'rgba(45,212,191,0.8)',
          lineWidth: 1.2,
        });
      }
      drawConnections();
      drawNodes();
      drawOrbitingParticle();
      phase += 0.012;
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [usableStats, safePct, injurySafeTotal, injuryPct, deathPct, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full max-w-[640px] rounded-2xl border border-slate-900 bg-slate-950/90 shadow-[0_20px_45px_rgba(8,15,30,0.55)]"
    />
  );
}

export default AltVisualsV4Constellation;
