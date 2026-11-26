/**
 * R-388 — the quest POI sapphire tips are painted pixels, not holes.
 * The production quest base lost alpha inside the cardinal sapphire seats while
 * retaining the original blue RGB underneath; when the light/top layers are
 * composited the map shows through the jewel tips. These probes read the
 * shipped asset at the exact native-canvas coordinates of the holes.
 */
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { join } from 'node:path';

const QUEST_LAYER_DIR = join(process.cwd(), 'public/assets/ui/hud-real/poi/layers');
const QUEST_BASE = join(QUEST_LAYER_DIR, 'poi-quest-base.webp');
const QUEST_COLOR_LAYERS = [
  { name: 'detail base', path: QUEST_BASE },
  { name: 'detail top', path: join(QUEST_LAYER_DIR, 'poi-quest-top.webp') },
  { name: 'far light', path: join(QUEST_LAYER_DIR, 'poi-quest-light.webp') },
] as const;

interface SapphireProbe {
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

const SAPPHIRE_TIP_PROBES: readonly SapphireProbe[] = [
  { name: 'west upper sapphire edge', x: 423, y: 863 },
  { name: 'west lower sapphire edge', x: 423, y: 904 },
  { name: 'east upper sapphire edge', x: 1363, y: 861 },
  { name: 'east lower sapphire edge', x: 1364, y: 905 },
  { name: 'south sapphire body', x: 895, y: 1391 },
];

/**
 * Reads one RGBA pixel from a raw sharp buffer.
 */
function pixelAt(data: Buffer, width: number, channels: number, x: number, y: number) {
  const i = (y * width + x) * channels;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

/**
 * Median HSV-style saturation of blue pixels in a small facet patch.
 */
function medianBlueSaturationInPatch(
  data: Buffer,
  width: number,
  channels: number,
  centreX: number,
  centreY: number,
  radius: number,
) {
  const saturations: number[] = [];
  for (let y = centreY - radius; y <= centreY + radius; y += 1) {
    for (let x = centreX - radius; x <= centreX + radius; x += 1) {
      const px = pixelAt(data, width, channels, x, y);
      if (px.a < 240 || px.b <= px.r + 5 || px.b <= px.g) continue;
      const high = Math.max(px.r, px.g, px.b);
      const low = Math.min(px.r, px.g, px.b);
      saturations.push(high === 0 ? 0 : (high - low) / high);
    }
  }
  saturations.sort((a, b) => a - b);
  return { count: saturations.length, median: saturations[Math.floor(saturations.length / 2)] ?? 0 };
}

describe('R-388 poi quest sapphire tips', () => {
  // INV:poi-zanara.INV-1 — the cardinal sapphire tips/seats in the quest POI base stay opaque and blue;
  // layer misregistration must not leave transparent holes that reveal the map through the jewels.
  it('keeps the shipped quest base opaque and blue at the cardinal sapphire tips', async () => {
    const { data, info } = await sharp(QUEST_BASE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const probe of SAPPHIRE_TIP_PROBES) {
      const px = pixelAt(data, info.width, info.channels, probe.x, probe.y);
      expect(px.a, `${probe.name} alpha at ${probe.x},${probe.y}`).toBeGreaterThanOrEqual(240);
      expect(px.b, `${probe.name} is blue-dominant`).toBeGreaterThan(px.r + 15);
      expect(px.b, `${probe.name} is sapphire rather than gold/grey`).toBeGreaterThan(px.g + 5);
    }
  });

  it('keeps the north upper sapphire facet saturated like the other cardinal gems', async () => {
    for (const layer of QUEST_COLOR_LAYERS) {
      const { data, info } = await sharp(layer.path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const patch = medianBlueSaturationInPatch(data, info.width, info.channels, 892, 430, 5);
      expect(patch.count, `${layer.name} north upper facet blue sample count`).toBeGreaterThan(40);
      expect(patch.median, `${layer.name} north upper facet median saturation`).toBeGreaterThanOrEqual(0.45);
    }
  });
});
