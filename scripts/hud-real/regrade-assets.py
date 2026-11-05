#!/usr/bin/env python3
"""PLAN-110 review fix #1: bring already exported pieces onto the shared gold/emerald targets (LINGUAGGIO-v2 §2).
Per piece: emerald lightness gamma + chroma gain toward (L p50 16, C p50 23); gold chroma gain toward C p50 41.
Soft masks as in build-roster-assets.grade. Originals are kept in .mw/specs/hud-real/regrade-backup/ (first run only).
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/regrade-assets.py asset.webp [...]
"""
import os, shutil, sys
import cv2
import numpy as np
from PIL import Image

T = {'green_L': 16.0, 'green_C': 23.0, 'gold_C': 41.0}
BACKUP = '.mw/specs/hud-real/regrade-backup'


def masks(rgb, al):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    soft = lambda m: cv2.GaussianBlur(m.astype(np.float32), (5, 5), 1.2)
    return (al & (h >= 10) & (h <= 32) & (s > 45) & (v > 60)), (al & (h >= 55) & (h <= 100) & (s > 40)), soft


def main():
    gold_only = '--gold-only' in sys.argv
    for path in [a for a in sys.argv[1:] if not a.startswith('--')]:
        os.makedirs(BACKUP, exist_ok=True)
        bk = os.path.join(BACKUP, path.replace('/', '__'))
        if not os.path.exists(bk):
            shutil.copy(path, bk)
        if gold_only:
            shutil.copy(bk, path)  # restart from the original export
        im = Image.open(bk).convert('RGBA')
        a = np.array(im); rgb = a[..., :3]; al = a[..., 3] > 200
        gold, green, soft = masks(rgb, al)
        lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
        L, A, B = lab[..., 0] * 100 / 255, lab[..., 1] - 128, lab[..., 2] - 128
        C = np.hypot(A, B)
        out = [path]
        gm, em = soft(gold), soft(green)
        if green.sum() > 500 and not gold_only:
            p50 = float(np.percentile(L[green], 50)); c50 = float(np.percentile(C[green], 50))
            g = np.log(T['green_L'] / 100) / np.log(max(p50, 1) / 100)
            g = float(np.clip(g, 0.6, 1.0))  # only lighten (gamma < 1 lifts), never darken more
            gain = float(np.clip(T['green_C'] / max(c50, 1), 1.0, 1.8))
            Ln = 100 * (L / 100) ** g
            L = L + (Ln - L) * em
            A = A + (A * gain - A) * em; B = B + (B * gain - B) * em
            out.append(f'emerald g={g:.2f} chroma x{gain:.2f}')
        if gold.sum() > 500:
            c50 = float(np.percentile(C[gold], 50))
            gain = float(np.clip(T['gold_C'] / max(c50, 1), 1.0, 1.3))
            A = A + (A * gain - A) * gm; B = B + (B * gain - B) * gm
            out.append(f'gold chroma x{gain:.2f}')
        res = np.dstack([L * 255 / 100, A + 128, B + 128]).clip(0, 255).astype(np.uint8)
        rgb2 = cv2.cvtColor(res, cv2.COLOR_LAB2RGB)
        Image.fromarray(np.dstack([rgb2, a[..., 3]]), 'RGBA').save(path, 'WEBP', lossless=True, quality=100, method=6)
        print(' | '.join(out))


if __name__ == '__main__':
    main()
