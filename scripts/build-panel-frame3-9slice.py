#!/usr/bin/env python3
"""R-357: 9-slice the AI-generated complete frame into the panel-frame3 set.

Source: .mw/runs/20261117-r357-frame-fix/frame-9slice.png (1200x896) — one
complete ornate frame on flat teal bg (Director: the hand-cut pieces were
"ritagliati male / qualità troppo bassa" — a whole-frame render keeps every
piece coherent, and the 9-slice cut gives continuous, repeatable edges).

Output (public/assets/ui/hud-real/panel-frame3/):
  corner-{tl,tr,bl,br}.webp  fixed-size knuckles/junctions (alpha, faded tails)
  edge-{top,left,right,bottom}.webp  seamless repeat tiles (ends cross-faded)
  emblem-chest.webp kept from the previous pass.

Frame geometry measured on the source: outer bbox (29,3)-(1199,895),
inner hole x100-1132 / y119-841 → border widths T~87 L~63 R~30 B~19.
"""
import numpy as np
from PIL import Image
import os

SRC = '.mw/runs/20261117-r357-frame-fix/frame-9slice.png'
OUT = 'public/assets/ui/hud-real/panel-frame3'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
A = np.asarray(im).astype(np.int16)
BG = A[0:40, 0:40].reshape(-1, 3).mean(0)


def key(px):
    d = np.abs(px - BG).max(2)
    return np.clip((d - 10) * 18, 0, 255).astype(np.uint8)


# Inner hole of the source frame (global coords): the teal interior is a
# different shade from the outer bg, so keyed crops ghost. Every crop is
# forced transparent where it overlaps the hole.
HOLE = (100, 119, 1132, 841)


def punch_hole(a, box):
    x0, y0, x1, y1 = box
    hx0, hy0, hx1, hy1 = HOLE
    ox0, oy0 = max(hx0, x0) - x0, max(hy0, y0) - y0
    ox1, oy1 = min(hx1, x1) - x0, min(hy1, y1) - y0
    if ox1 > ox0 and oy1 > oy0:
        a[oy0:oy1, ox0:ox1] = 0
    return a


def corner(name, box, fx, fy, tails):
    """Crop a corner, key bg, punch the interior hole, then SOFTEN (6px) the
    two tail sides that run INTO the neighbouring edges. `tails` says which
    sides they leave on — tl 'rb', tr 'lb', bl 'rt', br 'lt'. The soften is
    deliberately tiny: the neighbouring edge tile is cut from the SAME
    source position as the corner's cut edge, so the composite reproduces
    the original frame pixel-for-pixel — a long fade would instead ghost two
    different vine phases over each other (the dark patches in witness-v8)."""
    px = np.asarray(im.crop(box).convert('RGB')).astype(np.int16)
    a = punch_hole(key(px), box)
    h, w = a.shape
    n = min(fx, w // 3)
    if 'r' in tails:
        for i in range(n):
            a[:, w - 1 - i] = (a[:, w - 1 - i] * (i / n)).astype(np.uint8)
    if 'l' in tails:
        for i in range(n):
            a[:, i] = (a[:, i] * (i / n)).astype(np.uint8)
    n = min(fy, h // 3)
    if 'b' in tails:
        for i in range(n):
            a[h - 1 - i, :] = (a[h - 1 - i, :] * (i / n)).astype(np.uint8)
    if 't' in tails:
        for i in range(n):
            a[i, :] = (a[i, :] * (i / n)).astype(np.uint8)
    Image.fromarray(np.dstack([px.astype(np.uint8), a]), 'RGBA').save(f'{OUT}/{name}.webp', quality=92)
    print(name, (w, h))


def edge(name, box, tile_axis, ov=44):
    """Crop an edge strip and make it a SEAMLESS repeat tile on `tile_axis`
    ('x' or 'y'). The crop is `ov` px longer than the emitted tile along the
    wrap axis: the tile's first `ov` px are a crossfade between the strip's
    real continuation (what would follow the wrap point) and its start, so
    pixel N-1 → pixel 0 is continuous. No alpha fade — the ornament must
    stay opaque across the join (the crossfade-to-transparent version let
    the panel bg show through = dark seams, witness witness-v4)."""
    x0, y0, x1, y1 = box
    if tile_axis == 'x':
        box = (x0, y0, x1 + ov, y1)
    else:
        box = (x0, y0, x1, y1 + ov)
    px = np.asarray(im.crop(box).convert('RGB')).astype(np.float64)
    a = punch_hole(key(px), box).astype(np.float64)
    h, w = a.shape
    n = ov
    if tile_axis == 'x':
        w -= n
        t = np.linspace(1, 0, n)[None, :, None]
        px[:, :n] = px[:, w:w + n] * t + px[:, :n] * (1 - t)
        a[:, :n] = np.maximum(a[:, w:w + n], a[:, :n])
        px, a = px[:, :w], a[:, :w]
    else:
        h -= n
        t = np.linspace(1, 0, n)[:, None, None]
        px[:n] = px[h:h + n] * t + px[:n] * (1 - t)
        a[:n] = np.maximum(a[h:h + n], a[:n])
        px, a = px[:h], a[:h]
    Image.fromarray(np.dstack([px.astype(np.uint8), a.astype(np.uint8)]), 'RGBA').save(f'{OUT}/{name}.webp', quality=92)
    print(name, (w, h))


# ── corners: generous crops around each knuckle/junction, only a 6-8px
#    soften on the cut sides — the edges are phase-continuous (see below) ──
corner('corner-tl', (29,   3, 280, 265),  fx=6, fy=6, tails='rb')
corner('corner-tr', (955,  3, 1199, 165), fx=18, fy=6, tails='lb')
corner('corner-bl', (29, 615, 295, 895),  fx=6, fy=18, tails='rt')
corner('corner-br', (1035, 790, 1199, 895), fx=6, fy=6, tails='lt')

# ── edges: phase-continuous tiles. The tile STARTS at the source coord of
#    the neighbouring corner's cut edge, so corner→edge reproduces the
#    original frame exactly; length = exact multiple of the measured
#    pattern period (top band ~128px, spine ~42px) → seamless repeat; the
#    small ov blend is insurance at the wrap point. ─────────────────────────
edge('edge-top',    (250,   3, 250 + 3 * 128, 119), 'x', ov=20)  # starts 30px BEFORE the TL cut (x280) — phase-continuous through the corner's soften zone; 3 vine periods
edge('edge-left',   ( 29, 235, 100, 235 + 5 * 42), 'y', ov=16)   # starts 30px BEFORE the TL cut (y265); 5 vine periods
edge('edge-right',  (1132, 300, 1163, 660), 'y', ov=16)          # plain double wire
edge('edge-bottom', (400, 838, 760, 862), 'x', ov=20)            # plain double wire
print('done →', OUT)
