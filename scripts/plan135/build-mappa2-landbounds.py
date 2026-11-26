#!/usr/bin/env python3
"""Derive the main-continent bbox from Mare.v2.webp alpha and write the frozen JSON measurement."""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/world/mappa2/base/layers/Mare.v2.webp'
OUT = ROOT / 'src/ui/idleVillage/config/mappa2FitMeasurements.json'

image = np.array(Image.open(SRC))
# In Mare.v2.webp alpha 255 is painted sea and alpha 0 is land/foreground.
land = (image[..., 3] == 0).astype('uint8')
count, _labels, stats, _centroids = cv2.connectedComponentsWithStats(land, connectivity=8)
if count < 2:
    raise SystemExit('no land component found')
main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
x, y, w, h, area = [int(v) for v in stats[main]]
payload = {
    'source': 'public/assets/world/mappa2/base/layers/Mare.v2.webp',
    'method': 'alpha==0 land mask, 8-connected components, largest component',
    'canvas': {'width': int(image.shape[1]), 'height': int(image.shape[0])},
    'landBounds': {'x0': x, 'y0': y, 'x1': x + w - 1, 'y1': y + h - 1},
    'mainComponentAreaPx': area,
}
OUT.write_text(json.dumps(payload, indent=2) + '\n')
print(json.dumps(payload))
