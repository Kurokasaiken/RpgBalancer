#!/usr/bin/env python3
"""One-off generator for the `sea_arch` seaPatch (Director 2026-10-30).

The painted surf around the west-rim sea arch and stacks animates with the
same flow-pose recipe as `bay_2`/`delta_sea` (PLAN-095): painted cinemagraph
poses written to `fx/water/sea_arch_f*.webp` and a `seaPatches` entry upserted
into `secondary-water.json`. Mirrors the block added to
`build-mappa2-assets.py` so a full pack regen reproduces the same patch.
"""
import importlib.util
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PACK = Path("public/assets/world/mappa2/base")

spec = importlib.util.spec_from_file_location("bma", Path(__file__).parent / "build-mappa2-assets.py")
bma = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bma)


def main() -> None:
    rgb = np.array(Image.open(PACK / "layers" / "base_flat.webp").convert("RGB"))
    sea = np.array(Image.open(PACK / "masks" / "sea_mask.webp"))[:, :, 3] > 0

    hsv_img = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    teal_m = (hsv_img[..., 0] >= 70) & (hsv_img[..., 0] <= 105) & (hsv_img[..., 1] >= 80) & (hsv_img[..., 2] >= 70)

    land_dist = cv2.distanceTransform(sea.astype(np.uint8), cv2.DIST_L2, 5)
    gy_l, gx_l = np.gradient(cv2.GaussianBlur(land_dist, (0, 0), 8.0))
    away_shore = np.dstack([gx_l, gy_l]).astype(np.float32)
    away_shore /= np.maximum(1e-6, np.linalg.norm(away_shore, axis=2, keepdims=True))

    arch_box = np.zeros_like(sea)
    arch_box[350:800, 0:560] = True
    arch = sea & (land_dist <= 90) & arch_box & teal_m
    print(f"sea_arch mask px: {int(arch.sum())}")
    if arch.sum() <= 2000:
        raise SystemExit("sea_arch mask too small")

    poses = bma.build_water_flow_poses(rgb, arch, away_shore, 26.0, PACK / "fx" / "water", "sea_arch", seed=996, flow_whole=True, foam_pulse=0.5)
    if not poses:
        raise SystemExit("no poses generated")
    print("poses:", poses["rect"])

    sw_path = PACK / "secondary-water.json"
    sw = json.loads(sw_path.read_text())
    patches = [p for p in sw.get("seaPatches", []) if p["id"] != "sea_arch"]
    patches.append({"id": "sea_arch", "flowPoses": poses})
    sw["seaPatches"] = patches
    sw_path.write_text(json.dumps(sw, indent=2), encoding="utf-8")
    print("secondary-water.json updated")


if __name__ == "__main__":
    main()
