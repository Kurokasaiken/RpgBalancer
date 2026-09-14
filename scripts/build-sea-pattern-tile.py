#!/usr/bin/env python3
"""
Build a transparent, tileable sea-pattern texture from a solid reference image.

The reference (e.g. the EPS preview JPG) contains a blue background with a
bright cellular network on top. This script extracts the network by high-pass
filtering the brightness channel, then writes an RGBA PNG where the RGB is white
(for later tinting in the shader) and the alpha channel carries the network
strength.

Usage:
    .mw/venv/bin/python scripts/build-sea-pattern-tile.py \
        --src <reference.jpg> \
        --out public/assets/world/wanderlust/base/layers/sea_pattern_tile.png \
        --max-px 2048 \
        --blur 50 \
        --gain 2.0 \
        --gamma 0.8
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageFilter
import numpy as np


def process(
    src: Path,
    out: Path,
    max_px: int,
    blur: int,
    gain: float,
    gamma: float,
) -> None:
    img = Image.open(src).convert("RGB")
    w, h = img.size

    # Preserve aspect ratio and fit inside max_px on the long side.
    scale = min(1.0, max_px / max(w, h))
    if scale < 1.0:
        new_size = (int(round(w * scale)), int(round(h * scale)))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    # Work in HSV: take the Value channel, which separates bright network lines
    # from the saturated blue background better than RGB luminance alone.
    hsv = img.convert("HSV")
    v = hsv.split()[2]
    arr = np.asarray(v, dtype=np.float32) / 255.0

    # High-pass filter: remove the smooth background, keep the bright detail.
    blurred = np.asarray(v.filter(ImageFilter.GaussianBlur(radius=blur)), dtype=np.float32) / 255.0
    detail = arr - blurred
    detail = np.maximum(detail, 0.0)

    # Boost and apply a gamma so thin lines are still visible without crushing
    # the subtle detail.
    alpha = np.clip(detail * gain, 0.0, 1.0)
    if gamma != 1.0:
        alpha = np.power(alpha, gamma)

    # Scale back to 8-bit and build a white-tintable RGBA image.
    alpha_u8 = (alpha * 255.0).astype(np.uint8)
    white = np.full_like(alpha_u8, 255)
    rgba = np.stack([white, white, white, alpha_u8], axis=-1)
    result = Image.fromarray(rgba, mode="RGBA")

    out.parent.mkdir(parents=True, exist_ok=True)
    result.save(out, "PNG")
    print(f"[build-sea-pattern-tile] wrote {out} ({result.size[0]}x{result.size[1]})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="/Users/faustoboni/Downloads/vector-seamless-rippled-swimming-pool-abstract-illustration-horizontally-vertically-repeatable/summer_background_47_a.jpg")
    parser.add_argument("--out", default="/Users/faustoboni/progetti_personali/RPG/public/assets/world/wanderlust/base/layers/sea_pattern_tile.png")
    parser.add_argument("--max-px", type=int, default=2048)
    parser.add_argument("--blur", type=int, default=50)
    parser.add_argument("--gain", type=float, default=2.0)
    parser.add_argument("--gamma", type=float, default=0.8)
    args = parser.parse_args()

    process(
        src=Path(args.src),
        out=Path(args.out),
        max_px=args.max_px,
        blur=args.blur,
        gain=args.gain,
        gamma=args.gamma,
    )


if __name__ == "__main__":
    main()
