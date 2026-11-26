#!/usr/bin/env python3
"""Bake an empty interior variant of the shared slim Time shell.

The source of truth remains time/bar-slim.webp. This derivative physically
removes the painted enamel and speed sockets inside the live-content well,
then bakes the inner enamel donated by the previous production Events bar.
Rails, ornaments, medallion seats, silhouette and alpha are preserved. It is
deterministic: no runtime mask and no generative image dependency.
"""
from pathlib import Path
import json
import re

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public/assets/ui/hud-real/time/bar-slim.webp"
OUTPUT = ROOT / "public/assets/ui/hud-real/time/bar-slim-empty.webp"
ORNAMENT_OUTPUT = ROOT / "public/assets/ui/hud-real/time/bar-slim-inner-ornaments.webp"
GEOMETRY_TS = ROOT / "src/ui/idleVillage/hudReal/timeSlimGeometry.ts"
EVENTS_INTERIOR = ROOT / "public/assets/ui/hud-real/events/bar.webp"

# Clean inner enamel of the previous production Events bar. The crop avoids
# rails, medallions, red gem and ornaments.
EVENTS_INTERIOR_CROP = (205, 50, 795, 134)

# Source-space anatomy of the painted capsule end. Only the outer terminal rim
# is preserved; the inner parenthesis-shaped ornament is part of the removed
# Time controls and must not survive.
TERMINAL_GOLD_X = 720
TERMINAL_INNER_END_X = 748
# The Time medallion/text divider becomes a stray parenthesis when mirrored
# for Events. Remove the whole divider strip inside the tube; the medallion
# frame already supplies the right-end boundary.
DIVIDER_STRIP_X = 104


def _number_block(text: str) -> dict[str, float]:
    return {k: float(v) for k, v in re.findall(r'"(x|y|w|h)":\s*([0-9.]+)', text)}


def load_slim_geometry() -> dict:
    """Parse the generated slim-bar geometry instead of duplicating it."""
    text = GEOMETRY_TS.read_text()
    bar_w = float(re.search(r'"w":\s*([0-9.]+)', text).group(1))
    bar_h = float(re.search(r'"h":\s*([0-9.]+)', text).group(1))
    slots_match = re.search(r'"slots":\s*\[(.*?)\]', text, re.S)
    field_match = re.search(r'"field":\s*\{(.*?)\}', text, re.S)
    if not slots_match or not field_match:
        raise ValueError("TIME_SLIM_BAR geometry not found")
    slots = [_number_block(m.group(0)) for m in re.finditer(r'\{[^{}]+\}', slots_match.group(1))]
    field = _number_block(field_match.group(1))
    return {"w": bar_w, "h": bar_h, "slots": slots, "field": field}


def content_well(bar: dict) -> dict[str, float]:
    pieces = [bar["field"], *bar["slots"]]
    min_x = min(r["x"] for r in pieces)
    max_x = max(r["x"] + r["w"] for r in pieces)
    min_y = min(r["y"] for r in pieces)
    max_y = max(r["y"] + r["h"] for r in pieces)
    return {"x": min_x - 3, "y": min_y + 2, "w": max_x - min_x + 6, "h": max_y - min_y - 4}


