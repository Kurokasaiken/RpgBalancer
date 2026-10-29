import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * PLAN-092 GPU diet: `Foreground.webp` ships as the strip that holds the two corner wedges, and the
 * manifest layer `rect` maps it back to world px. If the file and the rect drift apart the vignette
 * is drawn stretched or misplaced, so the file's real size is checked against the rect.
 */
const BASE = resolve(__dirname, '../../../public/assets/world/mappa2/base');

/** Canvas size of a lossy/lossless WebP with a VP8X header (RGBA files always have one). */
const webpSize = (file: string): { width: number; height: number } => {
  const b = readFileSync(file);
  expect(b.toString('ascii', 0, 4)).toBe('RIFF');
  expect(b.toString('ascii', 8, 12)).toBe('WEBP');
  expect(b.toString('ascii', 12, 16)).toBe('VP8X');
  return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
};

describe('mappa2 Foreground crop', () => {
  const manifest = JSON.parse(readFileSync(resolve(BASE, 'manifest.json'), 'utf-8')) as {
    surfaceLayers: { id: string; file: string; rect?: { x: number; y: number; width: number; height: number; sourceWidth: number; sourceHeight: number } }[];
  };
  const layer = manifest.surfaceLayers.find((l) => l.id === 'foreground');

  it('declares a source rect for the cropped strip', () => {
    expect(layer?.rect).toBeDefined();
    const r = layer!.rect!;
    expect(r.sourceWidth).toBe(2752);
    expect(r.sourceHeight).toBe(1536);
    expect(r.x + r.width).toBeLessThanOrEqual(r.sourceWidth);
    expect(r.y + r.height).toBeLessThanOrEqual(r.sourceHeight);
    // The whole point of the crop: it must be a real saving, not the full world texture.
    expect(r.width * r.height).toBeLessThan(r.sourceWidth * r.sourceHeight * 0.4);
  });

  it('matches the pixel size of the shipped file', () => {
    const r = layer!.rect!;
    const size = webpSize(resolve(BASE, 'layers', layer!.file));
    expect(size).toEqual({ width: r.width, height: r.height });
  });
});
