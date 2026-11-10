#!/usr/bin/env python3
"""Village page: take back a building after Gemini harmonised it IN our scene.

Input: the crop of our composite (house already placed) sent to Gemini, and Gemini's
repaint of it (prompt prompts: out/village-chain/rude/prompt-harmonize.txt). The repaint
is aligned to the crop (ORB + partial affine), and only the house + a band at its base
(where Gemini painted grass and shadow on OUR meadow) is kept, feathered; everything
else stays the painting. Rewrites the layer <id>.
Usage: harmonize-village-building.py <id> <crop.jpg> <gen.png> <crop_x> <crop_y>
"""
import json, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
L = ROOT / 'public/assets/village/layers'


def main() -> None:
    lid, crop_p, gen_p, cx, cy = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
    ref = np.array(Image.open(crop_p).convert('RGB'))
    h, w = ref.shape[:2]
    gen = np.array(Image.open(gen_p).convert('RGB').resize((w, h), Image.LANCZOS))
    spec = json.loads((L / 'layers.json').read_text())
    ly = next(l for l in spec['layers'] if l['id'] == lid)
    # current layer alpha in crop coords = where the house is
    old = np.array(Image.open(L / ly['file']).convert('RGBA'))
    house = np.zeros((h, w), np.float32)
    x0, y0 = ly['box'][0] - cx, ly['box'][1] - cy
    # clip the layer to the crop: matching dest/src ranges (the layer box may stick out on any side)
    dy0, dy1 = max(0, y0), min(h, y0 + old.shape[0])
    dx0, dx1 = max(0, x0), min(w, x0 + old.shape[1])
    house[dy0:dy1, dx0:dx1] = old[dy0 - y0:dy1 - y0, dx0 - x0:dx1 - x0, 3] / 255.0
    core = (house > 0.5).astype(np.uint8) * 255

    # align Gemini's repaint to the crop on everything EXCEPT the house
    bg = cv2.bitwise_not(cv2.dilate(core, np.ones((41, 41), np.uint8)))
    orb = cv2.ORB_create(5000)
    k1, d1 = orb.detectAndCompute(cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY), bg)
    k2, d2 = orb.detectAndCompute(cv2.cvtColor(gen, cv2.COLOR_RGB2GRAY), bg)
    mt = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda m: m.distance)[:400]
    A, inl = cv2.estimateAffinePartial2D(np.float32([k2[m.trainIdx].pt for m in mt]),
                                         np.float32([k1[m.queryIdx].pt for m in mt]), ransacReprojThreshold=3)
    gen = cv2.warpAffine(gen, A, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    print('align scale %.4f shift %s inliers %d' % (np.hypot(A[0, 0], A[1, 0]), A[:, 2].round(1), int(inl.sum())))

    # keep: house (slightly grown, Gemini softened its outline) + a band under its base
    m = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    ys, xs = np.where(core > 0)
    yb = ys.max()
    band = np.zeros_like(m)
    cv2.ellipse(band, (int(xs[ys > yb - 10].mean()), int(yb)), (int((xs.max() - xs.min()) * 0.58), 30), 0, 0, 360, 255, -1)
    m = cv2.bitwise_or(m, band)
    a = np.clip(cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 6) * 1.5 - 0.15, 0, 1)

    # colour: match Gemini to the painting on a ring just outside the kept area
    ring = (cv2.dilate(m, np.ones((61, 61), np.uint8)) & ~cv2.dilate(m, np.ones((21, 21), np.uint8))) > 0
    g = gen.astype(np.float32)
    for c in range(3):
        g[..., c] += ref[..., c][ring].mean() - g[..., c][ring].mean()
    g = np.clip(g, 0, 255)

    ys, xs = np.where(a > 0.01)
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.zeros((by1 - by0, bx1 - bx0, 4), np.uint8)
    rgba[..., :3] = g[by0:by1, bx0:bx1].astype(np.uint8)
    rgba[..., 3] = (a[by0:by1, bx0:bx1] * 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(L / ly['file'], lossless=True)
    ly['box'] = [int(bx0 + cx), int(by0 + cy), int(bx1 - bx0), int(by1 - by0)]
    (L / 'layers.json').write_text(json.dumps(spec, indent=2))
    print(lid, ly['box'])


if __name__ == '__main__':
    main()
