"""Close the holes the old island blobs left in the painted sea.

`Mare.webp` was cut where the islands' baked sea blobs sat. Once the islands are cut to their land
(`scripts/cut-islands.py`), the leftover hole showed the darker base painting as an oval around each island.
Inside each island rect, wherever the sea is missing and the island is not land, the sea takes the colour of the
surrounding water and becomes opaque. Re-run `node scripts/build-terrain-masks.mjs` afterwards (the masks are
derived from the sea and island alpha).

Only the old blob is filled: pass the pre-cut island layers (git history) as BLOB_DIR, so the mainland's own
hole in the sea is never touched.

Usage: BLOB_DIR=<dir with the uncut island webps> python3 scripts/fill-sea-under-islands.py
"""
import json
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'world', 'wanderlust', 'base')
LAYERS = os.path.join(ROOT, 'layers')
ISLANDS = {'island_bottom_left', 'island_bottom_right'}
FEATHER_PX = 40
BLOB_DIR = os.environ['BLOB_DIR']


def bleed(rgb, known, steps):
    rgb = rgb.astype(np.float32).copy()
    known = known.copy()
    for _ in range(steps):
        acc = np.zeros_like(rgb)
        cnt = np.zeros(known.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            k = np.roll(known, (dy, dx), axis=(0, 1))
            acc += np.roll(rgb, (dy, dx), axis=(0, 1)) * k[..., None]
            cnt += k
        fill = (~known) & (cnt > 0)
        rgb[fill] = acc[fill] / cnt[fill][..., None]
        known |= fill
        if known.all():
            break
    return rgb


manifest = json.load(open(os.path.join(ROOT, 'manifest.json')))
rects = {l['id']: (l['file'], l['rect']) for l in manifest['surfaceLayers'] if l['id'] in ISLANDS}
for sea_name in ('Mare.webp', 'Mare.graded.webp'):
    sea_path = os.path.join(LAYERS, sea_name)
    sea = np.array(Image.open(sea_path).convert('RGBA')).astype(np.int32)
    for island_id, (file, r) in rects.items():
        isl = np.array(Image.open(os.path.join(LAYERS, file)).convert('RGBA'))[..., 3].astype(np.int32)
        x, y, w, h = r['x'], r['y'], r['width'], r['height']
        isl = np.array(Image.fromarray(isl.astype(np.uint8)).resize((w, h)), dtype=np.int32)
        blob = np.array(Image.open(os.path.join(BLOB_DIR, file)).convert('RGBA'))[..., 3]
        blob = np.array(Image.fromarray(blob).resize((w, h)), dtype=np.int32)
        pad = 160
        y0, y1, x0, x1 = max(0, y - pad), min(sea.shape[0], y + h + pad), max(0, x - pad), min(sea.shape[1], x + w + pad)
        win = sea[y0:y1, x0:x1].copy()
        island_full = np.zeros(win.shape[:2], np.int32)
        island_full[y - y0:y - y0 + h, x - x0:x - x0 + w] = isl
        blob_full = np.zeros(win.shape[:2], np.int32)
        blob_full[y - y0:y - y0 + h, x - x0:x - x0 + w] = blob
        hole = (win[..., 3] < 250) & (island_full < 200) & (blob_full > 0)
        known = win[..., 3] >= 250
        filled = np.where(hole[..., None], bleed(win[..., :3], known, 260), win[..., :3])
        # The bled colour is flat; blur it and blend a band of the surrounding sea into it, so the filled patch has
        # no edge (the painted water around the islands is lighter, and a hard join drew the old rectangle).
        blurred = np.array(Image.fromarray(np.clip(filled, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(28)), dtype=np.float32)
        band = hole.copy()
        weight = hole.astype(np.float32)
        for step in range(1, FEATHER_PX + 1):
            grown = band.copy()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                grown |= np.roll(band, (dy, dx), axis=(0, 1))
            ring = grown & ~band
            weight[ring] = 1.0 - step / (FEATHER_PX + 1)
            band = grown
        weight = weight * (island_full < 200)
        mixed = filled * (1 - weight[..., None]) + blurred * weight[..., None]
        win[..., :3] = np.clip(mixed, 0, 255).astype(np.int32)
        win[..., 3] = np.where(hole, 255, win[..., 3])
        sea[y0:y1, x0:x1] = win
        print(sea_name, island_id, 'filled px', int(hole.sum()))
    Image.fromarray(np.clip(sea, 0, 255).astype(np.uint8), 'RGBA').save(sea_path, quality=92, method=6)
