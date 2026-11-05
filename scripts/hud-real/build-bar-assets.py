#!/usr/bin/env python3
"""PLAN-110 bars (resources, nav): generated modules -> runtime pieces that tile into a bar.

  left  : cap + first slot, cut at the centre of the enamel divider after the first slot
  mid   : one slot unit, cut at divider centres (seamless by construction: period measured)
  right : second half of a divider + last slot + closing corner, cut at the divider centre
All pieces are scaled so the bar body (rail to rail) is BAR_H design px, so they join without a step.
Slots = connected dark-glass regions at the bar's middle row; their boxes are written to geometry.

Same cut and colour grade as build-roster-assets.py.
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/build-bar-assets.py --name resources \
         --left L.png --right R.png [--mid M.png] [--bar-h 64.7] [--out public/assets/ui/hud-real/<NAME>] \
         [--ts src/ui/idleVillage/hudReal/<name>BarGeometry.ts]
"""
import argparse
import importlib.util
import json
import os

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bra', os.path.join(HERE, 'build-roster-assets.py'))
bra = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bra)


def luma(rgb):
    return (rgb[..., 0] * 299 + rgb[..., 1] * 587 + rgb[..., 2] * 114) // 1000


def body_rows(alpha, cols):
    """Rail-to-rail rows: opaque rows over the given straight columns (ornaments excluded)."""
    sub = (alpha[:, cols] > 0.5).mean(1)
    ys = np.where(sub > 0.9)[0]
    return int(ys.min()), int(ys.max())


def dark_runs(rgb, alpha, y, min_w, thr=34):
    """Runs of dark-glass pixels along row y, at least min_w wide (slots, not gem facets)."""
    d = (luma(rgb[y].astype(np.int32)[None])[0] < thr) & (alpha[y] > 0.5)
    runs, s = [], None
    for x in range(len(d) + 1):
        v = x < len(d) and d[x]
        if v and s is None:
            s = x
        elif not v and s is not None:
            if x - s >= min_w:
                runs.append((s, x))
            s = None
    return runs


