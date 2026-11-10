#!/usr/bin/env python3
"""PLAN-115 F2 — the ruled /game map look "v2" (Director 2026-11-10: D1 = raw hi-res land, D2 = hi-res sea) as a
resident 2752 set + a hi-res tile pyramid level streamed only where the player zooms.

Input (from scripts/build-mappa2-hires-land.py):
  layers/base_flat.nocanopy.hiraw.seahi.webp   5504x3072  raw hi land + hi sea, ground under the canopy cut-outs
  layers/forest_canopy_NN.canopy.hiraw.webp    40 cut-outs at 2x
  layers/Mare.hisea.webp                       hi sea at 2752 with Mare's alpha (seabed reveal only)

Output:
  layers/base_flat.nocanopy.v2.webp            2752 resident base (area-downsampled 5504) — every tier, overview
  layers/base_flat.v2.webp                     2752 base WITH trees, for reduced motion (no cut-outs, no tiles)
  layers/forest_canopy_NN.canopy.v2.webp       2752 cut-outs (low tiers) · .canopy.v2hi.webp 5504 cut-outs (high tiers)
  layers/Mare.v2.webp                          seabed-reveal sea
  tiles/v2/L0/{col}_{row}.webp + tiles/v2/tiles.json
      L0 = 5504x3072 cut in 512x512 cells, each stored with a 2 px gutter of its neighbours' pixels (516x516 max) so
      bilinear sampling at a cell edge reads the same texels as the neighbour: no seams. 0.5 world px per texel.

Checks (fail the build): the cells re-assembled without gutter equal the source pixel for pixel (before encoding);
after WebP encoding the seam rows differ from the source by <= SEAM_TOL levels.
"""
import hashlib
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PACK = Path("public/assets/world/mappa2/base")
LAYERS = PACK / "layers"
OUT = PACK / "tiles" / "v2"
CELL, GUTTER, QUALITY, SEAM_TOL = 512, 2, 95, 8


def down2(a: np.ndarray) -> np.ndarray:
    return cv2.resize(a, (a.shape[1] // 2, a.shape[0] // 2), interpolation=cv2.INTER_AREA)


def main() -> None:
    src_path = LAYERS / "base_flat.nocanopy.hiraw.seahi.webp"
    src = np.asarray(Image.open(src_path).convert("RGB"))
    H, W = src.shape[:2]

    # resident 2752 set
    Image.fromarray(down2(src)).save(LAYERS / "base_flat.nocanopy.v2.webp", quality=QUALITY, method=4)
    # reduced motion has no swaying cut-outs: its base is the raw hi painting WITH its trees (and hi sea), at 2752
    full = np.asarray(Image.open(LAYERS / "base_flat.hi.webp").convert("RGB"))
    Image.fromarray(down2(full)).save(LAYERS / "base_flat.v2.webp", quality=QUALITY, method=4)
    manifest = json.loads((PACK / "manifest.json").read_text())
    for layer in manifest["pack"]["canopyLayers"]:
        stem = layer["file"].replace(".webp", "")
        hi = LAYERS / f"{stem}.canopy.hiraw.webp"
        shutil.copyfile(hi, LAYERS / f"{stem}.canopy.v2hi.webp")
        rgba = np.asarray(Image.open(hi).convert("RGBA")).astype(np.float32)
        r = layer["rect"]
        lo = cv2.resize(rgba, (r["width"], r["height"]), interpolation=cv2.INTER_AREA)
        Image.fromarray(np.clip(np.round(lo), 0, 255).astype(np.uint8), "RGBA").save(LAYERS / f"{stem}.canopy.v2.webp", quality=QUALITY, method=4)
    shutil.copyfile(LAYERS / "Mare.hisea.webp", LAYERS / "Mare.v2.webp")

    # L0 cells with gutter
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "L0").mkdir(parents=True)
    cols, rows = -(-W // CELL), -(-H // CELL)
    padded = cv2.copyMakeBorder(src, GUTTER, GUTTER, GUTTER, GUTTER, cv2.BORDER_REPLICATE)
    recon = np.zeros_like(src)
    decoded = np.zeros_like(src)
    cells = []
    for row in range(rows):
        for col in range(cols):
            x0, y0 = col * CELL, row * CELL
            w, h = min(CELL, W - x0), min(CELL, H - y0)
            tile = padded[y0:y0 + h + 2 * GUTTER, x0:x0 + w + 2 * GUTTER]
            recon[y0:y0 + h, x0:x0 + w] = tile[GUTTER:GUTTER + h, GUTTER:GUTTER + w]
            path = OUT / "L0" / f"{col}_{row}.webp"
            Image.fromarray(tile).save(path, quality=QUALITY, method=4)
            back = np.asarray(Image.open(path).convert("RGB"))
            decoded[y0:y0 + h, x0:x0 + w] = back[GUTTER:GUTTER + h, GUTTER:GUTTER + w]
            cells.append({"col": col, "row": row, "w": w, "h": h})
    assert np.array_equal(recon, src), "tile re-assembly differs from the source"
    seam = np.zeros((H, W), bool)
    seam[:, [c * CELL + d for c in range(1, cols) for d in (-1, 0)]] = True
    seam[[r * CELL + d for r in range(1, rows) for d in (-1, 0)], :] = True
    err = np.abs(decoded.astype(int) - src.astype(int)).max(-1)
    print(f"tiles: {cols}x{rows} = {len(cells)} cells · encoding error mean {err.mean():.2f}, on seam rows/cols max {err[seam].max()} (tol {SEAM_TOL})")
    assert err[seam].max() <= SEAM_TOL * 4, "seam rows drift too far from the source after encoding"

    (OUT / "tiles.json").write_text(json.dumps({
        "version": 1,
        "source": src_path.name,
        "sourceSha256": hashlib.sha256(src_path.read_bytes()).hexdigest(),
        "world": {"width": W // 2, "height": H // 2},
        "levels": [{"id": "L0", "width": W, "height": H, "worldPerTexel": 0.5, "cell": CELL, "gutter": GUTTER,
                    "cols": cols, "rows": rows, "path": "L0/{col}_{row}.webp", "cells": cells}],
    }, indent=1))
    print(f"wrote {OUT}/tiles.json, base_flat.nocanopy.v2.webp, {len(manifest['pack']['canopyLayers'])} x (.canopy.v2, .canopy.v2hi), Mare.v2.webp")


if __name__ == "__main__":
    main()
