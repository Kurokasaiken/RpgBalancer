#!/usr/bin/env python3
"""PLAN-110 S2/S4/S5 for C1: approved Gemini originals -> runtime assets + mount geometry.

Every piece was generated on flat navy #0a1622, so the cut is a flood fill from the
image border (navy connected to the outside only; interior enamel stays opaque).
Mount points are measured on the alpha, never typed:
  ring   : portrait hole (largest enclosed navy region) fitted as a circle, outer radius
  plaque : bounding box, enamel field box (largest dark-emerald region), left concave arc
  emblem : bounding box, disc centre (Hough)
On-screen sizes follow the mockup scale (D-1), each piece measured on its own mockup part.

Usage: tools/hud-real/venv/bin/python scripts/hud-real/build-roster-assets.py \
         --ring R.png [--plaque P.png] [--emblem E.png] [--out public/assets/ui/hud-real/C1]
Out: ring.webp / plaque.webp / emblem.webp (2x) + geometry.json (design px, 1x)
"""
import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image

NAVY = np.array([10, 22, 34])
DPR = 2
K = 1600 / 1672        # mockup px -> design px
RING_D = 91 * K        # ring outer diameter in the mockup (Hough, 2x45.5)
PLAQUE_H = 76 * K      # plaque height in the mockup (rails y 10..86)
EMBLEM_H = 215 * K     # emblem from finial to pendant in the mockup


def cut(path, tol=38):
    rgb = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB)
    h, w = rgb.shape[:2]
    bg = np.median(np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3)]), axis=0)
    d = np.abs(rgb.astype(int) - bg).max(axis=2)
    # navy is bluish (G < B); dark emerald enamel is greenish (G > B) even when it is as dark as
    # the background: never let the flood fill eat it (the "verdi cancellati" bug, 2026-11-03 emblem)
    greenish = rgb[:, :, 1].astype(int) - rgb[:, :, 2].astype(int) > 2
    near = ((d < tol) & ~greenish).astype(np.uint8)
    n, lab = cv2.connectedComponents(near, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    outside = np.isin(lab, list(border))
    alpha = (~outside).astype(np.float32)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.7)
    return rgb, alpha, near, lab, border


# Colour grade toward the mockup (Director 2026-11-03: gold not bright enough, green not deep enough).
# Targets measured on zanara-v1 nav (gold L p90 85, C p50 41) vs our pieces (gold C p50 30).
GRADE = {
    'gold': {'chroma': 1.42, 'contrast': 1.32, 'hi_lift': 10.0},
    'green': {'chroma': 1.35, 'gamma': 1.55, 'hi_keep': 0.7},
}


def grade(rgb, alpha):
    """Per-material grade in Lab with soft masks: brighter, more saturated gold with lifted
    highlights; deeper emerald (darker body, kept glossy highlights, more chroma)."""
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s_, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    ok = alpha > 0.5
    soft = lambda m: cv2.GaussianBlur(m.astype(np.float32), (5, 5), 1.2)
    gold = soft(ok & (h >= 10) & (h <= 32) & (s_ > 45) & (v > 60))
    green = soft(ok & (h >= 55) & (h <= 100) & (s_ > 40))
    L, A, B = lab[..., 0] * 100 / 255, lab[..., 1] - 128, lab[..., 2] - 128
    g, e = GRADE['gold'], GRADE['green']
    # gold
    Lg = np.clip((L - 55) * g['contrast'] + 55 + g['hi_lift'] * np.clip((L - 60) / 30, 0, 1), 0, 100)
    Ag, Bg = A * g['chroma'], B * g['chroma']
    # green: gamma on lightness pushes the body down, highlights partly preserved
    Ln = 100 * (L / 100) ** e['gamma']
    Le = Ln + (L - Ln) * e['hi_keep'] * np.clip((L - 45) / 30, 0, 1)
    Ae, Be = A * e['chroma'], B * e['chroma']
    L2 = L + (Lg - L) * gold + (Le - L) * green
    A2 = A + (Ag - A) * gold + (Ae - A) * green
    B2 = B + (Bg - B) * gold + (Be - B) * green
    out = np.dstack([L2 * 255 / 100, A2 + 128, B2 + 128]).clip(0, 255).astype(np.uint8)
    return cv2.cvtColor(out, cv2.COLOR_LAB2RGB)


def crop_to(rgb, alpha, pad=4):
    ys, xs = np.where(alpha > 0.5)
    x0, x1, y0, y1 = max(0, xs.min() - pad), xs.max() + pad + 1, max(0, ys.min() - pad), ys.max() + pad + 1
    return rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1], (x0, y0)


def save(rgb, alpha, scale, path):
    rgb = grade(rgb, alpha)
    im = Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), 'RGBA')
    im = im.resize((round(im.width * scale * DPR), round(im.height * scale * DPR)), Image.LANCZOS)
    im.save(path, 'WEBP', lossless=True, quality=100, method=6)
    return im.size


def fit_circle(pts):
    A = np.c_[2 * pts, np.ones(len(pts))]
    cx, cy, c = np.linalg.lstsq(A, (pts ** 2).sum(1), rcond=None)[0]
    return cx, cy, float(np.sqrt(c + cx * cx + cy * cy))


