#!/usr/bin/env python3
"""Bake the painted crater of the mappa2 volcano ("cima 1").

The painting has a sharp dark cone with a pointed tip. A volcano is a hole with lava in it, so this:
  1. removes the pointed tip (inpaint from the surrounding slope),
  2. paints a basalt rim (lit from the top-left like the rest of the painting), a dark pit and a lava pool,
  3. writes two sprites placed 1:1 over the painting (4x supersampled):
       fx/volcano/crater.webp  opaque patch with feathered edges (replaces the tip)
       fx/volcano/lava.webp    the glowing pool alone, additive, pulsed at runtime
Needs the painting (same default as build-mappa2-assets.py).
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

S = 4  # supersampling
X0, Y0, W, H = 1754 - 40, 982 - 34, 80, 62  # world-px patch
TIP = (1755.0, 979.5)  # painted tip of the dark cone
RIM_C = (TIP[0] + 0.5, TIP[1] + 12.0)  # crater centre: the cone is cut where it is ~11 px half-wide
RIM_A, RIM_B = 11.5, 4.6  # rim semi-axes (world px)


def ell(shape, c, a, b, wob=None, soft=0.0, rough=0.0, seed=0, rot_deg=-9.0):
    """Irregular crater outline: a rotated ellipse whose radius is modulated per angle by a few low harmonics
    (lobes, a notch, a slumped side) so it never reads as a drawn circle. `rough` scales the harmonics."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = xx / S + X0 - c[0]
    dy = yy / S + Y0 - c[1]
    t = np.radians(rot_deg)
    x = (dx * np.cos(t) + dy * np.sin(t)) / a
    y = (-dx * np.sin(t) + dy * np.cos(t)) / b
    r = np.sqrt(x * x + y * y)
    th = np.arctan2(y, x)
    rng = np.random.default_rng(100 + seed)
    mod = np.zeros_like(r)
    for k, amp in ((2, 0.07), (3, 0.09), (4, 0.06), (5, 0.05), (7, 0.035)):
        mod += rough * amp * np.cos(k * th + rng.uniform(0, 6.283))
    # one slumped section of the lip
    mod -= rough * 0.16 * np.exp(-((np.angle(np.exp(1j * (th - rng.uniform(0, 6.283)))) / 0.55) ** 2))
    r = r / (1 + mod)
    if wob is not None:
        r = r * (1 + wob)
    if soft <= 0:
        return (r <= 1).astype(np.float32)
    return np.clip((1 - r) / soft, 0, 1)


