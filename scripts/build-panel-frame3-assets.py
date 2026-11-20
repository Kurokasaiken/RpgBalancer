#!/usr/bin/env python3
"""R-357: cut the Gemini sprite sheet into the panel-frame3 ornament set.

Source: .mw/runs/20261117-r357-frame-fix/sprite-gen.png — six pieces on a flat
dark teal background (Director: the panel-frame2 crops pulled from the mockup
carried map/UI remnants — "ritagliati male" — these are AI-regenerated, no
baked text, no map). Output: public/assets/ui/hud-real/panel-frame3/.

Pieces: left acanthus+gem corner knuckles (TL/BL), the engraved left spine,
the champagne header vine, the chest emblem, a spare gem seal. Tails that cut
through a painted wire are alpha-faded so the seam hides under the skin's own
hairline.
"""
import numpy as np
from PIL import Image

SRC = '.mw/runs/20261117-r357-frame-fix/sprite-gen.png'
OUT = 'public/assets/ui/hud-real/panel-frame3'

im = Image.open(SRC).convert('RGB')
A = np.asarray(im).astype(np.int16)
BG = A[0:40, 0:40].reshape(-1, 3).mean(0)          # flat teal background


def cut(name, box, fade_right=0, fade_bottom=0, fade_left=0, fade_top=0,
        target_w=None, target_h=None):
    """Crop `box`, key the flat background to alpha, feather 1px, fade the
    listed tail edges by N px (they cross a painted wire), resize to target."""
    x0, y0, x1, y1 = box
    px = np.asarray(im.crop(box).convert('RGB')).astype(np.int16)
    d = np.abs(px - BG).max(2)
    alpha = np.clip((d - 10) * 18, 0, 255).astype(np.uint8)   # soft key
    h, w = alpha.shape
    def fade(mask, n, axis, lo=True):
        ramp = np.linspace(0, 1, n)
        for i in range(n):
            k = ramp[i] if lo else ramp[::-1][i]
            if axis == 'x':
                idx = i if lo else w - 1 - i
                mask[:, idx] = (mask[:, idx] * k).astype(np.uint8)
            else:
                idx = i if lo else h - 1 - i
                mask[idx, :] = (mask[idx, :] * k).astype(np.uint8)
        return mask
    if fade_right: alpha = fade(alpha, fade_right, 'x', lo=False)
    if fade_left:  alpha = fade(alpha, fade_left, 'x', lo=True)
    if fade_bottom: alpha = fade(alpha, fade_bottom, 'y', lo=False)
    if fade_top:   alpha = fade(alpha, fade_top, 'y', lo=True)
    out = np.dstack([np.asarray(px).astype(np.uint8), alpha])
    img = Image.fromarray(out, 'RGBA')
    if target_w or target_h:
        tw = target_w or round(img.width * (target_h / img.height))
        th = target_h or round(img.height * (target_w / img.width))
        img = img.resize((tw, th), Image.LANCZOS)
    img.save(f'{OUT}/{name}.webp', quality=90)
    print(f'{name}.webp', img.size)


import os
os.makedirs(OUT, exist_ok=True)

# ── source-pixel boxes measured on sprite-gen.png (1376×768) ──────────────
# TL knuckle: gem + acanthus sweeping right along the top wire, left wire stub
cut('corner-tl',        (30, 30, 430, 285), fade_right=70, fade_bottom=36, target_h=170)
# BL knuckle: same scroll mirrored down; cut BEFORE the second gem at x~394
cut('corner-bl',        (30, 450, 235, 738), fade_right=55, fade_top=40,  target_h=140)
# engraved left spine (the tall vine strip, mid column) — stretched vertically
cut('edge-left',        (592, 45, 660, 730), fade_top=10, fade_bottom=10,   target_w=34,  target_h=340)
# champagne header vine band — stretched horizontally
cut('header-vine',      (725, 235, 1345, 330), fade_left=14, fade_right=14, target_w=620, target_h=48)
# chest emblem for the stash top wire
cut('emblem-chest',     (748, 492, 990, 718),                             target_w=121, target_h=113)
# spare gem seal (unused for now — kept for the detail/chrome work)
cut('gem-seal',         (1128, 496, 1280, 718),                           target_w=76,  target_h=111)
print('done →', OUT)
