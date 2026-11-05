#!/usr/bin/env python3
"""Bring the emerald enamel of every HUD piece onto one shared target (measured on the chosen mockups:
deep teal, hue ~205 deg in Lab, L p50 ~24, C ~19). Rotates hue, scales chroma, lifts lightness with a gamma;
dark-glass boxes (slots / text fields / windows from the *-geometry.json) are protected so they stay dark.
Original of each file is kept in .mw/specs/hud-real/regrade-backup/unify__*.
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/unify-enamel.py [--hue 205 --L 24 --C 19] asset.webp[:geometry.json] ..."""
import argparse, json, os, shutil
import cv2, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('--hue', type=float, default=205); ap.add_argument('--L', type=float, default=24); ap.add_argument('--C', type=float, default=19); ap.add_argument('items', nargs='+')
a = ap.parse_args()
BK = '.mw/specs/hud-real/regrade-backup'; os.makedirs(BK, exist_ok=True)
for item in a.items:
    path, _, geo = item.partition(':')
    bk = os.path.join(BK, 'unify__' + path.replace('/', '__'))
    if not os.path.exists(bk): shutil.copy(path, bk)
    im = np.array(Image.open(bk).convert('RGBA')); rgb = im[..., :3]; al = im[..., 3] > 200
    h, w = al.shape
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    lab0 = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    L0 = lab0[..., 0] * 100 / 255; A0 = lab0[..., 1] - 128; B0 = lab0[..., 2] - 128
    C0 = np.hypot(A0, B0); H0 = np.degrees(np.arctan2(B0, A0)) % 360
    # enamel only: dark-to-mid, low chroma, green-to-teal hue. Gems (bright / saturated) and ivy (yellow-green) stay as generated.
    m = al & (L0 < 36) & (C0 < 30) & (H0 > 140) & (H0 < 235) & (hsv[..., 1] > 30)
    prot = np.zeros((h, w), np.float32)
    if geo:
        g = json.load(open(geo)); k = w / g['w'] if 'w' in g else 2.0
        sx = w / g['w']; sy = h / g['h']
        for key in ('slots', 'field', 'window'):
            v = g.get(key)
            if v is None: continue
            for b in (v if isinstance(v, list) else [v]):
                x0, y0 = int(b['x'] * sx), int(b['y'] * sy); x1, y1 = int((b['x'] + b['w']) * sx), int((b['y'] + b['h']) * sy)
                prot[y0:y1, x0:x1] = 1
    prot = cv2.GaussianBlur(prot, (0, 0), 2.0)
    wgt = cv2.GaussianBlur(m.astype(np.float32), (5, 5), 1.2) * (1 - prot)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0] * 100 / 255; A = lab[..., 1] - 128; B = lab[..., 2] - 128
    ms = m & (prot < 0.5)
    if ms.sum() < 300: print('skip', path); continue
    mA, mB, mL = float(np.median(A[ms])), float(np.median(B[ms])), float(np.median(L[ms]))
    d = np.deg2rad(a.hue) - np.arctan2(mB, mA); cs = a.C / max(np.hypot(mA, mB), 1.0)
    cs = min(cs, 2.6)
    A2 = (A * np.cos(d) - B * np.sin(d)) * cs; B2 = (A * np.sin(d) + B * np.cos(d)) * cs
    g = np.clip(np.log(a.L / 100) / np.log(max(mL, 1.0) / 100), 0.45, 1.0)
    L2 = 100 * (np.clip(L, 0, 100) / 100) ** g
    out = np.dstack([L + (L2 - L) * wgt, A + (A2 - A) * wgt, B + (B2 - B) * wgt])
    out = np.dstack([out[..., 0] * 255 / 100, out[..., 1] + 128, out[..., 2] + 128]).clip(0, 255).astype(np.uint8)
    res = cv2.cvtColor(out, cv2.COLOR_LAB2RGB)
    Image.fromarray(np.dstack([res, im[..., 3]]), 'RGBA').save(path, 'WEBP', lossless=True, quality=100, method=6)
    print(path.split('hud-real/')[1].ljust(24), 'L %.1f->%.1f  hue %.0f->%.0f  C %.1f->%.1f  (g=%.2f, cs=%.2f)' % (mL, a.L, np.degrees(np.arctan2(mB, mA)) % 360, a.hue, np.hypot(mA, mB), a.C, g, cs))
