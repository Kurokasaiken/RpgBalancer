#!/usr/bin/env python3
"""Sun and moon discs for the time bar's dial (Director 2026-11-11: «nel componente x l'ora … aggiungere anche queste icone x
mostrare giorno e notte»). Source: the Director's mockup `.mw/specs/hud-real/kit/gen/time-sunmoon-poi-mockup-0.webp`
(medallions «Sole» / «Luna»). Only the inner painted disc is taken (the bar keeps its own gold rim and dial ticks);
the disc centre/radius are found on the image, cut with a soft circular alpha, written at 2x of the design size.
Usage: .mw/venv/bin/python -I scripts/hud-real/build-time-sunmoon.py"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

SRC = Path('.mw/specs/hud-real/kit/gen/time-sunmoon-poi-mockup-0.webp')
OUT = Path('public/assets/ui/hud-real/time')
SIZE = 96  # px, 2x of the 48-design-px disc box (drawn at ~42 design px)


def inner_disc(img, cx, cy, search):
    """Refine the centre and radius of the dark inner disc (inside the gold rim) around a rough centre."""
    a = np.asarray(img).astype(np.float32)
    lum = a.mean(axis=2)
    best = None
    for r in range(60, 100):
        ang = np.linspace(0, 2 * np.pi, 180, endpoint=False)
        xs = (cx + r * np.cos(ang)).astype(int); ys = (cy + r * np.sin(ang)).astype(int)
        ring = lum[ys, xs].mean()
        if best is None or ring > best[1]:
            best = (r, ring)
    return best[0]  # the gold rim is the brightest ring: the disc ends just inside it


def cut(img, cx, cy, r):
    box = img.crop((cx - r, cy - r, cx + r, cy + r)).resize((SIZE * 4, SIZE * 4), Image.LANCZOS)
    m = Image.new('L', (SIZE * 4, SIZE * 4), 0)
    ImageDraw.Draw(m).ellipse([4, 4, SIZE * 4 - 4, SIZE * 4 - 4], fill=255)
    m = m.filter(__import__('PIL.ImageFilter', fromlist=['GaussianBlur']).GaussianBlur(3))
    box.putalpha(m)
    return box.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    img = Image.open(SRC).convert('RGB')
    for name, (cx, cy) in (('sun', (190, 375)), ('moon', (472, 378))):
        rim = inner_disc(img, cx, cy, 30)
        if name == 'sun':
            # Director 2026-11-11: «il sole è tagliato e troppo grande» — take a wider window (whole rays, sun smaller in
            # the dial) and paint everything past the rays' tips with the disc's own dark sky, so no mockup rim shows.
            r, keep = 84, 73
            a = np.asarray(img).astype(np.float32)
            yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
            d = np.hypot(xx - cx, yy - cy)
            ring = (d > 60) & (d < 70) & (a.max(axis=2) < 70)
            sky = np.median(a[ring], axis=0)
            w = np.clip((keep - d) / 3, 0, 1)[..., None]
            img2 = Image.fromarray((a * w + sky * (1 - w)).astype(np.uint8))
            cut(img2, cx, cy, r).save(OUT / f'{name}.webp', lossless=True)
        else:
            r = rim - 20  # well inside the gold rim and its ornament tips
            cut(img, cx, cy, r).save(OUT / f'{name}.webp', lossless=True)
        print(name, 'rim', rim, 'disc r', r)


if __name__ == '__main__':
    main()
