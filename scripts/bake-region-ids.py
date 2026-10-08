"""Bake the clickable-regions id map of the flat world map.

One 8-bit PNG (`public/assets/world/wanderlust/base/region_ids.png`, 0 = sea) plus `regions.json`
(label key, centroid and bounds as fractions of the canvas), instead of one sprite per region.
The painted layers' alpha is the footprint of each feature; every land pixel then takes the region of the
nearest footprint (jump flooding), except open ground far from any feature, which is the meadows.

Usage: python3 scripts/bake-region-ids.py
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'world', 'wanderlust', 'base')
LAYERS = os.path.join(ROOT, 'layers')
LAND_MASK = os.path.join(ROOT, '..', '..', '..', 'atmosphere', 'terrain', 'land_mask.webp')

SOURCE = (3072, 2049)  # the painted layers' own size; the map stretches it over the canvas
OUT = (1536, 1025)
MEADOW_DISTANCE = 34  # px at OUT size beyond which land belongs to no feature

# id -> (layer ids that make it up, in paint priority: later wins on overlap)
REGIONS = [
    ('northern_forest', ['forest_1_top_left', 'forest_1_light_top_left', 'forest_dark_north']),
    ('southern_forest', ['forest_2_dark_bottom_left', 'forest_3_dark_bottom', 'small_trees_center']),
    ('eastern_woods', ['forest_light_right_center', 'trees_center_right']),
    ('northern_peaks', ['mountain_zone_north']),
    ('eastern_mountains', ['mountains_dark_right', 'trees_brown_hills_center']),
    ('southern_mountains', ['mountains_dark_bottom', 'mountains_light_bottom_right']),
    ('islands', ['island_bottom_left', 'island_bottom_right', 'mountain_island_bottom_left']),
    ('village', ['village']),
]
MEADOWS = 'meadows'


def flood_nearest(seed_ids: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Jump flooding: for every pixel the id and distance to the nearest non-zero seed."""
    h, w = seed_ids.shape
    ys, xs = np.mgrid[0:h, 0:w]
    sx = np.where(seed_ids > 0, xs, -1)
    sy = np.where(seed_ids > 0, ys, -1)
    step = 1 << (max(h, w).bit_length() - 1)
    while step >= 1:
        for dy in (-step, 0, step):
            for dx in (-step, 0, step):
                if dx == 0 and dy == 0:
                    continue
                cx = np.roll(sx, (dy, dx), axis=(0, 1))
                cy = np.roll(sy, (dy, dx), axis=(0, 1))
                valid = cx >= 0
                new = np.where(valid, (cx - xs) ** 2 + (cy - ys) ** 2, np.inf)
                old = np.where(sx >= 0, (sx - xs) ** 2 + (sy - ys) ** 2, np.inf)
                better = new < old
                sx = np.where(better, cx, sx)
                sy = np.where(better, cy, sy)
        step //= 2
    safe_x = np.clip(sx, 0, w - 1)
    safe_y = np.clip(sy, 0, h - 1)
    nearest = np.where(sx >= 0, seed_ids[safe_y, safe_x], 0)
    dist = np.where(sx >= 0, np.sqrt((sx - xs) ** 2 + (sy - ys) ** 2), np.inf)
    return nearest, dist


def main() -> None:
    manifest = json.load(open(os.path.join(ROOT, 'manifest.json')))
    layers = {l['id']: l for l in manifest['surfaceLayers']}
    sx, sy = OUT[0] / SOURCE[0], OUT[1] / SOURCE[1]

    seeds = np.zeros((OUT[1], OUT[0]), dtype=np.uint8)
    for index, (_, layer_ids) in enumerate(REGIONS, start=1):
        for layer_id in layer_ids:
            layer = layers[layer_id]
            rect = layer['rect']
            image = Image.open(os.path.join(LAYERS, layer['file'])).convert('RGBA')
            w, h = max(1, round(rect['width'] * sx)), max(1, round(rect['height'] * sy))
            alpha = np.array(image.resize((w, h), Image.LANCZOS).getchannel('A')) > 40
            x0, y0 = round(rect['x'] * sx), round(rect['y'] * sy)
            view = seeds[y0:y0 + h, x0:x0 + w]
            view[alpha[: view.shape[0], : view.shape[1]]] = index

    land = np.array(Image.open(LAND_MASK).convert('RGBA').getchannel('A').resize(OUT, Image.LANCZOS)) > 100
    nearest, dist = flood_nearest(seeds)
    meadow_id = len(REGIONS) + 1
    ids = np.where(land, np.where(dist > MEADOW_DISTANCE, meadow_id, nearest), 0).astype(np.uint8)
    ids = np.where(land & (seeds > 0), seeds, ids).astype(np.uint8)

    Image.fromarray(ids, mode='L').save(os.path.join(ROOT, 'region_ids.png'), optimize=True)

    names = [r[0] for r in REGIONS] + [MEADOWS]
    regions = []
    for index, name in enumerate(names, start=1):
        yy, xx = np.nonzero(ids == index)
        if len(xx) == 0:
            continue
        regions.append({
            'id': name,
            'index': index,
            'nameKey': f'world.region.{name}',
            'center': [round(float(xx.mean()) / OUT[0], 4), round(float(yy.mean()) / OUT[1], 4)],
            'bounds': [round(xx.min() / OUT[0], 4), round(yy.min() / OUT[1], 4), round((xx.max() + 1) / OUT[0], 4), round((yy.max() + 1) / OUT[1], 4)],
            'areaFraction': round(len(xx) / ids.size, 4),
        })
    json.dump({'size': list(OUT), 'regions': regions}, open(os.path.join(ROOT, 'regions.json'), 'w'), indent=2)
    print({r['id']: r['areaFraction'] for r in regions})


if __name__ == '__main__':
    main()
