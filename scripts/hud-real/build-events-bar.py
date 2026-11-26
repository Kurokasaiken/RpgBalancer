#!/usr/bin/env python3
"""Build the Events bar production asset from the Director-registered reference.

Input: `.mw/specs/hud-eventi/refs/ref-eventi-bar-specular-time-2026-11-25.png`
Output: `public/assets/ui/hud-real/events/bar.webp`

The pasted reference uses a noisy magenta backing. The script builds a matte
from magenta-ness, decontaminates the backing colour, trims transparent pad
and exports lossless WebP. It is deterministic and does not overwrite the
registered reference.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
from goldgrade import grade_gold_toward_time

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / '.mw/specs/hud-eventi/refs/ref-eventi-bar-specular-time-2026-11-25.png'
OUT = ROOT / 'public/assets/ui/hud-real/events/bar.webp'


def build() -> tuple[int, int]:
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    magenta = np.minimum(r, b) - g
    t0, t1 = 20.0, 125.0
    alpha_f = np.clip((t1 - magenta) / (t1 - t0), 0, 1)
    backing = np.array([254, 1, 252], dtype=np.float32)
    out = np.zeros_like(rgb)
    valid = alpha_f > 0.03
    for channel in range(3):
        out[..., channel] = np.where(
            valid,
            (rgb[..., channel] - (1 - alpha_f) * backing[channel]) / np.maximum(alpha_f, 0.03),
            0,
        )
    alpha = (alpha_f * 255).astype(np.uint8)
    alpha[alpha < 10] = 0
    rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), alpha])
    image = Image.fromarray(rgba, 'RGBA')
    # Erode the matte by one source px, then feather slightly: this removes the
    # hot-pink backing residue without eating the painted gold silhouette.
    arr = np.array(image)
    matte = Image.fromarray(arr[..., 3]).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.35))
    arr[..., 3] = np.array(matte)
    image = Image.fromarray(arr, 'RGBA')
    bbox = np.array(image)[..., 3]
    ys, xs = np.where(bbox > 20)
    if len(xs) == 0:
        raise RuntimeError('events bar matte is empty')
    crop = image.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    crop = grade_gold_toward_time(crop)
    crop.save(OUT, 'WEBP', lossless=True)
    return crop.size


if __name__ == '__main__':
    w, h = build()
    print(f'wrote {OUT} {w}x{h}')
