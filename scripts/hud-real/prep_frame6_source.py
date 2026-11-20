#!/usr/bin/env python3
"""PLAN-128 — corner shadow floor + interior key for the panel-frame6 source.

1) Shadow floor (2026-11-19, Director: errors at the frame corners): the C-1b shadow curve pushes the pockets of the
   corner knuckles (behind the gem, under the arc) to L≈1 — they read as black HOLES. Inside the four corner crop
   windows, bronze pixels with L < FLOOR are lifted to FLOOR (a/b kept), so cavities stay deep but not black.
2) Interior key: the flat interior teal (colour rule b-r>=18, g-r>=14, max<=95, inside the interior rect, largest
   component, +1px dilation) is painted the background grey so the slicer's flatBgMaxDiff key removes it (replaces the
   rectangular cutout that used to punch the bronze wire at the rounded inner corners).
In:  .mw/specs/expedition-ui/refs/candidate-cornici-bronzo-r1.png  Out: ...-r1-keyed.png
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from material_palette import srgb_to_lab  # noqa: E402

SRC = REPO / ".mw/specs/expedition-ui/refs/candidate-cornici-bronzo-r1.png"
DST = REPO / ".mw/specs/expedition-ui/refs/candidate-cornici-bronzo-r1-keyed.png"
CORNERS = [(10, 14, 200, 208), (786, 14, 962, 200), (10, 846, 180, 1023), (800, 880, 962, 1023)]
FLOOR = 13.0
INTERIOR = (86, 135, 936, 1009)

_M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
_W = np.array([0.95047, 1.0, 1.08883])


def lab_to_rgb(lab):
    fy = (lab[..., 0] + 16) / 116
    f = np.stack([fy + lab[..., 1] / 500, fy, fy - lab[..., 2] / 200], -1)
    xyz = np.where(f ** 3 > 216 / 24389, f ** 3, (116 * f - 16) / (24389 / 27)) * _W
    lin = np.clip(xyz @ np.linalg.inv(_M).T, 0, 1)
    c = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)
    return np.clip(np.round(c * 255), 0, 255).astype(np.uint8)


def main() -> None:
    rgb = np.array(Image.open(SRC).convert("RGB"))
    lab = srgb_to_lab(rgb)
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    teal = (b - r >= 18) & (g - r >= 14) & (rgb.max(2) <= 95)
    lifted = 0
    changed = np.zeros(rgb.shape[:2], bool)
    for x0, y0, x1, y1 in CORNERS:
        win = np.zeros(rgb.shape[:2], bool)
        win[y0:y1, x0:x1] = True
        m = win & (lab[..., 0] < FLOOR) & ~teal & (np.abs(rgb.astype(int) - 120).max(2) > 14)
        lab[m, 0] = FLOOR
        changed |= m
        lifted += int(m.sum())
    rgb2 = lab_to_rgb(lab)
    # only the lifted pixels take the Lab round-trip; everything else keeps its ORIGINAL rgb (no drift)
    out = np.where(changed[..., None], rgb2, rgb)

    H, W = rgb.shape[:2]
    x0, y0, x1, y1 = INTERIOR
    inside = np.zeros((H, W), bool)
    inside[y0:y1, x0:x1] = True
    m = (teal & inside).astype(np.uint8)
    n, cc, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    m = cv2.dilate((cc == big).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    out = out.copy()
    out[m] = [120, 120, 120]
    Image.fromarray(out.astype(np.uint8)).save(DST)
    print(f"shadow floor L>={FLOOR}: {lifted} px lifted in the 4 corner windows; interior keyed -> {DST.name}")


if __name__ == "__main__":
    main()
