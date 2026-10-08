import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  Application,
  Assets,
  Container,
  Graphics,
  Mesh,
  MeshGeometry,
  MeshPlane,
  Rectangle,
  Shader,
  Sprite,
  Texture,
  TilingSprite,
  DisplacementFilter,
  AlphaFilter,
} from 'pixi.js';
import { createRefractionNoise, createSeabedArt } from './seabedTexture';
import { useWorldSurface } from '@/ui/idleVillage/hooks/useWorldSurface';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';
import { defaultSeaMarksConfig } from '@/ui/idleVillage/config/seaMarksConfig';
import { seaWonderCatalog, wonderSpawnDefaults } from '@/ui/idleVillage/config/seaWonders';
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
  seabed: boolean;
  wonders: boolean;
  landLife: boolean;
}

/** A territory of the id map (`scripts/bake-region-ids.py`). `center` is a fraction of the world canvas. */
export interface PixiRegion {
  id: string;
  index: number;
  center: [number, number];
}

/** What the pointer is over: the region and where the pointer is, in px relative to the map. */
export interface PixiRegionHover {
  region: PixiRegion;
  x: number;
  y: number;
}

/** Look-and-feel numbers of the map the Tuning panel can change live. */
export interface PixiMapTune {
  /** Multiplier on how far each cloud layer slides against the ground when the camera pans (0 = glued). */
  cloudParallax: number;
  /** Multiplier on how much a cloud swells, narrows and tilts as it drifts (0 = rigid). */
  cloudMorph: number;
  /** Opacity multiplier of the village smoke (0 = off). */
  smokeAmount: number;
  /** Seconds between two sea wonders surfacing (kraken, whale, ship): the shortest wait; the longest is 1.9x. */
  wonderEveryS: number;
  /** How far (world px) the painted sea's edge colour holds before sinking into deep water. */
  deepSeaFadePx: number;
  /** How far (world px) the forest canopies sway in the wind; 0 keeps them still. */
  forestSway: number;
  /** Speed multiplier of the wind over the forests (1 = a gust every ~8 s). */
  forestSwaySpeed: number;
  /** Thickness of a hovered territory's ink border, in world px. */
  regionLinePx: number;
  /** Seconds a territory must be hovered before it lights up and shows its name. */
  regionHoverDelayS: number;
  /** No two waves or sea marks play closer than this (world px). */
  markSpacingPx: number;
}

export const DEFAULT_MAP_TUNE: PixiMapTune = {
  cloudParallax: 1,
  cloudMorph: 1,
  smokeAmount: 1,
  wonderEveryS: 18,
  deepSeaFadePx: 650,
  forestSway: 4,
  forestSwaySpeed: 1,
  regionLinePx: 14,
  regionHoverDelayS: 1,
  markSpacingPx: 900,
};

