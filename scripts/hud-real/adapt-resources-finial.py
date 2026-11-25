#!/usr/bin/env python3
"""Rebuild the resource bar's end caps from the time bar's signed finial.

R-379 direction correction: the small Time terminal is the keeper; the older
ornate Resources caps are the pieces being replaced. The sources are preserved
references, not generated bars: the Time reference already includes the
Director's medallion work and the Resources reference is the live R-376 slim.

Usage: tools/hud-real/venv/bin/python scripts/hud-real/adapt-resources-finial.py
       --output .mw/runs/20261124-resources-finial/candidate.webp
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / ".mw/specs/hud-real/resources/refs/ref-resources-slim-pre-time-finial.webp"
TIME = ROOT / ".mw/specs/hud-real/time/refs/ref-time-slim-pre-finial.webp"
TARGET = ROOT / "public/assets/ui/hud-real/resources/bar-slim.webp"
TIME_FINIAL_LEFT = 714
BLEND_WIDTH = 28
SLOT_INSET = 16
SLOT_FEATHER = 8
# Generated resourcesSlimGeometry.ts values, back in source pixels.
END_SLOTS = (
    (81.26, 24.38, 184.02, 76.04),
    (494.62, 24.38, 182.28, 76.04),
)


def _blend_patch_left(canvas: np.ndarray, patch: np.ndarray, x: int) -> None:
    """Fade the patch's left edge into the existing bar."""
    width = patch.shape[1]
    blend = min(BLEND_WIDTH, width)
    for i in range(blend):
        amount = i / (blend - 1)
        canvas[:, x + i] = canvas[:, x + i] * (1.0 - amount) + patch[:, i] * amount
    canvas[:, x + blend : x + width] = patch[:, blend:]


def _blend_patch_right(canvas: np.ndarray, patch: np.ndarray, x: int) -> None:
    """Fade the mirrored patch's right edge into the existing bar."""
    width = patch.shape[1]
    blend = min(BLEND_WIDTH, width)
    canvas[:, x : x + width - blend] = patch[:, : width - blend]
    for j in range(blend):
        i = width - blend + j
        amount = 1.0 - j / (blend - 1)
        canvas[:, x + i] = canvas[:, x + i] * (1.0 - amount) + patch[:, i] * amount


def _slot_mask(size: tuple[int, int]) -> Image.Image:
    """Keep the two end glass wells readable while the cap changes around them."""
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    for x, y, width, height in END_SLOTS:
        draw.rounded_rectangle(
            (
                x + SLOT_INSET,
                y + SLOT_INSET,
                x + width - SLOT_INSET,
                y + height - SLOT_INSET,
            ),
            radius=max(1.0, (height - 2 * SLOT_INSET) / 2),
            fill=255,
        )
    return mask.filter(ImageFilter.GaussianBlur(SLOT_FEATHER))


def compose_finials() -> Image.Image:
    """Place the Time finial at both ends while preserving the slot interiors."""
    base = Image.open(BASE).convert("RGBA")
    time = Image.open(TIME).convert("RGBA")
    if base.size != (758, 124) or time.size != (839, 108):
        raise ValueError("HUD art dimensions changed; remeasure the finial seam")

    scale = base.height / time.height
    cap = time.crop((TIME_FINIAL_LEFT, 0, time.width, time.height))
    cap = cap.resize((round(cap.width * scale), base.height), Image.Resampling.LANCZOS)

    canvas = np.array(base, dtype=np.float32)
    cap_px = np.array(cap, dtype=np.float32)
    _blend_patch_left(canvas, cap_px, base.width - cap.width)
    _blend_patch_right(canvas, np.array(cap.transpose(Image.Transpose.FLIP_LEFT_RIGHT), dtype=np.float32), 0)
    adapted = Image.fromarray(np.uint8(np.clip(canvas, 0, 255)))
    return Image.composite(base, adapted, _slot_mask(base.size))


def check_finials() -> None:
    """Guard dimensions, the untouched middle, and both changed end caps."""
    base = Image.open(BASE).convert("RGBA")
    actual = Image.open(TARGET).convert("RGBA")
    expected = compose_finials()
    if actual.size != base.size:
        raise AssertionError("resources bar geometry changed")
    actual_px = np.array(actual)
    expected_px = np.array(expected)
    visible = (actual_px[:, :, 3] > 8) | (expected_px[:, :, 3] > 8)
    if not np.array_equal(actual_px[:, :, 3], expected_px[:, :, 3]) or not np.array_equal(
        actual_px[:, :, :3][visible], expected_px[:, :, :3][visible]
    ):
        raise AssertionError("installed resources finials differ from the deterministic recipe")
    middle = np.array(actual)[:, 180:578]
    source_middle = np.array(base)[:, 180:578]
    middle_visible = (middle[:, :, 3] > 8) | (source_middle[:, :, 3] > 8)
    if not np.array_equal(middle[:, :, 3], source_middle[:, :, 3]) or not np.array_equal(
        middle[:, :, :3][middle_visible], source_middle[:, :, :3][middle_visible]
    ):
        raise AssertionError("resources central bar or middle slot changed")
    changed = np.abs(np.array(actual, dtype=np.int16) - np.array(base, dtype=np.int16))
    if changed[:, :160, :3].sum() < 50000 or changed[:, 598:, :3].sum() < 50000:
        raise AssertionError("resources end caps have not been replaced")
    print("PASS: resources bar dimensions and middle preserved; both finials adapted")


def main() -> None:
    """Generate the candidate/production asset or validate the installed one."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check_finials()
    elif args.output:
        compose_finials().save(args.output, "WEBP", lossless=True)
        print(args.output)
    else:
        parser.error("provide --output or --check")


if __name__ == "__main__":
    main()
