#!/usr/bin/env python3
"""compose-states.py — PLAN-117 T1.2: the Director's favourite marker
(Mix blu-arch, star frame) on real mappa2 crops across the temporal
states, including a simulated-deuteranopia copy of every tile so the
red/green question is visible, not argued.

States (Sigillo grammar: halo = tempo, OUTSIDE the border):
  none · deadline (cream) · work (vivid green from the mock)
  done (gold fulgore glow) · urgent (vermilion) ·
  urgent-spiked (vermilion + notched ring — daltonic second channel) ·
  veiled (dimmed, desaturated)
"""
import importlib.util as il
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

spec = il.spec_from_file_location('cc', '/Users/faustoboni/progetti_personali/RPG/.mw/specs/poi-zanara/compose-card.py')
cc = il.module_from_spec(spec); spec.loader.exec_module(cc)

ROOT = Path('/Users/faustoboni/progetti_personali/RPG/.mw/specs/poi-zanara')
TR = Path('/Users/faustoboni/progetti_personali/RPG/test-results/poi-zanara-f0')
OUT = ROOT / 'card-states'
OUT.mkdir(exist_ok=True)

MARKER = Image.open(ROOT / 'gen-mock/Mix-blu-arch.png').convert('RGBA')
SIZES = [32, 44, 55, 69]

CREAM = (234, 217, 176)      # deadline halo token
GREEN = (62, 214, 130)       # vivid green from the Director's mock
VERM = (232, 85, 58)         # urgent token
GOLD = (245, 200, 90)        # fulgore


def halo_ring(d, cx, cy, r, color, w):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color + (255,), width=w)


def halo_glow(d, cx, cy, r, color):
    # fulgore: radial falloff disc behind the ring, then a thin ring
    R = int(r * 1.9)
    glow = Image.new('RGBA', (2 * R, 2 * R), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(R, 0, -1):
        a = int(110 * (1 - i / R) ** 1.6)
        gd.ellipse([R - i, R - i, R + i, R + i], fill=color + (a,))
    d._image.paste(glow, (cx - R, cy - R), glow)
    halo_ring(d, cx, cy, r, color, max(1, r // 14))


def halo_spiked(d, cx, cy, r, color):
    halo_ring(d, cx, cy, r, color, max(2, r // 10))
    import math
    notch = max(3, r // 5)
    for k in range(8):
        a = math.radians(k * 45 + 22)
        x1 = cx + (r + 1) * math.cos(a)
        y1 = cy + (r + 1) * math.sin(a)
        x2 = cx + (r + notch) * math.cos(a)
        y2 = cy + (r + notch) * math.sin(a)
        d.line([x1, y1, x2, y2], fill=color + (255,), width=max(2, notch // 3))


STATES = [
    ('base', lambda d, c, r: None),
    ('deadline', lambda d, c, r: halo_ring(d, *c, r, CREAM, max(1, r // 12))),
    ('lavoro', lambda d, c, r: halo_ring(d, *c, r, GREEN, max(1, r // 12))),
    ('finito', lambda d, c, r: halo_glow(d, *c, r, GOLD)),
    ('urgente', lambda d, c, r: halo_ring(d, *c, r, VERM, max(1, r // 12))),
    ('urg+spike', lambda d, c, r: halo_spiked(d, *c, r, VERM)),
    ('veiled', None),  # marker treatment, not halo
]


def deuteranopia(im: Image.Image) -> Image.Image:
    """Machado (2009) deuteranopia severity 1.0."""
    import numpy as np
    a = np.asarray(im.convert('RGB')).astype(float)
    r = a[..., 0] * 0.567 + a[..., 1] * 0.433
    g = a[..., 0] * 0.558 + a[..., 1] * 0.442
    b = a[..., 1] * 0.242 + a[..., 2] * 0.758
    return Image.fromarray(np.stack([r, g, b], axis=-1).clip(0, 255).astype('uint8'))


def tile(bg, size, state):
    t = bg.copy()
    mk = MARKER.copy()
    mk.thumbnail((size, size), Image.LANCZOS)
    cx, cy = t.width // 2, t.height // 2
    d = ImageDraw.Draw(t)
    mr = int(max(mk.width, mk.height) / 2)
    hr = mr + max(3, size // 16)
    if state[0] == 'veiled':
        mk = ImageEnhance.Color(mk).enhance(0.25)
        mk.putalpha(mk.getchannel('A').point(lambda x: int(x * 0.55)))
    else:
        state[1](d, (cx, cy), hr)
    t.paste(mk, (cx - mk.width // 2, cy - mk.height // 2), mk)
    return t


def sheet(bg_path, mode='color'):
    bg = Image.open(bg_path).convert('RGBA')
    if mode == 'gray':
        bg = bg.convert('L').convert('RGBA')
    cell_w, cell_h = bg.width + 10, bg.height + 30
    W = 130 + len(SIZES) * cell_w
    H = 40 + len(STATES) * cell_h
    c = Image.new('RGBA', (W, H), (16, 18, 24, 255))
    d = ImageDraw.Draw(c)
    d.text((12, 12), f"{mode} {bg_path.stem}", fill=(220, 220, 220))
    for j, s in enumerate(SIZES):
        d.text((130 + j * cell_w + cell_w // 2 - 14, 20), f'{s}px', fill=(200, 200, 200))
    for i, st in enumerate(STATES):
        y = 40 + i * cell_h
        d.text((12, y + cell_h // 2 - 6), st[0], fill=(235, 210, 140))
        for j, s in enumerate(SIZES):
            x = 130 + j * cell_w
            t = tile(bg, s, st)
            if mode == 'deuteranope':
                t = deuteranopia(t).convert('RGBA')
            c.paste(t, (x, y))
            d.rectangle([x, y, x + t.width - 1, y + t.height - 1], outline=(70, 70, 80))
    return c


if __name__ == '__main__':
    for name in ['1440x900-village-zmid-crop.png', '1440x900-ridge_forest-zmid-crop.png']:
        for mode in ['color', 'gray', 'deuteranope']:
            f = OUT / f"states-{name.split('-')[1]}-{mode}.png"
            sheet(TR / name, mode).convert('RGB').save(f)
            print(f)