def noise(shape, sigma, rng, aniso=1.0):
    n = cv2.GaussianBlur(rng.standard_normal(shape).astype(np.float32), (0, 0), sigmaX=sigma * aniso, sigmaY=sigma)
    return n / (n.std() + 1e-6)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=str(Path.home() / "Downloads" / "mappa2.jpeg"))
    ap.add_argument("--pack", default="public/assets/world/mappa2/base")
    a = ap.parse_args()
    pack = Path(a.pack)
    rng = np.random.default_rng(11)

    src = Image.open(a.source).convert("RGB").crop((X0, Y0, X0 + W, Y0 + H))
    base = np.asarray(src.resize((W * S, H * S), Image.LANCZOS)).astype(np.float32) / 255
    sh = base.shape[:2]

    # 1) remove the pointed tip: dark pixels in the triangle above the rim -> inpaint from the slope
    yy, xx = np.mgrid[0:sh[0], 0:sh[1]].astype(np.float32)
    wx, wy = xx / S + X0, yy / S + Y0
    tri = (wy < RIM_C[1] - RIM_B + 3.2) & (wy > TIP[1] - 5) & (np.abs(wx - TIP[0]) < (wy - (TIP[1] - 5)) * 1.6 + 2)
    lum = cv2.cvtColor(base, cv2.COLOR_RGB2LAB)[..., 0]
    tip = (tri & (lum < 55)).astype(np.uint8)
    tip = cv2.dilate(tip, np.ones((9, 9), np.uint8))
    img8 = (base * 255).astype(np.uint8)
    filled = cv2.inpaint(img8, tip, 7, cv2.INPAINT_TELEA).astype(np.float32) / 255
    tipsoft = cv2.GaussianBlur(tip.astype(np.float32), (0, 0), 2.0)[..., None]
    filled = np.clip(filled * (1 + 0.09 * tipsoft * noise(sh, 2.6, rng, aniso=0.4)[..., None]), 0, 1)  # brush strokes, not a smudge

    # 2) paint: rim (basalt), pit, lava pool. Lit from the top-left like the painting.
    wob = noise(sh, 6, rng) * 0.05 + noise(sh, 2.2, rng) * 0.025
    outer = ell(sh, RIM_C, RIM_A + 0.8, RIM_B + 0.2, wob, rough=1.0, seed=1)
    outer_soft = cv2.GaussianBlur(outer, (0, 0), 1.2)
    pit = ell(sh, (RIM_C[0] + 0.1, RIM_C[1] + 0.3), RIM_A - 2.1, RIM_B - 1.1, wob, rough=1.25, seed=2)
    pit_soft = cv2.GaussianBlur(pit, (0, 0), 1.0)
    lava = ell(sh, (RIM_C[0] + 0.3, RIM_C[1] + 0.8), RIM_A - 2.7, RIM_B - 1.45, wob * 1.6, rough=1.7, seed=3)
    lava_soft = cv2.GaussianBlur(lava, (0, 0), 1.1)

    streak = noise(sh, 3.0, rng, aniso=0.45)  # brush streaks along the cone
    basalt_dark = np.array([0.17, 0.12, 0.15], np.float32)
    basalt_lit = np.array([0.26, 0.19, 0.21], np.float32)
    # rim shading: lit on the back-left, dark on the front-right
    lit = np.clip(0.5 + 0.5 * (-(wx - RIM_C[0]) / RIM_A * 0.8 - (wy - RIM_C[1]) / RIM_B * 0.9), 0, 1)[..., None]
    rim_col = basalt_dark * (1 - lit) + basalt_lit * lit
    rim_col = rim_col * (1 + 0.14 * streak[..., None])
    pit_col = np.array([0.075, 0.045, 0.05], np.float32)[None, None, :] * (1 + 0.2 * noise(sh, 2, rng)[..., None])

    out = filled.copy()
    out = out * (1 - outer_soft[..., None]) + rim_col * outer_soft[..., None]
    out = out * (1 - pit_soft[..., None]) + pit_col * pit_soft[..., None]

    # lava pool: red at the edge, orange, yellow-hot core; crust mottling
    ly = ((wy - (RIM_C[1] + 0.75)) / max(RIM_B - 1.85, 0.1))
    lx = ((wx - (RIM_C[0] + 0.2)) / max(RIM_A - 3.4, 0.1))
    rr = np.sqrt(lx * lx + ly * ly)
    heat = np.clip(1 - rr, 0, 1) ** 0.8
    heat = np.clip(heat + 0.22 * noise(sh, 2.6, rng), 0, 1) * lava_soft
    ramp = np.array([[0.45, 0.07, 0.03], [0.82, 0.18, 0.05], [1.0, 0.45, 0.10], [1.0, 0.76, 0.30]], np.float32)
    t = np.clip(heat * 3.0, 0, 2.999)
    i0 = t.astype(int)
    f = (t - i0)[..., None]
    lava_col = ramp[i0] * (1 - f) + ramp[np.minimum(i0 + 1, 3)] * f
    back = np.clip((RIM_C[1] - wy) / RIM_B * 0.9 + 0.35, 0, 1) * pit_soft  # shadowed back wall of the pit
    out = out * (1 - 0.35 * back[..., None])
    out = out * (1 - lava_soft[..., None] * 0.97) + lava_col * (lava_soft[..., None] * 0.97)
    # warm rim light on the inner lip
    lip = np.clip(cv2.GaussianBlur(pit, (0, 0), 1.6) - pit, 0, 1) * outer
    out = out + np.array([0.55, 0.14, 0.03], np.float32) * lip[..., None] * 0.9

    # keep the painted brush texture: re-impose the original local luminance detail on the rock
    detail = lum - cv2.GaussianBlur(lum, (0, 0), 4)
    out = np.clip(out + (detail[..., None] / 100) * 0.25 * (1 - lava_soft[..., None]) * outer_soft[..., None], 0, 1)

    # 3) outputs. crater patch: only what changed (tip area + crater), feathered
    changed = np.maximum(cv2.dilate(tip.astype(np.float32), np.ones((9, 9), np.uint8)), cv2.dilate(outer, np.ones((13, 13), np.uint8)))
    alpha = cv2.GaussianBlur(changed, (0, 0), 3.0)
    alpha = np.clip(alpha * 1.6, 0, 1)
    out_dir = pack / "fx" / "volcano"
    out_dir.mkdir(parents=True, exist_ok=True)
    rgba = np.dstack([out, alpha])
    Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), "RGBA").save(out_dir / "crater.webp", quality=95)

    glow = np.clip(heat * 1.3, 0, 1)
    ga = np.clip(cv2.GaussianBlur(lava, (0, 0), 1.6) * (0.55 + 0.45 * glow), 0, 1)
    gcol = ramp[np.minimum((np.clip(heat * 3.4, 0, 2.99)).astype(int) + 1, 3)]
    Image.fromarray((np.dstack([gcol, ga]) * 255).astype(np.uint8), "RGBA").save(out_dir / "lava.webp", quality=95)
    (out_dir / "crater.json").write_text(json.dumps({"x": X0, "y": Y0, "w": W, "h": H, "supersample": S, "centre": RIM_C, "semiAxes": [RIM_A, RIM_B]}, indent=2))
    print("wrote", out_dir)



