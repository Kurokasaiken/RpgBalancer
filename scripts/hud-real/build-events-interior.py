#!/usr/bin/env python3
"""Regenerate only the inner enamel field of the HUD Events bar.

This step is intentionally run after build-events-tube.py: it preserves the
thin rails, medallions, red gem, ornaments, silhouette and alpha. The enamel
texture itself is donated by the clean central field of the Director-registered
original reference, not synthesized as an opaque patch.
"""
from pathlib import Path
import argparse

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BAR = ROOT / "public/assets/ui/hud-real/events/bar.webp"
REFERENCE = ROOT / ".mw/specs/hud-eventi/refs/ref-eventi-bar-specular-time-2026-11-25.png"

# Geometry of the inner enamel field in the post-tube 976x186 asset.
X0, X1 = 150, 830
XC0, XC1 = 205, 795
Y0, Y1 = 39, 142

# Clean enamel donor in the registered 1024x215 reference. These bounds avoid
# the left compass ornament, the right filigree, and the bright rail/glow rows.
DONOR_CROP = (225, 70, 735, 143)


def smoothstep(a: float, b: float, x: np.ndarray) -> np.ndarray:
    return np.clip((x - a) / (b - a), 0, 1)


def build_reference_enamel(shape: tuple[int, int]) -> np.ndarray:
    """Resize the original clean enamel donor onto the post-tube inner field."""
    h, w = shape
    donor = Image.open(REFERENCE).convert("RGB").crop(DONOR_CROP)
    donor = donor.resize((X1 - X0, Y1 - Y0), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.35))
    texture = np.zeros((h, w, 3), dtype=np.float32)
    texture[Y0:Y1, X0:X1] = np.array(donor).astype(np.float32)

    # Extrapolate the donor edges into the small feather margins so the blend
    # never introduces a flat black fallback colour.
    for y in range(Y0, Y1):
        texture[y, :X0] = texture[y, X0]
        texture[y, X1:] = texture[y, X1 - 1]
    for y in range(Y0):
        texture[y] = texture[Y0]
    for y in range(Y1, h):
        texture[y] = texture[Y1 - 1]
    return texture


def regenerate(bar_path: Path = BAR) -> dict[str, float | int | tuple[int, int, int, int]]:
    im = Image.open(bar_path).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]

    wx = smoothstep(X0, XC0, xx) * (1 - smoothstep(XC1, X1, xx))
    wy = smoothstep(Y0, Y0 + 5, yy) * (1 - smoothstep(Y1 - 5, Y1, yy))
    geom = wx * wy

    rgb = arr[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    alpha = arr[..., 3] / 255.0

    gold = (r > g * 1.12) & (r > b * 1.35) & (r > 45)
    red = (r > g * 1.45) & (r > b * 1.25) & (r > 55)
    bright = r + g + b > 390
    preserve = (gold | red | bright).astype(np.float32)
    preserve = np.array(Image.fromarray((preserve * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))).astype(np.float32) / 255.0

    mask = geom * alpha * (1 - preserve)
    mask = np.array(Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255.0

    tex = build_reference_enamel((h, w))
    out = arr.copy()
    m = mask[..., None]
    out[..., :3] = rgb * (1 - m) + tex * m

    result = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")
    result.save(bar_path, "WEBP", lossless=True)

    before = np.array(im).astype(np.int16)
    after = np.array(result).astype(np.int16)
    diff = np.abs(after - before).max(axis=2)
    outside = diff.copy()
    outside[mask > 0.01] = 0
    ys, xs = np.where(diff > 0)
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(xs) else (0, 0, 0, 0)
    return {
        "changed_pixels": int((diff > 0).sum()),
        "max_diff_inside": int(diff[mask > 0.01].max()) if np.any(mask > 0.01) else 0,
        "max_diff_outside_mask": int(outside.max()),
        "bbox": bbox,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Regenerate the Events bar inner enamel field in place.")
    parser.parse_args()
    print(regenerate())
