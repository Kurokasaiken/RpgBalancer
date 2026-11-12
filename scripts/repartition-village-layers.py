#!/usr/bin/env python3
"""Repartition contested alpha pixels between painted village layers (R-326).

Each painted layer's alpha is a grown+feathered polygon mask over the ORIGINAL
painting, so where two masks overlap both layers carry identical painting
pixels — invisible when everything is shown, but a toggled layer shows a slice
of its neighbour's building. This script gives every contested pixel exactly
one owner, chosen at the real building boundary:

- ``house-small-west`` always loses: it is retired from the manifest, and its
  contested stone strip must stay with ``house-big-west`` (R-247 note).
- ``hut-far-1`` × ``hut-far-2``: split at x=1755.
- ``hut-far-2`` × ``house-stone-mid``: split at x=2030 (contested annex strip is
  hut-far-2's).
- ``house-stone-mid`` × ``house-thatch-big``: split at x=2400 (thatch porch
  posts start right of it).
- ``house-thatch-big`` × ``house-east-edge``: split at east-edge's polygon left
  edge polyline.
- Fallback (any other contested pair): signed-distance argmax to the source
  polygons in buildings.json.

Because contested pixels carry identical painting RGB, reassigning alpha keeps
the base + painted-layers == painting identity exact. Retired buildings (in
buildings.json but not in layers.json) keep only their exclusive region, which
the layer file no longer needs — the file/manifest entry for house-small-west
is removed.

Usage:
    python3 scripts/repartition-village-layers.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYERS = os.path.join(ROOT, 'public/assets/village/layers')
MANIFEST = os.path.join(LAYERS, 'layers.json')
BUILDINGS = os.path.join(LAYERS, 'buildings.json')

RETIRED = {'house-small-west'}

# (left_id, right_id) -> x-boundary as (y, x) polyline; contested pixel with
# canvas_x < boundary(y) goes to left_id.
VERTICAL = 10_000
SPLITS = {
    ('hut-far-1', 'hut-far-2'): [(0, 1755), (VERTICAL, 1755)],
    ('hut-far-2', 'house-stone-mid'): [(0, 2030), (VERTICAL, 2030)],
    ('house-stone-mid', 'house-thatch-big'): [(0, 2400), (VERTICAL, 2400)],
    ('house-thatch-big', 'house-east-edge'): [
        (330, 2960), (420, 2850), (520, 2842), (640, 2880), (VERTICAL, 2880)
    ],
}


def boundary_x(polyline, y):
    """Interpolates the x boundary at height y along a (y, x) polyline."""
    for i in range(len(polyline) - 1):
        y0, x0 = polyline[i]
        y1, x1 = polyline[i + 1]
        if y <= y1 or i == len(polyline) - 2:
            t = 0.0 if y1 == y0 else (y - y0) / (y1 - y0)
            return x0 + t * (x1 - x0)
    return polyline[-1][1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    manifest = json.load(open(MANIFEST))
    W, H = manifest['size']
    bjson = json.load(open(BUILDINGS))
    polys = {b['id']: np.array(b['poly'], np.float32) for b in bjson['buildings']}

    painted = [l for l in manifest['layers'] if l.get('source') != 'added']
    alpha = {}
    imgs = {}
    for ly in painted:
        im = np.array(Image.open(os.path.join(LAYERS, ly['file'])).convert('RGBA'))
        full = np.zeros((H, W), np.uint8)
        full_rgba = np.zeros((H, W, 4), np.uint8)
        x, y, w, h = ly['box']
        full[y:y + h, x:x + w] = im[..., 3]
        full_rgba[y:y + h, x:x + w] = im
        alpha[ly['id']] = full
        imgs[ly['id']] = full_rgba

    ids = [l['id'] for l in painted]
    cover = np.zeros((H, W), np.uint8)
    for i in ids:
        cover += (alpha[i] > 0).astype(np.uint8)
    contested = cover > 1
    print(f'contested pixels: {int(contested.sum())}')

    # signed distance to each source polygon (only for contested pixels)
    signed = {}
    need_fallback = False
    ys, xs = np.nonzero(contested)
    cand = np.stack([(alpha[i][ys, xs] > 0) for i in ids], axis=1)

    owner = np.full(len(ys), -1, np.int16)
    for k in range(len(ys)):
        cand_ids = [ids[j] for j in range(len(ids)) if cand[k, j]]
        if len(cand_ids) == 1:
            owner[k] = ids.index(cand_ids[0])
            continue
        # retired layers always lose
        alive = [c for c in cand_ids if c not in RETIRED] or cand_ids
        # pairwise splits
        if len(alive) == 2:
            pair = tuple(alive) if (tuple(alive) in SPLITS) else (alive[1], alive[0])
            if tuple(pair) in SPLITS:
                left, right = pair
                owner[k] = ids.index(left if xs[k] < boundary_x(SPLITS[pair], ys[k]) else right)
                continue
        if len(alive) == 1:
            owner[k] = ids.index(alive[0])
            continue
        # fallback: signed distance to the ORIGINAL polygon
        if not need_fallback:
            for i in ids:
                mask = np.zeros((H, W), np.uint8)
                if i in polys:
                    cv2.fillPoly(mask, [polys[i].astype(np.int32)], 1)
                inside = cv2.distanceTransform(mask, cv2.DIST_L2, 3)
                outside = cv2.distanceTransform(1 - mask, cv2.DIST_L2, 3)
                signed[i] = inside - outside
            need_fallback = True
        best = max(alive, key=lambda i: signed[i][ys[k], xs[k]])
        owner[k] = ids.index(best)

    # apply
    new_alpha = {i: (alpha[i] > 0).copy() for i in ids}
    for k in range(len(ys)):
        win = ids[owner[k]]
        for j in range(len(ids)):
            if cand[k, j]:
                new_alpha[ids[j]][ys[k], xs[k]] = (ids[j] == win)

    stats = {}
    for i in ids:
        before = int((alpha[i] > 0).sum())
        after = int(new_alpha[i].sum())
        stats[i] = (before, after, before - after)
    for i in ids:
        print(f'{i:20s} alpha {stats[i][0]:>7} -> {stats[i][1]:>7}  (lost {stats[i][2]})')

    if args.dry_run:
        return

    for ly in painted:
        i = ly['id']
        if i in RETIRED:
            continue
        x, y, w, h = ly['box']
        sub = imgs[i][y:y + h, x:x + w].copy()
        sub[..., 3] = np.where(new_alpha[i][y:y + h, x:x + w], sub[..., 3], 0)
        Image.fromarray(sub).save(os.path.join(LAYERS, ly['file']), lossless=True)

    # retire house-small-west: remove manifest entry + layer file
    removed = [l for l in manifest['layers'] if l['id'] in RETIRED]
    manifest['layers'] = [l for l in manifest['layers'] if l['id'] not in RETIRED]
    json.dump(manifest, open(MANIFEST, 'w'), indent=2)
    for l in removed:
        p = os.path.join(LAYERS, l['file'])
        if os.path.exists(p):
            os.remove(p)
        print('removed', l['id'], l['file'])


if __name__ == '__main__':
    main()
