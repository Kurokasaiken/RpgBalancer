"""Clean the cut-out edges of the painted world layers (islands, forests, mountains, village).

The layers were cut from the painting with a soft matte, so their semi-transparent edge pixels still carry the colour
of whatever was behind them (sea teal around the islands, pale ground around the dark forests): on the map that reads
as a light halo and a bad cut. For every layer that is placed with a rect:
  1. edge pixels (alpha < 250) take the colour of the nearest solid pixels (colour bleed, 10 px);
  2. the alpha is choked a little (faint fringe removed, solid kept), so the silhouette is a clean, slightly tighter cut.

Runs on the original and the graded version of each layer. Idempotent enough for a re-run (choke only gets tighter,
so run it once; originals are in git history).

Usage: python3 scripts/defringe-layers.py
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'world', 'wanderlust', 'base')
LAYERS = os.path.join(ROOT, 'layers')
BLEED_STEPS = 10
CHOKE_LOW = 70   # alpha below this becomes 0
CHOKE_HIGH = 235  # alpha above this becomes 255


def bleed(rgb: np.ndarray, known: np.ndarray) -> np.ndarray:
    rgb = rgb.astype(np.float32).copy()
    known = known.copy()
    for _ in range(BLEED_STEPS):
        acc = np.zeros_like(rgb)
        cnt = np.zeros(known.shape, dtype=np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            k = np.roll(known, (dy, dx), axis=(0, 1))
            c = np.roll(rgb, (dy, dx), axis=(0, 1))
            acc += c * k[..., None]
            cnt += k
        fill = (~known) & (cnt > 0)
        rgb[fill] = acc[fill] / cnt[fill][..., None]
        known = known | fill
    return rgb


def clean(path: str) -> None:
    img = Image.open(path).convert('RGBA')
    a = np.array(img)
    alpha = a[..., 3].astype(np.float32)
    solid = alpha >= 250
    # Interior colour: bleed outward from the solid pixels over every non-solid pixel.
    rgb = bleed(a[..., :3], solid)
    rgb[solid] = a[..., :3][solid]
    new_alpha = np.clip((alpha - CHOKE_LOW) / (CHOKE_HIGH - CHOKE_LOW), 0, 1) * 255
    out = np.dstack([np.clip(rgb, 0, 255), new_alpha]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(path, quality=94, method=6)


def main() -> None:
    manifest = json.load(open(os.path.join(ROOT, 'manifest.json')))
    for layer in manifest['surfaceLayers']:
        if not layer.get('rect') or layer['id'] == 'background':
            continue
        name = layer['file']
        for variant in (name, name.replace('.webp', '.graded.webp')):
            path = os.path.join(LAYERS, variant)
            if os.path.exists(path):
                clean(path)
                print('cleaned', variant)


if __name__ == '__main__':
    main()
