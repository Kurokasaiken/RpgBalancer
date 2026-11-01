import { describe, expect, it } from 'vitest';
import { villageManifestSchema } from '@/balancing/config/idleVillage/villageZoneManifest';

const base = {
  version: 2,
  zone: { x: 1450, y: 520, w: 300, h: 260, feather: { shape: 'ellipse', px: 24 } },
  growth: ['meadow', 'cottages', 'straw', 'stone'],
  axes: { defence: { values: ['none', 'palisade', 'wall'] }, towers: { slots: 2, each: ['none', 'wood', 'stone'] } },
  registration: { nullEditResidualPx: null, layoutLockMaxPx: 2 },
  plates: [
    { key: 'meadow|none|none+none', src: 'fx/village/meadow.webp' },
    { key: 'stone|wall|stone+stone', src: 'fx/village/s.webp', anchors: { ring: [{ x: 10, y: 10 }] } },
    { key: 'stone|palisade|wood+none', src: 'x.webp', shipped: false, anchors: { ring: [{ x: 1, y: 1 }] } },
  ],
};

describe('villageZoneManifest (PLAN-106 T1)', () => {
  it('accepts a valid manifest incl. per-slot keys and shipped:false', () => {
    expect(villageManifestSchema.safeParse(base).success).toBe(true);
  });
  it('rejects a duplicate plate key', () => {
    const m = { ...base, plates: [...base.plates, base.plates[0]] };
    expect(villageManifestSchema.safeParse(m).success).toBe(false);
  });
  it('rejects an undeclared axis value in a key', () => {
    const m = { ...base, plates: [{ key: 'stone|wall|iron+stone', src: 'x', anchors: { ring: [{ x: 1, y: 1 }] } }] };
    expect(villageManifestSchema.safeParse(m).success).toBe(false);
  });
  it('rejects a defended plate without ring anchors', () => {
    const m = { ...base, plates: [{ key: 'stone|wall|wood+wood', src: 'x' }] };
    expect(villageManifestSchema.safeParse(m).success).toBe(false);
  });
  it('accepts an unshipped defended plate without anchors', () => {
    const m = { ...base, plates: [{ key: 'stone|wall|wood+wood', src: 'x', shipped: false }] };
    expect(villageManifestSchema.safeParse(m).success).toBe(true);
  });
  it('rejects a malformed key (3-tuple)', () => {
    const m = { ...base, plates: [{ key: 'stone|wall|stone', src: 'x' }] };
    expect(villageManifestSchema.safeParse(m).success).toBe(false);
  });
});
