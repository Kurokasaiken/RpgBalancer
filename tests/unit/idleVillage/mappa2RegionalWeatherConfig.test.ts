import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Mappa2RegionalWeatherSchema } from '@/ui/idleVillage/config/mappa2RegionalWeatherConfig';

const real = () =>
  JSON.parse(readFileSync('public/assets/world/mappa2/base/weather-anchors.json', 'utf-8'));

const base = () => ({
  schemaVersion: 1,
  seed: 97421,
  canvas: { width: 2752, height: 1536 },
  caps: { mist: 16, embers: 0, volcano: 8, orographic: 12, glints: 14, dust: 0 },
  thresholds: { minReach: { mist: 12, ember: 14, volcano: 40, orographic: 40, dust: 40, glint: 8 }, minSpacing: { mist: 40, ember: 45, volcano: 60, orographic: 60, dust: 60, glint: 110 }, shorelineMargin: 24, driftMax: { mist: 6, ember: 12, volcano: 90, orographic: 24, dust: 30, glint: 0 } },
  generatedFrom: { sourceSha256: 'a'.repeat(64), artifact: 'test' },
  anchors: [
    { id: 'mist_01', type: 'mist', x: 100, y: 200, radius: 120, reach: 180, weight: 1, phase: 0 },
    { id: 'volcano_01', type: 'volcano', x: 2039, y: 1002, radius: 60, reach: 150, weight: 1, phase: 0.5 },
  ],
});

describe('Mappa2RegionalWeatherSchema (PLAN-098)', () => {
  it('parses the emitted weather-anchors.json (fail-closed if missing/malformed)', () => {
    const r = Mappa2RegionalWeatherSchema.safeParse(real());
    expect(r.success, JSON.stringify(r.success ? null : r.error.issues, null, 1)).toBe(true);
    if (r.success) {
      // v1 contract: mist + embers only
      expect(new Set(r.data.anchors.map((a) => a.type))).toEqual(new Set(['mist', 'volcano', 'orographic', 'glint']));
      expect(r.data.anchors.length).toBeGreaterThanOrEqual(4); // T-001 floor: mist>=6 ideal, >=4 hard floor
      expect(r.data.caps.dust).toBe(0);
      expect(r.data.caps.glints).toBeGreaterThanOrEqual(10); // glints live since storm slice
      expect(r.data.caps.orographic).toBeGreaterThanOrEqual(8);
    }
  });
  it('rejects unknown keys (strict)', () => {
    expect(Mappa2RegionalWeatherSchema.safeParse({ ...base(), extra: 1 }).success).toBe(false);
  });
  it('rejects anchors violating radius+driftMax<=reach', () => {
    const bad = base();
    bad.anchors[0] = { ...bad.anchors[0], radius: 178, reach: 180 }; // 178+6>180
    expect(Mappa2RegionalWeatherSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects id/type mismatch and duplicate ids', () => {
    const b1 = base();
    b1.anchors[0] = { ...b1.anchors[0], id: 'volcano_99' };
    expect(Mappa2RegionalWeatherSchema.safeParse(b1).success).toBe(false);
    const b2 = base();
    b2.anchors[1] = { ...b2.anchors[1], id: 'mist_01' };
    expect(Mappa2RegionalWeatherSchema.safeParse(b2).success).toBe(false);
  });
  it('rejects cap sum > 60 and out-of-canvas coords', () => {
    const b1 = base();
    b1.caps.mist = 99;
    expect(Mappa2RegionalWeatherSchema.safeParse(b1).success).toBe(false);
    const b2 = base();
    b2.anchors[0] = { ...b2.anchors[0], x: 3000 };
    expect(Mappa2RegionalWeatherSchema.safeParse(b2).success).toBe(false);
  });
});
