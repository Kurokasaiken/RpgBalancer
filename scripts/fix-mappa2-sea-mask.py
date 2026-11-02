#!/usr/bin/env python3
"""Surgical sea-mask fix for the mappa2 pack (mask-revision 6 intent).

The water classifier in build-mappa2-assets.py floods the HSV-teal class from
the image border: painted snow/glacier and bright forest that touch the sea
are swallowed into `sea`, so every mask-driven effect (coast surf shader,
sea pattern, wave/sea-mark clipping) draws on the peaks. The authored biome
map (`biome_ids.png` + `biomes.json`, kind:"land") knows better — this script
carves `sea ∩ land_biomes` back out and regenerates ONLY the mask-derived
files: sea/land/shallow/foam/coast_distance/land_distance/foam_clean masks
and the alpha of layers/Mare.webp (RGB kept as shipped).

Usage: python3 scripts/fix-mappa2-sea-mask.py [--pack public/assets/world/mappa2/base] [--dry]
"""
from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import json
import numpy as np
from PIL import Image

WORLD_W, WORLD_H = 2752, 1536
D_MAX = 160.0


def save_alpha_mask(mask: np.ndarray, path: Path) -> None:
    rgba = np.dstack([
        np.full(mask.shape, 255, dtype=np.uint8),
        np.full(mask.shape, 255, dtype=np.uint8),
        np.full(mask.shape, 255, dtype=np.uint8),
        np.clip(mask, 0, 255).astype(np.uint8),
    ])
    Image.fromarray(rgba, "RGBA").save(path, quality=90, alpha_quality=100, method=4)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pack", default="public/assets/world/mappa2/base")
    ap.add_argument("--dry", action="store_true", help="compute and report, write nothing")
    args = ap.parse_args()
    pack = Path(args.pack)

    rgb = np.array(Image.open(pack / "layers" / "base_flat.webp").convert("RGB"))
    if rgb.shape[:2] != (WORLD_H, WORLD_W):
        raise SystemExit("base_flat is not the world canvas")

    # ── reproduce the pipeline's water class + border-connected sea ──
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = cv2.split(hsv)
    water = ((h >= 76) & (h <= 116) & (s >= 32) & (v >= 28)).astype(np.uint8) * 255
    water = cv2.morphologyEx(water, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    water = cv2.morphologyEx(water, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    count, labels = cv2.connectedComponents(water, connectivity=8)
    border_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    sea_raw = np.isin(labels, border_labels[border_labels > 0])
    internal_water = (water > 0) & ~sea_raw

    # sanity: the reproduction must match the shipped sea_mask before carving
    shipped_sea = np.array(Image.open(pack / "masks" / "sea_mask.webp").getchannel("A")) > 128
    # Invariant: shipped sea must be a subset of the raw class (minus edge wobble).
    # The other direction (raw minus shipped) is exactly the previous carve.
    over = int((shipped_sea & ~sea_raw).sum())
    print(f"shipped sea outside raw class: {over} px (edge wobble expected)")
    if over > 60000:
        raise SystemExit("reproduction diverges from the shipped mask — aborting instead of corrupting the pack")

    # ── carve authored land biomes out of the sea partition ──
    biome_ids = np.array(Image.open(pack / "biome_ids.png").convert("L"))
    biomes = json.loads((pack / "biomes.json").read_text(encoding="utf-8"))["biomes"]
    land_idx = [b["index"] for b in biomes if b.get("kind") == "land"]
    land_area = np.isin(biome_ids, land_idx)
    fake_sea = sea_raw & land_area
    sea = sea_raw & ~fake_sea
    # Second pass: the carve itself fragments the sea — pockets of fake water
    # inside sea-kind biomes (the peak tips) get stranded fully landlocked.
    # A real sea reach keeps a water path to the border; drop what doesn't.
    sea_n, sea_lab = cv2.connectedComponents(sea.astype(np.uint8), connectivity=8)
    sea_bl = np.unique(np.concatenate([sea_lab[0], sea_lab[-1], sea_lab[:, 0], sea_lab[:, -1]]))
    stranded = sea & ~np.isin(sea_lab, sea_bl[sea_bl > 0])
    sea &= ~stranded
    fake_sea |= stranded
    internal_water = internal_water & ~fake_sea
    land = ~(sea | internal_water)
    print(f"carved {int(fake_sea.sum())} px of swallowed land out of sea ({fake_sea.sum() / sea_raw.sum() * 100:.1f}% of old sea)")
    for b in biomes:
        if b.get("kind") == "land":
            n = int((fake_sea & (biome_ids == b["index"])).sum())
            if n:
                print(f"  {b['id']}: {n} px")

    # ── re-derive every mask that descends from `sea` ──
    sea_u8 = sea.astype(np.uint8)
    coast_px = cv2.distanceTransform(sea_u8, cv2.DIST_L2, 5)
    land_px = cv2.distanceTransform((~sea).astype(np.uint8), cv2.DIST_L2, 5)
    shallow = np.clip(np.exp(-coast_px / 45.0) * 255, 0, 255).astype(np.uint8)
    shallow[~sea] = 0
    foam = (sea & (coast_px <= 20)).astype(np.uint8) * 255
    sea_near = cv2.dilate(sea_u8, np.ones((9, 9), np.uint8)) > 0
    painted_white = (rgb.min(axis=2) >= 182) & sea_near & (coast_px <= 70)
    painted_white = cv2.morphologyEx(painted_white.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    surf = np.clip(cv2.GaussianBlur(painted_white.astype(np.float32), (0, 0), 7.0) * 3.2, 0, 1)
    # painted surf recede plate (same recipe as the pipeline's foam_clean)
    # Bright AND not warm: beach sand passes the brightness test too, and plating it read as cyan blobs with a
    # dark rim on every beach (Director 2026-11-02, «macchie di sporco»). Painted surf is white-to-cyan (B >= R).
    # rock FOOT only: sea straight below (within 25 px) and rock on both sides — the side silhouettes of
    # a cliff have sea below them too in this top-down-angled painting, and their bright rim became a line
    sea_u = sea.astype(np.uint8)
    below = np.zeros_like(sea)
    for k in range(1, 26):
        below[:-k] |= sea[k:]
    landish = ~sea
    sides = np.zeros_like(sea)
    sides[:, 8:-8] = landish[:, :-16] & landish[:, 16:]
    rock_foot = ~sea & (land_px <= 25) & below & sides
    # ...and the surf painted ON the rock foot (within 25 px of the sea): left unplated it stayed white
    # forever while the waves came and went beside it (Director 2026-11-02, «bianco sempre disegnato»).
    foam_px = ((rgb.min(axis=2) >= 168) & (rgb[..., 2].astype(np.int16) - rgb[..., 0] >= -12)
               & ((sea_near & (coast_px <= 70)) | rock_foot))
    foam_px = cv2.dilate(foam_px.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0
    # Fill the foam footprint from its nearest non-foam neighbours (water, sand, rock alike), smallest scale
    # first: a normalised convolution cascade. A blur of "clearly water" fell back to deep-sea blue at the
    # shore (blue streak on beaches); cv2.inpaint smeared streaks and rock blobs across wide footprints
    # (Director 2026-11-02, «macchie di sporco», grey smear at the rock feet).
    hole = cv2.dilate(foam_px.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    valid = (~hole & (rgb.min(axis=2) < 168)).astype(np.float32)
    rgbf = rgb.astype(np.float32)
    fill = rgbf.copy()
    todo = hole.copy()
    for sigma in (3.0, 6.0, 12.0, 24.0, 48.0):
        den = cv2.GaussianBlur(valid, (0, 0), sigma)
        num = cv2.GaussianBlur(rgbf * valid[..., None], (0, 0), sigma)
        ok = todo & (den > 0.15)
        fill[ok] = num[ok] / den[ok][:, None]
        todo &= ~ok
    foam_a = np.clip(cv2.GaussianBlur(foam_px.astype(np.float32), (0, 0), 1.6) * 1.25, 0, 1)

    masks_dir = pack / "masks"
    if args.dry:
        print("dry run — nothing written")
        return
    save_alpha_mask((sea.astype(np.uint8) * 255), masks_dir / "sea_mask.webp")
    save_alpha_mask((land.astype(np.uint8) * 255), masks_dir / "land_mask.webp")
    save_alpha_mask(shallow, masks_dir / "shallow_mask.webp")
    save_alpha_mask(foam, masks_dir / "foam_mask.webp")
    Image.fromarray(np.dstack([
        (np.clip(coast_px / D_MAX, 0, 1) * 255).astype(np.uint8),
        (sea_u8 * 255),
        (surf * 255).astype(np.uint8),
    ]), "RGB").save(masks_dir / "coast_distance.webp", lossless=True, method=4)
    # land_distance: R = distance into land, G = land mask, B kept from the shipped file
    old_ld = np.array(Image.open(masks_dir / "land_distance.webp"))
    Image.fromarray(np.dstack([
        (np.clip(land_px / D_MAX, 0, 1) * 255).astype(np.uint8),
        (land.astype(np.uint8) * 255),
        old_ld[..., 2],
    ]), "RGB").save(masks_dir / "land_distance.webp", lossless=True, method=4)
    rgba_clean = np.dstack([np.clip(fill, 0, 255).astype(np.uint8), (foam_a * 255).astype(np.uint8)]).astype(np.uint8)
    Image.fromarray(rgba_clean, "RGBA").save(masks_dir / "foam_clean.webp", lossless=True, quality=100, method=4)
    # Mare.webp: same RGB, new alpha (the sea partition)
    mare = np.array(Image.open(pack / "layers" / "Mare.webp").convert("RGBA"))
    mare[..., 3] = sea_u8 * 255
    Image.fromarray(mare, "RGBA").save(pack / "layers" / "Mare.webp", quality=94, method=4)
    print("masks + Mare.webp rewritten")


if __name__ == "__main__":
    main()