export interface PixiWorldMapProps {
  /**
   * Time of day as a grade over the whole map: `light` 1 = full day, 0 = deepest night; `warm` 0-1 = the amber of
   * dawn and dusk. The map eases toward it over a few seconds; omit for plain daylight.
   */
  ambient?: { light: number; warm: number };
  /** Live look-and-feel numbers (defaults in `DEFAULT_MAP_TUNE`). */
  tune?: Partial<PixiMapTune>;
  manifestPath: string;
  hiddenLayerIds?: string[];
  safeFit?: WorldSurfaceSafeFit;
  recenterSignal?: number;
  /** Glide the camera to a point (fractions of the world canvas, 0-1); `n` makes a repeat request on the same point count. */
  focusRequest?: { x: number; y: number; n: number } | null;
  effects?: Partial<PixiWorldMapEffects>;
  /** Overrides every cloud band's shadow opacity (the generated bands ship at 2-4%, which is invisible). */
  cloudShadowOpacity?: number;
  /** Where a cloud's shadow falls relative to the cloud, in world px (light from the top-left: down and right). A zero offset hides the shadow under its own cloud. */
  cloudShadowOffset?: { x: number; y: number };
  /** Cloud drift speed multiplier (the generated bands cross the world in 12-35 minutes). */
  cloudSpeed?: number;
  /**
   * Translucent sea: a seabed (ruins, chests) shows through the water and slides slower than the
   * camera, so panning reads as depth. `opacity` is how much of it shows; `parallax` < 1 is its
   * speed against the camera (1 = glued to the map). Omit to keep the sea opaque.
   */
  seabed?: { opacity: number; parallax: number };
  /** Clickable territories: hover lights one up and reports it; a click (not a drag) selects it. Off when omitted. */
  regions?: { assetBase: string; onHover?: (hover: PixiRegionHover | null) => void; onSelect?: (region: PixiRegion) => void };
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


const ALL_EFFECTS: PixiWorldMapEffects = { seaPattern: true, coastFoam: true, waves: true, seaMarks: true, cloudShadows: true, birds: true, clouds: true, seabed: true, wonders: true, landLife: true };

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
uniform vec4 uExtent;
uniform float uPatternScale;
uniform float uLineOpacity;
uniform vec3 uLineColor;
uniform float uMotion;
uniform float uMotionAmount;
uniform float uMotionPeriod;
uniform vec2 uMotionDir;
void main() {
  vec2 w = uExtent.xy + vUV * uExtent.zw;
  vec2 maskUV = w / uWorld;
  // Past the painted canvas the mirrored margins are open water all the way.
  float sea = (maskUV.x < 0.0 || maskUV.y < 0.0 || maskUV.x > 1.0 || maskUV.y > 1.0) ? 1.0 : clamp((texture(uSeaMask, maskUV).a - 0.16) * 1.8, 0.0, 1.0);
  vec2 offset = vec2(0.0);
  if (uMotion > 0.5 && uMotionPeriod > 0.0) {
    offset = uMotionDir * uMotionAmount * sin(uTime * 6.2831853 / uMotionPeriod);
  }
  float a = texture(uPattern, (w + offset) / uPatternScale).a * uLineOpacity * sea;
  outColor = vec4(uLineColor * a, a);
}
`;


// The sea beyond the painted canvas: the painted sea's own edge colour (blurred along the edge, so no streaks),
// sinking into a deeper teal and a soft fog the further out it goes. No second copy of the map, no mirrored land.
const DEEP_SEA_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 outColor;
uniform sampler2D uSea;
uniform sampler2D uSeaMask;
uniform vec4 uExt;
uniform vec2 uWorld;
uniform vec3 uDeep;
uniform vec3 uFog;
uniform float uFade;
uniform float uBand;
uniform float uTime;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec2 w = uExt.xy + vUV * uExt.zw;
  vec2 uv = w / uWorld;
  bool inside = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
  // Inside the painted canvas the deep sea only lays a fading veil over open water near the edge, so the two
  // meet in a gradient instead of a rectangle.
  float inner = inside ? min(min(uv.x * uWorld.x, (1.0 - uv.x) * uWorld.x), min(uv.y * uWorld.y, (1.0 - uv.y) * uWorld.y)) : 0.0;
  float veil = inside ? (1.0 - smoothstep(48.0, uBand, inner)) * clamp((textureLod(uSeaMask, uv, 0.0).a - 0.16) * 1.8, 0.0, 1.0) : 1.0;
  if (veil <= 0.001) { outColor = vec4(0.0); return; }
  // Explicit mip 0 everywhere: the uv mapping jumps at the canvas edge, and automatic mip selection there picked a
  // coarser level for one pixel row, drawing a thin dark line.
  vec2 c = clamp(uv, vec2(0.0035), vec2(0.9965));
  bool sideEdge = uv.x < 0.0 || uv.x > 1.0;
  bool capEdge = uv.y < 0.0 || uv.y > 1.0;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = -6; i <= 6; i++) {
    float o = float(i) * 0.0035;
    vec4 a = sideEdge ? textureLod(uSea, c + vec2(0.0, o), 0.0) : textureLod(uSea, c + vec2(o, 0.0), 0.0);
    // Pixi uploads textures premultiplied: the rgb is already weighted by its alpha.
    acc += a.rgb;
    wsum += a.a;
    if (sideEdge && capEdge) {
      vec4 b = textureLod(uSea, c + vec2(o, 0.0), 0.0);
      acc += b.rgb;
      wsum += b.a;
    }
  }
  vec3 edge = wsum > 0.5 ? acc / wsum : uDeep;
  float dist = max(max(-uv.x * uWorld.x, (uv.x - 1.0) * uWorld.x), max(-uv.y * uWorld.y, (uv.y - 1.0) * uWorld.y));
  float k = smoothstep(0.0, uFade, dist);
  vec3 col = mix(edge, uDeep, k);
  // Slow drifting darker and lighter swells, so the open water is never a flat fill.
  float swell = vnoise(w * 0.0016 + vec2(uTime * 0.01, -uTime * 0.007)) * 0.6 + vnoise(w * 0.0045 - vec2(uTime * 0.014, 0.0)) * 0.4;
  col *= 0.86 + swell * 0.26;
  // Fog of the unexplored: the far edge of the world fades toward the page colour.
  col = mix(col, uFog, smoothstep(uFade * 0.8, uFade * 2.6, dist) * 0.55);
  outColor = vec4(col * veil, veil);
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

/** Extra distance past the sea margin where a cloud starts and ends its crossing. */
const CLOUD_ENTRY_PAD_PX = 200;
/** Open water past the painted sea: its deep colour, the fog of the unexplored, and how far (world px) the edge colour holds. */
const DEEP_SEA_COLOR = '#215c70';
const DEEP_SEA_FOG = '#16394a';
/** Width (world px) of the fade inside the canvas where the deep sea meets the painted sea. */
const DEEP_SEA_BAND_PX = 420;
/** Cloud layers (far, mid, near): how much further than the ground each slides when the camera pans. */
const CLOUD_PARALLAX = [0.1, 0.22, 0.4] as const;
/** Village roofs where smoke rises (world px), puffs per chimney, and a puff's life. */
const VILLAGE_CHIMNEYS = [
  { x: 2119, y: 1473 },
  { x: 1997, y: 1503 },
  { x: 2254, y: 1525 },
] as const;
const SMOKE_PUFFS = 5;
const SMOKE_LIFE_S = 7;

/** Supersampling of a hovered territory's outline (mask pixels -> outline pixels), so its edge is smooth. */
const REGION_RASTER_SCALE = 2;
/** Colour of a hovered territory's border (ink black, like a board-game province). */
const REGION_EDGE_RGBA = [16, 12, 8, 255];
/** Glass globe (hold Alt): how far the map tips toward the pointer, and how far the seabed slides with it (world px). */
const GLOBE_TILT_DEG = 7;
const GLOBE_BED_SHIFT_PX = 140;
/** Pointer dwell before a territory lights up and shows its name. */
/** No two waves or sea marks play at the same time closer than this (world px). */
/** Sea wonders: how often one may surface, how long it stays, how big it is on the map (world px wide). */
const WONDER_LIFETIME_S = 9;
const WONDER_WIDTH_PX = 300;

/** Clouds within this many world px of a map anchor fade to CLOUD_CLEAR_MIN of their opacity. */
const CLOUD_CLEAR_RADIUS_PX = 260;
const CLOUD_CLEAR_MIN = 0.12;

/** Colour and extra softness of a cloud's shadow (on land and sea). */
const CLOUD_SHADOW_COLOR = '#0b1a14';
const CLOUD_SHADOW_BLUR_PX = 10;



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
  focusRequest = null,
  effects,
  stageColor = '#0b1a24',
  worldLayer,
  cloudShadowOpacity,
  cloudShadowOffset = { x: 0, y: 0 },
  cloudSpeed = 1,
  seabed,
  regions,
  tune: tuneProp,
  ambient,
  seaPatternConfig = DEFAULT_SEA_PATTERN_CONFIG,
  coastFoamConfig = DEFAULT_COAST_FOAM_CONFIG,
  onStats,
  anchors = [],
}: PixiWorldMapProps) {
  const { manifest, cameraConfig } = useWorldSurface(manifestPath);
  const hostRef = useRef<HTMLDivElement>(null);
  const refitRef = useRef<(() => void) | null>(null);
  /** Anchors the clouds must clear: read every frame, so POIs that come and go need no map rebuild. */
  const anchorsRef = useRef(anchors);
  anchorsRef.current = anchors;
  const tune = { ...DEFAULT_MAP_TUNE, ...tuneProp };
  const tuneKey = JSON.stringify(tune);
  const ambientRef = useRef(ambient);
  ambientRef.current = ambient;
  const regionsRef = useRef(regions);
  regionsRef.current = regions;
  const regionsOn = !!regions;
  const focusRef = useRef<((x: number, y: number) => void) | null>(null);
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
    const tn = JSON.parse(tuneKey) as PixiMapTune;
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
      /** The painted sea and the deep sea around it: the see-through reveal thins them out as one. */
      const seaSprites: Container[] = [];
      let seaTexture: Texture | null = null;
      const canopySway: { positions: Float32Array; orig: Float32Array; buffer: { update: () => void }; scale: number; phase: number }[] = [];
      // The forest canopies, cut from the same base they sway over (see scripts/build-canopy.py): a mesh whose vertices
      // roll in a slow wave, so the crowns breathe with the wind. The base underneath has no canopy to double up with.
      const addCanopies = async (variant: string) => {
        const layered = (await fetch('/assets/world/wanderlust/base/manifest.json').then((r) => r.json())) as {
          surfaceLayers: { id: string; file: string; rect?: { x: number; y: number; width: number; height: number; sourceWidth: number; sourceHeight: number } }[];
        };
        for (const l of layered.surfaceLayers) {
          if (!l.rect || !/forest|trees/.test(l.id)) continue;
          const stem = l.file.replace('.webp', '');
          const tex = await load(layerUrl(manifest.world, `${stem}.canopy${variant}.webp`));
          if (disposed) return;
          const r = l.rect;
          const colsX = Math.max(6, Math.round(tex.width / 28));
          const rowsY = Math.max(5, Math.round(tex.height / 28));
          const mesh = new MeshPlane({ texture: tex, verticesX: colsX, verticesY: rowsY });
          mesh.position.set((r.x / r.sourceWidth) * canvas.width, (r.y / r.sourceHeight) * canvas.height);
          const scale = ((r.width / r.sourceWidth) * canvas.width) / tex.width;
          mesh.scale.set(scale, ((r.height / r.sourceHeight) * canvas.height) / tex.height);
          world.addChild(mesh);
          const positions = mesh.geometry.positions;
          canopySway.push({ positions, orig: Float32Array.from(positions), buffer: mesh.geometry.getBuffer('aPosition'), scale, phase: canopySway.length * 1.7 });
        }
      };
      const layers = manifest.surfaceLayers
        .filter((l) => (l.opacity ?? 1) > 0 && !hidden.has(l.id) && !l.id.startsWith('event_shroud_'))
        .sort((a, b) => a.zIndex - b.zIndex);
      const canopyOn = fxOn.landLife && !reducedMotion && tn.forestSway > 0;
      for (const layer of layers) {
        const swapBase = canopyOn && layer.id === 'base_flat';
        const texture = await load(layerUrl(manifest.world, swapBase ? layer.file.replace('.webp', '.nocanopy.webp') : layer.file));
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
        if (layer.id === 'sea') {
          seaSprites.push(sprite);
          seaTexture = texture;
        }
        if (swapBase) await addCanopies(layer.file.includes('.graded') ? '.graded' : '');
      }

      const ticks: ((seconds: number) => void)[] = [];
      const bandLayers: { layer: Container; parallax: number }[] = [];
      // Time of day: a multiply wash over the whole world (no filter: a world-sized filter renders off-screen at a lower
      // resolution and blurred everything). Night tints blue-grey and darker, dawn and dusk amber; eased slowly.
      const wash = new Sprite(Texture.WHITE);
      wash.blendMode = 'multiply';
      wash.visible = false;
      const lit = { light: 1, warm: 0 };
      ticks.push(() => {
        const target = ambientRef.current ?? { light: 1, warm: 0 };
        lit.light += (target.light - lit.light) * 0.015;
        lit.warm += (target.warm - lit.warm) * 0.015;
        if (lit.light > 0.995 && lit.warm < 0.005) {
          wash.visible = false;
          return;
        }
        const night = 1 - lit.light;
        const r = (1 - 0.52 * night) * (1 - 0.02 * lit.warm);
        const g = (1 - 0.44 * night) * (1 - 0.13 * lit.warm);
        const b = (1 - 0.22 * night) * (1 - 0.32 * lit.warm);
        wash.tint = (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
        if (wash.parent !== world || world.getChildIndex(wash) !== world.children.length - 1) world.addChild(wash);
        wash.position.set(-margin - 2000, -marginY - 2000);
        wash.width = canvas.width + 2 * margin + 4000;
        wash.height = canvas.height + 2 * marginY + 4000;
        wash.visible = true;
      });
      ticks.push((t) => {
        for (const c of canopySway) {
          const amp = tn.forestSway / c.scale;
          const { positions: pos, orig } = c;
          for (let i = 0; i < pos.length; i += 2) {
            const x = orig[i];
            const y = orig[i + 1];
            // A slow wave of wind rolling over the crowns, with a quicker flutter riding on it.
            const ts = t * tn.forestSwaySpeed;
            const wave = Math.sin(ts * 0.8 + x * 0.014 + y * 0.01 + c.phase) + 0.45 * Math.sin(ts * 1.9 + x * 0.05 - y * 0.04 + c.phase * 2);
            pos[i] = x + amp * wave * 0.6;
            pos[i + 1] = y + amp * Math.cos(ts * 0.7 + x * 0.011 - y * 0.012 + c.phase) * 0.35;
          }
          c.buffer.update();
        }
      });
      // Clouds (and their shadows) cross the whole mirrored world, entering and leaving beyond what the camera can
      // show: they never pop into view half-formed at the edge of the screen.
      const cloudX = (p: number, w: number) => -margin - w - CLOUD_ENTRY_PAD_PX + p * (canvas.width + 2 * margin + 2 * w + 2 * CLOUD_ENTRY_PAD_PX);

      // ── Deep sea around the painted canvas (replaces the mirrored copies of the map) ──
      if (seaTexture && (margin > 0 || marginY > 0)) {
        const edge = seaTexture as Texture;
        const deepSeaMask = await load('/assets/atmosphere/terrain/sea_mask.webp');
        edge.source.style.addressMode = 'clamp-to-edge';
        const extX = -margin;
        const extY = -marginY;
        const extW = canvas.width + 2 * margin;
        const extH = canvas.height + 2 * marginY;
        const shader = Shader.from({
          gl: { vertex: VERT, fragment: DEEP_SEA_FRAG },
          resources: {
            uSea: edge.source,
            uSeaMask: deepSeaMask.source,
            u: {
              uExt: { value: new Float32Array([extX, extY, extW, extH]), type: 'vec4<f32>' },
              uWorld: { value: new Float32Array([canvas.width, canvas.height]), type: 'vec2<f32>' },
              uDeep: { value: hexToRgb01(DEEP_SEA_COLOR), type: 'vec3<f32>' },
              uFog: { value: hexToRgb01(DEEP_SEA_FOG), type: 'vec3<f32>' },
              uFade: { value: tn.deepSeaFadePx, type: 'f32' },
              uBand: { value: DEEP_SEA_BAND_PX, type: 'f32' },
              uTime: { value: 0, type: 'f32' },
            },
          },
        });
        const deepSea = new Mesh({ geometry: quad(extW, extH), shader });
        deepSea.position.set(extX, extY);
        world.addChild(deepSea);
        seaSprites.push(deepSea);
        ticks.push((t) => {
          shader.resources.u.uniforms.uTime = reducedMotion ? 0 : t;
        });
      }

      // ── See-through sea: a seabed under the painted water, shown only while the map is dragged ──
      // Absorption-style look: the water thins out over a light, sandy floor (so it reads as clear water, not
      // as darker water), with two depth layers that slide at different speeds and tilt with the drag, a
      // refraction wobble and moving caustics. The sea mask keeps it off the land.
      const seabedReveal = { target: 0, value: 0, tiltX: 0, tiltY: 0, tiltTargetX: 0, tiltTargetY: 0 };
      let seabedShift: (panX: number, panY: number, viewW: number, viewH: number) => void = () => {};
      if (fxOn.seabed && seabed && seabed.opacity > 0 && seaSprites.length > 0) {
        const pad = 420;
        const extX = -margin - pad;
        const extY = -marginY - pad;
        const extW = canvas.width + 2 * (margin + pad);
        const extH = canvas.height + 2 * (marginY + pad);
        const texW = Math.min(2048, Math.round(extW / 2));
        const art = createSeabedArt(texW, Math.round((texW * extH) / extW));
        const glintCanvas = document.createElement('canvas');
        glintCanvas.width = 32;
        glintCanvas.height = 32;
        const gctx = glintCanvas.getContext('2d');
        if (gctx) {
          const g = gctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          g.addColorStop(0, 'rgba(255,236,170,0.95)');
          g.addColorStop(1, 'rgba(255,236,170,0)');
          gctx.fillStyle = g;
          gctx.fillRect(0, 0, 32, 32);
          gctx.fillStyle = 'rgba(255,246,210,0.9)';
          gctx.fillRect(15, 2, 2, 28);
          gctx.fillRect(2, 15, 28, 2);
        }
        const glintTexture = Texture.from(glintCanvas);
        const seaMaskForBed = await load('/assets/atmosphere/terrain/sea_mask.webp');
        const causticTexture = await load('/assets/world/wanderlust/base/layers/sea_pattern_tile.png');
        causticTexture.source.style.addressMode = 'repeat';
        if (disposed) return;

        // Far layer: sand floor + caustics drifting over it.
        const far = new Container();
        const floor = new Sprite(Texture.from(art.floor));
        floor.width = extW;
        floor.height = extH;
        far.addChild(floor);
        const caustics = new TilingSprite({ texture: causticTexture, width: extW, height: extH });
        caustics.tileScale.set(1.6);
        caustics.tint = 0xfff6d8;
        caustics.alpha = 0.55;
        caustics.blendMode = 'add';
        far.addChild(caustics);
        ticks.push((t) => {
          caustics.tilePosition.set(Math.sin(t * 0.21) * 40 + t * 6, Math.cos(t * 0.17) * 40 + t * 4);
        });

        // Near layer: rocks, ruins, chests and their glints.
        const near = new Container();
        const objects = new Sprite(Texture.from(art.objects));
        objects.width = extW;
        objects.height = extH;
        near.addChild(objects);
        art.glints.forEach((glint, index) => {
          const star = new Sprite(glintTexture);
          star.anchor.set(0.5);
          star.x = glint.u * extW;
          star.y = glint.v * extH;
          star.scale.set(1.6);
          star.alpha = 0;
          near.addChild(star);
          if (!reducedMotion || index === 0) {
            ticks.push((t) => {
              const p = (((t + glint.phase) % glint.period) + glint.period) % glint.period / glint.period;
              star.alpha = reducedMotion ? 0.5 : Math.max(0, Math.sin(p * Math.PI)) ** 3 * 0.9;
            });
          }
        });

        // One mask for the whole bed: the painted sea mask inside the canvas (its open water lifted to full
        // strength — it fades to ~75% near the edges, which drew a rectangle) and open water all around it.
        const maskScale = 0.25;
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = Math.ceil(extW * maskScale);
        maskCanvas.height = Math.ceil(extH * maskScale);
        const mctx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (mctx) {
          const cx = Math.round((0 - extX) * maskScale);
          const cy = Math.round((0 - extY) * maskScale);
          const cw = Math.round(canvas.width * maskScale);
          const ch = Math.round(canvas.height * maskScale);
          mctx.drawImage(seaMaskForBed.source.resource as CanvasImageSource, cx, cy, cw, ch);
          const data = mctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
          for (let y = 0; y < maskCanvas.height; y += 1) {
            for (let x = 0; x < maskCanvas.width; x += 1) {
              const i = (y * maskCanvas.width + x) * 4;
              const inside = x >= cx && x < cx + cw && y >= cy && y < cy + ch;
              const a = inside ? Math.min(255, Math.max(0, (data.data[i + 3] - 40) * 1.8)) : 255;
              data.data[i] = 255;
              data.data[i + 1] = 255;
              data.data[i + 2] = 255;
              data.data[i + 3] = a;
            }
          }
          mctx.putImageData(data, 0, 0);
        }
        const bedMask = new Sprite(Texture.from(maskCanvas));
        bedMask.x = extX;
        bedMask.y = extY;
        bedMask.width = extW;
        bedMask.height = extH;
        const bedBox = new Container();
        bedBox.mask = bedMask;
        bedBox.addChild(far, near);
        bedBox.visible = false;

        // Refraction: a slow wobble over the whole bed (only while it is visible).
        const noise = new Sprite(Texture.from(createRefractionNoise()));
        noise.texture.source.style.addressMode = 'repeat';
        noise.renderable = false;
        noise.scale.set(6);
        const refraction = new DisplacementFilter({ sprite: noise, scale: 14, resolution: app.renderer.resolution });
        ticks.push((t) => {
          noise.x = t * 18;
          noise.y = t * 11;
        });

        // The bed goes right under the painted sea, above the land base: the sea is what turns transparent.
        // The sea sprites overlap their mirrors by a few px, so they are thinned out as one flattened group
        // (AlphaFilter): per-sprite alpha would double up in the overlaps and draw the old canvas rectangle.
        const seaIndex = Math.min(...seaSprites.map((sprite) => world.getChildIndex(sprite)));
        const seaGroup = new Container();
        for (const sprite of seaSprites) seaGroup.addChild(sprite);
        world.addChildAt(seaGroup, seaIndex);
        const seaAlpha = new AlphaFilter({ alpha: 1, resolution: app.renderer.resolution, antialias: 'inherit' });
        world.addChildAt(noise, seaIndex);
        world.addChildAt(bedMask, seaIndex);
        world.addChildAt(bedBox, seaIndex + 2);

        const clearest = 1 - seabed.opacity;
        ticks.push(() => {
          const r = seabedReveal;
          r.value += (r.target - r.value) * (r.target > r.value ? 0.12 : 0.05);
          r.tiltX += (r.tiltTargetX - r.tiltX) * 0.12;
          r.tiltY += (r.tiltTargetY - r.tiltY) * 0.12;
          const on = r.value > 0.004;
          bedBox.visible = on;
          bedBox.filters = on && !reducedMotion ? [refraction] : null;
          seaAlpha.alpha = 1 - (1 - clearest) * r.value;
          seaGroup.filters = on ? [seaAlpha] : null;
        });

        const depthNear = seabed.parallax;
        const depthFar = Math.max(0.4, seabed.parallax - 0.12);
        seabedShift = (panX, panY, viewW, viewH) => {
          // Centre-relative parallax per depth, plus the tilt: the drag leans the view, so the far floor lags
          // more than the near ruins, as if the sea were a glass block seen at an angle.
          const ox = panX - (canvas.width / 2 - viewW / 2);
          const oy = panY - (canvas.height / 2 - viewH / 2);
          const tx = seabedReveal.tiltX;
          const ty = seabedReveal.tiltY;
          far.position.set(extX + (1 - depthFar) * ox + tx * 1.6, extY + (1 - depthFar) * oy + ty * 1.6);
          near.position.set(extX + (1 - depthNear) * ox + tx * 0.7, extY + (1 - depthNear) * oy + ty * 0.7);
        };
        ticks.push(() => {
          const cam = camRef.current;
          if (cam) seabedShift(cam.panX, cam.panY, app.screen.width / cam.zoom, app.screen.height / cam.zoom);
        });
      }

      // ── Cloud shadows: drift over land and sea alike, soft-edged, under the clouds ──
      if (fxOn.cloudShadows) {
        const layer = new Container();
        const shadowTextures = new Map<string, Texture>();
        // The shipped shadow sprites are pale blurred clouds (made for a multiply blend, which barely darkens):
        // only their shape is kept, blurred once more and filled with a dark green-black, baked into a texture.
        const shadowTexture = async (src: string) => {
          const cached = shadowTextures.get(src);
          if (cached) return cached;
          const tex = await load(`/assets/atmosphere/${src}`);
          const pad = CLOUD_SHADOW_BLUR_PX * 2;
          const c = document.createElement('canvas');
          c.width = tex.width + pad * 2;
          c.height = tex.height + pad * 2;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.filter = `blur(${CLOUD_SHADOW_BLUR_PX}px)`;
            ctx.drawImage(tex.source.resource as CanvasImageSource, pad, pad);
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = CLOUD_SHADOW_COLOR;
            ctx.fillRect(0, 0, c.width, c.height);
          }
          const baked = Texture.from(c);
          shadowTextures.set(src, baked);
          return baked;
        };
        for (const band of atmosphereAssets.clouds) {
          for (const s of band.sprites) {
            const tex = await shadowTexture(s.shadowSrc);
            const sprite = new Sprite(tex);
            // The baked texture carries blur padding on every side: widen the sprite so the cloud keeps its size.
            const w = s.width * band.scale * (tex.width / (tex.width - CLOUD_SHADOW_BLUR_PX * 4));
            sprite.width = w;
            sprite.height = tex.height * (w / tex.width);
            sprite.y = s.y + cloudShadowOffset.y;
            sprite.alpha = cloudShadowOpacity ?? band.shadowOpacity;
            layer.addChild(sprite);
            ticks.push((t) => {
              const drift = band.driftSeconds / cloudSpeed;
              const p = (((t + s.delaySeconds) % drift) + drift) % drift / drift;
              sprite.x = cloudX(p, w) + cloudShadowOffset.x;
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
              uExtent: { value: new Float32Array([-margin, -marginY, canvas.width + 2 * margin, canvas.height + 2 * marginY]), type: 'vec4<f32>' },
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
        const seaQuad = quad(canvas.width + 2 * margin, canvas.height + 2 * marginY);
        const seaMesh = new Mesh({ geometry: seaQuad, shader });
        seaMesh.position.set(-margin, -marginY);
        world.addChild(seaMesh);
        ticks.push((t) => {
          shader.resources.u.uniforms.uTime = t;
        });
      }

      // ── Painted waves and sea marks: fade in, hold, fade out, drift ──
      const seaMaskForMarks = fxOn.waves || fxOn.seaMarks ? await load('/assets/atmosphere/terrain/sea_mask.webp') : null;
      /** Every wave and sea mark, for the spacing rule (also read by the sea creatures). */
      const liveMarks: { x: number; y: number; active: boolean; cycle: number }[] = [];
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
          const slot = { x: mark.x + mark.width / 2, y: mark.y + mark.height / 2, active: false, cycle: -1 };
          liveMarks.push(slot);
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
            // A mark only plays a cycle when no other wave or mark is on screen near it: they never bunch up.
            const cycle = Math.floor((t + mark.delaySeconds) / cycleSeconds);
            if (cycle !== slot.cycle) {
              slot.cycle = cycle;
              slot.active = !liveMarks.some((o) => o !== slot && o.active && Math.hypot(o.x - slot.x, o.y - slot.y) < tn.markSpacingPx);
            }
            sprite.alpha = slot.active ? opacity * track(p, [[0, 0], [visible * 0.22, 1], [visible * 0.78, 1], [visible, 0], [1, 0]]) : 0;
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
      const wonderLayer = new Container();
      // ── Sea wonders (kraken, whale, pirate ship): a rare one surfaces in open water, stays, sinks ──
      if (fxOn.wonders && seaWonderCatalog.length > 0) {
        const points = (await fetch('/assets/atmosphere/terrain/points.json').then((r) => r.json())) as { wonder?: { x: number; y: number }[] };
        const anchors = points.wonder ?? [];
        const sprites = await Promise.all(seaWonderCatalog.map(async (w) => ({ w, tex: await load(`/assets/atmosphere/${w.src}`) })));
        if (disposed) return;
        const layer = wonderLayer;
        const live: { x: number; y: number; until: number }[] = [];
        let nextAt = Math.min(8, tn.wonderEveryS) + Math.random() * 6;
        ticks.push((t) => {
          for (let i = live.length - 1; i >= 0; i -= 1) if (live[i].until < t) live.splice(i, 1);
          if (reducedMotion || t < nextAt || live.length >= wonderSpawnDefaults.maxActiveWonders) return;
          nextAt = t + tn.wonderEveryS + Math.random() * tn.wonderEveryS * 0.9;
          const free = anchors.filter(
            (a) =>
              !live.some((o) => Math.hypot(o.x - a.x, o.y - a.y) < wonderSpawnDefaults.minWonderSpacing) &&
              !liveMarks.some((m) => m.active && Math.hypot(m.x - a.x, m.y - a.y) < wonderSpawnDefaults.minDistanceFromWaveMarks),
          );
          if (free.length === 0) return;
          const at = free[Math.floor(Math.random() * free.length)];
          const { w, tex } = sprites[Math.floor(Math.random() * sprites.length)];
          const sprite = new Sprite(tex);
          sprite.anchor.set(0.5);
          const base = WONDER_WIDTH_PX / tex.width;
          sprite.scale.set(base);
          sprite.alpha = 0;
          layer.addChild(sprite);
          const born = t;
          const inS = (w.animation === 'rise' ? wonderSpawnDefaults.riseDurationMs : wonderSpawnDefaults.fadeDurationMs) / 1000;
          const outS = wonderSpawnDefaults.fadeDurationMs / 1000;
          const entrance = w.entrance;
          const sailRad = ((entrance?.sailAngle ?? 0) * Math.PI) / 180;
          const sailBack = ((entrance?.sailDistance ?? 0) / 100) * WONDER_WIDTH_PX;
          live.push({ x: at.x, y: at.y, until: t + WONDER_LIFETIME_S });
          const tick = (now: number) => {
            const age = now - born;
            if (age > WONDER_LIFETIME_S) {
              layer.removeChild(sprite);
              sprite.destroy();
              ticks.splice(ticks.indexOf(tick), 1);
              return;
            }
            const enter = Math.min(1, age / inS);
            const ease = 1 - (1 - enter) ** 3;
            const leave = Math.min(1, Math.max(0, (age - (WONDER_LIFETIME_S - outS)) / outS));
            sprite.alpha = w.opacity * ease * (1 - leave);
            if (entrance?.type === 'sail') {
              // Sails in along its bow, keeps gliding, fades out.
              const travel = -sailBack * (1 - ease) + age * 14;
              sprite.x = at.x + Math.cos(sailRad) * travel;
              sprite.y = at.y + Math.sin(sailRad) * travel;
            } else {
              // Breaks the surface from below: rises and grows, then sinks back as it fades.
              const off = ((entrance?.riseOffset ?? 0) / 100) * tex.height * base;
              const grow = entrance?.riseScale ?? 1;
              sprite.x = at.x;
              sprite.y = at.y + off * (1 - ease) + off * 0.6 * leave;
              sprite.scale.set(base * (grow + (1 - grow) * ease) * (1 - 0.15 * leave));
            }
          };
          ticks.push(tick);
        });
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
      // Wonders sit above the sea pattern, the waves and the coast foam.
      world.addChild(wonderLayer);

      // ── Land life: smoke from the village ──
      if (fxOn.landLife && !reducedMotion) {
        // Smoke: a few soft puffs rise from the roofs, lean with the same wind, and thin out.
        const smokeCanvas = document.createElement('canvas');
        smokeCanvas.width = 64;
        smokeCanvas.height = 64;
        const sctx = smokeCanvas.getContext('2d');
        if (sctx) {
          const g = sctx.createRadialGradient(32, 32, 2, 32, 32, 30);
          g.addColorStop(0, 'rgba(236,230,218,0.85)');
          g.addColorStop(1, 'rgba(236,230,218,0)');
          sctx.fillStyle = g;
          sctx.fillRect(0, 0, 64, 64);
        }
        const smokeTexture = Texture.from(smokeCanvas);
        const smokeLayer = new Container();
        world.addChild(smokeLayer);
        for (const chimney of VILLAGE_CHIMNEYS) {
          for (let i = 0; i < SMOKE_PUFFS; i += 1) {
            const puff = new Sprite(smokeTexture);
            puff.anchor.set(0.5);
            puff.alpha = 0;
            smokeLayer.addChild(puff);
            const offset = (i / SMOKE_PUFFS) * SMOKE_LIFE_S + chimney.x * 0.003;
            ticks.push((t) => {
              const life = (((t + offset) % SMOKE_LIFE_S) + SMOKE_LIFE_S) / SMOKE_LIFE_S % 1;
              puff.x = chimney.x + life * 46 + Math.sin(life * 5 + chimney.y) * 4;
              puff.y = chimney.y - life * 78;
              puff.scale.set(0.35 + life * 0.85);
              puff.alpha = Math.sin(Math.PI * Math.min(1, life * 1.15)) * 0.42 * tn.smokeAmount;
            });
          }
        }

      }

      if (fxOn.clouds) {
        const bandIndex: Record<string, number> = { far: 0, mid: 1, near: 2 };
        for (const band of atmosphereAssets.clouds) {
          // Each band is a layer of its own at its own height: higher clouds slide further against the ground when
          // the camera pans (parallax), drift with a slight wind shear, and every cloud slowly changes shape.
          const level = bandIndex[band.name] ?? 1;
          const layer = new Container();
          const parallax = CLOUD_PARALLAX[level] * tn.cloudParallax;
          bandLayers.push({ layer, parallax });
          world.addChild(layer);
          for (const s of band.sprites) {
            const tex = await load(`/assets/atmosphere/${s.src}`);
            const sprite = new Sprite(tex);
            sprite.anchor.set(0.5);
            const w = s.width * band.scale;
            const baseScale = w / tex.width;
            const h = tex.height * baseScale;
            sprite.scale.set(baseScale);
            sprite.alpha = band.opacity;
            layer.addChild(sprite);
            const phase = (s.delaySeconds * 0.37 + level * 2.1) % (Math.PI * 2);
            let shown = 1;
            ticks.push((t) => {
              const drift = band.driftSeconds / cloudSpeed;
              const p = ((((t + s.delaySeconds) % drift) + drift) % drift) / drift;
              const left = cloudX(p, w);
              sprite.x = left + w / 2;
              // Wind shear: the higher the layer, the more its path meanders across the map.
              sprite.y = s.y + h / 2 + Math.sin(t * 0.045 + phase) * (14 + level * 16);
              if (!reducedMotion) {
                sprite.scale.set(baseScale * (1 + 0.045 * tn.cloudMorph * Math.sin(t * 0.11 + phase)), baseScale * (1 + 0.04 * tn.cloudMorph * Math.sin(t * 0.083 + phase * 1.7)));
                sprite.rotation = 0.02 * tn.cloudMorph * Math.sin(t * 0.07 + phase);
              }
              // A cloud that would sit on a point of interest thins out instead of hiding it.
              let want = 1;
              for (const anchor of anchorsRef.current) {
                const dx = Math.max(0, Math.abs(sprite.x + layer.x - anchor.x) - w / 2);
                const dy = Math.max(0, Math.abs(sprite.y + layer.y - anchor.y) - h / 2);
                const d = Math.hypot(dx, dy) / CLOUD_CLEAR_RADIUS_PX;
                want = Math.min(want, CLOUD_CLEAR_MIN + (1 - CLOUD_CLEAR_MIN) * Math.min(1, d));
              }
              shown += (want - shown) * 0.08;
              sprite.alpha = band.opacity * shown;
            });
          }
        }
        ticks.push(() => {
          const cam = camRef.current;
          if (!cam) return;
          const cx = canvas.width / 2 - app.screen.width / cam.zoom / 2;
          const cy = canvas.height / 2 - app.screen.height / cam.zoom / 2;
          for (const { layer, parallax } of bandLayers) layer.position.set(-parallax * (cam.panX - cx), -parallax * (cam.panY - cy));
        });
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
        seabedShift(cam.panX, cam.panY, visW, visH);
        camRef.current = cam;
        // Dev only: lets a test read the camera to find where the painted canvas edges land on screen.
        if (import.meta.env.DEV) Object.assign(window as object, { __worldCam: { ...cam, width: canvas.width, height: canvas.height }, __canopySway: canopySway });
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
      // Glide to a world point, centred in the free area; zooms in a little when the map is at its widest.
      let glide = 0;
      focusRef.current = (wx, wy) => {
        cancelAnimationFrame(glide);
        const left = fit?.insets.left ?? 0;
        const right = fit?.insets.right ?? 0;
        const top = fit?.insets.top ?? 0;
        const bottom = fit?.insets.bottom ?? 0;
        const zoomTo = Math.min(cameraConfig.maxZoom, Math.max(cam.zoom, floorZoom() * 1.5));
        const freeW = app.screen.width - left - right;
        const freeH = app.screen.height - top - bottom;
        const target = { zoom: zoomTo, panX: wx - (left + freeW / 2) / zoomTo, panY: wy - (top + freeH / 2) / zoomTo };
        const from = { ...cam };
        const started = performance.now();
        const duration = reducedMotion ? 0 : 700;
        const step = (now: number) => {
          const k = duration === 0 ? 1 : Math.min(1, (now - started) / duration);
          const e = 1 - (1 - k) ** 3;
          cam.zoom = from.zoom + (target.zoom - from.zoom) * e;
          cam.panX = from.panX + (target.panX - from.panX) * e;
          cam.panY = from.panY + (target.panY - from.panY) * e;
          userMoved = true;
          apply();
          if (k < 1) glide = requestAnimationFrame(step);
        };
        glide = requestAnimationFrame(step);
      };

      let userMoved = false;
      let drag: { x: number; y: number } | null = null;

      // ── Clickable regions: one 8-bit id map, one highlight sprite per hovered territory ──
      let cleanupRegions = () => {};
      if (regionsOn && regionsRef.current) {
        const base = regionsRef.current.assetBase;
        const [meta, idTexture] = await Promise.all([
          fetch(`${base}/regions.json`).then((r) => r.json() as Promise<{ size: [number, number]; regions: PixiRegion[] }>),
          load(`${base}/region_ids.png`),
        ]);
        if (disposed) return;
        const [mw, mh] = meta.size;
        const idCanvas = document.createElement('canvas');
        idCanvas.width = mw;
        idCanvas.height = mh;
        const idCtx = idCanvas.getContext('2d', { willReadFrequently: true });
        const source = idTexture.source.resource as CanvasImageSource;
        idCtx?.drawImage(source, 0, 0, mw, mh);
        const ids = idCtx?.getImageData(0, 0, mw, mh).data;
        const regionByIndex = new Map(meta.regions.map((r) => [r.index, r]));
        const idAt = (wx: number, wy: number) => {
          if (!ids || wx < 0 || wy < 0 || wx >= canvas.width || wy >= canvas.height) return 0;
          const x = Math.floor((wx / canvas.width) * mw);
          const y = Math.floor((wy / canvas.height) * mh);
          return ids[(y * mw + x) * 4];
        };
        const highlights = new Map<number, Sprite>();
        const highlightFor = (index: number) => {
          let sprite = highlights.get(index);
          if (sprite) return sprite;
          const c = document.createElement('canvas');
          c.width = mw;
          c.height = mh;
          const ctx = c.getContext('2d');
          if (ctx && ids) {
            // Manga-style outline: the territory's mask is smoothed up to a higher resolution (so no stair steps), the
            // ink line is a solid band cut inside the shape by erosion (crisp, no blur halo), over a faint warm wash.
            const U = REGION_RASTER_SCALE;
            const W = mw * U;
            const H = mh * U;
            c.width = W;
            c.height = H;
            const base = document.createElement('canvas');
            base.width = mw;
            base.height = mh;
            const bctx = base.getContext('2d');
            const bimg = bctx?.createImageData(mw, mh);
            if (bctx && bimg) {
              for (let i = 0; i < mw * mh; i += 1) {
                if (ids[i * 4] === index) bimg.data[i * 4 + 3] = 255;
              }
              bctx.putImageData(bimg, 0, 0);
            }
            const shape = document.createElement('canvas');
            shape.width = W;
            shape.height = H;
            const sctx = shape.getContext('2d', { willReadFrequently: true });
            if (sctx) {
              sctx.imageSmoothingEnabled = true;
              sctx.imageSmoothingQuality = 'high';
              sctx.filter = `blur(${U * 2}px)`;
              sctx.drawImage(base, 0, 0, W, H);
              sctx.filter = 'none';
              const sd = sctx.getImageData(0, 0, W, H);
              for (let p = 3; p < sd.data.length; p += 4) sd.data[p] = sd.data[p] > 127 ? 255 : 0;
              sctx.putImageData(sd, 0, 0);
            }
            const tint = (colour: string) => {
              const t = document.createElement('canvas');
              t.width = W;
              t.height = H;
              const g = t.getContext('2d');
              if (g) {
                g.drawImage(shape, 0, 0);
                g.globalCompositeOperation = 'source-in';
                g.fillStyle = colour;
                g.fillRect(0, 0, W, H);
              }
              return t;
            };
            // Eroded copy: the shape with its outer band removed (AND of the shape shifted in 8 directions).
            const thick = Math.max(2, Math.round((tn.regionLinePx * W) / canvas.width));
            const eroded = document.createElement('canvas');
            eroded.width = W;
            eroded.height = H;
            const egx = eroded.getContext('2d');
            if (egx) {
              egx.drawImage(shape, 0, 0);
              egx.globalCompositeOperation = 'destination-in';
              const k = Math.round(thick * 0.7071);
              for (const [dx, dy] of [[thick, 0], [-thick, 0], [0, thick], [0, -thick], [k, k], [-k, k], [k, -k], [-k, -k]]) {
                egx.drawImage(shape, dx, dy);
              }
            }
            // The ink ring = shape minus the eroded shape.
            const ring = tint(`rgb(${REGION_EDGE_RGBA[0]}, ${REGION_EDGE_RGBA[1]}, ${REGION_EDGE_RGBA[2]})`);
            const rctx = ring.getContext('2d');
            if (rctx) {
              rctx.globalCompositeOperation = 'destination-out';
              rctx.drawImage(eroded, 0, 0);
            }
            ctx.drawImage(tint('rgba(255, 236, 190, 0.12)'), 0, 0);
            ctx.drawImage(ring, 0, 0);
          }
          sprite = new Sprite(Texture.from(c));
          sprite.width = canvas.width;
          sprite.height = canvas.height;
          sprite.alpha = 0;
          sprite.visible = false;
          world.addChild(sprite);
          highlights.set(index, sprite);
          return sprite;
        };
        let hoverIndex = 0;
        const fade = new Map<number, number>();
        ticks.push((_t) => {
          for (const [index, sprite] of highlights) {
            const want = index === hoverIndex ? 1 : 0;
            const now = fade.get(index) ?? 0;
            const next = now + (want - now) * 0.18;
            fade.set(index, Math.abs(next - want) < 0.01 ? want : next);
            sprite.alpha = fade.get(index) ?? 0;
            sprite.visible = sprite.alpha > 0.01;
          }
        });
        const el2 = app.canvas;
        const worldPoint = (e: MouseEvent) => {
          const r = el2.getBoundingClientRect();
          const sx = e.clientX - r.left;
          const sy = e.clientY - r.top;
          return { sx, sy, wx: cam.panX + sx / cam.zoom, wy: cam.panY + sy / cam.zoom };
        };
        // The territory lights up and is named only after the pointer has rested on it for a moment: sweeping
        // across the map must not flash every province on the way.
        let pendingIndex = 0;
        let dwellTimer = 0;
        const report = (index: number) => {
          const region = regionByIndex.get(index);
          if (!region) {
            regionsRef.current?.onHover?.(null);
            return;
          }
          const sx = (region.center[0] * canvas.width - cam.panX) * cam.zoom;
          const sy = (region.center[1] * canvas.height - cam.panY) * cam.zoom;
          regionsRef.current?.onHover?.({ region, x: sx, y: sy });
        };
        const onHoverMove = (e: MouseEvent) => {
          const { wx, wy } = worldPoint(e);
          const index = drag ? 0 : idAt(wx, wy);
          if (drag) el2.dataset.cursor = 'move';
          else if (regionByIndex.has(index)) el2.dataset.cursor = 'point';
          else delete el2.dataset.cursor;
          if (index === pendingIndex) return;
          pendingIndex = index;
          window.clearTimeout(dwellTimer);
          if (hoverIndex) {
            hoverIndex = 0;
            regionsRef.current?.onHover?.(null);
          }
          if (!index) return;
          dwellTimer = window.setTimeout(() => {
            hoverIndex = index;
            highlightFor(index);
            report(index);
          }, tn.regionHoverDelayS * 1000);
        };
        const onLeave = () => {
          window.clearTimeout(dwellTimer);
          pendingIndex = 0;
          hoverIndex = 0;
          regionsRef.current?.onHover?.(null);
        };
        // The name plate rides on the territory, so it follows pan and zoom.
        ticks.push(() => {
          if (hoverIndex) report(hoverIndex);
        });
        let downAt: { x: number; y: number } | null = null;
        const onDownR = (e: MouseEvent) => {
          downAt = { x: e.clientX, y: e.clientY };
        };
        const onUpR = (e: MouseEvent) => {
          const start = downAt;
          downAt = null;
          if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) return;
          const { wx, wy } = worldPoint(e);
          const region = regionByIndex.get(idAt(wx, wy));
          if (region) {
            focusRef.current?.(region.center[0] * canvas.width, region.center[1] * canvas.height);
            regionsRef.current?.onSelect?.(region);
          }
        };
        el2.addEventListener('mousemove', onHoverMove);
        el2.addEventListener('mouseleave', onLeave);
        el2.addEventListener('mousedown', onDownR);
        el2.addEventListener('mouseup', onUpR);
        cleanupRegions = () => {
          el2.removeEventListener('mousemove', onHoverMove);
          el2.removeEventListener('mouseleave', onLeave);
          el2.removeEventListener('mousedown', onDownR);
          el2.removeEventListener('mouseup', onUpR);
        };
      }

      const el = app.canvas;
      const onDown = (e: MouseEvent) => {
        drag = { x: e.clientX, y: e.clientY };
        el.dataset.cursor = 'move';
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
        if (drag) delete el.dataset.cursor;
        drag = null;
      };

      // Glass globe: while Alt (Option) is held the whole map tilts toward the pointer, as if the world were a glass
      // slab tipped in the hands, and the sea turns clear so the seabed shows beneath, sliding with the tilt.
      const tiltRoot = host.parentElement;
      let tilting = false;
      const setTilt = (rx: number, ry: number) => {
        if (!tiltRoot) return;
        tiltRoot.style.transition = 'transform 380ms cubic-bezier(.2,.8,.2,1)';
        tiltRoot.style.transformOrigin = '50% 50%';
        tiltRoot.style.transform = rx || ry ? `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.06)` : '';
      };
      const tiltFrom = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        setTilt(-ny * GLOBE_TILT_DEG, nx * GLOBE_TILT_DEG);
        seabedReveal.tiltTargetX = -nx * GLOBE_BED_SHIFT_PX;
        seabedReveal.tiltTargetY = -ny * GLOBE_BED_SHIFT_PX;
      };
      let lastPointer: MouseEvent | null = null;
      const onTiltMove = (e: MouseEvent) => {
        lastPointer = e;
        if (tilting) tiltFrom(e);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== 'Alt') return;
        const down = e.type === 'keydown';
        if (down === tilting) return;
        tilting = down;
        seabedReveal.target = down ? 1 : 0;
        if (down && lastPointer) tiltFrom(lastPointer);
        if (!down) {
          setTilt(0, 0);
          seabedReveal.tiltTargetX = 0;
          seabedReveal.tiltTargetY = 0;
        }
      };
      const onBlur = () => onKey(new KeyboardEvent('keyup', { key: 'Alt' }));
      window.addEventListener('mousemove', onTiltMove);
      window.addEventListener('keydown', onKey);
      window.addEventListener('keyup', onKey);
      window.addEventListener('blur', onBlur);
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
        cleanupRegions();
        el.removeEventListener('mousedown', onDown);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        el.removeEventListener('wheel', onWheel);
        window.removeEventListener('mousemove', onTiltMove);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keyup', onKey);
        window.removeEventListener('blur', onBlur);
        if (tiltRoot) tiltRoot.style.transform = '';
        refitRef.current = null;
        focusRef.current = null;
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
  }, [manifest, cameraConfig, hiddenKey, safeFitKey, fxKey, seaPatternConfig, coastFoamConfig, cloudShadowOpacity, cloudShadowOffset.x, cloudShadowOffset.y, cloudSpeed, seabed?.opacity, seabed?.parallax, regionsOn, tuneKey, onStats, syncAnchors]);

  // New or moved anchors get placed before paint, not on the next camera move.
  useLayoutEffect(syncAnchors);

  useEffect(() => {
    if (recenterSignal > 0) refitRef.current?.();
  }, [recenterSignal]);

  useEffect(() => {
    if (!focusRequest || !manifest) return;
    const { width, height } = manifest.coordinateSystem.canvas;
    focusRef.current?.(focusRequest.x * width, focusRequest.y * height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest?.n]);

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
        // Above the map and above an event shroud (z 6) closing over it: the world-space event card appears on the clouds.
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 7 }}>
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
