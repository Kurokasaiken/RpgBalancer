import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseMappa2AmbientDirector } from '@/ui/idleVillage/config/mappa2AmbientDirectorConfig';

/* PLAN-099: regions are gameplay territories, biomes are what animations key on. */
const BASE = join(process.cwd(), 'public/assets/world/mappa2/base');
const read = <T>(name: string): T => JSON.parse(readFileSync(join(BASE, name), 'utf8')) as T;

interface Region { id: string; index: number; kind: 'land' | 'sea'; continent: string; biomes: Record<string, number>; neighbors: string[]; areaFraction: number }
interface Biome { id: string; index: number; kind: 'land' | 'sea'; regions: string[] }

const regions = read<{ regions: Region[] }>('regions.json').regions;
const biomes = read<{ biomes: Biome[] }>('biomes.json').biomes;
const biomeIds = new Set(biomes.map((b) => b.id));

describe('mappa2 territories (regions)', () => {
  it('tiles the whole canvas, sea included', () => {
    const total = regions.reduce((a, r) => a + r.areaFraction, 0);
    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
  });

  it('has unique ids/indexes and a symmetric adjacency graph', () => {
    expect(new Set(regions.map((r) => r.id)).size).toBe(regions.length);
    expect(new Set(regions.map((r) => r.index)).size).toBe(regions.length);
    const byId = new Map(regions.map((r) => [r.id, r]));
    for (const r of regions) {
      expect(r.neighbors.length).toBeGreaterThan(0);
      for (const n of r.neighbors) expect(byId.get(n)?.neighbors).toContain(r.id);
    }
  });

  it('has the agreed shape: 15 land + 5 sea territories', () => {
    expect(regions.filter((r) => r.kind === 'land')).toHaveLength(15);
    expect(regions.filter((r) => r.kind === 'sea')).toHaveLength(5);
  });
});

describe('mappa2 biomes', () => {
  it('only references declared biomes from regions', () => {
    for (const r of regions) for (const b of Object.keys(r.biomes)) expect(biomeIds.has(b)).toBe(true);
  });

  it('allows the same biome in several distant regions (not 1:1 with regions)', () => {
    expect(biomes.some((b) => b.regions.length >= 2)).toBe(true);
    expect(biomes.length).toBeLessThan(regions.length);
  });
});

describe('animation data keys on biomes, never on regions', () => {
  it('ambient-director zones carry a declared sea biome', () => {
    const raw = read<unknown>('ambient-director.json');
    const data = parseMappa2AmbientDirector(raw);
    const seaBiomes = new Set(biomes.filter((b) => b.kind === 'sea').map((b) => b.id));
    expect(data.zones.length).toBeGreaterThan(0);
    for (const z of data.zones) expect(seaBiomes.has(z.biome)).toBe(true);
    for (const z of (raw as { zones: Record<string, unknown>[] }).zones) expect('region' in z).toBe(false);
  });

  it('land-life anchors are attributed to a declared biome', () => {
    const { anchors } = read<{ anchors: { biomeId: string; regionId?: string }[] }>('land-life-anchors.json');
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) {
      expect(biomeIds.has(a.biomeId)).toBe(true);
      expect(a.regionId).toBeUndefined();
    }
  });
});
