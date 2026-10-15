#!/usr/bin/env python3
"""Remove the Gemini sparkle watermark from villaggio.png via seamless patch clone.

PLAN-035 T-001: the watermark is a bright ~96x96 four-point star in the bottom-right
corner (bbox ~ (3008,1184)-(3104,1280)) sitting half over dark foliage and half over
the grey-brown shore log. Plain Telea inpainting leaves a visible smooth "ghost"
silhouette, so instead we cv2.seamlessClone a 120x120 donor patch taken 140px to the
left at the same height — the log continues horizontally there and the clone blends
the edges invisibly.

Pixels outside the clone footprint (120x120 centred on the star centroid) are left
bit-identical.

Usage: .mw/venv/bin/python scripts/clean-village-watermark.py [--dry-run]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

IMAGE_PATH = Path(__file__).resolve().parent.parent / "src/assets/mood/villaggio.png"
EXPECTED_SIZE = (3168, 1344)
# Detection ROI containing the star (found empirically).
ROI = (2950, 1140, 3150, 1305)  # x0, y0, x1, y1
LUM_THRESHOLD = 120
PATCH_HALF = 60  # clone patch is 120x120
DONOR_DX = -140  # donor column 140px left of the star: the shore log continues there


def star_centroid(img: np.ndarray) -> tuple[int, int]:
    """Locate the watermark star as the largest bright connected component in the ROI."""
    x0, y0, x1, y1 = ROI
    roi = img[y0:y1, x0:x1]
    bright = ((roi.mean(axis=2) > LUM_THRESHOLD).astype(np.uint8)) * 255
    n, labels, stats, cents = cv2.connectedComponentsWithStats(bright, 8)
    if n < 2:
        raise RuntimeError("no bright component found in watermark ROI — already clean?")
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    cx, cy = cents[largest]
    return int(x0 + cx), int(y0 + cy)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="report star position without writing")
    args = parser.parse_args()

    src = Image.open(IMAGE_PATH).convert("RGB")
    if src.size != EXPECTED_SIZE:
        raise SystemExit(f"unexpected size {src.size}, expected {EXPECTED_SIZE}")
    img = np.array(src)

    cx, cy = star_centroid(img)
    print(f"star centroid ({cx},{cy}); clone patch {2*PATCH_HALF}x{2*PATCH_HALF}, donor dx={DONOR_DX}")

    donor = img[cy - PATCH_HALF : cy + PATCH_HALF, cx + DONOR_DX - PATCH_HALF : cx + DONOR_DX + PATCH_HALF]
    mask = np.full(donor.shape[:2], 255, np.uint8)
    cleaned = cv2.seamlessClone(donor, img, mask, (cx, cy), cv2.NORMAL_CLONE)

    footprint = np.zeros(img.shape[:2], bool)
    footprint[cy - PATCH_HALF : cy + PATCH_HALF, cx - PATCH_HALF : cx + PATCH_HALF] = True
    assert np.array_equal(img[~footprint], cleaned[~footprint]), "pixels outside patch were modified"

    if args.dry_run:
        print("dry-run: not writing")
        return 0
    Image.fromarray(cleaned).save(IMAGE_PATH)
    print(f"wrote {IMAGE_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
