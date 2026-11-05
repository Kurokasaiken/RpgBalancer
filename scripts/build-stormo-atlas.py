#!/usr/bin/env python3
"""PLAN-108 T-001: one-off atlas montage for the stormo flight strip.

Source poses (Director-painted, baptized 2026-10-29):
context/research/2026-10-29-mappa2-sprite-pilot/out/a2-pose-{1..6}.png
(authored strip order 1→2→3→4→5→6; PLAN-108 risk fallback — remounted at
6 poses 2026-11-04 because the 4-frame cycle read choppy). Output:
uniform-cell horizontal atlas
public/assets/world/mappa2/base/fx/fauna/stormo_flight.webp
"""
from PIL import Image
import hashlib, os

SRC_DIR = 'context/research/2026-10-29-mappa2-sprite-pilot/out'
POSES = ['a2-pose-1.png', 'a2-pose-2.png', 'a2-pose-3.png',
         'a2-pose-4.png', 'a2-pose-5.png', 'a2-pose-6.png']
CELL = 400
OUT = 'public/assets/world/mappa2/base/fx/fauna/stormo_flight.webp'

def sha(p):
    return hashlib.sha256(open(p,'rb').read()).hexdigest()

def trim(im):
    """Crop to alpha bbox then re-center inside the cell (kills pose jitter)."""
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

atlas = Image.new('RGBA', (CELL * len(POSES), CELL), (0, 0, 0, 0))
for i, name in enumerate(POSES):
    src = os.path.join(SRC_DIR, name)
    print(f'{name} sha256={sha(src)}')
    im = trim(Image.open(src).convert('RGBA'))
    x = i * CELL + (CELL - im.width) // 2
    y = (CELL - im.height) // 2
    atlas.paste(im, (x, y), im)
atlas.save(OUT, 'WEBP', quality=92, method=6)
print(f'{OUT} {atlas.size} sha256={sha(OUT)}')
