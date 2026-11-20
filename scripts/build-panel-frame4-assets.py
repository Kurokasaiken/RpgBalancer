#!/usr/bin/env python3
"""R-357 frame sprite v2 (Director's own re-gen, 2026-11-18) → panel-frame4/.

The Director regenerated the ornament sheet and asked to cut it "senza lo
spessore attorno" — the bars are cut INSIDE their beveled rectangular rim
(compare-bar-h.png: A tight w/ rim / B inside rim / C field only — B is the
target: engraved field + its own filets, no outer box).

Pieces in the sheet (.mw/runs/20261118-frame-sprite-v2/sprite-v2.png, 1024×572):
  - corner-tl      acanthus + gem, top-left
  - L piece        two acanthus+gem ends joined at a bottom-centre knot →
                   split into corner-bl (left flourish) + corner-br (right)
  - bar-v          vertical engraved strip → edge-left / edge-right tiles
  - bar-h          horizontal engraved band → edge-top / edge-bottom tiles
  - emblem-chest   stash clasp
  - gem-seal       spare clasp
Organic pieces are alpha-keyed off the flat teal bg; bars stay opaque (the
dark channel is part of the engraving). Edge tiles get a 30px overlap-blend
at the wrap point (the vine pattern is aperiodic — no exact period).
"""
import numpy as np
from PIL import Image
import os

SRC = '.mw/runs/20261118-frame-sprite-v2/sprite-v2.png'
OUT = 'public/assets/ui/hud-real/panel-frame4'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
A = np.asarray(im).astype(np.int16)
BG = A[0:30, 0:30].reshape(-1, 3).mean(0)   # flat teal (14,32,40)


def key(px):
    d = np.abs(px - BG).max(2)
    return np.clip((d - 10) * 18, 0, 255).astype(np.uint8)


def cut(name, box, keyed=True, tails='', fade=6):
    px = np.asarray(im.crop(box).convert('RGB')).astype(np.int16)
    a = key(px) if keyed else np.full(px.shape[:2], 255, np.uint8)
    h, w = a.shape
    if 'r' in tails:
        for i in range(min(fade, w // 3)):
            a[:, w - 1 - i] = (a[:, w - 1 - i] * (i / min(fade, w // 3))).astype(np.uint8)
    if 'l' in tails:
        for i in range(min(fade, w // 3)):
            a[:, i] = (a[:, i] * (i / min(fade, w // 3))).astype(np.uint8)
    if 'b' in tails:
        for i in range(min(fade, h // 3)):
            a[h - 1 - i, :] = (a[h - 1 - i, :] * (i / min(fade, h // 3))).astype(np.uint8)
    if 't' in tails:
        for i in range(min(fade, h // 3)):
            a[i, :] = (a[i, :] * (i / min(fade, h // 3))).astype(np.uint8)
    Image.fromarray(np.dstack([px.astype(np.uint8), a]), 'RGBA').save(f'{OUT}/{name}.webp', quality=92)
    print(name, (w, h))


def edge(name, box, axis, ov=30):
    """Opaque edge strip → seamless tile on `axis` via overlap-blend: the
    crop is `ov` longer than the emitted tile; the tile's first `ov` px are
    a crossfade between the real continuation and its start."""
    x0, y0, x1, y1 = box
    box = (x0, y0, x1 + ov, y1) if axis == 'x' else (x0, y0, x1, y1 + ov)
    px = np.asarray(im.crop(box).convert('RGB')).astype(np.float64)
    h, w, _ = px.shape
    if axis == 'x':
        w -= ov
        t = np.linspace(1, 0, ov)[None, :, None]
        px[:, :ov] = px[:, w:w + ov] * t + px[:, :ov] * (1 - t)
        px = px[:, :w]
    else:
        h -= ov
        t = np.linspace(1, 0, ov)[:, None, None]
        px[:ov] = px[h:h + ov] * t + px[:ov] * (1 - t)
        px = px[:h]
    a = np.full((h, w), 255, np.uint8)
    Image.fromarray(np.dstack([px.astype(np.uint8), a]), 'RGBA').save(f'{OUT}/{name}.webp', quality=92)
    print(name, (w, h))


# ── corners ───────────────────────────────────────────────────────────────
cut('corner-tl', (28, 26, 295, 297),   tails='rb')                    # acanthus + gem TL
cut('corner-bl', (30, 295, 195, 547),  tails='rt')                    # L: left flourish + gem
cut('corner-br', (185, 295, 351, 547), tails='lt')                    # L: right flourish + gem
# corner-tr: none in the sheet — PanelFrameOrnaments reuses panel-frame3's
# plain wire junction (right side stays plain per the grammar)

# ── edges: INSIDE the beveled rim (B cut — no outer box) ────────────────────
# bar-h outer rim measured: ~13px top/left, ~10px bottom/right
edge('edge-top',    (565, 174, 940, 249), 'x')   # bar-h field → top band only (golden grammar)

# ── thin borders: the rim strips themselves (bevel + channel + filet) are
#    the golden's thin side/bottom edges — the rim was "spessore" only when
#    it boxed the band; as a standalone border it IS the grammar. ───────────
edge('edge-thin-y', (393, 60, 415, 490), 'y')    # bar-v LEFT rim → left/right edges
_th = Image.open(f'{OUT}/edge-thin-y.webp').rotate(-90, expand=True)
_th.save(f'{OUT}/edge-thin-x.webp', quality=92)  # rotated → bottom edge
print('edge-thin-x', _th.size)

# ── clasps ─────────────────────────────────────────────────────────────────
cut('emblem-chest', (562, 375, 727, 527), keyed=True)
cut('gem-seal',     (844, 404, 943, 504), keyed=True)
print('done →', OUT)
