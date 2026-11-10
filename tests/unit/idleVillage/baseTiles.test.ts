import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cellKey, cellsToEvict, DEFAULT_TILE_BUDGET, tilesActive, visibleCells, type TileLevel, type TilesManifest } from '@/ui/idleVillage/pixiSpike/baseTiles';
import { MAPPA2_V2_LAND, MAPPA2_V2_TILES } from '@/ui/idleVillage/config/mappa2ApprovedLook';

// PLAN-115 F3 — hi-res base tiles (look v2, Director ruling 2026-11-10). V2 of the closing contract.
const LEVEL: TileLevel = { id: 'L0', width: 5504, height: 3072, worldPerTexel: 0.5, cell: 512, gutter: 2, cols: 11, rows: 6, path: 'L0/{col}_{row}.webp', cells: [] };

describe('base tiles — selection', () => {
  it('turn on only when the resident 2752 base is magnified past minScale device px per world px', () => {
    expect(tilesActive(0.5, 2, DEFAULT_TILE_BUDGET)).toBe(false); // 1.0
    expect(tilesActive(0.586, 2, DEFAULT_TILE_BUDGET)).toBe(true); // Retina overview 1.17
    expect(tilesActive(0.52, 1, DEFAULT_TILE_BUDGET)).toBe(false); // Deck overview
    expect(tilesActive(2.2, 1, DEFAULT_TILE_BUDGET)).toBe(true);
  });

  it('pick the cells under the view plus the margin, clamped to the grid (cell = 256 world px)', () => {
    expect(visibleCells(LEVEL, { x: 300, y: 300, w: 100, h: 100 }, 0)).toEqual([cellKey(1, 1)]);
    expect(visibleCells(LEVEL, { x: 300, y: 300, w: 100, h: 100 }, 1)).toHaveLength(9);
    expect(visibleCells(LEVEL, { x: 0, y: 0, w: 2752, h: 1536 }, 1)).toHaveLength(66); // whole map, no cell outside the grid
    expect(visibleCells(LEVEL, { x: -500, y: -500, w: 100, h: 100 }, 0)).toEqual([]); // view off the map: nothing to load
  });

  // INV:pixi-world-map.INV-7 — cells only past minScale, LRU within the budget, never a wanted cell
  it('evict only beyond the budget, never a wanted cell, least recently seen first', () => {
    const seen = new Map([['a', 1], ['b', 5], ['c', 3], ['d', 9]]);
    expect(cellsToEvict(seen, new Set(['a']), 4)).toEqual([]);
    expect(cellsToEvict(seen, new Set(['a']), 2)).toEqual(['c', 'b']);
    expect(cellsToEvict(seen, new Set(['a', 'b', 'c', 'd']), 2)).toEqual([]);
  });
});

describe('base tiles — shipped v2 set', () => {
  const root = 'public/assets/world/mappa2/base/tiles/v2/';
  const manifest = JSON.parse(readFileSync(`${root}tiles.json`, 'utf8')) as TilesManifest;
  const level = manifest.levels[0];

  it('covers the 5504x3072 hi-res base of the 2752 world in 512 px cells with a 2 px gutter', () => {
    expect(manifest.world).toEqual({ width: 2752, height: 1536 });
    expect(level).toMatchObject({ width: 5504, height: 3072, worldPerTexel: 0.5, cell: 512, gutter: 2, cols: 11, rows: 6 });
    expect(level.cells).toHaveLength(66);
    expect(level.cells.reduce((a, c) => a + c.w * c.h, 0)).toBe(5504 * 3072);
    for (const c of level.cells) expect(existsSync(root + level.path.replace('{col}', String(c.col)).replace('{row}', String(c.row)))).toBe(true);
  });

  it('/game draws look v2 with tiles by default; the resident set and the reveal sea exist', () => {
    const page = readFileSync('src/pages/game-mappa2.tsx', 'utf8');
    expect(page).toContain('baseTiles={map.tiles}');
    expect(page).toContain(': LAND === null ? { ...MAPPA2_V2_LAND, canopySuffix: profile.canopySuffix }');
    expect(MAPPA2_V2_TILES.manifestUrl).toBe('/assets/world/mappa2/base/tiles/v2/tiles.json');
    for (const f of [MAPPA2_V2_LAND.baseFile, MAPPA2_V2_LAND.revealSeaFile, MAPPA2_V2_LAND.fullBaseFile, 'forest_canopy_01.canopy.v2hi.webp', 'forest_canopy_01.canopy.v2.webp']) {
      expect(existsSync(`public/assets/world/mappa2/base/layers/${f}`)).toBe(true);
    }
  });

  // INV:pixi-world-map.INV-7 — the tile layer mounts after `ticks` and never blocks the boot
  it('the tile layer never blocks the boot and mounts after `ticks` exists (TDZ regression, 2026-11-10)', () => {
    const src = readFileSync('src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx', 'utf8');
    const ticksAt = src.indexOf('const ticks: ((seconds: number) => void)[] = [];');
    const mountAt = src.indexOf('await mountBaseTiles({');
    expect(ticksAt).toBeGreaterThan(0);
    expect(mountAt).toBeGreaterThan(ticksAt);
    expect(src).toContain("console.error('[PixiWorldMap] base tiles disabled:', err);");
  });
});
