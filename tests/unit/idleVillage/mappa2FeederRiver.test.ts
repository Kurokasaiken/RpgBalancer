import { describe, expect, it } from 'vitest';
import { FEEDER_PATHS, LAKE_INFLOW, along } from '@/ui/idleVillage/pixiSpike/feederRiver';

const cum = (pts: [number, number][]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i += 1) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};

describe('mappa2 north water chain (snow-melt -> small fall -> lake -> big waterfall)', () => {
  it('flows downhill from the snow to the lake: every channel ends lower/at the next one', () => {
    const { eastStream, westStream, smallFall, lakeDrift } = FEEDER_PATHS;
    const last = (p: [number, number][]) => p[p.length - 1];
    expect(Math.hypot(last(eastStream)[0] - smallFall[0][0], last(eastStream)[1] - smallFall[0][1])).toBeLessThan(30);
    expect(Math.hypot(last(westStream)[0] - smallFall[0][0], last(westStream)[1] - smallFall[0][1])).toBeLessThan(30);
    expect(last(smallFall)[1]).toBeGreaterThan(smallFall[0][1]); // falls
    expect(Math.hypot(last(smallFall)[0] - LAKE_INFLOW[0], last(smallFall)[1] - LAKE_INFLOW[1])).toBeLessThan(8);
    expect(lakeDrift[0][1]).toBeGreaterThanOrEqual(LAKE_INFLOW[1]);
  });

  it('along() walks a path monotonically with a unit tangent', () => {
    const p = FEEDER_PATHS.eastStream;
    const c = cum(p);
    let prev = -1;
    for (let u = 0; u <= 1; u += 0.05) {
      const a = along(p, c, u);
      expect(Math.hypot(a.tx, a.ty)).toBeCloseTo(1, 5);
      const d = Math.hypot(a.x - p[0][0], a.y - p[0][1]);
      expect(d + 1e-6).toBeGreaterThanOrEqual(prev - 30); // never jumps back across the path
      prev = Math.max(prev, d);
    }
  });
});
