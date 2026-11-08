#!/usr/bin/env python3
"""Remove the squared NW sea patch from layers/base_flat.hi.webp (Director 2026-11-05, "mare squadrato in alto a sinistra").

The 2x repaint has a rectangular tile in the NW corner (lighter, with a dark shaded rim along its right and bottom
edge); the 1x painting base_flat.webp has no such seam. Inside a feathered band around the rectangle edges, the open
water's LOW frequencies of the hi-res are re-matched to the upscaled 1x painting (Lab, sigma ~30 hi px); the hi-res
high frequencies (coral, ripples) are untouched, as is everything that is not open water (islands, cliffs, coast).
Idempotent: the correction is computed against the 1x painting, so running it twice changes nothing more.
Usage: python3 scripts/fix-mappa2-hi-nw-seam.py [--dry]  (writes a backup next to the layer on first run)."""
import argparse
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PACK = Path("public/assets/world/mappa2/base")
S = 2  # hi-res scale vs the 2752x1536 world
CROP = (0, 0, 800 * S, 560 * S)  # x0, y0, x1, y1 in hi px — covers the seam band with margin


def ramp(v, lo, hi, f):
    """1 inside [lo, hi], falling linearly to 0 over f px outside."""
    return np.clip(np.minimum((v - lo) / f, (hi - v) / f) + 1.0, 0, 1)


def nconv(ch, wt, sigma):
    return cv2.GaussianBlur(ch * wt, (0, 0), sigma) / np.maximum(cv2.GaussianBlur(wt, (0, 0), sigma), 1e-4)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    hi_path = PACK / "layers" / "base_flat.hi.webp"
    bak = hi_path.with_suffix(".preseam.webp")
    if not bak.exists() and not a.dry:
        shutil.copy2(hi_path, bak)
    x0, y0, x1, y1 = CROP
    hi_full = Image.open(bak if bak.exists() else hi_path).convert("RGB")
    hi = np.asarray(hi_full.crop(CROP)).astype(np.float32) / 255
    h, w = hi.shape[:2]
    ref = np.asarray(Image.open(PACK / "layers" / "base_flat.webp").convert("RGB").crop((x0 // S, y0 // S, x1 // S, y1 // S)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
    sea = np.asarray(Image.open(PACK / "masks" / "sea_mask.webp"))[..., 3][y0 // S : y1 // S, x0 // S : x1 // S]
    land = np.asarray(Image.open(PACK / "masks" / "land_mask.webp"))[..., 3][y0 // S : y1 // S, x0 // S : x1 // S]
    open_w = ((sea > 230) & (land < 12)).astype(np.float32)
    open_w = cv2.resize(open_w, (w, h), interpolation=cv2.INTER_LINEAR)
    open_w = cv2.erode((open_w > 0.5).astype(np.float32), np.ones((15, 15), np.uint8))

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    X, Y = xx / S, yy / S  # world px
    vert = ramp(X, 470, 690, 60) * ramp(Y, -50, 440, 60)
    horz = ramp(Y, 300, 470, 60) * ramp(X, -50, 690, 60)
    band = np.clip(vert + horz, 0, 1)
    soft = cv2.GaussianBlur(open_w, (0, 0), 10.0) * band

    lab_hi = cv2.cvtColor(hi, cv2.COLOR_RGB2LAB)
    lab_ref = cv2.cvtColor(ref, cv2.COLOR_RGB2LAB)
    out = lab_hi.copy()
    for c in range(3):
        cur = nconv(lab_hi[..., c], open_w, 30.0)
        tgt = nconv(lab_ref[..., c], open_w, 30.0)
        out[..., c] = lab_hi[..., c] + (tgt - cur) * soft
    fixed = np.clip(cv2.cvtColor(out, cv2.COLOR_LAB2RGB), 0, 1)
    print(f"mean |dLab L| in band: {np.abs(out[..., 0] - lab_hi[..., 0])[soft > 0.5].mean():.2f}")
    if a.dry:
        return
    full = hi_full.copy()
    full.paste(Image.fromarray((fixed * 255).round().astype(np.uint8), "RGB"), (x0, y0))
    full.save(hi_path, quality=92, method=6)
    print("wrote", hi_path)


if __name__ == "__main__":
    main()
