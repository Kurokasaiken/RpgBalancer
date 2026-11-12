#!/usr/bin/env python3
"""Patch ugly inpaint artifacts in the village base painting (R-326 it.4).

The empty-base (`base.webp`) was produced by removing buildings from the
original painting; around the removed `house-small-west` (behind the inn) it
carries smeared trees, ghost roof edges, a pale smudge in the canopy, an
orange blob in the cypresses and a dark carcass-like blob in the meadow.

Strategy per zone:

- **Painting restore**: where the original painting shows clean forest/
  hillside (no building), copy painting -> base with a feathered mask —
  restores the real art instead of a synthetic fill.
- **Seamless clone**: the strip where the painting shows the cottage's roof
  top gets the clean hillside band cloned in from the right (x1140+).
- **Inpaint**: small blobs (orange smudge, dark smear band, meadow blob) are
  filled from their own surroundings.

Identity safety: the test only compares uncovered pixels to base itself, so
any base pixel outside painted-layer coverage may be patched freely; patched
pixels under a layer are invisible anyway.

Usage:
    python3 scripts/patch-village-base.py [--dry-run]
"""
from __future__ import annotations

import argparse
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'public/assets/village/layers/base.webp')
PAINTING = os.path.join(ROOT, 'src/assets/mood/rude-beauty/villaggio.png')
OUT_DIR = os.path.join(ROOT, '.mw/runs/20261112-r326-village-layer-recut/visual/patch')

FEATHER = 9

# painting -> base copy regions (painting depicts clean scenery here)
RESTORE_POLYS = [
    # pines + canopy band right of house-big-west's roof edge (x~725-760)
    [(742, 515), (895, 515), (900, 642), (800, 648), (770, 655), (745, 660)],
    # hillside + cypresses right of the roof top (extended up to cover haze)
    [(1046, 540), (1135, 540), (1135, 692), (1078, 692), (1046, 612)],
]

# (target rect x1,y1,x2,y2, source rect x1,y1) — seamless clone, same size
CLONES = [
    # ghost roof strip -> hillside cloned from the clean band on the right
    # (poisson blending hides the boundary; a plain paste shows a rectangle)
    ((762, 620, 1090, 726), (1094, 620)),
    # smeared tree band left of the restored pines -> real pines from the
    # base's own left forest (large areas cannot be inpainted without
    # starburst smearing)
    ((628, 540, 776, 730), (430, 540)),
    # dark carcass-looking blob in the meadow -> clean grass to its right;
    # poisson adapts luminance so no rectangle edge shows
    ((736, 950, 836, 1008), (880, 950)),
]

# inpaint rects (x1,y1,x2,y2)
INPAINTS = [
    (1056, 630, 1104, 668),   # orange blob in the cypresses
]

INPAINT_RADIUS = 6


def feathered_mask(shape, poly, feather):
    """Builds a float 0..1 mask for a polygon, softened at the rim."""
    m = np.zeros(shape, np.uint8)
    cv2.fillPoly(m, [np.array(poly, np.int32)], 255)
    m = cv2.GaussianBlur(m, (0, 0), feather).astype(np.float32) / 255.0
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)

    base = cv2.cvtColor(np.array(Image.open(BASE).convert('RGB')), cv2.COLOR_RGB2BGR)
    paint = cv2.cvtColor(np.array(Image.open(PAINTING).convert('RGB')), cv2.COLOR_RGB2BGR)
    out = base.copy()
    H, W = out.shape[:2]

    # 1) restore real scenery from the painting
    for poly in RESTORE_POLYS:
        m = feathered_mask((H, W), poly, FEATHER)[..., None]
        out[:] = (out * (1 - m) + paint * m).astype(np.uint8)

    # 2) seamless-clone clean regions over ghost strips
    for (x1, y1, x2, y2), (sx, sy) in CLONES:
        w, h = x2 - x1, y2 - y1
        src = out[sy:sy + h, sx:sx + w].copy()
        mask = np.full((h, w), 255, np.uint8)
        out = cv2.seamlessClone(src, out, mask, (x1 + w // 2, y1 + h // 2),
                                cv2.NORMAL_CLONE)

    # 3) inpaint the leftover blobs
    mask = np.zeros((H, W), np.uint8)
    for x1, y1, x2, y2 in INPAINTS:
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8))
    out = cv2.inpaint(out, mask, INPAINT_RADIUS, cv2.INPAINT_TELEA)

    rgb = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
    Image.fromarray(rgb).crop((400, 380, 1400, 1100)).save(
        os.path.join(OUT_DIR, 'patched-inn-zone.png'))
    Image.fromarray(rgb).crop((550, 480, 1360, 760)).resize(
        (1620, 560), Image.NEAREST).save(
        os.path.join(OUT_DIR, 'patched-band.png'))
    if args.dry_run:
        print('dry-run: previews written to', OUT_DIR)
        return
    Image.fromarray(rgb).save(BASE, lossless=True)
    print('base.webp patched')


if __name__ == '__main__':
    main()
