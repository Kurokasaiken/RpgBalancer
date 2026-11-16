#!/usr/bin/env python3
"""R-326 iter.6: re-cut the 6 PAINTED village layers to tight silhouettes.

Why: cut-village-layers.py built each layer as `painting ∩ grown(hit-poly)` —
the hit polys in buildings.json are generous tooltip regions, so every layer
carried a rectangular slab of scenery around its building ("tutte le case
ritagliate sbagliate"). masks.json now stores hand-traced silhouette polys;
this script rebuilds each painted layer as `painting ∩ silhouette`, where:

- alpha = 255 inside the poly, feathered OUTWARD ~1.5px (the freed ring below
  is painting in the base, so the composite stays 0-diff by construction);
- contested pixels between two painted masks are assigned to the first layer
  in manifest order and the feather tail is clipped at the other mask, so
  painted alphas stay strictly disjoint (INV:R-326-layer-disjoint);
- mask pixels inside the retired house-small-west polygon are dropped — the
  cottage stays out of every layer and out of the base (fill);
- base.webp: pixels that belonged to the old slab but are now outside the
  silhouette are restored to painting pixels, except inside the retired poly
  (patched fill is kept). Fill inside the silhouettes is unchanged.

Added-art layers (chief-house, inn, lumber) are untouched: their alpha is the
authored sprite edge, not a painting slab.

Usage: recut-village-silhouettes.py [--dry-run]
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src/assets/mood/rude-beauty/villaggio.png'
L = ROOT / 'public/assets/village/layers'
RETIRED = 'house-small-west'
FEATHER = 1.5  # outward fade in px; interior stays 255 so identity holds


def rasterize(poly, H, W):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(poly, np.int32)], 255)
    return m > 0


def layer_alpha(path):
    return np.array(Image.open(path).convert('RGBA'))[..., 3] > 0


def save_atomic(im, path):
    tmp = path.with_suffix('.tmp.webp')
    im.save(tmp, lossless=True)
    tmp.replace(path)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    painting = np.array(Image.open(SRC).convert('RGB'))
    H, W = painting.shape[:2]
    masks = json.loads((L / 'masks.json').read_text())
    man = json.loads((L / 'layers.json').read_text())
    spec = json.loads((L / 'buildings.json').read_text())
    painted = [e['id'] for e in man['layers'] if e['id'] in masks]
    retired = rasterize(next(b['poly'] for b in spec['buildings'] if b['id'] == RETIRED), H, W)

    # old alphas on the full canvas, read before any file is rewritten
    old_alpha = {}
    for e in man['layers']:
        if e['id'] not in painted:
            continue
        x, y, w, h = e['box']
        a = np.zeros((H, W), bool)
        a[y:y + h, x:x + w] = layer_alpha(L / e['file'])
        old_alpha[e['id']] = a

    # 1) raster + retire + assign contested pixels in manifest order
    bin_masks, assigned = {}, np.zeros((H, W), bool)
    for lid in painted:
        m = rasterize(masks[lid], H, W) & ~retired & ~assigned
        bin_masks[lid] = m
        assigned |= m

    # 2) outward feather clipped at other painted masks and the retired poly
    alphas = {}
    for lid in painted:
        m = bin_masks[lid]
        dist_out = cv2.distanceTransform((~m).astype(np.uint8), cv2.DIST_L2, 3)
        a = np.clip(FEATHER - dist_out + 0.5, 0, 1)
        a[m] = 1.0
        a[assigned & ~m] = 0
        a[retired] = 0
        alphas[lid] = a

    # feather tails can reach into the gap between two masks — at any pixel with
    # more than one nonzero alpha keep only the strongest owner, so painted
    # alphas stay strictly disjoint (INV:R-326-layer-disjoint)
    stack = np.stack([alphas[lid] for lid in painted])
    winner = stack.argmax(axis=0)
    for i, lid in enumerate(painted):
        alphas[lid] = np.where(winner == i, stack[i], 0)
        alphas[lid] = (alphas[lid] * 255).astype(np.uint8)

    # 3) rebuild each painted layer: RGB = painting, alpha = silhouette
    new_layers = []
    for e in man['layers']:
        if e['id'] not in alphas:
            new_layers.append(e)
            continue
        a = alphas[e['id']]
        ys, xs = np.where(a > 0)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = painting[y0:y1, x0:x1]
        rgba[..., 3] = a[y0:y1, x0:x1]
        print(f"{e['id']:>18}: box {e['box']} -> [{x0},{y0},{x1-x0},{y1-y0}], alpha {np.count_nonzero(a)} px")
        if not args.dry_run:
            save_atomic(Image.fromarray(rgba, 'RGBA'), L / e['file'])
        new_layers.append({**e, 'box': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]})

    # 4) base: freed slab pixels back to painting (retired poly keeps its fill)
    base = np.array(Image.open(L / 'base.webp').convert('RGB')).copy()
    restored = 0
    for lid in painted:
        freed = old_alpha[lid] & ~assigned
        freed &= ~retired
        restored += int(freed.sum())
        base[freed] = painting[freed]
    print(f'base: {restored} slab px restored to painting')
    if not args.dry_run:
        save_atomic(Image.fromarray(base, 'RGB'), L / 'base.webp')
        (L / 'layers.json').write_text(json.dumps({**man, 'layers': new_layers}, indent=2))
    print('done' if not args.dry_run else 'dry-run done')


if __name__ == '__main__':
    main()
