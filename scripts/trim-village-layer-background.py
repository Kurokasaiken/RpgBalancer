#!/usr/bin/env python3
"""Trim original-painting background that a village layer carries around its building.

Layers cut with GROW keep an opaque rim of the original painting; when a NEW building is placed
behind such a layer, the rim hides it. Remove, from layer <id>, the pixels that are
  (a) outside the building polygon grown by --grow px,
  (b) reproduced EXACTLY by base + the painting layers below it (so the all-on composite stays
      identical to the painting, 0 px), and
  (c) connected to the outside through such pixels.
Usage: trim-village-layer-background.py <layer-id> [--grow 8]
"""
import argparse, json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
L = ROOT / 'public/assets/village/layers'


def main() -> None:
    ap = argparse.ArgumentParser(); ap.add_argument('id'); ap.add_argument('--grow', type=int, default=8, help='polygon growth in px; -1 = ignore the polygon (it is just the layer box)')
    a = ap.parse_args()
    spec = json.loads((L / 'buildings.json').read_text())
    src = np.array(Image.open(ROOT / spec['source']).convert('RGB')).astype(np.int16)
    H, W = src.shape[:2]
    ls = json.loads((L / 'layers.json').read_text())['layers']

    def paste(c, l):
        im = np.array(Image.open(L / l['file']).convert('RGBA')).astype(np.float32)
        x, y, w, h = l['box']
        sx0, sy0, dx0, dy0 = max(0, -x), max(0, -y), max(0, x), max(0, y)
        dx1, dy1 = min(W, x + w), min(H, y + h)
        t = im[sy0:sy0 + dy1 - dy0, sx0:sx0 + dx1 - dx0]; al = t[..., 3:4] / 255.
        c[dy0:dy1, dx0:dx1] = t[..., :3] * al + c[dy0:dy1, dx0:dx1] * (1 - al)

    c = np.array(Image.open(L / 'base.webp').convert('RGB')).astype(np.float32)
    for l in ls:
        if l['id'] == a.id:
            break
        if l.get('source', 'painting') == 'painting':
            paste(c, l)
    below = np.rint(c).astype(np.int16)
    ly = next(l for l in ls if l['id'] == a.id); x, y, w, h = ly['box']
    im = np.array(Image.open(L / ly['file']).convert('RGBA')); al = im[..., 3]
    poly = next(b['poly'] for b in spec['buildings'] if b['id'] == a.id)
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(poly, np.int32)], 255)
    g = a.grow
    if g >= 0:
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * g + 1, 2 * g + 1)))
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    sub = (slice(y0 - y, y1 - y), slice(x0 - x, x1 - x))
    red = np.zeros((h, w), bool); outside_poly = np.zeros((h, w), bool)
    red[sub] = np.abs(below[y0:y1, x0:x1] - src[y0:y1, x0:x1]).max(axis=2) == 0
    outside_poly[sub] = (m[y0:y1, x0:x1] == 0) if g >= 0 else True
    cand = ((red & outside_poly) | (al == 0)).astype(np.uint8)
    pad = np.pad(cand, 1, constant_values=1); fill = pad.copy()
    cv2.floodFill(fill, np.zeros((pad.shape[0] + 2, pad.shape[1] + 2), np.uint8), (0, 0), 2, flags=4)
    remove = (fill == 2)[1:-1, 1:-1] & (al > 0)
    im[remove, 3] = 0
    Image.fromarray(im, 'RGBA').save(L / ly['file'], lossless=True)
    print(f'{a.id}: removed {int(remove.sum())} of {int((al > 0).sum())} px')


if __name__ == '__main__':
    main()
