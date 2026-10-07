import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  Application,
  Assets,
  Container,
  Mesh,
  MeshGeometry,
  Rectangle,
  Shader,
  Sprite,
  Texture,
} from 'pixi.js';
import { useWorldSurface } from '@/ui/idleVillage/hooks/useWorldSurface';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';
import { defaultSeaMarksConfig } from '@/ui/idleVillage/config/seaMarksConfig';
import { DEFAULT_SEA_PATTERN_CONFIG, type SeaPatternConfig } from '@/ui/idleVillage/components/WorldSurfaceSeaPatternOverlay';
import { DEFAULT_COAST_FOAM_CONFIG, type CoastFoamConfig } from '@/ui/idleVillage/components/WorldSurfaceCoastFoam';
import type { WorldSurfaceSafeFit as KitSafeFit } from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';

/** The kit's safe-fit plus extra open sea above and below (the kit only extends it sideways). */
export type WorldSurfaceSafeFit = KitSafeFit & { seaMarginYPx?: number };

/**
 * SPIKE (2026-10-01) — the /game-frame world drawn in ONE WebGL canvas with PixiJS:
 * base layers, mirrored sea margins, the open-sea pattern and the coastal foam as
 * shaders, painted waves, sea marks, cloud shadows, birds and clouds as sprites. Pan/zoom move one
 * container; nothing is re-rasterised. Effects reuse the DOM renderer's configs and
 * shader math so the two can be compared like for like.
 *
 * Not wired yet: POIs/anchors, regions, event shrouds, debug panel, cloud parallax.
 */
export interface PixiWorldMapEffects {
  seaPattern: boolean;
  coastFoam: boolean;
  waves: boolean;
  seaMarks: boolean;
  cloudShadows: boolean;
  birds: boolean;
  clouds: boolean;
}

export interface PixiWorldMapProps {
  manifestPath: string;
  hiddenLayerIds?: string[];
  safeFit?: WorldSurfaceSafeFit;
  recenterSignal?: number;
  effects?: Partial<PixiWorldMapEffects>;
  /** Overrides every cloud band's shadow opacity (the generated bands ship at 2-4%, which is invisible). */
  cloudShadowOpacity?: number;
  /** Where a cloud's shadow falls relative to the cloud, in world px (light from the top-left: down and right). A zero offset hides the shadow under its own cloud. */
  cloudShadowOffset?: { x: number; y: number };
  /** Cloud drift speed multiplier (the generated bands cross the world in 12-35 minutes). */
  cloudSpeed?: number;
  /** Stage colour behind the map; match the sea so seams between sprites cannot show a dark line. */
  stageColor?: string;
  seaPatternConfig?: SeaPatternConfig;
  coastFoamConfig?: CoastFoamConfig;
  onStats?: (stats: { textures: number; textureMB: number }) => void;
  /**
   * DOM content pinned to world points (POIs, markers). Each node is centred on its
   * point and kept there by the camera on every pan/zoom, without re-rendering React;
   * it keeps its own screen size, like a map marker.
   */
  anchors?: PixiMapAnchor[];
  /**
   * DOM content laid in world pixels and scaled with the map (unlike `anchors`, which keep their screen
   * size). The box is the manifest canvas; the render prop receives its size. It lets pointer events
   * through, so wrap interactive content in an element with `pointer-events: auto`.
   */
  worldLayer?: (canvas: { width: number; height: number }) => ReactNode;
}

export interface PixiMapAnchor {
  id: string;
  /** World pixels, same space as the manifest (`coordinateSystem.canvas`). */
  x: number;
  y: number;
  node: ReactNode;
}

/** World px a mirrored sea sprite overlaps its original (> 1 screen px at the lowest zoom). */
const MIRROR_OVERLAP_PX = 6;

const ALL_EFFECTS: PixiWorldMapEffects = { seaPattern: true, coastFoam: true, waves: true, seaMarks: true, cloudShadows: true, birds: true, clouds: true };

const VERT = `#version 300 es
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
`;

