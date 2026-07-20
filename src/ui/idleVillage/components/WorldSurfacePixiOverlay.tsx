import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { RuntimeObject } from '../../../engine/world/model/RuntimeObject';
import type { WorldSurfaceAnchor, WorldSurfaceManifest } from '../config/worldSurfaceConfig';

interface WorldSurfacePixiOverlayProps {
  manifest: WorldSurfaceManifest;
  camera: { panX: number; panY: number; zoom: number };
  objects: RuntimeObject[];
}

const DEFAULT_OBJECT_COLOR = 0xfbbf24;
const DEFAULT_OBJECT_RADIUS = 8;
const DEFAULT_TEXT_SIZE = 14;

function hexToNumber(color?: string): number {
  if (!color) return DEFAULT_OBJECT_COLOR;
  const hex = color.replace('#', '');
  const parsed = parseInt(hex, 16);
  return Number.isNaN(parsed) ? DEFAULT_OBJECT_COLOR : parsed;
}

function getObjectWorldPosition(object: RuntimeObject, anchors: WorldSurfaceAnchor[]): { x: number; y: number } {
  const { location } = object;

  if (location.mode === 'dynamic') {
    return { x: location.x, y: location.y };
  }

  if (location.mode === 'anchor') {
    const { anchorId } = location;
    const anchor = anchors.find((a) => a.id === anchorId);
    if (anchor) return { x: anchor.x, y: anchor.y };
  }

  if (location.mode === 'path') {
    const { pathId } = location;
    const anchor = anchors.find((a) => a.id === pathId);
    if (anchor) return { x: anchor.x, y: anchor.y };
  }

  return { x: 0, y: 0 };
}

function createObjectDisplay(object: RuntimeObject): PIXI.Container {
  try {
    const container = new PIXI.Container();
    container.label = object.id;

    const { renderMode, scale, tint } = object.visual;
    const color = hexToNumber(tint);
    const visualScale = scale > 0 ? scale : 1;

    if (renderMode === 'text') {
      const text = new PIXI.Text({
        text: object.visual.iconKey || '●',
        style: {
          fontSize: DEFAULT_TEXT_SIZE * visualScale,
          fill: color,
        },
      });
      text.anchor.set(0.5);
      container.addChild(text);
    } else {
      const radius =
        renderMode === 'particle'
          ? DEFAULT_OBJECT_RADIUS * 0.4 * visualScale
          : DEFAULT_OBJECT_RADIUS * visualScale;

      const graphics = new PIXI.Graphics();
      graphics.circle(0, 0, radius).fill({ color, alpha: renderMode === 'particle' ? 0.7 : 1 });

      if (object.visual.glow) {
        const glow = new PIXI.Graphics();
        glow.circle(0, 0, radius * 2).fill({ color, alpha: 0.3 });
        container.addChildAt(glow, 0);
      }

      container.addChild(graphics);
    }

    return container;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('WorldSurfacePixiOverlay: failed to create object display', object.id, err);
    throw err;
  }
}

function updateObjectAnimation(
  display: PIXI.Container,
  basePosition: { x: number; y: number },
  object: RuntimeObject,
  time: number,
): void {
  const { mode, speed } = object.animation;

  if (mode === 'idle' || speed <= 0) {
    display.position.set(basePosition.x, basePosition.y);
    display.scale.set(1);
    return;
  }

  const t = time * speed;

  switch (mode) {
    case 'float':
      display.position.set(basePosition.x, basePosition.y + Math.sin(t) * 4);
      break;
    case 'walk':
      display.position.set(
        basePosition.x + Math.cos(t) * 6,
        basePosition.y + Math.sin(t) * 3,
      );
      break;
    case 'pulse':
      display.position.set(basePosition.x, basePosition.y);
      display.scale.set(1 + Math.sin(t) * 0.2);
      break;
    default:
      display.position.set(basePosition.x, basePosition.y);
      break;
  }
}

