#!/usr/bin/env python3
"""PLAN-112 F3.1: measure the four HUD materials (gold, enamel, alabaster, dark glass) on the chosen mockups, on the live map zones
(sea, jungle, light land) and on our current assets. Writes .mw/specs/hud-real/f3/color-targets.json and prints a summary.
Masks are Lab based and deliberately conservative; numbers are medians/percentiles of the masked pixels, not single samples.
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/measure-materials.py --map-shot path.png"""
import argparse, glob, json, os
import cv2
import numpy as np
from PIL import Image

HUD = '.mw/specs/hud-real/'
MOCK = {k: HUD + f'{k}/crop.png' for k in ['panel', 'nav', 'resources', 'compass', 'voce', 'brand', 'seal', 'time', 'globe', 'bust', 'rail']}
MOCK['roster'] = None  # cut from zanara-v2 below


def lab(rgb):
    x = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    L, A, B = x[..., 0] * 100 / 255, x[..., 1] - 128, x[..., 2] - 128
    return L, A, B, np.hypot(A, B), np.degrees(np.arctan2(B, A)) % 360


def masks(rgb, alpha=None):
    L, A, B, C, H = lab(rgb)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hh, ss, vv = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    ok = np.ones(L.shape, bool) if alpha is None else alpha
    return {
        'gold': ok & (hh >= 10) & (hh <= 34) & (ss > 60) & (vv > 90),
        'enamel': ok & (H > 135) & (H < 240) & (C > 7) & (C < 45) & (L > 6) & (L < 48),
        'alabaster': ok & (L > 68) & (C < 28) & (H > 55) & (H < 115),
        'glass': ok & (L < 14) & (C < 22),
    }, (L, A, B, C, H)


def stats(vals, L, C, H):
    if vals.sum() < 300:
        return None
    q = lambda a, p: float(np.percentile(a[vals], p))
    hr = np.deg2rad(H[vals]); hue = float(np.degrees(np.arctan2(np.sin(hr).mean(), np.cos(hr).mean())) % 360)
    return {'n': int(vals.sum()), 'L': [round(q(L, p), 1) for p in (10, 30, 50, 70, 90)], 'C_p50': round(q(C, 50), 1), 'C_p90': round(q(C, 90), 1), 'hue': round(hue, 0)}


def measure(path, alpha_png=False):
    im = Image.open(path).convert('RGBA'); a = np.array(im)
    alpha = (a[..., 3] > 200) if alpha_png else None
    m, (L, A, B, C, H) = masks(a[..., :3], alpha)
    return {k: stats(v, L, C, H) for k, v in m.items()}


def merge(rows):
    out = {}
    for mat in ('gold', 'enamel', 'alabaster', 'glass'):
        rs = [r[mat] for r in rows if r.get(mat)]
        if not rs:
            continue
        w = np.array([r['n'] for r in rs], float); w /= w.sum()
        out[mat] = {'n': int(sum(r['n'] for r in rs)), 'L': [round(float(sum(w[i] * rs[i]['L'][j] for i in range(len(rs)))), 1) for j in range(5)],
                    'C_p50': round(float(sum(w[i] * rs[i]['C_p50'] for i in range(len(rs)))), 1), 'hue': round(float(np.median([r['hue'] for r in rs])), 0),
                    'spread_L50': [min(r['L'][2] for r in rs), max(r['L'][2] for r in rs)], 'pieces': len(rs)}
    return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--map-shot'); a = ap.parse_args()
    res = {'mockups': {}, 'ours': {}, 'map': {}}
    src = Image.open('public/mockups/hud-lab/sources/zanara-v2.png').convert('RGB')
    os.makedirs(HUD + 'f3', exist_ok=True); src.crop((0, 215, 260, 670)).save(HUD + 'f3/mock-roster.png'); MOCK['roster'] = HUD + 'f3/mock-roster.png'
    for k, p in MOCK.items():
        if p and os.path.exists(p):
            res['mockups'][k] = measure(p)
    res['mockups_all'] = merge(list(res['mockups'].values()))
    for f in sorted(glob.glob('public/assets/ui/hud-real/*/*.webp')):
        if any(x in f for x in ('/library/', '/round/', 'illustration')):
            continue
        res['ours'][f.split('hud-real/')[1]] = measure(f, alpha_png=True)
    res['ours_all'] = merge(list(res['ours'].values()))
    if a.map_shot:
        rgb = np.array(Image.open(a.map_shot).convert('RGB')); L, A_, B, C, H = lab(rgb)
        zones = {'sea': (H > 185) & (H < 255) & (L > 28) & (L < 65) & (C > 12), 'jungle': (H > 95) & (H < 165) & (L < 38) & (C > 8), 'light_land': (L > 62) & (C > 20) & (H > 55) & (H < 105)}
        for k, v in zones.items():
            res['map'][k] = stats(v, L, C, H)
    json.dump(res, open(HUD + 'f3/color-targets.json', 'w'), indent=1)
    def line(name, s):
        return f"{name:12s} " + (f"n={s['n']:7d} L p10/30/50/70/90={s['L']} C50={s['C_p50']} hue={s['hue']}" if s else 'n/d')
    print('--- mockups (all pieces)'); [print(line(k, v)) for k, v in res['mockups_all'].items()]
    print('--- ours (all assets)'); [print(line(k, v)) for k, v in res['ours_all'].items()]
    print('--- map zones'); [print(line(k, v)) for k, v in res['map'].items()]


if __name__ == '__main__':
    main()
