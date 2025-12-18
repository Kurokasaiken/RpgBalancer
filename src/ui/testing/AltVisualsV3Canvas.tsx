import { useEffect, useMemo, useRef } from 'react';
import type { StatRow } from './types';

export interface CanvasStat {
  name: string;
  value: number; // 0-20 scale
  color: string;
}

export const DEFAULT_CANVAS_WIDTH = 600;
export const DEFAULT_CANVAS_HEIGHT = 400;
export const MAX_STAT_VALUE = 20;

const FALLBACK_STATS: CanvasStat[] = [
  { name: 'STR', value: 14, color: '#f87171' },
  { name: 'DEX', value: 10, color: '#34d399' },
  { name: 'INT', value: 12, color: '#60a5fa' },
];

const COLOR_PALETTE = ['#f87171', '#34d399', '#60a5fa', '#c084fc', '#facc15'];

interface AltVisualsV3CanvasProps {
  stats: StatRow[];
  width?: number;
  height?: number;
}

interface Vector {
  x: number;
  y: number;
}

interface Ball extends Vector {
  vx: number;
  vy: number;
}

export function deriveAltVisualsV3Stats(stats: StatRow[]): CanvasStat[] {
  const mapped = stats
    .filter((stat) => stat.questValue > 0)
    .slice(0, 3)
    .map((stat, index) => ({
      name: stat.name,
      value: Math.max(2, Math.round((stat.questValue / 100) * MAX_STAT_VALUE)),
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));

  if (mapped.length >= 3) {
    return mapped;
  }

  const needed = 3 - mapped.length;
  return [...mapped, ...FALLBACK_STATS.slice(0, needed)];
}

export function AltVisualsV3Canvas({
  stats,
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT,
}: AltVisualsV3CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerStats = useMemo(() => deriveAltVisualsV3Stats(stats), [stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    if (playerStats.length === 0) return undefined;

    const center: Vector = { x: width / 2, y: height / 2 };

    const enemyBlobVectors: Vector[] = [];
    const enemyStatsCount = Math.max(playerStats.length, 3);
    for (let i = 0; i < enemyStatsCount; i += 1) {
      const angle = (i / enemyStatsCount) * Math.PI * 2;
      const radius = 80 + Math.random() * 40;
      enemyBlobVectors.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      });
    }

    const playerBlobVectors: Vector[] = playerStats.map((_, i) => {
      const angle = (i / playerStats.length) * Math.PI * 2;
      const radius = 40;
      return {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    });

    const pillarProgress = playerStats.map(() => 0);
    const pillarSpeed = 0.02;

    const ball: Ball = { x: center.x, y: center.y, vx: 3, vy: 2 };
    const ballRadius = 8;
    let resultShown = false;
    let animationFrame: number;

    const drawBlob = (vectors: Vector[], fill: string) => {
      if (vectors.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(vectors[0].x, vectors[0].y);
      for (let i = 1; i < vectors.length; i += 1) {
        ctx.lineTo(vectors[i].x, vectors[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawBlob(enemyBlobVectors, 'rgba(200,50,50,0.35)');

      playerBlobVectors.forEach((vector, i) => {
        const stat = playerStats[i];
        if (!stat) return;
        const safeValue = Math.max(1, stat.value);
        if (pillarProgress[i] < stat.value) {
          pillarProgress[i] = Math.min(stat.value, pillarProgress[i] + pillarSpeed * MAX_STAT_VALUE);
        }
        const angle = (i / playerStats.length) * Math.PI * 2;
        const targetRadius = 50 + (stat.value / MAX_STAT_VALUE) * 80;
        const progressRatio = pillarProgress[i] / safeValue;
        vector.x = center.x + Math.cos(angle) * targetRadius * progressRatio;
        vector.y = center.y + Math.sin(angle) * targetRadius * progressRatio;
      });

      drawBlob(playerBlobVectors, 'rgba(50,200,100,0.4)');

      playerBlobVectors.forEach((vector, i) => {
        ctx.strokeStyle = playerStats[i]?.color ?? '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(vector.x, vector.y);
        ctx.stroke();
      });

      ball.x += ball.vx;
      ball.y += ball.vy;

      const minX = Math.min(...enemyBlobVectors.map((p) => p.x));
      const maxX = Math.max(...enemyBlobVectors.map((p) => p.x));
      const minY = Math.min(...enemyBlobVectors.map((p) => p.y));
      const maxY = Math.max(...enemyBlobVectors.map((p) => p.y));
      if (ball.x - ballRadius < minX || ball.x + ballRadius > maxX) ball.vx *= -1;
      if (ball.y - ballRadius < minY || ball.y + ballRadius > maxY) ball.vy *= -1;

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();

      if (!resultShown) {
        const pMinX = Math.min(...playerBlobVectors.map((p) => p.x));
        const pMaxX = Math.max(...playerBlobVectors.map((p) => p.x));
        const pMinY = Math.min(...playerBlobVectors.map((p) => p.y));
        const pMaxY = Math.max(...playerBlobVectors.map((p) => p.y));
        if (ball.x >= pMinX && ball.x <= pMaxX && ball.y >= pMinY && ball.y <= pMaxY) {
          console.log('V3 success!');
          resultShown = true;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [playerStats, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full max-w-[600px] rounded-xl border border-slate-800 bg-slate-950"
    />
  );
}

export default AltVisualsV3Canvas;
