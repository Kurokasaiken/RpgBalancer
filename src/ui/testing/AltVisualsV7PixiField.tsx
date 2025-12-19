import { useEffect, useMemo, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { deriveAxisValues } from './altVisualsAxis';
import type { StatRow } from './types';

const AXES = 5;
const MAX_STAT = 100;
const RADIUS = 220;
const SIZE = 640;

const FALLBACK_AXIS_VALUES = {
  enemy: [60, 60, 60, 60, 60],
  player: [55, 65, 70, 50, 60],
} as const;

const STAT_ICONS = ['💪', '⚡', '🧠', '🛡️', '❤️'];

interface AltVisualsV7PixiFieldProps {
  stats: StatRow[];
}

export function AltVisualsV7PixiField({ stats }: AltVisualsV7PixiFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const axisValues = useMemo(
    () => deriveAxisValues(stats, FALLBACK_AXIS_VALUES.enemy, FALLBACK_AXIS_VALUES.player, AXES),
    [stats],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let teardown: () => void = () => {};
    let app: PIXI.Application | null = new PIXI.Application();

    container.replaceChildren();

    const initTask = (async () => {
      await app!.init({
        width: SIZE,
        height: SIZE,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      if (disposed) {
        app?.destroy(true, true);
        app = null;
        return;
      }
      if (!app) {
        return;
      }
      container.appendChild(app.canvas);
      teardown = initStatField(app, axisValues);
    })();

    return () => {
      disposed = true;
      teardown();
      initTask.finally(() => {
        if (app) {
          app.destroy(true, true);
          app = null;
        }
        container.replaceChildren();
      });
    };
  }, [axisValues]);

  return (
    <div
      ref={containerRef}
      data-testid="alt-visuals-v7"
      className="w-full max-w-[680px] rounded-[28px] border border-white/5 bg-[radial-gradient(circle_at_center,#07070f_0%,#030308_80%)] shadow-[0_30px_90px_rgba(0,0,0,0.7)]"
      style={{ height: SIZE }}
    />
  );
}

export default AltVisualsV7PixiField;

function initStatField(app: PIXI.Application, axisValues: { enemy: number[]; player: number[] }) {
  const stage = app.stage;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  let time = 0;

  const background = new PIXI.Graphics();
  background.beginFill(0x07070f);
  background.drawRect(0, 0, SIZE, SIZE);
  background.endFill();
  stage.addChild(background);

  const grid = new PIXI.Graphics();
  grid.lineStyle(1, 0x555577, 0.5);
  for (let i = 0; i < AXES; i += 1) {
    const p = polar(cx, cy, i, RADIUS);
    grid.moveTo(cx, cy);
    grid.lineTo(p.x, p.y);
    for (let t = 1; t <= 10; t += 1) {
      const tp = polar(cx, cy, i, (RADIUS / 10) * t);
      grid.beginFill(0x666666, 0.65);
      grid.drawCircle(tp.x, tp.y, 2);
      grid.endFill();
    }
  }
  stage.addChild(grid);

  STAT_ICONS.forEach((icon, i) => {
    const p = polar(cx, cy, i, RADIUS + 28);
    const text = new PIXI.Text({
      text: icon,
      style: { fontSize: 22, fill: 0xffffff },
    });
    text.anchor.set(0.5);
    text.position.set(p.x, p.y);
    stage.addChild(text);
  });

  const gooCore = new PIXI.Graphics();
  gooCore.filters = [new PIXI.BlurFilter(16)];
  stage.addChild(gooCore);

  const gooArms = new PIXI.Graphics();
  gooArms.filters = [new PIXI.BlurFilter(12)];
  stage.addChild(gooArms);

  const enemyShape = new PIXI.Graphics();
  enemyShape.filters = [new PIXI.BlurFilter(8)];
  stage.addChild(enemyShape);

  const playerShape = new PIXI.Graphics();
  playerShape.filters = [new PIXI.BlurFilter(10)];
  playerShape.blendMode = 'add';
  stage.addChild(playerShape);

  const tick = () => {
    time += 0.025;

    gooCore.clear();
    gooCore.beginFill(0x050505);
    gooCore.drawCircle(cx, cy, 28 + Math.sin(time * 2) * 4);
    gooCore.endFill();

    gooArms.clear();
    gooArms.beginFill(0x050505);
    for (let i = 0; i < AXES; i += 1) {
      const delay = i * 0.8;
      const localT = Math.max(0, Math.min(1, time - delay));
      if (localT <= 0) continue;
      const targetR = (axisValues.enemy[i] / MAX_STAT) * RADIUS;
      const armR = localT * targetR;
      const wobble = Math.sin(time * 3 + i) * 6 * localT;
      const armPoint = polar(cx, cy, i, armR + wobble);
      gooArms.drawCircle(armPoint.x, armPoint.y, 18 * (1 - localT * 0.3));
      gooArms.moveTo(cx, cy);
      gooArms.lineTo(armPoint.x, armPoint.y);
    }
    gooArms.endFill();

    enemyShape.clear();
    enemyShape.beginFill(0x111111, 0.9);
    for (let i = 0; i <= AXES; i += 1) {
      const idx = i % AXES;
      const base = (axisValues.enemy[idx] / MAX_STAT) * RADIUS;
      const wobble = Math.sin(time * 2 + idx) * 8;
      const pos = polar(cx, cy, idx, base + wobble);
      if (i === 0) enemyShape.moveTo(pos.x, pos.y);
      else enemyShape.lineTo(pos.x, pos.y);
    }
    enemyShape.closePath();
    enemyShape.endFill();

    playerShape.clear();
    playerShape.beginFill(0xf2c94c, 0.85);
    for (let i = 0; i < AXES * 2; i += 1) {
      const idx = Math.floor(i / 2);
      const base = (axisValues.player[idx] / MAX_STAT) * RADIUS;
      const radius = i % 2 === 0 ? base + 18 : base * 0.45;
      const angle = -Math.PI / 2 + (Math.PI * i) / AXES + Math.sin(time) * 0.02;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) playerShape.moveTo(x, y);
      else playerShape.lineTo(x, y);
    }
    playerShape.closePath();
    playerShape.endFill();
  };

  app.ticker.add(tick);

  return () => {
    app.ticker.remove(tick);
  };
}

function polar(cx: number, cy: number, index: number, radius: number) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / AXES;
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}