/**
 * WebGL overlay that renders dynamic runtime objects on top of the DOM world surface.
 *
 * This is intended as the high-performance path when many objects (>50) or particle
 * systems would be too expensive for the DOM renderer. It is transparent and does not
 * capture pointer events, leaving pan/zoom interactions to the DOM renderer beneath.
 */
export const WorldSurfacePixiOverlay: React.FC<WorldSurfacePixiOverlayProps> = ({
  manifest,
  camera,
  objects,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const worldRef = useRef<PIXI.Container | null>(null);
  const objectsRef = useRef<PIXI.Container | null>(null);
  const objectMapRef = useRef<Map<string, { display: PIXI.Container; base: { x: number; y: number } }>>(
    new Map(),
  );
  const runtimeObjectsRef = useRef(objects);
  const cameraRef = useRef(camera);
  const timeRef = useRef(0);

  useEffect(() => {
    runtimeObjectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    cameraRef.current = camera;
    const world = worldRef.current;
    if (world) {
      world.position.set(-camera.panX * camera.zoom, -camera.panY * camera.zoom);
      world.scale.set(camera.zoom);
    }
  }, [camera]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let app: PIXI.Application | null = new PIXI.Application();
    const objectMap = objectMapRef.current;

    const antialias = manifest.renderer?.webglOptions?.antialias ?? true;
    const resolution =
      manifest.renderer?.webglOptions?.resolution ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

    const initTask = (async () => {
      await app!.init({
        backgroundAlpha: 0,
        antialias,
        resolution,
        autoDensity: true,
        resizeTo: container,
      });

      if (disposed) {
        app?.destroy(true, true);
        app = null;
        return;
      }

      app!.canvas.style.position = 'absolute';
      app!.canvas.style.inset = '0';
      app!.canvas.style.pointerEvents = 'none';
      container.appendChild(app!.canvas);

      const world = new PIXI.Container();
      const objectLayer = new PIXI.Container();
      world.addChild(objectLayer);
      app!.stage.addChild(world);

      world.position.set(-cameraRef.current.panX * cameraRef.current.zoom, -cameraRef.current.panY * cameraRef.current.zoom);
      world.scale.set(cameraRef.current.zoom);

      worldRef.current = world;
      objectsRef.current = objectLayer;
      appRef.current = app;

      const tick = (ticker: { deltaTime: number }) => {
        timeRef.current += ticker.deltaTime * 0.05;
        const time = timeRef.current;

        for (const [id, { display, base }] of objectMap) {
          const object = runtimeObjectsRef.current.find((o) => o.id === id);
          if (object) {
            updateObjectAnimation(display, base, object, time);
          }
        }
      };

      app!.ticker.add(tick);
    })();

    return () => {
      disposed = true;
      initTask.finally(() => {
        objectMap.forEach(({ display }) => display.destroy());
        objectMap.clear();
        worldRef.current?.destroy({ children: true });
        worldRef.current = null;
        objectsRef.current = null;
        if (app) {
          app.destroy(true, true);
          app = null;
          appRef.current = null;
        }
        container.replaceChildren();
      });
    };
  }, [manifest]);

  useEffect(() => {
    const objectLayer = objectsRef.current;
    const objectMap = objectMapRef.current;
    if (!objectLayer) return;

    const activeIds = new Set<string>();

    for (const object of objects) {
      activeIds.add(object.id);
      const existing = objectMap.get(object.id);
      if (existing) {
        existing.base = getObjectWorldPosition(object, manifest.anchors);
        continue;
      }

      const display = createObjectDisplay(object);
      const base = getObjectWorldPosition(object, manifest.anchors);
      display.position.set(base.x, base.y);
      objectLayer.addChild(display);
      objectMap.set(object.id, { display, base });
    }

    for (const [id, { display }] of objectMap) {
      if (!activeIds.has(id)) {
        objectLayer.removeChild(display);
        display.destroy();
        objectMap.delete(id);
      }
    }
  }, [objects, manifest.anchors]);

  return <div ref={containerRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
};

export default WorldSurfacePixiOverlay;
