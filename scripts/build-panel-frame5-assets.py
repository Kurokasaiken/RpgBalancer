#!/usr/bin/env python3
"""R-357 frame set v5 — extracted DIRECTLY from the baptized golden
`mockup-r357-cornici-aperta.png` (1376×768). Path A: the approved art IS the
source — cut pieces out of its pixels, never regenerate.

Golden geometry (roster panel box x14-340, y108-453):
  - top band   y108-147 (~40px) engraved vine; title plaque covers x<155
  - left spine x15-49 (~34px): outer filet + engraved lattice field + inner filet
  - right wire x331-338 (~7px); bottom wire y449-453 (~5px)
  - TL/TR acanthus+gem knuckles; BL/BR small gem studs
  - stash chest clasp seated on the stash's top band

Edges → opaque tiles with 30px overlap-blend (ornament is aperiodic).
Corners/clasp → alpha-keyed by colour class (brass R>B+15 | gem G>R,B+20)
so the map/plaque background drops out while the exact golden pixels stay.
"""
import numpy as np
from PIL import Image, ImageFilter
import os

SRC = '.mw/specs/expedition-ui/refs/mockup-r357-cornici-aperta.png'
OUT = 'public/assets/ui/hud-real/panel-frame5'
os.makedirs(OUT, exist_ok=True)
im = Image.open(SRC).convert('RGB')
A = np.asarray(im).astype(np.float64)


def edge(name, box, axis, ov=30):
    """Opaque strip → seamless tile on `axis` (overlap-blend at wrap)."""
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
    a = np.full(px.shape[:2], 255, np.uint8)
    Image.fromarray(np.dstack([px.astype(np.uint8), a]), 'RGBA').save(f'{OUT}/{name}.webp', quality=92)
    print(name, px.shape[1], px.shape[0])


def keyart(name, box, soft=18, shell=True):
    """Key out background by colour class: keep brass (R>B) and gem-green
    (G≫R,B); drop teal/blue/grey map+plaque. Despeckle: lone opaque specks
    (map foliage keyed as green) need >=3 opaque neighbours to survive.

    SHELL HEALING: the golden's ornaments are SPARSE FILIGREE — the dark
    lacquer behind them is part of the drawing. Keying it away left holes
    that bled map/patches through (Director: «troppe imperfezioni»). So we
    re-seat the filigree on its own ground: a gaussian-blurred copy of the
    ornament's alpha, filled with the plaque's field tone (#051512). Under
    the ornament it is fully opaque; toward the outside it fades to 0 —
    the piece becomes self-contained, no wedge, no corner-bite needed."""
    px = np.asarray(im.crop(box).convert('RGB')).astype(np.float64)
    r, g, b = px[:, :, 0], px[:, :, 1], px[:, :, 2]
    brass = r - np.maximum(g, b)          # >0 → warm metal
    gem = g - np.maximum(r, b)            # >0 → emerald
    keep = np.maximum(brass, gem - 8)     # gem needs stronger green
    a = np.clip((keep - 6) * soft, 0, 255).astype(np.uint8)
    op = (a > 0).astype(np.uint8)
    nb = np.zeros_like(op)
    nb[1:, :] += op[:-1, :]; nb[:-1, :] += op[1:, :]
    nb[:, 1:] += op[:, :-1]; nb[:, :-1] += op[:, 1:]
    nb[1:, 1:] += op[:-1, :-1]; nb[:-1, :-1] += op[1:, 1:]
    nb[1:, :-1] += op[:-1, 1:]; nb[:-1, 1:] += op[1:, :-1]
    a[nb < 3] = 0
    # soften last rows/cols to avoid hard cut lines
    h, w = a.shape
    for i in range(3):
        f = (i + 1) / 4
        a[i, :] = (a[i, :] * f).astype(np.uint8); a[h - 1 - i, :] = (a[h - 1 - i, :] * f).astype(np.uint8)
        a[:, i] = (a[:, i] * f).astype(np.uint8); a[:, w - 1 - i] = (a[:, w - 1 - i] * f).astype(np.uint8)

    if shell:
        # Blurred shell of the ornament's own silhouette → lacquer ground.
        radius = max(6, int(round(min(w, h) * 0.28)))
        mask = Image.fromarray(a, 'L').filter(ImageFilter.GaussianBlur(radius))
        shell_a = (np.asarray(mask).astype(np.float64) * 0.9).clip(0, 255)
        lacq = np.zeros((h, w, 4), np.uint8)
        lacq[:, :, 0], lacq[:, :, 1], lacq[:, :, 2] = 5, 21, 18   # plaque field
        lacq[:, :, 3] = shell_a.astype(np.uint8)
        base = Image.fromarray(lacq, 'RGBA')
        orn = Image.fromarray(np.dstack([px.astype(np.uint8), a]), 'RGBA')
        base.alpha_composite(orn)
        base.save(f'{OUT}/{name}.webp', quality=92)
    else:
        Image.fromarray(np.dstack([px.astype(np.uint8), a]), 'RGBA').save(f'{OUT}/{name}.webp', quality=92)
    print(name, w, h)


# ── edges (opaque, from clean stretches of the golden's own borders) ────────
edge('edge-top',   (155, 108, 300, 147), 'x')   # band field, right of the title
edge('edge-left',  (15, 155, 44, 405),   'y')   # spine filets + lattice (x<44 avoids LV badges)
edge('edge-right', (329, 160, 341, 420), 'y')   # thin gold wire + outer channel
edge('edge-bottom',(55, 447, 320, 457),  'x')   # thin gold wire + outer channel

# ── corner knuckles + studs + clasp (alpha-keyed golden pixels) ─────────────
keyart('corner-tl', (2, 96, 66, 156))
keyart('corner-tr', (306, 100, 352, 152))
keyart('corner-bl', (10, 432, 44, 464))
keyart('corner-br', (312, 432, 348, 464))
keyart('emblem-chest', (38, 458, 100, 504))
print('done →', OUT)
