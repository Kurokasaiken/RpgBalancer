"""Cut the islands out of their baked sea halo.

`Isola basso sinistra` / `Isola basso a destra` were exported with a large opaque blob of grey-blue sea (and its
coast strokes) around the land, so on the live map each island sits in a pale rounded patch that the sea animation
cannot reach. Keep only: the land (warm pixels), and the dark coast strokes close to it; everything else becomes
transparent, with a soft 2 px edge.

Usage: python3 scripts/cut-islands.py   (run once; originals are in git history)
"""
import os

import numpy as np
from PIL import Image

LAYERS = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'world', 'wanderlust', 'base', 'layers')
NAMES = ['Isola basso sinistra', 'Isola basso a destra']
STROKE_REACH_PX = 10


def dilate(mask: np.ndarray, steps: int) -> np.ndarray:
    m = mask.copy()
    for _ in range(steps):
        n = m.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n |= np.roll(m, (dy, dx), axis=(0, 1))
        m = n
    return m


def blur3(x: np.ndarray, times: int = 2) -> np.ndarray:
    x = x.astype(np.float32)
    for _ in range(times):
        acc = x.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy or dx:
                    acc += np.roll(x, (dy, dx), axis=(0, 1))
        x = acc / 9.0
    return x


for name in NAMES:
    for variant in (f'{name}.webp', f'{name}.graded.webp'):
        path = os.path.join(LAYERS, variant)
        if not os.path.exists(path):
            continue
        a = np.array(Image.open(path).convert('RGBA')).astype(np.int32)
        r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        solid = al > 200
        land = solid & (r > b + 12)
        dark = solid & (lum < 100)
        keep = land | (dark & dilate(land, STROKE_REACH_PX))
        # Close pinholes inside the land so no sea-coloured speckle shows through it.
        keep = dilate(keep, 1)
        soft = blur3(keep, 2)
        out = a.copy()
        out[..., 3] = np.clip(soft * 255, 0, 255).astype(np.int32)
        Image.fromarray(out.astype(np.uint8), 'RGBA').save(path, quality=94, method=6)
        print('cut', variant, 'kept', round(float(keep.mean()), 3))