// Same math as WorldSurfaceSeaPatternOverlay, sampled in world px, masked by sea_mask.
const SEA_PATTERN_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 outColor;
uniform sampler2D uPattern;
uniform sampler2D uSeaMask;
uniform float uTime;
uniform vec2 uWorld;
uniform float uPatternScale;
uniform float uLineOpacity;
uniform vec3 uLineColor;
uniform float uMotion;
uniform float uMotionAmount;
uniform float uMotionPeriod;
uniform vec2 uMotionDir;
void main() {
  vec2 w = vUV * uWorld;
  vec2 offset = vec2(0.0);
  if (uMotion > 0.5 && uMotionPeriod > 0.0) {
    offset = uMotionDir * uMotionAmount * sin(uTime * 6.2831853 / uMotionPeriod);
  }
  float a = texture(uPattern, (w + offset) / uPatternScale).a * uLineOpacity * texture(uSeaMask, vUV).a;
  outColor = vec4(uLineColor * a, a);
}
`;

// Same math as WorldSurfaceCoastFoam (crests run in and dissolve before the shore).
const COAST_FOAM_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 outColor;
uniform sampler2D uDist;
uniform vec2 uWorld;
uniform float uTime;
uniform float uDMax;
uniform vec3 uFoamColor;
uniform float uStrength;
uniform float uDissolveStart;
uniform float uDissolveEnd;
uniform float uCrestSpeed;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec4 t = texture(uDist, vUV);
  float water = smoothstep(0.45, 0.6, t.g);
  float d = t.r * uDMax;
  if (water < 0.01 || d > 130.0) { outColor = vec4(0.0); return; }
  vec2 w = vUV * uWorld;
  float u = (d + uTime * uCrestSpeed) / 38.0 + vnoise(w * 0.004) * 1.5;
  float f = fract(u);
  float crest = smoothstep(0.78, 0.9, f) * (1.0 - smoothstep(0.9, 1.0, f));
  crest *= (1.0 - smoothstep(30.0, 110.0, d)) * smoothstep(uDissolveStart, uDissolveEnd, d);
  float lace = smoothstep(0.30, 0.62, vnoise(w * 0.09 + vec2(0.0, uTime * 0.05)));
  float a = clamp(crest * 0.55 * lace * water * uStrength, 0.0, 1.0);
  outColor = vec4(uFoamColor * a, a);
}
`;

const layerUrl = (world: string, file: string) =>
  file.includes('/')
    ? `/assets/atmosphere/${file.split('/').map(encodeURIComponent).join('/')}`
    : `/assets/world/${world}/base/layers/${encodeURIComponent(file)}`;

