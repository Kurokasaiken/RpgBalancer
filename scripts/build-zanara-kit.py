#!/usr/bin/env python3
"""Build runtime assets for the Zanara roster from the Director-approved kit.

Source: .mw/specs/hud-zanara/kit/approved/ (SELECTION.md). Every slice point
is measured here from the alpha channel, never eyeballed:
  - plaque (K2): 3-slice; the stretchable middle = columns whose opaque height
    equals the median (±2 px);
  - band (K3): node-free repeat segment made seamless with a 24 px cross-fade,
    the emerald node cut as a separate overlay;
  - band end (K6): scaled so its band width matches K3;
  - ring (K1 ritratto): hole radius measured on the centre row.
Assets are written at 2x of their on-screen size (design space 1600x900).

Usage: python3 scripts/build-zanara-kit.py
Out:   public/assets/ui/zanara/roster/*.png + kit.json (mount geometry, 1x px)
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '.mw/specs/hud-zanara/kit/approved')
OUT = os.path.join(ROOT, 'public/assets/ui/zanara/roster')
DPR = 2

# on-screen targets (design px) — KIT-ROSTER.md
RING_D = 56
PLAQUE_H = 50
BAND_W = 14
EMBLEM_D = 84
GEM_D = 12


def load(name):
    return Image.open(os.path.join(SRC, name)).convert('RGBA')


def alpha(im):
    return np.array(im)[:, :, 3]


def resize(im, w, h):
    return im.resize((max(1, round(w)), max(1, round(h))), Image.LANCZOS)


def save(im, name):
    im.save(os.path.join(OUT, name), optimize=True)


def build_ring(meta):
    im = load('K1-ring-ritratto.png')
    a = alpha(im)
    cy, cx = a.shape[0] // 2, a.shape[1] // 2
    cols = np.where(a[cy] > 128)[0]
    outer_r = (cols.max() - cols.min()) / 2
    hole_r = next(x for x in range(cx, a.shape[1]) if a[cy, x] > 128) - cx
    scale = RING_D / (2 * outer_r)
    size = im.width * scale
    save(resize(im, size * DPR, size * DPR), 'ring.png')
    # the ring's own emerald (bottom): the state castone is mounted over it
    rgb = np.array(im)[:, :, :3].astype(int)
    gem = (rgb[:, :, 1] > 175) & (rgb[:, :, 1] > rgb[:, :, 0] + 70) & (a > 128)
    gem[: a.shape[0] // 2] = False
    gy, gx = np.where(gem)
    meta['ring'] = {
        'size': round(size, 2), 'outerD': RING_D, 'holeD': round(2 * hole_r * scale, 2),
        'gemX': round(gx.mean() * scale, 2), 'gemY': round(gy.mean() * scale, 2),
        'gemD': round(max(np.ptp(gx), np.ptp(gy)) * scale, 2),
    }


def build_plaque(meta):
    im = load('K2-placca.png')
    a = alpha(im)
    h = (a > 128).sum(0)
    med = np.median(h[h > 0])
    uniform = np.where(np.abs(h - med) <= 2)[0]
    left_cut, right_cut = int(uniform.min()) + 8, int(uniform.max()) - 8
    scale = PLAQUE_H / im.height
    parts = {
        'plaque-left.png': im.crop((0, 0, left_cut, im.height)),
        'plaque-mid.png': im.crop((left_cut, 0, right_cut, im.height)),
        'plaque-right.png': im.crop((right_cut, 0, im.width, im.height)),
    }
    for name, p in parts.items():
        w = p.width * scale if name != 'plaque-mid.png' else 64
        save(resize(p, w * DPR, PLAQUE_H * DPR), name)
    ys = np.where(a[:, (left_cut + right_cut) // 2] > 128)[0]
    meta['plaque'] = {
        'h': PLAQUE_H,
        'leftW': round(left_cut * scale, 2),
        'rightW': round((im.width - right_cut) * scale, 2),
        'naturalW': round(im.width * scale, 2),
        # opaque body of the plaque (rails included), for text placement
        'bodyTop': round(ys.min() * scale, 2),
        'bodyBottom': round(ys.max() * scale, 2),
    }


def build_band(meta):
    im = load('K3-banda.png')
    arr = np.array(im).astype(np.float32)
    rgb = arr[:, :, :3]
    # node = rows holding bright saturated emerald (the gem)
    g, r, b = rgb[:, :, 1], rgb[:, :, 0], rgb[:, :, 2]
    gem = (g > 140) & (g > r + 50) & (g > b + 20)
    rows = np.where(gem.sum(1) > 3)[0]
    n0, n1 = int(rows.min()), int(rows.max())
    pad = 18
    node = im.crop((0, max(0, n0 - pad), im.width, min(im.height, n1 + pad)))
    # node-free segment above the node, made seamless by cross-fading its tail into its head
    fade = 24
    seg_top, seg_bot = 40, max(80, n0 - pad - 20)
    seg = arr[seg_top:seg_bot]
    L = seg.shape[0] - fade
    tile = seg[:L].copy()
    w = np.linspace(0, 1, fade)[:, None, None]
    tile[:fade] = seg[L:L + fade] * (1 - w) + seg[:fade] * w
    tile_im = Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8), 'RGBA')
    scale = BAND_W / im.width
    save(resize(tile_im, BAND_W * DPR, tile_im.height * scale * DPR), 'band-tile.png')
    save(resize(node, BAND_W * DPR, node.height * scale * DPR), 'band-node.png')
    meta['band'] = {'w': BAND_W, 'tileH': round(tile_im.height * scale, 2), 'nodeH': round(node.height * scale, 2)}


def build_band_end(meta):
    im = load('K6-banda-fine.png')
    a = alpha(im)
    top_w = np.median((a[:120] > 128).sum(1))
    scale = BAND_W / top_w
    cols = np.where((a[:120] > 128).any(0))[0]
    band_x = cols.min() * scale
    save(resize(im, im.width * scale * DPR, im.height * scale * DPR), 'band-end.png')
    meta['bandEnd'] = {'w': round(im.width * scale, 2), 'h': round(im.height * scale, 2), 'bandX': round(band_x, 2)}


def build_emblem(meta):
    im = load('K5-emblema.png')
    save(resize(im, EMBLEM_D * DPR, EMBLEM_D * DPR * im.height / im.width), 'emblem.png')
    meta['emblem'] = {'w': EMBLEM_D, 'h': round(EMBLEM_D * im.height / im.width, 2)}


def build_gems(meta):
    names = ['round-lit', 'drop-lit', 'diamond-lit', 'round-dim', 'drop-dim', 'diamond-dim']
    for i, n in enumerate(names, start=1):
        im = load(f'K4-castone-{i}.png')
        s = GEM_D / max(im.width, im.height)
        save(resize(im, im.width * s * DPR, im.height * s * DPR), f'gem-{n}.png')
    meta['gem'] = {'d': GEM_D}


LASTRA_CORNER = 22   # on-screen corner of the 9-slice lastra (design px)
OUT_SHARED = os.path.join(ROOT, 'public/assets/ui/zanara/kit')


def build_lastra(meta):
    """K7 lastra as a CSS border-image: crop to the plaque, slice where the
    corner ornament ends (first run of 12 columns/rows whose rail thickness
    equals the median ±2 px)."""
    im = load('K7-lastra.png')
    a = np.array(im).astype(int)
    al, r, g, b = a[:, :, 3], a[:, :, 0], a[:, :, 1], a[:, :, 2]
    ys, xs = np.where(al > 128)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    enamel = (al > 128) & (g > r + 15) & (g > b)

    def corner_extent(profile):
        prof = np.array(profile)
        med = np.median(prof[prof < 999])
        ok = np.abs(prof - med) <= 2
        for i in range(len(ok) - 12):
            if ok[i:i + 12].all():
                return i
        return len(ok) // 4

    top = [np.where(enamel[y0:y1 + 1, x])[0].min() if enamel[y0:y1 + 1, x].any() else 999 for x in range(x0, x1 + 1)]
    left = [np.where(enamel[y, x0:x1 + 1])[0].min() if enamel[y, x0:x1 + 1].any() else 999 for y in range(y0, y1 + 1)]
    cut = max(corner_extent(top), corner_extent(top[::-1]), corner_extent(left), corner_extent(left[::-1])) + 4
    m = 4
    crop = im.crop((x0 - m, y0 - m, x1 + m + 1, y1 + m + 1))
    s = LASTRA_CORNER / (cut + m) * DPR
    os.makedirs(OUT_SHARED, exist_ok=True)
    out = resize(crop, crop.width * s, crop.height * s)
    out.save(os.path.join(OUT_SHARED, 'lastra-9slice.png'), optimize=True)
    meta['lastra'] = {'slice': round((cut + m) * s), 'corner': LASTRA_CORNER, 'assetW': out.width, 'assetH': out.height}


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {'dpr': DPR, 'units': 'design px (1600x900)', 'source': '.mw/specs/hud-zanara/kit/approved/SELECTION.md'}
    for step in (build_ring, build_plaque, build_band, build_band_end, build_emblem, build_gems, build_lastra):
        step(meta)
    with open(os.path.join(OUT, 'kit.json'), 'w') as f:
        json.dump(meta, f, indent=2)
    print(json.dumps(meta, indent=2))


if __name__ == '__main__':
    main()
