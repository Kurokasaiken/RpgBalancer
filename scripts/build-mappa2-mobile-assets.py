#!/usr/bin/env python3
"""PLAN-115 F4 — half-resolution copies of the full-world sheets the MOBILE profile loads (budget 160 MB, G0).

Every sheet is sampled by world UV (shaders) or stretched to the 2752 world (sprites), so a half-size file draws in
the same place; on a phone the map is shown far smaller than 1:1, so the lost texels are mostly below a screen pixel.
RGBA sheets are averaged premultiplied (no dark/bright fringes at alpha edges).

  masks/foam_clean.half.webp, masks/foam_strokes.half.webp   coast surf plates (RGBA)
  masks/sea_zones.half.webp                                   sea mask + surf zones (opaque RGB)
  fx/game-grade-{mult,add}.half.webp                          combined approved grade
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PACK = Path("public/assets/world/mappa2/base")


def half_rgb(src: Path, dst: Path) -> None:
    a = np.asarray(Image.open(src).convert("RGB"))
    Image.fromarray(cv2.resize(a, (a.shape[1] // 2, a.shape[0] // 2), interpolation=cv2.INTER_AREA)).save(dst, lossless=True, quality=80, method=4)


def half_rgba(src: Path, dst: Path) -> None:
    a = np.asarray(Image.open(src).convert("RGBA")).astype(np.float32) / 255
    pm = np.dstack([a[..., :3] * a[..., 3:4], a[..., 3:4]])
    h = cv2.resize(pm, (a.shape[1] // 2, a.shape[0] // 2), interpolation=cv2.INTER_AREA)
    alpha = h[..., 3:4]
    rgb = np.where(alpha > 1e-4, h[..., :3] / np.maximum(alpha, 1e-4), 0)
    out = np.clip(np.round(np.dstack([rgb, alpha]) * 255), 0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst, lossless=True, quality=80, method=4)


def main() -> None:
    m = PACK / "masks"
    half_rgba(m / "foam_clean.webp", m / "foam_clean.half.webp")
    half_rgba(m / "foam_strokes.webp", m / "foam_strokes.half.webp")
    half_rgb(m / "sea_zones.webp", m / "sea_zones.half.webp")
    for k in ("mult", "add"):
        half_rgb(PACK / "fx" / f"game-grade-{k}.webp", PACK / "fx" / f"game-grade-{k}.half.webp")
    print("wrote foam_clean/foam_strokes/sea_zones .half + game-grade-{mult,add}.half")


if __name__ == "__main__":
    main()
