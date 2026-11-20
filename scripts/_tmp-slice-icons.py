#!/usr/bin/env python3
"""Slice the stash-icons sheet (4x2 grid) into per-item keyed webp."""
import sys
from PIL import Image

SRC = 'test-results/slicekit/frame-smeraldo/stash-interior/gen/stash-icons-sheet.png'
OUT_DIR = 'public/assets/ui/hud-real/stash-icons'
# grid order maps to QUEST_STASH flags (prompt order)
CELLS = [
    (0, 0, 'hasBonusForza'), (1, 0, 'hasBonusPerc'), (2, 0, 'hasFumogeno'), (3, 0, 'hasCorda'),
    (0, 1, 'hasHealing'),    (1, 1, 'hasPozione'),   (2, 1, 'hasGuardianBanner'),
]
COLS, ROWS = 4, 2

img = Image.open(SRC).convert('RGBA')
W, H = img.size
cw, ch = W // COLS, H // ROWS
print(f'sheet {W}x{H} -> cell {cw}x{ch}')

import os
os.makedirs(OUT_DIR, exist_ok=True)

def key_flat(im, tol=28):
    """Alpha-key the flat bg: sample border median color, knock out pixels within tol."""
    px = im.load()
    w, h = im.size
    samples = [px[0,0], px[w-1,0], px[0,h-1], px[w-1,h-1], px[w//2,0], px[w//2,h-1]]
    br = sorted(s[0] for s in samples)[len(samples)//2]
    bg = sorted(s[1] for s in samples)[len(samples)//2]
    bb = sorted(s[2] for s in samples)[len(samples)//2]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r-br) <= tol and abs(g-bg) <= tol and abs(b-bb) <= tol:
                px[x, y] = (r, g, b, 0)
    return im

for col, row, flag in CELLS:
    cell = img.crop((col*cw, row*ch, (col+1)*cw, (row+1)*ch))
    cell = key_flat(cell)
    bbox = cell.getbbox()
    if bbox:
        pad = 6
        x0, y0, x1, y1 = bbox
        x0, y0 = max(0, x0-pad), max(0, y0-pad)
        x1, y1 = min(cell.width, x1+pad), min(cell.height, y1+pad)
        cell = cell.crop((x0, y0, x1, y1))
    # fit inside 192px box keeping aspect
    cell.thumbnail((192, 192), Image.LANCZOS)
    out = f'{OUT_DIR}/{flag}.webp'
    cell.save(out, 'WEBP', quality=92)
    print(f'{flag}: {cell.size} -> {out}')
