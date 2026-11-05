#!/usr/bin/env python3
"""PLAN-106 — cut a village tower sprite from its green-screen raw.

Background = pixels near the screen green CONNECTED to the image border
(flood fill), never a global colour threshold: the global HSV key of
2026-11-02 punched holes wherever the painted stone carried a greenish tint
(«quelle di pietra hanno parti in trasparenza», Director 2026-11-03).
Interior holes are filled unless they are screen-coloured gaps; edges get a green despill and a 1px feather.

Usage: python scripts/key-village-tower.py <raw.png> <out.png>
"""
import sys
import cv2
import numpy as np
from PIL import Image


def key(raw_path: str, out_path: str) -> None:
    rgb = np.array(Image.open(raw_path).convert('RGB'))
    h, w = rgb.shape[:2]
    # screen colour = median of the border ring
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    screen = np.median(border, axis=0)
    dist = np.linalg.norm(rgb.astype(np.float32) - screen, axis=2)
    near = (dist < 90).astype(np.uint8)
    # flood fill from every border pixel that is near-screen
    bg = np.zeros((h + 2, w + 2), np.uint8)
    seeds = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    canvas = near.copy()
    for sx, sy in seeds:
        if canvas[sy, sx] == 1 and bg[sy + 1, sx + 1] == 0:
            cv2.floodFill(canvas, bg, (sx, sy), 2, loDiff=0, upDiff=0, flags=4 | (1 << 8))
    fg = (bg[1:-1, 1:-1] == 0).astype(np.uint8)
    # keep the largest blob, fill its holes
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    big = 1 + int(np.argmax(stats[1:, 4]))
    fg = (lab == big).astype(np.uint8) * 255
    cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    fg = np.zeros_like(fg)
    cv2.drawContours(fg, cnts, -1, 255, cv2.FILLED)
    # enclosed see-through gaps (lattice legs, between braces) are still screen
    # colour: punch those out, but only sizeable near-screen blobs — a greenish
    # stone tint is far from the screen and never forms one.
    gaps = ((fg > 0) & (dist < 70)).astype(np.uint8)
    gn, glab, gstats, _ = cv2.connectedComponentsWithStats(gaps)
    for i in range(1, gn):
        if gstats[i, 4] >= 30:
            fg[glab == i] = 0
    fg = cv2.erode(fg, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(fg, (3, 3), 0)
    # despill: clamp green to max(red, blue) on the edge band
    out = rgb.astype(np.float32)
    edge = cv2.dilate(fg, np.ones((9, 9), np.uint8)) & ~cv2.erode(fg, np.ones((9, 9), np.uint8))
    e = edge > 0
    out[..., 1][e] = np.minimum(out[..., 1][e], np.maximum(out[..., 0][e], out[..., 2][e]))
    # bleed: transparent pixels take the nearby opaque colour, so a later
    # non-premultiplied resize doesn't mix the keyed-out screen (dark teal after
    # despill) into thin parts — it turned the lattice legs slate-blue.
    solid = (fg > 0).astype(np.float32)
    acc = np.zeros_like(out)
    wsum = np.zeros(solid.shape, np.float32)
    for k in (5, 15, 41):
        wk = cv2.GaussianBlur(solid, (0, 0), k)
        ck = np.dstack([cv2.GaussianBlur(out[..., c] * solid, (0, 0), k) for c in range(3)])
        fill = (wsum < 1e-3) & (wk > 1e-3)
        acc[fill] = ck[fill] / wk[fill][:, None]
        wsum[fill] = 1
    out = np.where(solid[..., None] > 0, out, acc)
    ys, xs = np.where(alpha > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([out.clip(0, 255).astype(np.uint8), alpha])[y0:y1, x0:x1]
    Image.fromarray(rgba, 'RGBA').save(out_path)
    print(f'{out_path}: {x1 - x0}x{y1 - y0}, see-through gaps punched: {gn - 1}')


if __name__ == '__main__':
    key(sys.argv[1], sys.argv[2])