def rounded_mask(size: tuple[int, int], rect: tuple[int, int, int, int], radius: int) -> np.ndarray:
    x0, y0, x1, y1 = rect
    ss = 4
    mask = Image.new("L", (size[0] * ss, size[1] * ss), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((x0 * ss, y0 * ss, x1 * ss, y1 * ss), radius=radius * ss, fill=255)
    mask = mask.resize(size, Image.Resampling.LANCZOS)
    arr = np.array(mask).astype(np.float32) / 255.0
    arr[:y0, :] = 0
    arr[y1 + 1:, :] = 0
    arr[:, :x0] = 0
    arr[:, x1 + 1:] = 0
    # Away from the rounded corners the interior must be fully opaque black;
    # otherwise the source enamel survives as a subpixel green fringe.
    arr[y0:y1 + 1, x0 + radius:x1 - radius] = 1
    arr[y0 + radius:y1 - radius, x0:x1 + 1] = 1

    # Match the old visual edge falloff, but as baked pixels rather than a DOM mask.
    xx = np.arange(size[0], dtype=np.float32)
    fade = min(max((x1 - x0) * 0.04, 1.0), 5.0)
    horizontal = np.clip((xx - x0 + 1) / fade, 0, 1) * np.clip((x1 - xx) / fade, 0, 1)
    return arr * horizontal[None, :]


def events_interior_texture(size: tuple[int, int], rect: tuple[int, int, int, int]) -> np.ndarray:
    """Resize the previous Events interior donor exactly onto the baked rect."""
    w, h = size
    x0, y0, x1, y1 = rect
    dx0, dy0, dx1, dy1 = EVENTS_INTERIOR_CROP
    donor = Image.open(EVENTS_INTERIOR).convert("RGB").crop((dx0, dy0, dx1, dy1))
    donor = donor.resize((x1 - x0 + 1, y1 - y0 + 1), Image.Resampling.LANCZOS)
    texture = np.zeros((h, w, 3), dtype=np.float32)
    texture[y0:y1 + 1, x0:x1 + 1] = np.array(donor).astype(np.float32)
    return texture


def regenerate() -> dict:
    im = Image.open(SOURCE).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    h, w = arr.shape[:2]
    bar = load_slim_geometry()
    well = content_well(bar)
    sx = w / bar["w"]
    sy = h / bar["h"]
    x0 = min(int(round(well["x"] * sx)), DIVIDER_STRIP_X)
    y0 = int(round(well["y"] * sy))
    x1 = TERMINAL_INNER_END_X
    y1 = int(round((well["y"] + well["h"]) * sy))
    radius = int(round(12 * sx))

    mask = rounded_mask((w, h), (x0, y0, x1, y1), radius)

    # The ornamental inner frame is part of the Time shell, not of the
    # removable controls. Preserve its metallic pixels at the left divider, at
    # the terminal top/bottom caps, and along the horizontal inner ornament;
    # the speed-socket zone remains explicitly excluded so the buttons die.
    rgb01 = arr[..., :3] / 255.0
    r, g, b = rgb01[..., 0], rgb01[..., 1], rgb01[..., 2]
    mx = np.maximum.reduce([r, g, b])
    mn = np.minimum.reduce([r, g, b])
    delta = mx - mn
    hue = np.zeros_like(mx)
    nonzero = delta > 1e-6
    idx = nonzero & (mx == r)
    hue[idx] = ((g[idx] - b[idx]) / delta[idx]) % 6
    idx = nonzero & (mx == g)
    hue[idx] = (b[idx] - r[idx]) / delta[idx] + 2
    idx = nonzero & (mx == b)
    hue[idx] = (r[idx] - g[idx]) / delta[idx] + 4
    hue /= 6.0
    sat = np.where(mx > 0, delta / np.maximum(mx, 1e-6), 0)
    xx = np.arange(w, dtype=np.float32)[None, :]
    yy = np.arange(h, dtype=np.float32)[:, None]
    socket_zone = (xx >= 370) & (xx <= 720) & (yy >= 12) & (yy <= 94)
    left_ornament = xx < 205
    terminal_caps = (xx >= 690) & ((yy <= 32) | (yy >= 78))
    horizontal_ornament = ((yy <= 28) | (yy >= 82)) & ~socket_zone
    ornamental_gold_zone = (left_ornament | terminal_caps | horizontal_ornament) & ~socket_zone
    gold = ornamental_gold_zone & (hue >= 0.065) & (hue <= 0.19) & (sat > 0.28) & (mx > 0.09)
    bright_metal = ornamental_gold_zone & (mx > 0.34) & (sat > 0.18) & (hue >= 0.055) & (hue <= 0.22)
    simple_gold = ornamental_gold_zone & (r > 0.10) & (r > b * 1.35) & (r > g * 0.58)
    # No dilation here: even a one-pixel growth would reintroduce the adjacent
    # green enamel. Exact metallic pixels survive; the rest of the terminal cap
    # is rebuilt as neutral black shading below, so the rim keeps its shape
    # without keeping the green hue.
    metal = np.clip(gold.astype(np.float32) + bright_metal.astype(np.float32) + simple_gold.astype(np.float32), 0, 1)
    preserve = metal
    mask = mask * (1 - preserve)

    texture = events_interior_texture((w, h), (x0, y0, x1, y1))
    out = arr.copy()
    m = mask[..., None]
    blended = arr[..., :3] * (1 - m) + texture * m
    out[..., :3] = np.where(m > 0, blended, arr[..., :3])
    result = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")
    result.save(OUTPUT, "WEBP", lossless=True)

    ornaments = np.zeros_like(np.array(im))
    ornaments[..., :3] = np.array(im)[..., :3]
    ornaments[..., 3] = (preserve * 255).astype(np.uint8)
    Image.fromarray(ornaments, "RGBA").save(ORNAMENT_OUTPUT, "WEBP", lossless=True)

    diff = np.abs(np.array(result).astype(np.int16) - np.array(im).astype(np.int16)).max(axis=2)
    outside = diff.copy()
    outside[y0:y1 + 1, x0:x1 + 1] = 0
    ys, xs = np.where(diff > 0)
    return {
        "output": str(OUTPUT.relative_to(ROOT)),
        "ornament_output": str(ORNAMENT_OUTPUT.relative_to(ROOT)),
        "source": str(SOURCE.relative_to(ROOT)),
        "rect": [x0, y0, x1, y1],
        "changed_pixels": int((diff > 0).sum()),
        "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else [0, 0, 0, 0],
        "max_diff_outside_well": int(outside.max()),
    }


if __name__ == "__main__":
    print(json.dumps(regenerate(), indent=2))
