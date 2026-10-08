"""Make the outer rim of the sea layer opaque.

The painted sea fades to ~50% alpha over its outermost pixels. With nothing opaque under it (base_flat is
transparent at the edges), the lighter stage colour showed through as a thin bright rectangle around the
original canvas once the sea was mirrored outwards. The rim takes the colour and alpha of the first row/column
inside it.

Usage: python3 scripts/fix-sea-edges.py
"""
import os

import numpy as np
from PIL import Image

LAYERS = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'world', 'wanderlust', 'base', 'layers')
RIM = 6

for name in ('Mare.webp', 'Mare.graded.webp'):
    path = os.path.join(LAYERS, name)
    a = np.array(Image.open(path).convert('RGBA'))
    a[:RIM] = a[RIM]
    a[-RIM:] = a[-RIM - 1]
    a[:, :RIM] = a[:, RIM : RIM + 1]
    a[:, -RIM:] = a[:, -RIM - 1 : -RIM]
    Image.fromarray(a).save(path, quality=92, method=6)
    print(name, 'rim alpha min', int(a[[0, -1], :, 3].min()), int(a[:, [0, -1], 3].min()))