def build_smoke_puffs(out_dir: Path, n: int = 4, size: int = 160) -> None:
    """Painted smoke puffs in the style of the map's own clouds: a few overlapping lobes, lit from the top-left, darker
    underside, soft brushy edge. Neutral grey: the runtime tints them (dark at the vent, paler higher up)."""
    for i in range(n):
        rng = np.random.default_rng(500 + i)
        field = np.zeros((size, size), np.float32)
        yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
        lobes = rng.integers(7, 10)
        for _ in range(lobes):
            ang = rng.uniform(0, 6.283)
            rad = rng.uniform(0, size * 0.2)
            cx = size / 2 + np.cos(ang) * rad
            cy = size / 2 + np.sin(ang) * rad * 0.8
            r = rng.uniform(size * 0.12, size * 0.2)
            d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
            field = np.maximum(field, np.clip(1.15 - d, 0, 1))
        field = cv2.GaussianBlur(field, (0, 0), 1.6)
        alpha = np.clip((field - 0.12) / 0.3, 0, 1)
        alpha = alpha * alpha * (3 - 2 * alpha)  # smooth cartoon edge, no speckle
        # shading like the painted clouds: lit top-left, shaded bottom-right, soft creases between lobes
        blur = cv2.GaussianBlur(field, (0, 0), 4.0)
        gy, gx = np.gradient(blur)
        light = np.clip(0.74 + (gx * 0.9 + gy * 1.1) * 9.0, 0.5, 1.0)
        under = np.clip((yy / size - 0.45) * 0.45, 0, 0.28)
        crease = np.clip(1.0 - 0.35 * np.clip(cv2.GaussianBlur(field, (0, 0), 1.2) - blur, -1, 0) * -6, 0.7, 1.0)
        grey = np.clip(light - under, 0, 1) * crease
        rgba = np.dstack([grey, grey, np.clip(grey * 1.02, 0, 1), alpha * 0.96])
        Image.fromarray((rgba * 255).astype(np.uint8), "RGBA").save(out_dir / f"smoke_{i + 1}.webp", quality=95)
    print("wrote", n, "smoke puffs")


if __name__ == "__main__":
    main()
    build_smoke_puffs(Path(__import__("sys").argv[0]).resolve().parent.parent / "public/assets/world/mappa2/base/fx/volcano")
