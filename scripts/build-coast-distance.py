#!/usr/bin/env python3
"""
Bake the distance-to-coast field the coastal foam shader reads.

Input : public/assets/atmosphere/terrain/sea_mask.webp  (alpha > 128 = open water)
Output: public/assets/atmosphere/terrain/coast_distance.webp (lossless, 2048 px long edge)
  R = distance from the shore, in WORLD px, 0..D_MAX mapped to 0..255
  G = 255 over water, 0 over land (so the shader can cut foam off at the shoreline)

Only the largest landmass counts as shore. Islets are painted over and flagged as land, but
nothing measures distance from them, so no crests form around them.

Run with any Python that has numpy, scipy and pillow:  python3 scripts/build-coast-distance.py
"""
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, label

WORLD_W, WORLD_H = 4240, 2828
OUT_LONG_EDGE = 2048
D_MAX = 160.0  # world px; must match uDMax in WorldSurfaceCoastFoam.tsx
SRC = 'public/assets/atmosphere/terrain/sea_mask.webp'
DST = 'public/assets/atmosphere/terrain/coast_distance.webp'

alpha = np.array(Image.open(SRC).convert('RGBA'))[..., 3]
sea = alpha > 128
world_per_px = WORLD_W / sea.shape[1]
land_labels, land_count = label(~sea)
sizes = np.bincount(land_labels.ravel())[1:]
mainland = (land_labels == (np.argmax(sizes) + 1))
for i, size in enumerate(sizes, start=1):
    ys, xs = np.where(land_labels == i)
    print(f'  landmass {i}: {size} px, x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()}' + ('  <- shore' if i == np.argmax(sizes) + 1 else '  (islet, no crests)'))
# Distance is measured to the mainland only: islets look like water to the transform.
dist_world = distance_transform_edt(~mainland) * world_per_px

r = np.clip(dist_world / D_MAX, 0, 1) * 255
g = sea.astype(np.float32) * 255
out_w = OUT_LONG_EDGE
out_h = round(WORLD_H * OUT_LONG_EDGE / WORLD_W)
rgb = np.stack([r, g, np.zeros_like(r)], axis=-1).astype(np.uint8)
Image.fromarray(rgb, 'RGB').resize((out_w, out_h), Image.LANCZOS).save(DST, lossless=True, method=6)
print(f'wrote {DST} {out_w}x{out_h}; sea fraction {sea.mean():.3f}; max distance {dist_world.max():.0f} world px')
