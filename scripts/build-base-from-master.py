"""Rebuild `base_flat.webp` from the uncut master painting, at its native resolution.

Why
---
`flatten-world-layers.py` composites the 19 cut-out layers. Their dilated, anti-aliased silhouettes overlap, so the
composite carries faint outlines along every old cut ("le linee tra le zone", R-194) — baked in, unfixable at runtime.
It was also 3072x2049, stretched to the 4240x2828 world canvas.

The master the PSD was built from (`assets-source/.../source/master/map-finale-full-4240.png`, 4240x2828, frame and
painted clouds included) is pixel-aligned with that composite. This takes its RGB and keeps ONLY the land: the alpha is
the composite's own land mask, so everything that sits around it (the painted sea layer, the islands, frame, clouds)
lines up exactly as before.

Then run, in order:
    python3 scripts/bake-map-grade.py --only base_flat.webp   # base_flat.graded.webp only
    python3 scripts/build-canopy.py       # canopies + *.nocanopy.webp for both variants

Usage: python3 scripts/build-base-from-master.py [--mask-from path/to/old_base_flat.webp]
"""
import argparse
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
MASTER = os.path.join(ROOT, 'assets-source', 'world', 'wanderlust', 'base', 'source', 'master', 'map-finale-full-4240.png')
LAYERS = os.path.join(ROOT, 'public', 'assets', 'world', 'wanderlust', 'base', 'layers')
OUT = os.path.join(LAYERS, 'base_flat.webp')


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    # Defaults to the current base_flat: re-running keeps the same land mask (already at master size).
    ap.add_argument('--mask-from', default=OUT)
    args = ap.parse_args()

    master = Image.open(MASTER).convert('RGB')
    mask = Image.open(args.mask_from).getchannel('A')
    if mask.size != master.size:
        mask = mask.resize(master.size, Image.BILINEAR)
    out = master.copy()
    out.putalpha(mask)
    out.save(OUT, 'WEBP', quality=92, method=6)
    print(f'wrote {OUT} {out.size}, {os.path.getsize(OUT) / 1024 / 1024:.2f} MB')


if __name__ == '__main__':
    main()