def slot_box(rgb, alpha, x_seed, y_seed, thr=34):
    """Bounding box of the dark-glass component containing (x_seed, y_seed), opaque pixels only."""
    dark = ((luma(rgb.astype(np.int32)) < thr) & (alpha > 0.5)).astype(np.uint8)
    n, lab = cv2.connectedComponents(dark, connectivity=4)
    i = lab[y_seed, x_seed]
    ys, xs = np.where(lab == i)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def load_piece(path):
    rgb, alpha, *_ = bra.cut(path)
    return rgb, alpha


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--name', required=True)
    ap.add_argument('--left', required=True)
    ap.add_argument('--right', required=True)
    ap.add_argument('--mid')
    ap.add_argument('--bar-h', type=float, default=64.7)
    ap.add_argument('--out')
    ap.add_argument('--ts')
    a = ap.parse_args()
    out = a.out or f'public/assets/ui/hud-real/{a.name}'
    os.makedirs(out, exist_ok=True)
    geo = {'barH': a.bar_h, 'pieces': {}}

    def straight_cols(alpha, side):
        w = alpha.shape[1]
        return slice(int(w * 0.70), int(w * 0.95)) if side == 'left' else slice(int(w * 0.05), int(w * 0.30))

    pieces = {}
    for key, path in (('left', a.left), ('right', a.right), ('mid', a.mid)):
        if not path:
            continue
        rgb, alpha = load_piece(path)
        cols = np.arange(alpha.shape[1])[straight_cols(alpha, 'left' if key != 'right' else 'right')]
        ytop, ybot = body_rows(alpha, cols)
        s = a.bar_h / (ybot - ytop + 1)
        ymid = (ytop + ybot) // 2
        pieces[key] = (rgb, alpha, s, ytop, ybot, ymid)

    def divider_centres(rgb, alpha, ymid, body_h):
        runs = dark_runs(rgb, alpha, ymid, int(1.2 * body_h))
        return runs, [(runs[i][1] + runs[i + 1][0]) // 2 for i in range(len(runs) - 1)]

    # left: cut at the first divider centre
    rgb, alpha, s, ytop, ybot, ymid = pieces['left']
    runs, gaps = divider_centres(rgb, alpha, ymid, ybot - ytop + 1)
    xcut = gaps[0] if gaps else rgb.shape[1]
    ys, xs = np.where(alpha > 0.5)
    y0, y1 = max(0, ys.min() - 2), min(rgb.shape[0], ys.max() + 3)
    x0 = max(0, xs.min() - 2)
    lr, la = rgb[y0:y1, x0:xcut], alpha[y0:y1, x0:xcut].copy()
    la[:, -1:] = np.maximum(la[:, -1:], 1.0)
    bra.save(lr, la, s, os.path.join(out, 'bar-left.webp'))
    sx0, sy0, sx1, sy1 = slot_box(rgb, alpha, (runs[0][0] + runs[0][1]) // 2, ymid)
    geo['pieces']['left'] = {
        'w': round(lr.shape[1] * s, 2), 'h': round(lr.shape[0] * s, 2),
        'bodyTop': round((ytop - y0) * s, 2), 'bodyBottom': round((ybot - y0 + 1) * s, 2),
        'slot': {'x': round((sx0 - x0) * s, 2), 'y': round((sy0 - y0) * s, 2), 'w': round((sx1 - sx0 + 1) * s, 2), 'h': round((sy1 - sy0 + 1) * s, 2)},
    }
    left_top = ytop - y0

    # right: cut at its first divider centre; the last slot is the full one after it
    rgb, alpha, s, ytop, ybot, ymid = pieces['right']
    runs, gaps = divider_centres(rgb, alpha, ymid, ybot - ytop + 1)
    xcut = gaps[0] if gaps else 0
    ys, xs = np.where(alpha > 0.5)
    y0, y1 = max(0, ys.min() - 2), min(rgb.shape[0], ys.max() + 3)
    x1 = min(rgb.shape[1], xs.max() + 3)
    rr, ra = rgb[y0:y1, xcut:x1], alpha[y0:y1, xcut:x1].copy()
    ra[:, :1] = np.maximum(ra[:, :1], 1.0)
    bra.save(rr, ra, s, os.path.join(out, 'bar-right.webp'))
    sx0, sy0, sx1, sy1 = slot_box(rgb, alpha, (runs[-1][0] + runs[-1][1]) // 2, ymid)
    geo['pieces']['right'] = {
        'w': round(rr.shape[1] * s, 2), 'h': round(rr.shape[0] * s, 2),
        'bodyTop': round((ytop - y0) * s, 2), 'bodyBottom': round((ybot - y0 + 1) * s, 2),
        'slot': {'x': round((sx0 - xcut) * s, 2), 'y': round((sy0 - y0) * s, 2), 'w': round((sx1 - sx0 + 1) * s, 2), 'h': round((sy1 - sy0 + 1) * s, 2)},
    }
    right_top = ytop - y0

    if 'mid' in pieces:
        rgb, alpha, s, ytop, ybot, ymid = pieces['mid']
        runs, gaps = divider_centres(rgb, alpha, ymid, ybot - ytop + 1)
        if len(gaps) >= 2:
            g0, g1 = gaps[0], gaps[1]
        elif len(gaps) == 1 and runs:
            g0, g1 = gaps[0], gaps[0] + (runs[0][1] - runs[0][0]) + (runs[1][0] - runs[0][1]) if len(runs) > 1 else gaps[0]
        else:
            raise SystemExit('mid: could not find two divider centres')
        ys, xs = np.where(alpha > 0.5)
        y0, y1 = max(0, ys.min() - 2), min(rgb.shape[0], ys.max() + 3)
        mr, ma = rgb[y0:y1, g0:g1], alpha[y0:y1, g0:g1]
        bra.save(mr, ma, s, os.path.join(out, 'bar-mid.webp'))
        sx0, sy0, sx1, sy1 = slot_box(rgb, alpha, (g0 + g1) // 2, ymid)
        # seam check: mean abs difference between the unit's first and last 6 columns
        seam = float(np.abs(mr[:, :6].astype(int) - mr[:, -6:].astype(int)).mean())
        geo['pieces']['mid'] = {
            'w': round(mr.shape[1] * s, 2), 'h': round(mr.shape[0] * s, 2),
            'bodyTop': round((ytop - y0) * s, 2), 'bodyBottom': round((ybot - y0 + 1) * s, 2),
            'slot': {'x': round((sx0 - g0) * s, 2), 'y': round((sy0 - y0) * s, 2), 'w': round((sx1 - sx0 + 1) * s, 2), 'h': round((sy1 - sy0 + 1) * s, 2)},
            'seamDiff': round(seam, 2),
        }
    with open(os.path.join(out, 'bar-geometry.json'), 'w') as f:
        json.dump(geo, f, indent=2)
    if a.ts:
        const = ''.join(w.capitalize() for w in a.name.split('-'))
        with open(a.ts, 'w') as f:
            f.write(f'/**\n * GENERATED by scripts/hud-real/build-bar-assets.py ({a.name}) — do not edit by hand.\n'
                    ' * Pieces of a bar: left (cap + slot), mid (one slot unit, repeats), right (slot + corner). Design px; assets 2x.\n */\n')
            f.write(f'export const {const.upper()}_BAR = ' + json.dumps(geo, indent=2) + ' as const;\n')
    print(json.dumps(geo, indent=1))


if __name__ == '__main__':
    main()
