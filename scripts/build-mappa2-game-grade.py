#!/usr/bin/env python3
"""Collapse the four approved mappa2 grade sheets into ONE multiply + add pair for /game (2026-11-10, R-322).

At /game the grade is fixed (approved look, every opacity = 1), so the per-pixel chain the renderer draws —
all full-world sprites, sorted by zIndex in PixiWorldMap:

    z 3    mountain-shade      multiply          d1 = d  * S
    z 3    sea-sapphire-mult   multiply          d2 = d1 * M
    z 3    sea-sapphire-add    add, alpha 0.5    d3 = d2 + A2 / 2        (sheet stored x2)
    z 3.5  mountain-clarity    normal (premult)  d4 = Cp + d3 * (1 - Ca)

is one affine map per channel:  d4 = d * k + b   with   k = S * M * (1 - Ca),   b = (A2 / 2) * (1 - Ca) + Cp.

Output (lossless, so no codec error on top of the 8-bit rounding):
  fx/game-grade-mult.webp   k
  fx/game-grade-add.webp    b stored x1 (b reaches 0.92 on the clarity highlights: x2 storage would clip 0.19% px)
Drawn by PixiWorldMap `seaGrade` with `addScale: 1`. Saves 2 full-world textures (~43 MB GPU) and 3 full-screen
blend passes per frame. The four source sheets stay the lab's live controls.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

FX = Path("public/assets/world/mappa2/base/fx")


def load(name: str, mode: str) -> np.ndarray:
    return np.asarray(Image.open(FX / name).convert(mode)).astype(np.float64) / 255


def main() -> None:
    s = load("mountain-shade.webp", "RGB")
    m = load("sea-sapphire-mult.webp", "RGB")
    a2 = load("sea-sapphire-add.webp", "RGB")
    c = load("mountain-clarity.webp", "RGBA")
    no_clarity = "--no-clarity" in sys.argv  # PLAN-115 D3 preview: the hi-res land may not want the 2752 clarity plate
    if no_clarity:
        c = np.zeros_like(c)
    ca = c[..., 3:4]
    cp = np.round(c[..., :3] * ca * 255) / 255  # the GPU premultiplies on upload, in 8 bit
    k = s * m * (1 - ca)
    b = (a2 / 2) * (1 - ca) + cp
    assert b.max() <= 1.0 + 1e-9, b.max()
    name = "game-grade-noclarity" if no_clarity else "game-grade"
    Image.fromarray(np.round(k * 255).astype(np.uint8), "RGB").save(FX / f"{name}-mult.webp", lossless=True, quality=80, method=4)
    Image.fromarray(np.round(b * 255).astype(np.uint8), "RGB").save(FX / f"{name}-add.webp", lossless=True, quality=80, method=4)

    # offline check against the chain on random backdrops, both with per-pass 8-bit rounding like the framebuffer
    rng = np.random.default_rng(7)
    d = rng.integers(0, 256, size=s.shape).astype(np.float64) / 255
    q = lambda x: np.round(np.clip(x, 0, 1) * 255) / 255
    chain = q(cp + q(q(q(d * s) * m) + a2 / 2) * (1 - ca))
    kq = np.round(k * 255) / 255
    bq = np.round(b * 255) / 255
    single = q(q(d * kq) + bq)
    diff = np.abs(chain - single) * 255
    print(f"max diff {diff.max():.0f} levels, mean {diff.mean():.3f}, >1 level {(diff > 1).mean() * 100:.3f}% of channels")


if __name__ == "__main__":
    main()