function quad(w: number, h: number) {
  return new MeshGeometry({
    positions: new Float32Array([0, 0, w, 0, w, h, 0, h]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
}

function hexToRgb01(hex: string): Float32Array {
  const n = parseInt(hex.slice(1), 16);
  return new Float32Array([((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]);
}

const smooth = (x: number) => x * x * (3 - 2 * x);
/** Piecewise ease between keyframes, like a CSS keyframe track with ease-in-out. */
function track(p: number, keys: [number, number][]): number {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i += 1) {
    const [p1, v1] = keys[i];
    const [p0, v0] = keys[i - 1];
    if (p <= p1) return v0 + (v1 - v0) * smooth((p - p0) / Math.max(1e-6, p1 - p0));
  }
  return keys[keys.length - 1][1];
}

export function PixiWorldMap({
  manifestPath,
  hiddenLayerIds = [],
  safeFit,
  recenterSignal = 0,
  effects,
  stageColor = '#0b1a24',
  worldLayer,
  cloudShadowOpacity,
  cloudShadowOffset = { x: 0, y: 0 },
  cloudSpeed = 1,
  seaPatternConfig = DEFAULT_SEA_PATTERN_CONFIG,
  coastFoamConfig = DEFAULT_COAST_FOAM_CONFIG,
  onStats,
  anchors = [],
}: PixiWorldMapProps) {
  const { manifest, cameraConfig } = useWorldSurface(manifestPath);
  const hostRef = useRef<HTMLDivElement>(null);
  const refitRef = useRef<(() => void) | null>(null);
  const anchorLayerRef = useRef<HTMLDivElement>(null);
  const worldBoxRef = useRef<HTMLDivElement>(null);
  /** Current camera, readable by the anchor layer between Pixi frames. */
  const camRef = useRef<{ panX: number; panY: number; zoom: number } | null>(null);
  const syncAnchors = useCallback(() => {
    const layer = anchorLayerRef.current;
    const cam = camRef.current;
    if (!layer) return;
    layer.style.visibility = cam ? 'visible' : 'hidden';
    if (!cam) return;
    for (const child of Array.from(layer.children) as HTMLElement[]) {
      const sx = (Number(child.dataset.worldX) - cam.panX) * cam.zoom;
      const sy = (Number(child.dataset.worldY) - cam.panY) * cam.zoom;
      child.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%)`;
    }
    const box = worldBoxRef.current;
    if (box) box.style.transform = `translate3d(${-cam.panX * cam.zoom}px, ${-cam.panY * cam.zoom}px, 0) scale(${cam.zoom})`;
  }, []);
  const [error, setError] = useState<string | null>(null);
  const fx = { ...ALL_EFFECTS, ...effects };
  const fxKey = JSON.stringify(fx);
  const hiddenKey = hiddenLayerIds.join('|');
  const safeFitKey = safeFit ? JSON.stringify(safeFit) : '';

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !manifest || !cameraConfig) return;
    let disposed = false;
    const app = new Application();
    const hidden = new Set(hiddenKey ? hiddenKey.split('|') : []);
    const fit = safeFitKey ? (JSON.parse(safeFitKey) as WorldSurfaceSafeFit) : undefined;
    const fxOn = JSON.parse(fxKey) as PixiWorldMapEffects;
    const canvas = manifest.coordinateSystem.canvas;
    const margin = fit?.seaMarginPx ?? 0;
    // Vertical sea is only ever the painted sea layer mirrored: land must never be reflected.
    const marginY = fit?.seaMarginYPx ?? 0;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let cleanupInput = () => {};
    let bytes = 0;
    let textureCount = 0;

    const load = async (url: string) => {
      const texture = (await Assets.load(url)) as Texture;
      texture.source.autoGenerateMipmaps = true;
      texture.source.updateMipmaps();
      bytes += texture.source.pixelWidth * texture.source.pixelHeight * 4 * 1.33;
      textureCount += 1;
      return texture;
    };

    (async () => {
      await app.init({
        resizeTo: host,
        background: stageColor,
        antialias: false,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        preference: 'webgl',
      });
      if (disposed) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);
      app.canvas.style.display = 'block';
      app.canvas.dataset.testid = 'pixi-world-canvas';

      const world = new Container();
      app.stage.addChild(world);

      // ── Base layers (+ mirrored sea margins for the base and sea layers) ──
      const layers = manifest.surfaceLayers
        .filter((l) => (l.opacity ?? 1) > 0 && !hidden.has(l.id) && !l.id.startsWith('event_shroud_'))
        .sort((a, b) => a.zIndex - b.zIndex);
      for (const layer of layers) {
        const texture = await load(layerUrl(manifest.world, layer.file));
        if (disposed) return;
        const place = (sprite: Sprite) => {
          const rect = layer.rect;
          if (rect) {
            sprite.x = (rect.x / rect.sourceWidth) * canvas.width;
            sprite.y = (rect.y / rect.sourceHeight) * canvas.height;
            sprite.width = (rect.width / rect.sourceWidth) * canvas.width;
            sprite.height = (rect.height / rect.sourceHeight) * canvas.height;
          } else {
            sprite.width = canvas.width;
            sprite.height = canvas.height;
          }
          sprite.alpha = layer.opacity ?? 1;
        };
        const sprite = new Sprite(texture);
        place(sprite);
        world.addChild(sprite);
        const isMirrorable = !layer.rect && (layer.id === 'base_flat' || layer.id === 'background' || layer.id === 'sea');
        if (isMirrorable && (margin > 0 || marginY > 0)) {
          // Mirrors reuse the same texture (no extra GPU memory) and overlap the original by more than
          // a screen pixel: butted edges leave the boundary pixel half-covered by each sprite, and the
          // stage shows through as a dark line.
          for (const xi of margin > 0 ? [-1, 0, 1] : [0]) {
            for (const yi of marginY > 0 && layer.id === 'sea' ? [-1, 0, 1] : [0]) {
              if (xi === 0 && yi === 0) continue;
              if (yi !== 0 && layer.id !== 'sea') continue;
              const mirror = new Sprite(texture);
              place(mirror);
              if (xi !== 0) {
                mirror.scale.x *= -1;
                mirror.x = xi < 0 ? MIRROR_OVERLAP_PX : canvas.width * 2 - MIRROR_OVERLAP_PX;
              }
              if (yi !== 0) {
                mirror.scale.y *= -1;
                mirror.y = yi < 0 ? MIRROR_OVERLAP_PX : canvas.height * 2 - MIRROR_OVERLAP_PX;
              }
              world.addChild(mirror);
            }
          }
        }
      }

      const ticks: ((seconds: number) => void)[] = [];

      // ── Cloud shadows: drift across the land, multiplied, masked to the land ──
      if (fxOn.cloudShadows) {
        const layer = new Container();
        const mask = new Sprite(await load('/assets/atmosphere/terrain/cloud_mask_land.png'));
        mask.width = canvas.width;
        mask.height = canvas.height;
        world.addChild(mask);
        layer.mask = mask;
        for (const band of atmosphereAssets.clouds) {
          for (const s of band.sprites) {
            const tex = await load(`/assets/atmosphere/${s.shadowSrc}`);
            const sprite = new Sprite(tex);
            const w = s.width * band.scale;
            sprite.width = w;
            sprite.height = tex.height * (w / tex.width);
            sprite.y = s.y + cloudShadowOffset.y;
            sprite.alpha = cloudShadowOpacity ?? band.shadowOpacity;
            sprite.blendMode = 'multiply';
            layer.addChild(sprite);
            ticks.push((t) => {
              const drift = band.driftSeconds / cloudSpeed;
              const p = (((t + s.delaySeconds) % drift) + drift) % drift / drift;
              sprite.x = -w + p * (canvas.width + w) + cloudShadowOffset.x;
            });
          }
        }
        world.addChild(layer);
      }

      // ── Open-sea pattern (shader) ──
      if (fxOn.seaPattern) {
        const pattern = await load('/assets/world/wanderlust/base/layers/sea_pattern_tile.png');
        pattern.source.style.addressMode = 'repeat';
        const seaMask = await load('/assets/atmosphere/terrain/sea_mask.webp');
        const rad = (seaPatternConfig.motionAngle * Math.PI) / 180;
        const shader = Shader.from({
          gl: { vertex: VERT, fragment: SEA_PATTERN_FRAG },
          resources: {
            uPattern: pattern.source,
            uSeaMask: seaMask.source,
            u: {
              uTime: { value: 0, type: 'f32' },
              uWorld: { value: new Float32Array([canvas.width, canvas.height]), type: 'vec2<f32>' },
              uPatternScale: { value: seaPatternConfig.patternScale, type: 'f32' },
              uLineOpacity: { value: seaPatternConfig.lineOpacity, type: 'f32' },
              uLineColor: { value: hexToRgb01(seaPatternConfig.lineColor), type: 'vec3<f32>' },
              uMotion: { value: seaPatternConfig.motionEnabled && !reducedMotion ? 1 : 0, type: 'f32' },
              uMotionAmount: { value: seaPatternConfig.motionAmount, type: 'f32' },
              uMotionPeriod: { value: seaPatternConfig.motionPeriod, type: 'f32' },
              uMotionDir: { value: new Float32Array([Math.cos(rad), Math.sin(rad)]), type: 'vec2<f32>' },
            },
          },
        });
        world.addChild(new Mesh({ geometry: quad(canvas.width, canvas.height), shader }));
        ticks.push((t) => {
          shader.resources.u.uniforms.uTime = t;
        });
      }

      // ── Painted waves and sea marks: fade in, hold, fade out, drift ──
      const seaMaskForMarks = fxOn.waves || fxOn.seaMarks ? await load('/assets/atmosphere/terrain/sea_mask.webp') : null;
      const addMarks = async (
        marks: { src: string; x: number; y: number; width: number; height: number; delaySeconds: number; flip?: boolean; driftX?: number; driftY?: number }[],
        cycleSeconds: number,
        visibleFraction: number,
        opacity: number,
        motion: (p: number, visible: number, mark: (typeof marks)[number]) => { dx: number; dy: number },
      ) => {
        const layer = new Container();
        if (seaMaskForMarks) {
          const mask = new Sprite(seaMaskForMarks);
          mask.width = canvas.width;
          mask.height = canvas.height;
          world.addChild(mask);
          layer.mask = mask;
        }
        const visible = Math.min(0.99, Math.max(0.01, visibleFraction));
        for (const mark of marks) {
          const tex = await load(`/assets/atmosphere/${mark.src}`);
          const sprite = new Sprite(tex);
          sprite.anchor.set(0.5, 0);
          const scale = Math.min(mark.width / tex.width, mark.height / tex.height);
          sprite.scale.set(scale * (mark.flip ? -1 : 1), scale);
          const baseX = mark.x + mark.width / 2;
          sprite.x = baseX;
          sprite.y = mark.y;
          sprite.alpha = 0;
          layer.addChild(sprite);
          ticks.push((t) => {
            const p = (((t + mark.delaySeconds) % cycleSeconds) + cycleSeconds) % cycleSeconds / cycleSeconds;
            sprite.alpha = opacity * track(p, [[0, 0], [visible * 0.22, 1], [visible * 0.78, 1], [visible, 0], [1, 0]]);
            const { dx, dy } = motion(p, visible, mark);
            sprite.x = baseX + dx;
            sprite.y = mark.y + dy;
          });
        }
        world.addChild(layer);
      };
      if (fxOn.seaMarks && defaultSeaMarksConfig.enabled) {
        const cfg = defaultSeaMarksConfig;
        await addMarks(cfg.marks, cfg.cycleSeconds, cfg.visibleFraction, cfg.opacity, (p, visible, m) => ({
          dx: track(p, [[0, 0], [visible * 0.78, 0], [visible, m.driftX ?? 0], [1, m.driftX ?? 0]]),
          dy: track(p, [[0, m.driftY ?? 0], [visible * 0.22, 0], [visible * 0.78, 0], [visible, -(m.driftY ?? 0)], [1, -(m.driftY ?? 0)]]),
        }));
      }
      if (fxOn.waves) {
        const cfg = atmosphereAssets.waves;
        await addMarks(cfg.marks, cfg.cycleSeconds, cfg.visibleFraction, cfg.opacity, (p, visible) => ({
          dx: 0,
          dy: track(p, [[0, cfg.bobWorldPx], [visible, -cfg.bobWorldPx], [1, -cfg.bobWorldPx]]),
        }));
      }
      // ── Coastal foam (shader) ──
      if (fxOn.coastFoam) {
        const dist = await load('/assets/atmosphere/terrain/coast_distance.webp');
        const c = coastFoamConfig;
        const shader = Shader.from({
          gl: { vertex: VERT, fragment: COAST_FOAM_FRAG },
          resources: {
            uDist: dist.source,
            u: {
              uTime: { value: 0, type: 'f32' },
              uWorld: { value: new Float32Array([canvas.width, canvas.height]), type: 'vec2<f32>' },
              uDMax: { value: 160, type: 'f32' },
              uFoamColor: { value: new Float32Array(c.color), type: 'vec3<f32>' },
              uStrength: { value: c.strength, type: 'f32' },
              uDissolveStart: { value: c.dissolveStartWorldPx, type: 'f32' },
              uDissolveEnd: { value: c.dissolveEndWorldPx, type: 'f32' },
              uCrestSpeed: { value: c.crestSpeedWorldPxPerSecond, type: 'f32' },
            },
          },
        });
        world.addChild(new Mesh({ geometry: quad(canvas.width, canvas.height), shader }));
        ticks.push((t) => {
          shader.resources.u.uniforms.uTime = reducedMotion ? 3 : t;
        });
      }

      // ── Birds: flocks crossing on a cycle, wings from a horizontal frame strip ──
      if (fxOn.birds && atmosphereAssets.birds && atmosphereAssets.birds.flights.length > 0) {
        const cfg = atmosphereAssets.birds;
        const strip = await load(`/assets/atmosphere/${cfg.strip}`);
        const fw = strip.source.width / cfg.frameCount;
        const frames = Array.from(
          { length: cfg.frameCount },
          (_, i) => new Texture({ source: strip.source, frame: new Rectangle(i * fw, 0, fw, strip.source.height) }),
        );
        const layer = new Container();
        const rnd = (min: number, max: number) => min + Math.random() * (max - min);
        for (const base of cfg.flights) {
          // Same per-session randomisation as WorldSurfaceBirds, so flocks never repeat exactly.
          const rawDx = base.dx * rnd(0.6, 1.4);
          const flight = {
            ...base,
            originX: Math.max(0, base.originX + rnd(-300, 300)),
            originY: Math.max(0, base.originY + rnd(-150, 150)),
            dx: rawDx,
            dy: base.dy * rnd(0.7, 1.3),
            startDelaySeconds: rnd(0, base.cycleSeconds),
            flightSeconds: base.flightSeconds * rnd(0.7, 1.4),
            cycleSeconds: base.cycleSeconds * rnd(0.8, 1.2),
            flapSeconds: base.flapSeconds * rnd(0.8, 1.3),
            opacity: Math.min(1, base.opacity * rnd(0.8, 1.1)),
          };
          const span = Math.min(0.99, Math.max(0.005, flight.flightSeconds / flight.cycleSeconds));
          for (const bird of base.birds) {
            const sprite = new Sprite(frames[0]);
            sprite.anchor.set(0.5);
            sprite.width = bird.width;
            sprite.height = bird.height;
            if (rawDx < 0) sprite.scale.x *= -1;
            const x0 = flight.originX + bird.offsetX + rnd(-20, 20) + bird.width / 2;
            const y0 = flight.originY + bird.offsetY + rnd(-10, 10) + bird.height / 2;
            const delay = Math.max(0, Math.min(1, bird.delayFraction + rnd(-0.05, 0.05))) * flight.flightSeconds - flight.startDelaySeconds;
            sprite.alpha = 0;
            layer.addChild(sprite);
            ticks.push((t) => {
              const p = ((((t - delay) % flight.cycleSeconds) + flight.cycleSeconds) % flight.cycleSeconds) / flight.cycleSeconds;
              const along = Math.min(1, p / span);
              sprite.x = x0 + flight.dx * along;
              sprite.y = y0 + flight.dy * along;
              sprite.alpha = flight.opacity * track(p, [[0, 0], [span * 0.12, 1], [span * 0.7, 1], [span, 0], [1, 0]]);
              sprite.texture = frames[Math.floor(t / (flight.flapSeconds / cfg.frameCount)) % cfg.frameCount];
            });
          }
        }
        world.addChild(layer);
      }

      // ── Clouds: the same bands as their shadows, drifting above everything ──
      if (fxOn.clouds) {
        const layer = new Container();
        for (const band of atmosphereAssets.clouds) {
          for (const s of band.sprites) {
            const tex = await load(`/assets/atmosphere/${s.src}`);
            const sprite = new Sprite(tex);
            const w = s.width * band.scale;
            sprite.width = w;
            sprite.height = tex.height * (w / tex.width);
            sprite.y = s.y;
            sprite.alpha = band.opacity;
            layer.addChild(sprite);
            ticks.push((t) => {
              const drift = band.driftSeconds / cloudSpeed;
              const p = ((((t + s.delaySeconds) % drift) + drift) % drift) / drift;
              sprite.x = -w + p * (canvas.width + w);
            });
          }
        }
        world.addChild(layer);
      }

      if (disposed) return;
      onStats?.({ textures: textureCount, textureMB: Math.round(bytes / 1048576) });

      const start = performance.now();
      app.ticker.add(() => {
        const t = reducedMotion ? 0 : (performance.now() - start) / 1000;
        for (const tick of ticks) tick(t);
      });

      // ── Camera: safe-fit like the DOM kit, pan bounded to canvas ± sea margin ──
      const cam = { panX: 0, panY: 0, zoom: 1 };
      const floorZoom = () =>
        Math.max(app.screen.width / (canvas.width + 2 * margin), app.screen.height / (canvas.height + 2 * marginY));
      const apply = () => {
        cam.zoom = Math.min(cameraConfig.maxZoom, Math.max(floorZoom(), cam.zoom));
        const visW = app.screen.width / cam.zoom;
        const visH = app.screen.height / cam.zoom;
        cam.panX = Math.min(Math.max(cam.panX, -margin), Math.max(-margin, canvas.width + margin - visW));
        cam.panY = Math.min(Math.max(cam.panY, -marginY), Math.max(-marginY, canvas.height + marginY - visH));
        world.scale.set(cam.zoom);
        world.position.set(-cam.panX * cam.zoom, -cam.panY * cam.zoom);
        camRef.current = cam;
        syncAnchors();
      };
      const refit = () => {
        const W = app.screen.width;
        const H = app.screen.height;
        if (fit) {
          const left = fit.insets.left ?? 0;
          const right = fit.insets.right ?? 0;
          const freeW = W - left - right;
          const freeH = H - fit.insets.top - fit.insets.bottom;
          const land = fit.landBounds;
          cam.zoom = Math.max(floorZoom(), Math.min(freeW / (land.x1 - land.x0), freeH / (land.y1 - land.y0)));
          cam.panX = (land.x0 + land.x1) / 2 - (left + freeW / 2) / cam.zoom;
          cam.panY = (land.y0 + land.y1) / 2 - (fit.insets.top + freeH / 2) / cam.zoom;
        } else {
          cam.zoom = Math.max(W / canvas.width, H / canvas.height);
          cam.panX = (canvas.width - W / cam.zoom) / 2;
          cam.panY = (canvas.height - H / cam.zoom) / 2;
        }
        apply();
      };
      refit();
      refitRef.current = refit;

      let userMoved = false;
      let drag: { x: number; y: number } | null = null;
      const el = app.canvas;
      const onDown = (e: MouseEvent) => {
        drag = { x: e.clientX, y: e.clientY };
      };
      const onMove = (e: MouseEvent) => {
        if (!drag) return;
        cam.panX -= (e.clientX - drag.x) / cam.zoom;
        cam.panY -= (e.clientY - drag.y) / cam.zoom;
        drag = { x: e.clientX, y: e.clientY };
        userMoved = true;
        apply();
      };
      const onUp = () => {
        drag = null;
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const sx = e.clientX - r.left;
        const sy = e.clientY - r.top;
        const wx = cam.panX + sx / cam.zoom;
        const wy = cam.panY + sy / cam.zoom;
        cam.zoom *= e.deltaY < 0 ? 1.1 : 1 / 1.1;
        cam.zoom = Math.min(cameraConfig.maxZoom, Math.max(floorZoom(), cam.zoom));
        cam.panX = wx - sx / cam.zoom;
        cam.panY = wy - sy / cam.zoom;
        userMoved = true;
        apply();
      };
      const onResize = () => (userMoved ? apply() : refit());
      el.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      el.addEventListener('wheel', onWheel, { passive: false });
      app.renderer.on('resize', onResize);
      cleanupInput = () => {
        el.removeEventListener('mousedown', onDown);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        el.removeEventListener('wheel', onWheel);
        refitRef.current = null;
        camRef.current = null;
      };
    })().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));

    return () => {
      disposed = true;
      cleanupInput();
      try {
        app.destroy(true, { children: true, texture: false });
      } catch {
        /* init may not have finished */
      }
    };
  }, [manifest, cameraConfig, hiddenKey, safeFitKey, fxKey, seaPatternConfig, coastFoamConfig, cloudShadowOpacity, cloudShadowOffset.x, cloudShadowOffset.y, cloudSpeed, onStats, syncAnchors]);

  // New or moved anchors get placed before paint, not on the next camera move.
  useLayoutEffect(syncAnchors);

  useEffect(() => {
    if (recenterSignal > 0) refitRef.current?.();
  }, [recenterSignal]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={hostRef} className="cursor-grab" style={{ position: 'absolute', inset: 0 }} />
      <div
        ref={anchorLayerRef}
        data-testid="pixi-world-anchors"
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', visibility: 'hidden' }}
      >
        {anchors.map((anchor) => (
          <div
            key={anchor.id}
            data-anchor-id={anchor.id}
            data-world-x={anchor.x}
            data-world-y={anchor.y}
            style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'auto' }}
          >
            {anchor.node}
          </div>
        ))}
      </div>
      {worldLayer && manifest && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div
            ref={worldBoxRef}
            data-testid="pixi-world-layer"
            style={{ position: 'absolute', left: 0, top: 0, width: manifest.coordinateSystem.canvas.width, height: manifest.coordinateSystem.canvas.height, transformOrigin: '0 0', pointerEvents: 'none' }}
          >
            {worldLayer(manifest.coordinateSystem.canvas)}
          </div>
        </div>
      )}
      {error && <p style={{ position: 'absolute', top: 8, left: 8, color: '#f87171' }}>{error}</p>}
    </div>
  );
}

export default PixiWorldMap;
