#!/usr/bin/env python3
"""Rebuild the `lumber` village layer from the harmonized sawmill gen (R-326).

The current layer was cut by harmonize-village-building.py with a mask grown
from the placed sprite but then trimmed — it keeps ~19.6k px of chief-house's
arch on the left, ~2.8k px inside hut-far-1, and the sawmill's right wing / log
dock is cut off around x=1590-1629 while the building reaches ~x1660.

Sources (still on disk):
- ``out/village-chain/rude/harm-saw-0.png``  — Gemini harmonized repaint
- ``out/village-chain/rude/harm-saw-crop.jpg`` — the 600x360 composite crop it
  was harmonized from, at painting origin (1180,640)

The layer keeps only the sawmill polygon (building + water strip + log dock +
ground band), feathered 3px, minus chief-house's alpha (the foreign piece).
Where the sawmill's right side overlaps hut-far-1's silhouette is kept: the
sawmill stands in front of that hut (z-order paints lumber above it anyway).

Usage:
    python3 scripts/recut-village-lumber.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYERS = os.path.join(ROOT, 'public/assets/village/layers')
MANIFEST = os.path.join(LAYERS, 'layers.json')
RUDE = os.path.join(ROOT, 'out/village-chain/rude')

CROP_XY = (1180, 640)  # painting origin of the 600x360 harmonization crop
# Sawmill silhouette in crop coords: left wing, both roofs, water strip on the
# left, log piles + dock on the right, ground band at the foot.
SAWMILL_POLY = [
    (196, 250), (212, 220), (240, 200), (285, 193), (335, 198), (380, 208),
    (415, 215), (420, 245), (450, 275), (478, 305), (480, 340), (445, 354),
    (320, 357), (250, 352), (215, 340), (195, 315), (193, 280),
]
FEATHER = 3
CHIEF_MARGIN = 2


def align_gen_to_crop():
    """Returns the harmonized gen resized to 600x360 and warped onto the crop."""
    crop = np.array(Image.open(os.path.join(RUDE, 'harm-saw-crop.jpg')).convert('RGB'))
    gen = np.array(
        Image.open(os.path.join(RUDE, 'harm-saw-0.png'))
        .convert('RGB').resize((600, 360), Image.LANCZOS))
    g1 = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    g2 = cv2.cvtColor(gen, cv2.COLOR_RGB2GRAY)
    orb = cv2.ORB_create(5000)
    k1, d1 = orb.detectAndCompute(g1, None)
    k2, d2 = orb.detectAndCompute(g2, None)
    mt = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2),
                key=lambda m: m.distance)[:400]
    A, _ = cv2.estimateAffinePartial2D(
        np.float32([k2[m.trainIdx].pt for m in mt]),
        np.float32([k1[m.queryIdx].pt for m in mt]),
        ransacReprojThreshold=3)
    gen = cv2.warpAffine(gen, A, (600, 360), flags=cv2.INTER_LANCZOS4,
                         borderMode=cv2.BORDER_REFLECT)
    return crop, gen, A


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    manifest = json.load(open(MANIFEST))
    W, H = manifest['size']
    lumber = next(l for l in manifest['layers'] if l['id'] == 'lumber')
    chief = next(l for l in manifest['layers'] if l['id'] == 'chief-house')

    crop, gen, A = align_gen_to_crop()
    print('align:', np.round(A, 4).tolist())

    # mask in crop coords
    mask = np.zeros((360, 600), np.uint8)
    cv2.fillPoly(mask, [np.array(SAWMILL_POLY, np.int32)], 255)
    mask = cv2.GaussianBlur(mask, (0, 0), FEATHER / 2)

    # chief alpha on the crop region, dilated by CHIEF_MARGIN
    cx, cy, cw, ch = chief['box']
    ca = np.array(Image.open(os.path.join(LAYERS, chief['file']))
                  .convert('RGBA'))[..., 3]
    ca_crop = np.zeros((360, 600), np.uint8)
    ox0 = max(0, CROP_XY[0] - cx)
    oy0 = max(0, CROP_XY[1] - cy)
    ox1 = min(cw, CROP_XY[0] + 600 - cx)
    oy1 = min(ch, CROP_XY[1] + 360 - cy)
    px0 = max(0, cx - CROP_XY[0])
    py0 = max(0, cy - CROP_XY[1])
    ca_crop[py0:py0 + (oy1 - oy0), px0:px0 + (ox1 - ox0)] = ca[oy0:oy1, ox0:ox1]
    ca_crop = cv2.dilate(ca_crop, np.ones((2 * CHIEF_MARGIN + 1,) * 2, np.uint8))
    mask[ca_crop > 0] = 0

    # layer box = mask bbox in painting coords
    ys, xs = np.nonzero(mask > 0)
    bx = int(xs.min()) + CROP_XY[0]
    by = int(ys.min()) + CROP_XY[1]
    bx1 = int(xs.max()) + CROP_XY[0] + 1
    by1 = int(ys.max()) + CROP_XY[1] + 1
    print(f'new box: [{bx},{by},{bx1 - bx},{by1 - by}]  old: {lumber["box"]}')
    print(f'alpha px: {int((mask > 0).sum())}')

    rgba = np.zeros((360, 600, 4), np.uint8)
    rgba[..., :3] = gen
    rgba[..., 3] = mask
    sub = rgba[by - CROP_XY[1]:by1 - CROP_XY[1], bx - CROP_XY[0]:bx1 - CROP_XY[0]]
    if args.dry_run:
        Image.fromarray(sub).save('/tmp/village-inspect/lumber-new.png')
        return

    Image.fromarray(sub).save(os.path.join(LAYERS, lumber['file']), lossless=True)
    lumber['box'] = [bx, by, bx1 - bx, by1 - by]
    json.dump(manifest, open(MANIFEST, 'w'), indent=2)
    print('wrote', lumber['file'], lumber['box'])


if __name__ == '__main__':
    main()