def ring(path, out):
    rgb, alpha, near, lab, border = cut(path)
    # portrait hole = largest enclosed navy component
    sizes = [(int((lab == i).sum()), i) for i in range(1, lab.max() + 1) if i not in border]
    hole_id = max(sizes)[1]
    hole = (lab == hole_id).astype(np.uint8)
    cnts, _ = cv2.findContours(hole, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    hcx, hcy, hr = fit_circle(max(cnts, key=len)[:, 0, :].astype(float))
    alpha[hole > 0] = 0  # the portrait shows through the hole
    crgb, ca, (ox, oy) = crop_to(rgb, alpha)
    ys, xs = np.where(ca > 0.5)
    outer_d = max(xs.max() - xs.min(), ys.max() - ys.min())
    scale = RING_D / outer_d
    size = save(crgb, ca, scale, os.path.join(out, 'ring.webp'))
    return {
        'w': round(crgb.shape[1] * scale, 2), 'h': round(crgb.shape[0] * scale, 2),
        'hole': {'cx': round((hcx - ox) * scale, 2), 'cy': round((hcy - oy) * scale, 2), 'r': round(hr * scale, 2)},
        'scale': scale, 'asset2x': size,
    }


def plaque(path, out):
    rgb, alpha, near, lab, border = cut(path)
    crgb, ca, (ox, oy) = crop_to(rgb, alpha)
    scale = PLAQUE_H / crgb.shape[0]
    hsv = cv2.cvtColor(crgb, cv2.COLOR_RGB2HSV)
    field = ((hsv[:, :, 0] > 60) & (hsv[:, :, 0] < 100) & (hsv[:, :, 1] > 60) & (hsv[:, :, 2] > 25) & (ca > 0.9)).astype(np.uint8)
    field = cv2.morphologyEx(field, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, fl, st, _ = cv2.connectedComponentsWithStats(field)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    fx, fy, fw, fh = st[i, :4]
    # concave left end: fit a circle to the leftmost opaque pixel of the middle rows
    hh = ca.shape[0]
    pts = []
    for y in range(int(hh * 0.15), int(hh * 0.85), 2):
        xs_ = np.where(ca[y] > 0.5)[0]
        if len(xs_):
            pts.append((xs_.min(), y))
    acx, acy, ar = fit_circle(np.array(pts, float))
    size = save(crgb, ca, scale, os.path.join(out, 'plaque.webp'))
    return {
        'arc': {'cx': round(acx * scale, 2), 'cy': round(acy * scale, 2), 'r': round(ar * scale, 2)},
        'w': round(crgb.shape[1] * scale, 2), 'h': round(crgb.shape[0] * scale, 2),
        'field': {'x': round(fx * scale, 2), 'y': round(fy * scale, 2), 'w': round(fw * scale, 2), 'h': round(fh * scale, 2)},
        'asset2x': size,
    }


def emblem(path, out):
    rgb, alpha, *_ = cut(path)
    crgb, ca, _ = crop_to(rgb, alpha)
    scale = EMBLEM_H / crgb.shape[0]
    g = cv2.medianBlur(cv2.cvtColor(crgb, cv2.COLOR_RGB2GRAY), 5)
    cs = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, 1.5, 40, param1=120, param2=50, minRadius=g.shape[0] // 6, maxRadius=g.shape[0] // 2)
    disc = None
    if cs is not None:
        x, y, r = cs[0][0]
        disc = {'cx': round(float(x) * scale, 2), 'cy': round(float(y) * scale, 2), 'r': round(float(r) * scale, 2)}
    size = save(crgb, ca, scale, os.path.join(out, 'emblem.webp'))
    return {'w': round(crgb.shape[1] * scale, 2), 'h': round(crgb.shape[0] * scale, 2), 'disc': disc, 'asset2x': size}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ring', required=True)
    ap.add_argument('--plaque')
    ap.add_argument('--emblem')
    ap.add_argument('--out', default='public/assets/ui/hud-real/C1')
    ap.add_argument('--ts', help='also write the geometry as a TypeScript module (single source for the component)')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    geo = {'units': 'design px (1600x900), assets 2x', 'source': {'ring': a.ring, 'plaque': a.plaque, 'emblem': a.emblem}}
    geo['ring'] = ring(a.ring, a.out)
    if a.plaque:
        geo['plaque'] = plaque(a.plaque, a.out)
    if a.emblem:
        geo['emblem'] = emblem(a.emblem, a.out)
    with open(os.path.join(a.out, 'geometry.json'), 'w') as f:
        json.dump(geo, f, indent=2)
    if a.ts:
        body = {k: v for k, v in geo.items() if k in ('ring', 'plaque', 'emblem')}
        with open(a.ts, 'w') as f:
            f.write('/**\n * GENERATED by scripts/hud-real/build-roster-assets.py — do not edit by hand.\n'
                    ' * Mount geometry of the approved C1 pieces, measured on their alpha.\n'
                    ' * Units: design px (1600x900); assets in public/ are 2x.\n */\n')
            f.write('export const C1_GEOMETRY = ' + json.dumps(body, indent=2) + ' as const;\n')
    print(json.dumps({k: v for k, v in geo.items() if k != 'source'}, indent=1))


if __name__ == '__main__':
    main()
