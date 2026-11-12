#!/usr/bin/env python3
"""Render visual-check composites for the village layers (R-326).

Writes, into an output dir (default ``/tmp/village-inspect``):
- ``all-on.png`` — base + every manifest layer, the way VillageBuildingLayers
  composites them;
- ``solo-<id>.png`` — base + a single layer, cropped around the layer's box,
  for eyeballing foreign fragments in recut layers;
- ``smallwest-area.png`` — the retired house-small-west region on the all-on
  composite.

Usage:
    python3 scripts/village-layer-visual-check.py [--out DIR]
"""
from __future__ import annotations

import argparse
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYERS = os.path.join(ROOT, 'public/assets/village/layers')
INSPECT_IDS = [
    'house-thatch-big', 'house-stone-mid', 'hut-far-2', 'hut-far-1',
    'house-east-edge', 'lumber',
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='/tmp/village-inspect')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    spec = json.load(open(os.path.join(LAYERS, 'layers.json')))
    W, H = spec['size']
    base = Image.open(os.path.join(LAYERS, spec['base'])).convert('RGBA')

    def composite(ids=None):
        im = base.copy()
        for l in spec['layers']:
            if ids and l['id'] not in ids:
                continue
            ly = Image.open(os.path.join(LAYERS, l['file'])).convert('RGBA')
            tile = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            tile.paste(ly, (l['box'][0], l['box'][1]))
            im = Image.alpha_composite(im, tile)
        return im

    composite().save(os.path.join(args.out, 'all-on.png'))
    for lid in INSPECT_IDS:
        l = next((x for x in spec['layers'] if x['id'] == lid), None)
        if not l:
            continue
        x, y, w, h = l['box']
        composite([lid]).crop((x - 20, y - 20, x + w + 20, y + h + 20)).save(
            os.path.join(args.out, f'solo-{lid}.png'))
    composite().crop((600, 600, 1250, 1050)).save(
        os.path.join(args.out, 'smallwest-area.png'))
    print('visual check written to', args.out)


if __name__ == '__main__':
    main()
