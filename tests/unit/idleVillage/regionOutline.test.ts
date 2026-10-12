import { describe, expect, it } from 'vitest';
import { simplifyLoop, traceBoundaryLoops } from '@/ui/idleVillage/pixiSpike/regionOutline';

const mask = (rows: string[]) => {
  const h = rows.length;
  const w = rows[0].length;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === '#';
  return { w, h, inside };
};

describe('traceBoundaryLoops', () => {
  it('walks a filled square as one loop of four corners', () => {
    const { w, h, inside } = mask(['###', '###', '###']);
    const loops = traceBoundaryLoops(w, h, inside);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(12);
  });

  it('finds a hole as a second loop', () => {
    const { w, h, inside } = mask(['#####', '#####', '##.##', '#####', '#####']);
    const loops = traceBoundaryLoops(w, h, inside);
    expect(loops).toHaveLength(2);
  });

  it('returns nothing for an empty mask', () => {
    const { w, h, inside } = mask(['...', '...']);
    expect(traceBoundaryLoops(w, h, inside)).toEqual([]);
  });
});

describe('simplifyLoop', () => {
  it('straightens a stair-stepped diagonal into its end corners', () => {
    const rows = Array.from({ length: 12 }, (_, y) => '#'.repeat(y + 1).padEnd(12, '.'));
    const { w, h, inside } = mask(rows);
    const [loop] = traceBoundaryLoops(w, h, inside);
    const simplified = simplifyLoop(loop, 1.5);
    expect(simplified.length).toBeLessThan(loop.length / 4);
  });

  it('keeps a square as its four corners', () => {
    const { w, h, inside } = mask(['####', '####', '####', '####']);
    const [loop] = traceBoundaryLoops(w, h, inside);
    expect(simplifyLoop(loop, 0.5)).toHaveLength(4);
  });
});
