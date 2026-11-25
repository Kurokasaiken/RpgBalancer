#!/usr/bin/env python3
"""build-stash-frame-clean.py — Gemini clean stash frame -> runtime backing asset.

Pipeline canonica MOCKUP-TO-ASSET-GUIDE (2026-11-25, Director: «fatti rigenerare
le cose in modo pulito da gemini»): il backing dello stash NON si toppeggia —
si rigenera vuoto pulito su navy #0a1622 e si scontorna con flood fill reale.
Niente erase procedurali, niente gradienti numpy sopra artefirmata.

Steps: flood-fill cut from image border (greenish protection, canonical
`cut()` of build-roster-assets.py) -> crop to alpha bbox -> RGBA webp +
grid overlay for zone measurement.

Usage: python3 scripts/hud-real/build-stash-frame-clean.py SRC.png OUT.webp
"""
import sys

import cv2
import numpy as np
from PIL import Image


def cut(path, tol=38):
    rgb = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB)
    bg = np.median(np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3)]), axis=0)
    d = np.abs(rgb.astype(int) - bg).max(axis=2)
    greenish = rgb[:, :, 1].astype(int) - rgb[:, :, 2].astype(int) > 2
    near = ((d < tol) & ~greenish).astype(np.uint8)
    n, lab = cv2.connectedComponents(near, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    outside = np.isin(lab, list(border))
    alpha = (~outside).astype(np.float32)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.7)
    return rgb, alpha


def main() -> None:
    src, out = sys.argv[1], sys.argv[2]
    rgb, alpha = cut(src)
    ys, xs = np.where(alpha > 0.5)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb_c = rgb[y0:y1, x0:x1]
    alpha_c = alpha[y0:y1, x0:x1]
    rgba = np.dstack([rgb_c, (alpha_c * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, 'RGBA')
    im.save(out, 'WEBP', quality=92)
    print(f'cut+crop {rgb.shape[1]}x{rgb.shape[0]} -> {im.size[0]}x{im.size[1]} written {out}')
    # grid overlay every 20px on the opaque composite for zone measurement
    comp = Image.new('RGB', im.size, (24, 22, 18))
    comp.paste(im, (0, 0), im)
    comp2 = comp.resize((im.size[0] * 2, im.size[1] * 2), Image.LANCZOS)
    from PIL import ImageDraw
    dr = ImageDraw.Draw(comp2)
    for gx in range(0, im.size[0] + 1, 20):
        cxp = gx * 2
        dr.line([(cxp, 0), (cxp, comp2.size[1])], fill=(255, 60, 60), width=1)
        if gx % 100 == 0:
            dr.text((cxp + 2, 2), str(gx), fill=(255, 90, 90))
    for gy in range(0, im.size[1] + 1, 20):
        cyp = gy * 2
        dr.line([(0, cyp), (comp2.size[0], cyp)], fill=(255, 60, 60), width=1)
        if gy % 100 == 0:
            dr.text((2, cyp + 2), str(gy), fill=(255, 90, 90))
    grid_out = out.replace('.webp', '-grid.png')
    comp2.save(grid_out)
    print(f'grid overlay {grid_out}')


if __name__ == '__main__':
    main()
