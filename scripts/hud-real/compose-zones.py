#!/usr/bin/env python3
"""PLAN-110 zone recomposition: paste full-frame zone generations back onto the base piece.

Each zone output is scaled to its box in the base, registered to the base crop with ECC
(affine, so small shifts/rotations Gemini introduces are undone), then blended with a
feathered mask. The base supplies everything outside the zones.

Usage: tools/hud-real/venv/bin/python scripts/hud-real/compose-zones.py \
         --base base.png --zones zones.json --pick dial=gen/dial-1-0.png wing=... --out out.png
zones.json: {name: {"box": [x0,y0,x1,y1], "mask": "circle:cx,cy,r" | "box"}}
"""
import argparse
import json

import cv2
import numpy as np


def register_features(src, ref):
    """Similarity transform from SIFT matches: handles the zoom changes Gemini makes to a crop.
    src may have a different size/aspect than ref; returns src warped into ref's frame."""
    sift = cv2.SIFT_create(4000)
    a = cv2.cvtColor(src, cv2.COLOR_RGB2GRAY)
    b = cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY)
    ka, da = sift.detectAndCompute(a, None)
    kb, db = sift.detectAndCompute(b, None)
    if da is None or db is None:
        return None, 0
    m = cv2.BFMatcher().knnMatch(da, db, k=2)
    good = [x for x, y in (p for p in m if len(p) == 2) if x.distance < 0.75 * y.distance]
    if len(good) < 12:
        return None, len(good)
    pa = np.float32([ka[g.queryIdx].pt for g in good])
    pb = np.float32([kb[g.trainIdx].pt for g in good])
    M, inl = cv2.estimateAffinePartial2D(pa, pb, method=cv2.RANSAC, ransacReprojThreshold=4)
    if M is None:
        return None, 0
    out = cv2.warpAffine(src, M, (ref.shape[1], ref.shape[0]), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REFLECT)
    return out, int(inl.sum())


def register(src, ref):
    """Affine-align src to ref (both RGB, same size). Returns the warped src and the ECC score."""
    s = cv2.cvtColor(src, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    r = cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    f = 512 / max(s.shape)
    s_, r_ = cv2.resize(s, None, fx=f, fy=f), cv2.resize(r, None, fx=f, fy=f)
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        score, warp = cv2.findTransformECC(r_, s_, warp, cv2.MOTION_AFFINE,
                                           (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5), None, 5)
    except cv2.error:
        return src, 0.0
    warp[:, 2] /= f
    out = cv2.warpAffine(src, warp, (src.shape[1], src.shape[0]), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP,
                         borderMode=cv2.BORDER_REFLECT)
    return out, float(score)


def zone_mask(shape, box, spec, feather):
    h, w = shape
    m = np.zeros((h, w), np.float32)
    x0, y0, x1, y1 = box
    if spec.startswith('circle:'):
        cx, cy, r = (float(v) for v in spec[7:].split(','))
        cv2.circle(m, (round(cx), round(cy)), round(r), 1.0, -1)
    else:
        m[y0 + feather:y1 - feather, x0 + feather:x1 - feather] = 1.0
    k = feather * 2 + 1
    return cv2.GaussianBlur(m, (k, k), feather / 2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    ap.add_argument('--zones', required=True)
    ap.add_argument('--pick', nargs='+', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--feather', type=int, default=18)
    a = ap.parse_args()
    base = cv2.cvtColor(cv2.imread(a.base), cv2.COLOR_BGR2RGB).astype(np.float32)
    zones = json.load(open(a.zones))
    out = base.copy()
    report = {}
    for item in a.pick:
        name, path = item.split('=', 1)
        z = zones[name]
        x0, y0, x1, y1 = z['box']
        gen = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB)
        ref = base[y0:y1, x0:x1].astype(np.uint8)
        refbig = cv2.resize(ref, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        warped, inl = register_features(gen, refbig)
        if warped is not None:
            gen = cv2.resize(warped, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
            gen, score = register(gen, ref)
            score = f'sift {inl} / ecc {score:.3f}'
        else:
            gen = cv2.resize(gen, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
            gen, score = register(gen, ref)
        layer = out.copy()
        layer[y0:y1, x0:x1] = gen
        m = zone_mask(base.shape[:2], z['box'], z.get('mask', 'box'), a.feather)[..., None]
        out = layer * m + out * (1 - m)
        report[name] = score if isinstance(score, str) else round(score, 3)
    cv2.imwrite(a.out, cv2.cvtColor(out.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
    print(json.dumps({'ecc': report, 'out': a.out}))


if __name__ == '__main__':
    main()
