#!/usr/bin/env python3
"""Repartition contested alpha pixels between painted village layers (R-326).

Each painted layer's alpha is a grown+feathered polygon mask over the ORIGINAL
painting, so where two masks overlap both layers carry identical painting
pixels — invisible when everything is shown, but a toggled layer shows a slice
of its neighbour's building. This script gives every contested pixel exactly
one owner, chosen at the real building boundary:

- ``house-small-west`` always loses: it is retired from the manifest, and its
  contested stone strip must stay with ``house-big-west`` (R-247 note).
- ``hut-far-1`` × ``hut-far-2``: boundary follows hut-far-2's left silhouette —
  shadow slit ~x1750 above the eave, eave tip jutting left to ~x1728 at
  y~860-890, then the wall post ~x1742 down to the ground.
- ``hut-far-2`` × ``house-stone-mid``: boundary follows stone-mid's left gable
  silhouette — roof slope ~x1995 at the top down to the eave corner ~x1958 at
  y~800 — then swings right to ~x2020 below y~830 so hut-far-2's lean-to annex
  and cart (which stand in front of stone-mid's wall) stay whole with
  hut-far-2.
- ``house-stone-mid`` × ``house-thatch-big``: boundary follows thatch-big's
  left gable silhouette — ~x2370 above the eave line, the slope edge down to
  the eave tip ~x2258 at y~780, then the wall/base edge ~x2250-2270 (stone-mid
  keeps only the shadow gap, no gable slice).
- ``house-thatch-big`` × ``house-east-edge``: split at east-edge's polygon left
  edge polyline.
- Fallback (any other contested pair): signed-distance argmax to the source
  polygons in buildings.json.

Because contested pixels carry identical painting RGB, reassigning alpha keeps
the base + painted-layers == painting identity exact. A second "sweep" pass
then moves EXCLUSIVE pixels sitting on the wrong side of a silhouette boundary
(e.g. stone-mid's exclusive sliver left of its gable, the birch wedge in
house-east-edge) to the other layer of the pair — RGB comes from the painting,
and the receiving layer's box is expanded if the pixel lies outside it.
Retired buildings (in buildings.json but not in layers.json) keep only their
exclusive region, which the layer file no longer needs — the file/manifest
entry for house-small-west is removed.

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
    ('hut-far-1', 'hut-far-2'): [
        (0, 1757), (840, 1755), (860, 1730), (890, 1728), (900, 1740),
        (960, 1744), (VERTICAL, 1744)
    ],
    ('hut-far-2', 'house-stone-mid'): [
        (0, 1997), (560, 1995), (620, 1985), (700, 1973), (800, 1958),
        (830, 1995), (870, 2018), (1000, 2020), (VERTICAL, 2020)
    ],
    ('house-stone-mid', 'house-thatch-big'): [
        (0, 2370), (500, 2368), (560, 2345), (620, 2320), (700, 2295),
        (760, 2262), (820, 2258), (880, 2268), (960, 2255),
        (VERTICAL, 2250)
    ],
    ('house-thatch-big', 'house-east-edge'): [
        (0, 2818), (730, 2818), (760, 2880), (VERTICAL, 2880)
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

    # apply — track the ALPHA VALUE per layer: a contested pixel's winner gets
    # the combined coverage of the stack, losers zero out, and a swept-in
    # pixel inherits the donor's value (feathered edges stay intact and the
    # composite keeps reproducing the painting exactly).
    new_val = {i: np.where(alpha[i] > 0, alpha[i], 0).astype(np.uint8)
               for i in ids}
    for k in range(len(ys)):
        win = ids[owner[k]]
        cov = 0
        for j in range(len(ids)):
            if cand[k, j]:
                v = int(alpha[ids[j]][ys[k], xs[k]])
                cov = 255 - (255 - cov) * (255 - v) // 255
        for j in range(len(ids)):
            if cand[k, j]:
                new_val[ids[j]][ys[k], xs[k]] = cov if ids[j] == win else 0

    # sweep pass: exclusive pixels on the wrong side of a silhouette boundary
    # change owner too (they are foreign slivers a straight split cannot fix).
    # Region = currently owned by one of the pair — sequential, so a pixel
    # already re-homed by an earlier pair is not reconsidered.
    painting = np.array(Image.open(
        os.path.join(ROOT, 'src/assets/mood/rude-beauty/villaggio.png')
    ).convert('RGBA'))[..., :3]
    swept = 0
    for (left, right), poly in SPLITS.items():
        if left not in new_val or right not in new_val:
            continue
        region = (new_val[left] > 0) | (new_val[right] > 0)
        pys, pxs = np.nonzero(region)
        for k in range(len(pys)):
            py, px = int(pys[k]), int(pxs[k])
            want = left if px < boundary_x(poly, py) else right
            owner_now = left if new_val[left][py, px] > 0 else right
            if owner_now == want:
                continue
            new_val[want][py, px] = new_val[owner_now][py, px]
            new_val[owner_now][py, px] = 0
            imgs[want][py, px, :3] = painting[py, px]
            swept += 1
    print(f'swept pixels: {swept}')

    stats = {}
    for i in ids:
        before = int((alpha[i] > 0).sum())
        after = int((new_val[i] > 0).sum())
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
        pys, pxs = np.nonzero(new_val[i] > 0)
        if len(pxs):
            x0, x1 = min(x, int(pxs.min())), max(x + w, int(pxs.max()) + 1)
            y0, y1 = min(y, int(pys.min())), max(y + h, int(pys.max()) + 1)
            if (x0, y0, x1, y1) != (x, y, x + w, y + h):
                ly['box'] = [x0, y0, x1 - x0, y1 - y0]
                print(f'{i}: box {x},{y},{w},{h} -> {x0},{y0},{x1 - x0},{y1 - y0}')
        x, y, w, h = ly['box']
        sub = imgs[i][y:y + h, x:x + w].copy()
        sub[..., 3] = new_val[i][y:y + h, x:x + w]
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
