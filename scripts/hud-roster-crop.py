#!/usr/bin/env python3
"""HUD Zanara — roster column cut DIRECTLY from the zanara-v2 mockup (test).

Frame pixels come from the mockup (identical by construction); semantic
content (portrait, name, level, xp bar) is removed and re-rendered live in
React. Pieces: top cap (winged emblem + band head), one row tile (one row
period of band + ring + plaque, repeated per hero), bottom cap (band tail +
pendant).

Alpha: GrabCut seeded by measured geometry (ring circle, plaque polygon,
band rail). Text: cv2 inpaint (Telea) on bright-glyph masks inside the
plaque. Portrait hole: measured radial profile → transparent disk.

Usage: python3 -I scripts/hud-roster-crop.py
Outputs: public/mockups/hud-lab/roster-crop/*.png + mount.json
         public/mockups/hud-lab/roster-crop/ref/* (reference-only crops)
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public/mockups/hud-lab/sources/zanara-v2.png')
OUT = os.path.join(ROOT, 'public/mockups/hud-lab/roster-crop')

# --- measured geometry (source px, zanara-v2 1672x941) -----------------
# Ring centres (HoughCircles): y 274/368/460/556 → pitch ≈ 94.
PITCH = 94
ROW_Y0 = 227            # Kael row period top (centre 274 - 47)
ROW_W = 256
HOLE = (86.8, 47.1, 35.0)  # portrait hole: inner gold edge fit R=36.8, minus 1.8px dark rim
RING_R = 45.5           # outer gold edge of ring (radial profile, 60-120° and 300°)
PLAQUE = np.array([(116, 10), (216, 10), (241, 43), (247, 45), (247, 50), (241, 52), (216, 86), (116, 86)])  # + tip pearl
GEM_BOTTOM = np.array([(88, 79), (95, 86), (88, 94), (81, 86)])  # emerald under the ring
BAND_X = (21, 48)       # gold rail (x22) + enamel arm, frame across the whole pitch
# glyph boxes in tile coords (x0, y0, x1, y1)
NAME_BOX = (138, 26, 200, 46)
LV_BOX = (138, 48, 196, 64)
BAR_BOX = (134, 66, 219, 78)
TOP_Y1 = ROW_Y0          # top cap ends where first row period starts
BOT_Y0 = ROW_Y0 + 4 * PITCH  # 603: after the 4th mockup row
BOT_Y1 = 668


def grabcut(img, fg, pr):
    """GrabCut seeded with definite-FG and probable-FG masks; rest = BG."""
    m = np.full(img.shape[:2], cv2.GC_BGD, np.uint8)
    m[pr > 0] = cv2.GC_PR_FGD
    m[fg > 0] = cv2.GC_FGD
    bg, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, m, None, bg, fgm, 6, cv2.GC_INIT_WITH_MASK)
    a = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep only components touching the definite seed, smooth 1px edge
    n, lab = cv2.connectedComponents(a)
    keep = np.isin(lab, np.unique(lab[(fg > 0) & (a > 0)]))
    a = np.where(keep, 255, 0).astype(np.uint8)
    a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    return cv2.GaussianBlur(a, (3, 3), 0.6)


def glyph_mask(img, box, thr):
    """Bright glyph pixels inside box, dilated to cover anti-aliasing."""
    x0, y0, x1, y1 = box
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    m = np.zeros(g.shape, np.uint8)
    sub = g[y0:y1, x0:x1]
    m[y0:y1, x0:x1] = (sub > thr).astype(np.uint8) * 255
    return cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=2)


def row_tile(src):
    t = src[ROW_Y0:ROW_Y0 + PITCH, 0:ROW_W].copy()
    h, w = t.shape[:2]
    cx, cy, hr = HOLE
    # Geometric alpha (GrabCut kept jungle slabs that show over the map):
    # band strip ∪ ring disk (outer gold edge r≈45, radial profile) ∪ plaque.
    a = np.zeros((h, w), np.float32)
    a[:, BAND_X[0]:BAND_X[1]] = 1.0
    cv2.circle(a, (int(cx * 16), int(cy * 16)), int(RING_R * 16), 1.0, -1, cv2.LINE_AA, shift=4)
    cv2.fillPoly(a, [PLAQUE * 16], 1.0, cv2.LINE_AA, shift=4)
    cv2.fillPoly(a, [GEM_BOTTOM * 16], 1.0, cv2.LINE_AA, shift=4)
    # enamel arm between band and ring: convex hull of band ∪ ring disk
    hull = cv2.convexHull(np.argwhere(a[:, :int(cx) + 1] > 0.5)[:, ::-1].astype(np.int32))
    cv2.fillPoly(a, [hull], 1.0, cv2.LINE_AA)
    alpha = (cv2.GaussianBlur(a, (3, 3), 0.5) * 255).astype(np.uint8)

    # text out: name, level, xp bar (content is live React)
    m = glyph_mask(t, NAME_BOX, 70) | glyph_mask(t, LV_BOX, 60)
    x0, y0, x1, y1 = BAR_BOX
    m[y0:y1, x0:x1] = 255
    clean = cv2.inpaint(t, m, 5, cv2.INPAINT_TELEA)

    # portrait hole → transparent (1px feather)
    d = np.zeros((h, w), np.float32)
    cv2.circle(d, (int(cx * 16), int(cy * 16)), int(hr * 16), 1.0, -1, cv2.LINE_AA, shift=4)
    d = cv2.GaussianBlur(d, (3, 3), 0.7)
    alpha = (alpha.astype(np.float32) * (1 - d)).astype(np.uint8)

    return np.dstack([clean, alpha]), m


def top_cap(src, r_out=104, cx=117, cy=101):
    """Winged emblem + band head. Geometric alpha: emblem disk (outer enamel
    crescent) clipped before the brand plaque, ivory wing by colour, band,
    pendant emerald under the emblem."""
    t = src[0:TOP_Y1, 0:232].copy()
    h, w = t.shape[:2]
    a = np.zeros((h, w), np.float32)
    cv2.circle(a, (cx * 16, cy * 16), r_out * 16, 1.0, -1, cv2.LINE_AA, shift=4)
    a[:42, 150:] = 0          # clouds above the wing tip
    a[:, 196:] = 0            # brand plaque starts here (not part of the roster)
    a[120:, BAND_X[0]:BAND_X[1]] = 1.0
    pend = np.array([(104, 168), (130, 168), (124, 205), (117, 226), (110, 205)])
    cv2.fillPoly(a, [pend * 16], 1.0, cv2.LINE_AA, shift=4)
    hsv = cv2.cvtColor(t, cv2.COLOR_BGR2HSV)
    wing = ((hsv[:, :, 1] < 80) & (hsv[:, :, 2] > 110)).astype(np.uint8)
    wing = cv2.morphologyEx(wing, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(wing)
    box = np.zeros_like(wing)
    box[8:170, 140:226] = 1
    for i in range(1, n):
        comp = lab == i
        if stats[i, cv2.CC_STAT_AREA] > 40 and (comp & (box > 0)).sum() > 0.8 * comp.sum():
            a[comp] = 1.0
    alpha = (cv2.GaussianBlur(a, (3, 3), 0.5) * 255).astype(np.uint8)
    return np.dstack([t, alpha])


def bottom_cap(src):
    t = src[BOT_Y0:BOT_Y1, 0:120].copy()
    h, w = t.shape[:2]
    fg = np.zeros((h, w), np.uint8)
    pr = np.zeros((h, w), np.uint8)
    pr[:, 4:52] = 255
    fg[:30, BAND_X[0]:BAND_X[1]] = 255
    # pendant diamond ≈ (80, 632) source
    cv2.circle(pr, (80, 632 - BOT_Y0), 22, 255, -1)
    cv2.circle(fg, (80, 632 - BOT_Y0), 8, 255, -1)
    return np.dstack([t, grabcut(t, fg, pr)])


def main():
    src = cv2.imread(SRC)
    os.makedirs(os.path.join(OUT, 'ref'), exist_ok=True)
    row, textmask = row_tile(src)
    cv2.imwrite(os.path.join(OUT, 'row-tile.png'), row)
    cv2.imwrite(os.path.join(OUT, 'top-cap.png'), top_cap(src))
    cv2.imwrite(os.path.join(OUT, 'bottom-cap.png'), bottom_cap(src))
    # reference-only: mockup column + the 4 mockup portraits (fidelity check)
    cv2.imwrite(os.path.join(OUT, 'ref/column.png'), src[0:BOT_Y1, 0:260])
    cx, cy, hr = HOLE
    for i in range(4):
        y, x, r = int(round(ROW_Y0 + i * PITCH + cy)), int(round(cx)), int(hr) + 3
        cv2.imwrite(os.path.join(OUT, f'ref/portrait-{i}.png'), src[y - r:y + r, x - r:x + r])
    mount = {
        'source': 'public/mockups/hud-lab/sources/zanara-v2.png',
        'units': 'source px (1672x941)',
        'pitch': PITCH,
        'rowTile': {'w': ROW_W, 'h': PITCH, 'hole': {'cx': cx, 'cy': cy, 'r': hr},
                    'name': NAME_BOX, 'lv': LV_BOX, 'bar': BAR_BOX},
        'topCap': {'w': 232, 'h': TOP_Y1},
        'bottomCap': {'w': 120, 'h': BOT_Y1 - BOT_Y0},
        'mockupRowsTop': ROW_Y0,
    }
    with open(os.path.join(OUT, 'mount.json'), 'w') as f:
        json.dump(mount, f, indent=2)
    print('ok', OUT)


if __name__ == '__main__':
    main()
