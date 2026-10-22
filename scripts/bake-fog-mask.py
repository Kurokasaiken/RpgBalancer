#!/usr/bin/env python3
"""
Bake a per-scene fog POOL mask from the scene's depth map (PLAN-050
T-013, R-228 Director ruling: "la nebbia non sta sospesa a mezz'aria" —
ground fog pools in low/distant terrain, it is not a horizontal band).

The depth maps are bright = near, dark = far. Ground fog density is
highest where the terrain recedes (the path dipping into the forest) and
near-zero on the near foreground — so the mask alpha is simply a shaped
inverted-depth field, plus a thin film at the very bottom of the frame.

The AtmosphereLayer stretches this mask over the camera window (img →
view) around the scrolling noise veils, so the fog matter moves inside a
pool that hugs the scene's actual topology.

Usage:
    .mw/venv/bin/python scripts/bake-fog-mask.py \
        --depth public/assets/depth/sentiero-tracce.webp \
        --out   public/assets/atmosphere/fog/mask-sentiero-tracce.png
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def bake(depth: Image.Image, t0: float, t1: float, gamma: float,
         film: float, blur: int, scale: float) -> Image.Image:
    a = np.asarray(depth.convert('L'), dtype=np.float32) / 255.0
    h, w = a.shape
    far = 1.0 - a  # bright=near → far = inverted depth
    pool = np.clip((far - t0) / (t1 - t0), 0.0, 1.0) ** gamma
    # Thin ground film so the near field is not totally empty.
    y = np.linspace(0.0, 1.0, h)[:, None]
    filmv = film * np.clip((y - 0.72) / 0.28, 0.0, 1.0)
    alpha = np.clip(pool + filmv, 0.0, 1.0)
    if scale != 1.0:
        alpha_img = Image.fromarray((alpha * 255).astype(np.uint8))
        alpha_img = alpha_img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        alpha = np.asarray(alpha_img, dtype=np.float32) / 255.0
    if blur > 0:
        alpha_img = Image.fromarray((alpha * 255).astype(np.uint8))
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=blur))
        alpha = np.asarray(alpha_img, dtype=np.float32) / 255.0
    hh, ww = alpha.shape
    rgba = np.zeros((hh, ww, 4), dtype=np.uint8)
    rgba[..., 0:3] = 255
    rgba[..., 3] = (alpha * 255.0).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--depth', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--t0', type=float, default=0.30, help='far-field threshold')
    ap.add_argument('--t1', type=float, default=0.92, help='far-field full-density point')
    ap.add_argument('--gamma', type=float, default=1.1)
    ap.add_argument('--film', type=float, default=0.05, help='near-ground film alpha')
    ap.add_argument('--blur', type=int, default=6)
    ap.add_argument('--scale', type=float, default=0.5, help='output resolution factor')
    args = ap.parse_args()

    img = bake(Image.open(args.depth), args.t0, args.t1, args.gamma,
               args.film, args.blur, args.scale)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.out)
    a = np.asarray(img)[..., 3] / 255.0
    print(f'wrote {args.out} {img.size} alpha mean={a.mean():.3f} '
          f'p50={np.quantile(a,0.5):.3f} p95={np.quantile(a,0.95):.3f}')


if __name__ == '__main__':
    main()
