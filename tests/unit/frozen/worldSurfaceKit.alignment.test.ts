import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * FROZEN CONTRACT guard for worldSurfaceKit.
 *
 * The pixel-perfect layer alignment of the World Surface map depends ENTIRELY
 * on the asset invariants below — not on runtime numbers. If any of these fail,
 * someone re-exported trimmed layers or reintroduced per-layer offset/scale,
 * which is exactly the drift bug this kit was created to eliminate.
 *
 * See: src/ui/idleVillage/frozen/kits/worldSurfaceKit.md
 */

const BASE = 'public/assets/world/wanderlust/base';
const MANIFEST = join(BASE, 'manifest.json');

/** Read a PNG's pixel dimensions straight from the IHDR chunk (no deps). */
function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  // PNG sig (8 bytes) + length (4) + "IHDR" (4) => width @ 16, height @ 20, BE uint32.
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

interface Layer { id: string; file: string; offsetX?: number; offsetY?: number; scale?: number }
interface Manifest {
  coordinateSystem: { canvas: { width: number; height: number } };
  renderer?: { imageFit?: string };
  surfaceLayers: Layer[];
  atmosphereLayers: Layer[];
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;
const canvas = manifest.coordinateSystem.canvas;
const allLayers = [...manifest.surfaceLayers, ...(manifest.atmosphereLayers ?? [])];

describe('worldSurfaceKit — frozen alignment contract', () => {
  it('renderer uses imageFit "none"', () => {
    expect(manifest.renderer?.imageFit).toBe('none');
  });

  it.each(allLayers.map((l) => [l.id, l] as const))(
    'layer "%s" has offset 0/0 and no per-layer scale',
    (_id, layer) => {
      expect(layer.offsetX ?? 0).toBe(0);
      expect(layer.offsetY ?? 0).toBe(0);
      // A per-layer scale means someone is repositioning by hand again.
      expect(layer.scale ?? 1).toBe(1);
    },
  );

  it.each(allLayers.map((l) => [l.file, l] as const))(
    'layer PNG "%s" is full-canvas (%s)',
    (file, layer) => {
      const path = join(BASE, 'layers', layer.file);
      expect(existsSync(path), `missing PNG: ${path}`).toBe(true);
      const { width, height } = pngSize(path);
      expect({ file, width, height }).toEqual({ file, width: canvas.width, height: canvas.height });
    },
  );
});
