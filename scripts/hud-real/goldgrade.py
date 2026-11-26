"""Shared gold-grading toward the Time gold reference (Director 2026-11-26).

Measured truth: the Events source art (Director reference slices) carries gold
at hue ~35deg (orange-bronze) while the Time reference gold sits at hue ~45deg
(yellow-gold). This module rotates only the gold family toward the reference,
leaving greens, reds and neutrals untouched. Deterministic: same input -> same
output. Used as a post-step by build-events-bar.py and build-events-panel.py.
"""
import numpy as np
from PIL import Image, ImageFilter

TIME_GOLD_HUE = 45.2  # median gold hue of time/bar-slim.webp (measured)


def _rgb_to_hue_sat_val(rgb: np.ndarray):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    diff = mx - mn
    hue = np.zeros_like(mx)
    nz = diff > 1e-5
    idx = nz & (mx == r); hue[idx] = ((g[idx] - b[idx]) / diff[idx]) % 6
    idx = nz & (mx == g); hue[idx] = (b[idx] - r[idx]) / diff[idx] + 2
    idx = nz & (mx == b); hue[idx] = (r[idx] - g[idx]) / diff[idx] + 4
    hue *= 60.0
    sat = np.where(mx > 1e-5, diff / np.maximum(mx, 1e-5), 0)
    return hue, sat, mx


def _rotate_hue(rgb: np.ndarray, shift_deg: float) -> np.ndarray:
    """Rotate every pixel's hue by shift_deg, preserving sat/val."""
    hue, sat, val = _rgb_to_hue_sat_val(rgb)
    hue = (hue + shift_deg) % 360.0
    h6 = hue / 60.0
    i = np.floor(h6).astype(int) % 6
    f = h6 - np.floor(h6)
    c = val * sat
    x = c * (1 - np.abs(f % 2 - 1))
    m = val - c
    z = np.zeros_like(c)
    rr = np.choose(i, [c, x, z, z, x, c])
    gg = np.choose(i, [x, c, c, x, z, z])
    bb = np.choose(i, [z, z, x, c, c, x])
    return np.stack([rr + m, gg + m, bb + m], axis=-1)


def gold_mask_weight(rgb: np.ndarray) -> np.ndarray:
    """Soft 0..1 membership of each pixel in the gold family."""
    hue, sat, val = _rgb_to_hue_sat_val(rgb)
    def ramp(x, a, b):
        return np.clip((x - a) / (b - a), 0, 1)
    hw = np.minimum(ramp(hue, 18, 26), 1 - ramp(hue, 58, 68))
    sw = ramp(sat, 0.15, 0.35)
    vw = ramp(val, 0.15, 0.30)
    return hw * sw * vw


def grade_gold_toward_time(image: Image.Image) -> Image.Image:
    """Rotate the gold family of a transparent RGBA asset toward the Time hue.

    The shift is measured from the asset itself (median gold hue) so the
    grading self-corrects; clamped to +/-15deg as a sanity bound.
    """
    arr = np.array(image).astype(np.float32)
    rgb = arr[..., :3] / 255.0
    alpha = arr[..., 3]
    hue, sat, val = _rgb_to_hue_sat_val(rgb)
    w = gold_mask_weight(rgb)
    strong = (w > 0.5) & (alpha > 100)
    if strong.sum() < 200:
        return image
    measured = float(np.median(hue[strong]))
    shift = float(np.clip(TIME_GOLD_HUE - measured, -15, 15))
    if abs(shift) < 0.5:
        return image
    shifted = _rotate_hue(rgb, shift)
    # spatially smooth the weight to avoid hard seams at mask edges
    w_img = Image.fromarray((w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    ws = (np.array(w_img).astype(np.float32) / 255.0)[..., None]
    out_rgb = rgb * (1 - ws) + shifted * ws
    out = arr.copy()
    out[..., :3] = np.clip(out_rgb * 255.0, 0, 255)
    return Image.fromarray(out.astype(np.uint8), 'RGBA')
