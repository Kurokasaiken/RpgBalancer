import { describe, expect, it } from 'vitest';

import {
  Mappa2SecondaryWaterSchema,
  parseMappa2SecondaryWater,
} from '@/ui/idleVillage/config/mappa2SecondaryWaterConfig';

const SHA = 'a'.repeat(64);

const validPayload = () => ({
  generatedFrom: 'PLAN-095 authored corridors + local candidates',
  sourceSha256: SHA,
  geometrySha256: SHA,
  waterfallFlowPolygonSha256: SHA,
  riverFlowTile: 'fx/water/river_flow_tile.webp',
  riverFlowTileSha256: SHA,
  riverFlowMask: 'masks/river_flow_mask.webp',
  lakeShimmerMask: 'masks/lake_shimmer_mask.webp',
  rivers: [
    {
      id: 'river_central',
      enabled: true,
      tint: '#8fd8e2',
      glintPoints: [{ x: 1175, y: 640 }],
      safePolygons: [[[1200, 600], [1300, 620], [1280, 700], [1190, 680]]],
      segments: [
        { cx: 1220, cy: 640, angleRad: 1.2, length: 60, width: 24 },
        { cx: 1280, cy: 720, angleRad: 1.0, length: 55, width: 22 },
      ],
    },
  ],
  lakes: [
    {
      id: 'lake_alpine',
      enabled: true,
      safePolygons: [[[1150, 335], [1320, 308], [1480, 465], [1220, 455]]],
      glintPoints: [{ x: 1300, y: 400 }, { x: 1400, y: 410 }],
    },
  ],
  confluences: [{ id: 'basin_outflow', x: 1250, y: 600, radiusPx: 3.5 }],
});

describe('Mappa2SecondaryWaterSchema (PLAN-095 leaf contract)', () => {
  it('parses a valid payload', () => {
    const parsed = parseMappa2SecondaryWater(validPayload());
    expect(parsed.rivers).toHaveLength(1);
    expect(parsed.rivers[0].segments).toHaveLength(2);
  });

  it('rejects malformed sha256', () => {
    const payload = validPayload();
    payload.riverFlowTileSha256 = 'not-a-sha';
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow();
  });

  it('rejects the wrong tile path literal', () => {
    const payload = validPayload();
    (payload as Record<string, unknown>).riverFlowTile = 'fx/water/other.webp';
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow();
  });

  it('rejects duplicate feature ids', () => {
    const payload = validPayload();
    payload.lakes.push({ ...payload.lakes[0], id: 'river_central' });
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow(/duplicate feature id/);
  });

  it('rejects more than 64 total segments', () => {
    const payload = validPayload();
    payload.rivers[0].segments = Array.from({ length: 65 }, (_, i) => ({
      cx: 100 + i,
      cy: 100,
      angleRad: 0,
      length: 10,
      width: 10,
    }));
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow(/total segments/);
  });

  it('rejects more than 400 total polygon vertices', () => {
    const payload = validPayload();
    payload.rivers[0].safePolygons = [
      Array.from({ length: 401 }, (_, i) => [i, i] as [number, number]),
    ];
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow(/total vertices/);
  });

  it('rejects oriented bbox area above 150000', () => {
    const payload = validPayload();
    payload.rivers[0].segments = [{ cx: 0, cy: 0, angleRad: 0, length: 500, width: 400 }];
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow(/oriented bbox area/);
  });

  it('rejects uphill segment reversal (dot <= 0.5)', () => {
    const payload = validPayload();
    payload.rivers[0].segments[1].angleRad = payload.rivers[0].segments[0].angleRad + Math.PI;
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow(/uphill/);
  });

  it('keeps flow poses on rivers and lakes (PLAN-095 v2)', () => {
    const payload = validPayload();
    const poses = {
      frames: ['fx/water/river_central_f0.webp', 'fx/water/river_central_f1.webp'],
      rect: { x: 1148, y: 581, width: 367, height: 383 },
    };
    Object.assign(payload.rivers[0], { flowPoses: poses });
    Object.assign(payload.lakes[0], { flowPoses: { ...poses, frames: ['fx/water/lake_alpine_f0.webp', 'fx/water/lake_alpine_f1.webp'] } });
    const parsed = parseMappa2SecondaryWater(payload);
    expect(parsed.rivers[0].flowPoses?.frames).toHaveLength(2);
    expect(parsed.lakes[0].flowPoses?.rect.width).toBe(367);
  });

  it('rejects flow poses outside fx/water or with a single frame', () => {
    const outside = validPayload();
    Object.assign(outside.rivers[0], { flowPoses: { frames: ['../x_f0.webp', 'fx/water/a_f1.webp'], rect: { x: 0, y: 0, width: 1, height: 1 } } });
    expect(() => Mappa2SecondaryWaterSchema.parse(outside)).toThrow();
    const single = validPayload();
    Object.assign(single.rivers[0], { flowPoses: { frames: ['fx/water/a_f0.webp'], rect: { x: 0, y: 0, width: 1, height: 1 } } });
    expect(() => Mappa2SecondaryWaterSchema.parse(single)).toThrow();
  });

  it('rejects missing lakes', () => {
    const payload = validPayload();
    (payload as Record<string, unknown>).lakes = [];
    expect(() => Mappa2SecondaryWaterSchema.parse(payload)).toThrow();
  });
});
