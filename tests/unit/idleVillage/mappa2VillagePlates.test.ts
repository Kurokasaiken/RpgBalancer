import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

/**
 * Director 2026-11-02 («continua a flickerare, la torre è in un posto diverso,
 * adesso c'è anche un muro nella cinta muraria»): village plates are composed —
 * growth base + stamped ring + stamped tower sprites — so a state transition only
 * adds an element over a pixel-identical village (no repaint morph on cross-fade),
 * towers carry no foreign wall fragments, and a slot's tower foot is identical
 * across materials and defence families.
 *
 * These invariants live in the baked plates produced by
 * `scripts/compose-village-towers.py`.
 */
const VIL = resolve(__dirname, '../../../public/assets/world/mappa2/base/fx/village');
const W = 510;
const H = 390;

/** Ring ellipse of the closed-ring source (compose `SRC_DE`): centre (289.4,212.7), 155×96, tilted 5°. */
const RING_T = (85 * Math.PI) / 180;
const ringDe = (x: number, y: number) => {
  const xr = (x - 289.4) * Math.cos(RING_T) + (y - 212.7) * Math.sin(RING_T);
  const yr = -(x - 289.4) * Math.sin(RING_T) + (y - 212.7) * Math.cos(RING_T);
  return (xr / 95.6) ** 2 + (yr / 154.9) ** 2;
};

async function rgb(name: string): Promise<Uint8Array> {
  const { data } = await sharp(resolve(VIL, name)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return new Uint8Array(data.buffer, data.byteOffset, data.length);
}

const diffAt = (a: Uint8Array, b: Uint8Array, i: number) =>
  Math.max(Math.abs(a[i * 3] - b[i * 3]), Math.abs(a[i * 3 + 1] - b[i * 3 + 1]), Math.abs(a[i * 3 + 2] - b[i * 3 + 2]));

/**
 * The stone tower gets a procedural cast shadow (darkening only) on whatever it
 * falls on — grass, house, wall — so a pixel darker in every channel is not
 * counted: the footprint must locate the tower body, not its shadow.
 */
function isShadow(base: Uint8Array, plate: Uint8Array, i: number) {
  return [0, 1, 2].every((c) => (plate[i * 3 + c] + 1) / (base[i * 3 + c] + 1) <= 1.02);
}

/** Footprint (bottom-centre) of the changed blob inside a search window (cast shadow excluded). */
function footprint(base: Uint8Array, plate: Uint8Array, box: { x0: number; y0: number; x1: number; y1: number }) {
  const pts: [number, number][] = [];
  for (let y = box.y0; y < box.y1; y += 1)
    for (let x = box.x0; x < box.x1; x += 1) {
      const i = y * W + x;
      if (diffAt(base, plate, i) > 40 && !isShadow(base, plate, i)) pts.push([x, y]);
    }
  expect(pts.length).toBeGreaterThan(0);
  const maxY = Math.max(...pts.map((p) => p[1]));
  // median x of the bottom band: robust to a base edge that sits on grey wall
  // (grey-on-grey drops out of the diff) or to a few shadow-edge pixels
  const xs = pts.filter((p) => p[1] >= maxY - 12).map((p) => p[0]).sort((u, v) => u - v);
  return { x: xs[Math.floor(xs.length / 2)], y: maxY };
}

const S1 = { x0: 90, y0: 140, x1: 240, y1: 340 };
const S2 = { x0: 340, y0: 60, x1: 500, y1: 290 };

describe('mappa2 village plates — composed, no repaint morph (R-309)', () => {
  // 2026-11-03 («continua a fallire»): an opaque RGB rebake drew every defended
  // plate as a hard 510×390 rectangle on the map — corners must stay transparent.
  it('every shipped plate keeps its feathered alpha (no rectangle seam)', async () => {
    const { readFile } = await import('node:fs/promises');
    const manifest = JSON.parse(await readFile(resolve(VIL, 'village.json'), 'utf8')) as {
      plates: { src: string; shipped: boolean }[];
    };
    const opaque: string[] = [];
    for (const p of manifest.plates.filter((q) => q.shipped)) {
      const { data, info } = await sharp(resolve(VIL, p.src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const a = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
      const w = info.width - 1;
      const h = info.height - 1;
      if (Math.max(a(0, 0), a(w, 0), a(0, h), a(w, h)) > 8) opaque.push(p.src);
    }
    expect(opaque).toEqual([]);
  });

  it.each(['cottages', 'straw', 'stone'])('defence adds only the ring on the %s base', async (growth) => {
    const base = await rgb(`${growth}-none-none-none.webp`);
    for (const def of ['palisade', 'wall']) {
      const plate = await rgb(`${growth}-${def}-none-none.webp`);
      let n = 0;
      let sum = 0;
      let changed = 0;
      for (let y = 0; y < H; y += 1)
        for (let x = 0; x < W; x += 1) {
          const de = ringDe(x, y);
          if (de > 0.3 && de < 2.3) continue; // the feathered ring band itself may change
          const i = y * W + x;
          const d = diffAt(base, plate, i);
          n += 1;
          sum += d;
          if (d > 40) changed += 1;
        }
      expect(sum / n).toBeLessThan(2); // only webp noise off-band
      expect(changed / n).toBeLessThan(0.005);
    }
  });

  it('towers share one foot per slot across materials and defence families', async () => {
    for (const def of ['palisade', 'wall']) {
      const host = await rgb(`stone-${def}-none-none.webp`);
      for (const [slot, box] of [[1, S1], [2, S2]] as const) {
        const other = slot === 1 ? 'none' : 'none';
        const feet = await Promise.all(
          (['wood', 'stone'] as const).map(async (m) => {
            const key = slot === 1 ? `stone-${def}-${m}-${other}` : `stone-${def}-none-${m}`;
            return footprint(host, await rgb(`${key}.webp`), box);
          }),
        );
        // bottom-row centroid of a narrow-leg wood sprite vs a wide-base stone one
        // drifts a few px even when anchored identically; the old bug was 27px.
        expect(Math.abs(feet[0].x - feet[1].x)).toBeLessThan(14);
        expect(Math.abs(feet[0].y - feet[1].y)).toBeLessThan(10);
      }
    }
  });

  it('palisade and wall towers stand at the same spot', async () => {
    const palHost = await rgb('stone-palisade-none-none.webp');
    const wallHost = await rgb('stone-wall-none-none.webp');
    const palW = await rgb('stone-palisade-stone-none.webp');
    const wallW = await rgb('stone-wall-stone-none.webp');
    // diff each towered plate vs its own host, footprints must match within 6px
    const fPal = footprint(palHost, palW, S1);
    const fWall = footprint(wallHost, wallW, S1);
    expect(Math.abs(fPal.x - fWall.x)).toBeLessThan(6);
    expect(Math.abs(fPal.y - fWall.y)).toBeLessThan(6);
  });
});
