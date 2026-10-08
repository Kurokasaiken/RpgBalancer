"""Split the forest canopies from the flattened base so they can sway.

The painted forest layers match the flattened base to ~1.5 levels, so an overlay that moves would double up with
the base underneath. This builds, for the original and the graded base:
  - `layers/<forest layer>.canopy[.graded].webp`: the canopy as it looks in THAT base (rgb cropped from it, alpha from
    the cleaned forest layer), so colours match exactly and the grade is respected;
  - `layers/base_flat[.graded].nocanopy.webp`: the base with every canopy replaced by a soft, darker understory colour
    (normalised blur of the surrounding canopy), so a swaying canopy never shows a second copy of itself.

Usage: python3 scripts/build-canopy.py
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'world', 'wanderlust', 'base')
LAYERS = os.path.join(ROOT, 'layers')
MATCH = ('forest', 'trees')
# Only pixels the canopy fully covers are replaced: where its alpha is partial the base shows through the overlay, and a
# fill colour different from the ground there drew a pale ring around every clump.
UNDERSTORY = 0.78
GROW_PX = 0
BLUR_RADIUS = 14


def box_blur(a: np.ndarray, r: int) -> np.ndarray:
    k = 2 * r + 1
    pad = np.pad(a, ((r, r), (r, r)) + ((0, 0),) * (a.ndim - 2), mode='edge')
    c = pad.cumsum(0).cumsum(1)
    c = np.pad(c, ((1, 0), (1, 0)) + ((0, 0),) * (a.ndim - 2))
    h, w = a.shape[:2]
    return (c[k:k + h, k:k + w] - c[:h, k:k + w] - c[k:k + h, :w] + c[:h, :w]) / (k * k)


def grow(mask: np.ndarray, n: int) -> np.ndarray:
    m = mask.copy()
    for _ in range(n):
        g = m.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            g |= np.roll(m, (dy, dx), axis=(0, 1))
        m = g
    return m


def main() -> None:
    manifest = json.load(open(os.path.join(ROOT, 'manifest.json')))
    forests = [l for l in manifest['surfaceLayers'] if l.get('rect') and any(k in l['id'] for k in MATCH)]
    for variant in ('', '.graded'):
        base = np.array(Image.open(os.path.join(LAYERS, f'base_flat{variant}.webp')).convert('RGBA')).astype(np.float32)
        full_mask = np.zeros(base.shape[:2], bool)
        for l in forests:
            r = l['rect']
            alpha = np.array(Image.open(os.path.join(LAYERS, l['file'])).convert('RGBA'))[..., 3]
            crop = base[r['y']:r['y'] + r['height'], r['x']:r['x'] + r['width']]
            if crop.shape[:2] != alpha.shape:
                raise SystemExit(f"{l['id']}: rect does not match the layer image")
            out = np.dstack([crop[..., :3], alpha]).astype(np.uint8)
            stem = os.path.splitext(l['file'])[0]
            # Lossless and exact: lossy WebP rewrites the colour under transparent pixels, which filtered into a pale ring.
            Image.fromarray(out, 'RGBA').save(os.path.join(LAYERS, f'{stem}.canopy{variant}.webp'), lossless=True, exact=True, method=4)
            full_mask[r['y']:r['y'] + r['height'], r['x']:r['x'] + r['width']] |= alpha >= 250
        mask = grow(full_mask, GROW_PX)
        w = mask.astype(np.float32)
        rgb = base[..., :3] * w[..., None]
        for _ in range(3):
            rgb = box_blur(rgb, BLUR_RADIUS)
            w = box_blur(w, BLUR_RADIUS)
        fill = rgb / np.maximum(w, 1e-4)[..., None] * UNDERSTORY
        soft = np.clip(box_blur(mask.astype(np.float32), 1), 0, 1)[..., None]
        merged = base.copy()
        merged[..., :3] = base[..., :3] * (1 - soft) + fill * soft
        Image.fromarray(np.clip(merged, 0, 255).astype(np.uint8), 'RGBA').save(
            os.path.join(LAYERS, f'base_flat{variant}.nocanopy.webp'), quality=95, method=6)
        print('variant', variant or 'original', 'canopy layers', len(forests), 'masked share', round(float(mask.mean()), 3))


if __name__ == '__main__':
    main()
