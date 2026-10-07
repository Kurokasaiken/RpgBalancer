import { describe, it, expect } from 'vitest';
import { cartouchePath } from '@/ui/designSystem/primitives/geometry/cartouchePath';

describe('cartouchePath', () => {
  it('draws a closed rounded rectangle for panels, clamping the radius', () => {
    const d = cartouchePath({ shape: 'panel', size: 18 }, 300, 86);
    expect(d.startsWith('M18,0')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(cartouchePath({ shape: 'panel', size: 500 }, 100, 40)).toContain('A20,20');
  });

  it('keeps a hanging plaque flat on top and inside its box', () => {
    const d = cartouchePath({ shape: 'hang', size: 30, sag: 3 }, 400, 80);
    expect(d.startsWith('M0,0H400')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...nums)).toBeLessThanOrEqual(400);
  });

  it('mirrors the shoulders: the foot starts and ends symmetrically', () => {
    const d = cartouchePath({ shape: 'hang', size: 20 }, 300, 60);
    expect(d).toContain('300,');
    expect(d).toContain('H26');
  });

  it('stands a plinth on the bottom edge: the hang silhouette reflected top to bottom', () => {
    const d = cartouchePath({ shape: 'plinth', size: 26, sag: 3 }, 500, 70);
    expect(d.startsWith('M0,70H500')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    // The free edge bulges upward, away from the bottom anchor, by at most 2 * sag (the curve's control point).
    expect(Math.max(...nums)).toBeLessThanOrEqual(500);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(-6);
    expect(d).toContain(',-6');
  });
});
