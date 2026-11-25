#!/usr/bin/env python3
"""Audit automatico anti-slop di un asset HUD (bande/cornici/piastre).

Controlli meccanici sull'asset reale (non sul render):
  1. SEAM   — discontinuita' verticali sospette (splice di compositing).
  2. SYM    — simmetria top/bottom della luminanza per riga.
  3. SOCKET — pozzi scuri vs geometry JSON (se fornito): centro e passo.
  4. ALPHA  — estensione silhouette e fori trasparenti interni.
  5. PAL    — quota nero / verde / oro / altro (confronto tra bande).

Uso:
  python3 scripts/hud-real/audit-asset.py <asset.webp> [altro.webp ...]
  python3 scripts/hud-real/audit-asset.py <asset> --geometry <geo.json> [--crop-dir DIR]

Output: report su stdout; con --crop-dir salva crop 4x delle anomalie.
"""

import colorsys
import json
import os
import sys

import numpy as np
from PIL import Image

SEAM_TOP_K = 6


def palette(rgb, alpha):
    tot = {'nero': 0, 'verde-scuro': 0, 'verde-vivo': 0, 'oro': 0, 'altro': 0}
    flat = rgb.reshape(-1, 3) / 255.0
    aflat = alpha.reshape(-1)
    n = 0
    for (r, g, b), a in zip(flat, aflat):
        if a < 128:
            continue
        n += 1
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        hd = h * 360
        greenish = 110 <= hd <= 200 and s > 0.15
        gold = 25 <= hd < 75 and s > 0.25
        if v < 0.30:
            tot['verde-scuro' if greenish else 'nero'] += 1
        elif greenish:
            tot['verde-vivo'] += 1
        elif gold:
            tot['oro'] += 1
        elif v < 0.45 and s < 0.2:
            tot['nero'] += 1
        else:
            tot['altro'] += 1
    return tot, max(n, 1)


def audit(path, geometry_path=None, crop_dir=None):
    im_pil = Image.open(path).convert('RGBA')
    im = np.array(im_pil).astype(float)
    h, w, _ = im.shape
    alpha = im[:, :, 3]
    rgb = im[:, :, :3]
    print(f'== {os.path.basename(path)}  {w}x{h}px (design {w/2:g}x{h/2:g} se @2x)')

    # SEAM: discontinuita' verticali sulla banda interna
    band = rgb[int(h * 0.1):int(h * 0.9), :, :].mean(axis=(0, 2))
    diff = np.abs(np.diff(band))
    top = np.argsort(diff)[-SEAM_TOP_K:][::-1]
    print('  [SEAM] top discontinuita\' verticali (x@res, score):')
    for x in top:
        print(f'         x={x} score={diff[x]:.1f}')

    # SYM: simmetria top/bottom dei profili di luminanza per riga
    rowlum = rgb.mean(axis=(1, 2))
    tb = np.corrcoef(rowlum[: h // 2], rowlum[: h // 2][::-1])[0, 1]
    flag = '  <-- asimmetria marcata' if tb < 0.5 else ''
    print(f'  [SYM]  top-bottom row-lum: {tb:.3f} (1 = speculare){flag}')

    # SOCKET: cluster di pozzi scuri vs geometry (euristica: i pozzi sono
    # campi scuri larghi; rumore <10px scartato, gap <8px fusi)
    dark = (rgb.mean(axis=2) < 60) & (alpha > 200)
    colsum = dark.sum(axis=0)
    raw, start = [], None
    for i, v in enumerate(colsum):
        if v > 15 and start is None:
            start = i
        elif v <= 15 and start is not None:
            raw.append((start, i))
            start = None
    if start is not None:
        raw.append((start, w))
    clusters = []
    for a, b in raw:
        if b - a < 10:
            continue
        if clusters and a - clusters[-1][1] < 8:
            clusters[-1] = (clusters[-1][0], b)
        else:
            clusters.append((a, b))
    centers = [(a + b) // 2 for a, b in clusters]
    print(f'  [SOCK] cluster scuri: {len(clusters)} centri {centers}')
    if geometry_path and os.path.exists(geometry_path):
        geom = json.load(open(geometry_path))
        scale = geom.get('asset2x', [w, h])[0] / geom['w'] if 'w' in geom else w / geom['w']
        exp = [round((s['x'] + s['w'] / 2) * scale) for s in geom.get('slots', [])]
        print(f'         attesi da geometry: {exp}')
        if len(exp) == len(centers):
            drift = [abs(c - e) for c, e in zip(centers, exp)]
            print(f'         drift max: {max(drift)}px @res')
    if crop_dir and clusters:
        os.makedirs(crop_dir, exist_ok=True)
        for i, (a, b) in enumerate(clusters):
            pad = int(h * 0.4)
            c = im_pil.crop((max(0, a - pad), 0, min(w, b + pad), h))
            c.resize((c.width * 4, c.height * 4), Image.LANCZOS).save(
                os.path.join(crop_dir, f'sock-{i}-4x.png'))

    # ALPHA: silhouette e fori interni
    rows = np.nonzero(alpha.max(axis=1) > 0)[0]
    yy, xx = np.indices((h, w))
    margin = int(h * 0.1)
    holes = int(((alpha < 30) & (yy > margin) & (yy < h - margin) & (xx > margin) & (xx < w - margin)).sum())
    print(f'  [ALPHA] estensione righe {rows.min()}-{rows.max()}/{h}; fori interni: {holes}px')

    # PAL
    tot, n = palette(rgb, alpha)
    verde = (tot['verde-scuro'] + tot['verde-vivo']) / n
    print('  [PAL]  ' + '  '.join(f'{k} {v / n * 100:.1f}%' for k, v in tot.items()))
    print(f'         verde tot {verde * 100:.1f}% | nero/verde {tot["nero"] / max(verde * n, 1):.2f}')
    print()


def main():
    args = sys.argv[1:]
    geometry = crop_dir = None
    assets = []
    i = 0
    while i < len(args):
        if args[i] == '--geometry':
            i += 1
            geometry = args[i]
        elif args[i] == '--crop-dir':
            i += 1
            crop_dir = args[i]
        else:
            assets.append(args[i])
        i += 1
    if not assets:
        print(__doc__)
        sys.exit(1)
    for a in assets:
        audit(a, geometry, crop_dir)


if __name__ == '__main__':
    main()
