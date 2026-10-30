#!/usr/bin/env python3
"""Bake the northern-mountains shade for mappa2: an RGB multiply sheet (white = untouched), the "cinematic" rock grade.

Darkens the alpine rock (not the snow, not the sea inside the alpine territory polygon) the way look-dev
variant 8 of `.mw/runs/20261029-mappa2-grade-fork` did: gamma on Lab L, expressed as a per-pixel multiplier.
Needs the painting (same default as build-mappa2-assets.py) and the pack's biome_ids.png + masks.
"""
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=str(Path.home() / "Downloads" / "mappa2.jpeg"))
    ap.add_argument("--pack", default="public/assets/world/mappa2/base")
    ap.add_argument("--gamma", type=float, default=1.45)
    args = ap.parse_args()
    pack = Path(args.pack)

    src = np.asarray(Image.open(args.source).convert("RGB")).astype(np.float32) / 255
    bio = np.array(Image.open(pack / "biome_ids.png"))
    land = np.array(Image.open(pack / "masks" / "land_mask.webp"))[..., 3] > 127

    lab = cv2.cvtColor(src, cv2.COLOR_RGB2LAB)
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    chroma = np.hypot(a, b)
    hsv = cv2.cvtColor(src, cv2.COLOR_RGB2HSV)
    watery = (hsv[..., 0] >= 160) & (hsv[..., 0] <= 215) & (hsv[..., 1] > 0.45) & (hsv[..., 2] > 0.3)

    # alpine territory, minus anything that reads as open water (the sea_mask leaks into the snowy peaks, so use colour too)
    rock = (bio == 1) & (land | ~watery) & ~watery
    area = cv2.GaussianBlur(rock.astype(np.float32), (0, 0), 18)
    # snow / bright neutral stays untouched
    t = np.clip((L - 62) / 12, 0, 1) * np.clip((22 - chroma) / 10, 0, 1)
    snow = cv2.GaussianBlur(t, (0, 0), 2)
    w = area * (1 - snow)

    # "cinematic" target on the rock: gamma on L (deeper shadows) + local contrast (clarity) + fine sharpening.
    # Expressed as two sheets so the runtime needs no filter: multiply (<=1, darkens) and add (>=0, lifts the
    # sharpened highlights). Snow stays untouched via `w`.
    Lc = 100 * np.clip(L / 100, 1e-3, 1) ** args.gamma
    Lc = Lc + 0.55 * (Lc - cv2.GaussianBlur(Lc, (0, 0), 8)) + 0.7 * (Lc - cv2.GaussianBlur(Lc, (0, 0), 1.0))
    Lc = np.clip(Lc, 0, 100)
    lab2 = lab.copy()
    lab2[..., 0] = Lc
    lab2[..., 1:] *= 1.08                                   # a touch more chroma, rock reads richer
    target = np.clip(cv2.cvtColor(lab2, cv2.COLOR_LAB2RGB), 0, 1)
    tgt = src * (1 - w[..., None]) + target * w[..., None]  # only on rock
    ratio = np.clip(tgt / np.maximum(src, 1e-3), 0, 1)
    mult = np.minimum(ratio, 1.0)
    add = np.clip(tgt - src * mult, 0, 1)
    pack_fx = pack / "fx"
    Image.fromarray(np.clip(mult * 255, 0, 255).astype(np.uint8), "RGB").save(pack_fx / "mountain-shade.webp", quality=95)
    print(f"shade mean {mult[rock].mean():.3f}; residual lift (not baked, negligible) {add[rock].mean():.4f}")


if __name__ == "__main__":
    main()
