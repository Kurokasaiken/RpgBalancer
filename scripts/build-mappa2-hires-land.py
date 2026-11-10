#!/usr/bin/env python3
"""PLAN-115 F1.1 — hi-res land for /game that keeps the APPROVED look (2026-11-10).

The upscaled painting `layers/base_flat.hi.webp` (5504x3072, R-298) is NOT used as is: its colours drift from the
approved canopy-free base and it invents a few objects. Only its HIGH-FREQUENCY band — the detail a 2752 image cannot
hold — is transferred onto the approved 2752 images enlarged x2:

    band  = hi - up(down(hi))                       (down = area average, up = Lanczos x2)
    out   = clip(up(approved) + band)               -> down(out) ~= approved: overview stays the approved map

Outputs (`public/assets/world/mappa2/base/layers/`):
  base_flat.nocanopy.hi.webp        canopy-free land at 5504; under the canopy cut-outs (dilated by the sway reach)
                                    the band is zeroed (the hi painting has trees there, the approved base has ground)
  forest_canopy_NN.canopy.hi.webp   the 40 canopy cut-outs at 2x: up(cut-out) + band, alpha = up(cut-out alpha)
  base_flat.nocanopy.hi.seahi.webp  preview for decision D2(b) only: the sea taken from the raw hi painting
                                    (the runtime then hides `Mare.webp`)
  base_flat.nocanopy.hiraw.webp     preview for decision D1: the RAW hi painting on the land (sharper, its own
  forest_canopy_NN.canopy.hiraw.webp  colours and invented objects); canopy cut-outs cut from the raw painting
  base_flat.nocanopy.hiraw.seahi.webp  RULED 2026-11-10 (D1 = raw hi land, D2 = hi sea): raw hi land + raw hi sea
  Mare.hisea.webp                   the hi sea at 2752 with Mare's alpha: drawn only while the seabed reveal is
                                    active, so the drag reveal still thins a painted sea of the same colours

`--zero-band x,y,w,h` (repeatable, world px of the 2752 map) removes the transferred detail inside a rectangle —
the D1 patch for invented objects once the Director picks them.
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PACK = Path("public/assets/world/mappa2/base")
LAYERS = PACK / "layers"
SWAY_REACH_HI = 10  # canopy sway 2.2 world px (x boost 2) -> ~9 hi px, plus 1 for the filter


def rgb(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32)


def rgba(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)


def up2(a: np.ndarray) -> np.ndarray:
    return cv2.resize(a, (a.shape[1] * 2, a.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)


def down2(a: np.ndarray) -> np.ndarray:
    return cv2.resize(a, (a.shape[1] // 2, a.shape[0] // 2), interpolation=cv2.INTER_AREA)


def save(a: np.ndarray, path: Path, mode: str = "RGB") -> None:
    Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8), mode).save(path, quality=95, method=4)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--zero-band", action="append", default=[], help="x,y,w,h in 2752 world px")
    ap.add_argument("--clean-ssim", type=float, default=None,
                    help="D1(b) automatic: keep the hi detail only where the hi painting's structure agrees with the approved base "
                         "(local luma SSIM dissimilarity below the threshold); writes the '.hiclean' set")
    args = ap.parse_args()

    hi = rgb(LAYERS / "base_flat.hi.webp")
    nc = rgb(LAYERS / "base_flat.nocanopy.webp")
    assert hi.shape[:2] == (nc.shape[0] * 2, nc.shape[1] * 2), (hi.shape, nc.shape)
    band = hi - up2(down2(hi))
    suffix = ".hi"
    if args.clean_ssim is not None:
        suffix = ".hiclean"
        base = rgb(LAYERS / "base_flat.webp")  # what the hi painting was upscaled from (with canopies)
        luma = lambda a: a @ np.array([0.299, 0.587, 0.114], np.float32)
        x, y = luma(down2(hi)), luma(base)
        g = lambda a: cv2.GaussianBlur(a, (0, 0), 3)
        mx, my = g(x), g(y)
        vx, vy, cxy = g(x * x) - mx * mx, g(y * y) - my * my, g(x * y) - mx * my
        c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
        ssim = ((2 * mx * my + c1) * (2 * cxy + c2)) / ((mx * mx + my * my + c1) * (vx + vy + c2))
        changed = cv2.GaussianBlur(np.clip(1 - ssim, 0, 2), (0, 0), 2) > args.clean_ssim
        changed = cv2.dilate(changed.astype(np.uint8), np.ones((5, 5), np.uint8))
        agree = 1 - cv2.GaussianBlur(up2(changed.astype(np.float32)), (0, 0), 3)
        band *= np.clip(agree, 0, 1)[..., None]
        print(f"clean: hi detail suppressed on {changed.mean() * 100:.1f}% of the map (structure differs from the approved base)")
    for spec in args.zero_band:
        x, y, w, h = (int(v) for v in spec.split(","))
        band[2 * y:2 * (y + h), 2 * x:2 * (x + w)] = 0

    manifest = json.loads((PACK / "manifest.json").read_text())
    canopy_alpha = np.zeros(nc.shape[:2], np.float32)
    cutouts = []
    for layer in manifest["pack"]["canopyLayers"]:
        r = layer["rect"]
        stem = layer["file"].replace(".webp", "")
        cut = rgba(LAYERS / f"{stem}.canopy.webp")
        assert cut.shape[:2] == (r["height"], r["width"]), (stem, cut.shape, r)
        sl = (slice(r["y"], r["y"] + r["height"]), slice(r["x"], r["x"] + r["width"]))
        canopy_alpha[sl] = np.maximum(canopy_alpha[sl], cut[..., 3] / 255)
        cutouts.append((stem, r, cut))

    # canopy-free land: no transferred detail under the cut-outs (the hi painting has trees there)
    under = cv2.dilate((up2(canopy_alpha) > 0.02).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * SWAY_REACH_HI + 1,) * 2))
    keep = 1 - cv2.GaussianBlur(under.astype(np.float32), (0, 0), 2.0)
    land = up2(nc) + band * keep[..., None]
    save(land, LAYERS / f"base_flat.nocanopy{suffix}.webp")

    for stem, r, cut in cutouts:
        sl = (slice(2 * r["y"], 2 * (r["y"] + r["height"])), slice(2 * r["x"], 2 * (r["x"] + r["width"])))
        c_rgb = up2(np.ascontiguousarray(cut[..., :3])) + band[sl]
        c_a = np.clip(up2(np.ascontiguousarray(cut[..., 3])), 0, 255)
        save(np.dstack([np.clip(c_rgb, 0, 255), c_a]), LAYERS / f"{stem}.canopy{suffix}.webp", "RGBA")
    if suffix != ".hi":
        print(f"wrote base_flat.nocanopy{suffix}.webp + {len(cutouts)} cut-outs")
        return

    # D1 preview: the raw hi painting on the land (ground under the cut-outs from the approved base enlarged)
    raw_land = hi * keep[..., None] + up2(nc) * (1 - keep[..., None])
    save(raw_land, LAYERS / "base_flat.nocanopy.hiraw.webp")
    for stem, r, cut in cutouts:
        sl = (slice(2 * r["y"], 2 * (r["y"] + r["height"])), slice(2 * r["x"], 2 * (r["x"] + r["width"])))
        c_a = np.clip(up2(np.ascontiguousarray(cut[..., 3])), 0, 255)
        save(np.dstack([hi[sl], c_a]), LAYERS / f"{stem}.canopy.hiraw.webp", "RGBA")

    # D1 = raw land, D2 = hi sea (Director 2026-11-10): the ruled base, and the reveal-only sea layer
    mare_rgba = rgba(LAYERS / "Mare.webp")
    sea_hi = cv2.GaussianBlur(up2(mare_rgba[..., 3] / 255), (0, 0), 1.5)[..., None]
    save(raw_land * (1 - sea_hi) + hi * sea_hi, LAYERS / "base_flat.nocanopy.hiraw.seahi.webp")
    save(np.dstack([np.clip(down2(hi), 0, 255), mare_rgba[..., 3]]), LAYERS / "Mare.hisea.webp", "RGBA")

    # D2(b) preview: raw hi painting on the sea (Mare.webp hidden at runtime)
    mare_a = rgba(LAYERS / "Mare.webp")[..., 3] / 255
    sea = cv2.GaussianBlur(up2(mare_a), (0, 0), 1.5)[..., None]
    save(land * (1 - sea) + hi * sea, LAYERS / "base_flat.nocanopy.hi.seahi.webp")

    # check: the overview (area-downsampled) is the approved base outside the canopy cut-outs
    back = down2(np.clip(land, 0, 255))
    outside = canopy_alpha < 0.01
    d = np.abs(back - nc).max(-1)[outside]
    print(f"overview check vs approved nocanopy (outside canopies): mean {d.mean():.2f}, p99 {np.percentile(d, 99):.0f}, max {d.max():.0f} levels")
    print(f"wrote base_flat.nocanopy.hi.webp, {len(cutouts)} canopy .hi cut-outs, base_flat.nocanopy.hi.seahi.webp")


if __name__ == "__main__":
    main()
