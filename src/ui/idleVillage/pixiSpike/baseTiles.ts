/**
 * PLAN-115 F3 — hi-res base tiles streamed over the resident 2752 base (`/game`, look v2).
 *
 * The 2752 base stays loaded and drawn (instant fallback, shader source). When the camera magnifies it past
 * `minScale` device px per world px, the L0 cells (512 px, 2 px gutter, 0.5 world px per texel) that intersect the view
 * (+ a margin) are loaded and drawn just above the base; cells out of view are kept up to `budgetCells`, least recently
 * seen first out. Zooming back out hides the layer and frees every cell after `releaseAfterMs`.
 * Memory is bounded by the budget (cells have no mipmaps: they are only ever shown magnified).
 *
 * The selection logic is pure (exported, unit-tested); `mountBaseTiles` binds it to Pixi.
 */
import { Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js';

export interface TileCell { col: number; row: number; w: number; h: number }
export interface TileLevel {
  id: string;
  width: number;
  height: number;
  worldPerTexel: number;
  cell: number;
  gutter: number;
  cols: number;
  rows: number;
  path: string;
  cells: TileCell[];
}
export interface TilesManifest { version: number; source: string; world: { width: number; height: number }; levels: TileLevel[] }

export interface TileBudget {
  /** Device px per world px above which the tiles show (the 2752 base is magnified past 1:1 there). */
  minScale: number;
  /** Most cells kept in GPU memory at once (each ≤ 516x516 RGBA ≈ 1 MB, no mipmaps). */
  budgetCells: number;
  /** Cells around the view loaded ahead of panning. */
  marginCells: number;
  /** After zooming back under `minScale`, free everything after this delay. */
  releaseAfterMs: number;
}

export const DEFAULT_TILE_BUDGET: TileBudget = { minScale: 1.05, budgetCells: 48, marginCells: 1, releaseAfterMs: 4000 };

export const cellKey = (col: number, row: number) => `${col}_${row}`;

/** Device px per world px for a camera zoom and renderer resolution. */
export const deviceScale = (zoom: number, resolution: number) => zoom * resolution;

export const tilesActive = (zoom: number, resolution: number, budget: Pick<TileBudget, 'minScale'>) =>
  deviceScale(zoom, resolution) > budget.minScale;

/** Cells of `level` intersecting the world-space view rectangle, grown by `margin` cells, clamped to the grid. */
export function visibleCells(level: TileLevel, view: { x: number; y: number; w: number; h: number }, margin: number): string[] {
  const span = level.cell * level.worldPerTexel; // world px covered by one cell
  const c0 = Math.max(0, Math.floor(view.x / span) - margin);
  const r0 = Math.max(0, Math.floor(view.y / span) - margin);
  const c1 = Math.min(level.cols - 1, Math.floor((view.x + view.w) / span) + margin);
  const r1 = Math.min(level.rows - 1, Math.floor((view.y + view.h) / span) + margin);
  const out: string[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(cellKey(c, r));
  return out;
}

/**
 * Which loaded cells to free: never one that is wanted now; beyond the budget, the least recently seen first.
 * `lastSeen` maps loaded keys to the tick they were last wanted.
 */
export function cellsToEvict(lastSeen: ReadonlyMap<string, number>, wanted: ReadonlySet<string>, budgetCells: number): string[] {
  const excess = lastSeen.size - budgetCells;
  if (excess <= 0) return [];
  return [...lastSeen.entries()]
    .filter(([k]) => !wanted.has(k))
    .sort((a, b) => a[1] - b[1])
    .slice(0, excess)
    .map(([k]) => k);
}

interface MountArgs {
  world: Container;
  /** Sprite of the resident base: the tile layer goes right above it. */
  base: Container;
  manifestUrl: string;
  budget: TileBudget;
  /** Camera + screen read every tick. */
  camera: () => { panX: number; panY: number; zoom: number; screenW: number; screenH: number; resolution: number } | null;
  ticks: ((t: number) => void)[];
  disposed: () => boolean;
}

export interface BaseTilesHandle {
  layer: Container;
  stats: () => { active: boolean; loaded: number; loading: number; wanted: number };
}

/** Bind the tile logic to Pixi. Returns null when the manifest is missing (the map then stays on the 2752 base). */
export async function mountBaseTiles(args: MountArgs): Promise<BaseTilesHandle | null> {
  const res = await fetch(args.manifestUrl).catch(() => null);
  if (!res || !res.ok) return null;
  const manifest = (await res.json()) as TilesManifest;
  const level = manifest.levels[0];
  const root = args.manifestUrl.slice(0, args.manifestUrl.lastIndexOf('/') + 1);
  const cellByKey = new Map(level.cells.map((c) => [cellKey(c.col, c.row), c]));
  const span = level.cell * level.worldPerTexel;
  const layer = new Container();
  layer.label = 'base-tiles';
  layer.visible = false;
  args.world.addChildAt(layer, args.world.getChildIndex(args.base) + 1);

  const sprites = new Map<string, { sprite: Sprite; texture: Texture; url: string }>();
  const lastSeen = new Map<string, number>();
  const loading = new Set<string>();
  let frame = 0;
  let inactiveSince: number | null = null;
  let wantedNow = new Set<string>();

  const urlOf = (c: TileCell) => root + level.path.replace('{col}', String(c.col)).replace('{row}', String(c.row));
  const free = (key: string) => {
    const s = sprites.get(key);
    if (!s) return;
    s.sprite.destroy();
    s.texture.destroy();
    void Assets.unload(s.url).catch(() => undefined);
    sprites.delete(key);
    lastSeen.delete(key);
  };
  const loadCell = async (key: string) => {
    const c = cellByKey.get(key);
    if (!c || loading.has(key) || sprites.has(key)) return;
    loading.add(key);
    try {
      const url = urlOf(c);
      const full = (await Assets.load(url)) as Texture;
      if (args.disposed()) return;
      full.source.autoGenerateMipmaps = false; // shown magnified only
      const texture = new Texture({ source: full.source, frame: new Rectangle(level.gutter, level.gutter, c.w, c.h) });
      const sprite = new Sprite(texture);
      sprite.position.set(c.col * span, c.row * span);
      sprite.width = c.w * level.worldPerTexel;
      sprite.height = c.h * level.worldPerTexel;
      sprite.alpha = 0;
      layer.addChild(sprite);
      sprites.set(key, { sprite, texture, url });
      lastSeen.set(key, frame);
    } finally {
      loading.delete(key);
    }
  };

  args.ticks.push(() => {
    frame += 1;
    const cam = args.camera();
    if (!cam) return;
    const active = tilesActive(cam.zoom, cam.resolution, args.budget);
    layer.visible = active;
    if (!active) {
      wantedNow = new Set();
      inactiveSince ??= performance.now();
      if (sprites.size && performance.now() - inactiveSince > args.budget.releaseAfterMs) for (const k of [...sprites.keys()]) free(k);
      return;
    }
    inactiveSince = null;
    const view = { x: cam.panX, y: cam.panY, w: cam.screenW / cam.zoom, h: cam.screenH / cam.zoom };
    wantedNow = new Set(visibleCells(level, view, args.budget.marginCells));
    for (const k of wantedNow) {
      if (sprites.has(k)) lastSeen.set(k, frame);
      else void loadCell(k);
    }
    for (const k of cellsToEvict(lastSeen, wantedNow, args.budget.budgetCells)) free(k);
    for (const { sprite } of sprites.values()) if (sprite.alpha < 1) sprite.alpha = Math.min(1, sprite.alpha + 0.12); // short fade-in, no pop
  });

  return { layer, stats: () => ({ active: layer.visible, loaded: sprites.size, loading: loading.size, wanted: wantedNow.size }) };
}
