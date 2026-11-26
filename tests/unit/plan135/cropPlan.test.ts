import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Rect = { x0: number; y0: number; x1: number; y1: number };
type Crop = {
  id: string;
  strip: 'top' | 'left' | 'right';
  sourceRegionWorldPx: Rect;
  keptRegionWorldPx: Rect;
  outputSizePx: { width: number; height: number };
  worldToCropScaleX: number;
  worldToCropScaleY: number;
};

const plan = JSON.parse(readFileSync('.mw/specs/mappa2-apron/crop-plan.json', 'utf8')) as {
  canvas: { width: number; height: number };
  apron: { top: number; right: number; bottom: number; left: number };
  cropSize: { width: number; height: number };
  crops: Crop[];
  validation: { ok: boolean; failures: string[] };
};
const width = (r: Rect) => r.x1 - r.x0 + 1;
const height = (r: Rect) => r.y1 - r.y0 + 1;
const crop = (id: string) => {
  const found = plan.crops.find((c) => c.id === id);
  if (!found) throw new Error(`missing crop ${id}`);
  return found;
};

describe('PLAN-135 native Gemini crop plan', () => {
  it('freezes the Director-approved 1376x768 scale-locked geometry', () => {
    expect(plan.validation).toEqual({ ok: true, failures: [] });
    expect(plan.cropSize).toEqual({ width: 1376, height: 768 });
    expect(plan.crops.map((c) => c.id)).toEqual([
      'top-01', 'top-02', 'top-03', 'top-04',
      'left-01', 'left-02', 'left-03',
      'right-01', 'right-02', 'right-03',
    ]);
    for (const c of plan.crops) {
      expect(c.outputSizePx).toEqual(plan.cropSize);
      expect(c.worldToCropScaleX).toBe(1);
      expect(c.worldToCropScaleY).toBe(1);
      expect(width(c.sourceRegionWorldPx)).toBe(1376);
      expect(height(c.sourceRegionWorldPx)).toBe(768);
    }
  });

  it('keeps the pilot corner/adjacent strips on the expected world geometry', () => {
    expect(crop('top-04').sourceRegionWorldPx).toEqual({ x0: 1936, y0: -200, x1: 3311, y1: 567 });
    expect(crop('top-04').keptRegionWorldPx).toEqual({ x0: 1936, y0: -200, x1: 3311, y1: -1 });
    expect(crop('top-03').sourceRegionWorldPx).toEqual({ x0: 1104, y0: -200, x1: 2479, y1: 567 });
    expect(crop('right-01').sourceRegionWorldPx).toEqual({ x0: 1936, y0: 0, x1: 3311, y1: 767 });
    expect(crop('right-01').keptRegionWorldPx).toEqual({ x0: 2752, y0: 0, x1: 3311, y1: 383 });
  });

  it('covers every apron pixel exactly once', () => {
    const expected = (plan.canvas.width + plan.apron.left + plan.apron.right) * plan.apron.top
      + (plan.apron.left + plan.apron.right) * plan.canvas.height;
    const owned = plan.crops.reduce((acc, c) => acc + width(c.keptRegionWorldPx) * height(c.keptRegionWorldPx), 0);
    expect(owned).toBe(expected);
    const top = plan.crops.filter((c) => c.strip === 'top');
    for (let i = 0; i < top.length - 1; i += 1) {
      expect(top[i].keptRegionWorldPx.x1 + 1).toBe(top[i + 1].keptRegionWorldPx.x0);
    }
    for (const strip of ['left', 'right'] as const) {
      const group = plan.crops.filter((c) => c.strip === strip);
      for (let i = 0; i < group.length - 1; i += 1) {
        expect(group[i].keptRegionWorldPx.y1 + 1).toBe(group[i + 1].keptRegionWorldPx.y0);
      }
    }
  });
});
